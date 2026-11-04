// 짝 맞추기: 주제 20종. 쉬운 단계는 같은 그림 두 장(3~6쌍), 어려운 단계는 그림 ↔ 글자 짝(8~10쌍).
(function () {
  'use strict';
  const T = (name, s) => ({ name, items: s.trim().split(/\s+/).map((x) => { const m = x.match(/^(.+?)=(.+)$/); return [m[1], m[2]]; }) });
  const THEMES = [
    T('동물', '🐶=강아지 🐱=고양이 🐰=토끼 🐻=곰 🦊=여우 🐼=판다 🐸=개구리 🐵=원숭이 🦁=사자 🐮=소'),
    T('과일', '🍎=사과 🍌=바나나 🍇=포도 🍓=딸기 🍊=귤 🍉=수박 🍑=복숭아 🍒=체리 🍋=레몬 🍍=파인애플'),
    T('탈것', '🚗=자동차 🚌=버스 🚲=자전거 ✈️=비행기 🚂=기차 🚀=로켓 ⛵=돛단배 🚕=택시 🚒=소방차 🚜=트랙터'),
    T('채소', '🥕=당근 🌽=옥수수 🥔=감자 🍅=토마토 🥦=브로콜리 🍆=가지 🥒=오이 🧅=양파 🍄=버섯 🌶️=고추'),
    T('바다', '🐟=물고기 🐳=고래 🐬=돌고래 🐙=문어 🦀=게 🦐=새우 🐢=거북이 🦈=상어 🐚=조개 🦑=오징어'),
    T('곤충', '🐝=벌 🦋=나비 🐞=무당벌레 🐜=개미 🐛=애벌레 🦗=메뚜기 🕷️=거미 🐌=달팽이 🦂=전갈 🦟=모기'),
    T('음식', '🍕=피자 🍔=햄버거 🍟=감자튀김 🌭=핫도그 🍦=아이스크림 🍩=도넛 🍪=쿠키 🍰=케이크 🍙=주먹밥 🍜=라면'),
    T('운동', '⚽=축구공 🏀=농구공 ⚾=야구공 🎾=테니스공 🏐=배구공 🏓=탁구 🥊=글러브 🎳=볼링 ⛸️=스케이트 🏸=배드민턴'),
    T('악기', '🎹=피아노 🎸=기타 🎻=바이올린 🥁=북 🎺=트럼펫 🎷=색소폰 🎤=마이크 🔔=종 📯=나팔 🎧=헤드폰'),
    T('옷', '👕=티셔츠 👖=바지 👗=원피스 🧢=모자 🧦=양말 👟=운동화 🧤=장갑 🧣=목도리 👓=안경 👜=가방'),
    T('날씨', '☀️=해 🌙=달 ⭐=별 ☁️=구름 🌧️=비 ❄️=눈 ⚡=번개 🌈=무지개 🌪️=회오리 ☂️=우산'),
    T('식물', '🌸=벚꽃 🌹=장미 🌻=해바라기 🌷=튤립 🌳=나무 🌵=선인장 🍀=클로버 🍁=단풍잎 🌴=야자수 🌿=풀잎'),
    T('학용품', '✏️=연필 📚=책 ✂️=가위 📏=자 🖍️=크레파스 📎=클립 🎒=책가방 📐=삼각자 🔍=돋보기 📓=공책'),
    T('우주', '🚀=로켓 🪐=행성 🌍=지구 🌙=달 ⭐=별 ☄️=혜성 👽=외계인 🛸=우주선 🔭=망원경 🌞=태양'),
    T('표정', '😀=기뻐요 😢=슬퍼요 😡=화나요 😴=졸려요 😲=놀라요 😎=멋져요 🤒=아파요 😋=맛있어 🥰=사랑해 🤔=생각중'),
    T('색깔', '🔴=빨강 🟠=주황 🟡=노랑 🟢=초록 🔵=파랑 🟣=보라 🟤=갈색 ⚫=검정 ⚪=하양'),
    T('숫자', '1️⃣=하나 2️⃣=둘 3️⃣=셋 4️⃣=넷 5️⃣=다섯 6️⃣=여섯 7️⃣=일곱 8️⃣=여덟 9️⃣=아홉 🔟=열'),
    T('집 안', '🛏️=침대 🪑=의자 🚪=문 🛁=욕조 📺=텔레비전 ⏰=시계 🔑=열쇠 💡=전구 🧹=빗자루 🪞=거울'),
    T('장난감', '🧸=곰인형 🎈=풍선 🪁=연 🎲=주사위 🧩=퍼즐 🪀=요요 🎮=게임기 🥁=북 🎠=회전목마 🚂=기차놀이'),
    T('모양', '🔺=세모 ⬛=네모 ⚫=동그라미 ⭐=별 ❤️=하트 🔷=마름모 ➕=더하기 🌙=초승달'),
  ];
  let easyLv = 0, hardLv = 0;
  const EASY = [3, 4, 6], HARD = [8, 10];

  G.register({
    id: 'memory', name: '짝 맞추기', desc: '같은 짝을 찾아요', icon: '🃏', cat: 'match', color: 'lilac',
    start(root, mode) {
      const hard = mode === 'hard';
      const th = THEMES[G.bag('memory', THEMES.length)];
      const pairs = Math.min(th.items.length, hard ? HARD[hardLv] : EASY[easyLv]);
      const chosen = G.shuffle(th.items).slice(0, pairs);
      // 쉬운 단계: 같은 그림 두 장 / 어려운 단계: 그림 한 장 + 글자 한 장
      const deck = G.shuffle(chosen.flatMap(([e, w], i) => hard ? [{ k: i, t: e, word: false }, { k: i, t: w, word: true }] : [{ k: i, t: e }, { k: i, t: e }]));
      const timers = [];
      let first = null, lock = false, moves = 0, found = 0;
      const d = G.dims(deck.length);
      const grid = G.h('div', { class: 'grid', style: `--c:${d.c};--r:${d.r}` });
      deck.forEach((cd) => {
        const card = G.h('button', { class: 'mcard', 'aria-label': '카드' },
          G.h('div', { class: 'in' }, G.h('div', { class: 'b' }, '?'), G.h('div', { class: 'f' + (cd.word ? ' w' : '') }, cd.t)));
        card.dataset.k = cd.k;
        card.addEventListener('click', () => flip(card));
        grid.append(card);
      });
      function flip(c) {
        if (lock || c.classList.contains('open') || c.classList.contains('done')) return;
        G.sfx.flip(); c.classList.add('open');
        if (!first) { first = c; return; }
        moves++;
        if (first.dataset.k === c.dataset.k) {
          const a = first; first = null;
          timers.push(setTimeout(() => { a.classList.replace('open', 'done'); c.classList.replace('open', 'done'); G.sfx.ok(); found++;
            if (found === pairs) timers.push(setTimeout(finish, 500)); }, 350));
        } else {
          lock = true; const a = first; first = null;
          timers.push(setTimeout(() => { a.classList.remove('open'); c.classList.remove('open'); lock = false; G.sfx.bad(); }, 900));
        }
      }
      function finish() {
        const stars = moves <= pairs + 2 ? 3 : moves <= pairs * 2 ? 2 : 1;
        if (hard) hardLv = Math.min(hardLv + 1, HARD.length - 1); else easyLv = Math.min(easyLv + 1, EASY.length - 1);
        G.win({ stars, text: `${th.name} 짝을 ${moves}번 만에 다 찾았어요!` });
      }
      root.append(G.h('div', { class: 'hint' }, `${th.name} · ` + (hard ? '그림과 글자 짝을 찾아요' : '같은 그림 두 장을 찾아요') + ` (${pairs}쌍)`), G.h('div', { class: 'fitbox' }, grid));
      return () => timers.forEach(clearTimeout);
    },
  });
})();
