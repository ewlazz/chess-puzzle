/* 엔드게임 연습: 주제마다 무작위 시작 자리를 리체스 테이블베이스로 골라 두고, 상대는 스톡피시 최고 레벨로 둠. 내 수 판정은 테이블베이스.
   내 수가 이기던 자리를 비기게(또는 비기던 자리를 지게) 만들면 바로 알려 주고 무르기를 권함. 별: 힌트·무르기 없이 3개, 쓰면 줄어듦 */
{
const F="abcdefgh",TB="https://tablebase.lichess.ovh/standard?fen=";
const L=[
 {id:"kq",grp:"mate",ko:"퀸 메이트",goal:"mate",w:"KQ",b:"K",minDtm:12,tl:15,sample:"8/8/8/4k3/8/8/8/3QK3 w - - 0 1"},
 {id:"kr",grp:"mate",ko:"룩 메이트",goal:"mate",w:"KR",b:"K",minDtm:22,tl:30,sample:"8/8/8/4k3/8/8/8/R3K3 w - - 0 1"},
 {id:"krr",grp:"mate",ko:"룩 두 개 메이트",goal:"mate",w:"KRR",b:"K",minDtm:8,tl:15,sample:"8/8/8/4k3/8/8/8/R3K2R w - - 0 1"},
 {id:"kbb",grp:"mate",ko:"비숍 두 개 메이트",goal:"mate",w:"KBB",b:"K",minDtm:26,tl:60,sample:"8/8/8/4k3/8/8/8/2B1KB2 w - - 0 1"},
 {id:"kbn",grp:"mate",ko:"비숍+나이트 메이트",goal:"mate",w:"KBN",b:"K",minDtm:50,tl:60,sample:"8/8/8/4k3/8/8/8/1NB1K3 w - - 0 1"},
 {id:"kpk",grp:"pawn",ko:"킹+폰 이기기",goal:"promote",w:"KP",b:"K",want:"win",maxGood:2,sample:"8/8/8/8/4k3/8/4P3/4K3 w - - 0 1"},
 {id:"opp",grp:"pawn",ko:"오포지션",goal:"promote",w:"KP",b:"K",want:"win",exactWin:1,pool:["8/8/8/4k3/8/3K4/4P3/8","8/8/3k4/8/2K5/3P4/8/8","8/2k5/8/8/2PK4/8/8/8","8/4k3/8/8/2P1K3/8/8/8","8/8/4k3/8/2PK4/8/8/8","8/8/8/2k5/8/4K3/3P4/8","5k2/8/8/8/8/2P5/8/3K4"],sample:"8/8/4k3/8/4K3/4P3/8/8 w - - 0 1"},
 {id:"kpkd",grp:"pawn",ko:"킹+폰 막기",goal:"draw",w:"K",b:"KP",want:"draw",needLose:1,maxGood:2,hold:12,sample:"8/8/8/4k3/4p3/8/8/4K3 w - - 0 1"},
 {id:"square",grp:"pawn",ko:"스퀘어 규칙",goal:"draw",w:"K",b:"KP",want:"draw",needLose:1,maxGood:3,hold:8,square:1,sample:"7k/8/8/p7/8/8/8/5K2 w - - 0 1"},
 {id:"kppkp",grp:"pawn",ko:"폰 두 개 vs 하나",goal:"promote",w:"KPP",b:"KP",want:"win",maxGood:2,sample:"8/8/4k3/p7/8/1P6/P3K3/8 w - - 0 1"},
 {id:"lucena",grp:"rook",ko:"루세나",goal:"promote",tpl:"lucena",want:"win",maxGood:5,sample:"8/4k3/8/6P1/6K1/8/7r/5R2 w - - 0 1"},
 {id:"pup",grp:"real",ko:"폰 엔드게임 · 폰 하나 유리",goal:"win",eng:"pawn",up:1,sample:"8/5pk1/6p1/7p/P6P/6P1/5PK1/8 w - - 0 1"},
 {id:"peq",grp:"real",ko:"폰 엔드게임 · 폰 같음",goal:"hold",eng:"pawn",up:0,hold:30,sample:"8/pp3pk1/6p1/8/8/6P1/PP3PK1/8 w - - 0 1"},
 {id:"rup",grp:"real",ko:"룩 엔드게임 · 폰 하나 유리",goal:"win",eng:"rook",up:1,sample:"6k1/5pp1/7p/8/8/6P1/r4PPP/3R2K1 w - - 0 1"},
 {id:"req",grp:"real",ko:"룩 엔드게임 · 폰 같음",goal:"hold",eng:"rook",up:0,hold:30,sample:"3r2k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1"},
 {id:"philidor",grp:"rook",ko:"필리도르",goal:"draw",tpl:"philidor",want:"draw",needLose:1,maxGood:3,hold:20,sample:"8/8/7r/3kp3/8/8/R7/4K3 w - - 0 1"}
];
const TLS=[15,30,60];
const GRP=[["mate","기본 메이트"],["pawn","폰 엔드게임"],["rook","룩 엔드게임"],["real","폰 많은 실전 엔드게임"]];
const GOAL={mate:"메이트하기",promote:"승진해서 이기기",draw:"무승부 지키기",win:"유리함 살려서 이기기",hold:"지지 않고 버티기"};
const prog=()=>{try{return JSON.parse(localStorage.getItem("hansu-eg")||"{}")}catch(e){return {}}};
const saveProg=o=>{try{localStorage.setItem("hansu-eg",JSON.stringify(o))}catch(e){}};
const stars=n=>"★".repeat(n)+`<s>${"★".repeat(3-n)}</s>`;
const qs=new URL(location.href).searchParams,LID=qs.get("l"),LS=L.find(x=>x.id===LID);
document.body.classList.add(LS?"m-play":"m-list");
let TL=LS&&LS.goal==="mate"&&TLS.includes(+qs.get("t"))?+qs.get("t"):0;

/* 목록 */
function list(){const P=prog();
  $("#eList").innerHTML=GRP.map(([g,t])=>`<h2 class="gsec">${t}</h2><div class="gcards">${L.filter(x=>x.grp===g).map(x=>{const p=P[x.id];
    return `<a class="gcard" href="endgame.html?l=${x.id}">${miniBoard(x.sample,"w",null)}<span><b>${esc(x.ko)}</b><small>${GOAL[x.goal]}</small>${p?`<em>${stars(p.s)}</em>`:""}</span></a>`}).join("")}</div>`).join("")}

/* 테이블베이스 */
const tbc=new Map();
async function tb(fen){const k=fen.split(" ").slice(0,4).join(" ");if(tbc.has(k))return tbc.get(k);
  for(let t=0;t<3;t++){const r=await fetch(TB+encodeURIComponent(k+" 0 1")).catch(()=>null);
    if(r&&r.status===429){await new Promise(x=>setTimeout(x,1200*(t+1)));continue}
    if(!r||!r.ok)throw new Error("tb");const j=await r.json();tbc.set(k,j);return j}
  throw new Error("tb")}

/* 무작위 자리 만들기 */
const rnd=n=>Math.floor(Math.random()*n),sq=(f,r)=>F[f]+(r+1),fi=s=>F.indexOf(s[0]),ri=s=>+s[1]-1;
const dist=(a,b)=>Math.max(Math.abs(fi(a)-fi(b)),Math.abs(ri(a)-ri(b)));
function fenOf(P){const B=[...Array(8)].map(()=>Array(8).fill(""));for(const [s,p] of Object.entries(P))B[7-ri(s)][fi(s)]=p;
  return B.map(r=>{let o="",e=0;for(const c of r){if(!c)e++;else{if(e)o+=e;e=0;o+=c}}return o+(e||"")}).join("/")+" w - - 0 1"}
function legal(fen){try{const g=new Chess(fen);if(!g.validate_fen(fen).valid||g.in_check()||g.game_over())return false;const b=new Chess(fen.replace(" w "," b "));return !b.in_check()}catch(e){return false}}
function randPos(x){
  if(x.pool){const P={},rows=x.pool[rnd(x.pool.length)].split("/"),mir=Math.random()<.5;rows.forEach((r,i)=>{let f=0;for(const c of r){if(/\d/.test(c))f+=+c;else{P[sq(mir?7-f:f,7-i)]=c;f++}}});return P}
  /* 루세나: 폰이 4~6단, 내 킹은 폰 앞쪽, 룩이 상대 킹을 한 줄 밖으로 막고 있는 단계부터 */
  if(x.tpl==="lucena"){const pf=1+rnd(6),s=pf<=3?1:-1,pr=3+rnd(3),P={},put=(f,r,c)=>{if(f<0||f>7||r<0||r>7)return;const k=sq(f,r);if(!P[k])P[k]=c};
    put(pf,pr,"P");put(pf+rnd(3)-1,Math.min(7,pr+1+rnd(2)),"K");put(pf+s,rnd(4),"R");put(pf+s*(2+rnd(2)),Math.min(7,pr+rnd(4)),"k");put(pf-s*(1+rnd(3)),rnd(8),"r");return Object.keys(P).length===5?P:null}
  /* 필리도르: 상대 폰이 아직 4~5단, 내 킹은 폰 앞, 룩 자리는 아직 안 잡힌 단계부터 */
  if(x.tpl==="philidor"){const pf=1+rnd(6),pr=3+rnd(2),P={},put=(f,r,c)=>{if(f<0||f>7||r<0||r>7)return;const k=sq(f,r);if(!P[k])P[k]=c};
    put(pf,pr,"p");put(pf+rnd(3)-1,pr+rnd(2),"k");put(pf+rnd(3)-1,rnd(2),"K");put(rnd(8),rnd(6),"R");put(rnd(8),2+rnd(6),"r");return Object.keys(P).length===5?P:null}
  const P={},used=new Set(),put=(c,r)=>{let s,t=0;do{s=sq(rnd(8),r!=null?r:rnd(8));t++}while(used.has(s)&&t<50);used.add(s);P[s]=c;return s};
  const pr=(c)=>c==="P"?1+rnd(5):c==="p"?(x.square?3+rnd(2):2+rnd(5)):null;
  for(const c of x.w)put(c,c==="P"?pr("P"):null);for(const c of x.b)put(c.toLowerCase(),c==="P"?pr("p"):null);
  if(x.w==="KBB"){const bs=Object.keys(P).filter(s=>P[s]==="B");if(bs.length===2&&(fi(bs[0])+ri(bs[0]))%2===(fi(bs[1])+ri(bs[1]))%2)return null}
  const at=c=>Object.keys(P).find(s=>P[s]===c);
  if(x.id==="opp"){const K=at("K"),k=at("k"),p=at("P");if(!(ri(K)>ri(p)&&Math.abs(fi(K)-fi(p))<=1&&ri(k)>ri(K)&&Math.abs(fi(k)-fi(K))<=1&&(dist(K,k)===2||dist(K,k)===3)))return null}
  if(x.id==="kpk"){const K=at("K"),p=at("P");if(dist(K,p)>2)return null}
  if(x.square){const p=Object.keys(P).find(s=>P[s]==="p"),k=Object.keys(P).find(s=>P[s]==="k"),K=Object.keys(P).find(s=>P[s]==="K");if(dist(p,k)<4||dist(K,p)<3||dist(K,p)>5)return null}
  return P}
const kAdj=P=>{const K=Object.keys(P).find(s=>P[s]==="K"),k=Object.keys(P).find(s=>P[s]==="k");return K&&k&&dist(K,k)<2};
function fits(x,j){if(!j||!j.moves)return false;const win=j.moves.filter(m=>m.category==="loss").length,lose=j.moves.filter(m=>m.category==="win").length;
  if(x.goal==="mate")return j.category==="win"&&(j.dtm==null||Math.abs(j.dtm)>=x.minDtm);
  const gd=x.want==="win"?win:j.moves.length-lose;if(x.maxGood&&gd>x.maxGood)return false;
  if(x.want==="win"){if(j.category!=="win")return false;if(x.needAlt&&win===j.moves.length)return false;if(x.exactWin&&win!==1)return false;if(x.maxWin&&win>x.maxWin)return false;return true}
  if(x.want==="draw")return j.category==="draw"&&(!x.needLose||lose>0);return false}
async function makePos(x,tok){let calls=0;for(let t=0;t<400;t++){if(tok!==TOK)return null;const P=randPos(x);if(!P||kAdj(P))continue;const fen=fenOf(P);if(!legal(fen))continue;
  if(++calls>70)break;const j=await tb(fen);if(fits(x,j))return fen}return null}

/* 상대: 스톡피시 19 (레벨 20, 수마다 약 1초) */
const E={w:null,ready:null,cb:null,
  init(){if(this.ready)return this.ready;this.ready=new Promise((res,rej)=>{try{this.w=new Worker("engine/stockfish-19-lite-single.js")}catch(e){rej(e);return}this.w.onerror=rej;let ok=false;
    this.w.onmessage=e=>{const l=String(e.data);if(this.mp&&l.startsWith("info")&&l.includes(" multipv ")&&l.includes(" pv ")&&!/ (lower|upper)bound/.test(l)){const n=+/ multipv (\d+)/.exec(l)[1],m=/score (cp|mate) (-?\d+)/.exec(l),pv=/ pv (\S+)/.exec(l);if(m&&pv)this.mp[n]={mv:pv[1],t:m[1],v:+m[2]}}if(l.startsWith("info")&&l.includes(" score ")&&!/ (lower|upper)bound/.test(l)){const m=/score (cp|mate) (-?\d+)/.exec(l);if(m)this.sc={t:m[1],v:+m[2]}}if(l==="uciok"){this.w.postMessage("setoption name Hash value 64");this.w.postMessage("setoption name Skill Level value 20");this.w.postMessage("isready")}else if(l==="readyok"){if(!ok){ok=true;res()}}else if(l.startsWith("bestmove")&&this.cb){const c=this.cb;this.cb=null;c(l.split(" ")[1])}};
    this.w.postMessage("uci")});return this.ready},
  q:Promise.resolve(),
  move(fen,ms){return this.go(fen,"movetime "+(ms||1000)).then(r=>r.best)},
  /* 후보 수 여러 개와 각 평가(백 기준) */
  multi(fen,depth,n){const run=()=>this.init().then(()=>new Promise(res=>{this.mp={};const w=fen.split(" ")[1]==="w"?1:-1;
      this.cb=()=>{const o=Object.keys(this.mp).sort((a,b)=>a-b).map(k=>{const x=this.mp[k];return {mv:x.mv,ev:(x.t==="mate"?(x.v>0?100:-100):x.v/100)*w}});this.mp=null;this.w.postMessage("setoption name MultiPV value 1");res(o)};
      this.w.postMessage("setoption name MultiPV value "+n);this.w.postMessage("position fen "+fen);this.w.postMessage("go depth "+depth)}));
    const p=this.q.then(run,run);this.q=p.catch(()=>{});return p},
  /* 최선 수 + 평가(백 기준 폰 단위, 메이트는 ±100) */
  go(fen,lim){const run=()=>this.init().then(()=>new Promise(res=>{this.sc=null;this.cb=b=>{const s=this.sc,w=fen.split(" ")[1]==="w"?1:-1;res({best:b,ev:s?(s.t==="mate"?(s.v>0?100:-100)*w:s.v/100*w):0})};this.w.postMessage("position fen "+fen);this.w.postMessage("go "+lim)}));
    const p=this.q.then(run,run);this.q=p.catch(()=>{});return p}
};
if(LS)E.init().catch(()=>{});
/* 판 */
let EV=0,evh=[],pq=[],g=null,orient="w",start="",TOK=0,phase="idle",usedHelp=0,myMoves=0,sel=null,drag=null,floatEl=null,hov=null,hint=null,lastM=null,anim=null,hist=[];
const bEl=$("#eb8"),sqEl=s=>bEl.querySelector(`[data-sq="${s}"]`);
let soundOn=true;try{soundOn=localStorage.getItem("hansu-sound")!=="off"}catch(e){}
const audio={};const play=k=>{if(!soundOn)return;try{const a=audio[k]||(audio[k]=new Audio("sounds/"+k+".mp3"));a.currentTime=0;a.play().catch(()=>{})}catch(e){}};
const snd=(m,opp)=>g.in_check()?"move-check":m.flags.includes("p")?"promote":m.captured?"capture":opp?"move-opponent":"move-self";
const order=()=>{const a=[];for(let r=0;r<8;r++)for(let c=0;c<8;c++)a.push(F[orient==="w"?c:7-c]+(orient==="w"?8-r:r+1));return a};
function sqAt(x,y){const b=bEl.getBoundingClientRect(),c=Math.floor((x-b.left)/b.width*8),r=Math.floor((y-b.top)/b.height*8);if(c<0||c>7||r<0||r>7)return null;return F[orient==="w"?c:7-c]+(orient==="w"?8-r:r+1)}
const myTurn=()=>phase==="play"&&g&&g.turn()==="w";
/* 프리무브: 상대가 두는 동안 미리 걸어 둠. 보드엔 걸어 둔 대로 옮겨 보여 줌 */
const waitOpp=()=>phase==="busy"&&g&&!!g;
function vpos(){const B={};for(const s of order()){const p=g.get(s);if(p)B[s]=p}for(const m of pq){const p=B[m.from];if(!p)continue;delete B[m.from];B[m.to]=p.type==="p"&&/[18]/.test(m.to[1])?{type:"q",color:p.color}:p}return B}
const at=s=>pq.length?vpos()[s]||null:g.get(s);
function pmTargets(s){const p=at(s);if(!p)return [];const f=fi(s),r=+s[1],out=[],add=(df,dr)=>{const nf=f+df,nr=r+dr;if(nf>=0&&nf<8&&nr>=1&&nr<=8)out.push(F[nf]+nr)},ray=(df,dr)=>{for(let k=1;k<8;k++)add(df*k,dr*k)};
  const D=[[1,1],[1,-1],[-1,1],[-1,-1]],O=[[1,0],[-1,0],[0,1],[0,-1]];
  if(p.type==="n")[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]].forEach(d=>add(...d));if(p.type==="b"||p.type==="q")D.forEach(d=>ray(...d));if(p.type==="r"||p.type==="q")O.forEach(d=>ray(...d));
  if(p.type==="k")D.concat(O).forEach(d=>add(...d));if(p.type==="p"){add(0,1);if(r===2)add(0,2);add(1,1);add(-1,1)}return out}
