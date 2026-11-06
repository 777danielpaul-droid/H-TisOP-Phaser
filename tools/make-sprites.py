#!/usr/bin/env python3
"""Schneidet Sprite-Sheets (assets/<id>/source/*.png, Zellen 400x400) in getrimmte Frames und packt sie je Figur in
assets/<id>/atlas.webp + meta.json + meta.js. Nur nötig, wenn sich die Quell-Sheets ändern (braucht Pillow + numpy).
Aufruf: python3 tools/make-sprites.py [hero|palm|witch|mino|tiger]
Tiger: Einzelframes (assets/tiger/source/*.png, 472x360, Pivot = Zellmitte/Fußlinie) -> Atlas; Frames liegen schon an der Fußlinie, daher überall Anker 'cell'."""
import json,os,sys
from PIL import Image
import numpy as np
ASSETS=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','assets')
CELL=400   # Standard-Zellgröße (hero/palm); Sheets anderer Größe geben (cw,ch) als 4. Tupelwert an
AIR_CENTER=105   # Quellpixel: Körpermitte über der Fußlinie für fliegende Frames (Anker 'air')
def hero_mode(pre,r,c):return 'cell'
def palm_mode(pre,r,c):
    if pre!='knock':return 'cell'
    if r==0:return 'cell' if c<2 else 'air'                 # Flinch an der Zellmitte, fliegende Frames um die Körpermitte
    if r==2 and c>=8:return 'cell'                           # Aufstehen endet im Idle-Anker
    return 'ground'                                          # liegend/aufstehend: horizontal zentriert, Unterkante auf der Fußlinie
# id: (Sheets [(Präfix, Datei, Frames pro Zeile)], Anker-Funktion, benötigte Frames (None = alle), Namensschema)
HERO=dict(sheets=[('idle','idle_3.png',[10,10,1]),('punch','punch_1.png',[10]),('hurt','hurt_1.png',[8]),('cmb','combo_4.png',[10,10,8])],mode=hero_mode,keep=None)
PALM=dict(sheets=[('idle','idle.png',[10,10]),('walk','walk.png',[10,1]),('o5','other_5.png',[10,10]),('o8','other_8.png',[10,5]),
                  ('o9','other_9.png',[10,3]),('o10','other_10.png',[10,2]),('knock','knockup_2.png',[10,10,10]),('talk','talk_1.png',[10,10,6])],mode=palm_mode,
          # Nur genutzte Frames in den Atlas (Dateigröße): (Präfix, Indizes)
          keep={'idle':set(range(20)),'walk':set(range(11)),'o5':set(range(1,10)),'o8':set(range(2,10)),'o10':set(range(1,9)),'o9':set(),
                'knock':{0,1,3,5,7,9}|set(range(12,18))|set(range(20,30)),'talk':set(range(0,26,2))})
def mino_mode(pre,r,c):
    if pre=='roll':
        if r==0 and 2<=c<=7:return 'air'      # Rollen/Tumble: Körpermitte auf fester Höhe
        if r==0 and c>=8:return 'ground'      # am Boden sitzend/liegend
    return 'cell'
def witch_mode(pre,r,c):return 'cell'
WITCH=dict(sheets=[('idle','idle.png',[10,6],(300,300)),('jump','jump.png',[10,10],(300,300)),('attack','attack.png',[10,10,10],(400,300))],mode=witch_mode,keep=None,persheet=True,stand='idle_0',split={'attack':200})
MINO=dict(sheets=[('other','other.png',[10],(400,300)),('walk','walk.png',[10,4],(300,300)),('roll','roll.png',[10,7],(400,300))],mode=mino_mode,keep=None,persheet=True,stand='other_0')
CHARS={'hero':HERO,'palm':PALM,'witch':WITCH,'mino':MINO}
def name_of(cid,pre,r,c,idx):
    if cid=='hero' and pre=='cmb':return f'cmb{r+1}_{c}'
    return f'{pre}_{r*10+c}'
