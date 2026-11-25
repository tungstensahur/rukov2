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
 // The phone layout is the last word on how pages sit on a small screen, so it is started here,
 // the same way 39-clothes.js starts this file: with a timestamp, so it is never a stale copy.
 try{
  if(!window.RKMOB){
   const m=document.createElement('script');
   m.src='js/52-mobile.js?v='+Date.now();
   document.body.appendChild(m);
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