const canPre=()=>phase==="busy"&&g&&g.turn()==="b";
function addPre(from,to){if(pq.length<10)pq.push({from,to});sel=null;play("premove");render()}
function render(){if(!g)return;const legalT=sel?(myTurn()?g.moves({square:sel,verbose:true}).map(m=>m.to):canPre()?pmTargets(sel):[]):[];let chk=null;const vb=pq.length?vpos():null;
  if(g.in_check())for(const s of order()){const p=g.get(s);if(p&&p.type==="k"&&p.color===g.turn())chk=s}
  bEl.innerHTML=order().map((s,n)=>{const p=vb?vb[s]||null:g.get(s),r=Math.floor(n/8),c=n%8,dark=(fi(s)+ +s[1])%2===1;
    const cls=["s8",dark?"d":"l",lastM&&(lastM.from===s||lastM.to===s)?"lm":"",pq.some(m=>m.from===s||m.to===s)?"pre":"",sel===s?"sel":"",chk===s?"chk":"",p&&p.color==="w"&&(myTurn()||canPre())?"own":""].join(" ");
    const co=(c===0?`<span class="co r">${s[1]}</span>`:"")+(r===7?`<span class="co f">${s[0]}</span>`:"");
    const dot=legalT.includes(s)?(p?'<b class="cp8"></b>':'<b class="dt8"></b>'):"";
    return `<div class="${cls}" data-sq="${s}">${co}${p?`<i class="pc ${p.color}${p.type}${drag&&drag.from===s?" ghost":""}"></i>`:""}${dot}</div>`}).join("");
  $("#emarks").innerHTML=hint?arrowSvg(hint.from,hint.to):"";
  if(anim){const a=anim;anim=null;if(window.slideMove)slideMove(bEl,a)}
  const h=g.history();$("#eMv").innerHTML=h.map((s,i)=>i%2===0?`<b>${i/2+1}.</b> ${esc(s)}`:esc(s)).join(" ");
  stat()}
