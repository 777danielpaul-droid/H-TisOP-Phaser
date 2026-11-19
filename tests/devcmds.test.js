// Dev-Konsole: Story-Cheat-Befehle (core/devcmds.js) headless gegen ein echtes Story-Level.  node tests/devcmds.test.js
import assert from'node:assert/strict';
import{Game}from'../src/core/game.js';import{Fighter}from'../src/core/fighter.js';import{AIController}from'../src/core/ai.js';
import{Arcade}from'../src/core/arcade.js';import{CHARACTERS}from'../src/core/characters.js';import{CHAPTERS}from'../src/core/story.js';
import{LOOT,itemCount}from'../src/core/loot.js';import{DevConsole}from'../src/render/devconsole.js';import{registerDevCommands}from'../src/core/devcmds.js';
const ok=n=>console.log('  ✓',n);
const mk=()=>{const dummy=new AIController(0),p1=new Fighter({char:CHARACTERS.tiger,x:340,facing:1,input:new AIController(0)}),p2=new Fighter({char:CHARACTERS.tiger,x:620,facing:-1,input:dummy});
 const game=new Game(p1,p2),arc=new Arcade(game,p1,p2,dummy),con=new DevConsole();registerDevCommands(con,{game,arc,arcade:arc});return{game,arc,con,p1}};
const last=c=>c.log.at(-1),run=(c,l)=>{c.exec(l);return last(c)};
const step=(g,a,n)=>{for(let i=0;i<n;i++){g.step();a.update()}};
const toFight=(g,a)=>{for(let i=0;i<400&&g.phase!=='fight';i++)step(g,a,1)};
// außerhalb des Story-Levels: klare Fehlermeldung statt Absturz
{const{con}=mk();for(const c of['killall','wave','skip','chapter 2']){const l=run(con,c);assert.equal(l.cls,'dc-err',c);assert.match(l.t,/Story/)}ok('Story-Befehle außerhalb eines Story-Levels -> Fehlermeldung')}
// killall: Welle auslösen, alle töten, Welle gilt als geschafft
{const{game:g,arc,con,p1}=mk();arc.setMode('story');arc.start('tiger');toFight(g,arc);const s=g.story;
 s.engage(s.encs[0]);for(let i=0;i<200&&s.alive().length<2;i++)step(g,arc,1);assert.ok(s.alive().length>=1,'Gegner da');
 const l=run(con,'killall');assert.match(l.t,/\d+ Gegner besiegt/);assert.equal(s.alive().length,0);assert.equal(s.queue.length,0);
 step(g,arc,5);assert.equal(s.state,'walk','Welle abgeschlossen');assert.equal(s.cp,1);assert.match(run(con,'killall').t,/Keine Gegner/);ok('killall tötet alle Gegner und schließt die Welle ab')}
// wave: aus dem Laufen heraus eine Welle überspringen
{const{game:g,arc,con}=mk();arc.setMode('story');arc.start('tiger');toFight(g,arc);const s=g.story;
 assert.match(run(con,'wave').t,new RegExp('Welle 1/'+s.total+' übersprungen'));step(g,arc,5);assert.equal(s.enc,1);assert.equal(s.state,'walk');assert.match(run(con,'wave').t,new RegExp('Welle 2/'+s.total));step(g,arc,5);assert.equal(s.enc,2);ok('wave überspringt Welle für Welle')}
// skip: Level sofort geschafft -> Sieg, nächstes Kapitel frei
{const{game:g,arc,con}=mk();arc.setMode('story');arc.start('tiger');toFight(g,arc);const s=g.story;
 assert.match(run(con,'skip').t,/Level geschafft/);assert.equal(s.state,'done');step(g,arc,100);assert.equal(arc.state,'victory','Sieg nach kurzer Zeit');assert.ok(arc.chapterOpen(2));
 assert.equal(run(con,'skip').cls,'dc-err','nach dem Sieg kein laufendes Level mehr');ok('skip beendet das Level mit Sieg')}
// skip mitten in der Boss-Welle
{const{game:g,arc,con}=mk();arc.setMode('story');arc.start('tiger');toFight(g,arc);const s=g.story;s.cp=s.enc=s.total-1;s.engage(s.encs[s.enc]);step(g,arc,200);
 run(con,'skip');step(g,arc,100);assert.equal(arc.state,'victory');ok('skip funktioniert auch mitten im Endgegner-Kampf')}
// chapter, heal
{const{game:g,arc,con,p1}=mk();arc.setMode('story');arc.start('tiger');toFight(g,arc);
 assert.equal(run(con,'chapter 9').cls,'dc-err');assert.match(run(con,'chapter 3').t,/Kapitel 3/);assert.equal(g.story.ch,3);assert.equal(arc.state,'fight');
 toFight(g,arc);p1.hp=1;p1.meter=0;run(con,'heal');assert.equal(p1.hp,p1.maxHp);assert.equal(p1.meter,300);ok('chapter n startet das Kapitel, heal füllt Leben + Meter')}
// god: Spieler 1 stirbt nicht, Leben bleibt voll; aus -> normal
{const{game:g,arc,con,p1}=mk();arc.setMode('story');arc.start('tiger');toFight(g,arc);const m=new Fighter({char:CHARACTERS.mantis,x:0,facing:1,input:new AIController(0)});
 assert.match(run(con,'god').t,/AN/);p1.hp=0.5;g.step();assert.equal(p1.hp,p1.maxHp,'Leben wird gehalten');p1.hp=0;g.knockout(p1,m);assert.notEqual(p1.state,'ko');assert.equal(p1.hp,p1.maxHp,'tödlicher Treffer wirkungslos');
 assert.match(run(con,'god').t,/AUS/);p1.hp=0;g.knockout(p1,m);assert.equal(p1.state,'ko','ohne god stirbt er normal');ok('god macht Spieler 1 unverwundbar, erneut aufgerufen wieder normal')}
// give
{const{con}=mk(),pk=LOOT.packs,co=LOOT.coins,dr=itemCount('drink');
 run(con,'give pack 3');assert.equal(LOOT.packs,pk+3);run(con,'give coins 50');assert.equal(LOOT.coins,co+50);run(con,'give drink');assert.equal(itemCount('drink'),dr+1);run(con,'give crystal 2');
 assert.equal(run(con,'give').cls,'dc-err');assert.equal(run(con,'give gold').cls,'dc-err');assert.match(run(con,'give drink x').t,/\+1 /);ok('give: Booster, Münzen, Items; ungültig -> Benutzungshinweis')}
// help kennt die neuen Befehle
{const{con}=mk();con.exec('help');const t=con.log.map(l=>l.t).join('\n');for(const c of['killall','skip','wave','chapter','god','heal','give','unlock'])assert.match(t,new RegExp('\\b'+c+'\\b'));ok('help listet alle Befehle')}
console.log('Dev-Befehle-Tests bestanden');
