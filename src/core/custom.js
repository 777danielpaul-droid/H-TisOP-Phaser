// Eigene Figur: reine Logik ohne DOM (testbar in Node). Gegenstück zu tools/import-tiger-sheets.py – gleiche Sheet-Namen, gleiches Raster,
// gleiche Maßstab-/Ankerlogik. Die Oberfläche (Upload, Vorschau, Speichern) steht in render/customstudio.js.
// Ablauf: Hintergrund entfernen -> Sheet in Zellen schneiden -> Zelle 1 (neutrale Haltung) bestimmt den Maßstab -> je Frame Fußlinie + Körpermitte ankern
// -> Animationen aus den vorhandenen Sheets bauen, Lücken mit Behelfen füllen -> Figurenwerte (Name, Moveset-Vorlage, Stats).
export const CUS_STAND_H=300,CUS_AIR_CENTER=105,CUS_A_BODY=48,CUS_A_TRIM=8,CUS_ATLAS_W=4096;
// Sheets: key, Spalten, Zeilen, Beschriftung, core = zum Start empfohlen. Lesereihenfolge links->rechts, oben->unten; Zelle 1 = neutrale Kampfhaltung (Referenz für den Maßstab).
export const CUS_SHEETS=[
 {key:'idle_1',c:3,r:2,core:1,label:'Idle – Teil 1',hint:'Atmen/Wippen in Kampfhaltung (Pflicht)'},
 {key:'idle_2',c:3,r:2,core:1,label:'Idle – Teil 2',hint:'Fortsetzung, Schleife'},
 {key:'walk_1',c:3,r:2,core:1,label:'Gehen – Teil 1',hint:'Laufzyklus vorwärts'},
 {key:'walk_2',c:3,r:2,core:1,label:'Gehen – Teil 2',hint:'Laufzyklus, andere Seite'},
 {key:'punch',c:3,r:2,core:1,label:'Leichter Schlag',hint:'Jab'},
 {key:'kick',c:3,r:2,core:1,label:'Tritt',hint:'High Kick'},
 {key:'jump',c:3,r:2,core:1,label:'Sprung',hint:'Steigen, Scheitel, Fallen'},
 {key:'hit',c:3,r:2,core:1,label:'Treffer',hint:'Leicht & schwer getroffen'},
 {key:'heavy',c:3,r:2,label:'Schwerer Schlag',hint:''},
 {key:'crouch',c:3,r:2,label:'Ducken',hint:'inkl. Duck-Block'},
 {key:'crouch_atk',c:3,r:2,label:'Duck-Angriffe',hint:'Schlag + Fußfeger'},
 {key:'air_atk',c:4,r:2,label:'Luft-Angriffe',hint:'Schlag, Tritt, Überkopf'},
 {key:'dash',c:3,r:2,label:'Dash',hint:'Boden- und Luft-Dash'},
 {key:'claw',c:4,r:2,label:'Aufwärts-Special',hint:'Rising-Move'},
 {key:'special',c:4,r:2,label:'Energie-Special',hint:''},
 {key:'block',c:3,r:2,label:'Block',hint:''},
 {key:'down',c:4,r:2,label:'Knockdown / KO',hint:'Fliegen, Fallen, Liegen'},
 {key:'getup',c:3,r:2,label:'Aufstehen',hint:''},
 {key:'win',c:3,r:2,label:'Siegerpose',hint:''}];
