/* Page glue: language, theme and block-skin switching, the demo game, the combo slider, bonus animations. */
(() => {
  'use strict';

  const C = window.Cascade;
  if (!C) return;

  const $ = (sel, scope = document) => scope.querySelector(sel);
  const $$ = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const store = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch { /* storage can be blocked */ } },
  };

  // ------------------------------------------------------------------ text

  const I18N = {
    uk: {
      'meta.title': 'Cascade: Ламай і відбивай',
      'meta.desc': 'Неонова аркада для Android: цілься, запускай кульки, ламай блоки й збирай комбо. 1500 рівнів і нескінченний режим. Скоро в Google Play.',
      'hero.l1': 'Цілься.',
      'hero.l2': 'Запускай.',
      'hero.l3': 'Ламай усе.',
      'hero.lead': 'Неонова аркада для Android. Кульки відлітають від стін і блоків, поле повільно опускається, а ти збираєш ланцюжки. Спробуй просто тут: клікни по полю або торкнись його.',
      'hero.fine': 'Android 7.0 і новіший. Українська та англійська мови.',
      'game.label': 'Демо гри Cascade. Клікніть, щоб вистрелити кульками. Стрілки змінюють кут, пробіл стріляє.',
      'game.score': 'Очки',
      'game.fire': 'Вистрелити',
      'word.break': 'Ламай',
      'word.bounce': 'Відбивай',
      'word.chain': 'Ланцюжки',
      'bonus.title': 'Що лежить на полі',
      'bonus.lead': 'Кульки та монети збираються самі, коли кулька пролітає поруч. Лазер і бомба розчищають шлях.',
      'bonus.ball.t': 'Кулька',
      'bonus.ball.d': 'Ще одна кулька з наступного ходу.',
      'bonus.coin.t': 'Монета',
      'bonus.coin.d': 'Іде до гаманця. Витратиш у магазині.',
      'bonus.laser.t': 'Лазер',
      'bonus.laser.d': 'Б’є по всіх блоках ряду або стовпця.',
      'bonus.bomb.t': 'Бомба',
      'bonus.bomb.d': 'Руйнує блоки в зоні 3×3.',
      'combo.title': 'Чим довший ланцюжок, тим дорожчий кожен блок',
      'combo.lead': 'Блок номер N за один хід дає 10 × N очок. Перетягни повзунок і подивись, що виходить.',
      'combo.label': 'Блоків за хід',
      'combo.points': 'очок',
      'style.title': 'Зроби поле своїм',
      'style.lead': 'Чотири теми, п’ять стилів блоків і п’ять стилів кульок. Усе малюється векторно, тому лишається чітким на будь-якому екрані. Обери тему, і зміниться вся сторінка разом із грою нагорі.',
      'style.themes': 'Тема',
      'style.blocks': 'Блоки',
      'theme.neon': 'Неон',
      'theme.ocean': 'Океан',
      'theme.sunset': 'Захід сонця',
      'theme.matrix': 'Матриця',
      'block.rounded': 'Заокруглені',
      'block.sharp': 'Гострі',
      'block.outline': 'Контур',
      'block.gem': 'Самоцвіт',
      'block.bubble': 'Бульбашка',
      'closing.title': 'Скоро на Android',
      'closing.lead': '1500 рівнів, нескінченний режим і ланцюжки комбо. Cascade з’явиться в Google Play.',
    },
    en: {
      'meta.title': 'Cascade: Break & Bounce',
      'meta.desc': 'A neon arcade for Android: aim, launch balls, smash blocks and chain combos. 1,500 levels and an endless mode. Coming soon to Google Play.',
      'hero.l1': 'Aim.',
      'hero.l2': 'Launch.',
      'hero.l3': 'Break everything.',
      'hero.lead': 'A neon arcade for Android. Balls ricochet off walls and blocks, the field creeps down, and you chain big combos. Try it right here: click or tap the field.',
      'hero.fine': 'Android 7.0 or newer. English and Ukrainian.',
      'game.label': 'Cascade demo. Click to fire the balls. Arrow keys change the angle, Space fires.',
      'game.score': 'Score',
      'game.fire': 'Fire',
      'word.break': 'Break',
      'word.bounce': 'Bounce',
      'word.chain': 'Chain',
      'bonus.title': 'What lies on the field',
      'bonus.lead': 'Balls and coins are picked up automatically when a ball passes by. The laser and the bomb clear the way.',
      'bonus.ball.t': 'Ball',
      'bonus.ball.d': 'One more ball from the next turn.',
      'bonus.coin.t': 'Coin',
      'bonus.coin.d': 'Goes to your wallet. Spend it in the shop.',
      'bonus.laser.t': 'Laser',
      'bonus.laser.d': 'Hits every block in a row or a column.',
      'bonus.bomb.t': 'Bomb',
      'bonus.bomb.d': 'Destroys blocks in a 3×3 area.',
      'combo.title': 'The longer the chain, the more each block is worth',
      'combo.lead': 'Block number N in a single turn scores 10 × N points. Drag the slider and see what happens.',
      'combo.label': 'Blocks per turn',
      'combo.points': 'points',
      'style.title': 'Make the field yours',
      'style.lead': 'Four themes, five block styles and five ball styles. Everything is drawn as vector graphics, so it stays sharp on any screen. Pick a theme and the whole page changes, along with the game above.',
      'style.themes': 'Theme',
      'style.blocks': 'Blocks',
      'theme.neon': 'Neon',
      'theme.ocean': 'Ocean',
      'theme.sunset': 'Sunset',
      'theme.matrix': 'Matrix',
      'block.rounded': 'Rounded',
      'block.sharp': 'Sharp',
      'block.outline': 'Outline',
      'block.gem': 'Gem',
      'block.bubble': 'Bubble',
      'closing.title': 'Coming to Android',
      'closing.lead': '1,500 levels, endless mode and chain combos. Cascade is on its way to Google Play.',
    },
  };

  const COMBO_TITLES = {
    uk: ['Непогано!', 'Чудово!', 'Неймовірно!', 'Шалено!', 'ЛЕГЕНДАРНО!'],
    en: ['Nice!', 'Great!', 'Awesome!', 'Incredible!', 'LEGENDARY!'],
  };

  const plural = {
    uk(n) {
      const mod10 = n % 10;
      const mod100 = n % 100;
      if (mod10 === 1 && mod100 !== 11) return `${n} блок знищено`;
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} блоки знищено`;
      return `${n} блоків знищено`;
    },
    en: (n) => `${n} ${n === 1 ? 'block' : 'blocks'} destroyed`,
  };

  const LOCALE = { uk: 'uk-UA', en: 'en-US' };

  let lang = 'uk';
  const t = (key) => I18N[lang][key] ?? key;
  const fmt = (n) => n.toLocaleString(LOCALE[lang]);

  // ------------------------------------------------------------------ theme and skin

  const css = (c) => `rgb(${Math.round(c[0])} ${Math.round(c[1])} ${Math.round(c[2])})`;
  let theme = 'neon';
  let skin = 'rounded';
  let game = null;

  function applyTheme(name) {
    const pal = C.PALETTES[name];
    if (!pal) return;
    theme = name;
    const vars = {
      '--bg': pal.background, '--field': pal.field, '--line': pal.fieldLine, '--accent': pal.accent,
      '--on-accent': pal.onAccent, '--surface': pal.surface, '--text': pal.hudText, '--item': pal.itemBall,
      '--coin': pal.coin, '--coin-inner': pal.coinInner, '--laser': pal.laser, '--bomb': pal.bomb,
      '--spark': pal.bombSpark,
    };
    for (const [key, value] of Object.entries(vars)) root.style.setProperty(key, css(value));
    pal.blockColors.forEach((c, i) => root.style.setProperty(`--b${i}`, css(c)));
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', css(pal.background));
    if (game) game.setPalette(name);
    drawPreview();
    $$('#themes .choice').forEach((el) => el.setAttribute('aria-pressed', String(el.dataset.value === name)));
    store.set('cascade.theme', name);
  }

  function applySkin(name) {
    if (!C.SKINS[name]) return;
    skin = name;
    if (game) game.setSkin(name);
    drawPreview();
    $$('#blocks .choice').forEach((el) => el.setAttribute('aria-pressed', String(el.dataset.value === name)));
    store.set('cascade.skin', name);
  }

  function renderChoices() {
    const themes = $('#themes');
    themes.replaceChildren();
    for (const [name, pal] of Object.entries(C.PALETTES)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice';
      btn.dataset.value = name;
      btn.setAttribute('aria-pressed', String(name === theme));
      const sw = document.createElement('span');
      sw.className = 'swatch';
      sw.setAttribute('aria-hidden', 'true');
      pal.blockColors.forEach((c) => {
        const chip = document.createElement('i');
        chip.style.background = css(c);
        sw.append(chip);
      });
      btn.append(sw, t(`theme.${name}`));
      btn.addEventListener('click', () => applyTheme(name));
      themes.append(btn);
    }

    const blocks = $('#blocks');
    blocks.replaceChildren();
    for (const name of Object.keys(C.SKINS)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice';
      btn.dataset.value = name;
      btn.setAttribute('aria-pressed', String(name === skin));
      const mini = document.createElement('canvas');
      mini.className = 'mini';
      mini.setAttribute('aria-hidden', 'true');
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      mini.width = 28 * dpr;
      mini.height = 28 * dpr;
      mini.dataset.skin = name;
      btn.append(mini, t(`block.${name}`));
      btn.addEventListener('click', () => applySkin(name));
      blocks.append(btn);
    }
    drawMinis();
  }

  function drawMinis() {
    const pal = C.PALETTES[theme];
    for (const mini of $$('#blocks canvas.mini')) {
      const ctx = mini.getContext('2d');
      const s = mini.width;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, s, s);
      ctx.setTransform(s, 0, 0, s, 0, 0);
      C.SKINS[mini.dataset.skin](ctx, 0.08, 0.08, 0.84, 0.84, C.blockColor(pal, 0.45));
    }
  }

  // A fixed little field that shows the chosen theme and block style next to the controls.
  const PREVIEW_HP = [
    [1, 3, 0, 8, 14, 0, 26],
    [2, 0, 6, 11, 0, 19, 31],
    [0, 4, 9, 0, 16, 24, 36],
    [5, 7, 0, 13, 21, 0, 28],
  ];
  const PREVIEW_ITEMS = { '0,2': 'ball', '1,1': 'coin', '2,0': 'ball', '3,2': 'coin', '2,3': 'ball', '0,5': 'coin' };

  function drawPreview() {
    const canvas = $('#preview');
    if (!canvas) return;
    const pal = C.PALETTES[theme];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssWidth = canvas.clientWidth || 360;
    const rowsShown = PREVIEW_HP.length;
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round((cssWidth * dpr * (rowsShown + 0.6)) / C.COLS);
    const ctx = canvas.getContext('2d');
    const scale = canvas.width / C.COLS;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, C.COLS, rowsShown + 0.6);
    C.roundRect(ctx, 0, 0, C.COLS, rowsShown + 0.6, 0.3);
    ctx.fillStyle = C.rgba(pal.field);
    ctx.fill();
    ctx.strokeStyle = C.rgba(pal.fieldLine, 0.4);
    ctx.lineWidth = 0.02;
    ctx.beginPath();
    for (let x = 1; x < C.COLS; x++) { ctx.moveTo(x, 0); ctx.lineTo(x, rowsShown + 0.6); }
    for (let y = 1; y <= rowsShown; y++) { ctx.moveTo(0, y); ctx.lineTo(C.COLS, y); }
    ctx.stroke();

    const draw = C.SKINS[skin];
    PREVIEW_HP.forEach((row, r) => {
      row.forEach((hp, c) => {
        const item = PREVIEW_ITEMS[`${r},${c}`];
        if (hp === 0 && item === 'ball') {
          ctx.strokeStyle = C.rgba(pal.itemBall);
          ctx.lineWidth = 0.07;
          ctx.beginPath();
          ctx.arc(c + 0.5, r + 0.5, 0.27, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = C.rgba(pal.itemBall);
          ctx.beginPath();
          ctx.arc(c + 0.5, r + 0.5, 0.09, 0, Math.PI * 2);
          ctx.fill();
          return;
        }
        if (hp === 0 && item === 'coin') {
          ctx.fillStyle = C.rgba(pal.coin);
          ctx.beginPath();
          ctx.arc(c + 0.5, r + 0.5, 0.27, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = C.rgba(pal.coinInner);
          ctx.beginPath();
          ctx.arc(c + 0.5, r + 0.5, 0.16, 0, Math.PI * 2);
          ctx.fill();
          return;
        }
        if (hp === 0) return;
        const color = C.blockColor(pal, hp / 36);
        ctx.save();
        ctx.shadowColor = C.rgba(color, 0.55);
        ctx.shadowBlur = scale * 0.3;
        draw(ctx, c + 0.06, r + 0.06, 0.88, 0.88, color);
        ctx.restore();
        ctx.fillStyle = C.rgba(pal.blockText);
        ctx.font = '700 0.36px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(hp), c + 0.5, r + 0.53);
      });
    });
    ctx.fillStyle = C.rgba(pal.ball);
    ctx.shadowColor = C.rgba(pal.ball, 0.9);
    ctx.shadowBlur = scale * 0.35;
    ctx.beginPath();
    ctx.arc(C.COLS / 2, rowsShown + 0.3, 0.13, 0, Math.PI * 2);
    ctx.fill();
    drawMinis();
  }

  // ------------------------------------------------------------------ demo game

  function setupGame() {
    const canvas = $('#game');
    const scoreEl = $('#score');
    const words = Object.fromEntries($$('.words li').map((li) => [li.dataset.word, li]));
    const timers = {};
    const lastLit = {};

    function light(name) {
      const el = words[name];
      if (!el) return;
      const now = performance.now();
      if (now - (lastLit[name] || 0) < 180) return;
      lastLit[name] = now;
      el.classList.add('lit');
      clearTimeout(timers[name]);
      timers[name] = setTimeout(() => el.classList.remove('lit'), 420);
    }

    game = C.createGame(canvas, {
      reduceMotion: reduce,
      bannerText: (tier, count) => ({ title: COMBO_TITLES[lang][tier - 1], sub: plural[lang](count) }),
      onEvent(type, data) {
        if (type === 'break') light('break');
        else if (type === 'bounce') light('bounce');
        else if (type === 'combo') light('chain');
        else if (type === 'score') {
          scoreEl.textContent = fmt(data);
          scoreEl.style.color = C.scoreColor(data, game.time);
        }
      },
    });
    game.setPalette(theme);
    game.setSkin(skin);

    // Mouse: hover aims, press fires. Touch: a tap aims and fires; drags stay page scrolls.
    let down = null;
    canvas.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') game.aimAt(e.clientX, e.clientY); });
    canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') game.shoot(e.clientX, e.clientY);
      else down = { x: e.clientX, y: e.clientY };
    });
    canvas.addEventListener('pointerup', (e) => {
      if (e.pointerType === 'mouse' || !down) return;
      if (Math.hypot(e.clientX - down.x, e.clientY - down.y) < 12) game.shoot(e.clientX, e.clientY);
      down = null;
    });
    canvas.addEventListener('pointercancel', () => { down = null; });
    canvas.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') game.nudge(0.06);
      else if (e.key === 'ArrowRight') game.nudge(-0.06);
      else if (e.key === ' ' || e.key === 'Enter') game.shoot();
      else return;
      e.preventDefault();
    });
    $('#fire').addEventListener('click', () => game.shoot());

    // Run only while the field is on screen and the tab is visible.
    let onScreen = true;
    const sync = () => (onScreen && !document.hidden ? game.start() : game.stop());
    new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; sync(); }, { threshold: 0.05 }).observe(canvas);
    document.addEventListener('visibilitychange', sync);
    sync();
  }

  // ------------------------------------------------------------------ combo slider

  const range = $('#combo-range');
  const pointsEl = $('#combo-points');
  let shownPoints = 0;
  let pointsRaf = 0;

  function tweenPoints(target) {
    cancelAnimationFrame(pointsRaf);
    const from = shownPoints;
    if (reduce || from === target) { shownPoints = target; pointsEl.textContent = fmt(target); return; }
    const start = performance.now();
    const tick = (now) => {
      const k = Math.min(1, (now - start) / 260);
      shownPoints = Math.round(from + (target - from) * (1 - Math.pow(1 - k, 3)));
      pointsEl.textContent = fmt(shownPoints);
      if (k < 1) pointsRaf = requestAnimationFrame(tick);
    };
    pointsRaf = requestAnimationFrame(tick);
  }

  function renderCombo() {
    const n = Number(range.value);
    const tier = C.tierForCombo(n);
    const total = 5 * n * (n + 1); // 10 + 20 + ... + 10n
    const banner = $('#combo-banner');
    banner.textContent = tier > 0 ? COMBO_TITLES[lang][tier - 1] : (lang === 'uk' ? 'Банер від 3 блоків' : 'Banner from 3 blocks');
    banner.dataset.tier = String(tier);
    banner.style.color = tier > 0 && tier < 5 ? css(C.epicColor(tier, 0)) : '';
    $('#combo-sub').textContent = plural[lang](n);
    $('#combo-n').textContent = String(n);
    $('#combo-formula').textContent = lang === 'uk'
      ? `Останній блок: 10 × ${n} = ${fmt(10 * n)}`
      : `Last block: 10 × ${n} = ${fmt(10 * n)}`;
    pointsEl.style.color = C.scoreColor(total);
    tweenPoints(total);
    range.style.setProperty('--fill', `${((n - 1) / 99) * 100}%`);
    range.setAttribute('aria-valuetext', `${plural[lang](n)}, ${fmt(total)} ${t('combo.points')}`);
    // A short pulse on the readout when the banner tier changes.
    const readout = $('#readout');
    if (readout.dataset.tier !== String(tier)) {
      readout.dataset.tier = String(tier);
      if (!reduce) {
        readout.classList.remove('pop');
        void readout.offsetWidth;
        readout.classList.add('pop');
      }
    }
  }

  range.addEventListener('input', renderCombo);

  // ------------------------------------------------------------------ bonuses

  function replay(el) {
    el.classList.remove('play');
    void el.getBoundingClientRect();
    el.classList.add('play');
  }

  function setupBonuses() {
    const items = $$('.bonus');
    const seen = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        seen.unobserve(entry.target);
        setTimeout(() => replay(entry.target), items.indexOf(entry.target) * 160);
      });
    }, { threshold: 0.7 });
    items.forEach((el) => {
      seen.observe(el);
      el.addEventListener('pointerenter', () => replay(el));
    });
  }

  // ------------------------------------------------------------------ language

  function applyLang(next) {
    lang = next;
    root.lang = next;
    $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $$('[data-i18n-attr]').forEach((el) => {
      const [attr, key] = el.dataset.i18nAttr.split(':');
      el.setAttribute(attr, t(key));
    });
    document.title = t('meta.title');
    const desc = $('meta[name="description"]');
    if (desc) desc.setAttribute('content', t('meta.desc'));
    const og = $('meta[property="og:title"]');
    if (og) og.setAttribute('content', t('meta.title'));
    $$('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === next)));
    renderChoices();
    renderCombo();
    if (game) $('#score').textContent = fmt(game.score);
    store.set('cascade.lang', next);
  }

  $$('.lang button').forEach((b) => b.addEventListener('click', () => applyLang(b.dataset.lang)));

  // ------------------------------------------------------------------ start

  const savedLang = store.get('cascade.lang');
  lang = savedLang === 'uk' || savedLang === 'en'
    ? savedLang
    : (navigator.language || 'en').toLowerCase().startsWith('uk') ? 'uk' : 'en';
  const savedTheme = store.get('cascade.theme');
  const savedSkin = store.get('cascade.skin');
  if (C.PALETTES[savedTheme]) theme = savedTheme;
  if (C.SKINS[savedSkin]) skin = savedSkin;

  applyTheme(theme);
  setupGame();
  setupBonuses();
  applyLang(lang);
  applySkin(skin);

  if (document.fonts && document.fonts.load) {
    // The canvases draw with these two, which no DOM text may have requested yet.
    Promise.all([document.fonts.load('700 1em "JetBrains Mono"'), document.fonts.load('800 1em Inter')])
      .then(() => drawPreview())
      .catch(() => {});
  }
  if (typeof ResizeObserver === 'function') new ResizeObserver(drawPreview).observe($('#preview'));
})();
