// 큐브 맞추기 — 화면과 상관없는 부분: 큐브 모델(스티커 54칸)·움직임·초보자 풀이.
//  cube.js(화면)와 연습실이 같은 모델을 쓴다. 외부 라이브러리 없음.
(function () {
  'use strict';

  // ───────── 모델 ─────────
  // 좌표는 화면(CSS)과 같다: x 오른쪽, y 아래, z 보는 사람 쪽.
  // 이 좌표에서는 "축 n 을 중심으로 +90도"가 그 면을 바깥에서 볼 때 시계 방향이다.
  const FACES = [
    { k: 'U', n: [0, -1, 0], color: '#ffd400', name: '노란' },
    { k: 'D', n: [0, 1, 0], color: '#ffffff', name: '하얀' },
    { k: 'F', n: [0, 0, 1], color: '#19b35a', name: '초록' },
    { k: 'B', n: [0, 0, -1], color: '#2f6fe4', name: '파란' },
    { k: 'R', n: [1, 0, 0], color: '#ff8a1e', name: '주황' },
    { k: 'L', n: [-1, 0, 0], color: '#e5332a', name: '빨간' },
  ];
  const KEYS = 'UDFBRL';
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  // 3×3 행렬(행 우선 9칸)
  const mul = (A, B) => { const C = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) C.push(A[r * 3] * B[c] + A[r * 3 + 1] * B[3 + c] + A[r * 3 + 2] * B[6 + c]); return C; };
  const ap = (M, v) => [M[0] * v[0] + M[1] * v[1] + M[2] * v[2], M[3] * v[0] + M[4] * v[1] + M[5] * v[2], M[6] * v[0] + M[7] * v[1] + M[8] * v[2]];
  const tr = (M) => [M[0], M[3], M[6], M[1], M[4], M[7], M[2], M[5], M[8]];
  const rotAxis = (n, a) => {
    const c = Math.cos(a), s = Math.sin(a), t = 1 - c, x = n[0], y = n[1], z = n[2];
    return [t * x * x + c, t * x * y - s * z, t * x * z + s * y, t * x * y + s * z, t * y * y + c, t * y * z - s * x, t * x * z - s * y, t * y * z + s * x, t * z * z + c];
  };

  // 스티커 자리 54개: 면마다 9개. 자리 번호 / 9 = 면 번호
  const FL = [], FI = {};
  FACES.forEach((F, f) => { for (const y of [-1, 0, 1]) for (const x of [-1, 0, 1]) for (const z of [-1, 0, 1]) { const p = [x, y, z]; if (dot(p, F.n) === 1) { FI[p + '|' + f] = FL.length; FL.push({ p, f }); } } });
  const faceOfN = (n) => FACES.findIndex((F) => F.n[0] === n[0] && F.n[1] === n[1] && F.n[2] === n[2]);
  // 면 f 를 시계 방향으로 한 번 돌렸을 때: 자리 i 의 스티커가 Q[f][i] 로 간다
  const Q = FACES.map((F) => {
    const R = rotAxis(F.n, Math.PI / 2).map(Math.round);
    return FL.map((s, i) => (dot(s.p, F.n) === 1 ? FI[ap(R, s.p).map((v) => v + 0) + '|' + faceOfN(ap(R, FACES[s.f].n))] : i));
  });
  // 움직임 번호 m = 면×3 + (1번·2번·3번 돌리기 − 1)
  const PERM = [];
  Q.forEach((q) => { const q2 = q.map((j) => q[j]), q3 = q2.map((j) => q[j]); PERM.push(q, q2, q3); });
  const solved = () => FL.map((_, i) => i);
  const applyM = (st, m) => { const p = PERM[m], ns = new Array(54); for (let i = 0; i < 54; i++) ns[p[i]] = st[i]; return ns; };
  const isSolved = (st) => st.every((v, i) => ((v / 9) | 0) === ((i / 9) | 0));

  const parse = (s) => s.split(' ').map((t) => KEYS.indexOf(t[0]) * 3 + (t[1] === "'" ? 2 : t[1] === '2' ? 1 : 0));
  const YMAP = { F: 'R', R: 'B', B: 'L', L: 'F' };
  const yrot = (s, k) => { for (; k > 0; k--) s = s.replace(/[FRBL]/g, (c) => YMAP[c]); return s; };
  const macro = (s) => { const moves = parse(s), perm = FL.map((_, i) => moves.reduce((l, m) => PERM[m][l], i)); return { perm, moves }; };
  // 면 a 에 붙은 스티커 자리(가장자리·모서리 조각은 나머지 면 이름도 준다)
  const fl = (...ks) => { const fs = ks.map((k) => KEYS.indexOf(k)), p = [0, 0, 0]; fs.forEach((f) => FACES[f].n.forEach((v, i) => { p[i] += v; })); return FI[p + '|' + fs[0]]; };

  // 따라가는 스티커 몇 개의 자리만 가지고 너비 우선 탐색 → 가장 짧은 방법
  function bfs(start, macros, goal) {
    const key = (a) => a.reduce((k, l) => k * 54 + l, 0);
    if (goal(start)) return [];
    const seen = new Map([[key(start), null]]);
    let frontier = [start];
    while (frontier.length) {
      const next = [];
      for (const s of frontier) for (let i = 0; i < macros.length; i++) {
        const p = macros[i].perm, t = s.map((l) => p[l]), k = key(t);
        if (seen.has(k)) continue;
        seen.set(k, [s, i]);
        if (goal(t)) { const out = []; let c = t; for (;;) { const e = seen.get(key(c)); if (!e) break; out.unshift(...macros[e[1]].moves); c = e[0]; } return out; }
        next.push(t);
      }
      frontier = next;
    }
    return null;
  }

  // 한 칸 돌리기({f, d: +1 시계 / −1 반시계}) 목록으로 풀고, 이어진 같은 면은 합친다
  const toQuarters = (moves) => {
    const out = [];
    for (const m of moves) { const f = (m / 3) | 0, t = m % 3; if (t === 2) out.push({ f, d: -1 }); else for (let i = 0; i <= t; i++) out.push({ f, d: 1 }); }
    const st = [];
    for (const q of out) {
      st.push(q);
      let n = 0, sum = 0; while (n < st.length && st[st.length - 1 - n].f === q.f) { sum += st[st.length - 1 - n].d; n++; }
      st.length -= n; sum = ((sum % 4) + 4) % 4;
      if (sum === 1) st.push({ f: q.f, d: 1 }); else if (sum === 3) st.push({ f: q.f, d: -1 }); else if (sum === 2) st.push({ f: q.f, d: 1 }, { f: q.f, d: 1 });
    }
    return st;
  };
  const qm = (q) => q.f * 3 + (q.d > 0 ? 0 : 2);

  const UM = ['U', "U'", 'U2'].map(macro);
  const ALL = PERM.map((p, m) => ({ perm: p, moves: [m] }));
  const SLOT = [0, 1, 2, 3].map((k) => ({
    corner: fl('D', 'RBLF'[k], 'FRBL'[k]), edge: fl('RBLF'[k], 'FRBL'[k]),
    cm: ["R U R' U'"].map((s) => macro(yrot(s, k))),
    em: ["U R U' R' U' F' U F", "U' F' U F U R U' R'"].map((s) => macro(yrot(s, k))),
  }));
  const UE = [fl('U', 'F'), fl('U', 'R'), fl('U', 'B'), fl('U', 'L')];
  const UC = [fl('U', 'F', 'R'), fl('U', 'R', 'B'), fl('U', 'B', 'L'), fl('U', 'L', 'F')];
  const onU = (a) => a.every((l) => l < 9);
  const STAGES = [
    { id: 'cross', up: 1, name: '하얀 십자가 만들기', say: '하얀 면에 십자가 모양을 만들어요.' },
    { id: 'corner', up: 0, name: '하얀 모서리 채우기', say: '큐브를 뒤집어요! 하얀 모서리 조각을 아래층에 넣어요.' },
    { id: 'middle', up: 0, name: '가운데 줄 맞추기', say: '가운데 줄에 조각을 넣어요.' },
    { id: 'ycross', up: 0, name: '노란 십자가 만들기', say: '위쪽 노란 면에 십자가 모양을 만들어요.' },
    { id: 'yface', up: 0, name: '노란 면 다 채우기', say: '노란 면을 모두 노랗게 만들어요.' },
    { id: 'ycorner', up: 0, name: '노란 모서리 자리 찾기', say: '노란 모서리 조각을 제자리로 보내요.' },
    { id: 'last', up: 0, name: '마지막 조각 맞추기', say: '거의 다 됐어요! 마지막 조각을 맞춰요.' },
  ];

  // 초보자 방법(한 층씩)으로 푸는 길을 단계별로 돌려준다: [{ ...STAGES[i], moves: [{f,d}] }]
  function solve(st0) {
    let st = st0.slice();
    const res = [];
    const step = (si, tracked, macros, goal) => {
      const mv = bfs(tracked.map((id) => st.indexOf(id)), macros, goal || ((a) => a.every((l, i) => l === tracked[i])));
      if (!mv) throw new Error('cube: no path at ' + STAGES[si].id);
      for (const m of mv) st = applyM(st, m);
      res[si] = (res[si] || []).concat(mv);
    };
    step(0, [fl('D', 'F'), fl('D', 'R'), fl('D', 'B'), fl('D', 'L')], ALL);
    for (let k = 0; k < 4; k++) step(1, [SLOT[k].corner], UM.concat(...SLOT.slice(k).map((s) => s.cm)));
    for (let k = 0; k < 4; k++) step(2, [SLOT[k].edge], UM.concat(...SLOT.slice(k).map((s) => s.em)));
    step(3, UE, UM.concat(macro("F R U R' U' F'")), onU);
    step(4, UC, UM.concat(macro("R U R' U R U2 R'")), onU);
    step(5, UC, UM.concat(macro("R' F R' B2 R F' R' B2 R2")));
    step(6, UE.concat(UC), UM.concat(macro("R U' R U R U R U' R' U' R2")));
    return STAGES.map((S, i) => Object.assign({}, S, { moves: toQuarters(res[i] || []) }));
  }



  // 아이가 배우는 공식 8개. 풀이(solve)가 쓰는 공식과 같다. up=연습할 때 위로 둘 면(0=노란 면)
  const FORMULAS = [
    { id: 'f0', name: '시작 공식', icon: '🚪', f: "R U R'", say: '오른쪽, 위, 오른쪽 되돌리기. 가장 짧은 공식이에요.', why: '조각을 위층으로 꺼낼 때 써요.' },
    { id: 'f1', name: '꼬마 춤', icon: '💃', f: "R U R' U'", say: '꼬마 춤! 하얀 모서리를 제자리에 넣을 때 써요.', why: '하얀 모서리를 넣어요. 안 맞으면 한 번 더 해요!' },
    { id: 'f2', name: '가운데 줄 오른쪽', icon: '➡️', f: "U R U' R' U' F' U F", say: '위층 조각을 가운데 줄 오른쪽에 넣어요.', why: '가운데 줄 조각을 오른쪽으로 넣어요.' },
    { id: 'f3', name: '가운데 줄 왼쪽', icon: '⬅️', f: "U' L' U L U F U' F'", say: '위층 조각을 가운데 줄 왼쪽에 넣어요.', why: '가운데 줄 조각을 왼쪽으로 넣어요.' },
    { id: 'f4', name: '노란 십자가', icon: '➕', f: "F R U R' U' F'", say: '노란 십자가를 만들어요.', why: '위쪽에 노란 십자가를 만들어요.' },
    { id: 'f5', name: '노란 면 채우기', icon: '☀️', f: "R U R' U R U2 R'", say: '노란 면을 모두 노랗게 채워요.', why: '노란 모서리를 위로 돌려 노란 면을 채워요.' },
    { id: 'f6', name: '모서리 자리 찾기', icon: '🔄', f: "R' F R' B2 R F' R' B2 R2", say: '모서리 세 개의 자리를 바꿔요.', why: '노란 모서리를 제자리로 보내요.' },
    { id: 'f7', name: '마지막 가장자리', icon: '🏁', f: "R U' R U R U R U' R' U' R2", say: '마지막 가장자리 세 개의 자리를 바꿔요.', why: '마지막 가장자리 조각을 제자리로 보내요.' },
  ];

  G.cubeCore = { FORMULAS, FACES, FL, FI, dot, mul, ap, tr, rotAxis, PERM, solved, applyM, isSolved, solve, toQuarters, qm, parse, macro, yrot, bfs };
})();
