"""Baixa a base oficial de notas do EA FC (drop-api.ea.com) -> tools/fc.json
Cada jogador: [id, nome, ovr, pos, nascimento(ano), pais, time, liga, pac, sho, pas, dri, def, phy, gk]"""
import json,os,time,urllib.request
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'tools','fc.json')
U='https://drop-api.ea.com/rating/ea-sports-fc?locale=en&limit=100&offset=%d'
def get(o):
    for i in range(5):
        try:return json.loads(urllib.request.urlopen(urllib.request.Request(U%o,headers={'User-Agent':'Mozilla/5.0'}),timeout=40).read())
        except Exception:time.sleep(3*(i+1))
D=json.load(open(OUT,encoding='utf-8')) if os.path.exists(OUT) else {'n':0,'p':[]}
o=D['n']
while True:
    j=get(o)
    if not j or not j['items']:break
    for x in j['items']:
        s={k:v['value'] for k,v in x['stats'].items()}
        nm=x.get('commonName') or ((x.get('firstName') or '')+' '+(x.get('lastName') or '')).strip()
        D['p'].append([x['id'],nm,x['overallRating'],x['position']['shortLabel'],(int(x['birthdate'].split('/')[2].split(' ')[0]) if x.get('birthdate') else 2000),(x.get('nationality') or {}).get('label',''),(x.get('team') or {}).get('label',''),x.get('leagueName') or '',s.get('pac'),s.get('sho'),s.get('pas'),s.get('dri'),s.get('def'),s.get('phy'),s.get('gkDiving')])
    o+=100;D['n']=o
    json.dump(D,open(OUT,'w',encoding='utf-8'),ensure_ascii=False)
    if o>=j['totalItems']:break
    time.sleep(.3)
print(len(D['p']))
