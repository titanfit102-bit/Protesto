const CATALOG=Object.freeze({
 loading:["info","Përmbajtja po ngarkohet."],
 empty:["info","Nuk ka rezultate për kriteret e zgjedhura."],
 unauthorized:["error","Nuk ke leje për këtë veprim."],
 rate_limited:["warning","Ka shumë kërkesa. Provo përsëri më vonë."],
 pending_review:["info","Raportimi është në pritje të shqyrtimit editorial."],
 finalized_aggregates:["success","Rezultatet e agreguara janë përfunduar; nuk përfaqësojnë popullsinë."],
 saved:["success","Veprimi u ruajt."],
 failed:["error","Veprimi nuk u përfundua. Provo përsëri."]
});
export function accessibleStatusMessage(code){
 const found=typeof code==="string"&&Object.hasOwn(CATALOG,code)?CATALOG[code]:["warning","Gjendje e panjohur. Kontrollo veprimin."];
 return {severity:found[0],message:found[1],ariaLive:found[0]==="error"?"assertive":"polite"};
}
