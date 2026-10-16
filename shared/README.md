# shared/

Блоки, однакові для лендингів усіх застосунків. Структура, текст і поведінка спільні, вигляд задає кожна сторінка.

## `<play-badge>`

Плашка «Скоро в Google Play».

```html
<script src="/shared/play-badge.js" defer></script>
<play-badge></play-badge>
```

Мова береться з `<html lang>` (`uk` або будь-яка інша = англійська) і змінюється разом з атрибутом.

Після публікації в Google Play достатньо додати два атрибути, і плашка стане посиланням на всіх сторінках, де вона є:

```html
<play-badge live href="https://play.google.com/store/apps/details?id=com.shadovvdev.cascade"></play-badge>
```

Для живого стану Google вимагає свій офіційний бейдж «Get it on Google Play» ([правила використання](https://play.google.com/intl/en_us/badges/)). Коли застосунок вийде, замініть тестову плашку в режимі `live` на офіційну картинку.

### Тема через CSS-змінні

| Змінна | Що задає | За замовчуванням |
|---|---|---|
| `--pb-fg` | колір тексту | `#fff` |
| `--pb-muted` | колір малого рядка | як `--pb-fg` |
| `--pb-bg` | заливка плашки | `rgba(255,255,255,.06)` |
| `--pb-border` | колір рамки | `rgba(255,255,255,.3)` |
| `--pb-accent` | колір знака й пульсу | колір тексту |
| `--pb-radius` | скруглення | `14px` |
| `--pb-glow`, `--pb-glow-hover` | `box-shadow` | немає |
| `--pb-font`, `--pb-weight`, `--pb-tracking` | шрифт | `system-ui`, 700 |
| `--pb-size` | розмір (усе вимірюється в `em`) | `1rem` |

Приклад для Cascade (неон) і для світлого «паперового» застосунку:

```css
/* Cascade */
play-badge {
  --pb-bg: color-mix(in srgb, var(--surface) 70%, transparent);
  --pb-border: color-mix(in srgb, var(--accent) 60%, transparent);
  --pb-glow: 0 0 22px color-mix(in srgb, var(--accent) 35%, transparent);
  --pb-accent: var(--accent);
  --pb-fg: var(--text);
}

/* Нотатки */
play-badge {
  --pb-bg: #fffdf6;
  --pb-fg: #2b2a26;
  --pb-border: #d9d3c2;
  --pb-accent: #e0a21b;
  --pb-radius: 10px;
}
```
