// Eigene Figur (Sprite-Upload): Hintergrund, Raster, Maßstab/Anker, Animationen, Figurenwerte. node tests/custom.test.js
import assert from'node:assert/strict';
import{CUS_SHEETS,CUS_ANIM_LABELS,CUS_STAND_H,cusKeyOut,cusSliceCells,cusPlanSheet,cusBuildAnims,cusCompleteAnims,cusClean,cusMakeChar,cusPrompt,CUS_PROMPT_CELLS,cusNeededCells}from'../src/core/custom.js';
import{Game}from'../src/core/game.js';import{Fighter}from'../src/core/fighter.js';import{InputBuffer}from'../src/core/input.js';import{AIController}from'../src/core/ai.js';
import{CHARACTERS}from'../src/core/characters.js';

// Künstliches Sheet: cols x rows Zellen, Hintergrund bg, je Zelle ein „Kämpfer“ (Körper 100x300, optional Arm nach rechts), Fußlinie base, Versatz dx
function sheet(cols,rows,{cw=600,ch=600,bg=[0,255,0,255],figs={},base=540,body=[40,110,200,255]}={}){
 const w=cols*cw,h=rows*ch,d=new Uint8ClampedArray(w*h*4);for(let i=0;i<w*h;i++){d[i*4]=bg[0];d[i*4+1]=bg[1];d[i*4+2]=bg[2];d[i*4+3]=bg[3]}
 const rect=(x0,y0,x1,y1)=>{for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const o=(y*w+x)*4;d[o]=body[0];d[o+1]=body[1];d[o+2]=body[2];d[o+3]=body[3]}};
 for(let i=0;i<cols*rows;i++){const f=figs[i]||{},c=i%cols,r=Math.floor(i/cols),cx=c*cw+cw/2+(f.dx||0),b=r*ch+base+(f.dy||0),bh=f.h||300;
  rect(cx-50,b-bh,cx+50,b);if(f.arm)rect(cx+50,b-bh+60,cx+50+f.arm,b-bh+90)}
 return{d,w,h}}

// 1) Chroma-Grün: Hintergrund transparent, Körper bleibt, Grün-Saum wird entfernt
{const{d,w,h}=sheet(3,2,{});const edge=(5*w+5)*4;
 d[((300*w)+150)*4]=60;d[((300*w)+150)*4+1]=200;d[((300*w)+150)*4+2]=70;   // Misch-Pixel (Grünstich)
 assert.equal(cusKeyOut(d,w,h),'Chroma-Grün');assert.equal(d[edge+3],0,'Hintergrund weg');
 const body=((540-100)*w+300)*4;assert.equal(d[body+3],255,'Körper bleibt');
 assert.ok(d[((300*w)+150)*4+1]<=Math.max(d[((300*w)+150)*4],d[((300*w)+150)*4+2])+1,'Grün-Saum entfernt')}
// 2) Vorhandene Transparenz bleibt unangetastet
{const{d,w,h}=sheet(3,2,{bg:[0,0,0,0]});assert.equal(cusKeyOut(d,w,h),'Transparenz')}
// 3) Notlösung: einfarbiger grauer Hintergrund (nur randverbunden entfernen; Loch im Körper bleibt)
{const{d,w,h}=sheet(3,2,{bg:[200,200,200,255]});assert.equal(cusKeyOut(d,w,h),'Hintergrundfarbe der Ecken');
 assert.equal(d[3],0);assert.equal(d[((540-100)*w+300)*4+3],255)}

// 4) Raster, Maßstab, Anker: Zelle 1 (300 px hoch) -> Maßstab 300/300; Angriff mit langem Arm darf die Körpermitte nicht verschieben
{const figs={0:{},1:{dx:30},2:{arm:150,dx:-40},3:{h:200,dy:-60},4:{},5:{}};
 const{d,w,h}=sheet(3,2,{figs});cusKeyOut(d,w,h);
 const sl=cusSliceCells(d,w,h,3,2);assert.equal(sl.cells.length,6);assert.ok(sl.ok,'Lücken erkannt');
 const p=cusPlanSheet('punch',d,w,h);assert.ok(!p.error);assert.ok(Math.abs(p.scale-CUS_STAND_H/300)<.01,'Maßstab '+p.scale);
 const f=Object.fromEntries(p.frames.map(x=>[x.name,x]));assert.ok(f.punch_1&&f.punch_2&&f.punch_3&&f.punch_4&&f.punch_5,'Zellen 2-6 geplant');
 // Körper 100 breit: Mitte bei ox + dw/2 muss (ohne Arm) bei etwa 0 liegen, auch wenn die Figur in der Zelle verschoben war
 const mid=x=>x.ox+x.dw/2;assert.ok(Math.abs(mid(f.punch_1))<=6,'Körpermitte Zelle 2: '+mid(f.punch_1));
 assert.ok(f.punch_2.dw>f.punch_1.dw+100,'Arm vergrößert den Zuschnitt');
 assert.ok(Math.abs(f.punch_2.ox-f.punch_1.ox)<=10,'Körper rutscht mit langem Arm nicht ('+f.punch_1.ox+' vs '+f.punch_2.ox+')');
 // Fußlinie: Unterkante des Zuschnitts liegt knapp unter 0 (Fuß), die schwebende Figur (dy -60) liegt entsprechend höher
 assert.ok(Math.abs(f.punch_1.oy+f.punch_1.dh)<=6,'Fuß auf Fußlinie');
 // jede Pose steht mit dem tiefsten Punkt auf der Fußlinie (Sprunghöhe kommt aus der Spielphysik), kleinere Pose bleibt kleiner
 assert.ok(Math.abs(f.punch_3.oy+f.punch_3.dh)<=6,'auch die schwebend gezeichnete Pose sitzt auf der Fußlinie');assert.ok(f.punch_3.dh<f.punch_1.dh*.8,'kleinere Pose bleibt kleiner')}
