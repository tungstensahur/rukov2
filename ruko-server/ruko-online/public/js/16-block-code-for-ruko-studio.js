/* ---------- v16: block code for Ruko Studio (expanded) ---------- */
let CODEP=null,CF2={f:'all'};const CUS=[];
const nuid=()=>'o'+Math.random().toString(36).slice(2,8);
const labelOf=(o,i)=>(o.nm||(o.k=='p'?(TYPEINFO[o.t]||TYPEINFO.solid)[1]:o.k=='c'?'Coin':o.k=='s'?'Spawn':o.k=='w'?'Weapon':'Decoration'))+' '+i;
const NUM={min:-9999,max:9999,step:1};
const VALS=[['score','score'],['A','variable A'],['B','variable B'],['C','variable C'],['y','player height'],['px','player X'],['pz','player Z'],['time','seconds played'],['coins','coins'],['hp','health'],['kills','kills'],['deaths','deaths'],['chance','random chance']];
const VALO=VALS.filter(x=>x[0]!='chance'),SCORV=[['score','score'],['A','variable A'],['B','variable B'],['C','variable C']];
const condF=c=>{c=c||{};const cmp=c.v=='chance'?[['t',' is under '],['c.n','num',{min:0,max:100,step:5}],['t','%']]:[['c.o','sel',{o:[['>','is more than'],['<','is less than'],['=','is equal to']]}],['c.v2','sel',{o:[['','a fixed number']].concat(VALO)}]];return[['c.v','sel',{o:VALS}]].concat(cmp,c.v2?[]:[['c.n','num',NUM]])};
const HATD={start:{ic:'🚩',n:'When the game starts',f:[['t','When the game starts']],d:{}},
 touch:{ic:'👆',n:'When a player touches…',f:[['t','When a player touches '],['o','obj']],d:{o:''}},
 release:{ic:'🖐',n:'When a player stops touching…',f:[['t','When a player stops touching '],['o','obj']],d:{o:''}},
 near:{ic:'📍',n:'When a player comes near…',f:[['t','When the player gets within '],['n','num',{min:1,max:60,step:1}],['t',' of '],['o','obj']],d:{n:5,o:''}},
 timer:{ic:'⏰',n:'Every few seconds',f:[['t','Every '],['n','num',{min:.2,max:300,step:.5}],['t',' seconds']],d:{n:5}},
 action:{ic:'⚡',n:'When Action is pressed',f:[['t','When Action '],['k','sel',{o:[['1','1 (E key)'],['2','2 (Q key)']],num:1}],['t',' is pressed']],d:{k:1}},
 press:{ic:'⌨️',n:'When a key is pressed',f:[['t','When the player presses '],['k','sel',{o:[['space','Space (jump)'],['shift','Shift'],['control','Ctrl'],['f','F'],['e','E'],['r','R'],['1','1'],['2','2']]}]],d:{k:'space'}},
 jump:{ic:'🦘',n:'When the player jumps',f:[['t','When the player jumps']],d:{}},
 land:{ic:'🛬',n:'When the player lands',f:[['t','When the player lands']],d:{}},
 fall:{ic:'🕳',n:'When the player falls below a height',f:[['t','When the player falls below height '],['n','num',NUM]],d:{n:-15}},
 die:{ic:'💀',n:'When the player is eliminated (PVP)',f:[['t','When the player is eliminated']],d:{}},
 score:{ic:'🏆',n:'When score reaches…',f:[['t','When score reaches '],['n','num',NUM]],d:{n:10}},
 chatCmd:{ic:'💬',n:'When player types a chat command…',f:[['t','When player types '],['m','text',{ph:'!help'}],['t',' in server chat']],d:{m:'!help'}},
 varReach:{ic:'📦',n:'When a variable reaches…',f:[['t','When '],['v','sel',{o:SCORV}],['o','sel',{o:[['>','reaches at least'],['<','drops to at most']]}],['n','num',NUM]],d:{v:'A',o:'>',n:10}}};
