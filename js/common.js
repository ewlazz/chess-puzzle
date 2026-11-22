var $=function(s){return document.querySelector(s)};
var esc=function(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};

/* 정확도 보정: 같은 게임 78개로 체스닷컴 수치와 맞춘 2차식 (평균 오차 약 5) */
window.calAcc=function(v){if(v==null||isNaN(v))return v;var y=0.01671*v*v-1.65433*v+97.30732;return Math.max(0,Math.min(100,Math.round(y*10)/10))};
/* 승률이 아주 좋은 수·변화에 붙이는 꿀벌 표시 (직접 그린 SVG) */
window.BEE=function(t){return '<svg class="bee" viewBox="0 0 24 24" role="img" aria-label="'+(t||"승률 높음")+'"><title>'+(t||"승률 높음")+'</title><ellipse cx="9" cy="6.8" rx="4.2" ry="3.2" transform="rotate(-25 9 6.8)" fill="#EFF0F6" stroke="#6A80B4" stroke-width="1.3"/><ellipse cx="15.2" cy="6.3" rx="3.6" ry="2.8" transform="rotate(20 15.2 6.3)" fill="#EFF0F6" stroke="#6A80B4" stroke-width="1.3"/><path d="M21.6 14.6l1.9.9-1.9.9z" fill="#242942"/><ellipse cx="12.4" cy="14.6" rx="9" ry="6.4" fill="#5C54D6"/><path d="M11 8.6c-1.3 1.7-2 3.7-2 6s.7 4.3 2 6M15.6 8.9c-1.1 1.6-1.6 3.5-1.6 5.7s.5 4.1 1.6 5.7" fill="none" stroke="#242942" stroke-width="2.2"/><circle cx="6.4" cy="13.4" r="1.25" fill="#242942"/><circle cx="6.7" cy="13.05" r=".4" fill="#EFF0F6"/></svg>'};
