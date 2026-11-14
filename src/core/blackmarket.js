import{CHARACTERS}from'./characters.js';
import{GROUND}from'./config.js';
import{CHAR_SHOP,LOOT,SHOP,buyChar,buyPack,charPrice,ownsChar,saveLoot}from'./loot.js';
// Schwarzmarkthändler KORVUS (anthropomorpher Rabe): interaktiver NPC im Story-Modus. Derselbe Rabe ist als Kämpfer (CHARACTERS.rabe) im Shop kaufbar.
// Rein logisch (kein DOM) -> headless testbar (tests/blackmarket.test.js). Darstellung: render/storyhud.js (drawDealer, drawDealerUi), Tasten/Klicks: main.js.
// Angebote: Booster-Packs = SHOP (core/loot.js, gleiche Preise wie der Ingame-Shop), Gegenstände = ITEM_SHOP (sofort benutzt), Kämpfer = CHAR_SHOP (Preis zentral: CHAR_PRICE in core/loot.js).
export const DEALER={id:'rabe',name:'KORVUS',title:'SCHWARZMARKT',reach:170};   // reach = Ansprechweite (px)
// Gegenstände: werden beim Kauf sofort benutzt (Heilung in % der Maximal-HP bzw. Hyper-Meter). Preise hier justierbar.
export const ITEM_SHOP=[
 {id:'drink',name:'ENERGIEDRINK',info:'+25 % Leben',price:25,kind:'heal',v:.25},
 {id:'elixir',name:'SCHATTENELIXIER',info:'+70 % Leben',price:55,kind:'heal',v:.7},
 {id:'crystal',name:'HYPER-KRISTALL',info:'+100 Hyper-Meter',price:40,kind:'meter',v:100}];
// Sprech-Posen (Frames aus assets/rabe, siehe SPRITE_CHARS/RABE_ANIMS in render/sprites.js): mood -> Frame-Folge. Offener Schnabel + Armgesten beim Sprechen, geschlossen in Denk-/Warte-Posen.
export const MOODS={
 idle:['i_0','i_1','i_2','i_1'],           // ruhig stehend (Atmen)
 talk:['t_1','t_5','t_2','t_1','t_6'],      // erzählt: Hand offen, Geste, beide Hände hoch, Zeigefinger
 sell:['t_4','t_4','t_1'],                  // hält ein Booster-Pack hoch
 point:['t_6','t_1'],                       // Zeigefinger: Hinweis/Angebot
 wow:['t_2','t_5'],                         // begeistert (Kauf, Verkauf)
 think:['t_3'],                             // Kinn: überlegt (geschlossener Schnabel)
 cross:['t_7'],                             // Arme verschränkt: lehnt ab / wartet
 hip:['t_0']};                              // Hand an der Hüfte: lässig
