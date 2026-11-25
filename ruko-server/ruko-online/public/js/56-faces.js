/* ---------- v56: faces are shop items ---------- */
/* Faces used to be a free list of 22 drawings in the avatar editor: every one of them available to
   everybody, and nothing in the shop. They are items now (see faces.js on the server), so they show
   up in the Catalog under their own Faces tab, they are bought with Rukos, and the avatar only lets
   you wear one you own. The first four are the starter set that every account is given.

   This file is the drawing side and the shop side of that:
     - the faces keep the old flat style, redrawn with even eyes, one smile and a clean shape for
       each expression;
     - a face item's thumbnail is the face itself, not an empty hat;
     - the avatar's face picker shows locks and prices on the ones you do not own;
     - a face item page wears the face instead of trying to hang it on the head. */
(function(){
 if(window.RKFACE)return;
 window.RKFACE=1;

 /* ---------- the drawings ---------- */
 /* The old style, kept: flat skin, thick black lines, no shading and no gradients — the same
    vocabulary the faces always had. What changed is the drawing itself: every face uses the same
    eye size on the same two spots, the same mouth height, and rounded caps, so the set looks like
    one family. 64x64, because this texture also goes on the 3D head. */
 function drawFace(skin,f){
  const k=document.createElement('canvas');
  k.width=k.height=64;
  const x=k.getContext('2d');
  const INK='#222';
  x.fillStyle=skin;x.fillRect(0,0,64,64);
  x.lineCap=x.lineJoin='round';
  const ink=c=>{x.fillStyle=x.strokeStyle=c||INK;x.lineWidth=4};
  ink();
  const dot=(a,b,r)=>{x.beginPath();x.arc(a,b,r,0,7);x.fill()};
  const ln=(a,b,c,d)=>{x.beginPath();x.moveTo(a,b);x.lineTo(c,d);x.stroke()};
  const arc=(a,b,r,s,e)=>{x.beginPath();x.arc(a,b,r,s,e);x.stroke()};
  const eyes=r=>{dot(22,25,r||4);dot(42,25,r||4)};
  const shut=(a,b)=>{x.beginPath();x.arc(a,b,5,3.6,5.8);x.stroke()};        /* eye closed */
  const smile=(y,r)=>{arc(32,y||36,r||11,.35,2.79)};
  const frown=(y,r)=>{arc(32,y||49,r||11,3.5,5.9)};
  const openMouth=(cy,rx,ry)=>{x.beginPath();x.ellipse(32,cy||41,rx||9,ry||6.5,0,0,7);x.fill()};
  const teeth=y=>{x.save();x.fillStyle='#fff';x.fillRect(23,y,18,4);x.restore();ink()};
  const tongue=(a,b)=>{x.save();x.fillStyle='#e0566b';x.beginPath();x.ellipse(a,b,4.6,3.2,0,0,7);x.fill();x.restore();ink()};
  const heart=(a,b,s)=>{x.save();x.fillStyle='#e0245e';
   dot(a-s*.45,b-s*.3,s*.5);dot(a+s*.45,b-s*.3,s*.5);
   x.beginPath();x.moveTo(a-s*.9,b+s*.05);x.lineTo(a,b+s);x.lineTo(a+s*.9,b+s*.05);x.closePath();x.fill();
   x.restore();ink()};
  const star=(a,b,r)=>{x.save();x.fillStyle='#e6b800';x.beginPath();
   for(let i=0;i<10;i++){const an=-Math.PI/2+i*Math.PI/5,q=i%2?r*.45:r,px=a+Math.cos(an)*q,py=b+Math.sin(an)*q;
    if(i)x.lineTo(px,py);else x.moveTo(px,py)}
   x.closePath();x.fill();x.restore();ink()};

  switch(f|0){
   case 0: /* Smile */ eyes();smile();break;
   case 1: /* Cool: two rounded shades and a small smirk */
    [11,36].forEach(a=>{
     x.beginPath();x.moveTo(a+3,20);x.lineTo(a+14,20);
     x.quadraticCurveTo(a+17,20,a+17,25.5);x.quadraticCurveTo(a+17,31,a+14,31);
     x.lineTo(a+3,31);x.quadraticCurveTo(a,31,a,25.5);x.quadraticCurveTo(a,20,a+3,20);
     x.closePath();x.fill();
    });
    x.fillRect(28,23.5,8,3.5);
    arc(34,38,10,.15,1.7);break;
   case 2: /* Surprised */
    eyes(5);ln(16,14,26,11);ln(48,14,38,11);
    x.beginPath();x.ellipse(32,45,5,6,0,0,7);x.fill();break;
   case 3: /* Stoic */
    x.fillRect(15,23,14,5);x.fillRect(35,23,14,5);ln(24,41,40,41);break;
   case 4: /* Grin */
    eyes();x.beginPath();x.moveTo(20,33);x.quadraticCurveTo(32,55,44,33);x.closePath();x.fill();
    teeth(35);break;
   case 5: /* Wink */
    dot(22,25,4);shut(42);smile();break;
   case 6: /* Tongue */
    eyes();openMouth();tongue(32,47);break;
   case 7: /* Angry */
    ln(14,16,27,23);ln(50,16,37,23);eyes(4);frown();break;
   case 8: /* Sad */
    ln(15,24,26,19);ln(49,24,38,19);eyes();frown(49,11);
    x.save();x.fillStyle='#4aa3ff';x.beginPath();x.ellipse(48,35,2.6,4,0,0,7);x.fill();x.restore();break;
   case 9: /* Laughing */
    shut(22,28);shut(42,28);
    x.beginPath();x.moveTo(20,34);x.quadraticCurveTo(32,56,44,34);x.closePath();x.fill();
    teeth(36);break;
   case 10: /* Sleepy: closed eyes, a yawn and two z's */
    shut(22,27);shut(42,27);
    x.beginPath();x.ellipse(32,44,4.2,5,0,0,7);x.fill();
    x.save();x.font='bold 15px system-ui,sans-serif';x.fillText('z',50,16);
    x.font='bold 10px system-ui,sans-serif';x.fillText('z',44,27);x.restore();break;
   case 11: /* Hearts */
    heart(22,25,7);heart(42,25,7);smile(38,10);break;
   case 12: /* Stars */
    star(22,25,7);star(42,25,7);smile(38,10);break;
   case 13: /* Dizzy: a swirl in each eye and a wavy mouth */
    x.lineWidth=3;
    [22,42].forEach(a=>{
     x.beginPath();x.arc(a,25,7,.25,5.15);x.stroke();
     x.beginPath();x.arc(a+1,25,3.2,3.1,6.2);x.stroke();
    });
    x.lineWidth=4;
    x.beginPath();x.moveTo(22,42);x.bezierCurveTo(27,37,31,47,36,42);x.bezierCurveTo(40,38,42,44,44,42);x.stroke();break;
   case 14: /* Cat: slit eyes, small nose, "w" mouth, whiskers clear of both */
    x.beginPath();x.ellipse(22,24,2.8,5.4,0,0,7);x.fill();
    x.beginPath();x.ellipse(42,24,2.8,5.4,0,0,7);x.fill();
    x.beginPath();x.moveTo(32,36);x.lineTo(29,40);x.lineTo(35,40);x.closePath();x.fill();
    x.lineWidth=3;
    ln(32,40,32,43);
    arc(28.5,43,3.6,.35,1.75);arc(35.5,43,3.6,.35,1.75);
    ln(11,32,20,36);ln(11,38,20,38);
    ln(53,32,44,36);ln(53,38,44,38);break;
   case 15: /* Robot */
    x.fillRect(16,19,13,11);x.fillRect(35,19,13,11);
    x.lineWidth=4;ln(24,40,40,40);ln(24,47,40,47);ln(24,54,34,54);break;
   case 16: /* Blush */
    eyes();smile(38,10);
    x.save();x.fillStyle='#ff9aa8';dot(14,36,4.6);dot(50,36,4.6);x.restore();break;
   case 17: /* Smirk */
    dot(22,26,4);dot(42,26,4);
    ln(15,20,26,20);ln(37,17,48,20);
    arc(36,40,9,.5,1.9);break;
   case 18: /* Cyclops */
    x.save();x.fillStyle='#fff';dot(32,26,9);x.restore();
    x.lineWidth=3;arc(32,26,9,0,7);
    x.save();x.fillStyle=INK;dot(34,27,4.5);x.restore();
    x.lineWidth=4;smile(42,9);break;
   case 19: /* Derp: one eye big, one small, tongue out */
    dot(22,24,5.5);dot(44,29,2.8);
    x.beginPath();x.ellipse(32,42,8,6,0,0,7);x.fill();
    tongue(35,46);break;
   case 20: /* Vampire */
    eyes();
    x.beginPath();x.moveTo(22,35);x.quadraticCurveTo(32,50,42,35);x.closePath();x.fill();
    x.save();x.fillStyle='#fff';
    x.beginPath();x.moveTo(25,36);x.lineTo(30,36);x.lineTo(27.5,43);x.closePath();x.fill();
    x.beginPath();x.moveTo(34,36);x.lineTo(39,36);x.lineTo(36.5,43);x.closePath();x.fill();
    x.restore();ink();
    ln(16,18,27,21);ln(48,18,37,21);break;
   case 21: /* Nerd */
    x.lineWidth=3;
    arc(22,25,7.5,0,7);arc(42,25,7.5,0,7);ln(29.5,25,34.5,25);
    x.lineWidth=4;ln(26,40,38,40);
    x.save();x.fillStyle='#fff';x.fillRect(27,41,4,4);x.fillRect(33,41,4,4);x.restore();ink();
    dot(16,32,1.2);dot(18,35,1.2);dot(48,32,1.2);dot(46,35,1.2);break;
   default: /* anything unknown is the plain smile */
    eyes();smile();
  }
  return k;
 }
 try{faceCanvas=drawFace}catch(e){try{window.faceCanvas=drawFace}catch(_){}}

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
