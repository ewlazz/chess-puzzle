/* 엔드게임 연습: 주제마다 무작위 시작 자리를 리체스 테이블베이스로 골라 두고, 상대는 테이블베이스 최선 수(가장 오래 버티는 수)로 둠.
   내 수가 이기던 자리를 비기게(또는 비기던 자리를 지게) 만들면 바로 알려 주고 무르기를 권함. 별: 힌트·무르기 없이 3개, 쓰면 줄어듦 */
{
const F="abcdefgh",TB="https://tablebase.lichess.ovh/standard?fen=";
const L=[
 {id:"kq",grp:"mate",ko:"퀸 메이트",goal:"mate",w:"KQ",b:"K",minDtm:12,sample:"8/8/8/4k3/8/8/8/3QK3 w - - 0 1"},
 {id:"kr",grp:"mate",ko:"룩 메이트",goal:"mate",w:"KR",b:"K",minDtm:22,sample:"8/8/8/4k3/8/8/8/R3K3 w - - 0 1"},
 {id:"krr",grp:"mate",ko:"룩 두 개 메이트",goal:"mate",w:"KRR",b:"K",minDtm:8,sample:"8/8/8/4k3/8/8/8/R3K2R w - - 0 1"},
 {id:"kbb",grp:"mate",ko:"비숍 두 개 메이트",goal:"mate",w:"KBB",b:"K",minDtm:26,sample:"8/8/8/4k3/8/8/8/2B1KB2 w - - 0 1"},
 {id:"kbn",grp:"mate",ko:"비숍+나이트 메이트",goal:"mate",w:"KBN",b:"K",minDtm:50,sample:"8/8/8/4k3/8/8/8/1NB1K3 w - - 0 1"},
 {id:"kpk",grp:"pawn",ko:"킹+폰 이기기",goal:"promote",w:"KP",b:"K",want:"win",needAlt:1,sample:"8/8/8/8/4k3/8/4P3/4K3 w - - 0 1"},
 {id:"opp",grp:"pawn",ko:"오포지션",goal:"promote",w:"KP",b:"K",want:"win",exactWin:1,sample:"8/8/4k3/8/4K3/4P3/8/8 w - - 0 1"},
 {id:"kpkd",grp:"pawn",ko:"킹+폰 막기",goal:"draw",w:"K",b:"KP",want:"draw",needLose:1,hold:12,sample:"8/8/8/4k3/4p3/8/8/4K3 w - - 0 1"},
 {id:"square",grp:"pawn",ko:"스퀘어 규칙",goal:"draw",w:"K",b:"KP",want:"draw",needLose:1,hold:8,square:1,sample:"7k/8/8/p7/8/8/8/5K2 w - - 0 1"},
 {id:"kppkp",grp:"pawn",ko:"폰 두 개 vs 하나",goal:"promote",w:"KPP",b:"KP",want:"win",maxWin:3,sample:"8/8/4k3/p7/8/1P6/P3K3/8 w - - 0 1"},
 {id:"lucena",grp:"rook",ko:"루세나",goal:"promote",tpl:"lucena",want:"win",needAlt:1,sample:"1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1"},
 {id:"philidor",grp:"rook",ko:"필리도르",goal:"draw",tpl:"philidor",want:"draw",needLose:1,hold:15,sample:"8/8/7r/4k3/4p3/R7/8/4K3 w - - 0 1"}
];
const GRP=[["mate","기본 메이트"],["pawn","폰 엔드게임"],["rook","룩 엔드게임"]];
const GOAL={mate:"메이트하기",promote:"승진해서 이기기",draw:"무승부 지키기"};
const prog=()=>{try{return JSON.parse(localStorage.getItem("hansu-eg")||"{}")}catch(e){return {}}};
const saveProg=o=>{try{localStorage.setItem("hansu-eg",JSON.stringify(o))}catch(e){}};
const stars=n=>"★".repeat(n)+`<s>${"★".repeat(3-n)}</s>`;
const qs=new URL(location.href).searchParams,LID=qs.get("l"),LS=L.find(x=>x.id===LID);
document.body.classList.add(LS?"m-play":"m-list");

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
  if(x.tpl==="lucena"){const pf=1+rnd(6),s=pf<=3?1:-1,P={};P[sq(pf,6)]="P";P[sq(pf,7)]="K";P[sq(pf+s,rnd(4))]="R";
    P[sq(pf+2*s,5+rnd(3))]="k";P[sq(pf-s,rnd(3))]="r";return Object.keys(P).length===5?P:null}
  if(x.tpl==="philidor"){const pf=1+rnd(6),P={};P[sq(pf,0)]="K";P[sq(rnd(8),2)]="R";P[sq(pf,3)]="p";P[sq(pf+(Math.random()<.5?-1:1),4+rnd(2))]="k";P[sq(rnd(8),5+rnd(3))]="r";return Object.keys(P).length===5?P:null}
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
  if(x.want==="win"){if(j.category!=="win")return false;if(x.needAlt&&win===j.moves.length)return false;if(x.exactWin&&win!==1)return false;if(x.maxWin&&win>x.maxWin)return false;return true}
  if(x.want==="draw")return j.category==="draw"&&(!x.needLose||lose>0);return false}
