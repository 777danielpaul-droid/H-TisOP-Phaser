// Online-Modus Ende-zu-Ende: echter Server (server/server.js) + zwei NetClient/NetMatch + zwei Spielinstanzen über echte WebSockets. node tests/online.test.js
import assert from'node:assert/strict';
import fs from'node:fs';import os from'node:os';import path from'node:path';import zlib from'node:zlib';import http from'node:http';
import{startServer,LIMITS}from'../server/server.js';
import{Game}from'../src/core/game.js';
import{Fighter}from'../src/core/fighter.js';
import{Arcade}from'../src/core/arcade.js';
import{AIController}from'../src/core/ai.js';
import{CHARACTERS}from'../src/core/characters.js';
import{NetInput,encInput,netHash}from'../src/core/netplay.js';
import{NetClient,netServerUrl}from'../src/core/netclient.js';
import{NetMatch}from'../src/core/netmatch.js';
const ok=n=>console.log('  ✓',n);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const until=async(f,ms=4000,what='')=>{const t0=Date.now();while(!f()){if(Date.now()-t0>ms)throw new Error('Zeitüberschreitung: '+what);await sleep(2)}};
const rng=s=>()=>((s^=s<<13,s^=s>>>17,s^=s<<5)>>>0)/4294967296;
const sampler=(seed,toward)=>{const r=rng(seed);let dx=0,dy=0,hold=0;return()=>{if(--hold<=0){hold=2+(r()*14|0);const q=r();dx=q<.45?toward:q<.6?-toward:0;dy=r()<.12?-1:0}const pr=[];if(r()<.22)pr.push(['L','M','H','S','SUP','DASH'][r()*6|0]);return encInput(dx,dy,pr)}};
// Server mit Mini-Spiel-Datei
const dist=fs.mkdtempSync(path.join(os.tmpdir(),'hitisop-'));const page='<!doctype html><title>H!TisOP</title>'+'x'.repeat(5000);fs.writeFileSync(path.join(dist,'index.html'),page);
const srv=await startServer({port:0,quiet:true,distDir:dist,limits:{ratePerSec:1e6,burst:1e6}});const URL_=`ws://127.0.0.1:${srv.port}/ws`;
const get=(p,h={})=>new Promise((res,rej)=>http.get({host:'127.0.0.1',port:srv.port,path:p,headers:h},r=>{const c=[];r.on('data',d=>c.push(d));r.on('end',()=>res({status:r.statusCode,h:r.headers,body:Buffer.concat(c)}))}).on('error',rej));
// 1) HTTP: Spiel ausliefern (komprimiert), healthz, 404
{const a=await get('/',{'accept-encoding':'gzip'});assert.equal(a.status,200);assert.equal(a.h['content-encoding'],'gzip');assert.equal(zlib.gunzipSync(a.body).toString(),page);
 const b=await get('/',{'accept-encoding':'br'});assert.equal(zlib.brotliDecompressSync(b.body).toString(),page);const c=await get('/');assert.equal(c.body.toString(),page);
 const d=await get('/',{'if-none-match':a.h.etag});assert.equal(d.status,304);assert.equal((await get('/healthz')).status,200);assert.equal((await get('/geheim')).status,404);assert.equal((await get('/../server/server.js')).status,404,'kein Zugriff auf andere Dateien');
 ok('HTTP: Seite (br/gzip/unkomprimiert, ETag/304), healthz, 404 für alles andere')}
// 2) URL-Ermittlung im Client
{assert.equal(netServerUrl({protocol:'https:',host:'spiel.onrender.com'},null),'wss://spiel.onrender.com/ws');assert.equal(netServerUrl({protocol:'http:',host:'192.168.0.5:3000'},null),'ws://192.168.0.5:3000/ws');assert.equal(netServerUrl({protocol:'file:',host:''},null),null,'file:// = kein Server');assert.equal(netServerUrl({protocol:'file:'},'https://x.de/'),'wss://x.de/ws');ok('Server-Adresse: https→wss, http→ws, file:// ohne Server, optional fest eingestellt')}
const mkClient=async()=>{const c=new NetClient({url:URL_});await c.connect();return c};
const opened=[];const client=async()=>{const c=await mkClient();opened.push(c);return c};
// 3) Raum erstellen / beitreten, Fehlerfälle
let A,B;
{A=await client();B=await client();A.host();await until(()=>A.state==='hosting','Raum');assert.match(A.code,/^[A-HJ-NP-Z]{4}$/);
 const errs=[];B.on('error',m=>errs.push(m.code));B.join('ZZZZ');await until(()=>errs.length,2000,'Fehler');assert.equal(errs[0],'noroom');
 const C=await client();const ce=[];C.on('error',m=>ce.push(m.code));B.join(A.code.toLowerCase());await until(()=>B.state==='paired'&&A.state==='paired','Paarung');assert.equal(A.role,'host');assert.equal(B.role,'guest');
 C.join(A.code);await until(()=>ce.length,2000,'Raum voll');assert.equal(ce[0],'taken');ok('Raum: erstellen (Code '+A.code+'), falscher Code → Fehler, beitreten (auch klein geschrieben), dritter Spieler → belegt')}
