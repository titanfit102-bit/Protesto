import {cleanText} from "../domain.mjs";
import {safePublicExternalUrl} from "./public-url.mjs";

// Public metadata is independently reviewer approved. No fallback to raw fields.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ATTESTATION=" [SOURCE_CHECKS_V2:opened,privacy,public-metadata]";
export function sourceReviewAttestation({decision,note,checks,publicMetadata}={}){
 if(!["accepted","rejected"].includes(decision)||typeof note!=="string"||note.length<20||note.length>1000)return {valid:false};
 if(decision==="rejected")return {valid:true,reviewNote:note};
 if(checks?.sourceOpened!==true||checks?.privacyReviewed!==true||checks?.publicMetadataReviewed!==true)return {valid:false};
 if(!publicMetadata||typeof publicMetadata!=="object"||Array.isArray(publicMetadata))return {valid:false};
 const publicTitle=cleanText(publicMetadata.title,161),publicUrl=safePublicExternalUrl(publicMetadata.url);
 if(publicTitle.length<8||publicTitle.length>160||!publicUrl||note.length+ATTESTATION.length>1000)return {valid:false};
 return {valid:true,reviewNote:note+ATTESTATION,publicTitle,publicUrl};
}
export function publicSourceItems(rows){
 if(!Array.isArray(rows))throw new TypeError("Public sources must be an array");
 const items=[];
 for(const row of rows){
  if(!row||typeof row!=="object"||Array.isArray(row)||row.state!=="accepted"||
   typeof row.id!=="string"||!UUID.test(row.id)||
   typeof row.public_title!=="string"||row.public_title.trim().length<8||
   row.public_title.length>160)continue;
  const url=safePublicExternalUrl(row.public_url);
  if(!url)continue;
  const date=row.created_at instanceof Date?row.created_at:new Date(row.created_at);
  if(!Number.isFinite(date.getTime()))continue;
  items.push({id:row.id,title:row.public_title,url,state:"accepted",created_at:date.toISOString()});
 }
 return items;
}
