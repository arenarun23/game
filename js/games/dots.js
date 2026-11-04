// 점 잇기: 그림 20종. 쉬운 단계는 점 8~12개, 어려운 단계는 점이 2배(16~24개).
(function () {
  'use strict';
  const r1 = (n) => Math.round(n * 10) / 10;
  const polar = (n, f) => Array.from({ length: n }, (_, k) => { const a = (-90 + (360 / n) * k) * Math.PI / 180, r = f(k, n); return [r1(50 + r * Math.cos(a)), r1(52 + r * Math.sin(a))]; });
  const heart = (n) => Array.from({ length: n }, (_, k) => { const t = k * 2 * Math.PI / n; return [r1(50 + 2.3 * 16 * Math.pow(Math.sin(t), 3)), r1(46 - 2.3 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)))]; });
  // 변마다 가운데 점을 하나씩 더해 점 수를 2배로
  const split = (pts) => pts.flatMap((p, i) => { const q = pts[(i + 1) % pts.length]; return [p, [r1((p[0] + q[0]) / 2), r1((p[1] + q[1]) / 2)]]; });

  // gen(n): 점 수를 받아 그리는 그림 / base: 기본 모양(8개 미만이면 쉬운 단계에서도 한 번 나눔)
  const PICS = [
    { n: '별', e: '⭐', f: '#fff1a8', gen: (n) => polar(n, (k) => (k % 2 ? 19 : 44)) },
    { n: '하트', e: '💖', f: '#ffc1d6', gen: heart },
    { n: '집', e: '🏠', f: '#ffd6a5', base: [[24, 88], [24, 60], [6, 60], [50, 12], [94, 60], [76, 60], [76, 88]] },
    { n: '돛단배', e: '⛵', f: '#cfe8ff', base: [[50, 10], [50, 62], [14, 62], [22, 86], [78, 86], [86, 62], [62, 62]] },
    { n: '연', e: '🪁', f: '#ffe0b8', base: [[50, 6], [84, 44], [50, 92], [16, 44]] },
    { n: '로켓', e: '🚀', f: '#e3d6ff', base: [[50, 6], [66, 30], [66, 66], [80, 84], [60, 78], [50, 94], [40, 78], [20, 84], [34, 66], [34, 30]] },
    { n: '나무', e: '🎄', f: '#c9f2e0', base: [[50, 8], [76, 40], [62, 40], [84, 70], [56, 70], [56, 92], [44, 92], [44, 70], [16, 70], [38, 40], [24, 40]] },
    { n: '왕관', e: '👑', f: '#fff4b8', base: [[10, 76], [10, 34], [30, 52], [50, 22], [70, 52], [90, 34], [90, 76]] },
    { n: '번개', e: '⚡', f: '#fff1a8', base: [[58, 6], [24, 56], [46, 56], [38, 94], [78, 40], [54, 40]] },
    { n: '화살표', e: '⬆️', f: '#cfe8ff', base: [[50, 6], [86, 44], [62, 44], [62, 92], [38, 92], [38, 44], [14, 44]] },
    { n: '더하기', e: '➕', f: '#ffd6e0', base: [[38, 10], [62, 10], [62, 38], [90, 38], [90, 62], [62, 62], [62, 90], [38, 90], [38, 62], [10, 62], [10, 38], [38, 38]] },
    { n: '해님', e: '☀️', f: '#fff4b8', gen: (n) => polar(n, (k) => (k % 2 ? 22 : 42)) },
    { n: '꽃', e: '🌸', f: '#ffd6e0', gen: (n) => polar(n, (k, m) => 30 + 14 * Math.cos((k / m) * 2 * Math.PI * 4)) },
    { n: '고양이', e: '🐱', f: '#ffe0b8', base: [[14, 14], [38, 32], [62, 32], [86, 14], [90, 60], [70, 88], [30, 88], [10, 60]] },
    { n: '물고기', e: '🐟', f: '#cfe8ff', base: [[10, 50], [28, 32], [56, 28], [78, 42], [94, 24], [94, 76], [78, 58], [56, 72], [28, 68]] },
    { n: '새', e: '🐦', f: '#cfe8ff', base: [[6, 40], [28, 28], [50, 52], [72, 28], [94, 40], [78, 58], [50, 72], [22, 58]] },
    { n: '나비', e: '🦋', f: '#e3d6ff', base: [[50, 30], [76, 10], [94, 32], [84, 54], [94, 76], [72, 90], [50, 64], [28, 90], [6, 76], [16, 54], [6, 32], [24, 10]] },
    { n: '주스 컵', e: '🧃', f: '#ffd9c9', base: [[20, 16], [80, 16], [72, 90], [28, 90]] },
    { n: '물방울', e: '💧', f: '#cfe8ff', base: [[50, 6], [72, 40], [82, 62], [72, 84], [50, 94], [28, 84], [18, 62], [28, 40]] },
    { n: '성', e: '🏰', f: '#e3d6ff', base: [[10, 90], [10, 40], [24, 40], [24, 56], [38, 56], [38, 40], [62, 40], [62, 56], [76, 56], [76, 40], [90, 40], [90, 90]] },
  ];
  const NS = 'http://www.w3.org/2000/svg';
  const el = (t, a) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };

  function points(pic, hard) {
    if (pic.gen) return pic.gen(hard ? 20 : 10);
    let pts = pic.base;
    if (pts.length < 8) pts = split(pts);            // 점이 너무 적으면 한 번 나눔
    return hard ? split(pts) : pts;
  }

  G.register({
    id: 'dots', name: '점 잇기', desc: '숫자 순서대로 이어요', icon: '🔢', cat: 'draw', color: 'sky',
    start(root, mode) {
      const hard = mode === 'hard';
      const pic = PICS[G.bag('dots', PICS.length)];
      const pts = points(pic, hard), n = pts.length, small = n > 14;
      let next = 0, timer = 0;
      const svg = el('svg', { viewBox: '0 0 100 100', class: 'dots sq' + (small ? ' small' : ''), role: 'img', 'aria-label': pic.n + ' 점 잇기' });
      const fillG = el('g', {}), lineG = el('g', {}), dotG = el('g', {});
      svg.append(fillG, lineG, dotG);
      const dots = pts.map(([x, y], i) => {
        const g = el('g', { class: 'dot' + (i === 0 ? ' next' : '') });
        g.append(el('circle', { cx: x, cy: y, r: small ? 5 : 8, fill: 'transparent' }), el('circle', { class: 'v', cx: x, cy: y, r: small ? 3.6 : 5.2 }));
        const t = el('text', { x, y: y + 0.3 }); t.textContent = i + 1; g.append(t);
        g.addEventListener('click', () => tap(i, g));
        dotG.append(g); return g;
      });
      const line = (a, b) => lineG.append(el('line', { class: 'line', x1: a[0], y1: a[1], x2: b[0], y2: b[1] }));
      function tap(i, g) {
        if (i !== next) { G.sfx.bad(); g.classList.remove('shake'); void g.getBoundingClientRect(); g.classList.add('shake'); return; }
        G.sfx.tap();
        if (i > 0) line(pts[i - 1], pts[i]);
        dots[i].classList.remove('next'); dots[i].classList.add('done');
        next++;
        if (next < n) dots[next].classList.add('next');
        else {
          line(pts[n - 1], pts[0]);
          fillG.append(el('polygon', { points: pts.map((p) => p.join(',')).join(' '), fill: pic.f, opacity: 0.9 }));
          const em = el('text', { x: 50, y: 52, 'text-anchor': 'middle', 'dominant-baseline': 'central' }); em.style.fontSize = '26px'; em.textContent = pic.e; fillG.append(em);
          timer = setTimeout(() => G.win({ stars: hard ? 2 : 1, text: '짝짝짝! ' + pic.n + ' 그림 완성! (점 ' + n + '개)' }), 900);
        }
      }
      root.append(G.h('div', { class: 'hint' }, `1번부터 차례대로 눌러요 (점 ${n}개)`), G.h('div', { class: 'fitbox' }, svg));
      return () => clearTimeout(timer);
    },
  });
})();
