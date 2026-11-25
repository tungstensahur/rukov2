/* ---------- v56: faces are shop items ---------- */
/* Faces used to be a free list of 22 drawings in the avatar editor: every one of them available to
   everybody, and nothing in the shop. They are items now (see faces.js on the server), so they show
   up in the Catalog under their own Faces tab, they are bought with Rukos, and the avatar only lets
   you wear one you own. The first four are the starter set that every account is given.

   This file is the shop side of that:
     - the faces keep their simple drawings, exactly as they were;
     - a face item's thumbnail is the face itself, not an empty hat;
     - the avatar's face picker shows locks and prices on the ones you do not own;
     - a face item page wears the face instead of trying to hang it on the head. */
(function(){
 if(window.RKFACE)return;
 window.RKFACE=1;

 /* The faces themselves are still the simple drawings from 12-more-faces: dots, brows and a
    curved mouth, drawn in the skin colour you picked. A redraw was tried and looked wrong at this
    size, so the drawings are left exactly as they were. */


 /* ---------- an item, not a hat ---------- */
 try{
  const t0=thumb;
  thumb=function(h){
   if(h&&h.kind=='face'){try{return faceURL('#f5cd30',h.face|0)}catch(e){}}
   return t0.apply(this,arguments);
  };
  thumb.c=(t0&&t0.c)||{};
 }catch(e){}

 /* ---------- what the shop knows ---------- */
 const faces=()=>{try{return hats().filter(h=>h&&h.kind=='face')}catch(e){return []}};
 const itemOf=i=>faces().find(h=>+h.face===+i)||null;
 const owns=i=>{
  // the starter four are free, and every account is given them, so they are always wearable
  if(i<4)return true;
  try{
   const me=cur();
   if(!me)return false;
   const it=itemOf(i);
   if(!it)return false;
   return (me.owned||[]).includes(it.id);
  }catch(e){return false}
 };

 /* ---------- the avatar's face picker ---------- */
 /* The editor draws one button per face. The ones you do not own keep their picture but get a lock,
    a price, and lead to the item page instead of putting it on. */
 let lastSig='';
 function picker(){
  const box=document.getElementById('fg');
  if(!box||!box.querySelector('[data-face]'))return;
  const me=(()=>{try{return cur()}catch(e){return null}})();
  if(!me)return;
  const sig=[box.querySelectorAll('[data-face]').length,(me.owned||[]).length,(me.av&&me.av.face)||0].join('/');
  if(sig===lastSig&&box.dataset.rkf===sig)return;
  box.dataset.rkf=sig;
  lastSig=sig;
  let locked=0;
  box.querySelectorAll('[data-face]').forEach(b=>{
   const i=+b.dataset.face;
   const it=itemOf(i);
   if(owns(i)){
    b.classList.remove('rkf-lock');
    const t=b.querySelector('.rkf-tag');
    if(t)t.remove();
    return;
   }
   locked++;
   b.classList.add('rkf-lock');
   if(!b.querySelector('.rkf-tag')){
    const s=document.createElement('span');
    s.className='rkf-tag';
    s.textContent=it&&it.price?'🔒 '+it.price:'🔒';
    b.appendChild(s);
   }
   b.title=(it?it.name+' — ':'')+'buy it in the Catalog';
   b.onclick=()=>{
    if(it)location.hash='#/hat/'+it.id;
    else try{toast('This face is not in the shop yet.')}catch(e){}
   };
  });
  if(locked&&!box.querySelector('.rkf-more')){
   const m=document.createElement('button');
   m.type='button';
   m.className='rkf-more';
   m.textContent='🙂 Get more faces in the Catalog →';
   m.onclick=()=>{try{CF.slot='faces'}catch(e){}location.hash='#/catalog'};
   box.appendChild(m);
  }
 }

 /* ---------- the Catalog: its own tab, and the right label ---------- */
 function catalogBits(){
  const bar=document.querySelector('#app .cat-bar .chips');
  if(bar&&!bar.querySelector('[data-sl="faces"]')){
   const b=document.createElement('button');
   b.type='button';
   b.dataset.sl='faces';
   b.textContent='🙂 Faces';
   if(typeof CF!=='undefined'&&CF.slot=='faces')b.className='on';
   b.onclick=()=>{try{CF.slot='faces'}catch(e){}try{catalog()}catch(e){}};
   bar.appendChild(b);
  }
  // a face tile's second line is "By Ruko · Head", because there was no such slot before
  const tiles=document.querySelectorAll('#app [data-h]');
  if(!tiles.length)return;
  const list=faces();
  if(!list.length)return;
  const byId={};
  list.forEach(h=>byId[h.id]=h);
  tiles.forEach(t=>{
   if(!byId[t.getAttribute('data-h')])return;
   const m=t.querySelector('.cat-meta span')||t.querySelector('.mut');
   if(m&&/Head\s*$/.test(m.textContent))m.textContent=m.textContent.replace(/Head\s*$/,'Face');
  });
 }

 /* ---------- a face item's page ---------- */
 try{
  const hp=hatPage;
  hatPage=function(id){
   const r=hp.apply(this,arguments);
   try{
    const h=hats().find(x=>x&&x.id==id);
    if(h&&h.kind=='face'){
     const me=cur(),on=!!(me&&me.av&&+me.av.face===+h.face);
     document.querySelectorAll('#app .mut').forEach(el=>{
      if(/·\s*(Head|undefined)\s*$/.test(el.textContent))el.textContent=el.textContent.replace(/·\s*(Head|undefined)\s*$/,'· Face');
     });
     const eq=document.getElementById('eq');
     if(eq){
      eq.disabled=on;
      eq.textContent=on?'Worn':'Wear this face';
      eq.onclick=()=>{
       const m=cur();
       m.av={...(m.av||{}),face:+h.face};
       saveUser(m);
       hatPage(id);
      };
     }
    }
   }catch(e){}
   return r;
  };
 }catch(e){}

 /* ---------- the little bit of styling it needs ---------- */
 (function(){
  if(document.getElementById('rkface-style'))return;
  const st=document.createElement('style');
  st.id='rkface-style';
  st.textContent='#fg button{position:relative}'+
   '#fg .rkf-lock{opacity:.6;filter:saturate(.45)}'+
   '#fg .rkf-lock:active{opacity:.85}'+
   '#fg .rkf-tag{position:absolute;right:0;bottom:0;font-size:9px;line-height:1;padding:2px 3px;border-radius:7px 0 7px 0;background:#000c;color:#fff;font-weight:800}'+
   '#fg .rkf-more{width:100%;min-height:36px;font-size:12px;margin-top:4px;padding:4px 8px}';
  document.head.appendChild(st);
 })();

 /* ---------- make sure the shop has them on the very first page ---------- */
 /* The server adds the face items when a request reaches it (routes.js), and the item list is read
    on load, so one request is made here first. If that turned up faces the page did not have, the
    item list and the account are reloaded and the page is painted again. */
 (async()=>{
  try{
   const before=faces().length;
   await api('/api/daily');
   const m=await api('/api/me');
   if(m&&m.me)ME=m.me;
   await loadAll();
   if(faces().length!==before){
    let live=false;
    try{live=typeof inGame=='function'&&inGame()}catch(e){}
    if(!live)render();
   }
  }catch(e){}
 })();

 /* ---------- keep the patched bits patched ---------- */
 let busy=0;
 const pass=()=>{try{picker()}catch(e){}try{catalogBits()}catch(e){}};
 try{
  const ob=new MutationObserver(()=>{
   if(busy)return;
   busy=1;
   requestAnimationFrame(()=>{busy=0;pass()});
  });
  const app=document.getElementById('app');
  if(app)ob.observe(app,{childList:true,subtree:true});
 }catch(e){}
 addEventListener('hashchange',()=>setTimeout(pass,60));
 setTimeout(pass,400);
 setTimeout(pass,1800);
 window.RKFACEON=1;
})();