const BLK={
 say:{c:'looks',ic:'💬',n:'Say a message',f:[['t','Say '],['m','text',{ph:'Hello!'}],['t',' for '],['s','num',{min:0,max:30,step:.5}],['t',' sec']],d:{m:'Hello!',s:2}},
 sky:{c:'looks',ic:'🌤',n:'Set sky color',f:[['t','Set sky color to '],['c','col']],d:{c:'#ff9966'}},
 fog:{c:'looks',ic:'🌫',n:'Change the fog',f:[['t','Set fog to '],['k','sel',{o:[['off','off'],['near','close'],['far','far away']]}]],d:{k:'near'}},
 sound:{c:'sound',ic:'🔊',n:'Play a sound',f:[['t','Play sound '],['k','sel',{o:[['beep','Beep'],['coin','Coin'],['jump','Jump'],['boom','Boom'],['win','Win'],['hurt','Hurt']]}]],d:{k:'beep'}},
 burst:{c:'fx',ic:'✨',n:'Particle burst',f:[['t','Burst at '],['o','obj'],['t',' color '],['c','col']],d:{o:'',c:'#ffd23f'}},
 broadcast:{c:'fx',ic:'📣',n:'Announce in chat',f:[['t','Announce '],['m','text',{ph:'Something happened!'}]],d:{m:'Something happened!'}},
 shake:{c:'fx',ic:'📳',n:'Shake the screen',f:[['t','Shake the screen for '],['s','num',{min:.1,max:5,step:.1}],['t',' sec']],d:{s:.6}},
 wait:{c:'control',ic:'⏱',n:'Wait',f:[['t','Wait '],['s','num',{min:0,max:60,step:.5}],['t',' sec']],d:{s:1}},
 rep:{c:'control',ic:'🔁',n:'Repeat',cont:1,f:[['t','Repeat '],['n','num',{min:1,max:100,step:1}],['t',' times']],d:{n:3,b:[]}},
 ru:{c:'control',ic:'🔂',n:'Repeat until…',cont:1,f:b=>[['t','Repeat until ']].concat(condF(b.c)),d:{c:{v:'score',o:'>',n:10,v2:''},b:[]}},
 forever:{c:'control',ic:'♾️',n:'Forever',cont:1,f:[['t','Forever']],d:{b:[]}},
 if:{c:'control',ic:'❓',n:'If … then',cont:2,f:b=>[['t','If ']].concat(condF(b.c)),d:{c:{v:'score',o:'>',n:5,v2:''},y:[],n:[]}},
 waitUntil:{c:'control',ic:'⏳',n:'Wait until…',f:b=>[['t','Wait until ']].concat(condF(b.c)),d:{c:{v:'score',o:'>',n:5,v2:''}}},
 note:{c:'control',ic:'📝',n:'Note (just for you)',f:[['t','📝 '],['m','text',{ph:'What this part does…'}]],d:{m:'This part does…'}},
 stop:{c:'control',ic:'🛑',n:'Stop this script',f:[['t','Stop this script']],d:{}},
 tp:{c:'player',ic:'🌀',n:'Teleport player',f:b=>[['t','Teleport player to '],['w','sel',{o:[['spawn','a spawn point'],['obj','an object'],['pos','a position']]}]].concat(b.w=='obj'?[['o','obj']]:[]).concat(b.w=='pos'?[['t',' x'],['x','num',NUM],['t',' y'],['y','num',NUM],['t',' z'],['z','num',NUM]]:[]),d:{w:'spawn',o:'',x:0,y:5,z:0}},
 respawn:{c:'player',ic:'💫',n:'Respawn player',f:[['t','Respawn player']],d:{}},
 phys:{c:'player',ic:'🏃',n:'Change player ability',f:[['t','Set player '],['k','sel',{o:[['speed','speed'],['jump','jump power'],['gravity','gravity']]}],['t',' to '],['n','num',{min:2,max:80,step:1}]],d:{k:'speed',n:12}},
 launch:{c:'player',ic:'🚀',n:'Launch the player up',f:[['t','Launch the player up with power '],['n','num',{min:1,max:60,step:1}]],d:{n:18}},
 freeze:{c:'player',ic:'🧊',n:'Freeze the player',f:[['t','Freeze the player for '],['s','num',{min:.1,max:30,step:.5}],['t',' sec']],d:{s:2}},
 win:{c:'player',ic:'🏁',n:'Win the game',f:[['t','Win the game, saying '],['m','text',{ph:'You won!'}]],d:{m:'You won!'}},
 heal:{c:'player',ic:'❤️',n:'Heal player (PVP games)',f:[['t','Heal player by '],['n','num',{min:1,max:500,step:5}],['t',' HP']],d:{n:25}},
 hurt:{c:'player',ic:'💢',n:'Damage player (PVP games)',f:[['t','Damage player by '],['n','num',{min:1,max:500,step:5}],['t',' HP']],d:{n:25}},
 show:{c:'objects',ic:'👁',n:'Show or hide',f:[['on','sel',{o:[['show','Show'],['hide','Hide']]}],['o','obj']],d:{on:'hide',o:''}},
 color:{c:'objects',ic:'🎨',n:'Change color',f:[['t','Set color of '],['o','obj'],['t',' to '],['c','col']],d:{o:'',c:'#ff4b4b'}},
 move:{c:'objects',ic:'↔️',n:'Move an object',f:[['t','Move '],['o','obj'],['t',' by x'],['x','num',NUM],['t',' y'],['y','num',NUM],['t',' z'],['z','num',NUM],['t',' over '],['s','num',{min:0,max:30,step:.5}],['t',' sec']],d:{o:'',x:0,y:4,z:0,s:1}},
 warp:{c:'objects',ic:'🌀',n:'Teleport an object',f:b=>[['t','Teleport '],['o','obj'],['t',' to ']].concat(b.w=='obj'?[['to','obj']]:[['t','x'],['x','num',NUM],['t','y'],['y','num',NUM],['t','z'],['z','num',NUM]]).concat([['w','sel',{o:[['pos','a position'],['obj','another object']]}]]),d:{o:'',w:'pos',to:'',x:0,y:0,z:0}},
 scale:{c:'objects',ic:'📈',n:'Grow or shrink an object',f:[['t','Scale '],['o','obj'],['t',' to '],['p','num',{min:0,max:400,step:10}],['t','% in '],['s','num',{min:0,max:20,step:.5}],['t',' sec']],d:{o:'',p:200,s:1}},
 fade:{c:'objects',ic:'👻',n:'Fade an object',f:[['t','Fade '],['o','obj'],['t',' to '],['p','num',{min:0,max:100,step:10}],['t','% in '],['s','num',{min:0,max:20,step:.5}],['t',' sec']],d:{o:'',p:0,s:1}},
 turn:{c:'objects',ic:'🔄',n:'Turn an object to an angle',f:[['t','Turn '],['o','obj'],['t',' to '],['deg','num',{min:-360,max:360,step:15}],['t','° in '],['s','num',{min:0,max:20,step:.5}],['t',' sec']],d:{o:'',deg:90,s:1}},
 face:{c:'objects',ic:'🙂',n:'Make an object face the player',f:[['t','Make '],['o','obj'],['t',' face the player']],d:{o:''}},
 clone:{c:'objects',ic:'🧬',n:'Spawn a copy near an object',f:[['t','Spawn a '],['kind','sel',{o:[['coin','coin (pick-up-able)'],['deco','copy']]}],['t',' near '],['o','obj'],['t',' offset x'],['x','num',NUM],['t','y'],['y','num',NUM],['t','z'],['z','num',NUM],['t',', gone after '],['life','num',{min:0,max:120,step:1}],['t',' sec (0 = stays)']],d:{kind:'coin',o:'',x:0,y:0,z:0,life:0}},
 spin:{c:'objects',ic:'🌀',n:'Spin an object',f:[['t','Spin '],['o','obj'],['t',' at '],['deg','num',{min:-720,max:720,step:10}],['t',' deg/sec (0 = stop)']],d:{o:'',deg:90}},
 score:{c:'vars',ic:'🏆',n:'Change score',f:[['op','sel',{o:[['add','Change score by'],['set','Set score to']]}],['n','num',NUM]],d:{op:'add',n:10}},
 var:{c:'vars',ic:'📦',n:'Change a variable',f:[['t','Variable '],['v','sel',{o:SCORV}],['op','sel',{o:[['add','changes by'],['set','is set to']]}],['n','num',NUM]],d:{v:'A',op:'add',n:1}},
 coins:{c:'vars',ic:'🪙',n:'Give coins',f:[['t','Give the player '],['n','num',{min:-999,max:999,step:1}],['t',' coins']],d:{n:10}},
 randvar:{c:'vars',ic:'🎲',n:'Random number into score/variable',f:[['t','Set '],['v','sel',{o:SCORV}],['t',' to a random number from '],['a','num',NUM],['t',' to '],['b','num',NUM]],d:{v:'score',a:1,b:10}},
 mathvar:{c:'vars',ic:'🧮',n:'Combine two values into score/variable',f:[['t','Set '],['v','sel',{o:SCORV}],['t',' to '],['a','sel',{o:VALS}],['op','sel',{o:[['add','+'],['sub','−'],['mul','×'],['div','÷']]}],['b','sel',{o:VALS}]],d:{v:'score',a:'score',op:'add',b:'A'}}};
