/* Testes do motor de partidas (src/motor.js). Uso (na raiz): node tools/motor_test.js
   Cada módulo novo do motor acrescenta seus testes aqui. */
const fs=require('fs'),vm=require('vm');
const ctx={};vm.createContext(ctx);
for(const m of ['motor','atrib','posse'])vm.runInContext(fs.readFileSync(__dirname+'/../src/'+m+'.js','utf8').replace(/^'use strict';/,'')+(m=='motor'?';this.MT=MT':''),ctx);
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


/* ===== módulo 1: atributos ===== */
{
 const POS=[['GOL','GK'],['ZAG','CB'],['ZAG','LB'],['VOL','CDM'],['MEI','CM'],['MEI','CAM'],['PNT','LW'],['ATA','ST']];
 const mk=(pos,fp,ovr,age,n)=>MT.atrib({n,pos,fp,ovr,age,nat:'Brasil'});
 /* determinismo */
 {const a=mk('ATA','ST',78,24,'Fulano'),b=mk('ATA','ST',78,24,'Fulano');ok(JSON.stringify(a)===JSON.stringify(b),'ficha reproduzível');
  ok(JSON.stringify(a.a)!==JSON.stringify(mk('ATA','ST',78,24,'Beltrano').a),'nomes diferentes => fichas diferentes');}
 /* 40 atributos na escala certa */
 {let bad=0,miss=0,n=0;for(const [p,fp] of POS)for(let o=40;o<=92;o+=4)for(let age=17;age<=38;age+=3)for(let i=0;i<4;i++){const f=mk(p,fp,o,age,'J'+i+p+o);n++;
   MT.ATTR_KEYS.forEach(k=>{const v=f.a[k];if(v==null||isNaN(v))miss++;else if(v<1||v>99||v!==Math.round(v))bad++})}
  ok(MT.ATTR.length==40,'são 40 atributos');ok(miss==0,'nenhum atributo faltando ('+miss+')');ok(bad==0,'todos entre 1 e 99 e inteiros ('+bad+')');}
 /* a nota geral calculada pelos atributos bate com o OVR informado */
 {for(const [p,fp] of POS){let s=0,mx=0,n=0;for(let o=45;o<=90;o+=5)for(let i=0;i<30;i++){const f=mk(p,fp,o,23+i%10,'P'+i+fp+o),d=Math.abs(MT.ovrOf(f.a,f.cls)-o);s+=d;n++;if(d>mx)mx=d}
   ok(s/n<.6&&mx<2.5,'nota geral coerente em '+fp+' (média do erro '+(s/n).toFixed(2)+', máx '+mx.toFixed(2)+')')}}
 /* diferenças entre funções */
 const med=(p,fp,k,o=75)=>{let s=0;for(let i=0;i<200;i++)s+=mk(p,fp,o,25,'M'+i+fp).a[k];return s/200};
 ok(med('ZAG','CB','des')>med('ATA','ST','des')+20,'zagueiro desarma muito mais que o atacante');
 ok(med('ZAG','CB','mar')>med('MEI','CAM','mar')+15,'zagueiro marca mais que o meia ofensivo');
 ok(med('ATA','ST','fin')>med('ZAG','CB','fin')+25,'atacante finaliza muito mais que o zagueiro');
 ok(med('MEI','CAM','pas')>med('ZAG','CB','pas')+12,'meia passa melhor que o zagueiro');
 ok(med('MEI','CAM','vis')>med('ZAG','CB','vis')+15,'meia tem mais visão de jogo que o zagueiro');
 ok(med('MEI','CAM','pal')>med('ZAG','CB','pal')+5,'meia faz passe longo melhor que o zagueiro');
 ok(med('ZAG','CB','cab')>med('PNT','LW','cab')+20,'zagueiro cabeceia mais que o ponta');
 ok(med('PNT','LW','vel')>med('ZAG','CB','vel')+15,'ponta é bem mais veloz que o zagueiro');
 ok(med('ZAG','LB','cru')>med('ZAG','CB','cru')+20,'lateral cruza mais que o zagueiro central');
 ok(med('ZAG','LB','res')>med('ZAG','CB','res')+8,'lateral tem mais fôlego que o zagueiro central');
 ok(med('GOL','GK','ref')>80&&med('ATA','ST','ref')<20,'só o goleiro tem reflexos');
 ok(med('GOL','GK','fin')<med('ATA','ST','fin')-30,'goleiro não finaliza como atacante');
 ok(med('ATA','ST','fin',90)>med('ATA','ST','fin',60)+15,'craque finaliza mais que o mediano');
 /* idade: veterano perde ritmo e ganha cabeça (mesmo OVR) */
 {const m=(age,k)=>{let s=0;for(let i=0;i<200;i++)s+=MT.atrib({n:'V'+i,pos:'MEI',fp:'CM',ovr:78,age,nat:'X'}).a[k];return s/200};
  ok(m(21,'ace')>m(35,'ace')+8,'o veterano é mais lento');ok(m(35,'dec')>m(21,'dec')+4,'o veterano decide melhor');ok(m(35,'res')<m(24,'res')-2,'o veterano tem menos fôlego');}
 /* individualidade: mesmos dados de função, fichas diferentes entre si, mesma nota */
 {let sd=0;for(let i=0;i<50;i++){const x=mk('ATA','ST',80,25,'X'+i),y=mk('ATA','ST',80,25,'Y'+i);let q=0;MT.ATTR_KEYS.forEach(k=>q+=Math.abs(x.a[k]-y.a[k]));sd+=q/40}
  ok(sd/50>3,'jogadores de mesma função e nota são diferentes entre si (dif. média '+(sd/50).toFixed(1)+')');}
 /* pé e bola parada */
 {let e=0,d=0,a=0;for(let i=0;i<4000;i++){const f=mk('MEI','CM',70,25,'Pe'+i);f.foot=='E'?e++:f.foot=='D'?d++:a++;}
  perto(d/4000,.76,.03,'destros');perto(e/4000,.22,.03,'canhotos');
  const g=mk('GOL','GK',80,28,'G');ok(g.a.fal<g.a.tec,'goleiro bate pior bola parada que a própria técnica');}
 /* seu jogador: os 7 atributos do jogo mandam nos grupos */
 {const at=[62,70,55,48,40,66,58],f=MT.atribUser(at,{n:'Eu',pos:'ATA',fp:'ST',ovr:60,age:19,nat:'Brasil'});
  const gr=[['vel','ace'],['fin','pen'],['pas','pal','cru','tec'],['dri','pt','agi'],['des','mar','ant','pos'],['for','res','equ','imp','cnd'],['vis','dec','cri']];
  gr.forEach((g,i)=>{const m=g.reduce((s,k)=>s+f.a[k],0)/g.length;perto(m,at[i],1.2,'grupo '+i+' do seu jogador segue o atributo do jogo')});
  const f2=MT.atribUser([62,80,55,48,40,66,58],{n:'Eu',pos:'ATA',fp:'ST',ovr:60,age:19,nat:'Brasil'});ok(f2.a.fin>f.a.fin+7,'subir Finalização sobe a ficha');}
}

