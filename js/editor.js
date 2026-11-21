/* 분석 페이지: PGN·FEN·리체스 링크 붙여넣기, 보드 에디터 */
{
const F="abcdefgh",START="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const msg=t=>{$("#msg").textContent=t||""};
/* 탭 */
function tab(t){document.querySelectorAll(".top .tab").forEach(b=>b.setAttribute("aria-selected",b.dataset.t===t));$("#tPaste").hidden=t!=="paste";$("#tEdit").hidden=t!=="edit";if(t==="edit")render()}
document.querySelectorAll(".top .tab").forEach(b=>b.onclick=()=>tab(b.dataset.t));
/* 붙여넣기 */
const stripVar=s=>{while(/\([^()]*\)/.test(s))s=s.replace(/\([^()]*\)/g," ");return s};
function headers(pgn){const h={};for(const m of pgn.matchAll(/\[(\w+)\s+"([^"]*)"\]/g))h[m[1]]=m[2];return h}
const isFen=t=>/^([pnbrqkPNBRQK1-8]+\/){7}[pnbrqkPNBRQK1-8]+(\s+[wb](\s+(-|[KQkq]+)(\s+(-|[a-h][36])(\s+\d+\s+\d+)?)?)?)?$/.test(t.trim());
function fullFen(t){const p=t.trim().split(/\s+/);return [p[0],p[1]||"w",p[2]||"-",p[3]||"-",p[4]||"0",p[5]||"1"].join(" ")}
function fenProblem(f){
  const c=new Chess(),v=c.validate_fen(f);if(!v.valid)return "FEN 형식이 맞지 않아요.";
  const rows=f.split(" ")[0].split("/");
  const cnt=ch=>(f.split(" ")[0].match(new RegExp(ch,"g"))||[]).length;
  if(cnt("K")!==1||cnt("k")!==1)return "킹은 양쪽에 하나씩 있어야 해요.";
  if(/[pP]/.test(rows[0])||/[pP]/.test(rows[7]))return "폰은 첫째·여덟째 줄에 둘 수 없어요.";
  const p=f.split(" ");p[1]=p[1]==="w"?"b":"w";p[3]="-";const o=new Chess(p.join(" "));
  if(o.in_check())return "차례가 아닌 쪽 킹이 체크 상태예요.";
  return "";
}
function gameFromPgn(pgn,url,linkText,me){
  const h=headers(pgn),body=stripVar(pgn.replace(/^\[[^\]]*\]\s*$/gm,""));
  const t=new Chess();if(h.FEN&&!t.load(h.FEN))return null;
  const toks=body.replace(/\{[^}]*\}/g," ").replace(/;[^\n]*/g," ").replace(/\$\d+/g," ").replace(/\d+\.(\.\.)?/g," ").replace(/1-0|0-1|1\/2-1\/2|\*/g," ").trim().split(/\s+/).filter(Boolean);
  let n=0;for(const x of toks){if(!t.move(x,{sloppy:true}))break;n++}
  if(!n&&!h.FEN)return null;
  me=me||"w";
  const W={name:h.White&&h.White!=="?"?h.White:"백",rating:h.WhiteElo&&h.WhiteElo!=="?"?h.WhiteElo:""},B={name:h.Black&&h.Black!=="?"?h.Black:"흑",rating:h.BlackElo&&h.BlackElo!=="?"?h.BlackElo:""};
  const r=h.Result,wr=r==="1-0"?"win":r==="0-1"?"loss":r==="1/2-1/2"?"draw":"";
  const res=me==="w"?wr:wr==="win"?"loss":wr==="loss"?"win":wr;
  return {id:"paste",url:url||"",linkText,pgn,tc:h.TimeControl||"",rules:"chess",me,res,how:"",my:me==="w"?W:B,op:me==="w"?B:W,acc:null,setup:h.FEN||"",
    title:`${W.name} vs ${B.name}${r&&r!=="*"?" · "+r:""}`};
}
function gameFromFen(f){const me=f.split(" ")[1];return {id:"fen",url:"",pgn:"",tc:"",rules:"chess",me,res:"",how:"",my:{name:me==="w"?"백":"흑",rating:""},op:{name:me==="w"?"흑":"백",rating:""},acc:null,setup:f,title:"포지션 분석"}}
$("#go").onclick=async()=>{
  const t=$("#pgn").value.trim();if(!t){msg("붙여 넣은 게 없어요.");return}
  msg("");
  const li=/lichess\.org\/(?:embed\/(?:game\/)?)?([A-Za-z0-9]{8})(?:[A-Za-z0-9]{4})?(\/black)?/.exec(t);
  if(li&&t.length<120){
    msg("불러오는 중…");
    try{const r=await fetch(`https://lichess.org/game/export/${li[1]}?clocks=true&evals=false`,{headers:{Accept:"application/x-chess-pgn"}});if(!r.ok)throw 0;
      const g=gameFromPgn(await r.text(),"https://lichess.org/"+li[1],"리체스에서 보기",li[2]?"b":"w");if(!g)throw 0;msg("");window.openAnalysis(g)}
    catch(e){msg("리체스 게임을 불러오지 못했어요.")}
    return;
  }
  if(/chess\.com\//.test(t)&&t.length<200){msg("체스닷컴 링크는 안 돼요. 전적에서 찾거나 PGN을 붙여 넣으세요.");return}
  if(isFen(t)){const f=fullFen(t),e=fenProblem(f);if(e){msg(e);return}window.openAnalysis(gameFromFen(f));return}
  const g=gameFromPgn(t);if(!g){msg("PGN을 읽지 못했어요.");return}
  window.openAnalysis(g);
};
$("#toEdit").onclick=()=>{const t=$("#pgn").value.trim();if(t&&isFen(t))load(fullFen(t));else if(t){const g=gameFromPgn(t);if(g){const c=new Chess();if(g.setup)c.load(g.setup);for(const x of stripVar(t.replace(/^\[[^\]]*\]\s*$/gm,"")).replace(/\{[^}]*\}/g," ").replace(/\d+\.(\.\.)?/g," ").replace(/1-0|0-1|1\/2-1\/2|\*/g," ").trim().split(/\s+/)){if(!c.move(x,{sloppy:true}))break}load(c.fen())}}tab("edit")};
/* 에디터 */
let B={},turn="w",orient="w",tool="wp",drag=null,floatEl=null;
const TOOLS=["wk","wq","wr","wb","wn","wp","x","bk","bq","br","bb","bn","bp"];
$("#pal").innerHTML=TOOLS.map(t=>t==="x"?`<button data-t="x" aria-label="지우개" aria-pressed="false"><span class="er">×</span></button>`:`<button data-t="${t}" aria-label="${t}" aria-pressed="${t===tool}"><i class="pc ${t}"></i></button>`).join("");
$("#pal").onclick=e=>{const b=e.target.closest("button");if(!b)return;tool=b.dataset.t;document.querySelectorAll("#pal button").forEach(x=>x.setAttribute("aria-pressed",x===b))};
function load(f){
  B={};const p=f.split(" "),rows=p[0].split("/");
  rows.forEach((row,i)=>{let c=0;for(const ch of row){if(/\d/.test(ch)){c+=+ch;continue}B[F[c]+(8-i)]=(ch===ch.toUpperCase()?"w":"b")+ch.toLowerCase();c++}});
  turn=p[1]==="b"?"b":"w";const cs=p[2]||"-";["K","Q","k","q"].forEach(x=>{$("#c"+x).checked=cs.includes(x)});
  render();
}
function place(){let out=[];for(let r=8;r>=1;r--){let row="",e=0;for(const f of F){const p=B[f+r];if(!p){e++;continue}if(e){row+=e;e=0}row+=p[0]==="w"?p[1].toUpperCase():p[1]}if(e)row+=e;out.push(row)}return out.join("/")}
function fen(){
  const ok={K:B.e1==="wk"&&B.h1==="wr",Q:B.e1==="wk"&&B.a1==="wr",k:B.e8==="bk"&&B.h8==="br",q:B.e8==="bk"&&B.a8==="br"};
  let cs="";["K","Q","k","q"].forEach(x=>{const el=$("#c"+x);el.disabled=!ok[x];if(ok[x]&&el.checked)cs+=x});
  return `${place()} ${turn} ${cs||"-"} - 0 1`;
}
const order=()=>{const a=[];for(let r=0;r<8;r++)for(let c=0;c<8;c++)a.push(F[orient==="w"?c:7-c]+(orient==="w"?8-r:r+1));return a};
function render(){
  $("#eb8").innerHTML=order().map((sq,n)=>{const p=B[sq],r=Math.floor(n/8),c=n%8,dark=(F.indexOf(sq[0])+ +sq[1])%2===1;
    const co=(c===0?`<span class="co r">${sq[1]}</span>`:"")+(r===7?`<span class="co f">${sq[0]}</span>`:"");
    return `<div class="s8 ${dark?"d":"l"}" data-sq="${sq}">${co}${p?`<i class="pc ${p}${drag&&drag.from===sq&&drag.moved?" ghost":""}"></i>`:""}</div>`}).join("");
  document.querySelectorAll("#eTurn button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.v===turn));
  const f=fen();if(document.activeElement!==$("#eFen"))$("#eFen").value=f;
  const e=fenProblem(f);$("#eErr").textContent=e;$("#eGo").disabled=!!e;
}
function sqAt(x,y){const b=$("#eb8").getBoundingClientRect(),c=Math.floor((x-b.left)/b.width*8),r=Math.floor((y-b.top)/b.height*8);if(c<0||c>7||r<0||r>7)return null;return F[orient==="w"?c:7-c]+(orient==="w"?8-r:r+1)}
$("#eb8").addEventListener("contextmenu",e=>e.preventDefault());
$("#eb8").addEventListener("pointerdown",e=>{
  const sq=sqAt(e.clientX,e.clientY);if(!sq)return;e.preventDefault();
  if(e.button===2){delete B[sq];render();return}
  if(e.button!==0)return;
  try{$("#eb8").setPointerCapture(e.pointerId)}catch(_){}
  drag={from:sq,x0:e.clientX,y0:e.clientY,moved:false,p:B[sq]};
});
window.addEventListener("pointermove",e=>{
  if(!drag||!drag.p)return;
  if(!drag.moved&&Math.hypot(e.clientX-drag.x0,e.clientY-drag.y0)>4){
    drag.moved=true;const s=$("#eb8").getBoundingClientRect().width/8;drag.s=s;
    floatEl=document.createElement("i");floatEl.className=`pc ${drag.p} float`;floatEl.style.width=floatEl.style.height=s+"px";document.body.appendChild(floatEl);render();
  }
  if(floatEl)floatEl.style.transform=`translate(${e.clientX-drag.s/2}px,${e.clientY-drag.s/2}px)`;
});
window.addEventListener("pointerup",e=>{
  if(!drag)return;const d=drag;drag=null;if(floatEl){floatEl.remove();floatEl=null}
  const to=sqAt(e.clientX,e.clientY);
  if(d.moved){delete B[d.from];if(to)B[to]=d.p;render();return}
  if(!to)return;
  if(tool==="x"||B[to]===tool)delete B[to];
  else{if(tool[1]==="k")for(const k in B)if(B[k]===tool)delete B[k];B[to]=tool}
  render();
});
$("#eTurn").onclick=e=>{const b=e.target.closest("button");if(b){turn=b.dataset.v;render()}};
document.querySelectorAll(".cks input").forEach(i=>i.onchange=render);
$("#eFen").addEventListener("change",()=>{const t=$("#eFen").value.trim();if(isFen(t))load(fullFen(t));else $("#eErr").textContent="FEN 형식이 맞지 않아요."});
$("#eStart").onclick=()=>load(START);
$("#eClear").onclick=()=>{B={};B.e1="wk";B.e8="bk";render()};
$("#eFlip").onclick=()=>{orient=orient==="w"?"b":"w";render()};
$("#eGo").onclick=()=>{const f=fen(),e=fenProblem(f);if(e)return;window.openAnalysis(gameFromFen(f))};
/* 주소로 열기: ?fen=... */
load(START);
const q=new URL(location.href).searchParams,qf=q.get("fen");
if(qf&&isFen(qf)){load(fullFen(qf));tab("edit")}
}
