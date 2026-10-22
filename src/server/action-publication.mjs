import {cleanText} from "../domain.mjs";
export function reviewedActionCopy(body){
 if(body?.checks?.privacyReviewed!==true||body?.checks?.publicCopyReviewed!==true)return null;
 const raw=body.public;if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const title=cleanText(raw.title,121),description=cleanText(raw.description,2001),area=cleanText(raw.area,121);
 if(title.length<8||title.length>120||description.length<25||description.length>2000||area.length<2||area.length>120)return null;
 return {title,description,area};
}
