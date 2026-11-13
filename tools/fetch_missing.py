"""Completa os 9 escudos que faltavam e a foto do Nuno Mendes via Wikipedia (REST summary -> thumbnail).
Uso: python tools/fetch_missing.py"""
import io,json,os,time,urllib.parse,urllib.request
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def get(u):
    for i in range(3):
        try:return urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'HabiteSe10/1.0 (educational football game)'}),timeout=30).read()
        except Exception:time.sleep(3)
def thumb(t):
    j=get('https://en.wikipedia.org/api/rest_v1/page/summary/'+urllib.parse.quote(t.replace(' ','_')))
    return j and (json.loads(j).get('thumbnail') or {}).get('source')
CR={'academica':'Académica de Coimbra','botafogo-pb':'Botafogo Futebol Clube (PB)','barakaldo':'Barakaldo CF','unionistas':'Unionistas de Salamanca CF','sestao-river':'Sestao River Club','rot-weiss-essen':'Rot-Weiss Essen','rot-wei-erfurt':'FC Rot-Weiß Erfurt','alemannia-aachen':'Alemannia Aachen','rot-wei-oberhausen':'Rot-Weiß Oberhausen'}
rp=os.path.join(ROOT,'tools','crests_report.json');rep=json.load(open(rp))
for sl,t in CR.items():
    u=thumb(t);b=u and get(u)
    if not b:print('falhou',sl);continue
    im=Image.open(io.BytesIO(b)).convert('RGBA');im.thumbnail((72,72),Image.LANCZOS)
    im.save(os.path.join(ROOT,'assets','crests',sl+'.webp'),'WEBP',quality=82,method=6)
    rep[sl]={'n':rep[sl]['n'],'ok':True,'team':t,'score':1.0};print('ok',sl);time.sleep(1)
json.dump(rep,open(rp,'w'),indent=0)
u=thumb('Nuno Mendes (footballer, born 2002)');b=get(u)
im=Image.open(io.BytesIO(b)).convert('RGB');w,h=im.size;s=min(w,int(h*.8));im=im.crop(((w-s)//2,0,(w-s)//2+s,s));im.thumbnail((140,140),Image.LANCZOS)
im.save(os.path.join(ROOT,'assets','legends','nuno-mendes.webp'),'WEBP',quality=80);print('ok nuno')
