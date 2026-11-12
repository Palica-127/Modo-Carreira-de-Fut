"""Baixa as imagens (PNG com fundo transparente) das taças da TheSportsDB (chave 123).
Uso: python -I tools/fetch_trophies.py  -> assets/trophies/<chave>.webp (retoma)"""
import io,json,os,time,urllib.request
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'assets','trophies');os.makedirs(OUT,exist_ok=True)
# chave usada no jogo -> id da liga na TheSportsDB
IDS={'wc':4429,'ucl':4480,'lib':4501,'lig-BRA':4351,'lig-ENG':4328,'lig-ESP':4335,'lig-ITA':4332,'lig-GER':4331,'lig-FRA':4334,'lig-POR':4344,'lig-NED':4337,'lig-ARG':4406,'lig-TUR':4339,
 'dom-ENG':4482,'dom-ESP':4483,'dom-FRA':4484,'dom-GER':4485}
def get(u,raw=False):
    for i in range(6):
        try:
            b=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'}),timeout=40).read()
            if raw:return b
            if b[:1]==b'{':return json.loads(b)
        except Exception:pass
        time.sleep(20+10*i)
    return None
for k,i in IDS.items():
    f=os.path.join(OUT,k+'.webp')
    if os.path.exists(f):continue
    j=get('https://www.thesportsdb.com/api/v1/json/123/lookupleague.php?id=%d'%i);time.sleep(3)
    u=j and (j['leagues'][0].get('strTrophy') or '')
    if not u:print('sem imagem',k);continue
    b=get(u,True)
    if not b:print('falhou',k);continue
    im=Image.open(io.BytesIO(b)).convert('RGBA');bb=im.getbbox()
    if bb:im=im.crop(bb)
    im.thumbnail((140,140),Image.LANCZOS);im.save(f,'WEBP',quality=88,method=6);print('ok',k,im.size,flush=True);time.sleep(2)
