"""Synthesizes the promo soundtrack (music and effects) from the cue list that scene.html exports.

    python3 promo/audio.py cues.json out.wav

120 BPM, A minor (Am F C G, two seconds a bar). Everything is generated with numpy, nothing is sampled.
"""
import json
import sys

import numpy as np
from scipy import signal

SR = 44100
BEAT = 0.5
SEC = {'play': 2.0, 'combo': 7.3, 'bonus': 12.7, 'style': 16.3, 'numbers': 20.3, 'finale': 22.4}
cues = json.load(open(sys.argv[1]))
DUR = cues['dur'] + 0.6
N = int(DUR * SR)
out = np.zeros((N, 2))
rev = np.zeros((N, 2))
rng = np.random.default_rng(5)


def hz(semi_from_a4):
    return 440.0 * 2 ** (semi_from_a4 / 12)


def put(sig, t, gain=1.0, pan=0.0, send=0.0):
    i = int(t * SR)
    if i >= N or i < 0:
        return
    sig = sig[: N - i]
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    out[i:i + len(sig), 0] += sig * gain * l
    out[i:i + len(sig), 1] += sig * gain * r
    if send:
        rev[i:i + len(sig), 0] += sig * gain * l * send
        rev[i:i + len(sig), 1] += sig * gain * r * send


def tt(d):
    return np.arange(int(d * SR)) / SR


def lp(x, fc, order=2):
    b, a = signal.butter(order, fc / (SR / 2), 'low')
    return signal.lfilter(b, a, x)


def hp(x, fc, order=2):
    b, a = signal.butter(order, fc / (SR / 2), 'high')
    return signal.lfilter(b, a, x)


def bp(x, lo, hi, order=2):
    b, a = signal.butter(order, [lo / (SR / 2), hi / (SR / 2)], 'band')
    return signal.lfilter(b, a, x)


def saw(f, t):
    return 2 * ((f * t) % 1.0) - 1


def kick(strength=1.0):
    t = tt(0.32)
    f = 46 + 120 * np.exp(-t * 30)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t * 9)
    s += hp(rng.standard_normal(len(t)), 2000) * np.exp(-t * 400) * 0.25
    return s * strength


def hat(open_=False):
    t = tt(0.16 if open_ else 0.05)
    return hp(rng.standard_normal(len(t)), 7000, 4) * np.exp(-t * (30 if open_ else 110))


def clap():
    t = tt(0.26)
    n = bp(rng.standard_normal(len(t)), 900, 3800)
    e = np.exp(-t * 22)
    for d in (0.0, 0.009, 0.019):
        e += 0.8 * np.exp(-np.clip(t - d, 0, None) * 160) * (t >= d)
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 28) * 0.5
    return n * e * 0.55 + body


def pluck(f, d=0.22, bright=3500, decay=14, detune=0.004):
    t = tt(d)
    s = saw(f, t) + saw(f * (1 + detune), t) + 0.6 * np.sign(np.sin(2 * np.pi * f * t))
    s = lp(s, bright)
    return s * np.exp(-t * decay) * (1 - np.exp(-t * 900)) / 2.6


def bass(f, d=0.3):
    t = tt(d)
    s = saw(f, t) * 0.6 + np.sin(2 * np.pi * f * t)
    s = lp(s, 420)
    return s * np.exp(-t * 6) * (1 - np.exp(-t * 600))


def pad(freqs, d=2.1):
    t = tt(d)
    s = sum(saw(f, t) + saw(f * 1.006, t) for f in freqs)
    s = lp(s, 1300) / (2 * len(freqs))
    return s * np.minimum(1, t / 0.35) * np.minimum(1, (d - t) / 0.5)


def whoosh(d=0.4, f0=300, f1=4000, noise=1.0):
    t = tt(d)
    f = f0 * (f1 / f0) ** (t / d)
    ph = 2 * np.pi * np.cumsum(f) / SR
    n = bp(rng.standard_normal(len(t)), 600, 6000) * noise
    s = (np.sin(ph) * 0.5 + n * 0.6) * np.sin(np.pi * t / d) ** 2
    return s


def boom():
    t = tt(1.6)
    f = 38 + 90 * np.exp(-t * 14)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.4)
    s += lp(rng.standard_normal(len(t)), 5000) * np.exp(-t * 3.2) * 0.5
    return s


# chords per bar: Am F C G (semitones from A4)
CH = [[-12, -9, -5, 0], [-16, -12, -9, -4], [-9, -5, -2, 3], [-14, -10, -7, -2]]
ROOT = [-36, -40, -33, -38]  # A1 F1 C2 G1


