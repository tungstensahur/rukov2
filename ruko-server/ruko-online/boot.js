// Entry point. Adds the news, description, report and daily-bonus routes, then starts the game
// server exactly as it is on disk: server.js itself is never edited, the extra routes are
// spliced into its request handler in memory.
const http=require('http'),fs=require('fs'),path=require('path'),Module=require('module');
const posts=require('./posts.js'),descs=require('./descs.js');
const create=http.createServer.bind(http);
http.createServer=function(handler){
 return create(function(req,res){
  const url=String(req.url||'').split('?')[0];
  const mod=url==='/api/posts'?posts:url==='/api/descs'?descs:null;
  if(mod){
   mod(req,res).catch(e=>{console.error('extra api:',e&&e.message);try{res.writeHead(500,{'content-type':'application/json'});res.end('{"error":"Server error."}')}catch(_){}});
   return;
  }
  return handler(req,res);
 });
};
const file=path.join(__dirname,'server.js');
let src=fs.readFileSync(file,'utf8');
const MARK=" if(p=='/api/profile'){";
if(src.indexOf(MARK)<0)throw new Error('boot.js: could not find the route marker in server.js');
src=src.replace(MARK," if(p=='/api/reports'||p=='/api/daily'){return require('./routes.js')({req,res,p,b,me,send,need,D,save,staff});}\n"+MARK);
const m=new Module(file,module);
m.filename=file;
m.paths=Module._nodeModulePaths(__dirname);
m._compile(src,file);
