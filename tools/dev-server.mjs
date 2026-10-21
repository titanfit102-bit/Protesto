import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root=resolve(fileURLToPath(new URL("../",import.meta.url)));
const types={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".mjs":"text/javascript; charset=utf-8",".js":"text/javascript; charset=utf-8",".json":"application/json; charset=utf-8"};
const host="127.0.0.1",port=Number(process.env.PORT||4173);
createServer(async(req,res)=>{
  try {
    const pathname=new URL(req.url,"http://localhost").pathname;
    const decoded=decodeURIComponent(pathname);
    const relative=decoded==="/"?"index.html":decoded.slice(1);
    const target=resolve(root,relative);
    if(target!==root&&!target.startsWith(root+sep)) { res.writeHead(403);res.end("Forbidden");return; }
    if(relative.startsWith(".")||relative.split("/").some(segment=>segment.startsWith("."))||relative.startsWith("tools/")||relative.startsWith("test/")) {
      res.writeHead(404);res.end("Not found");return;
    }
    if(!(await stat(target)).isFile())throw new Error("Not a file");
    const data=await readFile(target);
    res.writeHead(200,{"Content-Type":types[extname(target)]||"application/octet-stream","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer","Content-Security-Policy":"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});
    res.end(data);
  }catch {res.writeHead(404);res.end("Not found");}
}).listen(port,host,()=>console.log("Protesto demo: http://"+host+":"+port));
