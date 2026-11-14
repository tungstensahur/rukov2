/* ---------- v24: 34 more blocks, pictures, sound and on-screen UI ---------- */
/* Blocks are data; this file gives the editor their wording and gives the game their behaviour.
   Everything here is guarded: if a block is missing, the rest of the game still runs. */
(function(){
 if(window.RKBLOCKS24)return;
 window.RKBLOCKS24=1;

 /* ---------- new palette groups ---------- */
 try{
  [['world','World','#22b8cf'],['hud','On screen','#f06595'],['assets','Pictures and sound','#7c5cff'],['enemies','Enemies and AI','#e8590c']]
   .forEach(c=>{if(!CATS.some(x=>x[0]===c[0]))CATS.push(c)});
 }catch(e){}

 /* ---------- new blocks ---------- */
 const blocks={
  /* world */
  fogCol:{c:'world',ic:'🌫',n:'Set the fog color',f:[['t','Set fog color to '],['cc','col']],d:{cc:'#8fd3ff'}},
  bright:{c:'world',ic:'💡',n:'Set world brightness',f:[['t','Set world brightness to '],['p','num',{min:0,max:300,step:10}],['t','%']],d:{p:100}},
  rain:{c:'world',ic:'🌧',n:'Make it rain',f:[['t','Make it rain']],d:{}},
  snow:{c:'world',ic:'❄️',n:'Make it snow',f:[['t','Make it snow']],d:{}},
  weatherOff:{c:'world',ic:'☀️',n:'Clear the weather',f:[['t','Clear the weather']],d:{}},
  /* on screen */
  hudText:{c:'hud',ic:'🖊',n:'Show text on screen',f:[['t','Show '],['m','text',{ph:'Objective: find 3 coins'}],['t',' on screen']],d:{m:'Hello!'}},
  hudClear:{c:'hud',ic:'🧽',n:'Clear the on-screen text',f:[['t','Clear the on-screen text']],d:{}},
  hudValue:{c:'hud',ic:'🔢',n:'Show a number on screen',f:[['t','Show '],['v','sel',{o:VALS}],['t',' on screen as '],['m','text',{ph:'Score'}],['t','']],d:{v:'score',m:'Score'}},
  flash:{c:'hud',ic:'⚡',n:'Flash the screen',f:[['t','Flash the screen '],['cc','col'],['t',' for '],['s','num',{min:.1,max:3,step:.1}],['t',' sec']],d:{cc:'#ffffff',s:.4}},
  bar:{c:'hud',ic:'📊',n:'Show a progress bar',f:[['t','Show a bar at '],['p','num',{min:0,max:100,step:5}],['t','% '],['cc','col']],d:{p:50,cc:'#5b4bff'}},
  vibrate:{c:'hud',ic:'📳',n:'Vibrate the phone',f:[['t','Vibrate the phone for '],['s','num',{min:.1,max:3,step:.1}],['t',' sec']],d:{s:.3}},
  /* pictures and sound */
  picture:{c:'assets',ic:'🖼',n:'Show a picture',f:[['t','Show picture '],['a','asset',{kind:'img'}],['t',' at '],['p','num',{min:10,max:100,step:5}],['t','% width']],d:{a:'',p:60}},
  pictureHide:{c:'assets',ic:'🫥',n:'Hide all pictures',f:[['t','Hide all pictures']],d:{}},
  texture:{c:'assets',ic:'🎴',n:'Put a picture on an object',f:[['t','Put picture '],['a','asset',{kind:'img'}],['t',' on '],['o','obj']],d:{a:'',o:''}},
  playsound:{c:'assets',ic:'🔉',n:'Play an uploaded sound',f:[['t','Play sound '],['a','asset',{kind:'snd'}]],d:{a:''}},
  music:{c:'assets',ic:'🎵',n:'Play music in a loop',f:[['t','Play music '],['a','asset',{kind:'snd'}],['t',' on a loop']],d:{a:''}},
  musicStop:{c:'assets',ic:'⏹',n:'Stop the music',f:[['t','Stop the music']],d:{}},
  volume:{c:'assets',ic:'🔊',n:'Set the sound volume',f:[['t','Set volume to '],['p','num',{min:0,max:100,step:10}],['t','%']],d:{p:80}},
  /* enemies and movement helpers */
  chase:{c:'enemies',ic:'👹',n:'Make an object chase the player',f:[['t','Make '],['o','obj'],['t',' chase the player at '],['n','num',{min:.5,max:30,step:.5}],['t',' speed']],d:{o:'',n:6}},
  flee:{c:'enemies',ic:'🏃',n:'Make an object run away',f:[['t','Make '],['o','obj'],['t',' run from the player at '],['n','num',{min:.5,max:30,step:.5}],['t',' speed']],d:{o:'',n:6}},
  orbit:{c:'enemies',ic:'🪐',n:'Make an object circle the player',f:[['t','Make '],['o','obj'],['t',' circle the player at '],['n','num',{min:.5,max:30,step:.5}],['t',' speed']],d:{o:'',n:4}},
  follow:{c:'enemies',ic:'🐕',n:'Make an object follow the player',f:[['t','Make '],['o','obj'],['t',' follow the player, stopping '],['n','num',{min:1,max:30,step:1}],['t',' away']],d:{o:'',n:4}},
  bounce:{c:'enemies',ic:'🏀',n:'Make an object bounce up and down',f:[['t','Make '],['o','obj'],['t',' bounce at '],['n','num',{min:.2,max:10,step:.2}],['t',' speed']],d:{o:'',n:2}},
  patrol:{c:'enemies',ic:'🚶',n:'Make an object pace back and forth',f:[['t','Make '],['o','obj'],['t',' pace '],['n','num',{min:1,max:60,step:1}],['t',' studs across at '],['x','num',{min:.2,max:10,step:.2}],['t',' speed']],d:{o:'',n:6,x:2}},
  damageNear:{c:'enemies',ic:'💢',n:'Damage the player near an object',f:[['t','Damage the player '],['n','num',{min:1,max:500,step:5}],['t',' HP when within '],['x','num',{min:1,max:40,step:1}],['t',' of '],['o','obj']],d:{n:20,o:'',x:3}},
  pushAway:{c:'enemies',ic:'💨',n:'Push the player away',f:[['t','Push the player away from '],['o','obj'],['t',' with power '],['n','num',{min:1,max:60,step:1}]],d:{o:'',n:12}},
  /* objects */
  despawn:{c:'objects',ic:'💥',n:'Remove an object',f:[['t','Remove '],['o','obj'],['t',' from the game']],d:{o:''}},
  resetPos:{c:'objects',ic:'🔙',n:'Put an object back where it started',f:[['t','Put '],['o','obj'],['t',' back where it started']],d:{o:''}},
  opacity:{c:'objects',ic:'🫧',n:'Set how see-through an object is',f:[['t','Make '],['o','obj'],['t',' '],['p','num',{min:0,max:100,step:10}],['t','% solid']],d:{o:'',p:100}},
  nameTag:{c:'objects',ic:'🏷',n:'Show a label above an object',f:[['t','Show '],['m','text',{ph:'Boss'}],['t',' above '],['o','obj']],d:{m:'Boss',o:''}},
  labelHide:{c:'objects',ic:'🧷',n:'Remove a label',f:[['t','Remove the label from '],['o','obj']],d:{o:''}},
  spawnCoin:{c:'objects',ic:'🪙',n:'Drop a coin from an object',f:[['t','Drop a coin at '],['o','obj'],['t',' offset x'],['x','num',NUM],['t',' y'],['y','num',NUM],['t',' z'],['z','num',NUM]],d:{o:'',x:0,y:0,z:0}},
  slowPlayer:{c:'player',ic:'🐌',n:'Slow the player down',f:[['t','Slow the player to '],['p','num',{min:10,max:100,step:10}],['t','% speed for '],['s','num',{min:.2,max:20,step:.5}],['t',' sec']],d:{p:40,s:2}},
  jumpBoost:{c:'player',ic:'💫',n:'Give the player a bigger jump',f:[['t','Give the player '],['p','num',{min:100,max:400,step:25}],['t','% jump power for '],['s','num',{min:.2,max:20,step:.5}],['t',' sec']],d:{p:200,s:3}}
 };
 try{Object.assign(BLK,blocks)}catch(e){}

 /* ---------- on-screen helpers ---------- */
 const gameEl=()=>document.getElementById('game');
 function ensure(id,parent){let el=document.getElementById(id);if(!el){const g=gameEl();if(!g)return null;el=document.createElement('div');el.id=id;g.appendChild(el)}return el}
 function styleOnce(){
  if(document.getElementById('rk24-style'))return;
  const st=document.createElement('style');st.id='rk24-style';
  st.textContent=[
   '#rk24hud{position:absolute;top:calc(56px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);max-width:80vw;text-align:center;color:#fff;font-weight:800;font-size:16px;text-shadow:0 2px 6px #000;pointer-events:none;z-index:6;white-space:pre-wrap}',
   '#rk24hud b{color:#ffd23f}',
   '#rk24bar{position:absolute;top:calc(92px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);width:min(300px,60vw);height:12px;background:#0009;border-radius:99px;overflow:hidden;display:none;z-index:6;pointer-events:none}',
   '#rk24bar i{display:block;height:100%;width:50%;background:#5b4bff;border-radius:99px;transition:width .25s}',
   '#rk24pic{position:absolute;left:50%;bottom:12%;transform:translateX(-50%);max-width:92vw;max-height:60vh;background-size:contain;background-repeat:no-repeat;background-position:center;display:none;z-index:5;pointer-events:none;filter:drop-shadow(0 8px 20px #0008)}',
   '#rk24flash{position:absolute;inset:0;opacity:0;pointer-events:none;z-index:7;transition:opacity .2s}',
   '#rk24tag{position:absolute;color:#fff;background:#0008;border-radius:7px;padding:2px 7px;font-size:12px;font-weight:700;white-space:nowrap;pointer-events:none;display:none;z-index:4}'
  ].join('\n');
  document.head.appendChild(st);
 }
 function hud(){styleOnce();return ensure('rk24hud')}
 function assetUrl(a){
  const gid=(window.RKPLAY&&window.RKPLAY.id)||'';
  return (a&&gid)?('/api/asset/'+encodeURIComponent(gid)+'/'+encodeURIComponent(a)):'';
 }
 function playOnce(url,vol){
  if(!url)return;
  try{const au=new Audio(url);au.volume=Math.max(0,Math.min(1,vol==null?.8:vol));const p=au.play();if(p&&p.catch)p.catch(()=>{});return au}catch(e){return null}
 }
 let music=null,vol=.8;
 function stopMusic(){try{if(music){music.pause();music=null}}catch(e){}}

 /* ---------- object behaviour registry ---------- */
 const BEH=new Map(),ORIG=new Map(),TAGS=new Map();
 const sceneKey=X=>(X&&X.S&&X.S.uuid)||'';
 let lastScene='';
 function ePos(X,e){try{return X.entPos(e)}catch(_){return {x:0,y:0,z:0}}}
 function remember(X){
  const k=sceneKey(X);
  if(k!==lastScene){lastScene=k;BEH.clear();ORIG.clear();TAGS.clear();stopMusic();try{if(music===null){const p=document.getElementById('rk24pic');if(p)p.style.display='none'}}catch(e){}}
  if(!X||!X.ent)return;
  for(const u in X.ent){if(!ORIG.has(u)){const c=ePos(X,X.ent[u]);ORIG.set(u,{x:c.x,y:c.y,z:c.z})}}
 }
 function setBehaviour(X,b,mode){
  const e=b.o&&X.ent?X.ent[b.o]:null;
  if(!e)return;
  remember(X);
  BEH.set(b.o,{mode,n:+b.n||0,x:+b.x||0,t0:performance.now(),a0:Math.random()*6.28,base:null});
 }
 function stepBehaviours(X,t,dt){
  if(!BEH.size)return;
  const p=X.p;
  BEH.forEach((s,uid)=>{
   const e=X.ent&&X.ent[uid];
   if(!e){BEH.delete(uid);return}
   const c=ePos(X,e),sec=Math.min(.05,Math.max(0,dt||.016));
   let dx=0,dy=0,dz=0;
   if(s.mode=='chase'||s.mode=='follow'){
    const vx=p.x-c.x,vz=p.z-c.z,d=Math.hypot(vx,vz)||1;
    const stop=s.mode=='follow'?Math.max(1,s.n):0.8;
    if(d>stop){const sp=s.mode=='follow'?Math.min(s.n,d-stop)*2.2:s.n;dx=(vx/d)*sp*sec;dz=(vz/d)*sp*sec}
   }else if(s.mode=='flee'){
    const vx=c.x-p.x,vz=c.z-p.z,d=Math.hypot(vx,vz)||1;
    dx=(vx/d)*s.n*sec;dz=(vz/d)*s.n*sec;
   }else if(s.mode=='orbit'){
    s.a0+=(s.n||2)*sec;
    const r=Math.max(3,s.n*1.4),tx=p.x+Math.cos(s.a0)*r,tz=p.z+Math.sin(s.a0)*r;
    dx=(tx-c.x)*.2;dz=(tz-c.z)*.2;
   }else if(s.mode=='bounce'){
    if(s.base==null)s.base=c.y;
    const y=s.base+Math.abs(Math.sin((t-s.t0)/1000*(s.n||2)*2))*2.2;
    dy=y-c.y;
   }else if(s.mode=='patrol'){
    if(s.base==null)s.base=c.x;
    const x=s.base+Math.sin((t-s.t0)/1000*(s.n||4))*Math.max(1,s.x||2);
    dx=x-c.x;
   }
   if(dx||dy||dz){try{X.moveEnt(e,dx,dy,dz)}catch(_){}}
  });
 }

 /* ---------- weather ---------- */
 let weather=null;
 function clearWeather(){
  if(!weather)return;
  try{weather.S.remove(weather.pts);weather.pts.geometry.dispose();weather.pts.material.dispose()}catch(e){}
  weather=null;
 }
 function makeWeather(X,kind){
  clearWeather();
  try{
   const T=X.THREE,n=kind=='snow'?260:340,pos=new Float32Array(n*3),sp=new Float32Array(n);
   for(let i=0;i<n;i++){pos[i*3]=(Math.random()-.5)*60;pos[i*3+1]=Math.random()*26;pos[i*3+2]=(Math.random()-.5)*60;sp[i]=kind=='snow'?.8+Math.random()*1.6:6+Math.random()*7}
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));
   const mat=new T.PointsMaterial({color:kind=='snow'?0xffffff:0x9ecbff,size:kind=='snow'?.22:.14,transparent:true,opacity:.85});
   const pts=new T.Points(geo,mat);X.S.add(pts);
   weather={S:X.S,pts,n,sp,kind};
  }catch(e){}
 }
 function stepWeather(X,dt){
  if(!weather)return;
  const a=weather.pts.geometry.attributes.position,arr=a.array,sec=Math.min(.06,Math.max(0,dt||.016));
  for(let i=0;i<weather.n;i++){
   arr[i*3+1]-=weather.sp[i]*sec*(weather.kind=='snow'?1.1:2.4);
   if(weather.kind=='rain')arr[i*3+1]-=weather.sp[i]*sec;
   arr[i*3]+=weather.kind=='snow'?Math.sin((arr[i*3+1]+i)*.7)*.01:0;
   if(arr[i*3+1]<-(X.p.y+10)){arr[i*3+1]=24;arr[i*3]=(Math.random()-.5)*60;arr[i*3+2]=(Math.random()-.5)*60}
  }
  a.needsUpdate=true;
 }

 /* ---------- labels (a small sign floating above the object) ---------- */
 function labelFor(X,oid,txt){
  const e=oid&&X.ent?X.ent[oid]:null,mesh=e&&e.mesh;
  if(!mesh||!X.THREE)return;
  try{
   const T=X.THREE;
   if(mesh.children)for(let i=mesh.children.length-1;i>=0;i--){const ch=mesh.children[i];if(ch.userData&&ch.userData.rkTag){try{mesh.remove(ch)}catch(_){}}}
   const s=String(txt||'').slice(0,18);
   if(!s)return;
   const cv=document.createElement('canvas');cv.width=320;cv.height=80;
   const g2=cv.getContext('2d');
   g2.fillStyle='rgba(0,0,0,.62)';
   g2.beginPath();const r=22;g2.moveTo(r,0);g2.lineTo(320-r,0);g2.quadraticCurveTo(320,0,320,r);g2.lineTo(320,80-r);g2.quadraticCurveTo(320,80,320-r,80);g2.lineTo(r,80);g2.quadraticCurveTo(0,80,0,80-r);g2.lineTo(0,r);g2.quadraticCurveTo(0,0,r,0);g2.fill();
   g2.font='bold 34px system-ui,-apple-system,Segoe UI,Roboto,sans-serif';
   g2.fillStyle='#fff';g2.textAlign='center';g2.textBaseline='middle';
   g2.fillText(s,160,42);
   const tex=new T.CanvasTexture(cv);
   const spr=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,depthTest:false}));
   spr.scale.set(3.4,.85,1);spr.position.set(0,2.4,0);spr.userData.rkTag=1;
   mesh.add(spr);
  }catch(_){}
 }

 /* ---------- runtime: new block cases ---------- */
 const runCase={
  fogCol(X,b){
   const S=X.S;if(!S)return;
   if(!S.fog){const T=X.THREE;if(T&&S.background&&S.background.isColor)S.fog=new T.Fog(S.background.getHex(),16,46)}
   if(S.fog&&S.fog.color)S.fog.color.set(b.cc);
  },
  bright(X,b){
   const S=X.S;if(!S)return;
   const f=Math.max(0,Math.min(3,(+b.p||100)/100));
   if(S.traverse)S.traverse(o=>{if(o.isLight)o.intensity=(o.userData.rkI0==null?(o.userData.rkI0=o.intensity):o.userData.rkI0)*f});
  },
  rain(X,b){makeWeather(X,'rain')},
  snow(X,b){makeWeather(X,'snow')},
  weatherOff(){clearWeather()},
  hudText(X,b){const el=hud();if(el)el.textContent=b.m||''},
  hudClear(){const el=hud();if(el)el.textContent='';const bar=document.getElementById('rk24bar');if(bar)bar.style.display='none'},
  hudValue(X,b){
   const el=hud();if(!el)return;
   const v=(typeof SKX!=='undefined'&&SKX.val)?SKX.val(b.v,X):0;
   el.textContent=(b.m?b.m+': ':'')+Math.round(v*10)/10;
  },
  flash(X,b){
   styleOnce();
   const el=ensure('rk24flash');if(!el)return;
   el.style.background=b.cc||'#fff';
   el.style.opacity='.85';
   setTimeout(()=>{el.style.opacity='0'},Math.max(60,(+b.s||.4)*1000));
  },
  bar(X,b){
   styleOnce();
   const el=ensure('rk24bar');if(!el)return;
   el.style.display='block';
   const i=el.querySelector('i')||el.appendChild(document.createElement('i'));
   i.style.width=Math.max(0,Math.min(100,+b.p||0))+'%';
   i.style.background=b.cc||'#5b4bff';
  },
  vibrate(X,b){try{if(navigator.vibrate)navigator.vibrate(Math.max(40,(+b.s||.3)*1000))}catch(e){}},
  picture(X,b){
   styleOnce();
   const el=ensure('rk24pic');if(!el)return;
   const u=assetUrl(b.a);if(!u)return;
   el.style.backgroundImage='url("'+u+'")';
   el.style.width=Math.max(10,Math.min(100,+b.p||60))+'vw';
   el.style.height='auto';
   el.style.display='block';
  },
  pictureHide(){const el=document.getElementById('rk24pic');if(el)el.style.display='none'},
  texture(X,b){
   const e=b.o&&X.ent?X.ent[b.o]:null;if(!e||!X.THREE)return;
   const m=(e.mesh&&e.mesh.material)?e.mesh.material:null;if(!m)return;
   const u=assetUrl(b.a);if(!u)return;
   try{
    new X.THREE.TextureLoader().load(u,tex=>{
     tex.wrapS=tex.wrapT=X.THREE.RepeatWrapping;
     m.map=tex;m.color&&m.color.set&&m.color.set('#ffffff');m.needsUpdate=true;
    },undefined,()=>{});
   }catch(_){}
  },
  playsound(X,b){playOnce(assetUrl(b.a),vol)},
  music(X,b){
   const u=assetUrl(b.a);if(!u)return;
   stopMusic();
   try{music=new Audio(u);music.loop=true;music.volume=vol;const p=music.play();if(p&&p.catch)p.catch(()=>{})}catch(e){}
  },
  musicStop(){stopMusic()},
  volume(X,b){vol=Math.max(0,Math.min(1,(+b.p||80)/100));try{if(music)music.volume=vol}catch(e){}},
  chase(X,b){setBehaviour(X,b,'chase')},
  flee(X,b){setBehaviour(X,b,'flee')},
  orbit(X,b){setBehaviour(X,b,'orbit')},
  follow(X,b){setBehaviour(X,b,'follow')},
  bounce(X,b){setBehaviour(X,b,'bounce')},
  patrol(X,b){setBehaviour(X,b,'patrol')},
  damageNear(X,b){
   const e=b.o&&X.ent?X.ent[b.o]:null;if(!e)return;
   const c=ePos(X,e),d=Math.hypot(c.x-X.p.x,c.z-X.p.z);
   if(d>(+b.x||3))return;
   if(typeof X.ST==='undefined'||!X.ST)return;
   X.ST.hp=Math.max(0,(X.ST.hp|0)-(+b.n||20));
   try{X.hud&&X.hud()}catch(_){}
   if(X.ST.hp<=0){X.ST.dead=true;try{X.rsp&&X.rsp()}catch(_){}X.ST.hp=X.ST.mx;try{X.hud&&X.hud()}catch(_){}}
  },
  pushAway(X,b){
   const e=b.o&&X.ent?X.ent[b.o]:null;if(!e)return;
   const c=ePos(X,e),vx=X.p.x-c.x,vz=X.p.z-c.z,d=Math.hypot(vx,vz)||1,n=+b.n||12;
   X.p.x+=(vx/d)*n*.08;X.p.z+=(vz/d)*n*.08;X.p.vy=Math.max(X.p.vy,n*.35);
  },
  despawn(X,b){
   const e=b.o&&X.ent?X.ent[b.o]:null;if(!e)return;
   try{X.setVis&&X.setVis(e,false)}catch(_){}
   if(e.mesh){try{e.mesh.visible=false}catch(_){}}
   BEH.delete(b.o);
  },
  resetPos(X,b){
   const e=b.o&&X.ent?X.ent[b.o]:null;if(!e)return;
   const o=ORIG.get(b.o);if(!o)return;
   const c=ePos(X,e);
   try{X.moveEnt(e,o.x-c.x,o.y-c.y,o.z-c.z)}catch(_){}
   BEH.delete(b.o);
   try{X.setVis&&X.setVis(e,true)}catch(_){}
  },
  opacity(X,b){
   const e=b.o&&X.ent?X.ent[b.o]:null;if(!e)return;
   const m=e.mesh;if(!m)return;
   const pct=Math.max(0,Math.min(100,+b.p||100))/100;
   const set=x=>{if(!x)return;if(x.opacity==null)x.opacity=1;x.transparent=pct<1;x.opacity=pct;x.needsUpdate=true};
   if(m.traverse)m.traverse(q=>{if(q.material)(Array.isArray(q.material)?q.material:[q.material]).forEach(set)});
   else if(m.material)(Array.isArray(m.material)?m.material:[m.material]).forEach(set);
  },
  nameTag(X,b){labelFor(X,b.o,b.m)},
  labelHide(X,b){labelFor(X,b.o,'')},
  spawnCoin(X,b){
   if(!X.THREE||!X.S)return;
   const e=b.o&&X.ent?X.ent[b.o]:null;const c=e?ePos(X,e):{x:X.p.x,y:X.p.y,z:X.p.z};
   try{
    const m=new X.THREE.Mesh(new X.THREE.CylinderGeometry(.35,.35,.08,16),new X.THREE.MeshLambertMaterial({color:'#ffc800'}));
    m.rotation.x=1.5708;m.position.set(c.x+(+b.x||0),c.y+(+b.y||0),c.z+(+b.z||0));
    X.S.add(m);
    if(X.coins&&X.coins.push)X.coins.push(m);
   }catch(_){}
  },
  slowPlayer(X,b){
   if(!X.ph)return;
   const old=X.ph.spd,to=Math.max(.5,old*Math.max(.1,Math.min(1,(+b.p||40)/100)));
   X.ph.spd=to;
   setTimeout(()=>{try{X.ph.spd=old}catch(e){}},Math.max(150,(+b.s||2)*1000));
  },
  jumpBoost(X,b){
   if(!X.ph)return;
   const old=X.ph.jmp;
   X.ph.jmp=old*Math.max(1,Math.min(4,(+b.p||200)/100));
   setTimeout(()=>{try{X.ph.jmp=old}catch(e){}},Math.max(150,(+b.s||3)*1000));
  }
 };

 /* ---------- wrap the runtime ---------- */
 try{
  if(typeof SKX!=='undefined'&&SKX&&typeof SKX.run==='function'){
   const prevRun=SKX.run.bind(SKX);
   SKX.run=function(b,run,now,X){
    const f=b&&runCase[b.t];
    if(f){try{f(X||{},b)}catch(e){}return}
    return prevRun(b,run,now,X);
   };
   const prevVal=typeof SKX.val==='function'?SKX.val.bind(SKX):null;
   SKX.val=function(v,X){
    const x=X||window.__RKX||null;
    if(prevVal){try{const r=prevVal(v,x);if(r)return r}catch(e){}}
    if(!x)return 0;
    return v=='px'?x.p.x:v=='pz'?x.p.z:v=='y'?x.p.y:v=='hp'?(x.ST?x.ST.hp|0:0):v=='kills'?(x.ST?x.ST.k|0:0):v=='deaths'?(x.ST?x.ST.d|0:0):v=='coins'?(x.got|0):0;
   };
   const prevTick=SKX.tick.bind(SKX);
   SKX.tick=function(t,dt,X){
    try{window.__RKX=X;remember(X);stepBehaviours(X,t,dt);stepWeather(X,dt)}catch(e){}
    return prevTick(t,dt,X);
   };
  }
 }catch(e){}

 window.RK24={blocks};
})();
