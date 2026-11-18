// 큐브 맞추기 (3×3×3, 3D 입체)
//  손가락으로 끌면 큐브가 360도 돌고, 색깔 면을 누르면 그 면이 돈다.
//  섞은 뒤 "알려 줘!"를 누르면 맞추는 법을 한 번에 한 칸씩, 7단계로 따라 하게 해 준다.
//  "원리 보기"는 실제 큐브가 움직이며 보여 주는 5장(가운데 색·한 줄이 같이 움직임·한 층씩·공식·해 보기).
//  "내가 할래!"는 어느 면을 어느 쪽으로 돌릴지만 알려 주고, 아이가 직접 돌리면 맞았는지(⭕) 틀렸는지(❌) 확인해 준다.
//  그림은 CSS 3D 로 직접 그린다(외부 라이브러리·에셋 없음).
(function () {
  'use strict';

  const { FACES, FL, FI, dot, mul, ap, tr, rotAxis, solved, applyM, isSolved, solve, toQuarters, qm } = G.cubeCore;

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
      let freeMoves = 0, gen = 0, busy = false, dead = false, dir = 1, hist = [], mixed = false, guide = null, auto = false, raf = 0, autoT = 0;

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
      const helpBtn = h('button', { class: 'mode learn cbhelp', 'aria-label': '원리 보기', onclick: () => startLearn() }, '📖 원리');
      helpBtn.addEventListener('pointerdown', (e) => e.stopPropagation());   // 큐브 돌리기(끌기)와 섞이지 않게
      const labBtn = h('button', { class: 'mode learn cbhelp lab', 'aria-label': '공식 연습', onclick: () => openLab() }, '🏋️ 공식');
      labBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
      const memBtn = h('button', { class: 'mode learn cbhelp mem', 'aria-label': '내 기록', onclick: () => openPan('free', 'slots') }, '📂 내 기록');
      memBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
      const corner = (hide) => { helpBtn.hidden = hide; labBtn.hidden = hide; memBtn.hidden = hide; tools.hidden = hide; };
      const view = h('div', { class: 'cbview' }, cubeEl, scoreEl, markEl);
      const tools = h('div', { class: 'cbtools' }, helpBtn, memBtn, labBtn);   // 큐브 위가 아니라 안내 칸 안에 둔다(큐브와 겹치지 않게)
      let markT = 0;
      const mark = (ok) => { clearTimeout(markT); markEl.textContent = ok ? '⭕' : '❌'; markEl.hidden = true; void markEl.offsetWidth; markEl.hidden = false; markT = setTimeout(() => { markEl.hidden = true; }, ok ? 450 : 900); };
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const steps = h('div', { class: 'cbsteps' }), title = h('div', { class: 'cbtitle' }), msg = h('div', { class: 'cbmsg' });
      const info = h('div', { class: 'cbinfo' }, steps, title, msg, tools), ctl = h('div', { class: 'cbctl' });
      root.classList.add('cb'); root.append(info, view, ctl);
      // 들어오면 전체 화면으로(주소창·아래 막대가 사라져 넓어진다). 허락한 브라우저에서만 되고(아이폰 사파리는 안 됨),
      // 게임 카드를 누른 직후가 아니면 거절될 수 있어 첫 터치 때 한 번 더 시도한다. 나가면 원래대로.
      const goFull = () => { if (!document.fullscreenEnabled || document.fullscreenElement) return; try { const pr = document.documentElement.requestFullscreen({ navigationUI: 'hide' }); if (pr && pr.catch) pr.catch(() => {}); } catch (e) {} };
      goFull(); root.addEventListener('pointerdown', goFull, { once: true });
      document.documentElement.dataset.game = 'cube';   // 좁은 화면에서 제목이 두 줄이 되지 않게

      // 큐브 크기: 가만히 있을 때 칸의 88% 안팎(조각 한 변 S 기준 가로 4.4S·세로 4.55S). 돌리다가 모서리가 아주 조금 넘으면 칸 밖은 잘린다
      const fit = () => { const r = view.getBoundingClientRect(); S = Math.max(18, Math.min((r.width || 300) / 5.0, (r.height || 300) / 5.1)); cubeEl.style.setProperty('--s', S + 'px'); view.style.perspective = S * 13 + 'px'; cubies.forEach((c) => place(c)); };
      const ro = 'ResizeObserver' in window ? new ResizeObserver(fit) : null; if (ro) ro.observe(view); else addEventListener('resize', fit);

      const ease = (t) => t * t * (3 - 2 * t);
      const tween = (ms, fn, tok) => new Promise((done) => {
        if (calm || ms <= 0) { fn(1); done(); return; }
        const t0 = performance.now(), tick = (now) => { if (dead) return; if (tok !== undefined && tok !== gen) { done(); return; } const t = Math.min(1, (now - t0) / ms); fn(ease(t)); if (t < 1) raf = requestAnimationFrame(tick); else done(); };
        raf = requestAnimationFrame(tick);
      });
      // 면 하나를 돌린다(그림 → 끝나면 상태를 바꾸고 다시 칠한다)
      const turn = (q, ms, tok) => {
        const n = FACES[q.f].n, layer = cubies.filter((c) => dot(c.p, n) === 1);
        return tween(ms, (t) => layer.forEach((c) => place(c, `rotate3d(${n[0]},${n[1]},${n[2]},${q.d * 90 * t}deg) `)), tok).then(() => {
          if (tok !== undefined && tok !== gen) { layer.forEach((c) => place(c)); return; }   // 슬라이드를 넘겼으면 상태는 바꾸지 않는다
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
        setDim(null); arrow.hidden = true; steps.replaceChildren(); scoreEl.hidden = true; corner(false);
        if (isSolved(st)) say('끌면 빙글, 누르면 그 면이 돌아요', []);
        else say('큐브가 섞였어요! 🎓 보여 줘요 · ✋ 내가 해 봐요', []);
        const dirBtn = btn(dir > 0 ? '↻ 오른쪽으로' : '↺ 왼쪽으로', () => { G.sfx.tap(); dir = -dir; dirBtn.textContent = dir > 0 ? '↻ 오른쪽으로' : '↺ 왼쪽으로'; });
        ctl.replaceChildren(
          btn('🐣 살짝 섞기', () => shuffle(3)), btn('🌀 많이 섞기', () => shuffle(20)), dirBtn,
          btn('🎓 알려 줘!', () => startGuide(false), 'go'), btn('✋ 내가 할래!', () => startGuide(true), 'self'), btn('✨ 처음으로', reset));
      };
      // ───── 📖 원리 보기: 실제 큐브가 움직이며 보여 주는 5장 ─────
      let learn = null;
      const lsay = (...ls) => msg.replaceChildren(...ls.map((x) => h('span', { class: 'ln' }, x)));
      const pulseOff = () => stickers.forEach((el) => el.classList.remove('pulse', 'g'));
      const lit = (pred) => stickers.forEach((el, i) => { el.classList.remove('d1'); el.classList.toggle('d2', !pred(i)); });
      const demoReset = () => { st = solved(); cubies.forEach((c) => place(c)); paint(); setDim(null); pulseOff(); };
      const wrongAt = (i) => ((st[i] / 9) | 0) !== ((i / 9) | 0);
      const LSL = [
        { t: '가운데 색이 면의 이름이에요', say: '가운데 칸은 움직이지 않아요. 빨간 가운데가 있으면 빨간 면이에요.',
          run: async (tok) => { demoReset(); lsay('가운데 칸은 절대 움직이지 않아요.', '빨간 가운데가 있으면 빨간 면이에요!'); await viewTo(poseFor(null, 1), 500); if (tok !== gen) return; lit((i) => stickers[i].classList.contains('ctr')); stickers.forEach((el) => { if (el.classList.contains('ctr')) el.classList.add('pulse'); }); } },
        { t: '한 면을 돌리면 옆 줄도 같이 움직여요', say: '한 면을 돌리면 옆 줄도 같이 움직여요. 맞춘 것이 흩어질 수 있어요.', again: true,
          run: async (tok) => {
            demoReset(); lsay('한 면을 돌려 볼게요. 잘 보세요!');
            await viewTo(poseFor(4, 1), 500); await wait(500); if (tok !== gen) return;
            setDim({ f: 4, d: 1 }); await turn({ f: 4, d: 1 }, 800, tok); if (tok !== gen) return;
            lsay('돌렸더니 옆 줄도 같이 움직였어요.', '맞춘 것이 흩어질 수 있어요!');
          } },
        { t: '한 층씩 맞춰요', say: '한 층씩 맞춰요. 맞춘 층은 건드리지 않아요.',
          run: async (tok) => {
            demoReset(); await viewTo(poseFor(null, 1), 500);
            const L = [['① 하얀 층', '하얀 십자가와 하얀 모서리', 1], ['② 가운데 줄', '가운데 줄', 0], ['③ 노란 층', '노란 면 맞추기', -1]];
            for (let k = 0; tok === gen; k = (k + 1) % 3) { lit((i) => FL[i].p[1] === L[k][2]); lsay(L[k][0] + ' — ' + L[k][1], '맞춘 층은 건드리지 않아요!'); await wait(2200); }
          } },
        { t: '공식은 돌렸다가 되돌려요', say: '공식은 돌렸다가 되돌려요. 그러면 몇 칸만 바뀌어요.', again: true,
          run: async (tok) => {
            demoReset(); lsay('공식 하나를 해 볼게요.', '오른쪽 → 위 → 오른쪽 되돌리기');
            await viewTo(poseFor(4, 0), 600); await wait(600); if (tok !== gen) return;
            for (const [q, t] of [[{ f: 4, d: 1 }, '① 오른쪽 면을 돌려요 ↻'], [{ f: 0, d: 1 }, '② 위 면을 돌려요 ↻'], [{ f: 4, d: -1 }, '③ 오른쪽 면을 되돌려요 ↺']]) {
              if (tok !== gen) return; lsay(t); setDim(q); await turn(q, 700, tok); await wait(250);
            }
            if (tok !== gen) return;
            const n = st.filter((v, i) => wrongAt(i)).length;
            stickers.forEach((el, i) => { el.classList.remove('d2'); el.classList.toggle('g', wrongAt(i)); el.classList.toggle('d1', !wrongAt(i)); });   // 안 바뀐 칸은 조금만 흐리게(구멍처럼 안 보이게)
            lsay('겨우 세 번 돌렸어요!', '바뀐 칸은 반짝이는 ' + n + '칸뿐이에요.', '나머지는 그대로예요!');
          } },
        { t: '이제 해 볼까요?', say: '이제 해 볼까요?',
          run: async (tok) => { demoReset(); lsay('이제 해 볼까요?', '🎓 알려 줘! 는 한 칸씩 알려 줘요.', '✋ 내가 할래! 는 내가 돌리면 맞았는지 알려 줘요.'); await viewTo(poseFor(null, 1), 500); } },
      ];
      const learnCtl = () => {
        const l = learn, S = LSL[l.i], last = l.i === LSL.length - 1, prev = btn('◀ 이전', () => { if (l.i > 0) { G.sfx.tap(); l.i--; showLearn(); } });
        prev.disabled = l.i === 0;
        ctl.replaceChildren(prev,
          last ? btn('✔ 해 보러 가기', exitLearn, 'go big') : btn('다음 ▶', () => { G.sfx.tap(); l.i++; showLearn(); }, 'go big'),
          ...(S.again ? [btn('🔁 다시 보기', () => { G.sfx.tap(); showLearn(); })] : []), btn('✖ 닫기', exitLearn));
      };
      const showLearn = async () => {
        const l = learn; if (!l) return; const tok = ++gen, S = LSL[l.i];
        steps.replaceChildren(...LSL.map((_, i) => h('span', { class: 'cbstep' + (i < l.i ? ' done' : i === l.i ? ' on' : '') }, i < l.i ? '✓' : String(i + 1))));
        title.textContent = (l.i + 1) + '/' + LSL.length + ' · ' + S.t;
        learnCtl(); G.speak && G.speak(S.say);
        await S.run(tok);
      };
      const startLearn = () => {
        if (busy) return; G.sfx.tap(); window.aieduLog && aieduLog('use', 'cube-learn');
        corner(true); learn = { i: 0, saved: { st: st.slice(), hist: hist.slice(), mixed } };
        showLearn();
      };
      const exitLearn = () => {                                   // 보기 전의 큐브(섞어 둔 것)를 그대로 되돌린다
        const l = learn; if (!l) return; G.sfx.tap(); gen++; learn = null;
        st = l.saved.st; hist = l.saved.hist; mixed = l.saved.mixed;
        cubies.forEach((c) => place(c)); paint(); setDim(null); pulseOff(); freeUi(); viewTo(poseFor(null, 1));
      };
      // ───── 📂 내 기록: 저장 칸 10개(직접 하기 이어하기) + 맞추기 기록 ─────
      // 이 기기(localStorage)에만 저장한다. 이용 기록(aieduLog)에는 보내지 않는다.
      const SLOTS = 10;
      const slotsGet = () => { const a = G.store.get('cube-slots', []) || []; return Array.from({ length: SLOTS }, (_, i) => a[i] || null); };
      const recGet = () => G.store.get('cube-rec', []) || [];
      const addRec = (r) => { try { G.store.set('cube-rec', recGet().concat(Object.assign({ t: Date.now() }, r)).slice(-100)); } catch (e) {} };
      const fmt = (t) => { const d = new Date(t), p2 = (n) => String(n).padStart(2, '0'); return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()); };
      const KIND = { self: '✋ 직접 맞춤', guide: '🎓 따라서 맞춤', back: '↩ 거꾸로 맞춤', free: '🧊 혼자 맞춤' };
      let pan = null;
      const closePan = () => { if (pan) { pan.remove(); pan = null; } };
      const openPan = (mode, tab, after) => {            // mode: 'save'(저장할 칸 고르기) | 'free'(이어하기·기록 보기)
        if (busy) return; closePan(); G.sfx.tap();
        const head = h('div', { class: 'cbph' }), body = h('div', { class: 'cbpb' });
        const me = pan = h('div', { class: 'cbpan' }, head, body); me.addEventListener('pointerdown', (e) => e.stopPropagation()); view.append(me);
        const shut = () => { G.sfx.tap(); closePan(); };
        const draw = (t) => {
          head.replaceChildren(...(mode === 'save' ? [h('b', {}, '💾 저장할 칸을 골라요')] : [
            h('button', { class: 'mode' + (t === 'slots' ? ' go' : ''), onclick: () => { G.sfx.tap(); draw('slots'); } }, '📂 이어하기'),
            h('button', { class: 'mode' + (t === 'rec' ? ' go' : ''), onclick: () => { G.sfx.tap(); draw('rec'); } }, '📊 기록')]), h('button', { class: 'mode', onclick: shut }, '✖ 닫기'));
          body.replaceChildren(...(t === 'rec' ? recView() : slotView()));
        };
        const sure = (b, label, fn) => { if (b.dataset.sure) { fn(); return; } b.dataset.sure = '1'; b.textContent = label; setTimeout(() => { if (b.isConnected) { delete b.dataset.sure; draw(me.tab); } }, 2500); };
        const slotView = () => { me.tab = 'slots'; return slotsGet().map((sl, i) => {
          const pct = sl ? Math.round(sl.done * 100 / Math.max(1, sl.total)) : 0;
          const acts = mode === 'save'
            ? [h('button', { class: 'mode go', onclick: (e) => { const go = () => { const a = slotsGet(); a[i] = saveNow(); G.store.set('cube-slots', a); G.sfx.ok(); closePan(); if (after) after(); }; if (sl) sure(e.currentTarget, '덮어쓸까요?', go); else go(); } }, sl ? '덮어쓰기' : '저장')]
            : sl ? [h('button', { class: 'mode go', onclick: () => loadSlot(sl) }, '▶ 이어하기'), h('button', { class: 'mode', 'aria-label': '지우기', onclick: (e) => sure(e.currentTarget, '지울까요?', () => { const a = slotsGet(); a[i] = null; G.store.set('cube-slots', a); G.sfx.tap(); draw('slots'); }) }, '🗑')] : [];
          return h('div', { class: 'cbslot' + (sl ? ' full' : '') }, h('b', {}, String(i + 1)),
            h('span', { class: 'si' }, ...(sl ? [h('span', {}, fmt(sl.t) + ' · ' + pct + '% 했어요'), h('span', { class: 'sub' }, '⭕ ' + sl.ok + '  ❌ ' + sl.bad)] : ['비어 있어요'])), ...acts);
        }); };
        const recView = () => {
          me.tab = 'rec'; const rs = recGet(), me2 = rs.filter((r) => r.k === 'self'), labDone = Object.values(G.store.get('cube-lab', {}) || {}).filter((v) => v >= 5).length;
          const best = me2.length ? Math.max(...me2.map((r) => Math.round(r.ok * 100 / Math.max(1, r.n)))) : null;
          const sum = h('div', { class: 'cbsum' }, h('span', {}, '🧊 맞춘 횟수 ' + rs.filter((r) => r.k !== 'lab').length + '번'), h('span', {}, '✋ 직접 ' + me2.length + '번'), h('span', {}, best == null ? '🎯 최고 정확도 -' : '🎯 최고 정확도 ' + best + '%'), h('span', {}, '🏋️ 익힌 공식 ' + labDone + '/' + G.cubeCore.FORMULAS.length));
          const rows = rs.slice(-30).reverse().map((r) => h('div', { class: 'cbrec' }, h('span', { class: 'when' }, fmt(r.t)), h('b', {}, r.k === 'lab' ? '🏋️ ' + r.name : KIND[r.k] || '🧊'), h('span', {}, r.n + '번 돌림' + (r.k === 'self' ? ' · ⭕ ' + r.ok + ' ❌ ' + r.bad : r.k === 'lab' ? ' · ❌ ' + r.bad : ''))));
          return [sum, ...(rows.length ? rows : [h('div', { class: 'cbsum' }, '아직 기록이 없어요. 큐브를 맞춰 보세요!')])];
        };
        me.draw = draw; draw(tab || 'slots');
      };
      // 지금 직접 하기를 저장할 내용(큐브 모양 + 몇 번째까지 했는지)
      const saveNow = () => { const g = guide; return { t: Date.now(), st: st.slice(), ok: g.ok, bad: g.bad, done: g.stages.slice(0, g.si).reduce((n, x) => n + x.moves.length, 0) + g.mi, total: g.total }; };
      const loadSlot = (sl) => {
        if (busy) return; closePan(); guide = null; auto = false; G.sfx.tap();
        st = sl.st.slice(); hist = []; mixed = true; cubies.forEach((c) => place(c)); paint();
        window.aieduLog && aieduLog('use', 'cube-resume');
        startGuide(true, sl);
      };

      // ───── 🏋️ 공식 연습실(cube_lab.js) ─────
      let lab = null, labSaved = null;
      const openLab = () => {
        if (busy || !G.cubeLab) return; G.sfx.tap();
        if (!lab) lab = G.cubeLab({
          h, btn, chip, nameOf, steps, title, msg, ctl, sfx: G.sfx, speak: (t) => { if (t) G.speak(t); },
          bump: () => ++gen, gen: () => gen, dead: () => dead, wait, turn, viewTo, poseFor, setDim, pulseOff, mark,
          getSt: () => st, setSt: (a) => { st = a.slice(); cubies.forEach((c) => place(c)); paint(); },
          visible: (f) => ap(M, FACES[f].n)[2] >= 0.3,
          showArrow: (q) => { if (!q) { arrow.hidden = true; return; } arrow.style.transform = FT[q.f] + ' translateZ(calc(var(--s) * 1.56))' + (q.d < 0 ? ' scaleX(-1)' : ''); arrow.hidden = false; },
          scoreText: (t) => { if (t == null) { scoreEl.hidden = true; return; } scoreEl.textContent = t; scoreEl.hidden = false; },
          glowChanged: () => { let n = 0; stickers.forEach((el, i) => { const w = wrongAt(i); if (w) n++; el.classList.remove('d2'); el.classList.toggle('g', w); el.classList.toggle('d1', !w); }); return n; },
          record: addRec,
          leave: () => { const l = labSaved; labSaved = null; if (!l) return; gen++; st = l.st; hist = l.hist; mixed = l.mixed; cubies.forEach((c) => place(c)); paint(); setDim(null); pulseOff(); arrow.hidden = true; scoreEl.hidden = true; freeUi(); viewTo(poseFor(null, 1)); },
        });
        labSaved = { st: st.slice(), hist: hist.slice(), mixed }; corner(true); guide = null; lab.open();
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
        mixed = true; freeMoves = 0; busy = false; if (!dead) freeUi();
      };
      const freeTurn = async (f) => {
        if (busy) return; busy = true; G.sfx.flip();
        const q = { f, d: dir }; await turn(q, 240); pushHist(q); freeMoves++; busy = false;
        if (dead) return;
        if (isSolved(st) && mixed) { addRec({ k: 'free', n: freeMoves }); mixed = false; hist = []; freeUi(); G.win({ stars: 3, text: '혼자서 큐브를 맞췄어요! 🧊', bonus: 0 }); } else if (!guide) freeUi();
      };

      // ───── 맞추는 법 따라 하기 ─────
      const startGuide = (self, resume) => {
        if (busy) return; G.sfx.tap();
        if (isSolved(st)) { say('먼저 큐브를 섞어 보세요!', '🐣 살짝 섞기 나 🌀 많이 섞기 를 눌러요.'); G.speak('먼저 큐브를 섞어 보세요'); return; }
        let stages;
        if (hist.length && hist.length <= 6) stages = [{ id: 'back', up: 1, name: '거꾸로 돌려서 맞추기', say: '섞은 것을 거꾸로 돌리면 다시 맞춰져요.', moves: hist.slice().reverse().map((q) => ({ f: q.f, d: -q.d })) }];
        else { try { stages = solve(st).filter((s) => s.moves.length); } catch (e) { say('앗, 다시 해 볼까요?', '✨ 처음으로 를 누르고 다시 섞어 주세요.'); return; } }
        corner(true);
        guide = { stages, si: 0, mi: 0, easy: stages[0].id === 'back', intro: true, self, ok: 0, bad: 0, miss: 0, hint: false, total: stages.reduce((n, s) => n + s.moves.length, 0) };
        if (resume) { guide.ok = resume.ok; guide.bad = resume.bad; guide.total += resume.done; }
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
          btn('✖ 그만', askStop));
      };
      // 직접 하다가 그만둘 때: 저장하고 그만 / 그냥 그만 / 계속
      const askStop = () => {
        const g = guide; if (busy || !g) return; G.sfx.tap(); arrow.hidden = true;
        title.textContent = '그만할까요?'; msg.replaceChildren('저장해 두면 다음에 이어서 할 수 있어요.');
        ctl.replaceChildren(btn('💾 저장하고 그만', () => openPan('save', null, () => freeUi()), 'go big'), btn('그냥 그만', () => { G.sfx.tap(); freeUi(); }), btn('↩ 계속 하기', () => { G.sfx.tap(); selfCtl(); showStep(); }));
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
          if (g.si >= g.stages.length) { mixed = false; hist = []; const easy = g.easy; freeUi(); viewTo(poseFor(null, 1), 600); addRec(g.self ? { k: 'self', n: g.total, ok: g.ok, bad: g.bad } : { k: easy ? 'back' : 'guide', n: g.total }); if (g.self) G.win({ stars: g.ok >= g.total ? 3 : g.ok >= g.total * 0.8 ? 2 : 1, text: g.total + '번 가운데 ' + g.ok + '번을 한 번에 맞혔어요! (❌ ' + g.bad + '번)', bonus: 0 }); else G.win({ stars: easy ? 2 : 3, text: easy ? '거꾸로 돌려서 맞췄어요! 이번엔 🌀 많이 섞어 볼까요?' : '큐브를 끝까지 맞췄어요! 🧊', bonus: 0 }); return; }
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
        if (e.type === 'pointercancel' || p.drag || p.f == null || learn) return;
        if (lab && lab.active()) { lab.tap(p.f); return; }
        if (guide && guide.self) tryMove(p.f);
        else if (guide) { const q = guide.stages[guide.si].moves[guide.mi]; if (q && q.f === p.f && !arrow.hidden) doStep(false); }
        else freeTurn(p.f);
      };
      view.addEventListener('pointerup', up); view.addEventListener('pointercancel', up);

      fit(); paint(); setView(); freeUi();
      return () => { dead = true; try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {} closePan(); if (lab) lab.close(false); delete document.documentElement.dataset.game; cancelAnimationFrame(raf); clearTimeout(autoT); clearTimeout(markT); if (ro) ro.disconnect(); else removeEventListener('resize', fit); };
    },
  });
})();
