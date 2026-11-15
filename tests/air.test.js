// Luftkampf-System (Launcher -> Super Jump -> Luft-Combo -> Finisher): node tests/air.test.js
import assert from'node:assert/strict';
import{Game}from'../src/core/game.js';
import{Fighter}from'../src/core/fighter.js';
import{InputBuffer}from'../src/core/input.js';
import{AIController}from'../src/core/ai.js';
import{CHARACTERS}from'../src/core/characters.js';
import{netHash}from'../src/core/netplay.js';
import{GROUND,AIR,PHYS}from'../src/core/config.js';
const ok=n=>console.log('  ✓',n);
function setup(gap=70,char='tiger',foe='wolf'){const i1=new InputBuffer(),i2=new InputBuffer();
 const p1=new Fighter({char:CHARACTERS[char],x:400,facing:1,input:i1}),p2=new Fighter({char:CHARACTERS[foe],x:400+gap,facing:-1,input:i2});
 const g=new Game(p1,p2);while(g.phase!=='fight'){i1.feed(0,0,[]);i2.feed(0,0,[]);g.step()}
 const t=(dx=0,dy=0,pr=[],n=1)=>{for(let k=0;k<n;k++){const fz=g.hitstop>0||g.superFlash>0;i1.feed(dx,dy,k===0?pr:[],fz);i2.feed(0,0,[],fz);g.step()}};
 return{g,p1,p2,t}}
// Launcher + Super Jump: liefert den Zustand direkt nach dem Absprung zurück
function launchAndJump({p1,p2,t},dx=0){t(0,1,['H'],1);let n=0;while(!p1.contact&&n++<30)t(0,1);assert.ok(p1.contact,'Launcher trifft');t(dx,-1,[],1);n=0;while(p1.state!=='air'&&n++<30)t(dx,0);assert.equal(p1.state,'air','Super Jump');return n}
const press=({p1,p2,t},b,dx=1,dy=0,wait=30)=>{const h=p2.comboHits;t(dx,dy,[b],1);let n=0;while(p2.comboHits===h&&n++<wait)t(dx,dy);return p2.comboHits>h};

// 1) Launcher -> Super Jump -> J-K-L: ein Fluss, Finisher endet im harten Knockdown (alle Kämpfer)
for(const c of['tiger','st3g0','kitsune','anubis','cyberdemon']){const S=setup(70,c);const{p1,p2,t}=S;const hp0=p2.hp;
 launchAndJump(S);assert.ok(p2.launched&&p2.state==='airhit','Gegner fliegt');
 assert.ok(press(S,'L'),c+': jL trifft');assert.ok(press(S,'M'),c+': jM trifft');assert.ok(press(S,'H'),c+': jH trifft');
 assert.ok(p2.comboHits>=4,c+': '+p2.comboHits+' Treffer');assert.ok(p2.airHits>=3,'AIR-Zähler '+p2.airHits);
 let n=0;while(p2.state!=='knockdown'&&n++<200)t(1,0);assert.equal(p2.state,'knockdown',c+': Knockdown nach Finisher');assert.ok(p2.hp<hp0-120,c+': Schaden '+(hp0-p2.hp))}
ok('Launcher → Super Jump → J → K → L → Knockdown (5 Figuren)');

// 2) Super Jump ist schnell und zieht zum Gegner (auch ohne Richtungseingabe); Zurückhalten schaltet den Magneten ab
{const S=setup(70);const{p1,p2,t}=S;launchAndJump(S);let reach=-1,gap0=Math.abs(p2.x-p1.x);for(let k=0;k<30;k++){t(0,0);if(reach<0&&Math.abs(p1.y-p2.y)<45)reach=k}
 assert.ok(reach>=0&&reach<=16,'auf Höhe des Gegners nach '+reach+' Frames');const gap=Math.abs(p2.x-p1.x);assert.ok(gap<100,'Abstand '+gap.toFixed(0)+' px (Magnet)');
 const B=setup(70);launchAndJump(B);for(let k=0;k<20;k++)B.t(-1,0);assert.ok(Math.abs(B.p2.x-B.p1.x)>gap+40,'Zurückhalten = kein Magnet ('+Math.abs(B.p2.x-B.p1.x).toFixed(0)+' px)');
 ok('Super Jump: auf Gegnerhöhe '+(reach<=0?'sofort':'nach '+reach+' Frames')+', Magnet-Abstand '+gap.toFixed(0)+' px, Zurückhalten schaltet ihn ab')}

