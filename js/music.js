// 레이싱 음악·효과음: 파일 없이 웹오디오로 직접 연주한다 (저작물 없음).
// 경기장마다 음계·빠르기·악기·드럼이 다르고, 하드 모드는 더 빠르고 음이 많다.
(function () {
  'use strict';
  const G = window.G;
  const SC = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], harm: [0, 2, 3, 5, 7, 8, 11], phryd: [0, 1, 4, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], mixo: [0, 2, 4, 5, 7, 9, 10], lyd: [0, 2, 4, 6, 7, 9, 11] };
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const deg2midi = (T, d) => { const i = d - 1, o = Math.floor(i / 7), k = ((i % 7) + 7) % 7; return T.root + SC[T.scale][k] + 12 * o; };
  const TONES = [0, 2, 4, 7, 9]; // 코드 뿌리 기준 칸 수: 뿌리·3도·5도·옥타브·9도

  // 경기장 id → 음악. bpm 빠르기, root 으뜸음(MIDI), prog 4마디 코드(음계 칸), rhythm 멜로디 박자(16칸),
  // bass/k(킥)/s(스네어)/h(하이햇)/r(림) 16칸 패턴, arp 아르페지오(숫자=코드 음), lead/bassType/arpType 악기
  const THEMES = {
    meadow: { bpm: 128, root: 60, scale: 'major', prog: [1, 5, 6, 4], lead: 'square', leadOct: 7, rhythm: 'x.x.xx.xx.x.xx.x', bass: 'x.x.x.x.x.x.x.xo', bassType: 'tri', k: 'x...x...x...x...', s: '....x.......x...', h: '..x...x...x...x.', arp: '0.2.1.2.0.2.1.2.', arpType: 'pluck', seed: 7 },
    desert: { bpm: 112, root: 62, scale: 'phryd', prog: [1, 2, 1, 7], lead: 'saw', leadOct: 7, rhythm: 'x..xx.x.x..xx.x.', bass: 'x..x..x.x..x..xo', bassType: 'saw', k: 'x..x..x.x..x....', s: '....x.......x..x', h: 'x.x.x.x.x.x.x.x.', r: '..x...x...x...x.', arp: '', arpType: 'pluck', seed: 21 },
    snow: { bpm: 118, root: 64, vol: 1.2, scale: 'major', prog: [1, 3, 4, 5], lead: 'bell', leadOct: 7, rhythm: 'x...x.x.x...x.x.', bass: 'x.......x.......', bassType: 'sine', k: 'x.......x.......', s: '........x.......', h: '..x...x...x...x.', arp: '0.1.2.3.2.1.0.1.', arpType: 'bell', pad: true, seed: 33 },
    beach: { bpm: 124, root: 63, vol: 1.25, scale: 'mixo', prog: [1, 4, 1, 5], lead: 'pluck', leadOct: 7, rhythm: 'x..x..x...x..x..', bass: 'x..x..x.x..x..x.', bassType: 'tri', k: 'x.....x.x.......', s: '....x.......x...', h: '..x...x...x...x.', r: '.x..x.x..x..x.x.', arp: '', arpType: 'pluck', swing: 0.14, seed: 44 },
    candy: { bpm: 132, root: 62, vol: 1.1, scale: 'lyd', prog: [1, 2, 5, 1], lead: 'pluck', leadOct: 7, arpOct: 14, rhythm: 'x.xxx.x.xx.xx.x.', bass: 'x.x.x.x.x.x.x.x.', bassType: 'tri', k: 'x...x...x...x...', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', arp: '0.1.2.1.0.1.2.3.', arpType: 'bell', seed: 55 },
    city: { bpm: 138, root: 61, vol: 0.82, scale: 'minor', prog: [1, 6, 3, 7], lead: 'saw', leadOct: 7, arpOct: 7, rhythm: 'x.xx.xx.x.xx.xx.', bass: 'xxxxxxxxxxxxxxxx', bassType: 'saw', k: 'x...x...x...x...', s: '....x.......x...', h: '..x...x...x...x.', arp: '0.1.2.1.0.1.2.3.', arpType: 'pluck', seed: 66 },
    lava: { bpm: 150, root: 52, vol: 0.85, scale: 'harm', prog: [1, 6, 5, 1], lead: 'saw', leadOct: 14, rhythm: 'x.xxx.xx.xxx.xx.', bass: 'xxxxxxxxxxxxxxxx', bassType: 'saw', k: 'x..xx..xx..xx.x.', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', arp: '', arpType: 'pluck', seed: 77 },
    space: { bpm: 132, root: 66, scale: 'dorian', prog: [1, 4, 7, 5], lead: 'sine', leadOct: 7, arpOct: 14, rhythm: 'x...x..x....x...', bass: 'x.......x.......', bassType: 'sine', k: 'x.......x.......', s: '........x.......', h: '..x...x...x...x.', arp: '0.1.2.3.4.3.2.1.', arpType: 'bell', pad: true, delay: true, seed: 88 },
  };
  const onset = (p) => [...p].map((c) => c !== '.' && c !== ' ');

  // 멜로디: 코드 뿌리를 기준으로 한 높이(칸 수)로 만든 뒤 마디마다 그 코드에 얹는다(화음에 어울리게). 8마디를 한 바퀴로 돈다.
  function compose(T) {
    const rnd = rng(T.seed), on = onset(T.rhythm);
    const phrase = (cadence) => {
      const bar = new Array(16).fill(null); let cur = TONES[(rnd() * 4) | 0];
      for (let s = 0; s < 16; s++) if (on[s]) {
        if (s % 4 === 0) { const sorted = TONES.slice().sort((a, b) => Math.abs(a - cur) - Math.abs(b - cur)); cur = sorted[Math.min(sorted.length - 1, rnd() < 0.7 ? 0 : 1)]; }
        else { const st = [-2, -1, -1, 1, 1, 2, 3][(rnd() * 7) | 0]; cur = Math.max(-2, Math.min(9, cur + st)); }
        bar[s] = cur;
      }
      if (cadence) { const last = bar.map((v, i) => (v !== null ? i : -1)).filter((i) => i >= 0).pop(); if (last !== undefined) bar[last] = 0; }
      return bar;
    };
    const A = phrase(false), A2 = A.slice(), B = phrase(false), C = phrase(true);
    for (let s = 12; s < 16; s++) if (on[s]) A2[s] = TONES[(rnd() * 3) | 0];
    return [A, A2, A, B, A, A2, B, C];
  }

  // ───── 악기 ─────
  const noiseCache = new WeakMap();
  function noise(c) { let b = noiseCache.get(c); if (!b) { b = c.createBuffer(1, c.sampleRate, c.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; noiseCache.set(c, b); } return b; }
  function env(c, dest, t, dur, vol, a, r, pluck) {
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + a);
    if (pluck) g.gain.exponentialRampToValueAtTime(0.0001, t + dur); else { g.gain.setValueAtTime(vol, t + Math.max(a, dur - r)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
    g.connect(dest); return g;
  }
  function osc(c, dest, type, f, t, dur, vol, o) {
    o = o || {}; const g = env(c, dest, t, dur, vol, o.a != null ? o.a : 0.006, o.r != null ? o.r : 0.05, o.pluck);
    let node = g; if (o.lp) { const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.lp; lp.connect(g); node = lp; }
    for (const dt of o.det || [0]) { const os = c.createOscillator(); os.type = type; os.frequency.setValueAtTime(f, t); os.detune.value = dt; os.connect(node); os.start(t); os.stop(t + dur + 0.03); }
  }
  function voice(c, dest, kind, f, t, dur, vol) {
    switch (kind) {
      case 'square': osc(c, dest, 'square', f, t, dur, vol * 0.7, { det: [-6, 6], lp: 3200 }); break;
      case 'saw': osc(c, dest, 'sawtooth', f, t, dur, vol * 0.8, { det: [-8, 8], lp: 2400 }); break;
      case 'tri': osc(c, dest, 'triangle', f, t, dur, vol); break;
      case 'sine': osc(c, dest, 'sine', f, t, dur, vol); break;
      case 'pluck': osc(c, dest, 'square', f, t, Math.min(dur, 0.22), vol * 0.8, { pluck: true, lp: 3000 }); break;
      case 'bell': osc(c, dest, 'sine', f, t, Math.max(dur, 0.7), vol, { pluck: true }); osc(c, dest, 'sine', f * 2.01, t, 0.5, vol * 0.4, { pluck: true }); osc(c, dest, 'sine', f * 3.98, t, 0.3, vol * 0.2, { pluck: true }); break;
      case 'pad': osc(c, dest, 'triangle', f, t, dur, vol, { a: Math.min(0.25, dur / 3), r: 0.3, det: [-5, 5] }); break;
    }
  }
  function kick(c, d, t, v) { const o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.13); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.24); o.connect(g); g.connect(d); o.start(t); o.stop(t + 0.26); }
  function nz(c, d, t, dur, v, type, f, q) { const s = c.createBufferSource(); s.buffer = noise(c); const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q || 0.7; const g = c.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); s.connect(fl); fl.connect(g); g.connect(d); s.start(t); s.stop(t + dur + 0.02); }
  const snare = (c, d, t, v) => { nz(c, d, t, 0.17, v, 'bandpass', 1800, 0.8); osc(c, d, 'triangle', 190, t, 0.09, v * 0.5, { pluck: true }); };
  const hat = (c, d, t, v, open) => nz(c, d, t, open ? 0.14 : 0.045, v, 'highpass', 7000);
  const rim = (c, d, t, v) => nz(c, d, t, 0.035, v, 'bandpass', 3200, 2);

  // ───── 연주 ─────
  function build(c, name, hard, dest, live) {
    const T = THEMES[name] || THEMES.meadow, bpm = T.bpm * (hard ? 1.1 : 1);
    const master = c.createGain(); const vol = 0.5 * (T.vol || 1); master.gain.value = live ? 0.0001 : vol;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; master.connect(comp); comp.connect(dest);
    const lead = c.createGain(); lead.connect(master);
    if (T.delay) { const dl = c.createDelay(1); dl.delayTime.value = (60 / bpm) * 0.75; const fb = c.createGain(); fb.gain.value = 0.38; const wet = c.createGain(); wet.gain.value = 0.4; lead.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(master); }
    return { c, T, hard, bpm, vol, dur: 60 / bpm / 4, master, lead, bars: compose(T), step: 0, next: 0, timer: 0,
      pat: { k: onset(T.k), s: onset(T.s), h: onset(hard ? 'x.x.x.x.x.x.x.x.' : T.h), r: onset(T.r || ''), bass: [...T.bass], arp: [...(T.arp || (hard ? '0.2.3.2.0.2.3.2.' : ''))] } };
  }
  function schedule(S, step, t0) {
    const { c, T, pat } = S, bar = Math.floor(step / 16) % 8, s = step % 16, root = T.prog[bar % 4], dur = S.dur;
    const t = t0 + (T.swing && s % 2 === 1 ? T.swing * dur : 0), m = S.master;
    if (pat.k[s]) kick(c, m, t0, 0.55);
    if (pat.s[s]) snare(c, m, t0, 0.22);
    if (bar === 7 && s >= 12) snare(c, m, t0, 0.14); // 마디 끝 필인
    if (pat.h[s]) hat(c, m, t, 0.07, s % 8 === 6);
    if (pat.r[s]) rim(c, m, t, 0.1);
    const bc = pat.bass[s];
    if (bc && bc !== '.') { const d = root - 14 + (bc === 'o' ? 7 : bc === 'f' ? 4 : 0); voice(c, m, T.bassType, mtof(deg2midi(T, d)), t0, dur * 1.7, 0.2); }
    const off = S.bars[bar][s];
    if (off !== null && off !== undefined) { let n = 1; while (n < 4 && S.bars[bar][(s + n) % 16] == null && s + n < 16) n++; voice(c, S.lead, T.lead, mtof(deg2midi(T, root + T.leadOct + off)), t, dur * (n * 0.92), T.lead === 'bell' ? 0.1 : 0.13); }
    const ac = pat.arp[s];
    if (ac && ac !== '.') voice(c, S.lead, T.arpType, mtof(deg2midi(T, root + (T.arpOct != null ? T.arpOct : T.leadOct - 7) + TONES[+ac])), t, dur * 1.6, 0.07);
    if (T.pad && s === 0) for (const k of [0, 2, 4]) voice(c, m, 'pad', mtof(deg2midi(T, root + k)), t0, dur * 16 * 0.98, 0.05);
  }

  // ───── 실시간 재생 ─────
  let S = null, want = null, musicOn = G.store.get('race:music', true), holds = new Set();
  const ctx = () => (G.audioCtx ? G.audioCtx() : null);
  const active = () => G.soundOn && musicOn && holds.size === 0;
  function tick() { if (!S) return; const c = S.c; if (c.state === 'suspended') c.resume(); if (S.next < c.currentTime - 0.1) S.next = c.currentTime + 0.05; while (S.next < c.currentTime + 0.25) { schedule(S, S.step, S.next); S.next += S.dur; S.step++; } }
  function halt(fade) { if (!S) return; const o = S; S = null; clearInterval(o.timer); try { o.master.gain.cancelScheduledValues(o.c.currentTime); o.master.gain.setValueAtTime(o.master.gain.value, o.c.currentTime); o.master.gain.linearRampToValueAtTime(0.0001, o.c.currentTime + fade); } catch (e) {} setTimeout(() => { try { o.master.disconnect(); o.lead.disconnect(); } catch (e) {} }, fade * 1000 + 600); }
  function launch() { if (S || !want || !active()) return; const c = ctx(); if (!c) return; S = build(c, want.name, want.hard, c.destination, true); S.next = c.currentTime + 0.06; S.master.gain.linearRampToValueAtTime(S.vol, c.currentTime + 0.5); tick(); S.timer = setInterval(tick, 40); }

  // ───── 효과음: 카운트다운 · 출발 · 골인 ─────
  const ready = () => G.soundOn && ctx();
  function countdown(n) {
    const c = ready(); if (!c) return; const t = c.currentTime + 0.01, d = c.destination;
    if (n > 0) { osc(c, d, 'square', 523.25, t, 0.2, 0.2, { lp: 3000 }); osc(c, d, 'sine', 261.6, t, 0.2, 0.15); return; }
    for (const f of [523.25, 659.25, 783.99, 1046.5]) osc(c, d, 'sawtooth', f, t, 0.7, 0.07, { lp: 3200, det: [-6, 6] });
    nz(c, d, t, 0.6, 0.08, 'bandpass', 1800, 0.6); kick(c, d, t, 0.32);
  }
  function goal(rank) {
    halt(0.45); const c = ready(); if (!c) return; const t = c.currentTime + 0.05, d = c.destination;
    const brass = (f, tt, dur, v) => osc(c, d, 'sawtooth', f, tt, dur, v, { lp: 2800, det: [-7, 7] });
    nz(c, d, t, 1.3, 0.09, 'highpass', 4500); kick(c, d, t, 0.32);
    if (rank === 1) { [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5].forEach((f, i) => brass(f, t + i * 0.11, 0.14, 0.075)); for (const f of [523.25, 659.25, 783.99, 1046.5]) brass(f, t + 0.7, 1.0, 0.075);
      for (let i = 0; i < 26; i++) nz(c, d, t + 0.6 + i * 0.06 + Math.random() * 0.05, 0.12, 0.04, 'bandpass', 1500 + Math.random() * 2500, 0.8); }
    else if (rank === 2) { [523.25, 659.25, 783.99].forEach((f, i) => brass(f, t + i * 0.12, 0.14, 0.075)); for (const f of [523.25, 659.25, 783.99]) brass(f, t + 0.4, 0.7, 0.07); }
    else { [392, 523.25, 659.25].forEach((f, i) => osc(c, d, 'triangle', f, t + i * 0.14, i === 2 ? 0.6 : 0.16, 0.12)); }
  }

  G.music = {
    THEMES,
    play(name, hard) { want = { name, hard: !!hard }; halt(0.2); launch(); },
    stop() { want = null; halt(0.3); },
    hold(why) { holds.add(why); if (S) { clearInterval(S.timer); try { S.master.gain.cancelScheduledValues(S.c.currentTime); S.master.gain.setValueAtTime(S.master.gain.value, S.c.currentTime); S.master.gain.linearRampToValueAtTime(0.0001, S.c.currentTime + 0.12); } catch (e) {} const o = S; S = null; setTimeout(() => { try { o.master.disconnect(); o.lead.disconnect(); } catch (e) {} }, 400); } },
    release(why) { holds.delete(why); launch(); },
    onSound() { if (!G.soundOn) { const w = want; halt(0.15); want = w; } else launch(); },
    setOn(b) { musicOn = !!b; G.store.set('race:music', musicOn); if (!musicOn) { const w = want; halt(0.2); want = w; } else launch(); },
    isOn: () => musicOn,
    status: () => ({ playing: !!S, name: want && want.name, hard: want && want.hard, holds: [...holds], bpm: S && Math.round(S.bpm) }),
    countdown, goal,
    // 시험용: 소리 없이 음악을 파일처럼 만들어 본다
    render(name, hard, secs) { const sr = 22050, c = new OfflineAudioContext(1, Math.floor(sr * secs), sr), o = build(c, name, hard, c.destination, false); for (let t = 0; t < secs; t += o.dur) { schedule(o, o.step, t); o.step++; } return c.startRendering(); },
  };
  document.addEventListener('visibilitychange', () => { if (document.hidden) G.music.hold('hidden'); else G.music.release('hidden'); });
})();
