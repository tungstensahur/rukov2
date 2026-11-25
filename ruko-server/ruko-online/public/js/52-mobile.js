/* ---------- v52: the phone layout ---------- */
/* Ruko is mostly played on a phone, but the pages were still the desktop ones squeezed onto a
   narrow screen: two thin columns of game cards with wrapped titles, small buttons, a top bar
   holding everything, and form fields that zoom on tap. This overlay is styles only: it adds one
   stylesheet and changes no page markup, so every page keeps working and deleting this file puts
   the old layout back. 38-layout.js still dresses wide screens, and this only takes over below
   900px, where a phone or a small window is what is actually looking at the site. */
(function(){
 if(window.RKMOB||document.getElementById('rk-mobile'))return;
 window.RKMOB=1;
 const CSS=`
/* ---------- phones ---------- */
@media (max-width:600px){
 /* --- the frame: one column, and room at the bottom for the bar --- */
 html{-webkit-text-size-adjust:100%}
 main#app{max-width:100%;padding:12px 12px calc(96px + env(safe-area-inset-bottom,0px))}
 main#app>h2{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;font-size:20px;line-height:1.25;margin:4px 0 12px}
 main#app>h2 .mut{font-size:13px;font-weight:400}
 h3{font-size:15.5px;margin:18px 0 8px}
 p{font-size:14.5px;line-height:1.5}
 .card{padding:14px;border-radius:16px}

 /* --- thumb-sized controls everywhere --- */
 button{min-height:42px;padding:10px 13px;font-size:14px}
 button.pri{min-height:46px;font-weight:750}
 input,select,textarea{font-size:16px;min-height:46px;padding:11px 12px;border-radius:12px}
 textarea{min-height:92px;line-height:1.45}
 label{font-size:13px}
 button,input,select,textarea,a{-webkit-tap-highlight-color:transparent;touch-action:manipulation}

 /* --- the top bar carries the name and the coins; the rest is the bottom bar --- */
 #top{gap:10px;padding:8px 12px;min-height:52px;align-items:center}
 #top .logo{font-size:19px;letter-spacing:.03em;margin-right:0}
 #coins{font-size:13.5px;display:flex;align-items:center;gap:6px;min-width:0;margin-left:auto;white-space:nowrap;overflow:hidden}
 #more{min-height:44px}
 #top nav{
  position:fixed;left:0;right:0;bottom:0;gap:0;margin:0;
  padding:6px 4px calc(6px + env(safe-area-inset-bottom,0px));
  background:#12141c;border-top:1px solid #000;
  box-shadow:0 -8px 20px rgba(8,10,18,.30);z-index:20;
 }
 #top nav button{
  flex:1 1 0;min-width:0;min-height:48px;display:flex;flex-direction:column;align-items:center;
  justify-content:center;gap:2px;padding:4px 2px;border:1px solid transparent;border-radius:11px;
  background:transparent;box-shadow:none;color:#c9cee0;
 }
 #top nav button .ic{font-size:20px;line-height:1}
 #top nav button .lb{font-size:9.5px;line-height:1.1;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 #top nav button.on,#top nav button.pri{background:var(--ac);border-color:var(--ac);color:#fff}
 #top nav button:active{background:#22252f}

 /* --- filter rows scroll sideways instead of squeezing --- */
 .chips{flex-wrap:nowrap;overflow-x:auto;gap:8px;margin:10px 0;padding:2px 2px 8px;
  scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch;scrollbar-width:none}
 .chips::-webkit-scrollbar{display:none}
 .chips button{flex:0 0 auto;min-height:38px;padding:8px 14px;font-size:13.5px;scroll-snap-align:start}
 .tabs{flex-wrap:nowrap;overflow-x:auto;gap:4px;padding:4px;scrollbar-width:none;scroll-snap-type:x proximity}
 .tabs::-webkit-scrollbar{display:none}
 .tabs button{flex:0 0 auto;min-width:0;white-space:nowrap;padding:10px 14px;min-height:44px;font-size:13.5px;scroll-snap-align:start}
 .rk-avtabs{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;scroll-snap-type:x proximity}
 .rk-avtabs::-webkit-scrollbar{display:none}
 .rk-avtabs button{flex:0 0 auto;white-space:nowrap;min-height:42px;scroll-snap-align:start}
 .sc{gap:6px;padding-bottom:2px}
 .sc button{min-height:38px}
 .cat-strip{scroll-snap-type:x proximity;padding-bottom:12px}
 .cat-strip>*{flex:0 0 148px}

 /* --- game cards: one card per row, picture wide, Play big --- */
 #gg{display:grid;grid-template-columns:1fr;gap:12px}
 #gg .card{padding:12px;border-radius:16px}
 #gg .card img,#gg .card .gcard{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:12px;margin-bottom:8px}
 #gg .card b{font-size:17px;line-height:1.2}
 #gg .card .mut{font-size:13px}
 #gg .card button{width:100%!important;margin:8px 0 0!important}
 #gg .card button[data-g]{min-height:48px;font-size:16px;font-weight:750}
 #gg .card button[data-solo]{min-height:40px;font-size:13.5px}

 /* --- everything else that is a listing keeps two tidy columns --- */
 .grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
 .grid .card{padding:10px}
 .grid .card img,.grid .tile img{width:100%;border-radius:10px}
 .grid .card b,.grid .tile b{font-size:14px;line-height:1.25}
 .grid .card .mut{font-size:12px;line-height:1.35}
 .grid .card button{width:100%!important;margin-top:6px!important;min-height:40px;font-size:13px}
 .cat-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
 .sgrid{grid-template-columns:repeat(3,minmax(0,1fr))}
 .palg{grid-template-columns:1fr}

 /* --- home --- */
 .hgrid{grid-template-columns:1fr!important;gap:12px}
 .hav{max-width:190px}
 #app .rkrw{flex-wrap:nowrap;overflow-x:auto;gap:10px;padding:2px 2px 8px;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch}
 #app .rkrc{width:150px;scroll-snap-align:start}
 #app .rkrc img,#app .rkrc .rkgr{width:150px}
 #app .rkrc b{max-width:150px;font-size:13px}

 /* --- game page, item page, profile --- */
 .hed{grid-template-columns:1fr!important;gap:14px}
 .hsticky{position:static!important;top:auto!important}
 .hsticky img{max-height:36vh;width:100%}
 .hed .pri{width:100%;min-height:52px;font-size:17px}
 .stat{flex-wrap:wrap;gap:14px 22px}
 .stat b{font-size:20px}
 .hat{grid-template-columns:1fr!important;gap:14px}
 .hat img{max-height:34vh}
 #cl2{max-height:36vh!important}

 /* --- lists and admin rows --- */
 .wc{min-height:52px;padding:10px 12px;font-size:14.5px}
 details.arow{padding:10px 12px}
 details.arow summary{min-height:44px;display:flex;align-items:center}
 .arw{flex-direction:column;align-items:stretch;gap:6px}
 .arw input,.arw select{min-width:0;flex:1 1 100%}
 .nrc input{width:84px}

 /* --- sheets and dialogs --- */
 #msb{max-width:100%;border-radius:16px 16px 0 0}
 .msi{min-height:52px;font-size:15.5px}
 .stu-palb{border-radius:16px 16px 0 0}

 /* --- creator studio: keep every tool reachable on a phone --- */
 #stu .stu-bar{overflow-x:auto;-webkit-overflow-scrolling:touch}
 #stu .stu-bar button,#stu .stu-tabs button{min-height:40px}
 #stu .stu-vp{height:44dvh;min-height:240px}

 /* --- in game --- */
 #game #hud{padding:8px 10px;font-size:13px;align-items:center;gap:8px}
 #game #hud button{min-height:38px;font-size:13px;padding:6px 10px}
 #gmsg{font-size:18px;top:56px}
 #pad button{width:58px;height:58px;font-size:19px}
 #jb{width:88px!important;height:88px!important;font-size:15px}
 #padx{right:12px;bottom:calc(152px + env(safe-area-inset-bottom,0px))}
 #padx button{width:58px;height:58px;font-size:12.5px}
 #acts{bottom:calc(152px + env(safe-area-inset-bottom,0px))}
 #acts button{width:52px;height:52px}
 #chatw{width:74vw;font-size:12px;top:calc(46px + env(safe-area-inset-top,0px))}
 #cin input{font-size:16px;min-height:38px}
}

/* ---------- tablets and small windows ---------- */
@media (min-width:601px) and (max-width:900px){
 main#app{max-width:100%;padding:16px 16px calc(96px + env(safe-area-inset-bottom,0px))}
 #gg{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
 #gg .card img,#gg .card .gcard{width:100%;aspect-ratio:16/9;object-fit:cover}
 #gg .card button{width:100%!important}
 .grid{grid-template-columns:repeat(auto-fill,minmax(170px,1fr))}
 .chips{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}
 .chips::-webkit-scrollbar{display:none}
 .tabs{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none}
 .tabs::-webkit-scrollbar{display:none}
 .tabs button{flex:0 0 auto;white-space:nowrap;min-height:42px}
 input,select,textarea{font-size:16px}
}
`;
 const st=document.createElement('style');
 st.id='rk-mobile';
 st.textContent=CSS;
 document.head.appendChild(st);
})();
