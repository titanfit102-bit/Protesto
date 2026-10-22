// A reviewer-declared SHA-256 fingerprint of PDF bytes hashed in their browser.
// The server receives metadata only. This cannot authenticate a publisher or
// prove that the file matches the URL without independent external comparison.
export const MAX_FINGERPRINT_BYTES=8*1024*1024;
const SHA256=/^[0-9a-f]{64}$/;

export function validateSourceFingerprint(input){
 if(!input||typeof input!=="object"||Array.isArray(input))return null;
 if(typeof input.sha256!=="string"||!SHA256.test(input.sha256)||
    !Number.isSafeInteger(input.byteLength)||
    input.byteLength<5||input.byteLength>MAX_FINGERPRINT_BYTES||
    input.mediaType!=="application/pdf"||
    input.acknowledgedCorrespondence!==true||
    input.acknowledgedPrivacy!==true)return null;
 return {sha256_hex:input.sha256,byte_length:input.byteLength,media_type:input.mediaType};
}

export function privateFingerprintRecord(row){
 if(!row)return null;
 if(typeof row.sha256_hex!=="string"||!SHA256.test(row.sha256_hex)||
   !Number.isSafeInteger(row.byte_length)||row.byte_length<5||
   row.byte_length>MAX_FINGERPRINT_BYTES||
   row.media_type!=="application/pdf")throw new TypeError("Invalid fingerprint record");
 const at=row.created_at instanceof Date?row.created_at:new Date(row.created_at);
 if(!Number.isFinite(at.getTime()))throw new TypeError("Invalid fingerprint timestamp");
 return {
  sha256:row.sha256_hex,
  byteLength:row.byte_length,
  mediaType:row.media_type,
  declaredAt:at.toISOString(),
  status:"reviewer-declared-not-independently-verified"
 };
}
