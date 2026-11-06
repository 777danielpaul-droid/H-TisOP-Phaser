// Frame-Daten. su=Startup, ac=Active, rc=Recovery (Frames). box=[x,y,w,h] relativ zu den Füßen.
// hs=Hitstun, bs=Blockstun, pb/pbb=Pushback bei Treffer/Block, lv=Trefferhöhe (mid/low/high),
// unb=unblockbar (Griff), armor=[von,bis] Rüstungs-Frames (steckt Treffer ein, kein Hitstun), dive=Sturzflug {vx,vy}, tp=Teleport {rel:'opp'|'self',off,flip},
// heal/gain=HP/Meter-Gewinn, v={L,M,H}=Varianten je nach gedrückter Taste, label/key/info=Anzeige im Menü.
// launch=Launcher-Vektor, hard=harter Knockdown, jc=Jump-Cancel erlaubt, spc=Special-Cancel erlaubt, inv=unverwundbare Frames.
const DEF={hstop:7,shake:0,lv:'mid',pb:3,pbb:4,bs:10,hs:16,launch:null,hard:false,spc:true,jc:false,inv:null,glow:0,air:false,
 special:false,super:false,lunge:0,multi:0,minScale:0,crouch:false,box:null,cost:0,dmg:0,rc:0,
 unb:false,armor:null,dive:null,tp:null,heal:0,gain:0,v:null,label:'',key:'',info:''};
