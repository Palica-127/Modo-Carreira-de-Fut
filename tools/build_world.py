"""Cruza os clubes da ESPN (tools/espn.json) com os do jogo e gera:
 - tools/world.json  (ligas com divisoes completas)
 - src/squads.js     (elencos reais, formato compacto)
Uso: python -I tools/build_world.py [--report]"""
import json,os,re,sys,unicodedata,difflib
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J=lambda p:json.load(open(os.path.join(ROOT,p),encoding='utf-8'))
META=J('tools/leagues_meta.json');ESPN=J('tools/espn.json')
try:EXTRA=J('tools/extra_clubs.json')
except Exception:EXTRA={}
def norm(s):
    s=unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower().replace('&',' ')
    s=re.sub(r'[^a-z0-9 ]',' ',s)
    return ' '.join(t for t in s.split() if t not in('fc','cf','afc','sc','ac','as','ssc','club','de','the','and','cd','ud','sd','rc','us','fk','sk','ca','sv','vfl','vfb','tsv','fsv','1','ec','ad','if'))
# nome ESPN -> nome no jogo (quando a normalizacao nao basta)
ALIAS={'Borussia Mönchengladbach':'Mönchengladbach','FC Cologne':'Köln','Hertha Berlin':'Hertha BSC','Stade Rennais':'Rennes','Vitória de Guimaraes':'Vitória SC','Instituto (Córdoba)':'Instituto','Unión (Santa Fe)':'Unión','Talleres (Córdoba)':'Talleres','Belgrano (Córdoba)':'Belgrano','Sarmiento (Junín)':'Sarmiento','Colón (Santa Fe)':'Colón','Godoy Cruz Antonio Tomba':'Godoy Cruz','Chacarita Juniors':'Chacarita','Estudiantes de La Plata':'Estudiantes','C.D. Nacional':'Nacional','Gimnasia (Mendoza)':'Gimnasia (Mendoza)','Amed SFK':'Amed SFK','Istanbul Basaksehir':'Başakşehir','Caykur Rizespor':'Rizespor','Genclerbirligi':'Gençlerbirliği','Erzurum BB':'Erzurumspor','Estrela':'Estrela da Amadora','Académico de Viseu':'Académico de Viseu','Le Mans':'Le Mans','Red Star FC 93':'Red Star','AS Nancy Lorraine':'Nancy','Dijon FCO':'Dijon','Stade Laval':'Laval','Rodez Aveyron':'Rodez','Clermont Foot':'Clermont','Stade de Reims':'Reims','AJ Auxerre':'Auxerre','FC Twente':'Twente','FC Utrecht':'Utrecht','FC Groningen':'Groningen','SC Cambuur':'Cambuur','Roda JC Kerkrade':'Roda JC','Heracles Almelo':'Heracles','Ajax Amsterdam':'Ajax','Feyenoord Rotterdam':'Feyenoord','PSV Eindhoven':'PSV','FC Volendam':'Volendam','Athletico-PR':'Athletico Paranaense','Atlético-MG':'Atlético Mineiro','Red Bull Bragantino':'Bragantino','Operário PR':'Operário-PR','Sport':'Sport Recife','Athletic Club':'Athletic Bilbao','Celta Vigo':'Celta de Vigo','Deportivo':'Deportivo La Coruña','Internazionale':'Inter','AC Milan':'Milan','AS Roma':'Roma','Brighton & Hove Albion':'Brighton','West Bromwich Albion':'West Bromwich','Wolverhampton Wanderers':'Wolverhampton','Peterborough United':'Peterborough','Wrexham':'Wrexham','Sudtirol':'Südtirol','US Avellino':'Avellino','Hellas Verona':'Hellas Verona','Real Valladolid':'Real Valladolid'}
OLD={}  # nome -> (lk,d,idx)
for L in META:
    for d,cl in enumerate(L['cl']):
        for i,n in enumerate(cl):OLD[n]=(L['k'],d,i)
OLDN={norm(n):n for n in OLD}
def match(en,lk):
    if en in ALIAS and ALIAS[en] in OLD:return ALIAS[en]
    if en in OLD:return en
    k=norm(en)
    if k in OLDN:return OLDN[k]
    best=None
    if '(' not in en:
        ts=set(k.split());c=[n for n in OLD if OLD[n][0]==lk and norm(n) and (set(norm(n).split())<=ts or ts<=set(norm(n).split()))]
        if len(c)==1:return c[0]
    for n in OLD:
        if OLD[n][0]!=lk:continue
        r=difflib.SequenceMatcher(None,k,norm(n)).ratio()
        if best is None or r>best[0]:best=(r,n)
    if best and best[0]>=.86:return best[1]
    return None
