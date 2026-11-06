export class ParticleSystem{
 constructor(){this.p=[];this.rings=[];this.fl=[];this.sl=[];this.sh=[];this.gl=[];this.sd=[];this.pw=[];this.mk=[];this.bt=[];this.rk=[];this.onBoom=null}
 burst(x,y,o={}){const n=o.count||12;
  for(let i=0;i<n;i++){const a=(o.angle!==undefined?o.angle:Math.random()*6.283)+(Math.random()-.5)*(o.spread!==undefined?o.spread:6.283);
   const s=(o.speed||6)*(.4+Math.random()*.9);const l=(o.life||24)*(.7+Math.random()*.5);
   this.p.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:l,max:l,size:o.size||3,color:o.color||'#fff',g:o.gravity!==undefined?o.gravity:.15,streak:o.streak!==undefined?o.streak:1})}}
 // Schnelle, helle Impact-Partikel (Treffer-Blitz)
 spark(x,y,color,count=8,speed=10){for(let i=0;i<count;i++){
  const a=Math.random()*6.283,s=speed*(.4+Math.random()*1.2),l=(8+Math.random()*10)|0;
  this.p.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:l,max:l,size:1.5+Math.random()*2,color,g:.25,streak:.7,flash:true})}}
 // Sternförmige Explosion für Combos / Heavy-Hits
 starburst(x,y,color,count=16){for(let i=0;i<count;i++){
  const a=(i/count)*6.283+Math.random()*.5,s=2+Math.random()*7,l=(16+Math.random()*24)|0;
  this.p.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:l,max:l,size:2.5,g:.04,streak:1.4,color})}}
 // Schwebenes Konfetti für Wins
 confetti(x,y,color,count=30){const cols=[color,'#ffffff','#ffd23f','#ff4a4a','#3fe0ff','#7dffc8'];
  for(let i=0;i<count;i++){const a=Math.random()*6.283,s=.8+Math.random()*3,l=(50+Math.random()*90)|0;
   this.p.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-.6,life:l,max:l,size:2.5+Math.random()*3.5,color:cols[i%cols.length],g:.025,streak:0,confetti:true})}}
 // Lichtblitz mit 4-Zacken-Stern (Impact-Flare)
 flare(x,y,color,size=60,life=10,rot=0){this.fl.push({x,y,color,size,life,l0:life,rot})}
 // Klingen-/Schlagstreifen entlang der Schlagrichtung
 slash(x,y,color,ang,len=90,life=9,w=7){this.sl.push({x,y,color,ang,len,life,l0:life,w})}
 // Flache Bodenwelle (Landung, Wandbruch, Knockdown)
 shock(x,y,color,max=140,life=20){this.sh.push({x,y,color,r:8,max,life,l0:life})}
 // ---- Glitzer: funkelnde 4-Zack-Sterne (Farben wechseln, flackern) ----
 glitter(x,y,o={}){if(this.gl.length>1000)return;const n=o.count||14,cols=o.colors||['#ffffff','#ffe27a','#7df9ff','#ff7ae6'];
  for(let i=0;i<n;i++){const a=(o.angle!==undefined?o.angle:Math.random()*6.283)+(Math.random()-.5)*(o.spread!==undefined?o.spread:6.283),s=(o.speed||6)*(o.exact?1:.25+Math.random()),l=(o.life||40)*(.6+Math.random()*.8);
   this.gl.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:l,max:l,size:(o.size||4)*(.5+Math.random()),col:cols[(Math.random()*cols.length)|0],rot:Math.random()*3,vr:(Math.random()-.5)*.3,g:o.gravity!==undefined?o.gravity:.12,ph:Math.random()*6.28,age:0})}}
 // Drehende Splitter/Konfetti-Plättchen (kippen beim Fallen = glitzern)
 shard(x,y,o={}){if(this.sd.length>500)return;const n=o.count||8,cols=o.colors||['#ffffff','#ffe27a','#7df9ff','#ff7ae6'];
  for(let i=0;i<n;i++){const a=(o.angle!==undefined?o.angle:Math.random()*6.283)+(Math.random()-.5)*(o.spread!==undefined?o.spread:6.283),s=(o.speed||6)*(.3+Math.random()),l=(o.life||50)*(.7+Math.random()*.6);
   this.sd.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:l,max:l,w:(o.w||5)*(.6+Math.random()),h:(o.h||10)*(.6+Math.random()),col:cols[(Math.random()*cols.length)|0],rot:Math.random()*6.283,vr:(Math.random()-.5)*.4,g:o.gravity!==undefined?o.gravity:.3,drag:o.drag||.985,ph:Math.random()*6.28,age:0})}}
 // Comic-Zackenstern (Treffer-Explosion) + Fadenkreuz-Hitmarker + Blitzbogen
 starpop(x,y,color,size=70,life=9){this.pw.push({x,y,color,size,life,l0:life,rot:Math.random()*6.283,n:9+((Math.random()*5)|0),seed:Math.random()*100})}
 marker(x,y,color,size=40,life=11){this.mk.push({x,y,color,size,life,l0:life,rot:Math.PI/4+(Math.random()-.5)*.25})}
 bolt(x,y,color,ang,len=120,life=7){const pts=[[x,y]];let px=x,py=y,a=ang;const n=6;for(let i=0;i<n;i++){a+=(Math.random()-.5)*1.1;px+=Math.cos(a)*len/n;py+=Math.sin(a)*len/n;pts.push([px,py])}this.bt.push({pts,color,life,l0:life})}
 // Feuerwerksrakete: steigt auf, explodiert in Glitzer-Ringen
 rocket(x,y,ty,color){this.rk.push({x,y,vy:-(9+Math.random()*3),ty,color,age:0})}
 boom(r){const cols=[r.color,'#ffffff','#ffe27a'],n=46;this.flare(r.x,r.y,r.color,170,20,Math.random());this.ring(r.x,r.y,r.color,150);this.ring(r.x,r.y,'#ffffff',90);
  for(const[sp,gs]of[[8,.06],[4.6,.05]])for(let i=0;i<n;i++){const a=i/n*6.283+Math.random()*.1,l=50+Math.random()*30;this.gl.push({x:r.x,y:r.y,vx:Math.cos(a)*sp*(.92+Math.random()*.16),vy:Math.sin(a)*sp*(.92+Math.random()*.16),life:l,max:l,size:4+Math.random()*3,col:cols[(Math.random()*3)|0],rot:Math.random()*3,vr:(Math.random()-.5)*.3,g:gs,ph:Math.random()*6.28,age:0})}
  this.starburst(r.x,r.y,r.color,14);if(this.onBoom)this.onBoom(r)}
 ring(x,y,color,max=60){this.rings.push({x,y,r:6,max,color,life:14,l0:14})}
 update(){for(const p of this.p){p.x+=p.vx;p.y+=p.vy;p.vy+=p.g;p.vx*=.96;p.life--}
  this.p=this.p.filter(p=>p.life>0);
  for(const r of this.rings){r.r+=(r.max-r.r)*.25;r.life--}this.rings=this.rings.filter(r=>r.life>0);
  for(const l of[this.fl,this.sl])for(const e of l)e.life--;this.fl=this.fl.filter(e=>e.life>0);this.sl=this.sl.filter(e=>e.life>0);
  for(const q of this.gl){q.x+=q.vx;q.y+=q.vy;q.vy+=q.g;q.vx*=.97;q.rot+=q.vr;q.life--;q.age++}this.gl=this.gl.filter(q=>q.life>0);
  for(const q of this.sd){q.x+=q.vx;q.y+=q.vy;q.vy+=q.g;q.vx*=q.drag;q.vy*=q.drag;q.rot+=q.vr;q.life--;q.age++}this.sd=this.sd.filter(q=>q.life>0);
  for(const l of[this.pw,this.mk,this.bt])for(const e of l)e.life--;this.pw=this.pw.filter(e=>e.life>0);this.mk=this.mk.filter(e=>e.life>0);this.bt=this.bt.filter(e=>e.life>0);
  for(const r of this.rk){r.y+=r.vy;r.vy*=.985;r.age++;this.glitter(r.x,r.y,{count:2,speed:1.2,life:24,size:2.6,colors:[r.color,'#ffffff'],gravity:.05});if(r.y<=r.ty||r.vy>-2.4){r.dead=true;this.boom(r)}}this.rk=this.rk.filter(r=>!r.dead);
  for(const r of this.sh){r.r+=(r.max-r.r)*.18;r.life--}this.sh=this.sh.filter(r=>r.life>0)}
 draw(g){g.save();g.globalCompositeOperation='lighter';g.lineCap='round';
  for(const p of this.p){const a=p.life/p.max;g.globalAlpha=a;g.strokeStyle=p.color;
   if(p.confetti){g.fillStyle=p.color;g.fillRect(p.x-1.5,p.y-1.5,p.size*a*2,p.size*a*2)}
   else{g.lineWidth=Math.max(.8,p.size*a);
    g.beginPath();g.moveTo(p.x,p.y);g.lineTo(p.x-p.vx*p.streak*1.6,p.y-p.vy*p.streak*1.6);g.stroke()}}
  for(const r of this.rings){g.globalAlpha=r.life/r.l0;g.strokeStyle=r.color;g.lineWidth=3*r.life/r.l0+1;g.beginPath();g.ellipse(r.x,r.y,r.r,r.r*.7,0,0,7);g.stroke()}
  for(const r of this.sh){const u=r.life/r.l0;g.globalAlpha=u*.9;g.strokeStyle=r.color;g.lineWidth=1+5*u;g.beginPath();g.ellipse(r.x,r.y,r.r,r.r*.16,0,0,7);g.stroke();g.globalAlpha=u*.5;g.strokeStyle='#fff';g.lineWidth=1+2*u;g.beginPath();g.ellipse(r.x,r.y,r.r*.96,r.r*.15,0,0,7);g.stroke()}
  for(const e of this.sl){const u=e.life/e.l0,L=e.len*(1.15-.35*u),w=e.w*u;g.save();g.translate(e.x,e.y);g.rotate(e.ang);
   for(const[c,k,a]of[[e.color,1,.75],['#ffffff',.42,.95]]){g.globalAlpha=a*u;g.fillStyle=c;g.beginPath();g.moveTo(-L/2,0);g.lineTo(0,-w*k);g.lineTo(L/2,0);g.lineTo(0,w*k);g.fill()}g.restore()}
  for(const e of this.fl){const u=e.life/e.l0,S=e.size*(.5+.7*(1-u)),gr=g.createRadialGradient(e.x,e.y,0,e.x,e.y,S);gr.addColorStop(0,'#ffffff');gr.addColorStop(.25,e.color);gr.addColorStop(1,'#0000');
   g.globalAlpha=u;g.fillStyle=gr;g.fillRect(e.x-S,e.y-S,S*2,S*2);g.save();g.translate(e.x,e.y);g.rotate(e.rot);g.fillStyle='#fff';g.globalAlpha=u*.9;
   for(let k=0;k<2;k++){g.rotate(k?1.5708:0);g.beginPath();g.moveTo(-S*1.5,0);g.lineTo(0,-S*.07);g.lineTo(S*1.5,0);g.lineTo(0,S*.07);g.fill()}g.restore()}
  const star=(x,y,sz,rot)=>{g.save();g.translate(x,y);g.rotate(rot);g.beginPath();g.moveTo(0,-sz);g.lineTo(sz*.17,-sz*.17);g.lineTo(sz,0);g.lineTo(sz*.17,sz*.17);g.lineTo(0,sz);g.lineTo(-sz*.17,sz*.17);g.lineTo(-sz,0);g.lineTo(-sz*.17,-sz*.17);g.closePath();g.fill();g.restore()};
  for(const q of this.sd){const u=q.life/q.max,fl=Math.abs(Math.cos(q.age*.35+q.ph));g.globalAlpha=Math.min(1,u*1.8)*(.5+.5*fl);g.fillStyle=q.col;g.save();g.translate(q.x,q.y);g.rotate(q.rot);g.fillRect(-q.w/2,-q.h*fl/2,q.w,Math.max(1,q.h*fl));g.restore()}
  for(const q of this.gl){const u=q.life/q.max,tw=.5+.5*Math.sin(q.age*.9+q.ph),a=Math.min(1,u*1.6)*(.45+.55*tw);g.globalAlpha=a;g.fillStyle=q.col;star(q.x,q.y,q.size*(.6+.4*u),q.rot);g.globalAlpha=a*.9;g.fillStyle='#fff';star(q.x,q.y,q.size*.42,q.rot)}
  for(const e of this.bt){const u=e.life/e.l0;for(const[c,w,a]of[[e.color,5,.55],['#ffffff',1.8,1]]){g.globalAlpha=a*u;g.strokeStyle=c;g.lineWidth=w;g.beginPath();e.pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.stroke()}}
  for(const e of this.pw){const u=e.life/e.l0,sc=.5+.5*Math.sqrt(1-u),n=e.n;for(const[k,c,a]of[[1,e.color,.9],[.55,'#ffffff',1]]){g.globalAlpha=Math.min(1,u*1.5)*a;g.fillStyle=c;g.beginPath();for(let i=0;i<n*2;i++){const r=e.size*sc*k*(i%2?.42:.78+.45*(Math.sin(e.seed+i*12.9)*.5+.5)),an=i*Math.PI/n+e.rot;i?g.lineTo(e.x+Math.cos(an)*r,e.y+Math.sin(an)*r):g.moveTo(e.x+Math.cos(an)*r,e.y+Math.sin(an)*r)}g.closePath();g.fill()}}
  for(const e of this.mk){const u=e.life/e.l0,L=e.size*(1+(1-u)*.5);g.save();g.translate(e.x,e.y);g.rotate(e.rot);g.lineCap='square';for(const[c,w,a]of[[e.color,3+u*7,.45],['#ffffff',1.5+u*3,1]]){g.globalAlpha=a*u;g.strokeStyle=c;g.lineWidth=w;g.beginPath();for(let k=0;k<4;k++){g.rotate(Math.PI/2);g.moveTo(L*.28,0);g.lineTo(L,0)}g.stroke()}g.restore()}
  for(const r of this.rk){g.globalAlpha=.55;g.fillStyle=r.color;g.beginPath();g.arc(r.x,r.y,9,0,7);g.fill();g.globalAlpha=1;g.fillStyle='#fff';g.beginPath();g.arc(r.x,r.y,3.2,0,7);g.fill()}
  g.restore()}
}
