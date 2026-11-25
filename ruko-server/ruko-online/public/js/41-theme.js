/* ---------- v41: the Ruko look ---------- */
/* The page only ever carries /js files, so the look ships as a script that adds its own stylesheet.
   Everything in it is an override, so removing this file puts the old look back. */
(function(){
 if(document.getElementById('rk-theme'))return;
 const CSS=`
/* ---------- v41: the Ruko look ----------
   Flat, solid colours on purpose: no gradients, no glass, no glow. A game site should read clearly
   at a glance — white cards on a cool grey page, one strong accent, chunky buttons, and a dark bar
   across the top so the frame feels like an app rather than a form.
   Everything here is an override of the older styles, so removing this file puts the site back. */

:root{
 --bg:#eef0f6;
 --card:#ffffff;
 --tx:#12141c;
 --mut:#666c80;
 --ac:#3d5bff;
 --ac-d:#2c46d8;
 --bd:#dde1ee;
 --bd-2:#c8cee0;
 --ok:#1f9d63;
 --bad:#e5484d;
 --sh:0 1px 2px rgba(16,20,40,.06);
 --sh-2:0 6px 18px rgba(16,20,40,.10);
 --r:14px;
 --r-lg:18px;
}
@media (prefers-color-scheme:dark){
 :root:not([data-theme="light"]){
  --bg:#0e1017;--card:#171a24;--tx:#eef1fa;--mut:#9aa1b8;--ac:#6c85ff;--ac-d:#8fa1ff;
  --bd:#262a38;--bd-2:#333849;--sh:0 1px 2px rgba(0,0,0,.35);--sh-2:0 8px 20px rgba(0,0,0,.45);
 }
}
:root[data-theme="dark"]{
 --bg:#0e1017;--card:#171a24;--tx:#eef1fa;--mut:#9aa1b8;--ac:#6c85ff;--ac-d:#8fa1ff;
 --bd:#262a38;--bd-2:#333849;--sh:0 1px 2px rgba(0,0,0,.35);--sh-2:0 8px 20px rgba(0,0,0,.45);
}

html,body{background:var(--bg);color:var(--tx);-webkit-font-smoothing:antialiased;font-size:15px;line-height:1.5}
main{padding:20px 16px 40px}
h1,h2,h3{letter-spacing:-.01em}
h2{font-size:25px;font-weight:800;margin:4px 0 16px}
h3{font-size:17px;font-weight:750}
h2+.mut,h2 .mut{font-weight:500}
.mut{color:var(--mut)}
a,u{text-underline-offset:2px}

/* ---------- the top bar ---------- */
#top{
 background:#12141c;color:#eef1fa;border-bottom:1px solid #000;
 box-shadow:0 2px 10px rgba(10,12,20,.22);
 padding:9px 14px;gap:10px;
}
#top .logo{color:#fff;font-weight:900;letter-spacing:.06em;font-size:21px}
#top nav{gap:6px}
#top nav button{
 background:transparent;color:#c9cee0;border:1px solid transparent;
 font-weight:650;font-size:14px;border-radius:10px;padding:8px 12px;
}
#top nav button:hover{background:#22252f;color:#fff;border-color:#2c3040}
#top nav button.on,#top nav button.pri{background:var(--ac);border-color:var(--ac);color:#fff}
#top>button{background:#1e212b;color:#eef1fa;border:1px solid #2c3040;font-weight:650}
#top>button:hover{background:#262a36}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) #top{background:#0b0d13}}

/* ---------- buttons ---------- */
button{
 border:1px solid var(--bd-2);background:var(--card);color:var(--tx);
 padding:9px 14px;border-radius:11px;font-weight:650;line-height:1.15;
 transition:background .12s,border-color .12s,transform .06s,box-shadow .12s;
 box-shadow:var(--sh);
}
button:hover{border-color:var(--ac);background:var(--card)}
button:active{transform:translateY(1px);box-shadow:none}
button.on{background:var(--ac);border-color:var(--ac);color:#fff}
button.pri{background:var(--ac);border-color:var(--ac);color:#fff;font-weight:750}
button.pri:hover{background:var(--ac-d);border-color:var(--ac-d)}
button:disabled{opacity:.45;box-shadow:none}
/* buttons that only carry an icon or a tiny label should not look like cards */
.chips button,.tabs button,.sc button{box-shadow:none}

/* ---------- inputs ---------- */
input,select,textarea{
 background:var(--card);border:1px solid var(--bd-2);color:var(--tx);
 border-radius:11px;padding:10px 12px;margin:5px 0 12px;font-weight:500;
 transition:border-color .12s,box-shadow .12s;
}
input::placeholder,textarea::placeholder{color:var(--mut)}
input:focus,select:focus,textarea:focus{outline:0;border-color:var(--ac);box-shadow:0 0 0 3px rgba(61,91,255,.18)}
label{font-weight:650;font-size:13px;color:var(--mut);display:block;margin-top:8px}
input[type=color]{height:44px;padding:3px}
input[type=range]{padding:0;border:0;background:transparent;accent-color:var(--ac)}

/* ---------- cards ---------- */
.card{
 background:var(--card);border:1px solid var(--bd);border-radius:var(--r-lg);
 padding:16px;box-shadow:var(--sh);
}
.tile,.cat-tile,.wc{box-shadow:var(--sh)}
.tile:hover,.cat-tile:hover{border-color:var(--ac);box-shadow:var(--sh-2)}
.tile img{border-radius:12px}
.gcard{border-radius:12px}

/* ---------- chips and tabs ---------- */
.chips{gap:8px;margin:12px 0}
.chips button{
 padding:7px 13px;border-radius:999px;font-size:13.5px;font-weight:650;
 background:var(--card);border:1px solid var(--bd-2);color:var(--tx);
}
.chips button:hover{border-color:var(--ac);color:var(--ac)}
.chips button.on{background:var(--ac);border-color:var(--ac);color:#fff}
.tabs{
 gap:4px;padding:4px;background:var(--card);border:1px solid var(--bd);
 border-radius:14px;margin:16px 0;box-shadow:var(--sh);
}
.tabs button{
 flex:1;border:1px solid transparent;background:transparent;box-shadow:none;border-radius:10px;
 font-size:13.5px;font-weight:700;color:var(--mut);padding:9px 10px;line-height:1.15;
}
.tabs button:hover{background:var(--bg);color:var(--tx)}
.tabs button.on{background:var(--ac);color:#fff;border:0}

/* the avatar's own tab strip, so it matches the rest */
.rk-avtabs{background:var(--card);border:1px solid var(--bd);border-radius:14px;padding:4px;box-shadow:var(--sh)}
.rk-avtabs button{
 box-shadow:none;border:1px solid transparent;background:transparent;color:var(--mut);
 font-weight:700;border-radius:10px;line-height:1.15;
}
.rk-avtabs button:hover{background:var(--bg);color:var(--tx);border-color:transparent}
.rk-avtabs button.on{background:var(--ac);color:#fff;border-color:var(--ac)}

/* ---------- catalog ---------- */
.cat-hero{background:var(--card) !important;border-radius:var(--r-lg);box-shadow:var(--sh)}
.cat-hero-art{background:var(--bg);border:1px solid var(--bd)}
.cat-title{font-weight:850}
.cat-kicker{color:var(--ac)}
.cat-tile{border-radius:16px}
.cat-bar{box-shadow:var(--sh);border-radius:14px}
.cat-flag{font-weight:800}

/* ---------- home ---------- */
.hme{border-radius:var(--r-lg)}
.hav{background:var(--bg);border-radius:14px}
.hhd b{font-size:15px;font-weight:750}
#app .rkrc b{font-weight:700;font-size:13.5px}
#app .rkrc img,#app .rkrc .rkgr{border-radius:12px;border:1px solid var(--bd)}

/* ---------- item / profile pages ---------- */
.stat{gap:22px}
.stat b{font-size:23px;font-weight:800}
.hsticky img{border:1px solid var(--bd);border-radius:14px}
.hed{gap:18px}

/* ---------- small print ---------- */
.err{color:var(--bad);font-weight:600}
.stg{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--mut);font-weight:800}

/* ---------- phones ---------- */
@media (max-width:600px){
 h2{font-size:22px}
 main{padding:14px 12px 96px}
 .card{padding:14px;border-radius:16px}
 button{padding:10px 13px}
}
[data-dev=mobile] #top{background:#12141c}
[data-dev=mobile] #top nav{
 background:#12141c;border-top:1px solid #000;padding:6px 4px calc(6px + env(safe-area-inset-bottom,0px));
}
[data-dev=mobile] #top nav button{color:#c9cee0;border:1px solid transparent;border-radius:10px;font-size:11.5px}
[data-dev=mobile] #top nav button.on{background:var(--ac);color:#fff}
`;
 // Faces are shop items now, and their drawings and shop hooks live in their own file. It is
 // started here, the same way 39-clothes.js starts this one: with a timestamp, never a stale copy.
 try{
  if(!window.RKFACE){
   const f=document.createElement('script');
   f.src='js/56-faces.js?v='+Date.now();
   document.body.appendChild(f);
  }
 }catch(e){}
 // The in-game chat is part of the same look, and this file is the last one the page loads, so it
 // starts it the same way 39-clothes.js starts this one.
 try{
  if(!window.RKGC){
   const g=document.createElement('script');
   g.src='js/42-ingame-chat.js?v='+Date.now();
   document.body.appendChild(g);
  }
 }catch(e){}
 const st=document.createElement('style');
 st.id='rk-theme';
 st.textContent=CSS;
 document.head.appendChild(st);
})();
/* ---------- v57: the tab icons ----------
   The bars used emoji, which render differently on every phone and read like a chat app rather than
   a company. These are drawn in the page instead: 24-unit line icons with rounded joins, one accent
   part each, the same weight for all of them. They take the button's colour, so the active tab still
   lights up, and one observer keeps the bars that are built later (top bar buttons, the More sheet,
   the avatar tabs) in step. */
