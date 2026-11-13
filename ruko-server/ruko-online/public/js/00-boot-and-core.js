
const $=s=>document.querySelector(s),app=$('#app');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ls={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const DEF_HATS=[
{id:'r1',name:'Ruko Cap',creator:'Ruko',price:50,type:'dome',color:'#e5484d',h:.4,w:1,brim:1,base:1240},
{id:'r2',name:'Top Hat',creator:'Ruko',price:120,type:'cylinder',color:'#1b1b22',h:.65,w:1,brim:1,base:860},
{id:'r3',name:'Wizard Hat',creator:'Ruko',price:200,type:'cone',color:'#6d4aff',h:1,w:1.1,brim:1,base:2130},
{id:'r4',name:'Golden Halo',creator:'Ruko',price:400,type:'ring',color:'#ffc800',h:.3,w:1,brim:0,base:540},
{id:'r5',name:'Party Cone',creator:'Ruko',price:30,type:'cone',color:'#ff4b8b',h:.6,w:.7,brim:0,base:980},
{id:'r6',name:'Crate Head',creator:'Ruko',price:80,type:'box',color:'#a8743a',h:.55,w:1.1,brim:0,base:310}];
const DEF_GAMES=[
{id:'g1',name:'Sky Steps',creator:'Ruko',desc:'Jump up the floating obby to the golden platform.',mode:'obby',sky:'#8fd3ff',ground:'#5bd16a',seed:7,size:18},
{id:'g2',name:'Coin Rush',creator:'Ruko',desc:'Grab every coin in the park.',mode:'coins',sky:'#ffd9a0',ground:'#7bc96f',seed:3,size:20},
{id:'g3',name:'Ruko Park',creator:'Ruko',desc:'Free roam. Show off your hats.',mode:'roam',sky:'#b7e3ff',ground:'#9fd3a0',seed:11,size:12}];
const hats=()=>[...DEF_HATS,...SH].map(h=>MET[h.id]?{...h,...MET[h.id]}:h),games=()=>[...DEF_GAMES.filter(d=>!SG.some(g=>g.id==d.id)),...SG];
let ME=null,TOKEN=ls.get('ruko_token',null);const key=()=>ME?ME.name.toLowerCase():null,cur=()=>ME,users=()=>ME?{[key()]:ME}:{};
const saveUser=u=>{if(ME&&u!==ME){ME.av=u.av;ME.gear=u.gear}api('/api/me',{av:u.av||undefined,gear:u.gear||{}})};
const sales=h=>(h.base||0)+(SC[h.id]||0);
async function hash(s){try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('ruko:'+s));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}catch(e){return btoa(s)}}

/* ---------- 3D helpers ---------- */
function hatMesh(h){const g=new THREE.Group(),M=new THREE.MeshLambertMaterial({color:h.color}),w=+h.w||1,H=+h.h||.5;
 const add=(geo,y)=>{const m=new THREE.Mesh(geo,M);m.position.y=y;g.add(m);return m};
 if(h.type=='cylinder')add(new THREE.CylinderGeometry(.35*w,.35*w,H,20),H/2);
 if(h.type=='cone')add(new THREE.ConeGeometry(.4*w,H,20),H/2);
 if(h.type=='dome')add(new THREE.SphereGeometry(.42*w,20,12,0,6.3,0,1.57),0).scale.y=H/.42;
 if(h.type=='box')add(new THREE.BoxGeometry(.7*w,H,.7*w),H/2);
 if(h.type=='ring'){const t=add(new THREE.TorusGeometry(.3*w,.05,8,24),.4);t.rotation.x=1.57}
 if(h.brim&&h.type!='ring')add(new THREE.CylinderGeometry(.6*w,.6*w,.05,24),.02);
 return g}
const MATN={none:'None (flat color)',grass:'Grass',stone:'Stone',brick:'Brick',concrete:'Concrete'};
const matCache={};
function matTexture(name){if(!name||name=='none')return null;if(matCache[name])return matCache[name];
 const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
 if(name=='grass'){x.fillStyle='#4f9e44';x.fillRect(0,0,128,128);for(let i=0;i<260;i++){x.fillStyle=Math.random()<.5?'#3f8a37':'#5fb552';x.fillRect(Math.random()*128,Math.random()*128,2,2)}}
 else if(name=='stone'){x.fillStyle='#9a9ea6';x.fillRect(0,0,128,128);
  for(let i=0;i<24;i++){const cx=Math.random()*128,cy=Math.random()*128,r=10+Math.random()*20,pts=5+(Math.random()*3|0),g=120+Math.random()*55|0;
   x.fillStyle='rgb('+g+','+(g+3)+','+(g+9)+')';x.beginPath();
   for(let q=0;q<pts;q++){const a=q/pts*6.283,rr=r*(.65+Math.random()*.55),px=cx+Math.cos(a)*rr,py=cy+Math.sin(a)*rr;q?x.lineTo(px,py):x.moveTo(px,py)}
   x.closePath();x.fill()}
  x.strokeStyle='rgba(55,58,64,.45)';x.lineWidth=1.4;
  for(let i=0;i<7;i++){x.beginPath();let cx=Math.random()*128,cy=Math.random()*128;x.moveTo(cx,cy);for(let st=0;st<4;st++){cx+=(Math.random()-.5)*32;cy+=(Math.random()-.5)*32;x.lineTo(cx,cy)}x.stroke()}}
 else if(name=='brick'){x.fillStyle='#8a3b24';x.fillRect(0,0,128,128);const bh=20;for(let row=0,yy=-bh;yy<128+bh;yy+=bh,row++){const off=row%2?20:0;for(let bx=-20+off;bx<148;bx+=40){x.fillStyle='#7c331f';x.fillRect(bx+2,yy+2,36,bh-4)}}}
 else if(name=='concrete'){x.fillStyle='#a9acb1';x.fillRect(0,0,128,128);for(let i=0;i<500;i++){x.fillStyle='rgba(0,0,0,'+(Math.random()*.08)+')';x.fillRect(Math.random()*128,Math.random()*128,2,2)}}
 else return null;
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return matCache[name]=t}
function matMat(name,color,sx,sz){const base=matTexture(name);if(!base)return new THREE.MeshLambertMaterial({color});
 const tex=base.clone();tex.needsUpdate=true;const TILE=2;tex.repeat.set(Math.max(.5,(sx||2)/TILE),Math.max(.5,(sz||2)/TILE));
 return new THREE.MeshLambertMaterial({map:tex,color:color||'#ffffff'})}
let TR;function thumb(h){const k=JSON.stringify([h.type,h.color,h.h,h.w,h.brim]);if(thumb.c[k])return thumb.c[k];
 if(!TR){TR=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});TR.setSize(220,220)}
 const sc=new THREE.Scene();sc.add(new THREE.AmbientLight(0xffffff,.75));const l=new THREE.DirectionalLight(0xffffff,.8);l.position.set(2,3,4);sc.add(l);
 const m=hatMesh(h);m.rotation.y=-.5;sc.add(m);const c=new THREE.PerspectiveCamera(40,1,.1,500);c.position.set(1.4,1.5,2.8);c.lookAt(0,.4,0);
 TR.render(sc,c);return thumb.c[k]=TR.domElement.toDataURL()}thumb.c={};
