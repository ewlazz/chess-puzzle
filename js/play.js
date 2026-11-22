/* 엔진과 대국: 레벨 1~10, 시간 제한, 프리무브, 무르기, 끝나면 분석 */
{
const F="abcdefgh",ENG="engine/stockfish-19-lite-single.js";
const LV=[{s:0,d:1,t:60},{s:1,d:2,t:80},{s:3,d:3,t:120},{s:5,d:4,t:160},{s:7,d:6,t:220},{s:9,d:8,t:300},{s:12,d:10,t:450},{s:15,d:12,t:650},{s:18,d:15,t:900},{s:20,d:18,t:1300}];
let g=new Chess(),me="w",orient="w",lvl=4,tc="0",base=0,inc=0,clock={w:0,b:0},iv=0,lastT=0,on=false,thinking=false,result=null;
let sel=null,drag=null,floatEl=null,hov=null,rd=null,pq=[],eTok=0;
const marks=new Map(),circ=new Map();
let pref={col:"w",lvl:4,tc:"0"};try{pref=Object.assign(pref,JSON.parse(localStorage.getItem("hansu-play")||"{}"))}catch(e){}
/* 소리 */
const SND={move:"move-self",opp:"move-opponent",capture:"capture",castle:"castle",check:"move-check",promote:"promote",premove:"premove",illegal:"illegal",end:"game-end",start:"game-start",low:"tenseconds"};
let soundOn=true;try{soundOn=localStorage.getItem("hansu-sound")!=="off"}catch(e){}
const audio={};
function play(k){if(!soundOn)return;try{const a=audio[k]||(audio[k]=new Audio("sounds/"+SND[k]+".mp3"));a.currentTime=0;a.play().catch(()=>{})}catch(e){}}
const moveSnd=(m,opp)=>g.in_check()?"check":m.flags.includes("p")?"promote":/[kq]/.test(m.flags)?"castle":m.captured?"capture":opp?"opp":"move";
/* 엔진 */
const E={w:null,ready:null,cb:null,
  init(){if(this.ready)return this.ready;this.ready=new Promise((res,rej)=>{try{this.w=new Worker(ENG)}catch(e){rej(e);return}this.w.onerror=rej;let ok=false;
    this.w.onmessage=e=>{const l=String(e.data);if(l==="uciok"){this.w.postMessage("setoption name Hash value 16");this.w.postMessage("isready")}else if(l==="readyok"){if(!ok){ok=true;res()}}else if(l.startsWith("bestmove")&&this.cb){const c=this.cb;this.cb=null;c(l.split(" ")[1])}};
    this.w.postMessage("uci")});return this.ready},
  move(fen,L){return this.init().then(()=>new Promise(res=>{this.cb=res;this.w.postMessage("setoption name Skill Level value "+L.s);this.w.postMessage("ucinewgame");this.w.postMessage("position fen "+fen);this.w.postMessage(`go depth ${L.d} movetime ${L.t}`)}))}
};
/* 설정 */
$("#sLv").innerHTML=LV.map((x,i)=>`<button data-v="${i}" aria-pressed="${i===pref.lvl}">${i+1}</button>`).join("");
const seg=(el,key)=>{document.querySelectorAll(el+" button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.v===String(pref[key])));$(el).onclick=e=>{const b=e.target.closest("button");if(!b)return;pref[key]=key==="lvl"?+b.dataset.v:b.dataset.v;seg(el,key)}};
seg("#sCol","col");seg("#sLv","lvl");seg("#sTc","tc");
/* 보드 */
const order=()=>{const a=[];for(let r=0;r<8;r++)for(let c=0;c<8;c++)a.push(F[orient==="w"?c:7-c]+(orient==="w"?8-r:r+1));return a};
const disp=sq=>{const f=F.indexOf(sq[0]),r=+sq[1];return orient==="w"?[f,8-r]:[7-f,r-1]};
const bEl=$("#pb8"),sqEl=sq=>bEl.querySelector(`[data-sq="${sq}"]`);
function sqAt(x,y){const b=bEl.getBoundingClientRect(),c=Math.floor((x-b.left)/b.width*8),r=Math.floor((y-b.top)/b.height*8);if(c<0||c>7||r<0||r>7)return null;return F[orient==="w"?c:7-c]+(orient==="w"?8-r:r+1)}
function kingSq(c){for(const sq of order()){const p=g.get(sq);if(p&&p.type==="k"&&p.color===c)return sq}}
/* 프리무브 줄: 상대 차례에 여러 수를 미리 걸어 둠. 보드엔 걸어 둔 대로 기물을 옮겨 보여 줌 */
function vpos(){const b={};for(const sq of order()){const p=g.get(sq);if(p)b[sq]=p}
  for(const m of pq){const p=b[m.from];if(!p)continue;delete b[m.from];
    if(p.type==="k"&&Math.abs(F.indexOf(m.to[0])-F.indexOf(m.from[0]))===2){const r=m.from[1],ks=m.to[0]==="g",rf=(ks?"h":"a")+r,rt=(ks?"f":"d")+r;if(b[rf]&&b[rf].type==="r"){b[rt]=b[rf];delete b[rf]}}
    b[m.to]=p.type==="p"&&/[18]/.test(m.to[1])?{type:"q",color:p.color}:p}
  return b}
const at=sq=>pq.length?vpos()[sq]||null:g.get(sq);
function addPre(from,to){if(pq.length<20)pq.push({from,to});sel=null;play("premove");render()}
function pmTargets(sq){
  const p=at(sq);if(!p)return [];const f=F.indexOf(sq[0]),r=+sq[1],out=[];
  const add=(df,dr)=>{const nf=f+df,nr=r+dr;if(nf>=0&&nf<8&&nr>=1&&nr<=8)out.push(F[nf]+nr)},ray=(df,dr)=>{for(let k=1;k<8;k++)add(df*k,dr*k)};
  const D=[[1,1],[1,-1],[-1,1],[-1,-1]],O=[[1,0],[-1,0],[0,1],[0,-1]];
  if(p.type==="n")[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]].forEach(d=>add(...d));
  if(p.type==="b"||p.type==="q")D.forEach(d=>ray(...d));
  if(p.type==="r"||p.type==="q")O.forEach(d=>ray(...d));
  if(p.type==="k"){D.concat(O).forEach(d=>add(...d));if(f===4&&r===(p.color==="w"?1:8)){add(2,0);add(-2,0)}}
  if(p.type==="p"){const d=p.color==="w"?1:-1;add(0,d);if(r===(p.color==="w"?2:7))add(0,2*d);add(1,d);add(-1,d)}
  return out;
}
const myTurn=()=>on&&!thinking&&g.turn()===me;
const targets=sq=>myTurn()?g.moves({square:sq,verbose:true}).map(m=>m.to):pmTargets(sq);
function arrow(from,to,color){
  const [c1,r1]=disp(from),[c2,r2]=disp(to),dc=Math.abs(c2-c1),dr=Math.abs(r2-r1),pts=[[c1+.5,r1+.5]];
  if(dc===1&&dr===2)pts.push([c1+.5,r2+.5]);else if(dc===2&&dr===1)pts.push([c2+.5,r1+.5]);
  pts.push([c2+.5,r2+.5]);const [px,py]=pts[pts.length-2],[tx,ty]=pts[pts.length-1],len=Math.hypot(tx-px,ty-py),ux=(tx-px)/len,uy=(ty-py)/len;
  const H=.44,W=.29,bx=tx-ux*H,by=ty-uy*H,j=p=>p.map(v=>+v.toFixed(3)).join(",");
  return `<g opacity=".8"><polyline points="${pts.slice(0,-1).concat([[bx+ux*.02,by+uy*.02]]).map(j).join(" ")}" fill="none" stroke="${color}" stroke-width=".2"/><polygon points="${[[tx,ty],[bx-uy*W,by+ux*W],[bx+uy*W,by-ux*W]].map(j).join(" ")}" fill="${color}"/></g>`;
}
function render(){
  const h=g.history({verbose:true}),last=h[h.length-1],legal=sel?targets(sel):[],chk=g.in_check()?kingSq(g.turn()):null,vb=pq.length?vpos():null;
  bEl.innerHTML=order().map((sq,n)=>{
    const p=vb?vb[sq]||null:g.get(sq),r=Math.floor(n/8),c=n%8,dark=(F.indexOf(sq[0])+ +sq[1])%2===1;
    const cls=["s8",dark?"d":"l",last&&(last.from===sq||last.to===sq)?"lm":"",pq.some(m=>m.from===sq||m.to===sq)?"pre":"",sel===sq?"sel":"",chk===sq?"chk":"",p&&p.color===me&&on?"own":""].join(" ");
    const co=(c===0?`<span class="co r">${sq[1]}</span>`:"")+(r===7?`<span class="co f">${sq[0]}</span>`:"");
    const mk=circ.has(sq)?`<span class="mk" style="background:${circ.get(sq)}"></span>`:"";
    const dot=legal.includes(sq)?(p?'<b class="cp8"></b>':'<b class="dt8"></b>'):"";
    return `<div class="${cls}" data-sq="${sq}">${mk}${co}${p?`<i class="pc ${p.color}${p.type}${drag&&drag.from===sq?" ghost":""}"></i>`:""}${dot}</div>`;
  }).join("");
  let ar="";marks.forEach((col,k)=>{const [a,b]=k.split("-");ar+=arrow(a,b,col)});$("#pmarks").innerHTML=ar;
  players();moveList();openName();
}
function openName(){
  const el=$("#popen");if(!el||!window.Openings||!Openings.ready())return;
  const c=new Chess(),fens=[c.fen()];for(const m of g.history())(c.move(m),fens.push(c.fen()));
  const ol=Openings.line(fens);if(!ol.name){el.innerHTML="";return}
  const k=Openings.ko(ol.name);el.innerHTML=`${esc(k||ol.name)}<small>${k?esc(ol.name)+" · ":""}${esc(ol.eco)}${ol.book<fens.length-1?" · 정석 밖":""}</small>`;
}
if(window.Openings)Openings.load().then(()=>openName());
const fmt=s=>{s=Math.max(0,s);const m=Math.floor(s/60),x=s-m*60;return s<20?`${m}:${x.toFixed(1).padStart(4,"0")}`:`${m}:${String(Math.floor(x)).padStart(2,"0")}`};
function players(){
  const nm=c=>c===me?"나":`Stockfish <em>레벨 ${lvl+1}</em>`,ck=c=>base&&(on||result)?`<span class="clk${on&&g.turn()===c?" run":""}${clock[c]<20&&base?" low":""}">${fmt(clock[c])}</span>`:"";
  const top=orient==="w"?"b":"w",f=g.fen(),mb=c=>window.matBar?matBar(f,c):"";$("#pTop").innerHTML=`<span>${nm(top)}${mb(top)}</span>${ck(top)}`;$("#pBot").innerHTML=`<span>${nm(orient)}${mb(orient)}</span>${ck(orient)}`;
}
function moveList(){
  const h=g.history();let s="";for(let i=0;i<h.length;i+=2)s+=`<div class="mrow"><span>${i/2+1}</span><b${i===h.length-1?' class="on"':""}>${h[i]}</b><b${i+1===h.length-1?' class="on"':""}>${h[i+1]||""}</b></div>`;
  const el=$("#pmv");el.innerHTML=s;el.scrollTop=el.scrollHeight;
}
/* 진행 */
function save(){try{localStorage.setItem("hansu-game",JSON.stringify(on?{pgn:g.pgn(),me,lvl,base,inc,clock}:null))}catch(e){}}
function startGame(resume){
  clearInterval(iv);eTok++;pq=[];sel=null;marks.clear();circ.clear();result=null;
  if(resume&&resume.fen){g=new Chess(resume.fen);me=resume.me;lvl=resume.lvl;base=0;inc=0;clock={w:0,b:0}}
  else if(resume){g=new Chess();g.load_pgn(resume.pgn);me=resume.me;lvl=resume.lvl;base=resume.base;inc=resume.inc;clock=resume.clock}
  else{g=new Chess();me=pref.col==="r"?(Math.random()<.5?"w":"b"):pref.col;lvl=pref.lvl;const [b,i]=String(pref.tc).split("+").map(Number);base=b||0;inc=i||0;clock={w:base,b:base};
    try{localStorage.setItem("hansu-play",JSON.stringify(pref))}catch(e){}play("start")}
  orient=me;on=true;thinking=false;
  $("#setup").hidden=true;$("#game").hidden=false;$("#result").hidden=true;$("#pst").textContent="";
  lastT=performance.now();if(base)iv=setInterval(tick,100);
  render();save();
  if(g.turn()!==me)engineMove();
}
function tick(){
  if(!on)return;const now=performance.now(),dt=(now-lastT)/1000;lastT=now;const c=g.turn(),before=clock[c];clock[c]-=dt;
  if(c===me&&before>=10&&clock[c]<10)play("low");
  if(clock[c]<=0){clock[c]=0;finish(c===me?"loss":"win",c===me?"시간 초과":"엔진 시간 초과");return}
  players();
}
function afterMove(m,opp){
  if(base&&inc)clock[m.color]+=inc;lastT=performance.now();
  play(moveSnd(m,opp));render();save();
  if(g.in_checkmate()){finish(g.turn()===me?"loss":"win","체크메이트");return true}
  if(g.in_stalemate()){finish("draw","스테일메이트");return true}
  if(g.insufficient_material()){finish("draw","기물 부족");return true}
  if(g.in_threefold_repetition()){finish("draw","3회 반복");return true}
  if(g.in_draw()){finish("draw","50수 규칙");return true}
  return false;
}
async function engineMove(){
  thinking=true;const tok=++eTok;$("#pst").textContent="생각 중…";render();
  const t0=performance.now();let b;
  try{b=await E.move(g.fen(),LV[lvl])}catch(e){$("#pst").textContent="엔진을 불러오지 못했어요.";thinking=false;return}
  const wait=Math.max(0,350-(performance.now()-t0));await new Promise(r=>setTimeout(r,wait));
  if(tok!==eTok||!on)return;
  thinking=false;$("#pst").textContent="";
  const m=b&&b!=="(none)"?g.move({from:b.slice(0,2),to:b.slice(2,4),promotion:b[4]||"q"}):null;
  if(!m){render();return}
  if(afterMove(m,true))return;
  if(pq.length){const pm=pq.shift();if(!tryMove(pm.from,pm.to,"q")){pq=[];render()}}
}
function userMove(from,to,pr){
  const m=g.move({from,to,promotion:pr||"q"});sel=null;if(!m){render();return}
  if(afterMove(m,false))return;engineMove();
}
function tryMove(from,to,auto){
  const ms=g.moves({square:from,verbose:true}).filter(m=>m.to===to);if(!ms.length)return false;
  if(ms.some(m=>m.promotion)&&!auto){const box=$("#ppromo");$("#ppromoRow").innerHTML=["q","r","b","n"].map(t=>`<button data-t="${t}" aria-label="${t}"><i class="pc ${me}${t}"></i></button>`).join("");box.classList.add("on");
    $("#ppromoRow").onclick=e=>{const b=e.target.closest("button");if(!b)return;box.classList.remove("on");userMove(from,to,b.dataset.t)};return true}
  userMove(from,to,auto);return true;
}
function finish(res,how){
  on=false;thinking=false;eTok++;clearInterval(iv);pq=[];result={res,how};save();play("end");render();
  const T={win:"승리",loss:"패배",draw:"무승부"};
  $("#result").innerHTML=`<b>${T[res]}</b>${esc(how)}<div class="acts"><button class="pri" id="rAna">분석</button><button id="rNew">새 게임</button></div>`;$("#result").hidden=false;$("#pst").textContent="";
  $("#rAna").onclick=analyse;$("#rNew").onclick=newGame;
}
function analyse(){
  const r=result||{res:"",how:""},h=g.history().length;
  const pgn=`[White "${me==="w"?"나":"Stockfish 레벨 "+(lvl+1)}"]\n[Black "${me==="b"?"나":"Stockfish 레벨 "+(lvl+1)}"]\n[Result "${g.in_checkmate()?(g.turn()==="w"?"0-1":"1-0"):r.res==="draw"?"1/2-1/2":r.res==="win"?(me==="w"?"1-0":"0-1"):r.res==="loss"?(me==="w"?"0-1":"1-0"):"*"}"]\n${g.header().FEN?`[SetUp "1"]\n[FEN "${g.header().FEN}"]\n`:""}\n`+g.pgn({max_width:0}).replace(/^\[[^\]]*\]\s*/gm,"");
  if(!h)return;
  window.openAnalysis({id:"play",url:"",pgn,tc:"",rules:"chess",me,res:r.res,how:r.how,my:{name:"나",rating:""},op:{name:"Stockfish 레벨 "+(lvl+1),rating:""},acc:null,title:`나 vs Stockfish 레벨 ${lvl+1}${r.how?" · "+r.how:""}`});
}
function newGame(){on=false;result=null;eTok++;clearInterval(iv);save();$("#setup").hidden=false;$("#game").hidden=true;g=new Chess();orient=pref.col==="b"?"b":"w";render()}
$("#start").onclick=()=>startGame();
$("#aFlip").onclick=()=>{orient=orient==="w"?"b":"w";render()};
$("#aResign").onclick=()=>{if(on)finish("loss","기권")};
$("#aBack").onclick=()=>{
  if(!on||!g.history().length)return;eTok++;thinking=false;pq=[];$("#pst").textContent="";
  g.undo();if(g.turn()!==me&&g.history().length)g.undo();if(g.turn()!==me){render();engineMove();return}
  render();save();
};
/* 조작 */
const COLS={n:["#5C54D6","#6A80B4"],s:["#505A82","#505A82"],c:["#242942","#5C54D6"],a:["#6A80B4","#6A80B4"]};
const pinned=(g,f,t)=>{try{return g.moves({square:f,verbose:true,legal:false}).some(m=>m.to===t)&&!g.moves({square:f,verbose:true}).some(m=>m.to===t)}catch(e){return false}};
const modK=e=>e.shiftKey?"s":(e.ctrlKey||e.metaKey)?"c":e.altKey?"a":"n";
function endFloat(){if(floatEl){floatEl.remove();floatEl=null}if(hov){const o=sqEl(hov);if(o)o.classList.remove("hov");hov=null}document.body.classList.remove("grabbing")}
bEl.addEventListener("contextmenu",e=>e.preventDefault());
bEl.addEventListener("pointerdown",e=>{
  const sq=sqAt(e.clientX,e.clientY);if(!sq)return;e.preventDefault();try{bEl.setPointerCapture(e.pointerId)}catch(_){}
  const mac=e.button===0&&e.ctrlKey&&/Mac/i.test(navigator.platform);
  if(e.button===2||mac){if(pq.length||sel){pq=[];sel=null;render()}rd={from:sq,k:mac?"n":modK(e)};return}
  if(e.button!==0)return;
  if(marks.size||circ.size){marks.clear();circ.clear()}
  if(!on){render();return}
  const p=myTurn()?g.get(sq):at(sq);
  if(sel&&sel!==sq&&!(p&&p.color===me)&&targets(sel).includes(sq)){
    if(!myTurn()){addPre(sel,sq);return}
    if(tryMove(sel,sq))return;
  }
  if(myTurn()&&sel&&sel!==sq&&!(p&&p.color===me)&&pinned(g,sel,sq))play("illegal");
  if(!myTurn()&&pq.length&&!(p&&p.color===me)){pq=[];sel=null;render();return}
  if(p&&p.color===me){const was=sel===sq;sel=sq;render();
    const s=bEl.getBoundingClientRect().width/8;floatEl=document.createElement("i");floatEl.className=`pc ${p.color}${p.type} float`;floatEl.style.width=floatEl.style.height=s+"px";document.body.appendChild(floatEl);
    drag={from:sq,was,x0:e.clientX,y0:e.clientY,moved:false,s};floatEl.style.transform=`translate(${e.clientX-s/2}px,${e.clientY-s/2}px)`;document.body.classList.add("grabbing");
    const pe=sqEl(sq).querySelector(".pc");if(pe)pe.classList.add("ghost");
  }else{sel=null;render()}
});
window.addEventListener("pointermove",e=>{
  if(!drag)return;floatEl.style.transform=`translate(${e.clientX-drag.s/2}px,${e.clientY-drag.s/2}px)`;
  if(Math.hypot(e.clientX-drag.x0,e.clientY-drag.y0)>3)drag.moved=true;
  const t=sqAt(e.clientX,e.clientY);if(t!==hov){if(hov){const o=sqEl(hov);if(o)o.classList.remove("hov")}hov=t;if(t&&t!==drag.from){const n=sqEl(t);if(n)n.classList.add("hov")}}
});
window.addEventListener("pointerup",e=>{
  if(rd){const r=rd;rd=null;const to=sqAt(e.clientX,e.clientY);
    if(to&&to!==r.from){const k=r.from+"-"+to,c=COLS[r.k][0];if(marks.get(k)===c)marks.delete(k);else marks.set(k,c)}
    else if(to===r.from){const c=COLS[r.k][1];if(circ.get(to)===c)circ.delete(to);else circ.set(to,c)}
    render();return}
  if(!drag)return;const d=drag;drag=null;endFloat();
  const to=sqAt(e.clientX,e.clientY);
  if(to&&to!==d.from){
    if(!myTurn()){if(on&&pmTargets(d.from).includes(to))addPre(d.from,to);else render();return}
    if(tryMove(d.from,to))return;if(pinned(g,d.from,to))play("illegal");render();return;
  }
  if(to===d.from&&d.was&&!d.moved)sel=null;
  render();
});
/* 이어 두기 */
let saved=null;try{saved=JSON.parse(localStorage.getItem("hansu-game")||"null")}catch(e){}
lvl=pref.lvl;orient=pref.col==="b"?"b":"w";render();
const qs=new URL(location.href).searchParams,qf=qs.get("fen");
if(qf){let ok=true;try{ok=new Chess().validate_fen(qf).valid}catch(e){}
  if(ok){history.replaceState(null,"",location.pathname);const t=qs.get("t");startGame({fen:qf,me:qs.get("me")==="b"?"b":"w",lvl:Math.max(0,Math.min(9,+(qs.get("lvl")||8)))});
    if(t){const c=document.createElement("p");c.className="pchal";c.textContent=t;$("#pmv").parentNode.insertBefore(c,$("#pmv").parentNode.firstChild)}}}
else if(saved&&saved.pgn!=null)startGame(saved);
}