/* ===== módulo 2: núcleo da posse ===== */
{
 const RAPIDO=!!process.env.RAPIDO,N=RAPIDO?12:60;
 const par=(fa,fb,seed,ff,fg)=>[MT.timeTeste(fa,ff||'4-3-3','Casa',seed*2),MT.timeTeste(fb,fg||'4-3-3','Fora',seed*2+1)];
 /* determinismo e integridade do registro */
 {const [A,B]=par(70,70,3),r1=MT.simula(A,B,77),r2=MT.simula(A,B,77),r3=MT.simula(A,B,78);
  ok(r1.log.digest()===r2.log.digest(),'mesma seed => partida idêntica');ok(r1.log.digest()!==r3.log.digest(),'outra seed => outra partida');
  const ev=r1.log.ev;ok(ev[0].k=='inicio'&&ev[ev.length-1].k=='fim','começa em inicio e termina em fim');
  ok(ev.every((e,i)=>i==0||e.t>=ev[i-1].t)&&ev[ev.length-1].t<=5400+120,'tempo crescente e dentro dos 90 minutos');
  ok(ev.filter(e=>e.k=='fim_tempo').length==1,'um intervalo');
  ok(r1.g[0]+r1.g[1]==ev.filter(e=>e.k=='gol').length,'placar bate com os gols do registro');}
 /* auditoria: toda ação com a bola é feita por quem a tem; chute só de quem recebeu ou conquistou; gol só após chute; assistência só de passe */
 {let bad=[],n=0;
  for(let sd=1;sd<=(RAPIDO?3:10);sd++){const [A,B]=par(70,70,sd),r=MT.simula(A,B,sd+500),ev=r.log.ev;let hold=null,last=null;
   for(const e of ev){
    if(e.k=='inicio'||e.k=='fim_tempo'){hold=null;continue}
    if(e.k=='recuperou'){hold=[e.s,e.p];last=e;continue}
    if(e.k=='tiro_meta'){hold=[e.s,0];last=e;continue}
    if(['passe','lancamento','cruzamento','conducao','drible','chute'].includes(e.k)){
      n++;if(hold&&(hold[0]!=e.s||hold[1]!=e.p))bad.push(e.k+' de quem não tinha a bola (t='+e.t+')');
      if(['passe','lancamento','cruzamento'].includes(e.k)&&e.o=='ok')hold=[e.s,e.q];
      if(e.k=='chute'&&last&&last.k=='chute')bad.push('dois chutes seguidos');
    }
    if(e.k=='gol'){const c=ev[e.i-1];if(!c||c.k!='chute'||c.s!=e.s||c.p!=e.p)bad.push('gol sem chute do mesmo jogador');hold=null}
    if(e.k=='assistencia'){const g=ev[e.i-1];if(!g||g.k!='gol'||g.q!=e.p)bad.push('assistência sem gol');}
    if(e.k=='defesa'){hold=[e.s,e.p]}
    if(e.k=='desarme'&&e.o=='ok'||e.k=='intercepta'){hold=null}
    last=e;
   }}
  ok(bad.length==0,'auditoria do registro: '+bad.slice(0,3).join('; ')+' ('+n+' ações verificadas)');}
 /* estatística de partidas equilibradas */
 {const st=MT.lote(sd=>{const [A,B]=par(70,70,sd),r=MT.simula(A,B,sd),a=r.st[0],b=r.st[1];
    return{gols:(r.g[0]+r.g[1])/2,chutes:(a.chutes+b.chutes)/2,alvo:(a.alvo+b.alvo)/2,passes:(a.pas+b.pas)/2,acerto:100*(a.pasOk+b.pasOk)/(a.pas+b.pas),des:(a.desarmes+b.desarmes)/2,
      inter:(a.inter+b.inter)/2,posse:100*a.posse/(a.posse+b.posse),conv:(a.chutes+b.chutes)?100*(a.gols+b.gols)/(a.chutes+b.chutes):0}},N,1);
  const faixa=(k,lo,hi,m)=>ok(st.mean(k)>=lo&&st.mean(k)<=hi,m+': '+st.mean(k).toFixed(2)+' (esperado '+lo+' a '+hi+')');
  faixa('gols',RAPIDO?.7:1.0,RAPIDO?2.2:1.8,'gols por time');faixa('chutes',9,16.5,'chutes por time');faixa('alvo',3.2,6.5,'chutes no alvo por time');
  faixa('passes',330,540,'passes por time');faixa('acerto',77,89,'precisão dos passes (%)');faixa('des',9,27,'desarmes por time');faixa('inter',6,20,'interceptações por time');
  faixa('posse',46,54,'posse do time da casa (%)');faixa('conv',6,15,'conversão dos chutes (%)');}
 /* o mais forte vence mais; os atributos fazem diferença */
 {const fav=MT.lote(sd=>{const [A,B]=par(78,62,sd),r=MT.simula(A,B,sd);return{v:r.g[0]>r.g[1]?1:0,e:r.g[0]==r.g[1]?1:0,sg:r.g[0]-r.g[1],pos:100*r.st[0].posse/(r.st[0].posse+r.st[1].posse)}},RAPIDO?12:40,1);
  ok(fav.mean('v')>=.55,'time muito superior vence a maioria ('+(100*fav.mean('v')).toFixed(0)+'%)');ok(fav.mean('sg')>1.0,'saldo médio do favorito > 1 ('+fav.mean('sg').toFixed(2)+')');ok(fav.mean('pos')>51.5,'favorito tem mais posse ('+fav.mean('pos').toFixed(0)+'%)');
  /* mesmos times, mas o time B com passe, toque e visão ruins: precisão de passe cai */
  const ruim=T=>{T.xi.forEach(p=>{p.a={...p.a};['pas','pal','tec','pt','vis'].forEach(k=>p.a[k]=Math.max(5,p.a[k]-25))});return T};
  const pa=MT.lote(sd=>{const A=MT.timeTeste(70,'4-3-3','Casa',sd*2),B=ruim(MT.timeTeste(70,'4-3-3','Fora',sd*2+1)),r=MT.simula(A,B,sd);return{a:100*r.st[0].pasOk/r.st[0].pas,b:100*r.st[1].pasOk/r.st[1].pas}},RAPIDO?10:30,1);
  ok(pa.mean('a')>pa.mean('b')+4,'passe/técnica/visão ruins derrubam a precisão ('+pa.mean('a').toFixed(1)+' x '+pa.mean('b').toFixed(1)+')');
  /* goleiro excelente x goleiro fraco: a conversão dos chutes do adversário cai */
  const gk=(v)=>T=>{const p=T.xi[0];p.a={...p.a};['ref','aga','gpo','sai','um1'].forEach(k=>p.a[k]=v);return T};
  let gb=0,sb=0,gf=0,sf=0;
  for(let sd=1;sd<=(RAPIDO?10:40);sd++){const A=MT.timeTeste(70,'4-3-3','Casa',sd*2),r=MT.simula(A,gk(92)(MT.timeTeste(70,'4-3-3','Fora',sd*2+1)),sd),r2=MT.simula(A,gk(35)(MT.timeTeste(70,'4-3-3','Fora',sd*2+1)),sd);
    gb+=r.st[0].gols;sb+=r.st[0].chutes;gf+=r2.st[0].gols;sf+=r2.st[0].chutes}
  ok(gb/sb<gf/sf,'goleiro bom converte menos chutes do adversário que o ruim ('+(100*gb/sb).toFixed(1)+'% x '+(100*gf/sf).toFixed(1)+'%)');
}
}

console.log(falhas?`${falhas} FALHA(S) de ${total}`:`motor: ${total} verificações, todas passaram`);
process.exitCode=falhas?1:0;