// 4) Kompletter Online-Kampf über echte WebSockets
const mk=(client,seed,toward)=>{const inputs=[new NetInput(),new NetInput()],ai=new AIController(0);const p1=new Fighter({char:CHARACTERS.tiger,x:340,facing:1,input:inputs[0]}),p2=new Fighter({char:CHARACTERS.tiger,x:620,facing:-1,input:inputs[1]});
 const g=new Game(p1,p2),arc=new Arcade(g,p1,p2,ai);g.frame=777;   // absichtlich anderer Zählerstand vorher: startOnline setzt ihn zurück
 const o={g,arc,hashes:new Map(),launches:[],ended:[],started:0,delay:0};
 o.m=new NetMatch({client,game:g,inputs,sample:sampler(seed,toward),valid:id=>!!CHARACTERS[id],hooks:{
  onLaunch:(cfg,i)=>{o.launches.push({cfg,rematch:i.rematch});arc.startOnline(cfg);setTimeout(()=>o.m.launched(),i.rematch?0:seed%5*15)},   // Start-Animation dauert je Gerät unterschiedlich lang
  onStart:()=>{o.started++;o.delay=o.m.ls.delay},onEnd:r=>o.ended.push(r)}});
 const oh=o.m.ls.hash.bind(o.m.ls);o.m.ls.hash=()=>{o.hashes.set(o.m.epoch+':'+o.m.ls.fr,netHash(g));oh()};return o};
const H=mk(A,3,1),G=mk(B,4,-1);
{assert.equal(H.m.slot,0);assert.equal(G.m.slot,1);G.m.pick('st3g0',1);H.m.pick('tiger',0);await until(()=>H.m.them.id==='st3g0'&&G.m.them.id==='tiger','Auswahl sichtbar');assert.equal(H.m.them.skin,1);
 assert.equal(H.m.hostStart(2),false,'noch nicht bereit');H.m.setReady(true);G.m.setReady(true);await until(()=>H.m.canStart(),2000,'beide bereit');assert.equal(G.m.canStart(),false,'nur der Gastgeber startet');
 assert.equal(H.m.hostStart(2),true);await until(()=>H.started===1&&G.started===1,4000,'Start');
 for(const o of[H,G]){assert.deepEqual(o.launches[0].cfg.ids,['tiger','st3g0']);assert.deepEqual(o.launches[0].cfg.skins,[0,1]);assert.equal(o.launches[0].cfg.stage,2);assert.equal(o.g.stageIndex,2);assert.equal(o.g.frame,0,'Zähler zurückgesetzt');assert.equal(o.g.p1.char.id,'tiger');assert.equal(o.g.p2.char.id,'st3g0');assert.equal(o.arc.online,true)}
 ok('Auswahl + Start: beide sehen Figur/Farbe des anderen, Stage vom Gastgeber, Zähler bei 0, unterschiedlich lange Start-Animation → gemeinsamer Start (Verzögerung '+H.delay+' / '+G.delay+' Frames)')}
