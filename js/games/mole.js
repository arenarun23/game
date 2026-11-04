// 두더지 잡기 (20가지 규칙)
//  쉬움: 구멍 9개, 느리게, 방해꾼 적음 / 어려움: 구멍 12개, 빠르게, 방해꾼 많음
(function () {
  'use strict';
  const t = (e, l) => ({ e, l: l || '', t: 1 }), d = (e, l) => ({ e, l: l || '' });
  const A = (s) => s.split(' ').map((x) => { const [e, l] = x.split(':'); return d(e, l); });
  const F = (n, i, hint, items) => ({ n, i, hint, items });                  // 정해진 목표
  const Q = (n, i, hint, items) => ({ n, i, hint, items, ask: true });        // 목표가 계속 바뀜
  const KINDS = [
    F('두더지', '🐹', '두더지를 잡아요', [t('🐹')]),
    F('토끼', '🐰', '토끼를 잡아요', [t('🐰')]),
    F('개구리', '🐸', '개구리를 잡아요', [t('🐸')]),
    F('병아리', '🐥', '병아리를 잡아요', [t('🐥')]),
    F('문어', '🐙', '문어를 잡아요', [t('🐙')]),
    F('생쥐', '🐭', '생쥐를 잡아요', [t('🐭')]),
    F('외계인', '👽', '외계인을 잡아요', [t('👽')]),
    F('별 따기', '⭐', '별만 잡아요! ☄️는 안 돼요', [t('⭐'), d('☄️')]),
    F('사과 따기', '🍎', '사과만 따요! 🐛는 안 돼요', [t('🍎'), d('🐛')]),
    F('나비 잡기', '🦋', '나비만 잡아요! 🐝는 안 돼요', [t('🦋'), d('🐝')]),
    F('유령 쫓기', '👻', '유령만 잡아요! 🎃는 안 돼요', [t('👻'), d('🎃')]),
    F('고양이 찾기', '🐱', '고양이만 잡아요! 🐶는 안 돼요', [t('🐱'), d('🐶')]),
    Q('숫자 찾기', '🔢', '', A('1️⃣:1 2️⃣:2 3️⃣:3 4️⃣:4 5️⃣:5 6️⃣:6 7️⃣:7 8️⃣:8 9️⃣:9')),
    Q('과일 이름', '🍌', '', A('🍎:사과 🍌:바나나 🍇:포도 🍓:딸기 🍊:귤 🍉:수박')),
    Q('동물 이름', '🐶', '', A('🐶:강아지 🐱:고양이 🐰:토끼 🐻:곰 🐸:개구리 🐵:원숭이')),
    Q('색깔 찾기', '🔴', '', A('🔴:빨강 🟡:노랑 🔵:파랑 🟢:초록 🟣:보라 🟠:주황')),
    Q('탈것 이름', '🚌', '', A('🚗:자동차 🚌:버스 🚲:자전거 ✈️:비행기 🚂:기차 🚀:로켓')),
    Q('모양 이름', '🔺', '', A('🔺:세모 🟦:네모 🔴:동그라미 ⭐:별 💖:하트 🌙:달')),
    Q('같은 그림', '👀', '', A('🐶: 🍎: 🚗: ⭐: 🐟: 🌸: 🍌: 🐱:')),
    F('짝수만', '2\uFE0F\u20E3', '짝수만 눌러요 (2 4 6 8)', [1, 2, 3, 4, 5, 6, 7, 8, 9].map((x) => ({ e: x + '\uFE0F\u20E3', l: String(x), t: x % 2 === 0 ? 1 : 0 }))),
  ];
  const TIME = 30;
  const MODE = {
    easy: { c: 3, r: 3, spawn: 850, up: 1500, pT: 0.7, thr: [14, 8], ask: 9 },
    hard: { c: 4, r: 3, spawn: 520, up: 950, pT: 0.55, thr: [20, 11], ask: 6 },
  };

  G.register({
    id: 'mole', name: '두더지 잡기', desc: '규칙 20가지', icon: '🐹', cat: 'play', color: 'orange', variants: KINDS.length,
    start(root, { hard, v }) {
      const k = KINDS[v], M = MODE[hard ? 'hard' : 'easy'];
      let items = k.items;
      if (!k.ask && !items.some((x) => !x.t) && hard) items = items.concat([d('💣')]); // 어려움: 방해꾼 추가
      let score = 0, left = TIME, running = false, spawn = 0, tick = 0, target = null;
      const timers = new Set();
      const later = (fn, ms) => { const x = setTimeout(() => { timers.delete(x); fn(); }, ms); timers.add(x); };
      const isT = (it) => (k.ask ? it === target : !!it.t);
      const sc = G.h('span', {}, '⭐ 0'), tm = G.h('span', {}, '⏰ ' + TIME);
      const ask = G.h('div', { class: 'ask hint must' });
      function setAsk() {
        if (k.ask) { const prev = target; do { target = G.pick(items); } while (target === prev && items.length > 1);
          ask.replaceChildren('눌러요 👉 ', G.h('b', {}, target.e), target.l ? ' ' + target.l : ''); G.speak(target.l); }
        else ask.textContent = k.hint;
      }
      const holes = Array.from({ length: M.c * M.r }, () => {
        const h = G.h('div', { class: 'hole' }, G.h('div', { class: 'm' }, ''), G.h('button', { class: 'hit', 'aria-label': '구멍' }));
        h.querySelector('.hit').addEventListener('pointerdown', (e) => {
          e.preventDefault();
          if (!running || !h.classList.contains('up')) return;
          const m = h.querySelector('.m'), good = h._t;
          h.classList.remove('up');
          if (good) { score++; G.sfx.pop(); m.textContent = '✨'; } else { score = Math.max(0, score - 1); G.sfx.bad(); m.textContent = '💢'; }
          sc.textContent = '⭐ ' + score;
          later(() => { m.textContent = ''; }, 280);
        });
        return h;
      });
      const grid = G.h('div', { class: 'grid', style: `--c:${M.c};--r:${M.r}` }, holes);
      const startBtn = G.h('button', { class: 'btn', onclick: begin }, '시작!');
      const over = G.h('div', { class: 'over' }, G.h('h2', {}, `${k.i} ${k.n}`), G.h('div', { class: 'hint must' }, k.ask ? `${TIME}초 동안 시키는 그림만 눌러요` : k.hint), startBtn);
      function popOne() {
        const free = holes.filter((h) => !h.classList.contains('up'));
        if (!free.length) return;
        const goods = items.filter(isT), bads = items.filter((x) => !isT(x));
        const it = !bads.length || (goods.length && Math.random() < M.pT) ? G.pick(goods) : G.pick(bads);
        const h = G.pick(free); h._t = isT(it); h.querySelector('.m').textContent = it.e; h.classList.add('up');
        later(() => h.classList.remove('up'), M.up - (TIME - left) * 12);
      }
      function begin() {
        over.remove(); running = true; G.sfx.tap(); setAsk();
        spawn = setInterval(popOne, M.spawn);
        tick = setInterval(() => {
          left--; tm.textContent = '⏰ ' + left;
          if (k.ask && left > 0 && (TIME - left) % M.ask === 0) setAsk();
          if (left <= 0) end();
        }, 1000);
        popOne();
      }
      function end() {
        running = false; clearInterval(spawn); clearInterval(tick);
        holes.forEach((h) => h.classList.remove('up'));
        G.win({ stars: score >= M.thr[0] ? 3 : score >= M.thr[1] ? 2 : 1, text: score + '점!' });
      }
      ask.textContent = k.ask ? '눌러요 👉 ?' : k.hint;
      root.append(ask, G.h('div', { class: 'hud' }, sc, tm), G.h('div', { class: 'fitbox' }, grid), over);
      return () => { running = false; clearInterval(spawn); clearInterval(tick); timers.forEach(clearTimeout); };
    },
  });
})();
