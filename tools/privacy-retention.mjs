import pg from "pg";
import {expiredOperationalCounts,purgeExpiredOperationalRows,canApplySyntheticRetention} from "../src/ops/retention.mjs";

const args=process.argv.slice(2);
if(args.some(a=>!["--apply"].includes(a)))throw new Error("Allowed option: --apply");
const apply=args.includes("--apply");
if(apply&&!canApplySyntheticRetention(process.env))
 throw new Error("Refusing retention mutation: requires explicit approval and disposable CI boundary.");
if(!process.env.DATABASE_URL)throw new Error("DATABASE_URL is required.");
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:2});
try{
 const before=await expiredOperationalCounts(pool);
 if(!apply){
  console.log(JSON.stringify({status:"DRY_RUN",...before,
   reminder:"No records deleted. Content retention and GDPR erasure require separate policy and authorization."}));
 }else{
  const outcome=await purgeExpiredOperationalRows(pool,{env:process.env});
  console.log(JSON.stringify({status:"SYNTHETIC_CI_APPLIED",...outcome,after:await expiredOperationalCounts(pool)}));
 }
}finally{await pool.end();}