def build(cid):
    cfg=CHARS[cid];root=os.path.join(ASSETS,cid);frames=[];base_bottom=[];sheet_base={}
    for sh in cfg['sheets']:
        pre,fn,rows=sh[:3];cw,ch=sh[3] if len(sh)>3 else (CELL,CELL)
        im=Image.open(os.path.join(root,'source',fn)).convert('RGBA');first=True
        for r,n in enumerate(rows):
            for c in range(n):
                flat=r*10+c
                if cfg['keep'] is not None and flat not in cfg['keep'].get(pre,set()):continue
                cell=im.crop((c*cw,r*ch,c*cw+cw,r*ch+ch));al=np.array(cell)[:,:,3];ys,xs=np.where(al>8)
                if len(xs)==0:continue
                cut=cfg.get('split',{}).get(pre)
                if cut:                                              # Effekt (rechts von cut) als eigener 'fx_'-Frame abtrennen
                    arr=np.array(cell);fxa=arr.copy();fxa[:,:cut,3]=0;arr[:,cut:,3]=0;cell=Image.fromarray(arr);al=arr[:,:,3];ys,xs=np.where(al>8)
                    fys,fxs=np.where(fxa[:,:,3]>8)
                    if len(fxs)>60:
                        fx0,fx1,fy0,fy1=[int(v) for v in (max(fxs.min()-2,0),min(fxs.max()+3,cw),max(fys.min()-2,0),min(fys.max()+3,ch))]
                        frames.append(dict(name=f'fx_{flat}',pre='fx',r=r,c=c,cw=cw,img=Image.fromarray(fxa).crop((fx0,fy0,fx1,fy1)),bx0=fx0,by0=fy0,bw=fx1-fx0,bh=fy1-fy0,fxof=pre))
                    if len(xs)==0:continue
                bx0,bx1,by0,by1=[int(v) for v in (max(xs.min()-2,0),min(xs.max()+3,cw),max(ys.min()-2,0),min(ys.max()+3,ch))]
                if first and not(pre=='knock'):
                    base_bottom.append(int(ys.max())+1);sheet_base[pre]=int(ys.max())+1;first=False
                frames.append(dict(name=name_of(cid,pre,r,c,flat),pre=pre,r=r,c=c,cw=cw,img=cell.crop((bx0,by0,bx1,by1)),bx0=bx0,by0=by0,bw=bx1-bx0,bh=by1-by0))
    BASE=int(np.median(base_bottom));print(cid,'Fußlinien',base_bottom,'->',BASE,'| Frames',len(frames))
    AW=4096;x=y=rowh=0;meta={}
    for f in sorted(frames,key=lambda f:-f['bh']):
        if x+f['bw']>AW:x=0;y+=rowh+2;rowh=0
        f['px']=x;f['py']=y;x+=f['bw']+2;rowh=max(rowh,f['bh'])
    AH=y+rowh+2;atlas=Image.new('RGBA',(AW,AH),(0,0,0,0))
    for f in frames:
        atlas.paste(f['img'],(f['px'],f['py']));m=cfg['mode'](f['pre'],f['r'],f['c'])
        base=sheet_base.get(f.get('fxof',f['pre']),BASE) if cfg.get('persheet') else BASE
        if m=='cell':ox,oy=f['bx0']-f['cw']//2,f['by0']-base                 # relativ zu (Zellmitte, Fußlinie)
        elif m=='ground':ox,oy=-f['bw']//2,-f['bh']                          # Körper horizontal zentriert, Unterkante = Fußlinie
        else:ox,oy=-f['bw']//2,-(AIR_CENTER+f['bh']//2)                      # 'air': Körpermitte auf fester Höhe
        meta[f['name']]=dict(x=f['px'],y=f['py'],w=f['bw'],h=f['bh'],ox=ox,oy=oy)
    stand_h=-meta[cfg.get('stand','idle_0')]['oy']
    out=os.path.join(root,'atlas.webp');atlas.save(out,'WEBP',quality=90,alpha_quality=100,method=6)
    data=json.dumps(dict(frames=meta,standH=stand_h,atlas=[AW,AH],cell=CELL))
    open(os.path.join(root,'meta.json'),'w').write(data)
    open(os.path.join(root,'meta.js'),'w').write(f"(window.__SPRITES__=window.__SPRITES__||{{}}).{cid}={{meta:{data}}};")
    if os.path.exists(os.path.join(root,'atlas.png')):os.remove(os.path.join(root,'atlas.png'))
    print(cid,'Atlas',AW,'x',AH,'| WebP',round(os.path.getsize(out)/1024),'KB | Standhöhe',stand_h)
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
for cid in (sys.argv[1:] or [*CHARS,'tiger']):build_tiger() if cid=='tiger' else build(cid)