export const MOOD_OPEN=['talk','sell','point','wow'];   // Stimmungen mit offenem Schnabel (sprechen)
const pickR=a=>a[Math.floor(Math.random()*a.length)];
// ---- Texte (Persönlichkeit: abgebrühter, trockener Geschäftsmann, zählt alles in Münzen, Rabenwitze) ----
export const LINES={
 first:['Krah. Ein Kunde, der noch atmet – selten geworden, seit die Käfer die Stadt abgrasen. Ich bin Korvus. Ich besorge, was es nirgends zu kaufen gibt.',
        'Psst. Nicht so laut, die Käfer haben Ohren. Korvus, Schwarzmarkt. Münzen sind meine Muttersprache.'],
 again:['Na, wieder da? Dein Gefieder sieht zerzaust aus. Ich kann helfen – gegen Münzen, versteht sich.','Krah! Der Mutige mit den Fäusten. Schau dich um, solange es ruhig ist.','Die Ware ist frisch, der Preis ist fair. Meistens.'],
 more:['Noch etwas, Freundchen?','Sonst noch ein Wunsch? Ich habe Zeit. Die Käfer haben sie nicht.','Nur zu. Ich beiße nicht. Meistens nicht.'],
 booster:'Booster-Packs. Drei Überraschungen pro Päckchen – Karten, Farben, Münzen. Ich schwöre, ich habe sie nicht geöffnet. Nicht oft.',
 items:'Für den kleinen Notfall: Drinks, Elixier, ein Kristall für den großen Auftritt. Alles gebrauchsfertig. Gebraucht? Nein. Fast nie.',
 chat:['Die Käfer kommen nachts aus den Gullys. Ich habe gesehen, wie sie Laternen fressen. Laternen! Wer frisst Laternen?','Der Alpha? Zwei Köpfe größer als du, aber Chitin splittert wie billiges Glas. Triff ihn, wenn er springt.','Wer blockt, verliert weniger. Wer ausweicht, verliert nichts. Wer zahlt, verliert Münzen. Ich bevorzuge Letzteres.','Im Hafen glüht etwas rot unter der Haut der Welt. Ich verkaufe nichts, was ich dort unten gefunden habe. Noch nicht.','Jeder Kämpfer hat einen Preis. Meiner liegt erstaunlich niedrig. Frag mich ruhig.'],
 bought:['Krah! Ein Vergnügen, mit dir Geschäfte zu machen.','Abgemacht. Keine Rückgabe, keine Fragen, keine Zeugen.','Gute Wahl. Das hat schon mal jemand überlebt.'],
 poor:['Münzen fehlen, Freundchen. Besiege ein paar Käfer, öffne ein paar Booster – dann reden wir.','Mein Herz ist weich, mein Gefieder auch. Meine Preise nicht. Komm mit mehr Münzen wieder.'],
 full:'Du strotzt vor Kraft. Komm wieder, wenn es wehtut – ich laufe nicht weg.',
 fullMeter:'Dein Hyper-Meter ist randvoll. Mehr passt nicht hinein – nicht mal mit Gewalt.',
 hired:'Abgemacht! Krah! Ab jetzt wählst du mich in der Charakterwahl aus. Ich leihe dir meine Krallen – nicht meine Münzen.',
 owned:'Wir sind doch längst im Geschäft, Partner. Such mich in der Charakterwahl – dort warte ich auf dich.',
 bye:['Krah! Bis bald. Und stirb nicht – ich hasse es, Schulden abzuschreiben.','Man sieht sich. Ich bin nie weit weg. Ich bin ja ein Rabe.','Pass auf deine Federn auf.']};
