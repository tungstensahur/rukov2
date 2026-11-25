/* ---------- faces are shop items ---------- */
/* A face used to be a number on the avatar and every drawing was free. They are items now, in the
   same table as hats, so the catalog lists them, the buy route charges for them and the avatar
   checks that you own one before wearing it. This module only has to put them in that table: the
   rest of the server already knows how to sell an item. The first four are the starter set, so
   every account is given them the first time it is seen.

   routes.js asks for ensure() on each request, so the items exist before any page can ask for the
   catalog, whether or not the data came from Redis or from the local file. */

const FACES=[
 {n:'Smile',p:0,d:'The friendly one everybody starts with.'},
 {n:'Cool',p:0,d:'Sunglasses on, unbothered.'},
 {n:'Surprised',p:0,d:'Eyes wide, mouth open.'},
 {n:'Stoic',p:0,d:'No expression at all. Very professional.'},
 {n:'Grin',p:40,d:'A big, toothy grin.'},
 {n:'Wink',p:40,d:'One eye closed, still charming.'},
 {n:'Tongue',p:60,d:'Tongue out, no apologies.'},
 {n:'Angry',p:60,d:'Heavy brows and a scowl.'},
 {n:'Sad',p:60,d:'A single tear, for drama.'},
 {n:'Laughing',p:80,d:'Eyes shut, mouth wide open.'},
 {n:'Sleepy',p:80,d:'Half awake, with a little z.'},
 {n:'Hearts',p:120,d:'Heart eyes, obviously in love.'},
 {n:'Stars',p:120,d:'Star eyes, seeing stars.'},
 {n:'Dizzy',p:100,d:'Swirly eyes and a wobble.'},
 {n:'Cat',p:150,d:'Slit eyes, whiskers, tiny smile.'},
 {n:'Robot',p:150,d:'Square eyes and a speaker mouth.'},
 {n:'Blush',p:90,d:'Warm cheeks and a shy smile.'},
 {n:'Smirk',p:70,d:'One brow up, half a smile.'},
 {n:'Cyclops',p:110,d:'One big eye, one big smile.'},
 {n:'Derp',p:90,d:'Uneven eyes and a lolling tongue.'},
 {n:'Vampire',p:200,d:'Two fangs and a hungry look.'},
 {n:'Nerd',p:130,d:'Round glasses and buck teeth.'}
];

const STARTER=4;               // how many faces every account owns from the start
const faceId=i=>'f'+i;

let seeded=0;                  // the items themselves are only checked once per process

// Give one account its starter faces. Cheap enough to run on every request: it does nothing
// unless something is missing.
function give(me,save){
 if(!me||!Array.isArray(me.owned))return;
 let changed=0;
 for(let i=0;i<STARTER;i++){
  const id=faceId(i);
  if(!me.owned.includes(id)){me.owned.push(id);changed++}
 }
 if(changed)save();
}

function ensure(D,save,me){
 if(!D||!Array.isArray(D.hats))return;
 if(!seeded){
  const at=Date.now();
  let added=0;
  for(let i=0;i<FACES.length;i++){
   const fd=FACES[i],id=faceId(i);
   // an item with this id may already exist from an earlier run, or a player may have made one
   if(D.hats.some(h=>h&&h.id===id))continue;
   D.hats.push({id,kind:'face',slot:'faces',face:i,name:fd.n,desc:fd.d,creator:'Ruko',price:fd.p,
    status:'approved',at:at+i,base:1});
   added++;
  }
  seeded=1;
  // every existing account gets the starter set, not just the one being served
  for(const k in(D.users||{}))give(D.users[k],save);
  if(added)save();
 }
 give(me,save);
}

module.exports={ensure,FACES,STARTER,faceId};
