"""Forca inicial dos clubes brasileiros (Serie A/B) a partir de 2021-2025: posicao na liga, Libertadores/Copa do Brasil/Mundial e confronto direto.
Uso: python tools/brasil_forca.py -> grava tools/br_forca.json e o bloco BRF em src/data.js (indice 0..1 dentro de cada divisao)."""
import json,os,re,sys,unicodedata
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from wikitab import tables
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
YEARS=[2021,2022,2023,2024,2025];WY={2021:.6,2022:.8,2023:1,2024:1.3,2025:1.6}
def nk(s):
    s=re.sub(r'\s*\((?:C|R|A|O|T|CL|P|X)[^)]*\)|\[.*?\]','',s);s=unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower()
    s=re.sub(r'\bred bull\b','',s);return re.sub(r'[^a-z0-9]+','',s)
ALIAS={'sport':'sportrecife','operarioferroviario':'operariopr','operario':'operariopr','americamineiro':'americamg','athletic':'athletic','athleticclub':'athletic','vasco':'vascodagama','atleticomg':'atleticomineiro','gremio':'gremio','athleticoparanaense':'athleticoparanaense','atleticopr':'athleticoparanaense','botafogosp':'botafogosp','botafogopb':'botafogopb','novorizontino':'novorizontino','gremionovorizontino':'novorizontino'}
def key(s):
    k=nk(s);return ALIAS.get(k,k)
src=open(os.path.join(ROOT,'src','data.js'),encoding='utf-8').read()
i=src.index("{k:'BRA'");j=src.index("]},",i)
divs=[[x.strip() for x in l.strip().strip("',").split(', ')] for l in src[i:j].split('\n')[1:4]]
game={key(n):n for d in divs for n in d}
def table(y,serie):
    for t in tables('Campeonato Brasileiro de Futebol de %d - Série %s'%(y,serie)):
        if len(t)>=21 and len(t[1])>=8 and t[1][0].isdigit() and t[1][2].isdigit():return t
def matrix(y):
    for t in tables('Campeonato Brasileiro de Futebol de %d - Série A'%y):
        if len(t)==21 and len(t[1])==21 and '–' in ''.join(t[1]):return t
pos={};games={}
for y in YEARS:
    for s in 'AB':
        t=table(y,s)
        if not t:print('sem tabela',y,s);continue
        for r in t[1:21]:
            k=key(r[1]);pos.setdefault(y,{})[k]=(s,int(r[0]))
            if k not in game:print('? sem correspondencia',y,s,r[1],k)
    m=matrix(y)
    if m:
        order=[key(r[0]) for r in m[1:]]
        for a,r in enumerate(m[1:]):
            for b,c in enumerate(r[1:]):
                mm=re.match(r'(\d+)[–-](\d+)',c)
                if mm:games.setdefault(order[a],[]).append((order[b],int(mm.group(1)),int(mm.group(2))));games.setdefault(order[b],[]).append((order[a],int(mm.group(2)),int(mm.group(1))))
    else:print('sem matriz',y)
def lg(y,k):
    p=pos.get(y,{}).get(k)
    if not p:return .01
    s,r=p
    return 1-.9*(r-1)/19 if s=='A' else max(.02,.1-.004*(r-1))
L={k:sum(WY[y]*lg(y,k) for y in YEARS)/sum(WY.values()) for k in game}
# Libertadores / Copa do Brasil / Mundial (2021-2025): campeao, vice, semifinal...
LIB={2021:{'palmeiras':1,'flamengo':.75,'atleticomineiro':.55},2022:{'flamengo':1,'athleticoparanaense':.75,'palmeiras':.55},2023:{'fluminense':1,'internacional':.55,'palmeiras':.55},2024:{'botafogo':1,'atleticomineiro':.75},2025:{'flamengo':1,'palmeiras':.75}}
CDB={2021:{'atleticomineiro':1,'athleticoparanaense':.7},2022:{'flamengo':1,'corinthians':.7},2023:{'saopaulo':1,'flamengo':.7},2024:{'flamengo':1,'atleticomineiro':.7},2025:{'corinthians':1,'vascodagama':.7}}
MUN={2021:{'palmeiras':.8},2022:{'flamengo':.6},2023:{'fluminense':.8},2025:{'fluminense':.55,'palmeiras':.45,'flamengo':.35,'botafogo':.35}}
C={}
for y in YEARS:
    for tb,wt in ((LIB,1),(CDB,.7),(MUN,.8)):
        for k,v in tb.get(y,{}).items():C[k]=C.get(k,0)+WY[y]*v*wt
for k in C:
    if k not in game:print('? continental sem correspondencia',k)
cm=max(C.values()) or 1;C={k:min(1,C.get(k,0)/cm) for k in game}
# confronto direto: pontos por jogo contra os demais clubes do jogo, ponderado pelo ano
H={}
for k in game:
    pts=n=0
    for (o,gf,ga) in games.get(k,[]):
        if o in game and o!=k:pts+=3 if gf>ga else 1 if gf==ga else 0;n+=1
    H[k]=pts/(3*n) if n>=8 else None
hv=[v for v in H.values() if v is not None];hm=sum(hv)/len(hv)
H={k:(v if v is not None else hm*.85) for k,v in H.items()}
S={k:.5*L[k]+.3*C[k]+.2*H[k] for k in game}
out={}
for d in divs:
    vals=[(S[key(n)],-ix,n) for ix,n in enumerate(d)]
    hi,lo=max(v[0] for v in vals),min(v[0] for v in vals)
    rk=sorted(vals);N=len(rk)-1
    for idx,(v,_,nm) in enumerate(rk):out[nm]=round(.6*idx/N+.4*(v-lo)/max(1e-9,hi-lo),3)  # mistura posição relativa e distância de força
json.dump({'liga':L,'cont':C,'h2h':H,'forca':out},open(os.path.join(ROOT,'tools','br_forca.json'),'w',encoding='utf-8'),ensure_ascii=False,indent=0)
print({n:out[n] for n in divs[0]});print({n:out[n] for n in divs[1]})
blk='const BRF='+json.dumps(out,ensure_ascii=False,separators=(',',':'))+';'
if 'const BRF=' in src:src=re.sub(r'const BRF=\{.*?\};',lambda m:blk,src,count=1,flags=re.S)
else:
    a=src.index('const LEAGUES=[');b=src.index('];',a)+2;src=src[:b]+'\n/* força inicial dos clubes brasileiros (tools/brasil_forca.py: liga, copas e confronto direto 2021-2025), 0..1 por divisão */\n'+blk+src[b:]
open(os.path.join(ROOT,'src','data.js'),'w',encoding='utf-8',newline='').write(src)
