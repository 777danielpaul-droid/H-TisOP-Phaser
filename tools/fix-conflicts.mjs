// Räumt Git-Merge-Konflikte auf (Zeilen mit <<<<<<< / ======= / >>>>>>>), die sonst "Unexpected token '<<'" im Browser auslösen.
// Aufruf: node tools/fix-conflicts.mjs [--ours|--theirs]   (Standard: --theirs = der neuere Stand, der in den Merge kam)
// Danach wird dist/ automatisch neu gebaut (dist ist generiert, dort bleiben nie Markierungen übrig).
import fs from'node:fs';import path from'node:path';import{fileURLToPath}from'node:url';import{spawnSync}from'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),keepOurs=process.argv.includes('--ours');
const SKIP=new Set(['node_modules','.git','dist','sfx','assets']),EXT=/\.(js|mjs|cjs|css|html|md|json|bat|sh|py|txt)$/;let fixed=0;
function walk(d){for(const f of fs.readdirSync(d)){if(SKIP.has(f))continue;const p=path.join(d,f),st=fs.statSync(p);if(st.isDirectory())walk(p);else if(EXT.test(f))fix(p)}}
function fix(p){const s=fs.readFileSync(p,'utf8');if(!/^<<<<<<< /m.test(s))return;let mode=0,out=[];
 for(const l of s.split('\n')){if(/^<<<<<<< /.test(l)){mode=1;continue}if(mode&&/^=======\s*$/.test(l)){mode=2;continue}if(mode&&/^>>>>>>> /.test(l)){mode=0;continue}
  if(mode===0||(mode===1&&keepOurs)||(mode===2&&!keepOurs))out.push(l)}
 fs.writeFileSync(p,out.join('\n'));fixed++;console.log('Konflikt aufgeräumt:',path.relative(root,p))}
walk(root);console.log(fixed?`${fixed} Datei(en) bereinigt (${keepOurs?'unser':'neuer'} Stand behalten).`:'Keine Konflikt-Markierungen in den Quelldateien gefunden.');
const r=spawnSync(process.execPath,[path.join(root,'tools/build.mjs')],{stdio:'inherit'});
const bad=['dist/index.html','dist/hitisop.html','dist/game.js'].filter(f=>/^<<<<<<< /m.test(fs.readFileSync(path.join(root,f),'utf8')));
console.log(bad.length?'WARNUNG: Markierungen noch in '+bad.join(', '):'dist/ sauber neu gebaut. Jetzt: git add -A && git commit -m "Konflikt aufgeräumt" && git push');process.exit(r.status||0)