async function makePos(x,tok){let calls=0;for(let t=0;t<400;t++){if(tok!==TOK)return null;const P=randPos(x);if(!P||kAdj(P))continue;const fen=fenOf(P);if(!legal(fen))continue;
  if(++calls>40)break;const j=await tb(fen);if(fits(x,j))return fen}return null}

/* 판 */
let g=null,orient="w",start="",TOK=0,phase="idle",usedHelp=0,myMoves=0,sel=null,drag=null,floatEl=null,hov=null,hint=null,lastM=null,anim=null,hist=[];
const bEl=$("#eb8"),sqEl=s=>bEl.querySelector(`[data-sq="${s}"]`);
let soundOn=true;try{soundOn=localStorage.getItem("hansu-sound")!=="off"}catch(e){}
const audio={};const play=k=>{if(!soundOn)return;try{const a=audio[k]||(audio[k]=new Audio("sounds/"+k+".mp3"));a.currentTime=0;a.play().catch(()=>{})}catch(e){}};
const snd=(m,opp)=>g.in_checkmate()?"game-end":g.in_check()?"move-check":m.flags.includes("p")?"promote":m.captured?"capture":opp?"move-opponent":"move-self";
const order=()=>{const a=[];for(let r=0;r<8;r++)for(let c=0;c<8;c++)a.push(F[orient==="w"?c:7-c]+(orient==="w"?8-r:r+1));return a};
function sqAt(x,y){const b=bEl.getBoundingClientRect(),c=Math.floor((x-b.left)/b.width*8),r=Math.floor((y-b.top)/b.height*8);if(c<0||c>7||r<0||r>7)return null;return F[orient==="w"?c:7-c]+(orient==="w"?8-r:r+1)}
const myTurn=()=>phase==="play"&&g&&g.turn()==="w";
function render(){if(!g)return;const legalT=sel&&myTurn()?g.moves({square:sel,verbose:true}).map(m=>m.to):[];let chk=null;
  if(g.in_check())for(const s of order()){const p=g.get(s);if(p&&p.type==="k"&&p.color===g.turn())chk=s}
  bEl.innerHTML=order().map((s,n)=>{const p=g.get(s),r=Math.floor(n/8),c=n%8,dark=(fi(s)+ +s[1])%2===1;
    const cls=["s8",dark?"d":"l",lastM&&(lastM.from===s||lastM.to===s)?"lm":"",sel===s?"sel":"",chk===s?"chk":"",p&&p.color==="w"&&myTurn()?"own":""].join(" ");
    const co=(c===0?`<span class="co r">${s[1]}</span>`:"")+(r===7?`<span class="co f">${s[0]}</span>`:"");
    const dot=legalT.includes(s)?(p?'<b class="cp8"></b>':'<b class="dt8"></b>'):"";
    return `<div class="${cls}" data-sq="${s}">${co}${p?`<i class="pc ${p.color}${p.type}${drag&&drag.from===s?" ghost":""}"></i>`:""}${dot}</div>`}).join("");
  $("#emarks").innerHTML=hint?arrowSvg(hint.from,hint.to):"";
  if(anim){const a=anim;anim=null;if(window.slideMove)slideMove(bEl,a)}
  const h=g.history();$("#eMv").innerHTML=h.map((s,i)=>i%2===0?`<b>${i/2+1}.</b> ${esc(s)}`:esc(s)).join(" ");
  stat()}
function arrowSvg(from,to){const d=s=>{const f=fi(s),r=+s[1];return orient==="w"?[f,8-r]:[7-f,r-1]};const [c1,r1]=d(from),[c2,r2]=d(to),x1=c1+.5,y1=r1+.5,x2=c2+.5,y2=r2+.5,l=Math.hypot(x2-x1,y2-y1),ux=(x2-x1)/l,uy=(y2-y1)/l,bx=x2-ux*.46,by=y2-uy*.46,W=.3;
  return `<g opacity=".85"><line x1="${x1}" y1="${y1}" x2="${bx}" y2="${by}" stroke="#5C54D6" stroke-width=".2"/><polygon points="${x2},${y2} ${bx-uy*W},${by+ux*W} ${bx+uy*W},${by-ux*W}" fill="#5C54D6"/></g>`}
