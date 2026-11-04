// 공통 도우미: 요소 만들기, 저장, 소리, 별, 화면 전환, 결과 창
(function () {
  'use strict';
  const G = (window.G = { games: [], cats: [
    { id: 'all', name: '전체', icon: '🎈' },
    { id: 'draw', name: '그리기', icon: '🎨' },
    { id: 'match', name: '찾기·맞추기', icon: '🔍' },
    { id: 'play', name: '놀이', icon: '🎮' },
  ] });

  G.register = (g) => G.games.push(g);
  G.$ = (s, r = document) => r.querySelector(s);

  G.h = (tag, attrs, ...kids) => {
    const e = document.createElement(tag);
    for (const k in attrs || {}) {
      const v = attrs[k];
      if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (v === true) e.setAttribute(k, '');
      else if (v !== false && v != null) e.setAttribute(k, v);
    }
    for (const c of kids.flat()) if (c != null) e.append(c);
    return e;
  };

  G.shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  G.pick = (a) => a[(Math.random() * a.length) | 0];
  // 같은 것이 연달아 나오지 않게, 종류를 한 바퀴 다 돌고 나서 다시 섞는다 (key별)
  const bags = {};
  G.bag = (key, n) => { if (!bags[key] || !bags[key].length) { const last = bags[key + ':last']; let b = G.shuffle([...Array(n).keys()]); if (b.length > 1 && b[b.length - 1] === last) b.unshift(b.pop()); bags[key] = b; } const v = bags[key].pop(); bags[key + ':last'] = v; return v; };
  // 칸 수에 맞는 격자 모양 (가로/세로 화면에 따라)
  G.dims = (n) => {
    const target = innerWidth > innerHeight ? 1.35 : 0.75; let best = null;
    for (let c = 2; c <= 8; c++) { const r = Math.ceil(n / c), sc = (c * r - n) * 3 + Math.abs(c / r - target); if (!best || sc < best.sc) best = { c, r, sc }; }
    return best;
  };

  // 저장 (시크릿 모드 등에서 막혀도 동작)
  G.store = {
    get(k, d) { try { const v = localStorage.getItem('game:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('game:' + k, JSON.stringify(v)); } catch (e) {} },
  };

  // 소리 (파일 없이 직접 만든다)
  let ac = null;
  G.soundOn = G.store.get('sound', true);
  function ctx() {
    if (!ac) { const C = window.AudioContext || window.webkitAudioContext; if (C) ac = new C(); }
    if (ac && ac.state === 'suspended') ac.resume();
    return ac;
  }
  function tone(f, t0, d, type, v) {
    const c = G.soundOn && ctx(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain(), s = c.currentTime + t0;
    o.type = type || 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, s); g.gain.linearRampToValueAtTime(v || 0.15, s + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, s + d);
    o.connect(g); g.connect(c.destination); o.start(s); o.stop(s + d + 0.03);
  }
  G.sfx = {
    tap: () => tone(660, 0, 0.08, 'triangle'),
    pop: () => tone(520, 0, 0.1, 'square', 0.07),
    flip: () => tone(440, 0, 0.07, 'triangle'),
    ok: () => { tone(660, 0, 0.12, 'triangle'); tone(880, 0.1, 0.18, 'triangle'); },
    bad: () => tone(200, 0, 0.2, 'sawtooth', 0.07),
    win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.28, 'triangle')),
  };
  G.speak = (t) => {
    if (!G.soundOn || !('speechSynthesis' in window)) return;
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = 'ko-KR'; u.rate = 0.95; speechSynthesis.speak(u); } catch (e) {}
  };
  G.setSound = (on) => { G.soundOn = on; G.store.set('sound', on); G.$('#btnSound').textContent = on ? '🔊' : '🔇'; if (!on && 'speechSynthesis' in window) try { speechSynthesis.cancel(); } catch (e) {} };

  // 별
  G.starCount = G.store.get('stars', 0);
  G.showStars = () => { G.$('#stars').textContent = '⭐ ' + G.starCount; };
  G.addStars = (n) => { G.starCount += n; G.store.set('stars', G.starCount); G.showStars(); };

  // 화면 전환
  let stop = null, current = null, curMode = 'easy';
  const stage = () => G.$('#stage');
  function cleanup() { if (stop) { try { stop(); } catch (e) {} stop = null; } if ('speechSynthesis' in window) try { speechSynthesis.cancel(); } catch (e) {} }

  G.home = () => {
    cleanup(); current = null;
    document.body.dataset.view = 'home';
    G.$('#title').textContent = '놀이터';
    renderHome(G.store.get('cat', 'all'));
  };

  // 게임 시작: 쉬운/어려운 단계를 아이가 고르고, 🔄 로 새 문제를 낼 수 있다
  G.start = (g, mode) => {
    cleanup(); current = g;
    curMode = mode || G.store.get('mode:' + g.id, 'easy');
    G.store.set('mode:' + g.id, curMode);
    document.body.dataset.view = 'game';
    G.$('#title').textContent = g.name;
    const seg = G.h('div', { class: 'modebar' },
      [['easy', '🌱 쉬워요'], ['hard', '🔥 어려워요']].map(([m, t]) =>
        G.h('button', { class: 'segb', 'aria-pressed': String(m === curMode), onclick: () => { if (m !== curMode) { G.sfx.tap(); G.start(g, m); } } }, t)),
      G.h('button', { class: 'segb refresh', 'aria-label': '새 문제', onclick: () => { G.sfx.tap(); G.start(g, curMode); } }, '🔄 새로'));
    const area = G.h('div', { class: 'game' });
    stage().replaceChildren(G.h('div', { class: 'gwrap' }, seg, area));
    stop = g.start(area, curMode) || null;
  };

  // 결과 창: { stars:1~3, text }
  G.mode = () => curMode;
  G.win = ({ stars = 1, text = '' } = {}) => {
    G.addStars(stars);
    G.sfx.win(); G.speak('참 잘했어요!');
    const g = current;
    const over = G.h('div', { class: 'over' },
      G.h('h2', {}, '참 잘했어요! 🎉'),
      G.h('div', { class: 'bigstars' }, '⭐'.repeat(stars) + '☆'.repeat(3 - stars)),
      text ? G.h('div', { class: 'hint' }, text) : null,
      G.h('div', { class: 'row' },
        G.h('button', { class: 'btn', onclick: () => g && G.start(g, curMode) }, '다시 하기'),
        curMode === 'easy' ? G.h('button', { class: 'btn alt', onclick: () => g && G.start(g, 'hard') }, '🔥 어려운 것') : null,
        G.h('button', { class: 'btn alt', onclick: G.home }, '메뉴')));
    stage().append(over);
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const em = ['🎈', '⭐', '🎉', '🌈', '🍭', '🎀'];
      for (let i = 0; i < 14; i++) {
        const c = G.h('span', { class: 'confetti' }, G.pick(em));
        c.style.left = Math.random() * 95 + '%'; c.style.animationDuration = 2 + Math.random() * 2 + 's'; c.style.animationDelay = Math.random() * 0.6 + 's';
        over.append(c);
      }
    }
  };

  function renderHome(cat) {
    const list = G.games.filter((g) => cat === 'all' || g.cat === cat);
    const tabs = G.h('div', { class: 'tabs' }, G.cats.map((c) =>
      G.h('button', { class: 'tab', 'aria-pressed': String(c.id === cat), onclick: () => { G.sfx.tap(); G.store.set('cat', c.id); renderHome(c.id); } }, c.icon + ' ' + c.name)));
    const cards = G.h('div', { class: 'cards' }, list.map((g) =>
      G.h('button', { class: 'card c-' + g.color, onclick: () => { G.sfx.tap(); G.start(g); } },
        G.h('span', { class: 'ic' }, g.icon), G.h('span', { class: 'nm' }, g.name), G.h('span', { class: 'ds' }, g.desc))));
    stage().replaceChildren(G.h('div', { class: 'home' }, tabs, cards));
    layoutCards(cards, list.length);
  }

  // 카드 수와 화면 방향에 맞춰 열 수를 정한다 (한 화면에 맞추기)
  function layoutCards(cards, n) {
    const land = innerWidth > innerHeight * 1.05 && innerWidth > 640;
    const maxCols = land ? 4 : 2;
    const rows = Math.ceil(n / maxCols);
    cards.style.setProperty('--cols', Math.ceil(n / rows) || 1);
  }
  addEventListener('resize', () => { const c = G.$('.cards'); if (c) layoutCards(c, c.children.length); });
})();