function makePlayer(hat){const g=new THREE.Group(),L=c=>new THREE.MeshLambertMaterial({color:c});
 const b=new THREE.Mesh(new THREE.BoxGeometry(.8,1.2,.5),L('#3b82f6'));b.position.y=.6;g.add(b);
 const h=new THREE.Mesh(new THREE.SphereGeometry(.35,16,12),L('#ffd9a8'));h.position.y=1.55;g.add(h);
 if(hat){const m=hatMesh(hat);m.position.y=1.85;m.scale.setScalar(.9);g.add(m)}return g}

/* ---------- game engine ---------- */
const TK={};
document.querySelectorAll('#acts button').forEach(b=>{const k=b.dataset.k;b.onpointerdown=e=>{e.preventDefault();TK[k]=1};['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>TK[k]=0))});
document.querySelectorAll('#pad button').forEach(b=>{const k=b.dataset.k;b.onpointerdown=e=>{e.preventDefault();TK[k]=1};['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>TK[k]=0))});
let SFX_ON=ls.get('ruko_sfx',true);
async function play0(g,srv){
 const me=cur(),hat=gearList(me),W=$('#game');W.style.display='block';$('#gt').textContent=g.name+(srv?' · Server '+String(srv).replace(/^.*x/,''):'')+(DEV()=='desktop'?'  ·  WASD move · Space jump · drag to look · wheel zoom':'');$('#gh').textContent='';$('#gmsg').textContent='';$('#chatw').style.display=srv?'block':'none';$('#svd').textContent='';
 const R=new THREE.WebGLRenderer({antialias:true});R.setPixelRatio(Math.min(devicePixelRatio,2));R.setSize(innerWidth,innerHeight);W.prepend(R.domElement);
 const S=new THREE.Scene();S.background=new THREE.Color(g.sky);S.fog=g.fog===false?null:new THREE.Fog(g.sky,30,90);
 S.add(new THREE.HemisphereLight(0xffffff,0x555566,.9*(g.light||1)));const DL=new THREE.DirectionalLight(0xffffff,.6);DL.position.set(5,10,6);S.add(DL);
 const C=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,600);
 let s=(+g.seed||1)%2147483646+1;const r=()=>(s=(s*16807)%2147483647)/2147483647;
 const pl=[],coins=[];
 const P=(x,y,z,sx,sz,c,t,th,mv,mat)=>{th=th||.5;const m=new THREE.Mesh(new THREE.BoxGeometry(sx,th,sz),matMat(mat,mat?c:c,sx,sz));m.position.set(x,y-th/2,z);S.add(m);pl.push({x,y,z,sx,sz,t,th,mv,mesh:m,bx:x,by:y,bz:z})};
 const n=Math.max(5,Math.min(40,+g.size||16));let last=-1,spawn=null,spawns=[],pkm=[],ent={};
 if(g.objs){g.objs.forEach(o=>{if(o.k=='p'){P(o.x,o.y,o.z,o.sx,o.sz,TC(o),o.t,o.th,o.mv,o.mat);if(o.u)ent[o.u]={q:pl[pl.length-1],o};}else if(o.k=='c'){const m=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,.08,16),new THREE.MeshLambertMaterial({color:'#ffc800'}));m.rotation.x=1.57;m.position.set(o.x,o.y,o.z);S.add(m);coins.push(m);if(o.u)ent[o.u]={mesh:m,o};}else if(o.k=='s'){spawns.push({x:o.x,y:o.y,z:o.z})}else if(o.k=='w'){const d=(g.weapons||[])[o.wi]||{},m=new THREE.Group(),wm=weaponMesh(d);wm.position.z=-.5;m.add(wm);m.position.set(o.x,o.y+1,o.z);S.add(m);pkm.push(m);if(o.u)ent[o.u]={mesh:m,o};}else if(o.k=='d'){const m=new THREE.Mesh((GEO[o.shape]||GEO.box)(),new THREE.MeshLambertMaterial({color:o.c}));m.scale.set(o.sx,o.sy,o.sz);m.position.set(o.x,o.y+o.sy/2,o.z);S.add(m);if(o.u)ent[o.u]={mesh:m,o};}})}else if(g.mode=='obby'){P(0,0,0,6,6,g.ground);let x=0,y=0,z=0;for(let i=0;i<n;i++){x+=(r()-.5)*6;y+=.3+r()*.9;z-=4.5+r()*1.5;P(x,y,z,3,3,i==n-1?'#ffd23f':`hsl(${i*37%360},70%,60%)`)}last=pl.length-1}
 else{P(0,0,0,60,60,g.ground);for(let i=0;i<(g.mode=='roam'?12:6);i++)P((r()-.5)*40,.8+r()*2,(r()-.5)*40,3,3,`hsl(${r()*360},60%,60%)`);
  if(g.mode=='coins')for(let i=0;i<(g.coinN||25);i++){const m=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,.08,16),new THREE.MeshLambertMaterial({color:'#ffc800'}));m.rotation.x=1.57;m.position.set((r()-.5)*40,.9+r()*1.4,(r()-.5)*40);S.add(m);coins.push(m)}}
 if(spawns.length)spawn=spawns[Math.floor(Math.random()*spawns.length)];const pm=makePlayer(hat,me.av,me.name);S.add(pm);const sp0=spawn?{...spawn}:{x:0,y:0,z:0},ts=performance.now(),cv=R.domElement;let cy=0,cd=10,cp=.25,ly=0,dr=0,lx=0,ride=null,px0=0,py0=0,PVC=0;cv.onpointerdown=e=>{dr=1;lx=e.clientX;ly=e.clientY;px0=e.clientX;py0=e.clientY;cv.setPointerCapture(e.pointerId)};cv.onpointerup=e=>{dr=0;if(e&&Math.hypot(e.clientX-px0,e.clientY-py0)<6)PVC=1};cv.onpointercancel=()=>dr=0;cv.onpointermove=e=>{if(dr){cy-=(e.clientX-lx)*.008;cp=Math.max(-.35,Math.min(1.3,cp+(e.clientY-ly)*.006));lx=e.clientX;ly=e.clientY}};cv.onwheel=e=>{cd=Math.max(5,Math.min(22,cd+e.deltaY*.01))};const rem={};let rr=null,off=null,hb=0;const chatMsg=c=>{const t=c.isMe?pm:rem[c.peer]&&rem[c.peer].m,L=document.createElement('div');L.innerHTML='<b>'+esc(c.name)+'</b> '+esc(c.text);$('#cbox').append(L);while($('#cbox').children.length>8)$('#cbox').firstChild.remove();setTimeout(()=>L.remove(),14000);if(t){const k=t.userData.ct=Date.now();setTag(t,c.name,c.text);setTimeout(()=>{if(t.userData.ct==k)setTag(t,c.name,null)},6000)}};
 const sendC=()=>{const i=$('#ci'),v=i.value.trim();if(rr&&v){rr.chat(v);if(hasScr)scChat(v);i.value=''}};$('#cs').onclick=sendC;$('#ci').onkeydown=e=>{if(e.key=='Enter'){sendC();$('#ci').blur()}};if(srv){setSrv(srv);if(RM)RM.join('srv'+srv).then(r=>{rr=r;r.onChat(chatMsg);r.onEvent(PVE);off=r.onPeers(c=>{PVL(c.peers);const seen={};c.peers.forEach(q=>{const s=q.presence;if(q.isMe||!s||s.x==null)return;seen[q.peer]=1;let o=rem[q.peer];const k=JSON.stringify([s.gear,s.av]);if(!o||o.k!=k){if(o)S.remove(o.m);const rg=Object.values(s.gear||{}).map(id=>hats().find(h=>h.id==id)).filter(Boolean);const m=makePlayer(rg,s.av,q.name);S.add(m);o=rem[q.peer]={m,k,t:s}}o.t=s;PVR(o,q)});Object.keys(rem).forEach(i=>{if(!seen[i]){S.remove(rem[i].m);delete rem[i]}})})}).catch(()=>{})}const p={x:sp0.x,y:sp0.y+(spawn?.5:0),z:sp0.z,vy:0};let got=0,done=0,raf,t0=performance.now();
 const keys={},kd=e=>{if(e.key=='Enter'&&rr){$('#ci').focus();return}if(document.activeElement&&document.activeElement.tagName=='INPUT')return;keys[e.key.toLowerCase()]=1;if(e.key==' ')e.preventDefault()},ku=e=>keys[e.key.toLowerCase()]=0;
 addEventListener('keydown',kd);addEventListener('keyup',ku);
 const msg=t=>{$('#gmsg').textContent=t;setTimeout(()=>$('#gmsg').textContent='',2500)};
 const K=k=>!ST.dead&&(keys[k]||TK[k]);
 const WD=g.weapons||[],pvp=!!g.pvp&&WD.length>0,ST={am:0,rl:false,owned:[],cw:-1,hp:g.hp||100,mx:g.hp||100,dead:false,k:0,d:0};let atk=-1e9,nf=0,mePeer=null,lastPick=0,pvH=false;
$('#pvp').style.display=pvp?'block':'none';if(pvp)cp=.1;$('#padx').style.display=pvp&&DEV()=='mobile'?'flex':'none';
if(pvp&&g.startW&&g.startW.length&&!srv){ST.owned=[...g.startW];ST.cw=g.startW[0]}
function setW(m,i){const u=m.userData;if(u.wm&&u.l)u.l.ra.remove(u.wm);u.wm=null;u.wi=i;const d=WD[i];if(!d||!u.l)return;const w=weaponMesh(d);w.position.set(0,-1.15,.15);u.l.ra.add(w);u.wm=w}
const hud=()=>{if(!pvp)return;$('#hpf').style.width=Math.max(0,ST.hp/ST.mx*100)+'%';$('#wl').textContent=(WD[ST.cw]?WD[ST.cw].n+(ST.rl?' · reloading…':(WD[ST.cw].mag>0?' · '+ST.am+'/'+WD[ST.cw].mag:'')):'No weapon')+'   '+ST.owned.map((w,n)=>(n+1)+':'+(WD[w]?WD[w].n:'')).join('  ');$('#kdl').textContent='Kills '+ST.k+'  Deaths '+ST.d};
const tracer=(f,t)=>{const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(f[0],f[1],f[2]),new THREE.Vector3(t[0],t[1],t[2])]),new THREE.LineBasicMaterial({color:0xffee88}));S.add(l);setTimeout(()=>S.remove(l),90)};
const feed=s=>{const L=document.createElement('div');L.textContent=s;$('#cbox').append(L);while($('#cbox').children.length>8)$('#cbox').firstChild.remove();setTimeout(()=>L.remove(),9000)};
function PVL(peers){if(!pvp)return;const q=peers.find(x=>x.isMe);
 if(q&&q.hp!=null){mePeer=q.peer;const was=ST.dead;ST.hp=q.hp;ST.mx=q.mx||ST.mx;ST.k=q.k;ST.d=q.d;ST.dead=!!q.dead;ST.owned=q.own||[];ST.am=q.am>=0?q.am:0;ST.rl=!!q.rl;if(q.w!==ST.cw){ST.cw=q.w;setW(pm,ST.cw)}hud();
  if(!was&&ST.dead){pm.visible=false;msg('You were eliminated!')}
  if(was&&!ST.dead){const s=spawns.length?spawns[Math.floor(Math.random()*spawns.length)]:{x:0,y:0,z:0};p.x=s.x;p.z=s.z;p.y=s.y+1;p.vy=0;pm.visible=true}}
 $('#sbd').innerHTML=[...peers].sort((a,b)=>(b.k||0)-(a.k||0)).slice(0,8).map(x=>`<div${x.isMe?' style="color:#ffd23f"':''}>${esc(x.name)} ${x.k||0}/${x.d||0}</div>`).join('')}
