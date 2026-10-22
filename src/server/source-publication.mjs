import {safePublicExternalUrl} from "./public-url.mjs";

// Public source responses contain only reviewer-accepted link metadata.
// Original case context and reviewer notes remain on authorized private routes.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACCEPTED="accepted";
const ATTESTATION=" [SOURCE_CHECKS_V1:opened,privacy,public-metadata]";

export function sourceReviewAttestation({decision,note,checks}={}){
 if(decision!=="accepted"&&decision!=="rejected")return {valid:false};
 if(typeof note!=="string"||note.length<20||note.length>1000)return {valid:false};
 if(decision==="rejected")return {valid:true,reviewNote:note};
 if(checks?.sourceOpened!==true||checks?.privacyReviewed!==true||checks?.publicMetadataReviewed!==true)
  return {valid:false};
 if(note.length+ATTESTATION.length>1000)return {valid:false};
 return {valid:true,reviewNote:note+ATTESTATION};
}

export function publicSourceItems(rows){
 if(!Array.isArray(rows))throw new TypeError("Public sources must be an array");
 return rows.map(raw=>{
  if(!raw||typeof raw!=="object"||Array.isArray(raw)||
     raw.state!==ACCEPTED||typeof raw.id!=="string"||!UUID.test(raw.id)||
     typeof raw.title!=="string"||!raw.title.trim()||raw.title.length>160){
    throw new TypeError("Invalid public source record");
  }
  let url;
  url=safePublicExternalUrl(raw.url);
  if(!url)throw new TypeError("Invalid public source URL");
  const date=raw.created_at instanceof Date?raw.created_at:new Date(raw.created_at);
  if(!Number.isFinite(date.getTime()))throw new TypeError("Invalid public source timestamp");
  // Strict allowlist: never return raw context, submitter/reviewer IDs or notes.
  return {id:raw.id,title:raw.title,url,state:ACCEPTED,created_at:date.toISOString()};
 });
}
