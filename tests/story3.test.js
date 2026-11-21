import{Game}from'../src/core/game.js';import{Fighter}from'../src/core/fighter.js';import{AIController}from'../src/core/ai.js';
import{Arcade}from'../src/core/arcade.js';import{CHARACTERS}from'../src/core/characters.js';import{CHAPTERS}from'../src/core/story.js';
import{GROUND}from'../src/core/config.js';
// Story Kapitel 3 headless: gemischte Wellen (Mantis + Mini-A1LIEN), A1LIEN-Finale, Kanten/Ebenen zum Hochspringen. (Anubis = Endboss von Kapitel 4: tests/story4.test.js)
const fail=m=>{throw new Error(m)};
if(CHAPTERS.length<3)fail('Kapitel 3 fehlt');const c3=CHAPTERS[2];
const md=CHARACTERS.miniDemon;if(!md||md.storyBoss||!(md.hp>CHARACTERS.mantis.hp&&md.hp<CHARACTERS.cyberdemon.hp)||!(md.size<1))fail('Mini-Cyberdämon-Daten');
for(let i=0;i<4;i++){const m=c3.enc[i].mix;if(!m||!m.some(([id])=>id==='mantis')||!m.some(([id])=>id==='miniDemon'))fail('Welle '+(i+1)+' nicht gemischt')}
if(c3.enc[4].boss!=='cyberdemon')fail('Kapitel 3 endet nicht mit A1LIEN');if(!CHARACTERS.cyberdemon.storyBoss)fail('A1LIEN muss storyBoss sein');
if(c3.hurdles)fail('Hindernisse (hurdles) wurden entfernt');if(!c3.ledges||c3.ledges.length<3)fail('Kanten fehlen');
console.log('Daten OK');
const bot=new AIController(2),dummy=new AIController(0);
const p1=new Fighter({char:CHARACTERS.tiger,x:340,facing:1,input:bot}),p2=new Fighter({char:CHARACTERS.tiger,x:620,facing:-1,input:dummy});
const game=new Game(p1,p2),arc=new Arcade(game,p1,p2,dummy);arc.setMode('story');arc.startStory('tiger',3);
const s=game.story;if(s.ch!==3||game.stageIndex!==c3.stage)fail('Kapitel/Stage nicht gesetzt');
while(game.phase!=='fight'){bot.feed(0,0,[]);game.step()}
// ---- Kanten: blockieren am Boden, Sprung hinauf geht, oben läuft man weiter (Treppe), am Ende fällt man wieder hinunter ----
{const L=c3.ledges[0],L2=c3.ledges[1],orig=bot.tick;bot.tick=()=>{};   // Bot für diesen Test von Hand steuern
 const run=(n,dx,jumpAt)=>{for(let i=0;i<n;i++){bot.feed(dx,jumpAt===i&&p1.grounded?-1:0,[]);game.step();s.state='done';if(s.alive().length)fail('unerwartet Gegner')}};
 p1.x=L.x0-150;p1.y=GROUND;p1.vx=0;s.state='done';run(70,1);
 if(!p1.wallHit||p1.x>L.x0-10||p1.y!==GROUND)fail('Kante blockiert nicht (x='+Math.round(p1.x)+', y='+Math.round(p1.y)+')');
 run(14,1,0);run(50,0);if(p1.y!==GROUND-L.h||!p1.grounded||p1.x<=L.x0)fail('Sprung auf die Kante geht nicht (x='+Math.round(p1.x)+', y='+Math.round(p1.y)+')');
 run(80,1);if(!p1.wallHit||p1.y!==GROUND-L.h)fail('Zweite Stufe blockiert nicht (x='+Math.round(p1.x)+', y='+Math.round(p1.y)+')');
 run(10,1,0);run(60,0);if(p1.y!==GROUND-L2.h||p1.x<=L2.x0||p1.x>=L2.x1)fail('Sprung auf die zweite Stufe geht nicht (x='+Math.round(p1.x)+', y='+Math.round(p1.y)+')');
 run(150,1);if(p1.y!==GROUND||p1.x<=L.x1||!p1.grounded)fail('Am Ende der Kante fällt man nicht hinunter (x='+Math.round(p1.x)+', y='+Math.round(p1.y)+')');
 delete bot.tick;console.log('Kanten OK')}
// ---- Welle 1 mischt Mantis + Mini-Dämonen ----
{s.state='walk';s.enc=0;s.mobs=[];game.fighters=[p1];p1.x=c3.enc[0].x;p1.y=GROUND;s.engage(c3.enc[0]);const ids=s.queue.map(q=>q.id||'mantis');
 if(ids.filter(i=>i==='mantis').length!==3||ids.filter(i=>i==='miniDemon').length!==1)fail('Mischung falsch: '+ids);console.log('Mischung OK',ids.join(','))}
// ---- komplettes Kapitel: Bot springt auf Kanten, besiegt alle Wellen + Cyberdämon ----
{const arc2=new Arcade(game,p1,p2,dummy);arc2.setMode('story');arc2.startStory('tiger',3);const st=game.story;
 let boss=null,sawMini=false,sawMantis=false,maxMobs=0;
 for(let i=0;i<60*60*16&&arc2.state==='fight';i++){
  p1.hp=Math.max(p1.hp,p1.maxHp*.6);game.step();arc2.update();
  for(const m of st.alive()){if(m.char.id==='miniDemon')sawMini=true;if(m.char.id==='mantis')sawMantis=true;if(m.char.storyBoss)boss=m}maxMobs=Math.max(maxMobs,st.alive().length)}
 console.log('state',arc2.state,'enc',st.enc,'kills',st.kills,'maxMobs',maxMobs,'frames',game.frame);
 if(!sawMini||!sawMantis)fail('Mini-Dämonen/Mantis nicht beide aufgetreten');if(!boss)fail('A1LIEN-Boss nie erschienen');if(boss.char.id!=='cyberdemon')fail('Falscher Boss in Kapitel 3: '+boss.char.id);
 if(arc2.state!=='victory')fail('Kapitel 3 nicht geschafft (state='+arc2.state+')');console.log('Kapitel 3 OK')}
