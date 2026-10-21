import pg from "pg";
import {readFile,readdir} from "node:fs/promises";
import {createHash} from "node:crypto";

if(!process.env.DATABASE_URL)throw new Error("Mungon DATABASE_URL.");
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:2});
const client=await pool.connect();
try{
 await client.query("BEGIN");
 await client.query("SELECT pg_advisory_xact_lock(365131970)");
 await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations(
   version varchar(150) PRIMARY KEY,
   checksum char(64) NOT NULL,
   applied_at timestamptz NOT NULL DEFAULT now()
 )`);
 const directory=new URL("../db/",import.meta.url);
 const migrations=(await readdir(directory)).filter(x=>/^\d{3}_[a-z0-9_]+\.sql$/.test(x)).sort();
 if(!migrations.length)throw Error("No migration files present.");
 for(const file of migrations){
  const content=await readFile(new URL(file,directory),"utf8");
  if(/^\s*BEGIN\s*;/im.test(content)||/^\s*COMMIT\s*;/im.test(content))
   throw Error("Migration "+file+" must not manage transactions; migration runner owns them.");
  const checksum=createHash("sha256").update(content).digest("hex");
  const existing=await client.query("SELECT checksum FROM schema_migrations WHERE version=$1",[file]);
  if(existing.rowCount){
   if(existing.rows[0].checksum!==checksum)throw Error("Migration drift detected: "+file);
   console.log("Already verified:",file);
   continue;
  }
  await client.query(content);
  await client.query("INSERT INTO schema_migrations(version,checksum) VALUES ($1,$2)",[file,checksum]);
  console.log("Migration applied:",file);
 }
 await client.query("COMMIT");
 console.log("All Protesto migrations verified.");
}catch(error){
 try{await client.query("ROLLBACK");}catch{}
 throw error;
}finally{
 client.release();
 await pool.end();
}
