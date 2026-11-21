import{GROUND}from'../core/config.js';
// Parkour-Szene (Kapitel-Config parkour, core/parkour.js): realistisch proportionierte Kulisse + Plattformen + Hinweisschild + Schatz.
// Maßstab: Figuren ~180 px = 1,8 m -> 100 px pro Meter. Geschoss 3 m = 300 px, Fenster 1,1 x 1,5 m, Tür 1,1 x 2,1 m, Gitterturm-Kran 2 m breit.
// Alles wird nur gezeichnet (kein Einfluss auf die Spiellogik); Plattformen = Oberkante bei GROUND - h, Figuren stehen auf der Oberkante.
const pdRnd=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)};
const pdBox=(g,x,y,w,h,c,a=1)=>{g.globalAlpha=a;g.fillStyle=c;g.fillRect(x,y,w,h);g.globalAlpha=1};
const pdGlow=(g,x,y,r,col,a)=>{const gr=g.createRadialGradient(x,y,1,x,y,r);gr.addColorStop(0,col);gr.addColorStop(1,'#0000');g.save();g.globalCompositeOperation='lighter';g.globalAlpha=a;g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);g.restore()};
// Gitterwerk (Kran/Reaktor): zwei Gurte + Streben von y0 (unten) bis y1 (oben)
function pdLattice(g,x,y0,y1,w,step,col,lw){g.strokeStyle=col;g.lineWidth=lw;g.beginPath();g.moveTo(x,y0);g.lineTo(x,y1);g.moveTo(x+w,y0);g.lineTo(x+w,y1);for(let y=y0;y>y1+step;y-=step){g.moveTo(x,y);g.lineTo(x+w,y-step);g.moveTo(x+w,y);g.lineTo(x,y-step);g.moveTo(x,y-step);g.lineTo(x+w,y-step)}g.stroke()}
const PD_DECO={
 // ---- Kapitel 1, Neon City: Hochhaus-Fassade (Geschosse 3 m, Fenster 1,1 x 1,5 m), Ladenfront, Dach mit Tank, Antennen, Reklame ----
 neon(g,P,t,L,top,x0,x1){const bx=x0-130,bw=x1-x0+260,roof=top-300,ST=300,WW=110,WH=150,acc=L.acc;
  const gr=g.createLinearGradient(0,roof,0,GROUND);gr.addColorStop(0,'#0f0a1f');gr.addColorStop(1,'#1c1334');g.fillStyle=gr;g.fillRect(bx,roof,bw,GROUND-roof);
  pdBox(g,bx-14,roof-30,bw+28,34,'#07040f');pdBox(g,bx-14,roof-30,bw+28,4,acc,.8);   // Dachkante
  for(let y=GROUND-ST;y>roof;y-=ST){pdBox(g,bx-8,y-7,bw+16,14,'#07040f');pdBox(g,bx-8,y-7,bw+16,2,acc,.28)}   // Geschoss-Gesimse
  for(let s=0;GROUND-ST*(s+1)>roof-ST+40;s++){const wy=GROUND-ST*(s+1)+70;for(let x=bx+70,i=0;x<bx+bw-WW-40;x+=200,i++){const r=pdRnd(s*31+i*7+3);
    pdBox(g,x-7,wy-7,WW+14,WH+14,'#07040f');
    if(r<.55){const col=r<.2?acc:r<.38?'#ffd23f':'#8fd8ff';g.globalAlpha=.5+.35*Math.sin(t*.7+r*40);g.fillStyle=col;g.fillRect(x,wy,WW,WH);g.globalAlpha=1;
     if(r<.1){g.fillStyle='#07040f';g.beginPath();g.arc(x+WW*.35,wy+WH*.5,9,0,7);g.fill();g.fillRect(x+WW*.35-13,wy+WH*.5+9,26,WH*.5-9)}   // Silhouette am Fenster
     pdBox(g,x+WW/2-2,wy,4,WH,'#07040f');pdBox(g,x,wy+WH/2-2,WW,4,'#07040f')}
    else{pdBox(g,x,wy,WW,WH,'#110c21');pdBox(g,x+10,wy+8,18,WH-16,'#fff',.05)}}}
  // Erdgeschoss: Ladenfront mit Schaufenstern, Tür (1,1 x 2,1 m) und Neonschrift
  pdBox(g,bx,GROUND-ST+40,bw,ST-40,'#0a0716');for(let x=bx+60;x<bx+bw-300;x+=330){pdBox(g,x,GROUND-200,240,150,'#1b2a4a',.7);pdBox(g,x,GROUND-200,240,4,acc,.8)}
  pdBox(g,bx+bw/2-55,GROUND-210,110,210,'#07040f');pdBox(g,bx+bw/2-45,GROUND-200,90,190,acc,.18+.1*Math.sin(t*2));
  g.save();g.strokeStyle=acc;g.lineWidth=4;g.shadowColor=acc;g.shadowBlur=16;g.strokeRect(bx+bw/2-170,GROUND-262,340,38);g.restore();
  // Dach: Wassertank auf Stützen, Antennen mit rotem Blinklicht, Reklameschild
  pdBox(g,bx+bw*.2,roof-150,120,100,'#241a3a');pdBox(g,bx+bw*.2-6,roof-156,132,10,'#07040f');for(const dx of[10,100])pdBox(g,bx+bw*.2+dx,roof-50,8,50,'#07040f');
  for(const [dx,hh] of[[.62,260],[.7,190],[.85,320]]){const ax=bx+bw*dx;pdBox(g,ax-3,roof-hh,6,hh,'#07040f');if(Math.sin(t*2.4+dx*9)>0)pdGlow(g,ax,roof-hh,26,'#ff3030',.9)}
  g.save();g.strokeStyle=acc;g.lineWidth=5;g.shadowColor=acc;g.shadowBlur=22;g.strokeRect(bx+bw*.38,roof-260,bw*.18,120);pdBox(g,bx+bw*.38+12,roof-248,bw*.18-24,12,'#ffd23f',.8);pdBox(g,bx+bw*.38+12,roof-222,bw*.18-24,12,acc,.7);g.restore()},
 // ---- Kapitel 2, Toxic Docks: Containerkran – Gitterturm (2 m breit), Ausleger mit Laufkatze und Haken, Gegenausleger, Kabine, Containerstapel ----
 crane(g,P,t,L,top,x0,x1){const tx=560,tw=200,y1=top-330,jy=y1+30,col='#d4a82c';g.save();g.globalAlpha=.92;
  for(const [cx,k,n] of[[x0-150,3,0],[tx+tw+130,2,1],[tx-420,2,2]]){for(let i=0;i<k;i++){const cc=['#a93226','#1f618d','#b7950b','#117a65','#6c3483'][(n*2+i)%5];pdBox(g,cx,GROUND-130*(i+1),330,126,cc,.9);g.strokeStyle='rgba(0,0,0,.4)';g.lineWidth=2;for(let x=cx+14;x<cx+330;x+=22){g.beginPath();g.moveTo(x,GROUND-130*(i+1)+6);g.lineTo(x,GROUND-130*i-8);g.stroke()}}}   // Containerstapel (2,6 m hoch)
  pdLattice(g,tx,GROUND,y1,tw,100,col,4);for(let y=GROUND-100;y>y1;y-=100)pdBox(g,tx-6,y-2,tw+12,6,'#8d6e12');   // Gitterturm mit Plattformen
  g.fillStyle='#e6b422';g.fillRect(tx-30,y1-90,tw+60,90);g.fillStyle='#1a1426';g.fillRect(tx-14,y1-70,70,44);g.fillStyle='#8fd8ff';g.globalAlpha=.5;g.fillRect(tx-10,y1-66,62,36);g.globalAlpha=.92;   // Fahrerkabine mit Scheibe
  g.strokeStyle=col;g.lineWidth=5;g.beginPath();g.moveTo(tx-30,jy);g.lineTo(x0-210,jy);g.moveTo(tx+tw+30,jy);g.lineTo(tx+tw+330,jy);g.stroke();g.lineWidth=2;g.beginPath();for(let x=x0-210;x<tx-30;x+=60){g.moveTo(x,jy);g.lineTo(x+30,jy-50);g.lineTo(x+60,jy)}g.moveTo(x0-210,jy-50);g.lineTo(tx-30,jy-50);g.stroke();   // Ausleger mit Fachwerk
  g.strokeStyle=col;g.lineWidth=3;g.beginPath();g.moveTo(tx+tw/2,y1-90);g.lineTo(tx+tw/2,y1-210);g.lineTo(x0-210,jy);g.moveTo(tx+tw/2,y1-210);g.lineTo(tx+tw+330,jy);g.stroke();   // Abspannung
  for(let i=0;i<3;i++)pdBox(g,tx+tw+60+i*80,jy,70,60,'#555',.95);   // Gegengewichte
  const hx=x0-60+Math.sin(t*.9)*70;g.strokeStyle='#bbb';g.lineWidth=2;g.beginPath();g.moveTo(hx,jy+6);g.lineTo(hx,jy+210);g.stroke();pdBox(g,hx-24,jy+2,48,16,'#e6b422');g.strokeStyle='#ddd';g.lineWidth=5;g.beginPath();g.arc(hx,jy+222,13,-.5,Math.PI*1.1);g.stroke();   // Laufkatze, Seil, Haken
  g.restore();if(Math.sin(t*3)>0)pdGlow(g,tx+tw/2,y1-100,40,'#ff3030',1)},
 // ---- Kapitel 3, Der Kern: Reaktorzylinder (2,6 m breit) mit Ringen, Rohren, Dampf und Blitzen zu den Seiten-Pylonen ----
 reactor(g,P,t,L,top,x0,x1){const cx=(x0+x1)/2+60,cw=260,y1=top-260,pul=.75+.25*Math.sin(t*3),acc=L.acc;
  for(const sx of[cx-cw/2-210,cx+cw/2+150]){pdLattice(g,sx,GROUND,y1+120,60,90,'#3a2a3a',3);pdGlow(g,sx+30,y1+120,36,acc,.7*pul)}   // Seiten-Pylone
  const gr=g.createLinearGradient(cx-cw/2,0,cx+cw/2,0);gr.addColorStop(0,'#16090d');gr.addColorStop(.5,'#3a1118');gr.addColorStop(1,'#16090d');g.fillStyle=gr;g.fillRect(cx-cw/2,y1,cw,GROUND-y1);
  const cg=g.createLinearGradient(cx-34,0,cx+34,0);cg.addColorStop(0,'#0000');cg.addColorStop(.5,acc);cg.addColorStop(1,'#0000');g.globalAlpha=.65*pul;g.fillStyle=cg;g.fillRect(cx-34,y1+20,68,GROUND-y1-20);g.globalAlpha=1;   // glühender Kernstrahl
  for(let y=GROUND-120;y>y1;y-=150){pdBox(g,cx-cw/2-14,y,cw+28,26,'#241820');pdBox(g,cx-cw/2-14,y,cw+28,3,acc,.5*pul)}
  g.strokeStyle='#2a2030';g.lineWidth=14;g.beginPath();for(const [yy,dd] of[[.25,-1],[.5,1],[.75,-1]]){const y=GROUND-(GROUND-y1)*yy;g.moveTo(cx+dd*cw/2,y);g.lineTo(cx+dd*(cw/2+150),y);g.lineTo(cx+dd*(cw/2+150),y+90)}g.stroke();
  pdGlow(g,cx,(y1+GROUND)/2,320,acc,.3*pul);
  g.strokeStyle='#fff';g.lineWidth=2;g.shadowColor=acc;g.shadowBlur=10;for(const sx of[cx-cw/2-180,cx+cw/2+180]){g.globalAlpha=.4+.5*Math.abs(Math.sin(t*17+sx));g.beginPath();let yy=y1+120;g.moveTo(sx,yy);for(let i=1;i<=7;i++){g.lineTo(sx+(cx-sx)*i/7*.5+(pdRnd(i+Math.floor(t*9)+sx)-.5)*24,yy+i*60)}g.stroke()}g.shadowBlur=0;g.globalAlpha=1;
  pdGlow(g,cx,y1-20,80,acc,.55*pul);for(let i=0;i<6;i++){const a=((t*.5+i/6)%1);g.globalAlpha=(1-a)*.35;g.fillStyle='#caa';g.beginPath();g.arc(cx-60+i*24+Math.sin(t+i)*10,y1-a*160,18+a*40,0,7);g.fill()}g.globalAlpha=1},
 // ---- Kapitel 4, Totenreich: Stufenpyramide (Stufen 1 m hoch), Hieroglyphenbänder, Fackeln, Obelisk, goldener Schlussstein ----
 obelisk(g,P,t,L,top,x0,x1){const cx=(x0+x1)/2+40,step=100,n=Math.ceil((GROUND-top+240)/step),acc=L.acc;
  for(let i=0;i<n;i++){const y=GROUND-step*(i+1),hw=Math.max(70,650-i*21);pdBox(g,cx-hw,y,hw*2,step+1,i%2?'#2a1f10':'#33260f');pdBox(g,cx-hw,y,hw*2,3,acc,.5);
   if(i%3===1){g.globalAlpha=.4;g.fillStyle=acc;for(let x=cx-hw+16;x<cx+hw-20;x+=26)g.fillRect(x,y+38,12,5);for(let x=cx-hw+24;x<cx+hw-20;x+=26)g.fillRect(x,y+54,6,12);g.globalAlpha=1}   // Hieroglyphenband
   if(i%4===2)for(const sx of[-1,1]){const fx=cx+sx*(hw-14),fl=.7+.3*Math.sin(t*9+i);pdBox(g,fx-3,y+30,6,40,'#150d05');pdGlow(g,fx,y+24,46*fl,'#ff9a2a',.8)}}   // Fackeln
  const top2=GROUND-step*n;g.fillStyle='#e6b422';g.beginPath();g.moveTo(cx-60,top2);g.lineTo(cx,top2-110);g.lineTo(cx+60,top2);g.closePath();g.fill();pdGlow(g,cx,top2-40,160,'#ffd23f',.5+.2*Math.sin(t*2));   // Schlussstein
  const ox=x1+110;g.fillStyle='#2b200f';g.strokeStyle=acc;g.lineWidth=2;g.beginPath();g.moveTo(ox-46,GROUND);g.lineTo(ox-26,top-60);g.lineTo(ox,top-190);g.lineTo(ox+26,top-60);g.lineTo(ox+46,GROUND);g.closePath();g.fill();g.stroke()},   // Obelisk
 // ---- Kapitel 5, Bergtempel: Pagode mit Geschossen und geschwungenen Dächern, Laternen, Glocke, goldener Spitze ----
 pagoda(g,P,t,L,top,x0,x1){const cx=(x0+x1)/2+40,TH=300,n=Math.ceil((GROUND-top+200)/TH),acc=L.acc;
  for(let i=0;i<n;i++){const y=GROUND-TH*(i+1),w=Math.max(150,430-i*26),rw=w+110;
   pdBox(g,cx-w,y+70,w*2,TH-70,i%2?'#2a0a14':'#32101a');for(let x=cx-w+30;x<cx+w-30;x+=110){pdBox(g,x,y+120,50,100,'#07040f');pdBox(g,x+5,y+125,40,90,acc,.2+.12*Math.sin(t*1.6+x+i))}   // Türen/Fenster mit Licht
   g.fillStyle='#5e0f22';g.strokeStyle='#d9a521';g.lineWidth=3;g.beginPath();g.moveTo(cx-rw-26,y+78);g.quadraticCurveTo(cx-rw,y+52,cx-rw+50,y+52);g.lineTo(cx+rw-50,y+52);g.quadraticCurveTo(cx+rw,y+52,cx+rw+26,y+78);g.lineTo(cx+rw-12,y+66);g.lineTo(cx-rw+12,y+66);g.closePath();g.fill();g.stroke();   // Dach
   for(const sx of[-1,1]){const lx=cx+sx*(rw-24),sw=Math.sin(t*1.5+i+sx)*4;g.strokeStyle='#d9a521';g.lineWidth=2;g.beginPath();g.moveTo(lx,y+70);g.lineTo(lx+sw,y+110);g.stroke();pdBox(g,lx+sw-9,y+108,18,26,'#c0392b');pdGlow(g,lx+sw,y+122,34,'#ff6a3a',.55)}}   // Laternen
  const ty=GROUND-TH*n;g.fillStyle='#d9a521';g.fillRect(cx-5,ty-170,10,170);g.beginPath();g.moveTo(cx-18,ty-170);g.lineTo(cx,ty-230);g.lineTo(cx+18,ty-170);g.closePath();g.fill();
  const sw=Math.sin(t*1.6)*.14;g.save();g.translate(cx+120,ty-60);g.rotate(sw);g.fillStyle='#d9a521';g.beginPath();g.moveTo(-26,40);g.quadraticCurveTo(-30,-4,0,-18);g.quadraticCurveTo(30,-4,26,40);g.closePath();g.fill();g.restore()}};
