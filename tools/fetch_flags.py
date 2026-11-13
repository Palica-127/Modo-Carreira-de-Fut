"""Baixa bandeiras (flagcdn.com, domínio público) e salva em assets/flags/<iso>.webp. Uso: python tools/fetch_flags.py"""
import io,json,os,urllib.request
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'assets','flags');os.makedirs(OUT,exist_ok=True)
M=json.load(open(os.path.join(ROOT,'tools','flags.json'),encoding='utf-8'))
for n,(code,iso) in M.items():
    f=os.path.join(OUT,iso+'.webp')
    if os.path.exists(f):continue
    try:
        b=urllib.request.urlopen(urllib.request.Request('https://flagcdn.com/w80/%s.png'%iso,headers={'User-Agent':'Mozilla/5.0'}),timeout=30).read()
        im=Image.open(io.BytesIO(b)).convert('RGBA');im.thumbnail((64,48),Image.LANCZOS);im.save(f,'WEBP',quality=85,method=6);print('ok',n,iso,im.size)
    except Exception as e:print('falhou',n,iso,e)
