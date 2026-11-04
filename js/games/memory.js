// 짝 맞추기: 같은 그림 두 장을 찾는다. 이길 때마다 카드가 늘어난다.
(function () {
  'use strict';
  const LEVELS = [
    { pairs: 3, c: 3, r: 2 }, { pairs: 4, c: 4, r: 2 }, { pairs: 6, c: 4, r: 3 }, { pairs: 8, c: 4, r: 4 },
  ];
  const FACES = ['🐶', '🐱', '🐰', '🐻', '🦊', '🐼', '🐸', '🐵', '🦁', '🐯', '🐮', '🐷', '🐔', '🐧'];
  let lv = 0;

  G.register({
    id: 'memory', name: '짝 맞추기', desc: '같은 그림을 찾아요', icon: '🃏', cat: 'match', color: 'lilac',
    start(root) {
      const L = LEVELS[lv];
      const faces = G.shuffle(FACES).slice(0, L.pairs);
      const deck = G.shuffle(faces.concat(faces));
      const timers = [];
      let first = null, lock = false, moves = 0, found = 0;
      const grid = G.h('div', { class: 'grid', style: `--c:${L.c};--r:${L.r}` });
      deck.forEach((f) => {
        const card = G.h('button', { class: 'mcard', 'aria-label': '카드' },
          G.h('div', { class: 'in' }, G.h('div', { class: 'b' }, '?'), G.h('div', { class: 'f' }, f)));
        card.dataset.f = f;
        card.addEventListener('click', () => flip(card));
        grid.append(card);
      });
      function flip(c) {
        if (lock || c.classList.contains('open') || c.classList.contains('done')) return;
        G.sfx.flip(); c.classList.add('open');
        if (!first) { first = c; return; }
        moves++;
        if (first.dataset.f === c.dataset.f) {
          const a = first; first = null;
          timers.push(setTimeout(() => { a.classList.replace('open', 'done'); c.classList.replace('open', 'done'); G.sfx.ok(); found++;
            if (found === L.pairs) timers.push(setTimeout(finish, 500)); }, 350));
        } else {
          lock = true; const a = first; first = null;
          timers.push(setTimeout(() => { a.classList.remove('open'); c.classList.remove('open'); lock = false; G.sfx.bad(); }, 900));
        }
      }
      function finish() {
        const stars = moves <= L.pairs + 2 ? 3 : moves <= L.pairs * 2 ? 2 : 1;
        if (lv < LEVELS.length - 1) lv++;
        G.win({ stars, text: moves + '번 만에 다 찾았어요!' + (lv > 0 ? ' 다음엔 카드가 더 많아져요.' : '') });
      }
      root.append(G.h('div', { class: 'hint' }, '같은 그림 두 장을 찾아요'), G.h('div', { class: 'fitbox' }, grid));
      return () => timers.forEach(clearTimeout);
    },
  });
})();
