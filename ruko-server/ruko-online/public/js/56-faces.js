/* ---------- v56: faces are shop items ---------- */
/* A face used to be a free list of drawings in the avatar editor: every one of them available to
   everybody, and nothing in the shop. They are items now (see faces.js on the server), so they show
   up in the Catalog under their own Faces tab, they are bought with Rukos, and the avatar only lets
   you wear one you own.

   The game ships with one face, the smile. Every other face is a picture the official Ruko account
   uploads from this file (the ＋ Upload tile in the face picker), and the picture is used as the
   front of the head.

   This file is the drawing side and the shop side of that:
     - the smile is still drawn in code, in the old flat style;
     - an uploaded face's picture is what the head shows, laid over the skin colour;
     - a face item's thumbnail is the face itself, not an empty hat;
     - the avatar's face picker lists the faces the shop actually has, with locks and prices;
     - a face item page wears the face instead of trying to hang it on the head. */
(function(){
 if(window.RKFACE)return;
 window.RKFACE=1;

 /* ---------- the one drawing that ships ---------- */
 /* Flat skin, thick black lines, no shading: the style the faces always had. It is only used for
    the smile now; anything else is a picture from the catalog. */
 function drawFace(skin,f){
  const k=document.createElement('canvas');
  k.width=k.height=64;
  const x=k.getContext('2d');
  x.fillStyle=skin;x.fillRect(0,0,64,64);
  x.fillStyle=x.strokeStyle='#222';
  x.lineWidth=4;x.lineCap=x.lineJoin='round';
  x.beginPath();x.arc(22,25,4,0,7);x.fill();
  x.beginPath();x.arc(42,25,4,0,7);x.fill();
  x.beginPath();x.arc(32,36,11,.35,2.79);x.stroke();
  return k;
 }

 /* ---------- what the shop knows ---------- */
 const faces=()=>{try{return hats().filter(h=>h&&h.kind=='face')}catch(e){return []}};
 const faceItems=()=>faces().slice().sort((a,b)=>(a.face|0)-(b.face|0));
 const itemOf=i=>faces().find(h=>+h.face===+i)||null;
 const owns=i=>{
  // the smile is free, and every account is given it, so it is always wearable
  if(!(i|0))return true;
  try{
   const me=cur();
   if(!me)return false;
   const it=itemOf(i);
   if(!it)return false;
   return (me.owned||[]).includes(it.id);
  }catch(e){return false}
 };

 /* ---------- faces Ruko uploaded ---------- */
 /* An uploaded face carries its picture in the item itself, as a small data URL, so it needs no
    extra request and no drawing: the picture is drawn on the front of the head. Images are loaded
    once and kept, and the cached face pictures are cleared when one arrives. */
 const IMG={},URLS={};
 function pic(it){
  if(!it||!it.img)return null;
  let im=IMG[it.id];
  if(!im){
   im=IMG[it.id]=new Image();
   im.onload=()=>{
    try{for(const k in URLS)delete URLS[k]}catch(e){}
    try{const ap=document.getElementById('app');if(ap&&/^#\/avatar/.test(location.hash||''))render()}catch(e){}
   };
   im.src=it.img;
  }
  return im;
 }
 /* An uploaded picture is laid over the skin colour, never on bare canvas: the head's material has
    no transparency, so anything see-through in the picture would come out black. Painting the skin
    first means a face with a clear background shows the player's skin, exactly as it looks in the
    image editor. */
 function comp(skin,it){
  const k=document.createElement('canvas');
  k.width=k.height=64;
  const x=k.getContext('2d');
  const body=skin||'#f5cd30';
  x.fillStyle=body;x.fillRect(0,0,64,64);
  const im=pic(it);
  if(im&&im.complete&&im.naturalWidth)x.drawImage(im,0,0,64,64);
  return k;
 }
 /* Three small replacements: the drawing of a face, the little picture of it, and the texture that
    goes on the front of the head. Every one of them shows the uploaded picture when the face has
    one, and the smile otherwise — so no removed face can come back from an old number. */
 try{
  faceCanvas=function(skin,f){
   const it=itemOf(f);
   if(it&&it.img)return comp(skin,it);
   return drawFace(skin,f);
  };
  faceURL=function(skin,f){
   const it=itemOf(f);
   if(it&&it.img){
    const im=pic(it);
    // while the picture is still loading, show the picture itself; once it is here, show it on skin
    if(!(im&&im.complete&&im.naturalWidth))return it.img;
    const key='u|'+skin+'|'+it.id;
    return URLS[key]||(URLS[key]=comp(skin,it).toDataURL());
   }
   const key=skin+'|'+(f|0);
   return URLS[key]||(URLS[key]=faceCanvas(skin,f).toDataURL());
  };
  faceTex=function(skin,f){
   const it=itemOf(f);
   if(it&&it.img){
    const cv=comp(skin,it),t=new THREE.CanvasTexture(cv),im=pic(it);
    if(im&&im.complete&&im.naturalWidth)t.needsUpdate=true;
    else if(im){
     const old=im.onload;
     im.onload=()=>{
      try{
       const x=cv.getContext('2d');
       x.fillStyle=skin||'#f5cd30';x.fillRect(0,0,64,64);
       x.drawImage(im,0,0,64,64);
       t.needsUpdate=true;
      }catch(e){}
      try{old&&old()}catch(e){}
     };
    }
    return t;
   }
   return new THREE.CanvasTexture(faceCanvas(skin,f));
  };
 }catch(e){}

 /* ---------- an item, not a hat ---------- */
 try{
  const t0=thumb;
  thumb=function(h){
   if(h&&h.kind=='face'){try{return faceURL('#f5cd30',h.face|0)}catch(e){}}
   return t0.apply(this,arguments);
  };
  thumb.c=(t0&&t0.c)||{};
 }catch(e){}

 /* ---------- the avatar's face picker ---------- */
 /* One tile per face the shop has, in number order. The ones you do not own keep their picture but
    get a lock and a price, and lead to the item page instead of putting it on. The Ruko account
    gets an extra tile that uploads a new face. */
 let lastSig='';
 function paint(){
  const box=document.getElementById('fg');
  if(!box)return;
  let me=null;
  try{me=cur()}catch(e){}
  if(!me)return;
  const av=me.av||{},skin=av.skin||'#f5cd30',on=av.face|0;
  const list=faceItems(),want=list.map(h=>String(h.face|0)).join(',');
  const dom=[].map.call(box.querySelectorAll('[data-face]'),b=>b.dataset.face).join(',');
  const sig=want+'|'+on+'|'+skin+'|'+(me.owned||[]).length;
  if(want===dom&&box.dataset.rkf===sig)return;
  box.dataset.rkf=sig;
  lastSig=sig;
  box.innerHTML=list.map(h=>{
   const i=h.face|0,lock=!owns(i),price=h.price|0;
   const tip=h.name||'Face';
   return '<button data-face="'+i+'" class="'+(i===on?'on ':'')+(lock?'rkf-lock':'')+'"'+
    ' title="'+esc(tip)+(lock&&price?' — '+price+' Rukos':'')+'"'+
    ' style="padding:2px;width:62px;position:relative">'+
    '<img src="'+faceURL(skin,i)+'" style="width:100%;image-rendering:pixelated" alt="'+esc(tip)+'">'+
    (lock&&price?'<span class="rkf-tag">🔒 '+price+'</span>':'')+
    '</button>';
  }).join('');
  box.querySelectorAll('[data-face]').forEach(b=>{
   const i=+b.dataset.face,h=itemOf(i);
   b.onclick=()=>{
    if(owns(i)){
     const m=cur();
     m.av={...(m.av||{}),face:i};
     saveUser(m);
     try{avatar()}catch(e){}
    }else if(h){
     location.hash='#/hat/'+h.id;
    }
   };
  });
  if(list.some(h=>!owns(h.face|0))&&!box.querySelector('.rkf-more')){
   const m=document.createElement('button');
   m.type='button';
   m.className='rkf-more';
   m.textContent='🙂 See them all in the Catalog →';
   m.onclick=()=>{try{CF.slot='faces'}catch(e){}location.hash='#/catalog'};
   box.appendChild(m);
  }
  if(me.admin){
   if(!box.querySelector('.rkf-add')){
    const a=document.createElement('button');
    a.type='button';
    a.className='rkf-add';
    a.textContent='＋ Upload';
    a.title='Add a face picture (Ruko only)';
    a.onclick=upload;
    box.appendChild(a);
   }
  }
 }

 /* ---------- uploading a face (Ruko only) ---------- */
 /* The picture is cropped to a square and shrunk to 64x64, which is the size the head uses, so one
    face costs a few kilobytes and the catalog stays quick. The clear parts of the picture stay
    clear: they show the player's skin on the head. */
 function upload(){
  const inp=document.createElement('input');
  inp.type='file';
  inp.accept='image/*';
  inp.style.display='none';
  document.body.appendChild(inp);
  inp.onchange=()=>{
   const f=inp.files&&inp.files[0];
   if(!f)return;
   if(!/^image\//.test(f.type)){toast('Please choose a picture.');return}
   const r=new FileReader();
   r.onload=()=>{
    const im=new Image();
    im.onerror=()=>toast('Could not read that picture.');
    im.onload=()=>{
     const c=document.createElement('canvas');
     c.width=c.height=64;
     const x=c.getContext('2d');
     const s=Math.max(64/im.width,64/im.height),w=im.width*s,h=im.height*s;
     x.drawImage(im,(64-w)/2,(64-h)/2,w,h);
     let d=c.toDataURL('image/webp',.9);
     if(d.indexOf('data:image/webp')!==0)d=c.toDataURL('image/png');
     const name=(prompt('Name for this face?','New face')||'').replace(/\s+/g,' ').trim().slice(0,20);
     if(!name)return;
     const p=prompt('Price in Rukos (0 makes it free).','100');
     if(p===null)return;
     const price=Math.max(0,Math.min(1000,parseInt(p,10)||0));
     api('/api/faces',{img:d,name,price}).then(async res=>{
      if(!res||res.error){toast((res&&res.error)||'Could not add that face.');return}
      toast('Nice — that face is in the Catalog now.',true);
      await loadAll();
      try{avatar()}catch(e){}
     },()=>toast('Could not add that face. Check your connection.'));
    };
    im.src=r.result;
   };
   r.readAsDataURL(f);
  };
  inp.click();
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
   '#fg .rkf-more{width:100%;min-height:36px;font-size:12px;margin-top:4px;padding:4px 8px}'+
   '#fg .rkf-add{width:62px;font-size:11px;line-height:1.1;padding:6px 2px}';
  document.head.appendChild(st);
 })();

 /* ---------- make sure the shop is in step on the very first page ---------- */
 /* The server settles its face list when a request reaches it (routes.js), and the item list is read
    on load, so one request is made here first. If that changed the faces the page has, the item list
    and the account are reloaded and the page is painted again. */
 (async()=>{
  try{
   const before=faces().map(h=>h.id).join(',');
   await api('/api/daily');
   const m=await api('/api/me');
   if(m&&m.me)ME=m.me;
   await loadAll();
   if(faces().map(h=>h.id).join(',')!==before){
    let live=false;
    try{live=typeof inGame=='function'&&inGame()}catch(e){}
    if(!live)render();
   }
  }catch(e){}
 })();

 /* ---------- keep the patched bits patched ---------- */
 let busy=0;
 const pass=()=>{try{paint()}catch(e){}try{catalogBits()}catch(e){}};
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
