// Reject any rehearsal that could be pointed at a real database or deployment.
export function isolatedStagingBoundary(env){
 try{
  if(env.PROTESTO_STAGING_REHEARSAL!=="1"||env.GITHUB_ACTIONS!=="true"||
     env.NODE_ENV==="production"||env.PROTESTO_BACKUP_TEST!=="1")return false;
  const d=new URL(env.DATABASE_URL),origin=new URL(env.APP_ORIGIN);
  if(d.protocol!=="postgres:"&&d.protocol!=="postgresql:")return false;
  if(d.hostname!=="127.0.0.1"||d.port!=="5432"||d.pathname!=="/protesto")return false;
  if(origin.origin!=="http://127.0.0.1:4174")return false;
  if(!env.PROTESTO_RATE_LIMIT_SECRET||!env.PROTESTO_DIALOGUE_SECRET)return false;
  return true;
 }catch{return false;}
}
