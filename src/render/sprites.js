import{attackFx}from'./rig.js';
// Sprite-Figuren: Frames aus einem Atlas je Figur (assets/<id>/atlas.webp + meta.json), Animationen = Frame-Listen.
// Beim Build werden Atlas + Meta als Data-URI in dist/game.js eingebettet (window.__SPRITES__) -> läuft ohne Server.
const R=(p,a,b)=>{const o=[];for(let i=a;i<=b;i++)o.push(p+i);return o};
// Optionen je Animation: loop/fps (Zeitsteuerung), squash (Ducken), lean (Neigung), bob (Wippen), lying (liegend gedreht),
// flip (Sprite gegen die Blickrichtung zeichnen, z. B. wenn die Frames "nach vorn" fallen statt nach hinten)
const HERO_ANIMS={
 idle:{frames:R('idle_',0,20),loop:1,fps:14},
 walk:{frames:R('idle_',0,20),loop:1,fps:26,bob:4,lean:.07},       // (keine Lauf-Frames geliefert: schnelle Idle-Frames + Wippen)
 crouch:{frames:['idle_3'],squash:.74},
 air:{frames:['cmb3_6']},
 dash:{frames:['cmb1_6'],lean:.1},airdash:{frames:['cmb1_5'],lean:.18},
 punch:{frames:R('punch_',1,9)},cpunch:{frames:R('punch_',1,9),squash:.8},jpunch:{frames:R('punch_',1,9)},
 kick:{frames:R('cmb3_',0,7)},ckick:{frames:[...R('cmb2_',0,3),'idle_0']},
 jkick:{frames:['cmb3_5','cmb3_4','cmb3_3','cmb3_2']},jheavy:{frames:R('cmb2_',4,7)},
 heavy:{frames:R('cmb1_',0,9)},upper:{frames:R('cmb2_',2,9)},
 special:{frames:['punch_1','punch_2','punch_3','punch_4','cmb1_5','cmb1_6','cmb1_7','cmb1_8','cmb1_9']},
 hit:{frames:R('hurt_',0,4)},airhit:{frames:['hurt_2']},block:{frames:['hurt_6']},cblock:{frames:['hurt_6'],squash:.76},
 kd:{frames:['hurt_0'],lying:1},wakeup:{frames:R('hurt_',4,7)},win:{frames:['hurt_7'],loop:1,fps:1,bob:3}};
// Palm Master: Gesten-Frames als Handflächen-Techniken (Energie-Leuchten an der Hand), echte Knockdown-/Aufsteh-Folge
const PUNCH=['o5_1','o5_2','o5_2','o5_3','o5_4','o5_5'],POINT=R('o10_',1,8),PALM=R('o8_',2,9);
const PALM_ANIMS={
 idle:{frames:R('idle_',0,19),loop:1,fps:12},
 walk:{frames:R('walk_',0,10),loop:1,fps:15},
 crouch:{frames:['idle_3'],squash:.74},
 air:{frames:['walk_5'],lean:.06},
 dash:{frames:R('walk_',0,10),loop:1,fps:30,lean:.12},airdash:{frames:['o5_2'],lean:.22},
 punch:{frames:PUNCH},cpunch:{frames:PUNCH,squash:.8},jpunch:{frames:PUNCH},
 kick:{frames:POINT},ckick:{frames:POINT,squash:.8},jkick:{frames:POINT},
 heavy:{frames:R('o5_',1,9)},jheavy:{frames:R('o5_',1,9)},
 upper:{frames:R('o8_',2,6)},special:{frames:R('o8_',4,9)},
 hit:{frames:['knock_0','knock_1'],flip:1},airhit:{frames:['knock_3','knock_5','knock_7','knock_9'],flip:1},
 block:{frames:['o8_5']},cblock:{frames:['o8_5'],squash:.76},
 kd:{frames:R('knock_',12,17),flip:1},wakeup:{frames:R('knock_',20,29),flip:1},
 win:{frames:['talk_0','talk_2','talk_4','talk_6','talk_8','talk_10','talk_12','talk_14','talk_16','talk_18','talk_20','talk_22','talk_24'],loop:1,fps:7}};
