// 색칠하기 (20가지 그림)
//  쉬움: 마음대로 칠하기 / 어려움: 세부 칸이 늘어나고 견본과 똑같은 색으로 칠하기
(function () {
  'use strict';
  const W = '#ffffff';
  const COLORS = ['#ff6b6b', '#ff9f43', '#feca57', '#1dd1a1', '#48dbfb', '#5f6dff', '#b678f0', '#ff9ff3', '#a0714f', '#444444', W];
  const [Rd, Or, Ye, Gr, Bl, Bu, Pu, Pk, Br, Bk] = COLORS;
  // 마지막 인수 1 = 어려움에서만 나오는 세부 칸
  const C = (x, y, r, c, h) => ({ t: 'circle', a: `cx="${x}" cy="${y}" r="${r}"`, c, h });
  const E = (x, y, rx, ry, c, rot, h) => ({ t: 'ellipse', a: `cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"` + (rot ? ` transform="rotate(${rot} ${x} ${y})"` : ''), c, h });
  const R = (x, y, w, hh, c, rx, h) => ({ t: 'rect', a: `x="${x}" y="${y}" width="${w}" height="${hh}"` + (rx ? ` rx="${rx}"` : ''), c, h });
  const P = (pts, c, h) => ({ t: 'polygon', a: `points="${pts}"`, c, h });
  const D = (d, c, h) => ({ t: 'path', a: `d="${d}"`, c, h });
  const rays = (cx, cy, r0, r1, w, k, c) => Array.from({ length: k }, (_, i) => {
    const a = i * 2 * Math.PI / k, f = (r, da) => [cx + r * Math.cos(a + da), cy + r * Math.sin(a + da)].map((v) => Math.round(v * 10) / 10).join(',');
    return P(`${f(r0, -w)} ${f(r1, 0)} ${f(r0, w)}`, c);
  });
  const band = (r2, r1, c) => D(`M${50 - r2} 70 A${r2} ${r2} 0 0 1 ${50 + r2} 70 L${50 + r1} 70 A${r1} ${r1} 0 0 0 ${50 - r1} 70Z`, c);

  const PICS = [
    { n: '꽃', parts: [R(8, 90, 84, 6, Br, 3, 1), C(14, 14, 7, Ye, 1), R(47, 55, 6, 38, Gr, 3), E(35, 76, 12, 6, Gr, -25), E(65, 70, 12, 6, Gr, 25),
      C(67, 35, 11, Pk), C(58.5, 49.7, 11, Pk), C(41.5, 49.7, 11, Pk), C(33, 35, 11, Pk), C(41.5, 20.3, 11, Pk), C(58.5, 20.3, 11, Pk), C(50, 35, 9, Ye)] },
    { n: '집', parts: [C(84, 16, 8, Ye), R(66, 22, 8, 20, Br, 0, 1), R(20, 48, 60, 42, Ye), P('12,50 50,18 88,50', Rd), R(43, 64, 14, 26, Br), C(53, 78, 1.8, Ye, 1),
      R(26, 58, 12, 12, Bl), R(62, 58, 12, 12, Bl), R(5, 90, 90, 6, Gr, 3, 1)] },
    { n: '물고기', parts: [P('72,50 94,32 94,68', Or), P('38,34 56,34 47,16', Or), E(45, 50, 30, 20, Bl), C(56, 52, 8, Ye), C(31, 45, 5, W), C(12, 20, 5, Pu, 1), C(20, 84, 4, Pk, 1), C(88, 82, 3, Pu, 1)] },
    { n: '로켓', parts: [P('42,70 58,70 50,94', Or), P('38,56 22,78 38,72', Rd), P('62,56 78,78 62,72', Rd), D('M50 6 C70 24 68 54 62 72 L38 72 C32 54 30 24 50 6Z', W), C(50, 40, 9, Bl),
      R(38, 57, 24, 6, Rd, 0, 1), C(15, 18, 4, Ye, 1), C(86, 30, 3, Ye, 1), C(82, 78, 4, Ye, 1)] },
    { n: '아이스크림', parts: [P('34,54 66,54 50,94', Br), C(50, 44, 19, Pk), C(50, 27, 14, Ye), C(50, 11, 5, Rd), C(43, 40, 2.4, Bu, 1), C(57, 47, 2.4, Gr, 1), C(50, 25, 2.2, Rd, 1)] },
    { n: '나비', parts: [E(32, 36, 20, 16, Pu, -25), E(68, 36, 20, 16, Pu, 25), E(34, 64, 15, 12, Pk, 25), E(66, 64, 15, 12, Pk, -25), C(30, 36, 6, Ye, 1), C(70, 36, 6, Ye, 1), C(34, 64, 4, Bl, 1), C(66, 64, 4, Bl, 1), R(46, 24, 8, 52, Br, 4), C(50, 22, 7, Bk)] },
    { n: '자동차', parts: [R(0, 88, 100, 8, Bk, 0, 1), R(8, 52, 84, 22, Rd, 6), D('M24 52 L34 32 H64 L76 52Z', Rd), P('29,50 36,36 48,36 48,50', Bl), P('52,36 63,36 71,50 52,50', Bl), C(88, 60, 3.5, Ye, 1), C(28, 76, 10, Bk), C(72, 76, 10, Bk), C(28, 76, 4, W, 1), C(72, 76, 4, W, 1)] },
    { n: '나무', parts: [R(5, 90, 90, 6, Gr, 3, 1), R(44, 55, 12, 36, Br), C(34, 44, 16, Gr), C(66, 44, 16, Gr), C(50, 32, 22, Gr), C(42, 30, 3.5, Rd, 1), C(60, 40, 3.5, Rd, 1), C(38, 50, 3.5, Rd, 1), C(70, 52, 3.5, Rd, 1)] },
    { n: '무지개', parts: [R(0, 88, 100, 8, Gr, 0, 1), C(86, 14, 7, Ye, 1), band(44, 36, Rd), band(36, 28, Ye), band(28, 20, Gr), band(20, 12, Bu), E(18, 76, 14, 8, W), E(82, 76, 14, 8, W)] },
    { n: '눈사람', parts: [R(5, 92, 90, 5, Bl, 2, 1), C(50, 74, 20, W), C(50, 46, 15, W), C(50, 24, 11, W), R(41, 3, 18, 10, Bk), R(36, 12, 28, 3, Bk, 1), R(38, 33, 24, 5, Rd, 2), P('50,24 62,27 50,29', Or),
      C(46, 21, 1.6, Bk, 1), C(54, 21, 1.6, Bk, 1), C(50, 43, 2, Bk, 1), C(50, 51, 2, Bk, 1)] },
    { n: '고양이', parts: [P('18,38 22,10 44,26', Or), P('82,38 78,10 56,26', Or), P('24,32 26,18 36,27', Pk, 1), P('76,32 74,18 64,27', Pk, 1), C(50, 52, 34, Or), C(38, 46, 6, W), C(62, 46, 6, W),
      C(38, 46, 3, Bk, 1), C(62, 46, 3, Bk, 1), E(50, 68, 14, 8, W, 0, 1), P('46,58 54,58 50,63', Pk), C(24, 60, 5, Pk, 1), C(76, 60, 5, Pk, 1)] },
    { n: '강아지', parts: [E(20, 44, 10, 22, Br, 15), E(80, 44, 10, 22, Br, -15), C(50, 50, 28, Ye), E(50, 62, 14, 11, W), E(50, 56, 6, 4, Bk), C(40, 42, 5, W), C(60, 42, 5, W), C(40, 42, 2.4, Bk, 1), C(60, 42, 2.4, Bk, 1), E(50, 74, 5, 6, Rd, 0, 1)] },
    { n: '기차', parts: [R(0, 86, 100, 5, Br, 0, 1), R(16, 30, 10, 16, Bk), R(10, 44, 42, 28, Rd, 3), R(50, 26, 30, 46, Bu, 3), R(46, 22, 38, 6, Bk, 2), R(56, 34, 18, 14, Bl), C(24, 76, 9, Bk), C(46, 76, 9, Bk), C(70, 76, 9, Bk),
      C(21, 22, 5, W, 1), C(28, 13, 6, W, 1), C(24, 76, 3.5, Ye, 1), C(46, 76, 3.5, Ye, 1), C(70, 76, 3.5, Ye, 1)] },
    { n: '돛단배', parts: [C(84, 18, 8, Ye, 1), R(48, 12, 4, 50, Br), P('52,14 52,56 84,56', Ye), P('48,22 48,56 20,56', W), P('52,12 52,20 62,16', Rd, 1), D('M10 62 H90 L76 86 H24Z', Rd), C(40, 73, 3, Bl, 1), C(60, 73, 3, Bl, 1),
      D('M0 88 Q12 82 25 88 T50 88 T75 88 T100 88 V100 H0Z', Bu)] },
    { n: '해님', parts: [...rays(50, 50, 28, 46, 0.22, 8, Or), C(50, 50, 26, Ye), C(41, 45, 3, Bk, 1), C(59, 45, 3, Bk, 1), C(36, 57, 4, Pk, 1), C(64, 57, 4, Pk, 1), E(50, 60, 7, 3.5, Rd, 0, 1)] },
    { n: '사과', parts: [R(48, 16, 5, 18, Br, 2), E(64, 22, 12, 6, Gr, -30), C(40, 56, 26, Rd), C(60, 56, 26, Rd), E(32, 46, 5, 9, W, 20, 1), C(70, 38, 2.5, Ye, 1), C(30, 70, 2.5, Ye, 1)] },
    { n: '버섯', parts: [R(5, 88, 90, 7, Gr, 3, 1), R(38, 56, 24, 34, W, 6), D('M10 58 C10 22 90 22 90 58Z', Rd), C(32, 44, 7, W), C(52, 36, 8, W), C(70, 48, 6, W), C(46, 50, 2.5, Ye, 1), C(80, 56, 2.5, Ye, 1)] },
    { n: '우산', parts: [R(48, 50, 4, 32, Br), R(40, 80, 12, 4, Br, 2), D('M8 52 C8 14 92 14 92 52Z', Rd), P('50,17 38,52 62,52', Ye), E(20, 78, 3, 6, Bl), E(78, 70, 3, 6, Bl), E(66, 88, 3, 6, Bl), E(12, 62, 2.5, 5, Bl, 0, 1), E(90, 84, 2.5, 5, Bl, 0, 1)] },
    { n: '곰', parts: [C(24, 24, 12, Br), C(76, 24, 12, Br), C(24, 24, 6, Pk, 1), C(76, 24, 6, Pk, 1), C(50, 52, 32, Br), E(50, 62, 15, 12, Ye), C(38, 46, 4, Bk), C(62, 46, 4, Bk), E(50, 58, 5, 4, Bk), C(30, 58, 4, Pk, 1), C(70, 58, 4, Pk, 1)] },
    { n: '케이크', parts: [R(8, 84, 84, 6, W, 3), R(16, 50, 68, 34, Pk, 4), R(16, 46, 68, 10, W, 5), R(34, 26, 6, 20, Bl), R(48, 26, 6, 20, Ye), R(62, 26, 6, 20, Gr), E(37, 22, 3, 5, Or), E(51, 22, 3, 5, Or), E(65, 22, 3, 5, Or),
      C(28, 44, 4, Rd, 1), C(50, 44, 4, Rd, 1), C(72, 44, 4, Rd, 1), C(28, 70, 3, Ye, 1), C(46, 70, 3, Bu, 1), C(64, 70, 3, Gr, 1), C(78, 70, 3, Ye, 1)] },
  ];

  const svgFor = (pic, hard, sample) => pic.parts.filter((p) => hard || !p.h).map((p) => sample
    ? `<${p.t} ${p.a} fill="${p.c}" stroke="#555" stroke-width="1.8" stroke-linejoin="round"/>`
    : `<${p.t} ${p.a} class="p" data-s="${p.c}"/>`).join('');

  G.register({
    id: 'coloring', name: '색칠하기', desc: '그림 20가지', icon: '🎨', cat: 'draw', color: 'pink', variants: PICS.length,
    start(root, { hard, v }) {
      const pic = PICS[v];
      let color = COLORS[0], timer = 0;
      const art = G.h('div', { class: 'fitbox' });
      art.innerHTML = `<svg class="art sq" viewBox="0 0 100 100" role="img" aria-label="${pic.n} 그림">${svgFor(pic, hard, false)}</svg>`;
      const parts = [...art.querySelectorAll('.p')];
      const sw = COLORS.map((c) => G.h('button', { class: 'sw' + (c === W ? ' white' : ''), style: 'background:' + c, 'aria-label': '색 고르기', 'aria-pressed': String(c === color),
        onclick: () => { color = c; G.sfx.tap(); sw.forEach((b, i) => b.setAttribute('aria-pressed', String(COLORS[i] === c))); } }));
      const reset = G.h('button', { class: 'btn alt', onclick: () => { parts.forEach((p) => { p.style.fill = ''; delete p.dataset.c; }); G.sfx.tap(); } }, '🧽 지우기');
      parts.forEach((p) => p.addEventListener('click', () => {
        if (hard && p.dataset.s !== color) { G.sfx.bad(); p.classList.remove('bad'); void p.getBoundingClientRect(); p.classList.add('bad'); return; }
        p.style.fill = color; p.dataset.c = '1'; G.sfx.pop();
        if (parts.every((x) => x.dataset.c)) { clearTimeout(timer); timer = setTimeout(() => G.win({ stars: hard ? 3 : 1, text: pic.n + ' 그림을 다 칠했어요!' }), 500); }
      }));
      const hint = G.h('div', { class: 'hint must' }, hard ? `🎨 ${pic.n} · 견본과 똑같은 색으로 칠해요` : `🎨 ${pic.n} · 마음대로 칠해요`);
      let body = art;
      if (hard) {
        const sample = G.h('div', { class: 'sample' }, '견본');
        sample.insertAdjacentHTML('beforeend', `<svg viewBox="0 0 100 100" aria-label="견본">${svgFor(pic, true, true)}</svg>`);
        body = G.h('div', { class: 'colorrow' }, sample, art);
      }
      root.append(hint, body, G.h('div', { class: 'palette' }, sw, reset));
      return () => clearTimeout(timer);
    },
  });
})();