const CATS=[['looks','Looks','#9b59b6'],['sound','Sound','#d94f8f'],['fx','Effects','#ff8c42'],['control','Control','#e6a118'],['player','Player','#3b82f6'],['objects','Objects','#2fb07a'],['vars','Score and variables','#e5484d']];
const catCol=c=>(CATS.find(x=>x[0]==c)||[0,0,'#888'])[2];
const clone=o=>JSON.parse(JSON.stringify(o));
const mkBlock=t=>({t,...clone(BLK[t].d)});
const mkHat=(t,o)=>({h:{t,...clone(HATD[t].d),...(t=='touch'||t=='release'||t=='near'?{o:o||''}:{})},b:[]});
const getAt=path=>{const ps=path.split('.');let cur=GE.scripts[+ps[0]];for(let i=1;i<ps.length;i++){if(cur==null)return null;cur=cur[ps[i]]}return cur};
const setKey=(obj,key,v)=>{const ks=key.split('.');let c=obj;for(let i=0;i<ks.length-1;i++)c=c[ks[i]];c[ks[ks.length-1]]=v};
const getKey=(obj,key)=>{let c=obj;for(const k of key.split('.')){if(c==null)return'';c=c[k]}return c};
const blockCount=l=>(l||[]).reduce((a,b)=>a+1+((b.t=='rep'||b.t=='forever'||b.t=='ru')?blockCount(b.b):0)+(b.t=='if'?blockCount(b.y)+blockCount(b.n):0),0);
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
 return `<div class="blk" style="--bc:${col}"><div class="bl-h"><span class="bl-i">${d.ic}</span><span class="bl-f">${inputsHTML(b,fl,path)}</span><span class="bl-a"><button data-up="${path}" title="Move up">▲</button><button data-dn="${path}" title="Move down">▼</button><button data-dp="${path}" title="Copy this block">⧉</button><button data-rm="${path}" title="Delete">✕</button></span></div>${inner}</div>`}