def bar_of(t):
    return int((t - 2.0) // 2.0) % 4


# ---------------------------------------------------------------- hook
for i, tv in enumerate([c['v'] for c in cues['cues'] if c['k'] == 'slam']):
    thump = np.sin(2 * np.pi * np.cumsum(60 - 20 * i + 90 * np.exp(-tt(0.4) * 25)) / SR) * np.exp(-tt(0.4) * 8)
    put(thump, tv, 0.9)
    snap = hp(rng.standard_normal(int(0.25 * SR)), 1500) * np.exp(-tt(0.25) * 22)
    put(snap, tv, 0.35)
    t = tt(0.45)
    st = sum(saw(hz(s), t) for s in (-12 + 3 * i, -9 + 3 * i, -5 + 3 * i, 0 + 3 * i))
    put(lp(st, 3800) * np.exp(-t * 7) * 0.12, tv, 1.0, send=0.5)
# swell into the first slam
t = tt(0.45)
put(hp(rng.standard_normal(len(t)), 800) * (t / 0.45) ** 2 * 0.2, 0.0, 1.0)
put(np.sin(2 * np.pi * 55 * tt(2.0)) * np.minimum(1, tt(2.0) / 1.5) * 0.25, 0.0)

# ---------------------------------------------------------------- groove
t = 2.0
while t < 28.0:
    beat_i = int(round((t - 2.0) / BEAT))
    full = t >= SEC['combo']
    bar = bar_of(t)
    in_riser = SEC['numbers'] + 1.1 <= t < SEC['finale']
    put(kick(), t, 0.85)
    # 8th hats
    put(hat(), t + 0.25, 0.10 + (0.04 if full else 0))
    if full or t >= 4.0:
        put(hat(), t, 0.04)
    if full and beat_i % 2 == 1 and not in_riser:
        put(clap(), t, 0.30, send=0.12)
    # bass on 8ths
    for k in range(2):
        tn = t + k * 0.25
        if k == 1 and beat_i % 4 == 3:
            continue
        octave = 12 if (k == 1 and beat_i % 2 == 1) else 0
        put(bass(hz(ROOT[bar] + octave)), tn, 0.5 if k == 0 else 0.38)
    # arp on 16ths
    if t >= 4.0:
        ch = CH[bar]
        for k in range(4):
            idx = (beat_i * 4 + k) % 8
            note = ch[[0, 1, 2, 3, 2, 3, 1, 2][idx]] + (12 if (full and idx >= 4) else 12 if t >= SEC['finale'] else 0)
            lvl = 0.07 if t < SEC['combo'] else 0.10
            put(pluck(hz(note)), t + k * 0.125, lvl, pan=-0.35 if k % 2 == 0 else 0.35, send=0.25)
    t += BEAT

# pads on bar starts
for start in np.arange(2.0, 28.0, 2.0):
    if start >= SEC['style'] or start >= SEC['finale']:
        freqs = [hz(s) for s in CH[bar_of(start)]]
        put(pad(freqs), start, 0.10 if start < SEC['finale'] else 0.14, send=0.35)

# riser and snare roll into the finale
t0, t1 = SEC['numbers'] + 0.1, SEC['finale']
t = tt(t1 - t0)
r = hp(rng.standard_normal(len(t)), 500) * (t / (t1 - t0)) ** 2 * 0.35
sw = np.sin(2 * np.pi * np.cumsum(150 * (30 ** (t / (t1 - t0)))) / SR) * (t / (t1 - t0)) ** 2 * 0.15
put(r + sw, t0)
tr = SEC['numbers'] + 1.1
while tr < t1 - 0.02:
    gap = 0.125 if tr < t1 - 0.5 else 0.0625
    s = bp(rng.standard_normal(int(0.12 * SR)), 1200, 5000) * np.exp(-tt(0.12) * 30)
    put(s, tr, 0.12 + 0.3 * (tr - SEC['numbers'] - 1.1) / (t1 - SEC['numbers'] - 1.1))
    tr += gap

# finale impact
put(boom(), SEC['finale'], 0.9)
put(hp(rng.standard_normal(int(1.4 * SR)), 3000) * np.exp(-tt(1.4) * 4), SEC['finale'], 0.35, send=0.3)
for s in (-12, -9, -5, 0, 7):
    t = tt(1.6)
    put(lp(saw(hz(s), t) + saw(hz(s) * 1.005, t), 2600) * np.exp(-t * 2.5) * 0.06, SEC['finale'], 1.0, send=0.4)

# ---------------------------------------------------------------- effects
pent = [0, 3, 5, 7, 10]
last_break = -1
last_bounce = -1
bounce_n = 0
for c in sorted(cues['cues'], key=lambda c: c['v']):
    k, v = c['k'], c['v']
    if k == 'break':
        if v - last_break < 0.02:
            continue
        last_break = v
        n = min(c.get('n', 1), 60)
        semi = pent[n % 5] + 12 * (n // 5 % 4) - 12
        t = tt(0.16)
        s = np.sin(2 * np.pi * hz(semi + 12) * t) * np.exp(-t * 26) + 0.3 * np.sin(2 * np.pi * hz(semi + 24) * t) * np.exp(-t * 40)
        put(s, v, 0.12, pan=((n * 37) % 9 - 4) / 12, send=0.2)
    elif k == 'bounce':
        if v - last_bounce < 0.07:
            continue
        last_bounce = v
        s = hp(rng.standard_normal(int(0.02 * SR)), 2500) * np.exp(-tt(0.02) * 240)
        put(s, v, 0.05, pan=rng.uniform(-0.5, 0.5))
    elif k == 'combo':
        tier = c.get('n', 1)
        for j, semi in enumerate([12, 15, 19, 24, 27][: 2 + tier // 2 + 1]):
            t = tt(0.5)
            s = np.sin(2 * np.pi * hz(semi + 12) * t) * np.exp(-t * 6) + 0.25 * np.sin(2 * np.pi * hz(semi + 24) * t) * np.exp(-t * 9)
            put(s, v + j * 0.055, 0.13, send=0.5)
    elif k == 'stage':
        put(whoosh(0.5, 200, 2500), v - 0.3, 0.35, send=0.2)
        put(boom() * 0.5, v, 0.55)
    elif k == 'wipe':
        put(whoosh(0.4, 400, 5000), v - 0.05, 0.28)
    elif k == 'pop':
        n = c.get('n', 0)
        put(pluck(hz(pent[n] + 12 + 12), 0.4, 6000, 7), v, 0.22, send=0.45)
        put(kick(0.6)[: int(0.15 * SR)], v, 0.3)
    elif k == 'theme':
        put(whoosh(0.35, 500, 6000), v - 0.1, 0.25)
        for j, semi in enumerate([12, 19, 24]):
            put(pluck(hz(semi + 12), 0.3, 7000, 9), v + j * 0.06, 0.12, send=0.4)
    elif k == 'count':
        for j in range(14):
            t = tt(0.07)
            s = np.sin(2 * np.pi * hz(-5 + j) * t) * np.exp(-t * 40)
            put(s, v + j * 0.065, 0.18)
    elif k == 'hit':
        put(boom()[: int(0.9 * SR)] * 0.7, v, 0.5)
        put(pluck(hz(12), 0.5, 5000, 6), v, 0.2, send=0.4)
    elif k == 'badge':
        for j, semi in enumerate([0, 4, 7, 12, 16, 19, 24]):
            put(pluck(hz(semi + 12), 0.5, 8000, 5), v + j * 0.045, 0.14, pan=(j % 3 - 1) * 0.4, send=0.5)
        put(whoosh(0.5, 400, 7000), v - 0.25, 0.3)
        put(boom()[: int(0.8 * SR)] * 0.5, v, 0.5)

# ---------------------------------------------------------------- reverb, master
ir_t = tt(1.4)
ir = rng.standard_normal((len(ir_t), 2)) * np.exp(-ir_t * 3.2)[:, None]
ir[:, 0] = lp(ir[:, 0], 6000)
ir[:, 1] = lp(ir[:, 1], 6000)
wet = np.stack([signal.fftconvolve(rev[:, c], ir[:, c])[:N] for c in range(2)], axis=1)
mix = out + wet * 0.05

# gentle bus compression: duck the music a touch under the kick via soft clipping, then limit
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
fade_in = np.minimum(1, np.arange(N) / (0.02 * SR))
fade_out = np.clip((cues['dur'] + 0.1 - np.arange(N) / SR) / 0.45, 0, 1)
mix *= (fade_in * fade_out)[:, None]
mix /= max(1e-6, np.abs(mix).max()) / 0.89

import wave
pcm = (mix * 32767).astype('<i2')
with wave.open(sys.argv[2], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print('wrote', sys.argv[2], f'{DUR:.1f}s')
