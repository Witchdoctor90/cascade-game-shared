/*
 * <play-badge>: the "coming soon on Google Play" plate shared by every app landing page.
 *
 * The structure, wording and behavior are the same everywhere; each page only sets its own look
 * through CSS custom properties (see shared/README.md). Add `live` and `href` once the app is published
 * and the plate turns into a store link on every page that uses it.
 *
 * Language follows <html lang> ("uk" or anything else = English) and updates when that attribute changes.
 */
(() => {
  'use strict';

  const TEXT = {
    uk: { soon: ['Скоро в', 'Google Play'], live: ['Завантажити в', 'Google Play'] },
    en: { soon: ['Coming soon on', 'Google Play'], live: ['Get it on', 'Google Play'] },
  };

  const STYLE = `
    :host { display: inline-block; font-size: var(--pb-size, 1rem); }
    .plate {
      display: inline-flex;
      align-items: center;
      gap: 0.85em;
      padding: 0.7em 1.15em 0.7em 0.95em;
      border: 1px solid var(--pb-border, rgba(255, 255, 255, 0.3));
      border-radius: var(--pb-radius, 14px);
      background: var(--pb-bg, rgba(255, 255, 255, 0.06));
      box-shadow: var(--pb-glow, none);
      color: var(--pb-fg, #fff);
      font-family: var(--pb-font, system-ui, sans-serif);
      line-height: 1.15;
      text-decoration: none;
      cursor: default;
    }
    a.plate { cursor: pointer; transition: transform 0.15s ease, box-shadow 0.15s ease; }
    a.plate:hover { transform: translateY(-1px); box-shadow: var(--pb-glow-hover, var(--pb-glow, none)); }
    a.plate:focus-visible { outline: 2px solid var(--pb-accent, currentColor); outline-offset: 3px; }
    .mark {
      position: relative;
      display: grid;
      place-items: center;
      width: 2.1em;
      height: 2.1em;
      color: var(--pb-accent, currentColor);
    }
    .mark svg { width: 1.45em; height: 1.45em; fill: currentColor; filter: var(--pb-mark-filter, none); }
    .soon .mark::after {
      content: '';
      position: absolute;
      inset: 0;
      border: 1.5px solid currentColor;
      border-radius: 50%;
      opacity: 0;
      animation: ring 2.6s ease-out infinite;
    }
    .text { display: grid; gap: 0.12em; }
    .small { font-size: 0.74em; color: var(--pb-muted, inherit); opacity: 0.85; }
    .store { font-size: 1.2em; font-weight: var(--pb-weight, 700); letter-spacing: var(--pb-tracking, 0); }
    @keyframes ring {
      0% { transform: scale(0.55); opacity: 0.7; }
      70%, 100% { transform: scale(1.15); opacity: 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      .soon .mark::after { animation: none; }
      a.plate { transition: none; }
    }
  `;

  const MARK =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.6v14.8a1 1 0 0 0 1.5.86l12.4-7.4a1 1 0 0 0 0-1.72L8.5 3.74A1 1 0 0 0 7 4.6z"/></svg>';

  class PlayBadge extends HTMLElement {
    static observedAttributes = ['live', 'href', 'lang'];

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._langObserver = new MutationObserver(() => this.render());
    }

    connectedCallback() {
      this._langObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
      this.render();
    }

    disconnectedCallback() {
      this._langObserver.disconnect();
    }

    attributeChangedCallback() {
      if (this.isConnected) this.render();
    }

    get locale() {
      const lang = (this.getAttribute('lang') || document.documentElement.lang || 'en').toLowerCase();
      return lang.startsWith('uk') ? 'uk' : 'en';
    }

    render() {
      const href = this.getAttribute('href');
      const live = this.hasAttribute('live') && href;
      const [small, store] = TEXT[this.locale][live ? 'live' : 'soon'];
      const tag = live ? 'a' : 'div';
      const attrs = live ? `class="plate" href="${encodeURI(href)}"` : 'class="plate soon" role="note"';
      this.shadowRoot.innerHTML =
        `<style>${STYLE}</style>` +
        `<${tag} ${attrs}><span class="mark">${MARK}</span>` +
        `<span class="text"><span class="small">${small}</span><span class="store">${store}</span></span></${tag}>`;
    }
  }

  if (!customElements.get('play-badge')) customElements.define('play-badge', PlayBadge);
})();
