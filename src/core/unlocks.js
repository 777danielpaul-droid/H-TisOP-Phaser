// Freischaltbare Kämpfer (Browser-Speicher). Ohne localStorage (Tests, gesperrter Speicher) -> nichts gespeichert, nichts freigeschaltet.
// Zum Ausprobieren ohne Durchspielen: Seite mit ?unlock=anubis öffnen (schaltet Anubis dauerhaft frei).
const UNLOCK_KEY='hitisop.unlocks';
export function loadUnlocks(){let a=[];try{const v=JSON.parse(localStorage.getItem(UNLOCK_KEY)||'[]');if(Array.isArray(v))a=v}catch(e){}
 try{const m=/[?&]unlock=([a-z0-9_,-]+)/i.exec(location.search);if(m){for(const id of m[1].split(','))if(!a.includes(id))a.push(id);localStorage.setItem(UNLOCK_KEY,JSON.stringify(a))}}catch(e){}
 return a}
export function saveUnlock(id){try{const a=loadUnlocks();if(!a.includes(id)){a.push(id);localStorage.setItem(UNLOCK_KEY,JSON.stringify(a))}}catch(e){}}
