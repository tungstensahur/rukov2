/* ---------- v15: manage built-in games from the admin panel ---------- */
function editGame(id){api('/api/game?id='+encodeURIComponent(id)).then(r=>{if(!r||!r.game)return toast('Could not load that game.');const g=SG.find(x=>x.id==id);
 GE={...r.game,sel:-1,tool:'move',tab:'props',snap:.5,thumb:null,editId:r.game.id,keepThumb:!!(g&&g.ht),startW:r.game.startW||[],weapons:r.game.weapons||[],wsel:0};
 CTAB='game';if(location.hash!='#/create')location.hash='#/create';else create('game')})}

/* ---------- v48/v50: one Play button, and it is play with others ---------- */
/* Play used to join a multiplayer room before a game would start; it was then changed to run the
   game on the player's own device, with a separate "Play with others" button beside it. They are
   merged again: Play joins a room, so the game bar shows the server that was joined, e.g.
   "Sky Steps · Server 1", and if no room can be reached it plays on your own instead. Practice
   solo skips the room and always runs the game on the device. The server is still told about the
   visit either way, so plays are counted and creators are paid for them; the Servers page still
   lists every room. */
function playOnClient(g){if(!g)return;try{Promise.resolve(api('/api/servers/assign',{game:g.id})).catch(()=>{})}catch(e){}return play(g)}
async function playAuto(g){return playServer(g)}
async function playServer(g){if(!g)return;const r=await api('/api/servers/assign',{game:g.id});if(r&&r.server)return play(g,r.server);toast((r&&r.error)||'Could not reach a server, starting on your own.');return play(g)}

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
