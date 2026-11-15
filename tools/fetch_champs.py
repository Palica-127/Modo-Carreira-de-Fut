"""Campeões e vices das ligas e copas nacionais (Wikipedia) -> tools/champs_hist.json
{pais:{lig:{ano:[campeao,vice]},dom:{ano:[campeao,vice]}}}; ano = ano em que a temporada termina. Uso: python -I tools/fetch_champs.py"""
import json,os,re,sys
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import wikitab
SRC={'ENG':[('en','List of English football champions'),('en','List of FA Cup finals')],
'ESP':[('en','List of Spanish football champions'),('en','List of Copa del Rey finals')],
'ITA':[('en','List of Italian football champions'),('en','List of Coppa Italia finals')],
'GER':[('en','List of German football champions'),('en','List of DFB-Pokal finals')],
'FRA':[('en','List of French football champions'),('en','List of Coupe de France finals')],
'POR':[('en','List of Portuguese football champions'),('en','List of Taça de Portugal finals')],
'NED':[('en','List of Dutch football champions'),('en','KNVB Cup')],
'ARG':[('en','List of Argentine football champions'),('en','Copa Argentina')],
'TUR':[('en','List of Turkish football champions'),('en','Turkish Cup')],
'BRA':[('pt','Lista de campeões do Campeonato Brasileiro de Futebol'),('en','Copa do Brasil')]}
def clean(s):
    s=re.sub(r'\[[^\]]*\]','',s);s=re.sub(r'\(.*?\)','',s);s=s.replace('\xa0',' ').replace('*','').replace('†','').replace('‡','')
    return re.sub(r'\s+',' ',s).strip()
def season(c):
    m=re.match(r'^\s*\d{1,2}\s+[A-Za-zç]+\s+(\d{4})\b',c)
    if m:return int(m.group(1))
    m=re.match(r'^\s*(\d{4})\s*[–\-/]\s*(\d{2,4})',c)
    if m:
        a,b=int(m.group(1)),m.group(2)
        return a+1 if len(b)==2 and (a+1)%100==int(b) else (int(b) if len(b)==4 else a+1)
    m=re.match(r'^\s*(\d{4})\b',c)
    return int(m.group(1)) if m else None
def parse(tabs,multi=False):
    out={}
    for t in tabs:
        if len(t)<10:continue
        hd=[h.lower() for h in t[0]]
        for r in t[1:]:
            if not r:continue
            i0=next((i for i,c in enumerate(r[:3]) if season(c)),None)
            if i0 is None:continue
            y=season(r[i0])
            if y is None or y<1950 or y>2025:continue
            rest=[clean(c) for c in r[i0+1:]]
            rest=[c for c in rest if c and not re.fullmatch(r'[\d\s–\-:()a.et.p]+',c) and not re.search(r'stadium|estádio|park|Wembley|Bernabéu|Olímpico|Arena|Camp Nou|Stade|Parc',c,re.I)]
            if multi and rest:
                out.setdefault(y,[]).append(rest[0]);continue
            if rest and y not in out:
                v=rest[:2]
                if len(v)>1 and (re.search(r"[/\d']",v[1]) or len(v[1])>34):v=v[:1]
                out[y]=v
    return out
res={}
for k,(lg,cup) in SRC.items():
    res[k]={}
    for key,(lang,t) in (('lig',lg),('dom',cup)):
        try:
            tb=wikitab.tables(t,lang)
            if k=='GER' and key=='lig':tb=[x for x in tb if any(r and r[0].startswith('1994') for r in x) and not any('Karl-Marx' in c for r in x for c in r)]
            o=parse(tb,multi=(k=='ARG' and key=='lig'))
            if k=='NED' and key=='lig':o={y:v[:1] for y,v in o.items()}
            res[k][key]={str(y):v for y,v in sorted(o.items())}
            ys=sorted(o);print(k,key,len(o),ys[:1],ys[-1:],o.get(2024) or o.get(2025))
        except Exception as e:print(k,key,'ERR',e);res[k][key]={}
json.dump(res,open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'champs_hist.json'),'w',encoding='utf-8'),ensure_ascii=False,indent=0)
