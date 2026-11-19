import{Game}from'../src/core/game.js';import{Fighter}from'../src/core/fighter.js';import{AIController}from'../src/core/ai.js';
import{Arcade}from'../src/core/arcade.js';import{CHARACTERS}from'../src/core/characters.js';import{CHAPTERS}from'../src/core/story.js';
import{GROUND}from'../src/core/config.js';
// Story Kapitel 4 (Das Totenreich) headless: gemischte Wellen (Mantis + Mini-A1LIEN), Alpha-Vorwelle, Finale ANUBIS, Hindernisse. Letztes Kapitel: kein Folgekapitel, zählt als Durchlauf.
const fail=m=>{throw new Error(m)};
const{STORY_CHAPTERS}=await import('../src/core/characters.js');if(CHAPTERS.length!==4||STORY_CHAPTERS!==CHAPTERS.length)fail('Kapitel-Anzahl: CHAPTERS.length='+CHAPTERS.length+', STORY_CHAPTERS='+STORY_CHAPTERS);const c3=CHAPTERS[3];if(c3.id!==4||c3.stage!==3||c3.enc.length!==6)fail('Kapitel-4-Daten (id/stage/Wellen)');if(!(c3.cap>CHAPTERS[2].cap&&c3.capBase>CHAPTERS[2].capBase))fail('Kapitel 4 muss mehr gleichzeitige Gegner erlauben als Kapitel 3');
const md=CHARACTERS.miniDemon;if(!md||md.storyBoss||!(md.hp>CHARACTERS.mantis.hp&&md.hp<CHARACTERS.cyberdemon.hp)||!(md.size<1))fail('Mini-Cyberdämon-Daten');
for(let i=0;i<5;i++){const m=c3.enc[i].mix;if(!m||!m.some(([id])=>id==='mantis')||!m.some(([id])=>id==='miniDemon'))fail('Welle '+(i+1)+' nicht gemischt')}
if(c3.enc[4].boss!==1)fail('Welle 5 soll der Alpha-Mantis sein');if(c3.enc[5].boss!=='anubisBoss')fail('Kapitel 4 endet nicht mit Anubis');if(!CHARACTERS.anubisBoss||!CHARACTERS.anubisBoss.storyBoss||CHARACTERS.anubis.storyBoss)fail('Anubis-Boss-Variante: nur die Boss-Variante darf storyBoss sein');
if(!c3.hurdles||c3.hurdles.length<4)fail('Hindernisse fehlen');
console.log('Daten OK');
const bot=new AIController(2),dummy=new AIController(0);
const p1=new Fighter({char:CHARACTERS.tiger,x:340,facing:1,input:bot}),p2=new Fighter({char:CHARACTERS.tiger,x:620,facing:-1,input:dummy});
const game=new Game(p1,p2),arc=new Arcade(game,p1,p2,dummy);arc.setMode('story');arc.startStory('tiger',4);
const s=game.story;if(s.ch!==4||game.stageIndex!==c3.stage)fail('Kapitel/Stage nicht gesetzt');
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
 if(ids.filter(i=>i==='mantis').length!==3||ids.filter(i=>i==='miniDemon').length!==2)fail('Mischung falsch: '+ids);console.log('Mischung OK',ids.join(','))}
// ---- komplettes Kapitel: Bot springt über Hindernisse, besiegt alle Wellen + Cyberdämon ----
{const arc2=new Arcade(game,p1,p2,dummy);arc2.setMode('story');arc2.startStory('tiger',4);const st=game.story;
 let boss=null,bosses=[],sawMini=false,sawMantis=false,maxMobs=0;
 for(let i=0;i<60*60*16&&arc2.state==='fight';i++){
  if(game.phase==='fight'&&st.state==='walk'){const hs=c3.hurdles,near=hs.find(h=>p1.x>h.x-h.w/2-110&&p1.x<h.x+h.w/2);bot.feed(1,near&&p1.grounded?-1:0,[])}
  p1.hp=Math.max(p1.hp,p1.maxHp*.6);game.step();arc2.update();
  for(const m of st.alive()){if(m.char.id==='miniDemon')sawMini=true;if(m.char.id==='mantis')sawMantis=true;if(m.char.storyBoss){boss=m;if(!bosses.includes(m.char.id))bosses.push(m.char.id)}}maxMobs=Math.max(maxMobs,st.alive().length)}
 console.log('state',arc2.state,'enc',st.enc,'kills',st.kills,'maxMobs',maxMobs,'frames',game.frame);
 if(!sawMini||!sawMantis)fail('Mini-Dämonen/Mantis nicht beide aufgetreten');if(!boss)fail('Anubis-Boss nie erschienen');if(boss.char.id!=='anubisBoss'||bosses.at(-1)!=='anubisBoss')fail('Falscher Endboss in Kapitel 4: '+bosses.join(','));
 if(arc2.state!=='victory')fail('Kapitel 4 nicht geschafft (state='+arc2.state+')');if(arc2.hasNextChapter)fail('Kapitel 4 ist das letzte Kapitel');console.log('Bosse:',bosses.join(','));console.log('Kapitel 4 OK')}
