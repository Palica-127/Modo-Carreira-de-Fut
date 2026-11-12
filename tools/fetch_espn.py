"""Baixa clubes, escudos (URL), tabela e elencos atuais da API publica da ESPN.
Uso: python tools/fetch_espn.py   (retoma; resultado em tools/espn.json)"""
import json,os,time,urllib.request
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'tools','espn.json')
# (liga do jogo, divisao, codigo ESPN)
DIVS=[('BRA',0,'bra.1'),('BRA',1,'bra.2'),('ENG',0,'eng.1'),('ENG',1,'eng.2'),('ENG',2,'eng.3'),('ENG',3,'eng.4'),
 ('ESP',0,'esp.1'),('ESP',1,'esp.2'),('ITA',0,'ita.1'),('ITA',1,'ita.2'),('GER',0,'ger.1'),('GER',1,'ger.2'),
 ('FRA',0,'fra.1'),('FRA',1,'fra.2'),('POR',0,'por.1'),('NED',0,'ned.1'),('NED',1,'ned.2'),('ARG',0,'arg.1'),('ARG',1,'arg.2'),('TUR',0,'tur.1')]
B='https://site.api.espn.com/apis/site/v2/sports/soccer/'
def get(u,tries=4):
    for i in range(tries):
        try:return json.loads(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'}),timeout=30).read())
        except Exception as e:time.sleep(2*(i+1))
    return None
def main():
    D=json.load(open(OUT,encoding='utf-8')) if os.path.exists(OUT) else {}
    for lk,d,code in DIVS:
        key=lk+'-'+str(d)
        if key not in D or not D[key].get('teams'):
            j=get(B+code+'/teams?limit=100')
            ts=[x['team'] for x in j['sports'][0]['leagues'][0]['teams']] if j else []
            st=get('https://site.api.espn.com/apis/v2/sports/soccer/'+code+'/standings')
            rank={}
            try:
                for e in st['children'][0]['standings']['entries']:
                    rank[e['team']['id']]=[s['value'] for s in e['stats'] if s['name']=='rank'][0]
            except Exception:pass
            D[key]={'code':code,'teams':[{'id':t['id'],'n':t['displayName'],'loc':t.get('location'),'logo':(t.get('logos') or [{}])[0].get('href'),'rank':rank.get(t['id']),'players':None} for t in ts]}
            json.dump(D,open(OUT,'w',encoding='utf-8'),ensure_ascii=False);print(key,len(ts),flush=True)
        for t in D[key]['teams']:
            if t['players'] is not None:continue
            r=get(B+D[key]['code']+'/teams/'+t['id']+'/roster')
            if r is None:print('falhou',t['n']);continue
            t['players']=[[a.get('displayName') or a.get('fullName'),(a.get('position') or {}).get('abbreviation','M'),a.get('age'),a.get('citizenship') or '',a.get('jersey') or ''] for a in r.get('athletes',[])]
            json.dump(D,open(OUT,'w',encoding='utf-8'),ensure_ascii=False)
        print(key,'elencos ok',flush=True)
if __name__=='__main__':main()