let ITER=0;void ITER;const play=async(frames)=>{const t0=Date.now();while((H.m.ls.fr<frames||G.m.ls.fr<frames)&&Date.now()-t0<30000){let n=0;while(n++<40&&H.m.ls.fr<frames&&H.m.step()){}n=0;while(n++<25&&G.m.ls.fr<frames&&G.m.step()){}H.m.flush();G.m.flush();ITER++;await sleep(0)}assert.ok(H.m.ls.fr>=frames&&G.m.ls.fr>=frames,'Frames erreicht: '+H.m.ls.fr+'/'+G.m.ls.fr)};
const compare=(l)=>{let n=0;for(const[k,h]of H.hashes)if(G.hashes.has(k)){assert.equal(G.hashes.get(k),h,l+': Abweichung bei '+k);n++}assert.ok(n>5,l+': Vergleichspunkte '+n);return n};
{await play(4000);const n=compare('Kampf 1');assert.equal(H.ended.length+G.ended.length,0);const hp=[H.g.p1.hp,H.g.p2.hp,H.g.round];assert.deepEqual(hp,[G.g.p1.hp,G.g.p2.hp,G.g.round]);
 ok('4000 Frames über echte WebSockets: '+n+' Prüfpunkte identisch, Runde '+H.g.round+', HP '+hp.slice(0,2).map(Math.round)+' (Ping '+Math.round(A.rtt)+' ms)')}
// 5) Revanche: erst wenn beide wollen; neue Epoche, Zähler wieder bei 0, ohne neue Videos
{H.m.requestRematch();assert.equal(H.m.rematchWait,true);await sleep(60);assert.equal(H.started,1,'wartet auf den Gegner');G.m.requestRematch();await until(()=>H.started===2&&G.started===2,4000,'Revanche');
 assert.equal(H.m.epoch,2);assert.equal(H.launches[1].rematch,true);assert.deepEqual(H.launches[1].cfg.ids,['tiger','st3g0']);assert.equal(H.g.frame,0);assert.equal(H.g.p1.wins+H.g.p2.wins,0);await play(1500);const n=compare('Revanche');ok('Revanche: beide müssen zustimmen, neue Epoche, frischer Kampf, '+n+' Vergleichspunkte insgesamt identisch')}
// 6) Gegner verlässt den Kampf
{H.m.leave();await until(()=>G.ended.length,3000,'peer-left');assert.deepEqual(H.ended,['left']);assert.deepEqual(G.ended,['peer-left']);assert.equal(A.state,'open');assert.equal(B.state,'open');ok('Verlassen: Gegner erfährt es sofort, beide Verbindungen bleiben für einen neuen Raum offen')}
// 7) Schnellsuche
{const P=await client(),Q=await client(),R=await client();P.quick();await until(()=>P.state==='queued',2000,'Warteschlange');Q.quick();await until(()=>P.state==='paired'&&Q.state==='paired','Schnellsuche-Paar');assert.equal(P.role,'host','wer zuerst wartet, ist Gastgeber (P1)');assert.equal(Q.role,'guest');
 R.quick();await until(()=>R.state==='queued','dritter wartet');R.cancel();await until(()=>R.state==='open','abbrechen');ok('Schnellsuche: erster wartet, zweiter wird gepaart (Gastgeber = der Wartende), Abbrechen funktioniert')}
// 8) Raum schließen, wenn der Gastgeber abbricht; Nachrichten ohne Gegner gehen ins Leere
{const X=await client(),Y=await client();X.host();await until(()=>X.state==='hosting');const code=X.code;X.cancel();await until(()=>X.state==='open');const e=[];Y.on('error',m=>e.push(m.code));Y.join(code);await until(()=>e.length);assert.equal(e[0],'noroom');
 X.sendPeer({t:'pick',id:'tiger'});await sleep(30);assert.equal(Y.state,'open');ok('Abgebrochener Raum ist weg, Nachrichten ohne Gegner verpuffen')}
// 9) Tempo-Begrenzung: Dauerfeuer wird getrennt
{const strict=await startServer({port:0,quiet:true,distDir:dist});const S=new NetClient({url:`ws://127.0.0.1:${strict.port}/ws`});await S.connect();let closed=false;S.on('close',()=>closed=true);for(let i=0;i<LIMITS.burst+400;i++)S.raw({t:'ping',ts:i});await until(()=>closed,3000,'Trennung bei Spam');await strict.close();
 ok('Spam (>'+LIMITS.burst+' Nachrichten am Stück) → Verbindung getrennt')}
// 10) Aufräumen: Server kennt keine hängenden Räume
{for(const c of opened)c.close();await sleep(80);assert.equal(srv.rooms.size,0);ok('Aufräumen: nach dem Schließen keine offenen Räume')}
await srv.close();fs.rmSync(dist,{recursive:true,force:true});
process.exit(0);
