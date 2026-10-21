import {readFile,mkdir,writeFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {resolve,dirname,join} from "node:path";

// Assemble the *existing* browser-only demo into one portable file.
// No production server, secrets, backend routes or live user data are bundled.
const root=fileURLToPath(new URL("../",import.meta.url));
const read=async path=>readFile(join(root,path),"utf8");
const [html,styles,domain,seed,app]=await Promise.all([
 read("index.html"),read("styles.css"),read("src/domain.mjs"),read("src/seed.mjs"),read("src/app.mjs")
]);
if((app.match(/^import /gm)||[]).length!==2)throw Error("Unexpected imports in browser demo; review bundler before shipping");
const scripts=[domain,seed,app].map(part=>part.replace(/^import .*;\s*$/gm,"").replace(/^export (?=(const|function|async function|class) )/gm,""));
const source=scripts.join("\n\n");
if(/^\s*(import|export)\s/m.test(source))throw Error("Unsupported dependency: do not silently bundle");
const inlineCss=styles.replace(/<\/style/gi,"<\\/style");
const inlineJs=source.replace(/<\/script/gi,"<\\/script");
const cssTag='<link rel="stylesheet" href="/styles.css" />';
const scriptTag='<script type="module" src="/src/app.mjs"></script>';
if(!html.includes(cssTag)||!html.includes(scriptTag))throw Error("Demo structure changed; refuse incomplete preview");
let output=html.replace(cssTag,"<style>\n"+inlineCss+"\n</style>").replace(scriptTag,"");
output=output.replace("</body>",'<script>\n'+inlineJs+'\n</script>\n</body>');
const target=resolve(root,"dist-preview");
await mkdir(target,{recursive:true});
await writeFile(join(target,"Protesto-DEMO.html"),output,"utf8");
console.log("Self-contained existing browser demo: dist-preview/Protesto-DEMO.html ("+Buffer.byteLength(output)+" bytes)");
