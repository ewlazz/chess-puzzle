/* 전적 > 리포트: 한 페이지에 오프닝·자꾸 두는 수·시간·상대·엔진 진단을 순서대로 */
{
const TC={bullet:"불릿",blitz:"블리츠",rapid:"래피드",daily:"데일리"};
const CN={w:"백",b:"흑"};
const RL={win:"승",loss:"패",draw:"무"};
const ENGN=20;
const P=x=>Math.round(x*100)+"%";
function rec(a){let w=0,d=0;a.forEach(g=>{if(g.res==="win")w++;else if(g.res==="draw")d++});const n=a.length;return {n,w,d,l:n-w-d,s:n?(w+d/2)/n:0}}
const ko=n=>window.Openings&&Openings.ko(n)||n;
const mv=a=>a.map((x,i)=>i%2===0?`${i/2+1}. ${x}`:x).join(" ");
const pad=n=>String(n).padStart(2,"0");
let RT=0,LIST=[],OTHER={},AUTO={tok:0,p:Promise.resolve(),scan:null,txt:"",sig:""};
/* 여러 판이 공통으로 지나간 수순(60% 이상이 같은 수를 둔 곳까지) */
function commonLine(G){
  const p=[];for(let i=0;i<20;i++){const m=new Map();G.forEach(g=>{const s=g._o&&g._o.san;if(s&&s.length>i&&p.every((x,k)=>s[k]===x))m.set(s[i],(m.get(s[i])||0)+1)});
    const top=[...m.entries()].sort((a,b)=>b[1]-a[1])[0];if(!top||top[1]<G.length*.6)break;p.push(top[0])}
  return p;
}
function group(a,key){const m=new Map();a.forEach(g=>{const k=key(g);if(!k)return;if(!m.has(k))m.set(k,[]);m.get(k).push(g)});return [...m.entries()].sort((x,y)=>y[1].length-x[1].length)}
const recTxt=r=>`${r.w}승 ${r.d}무 ${r.l}패`;
/* 한 줄: 이름 · 전적 · 막대 · 승률 */
function line(name,r,o){o=o||{};
  return `<div class="rr${o.cls?" "+o.cls:""}"${o.attr||""}><span class="rn">${name}${o.tag||""}</span><span class="rw">${recTxt(r)}</span>${window.wdlBar(r.w,r.d,r.l)}<span class="rp">${P(r.s)}</span></div>`;
}
const flag=(r,base)=>r.n>=5&&r.s<=base-.1?{cls:"lo",tag:'<span class="rtg">약함</span>'}:r.n>=5&&r.s>=base+.1?{cls:"hi",tag:window.BEE?BEE("승률 "+P(r.s)):'<span class="rtg">강함</span>'}:{};
function gameRow(g){const d=new Date(g.end*1000);
  return `<div class="og"><span class="res ${g.res}">${RL[g.res]||"–"}</span><span class="on">${esc(g.op.name)} <em>${g.op.rating}</em> · ${esc(g.how||"")}</span><span class="od">${pad(d.getMonth()+1)}.${pad(d.getDate())}</span><button class="ab" data-gid="${esc(g.id)}">분석</button></div>`}
/* 1. 오프닝 */
const varOf=g=>{const n=g._o&&g._o.name||g.open||"";return n.split(",")[0].trim()};
const famOf=g=>{const n=g._o&&g._o.fam||g.fam||"";return n};
function openSec(L){
  const col=c=>{
    const A=L.filter(g=>g.me===c),base=rec(A).s;
    const fams=group(A,famOf).filter(([k,a])=>a.length>=3);
    if(!fams.length)return `<div class="rcol"><h4>${CN[c]} <em>${A.length}판 · ${P(base)}</em></h4><p class="empty">3판 이상 둔 오프닝이 없어요.</p></div>`;
    const h=fams.map(([f,a],i)=>{const r=rec(a);
      const named=group(a.filter(g=>varOf(g).includes(":")),varOf),big=named.slice(0,8),keep=new Set(big.map(x=>x[0])),rest=a.filter(g=>!keep.has(varOf(g)));
      const vid=k=>"rx-"+k.replace(/[^\w가-힣]/g,"_");
      const vr=big.map(([v,b])=>{const r2=rec(b),nm=ko(v).split(":").slice(1).join(":").trim()||ko(v),k=c+"|"+v;
        return line(esc(nm),r2,Object.assign({attr:` data-var="${esc(k)}"`},flag(r2,base)))+`<div class="rx" id="${vid(k)}" hidden></div>`}).join("")
        +(rest.length?(OTHER[c+"|"+f+"|*"]=new Set(rest.map(g=>g.id)),line("기타",rec(rest),{attr:` data-var="${esc(c+"|"+f+"|*")}"`})+`<div class="rx" id="${vid(c+"|"+f+"|*")}" hidden></div>`):"");
      return `<details class="rfam"${i<4?" open":""}><summary>${line(`<b>${esc(ko(f))}</b>`,r,flag(r,base))}</summary><div class="rvars">${vr}</div></details>`}).join("");
    return `<div class="rcol"><h4>${CN[c]} <em>${A.length}판 · ${P(base)}</em></h4>${h}</div>`;
  };
  return `<section class="rsec"><h3 class="rh">오프닝</h3><div class="rcols">${col("w")}${col("b")}</div></section>`;
}
/* 오프닝 탭에서 쓰는 변화별 표 (한 색) */
window.OpenTree={
  html(list,c){LIST=LIST.length?LIST:list;const h=openSec(list.filter(g=>g.res!=="abort"&&g.my&&g.op));const m=new RegExp(`<div class="rcol"><h4>${CN[c]}[\\s\\S]*?(?=<div class="rcol"><h4>|</div></section>$)`).exec(h);return m?m[0]:""},
  bind(el,list){el.addEventListener("click",e=>{const b=e.target.closest("[data-var],[data-morevar]");if(!b||!el.contains(b))return;if(!LIST.length)LIST=list;treeClick(b)})}
};
function treeClick(b){
  if(b.dataset.var){const [c,...v]=b.dataset.var.split("|"),id="rx-"+b.dataset.var.replace(/[^\w가-힣]/g,"_"),x=document.getElementById(id);if(!x)return true;
    if(x.hidden){x.innerHTML=varPanel(c,v.join("|"));x.hidden=false;b.classList.add("on")}else{x.hidden=true;b.classList.remove("on")}return true}
  if(b.dataset.morevar){const [c,...v]=b.dataset.morevar.split("|"),G=pick(c,v.join("|"));b.previousElementSibling.innerHTML=G.map(gameRow).join("");b.remove();return true}
  if(b.dataset.gid){const g=LIST.find(x=>x.id===b.dataset.gid);if(g)window.openAnalysis(g);return true}
  return false;
}
/* 리포트 오프닝: 약한·강한 변화만 */
function openHi(L){
  const out=[];["w","b"].forEach(c=>{const A=L.filter(g=>g.me===c),base=rec(A).s;
    group(A,varOf).forEach(([v,a])=>{const r=rec(a);if(r.n<5)return;const d=r.s-base;if(Math.abs(d)>=.1)out.push({c,v,r,d,base})})});
  const lo=out.filter(x=>x.d<0).sort((a,b)=>a.d*a.r.n-b.d*b.r.n).slice(0,4),hi=out.filter(x=>x.d>0).sort((a,b)=>b.d*b.r.n-a.d*a.r.n).slice(0,3);
  const W=L.filter(g=>g.me==="w"),B=L.filter(g=>g.me==="b");
  AUTO.openSum=`백 ${P(rec(W).s)} · 흑 ${P(rec(B).s)}${lo.length?` · 약한 변화 ${lo.length}개`:""}`;AUTO.openLo=lo;
  const row=x=>{const k=x.c+"|"+x.v;return line(`<span class="rcol2">${CN[x.c]}</span>${esc(ko(x.v))}`,x.r,Object.assign({attr:` data-var="${esc(k)}"`},flag(x.r,x.base)))+`<div class="rx" id="rx-${esc(k).replace(/[^\w가-힣]/g,"_")}" hidden></div>`};
  return `<section class="rsec"><h3 class="rh">오프닝</h3>${lo.length?`<h4>평소보다 약한 변화</h4><div class="rvars">${lo.map(row).join("")}</div>`:""}${hi.length?`<h4>평소보다 강한 변화</h4><div class="rvars">${hi.map(row).join("")}</div>`:""}${!lo.length&&!hi.length?'<p class="empty">평소와 크게 다른 변화는 없어요.</p>':""}
    <div class="racts" style="margin-top:14px"><button class="ract" data-tab="open">변화별 전체 표</button></div></section>`;
}
function pick(c,v){const o=OTHER[c+"|"+v];return o?LIST.filter(g=>o.has(g.id)):LIST.filter(g=>g.me===c&&varOf(g)===v)}
/* 0. 변화 추이: 월별 승률·레이팅·정확도, 지난달 대비 */
function trendSec(L){
  const mk=g=>{const d=new Date(g.end*1000);return d.getFullYear()+"-"+pad(d.getMonth()+1)};
  const M=new Map();L.slice().sort((a,b)=>a.end-b.end).forEach(g=>{const k=mk(g);if(!M.has(k))M.set(k,[]);M.get(k).push(g)});
  const ms=[...M.keys()].sort();if(ms.length<2)return "";
  const tc=Object.keys(TC).map(k=>[k,L.filter(g=>g.tclass===k&&g.rated).length]).sort((a,b)=>b[1]-a[1])[0][0];
  const R=window.BatchAPI?BatchAPI.results(L):[],RA=new Map(R.map(x=>[x.g.id,x.r.acc]));
  const accOf=g=>g.acc&&g.acc.me!=null?g.acc.me:RA.has(g.id)?RA.get(g.id):null;
  const rows=ms.map(k=>{const G=M.get(k),r=rec(G),A=G.map(accOf).filter(v=>v!=null),T=G.filter(g=>g.tclass===tc&&g.rated);
    return {k,n:G.length,s:r.s,acc:A.length>=3?A.reduce((a,b)=>a+b,0)/A.length:null,an:A.length,rt:T.length?T[T.length-1].my.rating:null,bl:null}});
  const cur=rows[rows.length-1],prv=rows[rows.length-2];
  const dlt=(a,b,f,u)=>a==null||b==null?"":`<em class="${a-b>=0?"up":"dn"}">${a-b>=0?"+":""}${f(a-b)}${u||""}</em>`;
  const W=Math.max(300,Math.min(1200,($("#pRep")&&$("#pRep").clientWidth)||640)),H=150,pad2=28,x=i=>pad2+i*(W-pad2*2)/Math.max(1,rows.length-1);
  const rts=rows.map(r=>r.rt).filter(v=>v!=null),rmin=Math.min(...rts)-20,rmax=Math.max(...rts)+20,yr=v=>12+(H-40)*(1-(v-rmin)/Math.max(1,rmax-rmin));
  const ys=v=>12+(H-40)*(1-v);
  let lr="",ls="",la="",dots="";
  rows.forEach((r,i)=>{if(r.rt!=null){lr+=(lr?" L":"M")+x(i).toFixed(1)+","+yr(r.rt).toFixed(1);dots+=`<circle cx="${x(i)}" cy="${yr(r.rt)}" r="3" fill="#242942"/>`}
    ls+=(ls?" L":"M")+x(i).toFixed(1)+","+ys(r.s).toFixed(1);
    if(r.acc!=null)la+=(la?" L":"M")+x(i).toFixed(1)+","+ys(r.acc/100).toFixed(1)});
  const lab=rows.map((r,i)=>(rows.length<=12||i%2===0||i===rows.length-1)?`<text x="${x(i)}" y="${H-6}" text-anchor="middle">${r.k.slice(2).replace("-",".")}</text>`:"").join("");
  const svg=`<svg class="tsvg" viewBox="0 0 ${W} ${H}" role="img" aria-label="월별 추이">
    <line x1="${pad2}" x2="${W-pad2}" y1="${ys(.5)}" y2="${ys(.5)}" stroke="#C4C9DC" stroke-dasharray="3 3"/>
<text x="${pad2-4}" y="${ys(.5)+4}" text-anchor="end">50%</text>
    <path d="${ls}" fill="none" stroke="#5C54D6" stroke-width="2.5"/>${rows.map((r,i)=>`<circle cx="${x(i)}" cy="${ys(r.s)}" r="3" fill="#5C54D6"/>`).join("")}<text x="${x(rows.length-1)}" y="${ys(cur.s)-8}" text-anchor="middle" class="tv">${P(cur.s)}</text>${la?`<path d="${la}" fill="none" stroke="#6A80B4" stroke-width="2" stroke-dasharray="5 4"/>`:""}
    ${lab}</svg>
    <svg class="tsvg" viewBox="0 0 ${W} ${H}" role="img" aria-label="월별 레이팅"><path d="${lr}" fill="none" stroke="#242942" stroke-width="2.5"/>${dots}
    ${rows.map((r,i)=>r.rt!=null&&(i===0||i===rows.length-1||r.rt===Math.max(...rts)||r.rt===Math.min(...rts))?`<text x="${x(i)}" y="${yr(r.rt)-8}" text-anchor="middle" class="tv">${r.rt}</text>`:"").join("")}${lab}</svg>`;
  {const d=Math.round((cur.s-prv.s)*100);AUTO.trendSum=`이번 달 승률 ${P(cur.s)} (${d>=0?"+":""}${d}%p)${cur.rt!=null?` · ${TC[tc]} ${cur.rt}`:""}`}
  return `<section class="rsec"><h3 class="rh">변화 추이</h3>
    <div class="rnums"><div><b>${P(cur.s)}</b><small>이번 달 승률 ${dlt(cur.s*100,prv.s*100,v=>Math.round(v),"%p")}<br>${cur.n}판</small></div>
      <div><b>${cur.rt??"–"}</b><small>${window.tcIcon(tc)}${TC[tc]} 레이팅 ${dlt(cur.rt,prv.rt,v=>v)}</small></div>
      <div><b>${cur.acc!=null?cur.acc.toFixed(1):"–"}</b><small>이번 달 정확도 ${dlt(cur.acc,prv.acc,v=>v.toFixed(1))}<br>${cur.an}판 기준</small></div></div>
    <div class="tleg"><span><i style="background:#5C54D6"></i>승률</span><span><i class="dash"></i>정확도</span><span class="tcap">월별</span></div>${svg.split("</svg>")[0]}</svg>
    <div class="tleg"><span><i style="background:#242942"></i>${TC[tc]} 레이팅</span></div>${svg.split("</svg>")[1]}</svg>
    ${S.per===3?`<div class="racts"><button class="ract" data-per="12">1년으로 보기</button></div>`:""}</section>`;
}
/* 1-2. 오프닝 공부: 자주 두는 오프닝마다 정석에서 벗어나는 곳, 이어서 볼 정석, 약한 변화 */
const MC=new Map();let MQ=Promise.resolve();
function masters(path){const c=new Chess();for(const m of path)c.move(m);const fen=c.fen();if(MC.has(fen))return MC.get(fen);
  const p=MQ.then(()=>fetch("https://explorer.lichess.ovh/masters?fen="+encodeURIComponent(fen)+"&moves=6&topGames=0").then(r=>r.ok?r.json():null).catch(()=>null));
  MQ=p.then(()=>new Promise(r=>setTimeout(r,250)));MC.set(fen,p);return p}
const lineTxt=(a,from)=>a.map((x,i)=>i<from?null:(i%2===0?`${i/2+1}. `:i===from?`${(i-1)/2+1}... `:"")+x).filter(Boolean).join(" ");
function devPoint(G,c){const m=new Map();G.forEach(g=>{const o=g._o;if(!o||o.dev!==c||o.book>=o.san.length)return;const k=o.san.slice(0,o.book+1).join(" ");if(!m.has(k))m.set(k,[]);m.get(k).push(g)});
  const top=[...m.entries()].sort((a,b)=>b[1].length-a[1].length)[0];if(!top||top[1].length<3)return null;const s=top[0].split(" ");return {path:s.slice(0,-1),mv:s[s.length-1],G:top[1]}}
let STU=[];
function studySec(L){
  STU=[];
  ["w","b"].forEach(c=>{const A=L.filter(g=>g.me===c),base=rec(A).s;
    group(A,famOf).filter(([k,a])=>a.length>=5).slice(0,2).forEach(([f,G])=>{
      const ln=commonLine(G),dev=devPoint(G,c),weak=group(G,varOf).filter(([v,b])=>v.includes(":")&&b.length>=4&&rec(b).s<=base-.1);
      STU.push({c,f,G,ln,dev,weak,r:rec(G)})})});
  if(!STU.length)return "";
  return `<section class="rsec"><h3 class="rh">오프닝 공부</h3><div class="rcols">${STU.map((x,i)=>{
    const href=`opening.html?line=${encodeURIComponent(x.ln.join(","))}&drill=${x.c}`;
    return `<div class="stud"><div class="sth"><span class="rcol2">${CN[x.c]}</span><b>${esc(ko(x.f))}</b><em>${x.r.n}판 · ${P(x.r.s)}</em></div>
      ${x.ln.length?`<p class="rline">내 주 수순 <b>${esc(mv(x.ln))}</b></p>`:""}
      <div id="stdev${i}">${x.dev?`<p class="rline">불러오는 중…</p>`:""}</div>
      <h5>이어서 익힐 수순</h5><div id="stn${i}"><p class="rline">불러오는 중…</p></div>
      ${x.weak.length?`<h5>약한 변화</h5>${x.weak.map(([v,b])=>{const r=rec(b),l=commonLine(b);return `<div class="stl"><span class="stn">${esc(ko(v).split(":").slice(1).join(":").trim()||ko(v))} <em>${recTxt(r)} · ${P(r.s)}</em></span><a class="ract" href="opening.html?line=${encodeURIComponent(l.join(","))}&drill=${x.c}">연습</a></div>`}).join("")}`:""}
      <div class="racts"><a class="ract" href="${href}">내 수순 연습</a><a class="ract" href="opening.html?line=${encodeURIComponent(x.ln.join(","))}">오프닝 페이지</a></div></div>`}).join("")}</div></section>`;
}
async function fillStudy(t){
  for(let i=0;i<STU.length;i++){const x=STU[i];if(t!==RT)return;
    if(x.dev){const M=await masters(x.dev.path);if(t!==RT)return;const el=$("#stdev"+i);if(el){const r=rec(x.dev.G),tot=M&&M.moves?M.moves.reduce((s,m)=>s+m.white+m.draws+m.black,0):0,sh=m=>tot?(m.white+m.draws+m.black)/tot:0;
      const top=(M&&M.moves||[]).filter(m=>sh(m)>=.01).slice(0,3),mine=(M&&M.moves||[]).find(m=>m.san===x.dev.mv);
      if(tot<20||(mine&&sh(mine)>=.15)){el.innerHTML="";}else{
      const mvn=lineTxt(x.dev.path.concat(x.dev.mv),Math.max(0,x.dev.path.length-1));
      el.innerHTML=`<h5>자주 정석에서 벗어나는 곳</h5><p class="rline"><b>${esc(mvn)}</b> ${x.dev.G.length}판 · ${recTxt(r)}${top.length?` · 마스터는 ${top.map(m=>`<b>${esc(m.san)}</b> ${Math.round((m.white+m.draws+m.black)/tot*100)}%`).join(", ")}`:""}</p><div class="racts"><a class="ract" href="opening.html?line=${encodeURIComponent(x.dev.path.join(","))}">이 자리 보기</a>${top.length?`<a class="ract" href="opening.html?line=${encodeURIComponent(x.dev.path.concat(top[0].san).join(","))}&drill=${x.c}">${esc(top[0].san)}로 연습</a>`:""}</div>`}}}
    const M=await masters(x.ln);if(t!==RT)return;const el=$("#stn"+i);
    const tot=M&&M.moves?M.moves.reduce((s,m)=>s+m.white+m.draws+m.black,0):0;
    const opts=tot>=20?M.moves.filter(m=>(m.white+m.draws+m.black)/tot>=.1).slice(0,2):[];
    if(!opts.length){if(el)el.innerHTML='<p class="rline">마스터 게임 적음</p>';continue}
    const out=[];
    for(const m of opts){const p=x.ln.concat(m.san);
      for(let k=0;k<5;k++){const N=await masters(p);if(t!==RT)return;const nt=N&&N.moves?N.moves.reduce((s,q)=>s+q.white+q.draws+q.black,0):0;if(nt<20)break;p.push(N.moves[0].san)}
      const c=new Chess(),fens=[c.fen()];p.slice(0,x.ln.length+2).forEach(q=>{c.move(q);fens.push(c.fen())});const on=window.Openings?Openings.line(fens).name:"";
      out.push({p,sh:(m.white+m.draws+m.black)/tot,name:on});
      if(el)el.innerHTML=out.map(z=>`<div class="stl"><span class="stn">${esc(ko(z.name)||"마스터 주요 수순")} <em>마스터 ${Math.round(z.sh*100)}%</em><small>${esc(lineTxt(z.p,x.ln.length))}</small></span><a class="ract" href="opening.html?line=${encodeURIComponent(z.p.join(","))}&drill=${x.c}">연습</a></div>`).join("");
    }
  }
}
function varPanel(c,v){
  const G=pick(c,v),ln=commonLine(G);
  const href=`opening.html?line=${encodeURIComponent(ln.join(","))}&drill=${c}`;
  return `${ln.length?`<p class="rline">자주 가는 수순 <b>${esc(mv(ln))}</b></p>`:""}<div class="racts"><a class="ract" href="${href}">이 오프닝 연습</a><a class="ract" href="opening.html?line=${encodeURIComponent(ln.join(","))}">오프닝 페이지</a></div>
    <div class="rgames">${G.slice(0,10).map(gameRow).join("")}</div>${G.length>10?`<button class="more" data-morevar="${esc(c+"|"+v)}">${G.length-10}판 더 보기</button>`:""}`;
}
/* 2. 자꾸 두는 수 */
const ev=v=>v==null?"–":Math.abs(v)>=9000?(v>0?"메이트":"메이트 당함"):(v>0?"+":v<0?"−":"")+Math.abs(v/100).toFixed(1);
function lineHtml(path,m){const a=path.concat(m);return a.map((x,i)=>{const t=(i%2===0?`${i/2+1}. `:"")+x;return i===a.length-1?`<b>${esc(i%2===1&&i===a.length-1?`${(i-1)/2+1}... ${x}`:t)}</b>`:esc(t)}).join(" ").replace(/(\d+\. \S+) <b>(\d+)\.\.\. /,"$1 <b>")}
const fenAfter=a=>{const c=new Chess();for(const m of a)c.move(m);return c};
function lineBox(path,m){const a=path.concat(m),n=a.length,from=Math.max(0,n-3);
  const tok=(x,i)=>(i%2===0?`${i/2+1}. `:i===from?`${(i-1)/2+1}... `:"")+x;
  const sh=a.map((x,i)=>i<from?null:(i===n-1?`<b>${esc(tok(x,i))}</b>`:esc(tok(x,i)))).filter(Boolean).join(" ");
  return `<span class="short">${from?"… ":""}${sh}</span><span class="full">${lineHtml(path,m)}</span>`}
const pp=v=>`승률 −${Math.max(0,Math.round(v))}%p`;
const wpc=cp=>cp==null?50:Math.abs(cp)>=9000?(cp>0?100:0):50+50*(2/(1+Math.exp(-0.00368208*cp))-1);
function scanBody(){
  const S2=AUTO.scan;
  if(!S2)return `<p class="rprog">${esc(AUTO.txt||"곧 시작해요")}</p>`;
  const f=S2.found;
  const items=f.map((x,i)=>{const at=x.path.length,c=fenAfter(x.path),mv=c.move(x.mv),mvs=window.oNum?oNum(at,x.mv):x.mv;
    return `<div class="ritem" data-sq="${i}">${miniBoard(c.fen(),x.color,mv?[mv.from,mv.to]:null)}<div class="rt1"><span class="rcol2">${CN[x.color]}</span>${x.name?esc(ko(x.name).split(",")[0]):""} <em>${x.n}번 둠 · ${recTxt(x.rec)}</em></div>
      <div class="rt2"><b class="bad">${esc(mvs)}</b> · ${pp(wpc(x.bestEv)-wpc(x.after))} · 최선 <b class="gd">${esc(x.best)}</b></div><div class="rt3" data-full>${lineBox(x.path,x.mv)}</div>
      <span class="rgo">연습<button class="lnk sub" data-badg="${i}">게임 ${x.n}판</button></span></div><div class="rgames" id="rbg${i}" hidden></div>`}).join("");
  return (S2.done?"":`<p class="rprog">${esc(AUTO.txt)}</p>`)+(items||(S2.done?'<p class="empty">없음</p>':""));
}
/* 3. 시간 */
function timeSec(L){
  const rows=Object.keys(TC).map(k=>{const a=L.filter(g=>g.tclass===k);return a.length?line(window.tcIcon(k)+TC[k],rec(a)):""}).join("");
  const live=L.filter(g=>g.tclass!=="daily"),lost=live.filter(g=>g.res==="loss"),tl=lost.filter(g=>g.how==="시간"),won=live.filter(g=>g.res==="win"),tw=won.filter(g=>g.how==="시간");
  const sh=lost.filter(g=>g._o&&g._o.len<=25);
  AUTO.timeSum=`시간패 ${lost.length?P(tl.length/lost.length):"–"} · 25수 안에 진 판 ${lost.length?P(sh.length/lost.length):"–"}`;AUTO.timeK={tl:tl.length,lost:lost.length,sh:sh.length};
  return `<section class="rsec"><h3 class="rh">시간</h3>${rows}
    <div class="rnums"><div><b>${lost.length?P(tl.length/lost.length):"–"}</b><small>진 판 중 시간패<br>${tl.length}/${lost.length}판</small></div><div><b>${won.length?P(tw.length/won.length):"–"}</b><small>이긴 판 중 시간승<br>${tw.length}/${won.length}판</small></div><div><b>${lost.length?P(sh.length/lost.length):"–"}</b><small>25수 안에 진 판<br>${sh.length}/${lost.length}판</small></div><div id="rPress"><b>–</b><small>시간에 쫓길 때 실수<br>엔진 진단 후</small></div></div></section>`;
}
/* 4. 상대·흐름 */
function oppSec(L){
  const d=g=>g.op.rating-g.my.rating,base=rec(L).s;
  const up=rec(L.filter(g=>d(g)>=50)),eq=rec(L.filter(g=>Math.abs(d(g))<50)),dn=rec(L.filter(g=>d(g)<=-50));
  const A=L.slice().sort((a,b)=>a.end-b.end),aw=[],al=[];
  for(let i=1;i<A.length;i++){const p=A[i-1],g=A[i];if(g.tclass!==p.tclass||g.tclass==="daily"||g.end-p.end>1800)continue;if(p.res==="win")aw.push(g);else if(p.res==="loss")al.push(g)}
  const hrs=[["새벽 0~6시",0,6],["오전 6~12시",6,12],["오후 12~18시",12,18],["저녁 18~24시",18,24]];
  const op=x=>Object.assign({},flag(x,base));
  AUTO.oppSum=`높은 상대 ${up.n?P(up.s):"–"} · 낮은 상대 ${dn.n?P(dn.s):"–"}`;AUTO.oppK={al:rec(al),base,up};
  return `<section class="rsec"><h3 class="rh">상대와 흐름</h3>
    <h4>상대 레이팅</h4>${up.n?line("나보다 50 이상 높음",up,op(up)):""}${eq.n?line("비슷함",eq,op(eq)):""}${dn.n?line("나보다 50 이상 낮음",dn,op(dn)):""}
    <h4>시간대</h4>${hrs.map(([l,a,b])=>{const r=rec(L.filter(g=>{const x=new Date(g.end*1000).getHours();return x>=a&&x<b}));return r.n?line(l,r,op(r)):""}).join("")}</section>`;
}
function mentEng(){const L=LIST;
  const R=window.BatchAPI?BatchAPI.results(L.slice(0,AUTO.n||ENGN)).filter(x=>x.r.v):[],prevRes=new Map();
  L.slice().sort((a,b)=>a.end-b.end).forEach((g,i,A)=>{const p=A[i-1];if(p&&(g.start||g.end)-p.end<=1800)prevRes.set(g.id,p.res)});
  const blz=a=>a.length?a.reduce((s,x)=>s+(x.r.cnt.blunder||0),0)/a.length:null;
  const bl=blz(R.filter(x=>prevRes.get(x.g.id)==="loss")),bw=blz(R.filter(x=>prevRes.get(x.g.id)==="win")),nl=R.filter(x=>prevRes.get(x.g.id)==="loss").length;
  return bl!=null&&bw!=null&&nl>=3?`<h4>진 다음 판 블런더 <em class="hsub">엔진 분석한 판</em></h4><div class="rnums"><div><b>${bl.toFixed(1)}</b><small>진 다음 판<br>판당 블런더</small></div><div><b>${bw.toFixed(1)}</b><small>이긴 다음 판<br>판당 블런더</small></div></div>`:"";}
/* 4-2. 멘탈: 연패 뒤, 바로 다시 둔 판, 오래 둔 날, 무너진 날 */
function sessions(L){const A=L.filter(g=>g.tclass!=="daily").slice().sort((a,b)=>a.end-b.end),S=[];let cur=[];
  A.forEach(g=>{const p=cur[cur.length-1],gap=p?((g.start||g.end-600)-p.end):1e9;if(p&&gap<=1800)cur.push(g);else{if(cur.length)S.push(cur);cur=[g]}});if(cur.length)S.push(cur);return S}
function mentalSec(L){
  const S=sessions(L),base=rec(L.filter(g=>g.tclass!=="daily")).s,after={0:[],1:[],2:[],3:[]},fast=[],slow=[],idx={a:[],b:[],c:[]};
  S.forEach(ss=>{let st=0;ss.forEach((g,i)=>{
    if(i>0){after[Math.min(st,3)].push(g);const p=ss[i-1];if(p.res==="loss"){const gap=(g.start||g.end)-p.end;(g.start&&gap<=60?fast:slow).push(g)}}
    (i<5?idx.a:i<10?idx.b:idx.c).push(g);
    st=g.res==="loss"?st+1:0})});
  const bad=S.map(ss=>{let run=0,mx=0;ss.forEach(g=>{run=g.res==="loss"?run+1:0;mx=Math.max(mx,run)});const r0=ss[0].my.rating,r1=ss[ss.length-1].my.rating,d=(+r1||0)-(+r0||0);return {ss,mx,d,n:ss.length}}).filter(x=>x.mx>=3).sort((a,b)=>a.d-b.d).slice(0,3);
  let stop=null;for(const k of [1,2,3]){const r=rec(after[k]);if(r.n>=8&&r.s<=base-.08){stop={k,r};break}}
  AUTO.ment={stop,base,fast:rec(fast),slow:rec(slow)};
  AUTO.mentSum=stop?`${stop.k}연패 뒤 승률 ${P(stop.r.s)}`:`연패 뒤 승률 ${after[1].length?P(rec(after[1]).s):"–"}`;
  const row=(l,a)=>{const r=rec(a);return r.n?line(l,r,flag(r,base)):""};
  return `<section class="rsec"><h3 class="rh">멘탈</h3>
    ${stop?`<div class="stopc"><b>${stop.k}연패면 쉬기</b><span>${stop.k}연패 뒤 승률 ${P(stop.r.s)} · 평소 ${P(base)} · ${stop.r.n}판</span></div>`:""}
    <h4>연패 뒤 다음 판</h4>${row("이긴 다음",after[0])}${row("1연패 뒤",after[1])}${row("2연패 뒤",after[2])}${row("3연패 이상 뒤",after[3])}
    ${fast.length+slow.length?`<h4>진 다음 다시 시작까지</h4>${row("1분 안에 바로",fast)}${row("1분 넘게 쉬고",slow)}`:""}
    <h4>한 번에 몇 판째</h4>${row("1~5판째",idx.a)}${row("6~10판째",idx.b)}${row("11판째부터",idx.c)}
    <div id="rMentB">${mentEng()}</div>
    ${bad.length?`<h4>무너진 날</h4>${bad.map(x=>{const d=new Date(x.ss[0].end*1000),r=rec(x.ss);return `<div class="tday"><b>${d.getMonth()+1}.${d.getDate()}</b><span>${x.n}판 · ${recTxt(r)} · 최대 ${x.mx}연패</span><em class="${x.d>=0?"up":"dn"}">${x.d>=0?"+":""}${x.d}</em></div>`}).join("")}`:""}
  </section>`;
}
/* 5. 엔진 진단 */
function engBody(){
  const L=LIST;if(!window.BatchAPI)return "";
  const n=Math.min(AUTO.n||ENGN,L.length),T=L.slice(0,n),R=BatchAPI.results(T);
  const prog=R.length<T.length?`<p class="rprog">${esc(AUTO.etxt||(AUTO.scan&&AUTO.scan.done?"곧 시작해요":"자꾸 두는 수 점검이 끝나면 시작해요"))}</p>`:"";
  if(!R.length)return prog+`<p class="empty">분석 중</p>`;
  const mean=a=>{a=a.filter(x=>x!=null);return a.length?a.reduce((x,y)=>x+y,0)/a.length:null};
  const f1=v=>v==null?"–":v.toFixed(1);
  const wph=k=>{let s=0,c=0;R.forEach(x=>{const [v,m]=x.r.ph[k];if(v!=null){s+=v*m;c+=m}});return c?s/c:null};
  const per=k=>R.reduce((s,x)=>s+(x.r.cnt[k]||0),0)/R.length;
  const bar=(l,v)=>`<div class="hb"><span>${l}</span><span class="t"><i style="width:${v==null?0:v}%;background:var(--acc)"></i></span><span>${f1(v)}</span></div>`;
  const pz=R.flatMap(x=>x.r.pz||[]);
  const worst=R.flatMap(x=>x.r.worst.map(w=>({g:x.g,w}))).sort((a,b)=>b.w.loss-a.w.loss).slice(0,5);AUTO.worst=worst;AUTO.pz=pz;
  AUTO.engSum=`정확도 ${f1(mean(R.map(x=>x.r.acc)))} · 판당 블런더 ${per("blunder").toFixed(1)}`;
  return prog+`<p class="rline">최근 ${R.length}판 기준</p><div class="kpis">${KPI.acc(mean(R.map(x=>x.r.acc)),mean(R.map(x=>x.r.opAcc)))}${KPI.err({blunder:per("blunder"),mistake:per("mistake"),inaccuracy:per("inaccuracy"),miss:per("miss")})}</div>
    ${blownHtml(R)}
    ${weakHtml(R,wph,per)}
    <div class="racts" style="margin-top:18px"><button class="ract" data-tab="acc">국면별 정확도 · 큰 실수</button>${pz.length?`<button class="ract" data-save="1">내 실수 ${pz.length}개 퍼즐로</button>`:""}${n<50&&L.length>n?`<button class="ract" data-more="50">50판으로 늘리기</button>`:""}${n<100&&n>=50&&L.length>n?`<button class="ract" data-more="100">100판으로 늘리기</button>`:""}</div>`;
}
/* 약점 퍼즐 테마: 엔진 진단 결과에서 고름 (퍼즐 페이지 약점 모드가 씀) */
const THK={opening:"오프닝",middlegame:"미들게임",endgame:"엔드게임",advantage:"우위 잡기",crushing:"결정타",hangingPiece:"공짜 기물",defensiveMove:"방어",kingsideAttack:"킹사이드 공격",fork:"포크"};
function weakHtml(R,wph,per){
  if(R.length<5)return "";
  const T=[],add=t=>{if(!T.includes(t))T.push(t)};
  const ph=[["opening",wph("o")],["middlegame",wph("m")],["endgame",wph("e")]].filter(x=>x[1]!=null).sort((a,b)=>a[1]-b[1]);
  if(ph.length)add(ph[0][0]);
  if(per("blunder")>=.8){add("hangingPiece");add("defensiveMove")}
  if(per("miss")>=.5){add("advantage");add("fork")}
  const V=R.filter(x=>x.r.v),hi=V.filter(x=>x.r.high),hw=hi.filter(x=>x.g.res==="win");if(hi.length>=3&&hw.length/hi.length<.7)add("crushing");
  const lo=V.filter(x=>x.r.low),ls=lo.filter(x=>x.r.saved);if(lo.length>=3&&ls.length/lo.length<.2)add("defensiveMove");
  const sh=LIST.filter(g=>g.res==="loss"&&g._o&&g._o.len<=25).length/Math.max(1,LIST.filter(g=>g.res==="loss").length);if(sh>=.35)add("kingsideAttack");
  const W=T.slice(0,4).map(t=>({t}));try{localStorage.setItem("hansu-weak",JSON.stringify(W))}catch(e){}
  return `<h4>약점 퍼즐</h4><div class="racts">${W.map(x=>`<span class="rtag">${THK[x.t]||x.t}</span>`).join("")}<a class="ract" href="puzzle.html#weak">풀기</a></div>`;
}
/* 오프닝 실수: 분석한 판의 오프닝 구간 정확도와 흔들린 수 → 오프닝 페이지에서 정답 찾기 연습 */
function omBody(){
  if(!window.BatchAPI)return "";
  const n=Math.min(AUTO.n||ENGN,LIST.length),R=BatchAPI.results(LIST.slice(0,n)).filter(x=>(x.r.v||0)>=3);
  if(!R.length)return `<p class="rprog">${esc(AUTO.etxt||"엔진 진단 후에 나와요")}</p>`;
  const all=[];let s0=0,c0=0;R.forEach(x=>{const [v,m]=x.r.ph.o;if(v!=null){s0+=v*m;c0+=m}});const base=c0?s0/c0:null;
  const fam=group(R.map(x=>x),x=>famOf(x.g)).map(([f,a])=>{let s=0,c=0;a.forEach(x=>{const [v,m]=x.r.ph.o;if(v!=null){s+=v*m;c+=m}});return {f,n:a.length,acc:c?s/c:null}}).filter(x=>x.acc!=null).sort((a,b)=>a.acc-b.acc);
  const M=new Map();R.forEach(x=>(x.r.om||[]).forEach(o=>{const k=x.g.me+"|"+o.path.join(" ")+"|"+o.san;const e=M.get(k)||{c:x.g.me,o,n:0,loss:0,gs:[]};e.n++;e.loss=Math.max(e.loss,o.loss);e.gs.push({g:x.g,k:o.k});M.set(k,e)}));
  const L=[...M.values()].filter(e=>e.o.loss>=5||e.o.c!=="inaccuracy").sort((a,b)=>b.n-a.n||b.loss-a.loss).slice(0,8);AUTO.om=L;
  const nm=e=>{const g=e.gs[0].g;return g._o&&g._o.name?ko(varOf(g)):""};
  const bar=v=>`<span class="t"><i style="width:${v}%;background:var(--acc)"></i></span>`;
  return `${base!=null?`<p class="rline">분석한 ${R.length}판의 오프닝 정확도 <b>${base.toFixed(1)}</b></p>`:""}
    ${fam.slice(0,6).map(x=>`<div class="hb"><span>${esc(ko(x.f))} <em>${x.n}판</em></span>${bar(x.acc)}<span${base!=null&&x.acc<base-5?' class="lo"':""}>${x.acc.toFixed(1)}</span></div>`).join("")}
    <h4>흔들린 수 ${L.length?`<em>${L.length}개</em>`:""}</h4>
    ${L.length?L.map((e,i)=>{const c=fenAfter(e.o.path),mv=c.move(e.o.san);return `<div class="ritem" data-oq="${i}">${miniBoard(c.fen(),e.c,mv?[mv.from,mv.to]:null)}<div class="rt1"><span class="rcol2">${CN[e.c]}</span>${esc(nm(e))}${e.n>1?` <em>${e.n}번</em>`:""}</div>
      <div class="rt2"><b class="bad">${esc(window.oNum?oNum(e.o.k,e.o.san):e.o.san)}</b> · ${pp(e.loss)} · 최선 <b class="gd">${esc(e.o.best)}</b></div><div class="rt3" data-full>${lineBox(e.o.path,e.o.san)}</div>
      <span class="rgo">연습<button class="lnk sub" data-og="${i}">게임</button></span></div>`}).join("")
      +`<div class="racts" style="margin-top:12px"><button class="ract pri3" data-oq="all">전부 연습</button></div>`:'<p class="empty">없음</p>'}`;
}
function blownHtml(R){
  const V=R.filter(x=>x.r.v),hi=V.filter(x=>x.r.high),hw=hi.filter(x=>x.g.res==="win"),lo=V.filter(x=>x.r.low),ls=lo.filter(x=>x.r.saved);
  const B=V.filter(x=>x.r.blown).sort((a,b)=>b.g.end-a.g.end);AUTO.blown=B;
  if(!V.length)return "";
  return `<div class="rnums"><div><b>${hi.length?P(hw.length/hi.length):"–"}</b><small>유리했던 판 마무리<br>${hw.length}/${hi.length}판</small></div><div><b>${lo.length?P(ls.length/lo.length):"–"}</b><small>불리했던 판 버팀<br>${ls.length}/${lo.length}판</small></div></div>
    <h4>이길 판 놓친 판 ${B.length?`<em>${B.length}판</em>`:""}</h4>${B.length?B.slice(0,6).map((x,i)=>{const b=x.r.blown,no=Math.floor(b.k/2)+1;
      const href=`play.html?fen=${encodeURIComponent(b.fen)}&me=${x.g.me}&lvl=8&t=${encodeURIComponent("다시 이겨 보기 · 엔진 레벨 9")}`;
      return `<div class="ritem" data-href="${href}">${miniBoard(b.fen,x.g.me)}<div class="rt1"><span class="res ${x.g.res}" style="display:inline-grid;width:22px;height:22px;font-size:12px;margin-right:6px">${RL[x.g.res]||"–"}</span>vs ${esc(x.g.op.name)}</div><div class="rt2">승률 <b>${b.w}%</b> 자리에서 <b class="bad">${no}${b.k%2?"...":"."} ${esc(b.san)}</b></div><div class="rt3"></div><span class="rgo">다시 두기<button class="lnk sub" data-bw="${i}">게임</button></span></div>`}).join(""):'<p class="empty">분석한 판 중엔 없어요.</p>'}`;
}
function pressTxt(){
  const el=$("#rPress");if(!el||!window.BatchAPI)return;const R=BatchAPI.results(LIST.slice(0,AUTO.n||ENGN));
  let pn=0,nn=0,pb=0,nb=0;R.forEach(x=>{pn+=x.r.pr.p[1];nn+=x.r.pr.n[1];pb+=x.r.pr.pb;nb+=x.r.pr.nb});
  if(pn>=10&&nn>=10)el.innerHTML=`<b>${P(pb/pn)}</b><small>시간에 쫓길 때 실수<br>여유 있을 때 ${P(nb/nn)}</small>`;
}
/* 진행 글자만 바뀔 때는 버튼을 다시 그리지 않음 (누르는 중에 사라지지 않게) */
const LAST={};
function put(el,html,key){if(!el)return;const sig=html.replace(/<p class="rprog">[^<]*<\/p>/g,"");
  if(LAST[key]===sig&&el.isConnected&&el.dataset.k===key){const ps=el.querySelectorAll(".rprog"),nw=[...html.matchAll(/<p class="rprog">([^<]*)<\/p>/g)].map(m=>m[1]);if(ps.length===nw.length){ps.forEach((p,i)=>p.innerHTML=nw[i]);return}}
  LAST[key]=sig;el.dataset.k=key;el.innerHTML=html}
function upd(){put($("#rScan"),scanBody(),"scan");put($("#rEngB"),engBody(),"eng");put($("#rOm"),omBody(),"om");put($("#rTodo"),todo(),"todo");put($("#rMentB"),mentEng(),"ment");pressTxt();
  Object.keys(SUM).forEach(k=>{const e=$("#sum-"+k);if(e)e.textContent=SUM[k]()});
  const pb=$("#rProg");if(pb){const t=AUTO.etxt||AUTO.txt||"";pb.hidden=!t;pb.querySelector("span").textContent=t;pb.querySelector("i").style.width=Math.round((AUTO.frac||0)*100)+"%"}}
/* 자동 엔진: 자꾸 두는 수 → 최근 판 분석 */
async function auto(L,tok){
  const sig=S.user+"|"+L.length+"|"+(L[0]&&L[0].id);
  if(AUTO.sig!==sig){AUTO.sig=sig;AUTO.scan=null;AUTO.n=ENGN;
    try{const c=JSON.parse(localStorage.getItem("hansu-scan2-"+(S.site==="li"?"li:":"")+S.user)||"null");if(c&&c.sig===sig)AUTO.scan={found:c.found,done:true}}catch(e){}}
  const alive=()=>tok===AUTO.tok;AUTO.active=true;try{await run()}finally{if(tok===AUTO.tok)AUTO.active=false}
  async function run(){
  if(!AUTO.scan||!AUTO.scan.done){
    const all=[];AUTO.scan={found:[],done:false};
    for(const c of ["w","b"]){
      const f=await window.RepeatScan(L,c,(j,n,fd)=>{if(!alive())return;AUTO.txt=`자꾸 두는 수 점검 ${CN[c]} ${j+1}/${n}`;AUTO.frac=(c==="w"?0:.5)*.15+(j+1)/n*.075;AUTO.scan.found=all.concat(fd);upd()},alive);
      if(!alive()||!f)return;all.push(...f);
    }
    AUTO.scan={found:all.sort((x,y)=>y.loss*y.n-x.loss*x.n).slice(0,12),done:true};AUTO.txt="";
    try{localStorage.setItem("hansu-scan2-"+(S.site==="li"?"li:":"")+S.user,JSON.stringify({sig,found:AUTO.scan.found}))}catch(e){}
    upd();
  }
  if(!alive())return;
  await BatchAPI.ensure(L.slice(0,AUTO.n),(i,n,a,b)=>{if(!alive())return;AUTO.etxt=`엔진 분석 ${i+1}/${n}판`;AUTO.frac=.15+.85*(i+(b?a/b:0))/Math.max(1,n);upd()});
  if(!alive())return;AUTO.etxt="";upd();
  }
}
function startAuto(L){
  const sig=S.user+"|"+L.length+"|"+(L[0]&&L[0].id);if(AUTO.active&&AUTO.sig===sig)return;
  const tok=++AUTO.tok;if(window.BatchAPI)BatchAPI.stop();
  AUTO.p=AUTO.p.then(()=>tok===AUTO.tok?auto(L,tok):null).catch(()=>{});
}
window.renderReport=async function(list){
  const t=++RT,el=$("#pRep"),L=list.filter(g=>g.res!=="abort"&&g.my&&g.op);
  if(L.length<5){el.innerHTML='<p class="empty">게임이 5판 이상 있어야 해요. 위에서 기간을 늘려 보세요.</p>';return}
  el.innerHTML='<p class="empty" id="rSt">정리 중…</p>';
  if(window.Openings&&window.prepOpening){await Openings.load();let t0=performance.now();
    for(let i=0;i<L.length;i++){window.prepOpening(L[i]);if(performance.now()-t0>40){const s=$("#rSt");if(s)s.textContent=`정리 중 ${i+1}/${L.length}`;await new Promise(r=>{const c=new MessageChannel();c.port1.onmessage=()=>r();c.port2.postMessage(0)});t0=performance.now();if(t!==RT)return}}}
  if(t!==RT)return;
  LIST=L;draw(L);startAuto(L);
};
/* 섹션: 접히는 칸 + 한 줄 요약 */
function wrap(html,id){const m=/^\s*<section class="rsec"><h3 class="rh">([\s\S]*?)<\/h3>([\s\S]*)<\/section>\s*$/.exec(html);if(!m)return "";
  return `<details class="rsec" id="s-${id}"${OPEN.has(id)?" open":""}><summary><h3 class="rh">${m[1]}</h3><span class="rsum" id="sum-${id}">${esc(SUM[id]?SUM[id]():"")}</span></summary><div class="rbody">${m[2]}</div></details>`}
const OPEN=new Set(["trend","open","study","ment","time","opp","eng"]);
const SUM={trend:()=>AUTO.trendSum||"",open:()=>AUTO.openSum||"",study:()=>{const a=AUTO.scan&&AUTO.scan.done?AUTO.scan.found.length:null,b=AUTO.om?AUTO.om.length:null;return a==null&&b==null?"분석 중":`자꾸 두는 수 ${a??"–"} · 흔들린 수 ${b??"–"}`},
  ment:()=>AUTO.mentSum||"",time:()=>AUTO.timeSum||"",opp:()=>AUTO.oppSum||"",eng:()=>AUTO.engSum||"분석 중"};
/* 지금 고칠 것: 가장 큰 약점 3개 */
function todo(){
  const C=[];
  if(AUTO.scan&&AUTO.scan.found.length){const x=AUTO.scan.found[0];C.push({s:Math.min(1,x.loss/300)*.6+Math.min(1,x.n/6)*.4,t:`${x.name?ko(x.name).split(":")[0]+" ":""}${window.oNum?oNum(x.path.length,x.mv):x.mv}`,d:`${x.n}번 둠 · ${recTxt(x.rec)} · ${x.best}가 최선`,id:"study"})}
  (AUTO.openLo||[]).slice(0,1).forEach(x=>C.push({s:Math.min(1,-x.d*3)*.8+Math.min(1,x.r.n/20)*.2,t:`${CN[x.c]} ${ko(x.v)}`,d:`승률 ${P(x.r.s)} · 평소 ${P(x.base)} · ${x.r.n}판`,id:"open"}));
  const R=window.BatchAPI?BatchAPI.results(LIST.slice(0,AUTO.n||ENGN)).filter(x=>x.r.v):[];
  if(R.length>=5){const hi=R.filter(x=>x.r.high),hw=hi.filter(x=>x.g.res==="win");if(hi.length>=3&&hw.length/hi.length<.75)C.push({s:(1-hw.length/hi.length)*1.2,t:"유리한 판 마무리",d:`${hw.length}/${hi.length}판만 이김`,id:"eng"});
    const ph=["o","m","e"].map(k=>{let s=0,c=0;R.forEach(x=>{const [v,m]=x.r.ph[k];if(v!=null){s+=v*m;c+=m}});return [k,c?s/c:null]}).filter(x=>x[1]!=null).sort((a,b)=>a[1]-b[1]);
    if(ph.length>=2&&ph[1][1]-ph[0][1]>=5)C.push({s:(ph[1][1]-ph[0][1])/20,t:`${{o:"오프닝",m:"미들게임",e:"엔드게임"}[ph[0][0]]} 정확도`,d:`${ph[0][1].toFixed(1)} · 다른 구간보다 ${(ph[1][1]-ph[0][1]).toFixed(1)} 낮음`,id:"eng"})}
  const T=AUTO.timeK;if(T&&T.lost>=10&&T.tl/T.lost>=.25)C.push({s:T.tl/T.lost,t:"시간패",d:`진 판 중 ${P(T.tl/T.lost)}`,id:"time"});
  const M=AUTO.ment;if(M&&M.stop)C.push({s:(M.base-M.stop.r.s)*4,t:`${M.stop.k}연패면 쉬기`,d:`${M.stop.k}연패 뒤 승률 ${P(M.stop.r.s)} · 평소 ${P(M.base)}`,id:"ment"});
  if(M&&M.fast.n>=8&&M.fast.s<=M.slow.s-.08)C.push({s:(M.slow.s-M.fast.s)*3,t:"지고 바로 다시 두기",d:`1분 안에 다시 둔 판 승률 ${P(M.fast.s)} · 쉬고 둔 판 ${P(M.slow.s)}`,id:"ment"});
  const top=C.sort((a,b)=>b.s-a.s).slice(0,3);
  return top.length?top.map((x,i)=>`<a class="todo" href="#s-${x.id}" data-go="${x.id}"><i>${i+1}</i><b>${esc(x.t)}</b><small>${esc(x.d)}</small></a>`).join(""):'<p class="empty">큰 약점이 안 보여요.</p>';
}
function draw(L){
  const el=$("#pRep"),R=rec(L),p=S.profile||{};
  const rt=Object.keys(TC).map(k=>{const a=L.filter(g=>g.tclass===k&&g.rated).sort((x,y)=>x.end-y.end);if(a.length<5)return "";const d=a[a.length-1].my.rating-a[0].my.rating;return `<span>${window.tcIcon(k)}${a[a.length-1].my.rating} <em class="${d>=0?"up":"dn"}">${d>=0?"+":""}${d}</em></span>`}).join("");
  const trend=trendSec(L),open=openHi(L),stu=studySec(L),time=timeSec(L),opp=oppSec(L),ment=mentalSec(L);
  const stuBody=(/^\s*<section class="rsec"><h3 class="rh">[^<]*<\/h3>([\s\S]*)<\/section>\s*$/.exec(stu)||[,""])[1];
  const study=`<section class="rsec"><h3 class="rh">오프닝 연습</h3>${stuBody}<h4 class="h4b">흔들린 수</h4><div id="rOm">${omBody()}</div><h4 class="h4b">자꾸 두는 안 좋은 수</h4><div id="rScan">${scanBody()}</div></section>`;
  const eng=`<section class="rsec"><h3 class="rh">엔진 진단</h3><div id="rEngB">${engBody()}</div></section>`;
  el.innerHTML=`<div class="rhead"><div><b>${esc(p.username||S.user)}</b><small>${L.length}판 · ${recTxt(R)} · 승률 ${P(R.s)}</small></div><div class="rrt">${rt}</div><button class="ract" id="rShare">링크 복사</button></div>
    <div class="rprogbar" id="rProg" hidden><span></span><i></i></div>
    <h3 class="rh todo-h">지금 고칠 것</h3><div class="todos" id="rTodo">${todo()}</div>
    <nav class="rnav"><a href="#s-trend" data-go="trend">추이</a><a href="#s-open" data-go="open">오프닝</a><a href="#s-study" data-go="study">오프닝 연습</a><a href="#s-ment" data-go="ment">멘탈</a><a href="#s-time" data-go="time">시간</a><a href="#s-opp" data-go="opp">상대</a><a href="#s-eng" data-go="eng">엔진</a><button class="lnk" id="rAll">${OPEN.size>=7?"모두 접기":"모두 펼치기"}</button></nav>
    ${wrap(trend,"trend")}${wrap(open,"open")}${wrap(study,"study")}${wrap(ment,"ment")}${wrap(time,"time")}${wrap(opp,"opp")}${wrap(eng,"eng")}`;
  el.querySelectorAll("details.rsec").forEach(d=>d.addEventListener("toggle",()=>{const id=d.id.slice(2);d.open?OPEN.add(id):OPEN.delete(id)}));
  pressTxt();fillStudy(RT);
  el.onclick=async e=>{
    const ft=e.target.closest("[data-full]");if(ft&&!e.target.closest("button")){ft.closest(".ritem").classList.toggle("open");return}
    const sub=e.target.closest(".ritem .lnk");
    const it=!sub&&e.target.closest(".ritem");if(it){if(it.dataset.href){location.href=it.dataset.href;return}
      if(it.dataset.sq!=null){const x=AUTO.scan.found[+it.dataset.sq];try{localStorage.setItem("hansu-oquiz",JSON.stringify([{c:x.color,path:x.path,best:x.best,san:x.mv,name:x.name||""}]))}catch(_){}location.href="opening.html?oquiz=1";return}}
    const go=e.target.closest("[data-go]");if(go){e.preventDefault();const d=document.getElementById("s-"+go.dataset.go);if(d){d.open=true;OPEN.add(go.dataset.go);d.scrollIntoView({behavior:"smooth",block:"start"})}return}
    if(e.target.id==="rAll"){const all=[...el.querySelectorAll("details.rsec")],op=!all.every(d=>d.open);all.forEach(d=>d.open=op);e.target.textContent=op?"모두 접기":"모두 펼치기";return}
    const tb=e.target.closest("[data-tab]");if(tb&&el.contains(tb)){window.showTab&&window.showTab(tb.dataset.tab);document.getElementById("main")?.scrollIntoView({behavior:"smooth"});return}
    const b=e.target.closest("[data-oq],[data-og],[data-per],[data-var],[data-morevar],[data-gid],[data-badg],[data-bw],[data-w],[data-save],[data-more],#rShare");if(!b)return;
    if(b.dataset.oq){const L=b.dataset.oq==="all"?AUTO.om:[AUTO.om[+b.dataset.oq]];
      try{localStorage.setItem("hansu-oquiz",JSON.stringify(L.map(e=>({c:e.c,path:e.o.path,best:e.o.best,san:e.o.san,name:(e.gs[0].g._o&&e.gs[0].g._o.name)||""}))))}catch(_){}location.href="opening.html?oquiz=1";return}
    if(b.dataset.og){const e=AUTO.om[+b.dataset.og];if(e)window.openAnalysis(e.gs[0].g,e.gs[0].k+1);return}
    if(b.dataset.per){const c=document.querySelector(`#fPer [data-v="${b.dataset.per}"]`);if(c)c.click();return}
    if(b.dataset.var){const [c,...v]=b.dataset.var.split("|"),id="rx-"+b.dataset.var.replace(/[^\w가-힣]/g,"_"),x=document.getElementById(id);if(!x)return;
      if(x.hidden){x.innerHTML=varPanel(c,v.join("|"));x.hidden=false;b.classList.add("on")}else{x.hidden=true;b.classList.remove("on")}return}
    if(b.dataset.morevar){const [c,...v]=b.dataset.morevar.split("|"),G=pick(c,v.join("|"));b.previousElementSibling.innerHTML=G.map(gameRow).join("");b.remove();return}
    if(b.dataset.gid){const g=LIST.find(x=>x.id===b.dataset.gid);if(g)window.openAnalysis(g);return}
    if(b.dataset.badg!=null){const x=AUTO.scan.found[+b.dataset.badg],box=$("#rbg"+b.dataset.badg);if(!box)return;
      if(box.hidden){const ids=new Set(x.ids);box.innerHTML=LIST.filter(g=>ids.has(g.id)).map(gameRow).join("");box.hidden=false}else box.hidden=true;return}
    if(b.dataset.bw!=null){const x=AUTO.blown[+b.dataset.bw];if(x)window.openAnalysis(x.g,x.r.blown.k);return}
    if(b.dataset.w!=null){const x=AUTO.worst[+b.dataset.w];if(x)window.openAnalysis(x.g,x.w.k+1);return}
    if(b.dataset.save){let M=[];try{M=JSON.parse(localStorage.getItem("hansu-mypuz")||"[]")}catch(_){}const ids=new Set(M.map(x=>x.id));(AUTO.pz||[]).forEach(q=>{if(!ids.has(q.id))M.push(q)});try{localStorage.setItem("hansu-mypuz",JSON.stringify(M))}catch(_){}location.href="puzzle.html#mine";return}
    if(b.dataset.more){AUTO.n=+b.dataset.more;upd();const tok=++AUTO.tok;BatchAPI.stop();AUTO.p=AUTO.p.then(()=>tok===AUTO.tok?auto(LIST,tok):null).catch(()=>{});return}
    if(b.id==="rShare"){try{const u=new URL(location.href);u.searchParams.delete("game");u.searchParams.delete("tab");await navigator.clipboard.writeText(u.toString());b.textContent="복사함"}catch(_){b.textContent="복사 안 됨"}return}
  };
}
}
