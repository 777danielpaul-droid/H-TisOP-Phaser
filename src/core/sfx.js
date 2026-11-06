// Zuordnung Spielereignis -> Sound (rein logisch, ohne Audio-API -> headless testbar). Namen = Dateien in /sfx (ohne .ogg).
// Ausgabe: Liste [name, {vol, rate}]; Game.sfxList() reicht sie an game.audio.play() weiter (null im Test/ohne Ton).
// Stärke (s) aus dem Move-Schaden: 1 = leicht (<45), 2 = mittel (<70), 3 = schwer. Treffer-Art: Tritt (anim enthält 'kick') oder Schlag.
export const strike=mv=>{const d=mv.dmg||0;return{kick:/kick/.test(mv.anim||''),s:d>=70?3:d>=45?2:1}};
// Schwung-Geräusch beim Beginn der aktiven Frames (Nahkampf-Moves; Projektile/Hyper haben eigene Sounds)
export function swingSound(mv){const{s}=strike(mv);
 if(mv.launch)return['heavy_hit_whoosh',{vol:.8,rate:.75}];
 return s>=3?['whoosh_heavy',{vol:.95}]:s===2?['whoosh_light',{vol:.9,rate:.74}]:['whoosh_light',{vol:.8,rate:.82}]}
// Treffer: Basis-Sound nach Art+Stärke, Launcher/harte Treffer bekommen Impact+Sweetener, Hyper-Finale den Critical-Hit
export function hitSounds(mv,{launch=false,proj=false}={}){const{kick,s}=strike(mv),o=[];
 if(proj)return s>=3?[['heavy_hit_impact',{vol:.8}]]:[['punch_medium',{vol:.9,rate:.9}]];
 const v=mv.multi&&!launch?.55:1;
 if(kick)o.push(s===1?['kick_light',{vol:v}]:s===2?['kick_heavy',{vol:.85*v,rate:1.18}]:['kick_heavy',{vol:v}]);
 else o.push([['punch_light','punch_medium','punch_heavy'][s-1],{vol:v}]);
 if(mv.super&&launch)o.push(['heavy_hit_impact',{vol:1}],['punch_heavy',{vol:.9}]);
 else if(launch)o.push(['heavy_hit_impact',{vol:.7}]);
 else if(mv.hard)o.push(['heavy_hit_impact',{vol:.5}]);
 return o}
export const comboStep=hits=>'combo_step_0'+Math.max(1,Math.min(4,hits-1));
