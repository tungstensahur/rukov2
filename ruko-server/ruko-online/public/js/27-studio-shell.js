/* ---------- v27: a brand new studio layout for computers and phones ---------- */
/* The editor's markup stays exactly as it is; this file only changes how it is laid out and
   painted. On a computer: toolbox on the left, a big canvas in the middle, the inspector on the
   right. On a phone: the canvas fills the screen and the inspector becomes a sheet that slides up
   from the bottom. */
(function(){
 if(window.RKSHELL27)return;
 window.RKSHELL27=1;

 function css(){
  if(document.getElementById('rk27-style'))return;
  const st=document.createElement('style');st.id='rk27-style';
  st.textContent=`
/* ---------- shell ---------- */
main:has(#stu){max-width:1700px;padding-left:10px;padding-right:10px}
#stu{
 --rk-bg:#0a0c11;--rk-panel:#12151d;--rk-panel2:#171b25;--rk-line:#252b38;--rk-line2:#313949;
 --rk-tx:#e8ecf7;--rk-mut:#8f9ab4;--rk-acc:#7c5cff;--rk-acc2:#22d3ee;
 display:flex;flex-direction:column;height:calc(100vh - 168px);min-height:600px;
 background:var(--rk-bg);border:1px solid var(--rk-line);border-radius:18px;overflow:hidden;
 box-shadow:0 24px 60px #0006;color:var(--rk-tx)}
#stu *{box-sizing:border-box}
#stu button{border-radius:9px;border:1px solid var(--rk-line);background:var(--rk-panel2);color:var(--rk-tx);font-size:13px;padding:7px 11px;min-height:34px;transition:background .15s,border-color .15s,transform .06s}
#stu button:hover{border-color:var(--rk-line2);background:#1d2230}
#stu button:active{transform:translateY(1px)}
#stu button.on,#stu button.pri{background:linear-gradient(180deg,#8a6bff,#6d4dff);border-color:#8a6bff;color:#fff;box-shadow:0 6px 16px #6d4dff40}
#stu button.on:hover,#stu button.pri:hover{background:linear-gradient(180deg,#9578ff,#7a5cff)}
#stu input,#stu select{background:#0e1118;border:1px solid var(--rk-line);color:var(--rk-tx);border-radius:9px;margin:0;padding:7px 9px;font-size:13px}
#stu input:focus,#stu select:focus{outline:2px solid #7c5cff66;border-color:var(--rk-acc)}
#stu .mut{color:var(--rk-mut)}

/* ---------- header ---------- */
#stu>.stu-top{display:flex;align-items:center;gap:8px;padding:9px 12px;min-height:54px;
 background:linear-gradient(180deg,#151925,#10131b);border-bottom:1px solid var(--rk-line);position:relative;z-index:6}
#stu>.stu-top>b{display:inline-flex;align-items:center;gap:7px;font-size:13px;letter-spacing:.02em;white-space:nowrap;
 background:#1b2130;border:1px solid var(--rk-line);border-radius:99px;padding:6px 12px;font-weight:700}
#stn{font-size:12px;color:var(--rk-mut);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:38vw}
#stu .stu-top .sp{flex:1}
#stu>.stu-top .rkb{display:inline-flex;gap:6px;align-items:center}

/* ---------- second bar (tool modes) ---------- */
#stu>.stu-bar{display:flex;align-items:center;gap:6px;padding:7px 10px;background:#0e1118;
 border-bottom:1px solid var(--rk-line);overflow-x:auto;scrollbar-width:thin}
#stu>.stu-bar .sep{width:1px;height:22px;background:var(--rk-line);flex:none;margin:0 4px}
#stu>.stu-bar button{min-height:32px;padding:6px 10px;background:#141926;font-size:12.5px}
#stu>.stu-bar button.on{background:linear-gradient(180deg,#8a6bff,#6d4dff);border-color:#8a6bff}
#stu>.stu-bar #snp{min-width:104px;font-size:12.5px}

/* ---------- main grid ---------- */
#stu>.stu-main{flex:1;display:grid;grid-template-columns:224px minmax(0,1fr) 356px;
 grid-template-areas:"tools view side";min-height:0;background:var(--rk-bg)}

/* toolbox */
#stu .stu-tb{grid-area:tools;background:var(--rk-panel);border-right:1px solid var(--rk-line);padding:10px;overflow:auto}
#stu .stu-tb::-webkit-scrollbar,#stu .stu-pn::-webkit-scrollbar,#stu>.stu-bar::-webkit-scrollbar{width:9px;height:9px}
#stu .stu-tb::-webkit-scrollbar-thumb,#stu .stu-pn::-webkit-scrollbar-thumb{background:#2a3244;border-radius:99px}
#stu .stg{font-size:10.5px;letter-spacing:.14em;color:#6f7a94;margin:12px 2px 7px;font-weight:700}
#stu .stg:first-child{margin-top:2px}
#stu .stgrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
#stu .stgrid button{display:flex;flex-direction:column;align-items:center;gap:4px;min-height:64px;padding:8px 4px;
 font-size:10.5px;line-height:1.2;background:#151a25;border:1px solid var(--rk-line);border-radius:11px;text-align:center}
#stu .stgrid button span{font-size:19px;line-height:1}
#stu .stgrid button:hover{background:#1b2130;border-color:#38425a;box-shadow:0 6px 14px #0006}

/* viewport */
#stu .stu-vp{grid-area:view;position:relative;background:radial-gradient(120% 90% at 50% 0%,#1a2030 0%,#0a0c11 62%);min-height:0}
#stu .stu-vp canvas{border-radius:0}
#stu .stu-hint{left:12px;bottom:10px;font-size:11px;color:#7d88a2;background:#0b0e15cc;border:1px solid var(--rk-line);
 border-radius:99px;padding:4px 10px;pointer-events:none}
#stu .stu-vp:after{content:'';position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 120px #0008}

/* inspector */
#stu .stu-side{grid-area:side;background:var(--rk-panel);border-left:1px solid var(--rk-line);display:flex;flex-direction:column;min-height:0}
#stu .stu-tabs{display:flex;gap:5px;padding:8px;background:#0e1118;border-bottom:1px solid var(--rk-line)}
#stu .stu-tabs button{flex:1;padding:7px 4px;min-height:36px;font-size:12px;background:#141926}
#stu .stu-tabs button.on{background:linear-gradient(180deg,#8a6bff,#6d4dff);border-color:#8a6bff;color:#fff}
#stu .stu-pn{padding:12px;overflow:auto;flex:1;color:var(--rk-tx)}
#stu .stu-pn label{font-size:12px;color:var(--rk-mut)}
#stu .stbox{background:#151a25;border:1px solid var(--rk-line);border-radius:12px;padding:12px;line-height:1.65}
#stu .phead{font-size:14px;font-weight:700;margin-bottom:6px}
#stu .nr{border-bottom:1px dashed #202634;padding-bottom:6px;margin-bottom:8px}
#stu .nrc button{background:#151a25;border:1px solid var(--rk-line);width:30px;min-height:30px;font-size:15px}
#stu .ex{border-radius:9px;padding:8px 10px;font-size:13px}
#stu .ex.sel{background:#7c5cff22;outline:1px solid #7c5cff88}

/* code panel */
#stu #cd .scr{background:#121722;border:1px solid var(--rk-line);border-radius:14px;padding:10px;margin-bottom:14px;box-shadow:0 10px 24px #0004}
#stu .bl-h{border-radius:11px;padding:8px 10px;box-shadow:inset 0 1px 0 #fff3}
#stu .bl-f{gap:5px}
#stu .bt{font-size:12.5px;font-weight:600}
#stu .bi{background:#fff;border-radius:7px;font-size:12.5px;padding:4px 7px;min-height:30px}
#stu .bi.n{width:64px}
#stu .bl-a button{width:26px;height:26px;border-radius:7px}
#stu .addb{background:#151a25;border:1px dashed #38425a;border-radius:9px;color:#a9b4cc}
#stu .addb:hover{border-color:var(--rk-acc);color:#fff}
#stu .bl-in{margin-left:16px;border-left:2px solid #ffffff33}
#stu #cd .srchead{font-size:11px;letter-spacing:.1em;color:#6f7a94;margin:2px 0 6px;font-weight:700}

/* palette */
#stu .stu-pal{background:#04060ad9;backdrop-filter:blur(6px);z-index:70}
#stu .stu-palb{background:#121722;border:1px solid var(--rk-line);border-radius:18px;padding:16px;box-shadow:0 30px 80px #0009}
#stu .palg button{border-radius:10px;padding:9px 11px;font-size:12.5px;border:1px solid #ffffff1a}
#stu .palg button:hover{filter:brightness(1.12)}

/* ---------- phones and small tablets ---------- */
@media(max-width:980px){
 main:has(#stu){padding:0 8px 8px}
 #stu{height:calc(100dvh - 132px);min-height:0;border-radius:14px}
 #stu>.stu-top{padding:8px 10px;min-height:48px;flex-wrap:nowrap;overflow-x:auto}
 #stu>.stu-top>b{font-size:11.5px;padding:5px 9px}
 #stn{display:none}
 #stu>.stu-bar{padding:6px 8px}
 #stu>.stu-main{display:flex;flex-direction:column;position:relative}
 #stu .stu-vp{flex:1;min-height:34vh}
 #stu .stu-tb{display:none}
 #stu .stu-side{position:fixed;left:0;right:0;bottom:0;max-height:64dvh;height:auto;border-left:0;border-top:1px solid var(--rk-line2);
  border-radius:18px 18px 0 0;box-shadow:0 -18px 50px #000a;z-index:60;background:var(--rk-panel);
  transform:translateY(calc(100% - 64px));transition:transform .24s cubic-bezier(.2,.8,.2,1);padding-bottom:env(safe-area-inset-bottom,0px)}
 #stu.sheet .stu-side{transform:translateY(0)}
 #stu .stu-tabs{padding:6px 8px 8px;position:relative;background:transparent}
 #stu .stu-tabs:before{content:'';position:absolute;left:50%;top:4px;transform:translateX(-50%);width:42px;height:4px;border-radius:99px;background:#3a4358}
 #stu .stu-tabs button{min-height:38px;font-size:11.5px;background:#151a25}
 #stu .stu-pn{padding:10px 12px 18px}
 #stu .stgrid{grid-template-columns:repeat(3,minmax(0,1fr))}
 #stu .stu-pal{align-items:flex-end}
 #stu .stu-palb{border-radius:18px 18px 0 0;max-height:82dvh;width:100%}
 #stu .stu-hint{display:none}
 #stu .stu-top .rkb button{padding:6px 9px;font-size:12px}
 #stu>.stu-top{overflow-x:auto;scrollbar-width:none;gap:6px}
 #stu>.stu-top::-webkit-scrollbar{display:none}
 #stu>.stu-top button{white-space:nowrap;flex:none;padding:6px 9px;font-size:11.5px}
 #stu>.stu-top>b{padding:6px 9px}
 #stu>.stu-bar{scrollbar-width:none}
 #stu>.stu-bar::-webkit-scrollbar{display:none}
 #stu>.stu-bar button,#stu>.stu-bar select{white-space:nowrap;flex:none}
 #stu #rkvp{display:none}
 #rk27chip{display:none}
}
@media(max-width:980px) and (orientation:landscape){
 #stu{height:100dvh}
 #stu .stu-side{max-height:80dvh}
}
`;
  document.head.appendChild(st);
 }

 /* sheet behaviour on phones: tapping a tab opens it, the grabber or a second tap closes it */
 function wire(){
  const stu=document.getElementById('stu');
  if(!stu||stu.dataset.rk27)return;
  stu.dataset.rk27='1';
  stu.addEventListener('click',e=>{
   const t=e.target.closest('[data-tab]');
   if(!t)return;
   setTimeout(()=>{if(window.innerWidth<=980)stu.classList.add('sheet')},0);
  },true);
  stu.addEventListener('click',e=>{
   if(e.target.closest('.stu-tabs')&&window.innerWidth<=980&&stu.classList.contains('sheet')&&!e.target.closest('[data-tab]')){
    stu.classList.remove('sheet');
   }
  },true);
  const vp=stu.querySelector('.stu-vp');
  if(vp)vp.addEventListener('touchstart',()=>{if(stu.classList.contains('sheet'))stu.classList.remove('sheet')},{passive:true});
 }

 function chips(){
  const stu=document.getElementById('stu');
  if(!stu||stu.querySelector('#rk27chip'))return;
  const top=stu.querySelector('.stu-top');
  if(!top)return;
  const chip=document.createElement('span');
  chip.id='rk27chip';
  chip.style.cssText='font-size:11px;padding:4px 9px;border-radius:99px;border:1px solid #2c3446;white-space:nowrap';
  try{
   const g=(typeof GE!=='undefined')?GE:null;
   if(g&&g.editId&&g.draft){chip.textContent='● Draft';chip.style.background='#3b2f0a';chip.style.color='#ffd23f';chip.style.borderColor='#5c4a12'}
   else if(g&&g.editId){chip.textContent='● Live';chip.style.background='#0e2f24';chip.style.color='#4ade80';chip.style.borderColor='#155e42'}
   else{chip.textContent='● Unsaved';chip.style.background='#1a1f2b';chip.style.color='#8f9ab4'}
  }catch(e){chip.textContent='●';chip.style.color='#8f9ab4'}
  const sp=top.querySelector('.sp');
  if(sp)sp.parentNode.insertBefore(chip,sp);else top.appendChild(chip);
 }

 /* fit the studio to the window once it is on screen, whatever sits above it */
 function fit(){
  const stu=document.getElementById('stu');
  if(!stu)return;
  const top=stu.getBoundingClientRect().top;
  if(top<=0)return;
  const h=Math.max(420,Math.round(innerHeight-top-14));
  if(Math.abs((parseFloat(stu.style.height)||0)-h)>4){stu.style.height=h+'px';stu.style.minHeight=Math.min(520,h)+'px'}
 }

 css();
 let tick=0;
 setInterval(()=>{
  const stu=document.getElementById('stu');
  if(!stu){tick=0;return}
  wire();
  fit();
  if(!stu.dataset.rk27 || (++tick%4===0)){const c=document.getElementById('rk27chip');if(c)c.remove();chips()}
 },600);
 try{addEventListener('resize',()=>{const stu=document.getElementById('stu');if(stu&&innerWidth>980)stu.classList.remove('sheet');fit()})}catch(e){}
 window.RK27={};
})();
