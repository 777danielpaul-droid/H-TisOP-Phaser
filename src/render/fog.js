// Neon-Nebel der Combatant Bay (Charakterauswahl, Singleplayer): dichte, weiche Schwaden, die langsam treiben, kreisen und unterschiedlich dicht werden.
// Zweifarbig: Neonfarbe der gewählten Figur (überwiegt) + helles Cyan des Standardrands (FOG_CYAN) in einem Teil der Schwaden. Die Farbe zieht weich zur Neonfarbe der gewählten Figur nach; um die Mitte (gewählte Figur) leuchtet der Nebel stärker, als würde er angestrahlt.
// Die Schwaden werden niedrig aufgelöst in ein Offscreen-Canvas gemalt (Auflösung/FOG_DIV) und weich hochskaliert -> von Natur aus verschwommen und billig.
// Ohne Offscreen-Canvas (Tests/Stub) wird direkt auf den Zeichenkontext gemalt. Rein zeichnend, keine Spiellogik.
const FOG_DIV=3,FOG_TAU=Math.PI*2;
const fogRng=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};   // kleiner Zufallsgenerator mit festem Startwert: die Schwaden sehen immer gleich aus
export function fogParseColor(c){const s=String(c||'').trim(),m=/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s);
 if(m){let h=m[1];if(h.length===3)h=h.replace(/./g,'$&$&');const n=parseInt(h,16);return[n>>16&255,n>>8&255,n&255]}
 const r=/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i.exec(s);return r?[+r[1],+r[2],+r[3]]:[63,224,255]}
