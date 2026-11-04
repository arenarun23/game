# 놀이터 게임 모음 (game)

유아·초등 저학년용 미니게임 모음. 한 페이지 안에서 게임을 골라 한다. AIEDU 허브(`arenarun23/aiedu`)의 하위 서비스로 `/game/` 경로에 붙는다.

- 정적 파일만 사용(빌드·서버·API 키 없음), **상대경로만** 사용 → 허브 하위 경로에서도 동작
- 게임 6개: 색칠하기, 점 잇기, 짝 맞추기, 다른 것 찾기, 두더지 잡기, 분류하기
- 이미지는 이모지·SVG, 소리는 WebAudio 로 직접 만든다 (외부 에셋·저작물 없음)
- 로컬 확인: `python3 -m http.server 8080` 후 http://localhost:8080/

## 구조
```
index.html            화면 틀(상단 바 + #stage)
css/style.css         공통 스타일 (rem+clamp, 한 화면에 맞춤)
js/core.js            공통: 화면 전환, 소리, 별, 결과 창, 처음 화면(카테고리 탭 + 카드)
js/games/<id>.js      게임 하나당 파일. G.register({id,name,desc,icon,cat,color,start(root)})
js/main.js            시작
```

## 게임 추가하는 법
1. `js/games/새게임.js` 작성: `G.register({ id, name, desc, icon, cat: 'draw'|'match'|'play', color: 'pink|sky|orange|mint|lemon|lilac|peach', start(root){ …; return 정리함수 } })`
   - 끝나면 `G.win({ stars: 1~3, text })` 를 부른다. 타이머는 반환하는 정리함수에서 해제한다.
2. `index.html` 에 `<script src="js/games/새게임.js"></script>` 추가 (`main.js` 앞).
3. 카테고리를 늘리려면 `js/core.js` 의 `G.cats`.

## 허브 연동
- 허브 `apps.json` 에 `{ "id": "game", "repo": "arenarun23/game", … }` 로 등록하면 빌드 때 이 저장소를 가져간다.
- 자동 갱신: `.github/workflows/notify-hub.yml` 이 main push 때 허브 Deploy Hook 을 호출한다. **이 저장소 Secret `HUB_DEPLOY_HOOK` 필요**(값은 파일에 쓰지 않는다).
