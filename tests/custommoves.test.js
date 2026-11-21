// Move-Editor der eigenen Figur (eigene Assets je Animation): reine Logik ohne DOM. node tests/custommoves.test.js
import assert from'node:assert/strict';
import{CUS_ANIMS,CUS_ANIM_LABELS,CUS_STAND_H,CUS_MOVE_GROUPS,CUS_MOVE_KEYS,CUS_MAX_MOVE_FRAMES,cusKeyOut,cusBuildAnims,cusCompleteAnims,cusCleanMoves,cusCleanProps,cusFrameGeom,cusMoveAnims,cusMoveImgs,cusMoveName,cusPlanImage,cusPlanMoveSheet,cusMvMove,cusMvRemove,cusMvInsert,cusMvReplace,cusNewId}from'../src/core/custom.js';

// Künstliches Sheet wie in custom.test.js: cols x rows Zellen, grüner Hintergrund, je Zelle ein „Kämpfer“ (Körper 100 breit, Höhe h, optional Arm)
function sheet(cols,rows,{cw=600,ch=600,figs={},base=540}={}){const w=cols*cw,h=rows*ch,d=new Uint8ClampedArray(w*h*4);for(let i=0;i<w*h;i++){d[i*4+1]=255;d[i*4+3]=255}
 const rect=(x0,y0,x1,y1)=>{for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const o=(y*w+x)*4;d[o]=40;d[o+1]=110;d[o+2]=200;d[o+3]=255}};
 for(let i=0;i<cols*rows;i++){const f=figs[i];if(f===null)continue;const g=f||{},c=i%cols,r=Math.floor(i/cols),cx=c*cw+cw/2+(g.dx||0),b=r*ch+base+(g.dy||0),bh=g.h||300;rect(cx-50,b-bh,cx+50,b);if(g.arm)rect(cx+50,b-bh+60,cx+50+g.arm,b-bh+90)}
 cusKeyOut(d,w,h);return{d,w,h}}
const fr=(id,o={})=>({id,img:o.img||'img'+id,w:o.w||100,h:o.h||200,ox:o.ox==null?-50:o.ox,oy:o.oy==null?-200:o.oy,air:!!o.air,adj:o.adj||{s:1,dx:0,dy:0}});

// 1) Jede Animation des Spiels hat einen Move-Bereich (inkl. Hyper), keine doppelt, alle mit Beschriftung, in Gruppen sortiert
{assert.equal(new Set(CUS_MOVE_KEYS).size,CUS_MOVE_KEYS.length,'keine Doppelten');
 for(const k of Object.keys(CUS_ANIMS))assert.ok(CUS_MOVE_KEYS.includes(k),'Move-Bereich für '+k);assert.ok(CUS_MOVE_KEYS.includes('hyper'),'Hyper-Special');
 for(const k of CUS_MOVE_KEYS)assert.ok(CUS_ANIM_LABELS[k],'Beschriftung '+k);assert.equal(CUS_MOVE_GROUPS.length,3);
 for(const k of['punch','heavy','kick','cpunch','ckick','jpunch','jkick','jheavy','upper','special','hyper','hit','airhit','block','cblock','kd','wakeup','win'])assert.ok(CUS_MOVE_KEYS.includes(k),k)}

// 2) Bereinigen: kaputte Einträge fliegen raus, Werte werden begrenzt, leere Moves verschwinden, gültige bleiben unverändert
{const raw={punch:{frames:[fr('aaa1'),{id:'<x>',img:'b'},null,fr('aaa1'),{...fr('bbb2'),adj:{s:99,dx:-999,dy:'x'}}],props:{fps:500,loop:1,lean:'abc',squash:.05,evil:1}},
  nix:{frames:[fr('ccc3')]},kick:{frames:[]},heavy:'kaputt'};
 const c=cusCleanMoves(raw);assert.deepEqual(Object.keys(c),['punch'],'nur gültige Moves');assert.deepEqual(c.punch.frames.map(f=>f.id),['aaa1','bbb2'],'doppelte/kaputte IDs entfernt');
 assert.equal(c.punch.frames[1].adj.s,2.5);assert.equal(c.punch.frames[1].adj.dx,-200);assert.equal(c.punch.frames[1].adj.dy,0);
 assert.equal(c.punch.props.fps,60);assert.equal(c.punch.props.loop,1);assert.ok(!('lean'in c.punch.props)&&!('evil'in c.punch.props),'unbekannte/ungültige Eigenschaften weg');assert.equal(c.punch.props.squash,.3);
 assert.deepEqual(cusCleanMoves(c),c,'bereinigen ist idempotent');assert.deepEqual(cusCleanMoves(null),{});assert.deepEqual(cusCleanMoves('x'),{});
 const many={kick:{frames:Array.from({length:80},(_,i)=>fr('k'+String(i).padStart(3,'0')))}};assert.equal(cusCleanMoves(many).kick.frames.length,CUS_MAX_MOVE_FRAMES,'Obergrenze Frames pro Move');
 assert.deepEqual([...cusMoveImgs(c)].sort(),['imgaaa1','imgbbb2'],'benutzte Bilder')}

