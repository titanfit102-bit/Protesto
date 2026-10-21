import pg from "pg";
import { readFile } from "node:fs/promises";
if(!process.env.DATABASE_URL)throw new Error("Mungon DATABASE_URL.");
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:2});
try{
 await pool.query(await readFile(new URL("../db/001_initial.sql",import.meta.url),"utf8"));
 console.log("Schema migration succeeded.");
}finally{await pool.end();}
