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
/* 화살표: 두께·화살촉 크기 고정, 진하기(op)만 다르게 */
function arrow(from,to,color,op){
  const [c1,r1]=disp(from),[c2,r2]=disp(to),dc=Math.abs(c2-c1),dr=Math.abs(r2-r1),pts=[[c1+.5,r1+.5]];
  if(dc===1&&dr===2)pts.push([c1+.5,r2+.5]);else if(dc===2&&dr===1)pts.push([c2+.5,r1+.5]);
  pts.push([c2+.5,r2+.5]);const [px,py]=pts[pts.length-2],[tx,ty]=pts[pts.length-1],len=Math.hypot(tx-px,ty-py),ux=(tx-px)/len,uy=(ty-py)/len;
  const sw=.2,H=.46,W=.3,bx=tx-ux*H,by=ty-uy*H,j=p=>p.map(v=>+v.toFixed(3)).join(",");
  return `<g opacity="${op||.8}"><polyline points="${pts.slice(0,-1).concat([[bx+ux*.02,by+uy*.02]]).map(j).join(" ")}" fill="none" stroke="${color}" stroke-width="${sw}"/><polygon points="${[[tx,ty],[bx-uy*W,by+ux*W],[bx+uy*W,by-ux*W]].map(j).join(" ")}" fill="${color}"/></g>`;
}
let QZ=null,animNext=null,dropMv=false;
const canMove=g=>QZ&&QZ.on?(!QZ.busy&&g.turn()===QZ.list[QZ.i].c&&idx===line.length):(!DR.on||(!DR.busy&&g.turn()===DR.color&&idx===line.length));
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
  if(animNext){const a=animNext;animNext=null;slideMove(bEl,a.m,a.back)}
  const f=g.fen();$("#oCapT").innerHTML=matBar(f,orient==="w"?"b":"w");$("#oCapB").innerHTML=matBar(f,orient);
}
let topArrows=[];
function drawArrows(){let s="";
  if(DR.on||(QZ&&QZ.on)){const a=stGuideArrow();if(a)s+=arrow(a.from,a.to,"#5C54D6",.85)}
  else if(MODE==="study"){const A=ST.cur?stArrows():[];A.slice().reverse().forEach(a=>{s+=a.main?arrow(a.from,a.to,"#5C54D6",.85):arrow(a.from,a.to,"#242942",.6)})}
  else topArrows.slice().reverse().forEach((a,i,arr)=>{s+=arrow(a.from,a.to,"#5C54D6",i===arr.length-1?.85:.4)});marks.forEach((c,k)=>{const [a,b]=k.split("-");s+=arrow(a,b,c)});$("#omarks").innerHTML=s}
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
  if(!L.length){el.innerHTML='<p class="cnt">저장한 수순 없음</p>';return}
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
  const sv=savedIdx()>=0,star=idx?`<button class="ostar${sv?" on":""}" id="oStar" aria-label="${sv?"저장 취소":"저장"}">${sv?"저장됨":"저장"}</button>`:"";
  const nmH=(n,e,extra)=>{const k=Openings.ko(n);return `<span class="ont">${esc(k||n)}${star}</span><small>${k?esc(n)+" · ":""}${esc(e)}${extra||""}</small>`};
  $("#oName").innerHTML=idx===0?"시작 위치<small>수를 두거나 오프닝을 검색하세요</small>":nm?nmH(nm.name,nm.eco,inBook?"":" · 정석 밖"):xn?nmH(xn.name,xn.eco):`<span class="ont">정석 밖${star}</span><small>이름 붙은 수순을 벗어났어요</small>`;
  $("#oLine").innerHTML=line.length?line.map((s,i)=>`${i%2===0?`<em>${i/2+1}.</em>`:""}<button data-i="${i+1}" class="${i+1===idx?"on":""}">${esc(s)}</button>`).join(""):"";
  if(MODE==="ex")try{const u=new URL(location.href);if(line.length)u.searchParams.set("line",line.slice(0,idx).join(","));else u.searchParams.delete("line");history.replaceState(null,"",u)}catch(e){}
}
$("#oLine").onclick=e=>{const b=e.target.closest("[data-i]");if(b)go(+b.dataset.i)};
function go(i){const was=idx;idx=Math.max(0,Math.min(line.length,i));sel=null;marks.clear();circ.clear();stepSnd(was);refresh()}
/* 수순을 넘길 때도 소리: 앞으로 가면 그 수 소리, 뒤로 가면 기본 소리 */
function stepSnd(was){if(idx===was)return;if(idx<was){play("move-self");if(was-idx===1){const g=game(idx),m=g.move(line[idx]);if(m)animNext={m,back:true}}return}const g=game(idx-1),m=g.move(line[idx-1]);if(!m)return;if(idx-was===1)animNext={m};const k=snd(m,g);play(k==="move-self"&&m.color!==orient?"move-opponent":k)}
function refresh(){render();info();if(MODE==="ex")explore();engine();if(tab==="games")games();stNote()}
function setLine(sans){line=sans.slice();idx=line.length;sel=null;marks.clear();circ.clear();refresh()}
function pushMove(san){if(line[idx]===san){idx++}else{line=line.slice(0,idx);line.push(san);idx++}}
/* 수 통계 */
function wdb(w,d,b){const n=w+d+b||1,p=x=>Math.round(x/n*100);return `<div class="wdb"><i class="w" style="width:${w/n*100}%">${p(w)>12?p(w)+"%":""}</i><i class="d" style="width:${d/n*100}%">${p(d)>12?p(d)+"%":""}</i><i class="l" style="width:${b/n*100}%">${p(b)>12?p(b)+"%":""}</i></div>`}
/* 통계 출처: 마스터 또는 리체스 레이팅 구간 (레이팅 구간은 리체스 로그인 필요) */
const RATE=["m","1000","1200","1400","1600","1800","2000","2200","2500"],SPD=[["blitz,rapid","블리츠·래피드"],["bullet","불릿"],["blitz","블리츠"],["rapid","래피드"]];
let SRC="m",SPEED="blitz,rapid";try{SRC=localStorage.getItem("hansu-src")||"m";SPEED=localStorage.getItem("hansu-speed")||SPEED}catch(e){}
async function fetchX(fen,drillUse){
  const S0=drillUse&&!LI.tok?"m":SRC;
  const key=S0+"|"+SPEED+"|"+fen;if(cache.has(key))return cache.get(key);
  let r;
  if(S0==="m")r=await fetch(`https://explorer.lichess.ovh/masters?fen=${encodeURIComponent(fen)}&moves=12&topGames=10`);
  else{if(!LI.tok){const e=new Error("login");e.code="login";throw e}
    r=await fetch(`https://explorer.lichess.ovh/lichess?variant=standard&speeds=${SPEED}&ratings=${S0}&moves=12&topGames=0&recentGames=0&fen=${encodeURIComponent(fen)}`,{headers:{Authorization:"Bearer "+LI.tok}});
    if(r.status===401){LI.logout();const e=new Error("login");e.code="login";throw e}}
  if(!r.ok){const e=new Error(r.status);e.code=r.status;throw e}
  const j=await r.json();cache.set(key,j);return j;
}
const srcLabel=()=>SRC==="m"?"마스터":(SRC==="2500"?"2500+":SRC+"~"+(+SRC+200))+" · "+(SPD.find(x=>x[0]===SPEED)||SPD[0])[1];
function srcBar(){return `<div class="xsrc"><div class="chips">${RATE.map(k=>`<button class="chip" data-src="${k}" aria-pressed="${k===SRC}">${k==="m"?"마스터":k==="2500"?"2500+":k}</button>`).join("")}</div>${SRC==="m"?"":`<div class="chips">${SPD.map(([k,l])=>`<button class="chip" data-spd="${k}" aria-pressed="${k===SPEED}">${l}</button>`).join("")}</div>`}</div>`}
function explore(){
  clearTimeout(xTimer);const fen=fenAt(),el=$("#tEx"),key=SRC+"|"+SPEED+"|"+fen;
  if(!cache.has(key))el.innerHTML=srcBar()+'<p class="cnt">불러오는 중…</p>';
  xTimer=setTimeout(async()=>{
    let x=null;try{x=await fetchX(fen)}catch(e){if(fen!==fenAt())return;
      if(e.code==="login"){el.innerHTML=srcBar()+`<div class="xlogin"><button class="libtn" id="liGo">${window.LIIC||""}리체스 연결</button></div>`;topArrows=[];drawArrows();return}
      el.innerHTML=srcBar()+`<p class="cnt">${e.code===429?"요청이 많아요. 잠시 후 다시 해 보세요.":"수 통계를 불러오지 못했어요."}</p>`+bookMoves(fen);topArrows=[];drawArrows();return}
    if(fen!==fenAt())return;
    info();
    const tot=x.white+x.draws+x.black;
    if(!x.moves||!x.moves.length){el.innerHTML=srcBar()+`<p class="cnt">${srcLabel()} 게임에 이 포지션이 없어요.</p>`+bookMoves(fen);topArrows=[];drawArrows();return}
    const g=new Chess(fen),stm=g.turn(),minN=SRC==="m"?20:100;
    el.innerHTML=srcBar()+`<p class="cnt">${srcLabel()} 게임 ${tot.toLocaleString()}판${SRC!=="m"?``:""}</p><div class="scroll"><table class="xt"><thead><tr><th>수</th><th>판</th><th>백 승 · 무 · 흑 승</th><th>평균</th><th>오프닝</th></tr></thead><tbody>`+
      x.moves.map(m=>{const n=m.white+m.draws+m.black,t=new Chess(fen);t.move(m.san);const a=Openings.at(t.fen());const nm0=a&&a.name?a.name:m.opening?m.opening.name:"",nm=Openings.ko(nm0)||nm0;
        const sc=n?((stm==="w"?m.white:m.black)+m.draws/2)/n:0,bee=n>=minN&&sc>=.6;
        return `<tr data-san="${esc(m.san)}"><td class="sn">${esc(m.san)}${bee?BEE(`${stm==="w"?"백":"흑"} 승률 ${Math.round(sc*100)}%`):""}${a?'<span class="bkt">정석</span>':""}</td><td>${n.toLocaleString()} <span class="cnt">${Math.round(n/tot*100)}%</span></td><td>${wdb(m.white,m.draws,m.black)}</td><td>${m.averageRating||""}</td><td class="nm">${esc(nm)}</td></tr>`}).join("")+`</tbody></table></div>`;
    const mx=Math.max(...x.moves.map(m=>m.white+m.draws+m.black));
    topArrows=x.moves.slice(0,3).map(m=>{const t=new Chess(fen).move(m.san);return t?{from:t.from,to:t.to}:null}).filter(Boolean);drawArrows();
  },cache.has(key)?0:180);
}
const n0=a=>a.from&&a.to;
function bookMoves(fen){
  const g=new Chess(fen),out=[];
  for(const m of g.moves({verbose:true})){const t=new Chess(fen);t.move(m);const a=Openings.at(t.fen());if(a)out.push({san:m.san,name:a.name?(Openings.ko(a.name)||a.name):""})}
  if(!out.length)return "";
  return `<p class="cnt" style="margin-top:10px">이름 붙은 정석 수</p><div class="scroll"><table class="xt"><tbody>${out.map(o=>`<tr data-san="${esc(o.san)}"><td class="sn">${esc(o.san)}</td><td class="nm">${esc(o.name)}</td></tr>`).join("")}</tbody></table></div>`;
}
$("#tEx").addEventListener("click",e=>{const b=e.target.closest("[data-src],[data-spd],#liGo,#liOut");if(!b)return;e.stopPropagation();
  if(b.id==="liGo"){LI.login();return}if(b.id==="liOut"){LI.logout();SRC="m";try{localStorage.setItem("hansu-src","m")}catch(_){}explore();return}
  if(b.dataset.src){SRC=b.dataset.src}else SPEED=b.dataset.spd;try{localStorage.setItem("hansu-src",SRC);localStorage.setItem("hansu-speed",SPEED)}catch(_){}explore()},true);