def reserve(n):return (bool(re.search(r'(II|B|Fortuna|Castilla|U\d\d|Reserves?)$',n)) and n!='Willem II') or n.startswith('TBD') or n.startswith('Jong ')
NAT={'Brazil':'BRA','Argentina':'ARG','Portugal':'POR','Spain':'ESP','France':'FRA','England':'ENG','Germany':'GER','Italy':'ITA','Netherlands':'NED','Turkey':'TUR','Türkiye':'TUR','Uruguay':'URU','Colombia':'COL','Nigeria':'NGA','Morocco':'MAR','Japan':'JPN','United States':'USA','Belgium':'BEL','Croatia':'CRO','Senegal':'SEN','Ivory Coast':'CIV',"Côte d'Ivoire":'CIV','Ghana':'GHA','Cameroon':'CMR','Norway':'NOR','Sweden':'SWE','Denmark':'DEN','Switzerland':'SUI','Poland':'POL','Scotland':'SCO','Wales':'WAL','Republic of Ireland':'IRL','Ireland':'IRL','Northern Ireland':'NIR','Chile':'CHI','Paraguay':'PAR','Ecuador':'ECU','Peru':'PER','Venezuela':'VEN','Mexico':'MEX','Algeria':'ALG','Egypt':'EGY','Tunisia':'TUN','Mali':'MLI','South Korea':'KOR','Korea Republic':'KOR','Australia':'AUS','Serbia':'SRB','Austria':'AUT','Czechia':'CZE','Czech Republic':'CZE','Greece':'GRE','Ukraine':'UKR','DR Congo':'COD','Congo DR':'COD','Jamaica':'JAM','Canada':'CAN','Kosovo':'KOS','Albania':'ALB','Bosnia and Herzegovina':'BIH','Slovenia':'SVN','Hungary':'HUN','Romania':'ROU','Slovakia':'SVK','Iceland':'ISL','Finland':'FIN','Georgia':'GEO','Israel':'ISR','Gabon':'GAB','Guinea':'GUI','Burkina Faso':'BFA','Zimbabwe':'ZIM','Iran':'IRN','Bulgaria':'BUL','Montenegro':'MNE','North Macedonia':'MKD','Armenia':'ARM','Angola':'ANG','Cape Verde':'CPV','Gambia':'GAM','Costa Rica':'CRC','Panama':'PAN','Honduras':'HON','Bolivia':'BOL','New Zealand':'NZL','Luxembourg':'LUX','Cyprus':'CYP','Zambia':'ZAM','South Africa':'RSA','Mozambique':'MOZ','Benin':'BEN','Togo':'TOG','Curaçao':'CUW','Suriname':'SUR','Haiti':'HAI','Trinidad and Tobago':'TRI','Guinea-Bissau':'GNB','Sierra Leone':'SLE','Uzbekistan':'UZB','China':'CHN','Russia':'RUS','Lithuania':'LTU','Latvia':'LVA','Estonia':'EST','Belarus':'BLR','Moldova':'MDA','Azerbaijan':'AZE','Kazakhstan':'KAZ','Central African Republic':'CTA','Equatorial Guinea':'EQG','Comoros':'COM','Libya':'LBY','Syria':'SYR','Iraq':'IRQ','Jordan':'JOR','Saudi Arabia':'KSA','Philippines':'PHI','Indonesia':'IDN','Uganda':'UGA','Kenya':'KEN','Tanzania':'TAN','Ethiopia':'ETH','Sudan':'SDN','Madagascar':'MAD','Mauritania':'MTN','Chad':'CHA','Burundi':'BDI','Rwanda':'RWA','Namibia':'NAM'}
def natc(s):return NAT.get(s) or (re.sub(r'[^A-Za-z]','',s)[:3].upper() if s else '—')
def build():
    world=[];squads={};unmatched=[];used=set();global LOGOS;LOGOS={}
    for L in META:
        lk=L['k'];nd=len(L['dn']);divs=[None]*nd
        # divisoes cobertas pela ESPN
        espn_div={}
        for d in range(nd):
            e=ESPN.get(lk+'-'+str(d))
            if e and e['teams']:espn_div[d]=[t for t in e['teams'] if not t['n'].startswith('TBD') and (d>0 or not reserve(t['n']))]
        taken=set()
        for d,ts in espn_div.items():
            # 1) casa nomes
            rows=[]
            for t in ts:
                g=match(t['n'],lk)
                if g and g in taken:g=None
                if g:taken.add(g)
                rows.append([t,g])
            # 2) ordenacao: forca antiga (global na liga) + tabela atual
            known=[r for r in rows if r[1]]
            key=lambda g:OLD[g][1]*100+OLD[g][2]
            ks=sorted(known,key=lambda r:key(r[1]))
            pct_old={r[1]:(i/max(1,len(ks)-1)) for i,r in enumerate(ks)}
            n=len(rows)
            sc=[]
            for t,g in rows:
                rk=t.get('rank');ps=((rk-1)/max(1,n-1)) if rk else .5
                s=(.65*pct_old[g]+.35*ps) if g else ps+.12
                sc.append((s,t,g))
            sc.sort(key=lambda x:x[0])
            divs[d]=[(g or t['n'],t) for s,t,g in sc]
        # divisoes sem ESPN: restos dos antigos + extras
        left=[n for d in range(nd) for n in L['cl'][d] if n not in taken]
        for d in range(nd):
            if divs[d] is not None:continue
            want=EXTRA.get(lk+'-'+str(d)+'-n',20)
            rows=[]
            for n in left:
                if len(rows)>=want:break
                rows.append((n,None))
            for n in EXTRA.get(lk+'-'+str(d),[]):
                if len(rows)>=want:break
                if n not in [r[0] for r in rows] and n not in taken:rows.append((n,None))
            left=[n for n in left if n not in [r[0] for r in rows]]
            divs[d]=rows
        # leftover que sobrou (clubes antigos que nao entraram em lugar nenhum) -> ignorados
        world.append({**{k:L[k] for k in('k','n','nat','q','cup','dn')},'cl':[[r[0] for r in dv] for dv in divs]})
        for dv in divs:
            for n,t in dv:
                if t and t.get('players'):
                    squads[n]=[[p[0],p[1] or 'M',p[2] or 24,natc(p[3])] for p in t['players'] if p[0]]
                if t:used.add(n);LOGOS[n]=[t['id'],t.get('logo')]
    return world,squads
