// 레이싱 별 보상: 별을 모으면 꾸미기(차 색·꼬리·모자)와 칭호가 열린다. 그림 파일 없이 이모지·색으로만.
(function () {
  'use strict';
  const MILES = [
    { at: 50, ic: '🥉', n: '첫 트로피', d: '칭호 「새내기 레이서」' },
    { at: 100, ic: '🎨', n: '차 색깔 바꾸기', d: '차를 5가지 색으로 꾸며요' },
    { at: 200, ic: '✨', n: '꼬리 효과', d: '달리면 별·하트·무지개가 따라와요' },
    { at: 500, ic: '🎩', n: '캐릭터 모자', d: '왕관·리본·헬멧·모자, 칭호 「레이싱 왕」' },
    { at: 1000, ic: '🏆', n: '전설의 보상', d: '황금 차, 칭호 「전설의 레이서」' },
  ];
  const TITLES = [[0, '꼬마 레이서'], [50, '새내기 레이서'], [500, '레이싱 왕'], [1000, '전설의 레이서']];
  const COLORS = [{ id: 'def', n: '기본', c: null, at: 0 }, { id: 'pink', n: '분홍', c: '#ff6fb5', at: 100 }, { id: 'purple', n: '보라', c: '#9b59b6', at: 100 }, { id: 'green', n: '초록', c: '#2ecc71', at: 100 },
    { id: 'sky', n: '하늘', c: '#36c5f0', at: 100 }, { id: 'orange', n: '주황', c: '#ff8a3d', at: 100 }, { id: 'gold', n: '황금', c: '#ffc400', at: 1000 }];
  const TRAILS = [{ id: 'none', n: '없음', e: null, at: 0 }, { id: 'star', n: '별', e: ['⭐'], at: 200 }, { id: 'heart', n: '하트', e: ['💖'], at: 200 }, { id: 'rainbow', n: '무지개', e: ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣'], at: 200 }];
  const HATS = [{ id: 'none', n: '없음', e: null, at: 0 }, { id: 'crown', n: '왕관', e: '👑', at: 500 }, { id: 'ribbon', n: '리본', e: '🎀', at: 500 }, { id: 'helmet', n: '헬멧', e: '⛑️', at: 500 }, { id: 'tophat', n: '모자', e: '🎩', at: 500 }];
  // 보상은 레이싱에서 모은 별만 센다(놀이터 전체 별과 따로)
  // 처음 한 번은 지금까지 모은 별(대부분 레이싱)로 시작해서, 레이싱 별만 따로 세기 전에 모은 별이 사라지지 않게 한다
  const stars = () => { let v = G.store.get('race:stars', null); if (v === null) { v = Math.max(0, G.starCount | 0); G.store.set('race:stars', v); } return v | 0; };
  const add = (n) => { const v = stars() + n; G.store.set('race:stars', v); return v; };
  const title = (s) => TITLES.filter((t) => s >= t[0]).pop()[1];
  const next = (s) => MILES.find((m) => s < m.at) || null;
  const raw = () => Object.assign({ color: 'def', trail: 'none', hat: 'none' }, G.store.get('race:cos', {}));
  // 지금 쓸 수 있는 꾸미기만 돌려준다(아직 안 열린 것은 기본값)
  function cos() {
    const s = stars(), r = raw(), pick = (arr, id) => { const o = arr.find((x) => x.id === id); return o && s >= o.at ? o : arr[0]; };
    return { color: pick(COLORS, r.color), trail: pick(TRAILS, r.trail), hat: pick(HATS, r.hat) };
  }
  const newly = (before, after) => MILES.filter((m) => before < m.at && after >= m.at);


  // 📸 보상 화면을 그림 파일(PNG)로 바로 저장(내려받기)한다.
  function capture(o) {
    const s = stars(), c = cos(), nx = next(s), W = 900, H = 640, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d'), E = (t, x, y, px, al) => { g.font = `${px}px "Jua","Noto Sans KR",sans-serif`; g.textAlign = al || 'center'; g.textBaseline = 'middle'; g.fillText(t, x, y); };
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#fff3d6'); bg.addColorStop(1, '#ffd9a8'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#ff9f43'; g.lineWidth = 10; g.strokeRect(14, 14, W - 28, H - 28);
    g.fillStyle = '#4a3b2a'; E('🏅 내 레이싱 보상', W / 2, 70, 54); E(`⭐ ${s}   칭호: ${title(s)}`, W / 2, 130, 38);
    // 진행 막대
    const base = (MILES.filter((m) => s >= m.at).pop() || { at: 0 }).at, pct = nx ? Math.max(0, Math.min(1, (s - base) / (nx.at - base))) : 1;
    g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.roundRect(150, 165, 600, 26, 13); g.fill();
    g.fillStyle = '#ff7e5f'; g.beginPath(); g.roundRect(150, 165, Math.max(26, 600 * pct), 26, 13); g.fill();
    g.fillStyle = '#4a3b2a'; E(nx ? `다음 보상 ${nx.ic} ${nx.n}까지 ⭐ ${nx.at - s}개` : '🎉 모든 보상을 모았어요!', W / 2, 220, 30);
    // 내 차(색·모자·꼬리)
    const cx = W / 2, cy = 362, col = c.color.c || o.carColor;
    if (c.trail.e) for (let i = 0; i < 4; i++) { g.globalAlpha = 0.35 + i * 0.15; E(c.trail.e[i % c.trail.e.length], cx - 150 + i * 36, cy + 18, 40); } g.globalAlpha = 1;
    g.fillStyle = '#222'; g.beginPath(); g.roundRect(cx - 80, cy + 30, 36, 24, 6); g.roundRect(cx + 44, cy + 30, 36, 24, 6); g.fill();
    g.fillStyle = col; g.beginPath(); g.roundRect(cx - 100, cy - 20, 200, 62, 18); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.roundRect(cx - 20, cy - 12, 60, 40, 10); g.fill();
    g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(cx, cy - 36, 54, 0, 6.2832); g.fill(); g.fillStyle = '#4a3b2a';
    E(o.chEmoji, cx, cy - 36, 96); if (c.hat.e) E(c.hat.e, cx, cy - 92, 56);
    // 보상 5개
    const w = 160, gap = 15, x0 = (W - (w * 5 + gap * 4)) / 2;
    MILES.forEach((m, i) => { const x = x0 + i * (w + gap), ok = s >= m.at; g.fillStyle = ok ? '#fff3b0' : 'rgba(255,255,255,.55)'; g.beginPath(); g.roundRect(x, 440, w, 150, 18); g.fill(); g.strokeStyle = ok ? '#f5b700' : '#bbb'; g.lineWidth = 4; g.stroke();
      g.fillStyle = ok ? '#4a3b2a' : '#999'; E(ok ? m.ic : '🔒', x + w / 2, 485, 54); E(`⭐ ${m.at}`, x + w / 2, 538, 30); E(m.n, x + w / 2, 570, 21); });
    g.fillStyle = '#8a7a63'; E(new Date().toLocaleDateString('ko-KR'), W - 40, H - 36, 22, 'right');
    cv.toBlob((blob) => {
      if (!blob) return;
      const name = `race-rewards-${s}.png`;
      const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
    }, 'image/png');
  }

  // 🔁 다른 기기로 옮기기: 서버 없이 '옮기기 코드'(글자)나 파일로 별·꾸미기·완주 기록을 보낸다.
  // (기기 모델·MAC 주소 같은 기기 식별 정보는 브라우저가 알려 주지도 않고, 수집하지도 않는다)
  const KEYS = ['easy', 'hard', 'kid'];
  const sum = (str) => { let a = 5381, b = 52711; for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); a = (a * 33 ^ c) >>> 0; b = (b * 31 + c) >>> 0; } return (a.toString(36) + b.toString(36)).slice(0, 6); };
  const b64 = (o) => { const u = new TextEncoder().encode(JSON.stringify(o)); let t = ''; u.forEach((c) => (t += String.fromCharCode(c))); return btoa(t).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  const unb64 = (t) => { const bin = atob(t.replace(/-/g, '+').replace(/_/g, '/')), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return JSON.parse(new TextDecoder().decode(u)); };
  function makeCode() {
    const done = {}; KEYS.forEach((k) => { done[k] = G.store.get('race:done:' + k, []); });
    const body = b64({ v: 1, s: stars(), c: raw(), d: done });
    return 'RC1-' + body + '-' + sum(body);
  }
  function readCode(text) {
    const m = String(text || '').replace(/\s+/g, '').match(/RC1-([A-Za-z0-9_-]+)-([a-z0-9]{1,6})/);
    if (!m || sum(m[1]) !== m[2]) throw new Error('코드가 맞지 않아요. 처음부터 끝까지 그대로 붙여 넣었는지 확인해 주세요.');
    const o = unb64(m[1]); if (!o || o.v !== 1 || !(o.s >= 0)) throw new Error('코드를 읽을 수 없어요.');
    return o;
  }
  // 가져오기: 별은 더 큰 쪽, 완주 기록은 합치고, 꾸미기는 코드 쪽을 따른다
  function applyCode(o) {
    const had = stars(), ns = Math.max(had, Math.min(1e6, o.s | 0));
    G.store.set('race:stars', ns);
    if (o.c && typeof o.c === 'object') G.store.set('race:cos', { color: String(o.c.color || 'def'), trail: String(o.c.trail || 'none'), hat: String(o.c.hat || 'none') });
    KEYS.forEach((k) => { const a = G.store.get('race:done:' + k, []), b = (o.d && Array.isArray(o.d[k]) ? o.d[k] : []).filter((x) => Number.isInteger(x) && x >= 0 && x < 40); G.store.set('race:done:' + k, [...new Set([...a, ...b])]); });
    return ns;
  }
  function transferBox(root, afterImport) {
    const h = G.h, code = makeCode();
    const msg = h('div', { class: 'rwhint must' });
    const out = h('textarea', { class: 'rwcode', readonly: 'readonly', rows: '3', 'aria-label': '옮기기 코드' }); out.value = code;
    const inp = h('textarea', { class: 'rwcode', rows: '3', placeholder: 'RC1-… 코드를 여기에 붙여 넣어요', 'aria-label': '코드 붙여 넣기' });
    const file = h('input', { type: 'file', accept: '.txt,text/plain', class: 'rwfile', 'aria-label': '코드 파일 고르기' });
    const doImport = (text) => {
      try { const o = readCode(text), ns = applyCode(o); msg.textContent = `✅ 가져왔어요! 지금 레이싱 별 ⭐ ${ns}개`; G.sfx.ok(); setTimeout(() => { box.remove(); afterImport(); }, 1200); }
      catch (e) { msg.textContent = '❌ ' + (e.message || '가져오지 못했어요'); G.sfx.bad(); }
    };
    file.addEventListener('change', () => { const f = file.files && file.files[0]; if (!f) return; const fr = new FileReader(); fr.onload = () => { inp.value = String(fr.result || '').slice(0, 5000); doImport(inp.value); }; fr.readAsText(f); });
    const box = h('div', { class: 'over xfer' }, h('h2', {}, '🔁 다른 기기로 옮기기'),
      h('div', { class: 'xwrap' }, h('div', { class: 'xs' }, h('div', { class: 'hint must' }, '① 옮겨 줄 기기에서 코드를 복사해요'), out,
      h('div', { class: 'row' },
        h('button', { class: 'btn', onclick: async () => { G.sfx.tap(); try { await navigator.clipboard.writeText(code); msg.textContent = '📋 복사했어요! 새 기기에 붙여 넣어요'; } catch (e) { out.select(); msg.textContent = '코드를 길게 눌러 복사해 주세요'; } } }, '📋 코드 복사'),
        h('button', { class: 'btn alt', onclick: () => { G.sfx.tap(); const bl = new Blob([code], { type: 'text/plain' }), a = document.createElement('a'); a.href = URL.createObjectURL(bl); a.download = 'race-rewards-code.txt'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); } }, '💾 파일로 저장'))),
      h('div', { class: 'xs' }, h('div', { class: 'hint must' }, '② 새 기기에서 코드를 붙여 넣거나 파일을 골라요'), inp,
      h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => { G.sfx.tap(); doImport(inp.value); } }, '📥 가져오기'), h('label', { class: 'btn alt rwfl' }, '📂 파일 고르기', file)))),
      msg, h('button', { class: 'btn alt', onclick: () => { G.sfx.tap(); box.remove(); } }, '닫기'));
    root.append(box);
  }

  // 보상 페이지
  function page(root, o) {
    const h = G.h, s = stars(), nx = next(s), prev = MILES.filter((m) => s >= m.at).pop(), base = prev ? prev.at : 0;
    const body = h('div', { class: 'rwbody' });
    const pv = h('div', { class: 'rwpv' });
    function paintPreview() {
      const c = cos(), col = c.color.c || o.carColor, tr = c.trail.e;
      pv.replaceChildren(
        ...(tr ? [0, 1, 2, 3].map((i) => h('span', { class: 'rwtr', style: `left:${6 + i * 15}px;opacity:${0.35 + i * 0.15}` }, tr[i % tr.length])) : []),
        h('span', { class: 'rwcar', style: `background:${col}` }), h('span', { class: 'rww w1' }), h('span', { class: 'rww w2' }),
        h('span', { class: 'rwch' }, o.chEmoji), ...(c.hat.e ? [h('span', { class: 'rwhat' }, c.hat.e)] : []));
    }
    const chipRow = (label, list, key, render) => {
      const row = h('div', { class: 'rwrow' }, h('b', {}, label), h('div', { class: 'rwchips' }));
      const chips = row.lastChild;
      const draw = () => chips.replaceChildren(...list.map((it) => {
        const ok = stars() >= it.at, on = ok && (cos()[key].id === it.id);
        return h('button', { class: 'rwc', 'aria-pressed': String(on), 'aria-label': it.n, style: it.c ? `--sw:${it.c}` : '',
          onclick: () => { if (!ok) { G.sfx.bad(); hint.textContent = `🔒 ⭐ ${it.at}개를 모으면 열려요`; return; } G.sfx.tap(); const r = raw(); r[key] = it.id; G.store.set('race:cos', r); hint.textContent = ''; draw(); paintPreview(); } },
          ok ? render(it) : '🔒', h('small', {}, ok ? it.n : '⭐' + it.at));
      }));
      draw(); return row;
    };
    const hint = h('div', { class: 'rwhint' });
    const pct = nx ? Math.max(0, Math.min(100, Math.round((s - base) / (nx.at - base) * 100))) : 100;
    const left = h('div', { class: 'rwleft' },
      h('div', { class: 'hint must' }, `🏅 레이싱 보상 · 레이싱 ⭐ ${s}`), h('div', { class: 'rwtitle' }, `칭호: ${title(s)}`),
      h('div', { class: 'rwbar', role: 'progressbar', 'aria-valuenow': String(pct) }, h('i', { style: `width:${pct}%` })),
      h('div', { class: 'rwnext' }, nx ? `다음 보상 ${nx.ic} ${nx.n}까지 ⭐ ${nx.at - s}개` : '🎉 모든 보상을 모았어요!'), pv,
      h('div', { class: 'rwmiles' }, MILES.map((m) => h('div', { class: 'card rwm ' + (s >= m.at ? 'c-lemon' : 'lock') }, h('span', { class: 'ic' }, s >= m.at ? m.ic : '🔒'), h('span', { class: 'nm' }, `⭐ ${m.at}`), h('span', { class: 'ds' }, m.n)))));
    const right = h('div', { class: 'rwright' },
      chipRow('🎨 차 색깔', COLORS, 'color', (it) => h('span', { class: 'sw', style: it.c ? `background:${it.c}` : 'background:conic-gradient(#e74c3c,#f1c40f,#2ecc71,#3498db,#e74c3c)' })),
      chipRow('✨ 꼬리', TRAILS, 'trail', (it) => it.e ? it.e[0] : '🚫'),
      chipRow('🎩 모자', HATS, 'hat', (it) => it.e || '🚫'), hint);
    body.append(left, right); paintPreview();
    root.replaceChildren(h('div', { class: 'rwpage' }, body, h('div', { class: 'palette' }, h('button', { class: 'btn alt', onclick: () => { G.sfx.tap(); o.onBack(); } }, '◀ 돌아가기'), h('button', { class: 'btn alt', onclick: () => { G.sfx.tap(); transferBox(root, () => page(root, o)); } }, '🔁 옮기기'), h('button', { class: 'btn', onclick: () => { G.sfx.ok(); capture(o); hint.textContent = '📸 사진으로 저장했어요! (내려받기 폴더 · 갤러리/내 파일에서 확인)'; } }, '📸 사진 저장'))));
  }
  window.RaceReward = { MILES, COLORS, TRAILS, HATS, cos, newly, page, title, stars, add };
})();
