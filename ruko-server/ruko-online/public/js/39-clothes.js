/* ---------- v39: shirts with sleeves, and pants ---------- */
/* Players could already make a t-shirt, but it only painted the torso. This overlay lets a shirt
   cover the arms too (sleeves), and adds whole pants: a picture the player makes, worn on the legs.
   Nothing in the older files is rewritten: the designer, the avatar page, the player model and the
   item page are wrapped, so the rest of the site behaves exactly as before. */
(function(){
 if(window.RKCLOTH)return;

 /* a pants item is a picture, so its thumbnail is the picture itself */
 const bt=thumb;
 thumb=function(h){
  try{if(h&&h.kind=='pants')return '/api/shirt/'+h.id+'?v='+(h.tv||0)}catch(e){}
  return bt.apply(this,arguments);
 };
 thumb.c=bt.c||{}; // the old thumbnail keeps its cache on the function itself
 const imgOf=id=>{const h=hats().find(x=>x.id==id);return h?'/api/shirt/'+id+'?v='+(h.tv||0):null};
 const crop=(im,part)=>{
  const cv=document.createElement('canvas');
  cv.width=cv.height=128;
  const x=cv.getContext('2d');
  if(part=='top')x.drawImage(im,0,0,im.width,Math.max(1,Math.round(im.height*.5)),0,0,128,64);
  else x.drawImage(im,0,0,im.width,im.height,0,0,128,128);
  const t=new THREE.CanvasTexture(cv);
  t.needsUpdate=true;
  return t;
 };

 /* ---------- the player model wears them ---------- */
 function wear(g,av){
  const L=g&&g.userData&&g.userData.l;
  if(!L)return;
  const teeSrc=av.teeUrl||(av.tee?imgOf(av.tee):null);
  const pantSrc=av.pantsUrl||(av.pantsTex?imgOf(av.pantsTex):null);
  const item=av.tee?hats().find(h=>h.id==av.tee):null;
  const sleeves=av.teeSleeves!=null?!!av.teeSleeves:!!(item&&item.sleeves);
  const jobs=[];
  const put=(list,part,src)=>{
   jobs.push(loadTee(src).then(im=>{
    const m=new THREE.MeshLambertMaterial({map:crop(im,part)});
    list.forEach(gp=>{const q=gp&&gp.children[0];if(q){q.material=m;q.material.needsUpdate=true}});
   }).catch(()=>{}));
  };
  if(teeSrc&&sleeves)put([L.la,L.ra],'top',teeSrc);
  if(pantSrc)put([L.ll,L.rl],'all',pantSrc);
  // the preview redraws once the pictures are ready, the same way it does for a plain t-shirt
  if(jobs.length){
   const prev=g.userData.tw;
   g.userData.tw=Promise.all([prev].concat(jobs).filter(Boolean)).catch(()=>{});
  }
 }
 const bmp=makePlayer;
 makePlayer=function(hat,av,nm){
  const g=bmp.apply(this,arguments);
  try{wear(g,av||{})}catch(e){}
  return g;
 };

 /* ---------- the designer ---------- */
 let CE=null;
 function clothesEd(me,kind){
  if(!CE||CE.kind!=kind)CE={kind,name:kind=='pants'?'My Pants':'My Shirt',price:50,im:null,scale:1,ox:0,oy:0,bgOn:false,bg:'#ffffff',text:'',tc:'#ffffff',ts:48,rot:.3,sleeves:kind=='shirt'};
  const E=$('#ed');
  if(!E)return;
  const S=CE,isP=kind=='pants';
  E.innerHTML=`<div class="hat">
   <div class="card"><img id="cp" alt=""><label>Rotate</label><input id="cr" type="range" min="-3.14" max="3.14" step=".05" value="${S.rot}">
    <p class="mut" style="font-size:12px">${isP?'Pants are drawn on the legs':'Shirts can carry sleeves, so the arms match the body'}. Everything is reviewed by Ruko before it appears in the catalog.</p></div>
   <div class="card">
    <button class="pri" id="cu" style="width:100%">Choose image</button>
    <input id="cf" type="file" accept="image/*" style="display:none">
    <label>Image size: <span id="cvs">${S.scale}</span></label><input data-c="scale" type="range" min=".2" max="3" step=".05" value="${S.scale}">
    <label>Move left / right</label><input data-c="ox" type="range" min="-1" max="1" step=".02" value="${S.ox}">
    <label>Move up / down</label><input data-c="oy" type="range" min="-1" max="1" step=".02" value="${S.oy}">
    <label><input id="cb" type="checkbox" ${S.bgOn?'checked':''}> Solid background</label><input id="cbc" type="color" value="${S.bg}">
    <label>Text (optional)</label><input id="ct" maxlength="14" value="${esc(S.text)}">
    <label>Text color</label><input id="ctc" type="color" value="${S.tc}">
    <label>Text size: <span id="cvt">${S.ts}</span></label><input data-c="ts" type="range" min="16" max="120" step="2" value="${S.ts}">
    ${isP?'':`<label><input id="csl" type="checkbox" ${S.sleeves?'checked':''}> Sleeves on the arms</label>`}
   </div></div>
   <div class="card" style="margin-top:12px"><label>Name</label><input id="cn" maxlength="20" value="${esc(S.name)}">
    <label>Price (Rukos)</label><input id="cpr" type="number" min="0" max="1000" value="${S.price}">
    <button class="pri" id="cs" style="width:100%">Submit for review</button></div>`;

  const compose=()=>{
   const c=document.createElement('canvas');
   c.width=c.height=256;
   const x=c.getContext('2d');
   if(S.bgOn){x.fillStyle=S.bg;x.fillRect(0,0,256,256)}
   if(S.im){const s=Math.min(256/S.im.width,256/S.im.height)*S.scale,w=S.im.width*s,h=S.im.height*s;x.drawImage(S.im,128-w/2+S.ox*128,128-h/2+S.oy*128,w,h)}
   if(S.text){x.textAlign='center';x.textBaseline='middle';x.font='bold '+S.ts+'px sans-serif';x.lineWidth=Math.max(2,S.ts/12);x.strokeStyle='#0009';x.strokeText(S.text,128,128,240);x.fillStyle=S.tc;x.fillText(S.text,128,128,240)}
   let u=c.toDataURL('image/png');
   if(u.length>170000){const d=document.createElement('canvas');d.width=d.height=256;const y=d.getContext('2d');y.fillStyle=S.bgOn?S.bg:'#ffffff';y.fillRect(0,0,256,256);y.drawImage(c,0,0);u=d.toDataURL('image/jpeg',.85)}
   return u;
  };
  const draw=()=>{
   if(!$('#cp'))return;
   // an empty picture would paint nothing, so keep the plain clothes until something is drawn
   const url=(S.im||S.text)?compose():null,av={...(me.av||{})};
   if(isP)delete av.teeSleeves;else av.teeSleeves=S.sleeves;
   const m=makePlayer(gearList(me),isP?(url?{...av,pantsUrl:url}:av):(url?{...av,teeUrl:url}:av));
   m.rotation.y=S.rot;
   // a shirt is shown on the body, pants are shown on the legs
   if(isP)shotP($('#cp'),m,[0,2,7],[0,1.2,0]);
   else shotP($('#cp'),m,[0,2.4,7],[0,1.6,0]);
  };
  $('#cr').oninput=e=>{S.rot=+e.target.value;draw()};
  E.querySelectorAll('[data-c]').forEach(i=>i.oninput=()=>{S[i.dataset.c]=+i.value;const l={scale:'cvs',ts:'cvt'}[i.dataset.c];if(l)$('#'+l).textContent=i.value;draw()});
  $('#cu').onclick=()=>$('#cf').click();
  $('#cf').onchange=e=>{
   const f=e.target.files[0];
   if(!f)return;
   if(!/^image\//.test(f.type))return toast('Please choose an image.');
   const r=new FileReader();
   r.onload=()=>{const im=new Image();im.onload=()=>{S.im=im;draw()};im.onerror=()=>toast('Could not read that image.');im.src=r.result};
   r.readAsDataURL(f);
  };
  $('#cb').onchange=e=>{S.bgOn=e.target.checked;draw()};
  $('#cbc').oninput=e=>{S.bg=e.target.value;draw()};
  $('#ct').oninput=e=>{S.text=e.target.value;draw()};
  $('#ctc').oninput=e=>{S.tc=e.target.value;draw()};
  if($('#csl'))$('#csl').onchange=e=>{S.sleeves=e.target.checked;draw()};
  $('#cn').oninput=e=>S.name=e.target.value;
  $('#cpr').oninput=e=>S.price=+e.target.value;
  $('#cs').onclick=()=>{
   if(!S.im&&!S.text)return toast('Add an image or some text first.');
   const body={kind,name:S.name.trim()||(isP?'My Pants':'My Shirt'),price:Math.max(0,Math.min(1000,S.price||0)),img:compose()};
   if(!isP)body.sleeves=S.sleeves?1:0;
   api('/api/shirts',body).then(r=>{
    if(!r||r.error)return toast((r&&r.error)||'Could not submit.');
    toast(r.status=='approved'?'Published!':'Submitted! Ruko will review it before it appears in the catalog.',true);
    CE=null;
    loadAll().then(()=>create('mine'));
   });
  };
  draw();
 }
 shirtEd=me=>clothesEd(me,'shirt');

 /* ---------- Creator Studio gets a Pants tab ---------- */
 const TABS=[['hat','Items'],['shirt','Shirts'],['pants','Pants'],['game','Game'],['mine','My creations']];
 const shell=t=>`<h2>Creator Studio</h2><div class="tabs">${TABS.map(([k,n])=>`<button data-t="${k}" class="${t==k?'on':''}">${n}</button>`).join('')}</div><div id="ed"></div>`;
 const wireTabs=()=>app.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>create(b.dataset.t));
 const bc=create;
 create=function(tab){
  if(tab=='pants'){app.innerHTML=shell('pants');wireTabs();clothesEd(cur(),'pants');return}
  bc(tab);
  const bar=app.querySelector('.tabs');
  if(bar){
   const sh=bar.querySelector('[data-t="shirt"]');
   if(sh)sh.textContent='Shirts';
   if(!bar.querySelector('[data-t="pants"]')){
    const b=document.createElement('button');
    b.dataset.t='pants';
    b.textContent='Pants';
    bar.appendChild(b);
   }
   wireTabs();
  }
 };

 /* ---------- wear them from the Avatar page ---------- */
 const ba=avatar;
 avatar=function(){
  const r=ba.apply(this,arguments);
  try{
   const me=cur();
   if(!me)return r;
   const card=[...app.querySelectorAll('.card')].find(c=>c.querySelector('[data-tee]'));
   if(card&&!card.querySelector('[data-pants]')){
    const list=me.owned.map(i=>hats().find(h=>h.id==i)).filter(h=>h&&h.kind=='pants');
    const av=me.av||{};
    const box=document.createElement('div');
    box.innerHTML=`<label>Pants</label><div class="chips"><button data-pants="" class="${!av.pantsTex?'on':''}">None</button>${list.map(h=>`<button data-pants="${h.id}" class="${av.pantsTex==h.id?'on':''}">${esc(h.name)}</button>`).join('')}</div>${list.length?'':'<p class="mut" style="font-size:12px;margin:0">Make a pair in Creator Studio → Pants.</p>'}`;
    card.appendChild(box);
    box.querySelectorAll('[data-pants]').forEach(b=>b.onclick=()=>{
     const m=cur(),nv={...(m.av||{})};
     if(b.dataset.pants)nv.pantsTex=b.dataset.pants;else delete nv.pantsTex;
     m.av=nv;saveUser(m);avatar();
    });
   }
  }catch(e){}
  return r;
 };

 /* ---------- the item page equips pants on the legs ---------- */
 const bh=hatPage;
 hatPage=function(id){
  const r=bh.apply(this,arguments);
  try{
   const h=hats().find(x=>x.id==id);
   const eq=$('#eq');
   if(h&&h.kind=='pants'&&eq){
    const me=cur(),on=(me.av&&me.av.pantsTex)==id;
    eq.disabled=!!on;
    eq.textContent=on?'Equipped':'Equip';
    eq.onclick=()=>{const m=cur();m.av={...(m.av||{}),pantsTex:id};saveUser(m);hatPage(id)};
   }
  }catch(e){}
  return r;
 };

 window.RKCLOTH={clothesEd,kind:k=>clothesEd(cur(),k)};
})();