function arrowSvg(from,to){const d=s=>{const f=fi(s),r=+s[1];return orient==="w"?[f,8-r]:[7-f,r-1]};const [c1,r1]=d(from),[c2,r2]=d(to),x1=c1+.5,y1=r1+.5,x2=c2+.5,y2=r2+.5,l=Math.hypot(x2-x1,y2-y1),ux=(x2-x1)/l,uy=(y2-y1)/l,bx=x2-ux*.46,by=y2-uy*.46,W=.3;
  return `<g opacity=".85"><line x1="${x1}" y1="${y1}" x2="${bx}" y2="${by}" stroke="#5C54D6" stroke-width=".2"/><polygon points="${x2},${y2} ${bx-uy*W},${by+ux*W} ${bx+uy*W},${by-ux*W}" fill="#5C54D6"/></g>`}
function stat(){const x=LS;$("#eStat").innerHTML=x.goal==="hold"?`버틴 수 ${myMoves} / ${x.hold}`:x.goal==="draw"?`버틴 수 ${myMoves} / ${x.hold}`:`내 수 ${myMoves}`;
  $("#bUndo").disabled=!!TL||!hist.length||phase==="busy";$("#bHint").disabled=!!TL||!(phase==="play"&&myTurn());clk()}
const msg=(t,c)=>{$("#eMsg").className="emsg"+(c?" "+c:"");$("#eMsg").innerHTML=t};
/* 폰 많은 실전 엔드게임: 무작위 폰 구조 + (룩) 를 만들고 스톡피시로 평가해 골라 둠 */
function randReal(x){const P={},used=new Set(),put=(s,c)=>{if(used.has(s))return false;used.add(s);P[s]=c;return true};
  const n=3+rnd(3),fl=[0,1,2,3,4,5,6,7].sort(()=>Math.random()-.5),bf=fl.slice(0,n),wf=[0,1,2,3,4,5,6,7].sort(()=>Math.random()-.5).slice(0,n+x.up);
  const bR={};for(const f of bf){const r=4+rnd(3);bR[f]=r;put(sq(f,r),"p")}
  for(const f of wf){let r=1+rnd(3);if(bR[f]!=null&&r>=bR[f])r=Math.max(1,bR[f]-1-rnd(2));if(bR[f]!=null&&r>=bR[f])return null;if(!put(sq(f,r),"P"))return null}
  let K,k,t=0;do{K=sq(rnd(8),rnd(3));k=sq(rnd(8),5+rnd(3));t++}while((used.has(K)||used.has(k)||dist(K,k)<2)&&t<40);if(!put(K,"K")||!put(k,"k"))return null;
  if(x.eng==="rook"){let a,b,u=0;do{a=sq(rnd(8),rnd(2));b=sq(rnd(8),6+rnd(2));u++}while((used.has(a)||used.has(b))&&u<40);if(!put(a,"R")||!put(b,"r"))return null}
  return P}
