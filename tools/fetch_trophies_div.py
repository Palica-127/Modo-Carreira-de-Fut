"""Troféus das divisões inferiores (TheSportsDB, chave 123) -> assets/trophies/<chave>.webp. Descobre o nome pelo id e só baixa o que tem imagem.
Uso: python -I tools/fetch_trophies_div.py"""
import io,json,os,time,urllib.request
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'assets','trophies')
# chave do jogo (lig-<pais>-<divisao>) -> id da liga; os ids marcados ? foram chutados e conferidos pelo nome
IDS={'lig-ENG-1':4329,'lig-ENG-2':4396,'lig-ENG-3':4397,'lig-ITA-1':4394,'lig-GER-1':4399,'lig-FRA-1':4401,'lig-ARG-1':4616,
 'lig-ESP-1':4400,'lig-NED-1':4398,'lig-POR-1':4636,'lig-BRA-1':4404,'lig-BRA-2':4625,'lig-ITA-2':4395,'lig-GER-2':4400,'lig-TUR-1':4676}
def get(u,raw=False):
    for i in range(6):
        try:
            b=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'}),timeout=40).read()
            if raw:return b
            if b[:1]==b'{':return json.loads(b)
        except Exception:pass
        time.sleep(15+10*i)
for k,i in IDS.items():
    f=os.path.join(OUT,k+'.webp')
    if os.path.exists(f):continue
    j=get('https://www.thesportsdb.com/api/v1/json/123/lookupleague.php?id=%d'%i);time.sleep(4)
    l=((j or {}).get('leagues') or [{}])[0]
    print(k,i,l.get('strLeague'),l.get('strCountry'),'TROFEU' if l.get('strTrophy') else '-',flush=True)
    u=l.get('strTrophy')
    if not u:continue
    b=get(u,True)
    if not b:print('falhou',k);continue
    im=Image.open(io.BytesIO(b)).convert('RGBA');bb=im.getbbox()
    if bb:im=im.crop(bb)
    im.thumbnail((140,140),Image.LANCZOS);im.save(os.path.join(ROOT,'_tmp_'+k+'.webp'),'WEBP',quality=88,method=6);time.sleep(3)
print('fim')
