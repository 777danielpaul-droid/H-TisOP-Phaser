// Entwicklerkonsole (render/devconsole.js): Befehle, Fehlerausgabe, Tastenlogik. Ohne DOM.  node tests/devconsole.test.js
import assert from'node:assert/strict';
import{DevConsole,DEV_TOGGLE}from'../src/render/devconsole.js';
const ok=n=>console.log('  ✓',n),txt=c=>c.log.map(l=>l.t).join('\n'),ev=(code,o={})=>({code,ctrlKey:false,altKey:false,shiftKey:false,metaKey:false,...o}),combo=ev('KeyD',{ctrlKey:true,altKey:true});
// help
{const c=new DevConsole();c.exec('help');const t=txt(c);assert.match(t,/> help/);assert.match(t,/Verfügbare Befehle/);assert.match(t,/help\s+Zeigt alle Befehle/);assert.ok(!c.log.some(l=>l.cls==='dc-err'));ok('help listet die verfügbaren Befehle')}
{const c=new DevConsole();c.add('ping','Antwortet pong',()=>'pong');c.exec('  HELP  ');assert.match(txt(c),/ping\s+Antwortet pong/);c.exec('PING x y');assert.equal(c.log.at(-1).t,'pong');ok('neue Befehle erscheinen in help; Groß-/Kleinschreibung + Leerzeichen egal')}
// Fehler
{const c=new DevConsole();c.exec('gibtsnicht 1');const l=c.log.at(-1);assert.equal(l.cls,'dc-err');assert.match(l.t,/Unbekannter Befehl: „gibtsnicht“/);c.exec('   ');c.exec('');assert.equal(c.log.length,2,'leere Eingabe tut nichts');ok('unbekannter Befehl -> Fehlermeldung, leere Zeile wird ignoriert')}
{const c=new DevConsole();c.add('boom','wirft',()=>{throw new Error('kaputt')});c.exec('boom');assert.deepEqual(c.log.at(-1),{t:'Fehler: kaputt',cls:'dc-err'});c.exec('help');ok('Ausnahme im Befehl -> Fehlerzeile, Konsole läuft weiter')}
{const c=new DevConsole();c.add('args','',a=>a.join('|'));c.exec('args a  b c');assert.equal(c.log.at(-1).t,'a|b|c');for(let i=0;i<150;i++)c.exec('help');assert.ok(c.log.length<=100);ok('Argumente werden übergeben, Ausgabe ist auf 100 Zeilen begrenzt')}
// Tasten
{assert.ok(DEV_TOGGLE(combo));for(const o of[{ctrlKey:true},{altKey:true},{ctrlKey:true,altKey:true,shiftKey:true},{ctrlKey:true,altKey:true,metaKey:true}])assert.ok(!DEV_TOGGLE(ev('KeyD',o)));assert.ok(!DEV_TOGGLE(ev('KeyF',{ctrlKey:true,altKey:true})));ok('Tastenkombination ist genau Strg+Alt+D')}
{let o=0,cl=0,block=false;const c=new DevConsole({onOpen:()=>o++,onClose:()=>cl++,blocked:()=>block});
 assert.equal(c.key(ev('KeyW')),0,'geschlossen: Spieltaste gehört dem Spiel');
 block=true;assert.equal(c.key(combo),0);assert.ok(!c.isOpen,'blockiert (z. B. Intro/Panel): öffnet nicht');block=false;
 assert.equal(c.key(combo),2);assert.ok(c.isOpen&&o===1,'öffnen');
 assert.equal(c.key(ev('KeyW')),1,'offen: Spiel bekommt keine Taste');assert.equal(c.key(ev('Space')),1);
 block=true;assert.equal(c.key(combo),2);assert.ok(!c.isOpen&&cl===1,'Kombination schließt auch dann, wenn blocked() true wäre');block=false;
 c.key(combo);assert.equal(c.key(ev('Escape')),2);assert.ok(!c.isOpen&&cl===2,'Esc schließt');
 assert.equal(c.key(ev('Escape')),0,'geschlossen: Esc gehört dem Spiel');ok('Öffnen/Schließen per Kombination und Esc, Blockade, Tasten werden nur offen verschluckt')}
{const c=new DevConsole();c.open();c.inp={value:'help',blur(){}};assert.equal(c.key(ev('Enter')),2);assert.equal(c.inp.value,'');assert.match(txt(c),/Verfügbare Befehle/);ok('Enter führt die Eingabezeile aus und leert sie')}
console.log('Dev-Konsolen-Tests bestanden');
