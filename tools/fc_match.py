"""Casa jogadores da ESPN com a base do EA FC (tools/fc.json): devolve {chave: (ovr,pos,ano_nasc)}"""
import json,os,re,unicodedata,collections
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FC=json.load(open(os.path.join(ROOT,'tools','fc.json'),encoding='utf-8'))['p']
def nz(s):
    s=unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower()
    return re.sub(r'[^a-z0-9 ]',' ',s).split()
BYN=collections.defaultdict(list);BYL=collections.defaultdict(list)
for p in FC:
    t=nz(p[1])
    if not t:continue
    BYN[' '.join(t)].append(p);BYL[t[-1]].append(p)
CODE={'GK':'GK','CB':'CB','LB':'LB','RB':'RB','LWB':'LB','RWB':'RB','CDM':'CDM','CM':'CM','CAM':'CAM','LM':'LW','RM':'RW','LW':'LW','RW':'RW','CF':'ST','ST':'ST'}
def find(name,age,year=2026):
    """name ESPN, age -> registro EA ou None"""
    t=nz(name)
    if not t:return None
    ys={year-age,year-age-1}
    c=[p for p in BYN.get(' '.join(t),[]) if p[4] in ys or abs(p[4]-(year-age))<=2]
    if len(c)>=1:return max(c,key=lambda p:p[2])
    # sobrenome + ano + primeiro nome compativel
    c=[p for p in BYL.get(t[-1],[]) if p[4] in ys]
    f=t[0]
    c2=[p for p in c if nz(p[1])[0][:3]==f[:3] or f in nz(p[1]) or nz(p[1])[0] in t]
    if len(c2)>=1:return max(c2,key=lambda p:p[2])
    # nome unico no EA (ex.: apelidos) com mesmo ano
    c=[p for p in BYL.get(t[-1],[]) if p[4] in ys]
    if len(c)==1 and len(nz(c[0][1]))==1:return c[0]
    # algum token do ESPN igual ao nome unico do EA (Vinicius Junior -> Vini Jr: falha) 
    for tok in t:
        c=[p for p in BYN.get(tok,[]) if p[4] in ys]
        if len(c)==1:return c[0]
    return None
if __name__=='__main__':
    D=json.load(open(os.path.join(ROOT,'tools','espn.json'),encoding='utf-8'))
    tot=collections.Counter();hit=collections.Counter()
    for k,v in D.items():
        for t in v['teams']:
            for p in (t['players'] or []):
                tot[k]+=1
                if find(p[0],p[2] or 25):hit[k]+=1
    for k in tot:print(k,hit[k],'/',tot[k],round(hit[k]/tot[k]*100))
    print(sum(hit.values()),sum(tot.values()))
