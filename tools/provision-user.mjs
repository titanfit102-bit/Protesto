import pg from "pg";
import { randomUUID } from "node:crypto";
import { normalizeEmail,hashPassword } from "../src/server/security.mjs";
const [emailArg,role]=process.argv.slice(2);
if(!process.env.DATABASE_URL)throw new Error("Mungon DATABASE_URL.");
if(!["reporter","reviewer","admin"].includes(role))throw new Error("Usage: node tools/provision-user.mjs email@example.org reporter|reviewer|admin");
const email=normalizeEmail(emailArg);
const hash=hashPassword(process.env.PROTESTO_NEW_PASSWORD);
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});
try{
 const r=await pool.query("INSERT INTO civic_users(id,email,password_hash,role) VALUES($1,$2,$3,$4) ON CONFLICT(email) DO NOTHING RETURNING id",[randomUUID(),email,hash,role]);
 if(!r.rowCount)throw new Error("Email ekziston; ndryshimi i roleve kërkon një procedurë të audituar.");
 console.log("User created: "+role);
}finally{await pool.end();}
