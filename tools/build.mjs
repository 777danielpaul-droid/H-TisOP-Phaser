// Bündelt src/ (ES-Module) zu dist/game.js (klassisches Script, läuft per Doppelklick) und dist/hitisop.html (alles in einer Datei).
import fs from'node:fs';import path from'node:path';import{fileURLToPath}from'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ORDER=['core/config','core/sfx','core/camera','core/barrier','core/hitbox','core/input','core/moves','core/movesets','core/characters','core/custom','core/particles','core/effects','core/projectile','core/fighter','core/combat','core/ai','core/arcade','core/game','render/sprites','render/audio','render/fonts','render/fx','render/gl','render/rig','render/stage','render/houses','render/hud','render/select','render/customstudio','render/renderer','main'];
let out='';
for(const m of ORDER){let s=fs.readFileSync(path.join(root,'src',m+'.js'),'utf8');
 s=s.replace(/^import\b.*$/gm,'').replace(/^export\s+/gm,'');out+=`\n// ===== ${m} =====\n`+s}
// Sprite-Atlanten (assets/<id>/atlas.webp + meta.json) als Data-URI einbetten, damit dist/game.js und die Single-File-HTML ohne Server laufen
const sp=[];const ad=path.join(root,'assets');
for(const id of fs.existsSync(ad)?fs.readdirSync(ad):[]){const d=path.join(ad,id);
 if(fs.existsSync(path.join(d,'atlas.webp'))&&fs.existsSync(path.join(d,'meta.json')))
  sp.push(`${id}:{meta:${fs.readFileSync(path.join(d,'meta.json'),'utf8')},atlas:"data:image/webp;base64,${fs.readFileSync(path.join(d,'atlas.webp')).toString('base64')}"}`)}
const sd=path.join(root,'sfx'),sx=[];   // Sounds (sfx/<name>.ogg) als Data-URI einbetten
for(const f of fs.existsSync(sd)?fs.readdirSync(sd).sort():[])if(f.endsWith('.ogg'))sx.push(`${JSON.stringify(f.slice(0,-4))}:"data:audio/ogg;base64,${fs.readFileSync(path.join(sd,f)).toString('base64')}"`);
const fd=path.join(root,'assets/fonts'),fo=[];   // Schriften (assets/fonts/<name>.woff2) als Data-URI einbetten (Canvas + Menü, offline)
for(const f of fs.existsSync(fd)?fs.readdirSync(fd).sort():[])if(f.endsWith('.woff2'))fo.push(`${JSON.stringify(f.slice(0,-6))}:"data:font/woff2;base64,${fs.readFileSync(path.join(fd,f)).toString('base64')}"`);
const pre=(fo.length?`window.__FONTS__={${fo.join(',')}};\n`:'')+(sp.length?`window.__SPRITES__={${sp.join(',')}};\n`:'')+(sx.length?`window.__SFX__={${sx.join(',')}};\n`:'');
const js=`${pre}(()=>{'use strict';${out}\n})();`;
fs.mkdirSync(path.join(root,'dist'),{recursive:true});fs.writeFileSync(path.join(root,'dist/game.js'),js);
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');const css=fs.readFileSync(path.join(root,'styles/main.css'),'utf8');
html=html.replace('<link rel="stylesheet" href="styles/main.css">',`<style>${css}</style>`).replace('<script src="dist/game.js"></script>',()=>`<script>${js}</script>`);
fs.writeFileSync(path.join(root,'dist/hitisop.html'),html);
fs.writeFileSync(path.join(root,'dist/index.html'),html);   // für Static-Hosting (Render: Publish Directory = dist)
console.log('Build OK:',(js.length/1024).toFixed(0)+' KB JS -> dist/game.js, dist/hitisop.html');
