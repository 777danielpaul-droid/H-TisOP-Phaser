// Bündelt src/ (ES-Module) zu dist/game.js (klassisches Script, läuft per Doppelklick) und dist/hitisop.html (alles in einer Datei).
import fs from'node:fs';import path from'node:path';import{fileURLToPath}from'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ORDER=['core/config','core/sfx','core/camera','core/barrier','core/hitbox','core/input','core/moves','core/movesets','core/unlocks','core/characters','core/custom','core/particles','core/effects','core/projectile','core/fighter','core/melee','core/combat','core/ai','core/loot','core/story','core/arcade','core/game','render/skins','render/sprites','render/audio','render/fonts','render/fx','render/gl','render/rig','render/stage','render/houses','render/hud','render/storyhud','render/lootui','render/packopen','render/select','render/meleehud','render/customstudio','render/backdrop','render/bgpanel','render/intro','render/musicpanel','render/renderer','main'];
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
const md=path.join(root,'music'),mu=[];   // Musik (music/<name>.ogg) als Data-URI einbetten
for(const f of fs.existsSync(md)?fs.readdirSync(md).sort():[])if(f.endsWith('.ogg'))mu.push(`${JSON.stringify(f.slice(0,-4))}:"data:audio/ogg;base64,${fs.readFileSync(path.join(md,f)).toString('base64')}"`);
// Sicherheitsnetz: fehlt Musik, lieber laut abbrechen als still ohne Menü-/Kampfmusik zu deployen (passiert z. B. wenn *.ogg in .gitignore steht)
const missing=['menu','fight'].filter(n=>!fs.existsSync(path.join(md,n+'.ogg')));
if(missing.length){console.error('FEHLER: music/'+missing.join('.ogg, music/')+'.ogg fehlt (nicht im Repository?). Bitte hinzufügen: git add music/*.ogg');if(process.env.RENDER||process.env.CI)process.exit(1)}
const fd=path.join(root,'assets/fonts'),fo=[];   // Schriften (assets/fonts/<name>.woff2) als Data-URI einbetten (Canvas + Menü, offline)
for(const f of fs.existsSync(fd)?fs.readdirSync(fd).sort():[])if(f.endsWith('.woff2'))fo.push(`${JSON.stringify(f.slice(0,-6))}:"data:font/woff2;base64,${fs.readFileSync(path.join(fd,f)).toString('base64')}"`);
const ud=path.join(root,'assets/aura'),au=[];   // Sieger-Auren (assets/aura/<id>.webp + .json) als Data-URI einbetten
for(const f of fs.existsSync(ud)?fs.readdirSync(ud).sort():[])if(f.endsWith('.webp')){const id=f.slice(0,-5),jp=path.join(ud,id+'.json');if(fs.existsSync(jp))au.push(`${JSON.stringify(id)}:{meta:${fs.readFileSync(jp,'utf8')},atlas:"data:image/webp;base64,${fs.readFileSync(path.join(ud,f)).toString('base64')}"}`)}
const vd=path.join(root,'assets/video'),vi=[];   // Auswahl-Kurzvideos (assets/video/<id>.webm) als Data-URI einbetten
for(const f of fs.existsSync(vd)?fs.readdirSync(vd).sort():[])if(f.endsWith('.webm'))vi.push(`${JSON.stringify(f.slice(0,-5))}:\"data:video/webm;base64,${fs.readFileSync(path.join(vd,f)).toString('base64')}\"`);
const ip=path.join(root,'assets/intro/intro.mp4');   // Intro-Video (assets/intro/intro.mp4) als Data-URI einbetten
const pp=path.join(root,'assets/intro/poster.jpg');   // Standbild fürs Intro (erster Frame), optional
const cdir=path.join(root,'assets/cards'),ca=[];   // Sammelkarten-Bilder (assets/cards/<karten-id>.png|webp|jpg) als Data-URI einbetten
for(const f of fs.existsSync(cdir)?fs.readdirSync(cdir).sort():[]){const m=/^(.+)\.(png|webp|jpe?g)$/i.exec(f);if(m)ca.push(`${JSON.stringify(m[1])}:"data:image/${m[2].toLowerCase().replace('jpg','jpeg')};base64,${fs.readFileSync(path.join(cdir,f)).toString('base64')}"`)}
const pre=(fs.existsSync(pp)?`window.__INTRO_POSTER__="data:image/jpeg;base64,${fs.readFileSync(pp).toString('base64')}";\n`:'')+(fs.existsSync(ip)?`window.__INTRO__="data:video/mp4;base64,${fs.readFileSync(ip).toString('base64')}";\n`:'')+(ca.length?`window.__CARDS__={${ca.join(',')}};\n`:'')+(vi.length?`window.__VIDEOS__={${vi.join(',')}};\n`:'')+(au.length?`window.__AURA__={${au.join(',')}};\n`:'')+(fo.length?`window.__FONTS__={${fo.join(',')}};\n`:'')+(sp.length?`window.__SPRITES__={${sp.join(',')}};\n`:'')+(sx.length?`window.__SFX__={${sx.join(',')}};\n`:'')+(mu.length?`window.__MUSIC__={${mu.join(',')}};\n`:'');
const js=`${pre}(()=>{'use strict';${out}\n})();`;
fs.mkdirSync(path.join(root,'dist'),{recursive:true});fs.writeFileSync(path.join(root,'dist/game.js'),js);
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');const css=fs.readFileSync(path.join(root,'styles/main.css'),'utf8');
html=html.replace('<link rel="stylesheet" href="styles/main.css">',`<style>${css}</style>`).replace('<script src="dist/game.js"></script>',()=>`<script>${js}</script>`);
fs.writeFileSync(path.join(root,'dist/hitisop.html'),html);
fs.writeFileSync(path.join(root,'dist/index.html'),html);   // für Static-Hosting (Render: Publish Directory = dist)
console.log('Build OK:',(js.length/1024).toFixed(0)+' KB JS -> dist/game.js, dist/hitisop.html');
