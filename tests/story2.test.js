import{Game}from'../src/core/game.js';import{Fighter}from'../src/core/fighter.js';import{AIController}from'../src/core/ai.js';
import{Arcade}from'../src/core/arcade.js';import{CHARACTERS}from'../src/core/characters.js';import{CHAPTERS,ENC}from'../src/core/story.js';
import{LOOT}from'../src/core/loot.js';
// Story Kapitel 2 headless: Wellen (mehr Mantis als in Kapitel 1), Boss Cyberdämon, Wutphase, Belohnung, Kapitelwechsel.
const fail=m=>{throw new Error(m)};
// ---- Daten ----
if(CHAPTERS.length<2)fail('Kapitel 2 fehlt');
const c1=CHAPTERS[0].enc,c2=CHAPTERS[1].enc;
if(ENC!==c1)fail('ENC muss Kapitel 1 sein');
for(let i=0;i<4;i++)if(!(c2[i].n>c1[i].n))fail('Kapitel 2 Welle '+(i+1)+' hat nicht mehr Mantis als Kapitel 1');
if(c2[4].boss!=='cyberdemon')fail('Kapitel 2 endet nicht mit dem Cyberdämon');
const cd=CHARACTERS.cyberdemon;if(!cd||!cd.storyBoss||cd.hp<=CHARACTERS.mantisAlpha.hp)fail('Cyberdämon-Daten');
console.log('Daten OK: Wellen',c1.map(e=>e.n).join('/'),'->',c2.map(e=>e.n).join('/'),'+ Boss');

const bot=new AIController(2),dummy=new AIController(0);
const p1=new Fighter({char:CHARACTERS.tiger,x:340,facing:1,input:bot}),p2=new Fighter({char:CHARACTERS.tiger,x:620,facing:-1,input:dummy});
const game=new Game(p1,p2),arc=new Arcade(game,p1,p2,dummy);arc.setMode('story');

// ---- Kapitel 2 starten, Bot kämpft (Spieler bekommt Leben nachgefüllt, damit der Boss-Kampf sicher zu Ende geht) ----
if(arc.chapterOpen(2))fail('Kapitel 2 darf zu Beginn nicht offen sein');
arc.startStory('tiger',2);
const s=game.story;if(s.ch!==2||game.stageIndex!==CHAPTERS[1].stage)fail('Kapitel/Stage nicht gesetzt');
let maxMobs=0,boss=null,sawRage=false,bossHpMin=1e9,waves=[];
for(let i=0;i<60*60*14&&arc.state==='fight';i++){
 if(game.phase==='fight'&&s.state==='walk')bot.feed(1,0,[]);
 p1.hp=Math.max(p1.hp,p1.maxHp*.6);   // Test: der Bot soll den Boss-Kampf überstehen
 game.step();arc.update();
 maxMobs=Math.max(maxMobs,s.alive().length);
 if(s.state==='fight'&&!waves[s.enc])waves[s.enc]=s.queue.length+s.alive().length;
 const b=s.mobs.find(m=>m.char.storyBoss);
 if(b){boss=b;bossHpMin=Math.min(bossHpMin,b.hp)}
 if(s.rage)sawRage=true}
console.log('state',arc.state,'enc',s.enc,'/',s.total,'kills',s.kills,'maxMobs',maxMobs,'waves',waves.join('/'),'bossHpMin',Math.round(bossHpMin),'rage',sawRage,'frames',game.frame);
if(maxMobs<4)fail('Kapitel 2: zu wenige Gegner gleichzeitig ('+maxMobs+')');
if(!boss)fail('Boss nie erschienen');
if(arc.state!=='victory')fail('Kapitel 2 nicht geschafft (state='+arc.state+')');
if(!sawRage)fail('Wutphase nie ausgelöst');
if(boss.state!=='ko')fail('Boss nicht besiegt');
if(s.alive().length)fail('nach dem Boss dürfen keine Mantis übrig sein');
if(!(s.items&&s.items.length>=0))fail('Items');
console.log('Kapitel 2 + Boss OK');
if(arc.hasNextChapter)fail('Kapitel 2 ist das letzte Kapitel');
arc.confirm();if(arc.state!=='select'||game.story)fail('Enter nach dem letzten Kapitel -> Auswahl');

// ---- Kapitel 1 geschafft -> Kapitel 2 frei, Enter = weiter ----
arc.startStory('tiger',1);const s1=game.story;s1.state='done';s1.doneT=261;game.phase='fight';arc.update();
if(arc.state!=='victory')fail('Kapitel 1 victory');
if(!arc.chapterOpen(2))fail('Kapitel 2 nicht freigeschaltet');
if(!arc.hasNextChapter)fail('hasNextChapter');
arc.confirm();if(arc.state!=='fight'||!game.story||game.story.ch!==2||game.stageIndex!==CHAPTERS[1].stage)fail('Enter -> Kapitel 2');
console.log('Kapitelwechsel OK');
// ---- Kapitelwahl im Menü ----
arc.toSelect();arc.setMode('story');arc.chapter=1;if(!arc.cycleChapter()||arc.chapter!==2)fail('cycleChapter 1->2');if(!arc.cycleChapter()||arc.chapter!==1)fail('cycleChapter 2->1');
console.log('OK');