const fmtEv=v=>Math.abs(v)>=50?(v>0?"메이트":"메이트 당함"):(v>0?"+":"")+v.toFixed(1);
/* 쉬운 자리는 버림: 엔진 후보 4개 중 좋은 수가 1~2개뿐인 자리만 씀(이기는 쪽은 앞서되 너무 크게 앞서지 않게).
   끝까지 못 찾으면 그중 제일 까다로웠던 자리 */
async function engPos(x,tok){let fb=null,fbS=99;const t0=performance.now();
  for(let t=0;t<80&&performance.now()-t0<25000;t++){if(tok!==TOK)return null;const P=randReal(x);if(!P)continue;const fen=fenOf(P);if(!legal(fen))continue;
    if(new Chess(fen).moves().length<5)continue;
    const r=await E.go(fen,"depth 8");if(tok!==TOK)return null;const v=r.ev;
    const pre=x.up?(x.eng==="pawn"?v>=.8&&v<=4.5:v>=.6&&v<=2.5):Math.abs(v)<=.6;if(!pre)continue;
    const a=await E.multi(fen,11,4);if(tok!==TOK)return null;if(a.length<4)continue;const best=a[0].ev;
    const ok2=x.up?(x.eng==="pawn"?best>=1&&best<=4.5:best>=.6&&best<=2.5):Math.abs(best)<=.5;if(!ok2)continue;
    const keep=a.filter(m=>m.ev>=best-(x.up?.8:.7)).length;
    const b0=new Chess(fen).move({from:a[0].mv.slice(0,2),to:a[0].mv.slice(2,4),promotion:"q"});if(b0&&b0.captured)continue;/* 잡기만 하면 되는 자리는 뻔함 */
    if(keep<fbS){fbS=keep;fb={fen,ev:best}}
    if(keep<=2){EV=best;return fen}}
  if(fb){EV=fb.ev;return fb.fen}return null}