function PVR(o,q){if(!pvp||q.hp==null)return;const m=o.m,u=m.userData;if(q.w!==u.wi)setW(m,q.w);if(q.mx&&u.th!==q.hp/q.mx)setTag(m,q.name,undefined,q.hp/q.mx);m.visible=!q.dead}
function PVE(ev){if(!pvp)return;if(ev.t=='fx'){if(ev.peer!==mePeer)ev.w.forEach(x=>tracer(x.f,x.t))}else if(ev.t=='hit'){if(ev.target==mePeer){const f=$('#flash');f.style.opacity=.5;setTimeout(()=>f.style.opacity=0,150)}}else if(ev.t=='kill')feed('☠ '+ev.bn+' eliminated '+ev.tn)}
const reload=t=>{const d=WD[ST.cw];if(!pvp||!d||d.mag<=0||ST.rl||ST.dead||ST.am>=d.mag)return;if(rr)rr.reload();else{ST.rl=true;const w=ST.cw;setTimeout(()=>{ST.rl=false;if(ST.cw==w)ST.am=d.mag;hud()},d.rel*1000)}hud()};
const fire=t=>{const d=WD[ST.cw];if(!pvp||!d||ST.dead||t<nf||ST.rl)return;if(d.mag>0&&ST.am<=0){reload(t);return}nf=t+d.cd*1000;atk=t;const A=aim(),dx=A.dx,dz=A.dz;pm.rotation.y=Math.atan2(dx,dz);if(d.t=='gun'){const L=Math.min(d.rng,45);tracer([p.x,p.y+1.6,p.z],[p.x+dx*L,p.y+1.6+A.s*L,p.z+dz*L])}if(d.mag>0){ST.am--;if(!rr&&ST.am<=0)reload(t);hud()}if(rr)rr.fire(dx,dz,A.s)};
const swTo=i=>{if(i==null||i==ST.cw||!ST.owned.includes(i))return;ST.cw=i;ST.rl=false;ST.am=(WD[i]||{}).mag||0;setW(pm,i);hud();if(rr)rr.sw(i)};
function PVT(t,dt){if(!pvp)return;pkm.forEach(m=>m.rotation.y+=dt*2);
 (g.objs||[]).forEach((o,i)=>{if(o.k=='w'&&WD[o.wi]&&!ST.owned.includes(o.wi)&&Math.hypot(o.x-p.x,o.z-p.z)<2&&Math.abs(o.y-p.y)<3&&t-lastPick>800&&!ST.dead){lastPick=t;if(rr)rr.pick(i);else{ST.owned.push(o.wi);ST.cw=o.wi;ST.am=WD[o.wi].mag||0;setW(pm,o.wi);hud()}}});
 {const held=!ST.dead&&(keys['f']||TK.tx),d0=WD[ST.cw];if(PVC||(held&&(!pvH||(d0&&d0.auto!==false))))fire(t);pvH=!!held;PVC=0;if(!ST.dead&&(keys['r']||TK.tz))reload(t)}
 for(let n=1;n<=6;n++)if(keys[''+n]){swTo(ST.owned[n-1]);keys[''+n]=0}
 if(TK.te){TK.te=0;swTo(ST.owned[(ST.owned.indexOf(ST.cw)+1)%Math.max(1,ST.owned.length)])}}
