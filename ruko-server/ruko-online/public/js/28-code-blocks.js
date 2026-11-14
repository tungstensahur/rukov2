/* ---------- v28: advanced code blocks (variables, maths, measuring, loops) ---------- */
/* These are the "thinking" blocks: they do maths on values, measure things in the level, read
   keys, run a stopwatch and repeat while something is true. All of it is guarded, so a missing
   block never stops a game from running. */
(function(){
 if(window.RKCODE28)return;
 window.RKCODE28=1;

 const NUM2={min:-9999,max:9999,step:1};
 const push=(arr,x)=>{try{if(arr&&!arr.some(y=>y[0]===x[0]))arr.push(x)}catch(e){}};

 try{
  ['D','E','F'].forEach(k=>{push(VALS,[k,'variable '+k]);push(SCORV,[k,'variable '+k])});
  push(CATS,['code','Code','#4b9bff']);
 }catch(e){}

 const CB={
  clampVar:{c:'code',ic:'📏',n:'Keep a variable in range',f:[['t','Keep '],['v','sel',{o:SCORV}],['t',' between '],['lo','num',NUM2],['t',' and '],['hi','num',NUM2]],d:{v:'A',lo:0,hi:10}},
  copyVar:{c:'code',ic:'📋',n:'Copy one variable into another',f:[['t','Set '],['v','sel',{o:SCORV}],['t',' to whatever '],['v2','sel',{o:SCORV}],['t',' is']],d:{v:'A',v2:'score'}},
  swapVar:{c:'code',ic:'🔀',n:'Swap two variables',f:[['t','Swap '],['v','sel',{o:SCORV}],['t',' and '],['v2','sel',{o:SCORV}]],d:{v:'A',v2:'B'}},
  roundVar:{c:'code',ic:'🔄',n:'Round a variable',f:[['t','Round '],['v','sel',{o:SCORV}],['t',' to the nearest '],['step','num',{min:.1,max:100,step:.1}]],d:{v:'A',step:1}},
  absVar:{c:'code',ic:'➕',n:'Make a variable positive',f:[['t','Make '],['v','sel',{o:SCORV}],['t',' positive']],d:{v:'A'}},
  powVar:{c:'code',ic:'🧮',n:'Raise a variable to a power',f:[['t','Set '],['v','sel',{o:SCORV}],['t',' to itself to the power of '],['x','num',{min:-4,max:4,step:.5}]],d:{v:'A',x:2}},
  modVar:{c:'code',ic:'➗',n:'Remainder of a variable',f:[['t','Set '],['v','sel',{o:SCORV}],['t',' to its remainder after dividing by '],['x','num',{min:1,max:100,step:1}]],d:{v:'A',x:2}},
  distVar:{c:'code',ic:'📐',n:'Distance to an object',f:[['t','Set '],['v','sel',{o:SCORV}],['t',' to the distance from the player to '],['o','obj']],d:{v:'A',o:''}},
  posVar:{c:'code',ic:'🧭',n:'Object position into a variable',f:[['t','Set '],['v','sel',{o:SCORV}],['t',' to the '],['ax','sel',{o:[['x','X'],['y','Y'],['z','Z']]}],['t',' of '],['o','obj']],d:{v:'A',ax:'x',o:''}},
  angleVar:{c:'code',ic:'🧲',n:'Angle from the player to an object',f:[['t','Set '],['v','sel',{o:SCORV}],['t',' to the angle from the player to '],['o','obj'],['t',' in degrees']],d:{v:'A',o:''}},
  nearCount:{c:'code',ic:'🔢',n:'Count objects near the player',f:[['t','Set '],['v','sel',{o:SCORV}],['t',' to how many objects are within '],['r','num',{min:1,max:100,step:1}],['t',' of the player']],d:{v:'A',r:10}},
  keyHeld:{c:'code',ic:'⌨️',n:'Is a key held down',f:[['t','Set '],['v','sel',{o:SCORV}],['t',' to 1 while '],['k','sel',{o:[['space','Space'],['shift','Shift'],['control','Ctrl'],['f','F'],['e','E'],['r','R']]}],['t',' is held']],d:{v:'A',k:'space'}},
  timerReset:{c:'code',ic:'⏱',n:'Restart the stopwatch',f:[['t','Restart the stopwatch']],d:{}},
  timerVar:{c:'code',ic:'⏲',n:'Stopwatch into a variable',f:[['t','Set '],['v','sel',{o:SCORV}],['t',' to the stopwatch seconds']],d:{v:'A'}},
  hudMix:{c:'code',ic:'🧾',n:'Show text next to a value',f:[['t','Show '],['m','text',{ph:'Score'}],['t',' and then '],['v','sel',{o:VALS}],['t',' on screen']],d:{m:'Score',v:'score'}},
  whileVar:{c:'control',ic:'🔁',n:'Repeat while…',cont:1,f:b=>[['t','Repeat while ']].concat(condF(b.c)),d:{c:{v:'score',o:'>',n:0,v2:''},b:[]}}
 };
 try{Object.assign(BLK,CB)}catch(e){}

 /* ---------- little helpers ---------- */
 let t0=performance.now();
 const nz=(v,d)=>{const n=parseFloat(v);return isFinite(n)?n:d};
 const isVar=v=>v==='score'||/^[A-F]$/.test(v);
 function getV(X,v){
  if(!X)return 0;
  if(!isVar(v)){
   if(v==='px')return X.p.x;
   if(v==='pz')return X.p.z;
   if(v==='y')return X.p.y;
   if(v==='time')return (performance.now()-t0)/1000;
   if(v==='coins')return X.got||0;
   if(v==='hp')return X.ST?(X.ST.hp|0):0;
   if(v==='kills')return X.ST?(X.ST.k|0):0;
   if(v==='deaths')return X.ST?(X.ST.d|0):0;
   return 0;
  }
  if(v==='score')return X.SV.score||0;
  return X.SV[v]||0;
 }
 function setV(X,v,n){
  if(!X||!isVar(v))return;
  if(v==='score')X.SV.score=n;
  else X.SV[v]=n;
 }
 function cond(X,c){
  if(!c)return false;
  if(c.v==='chance')return Math.random()*100<nz(c.n,0);
  const a=getV(X,c.v),b=c.v2?getV(X,c.v2):nz(c.n,0);
  return c.o==='>'?a>b:c.o==='<'?a<b:Math.abs(a-b)<.001;
 }
 function hudEl(){
  let el=document.getElementById('rk24hud');
  if(el)return el;
  const g=document.getElementById('game');
  if(!g)return null;
  el=document.createElement('div');
  el.id='rk24hud';
  el.style.cssText='position:absolute;top:calc(56px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);max-width:80vw;text-align:center;color:#fff;font-weight:800;font-size:16px;text-shadow:0 2px 6px #000;pointer-events:none;z-index:6;white-space:pre-wrap';
  g.appendChild(el);
  return el;
 }
 const fmt=n=>String(Math.round(n*10)/10);

 /* ---------- runtime ---------- */
 const cases={
  clampVar(X,b){const lo=nz(b.lo,0),hi=nz(b.hi,10);setV(X,b.v,Math.max(Math.min(lo,hi),Math.min(Math.max(lo,hi),getV(X,b.v))))},
  copyVar(X,b){setV(X,b.v,getV(X,b.v2))},
  swapVar(X,b){const a=getV(X,b.v),c=getV(X,b.v2);setV(X,b.v,c);setV(X,b.v2,a)},
  roundVar(X,b){const s=Math.max(.1,nz(b.step,1));setV(X,b.v,Math.round(getV(X,b.v)/s)*s)},
  absVar(X,b){setV(X,b.v,Math.abs(getV(X,b.v)))},
  powVar(X,b){setV(X,b.v,Math.pow(getV(X,b.v),nz(b.x,2)))},
  modVar(X,b){const d=nz(b.x,2)||1;setV(X,b.v,getV(X,b.v)%d)},
  distVar(X,b){const e=b.o&&X.ent?X.ent[b.o]:null;if(!e||!X.entPos)return;const c=X.entPos(e);setV(X,b.v,Math.hypot(c.x-X.p.x,c.y-X.p.y,c.z-X.p.z))},
  posVar(X,b){const e=b.o&&X.ent?X.ent[b.o]:null;if(!e||!X.entPos)return;const c=X.entPos(e);setV(X,b.v,c[b.ax||'x']||0)},
  angleVar(X,b){const e=b.o&&X.ent?X.ent[b.o]:null;if(!e||!X.entPos)return;const c=X.entPos(e);setV(X,b.v,Math.atan2(X.p.x-c.x,X.p.z-c.z)*180/Math.PI)},
  nearCount(X,b){const r=nz(b.r,10);let n=0;if(X.ent&&X.entPos){for(const u in X.ent){const c=X.entPos(X.ent[u]);if(Math.hypot(c.x-X.p.x,c.y-X.p.y,c.z-X.p.z)<=r)n++}}setV(X,b.v,n)},
  keyHeld(X,b){const k=b.k==='space'?' ':String(b.k||'space').toLowerCase();setV(X,b.v,X.keys&&X.keys[k]?1:0)},
  timerReset(){t0=performance.now()},
  timerVar(X,b){setV(X,b.v,(performance.now()-t0)/1000)},
  hudMix(X,b){const el=hudEl();if(!el)return;el.textContent=(b.m?b.m+' ':'')+fmt(getV(X,b.v))},
  whileVar(X,b,run){if(!cond(X,b.c))return;if(!run||!run.stack)return;run.stack.push({list:b.b||[],i:0,wl:b.c})}
 };

 try{
  if(typeof SKX!=='undefined'&&SKX&&typeof SKX.run==='function'){
   const prev=SKX.run.bind(SKX);
   SKX.run=function(b,run,now,X){
    const f=b&&cases[b.t];
    if(f){try{f(X||{},b,run,now)}catch(e){}return}
    return prev(b,run,now,X);
   };
  }
 }catch(e){}

 window.RKCODE={blocks:CB,cases};
})();
