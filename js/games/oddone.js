// 다른 것 찾기 (20가지 종류)
//  쉬움: 그림이 적고 차이가 커요 / 어려움: 그림이 많고 차이가 작아요
(function () {
  'use strict';
  const PR = (s) => s.split(',').map((x) => x.trim().split(' '));
  const K = (n, i, pairs, fx) => ({ n, i, pairs: PR(pairs), fx });
  const B = (n, i, bases, fx) => ({ n, i, bases: bases.split(' '), fx });
  const KINDS = [
    K('비슷한 동물', '🐶', '🐶 🐺, 🐱 🦁, 🐻 🐨, 🐰 🐭, 🐮 🐷, 🦊 🐕'),
    K('비슷한 과일', '🍎', '🍎 🍅, 🍊 🍑, 🍋 🍌, 🍓 🍒, 🍐 🍏'),
    K('종류가 다른 것', '🧐', '🐶 🍎, 🍌 🚗, 🚌 🐱, ⚽ 🍉, 🌸 🐟, 🐰 🚲'),
    K('색이 다른 하트', '❤️', '❤️ 🧡, 💙 💜, 💛 🧡, 💚 💙, 🖤 🤍'),
    K('색이 다른 동그라미', '🔴', '🔴 🟠, 🔵 🟣, 🟡 🟠, 🟢 🔵, 🟤 🟠'),
    B('방향이 다른 그림', '↔️', '🚗 🐟 🐢 🦆 🚂 🐌', 'flip'),
    B('거꾸로 선 그림', '🙃', '🏠 🌳 🐻 🍎 🧁 🚀', 'rot'),
    B('크기가 다른 그림', '🔎', '🍎 ⭐ 🐱 🎈 🚗 🌸', 'size'),
    K('비슷한 숫자', '6️⃣', '6 9, 3 8, 1 7, 5 6, 2 5, 0 8', 'tx'),
    K('비슷한 한글', '가', 'ㅂ ㅁ, 가 거, ㅅ ㅈ, ㅓ ㅏ, ㅜ ㅗ, ㅊ ㅈ', 'tx'),
    K('비슷한 알파벳', 'b', 'b d, p q, m n, E F, O Q, u n', 'tx'),
    K('비슷한 탈것', '🚌', '🚗 🚕, 🚌 🚎, 🚂 🚃, 🚲 🛵, ✈️ 🛩️, 🚑 🚒'),
    K('비슷한 얼굴', '😀', '😀 😃, 😊 🙂, 😢 😭, 😠 😡, 😴 😪, 😮 😲'),
    K('비슷한 꽃과 나무', '🌹', '🌹 🌷, 🌻 🌼, 🌲 🌳, 🍀 🌿, 🌵 🎄'),
    B('개수가 다른 줄', '🔢', '🍎 ⭐ 🐟 🎈 🍓 🐥', 'count'),
    K('다른 도형', '🔷', '🔶 🔸, 🔷 🔹, 🔺 🔻, ⬜ 🔲, 💠 🔷'),
    K('비슷한 바다 동물', '🐠', '🐟 🐠, 🐬 🐳, 🦀 🦞, 🐙 🦑, 🐢 🐊'),
    K('하늘의 모양', '🌙', '☀️ 🌕, 🌙 🌛, ⭐ 🌟, ☁️ 🌫️, ❄️ ✳️'),
    K('비슷한 간식', '🍰', '🍪 🍘, 🍰 🎂, 🍕 🧀, 🍔 🥪, 🍦 🍨'),
    K('비슷한 물건', '🥁', '🥁 🪘, 🎸 🪕, 🎷 🎺, ⏰ 🕰️, ⚽ 🏐'),
  ];
  const ROUNDS = { easy: [4, 4, 6, 6, 9], hard: [9, 12, 12, 16, 20] };

  G.register({
    id: 'oddone', name: '다른 것 찾기', desc: '종류 20가지', icon: '🧐', cat: 'match', color: 'mint', variants: KINDS.length,
    start(root, { hard, v }) {
      const k = KINDS[v], sizes = ROUNDS[hard ? 'hard' : 'easy'];
      let round = 0, miss = 0, lock = false;
      const timers = [];
      const hint = G.h('div', { class: 'hint must' });
      const box = G.h('div', { class: 'fitbox' });
      root.append(hint, box);

      // 한 칸의 모양을 만든다. odd=true 이면 "다른 그림"
      function tileOf(pair, odd) {
        const g = G.h('span', { class: 'g' + (k.fx === 'tx' ? ' tx' : '') });
        if (k.fx === 'count') { const c = odd ? pair.b : pair.a; g.className = 'cnt'; g.replaceChildren(...Array.from({ length: c }, () => G.h('span', {}, pair.e))); return g; }
        if (k.bases) {
          g.textContent = pair.e;
          if (odd) {
            if (k.fx === 'flip') g.style.transform = 'scaleX(-1)';
            else if (k.fx === 'rot') g.style.transform = 'rotate(180deg)';
            else if (k.fx === 'size') g.style.transform = `scale(${hard ? 0.78 : 0.55})`;
          }
        } else g.textContent = odd ? pair[1] : pair[0];
        return g;
      }
      function pairFor() {
        if (k.bases) {
          const e = G.pick(k.bases);
          if (k.fx === 'count') { const a = 2 + ((Math.random() * 3) | 0); return { e, a, b: hard ? a + 1 : a + 3 }; }
          return { e };
        }
        const p = G.pick(k.pairs); return Math.random() < 0.5 ? p : [p[1], p[0]];
      }
      function show() {
        const n = sizes[round], gr = G.bestGrid(n, box);
        const odd = (Math.random() * n) | 0, pair = pairFor();
        const grid = G.h('div', { class: 'grid', style: `--c:${gr.c};--r:${gr.r}` });
        for (let i = 0; i < n; i++) {
          const t = G.h('button', { class: 'tile', 'aria-label': '그림' }, tileOf(pair, i === odd));
          t.addEventListener('click', () => {
            if (lock) return;
            if (i === odd) {
              lock = true; G.sfx.ok(); t.style.background = '#c9f2e0'; round++;
              timers.push(setTimeout(() => { lock = false; round < sizes.length ? show() : G.win({ stars: miss === 0 ? 3 : miss <= 2 ? 2 : 1, text: miss ? '틀린 횟수 ' + miss + '번' : '하나도 안 틀렸어요!' }); }, 600));
            } else { miss++; G.sfx.bad(); t.classList.remove('shake'); void t.offsetWidth; t.classList.add('shake'); }
          });
          grid.append(t);
        }
        hint.textContent = `${k.i} ${k.n} · ${round + 1} / ${sizes.length} · 다른 하나를 찾아요`;
        box.replaceChildren(grid);
      }
      show();
      return () => timers.forEach(clearTimeout);
    },
  });
})();
