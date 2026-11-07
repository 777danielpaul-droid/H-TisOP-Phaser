import{GROUND}from'./config.js';
// Fassade für Treffer-/Bewegungseffekte. Rendering-unabhängig: schreibt nur in das ParticleSystem.
const GLITTER_PAL=['#ffffff','#ffe27a','#7df9ff','#ff7ae6'];   // Glitzer-Farben neben der Figurenfarbe
export class Effects{
 constructor(ps){this.ps=ps}
 hit(x,y,power,color,dir){const n=7+power*5,ps=this.ps,cols=[color,...GLITTER_PAL],fwd=dir>0?0:Math.PI;
  ps.burst(x,y,{count:n,speed:5+power*2.5,color:'#ffffff',life:14,size:2.4});
  ps.burst(x,y,{count:n,speed:4+power*2,color,life:26,size:3.2,angle:fwd,spread:2.4,gravity:.12});
  ps.ring(x,y,color,30+power*16);ps.ring(x,y,'#ffffff',18+power*10);
  ps.spark(x,y,color,6+power*4,9+power*2.5);
  // Hitmarker: Zackenstern + Fadenkreuz + Flare + Schlagstreifen
  ps.starpop(x,y,color,52+power*30,8+power);ps.marker(x,y,'#ffffff',36+power*18,11);
  ps.flare(x,y,color,48+power*30,9+power*3,Math.random());
  const a0=fwd+(Math.random()-.5)*.5;ps.slash(x,y,'#ffffff',a0,80+power*50,8+power,6+power*1.6);
  for(let i=0;i<power;i++)ps.slash(x,y,i%2?color:'#fff',a0+(i+1)*.42*(i%2?1:-1),60+power*34,10,4);
  // Glitzer + Splitter + Funken, Richtung Schlag und rundherum
  ps.glitter(x,y,{count:12+power*11,speed:5+power*2.4,life:42+power*12,size:3.6+power,colors:cols,gravity:.1,angle:fwd,spread:3.6});
  ps.glitter(x,y,{count:5+power*4,speed:2.4,life:70,size:3.2,colors:cols,gravity:-.012});
  if(power>=2){for(let i=0;i<2+power;i++)ps.bolt(x,y,i%2?color:'#7df9ff',Math.random()*6.283,90+power*34,6+((Math.random()*3)|0));
   ps.burst(x,y,{count:6+power*3,speed:6+power*2,color,life:44,size:2.6,angle:fwd,spread:2.2,gravity:.32})}
  if(power>=3)ps.shock(x,y+60,color,170,22)
 }
 block(x,y,color){const ps=this.ps;ps.burst(x,y,{count:9,speed:4.5,color,life:14,size:2.2,spread:3});ps.ring(x,y,'#9bd',24);ps.marker(x,y,'#8fd4ff',34,10);ps.starpop(x,y,'#8fd4ff',44,7);ps.glitter(x,y,{count:9,speed:5,life:34,size:3,colors:['#ffffff','#8fd4ff','#bfe9ff'],gravity:.08})}
 land(x,y,big){if(big)this.ps.shock(x,y,'#b9a8ff',120,18);
  this.ps.burst(x,y-2,{count:big?14:6,speed:big?5:2.5,color:'#8a7fb8',life:22,size:3,angle:-Math.PI/2,spread:3.4,gravity:-.01,streak:.4});if(big)this.ps.glitter(x,y-4,{count:10,speed:4,life:36,size:3,colors:['#ffffff','#b9a8ff'],angle:-Math.PI/2,spread:2.6})}
 jump(x,y){this.land(x,y,false)}
 dash(x,y,dir){this.ps.burst(x,y-8,{count:6,speed:3,color:'#9a8bff',life:16,size:2.4,angle:dir>0?Math.PI:0,spread:1.2,gravity:0});this.ps.glitter(x,y-8,{count:5,speed:3.4,life:32,size:2.8,colors:GLITTER_PAL,angle:dir>0?Math.PI:0,spread:1.4,gravity:.02})}
 // Combo-Effekt: skaliert mit der Trefferzahl, farbig nach Charakter
 combo(x,y,hits,color,dir){const n=10+hits*4,ps=this.ps,h=Math.min(hits,12);
  ps.burst(x,y,{count:n,speed:6+hits*2,color:'#ffffff',life:20,size:3});
  ps.starburst(x,y,color,12+hits*4);ps.ring(x,y,color,40+hits*20);ps.ring(x,y,'#ffffff',24+hits*12);
  ps.glitter(x,y,{count:8+h*4,speed:7+h*.8,life:50,size:4,colors:[color,...GLITTER_PAL]});
  if(hits>=4)ps.starpop(x,y,color,90+h*8,10);if(hits>=6)for(let i=0;i<4;i++)ps.bolt(x,y,color,Math.random()*6.283,140,8)
 }
 // Verstärkter K.O.: Explosion aus Licht, Glitzer, Splittern und Blitzen
 ko(x,y,color){const ps=this.ps,cols=[color,...GLITTER_PAL];
  ps.flare(x,y,'#ffffff',280,24,.3);ps.shock(x,y+80,color,440,36);for(let i=0;i<8;i++)ps.slash(x,y,i%2?color:'#fff',i*.7854+.2,260,16,10);
  ps.burst(x,y,{count:60,speed:14,color:'#ffffff',life:40,size:4});ps.burst(x,y,{count:30,speed:10,color,life:45,size:3.5,angle:0,spread:3});
  ps.starburst(x,y,color,24);ps.ring(x,y,color,220);ps.ring(x,y,'#ffffff',150);ps.ring(x,y,color,90);
  ps.starpop(x,y,color,230,14);ps.marker(x,y,'#ffffff',150,16);
  ps.glitter(x,y,{count:90,speed:13,life:80,size:6,colors:cols,gravity:.07});
  for(let i=0;i<10;i++)ps.bolt(x,y,i%2?color:'#7df9ff',i*.628+Math.random()*.4,200+Math.random()*120,8)
 }
 // Runden-Sieg, Auftakt: Lichtexplosion (der Dauer-Effekt kommt aus celebrate())
 win(x,y,color){const ps=this.ps,cols=[color,...GLITTER_PAL];
  ps.flare(x,y,'#ffffff',420,30,.1);ps.shock(x,GROUND,color,560,44);ps.shock(x,GROUND,'#ffffff',360,30);
  for(const r of[90,160,240])ps.ring(x,y,r%2?'#ffffff':color,r);
  ps.glitter(x,y,{count:130,speed:12,life:100,size:6.5,colors:cols,gravity:.05});
  for(let i=0;i<12;i++)ps.bolt(x,y,i*.5236,220+Math.random()*160,9);ps.starpop(x,y,color,260,16)
 }
 // Sieger-Finale: Lichtsäule (Renderer), Feuerwerk, Glitzerregen, aufsteigende Funken, Druckwellen. t = Frames seit Rundenende, cam = Kamera
 celebrate(f,t,cam){const ps=this.ps,col=f.char.glow||'#fff',cols=[col,'#ffd23f','#3fe0ff','#ff4fd8','#7dffc8'];
  if(t<240?t%32===2:t%90===2){const x=f.x+(Math.random()-.5)*620,ty=86+Math.random()*140;ps.rocket(x,GROUND,ty,cols[(Math.random()*cols.length)|0])}
  if(t%3===0)ps.glitter(f.x+(Math.random()-.5)*130,GROUND-4,{count:2,speed:2.6,life:90,size:3.4,colors:[col,'#ffe27a','#ffffff'],gravity:-.045,angle:-Math.PI/2,spread:.9});
  if(t%40===8){ps.ring(f.x,GROUND-10,col,300);ps.shock(f.x,GROUND,col,330,30);ps.glitter(f.x,f.y-100,{count:26,speed:9,life:60,size:4.4,colors:[col,...GLITTER_PAL],gravity:.04})}
 }
}
