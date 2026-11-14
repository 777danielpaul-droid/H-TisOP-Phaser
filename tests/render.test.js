// Render-Blueprint: Spiel als Static Site (sofort da), Online-Server getrennt (darf schlafen). node tests/render.test.js
import assert from'node:assert/strict';import fs from'node:fs';
import{netServerUrl}from'../src/core/netclient.js';
const y=fs.readFileSync(new URL('../render.yaml',import.meta.url),'utf8');
const blocks=y.split(/^  - type:/m).slice(1);assert.equal(blocks.length,2,'zwei Dienste');
const st=blocks.find(b=>/runtime: static/.test(b)),web=blocks.find(b=>/runtime: node/.test(b));
assert.ok(st&&web);assert.match(st,/staticPublishPath: dist/);assert.match(st,/buildCommand: node tools\/build\.mjs/);
const m=/key: HITISOP_ONLINE_URL\s+value: (https:\/\/\S+)/.exec(st);assert.ok(m,'Static Site kennt die Adresse des Online-Servers');
assert.match(web,/startCommand: node server\/server\.js/);assert.match(web,/name: hitisop\b/);
assert.equal(netServerUrl({protocol:'https:',host:'hitisop-spiel.onrender.com'},m[1]),m[1].replace(/^https/,'wss')+'/ws','Spielseite verbindet sich mit dem getrennten Server');
assert.ok(!/HITISOP_ONLINE_URL/.test(web),'der Server selbst liefert weiter das Spiel (gleiche Adresse), ohne feste URL');
console.log('  ✓ Render: Spiel (static) + Online-Server getrennt\nRender-Tests bestanden');
