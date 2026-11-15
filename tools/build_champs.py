"""tools/champs_hist.json -> bloco NAT_H em src/hist.js (campeões reais das ligas e copas nacionais, 1970-2025, com nomes do jogo).
Uso: python -I tools/build_champs.py"""
import json,os,re
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cs=json.load(open(os.path.join(os.environ.get('TEMP','.'),'clubs_game.json'),encoding='utf-8')) if os.path.exists(os.path.join(os.environ.get('TEMP','.'),'clubs_game.json')) else None
AL={'BRA':{'Atlético Paranaense':'Athletico Paranaense','Sport':'Sport Recife'},
'ENG':{'Brighton & Hove Albion':'Brighton'},
'ESP':{'Atlético Madrid':'Atlético de Madrid','Sporting Gijón':'Sporting de Gijón','Zaragoza':'Real Zaragoza','Celta Vigo':'Celta de Vigo','Valladolid':'Real Valladolid'},
'ITA':{'Internazionale':'Inter','Inter Milan':'Inter','AC Milan':'Milan'},
'GER':{'Bayern Munich':'Bayern München','1. FC Kaiserslautern':'Kaiserslautern','1. FC Magdeburg':'Magdeburg','VfL Wolfsburg':'Wolfsburg','1. FC Köln':'Köln','1. FC Nürnberg':'Nürnberg','Borussia Mönchengladbach':'Mönchengladbach','SC Freiburg':'Freiburg','FC Hansa Rostock':'Hansa Rostock'},
'FRA':{'Nancy':'AS Nancy Lorraine'},
'POR':{'Vitória de Guimarães':'Vitória SC','Desportivo das Aves':'Aves','Estrela da Amadora':'Estrela'},
'NED':{'AZ':'AZ Alkmaar',"AZ '67":'AZ Alkmaar','FC Utrecht':'Utrecht','FC Groningen':'Groningen','FC Den Haag':'ADO Den Haag','NAC':'NAC Breda'},
'ARG':{'Racing':'Racing Club','Gimnasia y Esgrima':'Gimnasia La Plata','Central Córdoba':'Central Córdoba (Santiago del Estero)'},
'TUR':{'İstanbul Başakşehir':'Başakşehir'}}
JUNK=re.compile(r"\d|Competition|Final between|De Kuip|Stad|Buenos Aires|^—$|abandon",re.I)
d=json.load(open(os.path.join(R,'tools','champs_hist.json'),encoding='utf-8'))
def nm(k,x):
    x=re.sub(r'\s*[#§]+$','',x).strip()
    return AL.get(k,{}).get(x,x)
out=['/* >>> NAT_H (gerado por tools/build_champs.py; não editar à mão) */',
'/* Campeões reais das ligas e copas nacionais (1970-2025): ano|campeão|vice. Na Argentina há vários campeões por ano (um por torneio). */',
'const NAT_H={']
for k,v in d.items():
    out.append(' %s:{'%k)
    for t in ('lig','dom'):
        rows=[]
        for y in sorted(v[t],key=int):
            if int(y)<1970:continue
            a=[nm(k,x) for x in v[t][y] if x and not JUNK.search(x)]
            if not a:continue
            if k=='ARG' and t=='lig':a=list(dict.fromkeys(a))
            elif len(a)>2:a=a[:2]
            rows.append(y+'|'+'|'.join(a))
        out.append('  %s:rowsOf(`\n%s\n`),'%(t,'\n'.join(rows)))
    out.append(' },')
out.append('};')
out.append('/* <<< NAT_H */')
blk='\n'.join(out)+'\n'
p=os.path.join(R,'src','hist.js');raw=open(p,'rb').read().decode('utf-8');crlf='\r\n' in raw;s=raw.replace('\r\n','\n')
s=re.sub(r'/\* >>> NAT_H.*?/\* <<< NAT_H \*/\n','',s,flags=re.S)
a="/* códigos de seleções que não estão no jogo */"
assert a in s
s=s.replace(a,blk+a)
if crlf:s=s.replace('\n','\r\n')
open(p,'wb').write(s.encode('utf-8'));print('ok',len(blk))
