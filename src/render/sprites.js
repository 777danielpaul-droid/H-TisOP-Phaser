import{attackFx}from'./rig.js';
import{skinCount,recolor}from'./skins.js';
// Sprite-Figuren: Frames aus einem Atlas je Figur (assets/<id>/atlas.webp + meta.json), Animationen = Frame-Listen.
// Beim Build werden Atlas + Meta als Data-URI in dist/game.js eingebettet (window.__SPRITES__) -> läuft ohne Server.
const R=(p,a,b)=>{const o=[];for(let i=a;i<=b;i++)o.push(p+i);return o};
// Optionen je Animation: loop/fps (Zeitsteuerung), squash (Ducken), lean (Neigung), bob (Wippen), lying (liegend gedreht),
// flip (Sprite gegen die Blickrichtung zeichnen, z. B. wenn die Frames "nach vorn" fallen statt nach hinten)
// Tiger (Einzelframes, alle bereits an der Fußlinie verankert): keine Lauf-/Sprung-Frames -> Idle schnell mit Wippen, Kick-Pose in der Luft;
// 'upper' = Rising-Claw (Aufwärts-Klaue mit Leuchten), Treffer = hit_heavy, Fallen = fall_*, 'a'-Frames = Luft-Variante (Körpermitte fest)
const TIGER_ANIMS={
 idle:{frames:R('idle_0',0,5),loop:1,fps:7},   // Rückfall ohne Sheets; mit den neuen Posen-Bögen kommt das Idle aus meta.anims (IDLE_FPS in tools/import-tiger-sheets.py)
 walk:{frames:R('idle_0',0,5),loop:1,fps:10,bob:2,lean:.04},
 crouch:{frames:['get_up_02']},
 air:{frames:['kick_02'],lean:.05},
 dash:{frames:['attack_heavy_00'],lean:.12},airdash:{frames:['kick_02'],lean:.22},
 punch:{frames:['attack_light_00','attack_light_01','attack_light_02','attack_light_02','attack_light_03']},
 cpunch:{frames:['attack_light_00','attack_light_02','attack_light_02','attack_light_03'],squash:.82},
 jpunch:{frames:['attack_light_01','attack_light_02','attack_light_02']},
 kick:{frames:['kick_00','kick_01','kick_01','kick_02']},
 ckick:{frames:['get_up_02','crouch_kick_00','crouch_kick_00']},
 jkick:{frames:['kick_02','kick_01','kick_01']},
 heavy:{frames:['attack_heavy_00','attack_heavy_01','attack_heavy_02','attack_heavy_02','attack_heavy_03']},
 jheavy:{frames:['attack_heavy_01','attack_heavy_02','attack_heavy_02']},
 upper:{frames:R('special_rising_claw_0',0,3)},
 special:{frames:['attack_heavy_00','attack_heavy_01','attack_heavy_02','attack_heavy_02','attack_heavy_03']},
 hit:{frames:['hit_heavy_00','hit_heavy_01']},airhit:{frames:['hit_heavy_02a','fall_00a','fall_01a']},
 block:{frames:['block_00']},cblock:{frames:['block_01'],squash:.9},
 kd:{frames:['fall_02','ko_00']},wakeup:{frames:R('get_up_0',0,3)},
 win:{frames:['special_rising_claw_03'],loop:1,fps:1,bob:3}};