function stat(){const x=LS;$("#eStat").innerHTML=x.goal==="draw"?`버틴 수 ${myMoves} / ${x.hold}`:`내 수 ${myMoves}`;
  $("#bUndo").disabled=!hist.length||phase==="busy";$("#bHint").disabled=!(phase==="play"&&myTurn())}
const msg=(t,c)=>{$("#eMsg").className="emsg"+(c?" "+c:"");$("#eMsg").innerHTML=t};
async function newGame(){const x=LS,tok=++TOK;phase="busy";g=null;hist=[];usedHelp=0;myMoves=0;sel=null;hint=null;lastM=null;
  $("#bUndo").disabled=$("#bHint").disabled=true;msg("자리 만드는 중…");bEl.innerHTML="";
  let fen=null;try{fen=await makePos(x,tok)}catch(e){if(tok===TOK){msg('테이블베이스에 연결하지 못했어요. <button class="lnk" id="eRetry">다시</button>',"bad");$("#eRetry").onclick=newGame}return}
  if(tok!==TOK)return;if(!fen){msg('알맞은 자리를 못 찾았어요. <button class="lnk" id="eRetry">다시</button>',"bad");$("#eRetry").onclick=newGame;return}
  start=fen;g=new Chess(fen);phase="play";play("game-start");msg("백 차례예요.");render()}
async function after(m){/* 내 수 뒤 판정 */
  myMoves++;sel=null;hint=null;const x=LS;
  if(g.in_checkmate()){finish(true);return}
  if(g.in_stalemate()||g.insufficient_material()||g.in_threefold_repetition()){if(x.goal==="draw")finish(true);else slip(g.in_stalemate()?"스테일메이트예요. 무승부가 됐어요.":"무승부가 됐어요.");return}
  phase="busy";render();let j;try{j=await tb(g.fen())}catch(e){phase="play";msg("테이블베이스에 연결하지 못했어요. 이 수는 판정을 못 했어요.","bad");return}
  if(x.goal==="draw"){if(j.category==="win"){slip("이 수로 지는 자리가 됐어요.");return}if(myMoves>=x.hold){finish(true);return}}
  else{if(j.category!=="loss"){slip(j.category==="draw"||j.category==="blessed-loss"?"이 수로 무승부가 됐어요.":"이 수로 지는 자리가 됐어요.");return}
    if(x.goal==="promote"&&m.flags.includes("p")){finish(true);return}}
  /* 상대 수: 테이블베이스 최선 (가장 오래 버팀) */
  await new Promise(r=>setTimeout(r,380));const tok=TOK;const best=j.moves&&j.moves[0];if(!best||tok!==TOK||!g)return;
  const u=best.uci,r=g.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||"q"});if(!r){phase="play";render();return}
  lastM=r;anim=r;play(snd(r,true));phase="play";
  if(g.in_checkmate()){render();slip("메이트당했어요.");return}
  if(g.in_stalemate()||g.insufficient_material()){if(x.goal==="draw")finish(true);else{render();slip("무승부가 됐어요.")}return}
  msg(x.goal==="draw"?"잘 막고 있어요.":"이기는 자리예요. 계속.");render()}
function slip(t){phase="slip";render();msg(`${t} <button class="lnk" id="eUndo2">무르기</button>`,"bad");$("#eUndo2").onclick=undo;play("game-end")}
function finish(ok){phase="done";const s=Math.max(1,3-usedHelp),P=prog(),x=LS;if(!P[x.id]||P[x.id].s<s)P[x.id]={s,t:Date.now()};else P[x.id].t=Date.now();saveProg(P);
  render();play("game-end");
  msg(`${x.goal==="mate"?"메이트!":x.goal==="promote"?"승진! 이겼어요.":"지켜 냈어요. 무승부예요."} <span class="estars">${stars(s)}</span><div class="eacts" style="margin-top:10px"><button class="pri" id="eNext">다른 자리</button><a class="lnk" href="endgame.html">목록</a></div>`,"good");
  $("#eNext").onclick=newGame}