if(pvp){if(ST.cw>=0){setW(pm,ST.cw);ST.am=(WD[ST.cw]||{}).mag||0}hud()}
const cam3={x:p.x,y:p.y,z:p.z};let gait=0,lsw=0,lup=0,vhx=0,vhz=0,gr=false,coy=0,jbuf=0,jprev=false,jumping=false;
const rsp=()=>{p.x=sp0.x;p.z=sp0.z;p.y=sp0.y+1;p.vy=0;vhx=0;vhz=0;cam3.x=p.x;cam3.y=p.y;cam3.z=p.z};
function camPose(){const dh=cd*Math.cos(cp),dv=cd*Math.sin(cp),off=pvp?.9:0,ox=Math.cos(cy)*off,oz=-Math.sin(cy)*off,cx=cam3.x+Math.sin(cy)*dh+ox,cz=cam3.z+Math.cos(cy)*dh+oz;let y=cam3.y+1.6+dv,gm=cam3.y+.4;for(const q of pl)if(!q.off&&q.y<=cam3.y+3&&Math.abs(cx-q.x)<=q.sx/2&&Math.abs(cz-q.z)<=q.sz/2&&q.y+.4>gm)gm=q.y+.4;if(y<gm)y=gm;return{x:cx,y,z:cz,fx:-Math.sin(cy)*Math.cos(cp),fy:-Math.sin(cp),fz:-Math.cos(cy)*Math.cos(cp)}}
function aim(){const P=camPose(),ax=P.x+P.fx*45-p.x,ay=P.y+P.fy*45-(p.y+1.6),az=P.z+P.fz*45-p.z,h=Math.hypot(ax,az)||1;return{dx:ax/h,dz:az/h,s:Math.max(-2.5,Math.min(2.5,ay/h))}}
const SCR=g.scripts||[],ph={spd:g.spd||7,jmp:g.jmp||9,grav:g.grav||22},SV={score:0,A:0,B:0,C:0},tws=[],runs=[],hasScr=SCR.length>0,scUses=hasScr&&JSON.stringify(SCR).indexOf('score')>=0;let pa1=false,pa2=false,aud=null,sayT=0;
SCR.forEach(s=>{s.st={run:false,tn:0,fired:false,touching:false,cool:0,started:false}});
if(hasScr)$('#acts').classList.toggle('on',SCR.some(s=>s.h&&s.h.t=='action'))
function burst(c,col){const n=10;for(let i=0;i<n;i++){const m=new THREE.Mesh(new THREE.BoxGeometry(.18,.18,.18),new THREE.MeshBasicMaterial({color:col||'#ffd23f'}));m.position.set(c.x,c.y,c.z);S.add(m);const a=Math.random()*6.28,sp2=1.5+Math.random()*2.5,vy=2+Math.random()*2.5,t0=performance.now();const step=()=>{const dt2=(performance.now()-t0)/1000;if(dt2>1){S.remove(m);m.geometry.dispose();m.material.dispose();return}m.position.set(c.x+Math.cos(a)*sp2*dt2,c.y+vy*dt2-4*dt2*dt2,c.z+Math.sin(a)*sp2*dt2);m.material.opacity=1-dt2;m.material.transparent=true;requestAnimationFrame(step)};requestAnimationFrame(step)}}
const beep=k=>{if(!SFX_ON)return;try{aud=aud||new(window.AudioContext||window.webkitAudioContext)();const a=aud,o=a.createOscillator(),gn=a.createGain(),P={beep:[660,.12,'square'],coin:[988,.18,'sine'],jump:[440,.15,'triangle'],boom:[90,.4,'sawtooth'],win:[784,.4,'sine'],hurt:[180,.25,'square']}[k]||[660,.12,'square'];o.type=P[2];o.frequency.setValueAtTime(P[0],a.currentTime);if(k=='coin'||k=='win')o.frequency.setValueAtTime(P[0]*1.5,a.currentTime+.08);if(k=='boom'||k=='hurt')o.frequency.exponentialRampToValueAtTime(40,a.currentTime+P[1]);gn.gain.setValueAtTime(.15,a.currentTime);gn.gain.exponentialRampToValueAtTime(.001,a.currentTime+P[1]);o.connect(gn);gn.connect(a.destination);o.start();o.stop(a.currentTime+P[1])}catch(e){}};
function sayMsg(m,s){const el=$('#gmsg');el.textContent=m;clearTimeout(sayT);sayT=setTimeout(()=>{if(el.textContent==m)el.textContent=''},Math.max(300,s*1000))}
function entPos(e){return e.q?{x:e.q.x,y:e.q.y,z:e.q.z}:{x:e.mesh.position.x,y:e.mesh.position.y,z:e.mesh.position.z}}
function moveEnt(e,dx,dy,dz){if(e.q){const q=e.q;q.x+=dx;q.y+=dy;q.z+=dz;q.bx+=dx;q.by+=dy;q.bz+=dz;q.mesh.position.x+=dx;q.mesh.position.y+=dy;q.mesh.position.z+=dz;if(ride===q){p.x+=dx;p.y+=dy;p.z+=dz}}else{e.mesh.position.x+=dx;e.mesh.position.y+=dy;e.mesh.position.z+=dz}}
function setVis(e,on){if(e.q){e.q.hid=!on;e.q.off=on?0:1;if(on)e.q.cr=0}e.mesh.visible=on}
function scTouch(e){if(e.q){const q=e.q;return Math.abs(p.x-q.x)<q.sx/2+.45&&Math.abs(p.z-q.z)<q.sz/2+.45&&p.y<q.y+.2&&p.y+2.6>q.y-(q.th||.5)-.1}const m=e.mesh.position,o=e.o||{},r=Math.max(o.sx||0,o.sz||0)/2+1.3;return Math.hypot(m.x-p.x,m.z-p.z)<r&&m.y>p.y-.6&&m.y<p.y+3.4}
const scVal=v=>v=='score'?SV.score:(v=='A'||v=='B'||v=='C')?SV[v]:v=='y'?p.y:v=='time'?(performance.now()-ts)/1000:v=='coins'?got:0;
const scCond=c=>{if(!c)return false;if(c.v=='chance')return Math.random()*100<c.n;const lhs=scVal(c.v),rhs=c.v2?scVal(c.v2):c.n;return c.o=='>'?lhs>rhs:c.o=='<'?lhs<rhs:Math.abs(lhs-rhs)<.001};
function scExec(b,run,now){switch(b.t){
 case 'waitUntil':run.stack.push({list:[],i:0,until:b.c});break;
 case 'say':sayMsg(b.m,b.s);run.wait=now+b.s*1000;break;
 case 'sound':beep(b.k);break;
 case 'wait':run.wait=now+b.s*1000;break;
 case 'tp':{let x=0,y=0,z=0;const e=b.w=='obj'?ent[b.o]:null;if(e){const c=entPos(e);x=c.x;y=c.y+1;z=c.z}else if(b.w=='pos'){x=b.x;y=b.y;z=b.z}else{const s=spawns.length?spawns[Math.floor(Math.random()*spawns.length)]:{x:0,y:0,z:0};x=s.x;y=s.y+.5;z=s.z}p.x=x;p.y=y;p.z=z;p.vy=0;vhx=0;vhz=0;cam3.x=p.x;cam3.y=p.y;cam3.z=p.z;break}
 case 'respawn':rsp();break;
 case 'win':if(!done){done=1;got+=100;msg(b.m||'You won!')}break;
 case 'score':SV.score=b.op=='set'?b.n:SV.score+b.n;break;
 case 'var':SV[b.v]=b.op=='set'?b.n:SV[b.v]+b.n;break;
 case 'randvar':{const lo=Math.min(b.a,b.b),hi=Math.max(b.a,b.b),v=Math.round(lo+Math.random()*(hi-lo));if(b.v=='score')SV.score=v;else SV[b.v]=v;break}
 case 'mathvar':{const x=scVal(b.a),y=scVal(b.b);let r=b.op=='sub'?x-y:b.op=='mul'?x*y:b.op=='div'?(y?x/y:0):x+y;r=Math.round(r*100)/100;if(b.v=='score')SV.score=r;else SV[b.v]=r;break}
 case 'heal':if(typeof ST!=='undefined'&&pvp&&!ST.dead){ST.hp=Math.min(ST.mx,ST.hp+b.n);hud()}break;
 case 'hurt':if(typeof ST!=='undefined'&&pvp&&!ST.dead){ST.hp=Math.max(0,ST.hp-b.n);hud();if(ST.hp<=0){ST.dead=true;rsp();ST.hp=ST.mx;hud()}}break;
 case 'warp':{const e=ent[b.o];if(e){const c=b.w=='obj'?entPos(ent[b.to]||{}):{x:b.x,y:b.y,z:b.z};if(c&&(c.x!=null))moveEnt(e,c.x-entPos(e).x,c.y-entPos(e).y,c.z-entPos(e).z)}break}
 case 'burst':{const e=ent[b.o],c=e?entPos(e):{x:p.x,y:p.y+1,z:p.z};burst(c,b.c);break}
 case 'broadcast':{const L=document.createElement('div');L.innerHTML='<b>📣</b> '+esc(b.m);$('#cbox').append(L);while($('#cbox').children.length>8)$('#cbox').firstChild.remove();setTimeout(()=>L.remove(),9000);break}
 case 'clone':{const e=ent[b.o];if(!e)break;const c=entPos(e);const x=c.x+b.x,y=c.y+b.y,z=c.z+b.z;
  if(b.kind=='coin'){const m=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,.08,16),new THREE.MeshLambertMaterial({color:'#ffc800'}));m.rotation.x=1.5708;m.position.set(x,y,z);S.add(m);coins.push(m);
   if(b.life>0)setTimeout(()=>{m.visible=false},b.life*1000)}
  else{const src=e.mesh&&e.mesh.geometry?e.mesh:(e.mesh&&e.mesh.children&&e.mesh.children[0]);const geo=(src&&src.geometry)||new THREE.BoxGeometry(1,1,1),mat=(src&&src.material)||new THREE.MeshLambertMaterial({color:'#a8743a'}),m=new THREE.Mesh(geo,mat);if(e.mesh)m.scale.copy(e.mesh.scale);m.position.set(x,y,z);S.add(m);
   if(b.life>0)setTimeout(()=>{S.remove(m)},b.life*1000)}break}
 case 'spin':{const e=ent[b.o];if(e)e.spin=b.deg;break}
 case 'phys':ph[b.k=='speed'?'spd':b.k=='jump'?'jmp':'grav']=b.n;break;
 case 'show':{const e=ent[b.o];if(e)setVis(e,b.on!='hide');break}
 case 'color':{const e=ent[b.o];if(e&&e.mesh.material&&e.mesh.material.color)e.mesh.material.color.set(b.c);break}
 case 'move':{const e=ent[b.o];if(e){if(b.s<=0)moveEnt(e,b.x,b.y,b.z);else{tws.push({e,dx:b.x,dy:b.y,dz:b.z,t0:now,d:b.s*1000,ax:0,ay:0,az:0});run.wait=now+b.s*1000}}break}
 case 'sky':{if(S.background&&S.background.set)S.background.set(b.c);if(S.fog&&S.fog.color)S.fog.color.set(b.c);break}
 case 'rep':run.stack.push({list:b.b||[],i:0,n:b.n,rep:1});break;
 case 'forever':run.stack.push({list:b.b||[],i:0,fe:1});break;
 case 'if':run.stack.push({list:(scCond(b.c)?b.y:b.n)||[],i:0});break;
 case 'stop':run.stack.length=0;break}}
