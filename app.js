(() => {
  'use strict';

  const KEY = 'roamy-trip-planner-v1';
  const tripEmoji = ['🗼', '🗻', '🏝️', '🌸', '🏕️', '🌍', '🏙️'];
  const views = [{id:'overview',label:'總覽',icon:'grid'}, {id:'itinerary',label:'每日行程',icon:'calendar'}, {id:'posters',label:'圖片版',icon:'map'}, {id:'budget',label:'旅費記帳',icon:'wallet'}, {id:'bookings',label:'票券整理',icon:'ticket'}];
  const activityCategories = [{id:'spot',label:'景點',emoji:'🏯',style:''},{id:'food',label:'餐飲',emoji:'🍜',style:'food'},{id:'transit',label:'交通',emoji:'🚃',style:'transit'},{id:'stay',label:'住宿',emoji:'🏨',style:'stay'},{id:'shop',label:'購物',emoji:'🛍️',style:'shop'},{id:'other',label:'其他',emoji:'📌',style:'other'}];
  const expenseCategories = ['餐飲','交通','住宿','景點','購物','其他'];
  const bookingTypes = ['機票','住宿','交通','活動票券','餐廳','保險','其他'];
  const currencies = ['JPY','TWD'];
  const bookingStatuses = [
    {id:'owned',label:'✅ 已購買・待兌換'},
    {id:'reserve',label:'🔴 待劃位／預約'},
    {id:'online',label:'📱 待買電子票'},
    {id:'onsite',label:'🎫 當天現場買'},
    {id:'included',label:'🎟️ Pass涵蓋／免另購'},
    {id:'conditional',label:'🌤️ 視當天情況'},
    {id:'complete',label:'🟢 已完成／已領票'}
  ];
  const currencySymbols = {TWD:'NT$',JPY:'¥',USD:'US$',EUR:'€',KRW:'₩',HKD:'HK$',CNY:'¥',THB:'฿',SGD:'S$'};
  const seed = {version:1,trips:[{
    id:'trip-fukuoka-2026',name:'福岡雙人旅行',destination:'日本・福岡',startDate:'2026-11-01',endDate:'2026-11-08',travelers:2,
    currency:'TWD',emoji:'🌸',activities:[],expenses:[],bookings:[],dayNotes:{}
  }]};

  const $ = selector => document.querySelector(selector);
  const icon = name => `<svg aria-hidden="true"><use href="#i-${name}"></use></svg>`;
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const id = () => (window.crypto?.randomUUID?.() || `r${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const parseDate = iso => new Date(`${iso}T12:00:00`);
  const isoDate = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const dayList = trip => {
    if (!trip) return [];
    let cursor = parseDate(trip.startDate), end = parseDate(trip.endDate), result = [];
    while (cursor <= end && result.length < 180) {result.push(isoDate(cursor)); cursor.setDate(cursor.getDate()+1);}
    return result;
  };
  const dateLabel = value => {if (!value) return '未設定'; const d = parseDate(value); return Number.isNaN(d.getTime()) ? '日期未設定' : `${d.getMonth()+1}/${d.getDate()}`;};
  const dateLong = value => {const d=parseDate(value); return `${d.getFullYear()} 年 ${d.getMonth()+1} 月 ${d.getDate()} 日`;};
  const weekday = value => ['週日','週一','週二','週三','週四','週五','週六'][parseDate(value).getDay()];
  const money = (value, currency='TWD') => `${currencySymbols[currency] || currency} ${Number(value || 0).toLocaleString('zh-TW',{maximumFractionDigits:2})}`;
  const timeRange = item => item.time && item.endTime ? `${item.time}–${item.endTime}` : item.time || (item.endTime ? `至 ${item.endTime}` : '時間未定');
  // Allow quick numeric entry (0743 / 743), while keeping saved times in HH:mm format.
  const normalizeClockTime = value => {
    const raw=String(value||'').trim();
    if(!raw)return '';
    const match=/^(\d{1,2}):?(\d{2})$/.exec(raw);
    if(!match)return null;
    const hours=Number(match[1]),minutes=Number(match[2]);
    if(hours>23||minutes>59)return null;
    return `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}`;
  };
  const getDayTitle = (current,date) => typeof current?.dayTitles?.[date] === 'string' ? current.dayTitles[date] : '';
  const getDayNotes = (current,date) => typeof current?.dayNotes?.[date] === 'string' ? current.dayNotes[date] : '';
  const getDayTodos = (current,date) => Array.isArray(current?.dayTodos?.[date]) ? current.dayTodos[date] : [];
  const shortText = (value, length=48) => String(value||'').length > length ? `${String(value).slice(0,length)}…` : String(value||'');
  const load = () => {try {const raw=localStorage.getItem(KEY);if(!raw)return structuredClone(seed);const data=JSON.parse(raw);return validData(data) ? data : structuredClone(seed);} catch{return structuredClone(seed);}};
  const validData = data => !!data && data.version === 1 && Array.isArray(data.trips) && data.trips.length <= 200 && data.trips.every(trip => trip && typeof trip.id === 'string' && typeof trip.name === 'string' && typeof trip.startDate === 'string' && typeof trip.endDate === 'string' && Array.isArray(trip.activities) && Array.isArray(trip.expenses) && Array.isArray(trip.bookings));
  let data = load();
  let activeTripId = data.trips[0]?.id || null;
  let view = 'overview';
  let selectedDay = {};
  let expenseFilter = '全部';
  let bookingFilter = '全部';
  let toastTimer;

  const trip = () => data.trips.find(item => item.id === activeTripId) || data.trips[0] || null;
  const save = () => {try {localStorage.setItem(KEY,JSON.stringify(data));} catch {toast('儲存失敗：裝置空間或瀏覽器權限不足');}};
  const toast = message => {const el=$('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3000);};
  const setView = next => {view=next;window.scrollTo({top:0,behavior:'smooth'});render();};
  const currentDay = current => {
    const days=dayList(current);
    if (!days.includes(selectedDay[current.id])) selectedDay[current.id]=days[0];
    return selectedDay[current.id];
  };
  const category = key => activityCategories.find(x=>x.id===key) || activityCategories.at(-1);
  const expenseCurrency = (item,current) => currencies.includes(item.currency) ? item.currency : (currencies.includes(current.currency) ? current.currency : 'TWD');
  const currencyTotal = (current,currency) => current.expenses.reduce((sum,item)=>sum+(expenseCurrency(item,current)===currency?Number(item.amount||0):0),0);
  const bookingStatus = key => bookingStatuses.find(x=>x.id===key) || {id:'other',label:'📁 未設定狀態'};

  function renderNavigation(){
    $('#desktop-nav').innerHTML=views.map(item=>`<button class="nav-button ${view===item.id?'active':''}" data-nav="${item.id}">${icon(item.icon)}${item.label}</button>`).join('');
    $('#mobile-nav').innerHTML=views.map(item=>`<button class="${view===item.id?'active':''}" data-nav="${item.id}" aria-label="${item.label}">${icon(item.icon)}<span>${item.label}</span></button>`).join('');
    $('#sidebar-trips').innerHTML=data.trips.length ? data.trips.map(x=>`<button class="sidebar-trip ${activeTripId===x.id?'active':''}" data-trip="${escapeHTML(x.id)}">${escapeHTML(x.name)}</button>`).join('') : '<div class="small-muted" style="padding:8px 12px">尚未建立旅行</div>';
    $('#topbar-crumb').textContent=views.find(x=>x.id===view)?.label || '總覽';
  }

  function render(){
    renderNavigation();
    const content=$('#app-content');
    content.innerHTML=({overview:renderOverview,itinerary:renderItinerary,posters:renderPosters,budget:renderBudget,bookings:renderBookings})[view]();
    if(view==='itinerary'){
      const current=trip();
      if(current)content.querySelector('.day-notes-box')?.insertAdjacentHTML('beforebegin',renderDayTodos(current,currentDay(current)));
    }
  }

  function tripRow(item){
    return `<button class="trip-row" data-trip="${escapeHTML(item.id)}" data-open-trip="1"><span class="trip-emoji">${escapeHTML(item.emoji||'🧳')}</span><span class="trip-row-main"><strong>${escapeHTML(item.name)}</strong><small>${escapeHTML(item.destination||'目的地待定')} · ${dateLabel(item.startDate)} – ${dateLabel(item.endDate)} · ${dayList(item).length} 天</small></span><span class="chev">${icon('chevron')}</span></button>`;
  }
  function renderOverview(){
    const current=trip();
    if(!current) return `<div class="page-intro"><div><span class="eyebrow">旅行手帳 · 交大波迪猴子製作</span><h1>每一段旅程，都值得好好收藏。</h1><p>從第一趟旅行開始，建立自己的旅遊手帳。</p></div></div><div class="no-trips-cover"><div class="cover-emoji">🧳</div><h2>你的旅程，從這裡開始</h2><p>建立一趟旅行，就能開始安排每日行程、記錄花費與預訂資料。</p><button class="button primary" data-action="new-trip">${icon('plus')} 建立第一趟旅行</button></div>`;
    const totalActivities=current.activities.length;
    const nextActivities=[...current.activities].sort((a,b)=>`${a.date} ${a.time||'99:99'}`.localeCompare(`${b.date} ${b.time||'99:99'}`)).slice(0,3);
    return `<div class="page-intro"><div><span class="eyebrow">YOUR PERSONAL TRAVEL STUDIO</span><h1>嗨，下一站去哪裡？ ✳</h1><p>把旅行的期待、安排與回憶，慢慢收進一本手帳裡。</p></div><button class="button outline" data-action="new-trip">${icon('plus')} 新旅行</button></div>
    <section class="hero"><div class="hero-copy"><span class="eyebrow">CURRENT JOURNEY · ${dateLabel(current.startDate)} — ${dateLabel(current.endDate)}</span><h2>${escapeHTML(shortText(current.name,22))}<br><em>Let’s make memories.</em></h2><p>${escapeHTML(current.destination||'目的地尚未設定')} · ${current.travelers||1} 人同行 · ${dayList(current).length} 天的精彩旅程</p><div class="hero-buttons"><button class="button primary" data-nav="itinerary">打開旅遊手帳 ${icon('arrow')}</button><button class="button outline" data-action="edit-trip">${icon('pencil')} 編輯旅行</button></div></div><div class="hero-art"><div class="big-sun"></div><div class="stamp">BON VOYAGE</div><div class="passport">${icon('compass')}</div><div class="ticket-art">BOARDING PASS<strong>GOOD TIMES</strong></div></div></section>
    <div class="stat-grid"><div class="stat-card"><div class="stat-icon">${icon('calendar')}</div><div><small>旅行天數</small><strong>${dayList(current).length}<span class="unit">天</span></strong></div></div><div class="stat-card"><div class="stat-icon gold">${icon('map')}</div><div><small>已排行程</small><strong>${totalActivities}<span class="unit">個</span></strong></div></div><div class="stat-card"><div class="stat-icon green">${icon('wallet')}</div><div><small>目前花費（分幣別）</small><strong class="dual-currency-total">${money(currencyTotal(current,'JPY'),'JPY')}<span class="currency-separator">／</span>${money(currencyTotal(current,'TWD'),'TWD')}</strong></div></div></div>
    <div class="section-title"><div><h2>旅行工作台</h2><p>先從最重要的安排開始</p></div></div><div class="split-layout"><div class="panel"><div class="panel-header"><div><h3>我的旅行收藏</h3><small>可建立多趟旅程，自由切換</small></div><button class="section-link" data-action="new-trip">${icon('plus')} 新增</button></div><div class="trip-list">${data.trips.map(tripRow).join('')}</div></div><div class="panel"><div class="panel-header"><div><h3>行程速覽</h3><small>${escapeHTML(current.name)}</small></div><button class="section-link" data-nav="itinerary">前往行程 ${icon('arrow')}</button></div>${nextActivities.length?nextActivities.map(x=>`<div class="info-tile"><span style="font-size:21px">${category(x.category).emoji}</span><div><small>${dateLabel(x.date)} · ${escapeHTML(timeRange(x))}</small><strong>${escapeHTML(shortText(x.title,34))}</strong></div></div>`).join(''):`<div class="quiet-note">✏️ 這趟旅程還沒有安排任何活動。先新增一個景點、餐廳或交通，就會顯示在這裡。</div>`}<button class="button secondary small" style="width:100%;margin-top:15px" data-action="add-activity">${icon('plus')} 新增行程</button></div></div>
    <div class="footer-tip">✿ 旅途中的小事，也值得被珍藏。</div>`;
  }

  function activityCard(item){
    const c=category(item.category);
    const maps=item.location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}` : '';
    return `<article class="route-stop"><div class="route-marker ${c.style}">${c.emoji}</div><div class="route-stop-card"><div class="route-card-top"><div class="route-stop-title">${escapeHTML(item.title)}</div>${item.time||item.endTime?`<span class="time-tag">${icon('clock')} ${escapeHTML(timeRange(item))}</span>`:''}</div>${item.notes?`<p>${escapeHTML(item.notes)}</p>`:''}${item.location?`<div class="location">${icon('map')} ${escapeHTML(item.location)}</div>`:''}<div class="card-tools">${maps?`<a href="${maps}" target="_blank" rel="noopener noreferrer">${icon('map')} 導航</a>`:''}<button data-action="edit-activity" data-id="${escapeHTML(item.id)}">${icon('pencil')} 編輯</button><button data-action="delete-activity" data-id="${escapeHTML(item.id)}">${icon('trash')} 刪除</button></div></div></article>`;
  }
  function renderDayTodos(current,date){
    const todos=getDayTodos(current,date);
    const completed=todos.filter(item=>item.done).length;
    return `<section class="day-todos-box" aria-label="每日待辦清單"><div class="day-todos-heading"><div><h3>✅ 每日待辦事項</h3><p>訂位方法、出發前確認事項，勾選後自動儲存</p></div><span class="day-todos-progress">${completed} / ${todos.length} 完成</span></div>
      ${todos.length?`<ul class="day-todos-list">${todos.map(item=>`<li class="day-todo-item ${item.done?'is-done':''}"><label class="day-todo-main"><input type="checkbox" data-day-todo-check="${escapeHTML(item.id)}" ${item.done?'checked':''}><span class="day-todo-text"><strong>${escapeHTML(item.text)}</strong>${item.detail?`<small>${escapeHTML(item.detail)}</small>`:''}${item.link&&safeURL(item.link)!=='#'?`<a class="day-todo-link" href="${escapeHTML(safeURL(item.link))}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">🔗 開啟預約／查詢連結</a>`:''}</span></label><div class="day-todo-tools"><button type="button" data-action="edit-day-todo" data-id="${escapeHTML(item.id)}" aria-label="編輯待辦">${icon('pencil')}</button><button type="button" data-action="delete-day-todo" data-id="${escapeHTML(item.id)}" aria-label="刪除待辦">${icon('trash')}</button></div></li>`).join('')}</ul>`:'<p class="day-todos-empty">還沒有待辦事項，可以加上餐廳訂位、交通票券或購物提醒。</p>'}
      <button class="day-todos-add" type="button" data-action="add-day-todo">${icon('plus')} 新增當日待辦</button></section>`;
  }
  function renderItinerary(){
    const current=trip();if(!current)return renderNoTrip();
    const days=dayList(current);const day=currentDay(current);const schedule=current.activities.filter(x=>x.date===day).sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));
    const dayIndex=days.indexOf(day)+1;
    return `<div class="page-intro"><div><span class="eyebrow">THE TRAVEL JOURNAL</span><h1>每日行程手帳 📖</h1><p>${escapeHTML(current.name)} · 一天一天，留下旅途的模樣</p></div><button class="button primary" data-action="add-activity">${icon('plus')} 新增行程</button></div>
    <div class="day-strip" role="tablist" aria-label="選擇旅行日期">${days.map((date,i)=>`<button role="tab" aria-selected="${day===date}" class="day-pill ${day===date?'active':''} ${getDayTitle(current,date)?'has-title':''}" title="${escapeHTML(getDayTitle(current,date)||`第 ${i+1} 天`)}" data-day="${date}"><small>DAY ${String(i+1).padStart(2,'0')}</small><strong>${parseDate(date).getDate()}</strong><span>${weekday(date)}</span>${getDayTitle(current,date)?`<em class="day-title">${escapeHTML(getDayTitle(current,date))}</em>`:''}</button>`).join('')}</div>
    <div class="planner-layout"><section class="journal-paper"><div class="journal-heading"><div class="journal-heading-copy"><small>MY LITTLE TRAVEL DIARY · DAY ${String(dayIndex).padStart(2,'0')}</small><h2>${getDayTitle(current,day)?escapeHTML(getDayTitle(current,day)):`${dateLong(day)}・${weekday(day)}`}</h2>${getDayTitle(current,day)?`<p class="journal-date">${dateLong(day)}・${weekday(day)}</p>`:''}</div><div class="journal-tools"><button class="journal-edit" data-action="edit-day-title" aria-label="${getDayTitle(current,day)?'修改當日標題':'設定當日標題'}">${icon('pencil')} <span>${getDayTitle(current,day)?'修改標題':'設定標題'}</span></button><div class="sticker">${dayIndex%2?'🌸':'🧭'}</div></div></div><section class="day-notes-box" aria-labelledby="day-notes-heading"><div class="day-notes-heading"><div><h3 id="day-notes-heading">📌 當日提醒與備忘</h3><p>交通接法・現場購票・需要提前預約的事</p></div><span class="day-notes-status" role="status" aria-live="polite">自動儲存</span></div><label class="day-notes-label" for="daily-notes">${dateLabel(day)} 的專屬備註（可直接修改）</label><textarea id="daily-notes" data-day-notes="${day}" rows="5" maxlength="4000" placeholder="寫下今天需要注意的事項、票券領取地點、候補交通、訂位電話等…">${escapeHTML(getDayNotes(current,day))}</textarea></section>${schedule.length?`<div class="route-list">${schedule.map(activityCard).join('')}</div>`:`<div class="journal-blank"><span class="illustration">🗺️</span><h3>這一天，還是一張空白地圖</h3><p>等你決定要去哪裡，再把景點、交通和美食排成專屬的路線。</p><button class="button secondary small" data-action="add-activity">${icon('plus')} 安排第一站</button></div>`}</section>
    <aside class="panel info-panel"><div class="tip-icon">✉️</div><h3 style="margin:8px 0 3px">這一天的小筆記</h3><p>每個行程都能記下開始、結束時間、地點和備註，點「導航」還能直接開啟 Google Maps。</p><div class="info-tile">${icon('calendar')}<div><small>當天行程</small><strong>${schedule.length} 個安排</strong></div></div><div class="info-tile">${icon('clock')}<div><small>第一站</small><strong>${schedule.length ? `${escapeHTML(timeRange(schedule[0]))} · ${escapeHTML(shortText(schedule[0].title,18))}`:'還沒安排'}</strong></div></div><button class="button outline" data-action="add-activity">${icon('plus')} 新增這一天的行程</button><button class="button clear" data-action="edit-trip">${icon('pencil')} 編輯旅行設定</button><button class="button clear" style="color:#bc746d" data-action="delete-trip">${icon('trash')} 刪除整趟旅行</button><div class="alert-note">🎨 插畫式路線為手帳風格示意，尚未根據真實地理位置排列。確定景點後，可以再製作你提供的那種完整景點插畫地圖。</div></aside></div>`;
  }
  function renderNoTrip(){return `<div class="no-trips-cover"><div class="cover-emoji">✈️</div><h2>先建立一趟旅行吧</h2><p>建立旅程後，就能開始規劃這個頁面的內容。</p><button class="button primary" data-action="new-trip">${icon('plus')} 建立旅行</button></div>`;}
  function renderPosters(){
    const current=trip();
    if(!current)return renderNoTrip();
    return window.RoamyPosterPage.render({current,days:dayList(current),day:currentDay(current),escapeHTML,icon,dateLabel});
  }
  function renderBudget(){
    const current=trip();if(!current)return renderNoTrip();
    const expenses=[...current.expenses].filter(x=>expenseFilter==='全部'||x.category===expenseFilter).sort((a,b)=>b.date.localeCompare(a.date));
    const options=['全部',...expenseCategories];
    return `<div class="page-intro"><div><span class="eyebrow">TRAVEL MONEY DIARY</span><h1>旅費小帳本 💰</h1><p>每一筆開銷都記得清清楚楚，旅行更安心</p></div><button class="button primary" data-action="add-expense">${icon('plus')} 記一筆</button></div>
    <div class="budget-summary currency-summary"><div class="money-card featured"><small>日圓支出合計</small><strong>${money(currencyTotal(current,'JPY'),'JPY')}</strong><div class="hint">¥ JPY · 不自動換算台幣</div></div><div class="money-card"><small>台幣支出合計</small><strong>${money(currencyTotal(current,'TWD'),'TWD')}</strong><div class="small-muted" style="margin-top:10px">NT$ TWD · 與日圓分開統計</div></div></div>
    <div class="section-title"><div><h2>支出明細</h2><p>每筆消費獨立選擇日圓或台幣，不再設定預算</p></div></div><div class="filter-row">${options.map(x=>`<button class="filter-chip ${expenseFilter===x?'active':''}" data-filter="${x}">${x}</button>`).join('')}</div><div class="panel"><div class="transactions">${expenses.length?expenses.map(x=>`<div class="transaction"><div class="transaction-icon">${({餐飲:'🍽️',交通:'🚃',住宿:'🏨',景點:'🎟️',購物:'🛍️',其他:'🧾'})[x.category]||'🧾'}</div><div class="transaction-main"><strong>${escapeHTML(x.title)}</strong><small>${dateLabel(x.date)} · ${escapeHTML(x.category)}${x.note?' · '+escapeHTML(shortText(x.note,45)):''}</small></div><div class="transaction-amount">−${money(x.amount,expenseCurrency(x,current))}</div><button class="icon-button" aria-label="編輯支出" data-action="edit-expense" data-id="${escapeHTML(x.id)}">${icon('pencil')}</button><button class="icon-button" aria-label="刪除支出" data-action="delete-expense" data-id="${escapeHTML(x.id)}">${icon('trash')}</button></div>`).join(''):`<div class="empty"><span class="empty-art">🪙</span><strong>還沒有符合條件的支出</strong><p>吃的、交通、住宿都可以記在這裡。</p><button class="button secondary small" data-action="add-expense">${icon('plus')} 新增支出</button></div>`}</div></div><div class="alert-note">💡 日圓與台幣分開加總，沒有使用估算匯率。既有舊支出若未儲存幣別，會沿用原本的旅行幣別，編輯該筆即可更改。</div>`;
  }
  function renderBookings(){
    const current=trip();if(!current)return renderNoTrip();
    const all=[...current.bookings].sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999'));
    const items=all.filter(x=>bookingFilter==='全部'||x.status===bookingFilter);
    const pending=all.filter(x=>['owned','reserve','online','onsite'].includes(x.status)).length;
    return `<div class="page-intro"><div><span class="eyebrow">EVERYTHING IN ONE PLACE</span><h1>票券與預訂收納夾 🎫</h1><p>已買待換、待劃位、當日購買與 Pass 涵蓋，一眼看懂</p></div><button class="button primary" data-action="add-booking">${icon('plus')} 新增票券</button></div>
    <div class="ticket-summary">共有 ${all.length} 筆票券／交通安排 · <strong>${pending} 筆需要接續處理</strong><span>（已領券或已劃位後，點「編輯」更新狀態）</span></div>
    <div class="filter-row ticket-filters">${[{id:'全部',label:'全部'},...bookingStatuses].map(s=>`<button class="filter-chip ${bookingFilter===s.id?'active':''}" data-booking-filter="${escapeHTML(s.id)}">${escapeHTML(s.label)}</button>`).join('')}</div>
    ${items.length?`<div class="booking-grid">${items.map(x=>`<article class="booking-card"><div class="booking-symbol">${({機票:'✈️',住宿:'🏨',交通:'🚆',活動票券:'🎟️',餐廳:'🍽️',保險:'🛡️',其他:'📁'})[x.type]||'📁'}</div><div><div class="ticket-tags"><span class="tag">${escapeHTML(x.type)}</span><span class="ticket-status status-${escapeHTML(bookingStatus(x.status).id)}">${escapeHTML(bookingStatus(x.status).label)}</span></div><h3 style="margin:9px 0 5px">${escapeHTML(x.title)}</h3><div class="booking-meta">${x.date?escapeHTML(x.date):'未設定日期'}${x.reference?' · '+escapeHTML(shortText(x.reference,30)):''}</div>${x.note?`<p class="small-muted">${escapeHTML(x.note)}</p>`:''}</div><div class="card-tools">${x.link?`<a href="${escapeHTML(safeURL(x.link))}" target="_blank" rel="noopener noreferrer">${icon('external')} 開啟預訂頁</a>`:''}<button data-action="edit-booking" data-id="${escapeHTML(x.id)}">${icon('pencil')} 編輯／改狀態</button><button data-action="delete-booking" data-id="${escapeHTML(x.id)}">${icon('trash')} 刪除</button></div></article>`).join('')}</div>`:`<div class="empty" style="padding:65px 20px"><span class="empty-art">🎟️</span><strong>${all.length?'這個狀態目前沒有票券':'票券收納夾目前是空的'}</strong><p>可新增車票、套票或預約資訊，並設定接下來的處理狀態。</p><button class="button secondary" data-action="add-booking">${icon('plus')} 新增票券</button></div>`}
    <div class="alert-note">🔒 票券頁目前只儲存你輸入的文字與網站連結，不會上傳票券圖片或 PDF。建議不要在此填入護照號碼、完整信用卡資訊等敏感資料。</div>`;
  }
  function safeURL(value){try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)?url.href:'#';}catch{return '#';}}

  function dialog(title,subtitle,body,onSubmit){
    $('#dialog-content').innerHTML=`<div class="dialog-head"><div><h2>${title}</h2><p>${subtitle}</p></div><button class="icon-button" type="button" data-action="close-dialog" aria-label="關閉">${icon('x')}</button></div><div class="dialog-body"><form id="modal-form">${body}<div class="form-actions"><button class="button outline" type="button" data-action="close-dialog">取消</button><button class="button primary" type="submit">${icon('check')} 儲存</button></div></form></div>`;
    const modal=$('#app-dialog');modal.showModal();
    $('#modal-form').querySelectorAll('input[data-clock-entry]').forEach(input=>{
      input.addEventListener('blur',()=>{
        const formatted=normalizeClockTime(input.value);
        if(formatted!==null)input.value=formatted;
      });
    });
    $('#modal-form').addEventListener('submit',event=>{event.preventDefault();const form=event.currentTarget;if(form.reportValidity()&&onSubmit(new FormData(form))) {modal.close();render();}});
  }
  const field = (label,name,type,value='',extra='',full=false) => `<div class="field ${full?'full':''}"><label for="field-${name}">${label}</label><input id="field-${name}" name="${name}" type="${type}" value="${escapeHTML(value)}" ${extra}></div>`;
  const clockField = (label,name,value='') => field(label,name,'text',value,'inputmode="numeric" data-clock-entry autocomplete="off" maxlength="5" placeholder="例如 0743"');
  const select = (label,name,values,value='',full=false) => `<div class="field ${full?'full':''}"><label for="field-${name}">${label}</label><select id="field-${name}" name="${name}">${values.map(x=>`<option value="${escapeHTML(typeof x==='string'?x:x.id)}" ${value===(typeof x==='string'?x:x.id)?'selected':''}>${escapeHTML(typeof x==='string'?x:x.label)}</option>`).join('')}</select></div>`;
  const textarea = (label,name,value='') => `<div class="field full"><label for="field-${name}">${label}</label><textarea id="field-${name}" name="${name}" maxlength="2500">${escapeHTML(value)}</textarea></div>`;
  const val = (form,name) => String(form.get(name)||'').trim();

  function tripModal(edit=false){
    const current=edit?trip():null;
    const body=`<div class="form-grid">${field('旅行名稱 *','name','text',current?.name||'','required maxlength="70"',true)}${field('目的地','destination','text',current?.destination||'','maxlength="100"',true)}${field('出發日期 *','start','date',current?.startDate||'','required')}${field('回程日期 *','end','date',current?.endDate||'','required')}${field('同行人數','travelers','number',current?.travelers||2,'min="1" max="99"')}${select('旅行封面','emoji',tripEmoji.map(e=>({id:e,label:e})),current?.emoji||'🗼')}</div><p class="helper-text">一趟旅行能新增多天行程與多筆預訂；每筆支出可獨立選日圓或台幣。</p>`;
    dialog(edit?'編輯旅行':'開啟新旅程',edit?'更新日期與目的地':'替這趟旅程取個喜歡的名字吧',body,form=>{
      const start=val(form,'start'),end=val(form,'end');
      const dayDiff=(parseDate(end)-parseDate(start))/86400000;
      if (!Number.isFinite(dayDiff)||dayDiff<0){toast('回程日期不能早於出發日期');return false;}
      if (dayDiff>=180){toast('單趟旅行最多 180 天');return false;}
      const changes={name:val(form,'name'),destination:val(form,'destination'),startDate:start,endDate:end,travelers:Number(val(form,'travelers'))||1,emoji:val(form,'emoji')};
      if(edit){
        if([...current.activities,...current.expenses].some(x=>x.date<start||x.date>end)){toast('已有資料落在新日期範圍外，請先調整日期');return false;}
        Object.assign(current,changes);toast('旅行設定已更新');
      }
      else {const created={id:id(),...changes,activities:[],expenses:[],bookings:[],dayNotes:{},dayTodos:{}};data.trips.push(created);activeTripId=created.id;view='itinerary';toast('旅行建立完成！');}
      save();return true;
    });
  }

  function dayTitleModal(){
    const current=trip();if(!current)return;
    const date=currentDay(current);
    const body=`<div class="form-grid">${field('當日標題','dayTitle','text',getDayTitle(current,date),'maxlength="60" placeholder="例如：熊本一日遊"',true)}</div><p class="helper-text">留空儲存即可清除標題，不會刪除當天的行程。</p>`;
    dialog('編輯當日標題',`${dateLong(date)}・${weekday(date)}`,body,form=>{
      const title=val(form,'dayTitle');
      if(!current.dayTitles)current.dayTitles={};
      if(title)current.dayTitles[date]=title;
      else delete current.dayTitles[date];
      save();toast(title?'當日標題已更新':'當日標題已清除');return true;
    });
  }

  function dayTodoModal(editId){
    const current=trip();if(!current)return;
    const date=currentDay(current),item=getDayTodos(current,date).find(x=>x.id===editId);
    const body=`<div class="form-grid">${field('待辦事項 *','text','text',item?.text||'','required maxlength="160" placeholder="例如：訂位肉の山翔 19:30／2人"',true)}${textarea('方法、電話或特別提醒','detail',item?.detail||'')}${field('官方訂位／查詢網址（選填）','link','url',item?.link||'','placeholder="https://..."',true)}</div><p class="helper-text">完成後可直接勾選；資料會儲存在這台裝置，也會包含在 JSON 備份內。</p>`;
    dialog(item?'編輯當日待辦':'新增當日待辦',`${dateLong(date)}・${weekday(date)}`,body,form=>{
      const payload={text:val(form,'text'),detail:val(form,'detail'),link:val(form,'link')};
      if(payload.link&&safeURL(payload.link)==='#'){toast('請輸入有效的 https:// 或 http:// 網址');return false;}
      if(!current.dayTodos||typeof current.dayTodos!=='object')current.dayTodos={};
      if(!Array.isArray(current.dayTodos[date]))current.dayTodos[date]=[];
      if(item)Object.assign(item,payload);else current.dayTodos[date].push({id:id(),done:false,...payload});
      save();toast(item?'待辦已更新':'待辦已新增');return true;
    });
  }

  function removeDayTodo(todoId){
    const current=trip();if(!current)return;
    const date=currentDay(current),item=getDayTodos(current,date).find(x=>x.id===todoId);
    if(!item||!window.confirm(`刪除待辦「${item.text}」嗎？`))return;
    current.dayTodos[date]=getDayTodos(current,date).filter(x=>x.id!==todoId);
    save();render();toast('待辦已刪除');
  }

  function activityModal(editId){
    const current=trip();if(!current){tripModal();return;}
    const item=current.activities.find(x=>x.id===editId);
    const body=`<div class="form-grid">${field('行程名稱 *','title','text',item?.title||'','required maxlength="120"',true)}${select('日期','date',dayList(current).map(d=>({id:d,label:`${dateLabel(d)} ${weekday(d)}`})),item?.date||currentDay(current))}${select('分類','category',activityCategories,item?.category||'spot')}${clockField('開始時間','time',item?.time||'')}${clockField('結束時間','endTime',item?.endTime||'')}${field('地點 / Google Maps 搜尋字','location','text',item?.location||'','maxlength="150"',true)}${textarea('備註（交通方式、營業時間、提醒等）','notes',item?.notes||'')}</div><p class="helper-text">直接打數字即可：<strong>0743 → 07:43</strong>、<strong>1717 → 17:17</strong>。也可輸入 7:43，時間可留空。</p>`;
    dialog(item?'編輯行程':'新增行程',item?'更新這一站的內容':'每一站，都是旅行的一小段故事',body,form=>{
      const time=normalizeClockTime(val(form,'time')),endTime=normalizeClockTime(val(form,'endTime'));
      if(time===null||endTime===null){toast('時間格式有誤，請輸入 0743 或 07:43（24 小時制）');return false;}
      const payload={title:val(form,'title'),date:val(form,'date'),time,endTime,category:val(form,'category'),location:val(form,'location'),notes:val(form,'notes')};
      if(payload.endTime&&!payload.time){toast('請先填寫開始時間');return false;}
      if(payload.time&&payload.endTime&&payload.endTime<=payload.time){toast('結束時間需要晚於開始時間，跨日行程請在備註說明');return false;}
      if(item)Object.assign(item,payload);else current.activities.push({id:id(),...payload});
      selectedDay[current.id]=payload.date;view='itinerary';save();toast('行程已儲存');return true;
    });
  }

  function expenseModal(editId){
    const current=trip();if(!current){tripModal();return;}
    const item=current.expenses.find(x=>x.id===editId);
    const body=`<div class="form-grid">${field('支出名稱 *','title','text',item?.title||'','required maxlength="100"',true)}${field('金額 *','amount','number',item?.amount??'','required min="0" step="0.01"')}${select('幣別 *','currency',[{id:'JPY',label:'¥ 日圓 JPY'},{id:'TWD',label:'NT$ 台幣 TWD'}],item?expenseCurrency(item,current):'JPY')}${select('分類','category',expenseCategories,item?.category||'餐飲')}${select('日期','date',dayList(current).map(d=>({id:d,label:dateLabel(d)})),item?.date||currentDay(current))}${textarea('備註','note',item?.note||'')}</div>`;
    dialog(item?'編輯支出':'新增支出','請依實際付款幣別輸入；日圓與台幣分開統計',body,form=>{
      const payload={title:val(form,'title'),amount:Number(val(form,'amount')),currency:val(form,'currency'),category:val(form,'category'),date:val(form,'date'),note:val(form,'note')};
      if(item)Object.assign(item,payload);else current.expenses.push({id:id(),...payload});view='budget';save();toast('支出已儲存');return true;
    });
  }

  function bookingModal(editId){
    const current=trip();if(!current){tripModal();return;}
    const item=current.bookings.find(x=>x.id===editId);
    const body=`<div class="form-grid">${field('預訂 / 票券名稱 *','title','text',item?.title||'','required maxlength="120"',true)}${select('類型','type',bookingTypes,item?.type||'活動票券')}${select('票券狀態','status',bookingStatuses,item?.status||'reserve',true)}${field('使用日期','date','date',item?.date||'')}${field('訂單編號（可不填）','reference','text',item?.reference||'','maxlength="120"',true)}${field('官方頁面 / 電子票券連結','link','url',item?.link||'','placeholder="https://..."',true)}${textarea('提醒與備註','note',item?.note||'')}</div>`;
    dialog(item?'編輯票券':'收進票券夾','把預約資訊放好，旅行當天就不慌張',body,form=>{
      const payload={title:val(form,'title'),type:val(form,'type'),status:val(form,'status'),date:val(form,'date'),reference:val(form,'reference'),link:val(form,'link'),note:val(form,'note')};
      if(payload.link&&safeURL(payload.link)==='#'){toast('票券連結須使用 https:// 或 http://');return false;}
      if(item)Object.assign(item,payload);else current.bookings.push({id:id(),...payload});view='bookings';save();toast('票券已儲存');return true;
    });
  }
  function removeItem(kind,recordId){
    const current=trip();if(!current)return;
    const array=current[kind];const target=array.find(x=>x.id===recordId);if(!target)return;
    if(!window.confirm(`確定要刪除「${target.title}」嗎？此操作無法復原。`))return;
    current[kind]=array.filter(x=>x.id!==recordId);save();render();toast('已刪除');
  }
  function removeTrip(){
    const current=trip();if(!current)return;
    if(!window.confirm(`確定刪除整趟「${current.name}」嗎？其中的行程、支出、票券都會一起刪除，無法復原。`))return;
    data.trips=data.trips.filter(x=>x.id!==current.id);activeTripId=data.trips[0]?.id||null;view='overview';save();render();toast('旅行已刪除');
  }
  function exportData(){
    const blob=new Blob([JSON.stringify({...data,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'});
    const objectURL=URL.createObjectURL(blob);const link=document.createElement('a');link.href=objectURL;link.download=`旅行手帳-backup-${isoDate(new Date())}.json`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(objectURL),1000);toast('備份檔已下載');
  }
  async function importData(file){
    if(!file)return;
    if(file.size>5*1024*1024){toast('備份檔超過 5 MB，無法匯入');return;}
    try{
      const candidate=JSON.parse(await file.text());if(!validData(candidate))throw new Error('format');
      if(!window.confirm('匯入將完全取代目前裝置上的旅行資料。建議先匯出備份，確定繼續嗎？'))return;
      data={version:1,trips:candidate.trips};activeTripId=data.trips[0]?.id||null;selectedDay={};view='overview';save();render();toast('備份匯入完成');
    }catch{toast('不是有效的旅行手帳備份檔案');}
  }

  document.addEventListener('click',event=>{
    const nav=event.target.closest('[data-nav]');if(nav){setView(nav.dataset.nav);return;}
    const tripButton=event.target.closest('[data-trip]');if(tripButton){activeTripId=tripButton.dataset.trip;if(tripButton.dataset.openTrip)view='itinerary';render();return;}
    const dayButton=event.target.closest('[data-day]');if(dayButton){const current=trip();if(current)selectedDay[current.id]=dayButton.dataset.day;render();return;}
    const chip=event.target.closest('[data-filter]');if(chip){expenseFilter=chip.dataset.filter;render();return;}
    const ticketChip=event.target.closest('[data-booking-filter]');if(ticketChip){bookingFilter=ticketChip.dataset.bookingFilter;render();return;}
    const button=event.target.closest('[data-action]');if(!button)return;
    const action=button.dataset.action,recordId=button.dataset.id;
    switch(action){
      case 'new-trip':tripModal();break;
      case 'edit-trip':tripModal(true);break;
      case 'edit-day-title':dayTitleModal();break;
      case 'add-day-todo':dayTodoModal();break;
      case 'edit-day-todo':dayTodoModal(recordId);break;
      case 'delete-day-todo':removeDayTodo(recordId);break;
      case 'delete-trip':removeTrip();break;
      case 'add-activity':activityModal();break;
      case 'download-poster':window.RoamyPosterPage.download({current:trip(),day:currentDay(trip()),toast});break;
      case 'edit-poster-day':setView('itinerary');break;
      case 'edit-activity':activityModal(recordId);break;
      case 'delete-activity':removeItem('activities',recordId);break;
      case 'add-expense':expenseModal();break;
      case 'edit-expense':expenseModal(recordId);break;
      case 'delete-expense':removeItem('expenses',recordId);break;
      case 'add-booking':bookingModal();break;
      case 'edit-booking':bookingModal(recordId);break;
      case 'delete-booking':removeItem('bookings',recordId);break;
      case 'export':exportData();break;
      case 'import':$('#import-file').click();break;
      case 'close-dialog':$('#app-dialog').close();break;
    }
  });
  document.addEventListener('input',event=>{
    const editor=event.target.closest('[data-day-notes]');
    if(!editor)return;
    const current=trip();
    if(!current||!dayList(current).includes(editor.dataset.dayNotes))return;
    if(!current.dayNotes||typeof current.dayNotes!=='object')current.dayNotes={};
    current.dayNotes[editor.dataset.dayNotes]=editor.value;
    save();
    const status=document.querySelector('.day-notes-status');
    if(status)status.textContent='✓ 已儲存';
  });
  document.addEventListener('change',event=>{
    const checkbox=event.target.closest('[data-day-todo-check]');if(!checkbox)return;
    const current=trip();if(!current)return;
    const item=getDayTodos(current,currentDay(current)).find(x=>x.id===checkbox.dataset.dayTodoCheck);
    if(!item)return;
    item.done=checkbox.checked;save();render();
  });
  $('#import-file').addEventListener('change',event=>{importData(event.target.files[0]);event.target.value='';});
  $('#app-dialog').addEventListener('click',event=>{if(event.target===$('#app-dialog'))$('#app-dialog').close();});
  if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
  render();
})();
