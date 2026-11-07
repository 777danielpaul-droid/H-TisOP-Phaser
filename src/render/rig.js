import{drawSpriteFighter}from'./sprites.js';
import{EFFECT}from'../core/config.js';
// Vektor-Skelett-Figuren (Tiger/Wolf). Pose = Winkel-Vektor, Animationen = Keyframes. Kein Asset-Laden nötig.
const PI=Math.PI;
export const PAL={
 tiger:{fur:'#2f6bff',dark:'#1a3fb8',light:'#7fb0ff',belly:'#eef4ff',stripe:'#0a1a5c',pants:'#2257ee',pantsD:'#173fb0',sash:'#3a6bff',out:'#050d33',eye:'#7ff6ff',glow:'#3fe0ff',stripes:1,wolf:0},
 wolf:{fur:'#6d6761',dark:'#3b3633',light:'#a39b92',belly:'#8e857b',stripe:'#25201d',pants:'#7a5430',pantsD:'#4f341a',sash:'#241c26',out:'#100b0b',eye:'#ff2a3a',glow:'#ff3a55',stripes:0,wolf:1}};
// Pose: [Torso-Neigung, Kopf, Hinterarm(ob,unt), Vorderarm(ob,unt), Hinterbein(Oberschenkel,Schienbein), Vorderbein, X-Versatz, Mund, Hüfthöhe(0=auto)]
// Winkel: 0 = nach unten, +π/2 = nach vorn.
const S=(tl,hd,ba1,ba2,fa1,fa2,bt,bs,ft,fs,hx=0,mo=0,hy=0)=>[tl,hd,ba1,ba2,fa1,fa2,bt,bs,ft,fs,hx,mo,hy];
const ST1=S(.12,0,.35,2.1,.75,2.35,-.55,-.15,.7,.1),ST2=S(.18,.05,.4,2.15,.8,2.4,-.62,-.2,.76,.16);
const CR=S(.28,.08,.5,2.2,.95,2.4,-1.15,.35,1.15,-.25),KOP=S(-1.45,-.3,-1.2,-1,-.9,-.8,1.2,1.55,1.35,1.55,0,1,-22),HITP=S(-.35,-.45,-.6,.5,.1,1,-.75,-.35,.35,.2,-14,1);
export const A={
 idle:{d:1.2,loop:1,k:[[0,ST1],[.6,ST2],[1.2,ST1]]},
 walk:{d:.64,loop:1,k:[[0,S(.12,0,.35,2.1,.75,2.35,-.65,-.2,.7,.15)],[.16,S(.14,0,.4,2.1,.7,2.3,.1,-.6,-.1,-.1)],[.32,S(.12,0,.35,2.1,.75,2.35,.65,.15,-.65,-.2)],[.48,S(.14,0,.4,2.1,.7,2.3,-.1,-.1,.1,-.6)],[.64,S(.12,0,.35,2.1,.75,2.35,-.65,-.2,.7,.15)]]},
 crouch:{d:1,k:[[0,CR]]},
 air:{d:1,k:[[0,S(.1,0,1,2.6,.9,2.5,.5,-.9,.9,-.4)]]},
 dash:{d:1,k:[[0,S(.5,.1,-.4,1.2,.5,2.4,-.9,-.5,.9,-.3)]]},
 airdash:{d:1,k:[[0,S(.9,.1,.4,1.6,1.1,1.8,.5,-.9,-.2,-1)]]},
 punch:{d:.4,k:[[0,ST1],[.08,S(0,0,.35,2.1,.3,2.7,-.55,-.15,.7,.1,-6)],[.14,S(.32,.05,.2,2,1.52,1.6,-.7,-.15,.75,.1,14,1)],[.26,S(.32,.05,.2,2,1.52,1.6,-.7,-.15,.75,.1,14,1)],[.4,ST1]]},
 kick:{d:.6,k:[[0,ST1],[.14,S(-.05,0,.4,2.1,.7,2.3,-.45,-.1,1.35,.2,-4)],[.24,S(-.2,-.02,.4,2.1,.7,2.3,-.45,-.1,1.5,1.45,8,1)],[.36,S(-.2,-.02,.4,2.1,.7,2.3,-.45,-.1,1.5,1.45,8,1)],[.48,S(-.05,0,.4,2.1,.7,2.3,-.45,-.1,1.35,.2,-4)],[.6,ST1]]},
 heavy:{d:.62,k:[[0,ST1],[.2,S(-.15,-.05,.3,2.2,-.7,.5,-.6,-.1,.5,.05,-12)],[.28,S(.4,.08,.3,2.1,1.5,1.55,-.85,-.1,.95,.3,24,1)],[.42,S(.4,.08,.3,2.1,1.5,1.55,-.85,-.1,.95,.3,24,1)],[.62,ST1]]},
 upper:{d:.6,k:[[0,ST1],[.14,S(.2,.05,.4,2.1,-.1,.6,-.9,.1,1,-.3,-4)],[.24,S(.05,-.1,.4,2.1,2.75,2.9,-.1,-.1,.15,.05,14,1)],[.38,S(.05,-.1,.4,2.1,2.75,2.9,-.1,-.1,.15,.05,14,1)],[.6,ST1]]},
 special:{d:.85,k:[[0,ST1],[.25,S(0,0,-.2,1.4,.2,1.5,-.7,-.1,.8,.1,-8)],[.38,S(.28,.05,1.5,1.55,1.5,1.55,-.75,-.15,.8,.1,12,1)],[.6,S(.28,.05,1.5,1.55,1.5,1.55,-.75,-.15,.8,.1,12,1)],[.85,ST1]]},
 cpunch:{d:.36,k:[[0,CR],[.08,S(.32,.08,.4,2.1,.4,2.5,-1.15,.35,1.15,-.25,-4)],[.14,S(.45,.1,.4,2.1,1.55,1.6,-1.15,.35,1.15,-.25,10,1)],[.26,S(.45,.1,.4,2.1,1.55,1.6,-1.15,.35,1.15,-.25,10,1)],[.36,CR]]},
 ckick:{d:.5,k:[[0,CR],[.1,S(.35,.08,.5,2.2,.95,2.4,-1,1.4,1.15,.2,-2,0,-60)],[.2,S(.55,.1,.5,2.2,.95,2.4,-1,1.4,1.35,1.5,10,1,-32)],[.34,S(.55,.1,.5,2.2,.95,2.4,-1,1.4,1.35,1.5,10,1,-32)],[.5,CR]]},
 jpunch:{d:.35,k:[[0,S(.1,0,1,2.6,.5,2.9,.5,-.9,.9,-.4)],[.1,S(.3,.05,.5,2.4,1.5,1.6,.3,-.7,.8,-.4,6,1)],[.35,S(.3,.05,.5,2.4,1.5,1.6,.3,-.7,.8,-.4,6,1)]]},
 jkick:{d:.4,k:[[0,S(.1,0,1,2.6,.9,2.5,.5,-.9,.9,-.4)],[.12,S(-.1,0,.5,2.2,.9,2.4,.3,-.9,1.45,1.4,6,1)],[.4,S(-.1,0,.5,2.2,.9,2.4,.3,-.9,1.45,1.4,6,1)]]},
 jheavy:{d:.5,k:[[0,S(0,0,2.5,2.8,2.6,2.8,.6,-.8,.9,-.5)],[.15,S(.6,.1,1.2,1,1.1,.9,.6,-.8,.9,-.3,8,1)],[.5,S(.6,.1,1.2,1,1.1,.9,.6,-.8,.9,-.3,8,1)]]},
 hit:{d:.4,k:[[0,HITP],[.4,S(-.2,-.25,-.4,.7,.2,1.2,-.7,-.3,.4,.15,-8,1)]]},
 airhit:{d:1,k:[[0,S(-.5,-.5,-.7,.6,.2,1.2,.3,-.6,.6,-.8,-6,1)]]},
 block:{d:1,k:[[0,S(.05,.1,.9,2.8,1.05,2.9,-.5,-.1,.6,.1)]]},
 cblock:{d:1,k:[[0,S(.3,.1,.9,2.8,1.05,2.9,-1.15,.35,1.15,-.25)]]},
 kd:{d:1,k:[[0,KOP]]},
 wakeup:{d:.25,k:[[0,KOP],[.25,ST1]]},
 win:{d:1,loop:1,k:[[0,S(-.05,-.1,2.7,2.8,2.6,2.7,-.5,-.1,.6,.1,0,1)],[.5,S(-.1,-.15,2.55,2.7,2.8,2.9,-.55,-.12,.65,.12,0,1)],[1,S(-.05,-.1,2.7,2.8,2.6,2.7,-.5,-.1,.6,.1,0,1)]]}};
