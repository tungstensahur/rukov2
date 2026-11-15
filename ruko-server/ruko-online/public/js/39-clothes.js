/* ---------- v39: real shirts (with sleeves), and pants ---------- */
/* Two different things live here:

   - a t-shirt graphic is still a picture printed on the torso, exactly as before (av.tee);
   - a shirt is now a garment: its own fabric colour, the print on the chest, and sleeves the
     maker chooses (none, short or long). It is a shell over the body plus sleeve boxes on the
     arms, worn from av.shirtTex, so it looks like clothing rather than a decal;
   - pants are a whole picture worn on the legs (av.pantsTex).

   Nothing in the older files is rewritten: the player model, the designer, the avatar page and
   the item page are wrapped. */
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
 const crop=(im,part,flip)=>{
  const cv=document.createElement('canvas');
  cv.width=cv.height=128;
  const x=cv.getContext('2d');
  if(flip){x.translate(128,0);x.scale(-1,1)}
  if(part=='top')x.drawImage(im,0,0,im.width,Math.max(1,Math.round(im.height*.5)),0,0,128,64);
  else x.drawImage(im,0,0,im.width,im.height,0,0,128,128);
  const t=new THREE.CanvasTexture(cv);
  t.needsUpdate=true;
  return t;
 };
 const tex=cv=>{const t=new THREE.CanvasTexture(cv);t.needsUpdate=true;return t};

 /* ---------- the shirt, worn as clothing ---------- */
 function shirt(g,av){
  const item=av.shirtTex?hats().find(h=>h.id==av.shirtTex):null;
  const url=av.shirtUrl||(item?imgOf(item.id):null);
  if(!item&&!av.shirtUrl)return;
  const col=/^#[0-9a-f]{6}$/i.test(String(av.shirtCol||(item&&item.col)||''))?String(av.shirtCol||item.col):(av.shirt||'#2f6fed');
  const sl=av.shirtSleeves!=null?+av.shirtSleeves:+(item&&item.sleeves)||0;
  // the sleeves are a shade darker, so they read as separate pieces of the same shirt
  const shade=c=>{const n=parseInt(String(c).slice(1),16);const r=Math.round(((n>>16)&255)*.84),gg=Math.round(((n>>8)&255)*.84),b=Math.round((n&255)*.84);return '#'+((1<<24)+(r<<16)+(gg<<8)+b).toString(16).slice(1)};
  const fm=new THREE.MeshLambertMaterial({color:col}),bm=new THREE.MeshLambertMaterial({color:col});
  const fabric=new THREE.MeshLambertMaterial({color:col}),sleeve=new THREE.MeshLambertMaterial({color:shade(col)});
  // the body of the shirt sits just outside the torso, so it reads as a layer of clothing
  const shell=new THREE.Mesh(roundBox(1.24,1.24,.68,.14,8),[fabric,fabric,fabric,fabric,fm,bm]);
  shell.position.y=1.8;
  g.add(shell);
  if(sl>0){
   const long=sl>=2,h=long?1.24:.52,y=long?-.6:-.28,w=.58;
   [g.userData.l.la,g.userData.l.ra].forEach(a=>{
    const box=new THREE.Mesh(roundBox(w,h,w,.1,6),sleeve);
    box.position.y=y;
    a.add(box);
   });
  }
  if(url){
   const paint=im=>{
    const cv=document.createElement('canvas');
    cv.width=cv.height=256;
    const x=cv.getContext('2d');
    x.fillStyle=col;
    x.fillRect(0,0,256,256);
    x.drawImage(im,0,0,256,256);
    fm.map=tex(cv);
    fm.color.set('#ffffff');
    fm.needsUpdate=true;
    const cv2=document.createElement('canvas');
    cv2.width=cv2.height=256;
    const y2=cv2.getContext('2d');
    y2.fillStyle=col;
    y2.fillRect(0,0,256,256);
    y2.translate(256,0);
    y2.scale(-1,1);
    y2.drawImage(im,0,0,256,256);
    bm.map=tex(cv2);
    bm.color.set('#ffffff');
    bm.needsUpdate=true;
   };
   const job=loadTee(url).then(paint).catch(()=>{});
   const prev=g.userData.tw;
   g.userData.tw=Promise.all([prev,job].filter(Boolean)).catch(()=>{});
  }
 }

 /* ---------- the pants ---------- */
 function pants(g,av){
  const L=g&&g.userData&&g.userData.l;
  if(!L)return;
  const src=av.pantsUrl||(av.pantsTex?imgOf(av.pantsTex):null);
  if(!src)return;
  const job=loadTee(src).then(im=>{
   const m=new THREE.MeshLambertMaterial({map:crop(im,'all')});
   [L.ll,L.rl].forEach(gp=>{const q=gp&&gp.children[0];if(q){q.material=m;q.material.needsUpdate=true}});
  }).catch(()=>{});
  const prev=g.userData.tw;
  g.userData.tw=Promise.all([prev,job].filter(Boolean)).catch(()=>{});
 }

 const bmp=makePlayer;
 makePlayer=function(hat,av,nm){
  const g=bmp.apply(this,arguments);
  try{av=av||{};shirt(g,av);pants(g,av)}catch(e){}
  return g;
 };

 /* ---------- the shirt designer ---------- */
 let SE=null,PE=null;
 const COMMON=()=>`<button class="pri" id="cu" style="width:100%">Choose image</button>
    <input id="cf" type="file" accept="image/*" style="display:none">
    <label>Image size: <span id="cvs"></span></label><input data-c="scale" type="range" min=".2" max="3" step=".05">
    <label>Move left / right</label><input data-c="ox" type="range" min="-1" max="1" step=".02">
    <label>Move up / down</label><input data-c="oy" type="range" min="-1" max="1" step=".02">
    <label>Text (optional)</label><input id="ct" maxlength="14">
    <label>Text color</label><input id="ctc" type="color">`;

 function editor(me,kind){
  const isP=kind=='pants';
  const S=isP?(PE&&kind=='pants'?PE:PE={kind:'pants',name:'My Pants',price:50,im:null,scale:1,ox:0,oy:0,bgOn:false,bg:'#ffffff',text:'',tc:'#ffffff',ts:48,rot:.3})
             :(SE&&kind=='shirt'?SE:SE={kind:'shirt',name:'My Shirt',price:50,col:'#2f6fed',im:null,scale:1,ox:0,oy:0,text:'',tc:'#ffffff',ts:48,rot:.3,slv:1});
  const E=$('#ed');
  if(!E)return;
  E.innerHTML=`<div class="hat">
   <div class="card"><img id="cp" alt=""><label>Rotate</label><input id="cr" type="range" min="-3.14" max="3.14" step=".05" value="${S.rot}">
    <p class="mut" style="font-size:12px">${isP
      ?'Pants are a picture worn on the legs. Everything is reviewed by Ruko before it appears in the catalog.'
      :'A shirt is clothing: pick the fabric colour, put a picture on the chest if you like, and choose the sleeves. Everything is reviewed by Ruko before it appears in the catalog.'}</p></div>
   <div class="card">
    ${isP?'':`<label>Shirt colour</label><input id="cc" type="color" value="${S.col}">
    <label>Sleeves</label><select id="csl"><option value="0" ${S.slv==0?'selected':''}>None</option><option value="1" ${S.slv==1?'selected':''}>Short</option><option value="2" ${S.slv==2?'selected':''}>Long</option></select>`}
    ${COMMON()}
    <label>Text size: <span id="cvt"></span></label><input data-c="ts" type="range" min="16" max="120" step="2">
    ${isP?`<label><input id="cb" type="checkbox" ${S.bgOn?'checked':''}> Fill the whole pair</label><input id="cbc" type="color" value="${S.bg}">`:''}
   </div></div>
   <div class="card" style="margin-top:12px"><label>Name</label><input id="cn" maxlength="20" value="${esc(S.name)}">
    <label>Price (Rukos)</label><input id="cpr" type="number" min="0" max="1000" value="${S.price}">
    <button class="pri" id="cs" style="width:100%">Submit for review</button></div>`;

  const compose=()=>{
   const c=document.createElement('canvas');
   c.width=c.height=256;
   const x=c.getContext('2d');
   if(isP){if(S.bgOn){x.fillStyle=S.bg;x.fillRect(0,0,256,256)}}
   else{x.fillStyle=S.col;x.fillRect(0,0,256,256)}
   if(S.im){const s=Math.min(256/S.im.width,256/S.im.height)*S.scale,w=S.im.width*s,h=S.im.height*s;x.drawImage(S.im,128-w/2+S.ox*128,128-h/2+S.oy*128,w,h)}
   if(S.text){x.textAlign='center';x.textBaseline='middle';x.font='bold '+S.ts+'px sans-serif';x.lineWidth=Math.max(2,S.ts/12);x.strokeStyle='#0009';x.strokeText(S.text,128,128,240);x.fillStyle=S.tc;x.fillText(S.text,128,128,240)}
   let u=c.toDataURL('image/png');
   if(u.length>170000){const d=document.createElement('canvas');d.width=d.height=256;const y=d.getContext('2d');y.fillStyle=isP?(S.bgOn?S.bg:'#ffffff'):S.col;y.fillRect(0,0,256,256);y.drawImage(c,0,0);u=d.toDataURL('image/jpeg',.85)}
   return u;
  };
  const draw=()=>{
   if(!$('#cp'))return;
   const url=(S.im||S.text)?compose():null,av={...(me.av||{})};
   const m=makePlayer(gearList(me),isP
     ?(url?{...av,pantsUrl:url}:av)
     :{...av,shirtUrl:url,shirtCol:S.col,shirtSleeves:S.slv});
   m.rotation.y=S.rot;
   shotP($('#cp'),m,[0,2,7],[0,1.2,0]);
  };
  // fill the sliders from the stored state
  E.querySelectorAll('[data-c]').forEach(i=>{i.value=S[i.dataset.c]});
  if($('#cvs'))$('#cvs').textContent=S.scale;
  if($('#cvt'))$('#cvt').textContent=S.ts;
  if($('#ct'))$('#ct').value=S.text;
  if($('#ctc'))$('#ctc').value=S.tc;
  if($('#cr'))$('#cr').value=S.rot;

  $('#cr').oninput=e=>{S.rot=+e.target.value;draw()};
  E.querySelectorAll('[data-c]').forEach(i=>i.oninput=()=>{S[i.dataset.c]=+i.value;if($('#cvs'))$('#cvs').textContent=S.scale;if($('#cvt'))$('#cvt').textContent=S.ts;draw()});
  $('#cu').onclick=()=>$('#cf').click();
  $('#cf').onchange=e=>{
   const f=e.target.files[0];
   if(!f)return;
   if(!/^image\//.test(f.type))return toast('Please choose an image.');
   const r=new FileReader();
   r.onload=()=>{const im=new Image();im.onload=()=>{S.im=im;draw()};im.onerror=()=>toast('Could not read that image.');im.src=r.result};
   r.readAsDataURL(f);
  };
  if($('#cc'))$('#cc').oninput=e=>{S.col=e.target.value;draw()};
  if($('#csl'))$('#csl').onchange=e=>{S.slv=+e.target.value;draw()};
  if($('#cb'))$('#cb').onchange=e=>{S.bgOn=e.target.checked;draw()};
  if($('#cbc'))$('#cbc').oninput=e=>{S.bg=e.target.value;draw()};
  $('#ct').oninput=e=>{S.text=e.target.value;draw()};
  $('#ctc').oninput=e=>{S.tc=e.target.value;draw()};
  $('#cn').oninput=e=>S.name=e.target.value;
  $('#cpr').oninput=e=>S.price=+e.target.value;
  $('#cs').onclick=()=>{
   const body={kind,name:S.name.trim()||(isP?'My Pants':'My Shirt'),price:Math.max(0,Math.min(1000,S.price||0)),img:compose()};
   if(isP){if(!S.im&&!S.text&&!S.bgOn)return toast('Add an image, some text or a fill colour first.')}
   else body.col=S.col,body.sleeves=S.slv;
   api('/api/shirts',body).then(r=>{
    if(!r||r.error)return toast((r&&r.error)||'Could not submit.');
    toast(r.status=='approved'?'Published!':'Submitted! Ruko will review it before it appears in the catalog.',true);
    if(isP)PE=null;else SE=null;
    loadAll().then(()=>create('mine'));
   });
  };
  draw();
 }
 shirtEd=me=>editor(me,'shirt');

 /* ---------- Creator Studio gets a Pants tab ---------- */
 const TABS=[['hat','Items'],['shirt','Shirts'],['pants','Pants'],['game','Game'],['mine','My creations']];
 const shell=t=>`<h2>Creator Studio</h2><div class="tabs">${TABS.map(([k,n])=>`<button data-t="${k}" class="${t==k?'on':''}">${n}</button>`).join('')}</div><div id="ed"></div>`;
 const wireTabs=()=>app.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>create(b.dataset.t));
 const bc=create;
 create=function(tab){
  if(tab=='pants'||tab=='shirt'){app.innerHTML=shell(tab);wireTabs();editor(cur(),tab);return}
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
 const row=(label,list,curId,attr,tip)=>`<label>${label}</label><div class="chips"><button ${attr}="" class="${!curId?'on':''}">None</button>${list.map(h=>`<button ${attr}="${h.id}" class="${curId==h.id?'on':''}">${esc(h.name)}</button>`).join('')}</div>${list.length?'':`<p class="mut" style="font-size:12px;margin:0">${tip}</p>`}`;
 const ba=avatar;
 avatar=function(){
  const r=ba.apply(this,arguments);
  try{
   const me=cur();
   if(!me)return r;
   const card=[...app.querySelectorAll('.card')].find(c=>c.querySelector('[data-tee]'));
   if(card&&!card.querySelector('[data-shirt]')){
    const av=me.av||{};
    const owned=me.owned.map(i=>hats().find(h=>h.id==i)).filter(Boolean);
    const shirts=owned.filter(h=>h.kind=='shirt'),ps=owned.filter(h=>h.kind=='pants');
    const box=document.createElement('div');
    box.innerHTML=row('Shirt',shirts,av.shirtTex,'data-shirt','Make one in Creator Studio → Shirts.')
     +row('Pants',ps,av.pantsTex,'data-pants','Make a pair in Creator Studio → Pants.');
    card.appendChild(box);
    box.querySelectorAll('[data-shirt]').forEach(b=>b.onclick=()=>{
     const m=cur(),nv={...(m.av||{})};
     if(b.dataset.shirt)nv.shirtTex=b.dataset.shirt;else delete nv.shirtTex;
     m.av=nv;saveUser(m);avatar();
    });
    box.querySelectorAll('[data-pants]').forEach(b=>b.onclick=()=>{
     const m=cur(),nv={...(m.av||{})};
     if(b.dataset.pants)nv.pantsTex=b.dataset.pants;else delete nv.pantsTex;
     m.av=nv;saveUser(m);avatar();
    });
   }
  }catch(e){}
  return r;
 };

 /* ---------- the item page wears them ---------- */
 const bh=hatPage;
 hatPage=function(id){
  const r=bh.apply(this,arguments);
  try{
   const h=hats().find(x=>x.id==id);
   const eq=$('#eq');
   if(h&&(h.kind=='pants'||h.kind=='shirt')&&eq){
    const field=h.kind=='pants'?'pantsTex':'shirtTex';
    const me=cur(),on=(me.av&&me.av[field])==id;
    eq.disabled=!!on;
    eq.textContent=on?'Equipped':'Equip';
    eq.onclick=()=>{const m=cur();m.av={...(m.av||{}),[field]:id};saveUser(m);hatPage(id)};
   }
  }catch(e){}
  return r;
 };

 window.RKCLOTH={editor,kind:k=>editor(cur(),k)};
})();
