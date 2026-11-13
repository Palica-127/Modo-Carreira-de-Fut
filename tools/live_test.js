/* Testa a animação do campo ao vivo: simula quadros (60 fps) de partidas inteiras, sem navegador.
   Uso (em tools/): node live_test.js   (precisa do jsdom) */
const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync('../pro-football-career.html','utf8').replace(/<link rel="stylesheet"[^>]*>/,'');
const errors=[];
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/',
  beforeParse(w){w.scrollTo=()=>{};w.confirm=()=>true;w.addEventListener('error',e=>errors.push('ERR '+e.message));w.console.error=(...a)=>errors.push('console.error '+a.join(' '))}});
const w=dom.window,ev=c=>w.eval(c);
ev(`TITLE=null;render()`);ev(`document.querySelector('#fl').value='1';start()`);
let games=0,goals=0,cels=0,maxHold=0,kinds={};
for(let wk=0;wk<14&&games<8;wk++){
  ev(`S.day=7`);
  const i0=ev(`(function(){const g=wkPlan()[0];S.day=g.d;return g.ph})()`);
  ev(`jogarJogo()`);
  const has=ev(`!!ui.lv`);
  if(!has){ev(`S.ev=null;while(S.ph=='season'&&S.week<${wk+3}){step()}`);continue}
  games++;
  ev(`ui.lv.sp=${games%3};lvTimer()`);
  if(games==3)ev(`lvSkip()`);
  if(games==5){ev(`lvSim()`);if(ev(`ui.lv.t`)!=90)errors.push('simular tudo falhou')}
  /* roda quadros de 16 ms e ticks de minuto como o navegador faria */
  let now=0,tickAcc=0,frames=0,guard=0;
  while(ev(`ui.lv&&ui.lv.t<90`)&&guard++<400000){
    now+=16;frames++;
    ev(`lvFrame(${now})`);
    tickAcc+=16;
    const st=ev(`PIT?JSON.stringify({c:!!PIT.cel,h:PIT.hold,s:PIT.seg&&PIT.seg.k,nan:[PIT.ball.x,PIT.ball.y].some(isNaN)||PIT.pos.flat().some(p=>isNaN(p[0])||isNaN(p[1]))}):'null'`);
    if(st!='null'){const o=JSON.parse(st);if(o.nan){errors.push('NaN no campo, jogo '+games);break}if(o.c)cels++;if(o.s)kinds[o.s]=(kinds[o.s]||0)+1}
  }
  if(guard>=400000)errors.push('partida travou (jogo '+games+', t='+ev('ui.lv.t')+')');
  goals+=ev(`S.last.find(x=>x.pl)?S.last.find(x=>x.pl).sc.length:0`);
  const sc=ev(`(function(){const r=S.last.find(x=>x.pl);const t=ui.lv?ui.lv.t:90;return r?r.g[0]+'x'+r.g[1]:'?'})()`);
  ev(`lvClose&&0;clearInterval(LVT);ui.lv=null;S.lvp=0;lvDraw()`);
  ev(`S.ev=null;while(S.ph=='season'&&S.wb!=undefined&&S.week<${wk+2}){step()}`);
}
console.log('jogos',games,'gols',goals,'quadros de comemoração',cels,'trechos',JSON.stringify(kinds));
console.log(errors.length?'ERROS:\n'+errors.join('\n'):'sem erros');
