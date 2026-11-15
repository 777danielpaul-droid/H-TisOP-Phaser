// Headless-Tests der Kampflogik: node tests/sim.test.js
import assert from'node:assert/strict';
import{Game}from'../src/core/game.js';
import{Fighter}from'../src/core/fighter.js';
import{InputBuffer}from'../src/core/input.js';
import{CHARACTERS}from'../src/core/characters.js';
import{GROUND,PHYS}from'../src/core/config.js';
function setup(gap=70){const i1=new InputBuffer(),i2=new InputBuffer();
 const p1=new Fighter({char:CHARACTERS.tiger,x:400,facing:1,input:i1}),p2=new Fighter({char:CHARACTERS.wolf,x:400+gap,facing:-1,input:i2});
 const g=new Game(p1,p2);while(g.phase!=='fight'){i1.feed(0,0,[]);i2.feed(0,0,[]);g.step()}
 const t=(dx=0,dy=0,pr=[],n=1,dx2=0,dy2=0)=>{for(let k=0;k<n;k++){const fz=g.hitstop>0||g.superFlash>0;i1.feed(dx,dy,k===0?pr:[],fz);i2.feed(dx2,dy2,[],fz);g.step()}};
 return{g,p1,p2,i1,i2,t}}
const ok=n=>console.log('  ✓',n);
// 1) Sprung + Doppelsprung + Landung
{const{p1,t}=setup(300);t(0,-1,[],1);assert.ok(p1.y<GROUND,'abgehoben');assert.equal(p1.state,'air');
 let top=GROUND;for(let k=0;k<20;k++){t();top=Math.min(top,p1.y)}assert.ok(GROUND-top>250,'hoher Sprung '+(GROUND-top));
 const vy0=p1.vy;t(0,-1,[],1);assert.equal(p1.vy<vy0-5,true,'Doppelsprung');assert.equal(p1.airJumps,0);
 t(0,0,[],1);const vyB=p1.vy;t(0,-1,[],1);assert.ok(p1.vy>vyB-3,'kein dritter Sprung');
 for(let k=0;k<120;k++)t();assert.equal(p1.y,GROUND);assert.equal(p1.state,'idle');ok('Sprung/Doppelsprung/Landung')}
// 2) Jump-Buffer: Eingabe kurz vor der Landung springt sofort bei Landung
{const{p1,t}=setup(300);t(0,-1,[],1);t(0,0,[],1);t(0,-1,[],1);p1.airJumps=0; // Luft, kein Doppelsprung mehr
 let n=0;while(p1.y<GROUND-12&&n++<100)t();t(0,0,['UP'],1); // Buffer-Eingabe kurz vor Boden
 let jumped=false;for(let k=0;k<8;k++){t();if(p1.vy<-5&&p1.y<GROUND){jumped=true;break}}assert.ok(jumped,'gepufferter Sprung');ok('Jump-Buffering')}
// 3) Coyote-Time: Boden verlassen ohne Sprung (z.B. Rising-Ende) -> Sprung noch 6 Frames möglich
{const{p1,t}=setup(300);p1.y=GROUND-3;p1.vy=-1;p1.coyote=PHYS.coyote;p1.state='air';p1.airJumps=0;t(0,0,[],1);t(0,-1,[],1);assert.ok(p1.vy<-10,'Coyote-Sprung');ok('Coyote-Time')}
// 4) Air-Dash (1x) + Dash am Boden
{const{p1,t}=setup(300);const x0=p1.x;t(1,0,['DASH'],1);assert.equal(p1.state,'dash');t(0,0,[],14);assert.ok(p1.x-x0>60,'Bodendash');
 for(let k=0;k<10;k++)t();t(0,-1,[],1);t(0,0,[],3);const xa=p1.x;t(1,0,['DASH'],1);assert.equal(p1.state,'airdash');t(0,0,[],8);assert.ok(p1.x-xa>50,'Air-Dash');
 t(0,0,[],14);t(0,0,['DASH'],1);assert.notEqual(p1.state,'airdash','nur 1 Air-Dash');ok('Dash / Air-Dash')}
