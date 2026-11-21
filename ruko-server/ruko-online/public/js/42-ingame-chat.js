/* ---------- v42: in-game chat ---------- */
/* The chat that shipped with the game engine had a few rough edges. The panel was pinned to the top
   of the screen by one stylesheet and to the bottom by another, so it sat under the HUD with its
   input in the middle of the screen. New lines were added below the fold and nothing scrolled them
   into view. There was no way to close it, so it covered the game even with nothing to read, and on
   a phone the keyboard covered the box you were typing in.
   This layer owns the panel instead: one position, an open/closed state, a list that scrolls, a
   history that outlives the engine's 14-second fade, and a close button. The engine keeps writing
   into #cbox exactly as before; the lines are copied from there into the visible list. */
(function(){
 if(window.RKGC)return;
 window.RKGC=1;
 const $=id=>document.getElementById(id);
 const phone=()=>window.innerWidth<=760;
 const solo=()=>!!(window.RKPLAY&&window.RKPLAY.solo);
 const live=()=>!!(window.RKPLAY&&!window.RKPLAY.solo);
 let open=false,unread=0,obs=null,was=false;

 const CSS=`
/* the HUD button the old style added is replaced by our own, so hide it */
#rkchatbtn{display:none!important}

#chatw{
 position:absolute!important;top:auto!important;right:auto;left:12px;
 bottom:calc(96px + env(safe-area-inset-bottom,0px));
 width:min(330px,66vw);max-width:330px;padding:0!important;gap:0!important;
 color:#eef0ff;background:#0d1017f2;border:1px solid #ffffff1f;border-radius:14px;
 box-shadow:0 16px 40px #0009;overflow:hidden;z-index:30;font-size:13px;
 backdrop-filter:none!important;-webkit-backdrop-filter:none!important;
}
#chatw.rk-open{display:flex!important;flex-direction:column}
#chatw:not(.rk-open){display:none!important}

/* the engine's own list stays as the place lines are written to; the panel shows its own copy */
#chatw #cbox{display:none!important}

.rk-chat-top{display:flex;align-items:center;gap:8px;padding:7px 8px 7px 11px;border-bottom:1px solid #ffffff14;flex:none}
.rk-chat-top b{font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:#9aa0ad;font-weight:800}
.rk-chat-top .rk-cx{margin-left:auto;width:26px;height:26px;min-height:0;padding:0;line-height:1;border-radius:8px;
 border:1px solid #ffffff1f;background:#ffffff0f;color:#cfd4ea;font-size:12px}
.rk-chat-top .rk-cx:hover{background:#ffffff1f;border-color:#ffffff33}

.rk-hist{display:flex;flex-direction:column;gap:3px;padding:8px;overflow:auto;max-height:min(32vh,250px);
 font-size:13px;line-height:1.35;overscroll-behavior:contain;scrollbar-width:thin}
.rk-hist>div{background:#ffffff0d;border-radius:9px;padding:4px 9px;word-break:break-word;flex:none}
.rk-hist b{color:#ffd23f;font-weight:700;margin-right:4px}
.rk-hist .rk-ct{float:right;margin-left:8px;font-size:10px;color:#6f7a94;line-height:1.7}
.rk-hist .rk-fil{color:#ff9b9b!important;font-style:italic;background:#ff4b4b1f;border:1px solid #ff6b6b44}
.rk-hist .rk-empty{background:transparent;color:#6f7a94;font-size:12px;text-align:center;padding:12px 4px}

#cin{display:flex;gap:6px;margin:0;padding:8px;border-top:1px solid #ffffff14;flex:none;background:#0a0d14}
#cin input{flex:1;margin:0;min-height:36px;padding:8px 10px;font-size:14px;color:#fff;
 background:#151a26;border:1px solid #ffffff1f;border-radius:10px}
#cin input::placeholder{color:#6f7a94}
#cin input:focus{outline:0;border-color:#3d5bff;box-shadow:0 0 0 2px #3d5bff44}
#cin button{min-height:36px;padding:0 13px;border-radius:10px;border:1px solid #3d5bff;background:#3d5bff;
 color:#fff;font-weight:750;font-size:13px}
#cin button:active{background:#2c46d8}

.rk-ph{display:flex;gap:5px;padding:0 8px 8px;flex-wrap:wrap;background:#0a0d14;flex:none}
.rk-ph button{min-height:26px;padding:3px 9px;border-radius:8px;border:1px solid #ffffff1f;
 background:#151a26;color:#cfd4ea;font-size:11.5px;font-weight:650}
.rk-ph button:hover{border-color:#3d5bff;color:#fff}

#rk-chat-btn{position:relative}
.rk-cbadge{position:absolute;top:-4px;right:-4px;min-width:17px;height:17px;border-radius:9px;background:#e5484d;
 color:#fff;font-size:11px;font-weight:800;line-height:17px;text-align:center;padding:0 4px;display:none}
.rk-cbadge.on{display:block}

@media(max-width:760px){
 #chatw{left:8px;width:min(300px,74vw);bottom:calc(152px + env(safe-area-inset-bottom,0px))}
 .rk-hist{max-height:24vh}
 /* while typing, sit under the HUD so the keyboard cannot cover the box */
 #chatw.rk-typing{top:calc(54px + env(safe-area-inset-top,0px))!important;bottom:auto!important;left:8px;right:8px;width:auto;max-width:none}
}
`;

 function style(){
  if($('rk-gc-style'))return;
  const st=document.createElement('style');
  st.id='rk-gc-style';
  st.textContent=CSS;
  document.head.appendChild(st);
 }

 function badgeCount(){
  const b=$('rk-cbadge');
  if(!b)return;
  b.textContent=unread>9?'9+':String(unread);
  b.classList.toggle('on',unread>0&&!open);
 }

 function setOpen(v){
  open=!!v;
  const w=$('chatw');
  if(w)w.classList.toggle('rk-open',open);
  if(open){
   unread=0;badgeCount();
   const box=$('rkhist');
   if(box)box.scrollTop=box.scrollHeight;
   if(!phone()){const i=$('ci');if(i)setTimeout(()=>{try{i.focus()}catch(e){}},30)}
  }else{
   const i=$('ci');if(i)try{i.blur()}catch(e){}
  }
 }

 /* the engine writes a line into #cbox, then drops it again 14 seconds later; copy it across so the
    panel keeps a history instead of blanking out behind you */
 function push(n){
  const box=$('rkhist');
  if(!box)return;
  const d=n.cloneNode(true);
  const t=document.createElement('span');
  t.className='rk-ct';
  t.textContent=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  d.appendChild(t);
  const empty=box.querySelector('.rk-empty');
  if(empty)empty.remove();
  box.appendChild(d);
  while(box.children.length>60)box.firstChild.remove();
  if(open)box.scrollTop=box.scrollHeight;
  else{unread++;badgeCount()}
 }

 function watch(){
  const cb=$('cbox');
  if(!cb||obs)return;
  obs=new MutationObserver(ms=>{
   for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1)push(n);
  });
  obs.observe(cb,{childList:true});
 }

 function build(){
  const w=$('chatw');
  if(!w)return;
  // the earlier layer's heading and phrase row are replaced by the ones below
  w.querySelectorAll('.rk-chathead,.rk-emotes').forEach(n=>n.remove());
  watch();
  if(w.dataset.rk42)return;
  w.dataset.rk42='1';
  const top=document.createElement('div');
  top.className='rk-chat-top';
  top.innerHTML='<b>Chat</b><button class="rk-cx" id="rk-cx" aria-label="Close chat">✕</button>';
  w.prepend(top);
  $('rk-cx').onclick=()=>setOpen(false);
  const box=document.createElement('div');
  box.className='rk-hist';
  box.id='rkhist';
  box.innerHTML='<div class="rk-empty">No messages yet — say hi!</div>';
  const input=$('cin');
  w.insertBefore(box,input||null);
  const ph=document.createElement('div');
  ph.className='rk-ph';
  ph.innerHTML=['GG','Hi!','Nice shot!','Help'].map(t=>'<button data-ph="'+t+'">'+t+'</button>').join('');
  w.insertBefore(ph,input?input.nextSibling:null);
  ph.querySelectorAll('[data-ph]').forEach(b=>b.onclick=()=>{
   const i=$('ci'),s=$('cs');
   if(!i||!s)return;
   i.value=b.dataset.ph;
   s.click();
   setOpen(false);
  });
  const field=$('ci'); // the text input itself, inside #cin
  if(field){
   field.setAttribute('maxlength','160');
   field.setAttribute('placeholder','Say something…');
   field.setAttribute('autocomplete','off');
   field.addEventListener('focus',()=>{
    w.classList.add('rk-typing');
    setTimeout(()=>{const b=$('rkhist');if(b)b.scrollTop=b.scrollHeight},60);
   });
   field.addEventListener('blur',()=>w.classList.remove('rk-typing'));
   field.addEventListener('keydown',e=>{
    if(e.key=='Escape'){e.stopPropagation();try{field.blur()}catch(_){}setOpen(false)}
    if(e.key=='Enter')setTimeout(()=>{if(phone()){try{field.blur()}catch(_){}setOpen(false)}},0);
   });
  }
 }

 function bindButton(){
  const r=document.querySelector('.rk-hud-r');
  if(!r)return;
  let b=$('rk-chat-btn');
  if(!b){
   b=document.createElement('button');
   b.id='rk-chat-btn';
   b.className='rk-hbtn';
   b.setAttribute('aria-label','Chat');
   b.innerHTML='💬<span class="rk-cbadge" id="rk-cbadge"></span>';
   b.onclick=()=>{
    if(solo()){if(typeof toast=='function')toast('Chat is for servers — this game is solo.');return}
    setOpen(!open);
   };
   const menu=$('rkmenubtn');
   r.insertBefore(b,menu||null);
  }
  b.style.display=live()?'':'none';
  badgeCount();
 }

 function reset(){
  if(obs){obs.disconnect();obs=null}
  unread=0;
  const box=$('rkhist');
  if(box)box.innerHTML='<div class="rk-empty">No messages yet — say hi!</div>';
  const w=$('chatw');
  if(w)w.classList.remove('rk-open','rk-typing');
  open=false;
  badgeCount();
 }

 function tick(){
  style();
  const W=$('game');
  if(!W)return;
  const on=!!W.style.display&&W.style.display!=='none';
  if(on&&!was){
   was=true;
   build();
   bindButton();
   if(live())setOpen(window.innerWidth>760);
   else reset();
  }else if(!on&&was){
   was=false;
   reset();
  }
 }

 addEventListener('keydown',e=>{if(e.key=='Escape'&&open)setOpen(false)});
 style();
 const ready=()=>{try{tick()}catch(e){}};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else ready();
 const startWatch=()=>{
  const W=$('game');
  if(!W)return;
  new MutationObserver(tick).observe(W,{attributes:true,attributeFilter:['style']});
  tick();
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startWatch);else startWatch();
})();
