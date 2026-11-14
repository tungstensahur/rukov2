/* ---------- v35: a game can remember how many coins each player has ---------- */
/* Studio gets a small switch in its top bar: "Coins saved". When it is on, the coins a player has
   collected in that game are kept between visits, per player and per game, and picked up again when
   they come back. Off means the counter starts at zero, which is how every game worked before.
   The choice is stored on the game itself, so it applies to everyone who plays it. */
(function(){
 if(window.RKGAMESAVE)return;
 window.RKGAMESAVE=1;

 const KEY=id=>{
  let who='guest';
  try{if(typeof cur=='function'){const u=cur();who=(u&&u.name)||'guest'}}catch(e){}
  return 'ruko_gcoins_'+who+'_'+id;
 };

 /* ---- remember the coins of the game being played ---- */
 /* The counter only ever goes up during a visit, so zero means the visit has just started: that is
    the moment to hand back what this player had last time. Doing it that way needs no "am I still
    in the same game" bookkeeping, which a phone that sleeps or a background tab would break. */
 const inGame=()=>{const g=document.getElementById('game');return !!(g&&g.style.display!=='none'&&g.querySelector('canvas'))};
 setInterval(()=>{
  try{
   const id=(window.RKPLAY&&window.RKPLAY.id)||'';
   const X=window.__RKX;
   if(!inGame()||!window.__RKCOINSAVE||!id||!X)return;
   let now=+X.got||0,saved=0;
   try{saved=+ls.get(KEY(id),0)||0}catch(e){}
   if(now===0&&saved>0){now=saved|0;try{X.got=now}catch(e){}}
   if(now>0)try{ls.set(KEY(id),now|0)}catch(e){}
  }catch(e){}
 },500);

 /* ---- the switch in the editor ---- */
 const paint=b=>{
  let on=false;
  try{on=!!(typeof GE!=='undefined'&&GE&&GE.saveCoins)}catch(e){}
  b.textContent=on?'🪙 Coins saved':'🪙 Coins not saved';
  b.title=on?'Each player keeps the coins they collect here between visits.':'Coins start at zero every visit.';
  b.className=on?'on':'';
 };
 const ensure=()=>{
  const top=document.querySelector('#stu .stu-top');
  if(!top)return;
  let b=top.querySelector('#setcoins');
  if(!b){
   b=document.createElement('button');
   b.id='setcoins';
   b.onclick=()=>{
    try{GE.saveCoins=!GE.saveCoins;ls.set('ruko_draft',GE)}catch(e){}
    paint(b);
    try{toast(GE&&GE.saveCoins?'This game will remember each player\'s coins.':'Coins will start at zero each visit.')}catch(e){}
   };
   const pub=top.querySelector('#pub');
   top.insertBefore(b,pub||null);
  }
  if(document.activeElement!==b)paint(b);
 };
 setInterval(()=>{try{ensure()}catch(e){}},700);

 /* ---- the choice travels with the published game ---- */
 try{
  const op=window.pub;
  if(typeof op=='function')window.pub=function(col,item){
   try{if(col=='games'&&item&&typeof item=='object'&&typeof GE!=='undefined'&&GE)item.saveCoins=!!GE.saveCoins}catch(e){}
   return op.apply(this,arguments);
  };
 }catch(e){}

 /* ---- a Test run uses whatever the switch says right now ---- */
 try{
  const ol=window.play;
  if(typeof ol=='function')window.play=function(g){
   try{
    if(g&&typeof g=='object'&&typeof GE!=='undefined'&&GE)g.saveCoins=!!GE.saveCoins;
    window.__RKCOINSAVE=!!(g&&g.saveCoins);
   }catch(e){}
   return ol.apply(this,arguments);
  };
 }catch(e){}

 window.RKGAMESAVEOK=1;
})();
