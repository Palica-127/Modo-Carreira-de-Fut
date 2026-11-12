"""Baixa escudos da TheSportsDB (chave de teste 123) e reduz para WebP 64px.
Uso: python tools/fetch_crests.py   (retoma de onde parou; resultado em assets/crests + tools/crests_report.json)"""
import json,os,re,time,unicodedata,urllib.request,urllib.parse,io,difflib
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
API='https://www.thesportsdb.com/api/v1/json/123/searchteams.php?t='
CTRY={'Brasil':'Brazil','Inglaterra':'England','Espanha':'Spain','Itália':'Italy','Alemanha':'Germany','França':'France','Portugal':'Portugal','Holanda':'Netherlands','Argentina':'Argentina','Turquia':'Turkey'}
# nomes em português/abreviados -> nome mais provável na base
ALIAS={'Inter':'Inter Milan','Milan':'AC Milan','Brighton':'Brighton and Hove Albion','Wolverhampton':'Wolverhampton Wanderers','Peterborough':'Peterborough United','West Bromwich':'West Bromwich Albion','Bragantino':'RB Bragantino','Atlético de Madrid':'Atletico Madrid','Barcelona':'FC Barcelona','Sporting de Gijón':'Sporting Gijon','Celta de Vigo':'Celta Vigo','Bayern München':'Bayern Munich','Borussia Mönchengladbach':"Borussia Monchengladbach"}
def slug(s):
    s=unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+','-',s).strip('-')
def norm(s):
    s=unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower()
    return re.sub(r'\b(fc|cf|afc|sc|ac|club|de|the)\b','',re.sub(r'[^a-z0-9 ]',' ',s)).split()
def get(url,tries=4):
    for i in range(tries):
        try:
            r=urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'career-mode-crests'}),timeout=30)
            return r.read()
        except Exception as e:
            time.sleep(4*(i+1))
    return None
def score(a,b):
    return difflib.SequenceMatcher(None,' '.join(norm(a)),' '.join(norm(b))).ratio()
def main():
    clubs=json.load(open(os.path.join(ROOT,'tools','clubs.json')))
    out=os.path.join(ROOT,'assets','crests');os.makedirs(out,exist_ok=True)
    rp=os.path.join(ROOT,'tools','crests_report.json')
    rep=json.load(open(rp)) if os.path.exists(rp) else {}
    for c in clubs:
        n=c['n'];sl=slug(n)
        if sl in rep and rep[sl].get('ok'):continue
        ctry=CTRY[c['nat']];q=ALIAS.get(n,n)
        raw=get(API+urllib.parse.quote(q));time.sleep(2.2)
        best=None
        try:
            teams=(json.loads(raw)['teams'] or []) if raw else []
        except Exception: teams=[]
        for t in teams:
            if t.get('strSport')!='Soccer' or not t.get('strBadge'):continue
            s=score(q,t['strTeam'])+(0.15 if t.get('strCountry')==ctry else -0.3)
            if best is None or s>best[0]:best=(s,t)
        if not best or best[0]<0.75:
            rep[sl]={'n':n,'ok':False,'why':'sem match','best':best and best[1]['strTeam']};print('FALHOU',n,rep[sl]['best']);json.dump(rep,open(rp,'w'),indent=0);continue
        img=get(best[1]['strBadge']+'/small')
        try:
            im=Image.open(io.BytesIO(img)).convert('RGBA');im.thumbnail((72,72),Image.LANCZOS)
            im.save(os.path.join(out,sl+'.webp'),'WEBP',quality=82,method=6)
            rep[sl]={'n':n,'ok':True,'team':best[1]['strTeam'],'score':round(best[0],2)};print('ok',n,'->',best[1]['strTeam'])
        except Exception as e:
            rep[sl]={'n':n,'ok':False,'why':str(e)};print('ERRO',n,e)
        json.dump(rep,open(rp,'w'),indent=0)
if __name__=='__main__':main()
