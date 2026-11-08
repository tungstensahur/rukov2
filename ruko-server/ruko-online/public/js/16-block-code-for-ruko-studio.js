/* ---------- v16: block code for Ruko Studio ---------- */
let CODEP=null,CF2={f:'all'};
const nuid=()=>'o'+Math.random().toString(36).slice(2,8);
const labelOf=(o,i)=>(o.nm||(o.k=='p'?(TYPEINFO[o.t]||TYPEINFO.solid)[1]:o.k=='c'?'Coin':o.k=='s'?'Spawn':o.k=='w'?'Weapon':'Decoration'))+' '+i;
const NUM={min:-9999,max:9999,step:1};
const condF=c=>{c=c||{};return[['c.v','sel',{o:[['score','score'],['A','variable A'],['B','variable B'],['C','variable C'],['y','player height'],['time','seconds played'],['coins','coins'],['chance','random chance']]}]].concat(c.v=='chance'?[['t',' is under '],['c.n','num',{min:0,max:100,step:5}],['t','%']]:[['c.o','sel',{o:[['>','is more than'],['<','is less than'],['=','is equal to']]}],['c.v2','sel',{o:[['','a fixed number'],['score','score'],['A','variable A'],['B','variable B'],['C','variable C']]}]].concat(c.v2?[]:[['c.n','num',NUM]]))};
const HATD={start:{ic:'🚩',n:'When the game starts',f:[['t','When the game starts']],d:{}},
 touch:{ic:'👆',n:'When a player touches…',f:[['t','When a player touches '],['o','obj']],d:{o:''}},
 timer:{ic:'⏰',n:'Every few seconds',f:[['t','Every '],['n','num',{min:.2,max:300,step:.5}],['t',' seconds']],d:{n:5}},
 action:{ic:'⚡',n:'When Action is pressed',f:[['t','When Action '],['k','sel',{o:[['1','1 (E key)'],['2','2 (Q key)']],num:1}],['t',' is pressed']],d:{k:1}},
 score:{ic:'🏆',n:'When score reaches…',f:[['t','When score reaches '],['n','num',NUM]],d:{n:10}},
 chatCmd:{ic:'💬',n:'When player types a chat command…',f:[['t','When player types '],['m','text',{ph:'!help'}],['t',' in server chat']],d:{m:'!help'}},
 varReach:{ic:'📦',n:'When a variable reaches…',f:[['t','When '],['v','sel',{o:[['A','A'],['B','B'],['C','C']]}],['o','sel',{o:[['>','reaches at least'],['<','drops to at most']]}],['n','num',NUM]],d:{v:'A',o:'>',n:10}}};
