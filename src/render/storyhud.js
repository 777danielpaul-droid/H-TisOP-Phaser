import{GROUND,H,W}from'../core/config.js';
import{LOOT}from'../core/loot.js';
import{CHAPTERS,LV,Story}from'../core/story.js';

import{Intro}from'./intro.js';
import{A}from'./rig.js';
// Story-Modus: Welt (Straße, Laternen), Lebensbalken der Mantis, HUD (Balken, Fortschritt, Wellen-Banner, Intro/Ende).
export function storyWorld(g,game,t){const x0=LV.x0-400,x1=LV.x1+400,L=(game.story&&game.story.cfg||CHAPTERS[0]).look;g.save();
 const gr=g.createLinearGradient(0,GROUND,0,GROUND+90);gr.addColorStop(0,L.ground[0]);gr.addColorStop(1,L.ground[1]);g.fillStyle=gr;g.fillRect(x0,GROUND,x1-x0,100);
 g.fillStyle=L.line;g.fillRect(x0,GROUND,x1-x0,3);g.fillStyle='rgba(255,255,255,.12)';for(let x=Math.floor(x0/160)*160;x<x1;x+=160)g.fillRect(x,GROUND+36,70,4);
 for(let x=-1200;x<=2200;x+=400){g.fillStyle='#1a1426';g.fillRect(x-3,GROUND-215,6,215);g.fillRect(x-3,GROUND-215,34,5);
  g.save();g.globalCompositeOperation='lighter';const rg=g.createRadialGradient(x+28,GROUND-208,4,x+28,GROUND-208,170);rg.addColorStop(0,`rgba(${L.lamp},.5)`);rg.addColorStop(1,`rgba(${L.lamp},0)`);g.fillStyle=rg;g.fillRect(x-150,GROUND-380,360,380);
  g.translate(x+28,GROUND+6);g.scale(1,.22);const pg=g.createRadialGradient(0,0,4,0,0,130);pg.addColorStop(0,`rgba(${L.lamp},.4)`);pg.addColorStop(1,`rgba(${L.lamp},0)`);g.fillStyle=pg;g.fillRect(-130,-130,260,260);g.restore()}
 g.restore()}
export function storyMobBars(g,game){const s=game.story;if(!s)return;
 for(const it of s.items||[]){const b=Math.sin(game.frame/12+it.x)*3,x=it.x,y=it.y+b;const pk=it.kind==='pack',c=pk?'#ffd23f':'#7dff9a';g.save();g.shadowColor=c;g.shadowBlur=14;g.fillStyle=pk?'#3a2a08':'#0b3a22';g.strokeStyle=c;g.lineWidth=2.5;g.beginPath();g.roundRect?g.roundRect(x-13,y-30,26,30,6):g.rect(x-13,y-30,26,30);g.fill();g.stroke();
  g.fillStyle=c;if(pk){g.beginPath();for(let i=0;i<10;i++){const r=i%2?4:9,a=i*Math.PI/5-Math.PI/2;g.lineTo(x+Math.cos(a)*r,y-15+Math.sin(a)*r)}g.fill()}else{g.fillRect(x-3,y-24,6,18);g.fillRect(x-9,y-18,18,6)}g.restore()}
 for(const m of s.alive()){const z=m.char.size||1,w=52*z,x=m.x-w/2,y=m.y-168*z,a=m.char.id==='mantisAlpha';if(m.char.storyBoss||(!a&&m.hp>=m.maxHp))continue;
  g.fillStyle='rgba(0,0,0,.6)';g.fillRect(x-1,y-1,w+2,7);g.fillStyle=a?'#ff7a3a':'#8dff6a';g.fillRect(x,y,w*Math.max(0,m.hp/m.maxHp),5)}}