function scStep(run,now){let bud=120;while(bud-->0){if(run.wait>now)return;const f=run.stack[run.stack.length-1];if(!f){run.done=1;return}
 if(f.until){if(scCond(f.until)){run.stack.pop();continue}return}
 if(f.i>=f.list.length){if(f.rep&&--f.n>0){f.i=0;continue}if(f.fe){f.i=0;return}run.stack.pop();continue}scExec(f.list[f.i++],run,now)}}
function scTrig(s){if(!s.st.run){s.st.run=true;runs.push({stack:[{list:s.b||[],i:0}],wait:0,s})}}
function scAct(k){SCR.forEach(s=>{if(s.h&&s.h.t=='action'&&+s.h.k==k)scTrig(s)})}
function SCtick(t,dt){for(let i=tws.length-1;i>=0;i--){const w=tws[i],k=Math.min(1,(t-w.t0)/w.d),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2,tx=w.dx*e,ty=w.dy*e,tz=w.dz*e;moveEnt(w.e,tx-w.ax,ty-w.ay,tz-w.az);w.ax=tx;w.ay=ty;w.az=tz;if(k>=1)tws.splice(i,1)}
 for(const k in ent){const e=ent[k];if(e.spin&&e.mesh)e.mesh.rotation.y+=e.spin*.01745*dt}
 const a1=!!(TK.ta1||keys['g']),a2=!!(TK.ta2||keys['h']);if(a1&&!pa1)scAct(1);if(a2&&!pa2)scAct(2);pa1=a1;pa2=a2;
 SCR.forEach(s=>{const h=s.h||{},st=s.st;
  if(h.t=='start'){if(!st.started){st.started=true;scTrig(s)}}
  else if(h.t=='timer'){if(!st.tn)st.tn=t+h.n*1000;if(t>=st.tn){st.tn=t+h.n*1000;scTrig(s)}}
  else if(h.t=='score'){if(SV.score>=h.n){if(!st.fired){st.fired=true;scTrig(s)}}else st.fired=false}
  else if(h.t=='varReach'){const v=SV[h.v]||0,ok=h.o=='<'?v<=h.n:v>=h.n;if(ok){if(!st.fired){st.fired=true;scTrig(s)}}else st.fired=false}
  else if(h.t=='touch'){const e=ent[h.o];if(e&&!(e.q?e.q.hid:!e.mesh.visible)){const tc=scTouch(e);if(tc&&!st.touching&&t>st.cool){st.cool=t+300;scTrig(s)}st.touching=tc}}});
 for(let i=runs.length-1;i>=0;i--){scStep(runs[i],t);if(runs[i].done){runs[i].s.st.run=false;runs.splice(i,1)}}}
