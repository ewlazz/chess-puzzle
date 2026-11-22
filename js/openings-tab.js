/* 전적 > 오프닝: 첫 수, 정석 이탈, 오프닝별 성적, 레퍼토리 트리, 엔진 점검 */
{
const F="abcdefgh",START="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",DEPTH=24;
const O={color:"w",path:[],list:[],token:0,etok:0};
const RL={win:"승",loss:"패",draw:"무"};
const HOWS={checkmated:"메이트",timeout:"시간",resigned:"기권",abandoned:"탈주"};
function toks(pgn){let b=(pgn||"").replace(/^\[[^\]]*\]\s*$/gm,"");while(/\([^()]*\)/.test(b))b=b.replace(/\([^()]*\)/g," ");
  return b.replace(/\{[^}]*\}/g," ").replace(/;[^\n]*/g," ").replace(/\$\d+/g," ").replace(/\d+\.(\.\.)?/g," ").replace(/1-0|0-1|1\/2-1\/2|\*/g," ").trim().split(/\s+/).filter(Boolean)}
function prep(g){
  if(g._o!==undefined)return g._o;
  if((g.rules&&g.rules!=="chess")||(g.setup&&g.setup!==START)){g._o=null;return null}
  const c=new Chess(),t=toks(g.pgn),san=[],fens=[c.fen()];
  for(let i=0;i<t.length&&i<DEPTH;i++){const m=c.move(t[i],{sloppy:true});if(!m)break;san.push(m.san);fens.push(c.fen())}
  const ol=Openings.line(fens);
  g._o={san,fens,book:ol.book,name:ol.name||g.open||"",eco:ol.eco,fam:Openings.family(ol.name)||g.fam||"",len:Math.ceil(t.length/2),dev:ol.book<san.length?(ol.book%2===0?"w":"b"):null};
  return g._o;
}
function rec(a){let w=0,d=0,l=0,o=0;a.forEach(g=>{if(g.res==="win")w++;else if(g.res==="draw")d++;else l++;o+=+g.op.rating||0});const n=a.length;
  return {n,w,d,l,score:n?(w+d/2)/n*100:0,opp:n?Math.round(o/n):0,perf:n?Math.round(o/n+400*(w-l)/n):0}}