// 5) Chain L -> M -> H mit Schadensskalierung
{const{p1,p2,t}=setup(70);const hp0=p2.hp;t(0,0,['L'],1);let n=0;while(!p1.contact&&n++<20)t();assert.ok(p1.contact,'L trifft');
 t(0,0,['M'],1);n=0;while(p1.moveName!=='5M'&&n++<25)t();assert.equal(p1.moveName,'5M','Chain L->M');
 n=0;while(!(p1.contact)&&n++<30)t();t(0,0,['H'],1);n=0;while(p1.moveName!=='5H'&&n++<25)t();assert.equal(p1.moveName,'5H','Chain M->H');
 n=0;while(p1.state==='attack'&&n++<60)t();assert.equal(p2.comboHits>=3||p2.comboShow.hits>=3,true,'3 Treffer');
 const d=hp0-p2.hp;assert.ok(d<30+55+90&&d>100,'Skalierung '+d);ok('Chain-Combo + Schadensskalierung ('+d+' statt 175)')}
// 6) Launcher -> Jump-Cancel -> Luft-Combo
{const{p1,p2,t}=setup(70);t(0,1,['H'],1);let n=0;while(!p1.contact&&n++<30)t(0,1);assert.ok(p1.contact,'Launcher trifft');
 assert.ok(p2.state==='airhit'&&p2.y<GROUND,'Gegner in der Luft');
 t(0,-1,[],1);n=0;while(p1.state!=='air'&&n++<25)t();assert.equal(p1.state,'air','Jump-Cancel');
 let hits=p2.comboHits;for(let k=0;k<25;k++)t(1,0,[]);t(0,0,['L'],1);n=0;while(p1.moveName!=='jL'&&n++<5)t();
 n=0;while(p2.comboHits===hits&&n++<30)t();assert.ok(p2.comboHits>hits,'Luft-L trifft');
 t(0,0,['M'],1);n=0;while(p1.moveName!=='jM'&&n++<25)t();assert.equal(p1.moveName,'jM','Luft-Chain');
 n=0;while(p2.state==='airhit'&&p2.comboHits<4&&n++<30)t();assert.ok(p2.comboHits>=3,'Luft-Combo Treffer '+p2.comboHits);ok('Launcher + Jump-Cancel + Luft-Combo ('+p2.comboHits+' Treffer)')}
// 7) Fireball per Motion QCF + L
{const{p1,p2,g,t}=setup(400);t(0,1,[],1);t(1,1,[],1);t(1,0,['L'],1);let n=0;while(g.projectiles.length===0&&n++<30)t();assert.ok(g.projectiles.length>0,'Projektil');
 const hp0=p2.hp;n=0;while(p2.hp===hp0&&n++<120)t();assert.ok(p2.hp<hp0,'Projektil trifft');ok('QCF-Motion -> Fireball trifft')}
// 8) Block: Gegner hält zurück -> nur Chip-Schaden, Blockstun
{const{p1,p2,t}=setup(70);t(0,0,['H'],1,1,0);let n=0;while(p2.state!=='block'&&n++<30)t(0,0,[],1,1,0);assert.equal(p2.state,'block');assert.ok(p2.hp>=1000*1.05-12,'Chip-Schaden klein '+p2.hp);ok('Block + Chip')}
// 9) Super: Meter-Kosten, Flash, Multi-Hit
{const{g,p1,p2,t}=setup(150);p1.meter=100;const hp0=p2.hp;t(0,0,['SUP'],1);assert.ok(g.superFlash>0,'Super-Flash');assert.equal(p1.meter,0);
 for(let k=0;k<120;k++)t();assert.ok(hp0-p2.hp>120,'Multi-Hit '+(hp0-p2.hp));ok('Super (-'+(hp0-p2.hp)+' HP)')}
