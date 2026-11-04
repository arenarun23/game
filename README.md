# 놀이터 게임 모음 (game)

유아·초등 저학년용 미니게임 모음. 한 페이지 안에서 게임을 골라 한다. AIEDU 허브(`arenarun23/aiedu`)의 하위 서비스로 `/game/` 경로에 붙는다.

- 정적 파일만 사용(빌드·서버·API 키 없음), **상대경로만** 사용 → 허브 하위 경로에서도 동작
- 게임 6개, 각각 **20가지 종류**(총 120가지)와 **쉬워요/어려워요** 두 가지 난이도
  - 위쪽 막대의 🔄 **새로 하기**: 같은 게임의 다른 종류(20가지를 섞어서, 한 바퀴 돌 때까지 겹치지 않음)
  - 난이도는 아이가 직접 고른다(기억해 둠). 어려움은 클리어 시 별 +1

| 게임 | 쉬워요 | 어려워요 | 20가지 |
|---|---|---|---|
| 색칠하기 | 마음대로 칠하기 | 세부 칸이 늘고 **견본과 똑같은 색**으로만 칠해짐 | 그림 20종 |
| 점 잇기 | 점 5~12개 + 점선 안내 | 점이 더 많고 안내 없음 | 모양 20종 |
| 짝 맞추기 | 3~6쌍, 처음에 잠깐 보여 줌 | 6~12쌍, 미리 보기 없음 | 주제 20종 |
| 다른 것 찾기 | 4~9칸, 차이가 큼 | 9~20칸, 차이가 작음 | 종류 20종(그림·색·방향·크기·개수·숫자·글자 등) |
| 두더지 잡기 | 9칸, 느림, 방해꾼 적음 | 12칸, 빠름, 방해꾼 많음 | 규칙 20종(목표 동물, 피할 것, 이름 대면 눌러요, 짝수만 등) |
| 분류하기 | 상자 2개, 그림 6개 | 상자 3개, 그림 10~12개 | 주제 20종 |
- 이미지는 이모지·SVG, 소리는 WebAudio 로 직접 만든다 (외부 에셋·저작물 없음)
- 로컬 확인: `python3 -m http.server 8080` 후 http://localhost:8080/

## 구조
```
index.html            화면 틀(상단 바 + #stage)
css/style.css         공통 스타일 (rem+clamp, 한 화면에 맞춤)
js/core.js            공통: 화면 전환, 소리, 별, 결과 창, 처음 화면(카테고리 탭 + 카드)
js/games/<id>.js      게임 하나당 파일. G.register({id,name,desc,icon,cat,color,variants:20,start(root,{hard,v})})
                      v = 이번에 뽑힌 종류 번호(0~19), hard = 어려움 여부
js/main.js            시작
```

## 게임 추가하는 법
1. `js/games/새게임.js` 작성: `G.register({ id, name, desc, icon, cat: 'draw'|'match'|'play', color: 'pink|sky|orange|mint|lemon|lilac|peach', start(root){ …; return 정리함수 } })`
   - `variants` 에 종류 수를 적으면 코어가 섞어서 `v` 로 넘겨 준다. 격자는 `G.bestGrid(n, box)` 로 정한다.
   - 끝나면 `G.win({ stars: 1~3, text })` 를 부른다. 타이머는 반환하는 정리함수에서 해제한다.
2. `index.html` 에 `<script src="js/games/새게임.js"></script>` 추가 (`main.js` 앞).
3. 카테고리를 늘리려면 `js/core.js` 의 `G.cats`.

## 허브 연동
- 허브 `apps.json` 에 `{ "id": "game", "repo": "arenarun23/game", … }` 로 등록하면 빌드 때 이 저장소를 가져간다.
- 자동 갱신: `.github/workflows/notify-hub.yml` 이 main push 때 허브 Deploy Hook 을 호출한다. **이 저장소 Secret `HUB_DEPLOY_HOOK` 필요**(값은 파일에 쓰지 않는다).