function listHTML(list,path){list=list||[];return list.map((b,i)=>blockHTML(b,path+'.'+i)).join('')+`<button class="addb" data-add="${path}">＋ Add block</button>`}
function codeRender(){const P=$('#cd');if(!P||!GE)return;GE.scripts=GE.scripts||[];const sel=GE.objs[GE.sel],su=sel?sel.u:null;
 const shown=GE.scripts.map((s,i)=>[s,i]).filter(([s])=>CF2.f=='all'||(CF2.f=='obj'&&su&&s.h.o==su)||(CF2.f=='game'&&!s.h.o));
 P.innerHTML=`<p class="mut" style="margin-top:0;font-size:13px">Build behaviors with blocks. Scripts run for each player in their own game.</p><div class="chips"><button class="pri" data-ns="1">＋ New script</button>${sel?'<button data-rec="1">✨ Recipes</button>':''}<button data-ex="1">📖 Explain</button><button data-hlp="1">❓ Help</button>${CUS.length?'<button data-cu="1">↶ Undo</button>':''}</div><div class="chips">${[['all','All'],['obj','This object'],['game','Game']].map(([k,n])=>`<button data-cf="${k}" class="${CF2.f==k?'on':''}">${n}</button>`).join('')}</div>
 ${shown.map(([s,i])=>{const hd=HATD[s.h.t]||{ic:'❔',f:[['t','When something happens']]};return `<div class="scr${s.off?' rkoff':''}"><div class="blk hat" style="--bc:#f0c010"><div class="bl-h"><span class="bl-i">${hd.ic}</span><span class="bl-f">${inputsHTML(s.h,hd.f,i+'.h')}</span><span class="bl-a"><button data-sx="${i}" title="${s.off?'Turn this script back on':'Turn this script off'}">${s.off?'🚫':'👁'}</button><button data-su="${i}" title="Move up">▲</button><button data-sd="${i}" title="Move down">▼</button><button data-sc="${i}" title="Copy this script">⧉</button><button data-rs="${i}" title="Delete script">✕</button></span></div></div>${s.off?'<p class="mut" style="font-size:12px;margin:6px 0 0">This script is off, so it will not run. Press 🚫 to turn it back on.</p>':''}${listHTML(s.b,i+'.b')}</div>`}).join('')||`<p class="mut">No scripts ${CF2.f=='all'?'yet':'here'}. Press “New script” to start${sel?', or try a Recipe for the selected object':''}. New to blocks? Press ❓ Help.</p>`}
 <p class="mut" style="font-size:12px">${blockCount(GE.scripts.flatMap(s=>s.b))} blocks · ${GE.scripts.length}/40 scripts · ${Object.keys(BLK).length} block types</p>`}
function codeSave(){if(CODEP)CODEP()}
const codeSnap=()=>{try{CUS.push(JSON.stringify(GE.scripts||[]));if(CUS.length>40)CUS.shift()}catch(e){}};
function codeUndo(){if(!CUS.length)return toast('Nothing to undo yet.');GE.scripts=JSON.parse(CUS.pop());codeSave();codeRender()}
function sentOf(b,def){const fl=typeof def.f=='function'?def.f(b):def.f;let s='';for(const[k,ty,op]of fl){if(k=='t'){s+=ty;continue}const gv=getKey(b,k),v=gv==null?'':gv;
 if(ty=='sel'){const o=((op&&op.o)||[]).find(x=>String(x[0])===String(v));s+=o?o[1]:(v===''?'(not set)':v)}
 else if(ty=='obj'){const o=(GE.objs||[]).find(x=>x.u==v);s+=o?'“'+labelOf(o,GE.objs.indexOf(o))+'”':'(no object chosen)'}
 else if(ty=='col')s+=v;else if(ty=='num')s+=v;else s+='“'+v+'”'}return s}
function explainHTML(){if(!(GE.scripts||[]).length)return '<p>No scripts yet. Press “New script”, choose when it should run, then add blocks under it.</p>';
 return GE.scripts.map(s=>{const hd=HATD[s.h.t]||{n:'When something happens',f:[['t','When something happens']],ic:'❔'};const out=[];
  const walk=(list,d)=>{(list||[]).forEach(b=>{const d2=BLK[b.t];if(!d2)return;out.push(`<div style="padding-left:${d*14}px;margin:3px 0"><span style="color:${catCol(d2.c)}">■</span> ${esc(sentOf(b,d2))}</div>`);
   if(b.t=='rep'||b.t=='forever'||b.t=='ru')walk(b.b,d+1);else if(b.t=='if'){walk(b.y,d+1);walk(b.n,d+1)}})};
  out.push(`<div style="margin:6px 0 2px;font-weight:700">${hd.ic} ${esc(sentOf(s.h,hd))}${s.off?' <span style="opacity:.6">(turned off)</span>':''}</div>`);walk(s.b,1);return `<div class="scr">${out.join('')}</div>`}).join('')}
