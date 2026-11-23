/* 엔드게임 배우기: 개념마다 보기(자리+설명+화살표) → 확인 문제(테이블베이스 판정) → 실전 연습 링크.
   모든 자리와 수순은 리체스 테이블베이스로 확인한 것만 씀 */
(()=>{
const CON=[
 {id:"square",grp:"pawn",ko:"스퀘어 규칙",prac:"square",steps:[
  {fen:"7k/8/8/8/p7/8/4K3/8 w - - 0 1",hl:["a1","b1","c1","d1","a2","b2","c2","d2","a3","b3","c3","d3","a4","b4","c4","d4"],ar:[["e2","d3"]],t:"폰에서 승진 칸까지를 한 변으로 정사각형을 그려 봐요. 내 킹이 이 사각형 안에 들어가면 폰을 잡을 수 있어요."},
  {m:"Kd3",t:"Kd3로 사각형 안에 들어왔어요. 이제 폰이 어디까지 가든 따라잡아요."},
  {m:"a3 Kc2 a2 Kb2",t:"폰이 a2까지 왔지만 킹이 먼저 닿았어요."},
  {fen:"7k/8/8/8/p7/8/8/5K2 w - - 0 1",hl:["a1","b1","c1","d1","a2","b2","c2","d2","a3","b3","c3","d3","a4","b4","c4","d4"],t:"킹이 f1이면 한 수로는 사각형에 못 들어가요. 이 폰은 못 잡아요. 수를 세지 않고 눈으로 바로 판단하는 방법이에요."}],
 qz:[
  {fen:"7k/8/8/8/1p6/8/8/5K2 w - - 0 1",q:"흑 폰을 잡으러 가요. 사각형 안으로 들어가는 수는?",why:"b4 폰의 사각형은 b1부터 e4까지예요. Ke1이나 Ke2로 들어가면 돼요."},
  {fen:"7k/8/8/2p5/8/8/8/7K w - - 0 1",q:"이번엔 c5 폰이에요. 잡으러 가는 수는?",why:"c5 폰의 사각형은 c1부터 g5까지예요. Kg1이나 Kg2로 g줄에 들어가요."}]},
 {id:"act",grp:"pawn",ko:"킹 앞세우기",prac:"kpk",steps:[
  {fen:"4k3/8/8/8/8/8/4P3/4K3 w - - 0 1",ar:[["e1","d2"],["e1","f2"]],t:"폰만 밀면 흑 킹이 앞에서 막고 비겨요. 엔드게임에서 킹은 싸우는 기물이에요. 킹이 먼저 나가서 폰 길을 열어 줘요."},
  {fen:"3k4/8/8/8/8/8/3P4/3K4 w - - 0 1",ar:[["d1","c2"],["d1","e2"]],t:"폰 앞으로 킹을 올리는 게 기본이에요. 폰은 킹 뒤에서 천천히 따라와요."}],
 qz:[
  {fen:"4k3/8/8/8/8/8/4P3/4K3 w - - 0 1",q:"폰을 밀지 말고 이기는 수를 찾아요.",why:"Kd2나 Kf2로 킹이 먼저 나가요. e4를 먼저 밀면 흑 킹이 앞을 막아 비겨요."},
  {fen:"3k4/8/8/8/8/8/3P4/3K4 w - - 0 1",q:"이기는 수는?",why:"Kc2나 Ke2로 킹을 앞으로 보내요."},
  {fen:"3k4/8/8/8/8/8/2P5/2K5 w - - 0 1",q:"이기는 수는?",why:"Kb2나 Kd2로 킹부터 움직여요."}]},
 {id:"opp",grp:"pawn",ko:"오포지션",prac:"opp",o:"w",steps:[
  {fen:"8/8/4k3/8/4K3/4P3/8/8 b - - 0 1",hl:["e4","e6"],t:"두 킹이 한 칸 띄우고 마주 봤어요. 이때 둘 차례가 아닌 쪽이 오포지션을 가졌다고 해요. 지금은 흑 차례라 흑이 비켜야 해요."},
  {m:"Kd6 Kf5",t:"흑이 왼쪽으로 비키면 백 킹은 반대쪽으로 돌아 들어가요."},
  {m:"Ke7 Ke5",hl:["e5","e7"],t:"또 마주 봤고 또 흑 차례예요. 백 킹이 한 칸씩 앞으로 가요."},
  {m:"Kd7 Kf6",t:"이렇게 백 킹이 폰 앞길을 차지하면 이겨요."},
  {fen:"8/8/4k3/8/4K3/4P3/8/8 w - - 0 1",hl:["e4","e6"],t:"같은 자리라도 백 차례면 오포지션은 흑에게 있어요. 이건 비겨요. 누가 둘 차례인지가 전부예요."}],
 qz:[
  {fen:"8/8/8/4k3/8/3K4/4P3/8 w - - 0 1",q:"오포지션을 잡는 수는?",why:"Ke3로 e5 킹과 한 칸 띄우고 마주 봐요. 이제 흑이 먼저 비켜야 해요."},
  {fen:"8/8/3k4/8/2K5/3P4/8/8 w - - 0 1",q:"이기는 유일한 수는?",why:"Kd4로 d6 킹과 마주 봐요."},
  {fen:"8/4k3/8/8/2P1K3/8/8/8 w - - 0 1",q:"이기는 유일한 수는?",why:"Ke5로 e7 킹과 마주 봐요. 그다음 백 킹이 d6 쪽으로 들어가요."}]},
 {id:"dist",grp:"pawn",ko:"원거리 오포지션",prac:"opp",steps:[
  {fen:"4k3/8/8/1p5p/1P5P/8/8/4K3 w - - 0 1",hl:["e1","e8"],ar:[["e1","e2"]],t:"킹 사이가 세 칸, 다섯 칸처럼 홀수 칸 떨어져 마주 봐도 오포지션이에요. 멀리서 잡아 두면 가까워질 때 그대로 이어져요."},
  {m:"Ke2 Ke7",hl:["e2","e7"],t:"Ke2. 다섯 칸 띄우고 마주 봤어요."},
  {m:"Ke3 Ke6",hl:["e3","e6"],t:"흑이 따라오면 백도 같이 올라가요. 계속 홀수 칸이에요."},
  {m:"Ke4",hl:["e4","e6"],t:"한 칸 사이 오포지션이 됐고 흑 차례예요. 흑 킹이 비키면 백 킹이 폰을 잡으러 가요."}],
 qz:[
  {fen:"4k3/8/8/1p5p/1P5P/8/8/4K3 w - - 0 1",q:"이기는 유일한 수는?",why:"Ke2로 e8 킹과 다섯 칸 띄우고 마주 봐요."},
  {fen:"8/8/8/5kp1/8/8/8/6K1 w - - 0 1",q:"비기는 유일한 수는?",why:"Kf1로 f5 킹과 세 칸 띄우고 마주 봐요. 원거리 오포지션을 잡아야 g폰을 막아요."}]},
 {id:"diag",grp:"pawn",ko:"대각 오포지션",prac:"opp",o:"w",steps:[
  {fen:"8/8/8/2k5/8/4K3/3P4/8 b - - 0 1",hl:["e3","c5"],t:"킹이 대각선으로 한 칸 띄우고 마주 봐도 오포지션이에요. 흑 차례라 흑이 비켜야 해요."},
  {m:"Kd5 Kd3",hl:["d3","d5"],t:"흑이 d5로 오면 백은 Kd3로 바로 마주 봐요."},
  {m:"Kd6 Kd4",hl:["d4","d6"],t:"흑이 물러나면 백은 따라 올라가요."},
  {m:"Ke6 Kc5",t:"흑 킹이 비키는 순간 백 킹이 앞으로 들어가요."}],
 qz:[
  {fen:"8/8/8/2k5/8/4K3/3P4/8 w - - 0 1",q:"백 차례예요. 이기는 유일한 수는?",why:"Ke4로 앞으로 나가요. 흑 킹이 어디로 가든 다음 수에 다시 마주 볼 수 있어요."},
  {fen:"8/3p4/4k3/8/2K5/8/8/8 b - - 0 1",q:"이번엔 흑이에요. 이기는 유일한 수는?",why:"Ke5로 앞으로 나가요. 방향만 바뀐 같은 원리예요."}]},
 {id:"key",grp:"pawn",ko:"핵심 칸",prac:"kpk",steps:[
  {fen:"8/8/8/1k6/8/4K3/2P5/8 w - - 0 1",hl:["b4","c4","d4"],ar:[["e3","d4"]],t:"폰보다 두 칸 앞, 그 줄과 양옆 칸이 핵심 칸이에요. 내 킹이 여기 들어가면 누가 둘 차례든 이겨요."},
  {m:"Kd4",hl:["b4","c4","d4"],t:"Kd4. 핵심 칸에 들어갔으니 이긴 자리예요."},
  {fen:"8/8/k7/4K3/2P5/8/8/8 w - - 0 1",hl:["b6","c6","d6"],ar:[["e5","d6"]],t:"폰이 c4면 핵심 칸은 b6, c6, d6예요. 폰을 밀기 전에 킹부터 핵심 칸으로 보내요."}],
 qz:[
  {fen:"8/8/8/1k6/8/4K3/2P5/8 w - - 0 1",q:"핵심 칸을 노리는 수는?",why:"Kd4나 Kd3로 c4 쪽 핵심 칸에 다가가요."},
  {fen:"4k3/8/8/8/8/1KP5/8/8 w - - 0 1",q:"c3 폰의 핵심 칸으로 가는 수는?",why:"c3 폰의 핵심 칸은 b5, c5, d5예요. 킹을 4단으로 올려요."},
  {fen:"5k2/8/8/8/8/2P5/8/3K4 w - - 0 1",q:"이기는 유일한 수는?",why:"Kc2로 폰 옆을 지나 b줄 쪽 핵심 칸을 노려요. d줄로 가면 흑 킹이 먼저 막아요."}]},
 {id:"rookp",grp:"pawn",ko:"룩 폰",prac:"kpkd",steps:[
  {fen:"8/8/8/8/pk6/8/3K4/8 w - - 0 1",hl:["a1","b1","c1"],ar:[["d2","c1"]],t:"a줄, h줄 폰은 상대 킹이 구석에 들어가면 이길 수 없어요. 폰 하나 적어도 구석만 차지하면 비겨요."}],
 qz:[
  {fen:"8/8/8/8/pk6/8/3K4/8 w - - 0 1",q:"비기는 수는?",why:"Kc1, Kd1, Kc2처럼 a1 구석 쪽으로 킹을 보내요."}]},
 {id:"zug",grp:"pawn",ko:"추크츠방",prac:"opp",o:"w",steps:[
  {fen:"8/8/4k3/8/4K3/4P3/8/8 b - - 0 1",hl:["e4","e6"],t:"둘 차례인 쪽이 손해인 자리를 추크츠방이라고 해요. 체스엔 패스가 없어서 흑은 비켜야 하고, 그게 지는 원인이에요."},
  {fen:"8/8/3k4/1p1p4/1P6/2P1K3/8/8 w - - 0 1",ar:[["e3","d4"]],t:"Kd4로 들어가면 흑 킹은 d5 폰을 지키느라 자리를 못 비워요. 흑은 둘 수 있는 수가 다 손해예요."}],
 qz:[
  {fen:"8/8/3k4/1p1p4/1P6/2P1K3/8/8 w - - 0 1",q:"이기는 유일한 수는?",why:"Kd4. 흑 킹이 d5를 지키는 동안 흑 차례가 계속 돌아와요."},
  {fen:"8/8/4k3/8/2PK4/8/8/8 w - - 0 1",q:"이기는 유일한 수는?",why:"Kc5로 앞으로 나가요. 흑 킹이 비키면 백 킹이 b6나 d6로 들어가요."}]},
 {id:"shoulder",grp:"pawn",ko:"어깨치기",prac:"kpk",steps:[
  {fen:"8/8/8/8/2k5/8/5P2/3K4 w - - 0 1",hl:["d3","e3"],ar:[["d1","e2"]],t:"킹으로 상대 킹이 오는 길을 몸으로 막는 걸 어깨치기라고 해요. 흑 킹은 d3, e3를 지나 f폰을 노려요."},
  {m:"Ke2 Kd4 Kf3",t:"Ke2로 길을 막고 Kf3로 폰 옆에 붙었어요. 흑 킹은 돌아가느라 늦어요."}],
 qz:[
  {fen:"8/8/8/8/2k5/8/5P2/3K4 w - - 0 1",q:"이기는 유일한 수는?",why:"Ke2로 흑 킹이 d3로 오는 길을 막아요."},
  {fen:"8/4K3/8/3k4/3p4/8/8/3R4 w - - 0 1",q:"룩 대 폰이에요. 이기는 유일한 수는?",why:"Kd7로 흑 킹 옆을 돌아 폰 쪽으로 다가가요."}]},
 {id:"reti",grp:"pawn",ko:"레티 기동",prac:"square",steps:[
  {fen:"7K/8/k1P5/7p/8/8/8/8 w - - 0 1",ar:[["h8","g7"]],t:"h폰은 못 따라잡을 것 같고 c폰은 흑 킹이 잡을 것 같아요. 그런데 킹이 대각선으로 가면 두 일을 한꺼번에 해요."},
  {m:"Kg7 h4 Kf6",t:"킹이 h폰 사각형 쪽으로 가면서 c폰과도 가까워져요."},
  {m:"h3 Ke6 h2 c7",t:"흑이 h폰을 밀면 백 킹은 c폰을 도와 승진을 노려요."},
  {m:"Kb7 Kd7 h1=Q c8=Q+",t:"둘 다 퀸이 됐어요. 지는 자리를 비겼어요."}],
 qz:[
  {fen:"7K/8/k1P5/7p/8/8/8/8 w - - 0 1",q:"비기는 유일한 수는?",why:"Kg7로 대각선을 타요. h폰을 쫓으면서 c폰 쪽으로도 가요."},
  {fen:"K7/8/5P1k/p7/8/8/8/8 w - - 0 1",q:"좌우만 바뀌었어요. 비기는 유일한 수는?",why:"Kb7로 대각선을 타요."}]},
 {id:"rvp",grp:"rook",ko:"룩 대 폰",steps:[
  {fen:"6K1/6R1/2k5/1p6/8/8/8/8 w - - 0 1",hl:["a5","b5","c5","d5","e5","f5","g5","h5"],ar:[["g7","g5"]],t:"룩으로 상대 킹을 한 줄 밖으로 막으면 폰이 혼자 남아요. Rg5로 5단을 막아요."},
  {m:"Rg5 b4 Kf7",t:"흑 킹이 폰을 못 도우니 백 킹이 천천히 다가와요."},
  {m:"b3 Rg3 Kc5 Rxb3",t:"룩이 폰을 잡았어요."}],
 qz:[
  {fen:"6K1/6R1/2k5/1p6/8/8/8/8 w - - 0 1",q:"이기는 유일한 수는?",why:"Rg5로 5단을 막아 흑 킹이 폰 옆으로 못 오게 해요."},
  {fen:"8/8/8/3K4/8/p7/7R/1k6 w - - 0 1",q:"이기는 유일한 수는?",why:"Kc4로 다가가요. a2 Kb3 a1=Q 다음 Rh1이 메이트예요."},
  {fen:"8/1R6/8/8/8/p2K4/1k6/8 b - - 0 1",q:"흑이에요. 비기는 유일한 수는?",why:"Kc1. 킹이 폰 옆을 떠나지 않으면 백이 폰을 못 잡아요."}]},
 {id:"lucena",grp:"rook",ko:"루세나",prac:"lucena",steps:[
  {fen:"6K1/4k1P1/8/8/8/7r/8/5R2 w - - 0 1",t:"폰이 7단, 내 킹은 승진 칸 위, 상대 킹은 옆으로 밀려 있어요. 킹이 나오면 체크가 쏟아지니 룩으로 다리를 놓아요."},
  {m:"Re1+ Kd7",t:"먼저 체크로 흑 킹을 한 줄 더 밀어내요."},
  {m:"Re4 Kd6",ar:[["e4","g4"]],t:"Re4. 룩을 4단에 두는 게 다리 놓기예요."},
  {m:"Kf7 Rf3+ Kg6 Rg3+ Kf6 Rf3+ Kg5 Rg3+",t:"킹이 나와서 체크를 피해 내려와요."},
  {m:"Rg4",t:"룩이 막아 주면 체크가 끝나고 폰이 승진해요."}],
 qz:[
  {fen:"8/1P2k3/8/1K6/3R4/8/8/1r6 w - - 0 1",q:"이기는 수는?",why:"Rb4로 막으면 체크가 끝나요. 다리 놓기예요. Kc6, Ka6도 이겨요."},
  {fen:"8/1PK1k3/8/8/3R4/8/8/2r5 w - - 0 1",q:"체크를 받았어요. 이기는 수는?",why:"Kb6나 Kb8로 피해요. 4단 룩이 다음 체크를 막아 줄 수 있어요."}]},
 {id:"philidor",grp:"rook",ko:"필리도르",prac:"philidor",steps:[
  {fen:"1r2k3/R7/8/4PK2/8/8/8/8 b - - 0 1",ar:[["b8","b6"]],t:"흑 차례. 룩을 6단으로 올려 백 킹이 앞으로 못 오게 막아요."},
  {m:"Rb6 e6",t:"백이 폰을 6단으로 밀면 백 킹이 숨을 칸이 없어져요."},
  {m:"Rb1",ar:[["b1","f1"]],t:"그때 룩을 멀리 빼서 뒤에서 체크해요."},
  {m:"Kf6 Rf1+",t:"백 킹은 체크를 피할 곳이 없어요. 비겨요."}],
 qz:[
  {fen:"1r2k3/R7/8/4PK2/8/8/8/8 b - - 0 1",q:"흑이에요. 비기는 수는?",why:"Rb6로 6단을 막는 게 필리도르예요. b줄에 남아 있으면 버틸 수 있어요."},
  {fen:"4k3/R7/1r2P3/5K2/8/8/8/8 b - - 0 1",q:"폰이 6단에 왔어요. 비기는 수는?",why:"Rb1처럼 룩을 멀리 빼서 뒤에서 체크할 준비를 해요."}]}
];
const GRP={pawn:"킹과 폰",rook:"룩"};
const lp=()=>{try{return JSON.parse(localStorage.getItem("hansu-egl")||"{}")}catch(e){return {}}};
const lsave=o=>{try{localStorage.setItem("hansu-egl",JSON.stringify(o))}catch(e){}};
const nextOf=id=>{const P=lp(),i=CON.findIndex(c=>c.id===id);return CON.slice(i+1).concat(CON.slice(0,i)).find(c=>!P[c.id])||null};
/* 목록 (endgame.js가 부름) */
window.EGL={con:CON,list(){const P=lp(),nx=CON.find(c=>!P[c.id]),n=CON.filter(c=>P[c.id]).length;
  return `<p class="lnext">${nx?`다음 배울 것 <a href="endgame.html?c=${nx.id}">${esc(nx.ko)}</a>`:"다 배웠어요"}<span>${n} / ${CON.length}</span></p>`+
    Object.entries(GRP).map(([g,t])=>`<h2 class="gsec">${t}</h2><div class="gcards">${CON.filter(c=>c.grp===g).map(c=>{const s=c.steps[0];
      return `<a class="gcard" href="endgame.html?c=${c.id}">${miniBoard(s.fen,c.o||s.fen.split(" ")[1],null)}<span><b>${esc(c.ko)}</b>${P[c.id]?"<small>배움</small>":""}</span></a>`}).join("")}</div>`).join("")}};

const CID=new URL(location.href).searchParams.get("c"),C=CON.find(c=>c.id===CID);
if(!C)return;
document.body.classList.add("m-learn");setTimeout(()=>document.body.classList.remove("m-list","m-play"),0);
const F="abcdefgh",fi=s=>F.indexOf(s[0]),TB="https://tablebase.lichess.ovh/standard?fen=";
const bEl=$("#lb8"),mk=$("#lmarks");
let soundOn=true;try{soundOn=localStorage.getItem("hansu-sound")!=="off"}catch(e){}
const audio={},play=k=>{if(!soundOn)return;try{const a=audio[k]||(audio[k]=new Audio("sounds/"+k+".mp3"));a.currentTime=0;a.play().catch(()=>{})}catch(e){}};
const snd=(g,m)=>g.in_check()?"move-check":m.flags.includes("p")?"promote":m.captured?"capture":"move-self";
const tbc=new Map();
async function tb(fen){const k=fen.split(" ").slice(0,4).join(" ");if(tbc.has(k))return tbc.get(k);
  for(let t=0;t<3;t++){const r=await fetch(TB+encodeURIComponent(k+" 0 1")).catch(()=>null);
    if(r&&r.status===429){await new Promise(x=>setTimeout(x,1200*(t+1)));continue}
    if(!r||!r.ok)throw new Error("tb");const j=await r.json();tbc.set(k,j);return j}
  throw new Error("tb")}
const goodOf=j=>j.moves.filter(m=>j.category==="win"?m.category==="loss":j.category==="draw"?m.category==="draw"||m.category==="loss":true);

/* 보기 단계 자리 미리 계산 */
const ST=[];{let fen=null;for(const s of C.steps){let last=null;if(s.fen)fen=s.fen;if(s.m){const g=new Chess(fen);for(const x of s.m.split(" "))last=g.move(x);fen=g.fen()}ST.push({fen,last,s})}}
const S={ph:"see",i:0,qi:0,g:null,orient:"w",sel:null,last:null,ar:[],hl:[],busy:false,miss:0,done:false};
const order=()=>{const a=[];for(let r=0;r<8;r++)for(let c=0;c<8;c++)a.push(F[S.orient==="w"?c:7-c]+(S.orient==="w"?8-r:r+1));return a};
const sqEl=s=>bEl.querySelector(`[data-sq="${s}"]`);
function sqAt(x,y){const b=bEl.getBoundingClientRect(),c=Math.floor((x-b.left)/b.width*8),r=Math.floor((y-b.top)/b.height*8);if(c<0||c>7||r<0||r>7)return null;return F[S.orient==="w"?c:7-c]+(S.orient==="w"?8-r:r+1)}
const live=()=>S.ph==="quiz"&&!S.busy&&!S.done;
function arrowSvg(from,to,col){const d=s=>{const f=fi(s),r=+s[1];return S.orient==="w"?[f,8-r]:[7-f,r-1]};const [c1,r1]=d(from),[c2,r2]=d(to),x1=c1+.5,y1=r1+.5,x2=c2+.5,y2=r2+.5,l=Math.hypot(x2-x1,y2-y1),ux=(x2-x1)/l,uy=(y2-y1)/l,bx=x2-ux*.46,by=y2-uy*.46,W=.3;
  return `<g opacity=".85"><line x1="${x1}" y1="${y1}" x2="${bx}" y2="${by}" stroke="${col}" stroke-width=".2"/><polygon points="${x2},${y2} ${bx-uy*W},${by+ux*W} ${bx+uy*W},${by-ux*W}" fill="${col}"/></g>`}
function render(an){const g=S.g,me=g.turn(),dots=S.sel&&live()?g.moves({square:S.sel,verbose:true}).map(m=>m.to):[];let chk=null;
  if(g.in_check())for(const s of order()){const p=g.get(s);if(p&&p.type==="k"&&p.color===me)chk=s}
  bEl.innerHTML=order().map((s,n)=>{const p=g.get(s),r=Math.floor(n/8),c=n%8,dark=(fi(s)+ +s[1])%2===1;
    const cls=["s8",dark?"d":"l",S.last&&(S.last.from===s||S.last.to===s)?"lm":"",S.hl.includes(s)?"hl":"",S.sel===s?"sel":"",chk===s?"chk":"",p&&live()&&p.color===me?"own":""].join(" ");
    const co=(c===0?`<span class="co r">${s[1]}</span>`:"")+(r===7?`<span class="co f">${s[0]}</span>`:"");
    const dot=dots.includes(s)?(p?'<b class="cp8"></b>':'<b class="dt8"></b>'):"";
    return `<div class="${cls}" data-sq="${s}">${co}${p?`<i class="pc ${p.color}${p.type}${drag&&drag.from===s?" ghost":""}"></i>`:""}${dot}</div>`}).join("");
  mk.innerHTML=S.ar.map(([a,b,col])=>arrowSvg(a,b,col||"#5C54D6")).join("");
  if(an&&window.slideMove)slideMove(bEl,an)}
const msg=(t,c)=>{const e=$("#lMsg");e.className="emsg"+(c?" "+c:"");e.innerHTML=t};
const side=c=>c==="w"?"백":"흑";

function see(i,dir){S.ph="see";S.i=Math.max(0,Math.min(ST.length-1,i));const x=ST[S.i];S.g=new Chess(x.fen);S.orient=C.o||C.steps[0].fen.split(" ")[1];S.sel=null;S.last=x.last;S.hl=x.s.hl||[];S.ar=(x.s.ar||[]).map(a=>[a[0],a[1]]);
  $("#lStep").textContent=`보기 ${S.i+1} / ${ST.length}`;$("#lText").textContent=x.s.t;$("#lText").hidden=false;$("#lQ").hidden=true;
  $("#lPrev").disabled=S.i===0;$("#lNext").textContent=S.i===ST.length-1?"문제 풀기 →":"다음 →";$("#lNext").disabled=false;msg("");$("#lMsg").hidden=true;
  render(dir===1&&x.s.m&&x.last?x.last:null);if(dir===1&&x.s.m&&x.last)play(snd(S.g,x.last))}
function quiz(qi){S.ph="quiz";S.qi=qi;S.miss=0;S.busy=false;const q=C.qz[qi];S.g=new Chess(q.fen);S.orient=S.g.turn();S.sel=null;S.last=null;S.hl=[];S.ar=[];
  $("#lStep").textContent=`문제 ${qi+1} / ${C.qz.length}`;$("#lText").hidden=true;$("#lQ").hidden=false;$("#lQ").innerHTML=`<i class="${S.g.turn()}"></i>${side(S.g.turn())} 차례 · ${esc(q.q)}`;
  $("#lPrev").disabled=false;$("#lNext").textContent="다음 →";$("#lNext").disabled=true;$("#lMsg").hidden=false;msg("수를 두세요.");render()}
function finish(){S.done=true;const P=lp();P[C.id]=1;lsave(P);const nx=nextOf(C.id);$("#lNext").disabled=true;
  msg(`다 풀었어요. <div class="eacts" style="margin-top:10px">${C.prac?`<a class="btn pri" href="endgame.html?l=${C.prac}">실전에서 해보기</a>`:""}${nx?`<a class="btn" href="endgame.html?c=${nx.id}">다음: ${esc(nx.ko)}</a>`:""}<button id="lRe">처음부터</button></div>`,"good");
  $("#lRe").onclick=()=>{S.done=false;see(0)}}
async function judge(m){const q=C.qz[S.qi];S.busy=true;msg("확인 중...");let j;try{j=await tb(q.fen)}catch(e){S.busy=false;msg("테이블베이스 연결이 안 돼요. 잠시 뒤 다시 해 주세요.","bad");return}
  const gd=goodOf(j),ok=gd.some(x=>x.san===m.san);
  if(ok){S.hl=[];const last=S.qi===C.qz.length-1;msg(`맞아요. ${esc(q.why)}${last?"":`<div class="eacts" style="margin-top:10px"><button class="pri" id="lGo">다음 문제 (Enter)</button></div>`}`,"good");
    if(last){S.busy=false;setTimeout(finish,900);return}$("#lGo").onclick=()=>quiz(S.qi+1);S.busy=true;$("#lNext").disabled=false;return}
  S.miss++;const mv=j.moves.find(x=>x.san===m.san),c=mv?mv.category:"";
  const why=j.category==="win"?(c==="win"?"이 수면 오히려 져요.":"이 수면 이기던 자리가 비겨요."):"이 수면 져요.";
  msg(`${why} <div class="eacts" style="margin-top:10px"><button class="pri" id="lRetry">다시 (Enter)</button>${S.miss>=1?'<button id="lShow">정답 보기</button>':""}</div>`,"bad");
  $("#lRetry").onclick=retry;const sb=$("#lShow");if(sb)sb.onclick=()=>{retry();const a=gd[0];if(a){S.ar=[[a.uci.slice(0,2),a.uci.slice(2,4)]];render()}msg(esc(q.why))}}
function retry(){const q=C.qz[S.qi];S.g=new Chess(q.fen);S.last=null;S.sel=null;S.busy=false;msg("다시 둬 보세요.");render()}
function tryMove(from,to,an){if(!live())return false;const ms=S.g.moves({square:from,verbose:true}).filter(m=>m.to===to);if(!ms.length)return false;
  const m=S.g.move({from,to,promotion:"q"});S.last=m;S.sel=null;S.ar=[];play(snd(S.g,m));render(an?m:null);judge(m);return true}

/* 조작 */
let drag=null,floatEl=null,hov=null;
function endFloat(){if(floatEl){floatEl.remove();floatEl=null}if(hov){const o=sqEl(hov);if(o)o.classList.remove("hov");hov=null}document.body.classList.remove("grabbing")}
bEl.addEventListener("pointerdown",e=>{const s=sqAt(e.clientX,e.clientY);if(!s||e.button!==0)return;e.preventDefault();if(!live())return;const me=S.g.turn(),p=S.g.get(s);
  if(S.sel&&S.sel!==s&&!(p&&p.color===me)&&S.g.moves({square:S.sel,verbose:true}).some(m=>m.to===s)){tryMove(S.sel,s,true);return}
  if(p&&p.color===me){const was=S.sel===s;S.sel=s;render();const w=bEl.getBoundingClientRect().width/8;floatEl=document.createElement("i");floatEl.className=`pc ${me}${p.type} float`;floatEl.style.width=floatEl.style.height=w+"px";document.body.appendChild(floatEl);
    drag={from:s,was,x0:e.clientX,y0:e.clientY,moved:false,w};floatEl.style.transform=`translate(${e.clientX-w/2}px,${e.clientY-w/2}px)`;document.body.classList.add("grabbing");const pe=sqEl(s).querySelector(".pc");if(pe)pe.classList.add("ghost")}
  else{S.sel=null;render()}});
addEventListener("pointermove",e=>{if(!drag)return;floatEl.style.transform=`translate(${e.clientX-drag.w/2}px,${e.clientY-drag.w/2}px)`;if(Math.hypot(e.clientX-drag.x0,e.clientY-drag.y0)>3)drag.moved=true;
  const t=sqAt(e.clientX,e.clientY);if(t!==hov){if(hov){const o=sqEl(hov);if(o)o.classList.remove("hov")}hov=t;if(t&&t!==drag.from){const n=sqEl(t);if(n)n.classList.add("hov")}}});
addEventListener("pointerup",e=>{if(!drag)return;const d=drag;drag=null;endFloat();const to=sqAt(e.clientX,e.clientY);
  if(to&&to!==d.from){if(!tryMove(d.from,to,false)){try{if(S.g.moves({square:d.from,verbose:true,legal:false}).some(m=>m.to===to))play("illegal")}catch(_){}render()}return}
  if(to===d.from&&d.was&&!d.moved)S.sel=null;render()});
$("#lPrev").onclick=()=>{if(S.ph==="quiz"){if(S.qi>0)quiz(S.qi-1);else see(ST.length-1)}else see(S.i-1)};
$("#lNext").onclick=()=>{if(S.ph==="see"){if(S.i<ST.length-1)see(S.i+1,1);else quiz(0)}else if(S.qi<C.qz.length-1&&!$("#lNext").disabled)quiz(S.qi+1)};
$("#lQuiz").onclick=()=>quiz(0);
addEventListener("keydown",e=>{if(e.target.closest&&e.target.closest("input,textarea"))return;
  if(e.key==="ArrowRight"&&S.ph==="see"){e.preventDefault();$("#lNext").click()}
  else if(e.key==="ArrowLeft"&&S.ph==="see"){e.preventDefault();if(S.i>0)see(S.i-1)}
  else if(e.key==="Enter"){const b=$("#lGo")||$("#lRetry");if(b){e.preventDefault();b.click()}}});
$("#lH1").textContent=C.ko;document.title=C.ko+" - 한 수";$("#lName").textContent=C.ko;$("#lGrp").textContent=GRP[C.grp]+" · 배우기";
see(0);
})();
