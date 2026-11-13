"""Fotos de todos os vencedores da Bola de Ouro (e do top 10 de 2025) via Wikipedia (REST summary -> thumbnail).
Uso: python tools/fetch_bdo.py -> assets/legends/<slug>.webp (retoma; pula os que já existem)"""
import io,json,os,re,time,unicodedata,urllib.parse,urllib.request
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out=os.path.join(ROOT,'assets','legends');os.makedirs(out,exist_ok=True)
hist=open(os.path.join(ROOT,'src','hist.js'),encoding='utf-8').read()
a=hist.index('const BDO_REAL=rowsOf(`')+len('const BDO_REAL=rowsOf(`');b=hist.index('`)',a)
names=[]
for l in hist[a:b].strip().split('\n'):
    n=l.strip().split('|')[1]
    if n and n!='—' and n not in names:names.append(n)
for n in re.findall(r"\['([^']+)','[A-Z]{3}','",hist[hist.index('const BDO_TOP'):]):
    if n not in names:names.append(n)
WT={'Luis Suárez':'Luis_Suárez_Miramontes','Rodri':'Rodri_(footballer,_born_1996)','Vitinha':'Vitinha_(footballer,_born_2000)','Nuno Mendes':'Nuno_Mendes_(footballer)',
 'Ronaldo Nazário':'Ronaldo_(Brazilian_footballer)','Zico':'Zico_(footballer)','Xavi':'Xavi_(footballer,_born_1980)','Andrés Iniesta':'Andr%C3%A9s_Iniesta','Ousmane Dembélé':'Ousmane_Dembélé',
 'Rivaldo':'Rivaldo','Michael Owen':'Michael_Owen','Cole Palmer':'Cole_Palmer','Fabio Cannavaro':'Fabio_Cannavaro'}
def slug(s):
    s=unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower();return re.sub(r'[^a-z0-9]+','-',s).strip('-')
def get(u):
    for i in range(4):
        try:return urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'HabiteSe10/1.0 (educational football game)'}),timeout=30).read()
        except Exception as e:time.sleep(4*(i+1))
miss=[]
for n in names:
    f=os.path.join(out,slug(n)+'.webp')
    if os.path.exists(f):continue
    t=WT.get(n,n)
    j=get('https://en.wikipedia.org/api/rest_v1/page/summary/'+(t if '%' in t else urllib.parse.quote(t.replace(' ','_'))));time.sleep(1)
    if not j:print('sem resumo',n);miss.append(n);continue
    u=(json.loads(j).get('thumbnail') or {}).get('source')
    if not u:print('sem foto',n);miss.append(n);continue
    b=get(u)
    if not b:print('falhou',n);miss.append(n);continue
    im=Image.open(io.BytesIO(b)).convert('RGB')
    w,h=im.size;s=min(w,int(h*.8));im=im.crop(((w-s)//2,0,(w-s)//2+s,s))
    im.thumbnail((140,140),Image.LANCZOS);im.save(f,'WEBP',quality=80);print('ok',n,flush=True);time.sleep(1)
print('faltando:',miss)