(function(){
 if(window.rkIcons)return;window.rkIcons=1;
 const A='var(--ac,#5b4bff)';
 const S=b=>'<svg class="rki" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+b+'</svg>';
 const I={
  home:S('<path d="M3.6 10.7 12 4l8.4 6.7"/><path d="M6 9.5V19a1.6 1.6 0 0 0 1.6 1.6h8.8A1.6 1.6 0 0 0 18 19V9.5"/><path stroke="'+A+'" d="M10.2 20.6v-4.1a1.8 1.8 0 0 1 3.6 0v4.1"/>'),
  catalog:S('<path d="M4.9 8.6h14.2l-1.2 10.1a1.7 1.7 0 0 1-1.7 1.5H7.8a1.7 1.7 0 0 1-1.7-1.5Z"/><path stroke="'+A+'" d="M9.1 8.6V7.2a2.9 2.9 0 0 1 5.8 0v1.4"/><path d="M9.7 13.4h4.6"/>'),
  friends:S('<circle cx="9.4" cy="8.6" r="3.3"/><path d="M3.4 19.7a6 6 0 0 1 12 0"/><circle cx="16.6" cy="7.9" r="2.7" stroke="'+A+'"/><path stroke="'+A+'" d="M15.6 14.1a5.1 5.1 0 0 1 5 5.4"/>'),
  messages:S('<path d="M20.4 12.3c0 3.9-3.8 7.1-8.4 7.1a10 10 0 0 1-2.7-.4l-4.7 1.5 1.1-3.4a6.9 6.9 0 0 1-2-4.8c0-3.9 3.8-7.1 8.4-7.1s8.3 3.2 8.3 7.1Z"/><circle cx="8.6" cy="12.3" r=".95" fill="'+A+'" stroke="none"/><circle cx="12" cy="12.3" r=".95" fill="'+A+'" stroke="none"/><circle cx="15.4" cy="12.3" r=".95" fill="'+A+'" stroke="none"/>'),
  avatar:S('<circle cx="12" cy="8.8" r="4.1"/><path d="M4.5 20.5a7.6 7.6 0 0 1 15 0"/><path stroke="'+A+'" d="M10.4 9.9a2.1 2.1 0 0 0 3.2 0"/>'),
  create:S('<rect x="3.5" y="3.5" width="12.6" height="12.6" rx="3.4"/><path d="M9.8 7.4v4.8M7.4 9.8h4.8"/><path stroke="'+A+'" d="M17.6 14.8l1 2.2 2.2 1-2.2 1-1 2.2-1-2.2-2.2-1 2.2-1Z"/>'),
  more:S('<path d="M4 7.4h16M4 12h11"/><path stroke="'+A+'" d="M4 16.6h7"/>'),
  games:S('<rect x="2.6" y="7.2" width="18.8" height="9.8" rx="4.4"/><path d="M7.7 10.3v3.6M5.9 12.1h3.6"/><circle cx="16.1" cy="11" r="1.15" fill="'+A+'" stroke="none"/><circle cx="18.4" cy="13.3" r="1.15" fill="'+A+'" stroke="none"/>'),
  tickets:S('<path d="M3.6 8.4a1.6 1.6 0 0 1 1.6-1.6h13.6a1.6 1.6 0 0 1 1.6 1.6v2a2.2 2.2 0 0 0 0 4.4v2a1.6 1.6 0 0 1-1.6 1.6H5.2a1.6 1.6 0 0 1-1.6-1.6v-2a2.2 2.2 0 0 0 0-4.4Z"/><path stroke="'+A+'" d="M15.4 9.1l1 2 2.2.3-1.6 1.5.4 2.1-2-1-2 1 .4-2.1-1.6-1.5 2.2-.3Z"/>'),
  reports:S('<path d="M6.2 20.6V3.8"/><path d="M6.2 4.5h11.6l-2.1 4.1 2.1 4.1H6.2Z" fill="'+A+'" fill-opacity=".22"/>'),
  admin:S('<path d="M12 3.4l7.2 2.6v5.6c0 4.2-3 7.5-7.2 8.8-4.2-1.3-7.2-4.6-7.2-8.8V6Z"/><path stroke="'+A+'" d="M8.9 12.1l2.2 2.2 4.2-4.4"/>'),
  settings:S('<path d="M3.6 8.4h5.9M14.5 8.4h5.9M3.6 15.6h9.9M18.5 15.6h1.9"/><circle cx="12" cy="8.4" r="2.5" stroke="'+A+'"/><circle cx="16" cy="15.6" r="2.5" stroke="'+A+'"/>'),
  clothes:S('<path d="M8.7 4.7a3.3 3.3 0 0 0 6.6 0l4.2 2.4-1.9 3.3-2-1.1v8H8.4v-8l-2 1.1-1.9-3.3Z"/><path stroke="'+A+'" d="M8.7 4.7 12 6.2l3.3-1.5"/>'),
  hat:S('<path d="M8.3 15.4V5.4a1.6 1.6 0 0 1 1.6-1.6h4.2a1.6 1.6 0 0 1 1.6 1.6v10"/><path d="M3.9 15.4h16.2a1.4 1.4 0 0 1 0 2.8H3.9a1.4 1.4 0 0 1 0-2.8Z"/><path stroke="'+A+'" d="M8.3 12.6h7.4"/>'),
  profile:S('<circle cx="12" cy="8.4" r="3.6"/><path d="M5 20a7 7 0 0 1 14 0"/>'),
  logout:S('<path d="M13.2 4.6H6.9a1.6 1.6 0 0 0-1.6 1.6v11.6a1.6 1.6 0 0 0 1.6 1.6h6.3"/><path stroke="'+A+'" d="M11.4 12h8.8M17 8.8l3.2 3.2-3.2 3.2"/>'),
  bell:S('<path d="M6.6 10.2a5.4 5.4 0 0 1 10.8 0c0 3 .9 4.6 1.8 5.6H4.8c.9-1 1.8-2.6 1.8-5.6Z"/><path d="M10 19.1a2.1 2.1 0 0 0 4 0"/>'),
  coin:'<svg class="rki" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.6" fill="#ffd23f" stroke="#c08a0a" stroke-width="1.6"/><path d="M9.9 16.2V8.2h2.9a2.4 2.4 0 0 1 0 4.8H9.9M12.5 13.1l2.5 3.1" fill="none" stroke="#7a5500" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>'
 };
 const K=[['ticket','tickets'],['message','messages'],['catalog','catalog'],['friend','friends'],['report','reports'],['admin','admin'],['avatar','avatar'],['create','create'],['studio','create'],['setting','settings'],['more','more'],['game','games'],['body','avatar'],['cloth','clothes'],['accessor','hat'],['hat','hat'],['profile','profile'],['log out','logout'],['notification','bell'],['home','home']];
 const keyOf=t=>{t=(t||'').toLowerCase();for(const[k,v]of K)if(t.indexOf(k)>=0)return v;return null};
 const st=document.createElement('style');st.id='rk-icons';
 st.textContent='.ic>.rki{width:1.2em;height:1.2em;display:block}#coins>.rki,.tkbal>.rki{width:1.25em;height:1.25em;display:inline-block;vertical-align:-.22em}#coins{display:inline-flex;align-items:center;gap:5px}';
 document.head.appendChild(st);
 const paint=()=>{
  const gm=document.getElementById('game');if(gm&&gm.style.display&&gm.style.display!='none')return;
  document.querySelectorAll('.ic').forEach(s=>{
   if(s.dataset.rki)return;
   const b=s.closest('button,a,li,div[data-r]')||s.parentElement;
   const lb=b&&b.querySelector('.lb');
   // Some bars put the label in a plain span next to the icon, so fall back to the whole button and
   // strip everything that is not a letter (the emoji itself would otherwise match nothing).
   const name=lb?lb.textContent:(b?b.textContent:'');
   const k=keyOf(String(name).replace(/[^A-Za-z ]+/g,' ')+' '+(b?(b.getAttribute('aria-label')||b.getAttribute('title')||''):''));
   if(!k||!I[k])return;s.innerHTML=I[k];s.dataset.rki=k;
  });
  // The two balances in the top bar are plain text that other modules rewrite, so they are painted here
  // as text plus icon instead of being changed where they are set.
  const c=document.getElementById('coins');
  if(c&&c.textContent.indexOf('\u{1FA99}')>=0)c.innerHTML=I.coin+'<span>'+c.textContent.replace('\u{1FA99}','').trim()+'</span>';
  const k=document.getElementById('tkcoins');
  if(k&&k.textContent.indexOf('\u{1F39F}')>=0)k.innerHTML=I.tickets+'<span>'+k.textContent.replace(/[\u{1F39F}\u{FE0F}]/gu,'').trim()+'</span>';
 };
 // A timer rather than an animation frame: bars can appear while the tab is in the background, and
 // frames are throttled there, but the icons still have to be there when the page is looked at.
 let q=0;const soon=()=>{if(q)return;q=setTimeout(()=>{q=0;try{paint()}catch(e){}},40)};
 try{new MutationObserver(soon).observe(document.body,{childList:true,subtree:true,characterData:true})}catch(e){}
 paint();[80,400,1200,2600].forEach(t=>setTimeout(paint,t));
 setInterval(paint,2000);
})();
/* ---------- v59: the game-site look ----------
   Same flat colours and the same one accent, but the page should feel like a place you play in
   rather than a dashboard you fill in: a lit backdrop, cards that sit on a solid edge like arcade
   panels, buttons that press in when you tap them, and tabs that pop when they are the one you are
   on. Sizes and spacing stay put, so nothing that already worked moves around. */