const BLK={
 say:{c:'looks',ic:'💬',n:'Say a message',f:[['t','Say '],['m','text',{ph:'Hello!'}],['t',' for '],['s','num',{min:0,max:30,step:.5}],['t',' sec']],d:{m:'Hello!',s:2}},
 sky:{c:'looks',ic:'🌤',n:'Set sky color',f:[['t','Set sky color to '],['c','col']],d:{c:'#ff9966'}},
 sound:{c:'sound',ic:'🔊',n:'Play a sound',f:[['t','Play sound '],['k','sel',{o:[['beep','Beep'],['coin','Coin'],['jump','Jump'],['boom','Boom'],['win','Win'],['hurt','Hurt']]}]],d:{k:'beep'}},
 wait:{c:'control',ic:'⏱',n:'Wait',f:[['t','Wait '],['s','num',{min:0,max:60,step:.5}],['t',' sec']],d:{s:1}},
 rep:{c:'control',ic:'🔁',n:'Repeat',cont:1,f:[['t','Repeat '],['n','num',{min:1,max:100,step:1}],['t',' times']],d:{n:3,b:[]}},
 forever:{c:'control',ic:'♾️',n:'Forever',cont:1,f:[['t','Forever']],d:{b:[]}},
 if:{c:'control',ic:'❓',n:'If … then',cont:2,f:b=>[['t','If ']].concat(condF(b.c)),d:{c:{v:'score',o:'>',n:5},y:[],n:[]}},
 stop:{c:'control',ic:'🛑',n:'Stop this script',f:[['t','Stop this script']],d:{}},
 tp:{c:'player',ic:'🌀',n:'Teleport player',f:b=>[['t','Teleport player to '],['w','sel',{o:[['spawn','a spawn point'],['obj','an object'],['pos','a position']]}]].concat(b.w=='obj'?[['o','obj']]:[]).concat(b.w=='pos'?[['t',' x'],['x','num',NUM],['t',' y'],['y','num',NUM],['t',' z'],['z','num',NUM]]:[]),d:{w:'spawn',o:'',x:0,y:5,z:0}},
 respawn:{c:'player',ic:'💫',n:'Respawn player',f:[['t','Respawn player']],d:{}},
 phys:{c:'player',ic:'🏃',n:'Change player ability',f:[['t','Set player '],['k','sel',{o:[['speed','speed'],['jump','jump power'],['gravity','gravity']]}],['t',' to '],['n','num',{min:2,max:80,step:1}]],d:{k:'speed',n:12}},
 win:{c:'player',ic:'🏁',n:'Win the game',f:[['t','Win the game, saying '],['m','text',{ph:'You won!'}]],d:{m:'You won!'}},
 score:{c:'vars',ic:'🏆',n:'Change score',f:[['op','sel',{o:[['add','Change score by'],['set','Set score to']]}],['n','num',NUM]],d:{op:'add',n:10}},
 var:{c:'vars',ic:'📦',n:'Change a variable',f:[['t','Variable '],['v','sel',{o:[['A','A'],['B','B'],['C','C']]}],['op','sel',{o:[['add','changes by'],['set','is set to']]}],['n','num',NUM]],d:{v:'A',op:'add',n:1}},
 show:{c:'objects',ic:'👁',n:'Show or hide',f:[['on','sel',{o:[['show','Show'],['hide','Hide']]}],['o','obj']],d:{on:'hide',o:''}},
 color:{c:'objects',ic:'🎨',n:'Change color',f:[['t','Set color of '],['o','obj'],['t',' to '],['c','col']],d:{o:'',c:'#ff4b4b'}},
 move:{c:'objects',ic:'↔️',n:'Move an object',f:[['t','Move '],['o','obj'],['t',' by x'],['x','num',NUM],['t',' y'],['y','num',NUM],['t',' z'],['z','num',NUM],['t',' over '],['s','num',{min:0,max:30,step:.5}],['t',' sec']],d:{o:'',x:0,y:4,z:0,s:1}},
 warp:{c:'objects',ic:'🌀',n:'Teleport an object',f:b=>[['t','Teleport '],['o','obj'],['t',' to ']].concat(b.w=='obj'?[['to','obj']]:[['t','x'],['x','num',NUM],['t','y'],['y','num',NUM],['t','z'],['z','num',NUM]]).concat([['w','sel',{o:[['pos','a position'],['obj','another object']]}]]),d:{o:'',w:'pos',to:'',x:0,y:0,z:0}},
 burst:{c:'fx',ic:'✨',n:'Particle burst',f:[['t','Burst at '],['o','obj'],['t',' color '],['c','col']],d:{o:'',c:'#ffd23f'}},
 broadcast:{c:'fx',ic:'📣',n:'Announce in chat',f:[['t','Announce '],['m','text',{ph:'Something happened!'}]],d:{m:'Something happened!'}},
 heal:{c:'player',ic:'❤️',n:'Heal player (PVP games)',f:[['t','Heal player by '],['n','num',{min:1,max:500,step:5}],['t',' HP']],d:{n:25}},
 hurt:{c:'player',ic:'💢',n:'Damage player (PVP games)',f:[['t','Damage player by '],['n','num',{min:1,max:500,step:5}],['t',' HP']],d:{n:25}},
 randvar:{c:'vars',ic:'🎲',n:'Random number into score/variable',f:[['t','Set '],['v','sel',{o:[['score','score'],['A','A'],['B','B'],['C','C']]}],['t',' to a random number from '],['a','num',NUM],['t',' to '],['b','num',NUM]],d:{v:'score',a:1,b:10}},
 mathvar:{c:'vars',ic:'🧮',n:'Combine two values into score/variable',f:[['t','Set '],['v','sel',{o:[['score','score'],['A','A'],['B','B'],['C','C']]}],['t',' to '],['a','sel',{o:[['score','score'],['A','A'],['B','B'],['C','C']]}],['op','sel',{o:[['add','+'],['sub','−'],['mul','×'],['div','÷']]}],['b','sel',{o:[['score','score'],['A','A'],['B','B'],['C','C']]}]],d:{v:'score',a:'score',op:'add',b:'A'}},
 waitUntil:{c:'control',ic:'⏳',n:'Wait until…',f:b=>[['t','Wait until ']].concat(condF(b.c)),d:{c:{v:'score',o:'>',n:5}}},
 clone:{c:'objects',ic:'🧬',n:'Spawn a copy near an object',f:[['t','Spawn a '],['kind','sel',{o:[['coin','coin (pick-up-able)'],['deco','copy']]}],['t',' near '],['o','obj'],['t',' offset x'],['x','num',NUM],['t','y'],['y','num',NUM],['t','z'],['z','num',NUM],['t',', gone after '],['life','num',{min:0,max:120,step:1}],['t',' sec (0 = stays)']],d:{kind:'coin',o:'',x:0,y:0,z:0,life:0}},
 spin:{c:'objects',ic:'🌀',n:'Spin an object',f:[['t','Spin '],['o','obj'],['t',' at '],['deg','num',{min:-720,max:720,step:10}],['t',' deg/sec (0 = stop)']],d:{o:'',deg:90}}};
