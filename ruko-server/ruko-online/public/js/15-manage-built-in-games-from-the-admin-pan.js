/* ---------- v15: manage built-in games from the admin panel ---------- */
function editGame(id){api('/api/game?id='+encodeURIComponent(id)).then(r=>{if(!r||!r.game)return toast('Could not load that game.');const g=SG.find(x=>x.id==id);
 GE={...r.game,sel:-1,tool:'move',tab:'props',snap:.5,thumb:null,editId:r.game.id,keepThumb:!!(g&&g.ht),startW:r.game.startW||[],weapons:r.game.weapons||[],wsel:0};
 CTAB='game';if(location.hash!='#/create')location.hash='#/create';else create('game')})}
