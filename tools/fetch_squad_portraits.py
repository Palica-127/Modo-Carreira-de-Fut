"""Retratos (sem fundo) de todos os jogadores dos elencos que casam com a base do EA FC.
Uso: python -I tools/fetch_squad_portraits.py -> assets/players/<slug>.webp (96px RGBA) + tools/portraits.json (slugs)"""
import io,json,os,re,subprocess,sys,time,unicodedata,urllib.request
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0,os.path.join(ROOT,'tools'))
import fc_match as M
out=os.path.join(ROOT,'assets','players');os.makedirs(out,exist_ok=True)
def slug(s):
    s=unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower();return re.sub(r'[^a-z0-9]+','-',s).strip('-')
sq=json.loads(subprocess.check_output(['node','-e',"const fs=require('fs');const s=fs.readFileSync('src/squads.js','utf8');console.log(JSON.stringify(new Function(s+';return SQ;')()))"],cwd=ROOT))
todo={}
for club,s in sq.items():
    for z in s.split(';'):
        q=z.split('|')
        if len(q)<3:continue
        r=M.find(q[0],int(q[2] or 25))
        if not r:continue
        k=slug(q[0])
        if k and (k not in todo or r[2]>todo[k][1]):todo[k]=(r[0],r[2])
print('casados:',len(todo),flush=True)
U='https://ratings-images-prod.pulse.ea.com/FC25/full/player-portraits/p%d.png'
def work(kv):
    k,(pid,_)=kv;f=os.path.join(out,k+'.webp')
    if os.path.exists(f):return k
    for i in range(3):
        try:
            b=urllib.request.urlopen(urllib.request.Request(U%pid,headers={'User-Agent':'Mozilla/5.0'}),timeout=30).read()
            im=Image.open(io.BytesIO(b)).convert('RGBA');bb=im.getchannel('A').point(lambda v:255 if v>8 else 0).getbbox()
            if not bb:return None
            im=im.crop(bb);w,h=im.size;s=max(w,h);c=Image.new('RGBA',(s,s),(0,0,0,0));c.paste(im,((s-w)//2,0));c.thumbnail((96,96),Image.LANCZOS)
            c.save(f,'WEBP',quality=78,method=6);return k
        except Exception:time.sleep(2*(i+1))
    return None
ok=[]
with ThreadPoolExecutor(10) as ex:
    for i,r in enumerate(ex.map(work,todo.items())):
        if r:ok.append(r)
        if i%500==0:print(i,len(ok),flush=True)
json.dump(sorted(set(ok)|{f[:-5] for f in os.listdir(out)}),open(os.path.join(ROOT,'tools','portraits.json'),'w'))
print('fim',len(ok),flush=True)