/* 불렛: 내 차례일 때만 시계가 줄어듦. 상대는 빨리(0.12초) 둠. 힌트·무르기 없음 */
const CL={left:0,last:0,on:false};
function clk(){const el=$("#eClk");if(!el)return;if(!TL){el.hidden=true;return}el.hidden=false;const v=Math.max(0,CL.left)/1000;el.textContent=v>=10?Math.ceil(v)+"초":v.toFixed(1)+"초";el.className="eclk"+(CL.on&&myTurn()?" run":"")+(v<5?" low":"")}
setInterval(()=>{const n=performance.now();if(TL&&CL.on&&myTurn()){CL.left-=n-CL.last;if(CL.left<=0){CL.left=0;CL.on=false;clk();timeout();return}}CL.last=n;clk()},50);
function timeout(){pq=[];phase="slip";render();msg('시간 초과! <div class="eacts" style="margin-top:10px"><button class="pri" id="eNext">다음 (Enter)</button></div>',"bad");$("#eNext").onclick=newGame}
function goTimed(){if(phase!=="ready")return;$("#eReady").hidden=true;phase="play";CL.left=TL*1000;CL.last=performance.now();CL.on=true;msg("메이트하세요!");render()}
addEventListener("keydown",e=>{if(!LS||e.target.closest&&e.target.closest("input,textarea"))return;if(e.key==="Enter"||e.key===" "){if(phase==="ready"){e.preventDefault();goTimed()}else if(TL&&(phase==="done"||phase==="slip")){e.preventDefault();newGame()}}});
async function newGame(){CL.on=false;$("#eReady").hidden=true;const x=LS,tok=++TOK;phase="busy";g=null;pq=[];hist=[];evh=[];usedHelp=0;myMoves=0;sel=null;hint=null;lastM=null;
  $("#bUndo").disabled=$("#bHint").disabled=true;msg("자리 만드는 중…");bEl.innerHTML="";
  let fen=null;if(x.eng){msg("자리 만드는 중… 엔진이 고르고 있어요");try{fen=await engPos(x,tok)}catch(e){fen=null}if(tok!==TOK)return;if(!fen){msg('알맞은 자리를 못 찾았어요. <button class="lnk" id="eRetry">다시</button>',"bad");$("#eRetry").onclick=newGame;return}}
  else try{fen=await makePos(x,tok)}catch(e){if(tok===TOK){msg('테이블베이스에 연결하지 못했어요. <button class="lnk" id="eRetry">다시</button>',"bad");$("#eRetry").onclick=newGame}return}
  if(tok!==TOK)return;if(!fen){msg('알맞은 자리를 못 찾았어요. <button class="lnk" id="eRetry">다시</button>',"bad");$("#eRetry").onclick=newGame;return}
  start=fen;g=new Chess(fen);if(TL){phase="ready";CL.left=TL*1000;render();$("#eReady").hidden=false;msg(`${TL}초 안에 메이트하세요. 시작을 누르면 시계가 가요.`);return}phase="play";msg("백 차례예요.");render()}
