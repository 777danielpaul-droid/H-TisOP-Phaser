// Render-Blueprint: Spiel als Static Site (sofort da, Adresse hitisop.onrender.com), Online-Server getrennt (darf schlafen). node tests/render.test.js
import assert from'node:assert/strict';import fs from'node:fs';
import{netServerUrl}from'../src/core/netclient.js';
const y=fs.readFileSync(new URL('../render.yaml',import.meta.url),'utf8');
const blocks=y.split(/^  - type:/m).slice(1);assert.equal(blocks.length,2,'zwei Dienste');
const st=blocks.find(b=>/runtime: static/.test(b)),web=blocks.find(b=>/runtime: node/.test(b));assert.ok(st&&web);
assert.match(st,/name: hitisop\n/,'das Spiel behält den Namen hitisop (= Adresse hitisop.onrender.com)');assert.match(st,/staticPublishPath: dist/);assert.match(st,/buildCommand: node tools\/build\.mjs/);
const m=/key: HITISOP_ONLINE_URL\s+value: (https:\/\/\S+)/.exec(st);assert.ok(m,'Static Site kennt die Adresse des Online-Servers');
const sn=/name: (hitisop-\S+)/.exec(web)[1];assert.equal(m[1],`https://${sn}.onrender.com`,'Server-Adresse passt zum Dienstnamen');
assert.match(web,/startCommand: node server\/server\.js/);assert.ok(!/HITISOP_ONLINE_URL/.test(web),'der Server liefert das Spiel weiter ohne feste URL (gleiche Herkunft)');
assert.equal(netServerUrl({protocol:'https:',host:'hitisop.onrender.com'},m[1]),m[1].replace(/^https/,'wss')+'/ws','Spielseite verbindet sich mit dem getrennten Server');
console.log('  ✓ Render: Spiel (static, hitisop) + Online-Server getrennt\nRender-Tests bestanden');