function poseOf(f){const a=A[f.anim]||A.idle;const t=a.loop?(f.sf/60)%a.d:Math.min(f.animU,1)*a.d;const k=a.k;if(k.length===1)return k[0][1].slice();
 let i=0;while(i<k.length-2&&t>k[i+1][0])i++;const[t0,p0]=k[i],[t1,p1]=k[i+1];let u=Math.max(0,Math.min(1,(t-t0)/(t1-t0||1)));u=u*u*(3-2*u);return p0.map((v,j)=>v+(p1[j]-v)*u)}
const rot=(x,y,a)=>[x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a)];
function chain(g,x,y,segs,col,out){const p=[[x,y]];for(const[a,l]of segs){const q=p[p.length-1];p.push([q[0]+Math.sin(a)*l,q[1]+Math.cos(a)*l])}
 g.lineCap='round';g.lineJoin='round';for(const pass of[0,1]){g.strokeStyle=pass?col:out;segs.forEach((s,i)=>{g.lineWidth=s[2]+(pass?0:5);g.beginPath();g.moveTo(...p[i]);g.lineTo(...p[i+1]);g.stroke()})}return p}
function stripesOn(g,p0,p1,th,C){if(!C.stripes)return;g.strokeStyle=C.stripe;g.lineWidth=3;for(const u of[.3,.55,.8]){const x=p0[0]+(p1[0]-p0[0])*u,y=p0[1]+(p1[1]-p0[1])*u,dx=p1[0]-p0[0],dy=p1[1]-p0[1],l=Math.hypot(dx,dy)||1,px=-dy/l*th*.42,py=dx/l*th*.42;g.beginPath();g.moveTo(x-px,y-py);g.lineTo(x+px,y+py);g.stroke()}}
function arm(g,sx,sy,a1,a2,C,far){const col=far?C.dark:C.fur;const p=chain(g,sx,sy,[[a1,38,22],[a2,34,18]],col,C.out);stripesOn(g,p[0],p[1],22,C);stripesOn(g,p[1],p[2],18,C);
 const dx=Math.sin(a2),dy=Math.cos(a2);g.fillStyle='#e9eef8';g.strokeStyle=C.out;g.lineWidth=2;g.beginPath();g.arc(p[2][0]-dx*4,p[2][1]-dy*4,9.5,0,7);g.fill();g.stroke();
 const fx=p[2][0]+dx*9,fy=p[2][1]+dy*9;g.fillStyle=col;g.lineWidth=3;g.beginPath();g.arc(fx,fy,13,0,7);g.fill();g.stroke();
 g.strokeStyle=C.out;g.lineWidth=1.5;for(const o of[-5,0,5]){g.beginPath();g.moveTo(fx+dy*o*.9+dx*2,fy-dx*o*.9+dy*2);g.lineTo(fx+dy*o*.9+dx*10,fy-dx*o*.9+dy*10);g.stroke()}return[fx,fy]}
