// Story-Terrain (core/terrain.js): Kanten/Ebenen – Wand von unten, Hinaufspringen, Weiterlaufen oben, Herunterfallen, KI-Gegner klettern mit, alle Kapitel sinnvoll.  node tests/terrain.test.js
import assert from'node:assert/strict';
import{Terrain,TERRAIN_HALF}from'../src/core/terrain.js';
import{GROUND}from'../src/core/config.js';
import{Game}from'../src/core/game.js';import{Fighter}from'../src/core/fighter.js';import{AIController}from'../src/core/ai.js';
import{Arcade}from'../src/core/arcade.js';import{CHARACTERS}from'../src/core/characters.js';import{CHAPTERS,LV}from'../src/core/story.js';
const ok=n=>console.log('  ✓',n);
// ---- reine Geometrie ----
{const T=new Terrain([{x0:200,x1:600,h:90},{x0:350,x1:450,h:170}]);
 assert.equal(T.heightAt(100),0);assert.equal(T.heightAt(300),90);assert.equal(T.heightAt(400),170);assert.equal(T.heightAt(601),0);assert.equal(T.floorAt(400),GROUND-170);
 assert.equal(T.block(150,190,GROUND),200-TERRAIN_HALF-.5,'von links gegen die Kante: stoppt davor');
 assert.equal(T.block(650,610,GROUND),600+TERRAIN_HALF+.5,'von rechts gegen die Kante: stoppt davor');
 assert.equal(T.block(150,190,GROUND-95),190,'Füße über der Oberkante: frei (landet oben)');
 assert.equal(T.block(250,300,GROUND-90),300,'auf der Ebene weiterlaufen ist frei');
 const x=T.block(300,380,GROUND-90);assert.ok(x<=350-TERRAIN_HALF,'Treppe: höhere Stufe blockt die 90er Ebene (x='+x+')');
 assert.equal(T.block(500,500,GROUND),500);assert.equal(new Terrain([]).block(0,50,GROUND),50);
 assert.equal(new Terrain([{x0:600,x1:200,h:50}]).heightAt(400),50,'x0/x1 vertauscht ist ok');ok('Geometrie: Höhe, Wand von beiden Seiten, Treppe, Füße über der Kante')}
// ---- Kapitel-Daten: alle Level sinnvoll ----
{for(const c of CHAPTERS){assert.ok(!c.hurdles,'Kapitel '+c.id+': Hindernisse (Kisten) sind entfernt');assert.ok(c.ledges&&c.ledges.length>=2,'Kapitel '+c.id+': hat Kanten');
  const T=new Terrain(c.ledges);
  for(const l of c.ledges){assert.ok(l.x0>-400&&l.x1<LV.x1-300,`Kapitel ${c.id}: Kante ${l.x0}..${l.x1} im Level, nicht am Start/Händler`);assert.ok(l.h>=60&&l.h<=200,`Kapitel ${c.id}: Höhe ${l.h} ist gut hochspringbar`);assert.ok(l.x1-l.x0>=120)}
  // jede Stufe ist von der darunterliegenden Ebene aus erreichbar (Sprunghöhe des schwächsten Springers ~ 216)
  for(const l of c.ledges){const below=T.heightAt(l.x0-TERRAIN_HALF-4);assert.ok(l.h-below<=120,`Kapitel ${c.id}: Stufe an ${l.x0} (${l.h-below} px) ist zu hoch`)}
  // Boss-Welle (letzte) und Start liegen auf ebenem Boden
  assert.equal(T.heightAt(LV.start),0);assert.equal(T.heightAt(c.enc.at(-1).x),0,'Kapitel '+c.id+': Boss-Arena (Mitte) ist eben')}
 ok('Alle '+CHAPTERS.length+' Kapitel: Kanten statt Kisten, Höhen/Stufen erreichbar, Start + Boss-Mitte eben')}
