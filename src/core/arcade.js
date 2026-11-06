import{CHARACTERS,LADDER,BOSS}from'./characters.js';
import{ROUND}from'./config.js';
// Arcade-Modus: Charakterwahl -> nacheinander gegen alle anderen spielbaren Figuren (je 2 Runden-Siege = Stage geschafft)
// -> Endgegner Minotaurus. Zustände: select | fight | clear | gameover | victory. Rein logisch (kein DOM) -> testbar.
export class Arcade{
 constructor(game,p1,p2,ai){this.game=game;this.p1=p1;this.p2=p2;this.ai=ai;this.state='select';this.cursor=0;this.difficulty=0;
  this.opponents=[];this.stage=0;this.t=0;this.player=null;game.arcade=this}
 get total(){return this.opponents.length}
 get isBoss(){return this.opponents[this.stage]===BOSS}
 opponentName(i=this.stage){const id=this.opponents[i];return id?CHARACTERS[id].name:''}
 static ladderFor(playerId){return[...LADDER.filter(x=>x!==playerId),BOSS]}
 start(playerId){this.player=playerId;this.opponents=Arcade.ladderFor(playerId);this.stage=0;this.p1.setChar(CHARACTERS[playerId]);this.beginStage()}
 beginStage(){const g=this.game;this.p2.setChar(CHARACTERS[this.opponents[this.stage]]);this.applyDifficulty();
  g.stageIndex=this.stage;g.rematch();this.state='fight';this.t=0}
 // Endgegner ist eine Stufe härter als die gewählte Schwierigkeit (max. HART)
 applyDifficulty(){this.ai.setLevel(Math.min(2,this.difficulty+(this.isBoss?1:0)))}
 setDifficulty(d){this.difficulty=Math.max(0,Math.min(2,d|0));if(this.state!=='select')this.applyDifficulty()}
 retry(){this.game.rematch();this.state='fight';this.t=0}
 toSelect(){this.state='select';this.game.stageIndex=0;this.t=0}
 next(){this.stage++;this.beginStage()}
 // Enter-Taste: je nach Zustand weiter / nochmal / zurück zur Auswahl
 confirm(){if(this.state==='clear')this.next();else if(this.state==='gameover')this.retry();else if(this.state==='victory')this.toSelect()}
 // nach jedem game.step(): Match-Ende auswerten
 update(){const g=this.game;
  if(this.state==='fight'&&g.phase==='match'&&g.pf>=70){
   if(this.p1.wins>=ROUND.wins)this.state=this.stage>=this.total-1?'victory':'clear';else this.state='gameover';this.t=0}
  else if(this.state==='clear'){if(++this.t>=240)this.next()}   // automatisch weiter (Enter überspringt)
  else this.t++}
}
