

import{R}from'./sprites.js';
// Zweite Farbe je Figur: der Atlas wird beim ersten Gebrauch per Farbtausch (HSV) umgefärbt und als eigenes Bild gemerkt.
// Neue Farbe = Eintrag in SKINS (name, Farbpunkt für die Auswahl) + passender Zweig in recolor().
// Skin 0 = Originalfarben (unverändert); Alpha, Linien und dunkle Schattierungen bleiben erhalten.
export const SKINS={
 tiger:[{name:'BLAU',col:'#2f6bff'},{name:'WEISS',col:'#f1f3ff'},{name:'ROT',col:'#ff4a3a'},{name:'GRÜN',col:'#3adf6a'}],   // Skin 2+ nur aus Boostern (core/loot.js)
 st3g0:[{name:'GRÜN',col:'#7dff4a'},{name:'GRAUBLAU',col:'#7b93b8'},{name:'ROT',col:'#ff5a4a'},{name:'BLAU',col:'#4a7bff'}],
 kitsune:[{name:'GRAU',col:'#9a9aa3'},{name:'LILA',col:'#a47bd8'},{name:'ORANGE',col:'#ff9a3a'},{name:'EISBLAU',col:'#7fd0ff'}]};
export const skinCount=id=>(SKINS[id]||[]).length;
export const skinName=(id,k)=>{const s=SKINS[id];return s&&s[k]?s[k].name:''};
export const sm=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
export function rgb2hsv(r,g,b){const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;let h=0;
 if(d>1e-6){h=mx===r?((g-b)/d)%6:mx===g?2+(b-r)/d:4+(r-g)/d;h*=60;if(h<0)h+=360}
 return[h,mx>0?d/mx:0,mx]}
export function hsv2rgb(h,s,v){h=((h%360)+360)%360/60;const i=Math.floor(h)%6,f=h-Math.floor(h),p=v*(1-s),q=v*(1-s*f),t=v*(1-s*(1-f));
 return[[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]][i]}
// Gewicht w (0..1) und neue HSV-Werte je Figur. Rückgabe null = Pixel bleibt unverändert.
export const RULES={
 // Tiger: blaues Fell/Gi -> weiß (Schatten bleiben als Grau), sehr dunkle Streifen/Linien bleiben
 tiger:(h,s,v)=>{const w=sm(.25,.5,s)*(1-sm(40,80,Math.abs(h-225)))*sm(.18,.42,v);if(w<.003)return null;
  return[h,s*(1-w*.9),Math.min(1,.30+v*.80)*w+v*(1-w)]},
 // ST3-G0: grüne Haut -> graublau
 st3g0:(h,s,v)=>{const w=sm(.12,.35,s)*(1-sm(50,90,Math.abs(h-110)))*sm(.12,.3,v);if(w<.003)return null;
  return[h+(212-h)*w,s*(1-w*.5),v*(1-w*.04)]},
 // Kitsune: graues Fell (wenig Sättigung, mittel hell, leicht bläulich) -> lila; Bandagen (warm), Augen, Kleidung, helle Staub-/Schlierenwolken bleiben
 kitsune:(h,s,v,r,b)=>{if(s>=.26||b<r-.024)return null;const w=sm(.16,.34,v)*(1-sm(.80,.92,v));if(w<.01)return null;
  return[266,s*(1-w)+(.24+.14*v)*w,Math.min(1,v*(1+.04*w))]}};
// Booster-Skins (2+): Tiger/ST3-G0 = Farbton verschieben, Kitsune (graues Fell) = Tönung
export const shift=d=>(h,s,v)=>s>.18&&v>.1?[h+d,s,v]:null;
export const tint=(hue,sat)=>(h,s,v,r,b)=>{if(s>=.26||b<r-.024)return null;const w=sm(.16,.34,v)*(1-sm(.80,.92,v));if(w<.01)return null;return[hue,s*(1-w)+sat*w,v]};
export const EXTRA={tiger:{2:shift(150),3:shift(255)},st3g0:{2:shift(250),3:shift(120)},kitsune:{2:tint(24,.5),3:tint(200,.35)}};
export function recolor(id,data,skin){   // data = RGBA-Bytes (ImageData.data), wird direkt verändert
 const rule=skin>0&&(skin>=2?EXTRA[id]&&EXTRA[id][skin]:RULES[id]);if(!rule)return data;
 for(let i=0;i<data.length;i+=4){if(data[i+3]===0)continue;
  const r=data[i]/255,g=data[i+1]/255,b=data[i+2]/255,[h,s,v]=rgb2hsv(r,g,b),o=rule(h,s,v,r,b);if(!o)continue;
  const c=hsv2rgb(o[0],Math.min(1,Math.max(0,o[1])),Math.min(1,Math.max(0,o[2])));data[i]=Math.round(c[0]*255);data[i+1]=Math.round(c[1]*255);data[i+2]=Math.round(c[2]*255)}
 return data}
