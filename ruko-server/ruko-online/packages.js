// Packages: body shapes for the player rig, made by the Ruko account and worn by anyone.
// A package only holds sizes, never code, so a bad one can never break the rig: every number is
// clamped and anything missing falls back to the classic body.
//   POST /api/packages {action:'create'|'update'|'delete', ...}   (Ruko only)
//   GET  /api/packages
const MAX=40;
const N=(o,k,a,b,d)=>{
 const v=o&&typeof o=='object'?+o[k]:NaN;
 return Math.max(a,Math.min(b,isNaN(v)?d:v));
};
const part=(o,w,h,d,def)=>({
 w:N(o,'w',w[0],w[1],def.w),
 h:N(o,'h',h[0],h[1],def.h),
 d:N(o,'d',d[0],d[1],def.d)
});
const CLASSIC={
 id:'classic',name:'Classic',
 head:{w:.7,h:.7,d:.7},
 torso:{w:1.2,h:1.2,d:.6},
 arms:{w:.55,h:1.2,d:.55},
 legs:{w:.55,h:1.2,d:.55},
 spread:1,creator:'Ruko',at:0
};
function pack(p){
 if(!p||typeof p!=='object')return null;
 const id=String(p.id||'').replace(/[^\w-]/g,'').slice(0,20);
 if(!id)return null;
 return {
  id,
  name:String(p.name||'Package').replace(/\s+/g,' ').trim().slice(0,24)||'Package',
  head:part(p.head,[.3,2],[.3,2],[.3,2],CLASSIC.head),
  torso:part(p.torso,[.5,3],[.5,3],[.25,1.8],CLASSIC.torso),
  arms:part(p.arms,[.15,1.5],[.3,3],[.15,1.5],CLASSIC.arms),
  legs:part(p.legs,[.15,1.5],[.3,3],[.15,1.5],CLASSIC.legs),
  spread:N(p,'spread',.5,2,1),
  creator:String(p.creator||'Ruko').slice(0,20),
  at:+p.at||Date.now()
 };
}
const list=D=>{
 if(!Array.isArray(D.packages))D.packages=[];
 if(!D.packages.length)D.packages.push({...CLASSIC,at:Date.now()});
 return D.packages.map(pack).filter(Boolean);
};

module.exports=function packages(c){
 const {req,res,b,me,send,need,D,save,p}=c;
 if(p==='/api/packages'||p==='/api/packages/'){
  if(req.method!=='POST')return send(res,200,{packages:list(D)});
  if(!me)return need();
  if(!me.admin)return send(res,403,{error:'Only the Ruko account can change packages.'});
  const act=String(b.action||'create');
  const all=list(D);
  if(act==='delete'){
   const id=String(b.id||'');
   if(id==='classic')return send(res,400,{error:'The classic body cannot be removed.'});
   D.packages=D.packages.filter(x=>x.id!==id);
   save();
   return send(res,200,{ok:1,packages:all.filter(x=>x.id!==id)});
  }
  if(act==='create'){
   if(D.packages.length>=MAX)return send(res,400,{error:'There are already '+MAX+' packages.'});
   let id='pc'+Math.random().toString(36).slice(2,8);
   while(D.packages.some(x=>x.id===id))id='pc'+Math.random().toString(36).slice(2,8);
   const made=pack({...b,id,creator:me.name,at:Date.now()});
   D.packages.push(made);
   save();
   return send(res,200,{ok:1,package:pack(made),packages:list(D)});
  }
  if(act==='update'){
   const i=D.packages.findIndex(x=>x.id===String(b.id||''));
   if(i<0)return send(res,404,{error:'No such package.'});
   if(D.packages[i].id==='classic')return send(res,400,{error:'The classic body cannot be changed.'});
   D.packages[i]=pack({...D.packages[i],...b,id:D.packages[i].id,creator:D.packages[i].creator,at:Date.now()});
   save();
   return send(res,200,{ok:1,package:pack(D.packages[i]),packages:list(D)});
  }
  return send(res,400,{error:'Unknown action.'});
 }
 return send(res,404,{error:'Not found.'});
};

module.exports.pack=pack;
module.exports.list=list;
module.exports.CLASSIC=CLASSIC;
