(() => {
  'use strict';

  // Self-contained, editable-data-driven SVG: no external maps, fonts, or image assets.
  const themes = [
    {name:'初抵福岡',icon:'✈',accent:'#456b93',sky:'#dcebf5',ground:'#93bad0',dark:'#31516c'},
    {name:'柳川・太宰府',icon:'⛩',accent:'#b26d5f',sky:'#f6dfcb',ground:'#b0c9ad',dark:'#855b55'},
    {name:'唐津秋日祭',icon:'🏮',accent:'#ae6a4a',sky:'#f8e7cc',ground:'#d6b891',dark:'#7c5546'},
    {name:'糸島海岸',icon:'🌅',accent:'#b97b67',sky:'#f8d8cb',ground:'#83b6c3',dark:'#8c5b58'},
    {name:'阿蘇火山',icon:'🌋',accent:'#66816c',sky:'#e3eee4',ground:'#90ae83',dark:'#486c54'},
    {name:'由布院小鎮',icon:'🌸',accent:'#9c7e98',sky:'#f2e4ee',ground:'#abc09e',dark:'#745d82'},
    {name:'別府溫泉',icon:'♨',accent:'#527e91',sky:'#dceff3',ground:'#b9cfc9',dark:'#467687'},
    {name:'福岡散步',icon:'🛍',accent:'#98765a',sky:'#f6e9db',ground:'#d3b59a',dark:'#745d50'}
  ];
  const catColors = {transit:'#7e93b5',food:'#c99b72',spot:'#7fa69b',stay:'#ab91b0',shop:'#c0a080',other:'#9296a9'};
  const catIcons = {transit:'🚃',food:'🍜',spot:'📷',stay:'🏨',shop:'🛍️',other:'📌'};
  const xml = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  const tag = (name,attrs,text) => '<'+name+' '+attrs+'>'+xml(text)+'</'+name+'>';
  const weekday = iso => ['日','一','二','三','四','五','六'][new Date(iso+'T12:00:00').getDay()];
  const titleFor = (trip,date,dayNumber) => {
    const original=trip.dayTitles && trip.dayTitles[date];
    return typeof original==='string' && original.trim() ? original.trim() : 'DAY '+dayNumber+'｜每日旅程';
  };
  const roughlyWide = c => {
    if (/[A-Za-z0-9 .,:;\/\-]/.test(c)) return 0.54;
    if (/[·・〜～]/.test(c)) return 0.6;
    return 1;
  };
  function wrap(str,maxUnits,maxLines){
    const output=[];let line='',units=0;
    const text=String(str||'').replace(/\s+/g,' ').trim();
    for(const ch of Array.from(text)){
      const width=roughlyWide(ch);
      if(line && units+width>maxUnits){output.push(line);line='';units=0;}
      if(output.length>=maxLines){const last=output[maxLines-1]||'';output[maxLines-1]=last.replace(/.$/,'…');return output;}
      line+=ch;units+=width;
    }
    if(line)output.push(line);
    return output.length?output:['—'];
  }
  function heroScene(index){
    // Decorative vignettes, deliberately not geographic maps.
    const base='<circle cx="905" cy="114" r="104" fill="#fff" opacity=".42"/>'+
      '<path d="M515 358 Q658 292 805 326 T1080 314 V433 H515 Z" fill="#fff" opacity=".25"/>';
    const layers=[
      '<g fill="#6689a8" opacity=".64"><rect x="635" y="218" width="79" height="198" rx="5"/><rect x="729" y="180" width="76" height="236" rx="5"/><rect x="822" y="238" width="69" height="178" rx="5"/><rect x="910" y="148" width="88" height="268" rx="5"/></g>'+
      '<path d="M690 133 l74 21 -16 10 -40 -9 -18 20 -9 -3 14 -25 -31 -10 z" fill="#fff" opacity=".9"/>',
      '<path d="M590 342 Q770 292 1080 338 V433 H590 Z" fill="#91b7b4"/>'+
      '<path d="M640 248 h160 M661 248 v-112 h115 v112 M657 178 h124" stroke="#bc736b" stroke-width="21" fill="none"/>'+
      '<path d="M817 344 l161 0 -47 29 -78 0 Z" fill="#956c59"/><path d="M867 339 v-93" stroke="#956c59" stroke-width="7"/>',
      '<path d="M677 337 h225 v-85 h-225 z M711 253 l77 -67 77 67" fill="#d1a96f" stroke="#ae8058" stroke-width="13"/>'+
      '<path d="M755 194 l38 -54 38 54 M790 139 v-24" stroke="#8f594a" stroke-width="11" fill="none"/>'+
      '<circle cx="790" cy="185" r="55" fill="#c89158" opacity=".9"/>',
      '<circle cx="869" cy="153" r="91" fill="#f4c2a1"/>'+
      '<path d="M580 335 Q720 285 830 322 T1080 315 V433 H580 Z" fill="#79a7ba"/>'+
      '<path d="M950 345 q-45 -128 -65 -156 M886 194 q41 -30 66 -11 M885 199 q-31 -36 -58 -12 M889 195 q13 -50 -1 -73" fill="none" stroke="#517c6c" stroke-width="17" stroke-linecap="round"/>'+
      '<path d="M695 310 h138 M724 310 V230 H804 V310 M711 246 H818" stroke="#fffaf2" stroke-width="12" fill="none"/>',
      '<path d="M560 391 L759 173 L844 280 L928 211 L1080 376 V433 H560 Z" fill="#6d9381"/>'+
      '<path d="M743 193 L760 174 L796 224 L783 222 L769 219 L755 230 Z" fill="#edf0e8"/>'+
      '<path d="M775 155 q-9 -30 17 -44 q-10 -25 8 -37" fill="none" stroke="#b2bdba" stroke-width="17" opacity=".8" stroke-linecap="round"/>',
      '<path d="M550 380 L754 206 L877 347 L973 247 L1080 368 V433 H550 Z" fill="#8eae9a"/>'+
      '<path d="M689 347 v-90 h113 v90 z M702 259 l44 -39 43 39" fill="#f8f3e7" stroke="#ad919a" stroke-width="10"/>'+
      '<circle cx="891" cy="192" r="13" fill="#fff" opacity=".8"/><circle cx="933" cy="150" r="18" fill="#fff" opacity=".7"/>',
      '<path d="M576 400 Q780 347 1080 380 V433 H576 Z" fill="#8db7b4"/>'+
      '<path d="M754 350 h219 v-70 h-219 z" fill="#f8f1e5"/>'+
      '<path d="M780 280 q-29 -28 0 -58 q29 -25 0 -58 M854 278 q-29 -28 0 -58 q29 -25 0 -58 M925 278 q-29 -28 0 -58 q29 -25 0 -58" stroke="#fff" stroke-width="13" fill="none" opacity=".88" stroke-linecap="round"/>',
      '<g fill="#bd9b7f"><rect x="652" y="237" width="95" height="173" rx="7"/><rect x="761" y="183" width="109" height="227" rx="7"/><rect x="888" y="213" width="109" height="197" rx="7"/></g>'+
      '<path d="M705 142 l90 33 -9 13 -88 -29 z" fill="#fff" opacity=".92"/>'
    ];
    return base+layers[index];
  }
  function asText(x,y,content,size,color,weight,attrs){
    return tag('text','x="'+x+'" y="'+y+'" font-size="'+size+'" fill="'+color+'" font-weight="'+(weight||500)+'" '+(attrs||''),content);
  }
  function build(trip,date){
    const dateList=[];let cursor=new Date(trip.startDate+'T12:00:00'),end=new Date(trip.endDate+'T12:00:00');
    while(cursor<=end&&dateList.length<180){
      dateList.push(cursor.getFullYear()+'-'+String(cursor.getMonth()+1).padStart(2,'0')+'-'+String(cursor.getDate()).padStart(2,'0'));
      cursor.setDate(cursor.getDate()+1);
    }
    const index=Math.max(0,dateList.indexOf(date));
    const dayNo=index+1;
    const theme=themes[index%themes.length];
    const stops=(trip.activities||[]).filter(v=>v.date===date).sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));
    const rows=stops.map(item=>{
      const title=wrap(item.title,25.2,2);
      const loc=item.location?wrap('📍 '+item.location,37,1):[];
      // Notes are a quick hint; comprehensive notes remain editable in the schedule tab.
      const hint=item.notes?wrap(item.notes.split(/\n/)[0].replace(/https?:\/\/\S+/g,'').trim(),41,1):[];
      const time=item.time?(item.endTime?item.time+' — '+item.endTime:item.time):'自由安排';
      return {title,loc,hint,time,category:item.category||'other',height:140+(title.length-1)*39+(loc.length?36:0)+(hint.length?36:0)};
    });
    const top=474, gap=16, bottom=150;
    const contentHeight=rows.reduce((sum,v)=>sum+v.height+gap,0);
    const height=Math.max(1020,top+contentHeight+bottom);
    const width=1080;
    const titleLines=wrap(titleFor(trip,date,dayNo),16.5,2);
    const font="'Hiragino Kaku Gothic ProN','PingFang TC','Noto Sans TC','Microsoft JhengHei',sans-serif";
    const art=[];
    art.push('<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'" viewBox="0 0 '+width+' '+height+'">');
    art.push('<defs><linearGradient id="sky" x2=".9" y2="1"><stop stop-color="'+theme.sky+'"/><stop offset="1" stop-color="'+theme.ground+'"/></linearGradient></defs>');
    art.push('<rect width="'+width+'" height="'+height+'" fill="#f8f4ed"/>');
    art.push('<rect width="'+width+'" height="431" fill="url(#sky)"/>');
    art.push(heroScene(index));
    art.push('<rect x="48" y="42" width="450" height="337" rx="26" fill="#fffaf3" opacity=".84"/>');
    art.push(asText(74,93,'BODI MONKEY  ·  JAPAN TRAVEL NOTES',24,theme.dark,800,'letter-spacing="3"'));
    art.push('<rect x="73" y="115" width="176" height="52" rx="25" fill="'+theme.accent+'"/>');
    art.push(asText(101,151,'DAY '+String(dayNo).padStart(2,'0'),29,'#ffffff',800,'letter-spacing="2"'));
    titleLines.forEach((line,i)=>art.push(asText(73,224+i*62,line,48,theme.dark,850)));
    art.push(asText(74,366,date.replaceAll('-','.')+'  •  星期'+weekday(date),25,theme.dark,650));
    art.push('<path d="M0 430 Q290 404 550 433 T1080 426 V454 H0Z" fill="#f8f4ed"/>');
    art.push(asText(73,477,'TRAVEL ROUTE  ·  '+stops.length+' STOPS',24,theme.accent,800,'letter-spacing="3"'));
    art.push(asText(73,515,'一天一張圖・隨手機行程自動更新',23,'#85828a',500));
    if(!rows.length){
      art.push(asText(93,695,'今天還沒有行程，先到「每日行程」新增吧。',31,theme.dark,600));
    } else {
      let y=550;
      const circleXs=118;
      // A decorative timeline, not a statement of geographical order/distance.
      const endY=y+contentHeight-60;
      art.push('<path d="M'+circleXs+' '+(y+52)+' Q77 '+((y+endY)/2)+' '+circleXs+' '+endY+'" fill="none" stroke="'+theme.accent+'" stroke-width="12" stroke-dasharray="17 21" opacity=".34" stroke-linecap="round"/>');
      rows.forEach((item,i)=>{
        const accent=catColors[item.category]||catColors.other;
        art.push('<rect x="186" y="'+y+'" width="826" height="'+item.height+'" rx="27" fill="#d5ccc2" opacity=".18"/>');
        art.push('<rect x="182" y="'+(y-5)+'" width="826" height="'+item.height+'" rx="27" fill="#ffffff" stroke="#ece5da" stroke-width="3"/>');
        art.push('<rect x="182" y="'+(y+17)+'" width="8" height="'+(item.height-44)+'" rx="4" fill="'+accent+'"/>');
        art.push('<circle cx="'+circleXs+'" cy="'+(y+60)+'" r="39" fill="#fffdf9" stroke="'+theme.accent+'" stroke-width="7"/>');
        art.push(asText(118,y+72,String(i+1).padStart(2,'0'),30,theme.dark,900,'text-anchor="middle"'));
        art.push(asText(220,y+43,item.time,25,theme.accent,800));
        art.push(asText(949,y+43,catIcons[item.category]||catIcons.other,29,theme.accent,700,'text-anchor="middle"'));
        let textY=y+87;
        item.title.forEach(line=>{art.push(asText(219,textY,line,36,'#333b45',750));textY+=39;});
        if(item.loc.length){art.push(asText(219,textY+1,item.loc[0],22,'#75828b',500));textY+=36;}
        if(item.hint.length){art.push(asText(219,textY,item.hint[0],21,'#9a9092',500));}
        y+=item.height+gap;
      });
    }
    art.push('<path d="M66 '+(height-101)+' H1014" stroke="#ded7cd" stroke-width="3" stroke-dasharray="7 12"/>');
    art.push(asText(72,height-64,'✿  自由行手帳  ·  詳細交通與備註請查看原本的每日行程',22,'#8f8b87',600));
    art.push(asText(73,height-27,'示意插畫／非真實地理位置或比例',19,'#a29c94',500));
    art.push(asText(1015,height-27,'交大波迪猴子製作',23,theme.accent,850,'text-anchor="end" letter-spacing="2"'));
    art.push('</svg>');
    return {
      svg:art.join(''),
      width,height,date,dayNo,
      filename:'旅行手帳-DAY-'+String(dayNo).padStart(2,'0')+'-'+date+'.png'
    };
  }
  function dataUrl(svg){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);}
  async function toPng(poster){
    const blob=new Blob([poster.svg],{type:'image/svg+xml;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    try{
      const img=new Image();
      await new Promise((resolve,reject)=>{
        img.onload=resolve;img.onerror=()=>reject(new Error('無法轉成圖片'));img.src=url;
      });
      const canvas=document.createElement('canvas');
      canvas.width=poster.width;canvas.height=poster.height;
      const ctx=canvas.getContext('2d');
      if(!ctx)throw new Error('此裝置無法匯出圖片');
      ctx.fillStyle='#f8f4ed';ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(img,0,0,canvas.width,canvas.height);
      const png=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
      if(!png)throw new Error('PNG 產生失敗');
      return png;
    } finally{URL.revokeObjectURL(url);}
  }
  window.RoamyPoster={build,dataUrl,toPng};
})();
