"""Renders the Cascade promo: python3 promo/render.py --lang uk|en [--preview 0.6,1.0,...] [--out file.mp4]."""
import argparse, base64, json, os, subprocess, sys, time
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser()
ap.add_argument('--lang', default='uk')
ap.add_argument('--preview', default='')
ap.add_argument('--out', default='')
ap.add_argument('--cues', default='')
ap.add_argument('--port', type=int, default=8792)
ap.add_argument('--outdir', default='.')
a = ap.parse_args()

srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(a.port)], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={'width': 1000, 'height': 600}, device_scale_factor=2)
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: print('PAGEERROR', e, flush=True))
        pg.on('console', lambda m: print('console:', m.text, flush=True) if m.type in ('error', 'warning') else None)
        pg.goto(f'http://localhost:{a.port}/promo/scene.html?lang={a.lang}')
        pg.wait_for_function('window.__ready === true', timeout=30000)
        fps = 60
        if a.preview:
            for v in [float(x) for x in a.preview.split(',')]:
                data = pg.evaluate('i => window.renderFrame(i)', round(v * fps))
                path = os.path.join(a.outdir, f'{a.lang}_{v:05.2f}.jpg')
                open(path, 'wb').write(base64.b64decode(data))
                print(path, json.dumps(pg.evaluate('window.__info()')), flush=True)
        if a.out:
            n = int(28.5 * fps)
            ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', str(fps), '-c:v', 'mjpeg', '-i', '-',
                                   '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', str(fps), a.out], stdin=subprocess.PIPE)
            t0 = time.time()
            for i in range(n):
                ff.stdin.write(base64.b64decode(pg.evaluate('i => window.renderFrame(i)', i)))
                if i % 120 == 0:
                    print(f'frame {i}/{n} {time.time() - t0:.0f}s', flush=True)
            ff.stdin.close(); ff.wait()
        if a.cues:
            json.dump(pg.evaluate('window.getCues()'), open(a.cues, 'w'))
        b.close()
finally:
    srv.terminate()
