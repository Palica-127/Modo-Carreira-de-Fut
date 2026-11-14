"""Retratos recortados (sem fundo) dos jogadores reais, da base do EA FC (ratings-images-prod.pulse.ea.com).
Uso: python -I tools/fetch_portraits.py -> assets/players/<slug>.webp (RGBA). Nomes: lendas + Bola de Ouro (como build.py)."""
import io,json,os,re,sys,time,unicodedata,urllib.request
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0,os.path.join(ROOT,'tools'))
import fc_match as M
out=os.path.join(ROOT,'assets','players');os.makedirs(out,exist_ok=True)
rd=lambda f:open(os.path.join(ROOT,'src',f),encoding='utf-8').read()
data,hist=rd('data.js'),rd('hist.js')
def slug(s):
    s=unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower();return re.sub(r'[^a-z0-9]+','-',s).strip('-')
i=data.index('const LEG=[')
names=re.findall(r"\{n:'([^']+)'",data[i:data.index('];',i)])
a=hist.index('const BDO_REAL=rowsOf(`')+len('const BDO_REAL=rowsOf(`');b=hist.index('`)',a)
names+=[l.strip().split('|')[1] for l in hist[a:b].strip().splitlines()]
names+=re.findall(r"\['([^']+)','[A-Z]{3}','",hist[hist.index('const BDO_TOP'):])
names=list(dict.fromkeys(names))
U='https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p%d.png'
def get(u):
    for k in range(3):
        try:return urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'}),timeout=30).read()
        except Exception:time.sleep(2*(k+1))
miss=[]
for n in names:
    f=os.path.join(out,slug(n)+'.webp')
    if os.path.exists(f):continue
    t=M.nz(n);c=M.BYN.get(' '.join(t),[])
    if not c:miss.append(n);continue
    p=max(c,key=lambda p:p[2]);bt=get(U%p[0])
    if not bt:miss.append(n);continue
    im=Image.open(io.BytesIO(bt)).convert('RGBA');bb=im.getchannel('A').point(lambda v:255 if v>8 else 0).getbbox()
    if not bb:miss.append(n);continue
    im=im.crop(bb);w,h=im.size;s=max(w,h)  # quadrado, ancorado no topo, centrado
    sq=Image.new('RGBA',(s,s),(0,0,0,0));sq.paste(im,((s-w)//2,0));sq.thumbnail((160,160),Image.LANCZOS)
    sq.save(f,'WEBP',quality=82,method=6);print('ok',n,p[1],p[2],flush=True);time.sleep(.2)
print('sem retrato EA:',len(miss),miss)
