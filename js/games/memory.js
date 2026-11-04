// 짝 맞추기 (20가지 주제)
//  쉬움: 3~6쌍, 시작할 때 카드를 잠깐 보여 줌 / 어려움: 6~12쌍, 미리 보기 없음
(function () {
  'use strict';
  const T = (n, i, s) => ({ n, i, f: s.split(' ') });
  const THEMES = [
    T('동물', '🐶', '🐶 🐱 🐰 🐻 🦊 🐼 🐸 🐵 🦁 🐯 🐮 🐷 🐔 🐧'),
    T('과일', '🍎', '🍎 🍌 🍇 🍓 🍊 🍉 🍑 🍒 🍍 🥝 🍋 🍐'),
    T('탈것', '🚗', '🚗 🚌 🚲 ✈️ 🚂 🚀 ⛵ 🚕 🚒 🚑 🚜 🛵'),
    T('바다 친구', '🐠', '🐟 🐠 🐡 🐬 🐳 🦈 🐙 🦀 🦞 🐢 🦑 🐚'),
    T('곤충', '🐝', '🐝 🐞 🦋 🐛 🐜 🦗 🐌 🦟 🪲 🪰 🦂 🕷️'),
    T('채소', '🥕', '🥕 🌽 🍅 🥦 🥒 🍆 🥔 🧅 🌶️ 🍄 🥬 🫑'),
    T('간식', '🍪', '🍪 🍩 🍦 🍰 🧁 🍫 🍭 🍿 🥨 🍕 🍔 🍟'),
    T('하늘과 날씨', '🌈', '☀️ 🌙 ⭐ ☁️ 🌈 ⚡ ❄️ 🔥 💧 ☔ 🌸 🍀'),
    T('꽃과 나무', '🌻', '🌹 🌻 🌷 🌼 🌸 🌺 🌵 🌴 🍀 🍁 🌲 🌱'),
    T('운동', '⚽', '⚽ 🏀 🏈 ⚾ 🎾 🏐 🏓 🥊 ⛳ 🎳 🏸 🛹'),
    T('옷과 물건', '👕', '👕 👖 👗 🧢 👟 🧤 🧣 👒 🎒 👓 ⌚ 🕶️'),
    T('악기와 소리', '🎹', '🎹 🎸 🥁 🎺 🎻 🎷 🔔 🎤 🎧 🎵 🎼 📻'),
    T('얼굴 표정', '😀', '😀 😂 😍 😎 😴 😡 😭 🤔 😱 🥳 🤩 😇'),
    T('하트 색깔', '💖', '❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💗 💖 💝'),
    T('동그라미 색깔', '🔴', '🔴 🟠 🟡 🟢 🔵 🟣 🟤 ⚫ ⚪ 🟥 🟦 🟩'),
    T('숫자', '1️⃣', '1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣ 8️⃣ 9️⃣ 🔟 ➕ ➖'),
    T('학용품', '✏️', '✏️ 📏 📚 🖍️ ✂️ 📎 📐 📖 📒 🖊️ 📌 🔍'),
    T('우주', '🪐', '🌍 🌙 ☀️ ⭐ 🪐 🚀 🛸 👽 ☄️ 🌠 🔭 🌌'),
    T('우리 집', '🏠', '🏠 🛏️ 🚪 🪑 🛁 🚿 🧸 🕰️ 🪞 📺 💡 🔑'),
    T('새와 숲 친구', '🦉', '🐦 🦆 🦉 🦅 🦜 🦢 🦩 🐓 🐿️ 🦔 🦌 🐺'),
  ];
  const LEVELS = { easy: [3, 4, 5, 6], hard: [6, 8, 10, 12] };
  const lv = { easy: 0, hard: 0 };

  G.register({
    id: 'memory', name: '짝 맞추기', desc: '주제 20가지', icon: '🃏', cat: 'match', color: 'lilac', variants: THEMES.length,
    start(root, { hard, v }) {
      const th = THEMES[v], mk = hard ? 'hard' : 'easy', pairs = LEVELS[mk][lv[mk]];
      const faces = G.shuffle(th.f).slice(0, pairs), deck = G.shuffle(faces.concat(faces));
      const timers = [];
      let first = null, lock = false, moves = 0, found = 0;
      const hint = G.h('div', { class: 'hint must' }, `${th.i} ${th.n} · ${pairs}쌍`);
      const box = G.h('div', { class: 'fitbox' });
      root.append(hint, box);
      const gr = G.bestGrid(deck.length, box);
      const grid = G.h('div', { class: 'grid', style: `--c:${gr.c};--r:${gr.r}` });
      const cards = deck.map((f) => {
        const card = G.h('button', { class: 'mcard', 'aria-label': '카드' }, G.h('div', { class: 'in' }, G.h('div', { class: 'b' }, '?'), G.h('div', { class: 'f' }, f)));
        card.dataset.f = f; card.addEventListener('click', () => flip(card)); grid.append(card); return card;
      });
      box.append(grid);
      function flip(c) {
        if (lock || c.classList.contains('open') || c.classList.contains('done')) return;
        G.sfx.flip(); c.classList.add('open');
        if (!first) { first = c; return; }
        moves++;
        if (first.dataset.f === c.dataset.f) {
          const a = first; first = null;
          timers.push(setTimeout(() => { a.classList.replace('open', 'done'); c.classList.replace('open', 'done'); G.sfx.ok(); found++;
            if (found === pairs) timers.push(setTimeout(finish, 500)); }, 350));
        } else {
          lock = true; const a = first; first = null;
          timers.push(setTimeout(() => { a.classList.remove('open'); c.classList.remove('open'); lock = false; G.sfx.bad(); }, hard ? 700 : 950));
        }
      }
      function finish() {
        const stars = moves <= pairs + (hard ? 3 : 2) ? 3 : moves <= pairs * 2 ? 2 : 1;
        const up = lv[mk] < LEVELS[mk].length - 1; if (up) lv[mk]++;
        G.win({ stars, text: `${moves}번 만에 다 찾았어요!` + (up ? ' 다음엔 카드가 더 많아져요.' : '') });
      }
      if (!hard) { // 쉬움: 처음에 잠깐 보여 준다
        lock = true; hint.textContent = '👀 잘 보고 기억해요!';
        timers.push(setTimeout(() => cards.forEach((c) => c.classList.add('open')), 300));
        timers.push(setTimeout(() => { cards.forEach((c) => c.classList.remove('open')); lock = false; hint.textContent = `${th.i} ${th.n} · ${pairs}쌍 · 같은 그림 두 장을 찾아요`; }, 2300 + pairs * 200));
      }
      return () => timers.forEach(clearTimeout);
    },
  });
})();
