/* Testes do motor de partidas (src/motor.js). Uso (na raiz): node tools/motor_test.js
   Cada módulo novo do motor acrescenta seus testes aqui. */
const fs=require('fs'),vm=require('vm');
const ctx={};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname+'/../src/motor.js','utf8').replace(/^'use strict';/,'')+';this.MT=MT',ctx);
const MT=ctx.MT;
let falhas=0,total=0;
const ok=(c,m)=>{total++;if(!c){falhas++;console.log('FALHOU:',m)}};
const perto=(a,b,tol,m)=>ok(Math.abs(a-b)<=tol,m+' (obtido '+a.toFixed(4)+', esperado '+b+' ±'+tol+')');

/* 1) determinismo: mesma seed => mesma sequência; seeds diferentes => sequências diferentes */
{const a=MT.rng(42),b=MT.rng(42),c=MT.rng(43);let igual=true,dif=false;
 for(let i=0;i<1000;i++){const x=a.f(),y=b.f(),z=c.f();if(x!==y)igual=false;if(x!==z)dif=true}
 ok(igual,'mesma seed deve repetir a sequência');ok(dif,'seeds diferentes devem divergir');
 ok(MT.rng('Flamengo x Palmeiras').f()===MT.rng('Flamengo x Palmeiras').f(),'seed em texto é estável');}

/* 2) sub-fluxos independentes (fork): consumir um não altera o outro; fork não depende de quanto o pai já andou */
{const p1=MT.rng(7),p2=MT.rng(7);for(let i=0;i<50;i++)p2.f();
 ok(p1.fork('chute').f()===p2.fork('chute').f(),'fork deve depender só da seed e do nome');
 ok(p1.fork('chute').f()!==p1.fork('falta').f(),'forks com nomes diferentes devem divergir');
 const x=MT.rng(9).fork('a'),y=MT.rng(9).fork('a'),z=MT.rng(9).fork('b');for(let i=0;i<100;i++)z.f();
 ok(x.f()===y.f(),'consumir outro fork não muda este');}

/* 3) qualidade estatística */
{const r=MT.rng(2026),N=200000;let s=0,s2=0,ch=0,gs=0,gq=0,inb=true;
 const cont=[0,0,0,0,0,0,0,0,0,0];
 for(let i=0;i<N;i++){const v=r.f();s+=v;s2+=v*v;cont[Math.floor(v*10)]++;if(r.chance(.3))ch++;const g=r.gauss(10,2);gs+=g;gq+=g*g;const k=r.int(3,6);if(k<3||k>6)inb=false}
 perto(s/N,.5,.005,'média uniforme');perto(Math.sqrt(s2/N-.25),Math.sqrt(1/12),.005,'desvio uniforme');
 perto(ch/N,.3,.005,'chance(0,3)');perto(gs/N,10,.03,'média gaussiana');perto(Math.sqrt(gq/N-Math.pow(gs/N,2)),2,.03,'desvio gaussiano');
 ok(inb,'int(3,6) fica no intervalo');
 ok(cont.every(c=>Math.abs(c/N-.1)<.005),'histograma uniforme plano');}
{const r=MT.rng(5),it=['a','b','c'],c={a:0,b:0,c:0},w={a:1,b:2,c:7};
 for(let i=0;i<100000;i++)c[r.weighted(it,x=>w[x])]++;
 perto(c.a/1e5,.1,.01,'peso a');perto(c.b/1e5,.2,.01,'peso b');perto(c.c/1e5,.7,.01,'peso c');
 ok(MT.rng(1).weighted(['x'],()=>0)===null,'todos os pesos 0 devolve null');
 const sh=MT.rng(3).shuffle([1,2,3,4,5,6,7,8]);ok(sh.slice().sort().join()=='1,2,3,4,5,6,7,8','shuffle preserva os itens');}

/* 4) registro de lances */
{const L=MT.Log();L.add('inicio',0);L.add('passe',3.5,{s:0,p:4,q:8,x:.4,y:.5,o:'ok'});L.add('chute',9,{s:0,p:9,x:.9,y:.5,d:{xg:.31}});L.add('gol',9.5,{s:0,p:9,q:8});
 ok(L.ev.length==4&&L.ev[1].i==1,'registro numerado');ok(L.count('gol')==1&&L.count('gol',1)==0,'contagem por tipo e time');
 let erro=false;try{L.add('inventado',20)}catch(e){erro=true}ok(erro,'tipo desconhecido é recusado');
 erro=false;try{L.add('passe',5)}catch(e){erro=true}ok(erro,'tempo não pode voltar');
 ok(L.until(0.1).length==2,'until() filtra por minuto');
 const L2=MT.Log();L2.add('inicio',0);L2.add('passe',3.5,{s:0,p:4,q:8,x:.4,y:.5,o:'ok'});L2.add('chute',9,{s:0,p:9,x:.9,y:.5,d:{xg:.31}});L2.add('gol',9.5,{s:0,p:9,q:8});
 ok(L.digest()===L2.digest(),'registros idênticos têm a mesma impressão digital');
 L2.add('fim',10);ok(L.digest()!==L2.digest(),'registros diferentes têm impressões diferentes');}

/* 5) partida de mentira, determinística, rodada em lote */
{const sim=seed=>{const r=MT.rng(seed),L=MT.Log();let g=0;for(let m=1;m<=90;m++)if(r.chance(.03)){g++;L.add('gol',m*60,{s:0})}return{gols:g,dig:parseInt(L.digest(),16)%1000}};
 const a=MT.lote(sim,2000,100),b=MT.lote(sim,2000,100);
 ok(a.mean('gols')===b.mean('gols')&&a.mean('dig')===b.mean('dig'),'lote reproduzível com a mesma seed inicial');
 perto(a.mean('gols'),2.7,.12,'média de gols da partida de mentira');
 ok(a.n('gols')===2000,'lote registra todas as partidas');ok(a.report().length==2,'relatório do lote');
 ok(a.share('gols',0)===1&&a.share('gols',99)===0,'share() nos extremos');}

console.log(falhas?`${falhas} FALHA(S) de ${total}`:`motor: ${total} verificações, todas passaram`);
process.exitCode=falhas?1:0;
