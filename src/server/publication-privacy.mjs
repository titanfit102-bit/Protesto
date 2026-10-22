import {cleanText} from "../domain.mjs";
import {safePublicExternalUrl} from "./public-url.mjs";

// Explicit human-controlled PUBLIC COPY, distinct from confidential case input.
// This checks structure/URL hygiene, not PII semantics or factual accuracy.
export function publicCopyDecision(body) {
 if(body?.checks?.publicCopyReviewed!==true)return null;
 const raw=body.public;
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const title=cleanText(raw.title,121),description=cleanText(raw.description,2001),area=cleanText(raw.area,81);
 if(title.length<8||title.length>120||description.length<25||description.length>2000||area.length<2||area.length>80)return null;
 const sourceUrl=safePublicExternalUrl(raw.sourceUrl);
 if(!sourceUrl)return null;
 return {title,description,area,sourceUrl};
}