// ST3-G0 (Panzer-Echse): Frames p_<Bogen>_<Zelle> aus assets/st3g0 (12 Posen-Bögen, tools/import-st3g0-sheets.py).
//  Bogen 1-4: Grundposen, Laufen, Sturz   | 5: Knie-/Seitkick, langer Schlag, Block (verschränkte Arme)   | 6: Ausfall, Flugkick, Frontkick, Klauen
//  7: Idle/Brüllen   | 8: Aufwärtshaken   | 9: Schlagfolge   | 10-11: Posen ohne Aura (frei)   | 12: Siegespose mit Flügel-Aura
// Noch Behelfe (docs/ST3G0_PROMPTS.md, Bogen 6 'Ducken' / 12 'Knockdown' fehlen): Ducken-Angriffe, Luft-Schlag, Knockdown/Aufstehen.
const ST3G0_ANIMS={
 idle:{frames:['p_7_0','p_7_3'],loop:1,fps:3},
 walk:{frames:['p_4_2','p_4_3','p_4_2','p_7_0'],loop:1,fps:7,bob:3},
 crouch:{frames:['p_4_1'],squash:.8},cblock:{frames:['p_4_1'],squash:.8},   // Ducken: p_4_1 war nur wenig niedriger als Stehen (170 vs 190 px) -> gestaucht + POSE_ST3G0 (Hurtbox beim Ducken = 96)
 air:{frames:['p_2_1']},
 dash:{frames:['p_4_0'],lean:.03},airdash:{frames:['p_6_1'],lean:.05},
 punch:{frames:['p_9_1','p_9_2','p_9_2','p_9_1']},cpunch:{frames:['p_4_1'],squash:.8},jpunch:{frames:['p_2_1']},
 kick:{frames:['p_5_1','p_5_2','p_5_2','p_5_1']},ckick:{frames:['p_4_1'],squash:.8},jkick:{frames:['p_2_1','p_6_1','p_6_1']},
 heavy:{frames:['p_6_0','p_5_3','p_9_3','p_9_3','p_1_3']},jheavy:{frames:['p_2_1','p_6_1','p_6_1']},
 upper:{frames:['p_8_0','p_8_1','p_8_2','p_8_2','p_8_3']},
 special:{frames:['p_7_0','p_7_1','p_7_2','p_7_2','p_7_2','p_7_3']},   // Feuer-Atem: Luft holen -> Brüllen (Feuer fliegt los) -> zurück
 hit:{frames:['p_1_3'],lean:-.18,shiftX:-14},airhit:{frames:['p_3_0']},
 block:{frames:['p_5_4']},
 kd:{frames:['p_3_1','p_3_1','p_3_3']},wakeup:{frames:['p_3_3','p_4_1','p_7_0']},
 hyper:{frames:['p_7_0','p_7_1','p_7_2','p_7_2','p_7_2','p_7_2','p_7_2','p_7_2','p_7_2','p_7_3']},   // Drachen-Feuersturm: Luft holen -> Brüllen/Feuer speien (lange gehalten) -> zurück
 win:{frames:['p_12_0','p_12_2','p_12_3','p_12_1'],loop:1,fps:2},defeat:{frames:['p_3_2']}};
