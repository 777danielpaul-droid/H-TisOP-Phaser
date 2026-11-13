// Hyper-Kamerafahrt im echten Spielablauf: node tests/hyper.test.js
import assert from'node:assert/strict';
import{Game}from'../src/core/game.js';
import{Fighter}from'../src/core/fighter.js';
import{InputBuffer}from'../src/core/input.js';
import{CHARACTERS}from'../src/core/characters.js';
import{CAMERA}from'../src/core/config.js';
for(const key of Object.keys(CHARACTERS).filter(k=>CHARACTERS[k].name&&k!=='custom')){
 const i1=new InputBuffer(),i2=new InputBuffer();
 const p1=new Fighter({char:CHARACTERS[key],x:400,facing:1,input:i1}),p2=new Fighter({char:CHARACTERS.wolf,x:700,facing:-1,input:i2});
 const g=new Game(p1,p2);while(g.phase!=='fight'){i1.feed(0,0,[]);i2.feed(0,0,[]);g.step()}
 for(let k=0;k<60;k++){i1.feed(0,0,[]);i2.feed(0,0,[]);g.step()}
 const base=g.camera.zoom;p1.meter=300;
 i1.feed(0,0,['SUP']);i2.feed(0,0,[]);g.step();
 assert.ok(g.superFlash>0,key+': Hyper gestartet');assert.ok(g.superName,key+': Move-Name gemerkt');
 let max=0,min=9,n=0,atLaunch=null;
 const hold=()=>g.superFlash>0||(p1.move&&p1.move.super&&p1.mf<p1.move.su+p1.move.ac-CAMERA.cine.lead);
 // Zoom bleibt, solange der Move aktiv ist; schon vor dem letzten Treffer wird rausgezoomt
 while((g.superFlash>0||(p1.move&&p1.move.super))&&n<400){i1.feed(0,0,[],g.superFlash>0);i2.feed(0,0,[],g.superFlash>0);g.step();n++;max=Math.max(max,g.camera.zoom);
  if(n>25&&hold())min=Math.min(min,g.camera.zoom);if(atLaunch===null&&p2.state==='airhit'&&p2.launched)atLaunch=g.camera.zoom}
 assert.ok(max>base+.1&&max<1.4,key+': moderater Zoom ('+base.toFixed(2)+' → '+max.toFixed(2)+')');
 assert.ok(n>50,key+': Attacke dauert '+n+' Frames');
 assert.ok(min>base+.07,key+': Zoom bleibt während der Attacke ('+min.toFixed(2)+')');
 if(atLaunch!==null)assert.ok(atLaunch-base<(max-base)*.25,key+': beim Wegfliegen schon (fast) komplett rausgezoomt ('+atLaunch.toFixed(2)+')');
 for(let k=0;k<150;k++){i1.feed(0,0,[]);i2.feed(0,0,[]);g.step()}
 assert.equal(g.camera.cine,null,key+': Kamerafahrt beendet');assert.ok(g.camera.zoom<1.05,key+': zurück im Kampfzoom '+g.camera.zoom.toFixed(2));
 console.log('  ✓',key,'–',g.superName,'– Zoom',base.toFixed(2),'→',max.toFixed(2),', min während Attacke',min.toFixed(2),',',n,'Frames, beim Wegfliegen',atLaunch===null?'–':atLaunch.toFixed(2));
}
console.log('Hyper-Tests bestanden');
