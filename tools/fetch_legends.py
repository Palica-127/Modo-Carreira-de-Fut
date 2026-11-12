"""Fotos das lendas via Wikipedia (REST summary -> thumbnail). Uso: python -I tools/fetch_legends.py -> assets/legends/<slug>.webp"""
import io,json,os,re,time,unicodedata,urllib.parse,urllib.request,subprocess
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out=os.path.join(ROOT,'assets','legends');os.makedirs(out,exist_ok=True)
names=json.loads(subprocess.check_output(['node','-e',"const fs=require('fs');const s=fs.readFileSync('src/data.js','utf8');console.log(JSON.stringify(new Function(s+';return LEG;')().map(x=>x.n)))"],cwd=ROOT))
WT={'Zico':'Zico_(footballer)','Xavi':'Xavi_(footballer,_born_1980)','Andrés Iniesta':'Andr%C3%A9s_Iniesta','Pelé':'Pelé','Ronaldo Nazário':'Ronaldo (Brazilian footballer)','Kaká':'Kaká','Romário':'Romário','Eusébio':'Eusébio','Garrincha':'Garrincha','Ronaldinho':'Ronaldinho','Gerd Müller':'Gerd Müller','Lev Yashin':'Lev Yashin','Bobby Charlton':'Bobby Charlton'}
def slug(s):
    s=unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower();return re.sub(r'[^a-z0-9]+','-',s).strip('-')
def get(u):
    for i in range(4):
        try:return urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'HabiteSe10/1.0 (educational football game)'}),timeout=30).read()
        except Exception as e:time.sleep(4*(i+1))
for n in names:
    f=os.path.join(out,slug(n)+'.webp')
    if os.path.exists(f):continue
    t=WT.get(n,n)
    j=get('https://en.wikipedia.org/api/rest_v1/page/summary/'+(t if '%' in t else urllib.parse.quote(t.replace(' ','_'))));time.sleep(1)
    if not j:print('sem resumo',n);continue
    u=(json.loads(j).get('thumbnail') or {}).get('source')
    if not u:print('sem foto',n);continue
    b=get(u)
    if not b:print('falhou',n);continue
    im=Image.open(io.BytesIO(b)).convert('RGB')
    w,h=im.size;s=min(w,int(h*.8));im=im.crop(((w-s)//2,0,(w-s)//2+s,s))   # quadrado a partir do topo (rosto)
    im.thumbnail((140,140),Image.LANCZOS);im.save(f,'WEBP',quality=80);print('ok',n,flush=True);time.sleep(1)
