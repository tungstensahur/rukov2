/* ---------- v39: Roblox-style shirts and pants ---------- */
/* Classic clothing works like this: the item is a picture laid out as a template, and the body
   reads it. A shirt template has the chest and the back in the middle and one arm down each side,
   so whatever is painted on an arm area is the sleeve — paint the top half and you have short
   sleeves, paint all of it for long sleeves, leave it blank and the shirt is sleeveless. A pants
   template is the same idea with one leg each side: paint the top half for shorts, the whole leg
   for full pants.

   There is no t-shirt decal (the old av.tee picture stuck on the chest) any more: shirts are worn
   as shirts, pants as pants. */
(function(){
 if(window.RKCLOTH)return;

 /* an item is a picture, so its thumbnail is the picture itself */
 const bt=thumb;
 thumb=function(h){
  try{if(h&&(h.kind=='pants'||h.kind=='shirt'))return '/api/shirt/'+h.id+'?v='+(h.tv||0)}catch(e){}
  return bt.apply(this,arguments);
 };
 thumb.c=bt.c||{}; // the old thumbnail keeps its cache on the function itself
 const imgOf=id=>{const h=hats().find(x=>x.id==id);return h?'/api/shirt/'+id+'?v='+(h.tv||0):null};

 /* ---------- the templates ---------- */
 const TW=600,TH=400;
 const REG={front:{x:150,y:0,w:300,h:200},back:{x:150,y:200,w:300,h:200},la:{x:0,y:0,w:150,h:400},ra:{x:450,y:0,w:150,h:400}};
 const PREG={lf:{x:0,y:0,w:300,h:400},rf:{x:300,y:0,w:300,h:400}};
 const tex=cv=>{const t=new THREE.CanvasTexture(cv);t.needsUpdate=true;return t};
 const cut=(im,r,base)=>{
  const cv=document.createElement('canvas');
  cv.width=Math.max(1,Math.round(r.w/2));
  cv.height=Math.max(1,Math.round(r.h/2));
  const x=cv.getContext('2d');
  // whatever the template leaves unpainted stays the body's own colour, so bare arms and legs look like skin
  x.fillStyle=base||'#ffffff';
  x.fillRect(0,0,cv.width,cv.height);
  x.drawImage(im,r.x,r.y,r.w,r.h,0,0,cv.width,cv.height);
  return tex(cv);
 };
 /* the colour along one edge of an area. A limb's top and bottom are seen from above and below,
    where classic clothing shows a flat colour (the sleeve at the shoulder, the skin at the wrist)
    rather than the picture. Anything the template left transparent falls back to the base colour. */
 const edgeColour=(im,r,base,which)=>{
  try{
   const vert=which=='left'||which=='right';
   const cv=document.createElement('canvas');
   cv.width=vert?1:Math.max(1,Math.round(r.w/4));
   cv.height=vert?Math.max(1,Math.round(r.h/4)):1;
   const x=cv.getContext('2d');
   x.fillStyle=base||'#ffffff';
   x.fillRect(0,0,cv.width,cv.height);
   const band=Math.max(1,Math.round((vert?r.w:r.h)*.06));
   const sx=which=='right'?r.x+r.w-band:r.x;
   const sy=which=='bottom'?r.y+r.h-band:r.y;
   if(vert)x.drawImage(im,sx,r.y,band,r.h,0,0,cv.width,cv.height);
   else x.drawImage(im,r.x,sy,r.w,band,0,0,cv.width,cv.height);
   const d=x.getImageData(0,0,cv.width,cv.height).data;
   let R=0,G=0,B=0;const n=d.length/4;
   for(let i=0;i<d.length;i+=4){R+=d[i];G+=d[i+1];B+=d[i+2]}
   const h=v=>Math.round(v/n).toString(16).padStart(2,'0');
   return '#'+h(R)+h(G)+h(B);
  }catch(e){return base||'#ffffff'}
 };

 /* one limb gets its area on the four sides, and a flat colour on the two ends */
 const dressLimb=(im,limb,r,base,edgeBase)=>{
  const mesh=limb&&limb.children[0];
  if(!mesh)return;
  const side=new THREE.MeshLambertMaterial({map:cut(im,r,base)});
  const M=c=>new THREE.MeshLambertMaterial({color:c});
  mesh.material=[side,side,M(edgeColour(im,r,edgeBase,'top')),M(edgeColour(im,r,edgeBase,'bottom')),side,side];
  mesh.material.forEach(m=>{m.needsUpdate=true});
 };

 /* the body reads the shirt template: chest, back, and one arm each side */
 function shirt(g,av){
  const item=av.shirtTex?hats().find(h=>h.id==av.shirtTex):null;
  const url=av.shirtUrl||(item?imgOf(item.id):null);
  if(!url)return;
  const torso=g.children[0];
  if(!torso||!torso.material)return;
  const job=loadTee(url).then(im=>{
   if(!im)return;
   const bodyCol=/^#[0-9a-f]{6}$/i.test(String(av.shirt||''))?av.shirt:'#2f6fed',skinCol=/^#[0-9a-f]{6}$/i.test(String(av.skin||''))?av.skin:'#f5cd30';
   const wide=im.width/im.height>1.3; // the template is 3:2; an older square design is 1:1
   const body=wide?REG.front:{x:0,y:0,w:im.width,h:im.height};
   const M=c=>new THREE.MeshLambertMaterial({color:c});
   const front=new THREE.MeshLambertMaterial({map:cut(im,body,bodyCol)});
   const back=new THREE.MeshLambertMaterial({map:cut(im,wide?REG.back:body,bodyCol)});
   // the sides continue the picture; the shoulders and the hem are the shirt colour, not the artwork
   torso.material=[M(edgeColour(im,body,bodyCol,'right')),M(edgeColour(im,body,bodyCol,'left')),
    M(edgeColour(im,body,bodyCol,'top')),M(edgeColour(im,body,bodyCol,'bottom')),front,back];
   torso.material.forEach(m=>{m.needsUpdate=true});
   if(wide){
    const L=g.userData&&g.userData.l;
    // looking down at the top of an arm you see the sleeve colour, and at the wrist the cuff or skin
    dressLimb(im,L&&L.la,REG.la,skinCol,skinCol);
    dressLimb(im,L&&L.ra,REG.ra,skinCol,skinCol);
   }
  }).catch(()=>{});
  const prev=g.userData.tw;
  g.userData.tw=Promise.all([prev,job].filter(Boolean)).catch(()=>{});
 }

 /* the legs read the pants template: one area each side, shorts when only the top is painted */
 function pants(g,av){
  const L=g&&g.userData&&g.userData.l;
  if(!L)return;
  const src=av.pantsUrl||(av.pantsTex?imgOf(av.pantsTex):null);
  if(!src)return;
  const job=loadTee(src).then(im=>{
   if(!im)return;
   const skinCol=/^#[0-9a-f]{6}$/i.test(String(av.skin||''))?av.skin:'#f5cd30';
   const wide=im.width/im.height>1.3; // the template is 3:2; an older square design is 1:1
   if(wide){
    dressLimb(im,L.ll,PREG.lf,skinCol,skinCol);
    dressLimb(im,L.rl,PREG.rf,skinCol,skinCol);
   }else{
    const all={x:0,y:0,w:im.width,h:im.height};
    dressLimb(im,L.ll,all,skinCol,skinCol);
    dressLimb(im,L.rl,all,skinCol,skinCol);
   }
  }).catch(()=>{});
  const prev=g.userData.tw;
  g.userData.tw=Promise.all([prev,job].filter(Boolean)).catch(()=>{});
 }

 /* there is no t-shirt decal any more: a body wears a shirt item or nothing, never a picture
    stuck on the chest. Dropping the old fields here kills the decal everywhere at once. */
 const bmp=makePlayer;
 makePlayer=function(hat,av,nm){
  const a=av&&typeof av=='object'?{...av}:{};
  delete a.tee;delete a.teeUrl;
  const g=bmp.call(this,hat,a,nm);
  try{shirt(g,a);pants(g,a)}catch(e){}
  return g;
 };

 /* ---------- the designers ---------- */
 const blank=()=>({col:'#2f6fed',im:null,scale:1,ox:0,oy:0,text:'',tc:'#ffffff',ts:40,length:'full'});
 let SE=null,PE=null;
 const panel=p=>`<label>Colour</label><input id="cc" type="color" value="${p.col}">
    <button class="pri" id="cu" style="width:100%">Choose image</button>
    <input id="cf" type="file" accept="image/*" style="display:none">
    <label>Image size: <span id="cvs">${p.scale}</span></label><input data-c="scale" type="range" min=".2" max="3" step=".05" value="${p.scale}">
    <label>Move left / right</label><input data-c="ox" type="range" min="-1" max="1" step=".02" value="${p.ox}">
    <label>Move up / down</label><input data-c="oy" type="range" min="-1" max="1" step=".02" value="${p.oy}">
    <label>Text (optional)</label><input id="ct" maxlength="14" value="${esc(p.text)}">
    <label>Text color</label><input id="ctc" type="color" value="${p.tc}">
    <label>Text size: <span id="cvt">${p.ts}</span></label><input data-c="ts" type="range" min="12" max="90" step="2" value="${p.ts}">`;

 function editor(me,kind){
  const isP=kind=='pants';
  if(isP){if(!PE)PE={kind:'pants',name:'My Pants',price:50,rot:.3,sel:'lf',same:true,lf:blank(),rf:blank()}}
  else if(!SE)SE={kind:'shirt',name:'My Shirt',price:50,rot:.3,sel:'front',same:true,
   front:blank(),back:blank(),la:blank(),ra:blank()};
  const E=$('#ed');
  if(!E)return;
  const S=isP?PE:SE;
  const other=S.same?(isP?'rf':'ra'):null;
  const curPart=()=>other&&S.sel==other?S[isP?'lf':'la']:S[S.sel];
  const tabs=()=>`<div class="chips" id="sr">${(isP
     ?[['lf',S.same?'Legs':'Left leg']].concat(S.same?[]:[['rf','Right leg']])
     :[['front','Front'],['back','Back'],['la',S.same?'Arms':'Left arm']].concat(S.same?[]:[['ra','Right arm']])
    ).map(([k,n])=>`<button data-r="${k}" class="${S.sel==k?'on':''}">${n}</button>`).join('')}</div>
    <label><input id="same" type="checkbox" ${S.same?'checked':''}> Same artwork on both ${isP?'legs':'arms'}</label>`;
  const shell=()=>`<div class="hat">
   <div class="card"><img id="cp" alt=""><label>Rotate</label><input id="cr" type="range" min="-3.14" max="3.14" step=".05" value="${S.rot}">
    <p class="mut" style="font-size:12px">${isP
      ?'Pants work like classic clothing: each leg has its own area, so a picture sits on the leg instead of being stretched over the whole body. Paint the top half only for shorts, or the whole leg for full pants.'
      :'Shirts work like classic clothing: the chest, the back and the two arms each have their own area, so whatever you paint on an arm becomes the sleeve. Leave the arms blank for a sleeveless shirt, or paint just the top half for short sleeves.'}</p></div>
   <div class="card">${tabs()}
    <div id="covwrap" style="display:${isP||S.sel=='la'||S.sel=='ra'?'':'none'}"><label>${isP?'Length':'Sleeve length'}</label><select id="cov"><option value="full" ${(isP?(S.lf||{}).length:S.la.length)!='top'?'selected':''}>${isP?'Full pants (down to the ankle)':'Whole arm (long sleeve)'}</option><option value="top" ${(isP?(S.lf||{}).length:S.la.length)=='top'?'selected':''}>${isP?'Shorts (stop above the knee)':'Top half only (short sleeve)'}</option></select></div>
    <div id="pp"></div></div></div>
   <div class="card" style="margin-top:12px"><label>Name</label><input id="cn" maxlength="20" value="${esc(S.name)}">
    <label>Price (Rukos)</label><input id="cpr" type="number" min="0" max="1000" value="${S.price}">
    <button class="pri" id="cs" style="width:100%">Submit for review</button></div>`;
  const drawPanel=()=>{
   $('#pp').innerHTML=panel(curPart());
   wire();
  };
  const compose=()=>{
   const c=document.createElement('canvas');
   c.width=TW;c.height=TH;
   const x=c.getContext('2d');
   const paint=(reg,r,len)=>{
    x.save();
    x.beginPath();
    x.rect(r.x,r.y,r.w,r.h);
    x.clip();
    // an arm or leg left bare stays transparent, so the game shows the player's own skin there
    x.clearRect(r.x,r.y,r.w,r.h);
    const topH=len&&reg.length=='top'?Math.round(r.h*.5):r.h;
    x.fillStyle=reg.col;
    x.fillRect(r.x,r.y,r.w,topH);
    if(reg.im){
     x.save();
     x.beginPath();
     x.rect(r.x,r.y,r.w,topH);
     x.clip();
     const s=Math.min(r.w/reg.im.width,r.h/reg.im.height)*reg.scale,w=reg.im.width*s,h=reg.im.height*s;
     x.drawImage(reg.im,r.x+r.w/2-w/2+reg.ox*r.w/2,r.y+r.h/2-h/2+reg.oy*r.h/2,w,h);
     x.restore();
    }
    if(reg.text){
     x.textAlign='center';
     x.textBaseline='middle';
     x.font='bold '+reg.ts+'px sans-serif';
     x.lineWidth=Math.max(2,reg.ts/12);
     x.strokeStyle='#0009';
     const cy=r.y+(len&&reg.length=='top'?topH/2:r.h/2);
     x.strokeText(reg.text,r.x+r.w/2,cy,r.w*.9);
     x.fillStyle=reg.tc;
     x.fillText(reg.text,r.x+r.w/2,cy,r.w*.9);
    }
    x.restore();
   };
   if(isP){
    paint(S.lf,PREG.lf,true);
    paint(S.same?S.lf:S.rf,PREG.rf,true);
   }else{
    paint(S.front,REG.front,false);
    paint(S.back,REG.back,false);
    paint(S.la,REG.la,true);
    paint(S.same?S.la:S.ra,REG.ra,true);
   }
   // keep it a PNG: the bare part of an arm or leg is transparency, and JPEG would turn that black
   let u=c.toDataURL('image/png');
   for(const w of [450,300]){
    if(u.length<=170000)break;
    const d=document.createElement('canvas');
    d.width=w;d.height=Math.round(w*TH/TW);
    d.getContext('2d').drawImage(c,0,0,d.width,d.height);
    u=d.toDataURL('image/png');
   }
   return u;
  };
  const draw=()=>{
   if(!$('#cp'))return;
   const url=compose();
   const av={...(me.av||{})};
   const m=isP?makePlayer(gearList(me),{...av,pantsUrl:url}):makePlayer(gearList(me),{...av,shirtUrl:url});
   m.rotation.y=S.rot;
   shotP($('#cp'),m,[0,2,7],[0,1.2,0]);
  };
  const wire=()=>{
   const p=curPart();
   $('#cc').oninput=e=>{p.col=e.target.value;draw()};
   $('#cu').onclick=()=>$('#cf').click();
   $('#cf').onchange=e=>{
    const f=e.target.files[0];
    if(!f)return;
    if(!/^image\//.test(f.type))return toast('Please choose an image.');
    const r=new FileReader();
    r.onload=()=>{const im=new Image();im.onload=()=>{p.im=im;draw()};im.onerror=()=>toast('Could not read that image.');im.src=r.result};
    r.readAsDataURL(f);
   };
   E.querySelectorAll('#pp [data-c]').forEach(i=>i.oninput=()=>{p[i.dataset.c]=+i.value;if(i.dataset.c=='scale')$('#cvs').textContent=i.value;if(i.dataset.c=='ts')$('#cvt').textContent=i.value;draw()});
   $('#ct').oninput=e=>{p.text=e.target.value;draw()};
   $('#ctc').oninput=e=>{p.tc=e.target.value;draw()};
  };
  E.innerHTML=shell();
  drawPanel();
  if($('#cr'))$('#cr').value=S.rot;
  $('#cr').oninput=e=>{S.rot=+e.target.value;draw()};
  E.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{
   S.sel=b.dataset.r;
   E.querySelectorAll('[data-r]').forEach(x=>x.classList.toggle('on',x.dataset.r==S.sel));
   const w=$('#covwrap');
   if(w)w.style.display=(isP||S.sel=='la'||S.sel=='ra')?'':'none';
   drawPanel();draw();
  });
  if($('#cov'))$('#cov').onchange=e=>{curPart().length=e.target.value;draw()};
  if($('#same'))$('#same').onchange=e=>{S.same=e.target.checked;if(S.same){S.sel=isP?'lf':'front'}E.innerHTML=shell();drawPanel();draw()};
  $('#cn').oninput=e=>S.name=e.target.value;
  $('#cpr').oninput=e=>S.price=+e.target.value;
  $('#cs').onclick=()=>{
   const body={kind,name:S.name.trim()||(isP?'My Pants':'My Shirt'),price:Math.max(0,Math.min(1000,S.price||0)),img:compose()};
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

 /* ---------- Creator Studio tabs ---------- */
 const TABS=[['hat','Items'],['shirt','Shirts'],['pants','Pants'],['game','Game'],['mine','My creations']];
 const shellTabs=t=>`<h2>Creator Studio</h2><div class="tabs">${TABS.map(([k,n])=>`<button data-t="${k}" class="${t==k?'on':''}">${n}</button>`).join('')}</div><div id="ed"></div>`;
 const wireTabs=()=>app.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>create(b.dataset.t));
 const bc=create;
 create=function(tab){
  if(tab=='pants'||tab=='shirt'){app.innerHTML=shellTabs(tab);wireTabs();editor(cur(),tab);return}
  bc(tab);
  const bar=app.querySelector('.tabs');
  if(bar){
   const sh=bar.querySelector('[data-t="shirt"]');
   if(sh)sh.textContent='Shirts';
   if(!bar.querySelector('[data-t="pants"]')){
    const b=document.createElement('button');
    b.dataset.t='pants';
    b.textContent='Pants';
    // sit next to Shirts rather than at the end of the row
    bar.insertBefore(b,sh&&sh.nextSibling||null);
   }
   wireTabs();
  }
 };

 /* ---------- the Avatar page ---------- */
 const row=(label,list,curId,attr,tip)=>`<label>${label}</label><div class="chips"><button ${attr}="" class="${!curId?'on':''}">None</button>${list.map(h=>`<button ${attr}="${h.id}" class="${curId==h.id?'on':''}">${esc(h.name)}</button>`).join('')}</div>${list.length?'':`<p class="mut" style="font-size:12px;margin:0">${tip}</p>`}`;
 /* the avatar page is rebuilt every time one of its own tabs is clicked, so this runs again after
    any change to the page rather than only once. It is idempotent: it only acts while the clothes
    card still has the old t-shirt row or is missing the shirt and pants rows. */
 const teeRow=()=>{
  const me=cur();
  if(!me)return null;
  const isTee=l=>/^t-shirt graphic$/i.test(l.textContent.trim());
  const card=[...app.querySelectorAll('.card')].find(c=>c.querySelector('[data-shirt]')||c.querySelector('[data-tee]')
   ||[...c.querySelectorAll('label')].some(isTee));
  return card?{me,card}:null;
 };
 const decorateClothes=()=>{
  const hit=teeRow();
  if(!hit)return;
  const{me,card}=hit;
  // the t-shirt graphic row from the base page is removed: shirts and pants are the clothing now
  const tl=[...card.querySelectorAll('label')].find(l=>/^t-shirt graphic$/i.test(l.textContent.trim()));
  if(tl){
   const nx=tl.nextElementSibling;
   if(nx&&nx.classList.contains('chips'))nx.remove();
   tl.remove();
  }
  if(card.querySelector('[data-shirt]'))return;
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
 };
 const ba=avatar;
 avatar=function(){
  const r=ba.apply(this,arguments);
  try{decorateClothes()}catch(e){}
  return r;
 };
 try{
  if(!window.RKAVWATCH){
   window.RKAVWATCH=1;
   let busy=null;
   new MutationObserver(()=>{
    if(busy)return;
    busy=setTimeout(()=>{
     busy=null;
     try{if(document.documentElement.dataset.page=='avatar')decorateClothes()}catch(e){}
    },40);
   }).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  }
 }catch(e){}

 /* ---------- the item page ---------- */
 const bh=hatPage;
 hatPage=function(id){
  const r=bh.apply(this,arguments);
  try{
   const h=hats().find(x=>x.id==id);
   const eq=$('#eq');
   if(h&&(h.kind=='pants'||h.kind=='shirt')){
    // the item page's "Try on" used to glue the picture on as a decal; now it wears the real item
    const img=$('#hi'),t1=$('#t1'),t2=$('#t2'),hr=$('#hr');
    if(img&&t1&&t2){
     let tried=0,rot=.4;
     const wear=()=>{
      t1.classList.toggle('on',!tried);t2.classList.toggle('on',!!tried);
      if(hr)hr.style.display=tried?'block':'none';
      if(!tried)return void(img.src=thumb(h));
      const a={...(cur().av||{})};
      a[h.kind=='pants'?'pantsUrl':'shirtUrl']=imgOf(h.id);
      const m=makePlayer(gearList(cur()),a);
      m.rotation.y=rot;
      shotP(img,m,[0,3,6.5],[0,2.1,0]);
     };
     t1.onclick=()=>{tried=0;wear()};
     t2.onclick=()=>{tried=1;wear()};
     if(hr)hr.oninput=e=>{rot=+e.target.value;wear()};
    }
   }
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

 /* this is the last file the page loads, so it also starts the files that come after it: the look
    of the site and the mobile game controls. They live apart because they have nothing to do with
    clothing, but the page only carries the overlays boot.js knows about, so one of them has to
    fetch them. */
 try{
  if(!document.getElementById('rk-theme')){
   const t=document.createElement('script');
   t.src='js/41-theme.js?v='+Date.now();
   document.body.appendChild(t);
  }
  if(!window.RKTOUCH){
   const s=document.createElement('script');
   s.src='js/40-game-touch.js?v='+Date.now();
   document.body.appendChild(s);
  }
 }catch(e){}
})();
