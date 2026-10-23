import {evaluateReadiness} from "./release-gate.mjs";

// Canonical pilot launcher is intentionally a LOCAL synthetic development
// service. Human approval and a separate release entrypoint are prerequisites
// for any future hosted/production mode; no environment flag may bypass this.
export function assertPrivatePilotStartupPolicy({environment,host,port,origin}={}){
 const readiness=evaluateReadiness({ciPassed:false});
 if(readiness.releaseAllowed!==false||readiness.authorizationRequired!==true)
  throw new Error("Private pilot startup refused: release authorization is not locked.");
 if(environment!==undefined&&environment!=="test"&&environment!=="development")
  throw new Error("Private pilot startup refused: unapproved runtime environment.");
 if(host!=="127.0.0.1"&&host!=="::1")
  throw new Error("Private pilot startup refused: only explicit loopback HOST is allowed.");
 if(!Number.isSafeInteger(port)||port<1||port>65535)
  throw new Error("Private pilot startup refused: PORT must be 1–65535.");
 let parsed;
 try{parsed=new URL(origin);}catch{
  throw new Error("Private pilot startup refused: invalid APP_ORIGIN.");
 }
 const expected="http://"+(host==="::1"?"[::1]":host)+":"+port;
 if(parsed.origin!==expected||parsed.protocol!=="http:"||
  parsed.username||parsed.password||parsed.pathname!=="/"||
  parsed.search||parsed.hash||!["", "80"].includes(parsed.port)&&parsed.port!==String(port)){
  throw new Error("Private pilot startup refused: APP_ORIGIN must match the loopback listener exactly.");
 }
 return {mode:"private-loopback-only",releaseAllowed:false};
}