// 5) Ohne Lücken (Frames berühren sich) -> gleichmäßig geteilt + Hinweis
{const figs={};for(let i=0;i<6;i++)figs[i]={arm:i%3===2?0:320,dx:-100};
 const{d,w,h}=sheet(3,2,{figs,cw:400,ch:600});cusKeyOut(d,w,h);const p=cusPlanSheet('punch',d,w,h);assert.ok(!p.ok);assert.ok(p.notes.some(n=>/Raster/.test(n)))}
// 6) Leere Zelle 1 -> klarer Fehler; niedrige Auflösung -> Hinweis
{const{d,w,h}=sheet(3,2,{figs:{0:{h:1}}});cusKeyOut(d,w,h);const p=cusPlanSheet('punch',d,w,h);assert.ok(p.error||p.notes.some(n=>/Auflösung/.test(n)))}
{const{d,w,h}=sheet(3,2,{cw:300,ch:300,base:270,figs:{0:{h:100},1:{h:100},2:{h:100},3:{h:100},4:{h:100},5:{h:100}}});cusKeyOut(d,w,h);
 assert.ok(cusPlanSheet('punch',d,w,h).notes.some(n=>/Auflösung/.test(n)))}

// 7) Animationen: nur Idle -> spielbar (alle Zustände belegt), mit weiteren Sheets werden eigene Frames genommen
{const have=new Set([0,1,2,3,4,5].map(i=>'idle_1_'+i));const real=cusBuildAnims(have);
 assert.deepEqual(Object.keys(real),['idle']);assert.equal(real.idle.frames.length,6);
 const all=cusCompleteAnims(real);for(const k of Object.keys(CUS_ANIM_LABELS))assert.ok(all[k]&&all[k].frames.length,'Behelf für '+k);
 for(const k of['cblock','airhit','kd','wakeup','hit','block'])assert.ok(all[k].frames.every(n=>have.has(n)),k+' nutzt nur vorhandene Frames');
 assert.equal(cusCompleteAnims({}),null,'ohne Idle keine Figur');
 const need=cusNeededCells(),h2=new Set(have);for(const sh of['idle_2','punch','jump'])for(const i of need[sh])h2.add(sh+'_'+i);
 const r2=cusBuildAnims(h2);assert.equal(r2.idle.frames.length,11,'Idle Teil 1+2');assert.equal(r2.punch.frames.length,5);assert.equal(r2.air.frames.length,5);
 const a2=cusCompleteAnims(r2);assert.equal(a2.heavy.frames[0],'punch_1','schwerer Schlag nutzt Schlag-Frames, solange kein eigenes Sheet da ist');assert.equal(a2.punch.frames[0],'punch_1')}

// 8) Figurenwerte: Eingaben werden begrenzt, Name bereinigt, Vorlage liefert Moves
{const p=cusClean({name:'  <b>Rex</b> der Kämpfer-Hund 12345 ',template:'xx',hp:99999,tempo:-5,dmg:'abc',abwehr:200,glow:'rot'});
 assert.ok(p.name.length<=14&&!/[<>]/.test(p.name)&&p.name===p.name.toUpperCase());assert.equal(p.template,'tiger');assert.equal(p.hp,1300);assert.equal(p.tempo,80);assert.equal(p.dmg,100);assert.equal(p.abwehr,125);assert.match(p.glow,/^#[0-9a-f]{6}$/i);
 const c=cusMakeChar({name:'Rex',template:'tiger',hp:1100,tempo:110,dmg:120,abwehr:80,glow:'#00ffaa'},CHARACTERS.tiger);
 assert.equal(c.id,'custom');assert.equal(c.sprites,'custom');assert.equal(c.hp,1100);assert.ok(Math.abs(c.walk-1.1)<1e-9&&Math.abs(c.dmg-1.2)<1e-9&&Math.abs(c.def-1.25)<1e-9);assert.equal(c.mods,CHARACTERS.tiger.mods)}

// 9) Prompts: für jedes Sheet vorhanden, Figurenbeschreibung eingesetzt, Zellenzahl passt zum Raster
for(const s of CUS_SHEETS){assert.ok(CUS_PROMPT_CELLS[s.key],'Prompt-Text '+s.key);const t=cusPrompt(s.key,'a red panda monk');
 assert.ok(t.includes('a red panda monk')&&t.includes(`${s.c} columns x ${s.r} rows = ${s.c*s.r}`)&&t.includes('#00FF00'),s.key)}

// 10) Spielbarkeit: eigene Figur mit nur einem Sheet (alle Zustände über Behelfe) kämpft stabil gegen die KI
{CHARACTERS.custom=cusMakeChar({name:'Test',template:'st3g0',hp:1000,tempo:100,dmg:100,abwehr:100,glow:'#ff00ff'},CHARACTERS.st3g0);
 const i1=new InputBuffer(),ai=new AIController(2),ai1=new AIController(2);
 const p1=new Fighter({char:CHARACTERS.custom,x:340,facing:1,input:ai1}),p2=new Fighter({char:CHARACTERS.wolf,x:620,facing:-1,input:ai});
 const g=new Game(p1,p2);const states=new Set();for(let k=0;k<4000;k++){g.step();states.add(p1.anim);if(g.phase==='over'||p1.hp<=0||p2.hp<=0){p1.hp=p1.maxHp;p2.hp=p2.maxHp}}
 assert.ok(states.size>=5,'verschiedene Zustände: '+[...states].join(','));delete CHARACTERS.custom}
console.log('Eigene-Figur-Tests bestanden');