async function after(m){/* 내 수 뒤 판정 */
  myMoves++;sel=null;hint=null;const x=LS;
  if(x.eng){if(g.in_checkmate()){finish(true);return}
    if(g.in_draw()){if(x.goal==="hold")finish(true);else slip("무승부가 됐어요.");return}
    phase="busy";render();const tok=TOK;let r;try{r=await E.go(g.fen(),"movetime 900")}catch(e){phase="play";msg("엔진을 못 불러왔어요.","bad");return}
    if(tok!==TOK||!g)return;const ev=r.ev,b=EV;
    if(ev>=5){EV=ev;finish(true);return}
    if(x.goal==="win"&&ev<b-1.2&&ev<1){slip(`이 수로 유리함을 많이 잃었어요. 평가 ${fmtEv(b)} → ${fmtEv(ev)}`);return}
    if(x.goal==="hold"&&ev<=-2&&ev<b-1){slip(`이 수로 지는 쪽으로 기울었어요. 평가 ${fmtEv(b)} → ${fmtEv(ev)}`);return}
    if(x.goal==="hold"&&myMoves>=x.hold){EV=ev;finish(true);return}
    EV=ev;const u=r.best;if(!u||u==="(none)"){phase="play";render();return}
    const mv=g.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||"q"});if(!mv){phase="play";render();return}
    lastM=mv;anim=mv;play(snd(mv,true));phase="play";
    if(g.in_checkmate()){render();slip("메이트당했어요.");return}
    if(g.in_draw()){if(x.goal==="hold")finish(true);else{render();slip("무승부가 됐어요.")}return}
    msg(x.goal==="hold"?"잘 버티고 있어요.":"유리함을 지키고 있어요. 계속.");render();
    if(pq.length){const pm=pq.shift();if(!tryMove(pm.from,pm.to,"q")){pq=[];render()}}return}
  if(g.in_checkmate()){finish(true);return}
  if(g.in_stalemate()||g.insufficient_material()||g.in_threefold_repetition()){if(x.goal==="draw")finish(true);else slip(g.in_stalemate()?"스테일메이트예요. 무승부가 됐어요.":"무승부가 됐어요.");return}
  phase="busy";render();const ep=TL?E.move(g.fen(),120).catch(()=>null):null;let j;try{j=await tb(g.fen())}catch(e){phase="play";msg("테이블베이스에 연결하지 못했어요. 이 수는 판정을 못 했어요.","bad");return}
  if(x.goal==="draw"){if(j.category==="win"){slip("이 수로 지는 자리가 됐어요.");return}if(myMoves>=x.hold){finish(true);return}}
  else{if(j.category!=="loss"){slip(j.category==="draw"||j.category==="blessed-loss"?"이 수로 무승부가 됐어요.":"이 수로 지는 자리가 됐어요.");return}
    if(x.goal==="promote"&&m.flags.includes("p")){finish(true);return}}
  /* 상대 수: 스톡피시 최고 레벨. 엔진이 안 되면 테이블베이스 최선 수 */
  const tok=TOK,t0=performance.now();let u=null;try{u=await (ep||E.move(g.fen()))}catch(e){}
  if(tok!==TOK||!g)return;if(!u||u==="(none)"){const best=j.moves&&j.moves[0];if(!best){phase="play";render();return}u=best.uci}
  if(!TL)await new Promise(r=>setTimeout(r,Math.max(0,350-(performance.now()-t0))));if(tok!==TOK||!g)return;
  const r=g.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||"q"});if(!r){phase="play";render();return}
  lastM=r;anim=r;play(snd(r,true));phase="play";
  if(g.in_checkmate()){render();slip("메이트당했어요.");return}
  if(g.in_stalemate()||g.insufficient_material()){if(x.goal==="draw")finish(true);else{render();slip("무승부가 됐어요.")}return}
  if(!TL)msg(x.goal==="draw"?"잘 막고 있어요.":"이기는 자리예요. 계속.");render();
  if(pq.length){const pm=pq.shift();if(!tryMove(pm.from,pm.to,"q")){pq=[];render()}}}
