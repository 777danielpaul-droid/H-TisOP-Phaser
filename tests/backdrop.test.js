// Eigene Hintergründe: Dateityp-Erkennung, Slot-Auflösung (Überall / Einzel-Bereich / Original), Optionen, Zeichnen mit Attrappen. node tests/backdrop.test.js
// Der Browser-Teil (Drag & Drop, Upload, Video, Neuladen) wird mit tests/e2e-backdrop.py in einem echten Chromium geprüft.
import assert from'node:assert/strict';
import{Backdrop,bgKind,resolveSlot,BG_SLOTS,BG_DEFAULTS}from'../src/render/backdrop.js';
const ok=n=>console.log('  ✓',n);
{assert.equal(bgKind({type:'image/png',name:'a.png'}),'image');assert.equal(bgKind({type:'video/mp4',name:'a.mp4'}),'video');
 assert.equal(bgKind({type:'',name:'Foto.JPG'}),'image','Endung ohne MIME-Typ (Windows liefert das oft)');assert.equal(bgKind({type:'',name:'clip.MOV'}),'video');
 assert.equal(bgKind({type:'text/plain',name:'a.txt'}),null);assert.equal(bgKind({type:'',name:'noext'}),null);assert.equal(bgKind(null),null);ok('Dateityp: Bild/Video per MIME oder Endung, sonst abgelehnt')}
{const R=resolveSlot;
 assert.equal(R({},'fight'),null,'nichts gesetzt = Original');
 assert.equal(R({all:{name:'a'}},'title'),'all');assert.equal(R({all:{name:'a'}},'select'),'all');assert.equal(R({all:{name:'a'}},'fight'),'all');assert.equal(R({all:{name:'a'}},'all'),'all');
 assert.equal(R({all:{name:'a'},fight:{name:'f'}},'fight'),'fight','Einzel-Bereich hat Vorrang');assert.equal(R({all:{name:'a'},fight:{name:'f'}},'title'),'all');
 assert.equal(R({all:{name:'a'},select:{off:true}},'select'),null,'"Original" überschreibt Überall');assert.equal(R({all:{name:'a'},select:{off:true}},'fight'),'all');
 assert.equal(R({title:{name:'t'}},'fight'),null,'Einzel-Bereich gilt nur für sich');ok('Auflösung: Einzel-Bereich > Überall > Original; "off" blockt Überall')}
{const m=new Backdrop();assert.deepEqual(m.opts,BG_DEFAULTS);m.setOpt('dim',5);assert.equal(m.opts.dim,.9,'Abdunkeln auf 90 % begrenzt');m.setOpt('dim',-1);assert.equal(m.opts.dim,0);m.setOpt('fit','quatsch');assert.equal(m.opts.fit,'cover');m.setOpt('fit','contain');assert.equal(m.opts.fit,'contain');
 let n=0;m.onchange=()=>n++;m.setOpt('parallax',false);assert.equal(m.opts.parallax,false);assert.equal(n,1,'Änderung meldet sich bei der Oberfläche');ok('Optionen: Grenzen + Rückmeldung')}
{const calls=[],g={fillStyle:'',drawImage:(...a)=>calls.push(['img',...a]),fillRect:(...a)=>calls.push(['rect',g.fillStyle,...a])},W=960,H=540,m=new Backdrop(),cv={w:()=>1920,h:()=>1080,src:()=>'SRC',kind:'image',use:0};
 assert.equal(m.draw(g,W,H,'fight'),false,'ohne Medium: false (Renderer zeichnet das Original)');assert.equal(calls.length,0);
 m.items.all={name:'x',kind:'image'};m.media.all=cv;m.opts.dim=0;
 assert.equal(m.has('title'),true);assert.equal(m.draw(g,W,H,'title'),true);let im=calls.find(c=>c[0]==='img');assert.ok(im[2]<=0&&im[3]<=0&&im[4]>=W&&im[5]>=H,'cover: füllt den ganzen Bildschirm');
 assert.ok(Math.abs(im[4]/im[5]-16/9)<.01,'16:9-Quelle bleibt unverzerrt');
 calls.length=0;m.opts.dim=.3;m.draw(g,W,H,'select',{dimAdd:.2});const dim=calls.filter(c=>c[0]==='rect').pop();assert.match(dim[1],/rgba\(5,2,12,0\.5\)/,'Abdunkeln = Einstellung + Zusatz der Menüs');
 // Hochformat: cover schneidet zu (Breite füllt), contain passt ein
 const pt={w:()=>900,h:()=>1600,src:()=>'P',kind:'image',use:0};m.media.all=pt;m.opts.dim=0;calls.length=0;m.draw(g,W,H,'title');im=calls.find(c=>c[0]==='img');assert.ok(im[4]>=W&&im[5]>H,'cover: Hochformat wird zugeschnitten');
 m.opts.fit='contain';calls.length=0;m.draw(g,W,H,'title');im=calls.find(c=>c[0]==='img');assert.ok(im[4]<W&&im[5]<=H+.001,'contain: ganz sichtbar');assert.ok(calls.some(c=>c[0]==='rect'&&c[1]==='#000'),'contain: schwarze Ränder');
 // Parallaxe bleibt innerhalb des Überstands (nie leere Ränder)
 m.opts.fit='cover';m.media.all=cv;m.opts.parallax=true;for(const cam of[{x:-900,y:-300,z:.65},{x:1900,y:500,z:1.4},{x:480,y:270,z:1}]){calls.length=0;m.draw(g,W,H,'fight',{cam});im=calls.find(c=>c[0]==='img');assert.ok(im[2]<=1e-6&&im[3]<=1e-6&&im[2]+im[4]>=W-1e-6&&im[3]+im[5]>=H-1e-6,'Parallaxe lässt keine Lücke: '+JSON.stringify(cam))}
 ok('Zeichnen: cover/contain, Abdunkeln, Parallaxe ohne Ränder, Fallback ohne Medium')}
console.log('Hintergrund-Tests bestanden');
