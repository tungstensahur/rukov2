/* ---------- v38: the desktop layout ---------- */
/* Every page used to be built for a phone and simply stretched on a computer: full width tab
   buttons, one long column, previews that scrolled away. This overlay leaves the markup alone
   and gives the pages on a computer their own dressing, page by page. Home, games, messages and
   create are left exactly as they are. */
(function(){
 if(window.RKLAY)return;
 const PAGE=()=>String(location.hash||'#/').replace(/^#\/?/,'').split('/')[0]||'home';
 // Home, games, messages and create keep their own layout.
 const UNTOUCHED={home:1,create:1,messages:1,g:1,game:1};
 const CSS=`
@media(min-width:901px){
 /* one shared page frame: a calm page width, room to breathe, the same card everywhere */
 html[data-ui=on] main#app{max-width:1280px;margin:0 auto;padding:24px 28px 56px}
 html[data-ui=on] main#app>h2{font-size:25px;line-height:1.25;margin:2px 0 18px;letter-spacing:-.3px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
 html[data-ui=on] .card{border-radius:16px;padding:16px 18px}
 html[data-ui=on] .card>h2:first-child,html[data-ui=on] .card>h3:first-child{margin-top:0}
 html[data-ui=on] h3{margin:22px 0 10px;font-size:17px}
 html[data-ui=on] .stat{margin:14px 0 18px}
 html[data-ui=on] .stat b{font-size:26px;line-height:1.1}

 /* tab bars are one control you can read at a glance, not buttons stretched to the window */
 html[data-ui=on] .tabs{display:inline-flex;flex-wrap:wrap;gap:4px;margin:0 0 18px;padding:4px;
  background:var(--card);border:1px solid var(--bd);border-radius:14px;max-width:100%;vertical-align:top}
 html[data-ui=on] .tabs button{flex:0 0 auto;border:0;background:none;padding:9px 16px;border-radius:10px;font-size:14px;min-height:40px}
 html[data-ui=on] .tabs button:hover{background:var(--bg)}
 html[data-ui=on] .tabs button.on{background:var(--ac);color:#fff}
 html[data-ui=on] .rk-avtabs{display:inline-flex;flex-wrap:wrap;gap:4px;margin:0 0 18px;padding:4px;
  background:var(--card);border:1px solid var(--bd);border-radius:14px;position:sticky;top:var(--rk-avtop,74px);z-index:4}
 html[data-ui=on] .rk-avtabs button{flex:0 0 auto;padding:9px 18px;border-radius:10px;min-height:40px}

 /* a picture beside its settings, and the picture hangs in place while the settings scroll */
 html[data-ui=on] .hat{grid-template-columns:minmax(300px,400px) minmax(0,1fr);gap:20px;align-items:start}
 html[data-ui=on] .hat>:first-child{position:sticky;top:74px}
 html[data-ui=on] .hat img{max-height:62vh;object-fit:contain}
 html[data-ui=on] .hat h2{margin-top:0}

 /* listings */
 html[data-ui=on] .grid{grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px}
 html[data-ui=on] .tile{transition:transform .12s ease}
 html[data-ui=on] .tile:hover{transform:translateY(-2px)}
 html[data-page=catalog] main#app{max-width:1240px}
 html[data-page=catalog] .grid{grid-template-columns:repeat(auto-fill,minmax(200px,1fr))}
 html[data-page=catalog] .tile img{aspect-ratio:1;object-fit:contain;background:var(--bg)}
 html[data-page=players] main#app{max-width:1100px}

 /* pages that are one column of writing get a column, not the whole window */
 html[data-page=settings] main#app{max-width:860px}
 html[data-page=friends] main#app{max-width:1040px}
 html[data-page=user] main#app{max-width:1040px}
 html[data-page=chat] main#app{max-width:900px}
 html[data-page=servers] main#app{max-width:900px}
 html[data-page=admin] main#app{max-width:1320px}
 html[data-page=tickets] main#app{max-width:1000px}
 /* a colour swatch is a swatch, not a full width bar */
 html[data-ui=on] .card>input[type=color]{max-width:240px;display:block}
}
/* the top bar stays one row: anything that does not fit moves into the More menu */
#top{flex-wrap:nowrap}
#top nav{flex-wrap:nowrap;min-width:0;overflow:hidden}
@media(min-width:901px){
 #top{gap:8px;padding:8px 14px}
 #top .logo{font-size:20px}
 #top nav{gap:4px}
 #top nav button{padding:7px 10px;font-size:13.5px;gap:5px;border-radius:9px}
}
`;
 const st=document.createElement('style');
 st.id='rk-layout';
 st.textContent=CSS;
 document.head.appendChild(st);

 const sync=()=>{
  const p=PAGE();
  document.documentElement.dataset.page=p;
  document.documentElement.dataset.ui=UNTOUCHED[p]?'off':'on';
  fitNav(p);
 };
 // The bar is one row. On a narrower screen the later buttons step into the More menu, which is
 // built from the same buttons, so nothing is lost; widening the window brings them back.
 const DROP=['settings','admin','tickets','friends','messages','catalog','servers','chat'];
 const fitNav=p=>{
  const nav=document.querySelector('#top nav');
  if(!nav||innerWidth<=900)return;
  const bs=[...nav.querySelectorAll('button[data-r]')];
  if(!bs.length)return;
  bs.forEach(b=>b.style.display='');
  for(const r of DROP){
   if(nav.scrollWidth<=nav.clientWidth+1)break;
   const b=nav.querySelector('button[data-r="'+r+'"]');
   if(b&&r!==p)b.style.display='none';
  }
 };
 sync();
 addEventListener('hashchange',sync);
 addEventListener('resize',()=>fitNav(PAGE()));
 setInterval(()=>fitNav(PAGE()),1500);
 // the avatar tabs stick under the bar, whatever height it happens to be
 const topH=()=>{const t=document.getElementById('top');return t?Math.round(t.getBoundingClientRect().bottom+6):74};
 const stick=()=>document.documentElement.style.setProperty('--rk-avtop',topH()+'px');
 stick();
 addEventListener('resize',stick);
 setInterval(()=>{stick();if(PAGE()!==document.documentElement.dataset.page)sync()},1000);
 window.RKLAY={page:PAGE,css:CSS};
})();

/* ---------- the catalog page ---------- */
/* The old page was three rows of cards and a row of dropdowns. This rebuilds it around one item
   worth looking at: a featured item with its picture, price and a button, the best sellers under
   it, then a toolbar and a grid. Filtering and sorting use the same state as before (CF, likes,
   sales), so the rest of the site keeps working exactly as it did. */
(function(){
 if(window.RKCAT)return;
 const CAT_CSS=`
.cat-wrap{display:grid;grid-template-columns:minmax(0,1fr);gap:26px;margin-top:4px}
.cat-wrap>*,.cat-row,.cat-strip{min-width:0}
.cat-hero{display:grid;grid-template-columns:minmax(230px,340px) minmax(0,1fr);gap:22px;align-items:center;
 background:linear-gradient(135deg,rgba(91,75,255,.12),rgba(91,75,255,0) 58%),var(--card);
 border:1px solid var(--bd);border-radius:20px;padding:18px}
.cat-hero-art{background:var(--bg);border-radius:16px;padding:10px}
.cat-hero-art img{width:100%;aspect-ratio:4/3;object-fit:contain;display:block}
.cat-kicker{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--ac);font-weight:800}
.cat-title{font-size:30px;margin:6px 0 4px;line-height:1.15}
.cat-sub{color:var(--mut);font-size:13.5px}
.cat-desc{margin:10px 0 0;font-size:14px;line-height:1.5;max-width:56ch;opacity:.92}
.cat-facts{display:flex;gap:28px;margin:16px 0 18px;flex-wrap:wrap}
.cat-facts b{display:block;font-size:20px;line-height:1.15}
.cat-facts span{font-size:12px;color:var(--mut)}
.cat-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.cat-actions .pri{min-width:180px}
.cat-row{display:grid;gap:0}
.cat-row-h{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:10px}
.cat-row-h h3{margin:0;font-size:17px}
.cat-strip{display:flex;gap:12px;overflow-x:auto;padding:2px 2px 10px;scroll-snap-type:x mandatory}
.cat-strip>*{flex:0 0 186px;scroll-snap-align:start}
.cat-tile{background:var(--card);border:1px solid var(--bd);border-radius:16px;padding:10px;cursor:pointer;
 transition:transform .14s ease,box-shadow .14s ease,border-color .14s ease;display:flex;flex-direction:column;gap:8px}
.cat-tile:hover{transform:translateY(-2px);border-color:var(--ac);box-shadow:0 12px 26px rgba(20,22,43,.10)}
.cat-shot{position:relative;background:var(--bg);border-radius:12px;overflow:hidden}
.cat-shot img{width:100%;aspect-ratio:1;object-fit:contain;display:block}
.cat-flag{position:absolute;top:8px;left:8px;font-size:10.5px;font-weight:800;letter-spacing:.04em;
 padding:2px 7px;border-radius:999px;background:var(--ac);color:#fff}
.cat-flag.gold{background:#ffc800;color:#14162b}
.cat-flag.grey{background:#6b6f8a;color:#fff}
.cat-love{position:absolute;right:8px;bottom:8px;background:#000a;color:#fff;font-size:11px;padding:2px 7px;border-radius:999px}
.cat-name{font-size:14px;line-height:1.25;margin:0}
.cat-meta{font-size:12px;color:var(--mut);display:flex;justify-content:space-between;gap:8px}
.cat-price{font-weight:700}
.cat-price.own{color:#2f9e6b}
.cat-bar{position:sticky;top:var(--rk-avtop,74px);z-index:3;background:var(--card);border:1px solid var(--bd);
 border-radius:16px;padding:12px 14px;display:grid;gap:10px;margin-bottom:14px}
.cat-bar input{margin:0}
.cat-bar .chips{margin:0}
.cat-bar .selrow{display:flex;gap:8px;flex-wrap:wrap}
.cat-bar .selrow select{flex:1;min-width:150px;margin:0}
.cat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:14px}
@media(max-width:900px){.cat-hero{grid-template-columns:1fr;padding:14px}.cat-title{font-size:23px}.cat-bar{position:static}}
`;
 const st=document.createElement('style');
 st.id='rk-cat';
 st.textContent=CAT_CSS;
 document.head.appendChild(st);

 const SLOTN={head:'Head',face:'Face',back:'Back',shirt:'T-shirt'};
 const fresh=h=>h.at>Date.now()-2592e5;
 const flags=(h,top)=>`${h.special?'<span class="cat-flag gold">SPECIAL</span>':fresh(h)?'<span class="cat-flag">NEW</span>':top.includes(h.id)?'<span class="cat-flag">BEST</span>':''}${h.off?'<span class="cat-flag grey" style="left:auto;right:8px">OFF SALE</span>':''}`;
 const tile=(h,me,top)=>`<div class="cat-tile" data-h="${h.id}">
  <div class="cat-shot"><img src="${thumb(h)}" alt="">${flags(h,top)}<span class="cat-love">❤ ${LK[h.id]||0}</span></div>
  <b class="cat-name">${esc(h.name)}</b>
  <div class="cat-meta"><span>${esc(h.creator)} · ${SLOTN[h.slot||'head']||'Head'}</span></div>
  <div class="cat-meta"><span class="cat-price${me.owned.includes(h.id)?' own':''}">${me.owned.includes(h.id)?'✓ Owned':h.off?'Off sale':'🪙 '+h.price}</span><span>${sales(h)} sold</span></div>
 </div>`;

 catalog=function(){
  const me=cur();
  if(!me)return;
  const A=hats().filter(h=>!h.off||me.owned.includes(h.id)||me.admin||me.mod);
  const live=A.filter(h=>!h.off);
  const best=[...live].sort((a,b)=>sales(b)-sales(a));
  const spec=live.filter(h=>h.special);
  const top=best.slice(0,3).map(h=>h.id);
  const feat=spec.find(h=>!me.owned.includes(h.id))||best[0]||A[0]||null;
  const row=(title,list)=>!list.length?'':`<section class="cat-row"><div class="cat-row-h"><h3>${title}</h3></div><div class="cat-strip">${list.map(h=>tile(h,me,top)).join('')}</div></section>`;
  const hero=!feat?'':`<section class="cat-hero" data-h="${feat.id}">
   <div class="cat-hero-art"><img src="${thumb(feat)}" alt=""></div>
   <div>
    <div class="cat-kicker">✦ Featured item</div>
    <h2 class="cat-title">${esc(feat.name)}</h2>
    <div class="cat-sub">By <b>${esc(feat.creator)}</b> · ${SLOTN[feat.slot||'head']||'Head'}${feat.special?' · <b style="color:#c99900">Special</b>':''}</div>
    ${feat.desc?`<p class="cat-desc">${esc(feat.desc)}</p>`:`<p class="cat-desc mut">${me.owned.includes(feat.id)?'You own this one — wear it from your avatar.':'A piece worth showing off. Preview it, then wear it in every game.'}</p>`}
    <div class="cat-facts"><div><b>${me.owned.includes(feat.id)?'Owned':'🪙 '+feat.price}</b><span>${me.owned.includes(feat.id)?'in your items':'price'}</span></div><div><b>${sales(feat)}</b><span>sold</span></div><div><b>❤ ${LK[feat.id]||0}</b><span>likes</span></div></div>
    <div class="cat-actions"><button class="pri" id="cat-cta">${me.owned.includes(feat.id)?'Open item':'Buy for 🪙 '+feat.price}</button><button id="cat-view">View item</button></div>
   </div></section>`;
  app.innerHTML=`<h2>Catalog <button id="rf" style="font-size:13px;padding:4px 10px;vertical-align:middle">↻ Refresh</button></h2>
  <div class="cat-wrap">
   ${hero}
   ${row('🔥 Top sellers',best.slice(0,6))}
   ${row('✨ Special items',spec.slice(0,6))}
   <section>
    <div class="cat-row-h"><h3>Browse everything</h3></div>
    <div class="cat-bar">
     <input id="cq" placeholder="Search items or creators" value="${esc(CF.q)}">
     <div class="chips">${[['all','All'],['head','Head'],['face','Face'],['back','Back'],['shirt','T-shirts'],['special','✨ Special']].map(([v,n])=>`<button data-sl="${v}" class="${CF.slot==v?'on':''}">${n}</button>`).join('')}</div>
     <div class="selrow">${sel('cs',[['pop','Most popular'],['new','Newest'],['lo','Price: low to high'],['hi','Price: high to low'],['like','Most liked']],CF.sort)}${sel('cr',[['all','All creators'],['ruko','Made by Ruko'],['comm','Community']],CF.src)}${sel('co',[['all','All items'],['owned','Owned'],['not','Not owned']],CF.own)}</div>
    </div>
    <div class="cat-grid" id="cg"></div>
   </section>
  </div>`;
  function sel(id,opts,v){return `<select id="${id}">${opts.map(([k,n])=>`<option value="${k}" ${k==v?'selected':''}>${n}</option>`).join('')}</select>`}
  const wire=()=>app.querySelectorAll('[data-h]').forEach(t=>t.onclick=e=>{if(e.target.closest('.cat-actions'))return;location.hash='#/hat/'+t.dataset.h});
  const paint=()=>{
   const q=CF.q.toLowerCase();
   let L=A.filter(h=>(!q||(h.name+' '+h.creator).toLowerCase().includes(q))&&(CF.slot=='all'||(CF.slot=='special'?h.special:(h.slot||'head')==CF.slot))&&(CF.src=='all'||(CF.src=='ruko')==(h.creator=='Ruko'))&&(CF.own=='all'||(CF.own=='owned')==me.owned.includes(h.id)));
   const key={pop:h=>-sales(h),new:h=>-(h.at||0),lo:h=>h.price,hi:h=>-h.price,like:h=>-(LK[h.id]||0)}[CF.sort]||(h=>-sales(h));
   L.sort((a,b)=>key(a)-key(b));
   $('#cg').innerHTML=L.map(h=>tile(h,me,top)).join('')||'<p class="mut">Nothing matches your filters.</p>';
   wire();
  };
  $('#cq').oninput=e=>{CF.q=e.target.value;paint()};
  app.querySelectorAll('[data-sl]').forEach(b=>b.onclick=()=>{CF.slot=b.dataset.sl;catalog()});
  $('#cs').onchange=e=>{CF.sort=e.target.value;paint()};
  $('#cr').onchange=e=>{CF.src=e.target.value;paint()};
  $('#co').onchange=e=>{CF.own=e.target.value;paint()};
  if(feat){
   const buy=()=>{if(me.owned.includes(feat.id)||feat.off||me.coins<feat.price)return;me.coins-=feat.price;me.owned.push(feat.id);try{shareBuy(feat.id)}catch(e){};render()};
   const cta=$('#cat-cta');
   if(cta)cta.onclick=e=>{e.stopPropagation();me.owned.includes(feat.id)?location.hash='#/hat/'+feat.id:buy()};
   const vw=$('#cat-view');
   if(vw)vw.onclick=e=>{e.stopPropagation();location.hash='#/hat/'+feat.id};
  }
  wire();paint();
 };
 window.RKCAT={tile};
})();
