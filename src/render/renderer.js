import{W,H,GROUND,WORLD,WALL_L,WALL_R,BARRIER,HOUSE,EFFECT}from'../core/config.js';
import{Stage,THEMES}from'./stage.js';
import{SelectScreen}from'./select.js';
import{Hud}from'./hud.js';
import{PostFX}from'./fx.js';
import{drawFighter,drawTrail}from'./rig.js';
import{drawSpriteProjectile}from'./sprites.js';
// Render-Pipeline:  [Screen-Shake] → [Kamera-Transform: Stage, Fighter, Projektile, Partikel, Debug-Boxen] → restore → [HUD unskaliert]
export class Renderer{
 constructor(canvas){this.cv=canvas;this.g=canvas.getContext('2d');this.stages=THEMES.map(t=>new Stage(W,H,GROUND,WORLD,t));this.stage=this.stages[0];this.hud=new Hud(W,H);this.sel=new SelectScreen(this.hud);this.post=new PostFX();this.selT=0;this.scale=canvas.width/W}
 // Startmenü (Charakterwahl): Stage 1 als Hintergrund, Kamera neutral
 drawSelect(game){const g=this.g,s=this.scale,A=game.arcade;{const n=performance.now(),d=this._selLast?Math.min(3,(n-this._selLast)/16.667):1;this._selLast=n;this.selT+=d}g.setTransform(s,0,0,s,0,0);g.clearRect(0,0,W,H);
  const st=this.stages[0],T=this.selT/60;st.draw(g,T);g.fillStyle='#05020ccc';g.fillRect(0,0,W,H);this.post.beams(g,W,H,T,'#7a5cff');this.post.dust(g,W,H,T,'#c9b8ff',60,.8);st.overlay(g);this.sel.draw(g,A,this.selT,W,H);
  this.post.bloom(g,this.cv,.5);this.post.grain(g,this.cv,.06)}
 draw(game){if(game.arcade&&game.arcade.state==='select')return this.drawSelect(game);
  const g=this.g,s=this.scale,t=game.frame/60,cam=game.camera;this.stage=this.stages[(game.stageIndex||0)%this.stages.length];for(const st of this.stages)if(st!==this.stage&&st!==this.stages[0])st.cache=null; // Speicher sparen: nur aktuelles Level + Menü-Hintergrund halten
  g.setTransform(s,0,0,s,0,0);g.clearRect(0,0,W,H);
  g.save();                                              // --- Screen-Space: Shake ---
  g.translate((game.kickX||0)+(game.shake>0?(Math.random()-.5)*game.shake*1.6:0),(game.kickY||0)+(game.shake>0?(Math.random()-.5)*game.shake*1.6:0));
  g.save();cam.apply(g);                                 // --- Welt: alles unter derselben Kamera-Matrix ---
  this.stage.draw(g,t);this.house(g,game,t);
  for(const f of game.fighters)this.post.floorGlow(g,f,GROUND,t);
  this.celeb(g,game);
  for(const f of game.fighters)drawTrail(g,f,t);
  for(const f of[...game.fighters].sort((a,b)=>(a.state==='ko'||a.state==='knockdown'?-1:0)-(b.state==='ko'||b.state==='knockdown'?-1:0)||a.y-b.y))drawFighter(g,f,t,1,GROUND);
  for(const p of game.projectiles)this.projectile(g,p,p.owner);
  game.particles.draw(g);
  if(game.debug)this.debugBoxes(g,game);                 // Kollisionsboxen skalieren mit der Welt
  g.restore();g.restore();                               // --- zurück in den Screen-Space ---
  if(game.flash>0){const a=game.flash/EFFECT.screenFlash;g.save();g.fillStyle=game.flashColor;g.globalAlpha=.45*a;g.fillRect(0,0,W,H);g.restore()}
  this.post.scene(g,this.cv,game,game.frame);this.post.impact(g,game);
  this.post.dust(g,W,H,t,'#cdbbff',26,.6);
  if(game.phase==='intro'&&game.pf<26){g.save();g.globalAlpha=1-game.pf/26;g.fillStyle='#000';g.fillRect(0,0,W,H);g.restore()}   // Einblenden aus Schwarz
  this.stage.overlay(g);this.hud.draw(g,game);this.hud.flash(g,game);this.areaBanner(g,game,t);   // HUD/UI: unskaliert und scharf
  if(game.debug)this.debugText(g,game)}
 // Sieger-Finale: Lichtsäule + rotierende Strahlen hinter dem Gewinner (additiv, Welt-Raum)
 celeb(g,game){const c=game.celeb;if(!c)return;const f=c.f,col=f.char.glow||'#fff',k=Math.min(1,c.t/26),T=c.t/60,cx=f.x,cy=f.y-100;
  g.save();g.globalCompositeOperation='lighter';
  for(let i=0;i<18;i++){const a=T*.35+i*(Math.PI*2/18),w=.05+.02*Math.sin(T*3+i);g.globalAlpha=k*(i%2?.2:.12);g.fillStyle=i%3?col:'#ffd23f';g.beginPath();g.moveTo(cx,cy);g.arc(cx,cy,1300,a-w,a+w);g.fill()}
  const pw=90+Math.sin(T*5)*10,gr=g.createLinearGradient(cx-pw,0,cx+pw,0);gr.addColorStop(0,col+'00');gr.addColorStop(.35,col+'55');gr.addColorStop(.5,'#ffffffbb');gr.addColorStop(.65,col+'55');gr.addColorStop(1,col+'00');g.globalAlpha=k*.75;g.fillStyle=gr;g.fillRect(cx-pw,cy-1000,pw*2,GROUND-cy+1000);
  const rg=g.createRadialGradient(cx,cy,10,cx,cy,260);rg.addColorStop(0,'#ffffffcc');rg.addColorStop(.3,col+'66');rg.addColorStop(1,col+'00');g.globalAlpha=k*(.8+.2*Math.sin(T*6));g.fillStyle=rg;g.fillRect(cx-260,cy-260,520,520);g.restore()}
 // ---- Gasse zwischen zwei Hochhäusern: links Spielhalle, rechts Lobby. Fassaden reichen bis über den Bildrand, Erdgeschoss-Wand brechbar ----
 // Statische Ebenen (obere Fassade, Erdgeschoss-Fassade, Innenraum) werden je Level-Theme und Seite einmal in Offscreen-Canvas gezeichnet.
 houseLayers(T,side){const k=T.name+side;this._hl=this._hl||{};if(this._hl[k])return this._hl[k];
  for(const o in this._hl)if(!o.startsWith(T.name))delete this._hl[o];                                  // nur das aktuelle Level im Speicher halten
  const isR=side==='R',BW=BARRIER.width,top=HOUSE.top,bot=498,fl=GROUND-14,S=1.5;
  const X0=isR?WALL_R+12:WALL_L-BW,X1=isR?WALL_R+BW:WALL_L-12;                                              // Innenraum von X0 bis X1
  const sa=isR?X0:X0-24,sb=isR?X1+24:X1,ew=isR?X0:X1,dir=isR?1:-1,mid=(X0+X1)/2,OX=sa-40,Wd=sb-sa+80;        // sa..sb = Gebäudehülle inkl. Rückwand, ew = Wand zur Gasse
  let sd=T.seed*97+(isR?13:57);const R=()=>(sd=(sd*16807)%2147483647)/2147483647;
  const mk=(oy,h,fn)=>{const c=document.createElement('canvas');c.width=Math.round(Wd*S);c.height=Math.round(h*S);const g=c.getContext('2d');g.scale(S,S);g.translate(-OX,-oy);fn(g);return{c,oy,h}};
  const glowRect=(g,x,y,w,h,col,bl,lw=2)=>{g.save();g.shadowColor=col;g.shadowBlur=bl;g.strokeStyle=col;g.lineWidth=lw;g.strokeRect(x,y,w,h);g.restore()};
  const edge=(g,y0,y1)=>{g.save();g.shadowColor=T.line;g.shadowBlur=14;g.strokeStyle=T.line;g.lineWidth=3;g.beginPath();g.moveTo(ew,y0);g.lineTo(ew,y1);g.stroke();g.restore()};
  const plant=(g,x,y,sc)=>{g.fillStyle='#3a2420';g.beginPath();g.moveTo(x-12*sc,y-26*sc);g.lineTo(x+12*sc,y-26*sc);g.lineTo(x+8*sc,y);g.lineTo(x-8*sc,y);g.fill();
   for(let i=0;i<9;i++){const a=-Math.PI/2+(i-4)*.32,l=(40+R()*34)*sc;g.strokeStyle=i%2?'#2f8a52':'#46b86a';g.lineWidth=7*sc;g.lineCap='round';g.beginPath();g.moveTo(x,y-26*sc);g.quadraticCurveTo(x+Math.cos(a)*l*.5,y-26*sc+Math.sin(a)*l*.7,x+Math.cos(a)*l,y-26*sc+Math.sin(a)*l);g.stroke()}};
  const night=(g,wx,wy,ww,wh)=>{const sk=g.createLinearGradient(0,wy,0,wy+wh);sk.addColorStop(0,T.sky[1]);sk.addColorStop(.6,T.sky[3]);sk.addColorStop(1,T.sky[2]);g.fillStyle=sk;g.fillRect(wx,wy,ww,wh);
   for(let x=wx;x<wx+ww;x+=14){const bh=18+R()*50;g.fillStyle='#050208';g.fillRect(x,wy+wh-bh,12,bh);g.fillStyle=T.lights[1];g.globalAlpha=.7;g.fillRect(x+3,wy+wh-bh+6,2,3);g.globalAlpha=1}
   g.fillStyle=T.moon[0];g.globalAlpha=.8;g.beginPath();g.arc(wx+ww*.75,wy+24,10,0,7);g.fill();g.globalAlpha=1;g.strokeStyle='#1a0f14';g.lineWidth=6;g.strokeRect(wx,wy,ww,wh);g.lineWidth=3;g.beginPath();g.moveTo(wx+ww/3,wy);g.lineTo(wx+ww/3,wy+wh);g.moveTo(wx+ww*2/3,wy);g.lineTo(wx+ww*2/3,wy+wh);g.stroke()};
  const glow=(g,x,y,r,col)=>{g.save();g.globalCompositeOperation='lighter';const lg=g.createRadialGradient(x,y,4,x,y,r);lg.addColorStop(0,col);lg.addColorStop(1,'#0000');g.fillStyle=lg;g.fillRect(x-r,y-r,r*2,r*2);g.restore()};
  const neon=(g,x,y,w,h,txt,col,fs=17)=>{g.save();g.shadowColor=col;g.shadowBlur=14;g.strokeStyle=col;g.lineWidth=2.2;g.strokeRect(x,y,w,h);g.fillStyle=col;g.font=`bold ${fs}px "Courier New",monospace`;g.textAlign='center';g.fillText(txt,x+w/2,y+h/2+fs*.35);g.restore()};
  // --- Obere Fassade (Stockwerke bis weit über den Bildrand) ---
  const upper=mk(-420,top+420,g=>{const yT=-420;
   const bg=g.createLinearGradient(0,yT,0,top);bg.addColorStop(0,'#120d1a');bg.addColorStop(1,'#241b2e');g.fillStyle=bg;g.fillRect(sa,yT,sb-sa,top-yT);
   const pitch=120;for(let fy=top-20;fy>yT-60;fy-=pitch){
    g.fillStyle='#1a1422';g.fillRect(sa,fy-14,sb-sa,16);g.fillStyle=T.line+'33';g.fillRect(sa,fy-14,sb-sa,2);
    for(let x=X0+20;x<X1-40;x+=56){const wy=fy-pitch+30,lit=R()<.5,col=['#ffe3a0','#ffd27a',T.lights[1],'#bfe9ff'][(R()*4)|0];
     if(lit){g.save();g.shadowColor=col;g.shadowBlur=14;g.fillStyle=col;g.globalAlpha=.55+R()*.4;g.fillRect(x,wy,34,62);g.restore();g.fillStyle='#00000030';g.fillRect(x,wy,34,18)}
     else{const wg=g.createLinearGradient(x,wy,x+34,wy+62);wg.addColorStop(0,'#1c1830');wg.addColorStop(.5,'#0c0914');wg.addColorStop(1,'#16122a');g.fillStyle=wg;g.fillRect(x,wy,34,62);g.fillStyle='#ffffff10';g.beginPath();g.moveTo(x,wy+40);g.lineTo(x+22,wy);g.lineTo(x+34,wy);g.lineTo(x+8,wy+62);g.lineTo(x,wy+62);g.fill()}
     g.strokeStyle='#0a0710';g.lineWidth=3;g.strokeRect(x,wy,34,62);g.lineWidth=1.5;g.beginPath();g.moveTo(x+17,wy);g.lineTo(x+17,wy+62);g.stroke();
     g.fillStyle='#1a1422';g.fillRect(x-3,wy+62,40,4)}}
   for(let x=X0+2;x<X1+24;x+=224){g.fillStyle='#17111f';g.fillRect(x,yT,12,top-yT);g.fillStyle=T.line+'22';g.fillRect(x+10,yT,2,top-yT)}
   const fade=g.createLinearGradient(0,top,0,yT);fade.addColorStop(0,'#0000');fade.addColorStop(1,'#000000aa');g.fillStyle=fade;g.fillRect(sa,yT,sb-sa,top-yT);
   g.fillStyle='#0a0710';g.fillRect(isR?sb-10:sa,yT,10,top-yT);edge(g,yT,top);
   g.fillStyle='#0c0812';g.fillRect(sa,top-22,sb-sa,24);g.fillStyle=T.line+'55';g.fillRect(sa,top-3,sb-sa,3)});                                      // Deckenplatte über dem Erdgeschoss
  // --- Erdgeschoss-Fassade (die brechbare Wand) ---
  const ground=mk(top,bot-top+14,g=>{const wg=g.createLinearGradient(0,top,0,bot);wg.addColorStop(0,isR?'#2e2639':'#262040');wg.addColorStop(1,isR?'#1b1524':'#141028');g.fillStyle=wg;g.fillRect(sa,top,sb-sa,bot-top);
   g.strokeStyle='#00000055';g.lineWidth=1.5;for(let y=top+70;y<bot;y+=70){g.beginPath();g.moveTo(sa,y);g.lineTo(sb,y);g.stroke()}
   for(let x=X0+90;x<sb;x+=90){g.beginPath();g.moveTo(x,top);g.lineTo(x,bot);g.stroke()}
   for(let y=top+70;y<bot;y+=70)for(let x=X0+90;x<sb;x+=90){g.fillStyle='#ffffff0c';g.fillRect(x-3,y-3,2,2)}
   g.fillStyle=T.lights[isR?0:2]+'1c';g.fillRect(sa,top,sb-sa,bot-top);
   const c0=isR?['#ffe9b8','#ff9a3a','#ffb347']:['#e4d6ff','#7a4cff','#b46cff'];
   for(const off of[-290,-185,185,290]){const wx=mid+off-42,wy=top+34,ww=84,wh=170,gg=g.createLinearGradient(0,wy,0,wy+wh);gg.addColorStop(0,c0[0]);gg.addColorStop(1,c0[1]);                  // Fenster, von innen beleuchtet
    g.save();g.shadowColor=c0[2];g.shadowBlur=28;g.fillStyle=gg;g.fillRect(wx,wy,ww,wh);g.restore();g.fillStyle='#00000040';g.fillRect(wx,wy,ww,wh*.25);
    g.strokeStyle='#120a18';g.lineWidth=6;g.strokeRect(wx,wy,ww,wh);g.lineWidth=3;g.beginPath();g.moveTo(wx+ww/2,wy);g.lineTo(wx+ww/2,wy+wh);g.moveTo(wx,wy+wh*.38);g.lineTo(wx+ww,wy+wh*.38);g.stroke();g.fillStyle='#241830';g.fillRect(wx-8,wy+wh,ww+16,8)}
   const dw=110,dx=mid-dw/2,dy=bot-150,sc=isR?T.lights[1]:T.lights[2];g.fillStyle='#0d0713';g.fillRect(dx,dy,dw,150);const dg=g.createLinearGradient(0,dy,0,bot);dg.addColorStop(0,T.line+'55');dg.addColorStop(1,T.line+'11');g.fillStyle=dg;g.fillRect(dx+6,dy+6,dw/2-9,138);g.fillRect(dx+dw/2+3,dy+6,dw/2-9,138);glowRect(g,dx,dy,dw,150,T.line,12);
   g.fillStyle=sc;g.fillRect(dx+dw/2-9,dy+70,4,22);g.fillRect(dx+dw/2+5,dy+70,4,22);
   g.fillStyle='#0c0812';g.beginPath();g.moveTo(dx-26,dy-6);g.lineTo(dx+dw+26,dy-6);g.lineTo(dx+dw+16,dy-30);g.lineTo(dx-16,dy-30);g.fill();g.fillStyle=sc;g.fillRect(dx-26,dy-8,dw+52,3);
   neon(g,mid-90,dy-80,180,34,isR?'GRAND TOWER':'GAME CENTER',sc,isR?20:19);
   g.fillStyle='#0a0610';g.fillRect(sa-4,bot-10,sb-sa+8,14);edge(g,top,bot)});
  // --- Innenraum: Gemeinsames (Wand, Decke, Boden, Rückwand), danach rechts Lobby / links Spielhalle ---
  const inner=mk(top-20,540-top+20,g=>{
   const wg=g.createLinearGradient(0,top,0,fl);if(isR){wg.addColorStop(0,'#2b2236');wg.addColorStop(1,'#43293b')}else{wg.addColorStop(0,'#150f2a');wg.addColorStop(1,'#2a1546')}g.fillStyle=wg;g.fillRect(sa,top,sb-sa,fl-top);
   if(isR){for(let x=X0;x<X1;x+=70){g.fillStyle=((x-X0)/70)%2?'#ffffff08':'#00000014';g.fillRect(x,top+18,70,fl-top-18);g.fillStyle='#0000004a';g.fillRect(x,top+18,1.5,fl-top-18)}}
   else{for(let x=X0;x<X1;x+=46){g.fillStyle=T.lights[((x-X0)/46|0)%3]+'0e';g.fillRect(x,top+18,22,fl-top-18)}}
   g.fillStyle='#120b18';g.fillRect(sa,top-20,sb-sa,HOUSE.ceil-top+20);g.fillStyle=T.line+'55';g.fillRect(sa,HOUSE.ceil-2,sb-sa,2);
   if(isR){for(let x=X0+40;x<X1-60;x+=130){g.save();g.shadowColor='#ffeab0';g.shadowBlur=18;g.fillStyle='#fff3cc';g.fillRect(x,top+8,80,6);g.restore();
     g.save();g.globalCompositeOperation='lighter';const cg=g.createLinearGradient(0,top+14,0,fl);cg.addColorStop(0,'#ffe9b033');cg.addColorStop(1,'#0000');g.fillStyle=cg;g.beginPath();g.moveTo(x,top+14);g.lineTo(x+80,top+14);g.lineTo(x+130,fl);g.lineTo(x-50,fl);g.fill();g.restore()}}
   else{for(let i=0;i<4;i++){const col=T.lights[i%3],y=top+6+i*3;g.save();g.shadowColor=col;g.shadowBlur=16;g.strokeStyle=col;g.lineWidth=3;g.beginPath();g.moveTo(X0+30,y);g.lineTo(X1-30,y);g.stroke();g.restore()}}   // Neonröhren unter der Decke
   g.fillStyle=isR?'#1b1018':'#0e0a1c';g.fillRect(sa,fl-78,sb-sa-(isR?0:0),78);g.fillStyle=isR?'#b88a52':T.line;g.fillRect(X0,fl-80,X1-X0,4);g.fillStyle='#ffffff14';g.fillRect(X0,fl-76,X1-X0,2);
   const fg=g.createLinearGradient(0,fl,0,540);fg.addColorStop(0,isR?'#3a3042':'#1a1030');fg.addColorStop(1,isR?'#15101c':'#08040f');g.fillStyle=fg;g.fillRect(sa,fl,sb-sa,540-fl);
   if(isR){let ry=fl,row=0;for(const rh of[10,13,16,20,25]){for(let x=X0-(row%2?32:0);x<sb;x+=64){if(((x-X0)/64+row)%2===0){g.fillStyle='#ffffff10';g.fillRect(Math.max(x,X0),ry,Math.min(64,sb-Math.max(x,X0)),rh)}}ry+=rh;row++}}   // Marmor-Schachbrett
   else{g.strokeStyle=T.grid;g.globalAlpha=.3;g.lineWidth=1;for(let x=X0-200;x<X1+200;x+=44){g.beginPath();g.moveTo(mid+(x-mid)*.3,fl);g.lineTo(x,540);g.stroke()}for(let k=0;k<5;k++){const y=fl+Math.pow(k/5,1.5)*84+4;g.beginPath();g.moveTo(sa,y);g.lineTo(sb,y);g.stroke()}g.globalAlpha=1;     // Neon-Gitter-Teppich
    for(let i=0;i<70;i++){g.fillStyle=T.lights[i%3];g.globalAlpha=.4;g.fillRect(X0+R()*(X1-X0),fl+6+R()*70,3,2)}g.globalAlpha=1}
   g.strokeStyle='#00000040';g.lineWidth=1;for(let y=fl;y<540;y+=14){g.beginPath();g.moveTo(sa,y);g.lineTo(sb,y);g.stroke()}
   if(isR){ // ===== Lobby =====
    for(const px of[X0+238]){const pg=g.createLinearGradient(px,0,px+34,0);pg.addColorStop(0,'#6a5868');pg.addColorStop(.5,'#8a7888');pg.addColorStop(1,'#2e2434');g.fillStyle=pg;g.fillRect(px,top+18,34,fl-top-18);g.fillStyle='#b88a52';g.fillRect(px-5,top+18,44,8);g.fillRect(px-5,fl-14,44,14)}
    const ew3=58,ex=X0+298;g.fillStyle='#120a14';g.fillRect(ex-12,fl-148,ew3*3+40,148);                                                                       // Aufzugbank
    for(let i=0;i<3;i++){const x=ex+i*(ew3+8),mg=g.createLinearGradient(x,0,x+ew3,0);mg.addColorStop(0,'#5a5a68');mg.addColorStop(.48,'#a4a4b4');mg.addColorStop(.52,'#6a6a78');mg.addColorStop(1,'#4a4a58');g.fillStyle=mg;g.fillRect(x,fl-120,ew3,120);
     g.fillStyle='#00000066';g.fillRect(x+ew3/2-1,fl-120,2,120);g.fillStyle='#050208';g.fillRect(x+ew3/2-14,fl-138,28,12);g.fillStyle=i===1?'#ff3a3a':'#ffb347';g.font='bold 10px "Courier New",monospace';g.textAlign='center';g.fillText(String(1+i*3),x+ew3/2,fl-129);
     g.fillStyle=T.lights[1];g.beginPath();g.arc(x+ew3+4,fl-60,2.4,0,7);g.fill()}
    const cx=ex+95,cy=top+58;g.fillStyle='#1a0f14';g.beginPath();g.arc(cx,cy,26,0,7);g.fill();g.fillStyle='#f3ead2';g.beginPath();g.arc(cx,cy,22,0,7);g.fill();g.strokeStyle='#222';g.lineWidth=2;g.beginPath();g.moveTo(cx,cy);g.lineTo(cx+8,cy-10);g.moveTo(cx,cy);g.lineTo(cx-3,cy+15);g.stroke();for(let i=0;i<12;i++){const a=i/12*6.283;g.fillRect(cx+Math.cos(a)*19-1,cy+Math.sin(a)*19-1,2,2)}
    g.save();g.shadowColor=T.lights[2];g.shadowBlur=12;g.fillStyle=T.lights[2];g.font='bold 13px "Courier New",monospace';g.textAlign='center';g.fillText('AUFZÜGE',cx,fl-156);g.restore();
    const sx0=X0+40;g.fillStyle='#4a2430';g.beginPath();g.roundRect?g.roundRect(sx0,fl-52,150,52,10):g.rect(sx0,fl-52,150,52);g.fill();g.fillStyle='#5c2e3c';g.fillRect(sx0+8,fl-70,134,26);g.fillRect(sx0-6,fl-52,14,52);g.fillRect(sx0+142,fl-52,14,52);   // Sofa
    g.fillStyle='#00000040';g.fillRect(sx0+75,fl-70,2,22);g.fillStyle='#2a1810';g.fillRect(sx0+40,fl+2,70,8);g.fillStyle='#d9b36a';g.fillRect(sx0+50,fl-8,50,4);
    for(const[px,py,c]of[[X0+60,top+70,T.lights[0]],[X0+130,top+86,T.lights[2]]]){g.fillStyle='#1a0f14';g.fillRect(px-3,py-3,58,66);g.fillStyle=c+'55';g.fillRect(px,py,52,60);g.strokeStyle=c;g.lineWidth=1.5;g.strokeRect(px+7,py+7,38,46)}
    plant(g,X0+222,fl,1.25);plant(g,ex+214,fl,1.05);
    const dx0=X1-170,dw=150;g.fillStyle='#2a1810';g.fillRect(dx0,fl-62,dw,62);g.fillStyle='#b88a52';g.fillRect(dx0-6,fl-68,dw+12,8);g.fillStyle='#00000040';for(let x=dx0+10;x<dx0+dw-6;x+=30)g.fillRect(x,fl-54,22,46);   // Empfang
    g.fillStyle='#111';g.fillRect(dx0+34,fl-92,34,22);g.fillStyle=T.lights[1]+'cc';g.fillRect(dx0+37,fl-89,28,16);g.fillStyle='#222';g.fillRect(dx0+48,fl-70,6,4);
    g.fillStyle='#d9b36a';g.beginPath();g.moveTo(dx0+108,fl-96);g.lineTo(dx0+124,fl-96);g.lineTo(dx0+130,fl-74);g.lineTo(dx0+102,fl-74);g.fill();g.fillStyle='#4a3a2a';g.fillRect(dx0+114,fl-74,4,6);
    glow(g,dx0+116,fl-88,150,'#ffcf7a66');neon(g,dx0+10,top+84,130,30,'EMPFANG',T.lights[1]);
    if(X1-X0>800){const s2=X0+560;g.fillStyle='#24304a';g.beginPath();g.roundRect?g.roundRect(s2,fl-52,150,52,10):g.rect(s2,fl-52,150,52);g.fill();g.fillStyle='#2e3c5c';g.fillRect(s2+8,fl-70,134,26);g.fillRect(s2-6,fl-52,14,52);g.fillRect(s2+142,fl-52,14,52);   // zweite Sitzgruppe
     g.fillStyle='#00000040';g.fillRect(s2+75,fl-70,2,22);g.fillStyle='#2a1810';g.fillRect(s2+48,fl-14,54,14);g.fillStyle='#d9b36a';g.fillRect(s2+44,fl-18,62,4);
     for(const[px,py,c]of[[s2+30,top+66,T.lights[2]],[s2+96,top+80,T.lights[0]]]){g.fillStyle='#1a0f14';g.fillRect(px-3,py-3,58,66);g.fillStyle=c+'55';g.fillRect(px,py,52,60);g.strokeStyle=c;g.lineWidth=1.5;g.strokeRect(px+7,py+7,38,46)}
     plant(g,s2+176,fl,1.15);plant(g,X0+790,fl,.95);neon(g,s2+5,top+168,140,28,'LOUNGE',T.lights[0],15)}
    g.fillStyle=T.lights[0]+'55';g.beginPath();g.ellipse(mid,GROUND+24,190,22,0,0,7);g.fill();g.strokeStyle=T.lights[0];g.lineWidth=2;g.beginPath();g.ellipse(mid,GROUND+24,160,16,0,0,7);g.stroke()}
   else{ // ===== Spielhalle =====
    const cab=(x,col,i)=>{const w=58,h=128,y=fl-h;const bg=g.createLinearGradient(x,0,x+w,0);bg.addColorStop(0,'#1c1430');bg.addColorStop(.5,'#2e2250');bg.addColorStop(1,'#120c22');g.fillStyle=bg;g.fillRect(x,y,w,h);
     g.save();g.shadowColor=col;g.shadowBlur=12;g.fillStyle=col;g.fillRect(x+4,y+4,w-8,14);g.restore();g.fillStyle='#000000aa';g.font='bold 8px "Courier New",monospace';g.textAlign='center';g.fillText(['PAC','FIGHT','RACE','SPACE','KO!!','HYPER'][i%6],x+w/2,y+14);
     g.fillStyle='#050208';g.fillRect(x+8,y+24,w-16,38);const sg=g.createLinearGradient(0,y+26,0,y+60);sg.addColorStop(0,col+'cc');sg.addColorStop(1,col+'33');g.fillStyle=sg;g.fillRect(x+10,y+26,w-20,34);
     g.fillStyle='#050208';for(let k=0;k<5;k++)g.fillRect(x+13+R()*(w-30),y+30+R()*24,5,5);
     g.fillStyle='#17102a';g.beginPath();g.moveTo(x+4,y+70);g.lineTo(x+w-4,y+70);g.lineTo(x+w-1,y+86);g.lineTo(x+1,y+86);g.fill();g.fillStyle='#d33';g.beginPath();g.arc(x+16,y+77,4,0,7);g.fill();g.fillStyle=col;for(let b=0;b<3;b++){g.beginPath();g.arc(x+30+b*9,y+78,3,0,7);g.fill()}
     g.fillStyle='#0c0718';g.fillRect(x+6,y+90,w-12,h-90);g.fillStyle=col+'44';g.fillRect(x+10,y+98,w-20,4);glow(g,x+w/2,y+44,70,col+'44');glow(g,x+w/2,fl+8,50,col+'22')};
    let n=0;for(let x=X0+40;x<X1-250;x+=74)cab(x,T.lights[n%3],n++);
    const kx=X1-230,kw=96,ky=fl-160;g.fillStyle='#1a1230';g.fillRect(kx,ky,kw,160);g.fillStyle='#8fd8ff22';g.fillRect(kx+6,ky+16,kw-12,100);g.strokeStyle='#a8e4ff';g.lineWidth=2;g.strokeRect(kx+6,ky+16,kw-12,100);       // Greifautomat
    for(let i=0;i<10;i++){g.fillStyle=`hsl(${R()*360},70%,60%)`;g.beginPath();g.arc(kx+16+R()*(kw-32),ky+96+R()*12,8+R()*4,0,7);g.fill()}
    g.strokeStyle='#ccc';g.lineWidth=2;g.beginPath();g.moveTo(kx+50,ky+16);g.lineTo(kx+50,ky+56);g.moveTo(kx+42,ky+62);g.lineTo(kx+50,ky+56);g.lineTo(kx+58,ky+62);g.stroke();g.fillStyle=T.lights[0];g.fillRect(kx+6,ky+120,kw-12,20);glow(g,kx+kw/2,ky+60,90,'#8fd8ff33');
    const hx=mid-30,hy=top+36;g.fillStyle='#07040f';g.fillRect(hx,hy,220,74);glowRect(g,hx,hy,220,74,T.lights[1],12);g.save();g.shadowColor=T.lights[1];g.shadowBlur=10;g.fillStyle=T.lights[1];g.font='bold 14px "Courier New",monospace';g.textAlign='center';g.fillText('HIGH SCORE',hx+110,hy+20);   // Highscore-Tafel
    g.fillStyle='#ffd23f';g.font='bold 12px "Courier New",monospace';['1. WOLF   999999','2. TIGER  845200','3. HERO   760100'].forEach((l,i)=>g.fillText(l,hx+110,hy+38+i*14));g.restore();
    neon(g,X0+80,top+50,150,30,'INSERT COIN',T.lights[2],16);neon(g,X0+190,top+92,110,28,'FREE PLAY',T.lights[0],15);
    if(X1-X0>800){neon(g,X0+340,top+62,110,28,'TOKENS',T.lights[1],15);neon(g,X0+700,top+66,130,28,'2 PLAYER',T.lights[0],15);neon(g,X0+500,top+128,120,26,'HYPER!',T.lights[2],15)}
    const cx0=X1-140,cw=120;g.fillStyle='#2a1a40';g.fillRect(cx0,fl-64,cw,64);g.fillStyle=T.line;g.fillRect(cx0-5,fl-70,cw+10,6);g.fillStyle='#00000055';for(let x=cx0+8;x<cx0+cw-8;x+=28)g.fillRect(x,fl-54,20,44);   // Preis-Tresen
    for(let i=0;i<4;i++){g.fillStyle=`hsl(${i*80+20},65%,55%)`;g.beginPath();g.arc(cx0+20+i*26,fl-84,11,0,7);g.fill();g.fillStyle='#fff';g.fillRect(cx0+16+i*26,fl-86,2,2);g.fillRect(cx0+22+i*26,fl-86,2,2)}neon(g,cx0+4,top+110,112,26,'PREISE',T.lights[1],15);
    for(let i=0;i<3;i++){g.fillStyle='#7a2a5a';g.fillRect(mid-200+i*70,fl-30,5,30);g.fillStyle='#c4468f';g.beginPath();g.ellipse(mid-197+i*70,fl-32,17,6,0,0,7);g.fill()}                       // Hocker
    plant(g,X0+30,fl,1.2);glow(g,mid,fl+10,260,T.lights[0]+'18')}
   const vg=g.createLinearGradient(sa,0,sb,0);vg.addColorStop(0,'#000000aa');vg.addColorStop(.1,'#0000');vg.addColorStop(.9,'#0000');vg.addColorStop(1,'#000000bb');g.fillStyle=vg;g.fillRect(sa,top-20,sb-sa,540-top+20);
   const rx=isR?X1:X0-24,rw=g.createLinearGradient(rx,0,rx+24,0);rw.addColorStop(isR?0:1,'#3a2a3c');rw.addColorStop(isR?1:0,'#16101c');g.fillStyle=rw;g.fillRect(rx,top-20,24,540-top+20);                       // Rückwand (unzerstörbar)
   g.strokeStyle='#00000066';for(let y=top;y<540;y+=11){g.beginPath();g.moveTo(rx,y);g.lineTo(rx+24,y);g.stroke()}});
  return this._hl[k]={OX,Wd,upper,ground,inner,X0,X1,ew,dir,top,bot}}
 house(g,game,t){for(const side of['L','R'])this.houseSide(g,game,side)}
 houseSide(g,game,side){const A=game.arena,L=this.houseLayers(this.stage.theme,side),w=A[side],open=w.step>0,oT=A.openT[side],d=L.dir,draw=l=>g.drawImage(l.c,L.OX,l.oy,L.Wd,l.h);
  if(open)draw(L.inner);
  const fa=open?Math.max(0,1-oT/20):1;
  if(fa>0){g.save();g.globalAlpha=fa;draw(L.ground);
   if(!open){const dmg=1-w.hp/w.max,n=Math.floor(dmg*12);let h=side==='L'?7:0;for(const c of this.stage.theme.name)h=(h*31+c.charCodeAt(0))|0;            // Risse + Treffer-Blitz an der Wand
    const rn=(i,k)=>{const v=Math.sin((h+i*131+k*977)*12.9898)*43758.5453;return v-Math.floor(v)};g.lineCap='round';g.lineJoin='round';
    for(let i=0;i<n;i++){let cx=L.ew+d*(4+rn(i,1)*80),cy=L.top+80+rn(i,2)*(L.bot-L.top-150);g.beginPath();g.moveTo(cx,cy);
     for(let k=0;k<4;k++){cx+=(rn(i,3+k)-.5)*24;cy+=8+rn(i,9+k)*18;cx=d>0?Math.max(L.ew+1,cx):Math.min(L.ew-1,cx);g.lineTo(cx,cy)}g.strokeStyle='#050309';g.lineWidth=2.8;g.stroke();g.strokeStyle='#ffffff40';g.lineWidth=.9;g.stroke()}
    if(w.flash>0){g.globalCompositeOperation='lighter';g.fillStyle='#fff';g.globalAlpha=w.flash/8*.55;g.fillRect(d>0?L.ew:L.ew-80,L.top,80,L.bot-L.top)}}
   g.restore()}
  draw(L.upper);
  if(open){g.save();g.fillStyle='#2a1c26';const R=i=>{const v=Math.sin(i*78.233)*43758.5453;return v-Math.floor(v)};                                  // Trümmer an der Bresche
   g.beginPath();g.moveTo(L.ew-d*8,L.top-2);for(let i=0;i<7;i++)g.lineTo(L.ew+d*(4+R(i)*20),L.top+8+i*10);g.lineTo(L.ew-d*8,L.top+78);g.fill();
   g.fillStyle='#4a3238';for(let i=0;i<18;i++){const wd=6+R(i+5)*14;g.fillRect(d>0?L.ew-40+R(i+9)*110:L.ew+40-R(i+9)*110-wd,GROUND+2-R(i+3)*16,wd,5+R(i+7)*9)}g.restore()}
  if(w.show>0&&!w.final&&!open){const a=Math.min(1,w.show/40),bw=64,f=Math.max(0,w.hp/w.max),bx=L.ew+d*40;g.save();g.globalAlpha=a;g.fillStyle='#000a';g.fillRect(bx-bw/2-1,L.top+46,bw+2,9);
   g.fillStyle=f>.5?'#ffd23f':f>.25?'#ff9a3a':'#ff3a3a';g.fillRect(bx-bw/2,L.top+47,bw*f,7);g.restore()}}
 // Banner nach dem Durchbruch (Bildschirmraum)
 areaBanner(g,game,t){const m=game.arena.msg;if(!m)return;const a=Math.min(1,m.t/30)*Math.min(1,(170-m.t)/8+.2);
  g.save();g.globalAlpha=Math.max(0,a);this.hud.fancy(g,'DURCH DIE WAND!',W/2,200,34,['#ffffff','#ffd9a0'],'center','#ffb347',t,false,false,700,5);
  const ex=m.dir>0?W-56:56,p=.6+.4*Math.sin(t*10);g.globalAlpha=Math.max(0,a)*p;this.hud.fancy(g,m.dir>0?'»»':'««',ex,282,46,['#ffffff','#ffb347'],'center','#ffb347',t,false,false,700,0);g.restore()}
 look(g,p,col){const L=p.def.look,t=p.age;g.save();g.translate(p.x,p.y);g.globalCompositeOperation='lighter';
  if(L==='bolt'){const h=p.h/2,k=Math.min(1,t/3);g.strokeStyle='#fff';g.shadowColor=col;g.shadowBlur=24;g.lineWidth=7*k;g.beginPath();g.moveTo(0,-h);
   for(let i=1;i<=7;i++)g.lineTo(((i*53+t*17)%30)-15,-h+i*h*2/7);g.stroke();g.strokeStyle=col;g.lineWidth=3;g.stroke()}
  else if(L==='mine'){const r=p.w/2,pu=.75+.25*Math.sin(t*.2);g.scale(1,.42);g.translate(0,r*.9);g.strokeStyle=col;g.shadowColor=col;g.shadowBlur=18;g.lineWidth=4;g.globalAlpha=pu;
   g.beginPath();g.arc(0,0,r,0,7);g.stroke();g.beginPath();g.arc(0,0,r*.62,t*.05,t*.05+4.2);g.stroke();g.beginPath();g.arc(0,0,r*.25,0,7);g.fill()}
  else if(L==='wave'){const d=Math.sign(p.vx),R=p.h/2;g.shadowColor=col;g.shadowBlur=20;g.lineWidth=5;g.strokeStyle=col;
   for(let i=0;i<3;i++){g.globalAlpha=1-i*.28;g.beginPath();g.arc(-d*i*22,0,R,d>0?-1.1:Math.PI-1.1,d>0?1.1:Math.PI+1.1);g.stroke()}
   g.globalAlpha=.35;g.fillStyle=col;g.beginPath();g.ellipse(0,0,p.w/2,R*.8,0,0,7);g.fill()}
  else if(L==='claw'){const d=Math.sign(p.vx);g.strokeStyle='#fff';g.shadowColor=col;g.shadowBlur=14;g.lineWidth=4;
   for(const o of[-12,0,12]){g.beginPath();g.moveTo(-d*34,o*1.3);g.quadraticCurveTo(0,o-8,d*30,o*.8+6);g.stroke()}g.strokeStyle=col;g.lineWidth=2;g.stroke()}
  else if(L==='shock'){const d=Math.sign(p.vx);const gr=g.createLinearGradient(-d*60,0,d*30,0);gr.addColorStop(0,'#0000');gr.addColorStop(1,col);g.fillStyle=gr;
   g.beginPath();g.ellipse(0,0,p.w/2,p.h/2,0,0,7);g.fill();g.strokeStyle='#fff';g.lineWidth=3;g.beginPath();g.ellipse(d*10,0,p.w/3,p.h/2.3,0,-1.2,1.2);g.stroke()}
  g.restore()}
 projectile(g,p,o){if(p.def.look&&p.def.look!=='ring'){this.look(g,p,o.char.glow||'#fff');return}if(drawSpriteProjectile(g,p,o))return;const col=o.char.glow||'#fff',d=Math.sign(p.vx);g.save();g.globalCompositeOperation='lighter';
  const tr=g.createLinearGradient(p.x,0,p.x-d*120,0);tr.addColorStop(0,col+'aa');tr.addColorStop(1,'#0000');g.fillStyle=tr;g.beginPath();g.ellipse(p.x-d*50,p.y,70,16,0,0,7);g.fill();
  const gr=g.createRadialGradient(p.x,p.y,2,p.x,p.y,42);gr.addColorStop(0,'#fff');gr.addColorStop(.35,col);gr.addColorStop(1,'#0000');g.fillStyle=gr;g.beginPath();g.arc(p.x,p.y,42,0,7);g.fill();g.restore()}
 debugBoxes(g,game){g.save();g.lineWidth=1.5/game.camera.zoom;for(const f of game.fighters){const h=f.hurtbox();g.strokeStyle='#3fff7a';g.strokeRect(h.x,h.y,h.w,h.h);const a=f.activeHitbox();if(a){g.strokeStyle='#ff3a3a';g.strokeRect(a.rect.x,a.rect.y,a.rect.w,a.rect.h)}}
  for(const p of game.projectiles){const r=p.rect();g.strokeStyle='#ff3a3a';g.strokeRect(r.x,r.y,r.w,r.h)}g.restore()}
 debugText(g,game){g.save();g.fillStyle='#fff';g.font='11px monospace';g.textAlign='left';
  game.fighters.forEach((f,i)=>g.fillText(`${f.state} sf:${f.sf} mf:${f.mf} ${f.moveName} y:${Math.round(f.y)} airJ:${f.airJumps} airD:${f.airDashes}`,10,520-i*14));
  const c=game.camera;g.fillText(`cam x:${c.x.toFixed(0)} y:${c.y.toFixed(0)} zoom:${c.zoom.toFixed(2)}`,10,492);g.restore()}
}
