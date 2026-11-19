// 큐브 맞추기 — 🏋️ 공식 연습실
//  "어떤 큐브든 맞추는 공식 8개"를 하나씩 익힌다. 맞추기 안내(🎓)가 쓰는 공식과 같다(cube_core.js 의 FORMULAS).
//  한 공식을 ① 보기 → ② 따라 하기(화살표) → ③ 혼자 하기(순서만) → ④ 외워서 하기 → ⑤ 써 보기(망가진 큐브를 공식으로 고치기)
//  로 익히고, 진도는 이 기기에 저장한다(G.store 'cube-lab'). 입력한 내용·정답은 이용 기록으로 보내지 않는다.
//  화면(큐브 그림·돌리기)은 cube.js 가 넘겨 주는 A(도구 모음)로 쓴다.
(function () {
  'use strict';
  const { FORMULAS, parse, toQuarters, applyM, solved, qm, isSolved } = G.cubeCore;
  const PH = ['① 보기', '② 따라 하기', '③ 혼자 하기', '④ 외워서 하기', '⑤ 써 보기'];
  const quarters = (f) => toQuarters(parse(f));
  const inverse = (qs) => qs.slice().reverse().map((q) => ({ f: q.f, d: -q.d }));
  const apply = (st, qs) => qs.reduce((s, q) => applyM(s, qm(q)), st);

  G.cubeLab = (A) => {
    const h = A.h;
    let on = false, cur = 0, run = null, busy = false;
    const prog = () => G.store.get('cube-lab', {}) || {};
    const done = (id) => prog()[id] || 0;
    const save = (id, n) => { const p = prog(); if ((p[id] || 0) < n) { p[id] = n; G.store.set('cube-lab', p); } };
    const dirTxt = (d) => (d > 0 ? '↻ 오른쪽' : '↺ 왼쪽');
    // 공식을 색 칩과 화살표로 보여 준다(글자 R·U 대신 — 1학년은 색으로 찾는다)
    const mvEl = (q, cls) => h('span', { class: 'mv' + (cls || '') }, A.chip(q.f), q.d > 0 ? '↻' : '↺');
    // 긴 공식은 지금 차례 앞뒤만 보여 준다(화면이 좁을 때 큐브가 작아지지 않게)
    const seq = (qs, at) => {
      if (qs.length <= 6) return h('span', { class: 'cbseq' }, ...qs.map((q, i) => mvEl(q, at == null ? '' : i < at ? ' done' : i === at ? ' on' : '')));
      if (at == null) return h('span', { class: 'cbseq' }, ...qs.slice(0, 5).map((q) => mvEl(q)), h('span', { class: 'more' }, '… ' + qs.length + '번'));
      const a = Math.max(0, Math.min(at - 1, qs.length - 5));
      return h('span', { class: 'cbseq' }, ...qs.slice(a, a + 5).map((q, i) => mvEl(q, a + i < at ? ' done' : a + i === at ? ' on' : '')), h('span', { class: 'more' }, (at + 1) + '/' + qs.length));
    };
    const dots = (n, at) => h('span', { class: 'cbdots' }, ...Array.from({ length: n }, (_, i) => h('span', { class: i < at ? 'on' : '' }, i < at ? '●' : '○')));
    const vis = (f) => A.visible(f);

    // ───── 연습 고르기 ─────
    const menu = () => {
      busy = false; run = null; const tok = A.bump(); A.setDim(null); A.showArrow(null); A.pulseOff();
      A.setSt(solved());
      const F = FORMULAS[cur], n = done(F.id), qs = quarters(F.f);
      A.steps.replaceChildren(...FORMULAS.map((x, i) => h('span', { class: 'cbstep' + (done(x.id) >= 5 ? ' done' : i === cur ? ' on' : ''), 'aria-label': x.name }, done(x.id) >= 5 ? '✓' : String(i + 1))));
      A.title.textContent = '공식 ' + (cur + 1) + '/' + FORMULAS.length + ' · ' + F.icon + ' ' + F.name;
      A.msg.replaceChildren(seq(qs), h('span', { class: 'ln' }, F.why), h('span', { class: 'ln' }, n >= 5 ? '⭐ 다 익혔어요!' : n ? '이어서 할 단계: ' + PH[n] : '처음이에요. ① 보기부터 해요!'));
      A.ctl.replaceChildren(
        btn('◀', () => { cur = (cur + FORMULAS.length - 1) % FORMULAS.length; A.sfx.tap(); menu(); }),
        btn(n >= 5 ? '🔁 또 해 보기' : n ? '▶ 이어서 하기' : '▶ 시작', () => start(n >= 5 ? 0 : n), 'go big'),
        btn('▶', () => { cur = (cur + 1) % FORMULAS.length; A.sfx.tap(); menu(); }),
        btn('✖ 나가기', () => { A.sfx.tap(); close(true); }));
      A.viewTo(A.poseFor(null, 0), 400);
      return tok;
    };
    const btn = (label, fn, cls) => A.btn(label, fn, cls);

    // ───── 한 단계 시작 ─────
    const start = async (pi) => {
      A.sfx.tap();
      const F = FORMULAS[cur], qs = quarters(F.f), tok = A.bump();
      run = { pi, qs, mi: 0, ok: 0, bad: 0, miss: 0, hint: false, tok, F };
      busy = true; A.setDim(null); A.showArrow(null); A.pulseOff();
      A.setSt(pi === 4 ? apply(solved(), inverse(qs)) : solved());     // ⑤ 는 공식을 거꾸로 해서 망가뜨린 큐브에서 시작
      A.steps.replaceChildren(...PH.map((_, i) => h('span', { class: 'cbstep' + (i < pi ? ' done' : i === pi ? ' on' : '') }, i < pi ? '✓' : String(i + 1))));
      A.title.textContent = F.icon + ' ' + F.name + ' · ' + PH[pi];
      if (pi === 0) { watch(run); return; }
      A.ctl.replaceChildren(...dirCtl(), btn('💡 힌트', hint), btn('✖ 그만', () => { if (busy) return; A.sfx.tap(); menu(); }));
      A.msg.replaceChildren(pi === 4 ? '큐브가 망가졌어요! 공식으로 고쳐 봐요.' : '준비!');
      A.speak(pi === 1 ? F.say : pi === 4 ? '공식으로 큐브를 고쳐 봐요' : '');
      await A.viewTo(A.poseFor(null, 0), 500);
      busy = false; if (A.gen() !== tok || A.dead()) return;
      show();
    };
    // 면을 먼저 콕 → 방향 버튼을 누르면 그때 돌리고 맞았는지 본다
    let sel = null;
    const dirCtl = () => { sel = null; A.pick(null); return [btn('↺ 왼쪽', () => turnSel(-1), 'big dirb'), btn('↻ 오른쪽', () => turnSel(1), 'big dirb')]; };
    const turnSel = (d) => {
      const r = run; if (!on || !r || r.pi === 0 || busy) return;
      if (sel == null) { A.nudge(); return; }
      const f = sel; sel = null; A.pick(null); doTurn(f, d);
    };
    const hint = () => { if (busy || !run || run.pi === 0) return; A.sfx.tap(); run.hint = true; show(); };

    // ① 보기: 공식이 저절로 돌고, 끝나면 바뀐 칸만 반짝인다
    const watch = async (r) => {
      A.speak(r.F.say);
      A.ctl.replaceChildren(btn('⏳ 보는 중…', () => {}, 'big'), btn('✖ 그만', () => { A.sfx.tap(); menu(); }));
      A.ctl.firstChild.disabled = true;
      await A.viewTo(A.poseFor(null, 0), 500); await A.wait(400);
      for (let i = 0; i < r.qs.length; i++) {
        if (A.gen() !== r.tok || A.dead()) return;
        const q = r.qs[i];
        A.msg.replaceChildren(seq(r.qs, i), h('span', { class: 'ln' }, A.nameOf(q.f) + ' ' + dirTxt(q.d)));
        if (!vis(q.f)) await A.viewTo(A.poseFor(q.f, 0));
        A.setDim(q); await A.wait(250); A.sfx.flip(); await A.turn(q, 650, r.tok); await A.wait(150);
      }
      if (A.gen() !== r.tok || A.dead()) return;
      const n = A.glowChanged();
      busy = false; save(r.F.id, 1);
      A.msg.replaceChildren(h('span', { class: 'ln' }, '공식은 ' + r.qs.length + '번 돌렸어요.'), h('span', { class: 'ln' }, '반짝이는 ' + n + '칸만 바뀌었어요!'), h('span', { class: 'ln' }, r.F.why));
      A.ctl.replaceChildren(btn('🔁 다시 보기', () => start(0)), btn('다음 ▶', () => start(1), 'go big'), btn('✖ 그만', () => { A.sfx.tap(); menu(); }));
    };

    // ②~⑤ 직접 하기
    const show = async () => {
      const r = run; if (!r || A.dead()) return;
      const q = r.qs[r.mi], pi = r.pi, arrowOn = pi === 1 || r.hint;
      sel = null; A.pick(null);
      if (pi === 1) A.msg.replaceChildren(A.chip(q.f), A.nameOf(q.f) + '을 콕 → ', h('b', { class: 'cbdir' }, dirTxt(q.d)), ' 버튼', seq(r.qs, r.mi));
      else if (pi === 2) A.msg.replaceChildren(h('span', { class: 'ln' }, '순서대로 돌려요'), seq(r.qs, r.mi), ...(r.hint ? [h('span', { class: 'ln' }, A.nameOf(q.f) + ' ' + dirTxt(q.d))] : []));
      else A.msg.replaceChildren(h('span', { class: 'ln' }, pi === 4 ? '공식으로 큐브를 고쳐요' : '외워서 해 봐요'), dots(r.qs.length, r.mi), ...(r.hint ? [h('span', { class: 'ln' }, A.nameOf(q.f) + ' ' + dirTxt(q.d))] : []));
      A.scoreText('⭕ ' + r.ok + '   ❌ ' + r.bad);
      A.setDim(arrowOn ? q : null);
      if (!vis(q.f)) { busy = true; await A.viewTo(A.poseFor(q.f, 0)); busy = false; if (run !== r || A.dead()) return; }
      A.showArrow(arrowOn ? q : null);
    };
    const tap = (f) => {
      const r = run; if (!on || !r || r.pi === 0 || busy) return;
      A.sfx.tap(); sel = f; A.pick(f);
      // 안내 글은 그대로 두고(글 길이가 바뀌면 큐브 칸이 들썩인다) 고른 면에 굵은 테두리만 보여 준다
    };
    const doTurn = async (f, d) => {
      const r = run; if (!on || !r || r.pi === 0 || busy) return;
      const q = r.qs[r.mi];
      busy = true; A.showArrow(null); A.sfx.flip();
      if (f === q.f && d === q.d) {
        if (!r.miss && !r.hint) r.ok++; r.miss = 0; r.hint = false; A.mark(true);
        await A.turn(q, 240); busy = false; if (run !== r || A.dead()) return;
        r.mi++;
        if (r.mi >= r.qs.length) return finish(r);
        return show();
      }
      await A.turn({ f, d }, 220); if (A.dead()) return;
      A.sfx.bad(); A.mark(false); r.bad++; r.miss++; A.scoreText('⭕ ' + r.ok + '   ❌ ' + r.bad);
      A.msg.replaceChildren(f !== q.f ? '앗, 그건 ' + A.nameOf(f) + '이에요! 다시 돌려 놓을게요.' : '앗, 방향이 반대예요! 다시 돌려 놓을게요.');
      await A.wait(700); if (A.dead() || run !== r) return;
      await A.turn({ f, d: -d }, 220); busy = false; if (run !== r || A.dead()) return;
      if (r.miss >= 2) r.hint = true;                                  // 두 번 틀리면 화살표로 알려 준다
      show();
    };
    const finish = (r) => {
      A.setDim(null); A.showArrow(null); A.scoreText(null);
      const last = r.pi === 4;
      if (last && !isSolved(A.getSt())) { A.msg.replaceChildren('어? 아직 안 맞았어요. 다시 해 봐요.'); A.ctl.replaceChildren(btn('🔁 다시', () => start(4), 'go big'), btn('✖ 그만', menu)); return; }
      save(r.F.id, r.pi + 1); A.sfx.ok();
      if (!last) {
        A.msg.replaceChildren(h('span', { class: 'ln' }, '⭕ 잘했어요! ' + PH[r.pi] + ' 끝!'), h('span', { class: 'ln' }, r.bad ? '❌ ' + r.bad + '번 틀렸지만 끝까지 했어요.' : '한 번도 안 틀렸어요!'));
        A.ctl.replaceChildren(btn('🔁 다시', () => start(r.pi)), btn('다음 ▶', () => start(r.pi + 1), 'go big'), btn('✖ 그만', () => { A.sfx.tap(); menu(); }));
        return;
      }
      A.pulseOff(); A.msg.replaceChildren(h('span', { class: 'ln' }, '큐브가 고쳐졌어요! 🎉'));
      const stars = r.bad === 0 ? 3 : r.bad <= 3 ? 2 : 1, F = r.F;
      A.record && A.record({ k: 'lab', name: F.name, n: r.qs.length, ok: r.ok, bad: r.bad });
      if (cur < FORMULAS.length - 1) cur++;
      menu();
      G.win({ stars, text: '「' + F.name + '」 공식을 익혔어요! (' + r.qs.length + '번 돌리기, ❌ ' + r.bad + '번)', bonus: 0 });
    };

    const open = () => {
      if (on) return; on = true; window.aieduLog && aieduLog('use', 'cube-lab');
      const d = FORMULAS.findIndex((F) => done(F.id) < 5); cur = d < 0 ? 0 : d;     // 아직 안 익힌 첫 공식부터
      menu();
    };
    const close = (restore) => { if (!on) return; on = false; run = null; busy = false; sel = null; A.pick(null); A.bump(); if (restore) A.leave(); };
    return { open, close, tap, active: () => on };
  };
})();
