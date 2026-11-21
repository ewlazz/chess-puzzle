/* 한 판 분석: 수순 재생 + 브라우저 안 Stockfish로 평가·분류·정확도 */
{
const F="abcdefgh";
const CL={
  best:{l:"최선",s:"★",c:"#5f9e3a"},excellent:{l:"훌륭함",s:"!",c:"#7fb24a"},good:{l:"좋음",s:"✓",c:"#8fae80"},
  inaccuracy:{l:"부정확",s:"?!",c:"#e8b330"},mistake:{l:"실수",s:"?",c:"#e8862a"},blunder:{l:"블런더",s:"??",c:"#d1392f"}
};
const ORDER=["best","excellent","good","inaccuracy","mistake","blunder"];
/* 엔진 */
const Engine={
  w:null,ready:null,cur:null,
  init(){
    if(this.ready)return this.ready;
    this.ready=new Promise((res,rej)=>{
      try{this.w=new Worker("engine/stockfish-19-lite-single.js")}catch(e){rej(e);return}
      this.w.onerror=e=>rej(e);
      let ok=false;
      this.w.onmessage=e=>{const l=typeof e.data==="string"?e.data:"";
        if(l==="uciok"){this.w.postMessage("setoption name Hash value 32");this.w.postMessage("isready")}
        else if(l==="readyok"&&!ok){ok=true;res()}
        else this.line(l)};
      this.w.postMessage("uci");
    });
    return this.ready;
  },
  line(l){
    const c=this.cur;if(!c)return;
    if(l.startsWith("info")&&l.includes(" pv ")&&!/bound/.test(l)){
      const m=/score (cp|mate) (-?\d+)/.exec(l),pv=/ pv (.+)$/.exec(l);
      if(m&&pv){c.score={t:m[1],v:+m[2]};c.pv=pv[1].trim().split(" ")}
    }else if(l.startsWith("bestmove")){
      const b=l.split(" ")[1];this.cur=null;c.res({best:b&&b!=="(none)"?b:null,score:c.score||{t:"cp",v:0},pv:c.pv||[]});
    }
  },
  eval(fen){return new Promise(res=>{this.cur={res};this.w.postMessage("position fen "+fen);this.w.postMessage("go depth 14 movetime 450")})}
};
/* 점수 변환 */
function whiteCp(sc,turn){let v;if(sc.t==="mate"){const s=sc.v>0?1:-1;v=s*(10000-Math.abs(sc.v)*10)}else v=sc.v;return turn==="w"?v:-v}
const winPct=cp=>50+50*(2/(1+Math.exp(-0.00368208*cp))-1);
function evalText(sc,turn){
  if(!sc)return "";
  if(sc.t==="mate"){if(sc.v===0)return turn==="w"?"0-1":"1-0";const wm=(turn==="w")===(sc.v>0);return (wm?"":"-")+"M"+Math.abs(sc.v)}
  const c=whiteCp(sc,turn)/100;return (c>0?"+":"")+c.toFixed(1);
}
/* 상태 */
let A=null,run=0;
function parse(game){
  const c=new Chess();
  if(game.setup&&!/^rnbqkbnr\/pppppppp\/8\/8\/8\/8\/PPPPPPPP\/RNBQKBNR w KQkq - 0 1$/.test(game.setup))c.load(game.setup);
  const start=c.fen(),body=game.pgn.replace(/^\[[^\]]*\]\s*$/gm,"");
  const clk=[...body.matchAll(/\[%clk ([\d:.]+)\]/g)].map(m=>m[1].split(":").reduce((a,x)=>a*60+ +x,0));
  const toks=body.replace(/\{[^}]*\}/g," ").replace(/\([^)]*\)/g," ").replace(/\$\d+/g," ").replace(/\d+\.(\.\.)?/g," ").replace(/1-0|0-1|1\/2-1\/2|\*/g," ").trim().split(/\s+/).filter(Boolean);
  const fens=[start],moves=[];
  for(const t of toks){const m=c.move(t,{sloppy:true});if(!m)break;moves.push(m);fens.push(c.fen())}
  const base=+(String(game.tc||"").split("+")[0])||0;
  return {fens,moves,clk,base};
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
function clockAt(color){
  // 해당 색이 마지막으로 둔 수의 남은 시간
  let v=A.base||null;for(let k=0;k<A.ply;k++){const mover=A.fens[k].split(" ")[1];if(mover===color&&A.clk[k]!=null)v=A.clk[k]}return v;
}
function draw(){
  const i=A.ply,g=new Chess(A.fens[i]),mv=i>0?A.moves[i-1]:null,cl=i>0?A.cls[i-1]:null;
  $("#ab8").innerHTML=order().map((sq,n)=>{
    const p=g.get(sq),r=Math.floor(n/8),c=n%8,dark=(F.indexOf(sq[0])+ +sq[1])%2===1;
    const lm=mv&&(mv.from===sq||mv.to===sq)?" lm":"";
    const co=(c===0?`<span class="co r">${sq[1]}</span>`:"")+(r===7?`<span class="co f">${sq[0]}</span>`:"");
    const bd=cl&&mv.to===sq?`<span class="badge" style="background:${CL[cl].c}">${CL[cl].s}</span>`:"";
    return `<div class="s8 ${dark?"d":"l"}${lm}">${co}${p?`<i class="pc ${p.color}${p.type}"></i>`:""}${bd}</div>`;
  }).join("");
  let ar="";
  if(i>0&&cl&&cl!=="best"&&A.best[i-1]){const b=A.best[i-1];ar+=arrow(b.slice(0,2),b.slice(2,4),"#5f9e3a")}
  $("#amarks").innerHTML=ar;
  const ev=A.ev[i];
  const wp=ev!=null?winPct(ev):50;$("#evbW").style.height=wp+"%";const flip=A.orient==="b";$("#evb").classList.toggle("flip",flip);
  const t=A.sc[i]?evalText(A.sc[i],g.turn()):"";
  $("#evbT").textContent=t.replace("+","");const atW=wp>=50;$("#evbT").style.cssText=(atW!==flip?"bottom:4px;":"top:4px;")+(atW?"color:#222":"color:#eee");
  const top=A.orient==="w"?"b":"w",bot=A.orient;
  const pl=c=>{const gm=A.game,isMe=gm.me===c,p=isMe?gm.my:gm.op;return `<span>${esc(p.name)} <em>${p.rating}</em></span><span class="clk">${fmtClk(clockAt(c))}</span>`};
  $("#wTop").innerHTML=pl(top);$("#wBot").innerHTML=pl(bot);
  // 현재 수 설명
  let h="";
  if(i===0)h=`<b>시작 위치</b>`;
  else{const n=Math.ceil(i/2),dots=i%2?".":"...";h=`<b>${n}${dots} ${mv.san}</b>`;
    if(cl){h+=` <span class="dot" style="background:${CL[cl].c}">${CL[cl].s}</span>${CL[cl].l}`;
      if(cl!=="best"&&A.best[i-1]){const tmp=new Chess(A.fens[i-1]);const bm=tmp.move({from:A.best[i-1].slice(0,2),to:A.best[i-1].slice(2,4),promotion:A.best[i-1][4]||"q"});if(bm)h+=`<p>최선: ${bm.san}</p>`}}
    else if(A.busy)h+=` <span style="color:var(--muted)">분석 중</span>`;}
  if(A.sc[i]){h+=`<p>평가 ${t}${A.pv[i]&&A.pv[i].length?" · "+pvSan(i):""}</p>`}
  $("#cur").innerHTML=h;
  document.querySelectorAll(".mv").forEach(b=>b.classList.toggle("on",+b.dataset.p===i));
  const on=document.querySelector(".mv.on");if(on){const L=$("#mlist"),r=on.offsetTop-L.offsetTop;if(r<L.scrollTop||r>L.scrollTop+L.clientHeight-40)L.scrollTop=r-L.clientHeight/2}
}
function pvSan(i){const c=new Chess(A.fens[i]),out=[];for(const u of A.pv[i].slice(0,6)){const m=c.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||"q"});if(!m)break;out.push(m.san)}return out.join(" ")}
function moveList(){
  let h="";for(let k=0;k<A.moves.length;k+=2){
    const b=k=>{if(k>=A.moves.length)return "<span></span>";const c=A.cls[k];return `<button class="mv" data-p="${k+1}">${c&&c!=="best"&&c!=="excellent"&&c!=="good"?`<i style="background:${CL[c].c}">${CL[c].s}</i>`:""}${A.moves[k].san}</button>`};
    h+=`<div class="mrow"><span>${(k/2|0)+1}</span>${b(k)}${b(k+1)}</div>`;
  }
  $("#mlist").innerHTML=h;
}
function summary(){
  const side=c=>{const idx=A.moves.map((m,k)=>k).filter(k=>m(k)===c&&A.cls[k]);function m(k){return A.fens[k].split(" ")[1]}
    const accs=idx.map(k=>A.acc[k]);if(!accs.length)return null;
    const mean=accs.reduce((a,b)=>a+b,0)/accs.length,harm=accs.length/accs.reduce((a,b)=>a+1/Math.max(b,5),0);
    const cnt={};ORDER.forEach(o=>cnt[o]=0);idx.forEach(k=>cnt[A.cls[k]]++);return {acc:(mean+harm)/2,cnt}};
  A.sum={w:side("w"),b:side("b")};
  const gm=A.game,nm=c=>esc(gm.me===c?gm.my.name:gm.op.name),ca=c=>gm.acc?(gm.me===c?gm.acc.me:gm.acc.op):null;
  $("#acc2").innerHTML=["w","b"].map(c=>`<div><small>${c==="w"?"백":"흑"} · ${nm(c)}</small><b>${A.sum[c]?A.sum[c].acc.toFixed(1):"–"}</b><small>정확도${ca(c)!=null?` · 체스닷컴 ${ca(c).toFixed(1)}`:""}</small></div>`).join("");
  $("#cls").innerHTML=`<tr><td></td><td>백</td><td>흑</td></tr>`+ORDER.map(o=>`<tr><td><span class="dot" style="background:${CL[o].c}">${CL[o].s}</span>${CL[o].l}</td><td>${A.sum.w?A.sum.w.cnt[o]:"–"}</td><td>${A.sum.b?A.sum.b.cnt[o]:"–"}</td></tr>`).join("");
}
function graph(){
  const svg=$("#gsvg"),W=svg.clientWidth,H=svg.clientHeight;if(!W||!A)return;
  const n=A.fens.length-1||1,x=i=>i/n*W,y=v=>H-(v/100)*H;
  let d=`M0,${H}`;for(let i=0;i<=n;i++){if(A.ev[i]==null)break;d+=` L${x(i).toFixed(1)},${y(winPct(A.ev[i])).toFixed(1)}`}
  const last=A.ev.findIndex(v=>v==null);const end=last<0?n:last-1;
  d+=` L${x(Math.max(end,0)).toFixed(1)},${H}Z`;
  let dots="";A.cls.forEach((c,k)=>{if(c==="mistake"||c==="blunder"||c==="inaccuracy"){dots+=`<circle cx="${x(k+1)}" cy="${y(winPct(A.ev[k+1]))}" r="${c==="inaccuracy"?2.5:3.5}" fill="${CL[c].c}"/>`}});
  svg.innerHTML=`<path d="${d}" fill="#f2f2f2"/><line x1="0" x2="${W}" y1="${H/2}" y2="${H/2}" stroke="#888" stroke-opacity=".5"/>${dots}<line x1="${x(A.ply)}" x2="${x(A.ply)}" y1="0" y2="${H}" stroke="#ff6a3d" stroke-width="2"/>`;
}
function go(i){if(!A)return;A.ply=Math.max(0,Math.min(A.fens.length-1,i));draw();graph()}
function classify(k){
  const mover=A.fens[k].split(" ")[1],wb=winPct(A.ev[k]),wa=winPct(A.ev[k+1]);
  const before=mover==="w"?wb:100-wb,after=mover==="w"?wa:100-wa,loss=Math.max(0,before-after);
  const m=A.moves[k],uci=m.from+m.to+(m.promotion||"");
  const only=new Chess(A.fens[k]).moves().length===1;
  let c=uci===A.best[k]||only?"best":loss<2?"excellent":loss<5?"good":loss<10?"inaccuracy":loss<20?"mistake":"blunder";
  A.cls[k]=c;A.acc[k]=Math.max(0,Math.min(100,103.1668*Math.exp(-0.04354*loss)-3.1669));
}
async function analyse(id){
  const ast=$("#ast"),prog=$("#prog");
  ast.textContent="엔진 불러오는 중…";
  try{await Engine.init()}catch(e){ast.textContent="엔진을 불러오지 못했어요.";A.busy=false;return}
  if(id!==run)return;
  Engine.w.postMessage("ucinewgame");
  const n=A.fens.length;
  for(let i=0;i<n;i++){
    if(id!==run)return;
    const c=new Chess(A.fens[i]);let r;
    if(c.in_checkmate())r={best:null,score:{t:"mate",v:0},pv:[]};
    else if(c.in_stalemate()||c.insufficient_material())r={best:null,score:{t:"cp",v:0},pv:[]};
    else r=await Engine.eval(A.fens[i]);
    if(id!==run)return;
    A.sc[i]=r.score;A.best[i]=r.best;A.pv[i]=r.pv;A.ev[i]=whiteCp(r.score,c.turn());
    if(i>0)classify(i-1);
    prog.style.width=((i+1)/n*100)+"%";ast.textContent=`분석 중 ${i+1}/${n}`;
    if(i%4===0||i===n-1){moveList();summary();draw();graph()}
  }
  A.busy=false;ast.textContent="분석 완료";moveList();summary();draw();graph();
}
window.openAnalysis=function(game){
  run++;
  if(game.rules&&game.rules!=="chess"){alertMsg("일반 체스만 분석할 수 있어요.");return}
  const p=parse(game);
  A={game,orient:game.me,ply:0,fens:p.fens,moves:p.moves,clk:p.clk,base:p.base,ev:[],sc:[],best:[],pv:[],cls:[],acc:[],busy:true};
  const RL={win:"승",loss:"패",draw:"무"};
  $("#aTitle").textContent=`${game.my.name} vs ${game.op.name} · ${RL[game.res]} · ${game.how}`;
  $("#aLink").href=game.url;
  $("#prog").style.width="0";$("#ast").textContent="";
  $("#ana").classList.add("on");document.body.style.overflow="hidden";
  try{const u=new URL(location.href);u.searchParams.set("game",game.id);history.replaceState(null,"",u)}catch(e){}
  moveList();summary();go(p.fens.length-1);
  analyse(run);
  $("#aClose").focus();
};
function alertMsg(t){const m=document.getElementById("msg");if(m){m.textContent=t;m.scrollIntoView({block:"center"})}}
function close(){run++;if(Engine.w&&Engine.cur)Engine.w.postMessage("stop");A=null;$("#ana").classList.remove("on");document.body.style.overflow="";
  try{const u=new URL(location.href);u.searchParams.delete("game");history.replaceState(null,"",u)}catch(e){}}
$("#aClose").onclick=close;
$("#cFirst").onclick=()=>go(0);$("#cPrev").onclick=()=>go(A.ply-1);$("#cNext").onclick=()=>go(A.ply+1);$("#cLast").onclick=()=>go(A.fens.length-1);
$("#mlist").onclick=e=>{const b=e.target.closest(".mv");if(b)go(+b.dataset.p)};
$("#gfig").onclick=e=>{if(!A)return;const r=$("#gfig").getBoundingClientRect();go(Math.round((e.clientX-r.left)/r.width*(A.fens.length-1)))};
document.addEventListener("keydown",e=>{if(!A||!$("#ana").classList.contains("on"))return;
  if(e.key==="ArrowLeft"){go(A.ply-1);e.preventDefault()}else if(e.key==="ArrowRight"){go(A.ply+1);e.preventDefault()}
  else if(e.key==="Home"){go(0);e.preventDefault()}else if(e.key==="End"){go(A.fens.length-1);e.preventDefault()}else if(e.key==="Escape")close()});
const gro=new ResizeObserver(()=>graph());gro.observe($("#gfig"));
}
