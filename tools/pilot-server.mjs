import {createPilotServer} from "../src/server/app.mjs";
import {createPilotPool,closePilotRuntime} from "../src/server/pg-runtime.mjs";
import {assertPrivatePilotStartupPolicy} from "../src/ops/private-startup.mjs";
// This interlock runs BEFORE a PostgreSQL pool or an HTTP listener is created.
const port=Number(process.env.PORT||4174),host=process.env.HOST||"127.0.0.1";
const hostForOrigin=host==="::1"?"[::1]":host;
const origin=process.env.APP_ORIGIN||("http://"+hostForOrigin+":"+port);
assertPrivatePilotStartupPolicy({environment:process.env.NODE_ENV,host,port,origin});
if(!process.env.DATABASE_URL)throw Error("Mungon DATABASE_URL.");
const pool=createPilotPool(process.env.DATABASE_URL);
const server=createPilotServer(pool,{origin,production:false,rateLimitSecret:process.env.PROTESTO_RATE_LIMIT_SECRET,dialogueSecret:process.env.PROTESTO_DIALOGUE_SECRET});
server.requestTimeout=30000;
server.headersTimeout=15000;
server.keepAliveTimeout=5000;

let closing=null;
function stop(){
 if(!closing)closing=closePilotRuntime(server,pool).catch(error=>{
  // Do not log raw DB connection strings, hostnames or SQL.
  console.error("Protesto pilot shutdown failed:",error?.code||"UNKNOWN");
  process.exitCode=1;
 });
 return closing;
}
process.once("SIGINT",stop);
process.once("SIGTERM",stop);
server.on("error",error=>{
 console.error("Protesto pilot HTTP listener error:",error?.code||"UNKNOWN");
 process.exitCode=1;
 void stop();
});
server.listen(port,host,()=>console.log("Private pilot listening at "+origin));
