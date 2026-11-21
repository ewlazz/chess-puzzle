/* 전적 > 비교: 다른 닉네임과 레이팅 비교, 맞대결 기록 */
{
const RL={win:"승",loss:"패",draw:"무"},TC={bullet:"불릿",blitz:"블리츠",rapid:"래피드",daily:"데일리"};
const KEYS=[["chess_bullet","불릿"],["chess_blitz","블리츠"],["chess_rapid","래피드"],["chess_daily","데일리"]];
const V={name:"",prof:null,stats:null,err:"",owner:null};
window.renderCompare=function(list){
  if(V.owner!==S.user){V.name="";V.prof=null;V.stats=null;V.err="";V.owner=S.user}
  $("#pVs").innerHTML=`<form class="vsf" id="vsf"><input id="vsq" placeholder="비교할 닉네임" value="${esc(V.name)}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="비교할 닉네임"><button>비교</button></form>
    <div class="chips vsug" id="vsug"></div><p class="vsmsg" id="vsmsg">${esc(V.err)}</p><div id="vsout"></div>`;
  const freq=new Map();S.games.forEach(g=>{if(g.res!=="abort")freq.set(g.op.name,(freq.get(g.op.name)||0)+1)});
  $("#vsug").innerHTML=[...freq.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6).map(([n,c])=>`<button class="chip" type="button" data-n="${esc(n)}">${esc(n)} <em>${c}</em></button>`).join("");
  $("#vsug").onclick=e=>{const b=e.target.closest("[data-n]");if(b){$("#vsq").value=b.dataset.n;go(b.dataset.n,list)}};
  $("#vsf").onsubmit=e=>{e.preventDefault();const n=$("#vsq").value.trim();if(n)go(n,list)};
  out(list);
};
async function go(n,list){
  V.name=n;V.err="";$("#vsmsg").textContent="불러오는 중…";
  try{V.prof=await cget(CAPI+"player/"+encodeURIComponent(n.toLowerCase()));V.stats=await cget(CAPI+"player/"+encodeURIComponent(n.toLowerCase())+"/stats").catch(()=>({}));$("#vsmsg").textContent=""}
  catch(e){V.prof=null;V.err=e.code===404?"없는 닉네임이에요.":"불러오지 못했어요.";$("#vsmsg").textContent=V.err}
  out(list);
}
function cell(s){if(!s||!s.last)return {cur:null,best:null};return {cur:s.last.rating,best:s.best?s.best.rating:null}}
function out(list){
  const o=$("#vsout");if(!V.prof){o.innerHTML="";return}
  const A=S.profile,B=V.prof,sa=S.stats||{},sb=V.stats||{};
  const nm=p=>`${p.title?`<span class="ttl">${esc(p.title)}</span> `:""}${esc(p.username)}`;
  const rows=KEYS.map(([k,l])=>{const a=cell(sa[k]),b=cell(sb[k]);if(a.cur==null&&b.cur==null)return "";
    const d=a.cur!=null&&b.cur!=null?a.cur-b.cur:null;
    return `<tr><td>${l}</td><td class="${d>0?"hi":""}">${a.cur??"–"}<em>${a.best?" 최고 "+a.best:""}</em></td><td class="${d<0?"hi":""}">${b.cur??"–"}<em>${b.best?" 최고 "+b.best:""}</em></td><td>${d==null?"":(d>0?"+":"")+d}</td></tr>`}).join("");
  const ta=sa.tactics&&sa.tactics.highest,tb=sb.tactics&&sb.tactics.highest,ra=sa.puzzle_rush&&sa.puzzle_rush.best,rb=sb.puzzle_rush&&sb.puzzle_rush.best;
  const extra=(ta||tb?`<tr><td>퍼즐 최고</td><td class="${ta&&tb&&ta.rating>tb.rating?"hi":""}">${ta?ta.rating:"–"}</td><td class="${ta&&tb&&tb.rating>ta.rating?"hi":""}">${tb?tb.rating:"–"}</td><td></td></tr>`:"")+(ra||rb?`<tr><td>퍼즐 러시</td><td class="${ra&&rb&&ra.score>rb.score?"hi":""}">${ra?ra.score:"–"}</td><td class="${ra&&rb&&rb.score>ra.score?"hi":""}">${rb?rb.score:"–"}</td><td></td></tr>`:"");
  const H=list.filter(g=>g.res!=="abort"&&g.op.name.toLowerCase()===B.username.toLowerCase());
  const w=H.filter(g=>g.res==="win").length,d=H.filter(g=>g.res==="draw").length,l=H.length-w-d;
  const byTc=Object.keys(TC).map(k=>{const a=H.filter(g=>g.tclass===k);if(!a.length)return "";const w2=a.filter(g=>g.res==="win").length,d2=a.filter(g=>g.res==="draw").length;return `<div class="row"><span class="n">${TC[k]}<em>${a.length}판</em></span>${wdlBar(w2,d2,a.length-w2-d2)}<span class="pct">${w2}·${d2}·${a.length-w2-d2}</span></div>`}).join("");
  o.innerHTML=`<div class="sgrid">
    <div class="sc"><h3>레이팅</h3><div class="scroll"><table class="vst"><thead><tr><th></th><th>${nm(A)}</th><th>${nm(B)}</th><th></th></tr></thead><tbody>${rows}${extra}</tbody></table></div></div>
    <div class="sc"><h3>맞대결</h3>${H.length?`<div class="big"><div><b>${w}</b><small>${esc(A.username)} 승</small></div><div><b>${d}</b><small>무</small></div><div><b>${l}</b><small>${esc(B.username)} 승</small></div></div>${wdlBar(w,d,l)}${byTc}`:`<p class="empty">이 기간에 둘이 둔 게임이 없어요.</p>`}</div>
    ${H.length?`<div class="sc full"><h3>맞대결 게임</h3>${H.slice(0,15).map((g,i)=>{const dt=new Date(g.end*1000);return `<div class="og"><span class="res ${g.res}">${RL[g.res]}</span><span class="on">${TC[g.tclass]||g.tclass} · ${g.me==="w"?"백":"흑"} · ${esc(g.how)} <em>${g.my.rating} vs ${g.op.rating}</em></span><span class="od">${dt.getMonth()+1}.${dt.getDate()}</span><button class="ab" data-i="${i}">분석</button></div>`}).join("")}</div>`:""}
  </div>`;
  o.onclick=e=>{const b=e.target.closest("[data-i]");if(b)window.openAnalysis(H[+b.dataset.i])};
}
}
