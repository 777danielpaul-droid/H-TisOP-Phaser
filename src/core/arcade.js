import{AI_LEVELS}from'./ai.js';
import{BOSS,CHARACTERS,LADDER,ROSTER,unlockChar}from'./characters.js';
import{MELEE,ROUND}from'./config.js';
import{ownedStages,ownsSkin,ownsStage}from'./loot.js';
import{CHAPTERS,Story}from'./story.js';
import{loadUnlocks,saveUnlock}from'./unlocks.js';

import{skinCount}from'../render/skins.js';
import{Stage}from'../render/stage.js';
export const MAX_DIFF=AI_LEVELS.length-1;   // höchste wählbare Schwierigkeit (aktuell ALPTRAUM)
// Arcade-Modus: Charakterwahl -> nacheinander gegen alle anderen spielbaren Figuren (je 2 Runden-Siege = Stage geschafft).
// Zustände: select | fight | clear | gameover | victory. Rein logisch (kein DOM) -> testbar.
export class Arcade{
 constructor(game,p1,p2,ai){this.game=game;this.p1=p1;this.p2=p2;this.ai=ai;this.state='select';this.cursor=0;this.difficulty=0;
  this.opponents=[];this.stage=0;this.t=0;this.player=null;game.arcade=this;
  this.skins={};this.newUnlock=null;this.chapter=1;this.chOpen=new Set([1]);this.refreshChapters();this.mode='arcade';this.cpu=true;this.stocks=MELEE.stocks;   // mode: arcade | versus | melee; cpu = Spieler 2 ist die KI (nur Melee); stocks = Leben im Melee
  this.vs={c1:0,c2:1,s1:0,s2:0,locked:[false,false],step:0,stage:0};this.vsStage=0;this.stageCount=4;this.online=false}
 get total(){return this.opponents.length}
 get pvp(){return this.mode==='versus'||this.mode==='melee'}   // Versus und Melee teilen sich die Kämpfer-/Stage-Wahl
 opponentName(i=this.stage){const id=this.opponents[i];return id?CHARACTERS[id].name:''}
 static ladderFor(playerId){return[...LADDER.filter(x=>x!==playerId),...(playerId!==BOSS&&CHARACTERS[BOSS]?[BOSS]:[])]}   // alle anderen Kämpfer, zum Schluss der Endgegner
 isBoss(i=this.stage){return this.mode==='arcade'&&this.opponents[i]===BOSS}
 // ---- Zweitfarbe (Skin): je Figur gemerkt (Arcade) bzw. je Spieler (2 Spieler) ----
 skinOf(id){const k=Math.min(this.skins[id]|0,Math.max(0,skinCount(CHARACTERS[id]&&CHARACTERS[id].sprites)-1));return ownsSkin(id,k)?k:0}
 cycleSkin(id){const n=skinCount(CHARACTERS[id]&&CHARACTERS[id].sprites);if(n<2)return false;let k=this.skinOf(id);for(let i=0;i<n;i++){k=(k+1)%n;if(ownsSkin(id,k))break}this.skins[id]=k;return true}
 vsSkinOf(pl){const v=this.vs,ids=Arcade.slotIds(),id=ids[pl===1?v.c1:v.c2],n=skinCount(CHARACTERS[id]&&CHARACTERS[id].sprites);
  let s=Math.min((pl===1?v.s1:v.s2)|0,Math.max(0,n-1));if(!ownsSkin(id,s))s=0;
  if(pl===2&&ids[v.c1]===id&&n>1&&s===Math.min(v.s1|0,n-1))s=(s+1)%n;   // gleiche Figur, gleiche Farbe -> Spieler 2 bekommt automatisch die andere
  return s}
 vsCycleSkin(pl){const v=this.vs,ids=Arcade.slotIds(),id=ids[pl===1?v.c1:v.c2],n=skinCount(CHARACTERS[id]&&CHARACTERS[id].sprites);if(v.step!==0||v.locked[pl-1]||n<2)return false;
  const k=pl===1?'s1':'s2';let s=this.vsSkinOf(pl);for(let i=0;i<n;i++){s=(s+1)%n;if(ownsSkin(id,s))break}v[k]=s;return true}
 // Story: Seitenscroller-Level, Insektenkrieger greifen in Gruppen an (core/story.js). Kapitel 2+ werden durch Abschluss des Vorgängers freigeschaltet (Browser-Speicher, Test: ?unlock=story2)
 refreshChapters(){for(const id of loadUnlocks()){const m=/^story(\d+)$/.exec(id);if(m)this.chOpen.add(+m[1])}}
 chapterOpen(c){return c<=1||this.chOpen.has(c)}
 unlockChapter(c){if(c>1&&c<=CHAPTERS.length&&!this.chOpen.has(c)){this.chOpen.add(c);saveUnlock('story'+c);return true}return false}
 cycleChapter(){if(this.state!=='select'||this.mode!=='story')return false;this.refreshChapters();let c=this.chapter;for(let i=0;i<CHAPTERS.length;i++){c=c%CHAPTERS.length+1;if(this.chapterOpen(c))break}const ch=c!==this.chapter;this.chapter=c;return ch}
 startStory(id,chapter=this.chapter){const g=this.game;this.newUnlock=null;this.player=id;this.chapter=Math.max(1,Math.min(CHAPTERS.length,chapter|0||1));this.opponents=[];this.stage=0;this.p1.setChar(CHARACTERS[id],this.skinOf(id));this.p2.setChar(CHARACTERS.mantis);
  g.story=new Story(g,{ai:Math.min(2,this.difficulty),chapter:this.chapter});g.camera.story=g.story;g.fighters=[this.p1];g.stageIndex=CHAPTERS[this.chapter-1].stage;g.meleeOn=false;g.rematch();this.state='fight';this.t=0}
 get hasNextChapter(){return this.mode==='story'&&this.chapter<CHAPTERS.length}
 leaveStory(){const g=this.game;if(!g.story)return;g.story=null;g.camera.story=null;g.fighters=[this.p1,this.p2];this.p2.x=620}
 start(playerId){if(this.mode==='story')return this.startStory(playerId);this.leaveStory();this.newUnlock=null;this.player=playerId;this.opponents=Arcade.ladderFor(playerId);this.stage=0;this.p1.setChar(CHARACTERS[playerId],this.skinOf(playerId));this.beginStage()}
 beginStage(){const g=this.game,oid=this.opponents[this.stage];this.p2.setChar(CHARACTERS[oid],this.skinOf(oid));this.applyDifficulty();
  {const own=ownedStages(this.stageCount);g.stageIndex=own[this.stage%own.length]}   // freigeschaltete Arenen der Reihe nach (bei mehr Gegnern als Arenen wiederholen sie sich)
  g.meleeOn=false;g.rematch();this.state='fight';this.t=0}
 applyDifficulty(){this.ai.setLevel(Math.min(MAX_DIFF,this.difficulty+(this.isBoss()?1:0)))}   // Endgegner: KI eine Stufe härter
 setDifficulty(d){this.difficulty=Math.max(0,Math.min(MAX_DIFF,d|0));if(this.state!=='select')this.applyDifficulty()}
 retry(){this.game.rematch();this.state='fight';this.t=0}
 toSelect(){this.leaveStory();this.online=false;this.state='select';this.game.stageIndex=0;this.t=0;this.vsReset()}
 // ---- 2-Spieler-Modus (PvP): beide wählen einen Kämpfer, danach die Stage ----
 static slotIds(){return[...ROSTER,...(CHARACTERS.custom?['custom']:[])]}
 setMode(m){if(this.state!=='select')return;this.mode=m==='versus'||m==='melee'||m==='story'?m:'arcade';this.vsReset()}
 toggleMode(){this.setMode(this.mode==='versus'?'arcade':'versus')}
 cycleMode(){this.setMode({arcade:'story',story:'versus',versus:'melee',melee:'arcade'}[this.mode])}   // Tab im Menü: Arcade -> 2 Spieler -> Melee
 // Melee-Optionen (nur im Auswahlbildschirm): Spieler 2 = KI, Anzahl Stocks (1-5)
 toggleCpu(){if(this.state!=='select'||this.mode!=='melee')return false;this.cpu=!this.cpu;return true}
 cycleStocks(){if(this.state!=='select'||this.mode!=='melee')return false;this.stocks=this.stocks>=5?1:this.stocks+1;return true}
 vsReset(){const n=Arcade.slotIds().length;this.vs={c1:Math.min(this.vs.c1,n-1),c2:Math.min(this.vs.c2,n-1),s1:this.vs.s1|0,s2:this.vs.s2|0,locked:[false,false],step:0,stage:this.stageOpen(this.vs.stage|0)?(this.vs.stage|0):0}}
 vsMove(pl,dir){const v=this.vs,n=Arcade.slotIds().length;if(v.step!==0||v.locked[pl-1])return;const k=pl===1?'c1':'c2';v[k]=(v[k]+dir+n)%n}
 vsSet(pl,i){const v=this.vs;if(v.step!==0||v.locked[pl-1])return;v[pl===1?'c1':'c2']=Math.max(0,Math.min(Arcade.slotIds().length-1,i|0))}
 vsConfirm(pl){const v=this.vs;if(v.step!==0||v.locked[pl-1])return;v.locked[pl-1]=true;if(v.locked[0]&&v.locked[1])v.step=1}
 vsBack(){const v=this.vs;if(v.step===1){v.step=0;v.locked=[false,false]}else if(v.locked[1])v.locked[1]=false;else if(v.locked[0])v.locked[0]=false}
 stageOpen(i){return i>=this.stageCount||ownsStage(i)}   // die Zufalls-Karte (letzte) ist immer wählbar
 vsStageMove(dir){const v=this.vs;if(v.step!==1)return;const n=this.stageCount+1;let s=v.stage;for(let i=0;i<n;i++){s=(s+dir+n)%n;if(this.stageOpen(s))break}v.stage=s}   // gesperrte Stages werden übersprungen; letzte Karte = Zufall
 vsStart(){const v=this.vs,ids=Arcade.slotIds();if(v.step!==1)return false;const st=v.stage>=this.stageCount?-1:this.stageOpen(v.stage)?v.stage:0;if(this.mode==='melee')this.startMelee(ids[v.c1],ids[v.c2],st,this.vsSkinOf(1),this.vsSkinOf(2));else this.startVersus(ids[v.c1],ids[v.c2],st,this.vsSkinOf(1),this.vsSkinOf(2));return true}
 startMelee(id1,id2,stage=0,s1=0,s2=0){this.mode='melee';this.startVersus(id1,id2,stage,s1,s2)}
 startVersus(id1,id2,stage=0,s1=0,s2=0){this.leaveStory();if(this.mode!=='melee')this.mode='versus';this.player=id1;this.opponents=[];this.stage=0;this.vsStage=stage;this.p1.setChar(CHARACTERS[id1],s1);this.p2.setChar(CHARACTERS[id2],s2);this.beginVersus()}
 beginVersus(){const g=this.game,st=this.vsStage;{const own=ownedStages(this.stageCount);g.stageIndex=st<0?own[Math.floor(Math.random()*own.length)]:own.includes(st)?st:0}
  g.meleeOn=this.mode==='melee';g.meleeStocks=this.stocks;if(g.meleeOn&&this.cpu)this.applyDifficulty();g.rematch();this.state='fight';this.t=0}
 rematchVs(){this.beginVersus()}
 // Online-Kampf (core/netmatch.js): beide Geräte starten mit exakt denselben Angaben (Figuren, Farben, Stage), Zähler bei 0 -> gleicher Rechenstand. cfg = {ids:[P1,P2], skins:[s1,s2], stage}
 startOnline(cfg){this.leaveStory();this.mode='versus';this.online=true;this.player=cfg.ids[0];this.opponents=[];this.stage=0;this.vsStage=cfg.stage|0;
  this.p1.setChar(CHARACTERS[cfg.ids[0]],cfg.skins[0]|0);this.p2.setChar(CHARACTERS[cfg.ids[1]],cfg.skins[1]|0);
  const g=this.game;g.stageIndex=cfg.stage|0;g.meleeOn=false;g.frame=0;g.rematch();this.state='fight';this.t=0}   // Stage fest (auch wenn sie hier noch gesperrt ist: nur Optik), frame=0 wegen frame%2 im KO
 next(){this.stage++;this.beginStage()}
 // Enter-Taste: je nach Zustand weiter / nochmal / zurück zur Auswahl
 confirm(){if(this.state==='vsover')this.rematchVs();else if(this.state==='clear')this.next();else if(this.state==='gameover')this.retry();else if(this.state==='victory'){if(this.hasNextChapter)this.startStory(this.player,this.chapter+1);else this.toSelect()}}
 // nach jedem game.step(): Match-Ende auswerten
 update(){const g=this.game;
  if(this.mode==='story'&&g.story){const s=g.story;   // Story: Ende = Spieler besiegt (gameover) oder Level geschafft (victory)
   if(this.state==='fight'){if(g.phase==='storyover'&&g.pf>=90){this.state='gameover';this.t=0}else if(s.state==='done'&&s.doneT>260){this.state='victory';this.t=0;this.unlockChapter(this.chapter+1)}}else this.t++;return}
  if(this.state==='fight'&&g.phase==='match'&&g.pf>=70){
   if(this.pvp)this.state='vsover';else if(this.p1.wins>=ROUND.wins)this.state=this.stage>=this.total-1?'victory':'clear';else this.state='gameover';this.t=0;if(this.state==='victory'&&this.player!==BOSS&&unlockChar(BOSS))this.newUnlock=BOSS}
  else if(this.state==='clear'){if(++this.t>=240)this.next()}   // automatisch weiter (Enter überspringt)
  else this.t++}
}
