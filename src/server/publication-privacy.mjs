import {cleanText,validateSourceUrl} from "../domain.mjs";

// Explicit human-controlled PUBLIC COPY, distinct from confidential case input.
// This checks structure/URL hygiene, not PII semantics or factual accuracy.
export function publicCopyDecision(body) {
 if(body?.checks?.publicCopyReviewed!==true)return null;
 const raw=body.public;
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const title=cleanText(raw.title,121),description=cleanText(raw.description,2001);
 if(title.length<8||title.length>120||description.length<25||description.length>2000)return null;
 let sourceUrl;
 try{sourceUrl=validateSourceUrl(raw.sourceUrl);}catch{return null;}
 if(!sourceUrl)return null;
 const url=new URL(sourceUrl);
 if(url.search||url.hash)return null; // no query tokens, fragments or trackers
 return {title,description,sourceUrl};
}
