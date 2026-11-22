/* 전적 > 정확도: 최근 N판을 엔진으로 분석해서 평균 정확도, 국면별·시간 압박별 정확도, 큰 실수 */
{
const RL={win:"승",loss:"패",draw:"무"};
const B={n:20,running:false,user:null,res:{}};
const key=()=>"hansu-batch-"+S.user;
function loadRes(){if(B.user===S.user)return;B.user=S.user;try{B.res=JSON.parse(localStorage.getItem(key())||"{}")}catch(e){B.res={}}}
function saveRes(){try{localStorage.setItem(key(),JSON.stringify(B.res))}catch(e){/* 가득 차면 오래된 것부터 지움 */const ids=Object.keys(B.res).sort((a,b)=>B.res[a].end-B.res[b].end);ids.slice(0,Math.ceil(ids.length/3)).forEach(i=>delete B.res[i]);try{localStorage.setItem(key(),JSON.stringify(B.res))}catch(_){}}}
const C=window.calAcc||(v=>v);
function calR(r){const cp=a=>[a[0]==null?null:C(a[0]),a[1]];return Object.assign({},r,{acc:C(r.acc),opAcc:C(r.opAcc),ph:{o:cp(r.ph.o),m:cp(r.ph.m),e:cp(r.ph.e)},pr:Object.assign({},r.pr,{p:cp(r.pr.p),n:cp(r.pr.n)})})}
const turnOf=f=>f.split(" ")[1];
const mat=f=>{let v=0;for(const ch of f.split(" ")[0]){const t=ch.toLowerCase();if(t==="n"||t==="b")v+=3;else if(t==="r")v+=5;else if(t==="q")v+=9}return v};
const gacc=a=>{if(!a.length)return null;const mean=a.reduce((x,y)=>x+y,0)/a.length,harm=a.length/a.reduce((x,y)=>x+1/Math.max(y,5),0);return +((mean+harm)/2).toFixed(1)};
function summarize(X,g){
  const me=g.me,ph={o:[],m:[],e:[]},pr={p:[],n:[],pb:0,nb:0},cnt={},worst=[],accMe=[],accOp=[];
  X.moves.forEach((m,k)=>{
    const c=X.cls[k];if(!c)return;const a=X.acc[k];
    if(turnOf(X.fens[k])!==me){accOp.push(a);return}
    accMe.push(a);cnt[c]=(cnt[c]||0)+1;
    const P=mat(X.fens[k])<=26?"e":(k<20?"o":"m");ph[P].push(a);
    const left=X.clk[k];if(left!=null&&X.base){const press=left<Math.max(20,X.base*.1);(press?pr.p:pr.n).push(a);if(c==="blunder"||c==="mistake"){if(press)pr.pb++;else pr.nb++}}
    if(["blunder","mistake","miss"].includes(c)){const wb=X.winPct(X.ev[k]),wa=X.winPct(X.ev[k+1]);worst.push({k,loss:Math.round(me==="w"?wb-wa:wa-wb),san:m.san,c})}
  });
  const avg=a=>a.length?[+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1),a.length]:[null,0];
  return {id:g.id,end:g.end,res:g.res,tclass:g.tclass,acc:gacc(accMe),opAcc:gacc(accOp),ph:{o:avg(ph.o),m:avg(ph.m),e:avg(ph.e)},pr:{p:avg(pr.p),n:avg(pr.n),pb:pr.pb,nb:pr.nb},cnt,worst:worst.sort((a,b)=>b.loss-a.loss).slice(0,3),pz:X.puzzles||[],moves:accMe.length};
}
window.renderBatch=function(list){
  loadRes();
  const L=list.filter(g=>g.res!=="abort"&&(!g.rules||g.rules==="chess"));
  $("#pAcc").innerHTML=`<div class="bctl"><span class="sub3" style="margin:0">최근</span><div class="chips" id="bN">${[10,20,50].map(n=>`<button class="chip" data-n="${n}" aria-pressed="${n===B.n}">${n}판</button>`).join("")}</div>
    <button class="bgo" id="bGo">${B.running?"멈추기":"분석 시작"}</button><span class="bprog" id="bProg"></span></div>
    <p class="sub3">브라우저에서 엔진으로 분석해요. 한 판에 10~20초쯤 걸리고, 분석한 판은 저장돼서 다시 하지 않아요.</p><div id="bOut"></div>`;
  $("#bN").onclick=e=>{const b=e.target.closest("[data-n]");if(!b)return;B.n=+b.dataset.n;window.renderBatch(list)};
  $("#bGo").onclick=()=>{if(B.running){B.running=false;$("#bGo").textContent="분석 시작";return}run(L)};
  out(L);
};
async function run(L){
  const T=L.slice(0,B.n),todo=T.filter(g=>!B.res[g.id]);B.running=true;$("#bGo").textContent="멈추기";
  for(let i=0;i<todo.length&&B.running;i++){
    const g=todo[i],pr=$("#bProg");
    const X=await window.batchAnalyse(g,"go depth 11 movetime 250",(a,b)=>{const p=$("#bProg");if(p)p.textContent=`${i+1}/${todo.length}판 · ${a}/${b}수`},()=>B.running);
    if(!B.running)break;
    if(X){B.res[g.id]=summarize(X,g);saveRes()}
    if($("#bOut"))out(L);
  }
  B.running=false;const b=$("#bGo");if(b)b.textContent="분석 시작";const p=$("#bProg");if(p)p.textContent="";
}
function out(L){
  const el=$("#bOut");if(!el)return;
  const R=L.slice(0,B.n).map(g=>B.res[g.id]?{g,r:calR(B.res[g.id])}:null).filter(Boolean);
  if(!R.length){el.innerHTML=`<p class="empty">아직 분석한 판이 없어요.</p>`;return}
  const mean=a=>{a=a.filter(x=>x!=null);return a.length?(a.reduce((x,y)=>x+y,0)/a.length):null};
  const f1=v=>v==null?"–":v.toFixed(1);
  const per=k=>R.reduce((s,x)=>s+(x.r.cnt[k]||0),0)/R.length;
  const wph=k=>{let s=0,n=0;R.forEach(x=>{const [v,c]=x.r.ph[k];if(v!=null){s+=v*c;n+=c}});return n?s/n:null};
  const wpr=k=>{let s=0,n=0;R.forEach(x=>{const [v,c]=x.r.pr[k];if(v!=null){s+=v*c;n+=c}});return [n?s/n:null,n]};
  const [pa,pn]=wpr("p"),[na,nn]=wpr("n"),pb=R.reduce((s,x)=>s+x.r.pr.pb,0),nb=R.reduce((s,x)=>s+x.r.pr.nb,0);
  const accW=mean(R.filter(x=>x.r.res==="win").map(x=>x.r.acc)),accL=mean(R.filter(x=>x.r.res==="loss").map(x=>x.r.acc));
  const bar=(l,v)=>`<div class="hb"><span>${l}</span><span class="t"><i style="width:${v==null?0:v}%;background:var(--acc)"></i></span><span>${f1(v)}</span></div>`;
  const worst=R.flatMap(x=>x.r.worst.map(w=>({g:x.g,w}))).sort((a,b)=>b.w.loss-a.w.loss).slice(0,8);
  const pz=R.flatMap(x=>x.r.pz||[]);
  el.innerHTML=`<div class="sgrid">
    <div class="sc"><h3>요약</h3><div class="big"><div><b>${R.length}</b><small>분석한 판</small></div><div><b>${f1(mean(R.map(x=>x.r.acc)))}</b><small>내 평균 정확도</small></div><div><b>${f1(mean(R.map(x=>x.r.opAcc)))}</b><small>상대 평균</small></div></div>
      <div class="big" style="margin-top:12px"><div><b>${per("blunder").toFixed(1)}</b><small>판당 블런더</small></div><div><b>${per("mistake").toFixed(1)}</b><small>판당 실수</small></div><div><b>${per("inaccuracy").toFixed(1)}</b><small>판당 부정확</small></div></div>
      <div class="big" style="margin-top:12px"><div><b>${R.reduce((s,x)=>s+(x.r.cnt.brilliant||0),0)}</b><small>브릴리언트</small></div><div><b>${R.reduce((s,x)=>s+(x.r.cnt.great||0),0)}</b><small>그레이트</small></div><div><b>${R.reduce((s,x)=>s+(x.r.cnt.miss||0),0)}</b><small>놓침</small></div></div></div>
    <div class="sc"><h3>국면별 정확도</h3>${bar("오프닝",wph("o"))}${bar("미들게임",wph("m"))}${bar("엔드게임",wph("e"))}
      <h3 style="margin-top:16px">결과별 정확도</h3>${bar("이긴 판",accW)}${bar("진 판",accL)}</div>
    <div class="sc"><h3>시간에 쫓길 때</h3>${pn+nn?`${bar("여유 있을 때",na)}${bar("쫓길 때",pa)}<p class="sub3" style="margin-top:10px">실수·블런더 비율: 여유 있을 때 ${nn?(nb/nn*100).toFixed(1):"–"}% · 쫓길 때 ${pn?(pb/pn*100).toFixed(1):"–"}%<br>남은 시간이 10% 또는 20초 아래면 쫓길 때로 셌어요.</p>`:`<p class="empty">시간 기록이 있는 판이 없어요.</p>`}</div>
    <div class="sc full"><h3>정확도 추이</h3><div class="fig" id="bfig" style="height:200px"><svg id="bsvg"></svg></div></div>
    <div class="sc full"><h3>큰 실수</h3>${worst.map((x,i)=>{const n=Math.floor(x.w.k/2)+1,dots=x.w.k%2===0?".":"...";return `<div class="og"><span class="res ${x.g.res}">${RL[x.g.res]||"–"}</span><span class="on">vs ${esc(x.g.op.name)} · <b>${n}${dots} ${esc(x.w.san)}</b> <em>${x.w.c==="blunder"?"블런더":x.w.c==="miss"?"놓침":"실수"} · 승률 −${x.w.loss}%</em></span><span class="od">${new Date(x.g.end*1000).getMonth()+1}.${new Date(x.g.end*1000).getDate()}</span><button class="ab" data-w="${i}">보기</button></div>`}).join("")||'<p class="empty">없음</p>'}
      ${pz.length?`<button class="bgo" id="bPz" style="margin-top:12px">실수 ${pz.length}개 퍼즐로 저장</button>`:""}</div>
  </div>`;
  el.onclick=e=>{
    const w=e.target.closest("[data-w]");if(w){const x=worst[+w.dataset.w];window.openAnalysis(x.g,x.w.k+1);return}
    if(e.target.id==="bPz"){let M=[];try{M=JSON.parse(localStorage.getItem("hansu-mypuz")||"[]")}catch(_){}const ids=new Set(M.map(x=>x.id));let a=0;pz.forEach(p=>{if(!ids.has(p.id)){M.push(p);a++}});try{localStorage.setItem("hansu-mypuz",JSON.stringify(M))}catch(_){}
      e.target.outerHTML=`<p class="sub3" style="margin-top:12px">${a?a+"개 저장함":"이미 저장됨"} · <a href="puzzle.html#mine">퍼즐에서 풀기</a></p>`}
  };
  const svg=$("#bsvg"),draw=()=>{const W=svg.clientWidth,H=svg.clientHeight;if(!W)return;const pts=R.slice().reverse();if(pts.length<2){svg.innerHTML="";return}
    const x=i=>30+(W-40)*i/(pts.length-1),y=v=>10+(H-30)*(1-(v-40)/60),ln=k=>pts.map((p,i)=>p.r[k]==null?"":`${i&&pts[i-1].r[k]!=null?"L":"M"}${x(i).toFixed(1)},${y(Math.max(40,p.r[k])).toFixed(1)}`).join("");
    svg.innerHTML=[50,70,90].map(v=>`<line x1="30" x2="${W-10}" y1="${y(v)}" y2="${y(v)}" stroke="currentColor" stroke-opacity=".12"/><text x="24" y="${y(v)+4}" text-anchor="end" font-size="11" fill="currentColor" fill-opacity=".6">${v}</text>`).join("")
      +`<path d="${ln("opAcc")}" fill="none" stroke="currentColor" stroke-opacity=".35" stroke-width="1.5" stroke-dasharray="4 3"/><path d="${ln("acc")}" fill="none" stroke="#5C54D6" stroke-width="2.2"/>`
      +pts.map((p,i)=>p.r.acc==null?"":`<circle cx="${x(i)}" cy="${y(Math.max(40,p.r.acc))}" r="3.5" fill="${p.r.res==="win"?"var(--win)":p.r.res==="loss"?"var(--loss)":"var(--draw)"}"/>`).join("")};
  draw();if(window.__bro)window.__bro.disconnect();window.__bro=new ResizeObserver(draw);window.__bro.observe($("#bfig"));
}
/* 리포트에서 쓰는 API */
window.BatchAPI={
  results(list){loadRes();return list.map(g=>B.res[g.id]?{g,r:calR(B.res[g.id])}:null).filter(Boolean)},
  running:()=>B.running,
  stop(){B.running=false},
  async ensure(games,onProg){
    loadRes();const todo=games.filter(g=>!B.res[g.id]&&(!g.rules||g.rules==="chess"));B.running=true;
    for(let i=0;i<todo.length&&B.running;i++){
      const g=todo[i];const X=await window.batchAnalyse(g,"go depth 11 movetime 250",(a,b)=>{if(onProg)onProg(i,todo.length,a,b)},()=>B.running);
      if(!B.running)break;if(X){B.res[g.id]=summarize(X,g);saveRes()}
    }
    B.running=false;
  }
};
}