// Zauberin: nur Zauber-/Idle-/Sprung-Sheets -> Zauber-Posen als Angriffe (Leuchten an der Hand), Ring als echtes Projektil
const CAST=R('attack_',3,9),CASTL=R('attack_',4,9);
const WITCH_ANIMS={
 idle:{frames:R('idle_',0,15),loop:1,fps:10},
 walk:{frames:R('idle_',0,15),loop:1,fps:22,bob:3,lean:.06},
 crouch:{frames:['idle_3'],squash:.76},
 air:{frames:R('jump_',10,14),loop:1,fps:12},
 dash:{frames:['jump_6'],lean:.12},airdash:{frames:['jump_14'],lean:.2},
 punch:{frames:CASTL},cpunch:{frames:CASTL,squash:.8},jpunch:{frames:CASTL},
 kick:{frames:R('attack_',6,12)},ckick:{frames:R('attack_',6,12),squash:.8},jkick:{frames:R('attack_',6,12)},
 heavy:{frames:R('attack_',3,14)},jheavy:{frames:R('attack_',3,14)},upper:{frames:R('attack_',6,14)},
 special:{frames:R('attack_',0,20)},
 hit:{frames:['idle_4'],lean:-.16,shiftX:-12},airhit:{frames:['jump_15'],lean:-.5},
 block:{frames:['attack_3']},cblock:{frames:['attack_3'],squash:.78},
 kd:{frames:['idle_0'],lying:1},wakeup:{frames:['idle_0'],lying:1,rise:1},
 win:{frames:R('jump_',16,19),loop:1,fps:6,bob:2}};
// Minotaurus: Brüll-Schockwelle (Special), Axt-Stoß, Stampfen; Roll-Sequenz = Knockdown + Aufstehen
const MINO_ANIMS={
 idle:{frames:['other_0','other_7','other_8','other_7'],loop:1,fps:6},
 walk:{frames:R('walk_',0,4),loop:1,fps:10,bob:3},
 crouch:{frames:['roll_12']},
 air:{frames:['other_5','other_6'],loop:1,fps:6},
 dash:{frames:R('walk_',0,4),loop:1,fps:24,lean:.14},airdash:{frames:['walk_8'],lean:.2},
 punch:{frames:R('walk_',5,10)},cpunch:{frames:R('walk_',5,10)},jpunch:{frames:R('walk_',5,10)},
 kick:{frames:R('other_',4,8)},ckick:{frames:R('other_',4,8)},jkick:{frames:R('other_',4,8)},
 heavy:{frames:R('walk_',3,13)},jheavy:{frames:R('walk_',3,13)},
 upper:{frames:['roll_0','roll_1','other_9','walk_9']},
 special:{frames:['other_0','other_1','other_2','other_3','other_4','other_4','other_9']},
 hit:{frames:['roll_1']},airhit:{frames:R('roll_',2,7),loop:1,fps:14},
 block:{frames:['walk_9']},cblock:{frames:['roll_12']},
 kd:{frames:['roll_8','roll_9'],flip:0},wakeup:{frames:R('roll_',9,16)},
 win:{frames:R('other_',1,4),loop:1,fps:5}};
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
 crouch:{frames:['p_4_1']},cblock:{frames:['p_4_1']},
 air:{frames:['p_2_1']},
 dash:{frames:['p_4_0'],lean:.03},airdash:{frames:['p_6_1'],lean:.05},
 punch:{frames:['p_9_1','p_9_2','p_9_2','p_9_1']},cpunch:{frames:['p_4_1']},jpunch:{frames:['p_2_1']},
 kick:{frames:['p_5_1','p_5_2','p_5_2','p_5_1']},ckick:{frames:['p_4_1']},jkick:{frames:['p_2_1','p_6_1','p_6_1']},
 heavy:{frames:['p_6_0','p_5_3','p_9_3','p_9_3','p_1_3']},jheavy:{frames:['p_2_1','p_6_1','p_6_1']},
 upper:{frames:['p_8_0','p_8_1','p_8_2','p_8_2','p_8_3']},
 special:{frames:['p_7_0','p_7_1','p_7_2','p_7_2','p_7_2','p_7_3']},   // Feuer-Atem: Luft holen -> Brüllen (Feuer fliegt los) -> zurück
 hit:{frames:['p_1_3'],lean:-.18,shiftX:-14},airhit:{frames:['p_3_0']},
 block:{frames:['p_5_4']},
 kd:{frames:['p_3_1','p_3_1','p_3_3']},wakeup:{frames:['p_3_3','p_4_1','p_7_0']},
 win:{frames:['p_12_0','p_12_2','p_12_3','p_12_1'],loop:1,fps:2},defeat:{frames:['p_3_2']}};
