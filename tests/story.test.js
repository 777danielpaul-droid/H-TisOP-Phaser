import{Game}from'../src/core/game.js';import{Fighter}from'../src/core/fighter.js';import{AIController}from'../src/core/ai.js';
import{Arcade}from'../src/core/arcade.js';import{CHARACTERS}from'../src/core/characters.js';import{ENC}from'../src/core/story.js';
// Story-Modus headless: KI steuert den Spieler, läuft nach rechts und kämpft alle Wellen durch.
const bot=new AIController(2),dummy=new AIController(0);
const p1=new Fighter({char:CHARACTERS.tiger,x:340,facing:1,input:bot}),p2=new Fighter({char:CHARACTERS.tiger,x:620,facing:-1,input:dummy});
const game=new Game(p1,p2),arc=new Arcade(game,p1,p2,dummy);arc.setMode('story');arc.start('tiger');
let maxMobs=0,walkTicks=0;
for(let i=0;i<60*60*6&&arc.state==='fight';i++){
 const s=game.story;
 if(game.phase==='fight'&&s.state==='walk'){bot.feed(1,0,[]);walkTicks++}   // Bot läuft nach rechts, solange keine Welle aktiv ist
 game.step();arc.update();maxMobs=Math.max(maxMobs,s.alive().length);
 if(game.phase==='fight'&&s.state==='fight'){}
}
const s=game.story;console.log('state',arc.state,'enc',s.enc,'/',ENC.length,'kills',s.kills,'maxMobs',maxMobs,'hp',Math.round(p1.hp),'frames',game.frame);
if(!(s.kills>=3&&maxMobs>=2))throw new Error('Story: zu wenige Gegner');
console.log('OK');
// Retry: Neustart am Checkpoint
if(arc.state==='gameover'){arc.confirm();if(arc.state!=='fight'||game.story.enc!==game.story.cp)throw new Error('Retry')}
console.log('Retry OK, cp',game.story.cp,'x',Math.round(p1.x));
arc.toSelect();if(game.story||game.fighters.length!==2)throw new Error('leave');console.log('Leave OK');
// Mantis blocken keine Specials
{const m=game.story&&game.story.mobs[0]||new Fighter({char:CHARACTERS.mantis,x:0,facing:1,input:dummy});m.input.dx=-1;m.facing=1;
 if(m.isBlocking({special:true,lv:'mid'}))throw new Error('Mantis blockt Special');if(!m.isBlocking({special:false,lv:'mid'}))throw new Error('Normal-Block kaputt');console.log('NoSpecialBlock OK')}
