// 점 잇기: 1번부터 차례대로 눌러 그림을 완성한다
(function () {
  'use strict';
  const r1 = (n) => Math.round(n * 10) / 10;
  const star = Array.from({ length: 10 }, (_, k) => { const a = (-90 + 36 * k) * Math.PI / 180, r = k % 2 ? 19 : 44; return [r1(50 + r * Math.cos(a)), r1(54 + r * Math.sin(a))]; });
  const heart = Array.from({ length: 10 }, (_, k) => { const t = k * Math.PI / 5; return [r1(50 + 2.3 * 16 * Math.pow(Math.sin(t), 3)), r1(46 - 2.3 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)))]; });
  const PICS = [
    { name: '집', emoji: '🏠', fill: '#ffd6a5', pts: [[24, 88], [24, 60], [6, 60], [50, 12], [94, 60], [76, 60], [76, 88]] },
    { name: '별', emoji: '⭐', fill: '#fff1a8', pts: star },
    { name: '하트', emoji: '💖', fill: '#ffc1d6', pts: heart },
    { name: '돛단배', emoji: '⛵', fill: '#cfe8ff', pts: [[50, 10], [50, 62], [14, 62], [22, 86], [78, 86], [86, 62], [62, 62]] },
  ];
  let last = -1;
  const NS = 'http://www.w3.org/2000/svg';
  const el = (t, a) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };

  G.register({
    id: 'dots', name: '점 잇기', desc: '숫자 순서대로 이어요', icon: '🔢', cat: 'draw', color: 'sky',
    start(root) {
      last = (last + 1) % PICS.length;
      const pic = PICS[last], n = pic.pts.length;
      let next = 0, timer = 0;
      const svg = el('svg', { viewBox: '0 0 100 100', class: 'dots sq', role: 'img', 'aria-label': pic.name + ' 점 잇기' });
      const fillG = el('g', {}), lineG = el('g', {}), dotG = el('g', {});
      svg.append(fillG, lineG, dotG);
      const dots = pic.pts.map(([x, y], i) => {
        const g = el('g', { class: 'dot' + (i === 0 ? ' next' : '') });
        g.append(el('circle', { cx: x, cy: y, r: 9, fill: 'transparent' }), el('circle', { class: 'v', cx: x, cy: y, r: 5.2 }));
        const t = el('text', { x, y: y + 0.3 }); t.textContent = i + 1; g.append(t);
        g.addEventListener('click', () => tap(i, g));
        dotG.append(g); return g;
      });
      const line = (a, b) => lineG.append(el('line', { class: 'line', x1: a[0], y1: a[1], x2: b[0], y2: b[1] }));
      function tap(i, g) {
        if (i !== next) { G.sfx.bad(); g.classList.remove('shake'); void g.getBoundingClientRect(); g.classList.add('shake'); return; }
        G.sfx.tap();
        if (i > 0) line(pic.pts[i - 1], pic.pts[i]);
        dots[i].classList.remove('next'); dots[i].classList.add('done');
        next++;
        if (next < n) dots[next].classList.add('next');
        else {
          line(pic.pts[n - 1], pic.pts[0]);
          fillG.append(el('polygon', { points: pic.pts.map((p) => p.join(',')).join(' '), fill: pic.fill, opacity: 0.9 }));
          const em = el('text', { x: 50, y: 52, 'font-size': 26, 'text-anchor': 'middle', 'dominant-baseline': 'central' }); em.style.fontSize = '26px'; em.textContent = pic.emoji; fillG.append(em);
          timer = setTimeout(() => G.win({ stars: 1, text: '짝짝짝! ' + pic.name + ' 그림 완성!' }), 900);
        }
      }
      root.append(G.h('div', { class: 'hint' }, '1번부터 차례대로 눌러요'), G.h('div', { class: 'fitbox' }, svg));
      return () => clearTimeout(timer);
    },
  });
})();