// fist = Position der Faust/Hand für Leuchten + Hyper-Beam, height = Figurenhöhe in Spiel-Einheiten
// proj = Frames für das Projektil-Sprite (statt des Standard-Leuchtballs), projScale = Weltgröße je Quellpixel
export const SPRITE_CHARS={hero:{anims:HERO_ANIMS,fist:[104,-136],height:190},palm:{anims:PALM_ANIMS,fist:[96,-134],height:190},
 witch:{anims:WITCH_ANIMS,fist:[92,-126],height:192,proj:R('fx_',14,20),projScale:.8},
 mino:{anims:MINO_ANIMS,fist:[130,-108],height:236},
 tiger:{anims:TIGER_ANIMS,fist:[108,-122],height:190,fightScale:.85,fullAnims:['win','defeat'],profileAnim:'win'},
 st3g0:{anims:ST3G0_ANIMS,fist:[135,-150],height:190}};   // fightScale: Kampfposen kleiner als die Sieg-/Niederlagen-Pose (fullAnims bleiben in voller Größe)
// Eigene Figur (Upload im Startmenü): Sprite-Definition zur Laufzeit eintragen; Atlas liefert window.__SPRITES__[id]={meta,img}
export function registerSpriteChar(id,def){SPRITE_CHARS[id]=def}
function sheet(id){const S=typeof window!=='undefined'&&window.__SPRITES__&&window.__SPRITES__[id];if(!S||typeof Image==='undefined')return null;
 if(!S.img){S.img=new Image();S.img.src=S.atlas||('assets/'+id+'/atlas.webp');
  const C=SPRITE_CHARS[id];if(C&&S.meta&&S.meta.anims)Object.assign(C.anims,S.meta.anims)}   // Animationen aus dem Atlas (z. B. Tiger-Sheets via tools/import-tiger-sheets.py) überschreiben die Behelfe
 return S}
const ready=S=>S.img.complete&&(S.img.naturalWidth===undefined||S.img.naturalWidth>0);
const fightK=(C,f)=>C.fightScale&&!f.menu&&!(C.fullAnims&&C.fullAnims.includes(f.anim))?C.fightScale:1;   // Menü-Figuren (f.menu) werden nie verkleinert
export function drawSpriteFighter(g,f,clock,alpha=1,floorY=470){
 const C=SPRITE_CHARS[f.char.sprites],S=sheet(f.char.sprites);
 g.save();g.globalAlpha=alpha;
 if(alpha===1){g.fillStyle='#0008';g.beginPath();g.ellipse(f.x,floorY+4,Math.max(18,56-(floorY-f.y)*.15)*(C?fightK(C,f):1),10,0,0,7);g.fill()}
 if(!C||!S||!ready(S)){g.restore();return}
 const fs=fightK(C,f);   // Kampfpose = skaliert
 const M=S.meta,k=C.height/M.standH*fs,a=C.anims[f.anim]||C.anims.idle,n=a.frames.length;
 const idx=a.loop?Math.floor(f.sf/60*a.fps)%n:Math.min(n-1,Math.floor(Math.min(f.animU,.999)*n));
 const fr=M.frames[a.frames[idx]]||M.frames.idle_0||M.frames[C.anims.idle.frames[0]];if(!fr){g.restore();return}
 g.translate(f.x,f.y);g.scale(f.facing,1);
 if(a.flip)g.scale(-1,1);
 if(f.state==='tumble'){g.translate(0,-80);g.rotate(-f.sf*.3);g.translate(0,80)}                  // Rotation beim harten Knockdown
 if(a.shiftX)g.translate(a.shiftX,0);
 if(a.lying){g.translate(0,-28);g.rotate(-1.45*(a.rise?1-Math.min(1,f.animU*1.15):1));g.translate(0,80)}   // liegend (Knockdown/KO), mit 'rise' stufenlos aufrichten
 if(a.bob)g.translate(0,-Math.abs(Math.sin(f.sf*.28))*a.bob);
 if(a.lean)g.rotate(a.lean);
 if(a.squash)g.scale(1,a.squash);
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
 g.drawImage(S.img,fr.x,fr.y,fr.w,fr.h,fr.ox*k,fr.oy*k,fr.w*k,fr.h*k);
 if(a.flip)g.scale(-1,1);                                                                          // Effekte wieder in Blickrichtung
 attackFx(g,f,fs===1?C.fist:[C.fist[0]*fs,C.fist[1]*fs],f.char.glow);
 g.restore()}
