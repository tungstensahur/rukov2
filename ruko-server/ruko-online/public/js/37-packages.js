/* ---------- v37: body packages ---------- */
/* A package is a body for the player rig. It carries sizes for the head, torso, arms and legs, and,
   for any part it wants, a list of mesh pieces built from the same shapes the accessory editor uses.
   The Ruko account builds them on the Packages page; anyone can wear one from the Avatar page.
   Pieces paint themselves with @skin, @shirt or @pants so a package still follows the wearer's
   colours; a part with no pieces keeps its normal box. */
(function(){
 if(window.RKPKG)return;
 const PK={list:[],byId:{}};
 let pkTried=false;
 const SLOTS=[['head','Head'],['torso','Torso'],['arms','Arms'],['legs','Legs']];
 const SHAPES=['box','sphere','dome','cylinder','cone','pyramid','prism','octa','ico','torus'];
 const FINISH=['matte','shiny','metal','glass','neon'];
 const COLOURS=[['@skin','Skin'],['@shirt','Shirt'],['@pants','Pants']];
 const CLASSIC={id:'classic',name:'Classic',head:{w:.7,h:.7,d:.7},torso:{w:1.2,h:1.2,d:.6},arms:{w:.55,h:1.2,d:.55},legs:{w:.55,h:1.2,d:.55},spread:1,mesh:null};
 const num=(v,a,b,d)=>{const n=+v;return Math.max(a,Math.min(b,isNaN(n)?d:n))};
 const dims=p=>({
  head:{w:num(p.head&&p.head.w,.3,2,.7),h:num(p.head&&p.head.h,.3,2,.7),d:num(p.head&&p.head.d,.3,2,.7)},
  torso:{w:num(p.torso&&p.torso.w,.5,3,1.2),h:num(p.torso&&p.torso.h,.5,3,1.2),d:num(p.torso&&p.torso.d,.25,1.8,.6)},
  arms:{w:num(p.arms&&p.arms.w,.15,1.5,.55),h:num(p.arms&&p.arms.h,.3,3,1.2),d:num(p.arms&&p.arms.d,.15,1.5,.55)},
  legs:{w:num(p.legs&&p.legs.w,.15,1.5,.55),h:num(p.legs&&p.legs.h,.3,3,1.2),d:num(p.legs&&p.legs.d,.15,1.5,.55)},
  spread:num(p.spread,.5,2,1)
 });
 const pieces=(P,k)=>P&&P.mesh&&Array.isArray(P.mesh[k])?P.mesh[k]:[];

 /* ---------- pieces ---------- */
 /* One piece is one shape. A box keeps its square corners unless rnd is raised, which rounds
    them like the classic body does; the other shapes are already round. */
 const pieceMat=p=>{
  const c=p.c;
  if(p.f=='neon')return new THREE.MeshBasicMaterial({color:c});
  if(p.f=='shiny')return new THREE.MeshPhongMaterial({color:c,shininess:110,specular:0x888888});
  if(p.f=='metal')return new THREE.MeshPhongMaterial({color:c,shininess:220,specular:0xffffff});
  if(p.f=='glass')return new THREE.MeshPhongMaterial({color:c,shininess:120,transparent:true,opacity:.45});
  return new THREE.MeshLambertMaterial({color:c});
 };
 /* tex lets a piece carry the face or the t-shirt instead of a flat colour, so a custom head or
    torso still looks like the person wearing it. */
 function pieceMesh(pc,T){
  const p=pc||{},g=new THREE.Group(),tx=T||{};
  const rnd=Math.max(0,Math.min(1,+p.rnd||0)),sx=+p.sx||1,sy=+p.sy||1,sz=+p.sz||1;
  const mk=(x,s)=>{
   const round=p.t=='box'&&rnd>0;
   const geo=round?roundBox(sx,sy,sz,rnd*Math.min(sx,sy,sz)/2,8):(GEO[p.t]||GEO.box)();
   const plain=pieceMat(p),fc=p.tex=='face'&&tx.face?tx.face:null,te=p.tex=='tee'&&tx.tee?tx.tee:null;
   let mt=plain;
   if(fc||te)mt=geo.groups&&geo.groups.length===6?[plain,plain,plain,plain,fc||te,te||plain]:(fc||te);
   const m=new THREE.Mesh(geo,mt);
   if(!round)m.scale.set(sx,sy,sz);
   m.position.set(x,+p.y||0,+p.z||0);
   m.rotation.order='YXZ';
   m.rotation.x=(+p.q||0)*Math.PI/180;
   m.rotation.z=s*(+p.r||0)*Math.PI/180;
   m.rotation.y=s*(+p.ry||0)*Math.PI/180;
   g.add(m);
  };
  mk(+p.x||0,1);
  if(p.m&&p.x)mk(-(+p.x),-1);
  return g;
 }

 /* ---------- the rig ---------- */
 /* Sizes stack the parts so they touch: feet on the ground, legs to the torso, arms at the
    shoulders, head on top. A part with pieces gets those pieces at that same spot instead of a box. */
 function rig(hat,av,nm,P){
  av=Object.assign({skin:'#f5cd30',shirt:'#2f6fed',pants:'#4a9c3a',face:0},av);
  const g=new THREE.Group(),Lm=c=>new THREE.MeshLambertMaterial({color:c}),sk=Lm(av.skin);
  const bx=(w,h,d,m,y,seg,r)=>{const o=new THREE.Mesh(roundBox(w,h,d,r||.14,seg||6),m);o.position.y=y;return o};
  const D=dims(P),hd=D.head,to=D.torso,ar=D.arms,lg=D.legs,S=D.spread;
  const legTop=lg.h,torsoY=legTop+to.h/2,torsoTop=legTop+to.h,headY=torsoTop+hd.h/2;
  const fm=Lm(av.shirt),bm=Lm(av.shirt),tu=av.teeUrl||(av.tee?teeURL(av.tee):null);
  const wear=(spec)=>{ // @skin / @shirt / @pants follow the wearer
   const out=Object.assign({},spec),c=out.c;
   if(c=='@skin')out.c=av.skin;else if(c=='@shirt')out.c=av.shirt;else if(c=='@pants')out.c=av.pants;
   return out;
  };
  const teeMat=()=>{
   const m=new THREE.MeshLambertMaterial({color:av.shirt});
   if(tu)loadTee(tu).then(im=>{
    const cv=document.createElement('canvas');cv.width=cv.height=256;
    const x=cv.getContext('2d');x.fillStyle=av.shirt;x.fillRect(0,0,256,256);x.drawImage(im,0,0,256,256);
    m.map=new THREE.CanvasTexture(cv);m.color.set('#ffffff');m.needsUpdate=true;
   }).catch(()=>{});
   return m;
  };
  const TX={face:new THREE.MeshLambertMaterial({map:faceTex(av.skin,av.face)}),tee:teeMat()};
  const art=(list)=>{const q=new THREE.Group();(list||[]).forEach(pc=>{try{q.add(pieceMesh(wear(pc),TX))}catch(e){}});return q};

  let hp=pieces(P,'head'),tp=pieces(P,'torso');
  const ap=pieces(P,'arms'),lp=pieces(P,'legs');
  // packages built before pieces could show a face or a t-shirt keep looking like the person wearing them
  if(hp.length&&!hp.some(x=>x.tex))hp=[Object.assign({},hp[0],{tex:'face'})].concat(hp.slice(1));
  if(tp.length&&!tp.some(x=>x.tex))tp=[Object.assign({},tp[0],{tex:'tee'})].concat(tp.slice(1));
  if(tp.length){const m=art(tp);m.position.set(0,torsoY,0);g.add(m)}
  else{
   g.add(bx(to.w,to.h,to.d,[Lm(av.shirt),Lm(av.shirt),Lm(av.shirt),Lm(av.shirt),fm,bm],torsoY,8,.13));
   if(tu)g.userData.tw=loadTee(tu).then(im=>{
    const cv=document.createElement('canvas');cv.width=cv.height=256;
    const x=cv.getContext('2d');x.fillStyle=av.shirt;x.fillRect(0,0,256,256);x.drawImage(im,0,0,256,256);
    const t=new THREE.CanvasTexture(cv);
    for(const m of[fm,bm]){m.map=t;m.color.set('#ffffff');m.needsUpdate=true}
   }).catch(()=>{});
  }
  if(hp.length){const m=art(hp);m.position.set(0,headY,0);g.add(m)}
  else g.add(bx(hd.w,hd.h,hd.d,[sk,sk,sk,sk,new THREE.MeshLambertMaterial({map:faceTex(av.skin,av.face)}),sk],headY,8,.12));

  const limb=(x,top,build)=>{const p=new THREE.Group();p.position.set(x,top,0);build(p);g.add(p);return p};
  const axA=(to.w/2+ar.w/2)*S,axL=(lg.w/2+.025)*S,pm=Lm(av.pants);
  const armBody=list=>p=>{
   const m=art(list);m.position.y=-ar.h/2;p.add(m);
  };
  const legBody=list=>p=>{
   const m=art(list);m.position.y=-lg.h/2;p.add(m);
  };
  const oneArm=list=>p=>{if(list.length)armBody(list)(p);else p.add(bx(ar.w,ar.h,ar.w,sk,-ar.h/2,6,.11))};
  const oneLeg=list=>p=>{if(list.length)legBody(list)(p);else p.add(bx(lg.w,lg.h,lg.w,pm,-lg.h/2,6,.11))};
  const flip=p=>{p.scale.x=-1;return p};
  g.userData.l={
   la:flip(limb(-axA,torsoTop,oneArm(ap))),ra:limb(axA,torsoTop,oneArm(ap)),
   ll:flip(limb(-axL,legTop,oneLeg(lp))),rl:limb(axL,legTop,oneLeg(lp))
  };
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

 let loaded=false;
 const redraw=()=>{ // the first render can happen before the package list arrives
  const h=String(location.hash||'');
  try{
   if(/^#\/avatar\b/.test(h)){avatar()}
   else if(!/^#\//.test(h)||/^#\/(home)?$/.test(h)){if(typeof home==='function')home()}
  }catch(e){}
 };
 const pull=()=>Promise.resolve().then(()=>api('/api/packages')).then(r=>{
  if(r&&Array.isArray(r.packages)){
   PK.list=r.packages;PK.byId={};
   r.packages.forEach(p=>{PK.byId[p.id]=p});
   if(!loaded){loaded=true;redraw()}
  }
  return PK.list;
 }).catch(()=>PK.list);

 const SAMPLE={skin:'#f5cd30',shirt:'#2f6fed',pants:'#4a9c3a',face:0};

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
   <p class="mut" style="font-size:12px;margin:0 0 8px">Packages can change the shape of your head, body, arms and legs.</p>
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
 const fresh=()=>({t:'box',c:'@skin',f:'matte',sx:.5,sy:.5,sz:.5,x:0,y:0,z:0,r:0,q:0,ry:0,rnd:0,tex:'none',m:0});
 const seed=(S,k)=>{
  const D=dims(S),p=fresh();
  if(k=='head')Object.assign(p,{t:'sphere',sx:D.head.w,sy:D.head.h,sz:D.head.d,tex:'face'});
  else if(k=='torso')Object.assign(p,{sx:D.torso.w,sy:D.torso.h,sz:D.torso.d,rnd:.25,tex:'tee'});
  else if(k=='arms')Object.assign(p,{c:'@skin',sx:D.arms.w,sy:D.arms.h,sz:D.arms.w,y:-D.arms.h/2});
  else Object.assign(p,{c:'@pants',sx:D.legs.w,sy:D.legs.h,sz:D.legs.w,y:-D.legs.h/2});
  S.mesh[k]=[p];S.sel=0;
 };
 const FIELDS=[['sx','Width',.05,3,.05],['sy','Height',.05,3,.05],['sz','Depth',.05,3,.05],['x','Move X',-1.6,1.6,.05],['y','Move Y',-2,2,.05],['z','Move Z',-1.6,1.6,.05],['r','Tilt side',-180,180,5],['q','Tilt front',-180,180,5],['ry','Spin',-180,180,5]];

 function editor(){
  const me=cur();
  if(!me)return;
  app.innerHTML='<p class="mut">Loading packages…</p>';
  pull().then(()=>{
   let S=Object.assign({slot:'head',sel:0,rot:.4},JSON.parse(JSON.stringify(CLASSIC)));
   S.name='New package';S.mesh={head:[],torso:[],arms:[],legs:[]};
   const draw=()=>{
    const slot=S.slot,list=S.mesh[slot],p=list[Math.min(S.sel,list.length-1)];
    const sl=(k,n,a,b,st,v)=>`<label>${n}</label><input data-p="${k}" type="range" min="${a}" max="${b}" step="${st}" value="${v}">`;
    app.innerHTML=`<style>#pkw .pw{display:grid;gap:12px}@media(min-width:900px){#pkw .pw{grid-template-columns:minmax(250px,340px) 1fr;align-items:start}#pkw .pw>*{min-width:0}#pkw .ps{position:sticky;top:10px}#pkw .ps .card{padding:10px}#pkw #pkpv{max-height:54vh;object-fit:contain}}</style>
    <h2>Packages <span class="mut" style="font-size:13px;font-weight:400">Custom bodies for the player rig</span></h2>
    <div id="pkw"><div class="pw">
    <div class="ps"><div class="card"><img id="pkpv" alt="" style="width:100%;display:block;border-radius:10px;cursor:grab;touch-action:none">
      <label>Turn the player</label><input id="pkrot" type="range" min="-3.14" max="3.14" step="0.05" value="${S.rot}">
      <p class="mut" style="font-size:12px;margin:0">Drag the picture to turn it. The preview stays put while you scroll.</p></div></div>
    <div class="pc">
     <div class="card"><label>Package name</label><input id="pkname" maxlength="24" value="${esc(S.name)}">
      ${SLOTS.map(([k,n])=>`<div class="stg">${n}</div>${['w','h','d'].map((f,i)=>sl(k+'.'+f,['Width','Height','Depth'][i],f=='d'?.25:.15,3,.05,S[k][f])).join('')}`).join('')}
      ${sl('spread','Arm and leg spacing',.5,2,.05,S.spread)}
      <button class="pri" id="pksave" style="width:100%;margin-top:8px">Create package</button></div>
     <div class="card" style="margin-top:12px"><div class="stg" style="margin-top:0">Custom pieces</div>
      <div class="chips">${SLOTS.map(([k,n])=>`<button data-mk="${k}" class="${slot==k?'on':''}">${n}${S.mesh[k].length?' ('+S.mesh[k].length+')':''}</button>`).join('')}</div>
      ${list.length?`
       <div class="chips">${list.map((q,i)=>`<button data-ms="${i}" class="${i==S.sel?'on':''}">${i+1}. ${q.t}</button>`).join('')}</div>
       <div class="chips"><button id="madd">+ Add piece</button><button id="mdup">Duplicate</button><button id="mdel">Delete</button><button id="mclr">Back to normal ${slot}</button></div>
       <label>Shape</label><select id="mshape">${SHAPES.map(k=>`<option ${k==p.t?'selected':''}>${k}</option>`).join('')}</select>
       <label>Colour</label><select id="mcol">${COLOURS.map(([v,n])=>`<option value="${v}" ${p.c==v?'selected':''}>${n} (follows the wearer)</option>`).join('')}<option value="custom" ${COLOURS.some(c=>c[0]==p.c)?'':'selected'}>Custom colour</option></select>
       <input id="mcc" type="color" value="${/^#/.test(p.c)?p.c:'#f5cd30'}">
       <label>Finish</label><select id="mfin">${FINISH.map(k=>`<option ${k==p.f?'selected':''}>${k}</option>`).join('')}</select>
       <label>Shows</label><select id="mtex"><option value="none" ${!p.tex||p.tex=='none'?'selected':''}>Just its colour</option><option value="face" ${p.tex=='face'?'selected':''}>The face</option><option value="tee" ${p.tex=='tee'?'selected':''}>The t-shirt</option></select>
       ${p.t=='box'?`<label>Round the corners</label><input data-p="pc.rnd" type="range" min="0" max="1" step="0.02" value="${p.rnd||0}"><p class="mut" style="font-size:12px;margin:0">0 keeps a square box, 1 rounds it as far as it goes.</p>`:''}
       ${FIELDS.map(([k,n,a,b,st])=>sl('pc.'+k,n,a,b,st,p[k])).join('')}
       <label><input id="mmir" type="checkbox" ${p.m?'checked':''}> Mirror to the other side</label>
       <p class="mut" style="font-size:12px">${slot=='arms'||slot=='legs'?'One limb is built and copied to the other side.':'A custom '+slot+' replaces the normal one. Put the face or the t-shirt on a piece to keep them.'}</p>`
      :`<p class="mut" style="font-size:12px">The ${slot} uses its normal shape. Add a piece to build it from shapes instead.</p>
        <button id="madd">+ Add piece</button>`}
     </div>
    <h3>All packages</h3><div class="chips">${PK.list.map(x=>`<button data-del="${x.id}">${esc(x.name)} ✕</button>`).join('')||'<span class="mut">None yet.</span>'}</div>
    <p class="mut" style="font-size:12px">Tap a package to remove it. The classic body stays.</p>
    </div></div></div>`;
    const cam=()=>[Math.sin(S.rot)*9,2.8,Math.cos(S.rot)*9];
    const repaint=()=>{try{$('#pkpv').src=shot(rig([],SAMPLE,null,Object.assign({},S)),cam(),[0,1.9,0])}catch(e){}};
    const rt=$('#pkrot'),pvEl=$('#pkpv');
    if(rt)rt.oninput=e=>{S.rot=+e.target.value;repaint()};
    if(pvEl){
     let drag=null;
     pvEl.onpointerdown=e=>{drag={x:e.clientX,r:S.rot};try{pvEl.setPointerCapture(e.pointerId)}catch(_){};pvEl.style.cursor='grabbing'};
     pvEl.onpointermove=e=>{if(!drag)return;S.rot=Math.max(-3.14,Math.min(3.14,drag.r-(e.clientX-drag.x)*.012));if(rt)rt.value=S.rot;repaint()};
     pvEl.onpointerup=pvEl.onpointercancel=()=>{drag=null;pvEl.style.cursor='grab'};
    }
    $('#pkname').oninput=e=>{S.name=e.target.value};
    app.querySelectorAll('[data-p]').forEach(i=>i.oninput=()=>{
     const q=i.dataset.p;
     if(q.indexOf('pc.')==0){if(p)p[q.slice(3)]=+i.value}
     else if(q.indexOf('.')>0){const[k,f]=q.split('.');if(S[k])S[k][f]=+i.value}
     else S[q]=+i.value;
     repaint();
    });
    app.querySelectorAll('[data-mk]').forEach(b=>b.onclick=()=>{S.slot=b.dataset.mk;S.sel=0;draw()});
    app.querySelectorAll('[data-ms]').forEach(b=>b.onclick=()=>{S.sel=+b.dataset.ms;draw()});
    const A=app.querySelector('#madd');
    if(A)A.onclick=()=>{
     if(!list.length){seed(S,slot);draw();return}
     if(list.length>=16)return;
     list.push(fresh());S.sel=list.length-1;draw();
    };
    const Dp=app.querySelector('#mdup');if(Dp)Dp.onclick=()=>{if(p){list.push(JSON.parse(JSON.stringify(p)));S.sel=list.length-1;draw()}};
    const Dl=app.querySelector('#mdel');if(Dl)Dl.onclick=()=>{list.splice(S.sel,1);S.sel=0;draw()};
    const Cl=app.querySelector('#mclr');if(Cl)Cl.onclick=()=>{S.mesh[slot]=[];S.sel=0;draw()};
    if(p){
     $('#mshape').onchange=e=>{p.t=e.target.value;draw()};
     $('#mcol').onchange=e=>{p.c=e.target.value=='custom'?($('#mcc').value||'#f5cd30'):e.target.value;draw()};
     $('#mcc').oninput=e=>{if(!COLOURS.some(c=>c[0]==p.c)){p.c=e.target.value;repaint()}};
     $('#mfin').onchange=e=>{p.f=e.target.value;repaint()};
     $('#mtex').onchange=e=>{p.tex=e.target.value;repaint()};
     $('#mmir').onchange=e=>{p.m=e.target.checked?1:0;repaint()};
    }
    $('#pksave').onclick=async()=>{
     const r=await api('/api/packages',{action:'create',name:S.name||'Package',head:S.head,torso:S.torso,arms:S.arms,legs:S.legs,spread:S.spread,mesh:S.mesh});
     if(!r||!r.ok)return toast((r&&r.error)||'Could not create that package.');
     await pull();toast('📦 '+r.package.name+' created.');
     S=Object.assign({slot:'head',sel:0,rot:.4},JSON.parse(JSON.stringify(CLASSIC)));
     S.name='New package';S.mesh={head:[],torso:[],arms:[],legs:[]};
     draw();
    };
    app.querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{
     const r=await api('/api/packages',{action:'delete',id:b.dataset.del});
     if(!r||!r.ok)return toast((r&&r.error)||'Could not remove that package.');
     await pull();draw();
    });
    repaint();
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
  // on a narrow window one more button would push the top bar past the screen edge,
  // so the entry hides there and the More menu (built from these buttons) carries it instead
  const doc=document.documentElement;
  if(doc.scrollWidth>doc.clientWidth+2)b.style.display='none';
  try{buildMoreSheet(me)}catch(e){}
  return true;
 };
 const navTimer=setInterval(()=>{try{if(addNav())clearInterval(navTimer)}catch(e){}},700);
 const loadTimer=setInterval(()=>{try{if(typeof cur==='function'&&cur()){clearInterval(loadTimer);pull()}}catch(e){}},800);
 window.RKPKG={list:()=>PK.list,byId:()=>PK.byId,reload:pull,rig:rig};
})();
