# 한 수

체스 퍼즐, 체스닷컴 전적·분석, 엔진 대국 사이트. https://ewlazz.github.io/chess-puzzle/

## 페이지

- **퍼즐** (`index.html`)
  - 기본 12개, 오늘의 퍼즐, 추천(퍼즐 레이팅), 테마 28종, 러시(3분·5분·생존), 내 실수
  - 추천·테마·러시·오늘은 리체스 공개 퍼즐 API 사용
- **전적** (`stats.html?user=닉네임`)
  - 체스닷컴 프로필·레이팅, 기간(3개월·1년·전체)
  - 게임 목록, 통계, 오프닝(레퍼토리 트리·정석 이탈·오프닝별 성적·엔진 점검), 정확도(여러 판 분석), 비교(레이팅·맞대결)
- **분석** (`analysis.html`)
  - PGN·FEN·리체스 링크 붙여넣기, 보드 에디터(`?fen=`)
  - 엔진 라인 3개, 변화수 두기, 수 분류·정확도, 오프닝 이름, 실수 퍼즐로 저장
- **대국** (`play.html`)
  - Stockfish 레벨 1~10, 시간 제한, 프리무브, 무르기, 끝나면 분석

공통: 체스닷컴식 보드 조작(드래그 판정, 우클릭 화살표·칸 표시, 프리무브), 효과음, 보드 색, 홈 화면 앱 설치.

## 파일

| 파일 | 내용 |
| --- | --- |
| `index.html` | 퍼즐 페이지 (스타일·스크립트 포함) |
| `stats.html`, `js/stats.js` | 전적 |
| `js/openings-tab.js`, `js/batch-tab.js`, `js/compare.js` | 전적의 오프닝·정확도·비교 탭 |
| `analysis.html`, `js/editor.js` | 붙여넣기·에디터 |
| `js/analysis.js` | 분석 화면 (전적·분석·대국에서 공용) |
| `play.html`, `js/play.js` | 엔진 대국 |
| `js/openings.js`, `data/openings.json` | 오프닝 이름·정석 판별 |
| `js/theme.js`, `manifest.json`, `sw.js` | 보드 색, 홈 화면 앱 |
| `css/site.css`, `pieces.css` | 공통 스타일, 기물 그림 |
| `engine/` | Stockfish 19 lite (단일 스레드) |

## 퍼즐 추가

`index.html`의 `PUZ` 배열에 추가.

```js
{fen:"6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1", sol:["Rd8#"], title:"백랭크 메이트", theme:"메이트", kind:"mate", goal:"1수 메이트", lv:"쉬움"}
```

`sol`은 내 수와 상대 수를 번갈아 SAN으로. `kind`는 `mate` 또는 `win`.

## 출처

- [Chess.com 공개 API](https://www.chess.com/news/view/published-data-api)
- [Lichess API](https://lichess.org/api) (퍼즐, 게임 내보내기)
- [lichess-org/chess-openings](https://github.com/lichess-org/chess-openings) (CC0)
- [Stockfish.js](https://github.com/nmrugg/stockfish.js) 19 lite (GPLv3, `engine/COPYING.txt`)
- [chess.js](https://github.com/jhlywa/chess.js) 0.10.3 (BSD-2-Clause)
- 기물 그림: cburnett (CC BY-SA 3.0)
- 효과음 (`sounds/`)
