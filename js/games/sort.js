// 분류하기: 분류 주제 20종. 쉬운 단계는 상자 2~3개(그림 6개), 어려운 단계는 상자 3~4개(그림 12개).
(function () {
  'use strict';
  const S = (id, name, s) => ({ id, name, items: s.trim().split(/\s+/) });
  const CATS = [
    S('animal', '동물', '🐶 🐱 🐰 🐻 🦊 🐼 🐸 🐵 🦁 🐮'),
    S('fruit', '과일', '🍎 🍌 🍇 🍓 🍊 🍉 🍑 🍒 🍋 🍍'),
    S('ride', '탈것', '🚗 🚌 🚲 ✈️ 🚂 🚀 ⛵ 🚕 🚒 🚜'),
    S('veg', '채소', '🥕 🌽 🥔 🍅 🥦 🍆 🥒 🧅 🧄 🥬'),
    S('sea', '바다 친구', '🐟 🐳 🐬 🐙 🦀 🦐 🐢 🦈 🐚 🦑'),
    S('bug', '곤충', '🐝 🦋 🐞 🐜 🐛 🦗 🕷️ 🐌 🦂 🦟'),
    S('snack', '간식', '🍦 🍩 🍪 🍰 🍫 🍬 🍿 🧁 🍭 🥞'),
    S('meal', '밥·반찬', '🍚 🍜 🍲 🍱 🍛 🍝 🥗 🍳 🥘 🍣'),
    S('ball', '운동', '⚽ 🏀 ⚾ 🎾 🏐 🏓 🥊 🎳 ⛸️ 🏸'),
    S('music', '악기', '🎹 🎸 🎻 🥁 🎺 🎷 🎤 🔔 📯 🪘'),
    S('cloth', '옷', '👕 👖 👗 🧢 🧦 👟 🧤 🧣 👓 👜'),
    S('weather', '날씨', '☀️ 🌙 ☁️ 🌧️ ❄️ ⚡ 🌈 🌪️ ☂️ ⛄'),
    S('plant', '꽃·나무', '🌸 🌹 🌻 🌷 🌳 🌵 🍀 🍁 🌴 🌿'),
    S('school', '학용품', '✏️ 📚 ✂️ 📏 🖍️ 📎 🎒 📐 🔍 📓'),
    S('toy', '장난감', '🧸 🎈 🪁 🎲 🧩 🪀 🎮 🎠 🪆 🛝'),
    S('home', '집 안 물건', '🛏️ 🪑 🚪 🛁 📺 ⏰ 🔑 💡 🧹 🪞'),
    S('space', '우주', '🚀 🪐 🌍 🌙 ⭐ ☄️ 👽 🛸 🔭 🌞'),
    S('bird', '새', '🐦 🦆 🦉 🦅 🦜 🐧 🕊️ 🐔 🦢 🦩'),
    S('drink', '마실 것', '🥛 🧃 ☕ 🍵 🥤 🧋 🍶 🍼 🧉 🫖'),
    S('body', '몸', '👁️ 👂 👃 👄 ✋ 🦶 🦷 🧠 💪 🦴'),
  ];
  const COLORS = ['var(--pink)', 'var(--lemon)', 'var(--sky)', 'var(--mint)'];

  G.register({
    id: 'sort', name: '분류하기', desc: '알맞은 상자에 쏙', icon: '🧺', cat: 'play', color: 'lemon',
    start(root, mode) {
      const hard = mode === 'hard', land = innerWidth > innerHeight;
      const nb = hard ? (land ? 4 : 3) : (G.bag('sort-n', 2) ? 3 : 2);
      const per = hard ? (nb === 4 ? 3 : 4) : (nb === 2 ? 3 : 2);
      // 같은 그림이 두 상자에 겹치지 않게 (예: 🚀 은 탈것·우주 둘 다)
      let cats = [], used = new Set();
      for (const c of G.shuffle(CATS)) {
        if (cats.length === nb) break;
        if (c.items.some((x) => used.has(x))) continue;
        cats.push(c); c.items.forEach((x) => used.add(x));
      }
      const things = [];
      cats.forEach((c, ci) => G.shuffle(c.items).slice(0, per).forEach((e) => things.push({ e, ci })));
      const seen = new Map();   // 그림이 다른 상자 것과 겹치면 제외
      const uniq = things.filter((t) => { if (seen.has(t.e)) return false; seen.set(t.e, 1); return true; });
      let left = uniq.length, miss = 0;
      const tray = G.h('div', { class: 'tray' + (uniq.length > 8 ? ' dense' : '') });
      const bins = cats.map((c, i) => {
        const st = G.h('div', { class: 'st' });
        const el = G.h('div', { class: 'bin', style: 'background:' + COLORS[i % 4] }, G.h('div', { class: 'lb' }, c.name), st);
        return { ci: i, el, st };
      });
      G.shuffle(uniq).forEach((t) => {
        const it = G.h('div', { class: 'it', role: 'button', 'aria-label': '그림' }, t.e);
        it.addEventListener('pointerdown', (ev) => {
          ev.preventDefault(); it.setPointerCapture(ev.pointerId);
          const sx = ev.clientX, sy = ev.clientY; it.classList.add('drag'); G.sfx.tap();
          const move = (e) => { it.style.transform = `translate(${e.clientX - sx}px,${e.clientY - sy}px) scale(1.15)`; };
          const up = (e) => {
            it.removeEventListener('pointermove', move); it.removeEventListener('pointerup', up); it.removeEventListener('pointercancel', up);
            it.classList.remove('drag');
            const hit = bins.find((b) => { const r = b.el.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; });
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
      root.append(G.h('div', { class: 'hint' }, '같은 친구끼리 상자에 넣어요'), tray, G.h('div', { class: 'bins' }, bins.map((b) => b.el)));
      return null;
    },
  });
})();
