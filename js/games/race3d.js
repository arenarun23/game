// 레이싱 3D 시점: 캔버스에 직접 그리는 원근 투영(외부 라이브러리 없음).
// 차 뒤에서 따라가는 카메라 → 언덕·다리(고가도로)·점프대가 보이고, 먼 곳은 안개에 묻힌다.
(function () {
  'use strict';
  const G = window.G, TAU = Math.PI * 2;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const VIEW = 1.5, DIST = 240 * VIEW, CAMH = 105 * VIEW, BACK = Math.round(8 * VIEW), LEVELS = 12,  // VIEW: 카메라를 내 차에서 떨어뜨리는 배율(1 = 예전, 1.5 = 더 멀리)
   FAR = 1900, NP = 12;

  // ───── 색(안개): 멀수록 지평선 색에 섞는다. 단계별 문자열을 미리 만들어 둔다 ─────
  const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const hex = (c) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mixHex = (a, b, t) => { const x = rgb(a), y = rgb(b); return hex(x.map((v, i) => v + (y[i] - v) * t)); };
  const tables = new Map();
  let FOGK = 1; // 안개 세기(공기 없는 달·유로파는 거의 0, 타이탄은 짙게)
  function tbl(color, fogc) { const key = color + fogc + FOGK; let t = tables.get(key); if (!t) { t = []; for (let i = 0; i < LEVELS; i++) t.push(mixHex(color, fogc, Math.min(0.95, Math.pow(i / (LEVELS - 1), 1.5) * 0.62 * FOGK))); tables.set(key, t); } return t; }

  // ───── 카메라 투영 (장면마다 갱신) ─────
  let Cx = 0, Cy = 0, Cz = 0, fx = 1, fy = 0, rx = 0, ry = 1, cp = 1, sp = 0, F = 800, cxs = 0, cys = 0;
  let _sx = 0, _sy = 0, _d = 0;
  function proj(X, Y, Z) { // 결과: _sx, _sy, _d (깊이). 카메라 뒤면 _d 가 작다
    const dx = X - Cx, dy = Y - Cy, dz = Z - Cz, dep = dx * fx + dy * fy, lat = dx * rx + dy * ry;
    const d = dep * cp - dz * sp, u = dep * sp + dz * cp;
    _d = d; if (d < 3) { _sx = _sy = 0; return; }
    _sx = cxs + F * lat / d; _sy = cys - F * u / d;
  }
  const lvlOf = (d) => clamp(Math.floor(d / FAR * (LEVELS - 1)), 0, LEVELS - 1);

  // ───── 차 그림(뒤/앞): 한 번만 그려 두고 크기만 바꿔 찍는다 ─────
  function kartSprite(car, front, col) {
    const U = G.raceUtil; // 56x40 세계 단위, 2.14배 해상도
    return U.sprite('k3:' + car.id + col + (front ? 'f' : 'b'), 120, 86, (g) => {
      g.translate(60, 80); g.scale(2.14, 2.14); // 발 밑 중앙이 (0,0)
      g.fillStyle = '#222'; g.beginPath(); g.roundRect(-27, -17, 11, 17, 3); g.roundRect(16, -17, 11, 17, 3); g.fill(); // 바퀴
      g.fillStyle = col; g.beginPath(); g.roundRect(-25, -26, 50, 20, 6); g.fill();       // 몸통
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(-25, -10, 50, 4);
      g.fillStyle = front ? 'rgba(180,225,255,.85)' : 'rgba(40,50,70,.8)'; g.beginPath(); g.roundRect(-14, -34, 28, 11, 4); g.fill(); // 창
      if (front) { g.fillStyle = '#fff5a8'; g.fillRect(-22, -22, 9, 5); g.fillRect(13, -22, 9, 5); }
      else { g.fillStyle = '#ff3b3b'; g.fillRect(-23, -23, 9, 5); g.fillRect(14, -23, 9, 5); }
      if (car.id === 'bolt') { g.fillStyle = '#222'; g.fillRect(-26, -36, 52, 4); g.fillRect(-18, -34, 3, 8); g.fillRect(15, -34, 3, 8); }
      else if (car.id === 'tank') { g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-20, -37, 40, 3); }
      else if (car.id === 'bus') { g.fillStyle = 'rgba(255,255,255,.7)'; for (let i = -22; i < 20; i += 11) g.fillRect(i, -32, 8, 8); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-25, -12, 50, 3); }
      else if (car.id === 'hop') { g.fillStyle = '#fff'; g.fillRect(-10, -40, 20, 6); g.fillStyle = 'rgba(0,0,0,.28)'; for (let i = -24; i < 24; i += 8) g.fillRect(i, -12, 4, 4); }
      else if (car.id === 'van') { g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-23, -32, 46, 3); }
      else if (car.id === 'cop') { g.fillStyle = '#fff'; g.fillRect(-25, -14, 50, 4); g.fillStyle = '#ff3b3b'; g.fillRect(-11, -39, 10, 6); g.fillStyle = '#3b8bff'; g.fillRect(1, -39, 10, 6); }
      else if (car.id === 'fire') { g.fillStyle = '#ffd24a'; g.fillRect(-25, -14, 50, 4); g.fillStyle = '#eee'; for (let i = -22; i < 22; i += 7) g.fillRect(i, -40, 3, 7); g.fillRect(-23, -38, 46, 2); }
    });
  }

  // 캐릭터 뒷모습(이모지엔 뒷면이 없어서 직접 그린다): 머리 뒤통수 + 귀 모양으로 누구인지 알 수 있게
  function charBack(ch) {
    return G.raceUtil.sprite('cb:' + ch.id, 96, 96, (g) => {
      const ell = (x, y, rx, ry, rot, col) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); g.fill(); };
      const tri = (pts, col) => { g.fillStyle = col; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fill(); };
      const head = (col) => { g.fillStyle = col; g.beginPath(); g.arc(48, 58, 29, 0, TAU); g.fill(); };
      if (ch.id === 'toto') { ell(33, 26, 9, 25, -0.14, '#e4e0ec'); ell(63, 26, 9, 25, 0.14, '#e4e0ec'); ell(33, 28, 4, 17, -0.14, '#d3cbe0'); ell(63, 28, 4, 17, 0.14, '#d3cbe0'); head('#eeeaf4'); ell(48, 82, 16, 8, 0, '#e4e0ec'); }
      else if (ch.id === 'gom') { ell(25, 34, 12, 12, 0, '#b07a45'); ell(71, 34, 12, 12, 0, '#b07a45'); ell(25, 35, 6, 6, 0, '#8f5f33'); ell(71, 35, 6, 6, 0, '#8f5f33'); head('#b98450'); ell(48, 84, 17, 8, 0, '#a06f3d'); }
      else if (ch.id === 'yeo') { tri([[17, 44], [26, 4], [47, 32]], '#f08a2c'); tri([[79, 44], [70, 4], [49, 32]], '#f08a2c'); tri([[22, 20], [26, 4], [37, 22]], '#4a2a14'); tri([[74, 20], [70, 4], [59, 22]], '#4a2a14'); head('#f4952f'); tri([[19, 64], [28, 86], [42, 74]], '#fff4e6'); tri([[77, 64], [68, 86], [54, 74]], '#fff4e6'); }
      else if (ch.id === 'eleph') { ell(14, 52, 17, 26, 0.2, '#8d9bb0'); ell(82, 52, 17, 26, -0.2, '#8d9bb0'); ell(14, 52, 9, 17, 0.2, '#c79aa8'); ell(82, 52, 9, 17, -0.2, '#c79aa8'); head('#a3b0c4'); ell(48, 86, 12, 8, 0, '#8d9bb0'); }
      else if (ch.id === 'leo') { g.fillStyle = '#b8742c'; g.beginPath(); g.arc(48, 56, 38, 0, TAU); g.fill(); g.fillStyle = '#8a5120'; for (let a = 0; a < 12; a++) { g.beginPath(); g.arc(48 + Math.cos(a / 12 * TAU) * 34, 56 + Math.sin(a / 12 * TAU) * 34, 8, 0, TAU); g.fill(); } ell(24, 28, 9, 9, 0, '#e2a24f'); ell(72, 28, 9, 9, 0, '#e2a24f'); head('#e8b35e'); ell(48, 84, 14, 7, 0, '#d79a45'); }
      else if (ch.id === 'chee') { ell(27, 34, 11, 11, 0, '#e3b04b'); ell(69, 34, 11, 11, 0, '#e3b04b'); ell(27, 35, 5, 5, 0, '#2a2118'); ell(69, 35, 5, 5, 0, '#2a2118'); head('#ecbc55'); g.fillStyle = '#3a2c1c'; for (const [x, y] of [[34, 48], [48, 42], [62, 48], [38, 62], [58, 62], [48, 70], [30, 70], [66, 70]]) { g.beginPath(); g.arc(x, y, 4, 0, TAU); g.fill(); } ell(48, 86, 14, 7, 0, '#e3b04b'); }
      else if (ch.id === 'tiger') { ell(27, 33, 12, 12, 0, '#f08a2c'); ell(69, 33, 12, 12, 0, '#f08a2c'); ell(27, 34, 6, 6, 0, '#2a1a10'); ell(69, 34, 6, 6, 0, '#2a1a10'); head('#f4952f'); g.fillStyle = '#2a1a10'; for (const [x, y, w] of [[48, 36, 5], [34, 44, 4], [62, 44, 4], [26, 58, 4], [70, 58, 4], [34, 72, 4], [62, 72, 4]]) g.fillRect(x - w / 2, y, w, 10); ell(48, 86, 15, 7, 0, '#f08a2c'); }
      else { ell(15, 70, 7, 15, 0.45, '#232733'); ell(81, 70, 7, 15, -0.45, '#232733'); head('#2d3240'); ell(48, 86, 15, 7, 0, '#232733'); }
      g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.ellipse(38, 46, 12, 8, -0.6, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(0,0,0,.22)'; g.lineWidth = 2; g.beginPath(); g.arc(48, 58, 29, 0, TAU); g.stroke();
    });
  }

  const st = { T: null };
  function hOfTrack(T, i0, f) { const M = T.M; return T.hgt[i0] + (T.hgt[(i0 + 1) % M] - T.hgt[i0]) * f; }

  // 🚀 우주 구조물(이모지 대신 직접 그림): 햇빛 방향(side)과 밝기(B)에 맞춰 밝은 면·어두운 면·그림자를 그린다
  function drawProp(ctx, kind, X, Y, u, o) {
    const { side, B, t } = o, mb = (h) => mixHex(h, '#000000', 1 - B), lit = mb('#d8dce1'), mid = mb('#9097a0'), dk = mb('#555b63'), gold = mb('#c9a24a'), blue = mb('#243f7d');
    const poly = (pts, c) => { ctx.fillStyle = c; ctx.beginPath(); pts.forEach(([a, b], i) => (i ? ctx.lineTo(X + a * u, Y + b * u) : ctx.moveTo(X + a * u, Y + b * u))); ctx.closePath(); ctx.fill(); };
    const ell = (cx, cy, rx, ry, c, rot) => { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(X + cx * u, Y + cy * u, rx * u, ry * u, rot || 0, 0, TAU); ctx.fill(); };
    ell(-side * 0.35, 0.02, 0.8, 0.13, 'rgba(0,0,0,.34)'); // 땅 그림자(햇빛 반대쪽으로 길게)
    if (kind === 'pebble') { ell(0, -0.04, 0.2, 0.12, mb('#6f6c66')); ell(side * 0.05, -0.08, 0.1, 0.06, mb('#9a968f')); return; }
    if (kind === 'dish') { // 전파 안테나: 받침대 + 기둥 + 접시 + 수신기 팔
      poly([[-0.14, 0], [-0.1, -0.1], [0.1, -0.1], [0.14, 0]], dk); poly([[-0.04, -0.1], [0.04, -0.1], [0.03, -0.62], [-0.03, -0.62]], mid);
      ell(0, -0.7, 0.46, 0.36, dk, -0.35); ell(-side * 0.02, -0.72, 0.42, 0.32, lit, -0.35); ell(side * 0.05, -0.7, 0.22, 0.17, mid, -0.35);
      ctx.strokeStyle = mid; ctx.lineWidth = Math.max(1, u * 0.025); ctx.beginPath(); ctx.moveTo(X, Y - 0.7 * u); ctx.lineTo(X + 0.12 * u, Y - 1.05 * u); ctx.stroke(); ell(0.12, -1.06, 0.035, 0.035, '#d44');
    } else if (kind === 'lander') { // 착륙선: 금빛 몸통 + 다리 4개 + 엔진
      ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1.2, u * 0.03); for (const dx of [-0.52, -0.3, 0.3, 0.52]) { ctx.beginPath(); ctx.moveTo(X + dx * 0.55 * u, Y - 0.42 * u); ctx.lineTo(X + dx * u, Y); ctx.stroke(); ell(dx, 0, 0.08, 0.03, mid); }
      poly([[-0.1, -0.3], [0.1, -0.3], [0.17, -0.18], [-0.17, -0.18]], dk);
      poly([[-0.3, -0.42], [0.3, -0.42], [0.36, -0.72], [0.18, -0.9], [-0.18, -0.9], [-0.36, -0.72]], gold); poly([[side * 0.02, -0.42], [side * 0.3, -0.42], [side * 0.36, -0.72], [side * 0.18, -0.9], [side * 0.02, -0.9]], mb('#e8c765'));
      poly([[-0.2, -0.9], [0.2, -0.9], [0.14, -1.0], [-0.14, -1.0]], lit); ell(0.05, -0.62, 0.07, 0.07, dk);
    } else if (kind === 'hab') { // 거주 모듈: 원통 + 둥근 끝 + 창문 + 방열판
      poly([[-0.62, -0.46], [0.62, -0.46], [0.62, 0], [-0.62, 0]], mid); poly([[-0.62, -0.46], [0.62, -0.46], [0.62, -0.3], [-0.62, -0.3]], lit);
      ell(-0.62, -0.23, 0.1, 0.23, dk); ell(0.62, -0.23, 0.1, 0.23, mid);
      for (let k = -2; k <= 2; k++) poly([[k * 0.2 - 0.05, -0.28], [k * 0.2 + 0.05, -0.28], [k * 0.2 + 0.05, -0.18], [k * 0.2 - 0.05, -0.18]], mb('#1c2a44'));
      poly([[-0.4, -0.46], [-0.4, -0.78], [-0.18, -0.78], [-0.18, -0.46]], blue); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1; ctx.strokeRect(X - 0.4 * u, Y - 0.78 * u, 0.22 * u, 0.32 * u);
    } else if (kind === 'solar') { // 태양전지판
      poly([[-0.025, 0], [0.025, 0], [0.025, -0.5], [-0.025, -0.5]], dk);
      for (const [dx, w] of [[-0.62, 0.5], [0.12, 0.5]]) { poly([[dx, -0.5], [dx + w, -0.5], [dx + w + 0.04, -0.95], [dx + 0.04, -0.95]], blue); ctx.strokeStyle = 'rgba(190,210,255,.5)'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = 1; k < 4; k++) { ctx.moveTo(X + (dx + w * k / 4) * u, Y - 0.5 * u); ctx.lineTo(X + (dx + w * k / 4 + 0.04) * u, Y - 0.95 * u); } ctx.moveTo(X + (dx + 0.02) * u, Y - 0.72 * u); ctx.lineTo(X + (dx + w + 0.02) * u, Y - 0.72 * u); ctx.stroke(); }
    } else if (kind === 'mast') { // 통신탑 + 깜박이는 붉은 불
      poly([[-0.02, 0], [0.02, 0], [0.012, -1.3], [-0.012, -1.3]], mid); poly([[-0.1, 0], [0.1, 0], [0.04, -0.2], [-0.04, -0.2]], dk);
      for (const yy of [-0.5, -0.85]) { ctx.strokeStyle = mid; ctx.lineWidth = Math.max(1, u * 0.02); ctx.beginPath(); ctx.moveTo(X - 0.16 * u, Y + yy * u); ctx.lineTo(X + 0.16 * u, Y + yy * u); ctx.stroke(); }
      if (Math.sin(t * 3) > 0) { ell(0, -1.32, 0.05, 0.05, '#ff3b30'); ctx.fillStyle = 'rgba(255,60,50,.25)'; ctx.beginPath(); ctx.arc(X, Y - 1.32 * u, 0.16 * u, 0, TAU); ctx.fill(); }
    }
  }

  // 🚀 하늘의 큰 천체: 달에서 본 지구, 화성의 작은 위성, 유로파에서 본 목성
  function drawPlanet(ctx, kind, W, hy, F, yaw, H) {
    const wrap = (x) => ((x % (W * 1.5)) + W * 1.5) % (W * 1.5) - W * 0.25;
    if (kind === 'earth') {
      const r = H * 0.15, cx = wrap(W * 0.74 - yaw * F * 0.1), cy = hy * 0.46; if (cx < -r || cx > W + r) return;
      const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r); g.addColorStop(0, '#9fd2ff'); g.addColorStop(0.55, '#3a7fd6'); g.addColorStop(1, '#14336b');
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fillStyle = g; ctx.fill(); ctx.clip();
      ctx.fillStyle = 'rgba(70,170,90,.85)'; ctx.beginPath(); ctx.ellipse(cx - r * 0.3, cy - r * 0.1, r * 0.34, r * 0.22, 0.5, 0, TAU); ctx.ellipse(cx + r * 0.35, cy + r * 0.25, r * 0.22, r * 0.3, -0.4, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = r * 0.09; ctx.beginPath(); ctx.arc(cx - r * 0.1, cy - r * 0.25, r * 0.55, 3.4, 5.2); ctx.stroke(); ctx.beginPath(); ctx.arc(cx + r * 0.1, cy + r * 0.3, r * 0.5, 0.2, 1.8); ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,20,.35)'; ctx.beginPath(); ctx.arc(cx + r * 0.42, cy + r * 0.2, r * 1.05, 0, TAU); ctx.fill(); ctx.restore();
      ctx.strokeStyle = 'rgba(140,200,255,.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, r + 2, 0, TAU); ctx.stroke();
    } else if (kind === 'jupiter') {
      const r = H * 0.34, cx = wrap(W * 0.7 - yaw * F * 0.08), cy = hy * 0.62; if (cx < -r || cx > W + r) return;
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fillStyle = '#d8a468'; ctx.fill(); ctx.clip();
      const cols = ['#c58a52', '#e6c08e', '#b9764a', '#f0d6a8', '#c98f5a', '#e2b684', '#a9663f']; cols.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(cx - r, cy - r + (i / cols.length) * 2 * r, 2 * r, (2 * r) / cols.length + 1); });
      ctx.fillStyle = '#b4472f'; ctx.beginPath(); ctx.ellipse(cx + r * 0.35, cy + r * 0.28, r * 0.2, r * 0.11, 0, 0, TAU); ctx.fill();
      const sh = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.2, cx, cy, r * 1.05); sh.addColorStop(0, 'rgba(255,255,255,.12)'); sh.addColorStop(1, 'rgba(0,0,20,.55)'); ctx.fillStyle = sh; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r); ctx.restore();
    } else if (kind === 'saturn') {
      const r = H * 0.17, cx = wrap(W * 0.72 - yaw * F * 0.08), cy = hy * 0.5; if (cx < -r * 2.4 || cx > W + r * 2.4) return;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.28);
      ctx.strokeStyle = 'rgba(230,200,150,.55)'; ctx.lineWidth = r * 0.22; ctx.beginPath(); ctx.ellipse(0, 0, r * 2.0, r * 0.52, 0, Math.PI, TAU); ctx.stroke(); // 뒤쪽 고리
      const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r); g.addColorStop(0, '#f6e2b0'); g.addColorStop(1, '#a8803f'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(150,100,50,.25)'; ctx.lineWidth = r * 0.07; for (const dy of [-0.4, -0.1, 0.25]) { ctx.beginPath(); ctx.moveTo(-Math.sqrt(1 - dy * dy) * r, dy * r); ctx.lineTo(Math.sqrt(1 - dy * dy) * r, dy * r); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(240,215,165,.8)'; ctx.lineWidth = r * 0.22; ctx.beginPath(); ctx.ellipse(0, 0, r * 2.0, r * 0.52, 0, 0, Math.PI); ctx.stroke(); // 앞쪽 고리
      ctx.strokeStyle = 'rgba(160,120,70,.5)'; ctx.lineWidth = r * 0.06; ctx.beginPath(); ctx.ellipse(0, 0, r * 2.12, r * 0.55, 0, 0, Math.PI); ctx.stroke(); ctx.restore();
    } else if (kind === 'belt') { // 소행성들이 하늘에 둥둥
      for (let i = 0; i < 9; i++) { const r = H * (0.012 + ((i * 37) % 11) * 0.0045), cx = wrap(W * (((i * 71) % 100) / 100) - yaw * F * (0.05 + (i % 3) * 0.03)), cy = hy * (0.12 + ((i * 53) % 70) / 100); ctx.fillStyle = i % 2 ? '#8c857d' : '#6e6862'; ctx.beginPath(); ctx.ellipse(cx, cy, r * 1.3, r, i * 0.7, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.ellipse(cx - r * 0.3, cy - r * 0.3, r * 0.5, r * 0.35, 0, 0, TAU); ctx.fill(); }
      const r = H * 0.05, cx = wrap(W * 0.2 - yaw * F * 0.06), cy = hy * 0.55; ctx.fillStyle = '#ffe9a8'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,233,168,.2)'; ctx.beginPath(); ctx.arc(cx, cy, r * 1.9, 0, TAU); ctx.fill(); // 멀리 작은 해
    } else if (kind === 'phobos') {
      for (const [fx, fy, rr, c] of [[0.3, 0.4, 0.045, '#8d7d70'], [0.62, 0.28, 0.028, '#a59686']]) { const r = H * rr, cx = wrap(W * fx - yaw * F * 0.09), cy = hy * fy; ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(cx, cy, r * 1.25, r, 0.4, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(cx + r * 0.3, cy + r * 0.1, r * 0.5, r * 0.4, 0, 0, TAU); ctx.fill(); }
    }
  }

  function draw(E) {
    const { ctx, W, H, T, th, me, racers } = E, M = T.M, P = T.pts, hgt = T.hgt, hw = T.hw, ds = T.ds, U = G.raceUtil;
    FOGK = th.fogK == null ? 1 : th.fogK;
    const S = (E.wall || hw * 1.5) + 26, Cc = hw + 10, BAR = 26, fogc = th.sky[1]; // 벽은 차 몸통 폭만큼 바깥에 세운다
    // ── 카메라 ──
    const yaw = E.yaw; fx = Math.cos(yaw); fy = Math.sin(yaw); rx = -fy; ry = fx;
    const meH = E.hOf(me), idx = me.idx;
    if (st.T !== T) { st.T = T; st.z = meH + CAMH; st.p = 0.16; st.gz = Math.min.apply(null, hgt) - 10; st.cols = {}; }
    const k = 1 - Math.exp(-(E.dt || 0.016) * 7);
    st.z += (meH + CAMH - st.z) * k;
    const hLook = hgt[(idx + 24 + Math.round(4 * (VIEW - 1) * 2)) % M], pT = clamp(Math.atan2(st.z - hLook, DIST + 290) + 0.03, 0.05, 0.6); st.p += (pT - st.p) * k;
    Cx = me.dx - fx * DIST; Cy = me.dy - fy * DIST; Cz = st.z; cp = Math.cos(st.p); sp = Math.sin(st.p);
    F = Math.max(W * 0.8, H * 0.45); cxs = W / 2; cys = H * 0.54;
    const hy = cys - F * Math.tan(st.p), gz = st.gz;

    // ── 하늘·먼 산·땅 ──
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const gr = ctx.createLinearGradient(0, 0, 0, Math.max(10, hy)); gr.addColorStop(0, th.sky[0]); gr.addColorStop(1, th.sky[1]);
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, Math.max(10, hy) + 1);
    if (th.stars && hy > 8) { ctx.fillStyle = '#fff'; for (let i = 0; i < 70; i++) { const x = (((i * 733) % 997) / 997 * W * 1.6 - yaw * F * 0.18) % W, y = ((i * 389) % 991) / 991 * hy * 0.92, sz = 1 + (i % 3) * 0.7; ctx.globalAlpha = 0.45 + (i % 4) * 0.13; ctx.fillRect(x < 0 ? x + W : x, y, sz, sz); } ctx.globalAlpha = 1; } // 별
    const SPC = !!T.space, craterRim = mixHex(th.bg, '#000000', 0.18), craterIn = mixHex(th.bg, '#000000', 0.38), rockCol = mixHex(th.ridge[1], '#000000', 0.2), rockHi = mixHex(th.ridge[0], '#ffffff', 0.25), iceCol = '#bfe6ff'; // 🚀 우주 코스는 하늘·산·벽·차 유리를 따로 꾸민다
    // 햇빛: 방향(왼쪽/오른쪽, 앞/뒤)에 따라 바위·구조물의 밝은 면과 그림자가 달라진다
    const dustRGB = SPC ? (() => { const c = rgb(mixHex(th.bg, th.slow, 0.5)); return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},`; })() : '';
    let sunR = 0, sunF = -0.6, sunX = 0, sunY = 0; if (SPC && th.sun) { sunX = Math.cos(th.sun.az); sunY = Math.sin(th.sun.az); sunF = sunX * fx + sunY * fy; sunR = sunX * rx + sunY * ry; }
    const propSt = { side: sunR >= 0 ? 1 : -1, B: SPC ? clamp(0.64 + 0.36 * -sunF, 0.45, 1) : 1, t: E.t || 0 };
    if (SPC && th.stars && hy > 30) { ctx.save(); ctx.translate(W * 0.55 - yaw * F * 0.07, hy * 0.45); ctx.rotate(-0.45); const mw = ctx.createLinearGradient(0, -hy * 0.2, 0, hy * 0.2); mw.addColorStop(0, 'rgba(190,200,255,0)'); mw.addColorStop(0.5, 'rgba(205,212,255,.10)'); mw.addColorStop(1, 'rgba(190,200,255,0)'); ctx.fillStyle = mw; ctx.fillRect(-W * 1.2, -hy * 0.2, W * 2.4, hy * 0.4); ctx.restore(); }
    if (SPC && th.sun && sunF > 0.15 && hy > 20) { // 태양(눈부심)
      const da = Math.atan2(sunR, sunF), gx = cxs + F * Math.tan(clamp(da, -1.3, 1.3)), gy = hy - F * Math.tan(th.sun.el) / Math.max(0.35, Math.cos(da));
      if (gy < hy) { const rg = Math.min(W, H) * 0.42, g2 = ctx.createRadialGradient(gx, gy, 0, gx, gy, rg); g2.addColorStop(0, 'rgba(255,250,235,.95)'); g2.addColorStop(0.08, 'rgba(255,244,215,.55)'); g2.addColorStop(0.35, 'rgba(255,230,190,.12)'); g2.addColorStop(1, 'rgba(255,230,190,0)'); ctx.fillStyle = g2; ctx.fillRect(gx - rg, gy - rg, 2 * rg, 2 * rg);
        ctx.fillStyle = '#fffdf2'; ctx.beginPath(); ctx.arc(gx, gy, Math.min(W, H) * 0.022, 0, TAU); ctx.fill();
        for (const [t2, r2, a2] of [[0.35, 0.03, 0.16], [0.7, 0.05, 0.1], [1.15, 0.025, 0.14]]) { const fx2 = gx + (cxs - gx) * t2, fy2 = gy + (cys - gy) * t2; ctx.fillStyle = `rgba(255,235,200,${a2})`; ctx.beginPath(); ctx.arc(fx2, fy2, Math.min(W, H) * r2, 0, TAU); ctx.fill(); } }
    }
    if (SPC && th.planet && hy > 20) drawPlanet(ctx, th.planet, W, hy, F, yaw, H);
    ctx.fillStyle = mixHex(th.bg, fogc, Math.min(0.9, 0.22 * FOGK)); ctx.fillRect(0, hy, W, H - hy + 1);
    const sc = H / 640;
    for (let layer = 0; layer < 2; layer++) {
      const ox = -yaw * F * (0.5 + 0.35 * layer), amp = (34 + layer * 16) * sc, base = hy + 1;
      ctx.fillStyle = th.ridge[layer]; ctx.beginPath(); ctx.moveTo(0, base);
      for (let x = 0; x <= W + 16; x += 16) { const q = (x + ox) * (0.0045 + layer * 0.003); if (SPC) { const tri = (v) => Math.abs((((v / 6.2832) % 1) + 1) % 1 * 2 - 1); ctx.lineTo(x, base - amp * (0.25 + 0.95 * tri(q * 1.3 + layer * 2) * (0.55 + 0.45 * tri(q * 3.7)))); } else ctx.lineTo(x, base - amp * (0.55 + 0.32 * Math.sin(q) + 0.22 * Math.sin(q * 2.7 + layer * 2) + 0.12 * Math.sin(q * 6.1))); }
      ctx.lineTo(W, base); ctx.closePath(); ctx.fill();
    }

    // ── 길 표본 투영 (가까운 곳은 촘촘히, 먼 곳은 성기게) ──
    const ks = [], lowQ = E.lowQ, reach = lowQ ? 100 : 128; let kk = idx - BACK;
    for (;;) { ks.push(kk); const rel = kk - (idx - BACK); if (rel > reach) break; kk += rel < 24 + BACK - 8 ? 1 : rel < 60 + BACK - 8 ? 2 : 4; }
    const dj = new Float32Array(NP), FIXJ = [0, 9, 10, 11], FIXF = [1, 8, 1, 8], n = ks.length, X = new Float32Array(n * NP), Y = new Float32Array(n * NP), ok = new Uint8Array(n), dep = new Float32Array(n);
    for (let e = 0; e < n; e++) {
      const m = ((ks[e] % M) + M) % M, c = P[m], h = hgt[m], skirt = S + Math.max(0, h - gz) * 0.9 + 50;
      const lat = [-skirt, -S, -Cc, -hw, -3, 3, hw, Cc, S, skirt, -S, S], z = [gz, h, h, h, h, h, h, h, h, gz, h + BAR, h + BAR];
      let valid = 1;
      for (let j = 0; j < NP; j++) { proj(c.x + c.nx * lat[j], c.y + c.ny * lat[j], z[j]); X[e * NP + j] = _sx; Y[e * NP + j] = _sy; dj[j] = _d; if (_d < 8 && j >= 1 && j <= 8) valid = 0; if (j === 4) dep[e] = _d; }
      // 비탈·벽 바깥점이 카메라 뒤로 넘어가면 화면 구석(0,0)으로 찍혀 큰 삼각형이 시야를 덮는다 → 길 가장자리 점으로 접는다
      for (let q = 0; q < 4; q++) { const j = FIXJ[q]; if (dj[j] < 8) { const f = FIXF[q]; X[e * NP + j] = X[e * NP + f]; Y[e * NP + j] = Y[e * NP + f]; } }
      ok[e] = valid;
    }
    // ── 그릴 것 목록: 길 조각 + 장식 + 상자 + 지대 + 차 + 던진 것 ──
    const items = [];
    for (let e = 0; e < n - 1; e++) if (ok[e] && ok[e + 1]) items.push({ d: (dep[e] + dep[e + 1]) / 2, kind: 0, e });
    const rel = (i) => (((i - idx + BACK) % M) + M) % M - BACK, inWin = (i) => { const r = rel(i); return r >= -(BACK - 2) && r <= reach; };
    const cut = lowQ ? 2 : 1;
    for (let i = 0; i < T.decos.length; i += cut) { const d = T.decos[i]; if (!inWin(d.idx)) continue; const c = P[d.idx], lat = Math.abs((d.x - c.x) * c.nx + (d.y - c.y) * c.ny), z = Math.max(gz, hgt[d.idx] - Math.max(0, lat - S) * 0.9); proj(d.x, d.y, z); if (_d > 10 && _sx > -300 && _sx < W + 300) items.push({ d: _d, kind: 1, sx: _sx, sy: _sy, o: d, z }); }
    for (let i = 0; i < T.boxes.length; i++) { if (E.boxT[i] > 0) continue; const b = T.boxes[i]; if (!inWin(b.idx)) continue; proj(b.x, b.y, hgt[b.idx] + 18); if (_d > 10) items.push({ d: _d - 22, dd: _d, kind: 2, sx: _sx, sy: _sy, i }); }
    for (const z of T.haz) { if (!inWin(z.idx)) continue; proj(z.x, z.y, hgt[z.idx]); if (_d > 10) items.push({ d: _d - (z.type === 'boost' || z.type === 'jump' ? 42 : z.r + 6), dd: _d, kind: 3, z }); }
    for (const r of racers) { const hz = E.hOf(r) - r.zair; proj(r.dx, r.dy, hz); if (_d > 10) items.push({ d: _d - 30, dd: _d, kind: 4, r, sx: _sx, sy: _sy, hz }); }
    for (const p of me.tr || []) { proj(p.x, p.y, p.h + 10); if (_d > 10) items.push({ d: _d - 6, dd: _d, kind: 6, p, sx: _sx, sy: _sy }); }
    if (SPC) for (const r of racers) for (const p of r.dust || []) { proj(p.x, p.y, p.h + 6 + p.t * 40); if (_d > 10) items.push({ d: _d - 3, dd: _d, kind: 7, p, sx: _sx, sy: _sy }); }
    for (const o of E.objs) { const ix = o.px === undefined ? o.x : o.px + (o.x - o.px) * E.alpha, iy = o.py === undefined ? o.y : o.py + (o.y - o.py) * E.alpha; let bi = me.idx, bd = 1e18; for (let q = -20; q <= 150; q++) { const m = (idx + q + M) % M, c = P[m], dd = (c.x - ix) ** 2 + (c.y - iy) ** 2; if (dd < bd) { bd = dd; bi = m; } } proj(ix, iy, hgt[bi] + 8); if (_d > 10) items.push({ d: _d - 16, dd: _d, kind: 5, o, sx: _sx, sy: _sy, gz: hgt[bi] }); }
    items.sort((a, b) => b.d - a.d);

    // ── 그리기 (먼 것 → 가까운 것) ──
    const quad = (a, b, c, d, color, edge) => { ctx.fillStyle = color; const o = edge ? 1.2 : 0; ctx.beginPath(); ctx.moveTo(X[a], Y[a] + o); ctx.lineTo(X[b], Y[b] + o); ctx.lineTo(X[c], Y[c]); ctx.lineTo(X[d], Y[d]); ctx.closePath(); ctx.fill(); };
    const pc = (color) => tbl(color, fogc), cols = st.cols;
    if (!cols.road) { cols.road = tbl(th.road, fogc); cols.road2 = tbl(mixHex(th.road, '#ffffff', 0.07), fogc); cols.sh = tbl(th.shoulder, fogc); cols.sh2 = tbl(mixHex(th.shoulder, '#000000', 0.07), fogc); cols.skirt = tbl(mixHex(th.bg, '#000000', 0.28), fogc); cols.c0 = tbl(th.curb[0], fogc); cols.c1 = tbl(th.curb[1], fogc); cols.line = tbl(th.line, fogc); const dc = mixHex(th.road, th.slow, 0.85); cols.rail0 = tbl(mixHex('#8d949c', '#000000', clamp(0.5 - propSt.B * 0.5, 0, 0.5)), fogc); cols.rail1 = tbl(mixHex('#656b73', '#000000', clamp(0.5 - propSt.B * 0.5, 0, 0.5)), fogc); cols.dust = tbl(dc, fogc); cols.dust2 = tbl(mixHex(dc, '#ffffff', 0.08), fogc); }
    ctx.lineJoin = 'round';
    for (const it of items) {
      if (it.kind === 0) {
        const e = it.e, a = e * NP, b = (e + 1) * NP, L = lvlOf(dep[e + 1]), stripe = Math.floor(ks[e] * ds / 40) & 1, st2 = Math.floor(ks[e] * ds / 70) & 1;
        const cc = stripe ? cols.c1 : cols.c0;
        if (hgt[((ks[e] % M) + M) % M] - gz > 22) { quad(a + 0, a + 1, b + 1, b + 0, cols.skirt[L], true); quad(a + 8, a + 9, b + 9, b + 8, cols.skirt[L], true); } // 평평한 곳은 비탈 생략
        quad(a + 1, a + 8, b + 8, b + 1, (stripe ? cols.sh : cols.sh2)[L], true);
        quad(a + 2, a + 3, b + 3, b + 2, cc[L], true); quad(a + 6, a + 7, b + 7, b + 6, cc[L], true);
        { const dm = T.space && (T.dust[((ks[e] % M) + M) % M] || E.stormN > 0.5); quad(a + 3, a + 6, b + 6, b + 3, (dm ? (stripe ? cols.dust : cols.dust2) : (stripe ? cols.road : cols.road2))[L], true); }
        if (st2) quad(a + 4, a + 5, b + 5, b + 4, cols.line[L], true);
        { const wc = SPC ? (stripe ? cols.rail0 : cols.rail1)[L] : cc[L]; // 우주: 금속 가드레일(밝고 어두운 마디)
          quad(a + 1, a + 10, b + 10, b + 1, wc, true); quad(a + 8, a + 11, b + 11, b + 8, wc, true); }
        continue;
      }
      const dz = it.dd || it.d, L = lvlOf(dz), s = F / Math.max(dz, 1);
      if (it.kind === 1) { // 장식(나무·건물…): 땅에 선 그림
        const o = it.o, sz = o.s * 1.25 * s, near = it.d < DIST + 200 ? Math.max(0, (it.d - (DIST + 50)) / 150) : 1;
        if (near <= 0.02) continue; // 카메라·내 차 가까이 온 장식은 그리지 않는다(내 차 위를 덮어 희미하게 보임)
        const fade = L > 5 ? 0.5 : near; if (fade < 1) ctx.globalAlpha = fade;
        if (o.e === 'crater') { // 🚀 크레이터: 밝은 테두리 + 햇빛 쪽 안쪽 그림자
          const rr = o.s * 1.4; let okc = true; const ring = [], inner = [];
          for (let k2 = 0; k2 < 12; k2++) { const an = k2 / 12 * TAU, ca = Math.cos(an), sa = Math.sin(an); proj(o.x + ca * rr, o.y + sa * rr, it.z); if (_d < 8) { okc = false; break; } ring.push(_sx, _sy); proj(o.x + ca * rr * 0.74 + sunX * rr * 0.16, o.y + sa * rr * 0.74 + sunY * rr * 0.16, it.z); inner.push(_sx, _sy); }
          if (okc) { ctx.fillStyle = craterRim; ctx.beginPath(); for (let k2 = 0; k2 < 12; k2++) ctx.lineTo(ring[k2 * 2], ring[k2 * 2 + 1]); ctx.closePath(); ctx.fill(); ctx.fillStyle = craterIn; ctx.beginPath(); for (let k2 = 0; k2 < 12; k2++) ctx.lineTo(inner[k2 * 2], inner[k2 * 2 + 1]); ctx.closePath(); ctx.fill(); }
        } else if (o.e === 'lake') { // 타이탄: 메탄 호수(어둡고 반짝이는 표면)
          const rr = o.s * 1.6; let okc = true; const ring = [];
          for (let k2 = 0; k2 < 12; k2++) { const an = k2 / 12 * TAU; proj(o.x + Math.cos(an) * rr, o.y + Math.sin(an) * rr * 0.8, it.z); if (_d < 8) { okc = false; break; } ring.push(_sx, _sy); }
          if (okc) { ctx.fillStyle = '#26332f'; ctx.beginPath(); for (let k2 = 0; k2 < 12; k2++) ctx.lineTo(ring[k2 * 2], ring[k2 * 2 + 1]); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(255,215,160,.35)'; ctx.lineWidth = Math.max(1, 2 * s); ctx.stroke(); }
        } else if (o.e === 'vent') { // 이오: 화산 분출구와 연기
          const w2 = sz * 0.9, h2 = sz * 0.7, X0 = it.sx, Y0 = it.sy;
          ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(X0 - propSt.side * w2 * 0.4, Y0 + 2, w2 * 0.7, w2 * 0.12, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = mixHex('#4a3418', '#000000', 1 - propSt.B); ctx.beginPath(); ctx.moveTo(X0 - w2 * 0.55, Y0); ctx.lineTo(X0 - w2 * 0.14, Y0 - h2); ctx.lineTo(X0 + w2 * 0.14, Y0 - h2); ctx.lineTo(X0 + w2 * 0.55, Y0); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#ff7a2a'; ctx.beginPath(); ctx.ellipse(X0, Y0 - h2, w2 * 0.14, h2 * 0.1, 0, 0, TAU); ctx.fill();
          for (let k2 = 0; k2 < 4; k2++) { ctx.fillStyle = `rgba(${200 - k2 * 20},${185 - k2 * 22},${120},${0.5 - k2 * 0.1})`; ctx.beginPath(); ctx.arc(X0 + Math.sin(E.t * 1.2 + k2) * w2 * 0.12, Y0 - h2 - (k2 + 0.5) * h2 * 0.45, w2 * (0.16 + k2 * 0.07), 0, TAU); ctx.fill(); }
        } else if (o.e === 'rock') { // 우주: 모난 바위(햇빛 쪽이 밝고 반대쪽은 어둡다) + 그림자
          const w2 = sz * 0.95, h2 = sz * 0.75, X0 = it.sx, Y0 = it.sy, sd = propSt.side, pts = [[-0.5, 0], [-0.45, -0.4], [-0.18, -0.8], [0.12, -0.62], [0.34, -1], [0.5, -0.35], [0.46, 0]];
          ctx.fillStyle = 'rgba(0,0,0,.32)'; ctx.beginPath(); ctx.ellipse(X0 - sd * w2 * 0.45, Y0 + 2, w2 * 0.8, w2 * 0.12, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = rockCol; ctx.beginPath(); pts.forEach(([a2, b2], k2) => (k2 ? ctx.lineTo(X0 + a2 * w2, Y0 + b2 * h2) : ctx.moveTo(X0 + a2 * w2, Y0 + b2 * h2))); ctx.closePath(); ctx.fill();
          ctx.fillStyle = rockHi; ctx.beginPath(); ctx.moveTo(X0 + sd * 0.46 * w2, Y0); ctx.lineTo(X0 + sd * 0.45 * w2, Y0 - 0.4 * h2); ctx.lineTo(X0 + sd * 0.18 * w2, Y0 - 0.8 * h2); ctx.lineTo(X0 - sd * 0.02 * w2, Y0 - 0.3 * h2); ctx.lineTo(X0 + sd * 0.08 * w2, Y0); ctx.closePath(); ctx.fill();
        } else if (o.e === 'ice') { // 유로파: 얼음 기둥
          const w2 = sz * 0.9, h2 = sz * 1.1, X0 = it.sx, Y0 = it.sy, sd = propSt.side;
          ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(X0 - sd * w2 * 0.4, Y0 + 2, w2 * 0.7, w2 * 0.1, 0, 0, TAU); ctx.fill();
          for (const [dx2, hh, ww] of [[-0.28, 0.7, 0.26], [0, 1, 0.3], [0.3, 0.6, 0.24]]) { ctx.fillStyle = mixHex('#bfe0f4', '#000000', 1 - propSt.B); ctx.beginPath(); ctx.moveTo(X0 + (dx2 - ww / 2) * w2, Y0); ctx.lineTo(X0 + dx2 * w2, Y0 - hh * h2); ctx.lineTo(X0 + (dx2 + ww / 2) * w2, Y0); ctx.closePath(); ctx.fill(); ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.2 * propSt.B})`; ctx.beginPath(); ctx.moveTo(X0 + dx2 * w2, Y0 - hh * h2); ctx.lineTo(X0 + (dx2 + sd * ww / 2) * w2, Y0); ctx.lineTo(X0 + dx2 * w2, Y0); ctx.closePath(); ctx.fill(); }
        } else if (o.e === 'pebble' || o.e === 'dish' || o.e === 'lander' || o.e === 'hab' || o.e === 'solar' || o.e === 'mast') {
          drawProp(ctx, o.e, it.sx, it.sy, sz * (o.e === 'pebble' ? 0.55 : o.e === 'hab' ? 1.05 : 0.9), propSt);
        } else ctx.drawImage(U.emo(o.e), it.sx - sz / 2, it.sy - sz * 0.92, sz, sz);
        if (fade < 1) ctx.globalAlpha = 1;
      } else if (it.kind === 2) { // 아이템 상자(빙글빙글)
        const w = 30 * s * (0.35 + 0.65 * Math.abs(Math.cos(E.t * 2.4 + it.i))), h = 30 * s; ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#c98a00'; ctx.lineWidth = Math.max(1, 2 * s);
        ctx.beginPath(); ctx.roundRect(it.sx - w / 2, it.sy - h / 2, w, h, 5 * s); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = 'bold ' + Math.max(8, 22 * s) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', it.sx, it.sy + 1);
      } else if (it.kind === 3) { // 길 위의 지대(바닥에 깔린 모양)
        const z = it.z, c = Math.cos(z.a), sn = Math.sin(z.a), hz = hgt[z.idx], pts = [];
        const q = (u, v, up) => { proj(z.x + c * u - sn * v, z.y + sn * u + c * v, hz + (up || 0)); return [_sx, _sy, _d]; };
        let poly;
        if (z.type === 'boost' || z.type === 'jump') { const w = z.type === 'jump' ? 40 : 34, l = z.type === 'jump' ? 36 : 34; poly = [q(-l, -w, 0), q(l, -w, z.type === 'jump' ? 26 : 0), q(l, w, z.type === 'jump' ? 26 : 0), q(-l, w, 0)]; }
        else { const rx2 = z.r, ry2 = z.r * 0.8; poly = []; for (let a = 0; a < 12; a++) poly.push(q(Math.cos(a / 12 * TAU) * rx2, Math.sin(a / 12 * TAU) * ry2, 0)); }
        if (poly.some((p) => p[2] < 6)) continue;
        const base = z.type === 'boost' ? '#00c8ff' : z.type === 'jump' ? '#ff9f1c' : z.type === 'ice' ? '#bfeaff' : th.slow;
        ctx.fillStyle = pc(base)[L]; ctx.beginPath(); poly.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fill();
        if (z.type === 'boost' || z.type === 'jump') { ctx.strokeStyle = z.type === 'jump' ? '#fff3c4' : '#ffffff'; ctx.lineWidth = Math.max(1.5, 4 * s); ctx.lineCap = 'round';
          for (const o of z.type === 'jump' ? [-18, 0, 18] : [-12, 10]) { const a1 = q(o, -18, 0), a2 = q(o + 14, 0, 0), a3 = q(o, 18, 0); ctx.beginPath(); ctx.moveTo(a1[0], a1[1]); ctx.lineTo(a2[0], a2[1]); ctx.lineTo(a3[0], a3[1]); ctx.stroke(); } }
      } else if (it.kind === 7) { // 🚀 바퀴가 일으키는 먼지(중력이 약할수록 오래 떠 있다)
        const p = it.p, k3 = p.t / p.life, rad = (12 + 46 * k3) * s; ctx.fillStyle = dustRGB + (0.34 * (1 - k3) ** 1.3).toFixed(3) + ')'; ctx.beginPath(); ctx.ellipse(it.sx, it.sy - rad * 0.4, rad, rad * 0.62, 0, 0, TAU); ctx.fill();
      } else if (it.kind === 6) { // 내 차 꼬리 효과
        const p = it.p, sz = 26 * s * (1 - 0.4 * p.t / 0.6); ctx.globalAlpha = 1 - p.t / 0.6; ctx.drawImage(U.emo(p.e), it.sx - sz / 2, it.sy - sz * 0.6, sz, sz); ctx.globalAlpha = 1;
      } else if (it.kind === 4) { // 차 (10% 크게)
        const s = F / Math.max(dz, 1) * 1.1;
        const r = it.r, rel2 = Math.atan2(Math.sin(r.dh - yaw), Math.cos(r.dh - yaw)), front = Math.abs(rel2) > 2.1, spr = kartSprite(r.car, front, r.col);
        const w = 56 * s * (1 + 0.5 * Math.abs(Math.sin(rel2))), h = 40 * s, lift = r.zair * s * 0.9;
        ctx.fillStyle = SPC ? 'rgba(0,0,0,.5)' : 'rgba(0,0,0,.32)'; ctx.beginPath(); ctx.ellipse(it.sx - (SPC ? propSt.side * 9 * s : 0), it.sy, 30 * s, 9 * s, 0, 0, TAU); ctx.fill();
        ctx.save(); ctx.translate(it.sx, it.sy - lift); if (r.stun > 0) ctx.rotate(Math.sin(r.spin * 1.5) * 0.45);
        if (r.boost > 0) { ctx.fillStyle = '#ff9f1c'; ctx.beginPath(); ctx.moveTo(-7 * s, -4 * s); ctx.lineTo(0, 22 * s * (0.7 + Math.random() * 0.5)); ctx.lineTo(7 * s, -4 * s); ctx.fill(); }
        ctx.drawImage(spr, -w / 2, -h * 1.02, w, h);
        const ey = -h * 0.92, showFace = E.state === 'count' || Math.abs(rel2) > 1.25; // 출발 전엔 얼굴, 출발하면 뒷모습
        ctx.save(); ctx.translate(0, ey); ctx.scale(s, s); if (showFace) U.stamp(ctx, r.ch.e, 24); else { const sz = 96 * 24 / 76; ctx.drawImage(charBack(r.ch), -sz / 2, -sz / 2, sz, sz); } if (r.hat) { ctx.translate(0, -13); U.stamp(ctx, r.hat, 15); } ctx.restore();
        if (T.space) { // 🚀 우주 코스: 운전석에 유리 돔(반투명 + 반사광 + 아래 테두리)
          ctx.save(); ctx.translate(0, ey); ctx.scale(s, s);
          const gl = ctx.createRadialGradient(-7, -9, 2, 0, 0, 25); gl.addColorStop(0, 'rgba(235,250,255,.55)'); gl.addColorStop(0.55, 'rgba(150,215,255,.14)'); gl.addColorStop(1, 'rgba(120,190,255,.32)');
          ctx.fillStyle = gl; ctx.beginPath(); ctx.ellipse(0, 1, 23, 22, 0, 0, TAU); ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.8; ctx.stroke();
          ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 1, 17, 3.5, 4.55); ctx.stroke();
          ctx.fillStyle = 'rgba(45,55,80,.9)'; ctx.fillRect(-21, 15, 42, 5);
          ctx.restore();
        }
        if (r.shield > 0) { ctx.strokeStyle = 'rgba(80,220,255,.9)'; ctx.lineWidth = Math.max(2, 4 * s); ctx.beginPath(); ctx.ellipse(0, -h * 0.55, 34 * s, 30 * s, 0, 0, TAU); ctx.stroke(); }
        if (r.frozen > 0) { ctx.save(); ctx.translate(0, -h * 0.5); ctx.scale(s, s); ctx.globalAlpha = 0.85; U.stamp(ctx, '🧊', 44); ctx.restore(); }
        if (r.isPlayer) { ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-7 * s, -h * 1.42); ctx.lineTo(7 * s, -h * 1.42); ctx.lineTo(0, -h * 1.22); ctx.closePath(); ctx.stroke(); ctx.fill(); }
        ctx.restore();
      } else if (it.kind === 5) { // 던진 것
        const o = it.o;
        if (o.k === 'oil') { ctx.fillStyle = 'rgba(20,20,30,.85)'; ctx.beginPath(); ctx.ellipse(it.sx, it.sy + 4 * s, o.r * s, o.r * 0.55 * s, 0, 0, TAU); ctx.fill(); }
        else if (o.k === 'pit') { ctx.fillStyle = '#6b4a2b'; ctx.beginPath(); ctx.ellipse(it.sx, it.sy + 4 * s, o.r * s, o.r * 0.6 * s, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#0e0906'; ctx.beginPath(); ctx.ellipse(it.sx, it.sy + 5 * s, o.r * 0.8 * s, o.r * 0.46 * s, 0, 0, TAU); ctx.fill(); }
        else { ctx.save(); ctx.translate(it.sx, it.sy); ctx.scale(s, s); ctx.translate(0, -14); U.stamp(ctx, o.k === 'banana' ? '🍌' : o.k === 'trap' ? '🪤' : o.k === 'ice' ? '🧊' : '🎯', 34); ctx.restore(); }
      }
    }
    if (SPC) { const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.78); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.38)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H); } // 렌즈 가장자리 어둡게
    if (E.stormN > 0 && T.space) { const c = rgb(th.slow); ctx.fillStyle = `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${0.2 * E.stormN})`; ctx.fillRect(0, 0, W, H); } // 후반 날씨: 먼지 안개
  }
  window.Race3D = { draw, charBack };
})();