function leg(g,hx,hy,th,sh,C,far){const pc=far?C.pantsD:C.pants;const p=chain(g,hx,hy,[[th,46,36],[sh,44,29]],pc,C.out);
 g.fillStyle='#e9eef8';g.strokeStyle=C.out;g.lineWidth=2;g.beginPath();g.arc(p[2][0],p[2][1],11,0,7);g.fill();g.stroke();
 const fa=sh+PI/2,q=chain(g,p[2][0],p[2][1]+3,[[fa,26,16]],far?C.dark:C.fur,C.out);
 g.strokeStyle='#f3f3f3';g.lineWidth=2.2;for(const o of[-5,0,5]){g.beginPath();g.moveTo(q[1][0]+Math.sin(fa)*3-Math.cos(fa)*o*.5,q[1][1]+Math.cos(fa)*3+Math.sin(fa)*o*.5);g.lineTo(q[1][0]+Math.sin(fa)*9-Math.cos(fa)*o*.5,q[1][1]+Math.cos(fa)*9+Math.sin(fa)*o*.5);g.stroke()}}
function tail(g,C,t,sway){let x=-10,y=-8;const pts=[[x,y]];for(let i=0;i<8;i++){const a=PI+.1+i*.19+Math.sin(t*3-i*.7)*.12+sway;x+=Math.cos(a)*(C.wolf?14:15);y+=Math.sin(a)*(C.wolf?14:15);pts.push([x,y])}
 g.lineCap='round';for(const pass of[0,1])for(let i=0;i<8;i++){g.strokeStyle=pass?((C.stripes&&i%2)?C.stripe:C.fur):C.out;g.lineWidth=(C.wolf?16:12)-i*.7+(pass?0:4);g.beginPath();g.moveTo(...pts[i]);g.lineTo(...pts[i+1]);g.stroke()}}
