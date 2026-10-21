export function postgresEnv(raw){
 if(!raw||typeof raw!=='string')throw new Error('Postgres database URL missing.');
 let url;
 try{url=new URL(raw);}catch{throw new Error('Invalid PostgreSQL connection URL.');}
 if(!['postgres:','postgresql:'].includes(url.protocol)||!url.hostname||!url.pathname||url.pathname==='/')throw new Error('Invalid PostgreSQL connection URL.');
 const dbname=decodeURIComponent(url.pathname.slice(1));
 if(!dbname||dbname.includes('/'))throw new Error('Invalid database name.');
 const allowedSsl=['disable','allow','prefer','require','verify-ca','verify-full'];
 const ssl=url.searchParams.get('sslmode')||'prefer';
 if(!allowedSsl.includes(ssl))throw new Error('Unsupported PostgreSQL SSL mode.');
 return {
  name:dbname,
  host:url.hostname,
  port:url.port||'5432',
  env:{
   ...process.env,
   PGHOST:url.hostname,
   PGPORT:url.port||'5432',
   PGUSER:decodeURIComponent(url.username||''),
   PGPASSWORD:decodeURIComponent(url.password||''),
   PGDATABASE:dbname,
   PGSSLMODE:ssl
  }
 };
}
