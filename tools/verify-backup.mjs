import {verifyEncryptedBackup} from "../src/ops/backup-crypto.mjs";

const file=process.env.PROTESTO_BACKUP_FILE;
const secret=process.env.PROTESTO_BACKUP_SECRET;
if(!file||!secret)throw new Error("Set PROTESTO_BACKUP_FILE and PROTESTO_BACKUP_SECRET.");
const result=await verifyEncryptedBackup(file,secret);
console.log("Encrypted archive authenticated:",result.encryptedBytes,"bytes.");
console.log("Archive integrity verified; database restoration must still be tested separately.");