(function(){
 if(document.getElementById('rk-game-look'))return;
 const st=document.createElement('style');st.id='rk-game-look';
 st.textContent=`
:root{--edge:#c9cfe2;--pop:0 3px 0 var(--edge)}
html,body{
 background:
  radial-gradient(1000px 460px at 50% -200px,rgba(61,91,255,.13),transparent 72%),
  radial-gradient(700px 420px at 96% -60px,rgba(255,210,63,.12),transparent 70%),
  var(--bg);
 background-attachment:fixed;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--edge:#20242f}}
:root[data-theme="dark"]{--edge:#20242f}

/* headings read like a level title */
h2{font-size:27px;font-weight:900;letter-spacing:-.025em;gap:10px}
h2::before{content:"";width:7px;height:24px;border-radius:4px;background:var(--ac);flex:none}
h2 .mut,h2 span.mut{font-weight:600}

/* the top bar gets a lit edge and a chunkier active tab */
#top{background:linear-gradient(180deg,#1b1f2e,#12141c);border-bottom:2px solid #2a2f45}
#top nav button{border-width:2px;border-radius:12px}
#top nav button.on,#top nav button.pri{box-shadow:0 2px 0 #1d2c9e}
#coins,#tkcoins{
 background:#1d2130;border:1px solid #2d3242;border-radius:999px;
 padding:3px 11px;font-weight:800;letter-spacing:.01em;
}

/* cards sit on a solid edge, and lift when you point at them */
.card{border-width:2px;border-radius:20px;box-shadow:var(--pop)}
.tile,.cat-tile,.gcard,.wc{
 border-width:2px;border-radius:20px;box-shadow:var(--pop);
 transition:transform .12s ease,box-shadow .12s ease,border-color .12s ease;
}
.tile:hover,.cat-tile:hover,.gcard:hover{transform:translateY(-4px);box-shadow:0 7px 0 var(--edge);border-color:var(--ac)}
.tile:active,.cat-tile:active{transform:translateY(-1px);box-shadow:0 4px 0 var(--edge)}

/* buttons are keys: they press down */
button{border-width:2px;border-radius:12px;box-shadow:var(--pop);font-weight:700}
button:hover{border-color:var(--ac)}
button:active{transform:translateY(3px);box-shadow:none}
button.pri{background:var(--ac);border-color:var(--ac-d);box-shadow:0 3px 0 var(--ac-d)}
button.pri:hover{background:var(--ac-d)}
button.pri:active{transform:translateY(3px);box-shadow:none}
button.on{box-shadow:0 3px 0 rgba(0,0,0,.28)}
.chips button,.tabs button,.sc button{box-shadow:none}
.chips button{padding:7px 14px}
.chips button.on{box-shadow:0 2px 0 rgba(0,0,0,.22)}

/* tab strips: the chosen one pops */
.tabs{border-width:2px;border-radius:16px;box-shadow:var(--pop)}
.tabs button.on,.rk-avtabs button.on{box-shadow:0 2px 0 rgba(0,0,0,.25)}

/* the avatar plate on Home reads as a stage */
.hav{box-shadow:inset 0 0 0 2px var(--bd);border-radius:18px}

/* inputs stay calm, they are not toys */
input,select,textarea{border-width:2px;border-radius:12px}
`;
 document.head.appendChild(st);
 // The bar never showed which tab you are on; a game site should. The route lives in the hash, so the
 // matching button is lit quietly from here instead of touching the router.
 const mark=()=>{
  const seg=String(location.hash||'').replace(/^#\/?/,'').split('/')[0];
  document.querySelectorAll('#top nav button').forEach(b=>{
   const r=b.dataset.r==null?'':b.dataset.r;
   b.classList.toggle('on',r?r===seg:seg==='');
  });
 };
 addEventListener('hashchange',mark);setTimeout(mark,300);setInterval(mark,1500);
})();
