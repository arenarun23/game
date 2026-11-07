# game — 놀이터 게임 모음

AIEDU 허브(`arenarun23/aiedu`)의 하위 서비스. 구조와 게임 추가 방법은 `README.md`.

지킬 규칙(허브 공통):
- 정적 파일·**상대경로만**(`/js/..` 금지, `js/..` 사용). 빌드 단계 추가 금지.
- 화면은 여러 크기(태블릿 가로 1280×560, 폰 세로 360×640 등)에서 **한 화면에 맞아야** 한다. 크기는 rem+clamp, 격자는 `.grid`(`--c`,`--r`) 사용.
- 터치 버튼 ≥ 44px, `prefers-reduced-motion` 존중, 서버·키·외부 저작물 없음(이모지·SVG·WebAudio).
- 원본 앱(상용 APK)의 이미지·소리·이름·코드를 가져오지 않는다. 규칙·구조만 참고.
- 확인: 로컬 서버로 열어 여러 화면 크기에서 보고, 각 게임을 끝까지 플레이한다. 허브의 `node scripts/fit-check.mjs <URL>` 도 쓸 수 있다.
- Deploy Hook 주소·Secret 값은 파일·커밋·로그에 쓰지 않는다.
- **AIEDU 복귀 아이콘**(`a.aiedu-home`, 웃는 별 44px): 모든 서비스가 같은 모양·같은 자리(페이지 왼쪽 위 8px, `<body>` 첫 요소, 링크 `../`)에 둔다. 지우거나 옮기지 않는다. 레이아웃을 바꿀 때 왼쪽 위 52×52px 를 비워 둔다 — 이 앱의 자리 확보: `#bar{padding-left:calc(.7rem + 46px)}`(상단 바). 원본 코드: 허브 저장소 `templates/aiedu-home.html`.

- **외부 호스트 호출 금지(보안, CSP 가 브라우저에서 차단)**: 허용되는 외부 주소는 필기 인식 `inputtools.google.com` 하나뿐이다. 글꼴은 허브의 자체 호스팅 CSS 를 쓴다 — `<link rel="stylesheet" href="../fonts/jua.css">`(`jua`·`gowun-dodum`·`noto-sans-kr`·`noto-serif-kr`·`noto-serif-tc`). **Google Fonts 링크, CDN 이미지·스크립트를 넣지 않는다.** 이미지·데이터는 이 저장소 안에 둔다. 사용자·인식 결과를 HTML 에 넣을 땐 `esc()`/`textContent`, 속성은 큰따옴표. 자세한 규칙: 허브 저장소 `.claude/skills/aiedu-hub/references/security.md`.

- **이용 기록(익명)**: `<head>` 에 `<script src="../aiedu-log.js"></script>` 를 유지한다. 시작·완료·사용 지점에서 `window.aieduLog && aieduLog("start"|"finish"|"use", "영문소문자태그")` 만 호출하고, **아이가 입력한 낱말·필기·음성·정답·나라 이름 등 내용은 절대 넘기지 않는다**(IP·내용 미기록 원칙). 상세: 허브 저장소 `.claude/skills/aiedu-hub/references/usage-log.md`.
