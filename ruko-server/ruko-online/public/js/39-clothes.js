/* ---------- v39: Roblox-style shirts and pants ---------- */
/* Classic clothing works like this: the item is a picture laid out as a template, and the body
   reads it. For a shirt the template has the chest and the back in the middle and one arm down
   each side, so whatever is painted on an arm area is the sleeve — paint the top half of the arm
   area and you have short sleeves, paint all of it and you have long sleeves, leave it blank and
   the shirt is sleeveless. Pants are the same idea for the legs.

   A t-shirt graphic is still the old flat decal on the chest (av.tee); this is separate from it. */
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

 /* ---------- the shirt template ---------- */
 const TW=600,TH=400;
 const REG={front:{x:150,y:0,w:300,h:200},back:{x:150,y:200,w:300,h:200},la:{x:0,y:0,w:150,h:400},ra:{x:450,y:0,w:150,h:400}};
 const tex=cv=>{const t=new THREE.CanvasTexture(cv);t.needsUpdate=true;return t};
 const cut=(im,r,base)=>{
  const cv=document.createElement('canvas');
  cv.width=Math.max(1,Math.round(r.w/2));
  cv.height=Math.max(1,Math.round(r.h/2));
  const x=cv.getContext('2d');
  // whatever the template leaves unpainted stays the body's own colour, so bare arms look like skin
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

 /* the body reads the template: chest, back, and one arm each side */
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
    const put=(limb,reg)=>{
     const mesh=limb&&limb.children[0];
     if(!mesh)return;
     const R=REG[reg];
     const side=new THREE.MeshLambertMaterial({map:cut(im,R,skinCol)});
     // looking down at a player you see the top of the arm: that is the sleeve colour (or the
     // player's skin when the arm was left bare), never a squashed copy of the arm picture
     mesh.material=[side,side,M(edgeColour(im,R,skinCol,'top')),M(edgeColour(im,R,skinCol,'bottom')),side,side];
     mesh.material.forEach(m=>{m.needsUpdate=true});
    };
    put(L&&L.la,'la');
    put(L&&L.ra,'ra');
   }
  }).catch(()=>{});
  const prev=g.userData.tw;
  g.userData.tw=Promise.all([prev,job].filter(Boolean)).catch(()=>{});
 }

 /* ---------- the pants ---------- */
 function pants(g,av){
  const L=g&&g.userData&&g.userData.l;
  if(!L)return;
  const src=av.pantsUrl||(av.pantsTex?imgOf(av.pantsTex):null);
  if(!src)return;
  const job=loadTee(src).then(im=>{
   const cv=document.createElement('canvas');
   cv.width=cv.height=128;
   cv.getContext('2d').drawImage(im,0,0,128,128);
   const m=new THREE.MeshLambertMaterial({map:tex(cv)});
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

 /* ---------- the designers ---------- */
 const blank=()=>({col:'#2f6fed',im:null,scale:1,ox:0,oy:0,text:'',tc:'#ffffff',ts:40,cover:'full'});
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
  if(isP){if(!PE)PE={kind:'pants',name:'My Pants',price:50,bgOn:false,bg:'#ffffff',rot:.3,part:blank()}}
  else if(!SE)SE={kind:'shirt',name:'My Shirt',price:50,rot:.3,sel:'front',same:true,
   front:blank(),back:blank(),la:Object.assign(blank(),{col:'#2f6fed'}),ra:blank()};
  const E=$('#ed');
  if(!E)return;
  const S=isP?PE:SE;
  const curPart=()=>isP?S.part:(S.sel=='ra'&&S.same?S.la:S[S.sel]);
  const tabs=()=>isP?'':`<div class="chips" id="sr">${[['front','Front'],['back','Back'],['la',S.same?'Arms':'Left arm']].concat(S.same?[]:[['ra','Right arm']]).map(([k,n])=>`<button data-r="${k}" class="${S.sel==k?'on':''}">${n}</button>`).join('')}</div>
    <label><input id="same" type="checkbox" ${S.same?'checked':''}> Same artwork on both arms</label>`;
  const shell=()=>`<div class="hat">
   <div class="card"><img id="cp" alt=""><label>Rotate</label><input id="cr" type="range" min="-3.14" max="3.14" step=".05" value="${S.rot}">
    <p class="mut" style="font-size:12px">${isP
      ?'Pants are a picture worn on the legs. Everything is reviewed by Ruko before it appears in the catalog.'
      :'Shirts work like classic clothing: the chest, the back and the two arms each have their own area, so whatever you paint on an arm becomes the sleeve. Leave the arms blank for a sleeveless shirt, or paint just the top half for short sleeves.'}</p></div>
   <div class="card">${tabs()}
    <div id="covwrap" style="display:${(S.sel=='la'||S.sel=='ra')?'':'none'}"><label>Sleeve length</label><select id="cov"><option value="full" ${S.la&&S.la.cover!='top'?'selected':''}>Whole arm (long sleeve)</option><option value="top" ${S.la&&S.la.cover=='top'?'selected':''}>Top half only (short sleeve)</option></select></div>
    ${isP?`<label><input id="cb" type="checkbox" ${S.bgOn?'checked':''}> Fill the whole pair</label><input id="cbc" type="color" value="${S.bg}">`:''}
    <div id="pp"></div></div></div>
   <div class="card" style="margin-top:12px"><label>Name</label><input id="cn" maxlength="20" value="${esc(S.name)}">
    <label>Price (Rukos)</label><input id="cpr" type="number" min="0" max="1000" value="${S.price}">
    <button class="pri" id="cs" style="width:100%">Submit for review</button></div>`;
  const drawPanel=()=>{
   $('#pp').innerHTML=panel(curPart());
   wire();
  };
  const composePants=()=>{
   const p=S.part;
   const c=document.createElement('canvas');
   c.width=c.height=256;
   const x=c.getContext('2d');
   if(S.bgOn){x.fillStyle=S.bg;x.fillRect(0,0,256,256)}
   if(p.im){const s=Math.min(256/p.im.width,256/p.im.height)*p.scale,w=p.im.width*s,h=p.im.height*s;x.drawImage(p.im,128-w/2+p.ox*128,128-h/2+p.oy*128,w,h)}
   if(p.text){x.textAlign='center';x.textBaseline='middle';x.font='bold '+p.ts+'px sans-serif';x.lineWidth=Math.max(2,p.ts/12);x.strokeStyle='#0009';x.strokeText(p.text,128,128,240);x.fillStyle=p.tc;x.fillText(p.text,128,128,240)}
   let u=c.toDataURL('image/png');
   if(u.length>170000){u=c.toDataURL('image/jpeg',.85)}
   return u;
  };
  const composeShirt=()=>{
   const c=document.createElement('canvas');
   c.width=TW;c.height=TH;
   const x=c.getContext('2d');
   const paint=(reg,r,arm)=>{
    x.save();
    x.beginPath();
    x.rect(r.x,r.y,r.w,r.h);
    x.clip();
    // an arm area left bare stays transparent, so the game shows the player's own skin there
    x.clearRect(r.x,r.y,r.w,r.h);
    const topH=arm&&reg.cover=='top'?Math.round(r.h*.5):r.h;
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
     const cy=r.y+(arm&&reg.cover=='top'?topH/2:r.h/2);
     x.strokeText(reg.text,r.x+r.w/2,cy,r.w*.9);
     x.fillStyle=reg.tc;
     x.fillText(reg.text,r.x+r.w/2,cy,r.w*.9);
    }
    x.restore();
   };
   paint(S.front,REG.front,false);
   paint(S.back,REG.back,false);
   paint(S.la,REG.la,true);
   paint(S.same?S.la:S.ra,REG.ra,true);
   // keep it a PNG: the bare part of an arm is transparency, and JPEG would turn that black
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
   const url=isP?composePants():composeShirt();
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
   if($('#cb'))$('#cb').onchange=e=>{S.bgOn=e.target.checked;draw()};
   if($('#cbc'))$('#cbc').oninput=e=>{S.bg=e.target.value;draw()};
  };
  E.innerHTML=shell();
  drawPanel();
  if($('#cr'))$('#cr').value=S.rot;
  $('#cr').oninput=e=>{S.rot=+e.target.value;draw()};
  E.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{
   S.sel=b.dataset.r;
   E.querySelectorAll('[data-r]').forEach(x=>x.classList.toggle('on',x.dataset.r==S.sel));
   const w=$('#covwrap');
   if(w)w.style.display=(S.sel=='la'||S.sel=='ra')?'':'none';
   drawPanel();draw();
  });
  if($('#cov'))$('#cov').onchange=e=>{curPart().cover=e.target.value;draw()};
  if($('#same'))$('#same').onchange=e=>{S.same=e.target.checked;E.innerHTML=shell();drawPanel();draw()};
  $('#cn').oninput=e=>S.name=e.target.value;
  $('#cpr').oninput=e=>S.price=+e.target.value;
  $('#cs').onclick=()=>{
   const body={kind,name:S.name.trim()||(isP?'My Pants':'My Shirt'),price:Math.max(0,Math.min(1000,S.price||0)),img:isP?composePants():composeShirt()};
   if(isP&&!S.part.im&&!S.part.text&&!S.bgOn)return toast('Add an image, some text or a fill colour first.');
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
    bar.appendChild(b);
   }
   wireTabs();
  }
 };

 /* ---------- the Avatar page ---------- */
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

 /* ---------- the item page ---------- */
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