const CATS=[['looks','Looks','#9b59b6'],['sound','Sound','#d94f8f'],['fx','Effects','#ff8c42'],['control','Control','#e6a118'],['player','Player','#3b82f6'],['objects','Objects','#2fb07a'],['vars','Score and variables','#e5484d']];
const catCol=c=>(CATS.find(x=>x[0]==c)||[0,0,'#888'])[2];
const clone=o=>JSON.parse(JSON.stringify(o));
const mkBlock=t=>({t,...clone(BLK[t].d)});
const mkHat=(t,o)=>({h:{t,...clone(HATD[t].d),...(t=='touch'?{o:o||''}:{})},b:[]});
const getAt=path=>{const ps=path.split('.');let cur=GE.scripts[+ps[0]];for(let i=1;i<ps.length;i++){if(cur==null)return null;cur=cur[ps[i]]}return cur};
const setKey=(obj,key,v)=>{const ks=key.split('.');let c=obj;for(let i=0;i<ks.length-1;i++)c=c[ks[i]];c[ks[ks.length-1]]=v};
const getKey=(obj,key)=>{let c=obj;for(const k of key.split('.')){if(c==null)return'';c=c[k]}return c};
const blockCount=l=>(l||[]).reduce((a,b)=>a+1+(b.t=='rep'||b.t=='forever'?blockCount(b.b):0)+(b.t=='if'?blockCount(b.y)+blockCount(b.n):0),0);
function inputsHTML(b,fl,path){const objs=(GE.objs||[]).map((o,i)=>[o.u||'',labelOf(o,i)]);
 return fl.map(f=>{const[k,ty,op]=f;if(k=='t')return `<span class="bt">${esc(ty)}</span>`;const v=getKey(b,k),a=`data-bp="${path}" data-bk="${k}"`;
  if(ty=='text')return `<input class="bi" ${a} value="${esc(v)}" maxlength="80" placeholder="${esc((op&&op.ph)||'')}" size="${Math.max(6,Math.min(18,String(v).length+2))}">`;
  if(ty=='num'){const o2=op||NUM;return `<input class="bi n" type="number" ${a} value="${+v}" min="${o2.min}" max="${o2.max}" step="${o2.step||1}">`}
  if(ty=='col')return `<input class="bi c" type="color" ${a} value="${esc(v||'#ffffff')}">`;
  if(ty=='sel')return `<select class="bi" ${a}>${op.o.map(([x,l])=>`<option value="${x}" ${String(x)==String(v)?'selected':''}>${esc(l)}</option>`).join('')}</select>`;
  if(ty=='obj'){const has=objs.some(x=>x[0]==v&&v);return `<select class="bi" ${a}><option value="">(choose an object)</option>${!has&&v?'<option value="'+esc(v)+'" selected>(deleted object)</option>':''}${objs.map(([x,l])=>`<option value="${x}" ${x==v?'selected':''}>${esc(l)}</option>`).join('')}</select>`}
  return ''}).join('')}
