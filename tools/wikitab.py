import json,urllib.request,urllib.parse,re,sys
from html.parser import HTMLParser
def html(t,lang='pt'):
    import os,time,hashlib
    d=os.path.join(os.environ.get('TEMP','.'),'wikicache');os.makedirs(d,exist_ok=True)
    f=os.path.join(d,hashlib.md5((lang+t).encode()).hexdigest()+'.json')
    if os.path.exists(f):return json.load(open(f,encoding='utf-8'))
    u='https://%s.wikipedia.org/w/api.php?action=parse&prop=text&format=json&redirects=1&page=%s'%(lang,urllib.parse.quote(t))
    for i in range(8):
        try:
            h=json.loads(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'HabiteSe10/1.0 (educational football game)'}),timeout=40).read())['parse']['text']['*']
            json.dump(h,open(f,'w',encoding='utf-8'));time.sleep(2);return h
        except Exception as e:time.sleep(15*(i+1))
    raise RuntimeError('falhou '+t)
class P(HTMLParser):
    def __init__(s):super().__init__();s.T=[];s.r=None;s.c=None;s.d=0
    def handle_starttag(s,t,a):
        if t=='table':s.T.append([]);s.d+=1
        elif t=='tr' and s.T:s.r=[];s.T[-1].append(s.r)
        elif t in('td','th') and s.r is not None:s.c=''
    def handle_endtag(s,t):
        if t in('td','th') and s.c is not None and s.r is not None:s.r.append(s.c.strip());s.c=None
        if t=='table':s.d-=1
    def handle_data(s,d):
        if s.c is not None:s.c+=d
def tables(t,lang='pt'):
    p=P();p.feed(html(t,lang));return p.T
if __name__=='__main__':
    for y in [2021,2022,2023,2024,2025]:
        for t in tables('Campeonato Brasileiro de Futebol de %d - Série A'%y):
            if len(t)>=20 and len(t[2:])>=19 and any(len(r)>=8 for r in t):
                print(y,[r[:3] for r in t[:3]]);break
