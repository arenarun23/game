// 다른 것 찾기
//  쉬운 단계: 완전히 다른 그림 20쌍 중 하나 (칸 4→9개)
//  어려운 단계: 비슷한 그림 20쌍 + 좌우 뒤집힘·돌아감·색 다름·개수 다름 (칸 9→20개)
(function () {
  'use strict';
  const EASY_PAIRS = [['🐶', '🍎'], ['🐱', '🚗'], ['🍌', '🐸'], ['⭐', '🍓'], ['🌳', '🐻'], ['🏠', '🌙'], ['🍕', '🐟'], ['⚽', '🍇'], ['🚀', '🐢'], ['🎈', '🐼'],
    ['🍦', '🦁'], ['🎁', '🐰'], ['☀️', '🍉'], ['🚲', '🍩'], ['🌈', '🐵'], ['⛵', '🥕'], ['🍄', '🚌'], ['🐧', '🍊'], ['🎵', '🐷'], ['🦋', '🍔']];
  const SIMILAR = [['🐶', '🐺'], ['🍎', '🍅'], ['🐱', '🦁'], ['🍊', '🏀'], ['🌙', '🧀'], ['🍓', '🌹'], ['🚗', '🚕'], ['🐸', '🐢'], ['⭐', '🌟'], ['🍋', '🌕'],
    ['🐻', '🐨'], ['🍩', '⭕'], ['🐭', '🐹'], ['🍇', '🍆'], ['🐔', '🐥'], ['🌸', '🌺'], ['🍉', '🍈'], ['🐷', '🐮'], ['⚽', '🏐'], ['🥕', '🌶️']];
  const ASYM = ['🐶', '🐱', '🐢', '🦆', '🚗', '✈️', '🐟', '🚀', '🐌', '🐧', '🐘', '🚂', '🦜', '🐑', '🚤'];   // 방향이 있는 그림
  const CNT = ['🍎', '⭐', '🐟', '🍓', '🎈', '🌸', '🐥', '🍩'];
  const EASY_ROUNDS = [4, 4, 6, 6, 9, 9], HARD_ROUNDS = [9, 9, 12, 12, 16, 16, 20, 20];
  const KINDS = ['sim', 'flip', 'turn', 'hue', 'count'];
  const HINT = { sim: '비슷하지만 다른 그림 하나를 찾아요', flip: '거울처럼 뒤집힌 그림을 찾아요', turn: '빙글 돌아간 그림을 찾아요', hue: '색이 다른 그림을 찾아요', count: '개수가 다른 칸을 찾아요' };

  G.register({
    id: 'oddone', name: '다른 것 찾기', desc: '하나만 달라요', icon: '🧐', cat: 'match', color: 'mint',
    start(root, mode) {
      const hard = mode === 'hard', rounds = hard ? HARD_ROUNDS : EASY_ROUNDS;
      let round = 0, miss = 0, lock = false;
      const timers = [];
      const box = G.h('div', { class: 'fitbox' }), hint = G.h('div', { class: 'hint' });
      root.append(hint, box);

      function make() {            // 이번 판의 (보통 칸 내용, 다른 칸 내용, 안내 문장)
        if (!hard) { const [a, b] = G.shuffle(EASY_PAIRS[G.bag('odd-e', EASY_PAIRS.length)]); return { base: { t: a }, odd: { t: b }, msg: '다른 하나를 찾아요' }; }
        const kind = G.pick(KINDS);
        if (kind === 'sim') { const [a, b] = G.shuffle(SIMILAR[G.bag('odd-s', SIMILAR.length)]); return { base: { t: a }, odd: { t: b }, msg: HINT.sim }; }
        if (kind === 'flip') { const e = G.pick(ASYM); return { base: { t: e }, odd: { t: e, css: 'transform:scaleX(-1)' }, msg: HINT.flip }; }
        if (kind === 'turn') { const e = G.pick(ASYM); return { base: { t: e }, odd: { t: e, css: 'transform:rotate(' + G.pick([90, 180, 270]) + 'deg)' }, msg: HINT.turn }; }
        if (kind === 'hue') { const e = G.pick(['🍎', '🐸', '🚗', '⭐', '🌸', '🐥', '🎈', '🍊']); return { base: { t: e }, odd: { t: e, css: 'filter:hue-rotate(' + G.pick([90, 150, 200, 270]) + 'deg) saturate(1.3)' }, msg: HINT.hue }; }
        const e = G.pick(CNT), n = 2 + ((Math.random() * 3) | 0); return { base: { t: e.repeat(n), small: true }, odd: { t: e.repeat(n + 1), small: true }, msg: HINT.count };
      }
      function show() {
        const n = rounds[round], d = G.dims(n), m = make();
        const odd = (Math.random() * n) | 0;
        const grid = G.h('div', { class: 'grid', style: `--c:${d.c};--r:${d.r}` });
        for (let i = 0; i < n; i++) {
          const o = i === odd ? m.odd : m.base;
          const inner = G.h('span', { class: 'gl', style: o.css || '' }, o.t);
          const t = G.h('button', { class: 'tile' + (o.small ? ' cnt' : ''), 'aria-label': '그림' }, inner);
          t.addEventListener('click', () => {
            if (lock) return;
            if (i === odd) {
              lock = true; G.sfx.ok(); t.style.background = '#c9f2e0'; round++;
              timers.push(setTimeout(() => { lock = false; round < rounds.length ? show() : G.win({ stars: miss === 0 ? 3 : miss <= 2 ? 2 : 1, text: miss ? '틀린 횟수 ' + miss + '번' : '하나도 안 틀렸어요!' }); }, 600));
            } else { miss++; G.sfx.bad(); t.classList.remove('shake'); void t.offsetWidth; t.classList.add('shake'); }
          });
          grid.append(t);
        }
        hint.textContent = `${round + 1} / ${rounds.length} · ${m.msg}`;
        box.replaceChildren(grid);
      }
      show();
      return () => timers.forEach(clearTimeout);
    },
  });
})();
