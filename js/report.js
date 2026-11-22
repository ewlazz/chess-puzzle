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
function scanBody(){
  const S2=AUTO.scan;
  if(!S2)return `<p class="rprog">${esc(AUTO.txt||"곧 시작해요")}</p>`;
  const f=S2.found;
  const items=f.map((x,i)=>{const at=x.path.length;
    return `<div class="rbad"><div class="rbt"><span class="rcol2">${CN[x.color]}</span> ${x.name?esc(ko(x.name))+" · ":""}<b>${esc(window.oNum(at,x.mv))}</b></div>
      <div class="rbd">${x.n}번 둠 · 이 수 두면 <b class="bad">${ev(x.after)}</b> · ${esc(x.best)} 두면 <b>${ev(x.bestEv)}</b> · 이 수 두고 ${recTxt(x.rec)}</div>
      <div class="rbl">${lineHtml(x.path,x.mv)}</div>
      <div class="racts"><a class="ract" href="opening.html?line=${encodeURIComponent(x.path.join(","))}">보드에서 보기</a><button class="ract" data-badg="${i}">게임 ${x.n}판</button></div><div class="rgames" id="rbg${i}" hidden></div></div>`}).join("");
  return (S2.done?"":`<p class="rprog">${esc(AUTO.txt)}</p>`)+(items||(S2.done?'<p class="empty">없음</p>':""));
}
/* 3. 시간 */
function timeSec(L){
  const rows=Object.keys(TC).map(k=>{const a=L.filter(g=>g.tclass===k);return a.length?line(window.tcIcon(k)+TC[k],rec(a)):""}).join("");
  const live=L.filter(g=>g.tclass!=="daily"),lost=live.filter(g=>g.res==="loss"),tl=lost.filter(g=>g.how==="시간"),won=live.filter(g=>g.res==="win"),tw=won.filter(g=>g.how==="시간");
  const sh=lost.filter(g=>g._o&&g._o.len<=25);
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
  return `<section class="rsec"><h3 class="rh">상대와 흐름</h3>
    <h4>상대 레이팅</h4>${up.n?line("나보다 50 이상 높음",up,op(up)):""}${eq.n?line("비슷함",eq,op(eq)):""}${dn.n?line("나보다 50 이상 낮음",dn,op(dn)):""}
    <h4>연달아 둔 판</h4>${aw.length?line("이긴 다음 판",rec(aw),op(rec(aw))):""}${al.length?line("진 다음 판",rec(al),op(rec(al))):""}${!aw.length&&!al.length?'<p class="empty">이어서 둔 판이 없어요.</p>':""}
    <h4>시간대</h4>${hrs.map(([l,a,b])=>{const r=rec(L.filter(g=>{const x=new Date(g.end*1000).getHours();return x>=a&&x<b}));return r.n?line(l,r,op(r)):""}).join("")}</section>`;
}
/* 5. 엔진 진단 */
function engBody(){
  const L=LIST;if(!window.BatchAPI)return "";
  const n=Math.min(AUTO.n||ENGN,L.length),T=L.slice(0,n),R=BatchAPI.results(T);
  const prog=R.length<T.length?`<p class="rprog">${esc(AUTO.etxt||(AUTO.scan&&AUTO.scan.done?"곧 시작해요":"자꾸 두는 수 점검이 끝나면 시작해요"))}</p>`:"";
  if(!R.length)return prog+``;
  const mean=a=>{a=a.filter(x=>x!=null);return a.length?a.reduce((x,y)=>x+y,0)/a.length:null};
  const f1=v=>v==null?"–":v.toFixed(1);
  const wph=k=>{let s=0,c=0;R.forEach(x=>{const [v,m]=x.r.ph[k];if(v!=null){s+=v*m;c+=m}});return c?s/c:null};
  const per=k=>R.reduce((s,x)=>s+(x.r.cnt[k]||0),0)/R.length;
  const bar=(l,v)=>`<div class="hb"><span>${l}</span><span class="t"><i style="width:${v==null?0:v}%;background:var(--acc)"></i></span><span>${f1(v)}</span></div>`;
  const pz=R.flatMap(x=>x.r.pz||[]);
  const worst=R.flatMap(x=>x.r.worst.map(w=>({g:x.g,w}))).sort((a,b)=>b.w.loss-a.w.loss).slice(0,5);AUTO.worst=worst;AUTO.pz=pz;
  return prog+`<div class="rnums"><div><b>${R.length}</b><small>분석한 판</small></div><div><b>${f1(mean(R.map(x=>x.r.acc)))}</b><small>내 평균 정확도</small></div><div><b>${f1(mean(R.map(x=>x.r.opAcc)))}</b><small>상대 평균</small></div><div><b>${per("blunder").toFixed(1)}</b><small>판당 블런더</small></div><div><b>${per("mistake").toFixed(1)}</b><small>판당 실수</small></div><div><b>${per("miss").toFixed(1)}</b><small>판당 놓친 기회</small></div></div>
    ${weakHtml(R,wph,per)}
    ${blownHtml(R)}
    <h4>국면별 정확도</h4>${bar("오프닝",wph("o"))}${bar("미들게임",wph("m"))}${bar("엔드게임",wph("e"))}
    <h4>큰 실수</h4>${worst.map((x,i)=>{const k=x.w.k,no=Math.floor(k/2)+1;return `<div class="og"><span class="res ${x.g.res}">${RL[x.g.res]||"–"}</span><span class="on">vs ${esc(x.g.op.name)} · <b>${no}${k%2?"...":"."} ${esc(x.w.san)}</b> <em>${x.w.c==="blunder"?"블런더":x.w.c==="miss"?"놓침":"실수"}</em></span><span class="od">−${x.w.loss}%</span><button class="ab" data-w="${i}">보기</button></div>`}).join("")||'<p class="empty">없음</p>'}
    <div class="racts" style="margin-top:14px">${pz.length?`<button class="ract" data-save="1">내 실수 ${pz.length}개 퍼즐로 풀기</button>`:""}${n<50&&L.length>n?`<button class="ract" data-more="50">50판으로 늘리기</button>`:""}${n<100&&n>=50&&L.length>n?`<button class="ract" data-more="100">100판으로 늘리기</button>`:""}</div>`;
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
function blownHtml(R){
  const V=R.filter(x=>x.r.v),hi=V.filter(x=>x.r.high),hw=hi.filter(x=>x.g.res==="win"),lo=V.filter(x=>x.r.low),ls=lo.filter(x=>x.r.saved);
  const B=V.filter(x=>x.r.blown).sort((a,b)=>b.g.end-a.g.end);AUTO.blown=B;
  if(!V.length)return "";
  return `<div class="rnums"><div><b>${hi.length?P(hw.length/hi.length):"–"}</b><small>유리했던 판 마무리<br>${hw.length}/${hi.length}판</small></div><div><b>${lo.length?P(ls.length/lo.length):"–"}</b><small>불리했던 판 버팀<br>${ls.length}/${lo.length}판</small></div></div>
    <h4>이길 판 놓친 판 ${B.length?`<em>${B.length}판</em>`:""}</h4>${B.length?B.slice(0,6).map((x,i)=>{const b=x.r.blown,no=Math.floor(b.k/2)+1;
      return `<div class="og bw"><span class="res ${x.g.res}">${RL[x.g.res]||"–"}</span><span class="on">vs ${esc(x.g.op.name)} · 승률 ${b.w}%에서 <b>${no}${b.k%2?"...":"."} ${esc(b.san)}</b></span><button class="ab" data-bw="${i}">게임</button><a class="ab pri2" href="play.html?fen=${encodeURIComponent(b.fen)}&me=${x.g.me}&lvl=8&t=${encodeURIComponent("다시 이겨 보기 · 엔진 레벨 9")}">다시 두기</a></div>`}).join(""):'<p class="empty">분석한 판 중엔 없어요.</p>'}`;
}
function pressTxt(){
  const el=$("#rPress");if(!el||!window.BatchAPI)return;const R=BatchAPI.results(LIST.slice(0,AUTO.n||ENGN));
  let pn=0,nn=0,pb=0,nb=0;R.forEach(x=>{pn+=x.r.pr.p[1];nn+=x.r.pr.n[1];pb+=x.r.pr.pb;nb+=x.r.pr.nb});
  if(pn>=10&&nn>=10)el.innerHTML=`<b>${P(pb/pn)}</b><small>시간에 쫓길 때 실수<br>여유 있을 때 ${P(nb/nn)}</small>`;
}
function upd(){const a=$("#rScan"),b=$("#rEngB");if(a)a.innerHTML=scanBody();if(b)b.innerHTML=engBody();pressTxt()}
/* 자동 엔진: 자꾸 두는 수 → 최근 판 분석 */
async function auto(L,tok){
  const sig=S.user+"|"+L.length+"|"+(L[0]&&L[0].id);
  if(AUTO.sig!==sig){AUTO.sig=sig;AUTO.scan=null;AUTO.n=ENGN;
    try{const c=JSON.parse(localStorage.getItem("hansu-scan2-"+S.user)||"null");if(c&&c.sig===sig)AUTO.scan={found:c.found,done:true}}catch(e){}}
  const alive=()=>tok===AUTO.tok;AUTO.active=true;try{await run()}finally{if(tok===AUTO.tok)AUTO.active=false}
  async function run(){
  if(!AUTO.scan||!AUTO.scan.done){
    const all=[];AUTO.scan={found:[],done:false};
    for(const c of ["w","b"]){
      const f=await window.RepeatScan(L,c,(j,n,fd)=>{if(!alive())return;AUTO.txt=`${CN[c]} 점검 중 ${j+1}/${n}`;AUTO.scan.found=all.concat(fd);upd()},alive);
      if(!alive()||!f)return;all.push(...f);
    }
    AUTO.scan={found:all.sort((x,y)=>y.loss*y.n-x.loss*x.n).slice(0,12),done:true};AUTO.txt="";
    try{localStorage.setItem("hansu-scan2-"+S.user,JSON.stringify({sig,found:AUTO.scan.found}))}catch(e){}
    upd();
  }
  if(!alive())return;
  await BatchAPI.ensure(L.slice(0,AUTO.n),(i,n,a,b)=>{if(!alive())return;AUTO.etxt=`엔진 분석 중 ${i+1}/${n}판 · ${a}/${b}수`;upd()});
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
function draw(L){
  const el=$("#pRep"),R=rec(L),p=S.profile||{};
  const rt=Object.keys(TC).map(k=>{const a=L.filter(g=>g.tclass===k&&g.rated).sort((x,y)=>x.end-y.end);if(a.length<5)return "";const d=a[a.length-1].my.rating-a[0].my.rating;return `<span>${window.tcIcon(k)}${a[a.length-1].my.rating} <em class="${d>=0?"up":"dn"}">${d>=0?"+":""}${d}</em></span>`}).join("");
  el.innerHTML=`<div class="rhead"><div><b>${esc(p.username||S.user)}</b><small>${L.length}판 · ${recTxt(R)} · 승률 ${P(R.s)}</small></div><div class="rrt">${rt}</div><button class="ract" id="rShare">링크 복사</button></div>
    ${trendSec(L)}
    ${openSec(L)}
    ${studySec(L)}
    <section class="rsec"><h3 class="rh">자꾸 두는 안 좋은 수</h3><div id="rScan">${scanBody()}</div></section>
    <div class="rcols">${timeSec(L)}${oppSec(L)}</div>
    <section class="rsec"><h3 class="rh">엔진 진단</h3><div id="rEngB">${engBody()}</div></section>`;
  pressTxt();fillStudy(RT);
  el.onclick=async e=>{
    const b=e.target.closest("[data-per],[data-var],[data-morevar],[data-gid],[data-badg],[data-bw],[data-w],[data-save],[data-more],#rShare");if(!b)return;
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
