import {validateSourceUrl} from "../domain.mjs";
// Public outbound links must never include credentials, query tokens or private
// IP/localhost destinations. Link identity/authenticity still needs human review.
export function safePublicExternalUrl(value){
 let text;try{text=validateSourceUrl(value);}catch{return null;}
 if(!text)return null;
 const url=new URL(text),host=url.hostname.toLowerCase().replace(/\.+$/u,"");
 if(url.search||url.hash||url.username||url.password||host==="localhost"||
    host.endsWith(".localhost")||host.endsWith(".local")||host.startsWith("["))return null;
 const ip=/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
 if(ip){const [a,b]=ip.slice(1).map(Number);
  if(a===0||a===10||a===127||a>=224||a===169&&b===254||a===192&&b===168||a===172&&b>=16&&b<=31||a===100&&b>=64&&b<=127)return null;
 }
 if(!host.includes(".")||url.protocol!=="https:")return null;
 return url.toString();
}
