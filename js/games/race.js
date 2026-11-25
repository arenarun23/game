// 레이싱: 캐릭터 4 · 차 4 · 경기장 8. 위에서 내려다보는 카트 레이스 (아이템 상자, 스킬, 부스트 패드)
(function () {
  'use strict';
  const D = window.RaceData, TAU = Math.PI * 2;
  if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) { r = Math.min(r || 0, w / 2, h / 2); this.moveTo(x + r, y); this.arcTo(x + w, y, x + w, y + h, r); this.arcTo(x + w, y + h, x, y + h, r); this.arcTo(x, y + h, x, y, r); this.arcTo(x, y, x + w, y, r); this.closePath(); };
  }
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const ITEMS = { boost: { e: '🍄', n: '부스트', d: '잠깐 아주 빨라져요' }, shield: { e: '🛡️', n: '방패', d: '3초 동안 공격을 막아요' }, banana: { e: '🍌', n: '바나나', d: '뒤에 떨어뜨려요. 밟은 차는 빙글!' }, missile: { e: '🎯', n: '미사일', d: '앞차를 쫓아가서 맞혀요' } };
  const BASE_V = 380, BASE_ACC = 300, BASE_TURN = 2.4, JUMP = 0.75; // 점프 공중 시간(초)

  // 이모지·차는 한 번만 그려 두고 이미지로 찍는다(회전해도 비용이 일정). 글자를 매 프레임 회전해 그리면 글자 캐시가 계속 빗나가서 끊긴다.
  const spr = new Map();
  function sprite(key, w, h, fn) { let c = spr.get(key); if (!c) { c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); spr.set(key, c); } return c; }
  // 한 경기에 달리는 선수 수(나 포함): 경기장 고르기에서 2·4·6·8명 중 고른다(모든 경기장 공통, 기본 6)
  const NRS = [2, 4, 6, 8], nrOf = () => { const v = +G.store.get('race:nr', 6); return NRS.includes(v) ? v : 6; };
  let startBag = [], lastStart = -1;
  let bagN = 0;
  function nextStart(NR) { if (bagN !== NR) { bagN = NR; startBag = []; lastStart = -1; } if (!startBag.length) { startBag = G.shuffle([...Array(NR).keys()]); if (startBag[startBag.length - 1] === lastStart) startBag.unshift(startBag.pop()); } return (lastStart = startBag.pop()); }
  // 치타·코끼리는 이모지가 온몸이라(다른 친구는 얼굴) 얼굴만 직접 그린다. 이모지 글자(🐆 🐘)를 이 그림으로 바꿔 찍는다.
  const circ = (g, x, y, r, col) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
  const ellp = (g, x, y, rx, ry, col, rot) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, TAU); g.fill(); };
  const tri = (g, pts, col) => { g.fillStyle = col; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fill(); };
  const FACES = {
    '🦖': (g) => { // 티라노: 초록 얼굴 + 머리 돌기 + 화난 눈썹 + 이빨
      circ(g, 36, 17, 6, '#3f8f40'); circ(g, 48, 13, 6.5, '#3f8f40'); circ(g, 60, 17, 6, '#3f8f40');
      circ(g, 48, 52, 38, '#5bb85a'); ellp(g, 48, 68, 27, 18, '#86d27f'); circ(g, 40, 62, 2.4, '#2f6b34'); circ(g, 56, 62, 2.4, '#2f6b34');
      circ(g, 33, 44, 6.5, '#fff'); circ(g, 63, 44, 6.5, '#fff'); circ(g, 34, 45, 3.6, '#222'); circ(g, 62, 45, 3.6, '#222');
      g.strokeStyle = '#2f5f33'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(24, 33); g.lineTo(41, 39); g.moveTo(72, 33); g.lineTo(55, 39); g.stroke();
      g.strokeStyle = '#2f5f33'; g.lineWidth = 3; g.beginPath(); g.moveTo(30, 76); g.quadraticCurveTo(48, 84, 66, 76); g.stroke();
      g.fillStyle = '#fff'; for (const x of [34, 44, 52, 62]) { g.beginPath(); g.moveTo(x - 3.2, 77); g.lineTo(x + 3.2, 77); g.lineTo(x, 85); g.closePath(); g.fill(); }
    },
    '🦏': (g) => { // 트리케라톱스: 큰 프릴 + 뿔 세 개
      ellp(g, 48, 38, 42, 34, '#c9803a'); g.fillStyle = '#f4d58a'; for (let a = 0; a < 11; a++) { const t = Math.PI * (1.08 + 0.84 * a / 10); g.beginPath(); g.arc(48 + Math.cos(t) * 35, 38 + Math.sin(t) * 28, 3.4, 0, TAU); g.fill(); }
      circ(g, 48, 58, 31, '#e0a553'); ellp(g, 48, 74, 17, 12, '#c98a3c');
      tri(g, [[24, 44], [17, 8], [37, 36]], '#fff4d6'); tri(g, [[72, 44], [79, 8], [59, 36]], '#fff4d6'); tri(g, [[42, 62], [48, 42], [54, 62]], '#fff4d6');
      circ(g, 33, 54, 5.6, '#fff'); circ(g, 63, 54, 5.6, '#fff'); circ(g, 34, 55, 3.3, '#222'); circ(g, 62, 55, 3.3, '#222');
      g.strokeStyle = '#7a4a1c'; g.lineWidth = 2.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(40, 79); g.quadraticCurveTo(48, 84, 56, 79); g.stroke(); circ(g, 42, 71, 1.8, '#7a4a1c'); circ(g, 54, 71, 1.8, '#7a4a1c');
    },
    '🐊': (g) => { // 스피노사우루스: 등 돛 + 파란 얼굴 + 긴 주둥이
      g.fillStyle = '#e8792b'; g.beginPath(); g.moveTo(16, 50); g.lineTo(22, 12); g.lineTo(34, 28); g.lineTo(42, 4); g.lineTo(54, 4); g.lineTo(62, 28); g.lineTo(74, 12); g.lineTo(80, 50); g.closePath(); g.fill();
      g.strokeStyle = '#f7b267'; g.lineWidth = 2.6; g.lineCap = 'round'; for (const [x, y] of [[26, 22], [40, 18], [48, 14], [56, 18], [70, 22]]) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 20); g.stroke(); }
      circ(g, 48, 54, 33, '#3f8fb5'); ellp(g, 48, 73, 20, 14, '#6bb7d4'); circ(g, 41, 68, 2.4, '#1d5670'); circ(g, 55, 68, 2.4, '#1d5670');
      circ(g, 33, 48, 6, '#fff'); circ(g, 63, 48, 6, '#fff'); circ(g, 34, 49, 3.4, '#222'); circ(g, 62, 49, 3.4, '#222');
      g.strokeStyle = '#1d5670'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(34, 79); g.quadraticCurveTo(48, 86, 62, 79); g.stroke();
      g.fillStyle = '#fff'; for (const x of [38, 46, 54, 60]) { g.beginPath(); g.moveTo(x - 2.2, 80); g.lineTo(x + 2.2, 80); g.lineTo(x, 85); g.closePath(); g.fill(); }
    },
    '🦕': (g) => { // 스테고사우루스: 등판 + 연두 얼굴 + 순한 눈
      for (const [x, y, rot] of [[26, 26, -0.5], [48, 18, 0], [70, 26, 0.5]]) { ellp(g, x, y, 9.5, 15, '#f0883e', rot); ellp(g, x, y, 4.5, 9, '#f8b777', rot); }
      circ(g, 48, 56, 33, '#8dbb4a'); ellp(g, 48, 72, 20, 15, '#b3d86d'); circ(g, 42, 68, 2.2, '#4f6f22'); circ(g, 54, 68, 2.2, '#4f6f22');
      circ(g, 33, 52, 6, '#fff'); circ(g, 63, 52, 6, '#fff'); circ(g, 34, 53, 3.6, '#222'); circ(g, 62, 53, 3.6, '#222'); circ(g, 35.2, 51.6, 1.2, '#fff'); circ(g, 63.2, 51.6, 1.2, '#fff');
      g.fillStyle = '#6f9a35'; for (const [x, y] of [[26, 40], [70, 40], [22, 62], [74, 62]]) { g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill(); }
      ellp(g, 26, 66, 5, 3, 'rgba(255,130,150,.45)'); ellp(g, 70, 66, 5, 3, 'rgba(255,130,150,.45)');
      g.strokeStyle = '#4f6f22'; g.lineWidth = 2.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(39, 79); g.quadraticCurveTo(48, 85, 57, 79); g.stroke();
    },
    '🐍': (g) => { // 모아뱀: 초록 머리 + 노란 배 무늬 + 세로 눈동자 + 갈라진 혀
      g.strokeStyle = '#e8483f'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(48, 78); g.lineTo(48, 88); g.moveTo(48, 88); g.lineTo(42, 94); g.moveTo(48, 88); g.lineTo(54, 94); g.stroke();
      ellp(g, 48, 50, 36, 33, '#58b947'); ellp(g, 48, 68, 24, 15, '#cfe77a');
      g.fillStyle = '#3d9336'; for (const [x, y, r0] of [[48, 22, 5.5], [36, 27, 4], [60, 27, 4], [48, 34, 3.2]]) { g.beginPath(); g.arc(x, y, r0, 0, TAU); g.fill(); }
      circ(g, 32, 46, 7.5, '#ffe45c'); circ(g, 64, 46, 7.5, '#ffe45c'); ellp(g, 32, 46, 2.2, 6, '#222'); ellp(g, 64, 46, 2.2, 6, '#222'); circ(g, 34, 43, 1.4, '#fff'); circ(g, 66, 43, 1.4, '#fff');
      circ(g, 44, 62, 1.8, '#2f6b2a'); circ(g, 52, 62, 1.8, '#2f6b2a');
      g.strokeStyle = '#2f6b2a'; g.lineWidth = 2.8; g.beginPath(); g.moveTo(32, 71); g.quadraticCurveTo(48, 80, 64, 71); g.stroke();
      ellp(g, 24, 60, 5, 3, 'rgba(255,130,150,.4)'); ellp(g, 72, 60, 5, 3, 'rgba(255,130,150,.4)');
    },
    '🦎': (g) => { // 벨로키랍토르: 깃털 볏 + 주황 얼굴 + 날카로운 노란 눈
      tri(g, [[30, 40], [22, 4], [44, 30]], '#2fa39a'); tri(g, [[44, 34], [48, 0], [56, 32]], '#f2c14e'); tri(g, [[66, 40], [74, 4], [52, 30]], '#2fa39a');
      circ(g, 48, 55, 33, '#e0663a'); ellp(g, 48, 72, 17, 15, '#f7a866');
      g.strokeStyle = '#7a2e14'; g.lineWidth = 3; g.lineCap = 'round'; for (const x of [40, 48, 56]) { g.beginPath(); g.moveTo(x, 28); g.lineTo(x, 38); g.stroke(); }
      circ(g, 33, 50, 6.2, '#ffe27a'); circ(g, 63, 50, 6.2, '#ffe27a'); ellp(g, 33.5, 50, 1.9, 5, '#222'); ellp(g, 62.5, 50, 1.9, 5, '#222');
      g.strokeStyle = '#7a2e14'; g.lineWidth = 3.4; g.beginPath(); g.moveTo(24, 41); g.lineTo(40, 46); g.moveTo(72, 41); g.lineTo(56, 46); g.stroke();
      circ(g, 43, 66, 2, '#7a2e14'); circ(g, 53, 66, 2, '#7a2e14'); g.lineWidth = 2.6; g.beginPath(); g.moveTo(34, 78); g.quadraticCurveTo(48, 84, 62, 78); g.stroke();
      g.fillStyle = '#fff'; for (const x of [40, 48, 56]) { g.beginPath(); g.moveTo(x - 2, 79); g.lineTo(x + 2, 79); g.lineTo(x, 84); g.closePath(); g.fill(); }
    },
    '🐆': (g) => { // 치타: 노란 얼굴 + 검은 점 + 눈물 줄무늬
      circ(g, 19, 25, 11, '#d99a2b'); circ(g, 77, 25, 11, '#d99a2b'); circ(g, 19, 26, 5.5, '#3a2c1c'); circ(g, 77, 26, 5.5, '#3a2c1c');
      circ(g, 48, 54, 38, '#f2c14e'); ellp(g, 48, 68, 20, 15, '#fff1c9');
      g.fillStyle = '#3a2c1c'; for (const [x, y] of [[48, 22], [36, 25], [60, 25], [24, 40], [72, 40], [20, 56], [76, 56], [28, 74], [68, 74]]) { g.beginPath(); g.arc(x, y, 3.3, 0, TAU); g.fill(); }
      g.strokeStyle = '#3a2c1c'; g.lineWidth = 3.2; g.lineCap = 'round'; g.beginPath(); g.moveTo(31, 50); g.quadraticCurveTo(28, 62, 34, 70); g.moveTo(65, 50); g.quadraticCurveTo(68, 62, 62, 70); g.stroke();
      circ(g, 34, 46, 5.2, '#fff'); circ(g, 62, 46, 5.2, '#fff'); circ(g, 35, 47, 3.2, '#222'); circ(g, 61, 47, 3.2, '#222');
      g.fillStyle = '#3a2c1c'; g.beginPath(); g.moveTo(42, 58); g.lineTo(54, 58); g.lineTo(48, 66); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(48, 66); g.lineTo(48, 70); g.moveTo(48, 70); g.quadraticCurveTo(42, 77, 37, 73); g.moveTo(48, 70); g.quadraticCurveTo(54, 77, 59, 73); g.lineWidth = 2.6; g.strokeStyle = '#3a2c1c'; g.stroke();
    },
    '🐧': (g) => { // 펭구: 검은 머리 + 하얀 얼굴 + 주황 부리 + 볼
      circ(g, 48, 50, 38, '#2d3446'); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(36, 50, 17, 22, 0.12, 0, TAU); g.ellipse(60, 50, 17, 22, -0.12, 0, TAU); g.ellipse(48, 62, 20, 17, 0, 0, TAU); g.fill();
      circ(g, 35, 44, 5.6, '#fff'); circ(g, 61, 44, 5.6, '#fff'); circ(g, 36, 45, 3.5, '#111'); circ(g, 60, 45, 3.5, '#111'); circ(g, 37.2, 43.6, 1.2, '#fff'); circ(g, 61.2, 43.6, 1.2, '#fff');
      g.fillStyle = '#ff9a1f'; g.beginPath(); g.moveTo(38, 56); g.quadraticCurveTo(48, 50, 58, 56); g.quadraticCurveTo(54, 70, 48, 72); g.quadraticCurveTo(42, 70, 38, 56); g.closePath(); g.fill();
      g.strokeStyle = '#d97a0a'; g.lineWidth = 2; g.lineCap = 'round'; g.beginPath(); g.moveTo(41, 61); g.quadraticCurveTo(48, 64, 55, 61); g.stroke();
      ellp(g, 26, 58, 5, 3.2, 'rgba(255,130,150,.5)'); ellp(g, 70, 58, 5, 3.2, 'rgba(255,130,150,.5)');
    },
    '🐘': (g) => { // 코끼리: 큰 귀 + 회색 얼굴 + 코 + 작은 엄니
      ellp(g, 12, 50, 14, 24, '#8d9bb0', 0.15); ellp(g, 84, 50, 14, 24, '#8d9bb0', -0.15); ellp(g, 13, 51, 7.5, 16, '#d7a3b1', 0.15); ellp(g, 83, 51, 7.5, 16, '#d7a3b1', -0.15);
      circ(g, 48, 46, 33, '#a6b3c7');
      g.fillStyle = '#a6b3c7'; g.beginPath(); g.moveTo(37, 56); g.quadraticCurveTo(35, 84, 44, 90); g.quadraticCurveTo(52, 94, 58, 86); g.quadraticCurveTo(61, 80, 57, 76); g.lineTo(60, 56); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(80,95,120,.45)'; g.lineWidth = 2.2; g.lineCap = 'round'; for (const y of [66, 74, 82]) { g.beginPath(); g.moveTo(41, y); g.quadraticCurveTo(48, y + 3, 57, y); g.stroke(); }
      g.fillStyle = '#fffdf2'; g.beginPath(); g.moveTo(32, 62); g.quadraticCurveTo(24, 72, 28, 80); g.quadraticCurveTo(33, 74, 38, 66); g.closePath(); g.fill(); g.beginPath(); g.moveTo(64, 62); g.quadraticCurveTo(72, 72, 68, 80); g.quadraticCurveTo(63, 74, 58, 66); g.closePath(); g.fill();
      circ(g, 36, 40, 5.4, '#fff'); circ(g, 60, 40, 5.4, '#fff'); circ(g, 37, 41, 3.3, '#222'); circ(g, 59, 41, 3.3, '#222');
      ellp(g, 28, 54, 5, 3, 'rgba(255,140,160,.45)'); ellp(g, 68, 54, 5, 3, 'rgba(255,140,160,.45)');
    },
  };
  // 입체감: 그림 위에만(source-atop) 왼쪽 위는 밝게, 오른쪽 아래는 어둡게 덧칠한다. 한 번 그려 두는 그림이라 느려지지 않는다.
  const shade = (g, w) => { g.save(); g.globalCompositeOperation = 'source-atop';
    const d = g.createRadialGradient(w * 0.36, w * 0.32, w * 0.2, w * 0.5, w * 0.5, w * 0.62); d.addColorStop(0, 'rgba(0,0,0,0)'); d.addColorStop(0.7, 'rgba(0,0,0,.1)'); d.addColorStop(1, 'rgba(0,0,0,.34)'); g.fillStyle = d; g.fillRect(0, 0, w, w);
    const l = g.createRadialGradient(w * 0.33, w * 0.27, 0, w * 0.33, w * 0.27, w * 0.3); l.addColorStop(0, 'rgba(255,255,255,.4)'); l.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = l; g.fillRect(0, 0, w, w); g.restore(); };
  const emo = (e) => sprite(e, 96, 96, (g, w) => { if (FACES[e]) FACES[e](g); else { g.font = Math.round(w * 0.79) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(e, w / 2, w * 0.53); } shade(g, w); });
  const faceImg = (e, cls) => { if (!FACES[e]) return null; const im = new Image(); im.src = emo(e).toDataURL('image/png'); im.alt = ''; im.className = 'faceimg' + (cls ? ' ' + cls : ''); im.draggable = false; return im; };
  const stamp = (c, e, fontPx) => { const sz = 96 * fontPx / 76; c.drawImage(emo(e), -sz / 2, -sz / 2, sz, sz); };
  G.raceUtil = { sprite, emo, stamp, shade, faces: FACES, faceImg };

  let pendingTrack = null; // 질문에서 '네'를 눌러 모드를 바꿨을 때, 고르기를 건너뛰고 바로 시작할 경기장
  const saved = G.store.get('race:sel', {});
  const sel = { ch: clamp(saved.ch | 0, 0, D.CHARS.length - 1), car: clamp(saved.car | 0, 0, D.CARS.length - 1), tr: Math.max(0, saved.tr | 0) }; // 경기장 번호(모드마다 개수가 다르므로 시작할 때 범위를 다시 맞춘다)

  // 사용법 화면 (고르기 화면과 경기 중 모두에서 연다)
  function helpOverlay(root, ch, car, onClose) {
    const row = (ic, t, d) => G.h('div', { class: 'hrow' }, G.h('span', { class: 'hic' }, ic), G.h('span', { class: 'htx' }, G.h('b', {}, ...[].concat(t)), ' ', d));
    const close = () => { box.remove(); if (onClose) onClose(); };
    const box = G.h('div', { class: 'rhelp' }, G.h('div', { class: 'hbox' },
      G.h('h3', {}, '🏁 레이싱 사용법'),
      G.h('h4', {}, '🎮 달리는 방법'), row('🚗', '자동으로 달려요', '방향만 정하면 돼요!'),
      row('🎚️', '밀어서', '왼쪽 아래 둥근 막대를 좌우로 밀어요. 많이 밀수록 크게 꺾여요'),
      row('📱', '기울여서', '폰을 핸들처럼 기울여요. 출발 직전에 든 자세가 기준이에요'),
      row('◀▶', '버튼 · 키보드', '◀ ▶ 버튼, 또는 키보드 ← → (A D)'),
      row('🧭', '도우미', '길을 알아서 따라가 줘요. 위쪽 🧭 버튼으로 켜고 꺼요'),
      G.h('h4', {}, '🎁 아이템 사용법'), row('❓', '노란 상자에 닿으면', '아이템을 하나 받아요'),
      row('🃏', '오른쪽 카드 칸 4개', '카드를 최대 4장 모아요. 쓰고 싶은 칸을 눌러요 (키보드 1~4, Space는 첫 카드)'),
      row(ITEMS.boost.e, ITEMS.boost.n, ITEMS.boost.d), row(ITEMS.shield.e, ITEMS.shield.n, ITEMS.shield.d), row(ITEMS.banana.e, ITEMS.banana.n, ITEMS.banana.d), row(ITEMS.missile.e, ITEMS.missile.n, ITEMS.missile.d),
      G.h('h4', {}, '⚡ 내 스킬 (쿨타임이 끝나면 또 써요)'),
      row(ch.skill.e, [faceImg(ch.e, 'inl') || ch.e, ' ' + ch.skill.n], `${ch.skill.d} — 왼쪽 버튼 (Z)`), row(car.skill.e, `${car.e} ${car.skill.n}`, `${car.skill.d} — 가운데 버튼 (X)`),
      G.h('h4', {}, '🛣️ 길 위의 표지'), row('⏩', '파란 화살표', '밟으면 쌩 빨라져요'), row('🟤', '진흙 · 물 · 용암', '느려져요'), row('🧊', '얼음판', '미끄러워요'),
      G.h('button', { class: 'btn', onclick: close }, '알겠어요!')));
    root.append(box); return box;
  }

  G.register({
    id: 'race', kid: true, name: '레이싱', desc: '캐릭터·차·경기장 고르기', icon: '🏁', cat: 'race', color: 'peach', variants: 1,
    start(root, { hard, kid }) {
      document.documentElement.dataset.game = 'race'; // 레이싱 동안 글자를 크게
      let stopFn = null, pickRedo = null, rzT = 0;
      // 폰을 가로·세로로 돌리거나 창 크기가 바뀌면, 고르기 화면을 새 크기에 맞게 다시 만든다(처음 그릴 때의 배치가 남지 않게)
      const onResize = () => { clearTimeout(rzT); rzT = setTimeout(() => { if (pickRedo && document.body.contains(root)) pickRedo(); }, 160); };
      addEventListener('resize', onResize); addEventListener('orientationchange', onResize);
      // 그래픽: 새 그래픽(three.js, race_gl.js) / 예전 그래픽(캔버스 그림, race.js 2D·race3d.js). 예전 것은 그대로 보관해 언제든 고를 수 있다
      const glOK = () => !!(window.RaceGL && window.RaceGL.ok()), gfxNew = () => G.store.get('race:gfx', 'new') !== 'old';
      const gfxBtn = () => { // 좁은 화면에서는 그림(✨/🖼️)만 보인다
        const ic = G.h('span', { class: 'gi' }), tx = G.h('span', { class: 'gt' }), b = G.h('button', { class: 'btn alt gfx' }, ic, tx);
        const show = () => { const nw = gfxNew(); ic.textContent = nw ? '✨' : '🖼️'; tx.textContent = nw ? ' 새 그래픽' : ' 예전 그래픽'; b.setAttribute('aria-label', nw ? '지금 새 그래픽. 누르면 예전 그래픽' : '지금 예전 그래픽. 누르면 새 그래픽'); b.title = b.getAttribute('aria-label'); };
        b.onclick = () => { G.sfx.tap(); G.store.set('race:gfx', gfxNew() ? 'old' : 'new'); show(); }; show(); return b;
      };
      // 폰·태블릿 세로 화면: 카드를 처음 누를 때 전체 화면으로(주소창·아래 막대가 사라져 넓어진다). 브라우저가 허락할 때만 되고, 아이폰 사파리는 안 된다
      let fullTried = false;
      const portraitFull = () => { if (fullTried || innerWidth >= innerHeight || !document.fullscreenEnabled || document.fullscreenElement) return; fullTried = true; try { const p = document.documentElement.requestFullscreen({ navigationUI: 'hide' }); if (p && p.catch) p.catch(() => {}); } catch (e) {} };
      const goFirst = () => G.start(G.games.find((x) => x.id === 'race')); // 그만두면 놀이터가 아니라 레이싱 첫 화면으로
      // 🔄 새로 하기: 고르기 화면(캐릭터·차·경기장)에서는 고른 것을 처음 상태로 되돌리고 1단계부터 다시 고른다(완주 기록은 그대로).
      // 예전엔 1단계에서 같은 화면을 다시 그리기만 해서 반응이 없어 보였다. 경기 중에는 기본 동작(레이싱 첫 화면으로).
      G.onRefresh(() => {
        if (!pickRedo) return false;
        sel.ch = 0; sel.car = 0; sel.tr = 0; G.store.set('race:sel', sel);
        goFirst(); G.toast('🔄 처음부터 다시 골라요');
        return true;
      });
      const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

      // ───────── 고르기 화면 3단계 ─────────
      function pick(step, title, items, cur, onPick, onBack, extra) {
        if (stopFn) { stopFn(); stopFn = null; }
        clearTabs();
        const land = innerWidth > innerHeight * 1.05, n = items.length;
        const dense = !land && step <= 2 && n > 9, c = dense ? 2 : land ? (n <= 4 ? n : n <= 10 ? Math.ceil(n / 2) : Math.ceil(n / 3)) : (n > 8 ? 3 : 2), r = Math.ceil(n / c);
        const rowMode = !land && step <= 2, many = !land && (step === 3 ? n > ((extra && extra.querySelectorAll && extra.querySelectorAll('.spopt').length >= 2) ? 8 : 12) : n > 5); // 세로 우주 탭(옵션 줄이 둘): 8개 넘으면 2열로 넘겨 본다 // 폰 세로에서 경기장이 8개를 넘으면 2열로 두고 아래로 넘겨 본다 // 폰 세로: 캐릭터·차는 카드를 한 줄씩(왼쪽 그림, 오른쪽 글자)으로 넓게
        const grid = G.h('div', { class: 'pickgrid' + (rowMode ? ' row' : '') + (dense ? ' dense' : '') + (land && n > 10 ? ' lt' : '') + (many ? ' many' : ''), style: rowMode ? (dense ? `--c:2;--r:${r}` : `--c:1;--r:${n}`) : `--c:${c};--r:${r}` }, items.map((it, i) =>
          G.h('button', { class: 'card pk c-' + it.color + (typeof it.ic === 'string' ? '' : ' trk'), 'aria-pressed': String(i === cur), onclick: (e) => { G.sfx.tap(); portraitFull(); const me = e.currentTarget; me.parentNode.querySelectorAll('.pk').forEach((x) => x.setAttribute('aria-pressed', String(x === me))); G.pressThen(me, () => onPick(i)); } },
            G.h('span', { class: 'ic' + (typeof it.ic === 'string' && FACES[it.ic] ? ' face' : '') }, typeof it.ic === 'string' && FACES[it.ic] ? faceImg(it.ic) : it.ic), G.h('span', Object.assign({ class: 'nm' }, typeof it.ic === 'string' && !FACES[it.ic] ? { 'data-e': it.ic } : {}), it.nm), G.h('span', { class: 'ds' }, ...it.ds))));
        const kids = [G.h('div', { class: 'hint must' }, `🏁 ${step}/3 · ${title}`), extra || null, G.h('div', { class: 'fitbox' }, grid)];
        kids.push(G.h('div', { class: 'palette' }, onBack ? G.h('button', { class: 'btn alt', onclick: onBack }, '◀ 이전') : null,
          G.h('button', { class: 'btn alt', onclick: () => helpOverlay(root, D.CHARS[sel.ch], D.CARS[sel.car]) }, '❓ 사용법'),
          G.h('button', { class: 'btn alt', onclick: () => { G.sfx.tap(); showRewards(step === 1 ? showChars : step === 2 ? showCars : showTracks); } }, '🏅 내 보상'),
          step === 3 && glOK() ? gfxBtn() : null));
        pickRedo = step === 1 ? showChars : step === 2 ? showCars : showTracks; // 화면을 돌리면 이 화면을 다시 그린다
        root.replaceChildren(...kids.filter(Boolean));
      }
      function showRewards(back) {
        pickRedo = null;
        clearTabs();
        if (stopFn) { stopFn(); stopFn = null; }
        G.navPush(back);
        window.RaceReward.page(root, { carColor: D.CARS[sel.car].color, chEmoji: D.CHARS[sel.ch].e, onBack: () => G.navBack(back) });
      }
      const clearTabs = () => { const o = document.querySelector('.subbar .tabs'); if (o) o.remove(); }; // 가로 화면에선 2D/3D 탭을 위 모드 줄로 옮겨 둔다
      const br = (t, cls) => G.h('span', { class: 'ln' + (cls ? ' ' + cls : '') }, t);
      function showChars() {
        pick(1, '캐릭터를 골라요', D.CHARS.map((c) => ({ ic: c.e, nm: c.n, color: c.color, ds: [br('⭐ ' + c.trait), br(`${c.skill.e} 스킬: ${c.skill.n}`), br(c.skill.d, 'sd')] })), sel.ch,
          (i) => { sel.ch = i; G.navPush(showChars); showCars(); }, null);
      }
      function showCars() {
        pick(2, '차를 골라요', D.CARS.map((c) => ({ ic: c.e, nm: c.n, color: c.ui, ds: [br('⭐ ' + c.trait), br(`${c.skill.e} 스킬: ${c.skill.n}`), br(`속도 ★${c.bars[0]}  가속 ★${c.bars[1]}`, 'st'), br(`핸들 ★${c.bars[2]}  튼튼 ★${c.bars[3]}`, 'st'), br(c.skill.d, 'sd')] })), sel.car,
          (i) => { sel.car = i; G.navPush(showCars); showTracks(); }, () => G.navBack(showChars));
      }
      function thumb(def, seed) {
        const T = D.buildTrack(def, seed), b = T.bounds, w = b.x1 - b.x0, h = b.y1 - b.y0, pad = 160;
        const d = T.pts.filter((_, i) => i % 6 === 0).map((p, i) => (i ? 'L' : 'M') + Math.round(p.x - b.x0 + pad) + ' ' + Math.round(p.y - b.y0 + pad)).join('') + 'Z';
        const s = G.h('span', { class: 'th' }); s.innerHTML = `<svg viewBox="0 0 ${w + pad * 2} ${h + pad * 2}"><rect width="100%" height="100%" rx="90" fill="${def.theme.bg}"/><path d="${d}" fill="none" stroke="rgba(0,0,0,.28)" stroke-width="170" stroke-linejoin="round" transform="translate(26 34)"/><path d="${d}" fill="none" stroke="${def.theme.curb[1]}" stroke-width="186" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${def.theme.road}" stroke-width="150" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="70" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${def.theme.line}" stroke-width="12" stroke-dasharray="40 40"/></svg>`;
        return s;
      }
      const TRACKS = hard ? D.TRACKS_HARD : D.TRACKS_EASY, seedOf = (i) => (hard ? 100 : 0) + i + 1;
      const grpOf = (t) => (t.space ? 2 : t.v3d ? 1 : 0), isGroup = (i, g) => grpOf(TRACKS[i]) === g, groupIdx = (g) => TRACKS.map((_, i) => i).filter((i) => isGroup(i, g));
      let tab = TRACKS[sel.tr] ? grpOf(TRACKS[sel.tr]) : 0; // 0 = 2D, 1 = 3D, 2 = 우주
      const SPK = 'race:sp', spOpt = () => Object.assign({ storm: false, tire: false, tireStart: 'all' }, G.store.get(SPK, {})), spSet = (o) => G.store.set(SPK, Object.assign(spOpt(), o));
      // 🚀 우주 코스 옵션(우주 탭에서만): 후반 날씨, 바퀴 고르기
      function spaceOptions(redraw) {
        const o = spOpt(), h = G.h, tog = (label, on, fn) => h('button', { class: 'tab sp', 'aria-pressed': String(on), onclick: () => { G.sfx.tap(); fn(); redraw(); } }, label + (on ? ' 켜짐' : ' 꺼짐'));
        const tires = [['rock', '암반'], ['all', '겸용'], ['dust', '먼지']];
        return h('div', { class: 'spopt' }, tog('🌪️ 후반 날씨', o.storm, () => spSet({ storm: !o.storm })), tog('🛞 바퀴 고르기', o.tire, () => spSet({ tire: !o.tire })),
          ...(o.tire ? tires.map(([id, nm]) => h('button', { class: 'tab sp', 'aria-pressed': String(o.tireStart === id), onclick: () => { G.sfx.tap(); spSet({ tireStart: id }); redraw(); } }, nm)) : []));
      }
      function showTracks() {
        const doneSet = new Set(G.store.get('race:done:' + (hard ? 'hard' : 'easy'), [])), idxs = groupIdx(tab);
        const cnt = (g) => groupIdx(g).filter((i) => doneSet.has(i)).length;
        const tabs = G.h('div', { class: 'tabs' }, [[0, '🗺️ 2D'], [1, '🧊 3D'], [2, '🚀 우주']].map(([g, label]) =>
          G.h('button', { class: 'tab', 'aria-pressed': String(g === tab), onclick: () => { G.sfx.tap(); tab = g; showTracks(); } }, innerWidth > innerHeight * 1.05 ? label : [label + ' ', G.h('span', { class: 'cnt' }, `(${cnt(g)}/${groupIdx(g).length})`)])));
        const nr = nrOf(), nrRow = G.h('div', { class: 'spopt nropt', role: 'group', 'aria-label': '함께 달리는 선수 수' }, G.h('span', { class: 'nrl' }, '👥 선수'),
          ...NRS.map((v) => G.h('button', { class: 'tab sp', 'aria-pressed': String(v === nr), onclick: () => { G.sfx.tap(); G.store.set('race:nr', v); showTracks(); } }, v + '명')));
        const spOne = tab === 2 ? spaceOptions(showTracks) : null, land3 = innerWidth > innerHeight * 1.05;
        const spExtra = land3 ? spOne : spOne ? G.h('div', { class: 'optrow' }, nrRow, spOne) : nrRow; // 가로 화면은 선수 수를 제목 줄에 붙여 경기장 칸을 넓게
        pick(3, (hard ? '🔥 어려운 ' : kid ? '🐣 아주 쉬운 ' : '') + `경기장을 골라요 · ${hard ? 3 : kid ? 1 : 2}바퀴`, idxs.map((i) => { const t = TRACKS[i]; return { ic: thumb(t, seedOf(i)), nm: (doneSet.has(i) ? '✅ ' : '') + t.e + ' ' + t.n, color: ['lemon', 'orange', 'sky', 'mint', 'pink', 'lilac', 'peach', 'sky', 'lemon', 'mint'][idxs.indexOf(i) % 10], ds: [br('▶ ' + t.shape), br(t.gim)] }; }), idxs.indexOf(sel.tr),
          (k) => { sel.tr = idxs[k]; G.store.set('race:sel', sel); G.navPush(showTracks); startRace(); }, () => G.navBack(showCars), land3 ? spExtra : (spExtra ? G.h('div', { class: 'trkopts' }, tabs, spExtra) : tabs));
        if (innerWidth > innerHeight * 1.05) { const sb = document.querySelector('.subbar'); if (sb) sb.append(tabs); const hn = root.querySelector('.hint.must'); if (hn) { hn.classList.add('withnr'); hn.append(nrRow); } }
      }

      // ───────── 경기 ─────────
      function startRace() {
        clearTabs(); pickRedo = null;
        document.documentElement.dataset.racing = '1'; // 달리는 동안 위쪽 모드 버튼 줄을 숨겨 화면을 넓힌다
        const TD = TRACKS[sel.tr], T = D.buildTrack(TD, seedOf(sel.tr)), th = TD.theme, hw = T.hw, M = T.M, P = T.pts;
        const laps = hard ? 3 : kid ? 1 : 2, WALL = hw * (kid ? 1.55 : hard ? 1.45 : 1.3); // 쉬운 모드일수록 길 밖으로 덜 나가게 벽을 길 가까이에 세운다
        // 🚀 우주 코스: 중력(점프), 먼지·서리 구간, 옵션(후반 날씨·바퀴·피트)
        const SP = TD.space, spo = SP ? spOpt() : null, GK = SP ? Math.min(2.4, Math.pow(9.8 / SP.g, 0.3)) : 1, stormOn = !!(SP && spo.storm), tireOn = !!(SP && spo.tire);
        const TIRES = SP ? { rock: { n: '암반용', road: 1, dust: 0.72, grip: 3 }, all: { n: '겸용', road: 0.97, dust: 0.9, grip: 5.5 }, dust: { n: SP.soft, road: 0.93, dust: 1, grip: 7 } } : null;
        let stormN = 0, stormFired = false, pitNext = null; // stormN: 0~1 도로가 덮인 정도
        const keys = { left: false, right: false }, rnd = Math.random;

        // 화면(HUD)
        const cv = G.h('canvas', { class: 'rcv' }), mini = G.h('canvas', { class: 'rmini', width: 120, height: 120 });
        const badge = G.h('div', { class: 'rbadge' }), toastEl = G.h('div', { class: 'rtoast' }), countEl = G.h('div', { class: 'rcount' });
        const bL = G.h('button', { class: 'rbtn dir', 'aria-label': '왼쪽' }, '◀'), bR = G.h('button', { class: 'rbtn dir', 'aria-label': '오른쪽' }, '▶');
        const mkBtn = (label, fn) => { const cd = G.h('span', { class: 'cd' }), b = G.h('button', { class: 'rbtn act' }, G.h('span', { class: 'em' }, ''), G.h('small', {}, label), cd); b.addEventListener('pointerdown', (e) => { e.preventDefault(); fn(); }); b._cd = cd; b._em = b.firstChild; return b; };
        const cardEls = [0, 1, 2, 3].map((i) => { const b = G.h('button', { class: 'rcard', 'aria-label': `카드 ${i + 1}번 칸` }, G.h('span', { class: 'cem' }, '·'), G.h('small', {}, String(i + 1))); b.addEventListener('pointerdown', (e) => { e.preventDefault(); useItem(me, i); }); return b; }), bS1 = mkBtn('', () => useSkill(me, 0)), bS2 = mkBtn('', () => useSkill(me, 1));
        const hold = (el, k) => { const on = (e) => { e.preventDefault(); keys[k] = true; el.classList.add('on'); }, off = () => { keys[k] = false; el.classList.remove('on'); }; el.addEventListener('pointerdown', on); ['pointerup', 'pointerleave', 'pointercancel'].forEach((t) => el.addEventListener(t, off)); };
        hold(bL, 'left'); hold(bR, 'right');
        const knob = G.h('span', { class: 'knob' }), pad = G.h('div', { class: 'rpad', 'aria-label': '핸들 막대' }, G.h('span', { class: 'arr l' }, '◀'), G.h('span', { class: 'tick' }), G.h('span', { class: 'arr r' }, '▶'), knob);
        const chipA = G.h('button', { class: 'rchip' }), chipC = G.h('button', { class: 'rchip' }), chipH = G.h('button', { class: 'rchip' }, '❓ 사용법'), chipM = G.h('button', { class: 'rchip', 'aria-label': '음악 켜고 끄기' });
        const chipG = G.h('div', { class: 'rchip static' }, SP ? `${SP.ico} 중력 ${SP.g}` : ''), chipT = G.h('button', { class: 'rchip' }), chipW = G.h('div', { class: 'rchip static warn', hidden: true });
        const bubL = G.h('div', { class: 'bub' }), bubR = G.h('div', { class: 'bub r' }, '⚡ 스킬 · 🃏 카드 4칸은 여기!');
        const wrap = G.h('div', { class: 'rwrap counting' }, cv, G.h('div', { class: 'rtop' }, G.h('div', { class: 'rleft' }, badge, G.h('div', { class: 'rchips' }, chipA, chipC, chipH, chipM, ...(SP ? [chipG] : []), ...(tireOn ? [chipT] : []), ...(stormOn ? [chipW] : []))), mini), toastEl, countEl,
          G.h('div', { class: 'rcoach' }, bubL, bubR), G.h('div', { class: 'rctl l' }, bL, bR, pad), G.h('div', { class: 'rctl r' }, G.h('div', { class: 'rcards', 'aria-label': '아이템 카드 4칸' }, ...cardEls), bS1, bS2));
        root.replaceChildren(wrap);
        const ctx = cv.getContext('2d'), mctx = mini.getContext('2d');
        let W = 0, H = 0, dpr = 1, q = 1;
        const fit = () => { const r = wrap.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1) * q * (T.v3d ? 0.9 : 1); W = Math.max(50, Math.round(r.width * dpr)); H = Math.max(50, Math.round(r.height * dpr)); cv.width = W; cv.height = H; };
        fit(); const ro = new ResizeObserver(fit); ro.observe(wrap);

        // 선수
        const NR = nrOf();
        const orderN = (() => { const others = G.shuffle(D.CHARS.map((_, i) => i).filter((i) => i !== sel.ch)).slice(0, NR - 1), cars = G.shuffle(D.CARS.map((_, i) => i)); return [sel.ch, ...others].map((c, i) => [c, i === 0 ? sel.car : cars[i]]); })();
        const mySlot = nextStart(NR), slots = [mySlot, ...G.shuffle([...Array(NR).keys()].filter((x) => x !== mySlot))]; // 내 출발 칸(1~선수 수번): 가방에서 뽑아 한 바퀴에 한 번씩 골고루, 같은 칸이 연달아 나오지 않게
        const racers = orderN.map(([ci, cr], i) => mk(ci, cr, i === 0, slots[i]));
        const me = racers[0];
        function mk(ci, cr, isPlayer, slot) {
          const ch = D.CHARS[ci], car = D.CARS[cr], idx = (M - 3 - Math.floor(slot / 2) * 6 - (slot % 2) * 2 + M) % M, c = P[idx], lat = (slot % 2 ? 0.45 : -0.45) * hw;
          const cs = isPlayer ? window.RaceReward.cos() : null;
          return { ch, car, col: (cs && cs.color.c) || car.color, hat: cs && cs.hat.e, trail: cs && cs.trail.e, tr: [], trT: 0, dust: [], dT: 0, isPlayer, tire: isPlayer && tireOn ? spo.tireStart : 'all', pitPhase: null, pitT: 0, airMax: 0, plow: !!ch.mod.plow, plowCd: 0, hop: 0, maxV: BASE_V * car.st.speed * ch.mod.max, acc: BASE_ACC * car.st.acc * ch.mod.acc, turn: BASE_TURN * car.st.turn * ch.mod.turn, mass: car.st.mass * ch.mod.mass,
            offF: 0.45 + (car.st.off || 0) + (ch.mod.off || 0), iceImm: !!ch.mod.ice, x: c.x + c.nx * lat, y: c.y + c.ny * lat, h: Math.atan2(c.ty, c.tx), px: c.x + c.nx * lat, py: c.y + c.ny * lat, ph: Math.atan2(c.ty, c.tx), dx: 0, dy: 0, dh: 0, vx: 0, vy: 0, v: 0, idx, lap: 0, prog: idx, prevIdx: idx,
            steerIn: 0, throttle: 1, air: 0, zair: 0, boost: 0, boostMul: 1.4, shield: 0, stun: 0, frozen: 0, spin: 0, slots: [null, null, null, null], get item() { return this.slots.find(Boolean) || null; }, cd: [3, 4], lane: (rnd() - 0.5) * 0.7, aiVar: 0.97 + rnd() * 0.06, aiT: rnd(), fin: null, off: false, stuck: 0 };
        }

        // 상태
        const objs = [], fx = [], boxT = new Array(T.boxes.length).fill(0), AI = { mul: hard ? 1.0 : kid ? 0.64 : 0.86 };
        let state = 'count', cnt = 3.4, lastN = 9, goClear = 0, t = 0, finishing = 0, camH = me.h, last = 0, raf = 0, toastT = 0, over = false, hudT = 0;
        const dbg = G.raceDebug = { ms: [], rec: false, q: 1, walls: [0, 0], respawns: 0, racers, T, objs, auto: false, speed: 1, get state() { return state; }, laps };
        dbg.go = () => { state = 'go'; cnt = -1; countEl.textContent = ''; };
        const toast = (m, d = 1.3) => { toastEl._v = m; toastEl.textContent = m; toastT = d; };
        // ───────── 조작 방식: 밀어서 / 기울여서 / 버튼, 그리고 운전 도우미 ─────────
        const coarse = matchMedia('(pointer: coarse)').matches, MODES = ['slide', 'tilt', 'buttons'], LABEL = { slide: '🎚️ 밀어서', tilt: '📱 기울여서', buttons: '◀▶ 버튼' };
        const needPerm = typeof window.DeviceOrientationEvent !== 'undefined' && typeof window.DeviceOrientationEvent.requestPermission === 'function';
        let ctlMode = G.store.get('race:ctl', coarse ? 'slide' : 'buttons'), assistOn = kid ? true : G.store.get('race:assist', coarse);
        const SL = hard ? { k: 1, p: 1, rate: 60 } : kid ? { k: 0.5, p: 1.7, rate: 5 } : { k: 0.72, p: 1.4, rate: 8 }; // 밀어서 조종: 쉬울수록 핸들이 덜 꺾이고(k) 가운데 근처가 더 둔하고(p) 천천히 따라온다(rate)
        let padS = 0, padV = 0, padOn = false, tiltV = 0, tiltZero = null, tiltGot = false, tiltTimer = 0, inputV = 0, paused = false;
        const refreshChips = () => {
          wrap.dataset.ctl = ctlMode; chipA.textContent = '🧭 도우미 ' + (assistOn ? '켜짐' : '꺼짐'); chipA.setAttribute('aria-pressed', String(assistOn)); chipC.textContent = LABEL[ctlMode] + (tiltLive && ctlMode !== 'tilt' ? ' +📱' : ''); // +📱 = 기울기 신호가 들어오는 중(기울여도 꺾인다)
          bubL.textContent = ctlMode === 'slide' ? (tiltLive ? '👆 막대를 밀거나 📱 기울여요' : '👆 이 막대를 좌우로 밀어요') : ctlMode === 'tilt' ? '📱 기울여요 (지금 자세가 기준)' : (tiltLive ? '◀ ▶ 를 누르거나 📱 기울여요' : '◀ ▶ 로 방향을 정해요');
        };
        // 폰의 기울기 → 핸들 각도. 화면 방향(세로/가로)과 상관없이 "오른쪽으로 기울이면 오른쪽"이 되도록 중력 방향으로 계산한다.
        // 기기의 '위쪽' 방향(ux,uy,uz) → 화면 기준 좌우 기울기 각도.
        // 어느 쪽이 화면의 위인지는 기준을 잡을 때 중력으로 직접 알아낸다(세워 들었을 때). 화면 방향 값(screen.orientation)이 기기 축과 안 맞는 태블릿에서도 되도록.
        // 거의 눕혀 들어서 알 수 없으면 화면 방향 값으로 정한다.
        let tiltAxis = null;
        const angOf = (ux, uy, uz) => {
          if (tiltAxis === null || tiltZero === null) {
            if (Math.hypot(ux, uy) > 0.26) tiltAxis = Math.abs(uy) >= Math.abs(ux) ? (uy > 0 ? 0 : 180) : (ux > 0 ? 90 : 270);
            else { const a0 = screen.orientation && screen.orientation.angle != null ? screen.orientation.angle : (window.orientation || 0); tiltAxis = ((Math.round(a0 / 90) * 90 % 360) + 360) % 360; }
          }
          const a = tiltAxis; let tr, up; if (a === 90) { tr = uy; up = ux; } else if (a === 180) { tr = ux; up = -uy; } else if (a === 270) { tr = -uy; up = -ux; } else { tr = -ux; up = uy; }
          return Math.atan2(tr, Math.hypot(up, uz)) * 180 / Math.PI;
        };
        const oriAng = (e) => { const b = e.beta * Math.PI / 180, g = e.gamma * Math.PI / 180; return angOf(-Math.sin(g) * Math.cos(b), Math.sin(b), Math.cos(g) * Math.cos(b)); };
        // 기울기는 조종 방식과 상관없이 늘 듣는다(밀어서·버튼 방식에서도 기울이면 꺾인다). 신호는 두 가지 중 오는 쪽을 쓴다: 방향 센서(deviceorientation), 없으면 가속도 센서(devicemotion)
        let tiltAt = 0, oriAt = 0, tiltLive = false;
        const feedTilt = (ang) => {
          tiltGot = true; tiltAt = performance.now();
          if (tiltZero === null) tiltZero = ang;
          tiltZero += (ang - tiltZero) * 0.0015; // 잡는 자세가 바뀌어도 한쪽으로 쏠리지 않게 기준을 아주 천천히 따라간다
          // 기울기 → 핸들: 난이도마다 [안 듣는 각도, 끝까지 가는 각도, 최대 핸들, 굽은 정도, 따라가는 빠르기]. 쉬울수록 많이 기울여야 하고 조금만 천천히 꺾인다.
          const TL = kid ? [3, 28, 0.5, 1.4, 0.14] : hard ? [2, 17, 1, 1.25, 0.3] : [2.5, 24, 0.72, 1.45, 0.2];
          const d = ang - tiltZero, x = clamp((Math.abs(d) - TL[0]) / (TL[1] - TL[0]), 0, 1), v = Math.sign(d) * Math.pow(x, TL[3]) * TL[2]; tiltV += (v - tiltV) * TL[4];
          if (!tiltLive) { tiltLive = true; refreshChips(); }
        };
        const onOri = (e) => { if (e.beta == null || e.gamma == null) return; oriAt = performance.now(); feedTilt(oriAng(e)); };
        const IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const onMot = (e) => {
          const a = e.accelerationIncludingGravity; if (!a || a.x == null || a.y == null || a.z == null || performance.now() - oriAt < 500) return;
          const n = Math.hypot(a.x, a.y, a.z); if (n < 3) return; const k = (IOS ? -1 : 1) / n; // 안드로이드: 위쪽 방향, 아이폰: 아래쪽 방향
          feedTilt(angOf(a.x * k, a.y * k, a.z * k));
        };
        const recal = () => { tiltZero = null; };
        addEventListener('deviceorientation', onOri); addEventListener('devicemotion', onMot); addEventListener('orientationchange', recal);
        // 허락이 필요한 브라우저(아이폰 등): 이미 허락했으면 바로, 아니면 경기 화면을 처음 누를 때 물어본다
        const askSensor = () => { for (const E of [window.DeviceOrientationEvent, window.DeviceMotionEvent]) { try { if (E && typeof E.requestPermission === 'function') E.requestPermission().catch(() => {}); } catch (e) {} } };
        askSensor(); const askOnce = () => { removeEventListener('pointerdown', askOnce, true); if (!tiltGot) askSensor(); }; addEventListener('pointerdown', askOnce, true);
        function startTilt() {
          tiltZero = null; clearTimeout(tiltTimer);
          tiltTimer = setTimeout(() => { if (performance.now() - tiltAt > 1500 && ctlMode === 'tilt') { toast('📱 기울기 신호가 안 와요. 밀어서 조종으로 바꿔요', 3.5); setCtl('slide'); } }, 2500);
        }
        function stopTilt() { clearTimeout(tiltTimer); }
        function stopSensors() { removeEventListener('deviceorientation', onOri); removeEventListener('devicemotion', onMot); removeEventListener('orientationchange', recal); removeEventListener('pointerdown', askOnce, true); clearTimeout(tiltTimer); }
        function setCtl(m) { stopTilt(); ctlMode = m; G.store.set('race:ctl', m); padV = 0; padOn = false; if (m === 'tilt') startTilt(); refreshChips(); }
        chipC.addEventListener('click', () => {
          G.sfx.tap(); const next = MODES[(MODES.indexOf(ctlMode) + 1) % MODES.length];
          if (next === 'tilt' && needPerm) { window.DeviceOrientationEvent.requestPermission().then((r) => { if (r === 'granted') setCtl('tilt'); else { toast('기울기를 쓸 수 없어요 (허락 필요)', 2.5); setCtl('buttons'); } }).catch(() => setCtl('buttons')); return; }
          setCtl(next); toast(LABEL[next] + ' 조종', 1.3);
        });
        chipA.addEventListener('click', () => { G.sfx.tap(); assistOn = !assistOn; G.store.set('race:assist', assistOn); refreshChips(); toast(assistOn ? '🧭 도우미 켜짐 — 길을 알아서 따라가요' : '🧭 도우미 꺼짐', 1.8); });
        const openHelp = () => { if (paused) return; paused = true; padV = 0; keys.left = keys.right = false; G.music.hold('help'); helpOverlay(root, me.ch, me.car, () => { paused = false; G.music.release('help'); }); };
        chipH.addEventListener('click', () => { G.sfx.tap(); openHelp(); });
        // ⏸ 정지: 상단 막대(소리 버튼 옆)에 둔다. 누르면 경기가 멈추고 계속하기 / 다시 하기 / 그만두기를 고른다
        const bPause = G.h('button', { class: 'round rpause', 'aria-label': '정지' }, '⏸'), topRight = document.querySelector('#bar .right');
        let pauseBox = null;
        const closePause = () => { if (!pauseBox) return; pauseBox.remove(); pauseBox = null; paused = false; G.music.release('pause'); };
        function openPause() {
          if (paused || over) return; paused = true; padV = 0; keys.left = keys.right = false; G.music.hold('pause'); G.sfx.tap();
          pauseBox = G.h('div', { class: 'over' }, G.h('h2', {}, '⏸ 잠깐 멈췄어요'), G.h('div', { class: 'hint must' }, '어떻게 할까요?'),
            G.h('div', { class: 'row col' },
              G.h('button', { class: 'btn', onclick: () => { G.sfx.tap(); closePause(); } }, '▶ 계속하기'),
              G.h('button', { class: 'btn alt', onclick: () => { G.sfx.tap(); closePause(); if (stopFn) stopFn(); startRace(); } }, '🔁 처음부터 다시'),
              G.h('button', { class: 'btn alt', onclick: () => { G.sfx.tap(); goFirst(); } }, '⏹ 그만두기')));
          root.append(pauseBox);
        }
        bPause.addEventListener('click', () => (pauseBox ? closePause() : openPause()));
        if (topRight) topRight.insertBefore(bPause, topRight.firstChild);
        const bFull = G.h('button', { class: 'round rfull', 'aria-label': '전체 화면' }, '⛶'); // 전체 화면(지원하는 브라우저만): 주소창이 사라져 더 크게 보인다
        if (document.fullscreenEnabled && topRight) { bFull.addEventListener('click', () => { G.sfx.tap(); try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch (e) {} }); topRight.insertBefore(bFull, topRight.firstChild); }
        const onVis = () => { if (document.hidden && state === 'go') openPause(); }; // 다른 앱·탭으로 가면 자동으로 멈춤
        document.addEventListener('visibilitychange', onVis);
        const musicChip = () => { chipM.textContent = G.music.isOn() ? '🎵 음악' : '🔇 음악'; chipM.setAttribute('aria-pressed', String(G.music.isOn())); };
        const refreshTire = () => { if (!tireOn) return; const cur = TIRES[me.tire].n; chipT.textContent = pitNext ? `🛞 ${cur} → ${TIRES[pitNext].n} (피트 예약)` : `🛞 ${cur} · 눌러서 피트 예약`; chipT.setAttribute('aria-pressed', String(!!pitNext)); };
        chipT.addEventListener('click', () => { G.sfx.tap(); if (me.pitPhase) return; if (me.lap >= laps) { toast('마지막 바퀴에서는 피트에 못 들어가요', 1.6); return; } const others = Object.keys(TIRES).filter((k) => k !== me.tire), i = pitNext ? others.indexOf(pitNext) : -1; pitNext = i + 1 < others.length ? others[i + 1] : null; refreshTire(); toast(pitNext ? `🛞 피트 예약: 출발선 앞에서 ${TIRES[pitNext].n}로 바꿔요` : '🛞 피트 예약 취소', 1.8); });
        chipM.addEventListener('click', () => { G.sfx.tap(); G.music.setOn(!G.music.isOn()); musicChip(); toast(G.music.isOn() ? '🎵 음악 켜짐' : '🔇 음악 꺼짐', 1.2); });
        musicChip(); refreshTire();
        // 밀어서: 막대 위 손가락 위치 = 핸들 세기
        const padCalc = (e) => { const r = pad.getBoundingClientRect(), u = ((e.clientX - r.left) / r.width - 0.5) * 2, v = clamp(u / 0.8, -1, 1); return Math.abs(v) < 0.07 ? 0 : v; };
        pad.addEventListener('pointerdown', (e) => { if (ctlMode !== 'slide') return; e.preventDefault(); pad.setPointerCapture(e.pointerId); padOn = true; padV = padCalc(e); });
        pad.addEventListener('pointermove', (e) => { if (padOn) padV = padCalc(e); });
        ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((t) => pad.addEventListener(t, () => { padOn = false; padV = 0; }));
        // 내 조종 = 키보드/버튼/막대/기울기 + (도우미가 켜져 있으면) 길 안내를 섞는다
        function playerControl(r, dt) {
          let u = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
          if (ctlMode === 'slide') { padS += (padV - padS) * (1 - Math.exp(-SL.rate * (dt || 0.016))); u += Math.sign(padS) * Math.pow(Math.abs(padS), SL.p) * SL.k; }
          let tl = 0; if (performance.now() - tiltAt < 700) { const L = r.off_lat || 0; tl = tiltV * (Math.abs(L) > hw && tiltV * L < 0 ? 1.6 : 1); u += tl; } else tiltV = 0; // 기울기는 어느 방식에서나 더해진다 // 길 밖에서 안쪽으로 기울이면 더 잘 듣게
          u = clamp(u, -1, 1); inputV = ctlMode === 'slide' ? clamp(padS + tl, -1, 1) : u; r.throttle = 1; let st = u;
          if (assistOn && r.fin == null) { const edge = clamp((Math.abs(r.off_lat || 0) - hw * 0.55) / (hw * 0.9), 0, 1), k = (hard ? 0.4 : kid ? 0.9 : 0.65) + (1 - (hard ? 0.4 : kid ? 0.9 : 0.65)) * edge, g = guide(r, 0); st = clamp(u + g.steer * k * (1 - Math.min(1, Math.abs(u)) * (1 - edge)), -1, 1); r.throttle = clamp(1 - g.curve * 0.45 * k, 0.62, 1); } // 가장자리로 갈수록 도우미가 세짐
          { const L = r.off_lat || 0, out = clamp((Math.abs(L) - hw) / (hw * 0.25), 0, 1); if (out > 0 && r.fin == null) st = clamp(st - Math.sign(L) * out * (kid ? 0.5 : hard ? 0.15 : 0.35), -1, 1); } // 길 밖(벽 옆)에 붙어 달리지 않게, 도우미가 꺼져 있어도 길 안쪽으로 살짝 당겨 준다
          r.steerIn = st;
        }
        dbg.setCtl = setCtl; dbg.inp = () => ({ ctlMode, assistOn, padV, tiltV, inputV, paused }); dbg.setAssist = (v) => { assistOn = v; refreshChips(); };
        refreshChips(); if (ctlMode === 'tilt') startTilt();
        if (!G.store.get('race:help', false)) { G.store.set('race:help', true); setTimeout(openHelp, 150); }

        const rank = (r) => { const sc = (a) => (a.fin != null ? 1e9 - a.fin : a.prog); let k = 1; for (const o of racers) if (o !== r && sc(o) > sc(r)) k++; return k; };
        const ordered = () => racers.slice().sort((a, b) => (b.fin != null ? 1e9 - b.fin : b.prog) - (a.fin != null ? 1e9 - a.fin : a.prog));

        // 3D: 선수의 높이(길 높이 + 점프 높이). 평면 경기장은 0
        const hOf = (r) => { if (!T.v3d) return 0; const pm = ((r.prog % M) + M) % M, i0 = Math.floor(pm); return T.hgt[i0] + (T.hgt[(i0 + 1) % M] - T.hgt[i0]) * (pm - i0) + r.zair; };
        const env = { wall: WALL, ctx: null, W: 0, H: 0, T, th, racers, objs, boxT, me, hOf, yaw: 0, t: 0, alpha: 0, dt: 0.016, lowQ: false, fx };
        // 새 그래픽(three.js): 만들 수 없으면(WebGL 없음·오류) 예전 그림으로 그린다
        let gl = null;
        if (gfxNew() && glOK()) { try { gl = window.RaceGL.create({ T, th, racers, me, wall: WALL }); wrap.insertBefore(gl.canvas, cv); cv.style.display = 'none'; gl.canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); if (gl) { const g0 = gl; gl = null; try { g0.dispose(); } catch (er) {} cv.style.display = ''; } }); } catch (e) { console.warn('새 그래픽을 못 써서 예전 그래픽으로 그려요', e); if (gl) try { gl.dispose(); } catch (er) {} gl = null; cv.style.display = ''; } }
        dbg.gl = () => !!gl;
        // 아이템·스킬
        const randItem = (r) => { const k = rank(r), pos = NR > 1 ? (k - 1) / (NR - 1) : 0, pool = pos >= 0.5 ? ['boost', 'boost', 'missile', 'shield', 'banana'] : pos > 0 ? ['boost', 'missile', 'shield', 'banana'] : ['shield', 'banana', 'banana', 'boost']; return G.pick(pool); };
        function hit(r, kind, dur) {
          if (r.fin != null) return false;
          if (r.slip > 0) return false; // 스르륵 피하는 중
          if (r.shield > 0) { r.shield = 0; if (r.isPlayer) toast('🛡️ 막았어요!'); return false; }
          if (kind === 'freeze') r.frozen = Math.max(r.frozen, dur); else { r.stun = Math.max(r.stun, dur); }
          r.v *= 0.3; if (r.isPlayer) { G.sfx.bad(); toast(kind === 'freeze' ? '🧊 꽁꽁!' : '😵 앗!'); } return true;
        }
        const drop = (kind, r, back) => objs.push({ k: kind, x: r.x + Math.cos(r.h) * back, y: r.y + Math.sin(r.h) * back, life: kind === 'oil' ? 14 : kind === 'pit' ? 5 : 18, owner: r, grace: kind === 'pit' ? 0.4 : 0.6, r: kind === 'oil' ? 40 : kind === 'pit' ? 46 : 24, fell: kind === 'pit' ? new Set() : null });
        function shoot(kind, r, sp, life, tgt) { objs.push({ k: kind, x: r.x + Math.cos(r.h) * 34, y: r.y + Math.sin(r.h) * 34, h: r.h, sp, life, owner: r, grace: 0.25, r: 22, tgt }); }
        const hasFree = (r) => r.slots.includes(null), give = (r, it) => { const i = r.slots.indexOf(null); if (i < 0) return false; r.slots[i] = it; return true; };
        function useItem(r, slot) { // 카드 칸 4개: 칸 번호를 주면 그 칸, 안 주면 첫 번째 카드
          if (state !== 'go' || r.fin != null) return;
          const idx = slot == null ? r.slots.findIndex(Boolean) : slot, it = r.slots[idx];
          if (!it) return; r.slots[idx] = null;
          if (it === 'boost') { r.boost = Math.max(r.boost, 1.6); r.boostMul = 1.45; }
          else if (it === 'shield') r.shield = 3;
          else if (it === 'banana') drop('banana', r, -34);
          else if (it === 'missile') { const o = ordered(), k = o.indexOf(r), tgt = k > 0 ? o[k - 1] : null; shoot('missile', r, 640, 3.2, tgt); }
          if (r.isPlayer) { G.sfx.pop(); toast(ITEMS[it].e + ' ' + ITEMS[it].n + '!'); }
        }
        function useSkill(r, slot) {
          const sk = slot === 0 ? r.ch.skill : r.car.skill;
          if (state !== 'go' || r.cd[slot] > 0 || r.fin != null) return false;
          switch (sk.id) {
            case 'dash': r.boost = Math.max(r.boost, 1.3); r.boostMul = 1.55; break;
            case 'sprint': r.boost = Math.max(r.boost, 1.7); r.boostMul = 1.65; break;
            case 'claw': { let tg = null, bd = 1e9; for (const o of racers) if (o !== r && o.fin == null) { const dx = o.x - r.x, dy = o.y - r.y, d = Math.hypot(dx, dy); if (dx * Math.cos(r.h) + dy * Math.sin(r.h) > 0 && d < 380 && d < bd) { bd = d; tg = o; } }
              fx.push({ k: 'ring', x: r.x, y: r.y, t: 0, life: 0.35 }); if (tg) hit(tg, 'spin', 1.1); r.boost = Math.max(r.boost, 0.6); r.boostMul = 1.25; } break;
            case 'siren': fx.push({ k: 'ring', x: r.x, y: r.y, t: 0, life: 0.5 });
              for (const o of racers) if (o !== r) { const dx = o.x - r.x, dy = o.y - r.y, d = Math.hypot(dx, dy); if (d < 320 && dx * Math.cos(r.h) + dy * Math.sin(r.h) < 0) hit(o, 'spin', 0.9); } break;
            case 'splash': fx.push({ k: 'ring', x: r.x, y: r.y, t: 0, life: 0.5 });
              for (const o of racers) if (o !== r) { const dx = o.x - r.x, dy = o.y - r.y, d = Math.hypot(dx, dy); if (d < 420 && dx * Math.cos(r.h) + dy * Math.sin(r.h) > 0 && hit(o, 'spin', 0.5)) { o.vx *= 0.4; o.vy *= 0.4; } } break;
            case 'turbo': r.boost = Math.max(r.boost, 2.2); r.boostMul = 1.5; break;
            case 'shield': r.shield = 3; break;
            case 'trap': drop('trap', r, -34); break;
            case 'oil': drop('oil', r, -44); break;
            case 'ice': shoot('ice', r, 900, 1.1, null); break;
            case 'wave': fx.push({ k: 'ring', x: r.x, y: r.y, t: 0, life: 0.5 });
              for (const o of racers) if (o !== r) { const dx = o.x - r.x, dy = o.y - r.y, d = Math.hypot(dx, dy) || 1; if (d < 230) { if (hit(o, 'spin', 0.8)) { o.vx += dx / d * 300; o.vy += dy / d * 300; } } } break;
            case 'roar': fx.push({ k: 'ring', x: r.x, y: r.y, t: 0, life: 0.5 });
              for (const o of racers) if (o !== r) { const dx = o.x - r.x, dy = o.y - r.y, d = Math.hypot(dx, dy); if (d < 460 && dx * Math.cos(r.h) + dy * Math.sin(r.h) > 0) hit(o, 'spin', 0.9); } break;
            case 'express': r.shield = Math.max(r.shield, 2.5); r.boost = Math.max(r.boost, 1.6); r.boostMul = 1.4; break;
            case 'pit': drop('pit', r, -40); break;
            case 'slither': r.slip = 3; r.boost = Math.max(r.boost, 0.9); r.boostMul = 1.2; break; // 뱀처럼 다른 차·함정을 피해 지나간다
            case 'zig': r.slip = 1.7; r.boost = Math.max(r.boost, 1.5); r.boostMul = 1.45; break;
            case 'hop': r.air = r.airMax = JUMP * GK; r.hop = JUMP * GK * 1.25; r.boost = Math.max(r.boost, 0.5); r.boostMul = 1.2; break; // 뛰어서 다른 차 위를 지나간다
            case 'magnet': if (!give(r, randItem(r))) r.boost = Math.max(r.boost, 0.9); break;
          }
          r.cd[slot] = sk.cd; if (r.isPlayer) { G.sfx.ok(); toast(sk.e + ' ' + sk.n + '!'); } return true;
        }

        dbg.useSkill = useSkill; dbg.useItem = useItem; dbg.hit = hit; dbg.objs = objs;
        // 컴퓨터 선수 조종
        // 길을 따라가는 방향 안내(컴퓨터 선수와 내 도우미가 함께 쓴다)
        const gd = { steer: 0, curve: 0 };
        function guide(r, lane) {
          const look = 5 + Math.floor(r.v / 55), c = P[(r.idx + look) % M], tx = c.x + c.nx * lane * hw * 0.6, ty = c.y + c.ny * lane * hw * 0.6;
          gd.steer = clamp(angDiff(Math.atan2(ty - r.y, tx - r.x), r.h) * 2.6, -1, 1);
          const a = P[r.idx], b = P[(r.idx + 16) % M]; gd.curve = Math.abs(Math.atan2(a.tx * b.ty - a.ty * b.tx, a.tx * b.tx + a.ty * b.ty));
          return gd;
        }
        function aiThink(r, dt) {
          const g = guide(r, r.lane), curve = g.curve;
          r.steerIn = g.steer; r.throttle = clamp(1 - curve * 0.55, 0.62, 1);
          const gap = r.prog - me.prog; let rb = 1; if (!r.isPlayer) { if (gap < -50) rb = 1.06; else if (gap > 60) rb = 0.94; if (!hard && gap < 0) { const gpx = -gap * T.ds; rb = Math.max(rb, 1 + clamp((gpx - 220) / 280, 0, 1) * (kid ? 0.85 : 0.5)); } if (!hard && gap > 0) rb = Math.min(rb, 1 - clamp((gap * T.ds - 300) / 400, 0, 1) * (kid ? 0.45 : 0.25)); } r.rb = rb;
          r.aiT -= dt; if (r.aiT > 0) return; r.aiT = 0.45 + rnd() * 0.3;
          const near = (maxD, ahead) => racers.some((o) => { if (o === r) return false; const dx = o.x - r.x, dy = o.y - r.y, d = Math.hypot(dx, dy), fw = (dx * Math.cos(r.h) + dy * Math.sin(r.h)) > 0; return d < maxD && (ahead === undefined || ahead === fw); });
          const p = hard ? 0.7 : kid ? 0.12 : 0.4;
          if (rnd() < p) for (let i = 0; i < r.slots.length; i++) { const it = r.slots[i]; if (!it) continue; if (it === 'missile' ? near(600, true) : it === 'banana' ? near(260, false) : curve < 0.3) { useItem(r, i); break; } }
          for (const s of [0, 1]) { if (r.cd[s] > 0 || rnd() > p * 0.6) continue; const id = (s === 0 ? r.ch : r.car).skill.id;
            if ((id === 'dash' || id === 'turbo' || id === 'express' || id === 'sprint') && curve < 0.25) useSkill(r, s); else if ((id === 'claw' || id === 'splash') && near(id === 'claw' ? 340 : 380, true)) useSkill(r, s); else if (id === 'siren' && near(300, false)) useSkill(r, s); else if (id === 'roar' && near(420, true)) useSkill(r, s); else if (id === 'shield' && near(180)) useSkill(r, s);
            else if ((id === 'trap' || id === 'oil' || id === 'pit') && near(260, false)) useSkill(r, s); else if (id === 'hop' && near(200, true)) useSkill(r, s); else if (id === 'ice' && near(450, true)) useSkill(r, s);
            else if (id === 'wave' && near(170)) useSkill(r, s); else if (id === 'magnet' && hasFree(r)) useSkill(r, s); }
        }

        // 한 대의 움직임
        function locate(r) {
          let best = 1e18, bi = r.idx;
          for (let o = -5; o <= 14; o++) { const i = (r.idx + o + M) % M, c = P[i], d = (c.x - r.x) ** 2 + (c.y - r.y) ** 2; if (d < best) { best = d; bi = i; } }
          if (best > (hw * 4) ** 2) { best = 1e18; for (let i = 0; i < M; i++) { const c = P[i], d = (c.x - r.x) ** 2 + (c.y - r.y) ** 2; if (d < best) { best = d; bi = i; } } r.prevIdx = bi; }
          if (r.prevIdx > M * 0.75 && bi < M * 0.25) r.lap++; else if (r.prevIdx < M * 0.25 && bi > M * 0.75) r.lap--;
          r.prevIdx = r.idx = bi;
          const c = P[bi], dx = r.x - c.x, dy = r.y - c.y; r.off_lat = dx * c.nx + dy * c.ny;
          r.prog = r.lap * M + bi + clamp((dx * c.tx + dy * c.ty) / T.ds, -0.5, 0.5);
        }
        function step(r, dt) {
          if (r.isPlayer && dbg.steer != null) { r.steerIn = dbg.steer; r.throttle = 1; }
          else if (r.isPlayer && !dbg.auto) playerControl(r, dt);
          else aiThink(r, dt);
          if (r.fin != null) { r.steerIn = clamp(r.steerIn, -1, 1); r.throttle = 0.6; }
          if (r.trail && state === 'go') { r.trT -= dt; if (r.trT <= 0 && r.v > 60) { r.trT = 0.07; r.trI = (r.trI || 0) + 1; r.tr.push({ x: r.x - Math.cos(r.h) * 22, y: r.y - Math.sin(r.h) * 22, h: hOf(r) - r.zair, t: 0, e: r.trail[r.trI % r.trail.length] }); } }
          for (let i = r.tr.length - 1; i >= 0; i--) { r.tr[i].t += dt; if (r.tr[i].t > 0.6) r.tr.splice(i, 1); }
          r.plowCd = Math.max(0, r.plowCd - dt); r.hop = Math.max(0, r.hop - dt); r.slip = Math.max(0, (r.slip || 0) - dt);
          if (SP && state === 'go') { // 먼지 꼬리: 땅에 닿아 달릴 때만, 중력이 약하면 오래 떠 있는다
            r.dT = (r.dT || 0) - dt; if (r.dT <= 0 && r.v > 110 && r.air <= 0 && r.dust.length < 26) { r.dT = 0.05; r.dust.push({ x: r.x - Math.cos(r.h) * 22 + (rnd() - 0.5) * 16, y: r.y - Math.sin(r.h) * 22 + (rnd() - 0.5) * 16, h: hOf(r) - r.zair, t: 0, life: 0.7 * GK }); }
            for (let i = r.dust.length - 1; i >= 0; i--) { r.dust[i].t += dt; if (r.dust[i].t > r.dust[i].life) r.dust.splice(i, 1); }
          }
          r.boost = Math.max(0, r.boost - dt); r.shield = Math.max(0, r.shield - dt); r.stun = Math.max(0, r.stun - dt); r.frozen = Math.max(0, r.frozen - dt);
          for (let s = 0; s < 2; s++) r.cd[s] = Math.max(0, r.cd[s] - dt);
          r.air = Math.max(0, r.air - dt); { const a = r.air > 0 ? 1 - r.air / (r.airMax || JUMP) : 0; r.zair = r.air > 0 ? 80 * GK * 4 * a * (1 - a) : 0; }
          const steer = (r.stun > 0 || r.frozen > 0 ? 0 : r.steerIn) * (r.air > 0 ? 0.5 : 1);
          let surf = r.off ? r.offF : 1, grip = 7, turnK = 1;
          for (const z of T.haz) {
            const dx = r.x - z.x, dy = r.y - z.y; if (dx * dx + dy * dy > z.r * z.r) continue;
            if (z.type === 'boost') { if (r.boost < 0.9) { r.boost = 1.0; r.boostMul = 1.4; if (r.isPlayer) G.sfx.pop(); } }
            else if (z.type === 'slow') surf *= 0.5;
            else if (z.type === 'ice' && !r.iceImm) { grip = 1.1; turnK = 0.7; }
            else if (z.type === 'jump' && r.air <= 0 && r.v > 90) { r.air = r.airMax = JUMP * GK; dbg.jumps = (dbg.jumps || 0) + 1; if (r.isPlayer) G.sfx.pop(); }
          }
          if (SP && !(SP.frost && r.iceImm)) { // 먼지·모래·서리 구간: 바퀴에 따라 느려지고 미끄러진다(풀밭에 강한 캐릭터·차는 덜 느려짐)
            const tr = TIRES[r.tire || 'all'], inDust = T.dust[((r.idx % M) + M) % M] || stormN > 0.5;
            if (inDust) { surf *= Math.min(1, tr.dust + (r.offF - 0.45) * 0.6); grip = Math.min(grip, tr.grip); if (SP.frost) turnK *= 0.85; } else surf *= tr.road;
          }
          // 피트: 예약하면 출발선 앞에서 멈춰 바퀴를 바꾼다
          if (r.isPlayer && tireOn && state === 'go') {
            if (!r.pitPhase && pitNext && r.lap < laps) { const f = (((r.prog % M) + M) % M) / M; if (f >= 0.94 && f <= 0.985) { r.pitPhase = 'in'; toast('🛞 피트로 들어갑니다', 1.4); } }
            if (r.pitPhase === 'in') { r.v *= 1 - Math.min(0.9, 2.6 * dt); if (r.v < 12) { r.pitPhase = 'stop'; r.pitT = 2.5; } }
            else if (r.pitPhase === 'stop') { r.v = 0; r.pitT -= dt; toast(`🛞 바퀴 교체 중 ${Math.max(0, r.pitT).toFixed(1)}초`, 0.25); if (r.pitT <= 0) { r.tire = pitNext; pitNext = null; r.pitPhase = null; refreshTire(); toast(`🛞 ${TIRES[r.tire].n} 바퀴로 바꿨어요!`, 1.8); G.sfx.ok(); } }
          }
          let maxV = r.maxV * (r.boost > 0 ? r.boostMul * (r.ch.mod.boost || 1) : 1) * (r.isPlayer ? 1 : AI.mul * r.aiVar * (r.rb || 1)) * r.throttle * surf;
          if (T.v3d) maxV *= clamp(1 - T.slope[r.idx] * 1.0, 0.86, 1.1); // 오르막은 느리게, 내리막은 빠르게
          if (r.pitPhase) maxV = 0;
          if (r.frozen > 0) maxV = 0; else if (r.stun > 0) maxV = Math.min(maxV, r.maxV * 0.3);
          if (r.v < maxV) r.v = Math.min(maxV, r.v + r.acc * dt * (r.boost > 0 ? 2.4 : 1)); else r.v = Math.max(maxV, r.v - (r.off ? 540 : 230) * dt);
          r.h += steer * r.turn * turnK * Math.min(1, r.v / 170) * dt;
          const k = 1 - Math.exp(-grip * dt); r.vx += (Math.cos(r.h) * r.v - r.vx) * k; r.vy += (Math.sin(r.h) * r.v - r.vy) * k;
          r.x += r.vx * dt; r.y += r.vy * dt;
          r.spin = r.stun > 0 ? r.spin + dt * 13 : 0;
          locate(r);
          const L = r.off_lat; r.off = Math.abs(L) > hw + 6;
          if (Math.abs(L) > WALL) { // 벽: 튕기지 않고 미끄러진다(벽 쪽 속도만 없애고, 길 방향으로 부드럽게 돌려 줌)
            dbg.walls[r.isPlayer ? 0 : 1]++; if (dbg.log) dbg.log.push({ me: r.isPlayer ? 1 : 0, idx: r.idx, v: Math.round(r.v), boost: r.boost > 0 ? 1 : 0, air: r.air > 0 ? 1 : 0 });
            const c = P[r.idx], sg = Math.sign(L), push = L - sg * WALL; r.x -= c.nx * push; r.y -= c.ny * push;
            const vn = r.vx * c.nx + r.vy * c.ny; if (vn * sg > 0) { r.vx -= c.nx * vn; r.vy -= c.ny * vn; }
            // 벽에 붙어서 계속 달리지 않게: 길 방향보다 살짝 안쪽을 보게 돌려 주고, 안쪽으로 핸들을 꺾으면(기울이면) 더 크게 안쪽으로 돌린다
            const inw = clamp(-sg * (r.steerIn || 0), 0, 1);
            r.v *= 0.975; r.h += angDiff(Math.atan2(c.ty, c.tx) - sg * (0.26 + 0.4 * inw), r.h) * Math.min(1, 10 * dt);
          }
          // 박스 줍기
          for (let i = 0; i < T.boxes.length; i++) { if (boxT[i] > 0) continue; const b = T.boxes[i]; if ((b.x - r.x) ** 2 + (b.y - r.y) ** 2 < 900) { if (!hasFree(r) || r.fin != null) { if (r.isPlayer && t - (r.fullT || -9) > 2) { r.fullT = t; toast('🃏 카드 칸이 가득 찼어요! 카드를 써요', 1.4); } continue; } boxT[i] = 4; const it = randItem(r); give(r, it); if (r.isPlayer) { G.sfx.ok(); const n = G.store.get('race:tips', 0); if (n < 3) { G.store.set('race:tips', n + 1); toast(`${ITEMS[it].e} ${ITEMS[it].n}! ${ITEMS[it].d} — 오른쪽 카드 칸을 눌러요`, 3); } else toast(`${ITEMS[it].e} ${ITEMS[it].n}!`, 1.2); } } }
          // 멈춰서 꼼짝 못하면 길 위로 되돌리기
          if (state === 'go' && r.v < 25 && r.stun <= 0 && r.frozen <= 0) r.stuck += dt; else r.stuck = 0;
          if (r.stuck > 2.2) { dbg.respawns++;  const c = P[r.idx]; r.x = c.x; r.y = c.y; r.h = Math.atan2(c.ty, c.tx); r.vx = r.vy = r.v = 0; r.stuck = 0; r.prevIdx = r.idx; }
          if (r.fin == null && r.lap >= laps + 1) { r.fin = t; if (r.isPlayer) { finishing = 1.4; toast('🏁 골인!', 2); G.music.goal(rank(me)); } }
        }

        // 던진 것들
        function stepObjs(dt) {
          for (let i = objs.length - 1; i >= 0; i--) {
            const o = objs[i]; o.life -= dt; o.grace -= dt;
            if (o.k === 'ice' || o.k === 'missile') {
              if (o.k === 'missile' && o.tgt && o.tgt.fin == null) o.h += clamp(angDiff(Math.atan2(o.tgt.y - o.y, o.tgt.x - o.x), o.h), -3.6 * dt, 3.6 * dt);
              o.x += Math.cos(o.h) * o.sp * dt; o.y += Math.sin(o.h) * o.sp * dt;
            }
            let gone = o.life <= 0;
            for (const r of racers) { if (gone) break; if (o.grace > 0 && r === o.owner) continue; if (r.slip > 0 || (r.hop > 0 && o.k !== 'pit')) continue; const d = (r.x - o.x) ** 2 + (r.y - o.y) ** 2; if (d > (o.r + 16) ** 2) continue;
              if (o.k === 'banana') { hit(r, 'spin', 1.2); gone = true; } else if (o.k === 'trap') { if (hit(r, 'spin', 1.6)) r.v *= 0.5; gone = true; }
              else if (o.k === 'pit') { if (r.air <= 0 && !(r.hop > 0) && !o.fell.has(r) && hit(r, 'spin', 1.1)) { r.v *= 0.35; o.fell.add(r); } } // 구멍: 한 번씩 빠진다(점프 중엔 넘어간다)
              else if (o.k === 'oil') { if (r.stun <= 0 && hit(r, 'spin', 0.9)) { r.vx *= 1.1; } o.life -= dt * 2; }
              else if (o.k === 'ice') { hit(r, 'freeze', 1.6); gone = true; } else if (o.k === 'missile') { hit(r, 'spin', 1.4); fx.push({ k: 'ring', x: o.x, y: o.y, t: 0, life: 0.35 }); gone = true; } }
            if (gone) objs.splice(i, 1);
          }
          for (let i = fx.length - 1; i >= 0; i--) { fx[i].t += dt; if (fx[i].t > fx[i].life) fx.splice(i, 1); }
          for (let i = 0; i < boxT.length; i++) if (boxT[i] > 0) boxT[i] -= dt;
        }
        function collide() {
          for (let i = 0; i < racers.length; i++) for (let j = i + 1; j < racers.length; j++) {
            const a = racers[i], b = racers[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.01;
            if (d >= 34) continue;
            if (T.v3d && Math.abs(hOf(a) - hOf(b)) > 45) continue; // 다리 위아래는 부딪히지 않는다
            if (a.hop > 0 || b.hop > 0 || a.slip > 0 || b.slip > 0) continue; // 점프 중인 차는 다른 차 위를 지나간다
            const nx = dx / d, ny = dy / d, ov = 34 - d, wa = b.mass / (a.mass + b.mass), wb = a.mass / (a.mass + b.mass);
            if (a.plow !== b.plow && (a.plow || b.plow)) { // 코끼리: 부딪쳐도 안 멈추고 상대를 밀치며 돌파한다
              const e = a.plow ? a : b, o = a.plow ? b : a, sg = a.plow ? 1 : -1, ex = nx * sg, ey = ny * sg; // e → o 방향
              o.x += ex * ov; o.y += ey * ov; o.vx += ex * 160; o.vy += ey * 160; o.v *= 0.82;
              if (e.plowCd <= 0 && e.v > 120) { e.plowCd = 1.6; hit(o, 'spin', 0.6); }
              continue;
            }
            a.x -= nx * ov * wa; a.y -= ny * ov * wa; b.x += nx * ov * wb; b.y += ny * ov * wb;
            const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
            if (rv < 0) { const imp = -rv * 1.4 / (1 / a.mass + 1 / b.mass); a.vx -= nx * imp / a.mass; a.vy -= ny * imp / a.mass; b.vx += nx * imp / b.mass; b.vy += ny * imp / b.mass; a.v *= 0.96; b.v *= 0.96; }
            if (a.shield > 0 && b.shield <= 0) b.v *= 0.6; else if (b.shield > 0 && a.shield <= 0) a.v *= 0.6;
          }
        }

        // ───────── 그리기 ─────────
        function carShape(c, car, col) {
          // 입체감: 바퀴 윤기 + 몸통(가운데 밝고 가장자리 어둡게) + 테두리 + 유리 + 보닛 반짝임 + 앞뒤 등
          for (const [x, y] of [[-14, -13], [-14, 13], [13, -13], [13, 13]]) { c.fillStyle = '#17181c'; c.beginPath(); c.roundRect(x - 6, y - 4, 12, 8, 2.5); c.fill(); c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(x - 4, y - 3, 8, 1.8); }
          const body = () => { c.beginPath(); c.roundRect(-24, -14, 48, 28, 8); };
          c.fillStyle = col; body(); c.fill();
          const g1 = c.createLinearGradient(0, -14, 0, 14); g1.addColorStop(0, 'rgba(0,0,0,.36)'); g1.addColorStop(0.24, 'rgba(0,0,0,.04)'); g1.addColorStop(0.5, 'rgba(255,255,255,.3)'); g1.addColorStop(0.76, 'rgba(0,0,0,.04)'); g1.addColorStop(1, 'rgba(0,0,0,.36)'); c.fillStyle = g1; body(); c.fill();
          const g2 = c.createLinearGradient(-24, 0, 24, 0); g2.addColorStop(0, 'rgba(0,0,0,.24)'); g2.addColorStop(0.4, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(255,255,255,.16)'); c.fillStyle = g2; body(); c.fill();
          c.strokeStyle = 'rgba(0,0,0,.42)'; c.lineWidth = 1.2; body(); c.stroke();
          const gg = c.createLinearGradient(-7, 0, 11, 0); gg.addColorStop(0, 'rgba(45,65,95,.8)'); gg.addColorStop(1, 'rgba(200,235,255,.9)'); c.fillStyle = gg; c.beginPath(); c.roundRect(-7, -10, 18, 20, 5); c.fill(); c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 1; c.stroke();
          c.fillStyle = 'rgba(255,255,255,.42)'; c.beginPath(); c.ellipse(16, -6, 4.5, 2, 0, 0, TAU); c.fill();
          c.fillStyle = '#fff7b0'; c.fillRect(21, -11, 3, 6); c.fillRect(21, 5, 3, 6); c.fillStyle = '#ff4b4b'; c.fillRect(-24, -11, 2.5, 5); c.fillRect(-24, 6, 2.5, 5);
          if (car.id === 'bolt') { c.fillStyle = '#fff'; c.fillRect(-24, -3, 36, 6); c.fillStyle = '#222'; c.fillRect(-27, -14, 5, 28); }
          else if (car.id === 'tank') { c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(-20, -10, 3, 20); c.fillRect(-12, -10, 3, 20); }
          else if (car.id === 'slide') { c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(-24, -12, 14, 24); }
          else if (car.id === 'hop') { c.fillStyle = '#fff'; c.fillRect(-4, -5, 8, 10); c.fillStyle = 'rgba(0,0,0,.28)'; for (let i = -22; i < 20; i += 8) c.fillRect(i, -14, 4, 4); }
          else if (car.id === 'bus') { c.fillStyle = 'rgba(255,255,255,.55)'; for (let i = -20; i < 18; i += 10) c.fillRect(i, -10, 7, 20); }
          else if (car.id === 'cop') { c.fillStyle = '#fff'; c.fillRect(-24, -14, 8, 28); c.fillStyle = '#ff3b3b'; c.fillRect(-4, -9, 8, 8); c.fillStyle = '#3b8bff'; c.fillRect(-4, 1, 8, 8); }
          else if (car.id === 'rex') { c.fillStyle = '#fff'; for (let i = -12; i < 12; i += 6) c.fillRect(21, i, 5, 3); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(-24, -14, 6, 28); }
          else if (car.id === 'horn') { c.fillStyle = '#f5ecd0'; c.fillRect(22, -13, 7, 3); c.fillRect(22, 10, 7, 3); c.fillRect(24, -1.5, 7, 3); }
          else if (car.id === 'aqua') { c.fillStyle = '#e8792b'; c.fillRect(-20, -3, 34, 6); c.fillStyle = '#f7b267'; for (let i = -16; i < 12; i += 8) c.fillRect(i, -3, 3, 6); }
          else if (car.id === 'spike') { c.fillStyle = '#f0883e'; for (let i = -20; i < 18; i += 8) c.fillRect(i, -3, 5, 6); }
          else if (car.id === 'snake') { c.strokeStyle = '#ffe45c'; c.lineWidth = 3; c.lineJoin = 'round'; c.beginPath(); c.moveTo(-22, -4); for (let i = 0; i < 6; i++) c.lineTo(-15 + i * 7, i % 2 ? -5 : 5); c.stroke(); c.fillStyle = '#e8483f'; c.fillRect(24, -1, 4, 2); }
          else if (car.id === 'claw') { c.fillStyle = '#222'; c.fillRect(-22, -10, 14, 3); c.fillRect(-22, -1.5, 14, 3); c.fillRect(-22, 7, 14, 3); }
          else if (car.id === 'fire') { c.fillStyle = '#ffd24a'; c.fillRect(-23, -2, 38, 4); c.fillStyle = '#eee'; for (let i = -22; i < 12; i += 6) c.fillRect(i, -9, 2, 18); }
          else { c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(-22, -2, 10, 4); }
        }
        const kartSpr = (car, col) => sprite('kart2:' + car.id + col, 120, 80, (g) => { g.scale(2, 2); g.translate(30, 20); carShape(g, car, col); });
        const groundTex = () => sprite('gtex', 256, 256, (g) => { let a = 12345; const rr = () => (a = (a * 1664525 + 1013904223) >>> 0) / 4294967296; for (let i = 0; i < 46; i++) { const x = rr() * 256, y = rr() * 256, r0 = 10 + rr() * 26; g.fillStyle = i % 2 ? 'rgba(255,255,255,.055)' : 'rgba(0,0,0,.05)'; for (const ox of [-256, 0, 256]) for (const oy of [-256, 0, 256]) { g.beginPath(); g.ellipse(x + ox, y + oy, r0, r0 * 0.7, i, 0, TAU); g.fill(); } } });
        let gPat = null, gPatC = null;
        const runs = [], ord = racers.slice();
        let alpha = 0, pcamH = camH, lowQ = false;
        function draw() {
          const zoom = Math.max(H / 680, 0.5 * dpr) * (W > H * 1.05 ? 1.3 : 1); const camY = W > H * 1.05 ? 0.66 : 0.72; // 가로 화면은 내 차를 조금 위로 올려 출발 때 뒷줄 차도 보이게 // 가로 화면은 30% 확대(폰 가로에서 차가 작아 보이던 문제)
          for (const r of racers) { r.dx = r.px + (r.x - r.px) * alpha; r.dy = r.py + (r.y - r.py) * alpha; r.dh = r.ph + angDiff(r.h, r.ph) * alpha; }
          if (gl) { Object.assign(env, { W, H, yaw: pcamH + angDiff(camH, pcamH) * alpha, t, alpha, lowQ, state, stormN }); gl.draw(env); return; }
          if (T.v3d) { Object.assign(env, { ctx, W, H, yaw: pcamH + angDiff(camH, pcamH) * alpha, t, alpha, lowQ, state, stormN }); window.Race3D.draw(env); return; }
          const px = me.dx, py = me.dy, rot = Math.PI / 2 + pcamH + angDiff(camH, pcamH) * alpha;
          ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = th.bg; ctx.fillRect(0, 0, W, H);
          ctx.translate(W / 2, H * camY); ctx.scale(zoom, zoom); ctx.rotate(-rot); ctx.translate(-px, -py);
          const rad = Math.hypot(W / 2, H * camY) / zoom + hw * 1.8, rad2 = rad * rad;
          if (!lowQ) { if (!gPat || gPatC !== ctx) { gPatC = ctx; gPat = ctx.createPattern(groundTex(), 'repeat'); } if (gPat) { ctx.fillStyle = gPat; ctx.fillRect(px - rad, py - rad, rad * 2, rad * 2); } } // 땅 무늬(밝고 어두운 얼룩)로 바닥이 밋밋하지 않게
          // 도로: 화면에 보이는 구간만 긋는다
          runs.length = 0; let cur = null;
          for (let k = 0; k < M; k++) { const c = P[k]; if ((c.x - px) * (c.x - px) + (c.y - py) * (c.y - py) < rad2) { if (!cur) { cur = { s: k, n: 0 }; runs.push(cur); } cur.n++; } else cur = null; }
          if (runs.length > 1 && runs[0].s === 0 && runs[runs.length - 1].s + runs[runs.length - 1].n === M) { const f = runs.shift(), l = runs[runs.length - 1]; l.n += f.n; }
          ctx.lineJoin = 'round';
          for (const r of runs) {
            const pth = new Path2D(), s0 = r.s * T.ds;
            for (let i = 0; i < r.n; i++) { const c = P[(r.s + i) % M]; if (i) pth.lineTo(c.x, c.y); else pth.moveTo(c.x, c.y); }
            ctx.setLineDash([]); ctx.lineCap = 'round';
            ctx.save(); ctx.translate(Math.cos(rot + 1.1) * 9, Math.sin(rot + 1.1) * 9); ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = hw * 3 + 16; ctx.stroke(pth); ctx.restore(); // 길 전체 그림자(화면 오른쪽 아래로)
            ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = hw * 3 + 8; ctx.stroke(pth);
            ctx.strokeStyle = th.shoulder; ctx.lineWidth = hw * 3; ctx.stroke(pth);
            ctx.strokeStyle = th.curb[0]; ctx.lineWidth = hw * 2 + 18; ctx.stroke(pth);
            ctx.setLineDash([34, 34]); ctx.lineDashOffset = s0 % 68; ctx.lineCap = 'butt'; ctx.strokeStyle = th.curb[1]; ctx.stroke(pth);
            ctx.setLineDash([]); ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = hw * 2 + 5; ctx.stroke(pth); ctx.strokeStyle = th.road; ctx.lineWidth = hw * 2; ctx.stroke(pth);
            ctx.strokeStyle = 'rgba(0,0,0,.13)'; ctx.lineWidth = hw * 2 - 4; ctx.stroke(pth); ctx.strokeStyle = th.road; ctx.lineWidth = hw * 1.7; ctx.stroke(pth); ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = hw * 1.0; ctx.stroke(pth); // 길 가장자리는 어둡게, 가운데는 밝게(볼록한 느낌)
            ctx.setLineDash([26, 34]); ctx.lineDashOffset = s0 % 60; ctx.lineCap = 'butt'; ctx.strokeStyle = th.line; ctx.lineWidth = 5; ctx.globalAlpha = 0.8; ctx.stroke(pth); ctx.globalAlpha = 1;
          }
          ctx.setLineDash([]); ctx.lineCap = 'round';
          // 출발선
          const s = P[0];
          if ((s.x - px) ** 2 + (s.y - py) ** 2 < rad2) { ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(Math.atan2(s.ty, s.tx));
            for (let i = 0; i < 10; i++) for (let j = 0; j < 2; j++) { ctx.fillStyle = (i + j) % 2 ? '#fff' : '#111'; ctx.fillRect(-14 + j * 14, -hw + i * (hw * 2 / 10), 14, hw * 2 / 10); } ctx.restore(); }
          // 지대
          for (const z of T.haz) {
            if ((z.x - px) ** 2 + (z.y - py) ** 2 > rad2) continue;
            ctx.save(); ctx.translate(z.x, z.y);
            if (z.type === 'boost') { ctx.rotate(z.a); ctx.fillStyle = 'rgba(0,200,255,.9)'; ctx.fillRect(-34, -30, 68, 60); ctx.strokeStyle = '#fff'; ctx.lineWidth = 7; ctx.lineCap = 'round';
              for (const o of [-16, 6]) { ctx.beginPath(); ctx.moveTo(o, -18); ctx.lineTo(o + 14, 0); ctx.lineTo(o, 18); ctx.stroke(); } }
            else if (z.type === 'slow') { ctx.fillStyle = th.slow; ctx.beginPath(); ctx.ellipse(0, 0, z.r, z.r * 0.8, 0.5, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 4; ctx.stroke(); }
            else { ctx.fillStyle = 'rgba(190,235,255,.85)'; ctx.beginPath(); ctx.ellipse(0, 0, z.r, z.r * 0.75, -0.4, 0, TAU); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-z.r * 0.5, -6); ctx.lineTo(0, -z.r * 0.3); ctx.stroke(); }
            ctx.restore();
          }
          // 아이템 상자
          const qs = sprite('?', 48, 48, (g) => { g.fillStyle = '#fff'; g.font = 'bold 40px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 24, 26); });
          for (let i = 0; i < T.boxes.length; i++) { const b = T.boxes[i]; if (boxT[i] > 0 || (b.x - px) ** 2 + (b.y - py) ** 2 > rad2) continue;
            ctx.save(); ctx.translate(b.x, b.y); ctx.save(); ctx.rotate(rot); ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(5, 9, 17, 12, 0, 0, TAU); ctx.fill(); ctx.restore(); ctx.save(); ctx.rotate(t * 1.6 + i); ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#c98a00'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(-14, -14, 28, 28, 6); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.roundRect(-11, -11, 22, 9, 4); ctx.fill(); ctx.fillStyle = 'rgba(160,90,0,.3)'; ctx.beginPath(); ctx.roundRect(-11, 4, 22, 7, 3); ctx.fill(); ctx.restore();
            ctx.rotate(rot); ctx.drawImage(qs, -12, -12, 24, 24); ctx.restore(); }
          // 장식 (느린 기기에서는 절반만)
          for (let i = 0; i < T.decos.length; i++) { if (lowQ && (i & 1)) continue; const d = T.decos[i]; if ((d.x - px) ** 2 + (d.y - py) ** 2 > rad2) continue; ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(rot); if (!lowQ) { ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(d.s * 0.14, d.s * 0.5, d.s * 0.5, d.s * 0.2, 0, 0, TAU); ctx.fill(); } stamp(ctx, d.e, d.s); ctx.restore(); }
          // 던진 것
          for (const o of objs) { const ox = (o.px === undefined ? o.x : o.px + (o.x - o.px) * alpha), oy = (o.py === undefined ? o.y : o.py + (o.y - o.py) * alpha); ctx.save(); ctx.translate(ox, oy);
            if (o.k === 'oil') { ctx.fillStyle = 'rgba(20,20,30,.85)'; ctx.beginPath(); ctx.ellipse(0, 0, o.r, o.r * 0.75, 0.3, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(120,140,255,.35)'; ctx.beginPath(); ctx.ellipse(-8, -6, o.r * 0.4, o.r * 0.2, 0.3, 0, TAU); ctx.fill(); }
            else if (o.k === 'pit') { ctx.fillStyle = '#6b4a2b'; ctx.beginPath(); ctx.ellipse(0, 0, o.r, o.r * 0.78, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#120c08'; ctx.beginPath(); ctx.ellipse(0, 0, o.r * 0.8, o.r * 0.6, 0, 0, TAU); ctx.fill(); }
            else { ctx.rotate(rot); stamp(ctx, o.k === 'banana' ? '🍌' : o.k === 'trap' ? '🪤' : o.k === 'ice' ? '🧊' : '🎯', 34); }
            ctx.restore(); }
          // 차 (아래쪽에 있는 차를 위에 그린다)
          for (let i = 1; i < ord.length; i++) { const v = ord[i]; let j = i - 1; while (j >= 0 && ord[j].dy > v.dy) { ord[j + 1] = ord[j]; j--; } ord[j + 1] = v; }
          for (const p of me.tr) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(rot); ctx.globalAlpha = 1 - p.t / 0.6; stamp(ctx, p.e, 20 * (1 - 0.4 * p.t / 0.6)); ctx.restore(); }
          for (const r of ord) {
            ctx.save(); ctx.translate(r.dx, r.dy); { const k = (r.isPlayer ? 1.5 : 1.32) * (1 + r.zair / 220); ctx.scale(k, k); } // 차를 크게(내 차는 더 크게, 점프 땐 더 크게)
            if (r.isPlayer) { ctx.save(); const pu = 0.5 + 0.5 * Math.sin(t * 6); ctx.shadowColor = 'rgba(255,225,77,.95)'; ctx.shadowBlur = 14; ctx.strokeStyle = 'rgba(255,225,77,' + (0.75 + 0.25 * pu) + ')'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.ellipse(0, 3, 40 + pu * 3, 27 + pu * 2, 0, 0, TAU); ctx.stroke(); ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,225,77,.22)'; ctx.fill(); ctx.restore(); } // 내 차: 노란 빛 고리
            if (r.boost > 0) { ctx.save(); ctx.rotate(r.dh); ctx.fillStyle = '#ff9f1c'; ctx.beginPath(); ctx.moveTo(-24, -9); ctx.lineTo(-24 - 18 - rnd() * 10, 0); ctx.lineTo(-24, 9); ctx.fill(); ctx.restore(); }
            ctx.save(); ctx.rotate(rot); ctx.translate(5 + r.zair * 0.12, 8 + r.zair * 0.3); ctx.rotate(r.dh + r.spin - rot); ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.roundRect(-25, -15, 50, 30, 9); ctx.fill(); ctx.restore(); // 차 그림자(점프하면 멀어진다)
            ctx.save(); ctx.rotate(r.dh + r.spin + (r.slip > 0 ? Math.sin(t * 20) * 0.24 : 0)); ctx.drawImage(kartSpr(r.car, r.col), -30, -20, 60, 40); ctx.restore(); // 스르륵 피하는 중에는 뱀처럼 꿈틀꿈틀
            ctx.save(); ctx.rotate(rot); ctx.fillStyle = 'rgba(0,0,0,.26)'; ctx.beginPath(); ctx.arc(2.5, 3.5, 15, 0, TAU); ctx.fill(); stamp(ctx, r.ch.e, 26); if (r.hat) { ctx.translate(0, -15); stamp(ctx, r.hat, 17); }
            if (r.shield > 0) { ctx.strokeStyle = 'rgba(80,220,255,.9)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 30 + Math.sin(t * 10) * 2, 0, TAU); ctx.stroke(); }
            if (r.slip > 0) { ctx.strokeStyle = 'rgba(120,230,90,.9)'; ctx.lineWidth = 3; ctx.setLineDash([7, 7]); ctx.lineDashOffset = -t * 60; ctx.beginPath(); ctx.arc(0, 0, 31, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
            if (r.frozen > 0) { ctx.globalAlpha = 0.85; stamp(ctx, '🧊', 44); ctx.globalAlpha = 1; }
            ctx.restore(); ctx.restore();
          }
          { const k = 1.5 * (1 + me.zair / 220); ctx.save(); ctx.translate(me.dx, me.dy); ctx.rotate(rot); ctx.scale(k, k); const bob = Math.sin(t * 7) * 3; ctx.fillStyle = '#ffe14d'; ctx.strokeStyle = '#222'; ctx.lineWidth = 3.5; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-11, -50 + bob); ctx.lineTo(11, -50 + bob); ctx.lineTo(0, -34 + bob); ctx.closePath(); ctx.stroke(); ctx.fill(); ctx.restore(); } // 내 화살표: 다른 차에 가려지지 않게 맨 위에 그린다
          for (const f of fx) if (f.k === 'ring') { ctx.strokeStyle = `rgba(255,255,255,${1 - f.t / f.life})`; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(f.x, f.y, 20 + (f.t / f.life) * 220, 0, TAU); ctx.stroke(); }
        }
        const mb = T.bounds, mw = mb.x1 - mb.x0, mh = mb.y1 - mb.y0, ms = Math.min(100 / mw, 100 / mh), mx = (x) => 60 + (x - (mb.x0 + mb.x1) / 2) * ms, my = (y) => 60 + (y - (mb.y0 + mb.y1) / 2) * ms;
        function drawMini() {
          mctx.clearRect(0, 0, 120, 120); mctx.lineWidth = 5; mctx.lineJoin = 'round'; mctx.strokeStyle = 'rgba(255,255,255,.85)'; mctx.beginPath();
          for (let i = 0; i < M; i += 4) { const p = P[i]; i ? mctx.lineTo(mx(p.x), my(p.y)) : mctx.moveTo(mx(p.x), my(p.y)); } mctx.closePath(); mctx.stroke();
          for (const r of racers) { mctx.fillStyle = r.car.color; mctx.beginPath(); mctx.arc(mx(r.x), my(r.y), r.isPlayer ? 6 : 4, 0, TAU); mctx.fill(); if (r.isPlayer) { mctx.strokeStyle = '#fff'; mctx.lineWidth = 2; mctx.stroke(); mctx.lineWidth = 5; } }
        }
        const setTxt = (el, v) => { if (el._v !== v) { el._v = v; el.textContent = v; } };
        function hud(dt) {
          toastT -= dt; if (toastT <= 0) setTxt(toastEl, '');
          const k = rank(me), lap = clamp(me.lap, 1, laps);
          setTxt(badge, `🏁 ${k}등 / ${NR}  ·  🔁 ${lap}/${laps}`);
          cardEls.forEach((el, i) => { const it = me.slots[i]; setTxt(el.firstChild, it ? ITEMS[it].e : '·'); el.classList.toggle('ready', !!it); });
          [[bS1, me.ch.skill, 0], [bS2, me.car.skill, 1]].forEach(([b, sk, i]) => { if (b._sk !== sk) { b._sk = sk; b._em.textContent = sk.e; b.querySelector('small').textContent = sk.tag || sk.n; } const h = (me.cd[i] > 0 ? Math.round(me.cd[i] / sk.cd * 100) : 0) + '%'; if (b._h !== h) { b._h = h; b._cd.style.height = h; } });
        }

        // 반복
        const kd = (e) => { const k = e.key; if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.left = true; else if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.right = true; else if (k === ' ') useItem(me); else if (k >= '1' && k <= '4') useItem(me, +k - 1); else if (k === 'p' || k === 'P' || k === 'Escape') { if (pauseBox) closePause(); else openPause(); } else if (k === 'z' || k === 'Z') useSkill(me, 0); else if (k === 'x' || k === 'X') useSkill(me, 1); else return; e.preventDefault(); };
        const ku = (e) => { const k = e.key; if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.left = false; else if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.right = false; };
        addEventListener('keydown', kd); addEventListener('keyup', ku);
        toast('준비!', 1);
        function end() {
          if (over) return; over = true;
          const k = rank(me), mk = hard ? 'hard' : kid ? 'kid' : 'easy', key = 'race:done:' + mk, g = grpOf(TD), mine = groupIdx(g), n = mine.length, gname = ['2D', '3D', '우주'][g];
          const done = new Set(G.store.get(key, [])); done.add(sel.tr); G.store.set(key, [...done]);
          const left = mine.filter((i) => !done.has(i)), doneCnt = n - left.length;
          const raceG = G.games.find((x) => x.id === 'race');
          const switchTo = (toHard, tr) => () => { pendingTrack = tr; G.hard = toHard; G.kid = false; G.store.set('hard', toHard); G.store.set('kid', false); G.start(raceG); };
          let ask;
          if (left.length) {
            const nx = left.find((i) => i > sel.tr); const nxt = nx === undefined ? left[0] : nx, t = TRACKS[nxt];
            ask = { q: `다음 경기를 할까요?\n▶ ${t.e} ${t.n} (${t.shape})`, yes: { label: '✅ 네, 계속!', fn: () => { sel.tr = nxt; G.store.set('race:sel', sel); if (stopFn) stopFn(); startRace(); } }, no: { label: '❌ 아니요, 그만', fn: () => goFirst() } };
          } else if (kid) { // 아주 쉬움 코스를 모두 완료 → 쉬워요에 도전?
            G.store.set(key, [...done].filter((i) => !mine.includes(i)));
            ask = { q: `🎉 아주 쉬운 ${gname} 경기장 ${n}개를 모두 달렸어요!\n🙂 쉬운 ${gname} 경기장에 도전할까요?`, yes: { label: '🙂 네, 도전!', fn: switchTo(false, mine[0]) }, no: { label: '❌ 아니요', fn: () => goFirst() } };
          } else if (!hard) { // 이 탭(2D 또는 3D)의 경기장을 모두 달림 → 같은 탭의 하드에 도전?
            G.store.set(key, [...done].filter((i) => !mine.includes(i)));
            ask = { q: `🎉 이지 ${gname} 경기장 ${n}개를 모두 달렸어요!\n🔥 어려운 ${gname} 경기장에 도전할까요?`, yes: { label: '🔥 네, 도전!', fn: switchTo(true, mine[0]) }, no: { label: '❌ 아니요', fn: () => goFirst() } };
          } else {
            G.store.set(key, [...done].filter((i) => !mine.includes(i)));
            ask = { q: `🏆 하드 ${gname} 경기장 ${n}개까지 모두 완주했어요!\n이지 ${gname} 경기장부터 다시 달려 볼까요?`, yes: { label: '✅ 네, 다시!', fn: switchTo(false, mine[0]) }, no: { label: '❌ 아니요', fn: () => goFirst() } };
          }
          const gain = (k === 1 ? 3 : k === 2 ? 2 : 1) + (G.hard ? 1 : 0), nw = window.RaceReward.newly(G.starCount, G.starCount + gain); // G.win 이 별을 더하기 전 값으로 비교
          G.win({ stars: k === 1 ? 3 : k === 2 ? 2 : 1, text: (k === 1 ? '🏆 1등!' : k + '등으로 들어왔어요') + ` · ${TD.n} (${TD.shape}) · ${gname} 완주 ${doneCnt}/${n}` + (nw.length ? ' · 🎉 새 보상! ' + nw.map((m) => m.ic + ' ' + m.n).join(', ') + ' (🏅 내 보상에서 확인)' : ''), ask });
        }
        const STEP = 1 / 60;
        let acc = 0, ema = STEP, nF = 0, lastDown = -99;
        function simStep(dt) {
          for (const r of racers) { r.px = r.x; r.py = r.y; r.ph = r.h; }
          for (const o of objs) { o.px = o.x; o.py = o.y; }
          t += dt; pcamH = camH;
          if (stormOn && state === 'go') { if (!stormFired && me.lap >= 2) { stormFired = true; toast('🌪️ ' + SP.storm.toast, 3.8); chipW.hidden = false; chipW.textContent = '🌪️ ' + SP.storm.chip; G.sfx.bad(); } if (stormFired) stormN = Math.min(1, stormN + dt / 4); }
          if (goClear > 0) { goClear -= dt; if (goClear <= 0) setTxt(countEl, ''); }
          if (state === 'count') {
            cnt -= dt; const n = Math.ceil(cnt);
            if (n !== lastN) { lastN = n; if (n >= 1 && n <= 3) { setTxt(countEl, String(n)); G.music.countdown(n); } }
            if (cnt <= 0) { state = 'go'; setTxt(countEl, '출발!'); goClear = 0.8; wrap.classList.remove('counting'); tiltZero = null; G.music.countdown(0); G.music.play(TD.mus || TD.id, hard); }
          }
          else if (!over) {
            for (const r of racers) step(r, dt); stepObjs(dt); collide();
            if (finishing > 0) { finishing -= dt; if (finishing <= 0) end(); }
            if (t > 300) end();
          }
          camH += angDiff(me.h, camH) * Math.min(1, dt * 6);
        }
        function frame(ts) {
          raf = requestAnimationFrame(frame);
          const raw = Math.min(0.1, (ts - last) / 1000 || 0.016); last = ts;
          acc += paused ? 0 : raw * (dbg.speed || 1);
          for (let n = 0; acc >= STEP && n < 8; n++) { simStep(STEP); acc -= STEP; }
          if (acc >= STEP) acc = 0;
          alpha = acc / STEP;
          if (knob._v !== inputV) { knob._v = inputV; knob.style.left = (50 + inputV * 40) + '%'; }
          env.dt = raw; const d0 = performance.now(); draw(); if (dbg.sync) ctx.getImageData(0, 0, 1, 1); if (dbg.rec) dbg.ms.push([performance.now() - d0, Math.abs(me.steerIn)]);
          hudT -= raw; if (hudT <= 0) { hudT = 0.05; hud(0.05); drawMini(); }
          // 느린 기기: 해상도를 낮춰 부드럽게, 여유가 생기면 되돌린다
          ema = ema * 0.92 + raw * 0.08; nF++;
          if (nF > 80 && nF % 40 === 0 && !dbg.noAdapt && (dbg.speed || 1) === 1) {
            const now = performance.now() / 1000;
            if (ema > 0.026 && q > 0.5) { q = Math.max(0.5, q * 0.8); lastDown = now; fit(); } else if (ema < 0.0185 && q < 1 && now - lastDown > 8) { q = Math.min(1, q * 1.12); fit(); }
            lowQ = q < 0.75; dbg.q = q;
          }
        }
        raf = requestAnimationFrame(frame);
        stopFn = () => { cancelAnimationFrame(raf); ro.disconnect(); if (gl) { try { gl.dispose(); } catch (e) {} gl = null; } stopTilt(); stopSensors(); G.music.stop(); G.music.release('help'); G.music.release('pause'); bPause.remove(); bFull.remove(); delete document.documentElement.dataset.racing; document.removeEventListener('visibilitychange', onVis); document.querySelectorAll('.rhelp').forEach((e) => e.remove()); removeEventListener('keydown', kd); removeEventListener('keyup', ku); if (G.raceDebug === dbg) G.raceDebug = null; };
      }

      if (pendingTrack !== null) { sel.tr = pendingTrack; pendingTrack = null; G.store.set('race:sel', sel); G.navPush(showTracks); startRace(); } else showChars();
      return () => { removeEventListener('resize', onResize); removeEventListener('orientationchange', onResize); clearTimeout(rzT); delete document.documentElement.dataset.game; if (stopFn) stopFn(); try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {} };
    },
  });
})();
