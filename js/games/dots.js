// 점 잇기 (20가지 모양)
//  쉬움: 점이 적고 다음 점까지 점선 안내 / 어려움: 점이 더 많고 안내 없음
(function () {
  'use strict';
  const r1 = (n) => Math.round(n * 10) / 10;
  const star = Array.from({ length: 10 }, (_, k) => { const a = (-90 + 36 * k) * Math.PI / 180, r = k % 2 ? 19 : 44; return [r1(50 + r * Math.cos(a)), r1(54 + r * Math.sin(a))]; });
  const heart = Array.from({ length: 10 }, (_, k) => { const t = k * Math.PI / 5; return [r1(50 + 2.3 * 16 * Math.pow(Math.sin(t), 3)), r1(46 - 2.3 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)))]; });
  const PICS = [
    { n: '집', e: '🏠', f: '#ffd6a5', p: [[24, 88], [24, 60], [6, 60], [50, 12], [94, 60], [76, 60], [76, 88]] },
    { n: '별', e: '⭐', f: '#fff1a8', p: star },
    { n: '하트', e: '💖', f: '#ffc1d6', p: heart },
    { n: '돛단배', e: '⛵', f: '#cfe8ff', p: [[50, 10], [50, 62], [14, 62], [22, 86], [78, 86], [86, 62], [62, 62]] },
    { n: '물고기', e: '🐟', f: '#bfe6ff', p: [[10, 50], [28, 32], [52, 28], [70, 40], [88, 26], [88, 74], [70, 60], [52, 72], [28, 68]] },
    { n: '나무', e: '🌲', f: '#c5efc9', p: [[50, 8], [74, 36], [62, 36], [82, 60], [56, 60], [56, 90], [44, 90], [44, 60], [18, 60], [38, 36], [26, 36]] },
    { n: '화살표', e: '⬆️', f: '#ffd9c9', p: [[50, 8], [84, 44], [62, 44], [62, 90], [38, 90], [38, 44], [16, 44]] },
    { n: '보석', e: '💎', f: '#d6e9ff', p: [[30, 12], [70, 12], [90, 38], [50, 90], [10, 38]] },
    { n: '왕관', e: '👑', f: '#ffe9a0', p: [[10, 80], [10, 32], [30, 52], [50, 18], [70, 52], [90, 32], [90, 80]] },
    { n: '고양이', e: '🐱', f: '#ffe0b8', p: [[16, 86], [12, 20], [36, 38], [64, 38], [88, 20], [84, 86], [50, 94]] },
    { n: '컵', e: '☕', f: '#ffe0cc', p: [[18, 14], [78, 14], [78, 30], [92, 30], [92, 62], [78, 62], [78, 86], [18, 86]] },
    { n: '깃발', e: '🚩', f: '#ffc9c9', p: [[20, 8], [84, 28], [34, 50], [34, 92], [20, 92]] },
    { n: '로켓', e: '🚀', f: '#e3d6ff', p: [[50, 6], [66, 26], [66, 60], [84, 78], [84, 90], [62, 80], [38, 80], [16, 90], [16, 78], [34, 60], [34, 26]] },
    { n: '초승달', e: '🌙', f: '#fff4b8', p: [[60, 10], [34, 16], [16, 36], [12, 60], [24, 80], [46, 90], [70, 88], [56, 76], [44, 60], [44, 42], [52, 26]] },
    { n: '버섯', e: '🍄', f: '#ffd0d0', p: [[50, 8], [82, 24], [92, 52], [64, 52], [64, 88], [36, 88], [36, 52], [8, 52], [18, 24]] },
    { n: '번개', e: '⚡', f: '#fff1a8', p: [[60, 6], [24, 52], [46, 52], [38, 94], [78, 42], [54, 42], [74, 6]] },
    { n: '물방울', e: '💧', f: '#bfe6ff', p: [[50, 6], [66, 34], [78, 56], [76, 76], [62, 90], [38, 90], [24, 76], [22, 56], [34, 34]] },
    { n: '더하기', e: '➕', f: '#c9f2e0', p: [[38, 8], [62, 8], [62, 38], [92, 38], [92, 62], [62, 62], [62, 92], [38, 92], [38, 62], [8, 62], [8, 38], [38, 38]] },
    { n: '자동차', e: '🚗', f: '#ffc9c9', p: [[8, 68], [8, 52], [26, 42], [38, 24], [68, 24], [80, 42], [94, 50], [94, 68]] },
    { n: '아이스크림', e: '🍦', f: '#ffd6e8', p: [[50, 92], [26, 54], [24, 40], [32, 24], [50, 12], [68, 24], [76, 40], [74, 54]] },
  ];
  // 어려움: 긴 변(26 이상)의 가운데에 점을 하나씩 더 찍는다
  const densify = (pts) => {
    const mids = []; const far = (m) => pts.concat(mids).every((q) => Math.hypot(q[0] - m[0], q[1] - m[1]) >= 12);
    const add = pts.map((a, i) => { const b = pts[(i + 1) % pts.length]; if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 26) return null; const m = [r1((a[0] + b[0]) / 2), r1((a[1] + b[1]) / 2)]; if (!far(m)) return null; mids.push(m); return m; });
    const out = []; pts.forEach((a, i) => { out.push(a); if (add[i]) out.push(add[i]); }); return out;
  };
  PICS.forEach((q) => { q.hard = densify(q.p); });
  G.dotsData = PICS; // 점검용

  const NS = 'http://www.w3.org/2000/svg';
  const el = (t, a) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };

  G.register({
    id: 'dots', name: '점 잇기', desc: '모양 20가지', icon: '🔢', cat: 'draw', color: 'sky', variants: PICS.length,
    start(root, { hard, v }) {
      const pic = PICS[v], pts = hard ? pic.hard : pic.p, n = pts.length;
      let next = 0, timer = 0;
      const svg = el('svg', { viewBox: '0 0 100 100', class: 'dots sq', role: 'img', 'aria-label': pic.n + ' 점 잇기' });
      const fillG = el('g', {}), lineG = el('g', {}), guide = el('line', { class: 'guide', x1: 0, y1: 0, x2: 0, y2: 0, visibility: 'hidden' }), dotG = el('g', {});
      svg.append(fillG, lineG, guide, dotG);
      const dots = pts.map(([x, y], i) => {
        const g = el('g', { class: 'dot' + (i === 0 ? ' next' : '') });
        g.append(el('circle', { cx: x, cy: y, r: 9, fill: 'transparent' }), el('circle', { class: 'v', cx: x, cy: y, r: 5.2 }));
        const t = el('text', { x, y: y + 0.3 }); t.textContent = i + 1; g.append(t);
        g.addEventListener('click', () => tap(i, g));
        dotG.append(g); return g;
      });
      const line = (a, b) => lineG.append(el('line', { class: 'line', x1: a[0], y1: a[1], x2: b[0], y2: b[1] }));
      function showGuide() {
        if (hard || next === 0 || next >= n) { guide.setAttribute('visibility', 'hidden'); return; }
        const a = pts[next - 1], b = pts[next];
        guide.setAttribute('x1', a[0]); guide.setAttribute('y1', a[1]); guide.setAttribute('x2', b[0]); guide.setAttribute('y2', b[1]); guide.setAttribute('visibility', 'visible');
      }
      function tap(i, g) {
        if (i !== next) { G.sfx.bad(); g.classList.remove('shake'); void g.getBoundingClientRect(); g.classList.add('shake'); return; }
        G.sfx.tap();
        if (i > 0) line(pts[i - 1], pts[i]);
        dots[i].classList.remove('next'); dots[i].classList.add('done');
        next++;
        showGuide();
        if (next < n) dots[next].classList.add('next');
        else {
          line(pts[n - 1], pts[0]);
          fillG.append(el('polygon', { points: pts.map((p) => p.join(',')).join(' '), fill: pic.f, opacity: 0.9 }));
          const em = el('text', { x: 50, y: 52, 'text-anchor': 'middle', 'dominant-baseline': 'central' }); em.style.fontSize = '26px'; em.textContent = pic.e; fillG.append(em);
          timer = setTimeout(() => G.win({ stars: hard ? 3 : 1, text: '짝짝짝! ' + pic.n + ' 그림 완성!' }), 900);
        }
      }
      root.append(G.h('div', { class: 'hint must' }, `🔢 ${pic.n} · 1번부터 차례대로 눌러요 (${n}개)`), G.h('div', { class: 'fitbox' }, svg));
      return () => clearTimeout(timer);
    },
  });
})();
