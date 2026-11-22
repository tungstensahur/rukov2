/* ---------- v15: manage built-in games from the admin panel ---------- */
function editGame(id){api('/api/game?id='+encodeURIComponent(id)).then(r=>{if(!r||!r.game)return toast('Could not load that game.');const g=SG.find(x=>x.id==id);
 GE={...r.game,sel:-1,tool:'move',tab:'props',snap:.5,thumb:null,editId:r.game.id,keepThumb:!!(g&&g.ht),startW:r.game.startW||[],weapons:r.game.weapons||[],wsel:0};
 CTAB='game';if(location.hash!='#/create')location.hash='#/create';else create('game')})}

/* ---------- v48: going in runs the game here, on the player's own device ---------- */
/* Play used to join a multiplayer room before a game would start. It now starts the game in the
   browser straight away: no waiting for a room, and a weak connection cannot keep anyone out. The
   server is still told about the visit, so plays are counted and creators are paid for them (the
   room it offers back is not joined). Play stays solo; joining a room has its own button on the
   card, and the Servers page still lists every room. */
function playOnClient(g){if(!g)return;try{Promise.resolve(api('/api/servers/assign',{game:g.id})).catch(()=>{})}catch(e){}return play(g)}
async function playAuto(g){return playOnClient(g)}

/* ---------- v50: a multiplayer button stays on every game card ---------- */
/* Play and Practice solo both run the game on the player's device; this puts playing with other
   people back next to them, as its own button, so it is obvious which one joins a room. The game
   bar then shows the server that was joined, e.g. "Sky Steps · Server 1". */
async function playServer(g){if(!g)return;const r=await api('/api/servers/assign',{game:g.id});if(r&&r.server)return play(g,r.server);toast((r&&r.error)||'Could not reach a server, starting on your own.');return play(g)}
(function(){
 const card=gcard;
 const solo=g=>'<button data-solo="'+g.id+'" style="width:100%;margin-top:6px;font-size:12px">Practice solo</button>';
 /* the multiplayer button sits right after the solo one and stays inside the card, because the
    report and like buttons are added next to whatever element they find inside each card */
 const both=g=>solo(g)+'<button data-mp="'+g.id+'" style="width:100%;margin-top:6px;font-size:12px">🌐 Play with others</button>';
 gcard=function(g){const h=String(card(g)),s=solo(g);return h.indexOf(s)>=0?h.replace(s,both(g)):h};
 document.addEventListener('click',e=>{
  const t=e.target,b=t&&t.closest?t.closest('[data-mp]'):null;
  if(!b)return;
  e.preventDefault();e.stopPropagation();
  const g=(typeof games=='function'?games():[]).find(x=>x.id==b.dataset.mp);
  if(g)playServer(g);
 },true);
})();

/* ---------- v49: going in opens the game on its own page ---------- */
/* The game used to be drawn on top of the page you pressed Play on, and the address stayed there,
   so a game had no link of its own and reloading threw you back to Home. Going in now changes the
   address to #/play/<game>, so it can be linked to, reloaded, and left with the browser's Back
   button; Exit returns to the page the game was opened from. Playing with others adds the room:
   #/play/<game>/<server>. */
(function(){
 const re=/^#\/play\/([^\/?#]+)(?:\/([^\/?#]+))?/,enc=encodeURIComponent;
 let back='#/',open=null,inside=0;
 const route=()=>{const m=re.exec(String(location.hash||''));return m?{id:decodeURIComponent(m[1]),srv:m[2]?decodeURIComponent(m[2]):null,key:m[1]+'/'+(m[2]||'')}:null};
 const find=id=>{try{return (typeof games=='function'?games():[]).find(g=>g.id==id)||null}catch(e){return null}};
 const isIn=()=>{try{return typeof inGame=='function'&&inGame()}catch(e){return false}};
 function gone(r){open=r.key;app.innerHTML='<h2>Game not found</h2><p class="mut">It may have been removed.</p><button class="pri" id="rkb">← All games</button>';const b=$('#rkb');if(b)b.onclick=()=>{location.hash='#/games'}}
 async function enter(r){if(open===r.key)return;let g=find(r.id);
  if(!g){open=r.key;app.innerHTML='<p class="mut">Loading the game…</p>';let q=null;try{q=await api('/api/game?id='+enc(r.id))}catch(e){}
   g=q&&q.game;if(open!==r.key)return;if(!g)return gone(r)}
  open=r.key;inside=1;try{play(g,r.srv||undefined)}catch(e){}inside=0}
 function leave(){open=null;const x=$('#ex');if(isIn()&&x&&x.onclick){try{x.click()}catch(e){}}}
 /* every Play button ends up here, so they all open the game's own page instead of drawing over
    the page you clicked from */
 const start=play;
 play=function(g,srv){if(!g)return;
  if(inside)return start(g,srv);
  if(!route())back=String(location.hash||'#/')||'#/';
  const want='#/play/'+enc(g.id)+(srv?'/'+enc(String(srv)):'');
  if(String(location.hash||'')===want){if(!isIn()){open=null;enter(route())}return}
  location.hash=want};
 const r0=render;
 render=function(){if(!cur())return r0();
  const r=route();
  if(r){enter(r);return}
  leave();
  return r0()};
 /* Exit goes back to where the game was opened from, replacing the game's own history entry so
    Back does not drop you straight back into it. */
 document.addEventListener('click',e=>{const t=e.target;
  if(!t||t.id!='ex'||!route())return;
  const to=back||'#/';
  try{history.replaceState(null,'',to)}catch(err){location.hash=to}
 },true);
})();