const HELPHTML=`<p style="margin-top:0">A <b>script</b> is a small list of instructions. The first line is <b>when</b> it happens; everything under it is <b>what</b> happens.</p>
<ol style="padding-left:18px;line-height:1.6"><li>Press <b>＋ New script</b> and pick a start line, like “When a player touches…”.</li><li>Press <b>＋ Add block</b> under it and choose an action, like “Say a message”.</li><li>Tap the small boxes inside a block to change numbers, words and objects.</li><li>Turn a block into a loop with <b>Repeat</b>, <b>Repeat until</b> or <b>Forever</b>, then put blocks inside it.</li><li>Use <b>If … then</b> to only do something when a rule is true (score, height, coins, chance).</li><li>Press <b>▶ Test</b> at the top to try it. Use <b>👁</b> to switch a script off while you fix things, and <b>↶ Undo</b> if you make a mistake.</li></ol>
<p><b>Tips</b></p><ul style="padding-left:18px;line-height:1.6"><li>Pick a target object first (tap it in the 3D view) so “this object” recipes know what to act on.</li><li>Variables A, B and C are your own scratch numbers — great for counting.</li><li>Stuck? Press <b>📖 Explain</b> to read your whole game in plain English.</li></ul>`;
function openSheet(title,html){let m=$('#rksh');if(m)m.remove();m=document.createElement('div');m.id='rksh';m.className='stu-pal';
 m.innerHTML=`<div class="stu-palb"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;position:sticky;top:0;background:#232529;padding-bottom:6px;z-index:2"><b>${esc(title)}</b><button data-x="1">✕</button></div><div style="font-size:14px">${html}</div></div>`;
 m.onclick=e=>{if(e.target==m||e.target.closest('[data-x]'))m.remove()};document.body.appendChild(m)}
function openPal(title,groups,cb){let m=$('#pal');if(m)m.remove();m=document.createElement('div');m.id='pal';m.className='stu-pal';
 const paint=q=>{const el=m.querySelector('#palb');if(!el)return;el.innerHTML=groups.map(g=>{const its=g.items.filter(it=>!q||(it[2]+' '+it[0]).toLowerCase().includes(q));if(!its.length)return'';
   return `<div class="stg" style="color:${g.c||'#9aa0ad'}">${esc(g.n)}</div><div class="palg">${its.map(([id,ic,l])=>`<button data-pick="${id}" style="--bc:${g.c||'#555'}"><span>${ic}</span>${esc(l)}</button>`).join('')}</div>`}).join('')||'<p class="mut" style="padding:8px">Nothing matches that search.</p>'};
 m.innerHTML=`<div class="stu-palb"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;position:sticky;top:0;background:#232529;padding-bottom:4px;z-index:2"><b>${esc(title)}</b><button data-x="1">✕</button></div><input class="palq" id="palq" placeholder="Search ${groups.length} groups of blocks…" autocomplete="off"><div id="palb"></div></div>`;
 m.oninput=e=>{if(e.target.id=='palq')paint(e.target.value.trim().toLowerCase())};
 m.onclick=e=>{if(e.target==m||e.target.closest('[data-x]'))return m.remove();const b=e.target.closest('[data-pick]');if(b){m.remove();cb(b.dataset.pick)}};
 document.body.appendChild(m);paint('');const q=m.querySelector('#palq');if(q&&innerWidth>900)q.focus()}
const RECENT=()=>ls.get('ruko_brecent',[]);
function addBlockTo(path){const list=getAt(path);if(!list)return;if(blockCount(GE.scripts.flatMap(s=>s.b))>=300)return toast('Up to 300 blocks per game.');
 const rec=RECENT().filter(k=>BLK[k]),grp=CATS.map(([c,n,col])=>({n,c:col,items:Object.keys(BLK).filter(k=>BLK[k].c==c).map(k=>[k,BLK[k].ic,BLK[k].n])}));
 if(rec.length)grp.unshift({n:'Recently used',items:rec.map(k=>[k,BLK[k].ic,BLK[k].n])});
 openPal('Add a block',grp,t=>{codeSnap();list.push(mkBlock(t));const r=[t,...RECENT().filter(x=>x!=t)].slice(0,8);ls.set('ruko_brecent',r);codeSave();codeRender()})}
function newScript(t,obj){if(GE.scripts.length>=40)return toast('Up to 40 scripts per game.');codeSnap();GE.scripts.push(mkHat(t,obj));codeSave();codeRender()}
const RECIPES=[['welcome','🚩','Welcome message'],['coin','🪙','Coin pick-up (+10 score)'],['trap','💥','Trap (boom, shake, respawn)'],['tele','🌀','Teleporter to a spawn point'],['win','🏁','Win the game when touched'],['boost','🚀','Speed boost pad (3 seconds)'],['jumpboost','🦘','Big jump pad'],['ghost','👻','Fade away when touched'],['boss','👹','Shrink and spin when touched'],['shaky','📳','Earthquake'],['counter','🔢','Count touches, win at 5'],['lift','🛗','Make a platform go up and down'],['story','📖','Story message when the game starts']];
function recipe(id,u){const T=b=>GE.scripts.push({h:{t:'touch',o:u},b});
 if(id=='welcome')GE.scripts.push({h:{t:'start'},b:[{t:'say',m:'Welcome to my game!',s:3}]});
 else if(id=='coin')T([{t:'sound',k:'coin'},{t:'score',op:'add',n:10},{t:'show',o:u,on:'hide'}]);
 else if(id=='trap')T([{t:'sound',k:'boom'},{t:'shake',s:.5},{t:'say',m:'Ouch!',s:1},{t:'respawn'}]);
 else if(id=='tele')T([{t:'sound',k:'jump'},{t:'tp',w:'spawn',o:'',x:0,y:5,z:0}]);
 else if(id=='win')T([{t:'sound',k:'win'},{t:'win',m:'You made it!'}]);
 else if(id=='boost')T([{t:'phys',k:'speed',n:16},{t:'sound',k:'jump'},{t:'wait',s:3},{t:'phys',k:'speed',n:7}]);
 else if(id=='jumpboost')T([{t:'launch',n:24},{t:'sound',k:'jump'}]);
 else if(id=='ghost')T([{t:'fade',o:u,p:0,s:.6},{t:'wait',s:2},{t:'fade',o:u,p:100,s:.6}]);
 else if(id=='boss')T([{t:'scale',o:u,p:40,s:.8},{t:'turn',o:u,deg:360,s:1},{t:'sound',k:'boom'},{t:'burst',o:u,c:'#ff4b4b'}]);
 else if(id=='shaky')T([{t:'shake',s:1.2},{t:'sound',k:'boom'},{t:'burst',o:u,c:'#ffd23f'},{t:'say',m:'EARTHQUAKE!',s:2}]);
 else if(id=='counter')T([{t:'var',v:'A',op:'add',n:1},{t:'if',c:{v:'A',o:'>',n:4,v2:''},y:[{t:'win',m:'Five touches!'}],n:[{t:'sound',k:'coin'}]}]);
 else if(id=='lift')GE.scripts.push({h:{t:'start'},b:[{t:'forever',b:[{t:'move',o:u,x:0,y:6,z:0,s:2},{t:'move',o:u,x:0,y:-6,z:0,s:2}]}]});
 else if(id=='story')GE.scripts.push({h:{t:'start'},b:[{t:'say',m:'Once upon a time…',s:3},{t:'wait',s:3},{t:'say',m:'…someone built a game with blocks.',s:3}]});
 codeSave();codeRender()}