export const bar=(g,x,y,w,h,v,c0,c1)=>{g.fillStyle='rgba(0,0,0,.6)';g.fillRect(x-2,y-2,w+4,h+4);const gr=g.createLinearGradient(x,0,x+w,0);gr.addColorStop(0,c0);gr.addColorStop(1,c1);g.fillStyle=gr;g.fillRect(x,y,w*Math.max(0,Math.min(1,v)),h)};
export function drawStoryHud(g,hud,game,t,cv){const s=game.story,p=game.p1,A=game.arcade;if(!s)return;const E=s.encs,L=s.cfg.look,ACC=L.acc;
 g.save();
 hud.txt(g,p.char.name,24,20,13,'#ffffff','left','#7fe8ff');bar(g,24,28,340,16,p.hp/p.maxHp,'#ff4a5a','#ffd23f');bar(g,24,50,200,6,p.meter/300,'#ffd23f','#ffffff');
 const wv=Math.min(s.enc+(s.state==='fight'?1:0),E.length);hud.txt(g,`KAPITEL ${s.ch}  ·  WELLE ${wv}/${E.length}`,W-24,20,13,'#ffffff','right',ACC);hud.txt(g,`BESIEGT: ${s.kills}`,W-24,40,12,'#c9d0ff','right');hud.txt(g,`BOOSTER ${LOOT.packs}  ·  COINS ${LOOT.coins}`,W-24,60,12,'#ffd23f','right');
 const px=300,pw=360,py=22;g.fillStyle='rgba(255,255,255,.25)';g.fillRect(px,py,pw,3);
 for(let i=0;i<E.length;i++){const x=px+(E[i].x-LV.start)/(LV.x1-LV.start)*pw;g.fillStyle=i<s.cp?'#7dff9a':E[i].boss?'#ff7a3a':'#ffffff';g.fillRect(x-3,py-4,6,11)}
 g.fillStyle='#7fe8ff';g.beginPath();g.arc(px+Math.max(0,Math.min(1,(p.x-LV.start)/(LV.x1-LV.start)))*pw,py+1.5,5,0,7);g.fill();
 if(s.msg){const m=s.msg,a=Math.min(1,m.t/25,(170-Math.min(170,m.t))/12+.2);g.globalAlpha=Math.max(0,Math.min(1,a));hud.txt(g,m.title,W/2,150,38,'#ffffff','center',ACC);hud.txt(g,m.say,W/2,182,16,'#e8ecff','center');g.globalAlpha=1}
 if(s.state==='walk'&&s.goT>70&&s.enc<E.length&&Math.floor(t*2)%2===0)hud.txt(g,'WEITER  ➜',W-110,250,26,'#ffffff','center',ACC);
 const bo=s.alive().find(m=>m.char.storyBoss);   // Boss-Leiste (oben Mitte): Name, Lebensbalken, Marke bei 50 % (Wutphase)
 if(bo&&game.phase==='fight'){const bw=480,bx=W/2-bw/2,by=92;hud.txt(g,bo.char.name,W/2,78,15,'#ffffff','center',bo.char.glow);bar(g,bx,by,bw,14,bo.hp/bo.maxHp,'#ff2a44','#ffb04a');g.fillStyle='rgba(255,255,255,.7)';g.fillRect(bx+bw/2-1,by-3,2,20);if(s.rage&&Math.floor(t*3)%2===0)hud.txt(g,'WUT',bx+bw+34,by+13,12,'#ff6a7a','center')}
 if(game.phase==='fight'&&s.cp===0&&s.ft<420&&s.state==='walk')hud.txt(g,'A / D laufen · W springen · J K L Angriff · U Special · O Dash',W/2,H-24,13,'#c9d0ff','center');
 if(game.phase==='intro'&&s.cp===0){const a=game.pf<190?1:Math.max(0,1-(game.pf-190)/70);g.globalAlpha=.78*a;g.fillStyle='#04020a';g.fillRect(0,0,W,H);g.globalAlpha=a;
  hud.txt(g,'KAPITEL '+s.ch,W/2,190,16,ACC,'center');hud.txt(g,s.cfg.name,W/2,240,s.cfg.name.length>14?40:50,'#ffffff','center',ACC);
  hud.txt(g,s.cfg.intro[0],W/2,290,15,'#e8ecff','center');hud.txt(g,s.cfg.intro[1],W/2,314,15,'#e8ecff','center');g.globalAlpha=1}
 if(A&&(A.state==='gameover'||A.state==='victory')){const v=A.state==='victory';g.globalAlpha=.7;g.fillStyle='#04020a';g.fillRect(0,0,W,H);g.globalAlpha=1;
  hud.txt(g,v?s.cfg.win.title:'BESIEGT',W/2,230,v&&s.cfg.win.title.length>14?46:54,'#ffffff','center',v?ACC:'#ff4a5a');
  hud.txt(g,v?s.cfg.win.say:'ENTER – weiter ab Checkpoint',W/2,280,18,'#e8ecff','center');
  if(v&&A.hasNextChapter){const nx=CHAPTERS[s.ch];hud.txt(g,`ENTER – Kapitel ${nx.id}: ${nx.name}`,W/2,318,20,'#ffffff','center',nx.look.acc)}
  hud.txt(g,'ESC – Menü'+(LOOT.packs>0?`   ·   B – Booster öffnen (${LOOT.packs})`:''),W/2,v&&A.hasNextChapter?348:308,14,'#9aa4e8','center')}
 g.restore()}