$("#tEx").onclick=e=>{const r=e.target.closest("[data-san]");if(!r)return;const g=game();const m=g.move(r.dataset.san);if(!m)return;play(snd(m,g));animNext={m};pushMove(m.san);refresh()};
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
/* 공부: 오프닝 목록(첫 화면) → 오프닝별 공부 화면. 데이터는 js/study-data.js
   MODE: gal(목록) · study(공부) · ex(자유 탐색: 수 통계·대표 게임·연습·저장) */
const SP0=new URL(location.href).searchParams;
const MODE=SP0.get("study")?"study":(SP0.get("explore")||SP0.get("line")||SP0.get("drill")||SP0.get("oquiz"))?"ex":"gal";
document.body.classList.add("m-"+MODE);
const ST={cat:"all",side:"all",f:"",open:SP0.get("study"),cur:null};
const stProg=()=>{try{return JSON.parse(localStorage.getItem("hansu-study")||"{}")}catch(e){return {}}};
const stSaveP=o=>{try{localStorage.setItem("hansu-study",JSON.stringify(o))}catch(e){}};
const stCat=o=>{const f=o.trunk.split(" ")[0];return f==="e4"?"e4":f==="d4"?"d4":(f==="c4"||f==="Nf3")?"fl":"etc"};
const stFull=(o,l)=>l?(l.alt?l.alt.split(" "):o.trunk.split(" ").concat(l.moves?l.moves.split(" "):[])):o.trunk.split(" ");
const stBase=(o,mv)=>{const t=o.trunk.split(" ");let k=0;while(k<t.length&&t[k]===mv[k])k++;return k};
function stNotes(o,l){const mv=stFull(o,l),k=stBase(o,mv),n={};for(const [p,v] of Object.entries(o.notes))if(+p<=k)n[p]=v;return Object.assign(n,l?l.notes:{})}
function stPos(mv,n){const g=new Chess();let last=null;for(let i=0;i<n;i++)last=g.move(mv[i]);return {fen:g.fen(),hl:last?[last.from,last.to]:null}}
const stBadge=o=>(o.tags.includes("bee")?BEE("낮은 레이팅에서 승률 좋음"):"")+(o.tags.includes("chad")?CHAD("상남자 라인"):"");
const stObj=()=>(window.STUDY||[]).find(x=>x.id===ST.open);
const mvNo=(i,san)=>`${Math.floor(i/2)+1}${i%2?"...":"."}${san}`;
/* 목록 화면 */
function gal(){
  const el=$("#gal"),S=window.STUDY||[];
  const chips=(k,key,arr)=>`<div class="chips">${arr.map(([v,t])=>`<button class="chip" data-${k}="${v}" aria-pressed="${ST[key]===v}">${t}</button>`).join("")}</div>`;
  const L=S.filter(o=>(ST.cat==="all"||stCat(o)===ST.cat)&&(ST.side==="all"||o.side===ST.side)&&(!ST.f||o.tags.includes(ST.f))),P=stProg();
  el.innerHTML=`<div class="stf">${chips("stc","cat",[["all","전체"],["e4","1.e4"],["d4","1.d4"],["fl","1.c4·Nf3"],["etc","기타"]])}${chips("sts","side",[["all","백·흑"],["w","백으로"],["b","흑으로"]])}${chips("stf","f",[["","전부"],["bee",BEE("꿀벌")+"꿀벌"],["chad",CHAD("상남자")+"상남자"]])}</div>`+
    (L.length?`<div class="scards">${L.map(o=>{const t=o.trunk.split(" "),ps=stPos(t,o.thumb||t.length),done=o.lines.filter(l=>(P[o.id+"/"+l.id]||{}).ok).length;
      return `<a class="scard" href="opening.html?study=${o.id}">${miniBoard(ps.fen,o.side,ps.hl)}<span class="sct"><b>${esc(o.ko)}${stBadge(o)}</b><small>${esc(o.eco)} · ${o.side==="w"?"백":"흑"}</small><em>${esc(o.one)}</em><small>변화 ${o.lines.length}개${done?` · 외움 ${done}`:""}</small></span></a>`}).join("")}</div>`:'<p class="cnt">아직 없어요</p>');
}
$("#gal").onclick=e=>{const b=e.target.closest("[data-stc],[data-sts],[data-stf]");if(!b)return;const d=b.dataset;
  if(d.stc!=null)ST.cat=d.stc;else if(d.sts!=null)ST.side=d.sts;else ST.f=d.stf;gal()};