// KITSUNE (Neunschwanz-Fuchs): Frames p_<Bogen>_<Zelle> aus assets/kitsune (16 Posen-Bögen, tools/import-kitsune-sheets.py). 'a' = an der Körpermitte verankert (Luft).
//  1-5: Haltung/Jab/Tritte/Dash | 6-7: Ducken, Laufen | 8: Idle-Atmen | 9: Treffer/Sturz | 10: Sprungtritt | 11: Aufstehen | 12: schwerer Schlag
//  13: Sprung | 14: Entspannt/Knien/Meditation (Sieg) | 15: Luft-Schlag | 16: Block
// Noch Behelfe: Duck-Schlag (cpunch), Feuer-Special (Wurfbewegung), Heavy/Special teilen sich Frames mit Jab/Hatz.
const KITSUNE_ANIMS={
 idle:{frames:['p_8_0','p_8_1','p_8_2','p_8_3'],loop:1,fps:5},
 walk:{frames:['p_7_0','p_7_1','p_6_2','p_7_3'],loop:1,fps:9,bob:2},
 crouch:{frames:['p_6_0']},cblock:{frames:['p_4_3'],squash:.95},
 air:{frames:['p_13_0','p_13_1','p_13_2']},
 dash:{frames:['p_5_0','p_5_1'],loop:1,fps:12,lean:.03},airdash:{frames:['p_5_2'],lean:.05},
 punch:{frames:['p_1_1','p_2_2','p_1_2','p_1_2','p_1_1']},cpunch:{frames:['p_4_1']},jpunch:{frames:['p_15_2','p_15_3']},
 kick:{frames:['p_3_1','p_3_2','p_3_2','p_3_1']},ckick:{frames:['p_4_1','p_4_2','p_4_2','p_4_3']},jkick:{frames:['p_10_1','p_10_2','p_10_2']},
 heavy:{frames:['p_1_3','p_12_1','p_12_2','p_12_3','p_12_3']},jheavy:{frames:['p_10_1','p_10_2','p_10_2']},
 upper:{frames:['p_6_0','p_10_1','p_10_2','p_10_2','p_10_3']},
 special:{frames:['p_1_3','p_1_1','p_2_2','p_2_2','p_1_2','p_1_1']},   // Fuchsfeuer: Ausholen -> Stoß (Welle fliegt los) -> zurück
 hit:{frames:['p_9_0'],lean:-.14,shiftX:-10},airhit:{frames:['p_9_1a','p_9_2a']},
 block:{frames:['p_16_2']},
 kd:{frames:['p_9_2','p_9_2','p_9_3']},wakeup:{frames:['p_11_0','p_11_1','p_11_2','p_11_3']},
 hyper:{frames:['p_6_0','p_14_2','p_14_3','p_14_3','p_14_3','p_14_3','p_14_3','p_14_2','p_6_0']},   // Neunschwanz-Inferno: Hocke -> Meditation mit Leuchten (Schwänze lodern) -> zurück
 win:{frames:['p_14_2','p_14_3'],loop:1,fps:2},defeat:{frames:['p_14_1']}};
// ANUBIS (Endgegner, Schakal-Krieger): Frames p_<Bogen>_<Zelle> aus assets/anubis (6 Posen-Bögen, tools/import-anubis-sheets.py). 'a' = an der Körpermitte verankert (Luft).
//  1: Idle-Zyklus (entspannt) | 2: Kampfposen/Guard | 3: Kampfkombo (Jab, Cross, Tritt, Schwung mit Goldspur) | 4: Treffer/Sturz/Liegen | 5: Lauf-Haltung, Sprung, Ducken | 6: Block
// NOCH BEHELFE (Bögen fehlen noch): Laufen (Guard-Posen), Dash/Luft-Dash (Lauf-/Sprungpose), Duck-Angriffe (Duck-Pose), Aufwärts-Special/Upper, Hyper, Aufstehen (rückwärts abgespielte Sturzposen),
// Sieg-/Niederlagenpose, Luft-Angriffe teilen sich Frames mit den Bodenangriffen. Neue Bögen: tools/import-anubis-sheets.py (SHEETS) + hier die Frame-Listen tauschen.
const ANUBIS_ANIMS={
 idle:{frames:['p_1_0','p_1_1','p_1_2','p_1_3'],loop:1,fps:4},
 walk:{frames:['p_2_3','p_2_1','p_2_3','p_2_2'],loop:1,fps:7,bob:3},
 crouch:{frames:['p_5_3']},cblock:{frames:['p_6_3'],squash:.88},
 air:{frames:['p_5_1a','p_5_2a']},
 dash:{frames:['p_5_0'],lean:.12},airdash:{frames:['p_5_2a'],lean:.2},
 punch:{frames:['p_2_3','p_3_0','p_3_0','p_2_3']},cpunch:{frames:['p_5_3','p_3_0'],squash:.9},jpunch:{frames:['p_3_0','p_3_1']},
 kick:{frames:['p_2_3','p_3_2','p_3_2','p_2_3']},ckick:{frames:['p_5_3','p_3_2'],squash:.9},jkick:{frames:['p_3_2','p_3_2']},
 heavy:{frames:['p_2_1','p_3_1','p_3_3','p_3_3','p_2_3']},jheavy:{frames:['p_3_3','p_3_3']},
 upper:{frames:['p_5_3','p_5_1a','p_5_1a','p_5_1a']},
 special:{frames:['p_2_0','p_3_0','p_3_1','p_3_1','p_2_3']},   // Seelenwelle: Ausholen -> Stoß (Welle fliegt los) -> zurück
 hit:{frames:['p_4_0'],lean:-.1,shiftX:-10},airhit:{frames:['p_4_0a','p_4_1a']},
 block:{frames:['p_6_1']},
 kd:{frames:['p_4_2','p_4_2','p_4_3']},wakeup:{frames:['p_4_3','p_4_2','p_5_3','p_2_3']},
 hyper:{frames:['p_2_0','p_3_1','p_3_3','p_3_3','p_3_3','p_3_3','p_3_3','p_3_3','p_2_3']},   // Behelf bis Hyper-Bogen da ist
 win:{frames:['p_1_1','p_1_2'],loop:1,fps:2},defeat:{frames:['p_4_3']}};