export const CUS_GRID={};for(const s of CUS_SHEETS)CUS_GRID[s.key]=[s.c,s.r];
// Fliegende Treffer-Frames: Körpermitte statt Fußlinie verankern
const CUS_CENTER=new Set(['down:1','down:2','down:3']);
// Spiel-Animation -> Frames [Sheet,[Zellen ab 0]]; erster Teil ist Pflicht, weitere Teile sind optional (fehlen sie, läuft die Animation kürzer)
export const CUS_ANIMS={
 idle:{parts:[['idle_1',[0,1,2,3,4,5]],['idle_2',[1,2,3,4,5]]],loop:1,fps:12},
 walk:{parts:[['walk_1',[1,2,3,4,5]],['walk_2',[1,2,3,4,5]]],loop:1,fps:16},
 dash:{parts:[['dash',[2,3]]],loop:1,fps:12,lean:.04},airdash:{parts:[['dash',[4,5]]],loop:1,fps:12,lean:.1},
 air:{parts:[['jump',[1,2,3,4,5]]]},crouch:{parts:[['crouch',[2,3]]],loop:1,fps:4},cblock:{parts:[['crouch',[4]]]},
 punch:{parts:[['punch',[1,2,3,4,5]]]},heavy:{parts:[['heavy',[1,2,3,4,5]]]},kick:{parts:[['kick',[1,2,3,4,5]]]},
 cpunch:{parts:[['crouch_atk',[1,2,2]]]},ckick:{parts:[['crouch_atk',[3,4,4,5]]]},
 jpunch:{parts:[['air_atk',[1,2,2]]]},jkick:{parts:[['air_atk',[3,4,5]]]},jheavy:{parts:[['air_atk',[6,7,7]]]},
 upper:{parts:[['claw',[1,2,3,4,5,6,7]]]},special:{parts:[['special',[1,2,3,4,5,6,7]]]},
 hit:{parts:[['hit',[1,2,3,4]]]},airhit:{parts:[['down',[1,2,3]]]},kd:{parts:[['down',[4,5,6,7]]]},wakeup:{parts:[['getup',[1,2,3,4,5]]]},
 block:{parts:[['block',[2]]]},win:{parts:[['win',[1,2,3,4,5]]],loop:1,fps:5}};
// Namen für die Vorschau-Auswahl
export const CUS_ANIM_LABELS={idle:'Idle',walk:'Gehen',air:'Sprung',crouch:'Ducken',dash:'Dash',airdash:'Luft-Dash',punch:'Schlag',heavy:'Schwerer Schlag',kick:'Tritt',cpunch:'Duck-Schlag',ckick:'Fußfeger',jpunch:'Luft-Schlag',jkick:'Luft-Tritt',jheavy:'Luft-Überkopf',upper:'Aufwärts-Special',special:'Energie-Special',hit:'Treffer',airhit:'Luft-Treffer',kd:'Knockdown',wakeup:'Aufstehen',block:'Block',cblock:'Duck-Block',win:'Sieg'};
export function cusNeededCells(){const need={};for(const a of Object.values(CUS_ANIMS))for(const[sh,idx]of a.parts){(need[sh]||(need[sh]=new Set()));idx.forEach(i=>need[sh].add(i))}return need}

// ---------- Hintergrund entfernen (RGBA in-place) ----------
// Reihenfolge: vorhandene Transparenz -> Chroma-Grün (#00FF00) -> Hintergrundfarbe der Ecken (nur was mit dem Rand verbunden ist)
export function cusKeyOut(d,w,h){const n=w*h;let tr=0,gr=0;
 for(let i=0;i<n;i++)if(d[i*4+3]<250)tr++;
 if(tr/n>.02)return'Transparenz';
 for(let i=0;i<n;i++){const r=d[i*4],g=d[i*4+1],b=d[i*4+2];if(g-Math.max(r,b)>100)gr++}
 if(gr/n>.15){
  for(let i=0;i<n;i++){const o=i*4,r=d[o],g=d[o+1],b=d[o+2],m=Math.max(r,b),dd=g-m;
   d[o+3]=Math.round(Math.min(1,Math.max(0,(70-dd)/40))*255);if(dd>0)d[o+1]=m}   // Grün-Saum entfernen
  return'Chroma-Grün'}
 // Notlösung: Hintergrundfarbe = Median des Rands, Flutfüllung vom Rand aus
 const edge=[];for(let x=0;x<w;x++){edge.push((x)*4,((h-1)*w+x)*4)}for(let y=0;y<h;y++){edge.push((y*w)*4,(y*w+w-1)*4)}
 const med=c=>{const a=edge.map(o=>d[o+c]).sort((p,q)=>p-q);return a[a.length>>1]},bg=[med(0),med(1),med(2)];
 const near=i=>{const o=i*4;return Math.max(Math.abs(d[o]-bg[0]),Math.abs(d[o+1]-bg[1]),Math.abs(d[o+2]-bg[2]))<38};
 const seen=new Uint8Array(n),st=new Int32Array(n);let sp=0;
 const push=i=>{if(!seen[i]&&near(i)){seen[i]=1;st[sp++]=i}};
 for(let x=0;x<w;x++){push(x);push((h-1)*w+x)}for(let y=0;y<h;y++){push(y*w);push(y*w+w-1)}
 while(sp){const i=st[--sp],x=i%w,y=(i-x)/w;if(x>0)push(i-1);if(x<w-1)push(i+1);if(y>0)push(i-w);if(y<h-1)push(i+w)}
 for(let i=0;i<n;i++)d[i*4+3]=seen[i]?0:255;
 return'Hintergrundfarbe der Ecken'}

