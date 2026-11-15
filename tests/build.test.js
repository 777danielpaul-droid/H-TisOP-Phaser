import assert from'node:assert/strict';import fs from'node:fs';import path from'node:path';import{fileURLToPath}from'node:url';
// Der Build (tools/build.mjs) bündelt nur Module aus der Liste ORDER. Fehlt ein Modul dort, läuft es in Node-Tests, im Browser aber nicht (ReferenceError).
// Prüft: jedes Modul in src/ steht in ORDER. (Neue Module, die beim Laden schon von anderen gebraucht werden, gehören VOR ihre Nutzer.)
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const b=fs.readFileSync(path.join(root,'tools/build.mjs'),'utf8'),order=[...(/ORDER=\[([^\]]*)\]/.exec(b)[1]).matchAll(/'([^']+)'/g)].map(m=>m[1]);
const all=[];const walk=(d,p='')=>{for(const f of fs.readdirSync(path.join(root,'src',d))){const r=path.join(d,f);if(fs.statSync(path.join(root,'src',r)).isDirectory())walk(r);else if(f.endsWith('.js'))all.push(r.replace(/\.js$/,''))}};walk('');
const missing=all.filter(m=>!order.includes(m));assert.deepEqual(missing,[],'Module fehlen in tools/build.mjs ORDER: '+missing.join(', '));
console.log('  ✓ Build: alle '+all.length+' Module in ORDER\nBuild-Tests bestanden');
