import{CHARACTERS,LADDER,BOSS,ROSTER}from'./characters.js';
import{ROUND}from'./config.js';
// Arcade-Modus: Charakterwahl -> nacheinander gegen alle anderen spielbaren Figuren (je 2 Runden-Siege = Stage geschafft)
// -> Endgegner Minotaurus. Zustände: select | fight | clear | gameover | victory. Rein logisch (kein DOM) -> testbar.
export class Arcade{
 constructor(game,p1,p2,ai){this.game=game;this.p1=p1;this.p2=p2;this.ai=ai;this.state='select';this.cursor=0;this.difficulty=0;
  this.opponents=[];this.stage=0;this.t=0;this.player=null;game.arcade=this;
  this.mode='arcade';this.vs={c1:0,c2:1,locked:[false,false],step:0,stage:0};this.vsStage=0;this.stageCount=4}
 get total(){return this.opponents.length}
 get isBoss(){return this.opponents[this.stage]===BOSS}
 opponentName(i=this.stage){const id=this.opponents[i];return id?CHARACTERS[id].name:''}
 static ladderFor(playerId){return[...LADDER.filter(x=>x!==playerId),BOSS]}
 start(playerId){this.player=playerId;this.opponents=Arcade.ladderFor(playerId);this.stage=0;this.p1.setChar(CHARACTERS[playerId]);this.beginStage()}
 beginStage(){const g=this.game;this.p2.setChar(CHARACTERS[this.opponents[this.stage]]);this.applyDifficulty();
  g.stageIndex=this.isBoss?this.stageCount-1:this.stage%(this.stageCount-1);   // Boss immer in der letzten Arena (Labyrinth); bei mehr Gegnern als Arenen wiederholen sich die ersten
  g.rematch();this.state='fight';this.t=0}
 // Endgegner ist eine Stufe härter als die gewählte Schwierigkeit (max. HART)
 applyDifficulty(){this.ai.setLevel(Math.min(2,this.difficulty+(this.isBoss?1:0)))}
 setDifficulty(d){this.difficulty=Math.max(0,Math.min(2,d|0));if(this.state!=='select')this.applyDifficulty()}
 retry(){this.game.rematch();this.state='fight';this.t=0}
 toSelect(){this.state='select';this.game.stageIndex=0;this.t=0;this.vsReset()}
 // ---- 2-Spieler-Modus (PvP): beide wählen einen Kämpfer, danach die Stage ----
 static slotIds(){return[...ROSTER,...(CHARACTERS.custom?['custom']:[])]}
 setMode(m){if(this.state!=='select')return;this.mode=m==='versus'?'versus':'arcade';this.vsReset()}
 toggleMode(){this.setMode(this.mode==='versus'?'arcade':'versus')}
 vsReset(){const n=Arcade.slotIds().length;this.vs={c1:Math.min(this.vs.c1,n-1),c2:Math.min(this.vs.c2,n-1),locked:[false,false],step:0,stage:this.vs.stage||0}}
 vsMove(pl,dir){const v=this.vs,n=Arcade.slotIds().length;if(v.step!==0||v.locked[pl-1])return;const k=pl===1?'c1':'c2';v[k]=(v[k]+dir+n)%n}
 vsSet(pl,i){const v=this.vs;if(v.step!==0||v.locked[pl-1])return;v[pl===1?'c1':'c2']=Math.max(0,Math.min(Arcade.slotIds().length-1,i|0))}
 vsConfirm(pl){const v=this.vs;if(v.step!==0||v.locked[pl-1])return;v.locked[pl-1]=true;if(v.locked[0]&&v.locked[1])v.step=1}
 vsBack(){const v=this.vs;if(v.step===1){v.step=0;v.locked=[false,false]}else if(v.locked[1])v.locked[1]=false;else if(v.locked[0])v.locked[0]=false}
 vsStageMove(dir){const v=this.vs;if(v.step!==1)return;const n=this.stageCount+1;v.stage=(v.stage+dir+n)%n}   // letzte Karte = Zufall
 vsStart(){const v=this.vs,ids=Arcade.slotIds();if(v.step!==1)return false;this.startVersus(ids[v.c1],ids[v.c2],v.stage>=this.stageCount?-1:v.stage);return true}
 startVersus(id1,id2,stage=0){this.mode='versus';this.player=id1;this.opponents=[];this.stage=0;this.vsStage=stage;this.p1.setChar(CHARACTERS[id1]);this.p2.setChar(CHARACTERS[id2]);this.beginVersus()}
 beginVersus(){const g=this.game,st=this.vsStage;g.stageIndex=st<0?Math.floor(Math.random()*this.stageCount):st;g.rematch();this.state='fight';this.t=0}
 rematchVs(){this.beginVersus()}
 next(){this.stage++;this.beginStage()}
 // Enter-Taste: je nach Zustand weiter / nochmal / zurück zur Auswahl
 confirm(){if(this.state==='vsover')this.rematchVs();else if(this.state==='clear')this.next();else if(this.state==='gameover')this.retry();else if(this.state==='victory')this.toSelect()}
 // nach jedem game.step(): Match-Ende auswerten
 update(){const g=this.game;
  if(this.state==='fight'&&g.phase==='match'&&g.pf>=70){
   if(this.mode==='versus')this.state='vsover';else if(this.p1.wins>=ROUND.wins)this.state=this.stage>=this.total-1?'victory':'clear';else this.state='gameover';this.t=0}
  else if(this.state==='clear'){if(++this.t>=240)this.next()}   // automatisch weiter (Enter überspringt)
  else this.t++}
}
