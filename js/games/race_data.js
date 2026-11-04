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

  // 경기장 8개. h = [바퀴 수k, 크기a, 위상p] 모양 변형, haz = 함정 개수
  const TRACKS = [
    { id: 'meadow', n: '푸른 초원', e: '🌳', gim: '처음 달리기 좋은 평범한 서킷', rx: 1300, ry: 850, h: [[3, 0.08, 0], [2, 0.05, 1]], w: 150,
      theme: { bg: '#7ed56f', shoulder: '#6cc35e', road: '#5a5f6a', curb: ['#e74c3c', '#ffffff'], line: '#ffffff', slow: '#8a6a3c', slowN: '진흙', deco: ['🌳', '🌲', '🌼', '🌷', '🍄'] }, haz: { boost: 5, slow: 3, ice: 0 } },
    { id: 'desert', n: '사막 협곡', e: '🌵', gim: '속도 패드가 많아요', rx: 1500, ry: 800, h: [[2, 0.16, 0.5], [5, 0.035, 0]], w: 150,
      theme: { bg: '#f3d58a', shoulder: '#e8c477', road: '#7a6a55', curb: ['#d35400', '#ffffff'], line: '#fff3c4', slow: '#c9a45a', slowN: '모래 구덩이', deco: ['🌵', '🪨', '🦂', '🐪', '🏜️'] }, haz: { boost: 8, slow: 3, ice: 0 } },
    { id: 'snow', n: '눈 덮인 산', e: '⛄', gim: '얼음판이 미끄러워요', rx: 1200, ry: 1000, h: [[3, 0.13, 0.3], [4, 0.04, 2]], w: 160,
      theme: { bg: '#eaf6ff', shoulder: '#d8ecf8', road: '#7f8da0', curb: ['#2980b9', '#ffffff'], line: '#ffffff', slow: '#cfe3f0', slowN: '눈더미', deco: ['⛄', '🌲', '❄️', '🏔️', '🎿'] }, haz: { boost: 3, slow: 2, ice: 7 } },
    { id: 'beach', n: '반짝 해변', e: '🏖️', gim: '물웅덩이에 들어가면 느려져요', rx: 1600, ry: 700, h: [[2, 0.12, 0], [3, 0.06, 1.2]], w: 150,
      theme: { bg: '#ffe9a8', shoulder: '#fbdc8a', road: '#6d7a88', curb: ['#16a085', '#ffffff'], line: '#ffffff', slow: '#5dade2', slowN: '물웅덩이', deco: ['🌴', '🐚', '⛱️', '🦀', '🏐'] }, haz: { boost: 4, slow: 7, ice: 0 } },
    { id: 'candy', n: '사탕 나라', e: '🍭', gim: '시럽은 끈적끈적해요', rx: 1250, ry: 1050, h: [[5, 0.09, 0], [2, 0.07, 2]], w: 160,
      theme: { bg: '#ffc7e0', shoulder: '#ffb3d4', road: '#8e6bb8', curb: ['#ff6fb5', '#ffffff'], line: '#fff3fb', slow: '#c0392b', slowN: '시럽', deco: ['🍭', '🧁', '🍩', '🍬', '🍪'] }, haz: { boost: 4, slow: 6, ice: 0 } },
    { id: 'city', n: '밤의 도시', e: '🌃', gim: '속도 패드가 번쩍번쩍', rx: 1450, ry: 900, h: [[4, 0.08, 0.7], [1, 0.07, 0]], w: 150,
      theme: { bg: '#1f2a44', shoulder: '#2a3658', road: '#3b3f4f', curb: ['#ff4fa3', '#4fe3ff'], line: '#ffe94f', slow: '#1b1f2d', slowN: '기름', deco: ['🏢', '🏙️', '💡', '🌃', '🚦'] }, haz: { boost: 9, slow: 2, ice: 0 } },
    { id: 'lava', n: '용암 동굴', e: '🌋', gim: '용암 웅덩이는 위험해요', rx: 1350, ry: 950, h: [[3, 0.15, 1.5], [6, 0.03, 0]], w: 160,
      theme: { bg: '#3a1a14', shoulder: '#552218', road: '#4a4a52', curb: ['#ff7a1a', '#222222'], line: '#ffd6a0', slow: '#ff5a1f', slowN: '용암', deco: ['🌋', '🔥', '🪨', '💀', '🦇'] }, haz: { boost: 4, slow: 7, ice: 0 } },
    { id: 'space', n: '우주 정거장', e: '🪐', gim: '부스트 링 + 미끄러운 바닥', rx: 1500, ry: 1000, h: [[2, 0.17, 0], [3, 0.08, 0.5], [7, 0.02, 0]], w: 160,
      theme: { bg: '#0b0b2a', shoulder: '#15154a', road: '#46486a', curb: ['#9b59b6', '#ffffff'], line: '#7ff7ff', slow: '#2c2c5a', slowN: '우주 먼지', deco: ['⭐', '🪐', '🛰️', '☄️', '🌙'] }, haz: { boost: 6, slow: 0, ice: 4 } },
  ];

  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // 닫힌 곡선 트랙을 일정 간격(약 12)의 점으로 만든다. 별 모양 곡선이라 스스로 교차하지 않는다.
  function buildTrack(def, seed) {
    const rnd = rng(seed * 7919 + 13), NR = 1800, raw = [];
    for (let i = 0; i < NR; i++) {
      const th = i / NR * TAU; let r = 1;
      for (const [k, a, p] of def.h) r += a * Math.cos(k * th + p);
      raw.push([def.rx * r * Math.cos(th), def.ry * r * Math.sin(th)]);
    }
    const cum = [0];
    for (let i = 1; i <= NR; i++) { const a = raw[i - 1], b = raw[i % NR]; cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
    const L = cum[NR], M = Math.round(L / 12), ds = L / M, pts = []; let seg = 0;
    for (let j = 0; j < M; j++) {
      const s = j * ds; while (cum[seg + 1] < s) seg++;
      const a = raw[seg], b = raw[(seg + 1) % NR], f = (s - cum[seg]) / ((cum[seg + 1] - cum[seg]) || 1);
      pts.push({ x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f });
    }
    let minR = 1e9;
    for (let j = 0; j < M; j++) {
      const p = pts[(j - 1 + M) % M], q = pts[(j + 1) % M]; let tx = q.x - p.x, ty = q.y - p.y; const l = Math.hypot(tx, ty); tx /= l; ty /= l;
      Object.assign(pts[j], { tx, ty, nx: -ty, ny: tx });
    }
    for (let j = 0; j < M; j++) { const a = pts[j], b = pts[(j + 1) % M], da = Math.abs(Math.atan2(a.tx * b.ty - a.ty * b.tx, a.tx * b.tx + a.ty * b.ty)); if (da > 1e-6) minR = Math.min(minR, ds / da); }
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
    for (let tries = 0; decos.length < 260 && tries < 2000; tries++) {
      const j = Math.floor(rnd() * M), side = rnd() < 0.5 ? -1 : 1, p = at(j, side * hw * (1.9 + rnd() * 2.6));
      let ok = true; for (const c of sub) { const dx = c.x - p.x, dy = c.y - p.y; if (dx * dx + dy * dy < (hw * 1.85) * (hw * 1.85)) { ok = false; break; } }
      if (ok) decos.push({ x: p.x, y: p.y, e: def.theme.deco[Math.floor(rnd() * def.theme.deco.length)], s: 44 + rnd() * 34 });
    }
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const p of pts) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
    return { def, M, ds, pts, hw, len: L, minR, boxes, haz, decos, bounds: { x0, x1, y0, y1 } };
  }

  window.RaceData = { CHARS, CARS, TRACKS, buildTrack };
})();
