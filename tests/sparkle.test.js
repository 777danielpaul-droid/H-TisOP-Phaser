// Funkel-Effekte (Hit / Siegesstoß / Siegespose): blinkende Sterne wie beim Feuerwerk statt flacher Formen. Logik + Zeichnen ohne Browser (Attrappen).
import{ParticleSystem,sparkIdx,GLT}from'../src/core/particles.js';
import{Effects}from'../src/core/effects.js';
let fails=0;const check=(n,ok,i='')=>{console.log((ok?'  ✓ ':'  ✗ ')+n+(ok?'':'  '+i));if(!ok)fails++};
const run=(ps,n)=>{for(let i=0;i<n;i++)ps.update()};

// --- Farbzuordnung: weiß/grau -> Atlas 36, Farben -> Farbton-Eimer
check('Farben: weiß/hellgrau = 36, Rot = 0, Cyan ≈ 18',sparkIdx('#ffffff')===36&&sparkIdx('#fff')===36&&sparkIdx('#ff0000')===0&&Math.abs(sparkIdx('#3fe0ff')-18)<=1,[sparkIdx('#fff'),sparkIdx('#ff0000'),sparkIdx('#3fe0ff')].join());
check('Ungültige Farbe fällt nicht um',sparkIdx('rot')===36&&sparkIdx(undefined)===36);

// --- sparkle: Anzahl, Bewegung, Ablauf
let ps=new ParticleSystem();ps.sparkle(100,100,{count:40,life:30});
check('sparkle erzeugt Sterne (Menge gedämpft über GLT.amt)',ps.tw.length===Math.max(1,Math.round(40*GLT.amt)),String(ps.tw.length));
const moved=ps.tw.filter(p=>p.vx||p.vy).length;run(ps,5);
check('Sterne fliegen auseinander',moved>=ps.tw.length-2&&ps.tw.some(p=>Math.hypot(p.x-100,p.y-100)>5));
run(ps,80);check('Sterne verschwinden wieder (keine Leichen)',ps.tw.length===0,String(ps.tw.length));

// --- delay: Sterne zünden nacheinander, bewegen sich erst danach
ps=new ParticleSystem();ps.sparkle(0,0,{count:30,delay:30,speed:5,life:40});
check('delay: Start mit negativem Alter',ps.tw.some(p=>p.age<0));const w=ps.tw.find(p=>p.age<-5),x0=w&&w.x;run(ps,2);
check('delay: wartende Sterne stehen still',!!w&&w.x===x0);

// --- Kugel: Endradius ≈ R, sphärisch (Mitte bleibt besetzt: z-Wert)
ps=new ParticleSystem();ps.sparkleBall(0,0,'#ff4a4a',200,{count:120,life:200,gravity:0});run(ps,70);
const rs=ps.tw.map(p=>Math.hypot(p.x,p.y)),mx=Math.max(...rs);
check('Kugel erreicht ~Radius R (±15 %)',mx>170&&mx<230,mx.toFixed(0));
check('Kugel ist räumlich (Tiefenwerte −1…1)',Math.min(...ps.tw.map(p=>p.z))<-.8&&Math.max(...ps.tw.map(p=>p.z))>.8);

// --- Ring: läuft nach außen, flach (70 % Höhe)
ps=new ParticleSystem();ps.sparkleRing(0,0,'#fff',100,{count:40,life:80});run(ps,50);
const ax=Math.max(...ps.tw.map(p=>Math.abs(p.x))),ay=Math.max(...ps.tw.map(p=>Math.abs(p.y)));
check('Funkelring läuft auf ~R aus, flach (Höhe ≈ 0,7 · Breite)',ax>80&&ax<115&&ay/ax>.6&&ay/ax<.8,ax.toFixed(0)+'/'+ay.toFixed(0));

