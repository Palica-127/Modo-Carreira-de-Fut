"""Baixa escudos faltantes via ESPN (tools/logos.json) para assets/crests e atualiza crests_report.json.
Uso: python -I tools/fetch_crests_espn.py"""
import io,json,os,re,time,unicodedata,urllib.request
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def slug(s):
    s=unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+','-',s).strip('-')
world=json.load(open(os.path.join(ROOT,'tools','world.json'),encoding='utf-8'))
logos=json.load(open(os.path.join(ROOT,'tools','logos.json'),encoding='utf-8'))
rp=os.path.join(ROOT,'tools','crests_report.json');rep=json.load(open(rp,encoding='utf-8')) if os.path.exists(rp) else {}
out=os.path.join(ROOT,'assets','crests');os.makedirs(out,exist_ok=True)
names=[n for L in world for dv in L['cl'] for n in dv]
miss=[n for n in names if not (rep.get(slug(n),{}).get('ok') and os.path.exists(os.path.join(out,slug(n)+'.webp')))]
print('faltando',len(miss),'de',len(names))
sem=[]
for n in miss:
    if n not in logos or not logos[n][1]:sem.append(n);continue
    u='https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/%s.png&w=96&h=96'%logos[n][0]
    try:
        b=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'}),timeout=30).read()
        im=Image.open(io.BytesIO(b)).convert('RGBA');im.thumbnail((72,72),Image.LANCZOS)
        im.save(os.path.join(out,slug(n)+'.webp'),'WEBP',quality=82,method=6)
        rep[slug(n)]={'n':n,'ok':True,'team':'espn:'+logos[n][0],'score':1}
        print('ok',n,flush=True)
    except Exception as e:
        sem.append(n);print('ERRO',n,e)
    time.sleep(.25)
json.dump(rep,open(rp,'w',encoding='utf-8'),indent=0)
print('sem escudo:',len(sem),sem)
