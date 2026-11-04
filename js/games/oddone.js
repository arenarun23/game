// 다른 것 찾기: 비슷한 그림 속에서 하나만 다른 것을 찾는다
(function () {
  'use strict';
  const SETS = [['🐶', '🐺'], ['🍎', '🍅'], ['🐱', '🦁'], ['🍊', '🏀'], ['🌙', '🧀'], ['🍓', '🌹'], ['🚗', '🚕'], ['🐸', '🐢'], ['⭐', '🌟'], ['🍋', '🌕'], ['🐻', '🐨'], ['🍩', '⭕']];
  const ROUNDS = [{ n: 4, c: 2, r: 2 }, { n: 6, c: 3, r: 2 }, { n: 6, c: 3, r: 2 }, { n: 9, c: 3, r: 3 }, { n: 12, c: 4, r: 3 }];

  G.register({
    id: 'oddone', name: '다른 것 찾기', desc: '하나만 달라요', icon: '🧐', cat: 'match', color: 'mint',
    start(root) {
      let round = 0, miss = 0, lock = false;
      const timers = [];
      const box = G.h('div', { class: 'fitbox' });
      const hint = G.h('div', { class: 'hint' });
      root.append(hint, box);
      function show() {
        const R = ROUNDS[round];
        const [a, b] = G.shuffle(G.pick(SETS));
        const odd = (Math.random() * R.n) | 0;
        const grid = G.h('div', { class: 'grid', style: `--c:${R.c};--r:${R.r}` });
        for (let i = 0; i < R.n; i++) {
          const t = G.h('button', { class: 'tile', 'aria-label': '그림' }, i === odd ? b : a);
          t.addEventListener('click', () => {
            if (lock) return;
            if (i === odd) { lock = true; G.sfx.ok(); t.style.background = '#c9f2e0'; round++; timers.push(setTimeout(() => { lock = false; round < ROUNDS.length ? show() : G.win({ stars: miss === 0 ? 3 : miss <= 2 ? 2 : 1, text: miss ? '틀린 횟수 ' + miss + '번' : '하나도 안 틀렸어요!' }); }, 600)); }
            else { miss++; G.sfx.bad(); t.classList.remove('shake'); void t.offsetWidth; t.classList.add('shake'); }
          });
          grid.append(t);
        }
        hint.textContent = `${round + 1} / ${ROUNDS.length} · 다른 하나를 찾아요`;
        box.replaceChildren(grid);
      }
      show();
      return () => timers.forEach(clearTimeout);
    },
  });
})();
