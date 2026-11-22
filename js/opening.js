/* 오프닝 페이지: 이름 검색, 수 통계(리체스 마스터 DB), 대표 게임, 오프닝 목록, 연습 */
{
const F="abcdefgh",ENG="engine/stockfish-19-lite-single.js";
let line=[],idx=0,orient="w",tab="ex",sel=null,drag=null,floatEl=null,hov=null,rd=null,xTimer=0;
const marks=new Map(),circ=new Map(),cache=new Map();
let DR={on:false,color:"w",hits:0,miss:0,busy:false};
/* 소리 */
let soundOn=true;try{soundOn=localStorage.getItem("hansu-sound")!=="off"}catch(e){}
const audio={};const play=k=>{if(!soundOn)return;try{const a=audio[k]||(audio[k]=new Audio("sounds/"+k+".mp3"));a.currentTime=0;a.play().catch(()=>{})}catch(e){}};
const snd=(m,g)=>g.in_check()?"move-check":m.flags.includes("p")?"promote":/[kq]/.test(m.flags)?"castle":m.captured?"capture":"move-self";
/* 위치 */
function game(n){const g=new Chess();for(let i=0;i<(n==null?idx:n);i++)g.move(line[i]);return g}
const fenAt=n=>game(n).fen();
const order=()=>{const a=[];for(let r=0;r<8;r++)for(let c=0;c<8;c++)a.push(F[orient==="w"?c:7-c]+(orient==="w"?8-r:r+1));return a};
const disp=sq=>{const f=F.indexOf(sq[0]),r=+sq[1];return orient==="w"?[f,8-r]:[7-f,r-1]};
const bEl=$("#ob8"),sqEl=sq=>bEl.querySelector(`[data-sq="${sq}"]`);
function sqAt(x,y){const b=bEl.getBoundingClientRect(),c=Math.floor((x-b.left)/b.width*8),r=Math.floor((y-b.top)/b.height*8);if(c<0||c>7||r<0||r>7)return null;return F[orient==="w"?c:7-c]+(orient==="w"?8-r:r+1)}
function arrow(from,to,color,w){
  const [c1,r1]=disp(from),[c2,r2]=disp(to),dc=Math.abs(c2-c1),dr=Math.abs(r2-r1),pts=[[c1+.5,r1+.5]];
  if(dc===1&&dr===2)pts.push([c1+.5,r2+.5]);else if(dc===2&&dr===1)pts.push([c2+.5,r1+.5]);
  pts.push([c2+.5,r2+.5]);const [px,py]=pts[pts.length-2],[tx,ty]=pts[pts.length-1],len=Math.hypot(tx-px,ty-py),ux=(tx-px)/len,uy=(ty-py)/len;
  const sw=w||.2,H=.44,W=.29,bx=tx-ux*H,by=ty-uy*H,j=p=>p.map(v=>+v.toFixed(3)).join(",");
  return `<g opacity=".8"><polyline points="${pts.slice(0,-1).concat([[bx+ux*.02,by+uy*.02]]).map(j).join(" ")}" fill="none" stroke="${color}" stroke-width="${sw}"/><polygon points="${[[tx,ty],[bx-uy*W,by+ux*W],[bx+uy*W,by-ux*W]].map(j).join(" ")}" fill="${color}"/></g>`;
}
const canMove=g=>!DR.on||(!DR.busy&&g.turn()===DR.color);
function render(){
  const g=game(),h=g.history({verbose:true}),last=h[h.length-1],legal=sel?g.moves({square:sel,verbose:true}).map(m=>m.to):[];
  let chk=null;if(g.in_check())for(const sq of order()){const p=g.get(sq);if(p&&p.type==="k"&&p.color===g.turn())chk=sq}
  bEl.innerHTML=order().map((sq,n)=>{
    const p=g.get(sq),r=Math.floor(n/8),c=n%8,dark=(F.indexOf(sq[0])+ +sq[1])%2===1;
    const cls=["s8",dark?"d":"l",last&&(last.from===sq||last.to===sq)?"lm":"",sel===sq?"sel":"",chk===sq?"chk":"",p&&p.color===g.turn()&&canMove(g)?"own":""].join(" ");
    const co=(c===0?`<span class="co r">${sq[1]}</span>`:"")+(r===7?`<span class="co f">${sq[0]}</span>`:"");
    const mk=circ.has(sq)?`<span class="mk" style="background:${circ.get(sq)}"></span>`:"";
    const dot=legal.includes(sq)?(p?'<b class="cp8"></b>':'<b class="dt8"></b>'):"";
    return `<div class="${cls}" data-sq="${sq}">${mk}${co}${p?`<i class="pc ${p.color}${p.type}${drag&&drag.from===sq?" ghost":""}"></i>`:""}${dot}</div>`;
  }).join("");
  drawArrows();
}
let topArrows=[];
function drawArrows(){let s="";(DR.on?[]:topArrows).forEach(a=>{s+=arrow(a.from,a.to,"#5f9e3a",a.w)});marks.forEach((c,k)=>{const [a,b]=k.split("-");s+=arrow(a,b,c)});$("#omarks").innerHTML=s}
/* 저장 (내 오프닝) */
const mvText=a=>a.map((x,i)=>i%2===0?`${i/2+1}. ${x}`:x).join(" ");
function reps(){try{return JSON.parse(localStorage.getItem("hansu-rep")||"[]")}catch(e){return []}}
function saveReps(l){try{localStorage.setItem("hansu-rep",JSON.stringify(l))}catch(e){}}
function savedIdx(){const k=line.slice(0,idx).join(" ");return reps().findIndex(r=>r.moves.join(" ")===k)}
function curName(){const g=new Chess(),fens=[g.fen()];for(let i=0;i<idx;i++){g.move(line[i]);fens.push(g.fen())}for(let i=fens.length-1;i>=0;i--){const a=Openings.at(fens[i]);if(a&&a.name)return a}const x=cache.get(fens[fens.length-1]);return x&&x.opening?x.opening:null}
function toggleSave(){const L=reps(),i=savedIdx();if(i>=0)L.splice(i,1);else{const nm=curName();L.push({id:Date.now(),color:orient,moves:line.slice(0,idx),name:nm?nm.name:"",eco:nm?nm.eco:"",memo:""})}saveReps(L);info();if(tab==="saved")saved()}
$("#oName").onclick=e=>{if(e.target.closest("#oStar"))toggleSave()};
function saved(){
  const L=reps(),el=$("#tSaved");
  if(!L.length){el.innerHTML='<p class="cnt">아직 없어요. 보드에서 수순을 만든 뒤 이름 옆 ☆ 저장을 누르세요. 저장할 때 보드 방향(백/흑)이 레퍼토리 색이 돼요.</p>';return}
  el.innerHTML=["w","b"].map(c=>{const G=L.map((r,i)=>[r,i]).filter(([r])=>r.color===c);if(!G.length)return "";
    return `<div class="rg"><div class="rgh"><h3>${c==="w"?"백":"흑"} 레퍼토리 <span class="cnt">${G.length}</span></h3><button class="chip" data-drill="${c}">전부 연습</button></div>`+
      G.map(([r,i])=>`<div class="ri"><button class="rl" data-open="${i}"><b>${esc(Openings.ko(r.name)||r.name||"이름 없는 수순")}</b><small>${esc(mvText(r.moves))}</small></button><input class="rm" data-memo="${i}" value="${esc(r.memo||"")}" placeholder="메모" aria-label="메모"><div class="ra"><button class="chip" data-col="${i}">${r.color==="w"?"백":"흑"}으로 저장됨</button><button class="chip" data-copy="${i}">PGN 복사</button><button class="chip" data-del="${i}">삭제</button></div></div>`).join("")+"</div>"}).join("");
}
$("#tSaved").addEventListener("click",async e=>{
  const t=e.target.closest("[data-open],[data-del],[data-col],[data-copy],[data-drill]");if(!t)return;const L=reps();
  if(t.dataset.open!=null){const r=L[+t.dataset.open];orient=r.color;setLine(r.moves);window.scrollTo({top:0,behavior:"smooth"});return}
  if(t.dataset.del!=null){L.splice(+t.dataset.del,1);saveReps(L);saved();info();return}
  if(t.dataset.col!=null){const r=L[+t.dataset.col];r.color=r.color==="w"?"b":"w";saveReps(L);saved();return}
  if(t.dataset.copy!=null){const r=L[+t.dataset.copy];try{await navigator.clipboard.writeText(mvText(r.moves));t.textContent="복사함"}catch(_){t.textContent="복사 안 됨"}return}
  if(t.dataset.drill){const R=L.filter(r=>r.color===t.dataset.drill&&r.moves.length).map(r=>r.moves);if(!R.length)return;
    DR={on:true,color:t.dataset.drill,hits:0,miss:0,busy:false,msg:"",rep:R};line=[];idx=0;orient=DR.color;showTab("drill");refresh();dStep()}
});
$("#tSaved").addEventListener("change",e=>{const i=e.target.dataset.memo;if(i==null)return;const L=reps();if(L[+i]){L[+i].memo=e.target.value;saveReps(L)}});
/* 이름·수순 */
function info(){
  let nm=null;const fens=[];const g=new Chess();fens.push(g.fen());for(let i=0;i<idx;i++){g.move(line[i]);fens.push(g.fen())}
  for(let i=fens.length-1;i>=0&&!nm;i--){const a=Openings.at(fens[i]);if(a&&a.name)nm=a}
  const x=cache.get(fens[fens.length-1]),xn=x&&x.opening;
  const inBook=!!Openings.at(fens[fens.length-1])||idx===0;
  const sv=savedIdx()>=0,star=idx?`<button class="ostar${sv?" on":""}" id="oStar" aria-label="${sv?"저장 취소":"저장"}">${sv?"★ 저장됨":"☆ 저장"}</button>`:"";
  const nmH=(n,e,extra)=>{const k=Openings.ko(n);return `<span class="ont">${esc(k||n)}${star}</span><small>${k?esc(n)+" · ":""}${esc(e)}${extra||""}</small>`};
  $("#oName").innerHTML=idx===0?"시작 위치<small>수를 두거나 오프닝을 검색하세요</small>":nm?nmH(nm.name,nm.eco,inBook?"":" · 정석 밖"):xn?nmH(xn.name,xn.eco):`<span class="ont">정석 밖${star}</span><small>이름 붙은 수순을 벗어났어요</small>`;
  $("#oLine").innerHTML=line.length?line.map((s,i)=>`${i%2===0?`<em>${i/2+1}.</em>`:""}<button data-i="${i+1}" class="${i+1===idx?"on":""}">${esc(s)}</button>`).join(""):"";
  try{const u=new URL(location.href);if(line.length)u.searchParams.set("line",line.slice(0,idx).join(","));else u.searchParams.delete("line");history.replaceState(null,"",u)}catch(e){}
}
$("#oLine").onclick=e=>{const b=e.target.closest("[data-i]");if(b)go(+b.dataset.i)};
function go(i){idx=Math.max(0,Math.min(line.length,i));sel=null;marks.clear();circ.clear();refresh()}
function refresh(){render();info();explore();engine();if(tab==="games")games()}
function setLine(sans){line=sans.slice();idx=line.length;sel=null;marks.clear();circ.clear();refresh()}
function pushMove(san){if(line[idx]===san){idx++}else{line=line.slice(0,idx);line.push(san);idx++}}
/* 수 통계 */
function wdb(w,d,b){const n=w+d+b||1,p=x=>Math.round(x/n*100);return `<div class="wdb"><i class="w" style="width:${w/n*100}%">${p(w)>12?p(w)+"%":""}</i><i class="d" style="width:${d/n*100}%">${p(d)>12?p(d)+"%":""}</i><i class="l" style="width:${b/n*100}%">${p(b)>12?p(b)+"%":""}</i></div>`}
async function fetchX(fen){
  if(cache.has(fen))return cache.get(fen);
  const r=await fetch(`https://explorer.lichess.ovh/masters?fen=${encodeURIComponent(fen)}&moves=12&topGames=10`);
  if(!r.ok){const e=new Error(r.status);e.code=r.status;throw e}
  const j=await r.json();cache.set(fen,j);return j;
}
function explore(){
  clearTimeout(xTimer);const fen=fenAt(),el=$("#tEx");
  if(!cache.has(fen))el.innerHTML='<p class="cnt">불러오는 중…</p>';
  xTimer=setTimeout(async()=>{
    let x=null;try{x=await fetchX(fen)}catch(e){if(fen!==fenAt())return;el.innerHTML=`<p class="cnt">${e.code===429?"요청이 많아요. 잠시 후 다시 해 보세요.":"수 통계를 불러오지 못했어요."}</p>`+bookMoves(fen);topArrows=[];drawArrows();return}
    if(fen!==fenAt())return;
    info();
    const tot=x.white+x.draws+x.black;
    if(!x.moves||!x.moves.length){el.innerHTML=`<p class="cnt">마스터 게임에 이 포지션이 없어요.</p>`+bookMoves(fen);topArrows=[];drawArrows();return}
    const g=new Chess(fen);
    el.innerHTML=`<p class="cnt">마스터 게임 ${tot.toLocaleString()}판</p><div class="scroll"><table class="xt"><thead><tr><th>수</th><th>판</th><th>백 승 · 무 · 흑 승</th><th>평균</th><th>오프닝</th></tr></thead><tbody>`+
      x.moves.map(m=>{const n=m.white+m.draws+m.black,t=new Chess(fen);t.move(m.san);const a=Openings.at(t.fen());const nm0=a&&a.name?a.name:m.opening?m.opening.name:"",nm=Openings.ko(nm0)||nm0;
        return `<tr data-san="${esc(m.san)}"><td class="sn">${esc(m.san)}${a?'<span class="bkt">정석</span>':""}</td><td>${n.toLocaleString()} <span class="cnt">${Math.round(n/tot*100)}%</span></td><td>${wdb(m.white,m.draws,m.black)}</td><td>${m.averageRating||""}</td><td class="nm">${esc(nm)}</td></tr>`}).join("")+`</tbody></table></div>`;
    const mx=Math.max(...x.moves.map(m=>m.white+m.draws+m.black));
    topArrows=x.moves.slice(0,3).map(m=>{const n=m.white+m.draws+m.black;return {from:m.uci.slice(0,2),to:m.uci.slice(2,4),w:.08+.14*n/mx}}).filter(a=>n0(a));drawArrows();
  },cache.has(fen)?0:180);
}
const n0=a=>a.from&&a.to;
function bookMoves(fen){
  const g=new Chess(fen),out=[];
  for(const m of g.moves({verbose:true})){const t=new Chess(fen);t.move(m);const a=Openings.at(t.fen());if(a)out.push({san:m.san,name:a.name?(Openings.ko(a.name)||a.name):""})}
  if(!out.length)return "";
  return `<p class="cnt" style="margin-top:10px">이름 붙은 정석 수</p><div class="scroll"><table class="xt"><tbody>${out.map(o=>`<tr data-san="${esc(o.san)}"><td class="sn">${esc(o.san)}</td><td class="nm">${esc(o.name)}</td></tr>`).join("")}</tbody></table></div>`;
}
$("#tEx").onclick=e=>{const r=e.target.closest("[data-san]");if(!r)return;const g=game();const m=g.move(r.dataset.san);if(!m)return;play(snd(m,g));pushMove(m.san);refresh()};
/* 대표 게임 */
async function games(){
  const el=$("#tGames"),fen=fenAt();el.innerHTML='<p class="cnt">불러오는 중…</p>';
  let x;try{x=await fetchX(fen)}catch(e){el.innerHTML='<p class="cnt">불러오지 못했어요.</p>';return}
  if(fen!==fenAt())return;
  const G=x.topGames||[];
  el.innerHTML=G.length?`<div class="tg2">${G.map(g=>`<a href="https://lichess.org/${esc(g.id)}" target="_blank" rel="noopener"><span>${esc(g.white.name)} <span class="cnt">${g.white.rating}</span> vs ${esc(g.black.name)} <span class="cnt">${g.black.rating}</span></span><em>${g.winner==="white"?"1-0":g.winner==="black"?"0-1":"½-½"} · ${g.year}</em></a>`).join("")}</div><p class="cnt" style="margin-top:8px">누르면 리체스에서 열려요.</p>`:'<p class="cnt">이 포지션의 대표 게임이 없어요.</p>';
}
/* 목록 */
let famSel=null;
function list(){
  const el=$("#tList"),N=Openings.names();if(!N.length){el.innerHTML='<p class="cnt">불러오는 중…</p>';return}
  if(!famSel){
    const m=new Map();N.forEach(n=>{const f=Openings.family(n[1]);m.set(f,(m.get(f)||0)+1)});
    el.innerHTML=`<div class="fam">${[...m.entries()].sort((a,b)=>b[1]-a[1]).map(([f,c])=>{const k=Openings.ko(f);return `<button data-f="${esc(f)}">${esc(k||f)}<em>${k?esc(f)+" · ":""}변화 ${c}개</em></button>`}).join("")}</div>`;
  }else{
    const v=N.filter(n=>Openings.family(n[1])===famSel);
    el.innerHTML=`<button class="chip" data-back="1">← 전체</button><h3 style="margin:12px 0 6px">${esc(Openings.ko(famSel)||famSel)}</h3><div class="vl">${v.map(n=>`<button data-pgn="${esc(n[2])}"><span>${esc(Openings.ko(n[1])||n[1])}<small>${esc(n[2])}</small></span><em>${esc(n[0])}</em></button>`).join("")}</div>`;
  }
}
$("#tList").onclick=e=>{const t=e.target.closest("[data-f],[data-back],[data-pgn]");if(!t)return;
  if(t.dataset.back){famSel=null;list();return}
  if(t.dataset.f){famSel=t.dataset.f;list();$("#tList").scrollIntoView({block:"nearest"});return}
  loadPgn(t.dataset.pgn);window.scrollTo({top:0,behavior:"smooth"})};
function loadPgn(p){const sans=(p||"").replace(/\d+\.(\.\.)?/g," ").trim().split(/\s+/).filter(Boolean);const g=new Chess(),ok=[];for(const s of sans){const m=g.move(s);if(!m)break;ok.push(m.san)}setLine(ok)}
/* 검색 */
let hits=[];
/* 이름(영어·한국어), ECO, 수순(e4 c5 / 1.e4 c5)으로 찾기 */
const normQ=t=>t.toLowerCase().replace(/[\s'’\-\.:,]/g,"");
const normMv=t=>t.replace(/\d+\.(\.\.)?/g," ").replace(/[+#!?]/g,"").trim().split(/\s+/).join(" ");
$("#oq").addEventListener("input",()=>{
  const raw=$("#oq").value.trim(),q=normQ(raw),box=$("#ores");if(!q){box.hidden=true;return}
  const N=Openings.names();let mv=null;
  {const g=new Chess(),ok=[];for(const t of normMv(raw).split(" ")){const m=t&&g.move(t,{sloppy:true});if(!m)break;ok.push(m.san)}if(ok.length&&ok.length===normMv(raw).split(" ").length)mv=ok}
  if(mv){const k=mv.join(" ");hits=N.filter(n=>{const p=normMv(n[2]).replace(/[+#]/g,"");return p===k||p.startsWith(k+" ")}).sort((a,b)=>a[2].length-b[2].length).slice(0,40);hits.unshift(["수순",mv.map((s,i)=>i%2===0?`${i/2+1}. ${s}`:s).join(" ")+" 으로 가기",mv.map((s,i)=>i%2===0?`${i/2+1}. ${s}`:s).join(" ")])}
  else{const e=raw.toUpperCase(),ws=raw.split(/\s+/).map(normQ).filter(Boolean);
    hits=N.filter(n=>{if(n[0]===e)return true;const a=normQ(n[1]),b=normQ(Openings.ko(n[1]));return ws.every(w=>a.includes(w)||b.includes(w))}).sort((x,y)=>x[1].length-y[1].length||x[2].length-y[2].length).slice(0,40)}
  box.innerHTML=hits.length?hits.map((n,i)=>{const k=Openings.ko(n[1]);return `<button data-i="${i}">${esc(k||n[1])}<em>${esc(n[0])}</em><small>${k?esc(n[1])+" · ":""}${esc(n[2])}</small></button>`}).join(""):'<button disabled>없어요</button>';box.hidden=false;
});
$("#oq").addEventListener("keydown",e=>{if(e.key==="Enter"&&hits[0]){pick(0);e.preventDefault()}else if(e.key==="Escape")$("#ores").hidden=true});
$("#ores").onclick=e=>{const b=e.target.closest("[data-i]");if(b)pick(+b.dataset.i)};
function pick(i){const n=hits[i];if(!n)return;$("#ores").hidden=true;$("#oq").value="";loadPgn(n[2]);if(tab==="list"){famSel=Openings.family(n[1]);list()}}
document.addEventListener("click",e=>{if(!e.target.closest(".osearch"))$("#ores").hidden=true});
/* 엔진 */
const E={w:null,ready:null,fen:null,pending:0,searching:false,
  init(){if(this.ready)return this.ready;this.ready=new Promise((res,rej)=>{try{this.w=new Worker(ENG)}catch(e){rej(e);return}this.w.onerror=rej;let ok=false;
    this.w.onmessage=e=>{const l=String(e.data);if(l==="uciok"){this.w.postMessage("setoption name Hash value 16");this.w.postMessage("isready")}else if(l==="readyok"){if(!ok){ok=true;res()}}
      else if(l.startsWith("bestmove")){if(this.pending>0){this.pending--;return}this.searching=false}
      else if(l.startsWith("info")&&this.pending===0&&l.includes(" pv ")&&!/bound/.test(l))show(l)};
    this.w.postMessage("uci")});return this.ready},
  go(fen){this.fen=fen;if(this.searching){this.pending++;this.w.postMessage("stop")}this.w.postMessage("position fen "+fen);this.w.postMessage("go depth 20");this.searching=true}
};
function show(l){
  const fen=E.fen,g=new Chess(fen),m=/score (cp|mate) (-?\d+)/.exec(l),d=/ depth (\d+)/.exec(l),pv=/ pv (\S+)/.exec(l);if(!m||fen!==fenAt())return;
  let v=+m[2];if(g.turn()==="b")v=-v;
  const t=m[1]==="mate"?(v>0?"M":"-M")+Math.abs(+m[2]):(v>0?"+":"")+(v/100).toFixed(2);
  let bs="";if(pv){const x=g.move({from:pv[1].slice(0,2),to:pv[1].slice(2,4),promotion:pv[1][4]||"q"});if(x)bs=x.san}
  $("#oEng").innerHTML=`엔진 <b>${t}</b>${bs?` · 최선 <b>${esc(bs)}</b>`:""} <span class="cnt">깊이 ${d?d[1]:""}</span>`;
}
let eT=0;function engine(){clearTimeout(eT);const fen=fenAt(),g=new Chess(fen);if(g.game_over()){$("#oEng").textContent=g.in_checkmate()?"체크메이트":"무승부";return}
  $("#oEng").textContent="엔진 계산 중…";eT=setTimeout(()=>E.init().then(()=>{if(fenAt()===fen)E.go(fen)}).catch(()=>{$("#oEng").textContent=""}),150)}
/* 연습: 마스터 게임에서 많이 둔 수로 상대가 두고, 내 수가 정석(마스터 5% 이상 또는 이름 붙은 수순)인지 확인 */
function drill(){
  const el=$("#tDrill");
  if(!DR.on){el.innerHTML=`<div class="pr"><p class="cnt" style="margin:0">지금 보드 위치부터 시작해요. 상대는 마스터 게임에서 많이 둔 수로 두고, 내가 정석을 벗어나면 알려 줘요.</p>
    <div class="seg" id="drC"><button class="chip" data-c="w" aria-pressed="${DR.color==="w"}">백으로</button><button class="chip" data-c="b" aria-pressed="${DR.color==="b"}">흑으로</button></div>
    <button class="bgo" id="drGo">연습 시작</button></div>`;return}
  el.innerHTML=`<div class="pr">${DR.rep?'<p class="cnt" style="margin:0">저장한 수순 연습</p>':""}<div class="prm ${DR.cls||""}" id="drM">${DR.msg||""}</div><p class="cnt" style="margin:0">맞힘 ${DR.hits} · ${DR.rep?"틀림":"벗어남"} ${DR.miss}</p><button class="chip" id="drStop">그만하기</button></div>`;
}
$("#tDrill").onclick=e=>{
  const c=e.target.closest("[data-c]");if(c){DR.color=c.dataset.c;drill();return}
  if(e.target.id==="drGo"){DR={on:true,color:DR.color,hits:0,miss:0,busy:false,msg:"",start:idx,rep:null};line=line.slice(0,idx);orient=DR.color;drill();render();dStep();return}
  if(e.target.id==="drStop"){DR.on=false;drill();render()}
};
const dMsg=(t,c)=>{DR.msg=t;DR.cls=c||"";drill()};
const repCands=n=>{const k=line.slice(0,n);return DR.rep.filter(r=>r.length>n&&k.every((x,i)=>r[i]===x))};
async function dStep(){
  if(!DR.on)return;const fen=fenAt(),g=new Chess(fen);
  if(g.game_over()){DR.on=false;dMsg("");drill();return}
  if(DR.rep&&!repCands(idx).length){DR.on=false;DR.msg=`저장한 수순 끝까지 왔어요. 맞힘 ${DR.hits} · 틀림 ${DR.miss}`;render();el2();return}
  if(g.turn()===DR.color){if(!DR.msg)dMsg("내 차례예요.");render();return}
  if(DR.prefix&&idx<DR.prefix.length){DR.busy=true;render();await new Promise(r=>setTimeout(r,450));if(!DR.on)return;
    const m=g.move(DR.prefix[idx]);DR.busy=false;if(!m){DR.prefix=null;dStep();return}play(snd(m,g));pushMove(m.san);refresh();dMsg(`상대: ${m.san} · 내 차례예요.`);return}
  if(DR.rep){DR.busy=true;render();await new Promise(r=>setTimeout(r,450));if(!DR.on)return;
    const C=repCands(idx),pk=C[Math.floor(Math.random()*C.length)][idx],m=g.move(pk);DR.busy=false;if(!m){DR.on=false;drill();return}
    play(snd(m,g));pushMove(m.san);refresh();if(!repCands(idx).length){dStep();return}dMsg(`상대: ${m.san} · 내 차례예요.`);return}
  DR.busy=true;render();
  let x;try{x=await fetchX(fen)}catch(e){DR.busy=false;dMsg("수 통계를 불러오지 못해서 멈췄어요.","bad");DR.on=false;drill();return}
  const ms=(x.moves||[]).filter(m=>m.white+m.draws+m.black>=3),tot=ms.reduce((s,m)=>s+m.white+m.draws+m.black,0);
  if(!ms.length||tot<10){DR.busy=false;DR.on=false;DR.msg=`여기서 마스터 게임이 끝났어요. 맞힘 ${DR.hits} · 벗어남 ${DR.miss}`;DR.cls="good";render();el2();return}
  let r=Math.random()*tot,pick=ms[0];for(const m of ms){r-=m.white+m.draws+m.black;if(r<=0){pick=m;break}}
  await new Promise(r=>setTimeout(r,450));if(!DR.on)return;
  const m=g.move(pick.san);if(!m){DR.busy=false;DR.on=false;dMsg("");drill();return}play(snd(m,g));pushMove(m.san);DR.busy=false;refresh();dMsg(`상대: ${pick.san} · 내 차례예요.`);
}
function el2(){$("#tDrill").innerHTML=`<div class="pr"><div class="prm good">${esc(DR.msg)}</div>${DR.rep?`<button class="bgo" data-redo="${DR.color}">다시 연습</button>`:'<button class="bgo" id="drGo">다시 연습</button>'}</div>`}
$("#tDrill").addEventListener("click",e=>{const r=e.target.closest("[data-redo]");if(!r)return;const R=reps().filter(x=>x.color===r.dataset.redo&&x.moves.length).map(x=>x.moves);if(!R.length)return;DR={on:true,color:r.dataset.redo,hits:0,miss:0,busy:false,msg:"",rep:R};line=[];idx=0;orient=DR.color;refresh();drill();dStep()});
async function dCheck(m,fenBefore){
  if(DR.rep){const exp=[...new Set(repCands(idx-1).map(r=>r[idx-1]))];
    if(exp.includes(m.san)){DR.hits++;dMsg(`맞아요, ${m.san}.`,"good");setTimeout(dStep,300)}
    else{DR.miss++;dMsg(`저장한 수는 ${exp.join(", ")}예요.`,"bad");DR.busy=true;setTimeout(()=>{idx--;line=line.slice(0,idx);DR.busy=false;refresh();drill()},1300)}
    return}
  let ok=!!Openings.at(fenAt()),pop=[];
  try{const x=await fetchX(fenBefore),tot=(x.moves||[]).reduce((s,y)=>s+y.white+y.draws+y.black,0);pop=(x.moves||[]).slice(0,3).map(y=>y.san);
    const me=(x.moves||[]).find(y=>y.san===m.san);if(me&&tot&&(me.white+me.draws+me.black)/tot>=.05)ok=true}catch(e){}
  if(ok&&DR.prefix&&line[idx-1]!==DR.prefix[idx-1])DR.prefix=null;
  if(ok){DR.hits++;dMsg(`좋아요, ${m.san}.`,"good");setTimeout(dStep,300)}
  else{DR.miss++;dMsg(`${m.san}은 정석 밖이에요.${pop.length?" 많이 두는 수: "+pop.join(", "):""}`,"bad");DR.busy=true;setTimeout(()=>{idx--;line=line.slice(0,idx);DR.busy=false;refresh();drill()},1200)}
}
/* 탭 */
function showTab(t){tab=t;document.querySelectorAll(".otabs .tab").forEach(x=>x.setAttribute("aria-selected",x.dataset.t===t));
  $("#tEx").hidden=tab!=="ex";$("#tGames").hidden=tab!=="games";$("#tList").hidden=tab!=="list";$("#tDrill").hidden=tab!=="drill";$("#tSaved").hidden=tab!=="saved";
  if(tab==="games")games();if(tab==="list")list();if(tab==="drill")drill();if(tab==="saved")saved()}
document.querySelectorAll(".otabs .tab").forEach(b=>b.onclick=()=>showTab(b.dataset.t));
/* 보드 조작 */
function userMove(from,to,pr){
  const fenBefore=fenAt(),g=game(),m=g.move({from,to,promotion:pr||"q"});sel=null;if(!m){render();return}
  play(snd(m,g));pushMove(m.san);marks.clear();circ.clear();refresh();
  if(DR.on){DR.busy=true;dCheck(m,fenBefore).then(()=>{if(DR.on&&DR.cls!=="bad")DR.busy=false})}
}
function tryMove(from,to){
  const g=game(),ms=g.moves({square:from,verbose:true}).filter(m=>m.to===to);if(!ms.length)return false;
  if(ms.some(m=>m.promotion)){const box=$("#opromo");$("#opromoRow").innerHTML=["q","r","b","n"].map(t=>`<button data-t="${t}" aria-label="${t}"><i class="pc ${g.turn()}${t}"></i></button>`).join("");box.classList.add("on");
    $("#opromoRow").onclick=e=>{const b=e.target.closest("button");if(!b)return;box.classList.remove("on");userMove(from,to,b.dataset.t)};return true}
  userMove(from,to);return true;
}
const COLS={n:["#ffaa00","#eb6150"],s:["#9fcf3f","#9fcf3f"],c:["#f8553f","#ffaa00"],a:["#48c1f9","#48c1f9"]};
const modK=e=>e.shiftKey?"s":(e.ctrlKey||e.metaKey)?"c":e.altKey?"a":"n";
function endFloat(){if(floatEl){floatEl.remove();floatEl=null}if(hov){const o=sqEl(hov);if(o)o.classList.remove("hov");hov=null}document.body.classList.remove("grabbing")}
bEl.addEventListener("contextmenu",e=>e.preventDefault());
bEl.addEventListener("pointerdown",e=>{
  const sq=sqAt(e.clientX,e.clientY);if(!sq)return;e.preventDefault();try{bEl.setPointerCapture(e.pointerId)}catch(_){}
  const mac=e.button===0&&e.ctrlKey&&/Mac/i.test(navigator.platform);
  if(e.button===2||mac){sel=null;rd={from:sq,k:mac?"n":modK(e)};return}
  if(e.button!==0)return;
  if(marks.size||circ.size){marks.clear();circ.clear()}
  const g=game();if(!canMove(g)){render();return}
  const p=g.get(sq);
  if(sel&&sel!==sq&&!(p&&p.color===g.turn())&&g.moves({square:sel,verbose:true}).some(m=>m.to===sq)){tryMove(sel,sq);return}
  if(p&&p.color===g.turn()){const was=sel===sq;sel=sq;render();
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
  if(to&&to!==d.from){if(!tryMove(d.from,to))render();return}
  if(to===d.from&&d.was&&!d.moved)sel=null;render();
});
$("#bStart").onclick=()=>{if(!DR.on)go(0)};$("#bBack").onclick=()=>{if(!DR.on)go(idx-1)};$("#bFwd").onclick=()=>{if(!DR.on)go(idx+1)};
$("#bFlip").onclick=()=>{orient=orient==="w"?"b":"w";render()};
document.addEventListener("keydown",e=>{if(/INPUT|TEXTAREA/.test(e.target.tagName)||DR.on)return;if(e.key==="ArrowLeft"){go(idx-1);e.preventDefault()}else if(e.key==="ArrowRight"){go(idx+1);e.preventDefault()}});
/* 시작: ?line=e4,c5 */
render();
Openings.load().then(()=>{
  const q=new URL(location.href).searchParams.get("line");
  const sp=new URL(location.href).searchParams,dr=sp.get("drill");
  if(q){const g=new Chess(),ok=[];for(const s of q.split(",")){if(!s)continue;const m=g.move(s);if(!m)break;ok.push(m.san)}setLine(ok)}else refresh();
  if(dr==="w"||dr==="b"){const pre=line.slice();DR={on:true,color:dr,hits:0,miss:0,busy:false,msg:pre.length?`자주 가는 수순(${pre.length}수)부터 연습해요. 내 차례예요.`:"",rep:null,prefix:pre};line=[];idx=0;orient=dr;showTab("drill");refresh();dStep()}
});
}