/* 공부 화면 */
function stTop(){const el=$("#stTop");
  if(MODE==="ex"){el.innerHTML='<a class="lnk" href="opening.html">← 오프닝 목록</a>';return}
  const o=stObj();if(!o){el.innerHTML="";return}
  el.innerHTML=`<a class="lnk" href="opening.html">← 오프닝 목록</a><div class="sth"><small>${esc(o.en)} · ${esc(o.eco)} · ${o.side==="w"?"백":"흑"}으로</small><p>${esc(o.one)}</p></div>`}
function study(){
  const o=stObj(),el=$("#tStudy"),P=stProg();if(!o){el.innerHTML='<p class="cnt">없는 오프닝이에요.</p>';return}
  const t=o.trunk.split(" "),row=(l)=>{const mv=stFull(o,l),ps=stPos(mv,mv.length),key=o.id+"/"+(l?l.id:"_"),pr=P[key],on=ST.cur&&ST.cur.key===key;
    const st=pr?(pr.ok?"외움":`연습 ${pr.n}번`):"아직";
    return `<div class="ritem${on?" on":""}" data-sv="${l?l.id:"_"}">${miniBoard(ps.fen,o.side,ps.hl)}<div class="rt1">${l?esc(l.ko):"공통 수순"}${l&&l===o.lines[0]?'<span class="bkt">메인</span>':""}${l&&l.trap?'<span class="bkt">함정</span>':""}</div><div class="rt2">${l?esc(l.sub):`${Math.ceil(t.length/2)}.${t[t.length-1]}까지`}</div><div class="rt3">${st}</div><button class="chip rgo" data-sd="${l?l.id:"_"}">연습</button></div>`};
  el.innerHTML=`<div id="stStat"></div><div class="stlist">${row(null)}${o.lines.map(row).join("")}</div><p class="cnt" style="margin-top:10px">줄을 누르면 보드에서 한 수씩 볼 수 있어요. ← → 키로 넘겨요.</p>`;
  stStats(o,ST.cur&&ST.cur.o===o?ST.cur.l:null);
}
/* 레이팅별 채택률·성적: 이 오프닝을 고르는 수(gam) 직전 자리에서 그 수를 몇 %가 두고 결과가 어떤지.
   마스터는 로그인 없이, 리체스 레이팅 구간은 리체스 연결 필요. 3일 캐시 */
const BANDS=["1000","1200","1400","1600","1800","2000","2200","2500"];
const BC={},BRUN={};
/* 이 줄이 다른 줄과 갈라지는 자리들(+ 오프닝을 고르는 수). 마지막 갈림이 이 변화를 정하는 수 */
function stForkPlies(o,l){const mv=stFull(o,l),all=[null].concat(o.lines).filter(x=>x!==l).map(x=>stFull(o,x)),out=new Set();if(o.gam!=null)out.add(o.gam);
  for(const M of all){let k=0;while(k<mv.length&&k<M.length&&M[k]===mv[k])k++;if(k<mv.length&&k<M.length)out.add(k)}
  return [...out].sort((a,b)=>a-b)}
