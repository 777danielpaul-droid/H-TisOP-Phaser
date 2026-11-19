import{ITEMS,ITEM_METER_MAX,itemOf}from'./items.js';
import{LOOT,addItem,addPack,itemCount,saveLoot,unlockAll}from'./loot.js';
import{CHAPTERS}from'./story.js';

// Befehle der Entwicklerkonsole (render/devconsole.js) zum schnellen Testen, v. a. im Story-Modus. Rein logisch (kein DOM) -> testbar.
// Jeder Befehl liefert den Ausgabetext; ein Wurf (Error) erscheint als Fehlermeldung in der Konsole.
export function registerDevCommands(con,{game,arcade}){
 const story=()=>{const s=game.story;if(!s||arcade.mode!=='story'||arcade.state!=='fight')throw new Error('Nur in einem laufenden Story-Level.');return s};
 const num=(v,d=1,max=999)=>{const n=parseInt(v,10);return Number.isFinite(n)?Math.max(1,Math.min(max,n)):d};
 // alle lebenden Gegner sofort besiegen (leise: ohne Wackeln/Drops/Boss-Belohnung) und Nachschub der Welle streichen -> die Welle gilt als geschafft
 const killAll=s=>{const p=game.p1,al=s.alive();for(const m of al)s.mobDown(m,p,true);s.queue=[];return al.length};
 con.add('killall','Tötet alle Gegner (die Welle ist damit geschafft)',()=>{const n=killAll(story());return n?n+' Gegner besiegt.':'Keine Gegner da.'});
 con.add('wave','Überspringt die aktuelle bzw. nächste Welle',()=>{const s=story();if(s.state==='done')throw new Error('Das Level ist schon geschafft.');
  if(s.state==='walk'){const e=s.encs[s.enc];if(!e)throw new Error('Keine Welle mehr übrig.');s.engage(e)}
  const w=Math.min(s.enc+1,s.total);killAll(s);return`Welle ${w}/${s.total} übersprungen.`});
 con.add('skip','Schließt das Level sofort ab (Sieg, Folgekapitel wird frei)',()=>{const s=story();if(s.state==='done')throw new Error('Das Level ist schon geschafft.');
  killAll(s);s.enc=s.total-1;s.clear();s.doneT=200;return'Level geschafft. Mit Enter geht es zum nächsten Kapitel.'});
 con.add('chapter','Startet Kapitel n neu (auch gesperrte)',a=>{if(arcade.mode!=='story'||!arcade.player||!game.story)throw new Error('Erst den Story-Modus starten.');
  const c=parseInt(a[0],10);if(!(c>=1&&c<=CHAPTERS.length))throw new Error('Kapitel 1 bis '+CHAPTERS.length+' möglich.');arcade.startStory(arcade.player,c);return'Kapitel '+c+': '+CHAPTERS[c-1].name},'<1-'+CHAPTERS.length+'>');
 con.add('god','Unverwundbarkeit an/aus (Spieler 1)',()=>{game.god=!game.god;if(game.god)game.p1.hp=game.p1.maxHp;return'Unverwundbar: '+(game.god?'AN':'AUS')});
 con.add('heal','Leben und Hyper-Meter voll',()=>{const p=game.p1;p.hp=p.maxHp;p.meter=ITEM_METER_MAX;return'Leben und Meter aufgefüllt.'});
 con.add('give','Gibt dir Booster, Münzen oder Items',a=>{const what=String(a[0]||'').toLowerCase(),ids=['pack','coins',...ITEMS.map(i=>i.id)];
  if(!ids.includes(what))throw new Error('Benutzung: give <'+ids.join('|')+'> [Anzahl]');const n=num(a[1]);
  if(what==='pack'){addPack(n);return`+${n} Booster (jetzt ${LOOT.packs}).`}
  if(what==='coins'){LOOT.coins+=n;saveLoot();return`+${n} Münzen (jetzt ${LOOT.coins}).`}
  addItem(what,n);return`+${n} ${itemOf(what).name} (jetzt ${itemCount(what)}).`},'<pack|coins|item> [n]');
 con.add('unlock','Schaltet alle Farben, Arenen und Kapitel frei',()=>{unlockAll();for(let c=2;c<=CHAPTERS.length;c++)arcade.unlockChapter(c);return'Alle Farben, Arenen und Kapitel freigeschaltet.'});
}