function scChat(text){const low=text.trim().toLowerCase();SCR.forEach(s=>{if(s.h&&s.h.t=='chatCmd'&&low===String(s.h.m||'').toLowerCase())scTrig(s)})}
function animP(g,dt,t,hs,sp,gr,vy,atk){const Lb=g.userData.l;if(!Lb)return 0;
 const ex=Lb.ll.rotation,ey=Lb.rl.rotation,ez=Lb.la.rotation,ew=Lb.ra.rotation,sh=Math.min(1,hs/Math.max(1,sp)),kq=1-Math.exp(-14*dt),br=Math.sin(t*.0019);
 g.userData.gt=(g.userData.gt||0)+dt*hs*2.3;const gt=g.userData.gt;let tll=0,trl=0,tla=0,tra=0,tlt=0,bob=0;
 if(!gr){if(vy>1){tll=-.45;trl=.35;tla=-2.05;tra=-2.25;tlt=.12}else{tll=.32;trl=-.5;tla=-1.15;tra=-1.15;tlt=-.07}}
 else if(sh>.12){const sg=Math.sin(gt)*sh;tll=sg*.95;trl=-sg*.95;tla=-sg*1.1-.1;tra=sg*1.1-.1;tlt=.16*sh;bob=Math.abs(Math.cos(gt))*.06*sh}
 else{tll=br*.03;trl=-br*.03;tla=-.12+br*.06;tra=-.12-br*.06;tlt=br*.012;bob=br*.018}
 const fq=atk!=null&&t-atk<220;if(fq){tra=-1.5;tlt*=.4}
 ex.x+=(tll-ex.x)*kq;ey.x+=(trl-ey.x)*kq;ez.x+=(tla-ez.x)*kq;ew.x+=(tra-ew.x)*kq;
 if(fq)ew.x=-1.5;
 g.rotation.order='YXZ';g.rotation.x+=(tlt-g.rotation.x)*kq;return bob}
function remAnim(o,m,dt,t,sp){const tt=o.t;if(!tt)return;
 if(o.pt!==tt){const dtt=Math.max(.06,(t-(o.ptAt||t-100))/1000),pv=o.pt||tt;o.svx=(tt.x-pv.x)/dtt;o.svz=(tt.z-pv.z)/dtt;o.svy=(tt.y-pv.y)/dtt;o.pt=tt;o.ptAt=t}
 m.position.y-=(o.bob||0);m.position.x+=(tt.x-m.position.x)*.3;m.position.y+=(tt.y-m.position.y)*.3;m.position.z+=(tt.z-m.position.z)*.3;m.rotation.y=tt.r;
 const hs=Math.min(24,Math.hypot(o.svx||0,o.svz||0)),vy=Math.max(-40,Math.min(40,o.svy||0)),gy=Math.abs(vy)<2?1:0;
 o.bob=animP(m,dt,t,hs,sp,gy,vy,null)||0;m.position.y+=o.bob}