document.addEventListener('click',e=>{const P=$('#cd');if(!P||!P.contains(e.target)||!GE)return;const t=e.target.closest('button');if(!t)return;const d=t.dataset;
 if(d.ns)return openPal('New script',[{n:'When this happens…',c:'#f0c010',items:Object.keys(HATD).map(k=>[k,HATD[k].ic,HATD[k].n])}],k=>{const s=GE.objs[GE.sel];newScript(k,s&&(k=='touch'||k=='release'||k=='near')?s.u:'')});
 if(d.rec!=null)return openPal('Recipes for the selected object',[{n:'Ready-made scripts',c:'#f0c010',items:RECIPES}],id=>{const s=GE.objs[GE.sel];if(s)recipe(id,s.u)});
 if(d.ex!=null)return openSheet('What your scripts do',explainHTML());
 if(d.hlp!=null)return openSheet('How block code works',HELPHTML);
 if(d.cu!=null)return codeUndo();
 if(d.cf){CF2.f=d.cf;return codeRender()}
 if(d.add)return addBlockTo(d.add);
 if(d.rs!=null){codeSnap();GE.scripts.splice(+d.rs,1);codeSave();return codeRender()}
 if(d.sc!=null){if(GE.scripts.length>=40)return toast('Up to 40 scripts per game.');codeSnap();GE.scripts.splice(+d.sc+1,0,clone(GE.scripts[+d.sc]));codeSave();return codeRender()}
 if(d.sx!=null){const s=GE.scripts[+d.sx];codeSnap();s.off=!s.off;codeSave();return codeRender()}
 if(d.su!=null||d.sd!=null){const i=+(d.su!=null?d.su:d.sd),j=d.su!=null?i-1:i+1;if(j>=0&&j<GE.scripts.length){codeSnap();[GE.scripts[i],GE.scripts[j]]=[GE.scripts[j],GE.scripts[i]];codeSave();codeRender()}return}
 const mv=(p,dir)=>{const ps=p.split('.'),i=+ps.pop(),list=getAt(ps.join('.'));if(!list)return;const j=i+dir;if(j<0||j>=list.length)return;codeSnap();[list[i],list[j]]=[list[j],list[i]];codeSave();codeRender()};
 if(d.up)return mv(d.up,-1);if(d.dn)return mv(d.dn,1);
 if(d.dp){const ps=d.dp.split('.'),i=+ps.pop(),list=getAt(ps.join('.'));if(list&&list[i]){codeSnap();list.splice(i+1,0,clone(list[i]));codeSave();codeRender()}return}
 if(d.rm){const ps=d.rm.split('.'),i=+ps.pop(),list=getAt(ps.join('.'));if(list){codeSnap();list.splice(i,1);codeSave();codeRender()}}});
const codeInput=e=>{const el=e.target.closest('[data-bp]');if(!el||!GE||!$('#cd')||!$('#cd').contains(el))return;const path=el.dataset.bp,key=el.dataset.bk,tgt=path.endsWith('.h')?getAt(path):getAt(path);if(!tgt)return;let v=el.value;
 if(el.type=='number'){v=parseFloat(v);if(isNaN(v))return;v=Math.max(+el.min,Math.min(+el.max,v))}else if(el.tagName=='SELECT'&&/^\d+$/.test(v)&&key=='k'&&path.endsWith('.h'))v=+v;
 setKey(tgt,key,v);codeSave();if(el.tagName=='SELECT'&&(key=='w'||key=='c.v'||key=='v'))codeRender()};
document.addEventListener('input',codeInput);document.addEventListener('change',codeInput);

