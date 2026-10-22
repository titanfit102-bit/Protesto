import {cleanText} from "../domain.mjs";
export function reviewedTopicCopy(body) {
 if(body?.checks?.privacyReviewed!==true||body?.checks?.publicCopyReviewed!==true)return null;
 const raw=body.public;if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const title=cleanText(raw.title,141),description=cleanText(raw.description,1201);
 if(title.length<8||title.length>140||description.length<35||description.length>1200)return null;
 return {title,description};
}
export function reviewedStatementCopy(body) {
 if(body?.privacyReviewed!==true)return null;
 const text=cleanText(body.publicBody,361);
 if(text.length<25||text.length>360)return null;
 return text;
}