// fist = Position der Faust/Hand für Leuchten + Hyper-Beam, height = Figurenhöhe in Spiel-Einheiten
// lie = Frames, in denen die Figur auf dem Boden liegt -> dort gibt es keinen Schatten
// pose = Feinabstimmung einzelner Animationen (Sieger-/Verlierer-Finale), unabhängig von den Anim-Listen (die Tiger-Anims kommen aus meta.json und würden Optionen dort überschreiben):
//  sc = Größenfaktor (1 = unverändert), rot = Drehung in rad (im Uhrzeigersinn, in Blickrichtung gespiegelt), dy = Verschiebung nach unten (Spiel-Einheiten, näher zum Betrachter),
//  shadow = [Mitte x, Radius, Versatz y] eines eigenen Bodenschattens (für gedrehte/abgesenkte Posen, die sonst keinen bekommen)
const POSE_ST3G0={
 crouch:{sc:.88},cblock:{sc:.88},cpunch:{sc:.88},ckick:{sc:.88},   // Ducken/Duck-Angriffe waren viel zu groß (Höhe 170 -> ca. 120 px, Hurtbox 96)
 win:{sc:.9},                                              // Siegerpose inkl. Flügel-Aura war ca. 10 % zu groß gegenüber der Kampfgröße
 defeat:{sc:.8,rot:.33,dy:46,shadow:[17,92,42]}};         // Verlierer: kleiner (liegende Länge 291 -> 233 px), 18° nach vorn gekippt = waagerechter, 46 px tiefer = näher am Betrachter/auf dem Boden
// Frame-Maßstab Kitsune: Die Gemini-Bögen zeichnen die Figur je Pose unterschiedlich groß (Kopf in Schlag-/Tritt-/Lauf-/Sprungposen 10-25 % kleiner als im Idle,
// obwohl der Importer alle Bögen mit demselben Faktor skaliert). Wert = Kopfgröße im Idle (p_8_0) / Kopfgröße im Frame, per Template-Matching gemessen
// (tools/measure-kitsune-scale.py). 1 = Idle-Größe; nicht gelistete Frames (Idle, Bogen 4/8/11/12, Liegeposen) bleiben unverändert. 'a'-Varianten erben vom Basis-Frame.
const KITSUNE_FRAME_SC={
 p_1_1:1.05,p_1_2:1.25,p_1_3:1.05,p_2_2:1.25,p_3_1:1.1,p_3_2:1.25,
 p_5_0:1.18,p_5_1:1.18,p_5_2:1.1,
 p_6_0:1.05,p_6_1:1.25,p_6_2:1.18,p_6_3:1.18,
 p_7_0:1.18,p_7_1:1.18,p_7_3:1.18,
 p_9_1:1.1,p_9_2:1.25,
 p_10_1:1.33,p_10_2:1.33,p_10_3:1.25,
 p_13_0:1.05,p_13_1:1.1,p_13_2:1.18,
 p_14_2:1.05,p_14_3:1.05,
 p_15_2:1.18,p_15_3:1.1};
