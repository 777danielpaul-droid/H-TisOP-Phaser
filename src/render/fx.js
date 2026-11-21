import{F_DISP,F_TECH}from'./fonts.js';
import{GFX,METER}from'../core/config.js';
import{sparkIdx,sparkDraw}from'../core/particles.js';
// Post-Processing + Ambient-Effekte (Canvas 2D, ohne Abhängigkeiten, läuft überall – auch ohne ctx.filter):
//  - Bloom (Downscale-Kette, Helligkeit quadriert = weiche Schwelle), Vignette (pulsiert bei niedrigem Leben), Filmkorn
//  - Chromatische Aberration bei Treffern/K.O./Hyper, Impact-Frame (Lichtkern, Glanzstrahlen, Funkelpunkte) bei harten Treffern
//  - schwebende Staubpartikel, Boden-Lichtpfützen unter den Kämpfern, Schadenszahlen
// Hex (#rgb / #rrggbb) -> rgba(); ungültig = weiß
const fxRgba=(c,a)=>{let h=String(c||'').replace('#','');if(h.length===3)h=h.split('').map(x=>x+x).join('');if(!/^[0-9a-f]{6}$/i.test(h))return`rgba(255,255,255,${a})`;return`rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`};
const fclamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fmk=(w,h)=>{const c=document.createElement('canvas');c.width=Math.max(2,w|0);c.height=Math.max(2,h|0);return c};
const fhn=k=>{const s=Math.sin(k*12.9898)*43758.5453;return s-Math.floor(s)};
export class PostFX{
 constructor(){this.a=null;this.b=null;this.c=null;this.tmp=null;this.noise=null;this.ok=typeof document!=='undefined';this.size=''}
 prep(cv){const k=cv.width+'x'+cv.height;if(k===this.size)return;this.size=k;const w=cv.width,h=cv.height;
  this.a=fmk(w/4,h/4);this.b=fmk(w/10,h/10);this.c=fmk(w/4,h/4);this.tmp=null;this.tr=null;this.tb=null}
 // Bloom: helle Bereiche (Neon, Funken, Treffer) strahlen weich aus
 bloom(g,cv,amt=.5){amt*=GFX.bloom;if(!this.ok||amt<=0)return;this.prep(cv);const w=cv.width,h=cv.height,a=this.a.getContext('2d'),c=this.c.getContext('2d'),b=this.b.getContext('2d');
  a.globalCompositeOperation='source-over';a.imageSmoothingEnabled=true;a.drawImage(cv,0,0,this.a.width,this.a.height);
  c.globalCompositeOperation='copy';c.drawImage(this.a,0,0);a.globalCompositeOperation='multiply';a.drawImage(this.c,0,0);a.globalCompositeOperation='source-over'; // Helligkeit² ≈ Schwellwert
  b.imageSmoothingEnabled=true;b.drawImage(this.a,0,0,this.b.width,this.b.height);
  g.save();g.setTransform(1,0,0,1,0,0);g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.globalCompositeOperation='lighter';
  g.globalAlpha=amt*.9;g.drawImage(this.b,0,0,w,h);g.globalAlpha=amt*.55;g.drawImage(this.a,0,0,w,h);g.restore()}
 // Chromatische Aberration: R/G/B-Kanäle werden gegeneinander verschoben (nur kurz bei Treffern -> kaum Kosten)
 aberr(g,cv,amt){if(!this.ok||!GFX.aberr||amt<.05)return;const w=cv.width,h=cv.height;
  if(!this.tmp||this.tmp.width!==w||this.tmp.height!==h){this.tmp=fmk(w,h);this.tr=fmk(w,h);this.tb=fmk(w,h)}
  const t=this.tmp.getContext('2d');t.globalCompositeOperation='copy';t.drawImage(cv,0,0);
  const ch=(cvs,col)=>{const x=cvs.getContext('2d');x.globalCompositeOperation='copy';x.drawImage(this.tmp,0,0);x.globalCompositeOperation='multiply';x.fillStyle=col;x.fillRect(0,0,w,h);x.globalCompositeOperation='source-over'};
  ch(this.tr,'#ff0000');ch(this.tb,'#0000ff');
  const d=Math.max(1,amt*w*.0065);
  g.save();g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='multiply';g.fillStyle='#00ff00';g.fillRect(0,0,w,h);   // Original -> nur Grün
  g.globalCompositeOperation='lighter';g.drawImage(this.tr,-d,0);g.drawImage(this.tb,d,0);g.restore()}
 vignette(g,cv,power=0,t=0){const w=cv.width,h=cv.height,k=.38+power*.25+(power>0?Math.sin(t*.2)*.04*power:0);
  g.save();g.setTransform(1,0,0,1,0,0);const v=g.createRadialGradient(w/2,h/2,h*.32,w/2,h/2,h*.98);v.addColorStop(0,'#0000');v.addColorStop(1,power>0?`rgba(${Math.round(90+120*power)},0,20,${fclamp(k+.2,0,.85)})`:`rgba(0,0,8,${k+.2})`);
  g.fillStyle=v;g.fillRect(0,0,w,h);g.restore()}
 grain(g,cv,a=.05){if(!this.ok||!GFX.grain)return;if(!this.noise){const n=fmk(160,160),x=n.getContext('2d');if(!x.createImageData)return;const d=x.createImageData(160,160);if(!d||!d.data)return;
   for(let i=0;i<d.data.length;i+=4){const v=Math.random()*255;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255}x.putImageData(d,0,0);this.noise=n;this.np=null}
  if(!this.np)this.np=g.createPattern(this.noise,'repeat');if(!this.np)return;
  g.save();g.setTransform(1,0,0,1,0,0);g.globalAlpha=a;g.globalCompositeOperation='overlay';g.translate((Math.random()*160)|0,(Math.random()*160)|0);g.fillStyle=this.np;g.fillRect(-160,-160,cv.width+320,cv.height+320);g.restore()}
 // Schwebende Staub-/Funkenpartikel im Bildraum (Parallax-Tiefe), additiv
 dust(g,W,H,t,col='#bfa8ff',n=46,speed=1){n=Math.round(n*GFX.dust);if(n<=0)return;g.save();g.globalCompositeOperation='lighter';
  for(let i=0;i<n;i++){const z=.35+fhn(i*3.1)*.9,life=(t*speed*(8+z*16)+fhn(i)*H*3)%(H+40),x=(fhn(i*7.7)*W*1.2+Math.sin(t*.7*speed+i)*18*z)%(W+20),y=H+20-life;
   const a=(.15+.5*fhn(i*1.9+3))*Math.sin(fclamp(life/(H+40),0,1)*Math.PI);g.globalAlpha=a*.7;g.fillStyle=i%5?col:'#ffffff';g.beginPath();g.arc(x,y,.6+z*1.5,0,6.283);g.fill()}
  g.restore()}
 // Lichtstrahlen für Menü/Intro
 beams(g,W,H,t,col){if(GFX.level<1)return;g.save();g.globalCompositeOperation='lighter';
  for(let i=0;i<4;i++){const x=W*(.12+.25*i)+Math.sin(t*.35+i*1.7)*70,w=70+i*18,gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,col+'00');gr.addColorStop(.5,col+'1c');gr.addColorStop(1,col+'00');
   g.fillStyle=gr;g.beginPath();g.moveTo(x-6,0);g.lineTo(x+6,0);g.lineTo(x+w+Math.sin(t*.5+i)*50,H);g.lineTo(x-w+Math.sin(t*.5+i)*50,H);g.fill()}g.restore()}
 // Lichtpfütze unter dem Kämpfer (Welt-Raum, innerhalb der Kamera): färbt den Boden in der Figurenfarbe
 // Hyper-Leiste voll: pulsierender Lichthof um den Körper, Boden-Ring und feine aufsteigende Lichtstrahlen in der Figurenfarbe (nur mit Glow-Einstellung)
 hyperAura(g,f,ground,t){if(!GFX.glow||!(f.meter>=METER.max)||f.dead>0||f.hp<=0)return;const col=(f.char&&f.char.glow)||'#fff',sz=(f.char&&f.char.size)||1,pu=.5+.5*Math.sin(t*.16+f.x*.01),air=fclamp((ground-f.y)/260,0,1),cy=f.y-95*sz;
  g.save();g.globalCompositeOperation='lighter';
  const hg=g.createRadialGradient(f.x,cy,10*sz,f.x,cy,150*sz);hg.addColorStop(0,col);hg.addColorStop(.45,col);hg.addColorStop(1,'rgba(0,0,0,0)');
  g.globalAlpha=.16+.14*pu;g.fillStyle=hg;g.beginPath();g.ellipse(f.x,cy,105*sz,150*sz,0,0,6.283);g.fill();
  g.save();g.translate(f.x,ground+2);g.scale(1,.2);g.globalAlpha=(.55+.35*pu)*(1-air*.7);g.strokeStyle=col;g.lineWidth=3.2;g.shadowColor=col;g.shadowBlur=18;g.beginPath();g.arc(0,0,(62+10*pu)*sz,0,6.283);g.stroke();g.globalAlpha*=.6;g.strokeStyle='#fff';g.lineWidth=1.2;g.shadowBlur=0;g.beginPath();g.arc(0,0,(60+10*pu)*sz,0,6.283);g.stroke();g.restore();
  for(let k=0;k<5;k++){const ph=(t*.018+k*.2+f.x*.003)%1,x=f.x+Math.sin(k*2.4+t*.02)*46*sz,h=(70+40*Math.sin(k*1.7))*sz,y1=ground-ph*190*sz,gr=g.createLinearGradient(x,y1,x,y1-h);gr.addColorStop(0,col);gr.addColorStop(1,'rgba(0,0,0,0)');g.globalAlpha=(1-ph)*.5*(1-air*.6);g.fillStyle=gr;g.fillRect(x-1.2,y1-h,2.4,h)}
  g.restore()}
 floorGlow(g,f,ground,t,hit=0){if(!GFX.glow)return;const col=(f.char&&f.char.glow)||'#fff',sz=(f.char&&f.char.size)||1,air=fclamp((ground-f.y)/260,0,1),a=(.2+.12*Math.sin(t*3+f.x*.01)+hit*.35)*(1-air*.6),r=(95+hit*30)*sz;
  g.save();g.globalCompositeOperation='lighter';g.translate(f.x,ground+2);g.scale(1,.2);const gr=g.createRadialGradient(0,0,2,0,0,r);gr.addColorStop(0,col+Math.round(fclamp(a,0,1)*255).toString(16).padStart(2,'0'));gr.addColorStop(1,col+'00');
  g.fillStyle=gr;g.beginPath();g.arc(0,0,r,0,6.283);g.fill();g.restore()}
 // Impact-Frame bei harten Treffern/K.O.: kurzer weicher Lichtblitz, Lichtkern mit dünnen Glanzstrahlen und blinkenden Funkelpunkten (statt Vollblitz + dicker Speedlines + weißer Scheibe)
 impact(g,game){const im=game.impact;if(!im||im.t<=0)return;const W=960,H=540,u=im.t/im.t0,[ox,oy]=game.camera.toScreen(im.x,im.y),P=im.p,spr=sparkIdx(im.col),T=1-u;
  g.save();if(u>.6){g.globalAlpha=(u-.6)/.4*.12*P;g.fillStyle='#fff';g.fillRect(0,0,W,H)}   // nur ein kurzer, weicher Aufheller
  g.globalCompositeOperation='lighter';
  // Lichtkern: weicher Verlauf, wächst und verglüht
  {const R=(40+T*100)*(.8+.2*P),gr=g.createRadialGradient(ox,oy,0,ox,oy,R);gr.addColorStop(0,'rgba(255,255,255,.95)');gr.addColorStop(.18,'rgba(255,255,255,.55)');gr.addColorStop(.5,fxRgba(im.col,.33));gr.addColorStop(1,fxRgba(im.col,0));
   g.globalAlpha=Math.min(1,u*1.5)*.85*Math.min(1,P);g.fillStyle=gr;g.fillRect(ox-R,oy-R,R*2,R*2)}
  // Glanzstrahlen: dünn, spitz zulaufend, flackern (jeder Strahl blinkt für sich)
  g.fillStyle='#ffffff';
  for(let i=0,N=Math.round(5*Math.max(.4,GFX.rays));i<N;i++){const a=fhn(i*5.3+im.seed)*6.283,fl=fhn(i*3.7+im.seed+Math.floor(T*10)),r0=14+fhn(i)*26,L=r0+(30+fhn(i+9)*120)*(.5+.5*T+.2*P),w=1.2+fhn(i*2)*2.4*u,nx=-Math.sin(a),ny=Math.cos(a);
   g.globalAlpha=Math.min(1,u*1.4)*(.25+.75*fl*fl)*.85;g.beginPath();g.moveTo(ox+Math.cos(a)*r0+nx*w,oy+Math.sin(a)*r0*.85+ny*w);g.lineTo(ox+Math.cos(a)*L,oy+Math.sin(a)*L*.85);g.lineTo(ox+Math.cos(a)*r0-nx*w,oy+Math.sin(a)*r0*.85-ny*w);g.closePath();g.fill()}
  // Funkelpunkte, die vom Treffpunkt wegfliegen und blinken
  for(let i=0,N=Math.round(5*Math.max(.4,GFX.rays));i<N;i++){const a=fhn(i*7.1+im.seed)*6.283,sp=30+fhn(i*1.3)*140,d=24+sp*T*(.6+.4*(1-T)),s=.5+.5*Math.sin(T*28*(.6+fhn(i*2.9))+i*2.1),tw=s*s*s,r=(1.8+fhn(i*4.4)*3)*(.6+.8*tw)*(.4+.6*u);
   g.globalAlpha=Math.min(1,u*1.6)*(.35+.65*tw);sparkDraw(g,ox+Math.cos(a)*d,oy+Math.sin(a)*d*.85,r,fhn(i)<.45?36:spr,tw,1)}
  g.restore()}
 // Schadenszahlen / Textpops (Welt-Raum)
 pops(g,game){const z=game.camera.z||game.camera.zoom||1;g.save();g.lineJoin='round';g.textAlign='center';
  for(const p of game.pops){const u=p.age/p.life,e=1-Math.pow(1-fclamp(u*2.2,0,1),3),sc=(p.age<7?1.7-.7*(p.age/7):1)*p.size/z*.92,a=u>.65?1-(u-.65)/.35:1;
   g.save();g.translate(p.x+p.dx*e,p.y-46*e);g.scale(sc,sc);g.rotate(p.rot*(1-e*.6));g.globalAlpha=a;g.font=`${p.text?34:44}px ${p.tech?F_TECH:F_DISP}`;
   if('letterSpacing'in g)g.letterSpacing='1px';
   g.lineWidth=7;g.strokeStyle='#05020c';g.strokeText(p.s,0,0);const gr=g.createLinearGradient(0,-30,0,6);gr.addColorStop(0,'#ffffff');gr.addColorStop(1,p.col);g.fillStyle=gr;g.shadowColor=p.col;g.shadowBlur=14;g.fillText(p.s,0,0);g.restore()}
  g.restore()}
 // Alles Bildschirmweite auf die fertige Szene (vor dem HUD)
 scene(g,cv,game,t){const hp=Math.min(...game.fighters.map(f=>f.hp/f.maxHp)),low=game.phase==='fight'?fclamp((.28-hp)/.28,0,1):0;
  this.aberr(g,cv,game.aberr||0);this.bloom(g,cv,.5+(game.aberr||0)*.25);this.vignette(g,cv,low,t);this.grain(g,cv,.05)}
}