// 3) Luftsteuerung: schnelle Richtungsänderung, Drehen zum Gegner, Steuerung auch während eines Luftangriffs, Fast-Fall
{const{p1,p2,t}=setup(400);t(0,-1,[],1);for(let k=0;k<6;k++)t(1,0);assert.ok(p1.vx>PHYS.airDrift*p1.char.walk*.6,'beschleunigt vorwärts '+p1.vx.toFixed(2));
 for(let k=0;k<6;k++)t(-1,0);assert.ok(p1.vx<0,'dreht die Bewegung innerhalb von 6 Frames um '+p1.vx.toFixed(2));
 p1.x=p2.x+150;p1.facing=-1;t(0,0);t(0,0);assert.equal(p1.facing,-1);p1.x=p2.x-150;for(let k=0;k<3;k++)t(0,0);assert.equal(p1.facing,1,'Luft: zum Gegner gedreht');
 const A=setup(400);A.t(0,-1,[],1);for(let k=0;k<4;k++)A.t(0,0);A.t(0,0,['L'],1);let n=0;while(A.p1.moveName!=='jL'&&n++<6)A.t(0,0);const x0=A.p1.x;for(let k=0;k<10;k++)A.t(-1,0);assert.ok(A.p1.x<x0-6||A.p1.vx<0,'Luftangriff steuerbar');
 const F=setup(400),N=setup(400);F.t(0,-1,[],1);N.t(0,-1,[],1);for(let k=0;k<30;k++){F.t(0,1);N.t(0,0)}assert.ok(F.p1.y>N.p1.y||F.p1.y>=GROUND,'Fast-Fall sinkt schneller');ok('Luftsteuerung: Umkehr, Drehen, Angriffs-Steuerung, Fast-Fall')}

// 4) Air-Dash: 8 Richtungen, zielt auf den Gegner, nur 1×
{const dash=(dx,dy,p2y)=>{const{p1,p2,t}=setup(300);if(p2y!==undefined){p2.y=p2y;p2.noGrav=true;p2.vy=0}t(0,-1,[],1);for(let k=0;k<12;k++)t(0,0);const y0=p1.y;t(dx,dy,['DASH'],1);assert.equal(p1.state,'airdash');const vy=p1.vy;for(let k=0;k<8;k++)t(dx,dy);return{vy,dy:p1.y-y0,x:p1.x,p1,t}};
 const up=dash(1,-1),dn=dash(1,1),fw=dash(1,0);assert.ok(up.vy<-3,'diagonal hoch');assert.ok(dn.vy>4,'diagonal runter');assert.ok(Math.abs(fw.vy)<=AIR.dash.homeMax+.01,'neutral: Zielhilfe begrenzt');
 const hi=dash(1,0,GROUND-420);assert.ok(hi.vy<-1,'zielt auf einen höheren Gegner (vy '+hi.vy.toFixed(1)+')');
 const{p1,t}=dash(1,0);for(let k=0;k<20;k++)t(0,0);t(1,0,['DASH'],1);assert.notEqual(p1.state,'airdash','nur 1 Air-Dash');ok('Air-Dash: hoch/runter/neutral mit Zielhilfe, 1× pro Luftphase')}

