// Freischaltbare Kämpfer (Browser-Speicher). Ohne localStorage (Tests, gesperrter Speicher) -> nichts gespeichert, nichts freigeschaltet.
// Zum Ausprobieren ohne Durchspielen: Seite mit ?unlock=anubis öffnen (schaltet Anubis dauerhaft frei).
const UNLOCK_KEY='hitisop.unlocks';
export function loadUnlocks(){let a=[];try{const v=JSON.parse(localStorage.getItem(UNLOCK_KEY)||'[]');if(Array.isArray(v))a=v}catch(e){}
 try{const m=/[?&]unlock=([a-z0-9_,-]+)/i.exec(location.search);if(m){for(const id of m[1].split(','))if(!a.includes(id))a.push(id);localStorage.setItem(UNLOCK_KEY,JSON.stringify(a))}}catch(e){}
 return a}
export function saveUnlock(id){try{const a=loadUnlocks();if(!a.includes(id)){a.push(id);localStorage.setItem(UNLOCK_KEY,JSON.stringify(a))}}catch(e){}}

// Durchlauf-Zähler (Arcade geschafft / letztes Story-Kapitel geschafft) für die Freischaltung von ST3-G0 (3) und Anubis (4), siehe CLEAR_UNLOCKS in characters.js. Ohne localStorage -> 0, nichts gezählt.
const CLEAR_KEY='hitisop.clears';
export function getClears(){try{return Math.max(0,parseInt(localStorage.getItem(CLEAR_KEY)||'0',10)||0)}catch(e){return 0}}
export function addClear(){try{const n=getClears()+1;localStorage.setItem(CLEAR_KEY,String(n));return n}catch(e){return 0}}
