/* Teste de fumaça: abre todas as abas, sub-abas e fichas ao longo de uma carreira inteira.
   Uso (dentro de tools/): node smoke.js   (precisa do pacote jsdom instalado: npm i jsdom) */
const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync('../pro-football-career.html','utf8').replace(/<link rel="stylesheet"[^>]*>/,'');
const errors=[];
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/',
  beforeParse(w){w.scrollTo=()=>{};w.confirm=()=>true;w.addEventListener('error',e=>errors.push('ERR '+e.message));w.console.error=(...a)=>errors.push('console.error '+a.join(' '))}});
const w=dom.window;
const ev=c=>w.eval(c);
ev(`document.querySelector('#fl').value='1';start()`);
const bad=()=>{const t=w.document.querySelector('#app').textContent;return t.includes('Erro ao exibir')};
const chk=(tag)=>{if(bad())errors.push(tag+': '+w.document.querySelector('#app').textContent.slice(0,200))};
const sheetOk=(tag,code)=>{ev(`ui.sheet=null;${code}`);const ok=!!w.document.querySelector('.sheet');if(bad()||!ok)errors.push(tag+' ficha '+code);ev('ui.sheet=null;render()')};
let counts={pages:0,sheets:0};
function allPages(tag){
  /* páginas principais */
  for(const p of ['jogar','bdo','lend','elen','jog']){ev(`ui.pg='${p}';render()`);chk(tag+' pg '+p);counts.pages++}
  /* Jogar */
  for(const k of ['prox','res','tab','cal','copa','camp']){ev(`ui.pg='jogar';ui.jg='${k}';render()`);chk(tag+' jogar '+k);counts.pages++}
  for(let l=0;l<10;l++)for(const m of ['tab','copa','camp']){ev(`ui.pg='jogar';ui.jg='${m}';ui.lg=${l};ui.dv=null;render()`);chk(tag+' jogar '+m+' liga '+l)}
  for(let d=0;d<4;d++){ev(`ui.pg='jogar';ui.jg='tab';ui.lg=1;ui.dv=${d};render()`);chk(tag+' jogar tab div '+d)}
  /* Bola de Ouro */
  for(const k of ['bdo','ovr','art']){ev(`ui.pg='bdo';ui.bk='${k}';render()`);chk(tag+' bdo '+k)}
  ev(`ui.pg='bdo';ui.bk='bdo';ui.by='now';render()`);chk(tag+' bdo now');
  for(const y of JSON.parse(ev('JSON.stringify(S.bdo.map(b=>String(b.y)))'))){ev(`ui.pg='bdo';ui.bk='bdo';ui.by='${y}';render()`);chk(tag+' bdo ano '+y)}
  ev(`ui.by=null`);
  /* Lendas */
  for(const k of ['jog','wc','ucl','lib','clb','sel']){ev(`ui.pg='lend';ui.ld='${k}';render()`);chk(tag+' lend '+k)}
  /* Elenco */
  for(let l=0;l<10;l++)for(let d=0;d<ev(`LEAGUES[${l}].dn.length`);d++){ev(`ui.pg='elen';ui.ec=null;ui.el={l:${l},d:${d}};render()`);chk(tag+' elen '+l+'-'+d)}
  for(const id of [ev('S.club'),0,5,40,120,ev('S.cs.length-1')]){ev(`ui.pg='elen';ui.ec=${id};render()`);chk(tag+' elenco clube '+id);counts.pages++}
  ev(`ui.ec=null`);
  /* Jogador */
  for(const k of ['at','cards','hab','ctr','hist','tro','sel','conq','mail','sys']){ev(`ui.pg='jog';ui.pf='${k}';render()`);chk(tag+' jogador '+k)}
  /* Fichas */
  for(const tab of ['res','tit','tmp']){
    sheetOk(tag,`sheet('me','me');ui.sheet.tab='${tab}';render()`);
    sheetOk(tag,`sheet('p',S.rv[0].id);ui.sheet.tab='${tab}';render()`);
    if(ev('S.hof.length'))sheetOk(tag,`sheet('p',S.hof[0].id);ui.sheet.tab='${tab}';render()`);
  }
  for(const tab of ['res','tit','tmp','elc']){
    sheetOk(tag,`sheet('c',S.club);ui.sheet.tab='${tab}';render()`);
    sheetOk(tag,`sheet('c',S.cs.find(c=>c.n=='Real Madrid').id);ui.sheet.tab='${tab}';render()`);
    sheetOk(tag,`sheet('c',S.cs.find(c=>c.l<0).id);ui.sheet.tab='${tab}';render()`);
    sheetOk(tag,`sheet('c',S.cs.find(c=>c.l==1&&c.d==3).id);ui.sheet.tab='${tab}';render()`);
  }
  for(const tab of ['res','cp']){sheetOk(tag,`sheet('s','Brasil');ui.sheet.tab='${tab}';render()`);sheetOk(tag,`sheet('s','Hungria');ui.sheet.tab='${tab}';render()`)}
  sheetOk(tag,`sheet('l',encodeURIComponent(LEG[0].n))`);
  sheetOk(tag,`sheet('l',encodeURIComponent(LEG[20].n))`);
  sheetOk(tag,"sheet('q',S.club+'.7')");
  if(ev('S.mail.length'))sheetOk(tag,`sheet('m',String(S.mail[0].id))`);
  if(ev('lvIdx()')>=0){for(const code of ['liveOpen(lvIdx(),1)','liveOpen(lvIdx());ui.lv.t=45;lvDraw()']){ev(code);if(!w.document.querySelector('#lvo .lvh')||/undefined|NaN/.test(w.document.querySelector('#lvo').textContent))errors.push(tag+' ao vivo '+code);ev('clearInterval(LVT);ui.lv=null;S.lvp=0;lvDraw()')}}
  counts.sheets+=1;
  ev(`ui.pg='jogar';ui.jg='prox';render()`);
}
allPages('inicio');
let seasons=0;
while(ev('S.ph')!='ret'&&seasons<26){
  let g=0;
  while(ev("S.ph")=='season'&&g++<60){
    if(ev('!!S.ev')){allPages('evento');ev('pick(0)')}
    else{ev('simN(10)'); if(g%2==0)allPages('s'+seasons+'w'+ev('S.week'))}
  }
  if(ev('S.ph')=='off'){allPages('off'+seasons);ev(`(function(){const b=S.of.map((o,i)=>[cl(o.club).s,i,o]).filter(x=>x[2].t!='emp').sort((a,b)=>b[0]-a[0])[0];if(b&&b[0]>cl(S.club).s+3)acc(b[1]);else{const r=S.of.findIndex(o=>o.t=='ren');if(r>=0)acc(r)}})()`);ev('roll()');seasons++}
}
allPages('fim');
console.log('temporadas',seasons,'ph',ev('S.ph'),'idade',ev('S.p.age'),'páginas testadas',counts.pages);
console.log('erros',errors.length);errors.slice(0,20).forEach(e=>console.log(e));
/* export/import */
ev(`ui.pg='jog';ui.pf='sys';render()`);
const sv=ev('JSON.stringify(S)');
ev(`document.querySelector('#sv').value=${JSON.stringify(sv)}`);
console.log('import',ev('importSave(document.querySelector("#sv").value)'),'bytes',Math.round(sv.length/1024)+'KB');
process.exitCode=errors.length?1:0;