const pct=r=>r.n?Math.round(r.score)+"%":"–";
const num=(i,s)=>i%2===0?`${(i>>1)+1}. ${s}`:`${(i>>1)+1}... ${s}`;
const pathText=p=>p.map((s,i)=>i%2===0?`${(i>>1)+1}. ${s}`:s).join(" ");
function fenOf(path){const c=new Chess();for(const s of path)c.move(s);return c}
/* 엔진 (탭 전용, 순서대로 계산) */
const OE={w:null,ready:null,q:Promise.resolve(),cache:new Map(),cb:null,
  init(){if(this.ready)return this.ready;this.ready=new Promise((res,rej)=>{try{this.w=new Worker("engine/stockfish-19-lite-single.js")}catch(e){rej(e);return}
    this.w.onerror=rej;let ok=false;this.w.onmessage=e=>{const l=String(e.data);if(l==="uciok"){this.w.postMessage("setoption name Hash value 16");this.w.postMessage("isready")}else if(l==="readyok"){if(!ok){ok=true;res()}}else if(this.cb)this.cb(l)};this.w.postMessage("uci")});return this.ready},
  eval(fen,depth,tok){
    const k=fen+"|"+depth;if(this.cache.has(k))return Promise.resolve(this.cache.get(k));
    const p=this.q.then(()=>this.init()).then(()=>new Promise(res=>{
      if(tok!=null&&tok!==O.etok){res(null);return}
      let sc=null;this.cb=l=>{if(l.startsWith("info")&&l.includes(" pv ")&&!/bound/.test(l)){const m=/score (cp|mate) (-?\d+)/.exec(l);if(m)sc={t:m[1],v:+m[2]}}
        else if(l.startsWith("bestmove")){this.cb=null;const r={sc:sc||{t:"cp",v:0},best:l.split(" ")[1]};this.cache.set(k,r);res(r)}};
      this.w.postMessage("position fen "+fen);this.w.postMessage("go depth "+depth);
    })).catch(()=>null);
    this.q=p;return p;
  }
};
const toWhite=(sc,turn)=>{let v=sc.t==="mate"?(sc.v>0?1:-1)*(10000-Math.abs(sc.v)*10):sc.v;return turn==="w"?v:-v};
const evTxt=cp=>Math.abs(cp)>=9000?(cp>0?"M":"-M"):(cp>0?"+":"")+(cp/100).toFixed(2);
/* 진입 */
window.renderOpenings=async function(list){
  const t=++O.token,el=$("#pOpen");
  el.innerHTML='<p class="empty" id="oSt">정리 중…</p>';
  await Openings.load();
  let t0=performance.now();
  for(let i=0;i<list.length;i++){prep(list[i]);if(performance.now()-t0>40){const s=$("#oSt");if(s)s.textContent=`정리 중 ${i+1}/${list.length}`;await new Promise(r=>{const c=new MessageChannel();c.port1.onmessage=()=>r();c.port2.postMessage(0)});t0=performance.now();if(t!==O.token)return}}
  if(t!==O.token)return;
  O.list=list.filter(g=>g._o&&g.res!=="abort");
  draw();
};
function mine(){return O.list.filter(g=>g.me===O.color)}
function draw(){
  const L=mine();
  if(!O.list.length){$("#pOpen").innerHTML='<p class="empty">게임이 없어요.</p>';return}
  let h=`<div class="oseg"><div class="chips" id="oCol"><button class="chip" data-v="w" aria-pressed="${O.color==="w"}">백</button><button class="chip" data-v="b" aria-pressed="${O.color==="b"}">흑</button></div><span class="range">${L.length}판</span></div>`;
  if(!L.length){$("#pOpen").innerHTML=h+'<p class="empty">이 색으로 둔 게임이 없어요.</p>';bindCol();return}
  h+=`<div class="sgrid">${firstCard(L)}${devCard(L)}${famCard(L)}</div>`;
  h+=`<div class="sc full otree"><h3>레퍼토리 트리</h3><div class="crumb" id="oCrumb"></div>
    <div class="ogrid"><div class="obw"><div class="ob8" id="ob8"></div><p class="oname" id="oName"></p><p class="oeng" id="oEng"></p></div>
    <div class="otw"><div class="scroll"><table class="ot" id="oTab"></table></div><h4>이 수순으로 둔 게임</h4><div id="oGames"></div></div></div></div>`;
  h+=`<div class="sc full"><h3>고칠 만한 수</h3><p class="sub3">세 판 이상 둔 내 수 중에서 엔진 평가가 크게 떨어지는 수를 찾아요.</p><button class="ab oscan" id="oScan">엔진으로 점검</button><div id="oScanOut"></div></div>`;
  $("#pOpen").innerHTML=h;bindCol();
  $("#pOpen").onclick=onClick;
  drawTree();
}
function bindCol(){$("#oCol").onclick=e=>{const b=e.target.closest("button");if(!b)return;O.color=b.dataset.v;O.path=[];draw()}}
function group(a,key){const m=new Map();a.forEach(g=>{const k=key(g);if(k==null||k==="")return;if(!m.has(k))m.set(k,[]);m.get(k).push(g)});return [...m.entries()].sort((x,y)=>y[1].length-x[1].length)}
const row=(name,sub,r,attr)=>`<div class="row"${attr||""}><span class="n">${name}<em>${sub}</em></span>${window.wdlBar(r.w,r.d,r.l)}<span class="pct">${pct(r)}</span></div>`;
function firstCard(L){
  if(O.color==="w"){
    const g=group(L,x=>x._o.san[0]);
    return `<div class="sc"><h3>첫 수</h3>${g.slice(0,6).map(([k,a])=>{const r=rec(a);return row(esc("1. "+k),`${r.n}판 · ${Math.round(r.n/L.length*100)}%`,r,` data-path="${esc(k)}"`)}).join("")}</div>`;
  }
  const g=group(L,x=>x._o.san[0]);
  return `<div class="sc"><h3>상대 첫 수별 내 대응</h3>${g.slice(0,4).map(([k,a])=>{const r=rec(a);
    const sub=group(a,x=>x._o.san[1]).slice(0,3).map(([k2,a2])=>{const r2=rec(a2);return row(`<span class="ind">… ${esc(k2)}</span>`,`${r2.n}판`,r2,` data-path="${esc(k+" "+k2)}"`)}).join("");
    return row(`<b>1. ${esc(k)}</b>`,`${r.n}판`,r,` data-path="${esc(k)}"`)+sub}).join("")}</div>`;
}
function devCard(L){
  const a=L.filter(g=>g._o.dev),avg=a.length?a.reduce((s,g)=>s+g._o.book,0)/a.length:0;
  const me=rec(a.filter(g=>g._o.dev===O.color)),op=rec(a.filter(g=>g._o.dev!==O.color));
  const early=rec(a.filter(g=>g._o.book<6)),late=rec(a.filter(g=>g._o.book>=10));
  return `<div class="sc"><h3>정석 이탈</h3><div class="big"><div><b>${avg?(avg/2).toFixed(1)+"수":"–"}</b><small>평균 이탈 지점</small></div><div><b>${me.n}</b><small>내가 먼저</small></div><div><b>${op.n}</b><small>상대가 먼저</small></div></div>
    ${row("내가 먼저 이탈",me.n+"판",me)}${row("상대가 먼저 이탈",op.n+"판",op)}${early.n?row("3수 안에 이탈",early.n+"판",early):""}${late.n?row("5수 넘게 정석",late.n+"판",late):""}</div>`;
}
function famCard(L){
  const g=group(L,x=>x._o.fam).filter(([k,a])=>a.length>=2).slice(0,14);
  const el=g.filter(([k,a])=>a.length>=5).map(([k,a])=>[k,rec(a).score]);
  const best=el.length>1?el.reduce((x,y)=>y[1]>x[1]?y:x)[0]:null,worst=el.length>1?el.reduce((x,y)=>y[1]<x[1]?y:x)[0]:null;
  const rows=g.map(([k,a])=>{const r=rec(a),len=Math.round(a.reduce((s,x)=>s+x._o.len,0)/a.length);
    const hw=group(a.filter(x=>x.res!=="draw"),x=>(x.res==="win"?"승·":"패·")+x.how)[0];
    const tag=k===best?'<span class="tg good">강함</span>':k===worst?'<span class="tg bad">약함</span>':"";
    return `<tr data-fam="${esc(k)}"><td class="fn">${esc(k)}${tag}</td><td>${r.n}</td><td class="wb">${window.wdlBar(r.w,r.d,r.l)}</td><td>${pct(r)}</td><td>${r.perf}</td><td>${len}</td><td class="hw">${hw?esc(hw[0])+" "+hw[1].length:"–"}</td></tr>`}).join("");
  return `<div class="sc full"><h3>오프닝별 성적</h3><div class="scroll"><table class="ft"><thead><tr><th>오프닝</th><th>판</th><th></th><th>점수</th><th>퍼포먼스</th><th>평균 수</th><th>많이 끝난 방식</th></tr></thead><tbody>${rows||'<tr><td colspan="7">두 판 이상 둔 오프닝이 없어요.</td></tr>'}</tbody></table></div></div>`;
}
/* 트리 */
function atPath(){const p=O.path;return mine().filter(g=>{const s=g._o.san;if(s.length<p.length)return false;for(let i=0;i<p.length;i++)if(s[i]!==p[i])return false;return true})}
function drawTree(){
  const et=++O.etok,G=atPath(),p=O.path,i=p.length,mover=i%2===0?"w":"b",isMine=mover===O.color;
  $("#oCrumb").innerHTML=`<button data-cut="0">시작</button>`+p.map((s,k)=>`<span>›</span><button data-cut="${k+1}">${esc(num(k,s))}</button>`).join("");
  const c=fenOf(p),fen=c.fen(),hist=c.history({verbose:true}),last=hist[hist.length-1];
  drawBoard(c,last);
  const op=Openings.at(fen)||null;let nm=null;for(let k=p.length;k>=0&&!nm;k--){const a=Openings.at(fenOf(p.slice(0,k)).fen());if(a&&a.name)nm=a}
  $("#oName").innerHTML=(nm?`${esc(nm.eco)} · ${esc(nm.name)}${op?"":" (정석 밖)"}`:"")+` <a class="olink" href="opening.html?line=${encodeURIComponent(p.join(","))}">오프닝 페이지에서 보기</a>`;
  const ch=group(G,g=>g._o.san[i]);
  const tot=ch.reduce((s,[k,a])=>s+a.length,0)||1;
  $("#oTab").innerHTML=ch.length?`<thead><tr><th>${isMine?"내 수":"상대 수"}</th><th>판</th><th></th><th>점수</th><th>퍼포먼스</th><th>평균 상대</th><th>엔진</th></tr></thead><tbody>`+ch.map(([k,a],j)=>{const r=rec(a);
    return `<tr data-move="${esc(k)}"><td class="mvn">${esc(num(i,k))}</td><td>${r.n} <em>${Math.round(r.n/tot*100)}%</em></td><td class="wb">${window.wdlBar(r.w,r.d,r.l)}</td><td>${pct(r)}</td><td>${r.perf}</td><td>${r.opp}</td><td class="ev" id="oev${j}">…</td></tr>`}).join("")+"</tbody>":`<tbody><tr><td class="empty">이 뒤로 둔 게임이 없어요.</td></tr></tbody>`;
  $("#oGames").innerHTML=G.slice(0,8).map(g=>{const d=new Date(g.end*1000);return `<div class="og"><span class="res ${g.res}">${RL[g.res]||"–"}</span><span class="on">${esc(g.op.name)} <em>${g.op.rating}</em></span><span class="od">${d.getMonth()+1}.${d.getDate()}</span><button class="ab" data-gid="${esc(g.id)}">분석</button></div>`}).join("")||'<p class="empty">없음</p>';
  // 엔진
  $("#oEng").textContent="엔진 계산 중…";
  if(c.game_over()){$("#oEng").textContent="";ch.forEach((x,j)=>{$("#oev"+j).textContent="–"});return}
  OE.eval(fen,15,et).then(r=>{
    if(!r||et!==O.etok)return;
    const turn=c.turn(),wc=toWhite(r.sc,turn);let bs="";
    if(r.best&&r.best!=="(none)"){const t=new Chess(fen),m=t.move({from:r.best.slice(0,2),to:r.best.slice(2,4),promotion:r.best[4]||"q"});if(m)bs=m.san}
    $("#oEng").innerHTML=`엔진 <b>${evTxt(wc)}</b>${bs?` · 최선 <b>${esc(bs)}</b>`:""}`;
    const bestMover=turn==="w"?wc:-wc;
    ch.slice(0,8).forEach(([k,a],j)=>{
      const t=new Chess(fen);t.move(k);
      if(t.game_over()){$("#oev"+j).textContent=t.in_checkmate()?"#":"=";return}
      OE.eval(t.fen(),13,et).then(r2=>{if(!r2||et!==O.etok)return;const w2=toWhite(r2.sc,t.turn()),mv=turn==="w"?w2:-w2,loss=bestMover-mv;
        const cell=$("#oev"+j);if(!cell)return;cell.innerHTML=`${evTxt(w2)}${isMine&&loss>=70?` <span class="tg bad" title="최선보다 손해">${(-loss/100).toFixed(1)}</span>`:""}`});
    });
    ch.slice(8).forEach((x,j)=>{const cell=$("#oev"+(j+8));if(cell)cell.textContent=""});
  });
}
function drawBoard(c,last){
  const o=O.color,sq=[];for(let r=0;r<8;r++)for(let k=0;k<8;k++)sq.push(F[o==="w"?k:7-k]+(o==="w"?8-r:r+1));
  $("#ob8").innerHTML=sq.map((s,n)=>{const p=c.get(s),dark=(F.indexOf(s[0])+ +s[1])%2===1,lm=last&&(last.from===s||last.to===s)?" lm":"";
    const co=(n%8===0?`<span class="co r">${s[1]}</span>`:"")+(n>=56?`<span class="co f">${s[0]}</span>`:"");
    return `<div class="s8 ${dark?"d":"l"}${lm}">${co}${p?`<i class="pc ${p.color}${p.type}"></i>`:""}</div>`}).join("");
}
function onClick(e){
  const t=e.target.closest("[data-move],[data-cut],[data-path],[data-gid],[data-fam],#oScan,[data-spath]");if(!t)return;
  if(t.id==="oScan"){scan();return}
  if(t.dataset.gid){const g=O.list.find(x=>x.id===t.dataset.gid);if(g)window.openAnalysis(g);return}
  if(t.dataset.move!=null){O.path=O.path.concat(t.dataset.move);drawTree();return}
  if(t.dataset.cut!=null){O.path=O.path.slice(0,+t.dataset.cut);drawTree();return}
  if(t.dataset.path!=null){O.path=t.dataset.path.split(" ");drawTree();$(".otree").scrollIntoView({behavior:"smooth",block:"start"});return}
  if(t.dataset.spath!=null){O.path=t.dataset.spath?t.dataset.spath.split(" "):[];drawTree();$(".otree").scrollIntoView({behavior:"smooth",block:"start"});return}
  if(t.dataset.fam!=null){const a=mine().filter(g=>g._o.fam===t.dataset.fam);if(!a.length)return;
    /* 그 오프닝 게임들이 공통으로 지나간 가장 긴 수순으로 이동 */
    let p=[];for(let i=0;i<DEPTH;i++){const s=a[0]._o.san[i];if(!s||!a.every(g=>g._o.san[i]===s))break;p.push(s)}
    O.path=p;drawTree();$(".otree").scrollIntoView({behavior:"smooth",block:"start"})}
}
/* 엔진 점검: 세 판 이상 둔 내 수 중 손해가 큰 수 */
async function scan(){
  const out=$("#oScanOut"),btn=$("#oScan");btn.disabled=true;
  const cnt=new Map();
  mine().forEach(g=>{const s=g._o.san;for(let i=0;i<Math.min(s.length,16);i++){if((i%2===0?"w":"b")!==O.color)continue;const k=s.slice(0,i).join(" ")+"|"+s[i];const v=cnt.get(k)||{n:0,g:[]};v.n++;v.g.push(g);cnt.set(k,v)}});
  const cand=[...cnt.entries()].filter(([k,v])=>v.n>=3).sort((a,b)=>b[1].n-a[1].n).slice(0,24);
  const found=[];
  for(let j=0;j<cand.length;j++){
    out.innerHTML=`<p class="sub3">점검 중 ${j+1}/${cand.length}</p>`+list(found);
    const [k,v]=cand[j],[ps,mv]=k.split("|"),path=ps?ps.split(" "):[];
    const c=fenOf(path),fen=c.fen(),turn=c.turn();
    const r=await OE.eval(fen,14);if(!r)continue;
    const t=new Chess(fen),mo=t.move(mv);if(!mo)continue;
    if(t.game_over())continue;
    const r2=await OE.eval(t.fen(),13);if(!r2)continue;
    const b=turn==="w"?toWhite(r.sc,turn):-toWhite(r.sc,turn),a=turn==="w"?toWhite(r2.sc,t.turn()):-toWhite(r2.sc,t.turn()),loss=b-a;
    if(loss>=60&&r.best&&r.best.slice(0,4)!==mo.from+mo.to){
      const bb=new Chess(fen),bm=bb.move({from:r.best.slice(0,2),to:r.best.slice(2,4),promotion:r.best[4]||"q"});
      found.push({path,mv,n:v.n,score:rec(v.g),loss,best:bm?bm.san:r.best});
    }
  }
  out.innerHTML=found.length?list(found):'<p class="sub3">크게 손해 보는 수는 없었어요.</p>';btn.disabled=false;
  function list(f){return f.sort((x,y)=>y.loss*y.n-x.loss*x.n).map(x=>`<div class="row" data-spath="${esc(x.path.join(" "))}"><span class="n">${esc(pathText(x.path))} <b>${esc(num(x.path.length,x.mv))}</b><em>${x.n}판 · 손해 ${(x.loss/100).toFixed(1)} · 최선 ${esc(x.best)}</em></span>${window.wdlBar(x.score.w,x.score.d,x.score.l)}<span class="pct">${pct(x.score)}</span></div>`).join("")}
}
}
