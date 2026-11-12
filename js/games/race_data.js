// 레이싱 데이터: 캐릭터 6, 차 6, 경기장 8 + 트랙 만들기
(function () {
  'use strict';
  const TAU = Math.PI * 2;

  // 캐릭터: 특징(mod) + 전용 스킬. acc 가속, max 최고속도, turn 핸들, mass 무게, off 풀밭 보너스
  const CHARS = [
    { id: 'toto', n: '토토', e: '🐰', color: 'pink', trait: '가속이 빨라요', skill: { id: 'dash', tag: '대시', n: '점프 대시', e: '💨', d: '순간적으로 확 빨라져요', cd: 8 }, mod: { acc: 1.25, max: 1, turn: 1, mass: 0.9, off: 0 } },
    { id: 'gom', n: '곰곰이', e: '🐻', color: 'orange', trait: '튼튼해서 잘 안 밀려요', skill: { id: 'shield', tag: '방패', n: '방패', e: '🛡️', d: '3초 동안 공격을 막아요', cd: 12 }, mod: { acc: 0.95, max: 1, turn: 0.95, mass: 1.5, off: 0.12 } },
    { id: 'yeo', n: '여우리', e: '🦊', color: 'lemon', trait: '핸들이 아주 좋아요', skill: { id: 'trap', tag: '함정', n: '함정', e: '🪤', d: '뒤에 함정을 놓아요', cd: 9 }, mod: { acc: 1, max: 1, turn: 1.2, mass: 0.85, off: 0 } },
    { id: 'peng', n: '펭구', e: '🐧', color: 'sky', trait: '얼음길에서도 안 미끄러워요', skill: { id: 'ice', tag: '얼음', n: '얼음 발사', e: '🧊', d: '맞은 차가 꽁꽁 얼어요', cd: 10 }, mod: { acc: 1, max: 1.04, turn: 1, mass: 1, off: 0, ice: 1 } },
    { id: 'leo', n: '레오', e: '🦁', color: 'lemon', trait: '부스트가 더 세게 나가요', skill: { id: 'roar', tag: '포효', n: '사자 포효', e: '📣', d: '앞에 있는 차들이 놀라서 빙글 돌아요', cd: 11 }, mod: { acc: 0.95, max: 1.02, turn: 0.95, mass: 1.15, off: 0, boost: 1.18 } },
    { id: 'eleph', n: '코코', e: '🐘', color: 'sky', trait: '앞 차를 밀치며 돌파해요', skill: { id: 'pit', tag: '구멍', n: '땅 구멍', e: '🕳️', d: '뒤에 구멍을 잠시 만들어 빠뜨려요', cd: 12 }, mod: { acc: 0.9, max: 1, turn: 0.85, mass: 1.6, off: 0.1, plow: true } },
  ];

  // 차: 능력치(st) + 전용 스킬. bars = 화면에 보여 줄 별점(속도·가속·핸들·튼튼)
  const CARS = [
    { id: 'bolt', n: '번개호', e: '🏎️', color: '#e74c3c', ui: 'pink', trait: '최고 속도가 빨라요', skill: { id: 'turbo', tag: '터보', n: '터보', e: '🚀', d: '2초 동안 큰 부스트', cd: 14 }, st: { speed: 1.12, acc: 0.9, turn: 0.85, mass: 1, off: 0 }, bars: [5, 3, 2, 2] },
    { id: 'tank', n: '튼튼이', e: '🚙', color: '#27ae60', ui: 'mint', trait: '풀밭도 잘 달려요', skill: { id: 'wave', tag: '충격', n: '충격파', e: '💥', d: '주변 차를 밀어내요', cd: 13 }, st: { speed: 1.0, acc: 1.0, turn: 0.95, mass: 1.4, off: 0.3 }, bars: [3, 3, 3, 5] },
    { id: 'slide', n: '미끄리', e: '🛻', color: '#3498db', ui: 'sky', trait: '커브를 잘 돌아요', skill: { id: 'oil', tag: '기름', n: '기름 웅덩이', e: '🛢️', d: '밟으면 미끄러져요', cd: 10 }, st: { speed: 0.97, acc: 1.0, turn: 1.22, mass: 0.9, off: 0 }, bars: [3, 3, 5, 2] },
    { id: 'van', n: '든든이', e: '🚐', color: '#f1c40f', ui: 'lemon', trait: '출발이 빨라요', skill: { id: 'magnet', tag: '뽑기', n: '아이템 뽑기', e: '🎁', d: '아이템을 바로 받아요', cd: 11 }, st: { speed: 0.95, acc: 1.18, turn: 1, mass: 1.1, off: 0.05 }, bars: [2, 5, 3, 3] },
    { id: 'bus', n: '빵빵이', e: '🚌', color: '#ff8a3d', ui: 'peach', trait: '아주 커서 부딪치면 상대가 튕겨 나가요', skill: { id: 'express', tag: '급행', n: '급행 출발', e: '🚍', d: '방패를 쓰고 쌩 달려요', cd: 13 }, st: { speed: 0.93, acc: 0.82, turn: 0.82, mass: 1.8, off: 0.1 }, bars: [2, 2, 2, 5] },
    { id: 'hop', n: '폴짝이', e: '🚕', color: '#1abc9c', ui: 'mint', trait: '점프해서 앞 차를 넘어가요', skill: { id: 'hop', tag: '점프', n: '점프 추월', e: '🦘', d: '폴짝 뛰어 다른 차 위를 넘어가요', cd: 9 }, st: { speed: 1.0, acc: 1.05, turn: 1.05, mass: 0.85, off: 0 }, bars: [3, 4, 4, 1] },
  ];

  // ───────── 경기장 ─────────
  // 모양은 꼭짓점(poly)으로 그리면 자동으로 부드러운 곡선이 된다. 이지 8개 + 하드 8개, 모양이 모두 다르다.
  const poly = (f, n) => Array.from({ length: n }, (_, i) => f(i / n * TAU));
  const lemn = (A, B, n, extra) => poly((t) => [A * Math.sin(t), B * Math.sin(t) * Math.cos(t) + (extra || 0) * Math.sin(3 * t)], n);
  const polar = (R, k, a, n, ph) => poly((th) => { const r = R * (1 + a * Math.cos(k * th + (ph || 0))); return [r * Math.cos(th), r * Math.sin(th)]; }, n);
  const heart = (s, n) => poly((t) => [s * 16 * Math.sin(t) ** 3, -s * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))], n);
  const limacon = (A, n) => poly((t) => { const r = 1 + 1.7 * Math.cos(t); return [A * r * Math.cos(t) - A * 1.2, A * r * Math.sin(t)]; }, n); // 안쪽에 작은 고리가 있는 곡선(한 번 교차)
  const arc = (cx, cy, R, a0, a1, step) => { const out = [], n = Math.max(2, Math.round(Math.abs(a1 - a0) / step)); for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; out.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]); } return out; };
  const crescent = () => arc(0, 0, 1250, 70, 290, 12).concat(arc(520, 0, 880, 250, 110, 12)); // 반달(두껍게 닫은 C 모양)
  const trefoil = (s, n) => poly((t) => [s * (Math.sin(t) + 2 * Math.sin(2 * t)), s * (Math.cos(t) - 2 * Math.cos(2 * t))], n);

  const egg = (n) => poly((t) => [1250 * Math.sin(t) * (1 + 0.22 * Math.cos(t)), -900 * Math.cos(t)], n); // 달걀
  const BUTTERFLY = [[0, -300], [600, -900], [1300, -900], [1400, -300], [900, 100], [1400, 600], [1200, 1000], [500, 900], [0, 300], [-500, 900], [-1200, 1000], [-1400, 600], [-900, 100], [-1400, -300], [-1300, -900], [-600, -900]];
  const GAMMA = [[-1300, -900], [1300, -900], [1300, 900], [500, 900], [500, -100], [-1300, -100]];
  const E_RAW = [[-1300, -1000], [1300, -1000], [1300, -600], [-700, -600], [-700, -200], [900, -200], [900, 200], [-700, 200], [-700, 600], [1300, 600], [1300, 1000], [-1300, 1000]];
  const S_RAW = [[-1300, -1000], [1300, -1000], [1300, -600], [-700, -600], [-700, -200], [1300, -200], [1300, 1000], [-1300, 1000], [-1300, 600], [700, 600], [700, 200], [-1300, 200]];
  const stretch = (pts, kx, ky) => pts.map((p) => [p[0] * kx, p[1] * ky]);
  const E_SHAPE = stretch(E_RAW, 0.8, 1.5), S_SHAPE = stretch(S_RAW, 0.8, 1.5);
  const cloud = (n) => poly((t) => { const r = 1150 * (1 + 0.15 * Math.cos(3 * t) + 0.1 * Math.sin(2 * t)); return [r * Math.cos(t), r * Math.sin(t) * 0.8]; }, n);
  const HOUSE = [[-1300, -300], [0, -1100], [1300, -300], [1300, 1000], [-1300, 1000]];
  const H_SHAPE = [[-1300, -1000], [-700, -1000], [-700, -200], [700, -200], [700, -1000], [1300, -1000], [1300, 1000], [700, 1000], [700, 200], [-700, 200], [-700, 1000], [-1300, 1000]];

  // 장소별 색·장식 (이지/하드 공통)
  const TH = {
    meadow: { bg: '#7ed56f', shoulder: '#6cc35e', road: '#5a5f6a', curb: ['#e74c3c', '#ffffff'], line: '#ffffff', slow: '#8a6a3c', sky: ['#6ec6ff', '#d8f3ff'], ridge: ['#9fd68f', '#7bbf6a'], deco: ['🌳', '🌲', '🌼', '🌷', '🍄'] },
    desert: { bg: '#f3d58a', shoulder: '#e8c477', road: '#7a6a55', curb: ['#d35400', '#ffffff'], line: '#fff3c4', slow: '#c9a45a', sky: ['#ffb86b', '#ffe9b8'], ridge: ['#e0a86a', '#c98f55'], deco: ['🌵', '🪨', '🦂', '🐪', '🏜️'] },
    snow: { bg: '#eaf6ff', shoulder: '#d8ecf8', road: '#7f8da0', curb: ['#2980b9', '#ffffff'], line: '#ffffff', slow: '#cfe3f0', sky: ['#9ec7ff', '#eef7ff'], ridge: ['#cfe3f5', '#b5cfe6'], deco: ['⛄', '🌲', '❄️', '🏔️', '🎿'] },
    beach: { bg: '#ffe9a8', shoulder: '#fbdc8a', road: '#6d7a88', curb: ['#16a085', '#ffffff'], line: '#ffffff', slow: '#5dade2', sky: ['#52c3ff', '#fff3c2'], ridge: ['#7fd0c0', '#4fb3a6'], deco: ['🌴', '🐚', '⛱️', '🦀', '🏐'] },
    candy: { bg: '#ffc7e0', shoulder: '#ffb3d4', road: '#8e6bb8', curb: ['#ff6fb5', '#ffffff'], line: '#fff3fb', slow: '#c0392b', sky: ['#ffa6d5', '#ffe6f3'], ridge: ['#e58bc0', '#cf6fae'], deco: ['🍭', '🧁', '🍩', '🍬', '🍪'] },
    city: { bg: '#1f2a44', shoulder: '#2a3658', road: '#3b3f4f', curb: ['#ff4fa3', '#4fe3ff'], line: '#ffe94f', slow: '#1b1f2d', sky: ['#0b1030', '#3a4a8a'], ridge: ['#27335c', '#1a2346'], deco: ['🏢', '🏙️', '💡', '🌃', '🚦'] },
    lava: { bg: '#3a1a14', shoulder: '#552218', road: '#4a4a52', curb: ['#ff7a1a', '#222222'], line: '#ffd6a0', slow: '#ff5a1f', sky: ['#2a0a08', '#8a2c14'], ridge: ['#5a1d12', '#3d120b'], deco: ['🌋', '🔥', '🪨', '💀', '🦇'] },
    moon: { bg: '#8b8b92', shoulder: '#7a7a82', road: '#4b4d58', curb: ['#7ff7ff', '#10303c'], line: '#bff9ff', slow: '#a9a39a', sky: ['#01020a', '#101a44'], ridge: ['#6c6c75', '#54545d'], stars: true, planet: 'earth', deco: ['crater', 'crater', 'rock', 'rock', '🛰️', '📡'] },
    mars: { bg: '#b3623e', shoulder: '#a05632', road: '#5b4338', curb: ['#ffd08a', '#6a280f'], line: '#ffe2c4', slow: '#c4784a', sky: ['#b77a52', '#f1cfa4'], ridge: ['#9d573a', '#7c4129'], planet: 'phobos', deco: ['crater', 'rock', 'rock', 'rock', '⛰️', '🛸'] },
    europa: { bg: '#d6e3ee', shoulder: '#c4d6e6', road: '#56667f', curb: ['#a8e6ff', '#14305a'], line: '#eaf6ff', slow: '#9fc0dc', sky: ['#040824', '#27406e'], ridge: ['#a9bcd2', '#8aa1bb'], stars: true, planet: 'jupiter', deco: ['crater', 'ice', 'ice', 'ice', '🧊', '📡'] },
    space: { bg: '#0b0b2a', shoulder: '#15154a', road: '#46486a', curb: ['#9b59b6', '#ffffff'], line: '#7ff7ff', slow: '#2c2c5a', sky: ['#02020f', '#1b1b5a'], ridge: ['#2a2a78', '#1a1a52'], deco: ['⭐', '🪐', '🛰️', '☄️', '🌙'] },
  };
  // 이지: 넓은 길(w 170), 부드러운 모양 / 하드: 좁은 길(w 130), 급커브·꼬인 모양, 함정 더 많음
  const T = (th, n, e, shape, gim, pts, w, s0, haz) => ({ id: th, n, e, shape, gim, poly: pts, w, s0, theme: TH[th], haz, rmin: w >= 170 ? 215 : 165 });
  // 3D 경기장: 길 모양 + 높이 곡선(h0 + Σ A·sin(2π·k·u + φ), u = 한 바퀴 0~1). 점프대(jump)와 다리(고가도로)가 있다.
  const T3 = (th, n, e, shape, gim, pts, w, s0, haz, h0, hills) => Object.assign(T(th, n, e, shape, gim, pts, w, s0, haz), { v3d: true, h0, hills });
  const sc = (pts, k) => pts.map((p) => [p[0] * k, p[1] * k]);
  const FISH = sc([[-1500, 0], [-1000, -500], [-200, -700], [600, -500], [1050, -250], [1500, -650], [1500, 650], [1050, 250], [600, 500], [-200, 700], [-1000, 500]], 1.1);
  const HEART = sc([[0, -500], [350, -1000], [850, -1000], [1200, -600], [1150, -50], [650, 550], [0, 1050], [-650, 550], [-1150, -50], [-1200, -600], [-850, -1000], [-350, -1000]], 1.2);
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
  TRACKS_EASY.push(
    T3('meadow', '구름 언덕', '🏞️', '3D · 둥근 사각', '오르락내리락 언덕길', [[-1250, -520], [-500, -820], [500, -820], [1250, -420], [1250, 420], [500, 820], [-500, 820], [-1250, 520]], 170, 0.0, { boost: 4, slow: 2, ice: 0, jump: 2 }, 70, [[2, 55, 0], [3, 22, 1.2]]),
    T3('desert', '모래 언덕', '🏜️', '3D · 세 갈래', '파도치는 모래 언덕', polar(1250, 3, 0.2, 36), 170, 0.05, { boost: 5, slow: 3, ice: 0, jump: 2 }, 80, [[3, 65, 0.5], [1, 25, 2]]),
    T3('candy', '놀이공원 고가', '🎡', '3D · 8자 다리', '위로 넘는 다리가 있어요!', lemn(1300, 850, 20), 170, 0.14, { boost: 5, slow: 2, ice: 0, jump: 1 }, 60, [[1, 60, -Math.PI / 2]]),
    T3('snow', '눈 롤러코스터', '⛄', '3D · ㄴ자 언덕', '눈 덮인 롤러코스터', [[-1250, -900], [150, -900], [150, 0], [1300, 0], [1300, 900], [-1250, 900]], 170, 0.02, { boost: 3, slow: 2, ice: 5, jump: 2 }, 80, [[2, 60, 0], [5, 20, 0.7]]),
    T3('beach', '해변 고갯길', '🏖️', '3D · 고래 모양', '꼬리가 달린 해변 언덕길', [[-1300, -200], [-900, -650], [-100, -800], [700, -600], [1300, -150], [1450, 350], [900, 650], [200, 500], [-300, 800], [-1000, 650]], 170, 0.0, { boost: 4, slow: 5, ice: 0, jump: 2 }, 70, [[2, 55, 0.4], [3, 22, 1.5]]),
    T3('city', '도시 고가', '🌃', '3D · 십자 모양', '네거리를 도는 고가도로', [[-420, -1150], [420, -1150], [420, -420], [1150, -420], [1150, 420], [420, 420], [420, 1150], [-420, 1150], [-420, 420], [-1150, 420], [-1150, -420], [-420, -420]], 170, 0.0, { boost: 7, slow: 2, ice: 0, jump: 2 }, 75, [[2, 60, 0], [4, 20, 0.9]]),
    T3('lava', '화산 고갯길', '🌋', '3D · 반달 모양', '화산 가장자리 반달길', sc(crescent(), 1.4), 170, 0.1, { boost: 4, slow: 5, ice: 0, jump: 2 }, 80, [[1, 50, 0.5], [3, 30, 1.7]]),
    T3('space', '우주 활주로', '🪐', '3D · 물방울', '별빛 속 물방울 길', sc([[0, -1150], [420, -520], [880, -100], [940, 380], [620, 830], [0, 980], [-620, 830], [-940, 380], [-880, -100], [-420, -520]], 1.2), 170, 0.0, { boost: 5, slow: 0, ice: 4, jump: 2 }, 75, [[2, 55, 1.0], [5, 18, 0]]),
  );
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
  TRACKS_EASY.push(
    T('meadow', '꽃 동산', '🌸', '삼각 모양', '세 모퉁이를 돌아요', sc([[-1300, 900], [0, -1000], [1300, 900]], 1.15), 170, 0.0, { boost: 5, slow: 3, ice: 0 }),
    T('candy', '나비 정원', '🦋', '나비 모양', '날개 모양을 따라 달려요', BUTTERFLY, 170, 0.0, { boost: 5, slow: 4, ice: 0 }),
    T3('desert', '병아리 언덕', '🐣', '3D · 달걀 모양', '달걀처럼 둥근 언덕길', egg(28), 170, 0.0, { boost: 4, slow: 3, ice: 0, jump: 2 }, 75, [[2, 55, 0.3], [3, 20, 1.1]]),
    T3('candy', '하트 고개', '💖', '3D · 하트 모양', '사랑스러운 하트 언덕', HEART, 170, 0.0, { boost: 5, slow: 2, ice: 0, jump: 2 }, 70, [[2, 55, 0], [4, 20, 0.8]]),
  );
  TRACKS_EASY.push(
    T('snow', '얼음 모퉁이', '🧊', 'ㄱ자 모양', '시원하게 쭉 달리다 꺾어요', GAMMA, 170, 0.0, { boost: 4, slow: 2, ice: 5 }),
    T('beach', '구름 호수', '☁️', '구름 모양', '둥실둥실 호수 둘레길', cloud(40), 170, 0.0, { boost: 5, slow: 5, ice: 0 }),
    T3('space', '별빛 언덕', '🌟', '3D · 별 모양', '반짝이는 별빛 언덕', polar(1250, 5, 0.15, 40), 170, 0.0, { boost: 5, slow: 1, ice: 3, jump: 2 }, 75, [[2, 55, 0.2], [5, 20, 1]]),
    T3('meadow', '콩밭 고개', '🫘', '3D · 콩 모양', '콩 모양 언덕길', TRACKS_EASY[0].poly, 170, 0.06, { boost: 4, slow: 3, ice: 0, jump: 2 }, 70, [[2, 55, 0.6], [3, 22, 0]]),
  );
  TRACKS_HARD.push(
    T3('lava', '용암 롤러코스터', '🌋', '3D · 급경사', '가파른 오르막과 점프대', [[-1300, -900], [1300, -900], [1300, -300], [-750, -300], [-750, 300], [1300, 300], [1300, 900], [-1300, 900]], 130, 0.02, { boost: 5, slow: 7, ice: 0, jump: 4 }, 110, [[2, 100, 0], [4, 38, 1]]),
    T3('city', '밤의 고가 8자', '🌃', '3D · 8자 다리', '위아래로 얽힌 고가도로', lemn(1500, 950, 30, 120), 130, 0.14, { boost: 8, slow: 2, ice: 0, jump: 2 }, 80, [[1, 80, -Math.PI / 2], [3, 20, 0.4]]),
    T3('space', '우주 매듭 다리', '🪐', '3D · 매듭 다리', '세 번 만나는 곳이 모두 다리!', trefoil(430, 36), 130, 0.1, { boost: 6, slow: 0, ice: 5, jump: 3 }, 115, [[3, 77, 0.32], [3, 32, 0.6]]),
    T3('meadow', '초원 산등성이', '🌳', '3D · W자', '뾰족뾰족 W자 산등성이', sc([[-1500, -850], [-1100, 850], [-550, -250], [0, 850], [550, -250], [1100, 850], [1500, -850], [0, -1050]], 1.12), 130, 0.0, { boost: 5, slow: 4, ice: 0, jump: 3 }, 100, [[2, 80, 0], [5, 25, 0.4]]),
    T3('desert', '협곡 고리', '🌵', '3D · 고리 다리', '안쪽 고리가 다리로 얽혀요', limacon(700, 64), 130, 0.0, { boost: 7, slow: 4, ice: 0, jump: 3 }, 112, [[2, 75, 3.35], [3, 34, 0.08]]),
    T3('snow', '눈꽃 정상', '⛄', '3D · 6각 눈꽃', '여섯 갈래 눈꽃 언덕', polar(1300, 6, 0.2, 48), 130, 0.0, { boost: 4, slow: 3, ice: 8, jump: 3 }, 95, [[3, 60, 0.2], [6, 35, 1.1]]),
    T3('candy', '톱니바퀴 언덕', '🍭', '3D · 톱니바퀴', '톱니처럼 꼬불꼬불', polar(1400, 9, 0.1, 72), 130, 0.0, { boost: 5, slow: 7, ice: 0, jump: 3 }, 90, [[3, 55, 0], [9, 15, 0.7]]),
    T3('beach', '파도 절벽', '🏖️', '3D · 파도 언덕', '출렁이는 파도 위 점프', [[-1700, 0], [-1350, -380], [-950, -130], [-550, -440], [-150, -130], [250, -440], [650, -130], [1100, -380], [1700, 0], [1100, 380], [650, 130], [250, 440], [-150, 130], [-550, 440], [-950, 130], [-1350, 380]], 130, 0.03, { boost: 4, slow: 6, ice: 0, jump: 4 }, 95, [[3, 70, 0], [7, 12, 1.1]]),
  );

  TRACKS_HARD.push(
    T('beach', '물고기 서킷', '🐟', '물고기 서킷', '꼬리가 뾰족한 물고기 길', FISH, 130, 0.0, { boost: 7, slow: 3, ice: 0 }),
    T('snow', 'H자 서킷', '🧊', 'H자 서킷', '가운데 다리가 있는 H자 길', H_SHAPE, 130, 0.0, { boost: 4, slow: 3, ice: 7 }),
    T3('space', '별 능선', '⭐', '3D · 별 능선', '다섯 모퉁이 별빛 능선', polar(1300, 5, 0.28, 60), 130, 0.0, { boost: 6, slow: 3, ice: 4, jump: 3 }, 105, [[2, 75, 0], [5, 24, 0.6]]),
    T3('snow', '지붕 능선', '🏠', '3D · 집 모양', '눈 마을 지붕 위 능선길', HOUSE, 130, 0.0, { boost: 4, slow: 3, ice: 6, jump: 3 }, 90, [[2, 65, 0.5], [4, 25, 1.2]]),
  );
  TRACKS_HARD.push(
    T('lava', 'E자 서킷', '🔥', 'E자 서킷', '두 번 파고드는 E자 길', E_SHAPE, 130, 0.0, { boost: 5, slow: 8, ice: 0 }),
    T('candy', 'S자 서킷', '🍭', 'S자 서킷', '뱀처럼 꿈틀대는 S자 길', S_SHAPE, 130, 0.0, { boost: 6, slow: 6, ice: 0 }),
    T3('city', '나비 능선', '🦋', '3D · 나비 능선', '날개를 따라 넘는 고갯길', BUTTERFLY, 130, 0.0, { boost: 7, slow: 3, ice: 0, jump: 3 }, 100, [[2, 70, 0.4], [4, 26, 1]]),
    T3('candy', '네잎 능선', '🍀', '3D · 네잎 클로버', '네 번 크게 돌아 넘어요', polar(1350, 4, 0.32, 56), 130, 0.0, { boost: 5, slow: 6, ice: 0, jump: 3 }, 100, [[2, 70, 0], [4, 28, 0.7]]),
  );

  // 🚀 우주 코스: 행성마다 중력이 달라서 점프가 달라지고, 먼지·모래·서리 구간이 있다(옵션: 후반 날씨, 바퀴 고르기·피트)
  const SPACE_PTS = {
    moon: { p: [[0, 0], [70, 0], [135, 8], [178, 42], [184, 92], [158, 126], [112, 128], [78, 148], [82, 196], [126, 218], [168, 252], [156, 296], [104, 314], [44, 300], [-6, 262], [-48, 214], [-66, 158], [-92, 104], [-86, 46], [-52, 8]], h: [0, 0, 1, 4, 8, 11, 9, 5, 2, 0, 1, 5, 10, 14, 10, 5, 1, 0, 0, 0] },
    mars: { p: [[0, 0], [80, -4], [150, 10], [200, 50], [210, 110], [185, 165], [135, 192], [105, 235], [110, 285], [160, 318], [225, 312], [262, 262], [300, 205], [310, 140], [290, 80], [260, 20], [230, -40], [160, -80], [80, -80], [10, -85], [-45, -65], [-65, -30], [-40, -5]], h: [0, 0, 2, 6, 10, 14, 15, 11, 7, 3, 2, 6, 10, 12, 8, 4, 2, 0, 0, 0, 0, 0, 0] },
    europa: { p: [[0, 0], [76, 0], [144, 17], [187, 60], [196, 119], [170, 170], [119, 187], [76, 162], [60, 119], [26, 94], [-17, 119], [-34, 170], [-8, 221], [51, 246], [119, 255], [170, 280], [170, 332], [102, 348], [17, 332], [-60, 280], [-94, 204], [-102, 128], [-85, 60], [-51, 13]], h: [0, 0, 1, 3, 4, 3, 2, 2, 1, 0, 0, 1, 3, 4, 5, 4, 2, 1, 0, 0, 1, 0, 0, 0] },
  };
  const spacePts = (k, sx) => SPACE_PTS[k].p.map((q) => [q[0] * sx, q[1] * sx]), spaceH = (k, sy) => SPACE_PTS[k].h.map((v) => v * sy);
  const mkSpace = (w) => [
    Object.assign(T3('moon', '달 기지 서킷', '🌙', '3D · 달', '중력이 약해서 점프가 둥실 떠요', spacePts('moon', 7), w, 0.0, { boost: 5, slow: 0, ice: 0, jump: 2 }, 0, []),
      { mus: 'space', space: { g: 1.62, dust: [[0.29, 0.37], [0.69, 0.77]], zone: '먼지 구간', soft: '먼지용', ico: '🌙', place: '고요의 바다', storm: { label: '후반 태양풍', toast: '태양풍이 강해졌어요! 먼지가 떠올라 도로를 덮어요', chip: '태양풍 · 도로가 먼지로 덮였어요' } }, hctl: spaceH('moon', 10) }),
    Object.assign(T3('mars', '화성 협곡 서킷', '🔴', '3D · 화성', '붉은 모래 구간이 세 곳 있어요', spacePts('mars', 8), w, 0.0, { boost: 5, slow: 0, ice: 0, jump: 2 }, 0, []),
      { mus: 'desert', space: { g: 3.71, dust: [[0.2, 0.28], [0.52, 0.6], [0.8, 0.86]], zone: '모래 구간', soft: '모래용', ico: '🔴', place: '마리너스 협곡', storm: { label: '후반 모래 폭풍', toast: '모래 폭풍이 불어와요! 붉은 모래가 도로를 덮어요', chip: '모래 폭풍 · 도로가 모래로 덮였어요' } }, hctl: spaceH('mars', 9) }),
    Object.assign(T3('europa', '유로파 얼음 서킷', '🪐', '3D · 유로파', '서리 구간은 얼음처럼 미끄러워요', spacePts('europa', 7), w, 0.0, { boost: 5, slow: 0, ice: 0, jump: 2 }, 0, []),
      { mus: 'snow', space: { g: 1.31, dust: [[0.16, 0.24], [0.47, 0.55], [0.74, 0.8]], zone: '서리 구간', soft: '서리용', ico: '🪐', place: '목성의 위성', frost: true, storm: { label: '후반 얼음 분출', toast: '얼음 분출이 솟아올랐어요! 서리가 도로를 덮어요', chip: '얼음 분출 · 도로가 서리로 덮였어요' } }, hctl: spaceH('europa', 12) }),
  ];
  TRACKS_EASY.push(...mkSpace(170));
  TRACKS_HARD.push(...mkSpace(130));
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
    // 높이: 길 한 바퀴를 0~1(u)로 보고 곡선을 얹는다. 평면 경기장은 모두 0.
    const hoff = Math.floor((def.s0 || 0) * M), hgt = new Array(M);
    for (let j = 0; j < M; j++) { const u = ((j + hoff) % M) / M; let h = def.h0 || 0; for (const [k, A, ph] of (def.hills || [])) h += A * Math.sin(Math.PI * 2 * k * u + ph); hgt[j] = h; }
    if (def.hctl) { // 우주 코스: 꼭짓점마다 높이를 주고 부드럽게 잇는다(카트멀-롬)
      const H = def.hctl, N = H.length, g = (i) => H[((i % N) + N) % N];
      for (let j = 0; j < M; j++) { const t = (((j + hoff) % M) / M) * N, i = Math.floor(t), f = t - i, a = g(i - 1), b = g(i), c = g(i + 1), d = g(i + 2); hgt[j] = 0.5 * ((2 * b) + (-a + c) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (-a + 3 * b - 3 * c + d) * f * f * f); }
    }
    const dust = new Uint8Array(M); // 먼지·모래·서리 구간(한 바퀴 0~1 중 어디인지)
    if (def.space) for (let j = 0; j < M; j++) { const u = ((j + hoff) % M) / M; for (const [a, b] of def.space.dust) if (u >= a && u <= b) dust[j] = 1; }
    const slope = hgt.map((_, j) => (hgt[(j + 1) % M] - hgt[(j - 1 + M) % M]) / (2 * ds));
    const hw = def.w / 2, at = (j, lat) => { const c = pts[((j % M) + M) % M]; return { x: c.x + c.nx * lat, y: c.y + c.ny * lat, a: Math.atan2(c.ty, c.tx) }; };

    // 아이템 상자: 8곳에 3개씩
    const boxes = [];
    for (let g = 0; g < 8; g++) for (const f of [-0.5, 0, 0.5]) { const j = Math.floor((g + 0.5) / 8 * M), p = at(j, f * hw); boxes.push({ x: p.x, y: p.y, idx: j % M }); }
    // 함정 지대: 부스트 패드 / 느려지는 곳 / 얼음
    const RAD = { boost: 36, slow: 46, ice: 56, jump: 44 }, haz = [];
    for (const type of ['boost', 'slow', 'ice', 'jump']) {
      const n = def.haz[type] || 0;
      for (let i = 0; i < n; i++) {
        const t = ((i + 0.2 + rnd() * 0.6) / n) * 0.9 + 0.05; let j = Math.floor(t * M), lat = (rnd() * 1.2 - 0.6) * hw;
        if (type === 'jump' || (type === 'boost' && def.v3d)) { // 점프대·(3D의) 부스트 패드는 커브 직전에서 밖으로 밀려나지 않게 가장 곧은 구간(앞뒤 커브가 가장 작은 곳)에 놓는다
          const turn = (m) => { const A = pts[((m - 30) % M + M) % M], B = pts[(m + 30) % M]; return Math.abs(Math.atan2(A.tx * B.ty - A.ty * B.tx, A.tx * B.tx + A.ty * B.ty)); };
          let best = j, bv = 1e9; const span = Math.floor(M * 0.6 / n); for (let d = -span; d <= span; d += 2) { const m = (j + d + M) % M, v = turn(m); if (v < bv) { bv = v; best = m; } }
          j = best; lat = (rnd() * 0.5 - 0.25) * hw;
        }
        const p = at(j, lat); haz.push({ type, x: p.x, y: p.y, r: RAD[type], a: p.a, idx: j % M });
      }
    }
    // 길가 장식
    const decos = [], sub = pts.filter((_, i) => i % 3 === 0);
    for (let tries = 0; decos.length < 260 && tries < 2500; tries++) {
      const j = Math.floor(rnd() * M), side = rnd() < 0.5 ? -1 : 1, p = at(j, side * hw * (2.5 + rnd() * 2.4));
      let ok = true, bd = 1e18, bi = 0; for (let q = 0; q < sub.length; q++) { const c = sub[q], dx = c.x - p.x, dy = c.y - p.y, d2 = dx * dx + dy * dy; if (d2 < (hw * 2.3) * (hw * 2.3)) { ok = false; break; } if (d2 < bd) { bd = d2; bi = q * 3; } }
      if (ok) decos.push({ x: p.x, y: p.y, idx: bi % M, e: def.theme.deco[Math.floor(rnd() * def.theme.deco.length)], s: 44 + rnd() * 34 });
    }
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const p of pts) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
    return { def, M, ds, pts, hw, len: L, minR, relaxed, hgt, slope, dust, space: def.space || null, v3d: !!def.v3d, boxes, haz, decos, bounds: { x0, x1, y0, y1 } };
  }

  window.RaceData = { CHARS, CARS, TRACKS_EASY, TRACKS_HARD, buildTrack };
})();
