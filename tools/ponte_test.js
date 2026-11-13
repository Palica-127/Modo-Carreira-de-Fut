/* Teste de integração: carreira com o motor novo ligado ao jogo (src/ponte.js). Uso (na raiz): node tools/ponte_test.js [temporadas] */
const fs=require('fs'),vm=require('vm');
const T=+process.argv[2]||3;
let src=fs.readFileSync(__dirname+'/../test_engine.js','utf8');
const a=src.indexOf('const code='),b=src.indexOf('vm.runInThisContext(code+`');
let pre=src.slice(a,b).replace('const code=','global.__code=');
pre=pre.replace(/S\.y<2026\+24/,'S.y<2026+'+T);
eval(pre);
const rd=m=>fs.readFileSync(__dirname+'/../src/'+m+'.js','utf8').replace(/^'use strict';/,'');
const mods=['motor','atrib','chute','regras','tatica','cond','arbitro','narra','posse','ponte'].map((m,i)=>rd(m)).join('\n');
const erros=[];const ce=console.error;console.error=(...x)=>{erros.push(x.join(' '));};
vm.runInThisContext(mods+'\n'+global.__code+`
let nM=0,nF=0;const _pm=pmMotor;pmMotor=function(r,x){const q=_pm(r,x);q?nM++:nF++;return q};
const res=playCareer({pos:'ATA',lg:0});
const must=(c,m)=>{if(!c){console.log('FALHOU:',m);process.exitCode=1}};
const rs=S.hist?S.hist:[];
console.log("motor novo:",nM,"fallback:",nF);console.log('temporadas',res.rows.length,'ms',res.ms);
/* jogos do usuário na última temporada guardados em S.last só existem durante a temporada; conferimos o acumulado */
console.log('ultimo ano: ap',S.sum.ap,'g',S.sum.g,'a',S.sum.a,'media',S.sum.avg.toFixed(2));
must(res.rows.length>=${T}-1,'careira roda as temporadas');
`);
console.error=ce;
if(erros.length){console.log('FALHOU: erros do motor novo:',erros.slice(0,3));process.exitCode=1}
else console.log('integração: sem erros do motor novo');