const mv=o=>({...DEF,...o});
export const BASE_MOVES={
 // --- Boden-Normals (Magic Series: L -> M -> H, auch Stance-Wechsel) ---
 '5L':mv({label:'Leichter Schlag',key:'J',anim:'punch',su:3,ac:3,rc:6,dmg:30,hs:18,bs:10,pb:2,box:[10,-136,76,30],hstop:4}),
 '5M':mv({label:'Mittlerer Tritt',key:'K',anim:'kick',su:5,ac:4,rc:9,dmg:55,hs:21,bs:13,pb:3,box:[10,-105,98,36],hstop:5}),
 '5H':mv({label:'Schwerer Schlag',key:'L',anim:'heavy',su:8,ac:4,rc:14,dmg:90,hs:27,bs:18,pb:6,box:[5,-132,112,44],hstop:8,shake:4,glow:1,lunge:3}),
 '2L':mv({label:'Ducken-Schlag',key:'↓ + J',anim:'cpunch',su:3,ac:3,rc:6,dmg:26,hs:17,bs:10,pb:2,lv:'low',crouch:true,box:[10,-46,74,28],hstop:4}),
 '2M':mv({label:'Ducken-Tritt (tief)',key:'↓ + K',anim:'ckick',su:5,ac:4,rc:10,dmg:50,hs:21,bs:14,pb:3,lv:'low',crouch:true,box:[10,-34,118,32],hstop:5}),
 '2H':mv({label:'Launcher',key:'↓ + L',anim:'upper',su:7,ac:4,rc:16,dmg:80,hs:40,bs:16,pb:2,crouch:true,box:[8,-160,72,128],launch:{vx:2.6,vy:-18},jc:true,hstop:8,shake:5,glow:1}), // LAUNCHER
 // --- Luft-Normals ---
 'jL':mv({label:'Luft-Schlag',key:'J in der Luft',anim:'jpunch',air:true,su:3,ac:8,dmg:28,hs:30,bs:10,box:[10,-112,62,38],hstop:4}),
 'jM':mv({label:'Luft-Tritt',key:'K in der Luft',anim:'jkick',air:true,su:4,ac:8,dmg:50,hs:30,bs:12,box:[5,-88,86,46],hstop:5}),
 'jH':mv({label:'Luft-Hammer (Knockdown)',key:'L in der Luft',anim:'jheavy',air:true,su:7,ac:8,dmg:85,hs:32,bs:16,box:[0,-112,88,72],hard:true,hstop:8,shake:5,glow:1}), // harter Knockdown
 // --- Specials (QCF/DP/QCB + Angriff, oder Special-Taste: neutral / vorwärts / unten) ---
 // --- Neue Slots: Command-Normals (→ + K / → + L), Rück-Special (← + U), Luft-Special (U in der Luft) ---
 '6M':mv({label:'Überkopfschlag',key:'→ + K',anim:'kick',su:12,ac:4,rc:12,dmg:60,hs:22,bs:14,pb:3,lv:'high',box:[10,-150,92,50],hstop:6,lunge:2}),
 '6H':mv({label:'Vorstoß-Faust',key:'→ + L',anim:'heavy',su:11,ac:4,rc:15,dmg:95,hs:28,bs:20,pb:7,box:[10,-130,120,48],lunge:5,hstop:8,shake:4,glow:1}),
 back:mv({label:'Beinfeger',key:'← + U',anim:'ckick',special:true,crouch:true,lv:'low',su:9,ac:4,rc:18,dmg:60,hs:30,bs:12,box:[10,-30,130,34],hard:true,hstop:7,shake:3,spc:false}),
 airsp:mv({label:'Sturzkick',key:'U in der Luft',anim:'jkick',special:true,air:true,su:5,ac:60,rc:6,dmg:70,hs:26,bs:16,box:[0,-70,76,90],dive:{vx:5,vy:13},land:10,hstop:7,shake:3,glow:1,spc:false}),
 fireball:mv({label:'Energiewelle',key:'↓↘→ + Angriff  oder  U',anim:'special',special:true,su:11,ac:1,rc:18,glow:1,proj:{frame:11,y:-96,vx:8.5,w:76,h:50,dmg:70,hs:20,bs:12,life:100}}),
 rising:mv({label:'Aufwärtshaken',key:'→↓↘ + Angriff  oder  → + U',anim:'upper',special:true,su:4,ac:10,rc:20,dmg:95,hs:40,bs:20,box:[0,-175,76,175],launch:{vx:2.4,vy:-18},inv:[1,12],rise:{vx:3,vy:-18},land:12,hstop:12,shake:5,glow:1}),
 rush:mv({label:'Sprint-Schlag',key:'↓↙← + Angriff  oder  ↓ + U',anim:'heavy',special:true,su:7,ac:7,rc:14,dmg:80,hs:24,bs:14,pb:7,box:[10,-124,100,76],lunge:9,hstop:7,shake:3,glow:1}),
 super:mv({label:'Hyper Beam',key:'I (1 Balken)',anim:'special',special:true,super:true,cost:100,su:8,ac:36,rc:22,dmg:30,hs:20,bs:16,box:[20,-150,560,92],multi:4,minScale:.5,launch:{vx:5,vy:-12},inv:[0,46],hstop:2,shake:5,glow:1,beam:1,spc:false}),
};
export function buildMoves(char){const out={};for(const k in BASE_MOVES){const md=char.mods&&char.mods[k];out[k]={...BASE_MOVES[k],...(typeof md==='function'?md(BASE_MOVES[k]):(md||{}))}}return out}
// Für die Move-Liste im UI (Allgemeines). Figurenspezifische Moves: charMoves(char)
export const MOVE_LIST=[
 ['Light / Medium / Heavy','J / K / L','Chain: L → M → H, danach Special-Cancel'],
 ['Command-Normals','→ + K  /  → + L','Je Figur anders (Überkopf, Griff, Vorstoß …)'],
 ['Special-Taste','U  (neutral / → / ↓ / ←)','Specials ohne Motion: neutral, vorwärts, unten, zurück'],
 ['Luft-Special','U in der Luft','Je Figur anders (Sturz, Projektil …)'],
 ['Stärke der Specials','Motion + J / K / L','Leicht = schnell & schwach, Heavy = langsam & stark (Wellen/Bälle)'],
 ['Hyper','I (1 Balken)','Je Figur anders'],
 ['Dash / Air-Dash','O  oder  Doppeltipp ←/→','Auch in der Luft (1×)'],
 ['Doppelsprung','W/Space in der Luft','1× pro Luftphase (Sorceress 2×, Minotaurus 0×)']];
const ORDER_KEYS=['5L','5M','5H','2L','2M','2H','6M','6H','fireball','rising','rush','back','airsp','super'];
export function charMoves(char){const mv=buildMoves(char);return ORDER_KEYS.filter(k=>mv[k]).map(k=>[mv[k].label,mv[k].key,mv[k].info||''])}