// ---- Plattformen: je Kapitel ein eigenes Material; bewegliche zeigen Schienen/Düsen, bröckelnde Risse (und wackeln, bevor sie wegfallen) ----
function pdSlab(g,p,q,deco,i,t,L){const ox=q?q.ox:0,gone=q&&!q.on,shake=q&&q.tm>0&&!gone?(Math.random()-.5)*4:0,x0=p.x0+ox+shake,w=p.x1-p.x0,y=GROUND-p.h;
 g.save();if(gone){g.globalAlpha=.22;g.setLineDash([8,6]);g.strokeStyle=L.acc;g.lineWidth=2;g.strokeRect(x0,y,w,14);g.restore();return}
 g.shadowColor=L.acc;g.shadowBlur=10;
 if(deco==='crane'){g.shadowBlur=0;g.fillStyle=['#a93226','#1f618d','#b7950b','#117a65'][i%4];g.fillRect(x0,y,w,26);g.fillStyle='#e6e1d0';g.fillRect(x0,y,w,4);g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=2;for(let x=x0+9;x<x0+w;x+=14){g.beginPath();g.moveTo(x,y+6);g.lineTo(x,y+22);g.stroke()}g.fillStyle='#ffd23f';for(let k=0;k<w;k+=36)g.fillRect(x0+k,y+22,18,4)}   // Container mit Gefahrenstreifen
 else if(deco==='neon'){g.fillStyle='#241a3a';g.fillRect(x0,y,w,16);g.fillStyle=i%2?'#ffd23f':L.acc;g.globalAlpha=.7+.25*Math.sin(t*4+i);g.fillRect(x0,y+16,w,3);g.globalAlpha=1;g.shadowBlur=0;g.strokeStyle='#07040f';g.lineWidth=3;g.beginPath();g.moveTo(x0,y-64);g.lineTo(x0+w,y-64);g.stroke();g.lineWidth=2;for(let x=x0;x<=x0+w;x+=28){g.beginPath();g.moveTo(x,y);g.lineTo(x,y-64);g.stroke()}}   // Balkon mit Geländer
 else if(deco==='reactor'){g.fillStyle='#1c1722';g.fillRect(x0,y,w,14);g.shadowBlur=0;g.strokeStyle='#5a4a68';g.lineWidth=1;for(let x=x0+5;x<x0+w;x+=9){g.beginPath();g.moveTo(x,y);g.lineTo(x-5,y+14);g.stroke()}g.fillStyle=L.acc;g.globalAlpha=.85;g.fillRect(x0,y,w,3);g.globalAlpha=1}   // Gitterrost-Laufsteg
 else if(deco==='obelisk'){g.fillStyle='#3a2c14';g.fillRect(x0,y,w,28);g.shadowBlur=0;g.fillStyle=L.acc;g.fillRect(x0,y,w,3);g.globalAlpha=.5;for(let x=x0+10;x<x0+w-14;x+=24)g.fillRect(x,y+11,12,4);g.globalAlpha=1}   // Steinplatte mit Schriftband
 else{g.fillStyle='#5e0f22';g.beginPath();g.moveTo(x0-14,y+16);g.quadraticCurveTo(x0,y,x0+20,y);g.lineTo(x0+w-20,y);g.quadraticCurveTo(x0+w,y,x0+w+14,y+16);g.lineTo(x0+w-8,y+14);g.lineTo(x0+8,y+14);g.closePath();g.fill();g.shadowBlur=0;g.strokeStyle='#d9a521';g.lineWidth=2;g.stroke()}   // Dachkante
 g.shadowBlur=0;
 if(p.kind==='move'){g.fillStyle=L.acc;g.globalAlpha=.55+.3*Math.sin(t*8);for(const dx of[.2,.8]){g.beginPath();g.moveTo(x0+w*dx-8,y+30);g.lineTo(x0+w*dx+8,y+30);g.lineTo(x0+w*dx,y+44);g.closePath();g.fill()}g.globalAlpha=.3;g.strokeStyle=L.acc;g.setLineDash([6,6]);g.beginPath();g.moveTo(p.x0-p.amp,y+8);g.lineTo(p.x1+p.amp,y+8);g.stroke()}
 if(p.kind==='crumble'){g.strokeStyle='#000';g.globalAlpha=.55;g.lineWidth=2;g.beginPath();for(let k=1;k<4;k++){const cx=x0+w*k/4;g.moveTo(cx,y);g.lineTo(cx+6,y+9);g.lineTo(cx-4,y+16);g.lineTo(cx+5,y+24)}g.stroke()}
 g.restore()}
