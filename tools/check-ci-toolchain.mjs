import {execFile} from "node:child_process";
import {promisify} from "node:util";
import {Pool} from "pg";

const run=promisify(execFile);
const required={node:"22.23.4",postgres:"16.15",chrome:"156.0.8078.47"};
const refuse=(what,actual,expected)=>{
 if(actual!==expected)throw Error("F12 unsupported "+what+" version "+JSON.stringify(actual)+"; expected "+expected);
};

async function main(){
 if(process.env.GITHUB_ACTIONS!=="true"||
    process.env.DATABASE_URL!=="postgres://postgres:postgres@127.0.0.1:5432/protesto"){
  throw Error("F12 toolchain check is only authorized for the disposable GitHub CI fixture.");
 }
 refuse("Node.js",process.versions.node,required.node);
 const [npm,dump,restore]=await Promise.all([
  run("npm",["--version"]),
  run("pg_dump",["--version"]),
  run("pg_restore",["--version"])
 ]);
 for(const [name,v] of [["pg_dump",dump.stdout],["pg_restore",restore.stdout]]){
  if(!/PostgreSQL\) 16\./.test(v)){
   throw Error("F12 "+name+" must be PostgreSQL 16 client tools; found "+v.trim());
  }
 }
 const binary=process.env.CHROME_PATH;
 if(!binary||!binary.startsWith(process.env.RUNNER_TEMP+"/protesto-chrome/")){
  throw Error("F12 Chrome executable is not from the isolated pinned CI cache.");
 }
 const chrome=await run(binary,["--version"]);
 if(!chrome.stdout.includes(required.chrome)){
  throw Error("F12 Chrome must be "+required.chrome+"; observed "+chrome.stdout.trim());
 }
 const pool=new Pool({connectionString:process.env.DATABASE_URL,max:1});
 let dbVersion;
 try{
  const r=await pool.query("SHOW server_version");
  dbVersion=r.rows[0].server_version;
  if(!dbVersion.startsWith(required.postgres)){
   throw Error("F12 PostgreSQL server must be "+required.postgres+"; observed "+dbVersion);
  }
 }finally{await pool.end();}
 console.log("F12 pinned toolchain verified:",JSON.stringify({
  runner:"ubuntu-24.04",node:process.versions.node,npm:npm.stdout.trim(),
  postgresServer:dbVersion,pgDump:dump.stdout.trim(),pgRestore:restore.stdout.trim(),
  chrome:chrome.stdout.trim(),chromeCache:"CI scratch path"
 }));
}
await main();
