import pg from "pg";
import { readFile,readdir } from "node:fs/promises";
if(!process.env.DATABASE_URL)throw new Error("Mungon DATABASE_URL.");
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:2});
try{
 const dir=new URL("../db/",import.meta.url);
 const files=(await readdir(dir)).filter(x=>/^\d{3}_[a-z0-9_]+\.sql$/.test(x)).sort();
 for(const file of files){await pool.query(await readFile(new URL(file,dir),"utf8"));console.log("Migration applied:",file);}
 console.log("Schema migration succeeded.");
}finally{await pool.end();}