// Projektil als Sprite (z. B. Zauberin: rotierender Ring). Gibt false zurück, wenn die Figur kein Projektil-Sprite hat.
export function drawSpriteProjectile(g,p,owner){
 const C=SPRITE_CHARS[owner.char.sprites],S=C&&C.proj&&!(p.def.look&&p.def.look!=='ring')&&sheet(owner.char.sprites);if(!S||!ready(S))return false;
 const M=S.meta,fr=M.frames[C.proj[Math.floor(p.age/5)%C.proj.length]];if(!fr)return false;const sc=(C.projScale||.8)*Math.min(1.5,Math.max(.55,p.w/96));
 g.save();g.translate(p.x,p.y);g.rotate(p.age*.12*Math.sign(p.vx));g.globalCompositeOperation='lighter';g.globalAlpha=.95;
 const gr=g.createRadialGradient(0,0,4,0,0,60);gr.addColorStop(0,'#ff3a3a66');gr.addColorStop(1,'#0000');g.fillStyle=gr;g.beginPath();g.arc(0,0,60,0,7);g.fill();
 g.globalCompositeOperation='source-over';g.globalAlpha=1;g.drawImage(S.img,fr.x,fr.y,fr.w,fr.h,-fr.w*sc/2,-fr.h*sc/2,fr.w*sc,fr.h*sc);g.restore();return true}

// Portrait für das HUD: Kopf/Oberkörper-Ausschnitt des ersten Idle-Frames (Sprite-Figuren); false = kein Sprite (HUD zeichnet den Anfangsbuchstaben)
export function drawPortrait(g,char,cx,cy,size,flip){
 const C=char.sprites&&SPRITE_CHARS[char.sprites],S=C&&sheet(char.sprites);if(!S||!ready(S))return false;
 const fr=S.meta.frames[C.anims.idle.frames[0]];if(!fr)return false;
 const cw=fr.w*.86,ch=Math.min(fr.h,cw),sx=fr.x+(fr.w-cw)/2;
 g.save();g.translate(cx,cy);if(flip)g.scale(-1,1);g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
 g.drawImage(S.img,sx,fr.y,cw,ch,-size/2,-size/2,size,size*ch/cw);g.restore();return true}

// Kompletter erster Idle-Frame, in die Box (x,y,w,h) eingepasst (nichts abgeschnitten), unten mittig ausgerichtet
export function drawFullFrame(g,char,x,y,w,h){
 const C=char.sprites&&SPRITE_CHARS[char.sprites],S=C&&sheet(char.sprites);if(!S||!ready(S))return false;
 const pa=C.profileAnim&&C.anims[C.profileAnim],fr=S.meta.frames[pa?pa.frames[pa.frames.length-1]:C.anims.idle.frames[0]];if(!fr)return false;   // Profil: Siegerpose, falls profileAnim gesetzt
 const k=Math.min(w/fr.w,h/fr.h),dw=fr.w*k,dh=fr.h*k;
 g.save();g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(S.img,fr.x,fr.y,fr.w,fr.h,x+(w-dw)/2,y+h-dh,dw,dh);g.restore();return true}
