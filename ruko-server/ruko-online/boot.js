// Entry point. Adds the news API and then starts the game server completely unchanged.
const http=require('http'),posts=require('./posts.js');
const create=http.createServer.bind(http);
http.createServer=function(handler){
 return create(function(req,res){
  const url=String(req.url||'').split('?')[0];
  if(url==='/api/posts'){
   posts(req,res).catch(e=>{console.error('news:',e&&e.message);try{res.writeHead(500,{'content-type':'application/json'});res.end('{"error":"Server error."}')}catch(_){}});
   return;
  }
  return handler(req,res);
 });
};
require('./server.js');