function torso(g,C){const gr=g.createLinearGradient(-32,0,32,0);gr.addColorStop(0,C.dark);gr.addColorStop(.45,C.fur);gr.addColorStop(1,C.dark);g.fillStyle=gr;g.strokeStyle=C.out;g.lineWidth=4;
 g.beginPath();g.moveTo(-16,2);g.bezierCurveTo(-20,-16,-36,-26,-32,-50);g.quadraticCurveTo(0,-68,32,-50);g.bezierCurveTo(36,-26,20,-16,16,2);g.closePath();g.fill();g.stroke();
 g.fillStyle=C.belly;g.globalAlpha=C.wolf?.45:.95;g.beginPath();g.ellipse(4,-30,15,25,0,0,7);g.fill();g.globalAlpha=1;
 g.strokeStyle=C.out;g.lineWidth=2;g.globalAlpha=.55;for(const x of[-10,12]){g.beginPath();g.ellipse(x,-40,13,9,0,0,PI);g.stroke()}for(const y of[-27,-18,-9]){g.beginPath();g.moveTo(-8,y);g.lineTo(16,y);g.stroke()}g.beginPath();g.moveTo(4,-31);g.lineTo(4,-3);g.stroke();g.globalAlpha=1;
 if(C.stripes){g.strokeStyle=C.stripe;g.lineWidth=3.2;for(let i=0;i<4;i++){g.beginPath();g.moveTo(-31+i*2,-46+i*10);g.lineTo(-19+i*2,-41+i*10);g.stroke();g.beginPath();g.moveTo(33-i*2,-46+i*10);g.lineTo(22-i*2,-41+i*10);g.stroke()}}
 else{g.strokeStyle=C.stripe;g.lineWidth=2.5;g.beginPath();g.moveTo(-6,-52);g.lineTo(6,-36);g.stroke()}
 for(const[x,y,r]of[[-19,-48,14],[23,-48,15]]){g.fillStyle=C.fur;g.strokeStyle=C.out;g.lineWidth=3;g.beginPath();g.arc(x,y,r,0,7);g.fill();g.stroke()}}
