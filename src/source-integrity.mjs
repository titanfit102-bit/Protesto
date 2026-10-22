// Local PDF comparison only; no external download or authenticity claim.
export async function hashLocalPdf(bytes, subtle=globalThis.crypto?.subtle) {
 if(!(bytes instanceof ArrayBuffer)||bytes.byteLength<5||bytes.byteLength>8*1024*1024)
   throw new TypeError("PDF duhet të jetë deri 8 MiB.");
 const head=new TextDecoder().decode(bytes.slice(0,5));
 if(head!=="%PDF-")throw new TypeError("Nuk është PDF me firmë bazë.");
 if(!subtle||typeof subtle.digest!=="function")throw new TypeError("WebCrypto nuk është i disponueshëm.");
 const hash=new Uint8Array(await subtle.digest("SHA-256",bytes));
 return [...hash].map(b=>b.toString(16).padStart(2,"0")).join("");
}
export async function comparePdfWithDeclaration(bytes,record,subtle) {
 if(!record||typeof record.sha256!=="string"||!/^[a-f0-9]{64}$/.test(record.sha256))
  throw new TypeError("Gjurmë e pavlefshme.");
 const calculated=await hashLocalPdf(bytes,subtle);
 return {matches:calculated===record.sha256,calculated,recorded:record.sha256};
}
