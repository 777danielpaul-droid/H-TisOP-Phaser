# Misst je Kitsune-Frame die Kopfgröße relativ zum Idle (p_8_0) per Template-Matching -> Grundlage für KITSUNE_FRAME_SC in src/render/sprites.js
# Aufruf: python3 tools/measure-kitsune-scale.py   (benötigt opencv-python, numpy, pillow; schreibt assets/kitsune/_framescale.json; Wert scale = Kopf-Faktor, Korrektur = 1/scale)
import os,sys
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
import json,numpy as np,cv2
from PIL import Image
M=json.load(open('assets/kitsune/meta.json'))['frames']
atlas=Image.open('assets/kitsune/atlas.webp').convert('RGBA')
def cell(n):
    f=M[n];c=atlas.crop((f['x'],f['y'],f['x']+f['w'],f['y']+f['h']))
    bg=Image.new('RGBA',c.size,(128,128,128,255));bg.alpha_composite(c)
    return cv2.cvtColor(np.array(bg.convert('RGB')),cv2.COLOR_RGB2GRAY)
ref=cell('p_8_0');T0=ref[0:80,172:252]
res={}
def rot(img,deg,s):
    h,w=img.shape;m=cv2.getRotationMatrix2D((w/2,h/2),deg,s)
    cos,sin=abs(m[0,0]),abs(m[0,1]);nw,nh=int(h*sin+w*cos),int(h*cos+w*sin)
    m[0,2]+=nw/2-w/2;m[1,2]+=nh/2-h/2
    return cv2.warpAffine(img,m,(nw,nh),borderValue=128)
for n in M:
    if n.endswith('a'):continue
    I=cell(n);best=(-1,0,0)
    for s in np.arange(.55,1.5,.05):
        for d in range(-40,41,10):
            T=rot(T0,d,s)
            if T.shape[0]>=I.shape[0] or T.shape[1]>=I.shape[1]:continue
            r=cv2.matchTemplate(I,T,cv2.TM_CCOEFF_NORMED);sc=r.max()
            if sc>best[0]:best=(sc,s,d)
    res[n]=best
for n,(sc,s,d) in sorted(res.items(),key=lambda t:(int(t[0].split('_')[1]),t[0])):print(n.ljust(8),'score %.2f scale %.2f rot %d'%(sc,s,d))
json.dump({n:[float(a),float(b),int(c)] for n,(a,b,c) in res.items()},open('assets/kitsune/_framescale.json','w'))
