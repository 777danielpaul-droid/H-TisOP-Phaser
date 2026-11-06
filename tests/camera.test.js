// Kamera-Tests: node tests/camera.test.js
import assert from'node:assert/strict';
import{Camera}from'../src/core/camera.js';
import{W,H,GROUND,WORLD,CAMERA}from'../src/core/config.js';
const F=(x,y,state='idle')=>({x,y,state,get grounded(){return this.y>=GROUND}});
const settle=(cam,fs,n=300)=>{for(let i=0;i<n;i++)cam.update(fs)};
const visible=(cam,x,y)=>{const[sx,sy]=cam.toScreen(x,y);return sx>=0&&sx<=W&&sy>=0&&sy<=H};
// 1) Neutral: Zoom 1, zentriert
{const c=new Camera(),fs=[F(340,GROUND),F(620,GROUND)];settle(c,fs);assert.ok(Math.abs(c.zoom-1)<.01,'Zoom 1 am Boden '+c.zoom);assert.ok(Math.abs(c.y-H/2)<1,'y zentriert');assert.ok(Math.abs(c.x-480)<1);console.log('  ✓ Neutral: zoom 1.0')}
// 2) Hoher Sprung: Zoom < 1, Kopf bleibt im Bild, Boden bleibt sichtbar
{const c=new Camera(),fs=[F(340,0),F(620,GROUND)];settle(c,fs);assert.ok(c.zoom<.8,'herausgezoomt '+c.zoom);assert.ok(c.zoom>=CAMERA.minZoom-1e-6);
 assert.ok(visible(c,340,0-165),'Kopf im Bild');assert.ok(visible(c,620,GROUND),'Boden sichtbar');console.log('  ✓ Sprung: zoom',c.zoom.toFixed(2),', Kopf & Boden im Bild')}
// 3) Weit auseinander: horizontal herauszoomen, beide im Bild
{const c=new Camera(),fs=[F(60,GROUND),F(900,GROUND)];settle(c,fs);assert.ok(c.zoom<.95,'Zoom wegen Abstand '+c.zoom);assert.ok(visible(c,60,GROUND)&&visible(c,900,GROUND));console.log('  ✓ Abstand: zoom',c.zoom.toFixed(2))}
// 4) Kamera bleibt in den Weltgrenzen (kein leerer Rand)
{const c=new Camera(),fs=[F(900,-60),F(60,GROUND)];settle(c,fs);const hw=W/2/c.zoom,hh=H/2/c.zoom;
 assert.ok(c.x-hw>=WORLD.x0-1&&c.x+hw<=WORLD.x1+1&&c.y-hh>=WORLD.y0-1&&c.y+hh<=WORLD.y1+1,'innerhalb der Welt');console.log('  ✓ Weltgrenzen eingehalten')}
// 5) Smooth: kein Sprung, konvergiert und zoomt wieder hinein
{const c=new Camera(),hi=[F(340,0),F(620,GROUND)],lo=[F(340,GROUND),F(620,GROUND)];c.update(hi);assert.ok(c.zoom>.9,'Lerp: nicht sofort am Ziel');settle(c,hi);const zo=c.zoom;settle(c,lo);assert.ok(c.zoom>zo&&Math.abs(c.zoom-1)<.02,'zoomt wieder hinein');console.log('  ✓ Lerp / Rückkehr zu 1.0')}
// 6) Welt<->Bildschirm Umrechnung ist invertierbar
{const c=new Camera();c.x=500;c.y=200;c.zoom=.7;const[sx,sy]=c.toScreen(123,45),[wx,wy]=c.toWorld(sx,sy);assert.ok(Math.abs(wx-123)<1e-9&&Math.abs(wy-45)<1e-9);console.log('  ✓ toScreen/toWorld')}
console.log('Kamera-Tests bestanden');
