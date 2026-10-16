/* Late-game staging for the promo: dense fields and a bigger ball stock, so a turn can chain and the field stays full on screen. */
(() => {
  'use strict';
  const COLS = 7;
  const ITEMS = ['coin', 'laser', 'bomb', 'ball'];

  function dense(rows, density, hpMin, hpMax) {
    const bricks = [];
    for (let row = 1; row <= rows; row++) {
      for (let c = 0; c < COLS; c++) {
        const r = Math.random();
        const common = { c, row, y: -3 - Math.random() * 2, vy: 0, flash: 0, delay: (rows - row) * 0.05 + c * 0.015, dead: false };
        if (r < density) {
          const hp = hpMin + Math.floor(Math.random() * (hpMax - hpMin + 1));
          bricks.push({ ...common, kind: 'brick', hp, max: hp });
        } else if (r < density + 0.09) {
          bricks.push({ ...common, kind: ITEMS[Math.floor(Math.random() * ITEMS.length)], hp: 0, max: 0 });
        }
      }
    }
    return bricks;
  }

  window.PromoStage = {
    BALL_SCHEDULE: [6, 10, 16, 60, 12, 14, 16, 18],
    /** Called when a turn becomes ready. Turn 4 is the big chain, turn 5 refills the field with sturdy blocks. */
    onReady(st) {
      st.ballCount = this.BALL_SCHEDULE[Math.min(st.turn - 1, this.BALL_SCHEDULE.length - 1)];
      if (st.turn === 4) st.bricks = dense(8, 0.86, 1, 5);
      else if (st.turn === 5) st.bricks = dense(7, 0.84, 5, 14);
    },
  };
})();
