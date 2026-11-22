/* 한 판 분석: 수순 재생, 엔진 라인, 변화수 두기, 수 분류·정확도 */
{
if(!document.getElementById("ana"))document.body.insertAdjacentHTML("beforeend",'<div class="ana" id="ana" role="dialog" aria-label="게임 분석"> <div class="ahead"><b id="aTitle"></b><a id="aLink" href="#" target="_blank" rel="noopener">체스닷컴에서 보기</a><button class="x" id="aClose" aria-label="닫기">닫기</button></div> <div class="alay"> <div> <div class="who" id="wTop"></div> <div class="bwrap2"> <div class="evb" id="evb"><i id="evbW"></i><span id="evbT"></span></div> <div class="aboard"><div class="ab8" id="ab8" role="grid" aria-label="분석 보드"></div><svg class="amarks" id="amarks" viewBox="0 0 8 8" aria-hidden="true"></svg><div class="apromo" id="apromo"><div id="apromoRow"></div></div></div> </div> <div class="who" id="wBot"></div> <div class="ctl"><button id="cFirst" aria-label="처음">처음</button><button id="cPrev" aria-label="이전">이전</button><button id="cNext" aria-label="다음">다음</button><button id="cLast" aria-label="마지막">끝</button><button id="cFlip" aria-label="보드 뒤집기">뒤집기</button></div> <div class="gfig" id="gfig"><svg id="gsvg"></svg></div> </div> <div class="side"> <div><div class="prog"><i id="prog"></i></div><p class="ast" id="ast"></p></div> <div class="acc2" id="acc2"></div> <div class="lines"><div class="lh"><button class="engt" id="engT" aria-pressed="true">엔진</button><span id="ldep"></span></div><div id="lbody"></div></div> <div class="cur" id="cur"></div> <div class="mlist" id="mlist"></div> <table class="cls" id="cls"></table> </div> </div> </div>');
const F="abcdefgh",ENG="engine/stockfish-19-lite-single.js";
const CL={
  brilliant:{l:"브릴리언트",i:"brilliant",c:"#1bada6"},great:{l:"그레이트",i:"great_find",c:"#1bada6"},
  best:{l:"최선",i:"best",c:"#96bc4b"},excellent:{l:"훌륭함",i:"excellent",c:"#96bc4b"},good:{l:"좋음",i:"good",c:"#96af8b"},
  book:{l:"오프닝",i:"book",c:"#a88865"},forced:{l:"외길",i:"forced",c:"#96af8b"},
  inaccuracy:{l:"부정확",i:"inaccuracy",c:"#f7c045"},mistake:{l:"실수",i:"mistake",c:"#e58f2a"},
  miss:{l:"놓침",i:"incorrect",c:"#ca3431"},blunder:{l:"블런더",i:"blunder",c:"#ca3431"}
};
const ORDER=["brilliant","great","best","excellent","good","book","forced","inaccuracy","mistake","miss","blunder"];
const ico=(n,cls)=>`<img class="${cls}" src="icons/${n}.png" alt="" draggable="false">`;
const clIco=(c,cls)=>`<img class="${cls}" src="icons/${CL[c].i}.png" alt="${CL[c].l}" title="${CL[c].l}" draggable="false">`;
/* 오프닝 이론 길이: 체스닷컴 ECOUrl 끝의 수(예: ...-6.Be3, ...-3...Nf6-4.Bg5)까지 */
function bookPly(game,moves){
  const u=game.eco||(/\[ECOUrl "([^"]+)"/.exec(game.pgn||"")||[])[1];if(!u)return 0;
  const slug=decodeURIComponent(u.split("/openings/")[1]||"");
  const all=[...slug.matchAll(/(\d+)(\.\.\.|\.)([^-]+)/g)];if(!all.length)return 0;
  const m=all[all.length-1],extra=slug.slice(m.index+m[0].length).split("-").filter(Boolean);
  const ply=(+m[1]-1)*2+(m[2]==="..."?2:1)+extra.length,clean=x=>x.replace(/[+#!?]/g,"");
  const lastSan=extra.length?extra[extra.length-1]:m[3];
  return ply<=moves.length&&clean(moves[ply-1].san)===clean(lastSan)?ply:0;
}
/* 게임 끝 아이콘: 메이트·기권·시간패(탈주는 기권)는 진 쪽 킹, 무승부·중단은 양쪽 킹 */
function endIcons(){
  const gm=A.game,t=gm.term;if(!t)return {};
  const g=new Chess(A.fens[A.fens.length-1]),ks=c=>{for(const f of F)for(let r=1;r<=8;r++){const p=g.get(f+r);if(p&&p.type==="k"&&p.color===c)return f+r}return null};
  const col={w:"white",b:"black"},o={};
  if(gm.res==="draw"||gm.res==="abort"){["w","b"].forEach(c=>{const s=ks(c);if(s)o[s]=(gm.res==="abort"?"take_back":"draw_"+col[c])});return o}
  const lose=gm.res==="win"?(gm.me==="w"?"b":"w"):gm.me,s=ks(lose);
  if(s)o[s]=(t==="checkmated"?"checkmate_":t==="timeout"?"clock_":"resign_")+col[lose];
  return o;
}
const VAL={p:1,n:3,b:3,r:5,q:9,k:0};
const turnOf=f=>f.split(" ")[1];
const uciObj=u=>({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||"q"});
/* 엔진 워커 (중단된 탐색의 출력은 버림) */
function Eng(multi){this.multi=multi;this.w=null;this.ready=null;this.searching=false;this.pending=0;this.onInfo=null;this.onBest=null}
Eng.prototype.init=function(){
  if(this.ready)return this.ready;
  this.ready=new Promise((res,rej)=>{
    try{this.w=new Worker(ENG)}catch(e){rej(e);return}
    this.w.onerror=e=>rej(e);let ok=false;
    this.w.onmessage=e=>{
      const l=typeof e.data==="string"?e.data:"";
      if(l==="uciok"){this.send("setoption name Hash value 32");this.send("setoption name MultiPV value "+this.multi);this.send("isready")}
      else if(l==="readyok"){if(!ok){ok=true;res()}}
      else if(l.startsWith("bestmove")){if(this.pending>0){this.pending--;return}this.searching=false;if(this.onBest)this.onBest(l.split(" ")[1])}
      else if(l.startsWith("info")&&this.pending===0&&l.includes(" pv ")&&!/bound/.test(l)){
        const m=/score (cp|mate) (-?\d+)/.exec(l);if(!m)return;
        const k=+((/ multipv (\d+)/.exec(l)||[0,1])[1]),d=+((/ depth (\d+)/.exec(l)||[0,0])[1]);
        if(this.onInfo)this.onInfo({k,d,score:{t:m[1],v:+m[2]},pv:/ pv (.+)$/.exec(l)[1].trim().split(" ")});
      }
    };
    this.send("uci");
  });
  return this.ready;
};
Eng.prototype.send=function(c){this.w.postMessage(c)};
Eng.prototype.go=function(fen,cmd){if(this.searching){this.pending++;this.send("stop")}this.send("position fen "+fen);this.send(cmd);this.searching=true};
Eng.prototype.stop=function(){if(this.searching){this.pending++;this.send("stop");this.searching=false}};
const Main=new Eng(2),Live=new Eng(3);
function evalPos(fen){return new Promise(res=>{
  const lines=[];Main.onInfo=x=>{lines[x.k-1]=x};
  Main.onBest=b=>res({best:b&&b!=="(none)"?b:null,score:lines[0]?lines[0].score:{t:"cp",v:0},pv:lines[0]?lines[0].pv:[],score2:lines[1]?lines[1].score:null});
  Main.go(fen,"go depth 14 movetime 500");
})}
/* 점수 */
function whiteCp(sc,turn){let v;if(sc.t==="mate"){const s=sc.v>0?1:-1;v=s*(10000-Math.abs(sc.v)*10)}else v=sc.v;return turn==="w"?v:-v}
const winPct=cp=>50+50*(2/(1+Math.exp(-0.00368208*cp))-1);
function evalText(sc,turn){
  if(!sc)return "";
  if(sc.t==="mate"){if(sc.v===0)return turn==="w"?"0-1":"1-0";const wm=(turn==="w")===(sc.v>0);return (wm?"":"-")+"M"+Math.abs(sc.v)}
  const c=whiteCp(sc,turn)/100;return (c>0?"+":"")+c.toFixed(2);
}
/* 상태 */
let A=null,V=null,N={v:false,i:0},run=0,sel=null,drag=null,floatEl=null,hov=null,rd=null,engOn=true,liveT=0,raf=0;
const L={fen:null,lines:[],depth:0};
const marks=new Map(),circ=new Map();
try{engOn=localStorage.getItem("hansu-engine")!=="off"}catch(e){}
const curFen=()=>N.v?V.fens[N.i]:A.fens[N.i];
const curMove=()=>N.v?(N.i>0?V.moves[N.i-1]:null):(N.i>0?A.moves[N.i-1]:null);
function parse(game){
  const c=new Chess();
  if(game.setup&&!/^rnbqkbnr\/pppppppp\/8\/8\/8\/8\/PPPPPPPP\/RNBQKBNR w KQkq - 0 1$/.test(game.setup))c.load(game.setup);
  const start=c.fen(),std=start===new Chess().fen();let body=(game.pgn||"").replace(/^\[[^\]]*\]\s*$/gm,"");while(/\([^()]*\)/.test(body))body=body.replace(/\([^()]*\)/g," ");
  const clk=[...body.matchAll(/\[%clk ([\d:.]+)\]/g)].map(m=>m[1].split(":").reduce((a,x)=>a*60+ +x,0));
  const toks=body.replace(/\{[^}]*\}/g," ").replace(/;[^\n]*/g," ").replace(/\$\d+/g," ").replace(/\d+\.(\.\.)?/g," ").replace(/1-0|0-1|1\/2-1\/2|\*/g," ").trim().split(/\s+/).filter(Boolean);
  const fens=[start],moves=[];
  for(const t of toks){const m=c.move(t,{sloppy:true});if(!m)break;moves.push(m);fens.push(c.fen())}
  return {fens,moves,clk,std,base:+(String(game.tc||"").split("+")[0])||0};
}
function disp(sq){const f=F.indexOf(sq[0]),r=+sq[1];return A.orient==="w"?[f,8-r]:[7-f,r-1]}
function order(){const a=[];for(let r=0;r<8;r++)for(let c=0;c<8;c++)a.push(F[A.orient==="w"?c:7-c]+(A.orient==="w"?8-r:r+1));return a}
function arrow(from,to,color){
  const [c1,r1]=disp(from),[c2,r2]=disp(to),dc=Math.abs(c2-c1),dr=Math.abs(r2-r1),pts=[[c1+.5,r1+.5]];
  if(dc===1&&dr===2)pts.push([c1+.5,r2+.5]);else if(dc===2&&dr===1)pts.push([c2+.5,r1+.5]);
  pts.push([c2+.5,r2+.5]);
  const [px,py]=pts[pts.length-2],[tx,ty]=pts[pts.length-1],len=Math.hypot(tx-px,ty-py),ux=(tx-px)/len,uy=(ty-py)/len;
  const H=.44,W=.29,bx=tx-ux*H,by=ty-uy*H,j=p=>p.map(v=>+v.toFixed(3)).join(",");
  return `<g opacity=".8"><polyline points="${pts.slice(0,-1).concat([[bx+ux*.02,by+uy*.02]]).map(j).join(" ")}" fill="none" stroke="${color}" stroke-width=".2"/><polygon points="${[[tx,ty],[bx-uy*W,by+ux*W],[bx+uy*W,by-ux*W]].map(j).join(" ")}" fill="${color}"/></g>`;
}
const fmtClk=s=>{if(s==null)return "";const m=Math.floor(s/60),x=s-m*60;return s<20?`${m}:${x.toFixed(1).padStart(4,"0")}`:`${m}:${String(Math.floor(x)).padStart(2,"0")}`};
function clockAt(color,ply){let v=A.base||null;for(let k=0;k<ply;k++){if(turnOf(A.fens[k])===color&&A.clk[k]!=null)v=A.clk[k]}return v}
function kingSq(g,c){for(const sq of order()){const p=g.get(sq);if(p&&p.type==="k"&&p.color===c)return sq}}
/* 현재 위치 평가: 저장된 값 또는 엔진 라인 */
function curScore(){
  const fen=curFen(),t=turnOf(fen);
  const live=engOn&&L.fen===fen&&L.lines[0]?L.lines[0]:null;
  if(!N.v&&A.sc[N.i]&&!(live&&live.d>14))return {sc:A.sc[N.i],t};
  if(live)return {sc:live.score,t};
  return null;
}
function drawEval(){
  const s=curScore(),flip=A.orient==="b";
  const wp=s?winPct(whiteCp(s.sc,s.t)):50;
  $("#evb").classList.toggle("flip",flip);$("#evbW").style.height=wp+"%";
  const atW=wp>=50;$("#evbT").textContent=s?evalText(s.sc,s.t).replace("+",""):"";
  $("#evbT").style.cssText=(atW!==flip?"bottom:4px;":"top:4px;")+(atW?"color:#222":"color:#eee");
}
function drawBoard(){
  const fen=curFen(),g=new Chess(fen),mv=curMove(),cl=!N.v&&N.i>0?A.cls[N.i-1]:null,turn=g.turn();
  const legal=sel?g.moves({square:sel,verbose:true}).map(m=>m.to):[],chk=g.in_check()?kingSq(g,turn):null;
  const ends=!N.v&&N.i===A.fens.length-1?endIcons():{};
  $("#ab8").innerHTML=order().map((sq,n)=>{
    const p=g.get(sq),r=Math.floor(n/8),c=n%8,dark=(F.indexOf(sq[0])+ +sq[1])%2===1;
    const cls=["s8",dark?"d":"l",mv&&(mv.from===sq||mv.to===sq)?"lm":"",sel===sq?"sel":"",chk===sq?"chk":"",p&&p.color===turn?"own":""].join(" ");
    const co=(c===0?`<span class="co r">${sq[1]}</span>`:"")+(r===7?`<span class="co f">${sq[0]}</span>`:"");
    const bc="badge"+(r===0?" t0":"")+(c===7?" r0":""),bd=ends[sq]?ico(ends[sq],bc):cl&&mv.to===sq?clIco(cl,bc):"";
    const mk=circ.has(sq)?`<span class="mk" style="background:${circ.get(sq)}"></span>`:"";
    const dot=legal.includes(sq)?(p?'<b class="cp8"></b>':'<b class="dt8"></b>'):"";
    return `<div class="${cls}" data-sq="${sq}">${mk}${co}${p?`<i class="pc ${p.color}${p.type}${drag&&drag.from===sq?" ghost":""}"></i>`:""}${bd}${dot}</div>`;
  }).join("");
  let ar="";
  if(cl&&["inaccuracy","mistake","miss","blunder","good","excellent"].includes(cl)&&A.best[N.i-1]){const b=A.best[N.i-1];ar+=arrow(b.slice(0,2),b.slice(2,4),"#5C54D6")}
  marks.forEach((col,k)=>{const [a,b]=k.split("-");ar+=arrow(a,b,col)});
  $("#amarks").innerHTML=ar;
  const top=A.orient==="w"?"b":"w",bot=A.orient,ply=N.v?V.base:N.i;
  const pl=c=>{const gm=A.game,p=gm.me===c?gm.my:gm.op;return `<span>${esc(p.name)} <em>${p.rating}</em></span><span class="clk">${N.v?"":fmtClk(clockAt(c,ply))}</span>`};
  $("#wTop").innerHTML=pl(top);$("#wBot").innerHTML=pl(bot);
}
function drawInfo(){
  const mv=curMove();let h="";
  if(!mv)h="<b>시작 위치</b>";
  else{
    const fenB=N.v?V.fens[N.i-1]:A.fens[N.i-1],n=+fenB.split(" ")[5],dots=turnOf(fenB)==="w"?".":"...";
    h=`<b>${n}${dots} ${mv.san}</b>`;
    const cl=!N.v?A.cls[N.i-1]:null;
    if(cl){h+=` ${clIco(cl,"dot")}${CL[cl].l}`;
      const b=A.best[N.i-1];if(b&&!["best","brilliant","great","book","forced"].includes(cl)){const t=new Chess(A.fens[N.i-1]),bm=t.move(uciObj(b));if(bm)h+=`<p>최선 ${bm.san}</p>`}}
    else if(!N.v&&A.busy)h+=` <span style="color:var(--muted)">분석 중</span>`;
  }
  const on=openName();if(on){const k=Openings.ko(on.name);h+=`<p class="opn" title="${esc(on.name)}">${esc(on.eco?on.eco+" · ":"")}${esc(k||on.name)}</p>`}
  $("#cur").innerHTML=h;
}
/* 내 실수를 퍼즐로: 내가 둔 실수·놓침·블런더 장면에서 엔진 최선수(메이트면 메이트 수순)를 정답으로 */
function mistakePuzzles(X){X=X||A;
  const out=[],me=X.game.me;
  X.cls.forEach((c,k)=>{
    const mover=turnOf(X.fens[k]),any=X.game.id==="paste"||X.game.id==="fen";
    if(!["mistake","blunder","miss"].includes(c)||(!any&&mover!==me)||!X.best[k])return;
    const pos=new Chess(X.fens[k]),sc=X.sc[k],pv=(X.pv[k]&&X.pv[k].length?X.pv[k]:[X.best[k]]);
    let n=1;if(sc&&sc.t==="mate"&&sc.v>0)n=Math.min(2*sc.v-1,9);
    const sol=[];for(const u of pv.slice(0,n)){const m=pos.move(uciObj(u));if(!m)break;sol.push(m.san)}
    if(!sol.length)return;
    const num=+X.fens[k].split(" ")[5],dots=mover==="w"?".":"...",prev=k>0?X.moves[k-1]:null;
    out.push({id:(X.game.id||"g")+"-"+k,fen:X.fens[k],last:prev?prev.from+prev.to:"",sol,title:`${num}${dots} ${X.moves[k].san} 대신`,goal:n>1?Math.ceil(n/2)+"수 메이트":CL[c].l+"한 장면",lv:"",kind:"mine",url:X.game.url||"",src:X.game.url?"게임":"",vs:X.game.op.name,orient:mover});
  });
  return out;
}
function mkPuzBtn(){
  const list=mistakePuzzles();if(!list.length)return;
  const ast=$("#ast");ast.innerHTML=`분석 완료 · <button class="mkp" id="mkp">실수 ${list.length}개 퍼즐로 저장</button>`;
  $("#mkp").onclick=()=>{
    let L=[];try{L=JSON.parse(localStorage.getItem("hansu-mypuz")||"[]")}catch(e){}
    const ids=new Set(L.map(x=>x.id));let added=0;list.forEach(p=>{if(!ids.has(p.id)){L.push(p);added++}});
    try{localStorage.setItem("hansu-mypuz",JSON.stringify(L))}catch(e){}
    ast.innerHTML=`분석 완료 · ${added?added+"개 저장함":"이미 저장됨"} · <a href="puzzle.html#mine">퍼즐에서 풀기</a>`;
  };
}
function openName(){
  if(!window.Openings||!Openings.ready())return null;
  if(!N.v)return A.ol&&A.ol.names[N.i]||null;
  for(let j=N.i;j>=1;j--){const a=Openings.at(V.fens[j]);if(a&&a.name)return a}
  return A.ol&&A.ol.names[V.base]||null;
}
function drawAll(){drawBoard();drawEval();drawInfo();moveList();graph()}
/* 수순 목록 (변화 포함) */
function vrow(){
  let n=+V.fens[0].split(" ")[5],side=turnOf(V.fens[0]),h="";
  V.moves.forEach((m,j)=>{const num=side==="w"?`<em>${n}.</em> `:(j===0?`<em>${n}...</em> `:"");h+=`${num}<button class="vm${N.v&&N.i===j+1?" on":""}" data-v="${j+1}">${m.san}</button> `;if(side==="b")n++;side=side==="w"?"b":"w"});
  return `<div class="vrow">${h}<button class="vx" aria-label="지우기">지우기</button></div>`;
}
function moveList(){
  const rows=Math.ceil(A.moves.length/2),vAt=V?Math.min(Math.floor(V.base/2),Math.max(rows-1,0)):-1;
  let h="";
  for(let r=0;r<rows;r++){
    const b=k=>{if(k>=A.moves.length)return "<span></span>";const c=A.cls[k];const ic=c&&!["best","excellent","good","book","forced"].includes(c)?clIco(c,"mi"):"";return `<button class="mv${!N.v&&N.i===k+1?" on":""}" data-p="${k+1}">${ic}${A.moves[k].san}</button>`};
    h+=`<div class="mrow"><span>${r+1}</span>${b(r*2)}${b(r*2+1)}</div>`;
    if(r===vAt)h+=vrow();
  }
  if(V&&!rows)h+=vrow();
  const el=$("#mlist"),st=el.scrollTop;el.innerHTML=h;el.scrollTop=st;
  const on=el.querySelector(".on");if(on){const r=on.offsetTop-el.offsetTop;if(r<el.scrollTop||r>el.scrollTop+el.clientHeight-40)el.scrollTop=r-el.clientHeight/2}
}
/* 엔진 라인 */
function renderLines(){
  const dep=$("#ldep"),body=$("#lbody");
  if(!engOn){body.innerHTML="";dep.textContent="";return}
  const fen=curFen(),g=new Chess(fen);
  if(g.game_over()){body.innerHTML=`<p class="lempty">${g.in_checkmate()?"체크메이트":"무승부"}</p>`;dep.textContent="";return}
  if(L.fen!==fen||!L.lines.length){body.innerHTML='<p class="lempty">계산 중…</p>';dep.textContent="";return}
  const t=turnOf(fen);
  body.innerHTML=L.lines.map((ln,li)=>{
    if(!ln)return "";
    const c=new Chess(fen),parts=[];let n=+fen.split(" ")[5],side=t;
    for(let j=0;j<Math.min(ln.pv.length,14);j++){const m=c.move(uciObj(ln.pv[j]));if(!m)break;
      const num=side==="w"?`<em>${n}.</em>`:(j===0?`<em>${n}...</em>`:"");parts.push(`${num}<button data-l="${li}" data-k="${j}">${m.san}</button>`);if(side==="b")n++;side=side==="w"?"b":"w"}
    return `<div class="ln"><span class="pill ${whiteCp(ln.score,t)>=0?"pw":"pb"}">${evalText(ln.score,t)}</span><span class="lmv">${parts.join(" ")}</span></div>`;
  }).join("");
  dep.textContent="깊이 "+L.depth;
}
Live.onInfo=x=>{L.lines[x.k-1]=x;if(x.k===1)L.depth=x.d;if(!raf)raf=requestAnimationFrame(()=>{raf=0;if(!A)return;renderLines();drawEval()})};
function live(){
  clearTimeout(liveT);
  if(!engOn||!A){if(Live.ready)Live.stop();renderLines();return}
  const fen=curFen();
  if(L.fen!==fen){L.fen=fen;L.lines=[];L.depth=0}
  renderLines();
  if(new Chess(fen).game_over()){if(Live.ready)Live.stop();return}
  liveT=setTimeout(()=>{Live.init().then(()=>{if(A&&curFen()===fen)Live.go(fen,"go depth 22")}).catch(()=>{$("#lbody").innerHTML='<p class="lempty">엔진을 불러오지 못했어요.</p>'})},120);
}
$("#lbody").onclick=e=>{const b=e.target.closest("button");if(!b)return;const ln=L.lines[+b.dataset.l];if(!ln)return;const pv=ln.pv.slice(0,+b.dataset.k+1);pv.forEach(u=>userMove(u.slice(0,2),u.slice(2,4),u[4],true));nav(N.v,N.i)};
$("#engT").onclick=()=>{engOn=!engOn;$("#engT").setAttribute("aria-pressed",engOn);try{localStorage.setItem("hansu-engine",engOn?"on":"off")}catch(e){}live();if(A)drawEval()};
/* 이동 */
function nav(v,i){
  if(v&&V){if(i<=0)N={v:false,i:V.base};else N={v:true,i:Math.min(i,V.moves.length)}}
  else N={v:false,i:Math.max(0,Math.min(A.fens.length-1,i))};
  sel=null;drawAll();live();
}
const same=(a,m)=>a&&a.from===m.from&&a.to===m.to&&(a.promotion||"")===(m.promotion||"");
function userMove(from,to,pr,quiet){
  sel=null;const fen0=curFen(),g=new Chess(fen0),m=g.move({from,to,promotion:pr||"q"});if(!m)return;
  if(!N.v){
    if(same(A.moves[N.i],m)){N={v:false,i:N.i+1}}
    else{V={base:N.i,fens:[fen0,g.fen()],moves:[m]};N={v:true,i:1}}
  }else{
    if(same(V.moves[N.i],m)){N={v:true,i:N.i+1}}
    else{V.fens=V.fens.slice(0,N.i+1);V.moves=V.moves.slice(0,N.i);V.fens.push(g.fen());V.moves.push(m);N={v:true,i:N.i+1}}
  }
  if(!quiet)nav(N.v,N.i);
}
function tryUser(from,to){
  const g=new Chess(curFen()),ms=g.moves({square:from,verbose:true}).filter(m=>m.to===to);
  if(!ms.length)return false;
  if(ms.some(m=>m.promotion)){
    const c=g.turn(),box=$("#apromo");
    $("#apromoRow").innerHTML=["q","r","b","n"].map(t=>`<button data-t="${t}" aria-label="${t}"><i class="pc ${c}${t}"></i></button>`).join("");
    box.classList.add("on");
    $("#apromoRow").onclick=e=>{const b=e.target.closest("button");if(!b)return;box.classList.remove("on");userMove(from,to,b.dataset.t)};
    return true;
  }
  userMove(from,to);return true;
}
/* 보드 조작: 클릭·드래그, 우클릭 화살표 */
const bEl=$("#ab8");
function sqAt(x,y){const b=bEl.getBoundingClientRect(),c=Math.floor((x-b.left)/b.width*8),r=Math.floor((y-b.top)/b.height*8);if(c<0||c>7||r<0||r>7)return null;return F[A.orient==="w"?c:7-c]+(A.orient==="w"?8-r:r+1)}
const sqEl=sq=>bEl.querySelector(`[data-sq="${sq}"]`);
const COLS={n:["#5C54D6","#6A80B4"],s:["#505A82","#505A82"],c:["#242942","#5C54D6"],a:["#6A80B4","#6A80B4"]};
const modK=e=>e.shiftKey?"s":(e.ctrlKey||e.metaKey)?"c":e.altKey?"a":"n";
function endFloat(){if(floatEl){floatEl.remove();floatEl=null}if(hov){const o=sqEl(hov);if(o)o.classList.remove("hov");hov=null}document.body.classList.remove("grabbing")}
bEl.addEventListener("contextmenu",e=>e.preventDefault());
bEl.addEventListener("pointerdown",e=>{
  if(!A)return;const sq=sqAt(e.clientX,e.clientY);if(!sq)return;e.preventDefault();
  try{bEl.setPointerCapture(e.pointerId)}catch(_){}
  const mac=e.button===0&&e.ctrlKey&&/Mac/i.test(navigator.platform);
  if(e.button===2||mac){sel=null;rd={from:sq,k:mac?"n":modK(e)};return}
  if(e.button!==0)return;
  if(marks.size||circ.size){marks.clear();circ.clear()}
  const g=new Chess(curFen()),p=g.get(sq);
  if(sel&&sel!==sq&&!(p&&p.color===g.turn())&&g.moves({square:sel,verbose:true}).some(m=>m.to===sq)){tryUser(sel,sq);return}
  if(p&&p.color===g.turn()){
    const was=sel===sq;sel=sq;drawBoard();
    const s=bEl.getBoundingClientRect().width/8;
    floatEl=document.createElement("i");floatEl.className=`pc ${p.color}${p.type} float`;floatEl.style.width=floatEl.style.height=s+"px";document.body.appendChild(floatEl);
    drag={from:sq,was,x0:e.clientX,y0:e.clientY,moved:false,s};
    floatEl.style.transform=`translate(${e.clientX-s/2}px,${e.clientY-s/2}px)`;document.body.classList.add("grabbing");
    const pe=sqEl(sq).querySelector(".pc");if(pe)pe.classList.add("ghost");
  }else{sel=null;drawBoard()}
});
window.addEventListener("pointermove",e=>{
  if(!drag)return;floatEl.style.transform=`translate(${e.clientX-drag.s/2}px,${e.clientY-drag.s/2}px)`;
  if(Math.hypot(e.clientX-drag.x0,e.clientY-drag.y0)>3)drag.moved=true;
  const t=sqAt(e.clientX,e.clientY);if(t!==hov){if(hov){const o=sqEl(hov);if(o)o.classList.remove("hov")}hov=t;if(t&&t!==drag.from){const n=sqEl(t);if(n)n.classList.add("hov")}}
});
window.addEventListener("pointerup",e=>{
  if(!A)return;
  if(rd){const r=rd;rd=null;const to=sqAt(e.clientX,e.clientY);
    if(to&&to!==r.from){const k=r.from+"-"+to,c=COLS[r.k][0];if(marks.get(k)===c)marks.delete(k);else marks.set(k,c)}
    else if(to===r.from){const c=COLS[r.k][1];if(circ.get(to)===c)circ.delete(to);else circ.set(to,c)}
    drawBoard();return}
  if(!drag)return;const d=drag;drag=null;endFloat();
  const to=sqAt(e.clientX,e.clientY);
  if(to&&to!==d.from){if(!tryUser(d.from,to))drawBoard();return}
  if(to===d.from&&d.was&&!d.moved)sel=null;
  drawBoard();
});
/* 요약·그래프 */
function summary(){
  const side=c=>{const idx=[];A.moves.forEach((m,k)=>{if(turnOf(A.fens[k])===c&&A.cls[k])idx.push(k)});
    if(!idx.length)return null;const accs=idx.map(k=>A.acc[k]);
    const mean=accs.reduce((a,b)=>a+b,0)/accs.length,harm=accs.length/accs.reduce((a,b)=>a+1/Math.max(b,5),0);
    const cnt={};ORDER.forEach(o=>cnt[o]=0);idx.forEach(k=>cnt[A.cls[k]]++);const raw=(mean+harm)/2;return {acc:window.calAcc?calAcc(raw):raw,raw,cnt}};
  const S2={w:side("w"),b:side("b")},gm=A.game,nm=c=>esc(gm.me===c?gm.my.name:gm.op.name),ca=c=>gm.acc?(gm.me===c?gm.acc.me:gm.acc.op):null;
  $("#acc2").innerHTML=["w","b"].map(c=>`<div><small>${c==="w"?"백":"흑"} · ${nm(c)}</small><b>${S2[c]?S2[c].acc.toFixed(1):"–"}</b><small>정확도${ca(c)!=null?` · 체스닷컴 ${ca(c).toFixed(1)}`:""}</small></div>`).join("");
  $("#cls").innerHTML=`<tr><td></td><td>백</td><td>흑</td></tr>`+ORDER.map(o=>`<tr><td>${clIco(o,"dot")}${CL[o].l}</td><td>${S2.w?S2.w.cnt[o]:"–"}</td><td>${S2.b?S2.b.cnt[o]:"–"}</td></tr>`).join("");
}
function graph(){
  const svg=$("#gsvg");if(!A)return;const W=svg.clientWidth,H=svg.clientHeight;if(!W)return;
  const n=A.fens.length-1||1,x=i=>i/n*W,y=v=>H-(v/100)*H;
  let d=`M0,${H}`,end=0;for(let i=0;i<=n;i++){if(A.ev[i]==null)break;d+=` L${x(i).toFixed(1)},${y(winPct(A.ev[i])).toFixed(1)}`;end=i}
  d+=` L${x(end).toFixed(1)},${H}Z`;
  let dots="";A.cls.forEach((c,k)=>{if(["inaccuracy","mistake","miss","blunder","brilliant","great"].includes(c))dots+=`<circle cx="${x(k+1)}" cy="${y(winPct(A.ev[k+1]))}" r="${c==="inaccuracy"?2.5:3.5}" fill="${CL[c].c}"/>`});
  const px=x(N.v?V.base:N.i);
  svg.innerHTML=`<path d="${d}" fill="#EFF0F6"/><line x1="0" x2="${W}" y1="${H/2}" y2="${H/2}" stroke="#6A80B4" stroke-opacity=".6"/>${dots}<line x1="${px}" x2="${px}" y1="0" y2="${H}" stroke="#5C54D6" stroke-width="2"/>`;
}
/* 분류 */
function sac(k,X){X=X||A;
  const m=X.moves[k];if(m.piece==="p"||m.piece==="k")return false;
  const pv=VAL[m.piece],cv=m.captured?VAL[m.captured]:0;if(pv-cv<2)return false;
  const g=new Chess(X.fens[k+1]),caps=g.moves({verbose:true}).filter(x=>x.to===m.to);
  if(!caps.length)return false;
  const low=caps.reduce((a,b)=>VAL[a.piece]<=VAL[b.piece]?a:b);g.move(low);
  const defended=g.moves({verbose:true}).some(x=>x.to===m.to);
  return !defended||pv-VAL[low.piece]>=2;
}
function classify(k,X){X=X||A;
  const mover=turnOf(X.fens[k]),wb=winPct(X.ev[k]),wa=winPct(X.ev[k+1]);
  const before=mover==="w"?wb:100-wb,after=mover==="w"?wa:100-wa,loss=Math.max(0,before-after);
  const m=X.moves[k],uci=m.from+m.to+(m.promotion||""),pos=new Chess(X.fens[k]),nLegal=pos.moves().length;
  const isBest=uci===X.best[k]||nLegal===1;
  let c=isBest?"best":loss<2?"excellent":loss<5?"good":loss<10?"inaccuracy":loss<20?"mistake":"blunder";
  /* 놓침: 상대가 실수·블런더로 준 기회를 크게 날렸지만 아직 지는 판은 아님 */
  const pc=k>0?X.cls[k-1]:null;
  if(loss>=10&&(pc==="mistake"||pc==="blunder"||pc==="miss")&&before>=60&&after>=35)c="miss";
  if(nLegal===1)c="forced";
  else if(k<X.book)c="book";
  else if(loss<2&&before<97&&after>=45&&sac(k,X))c="brilliant";
  else if(isBest&&nLegal>1&&X.sc2[k]&&!pos.in_check()){
    const w2=winPct(whiteCp(X.sc2[k],mover)),s2=mover==="w"?w2:100-w2,prev=k>0?X.moves[k-1]:null;
    const recap=prev&&prev.captured&&prev.to===m.to;
    if(before-s2>=18&&!recap&&before<92&&after>=35)c="great";
  }
  X.cls[k]=c;X.acc[k]=Math.max(0,Math.min(100,103.1668*Math.exp(-0.04354*loss)-3.1669));
}
async function analyse(id){
  const ast=$("#ast"),prog=$("#prog");ast.textContent="엔진 불러오는 중…";
  try{await Main.init()}catch(e){ast.textContent="엔진을 불러오지 못했어요.";A.busy=false;return}
  if(window.Openings){await Openings.load();if(id!==run)return;A.ol=Openings.line(A.fens);if(A.std)A.book=Math.max(A.book,A.ol.book);drawInfo()}
  if(id!==run)return;
  Main.send("ucinewgame");
  const n=A.fens.length;
  for(let i=0;i<n;i++){
    if(id!==run)return;
    const c=new Chess(A.fens[i]);let r;
    if(c.in_checkmate())r={best:null,score:{t:"mate",v:0},pv:[],score2:null};
    else if(c.in_stalemate()||c.insufficient_material())r={best:null,score:{t:"cp",v:0},pv:[],score2:null};
    else r=await evalPos(A.fens[i]);
    if(id!==run)return;
    A.sc[i]=r.score;A.sc2[i]=r.score2;A.best[i]=r.best;A.pv[i]=r.pv;A.ev[i]=whiteCp(r.score,c.turn());
    if(i>0)classify(i-1);
    prog.style.width=((i+1)/n*100)+"%";ast.textContent=`분석 중 ${i+1}/${n}`;
    if(i%4===0||i===n-1){summary();drawAll()}
  }
  A.busy=false;ast.textContent="분석 완료";mkPuzBtn();summary();drawAll();
}
/* 여러 판 분석용: 화면과 별개의 엔진으로 한 판을 평가·분류 */
const Batch=new Eng(2);
function evalWith(E,fen,cmd){return new Promise(res=>{const lines=[];E.onInfo=x=>{lines[x.k-1]=x};
  E.onBest=b=>res({best:b&&b!=="(none)"?b:null,score:lines[0]?lines[0].score:{t:"cp",v:0},pv:lines[0]?lines[0].pv:[],score2:lines[1]?lines[1].score:null});E.go(fen,cmd)})}
window.batchAnalyse=async function(game,cmd,onStep,alive){
  if(game.rules&&game.rules!=="chess")return null;
  const p=parse(game);if(p.moves.length<2)return null;
  const X={game,fens:p.fens,moves:p.moves,clk:p.clk,base:p.base,book:p.std?bookPly(game,p.moves):0,std:p.std,ev:[],sc:[],sc2:[],best:[],pv:[],cls:[],acc:[]};
  if(window.Openings){await Openings.load();if(X.std)X.book=Math.max(X.book,Openings.line(X.fens).book)}
  await Batch.init();Batch.send("ucinewgame");
  for(let i=0;i<X.fens.length;i++){
    if(alive&&!alive()){Batch.stop();return null}
    const c=new Chess(X.fens[i]);let r;
    if(c.in_checkmate())r={best:null,score:{t:"mate",v:0},pv:[],score2:null};
    else if(c.in_stalemate()||c.insufficient_material())r={best:null,score:{t:"cp",v:0},pv:[],score2:null};
    else r=await evalWith(Batch,X.fens[i],cmd||"go depth 11 movetime 250");
    X.sc[i]=r.score;X.sc2[i]=r.score2;X.best[i]=r.best;X.pv[i]=r.pv;X.ev[i]=whiteCp(r.score,c.turn());
    if(i>0)classify(i-1,X);
    if(onStep)onStep(i+1,X.fens.length);
  }
  X.puzzles=mistakePuzzles(X);X.winPct=winPct;
  return X;
};
window.openAnalysis=function(game,ply){
  run++;Main.stop();
  if(game.rules&&game.rules!=="chess"){const m=document.getElementById("msg");if(m)m.textContent="일반 체스만 분석할 수 있어요.";return}
  const p=parse(game);
  A={game,orient:game.me,fens:p.fens,moves:p.moves,clk:p.clk,base:p.base,book:p.std?bookPly(game,p.moves):0,std:p.std,ol:null,ev:[],sc:[],sc2:[],best:[],pv:[],cls:[],acc:[],busy:true};
  V=null;N={v:false,i:ply!=null?Math.min(ply,p.fens.length-1):p.fens.length-1};sel=null;marks.clear();circ.clear();L.fen=null;
  const RL={win:"승",loss:"패",draw:"무",abort:"중단"};
  $("#aTitle").textContent=game.title||`${game.my.name} vs ${game.op.name} · ${RL[game.res]} · ${game.how}`;
  $("#aLink").hidden=!game.url;if(game.url)$("#aLink").href=game.url;$("#aLink").textContent=game.linkText||"체스닷컴에서 보기";$("#prog").style.width="0";$("#ast").textContent="";
  $("#engT").setAttribute("aria-pressed",engOn);
  $("#ana").classList.add("on");document.body.style.overflow="hidden";
  if(!["paste","fen","play"].includes(game.id)){try{const u=new URL(location.href);u.searchParams.set("game",game.id);history.replaceState(null,"",u)}catch(e){}}
  summary();nav(false,N.i);analyse(run);$("#aClose").focus();
};
function close(){run++;Main.stop();if(Live.ready)Live.stop();clearTimeout(liveT);A=null;V=null;$("#ana").classList.remove("on");$("#apromo").classList.remove("on");document.body.style.overflow="";
  try{const u=new URL(location.href);u.searchParams.delete("game");history.replaceState(null,"",u)}catch(e){}}
$("#aClose").onclick=close;
const step=d=>{if(!A)return;nav(N.v,N.i+d)};
$("#cFirst").onclick=()=>A&&nav(false,0);$("#cPrev").onclick=()=>step(-1);$("#cNext").onclick=()=>step(1);
$("#cLast").onclick=()=>{if(!A)return;N.v?nav(true,V.moves.length):nav(false,A.fens.length-1)};
$("#cFlip").onclick=()=>{if(!A)return;A.orient=A.orient==="w"?"b":"w";drawAll()};
$("#mlist").onclick=e=>{
  const b=e.target.closest("button");if(!b||!A)return;
  if(b.classList.contains("mv"))nav(false,+b.dataset.p);
  else if(b.classList.contains("vm"))nav(true,+b.dataset.v);
  else if(b.classList.contains("vx")){const base=V.base;V=null;nav(false,base)}
};
$("#gfig").onclick=e=>{if(!A)return;const r=$("#gfig").getBoundingClientRect();nav(false,Math.round((e.clientX-r.left)/r.width*(A.fens.length-1)))};
document.addEventListener("keydown",e=>{
  if(!A||!$("#ana").classList.contains("on")||/INPUT|TEXTAREA/.test(e.target.tagName))return;
  if(e.key==="ArrowLeft"){step(-1);e.preventDefault()}else if(e.key==="ArrowRight"){step(1);e.preventDefault()}
  else if(e.key==="ArrowUp"||e.key==="Home"){nav(false,0);e.preventDefault()}else if(e.key==="ArrowDown"||e.key==="End"){$("#cLast").onclick();e.preventDefault()}
  else if(e.key==="Escape")close();
});
new ResizeObserver(()=>graph()).observe($("#gfig"));
}