// ---- Hinweisschild am Einstieg, Schatz mit Lichtstrahl ----
function pdHint(g,P,t,L,height,x0){const hx=x0-130,tot=(height/100).toFixed(0);g.save();g.fillStyle='#1a1426';g.fillRect(hx-3,GROUND-210,6,210);g.fillStyle='rgba(8,5,16,.92)';g.strokeStyle=L.acc;g.lineWidth=2;g.shadowColor=L.acc;g.shadowBlur=12;g.fillRect(hx-70,GROUND-330,140,116);g.strokeRect(hx-70,GROUND-330,140,116);g.shadowBlur=0;
 g.fillStyle=L.acc;g.globalAlpha=.65+.3*Math.sin(t*4);for(const dy of[0,16]){g.beginPath();g.moveTo(hx-20,GROUND-282-dy);g.lineTo(hx,GROUND-302-dy);g.lineTo(hx+20,GROUND-282-dy);g.lineTo(hx+20,GROUND-274-dy);g.lineTo(hx,GROUND-294-dy);g.lineTo(hx-20,GROUND-274-dy);g.closePath();g.fill()}
 g.globalAlpha=1;g.font='700 13px Orbitron,Impact,sans-serif';g.textAlign='center';g.fillText('DOPPELSPRUNG',hx,GROUND-246);g.font='700 11px Orbitron,Impact,sans-serif';g.fillStyle='#ffd23f';g.fillText('SCHATZ '+tot+' m',hx,GROUND-226);g.restore()}
