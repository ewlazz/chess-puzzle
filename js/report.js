/* 전적 > 리포트: 게임 기록으로 빠른 진단 + 엔진 진단(최근 10판), 고칠 점·잘하는 점과 연습 바로가기 */
{
const TC={bullet:"불릿",blitz:"블리츠",rapid:"래피드",daily:"데일리"};
const CN={w:"백",b:"흑"};
const P=x=>Math.round(x*100)+"%";
function rec(a){let w=0,d=0;a.forEach(g=>{if(g.res==="win")w++;else if(g.res==="draw")d++});const n=a.length;return {n,w,d,l:n-w-d,s:n?(w+d/2)/n:0}}
const ko=n=>window.Openings&&Openings.ko(n)||n;
/* 받침에 따라 은/는 */
const eun=w=>{const c=(w||"").trim().slice(-1).charCodeAt(0);if(c>=0xAC00&&c<=0xD7A3)return w+((c-0xAC00)%28?"은":"는");return w+"은(는)"};
const mv=a=>a.map((x,i)=>i%2===0?`${i/2+1}. ${x}`:x).join(" ");
let RT=0,ENG={on:false,txt:""};
/* 여러 판이 공통으로 지나간 수순(60% 이상이 같은 수를 둔 곳까지) */
function commonLine(G){
  const p=[];for(let i=0;i<16;i++){const m=new Map();G.forEach(g=>{const s=g._o&&g._o.san;if(s&&s.length>i&&p.every((x,k)=>s[k]===x))m.set(s[i],(m.get(s[i])||0)+1)});
    const top=[...m.entries()].sort((a,b)=>b[1]-a[1])[0];if(!top||top[1]<G.length*.6)break;p.push(top[0])}
  return p;
}
function fast(L){
  const bad=[],good=[],R=rec(L);
  /* 오프닝 (색별) */
  ["w","b"].forEach(c=>{
    const m=new Map();L.filter(g=>g.me===c&&g._o&&g._o.fam).forEach(g=>{const k=g._o.fam;if(!m.has(k))m.set(k,[]);m.get(k).push(g)});
    const C=rec(L.filter(g=>g.me===c));
    m.forEach((G,f)=>{if(G.length<5)return;const r=rec(G),d=r.s-C.s;
      const line=commonLine(G),href=`opening.html?line=${encodeURIComponent(line.join(","))}&drill=${c}`;
      if(d<=-.12)bad.push({s:-d*Math.sqrt(G.length)*1.2,t:`${CN[c]}으로 ${ko(f)} 점수 ${P(r.s)}`,d:`${G.length}판 · ${CN[c]}일 때 평소 점수 ${P(C.s)}${line.length?" · 자주 가는 수순 "+mv(line):""}`,act:[{l:"이 오프닝 연습",href},{l:"트리에서 보기",tab:"open"}]});
      else if(d>=.12)good.push({s:d*Math.sqrt(G.length),t:`${CN[c]}으로 ${eun(ko(f))} 강해요`,d:`${G.length}판 · 점수 ${P(r.s)}`});
    });
  });
  /* 색 */
  const W=rec(L.filter(g=>g.me==="w")),B=rec(L.filter(g=>g.me==="b"));
  if(W.n>=10&&B.n>=10&&Math.abs(W.s-B.s)>=.1){const c=W.s<B.s?"w":"b",lo=c==="w"?W:B,hi=c==="w"?B:W;
    bad.push({s:Math.abs(W.s-B.s)*4,t:`${CN[c]}일 때 점수가 ${P(lo.s)}로 더 낮아요`,d:`${CN[c==="w"?"b":"w"]}일 때 ${P(hi.s)} · ${lo.n}판`,act:[{l:`${CN[c]} 오프닝 보기`,tab:"open"}]})}
  /* 시간패 */
  const live=L.filter(g=>g.tclass!=="daily"),lost=live.filter(g=>g.res==="loss"),tl=lost.filter(g=>g.how==="시간");
  if(lost.length>=5&&tl.length/lost.length>=.25)bad.push({s:tl.length/lost.length*5,t:`진 판의 ${P(tl.length/lost.length)}가 시간패`,d:`${lost.length}판 중 ${tl.length}판`,act:[{l:"퍼즐 러시로 빠른 판단 연습",href:"puzzle.html#rush"}]});
  /* 일찍 끝난 패배 */
  const sh=lost.filter(g=>g._o&&g._o.len<=25);
  if(lost.length>=6&&sh.length/lost.length>=.35)bad.push({s:sh.length/lost.length*4,t:`진 판의 ${P(sh.length/lost.length)}가 25수 안에 끝났어요`,d:"초반 전술에서 무너지는 경우가 많아요",act:[{l:"오프닝 전술 퍼즐",href:"puzzle.html?theme=opening#theme"},{l:"짧은 메이트 퍼즐",href:"puzzle.html?theme=mateIn2#theme"}]});
  /* 연달아 둘 때 */
  const A=L.slice().sort((a,b)=>a.end-b.end),aw=[],al=[];
  for(let i=1;i<A.length;i++){const p=A[i-1],g=A[i];if(g.tclass!==p.tclass||g.tclass==="daily"||g.end-p.end>1800)continue;if(p.res==="win")aw.push(g);else if(p.res==="loss")al.push(g)}
  const RW=rec(aw),RL=rec(al);
  if(RL.n>=10&&RW.n>=10&&RW.s-RL.s>=.12)bad.push({s:(RW.s-RL.s)*4,t:`진 다음 바로 둔 판 점수 ${P(RL.s)}`,d:`이긴 다음 바로 둔 판은 ${P(RW.s)} · 지고 나면 몇 분 쉬었다 두는 게 좋아요`,act:[{l:"시간대 통계",tab:"stats"}]});
  /* 시간대 */
  const hrs=[["새벽(0~6시)",0,6],["오전(6~12시)",6,12],["오후(12~18시)",12,18],["저녁(18~24시)",18,24]];
  hrs.forEach(([l,a,b])=>{const r=rec(L.filter(g=>{const x=new Date(g.end*1000).getHours();return x>=a&&x<b}));if(r.n<10)return;const d=r.s-R.s;
    if(d<=-.12)bad.push({s:-d*3,t:`${l}에 점수가 ${P(r.s)}`,d:`${r.n}판 · 평소 ${P(R.s)}`});else if(d>=.12)good.push({s:d*2,t:`${l}에 잘 둬요`,d:`${r.n}판 · 점수 ${P(r.s)}`})});
  /* 시간 종류 */
  const tcs=Object.keys(TC).map(k=>[k,rec(L.filter(g=>g.tclass===k))]).filter(x=>x[1].n>=10);
  if(tcs.length>1){tcs.sort((a,b)=>b[1].s-a[1].s);const [bk,br]=tcs[0],[wk,wr]=tcs[tcs.length-1];if(br.s-wr.s>=.12)good.push({s:(br.s-wr.s)*2,t:`${TC[bk]}가 잘 맞아요`,d:`${TC[bk]} ${P(br.s)} · ${TC[wk]} ${P(wr.s)}`})}
  /* 레이팅 높은 상대 */
  const up=rec(L.filter(g=>g.op.rating-g.my.rating>=100));if(up.n>=8&&up.s>=.45)good.push({s:up.s*2,t:"높은 상대에게도 잘 버텨요",d:`100 이상 높은 상대 ${up.n}판 · 점수 ${P(up.s)}`});
  return {bad,good};
}
function engine(L){
  const bad=[],good=[];if(!window.BatchAPI)return {bad,good,n:0};
  const R=BatchAPI.results(L.slice(0,20));if(R.length<5)return {bad,good,n:R.length};
  const wph=k=>{let s=0,n=0;R.forEach(x=>{const [v,c]=x.r.ph[k];if(v!=null){s+=v*c;n+=c}});return n>=15?s/n:null};
  const ph={o:wph("o"),m:wph("m"),e:wph("e")},PN={o:"오프닝",m:"미들게임",e:"엔드게임"};
  const av=Object.entries(ph).filter(x=>x[1]!=null).sort((a,b)=>a[1]-b[1]);
  if(av.length>1&&av[av.length-1][1]-av[0][1]>=6){const [k,v]=av[0];
    const act=k==="e"?[{l:"엔드게임 퍼즐",href:"puzzle.html?theme=endgame#theme"},{l:"룩 엔드게임",href:"puzzle.html?theme=rookEndgame#theme"}]:k==="m"?[{l:"미들게임 퍼즐",href:"puzzle.html?theme=middlegame#theme"}]:[{l:"오프닝 트리",tab:"open"}];
    bad.push({s:(av[av.length-1][1]-v)/3,t:`${PN[k]} 정확도가 가장 낮아요`,d:av.map(([a,b])=>`${PN[a]} ${b.toFixed(0)}`).join(" · "),act,eng:1})}
  const per=k=>R.reduce((s,x)=>s+(x.r.cnt[k]||0),0)/R.length;
  const bl=per("blunder"),mi=per("mistake"),ms=per("miss");
  const pz=R.flatMap(x=>x.r.pz||[]);
  if(bl>=.7)bad.push({s:bl*3,t:`판당 블런더 ${bl.toFixed(1)}개`,d:`실수 ${mi.toFixed(1)}개 · 최근 ${R.length}판 기준`,act:pz.length?[{l:`내 실수 ${pz.length}개 퍼즐로 풀기`,save:1}]:[],eng:1});
  let pn=0,nn=0,pb=0,nb=0;R.forEach(x=>{pn+=x.r.pr.p[1];nn+=x.r.pr.n[1];pb+=x.r.pr.pb;nb+=x.r.pr.nb});
  if(pn>=15&&nn>=30){const a=pb/pn,b=nb/nn;if(a>=b*1.8&&a>=.06)bad.push({s:(a/b)*1.2,t:`시간에 쫓기면 실수가 ${b?(a/b).toFixed(1)+"배":"훨씬 많아요"}`,d:`쫓길 때 ${P(a)} · 여유 있을 때 ${P(b)} (남은 시간 10% 또는 20초 아래)`,act:[{l:"퍼즐 러시",href:"puzzle.html#rush"}],eng:1})}
  if(ms>=.5)bad.push({s:ms*3,t:`상대 실수를 놓친 게 판당 ${ms.toFixed(1)}번`,d:"상대가 기물을 내줬거나 실수했을 때 이득을 못 챙겼어요",act:[{l:"공짜 기물 퍼즐",href:"puzzle.html?theme=hangingPiece#theme"},{l:"추천 퍼즐",href:"puzzle.html#rated"}],eng:1});
  const acc=R.reduce((s,x)=>s+(x.r.acc||0),0)/R.length,op=R.reduce((s,x)=>s+(x.r.opAcc||0),0)/R.length;
  if(acc-op>=3)good.push({s:(acc-op)/3,t:"상대보다 정확하게 둬요",d:`평균 정확도 ${acc.toFixed(1)} · 상대 ${op.toFixed(1)}`,eng:1});
  const br=R.reduce((s,x)=>s+(x.r.cnt.brilliant||0)+(x.r.cnt.great||0),0);if(br>=3)good.push({s:br/3,t:`좋은 수를 자주 찾아요`,d:`최근 ${R.length}판에서 브릴리언트·그레이트 ${br}번`,eng:1});
  return {bad,good,n:R.length,pz};
}
function card(x,i,ok){
  const act=(x.act||[]).map(a=>a.href?`<a class="ract" href="${a.href}">${a.l}</a>`:a.tab?`<button class="ract" data-tab="${a.tab}">${a.l}</button>`:a.save?`<button class="ract" data-save="1">${a.l}</button>`:"").join("");
  return `<div class="rcard${ok?" ok":""}"><i>${ok?"✓":i+1}</i><div><b>${esc(x.t)}</b><small>${esc(x.d)}</small>${act?`<div class="racts">${act}</div>`:""}${x.eng?'<span class="rtag">엔진</span>':""}</div></div>`;
}
window.renderReport=async function(list){
  const t=++RT,el=$("#pRep"),L=list.filter(g=>g.res!=="abort"&&g.my&&g.op);
  if(L.length<5){el.innerHTML='<p class="empty">게임이 5판 이상 있어야 진단할 수 있어요. 위에서 기간을 늘려 보세요.</p>';return}
  el.innerHTML='<p class="empty" id="rSt">진단 중…</p>';
  if(window.Openings&&window.prepOpening){await Openings.load();let t0=performance.now();
    for(let i=0;i<L.length;i++){window.prepOpening(L[i]);if(performance.now()-t0>40){const s=$("#rSt");if(s)s.textContent=`진단 중 ${i+1}/${L.length}`;await new Promise(r=>{const c=new MessageChannel();c.port1.onmessage=()=>r();c.port2.postMessage(0)});t0=performance.now();if(t!==RT)return}}}
  if(t!==RT)return;
  draw(L);
};
function draw(L){
  const el=$("#pRep"),F=fast(L),E=engine(L),R=rec(L);
  const bad=[...F.bad,...E.bad].sort((a,b)=>b.s-a.s).slice(0,6),good=[...F.good,...E.good].sort((a,b)=>b.s-a.s).slice(0,3);
  const p=S.profile||{};
  const rt=Object.keys(TC).map(k=>{const a=L.filter(g=>g.tclass===k&&g.rated).sort((x,y)=>x.end-y.end);if(a.length<5)return "";const d=a[a.length-1].my.rating-a[0].my.rating;return `<span>${TC[k]} ${a[a.length-1].my.rating} <em class="${d>=0?"up":"dn"}">${d>=0?"+":""}${d}</em></span>`}).join("");
  const top10=L.slice(0,10),done=window.BatchAPI?BatchAPI.results(top10).length:0;
  el.innerHTML=`<div class="rhead"><div><b>${esc(p.username||S.user)}</b><small>${L.length}판 · 점수 ${P(R.s)} · ${R.w}승 ${R.d}무 ${R.l}패</small></div><div class="rrt">${rt}</div><button class="ract" id="rShare">링크 복사</button></div>
    <div class="rgrid"><div><h3 class="rh">고칠 점</h3>${bad.length?bad.map((x,i)=>card(x,i)).join(""):'<p class="empty">눈에 띄는 약점이 없어요. 엔진 진단을 해 보세요.</p>'}</div>
    <div><h3 class="rh">잘하는 점</h3>${good.length?good.map(x=>card(x,0,1)).join(""):'<p class="empty">아직 뚜렷한 강점이 안 보여요.</p>'}
      <div class="reng"><h3 class="rh">엔진 진단</h3><p>${E.n>=5?`최근 ${E.n}판을 엔진으로 분석한 결과가 위에 들어가 있어요.`:"최근 10판을 엔진으로 분석해서 실수가 나오는 국면과 시간 압박을 찾아요. 2~3분쯤 걸리고, 이 브라우저에서만 돌아가요."}</p>
      ${done<top10.length?`<button class="bgo" id="rEng">${ENG.on?"멈추기":done?`이어서 분석 (${done}/${top10.length})`:"엔진 진단 시작"}</button>`:""}<p class="rprog" id="rProg">${esc(ENG.txt)}</p></div></div></div>`;
  el.onclick=async e=>{
    const b=e.target.closest("[data-tab],[data-save],#rShare,#rEng");if(!b)return;
    if(b.dataset.tab){window.showTab(b.dataset.tab);window.scrollTo({top:$("#main").offsetTop-60,behavior:"smooth"});return}
    if(b.dataset.save){let M=[];try{M=JSON.parse(localStorage.getItem("hansu-mypuz")||"[]")}catch(_){}const ids=new Set(M.map(x=>x.id));(E.pz||[]).forEach(q=>{if(!ids.has(q.id))M.push(q)});try{localStorage.setItem("hansu-mypuz",JSON.stringify(M))}catch(_){}location.href="puzzle.html#mine";return}
    if(b.id==="rShare"){try{const u=new URL(location.href);u.searchParams.delete("game");u.searchParams.delete("tab");await navigator.clipboard.writeText(u.toString());b.textContent="복사함"}catch(_){b.textContent="복사 안 됨"}return}
    if(b.id==="rEng"){
      if(ENG.on){BatchAPI.stop();ENG.on=false;ENG.txt="";draw(L);return}
      ENG.on=true;b.textContent="멈추기";
      await BatchAPI.ensure(top10,(i,n,a,c)=>{ENG.txt=`${i+1}/${n}판 · ${a}/${c}수`;const pg=$("#rProg");if(pg)pg.textContent=ENG.txt});
      ENG.on=false;ENG.txt="";if(S.tab==="report")draw(L);
    }
  };
}
}
