// News posts from the official Ruko account.
// Storage mirrors the game server: Upstash Redis when configured, otherwise a JSON file in DATA_DIR.
const http=require('http'),fs=require('fs'),path=require('path');
const RURL=(process.env.UPSTASH_REDIS_REST_URL||'').replace(/\/$/,''),RTOK=process.env.UPSTASH_REDIS_REST_TOKEN||'';
const FILE=path.join(process.env.DATA_DIR||path.join(__dirname,'data'),'news.json');
const PORT=process.env.PORT||3000,MAX=40,KEY='ruko:news';
const json=(res,c,o)=>{res.writeHead(c,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(o))};
const redis=async(cmd,suffix)=>{const r=await fetch(RURL+(suffix||''),{method:'POST',headers:{Authorization:'Bearer '+RTOK,'content-type':'application/json'},body:JSON.stringify(cmd)});const t=await r.text();const j=JSON.parse(t||'{}');if(j&&j.error)throw new Error(j.error);return j.result};
async function readAll(){
 if(RURL&&RTOK){const a=await redis(['HGETALL',KEY])||[],out=[];for(let i=0;i<a.length;i+=2){try{out.push(JSON.parse(a[i+1]))}catch(e){}}return out.filter(p=>p&&p.id)}
 try{const l=JSON.parse(fs.readFileSync(FILE,'utf8'));return Array.isArray(l)?l:[]}catch(e){return []}
}
async function writeAll(list){
 if(RURL&&RTOK){
  const cur=await redis(['HGETALL',KEY])||[],have=[];for(let i=0;i<cur.length;i+=2)have.push(cur[i]);
  const keep=new Set(list.map(p=>p.id)),cmds=[];
  for(const p of list)cmds.push(['HSET',KEY,p.id,JSON.stringify(p)]);
  for(const id of have)if(!keep.has(id))cmds.push(['HDEL',KEY,id]);
  if(cmds.length)await redis(cmds,'/pipeline');
  return;
 }
 fs.mkdirSync(path.dirname(FILE),{recursive:true});const tmp=FILE+'.tmp';fs.writeFileSync(tmp,JSON.stringify(list));fs.renameSync(tmp,FILE);
}
function whoami(req){
 const tok=(req.headers.authorization||'').slice(7);
 if(!tok)return Promise.resolve(null);
 return new Promise(ok=>{
  const r=http.request({host:'127.0.0.1',port:PORT,path:'/api/me',method:'GET',headers:{authorization:'Bearer '+tok},timeout:3000},res=>{let s='';res.on('data',d=>s+=d);res.on('end',()=>{try{const j=JSON.parse(s);ok(j&&j.me?j.me:null)}catch(e){ok(null)}})});
  r.on('error',()=>ok(null));r.on('timeout',()=>{r.destroy();ok(null)});r.end();
 });
}
const body=req=>new Promise(ok=>{let s='';req.on('data',d=>{s+=d;if(s.length>200000){req.destroy();ok({})}});req.on('end',()=>{try{ok(JSON.parse(s||'{}'))}catch(e){ok({})}});req.on('error',()=>ok({}))});
const sorted=l=>l.slice().sort((a,b)=>(b.at||0)-(a.at||0));
module.exports=async function(req,res){
 try{
  if(req.method==='GET')return json(res,200,{posts:sorted(await readAll()).slice(0,30)});
  const b=await body(req),me=await whoami(req);
  if(!me)return json(res,401,{error:'Please log in again.'});
  if(!me.admin)return json(res,403,{error:'Only the official Ruko account can post news.'});
  const list=await readAll();
  if(b.delete){const i=list.findIndex(p=>p.id===String(b.delete));if(i<0)return json(res,404,{error:'That post no longer exists.'});list.splice(i,1);await writeAll(list);return json(res,200,{ok:1,posts:sorted(list).slice(0,30)})}
  if(list.length>=MAX)return json(res,400,{error:'That is '+MAX+' posts. Delete an older one first.'});
  const title=String(b.title||'').replace(/\s+/g,' ').trim().slice(0,90),text=String(b.text||'').replace(/\r/g,'').trim().slice(0,1500);
  if(!title)return json(res,400,{error:'Give the post a title.'});
  if(!text)return json(res,400,{error:'Write something in the post.'});
  const post={id:'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),title,text,at:Date.now(),by:me.name};
  list.push(post);await writeAll(list);
  return json(res,200,{ok:1,post,posts:sorted(list).slice(0,30)});
 }catch(e){console.error('news:',e.message);return json(res,500,{error:'Could not reach the news store.'})}
};