function pdRelic(g,r,t){if(!r||r.got)return;g.save();const bob=Math.sin(t*2.2)*6,x=r.x,y=r.y+bob;g.globalCompositeOperation='lighter';
 const bm=g.createLinearGradient(0,y,0,y-900);bm.addColorStop(0,'rgba(255,210,63,.55)');bm.addColorStop(1,'rgba(255,210,63,0)');g.fillStyle=bm;g.fillRect(x-14,y-900,28,900);
 const rg=g.createRadialGradient(x,y,2,x,y,80);rg.addColorStop(0,'rgba(255,236,150,.95)');rg.addColorStop(1,'rgba(255,210,63,0)');g.fillStyle=rg;g.fillRect(x-80,y-80,160,160);
 g.globalCompositeOperation='source-over';const wv=Math.max(.25,Math.abs(Math.cos(t*2)))*17;g.fillStyle='#ffe27a';g.strokeStyle='#fff7cc';g.lineWidth=2;g.beginPath();g.moveTo(x,y-26);g.lineTo(x+wv,y);g.lineTo(x,y+26);g.lineTo(x-wv,y);g.closePath();g.fill();g.stroke();g.restore()}
// Einstieg für storyhud.js: Kulisse, Plattformen (mit Laufzeitzustand aus dem Terrain), Schild, Schatz
export function drawParkourScene(g,game,t,L){const s=game.story,pk=s&&s.cfg.parkour;if(!pk)return;const P=pk.platforms,T=s.terrain,top=GROUND-pk.height,x0=Math.min(...P.map(p=>p.x0-(p.amp||0))),x1=Math.max(...P.map(p=>p.x1+(p.amp||0)));
 g.save();(PD_DECO[pk.deco]||PD_DECO.neon)(g,P,t,L,top,x0,x1);g.restore();
 P.forEach((p,i)=>pdSlab(g,p,T&&T.platforms[i],pk.deco,i,t,L));pdHint(g,P,t,L,pk.height,x0);pdRelic(g,s.relic,t)}