function undo(){if(!hist.length||phase==="busy")return;const h=hist.pop();g=new Chess(h);lastM=null;sel=null;hint=null;myMoves=Math.max(0,myMoves-1);usedHelp++;phase="play";msg("다시 둬 보세요.");render()}
async function giveHint(){if(!myTurn())return;phase="busy";let j;try{j=await tb(g.fen())}catch(e){phase="play";msg("테이블베이스에 연결하지 못했어요.","bad");return}phase="play";
  const b=j.moves&&j.moves[0];if(!b)return;usedHelp++;hint={from:b.uci.slice(0,2),to:b.uci.slice(2,4)};msg("화살표 수가 가장 좋아요.");render()}
function tryMove(from,to,pr){if(!myTurn())return false;const ms=g.moves({square:from,verbose:true}).filter(m=>m.to===to);if(!ms.length)return false;
  if(ms.some(m=>m.promotion)&&!pr){const box=$("#epromo");$("#epromoRow").innerHTML=["q","r","b","n"].map(t=>`<button data-t="${t}"><i class="pc w${t}"></i></button>`).join("");box.classList.add("on");
    $("#epromoRow").onclick=e=>{const b=e.target.closest("button");if(!b)return;box.classList.remove("on");doMove(from,to,b.dataset.t,true)};return true}
  doMove(from,to,pr,!DROP);return true}
let DROP=false;
function doMove(from,to,pr,an){hist.push(g.fen());const m=g.move({from,to,promotion:pr||"q"});if(!m){hist.pop();render();return}lastM=m;if(an)anim=m;play(snd(m,false));after(m)}
/* 조작 */
function endFloat(){if(floatEl){floatEl.remove();floatEl=null}if(hov){const o=sqEl(hov);if(o)o.classList.remove("hov");hov=null}document.body.classList.remove("grabbing")}
bEl.addEventListener("contextmenu",e=>e.preventDefault());
bEl.addEventListener("pointerdown",e=>{const s=sqAt(e.clientX,e.clientY);if(!s||e.button!==0)return;e.preventDefault();try{bEl.setPointerCapture(e.pointerId)}catch(_){}
  if(!myTurn()){return}const p=g.get(s);
  if(sel&&sel!==s&&!(p&&p.color==="w")&&g.moves({square:sel,verbose:true}).some(m=>m.to===s)){tryMove(sel,s);return}
  if(p&&p.color==="w"){const was=sel===s;sel=s;render();const w=bEl.getBoundingClientRect().width/8;floatEl=document.createElement("i");floatEl.className=`pc w${p.type} float`;floatEl.style.width=floatEl.style.height=w+"px";document.body.appendChild(floatEl);
    drag={from:s,was,x0:e.clientX,y0:e.clientY,moved:false,w};floatEl.style.transform=`translate(${e.clientX-w/2}px,${e.clientY-w/2}px)`;document.body.classList.add("grabbing");const pe=sqEl(s).querySelector(".pc");if(pe)pe.classList.add("ghost")}
  else{sel=null;render()}});
addEventListener("pointermove",e=>{if(!drag)return;floatEl.style.transform=`translate(${e.clientX-drag.w/2}px,${e.clientY-drag.w/2}px)`;if(Math.hypot(e.clientX-drag.x0,e.clientY-drag.y0)>3)drag.moved=true;
  const t=sqAt(e.clientX,e.clientY);if(t!==hov){if(hov){const o=sqEl(hov);if(o)o.classList.remove("hov")}hov=t;if(t&&t!==drag.from){const n=sqEl(t);if(n)n.classList.add("hov")}}});
addEventListener("pointerup",e=>{if(!drag)return;const d=drag;drag=null;endFloat();const to=sqAt(e.clientX,e.clientY);
  if(to&&to!==d.from){DROP=true;const ok=tryMove(d.from,to);DROP=false;if(!ok){const gg=g;try{if(gg.moves({square:d.from,verbose:true,legal:false}).some(m=>m.to===to))play("illegal")}catch(_){}render()}return}
  if(to===d.from&&d.was&&!d.moved)sel=null;render()});
$("#bUndo").onclick=undo;$("#bHint").onclick=giveHint;$("#bNew").onclick=newGame;$("#bFlip").onclick=()=>{orient=orient==="w"?"b":"w";render()};
/* 시작 */
if(LS){$("#eH1").textContent=LS.ko;document.title=LS.ko+" - 한 수";$("#eName").textContent=LS.ko;$("#eGoal").innerHTML=`<i class="w"></i>백으로 ${GOAL[LS.goal]}${LS.goal==="draw"?` (${LS.hold}수 버티기)`:""}`;newGame()}
else list();
}