// 10) Ganze Runde läuft durch (KO)
{const{g,p1,p2,t}=setup(70);p2.hp=20;t(0,0,['L'],1);let n=0;while(g.phase==='fight'&&n++<60)t();assert.ok(g.phase==='ko'||g.phase==='result','KO');for(let k=0;k<500;k++)t();assert.ok(g.round===2||g.phase==='match'||g.round>1,'nächste Runde');ok('Rundenablauf')}
// 11) Lange Chain mit Stance-Wechsel: 5L -> 2L -> 5M -> 2M -> 5H -> Fireball, inkl. Kettenlimit
{const{p1,p2,g,t}=setup(70);
 const hitWait=()=>{let n=0;while(!p1.contact&&n++<40)t();assert.ok(p1.contact,'Kontakt '+p1.moveName)};
 const press=(btn,dy,expect)=>{t(0,dy,[btn],1);let n=0;while(p1.moveName!==expect&&n++<30)t(0,dy);assert.equal(p1.moveName,expect,'Chain -> '+expect)};
 t(0,0,['L'],1);hitWait();press('L',1,'2L');hitWait();press('M',0,'5M');hitWait();press('M',1,'2M');hitWait();press('H',0,'5H');hitWait();
 assert.ok(p2.comboHits>=5,'5 Treffer '+p2.comboHits);assert.ok(p1.chainLen>=4,'chainLen '+p1.chainLen);ok('Lange Chain mit Stance-Wechsel ('+p2.comboHits+' Treffer, kein Spezial nötig)')}
// 12) Luft-Combo mit Doppelsprung-Cancel: Launcher -> Jump-Cancel -> jL -> Doppelsprung -> weiterer Luft-Treffer
{const{p1,p2,t}=setup(70);t(0,1,['H'],1);let n=0;while(!p1.contact&&n++<30)t(0,1);t(0,-1,[],1);n=0;while(p1.state!=='air'&&n++<30)t();
 for(let k=0;k<12;k++)t(1,0);t(0,0,['L'],1);n=0;while(!(p1.contact&&p1.moveName==='jL')&&n++<40)t(1,0);assert.ok(p1.contact,'jL trifft');
 const h=p2.comboHits;assert.equal(p1.airJumps,1);t(0,-1,[],1);let best=h,jumped=false;
 for(let k=0;k<40;k++){t(1,0,(k%3===0)?[k%2?'M':'L']:[]);if(p1.airJumps===0)jumped=true;best=Math.max(best,p2.comboHits)}
 assert.ok(jumped,'Doppelsprung-Cancel nach Luft-Treffer');assert.ok(best>h,'weiterer Luft-Treffer nach Doppelsprung ('+best+' statt '+h+')');ok('Doppelsprung-Cancel in der Luft-Combo ('+best+' Treffer)')}
// 13) Schnell: 3er-Chain (L,M,H) ist jetzt in <= 40 Frames komplett getroffen
{const{p1,p2,t}=setup(70);let f=0;const tt=(...a)=>{t(...a);f++};tt(0,0,['L'],1);let n=0;while(!p1.contact&&n++<20)tt();tt(0,0,['M'],1);n=0;while(!(p1.moveName==='5M'&&p1.contact)&&n++<40)tt();tt(0,0,['H'],1);n=0;while(!(p1.moveName==='5H'&&p1.contact)&&n++<40)tt();
 assert.ok(p2.comboHits>=3,'3 Treffer');assert.ok(f<=45,'schnell: '+f+' Frames (inkl. 3 Hitstops)');ok('L-M-H Chain in '+f+' Frames')}
// 14) Launcher -> kein Air-Recovery: Gegner landet im Knockdown (hart), steht danach wieder auf
{const{p1,p2,t}=setup(70);t(0,1,['H'],1);let n=0;while(!p1.contact&&n++<30)t(0,1);assert.equal(p2.launched,true,'als Launch markiert');
 n=0;while(p2.state!=='knockdown'&&n++<200)t();assert.equal(p2.state,'knockdown','Knockdown nach Launcher');assert.equal(p2.launched,false);
 n=0;while(p2.state!=='wakeup'&&n++<120)t();assert.equal(p2.state,'wakeup');n=0;while(p2.state!=='idle'&&n++<60)t();assert.equal(p2.state,'idle');ok('Launcher -> Knockdown -> Aufstehen')}
console.log('Alle Tests bestanden');