// ---------- Raster ----------
function cusRuns(p){const r=[];let i=0;const n=p.length;while(i<n){if(p[i]>0){let j=i,m=0;while(j<n&&p[j]>0){m+=p[j];j++}r.push([i,j,m]);i=j}else i++}return r}
function cusPick(p,n){let r=cusRuns(p);
 if(r.length>n){let mx=0;for(const x of r)if(x[2]>mx)mx=x[2];const big=r.filter(x=>x[2]>=.03*mx);if(big.length>=n)r=big}
 while(r.length>n){let k=0,bg=Infinity;for(let i=0;i<r.length-1;i++){const g=r[i+1][0]-r[i][1];if(g<bg){bg=g;k=i}}r[k][1]=r[k+1][1];r[k][2]+=r[k+1][2];r.splice(k+1,1)}
 return r.length===n?r:null}
function cusBounds(r,total,n){if(!r)return[Array.from({length:n+1},(_,i)=>Math.round(i*total/n)),false];
 const b=[0];for(let i=0;i<n-1;i++)b.push((r[i][1]+r[i+1][0])>>1);b.push(total);return[b,true]}
// Zellen [x0,y0,x1,y1]; ok=false: Lücken zwischen den Frames nicht gefunden, gleichmäßig geteilt
export function cusSliceCells(d,w,h,cols,rows){
 const rowSum=new Float64Array(h);for(let y=0;y<h;y++){let s=0;for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>CUS_A_BODY)s++;rowSum[y]=s}
 const[yb,okY]=cusBounds(cusPick(rowSum,rows),h,rows);let ok=okY;const cells=[];
 for(let r=0;r<rows;r++){const colSum=new Float64Array(w);
  for(let y=yb[r];y<yb[r+1];y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>CUS_A_BODY)colSum[x]++;
  const[xb,okX]=cusBounds(cusPick(colSum,cols),w,cols);ok=ok&&okX;
  for(let c=0;c<cols;c++)cells.push([xb[c],yb[r],xb[c+1],yb[r+1]])}
 return{cells,ok}}
// Zuschnitt (inkl. Leuchten), Körperhöhe/Fußlinie (Alpha > 48) und horizontaler Schwerpunkt (Median) einer Zelle; null = leer
export function cusMeasureCell(d,w,x0,y0,x1,y1){
 let tx0=1e9,tx1=-1,ty0=1e9,ty1=-1,bt=1e9,bb=-1,edge=false;const col=new Float64Array(x1-x0);let tot=0;
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const a=d[(y*w+x)*4+3];
  if(a>CUS_A_TRIM){if(x<tx0)tx0=x;if(x>tx1)tx1=x;if(y<ty0)ty0=y;if(y>ty1)ty1=y}
  if(a>CUS_A_BODY){if(y<bt)bt=y;if(y>bb)bb=y;col[x-x0]++;tot++;if(y===y0||y===y1-1||x===x0||x===x1-1)edge=true}}
 if(bb<0)return null;let acc=0,anchor=x0;for(let i=0;i<col.length;i++){acc+=col[i];if(acc>=tot/2){anchor=x0+i;break}}
 return{crop:[Math.max(tx0-2,x0),Math.max(ty0-2,y0),Math.min(tx1+3,x1),Math.min(ty1+3,y1)],top:bt,foot:bb+1,anchor,edge}}
