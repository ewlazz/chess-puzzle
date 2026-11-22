/* 보드 색 설정 (모든 페이지), 홈 화면 앱용 서비스 워커 등록 */
(function(){
  var T={paper:["#D5D9E8","#6A80B4","기본"],wood:["#f0d9b5","#b58863","나무"],green:["#eeeed2","#769656","초록"],blue:["#dee3e6","#8ca2ad","파랑"],gray:["#e6e6e6","#a2a2a2","회색"],purple:["#eee4f4","#9a7fba","보라"],coral:["#f6e5dc","#d88c6c","코랄"]};
  var cur="paper";try{cur=localStorage.getItem("hansu-board")||"paper"}catch(e){}
  function apply(k){var t=T[k]||T.paper,s=document.documentElement.style;s.setProperty("--lsq",t[0]);s.setProperty("--dsq",t[1])}
  apply(cur);
  /* 내 계정: 등록하면 메뉴의 전적이 바로 내 전적으로 감 */
  window.ME={get:function(){try{return localStorage.getItem("hansu-me")||""}catch(e){return ""}},set:function(u){try{localStorage.setItem("hansu-me",u)}catch(e){}},clear:function(){try{localStorage.removeItem("hansu-me")}catch(e){}}};
  /* 리체스 로그인 (OAuth PKCE, 어느 페이지에서나): 레이팅별 오프닝 통계에 씀 */
  var b64u=function(b){return btoa(String.fromCharCode.apply(null,new Uint8Array(b))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")};
  var redir=function(){return location.origin+location.pathname};
  window.LI={
    get tok(){try{return localStorage.getItem("hansu-li")||""}catch(e){return ""}},
    get name(){try{return localStorage.getItem("hansu-li-name")||""}catch(e){return ""}},
    fresh:false,
    login:async function(){
      var v=b64u(crypto.getRandomValues(new Uint8Array(48))),st=b64u(crypto.getRandomValues(new Uint8Array(12)));
      var ch=b64u(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v)));
      try{sessionStorage.setItem("hansu-pkce",JSON.stringify({v:v,st:st,q:location.search,page:redir()}))}catch(e){}
      location.href="https://lichess.org/oauth?response_type=code&client_id=hansu-chess&redirect_uri="+encodeURIComponent(redir())+"&code_challenge_method=S256&code_challenge="+ch+"&state="+st;
    },
    logout:function(){var t=this.tok;try{localStorage.removeItem("hansu-li");localStorage.removeItem("hansu-li-name")}catch(e){}if(t)fetch("https://lichess.org/api/token",{method:"DELETE",headers:{Authorization:"Bearer "+t}}).catch(function(){})}
  };
  LI.ready=(async function(){
    var q=new URL(location.href).searchParams,code=q.get("code"),st=q.get("state");if(!code||!st)return;
    var k=null;try{k=JSON.parse(sessionStorage.getItem("hansu-pkce")||"null");sessionStorage.removeItem("hansu-pkce")}catch(e){}
    try{history.replaceState(null,"",redir()+(k&&k.q&&!/[?&]code=/.test(k.q)?k.q:""))}catch(e){}
    if(!k||k.st!==st)return;
    try{var r=await fetch("https://lichess.org/api/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"authorization_code",code:code,code_verifier:k.v,redirect_uri:redir(),client_id:"hansu-chess"})});
      var j=await r.json();if(!j.access_token)return;localStorage.setItem("hansu-li",j.access_token);LI.fresh=true;
      var a=await fetch("https://lichess.org/api/account",{headers:{Authorization:"Bearer "+j.access_token}}).then(function(x){return x.ok?x.json():null}).catch(function(){return null});
      if(a&&a.username)localStorage.setItem("hansu-li-name",a.username);
    }catch(e){}
  })();
  /* 머리글의 계정 버튼: 체스닷컴 닉네임 연결 + 리체스 로그인 */
  window.LIIC='<img class="sico" src="https://lichess1.org/assets/logo/lichess-favicon-64.png" alt="리체스" width="22" height="22">';
  var IC={cc:'<img class="sico" src="https://www.chess.com/bundles/web/favicons/favicon-32x32.png" onerror="this.src=\'https://www.chess.com/favicon.ico\'" alt="체스닷컴" width="22" height="22">',li:window.LIIC};
  function acct(nav){
    var esc=function(s){return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
    var b=document.createElement("button");b.id="acb";b.className="acb";b.type="button";b.setAttribute("aria-expanded","false");nav.parentNode.appendChild(b);
    var p=document.createElement("div");p.className="setp acp";p.hidden=true;document.querySelector("header").appendChild(p);
    function lab(){var m=ME.get();b.textContent=m||LI.name||(LI.tok?"리체스 연결됨":"")?(m||LI.name||"내 계정"):"로그인"}
    function draw(){var m=ME.get(),ln=LI.name,lt=LI.tok;
      p.innerHTML='<div class="acr">'+IC.cc+(m?'<b>'+esc(m)+'</b><a href="stats.html?user='+encodeURIComponent(m)+'">내 전적</a><button type="button" class="lnk" data-x="cc-out">해제</button>'
        :'<form class="acf" data-x="cc-form"><input name="u" placeholder="체스닷컴 닉네임" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="체스닷컴 닉네임"><button class="bgo">연결</button></form>')+'</div>'
        +'<div class="acr">'+IC.li+(lt?'<b>'+esc(ln||"리체스")+'</b><button type="button" class="lnk" data-x="li-out">해제</button>':'<button type="button" class="libtn" data-x="li-in">리체스</button>')+'</div>';
      lab()}
    lab();
    b.onclick=function(e){e.stopPropagation();draw();p.hidden=!p.hidden;b.setAttribute("aria-expanded",!p.hidden);var sp=document.querySelector(".setp:not(.acp)");if(sp)sp.hidden=true};
    p.addEventListener("click",function(e){e.stopPropagation();var t=e.target.closest("[data-x]");if(!t||t.tagName==="FORM")return;var x=t.dataset.x;
      if(x==="cc-out"){ME.clear();draw();var sl=nav.querySelector('a[href^="stats.html"]');if(sl)sl.href="stats.html"}
      else if(x==="li-in")LI.login();else if(x==="li-out"){LI.logout();draw()}});
    p.addEventListener("submit",async function(e){e.preventDefault();var f=e.target,u=f.u.value.trim();if(!u)return;var btn=f.querySelector("button");btn.disabled=true;btn.textContent="확인 중";
      try{var r=await fetch("https://api.chess.com/pub/player/"+encodeURIComponent(u.toLowerCase()));if(!r.ok)throw 0;var j=await r.json();ME.set(j.username||u);
        var sl=nav.querySelector('a[href^="stats.html"]');if(sl)sl.href="stats.html?user="+encodeURIComponent(ME.get());draw()}
      catch(_){btn.disabled=false;btn.textContent="연결";f.u.setCustomValidity("없는 닉네임이에요");f.u.reportValidity();f.u.oninput=function(){f.u.setCustomValidity("")}}});
    document.addEventListener("click",function(){if(!p.hidden){p.hidden=true;b.setAttribute("aria-expanded","false")}});
    LI.ready.then(lab);
  }
  function ui(){
    var nav=document.querySelector(".nav nav");if(!nav||document.getElementById("setb"))return;
    var me=ME.get(),sl=nav.querySelector('a[href="stats.html"]');if(me&&sl)sl.href="stats.html?user="+encodeURIComponent(me);
    acct(nav);
    var hh=function(){var h=document.querySelector("header");if(h)document.documentElement.style.setProperty("--hh",h.offsetHeight+"px")};hh();addEventListener("resize",hh);
    var b=document.createElement("button");b.id="setb";b.className="setb";b.type="button";b.setAttribute("aria-label","보드 색");b.setAttribute("aria-expanded","false");
    b.innerHTML='<span class="sw"><i></i><i></i><i></i><i></i></span>';nav.appendChild(b);
    var p=document.createElement("div");p.className="setp";p.hidden=true;
    p.innerHTML='<p>보드 색</p><div class="sws">'+Object.keys(T).map(function(k){return '<button type="button" data-k="'+k+'" aria-pressed="'+(k===cur)+'"><span class="sw" style="--a:'+T[k][0]+';--b:'+T[k][1]+'"><i></i><i></i><i></i><i></i></span>'+T[k][2]+'</button>'}).join("")+'</div>';
    document.querySelector("header").appendChild(p);
    b.onclick=function(e){e.stopPropagation();p.hidden=!p.hidden;b.setAttribute("aria-expanded",!p.hidden)};
    p.onclick=function(e){e.stopPropagation();var x=e.target.closest("[data-k]");if(!x)return;cur=x.dataset.k;apply(cur);try{localStorage.setItem("hansu-board",cur)}catch(_){}p.querySelectorAll("[data-k]").forEach(function(y){y.setAttribute("aria-pressed",y===x)})};
    document.addEventListener("click",function(){if(!p.hidden){p.hidden=true;b.setAttribute("aria-expanded","false")}});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ui);else ui();
  if("serviceWorker" in navigator&&location.protocol==="https:")window.addEventListener("load",function(){navigator.serviceWorker.register("sw.js").catch(function(){})});
})();