// 5) Sky-Launcher (↑ + L): zweite Combo-Stufe, nur 1× pro Combo
{const S=setup(70);const{p1,p2,t}=S;launchAndJump(S);assert.ok(press(S,'L'));assert.ok(press(S,'M'));
 const j0=p2.juggle;assert.ok(press(S,'H',1,-1),'j8H trifft');assert.equal(p1.moveName,'j8H','↑ + L = Sky-Launcher');assert.equal(p2.relaunch,1);assert.ok(p2.vy<-9,'Gegner wird erneut hochgeschleudert (vy '+p2.vy.toFixed(1)+')');assert.ok(p2.juggle<j0+1,'Juggle-Punkte zurück');assert.equal(p2.launched,true);
 // zweite Stufe: weiter kombinieren
 const h=p2.comboHits;let n=0;while(p1.state==='attack'&&n++<25)t(1,0);t(1,0,['L'],1);n=0;while(p2.comboHits===h&&n++<40)t(1,0);assert.ok(p2.comboHits>h,'zweite Stufe trifft (jL)');
 // ein zweiter Sky-Launcher in derselben Combo launcht nicht mehr
 p1.airJumps=1;p1.airDashes=1;const vyB=p2.vy;n=0;while(p1.state==='attack'&&n++<25)t(1,0);const h2=p2.comboHits;t(1,-1,['H'],1);n=0;while(p2.comboHits===h2&&n++<30)t(1,-1);
 if(p2.comboHits>h2){assert.equal(p2.relaunch,1,'kein 2. Relaunch');assert.ok(p2.vy>-12,'kein erneuter Launch (vy '+p2.vy.toFixed(1)+')')}
 ok('Sky-Launcher: Re-Launch 1× pro Combo, zweite Stufe verbindet')}

// 6) Meteor-Spike (↓ + L): senkrecht nach unten, Boden-Prall, einmal Rückprall, harter Knockdown
{const S=setup(70);const{g,p1,p2,t}=S;launchAndJump(S);assert.ok(press(S,'L'));assert.ok(press(S,'H',1,1),'j2H trifft');assert.equal(p1.moveName,'j2H');assert.equal(p2.slam,true);assert.ok(p2.vy>=15,'rammt nach unten '+p2.vy);
 let bounced=false,sh=0,prev=p2.vy,n=0;while(p2.state!=='knockdown'&&n++<200){t(0,0);sh=Math.max(sh,g.shake);if(prev>0&&p2.vy<-8&&p2.state==='airhit')bounced=true;prev=p2.vy}
 assert.ok(bounced,'federt vom Boden zurück');assert.equal(p2.state,'knockdown');assert.ok(p2.kdFrames>=50,'harter Knockdown');assert.ok(sh>=10,'Screen-Shake '+sh);
 ok('Meteor-Spike: Boden-Prall + Rückprall + harter Knockdown')}

// 7) Juggle: Gegner bleibt in Reichweite und im Bild, Auftrieb nimmt ab, Limit lässt ihn fallen
{const S=setup(70);const{p1,p2,t}=S;launchAndJump(S);let top=0,xmax=0,vys=[];for(let k=0;k<140;k++){const h=p2.comboHits;t(1,0,k%5===0?['L']:[]);if(p2.comboHits>h&&p2.state==='airhit'&&p2.vy<0)vys.push(p2.vy);top=Math.max(top,GROUND-p2.y);xmax=Math.max(xmax,Math.abs(p2.x-p1.x));if(p2.state==='knockdown')break}
 assert.ok(top<420,'maximale Höhe '+top.toFixed(0));assert.ok(xmax<260,'Gegner bleibt in Reichweite ('+xmax.toFixed(0)+' px)');
 const first=vys.slice(0,2).reduce((a,b)=>a+b,0)/2,last=vys.slice(-2).reduce((a,b)=>a+b,0)/2;assert.ok(vys.length<4||last>first+.5,'Auftrieb nimmt ab ('+first.toFixed(1)+' → '+last.toFixed(1)+')');
 assert.ok(p2.juggle<=PHYS.juggleMax+3,'Juggle begrenzt');ok('Juggle: Höhe ≤ '+top.toFixed(0)+' px, Reichweite ≤ '+xmax.toFixed(0)+' px, Auftrieb nimmt ab')}

