// 분류하기 (20가지 주제)
//  쉬움: 상자 2개, 그림 6개 / 어려움: 상자 3개(또는 2개), 그림 10~12개
(function () {
  'use strict';
  const BG = ['var(--pink)', 'var(--sky)', 'var(--lemon)', 'var(--mint)'];
  const b = (n, s) => ({ n, items: s.split(' ') });
  const K = (n, i, ...bins) => ({ n, i, b: bins });
  const KINDS = [
    K('동물·과일·탈것', '🧺', b('동물', '🐶 🐱 🐰 🐻 🦊 🐼 🐸 🐵'), b('과일', '🍎 🍌 🍇 🍓 🍊 🍉 🍑 🍒'), b('탈것', '🚗 🚌 🚲 ✈️ 🚂 🚀 ⛵ 🚕')),
    K('바다·땅 동물', '🐬', b('바다', '🐟 🐠 🐬 🐳 🦈 🐙 🦀 🐡'), b('땅', '🐶 🐱 🐰 🐻 🦁 🐘 🐮 🐴')),
    K('낮과 밤', '🌓', b('낮', '☀️ 🌞 🌈 ⛅ 🏖️ 🌻 🚌 🏫'), b('밤', '🌙 ⭐ 🌃 🦉 🛌 🌠 🦇 🔦')),
    K('먹는 것·입는 것', '🍙', b('먹는 것', '🍎 🍞 🍪 🍕 🍦 🥕 🍙 🍰'), b('입는 것', '👕 👖 👗 🧢 🧦 🧤 👟 🧥')),
    K('하늘·땅·물 탈것', '🚁', b('하늘', '✈️ 🚁 🚀 🛸 🪂 🛩️'), b('땅', '🚗 🚌 🚲 🚂 🚜 🛵'), b('물', '⛵ 🚢 🛶 🚤 🛥️ ⛴️')),
    K('빨강·파랑·노랑', '🎨', b('빨강', '🍎 🍓 🍒 🌹 ❤️ 🚒'), b('파랑', '💙 🔵 🐳 🌊 🫐 🦋'), b('노랑', '🍌 🌻 ⭐ 🍋 🐥 🌕')),
    K('짝수·홀수', '🔢', b('짝수', '2️⃣ 4️⃣ 6️⃣ 8️⃣ 🔟 0️⃣'), b('홀수', '1️⃣ 3️⃣ 5️⃣ 7️⃣ 9️⃣')),
    K('세모·네모·동그라미', '🔺', b('세모', '🔺 🔻 🔼 🔽 ◀️ ▶️'), b('네모', '🟥 🟦 🟩 🟨 🟧 ⬛'), b('동그라미', '🔴 🔵 🟢 🟡 🟠 🟣')),
    K('곤충·새', '🐝', b('곤충', '🐝 🐞 🦋 🐛 🐜 🦗'), b('새', '🐦 🦆 🦉 🦅 🦜 🐧')),
    K('채소·과일', '🥕', b('채소', '🥕 🌽 🥦 🥒 🍆 🥔'), b('과일', '🍎 🍌 🍇 🍓 🍊 🍉')),
    K('여름·겨울', '⛄', b('여름', '🏖️ 🍉 🕶️ 🍦 🩴 🌊'), b('겨울', '⛄ 🧣 🧤 ❄️ ⛷️ 🧥')),
    K('악기·운동 공', '🎺', b('악기', '🎹 🎸 🥁 🎺 🎻 🎷'), b('운동', '⚽ 🏀 🎾 🏐 🏓 🥊')),
    K('학교·집 물건', '🎒', b('학교', '✏️ 📏 📚 🎒 🖍️ ✂️'), b('집', '🛏️ 🛁 🚪 📺 🪑 🚿')),
    K('5보다 작은·큰 수', '🔟', b('5보다 작아요', '1️⃣ 2️⃣ 3️⃣ 4️⃣ 0️⃣'), b('5보다 커요', '6️⃣ 7️⃣ 8️⃣ 9️⃣ 🔟')),
    K('큰 동물·작은 동물', '🐘', b('큰 동물', '🐘 🦒 🐋 🦏 🐻 🐎'), b('작은 동물', '🐜 🐭 🐞 🐝 🐥 🐸')),
    K('뜨거운 것·차가운 것', '🔥', b('뜨거워요', '🔥 ☀️ ♨️ ☕ 🌶️ 🍲'), b('차가워요', '❄️ 🧊 ⛄ 🍦 🥶 🍧')),
    K('병원·주방', '🩺', b('병원', '🩺 💉 💊 🩹 🚑 🏥'), b('주방', '🍳 🔪 🥄 🍴 🥣 🧂')),
    K('하늘·땅·바다 동물', '🦅', b('하늘', '🐦 🦅 🦉 🦜 🦋 🐝'), b('땅', '🐶 🐱 🐘 🦒 🐴 🐮'), b('바다', '🐟 🐬 🐳 🦈 🐙 🦀')),
    K('비 오는 날·맑은 날', '☔', b('비 오는 날', '☔ 🌧️ ⛈️ 🐸 🌂 💧'), b('맑은 날', '☀️ 😎 🕶️ 🌻 🌞 🏖️')),
    K('자음·모음', 'ㄱ', b('자음', 'ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ'), b('모음', 'ㅏ ㅓ ㅗ ㅜ ㅡ ㅣ')),
  ];

  G.sortData = KINDS; // 점검용
  G.register({
    id: 'sort', name: '분류하기', desc: '주제 20가지', icon: '🧺', cat: 'play', color: 'lemon', variants: KINDS.length,
    start(root, { hard, v }) {
      const k = KINDS[v];
      const bins = G.shuffle(k.b).slice(0, hard ? Math.min(3, k.b.length) : 2);
      const per = hard ? (bins.length >= 3 ? 4 : 5) : 3;
      const things = G.shuffle(bins.flatMap((c, ci) => G.shuffle(c.items).slice(0, per).map((e) => ({ e, ci }))));
      let left = things.length, miss = 0;
      const box = G.h('div', { class: 'fitbox tr' });
      const hint = G.h('div', { class: 'hint must' }, `${k.i} ${k.n} · 알맞은 상자에 끌어서 넣어요`);
      const binEls = bins.map((c, ci) => {
        const st = G.h('div', { class: 'st' });
        return { ci, st, el: G.h('div', { class: 'bin', style: 'background:' + BG[ci % BG.length] }, G.h('div', { class: 'lb' }, c.n), st) };
      });
      root.append(hint, box, G.h('div', { class: 'bins' }, binEls.map((x) => x.el)));
      const gr = G.bestGrid(things.length, box);
      const tray = G.h('div', { class: 'grid', style: `--c:${gr.c};--r:${gr.r}` });
      box.append(tray);
      things.forEach((t) => {
        const it = G.h('div', { class: 'it', role: 'button', 'aria-label': '그림' }, t.e);
        it.addEventListener('pointerdown', (ev) => {
          ev.preventDefault(); it.setPointerCapture(ev.pointerId);
          const sx = ev.clientX, sy = ev.clientY; it.classList.add('drag'); G.sfx.tap();
          const move = (e) => { it.style.transform = `translate(${e.clientX - sx}px,${e.clientY - sy}px) scale(1.15)`; };
          const up = (e) => {
            it.removeEventListener('pointermove', move); it.removeEventListener('pointerup', up); it.removeEventListener('pointercancel', up);
            it.classList.remove('drag');
            const hit = binEls.find((x) => { const r = x.el.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; });
            if (hit && hit.ci === t.ci) {
              G.sfx.ok(); hit.st.append(G.h('span', {}, t.e)); it.remove(); left--;
              if (left === 0) setTimeout(() => G.win({ stars: miss === 0 ? 3 : miss <= 2 ? 2 : 1, text: miss ? '다시 놓은 횟수 ' + miss + '번' : '한 번에 다 맞췄어요!' }), 500);
            } else {
              if (hit) { miss++; G.sfx.bad(); hit.el.classList.remove('shake'); void hit.el.offsetWidth; hit.el.classList.add('shake'); }
              it.style.transform = '';
            }
          };
          it.addEventListener('pointermove', move); it.addEventListener('pointerup', up); it.addEventListener('pointercancel', up);
        });
        tray.append(it);
      });
      return null;
    },
  });
})();