/* ---------- runtime for the extra blocks and triggers ---------- */
let SKXC=null;const RKTW=[];
const rkEnt=(X,u)=>u&&X.ent?X.ent[u]:null;
const rkTouch=(X,e)=>{const q=e.q;if(q)return Math.abs(X.p.x-q.x)<q.sx/2+.45&&Math.abs(X.p.z-q.z)<q.sz/2+.45&&X.p.y<q.y+.2&&X.p.y+2.6>q.y-(q.th||.5)-.1;
 const c=X.entPos(e);return Math.hypot(c.x-X.p.x,c.z-X.p.z)<2.3&&c.y>X.p.y-.6&&c.y<X.p.y+3.4};
const rkDist=(X,e)=>{const c=X.entPos(e);return Math.hypot(c.x-X.p.x,c.y-X.p.y,c.z-X.p.z)};
const rkMesh=e=>e?(e.mesh||(e.q&&e.q.mesh)||null):null;
const rkOp=(m,o)=>{const set=x=>{if(x.opacity==null)return;x.transparent=o<1;x.opacity=o};if(m.traverse)m.traverse(q=>{const mm=q.material;if(mm)(Array.isArray(mm)?mm:[mm]).forEach(set)});else if(m.material)(Array.isArray(m.material)?m.material:[m.material]).forEach(set)};
const rkTw=(ms,fn)=>{const d=Math.max(1,ms||1);RKTW.push({t0:performance.now(),d,fn});fn(0)};
const rkShake=s=>{const c=document.querySelector('#game canvas');if(!c)return;const sec=Math.max(.15,+s||.6);
 c.classList.add('rk-shake');c.style.animationDuration=Math.max(.08,Math.min(.28,sec/6)).toFixed(2)+'s';clearTimeout(c._rksh);c._rksh=setTimeout(()=>c.classList.remove('rk-shake'),sec*1000+60)};
const SKX={
 val(v){const X=SKXC;if(!X)return 0;return v=='px'?X.p.x:v=='pz'?X.p.z:v=='hp'?(X.ST.hp|0):v=='kills'?(X.ST.k|0):v=='deaths'?(X.ST.d|0):0},
 run(b,run,now,X){SKXC=X;const E=u=>rkEnt(X,u);
  switch(b.t){
  case 'note':break;
  case 'shake':rkShake(b.s);break;
  case 'coins':X.got=Math.max(0,(X.got|0)+(+b.n||0));break;
  case 'launch':X.p.vy=+b.n||10;break;
  case 'freeze':{const o=X.ph.spd;X.ph.spd=0;setTimeout(()=>{X.ph.spd=o},Math.max(100,(+b.s||1)*1000));break}
  case 'fog':{const S=X.S,T=X.THREE;if(!S||!T)break;if(b.k=='off'){S.fog=null;break}
   const near=b.k=='near'?16:55,far=b.k=='near'?46:380;if(!S.fog)S.fog=new T.Fog((S.background&&S.background.getHex)?S.background.getHex():0x8fd3ff,near,far);S.fog.near=near;S.fog.far=far;break}
  case 'ru':run.stack.push({list:b.b||[],i:0,ru:b.c});break;
  case 'scale':{const e=E(b.o),m=rkMesh(e);if(!e||!m)break;const q=e.q,bk=q?[q.sx,q.th,q.sz]:null,base=bk?1:(m.scale.x||1),to=(+b.p||100)/100;
   rkTw((+b.s||0)*1000,k=>{const f=base*(1+(to-1)*k);if(q){q.sx=bk[0]*f;q.sz=bk[2]*f;q.th=bk[1]*f;m.scale.set(f,f,f);m.position.y=q.y-q.th/2}else m.scale.setScalar(f)});break}
  case 'fade':{const e=E(b.o),m=rkMesh(e);if(!e||!m)break;const to=Math.max(0,Math.min(100,+b.p))/100;
   rkTw((+b.s||0)*1000,k=>rkOp(m,1+(to-1)*k));break}
  case 'turn':{const e=E(b.o),m=rkMesh(e);if(!e||!m)break;const a0=m.rotation.y,to=(+b.deg||0)*Math.PI/180,dl=Math.atan2(Math.sin(to-a0),Math.cos(to-a0));
   rkTw((+b.s||0)*1000,k=>{m.rotation.y=a0+dl*k});break}
  case 'face':{const e=E(b.o),m=rkMesh(e);if(!e||!m)break;const c=X.entPos(e);m.rotation.y=Math.atan2(X.p.x-c.x,X.p.z-c.z);break}
  default:break}
  },
 tick(t,dt,X){SKXC=X;for(let i=RKTW.length-1;i>=0;i--){const w=RKTW[i],k=Math.min(1,(t-w.t0)/w.d);w.fn(k);if(k>=1)RKTW.splice(i,1)}},
 trig(s,st,t,X){SKXC=X;const h=s.h||{},pv=st.k_pv==null?X.p.vy:st.k_pv;st.k_pv=X.p.vy;const v=X.p.vy;
  if(h.t=='jump'){if(pv<=.5&&v>2){if(!st.k_j){st.k_j=1;return 1}}else if(v<=.5)st.k_j=0;return 0}
  if(h.t=='land'){if(pv<-2&&v>=-.01&&t>(st.k_lc||0)){st.k_lc=t+250;return 1}return 0}
  if(h.t=='fall'){const th=h.n==null?-15:+h.n;if(X.p.y<th){if(!st.k_f){st.k_f=1;return 1}}else if(X.p.y>th+1)st.k_f=0;return 0}
  if(h.t=='die'){const d=!!X.ST.dead;if(d&&!st.k_d){st.k_d=1;return 1}if(!d)st.k_d=0;return 0}
  if(h.t=='press'){const key=h.k=='space'?' ':String(h.k||'').toLowerCase(),on=!!X.keys[key];if(on&&!st.k_pk){st.k_pk=1;return 1}if(!on)st.k_pk=0;return 0}
  if(h.t=='near'){const e=rkEnt(X,h.o);if(!e)return 0;const d=rkDist(X,e),r=Math.max(1,+h.n||5);
   if(d<r){if(!st.k_n&&t>(st.k_nc||0)){st.k_n=1;st.k_nc=t+400;return 1}}else if(d>r*1.3)st.k_n=0;return 0}
  if(h.t=='release'){const e=rkEnt(X,h.o);if(!e)return 0;const tc=rkTouch(X,e);
   if(st.k_tc&&!tc&&t>(st.k_rc||0)){st.k_rc=t+300;st.k_tc=tc;return 1}st.k_tc=tc;return 0}
  return 0}
};