async function stStats(o,l){if(!$("#stStat"))return;const mv=stFull(o,l),F=stForkPlies(o,l);if(!F.length){$("#stStat").innerHTML="";return}
  const lk=o.id+"/"+(l?l.id:"_");if(ST.fkLine!==lk||!F.includes(ST.fk)){ST.fkLine=lk;ST.fk=!l&&o.gam!=null?o.gam:F[F.length-1]}
  const ply=ST.fk,fen=fenOf(mv,ply),san=mv[ply],ck="hansu-band-"+fen+"|"+san;ST.bk=ck;
  let C=BC[ck];if(!C){C={};try{C=JSON.parse(localStorage.getItem(ck)||"{}")}catch(e){}if(C.t&&Date.now()-C.t>3*864e5)C={};BC[ck]=C}
  const me=o.side==="w"?"백":"흑";
  const row=(lab,r)=>{if(!r)return `<tr><td>${lab}</td><td colspan="4" class="cnt">…</td></tr>`;if(r.err)return `<tr><td>${lab}</td><td colspan="4" class="cnt">${r.err}</td></tr>`;
    const n=r.w+r.d+r.b,sc=n?Math.round(((o.side==="w"?r.w:r.b)+r.d/2)/n*100):0;
    return `<tr><td>${lab}</td><td><b>${r.tot?(n/r.tot*100).toFixed(n&&n/r.tot<.1?1:0):0}%</b></td><td>${n.toLocaleString()}</td><td>${n?wdb(r.w,r.d,r.b):""}</td><td>${n?sc+"%":"–"}</td></tr>`};
  const draw=()=>{const el=$("#stStat");if(!el||ST.bk!==ck)return;
    el.innerHTML=`<div class="bst"><p class="bsh"><b>레이팅별 채택률</b> <span class="cnt">블리츠·래피드 · 리체스 레이팅</span></p>`+
    `<div class="bfk">${F.map(p=>`<button class="chip" data-fk="${p}" aria-pressed="${p===ply}">${esc(mvNo(p,mv[p]))}</button>`).join("")}</div>`+
    `<p class="cnt bq"><b>${esc(mvNo(ply,san))}</b> · 이 자리에서 둔 비율과 그 뒤 결과 · 점수는 ${me} 기준</p>`+
    `<div class="scroll"><table class="xt"><thead><tr><th>구간</th><th>채택률</th><th>판</th><th>백 승 · 무 · 흑 승</th><th>${me} 점수</th></tr></thead><tbody>`+
    (LI.tok?BANDS.map(k=>row(k==="2500"?"2500+":k+"~"+(k==="2200"?2499:+k+199),C[k])).join(""):"")+row("마스터",C.m)+`</tbody></table></div>`+
    (LI.tok?"":`<div class="xlogin"><button class="libtn" id="liGo2">${window.LIIC||""}리체스 연결</button><span class="cnt">연결하면 1000~2500 구간별로 보여요</span></div>`)+`</div>`};
  draw();if(BRUN[ck])return;BRUN[ck]=1;
  const get=async k=>{const u=k==="m"?`https://explorer.lichess.ovh/masters?moves=15&topGames=0&fen=${encodeURIComponent(fen)}`:`https://explorer.lichess.ovh/lichess?variant=standard&speeds=blitz,rapid&ratings=${k}&moves=15&topGames=0&recentGames=0&fen=${encodeURIComponent(fen)}`;
    const r=await fetch(u,k==="m"?{}:{headers:{Authorization:"Bearer "+LI.tok}});if(r.status===429)throw new Error("429");if(!r.ok)throw new Error(r.status);const j=await r.json(),m=(j.moves||[]).find(x=>x.san===san)||{white:0,draws:0,black:0};
    return {tot:j.white+j.draws+j.black,w:m.white,d:m.draws,b:m.black}};
  for(const k of ["m"].concat(LI.tok?BANDS:[])){if(C[k]&&!C[k].err)continue;
    try{C[k]=await get(k)}catch(e){C[k]={err:e.message==="429"?"요청이 많아요. 잠시 후 다시":"못 불러옴"}}
    draw();await new Promise(r=>setTimeout(r,250))}
  BRUN[ck]=0;if(Object.values(C).every(x=>x&&!x.err)){C.t=Date.now();try{localStorage.setItem(ck,JSON.stringify(C))}catch(e){}}
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-fk]");if(!b||!ST.cur)return;ST.fk=+b.dataset.fk;stStats(ST.cur.o,ST.cur.l)});
const fenOf=(mv,n)=>{const g=new Chess();for(let i=0;i<n;i++)g.move(mv[i]);return g.fen()};
document.addEventListener("click",e=>{if(e.target.closest("#liGo2"))LI.login()});
function stSet(o,l){const mv=stFull(o,l);ST.cur={key:o.id+"/"+(l?l.id:"_"),o,l,mv,notes:stNotes(o,l),name:l?l.ko:"공통 수순"}}
function stView(o,l,at,noScroll){stSet(o,l);DR.on=false;if(QZ)QZ.on=false;orient=o.side;line=ST.cur.mv.slice();idx=at!=null?at:l?Math.max(0,stBase(o,ST.cur.mv)):0;sel=null;marks.clear();circ.clear();
  if(tab!=="study")showTab("study");else study();refresh();
  if(!noScroll&&innerWidth<=980){const hh=parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--hh"))||64;scrollTo({top:$("#ob8").getBoundingClientRect().top+scrollY-hh-8,behavior:"smooth"})}}
function stDrill(o,l){stSet(o,l);if(QZ)QZ.on=false;
  DR={on:true,color:o.side,hits:0,miss:0,busy:false,msg:"",rep:null,prefix:ST.cur.mv,study:ST.cur.key,guide:l?stBase(o,ST.cur.mv):0,free:false};line=[];idx=0;orient=o.side;showTab("drill");refresh();dStep()}
/* 연습: 공통 수순(갈라지기 전)은 화살표로 알려 주고, 갈라지는 자리부터 직접 */
function stGuideArrow(){if(!DR.on||!DR.study||DR.busy||idx>=DR.guide||idx!==line.length)return null;const g=game();if(g.turn()!==DR.color)return null;const m=g.moves({verbose:true}).find(z=>z.san===DR.prefix[idx]);return m?{from:m.from,to:m.to}:null}
function stGuide(op){const pre=op?`상대: ${op} · `:"";
  if(idx<DR.guide)dMsg(pre+"화살표대로 두세요.","");
  else if(!DR.free){DR.free=true;dMsg(pre+(DR.guide?"여기서 갈라져요. 이제부터 직접 두세요.":"처음부터 직접 두세요."),"go")}
  else dMsg(pre+"내 차례예요.","");
  drawArrows()}
function stDone(){const P=stProg(),k=DR.study,p=P[k]||{n:0,ok:false};p.n++;if(!DR.miss)p.ok=true;p.t=Date.now();P[k]=p;stSaveP(P);DR.on=false;
  $("#tDrill").innerHTML=`<div class="pr"><div class="prm ${DR.miss?"":"good"}">${DR.miss?`끝까지 왔어요. 틀림 ${DR.miss}번`:"한 번도 안 틀렸어요. 외움으로 표시했어요."}</div><div class="racts"><button class="bgo" data-stre="1">다시</button><button class="chip" data-stbk="1">${MODE==="study"?"변화 목록":"공부로"}</button></div></div>`;refresh()}
$("#tDrill").addEventListener("click",e=>{if(e.target.closest("[data-stre]")&&ST.cur)stDrill(ST.cur.o,ST.cur.l);else if(e.target.closest("[data-stbk]")){DR.on=false;showTab("study");refresh()}});
$("#tStudy").onclick=e=>{const b=e.target.closest("[data-sd],[data-sv]");if(!b)return;const o=stObj();if(!o)return;
  if(b.dataset.sd){stDrill(o,b.dataset.sd==="_"?null:o.lines.find(l=>l.id===b.dataset.sd));return}
  stView(o,b.dataset.sv==="_"?null:o.lines.find(l=>l.id===b.dataset.sv))};
/* 지금 자리에서 이 오프닝 변화들이 어디로 갈라지는지 */
function stForks(){const c=ST.cur;if(!c)return [];const o=c.o,cur=line.slice(0,idx),out=new Map();
  const cands=[{l:c.l,mv:c.mv}].concat(o.lines.filter(l=>l!==c.l).map(l=>({l,mv:stFull(o,l)})));
  if(c.l)cands.push({l:null,mv:stFull(o,null)});
  for(const x of cands){if(x.mv.length<=idx||!cur.every((s,i)=>s===x.mv[i]))continue;const san=x.mv[idx];if(!out.has(san))out.set(san,{san,l:x.l,names:[]});const e=out.get(san);if(x.l)e.names.push(x.l.ko)}
  return [...out.values()]}
function stArrows(){const F=stForks();if(!F.length)return [];const g=new Chess(fenAt()),res=[];
  F.forEach((f,i)=>{const m=g.moves({verbose:true}).find(z=>z.san===f.san);if(m)res.push({from:m.from,to:m.to,main:i===0})});return res}
function stNote(){const el=$("#oNote"),c=ST.cur;if(!el)return;
  if(MODE!=="study"||!c||DR.on||(QZ&&QZ.on)){el.hidden=true;return}
  let ok=line.slice(0,idx).every((s,i)=>s===c.mv[i]);
  if(!ok){/* 다른 변화 수순을 두면 그 변화로 옮겨 감 */
    const o=c.o,cur=line.slice(0,idx),hit=[null].concat(o.lines).find(l=>{const mv=stFull(o,l);return mv.length>=idx&&cur.every((s,i)=>s===mv[i])});
    if(hit!==undefined){stSet(o,hit);line=ST.cur.mv.slice();study();drawArrows();ok=true}}
  if(!ok){el.hidden=false;el.innerHTML=`<b>${esc(c.name)}</b><span>수순에서 벗어났어요.</span><button class="lnk" data-onb="1">돌아가기</button>`;return}
  const C=ST.cur,n=C.notes[idx],F=stForks();el.hidden=false;
  const nx=!F.length?'<span>끝</span>':F.length===1?`<span>다음</span><b>${esc(mvNo(idx,F[0].san))}</b>`:
    `<span>갈림길</span>${F.map((f,i)=>`<button class="${i===0?"mn":""}" data-br="${f.l?f.l.id:"_"}" data-san="${esc(f.san)}"><i class="${i===0?"":"br"}"></i><b>${esc(mvNo(idx,f.san))}</b>${f.names.length?esc(f.names[0])+(f.names.length>1?` 외 ${f.names.length-1}`:""):""}</button>`).join("")}`;
  el.innerHTML=`<b>${esc(C.name)} <em>${idx} / ${C.mv.length}</em></b>${n?`<span>${esc(n)}</span>`:""}<div class="onx">${nx}</div>`}
$("#oNote").onclick=e=>{const br=e.target.closest("[data-br]");
  if(br&&ST.cur){const o=ST.cur.o,l=br.dataset.br==="_"?null:o.lines.find(x=>x.id===br.dataset.br),at=idx;stSet(o,l);line=ST.cur.mv.slice();idx=Math.min(at+1,line.length);sel=null;
    const g=game(),h=g.history({verbose:true}),m=h[h.length-1];if(m){play(snd(m,g));animNext={m}}study();refresh();return}
  if(e.target.closest("[data-onb]")&&ST.cur){let k=0;while(k<idx&&line[k]===ST.cur.mv[k])k++;line=ST.cur.mv.slice();idx=k;sel=null;refresh()}};
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
function pick(i){const n=hits[i];if(!n)return;$("#ores").hidden=true;$("#oq").value="";loadPgn(n[2]);}
document.addEventListener("click",e=>{if(!e.target.closest(".osearch"))$("#ores").hidden=true});
/* 엔진 */
const E={w:null,ready:null,fen:null,pending:0,searching:false,lines:[],
  init(){if(this.ready)return this.ready;this.ready=new Promise((res,rej)=>{try{this.w=new Worker(ENG)}catch(e){rej(e);return}this.w.onerror=rej;let ok=false;
    this.w.onmessage=e=>{const l=String(e.data);if(l==="uciok"){this.w.postMessage("setoption name Hash value 32");this.w.postMessage("setoption name MultiPV value 3");this.w.postMessage("isready")}else if(l==="readyok"){if(!ok){ok=true;res()}}
      else if(l.startsWith("bestmove")){if(this.pending>0){this.pending--;return}this.searching=false}
      else if(l.startsWith("info")&&this.pending===0&&l.includes(" pv ")&&!/bound/.test(l))show(l)};
    this.w.postMessage("uci")});return this.ready},
  go(fen){this.fen=fen;this.lines=[];if(this.searching){this.pending++;this.w.postMessage("stop")}this.w.postMessage("position fen "+fen);this.w.postMessage("go depth 22");this.searching=true}
};
const wp=cp=>50+50*(2/(1+Math.exp(-0.00368208*cp))-1);
const evT=(t,v)=>t==="mate"?(v>0?"M":"-M")+Math.abs(v):(v>0?"+":"")+(v/100).toFixed(2);
function show(l){
  const fen=E.fen;if(fen!==fenAt())return;
  const m=/score (cp|mate) (-?\d+)/.exec(l),d=/ depth (\d+)/.exec(l),k=/ multipv (\d+)/.exec(l),pv=l.split(" pv ")[1];if(!m||!pv)return;
  const g=new Chess(fen),sgn=g.turn()==="b"?-1:1,raw=+m[2]*sgn,san=[];
  for(const u of pv.trim().split(" ").slice(0,12)){const x=g.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||"q"});if(!x)break;san.push(x.san)}
  E.lines[(k?+k[1]:1)-1]={t:m[1],v:raw,san,d:d?+d[1]:0};
  draw();
  function draw(){
    const L=E.lines.filter(Boolean),top=L[0];if(!top)return;
    const cp=top.t==="mate"?(top.v>0?1e4:-1e4):top.v,w=wp(cp);
    const st=new Chess(fen),n0=+fen.split(" ")[5],side=st.turn();
    const mv=(a,j)=>a.map((s,i)=>{const ply=(side==="w"?0:1)+i,no=n0+Math.floor(ply/2);return `${ply%2===0?`<em>${no}.</em>`:i===0?`<em>${no}...</em>`:""}<button data-pv="${j}" data-k="${i}">${esc(s)}</button>`}).join(" ");
    $("#oEng").innerHTML=`<div class="oeh"><b>${evT(top.t,top.v)}</b><span class="cnt">깊이 ${top.d}</span></div><div class="oevb" title="백 기준"><i style="width:${w.toFixed(1)}%"></i></div>`
      +L.map((x,j)=>`<div class="opv"><span class="pvs">${evT(x.t,x.v)}</span><span class="pvm">${mv(x.san,j)}</span></div>`).join("");
  }
}
$("#oEng").onclick=e=>{const b=e.target.closest("[data-pv]");if(!b)return;const x=E.lines[+b.dataset.pv];if(!x)return;setLine(line.slice(0,idx).concat(x.san.slice(0,+b.dataset.k+1)))};
let eT=0;function engine(){clearTimeout(eT);const fen=fenAt(),g=new Chess(fen);
  if((DR&&DR.on)||(QZ&&QZ.on)){$("#oEng").innerHTML='<p class="cnt">연습 중 엔진 꺼짐</p>';if(E.searching){E.pending++;E.w.postMessage("stop");E.searching=false}return}
  if(g.game_over()){$("#oEng").textContent=g.in_checkmate()?"체크메이트":"무승부";return}
  $("#oEng").innerHTML='<p class="cnt">엔진 계산 중…</p>';eT=setTimeout(()=>E.init().then(()=>{if(fenAt()===fen)E.go(fen)}).catch(()=>{$("#oEng").textContent=""}),150)}
