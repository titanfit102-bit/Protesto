// Operator-only local provisioning. Never use within GitHub Actions.
import pg from "pg";
import {normalizeEmail} from "../src/server/security.mjs";
import {generateTotpSecret,encodeBase32,encryptTotpSecret} from "../src/server/totp.mjs";
const email=normalizeEmail(process.argv[2]);
const key=process.env.PROTESTO_MFA_KEY;
if(!process.env.DATABASE_URL||!key)throw new Error("DATABASE_URL and PROTESTO_MFA_KEY required");
if(process.env.GITHUB_ACTIONS==="true")throw new Error("Do not provision real MFA from CI");
const secret=generateTotpSecret(),sealed=encryptTotpSecret(secret,key);
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:1});
try{
 const row=await pool.query(
  "UPDATE civic_users SET totp_secret_encrypted=$1,totp_last_counter=-1 WHERE email=$2 AND role IN ('reviewer','admin') AND active=true AND totp_secret_encrypted IS NULL RETURNING email",
  [sealed,email]
 );
 if(row.rowCount!==1)throw new Error("Eligible account not found or MFA already enrolled");
 // Display locally ONCE; never paste to issues, commits or automation logs.
 console.log("TOTP enrollment URI (keep private):");
 console.log("otpauth://totp/Protesto:"+encodeURIComponent(email)+"?secret="+encodeBase32(secret)+"&issuer=Protesto&algorithm=SHA1&digits=6&period=30");
 console.log("Configure an authenticator before signing out. Secure recovery is not yet implemented.");
}finally{await pool.end();secret.fill(0);}