// 3) Geometrie: Feinabstimmung skaliert um den Ankerpunkt, Luft-Frames hängen an der Körpermitte
{const g0=cusFrameGeom(fr('g1'));assert.deepEqual(g0,{dw:100,dh:200,ox:-50,oy:-200});
 const g1=cusFrameGeom(fr('g2',{adj:{s:.5,dx:10,dy:-4}}));assert.deepEqual(g1,{dw:50,dh:100,ox:-25+10,oy:-100-4},'halbe Größe: Versatz halbiert, dann verschoben');
 const a=cusFrameGeom(fr('g3',{air:true}));assert.equal(a.ox,-50);assert.equal(a.oy,-(105+100),'Luft: Körpermitte');
 const a2=cusFrameGeom(fr('g4',{air:true,adj:{s:2,dx:0,dy:0}}));assert.equal(a2.dw,200);assert.equal(a2.ox,-100);assert.equal(a2.oy,-(105+200))}

// 4) Move-Animationen: Frame-Namen mv_<id>, nur Moves mit Frames, Eigenschaften bereinigt
{const m={punch:{frames:[fr('p01'),fr('p02')],props:{fps:20,loop:1,lean:.1}},kick:{frames:[]},hyper:{frames:[fr('h01')]}};
 const a=cusMoveAnims(m);assert.deepEqual(Object.keys(a),['punch','hyper']);assert.deepEqual(a.punch.frames,['mv_p01','mv_p02']);assert.equal(a.punch.fps,20);assert.equal(a.punch.lean,.1);assert.equal(cusMoveName('p01'),'mv_p01');assert.deepEqual(cusMoveAnims(null),{})}

// 5) Einzelbild: Maßstab über die Höhe des Zuschnitts, Fußlinie/Körpermitte, Rand-Hinweis
{const{d,w,h}=sheet(1,1,{cw:700,ch:700,figs:{0:{h:300,arm:200}}});
 const p=cusPlanImage(d,w,h,{targetH:150});assert.ok(!p.error);assert.ok(Math.abs(p.dh-150)<=1,'Zielhöhe getroffen: '+p.dh);assert.ok(Math.abs(p.scale-150/p.sh)<1e-9);
 assert.ok(Math.abs(p.oy+p.dh)<=3,'Fußlinie: Unterkante bei y=0');assert.ok(p.dw>p.dh*.5,'Arm vergrößert den Zuschnitt');
 const p2=cusPlanImage(d,w,h,{});assert.ok(Math.abs(p2.dh-CUS_STAND_H)<=1,'ohne Ziel: Standhöhe');
 const p3=cusPlanImage(d,w,h,{scale:.5});assert.ok(Math.abs(p3.scale-.5)<1e-9);
 const{d:e,w:ew,h:eh}=sheet(1,1,{figs:{0:null}});assert.ok(cusPlanImage(e,ew,eh,{}).error,'leeres Bild -> Fehler');
 const{d:f,w:fw,h:fh}=sheet(1,1,{cw:200,ch:300,base:300,figs:{0:{h:300}}});assert.ok(cusPlanImage(f,fw,fh,{}).notes.some(n=>/rand/i.test(n)),'Rand berührt')}

// 6) Sheet für einen Move: Standard = Zelle 1 kalibriert (Frames 2-N), ohne Kalibrierung alle Zellen, freies Raster
{const figs={0:{},1:{dx:20},2:{arm:150},3:{h:200},4:{},5:{}};const{d,w,h}=sheet(3,2,{figs});
 const p=cusPlanMoveSheet(d,w,h,3,2);assert.ok(!p.error&&p.calib);assert.deepEqual(p.frames.map(f=>f.cell),[1,2,3,4,5]);assert.ok(Math.abs(p.scale-CUS_STAND_H/300)<.01);
 const q=cusPlanMoveSheet(d,w,h,3,2,{calib:false});assert.deepEqual(q.frames.map(f=>f.cell),[0,1,2,3,4,5],'alle Zellen');assert.ok(Math.abs(q.scale-CUS_STAND_H/300)<.01,'höchste Pose bekommt Standhöhe');
 const r=cusPlanMoveSheet(d,w,h,3,2,{calib:false,scale:.5});assert.ok(Math.abs(r.scale-.5)<1e-9);
 const s4=sheet(2,2,{cw:600,ch:600,figs:{0:{},1:{},2:{},3:{}}});const t=cusPlanMoveSheet(s4.d,s4.w,s4.h,2,2);assert.deepEqual(t.frames.map(f=>f.cell),[1,2,3],'2x2-Raster');
 const bad=sheet(3,2,{figs:{0:null,1:{},2:{},3:{},4:{},5:{}}});const e=cusPlanMoveSheet(bad.d,bad.w,bad.h,3,2);assert.ok(e.error&&/Zelle 1/.test(e.error),'leere Zelle 1 mit Kalibrierung -> Fehler');
 const e2=cusPlanMoveSheet(bad.d,bad.w,bad.h,3,2,{calib:false});assert.ok(!e2.error&&e2.notes.some(n=>/Zelle 1 ist leer/.test(n)),'ohne Kalibrierung: leere Zelle wird übersprungen');assert.deepEqual(e2.frames.map(f=>f.cell),[1,2,3,4,5]);
 const one=sheet(1,1,{figs:{0:{h:250}}});const o=cusPlanMoveSheet(one.d,one.w,one.h,1,1);assert.ok(!o.error&&o.frames.length===1&&!o.calib,'1x1 = Einzelbild ohne Kalibrierung');
 const wrong=cusPlanMoveSheet(d,w,h,9,9);assert.ok(wrong.frames.length>=0,'falsches Raster stürzt nicht ab')}