const POSE_KITSUNE={
 win:{sc:1},defeat:{sc:.9}};                              // Meditation + Neunschwänze / Kniende Pose waren zu groß
export const SPRITE_CHARS={
 tiger:{anims:TIGER_ANIMS,fist:[108,-122],height:190,fightScale:.85,fullAnims:['win','defeat'],profileAnim:'win',lie:['t_neu_treffer_103','t_neu_aufstehen_00']},
 st3g0:{anims:ST3G0_ANIMS,fist:[135,-150],height:190,fightScale:.92,lie:['p_3_1','p_3_2','p_3_3'],pose:POSE_ST3G0},
 anubis:{anims:ANUBIS_ANIMS,fist:[113,-137],height:215,fightScale:1,lie:['p_4_2','p_4_3']},
 kitsune:{anims:KITSUNE_ANIMS,fist:[100,-121],height:190,fightScale:.83,lie:['p_9_3','p_11_0'],pose:POSE_KITSUNE,frameSc:KITSUNE_FRAME_SC}};   // fightScale: Kampfposen kleiner als die Sieg-/Niederlagen-Pose (fullAnims bleiben in voller Größe)
// Eigene Figur (Upload im Startmenü): Sprite-Definition zur Laufzeit eintragen; Atlas liefert window.__SPRITES__[id]={meta,img}
export function registerSpriteChar(id,def){SPRITE_CHARS[id]=def}
// Umgefärbtes Atlas-Bild (Skin >0) als Canvas; ohne Canvas/DOM oder bei gesperrtem Canvas (file://) -> Original
function skinImg(S,id,skin){
 if(!skin||!skinCount(id)||typeof document==='undefined')return S.img;
 const c=S.skinCv||(S.skinCv={});if(c[skin]!==undefined)return c[skin]||S.img;
 try{const w=S.img.naturalWidth||S.img.width,h=S.img.naturalHeight||S.img.height,cv=document.createElement('canvas');cv.width=w;cv.height=h;
  const x=cv.getContext('2d',{willReadFrequently:true});x.drawImage(S.img,0,0);const d=x.getImageData(0,0,w,h);recolor(id,d.data,skin);x.putImageData(d,0,0);c[skin]=cv}
 catch(e){c[skin]=null}
 return c[skin]||S.img}
function sheet(id){const S=typeof window!=='undefined'&&window.__SPRITES__&&window.__SPRITES__[id];if(!S||typeof Image==='undefined')return null;
 if(!S.img){S.img=new Image();S.img.src=S.atlas||('assets/'+id+'/atlas.webp');
  const C=SPRITE_CHARS[id];if(C&&S.meta&&S.meta.anims)Object.assign(C.anims,S.meta.anims)}   // Animationen aus dem Atlas (z. B. Tiger-Sheets via tools/import-tiger-sheets.py) überschreiben die Behelfe
 return S}
