"""Baixa elencos atuais (aprox.) da Wikidata para os clubes de tools/clubs.json.
Saída: tools/squads_raw.json  (retoma de onde parou)."""
import json,os,re,time,urllib.request,urllib.parse,unicodedata
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA={'User-Agent':'career-mode-squads/1.0 (hobby project)','Accept':'application/json'}
CT={'Brasil':'Brazil','Inglaterra':'England','Espanha':'Spain','Itália':'Italy','Alemanha':'Germany','França':'France','Portugal':'Portugal','Holanda':'Netherlands','Argentina':'Argentina','Turquia':'Turkey'}
ALIAS={'Inter':'Inter Milan','Milan':'AC Milan','Brighton':'Brighton & Hove Albion','Wolverhampton':'Wolverhampton Wanderers','Peterborough':'Peterborough United','West Bromwich':'West Bromwich Albion','Bragantino':'Red Bull Bragantino','Atlético de Madrid':'Atlético Madrid','Barcelona':'FC Barcelona','Sporting de Gijón':'Sporting de Gijón','Bayern München':'FC Bayern Munich','Corinthians':'Sport Club Corinthians Paulista','Santos':'Santos FC','Botafogo':'Botafogo de Futebol e Regatas','Flamengo':'CR Flamengo','Vasco da Gama':'CR Vasco da Gama','Bahia':'Esporte Clube Bahia','Palmeiras':'SE Palmeiras','Cruzeiro':'Cruzeiro Esporte Clube','Grêmio':'Grêmio Foot-Ball Porto Alegrense','Internacional':'Sport Club Internacional','Fluminense':'Fluminense FC','São Paulo':'São Paulo FC'}
def get(url,tries=4):
    for i in range(tries):
        try: return json.loads(urllib.request.urlopen(urllib.request.Request(url,headers=UA),timeout=60).read())
        except Exception as e: time.sleep(5*(i+1))
def resolve(name,ctry):
    q=ALIAS.get(name,name)
    r=get('https://www.wikidata.org/w/api.php?action=wbsearchentities&language=en&uselang=en&type=item&limit=10&format=json&search='+urllib.parse.quote(q))
    best=None
    for x in (r or {}).get('search',[]):
        d=(x.get('description') or '').lower()
        if 'football' in d and ('club' in d or 'team' in d) and not any(w in d for w in ('women','youth','futsal','american','rugby')):
            s=(2 if ctry.lower() in d else 0)+(1 if x.get('label','').lower()==q.lower() else 0)
            if best is None or s>best[0]: best=(s,x['id'],x['label'])
    return best
Q='''SELECT ?p ?pLabel ?born ?natLabel ?posLabel ?sl ?start WHERE {
  ?p p:P54 ?st. ?st ps:P54 wd:%s. FILTER NOT EXISTS {?st pq:P582 ?end}
  OPTIONAL{?st pq:P580 ?start}
  ?p wdt:P106 wd:Q937857; wdt:P21 wd:Q6581097; wdt:P569 ?born. FILTER(?born>"1986-01-01"^^xsd:dateTime)
  FILTER NOT EXISTS {?p wdt:P570 ?d}
  OPTIONAL{?p wdt:P27 ?nat} OPTIONAL{?p wdt:P413 ?pos}
  ?p wikibase:sitelinks ?sl.
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}'''
def main():
    clubs=json.load(open(os.path.join(ROOT,'tools','clubs.json')))
    out=os.path.join(ROOT,'tools','squads_raw.json')
    res=json.load(open(out)) if os.path.exists(out) else {}
    for c in clubs:
        n=c['n']
        if n in res: continue
        b=resolve(n,CT[c['nat']]);time.sleep(.5)
        if not b: res[n]={'qid':None,'rows':[]};print('SEM QID',n);json.dump(res,open(out,'w'));continue
        d=get('https://query.wikidata.org/sparql?format=json&query='+urllib.parse.quote(Q%b[1]));time.sleep(1)
        rows=[]
        for x in (d or {}).get('results',{}).get('bindings',[]):
            g=lambda k:x.get(k,{}).get('value')
            rows.append([g('p').split('/')[-1],g('pLabel'),(g('born') or '')[:10],g('natLabel'),g('posLabel'),int(g('sl') or 0),(g('start') or '')[:10]])
        res[n]={'qid':b[1],'label':b[2],'rows':rows};print(n,'->',b[2],len(rows))
        json.dump(res,open(out,'w'))
if __name__=='__main__':main()