// --- ring()/shock(): tragen jetzt eigene Funkelpunkte; Glanzstern: Verzögerung + Ablauf
ps=new ParticleSystem();ps.ring(0,0,'#fff',100);ps.shock(0,0,'#fff',300);ps.glint(0,0,'#fff',60,10,5);
check('ring/shock haben Funkelpunkte',ps.rings[0].sp.length>=5&&ps.sh[0].sp.length>=4);
check('glint startet verzögert, läuft ab',ps.gn[0].d===5&&(run(ps,4),ps.gn.length===1)&&(run(ps,20),ps.gn.length===0));

// --- Obergrenze (Leistung)
ps=new ParticleSystem();for(let i=0;i<60;i++)ps.sparkleBall(0,0,'#fff',100,{count:100});
check('Funkelsterne sind gedeckelt (<2000)',ps.tw.length<2000,String(ps.tw.length));

// --- Effekte: Treffer, Siegesstoß, Siegespose
const E=(f)=>{const p=new ParticleSystem(),fx=new Effects(p);f(fx,p);return p};
const h1=E(fx=>fx.hit(0,0,1,'#3fe0ff',1)),h4=E(fx=>fx.hit(0,0,4,'#3fe0ff',1));
check('Treffer funkelt (Sterne + Glanzstern), stärker bei mehr Power',h1.tw.length>=2&&h4.tw.length>h1.tw.length&&h4.gn.length>h1.gn.length,h1.tw.length+'/'+h4.tw.length);
check('Treffer ohne flache Comic-Formen (kein Zackenstern/Schlagklinge)',h4.pw.length===0&&h4.sl.length===0);
const ko=E(fx=>fx.ko(0,0,'#ffd23f'));
check('Siegesstoß (K.O.): große Funkelkugeln + viele Glanzsterne',ko.tw.length>100&&ko.gn.length>=5&&ko.pw.length===0,ko.tw.length+'/'+ko.gn.length);
const win=E(fx=>fx.win(0,0,'#7dffc8'));
check('Wechsel in die Siegespose: Funkelkugel, Fontäne, Glitzerregen',win.tw.length>100&&win.gn.length>=5&&win.pw.length===0,win.tw.length+'/'+win.gn.length);
// Dauer-Effekt der Siegespose: erzeugt laufend Sterne, ohne sich aufzustauen
{const p=new ParticleSystem(),fx=new Effects(p),f={x:480,y:470,char:{glow:'#ff7ae6',size:1,id:'x'}};let peak=0,gl=0;for(let t=0;t<600;t++){fx.celebrate(f,t,null);p.update();peak=Math.max(peak,p.tw.length);gl+=p.gn.length?1:0}
 check('celebrate: laufend Funkelsterne, Glanzsterne blitzen, kein Aufstauen',peak>40&&peak<900&&gl>20,'Spitze '+peak+', Glanzstern-Frames '+gl)}

// --- Zeichnen mit Attrappen (kein Browser): alle Effekte, keine Ausnahme, Funkelsterne rufen drawImage
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({createRadialGradient:()=>({addColorStop(){}}),fillRect(){},set fillStyle(v){}})})};
const calls={img:0,stroke:0};const g=new Proxy({},{get:(t,k)=>k==='drawImage'?()=>{calls.img++}:k==='stroke'?()=>{calls.stroke++}:k==='createRadialGradient'?()=>({addColorStop(){}}):()=>{},set:()=>true});
{const p=new ParticleSystem(),fx=new Effects(p);fx.hit(300,300,3,'#ff4a4a',1);fx.ko(480,300,'#3fe0ff');fx.win(480,300,'#ffd23f');fx.slam(480,400,'#fff');fx.combo(300,300,7,'#fff',1);fx.block(300,300,'#fff');fx.launch(300,400,'#fff');
 let ok=true;try{for(let i=0;i<90;i++){p.update();p.draw(g,true)}}catch(e){ok=false;console.log(e)}
 check('Zeichnen aller Effekte läuft ohne Fehler (Funkelsterne, Glanzsterne, Ringe)',ok&&calls.img>2000,'drawImage-Aufrufe: '+calls.img)}
if(fails){console.log(fails+' Test(s) fehlgeschlagen');process.exit(1)}console.log('Funkel-Tests bestanden');