// 7) Frame-Listen: verschieben/löschen/einfügen/ersetzen – rein (Original bleibt unverändert)
{const a=['a','b','c','d'];assert.deepEqual(cusMvMove(a,0,2),['b','c','a','d']);assert.deepEqual(cusMvMove(a,3,0),['d','a','b','c']);assert.equal(cusMvMove(a,1,1),a);assert.equal(cusMvMove(a,-1,2),a);assert.equal(cusMvMove(a,0,9),a);
 assert.deepEqual(cusMvRemove(a,1),['a','c','d']);assert.equal(cusMvRemove(a,7),a);assert.deepEqual(cusMvInsert(a,2,'x','y'),['a','b','x','y','c','d']);assert.deepEqual(cusMvInsert(a,99,'z'),['a','b','c','d','z']);assert.deepEqual(cusMvInsert(a,-5,'z'),['z','a','b','c','d']);
 assert.deepEqual(cusMvReplace(a,2,'R'),['a','b','R','d']);assert.equal(cusMvReplace(a,5,'R'),a);assert.deepEqual(a,['a','b','c','d'],'Original unverändert')}

// 8) Zusammenspiel mit Sheets/Behelfen: Move-Frames haben Vorrang, nur der ersetzte Move ändert sich, Behelfe nutzen die neuen Frames
{const have=new Set([0,1,2,3,4,5].map(i=>'idle_1_'+i).concat([1,2,3,4,5].map(i=>'punch_'+i)));const real=cusBuildAnims(have);
 const base=cusCompleteAnims(real);assert.equal(base.punch.frames[0],'punch_1');assert.equal(base.heavy.frames[0],'punch_1','Behelf Schwerer Schlag = Schlag');assert.ok(base.hyper&&base.hyper.frames.length,'Hyper hat einen Behelf');
 const moves={punch:{frames:[fr('n01'),fr('n02'),fr('n03')],props:{fps:9}}};
 const all=cusCompleteAnims({...real,...cusMoveAnims(moves)});
 assert.deepEqual(all.punch.frames,['mv_n01','mv_n02','mv_n03'],'eigene Frames ersetzen das Sheet');assert.equal(all.punch.fps,9);assert.deepEqual(all.idle.frames,base.idle.frames,'andere Moves unberührt');
 assert.equal(all.heavy.frames[0],'mv_n01','Behelf folgt den neuen Frames');assert.equal(all.hit.frames.length,base.hit.frames.length);
 // einzelnes Frame austauschen: nur Position 1 ändert sich
 const m2={punch:{...moves.punch,frames:cusMvReplace(moves.punch.frames,1,fr('n09'))}};const all2=cusCompleteAnims({...real,...cusMoveAnims(m2)});assert.deepEqual(all2.punch.frames,['mv_n01','mv_n09','mv_n03']);
 // alle Frames gelöscht -> Move zählt als nicht belegt: zurück auf das Sheet
 const m3={punch:{frames:cusMvRemove(cusMvRemove(cusMvRemove(moves.punch.frames,0),0),0)}};assert.deepEqual(Object.keys(cusMoveAnims(m3)),[]);assert.equal(cusCompleteAnims({...real,...cusMoveAnims(m3)}).punch.frames[0],'punch_1');
 // nur Idle aus Einzelframes (ohne Sheet) reicht für eine spielbare Figur
 const only=cusCompleteAnims(cusMoveAnims({idle:{frames:[fr('i01'),fr('i02')],props:{loop:1,fps:6}}}));assert.ok(only&&only.punch&&only.hyper&&only.kd,'Idle aus Einzelbildern -> alle Zustände belegt')}

// 9) Eigenschaften und IDs
{assert.deepEqual(cusCleanProps({fps:0,loop:0,bob:99}),{fps:1,loop:0,bob:20});assert.ok(/^[a-z0-9]{8}$/.test(cusNewId())&&cusNewId()!==cusNewId())}
console.log('Move-Editor-Tests (Logik) bestanden');
