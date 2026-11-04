// 레이싱: 캐릭터 4 · 차 4 · 경기장 8. 위에서 내려다보는 카트 레이스 (아이템 상자, 스킬, 부스트 패드)
(function () {
  'use strict';
  const D = window.RaceData, TAU = Math.PI * 2;
  if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) { r = Math.min(r || 0, w / 2, h / 2); this.moveTo(x + r, y); this.arcTo(x + w, y, x + w, y + h, r); this.arcTo(x + w, y + h, x, y + h, r); this.arcTo(x, y + h, x, y, r); this.arcTo(x, y, x + w, y, r); this.closePath(); };
  }
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const ITEMS = { boost: { e: '🍄', n: '부스트' }, shield: { e: '🛡️', n: '방패' }, banana: { e: '🍌', n: '바나나' }, missile: { e: '🎯', n: '미사일' } };
  const BASE_V = 380, BASE_ACC = 300, BASE_TURN = 2.4;

  // 이모지·차는 한 번만 그려 두고 이미지로 찍는다(회전해도 비용이 일정). 글자를 매 프레임 회전해 그리면 글자 캐시가 계속 빗나가서 끊긴다.
  const spr = new Map();
  function sprite(key, w, h, fn) { let c = spr.get(key); if (!c) { c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); spr.set(key, c); } return c; }
  const emo = (e) => sprite(e, 96, 96, (g, w) => { g.font = Math.round(w * 0.79) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(e, w / 2, w * 0.53); });
  const stamp = (c, e, fontPx) => { const sz = 96 * fontPx / 76; c.drawImage(emo(e), -sz / 2, -sz / 2, sz, sz); };

  const saved = G.store.get('race:sel', {});
  const sel = { ch: clamp(saved.ch | 0, 0, 3), car: clamp(saved.car | 0, 0, 3), tr: clamp(saved.tr | 0, 0, 7) };

  G.register({
    id: 'race', name: '레이싱', desc: '캐릭터·차·경기장 고르기', icon: '🏁', cat: 'race', color: 'peach', variants: 1,
    start(root, { hard }) {
      let stopFn = null;
      const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

      // ───────── 고르기 화면 3단계 ─────────
      function pick(step, title, items, cur, onPick, onBack) {
        if (stopFn) { stopFn(); stopFn = null; }
        const land = innerWidth > innerHeight * 1.05 && innerWidth > 640, n = items.length;
        const c = land ? (n <= 4 ? n : Math.ceil(n / 2)) : 2, r = Math.ceil(n / c);
        const grid = G.h('div', { class: 'pickgrid', style: `--c:${c};--r:${r}` }, items.map((it, i) =>
          G.h('button', { class: 'card pk c-' + it.color, 'aria-pressed': String(i === cur), onclick: () => { G.sfx.tap(); onPick(i); } },
            G.h('span', { class: 'ic' }, it.ic), G.h('span', { class: 'nm' }, it.nm), G.h('span', { class: 'ds' }, ...it.ds))));
        const kids = [G.h('div', { class: 'hint must' }, `🏁 ${step}/3 · ${title}`), G.h('div', { class: 'fitbox' }, grid)];
        if (onBack) kids.push(G.h('div', { class: 'palette' }, G.h('button', { class: 'btn alt', onclick: onBack }, '◀ 이전')));
        root.replaceChildren(...kids);
      }
      const br = (t) => G.h('span', { class: 'ln' }, t);
      function showChars() {
        pick(1, '캐릭터를 골라요', D.CHARS.map((c) => ({ ic: c.e, nm: c.n, color: c.color, ds: [br('⭐ ' + c.trait), br(`${c.skill.e} 스킬: ${c.skill.n}`), br(c.skill.d)] })), sel.ch,
          (i) => { sel.ch = i; showCars(); }, null);
      }
      function showCars() {
        pick(2, '차를 골라요', D.CARS.map((c) => ({ ic: c.e, nm: c.n, color: c.ui, ds: [br('⭐ ' + c.trait), br(`속도 ${stars(c.bars[0])}`), br(`가속 ${stars(c.bars[1])}`), br(`핸들 ${stars(c.bars[2])}`), br(`${c.skill.e} 스킬: ${c.skill.n} — ${c.skill.d}`)] })), sel.car,
          (i) => { sel.car = i; showTracks(); }, showChars);
      }
      function thumb(def, seed) {
        const T = D.buildTrack(def, seed), b = T.bounds, w = b.x1 - b.x0, h = b.y1 - b.y0, pad = 160;
        const d = T.pts.filter((_, i) => i % 6 === 0).map((p, i) => (i ? 'L' : 'M') + Math.round(p.x - b.x0 + pad) + ' ' + Math.round(p.y - b.y0 + pad)).join('') + 'Z';
        const s = G.h('span', { class: 'th' }); s.innerHTML = `<svg viewBox="0 0 ${w + pad * 2} ${h + pad * 2}"><rect width="100%" height="100%" rx="90" fill="${def.theme.bg}"/><path d="${d}" fill="none" stroke="${def.theme.road}" stroke-width="150" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${def.theme.line}" stroke-width="12" stroke-dasharray="40 40"/></svg>`;
        return s;
      }
      function showTracks() {
        pick(3, '경기장을 골라요', D.TRACKS.map((t, i) => ({ ic: thumb(t, i + 1), nm: t.e + ' ' + t.n, color: ['lemon', 'orange', 'sky', 'mint', 'pink', 'lilac', 'peach', 'sky'][i], ds: [br(t.gim)] })), sel.tr,
          (i) => { sel.tr = i; G.store.set('race:sel', sel); startRace(); }, showCars);
      }

      // ───────── 경기 ─────────
      function startRace() {
        const TD = D.TRACKS[sel.tr], T = D.buildTrack(TD, sel.tr + 1), th = TD.theme, hw = T.hw, M = T.M, P = T.pts;
        const laps = hard ? 3 : 2, WALL = hw * 1.5;
        const keys = { left: false, right: false }, rnd = Math.random;

        // 화면(HUD)
        const cv = G.h('canvas', { class: 'rcv' }), mini = G.h('canvas', { class: 'rmini', width: 120, height: 120 });
        const badge = G.h('div', { class: 'rbadge' }), toastEl = G.h('div', { class: 'rtoast' }), countEl = G.h('div', { class: 'rcount' });
        const bL = G.h('button', { class: 'rbtn', 'aria-label': '왼쪽' }, '◀'), bR = G.h('button', { class: 'rbtn', 'aria-label': '오른쪽' }, '▶');
        const mkBtn = (label, fn) => { const cd = G.h('span', { class: 'cd' }), b = G.h('button', { class: 'rbtn act' }, G.h('span', { class: 'em' }, ''), G.h('small', {}, label), cd); b.addEventListener('pointerdown', (e) => { e.preventDefault(); fn(); }); b._cd = cd; b._em = b.firstChild; return b; };
        const bItem = mkBtn('아이템', () => useItem(me)), bS1 = mkBtn('', () => useSkill(me, 0)), bS2 = mkBtn('', () => useSkill(me, 1));
        const hold = (el, k) => { const on = (e) => { e.preventDefault(); keys[k] = true; el.classList.add('on'); }, off = () => { keys[k] = false; el.classList.remove('on'); }; el.addEventListener('pointerdown', on); ['pointerup', 'pointerleave', 'pointercancel'].forEach((t) => el.addEventListener(t, off)); };
        hold(bL, 'left'); hold(bR, 'right');
        const wrap = G.h('div', { class: 'rwrap' }, cv, G.h('div', { class: 'rtop' }, badge, mini), toastEl, countEl,
          G.h('div', { class: 'rctl l' }, bL, bR), G.h('div', { class: 'rctl r' }, bS1, bS2, bItem));
        root.replaceChildren(wrap);
        const ctx = cv.getContext('2d'), mctx = mini.getContext('2d');
        let W = 0, H = 0, dpr = 1, q = 1;
        const fit = () => { const r = wrap.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1) * q; W = Math.max(50, Math.round(r.width * dpr)); H = Math.max(50, Math.round(r.height * dpr)); cv.width = W; cv.height = H; };
        fit(); const ro = new ResizeObserver(fit); ro.observe(wrap);

        // 선수
        const order4 = (() => { const others = G.shuffle([0, 1, 2, 3].filter((i) => i !== sel.ch)), cars = G.shuffle([0, 1, 2, 3]); return [sel.ch, ...others].map((c, i) => [c, i === 0 ? sel.car : cars[i]]); })();
        const slots = G.shuffle([0, 1, 2, 3]);
        const racers = order4.map(([ci, cr], i) => mk(ci, cr, i === 0, slots[i]));
        const me = racers[0];
        function mk(ci, cr, isPlayer, slot) {
          const ch = D.CHARS[ci], car = D.CARS[cr], idx = (M - 3 - Math.floor(slot / 2) * 4 + M) % M, c = P[idx], lat = (slot % 2 ? 0.45 : -0.45) * hw;
          return { ch, car, isPlayer, maxV: BASE_V * car.st.speed * ch.mod.max, acc: BASE_ACC * car.st.acc * ch.mod.acc, turn: BASE_TURN * car.st.turn * ch.mod.turn, mass: car.st.mass * ch.mod.mass,
            offF: 0.45 + (car.st.off || 0) + (ch.mod.off || 0), iceImm: !!ch.mod.ice, x: c.x + c.nx * lat, y: c.y + c.ny * lat, h: Math.atan2(c.ty, c.tx), px: c.x + c.nx * lat, py: c.y + c.ny * lat, ph: Math.atan2(c.ty, c.tx), dx: 0, dy: 0, dh: 0, vx: 0, vy: 0, v: 0, idx, lap: 0, prog: idx, prevIdx: idx,
            steerIn: 0, throttle: 1, boost: 0, boostMul: 1.4, shield: 0, stun: 0, frozen: 0, spin: 0, item: null, cd: [3, 4], lane: (rnd() - 0.5) * 0.7, aiVar: 0.97 + rnd() * 0.06, aiT: rnd(), fin: null, off: false, stuck: 0, tire: 0 };
        }

        // 상태
        const objs = [], fx = [], boxT = new Array(T.boxes.length).fill(0), AI = { mul: hard ? 1.0 : 0.86 };
        let state = 'count', cnt = 3.2, t = 0, finishing = 0, camH = me.h, last = 0, raf = 0, toastT = 0, over = false, hudT = 0;
        const dbg = G.raceDebug = { ms: [], rec: false, q: 1, racers, T, objs, auto: false, speed: 1, get state() { return state; }, laps };
        dbg.go = () => { state = 'go'; cnt = -1; countEl.textContent = ''; };
        const toast = (m, d = 1.3) => { toastEl._v = m; toastEl.textContent = m; toastT = d; };
        const rank = (r) => { const sc = (a) => (a.fin != null ? 1e9 - a.fin : a.prog); let k = 1; for (const o of racers) if (o !== r && sc(o) > sc(r)) k++; return k; };
        const ordered = () => racers.slice().sort((a, b) => (b.fin != null ? 1e9 - b.fin : b.prog) - (a.fin != null ? 1e9 - a.fin : a.prog));

        // 아이템·스킬
        const randItem = (r) => { const k = rank(r), pool = k >= 3 ? ['boost', 'boost', 'missile', 'shield', 'banana'] : k === 2 ? ['boost', 'missile', 'shield', 'banana'] : ['shield', 'banana', 'banana', 'boost']; return G.pick(pool); };
        function hit(r, kind, dur) {
          if (r.fin != null) return false;
          if (r.shield > 0) { r.shield = 0; if (r.isPlayer) toast('🛡️ 막았어요!'); return false; }
          if (kind === 'freeze') r.frozen = Math.max(r.frozen, dur); else { r.stun = Math.max(r.stun, dur); }
          r.v *= 0.3; if (r.isPlayer) { G.sfx.bad(); toast(kind === 'freeze' ? '🧊 꽁꽁!' : '😵 앗!'); } return true;
        }
        const drop = (kind, r, back) => objs.push({ k: kind, x: r.x + Math.cos(r.h) * back, y: r.y + Math.sin(r.h) * back, life: kind === 'oil' ? 14 : 18, owner: r, grace: 0.6, r: kind === 'oil' ? 40 : 24 });
        function shoot(kind, r, sp, life, tgt) { objs.push({ k: kind, x: r.x + Math.cos(r.h) * 34, y: r.y + Math.sin(r.h) * 34, h: r.h, sp, life, owner: r, grace: 0.25, r: 22, tgt }); }
        function useItem(r) {
          if (state !== 'go' || !r.item || r.fin != null) return;
          const it = r.item; r.item = null;
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
            case 'turbo': r.boost = Math.max(r.boost, 2.2); r.boostMul = 1.5; break;
            case 'shield': r.shield = 3; break;
            case 'trap': drop('trap', r, -34); break;
            case 'oil': drop('oil', r, -44); break;
            case 'ice': shoot('ice', r, 900, 1.1, null); break;
            case 'wave': fx.push({ k: 'ring', x: r.x, y: r.y, t: 0, life: 0.5 });
              for (const o of racers) if (o !== r) { const dx = o.x - r.x, dy = o.y - r.y, d = Math.hypot(dx, dy) || 1; if (d < 230) { if (hit(o, 'spin', 0.8)) { o.vx += dx / d * 300; o.vy += dy / d * 300; } } } break;
            case 'magnet': if (!r.item) r.item = randItem(r); else { r.boost = Math.max(r.boost, 0.9); } break;
          }
          r.cd[slot] = sk.cd; if (r.isPlayer) { G.sfx.ok(); toast(sk.e + ' ' + sk.n + '!'); } return true;
        }

        dbg.useSkill = useSkill; dbg.useItem = useItem; dbg.hit = hit; dbg.objs = objs;
        // 컴퓨터 선수 조종
        function aiThink(r, dt) {
          const look = 5 + Math.floor(r.v / 55), c = P[(r.idx + look) % M], tx = c.x + c.nx * r.lane * hw * 0.6, ty = c.y + c.ny * r.lane * hw * 0.6;
          r.steerIn = clamp(angDiff(Math.atan2(ty - r.y, tx - r.x), r.h) * 2.6, -1, 1);
          const a = P[r.idx], b = P[(r.idx + 16) % M], curve = Math.abs(Math.atan2(a.tx * b.ty - a.ty * b.tx, a.tx * b.tx + a.ty * b.ty));
          r.throttle = clamp(1 - curve * 0.55, 0.62, 1);
          const gap = r.prog - me.prog; let rb = 1; if (!r.isPlayer) { if (gap < -50) rb = 1.06; else if (gap > 60) rb = 0.94; } r.rb = rb;
          r.aiT -= dt; if (r.aiT > 0) return; r.aiT = 0.45 + rnd() * 0.3;
          const near = (maxD, ahead) => racers.some((o) => { if (o === r) return false; const dx = o.x - r.x, dy = o.y - r.y, d = Math.hypot(dx, dy), fw = (dx * Math.cos(r.h) + dy * Math.sin(r.h)) > 0; return d < maxD && (ahead === undefined || ahead === fw); });
          const p = hard ? 0.7 : 0.4;
          if (r.item && rnd() < p) { if (r.item === 'missile') { if (near(600, true)) useItem(r); } else if (r.item === 'banana') { if (near(260, false)) useItem(r); } else if (curve < 0.3) useItem(r); }
          for (const s of [0, 1]) { if (r.cd[s] > 0 || rnd() > p * 0.6) continue; const id = (s === 0 ? r.ch : r.car).skill.id;
            if ((id === 'dash' || id === 'turbo') && curve < 0.25) useSkill(r, s); else if (id === 'shield' && near(180)) useSkill(r, s);
            else if ((id === 'trap' || id === 'oil') && near(260, false)) useSkill(r, s); else if (id === 'ice' && near(450, true)) useSkill(r, s);
            else if (id === 'wave' && near(170)) useSkill(r, s); else if (id === 'magnet' && !r.item) useSkill(r, s); }
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
          else if (r.isPlayer && !dbg.auto) r.steerIn = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), r.throttle = 1;
          else aiThink(r, dt);
          if (r.fin != null) { r.steerIn = clamp(r.steerIn, -1, 1); r.throttle = 0.6; }
          r.boost = Math.max(0, r.boost - dt); r.shield = Math.max(0, r.shield - dt); r.stun = Math.max(0, r.stun - dt); r.frozen = Math.max(0, r.frozen - dt);
          for (let s = 0; s < 2; s++) r.cd[s] = Math.max(0, r.cd[s] - dt);
          const steer = r.stun > 0 || r.frozen > 0 ? 0 : r.steerIn;
          let surf = r.off ? r.offF : 1, grip = 7, turnK = 1;
          for (const z of T.haz) {
            const dx = r.x - z.x, dy = r.y - z.y; if (dx * dx + dy * dy > z.r * z.r) continue;
            if (z.type === 'boost') { if (r.boost < 0.9) { r.boost = 1.0; r.boostMul = 1.4; if (r.isPlayer) G.sfx.pop(); } }
            else if (z.type === 'slow') surf *= 0.5;
            else if (z.type === 'ice' && !r.iceImm) { grip = 1.1; turnK = 0.7; }
          }
          let maxV = r.maxV * (r.boost > 0 ? r.boostMul : 1) * (r.isPlayer ? 1 : AI.mul * r.aiVar * (r.rb || 1)) * r.throttle * surf;
          if (r.frozen > 0) maxV = 0; else if (r.stun > 0) maxV = Math.min(maxV, r.maxV * 0.3);
          if (r.v < maxV) r.v = Math.min(maxV, r.v + r.acc * dt * (r.boost > 0 ? 2.4 : 1)); else r.v = Math.max(maxV, r.v - (r.off ? 540 : 230) * dt);
          r.h += steer * r.turn * turnK * Math.min(1, r.v / 170) * dt;
          const k = 1 - Math.exp(-grip * dt); r.vx += (Math.cos(r.h) * r.v - r.vx) * k; r.vy += (Math.sin(r.h) * r.v - r.vy) * k;
          r.x += r.vx * dt; r.y += r.vy * dt;
          r.spin = r.stun > 0 ? r.spin + dt * 13 : 0;
          locate(r);
          const L = r.off_lat; r.off = Math.abs(L) > hw + 6;
          if (Math.abs(L) > WALL) { const c = P[r.idx], sg = Math.sign(L), push = L - sg * WALL; r.x -= c.nx * push; r.y -= c.ny * push; const vn = r.vx * c.nx + r.vy * c.ny; if (vn * sg > 0) { r.vx -= c.nx * vn * 1.3; r.vy -= c.ny * vn * 1.3; } r.v *= 0.85; }
          // 박스 줍기
          for (let i = 0; i < T.boxes.length; i++) { if (boxT[i] > 0) continue; const b = T.boxes[i]; if ((b.x - r.x) ** 2 + (b.y - r.y) ** 2 < 900) { boxT[i] = 4; if (!r.item && r.fin == null) { r.item = randItem(r); if (r.isPlayer) { G.sfx.ok(); toast(ITEMS[r.item].e + ' 아이템!', 1); } } } }
          // 멈춰서 꼼짝 못하면 길 위로 되돌리기
          if (state === 'go' && r.v < 25 && r.stun <= 0 && r.frozen <= 0) r.stuck += dt; else r.stuck = 0;
          if (r.stuck > 2.2) { const c = P[r.idx]; r.x = c.x; r.y = c.y; r.h = Math.atan2(c.ty, c.tx); r.vx = r.vy = r.v = 0; r.stuck = 0; r.prevIdx = r.idx; }
          if (r.fin == null && r.lap >= laps + 1) { r.fin = t; if (r.isPlayer) { finishing = 1.4; toast('🏁 골인!', 2); } }
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
            for (const r of racers) { if (gone) break; if (o.grace > 0 && r === o.owner) continue; const d = (r.x - o.x) ** 2 + (r.y - o.y) ** 2; if (d > (o.r + 16) ** 2) continue;
              if (o.k === 'banana') { hit(r, 'spin', 1.2); gone = true; } else if (o.k === 'trap') { if (hit(r, 'spin', 1.6)) r.v *= 0.5; gone = true; }
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
            const nx = dx / d, ny = dy / d, ov = 34 - d, wa = b.mass / (a.mass + b.mass), wb = a.mass / (a.mass + b.mass);
            a.x -= nx * ov * wa; a.y -= ny * ov * wa; b.x += nx * ov * wb; b.y += ny * ov * wb;
            const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
            if (rv < 0) { const imp = -rv * 1.4 / (1 / a.mass + 1 / b.mass); a.vx -= nx * imp / a.mass; a.vy -= ny * imp / a.mass; b.vx += nx * imp / b.mass; b.vy += ny * imp / b.mass; a.v *= 0.96; b.v *= 0.96; }
            if (a.shield > 0 && b.shield <= 0) b.v *= 0.6; else if (b.shield > 0 && a.shield <= 0) a.v *= 0.6;
          }
        }

        // ───────── 그리기 ─────────
        function carShape(c, car) {
          const col = car.color; c.fillStyle = '#222';
          for (const [x, y] of [[-14, -13], [-14, 13], [13, -13], [13, 13]]) c.fillRect(x - 6, y - 4, 12, 8);
          c.fillStyle = col; c.beginPath(); c.roundRect(-24, -14, 48, 28, 8); c.fill();
          c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.roundRect(-6, -10, 16, 20, 5); c.fill();
          c.fillStyle = '#ffeb85'; c.fillRect(21, -11, 3, 6); c.fillRect(21, 5, 3, 6);
          if (car.id === 'bolt') { c.fillStyle = '#fff'; c.fillRect(-24, -3, 36, 6); c.fillStyle = '#222'; c.fillRect(-27, -14, 5, 28); }
          else if (car.id === 'tank') { c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(-20, -10, 3, 20); c.fillRect(-12, -10, 3, 20); }
          else if (car.id === 'slide') { c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(-24, -12, 14, 24); }
          else { c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(-22, -2, 10, 4); }
        }
        const kartSpr = (car) => sprite('kart:' + car.id, 120, 80, (g) => { g.scale(2, 2); g.translate(30, 20); carShape(g, car); });
        const runs = [], ord = racers.slice();
        let alpha = 0, pcamH = camH, lowQ = false;
        function draw() {
          const zoom = Math.max(H / 680, 0.5 * dpr);
          for (const r of racers) { r.dx = r.px + (r.x - r.px) * alpha; r.dy = r.py + (r.y - r.py) * alpha; r.dh = r.ph + angDiff(r.h, r.ph) * alpha; }
          const px = me.dx, py = me.dy, rot = Math.PI / 2 + pcamH + angDiff(camH, pcamH) * alpha;
          ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = th.bg; ctx.fillRect(0, 0, W, H);
          ctx.translate(W / 2, H * 0.72); ctx.scale(zoom, zoom); ctx.rotate(-rot); ctx.translate(-px, -py);
          const rad = Math.hypot(W / 2, H * 0.72) / zoom + hw * 1.8, rad2 = rad * rad;
          // 도로: 화면에 보이는 구간만 긋는다
          runs.length = 0; let cur = null;
          for (let k = 0; k < M; k++) { const c = P[k]; if ((c.x - px) * (c.x - px) + (c.y - py) * (c.y - py) < rad2) { if (!cur) { cur = { s: k, n: 0 }; runs.push(cur); } cur.n++; } else cur = null; }
          if (runs.length > 1 && runs[0].s === 0 && runs[runs.length - 1].s + runs[runs.length - 1].n === M) { const f = runs.shift(), l = runs[runs.length - 1]; l.n += f.n; }
          ctx.lineJoin = 'round';
          for (const r of runs) {
            const pth = new Path2D(), s0 = r.s * T.ds;
            for (let i = 0; i < r.n; i++) { const c = P[(r.s + i) % M]; if (i) pth.lineTo(c.x, c.y); else pth.moveTo(c.x, c.y); }
            ctx.setLineDash([]); ctx.lineCap = 'round';
            ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = hw * 3 + 14; ctx.stroke(pth);
            ctx.strokeStyle = th.shoulder; ctx.lineWidth = hw * 3; ctx.stroke(pth);
            ctx.strokeStyle = th.curb[0]; ctx.lineWidth = hw * 2 + 18; ctx.stroke(pth);
            ctx.setLineDash([34, 34]); ctx.lineDashOffset = s0 % 68; ctx.lineCap = 'butt'; ctx.strokeStyle = th.curb[1]; ctx.stroke(pth);
            ctx.setLineDash([]); ctx.lineCap = 'round'; ctx.strokeStyle = th.road; ctx.lineWidth = hw * 2; ctx.stroke(pth);
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
            ctx.save(); ctx.translate(b.x, b.y); ctx.save(); ctx.rotate(t * 1.6 + i); ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#c98a00'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(-14, -14, 28, 28, 6); ctx.fill(); ctx.stroke(); ctx.restore();
            ctx.rotate(rot); ctx.drawImage(qs, -12, -12, 24, 24); ctx.restore(); }
          // 장식 (느린 기기에서는 절반만)
          for (let i = 0; i < T.decos.length; i++) { if (lowQ && (i & 1)) continue; const d = T.decos[i]; if ((d.x - px) ** 2 + (d.y - py) ** 2 > rad2) continue; ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(rot); stamp(ctx, d.e, d.s); ctx.restore(); }
          // 던진 것
          for (const o of objs) { const ox = (o.px === undefined ? o.x : o.px + (o.x - o.px) * alpha), oy = (o.py === undefined ? o.y : o.py + (o.y - o.py) * alpha); ctx.save(); ctx.translate(ox, oy);
            if (o.k === 'oil') { ctx.fillStyle = 'rgba(20,20,30,.85)'; ctx.beginPath(); ctx.ellipse(0, 0, o.r, o.r * 0.75, 0.3, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(120,140,255,.35)'; ctx.beginPath(); ctx.ellipse(-8, -6, o.r * 0.4, o.r * 0.2, 0.3, 0, TAU); ctx.fill(); }
            else { ctx.rotate(rot); stamp(ctx, o.k === 'banana' ? '🍌' : o.k === 'trap' ? '🪤' : o.k === 'ice' ? '🧊' : '🎯', 34); }
            ctx.restore(); }
          // 차 (아래쪽에 있는 차를 위에 그린다)
          for (let i = 1; i < ord.length; i++) { const v = ord[i]; let j = i - 1; while (j >= 0 && ord[j].dy > v.dy) { ord[j + 1] = ord[j]; j--; } ord[j + 1] = v; }
          for (const r of ord) {
            ctx.save(); ctx.translate(r.dx, r.dy);
            if (r.boost > 0) { ctx.save(); ctx.rotate(r.dh); ctx.fillStyle = '#ff9f1c'; ctx.beginPath(); ctx.moveTo(-24, -9); ctx.lineTo(-24 - 18 - rnd() * 10, 0); ctx.lineTo(-24, 9); ctx.fill(); ctx.restore(); }
            ctx.save(); ctx.rotate(r.dh + r.spin); ctx.drawImage(kartSpr(r.car), -30, -20, 60, 40); ctx.restore();
            ctx.save(); ctx.rotate(rot); stamp(ctx, r.ch.e, 26);
            if (r.isPlayer) { ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-8, -40); ctx.lineTo(8, -40); ctx.lineTo(0, -28); ctx.closePath(); ctx.stroke(); ctx.fill(); }
            if (r.shield > 0) { ctx.strokeStyle = 'rgba(80,220,255,.9)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 30 + Math.sin(t * 10) * 2, 0, TAU); ctx.stroke(); }
            if (r.frozen > 0) { ctx.globalAlpha = 0.85; stamp(ctx, '🧊', 44); ctx.globalAlpha = 1; }
            ctx.restore(); ctx.restore();
          }
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
          setTxt(badge, `🏁 ${k}등 / 4  ·  🔁 ${lap}/${laps}`);
          setTxt(bItem._em, me.item ? ITEMS[me.item].e : '·'); bItem.classList.toggle('ready', !!me.item);
          [[bS1, me.ch.skill, 0], [bS2, me.car.skill, 1]].forEach(([b, sk, i]) => { if (b._sk !== sk) { b._sk = sk; b._em.textContent = sk.e; b.querySelector('small').textContent = sk.n; } const h = (me.cd[i] > 0 ? Math.round(me.cd[i] / sk.cd * 100) : 0) + '%'; if (b._h !== h) { b._h = h; b._cd.style.height = h; } });
        }

        // 반복
        const kd = (e) => { const k = e.key; if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.left = true; else if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.right = true; else if (k === ' ') useItem(me); else if (k === 'z' || k === 'Z') useSkill(me, 0); else if (k === 'x' || k === 'X') useSkill(me, 1); else return; e.preventDefault(); };
        const ku = (e) => { const k = e.key; if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.left = false; else if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.right = false; };
        addEventListener('keydown', kd); addEventListener('keyup', ku);
        toast('준비!', 1);
        function end() {
          if (over) return; over = true;
          const k = rank(me); G.win({ stars: k === 1 ? 3 : k === 2 ? 2 : 1, text: (k === 1 ? '🏆 1등!' : k + '등으로 들어왔어요') + ` · ${TD.n}` });
        }
        const STEP = 1 / 60;
        let acc = 0, ema = STEP, nF = 0, lastDown = -99;
        function simStep(dt) {
          for (const r of racers) { r.px = r.x; r.py = r.y; r.ph = r.h; }
          for (const o of objs) { o.px = o.x; o.py = o.y; }
          t += dt; pcamH = camH;
          if (state === 'count') { cnt -= dt; const n = Math.ceil(cnt); setTxt(countEl, n > 0 ? String(n) : '출발!'); if (cnt <= -0.6) { state = 'go'; setTxt(countEl, ''); } }
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
          acc += raw * (dbg.speed || 1);
          for (let n = 0; acc >= STEP && n < 8; n++) { simStep(STEP); acc -= STEP; }
          if (acc >= STEP) acc = 0;
          alpha = acc / STEP;
          const d0 = performance.now(); draw(); if (dbg.sync) ctx.getImageData(0, 0, 1, 1); if (dbg.rec) dbg.ms.push([performance.now() - d0, Math.abs(me.steerIn)]);
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
        stopFn = () => { cancelAnimationFrame(raf); ro.disconnect(); removeEventListener('keydown', kd); removeEventListener('keyup', ku); if (G.raceDebug === dbg) G.raceDebug = null; };
      }

      showChars();
      return () => { if (stopFn) stopFn(); };
    },
  });
})();