function blockHTML(b,path){const d=BLK[b.t];if(!d)return'';const fl=typeof d.f=='function'?d.f(b):d.f,col=catCol(d.c);
 let inner='';if(d.cont==1)inner=`<div class="bl-in">${listHTML(b.b,path+'.b')}</div>`;else if(d.cont==2)inner=`<div class="bl-in"><div class="bl-l">then</div>${listHTML(b.y,path+'.y')}<div class="bl-l">else</div>${listHTML(b.n,path+'.n')}</div>`;
 return `<div class="blk" style="--bc:${col}"><div class="bl-h"><span class="bl-i">${d.ic}</span><span class="bl-f">${inputsHTML(b,fl,path)}</span><span class="bl-a"><button data-up="${path}" title="Move up">▲</button><button data-dn="${path}" title="Move down">▼</button><button data-rm="${path}" title="Delete">✕</button></span></div>${inner}</div>`}
function listHTML(list,path){list=list||[];return list.map((b,i)=>blockHTML(b,path+'.'+i)).join('')+`<button class="addb" data-add="${path}">＋ Add block</button>`}
function codeRender(){const P=$('#cd');if(!P||!GE)return;GE.scripts=GE.scripts||[];const sel=GE.objs[GE.sel],su=sel?sel.u:null;
 const shown=GE.scripts.map((s,i)=>[s,i]).filter(([s])=>CF2.f=='all'||(CF2.f=='obj'&&su&&s.h.o==su)||(CF2.f=='game'&&!s.h.o));
 P.innerHTML=`<p class="mut" style="margin-top:0;font-size:13px">Build behaviors with blocks. Scripts run for each player in their own game.</p><div class="chips"><button class="pri" data-ns="1">＋ New script</button>${sel?'<button data-rec="1">✨ Recipes</button>':''}</div><div class="chips">${[['all','All'],['obj','This object'],['game','Game']].map(([k,n])=>`<button data-cf="${k}" class="${CF2.f==k?'on':''}">${n}</button>`).join('')}</div>
 ${shown.map(([s,i])=>{const hd=HATD[s.h.t];return `<div class="scr"><div class="blk hat" style="--bc:#f0c010"><div class="bl-h"><span class="bl-i">${hd.ic}</span><span class="bl-f">${inputsHTML(s.h,hd.f,i+'.h')}</span><span class="bl-a"><button data-su="${i}" title="Move up">▲</button><button data-sd="${i}" title="Move down">▼</button><button data-rs="${i}" title="Delete script">✕</button></span></div></div>${listHTML(s.b,i+'.b')}</div>`}).join('')||`<p class="mut">No scripts ${CF2.f=='all'?'yet':'here'}. Press “New script” to start${sel?', or try a Recipe for the selected object':''}.</p>`}
 <p class="mut" style="font-size:12px">${blockCount(GE.scripts.flatMap(s=>s.b))} blocks · ${GE.scripts.length}/40 scripts</p>`}
function codeSave(){if(CODEP)CODEP()}
function openPal(title,groups,cb){let m=$('#pal');if(m)m.remove();m=document.createElement('div');m.id='pal';m.className='stu-pal';
 m.innerHTML=`<div class="stu-palb"><div style="display:flex;justify-content:space-between;align-items:center"><b>${esc(title)}</b><button data-x="1">✕</button></div>${groups.map(g=>`<div class="stg" style="color:${g.c||'#9aa0ad'}">${esc(g.n)}</div><div class="palg">${g.items.map(([id,ic,l])=>`<button data-pick="${id}" style="--bc:${g.c||'#555'}"><span>${ic}</span>${esc(l)}</button>`).join('')}</div>`).join('')}</div>`;
 m.onclick=e=>{if(e.target==m||e.target.closest('[data-x]'))return m.remove();const b=e.target.closest('[data-pick]');if(b){m.remove();cb(b.dataset.pick)}};document.body.appendChild(m)}
function addBlockTo(path){const list=getAt(path);if(!list)return;if(blockCount(GE.scripts.flatMap(s=>s.b))>=300)return toast('Up to 300 blocks per game.');
 openPal('Add a block',CATS.map(([c,n,col])=>({n,c:col,items:Object.keys(BLK).filter(k=>BLK[k].c==c).map(k=>[k,BLK[k].ic,BLK[k].n])})),t=>{list.push(mkBlock(t));codeSave();codeRender()})}