const ready=S=>S.img.complete&&(S.img.naturalWidth===undefined||S.img.naturalWidth>0);
const fightK=(C,f)=>C.fightScale&&!f.menu&&!(C.fullAnims&&C.fullAnims.includes(f.anim))?C.fightScale:1;   // Menü-Figuren (f.menu) werden nie verkleinert
// ---------- Bodenschatten ----------
// Ellipse auf der Fußlinie (Mitte = Fußsohle, die Füße stehen also IM Schatten), Breite = Fußabstand der aktuellen Pose.
// In der Luft wandert der Schatten zur Körpermitte, schrumpft und wird blasser; liegende Posen (SPRITE_CHARS.lie, a.lying) haben keinen Schatten.
const FOOT_BAND=18;   // Atlas-Pixel über der Fußlinie, in denen die Fußbreite einer Pose gemessen wird
let footCv=null;
function footSpan(S,fr){   // [x0,x1] in Atlas-Pixeln relativ zum Anker (Fußlinie/Körpermitte) oder null, wenn nicht messbar
 if(fr._fs!==undefined)return fr._fs;
 let r=null;
 try{const row0=Math.max(0,Math.round(-fr.oy)-FOOT_BAND),rows=Math.min(fr.h-row0,FOOT_BAND+4);
  if(rows>0&&typeof document!=='undefined'){const cv=footCv||(footCv=document.createElement('canvas'));cv.width=fr.w;cv.height=rows;
   const c=cv.getContext('2d',{willReadFrequently:true});c.clearRect(0,0,fr.w,rows);c.drawImage(S.img,fr.x,fr.y+row0,fr.w,rows,0,0,fr.w,rows);
   const d=c.getImageData(0,0,fr.w,rows).data;let x0=fr.w,x1=-1;
   for(let y=0;y<rows;y++)for(let x=0;x<fr.w;x++)if(d[(y*fr.w+x)*4+3]>100){if(x<x0)x0=x;if(x>x1)x1=x}
   if(x1>=x0)r=[fr.ox+x0,fr.ox+x1+1]}}catch(e){r=null}   // z. B. Canvas "tainted" (file://) -> Standardbreite
 return fr._fs=r}
function groundShadow(g,cx,floorY,h,rx){
 const sc=1/(1+Math.max(0,h)/260),w=Math.max(10,rx*sc),ht=Math.max(6,Math.min(17,w*.16));
 g.save();g.translate(cx,floorY);g.scale(1,ht/w);
 const gr=g.createRadialGradient(0,0,w*.12,0,0,w);gr.addColorStop(0,'rgba(0,0,0,.78)');gr.addColorStop(.6,'rgba(0,0,0,.62)');gr.addColorStop(1,'rgba(0,0,0,0)');
 g.globalAlpha*=.5+.5*sc;g.fillStyle=gr;g.beginPath();g.arc(0,0,w,0,7);g.fill();g.restore()}
