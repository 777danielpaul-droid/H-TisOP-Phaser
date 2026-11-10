import{CHARACTERS,LADDER,ROSTER}from'./characters.js';
import{ROUND,MELEE}from'./config.js';
import{skinCount}from'../render/skins.js';
// Arcade-Modus: Charakterwahl -> nacheinander gegen alle anderen spielbaren Figuren (je 2 Runden-Siege = Stage geschafft).
// Zustände: select | fight | clear | gameover | victory. Rein logisch (kein DOM) -> testbar.
export class Arcade{
 constructor(game,p1,p2,ai){this.game=game;this.p1=p1;this.p2=p2;this.ai=ai;this.state='select';this.cursor=0;this.difficulty=0;
  this.opponents=[];this.stage=0;this.t=0;this.player=null;game.arcade=this;
  this.skins={};this.mode='arcade';this.cpu=true;this.stocks=MELEE.stocks;   // mode: arcade | versus | melee; cpu = Spieler 2 ist die KI (nur Melee); stocks = Leben im Melee
  this.vs={c1:0,c2:1,s1:0,s2:0,locked:[false,false],step:0,stage:0};this.vsStage=0;this.stageCount=4}
 get total(){return this.opponents.length}
 get pvp(){return this.mode!=='arcade'}   // Versus und Melee teilen sich die Kämpfer-/Stage-Wahl
 opponentName(i=this.stage){const id=this.opponents[i];return id?CHARACTERS[id].name:''}
 static ladderFor(playerId){return LADDER.filter(x=>x!==playerId)}
 // ---- Zweitfarbe (Skin): je Figur gemerkt (Arcade) bzw. je Spieler (2 Spieler) ----
 skinOf(id){return Math.min(this.skins[id]|0,Math.max(0,skinCount(CHARACTERS[id]&&CHARACTERS[id].sprites)-1))}
 cycleSkin(id){const n=skinCount(CHARACTERS[id]&&CHARACTERS[id].sprites);if(n<2)return false;this.skins[id]=(this.skinOf(id)+1)%n;return true}
 vsSkinOf(pl){const v=this.vs,ids=Arcade.slotIds(),id=ids[pl===1?v.c1:v.c2],n=skinCount(CHARACTERS[id]&&CHARACTERS[id].sprites);
  let s=Math.min((pl===1?v.s1:v.s2)|0,Math.max(0,n-1));
  if(pl===2&&ids[v.c1]===id&&n>1&&s===Math.min(v.s1|0,n-1))s=(s+1)%n;   // gleiche Figur, gleiche Farbe -> Spieler 2 bekommt automatisch die andere
  return s}
 vsCycleSkin(pl){const v=this.vs,ids=Arcade.slotIds(),id=ids[pl===1?v.c1:v.c2],n=skinCount(CHARACTERS[id]&&CHARACTERS[id].sprites);if(v.step!==0||v.locked[pl-1]||n<2)return false;
  const k=pl===1?'s1':'s2';v[k]=(this.vsSkinOf(pl)+1)%n;return true}
 start(playerId){this.player=playerId;this.opponents=Arcade.ladderFor(playerId);this.stage=0;this.p1.setChar(CHARACTERS[playerId],this.skinOf(playerId));this.beginStage()}
 beginStage(){const g=this.game,oid=this.opponents[this.stage];this.p2.setChar(CHARACTERS[oid],this.skinOf(oid));this.applyDifficulty();
  g.stageIndex=this.stage%this.stageCount;   // Arenen der Reihe nach (bei mehr Gegnern als Arenen wiederholen sie sich)
  g.meleeOn=false;g.rematch();this.state='fight';this.t=0}
 applyDifficulty(){this.ai.setLevel(Math.min(2,this.difficulty))}
 setDifficulty(d){this.difficulty=Math.max(0,Math.min(2,d|0));if(this.state!=='select')this.applyDifficulty()}
 retry(){this.game.rematch();this.state='fight';this.t=0}
 toSelect(){this.state='select';this.game.stageIndex=0;this.t=0;this.vsReset()}
 // ---- 2-Spieler-Modus (PvP): beide wählen einen Kämpfer, danach die Stage ----
 static slotIds(){return[...ROSTER,...(CHARACTERS.custom?['custom']:[])]}
 setMode(m){if(this.state!=='select')return;this.mode=m==='versus'||m==='melee'?m:'arcade';this.vsReset()}
 toggleMode(){this.setMode(this.mode==='versus'?'arcade':'versus')}
 cycleMode(){this.setMode({arcade:'versus',versus:'melee',melee:'arcade'}[this.mode])}   // Tab im Menü: Arcade -> 2 Spieler -> Melee
 // Melee-Optionen (nur im Auswahlbildschirm): Spieler 2 = KI, Anzahl Stocks (1-5)
 toggleCpu(){if(this.state!=='select'||this.mode!=='melee')return false;this.cpu=!this.cpu;return true}
 cycleStocks(){if(this.state!=='select'||this.mode!=='melee')return false;this.stocks=this.stocks>=5?1:this.stocks+1;return true}
 vsReset(){const n=Arcade.slotIds().length;this.vs={c1:Math.min(this.vs.c1,n-1),c2:Math.min(this.vs.c2,n-1),s1:this.vs.s1|0,s2:this.vs.s2|0,locked:[false,false],step:0,stage:this.vs.stage||0}}
 vsMove(pl,dir){const v=this.vs,n=Arcade.slotIds().length;if(v.step!==0||v.locked[pl-1])return;const k=pl===1?'c1':'c2';v[k]=(v[k]+dir+n)%n}
 vsSet(pl,i){const v=this.vs;if(v.step!==0||v.locked[pl-1])return;v[pl===1?'c1':'c2']=Math.max(0,Math.min(Arcade.slotIds().length-1,i|0))}
 vsConfirm(pl){const v=this.vs;if(v.step!==0||v.locked[pl-1])return;v.locked[pl-1]=true;if(v.locked[0]&&v.locked[1])v.step=1}
 vsBack(){const v=this.vs;if(v.step===1){v.step=0;v.locked=[false,false]}else if(v.locked[1])v.locked[1]=false;else if(v.locked[0])v.locked[0]=false}
 vsStageMove(dir){const v=this.vs;if(v.step!==1)return;const n=this.stageCount+1;v.stage=(v.stage+dir+n)%n}   // letzte Karte = Zufall
 vsStart(){const v=this.vs,ids=Arcade.slotIds();if(v.step!==1)return false;const st=v.stage>=this.stageCount?-1:v.stage;if(this.mode==='melee')this.startMelee(ids[v.c1],ids[v.c2],st,this.vsSkinOf(1),this.vsSkinOf(2));else this.startVersus(ids[v.c1],ids[v.c2],st,this.vsSkinOf(1),this.vsSkinOf(2));return true}
 startMelee(id1,id2,stage=0,s1=0,s2=0){this.mode='melee';this.startVersus(id1,id2,stage,s1,s2)}
 startVersus(id1,id2,stage=0,s1=0,s2=0){if(this.mode!=='melee')this.mode='versus';this.player=id1;this.opponents=[];this.stage=0;this.vsStage=stage;this.p1.setChar(CHARACTERS[id1],s1);this.p2.setChar(CHARACTERS[id2],s2);this.beginVersus()}
 beginVersus(){const g=this.game,st=this.vsStage;g.stageIndex=st<0?Math.floor(Math.random()*this.stageCount):st;
  g.meleeOn=this.mode==='melee';g.meleeStocks=this.stocks;if(g.meleeOn&&this.cpu)this.applyDifficulty();g.rematch();this.state='fight';this.t=0}
 rematchVs(){this.beginVersus()}
 next(){this.stage++;this.beginStage()}
 // Enter-Taste: je nach Zustand weiter / nochmal / zurück zur Auswahl
 confirm(){if(this.state==='vsover')this.rematchVs();else if(this.state==='clear')this.next();else if(this.state==='gameover')this.retry();else if(this.state==='victory')this.toSelect()}
 // nach jedem game.step(): Match-Ende auswerten
 update(){const g=this.game;
  if(this.state==='fight'&&g.phase==='match'&&g.pf>=70){
   if(this.pvp)this.state='vsover';else if(this.p1.wins>=ROUND.wins)this.state=this.stage>=this.total-1?'victory':'clear';else this.state='gameover';this.t=0}
  else if(this.state==='clear'){if(++this.t>=240)this.next()}   // automatisch weiter (Enter überspringt)
  else this.t++}
}
