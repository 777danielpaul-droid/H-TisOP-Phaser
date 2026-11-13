#!/usr/bin/env python3
"""Packt die Tiger-Einzelframes (assets/tiger/source/*.png) in assets/tiger/atlas.webp + meta.json + meta.js. Nur nötig, wenn sich die Quell-Frames ändern (braucht Pillow + numpy).
Liegen neue Gemini-Posenbögen in assets/tiger/sheets/, wird stattdessen tools/import-tiger-sheets.py ausgeführt.
Aufruf: python3 tools/make-sprites.py
Tiger: Einzelframes (assets/tiger/source/*.png, 472x360, Pivot = Zellmitte/Fußlinie) -> Atlas; Frames liegen schon an der Fußlinie, daher überall Anker 'cell'."""
import json,os,sys
from PIL import Image
import numpy as np
ASSETS=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','assets')
# ---- Tiger: Einzelframes statt Sheets ----
TIGER_SKIP=('hit_light_',)            # nur Kopf-Frames (nicht als Ganzkörper nutzbar)
TIGER_AIR={'fall_00','fall_01','hit_heavy_02'}   # zusätzlich als 'air'-Variante (Name + 'a'): Körpermitte auf fester Höhe für Luft-Treffer
TIGER_AIR_CENTER=92
def build_tiger():
    sd=os.path.join(ASSETS,'tiger','sheets')
    if os.path.isdir(sd) and any(f.lower().endswith(('.png','.jpg','.jpeg','.webp')) and not f.startswith('_') for f in os.listdir(sd)):   # neue Gemini-Sheets vorhanden -> eigener Importer
        import runpy
        try:runpy.run_path(os.path.join(os.path.dirname(os.path.abspath(__file__)),'import-tiger-sheets.py'),run_name='__main__')
        except SystemExit:pass
        return
    root=os.path.join(ASSETS,'tiger');src=os.path.join(root,'source');frames=[];bottoms=[]
    for fn in sorted(os.listdir(src)):
        if not fn.endswith('.png') or fn.startswith(TIGER_SKIP):continue
        im=Image.open(os.path.join(src,fn)).convert('RGBA');al=np.array(im)[:,:,3];ys,xs=np.where(al>8)
        if len(xs)==0:continue
        cw,ch=im.size;bx0,bx1,by0,by1=[int(v) for v in (max(xs.min()-2,0),min(xs.max()+3,cw),max(ys.min()-2,0),min(ys.max()+3,ch))]
        if fn.startswith('idle_'):bottoms.append(int(ys.max())+1)
        frames.append(dict(name=fn[:-4],cw=cw,img=im.crop((bx0,by0,bx1,by1)),bx0=bx0,by0=by0,bw=bx1-bx0,bh=by1-by0))
    BASE=int(np.median(bottoms));print('tiger Fußlinie',BASE,'| Frames',len(frames))
    AW=4096;x=y=rowh=0
    for f in sorted(frames,key=lambda f:-f['bh']):
        if x+f['bw']>AW:x=0;y+=rowh+2;rowh=0
        f['px']=x;f['py']=y;x+=f['bw']+2;rowh=max(rowh,f['bh'])
    AH=y+rowh+2;atlas=Image.new('RGBA',(AW,AH),(0,0,0,0));meta={}
    for f in frames:
        atlas.paste(f['img'],(f['px'],f['py']))
        meta[f['name']]=dict(x=f['px'],y=f['py'],w=f['bw'],h=f['bh'],ox=f['bx0']-f['cw']//2,oy=f['by0']-BASE)
        if f['name'] in TIGER_AIR:meta[f['name']+'a']=dict(x=f['px'],y=f['py'],w=f['bw'],h=f['bh'],ox=-f['bw']//2,oy=-(TIGER_AIR_CENTER+f['bh']//2))
    stand_h=-meta['idle_00']['oy'];out=os.path.join(root,'atlas.webp');atlas.save(out,'WEBP',quality=88,alpha_quality=100,method=6)
    data=json.dumps(dict(frames=meta,standH=stand_h,atlas=[AW,AH],cell=472))
    open(os.path.join(root,'meta.json'),'w').write(data)
    open(os.path.join(root,'meta.js'),'w').write(f"(window.__SPRITES__=window.__SPRITES__||{{}}).tiger={{meta:{data}}};")
    print('tiger Atlas',AW,'x',AH,'| WebP',round(os.path.getsize(out)/1024),'KB | Standhöhe',stand_h)
build_tiger()