/* 연습: 받은 수순(prefix)이 있으면 그 순서대로, 끝나면 마스터 게임에서 많이 둔 수로 이어감 */
function drill(){
  const el=$("#tDrill");
  if(!DR.on){el.innerHTML=`<div class="pr"><div class="seg" id="drC"><button class="chip" data-c="w" aria-pressed="${DR.color==="w"}">백으로</button><button class="chip" data-c="b" aria-pressed="${DR.color==="b"}">흑으로</button></div>
    <button class="bgo" id="drGo">지금 위치부터 연습</button></div>`;return}
  const pre=DR.prefix&&DR.prefix.length?`<p class="cnt" style="margin:0">수순 ${Math.min(idx,DR.prefix.length)} / ${DR.prefix.length}</p>`:"";
  el.innerHTML=`<div class="pr">${DR.rep?'<p class="cnt" style="margin:0">저장한 수순 연습</p>':pre}<div class="prm ${DR.cls||""}" id="drM">${DR.msg||""}</div><p class="cnt" style="margin:0">맞힘 ${DR.hits} · 틀림 ${DR.miss}${idx<line.length?" · 지난 수 보는 중 (→로 돌아오기)":""}</p><div class="racts"><button class="chip" id="drHint">힌트</button><button class="chip" id="drStop">그만하기</button></div></div>`;
}
$("#tDrill").onclick=e=>{
  const c=e.target.closest("[data-c]");if(c){DR.color=c.dataset.c;drill();return}
  if(e.target.id==="drGo"){DR={on:true,color:DR.color,hits:0,miss:0,busy:false,msg:"",start:idx,rep:null};line=line.slice(0,idx);orient=DR.color;drill();render();dStep();return}
  if(e.target.id==="drStop"){DR.on=false;drill();render()}
  if(e.target.id==="drHint"&&DR.on&&idx===line.length){DR.miss++;hint()}
};
const dMsg=(t,c)=>{DR.msg=t;DR.cls=c||"";drill()};
async function hint(){let san=DR.prefix&&idx<DR.prefix.length?DR.prefix[idx]:null;
  if(!san&&DR.rep){const C=repCands(idx);if(C.length)san=C[0][idx]}
  if(!san){try{const x=await fetchX(fenAt(),true);san=x.moves&&x.moves[0]&&x.moves[0].san}catch(e){}}
  if(!san)return;DR.hintMv=san;showHint();dMsg(`힌트 ${san}`,"")}
