// Ein Abstimmungsschritt: misst die Gewinnquoten (tools/balance.mjs --json) und passt Leben/Schaden aller Figuren
// in Richtung 50 % an. Der Stand liegt in /tmp/balance-tune.json (Startwerte = aktuelle Werte aus characters.js).
//   node tools/balance-fit.mjs [--n=150] [--seed=3] [--reset]
import{CHARACTERS}from'../src/core/characters.js';
import{execFileSync}from'node:child_process';
import fs from'node:fs';
const arg=(k,d)=>{const a=process.argv.find(s=>s.startsWith('--'+k+'='));return a?a.slice(k.length+3):d};
const IDS=arg('chars','tiger,st3g0,kitsune,anubis,rabe,leon,bear,cyberdemon').split(','),F='/tmp/balance-tune.json';
let T=!process.argv.includes('--reset')&&fs.existsSync(F)?JSON.parse(fs.readFileSync(F,'utf8')):Object.fromEntries(IDS.map(i=>[i,{hp:CHARACTERS[i].hp,dmg:CHARACTERS[i].dmg}]));
const tune=Object.entries(T).flatMap(([i,v])=>[`${i}.hp=${v.hp}`,`${i}.dmg=${v.dmg}`,...(v.stam?[`${i}.stam=${v.stam}`]:[])]).join(',');
const out=execFileSync('node',['tools/balance.mjs','--json','--w=4','--n='+arg('n',150),'--seed='+arg('seed',3),'--level='+arg('level',2),'--chars='+IDS.join(','),'--tune='+tune],{encoding:'utf8'});
const W=JSON.parse(out.trim().split('\n').pop());
console.log('Quoten:',IDS.map(i=>`${i} ${(W[i]*100).toFixed(0)}`).join(' | '));
if(!process.argv.includes('--measure')){
 const d={};let m=0;for(const i of IDS){d[i]=.5-W[i];m+=d[i]}m/=IDS.length;
 for(const i of IDS){const e=Math.max(-.3,Math.min(.3,d[i]-m));T[i].hp=Math.round(T[i].hp*Math.exp(.6*e));T[i].dmg=+(T[i].dmg*Math.exp(.4*e)).toFixed(3)}
 fs.writeFileSync(F,JSON.stringify(T));
}
console.log('Werte :',IDS.map(i=>`${i} hp ${T[i].hp} dmg ${T[i].dmg}`).join(' | '));