const loop=t=>{raf=requestAnimationFrame(loop);const dt=Math.min(.05,(t-t0)/1000);t0=t;
  const kb=k=>!ST.dead&&keys[k],tk=k=>!ST.dead&&TK[k],fw=kb('w')||kb('arrowup')||tk('tf'),bk=kb('s')||kb('arrowdown')||tk('tb'),lf=kb('a')||kb('arrowleft')||tk('tl'),rt=kb('d')||kb('arrowright')||tk('tr'),jp=!!(kb(' ')||tk('tj'));
  const ax=(rt?1:0)-(lf?1:0),az=(bk?1:0)-(fw?1:0),im=Math.hypot(ax,az)||1,sp=g.spd||7,ix=ax/im*sp,iz=az/im*sp,cs=Math.cos(cy),sn_=Math.sin(cy),tvx=ix*cs+iz*sn_,tvz=-ix*sn_+iz*cs,hasIn=!!(ax||az),kk=gr?(hasIn?16:20):(hasIn?5:1.2),aa=1-Math.exp(-kk*dt);
  vhx+=(tvx-vhx)*aa;vhz+=(tvz-vhz)*aa;if(!hasIn&&Math.hypot(vhx,vhz)<.05){vhx=0;vhz=0}
  p.x+=vhx*dt;p.z+=vhz*dt;const hs=Math.hypot(vhx,vhz);
  if(hs>.4&&t-atk>250){const ta=Math.atan2(vhx,vhz);let dd=ta-pm.rotation.y;dd=Math.atan2(Math.sin(dd),Math.cos(dd));pm.rotation.y+=dd*Math.min(1,16*dt)}
  pl.forEach(q=>{if(q.t=='crumble'&&q.cr){const a=t-q.cr;if(a>900&&!q.off){q.off=1;q.mesh.visible=false}if(a>3500){q.off=0;q.cr=0;q.mesh.visible=true}}if(q.mv){const o=Math.sin(t*.001*q.mv.s)*q.mv.d,a=q.mv.a,nx=q.bx+(a=='x'?o:0),ny=q.by+(a=='y'?o:0),nz=q.bz+(a=='z'?o:0),dx=nx-q.x,dy=ny-q.y,dz=nz-q.z;q.x=nx;q.y=ny;q.z=nz;q.mesh.position.set(nx,ny-q.th/2,nz);if(q===ride){p.x+=dx;p.y+=dy;p.z+=dz}}});ride=null;
  pl.forEach(q=>{if(q.off)return;const th=q.th||.5,hx=q.sx/2+.35,hz=q.sz/2+.35;if(p.y<q.y-.12&&p.y+2.6>q.y-th&&Math.abs(p.x-q.x)<hx&&Math.abs(p.z-q.z)<hz){if(q.t=='lava'){rsp();return}if(gr&&q.y-p.y<=.55){p.y=q.y;p.vy=0;return}const ox=hx-Math.abs(p.x-q.x),oz=hz-Math.abs(p.z-q.z);if(ox<oz){p.x=q.x+Math.sign(p.x-q.x||1)*hx;vhx=0}else{p.z=q.z+Math.sign(p.z-q.z||1)*hz;vhz=0}}});
  const py=p.y;p.vy=Math.max(-55,p.vy-(g.grav||22)*dt);p.y+=p.vy*dt;let on=0;
  pl.forEach((q,i)=>{if(!q.off&&p.vy<=0&&py>=q.y-.1&&p.y<=q.y&&Math.abs(p.x-q.x)<=q.sx/2+.3&&Math.abs(p.z-q.z)<=q.sz/2+.3){p.y=q.y;p.vy=0;on=1;ride=q;if(q.t=='crumble'&&!q.cr)q.cr=t;if(g.cps&&i&&i%5==0){sp0.x=q.x;sp0.y=q.y;sp0.z=q.z}if(q.t=='lava'){rsp();msg('Ouch!');on=0;return}if(q.t=='bounce'){p.vy=17;on=0;jumping=true}if(q.t=='check'){sp0.x=q.x;sp0.y=q.y;sp0.z=q.z}if((i==last||q.t=='goal')&&!done){done=1;got+=100;msg('You won!')}}});
  gr=!!on;if(on){jumping=false;coy=0}else coy+=dt;
  jbuf=(jp&&!jprev)?.12:Math.max(0,jbuf-dt);jprev=jp;
  if((jp||jbuf>0)&&!jumping&&(on||coy<.1)&&p.vy<=.5){p.vy=g.jmp||9;jumping=true;jbuf=0;on=0;gr=false;coy=9}else if(jumping&&!jp&&p.vy>3.5)p.vy=3.5;
  if(p.y<(g.killY||-15))rsp();
  coins.forEach(c=>{if(!c.visible)return;c.rotation.z+=dt*3;if(Math.hypot(c.position.x-p.x,c.position.y-p.y-1.3,c.position.z-p.z)<1.8){c.visible=false;got+=5}});
  $('#gh').textContent='⏱ '+((t-ts)/1000|0)+'s   Coins: '+got;if(scUses)$('#svd').textContent='Score: '+SV.score;
  PVT(t,dt);if(hasScr)SCtick(t,dt);const bob=animP(pm,dt,t,hs,sp,gr,p.vy,atk)||0;pm.position.set(p.x,p.y+bob,p.z);
  const ca=1-Math.exp(-14*dt),cb=1-Math.exp(-9*dt);cam3.x+=(p.x-cam3.x)*ca;cam3.z+=(p.z-cam3.z)*ca;cam3.y+=(p.y-cam3.y)*cb;
  const CP=camPose();C.position.set(CP.x,CP.y,CP.z);C.lookAt(CP.x+CP.fx,CP.y+CP.fy,CP.z+CP.fz);
  if(rr&&t-hb>100){hb=t;rr.presence({x:+p.x.toFixed(2),y:+p.y.toFixed(2),z:+p.z.toFixed(2),r:+pm.rotation.y.toFixed(2),gear:me.gear||{},av:me.av||null}).catch(()=>{})}Object.values(rem).forEach(o=>remAnim(o,o.m,dt,t,sp));R.render(S,C)};
 raf=requestAnimationFrame(loop);
 $('#ex').onclick=()=>{if(off)off();if(rr)rr.leave();setSrv(null);$('#pvp').style.display='none';$('#padx').style.display='none';$('#sbd').innerHTML='';$('#cbox').innerHTML='';$('#chatw').style.display='none';cancelAnimationFrame(raf);removeEventListener('keydown',kd);removeEventListener('keyup',ku);R.dispose();R.domElement.remove();W.style.display='none';
  navigate()}}

/* ---------- views ---------- */
function authView(mode){
 app.innerHTML=`<div class="card auth"><h1>RUKO</h1><p class="mut">Play, build and dress up in 3D.</p><div class="tabs"><button data-m="in" class="${mode=='in'?'on':''}">Log in</button><button data-m="up" class="${mode=='up'?'on':''}">Sign up</button></div><input id="u" placeholder="Username" autocomplete="username"><input id="p" type="password" placeholder="Password (6+ characters)" autocomplete="${mode=='in'?'current-password':'new-password'}"><div id="err" class="err"></div><button class="pri" id="go" style="width:100%">${mode=='in'?'Log in':'Create account'}</button></div>`;
 app.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>authView(b.dataset.m));
 $('#go').onclick=async()=>{const n=$('#u').value.trim(),p=$('#p').value,k=n.toLowerCase(),U=users(),E=t=>$('#err').textContent=t;
  if(mode=='up'){if(!/^\w{3,16}$/.test(n))return E('Username: 3–16 letters, numbers or underscores.');if(k=='ruko')return E('That name is reserved.');if(p.length<4)return E('Password needs 4+ characters.');if(U[k])return E('Username taken.');
   U[k]={name:n,h:await hash(p),coins:500,owned:['r1'],worn:'r1'};ls.set('ruko_users',U)}
  else if(!U[k]||U[k].h!==await hash(p))return E('Wrong username or password.');
  ls.set('ruko_session',k);location.hash='#/';render()}}
function applyTheme(){const t=ls.get('ruko_theme','auto');if(t=='auto')delete document.documentElement.dataset.theme;else document.documentElement.dataset.theme=t}
applyTheme();
function render(){closeMore();document.documentElement.style.scrollPaddingTop='';clearInterval(CHT);clearInterval(DMT);const me=cur();$('#top').style.display=me?'flex':'none';if(!me)return authView('in');
 $('#coins').textContent='🪙 '+me.coins;$('#adm').style.display=me.admin||me.mod?'':'none';$('#adm').querySelector('.lb').textContent=(me.admin?'Admin':'Staff')+(me.pend?' ('+me.pend+')':'');buildMoreSheet(me);const[a,b]=location.hash.slice(2).split('/');
 if(a=='catalog')catalog();else if(a=='avatar')avatar();else if(a=='servers')servers();else if(a=='admin'&&(me.admin||me.mod))adminView();else if(a=='chat')chatView();else if(a=='friends')friendsView();else if(a=='messages')messagesView(b?decodeURIComponent(b):null);else if(a=='settings')settingsView();else if(a=='user')profileView(decodeURIComponent(b||me.name));else if(a=='players')playersView();else if(a=='hat')hatPage(b);else if(a=='create')create();else home();scrollTo(0,0)}