function slip(t){pq=[];phase="slip";CL.on=false;render();if(TL){msg(`${t} <div class="eacts" style="margin-top:10px"><button class="pri" id="eNext">다음 (Enter)</button></div>`,"bad");$("#eNext").onclick=newGame;return}msg(`${t} <button class="lnk" id="eUndo2">무르기</button>`,"bad");$("#eUndo2").onclick=undo}
function finish(ok){pq=[];phase="done";CL.on=false;
  if(TL){const P=prog(),k=LS.id+"@"+TL,v=Math.max(0,CL.left),nb=!P[k]||v>P[k].best;if(nb)P[k]={best:v,t:Date.now()};saveProg(P);render();
    msg(`메이트! ${(v/1000).toFixed(1)}초 남김${nb?" · 최고 기록":` · 최고 ${(P[k].best/1000).toFixed(1)}초`}<div class="eacts" style="margin-top:10px"><button class="pri" id="eNext">다음 (Enter)</button><a class="lnk" href="endgame.html">목록</a></div>`,"good");$("#eNext").onclick=newGame;return}
  const s=Math.max(1,3-usedHelp),P=prog(),x=LS;if(!P[x.id]||P[x.id].s<s)P[x.id]={s,t:Date.now()};else P[x.id].t=Date.now();saveProg(P);
  render();
  msg(`${x.goal==="mate"?"메이트!":x.goal==="promote"?"승진! 이겼어요.":x.eng?(g.in_checkmate()||EV>=5?`이겼어요! 평가 ${fmtEv(EV)}`:g.in_draw()?"무승부로 지켜 냈어요.":`${x.hold}수 버텼어요. 평가 ${fmtEv(EV)}`):"지켜 냈어요. 무승부예요."} <span class="estars">${stars(s)}</span><div class="eacts" style="margin-top:10px"><button class="pri" id="eNext">다른 자리</button><a class="lnk" href="endgame.html">목록</a></div>`,"good");
  $("#eNext").onclick=newGame}
function undo(){if(!hist.length||phase==="busy")return;pq=[];const h=hist.pop();if(evh.length)EV=evh.pop();g=new Chess(h);lastM=null;sel=null;hint=null;myMoves=Math.max(0,myMoves-1);usedHelp++;phase="play";msg("다시 둬 보세요.");render()}
async function giveHint(){if(!myTurn())return;
  if(LS.eng){phase="busy";let r;try{r=await E.go(g.fen(),"movetime 900")}catch(e){phase="play";return}phase="play";if(!r.best||r.best==="(none)")return;usedHelp++;hint={from:r.best.slice(0,2),to:r.best.slice(2,4)};msg("화살표 수가 가장 좋아요.");render();return}
  phase="busy";let j;try{j=await tb(g.fen())}catch(e){phase="play";msg("테이블베이스에 연결하지 못했어요.","bad");return}phase="play";
  const b=j.moves&&j.moves[0];if(!b)return;usedHelp++;hint={from:b.uci.slice(0,2),to:b.uci.slice(2,4)};msg("화살표 수가 가장 좋아요.");render()}
