/* ---------- v15: manage built-in games from the admin panel ---------- */
function editGame(id){api('/api/game?id='+encodeURIComponent(id)).then(r=>{if(!r||!r.game)return toast('Could not load that game.');const g=SG.find(x=>x.id==id);
 GE={...r.game,sel:-1,tool:'move',tab:'props',snap:.5,thumb:null,editId:r.game.id,keepThumb:!!(g&&g.ht),startW:r.game.startW||[],weapons:r.game.weapons||[],wsel:0};
 CTAB='game';if(location.hash!='#/create')location.hash='#/create';else create('game')})}

/* ---------- v48: going in runs the game here, on the player's own device ---------- */
/* Play used to join a multiplayer room before a game would start. It now starts the game in the
   browser straight away: no waiting for a room, and a weak connection cannot keep anyone out. The
   server is still told about the visit, so plays are counted and creators are paid for them (the
   room it offers back is not joined). The second button on every game card, "Play with others",
   joins a room the way Play used to. */
function playOnClient(g){if(!g)return;try{Promise.resolve(api('/api/servers/assign',{game:g.id})).catch(()=>{})}catch(e){}return play(g)}
async function playServer(g){if(!g)return;const r=await api('/api/servers/assign',{game:g.id});if(r&&r.server)return play(g,r.server);toast((r&&r.error)||'Could not reach a server, starting on your own.');return play(g)}
async function playAuto(g){return playOnClient(g)}
(function(){
 const card=gcard;
 /* the card still marks its second button data-solo; it now means "with other people". */
 gcard=function(g){return String(card(g)).replace('data-solo="'+g.id+'"','data-mp="'+g.id+'"').replace('>Practice solo<','>🌐 Play with others<')};
 document.addEventListener('click',e=>{
  const t=e.target,b=t&&t.closest?t.closest('[data-mp]'):null;
  if(!b)return;
  e.preventDefault();e.stopPropagation();
  const g=(typeof games=='function'?games():[]).find(x=>x.id==b.dataset.mp);
  if(g)playServer(g);
 },true);
})();
