/* ---------- v40: mobile game controls — a joystick instead of the arrow buttons, and pinch to zoom ---------- */
(function(){
 if(window.RKTOUCH)return;
 window.RKTOUCH=1;

 const $=s=>document.querySelector(s);
 const isMobile=()=>document.documentElement.dataset.dev=='mobile';
 /* the game keeps its key state in TK; the arrow buttons set those same flags, so the joystick does too.
    TK is a top-level const, so it is reachable by name but not off window. */
 const keys=()=>{try{return TK}catch(e){return null}};

 /* ---------- joystick ---------- */
 const pad=$('#pad');
 if(pad&&!pad.querySelector('#jsy')){
  ensureStyle();
  const rows=pad.firstElementChild;
  if(rows&&rows.querySelector('[data-k]'))rows.style.display='none';
  const R=52, DEAD=0.28;
  const base=document.createElement('div');
  base.id='jsy';
  base.innerHTML='<i id="jsk"></i>';
  pad.insertBefore(base,pad.firstChild);
  const knob=base.querySelector('#jsk');
  let dx=0,dy=0,id=null;

  const apply=(vx,vy)=>{
   dx=vx;dy=vy;
   const len=Math.hypot(dx,dy)||1, cl=Math.min(1,len);
   knob.style.transform='translate('+(dx/len*R*cl)+'px,'+(dy/len*R*cl)+'px)';
   const T=keys();
   if(T){
    T.tf=vy<-DEAD*R; T.tb=vy>DEAD*R; T.tl=vx<-DEAD*R; T.tr=vx>DEAD*R;
   }
  };
  const centre=()=>{const r=base.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}};
  const move=e=>{
   const c=centre();
   apply(e.clientX-c.x,e.clientY-c.y);
  };
  base.addEventListener('pointerdown',e=>{
   if(e.pointerType=='mouse'&&!isMobile())return;
   e.preventDefault();
   id=e.pointerId;
   try{base.setPointerCapture(id)}catch(_){}
   move(e);
  });
  base.addEventListener('pointermove',e=>{if(e.pointerId===id)move(e)});
  const end=e=>{
   if(e&&e.pointerId!==id)return;
   id=null;apply(0,0);
  };
  ['pointerup','pointercancel','pointerleave'].forEach(ev=>base.addEventListener(ev,end));
  apply(0,0);
 }

 /* ---------- pinch to zoom ---------- */
 /* the game zooms by listening for the mouse wheel on its canvas, so a pinch turns into wheel steps */
 const canvas=()=>$('#game canvas');
 const zoom=dy=>{
  const cv=canvas();
  if(!cv||typeof cv.onwheel!='function')return;
  try{cv.onwheel(new WheelEvent('wheel',{deltaY:dy,clientX:innerWidth/2,clientY:innerHeight/2,bubbles:true,cancelable:true}))}catch(e){}
 };
 const pts=new Map();
 let start=0;
 const dist=()=>{
  const a=[...pts.values()];
  if(a.length<2)return 0;
  return Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);
 };
 const clear=()=>{pts.clear();start=0};
 addEventListener('pointerdown',e=>{
  if(e.pointerType!='touch'||!canvas())return;
  pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pts.size===2)start=dist();
 },{passive:true});
 addEventListener('pointermove',e=>{
  if(!pts.has(e.pointerId))return;
  pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pts.size<2||!start)return;
  const d=dist();
  const delta=start-d;
  if(Math.abs(delta)>1.5)zoom(delta*3.4);
  start=d;
 },{passive:true});
 ['pointerup','pointercancel'].forEach(ev=>addEventListener(ev,e=>{if(pts.delete(e.pointerId)&&pts.size<2)start=0},{passive:true}));
 addEventListener('blur',clear);

 /* ---------- the look of the joystick ---------- */
 function ensureStyle(){
  if($('#rk-touch-style'))return;
  const st=document.createElement('style');
  st.id='rk-touch-style';
  st.textContent=
   '#jsy{position:relative;width:128px;height:128px;border-radius:50%;background:#ffffff1f;border:1px solid #ffffff33;touch-action:none;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);box-shadow:inset 0 0 22px #0003}'+
   '#jsy i{position:absolute;left:50%;top:50%;width:58px;height:58px;margin:-29px 0 0 -29px;border-radius:50%;background:#ffffffd9;box-shadow:0 6px 18px #0006;pointer-events:none;transition:transform .05s linear}'+
   '#jsy:active i{background:#fff}';
  document.head.appendChild(st);
 }
})();
