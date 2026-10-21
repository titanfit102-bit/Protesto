import pg from "pg";
import {createPilotServer} from "../src/server/app.mjs";
if(!process.env.DATABASE_URL)throw Error("Mungon DATABASE_URL.");
const port=Number(process.env.PORT||4174),host=process.env.HOST||"127.0.0.1";
const origin=process.env.APP_ORIGIN||("http://"+host+":"+port);
const production=process.env.NODE_ENV==="production";
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:10});
const server=createPilotServer(pool,{origin,production,rateLimitSecret:process.env.PROTESTO_RATE_LIMIT_SECRET,dialogueSecret:process.env.PROTESTO_DIALOGUE_SECRET});
server.listen(port,host,()=>console.log("Private pilot listening at "+origin));
async function stop(){server.close();await pool.end();}
process.on("SIGINT",stop);process.on("SIGTERM",stop);