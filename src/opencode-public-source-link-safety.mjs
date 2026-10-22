/** Presentation-only screening, not SSRF protection or proof a source is genuine. */
const localHost=h=>h==="localhost"||h.endsWith(".localhost")||h.endsWith(".local")||h.endsWith(".internal")||h.endsWith(".test")||h.endsWith(".invalid");
function isPrivateHost(host){
 const h=host.replace(/^\[|\]$/g,"").toLowerCase();
 if(localHost(h)||h==="::1"||h==="::"||h.startsWith("fc")||h.startsWith("fd")||h.startsWith("fe8")||h.startsWith("fe9")||h.startsWith("fea")||h.startsWith("feb")||h.startsWith("::ffff:"))return true;
 if(/^\d{1,3}(?:\.\d{1,3}){3}$/.test(h)){
  const p=h.split(".").map(Number);
  return p[0]===0||p[0]===10||p[0]===127||p[0]>=224||(p[0]===169&&p[1]===254)||(p[0]===172&&p[1]>=16&&p[1]<=31)||(p[0]===192&&p[1]===168)||(p[0]===100&&p[1]>=64&&p[1]<=127)||(p[0]===192&&p[1]===0);
 }
 return false;
}
export function publicSourceLinkSafety(value){
 const deny=(reason)=>({allowed:false,reason,verifiedAuthenticity:false,ssrfProtection:false});
 if(typeof value!=="string"||value.length>2048||value.length<10)return deny("invalid_length_or_type");
 if(/[\u0000-\u0020\u007f]/.test(value)||/%(?:0[0-9a-f]|1[0-9a-f]|7f)/i.test(value))return deny("unsafe_characters");
 if(!value.startsWith("https://"))return deny("https_required");
 let u;try{u=new URL(value);}catch{return deny("invalid_url");}
 if(u.protocol!=="https:"||!u.hostname||u.username||u.password)return deny("unsafe_authority");
 if(isPrivateHost(u.hostname))return deny("local_or_private_host");
 if(u.hash)return deny("fragment_not_supported");
 return {allowed:true,reason:"display_candidate_only",display_url:u.href,host:u.hostname,verifiedAuthenticity:false,ssrfProtection:false};
}
