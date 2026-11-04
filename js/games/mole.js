// 두더지 잡기: 캐릭터 20종. 쉬운 단계는 3×3·느리게, 어려운 단계는 4×3·빠르게 + 누르면 안 되는 함정 + 황금(3점).
(function () {
  'use strict';
  // [잡을 것, 함정, 이름, 배경(0 풀밭 1 모래 2 눈 3 밤 4 사탕)]
  const THEMES = [
    ['🐹', '🐱', '두더지', 0], ['🐸', '🐢', '개구리', 0], ['🐰', '🐺', '토끼', 2], ['🐭', '🐱', '쥐', 1], ['🐥', '🦊', '병아리', 0],
    ['🐻', '🐝', '곰', 0], ['🐧', '🦈', '펭귄', 2], ['🐙', '🦀', '문어', 3], ['👻', '🎃', '유령', 3], ['🐷', '🐺', '돼지', 4],
    ['🦆', '🐍', '오리', 0], ['🐵', '🐯', '원숭이', 1], ['🐼', '🐯', '판다', 2], ['🦄', '👹', '유니콘', 4], ['🐮', '🐺', '소', 0],
    ['🐶', '🐱', '강아지', 1], ['🐱', '🐶', '고양이', 4], ['🦊', '🐰', '여우', 1], ['🐲', '🐢', '용', 3], ['🤖', '👾', '로봇', 3],
  ];
  const BG = [['#b9e3a1', '#8fc473'], ['#f4e1b0', '#d9bd7a'], ['#e3f2ff', '#b7d7f2'], ['#5b6aa8', '#3d4a80'], ['#ffd0e6', '#f2a3c8']];

  G.register({
    id: 'mole', name: '두더지 잡기', desc: '쏙 나오면 톡!', icon: '🐹', cat: 'play', color: 'orange',
    start(root, mode) {
      const hard = mode === 'hard', TIME = 30;
      const th = THEMES[G.bag('mole', THEMES.length)], [GOOD, BAD, NAME] = th, bg = BG[th[3]];
      let score = 0, left = TIME, running = false, spawn = 0, tick = 0;
      const timers = new Set();
      const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); };
      const sc = G.h('span', {}, GOOD + ' 0'), tm = G.h('span', {}, '⏰ ' + TIME);
      const land = innerWidth > innerHeight;
      const cols = hard ? (land ? 4 : 3) : 3, rows = hard ? (land ? 3 : 4) : 3;
      const holes = Array.from({ length: cols * rows }, () => {
        const h = G.h('div', { class: 'hole', style: `background:${bg[0]};border-color:${bg[1]}` }, G.h('div', { class: 'm' }, GOOD), G.h('button', { class: 'hit', 'aria-label': NAME + ' 구멍' }));
        h.kind = 'good';
        h.querySelector('.hit').addEventListener('pointerdown', (e) => {
          e.preventDefault();
          if (!running || !h.classList.contains('up')) return;
          h.classList.remove('up'); const m = h.querySelector('.m');
          if (h.kind === 'bad') { score = Math.max(0, score - 2); m.textContent = '💢'; G.sfx.bad(); h.classList.remove('shake'); void h.offsetWidth; h.classList.add('shake'); }
          else { score += h.kind === 'gold' ? 3 : 1; m.textContent = h.kind === 'gold' ? '🌟' : '💥'; G.sfx.pop(); }
          sc.textContent = GOOD + ' ' + score;
          later(() => { m.textContent = GOOD; m.classList.remove('gold'); }, 250);
        });
        return h;
      });
      const grid = G.h('div', { class: 'grid', style: `--c:${cols};--r:${rows}` }, holes);
      const startBtn = G.h('button', { class: 'btn', onclick: begin }, '시작!');
      const info = hard ? `${TIME}초 · ${GOOD}는 톡! ${BAD}는 누르면 안 돼요! ✨는 3점!` : `${TIME}초 동안 올라오는 ${NAME}를 눌러요`;
      const over = G.h('div', { class: 'over' }, G.h('h2', {}, NAME + ' 잡기!'), G.h('div', { class: 'hint', style: 'display:block' }, info), startBtn);
      function popOne() {
        const free = holes.filter((h) => !h.classList.contains('up'));
        if (!free.length) return;
        const h = G.pick(free), m = h.querySelector('.m');
        const r = Math.random();
        h.kind = hard ? (r < 0.22 ? 'bad' : r < 0.3 ? 'gold' : 'good') : 'good';
        m.textContent = h.kind === 'bad' ? BAD : GOOD; m.classList.toggle('gold', h.kind === 'gold');
        h.classList.add('up');
        later(() => h.classList.remove('up'), (hard ? 850 : 1100) - (TIME - left) * (hard ? 12 : 15));
      }
      function begin() {
        over.remove(); running = true; G.sfx.tap();
        spawn = setInterval(popOne, hard ? 480 : 650); tick = setInterval(() => {
          left--; tm.textContent = '⏰ ' + left;
          if (left <= 0) end();
        }, 1000);
        popOne();
      }
      function end() {
        running = false; clearInterval(spawn); clearInterval(tick);
        holes.forEach((h) => h.classList.remove('up'));
        const t = hard ? [25, 14] : [18, 10];
        G.win({ stars: score >= t[0] ? 3 : score >= t[1] ? 2 : 1, text: `${score}점! ${NAME}를 잘 잡았어요!` });
      }
      root.append(G.h('div', { class: 'hud' }, sc, tm), G.h('div', { class: 'fitbox' }, grid), over);
      return () => { running = false; clearInterval(spawn); clearInterval(tick); timers.forEach(clearTimeout); };
    },
  });
})();
