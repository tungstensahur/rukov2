/* ---------- v33: more materials, more things to place, and a simpler block palette ---------- */
/* Three upgrades for the Studio:
   1. Ten new materials, drawn as tileable textures, so platforms can be wood, metal, ice and so on.
   2. More decorations in the place panel (every shape the item editor knows).
   3. The block picker now opens with a Simple / Advanced switch, so new builders see a short list
      of everyday blocks and experienced builders can reach the full set. */
(function(){
 if(window.RKSTUDIO33)return;
 window.RKSTUDIO33=1;

 /* ---- 1. materials ---- */
 const NAMES={wood:'Wood',metal:'Metal',tiles:'Tiles',checker:'Checker',ice:'Ice',sand:'Sand',marble:'Marble',lava:'Lava',neon:'Neon grid',leaves:'Leaves'};
 try{Object.assign(MATN,NAMES)}catch(e){}

 const paintMat=(name)=>{
  const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
  const rnd=(a,b)=>a+Math.random()*(b-a);
  if(name=='wood'){
   x.fillStyle='#a97b48';x.fillRect(0,0,128,128);
   for(let i=0;i<7;i++){const y=i*18+rnd(-2,2);x.fillStyle='rgba(120,80,40,.55)';x.fillRect(0,y,128,2);
    x.fillStyle='rgba(190,150,100,.35)';x.fillRect(0,y+3,128,1)}
   for(let i=0;i<160;i++){x.fillStyle='rgba(90,60,30,.16)';x.fillRect(rnd(0,128),rnd(0,128),rnd(2,14),1)}
  }else if(name=='metal'){
   x.fillStyle='#a9b0ba';x.fillRect(0,0,128,128);
   for(let i=0;i<128;i++){const g=150+Math.sin(i*.6)*40;x.fillStyle='rgb('+(g|0)+','+((g+6)|0)+','+((g+14)|0)+')';x.fillRect(0,i,128,1)}
   x.fillStyle='rgba(255,255,255,.5)';x.fillRect(0,0,128,2);x.fillStyle='rgba(40,46,56,.5)';x.fillRect(0,126,128,2);
   for(const p of[[10,10],[118,10],[10,118],[118,118]]){x.fillStyle='#6d747f';x.beginPath();x.arc(p[0],p[1],4,0,7);x.fill()}
  }else if(name=='tiles'){
   x.fillStyle='#dfe4ea';x.fillRect(0,0,128,128);x.strokeStyle='#b8c0ca';x.lineWidth=2;
   for(let i=0;i<=128;i+=32){x.beginPath();x.moveTo(i,0);x.lineTo(i,128);x.moveTo(0,i);x.lineTo(128,i);x.stroke()}
   x.fillStyle='rgba(120,130,145,.18)';for(let i=0;i<60;i++)x.fillRect(rnd(0,128),rnd(0,128),2,2);
  }else if(name=='checker'){
   const s=16;for(let y=0;y<128;y+=s)for(let xx=0;xx<128;xx+=s){x.fillStyle=((xx/s+y/s)%2)?'#f2f4f8':'#3d4a63';x.fillRect(xx,y,s,s)}
  }else if(name=='ice'){
   x.fillStyle='#bfe9ff';x.fillRect(0,0,128,128);
   for(let i=0;i<24;i++){x.strokeStyle='rgba(255,255,255,'+rnd(.3,.8)+')';x.lineWidth=rnd(1,3);x.beginPath();
    let px=rnd(0,128),py=rnd(0,128);x.moveTo(px,py);for(let k=0;k<3;k++){px+=rnd(-40,40);py+=rnd(-40,40);x.lineTo(px,py)}x.stroke()}
   x.fillStyle='rgba(120,190,235,.35)';for(let i=0;i<40;i++)x.fillRect(rnd(0,128),rnd(0,128),3,3);
  }else if(name=='sand'){
   x.fillStyle='#e8d29a';x.fillRect(0,0,128,128);
   for(let i=0;i<900;i++){x.fillStyle=Math.random()<.5?'rgba(205,180,120,.5)':'rgba(250,240,200,.6)';x.fillRect(rnd(0,128),rnd(0,128),2,2)}
  }else if(name=='marble'){
   x.fillStyle='#f3f4f7';x.fillRect(0,0,128,128);
   for(let i=0;i<9;i++){x.strokeStyle='rgba(150,155,170,'+rnd(.2,.45)+')';x.lineWidth=rnd(1,2.5);x.beginPath();
    let px=rnd(-10,140),py=rnd(-10,140);x.moveTo(px,py);for(let k=0;k<6;k++){px+=rnd(-30,30);py+=rnd(6,26);x.lineTo(px,py)}x.stroke()}
  }else if(name=='lava'){
   x.fillStyle='#d8410a';x.fillRect(0,0,128,128);
   for(let i=0;i<70;i++){x.fillStyle=Math.random()<.5?'rgba(255,180,40,.55)':'rgba(120,20,0,.45)';
    x.beginPath();x.arc(rnd(0,128),rnd(0,128),rnd(3,12),0,7);x.fill()}
   x.strokeStyle='rgba(255,230,120,.7)';x.lineWidth=2;for(let i=0;i<10;i++){x.beginPath();x.moveTo(rnd(0,128),rnd(0,128));
    x.lineTo(rnd(0,128),rnd(0,128));x.stroke()}
  }else if(name=='neon'){
   x.fillStyle='#14162b';x.fillRect(0,0,128,128);
   x.strokeStyle='#00e5ff';x.lineWidth=3;x.shadowColor='#00e5ff';x.shadowBlur=8;
   for(let i=0;i<=128;i+=32){x.beginPath();x.moveTo(i,0);x.lineTo(i,128);x.stroke();x.beginPath();x.moveTo(0,i);x.lineTo(128,i);x.stroke()}
   x.shadowBlur=0;
  }else if(name=='leaves'){
   x.fillStyle='#2f6b33';x.fillRect(0,0,128,128);
   for(let i=0;i<130;i++){const a=rnd(0,6.283),r=rnd(4,9),px=rnd(0,128),py=rnd(0,128);
    x.fillStyle=['#3f8a3f','#4fa34a','#2d6031','#5cb254'][i%4];x.beginPath();
    x.ellipse(px,py,r,r*.6,a,0,7);x.fill()}
  }else return null;
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;
 };
 try{
  const prevTex=window.matTexture;
  window.matTexture=function(name){
   if(!name||name=='none')return null;
   if(!NAMES[name])return prevTex(name);
   if(matCache[name])return matCache[name];
   const t=paintMat(name);return t?(matCache[name]=t):null;
  };
 }catch(e){}

 /* ---- 2. more decorations in the place panel ---- */
 try{
  const decor=['prism','torus','pyramid','octa','ico','star','heart','cross','hexagon','spike','dome'];
  const label={prism:'Wedge',torus:'Ring',pyramid:'Pyramid',octa:'Diamond',ico:'Gem',star:'Star',heart:'Heart',cross:'Cross',hexagon:'Hex block',spike:'Spike',dome:'Dome'};
  const icon={prism:'◣',torus:'⭕',pyramid:'⛰',octa:'◆',ico:'💎',star:'⭐',heart:'❤',cross:'✚',hexagon:'⬡',spike:'🔺',dome:'◠'};
  const extra=decor.map(k=>['d',k,icon[k]||'▢',label[k]||k]);
  const at=INS.findIndex(g=>g[0]=='Decorations');
  if(at<0)INS.push(['More decorations',extra]);
  else{const L=INS[at][1];for(const it of extra)if(!L.some(q=>q[1]==it[1]))L.push(it)}
 }catch(e){}

 /* ---- 3. block palette with Simple / Advanced ---- */
 const SIMPLE=['say','wait','score','var','tp','respawn','win','sound','show','color','move','spin','shake','burst','if','rep','forever','waitUntil','stop','broadcast','clone','warp','sky','randvar','mathvar','heal','hurt','phys'];
 const build=(_t,title,groups,cb)=>{
  const all=groups.filter(g=>!/^Recently used$/.test(g.n));
  const recent=groups.find(g=>/^Recently used$/.test(g.n));
  const isSimple=id=>SIMPLE.indexOf(id)>=0;
  const draw=(mode,q)=>{
   const body=document.querySelector('#rkpal-body');if(!body)return;
   const want=k=>mode=='all'?true:(mode=='simple'?isSimple(k):!isSimple(k));
   const blocks=g=>g.items.filter(it=>want(it[0])&&(!q||(it[0]+' '+it[2]+' '+(BLK[it[0]]?BLK[it[0]].n:'')).toLowerCase().includes(q)));
   let html='';
   if(recent&&mode!='advanced'){const its=blocks(recent);if(its.length)html+=`<div class="stg" style="color:#7fe08a">Recently used</div><div class="palg">${its.map(([id,ic,l])=>`<button data-pick="${id}" style="--bc:#4a8f5a"><span>${ic}</span>${esc(l)}</button>`).join('')}</div>`}
   html+=all.map(g=>{const its=blocks(g);if(!its.length)return'';
    return `<div class="stg" style="color:${g.c||'#9aa0ad'}">${esc(g.n)}</div><div class="palg">${its.map(([id,ic,l])=>`<button data-pick="${id}" style="--bc:${g.c||'#555'}"><span>${ic}</span>${esc(l)}</button>`).join('')}</div>`}).join('');
   body.innerHTML=html||`<p class="mut" style="padding:8px">${mode=='simple'?'No simple blocks match. Try All blocks.':'Nothing matches that search.'}</p>`;
  };
  let m=document.getElementById('pal');if(m)m.remove();
  m=document.createElement('div');m.id='pal';m.className='stu-pal';
  m.innerHTML=`<div class="stu-palb"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;position:sticky;top:0;background:#232529;padding-bottom:4px;z-index:2"><b>${esc(title)}</b><button data-x="1">✕</button></div>
   <div class="chips" style="margin:0 0 6px">${[['simple','🟢 Simple'],['advanced','🔴 Advanced'],['all','All blocks']].map(([k,n])=>`<button data-mode="${k}" class="${k==='simple'?'on':''}">${n}</button>`).join('')}</div>
   <p class="mut" style="font-size:12px;margin:0 0 6px" id="rkpal-hint">Everyday blocks first. Switch to Advanced for loops, objects, variables and rules.</p>
   <input class="palq" id="palq" placeholder="Search all ${groups.length} groups of blocks…" autocomplete="off"><div id="rkpal-body"></div></div>`;
  document.body.appendChild(m);
  let mode='simple';
  draw(mode,'');
  m.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;
   m.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('on',x==b));
   const hint=document.querySelector('#rkpal-hint');
   if(hint)hint.textContent=mode=='simple'?'Everyday blocks first. Switch to Advanced for loops, objects, variables and rules.':mode=='advanced'?'The advanced set: rules, loops, objects, variables and the rest.':'Every block in the editor.';
   draw(mode,(document.querySelector('#palq')||{}).value?document.querySelector('#palq').value.trim().toLowerCase():'')});
  m.oninput=e=>{if(e.target.id=='palq')draw(mode,e.target.value.trim().toLowerCase())};
  m.onclick=e=>{if(e.target==m||e.target.closest('[data-x]'))return m.remove();const b=e.target.closest('[data-pick]');if(b){m.remove();cb(b.dataset.pick)}};
  const q=m.querySelector('#palq');if(q&&innerWidth>900)q.focus();
 };
 try{openPal=(title,groups,cb)=>build('pal',title,groups,cb)}catch(e){}

 window.RKSTUDIO33OK=1;
})();
