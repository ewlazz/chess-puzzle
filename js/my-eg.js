/* 내 판의 엔드게임: 체스닷컴 최근 판에서 기물이 7개 이하로 줄어든 뒤 내 수를 테이블베이스로 보고,
   이기던 판을 비기거나 비기던 판을 진 첫 수를 찾아 관련 개념과 연습으로 이어 준다 */
(()=>{
const box=document.getElementById("myEg");if(!box||new URL(location.href).searchParams.get("l"))return;
const TB="https://tablebase.lichess.ovh/standard?fen=",CK="hansu-myeg",F="abcdefgh";
const CON={opp:"오포지션",act:"킹 앞세우기",key:"핵심 칸",square:"스퀘어 규칙",rookp:"룩 폰",stale:"스테일메이트 함정",lucena:"루세나",philidor:"필리도르",cutoff:"킹 차단",vancura:"바쿠라",rookpawnr:"룩 a폰",rvp:"룩 대 폰",qvp:"퀸 대 7단 폰",wrongb:"잘못된 색 비숍",longside:"긴 쪽 방어"};
const PRAC={kq:"퀸 메이트",kr:"룩 메이트",kbn:"비숍+나이트 메이트",kbb:"비숍 두 개 메이트"};
const load=()=>{try{return JSON.parse(localStorage.getItem(CK)||"{}")}catch(e){return {}}};
const save=o=>{try{localStorage.setItem(CK,JSON.stringify(o))}catch(e){}};
const tbc=new Map();
async function tb(fen){const k=fen.split(" ").slice(0,4).join(" ");if(tbc.has(k))return tbc.get(k);
  for(let t=0;t<4;t++){const r=await fetch(TB+encodeURIComponent(k+" 0 1")).catch(()=>null);
    if(r&&r.status===429){await new Promise(x=>setTimeout(x,1500*(t+1)));continue}
    if(!r||!r.ok)return null;const j=await r.json();tbc.set(k,j);return j}return null}
const cnt=f=>f.split(" ")[0].replace(/[^a-z]/gi,"").length;
const pieces=(fen,c)=>{const o=[];fen.split(" ")[0].split("/").forEach((r,i)=>{let f=0;for(const ch of r){if(/\d/.test(ch))f+=+ch;else{const w=ch===ch.toUpperCase();if((c==="w")===w)o.push({t:ch.toLowerCase(),sq:F[f]+(8-i)});f++}}});return o};

/* 자리 → 관련 개념 (대략적인 분류) */
function concept(fen,me,san,stale){if(stale)return {c:"stale"};
  const op=me==="w"?"b":"w",A=pieces(fen,me),B=pieces(fen,op),a=A.filter(p=>p.t!=="k").map(p=>p.t).sort().join(""),b=B.filter(p=>p.t!=="k").map(p=>p.t).sort().join("");
  const pawnOnly=/^p*$/.test(a)&&/^p*$/.test(b);
  if(pawnOnly){const g=new Chess(fen),bm=g.move(san);
    const passed=(P,Q,c)=>P.filter(p=>p.t==="p").some(p=>{const f=F.indexOf(p.sq[0]),r=+p.sq[1];return !Q.some(q=>q.t==="p"&&Math.abs(F.indexOf(q.sq[0])-f)<=1&&(c==="w"?+q.sq[1]>r:+q.sq[1]<r))});
    if(passed(B,A,op)&&(!a.includes("p")||(bm&&(bm.captured||bm.piece==="k"))&&bm.captured))return {c:"square"};
    if(bm&&bm.piece==="k"&&!bm.captured){const K=pieces(g.fen(),me).find(p=>p.t==="k"),O=pieces(g.fen(),op).find(p=>p.t==="k"),df=Math.abs(F.indexOf(K.sq[0])-F.indexOf(O.sq[0])),dr=Math.abs(+K.sq[1]-+O.sq[1]);
      if((df===0&&dr%2===0)||(dr===0&&df%2===0)||(df===dr&&df%2===0))return {c:"opp"}}
    if(!b.includes("p")){const rp=A.filter(p=>p.t==="p").every(p=>p.sq[0]==="a"||p.sq[0]==="h");return {c:rp?"rookp":"key"}}
    if(passed(B,A,op))return {c:"square"};
    return {c:"act"}}
  if(a==="pr"&&b==="r"){const p=A.find(x=>x.t==="p"),rk=me==="w"?+p.sq[1]:9-+p.sq[1];if(p.sq[0]==="a"||p.sq[0]==="h")return {c:"rookpawnr"};return {c:rk>=6?"lucena":"cutoff"}}
  if(a==="r"&&b==="pr"){const p=B.find(x=>x.t==="p");if(p.sq[0]==="a"||p.sq[0]==="h")return {c:"vancura"};const rk=op==="w"?+p.sq[1]:9-+p.sq[1];return {c:rk>=6?"longside":"philidor"}}
  if(/^r$/.test(a)&&/^p+$/.test(b))return {c:"rvp"};
  if(/^p+$/.test(a)&&b==="r")return {c:"rvp"};
  if(a==="q"&&/^p$/.test(b))return {c:"qvp"};
  if(a==="bp"&&!b)return {c:"wrongb"};
  if(a==="q"&&!b)return {p:"kq"};if(a==="r"&&!b)return {p:"kr"};if(a==="bn"&&!b)return {p:"kbn"};if(a==="bb"&&!b)return {p:"kbb"};
  return {}}

/* 체스닷컴 PGN에서 수만 뽑아 판을 다시 둠 (시계 주석 등은 버림) */
function replay(pgn){const fm=/\[FEN "([^"]+)"\]/.exec(pgn||"");const mt=(pgn||"").split("\n").filter(l=>!l.startsWith("[")).join(" ").replace(/\{[^}]*\}/g," ").replace(/\([^)]*\)/g," ").replace(/\$\d+/g," ").replace(/\d+\.(\.\.)?/g," ").replace(/1-0|0-1|1\/2-1\/2|\*/g," ");
  const c=fm?new Chess(fm[1]):new Chess(),H=[];for(const t of mt.split(/\s+/).filter(Boolean)){const m=c.move(t,{sloppy:true});if(!m)break;H.push(m)}return {c,H,start:fm?fm[1]:null}}
async function scanGame(g,me){
  const {H,start}=replay(g.pgn);const w=start?new Chess(start):new Chess();
  const myC=(g.white.username||"").toLowerCase()===me?"w":"b";let found=null,checked=0;
  for(let i=0;i<H.length;i++){const before=w.fen();const mv=H[i];
    if(w.turn()===myC&&cnt(before)<=7){checked++;const j=await tb(before);if(!j)return {err:1};
      const cat=j.category,m=j.moves.find(x=>x.uci===mv.from+mv.to+(mv.promotion||""));
      if(m&&(cat==="win"||cat==="draw")){const after=m.category;/* 내 수 뒤, 상대 입장 결과 */
        const lost=cat==="win"?after!=="loss":after==="win";
        if(lost){const good=j.moves.filter(x=>cat==="win"?x.category==="loss":x.category==="draw"||x.category==="loss").map(x=>x.san);
          w.move(mv);const st=w.in_stalemate();w.undo();
          found={fen:before,ply:i,san:mv.san,from:cat,to:cat==="win"?(after==="win"?"loss":"draw"):"loss",good:good.slice(0,3),me:myC,
            op:myC==="w"?g.black.username:g.white.username,url:g.url,end:g.end_time,k:concept(before,myC,good[0]||mv.san,st&&cat==="win")};break}}
      if(checked>60)break}
    w.move(mv)}
  return found||{none:1}}

function card(x){const no=Math.floor(x.ply/2)+1,dots=x.me==="w"?".":"...",d=new Date(x.end*1000);
  const res={win:"이기던 판",draw:"비기던 판"}[x.from]+" → "+(x.to==="loss"?"짐":"비김");
  const k=x.k||{},cl=k.c?`<a class="btn" href="learn.html?c=${k.c}">개념: ${CON[k.c]}</a>`:k.p?`<a class="btn" href="endgame.html?l=${k.p}">${PRAC[k.p]} 연습</a>`:"";
  return `<div class="myeg">${miniBoard(x.fen,x.me,null)}<div><p class="mt"><b>${res}</b> · vs ${esc(x.op)} · ${d.getMonth()+1}/${d.getDate()}</p>
    <p class="mm">${no}${dots} ${esc(x.san)} <span>좋은 수 ${x.good.map(esc).join(", ")||"없음"}</span></p>
    <div class="eacts">${cl}<a class="btn main" href="endgame.html?fen=${encodeURIComponent(x.fen)}&want=${x.from==="win"?"win":"draw"}">이 자리 연습</a><a class="lnk" href="${x.url}" target="_blank" rel="noopener">게임</a></div></div></div>`}

function draw(state){const me=window.ME&&ME.get(),C=load();
  if(!me){box.innerHTML=`<h2 class="gsec">내 판의 엔드게임</h2><p class="myeg-n">체스닷컴 닉네임을 연결하면 최근 판에서 엔드게임 실수를 찾아 줘요.</p><form class="mcf" id="myegF"><input name="u" placeholder="체스닷컴 닉네임" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="체스닷컴 닉네임"><button>연결</button></form>`;
    $("#myegF").onsubmit=async e=>{e.preventDefault();const u=e.target.u.value.trim();if(!u)return;try{const r=await fetch("https://api.chess.com/pub/player/"+encodeURIComponent(u.toLowerCase()));if(!r.ok)throw 0;const j=await r.json();ME.set(j.username||u);draw()}catch(_){e.target.u.setCustomValidity("없는 닉네임이에요");e.target.u.reportValidity();e.target.u.oninput=()=>e.target.u.setCustomValidity("")}};return}
  const mine=C.user===me.toLowerCase()?C:{user:me.toLowerCase(),g:{}};const L=Object.values(mine.g).filter(x=>x&&x.fen).sort((a,b)=>b.end-a.end);L.forEach(x=>{if(!(x.k&&x.k.c==="stale"))try{x.k=concept(x.fen,x.me,x.good[0]||x.san,false)}catch(_){}});
  const n=Object.keys(mine.g).length;
  box.innerHTML=`<h2 class="gsec">내 판의 엔드게임</h2><p class="myeg-n">${state||(n?`최근 판 ${n}개를 봤어요. 기물이 7개 이하로 줄어든 뒤 결과가 바뀐 수만 보여 줘요.`:"최근 판에서 기물이 7개 이하로 줄어든 엔드게임을 찾아 테이블베이스로 확인해요.")}</p>
    ${L.length?`<div class="myegs">${L.slice(0,12).map(card).join("")}</div>`:n&&!state?`<p class="myeg-n">찾은 실수가 없어요.</p>`:""}
    <div class="eacts"><button class="pri" id="myegGo"${state?" disabled":""}>${n?"새 판 더 보기":"최근 판 살펴보기"}</button></div>`;
  const b=$("#myegGo");if(b)b.onclick=run}

let busy=false;
async function run(){if(busy)return;busy=true;const me=ME.get().toLowerCase(),C=load();if(C.user!==me){C.user=me;C.g={}}
  try{draw("최근 판을 불러오는 중…");const ar=await (await fetch(`https://api.chess.com/pub/player/${encodeURIComponent(me)}/games/archives`)).json();
    const months=(ar.archives||[]).slice(-3).reverse();let games=[];
    for(const u of months){const j=await (await fetch(u)).json();games=games.concat((j.games||[]).filter(x=>x.rules==="chess"&&x.pgn));if(games.length>=150)break}
    games.sort((a,b)=>b.end_time-a.end_time);const todo=games.filter(x=>!(x.url in C.g)).slice(0,80);let done=0,hits=0;
    for(const g of todo){done++;
      /* 7개 이하로 줄지 않은 판은 테이블베이스를 부르지 않고 넘김 */
      const fin=replay(g.pgn).c.fen();
      if(cnt(fin)>7){C.g[g.url]=0;continue}
      draw(`판 ${done} / ${todo.length} 확인 중… 찾은 실수 ${hits}개`);
      const r=await scanGame(g,me);if(r&&r.err){break}C.g[g.url]=r&&r.fen?r:0;if(r&&r.fen)hits++;save(C)}
    save(C);busy=false;draw()}
  catch(e){busy=false;draw("체스닷컴이나 테이블베이스에 연결하지 못했어요. 잠시 뒤 다시 해 주세요.");const b=$("#myegGo");if(b)b.disabled=false}}
draw();
})();
