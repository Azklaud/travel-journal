(() => {
  'use strict';

  const api = window.RoamyPoster;

  function render(options) {
    const current=options.current;
    const days=options.days;
    const day=options.day;
    const escape=options.escapeHTML;
    const poster=api.build(current,day);
    const currentTitle=(current.dayTitles && current.dayTitles[day]) || '';
    const pills=days.map((date,index)=>{
      const active=date===day ? ' active' : '';
      const parsed=new Date(date+'T12:00:00');
      const label=(parsed.getMonth()+1)+'/'+parsed.getDate();
      return '<button class="poster-day-pill'+active+'" data-day="'+escape(date)+'" aria-pressed="'+(date===day)+'"><small>DAY '+String(index+1).padStart(2,'0')+'</small><strong>'+label+'</strong></button>';
    }).join('');
    const picture=api.dataUrl(poster.svg);
    return '<div class="page-intro poster-intro"><div><span class="eyebrow">VISUAL TRAVEL JOURNAL</span><h1>🖼️ 每日行程・圖片版</h1><p>一天一張旅行手帳插畫，會依各自手機上的行程自動更新。</p></div></div>'
      +'<div class="poster-day-strip" aria-label="選擇日期">'+pills+'</div>'
      +'<div class="poster-layout">'
      +'<section class="poster-frame"><div class="poster-frame-head"><div><span class="poster-kicker">DAY '+String(poster.dayNo).padStart(2,'0')+' · '+escape(day)+'</span><h2>'+escape(currentTitle || '今天的旅行路線')+'</h2></div><span class="poster-swatch">JAPAN 2026</span></div>'
      +'<img class="poster-image" src="'+picture+'" alt="第 '+poster.dayNo+' 天行程圖片，按照時間展示景點及交通，為插畫示意，並非地理地圖" loading="eager" draggable="false">'
      +'</section>'
      +'<aside class="poster-side"><div class="poster-side-icon">🎨</div><h3>儲存今天的旅行圖</h3><p>選好日期，按下方按鈕製作 PNG。iPhone 可以存入照片或透過分享選單傳給朋友。</p>'
      +'<button class="button primary poster-main-action" data-action="download-poster">⬇ 下載／分享這天圖片</button>'
      +'<button class="button outline poster-main-action" data-action="edit-poster-day">✎ 回每日行程編輯</button>'
      +'<div class="poster-tip">📍 此圖是依時間順序繪製的手帳插畫，不代表實際地理方向或距離。完整地址、票券與備註請看「每日行程」。</div>'
      +'<div class="poster-tip">📱 兩台手機各自儲存編輯內容，不會自動同步；要傳給對方，可在原本的匯出／匯入功能交換 JSON。</div>'
      +'</aside></div>';
  }

  async function download(options) {
    const current=options.current;
    if(!current) return;
    const toast=options.toast;
    let poster;
    try{
      poster=api.build(current,options.day);
      toast('正在製作這一天的圖片…');
      const blob=await api.toPng(poster);
      const file=new File([blob],poster.filename,{type:'image/png'});
      if(navigator.share && navigator.canShare && navigator.canShare({files:[file]})){
        try{
          await navigator.share({files:[file],title:'旅行手帳｜DAY '+poster.dayNo});
          return;
        } catch(error) {
          if(error && error.name==='AbortError')return;
        }
      }
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url;
      a.download=poster.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),20000);
      toast('DAY '+poster.dayNo+' 圖片已準備下載');
    }catch(error){
      console.error('圖片下載失敗',error);
      toast('圖片製作失敗，請重試或使用瀏覽器分享');
    }
  }

  window.RoamyPosterPage={render,download};
})();