// ---- Physik im echten Story-Level ----
const mk=(ch=1)=>{const dummy=new AIController(0),ctl={dx:0,dy:0};
 const p1=new Fighter({char:CHARACTERS.tiger,x:340,facing:1,input:dummy}),p2=new Fighter({char:CHARACTERS.tiger,x:620,facing:-1,input:new AIController(0)});
 p1.input.tick=()=>{};const game=new Game(p1,p2),arc=new Arcade(game,p1,p2,dummy);arc.setMode('story');arc.startStory('tiger',ch);
 while(game.phase!=='fight'){game.step()}
 const s=game.story;s.state='done';s.terrain=new Terrain([{x0:300,x1:700,h:90}]);
 return{game,arc,s,p1,ctl,step:(n,dx=0,jumpAt=-1)=>{for(let i=0;i<n;i++){dummy.feed(dx,jumpAt===i&&p1.grounded?-1:0,[]);game.step();s.state='done'}}}};
{const{p1,step,game}=mk();p1.x=100;p1.y=GROUND;p1.vx=0;
 step(100,1);assert.ok(p1.wallHit,'läuft gegen die Kante');assert.ok(p1.x<=300-TERRAIN_HALF&&p1.x>300-TERRAIN_HALF-12,'steht direkt vor der Kante (x='+p1.x+')');assert.equal(p1.y,GROUND);
 step(60,1,0);assert.equal(p1.y,GROUND-90,'steht oben');assert.ok(p1.grounded&&p1.x>300&&p1.floor===GROUND-90);assert.equal(game.floorAt(p1.x),GROUND-90);
 step(30,0);const x0=p1.x;step(20,0);assert.equal(p1.x,x0,'oben bleibt er stehen');assert.equal(p1.y,GROUND-90);
 step(200,1);assert.equal(p1.y,GROUND,'am Ende der Ebene fällt er hinunter');assert.ok(p1.x>700&&p1.grounded);
 step(60,-1);assert.ok(p1.wallHit||p1.x>700-0,'von rechts gegen die Kante');assert.ok(p1.x>=700+TERRAIN_HALF-1&&p1.y===GROUND,'von rechts blockt die Kante ebenfalls (x='+p1.x+')');
 ok('Spieler: Wand von unten, Hinaufspringen, oben stehen/laufen, Herunterfallen, Wand von rechts')}
// ---- Schatten/Standfläche: floor-Getter ohne Terrain = GROUND ----
{const f=new Fighter({char:CHARACTERS.tiger,x:0,facing:1,input:new AIController(0)});assert.equal(f.floor,GROUND);f.terrain=new Terrain([{x0:-10,x1:10,h:40}]);assert.equal(f.floor,GROUND-40);assert.ok(!f.grounded||f.y>=GROUND-40);ok('Fighter.floor: ohne Terrain GROUND, mit Terrain die Plateau-Höhe')}
// ---- KI-Gegner klettert mit (unten -> Spieler steht oben) und läuft hinter dem Spieler her (oben -> unten) ----
{const{game,s,p1,step}=mk();p1.x=500;p1.y=GROUND-90;p1.vx=0;
 const mob=new Fighter({char:CHARACTERS.mantis,x:150,facing:1,input:new AIController(2)});mob.maxHp=mob.hp=99999;game.fighters.push(mob);s.mobs.push(mob);
 let up=-1;for(let i=0;i<600&&up<0;i++){step(1,0);if(mob.y===GROUND-90&&mob.x>300)up=i}
 assert.ok(up>=0,'Gegner klettert auf die Kante (x='+Math.round(mob.x)+', y='+Math.round(mob.y)+')');
 p1.x=800;p1.y=GROUND;let down=-1;for(let i=0;i<900&&down<0;i++){step(1,0);if(mob.y===GROUND&&mob.x>700)down=i}
 assert.ok(down>=0,'Gegner folgt hinunter (x='+Math.round(mob.x)+', y='+Math.round(mob.y)+')');ok('KI-Gegner springt Kanten hinauf ('+up+' Frames) und folgt hinunter ('+down+' Frames)')}
// ---- Items landen auf der Standfläche der Kante ----
{const{game,s,p1,step}=mk();s.drop(450,.25,'heal');const it=s.items.at(-1);for(let i=0;i<80;i++){s.pickups()}assert.equal(it.y,GROUND-90-14,'Item liegt auf der Kante');ok('Items fallen auf die Ebene')}
console.log('Terrain-Tests bestanden');