// Angebot „Kämpfer“: Preis immer aus CHAR_PRICE (core/loot.js)
export const hireLine=()=>`Du willst MICH? Für ${charPrice(DEALER.id)} Coins stehe ich dir im Ring zur Seite – dauerhaft, keine Abos. Ein ehrlicher Federn-Deal.`;
let metBefore=false;   // pro Sitzung: erste Begrüßung vs. Wiedersehen (bewusst nicht gespeichert)
export const resetDealerMemory=()=>{metBefore=false};
// Zeilenumbruch (Zeichen-Näherung, Schrift variabel): bricht an Wortgrenzen, max `n` Zeichen je Zeile
export function wrapText(s,n=58){const out=[];let line='';for(const w of String(s).split(/\s+/)){if(line&&(line+' '+w).length>n){out.push(line);line=w}else line=line?line+' '+w:w}if(line)out.push(line);return out}
export class Dealer{
 constructor(story,cfg={}){this.s=story;this.x=cfg.x===undefined?-480:cfg.x;this.reset()}
 get g(){return this.s.g}
 reset(){this.active=false;this.alpha=1;this.near=false;this.node='menu';this.sel=0;this.say='';this.mood='idle';this.shown=0;this.t=0;this.facing=-1;this.opts=[];this.bought=0;this.greet=false}
 // Kann angesprochen werden? Nur zwischen den Wellen, Spieler lebt und steht am Boden
 get canTalk(){const s=this.s,p=s.g.p1;return s.state==='walk'&&s.g.phase==='fight'&&p.hp>0}
 get typing(){return this.shown<this.say.length}
 get lines(){return wrapText(this.say.slice(0,Math.floor(this.shown)))}
 update(){this.t++;const p=this.g.p1,can=this.canTalk;
  this.alpha=this.s.state==='walk'?Math.min(1,this.alpha+.06):Math.max(0,this.alpha-.1);   // Welle beginnt: er duckt sich weg
  this.facing=p.x<this.x?-1:1;
  this.near=can&&this.alpha>.9&&Math.abs(p.x-this.x)<DEALER.reach&&p.y>GROUND-70;
  if(this.active&&(!can||!this.near))this.close(true);
  if(this.active&&this.typing){const b=Math.floor(this.shown);this.shown=Math.min(this.say.length,this.shown+1.15);if(Math.floor(this.shown)%3===0&&Math.floor(this.shown)!==b)this.g.sfx('combo_step_01',{vol:.12,rate:1.5+Math.random()*.5})}}
 // Frame (Name im Atlas assets/rabe) für Zeit t: Sprechen = Gesten wechseln, sonst Atmen
 frame(t=this.t){const seq=this.active?MOODS[this.mood]||MOODS.talk:MOODS.idle;
  if(!this.active)return seq[Math.floor(t/22)%seq.length];
  if(MOOD_OPEN.includes(this.mood)&&!this.typing&&seq.length>1)return seq[0];   // Satz zu Ende: Pose halten
  return seq[Math.floor(t/26)%seq.length]}
 // Gespräch
 open(){if(this.active||!this.near)return false;const p=this.g.p1;this.active=true;this.bought=0;p.facing=this.x>=p.x?1:-1;p.vx=0;
  this.g.sfx('ui_round_start',{vol:.4,rate:1.5});this.menu(metBefore?pickR(LINES.again):pickR(LINES.first),'talk');metBefore=true;this.greet=true;return true}
 close(silent){if(!this.active)return;this.active=false;this.node='menu';if(!silent){this.g.pop(this.x,GROUND-300,pickR(LINES.bye),'#d6b8ff',.9,{text:true,life:90});this.g.sfx('ui_round_start',{vol:.3,rate:1.2})}}
 speak(text,mood='talk'){this.say=text;this.shown=0;this.mood=mood}
 menu(text,mood){this.node='menu';this.sel=0;if(text)this.speak(text,mood||'talk');this.rebuild()}
 // Auswahlzeilen je Knoten: {label,sub,ok,fn}; ok=false -> ausgegraut (nicht genug Coins / schon besessen)
 rebuild(){const o=[],coins=LOOT.coins;
  if(this.node==='menu'){
   o.push({label:'BOOSTER-PACKS',sub:'ab '+SHOP[0].price+' Coins',ok:true,fn:()=>this.go('booster')});
   o.push({label:'GEGENSTÄNDE',sub:'Heilung · Hyper-Meter',ok:true,fn:()=>this.go('items')});
   const owned=ownsChar(DEALER.id);o.push({label:owned?'KÄMPFER: BESITZT':'ANHEUERN',sub:owned?'in der Charakterwahl':charPrice(DEALER.id)+' Coins',ok:true,fn:()=>this.go('hire')});
   o.push({label:'PLAUDERN',sub:'Gerüchte',ok:true,fn:()=>this.menu(pickR(LINES.chat),'talk')});
   o.push({label:'GEHEN',sub:'',ok:true,fn:()=>this.close()})}
  else if(this.node==='booster'){SHOP.forEach((s,i)=>o.push({label:s.n===1?'1 BOOSTER':s.n+' BOOSTER',sub:s.price+' Coins',ok:coins>=s.price,fn:()=>this.buyBooster(i)}));o.push({label:'ZURÜCK',sub:'',ok:true,fn:()=>this.menu(pickR(LINES.more),'hip')})}
  else if(this.node==='items'){ITEM_SHOP.forEach((it,i)=>o.push({label:it.name,sub:it.info+' · '+it.price+' Coins',ok:coins>=it.price,fn:()=>this.buyItem(i)}));o.push({label:'ZURÜCK',sub:'',ok:true,fn:()=>this.menu(pickR(LINES.more),'hip')})}
  else if(this.node==='hire'){const owned=ownsChar(DEALER.id);o.push({label:owned?'SCHON ANGEHEUERT':'ANHEUERN',sub:charPrice(DEALER.id)+' Coins',ok:!owned&&coins>=charPrice(DEALER.id),fn:()=>this.hire()});o.push({label:'ZURÜCK',sub:'',ok:true,fn:()=>this.menu(pickR(LINES.more),'hip')})}
  this.opts=o;this.sel=Math.max(0,Math.min(o.length-1,this.sel))}
 go(node){this.node=node;this.sel=0;
  if(node==='booster')this.speak(LINES.booster,'sell');
  else if(node==='items')this.speak(LINES.items,'point');
  else if(node==='hire')this.speak(ownsChar(DEALER.id)?LINES.owned:hireLine(),ownsChar(DEALER.id)?'cross':'think');
  this.rebuild()}
 choose(i){const o=this.opts[i];if(!o)return false;this.sel=i;
  if(!o.ok){this.g.sfx('block_guard',{vol:.5});this.speak(pickR(LINES.poor),'cross');return false}
  o.fn();return true}
 // Käufe: Münzen/Booster/Heilung laufen über die vorhandenen Systeme (LOOT, saveLoot, buyPack, buyChar) -> sofort gespeichert
 buyBooster(i){const s=SHOP[i];if(!buyPack(i)){this.g.sfx('block_guard',{vol:.5});this.speak(pickR(LINES.poor),'cross');this.rebuild();return false}
  this.bought++;this.g.sfx('fw_rocket',{vol:.6,rate:1.5});this.g.pop(this.x,GROUND-300,'+'+s.n+' BOOSTER','#ffd23f',1.1,{text:true});this.speak(pickR(LINES.bought),'wow');this.rebuild();return true}
 buyItem(i){const it=ITEM_SHOP[i],p=this.g.p1;if(LOOT.coins<it.price){this.speak(pickR(LINES.poor),'cross');this.rebuild();return false}
  if(it.kind==='heal'&&p.hp>=p.maxHp){this.speak(LINES.full,'hip');return false}   // nichts kaufen, was nichts bringt: keine Abbuchung
  if(it.kind==='meter'&&p.meter>=300){this.speak(LINES.fullMeter,'hip');return false}
  LOOT.coins-=it.price;saveLoot();this.bought++;
  if(it.kind==='heal'){const h=Math.round(p.maxHp*it.v);p.hp=Math.min(p.maxHp,p.hp+h);this.g.pop(p.x,p.y-190,'+'+h,'#7dff9a',1.2)}
  else{p.meter=Math.min(300,p.meter+it.v);this.g.pop(p.x,p.y-190,'+'+it.v+' METER','#ffd23f',1.1,{text:true})}
  this.g.fx.ps.ring(p.x,p.y-80,it.kind==='heal'?'#7dff9a':'#ffd23f',110);this.g.sfx('ui_round_start',{vol:.5,rate:1.6});this.speak(pickR(LINES.bought),'wow');this.rebuild();return true}
 hire(){if(ownsChar(DEALER.id)){this.speak(LINES.owned,'cross');this.rebuild();return false}
  if(!buyChar(DEALER.id)){this.g.sfx('block_guard',{vol:.5});this.speak(pickR(LINES.poor),'cross');this.rebuild();return false}
  this.bought++;this.g.sfx('fw_finale',{vol:.5});this.g.flash=Math.max(this.g.flash,8);this.g.flashColor=CHARACTERS[DEALER.id].glow;this.g.pop(this.x,GROUND-300,'KORVUS FREIGESCHALTET!','#d6b8ff',1.2,{text:true,life:120});
  this.speak(LINES.hired,'wow');this.rebuild();return true}
 // Eingabe (Tastaturcodes, auch vom Controller als synthetische Tasten). Rückgabe true = Taste verbraucht
 key(code){if(!this.active)return false;
  if(code==='ArrowUp'||code==='KeyW'){if(this.opts.length)this.sel=(this.sel+this.opts.length-1)%this.opts.length;return true}
  if(code==='ArrowDown'||code==='KeyS'){if(this.opts.length)this.sel=(this.sel+1)%this.opts.length;return true}
  if(code==='Enter'||code==='Space'||code==='KeyJ'||code==='KeyE'){if(this.typing&&this.greet){this.shown=this.say.length;this.greet=false;return true}this.greet=false;this.choose(this.sel);return true}   // erstes ENTER überspringt nur die Begrüßung, danach wählt ENTER sofort
  if(code==='Escape'||code==='KeyK'||code==='Backspace'){if(this.node!=='menu')this.menu(pickR(LINES.more),'hip');else this.close();return true}
  return false}
 click(i){if(!this.active)return false;return this.choose(i)}}