// Plan für ein Sheet: welche Bereiche mit welchem Maßstab/Anker in den Atlas kommen. need = Zell-Indizes (Set/Array), sonst alle benutzten.
export function cusPlanSheet(key,d,w,h,need){const[cols,rows]=CUS_GRID[key];const idxs=[...(need||cusNeededCells()[key]||[])].sort((a,b)=>a-b);const notes=[];
 const{cells,ok}=cusSliceCells(d,w,h,cols,rows),ms=cells.map(c=>cusMeasureCell(d,w,c[0],c[1],c[2],c[3]));
 if(!ms[0])return{error:'Zelle 1 ist leer – dort muss die neutrale Kampfhaltung stehen',notes,frames:[]};
 if(!ok)notes.push('Raster gleichmäßig geteilt – Frames liegen evtl. nicht sauber in den Zellen (mehr Abstand zwischen den Zellen lassen)');
 const href=ms[0].foot-ms[0].top,s=CUS_STAND_H/href;
 if(href<200)notes.push(`Niedrige Auflösung (Standhöhe nur ${href} px, besser ab 300 px) – wirkt weich`);
 const frames=[];
 for(const i of idxs){const m=ms[i];if(i>=ms.length||!m){notes.push(`Zelle ${i+1} ist leer oder fehlt`);continue}
  if(m.edge)notes.push(`Zelle ${i+1}: Figur berührt den Zellrand (evtl. abgeschnitten)`);
  const[x0,y0,x1,y1]=m.crop,dw=Math.max(1,Math.round((x1-x0)*s)),dh=Math.max(1,Math.round((y1-y0)*s));
  const center=CUS_CENTER.has(key+':'+i);
  frames.push({name:key+'_'+i,sx:x0,sy:y0,sw:x1-x0,sh:y1-y0,dw,dh,ox:center?Math.floor(-dw/2):Math.round((x0-m.anchor)*s),oy:center?-(CUS_AIR_CENTER+(dh>>1)):Math.round((y0-m.foot)*s)})}
 return{frames,scale:s,href,ok,notes}}

// ---------- Animationen ----------
export function cusBuildAnims(have){const out={};
 for(const k in CUS_ANIMS){const sp=CUS_ANIMS[k];let fr=[],bad=false;
  sp.parts.forEach(([sh,idx],pi)=>{if(bad)return;const nm=idx.map(i=>sh+'_'+i);if(nm.every(n=>have.has(n)))fr.push(...nm);else if(pi===0)bad=true});
  if(!bad&&fr.length){const o={...sp};delete o.parts;out[k]={...o,frames:fr}}}
 return out}
