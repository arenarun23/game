// 레이싱 3D 시점: 캔버스에 직접 그리는 원근 투영(외부 라이브러리 없음).
// 차 뒤에서 따라가는 카메라 → 언덕·다리(고가도로)·점프대가 보이고, 먼 곳은 안개에 묻힌다.
(function () {
  'use strict';
  const G = window.G, TAU = Math.PI * 2;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const DIST = 240, CAMH = 105, LEVELS = 12, FAR = 1900, NP = 12;

  // ───── 색(안개): 멀수록 지평선 색에 섞는다. 단계별 문자열을 미리 만들어 둔다 ─────
  const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const hex = (c) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mixHex = (a, b, t) => { const x = rgb(a), y = rgb(b); return hex(x.map((v, i) => v + (y[i] - v) * t)); };
  const tables = new Map();
  function tbl(color, fogc) { const key = color + fogc; let t = tables.get(key); if (!t) { t = []; for (let i = 0; i < LEVELS; i++) t.push(mixHex(color, fogc, (i / (LEVELS - 1)) * 0.88)); tables.set(key, t); } return t; }

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
  function kartSprite(car, front) {
    const U = G.raceUtil; // 56x40 세계 단위, 2.14배 해상도
    return U.sprite('k3:' + car.id + (front ? 'f' : 'b'), 120, 86, (g) => {
      g.translate(60, 80); g.scale(2.14, 2.14); // 발 밑 중앙이 (0,0)
      g.fillStyle = '#222'; g.beginPath(); g.roundRect(-27, -17, 11, 17, 3); g.roundRect(16, -17, 11, 17, 3); g.fill(); // 바퀴
      g.fillStyle = car.color; g.beginPath(); g.roundRect(-25, -26, 50, 20, 6); g.fill();       // 몸통
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(-25, -10, 50, 4);
      g.fillStyle = front ? 'rgba(180,225,255,.85)' : 'rgba(40,50,70,.8)'; g.beginPath(); g.roundRect(-14, -34, 28, 11, 4); g.fill(); // 창
      if (front) { g.fillStyle = '#fff5a8'; g.fillRect(-22, -22, 9, 5); g.fillRect(13, -22, 9, 5); }
      else { g.fillStyle = '#ff3b3b'; g.fillRect(-23, -23, 9, 5); g.fillRect(14, -23, 9, 5); }
      if (car.id === 'bolt') { g.fillStyle = '#222'; g.fillRect(-26, -36, 52, 4); g.fillRect(-18, -34, 3, 8); g.fillRect(15, -34, 3, 8); }
      else if (car.id === 'tank') { g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-20, -37, 40, 3); }
      else if (car.id === 'van') { g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-23, -32, 46, 3); }
    });
  }

  const st = { T: null };
  function hOfTrack(T, i0, f) { const M = T.M; return T.hgt[i0] + (T.hgt[(i0 + 1) % M] - T.hgt[i0]) * f; }

  function draw(E) {
    const { ctx, W, H, T, th, me, racers } = E, M = T.M, P = T.pts, hgt = T.hgt, hw = T.hw, ds = T.ds, U = G.raceUtil;
    const S = hw * 1.5, Cc = hw + 10, BAR = 26, fogc = th.sky[1];
    // ── 카메라 ──
    const yaw = E.yaw; fx = Math.cos(yaw); fy = Math.sin(yaw); rx = -fy; ry = fx;
    const meH = E.hOf(me), idx = me.idx;
    if (st.T !== T) { st.T = T; st.z = meH + CAMH; st.p = 0.16; st.gz = Math.min.apply(null, hgt) - 10; st.cols = {}; }
    const k = 1 - Math.exp(-(E.dt || 0.016) * 7);
    st.z += (meH + CAMH - st.z) * k;
    const hLook = hgt[(idx + 24) % M], pT = clamp(Math.atan2(st.z - hLook, DIST + 290) + 0.03, 0.05, 0.6); st.p += (pT - st.p) * k;
    Cx = me.dx - fx * DIST; Cy = me.dy - fy * DIST; Cz = st.z; cp = Math.cos(st.p); sp = Math.sin(st.p);
    F = Math.max(W * 0.8, H * 0.45); cxs = W / 2; cys = H * 0.54;
    const hy = cys - F * Math.tan(st.p), gz = st.gz;

    // ── 하늘·먼 산·땅 ──
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const gr = ctx.createLinearGradient(0, 0, 0, Math.max(10, hy)); gr.addColorStop(0, th.sky[0]); gr.addColorStop(1, th.sky[1]);
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, Math.max(10, hy) + 1);
    ctx.fillStyle = mixHex(th.bg, fogc, 0.55); ctx.fillRect(0, hy, W, H - hy + 1);
    const sc = H / 640;
    for (let layer = 0; layer < 2; layer++) {
      const ox = -yaw * F * (0.5 + 0.35 * layer), amp = (34 + layer * 16) * sc, base = hy + 1;
      ctx.fillStyle = th.ridge[layer]; ctx.beginPath(); ctx.moveTo(0, base);
      for (let x = 0; x <= W + 16; x += 16) { const q = (x + ox) * (0.0045 + layer * 0.003); ctx.lineTo(x, base - amp * (0.55 + 0.32 * Math.sin(q) + 0.22 * Math.sin(q * 2.7 + layer * 2) + 0.12 * Math.sin(q * 6.1))); }
      ctx.lineTo(W, base); ctx.closePath(); ctx.fill();
    }

    // ── 길 표본 투영 (가까운 곳은 촘촘히, 먼 곳은 성기게) ──
    const ks = [], lowQ = E.lowQ, reach = lowQ ? 110 : 150; let kk = idx - 8;
    for (;;) { ks.push(kk); const rel = kk - (idx - 8); if (rel > reach) break; kk += rel < 30 ? 1 : rel < 80 ? 2 : 4; }
    const n = ks.length, X = new Float32Array(n * NP), Y = new Float32Array(n * NP), ok = new Uint8Array(n), dep = new Float32Array(n);
    for (let e = 0; e < n; e++) {
      const m = ((ks[e] % M) + M) % M, c = P[m], h = hgt[m], skirt = S + Math.max(0, h - gz) * 0.9 + 50;
      const lat = [-skirt, -S, -Cc, -hw, -3, 3, hw, Cc, S, skirt, -S, S], z = [gz, h, h, h, h, h, h, h, h, gz, h + BAR, h + BAR];
      let valid = 1;
      for (let j = 0; j < NP; j++) { proj(c.x + c.nx * lat[j], c.y + c.ny * lat[j], z[j]); X[e * NP + j] = _sx; Y[e * NP + j] = _sy; if (_d < 8 && j >= 1 && j <= 8) valid = 0; if (j === 4) dep[e] = _d; }
      ok[e] = valid;
    }
    // ── 그릴 것 목록: 길 조각 + 장식 + 상자 + 지대 + 차 + 던진 것 ──
    const items = [];
    for (let e = 0; e < n - 1; e++) if (ok[e] && ok[e + 1]) items.push({ d: (dep[e] + dep[e + 1]) / 2, kind: 0, e });
    const rel = (i) => (((i - idx + 8) % M) + M) % M - 8, inWin = (i) => { const r = rel(i); return r >= -6 && r <= reach; };
    const cut = lowQ ? 2 : 1;
    for (let i = 0; i < T.decos.length; i += cut) { const d = T.decos[i]; if (!inWin(d.idx)) continue; const c = P[d.idx], lat = Math.abs((d.x - c.x) * c.nx + (d.y - c.y) * c.ny), z = Math.max(gz, hgt[d.idx] - Math.max(0, lat - S) * 0.9); proj(d.x, d.y, z); if (_d > 10 && _sx > -300 && _sx < W + 300) items.push({ d: _d, kind: 1, sx: _sx, sy: _sy, o: d }); }
    for (let i = 0; i < T.boxes.length; i++) { if (E.boxT[i] > 0) continue; const b = T.boxes[i]; if (!inWin(b.idx)) continue; proj(b.x, b.y, hgt[b.idx] + 18); if (_d > 10) items.push({ d: _d, kind: 2, sx: _sx, sy: _sy, i }); }
    for (const z of T.haz) { if (!inWin(z.idx)) continue; proj(z.x, z.y, hgt[z.idx]); if (_d > 10) items.push({ d: _d + 6, kind: 3, z }); }
    for (const r of racers) { const hz = E.hOf(r) - r.zair; proj(r.dx, r.dy, hz); if (_d > 10) items.push({ d: _d, kind: 4, r, sx: _sx, sy: _sy, hz }); }
    for (const o of E.objs) { const ix = o.px === undefined ? o.x : o.px + (o.x - o.px) * E.alpha, iy = o.py === undefined ? o.y : o.py + (o.y - o.py) * E.alpha; let bi = me.idx, bd = 1e18; for (let q = -20; q <= 150; q++) { const m = (idx + q + M) % M, c = P[m], dd = (c.x - ix) ** 2 + (c.y - iy) ** 2; if (dd < bd) { bd = dd; bi = m; } } proj(ix, iy, hgt[bi] + 8); if (_d > 10) items.push({ d: _d, kind: 5, o, sx: _sx, sy: _sy, gz: hgt[bi] }); }
    items.sort((a, b) => b.d - a.d);

    // ── 그리기 (먼 것 → 가까운 것) ──
    const quad = (a, b, c, d, color, edge) => { ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(X[a], Y[a]); ctx.lineTo(X[b], Y[b]); ctx.lineTo(X[c], Y[c]); ctx.lineTo(X[d], Y[d]); ctx.closePath(); ctx.fill(); if (edge) { ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.stroke(); } };
    const pc = (color) => tbl(color, fogc), sky = th.sky[1];
    const cols = st.cols; if (!cols.road) { cols.road = th.road; cols.road2 = mixHex(th.road, '#ffffff', 0.07); cols.sh = th.shoulder; cols.sh2 = mixHex(th.shoulder, '#000000', 0.07); cols.skirt = mixHex(th.bg, '#000000', 0.28); }
    ctx.lineJoin = 'round';
    for (const it of items) {
      if (it.kind === 0) {
        const e = it.e, a = e * NP, b = (e + 1) * NP, L = lvlOf(dep[e + 1]), stripe = Math.floor(ks[e] * ds / 40) & 1, st2 = Math.floor(ks[e] * ds / 70) & 1;
        quad(a + 0, a + 1, b + 1, b + 0, pc(cols.skirt)[L]); quad(a + 8, a + 9, b + 9, b + 8, pc(cols.skirt)[L]);
        quad(a + 1, a + 8, b + 8, b + 1, pc(stripe ? cols.sh : cols.sh2)[L], true);
        quad(a + 2, a + 3, b + 3, b + 2, pc(th.curb[stripe])[L], true); quad(a + 6, a + 7, b + 7, b + 6, pc(th.curb[stripe])[L], true);
        quad(a + 3, a + 6, b + 6, b + 3, pc(stripe ? cols.road : cols.road2)[L], true);
        if (st2) quad(a + 4, a + 5, b + 5, b + 4, pc(th.line)[L]);
        quad(a + 1, a + 10, b + 10, b + 1, pc(th.curb[stripe])[L]); quad(a + 8, a + 11, b + 11, b + 8, pc(th.curb[stripe])[L]);
        continue;
      }
      const L = lvlOf(it.d), s = F / Math.max(it.d, 1);
      if (it.kind === 1) { // 장식(나무·건물…): 땅에 선 그림
        const o = it.o, sz = o.s * 1.25 * s; ctx.globalAlpha = 1 - L / LEVELS * 0.7; ctx.drawImage(U.emo(o.e), it.sx - sz / 2, it.sy - sz * 0.92, sz, sz); ctx.globalAlpha = 1;
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
      } else if (it.kind === 4) { // 차
        const r = it.r, rel2 = Math.atan2(Math.sin(r.dh - yaw), Math.cos(r.dh - yaw)), front = Math.abs(rel2) > 2.1, spr = kartSprite(r.car, front);
        const w = 56 * s * (1 + 0.5 * Math.abs(Math.sin(rel2))), h = 40 * s, lift = r.zair * s * 0.9;
        ctx.fillStyle = 'rgba(0,0,0,.32)'; ctx.beginPath(); ctx.ellipse(it.sx, it.sy, 30 * s, 9 * s, 0, 0, TAU); ctx.fill();
        ctx.save(); ctx.translate(it.sx, it.sy - lift); if (r.stun > 0) ctx.rotate(Math.sin(r.spin * 1.5) * 0.45);
        if (r.boost > 0) { ctx.fillStyle = '#ff9f1c'; ctx.beginPath(); ctx.moveTo(-7 * s, -4 * s); ctx.lineTo(0, 22 * s * (0.7 + Math.random() * 0.5)); ctx.lineTo(7 * s, -4 * s); ctx.fill(); }
        ctx.drawImage(spr, -w / 2, -h * 1.02, w, h);
        const ey = -h * 0.92; ctx.save(); ctx.translate(0, ey); ctx.scale(s, s); U.stamp(ctx, r.ch.e, 24); ctx.restore();
        if (r.shield > 0) { ctx.strokeStyle = 'rgba(80,220,255,.9)'; ctx.lineWidth = Math.max(2, 4 * s); ctx.beginPath(); ctx.ellipse(0, -h * 0.55, 34 * s, 30 * s, 0, 0, TAU); ctx.stroke(); }
        if (r.frozen > 0) { ctx.save(); ctx.translate(0, -h * 0.5); ctx.scale(s, s); ctx.globalAlpha = 0.85; U.stamp(ctx, '🧊', 44); ctx.restore(); }
        if (r.isPlayer) { ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-7 * s, -h * 1.42); ctx.lineTo(7 * s, -h * 1.42); ctx.lineTo(0, -h * 1.22); ctx.closePath(); ctx.stroke(); ctx.fill(); }
        ctx.restore();
      } else if (it.kind === 5) { // 던진 것
        const o = it.o;
        if (o.k === 'oil') { ctx.fillStyle = 'rgba(20,20,30,.85)'; ctx.beginPath(); ctx.ellipse(it.sx, it.sy + 4 * s, o.r * s, o.r * 0.55 * s, 0, 0, TAU); ctx.fill(); }
        else { ctx.save(); ctx.translate(it.sx, it.sy); ctx.scale(s, s); ctx.translate(0, -14); U.stamp(ctx, o.k === 'banana' ? '🍌' : o.k === 'trap' ? '🪤' : o.k === 'ice' ? '🧊' : '🎯', 34); ctx.restore(); }
      }
    }
  }
  window.Race3D = { draw };
})();