/* ---------- studio on phones and tablets ---------- */
(function(){
 const css=`:root{--rk-tap:44px}
.stu.vpmin .stu-vp{height:104px;min-height:104px}
.stu.vpmin .stu-hint{display:none}
#rkvp{font-size:15px;padding:6px 10px;min-height:38px;flex:none}
#game canvas.rk-shake{animation:rkShake .12s infinite;position:relative}
@keyframes rkShake{0%{transform:translate(0,0)}25%{transform:translate(-4px,2px)}50%{transform:translate(3px,-3px)}75%{transform:translate(-2px,-2px)}100%{transform:translate(2px,3px)}}
.palq{width:100%;margin:6px 0 10px;padding:10px;border-radius:10px;background:#1c1d20;color:#e6e6e6;border:1px solid #3a3d44;font-size:16px}
.stu-palb .palg button span{font-size:18px}
.scr.rkoff{opacity:.66}
#cd .bl-a button{line-height:1}
@media (max-width:900px){
 .stu-tabs{position:sticky;top:0;z-index:5;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;background:#232529}
 .stu-tabs button{min-height:44px;font-size:12px;padding:4px 2px;line-height:1.15;border-radius:8px}
 .stu-side{overflow:visible}
 .stu-main{display:flex;flex-direction:column;height:auto}
 .stu-vp{height:32vh;min-height:180px;flex:none}
 .stu-top{position:sticky;top:0;z-index:6;padding:6px 8px;gap:6px}
 .stu-top b{font-size:14px}
 .stu-top #stn{display:none}
 .stu-top button{min-height:40px;padding:6px 10px}
 .stu-bar{flex-wrap:wrap;overflow:visible;gap:6px;padding:6px 8px}
 .stu-bar button,.stu-bar select{min-height:40px}
 .stu-pn{padding:10px 8px 30px}
 .stu input,.stu select{font-size:16px}
 .stgrid{grid-template-columns:repeat(auto-fill,minmax(86px,1fr))}
 .ex{min-height:44px;display:flex;align-items:center;gap:8px}
 #cd .bl-h{padding:8px 6px;gap:6px;align-items:flex-start}
 #cd .bl-i{font-size:17px;line-height:1.5}
 #cd .bl-f{gap:6px}
 #cd .bt{font-size:14px}
 #cd .bi{font-size:16px;min-height:38px;padding:6px 8px}
 #cd .bi.n{width:86px}
 #cd .bi.c{width:46px;height:38px;padding:2px}
 #cd .bl-a{gap:4px;flex:none}
 #cd .bl-a button{width:34px;height:34px;font-size:14px;border-radius:8px}
 #cd .addb{width:100%;min-height:42px;margin:8px 0 14px;font-size:14px}
 #cd .bl-in{margin-left:10px;padding-left:8px}
 #cd button{touch-action:manipulation}
 .stu-pal .stu-palb{max-height:92vh;max-height:92dvh}
 .palg{grid-template-columns:1fr 1fr}
 .stu-palb button{min-height:46px;font-size:13px}
}
@media (max-width:900px) and (orientation:landscape){.stu-vp{height:42vh}}
@media (min-width:901px){.stu-palb{max-height:86vh}}`;
 const st=document.createElement('style');st.id='rk-stu-mobile';st.textContent=css;document.head.appendChild(st);
 const addBtn=()=>{const top=document.querySelector('.stu-top');if(!top||top.querySelector('#rkvp'))return;const b=document.createElement('button');b.id='rkvp';b.type='button';b.textContent='⤢';b.title='Show or hide the 3D view';
  const pr=top.querySelector('.pri');if(pr)top.insertBefore(b,pr);else top.appendChild(b)};
 addBtn();const host=document.getElementById('app');
 if(host&&typeof MutationObserver!='undefined')new MutationObserver(addBtn).observe(host,{childList:true});
 document.addEventListener('click',e=>{const b=e.target&&e.target.closest?e.target.closest('#rkvp'):null;if(!b)return;const s=document.querySelector('.stu');if(s)s.classList.toggle('vpmin')});
})();
