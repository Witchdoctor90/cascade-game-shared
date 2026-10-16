/*
 * A small playable slice of Cascade for the landing page: the game's palettes and block skins, a
 * ball-and-block physics loop, particles, combo banners, and a bot that plays while nobody touches it.
 * Colors, scoring and combo milestones mirror the Android app (GamePalette, Skins, Epic in Fx.kt).
 */
(() => {
  'use strict';

  const COLS = 7;
  const ROWS = 11; // row 0 stays empty, a block on the last row ends a real game
  const FLOOR = 0.6; // strip under the field for the ball counter
  const BALL_R = 0.13;
  const BALL_SPEED = 15; // cells per second
  const STEP = 1 / 120;
  const MILESTONES = [3, 5, 10, 15, 20, 30, 40, 50, 75, 100];

  // ---------------------------------------------------------------- colors

  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const rgba = (c, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const WHITE = [255, 255, 255];
  const BLACK = [0, 0, 0];

  const palette = (p) => {
    const out = {};
    for (const [key, value] of Object.entries(p)) out[key] = Array.isArray(value) ? value.map(hex) : hex(value);
    return out;
  };

  const GOLD = '#FFD54F';
  const GOLD_INNER = '#FFA000';

  /** The four themes of the in-game shop, values copied from GamePalette.kt. */
  const PALETTES = {
    neon: palette({
      background: '#110F1C', field: '#1A1730', fieldLine: '#3B3566', ball: '#FFFFFF',
      blockColors: ['#4FC3F7', '#7C4DFF', '#FF4081', '#FFAB40'], blockText: '#FFFFFF',
      itemBall: '#69F0AE', coin: GOLD, coinInner: GOLD_INNER, laser: '#FF5252', bomb: '#90A4AE',
      bombSpark: '#FF9100', hudText: '#ECE9FF', accent: '#7C4DFF', onAccent: '#FFFFFF', surface: '#221E3D',
    }),
    ocean: palette({
      background: '#06141F', field: '#0B2233', fieldLine: '#1E4A66', ball: '#E0F7FA',
      blockColors: ['#4DD0E1', '#42A5F5', '#5C6BC0', '#7E57C2'], blockText: '#FFFFFF',
      itemBall: '#64FFDA', coin: GOLD, coinInner: GOLD_INNER, laser: '#FF6E6E', bomb: '#90A4AE',
      bombSpark: '#FFAB40', hudText: '#E0F7FA', accent: '#29B6F6', onAccent: '#00141F', surface: '#12304A',
    }),
    sunset: palette({
      background: '#1A0E14', field: '#2A1520', fieldLine: '#5A2E40', ball: '#FFF3E0',
      blockColors: ['#FFB74D', '#FF8A65', '#F0507A', '#B0185A'], blockText: '#FFFFFF',
      itemBall: '#B9F6CA', coin: GOLD, coinInner: GOLD_INNER, laser: '#FF1744', bomb: '#BCAAA4',
      bombSpark: '#FFEA00', hudText: '#FFEDE5', accent: '#FF7043', onAccent: '#2A0A00', surface: '#3A1E2C',
    }),
    matrix: palette({
      background: '#030A05', field: '#07140B', fieldLine: '#1B4D2A', ball: '#E8FFE8',
      blockColors: ['#00C853', '#64DD17', '#AEEA00', '#FFEA00'], blockText: '#04200E',
      itemBall: '#18FFFF', coin: GOLD, coinInner: GOLD_INNER, laser: '#FF5252', bomb: '#80CBC4',
      bombSpark: '#FF9100', hudText: '#D7FFD9', accent: '#00E676', onAccent: '#00210B', surface: '#0E2416',
    }),
  };

  const blockColor = (pal, t) => {
    const list = pal.blockColors;
    const pos = Math.min(Math.max(t, 0), 1) * (list.length - 1);
    const i = Math.min(Math.floor(pos), list.length - 2);
    return mix(list[i], list[i + 1], pos - i);
  };

  // ---------------------------------------------------------------- block skins

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /** Block looks from the shop: each one draws a block of size w × h at x, y. */
  const SKINS = {
    rounded(ctx, x, y, w, h, c) {
      roundRect(ctx, x, y, w, h, Math.min(w, h) * 0.16);
      ctx.fillStyle = rgba(c);
      ctx.fill();
    },
    sharp(ctx, x, y, w, h, c) {
      ctx.fillStyle = rgba(c);
      ctx.fillRect(x, y, w, h);
    },
    outline(ctx, x, y, w, h, c) {
      const m = Math.min(w, h);
      const line = m * 0.08;
      roundRect(ctx, x, y, w, h, m * 0.14);
      ctx.fillStyle = rgba(c, 0.18);
      ctx.fill();
      roundRect(ctx, x + line / 2, y + line / 2, w - line, h - line, m * 0.14);
      ctx.strokeStyle = rgba(c);
      ctx.lineWidth = line;
      ctx.stroke();
    },
    gem(ctx, x, y, w, h, c) {
      const m = Math.min(w, h);
      const bevel = m * 0.14;
      ctx.fillStyle = rgba(mix(c, BLACK, 0.35));
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = rgba(mix(c, WHITE, 0.35));
      ctx.fillRect(x, y, w, bevel);
      ctx.fillStyle = rgba(c);
      ctx.fillRect(x + bevel, y + bevel, w - 2 * bevel, h - 2 * bevel);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.arc(x + bevel * 2, y + bevel * 2, m * 0.06, 0, Math.PI * 2);
      ctx.fill();
    },
    bubble(ctx, x, y, w, h, c) {
      const m = Math.min(w, h);
      roundRect(ctx, x, y, w, h, m * 0.45);
      ctx.fillStyle = rgba(c);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath();
      ctx.ellipse(x + m * 0.34, y + m * 0.22, m * 0.16, m * 0.09, 0, 0, Math.PI * 2);
      ctx.fill();
    },
  };

  // ---------------------------------------------------------------- combo and score tiers

  const EPIC_COLORS = ['#FFFFFF', '#4DD0E1', '#C6FF00', '#FFAB00', '#FF4081', '#FFD740'].map(hex);
  const epicColor = (tier, time) =>
    tier >= 5 ? hslToRgb(((time * 160) % 360) / 360, 0.65, 0.68) : EPIC_COLORS[Math.max(0, tier)];
  const tierForPoints = (p) => (p < 20 ? 0 : p < 50 ? 1 : p < 100 ? 2 : p < 200 ? 3 : p < 400 ? 4 : 5);
  const tierForCombo = (n) => (n < 3 ? 0 : n < 5 ? 1 : n < 10 ? 2 : n < 15 ? 3 : n < 20 ? 4 : 5);

  const SCORE_THRESHOLDS = [0, 1000, 5000, 15000, 40000, 100000, 250000, 600000, 1500000];
  const SCORE_COLORS = ['#A9C8DA', '#80DEEA', '#69F0AE', '#EEFF41', '#FFC400', '#FF6E40', '#FF4081', '#E040FB'];
  const scoreTier = (score) => {
    let tier = 0;
    while (tier < SCORE_THRESHOLDS.length - 1 && score >= SCORE_THRESHOLDS[tier + 1]) tier++;
    return tier;
  };
  /** CSS color of the score at [score]; the top tier is a moving rainbow. */
  const scoreColor = (score, time = 0) => {
    const tier = scoreTier(score);
    return tier >= SCORE_THRESHOLDS.length - 1
      ? `hsl(${Math.round((time * 140) % 360)} 60% 68%)`
      : SCORE_COLORS[tier];
  };

  function hslToRgb(h, s, l) {
    const f = (n) => {
      const k = (n + h * 12) % 12;
      const a = s * Math.min(l, 1 - l);
      return (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255;
    };
    return [f(0), f(8), f(4)];
  }

  // ---------------------------------------------------------------- small helpers

  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
  const rand = (a, b) => a + Math.random() * (b - a);
  const randInt = (a, b) => Math.floor(rand(a, b + 1));
  const easeOutBack = (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);

  function shuffle(list) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }

  // ---------------------------------------------------------------- the game

  /**
   * Starts a game on [canvas]. Options:
   *   reduceMotion  no bot, no shake, instant field
   *   onEvent(type, data)  'hit' | 'break' | 'bounce' | 'combo' | 'score'
   *   bannerText(tier, count) -> { title, sub }
   */
  function createGame(canvas, options = {}) {
    const ctx = canvas.getContext('2d');
    const reduce = !!options.reduceMotion;
    const emit = options.onEvent || (() => {});
    const bannerText = options.bannerText || ((tier, count) => ({ title: `Combo ${tier}`, sub: String(count) }));

    let pal = PALETTES.neon;
    let skin = 'rounded';
    let scale = 1; // device pixels per cell

    const st = {
      time: 0,
      turn: 1,
      score: 0,
      ballCount: 6,
      launchX: COLS / 2,
      angle: Math.PI / 2,
      phase: 'intro', // intro | ready | firing | settle
      bricks: [],
      balls: [],
      toLaunch: 0,
      launchTimer: 0,
      landedFirst: null,
      collected: 0,
      combo: 0,
      turnTime: 0,
      readyTime: 0,
      settleTime: 0,
      lastUser: -1e9,
      botAngle: Math.PI / 2,
      shake: 0,
      banner: null,
      popups: [],
      beams: [],
      rings: [],
      particles: [],
    };

    const brick = (c, row, kind, hp, y) => ({ c, row, y, vy: 0, kind, hp, max: hp, flash: 0, delay: 0, dead: false });

    function makeRow(row, startY) {
      const out = [];
      const free = [];
      const hpBase = 2 + Math.floor(st.turn / 3);
      for (let c = 0; c < COLS; c++) {
        if (Math.random() < 0.7) {
          let hp = Math.max(1, hpBase + randInt(-1, 2));
          if (Math.random() < 0.16) hp *= 2;
          out.push(brick(c, row, 'brick', hp, startY));
        } else {
          free.push(c);
        }
      }
      while (out.length < 2 && free.length) out.push(brick(free.pop(), row, 'brick', hpBase, startY));
      shuffle(free);
      if (free.length && Math.random() < 0.8) out.push(brick(free.pop(), row, 'ball', 0, startY));
      for (const c of free) {
        const r = Math.random();
        const kind = r < 0.2 ? 'coin' : r < 0.27 ? 'laser' : r < 0.32 ? 'bomb' : null;
        if (kind) out.push(brick(c, row, kind, 0, startY));
      }
      return out;
    }

    function buildIntro() {
      st.bricks = [];
      for (let row = 5; row >= 1; row--) {
        for (const b of makeRow(row, reduce ? row : -3)) {
          b.delay = reduce ? 0 : (5 - row) * 0.15 + 0.25;
          st.bricks.push(b);
        }
      }
      st.phase = 'intro';
    }

    // ---- effects

    function spark(x, y, color, n, speed, life, square = true) {
      if (reduce) n = Math.ceil(n / 3);
      for (let i = 0; i < n && st.particles.length < 700; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = rand(0.3, 1) * speed;
        st.particles.push({
          x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - speed * 0.25,
          life: rand(0.6, 1) * life, age: 0, r: rand(0.04, 0.1), color, square,
        });
      }
    }

    function shake(amount) {
      if (!reduce) st.shake = Math.min(1, st.shake + amount);
    }

    function showBanner(tier, count) {
      const text = bannerText(tier, count);
      st.banner = { title: text.title, sub: text.sub, tier, age: 0 };
    }

    // ---- rules

    function cellColor(b) {
      const cap = Math.max(6, 3 * (1 + Math.floor(st.turn / 2)));
      return blockColor(pal, b.hp / cap);
    }

    function destroy(b) {
      if (b.dead) return;
      b.dead = true;
      st.combo++;
      const points = 10 * Math.min(st.combo, 100);
      st.score += points;
      const tier = tierForPoints(points);
      const color = cellColor(b);
      spark(b.c + 0.5, b.row + 0.5, color, 9, 4.5, 0.55);
      if (tier > 0) spark(b.c + 0.5, b.row + 0.5, epicColor(tier, st.time), tier * 3, 3, 0.7, false);
      st.popups.push({ x: b.c + 0.5, y: b.row + 0.35, text: `+${points}`, tier, age: 0 });
      if (st.popups.length > 14) st.popups.shift();
      shake(0.05 + tier * 0.02);
      emit('break', { combo: st.combo, points });
      emit('score', st.score);
      if (MILESTONES.includes(st.combo)) {
        const t = tierForCombo(st.combo);
        showBanner(t, st.combo);
        shake(0.12 + t * 0.1);
        spark(COLS / 2, 3, epicColor(t, st.time), 10 + t * 8, 5, 0.9, false);
        emit('combo', { count: st.combo, tier: t });
      }
    }

    function damage(b, n) {
      if (b.dead || b.kind !== 'brick') return;
      b.hp -= n;
      b.flash = 1;
      if (b.hp <= 0) destroy(b);
    }

    function collect(b) {
      b.dead = true;
      const cx = b.c + 0.5;
      const cy = b.row + 0.5;
      if (b.kind === 'ball') {
        st.collected++;
        spark(cx, cy, pal.itemBall, 8, 3, 0.5, false);
      } else if (b.kind === 'coin') {
        spark(cx, cy, pal.coin, 8, 3, 0.5, false);
      } else if (b.kind === 'laser') {
        st.beams.push({ row: b.row, age: 0 });
        for (const o of st.bricks) if (o.row === b.row) damage(o, 1);
        spark(cx, cy, pal.laser, 14, 5, 0.5, false);
        shake(0.15);
      } else if (b.kind === 'bomb') {
        st.rings.push({ x: cx, y: cy, age: 0 });
        const dmg = Math.max(1, Math.round(st.turn * 0.75));
        for (const o of st.bricks) {
          if (Math.abs(o.c - b.c) <= 1 && Math.abs(o.row - b.row) <= 1) damage(o, dmg);
        }
        spark(cx, cy, pal.bombSpark, 18, 5, 0.6);
        shake(0.35);
      }
    }

    function fixAngle(ball) {
      const speed = Math.hypot(ball.vx, ball.vy);
      const minVy = speed * 0.14;
      if (Math.abs(ball.vy) < minVy) {
        ball.vy = (ball.vy < 0 ? -1 : 1) * minVy;
        ball.vx = (ball.vx < 0 ? -1 : 1) * Math.sqrt(speed * speed - minVy * minVy);
      }
    }

    function stepBall(ball, dt) {
      ball.px = ball.x;
      ball.py = ball.y;
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      let bounced = false;
      if (ball.x < BALL_R) { ball.x = BALL_R; ball.vx = Math.abs(ball.vx); bounced = true; }
      else if (ball.x > COLS - BALL_R) { ball.x = COLS - BALL_R; ball.vx = -Math.abs(ball.vx); bounced = true; }
      if (ball.y < BALL_R) { ball.y = BALL_R; ball.vy = Math.abs(ball.vy); bounced = true; }
      if (bounced) {
        fixAngle(ball);
        emit('bounce');
      }

      for (const b of st.bricks) {
        if (b.dead) continue;
        if (b.kind !== 'brick') {
          const dx = ball.x - (b.c + 0.5);
          const dy = ball.y - (b.row + 0.5);
          if (dx * dx + dy * dy < 0.2) collect(b);
          continue;
        }
        const rx = b.c + 0.04;
        const ry = b.row + 0.04;
        const rw = 0.92;
        const nearX = clamp(ball.x, rx, rx + rw);
        const nearY = clamp(ball.y, ry, ry + rw);
        let dx = ball.x - nearX;
        let dy = ball.y - nearY;
        const d2 = dx * dx + dy * dy;
        if (d2 >= BALL_R * BALL_R) continue;
        let nx;
        let ny;
        let push;
        if (d2 > 1e-9) {
          const d = Math.sqrt(d2);
          nx = dx / d;
          ny = dy / d;
          push = BALL_R - d;
        } else {
          // Centre inside the block: leave through the nearest side.
          const left = ball.x - rx;
          const right = rx + rw - ball.x;
          const top = ball.y - ry;
          const bottom = ry + rw - ball.y;
          const m = Math.min(left, right, top, bottom);
          nx = m === left ? -1 : m === right ? 1 : 0;
          ny = m === top ? -1 : m === bottom ? 1 : 0;
          push = m + BALL_R;
        }
        const dot = ball.vx * nx + ball.vy * ny;
        if (dot < 0) {
          ball.vx -= 2 * dot * nx;
          ball.vy -= 2 * dot * ny;
        }
        ball.x += nx * (push + 0.001);
        ball.y += ny * (push + 0.001);
        fixAngle(ball);
        b.hp--;
        b.flash = 1;
        emit('hit');
        if (b.hp <= 0) destroy(b);
      }

      if (ball.vy > 0 && ball.y >= ROWS - BALL_R) {
        ball.gone = true;
        if (st.landedFirst === null) st.landedFirst = ball.x;
        spark(ball.x, ROWS - 0.05, pal.ball, 3, 1.6, 0.3, false);
      }
    }

    function fire(angle) {
      if (st.phase !== 'ready') return false;
      if (typeof angle === 'number') st.angle = angle;
      st.phase = 'firing';
      st.toLaunch = st.ballCount;
      st.launchTimer = 0;
      st.landedFirst = null;
      st.collected = 0;
      st.combo = 0;
      st.turnTime = 0;
      return true;
    }

    function endTurn() {
      st.launchX = clamp(st.landedFirst ?? st.launchX, 0.5, COLS - 0.5);
      st.ballCount += st.collected;
      st.bricks = st.bricks.filter((b) => !b.dead);
      st.turn++;
      for (const b of st.bricks) b.row++;
      st.bricks.push(...makeRow(1, -0.8));

      // Items that reach the last row are picked up by themselves, as in the game.
      for (const b of st.bricks) {
        if (b.kind === 'ball' && b.row >= ROWS - 1) { st.ballCount++; b.dead = true; }
        else if (b.kind !== 'brick' && b.row >= ROWS - 1) b.dead = true;
      }

      // A real game ends here; the demo plays the "continue" reward instead and clears the bottom rows.
      if (st.bricks.some((b) => !b.dead && b.kind === 'brick' && b.row >= ROWS - 1)) {
        for (const b of st.bricks) {
          if (b.row >= ROWS - 3 && !b.dead) {
            b.dead = true;
            spark(b.c + 0.5, b.row + 0.5, b.kind === 'brick' ? cellColor(b) : pal.accent, 6, 4, 0.6);
          }
        }
        shake(0.5);
      }
      st.bricks = st.bricks.filter((b) => !b.dead);
      st.phase = 'settle';
      st.settleTime = 0;
    }

    function pickBotAngle() {
      let target = null;
      for (const b of st.bricks) {
        if (b.kind !== 'brick' || b.dead) continue;
        if (!target || b.row > target.row || (b.row === target.row && Math.random() < 0.4)) target = b;
      }
      const fromX = st.launchX;
      const fromY = ROWS - BALL_R;
      let angle = target ? Math.atan2(fromY - (target.row + 0.5), target.c + 0.5 - fromX) : Math.PI / 2;
      angle += rand(-0.07, 0.07);
      st.botAngle = clamp(angle, 0.2, Math.PI - 0.2);
    }

    // ---- update

    function update(dt) {
      st.time += dt;
      const userRecent = st.time - st.lastUser < 6;

      // Bricks fall with a little spring, like the rows in the game.
      let moving = false;
      for (const b of st.bricks) {
        if (b.delay > 0) { b.delay -= dt; moving = true; continue; }
        if (reduce) { b.y = b.row; b.vy = 0; continue; }
        const k = 170;
        const damping = 2 * Math.sqrt(k) * 0.6;
        b.vy += ((b.row - b.y) * k - b.vy * damping) * dt;
        b.y += b.vy * dt;
        if (Math.abs(b.row - b.y) > 0.01 || Math.abs(b.vy) > 0.05) moving = true;
        b.flash = Math.max(0, b.flash - dt * 6);
      }

      if (st.phase === 'intro' && !moving) {
        st.phase = 'ready';
        st.readyTime = 0;
        pickBotAngle();
      }

      if (st.phase === 'settle') {
        st.settleTime += dt;
        if (!moving || st.settleTime > 1.2) {
          st.phase = 'ready';
          st.readyTime = 0;
          pickBotAngle();
          for (const b of st.bricks) { b.y = b.row; b.vy = 0; }
        }
      }

      if (st.phase === 'ready') {
        st.readyTime += dt;
        if (!reduce && !userRecent && st.readyTime > 0.9) fire(st.botAngle);
      }

      if (st.phase === 'firing') {
        st.turnTime += dt;
        const speedUp = st.turnTime > 14 ? 3 : st.turnTime > 7 ? 2 : 1;
        st.launchTimer -= dt;
        while (st.toLaunch > 0 && st.launchTimer <= 0) {
          st.balls.push({
            x: st.launchX, y: ROWS - BALL_R, px: st.launchX, py: ROWS - BALL_R,
            vx: Math.cos(st.angle) * BALL_SPEED, vy: -Math.sin(st.angle) * BALL_SPEED, gone: false,
          });
          st.toLaunch--;
          st.launchTimer += 0.065;
        }
        for (const ball of st.balls) stepBall(ball, dt * speedUp);
        st.balls = st.balls.filter((b) => !b.gone);
        st.bricks = st.bricks.filter((b) => !b.dead);
        if (st.toLaunch === 0 && st.balls.length === 0) endTurn();
      }

      // particles, popups, banner
      for (const p of st.particles) {
        p.age += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 14 * dt;
      }
      st.particles = st.particles.filter((p) => p.age < p.life);
      for (const p of st.popups) p.age += dt;
      st.popups = st.popups.filter((p) => p.age < 0.9);
      for (const b of st.beams) b.age += dt;
      st.beams = st.beams.filter((b) => b.age < 0.35);
      for (const r of st.rings) r.age += dt;
      st.rings = st.rings.filter((r) => r.age < 0.45);
      if (st.banner) {
        st.banner.age += dt;
        if (st.banner.age > 1.5) st.banner = null;
      }
      st.shake = Math.max(0, st.shake - dt * 1.8);
    }

    // ---- drawing

    function drawItem(b, y) {
      const cx = b.c + 0.5;
      const cy = y + 0.5;
      const t = st.time;
      ctx.save();
      if (b.kind === 'ball') {
        ctx.strokeStyle = rgba(pal.itemBall);
        ctx.lineWidth = 0.07;
        ctx.shadowColor = rgba(pal.itemBall, 0.8);
        ctx.shadowBlur = scale * 0.3;
        ctx.beginPath();
        ctx.arc(cx, cy, 0.27 + Math.sin(t * 3 + b.c) * 0.02, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = rgba(pal.itemBall);
        ctx.beginPath();
        ctx.arc(cx, cy, 0.09, 0, Math.PI * 2);
        ctx.fill();
      } else if (b.kind === 'coin') {
        const w = Math.abs(Math.cos(t * 2 + b.c)) * 0.2 + 0.08;
        ctx.shadowColor = rgba(pal.coin, 0.7);
        ctx.shadowBlur = scale * 0.25;
        ctx.fillStyle = rgba(pal.coin);
        ctx.beginPath();
        ctx.ellipse(cx, cy, w + 0.1, 0.27, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = rgba(pal.coinInner);
        ctx.beginPath();
        ctx.ellipse(cx, cy, w * 0.6 + 0.04, 0.17, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (b.kind === 'laser') {
        ctx.strokeStyle = rgba(pal.laser);
        ctx.lineWidth = 0.07;
        ctx.lineCap = 'round';
        ctx.shadowColor = rgba(pal.laser, 0.9);
        ctx.shadowBlur = scale * 0.3;
        ctx.beginPath();
        ctx.moveTo(cx - 0.3, cy);
        ctx.lineTo(cx + 0.3, cy);
        ctx.moveTo(cx - 0.3, cy);
        ctx.lineTo(cx - 0.18, cy - 0.1);
        ctx.moveTo(cx - 0.3, cy);
        ctx.lineTo(cx - 0.18, cy + 0.1);
        ctx.moveTo(cx + 0.3, cy);
        ctx.lineTo(cx + 0.18, cy - 0.1);
        ctx.moveTo(cx + 0.3, cy);
        ctx.lineTo(cx + 0.18, cy + 0.1);
        ctx.stroke();
      } else if (b.kind === 'bomb') {
        ctx.fillStyle = rgba(pal.bomb);
        ctx.beginPath();
        ctx.arc(cx, cy + 0.04, 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = rgba(pal.bombSpark, 0.9);
        ctx.shadowBlur = scale * 0.25;
        ctx.fillStyle = rgba(pal.bombSpark, 0.6 + Math.sin(t * 12 + b.c) * 0.4);
        ctx.beginPath();
        ctx.arc(cx + 0.14, cy - 0.2, 0.06, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    function drawAim() {
      const angle = st.time - st.lastUser < 6 ? st.angle : st.botAngle;
      let x = st.launchX;
      let y = ROWS - BALL_R;
      let dx = Math.cos(angle);
      let dy = -Math.sin(angle);
      ctx.save();
      ctx.setLineDash([0.12, 0.2]);
      ctx.lineCap = 'round';
      ctx.lineWidth = 0.06;
      ctx.strokeStyle = rgba(pal.ball, 0.7);
      ctx.beginPath();
      ctx.moveTo(x, y);
      let budget = 16;
      let bounces = 0;
      while (budget > 0 && bounces < 3) {
        let step = 0;
        let hit = false;
        while (step < budget) {
          x += dx * 0.05;
          y += dy * 0.05;
          step += 0.05;
          if (x < BALL_R || x > COLS - BALL_R || y < BALL_R) break;
          if (st.bricks.some((b) => b.kind === 'brick' && !b.dead && x > b.c && x < b.c + 1 && y > b.row && y < b.row + 1)) {
            hit = true;
            break;
          }
        }
        ctx.lineTo(x, y);
        budget -= step;
        if (hit) break;
        if (x < BALL_R || x > COLS - BALL_R) dx = -dx;
        if (y < BALL_R) dy = -dy;
        bounces++;
      }
      ctx.stroke();
      ctx.restore();
    }

    function draw() {
      const w = canvas.width;
      const h = canvas.height;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w, h);
      scale = w / COLS;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);

      const trauma = st.shake * st.shake;
      if (trauma > 0) ctx.translate((Math.random() - 0.5) * trauma * 0.35, (Math.random() - 0.5) * trauma * 0.35);

      // field
      roundRect(ctx, 0, 0, COLS, ROWS + FLOOR, 0.3);
      ctx.fillStyle = rgba(pal.field);
      ctx.fill();
      ctx.save();
      roundRect(ctx, 0, 0, COLS, ROWS + FLOOR, 0.3);
      ctx.clip();
      ctx.strokeStyle = rgba(pal.fieldLine, 0.4);
      ctx.lineWidth = 0.02;
      ctx.beginPath();
      for (let x = 1; x < COLS; x++) { ctx.moveTo(x, 0); ctx.lineTo(x, ROWS + FLOOR); }
      for (let y = 1; y <= ROWS; y++) { ctx.moveTo(0, y); ctx.lineTo(COLS, y); }
      ctx.stroke();

      // The last two rows are the danger zone: a red line and pulsing outlines, as in the game.
      const danger = st.bricks.some((b) => b.kind === 'brick' && !b.dead && b.row >= ROWS - 2);
      const pulse = 0.5 + Math.sin(st.time * 6) * 0.5;
      ctx.strokeStyle = danger ? `rgba(255,82,82,${0.45 + pulse * 0.4})` : 'rgba(255,82,82,0.28)';
      ctx.lineWidth = 0.04;
      ctx.beginPath();
      ctx.moveTo(0, ROWS - 1);
      ctx.lineTo(COLS, ROWS - 1);
      ctx.stroke();
      ctx.strokeStyle = rgba(pal.fieldLine, 0.9);
      ctx.beginPath();
      ctx.moveTo(0, ROWS);
      ctx.lineTo(COLS, ROWS);
      ctx.stroke();

      // blocks
      const draw1 = SKINS[skin] || SKINS.rounded;
      for (const b of st.bricks) {
        if (b.dead || b.y < -1) continue;
        if (b.kind !== 'brick') { drawItem(b, b.y); continue; }
        const color = mix(cellColor(b), WHITE, b.flash * 0.55);
        const pad = 0.06 - b.flash * 0.02;
        ctx.save();
        ctx.shadowColor = rgba(color, 0.55);
        ctx.shadowBlur = scale * 0.3;
        draw1(ctx, b.c + pad, b.y + pad, 1 - pad * 2, 1 - pad * 2, color);
        ctx.restore();
        if (danger && b.row >= ROWS - 2) {
          roundRect(ctx, b.c + 0.04, b.y + 0.04, 0.92, 0.92, 0.14);
          ctx.strokeStyle = `rgba(255,82,82,${0.4 + pulse * 0.5})`;
          ctx.lineWidth = 0.05;
          ctx.stroke();
        }
        ctx.fillStyle = rgba(pal.blockText);
        ctx.font = '700 0.36px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(Math.max(0, b.hp)), b.c + 0.5, b.y + 0.53);
      }

      // laser beams and bomb rings
      for (const beam of st.beams) {
        const a = 1 - beam.age / 0.35;
        const grad = ctx.createLinearGradient(0, 0, COLS, 0);
        grad.addColorStop(0, rgba(pal.laser, 0));
        grad.addColorStop(0.5, rgba(pal.laser, a));
        grad.addColorStop(1, rgba(pal.laser, 0));
        ctx.fillStyle = grad;
        ctx.fillRect(0, beam.row + 0.5 - 0.07 * a, COLS, 0.14 * a);
      }
      for (const r of st.rings) {
        const k = r.age / 0.45;
        ctx.strokeStyle = rgba(pal.bombSpark, 1 - k);
        ctx.lineWidth = 0.08 * (1 - k);
        ctx.beginPath();
        ctx.arc(r.x, r.y, 0.4 + k * 1.6, 0, Math.PI * 2);
        ctx.stroke();
      }

      // particles
      for (const p of st.particles) {
        const a = 1 - p.age / p.life;
        ctx.fillStyle = rgba(p.color, a);
        if (p.square) ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
        else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); }
      }

      // launch ball, counter, aim
      if (st.phase === 'ready') drawAim();
      const restingBalls = st.phase === 'firing' ? st.toLaunch : st.ballCount;
      if (restingBalls > 0 || st.phase !== 'firing') {
        ctx.save();
        ctx.shadowColor = rgba(pal.ball, 0.9);
        ctx.shadowBlur = scale * 0.35;
        ctx.fillStyle = rgba(pal.ball);
        ctx.beginPath();
        ctx.arc(st.launchX, ROWS - BALL_R, BALL_R, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = rgba(pal.hudText, 0.75);
      ctx.font = '700 0.3px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`x${restingBalls}`, clamp(st.launchX, 0.6, COLS - 0.6), ROWS + FLOOR / 2 + 0.02);

      // flying balls
      ctx.save();
      ctx.shadowColor = rgba(pal.ball, 0.9);
      ctx.shadowBlur = scale * 0.35;
      for (const ball of st.balls) {
        ctx.strokeStyle = rgba(pal.ball, 0.3);
        ctx.lineWidth = BALL_R * 1.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ball.x - ball.vx * 0.012, ball.y - ball.vy * 0.012);
        ctx.lineTo(ball.x, ball.y);
        ctx.stroke();
        ctx.fillStyle = rgba(pal.ball);
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // popups
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const p of st.popups) {
        const k = p.age / 0.9;
        ctx.fillStyle = rgba(epicColor(p.tier, st.time), 1 - k * k);
        ctx.font = `800 ${0.34 + p.tier * 0.03}px "JetBrains Mono", monospace`;
        ctx.fillText(p.text, p.x, p.y - k * 0.8);
      }

      // combo banner
      if (st.banner) {
        const bn = st.banner;
        const pop = bn.age < 0.18 ? easeOutBack(bn.age / 0.18) : 1;
        const alpha = bn.age > 1.1 ? 1 - (bn.age - 1.1) / 0.4 : 1;
        const color = epicColor(bn.tier, st.time);
        ctx.save();
        ctx.translate(COLS / 2, 2.4);
        ctx.scale(pop, pop);
        ctx.globalAlpha = Math.max(0, alpha);
        roundRect(ctx, -2.7, -0.5, 5.4, 1.35, 0.3);
        ctx.fillStyle = rgba(pal.field, 0.82);
        ctx.fill();
        ctx.shadowColor = rgba(color, 0.9);
        ctx.shadowBlur = scale * 0.5;
        ctx.fillStyle = rgba(color);
        ctx.font = `800 ${0.62 + bn.tier * 0.05}px Inter, system-ui, sans-serif`;
        ctx.fillText(bn.title, 0, 0);
        ctx.shadowBlur = 0;
        ctx.fillStyle = rgba(pal.hudText, 0.9);
        ctx.font = '600 0.28px Inter, system-ui, sans-serif';
        ctx.fillText(bn.sub, 0, 0.6);
        ctx.restore();
      }
      ctx.restore();
    }

    // ---- loop

    let acc = 0;
    let last = 0;
    let raf = 0;
    let running = false;

    function frame(ts) {
      if (!running) return;
      const dt = Math.min(0.05, (ts - last) / 1000 || 0);
      last = ts;
      acc += dt;
      let n = 0;
      while (acc >= STEP && n < 8) { update(STEP); acc -= STEP; n++; }
      if (n === 8) acc = 0;
      draw();
      raf = requestAnimationFrame(frame);
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssWidth = canvas.clientWidth || 300;
      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round((cssWidth * dpr * (ROWS + FLOOR)) / COLS);
      draw();
    }

    // ---- input

    function angleFor(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * COLS;
      const y = ((clientY - rect.top) / rect.height) * (ROWS + FLOOR);
      const dy = Math.max(0.35, ROWS - BALL_R - y);
      return clamp(Math.atan2(dy, x - st.launchX), 0.2, Math.PI - 0.2);
    }

    const api = {
      setPalette(name) { pal = PALETTES[name] || PALETTES.neon; if (!running) draw(); },
      setSkin(name) { if (SKINS[name]) skin = name; if (!running) draw(); },
      /** Points the aim at a screen position (mouse hover). */
      aimAt(clientX, clientY) {
        if (st.phase !== 'ready' && st.phase !== 'settle') return;
        st.angle = angleFor(clientX, clientY);
        st.lastUser = st.time;
      },
      /** Fires at a screen position, or along the current aim when called without arguments. */
      shoot(clientX, clientY) {
        if (st.phase !== 'ready') return false;
        if (typeof clientX === 'number') st.angle = angleFor(clientX, clientY);
        else if (st.time - st.lastUser >= 6) st.angle = st.botAngle;
        st.lastUser = st.time;
        return fire();
      },
      nudge(delta) {
        if (st.time - st.lastUser >= 6) st.angle = st.botAngle;
        st.angle = clamp(st.angle + delta, 0.2, Math.PI - 0.2);
        st.lastUser = st.time;
      },
      start() {
        if (running) return;
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      },
      stop() { running = false; cancelAnimationFrame(raf); },
      get score() { return st.score; },
      get time() { return st.time; },
    };

    buildIntro();
    resize();
    if (typeof ResizeObserver === 'function') new ResizeObserver(resize).observe(canvas);
    else window.addEventListener('resize', resize);
    api._state = st;
    api._step = update;
    api._draw = draw;
    return api;
  }

  window.Cascade = {
    COLS, ROWS, PALETTES, SKINS, MILESTONES,
    createGame, blockColor, rgba, mix, roundRect,
    tierForCombo, scoreTier, scoreColor, epicColor,
  };
})();
