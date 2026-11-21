# 한 수

체스 퍼즐 + 체스닷컴 전적 사이트. https://ewlazz.github.io/chess-puzzle/

- 드래그 / 클릭 이동
- 우클릭 화살표, 칸 표시 (Shift·Ctrl·Alt 색 변경)
- 프리무브
- 효과음
- 전적 (`stats.html?user=닉네임`): 체스닷컴 프로필, 레이팅, 최근 3개월 게임, 통계
- 게임 분석: 브라우저에서 Stockfish 19 lite로 평가 그래프, 수 분류, 정확도

## 퍼즐 추가

`index.html`의 `PUZ` 배열에 추가.

```js
{fen:"6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1", sol:["Rd8#"], title:"백랭크 메이트", theme:"메이트", kind:"mate", goal:"1수 메이트", lv:"쉬움"}
```

`sol`은 내 수와 상대 수를 번갈아 SAN으로. `kind`는 `mate` 또는 `win`.

## 출처

- [Chess.com 공개 API](https://www.chess.com/news/view/published-data-api)
- [Stockfish.js](https://github.com/nmrugg/stockfish.js) 19 lite (GPLv3, `engine/COPYING.txt`)
- [chess.js](https://github.com/jhlywa/chess.js) 0.10.3 (BSD-2-Clause)
- 기물 그림: cburnett (CC BY-SA 3.0)