function showHint(){if(!DR.hintMv)return;const g=new Chess(fenAt()),m=g.move(DR.hintMv);if(!m)return;marks.clear();marks.set(m.from+"-"+m.to,"#5C54D6");drawArrows();DR.hintMv=null}
const repCands=n=>{const k=line.slice(0,n);return DR.rep.filter(r=>r.length>n&&k.every((x,i)=>r[i]===x))};
async function dStep(){
  if(!DR.on)return;const fen=fenAt(),g=new Chess(fen);
  if(DR.study&&idx>=DR.prefix.length){stDone();return}
  if(g.game_over()){DR.on=false;dMsg("");drill();return}
  if(DR.rep&&!repCands(idx).length){DR.on=false;DR.msg=`저장한 수순 끝까지 왔어요. 맞힘 ${DR.hits} · 틀림 ${DR.miss}`;render();el2();return}
  if(g.turn()===DR.color){if(DR.study){stGuide();render();return}if(!DR.msg)dMsg("내 차례예요.");render();return}
  if(DR.prefix&&idx<DR.prefix.length){DR.busy=true;render();await new Promise(r=>setTimeout(r,450));if(!DR.on)return;
    const m=g.move(DR.prefix[idx]);DR.busy=false;if(!m){DR.prefix=null;dStep();return}play(snd(m,g));animNext={m};pushMove(m.san);refresh();if(DR.study&&idx>=DR.prefix.length){stDone();return}if(DR.study){stGuide(m.san);return}dMsg(`상대: ${m.san} · 내 차례예요.`);return}
  if(DR.rep){DR.busy=true;render();await new Promise(r=>setTimeout(r,450));if(!DR.on)return;
    const C=repCands(idx),pk=C[Math.floor(Math.random()*C.length)][idx],m=g.move(pk);DR.busy=false;if(!m){DR.on=false;drill();return}
    play(snd(m,g));animNext={m};pushMove(m.san);refresh();if(!repCands(idx).length){dStep();return}dMsg(`상대: ${m.san} · 내 차례예요.`);return}
  DR.busy=true;render();
  let x;try{x=await fetchX(fen,true)}catch(e){DR.busy=false;dMsg("수 통계를 불러오지 못해서 멈췄어요.","bad");DR.on=false;drill();return}
  const ms=(x.moves||[]).filter(m=>m.white+m.draws+m.black>=3),tot=ms.reduce((s,m)=>s+m.white+m.draws+m.black,0);
  if(!ms.length||tot<10){DR.busy=false;DR.on=false;DR.msg=`여기서 마스터 게임이 끝났어요. 맞힘 ${DR.hits} · 벗어남 ${DR.miss}`;DR.cls="good";render();el2();return}
  let r=Math.random()*tot,pick=ms[0];for(const m of ms){r-=m.white+m.draws+m.black;if(r<=0){pick=m;break}}
  await new Promise(r=>setTimeout(r,450));if(!DR.on)return;
  const m=g.move(pick.san);if(!m){DR.busy=false;DR.on=false;dMsg("");drill();return}play(snd(m,g));animNext={m};pushMove(m.san);DR.busy=false;refresh();dMsg(`상대: ${pick.san} · 내 차례예요.`);
}
function el2(){$("#tDrill").innerHTML=`<div class="pr"><div class="prm good">${esc(DR.msg)}</div>${DR.rep?`<button class="bgo" data-redo="${DR.color}">다시 연습</button>`:'<button class="bgo" id="drGo">다시 연습</button>'}</div>`}
$("#tDrill").addEventListener("click",e=>{const r=e.target.closest("[data-redo]");if(!r)return;const R=reps().filter(x=>x.color===r.dataset.redo&&x.moves.length).map(x=>x.moves);if(!R.length)return;DR={on:true,color:r.dataset.redo,hits:0,miss:0,busy:false,msg:"",rep:R};line=[];idx=0;orient=DR.color;refresh();drill();dStep()});
async function dCheck(m,fenBefore){
  if(DR.rep){const exp=[...new Set(repCands(idx-1).map(r=>r[idx-1]))];
    if(exp.includes(m.san)){DR.hits++;dMsg(`맞아요, ${m.san}.`,"good");setTimeout(dStep,300)}
    else{DR.miss++;dMsg(`저장한 수는 ${exp.join(", ")}예요.`,"bad");DR.busy=true;setTimeout(()=>{idx--;line=line.slice(0,idx);DR.busy=false;refresh();drill()},1300)}
    return}
  if(DR.prefix&&idx-1<DR.prefix.length){const exp=DR.prefix[idx-1];
    const gd=DR.study&&idx-1<DR.guide;
    if(m.san===exp){if(!gd)DR.hits++;dMsg(gd?`좋아요, ${m.san}.`:`맞아요, ${m.san}.`,"good");setTimeout(dStep,300)}
    else{if(!gd)DR.miss++;dMsg(gd?`화살표 수는 ${exp}예요.`:`이 수순은 ${exp}예요.`,"bad");DR.hintMv=exp;DR.busy=true;setTimeout(()=>{idx--;line=line.slice(0,idx);DR.busy=false;refresh();drill();showHint()},1100)}
    return}
  let ok=!!Openings.at(fenAt()),pop=[];
  try{const x=await fetchX(fenBefore,true),tot=(x.moves||[]).reduce((s,y)=>s+y.white+y.draws+y.black,0);pop=(x.moves||[]).slice(0,3).map(y=>y.san);
    const me=(x.moves||[]).find(y=>y.san===m.san);if(me&&tot&&(me.white+me.draws+me.black)/tot>=.05)ok=true}catch(e){}
  if(ok&&DR.prefix&&line[idx-1]!==DR.prefix[idx-1])DR.prefix=null;
  if(ok){DR.hits++;dMsg(`좋아요, ${m.san}.`,"good");setTimeout(dStep,300)}
  else{DR.miss++;dMsg(`${m.san}은 정석 밖이에요.${pop.length?" 많이 두는 수: "+pop.join(", "):""}`,"bad");DR.busy=true;setTimeout(()=>{idx--;line=line.slice(0,idx);DR.busy=false;refresh();drill()},1200)}
}
/* 오프닝 실수 연습: 리포트에서 넘긴 자리에서 더 좋은 수 찾기 */
function qzLoad(){const q=QZ.list[QZ.i];DR.on=false;line=q.path.slice();idx=line.length;orient=q.c;sel=null;marks.clear();circ.clear();QZ.tries=0;QZ.busy=false;QZ.msg=`실전에선 ${q.san}`;QZ.cls="";showTab("drill");refresh();qzDraw()}
function qzDraw(){const q=QZ.list[QZ.i],nm=q.name?(Openings.ko(q.name)||q.name):"";
  $("#tDrill").innerHTML=QZ.done?`<div class="pr"><div class="prm good">끝 · 맞힘 ${QZ.hits} / ${QZ.list.length}</div><div class="racts"><button class="bgo" id="qzAgain">다시</button><button class="chip" id="qzStop">그만하기</button></div></div>`
    :`<div class="pr"><p class="cnt" style="margin:0">오프닝 실수 ${QZ.i+1} / ${QZ.list.length}${nm?" · "+esc(nm):""}</p><div class="prm ${QZ.cls||""}">${esc(QZ.msg)}</div><p class="cnt" style="margin:0">맞힘 ${QZ.hits} · 틀림 ${QZ.miss}</p><div class="racts"><button class="chip" id="qzHint">힌트</button><button class="chip" id="qzSkip">넘기기</button><button class="chip" id="qzStop">그만하기</button></div></div>`}
