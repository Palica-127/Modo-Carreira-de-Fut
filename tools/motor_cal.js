/* Calibração do motor de partidas: simula N partidas e mostra as médias.
   Uso (na raiz): node tools/motor_cal.js [N] [forçaCasa] [forçaFora] [formaçãoCasa] [formaçãoFora] */
const fs=require('fs'),vm=require('vm');
const ctx={};vm.createContext(ctx);
const mods=['motor','atrib','chute','regras','posse'];
for(const m of mods)vm.runInContext(fs.readFileSync(__dirname+'/../src/'+m+'.js','utf8').replace(/^'use strict';/,'')+(m=='motor'?';this.MT=MT':''),ctx);
const MT=ctx.MT;
/* PAR='{"desarme":{"prob":.1}}' sobrescreve constantes sem editar o código */
if(process.env.PAR){const m=(a,b)=>{for(const k in b){if(b[k]&&typeof b[k]=='object'&&!Array.isArray(b[k]))m(a[k],b[k]);else a[k]=b[k]}};m(MT.PAR,JSON.parse(process.env.PAR))}
const N=+process.argv[2]||300,fa=+process.argv[3]||70,fb=+process.argv[4]||70,ff=process.argv[5]||'4-3-3',fg=process.argv[6]||'4-3-3';
const t0=Date.now();
const st=MT.lote((seed)=>{
  const A=MT.timeTeste(fa,ff,'Casa',seed*2),B=MT.timeTeste(fb,fg,'Fora',seed*2+1),r=MT.simula(A,B,seed);
  const a=r.st[0],b=r.st[1],o={};
  const put=(k,x,y)=>{o[k+'_c']=x;o[k+'_f']=y;o[k]=(x+y)/2};
  put('gols',r.g[0],r.g[1]);put('chutes',a.chutes,b.chutes);put('noalvo',a.alvo,b.alvo);put('xg',a.xg,b.xg);put('passes',a.pas,b.pas);
  put('acerto',a.pas?100*a.pasOk/a.pas:0,b.pas?100*b.pasOk/b.pas:0);put('desarmes',a.desarmes,b.desarmes);put('interc',a.inter,b.inter);
  put('dribles',a.dribles,b.dribles);put('drOk',a.dribles?100*a.dribOk/a.dribles:0,b.dribles?100*b.dribOk/b.dribles:0);put('cruz',a.cruz,b.cruz);put('lanc',a.lanc,b.lanc);put('cond',a.conducoes,b.conducoes);
  put('posse',100*a.posse/(a.posse+b.posse),100*b.posse/(a.posse+b.posse));put('defesas',a.defesas,b.defesas);put('bloq',a.bloq,b.bloq);
  put('faltas',a.faltas,b.faltas);put('am',a.amarelos,b.amarelos);put('vm',a.vermelhos,b.vermelhos);put('imp',a.imped,b.imped);put('esc',a.escanteios,b.escanteios);put('lat',a.laterais,b.laterais);put('pen',a.penaltis,b.penaltis);put('tl',a.tl,b.tl);put('tlg',a.tlGol,b.tlGol);put('cab',a.cabecas,b.cabecas);
  o.vitC=r.g[0]>r.g[1]?1:0;o.emp=r.g[0]==r.g[1]?1:0;o.vitF=r.g[1]>r.g[0]?1:0;o.totGols=r.g[0]+r.g[1];o.eventos=r.log.ev.length;
  return o;
},N,1);
const m=k=>st.mean(k);
console.log(`${N} partidas em ${((Date.now()-t0)/1000).toFixed(1)}s  (${fa} ${ff} x ${fb} ${fg})`);
console.log('gols/jogo',(m('gols_c')+m('gols_f')).toFixed(2),`(casa ${m('gols_c').toFixed(2)} x fora ${m('gols_f').toFixed(2)})  vitória casa ${(100*m('vitC')).toFixed(0)}% empate ${(100*m('emp')).toFixed(0)}% fora ${(100*m('vitF')).toFixed(0)}%`);
console.log('chutes/time',m('chutes').toFixed(1),' no alvo',m('noalvo').toFixed(1),' conversão',(100*(m('gols')/m('chutes'))).toFixed(1)+'%',' xG/time',m('xg').toFixed(2),' defesas',m('defesas').toFixed(1),' bloqueios',m('bloq').toFixed(1));
console.log('passes/time',m('passes').toFixed(0),' acerto',m('acerto').toFixed(1)+'%',' lançamentos',m('lanc').toFixed(1),' cruzamentos',m('cruz').toFixed(1),' conduções',m('cond').toFixed(0));
console.log('desarmes/time',m('desarmes').toFixed(1),' interceptações',m('interc').toFixed(1),' dribles',m('dribles').toFixed(1),' drible certo',m('drOk').toFixed(0)+'%');
console.log('posse casa',m('posse_c').toFixed(1)+'%',' lances no registro',m('eventos').toFixed(0));

console.log('faltas/time',m('faltas').toFixed(1),' amarelos/jogo',(2*m('am')).toFixed(2),' vermelhos/jogo',(2*m('vm')).toFixed(2),' impedimentos/time',m('imp').toFixed(1),' escanteios/time',m('esc').toFixed(1),' laterais/time',m('lat').toFixed(1),' pênaltis/jogo',(2*m('pen')).toFixed(2),' tiros livres/time',m('tl').toFixed(1),' gols de falta/jogo',(2*m('tlg')).toFixed(2),' cabeceios/time',m('cab').toFixed(1));
