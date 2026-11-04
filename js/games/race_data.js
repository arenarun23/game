// 레이싱 데이터: 캐릭터 4, 차 4, 경기장 8 + 트랙 만들기
(function () {
  'use strict';
  const TAU = Math.PI * 2;

  // 캐릭터: 특징(mod) + 전용 스킬. acc 가속, max 최고속도, turn 핸들, mass 무게, off 풀밭 보너스
  const CHARS = [
    { id: 'toto', n: '토토', e: '🐰', color: 'pink', trait: '가속이 빨라요', skill: { id: 'dash', n: '점프 대시', e: '💨', d: '순간적으로 확 빨라져요', cd: 8 }, mod: { acc: 1.25, max: 1, turn: 1, mass: 0.9, off: 0 } },
    { id: 'gom', n: '곰곰이', e: '🐻', color: 'orange', trait: '튼튼해서 잘 안 밀려요', skill: { id: 'shield', n: '방패', e: '🛡️', d: '3초 동안 공격을 막아요', cd: 12 }, mod: { acc: 0.95, max: 1, turn: 0.95, mass: 1.5, off: 0.12 } },
    { id: 'yeo', n: '여우리', e: '🦊', color: 'lemon', trait: '핸들이 아주 좋아요', skill: { id: 'trap', n: '함정', e: '🪤', d: '뒤에 함정을 놓아요', cd: 9 }, mod: { acc: 1, max: 1, turn: 1.2, mass: 0.85, off: 0 } },
    { id: 'peng', n: '펭구', e: '🐧', color: 'sky', trait: '얼음길에서도 안 미끄러워요', skill: { id: 'ice', n: '얼음 발사', e: '🧊', d: '맞은 차가 꽁꽁 얼어요', cd: 10 }, mod: { acc: 1, max: 1.04, turn: 1, mass: 1, off: 0, ice: 1 } },
  ];

  // 차: 능력치(st) + 전용 스킬. bars = 화면에 보여 줄 별점(속도·가속·핸들·튼튼)
  const CARS = [
    { id: 'bolt', n: '번개호', e: '🏎️', color: '#e74c3c', ui: 'pink', trait: '최고 속도가 빨라요', skill: { id: 'turbo', n: '터보', e: '🚀', d: '2초 동안 큰 부스트', cd: 14 }, st: { speed: 1.12, acc: 0.9, turn: 0.85, mass: 1, off: 0 }, bars: [5, 3, 2, 2] },
    { id: 'tank', n: '튼튼이', e: '🚙', color: '#27ae60', ui: 'mint', trait: '풀밭도 잘 달려요', skill: { id: 'wave', n: '충격파', e: '💥', d: '주변 차를 밀어내요', cd: 13 }, st: { speed: 1.0, acc: 1.0, turn: 0.95, mass: 1.4, off: 0.3 }, bars: [3, 3, 3, 5] },
    { id: 'slide', n: '미끄리', e: '🛻', color: '#3498db', ui: 'sky', trait: '커브를 잘 돌아요', skill: { id: 'oil', n: '기름 웅덩이', e: '🛢️', d: '밟으면 미끄러져요', cd: 10 }, st: { speed: 0.97, acc: 1.0, turn: 1.22, mass: 0.9, off: 0 }, bars: [3, 3, 5, 2] },
    { id: 'van', n: '든든이', e: '🚐', color: '#f1c40f', ui: 'lemon', trait: '출발이 빨라요', skill: { id: 'magnet', n: '아이템 뽑기', e: '🎁', d: '아이템을 바로 받아요', cd: 11 }, st: { speed: 0.95, acc: 1.18, turn: 1, mass: 1.1, off: 0.05 }, bars: [2, 5, 3, 3] },
  ];

  // ───────── 경기장 ─────────
  // 모양은 꼭짓점(poly)으로 그리면 자동으로 부드러운 곡선이 된다. 이지 8개 + 하드 8개, 모양이 모두 다르다.
  const poly = (f, n) => Array.from({ length: n }, (_, i) => f(i / n * TAU));
  const lemn = (A, B, n, extra) => poly((t) => [A * Math.sin(t), B * Math.sin(t) * Math.cos(t) + (extra || 0) * Math.sin(3 * t)], n);
  const polar = (R, k, a, n, ph) => poly((th) => { const r = R * (1 + a * Math.cos(k * th + (ph || 0))); return [r * Math.cos(th), r * Math.sin(th)]; }, n);
  const heart = (s, n) => poly((t) => [s * 16 * Math.sin(t) ** 3, -s * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))], n);
  const trefoil = (s, n) => poly((t) => [s * (Math.sin(t) + 2 * Math.sin(2 * t)), s * (Math.cos(t) - 2 * Math.cos(2 * t))], n);

  // 장소별 색·장식 (이지/하드 공통)
  const TH = {
    meadow: { bg: '#7ed56f', shoulder: '#6cc35e', road: '#5a5f6a', curb: ['#e74c3c', '#ffffff'], line: '#ffffff', slow: '#8a6a3c', deco: ['🌳', '🌲', '🌼', '🌷', '🍄'] },
    desert: { bg: '#f3d58a', shoulder: '#e8c477', road: '#7a6a55', curb: ['#d35400', '#ffffff'], line: '#fff3c4', slow: '#c9a45a', deco: ['🌵', '🪨', '🦂', '🐪', '🏜️'] },
    snow: { bg: '#eaf6ff', shoulder: '#d8ecf8', road: '#7f8da0', curb: ['#2980b9', '#ffffff'], line: '#ffffff', slow: '#cfe3f0', deco: ['⛄', '🌲', '❄️', '🏔️', '🎿'] },
    beach: { bg: '#ffe9a8', shoulder: '#fbdc8a', road: '#6d7a88', curb: ['#16a085', '#ffffff'], line: '#ffffff', slow: '#5dade2', deco: ['🌴', '🐚', '⛱️', '🦀', '🏐'] },
    candy: { bg: '#ffc7e0', shoulder: '#ffb3d4', road: '#8e6bb8', curb: ['#ff6fb5', '#ffffff'], line: '#fff3fb', slow: '#c0392b', deco: ['🍭', '🧁', '🍩', '🍬', '🍪'] },
    city: { bg: '#1f2a44', shoulder: '#2a3658', road: '#3b3f4f', curb: ['#ff4fa3', '#4fe3ff'], line: '#ffe94f', slow: '#1b1f2d', deco: ['🏢', '🏙️', '💡', '🌃', '🚦'] },
    lava: { bg: '#3a1a14', shoulder: '#552218', road: '#4a4a52', curb: ['#ff7a1a', '#222222'], line: '#ffd6a0', slow: '#ff5a1f', deco: ['🌋', '🔥', '🪨', '💀', '🦇'] },
    space: { bg: '#0b0b2a', shoulder: '#15154a', road: '#46486a', curb: ['#9b59b6', '#ffffff'], line: '#7ff7ff', slow: '#2c2c5a', deco: ['⭐', '🪐', '🛰️', '☄️', '🌙'] },
  };
  // 이지: 넓은 길(w 170), 부드러운 모양 / 하드: 좁은 길(w 130), 급커브·꼬인 모양, 함정 더 많음
  const T = (th, n, e, shape, gim, pts, w, s0, haz) => ({ id: th, n, e, shape, gim, poly: pts, w, s0, theme: TH[th], haz, rmin: w >= 170 ? 215 : 125 });
  const sc = (pts, k) => pts.map((p) => [p[0] * k, p[1] * k]);
  const TRACKS_EASY = [
    T('meadow', '푸른 초원', '🌳', '콩 모양', '둥글둥글 처음 달리기 좋아요', [[-1000, -300], [-700, -650], [-100, -700], [500, -600], [1000, -350], [1150, 150], [800, 550], [300, 330], [-100, 500], [-700, 600], [-1100, 250]], 170, 0.06, { boost: 5, slow: 3, ice: 0 }),
    T('desert', '사막 협곡', '🌵', '8자 모양', '가운데서 길이 만나요!', lemn(1300, 850, 20), 170, 0.14, { boost: 7, slow: 3, ice: 0 }),
    T('snow', '눈 덮인 산', '⛄', 'ㄴ자 모양', '넓은 직선 + 큰 모퉁이', [[-1100, -800], [100, -800], [100, 0], [1200, 0], [1200, 800], [-1100, 800]], 170, 0.02, { boost: 3, slow: 2, ice: 6 }),
    T('beach', '반짝 해변', '🏖️', '땅콩 모양', '긴 파도 같은 길', sc([[-1500, 0], [-1200, -330], [-700, -380], [-300, -200], [200, -380], [700, -380], [1150, -330], [1500, 0], [1150, 330], [700, 300], [200, 380], [-300, 200], [-700, 380], [-1200, 330]], 1.15), 170, 0.05, { boost: 4, slow: 6, ice: 0 }),
    T('candy', '사탕 나라', '🍭', '클로버 모양', '네 번 크게 돌아요', polar(1100, 4, 0.26, 32), 170, 0.0, { boost: 4, slow: 5, ice: 0 }),
    T('city', '밤의 도시', '🌃', 'T자 모양', '직각으로 꺾이는 큰길', sc([[-1300, -800], [1300, -800], [1300, -200], [400, -200], [400, 800], [-400, 800], [-400, -200], [-1300, -200]], 1.3), 170, 0.03, { boost: 8, slow: 2, ice: 0 }),
    T('lava', '용암 동굴', '🌋', '화살촉 모양', '뾰족한 끝을 조심!', sc([[-1400, 900], [-650, -100], [0, -1050], [650, -100], [1400, 900], [0, 650]], 1.45), 170, 0.03, { boost: 4, slow: 6, ice: 0 }),
    T('space', '우주 정거장', '🪐', 'ㄷ자 모양', '활짝 열린 말굽 길', sc([[-1100, -900], [900, -900], [1250, -550], [1250, 550], [900, 900], [-1100, 900], [-1100, 300], [550, 300], [550, -300], [-1100, -300]], 1.2), 170, 0.02, { boost: 6, slow: 0, ice: 4 }),
  ];
  const TRACKS_HARD = [
    T('meadow', '푸른 초원', '🌳', '지그재그', '번갈아 꺾이는 S자 연속 커브', [[-1500, -300], [-1250, -850], [-900, -300], [-550, -850], [-200, -300], [150, -850], [500, -300], [850, -850], [1200, -300], [1500, 0], [1250, 850], [900, 300], [550, 850], [200, 300], [-150, 850], [-500, 300], [-850, 850], [-1200, 300]], 130, 0.0, { boost: 6, slow: 5, ice: 0 }),
    T('desert', '사막 협곡', '🌵', '꼬인 8자', '8자 + 구불구불 휘어진 길', lemn(1500, 950, 30, 150), 130, 0.14, { boost: 9, slow: 5, ice: 0 }),
    T('snow', '눈 덮인 산', '⛄', '별 서킷', '다섯 개의 뾰족한 모퉁이', polar(1250, 5, 0.3, 40), 130, 0.0, { boost: 4, slow: 3, ice: 9 }),
    T('beach', '반짝 해변', '🏖️', '물결 서킷', '좌우로 출렁이는 지그재그', [[-1600, 0], [-1300, -500], [-900, -200], [-500, -600], [-100, -200], [300, -600], [700, -200], [1100, -500], [1600, 0], [1100, 500], [700, 200], [300, 600], [-100, 200], [-500, 600], [-900, 200], [-1300, 500]], 130, 0.03, { boost: 5, slow: 9, ice: 0 }),
    T('candy', '사탕 나라', '🍭', '하트 서킷', '가운데가 푹 들어간 하트', [[0, -500], [350, -1000], [850, -1000], [1200, -600], [1150, -50], [650, 550], [0, 1050], [-650, 550], [-1150, -50], [-1200, -600], [-850, -1000], [-350, -1000]], 130, 0.5, { boost: 5, slow: 8, ice: 0 }),
    T('city', '밤의 도시', '🌃', '계단 서킷', '직각 모퉁이가 계단처럼', [[-1400, -900], [-600, -900], [-600, -500], [0, -500], [0, -100], [600, -100], [600, 300], [1300, 300], [1300, 900], [-1400, 900]], 130, 0.0, { boost: 10, slow: 3, ice: 0 }),
    T('lava', '용암 동굴', '🌋', 'G자 서킷', '안쪽으로 파고드는 급커브', [[-1200, -900], [1200, -900], [1200, -350], [-700, -350], [-700, 350], [450, 350], [450, -50], [1200, -50], [1200, 900], [-1200, 900]], 130, 0.02, { boost: 5, slow: 9, ice: 0 }),
    T('space', '우주 정거장', '🪐', '세잎 매듭', '세 번 만나는 꼬인 길', trefoil(430, 36), 130, 0.1, { boost: 8, slow: 0, ice: 7 }),
  ];

  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // 꼭짓점 → 부드러운 닫힌 곡선(모서리 깎기 반복) → 일정 간격(약 12)의 점
  function smooth(pts, it) {
    let a = pts;
    for (let k = 0; k < it; k++) { const b = []; for (let i = 0; i < a.length; i++) { const p = a[i], q = a[(i + 1) % a.length]; b.push([0.75 * p[0] + 0.25 * q[0], 0.75 * p[1] + 0.25 * q[1]], [0.25 * p[0] + 0.75 * q[0], 0.25 * p[1] + 0.75 * q[1]]); } a = b; }
    return a;
  }
  // 닫힌 점들을 일정 간격 M개로 다시 뽑는다(start = 시작 위치를 몇 번째 점으로 옮길지)
  function resample(raw, M, start) {
    const NR = raw.length, cum = [0];
    for (let i = 1; i <= NR; i++) { const a = raw[i - 1], b = raw[i % NR]; cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
    const L = cum[NR], ds = L / M, out = [];
    for (let j = 0; j < M; j++) {
      const s = (((j + start) % M) + M) % M * ds; let lo = 0, hi = NR;
      while (lo < hi - 1) { const mid = (lo + hi) >> 1; if (cum[mid] <= s) lo = mid; else hi = mid; }
      const a = raw[lo], b = raw[(lo + 1) % NR], f = (s - cum[lo]) / ((cum[lo + 1] - cum[lo]) || 1);
      out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
    }
    return { pts: out, L };
  }
  function minRadius(a) { // 실제 변 길이로 계산(점 간격이 고르지 않아도 정확)
    const M = a.length; let m = 1e9;
    for (let j = 0; j < M; j++) {
      const p = a[j], q = a[(j + 1) % M], r = a[(j + 2) % M], e1x = q[0] - p[0], e1y = q[1] - p[1], e2x = r[0] - q[0], e2y = r[1] - q[1];
      const da = Math.abs(Math.atan2(e1x * e2y - e1y * e2x, e1x * e2x + e1y * e2y)); if (da > 1e-6) m = Math.min(m, (Math.hypot(e1x, e1y) + Math.hypot(e2x, e2y)) / 2 / da);
    }
    return m;
  }
  // 곡선을 부드럽게 펴는 한 번의 작업(이웃 점의 평균으로 이동). 모서리가 둥글어지고 전체는 조금 줄어든다.
  function relaxOnce(a) {
    const M = a.length, c = new Array(M);
    for (let j = 0; j < M; j++) { const p = a[(j - 1 + M) % M], q = a[j], r = a[(j + 1) % M]; c[j] = [q[0] + 0.5 * ((p[0] + r[0]) / 2 - q[0]), q[1] + 0.5 * ((p[1] + r[1]) / 2 - q[1])]; }
    return c;
  }
  function perimeter(a) { let L = 0; for (let j = 0; j < a.length; j++) { const p = a[j], q = a[(j + 1) % a.length]; L += Math.hypot(q[0] - p[0], q[1] - p[1]); } return L; }
  function scaleTo(a, target) { // 중심을 기준으로 늘려서 원래 길이로 되돌린다
    const k = target / perimeter(a); let cx = 0, cy = 0; for (const p of a) { cx += p[0]; cy += p[1]; } cx /= a.length; cy /= a.length;
    return a.map((p) => [cx + (p[0] - cx) * k, cy + (p[1] - cy) * k]);
  }
  function buildTrack(def, seed) {
    const rnd = rng(seed * 7919 + 13), raw = smooth(def.poly, 6);
    const L0 = resample(raw, 8, 0).L, M = Math.round(L0 / 12);
    let cur = resample(raw, M, Math.floor((def.s0 || 0) * M)).pts, relaxed = 0;
    // 급커브가 목표(def.rmin)보다 날카로우면 목표를 넘을 때까지 조금씩 편다
    const Lkeep = perimeter(cur);
    for (let k = 0; k < 60 && minRadius(scaleTo(cur, Lkeep)) < (def.rmin || 0); k++) { for (let n = 0; n < 20; n++) cur = relaxOnce(cur); relaxed += 20; }
    if (relaxed) cur = scaleTo(cur, Lkeep);
    const rs = resample(cur, M, 0), L = rs.L, ds = L / M, pts = rs.pts.map((p) => ({ x: p[0], y: p[1] }));
    const minR = minRadius(rs.pts);
    for (let j = 0; j < M; j++) {
      const p = pts[(j - 1 + M) % M], q = pts[(j + 1) % M]; let tx = q.x - p.x, ty = q.y - p.y; const l = Math.hypot(tx, ty); tx /= l; ty /= l;
      Object.assign(pts[j], { tx, ty, nx: -ty, ny: tx });
    }
    const hw = def.w / 2, at = (j, lat) => { const c = pts[((j % M) + M) % M]; return { x: c.x + c.nx * lat, y: c.y + c.ny * lat, a: Math.atan2(c.ty, c.tx) }; };

    // 아이템 상자: 8곳에 3개씩
    const boxes = [];
    for (let g = 0; g < 8; g++) for (const f of [-0.5, 0, 0.5]) { const p = at(Math.floor((g + 0.5) / 8 * M), f * hw); boxes.push({ x: p.x, y: p.y }); }
    // 함정 지대: 부스트 패드 / 느려지는 곳 / 얼음
    const RAD = { boost: 36, slow: 46, ice: 56 }, haz = [];
    for (const type of ['boost', 'slow', 'ice']) {
      const n = def.haz[type] || 0;
      for (let i = 0; i < n; i++) { const t = ((i + 0.2 + rnd() * 0.6) / n) * 0.9 + 0.05, p = at(Math.floor(t * M), (rnd() * 1.2 - 0.6) * hw); haz.push({ type, x: p.x, y: p.y, r: RAD[type], a: p.a }); }
    }
    // 길가 장식
    const decos = [], sub = pts.filter((_, i) => i % 3 === 0);
    for (let tries = 0; decos.length < 260 && tries < 2500; tries++) {
      const j = Math.floor(rnd() * M), side = rnd() < 0.5 ? -1 : 1, p = at(j, side * hw * (1.9 + rnd() * 2.6));
      let ok = true; for (const c of sub) { const dx = c.x - p.x, dy = c.y - p.y; if (dx * dx + dy * dy < (hw * 1.85) * (hw * 1.85)) { ok = false; break; } }
      if (ok) decos.push({ x: p.x, y: p.y, e: def.theme.deco[Math.floor(rnd() * def.theme.deco.length)], s: 44 + rnd() * 34 });
    }
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const p of pts) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
    return { def, M, ds, pts, hw, len: L, minR, relaxed, boxes, haz, decos, bounds: { x0, x1, y0, y1 } };
  }

  window.RaceData = { CHARS, CARS, TRACKS_EASY, TRACKS_HARD, buildTrack };
})();
