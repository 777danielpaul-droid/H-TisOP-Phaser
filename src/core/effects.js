import{GROUND}from'./config.js';
// Fassade für Treffer-/Bewegungseffekte. Rendering-unabhängig: schreibt nur in das ParticleSystem.
// Look wie beim Feuerwerk: statt flacher Formen (Zackenstern, Fadenkreuz, Schlagklingen, einfarbige Ringe) blinkende Funkelsterne (ps.sparkle / sparkleBall / sparkleRing)
// und spitze Glanzsterne (ps.glint). Ringe/Druckwellen (ps.ring / ps.shock) zeichnen ihre Sterne selbst.
const GLITTER_PAL=['#ffffff','#ffe27a','#7df9ff','#ff7ae6'];   // Glitzer-Farben neben der Figurenfarbe
const FX_GOLD='#ffe27a';
const fxPal=c=>[c,c,'#ffffff',FX_GOLD,'#7df9ff','#ff7ae6'];   // Palette: Figurenfarbe doppelt gewichtet + Weiß/Gold/Cyan/Pink
export class Effects{
 constructor(ps){this.ps=ps}
 hit(x,y,power,color,dir){const ps=this.ps,P=power,fwd=dir>0?0:Math.PI,cols=fxPal(color);
  // Dezenter Treffer-Funke (bewusst klein): kleiner Lichtkern + kleiner Glanzstern, wenige kleine Funkelsterne
  ps.flare(x,y,color,26+P*9,6+P,Math.random());
  if(P>=2)ps.glint(x,y,'#ffffff',14+P*5,9+P*2);
  ps.spark(x,y,color,3+P*2,6+P*1.5);
  ps.sparkle(x,y,{count:5+P*3,speed:4+P*1.6,life:26+P*6,size:4.5+P*.7,colors:cols,gravity:.07,dr:.93,angle:fwd,spread:3.4});
  if(P>=2)ps.sparkle(x,y,{count:2+P,speed:1.6,life:40+P*4,size:4.5,colors:cols,gravity:-.012,dr:.97,delay:10});
  if(P>=3)ps.sparkleRing(x,y,color,22+P*9,{count:6+P*2});
  if(P>=3){ps.shock(x,y+60,color,110,16);if(P>=4)ps.sparkleBall(x,y,color,40+P*9,{count:10+P*3,life:44,size:5.5});
   for(let i=0;i<Math.min(P,3);i++)ps.bolt(x,y,i%2?color:'#7df9ff',Math.random()*6.283,50+P*16,5+((Math.random()*3)|0))}
 }
 block(x,y,color){const ps=this.ps,cols=['#ffffff','#8fd4ff','#bfe9ff','#8fd4ff'];
  ps.glint(x,y,'#bfe9ff',24,10);ps.flare(x,y,'#8fd4ff',26,7,Math.random());
  ps.sparkle(x,y,{count:7,speed:4,life:30,size:5,colors:cols,gravity:.06,dr:.93,glint:1});ps.sparkleRing(x,y,'#8fd4ff',20)}
 land(x,y,big){if(big)this.ps.shock(x,y,'#b9a8ff',120,18);
  this.ps.burst(x,y-2,{count:big?10:5,speed:big?5:2.5,color:'#8a7fb8',life:20,size:2.6,angle:-Math.PI/2,spread:3.4,gravity:-.01,streak:.4});
  this.ps.sparkle(x,y-4,{count:big?14:5,speed:big?4.2:2.2,life:big?44:30,size:8,colors:['#ffffff','#b9a8ff','#7df9ff'],angle:-Math.PI/2,spread:2.8,gravity:.05,dr:.93,glint:big?1:0})}
 jump(x,y){this.land(x,y,false)}
 dash(x,y,dir){const a=dir>0?Math.PI:0;this.ps.burst(x,y-8,{count:4,speed:3,color:'#9a8bff',life:14,size:2.2,angle:a,spread:1.2,gravity:0});
  this.ps.sparkle(x,y-8,{count:7,speed:3.4,life:34,size:7,colors:GLITTER_PAL,angle:a,spread:1.5,gravity:.015,dr:.95,glint:0})}
 // Launcher: Druckwelle am Boden + Funkelsäule nach oben (Gegner startet in den Luftkampf)
 launch(x,y,color){const ps=this.ps;ps.shock(x,y,color,210,22);ps.ring(x,y-20,'#ffffff',90);ps.ring(x,y-60,color,120);
  ps.glint(x,y-20,'#ffffff',80,16);ps.glint(x,y-90,color,60,18,3);
  ps.sparkle(x,y-30,{count:30,speed:9,life:58,size:10,colors:fxPal(color),gravity:-.025,dr:.95,angle:-Math.PI/2,spread:.9});
  ps.sparkle(x,y-10,{count:16,speed:3,life:52,size:8,colors:fxPal(color),gravity:-.02,dr:.96,angle:-Math.PI/2,spread:2.2,delay:8})}
 // Super Jump: Funkelring am Boden + aufsteigende Sterne (Verfolgungssprung)
 superJump(x,y,color){const ps=this.ps;ps.shock(x,y,color,150,16);ps.ring(x,y-10,'#ffffff',70);ps.glint(x,y-12,color,56,14);
  ps.sparkle(x,y-10,{count:18,speed:8,life:40,size:9,colors:fxPal(color),gravity:-.03,dr:.94,angle:-Math.PI/2,spread:.7})}
 // Boden-Prall (Meteor-Spike / Air-Hyper-Finale): große Druckwelle, Funkelfontäne, Glanzsterne
 slam(x,y,color){const ps=this.ps;ps.shock(x,y,color,420,30);ps.shock(x,y,'#ffffff',260,22);ps.ring(x,y-10,color,200);ps.ring(x,y-10,'#ffffff',130);
  ps.flare(x,y-8,'#ffffff',150,14,.4);ps.glint(x,y-10,'#ffffff',130,20);ps.glint(x,y-10,color,95,24,3);
  ps.sparkle(x,y-6,{count:56,speed:10,life:76,size:11,colors:fxPal(color),gravity:.1,dr:.94,angle:-Math.PI/2,spread:3.0});
  ps.sparkle(x,y-6,{count:22,speed:3,life:70,size:9,colors:fxPal(color),gravity:-.01,dr:.96,delay:14});
  ps.sparkleRing(x,y-6,color,230,{count:44,life:40});
  for(let i=0;i<4;i++)ps.bolt(x,y-6,i%2?color:'#7df9ff',-Math.PI/2+(i-1.5)*.55,130+i*16,7)}
 // Combo-Effekt: skaliert mit der Trefferzahl, farbig nach Charakter
 combo(x,y,hits,color,dir){const ps=this.ps,h=Math.min(hits,12),cols=fxPal(color);
  ps.flare(x,y,color,34+h*5,9,Math.random());ps.glint(x,y,'#ffffff',30+h*5,12+((h/3)|0));if(hits>=3)ps.glint(x,y,color,44+h*6,15,2);
  ps.sparkle(x,y,{count:8+h*3,speed:5+h*.7,life:38,size:5+h*.25,colors:cols,gravity:.06,dr:.94});
  ps.sparkleRing(x,y,color,28+hits*11);ps.ring(x,y,'#ffffff',18+hits*8);
  if(hits>=4)ps.sparkleBall(x,y,color,50+h*6,{count:18+h*4,life:50,size:6});
  if(hits>=6)for(let i=0;i<4;i++)ps.bolt(x,y,color,Math.random()*6.283,140,8)
 }
 // Verstärkter K.O. (der Siegesstoß): Glanzstern-Blitz, große Funkelkugeln wie ein Feuerwerk, Ringe, Fontäne und Glitzerregen
 ko(x,y,color){const ps=this.ps,cols=fxPal(color);
  ps.flare(x,y,'#ffffff',200,20,.3);ps.glint(x,y,'#ffffff',170,26);ps.glint(x,y,color,130,30,2);
  for(let i=0;i<4;i++){const a=i/4*6.283+Math.random()*.5,d=90+Math.random()*200;ps.glint(x+Math.cos(a)*d,y+Math.sin(a)*d*.8,i%2?color:FX_GOLD,34+Math.random()*46,14+((Math.random()*10)|0),3+i*3)}   // Blinksterne poppen nacheinander auf
  ps.spark(x,y,'#ffffff',30,15);
  ps.sparkleBall(x,y,color,230,{count:120,life:96,size:12,colors:cols});
  ps.sparkleBall(x,y,FX_GOLD,140,{count:60,life:84,size:11,colors:['#ffffff',FX_GOLD,'#ffffff',color],delay:4});
  ps.sparkleBall(x,y,'#ffffff',320,{count:50,life:112,size:10,colors:['#ffffff',color,FX_GOLD],delay:7,gravity:.05});
  ps.sparkleRing(x,y,color,300,{count:34,life:44});ps.sparkleRing(x,y,'#ffffff',190,{count:24,life:40});ps.sparkleRing(x,y,FX_GOLD,100,{count:16,life:34});
  ps.shock(x,y+80,color,440,36);ps.ring(x,y,color,220);ps.ring(x,y,'#ffffff',140);
  ps.sparkle(x,y,{count:44,speed:9,life:90,size:11,colors:cols,gravity:.09,dr:.95,angle:-Math.PI/2,spread:2.6,delay:6});                // Fontäne nach oben, fällt als Glitzer zurück
  ps.sparkle(x,y-230,{count:50,speed:.9,life:110,size:9,colors:cols,gravity:.03,dr:.99,angle:Math.PI/2,spread:.7,jx:640,jy:80,delay:34});   // Glitzerregen
  for(let i=0;i<5;i++)ps.bolt(x,y,i%2?color:'#7df9ff',i*1.257+Math.random()*.4,200+Math.random()*100,8)
 }
 // Runden-Sieg, Auftakt (Wechsel in die Siegespose): Glanzstern-Blitz, Funkelkugel, Fontäne, Glitzerregen (der Dauer-Effekt kommt aus celebrate())
 win(x,y,color){const ps=this.ps,cols=fxPal(color);
  ps.flare(x,y,'#ffffff',230,24,.1);ps.glint(x,y,'#ffffff',160,26);ps.glint(x,y,FX_GOLD,120,30,3);
  for(let i=0;i<3;i++){const a=i/3*6.283+Math.random()*.5,d=80+Math.random()*170;ps.glint(x+Math.cos(a)*d,y+Math.sin(a)*d*.9,i%2?'#ffffff':color,30+Math.random()*34,14+((Math.random()*8)|0),6+i*3)}
  ps.sparkleBall(x,y,color,210,{count:110,life:100,size:12,colors:cols});
  ps.sparkleBall(x,y,FX_GOLD,120,{count:50,life:86,size:11,colors:['#ffffff',FX_GOLD],delay:5});
  ps.sparkleRing(x,y,color,260,{count:32,life:44});ps.sparkleRing(x,y,'#ffffff',160,{count:22,life:38});ps.sparkleRing(x,GROUND-6,FX_GOLD,200,{count:26,life:44});
  ps.shock(x,GROUND,color,560,44);ps.shock(x,GROUND,'#ffffff',360,30);
  ps.sparkle(x,y,{count:50,speed:10,life:100,size:11,colors:cols,gravity:.1,dr:.95,angle:-Math.PI/2,spread:2.2,delay:8});
  ps.sparkle(x,y-250,{count:60,speed:.9,life:120,size:9,colors:cols,gravity:.03,dr:.99,angle:Math.PI/2,spread:.7,jx:760,jy:90,delay:40});
  for(let i=0;i<6;i++)ps.bolt(x,y,i*1.047,220+Math.random()*120,9)
 }
 // Sieger-Finale: Lichtsäule (Renderer), Feuerwerk, Glitzerregen, aufsteigende Funkelsterne, Glanzsterne am Körper, Funkelringe. t = Frames seit Rundenende, cam = Kamera
 celebrate(f,t,cam){const ps=this.ps,col=f.char.glow||'#fff',cols=[col,'#ffd23f','#3fe0ff','#ff4fd8','#7dffc8'],sz=f.char.size||1,pal=[col,col,'#ffffff',FX_GOLD],by=f.y-100*sz;
  if(t<240?t%32===2:t%90===2){const x=f.x+(Math.random()-.5)*620,ty=86+Math.random()*140;ps.rocket(x,GROUND,ty,cols[(Math.random()*cols.length)|0])}
  // aufsteigende Funkelsterne in der Aura
  if(t%5===0)ps.sparkle(f.x+(Math.random()-.5)*130*sz,GROUND-4-Math.random()*90*sz,{count:1,speed:1.5,life:90,size:9,colors:pal,gravity:-.035,dr:.985,angle:-Math.PI/2,spread:.7});
  // Sterne kreisen spiralförmig um den Körper
  if(t%8===0){const a=t*.13;ps.sparkle(f.x+Math.cos(a)*70*sz,by+Math.sin(a)*105*sz,{count:1,speed:.5,life:56,size:8,colors:pal,gravity:-.01,dr:.97,glint:1})}
  // Glitzerregen von oben
  if(t%10===0)ps.sparkle(f.x,70,{count:2,speed:.8,life:130,size:8,colors:[col,'#ffffff',FX_GOLD,'#7df9ff'],gravity:.025,dr:.99,angle:Math.PI/2,spread:.5,jx:900,jy:60,glint:1});
  // Blink: Glanzsterne blitzen an der Körperkontur auf
  if(t%36===6){const a=Math.random()*6.283;ps.glint(f.x+Math.cos(a)*62*sz,by+Math.sin(a)*110*sz,Math.random()<.5?'#ffffff':col,(36+Math.random()*34)*sz,15+((Math.random()*6)|0))}
  // Charakter-Aura (Renderer zeichnet die Flammen-/Blitzform): hier die passenden Partikel
  if(f.char.id==='tiger'){if(t%6===0)ps.bolt(f.x+(Math.random()-.5)*110,f.y-30-Math.random()*170*sz,Math.random()<.5?'#7df9ff':'#ffffff',Math.random()*6.283,60+Math.random()*80,6);if(t%10===0)ps.sparkle(f.x,by,{count:5,speed:6,life:30,size:8,colors:['#ffffff','#7df9ff','#3fb8ff'],gravity:0,dr:.92})}
  else if(t%8===0)ps.sparkle(f.x+(Math.random()-.5)*100,GROUND-6,{count:2,speed:3,life:64,size:8,colors:[col,'#ffe9a8','#ffffff'],gravity:-.05,dr:.98,angle:-Math.PI/2,spread:.8});
  if(t%40===8){ps.sparkleRing(f.x,GROUND-10,col,300,{count:40,life:42});ps.ring(f.x,GROUND-10,col,260);ps.shock(f.x,GROUND,col,330,30);ps.glint(f.x,by,FX_GOLD,70*sz,18);
   ps.sparkleBall(f.x,by,col,110,{count:34,life:60,size:10,colors:pal})}
 }
}
