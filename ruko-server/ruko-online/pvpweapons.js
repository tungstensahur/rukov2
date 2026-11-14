/* ---------- how each PvP weapon behaves ---------- */
/* The server settles every shot, so the rules live here and both the shot and the damage come out of
   one place. Each weapon model has its own character:

     pistol   reliable at mid range, tight, falls off past about 25 m
     smg      very fast, but only accurate close up and weak at distance
     rifle    longest reach of the automatics, steady damage
     shotgun  several pellets at once, devastating in the face, nearly harmless far away
     sniper   no falloff, tiny hitbox, punches through the first enemy into the one behind, heavy
              on head hits
     blade    wide slow-ish arc, good damage
     knife    narrow and short, but the fastest
     hammer   narrow arc, very heavy, slower swing

   Melee keeps the "you have to be looking at them" cone; guns keep the ray test. Damage is rounded
   so the numbers in the editor are what players actually lose. */

const GUN={
 pistol:{near:26,far:80,min:.6,hit:.85,pierce:0,head:1.8},
 smg:{near:10,far:52,min:.45,hit:.85,pierce:0,head:1.5},
 rifle:{near:50,far:150,min:.72,hit:.9,pierce:0,head:1.7},
 shotgun:{near:8,far:30,min:.3,hit:1.15,pierce:0,head:1.3},
 sniper:{near:400,far:400,min:1,hit:.75,pierce:1,head:2.4}
};
const MELEE={
 blade:{arc:.2,reach:1,mult:1},
 knife:{arc:.55,reach:.75,mult:1},
 hammer:{arc:.35,reach:1.1,mult:1}
};
const falloff=(R,d)=>{
 if(!(R.far>R.near)||d<=R.near)return 1;
 return Math.max(R.min,1-(d-R.near)/(R.far-R.near)*(1-R.min));
};

/* ctx: {ps, wd, dx, dz, sl, pv, targets, ray}
   ps = shooter position, wd = weapon, dx/dz/sl = aim, pv = room (obstacles in pv.occ),
   targets = other players, ray = obstacle ray test.
   Returns {dmg:Map, fx:[], info:{hits,total,heads,kind}}. */
function shoot({ps,wd,dx,dz,sl,pv,targets,ray}){
 const dmg=new Map(),fx=[];
 const info={hits:0,total:0,heads:0,kind:wd.m||'pistol'};
 const oy=ps.y+1.6;
 const note=(k,d)=>{dmg.set(k,(dmg.get(k)||0)+d);info.hits++;info.total+=d};

 if(wd.t=='melee'){
  const M=MELEE[wd.m]||MELEE.blade;
  const reach=Math.max(1,(+wd.rng||4.5)*M.reach);
  for(const[k,v]of targets){
   const p=v.presence;
   const vx=p.x-ps.x,vz=p.z-ps.z,d=Math.hypot(vx,vz);
   if(d>reach||Math.abs(p.y-ps.y)>3)continue;
   if(!(d<.4||(vx*dx+vz*dz)/d>M.arc))continue;
   note(k,Math.max(1,Math.round(wd.dmg*M.mult)));
  }
  return {dmg,fx,info};
 }

 const R=GUN[wd.m]||GUN.pistol;
 const pellets=Math.max(1,Math.min(8,wd.pel|0||1));
 const spread=+wd.spr||0;
 for(let n=0;n<pellets;n++){
  let ax=dx,az=dz,s2=sl;
  if(spread){
   s2+=(Math.random()-.5)*spread*Math.PI/180;
   const a=(Math.random()-.5)*spread*Math.PI/180;
   ax=dx*Math.cos(a)-dz*Math.sin(a);
   az=dx*Math.sin(a)+dz*Math.cos(a);
  }
  let bt=+wd.rng||60;
  for(const o of (pv.occ||[])){
   const t=ray(ps.x,oy,ps.z,ax,az,s2,o);
   if(t!=null&&t<bt)bt=t;
  }
  const found=[];
  for(const[k,v]of targets){
   const p=v.presence;
   const vx=p.x-ps.x,vz=p.z-ps.z,t=vx*ax+vz*az;
   if(t<=0||t>bt)continue;
   if(Math.abs(vx*az-vz*ax)>R.hit)continue;
   const hy=oy+s2*t;
   if(hy<p.y-.3||hy>p.y+3.5)continue;
   found.push({k,t,head:hy>=p.y+2.2});
  }
  found.sort((a,b)=>a.t-b.t);
  const take=found.slice(0,1+R.pierce);
  for(const h of take){
   const m=h.head?R.head:1;
   note(h.k,Math.max(1,Math.round((+wd.dmg||10)*falloff(R,h.t)*m)));
   if(h.head)info.heads++;
  }
  if(take.length)bt=take[take.length-1].t;
  fx.push({
   f:[+ps.x.toFixed(1),+oy.toFixed(1),+ps.z.toFixed(1)],
   t:[+(ps.x+ax*bt).toFixed(1),+(oy+s2*bt).toFixed(1),+(ps.z+az*bt).toFixed(1)]
  });
 }
 return {dmg,fx,info};
}

module.exports={shoot,GUN,MELEE,falloff};