function home(){const me=cur();
 app.innerHTML=`<h2>Welcome, ${esc(me.name)} <button id="rf" style="font-size:13px;padding:4px 10px;vertical-align:middle">↻ Refresh</button></h2><div class="grid">${games().map(g=>`<div class="card"><div class="gcard" style="background:linear-gradient(${esc(g.sky)},${esc(g.ground)})"></div><b>${esc(g.name)}</b><div class="mut" style="font-size:13px;min-height:36px">${esc(g.desc||'')}</div><div class="mut" style="font-size:12px">By <u data-u="${esc(g.creator)}" style="cursor:pointer">${esc(g.creator)}</u></div><button class="pri" data-g="${g.id}" style="width:100%;margin-top:8px">Play</button></div>`).join('')}</div>`;
 app.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>playAuto(games().find(g=>g.id==b.dataset.g)));app.querySelectorAll('[data-solo]').forEach(b=>b.onclick=()=>play(games().find(g=>g.id==b.dataset.solo)))}
function catalog(){const me=cur();
 app.innerHTML=`<h2>Catalog <button id="rf" style="font-size:13px;padding:4px 10px;vertical-align:middle">↻ Refresh</button></h2><div class="grid">${hats().map(h=>`<div class="card tile" data-h="${h.id}"><img src="${thumb(h)}" alt=""><b>${esc(h.name)}</b><div class="mut" style="font-size:12px">By ${esc(h.creator)}</div><div>${me.owned.includes(h.id)?'✅ Owned':h.off?'Off sale':'🪙 '+h.price}</div></div>`).join('')}</div>`;
 app.querySelectorAll('[data-h]').forEach(t=>t.onclick=()=>location.hash='#/hat/'+t.dataset.h)}
function hatPage(id){const me=cur(),h=hats().find(x=>x.id==id);if(!h)return catalog();const own=me.owned.includes(id);
 app.innerHTML=`<button id="bk">← Catalog</button><div class="hat" style="margin-top:12px"><img src="${thumb(h)}" alt=""><div><h2 style="margin-top:0">${esc(h.name)} ${h.special?'<span style="font-size:13px;background:#ffc800;color:#000;border-radius:8px;padding:2px 8px;vertical-align:middle">✨ SPECIAL</span>':''}</h2><div class="mut">Created by <b data-u="${esc(h.creator)}" style="color:var(--tx);cursor:pointer;text-decoration:underline">${esc(h.creator)}</b></div><div class="stat"><div><b>${sales(h).toLocaleString()}</b><span class="mut">sales</span></div><div><b>🪙 ${h.price}</b><span class="mut">price</span></div></div>
 ${own?`<button class="pri" id="eq" ${typeof eqd!='undefined'?(eqd?'disabled':''):(me.worn==id?'disabled':'')}>${typeof eqd!='undefined'?(eqd?'Equipped':'Equip'):(me.worn==id?'Equipped':'Equip')}</button>`:`<button class="pri" id="buy" ${h.off||me.coins<h.price?'disabled':''}>${h.off?'Off sale':me.coins<h.price?'Not enough Rukos':'Buy for 🪙 '+h.price}</button>`}
 <p class="mut" style="font-size:13px">Equipped hats show up in every 3D game. Creators earn 50% of every sale.</p></div></div>`;
 $('#bk').onclick=()=>location.hash='#/catalog';
 if($('#eq'))$('#eq').onclick=()=>{if(h.kind=='shirt')me.av={...(me.av||{}),tee:id};else me.gear={...(me.gear||{}),[h.slot||'head']:id};saveUser(me);render()};
 if($('#buy'))$('#buy').onclick=()=>{const U=users(),k=key(),u=U[k];if(u.coins<h.price)return;u.coins-=h.price;u.owned.push(id);const c=h.creator.toLowerCase();if(c!=k&&U[c])U[c].coins+=h.price;ls.set('ruko_users',U);const S=ls.get('ruko_sales',{});S[id]=(S[id]||0)+1;ls.set('ruko_sales',S);shareBuy(id);render()}}
function create(tab){tab=tab||CTAB;CTAB=tab;const me=cur();
 app.innerHTML=`<h2>Creator Studio</h2><div class="tabs"><button data-t="hat" class="${tab=='hat'?'on':''}">Hat / Accessory</button><button data-t="game" class="${tab=='game'?'on':''}">Game</button></div>
 ${tab=='hat'?`<div class="hat"><div class="card"><img id="pv" alt=""></div><div class="card">
 <label>Name</label><input id="hn" maxlength="20" value="My Hat"><label>Shape</label><select id="ht"><option>cylinder</option><option>cone</option><option>dome</option><option>box</option><option>ring</option></select>
 <label>Color</label><input id="hc" type="color" value="#5b4bff"><label>Height</label><input id="hh" type="range" min=".2" max="1.4" step=".05" value=".6"><label>Width</label><input id="hw" type="range" min=".5" max="1.6" step=".05" value="1">
 <label><input id="hb" type="checkbox"> Brim</label><br><label>Price (Rukos)</label><input id="hp" type="number" min="0" max="1000" value="100"><div id="err" class="err"></div><button class="pri" id="pub" style="width:100%">Publish hat</button></div></div>`
 :`<div class="card" style="max-width:480px"><label>Name</label><input id="cn" maxlength="24" value="My Game"><label>Description</label><input id="cd" maxlength="80" value="A game I made."><label>Type</label><select id="cm"><option value="obby">Obby (climb to the top)</option><option value="coins">Coin collector</option><option value="roam">Free roam</option></select>
 <label>Sky color</label><input id="cs" type="color" value="#8fd3ff"><label>Ground color</label><input id="cg" type="color" value="#5bd16a"><label>Size (5–40 platforms)</label><input id="cz" type="number" min="5" max="40" value="16"><label>Level seed</label><input id="cx" type="number" value="${Math.floor(Math.random()*999)}">
 <div id="err" class="err"></div><div style="display:flex;gap:8px"><button id="tst" style="flex:1">Test play</button><button class="pri" id="pub" style="flex:1">Publish game</button></div></div>`}`;
 app.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>create(b.dataset.t));
 if(tab=='hat'){const spec=()=>({id:'h'+Date.now(),name:$('#hn').value.trim()||'Untitled',creator:me.name,price:Math.max(0,Math.min(1000,+$('#hp').value||0)),type:$('#ht').value,color:$('#hc').value,h:+$('#hh').value,w:+$('#hw').value,brim:$('#hb').checked?1:0,base:0});
  const pv=()=>$('#pv').src=thumb(spec());app.querySelectorAll('.card input,.card select').forEach(i=>i.oninput=pv);pv();
  $('#pub').onclick=()=>{const h=spec();ls.set('ruko_hats',[...ls.get('ruko_hats',[]),h]);location.hash='#/hat/'+h.id}}
 else{const spec=()=>({id:'c'+Date.now(),name:$('#cn').value.trim()||'Untitled',desc:$('#cd').value.trim(),creator:me.name,mode:$('#cm').value,sky:$('#cs').value,ground:$('#cg').value,size:+$('#cz').value,seed:+$('#cx').value||1});
  $('#tst').onclick=()=>play(spec());$('#pub').onclick=()=>{ls.set('ruko_games',[...ls.get('ruko_games',[]),spec()]);location.hash='#/'}}}

