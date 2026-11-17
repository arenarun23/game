// 큐브 맞추기 (3×3×3, 3D 입체)
//  손가락으로 끌면 큐브가 360도 돌고, 색깔 면을 누르면 그 면이 돈다.
//  섞은 뒤 "알려 줘!"를 누르면 맞추는 법을 한 번에 한 칸씩, 7단계로 따라 하게 해 준다.
//  "내가 할래!"는 어느 면을 어느 쪽으로 돌릴지만 알려 주고, 아이가 직접 돌리면 맞았는지(⭕) 틀렸는지(❌) 확인해 준다.
//  그림은 CSS 3D 로 직접 그린다(외부 라이브러리·에셋 없음).
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
    cm: ["R U R'", "R U' R'", "R U2 R'", "F' U' F", "F' U F", "F' U2 F"].map((s) => macro(yrot(s, k))),
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

  G.cubeCore = { FACES, solved, applyM, isSolved, solve, toQuarters, qm, parse };   // 시험용

  // ───────── 화면 ─────────
  const TILT = mul(rotAxis([1, 0, 0], -0.44), rotAxis([0, 1, 0], -0.6));           // 위·앞·오른쪽 세 면이 보이는 기울기
  const ORI = (() => {                                                             // 큐브를 반듯하게 놓는 24가지 방향
    const key = (M) => M.map(Math.round).join(), gens = [rotAxis([1, 0, 0], Math.PI / 2), rotAxis([0, 1, 0], Math.PI / 2)];
    const list = [[1, 0, 0, 0, 1, 0, 0, 0, 1]], seen = new Set([key(list[0])]);
    for (let i = 0; i < list.length; i++) for (const g of gens) { const M = mul(g, list[i]).map(Math.round); if (!seen.has(key(M))) { seen.add(key(M)); list.push(M); } }
    return list;
  })();
  const FT = ['rotateX(90deg)', 'rotateX(-90deg)', '', 'rotateY(180deg)', 'rotateY(90deg)', 'rotateY(-90deg)'];
  // 회전 행렬 → 축과 각
  const axisAngle = (R) => {
    const a = Math.acos(Math.max(-1, Math.min(1, (R[0] + R[4] + R[8] - 1) / 2)));
    if (a < 1e-4) return { n: [0, 1, 0], a: 0 };
    if (Math.PI - a < 1e-3) {
      const x = Math.sqrt(Math.max(0, (R[0] + 1) / 2)), y = Math.sqrt(Math.max(0, (R[4] + 1) / 2)), z = Math.sqrt(Math.max(0, (R[8] + 1) / 2));
      const n = x >= y && x >= z ? [x, (R[1] + R[3]) / (4 * x), (R[2] + R[6]) / (4 * x)] : y >= z ? [(R[1] + R[3]) / (4 * y), y, (R[5] + R[7]) / (4 * y)] : [(R[2] + R[6]) / (4 * z), (R[5] + R[7]) / (4 * z), z];
      return { n, a };
    }
    const s = 2 * Math.sin(a);
    return { n: [(R[7] - R[5]) / s, (R[2] - R[6]) / s, (R[3] - R[1]) / s], a };
  };
  const arrowSvg = (() => {
    const r = 30, a0 = -150 * Math.PI / 180, a1 = 110 * Math.PI / 180, P = (a, k) => [(k || r) * Math.cos(a), (k || r) * Math.sin(a)];
    const s = P(a0), e = P(a1), t = [-Math.sin(a1), Math.cos(a1)], tip = [e[0] + 17 * t[0], e[1] + 17 * t[1]], b1 = P(a1, r + 13), b2 = P(a1, r - 13), f = (p) => p.map((v) => v.toFixed(1)).join(' ');
    const arc = `M${f(s)} A${r} ${r} 0 1 1 ${f(e)}`, head = `M${f(b1)} L${f(tip)} L${f(b2)} Z`;
    return `<svg viewBox="-50 -50 100 100" aria-hidden="true"><path d="${arc}" fill="none" stroke="#222" stroke-width="15" stroke-linecap="round"/><path d="${head}" fill="#222" stroke="#222" stroke-width="7" stroke-linejoin="round"/><path d="${arc}" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round"/><path d="${head}" fill="#fff"/></svg>`;
  })();

  G.register({
    id: 'cube', name: '큐브 맞추기', desc: '빙글빙글 3D 큐브', icon: '🧊', cat: 'play', color: 'sky',
    noSub: true,                                                   // 공통 난이도 막대 대신 자기 버튼을 쓴다
    start(root) {
      const h = G.h, calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
      let st = solved(), M = mul(TILT, rotAxis([0, 0, 1], Math.PI)), S = 40;   // 처음엔 하얀 면이 위
      let busy = false, dead = false, dir = 1, hist = [], mixed = false, guide = null, auto = false, raf = 0, autoT = 0;

      // 큐브 그리기: 작은 조각 27개 × 면 6개(안쪽 면은 까맣게), 바깥 면에만 색 스티커
      const cubeEl = h('div', { class: 'cbcube' }), stickers = new Array(54), cubies = [];
      for (const y of [-1, 0, 1]) for (const x of [-1, 0, 1]) for (const z of [-1, 0, 1]) {
        const p = [x, y, z], el = h('div', { class: 'cbc' });
        FACES.forEach((F, f) => {
          const face = h('div', { class: 'cbf' }); face.style.transform = FT[f] + ' translateZ(calc(var(--s) / 2))';
          const i = FI[p + '|' + f];
          if (i != null) { face.dataset.f = f; stickers[i] = h('i', { class: p.filter((v) => v === 0).length === 2 ? 'ctr' : null }); face.append(stickers[i]); }
          el.append(face);
        });
        cubies.push({ p, el }); cubeEl.append(el);
      }
      const arrow = h('div', { class: 'cbarrow', hidden: true }); arrow.innerHTML = '<div class="spin">' + arrowSvg + '</div>';
      cubeEl.append(arrow);
      const place = (c, extra) => { c.el.style.transform = (extra || '') + `translate3d(${c.p[0] * S}px,${c.p[1] * S}px,${c.p[2] * S}px)`; };
      // 돌릴 면(q)의 스티커는 그대로, 같은 층의 옆 면 스티커는 d1(조금 흐리게), 나머지는 d2(많이 흐리게)
      const setDim = (q) => stickers.forEach((el, i) => { const n = q && FACES[q.f].n, on = q && ((i / 9) | 0) !== q.f; el.classList.toggle('d1', !!(on && dot(FL[i].p, n) === 1)); el.classList.toggle('d2', !!(q && ((i / 9) | 0) !== q.f && dot(FL[i].p, n) !== 1)); });
      const paint = () => { for (let i = 0; i < 54; i++) stickers[i].style.background = FACES[(st[i] / 9) | 0].color; };
      const setView = () => { cubeEl.style.transform = `matrix3d(${M[0]},${M[3]},${M[6]},0,${M[1]},${M[4]},${M[7]},0,${M[2]},${M[5]},${M[8]},0,0,0,0,1)`; };

      const scoreEl = h('div', { class: 'cbscore', hidden: true }), markEl = h('div', { class: 'cbmark', hidden: true });
      const view = h('div', { class: 'cbview' }, cubeEl, scoreEl, markEl);
      let markT = 0;
      const mark = (ok) => { clearTimeout(markT); markEl.textContent = ok ? '⭕' : '❌'; markEl.hidden = true; void markEl.offsetWidth; markEl.hidden = false; markT = setTimeout(() => { markEl.hidden = true; }, ok ? 450 : 900); };
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const steps = h('div', { class: 'cbsteps' }), title = h('div', { class: 'cbtitle' }), msg = h('div', { class: 'cbmsg' });
      const info = h('div', { class: 'cbinfo' }, steps, title, msg), ctl = h('div', { class: 'cbctl' });
      root.classList.add('cb'); root.append(info, view, ctl);
      document.documentElement.dataset.game = 'cube';   // 좁은 화면에서 제목이 두 줄이 되지 않게

      // 큐브 크기: 가만히 있을 때 칸의 88% 안팎(조각 한 변 S 기준 가로 4.4S·세로 4.55S). 돌리다가 모서리가 아주 조금 넘으면 칸 밖은 잘린다
      const fit = () => { const r = view.getBoundingClientRect(); S = Math.max(18, Math.min((r.width || 300) / 5.0, (r.height || 300) / 5.1)); cubeEl.style.setProperty('--s', S + 'px'); view.style.perspective = S * 13 + 'px'; cubies.forEach((c) => place(c)); };
      const ro = 'ResizeObserver' in window ? new ResizeObserver(fit) : null; if (ro) ro.observe(view); else addEventListener('resize', fit);

      const ease = (t) => t * t * (3 - 2 * t);
      const tween = (ms, fn) => new Promise((done) => {
        if (calm || ms <= 0) { fn(1); done(); return; }
        const t0 = performance.now(), tick = (now) => { if (dead) return; const t = Math.min(1, (now - t0) / ms); fn(ease(t)); if (t < 1) raf = requestAnimationFrame(tick); else done(); };
        raf = requestAnimationFrame(tick);
      });
      // 면 하나를 돌린다(그림 → 끝나면 상태를 바꾸고 다시 칠한다)
      const turn = (q, ms) => {
        const n = FACES[q.f].n, layer = cubies.filter((c) => dot(c.p, n) === 1);
        return tween(ms, (t) => layer.forEach((c) => place(c, `rotate3d(${n[0]},${n[1]},${n[2]},${q.d * 90 * t}deg) `))).then(() => {
          st = applyM(st, qm(q)); layer.forEach((c) => place(c)); paint();
        });
      };
      // 큐브 전체를 M1 방향으로 부드럽게 돌린다
      const viewTo = (M1, ms) => {
        const M0 = M, aa = axisAngle(mul(M1, tr(M0)));
        if (aa.a < 0.02) return Promise.resolve();
        return tween(ms == null ? 250 + aa.a * 180 : ms, (t) => { M = t >= 1 ? M1 : mul(rotAxis(aa.n, aa.a * t), M0); setView(); });
      };
      // 면 f 가 잘 보이는(그리고 up 면이 위로 오는) 가장 가까운 반듯한 방향
      const poseFor = (f, upF) => {
        let best = null, bs = -1e9;
        for (const Qm of ORI) {
          const C = mul(TILT, Qm);
          if (f != null && ap(C, FACES[f].n)[2] < 0.3) continue;
          const T2 = mul(tr(M), C), sc = T2[0] + T2[4] + T2[8] + (ap(C, FACES[upF].n)[1] < -0.5 ? 1.6 : 0);
          if (sc > bs) { bs = sc; best = C; }
        }
        return best;
      };

      // ───── 자유롭게 돌리기 ─────
      const say = (t, s) => { title.textContent = t; msg.replaceChildren(...[].concat(s)); };
      const chip = (f) => { const m = h('span', { class: 'cbmini', 'aria-hidden': 'true' }); for (let i = 0; i < 9; i++) m.append(h('i', i === 4 ? { style: 'background:' + FACES[f].color } : null)); return m; };
      const nameOf = (f) => '가운데가 ' + FACES[f].name + ' 면';
      const btn = (label, fn, cls) => h('button', { class: 'mode ' + (cls || ''), onclick: fn }, label);
      const pushHist = (q) => { hist = toQuarters(hist.map(qm).concat(qm(q))); };
      const freeUi = () => {
        guide = null; auto = false; clearTimeout(autoT);
        setDim(null); arrow.hidden = true; steps.replaceChildren(); scoreEl.hidden = true;
        if (isSolved(st)) say('큐브를 돌려 보세요!', '손가락으로 끌면 큐브가 빙글 돌아요. 색깔 면을 콕 누르면 그 면이 돌아요.');
        else say('큐브가 섞였어요!', '🎓 알려 줘! 는 하나씩 보여 줘요. ✋ 내가 할래! 는 내가 돌리면 맞았는지 알려 줘요.');
        const dirBtn = btn(dir > 0 ? '↻ 오른쪽으로' : '↺ 왼쪽으로', () => { G.sfx.tap(); dir = -dir; dirBtn.textContent = dir > 0 ? '↻ 오른쪽으로' : '↺ 왼쪽으로'; });
        ctl.replaceChildren(
          btn('🐣 살짝 섞기', () => shuffle(3)), btn('🌀 많이 섞기', () => shuffle(20)), dirBtn,
          btn('🎓 알려 줘!', () => startGuide(false), 'go'), btn('✋ 내가 할래!', () => startGuide(true), 'self'), btn('✨ 처음으로', reset));
      };
      const reset = () => { if (busy) return; G.sfx.tap(); st = solved(); hist = []; mixed = false; paint(); freeUi(); viewTo(poseFor(null, 1)); };
      const shuffle = async (n) => {
        if (busy) return; busy = true; G.sfx.tap();
        let last = -1;
        for (let i = 0; i < n && !dead; i++) {
          let f; do f = (Math.random() * 6) | 0; while (f === last || (f ^ 1) === last);
          last = f; const q = { f, d: Math.random() < 0.5 ? 1 : -1 };
          await turn(q, n > 5 ? 90 : 260); pushHist(q); G.sfx.flip();
        }
        mixed = true; busy = false; if (!dead) freeUi();
      };
      const freeTurn = async (f) => {
        if (busy) return; busy = true; G.sfx.flip();
        const q = { f, d: dir }; await turn(q, 240); pushHist(q); busy = false;
        if (dead) return;
        if (isSolved(st) && mixed) { mixed = false; hist = []; freeUi(); G.win({ stars: 3, text: '혼자서 큐브를 맞췄어요! 🧊', bonus: 0 }); } else if (!guide) freeUi();
      };

      // ───── 맞추는 법 따라 하기 ─────
      const startGuide = (self) => {
        if (busy) return; G.sfx.tap();
        if (isSolved(st)) { say('먼저 큐브를 섞어 보세요!', '🐣 살짝 섞기 나 🌀 많이 섞기 를 눌러요.'); G.speak('먼저 큐브를 섞어 보세요'); return; }
        let stages;
        if (hist.length && hist.length <= 6) stages = [{ id: 'back', up: 1, name: '거꾸로 돌려서 맞추기', say: '섞은 것을 거꾸로 돌리면 다시 맞춰져요.', moves: hist.slice().reverse().map((q) => ({ f: q.f, d: -q.d })) }];
        else { try { stages = solve(st).filter((s) => s.moves.length); } catch (e) { say('앗, 다시 해 볼까요?', '✨ 처음으로 를 누르고 다시 섞어 주세요.'); return; } }
        guide = { stages, si: 0, mi: 0, easy: stages[0].id === 'back', intro: true, self, ok: 0, bad: 0, miss: 0, hint: false, total: stages.reduce((n, s) => n + s.moves.length, 0) };
        window.aieduLog && aieduLog('use', self ? 'cube-self' : guide.easy ? 'cube-back' : 'cube-guide');
        if (self) selfCtl(); else ctl.replaceChildren(
          btn('↩ 뒤로', back), btn('👉 돌리기', () => doStep(false), 'go big'),
          (guide.autoBtn = btn('▶ 자동', toggleAuto)), btn('✖ 그만', () => { if (busy) return; G.sfx.tap(); freeUi(); }));
        showStep();
      };
      // ✋ 내가 할래!: 방향(왼쪽/오른쪽)을 고르고 면을 누르면 맞았는지 확인해 준다
      const selfCtl = () => {
        const g = guide; dir = 1;
        const set = () => { L.setAttribute('aria-pressed', String(dir < 0)); R.setAttribute('aria-pressed', String(dir > 0)); };
        const L = btn('↺ 왼쪽', () => { G.sfx.tap(); dir = -1; set(); }, 'big dirb'), R = btn('↻ 오른쪽', () => { G.sfx.tap(); dir = 1; set(); }, 'big dirb');
        set();
        ctl.replaceChildren(L, R,
          btn('💡 힌트', () => { if (busy || guide !== g) return; G.sfx.tap(); g.hint = true; showStep(); }),
          btn('✖ 그만', () => { if (busy) return; G.sfx.tap(); freeUi(); }));
      };
      const tryMove = async (f) => {
        const g = guide; if (!g || !g.self || busy) return;
        const q = g.stages[g.si].moves[g.mi];
        if (f === q.f && dir === q.d) { if (!g.miss && !g.hint) g.ok++; g.miss = 0; g.hint = false; mark(true); doStep(false); return; }
        busy = true; arrow.hidden = true; G.sfx.flip();
        await turn({ f, d: dir }, 220); if (dead) return;
        G.sfx.bad(); mark(false); g.bad++; g.miss++;
        scoreEl.textContent = '⭕ ' + g.ok + '   ❌ ' + g.bad;
        msg.replaceChildren(f !== q.f ? '앗, 그건 ' + nameOf(f) + '이에요! ' + nameOf(q.f) + '을 찾아요.' : '앗, 방향이 반대예요! 다시 돌려 놓을게요.');
        await wait(700); if (dead) return;
        await turn({ f, d: -dir }, 220); busy = false;
        if (dead || guide !== g) return;
        if (g.miss >= 2) g.hint = true;                              // 두 번 틀리면 화살표로 알려 준다
        showStep();
      };
      const showStep = async () => {
        const g = guide; if (!g) return;
        const sg = g.stages[g.si], q = sg.moves[g.mi];
        steps.replaceChildren(...g.stages.map((s, i) => h('span', { class: 'cbstep' + (i < g.si ? ' done' : i === g.si ? ' on' : '') }, i < g.si ? '✓' : String(i + 1))));
        title.textContent = (g.stages.length > 1 ? (g.si + 1) + '단계 · ' : '') + sg.name + '  (' + (g.mi + 1) + '/' + sg.moves.length + ')';
        const show = !g.self || g.hint;                              // 스스로 할 때는 힌트를 켰을 때만 화살표·밝은 면을 보여 준다
        if (g.self) { msg.replaceChildren(chip(q.f), nameOf(q.f) + '을 ', h('b', { class: 'cbdir' }, q.d > 0 ? '↻ 오른쪽' : '↺ 왼쪽'), '으로 돌려요'); scoreEl.textContent = '⭕ ' + g.ok + '   ❌ ' + g.bad; scoreEl.hidden = false; }
        else msg.replaceChildren(chip(q.f), nameOf(q.f) + '을 화살표처럼 돌려요');
        setDim(show ? q : null);
        busy = true;
        if (g.intro) { g.intro = false; G.speak(sg.say); await viewTo(poseFor(show ? q.f : null, sg.up), 700); }
        else if (show && ap(M, FACES[q.f].n)[2] < 0.3) await viewTo(poseFor(q.f, sg.up));
        busy = false; if (dead || guide !== g) return;
        if (!show) { arrow.hidden = true; return; }
        arrow.style.transform = FT[q.f] + ' translateZ(calc(var(--s) * 1.56))' + (q.d < 0 ? ' scaleX(-1)' : ''); arrow.hidden = false;
        if (auto) autoT = setTimeout(() => doStep(true), 350);
      };
      const doStep = async (fromAuto) => {
        const g = guide; if (!g || busy) return;
        if (!fromAuto && auto) toggleAuto();
        busy = true; arrow.hidden = true; G.sfx.flip();
        const sg = g.stages[g.si], q = sg.moves[g.mi];
        await turn(q, auto ? 300 : 260); pushHist(q); busy = false;
        if (dead || guide !== g) return;
        g.mi++;
        if (g.mi >= sg.moves.length) {
          g.si++; g.mi = 0; g.intro = true;
          if (g.si >= g.stages.length) { mixed = false; hist = []; const easy = g.easy; freeUi(); viewTo(poseFor(null, 1), 600); if (g.self) G.win({ stars: g.ok >= g.total ? 3 : g.ok >= g.total * 0.8 ? 2 : 1, text: g.total + '번 가운데 ' + g.ok + '번을 한 번에 맞혔어요! (❌ ' + g.bad + '번)', bonus: 0 }); else G.win({ stars: easy ? 2 : 3, text: easy ? '거꾸로 돌려서 맞췄어요! 이번엔 🌀 많이 섞어 볼까요?' : '큐브를 끝까지 맞췄어요! 🧊', bonus: 0 }); return; }
          G.sfx.ok();
        }
        showStep();
      };
      const back = async () => {
        const g = guide; if (!g || busy) return;
        if (auto) toggleAuto();
        if (g.mi === 0 && g.si === 0) return;
        if (g.mi === 0) { g.si--; g.mi = g.stages[g.si].moves.length; }
        g.mi--; busy = true; arrow.hidden = true; G.sfx.tap();
        const q = g.stages[g.si].moves[g.mi], inv = { f: q.f, d: -q.d };
        await turn(inv, 220); pushHist(inv); busy = false;
        if (!dead && guide === g) showStep();
      };
      const toggleAuto = () => {
        if (!guide) return; auto = !auto; clearTimeout(autoT); G.sfx.tap();
        guide.autoBtn.textContent = auto ? '⏸ 멈춤' : '▶ 자동'; guide.autoBtn.setAttribute('aria-pressed', String(auto));
        if (auto && !busy) doStep(true);
      };

      // ───── 손가락: 끌면 큐브가 돌고, 살짝 누르면 그 면이 돈다 ─────
      let ptr = null;
      view.addEventListener('pointerdown', (e) => {
        if (ptr) return;
        const face = e.target.closest && e.target.closest('.cbf[data-f]');
        ptr = { id: e.pointerId, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, drag: false, f: face ? +face.dataset.f : null };
        try { view.setPointerCapture(e.pointerId); } catch (err) {}
      });
      view.addEventListener('pointermove', (e) => {
        if (!ptr || e.pointerId !== ptr.id) return;
        if (!ptr.drag && Math.hypot(e.clientX - ptr.x0, e.clientY - ptr.y0) > 8) ptr.drag = true;
        if (ptr.drag && !(busy && guide && arrow.hidden)) {
          const k = 3.4 / (S * 6);
          M = mul(rotAxis([1, 0, 0], -(e.clientY - ptr.y) * k), mul(rotAxis([0, 1, 0], (e.clientX - ptr.x) * k), M)); setView();
        }
        ptr.x = e.clientX; ptr.y = e.clientY;
      });
      const up = (e) => {
        if (!ptr || e.pointerId !== ptr.id) return;
        const p = ptr; ptr = null;
        if (e.type === 'pointercancel' || p.drag || p.f == null) return;
        if (guide && guide.self) tryMove(p.f);
        else if (guide) { const q = guide.stages[guide.si].moves[guide.mi]; if (q && q.f === p.f && !arrow.hidden) doStep(false); }
        else freeTurn(p.f);
      };
      view.addEventListener('pointerup', up); view.addEventListener('pointercancel', up);

      fit(); paint(); setView(); freeUi();
      return () => { dead = true; delete document.documentElement.dataset.game; cancelAnimationFrame(raf); clearTimeout(autoT); clearTimeout(markT); if (ro) ro.disconnect(); else removeEventListener('resize', fit); };
    },
  });
})();
