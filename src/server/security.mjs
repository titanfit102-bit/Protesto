import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
const COOKIE="protesto_session";
export const SESSION_AGE_SECONDS=8*60*60;
export function normalizeEmail(raw){
 const email=typeof raw==="string"?raw.trim().toLowerCase():"";
 if(email.length>254||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))throw new Error("Email i pavlefshëm.");
 return email;
}
export function hashPassword(password,salt=randomBytes(16).toString("hex")){
 if(typeof password!=="string"||password.length<12||password.length>256)throw new Error("Fjalëkalimi duhet të ketë 12–256 karaktere.");
 return "scrypt$"+salt+"$"+scryptSync(password,salt,64).toString("hex");
}
export function verifyPassword(password,stored){
 if(typeof password!=="string"||password.length>256||typeof stored!=="string")return false;
 const p=stored.split("$");
 if(p.length!==3||p[0]!=="scrypt"||!/^[a-f0-9]{32}$/.test(p[1])||!/^[a-f0-9]{128}$/.test(p[2]))return false;
 return timingSafeEqual(scryptSync(password,p[1],64),Buffer.from(p[2],"hex"));
}
export const newSessionToken=()=>randomBytes(32).toString("base64url");
export const tokenHash=(token)=>createHash("sha256").update(token).digest("hex");
export function parseSessionCookie(raw){
 const part=typeof raw==="string"?raw.split(";").map(x=>x.trim()).find(x=>x.startsWith(COOKIE+"=")):null;
 const token=part?.slice(COOKIE.length+1)||"";
 return /^[a-zA-Z0-9_-]{43}$/.test(token)?token:"";
}
export function sessionCookie(token,secure=false){
 return COOKIE+"="+token+"; Path=/; HttpOnly; SameSite=Strict; Max-Age="+SESSION_AGE_SECONDS+(secure?"; Secure":"");
}
export function clearSessionCookie(secure=false){
 return COOKIE+"=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0"+(secure?"; Secure":"");
}
export function secureWrite(req,origin){
 return req.headers.origin===origin&&req.headers["x-protesto-request"]==="1"&&req.headers["sec-fetch-site"]!=="cross-site";
}
export const canReview=(role)=>role==="reviewer"||role==="admin";
