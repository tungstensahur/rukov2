/* ---------- faces are shop items ---------- */
/* A face used to be a number on the avatar and every drawing was free. They are items now, in the
   same table as hats, so the catalog lists them, the buy route charges for them and the avatar
   checks that you own one before wearing it.

   The game ships with one face: the smile. Every other face is a picture the official Ruko account
   uploads with /api/faces (see routes.js), and add() below puts it in the item table. The rest of
   the server already knows how to sell an item, so nothing else has to change.

   Earlier builds seeded 21 more drawings here and gave them to everybody. clean() takes those back
   the first time this server sees a request: the items are removed, accounts lose the ids, and
   anyone still wearing one is put back on the smile. It runs once per process, does nothing when
   there is nothing to do, and never touches an uploaded face (those carry a picture). */

const FACES=[
 {n:'Smile',p:0,d:'The friendly one everybody starts with.'}
];

const STARTER=1;               // the faces every account owns from the start
const MAXFACE=40;              // the server keeps av.face between 0 and 40
const MAXIMG=80000;            // an uploaded face is 256x256, so this leaves room for detail
const faceId=i=>'f'+i;

let seeded=0,cleaned=0;

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

// Take the old built-in faces back out. Only the ones this file still lists stay; uploads stay.
function clean(D,save){
 const keep={};
 FACES.forEach((_,i)=>keep[faceId(i)]=1);
 let changed=0;
 const before=(D.hats||[]).length;
 D.hats=(D.hats||[]).filter(h=>{
  if(!h||h.kind!=='face'||h.img)return true;   // uploads and everything that is not a face stay
  if(keep[h.id])return true;
  if(h.base===1)return false;                  // seeded by an earlier build: gone
  return true;
 });
 if(D.hats.length!==before)changed++;
 const ids={},faces={};
 D.hats.forEach(h=>{
  if(!h)return;
  if(h.id)ids[h.id]=1;
  if(h.kind==='face')faces[String(h.face|0)]=1;
 });
 for(const k in(D.users||{})){
  const u=D.users[k];
  if(!u)continue;
  if(Array.isArray(u.owned)){
   const kept=u.owned.filter(id=>!(/^f\d{1,2}$/.test(String(id))&&!ids[id]));
   if(kept.length!==u.owned.length){u.owned=kept;changed++}
  }
  if(u.av&&(u.av.face|0)>0&&!faces[String(u.av.face|0)]){u.av.face=0;changed++}
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
 if(!cleaned){
  cleaned=1;
  try{clean(D,save)}catch(e){console.error('faces clean:',e&&e.message)}
 }
 give(me,save);
}

// An uploaded face: the picture is the whole front of the head, so it needs no drawing code.
// The next free number is used, so a face keeps its number for good.
function add(D,o){
 if(!D||!Array.isArray(D.hats))return {error:'No item table.'};
 const used={};
 D.hats.forEach(h=>{if(h&&h.kind==='face')used[h.face|0]=1});
 let i=1;
 while(used[i]&&i<MAXFACE)i++;
 if(used[i])return {error:'The face list is full. Remove a face first.'};
 const p=Math.max(0,Math.min(1000,o.price|0));
 const h={id:faceId(i),kind:'face',slot:'faces',face:i,
  name:String(o.name||'Face').slice(0,20),desc:String(o.desc||'').slice(0,80),
  creator:o.creator||'Ruko',price:p,status:'approved',base:0,at:Date.now(),img:String(o.img||'')};
 D.hats.push(h);
 return {h};
}

module.exports={ensure,add,FACES,STARTER,faceId,MAXIMG,MAXFACE};
