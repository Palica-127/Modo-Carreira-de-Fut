import re,urllib.parse
src='src/'
rd=lambda f:open(src+f,encoding='utf-8').read()
data=rd('data.js');sqd=rd('squads.js');fmt=rd('formatos.js');hist=rd('hist.js');eng=rd('engine.js');motor=rd('motor.js');atrib=rd('atrib.js');chute=rd('chute.js');regras=rd('regras.js');tatica=rd('tatica.js');cond=rd('cond.js');arbitro=rd('arbitro.js');narra=rd('narra.js');ponte=rd('ponte.js');posse=rd('posse.js');ui=rd('ui.js');abas=rd('abas.js');live=rd('live.js');menu=rd('menu.js');css=rd('style.css')
strip=lambda t:t.replace("'use strict';\n","",1)
import os,json,base64
crest={}
if os.path.exists('tools/crests_report.json'):
    for sl,r in json.load(open('tools/crests_report.json')).items():
        f='assets/crests/'+sl+'.webp'
        if r.get('ok') and os.path.exists(f):crest[r['n']]='data:image/webp;base64,'+base64.b64encode(open(f,'rb').read()).decode()
import unicodedata
def _slug(s):
    s=unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower();return re.sub(r'[^a-z0-9]+','-',s).strip('-')
legimg={}
_i=data.index('const LEG=[')
for _n in re.findall(r"\{n:'([^']+)'",data[_i:data.index('];',_i)]):
    _f='assets/players/'+_slug(_n)+'.webp'
    if not os.path.exists(_f):_f='assets/legends/'+_slug(_n)+'.webp'
    if os.path.exists(_f):legimg[_n]='data:image/webp;base64,'+base64.b64encode(open(_f,'rb').read()).decode()
_bn=[]
_a=hist.index('const BDO_REAL=rowsOf(`')+len('const BDO_REAL=rowsOf(`');_b=hist.index('`)',_a)
for _l in hist[_a:_b].strip().splitlines():_bn.append(_l.strip().split('|')[1])
_bn+=re.findall(r"\['([^']+)','[A-Z]{3}','",hist[hist.index('const BDO_TOP'):])
for _n in _bn:
    _f='assets/players/'+_slug(_n)+'.webp'
    if not os.path.exists(_f):_f='assets/legends/'+_slug(_n)+'.webp'
    if _n not in legimg and os.path.exists(_f):legimg[_n]='data:image/webp;base64,'+base64.b64encode(open(_f,'rb').read()).decode()
crestclr={}
def _dom(path):
    from PIL import Image
    im=Image.open(path).convert('RGBA');im.thumbnail((56,56));bins={}
    for r,g,b,a in im.getdata():
        if a<200:continue
        mx,mn=max(r,g,b),min(r,g,b)
        if mn>222 or mx<48:continue
        sat=(mx-mn)/max(1,mx);w=1+sat*2.5;v=bins.setdefault((r>>5,g>>5,b>>5),[0,0,0,0.0,0]);v[0]+=r*w;v[1]+=g*w;v[2]+=b*w;v[3]+=w;v[4]+=1
    cols=[((v[0]/v[3],v[1]/v[3],v[2]/v[3]),v[3]) for v in bins.values()]
    cols.sort(key=lambda x:-x[1])
    if not cols:return None
    h=lambda c:'#%02x%02x%02x'%tuple(int(x) for x in c)
    c1=cols[0][0];c2=None
    for c,_ in cols[1:]:
        if sum((a-b)**2 for a,b in zip(c,c1))**.5>90:c2=c;break
    if c2 is None:c2=(245,245,245) if sum(c1)<400 else (24,28,40)
    return [h(c1),h(c2)]
for _s,_r in (json.load(open('tools/crests_report.json')) if os.path.exists('tools/crests_report.json') else {}).items():
    _f='assets/crests/'+_s+'.webp'
    if _r.get('ok') and os.path.exists(_f):
        try:
            _c=_dom(_f)
            if _c:crestclr[_r['n']]=_c
        except Exception:pass
flagimg={}
if os.path.exists('tools/flags.json'):
    for _n,(_c,_i) in json.load(open('tools/flags.json',encoding='utf-8')).items():
        _f='assets/flags/'+_i+'.webp'
        if os.path.exists(_f):
            _d='data:image/webp;base64,'+base64.b64encode(open(_f,'rb').read()).decode();flagimg[_n]=_d;flagimg[_c]=_d
pset=sorted(f[:-5] for f in os.listdir('assets/players')) if os.path.isdir('assets/players') else []
crests='const PSET=new Set('+json.dumps(pset)+');\nconst CRESTCLR='+json.dumps(crestclr,ensure_ascii=False)+';\nconst FLAGIMG='+json.dumps(flagimg,ensure_ascii=False)+';\nconst LEGIMG='+json.dumps(legimg,ensure_ascii=False)+';\nconst CREST='+json.dumps(crest,ensure_ascii=False)+';\n'
boot="\nif(typeof document!='undefined'){optLoad();S=null;render()}\n"
js="'use strict';\n"+crests+strip(data)+"\n"+strip(sqd)+"\n"+strip(hist)+"\n"+strip(fmt)+"\n"+strip(eng)+"\n"+strip(motor)+"\n"+strip(atrib)+"\n"+strip(chute)+"\n"+strip(regras)+"\n"+strip(tatica)+"\n"+strip(cond)+"\n"+strip(arbitro)+"\n"+strip(narra)+"\n"+strip(posse)+"\n"+strip(ponte)+"\n"+strip(ui)+"\n"+strip(abas)+"\n"+strip(live)+"\n"+strip(menu)+boot
icon="<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle cx='20' cy='20' r='18' fill='#060A22' stroke='#00F5A0' stroke-width='3'/><path d='M20 10l7 5-2.7 8.3h-8.6L13 15z' fill='#00C2FF'/></svg>"
html=f'''<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8">
<title>Habite-se 10</title>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#060A22"><meta name="color-scheme" content="dark">
<meta name="description" content="Habite-se 10: simulador de carreira de futebol com 10 ligas, Champions, Libertadores e Bola de Ouro.">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,{urllib.parse.quote(icon)}">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600;700&display=swap">
<style>
{css}
</style></head>
<body><div id="app" class="wrap"></div>
<script>
{js}
</script></body></html>
'''
for _f in ('pro-football-career.html','index.html'):open(_f,'w',encoding='utf-8',newline='').write(html)
print(len(html)//1024,'KB')
