const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync('../pro-football-career.html','utf8').replace(/<link rel="stylesheet"[^>]*>/,'');
const errors=[];
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/',
  beforeParse(w){w.scrollTo=()=>{};w.confirm=()=>true;w.addEventListener('error',e=>errors.push('ERR '+e.message));w.console.error=(...a)=>errors.push('console.error '+a.join(' '))}});
const w=dom.window;
const ev=c=>w.eval(c);
ev(`start=start;`);
// intro -> iniciar
ev(`document.querySelector('#fl').value='1';start()`);
const pages=['car','jg','lg','rk','mk','pf'];
const bad=()=>{const t=w.document.querySelector('#app').textContent;return t.includes('Erro ao exibir')};
function allPages(tag){
  for(const p of pages){
    ev(`ui.pg='${p}';render()`);
    if(bad())errors.push(tag+' pagina '+p+': '+w.document.querySelector('#app').textContent.slice(0,200));
  }
  // sub-abas
  for(const k of ['last','sea','cal']){ev(`ui.pg='jg';ui.jg='${k}';render()`);if(bad())errors.push(tag+' jg '+k)}
  for(let l=0;l<10;l++)for(const m of ['tab','cup','champ']){ev(`ui.pg='lg';ui.lg=${l};ui.dv=null;ui.lgm='${m}';render()`);if(bad())errors.push(tag+' lg '+l+m)}
  for(let d=0;d<4;d++){ev(`ui.pg='lg';ui.lg=1;ui.lgm='tab';ui.dv=${d};render()`);if(bad())errors.push(tag+' lg dv '+d)}
  for(const k of ['bdo','ovr','art','clb','his']){ev(`ui.pg='rk';ui.rk='${k}';render()`);if(bad())errors.push(tag+' rk '+k)}
  for(const sh of ["'me','me'","'p',S.rv[0].id","'c',S.club","'c',S.cs.find(c=>c.l>=0&&c.id!=S.club).id","'l',encodeURIComponent(LEG[0].n)"]){ev(`ui.pg='rk';sheet(${sh})`);const t=w.document.querySelector('#app').textContent;if(bad()||!w.document.querySelector('.sheet'))errors.push(tag+' ficha '+sh);ev('closeSheet()')}
  for(const k of ['at','cards','hist','tro','hab','conq','fin','sys']){ev(`ui.pg='pf';ui.pf='${k}';render()`);if(bad())errors.push(tag+' pf '+k)}
  ev(`ui.pg='car';render()`);
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
console.log('temporadas',seasons,'ph',ev('S.ph'),'idade',ev('S.p.age'));
console.log('erros',errors.length);errors.slice(0,15).forEach(e=>console.log(e));
// export/import
ev(`ui.pg='pf';ui.pf='sys';render()`);
const sv=ev('JSON.stringify(S)');
ev(`document.querySelector('#sv').value=${JSON.stringify(sv)}`);
console.log('import',ev('importSave(document.querySelector("#sv").value)'),'bytes',Math.round(sv.length/1024)+'KB');
