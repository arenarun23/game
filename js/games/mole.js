// 두더지 잡기: 30초 동안 올라오는 두더지를 눌러요
(function () {
  'use strict';
  const TIME = 30;

  G.register({
    id: 'mole', name: '두더지 잡기', desc: '쏙 나오면 톡!', icon: '🐹', cat: 'play', color: 'orange',
    start(root) {
      let score = 0, left = TIME, running = false, spawn = 0, tick = 0;
      const timers = new Set();
      const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); };
      const sc = G.h('span', {}, '🐹 0'), tm = G.h('span', {}, '⏰ ' + TIME);
      const holes = Array.from({ length: 9 }, () => {
        const h = G.h('div', { class: 'hole' }, G.h('div', { class: 'm' }, '🐹'), G.h('button', { class: 'hit', 'aria-label': '두더지 구멍' }));
        h.querySelector('.hit').addEventListener('pointerdown', (e) => {
          e.preventDefault();
          if (!running || !h.classList.contains('up')) return;
          h.classList.remove('up'); h.querySelector('.m').textContent = '💥';
          score++; sc.textContent = '🐹 ' + score; G.sfx.pop();
          later(() => { h.querySelector('.m').textContent = '🐹'; }, 250);
        });
        return h;
      });
      const grid = G.h('div', { class: 'grid', style: '--c:3;--r:3' }, holes);
      const startBtn = G.h('button', { class: 'btn', onclick: begin }, '시작!');
      const over = G.h('div', { class: 'over' }, G.h('h2', {}, '두더지를 잡아요!'), G.h('div', { class: 'hint' }, `${TIME}초 동안 올라오는 두더지를 눌러요`), startBtn);
      function popOne() {
        const free = holes.filter((h) => !h.classList.contains('up'));
        if (!free.length) return;
        const h = G.pick(free); h.querySelector('.m').textContent = '🐹'; h.classList.add('up');
        later(() => h.classList.remove('up'), 1100 - (TIME - left) * 15);
      }
      function begin() {
        over.remove(); running = true; G.sfx.tap();
        spawn = setInterval(popOne, 650); tick = setInterval(() => {
          left--; tm.textContent = '⏰ ' + left;
          if (left <= 0) end();
        }, 1000);
        popOne();
      }
      function end() {
        running = false; clearInterval(spawn); clearInterval(tick);
        holes.forEach((h) => h.classList.remove('up'));
        G.win({ stars: score >= 18 ? 3 : score >= 10 ? 2 : 1, text: score + '마리를 잡았어요!' });
      }
      root.append(G.h('div', { class: 'hud' }, sc, tm), G.h('div', { class: 'fitbox' }, grid), over);
      return () => { running = false; clearInterval(spawn); clearInterval(tick); timers.forEach(clearTimeout); };
    },
  });
})();
