/* 전적: 체스닷컴 공개 API에서 프로필·레이팅·최근 3개월 게임을 받아 목록과 통계를 그림 */
var $=function(s){return document.querySelector(s)};
var esc=function(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
var S={user:null,profile:null,stats:null,games:[],tc:"all",res:"all",col:"all",tab:"games",shown:50};
{
const API="https://api.chess.com/pub/";
const TC={bullet:"불릿",blitz:"블리츠",rapid:"래피드",daily:"데일리"};
const DRAW=new Set(["agreed","repetition","stalemate","insufficient","50move","timevsinsufficient"]);
const HOW={checkmated:"메이트",timeout:"시간",resigned:"기권",abandoned:"탈주",agreed:"합의",repetition:"반복",stalemate:"스테일메이트",insufficient:"기물 부족","50move":"50수",timevsinsufficient:"시간·기물 부족",kingofthehill:"킹 오브 더 힐",threecheck:"3체크",bughousepartnerlose:"파트너 패배"};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function get(url){
  for(let t=0;t<4;t++){
    let r;try{r=await fetch(url)}catch(e){await sleep(800);continue}
    if(r.status===429){await sleep(1500);continue}
    if(r.status===404||r.status===410){const e=new Error("notfound");e.code=404;throw e}
    if(!r.ok){await sleep(800);continue}
    return r.json();
  }
  throw new Error("network");
}
const msg=t=>{$("#msg").textContent=t||""};
const pad=n=>String(n).padStart(2,"0");
const ymd=d=>`${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())}`;
function ago(sec){const d=Date.now()/1000-sec;if(d<3600)return Math.max(1,Math.round(d/60))+"분 전";if(d<86400)return Math.round(d/3600)+"시간 전";if(d<86400*30)return Math.round(d/86400)+"일 전";return ymd(new Date(sec*1000))}
function tcLabel(tc){
  if(!tc)return "";if(tc.includes("/")){const s=+tc.split("/")[1];return s>=86400?Math.round(s/86400)+"일":Math.round(s/3600)+"시간"}
  const [b,i]=tc.split("+").map(Number);const base=b>=60?(b%60?(b/60).toFixed(1):b/60):b+"초";
  return i?`${base}+${i}`:(b>=60?base+"분":base);
}
function opening(g){
  const u=g.eco||(/\[ECOUrl "([^"]+)"/.exec(g.pgn||"")||[])[1];if(!u)return {name:"",fam:""};
  let s=decodeURIComponent(u.split("/openings/")[1]||"").split("...")[0].replace(/-\d+\..*$/,"").replace(/-/g," ").trim();
  const w=s.split(" "),stop=["Defense","Opening","Game","Gambit","Attack","System","Countergambit","Variation"];
  let k=w.findIndex(x=>stop.includes(x));const fam=k>=0?w.slice(0,k+1).join(" "):s;
  return {name:s,fam};
}
function norm(g,user){
  const me=g.white.username.toLowerCase()===user?"w":"b",my=me==="w"?g.white:g.black,op=me==="w"?g.black:g.white;
  const abort=/abort/.test(my.result+op.result);/* 중단: 레이팅 반영 없이 끝난 판 */
  const res=abort?"abort":my.result==="win"?"win":DRAW.has(my.result)?"draw":"loss";
  const how=abort?"중단":HOW[res==="win"?op.result:my.result]||(res==="win"?op.result:my.result);
  const o=opening(g);
  return {id:g.uuid,url:g.url,pgn:g.pgn,eco:g.eco,term:abort?"aborted":res==="win"?op.result:my.result,tc:g.time_control,tclass:g.time_class,rated:g.rated,rules:g.rules,end:g.end_time,me,res,how,
    my:{name:my.username,rating:my.rating},op:{name:op.username,rating:op.rating},
    open:o.name,fam:o.fam,acc:g.accuracies?{me:g.accuracies[me==="w"?"white":"black"],op:g.accuracies[me==="w"?"black":"white"]}:null,setup:g.initial_setup};
}
/* 최근 검색 */
function recentList(){try{return JSON.parse(localStorage.getItem("hansu-recent")||"[]")}catch(e){return []}}
function pushRecent(u){const l=[u].concat(recentList().filter(x=>x.toLowerCase()!==u.toLowerCase())).slice(0,6);try{localStorage.setItem("hansu-recent",JSON.stringify(l))}catch(e){}renderRecent()}
function renderRecent(){$("#recent").innerHTML=recentList().map(u=>`<button type="button" data-u="${esc(u)}">${esc(u)}</button>`).join("")}
$("#recent").onclick=e=>{const b=e.target.closest("button");if(b){$("#q").value=b.dataset.u;search(b.dataset.u)}};
$("#form").onsubmit=e=>{e.preventDefault();const u=$("#q").value.trim();if(u)search(u)};
let token=0;
async function search(name,gid){
  const t=++token,user=name.toLowerCase();
  msg("불러오는 중…");$("#prof").classList.remove("on");$("#rates").classList.remove("on");$("#main").classList.remove("on");
  try{
    const prof=await get(API+"player/"+encodeURIComponent(user));if(t!==token)return;
    const st=await get(API+"player/"+encodeURIComponent(user)+"/stats").catch(()=>({}));if(t!==token)return;
    S.user=user;S.profile=prof;S.stats=st;S.games=[];S.shown=50;
    renderProfile();pushRecent(prof.username||name);
    try{const p=new URL(location.href);p.searchParams.set("user",prof.username||name);p.searchParams.delete("game");history.replaceState(null,"",p)}catch(e){}
    const ar=await get(API+"player/"+encodeURIComponent(user)+"/games/archives");if(t!==token)return;
    const now=new Date(),keys=[0,1,2].map(i=>{const d=new Date(now.getFullYear(),now.getMonth()-i,1);return d.getFullYear()+"/"+pad(d.getMonth()+1)});
    const urls=(ar.archives||[]).filter(u=>keys.some(k=>u.endsWith(k)));
    let all=[];
    for(let i=0;i<urls.length;i++){
      msg(`게임 불러오는 중 ${i+1}/${urls.length}`);
      const m=await get(urls[i]).catch(()=>({games:[]}));if(t!==token)return;
      all=all.concat((m.games||[]).filter(g=>g.white&&g.black));
    }
    S.games=all.map(g=>norm(g,user)).sort((a,b)=>b.end-a.end);
    msg(S.games.length?"":"최근 3개월 동안 둔 게임이 없어요.");
    $("#range").textContent=`최근 3개월 · ${S.games.length}판`;
    $("#main").classList.add("on");renderFilters();renderAll();
    if(gid){const g=S.games.find(x=>x.id===gid);if(g){try{const u=new URL(location.href);u.searchParams.set("game",gid);history.replaceState(null,"",u)}catch(e){}window.openAnalysis(g)}}
  }catch(e){if(t!==token)return;msg(e.code===404?"없는 닉네임이에요.":"불러오지 못했어요. 잠시 후 다시 해 보세요.")}
}
function renderProfile(){
  const p=S.profile,cc=(p.country||"").split("/").pop();let cn=cc;
  try{cn=new Intl.DisplayNames(["ko"],{type:"region"}).of(cc)||cc}catch(e){}
  $("#prof").innerHTML=`${p.avatar?`<img src="${esc(p.avatar)}" alt="">`:`<img alt="">`}
    <div><div class="nm">${p.title?`<span class="ttl">${esc(p.title)}</span>`:""}${esc(p.username)}</div>
    <div class="sub">${p.name?`<span>${esc(p.name)}</span>`:""}${cn?`<span>${esc(cn)}</span>`:""}<span>가입 ${ymd(new Date(p.joined*1000))}</span><span>접속 ${ago(p.last_online)}</span>${p.followers?`<span>팔로워 ${p.followers.toLocaleString()}</span>`:""}</div></div>
    <a class="ext" href="${esc(p.url)}" target="_blank" rel="noopener">체스닷컴 프로필</a>`;
  $("#prof").classList.add("on");
  const st=S.stats||{},keys=[["chess_bullet","불릿"],["chess_blitz","블리츠"],["chess_rapid","래피드"],["chess_daily","데일리"]];
  let h=keys.map(([k,l])=>{const s=st[k];if(!s||!s.last)return `<div class="rc off"><small>${l}</small><b>–</b><div class="best">기록 없음</div></div>`;
    const r=s.record||{win:0,draw:0,loss:0};return `<div class="rc"><small>${l}</small><b>${s.last.rating}</b><div class="best">최고 ${s.best?s.best.rating:"–"}</div>${wdl(r.win,r.draw,r.loss)}<div class="nums">${r.win.toLocaleString()}승 ${r.draw.toLocaleString()}무 ${r.loss.toLocaleString()}패</div></div>`}).join("");
  const tac=st.tactics&&st.tactics.highest,pr=st.puzzle_rush&&st.puzzle_rush.best;
  h+=`<div class="rc${tac?"":" off"}"><small>퍼즐</small><b>${tac?tac.rating:"–"}</b><div class="best">최고 기록</div></div>`;
  h+=`<div class="rc${pr?"":" off"}"><small>퍼즐 러시</small><b>${pr?pr.score:"–"}</b><div class="best">최고 점수</div></div>`;
  $("#rates").innerHTML=h;$("#rates").classList.add("on");
}
function wdl(w,d,l){const n=w+d+l||1;return `<div class="wdl"><i class="w" style="width:${w/n*100}%"></i><i class="d" style="width:${d/n*100}%"></i><i class="l" style="width:${l/n*100}%"></i></div>`}
window.wdlBar=wdl;
/* 필터 */
function chips(el,list,key){$(el).innerHTML=list.map(([v,l])=>`<button class="chip" data-v="${v}" aria-pressed="${S[key]===v}">${l}</button>`).join("");
  $(el).onclick=e=>{const b=e.target.closest("button");if(!b)return;S[key]=b.dataset.v;S.shown=50;renderFilters();renderAll()}}
function renderFilters(){
  const has=new Set(S.games.map(g=>g.tclass));
  chips("#fTc",[["all","전체"]].concat(Object.keys(TC).filter(k=>has.has(k)).map(k=>[k,TC[k]])),"tc");
  chips("#fRes",[["all","전체"],["win","승"],["loss","패"],["draw","무"]],"res");
  chips("#fCol",[["all","전체"],["w","백"],["b","흑"]],"col");
  $("#fRes").hidden=$("#fCol").hidden=S.tab==="stats";
}
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{S.tab=b.dataset.tab;document.querySelectorAll(".tab").forEach(x=>x.setAttribute("aria-selected",x===b));$("#pGames").hidden=S.tab!=="games";$("#pStats").hidden=S.tab!=="stats";renderFilters();renderAll()});
const byTc=()=>S.games.filter(g=>S.tc==="all"||g.tclass===S.tc);
function filtered(){return byTc().filter(g=>(S.res==="all"||g.res===S.res)&&(S.col==="all"||g.me===S.col))}
function renderAll(){if(S.tab==="games")renderGames();else renderStats()}
/* 게임 목록 */
function renderGames(){
  const l=filtered(),RL={win:"승",loss:"패",draw:"무",abort:"중단"};
  $("#glist").innerHTML=l.slice(0,S.shown).map((g,i)=>{
    const d=new Date(g.end*1000),acc=g.acc?`${g.acc.me!=null?g.acc.me.toFixed(1):"–"} <em>/ ${g.acc.op!=null?g.acc.op.toFixed(1):"–"}</em>`:"<em>–</em>";
    const opc=g.me==="w"?"b":"w";
    return `<div class="gr"><span class="res ${g.res}">${RL[g.res]}</span>
      <span class="tcx">${TC[g.tclass]||g.tclass} ${tcLabel(g.tc)}</span>
      <div class="pl"><span class="me"><i class="${g.me}"></i>${esc(g.my.name)} <em>${g.my.rating}</em></span><span><i class="${opc}"></i>${esc(g.op.name)} <em>${g.op.rating}</em></span></div>
      <span class="how">${esc(g.how)}</span><span class="op" title="${esc(g.open)}">${esc(g.open)||"–"}</span>
      <span class="acc">${acc}</span><span class="dt">${pad(d.getMonth()+1)}.${pad(d.getDate())}</span>
      <div class="mline"><span>${TC[g.tclass]||g.tclass} ${tcLabel(g.tc)}</span><span>${esc(g.how)}</span>${g.acc&&g.acc.me!=null?`<span>정확도 ${g.acc.me.toFixed(1)}</span>`:""}<span>${pad(d.getMonth()+1)}.${pad(d.getDate())}</span>${g.open?`<span>${esc(g.open)}</span>`:""}</div>
      <button class="ab" data-i="${i}">분석</button></div>`}).join("")||'<p class="empty">게임이 없어요.</p>';
  $("#more").hidden=l.length<=S.shown;
  $("#glist").onclick=e=>{const b=e.target.closest(".ab");if(b)window.openAnalysis(l[+b.dataset.i])};
}
$("#more").onclick=()=>{S.shown+=50;renderGames()};
/* 통계 */
function rec(list){const w=list.filter(g=>g.res==="win").length,d=list.filter(g=>g.res==="draw").length;return {n:list.length,w,d,l:list.filter(g=>g.res==="loss").length}}
const pct=r=>r.n?Math.round(r.w/r.n*100)+"%":"–";
const row=(name,sub,r)=>`<div class="row"><span class="n">${esc(name)}<em>${sub}</em></span>${wdl(r.w,r.d,r.l)}<span class="pct">${pct(r)}</span></div>`;
function group(list,key){const m=new Map();list.forEach(g=>{const k=key(g);if(k==null||k==="")return;if(!m.has(k))m.set(k,[]);m.get(k).push(g)});return [...m.entries()].map(([k,v])=>[k,rec(v)])}
function hbars(items,color){const max=Math.max(1,...items.map(x=>x[1]));return items.map(([l,v])=>`<div class="hb"><span>${esc(l)}</span><span class="t"><i style="width:${v/max*100}%;background:${color}"></i></span><span>${v}</span></div>`).join("")}
function renderStats(){
  const L=byTc(),R=rec(L);
  if(!L.length){$("#sgrid").innerHTML='<p class="empty">게임이 없어요.</p>';return}
  let h=`<div class="sc full"><h3>레이팅</h3><div class="chips" id="rgTc"></div><div class="fig" id="rfig"><svg id="rsvg"></svg></div></div>`;
  let streak={w:0,l:0},cw=0,cl=0;[...L].reverse().forEach(g=>{if(g.res==="win"){cw++;cl=0}else if(g.res==="loss"){cl++;cw=0}else{cw=0;cl=0}streak.w=Math.max(streak.w,cw);streak.l=Math.max(streak.l,cl)});
  const now=L[0].res,cnt=L.findIndex(g=>g.res!==now);const curN=cnt<0?L.length:cnt;
  h+=`<div class="sc"><h3>요약</h3><div class="big"><div><b>${R.n}</b><small>판</small></div><div><b>${pct(R)}</b><small>승률</small></div><div><b>${R.w}·${R.d}·${R.l}</b><small>승·무·패</small></div></div>${wdl(R.w,R.d,R.l)}
    <div class="big" style="margin-top:12px"><div><b>${streak.w}</b><small>최장 연승</small></div><div><b>${streak.l}</b><small>최장 연패</small></div><div><b>${curN}${{win:"연승",loss:"연패",draw:"무"}[now]}</b><small>지금</small></div></div></div>`;
  const W=rec(L.filter(g=>g.me==="w")),B=rec(L.filter(g=>g.me==="b"));
  h+=`<div class="sc"><h3>백 / 흑</h3>${row("백",W.n+"판",W)}${row("흑",B.n+"판",B)}</div>`;
  const op=c=>group(L.filter(g=>g.me===c),g=>g.fam).sort((a,b)=>b[1].n-a[1].n).slice(0,6).map(([k,r])=>row(k,r.n+"판",r)).join("")||'<p class="empty">없음</p>';
  h+=`<div class="sc"><h3>오프닝 · 백</h3>${op("w")}</div><div class="sc"><h3>오프닝 · 흑</h3>${op("b")}</div>`;
  const hw=group(L.filter(g=>g.res==="win"),g=>g.how).map(([k,r])=>[k,r.n]).sort((a,b)=>b[1]-a[1]);
  const hl=group(L.filter(g=>g.res==="loss"),g=>g.how).map(([k,r])=>[k,r.n]).sort((a,b)=>b[1]-a[1]);
  const hd=group(L.filter(g=>g.res==="draw"),g=>g.how).map(([k,r])=>[k,r.n]).sort((a,b)=>b[1]-a[1]);
  h+=`<div class="sc"><h3>끝난 방식</h3><div class="two"><div><p class="sub3">이겼을 때</p>${hbars(hw,"var(--win)")||"–"}</div><div><p class="sub3">졌을 때</p>${hbars(hl,"var(--loss)")||"–"}</div></div>${hd.length?`<p class="sub3" style="margin-top:10px">비겼을 때</p>${hbars(hd,"var(--draw)")}`:""}</div>`;
  const bands=[["200 이상 낮음",-1e9,-200],["100~200 낮음",-200,-100],["비슷함",-100,100],["100~200 높음",100,200],["200 이상 높음",200,1e9]];
  h+=`<div class="sc"><h3>상대 레이팅</h3>${bands.map(([l,a,b])=>{const r=rec(L.filter(g=>{const d=g.op.rating-g.my.rating;return d>=a&&d<b}));return r.n?row(l,r.n+"판",r):""}).join("")}</div>`;
  const hrs=[["새벽 0~6시",0,6],["오전 6~12시",6,12],["오후 12~18시",12,18],["저녁 18~24시",18,24]];
  h+=`<div class="sc"><h3>시간대</h3>${hrs.map(([l,a,b])=>{const r=rec(L.filter(g=>{const x=new Date(g.end*1000).getHours();return x>=a&&x<b}));return r.n?row(l,r.n+"판",r):""}).join("")}</div>`;
  const days=["일","월","화","수","목","금","토"];
  h+=`<div class="sc"><h3>요일</h3>${[1,2,3,4,5,6,0].map(i=>{const r=rec(L.filter(g=>new Date(g.end*1000).getDay()===i));return r.n?row(days[i]+"요일",r.n+"판",r):""}).join("")}</div>`;
  const opp=group(L,g=>g.op.name).filter(x=>x[1].n>1).sort((a,b)=>b[1].n-a[1].n).slice(0,6);
  h+=`<div class="sc"><h3>자주 만난 상대</h3>${opp.map(([k,r])=>row(k,`${r.w}승 ${r.d}무 ${r.l}패`,r)).join("")||'<p class="empty">두 번 이상 만난 상대가 없어요.</p>'}</div>`;
  $("#sgrid").innerHTML=h;
  const tcs=[...new Set(L.map(g=>g.tclass))].sort((a,b)=>L.filter(g=>g.tclass===b).length-L.filter(g=>g.tclass===a).length);
  let rt=S.tc!=="all"?S.tc:tcs[0];
  const draw=()=>{
    $("#rgTc").innerHTML=tcs.map(k=>`<button class="chip" data-v="${k}" aria-pressed="${k===rt}">${TC[k]||k}</button>`).join("");
    ratingChart($("#rsvg"),L.filter(g=>g.tclass===rt&&g.rated).slice().reverse());
  };
  $("#rgTc").onclick=e=>{const b=e.target.closest("button");if(b){rt=b.dataset.v;draw()}};
  draw();
  if(window.__ro)window.__ro.disconnect();window.__ro=new ResizeObserver(()=>draw());window.__ro.observe($("#rfig"));
}
function ratingChart(svg,pts){
  const W=svg.clientWidth,H=svg.clientHeight;if(!W)return;
  if(pts.length<2){svg.innerHTML=`<text x="${W/2}" y="${H/2}" text-anchor="middle" fill="currentColor" font-size="14">게임이 부족해요</text>`;return}
  const ys=pts.map(p=>p.my.rating),mn=Math.min(...ys),mx=Math.max(...ys),pad=(mx-mn)*.12+10,lo=mn-pad,hi=mx+pad;
  const L=W<520?8:44,Rr=12,T=14,B=26,x=i=>L+(W-L-Rr)*i/(pts.length-1),y=v=>T+(H-T-B)*(1-(v-lo)/(hi-lo));
  const d=pts.map((p,i)=>`${i?"L":"M"}${x(i).toFixed(1)},${y(p.my.rating).toFixed(1)}`).join("");
  const grid=[lo+pad,(lo+hi)/2,hi-pad].map(v=>Math.round(v));
  const f=t=>{const z=new Date(t*1000);return `${z.getMonth()+1}.${z.getDate()}`};
  svg.innerHTML=grid.map(v=>`<line x1="${L}" x2="${W-Rr}" y1="${y(v)}" y2="${y(v)}" stroke="currentColor" stroke-opacity=".12"/>${W<520?"":`<text x="${L-6}" y="${y(v)+4}" text-anchor="end" font-size="12" fill="currentColor" fill-opacity=".6">${v}</text>`}`).join("")
   +`<path d="${d} L${x(pts.length-1)},${H-B} L${L},${H-B}Z" fill="#ff6a3d" fill-opacity=".12"/><path d="${d}" fill="none" stroke="#ff6a3d" stroke-width="2.2" stroke-linejoin="round"/>`
   +`<circle cx="${x(pts.length-1)}" cy="${y(ys[ys.length-1])}" r="4" fill="#ff6a3d"/>`
   +`<text x="${L}" y="${H-6}" font-size="12" fill="currentColor" fill-opacity=".6">${f(pts[0].end)}</text><text x="${W-Rr}" y="${H-6}" text-anchor="end" font-size="12" fill="currentColor" fill-opacity=".6">${f(pts[pts.length-1].end)} · ${ys[ys.length-1]}</text>`;
}
renderRecent();
const q0=new URL(location.href).searchParams.get("user");
if(q0){$("#q").value=q0;search(q0,new URL(location.href).searchParams.get("game"))}else $("#q").focus();
}