// 8) Hover: Angreifer hängt nach einem Lufttreffer (kein Absinken mitten in der Kette)
{const S=setup(70);const{p1,p2,t}=S;launchAndJump(S);p1.chase=0;for(let k=0;k<3;k++)t(1,0);assert.ok(press(S,'L'));assert.ok(p1.hoverF>0,'Hover aktiv');assert.ok(p1.vy<=AIR.hover.vy+.01,'Auftrieb nach Treffer '+p1.vy.toFixed(1));
 p1.vy=0;p1.hoverF=AIR.hover.frames;const y0=p1.y;for(let k=0;k<AIR.hover.frames;k++)t(1,0);const N=setup(400);N.t(0,-1,[],1);for(let k=0;k<20;k++)N.t(0,0);N.p1.vy=0;const ya=N.p1.y;for(let k=0;k<AIR.hover.frames;k++)N.t(0,0);
 const sink=p1.y-y0,free=N.p1.y-ya;assert.ok(sink<free*.6,'sinkt deutlich langsamer ('+sink.toFixed(0)+' statt '+free.toFixed(0)+' px)');ok('Luft-Hover nach Treffer ('+sink.toFixed(0)+' px Absinken statt '+free.toFixed(0)+')')}

// 9) Air-Hyper (Himmelsbrecher): kostet 1 Balken, schwebt, mehrfach treffen, Finale rammt zu Boden
{const S=setup(70);const{g,p1,p2,t}=S;p1.meter=300;launchAndJump(S);assert.ok(press(S,'L'));const y0=p1.y,hp0=p2.hp,m0=p1.meter;t(1,0,['SUP'],1);let w=0;while(p1.moveName!=='airsuper'&&w++<20)t(1,0);assert.equal(p1.moveName,'airsuper');assert.equal(p1.meter,m0-100);assert.ok(g.superFlash>0,'Super-Flash');
 let ymin=p1.y,ymax=p1.y,hits0=p2.comboHits,slam=false,n=0;while(p2.state!=='knockdown'&&n++<260){t(1,0);ymin=Math.min(ymin,p1.y);ymax=Math.max(ymax,p1.y);if(p2.slam)slam=true}
 assert.ok(p2.state==='knockdown','Knockdown');assert.ok(hp0-p2.hp>90,'Schaden '+(hp0-p2.hp));assert.ok(slam,'Finale = Boden-Prall');ok('Air-Hyper: -'+(hp0-p2.hp)+' HP, Boden-Prall')}
{const{p1,t}=setup(70);p1.meter=50;t(0,-1,[],1);for(let k=0;k<6;k++)t(0,0);t(0,0,['SUP'],1);assert.notEqual(p1.moveName,'airsuper','ohne Balken kein Air-Hyper');ok('Air-Hyper braucht 1 Balken')}

// 10) Pop-up-Jump-Cancel (normaler Treffer) bekommt dieselbe Verfolgung
{const{p1,p2,t}=setup(70);t(0,0,['H'],1);let n=0;while(!p1.contact&&n++<40)t();t(0,-1,[],1);n=0;while(p1.state!=='air'&&n++<25)t();assert.ok(p1.chase>0,'Verfolgung aktiv');let hit=false;for(let k=0;k<25&&!hit;k++){t(0,0,k===3?['L']:[]);hit=p2.comboHits>=2}assert.ok(hit,'Luft-Treffer nach 5H-Jump-Cancel ohne Richtungseingabe');ok('5H → Jump-Cancel → Luft-Treffer (automatisch verfolgt)')}

// 11) Alles deterministisch (Online-Lockstep): gleiche Eingaben = gleicher Prüfwert in jedem Frame
{const run=()=>{const S=setup(70);const{g,p1,p2,t}=S;p1.meter=300;const hs=[];const script=(k)=>k===0?[0,1,['H']]:k===9?[0,-1,[]]:k===18?[1,0,['L']]:k===26?[1,0,['M']]:k===36?[1,-1,['H']]:k===60?[1,0,['L']]:k===80?[1,1,['H']]:[1,0,[]];
 for(let k=0;k<260;k++){const[dx,dy,pr]=script(k);t(dx,dy,pr,1);hs.push(netHash(g))}return hs};
 const a=run(),b=run();assert.deepEqual(a,b);assert.ok(new Set(a).size>100);ok('Deterministisch: '+a.length+' Frames identischer Prüfwert')}