const fogRgba=(c,a)=>`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${Math.max(0,Math.min(1,a)).toFixed(3)})`;
const FOG_CYAN=[104,237,242];   // zweite Nebelfarbe: das helle Cyan des Standardrands um die gewählte Figur (Dock-Linien), bei jeder Figur dabei
const fogMix=(a,b,k)=>a.map((v,i)=>v+(b[i]-v)*k);
export class NeonFog{
 constructor(){this.col=null;this.cv=null;this.cx=null;this.body=NeonFog.puffs(30,1);this.glow=NeonFog.puffs(18,.62)}
 // Schwaden-Parameter: Lage (0..1), Größe (lang gezogen), Drehung, Kreisbahn (ox/oy/w), Drift vx, Dichte-Wechsel (dw/dp); near = große, schnellere Schwaden im Vordergrund
 static puffs(n,sz){const r=fogRng(n*131+7),a=[];for(let i=0;i<n;i++){const near=i%3===0;
  a.push({x:r(),y:r(),rx:((near?42:26)+r()*20)*sz,ry:((near?17:10)+r()*8)*sz,a0:(r()-.5)*.9,spin:(.004+r()*.005)*(r()<.5?-1:1),ox:8+r()*24,oy:4+r()*9,w:(.006+r()*.01)*(r()<.5?-1:1),ph:r()*FOG_TAU,vx:(near?.05:.022)*(.6+r())*(r()<.5?-1:1),dw:.006+r()*.012,dp:r()*FOG_TAU,near,cy:r()<.42})}return a}
 place(p,t,W,H){const span=W+120,x=(((p.x*span+t*p.vx)%span)+span)%span-60+Math.cos(t*p.w+p.ph)*p.ox,y=H*(.12+.8*p.y)+Math.sin(t*p.w*1.3+p.ph)*p.oy;
  return{x,y,ang:p.a0+Math.sin(t*p.spin+p.ph)*.9,dens:.55+.45*Math.sin(t*p.dw+p.dp)}}
 // ein weicher, lang gezogener Schwaden: Kern kräftig, nach außen ausblendend
 puff(c,p,q,col,a){if(a<=.004)return;c.save();c.translate(q.x,q.y);c.rotate(q.ang);c.scale(1,p.ry/p.rx);
  const gr=c.createRadialGradient(0,0,0,0,0,p.rx);gr.addColorStop(0,fogRgba(col,a));gr.addColorStop(.5,fogRgba(col,a*.55));gr.addColorStop(1,fogRgba(col,0));
  c.fillStyle=gr;c.beginPath();c.arc(0,0,p.rx,0,FOG_TAU);c.fill();c.restore()}
 paint(c,t,W,H,col,holeX,mask){
  const bc=col.map(v=>v*.62+10),bcy=FOG_CYAN.map(v=>v*.55+10),gc=fogMix(col,[255,255,255],.22),gcy=fogMix(FOG_CYAN,[255,255,255],.18),pulse=1+.12*Math.sin(t*.05);
  const hole=x=>{const m=Math.min(1,Math.abs(x-holeX)/(W*.17));return .4+.6*m*m*(3-2*m)};   // hinter der gewählten Figur etwas lichter, damit sie klar im Mittelpunkt steht
  const lit=x=>.3+.7*Math.exp(-(((x-holeX)/(W*.32))**2));   // Neonlicht der gewählten Figur: nahe der Mitte leuchtet der Nebel stärker
  // 1) Nebelkörper: fern (dünner) zuerst, dann nah (dichter)
  for(const near of[false,true])for(const p of this.body){if(p.near!==near)continue;const q=this.place(p,t,W,H);this.puff(c,p,q,p.cy?bcy:bc,(near?.44:.34)*q.dens*hole(q.x)*(p.cy?.85:1))}
  // 2) Neonlicht im Nebel (additiv): großer Lichtschein hinter der Mitte + leuchtende Kerne in einzelnen Schwaden
  c.save();c.globalCompositeOperation='lighter';
  {const r=H*.62,gr=c.createRadialGradient(holeX,H*.55,0,holeX,H*.55,r);gr.addColorStop(0,fogRgba(gc,.34*pulse));gr.addColorStop(.45,fogRgba(col,.15*pulse));gr.addColorStop(1,fogRgba(col,0));c.fillStyle=gr;c.fillRect(holeX-r,H*.55-r,2*r,2*r)}
  {const r=H*.46,x=holeX-W*.22,y=H*.74,gr=c.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,fogRgba(gcy,.22*pulse));gr.addColorStop(1,fogRgba(FOG_CYAN,0));c.fillStyle=gr;c.fillRect(x-r,y-r,2*r,2*r)}   // cyanfarbener Gegenlicht-Schein unten links
  for(const p of this.glow){const q=this.place(p,t*1.15+40,W,H);this.puff(c,p,q,p.cy?gcy:gc,.3*q.dens*lit(q.x)*(p.near?1:.8))}
  c.restore();
  // 3) Ränder weich ausblenden (Ellipse) – nur auf dem eigenen Offscreen-Canvas (destination-in würde sonst den Bildschirm löschen)
  if(mask){c.save();c.globalCompositeOperation='destination-in';c.translate(W/2,H/2);c.scale(1,H/W);
  {const gr=c.createRadialGradient(0,0,0,0,0,W/2*1.04);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(.6,'rgba(0,0,0,.92)');gr.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gr;c.fillRect(-W,-W,2*W,2*W)}
  c.restore()}}
 surface(W,H){if(this.cv===false)return null;if(this.cx&&this.cv.width===W&&this.cv.height===H)return this.cx;
  try{if(typeof document==='undefined')throw 0;const cv=document.createElement('canvas');cv.width=W;cv.height=H;const cx=cv.getContext('2d');if(!cx)throw 0;this.cv=cv;this.cx=cx;return cx}catch(e){this.cv=false;this.cx=null;return null}}
 // zeichnet das zuletzt gemalte Nebelbild noch einmal (ohne neu zu berechnen), z. B. als zweite Ebene vor einer Figur; ohne Offscreen-Canvas (Tests) passiert nichts
 blit(g,rect,a){if(!this.cv||!this.cx)return;g.save();g.globalAlpha*=a;g.imageSmoothingEnabled=true;g.drawImage(this.cv,rect.x,rect.y,rect.w,rect.h);g.restore()}
 // rect = {x,y,w,h,hole} Bildschirmfläche (hole = x-Mitte der gewählten Figur); hex = Neonfarbe der gewählten Figur; dt = vergangene Frames (für den weichen Farbwechsel)
 draw(g,t,rect,hex,dt=1){const tc=fogParseColor(hex);this.col=this.col?fogMix(this.col,tc,1-Math.exp(-Math.max(0,dt)*.09)):tc.slice();
  const W=Math.max(8,Math.round(rect.w/FOG_DIV)),H=Math.max(8,Math.round(rect.h/FOG_DIV)),holeX=((rect.hole===undefined?rect.x+rect.w/2:rect.hole)-rect.x)/FOG_DIV,cx=this.surface(W,H);
  if(cx){cx.clearRect(0,0,W,H);this.paint(cx,t,W,H,this.col,holeX,true);g.save();g.imageSmoothingEnabled=true;try{g.imageSmoothingQuality='high'}catch(e){}g.drawImage(this.cv,rect.x,rect.y,rect.w,rect.h);g.restore()}
  else{g.save();g.translate(rect.x,rect.y);g.scale(FOG_DIV,FOG_DIV);this.paint(g,t,W,H,this.col,holeX,false);g.restore()}}
}
