import re,urllib.parse
src='src/'
data=open(src+'data.js').read();eng=open(src+'engine.js').read();ui=open(src+'ui.js').read();css=open(src+'style.css').read()
strip=lambda t:t.replace("'use strict';\n","",1)
import os,json,base64
crest={}
if os.path.exists('tools/crests_report.json'):
    for sl,r in json.load(open('tools/crests_report.json')).items():
        f='assets/crests/'+sl+'.webp'
        if r.get('ok') and os.path.exists(f):crest[r['n']]='data:image/webp;base64,'+base64.b64encode(open(f,'rb').read()).decode()
crests='const CREST='+json.dumps(crest,ensure_ascii=False)+';\n'
js="'use strict';\n"+crests+strip(data)+"\n"+strip(eng)+"\n"+strip(ui)
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
open('pro-football-career.html','w').write(html)
print(len(html)//1024,'KB')