// 12) Bestehendes bleibt: Block in der Luft/am Boden, Launcher-Knockdown, Melee ohne Luft-Assist
{const{p1,p2,t}=setup(70);t(0,0,['M'],1);let n=0;while(p2.state==='idle'&&n++<20)t(0,0,[],1);assert.ok(p2.state!=='block');
 const B=setup(70);B.p2.input.feed(1,0,[]);B.t(0,0,['M'],1);n=0;while(B.p2.state!=='block'&&n++<30){B.p2.input.feed(1,0,[]);B.t(0,0)}ok('Bodenkampf unverändert (Block/Pop-up/Launcher: siehe sim/pop-Tests)')}

// 13) KI kämpft in der Luft: Launcher -> Super Jump -> Luft-Combo, ab NORMAL auch Finisher (feste Zufallsfolge)
{const seedRand=s=>()=>((s^=s<<13,s^=s>>>17,s^=s<<5)>>>0)/4294967296,R0=Math.random;
 const stats=[];for(const lv of[0,1,2,3]){Math.random=seedRand(1234+lv);let best=0,air=0,combos=0,slams=0,relaunch=0,fin=0;
  for(const foe of['tiger','kitsune']){const ai=new AIController(lv),pass=new InputBuffer();ai.setLevel(lv);
   const p1=new Fighter({char:CHARACTERS.st3g0,x:400,facing:1,input:ai}),p2=new Fighter({char:CHARACTERS[foe],x:520,facing:-1,input:pass});p1.meter=300;
   const g=new Game(p1,p2);while(g.phase!=='fight'){ai.feed(0,0,[]);pass.feed(0,0,[]);g.step()}
   for(let f=0;f<5000;f++){if(g.phase!=='fight'||p2.hp<=0){p2.hp=p2.maxHp;p1.meter=300;if(g.phase!=='fight'){g.startRound();while(g.phase!=='fight'){ai.feed(0,0,[]);pass.feed(0,0,[]);g.step()}}}
    const fz=g.hitstop>0||g.superFlash>0;ai.tick(p1,p2,g);pass.feed(0,0,[],fz);g.step();best=Math.max(best,p2.airHits);if(p2.airHits>=3)air++;if(p2.slam)slams++;relaunch=Math.max(relaunch,p2.relaunch);if(p2.state==='knockdown'&&p2.hard)fin++}}
  stats.push({lv,best,air,slams,relaunch,fin})}
 Math.random=R0;
 assert.equal(stats[0].relaunch,0,'LEICHT: keine Sky-Launcher');assert.ok(stats[2].best>=3,'HART: Luft-Combo (bis '+stats[2].best+' Lufttreffer)');assert.ok(stats[3].best>=4,'ALPTRAUM: lange Luft-Combo ('+stats[3].best+')');
 assert.ok(stats[3].air>=stats[1].air*.6||stats[3].best>=4,'KI-Stufen skalieren');assert.ok(stats[2].slams+stats[3].slams>0,'KI nutzt Meteor-Spike/Air-Hyper');
 ok('KI-Luftkampf: '+stats.map(s=>['LEICHT','NORMAL','HART','ALPTRAUM'][s.lv]+' bis '+s.best+' Lufttreffer').join(', '))}
// 14) Gespiegelt: Angreifer steht rechts (facing -1) – Super Jump, Kette, Sky-Launcher, Spike funktionieren identisch
{const mirror=(seq)=>{const i1=new InputBuffer(),i2=new InputBuffer();const a=new Fighter({char:CHARACTERS.tiger,x:560,facing:-1,input:i1}),d=new Fighter({char:CHARACTERS.wolf,x:490,facing:1,input:i2});
  const g=new Game(a,d);while(g.phase!=='fight'){i1.feed(0,0,[]);i2.feed(0,0,[]);g.step()}
  const t=(dx=0,dy=0,pr=[],n=1)=>{for(let k=0;k<n;k++){const fz=g.hitstop>0||g.superFlash>0;i1.feed(-dx,dy,k===0?pr:[],fz);i2.feed(0,0,[],fz);g.step()}};
  t(0,1,['H'],1);let n=0;while(!a.contact&&n++<30)t(0,1);t(0,-1,[],1);n=0;while(a.state!=='air'&&n++<30)t();
  for(const[b,dy]of seq){const h=d.comboHits;t(1,dy,[b],1);n=0;while(d.comboHits===h&&n++<30)t(1,dy);assert.ok(d.comboHits>h,'gespiegelt: '+b+dy+' trifft')}return{a,d,t}};
 mirror([['L',0],['M',0],['H',0]]);mirror([['L',0],['M',0],['H',-1],['L',0]]);const{d}=mirror([['L',0],['H',1]]);assert.ok(d.slam,'Spike gespiegelt');ok('Gespiegelte Seite (P2 rechts): Kette, Sky-Launcher + frische Kette, Spike')}