function head(g,C,mouth,dead){g.lineJoin='round';
 if(C.wolf){g.fillStyle=C.dark;g.strokeStyle=C.out;g.lineWidth=3;g.beginPath();g.moveTo(-16,-40);for(let i=0;i<6;i++){g.lineTo(-30+i*3,-34+i*7);g.lineTo(-20+i*3,-30+i*7)}g.lineTo(-4,-6);g.lineTo(10,-30);g.closePath();g.fill();g.stroke()}
 g.fillStyle=C.fur;g.strokeStyle=C.out;g.lineWidth=3;g.beginPath();if(C.wolf){g.moveTo(-14,-34);g.lineTo(-8,-66);g.lineTo(8,-38)}else{g.arc(-7,-41,10,0,7)}g.fill();g.stroke();
 g.fillStyle=C.wolf?'#3a2220':'#e8f0ff';g.beginPath();if(C.wolf){g.moveTo(-10,-38);g.lineTo(-7,-56);g.lineTo(3,-40)}else{g.arc(-7,-41,5,0,7)}g.fill();
 g.save();g.translate(14,-8);g.rotate(mouth*.45);g.fillStyle=C.wolf?C.dark:C.light;g.strokeStyle=C.out;g.beginPath();g.ellipse(C.wolf?12:8,3,C.wolf?17:13,5.5,0,0,7);g.fill();g.stroke();
 if(mouth>.3){g.fillStyle='#fff';for(const x of C.wolf?[6,14,22]:[4,12]){g.beginPath();g.moveTo(x,-1);g.lineTo(x+3,-7);g.lineTo(x+6,-1);g.fill()}g.fillStyle='#a01830';g.fillRect(2,-1,C.wolf?20:14,2)}g.restore();
 g.fillStyle=C.fur;g.strokeStyle=C.out;g.beginPath();g.ellipse(4,-22,22,20,0,0,7);g.fill();g.stroke();
 if(C.stripes){g.fillStyle=C.belly;g.beginPath();g.ellipse(10,-11,14,9,0,0,7);g.fill();g.strokeStyle=C.stripe;g.lineWidth=3;for(const[a,b,c,d]of[[-2,-40,2,-31],[6,-41,8,-32],[-10,-26,-3,-24],[-10,-17,-2,-17]]){g.beginPath();g.moveTo(a,b);g.lineTo(c,d);g.stroke()}g.strokeStyle=C.out}
 g.fillStyle=C.wolf?C.light:C.belly;g.lineWidth=3;g.beginPath();g.ellipse(C.wolf?27:24,-16,C.wolf?22:15,C.wolf?9:10,0,0,7);g.fill();g.stroke();
 g.fillStyle='#10101a';g.beginPath();g.ellipse(C.wolf?47:37,-20,4.5,3.5,0,0,7);g.fill();
 if(C.stripes){g.strokeStyle='#dfe8ff';g.lineWidth=1.2;for(const o of[-3,2,7]){g.beginPath();g.moveTo(30,-12+o);g.lineTo(50,-16+o*1.6);g.stroke()}}
 if(dead){g.strokeStyle=C.out;g.lineWidth=3;g.beginPath();g.moveTo(9,-31);g.lineTo(19,-23);g.moveTo(19,-31);g.lineTo(9,-23);g.stroke()}
 else{g.fillStyle=C.eye;g.beginPath();g.moveTo(7,-30);g.lineTo(21,-26);g.lineTo(9,-23);g.closePath();g.fill();g.strokeStyle=C.out;g.lineWidth=4;g.beginPath();g.moveTo(3,-36);g.lineTo(23,-27);g.stroke()}
 if(C.wolf){g.strokeStyle='#b52a3a';g.lineWidth=1.8;g.beginPath();g.moveTo(2,-40);g.lineTo(12,-18);g.stroke()}}