if __name__=='__main__':
    world,squads=build()
    json.dump(world,open(os.path.join(ROOT,'tools','world.json'),'w',encoding='utf-8'),ensure_ascii=False,indent=0)
    for L in world:print(L['k'],[len(x) for x in L['cl']]);assert all(len(x)%2==0 for x in L['cl']),L['k']
    # clubes antigos que sumiram
    new={n for L in world for dv in L['cl'] for n in dv}
    print('antigos fora:',[n for n in OLD if n not in new])
    print('elencos:',len(squads),'jogadores:',sum(len(v) for v in squads.values()))
    # ---- grava src/squads.js e o bloco LEAGUES de src/data.js
    def norm_n(s):return re.sub(r'[^a-z0-9 -]','',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower()).strip()
    stars={k.strip():v for k,v in J('tools/stars.json').items() if v}
    BS=chr(92)
    q=lambda s:"'"+s.replace(BS,BS+BS).replace("'",BS+"'")+"'"
    lines=["'use strict';","/* Elencos reais (ESPN, nov/2026) — gerado por tools/build_world.py. Formato: Nome|Pos|Idade|País;... Pos: G D M F */","const SQ={"]
    for n,pl in squads.items():
        lines.append(q(n)+':'+q(';'.join('%s|%s|%s|%s'%(p[0].replace('|','').replace(';',''),p[1][:1],p[2],p[3]) for p in pl))+',')
    lines.append('};')
    used_stars={norm_n(p[0]):stars[norm_n(p[0])] for pl in squads.values() for p in pl if norm_n(p[0]) in stars}
    lines.append('const STAR='+json.dumps(used_stars,ensure_ascii=False)+';')
    open(os.path.join(ROOT,'src','squads.js'),'w',encoding='utf-8',newline='').write('\n'.join(lines)+'\n')
    out=['const LEAGUES=[']
    for i,L in enumerate(world):
        out.append("{k:%s,n:%s,nat:%s,q:%s,cup:%s,dn:[%s],cl:["%(q(L['k']),q(L['n']),q(L['nat']),L['q'],q(L['cup']),','.join(q(x) for x in L['dn'])))
        out.append(',\n'.join(q(', '.join(dv)) for dv in L['cl'])+']}'+(',' if i<len(world)-1 else ''))
    out.append('];')
    p=os.path.join(ROOT,'src','data.js');d=open(p,encoding='utf-8').read()
    a=d.index('const LEAGUES=[');b=d.index('];',a)+2
    open(p,'w',encoding='utf-8',newline='').write(d[:a]+'\n'.join(out)+d[b:])
    json.dump(LOGOS,open(os.path.join(ROOT,'tools','logos.json'),'w',encoding='utf-8'),ensure_ascii=False)
    print('gravado',len(used_stars),'estrelas')