function tryMove(from,to,pr){if(!myTurn())return false;const ms=g.moves({square:from,verbose:true}).filter(m=>m.to===to);if(!ms.length)return false;
  if(ms.some(m=>m.promotion)&&!pr){const box=$("#epromo");$("#epromoRow").innerHTML=["q","r","b","n"].map(t=>`<button data-t="${t}"><i class="pc w${t}"></i></button>`).join("");box.classList.add("on");
    $("#epromoRow").onclick=e=>{const b=e.target.closest("button");if(!b)return;box.classList.remove("on");doMove(from,to,b.dataset.t,true)};return true}
  doMove(from,to,pr,!DROP);return true}
let DROP=false;
function doMove(from,to,pr,an){hist.push(g.fen());evh.push(EV);const m=g.move({from,to,promotion:pr||"q"});if(!m){hist.pop();render();return}lastM=m;if(an)anim=m;play(snd(m,false));after(m)}
/* 조작 */
function endFloat(){if(floatEl){floatEl.remove();floatEl=null}if(hov){const o=sqEl(hov);if(o)o.classList.remove("hov");hov=null}document.body.classList.remove("grabbing")}
bEl.addEventListener("contextmenu",e=>{e.preventDefault();if(pq.length||sel){pq=[];sel=null;render()}});
bEl.addEventListener("pointerdown",e=>{const s=sqAt(e.clientX,e.clientY);if(!s||e.button!==0)return;e.preventDefault();try{bEl.setPointerCapture(e.pointerId)}catch(_){}
  if(!g)return;if(!myTurn()&&!canPre()){return}const pre=!myTurn(),p=pre?at(s):g.get(s);
  if(pre&&sel&&sel!==s&&!(p&&p.color==="w")&&pmTargets(sel).includes(s)){addPre(sel,s);return}
  if(pre&&pq.length&&!(p&&p.color==="w")){pq=[];sel=null;render();return}
  if(!pre&&sel&&sel!==s&&!(p&&p.color==="w")&&g.moves({square:sel,verbose:true}).some(m=>m.to===s)){tryMove(sel,s);return}
  if(p&&p.color==="w"){const was=sel===s;sel=s;render();const w=bEl.getBoundingClientRect().width/8;floatEl=document.createElement("i");floatEl.className=`pc w${p.type} float`;floatEl.style.width=floatEl.style.height=w+"px";document.body.appendChild(floatEl);
    drag={from:s,was,x0:e.clientX,y0:e.clientY,moved:false,w};floatEl.style.transform=`translate(${e.clientX-w/2}px,${e.clientY-w/2}px)`;document.body.classList.add("grabbing");const pe=sqEl(s).querySelector(".pc");if(pe)pe.classList.add("ghost")}
  else{sel=null;render()}});
addEventListener("pointermove",e=>{if(!drag)return;floatEl.style.transform=`translate(${e.clientX-drag.w/2}px,${e.clientY-drag.w/2}px)`;if(Math.hypot(e.clientX-drag.x0,e.clientY-drag.y0)>3)drag.moved=true;
  const t=sqAt(e.clientX,e.clientY);if(t!==hov){if(hov){const o=sqEl(hov);if(o)o.classList.remove("hov")}hov=t;if(t&&t!==drag.from){const n=sqEl(t);if(n)n.classList.add("hov")}}});
addEventListener("pointerup",e=>{if(!drag)return;const d=drag;drag=null;endFloat();const to=sqAt(e.clientX,e.clientY);
  if(to&&to!==d.from&&canPre()){if(pmTargets(d.from).includes(to))addPre(d.from,to);else render();return}
  if(to&&to!==d.from){DROP=true;const ok=tryMove(d.from,to);DROP=false;if(!ok){const gg=g;try{if(gg.moves({square:d.from,verbose:true,legal:false}).some(m=>m.to===to))play("illegal")}catch(_){}render()}return}
  if(to===d.from&&d.was&&!d.moved)sel=null;render()});
$("#bUndo").onclick=undo;$("#bHint").onclick=giveHint;$("#bNew").onclick=newGame;$("#bFlip").onclick=()=>{orient=orient==="w"?"b":"w";render()};
/* 시작 */
function tlChips(){const el=$("#eTL");if(!el)return;if(LS.goal!=="mate"){el.hidden=true;return}
  el.innerHTML=`<span>시간 제한</span>`+[0].concat(TLS).map(t=>`<button class="chip" data-tl="${t}" aria-pressed="${TL===t}">${t?(t<60?t+"초":t/60+"분"):"없음"}</button>`).join("");
  el.onclick=e=>{const b=e.target.closest("[data-tl]");if(!b)return;TL=+b.dataset.tl;try{const u=new URL(location.href);if(TL)u.searchParams.set("t",TL);else u.searchParams.delete("t");history.replaceState(null,"",u)}catch(_){}tlChips();newGame()}}
$("#eReadyBtn")&&($("#eReadyBtn").onclick=goTimed);
if(LS){tlChips();$("#eH1").textContent=LS.ko;document.title=LS.ko+" - 한 수";$("#eName").textContent=LS.ko;$("#eGoal").innerHTML=`<i class="w"></i>백으로 ${GOAL[LS.goal]}${LS.goal==="draw"||LS.goal==="hold"?` (${LS.hold}수 버티기)`:""}`;newGame()}
else list();
}