// Leuchten an der Faust + Hyper-Beam (gemeinsam für Vektor- und Sprite-Figuren; im lokalen, nach vorn gespiegelten Raum)
export function attackFx(g,f,fist,glow){const m=f.move;
 if(f.state==='attack'&&m&&m.glow){
  const act=f.mf>=m.su-3&&f.mf<=m.su+m.ac+4,charge=m.proj&&f.mf>4&&f.mf<m.su+8;
  g.save();g.globalCompositeOperation='lighter';
  if(act||charge){const gr=g.createRadialGradient(fist[0],fist[1],2,fist[0],fist[1],40);gr.addColorStop(0,'#fff');gr.addColorStop(.35,glow);gr.addColorStop(1,'#0000');g.fillStyle=gr;g.beginPath();g.arc(fist[0],fist[1],40,0,7);g.fill()}
  if(m.beam&&f.mf>=m.su&&f.mf<m.su+m.ac){const pulse=.75+Math.sin(f.mf*1.3)*.25,h=44*pulse,x0=fist[0],BL=m.box?m.box[2]:560;
   const bg=g.createLinearGradient(0,fist[1]-h,0,fist[1]+h);bg.addColorStop(0,'#0000');bg.addColorStop(.35,glow);bg.addColorStop(.5,'#fff');bg.addColorStop(.65,glow);bg.addColorStop(1,'#0000');
   g.fillStyle=bg;g.fillRect(x0,fist[1]-h,BL,h*2);
   const eg=g.createLinearGradient(x0+BL-180,0,x0+BL,0);eg.addColorStop(0,'#fff0');eg.addColorStop(1,'#000f');g.globalCompositeOperation='destination-out';g.fillStyle=eg;g.fillRect(x0+BL-180,fist[1]-h-2,180,h*2+4)}
  g.restore()}}
// Zeichnet einen Kämpfer. Füße stehen bei (f.x, f.y); f nach rechts blickend, gespiegelt via f.facing.
export function drawFighter(g,f,clock,alpha=1,floorY=470){
 if(f.char.sprites)return drawSpriteFighter(g,f,clock,alpha,floorY);   // Sprite-Figur (Atlas) statt Vektor-Skelett
 const C=PAL[f.char.pal],po=poseOf(f),[tl,hd,ba1,ba2,fa1,fa2,bt,bs,ft,fs,hx,mouth,hy]=po;
 g.save();g.globalAlpha=alpha;
 if(f.comboFlash>0){const fa=f.comboFlash/EFFECT.comboFlash;g.save();g.globalCompositeOperation='lighter';g.fillStyle='#ffffff';g.globalAlpha=.55*fa;g.fillRect(-70,-165,140,170);g.restore()}
 if(alpha===1){g.fillStyle='#0008';g.beginPath();g.ellipse(f.x,floorY+4,Math.max(18,52-(floorY-f.y)*.15),10,0,0,7);g.fill()}
 g.translate(f.x,f.y);g.scale(f.facing,1);
 const drop=Math.max(Math.cos(bt)*46+Math.cos(bs)*44,Math.cos(ft)*46+Math.cos(fs)*44)+10;g.translate(hx,hy?hy:-drop);
 if(f.state==='tumble')g.rotate(-f.sf*.3);
 const sh=(x,y)=>rot(x,y,tl),bsx=sh(-18,-48),fsx=sh(22,-48),neck=sh(6,-58);
 tail(g,C,clock,f.state==='walk'?-.1:0);
 arm(g,bsx[0],bsx[1],ba1,ba2,C,1);leg(g,-10,0,bt,bs,C,1);
 g.save();g.rotate(tl);torso(g,C);g.restore();
 g.save();g.rotate(tl*.5);g.fillStyle=C.sash;g.strokeStyle=C.out;g.lineWidth=3;g.fillRect(-21,-14,42,15);g.strokeRect(-21,-14,42,15);g.beginPath();g.arc(10,-6,7,0,7);g.fill();g.stroke();
 const sw=Math.sin(clock*4)*3-hx*.15;for(const[o,l]of[[0,38],[10,30]]){g.beginPath();g.moveTo(8+o,-2);g.lineTo(2+o+sw,l);g.lineTo(12+o+sw,l-6);g.lineTo(16+o,-2);g.closePath();g.fill();g.stroke()}g.restore();
 leg(g,12,0,ft,fs,C,0);
 g.save();g.translate(neck[0],neck[1]);g.rotate(hd+tl*.4);head(g,C,mouth,f.anim==='hit'||f.state==='ko'||f.state==='knockdown');g.restore();
 const fist=arm(g,fsx[0],fsx[1],fa1,fa2,C,0);
 attackFx(g,f,fist,C.glow);
 g.restore()}
export function drawTrail(g,f,clock){for(const t of f.trail){g.save();g.filter='none';drawFighter(g,t,clock,Math.max(0,.28-t.age*.02),470);g.restore()}}
