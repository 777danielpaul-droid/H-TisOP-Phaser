import{Game}from'../src/core/game.js';import{Fighter}from'../src/core/fighter.js';import{AIController}from'../src/core/ai.js';
import{Arcade}from'../src/core/arcade.js';import{CHARACTERS}from'../src/core/characters.js';import{CHAPTERS}from'../src/core/story.js';
import{GROUND}from'../src/core/config.js';
// Story Kapitel 3 headless: gemischte Wellen (Mantis + Mini-Cyberdämon), Cyberdämon-Finale, Hindernisse zum Überspringen.
const fail=m=>{throw new Error(m)};
if(CHAPTERS.length<3)fail('Kapitel 3 fehlt');const c3=CHAPTERS[2];
const md=CHARACTERS.miniDemon;if(!md||md.storyBoss||!(md.hp>CHARACTERS.mantis.hp&&md.hp<CHARACTERS.cyberdemon.hp)||!(md.size<1))fail('Mini-Cyberdämon-Daten');
for(let i=0;i<4;i++){const m=c3.enc[i].mix;if(!m||!m.some(([id])=>id==='mantis')||!m.some(([id])=>id==='miniDemon'))fail('Welle '+(i+1)+' nicht gemischt')}
if(c3.enc[4].boss!=='cyberdemon')fail('Kapitel 3 endet nicht mit dem Cyberdämon');
if(!c3.hurdles||c3.hurdles.length<3)fail('Hindernisse fehlen');
console.log('Daten OK');
const bot=new AIController(2),dummy=new AIController(0);
const p1=new Fighter({char:CHARACTERS.tiger,x:340,facing:1,input:bot}),p2=new Fighter({char:CHARACTERS.tiger,x:620,facing:-1,input:dummy});
const game=new Game(p1,p2),arc=new Arcade(game,p1,p2,dummy);arc.setMode('story');arc.startStory('tiger',3);
const s=game.story;if(s.ch!==3||game.stageIndex!==c3.stage)fail('Kapitel/Stage nicht gesetzt');
while(game.phase!=='fight'){bot.feed(0,0,[]);game.step()}
// ---- Hindernis blockiert am Boden, Sprung darüber geht ----
{const h=c3.hurdles[0];p1.x=h.x-h.w/2-60;p1.y=GROUND;s.px=p1.x;s.state='walk';s.enc=0;
 const walk=(n,jump)=>{for(let i=0;i<n;i++){bot.feed(1,jump&&i===0&&p1.grounded?-1:0,[]);game.step();s.state='walk';if(s.alive().length)fail('unerwartet Gegner')}};
 // Trigger der ersten Welle ausblenden (liegt weit links vom Test-Hindernis): Welle zählt als erledigt
 s.enc=1;walk(60,false);if(p1.x>h.x-h.w/2)fail('Hindernis blockiert nicht (x='+Math.round(p1.x)+')');
 p1.x=h.x-h.w/2-170;p1.y=GROUND;s.px=p1.x;let over=false,jumped=false;for(let i=0;i<90;i++){bot.feed(1,(i<2||(p1.x>h.x-h.w/2-100&&!jumped&&p1.grounded&&(jumped=true)))?-1:0,[]);game.step();s.state='walk';if(p1.x>h.x+h.w/2)over=true}
 if(!over)fail('Sprung über das Hindernis geht nicht (x='+Math.round(p1.x)+', y='+Math.round(p1.y)+')');
 console.log('Hindernis OK')}
// ---- Welle 1 mischt Mantis + Mini-Dämonen ----
{s.state='walk';s.enc=0;s.mobs=[];game.fighters=[p1];p1.x=c3.enc[0].x;p1.y=GROUND;s.engage(c3.enc[0]);const ids=s.queue.map(q=>q.id||'mantis');
 if(ids.filter(i=>i==='mantis').length!==3||ids.filter(i=>i==='miniDemon').length!==1)fail('Mischung falsch: '+ids);console.log('Mischung OK',ids.join(','))}
// ---- komplettes Kapitel: Bot springt über Hindernisse, besiegt alle Wellen + Cyberdämon ----
{const arc2=new Arcade(game,p1,p2,dummy);arc2.setMode('story');arc2.startStory('tiger',3);const st=game.story;
 let boss=null,sawMini=false,sawMantis=false,maxMobs=0;
 for(let i=0;i<60*60*16&&arc2.state==='fight';i++){
  if(game.phase==='fight'&&st.state==='walk'){const hs=c3.hurdles,near=hs.find(h=>p1.x>h.x-h.w/2-110&&p1.x<h.x+h.w/2);bot.feed(1,near&&p1.grounded?-1:0,[])}
  p1.hp=Math.max(p1.hp,p1.maxHp*.6);game.step();arc2.update();
  for(const m of st.alive()){if(m.char.id==='miniDemon')sawMini=true;if(m.char.id==='mantis')sawMantis=true;if(m.char.storyBoss)boss=m}maxMobs=Math.max(maxMobs,st.alive().length)}
 console.log('state',arc2.state,'enc',st.enc,'kills',st.kills,'maxMobs',maxMobs,'frames',game.frame);
 if(!sawMini||!sawMantis)fail('Mini-Dämonen/Mantis nicht beide aufgetreten');if(!boss)fail('Cyberdämon-Boss nie erschienen');
 if(arc2.state!=='victory')fail('Kapitel 3 nicht geschafft (state='+arc2.state+')');console.log('Kapitel 3 OK')}