function newScript(t,obj){if(GE.scripts.length>=40)return toast('Up to 40 scripts per game.');GE.scripts.push(mkHat(t,obj));codeSave();codeRender()}
const RECIPES=[['welcome','🚩','Welcome message'],['coin','🪙','Pick-up (score +10, disappears)'],['trap','💥','Trap (boom, ouch, respawn)'],['tele','🌀','Teleporter to a spawn point'],['win','🏁','Win when touched'],['boost','🚀','Speed boost pad']];
function recipe(id,u){const T=(o,b)=>GE.scripts.push({h:{t:'touch',o:u},b});
 if(id=='welcome')GE.scripts.push({h:{t:'start'},b:[{t:'say',m:'Welcome to my game!',s:3}]});
 else if(id=='coin')T(u,[{t:'sound',k:'coin'},{t:'score',op:'add',n:10},{t:'show',o:u,on:'hide'}]);
 else if(id=='trap')T(u,[{t:'sound',k:'boom'},{t:'say',m:'Ouch!',s:1},{t:'respawn'}]);
 else if(id=='tele')T(u,[{t:'sound',k:'jump'},{t:'tp',w:'spawn',o:'',x:0,y:5,z:0}]);
 else if(id=='win')T(u,[{t:'sound',k:'win'},{t:'win',m:'You made it!'}]);
 else if(id=='boost')T(u,[{t:'sound',k:'jump'},{t:'phys',k:'speed',n:16},{t:'wait',s:3},{t:'phys',k:'speed',n:7}]);
 codeSave();codeRender()}
document.addEventListener('click',e=>{const P=$('#cd');if(!P||!P.contains(e.target)||!GE)return;const t=e.target.closest('button');if(!t)return;const d=t.dataset;
 if(d.ns)return openPal('New script',[{n:'When this happens…',c:'#f0c010',items:Object.keys(HATD).map(k=>[k,HATD[k].ic,HATD[k].n])}],k=>{const s=GE.objs[GE.sel];newScript(k,k=='touch'&&s?s.u:'')});
 if(d.rec!=null)return openPal('Recipes for the selected object',[{n:'Ready-made scripts',c:'#f0c010',items:RECIPES}],id=>{const s=GE.objs[GE.sel];if(s)recipe(id,s.u)});
 if(d.cf){CF2.f=d.cf;return codeRender()}
 if(d.add)return addBlockTo(d.add);
 if(d.rs!=null){GE.scripts.splice(+d.rs,1);codeSave();return codeRender()}
 if(d.su!=null||d.sd!=null){const i=+(d.su!=null?d.su:d.sd),j=d.su!=null?i-1:i+1;if(j>=0&&j<GE.scripts.length){[GE.scripts[i],GE.scripts[j]]=[GE.scripts[j],GE.scripts[i]];codeSave();codeRender()}return}
 const mv=(p,dir)=>{const ps=p.split('.'),i=+ps.pop(),list=getAt(ps.join('.'));if(!list)return;const j=i+dir;if(j<0||j>=list.length)return;[list[i],list[j]]=[list[j],list[i]];codeSave();codeRender()};
 if(d.up)return mv(d.up,-1);if(d.dn)return mv(d.dn,1);
 if(d.rm){const ps=d.rm.split('.'),i=+ps.pop(),list=getAt(ps.join('.'));if(list){list.splice(i,1);codeSave();codeRender()}}});
const codeInput=e=>{const el=e.target.closest('[data-bp]');if(!el||!GE||!$('#cd')||!$('#cd').contains(el))return;const path=el.dataset.bp,key=el.dataset.bk,tgt=path.endsWith('.h')?getAt(path):getAt(path);if(!tgt)return;let v=el.value;
 if(el.type=='number'){v=parseFloat(v);if(isNaN(v))return;v=Math.max(+el.min,Math.min(+el.max,v))}else if(el.tagName=='SELECT'&&/^\d+$/.test(v)&&key=='k'&&path.endsWith('.h'))v=+v;
 setKey(tgt,key,v);codeSave();if(el.tagName=='SELECT'&&(key=='w'||key=='c.v'))codeRender()};
document.addEventListener('input',codeInput);document.addEventListener('change',codeInput);
