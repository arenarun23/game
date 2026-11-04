// 분류하기: 그림을 끌어서 알맞은 상자에 넣는다
(function () {
  'use strict';
  const CATS = [
    { id: 'animal', name: '동물', color: 'var(--pink)', items: ['🐶', '🐱', '🐰', '🐻', '🦊', '🐼', '🐸', '🐵'] },
    { id: 'fruit', name: '과일', color: 'var(--lemon)', items: ['🍎', '🍌', '🍇', '🍓', '🍊', '🍉', '🍑', '🍒'] },
    { id: 'ride', name: '탈것', color: 'var(--sky)', items: ['🚗', '🚌', '🚲', '✈️', '🚂', '🚀', '⛵', '🚕'] },
  ];
  let round = 0;

  G.register({
    id: 'sort', name: '분류하기', desc: '알맞은 상자에 쏙', icon: '🧺', cat: 'play', color: 'lemon',
    start(root) {
      const nb = round % 2 === 0 ? 2 : 3; round++;
      const cats = G.shuffle(CATS).slice(0, nb);
      const per = nb === 2 ? 3 : 2;
      const things = G.shuffle(cats.flatMap((c) => G.shuffle(c.items).slice(0, per).map((e) => ({ e, c }))));
      let left = things.length, miss = 0;
      const tray = G.h('div', { class: 'tray' });
      const bins = cats.map((c) => {
        const st = G.h('div', { class: 'st' });
        const el = G.h('div', { class: 'bin', style: 'background:' + c.color }, G.h('div', { class: 'lb' }, c.name), st);
        return { c, el, st };
      });
      things.forEach((t) => {
        const it = G.h('div', { class: 'it', role: 'button', 'aria-label': '그림' }, t.e);
        it.addEventListener('pointerdown', (ev) => {
          ev.preventDefault(); it.setPointerCapture(ev.pointerId);
          const sx = ev.clientX, sy = ev.clientY; it.classList.add('drag'); G.sfx.tap();
          const move = (e) => { it.style.transform = `translate(${e.clientX - sx}px,${e.clientY - sy}px) scale(1.15)`; };
          const up = (e) => {
            it.removeEventListener('pointermove', move); it.removeEventListener('pointerup', up); it.removeEventListener('pointercancel', up);
            it.classList.remove('drag');
            const hit = bins.find((b) => { const r = b.el.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; });
            if (hit && hit.c === t.c) {
              G.sfx.ok(); hit.st.append(G.h('span', {}, t.e)); it.remove(); left--;
              if (left === 0) setTimeout(() => G.win({ stars: miss === 0 ? 3 : miss <= 2 ? 2 : 1, text: miss ? '다시 놓은 횟수 ' + miss + '번' : '한 번에 다 맞췄어요!' }), 500);
            } else {
              if (hit) { miss++; G.sfx.bad(); hit.el.classList.remove('shake'); void hit.el.offsetWidth; hit.el.classList.add('shake'); }
              it.style.transform = '';
            }
          };
          it.addEventListener('pointermove', move); it.addEventListener('pointerup', up); it.addEventListener('pointercancel', up);
        });
        tray.append(it);
      });
      root.append(G.h('div', { class: 'hint' }, '같은 친구끼리 상자에 넣어요'), tray, G.h('div', { class: 'bins' }, bins.map((b) => b.el)));
      return null;
    },
  });
})();
