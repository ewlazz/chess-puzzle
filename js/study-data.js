/* 오프닝 공부 데이터. 수순과 평가는 Stockfish 19 깊이 18로 확인함.
   notes의 키는 몇 번째 수(반수) 뒤에 보여 줄지. gam은 이 오프닝을 고르는 수의 위치(0부터, 레이팅별 채택률 계산용). tags: bee(낮은 레이팅에서 승률 좋음), chad(전설의 갬빗) */
window.STUDY=[
{id:"greco",ko:"그레코 갬빗",en:"Italian Game: Classical Variation, Greco Gambit",eco:"C54",side:"w",tags:["chad"],
 one:"중앙 폰 두 개 밀고 e4를 줘요. 개발 앞서서 흑 킹 노리기",
 trunk:"e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d4 exd4 cxd4 Bb4+ Nc3 Nxe4 O-O",thumb:13,gam:12,
 notes:{
  5:"이탈리안. 비숍이 f7을 봐요.",
  7:"c3. 다음에 d4로 중앙을 밀려고요.",
  8:"흑은 Nf6로 e4를 노려요.",
  9:"바로 d4.",
  11:"중앙 폰 두 개. 흑은 체크로 시간을 벌어요.",
  12:"Bd2면 조용한 게임. 그레코는 여기서 Nc3.",
  13:"갬빗 시작. e4 폰을 줘요.",
  14:"흑이 폰을 먹었어요. 이제 캐슬링하고 판을 열어요.",
  15:"폰 하나 덜지만 개발이 빠르고 흑 킹은 아직 가운데예요. 엔진은 흑이 조금 낫다고 봐요(약 −0.4)."},
 lines:[
  {id:"moller",ko:"묄러 공격",sub:"8...Bxc3 9.d5",moves:"Bxc3 d5 Bf6 Re1 Ne7 Rxe4 d6 Bg5 Bxg5 Nxg5 O-O",
   notes:{16:"흑은 보통 나이트부터 잡아요.",17:"bxc3 말고 d5! 나이트를 쫓는 게 묄러 공격이에요.",18:"비숍이 대각선으로 빠져요.",19:"e파일 핀. e4 나이트가 묶였어요.",20:"Ne7로 나이트를 피해요.",21:"폰 하나 되찾았어요. 이제 기물 수가 같아요.",22:"d6로 d5 폰을 건드려요.",23:"Bg5로 지키는 비숍을 바꿔요.",25:"나이트가 킹 쪽으로 붙었어요.",26:"흑 킹은 대피했지만 백 기물이 다 나와 있어요. 엔진 평가 약 −0.5, 실전에선 백이 두기 편해요."}},
  {id:"moller2",ko:"묄러 공격: 9...Ne5",sub:"엔진이 좋아하는 흑의 응수",moves:"Bxc3 d5 Ne5 bxc3 Nxc4 Qd4 O-O Qxc4 Nd6 Qb3",
   notes:{18:"나이트가 중앙으로 와서 백 비숍을 노려요.",19:"비숍 먼저 잡아요.",20:"흑이 비숍을 잡았어요.",21:"Qd4! g7과 e4를 동시에 봐요.",23:"나이트 되찾음. 기물 수가 같아졌어요.",25:"Qb3. 퀸이 f7과 b7을 봐요. 비슷한 게임이에요."}},
  {id:"quiet",ko:"조용한 길",sub:"8...Bxc3 9.bxc3",moves:"Bxc3 bxc3 d5 Bd3 O-O Qc2 Re8 Re1 Bf5",
   notes:{17:"폰으로 다시 잡는 길. 묄러보다 덜 날카로워요.",18:"흑은 d5로 나이트를 받쳐요.",19:"Ba3는 dxc4로 흑이 좋아요. 비숍은 d3로.",21:"Qc2로 e4 나이트를 압박해요.",24:"폰 하나 덜고 비숍 쌍이 있어요. 평가 약 −0.5."}},
  {id:"nxc3",ko:"흑 8...Nxc3",sub:"흑의 침착한 대응",moves:"Nxc3 bxc3 d5 cxb4 dxc4 Re1+ Ne7 Qa4+ Bd7 b5 O-O Qxc4",
   notes:{16:"나이트로 먼저 잡는 수.",17:"폰으로 잡으면 b4 비숍이 공격받아요.",18:"d5! 흑이 비숍을 버티는 정답이에요.",19:"비숍을 잡아요.",20:"흑도 c4 비숍을 잡았어요.",21:"체크로 흑 캐슬링을 늦춰요.",23:"Qa4+로 c4 폰을 노려요.",27:"폰을 되찾았어요. 거의 동등해요."}},
  {id:"trap",ko:"그레코의 함정",sub:"1620년 그레코의 실전",trap:true,moves:"Nxc3 bxc3 Bxc3 Qb3 Bxa1 Bxf7+ Kf8 Bg5 Ne7 Ne5 Bxd4 Bg6 d5 Qf3+ Bf5 Bxf5 Bxe5 Be6+ Bf6 Bxf6 gxf6 Qxf6+ Ke8 Qf7#",
   notes:{18:"Bxc3? 룩까지 먹으려는 욕심이에요.",19:"그레코는 Qb3. 사실 Ba3가 더 세요(+2.4).",20:"Bxa1?? 여기선 d5로 버텨야 해요.",21:"f7 희생! 킹이 끌려 나와요.",23:"Bg5로 퀸을 건드려요.",25:"Ne5. 모든 기물이 킹으로 몰려요.",29:"체크!",33:"계속 체크.",39:"Qf7#. 체크메이트."}},
  {id:"d5",ko:"흑이 피하는 7...d5",sub:"폰을 안 먹는 경우",moves:"",alt:"e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d4 exd4 cxd4 Bb4+ Nc3 d5 exd5 Nxd5 O-O Bxc3 bxc3 O-O Re1",
   notes:{14:"폰을 안 먹고 d5로 받아쳐요.",15:"그냥 잡아요.",17:"캐슬링하고 e파일을 열 준비.",21:"e파일이 열려서 백이 좋아요(+1.6)."}}
 ]}
];
/* 오프닝 갈래 트리의 뿌리. 가지는 리체스 오프닝 이름 데이터에서 자동으로 만듦 */
window.OROOTS=[
{id:"italian",ko:"이탈리안 게임",en:"Italian Game",moves:"e4 e5 Nf3 Nc6 Bc4",side:"w",one:"비숍을 c4로. f7을 겨누며 빠르게 개발하는 오래된 오프닝"},
{id:"ruy",ko:"루이 로페즈",en:"Ruy Lopez",moves:"e4 e5 Nf3 Nc6 Bb5",side:"w",one:"비숍으로 c6 나이트를 눌러 e5를 압박하는 정통 오프닝"},
{id:"sicilian",ko:"시실리안 디펜스",en:"Sicilian Defense",moves:"e4 c5",side:"b",one:"c5로 비대칭을 만들어 이기러 가는 흑의 대표 응수"},
{id:"london",ko:"런던 시스템",en:"London System",moves:"d4 d5 Bf4",side:"w",one:"Bf4, e3, Nf3, c3 모양을 상대 수와 상관없이 그대로 쌓는 시스템"},
{id:"colle",ko:"콜 시스템",en:"Colle System",moves:"d4 d5 Nf3 Nf6 e3",side:"w",one:"e3, Bd3, c3로 단단히 짓고 나중에 e4로 판을 여는 시스템"},
{id:"qg",ko:"퀸즈 갬빗",en:"Queen's Gambit",moves:"d4 d5 c4",side:"w",one:"c4로 d5 폰을 흔드는 1.d4의 메인. 슬라브·QGD·QGA로 갈라져요"},
{id:"kid",ko:"킹스 인디언 디펜스",en:"King's Indian Defense",moves:"d4 Nf6 c4 g6 Nc3 Bg7",side:"b",one:"중앙을 내주고 피안케토 뒤 킹 쪽에서 반격하는 흑"},
{id:"nimzo",ko:"님조 인디언 디펜스",en:"Nimzo-Indian Defense",moves:"d4 Nf6 c4 e6 Nc3 Bb4",side:"b",one:"Bb4로 c3 나이트를 묶어 e4를 막는 흑의 정석"},
{id:"dutch",ko:"더치 디펜스",en:"Dutch Defense",moves:"d4 f5",side:"b",one:"f5로 e4 칸을 잡고 킹 쪽을 노리는 공격적인 흑"},
{id:"tromp",ko:"트롬포프스키 어택",en:"Trompowsky Attack",moves:"d4 Nf6 Bg5",side:"w",one:"2.Bg5로 바로 나이트를 건드려 이론을 피하는 백"},
{id:"bdg",ko:"블랙마-디머 갬빗",en:"Blackmar-Diemer Gambit",moves:"d4 d5 e4",side:"w",one:"폰을 주고 f파일과 빠른 개발로 몰아치는 백의 갬빗"}
];
