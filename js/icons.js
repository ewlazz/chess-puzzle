/* 시간 종류 아이콘 (직접 그린 SVG) */
(function(){
  var s=function(b){return '<svg class="tci" viewBox="0 0 24 24" aria-hidden="true">'+b+'</svg>'};
  window.TCI={
    bullet:s('<g transform="rotate(45 12 12)"><path d="M9 9.5Q9 3 12 1.5Q15 3 15 9.5Z" fill="currentColor"/><rect x="9" y="11" width="6" height="9" rx="1" fill="currentColor"/><rect x="8.2" y="20.6" width="7.6" height="1.9" rx=".6" fill="currentColor"/></g>'),
    blitz:s('<path d="M13.5 1.5 4 13.5h6.5L9.5 22.5 20 10h-6.6z" fill="currentColor"/>'),
    rapid:s('<rect x="10" y="1.5" width="4" height="2.6" rx=".8" fill="currentColor"/><circle cx="12" cy="13.5" r="8" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M12 13.5V8.8" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="m18.6 5.4 1.6-1.6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>'),
    daily:s('<circle cx="12" cy="12" r="4.6" fill="currentColor"/><g stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 1.8v2.6M12 19.6v2.6M1.8 12h2.6M19.6 12h2.6M4.8 4.8l1.8 1.8M17.4 17.4l1.8 1.8M4.8 19.2l1.8-1.8M17.4 6.6l1.8-1.8"/></g>')
  };
  window.tcIcon=function(k){return window.TCI[k]||""};
})();