function qzNext(){if(QZ.i+1>=QZ.list.length){QZ.done=true;qzDraw();return}QZ.i++;qzLoad()}
function qzHint(){const q=QZ.list[QZ.i],g=new Chess(fenAt()),m=g.move(q.best);if(!m)return;marks.clear();marks.set(m.from+"-"+m.to,"#5C54D6");drawArrows()}
function qzCheck(m){const q=QZ.list[QZ.i];
  if(m.san===q.best){QZ.hits++;QZ.msg=`맞아요, ${m.san}`;QZ.cls="good";QZ.busy=true;qzDraw();setTimeout(qzNext,900);return}
  QZ.miss++;QZ.tries++;QZ.msg=m.san===q.san?`${m.san}는 실전에서 둔 수예요`:`${m.san} 말고`;QZ.cls="bad";QZ.busy=true;qzDraw();
  setTimeout(()=>{idx--;line=line.slice(0,idx);QZ.busy=false;refresh();qzDraw();if(QZ.tries>=2)qzHint()},900)}
$("#tDrill").addEventListener("click",e=>{if(!QZ)return;const id=e.target.id;
  if(id==="qzHint"&&!QZ.busy){QZ.miss++;qzHint()}
  else if(id==="qzSkip"&&!QZ.busy)qzNext();
  else if(id==="qzAgain"){QZ.i=0;QZ.hits=0;QZ.miss=0;QZ.done=false;qzLoad()}
  else if(id==="qzStop"){QZ.on=false;marks.clear();drill();refresh()}});
/* 탭 */
function showTab(t){tab=t;document.querySelectorAll(".otabs .tab").forEach(x=>x.setAttribute("aria-selected",x.dataset.t===t));
  $("#tEx").hidden=tab!=="ex";$("#tGames").hidden=tab!=="games";$("#tList").hidden=tab!=="list";$("#tDrill").hidden=tab!=="drill";$("#tSaved").hidden=tab!=="saved";$("#tStudy").hidden=tab!=="study";
  if(tab==="games")games();if(tab==="list")list();if(tab==="drill")(QZ&&QZ.on?qzDraw():drill());if(tab==="saved")saved();if(tab==="study")study()}
