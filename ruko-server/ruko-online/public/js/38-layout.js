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
