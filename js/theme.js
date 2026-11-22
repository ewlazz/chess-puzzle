/* 보드 색 설정 (모든 페이지), 홈 화면 앱용 서비스 워커 등록 */
(function(){
  var T={paper:["#D5D9E8","#6A80B4","기본"],wood:["#f0d9b5","#b58863","나무"],green:["#eeeed2","#769656","초록"],blue:["#dee3e6","#8ca2ad","파랑"],gray:["#e6e6e6","#a2a2a2","회색"],purple:["#eee4f4","#9a7fba","보라"],coral:["#f6e5dc","#d88c6c","코랄"]};
  var cur="paper";try{cur=localStorage.getItem("hansu-board")||"paper"}catch(e){}
  function apply(k){var t=T[k]||T.paper,s=document.documentElement.style;s.setProperty("--lsq",t[0]);s.setProperty("--dsq",t[1])}
  apply(cur);
  function ui(){
    var nav=document.querySelector(".nav nav");if(!nav||document.getElementById("setb"))return;
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