document.querySelectorAll(".otabs .tab").forEach(b=>b.onclick=()=>showTab(b.dataset.t));
/* 보드 조작 */
function userMove(from,to,pr){
  const fenBefore=fenAt(),g=game(),m=g.move({from,to,promotion:pr||"q"});sel=null;if(!m){render();return}
  play(snd(m,g));if(!dropMv)animNext={m};pushMove(m.san);marks.clear();circ.clear();refresh();
  if(QZ&&QZ.on){qzCheck(m);return}
  if(DR.on){DR.busy=true;dCheck(m,fenBefore).then(()=>{if(DR.on&&DR.cls!=="bad")DR.busy=false})}
}
function tryMove(from,to){
  const g=game(),ms=g.moves({square:from,verbose:true}).filter(m=>m.to===to);if(!ms.length)return false;
  if(ms.some(m=>m.promotion)){const box=$("#opromo");$("#opromoRow").innerHTML=["q","r","b","n"].map(t=>`<button data-t="${t}" aria-label="${t}"><i class="pc ${g.turn()}${t}"></i></button>`).join("");box.classList.add("on");
    $("#opromoRow").onclick=e=>{const b=e.target.closest("button");if(!b)return;box.classList.remove("on");userMove(from,to,b.dataset.t)};return true}
  userMove(from,to);return true;
}
/* 킹을 자기 룩 위에 놓아도 캐슬링 (체스닷컴처럼). ok로 실제 둘 수 있는지 확인 */
const castleSq=(get,f,t,ok)=>{const k=get(f);if(!(k&&k.type==="k"&&f[0]==="e"&&f[1]===t[1]&&Math.abs(t.charCodeAt(0)-101)>=2))return null;const c=(t[0]>"e"?"g":"c")+f[1];return !ok||ok(c)?c:null};
/* 보드 바깥 옆으로 살짝 끌어 놓아도 그 줄 끝 칸으로 봄 (캐슬링 판정용) */
const edgeSq=(el,o,x,y)=>{const b=el.getBoundingClientRect(),s=b.width/8;if(y<b.top||y>=b.bottom)return null;let c;if(x<b.left&&x>=b.left-s*1.5)c=0;else if(x>=b.right&&x<b.right+s*1.5)c=7;else return null;const r=Math.floor((y-b.top)/s);return "abcdefgh"[o==="w"?c:7-c]+(o==="w"?8-r:r+1)};
const COLS={n:["#5C54D6","#6A80B4"],s:["#505A82","#505A82"],c:["#242942","#5C54D6"],a:["#6A80B4","#6A80B4"]};
const pinned=(g,f,t)=>{try{return g.moves({square:f,verbose:true,legal:false}).some(m=>m.to===t)&&!g.moves({square:f,verbose:true}).some(m=>m.to===t)}catch(e){return false}};
const modK=e=>e.shiftKey?"s":(e.ctrlKey||e.metaKey)?"c":e.altKey?"a":"n";
function endFloat(){if(floatEl){floatEl.remove();floatEl=null}if(hov){const o=sqEl(hov);if(o)o.classList.remove("hov");hov=null}document.body.classList.remove("grabbing")}
bEl.addEventListener("contextmenu",e=>e.preventDefault());
bEl.addEventListener("pointerdown",e=>{
  let sq=sqAt(e.clientX,e.clientY);if(!sq)return;e.preventDefault();try{bEl.setPointerCapture(e.pointerId)}catch(_){}
  const mac=e.button===0&&e.ctrlKey&&/Mac/i.test(navigator.platform);
  if(e.button===2||mac){sel=null;rd={from:sq,k:mac?"n":modK(e)};return}
  if(e.button!==0)return;
  if(marks.size||circ.size){marks.clear();circ.clear()}
  const g=game();if(!canMove(g)){render();return}
  if(sel&&sel!==sq){const c=castleSq(x=>g.get(x),sel,sq,c=>g.moves({square:sel,verbose:true}).some(m=>m.to===c));if(c)sq=c}
  const p=g.get(sq);
  if(sel&&sel!==sq&&!(p&&p.color===g.turn())&&g.moves({square:sel,verbose:true}).some(m=>m.to===sq)){tryMove(sel,sq);return}
  if(sel&&sel!==sq&&!(p&&p.color===g.turn())&&pinned(g,sel,sq))play("illegal");
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
  let to=sqAt(e.clientX,e.clientY);const inB=!!to;to=to||edgeSq(bEl,orient,e.clientX,e.clientY);if(to&&to!==d.from){const c=castleSq(x=>game().get(x),d.from,to,c=>game().moves({square:d.from,verbose:true}).some(m=>m.to===c));if(c)to=c;else if(!inB)to=null}
  if(to&&to!==d.from){dropMv=true;const ok=tryMove(d.from,to);dropMv=false;if(!ok){const g=game();if(canMove(g)&&pinned(g,d.from,to))play("illegal");render()}return}
  if(to===d.from&&d.was&&!d.moved)sel=null;render();
});
const kstep=k=>document.dispatchEvent(new KeyboardEvent("keydown",{key:k}));
$("#bStart").onclick=()=>kstep("Home");$("#bBack").onclick=()=>kstep("ArrowLeft");$("#bFwd").onclick=()=>kstep("ArrowRight");
$("#bFlip").onclick=()=>{orient=orient==="w"?"b":"w";render()};
document.addEventListener("keydown",e=>{if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
  const step=i=>{if(DR.on){if(DR.busy)return;const was=idx;idx=Math.max(0,Math.min(line.length,i));sel=null;stepSnd(was);render();info();drill();return}go(i)};
  if(e.key==="ArrowLeft"){step(idx-1);e.preventDefault()}else if(e.key==="ArrowRight"){step(idx+1);e.preventDefault()}else if(e.key==="Home"){step(0);e.preventDefault()}else if(e.key==="End"){step(line.length);e.preventDefault()}});
/* 시작: 목록 화면 / ?study=id 공부 화면 / ?line=e4,c5 자유 탐색 */
stTop();
if(MODE==="gal"){$("#galSec").hidden=false;gal()}
else{render();
if(MODE==="study"){const o=stObj();if(o){$("#oH1").innerHTML=esc(o.ko)+stBadge(o);document.title=o.ko+" - 한 수"}Openings.load().then(()=>{if(o)stView(o,null,0,true);else{showTab("study")}})}
else Promise.all([Openings.load(),LI.ready]).then(()=>{if(LI.tok&&SRC==="m"&&LI.fresh){SRC="1600";try{localStorage.setItem("hansu-src",SRC)}catch(e){}}
  const q=new URL(location.href).searchParams.get("line");
  const sp=new URL(location.href).searchParams,dr=sp.get("drill");
  if(q){const g=new Chess(),ok=[];for(const s of q.split(",")){if(!s)continue;const m=g.move(s);if(!m)break;ok.push(m.san)}setLine(ok)}else refresh();
  if(sp.get("oquiz")){let L=[];try{L=JSON.parse(localStorage.getItem("hansu-oquiz")||"[]")}catch(e){}
    try{history.replaceState(null,"",location.pathname)}catch(e){}
    if(L.length){QZ={on:true,list:L,i:0,hits:0,miss:0,done:false};qzLoad();return}}
  if(dr==="w"||dr==="b"){const pre=line.slice();DR={on:true,color:dr,hits:0,miss:0,busy:false,msg:"내 차례예요.",rep:null,prefix:pre};line=[];idx=0;orient=dr;showTab("drill");refresh();dStep()}
});
}
}
