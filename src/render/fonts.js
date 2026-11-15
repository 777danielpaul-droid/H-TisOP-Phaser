// Schriften: Bebas Neue (Display/Banner), Orbitron (Logo/Tech), Rajdhani (UI-Text). Eingebettet als Data-URI (window.__FONTS__, vom Build),
// damit alles offline per Doppelklick läuft. Fehlt eine Schrift (z. B. Test/Headless), greifen die System-Fallbacks.
const CJK='"Yu Gothic","Hiragino Sans","Noto Sans CJK JP","Noto Sans JP","Microsoft YaHei","PingFang SC"';
export const F_DISP=`"Bebas Neue",${CJK},Impact,"Arial Narrow",sans-serif`;
export const F_TECH=`"Orbitron","Bebas Neue",${CJK},"Arial Black",sans-serif`;
export const F_UI=`"Rajdhani","Segoe UI",${CJK},system-ui,sans-serif`;
export function loadFonts(){
 const D=typeof window!=='undefined'&&window.__FONTS__,FF=typeof FontFace!=='undefined'?FontFace:null;
 if(!D||!FF||typeof document==='undefined'||!document.fonts||!document.fonts.add)return;
 const defs=[['Bebas Neue','bebas','100 900'],['Orbitron','orbitron-900','100 900'],['Rajdhani','rajdhani-500','100 600'],['Rajdhani','rajdhani-700','700 900']];
 for(const[fam,key,w]of defs){if(!D[key])continue;
  try{const f=new FF(fam,`url(${D[key]})`,{weight:w});f.load().then(x=>document.fonts.add(x)).catch(()=>{})}catch(e){}}}