// Fehlende Animationen mit Behelfen aus den vorhandenen füllen (wie bei den mitgelieferten Figuren). Braucht mindestens 'idle'.
export function cusCompleteAnims(A){if(!A.idle)return null;const O={...A},i0=[A.idle.frames[0]],put=(k,v)=>{if(!O[k])O[k]={...v}};
 const P=A.punch||A.heavy||A.kick||A.upper||A.special||{frames:i0,lean:.14};
 put('walk',{frames:A.idle.frames,loop:1,fps:22,bob:4,lean:.07});
 put('crouch',{frames:i0,squash:.74});put('cblock',{frames:A.block?A.block.frames:i0,squash:.76});
 put('air',{frames:i0,lean:.05});put('dash',{frames:i0,lean:.1});put('airdash',{frames:i0,lean:.2});
 put('punch',P);put('heavy',A.punch||P);put('kick',A.heavy||P);put('upper',A.heavy||P);put('special',A.upper||A.heavy||P);
 put('cpunch',{...P,squash:.8});put('ckick',{...(A.kick||P),squash:.8});put('jpunch',P);put('jkick',A.kick||P);put('jheavy',A.heavy||P);
 put('hit',{frames:i0,lean:-.16,shiftX:-12});put('airhit',{frames:A.hit?A.hit.frames.slice(-1):i0,lean:-.5});
 put('block',{frames:i0,lean:.05});put('kd',{frames:i0,lying:1});put('wakeup',{frames:i0,lying:1,rise:1});put('win',{frames:A.idle.frames,loop:1,fps:6,bob:3});
 return O}

