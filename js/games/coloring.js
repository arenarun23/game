// 색칠하기: 칸을 누르면 고른 색으로 칠해진다
(function () {
  'use strict';
  const PICS = [
    { name: '꽃', svg: `
      <rect class="p" x="47" y="55" width="6" height="38" rx="3"/>
      <ellipse class="p" cx="35" cy="76" rx="12" ry="6" transform="rotate(-25 35 76)"/>
      <ellipse class="p" cx="65" cy="70" rx="12" ry="6" transform="rotate(25 65 70)"/>
      <circle class="p" cx="67" cy="35" r="11"/><circle class="p" cx="58.5" cy="49.7" r="11"/><circle class="p" cx="41.5" cy="49.7" r="11"/>
      <circle class="p" cx="33" cy="35" r="11"/><circle class="p" cx="41.5" cy="20.3" r="11"/><circle class="p" cx="58.5" cy="20.3" r="11"/>
      <circle class="p" cx="50" cy="35" r="9"/>` },
    { name: '집', svg: `
      <circle class="p" cx="84" cy="16" r="8"/>
      <rect class="p" x="20" y="48" width="60" height="42"/>
      <polygon class="p" points="12,50 50,18 88,50"/>
      <rect class="p" x="43" y="64" width="14" height="26"/>
      <rect class="p" x="26" y="58" width="12" height="12"/><rect class="p" x="62" y="58" width="12" height="12"/>` },
    { name: '물고기', svg: `
      <polygon class="p" points="72,50 94,32 94,68"/>
      <polygon class="p" points="38,34 56,34 47,16"/>
      <ellipse class="p" cx="45" cy="50" rx="30" ry="20"/>
      <circle class="p" cx="56" cy="52" r="8"/>
      <circle class="p" cx="31" cy="45" r="5"/>
      <circle class="p" cx="12" cy="20" r="5"/><circle class="p" cx="20" cy="84" r="4"/>` },
    { name: '로켓', svg: `
      <polygon class="p" points="42,70 58,70 50,94"/>
      <polygon class="p" points="38,56 22,78 38,72"/><polygon class="p" points="62,56 78,78 62,72"/>
      <path class="p" d="M50 6 C70 24 68 54 62 72 L38 72 C32 54 30 24 50 6Z"/>
      <circle class="p" cx="50" cy="40" r="9"/>
      <circle class="p" cx="15" cy="18" r="4"/><circle class="p" cx="86" cy="30" r="3"/><circle class="p" cx="82" cy="78" r="4"/>` },
    { name: '아이스크림', svg: `
      <polygon class="p" points="34,54 66,54 50,94"/>
      <circle class="p" cx="50" cy="44" r="19"/>
      <circle class="p" cx="50" cy="27" r="14"/>
      <circle class="p" cx="50" cy="11" r="5"/>` },
  ];
  const COLORS = ['#ff6b6b', '#ff9f43', '#feca57', '#1dd1a1', '#48dbfb', '#5f6dff', '#b678f0', '#ff9ff3', '#a0714f', '#444444'];
  let last = -1;

  G.register({
    id: 'coloring', name: '색칠하기', desc: '알록달록 칠해요', icon: '🎨', cat: 'draw', color: 'pink',
    start(root) {
      last = (last + 1) % PICS.length;
      const pic = PICS[last];
      let color = COLORS[0], timer = 0;
      const box = G.h('div', { class: 'fitbox' });
      box.innerHTML = `<svg class="art sq" viewBox="0 0 100 100" role="img" aria-label="${pic.name} 그림">${pic.svg}</svg>`;
      const parts = [...box.querySelectorAll('.p')];
      const sw = COLORS.map((c) => G.h('button', { class: 'sw', style: 'background:' + c, 'aria-label': '색 고르기', 'aria-pressed': String(c === color),
        onclick: () => { color = c; G.sfx.tap(); sw.forEach((b, i) => b.setAttribute('aria-pressed', String(COLORS[i] === c))); } }));
      const reset = G.h('button', { class: 'btn alt', onclick: () => { parts.forEach((p) => { p.style.fill = ''; delete p.dataset.c; }); G.sfx.tap(); } }, '🧽 지우기');
      parts.forEach((p) => p.addEventListener('click', () => {
        p.style.fill = color; p.dataset.c = '1'; G.sfx.pop();
        if (parts.every((x) => x.dataset.c)) { clearTimeout(timer); timer = setTimeout(() => G.win({ stars: 1, text: pic.name + ' 그림을 다 칠했어요!' }), 500); }
      }));
      root.append(G.h('div', { class: 'hint' }, pic.name + ' 그림을 예쁘게 칠해요'), box, G.h('div', { class: 'palette' }, sw, reset));
      return () => clearTimeout(timer);
    },
  });
})();
