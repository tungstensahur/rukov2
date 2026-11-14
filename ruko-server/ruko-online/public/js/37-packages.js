/* ---------- v37: body packages ---------- */
/* A package is a set of body sizes for the player rig: head, torso, arms and legs. The Ruko account
   makes them on its own page; anyone can wear one from the Avatar page. The rig is rebuilt from the
   sizes instead of stretched, so limbs always meet the torso and the feet stay on the ground. */
(function(){
 if(window.RKPKG)return;
 const PK={list:[],byId:{}};
 let pkTried=false;
 const CLASSIC={id:'classic',name:'Classic',head:{w:.7,h:.7,d:.7},torso:{w:1.2,h:1.2,d:.6},arms:{w:.55,h:1.2,d:.55},legs:{w:.55,h:1.2,d:.55},spread:1};
 const num=(v,a,b,d)=>{const n=+v;return Math.max(a,Math.min(b,isNaN(n)?d:n))};
 const dims=p=>({
  head:{w:num(p.head&&p.head.w,.3,2,.7),h:num(p.head&&p.head.h,.3,2,.7),d:num(p.head&&p.head.d,.3,2,.7)},
  torso:{w:num(p.torso&&p.torso.w,.5,3,1.2),h:num(p.torso&&p.torso.h,.5,3,1.2),d:num(p.torso&&p.torso.d,.25,1.8,.6)},
  arms:{w:num(p.arms&&p.arms.w,.15,1.5,.55),h:num(p.arms&&p.arms.h,.3,3,1.2),d:num(p.arms&&p.arms.d,.15,1.5,.55)},
  legs:{w:num(p.legs&&p.legs.w,.15,1.5,.55),h:num(p.legs&&p.legs.h,.3,3,1.2),d:num(p.legs&&p.legs.d,.15,1.5,.55)},
  spread:num(p.spread,.5,2,1)
 });

 /* ---------- the rig ---------- */
 /* Same shapes and materials as the normal player, with the package's sizes and the parts stacked so
    they still touch: feet at the ground, legs up to the torso, arms out of the shoulders, head on top. */
 function rig(hat,av,nm,P){
  av=Object.assign({skin:'#f5cd30',shirt:'#2f6fed',pants:'#4a9c3a',face:0},av);
  const g=new THREE.Group(),Lm=c=>new THREE.MeshLambertMaterial({color:c}),sk=Lm(av.skin);
  const bx=(w,h,d,m,y,seg,r)=>{const o=new THREE.Mesh(roundBox(w,h,d,r||.14,seg||6),m);o.position.y=y;return o};
  const D=dims(P),hd=D.head,to=D.torso,ar=D.arms,lg=D.legs,S=D.spread;
  const legTop=lg.h,torsoY=legTop+to.h/2,torsoTop=legTop+to.h,headY=torsoTop+hd.h/2;
  const fm=Lm(av.shirt),bm=Lm(av.shirt),tu=av.teeUrl||(av.tee?teeURL(av.tee):null);
  g.add(bx(to.w,to.h,to.d,[Lm(av.shirt),Lm(av.shirt),Lm(av.shirt),Lm(av.shirt),fm,bm],torsoY,8,.13));
  if(tu)g.userData.tw=loadTee(tu).then(im=>{
   const cv=document.createElement('canvas');cv.width=cv.height=256;
   const x=cv.getContext('2d');x.fillStyle=av.shirt;x.fillRect(0,0,256,256);x.drawImage(im,0,0,256,256);
   const t=new THREE.CanvasTexture(cv);
   for(const m of[fm,bm]){m.map=t;m.color.set('#ffffff');m.needsUpdate=true}
  }).catch(()=>{});
  g.add(bx(hd.w,hd.h,hd.d,[sk,sk,sk,sk,new THREE.MeshLambertMaterial({map:faceTex(av.skin,av.face)}),sk],headY,8,.12));
  const limb=(x,m,top,w,h)=>{const p=new THREE.Group();p.position.set(x,top,0);p.add(bx(w,h,w,m,-h/2,6,.11));g.add(p);return p},pm=Lm(av.pants);
  const axA=(to.w/2+ar.w/2)*S,axL=(lg.w/2+.025)*S;
  g.userData.l={la:limb(-axA,sk,torsoTop,ar.w,ar.h),ra:limb(axA,sk,torsoTop,ar.w,ar.h),ll:limb(-axL,pm,legTop,lg.w,lg.h),rl:limb(axL,pm,legTop,lg.w,lg.h)};
  const dy=headY-2.75;
  (Array.isArray(hat)?hat:hat?[hat]:[]).forEach(h=>{
   const m=hatMesh(h),off=SL[h.slot]||SL.head;
   m.position.set(off[0],off[1]+(h.slot&&/^head/.test(h.slot)?dy:0),off[2]);
   g.add(m);
  });
  if(nm)setTag(g,nm);
  return g;
 }

 /* ---------- wear it everywhere ---------- */
 try{
  const base=typeof makePlayer==='function'?makePlayer:null;
  makePlayer=function(hat,av,nm){
   const P=av&&av.pkg?PK.byId[av.pkg]:null;
   if(P){try{return rig(hat,av,nm,P)}catch(e){}}
   return base?base.apply(this,arguments):new THREE.Group();
  };
 }catch(e){}

 const pull=()=>Promise.resolve().then(()=>api('/api/packages')).then(r=>{
  if(r&&Array.isArray(r.packages)){
   PK.list=r.packages;PK.byId={};
   r.packages.forEach(p=>{PK.byId[p.id]=p});
  }
  return PK.list;
 }).catch(()=>PK.list);

 const mine=()=>{const me=cur();return me&&me.av&&me.av.pkg?PK.byId[me.av.pkg]:null};

 /* ---------- Avatar page: choose a body ---------- */
 function bodyCard(){
  const me=cur(),host=document.querySelector('#app');
  if(!me||!host)return;
  const col=(host.querySelector('.hat')||{}).children;
  const side=col&&col[1]?col[1]:host;
  const old=side.querySelector('#pkcard');if(old)old.remove();
  const card=document.createElement('div');
  card.className='card';card.id='pkcard';card.style.marginTop='12px';
  const cur2=(me.av&&me.av.pkg)||'';
  card.innerHTML=`<div class="stg" style="margin-top:0">Body</div>
   <p class="mut" style="font-size:12px;margin:0 0 8px">Packages change the shape of your head, body, arms and legs.</p>
   <div class="chips">${(PK.list.length?PK.list:[CLASSIC]).map(p=>`<button data-pk="${p.id}" class="${cur2==p.id||(!cur2&&p.id=='classic')?'on':''}">${esc(p.name)}</button>`).join('')}</div>
   ${me.admin?`<button id="pkgo" style="font-size:12px;padding:4px 10px;margin-top:8px">📦 Manage packages</button>`:''}`;
  side.appendChild(card);
  if(!PK.list.length&&!pkTried){pkTried=true;pull().then(()=>{if(/^#\/avatar\b/.test(String(location.hash||'')))bodyCard()})}
  card.querySelectorAll('[data-pk]').forEach(b=>b.onclick=()=>{
   const id=b.dataset.pk,av=Object.assign({},me.av||{});
   if(id==='classic')delete av.pkg;else av.pkg=id;
   me.av=av;saveUser(me);
   try{avatar()}catch(e){}
  });
  const go=card.querySelector('#pkgo');
  if(go)go.onclick=()=>{location.hash='#/packages'};
 }
 try{
  const base=typeof avatar==='function'?avatar:null;
  avatar=function(){
   const r=base?base.apply(this,arguments):undefined;
   try{if(/^#\/avatar\b/.test(String(location.hash||'')))bodyCard()}catch(e){}
   return r;
  };
 }catch(e){}

 /* ---------- the Ruko package page ---------- */
 const PARTS=[['head','Head'],['torso','Torso'],['arms','Arms'],['legs','Legs']];
 function editor(){
  const me=cur();
  if(!me)return;
  app.innerHTML='<p class="mut">Loading packages…</p>';
  pull().then(()=>{
   let S=Object.assign({name:'New package'},JSON.parse(JSON.stringify(CLASSIC)));
   const draw=()=>{
    let img='';
    try{const m=rig([],{skin:'#f5cd30',shirt:'#2f6fed',pants:'#4a9c3a',face:0},null,Object.assign({},S));img=shot(m,[0,2.6,8],[0,1.8,0])}catch(e){}
    app.innerHTML=`<h2>Packages <span class="mut" style="font-size:13px;font-weight:400">Body shapes for the player rig</span></h2>
    <div class="hat"><div class="card"><img id="pkpv" alt="" src="${img}" style="max-width:240px"><p class="mut" style="font-size:12px">This is what the body looks like on a player.</p></div>
    <div><div class="card"><label>Package name</label><input id="pkname" maxlength="24" value="${esc(S.name)}">
    ${PARTS.map(([k,n])=>`<div class="stg">${n}</div>${['w','h','d'].map((f,i)=>`<label>${['Width','Height','Depth'][i]}</label><input data-p="${k}.${f}" type="range" min="${f=='d'?.25:.15}" max="3" step=".05" value="${S[k][f]}">`).join('')}`).join('')}
    <label>Arm and leg spacing</label><input data-p="spread" type="range" min=".5" max="2" step=".05" value="${S.spread}">
    <button class="pri" id="pksave" style="width:100%;margin-top:8px">Create package</button></div></div></div>
    <h3>All packages</h3><div class="chips">${PK.list.map(p=>`<button data-del="${p.id}">${esc(p.name)} ✕</button>`).join('')||'<span class="mut">None yet.</span>'}</div>
    <p class="mut" style="font-size:12px">Tap a package to remove it. The classic body stays.</p>`;
    $('#pkname').oninput=e=>{S.name=e.target.value};
    app.querySelectorAll('[data-p]').forEach(i=>i.oninput=()=>{
     const [k,f]=i.dataset.p.split('.');
     if(f)S[k][f]=+i.value;else S[k]=+i.value;
     try{const m=rig([],{skin:'#f5cd30',shirt:'#2f6fed',pants:'#4a9c3a',face:0},null,Object.assign({},S));$('#pkpv').src=shot(m,[0,2.6,8],[0,1.8,0])}catch(e){}
    });
    $('#pksave').onclick=async()=>{
     const r=await api('/api/packages',{action:'create',name:S.name||'Package',head:S.head,torso:S.torso,arms:S.arms,legs:S.legs,spread:S.spread});
     if(!r||!r.ok)return toast((r&&r.error)||'Could not create that package.');
     await pull();toast('📦 '+r.package.name+' created.');
     S=Object.assign({name:'New package'},JSON.parse(JSON.stringify(CLASSIC)));
     draw();
    };
    app.querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{
     const r=await api('/api/packages',{action:'delete',id:b.dataset.del});
     if(!r||!r.ok)return toast((r&&r.error)||'Could not remove that package.');
     await pull();draw();
    });
   };
   draw();
  });
 }

 try{
  const base=typeof home==='function'?home:null;
  home=function(){
   if(/^#\/packages\b/.test(String(location.hash||'')))return editor();
   if(typeof base==='function')return base.apply(this,arguments);
  };
 }catch(e){}

 /* an admin-only way in, from the top bar. Who is signed in is only known after the page has
    loaded, so this keeps looking until the Ruko account turns up. */
 const addNav=()=>{
  const me=typeof cur==='function'?cur():null;
  const nav=document.querySelector('#top nav');
  if(!me||!me.admin||!nav)return false;
  if(nav.querySelector('button[data-r="packages"]'))return true;
  const b=document.createElement('button');
  b.dataset.r='packages';
  b.innerHTML='<span class="ic">📦</span><span class="lb">Packages</span>';
  b.onclick=()=>{location.hash='#/packages';try{closeMore()}catch(e){}};
  nav.appendChild(b);
  return true;
 };
 const navTimer=setInterval(()=>{try{if(addNav())clearInterval(navTimer)}catch(e){}},700);

 /* the list is only readable once someone is signed in */
 const loadTimer=setInterval(()=>{try{if(typeof cur==='function'&&cur()){clearInterval(loadTimer);pull()}}catch(e){}},800);
 window.RKPKG={list:()=>PK.list,byId:()=>PK.byId,reload:pull,rig:rig,mine:mine};
})();
