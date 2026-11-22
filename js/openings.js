/* 오프닝 이름·정석 판별: 리체스 chess-openings (CC0) 데이터를 포지션 해시로 조회 */
window.Openings=(function(){
  let D=null,ready=null;
  const h=s=>{let x=0x811c9dc5;for(let i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,0x01000193)>>>0}return x.toString(36)};
  const key=f=>h(f.split(" ").slice(0,3).join(" "));
  function load(){if(!ready)ready=fetch("data/openings.json").then(r=>r.json()).then(j=>{D=j;return j}).catch(()=>null);return ready}
  /* 한 포지션: {book, eco, name} (이름이 없는 정석 포지션은 name 없음) */
  function at(fen){if(!D)return null;const v=D.p[key(fen)];if(v===undefined)return null;return v>=0?{book:true,eco:D.n[v][0],name:D.n[v][1]}:{book:true}}
  /* 수순 전체: 정석 길이(ply), 마지막으로 이름 붙은 오프닝, 수마다의 이름 */
  function line(fens){
    const out={book:0,eco:"",name:"",names:[]};if(!D)return out;let cur=null,out1=false;
    for(let i=1;i<fens.length;i++){const a=at(fens[i]);if(a&&!out1){out.book=i;if(a.name)cur=a}else out1=true;out.names[i]=cur}
    if(cur){out.eco=cur.eco;out.name=cur.name}
    return out;
  }
  /* 이름의 큰 갈래: "Sicilian Defense: Najdorf Variation" → "Sicilian Defense" */
  const family=n=>(n||"").split(":")[0].trim();
  load();
  return {load,at,line,family,ready:()=>!!D,names:()=>D?D.n:[]};
})();
