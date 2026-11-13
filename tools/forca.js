/* Diagnóstico de forças: node tools/forca.js [N]  — imprime força por clube e testa confrontos no motor */
const fs=require('fs'),vm=require('vm');
let src=fs.readFileSync(__dirname+'/../test_engine.js','utf8');
const a=src.indexOf('const code='),b=src.indexOf('vm.runInThisContext(code+`');
eval(src.slice(a,b).replace('const code=','global.__code='));
const rd=m=>fs.readFileSync(__dirname+'/../src/'+m+'.js','utf8').replace(/^'use strict';/,'');
const mods=['squads','motor','atrib','chute','regras','tatica','cond','arbitro','narra','posse','ponte'].map(rd).join('\n');
const N=+process.argv[2]||60;
vm.runInThisContext(mods+'\n'+global.__code+`
FK=${process.env.FK||0.55};FC=${process.env.FC||72};newGame({name:'Teste',nat:'Brasil',h:180,w:72,pos:'ATA',lg:0});
const by=n=>S.cs.find(c=>c.n==n);
const show=n=>{const c=by(n);if(!c)return n+': ?';const sq=squadOf(c.id).filter(x=>!x.me),top=sq.slice().sort((p,q)=>q.ovr-p.ovr).slice(0,14),med=top.reduce((s,x)=>s+x.ovr,0)/Math.max(1,top.length);const js=motorElenco(c.id);const t2=js.slice().sort((p,q)=>q.ovr-p.ovr).slice(0,14);return n+' s='+c.s+' elenco='+sq.length+' médiaTop14='+med.toFixed(1)+' motor='+(t2.reduce((s,x)=>s+x.ovr,0)/t2.length).toFixed(1)};
['Figueirense','Flamengo','Palmeiras','Real Madrid','Manchester City','Bayern München','Inter','Santos','Vasco da Gama','Chapecoense','Coritiba'].forEach(n=>console.log(show(n)));
const br=S.cs.filter(c=>LEAGUES[c.l]&&LEAGUES[c.l].k=='BRA');
for(let d=0;d<4;d++){const q=br.filter(c=>c.d==d).map(c=>c.s);if(q.length)console.log('BRA div',d,'n',q.length,'min',Math.min(...q).toFixed(1),'max',Math.max(...q).toFixed(1))}
const r=(A,B)=>{let g0=0,g1=0,w=[0,0,0],mx=0,gl5=0;for(let i=0;i<${N};i++){const m=MT.simula(MT.timeIA(motorElenco(by(A).id),A),MT.timeIA(motorElenco(by(B).id),B),i*7+1,{mataMata:true});g0+=m.g[0];g1+=m.g[1];mx=Math.max(mx,Math.abs(m.g[0]-m.g[1]));if(Math.abs(m.g[0]-m.g[1])>=5)gl5++;w[m.g[0]>m.g[1]?0:m.g[0]<m.g[1]?2:1]++}
 console.log(A+' x '+B+': gols '+(g0/${N}).toFixed(2)+' x '+(g1/${N}).toFixed(2)+' | V/E/D '+w.join('/')+' | maior goleada '+mx+' | margem>=5: '+gl5)};
r('Flamengo','Figueirense');r('Figueirense','Flamengo');r('Real Madrid','Flamengo');r('Palmeiras','Flamengo');r('Real Madrid','Manchester City');
`);
