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
  /* 한국어 이름: 단어 단위로 옮기고, 모르는 단어가 있는 구간은 영어 그대로 */
  const W={Variation:"바리에이션",Variations:"바리에이션",Lines:"라인",Defense:"디펜스",Attack:"어택",Gambit:"갬빗",Countergambit:"카운터갬빗",Accepted:"수락",Declined:"거절",Opening:"오프닝",Game:"게임",System:"시스템",Line:"라인",Main:"메인",Classical:"클래시컬",Exchange:"익스체인지",Closed:"클로즈드",Open:"오픈",Fianchetto:"피안케토",Symmetrical:"시메트리컬",Advance:"어드밴스",Modern:"모던",Normal:"노멀",Orthodox:"오소독스",Two:"투",Three:"쓰리",Four:"포",Knights:"나이츠",Knight:"나이트",Pawns:"폰즈",Pawn:"폰",
    "Bishop's":"비숍스","King's":"킹스","Queen's":"퀸즈",English:"잉글리시",Winawer:"위나워",Dragon:"드래곤",Morphy:"모피",Evans:"에반스",Rubinstein:"루빈스타인",Berlin:"베를린",Najdorf:"나이도르프",Giuoco:"지우오코",Piano:"피아노",Pianissimo:"피아니시모","Sämisch":"재미시",Spanish:"스패니시",Tarrasch:"타라시",Chigorin:"치고린",Bogoljubow:"보골류보프",Steinitz:"슈타이니츠",Scotch:"스카치",
    "Smith-Morra":"스미스-모라","Richter-Rauzer":"리히터-라우저",Scheveningen:"셰베닝겐",Falkbeer:"팔크비어",Nimzowitsch:"님조비치",Yugoslav:"유고슬라브",Alapin:"알라핀",Meran:"메란",Alekhine:"알레힌",Kieseritzky:"키세리츠키","Semi-Tarrasch":"세미 타라시",Petersburg:"페테르부르크","St.":"세인트",Torre:"토레",Scandinavian:"스칸디나비안",Retreat:"리트리트",Kan:"칸",Positional:"포지셔널",Taimanov:"타이마노프",Czech:"체코",Botvinnik:"보트비닉",Panov:"파노프",Wing:"윙",Keres:"케레스",Capablanca:"카파블랑카",Averbakh:"아베르바흐",McCutcheon:"매커천",Smyslov:"스미슬로프","Maróczy":"마로치",Bind:"바인드",Albin:"알빈",Russian:"러시안",Colle:"콜레",Paulsen:"파울센",Greco:"그레코",
    Sveshnikov:"스베시니코프",Accelerated:"액셀러레이티드",Rossolimo:"로솔리모",Marshall:"마셜",Fried:"프라이드",Liver:"리버","Caro-Kann":"카로칸",French:"프렌치",Sicilian:"시실리안",Ruy:"루이",Lopez:"로페즈",Italian:"이탈리안",Indian:"인디언","Nimzo-Indian":"님조 인디언","Semi-Slav":"세미 슬라브",Slav:"슬라브",Dutch:"더치",Benoni:"베노니","Grünfeld":"그륀펠트","Neo-Grünfeld":"네오 그륀펠트","Petrov's":"페트로프",Philidor:"필리도르","Réti":"레티",Zukertort:"주커토르트",Vienna:"비엔나",Pirc:"피르츠",Catalan:"카탈란",Bird:"버드",Polish:"폴리시",
    "Blackmar-Diemer":"블랙마-디머","Bogo-Indian":"보고 인디언",Grob:"그로브",Hungarian:"헝가리안","Nimzo-Larsen":"님조-라르센",Center:"센터",Latvian:"라트비안",Ponziani:"폰치아니",Old:"올드",Rat:"랫",Trompowsky:"트롬포프스키",Benko:"벤코",Englund:"잉글룬드",Owen:"오웬","Richter-Veresov":"리히터-베레소프",London:"런던",Danish:"데니시",Elephant:"엘리펀트",Budapest:"부다페스트",Pterodactyl:"프테로닥틸",
    "Anglo-Slav":"앵글로 슬라브","Anglo-Indian":"앵글로 인디언",Agincourt:"아쟁쿠르","O'Kelly":"오켈리",Hippopotamus:"히포포타무스",Horwitz:"호르비츠",Kangaroo:"캥거루",Lion:"라이언",Mexican:"멕시칸",Portuguese:"포르투갈",Australian:"오스트레일리안",Robatsch:"로바치",Dragondorf:"드래곤도르프",Hyperaccelerated:"하이퍼액셀러레이티드",Lasker:"라스커",Janowski:"야노프스키",Schliemann:"실리만",Jaenisch:"예니시",Breyer:"브라이어",Zaitsev:"자이체프",Chelyabinsk:"첼랴빈스크",Kalashnikov:"칼라시니코프",Moscow:"모스크바",Grand:"그랑",Prix:"프리",Mar:"마르",Del:"델",Plata:"플라타",Petrosian:"페트로시안",Leningrad:"레닌그라드",Stonewall:"스톤월",Tal:"탈",Kasparov:"카스파로프",Karpov:"카르포프",Fischer:"피셔",Benoni_:"베노니",Snake:"스네이크",Bayonet:"바요넷",Saemisch:"재미시",Gligoric:"글리고리치",Hedgehog:"헤지호그",Reversed:"리버스드",Sicilian_:"시실리안",Wilkes:"윌크스",Barre:"바르",Cozio:"코치오",Archangelsk:"아르한겔스크",Fianchetto_:"피안케토",Dragon_:"드래곤",Boleslavsky:"볼레슬랍스키",Najdorf_:"나이도르프",Opocensky:"오포첸스키",Adams:"애덤스",English_:"잉글리시",Perenyi:"페레니",Sozin:"소진",Velimirovic:"벨리미로비치",Fischer_:"피셔",Max:"맥스",Lange:"랑게",Muzio:"무치오",Traxler:"트랙슬러",Ponziani_:"폰치아니",Jobava:"요바바",Rapport:"라포트","Rapport-Jobava":"라포트-요바바",Hillbilly:"힐빌리",Halloween:"할로윈",Stafford:"스태퍼드",Englund_:"잉글룬드",Hennig:"헨니히",Schara:"샤라","Hennig-Schara":"헨니히-샤라",Marshall_:"마셜",Benko_:"벤코",Volga:"볼가",Leko:"레코",Ufimtsev:"우핌체프",Larsen:"라르센",Grob_:"그로브",Orangutan:"오랑우탄",George:"조지",Amar:"아마르",Sodium:"소듐",Slow:"슬로",Neo:"네오",Durkin:"더킨",Perrin:"페랭",Van:"반",Geet:"헤이트",Nimzowitsch_:"님조비치",Kádas:"카다스",Ware:"웨어",Barnes:"반스",Borg:"보르그",Mieses:"미제스",Mikenas:"미케나스",Clemenz:"클레멘츠",Zukertort_:"주커토르트",Goldsmith:"골드스미스",Carr:"카르",Global:"글로벌",Saragossa:"사라고사",Valencia:"발렌시아",Montevideo:"몬테비데오",Zaire:"자이르",Amazon:"아마존",Marienbad:"마리엔바트",Pseudo:"수도",Creepy:"크리피",Crawly:"크롤리",Formation:"포메이션",Amsterdam:"암스테르담",Blumenfeld:"블루멘펠트",Anderssen:"안데르센","Anderssen's":"안데르센","Knight's":"나이츠",Simul:"시뮬",Special:"스페셜",Sokolsky:"소콜스키",with:"(+)"};
  function tr(seg){const out=[];for(const w of seg.trim().split(/\s+/)){if(W[w]){out.push(W[w]);continue}const p=w.split("-");if(p.length>1&&p.every(x=>W[x])){out.push(p.map(x=>W[x]).join("-"));continue}return null}return out.join(" ")}
  const koC=new Map();
  function ko(name){if(!name)return "";if(koC.has(name))return koC.get(name);const [f,rest]=[name.split(":")[0],name.includes(":")?name.slice(name.indexOf(":")+1):""];
    const fk=f.split(",").map(x=>tr(x));if(fk[0]==null){koC.set(name,"");return ""}
    let r=fk.map((x,i)=>x||f.split(",")[i].trim()).join(", ");if(rest)r+=": "+rest.split(",").map(x=>tr(x)||x.trim()).join(", ");koC.set(name,r);return r}

  load();
  return {load,at,line,family,ko,ready:()=>!!D,names:()=>D?D.n:[]};
})();