export function drawSpriteFighter(g,f,clock,alpha=1,floorY=470){
 const C=SPRITE_CHARS[f.char.sprites],S=sheet(f.char.sprites),h=Math.max(0,floorY-f.y);
 g.save();g.globalAlpha=alpha;
 if(!C||!S||!ready(S)){if(alpha===1)groundShadow(g,f.x,floorY,h,Math.max(24,56*(C?fightK(C,f):1)));g.restore();return}
 const fs=fightK(C,f);   // Kampfpose = skaliert
 const P=C.pose&&C.pose[f.anim],M=S.meta,a=C.anims[f.anim]||C.anims.idle,n=a.frames.length;   // P = Feinabstimmung dieser Animation (SPRITE_CHARS.pose)
 const idx=a.loop?Math.floor(f.sf/60*a.fps)%n:Math.min(n-1,Math.floor(Math.min(f.animU,.999)*n)),nm=a.frames[idx];
 const fr=M.frames[nm]||M.frames.idle_0||M.frames[C.anims.idle.frames[0]];if(!fr){g.restore();return}
 const k=C.height/M.standH*fs*(P&&P.sc||1)*(C.frameSc&&C.frameSc[nm.replace(/a$/,'')]||1);   // Frame-Maßstab (SPRITE_CHARS.frameSc): gleicht je Pose unterschiedlich große Zeichnungen an die Idle-Größe an
 if(alpha===1&&!a.lying&&!(C.lie&&C.lie.includes(nm))){
  const sp=footSpan(S,fr),air=Math.min(1,h/30);let cx=f.x,rx=Math.max(24,56*fs);
  if(sp){const gx=f.x+f.facing*(a.flip?-1:1)*((sp[0]+sp[1])/2*k+(a.shiftX||0)),gw=(sp[1]-sp[0])/2*k+16;cx=gx+(f.x-gx)*air;rx=gw+(rx-gw)*air}   // am Boden: unter den Füßen, in der Luft: unter dem Körper
  groundShadow(g,cx,floorY,h,rx)}
 else if(alpha===1&&P&&P.shadow)groundShadow(g,f.x+f.facing*P.shadow[0],floorY+P.shadow[2],0,P.shadow[1]);   // gedrehte/abgesenkte Pose: eigener Schatten unter dem Körper
 g.translate(f.x,f.y);g.scale(f.facing,1);
 if(P){if(P.dy)g.translate(0,P.dy);if(P.rot)g.rotate(P.rot)}   // Pose-Feinabstimmung: tiefer (näher am Betrachter) und gekippt
 if(a.flip)g.scale(-1,1);
 if(f.state==='tumble'){g.translate(0,-80);g.rotate(-f.sf*.3);g.translate(0,80)}                  // Rotation beim harten Knockdown
 if(a.shiftX)g.translate(a.shiftX,0);
 if(a.lying){g.translate(0,-28);g.rotate(-1.45*(a.rise?1-Math.min(1,f.animU*1.15):1));g.translate(0,80)}   // liegend (Knockdown/KO), mit 'rise' stufenlos aufrichten
 if(a.bob)g.translate(0,-Math.abs(Math.sin(f.sf*.28))*a.bob);
 if(a.lean){if(h>8)g.rotate(a.lean);else g.transform(1,0,-Math.tan(a.lean),1,0,0)}   // am Boden schiefen statt drehen: die Füße bleiben auf der Fußlinie, in der Luft normal drehen
 if(a.squash)g.scale(1,a.squash);
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
 g.drawImage(skinImg(S,f.char.sprites,f.skin|0),fr.x,fr.y,fr.w,fr.h,fr.ox*k,fr.oy*k,fr.w*k,fr.h*k);
 if(a.flip)g.scale(-1,1);                                                                          // Effekte wieder in Blickrichtung
 attackFx(g,f,fs===1?C.fist:[C.fist[0]*fs,C.fist[1]*fs],f.char.glow);
 g.restore()}
// Portrait für das HUD: Kopf/Oberkörper-Ausschnitt des ersten Idle-Frames (Sprite-Figuren); false = kein Sprite (HUD zeichnet den Anfangsbuchstaben)
export function drawPortrait(g,char,cx,cy,size,flip,skin=0){
 const C=char.sprites&&SPRITE_CHARS[char.sprites],S=C&&sheet(char.sprites);if(!S||!ready(S))return false;
 const fr=S.meta.frames[C.anims.idle.frames[0]];if(!fr)return false;
 const cw=fr.w*.86,ch=Math.min(fr.h,cw),sx=fr.x+(fr.w-cw)/2;
 g.save();g.translate(cx,cy);if(flip)g.scale(-1,1);g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
 g.drawImage(skinImg(S,char.sprites,skin),sx,fr.y,cw,ch,-size/2,-size/2,size,size*ch/cw);g.restore();return true}

// Kompletter erster Idle-Frame, in die Box (x,y,w,h) eingepasst (nichts abgeschnitten), unten mittig ausgerichtet
export function drawFullFrame(g,char,x,y,w,h,skin=0){
 const C=char.sprites&&SPRITE_CHARS[char.sprites],S=C&&sheet(char.sprites);if(!S||!ready(S))return false;
 const pa=C.profileAnim&&C.anims[C.profileAnim],fr=S.meta.frames[pa?pa.frames[pa.frames.length-1]:C.anims.idle.frames[0]];if(!fr)return false;   // Profil: Siegerpose, falls profileAnim gesetzt
 const k=Math.min(w/fr.w,h/fr.h),dw=fr.w*k,dh=fr.h*k;
 g.save();g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(skinImg(S,char.sprites,skin),fr.x,fr.y,fr.w,fr.h,x+(w-dw)/2,y+h-dh,dw,dh);g.restore();return true}
