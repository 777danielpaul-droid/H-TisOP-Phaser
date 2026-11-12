// Booster aufreißen: Wertigkeit der Preise, Ablauf der Animation (idle → tear → pop → 3× show/out → sum), Skip, Feuerwerk wächst mit dem Wert. node tests/packopen.test.js
// (Aussehen: Browser-Test tests/e2e-booster.py)
import assert from'node:assert/strict';
import{prizeTier,openPack,addPack,LOOT,CARDS}from'../src/core/loot.js';
import{PackOpen}from'../src/render/packopen.js';
const ok=n=>console.log('  ✓',n);
const COIN=n=>({type:'coins',n}),CARD=r=>({type:'card',id:'x',name:'X',r,isNew:true}),SKIN={type:'skin',char:'tiger',idx:1,name:'ROT',col:'#ff4a3a',isNew:true},STAGE={type:'stage',idx:1,name:'CRIMSON TEMPLE',isNew:true};
{assert.equal(prizeTier(COIN(10)),0);assert.equal(prizeTier(COIN(34)),0);assert.equal(prizeTier(COIN(35)),1);assert.equal(prizeTier(COIN(50)),1);
 assert.deepEqual([0,1,2].map(r=>prizeTier(CARD(r))),[1,2,4]);assert.equal(prizeTier(SKIN),3);assert.equal(prizeTier(STAGE),3);assert.equal(prizeTier(null),0);
 ok('Wertigkeit: wenig Coins 0 · viele Coins/gewöhnlich 1 · selten 2 · Farbe/Stage 3 · episch 4')}
{LOOT.packs=0;addPack(200);const seen=new Set();for(let i=0;i<200;i++){const rw=openPack();assert.equal(rw.length,3);for(const r of rw){const t=prizeTier(r);assert.ok(t>=0&&t<=4);seen.add(t)}}assert.ok(seen.size>=4,'echte Booster liefern verschiedene Wertigkeiten: '+[...seen]);ok('echte Booster-Preise haben gültige Wertigkeiten ('+[...seen].sort()+')')}
function run(po,f,max=3000){let n=0;while(!f()&&n++<max)po.update(1);assert.ok(n<max,'Zeitüberschreitung bei '+po.ph+' pt='+po.pt);return n}
{const S=[],po=new PackOpen([COIN(10),SKIN,CARD(2)],(n,o)=>S.push(n));
 assert.equal(po.ph,'idle');for(let i=0;i<600;i++)po.update(1);assert.equal(po.ph,'idle','das Päckchen wartet auf ENTER (kein Auto-Weiter)');
 assert.equal(po.advance(),false);assert.equal(po.ph,'tear');
 run(po,()=>po.ph==='pop');assert.ok(S.includes('whoosh_heavy')&&S.includes('hit_critical'),'Aufreißen hat Sound');assert.ok(po.ta>=0,'Päckchen ist aufgerissen');
 run(po,()=>po.ph==='show');assert.equal(po.k,0);
 const imp=[0,1,2].map(i=>po.impAt(i));assert.ok(imp[0]<imp[1]&&imp[1]<imp[2],'je wertvoller, desto länger die Spannung: '+imp);
 // Karte 0 (Coins, Tier 0): keine Rakete
 run(po,()=>po.pt>imp[0]+40);assert.equal(po.fw.rk.length+(po.q.length),0,'wenig Coins: kein Raketenfeuerwerk');
 // ENTER vor dem Einschlag überspringt die Spannung, danach geht es weiter
 const po2=new PackOpen([CARD(2)],()=>{});po2.advance();run(po2,()=>po2.ph==='show');po2.update(1);po2.advance();po2.update(2);assert.ok(po2.pt>=po2.impAt(0),'ENTER überspringt die Spannung');
 po.advance();assert.equal(po.ph,'out','nach dem Einschlag bringt ENTER die Karte in die Ablage');run(po,()=>po.ph==='show'&&po.k===1);
 // Karte 1 (Farbe, Tier 3): Finale-Sound + Riesenblume + Raketen
 const before=S.filter(n=>n==='fw_finale').length;run(po,()=>po.pt>imp[1]+40);assert.ok(S.filter(n=>n==='fw_finale').length>before,'Farbe/Stage: Finale-Sound');
 run(po,()=>po.pt>imp[1]+30);po.advance();run(po,()=>po.ph==='show'&&po.k===2);
 // Karte 2 (episch, Tier 4): große Bombe, viele Raketen, Schockwellen
 let maxRk=0,maxSh=0;run(po,()=>{maxRk=Math.max(maxRk,po.fw.rk.length);maxSh=Math.max(maxSh,po.fw.sh.length);return po.pt>imp[2]+90});assert.ok(maxRk>=3,'JACKPOT: Raketensalve (max. gleichzeitig '+maxRk+')');assert.ok(maxSh>=2,'JACKPOT: Schockwellen');assert.ok(po.items[2].tier===4);
 run(po,()=>po.pt>imp[2]+30);assert.equal(po.advance(),false);assert.equal(po.ph,'out');run(po,()=>po.ph==='sum');
 assert.equal(po.advance(),false,'Übersicht: erst nach kurzer Zeit ENTER-fähig');run(po,()=>po.pt>25);assert.equal(po.advance(),true,'ENTER in der Übersicht beendet die Animation');
 ok('Ablauf: idle → tear → pop → 3× (show → out) → sum; ENTER/Skip; Feuerwerk wächst mit dem Wert')}
{// Dicke Zeitschritte (langsamer Rechner) verlieren keine Ereignisse
 const S=[],po=new PackOpen([CARD(1),COIN(40),COIN(5)],n=>S.push(n));po.advance();for(let i=0;i<400;i++)po.update(3);assert.ok(po.ph!=='idle'&&po.ph!=='tear','läuft auch bei 3-Frame-Sprüngen weiter');assert.ok(S.includes('whoosh_heavy'));
 const q=new PackOpen([COIN(1),COIN(2),COIN(3)],()=>{});q.advance();for(let i=0;i<20;i++)q.update(.5);assert.ok(q.a<=10+1,'halbe Zeitschritte sammeln sich korrekt (a='+q.a+')');ok('Zeitsteuerung: unabhängig von der Bildrate')}
console.log('Booster-Animations-Tests bestanden');
