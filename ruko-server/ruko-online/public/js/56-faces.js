/* ---------- v56: faces are shop items ---------- */
/* Faces used to be a free list of 22 drawings in the avatar editor: every one of them available to
   everybody, and nothing in the shop. They are items now (see faces.js on the server), so they show
   up in the Catalog under their own Faces tab, they are bought with Rukos, and the avatar only lets
   you wear one you own. The first four are the starter set that every account is given.

   This file is the drawing side and the shop side of that:
     - every face is redrawn, so they read clearly at 64 pixels and in 3D;
     - a face item's thumbnail is the face itself, not an empty hat;
     - the avatar's face picker shows locks and prices on the ones you do not own;
     - a face item page wears the face instead of trying to hang it on the head. */
(function(){
 if(window.RKFACE)return;
 window.RKFACE=1;

 /* ---------- the drawings ---------- */
 /* One 64x64 picture per face, drawn in the skin colour you picked, so the same drawing works for
    every skin tone. Kept to plain 2D canvas calls: this texture also goes on the 3D head. */
 function drawFace(skin,f){
  const k=document.createElement('canvas');
  k.width=k.height=64;
  const x=k.getContext('2d');
  const INK='#23242c';
  x.fillStyle=skin;x.fillRect(0,0,64,64);
  const g=x.createLinearGradient(0,0,0,64);
  g.addColorStop(0,'rgba(255,255,255,.18)');
  g.addColorStop(.45,'rgba(255,255,255,0)');
  g.addColorStop(1,'rgba(0,0,0,.13)');
  x.fillStyle=g;x.fillRect(0,0,64,64);
  x.lineCap='round';x.lineJoin='round';
  const ink=c=>{x.fillStyle=x.strokeStyle=c||INK;x.lineWidth=1};
  const dot=(a,b,r)=>{x.beginPath();x.arc(a,b,r,0,7);x.fill()};
  const line=(a,b,c,d)=>{x.beginPath();x.moveTo(a,b);x.lineTo(c,d);x.stroke()};
  const eye=(a,b,rx,ry)=>{ink();x.beginPath();x.ellipse(a,b,rx,ry||rx,0,0,7);x.fill();
   x.fillStyle='rgba(255,255,255,.88)';x.beginPath();x.arc(a-rx*.34,b-rx*.4,Math.max(.9,rx*.32),0,7);x.fill();ink()};
  const eyes=(rx,ry)=>{eye(23,26,rx||4.4,ry||5.2);eye(41,26,rx||4.4,ry||5.2)};
  const shut=(a,b)=>{ink();x.lineWidth=2.8;x.beginPath();x.arc(a,b,5,.35,2.8);x.stroke();x.lineWidth=1};
  const brow=(a,b,c,d)=>{ink();x.lineWidth=3.2;line(a,b,c,d);x.lineWidth=1};
  const smile=(y,r)=>{ink();x.lineWidth=3.4;x.beginPath();x.arc(32,y||33,r||10,.32,2.82);x.stroke();x.lineWidth=1};
  const frown=(y,r)=>{ink();x.lineWidth=3.4;x.beginPath();x.arc(32,y||52,r||11,3.42,6.0);x.stroke();x.lineWidth=1};
  const flat=()=>{ink();x.lineWidth=3.4;line(25,42,39,42);x.lineWidth=1};
  const gap=(cy,rx,ry)=>{ink();x.beginPath();x.ellipse(32,cy||44,rx||9,ry||7,0,0,7);x.fill()};
  const blush=a=>{x.save();x.globalAlpha=a==null?.45:a;x.fillStyle='#ff7a8a';
   x.beginPath();x.ellipse(15,36,5.4,3.2,0,0,7);x.fill();x.beginPath();x.ellipse(49,36,5.4,3.2,0,0,7);x.fill();x.restore()};
  const heart=(a,b,s)=>{ink('#ff3f6c');x.beginPath();x.moveTo(a,b+s*.9);
   x.bezierCurveTo(a-s*1.5,b+s*.15,a-s*.75,b-s*1.15,a,b-s*.3);
   x.bezierCurveTo(a+s*.75,b-s*1.15,a+s*1.5,b+s*.15,a,b+s*.9);x.fill();ink()};
  const star=(a,b,r)=>{ink('#ffcf3f');x.beginPath();
   for(let i=0;i<10;i++){const an=Math.PI/5*i-Math.PI/2,q=i%2?r*.44:r,px=a+Math.cos(an)*q,py=b+Math.sin(an)*q;
    i?x.lineTo(px,py):x.moveTo(px,py)}x.closePath();x.fill();ink()};

  switch(f|0){
   case 0: /* Smile */ eyes(); smile(); break;
   case 1: /* Cool */ ink('#15161d');x.fillRect(11,21,19,10);x.fillRect(34,21,19,10);x.fillRect(29,24,7,3);
    x.fillStyle='rgba(255,255,255,.3)';x.fillRect(14,23,6,3);x.fillRect(37,23,6,3);
    ink();x.lineWidth=3.2;x.beginPath();x.arc(31,36,9,.25,1.95);x.stroke();x.lineWidth=1;break;
   case 2: /* Surprised */ eyes(5.2,6.4);brow(17,15,26,12);brow(47,15,38,12);gap(45,5,6.4);break;
   case 3: /* Stoic */ brow(17,23,27,23);brow(37,23,47,23);eyes(4,4.6);flat();break;
   case 4: /* Grin */ eyes();ink();x.beginPath();x.moveTo(20,35);x.quadraticCurveTo(32,56,44,35);x.closePath();x.fill();
    x.fillStyle='#fff';x.fillRect(23,36,18,4);ink();break;
   case 5: /* Wink */ eye(23,26,4.6,5.4);shut(41,26);brow(35,16,45,18);smile(34,9);break;
   case 6: /* Tongue */ eyes();gap(44,8,6);x.fillStyle='#ff7a95';x.beginPath();x.ellipse(32,49,5,3.6,0,0,7);x.fill();ink();break;
   case 7: /* Angry */ brow(16,18,28,25);brow(48,18,36,25);eyes(4,4.6);frown(52,11);break;
   case 8: /* Sad */ brow(16,25,26,19);brow(48,25,38,19);eyes();frown(52,11);
    x.fillStyle='#5ec4ff';x.beginPath();x.ellipse(45,37,1.9,3.8,0,0,7);x.fill();ink();break;
   case 9: /* Laughing */ shut(23,26);shut(41,26);ink();x.beginPath();x.moveTo(20,35);x.quadraticCurveTo(32,57,44,35);x.closePath();x.fill();
    x.fillStyle='#fff';x.fillRect(22,36,20,4);ink();blush(.4);break;
   case 10: /* Sleepy */ ink();x.fillRect(19,25,8,2.8);x.fillRect(37,25,8,2.8);
    x.font='bold 13px system-ui,sans-serif';x.fillText('z',50,16);ink();x.lineWidth=3;x.beginPath();x.arc(32,40,6,.4,2.7);x.stroke();x.lineWidth=1;break;
   case 11: /* Hearts */ heart(23,26,6);heart(41,26,6);smile(35,9);break;
   case 12: /* Stars */ star(23,26,7);star(41,26,7);smile(35,9);break;
   case 13: /* Dizzy */ ink();x.lineWidth=2.4;
    x.beginPath();x.arc(23,26,5.4,.4,4.9);x.stroke();x.beginPath();x.arc(41,26,5.4,.4,4.9);x.stroke();x.lineWidth=1;
    x.beginPath();x.moveTo(22,43);x.bezierCurveTo(27,38,31,48,36,43);x.bezierCurveTo(40,39,42,45,44,43);x.stroke();break;
   case 14: /* Cat */ ink();x.beginPath();x.ellipse(23,26,2.2,5.6,0,0,7);x.fill();x.beginPath();x.ellipse(41,26,2.2,5.6,0,0,7);x.fill();
    x.beginPath();x.moveTo(32,38);x.lineTo(29,41);x.lineTo(35,41);x.closePath();x.fill();
    x.lineWidth=1.6;line(32,41,23,45);line(32,41,41,45);
    x.lineWidth=2;x.beginPath();x.arc(28,44,3.4,.2,2.2);x.stroke();x.beginPath();x.arc(36,44,3.4,.95,2.95);x.stroke();x.lineWidth=1;break;
   case 15: /* Robot */ ink('#3c4652');x.fillRect(17,20,13,11);x.fillRect(34,20,13,11);
    x.fillStyle='#c9f5ff';x.fillRect(19,22,4,4);x.fillRect(36,22,4,4);
    x.fillStyle='#3c4652';x.fillRect(24,38,16,3);x.fillRect(24,43,16,3);x.fillRect(24,48,10,3);ink();break;
   case 16: /* Blush */ eyes();smile(34,8.5);blush(.55);break;
   case 17: /* Smirk */ brow(16,22,27,22);brow(37,17,48,21);eye(23,27,4,4.6);eye(41,27,4,4.6);
    ink();x.lineWidth=3.2;x.beginPath();x.arc(35,37,8,.4,1.9);x.stroke();x.lineWidth=1;break;
   case 18: /* Cyclops */ eye(32,27,8.4,9);smile(34,9.5);break;
   case 19: /* Derp */ eye(22,25,5,6);eye(43,28,3,3.4);ink();x.beginPath();x.ellipse(32,44,7,5.4,0,0,7);x.fill();
    x.fillStyle='#ff7a95';x.beginPath();x.ellipse(36,49,4,3,0,0,7);x.fill();ink();break;
   case 20: /* Vampire */ eyes();ink();x.beginPath();x.moveTo(22,36);x.quadraticCurveTo(32,50,42,36);x.closePath();x.fill();
    x.fillStyle='#fff';x.beginPath();x.moveTo(25,37);x.lineTo(28,37);x.lineTo(26.5,42);x.fill();
    x.beginPath();x.moveTo(36,37);x.lineTo(39,37);x.lineTo(37.5,42);x.fill();
    ink();brow(17,18,27,20);brow(37,20,47,18);break;
   case 21: /* Nerd */ ink();x.lineWidth=2.4;
    x.beginPath();x.arc(23,26,7,0,7);x.stroke();x.beginPath();x.arc(41,26,7,0,7);x.stroke();line(30,26,34,26);x.lineWidth=1;
    ink();dot(23,26,2.6);dot(41,26,2.6);
    ink();x.lineWidth=3;line(26,40,38,40);x.lineWidth=1;
    x.fillStyle='#fff';x.fillRect(27,41,4,4);x.fillRect(33,41,4,4);ink();
    dot(16,32,1.1);dot(18,35,1.1);dot(48,32,1.1);dot(46,35,1.1);break;
   default: eyes();smile();
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