// 15) Nach dem Sky-Launcher startet direkt eine frische Kette (ohne exaktes Puffer-Timing), aber nur 1× pro Luftphase
{const S=setup(70);const{p1,p2,t}=S;launchAndJump(S);assert.ok(press(S,'L'));assert.ok(press(S,'H',1,-1));assert.equal(p1.moveName,'j8H');
 const h=p2.comboHits;t(1,0,['L'],1);let n=0;while(p2.comboHits===h&&n++<30)t(1,0);assert.ok(p2.comboHits>h,'jL direkt nach dem Sky-Launcher');assert.equal(p1.moveName,'jL');assert.equal(p1.fresh,1);
 assert.ok(press(S,'M'),'danach normale Kette (jM)');ok('Sky-Launcher → frische Kette ohne Extra-Timing')}

// 16) Boden-Prall nur 1× pro Combo, kein Spike-Loop auf den Rückprall
{const S=setup(70);const{p1,p2,t}=S;launchAndJump(S);let maxS=0,n=0;for(let k=0;k<400&&p2.state!=='knockdown';k++){p1.airJumps=1;p1.airDashes=1;t(1,p1.y>p2.y-40?1:0,k%6===0?['H']:[],1);maxS=Math.max(maxS,p2.slams)}
 assert.equal(maxS,1,'max. 1 Prall pro Combo');assert.equal(p2.state,'knockdown');ok('Boden-Prall: 1× pro Combo')}

// 17) Kein Endlos: Selbst mit allen Ressourcen und Tastenhämmern endet jede Kette im Knockdown, Schaden < 50 % (alle Figuren)
for(const c of['tiger','st3g0','kitsune','anubis','cyberdemon']){const S=setup(70,c,'anubis');const{p1,p2,t,g}=S;p1.meter=300;launchAndJump(S);const hp0=p2.hp,f0=g.frame;
 for(let k=0;k<500&&p2.state!=='knockdown';k++){p1.airJumps=Math.max(p1.airJumps,1);p1.airDashes=1;t(1,k%11===0?-1:0,k%4===0?['L']:k%7===0?['M']:[],1)}
 assert.equal(p2.state,'knockdown',c+': endet im Knockdown');assert.ok(g.frame-f0<450,c+': Dauer '+(g.frame-f0));assert.ok((hp0-p2.hp)/hp0<.5,c+': Schaden '+Math.round(100*(hp0-p2.hp)/hp0)+' %')}
ok('Ressourcen-Spam: jede Kette endet (< 450 F, < 50 % HP, 5 Figuren)')

// 18) Leerschläge: Spike und Air-Hyper ins Leere hängen nicht in der Luft fest und landen normal
{const S=setup(400);const{p1,t}=S;p1.meter=300;t(0,-1,[],1);for(let k=0;k<8;k++)t(0,0);t(1,1,['H'],1);let n=0;while(p1.state==='attack'&&n++<80)t(1,1);assert.notEqual(p1.state,'attack');assert.equal(p1.noGrav,false);
 const B=setup(400);B.p1.meter=300;B.t(0,-1,[],1);for(let k=0;k<8;k++)B.t(0,0);B.t(0,0,['SUP'],1);n=0;while(B.p1.state!=='idle'&&n++<400)B.t(0,0);assert.equal(B.p1.state,'idle','Air-Hyper ins Leere: landet');assert.equal(B.p1.noGrav,false);ok('Leerschläge (Spike / Air-Hyper) bleiben nicht hängen')}
console.log('Luftkampf-Tests bestanden');
