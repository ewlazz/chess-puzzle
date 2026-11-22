var $=function(s){return document.querySelector(s)};
var esc=function(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};

/* 정확도 보정: 같은 게임 78개로 체스닷컴 수치와 맞춘 2차식 (평균 오차 약 5) */
window.calAcc=function(v){if(v==null||isNaN(v))return v;var y=0.01671*v*v-1.65433*v+97.30732;return Math.max(0,Math.min(100,Math.round(y*10)/10))};
