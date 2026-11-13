// Controller (PS4 DualShock 4, PS5 DualSense, Xbox u. a.): einheitliche Tastennamen, Beschriftung und Menü-Navigation.
// Verbindung: einfach per Bluetooth (oder USB-Kabel) mit Mac/PC koppeln und im Spiel EINE Taste drücken (Browser-Regel: vorher sieht die Seite den Controller nicht).
// Kanonische Namen: cross circle square triangle l1 r1 l2 r2 share options l3 r3 ps touchpad up down left right
const STD=['cross','circle','square','triangle','l1','r1','l2','r2','share','options','l3','r3','up','down','left','right','ps','touchpad'];
// Ältere Firefox-/Linux-Belegung des DualShock 4 / DualSense (mapping !== 'standard'): Quadrat/Kreuz/Kreis vertauscht, Steuerkreuz als Hat-Achse 9
const SONY_RAW=['square','cross','circle','triangle','l1','r1','l2','r2','share','options','l3','r3','ps','touchpad'];
const HAT={'-1':['up'],'-0.71':['up','right'],'-0.43':['right'],'-0.14':['right','down'],'0.14':['down'],'0.43':['down','left'],'0.71':['left'],'1':['left','up']};
const DEAD=.5;
export const isSony=gp=>!!gp&&/054c|sony|playstation|dualshock|dualsense|wireless controller/i.test(gp.id||'');
export function padLabel(gp){const id=(gp&&gp.id)||'';
 if(/0ce6|0df2|dualsense/i.test(id))return'PS5-Controller';
 if(/05c4|09cc|0ba0|dualshock/i.test(id))return'PS4-Controller';
 if(isSony(gp))return'PlayStation-Controller';
 if(/xbox|045e/i.test(id))return'Xbox-Controller';
 return id.replace(/\s*\(.*$/,'').trim()||'Controller'}
// gp (Gamepad-Objekt) -> {dx,dy,down:Set<Name>}; dx/dy aus linkem Stick ODER Steuerkreuz (-1/0/1)
export function readPad(gp){const down=new Set(),b=(gp&&gp.buttons)||[],a=(gp&&gp.axes)||[];
 const raw=!!gp&&gp.mapping!=='standard'&&isSony(gp)&&gp.mapping!=='xr-standard',names=raw?SONY_RAW:STD,pr=i=>!!(b[i]&&(b[i].pressed||b[i].value>.5));
 for(let i=0;i<names.length&&i<b.length;i++)if(pr(i))down.add(names[i]);
 if(raw&&a.length>9){const h=HAT[String(Math.round(a[9]*100)/100)];if(h)for(const n of h)down.add(n)}
 const lx=a[0]||0,ly=a[1]||0;
 const dx=((lx>DEAD||down.has('right'))?1:0)-((lx<-DEAD||down.has('left'))?1:0),dy=((ly>DEAD||down.has('down'))?1:0)-((ly<-DEAD||down.has('up'))?1:0);
 return{dx,dy,down}}
// Menü-Navigation: liefert frisch gedrückte Tasten (Richtungen mit Wiederholung beim Halten). active=false -> nur mitlesen (gehaltene Tasten lösen später nichts aus)
const DIRN=new Set(['up','down','left','right']);
export class PadNav{
 constructor(){this.prev=new Map();this.rep=new Map()}
 poll(now,pads,active=true){const out=[],seen=new Set();
  pads.forEach((gp,slot)=>{const r=readPad(gp),held=new Set(r.down);
   if(r.dx<0)held.add('left');else if(r.dx>0)held.add('right');if(r.dy<0)held.add('up');else if(r.dy>0)held.add('down');
   const k=gp.index,prev=this.prev.get(k)||new Set(),rep=this.rep.get(k)||{};seen.add(k);
   for(const n of held){
    if(!prev.has(n)){if(active)out.push({slot,name:n});rep[n]=now+400}
    else if(DIRN.has(n)&&now>=rep[n]){if(active)out.push({slot,name:n});rep[n]=now+110}}
   for(const n of Object.keys(rep))if(!held.has(n))delete rep[n];
   this.prev.set(k,held);this.rep.set(k,rep)});
  for(const k of[...this.prev.keys()])if(!seen.has(k)){this.prev.delete(k);this.rep.delete(k)}
  return out}
}
// Controller-Taste -> Tastaturcode, den die vorhandene Menü-Logik (main.js) schon versteht. null = nichts tun.
// c.screen: 'intro' | 'start' | 'menu' (Auswahl, End-Bildschirme, Booster/Shop) | 'versus' (2-Spieler-Auswahl, c.who = 1|2) | 'fight' | 'online' (c.ask: Verlassen-Abfrage/Ende)
const MENU={left:'ArrowLeft',right:'ArrowRight',up:'ArrowUp',down:'ArrowDown',cross:'Enter',circle:'Escape',square:'KeyC',triangle:'KeyB',l1:'Tab',r1:'Tab',l2:'KeyP',r2:'KeyK',options:'KeyM'};
export function menuKey(name,c){
 switch(c.screen){
  case'intro':return name==='cross'||name==='options'||name==='circle'?'Enter':null;
  case'start':return{left:'ArrowLeft',l1:'ArrowLeft',right:'ArrowRight',r1:'ArrowRight',cross:'Enter',triangle:'KeyV'}[name]||null;
  case'fight':return name==='options'?'KeyM':null;
  case'online':if(name==='options')return'Escape';if(c.ask)return name==='cross'?'Enter':name==='circle'?'Escape':null;return null;
  case'versus':{const p2=c.who===2;
   const m={left:p2?'ArrowLeft':'KeyA',right:p2?'ArrowRight':'KeyD',up:'ArrowUp',down:'ArrowDown',cross:p2?'Enter':'KeyG',circle:'Escape',square:p2?'KeyL':'KeyC',triangle:'KeyB',l1:'Tab',r1:'Tab',r2:'KeyT',options:'KeyM'};
   return m[name]||null}
  default:return MENU[name]||null}}