// ---------- Figur ----------
export const CUS_TEMPLATES=[['hero','MASTER','ausgewogen: Welle, Reversal, Überkopf, Beinfeger'],['palm','PALM MASTER','Reichweite, Rüstung, Griff, Heilung'],['tiger','H!T','schnell: Teleport, Mehrfachtreffer, Dash'],['witch','SORCERESS','Fernkampf: Projektile, Falle, Blink']];
export const CUS_LIMITS={hp:[700,1300],tempo:[80,130],dmg:[80,130],abwehr:[80,125]};
export const CUS_DEFAULT={name:'MEIN KÄMPFER',template:'hero',hp:1000,tempo:100,dmg:100,abwehr:100,glow:'#ff4fd8'};
const cusClampN=(v,[a,b],d)=>{v=+v;return Number.isFinite(v)?Math.round(Math.min(b,Math.max(a,v))):d};
export function cusClean(p){p=p||{};
 const name=String(p.name==null?CUS_DEFAULT.name:p.name).replace(/[^\p{L}\p{N} !.\-_']/gu,'').trim().toUpperCase().slice(0,14)||CUS_DEFAULT.name;
 return{name,template:CUS_TEMPLATES.some(t=>t[0]===p.template)?p.template:CUS_DEFAULT.template,
  hp:cusClampN(p.hp,CUS_LIMITS.hp,1000),tempo:cusClampN(p.tempo,CUS_LIMITS.tempo,100),dmg:cusClampN(p.dmg,CUS_LIMITS.dmg,100),abwehr:cusClampN(p.abwehr,CUS_LIMITS.abwehr,100),
  glow:/^#[0-9a-fA-F]{6}$/.test(p.glow||'')?p.glow:CUS_DEFAULT.glow}}
// Spielfigur (Eintrag für CHARACTERS) aus Profil + Vorlage (Basisfigur liefert Moves, KI-Werkzeuge, Sprung-/Dash-Werte)
export function cusMakeChar(profile,base){const p=cusClean(profile);
 return{id:'custom',custom:true,name:p.name,desc:'Eigene Figur · '+base.name+'-Moves',hp:p.hp,walk:p.tempo/100,dmg:p.dmg/100,def:100/p.abwehr,
  jump:base.jump||1,dash:base.dash||1,airJumps:base.airJumps==null?1:base.airJumps,meter:base.meter||1,pal:base.pal,glow:p.glow,sprites:'custom',mods:base.mods,ai:base.ai,
  pros:'Moves wie '+(CUS_TEMPLATES.find(t=>t[0]===p.template)||CUS_TEMPLATES[0])[1]+': '+(CUS_TEMPLATES.find(t=>t[0]===p.template)||CUS_TEMPLATES[0])[2],cons:'Balance liegt bei dir – Werte jederzeit im Editor änderbar (E)'}}

// ---------- Prompts für Bild-KIs (Gemini): pro Sheet ein fertiger Text, Figurenbeschreibung kommt vom Nutzer ----------
export const CUS_PROMPT_CELLS={
 "idle_1": "Looping idle / breathing animation in fighting stance, part 1 of 2. Cell 1 is the neutral stance. Cells 2-6: a smooth slow bounce – chest rising and falling, guard fists drifting slightly, weight shifting gently from the back foot to the front foot, tail, hair or cloth swaying. Each cell clearly different from the previous one but only by small movements.",
 "idle_2": "Looping idle / breathing animation in fighting stance, part 2 of 2 (continuing directly after part 1). Cell 1 is the neutral stance (calibration only). Cells 2-6: the bounce continues – chest, fists and weight moving back; cell 6 must flow seamlessly back into the neutral stance of cell 1 so the loop is smooth.",
 "walk_1": "Walk cycle moving forward (to the right) in a low fighting stance, part 1 of 2: cell 2 front foot contact, cell 3 weight shifts down, cell 4 passing pose (back leg swings through), cell 5 up pose pushing off, cell 6 opposite foot contact. Guard fists stay up, torso bobbing slightly, tail, hair or cloth swaying.",
 "walk_2": "Walk cycle moving forward (to the right) in a low fighting stance, part 2 of 2, continuing the cycle of part 1 with the opposite leg: cell 2 weight shifts down, cell 3 passing pose, cell 4 up pose pushing off, cell 5 foot contact, cell 6 weight shifts down so that the cycle can loop back to part 1. Cell 1 is the neutral stance (calibration only).",
 "dash": "Cell 2: anticipation, body leaning forward, knees bent. Cells 3-4: fast forward dash, torso low and leaning far forward, legs stretched in a long stride (two different running poses). Cells 5-6: air dash, body almost horizontal flying forward with fist leading (two slightly different poses).",
 "jump": "Jump sequence, drawn in mid-air for cells 3-6 (the character floats; no ground). Cell 2: launch, rising fast with legs bent beneath, fists up. Cell 3: rising, legs tucked. Cell 4: peak of the jump, body curled, knees up. Cell 5: falling, legs extending downward. Cell 6: falling fast, legs stretched down ready to land.",
 "crouch": "Cell 2: going down into a crouch, knees bent, back leaning forward. Cell 3: deep crouch hold, fists up, low guard. Cell 4: same crouch with a tiny breathing movement. Cell 5: crouching guard, both forearms raised in front of the face. Cell 6: crouching guard, pushed back slightly by an impact.",
 "punch": "Fast jab with the front fist. Cell 2: slight windup, shoulder turns back. Cell 3: fist shoots forward, arm half extended. Cell 4: full extension, arm straight, clenched fist, body leaning into the punch. Cell 5: retracting the arm. Cell 6: back close to the guard pose.",
 "heavy": "Powerful heavy straight punch / haymaker with the whole body. Cell 2: deep windup, weight on back leg, fist pulled far back. Cell 3: explosive step forward, torso rotating. Cell 4: full extension, massive punch, wide stance, fists forward. Cell 5: follow-through hold at the moment of impact. Cell 6: recovering back toward the guard.",
 "kick": "High roundhouse / front kick. Cell 2: chamber, knee lifted, fists up. Cell 3: leg extends rapidly. Cell 4: full extension, leg straight at head height, body leaning back for balance. Cell 5: leg retracts. Cell 6: foot returns to the ground, back to stance.",
 "crouch_atk": "Crouching attacks. Cells 2-3: crouching punch (cell 2 windup, cell 3 fist extended low and forward). Cells 4-6: crouching low sweep kick (cell 4 chamber, cell 5 leg fully extended low along the ground, cell 6 retracting). The character stays low in all cells.",
 "air_atk": "Aerial attacks, drawn in mid-air (the character floats; the lowest foot is the reference). Cells 2-3: jumping punch (windup, fist extended). Cells 4-6: jumping kick (cell 4 knees tucked, cell 5 leg extended diagonally downward, cell 6 hold). Cells 7-8: jumping heavy overhead claw slash (cell 7 arm raised high, cell 8 slashing downward with a glowing blue slash).",
 "claw": "Rising claw uppercut special move with blue energy glow around the claw. Cell 2: crouch, claw pulled low behind the body. Cell 3: explosive launch upward, claw swinging up. Cell 4: rising, claw arcing high with blue energy trail. Cell 5: rising higher, body stretched. Cell 6: peak, claw fully raised overhead. Cell 7: starting to fall, body relaxed. Cell 8: falling with legs extending downward. Cells 3-8 are in mid-air.",
 "special": "Energy special move. Cell 2: crouch, gathering blue energy in both hands. Cell 3: strong blue aura builds around the body. Cell 4: thrusting both palms forward, releasing energy (character only, no projectile). Cell 5: full extension, palms forward, intense glow. Cell 6: hold, glow fading. Cell 7: recovering. Cell 8: returning toward the neutral stance.",
 "hit": "Taking hits. Cell 2: light hit, head snaps back, grimace. Cell 3: light hit, recovering. Cell 4: heavy hit, torso bent backward, pained face. Cell 5: heavy hit, staggering backward, off balance. Cell 6: recovering back toward the guard.",
 "down": "Knocked down and KO. Cell 2: launched into the air by a hit, body leaning back. Cell 3: tumbling backward in mid-air, body nearly horizontal. Cell 4: falling head first toward the ground in mid-air. Cell 5: slamming onto the ground, back arched. Cell 6: sliding on the ground, lying on the back. Cell 7: lying flat on the back, motionless. Cell 8: KO, lying flat, face up, eyes closed. Cells 2-4 are in mid-air, cells 5-8 on the ground.",
 "getup": "Getting up from the ground. Cell 2: lying on the back on the ground. Cell 3: rolling over and pushing up with the arms. Cell 4: kneeling on one knee. Cell 5: rising to standing, fists coming up. Cell 6: back in the neutral fighting stance.",
 "block": "Blocking. Cell 2: arms raised, forearms crossed in front of the face, braced. Cell 3: guard hold, leaning slightly forward, tense. Cell 4: guard pushed backward by an impact. Cell 5: guard hold again with a different arm position. Cell 6: relaxing back toward the stance.",
 "win": "Victory poses. Cell 2: roaring with the head thrown back, fist raised. Cell 3: flexing both arms, muscles tensed. Cell 4: fist pump. Cell 5: arms crossed, proud stance. Cell 6: confident pose with a slight smile, hold."
};
export function cusPrompt(key,desc){const sh=CUS_SHEETS.find(x=>x.key===key);if(!sh)return'';const n=sh.c*sh.r,d=(desc||'').trim()||'the character shown in the attached reference image';
 return`Reference: the attached image shows the exact character – ${d}. Keep face, proportions, colors and outfit identical in every cell. Ignore the background of the reference.

Create a SPRITE SHEET for a 2D fighting game (Marvel vs. Capcom 2 style, hand-painted, crisp clean dark outlines, high detail – same character and rendering style as the reference, but sharper and more detailed).

LAYOUT: exactly ${sh.c} columns x ${sh.r} rows = ${n} equally sized cells, reading order left to right, top to bottom, with clear empty space between all cells. No numbers, no text, no labels, no grid lines, no borders.
BACKGROUND: one perfectly flat, solid pure green (#00FF00) across the entire image. No gradient, no floor, no ground shadow, no vignette.
CHARACTER: side view, facing RIGHT (3/4 view like in fighting games). In EVERY cell the character has the same scale (the neutral stance is about 65% of the cell height) and the lowest foot rests on the same invisible ground line near the bottom of the cell. The whole character including tail, hair, cape and glow effects stays completely inside its own cell and never touches the cell edge or a neighbouring cell.
CELL 1 = the neutral fight stance exactly like in the reference (it is only used to calibrate the size).
CELLS 2-${n}: ${CUS_PROMPT_CELLS[key]}

Output in the highest resolution available.`}
