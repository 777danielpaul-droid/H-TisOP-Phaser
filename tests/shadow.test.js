// Bodenschatten + Fußverankerung der Sprite-Figuren (ohne Browser: Zeichenbefehle werden mitgeschnitten): node tests/shadow.test.js
import assert from'node:assert/strict';
const ok=n=>console.log('  ✓',n);
const fr=(ox,oy,w,h)=>({x:0,y:0,w,h,ox,oy});
const names=['p_7_0','p_7_3','p_2_1','p_3_1','p_3_2','p_3_3','p_1_3','p_6_1'];
globalThis.window={__SPRITES__:{st3g0:{meta:{standH:300,frames:Object.fromEntries(names.map(n=>[n,fr(-200,-300,400,305)])),anims:{}},img:{complete:true,naturalWidth:10}}}};
globalThis.Image=class{};
const{drawSpriteFighter,SPRITE_CHARS}=await import('../src/render/sprites.js');
function draw(over){const calls=[],g=new Proxy({globalAlpha:1},{get(t,k){if(k in t)return t[k];return(...a)=>{calls.push([k,...a]);if(k==='createRadialGradient')return{addColorStop(){}}}},set(t,k,v){t[k]=v;return true}});
 const f={char:{sprites:'st3g0',glow:'#7dff4a'},x:300,y:470,facing:1,anim:'idle',sf:0,animU:0,state:'idle',vx:0,vy:0,move:null,hitstop:0,menu:false,hp:100,...over};
 drawSpriteFighter(g,f,0,1,470);
 const di=calls.findIndex(c=>c[0]==='drawImage'),sh=calls.slice(0,di).findIndex(c=>c[0]==='arc'),tr=calls.slice(0,di).filter(c=>c[0]==='translate');
 return{calls,di,shadow:sh>=0,tr,arc:sh>=0?calls[sh]:null,rotate:calls.some(c=>c[0]==='rotate'),transform:calls.some(c=>c[0]==='transform')}}
// 1) Am Boden: Schatten ist vor dem Sprite gezeichnet, Mitte genau auf der Fußlinie (y = floorY), unter der Figur (x)
{const r=draw({anim:'idle'});assert.ok(r.shadow,'Schatten vorhanden');assert.deepEqual(r.tr[0].slice(1),[300,470],'Schatten-Mitte = Fußlinie');assert.ok(r.arc[3]>=24,'Mindestbreite');ok('Stehend: Schatten mittig auf der Fußlinie, hinter der Figur')}
// 2) Liegende Posen: kein Schatten
for(const[anim,u]of[['kd',.999],['kd',.1],['defeat',0]]){const r=draw({anim,animU:u});const nm=SPRITE_CHARS.st3g0.anims[anim].frames[Math.min(SPRITE_CHARS.st3g0.anims[anim].frames.length-1,Math.floor(u*SPRITE_CHARS.st3g0.anims[anim].frames.length))];
 const ps=SPRITE_CHARS.st3g0.pose&&SPRITE_CHARS.st3g0.pose[anim];   // Ausnahme: Pose mit eigenem Schatten (pose.shadow, z. B. gekippter/abgesenkter Verlierer)
 assert.equal(r.shadow,SPRITE_CHARS.st3g0.lie.includes(nm)?!!(ps&&ps.shadow):true,anim+' '+nm)}
ok('Liegend (Knockdown/Niederlage): Schatten verschwindet ganz')
{const r=draw({anim:'wakeup',animU:0});assert.ok(!r.shadow,'Aufstehen beginnt liegend ohne Schatten');const r2=draw({anim:'wakeup',animU:.99});assert.ok(r2.shadow,'wieder aufrecht = Schatten zurück');ok('Aufstehen: Schatten kommt zurück, sobald die Figur steht')}
// 3) In der Luft: Schatten bleibt am Boden (y = 470), wird kleiner
{const a=draw({anim:'air',y:470}),b=draw({anim:'air',y:300});assert.deepEqual(b.tr[0].slice(1)[1],470,'Schatten am Boden');assert.ok(b.arc[3]<a.arc[3],'in der Luft kleiner');ok('Luft: Schatten bleibt am Boden und schrumpft')}
// 4) Neigung: am Boden geschiefte Figur (Füße bleiben stehen), in der Luft gedreht
{const g1=draw({anim:'hit'}),g2=draw({anim:'hit',y:300});assert.ok(g1.transform&&!g1.rotate,'am Boden: Schiefstellung statt Drehung');assert.ok(g2.rotate,'in der Luft: Drehung');ok('Neigung: Füße bleiben am Boden')}
console.log('Schatten-Tests bestanden');
