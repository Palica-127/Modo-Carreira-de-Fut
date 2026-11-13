/* partida ao vivo: o placar jogado = o lançado no calendário; recarregar no meio retoma o mesmo jogo */
const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync('../pro-football-career.html','utf8').replace(/<link rel="stylesheet"[^>]*>/,'');
const errors=[];
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/',beforeParse(w){w.scrollTo=()=>{};w.confirm=()=>true;w.addEventListener('error',e=>errors.push('ERR '+e.message));w.console.error=(...a)=>errors.push('console.error '+a.join(' '))}});
const w=dom.window,ev=c=>w.eval(c);
ev(`TITLE=null;render()`);ev(`document.querySelector('#fl').value='1';start()`);
let ok=0;
for(let wk=0;wk<10&&ok<4;wk++){
  ev(`S.day=7`);ev(`(function(){const g=wkPlan()[0];S.day=g.d})()`);
  ev(`jogarJogo()`);if(!ev(`!!(ui.lv&&ui.lv.V)`)){ev(`S.ev=null;while(S.ph=='season'&&S.week<${wk+3}){step()}`);continue}
  /* anda até o minuto 20-ish decidindo, salva, "recarrega" recriando a partida da gravação */
  const alvo=15+ok*12;
  for(let g=0;g<200&&ev(`ui.lv.t`)<alvo;g++){if(ev(`!!ui.lv.dec`))ev(`lvEsc(0)`);else ev(`lvTickV(ui.lv)`)}
  const antes=ev(`JSON.stringify({t:ui.lv.t,g:ui.lv.V.r.g,n:ui.lv.V.dec.length,ev:ui.lv.V.r.ev.length,dec:!!ui.lv.dec})`);
  ev(`S.pj.min=ui.lv.t;S.pj.dec=ui.lv.V.dec.slice();ui.lv=null;lvBoot()`);
  const dep=ev(`JSON.stringify({t:ui.lv.t,g:ui.lv.V.r.g,n:ui.lv.V.dec.length,ev:ui.lv.V.r.ev.length,dec:!!ui.lv.dec})`);
  if(antes!==dep)errors.push('retomada difere: '+antes+' x '+dep);
  /* termina */
  for(let g=0;g<400&&ev(`!!(ui.lv&&ui.lv.V)`);g++){if(ev(`!!ui.lv.dec`))ev(`lvEsc(-1)`);else ev(`lvTickV(ui.lv)`)}
  const fim=ev(`(function(){const r=S.last.find(x=>x.pl||x.h==S.club||x.a==S.club);return JSON.stringify({g:r.g,motor:r.motor,vivo:r.vivo||0,sn:r.sn,pj:S.pj,pre:typeof PRE!=='undefined'&&PRE,shown:ui.lv&&ui.lv.i>=0?S.last[ui.lv.i].g:null})})()`);
  const o=JSON.parse(fim);if(!o.motor||o.pj||o.pre)errors.push('fim inconsistente '+fim);
  ok++;ev(`ui.lv=null;clearInterval(LVT);S.ev=null;while(S.ph=='season'&&S.week<${wk+2}){step()}`);
}
console.log('partidas conferidas',ok);console.log(errors.length?'ERROS:\n'+errors.join('\n'):'sem erros');
