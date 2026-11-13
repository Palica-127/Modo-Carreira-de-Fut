/* Testes do motor de partidas (src/motor.js). Uso (na raiz): node tools/motor_test.js
   Cada módulo novo do motor acrescenta seus testes aqui. */
const fs=require('fs'),vm=require('vm');
const ctx={};vm.createContext(ctx);
for(const m of ['motor','atrib','chute','regras','tatica','cond','arbitro','narra','posse'])vm.runInContext(fs.readFileSync(__dirname+'/../src/'+m+'.js','utf8').replace(/^'use strict';/,'')+(m=='motor'?';this.MT=MT':''),ctx);
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
  ok(ev.every((e,i)=>i==0||e.t>=ev[i-1].t)&&ev[ev.length-1].t<=5400+900,'tempo crescente e dentro dos 90 minutos mais acréscimos');
  ok(ev.filter(e=>e.k=='fim_tempo').length==1,'um intervalo');
  ok(r1.g[0]+r1.g[1]==ev.filter(e=>e.k=='gol'&&!(e.d&&e.d.anulado)).length,'placar bate com os gols do registro');}
 /* auditoria: toda ação com a bola é feita por quem a tem; chute só de quem recebeu ou conquistou; gol só após chute; assistência só de passe */
 {let bad=[],n=0;
  for(let sd=1;sd<=(RAPIDO?3:10);sd++){const [A,B]=par(70,70,sd),r=MT.simula(A,B,sd+500),ev=r.log.ev;let hold=null,last=null;
   for(const e of ev){
    if(e.k=='inicio'||e.k=='fim_tempo'){hold=null;continue}
    if(e.k=='recuperou'){hold=[e.s,e.p];last=e;continue}
    if(e.k=='tiro_meta'){hold=[e.s,0];last=e;continue}
    if(e.k=='tiro_livre'||e.k=='escanteio'||e.k=='penalti'){hold=[e.s,e.p];last=e;continue}
    if(e.k=='lateral'){hold=[e.s,e.q];last=e;continue}
    if(e.k=='impedimento'||(e.k=='falta'&&!e.d.vantagem)){hold=null;last=e;continue}
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
  let gb=0,sb=0,gf=0,sf=0; /* sb/sf: xG somado — compara gols por xG, que isola o goleiro da seleção de chutes */
  for(let sd=1;sd<=(RAPIDO?10:40);sd++){const A=MT.timeTeste(70,'4-3-3','Casa',sd*2),r=MT.simula(A,gk(92)(MT.timeTeste(70,'4-3-3','Fora',sd*2+1)),sd),r2=MT.simula(A,gk(35)(MT.timeTeste(70,'4-3-3','Fora',sd*2+1)),sd);
    gb+=r.st[0].gols;sb+=r.st[0].xg;gf+=r2.st[0].gols;sf+=r2.st[0].xg}
  ok(gb/sb<gf/sf,'goleiro bom sofre menos gols por xG que o ruim ('+(100*gb/sb).toFixed(1)+'% x '+(100*gf/sf).toFixed(1)+'%)');
}
}

/* ===== módulo 3: chute e goleiro ===== */
{
 const C=MT.chute,at=(v)=>{const o={};MT.ATTR_KEYS.forEach(k=>o[k]=v);return o};
 const pen=(1-11/105),ctx0={u:.9,v:.5,tipo:'pe',origem:'passe',nDef:0,pres:0};
 /* xG do lance: geometria, tipo, origem, marcação */
 {const x=(o)=>C.xgModel({...ctx0,...o});
  ok(x({u:.97})>x({u:.93})&&x({u:.93})>x({u:.88})&&x({u:.88})>x({u:.8}),'xG cai com a distância');
  ok(x({v:.5})>x({v:.7})&&x({v:.7})>x({v:.9}),'xG cai com o ângulo (bola pela lateral)');
  ok(x({tipo:'cabeca'})<x({tipo:'pe'})*.7,'cabeçada vale menos que chute de pé');
  ok(x({origem:'filtrado'})>x({origem:'passe'})&&x({origem:'cruz'})<x({origem:'passe'}),'passe em profundidade aumenta, cruzamento diminui');
  ok(x({nDef:2})<x({nDef:0})&&x({pres:1})<x({pres:0}),'marcação e pressão reduzem o xG');
  const p=x({u:pen,v:.5,nDef:0}),p6=x({u:1-5.5/105,v:.5});ok(p>.06&&p<.4&&p6>.25&&p6<.78&&p6>2*p,'xG: pequena área alto, 11 m central moderado ('+p6.toFixed(2)+' / '+p.toFixed(2)+')');
  ok(x({u:.6,v:.5})<.06,'chute de longe vale pouco ('+x({u:.6,v:.5}).toFixed(3)+')');
  ok(x({u:.99,v:.5,origem:'filtrado'})<=.85,'xG nunca passa de 0,85');}
 /* habilidade do finalizador e pé fraco */
 {const bom=at(85),ruim=at(35);
  ok(C.habil(bom,'pe',false,60)>C.habil(ruim,'pe',false,60)+.4,'finalizador bom multiplica bem mais que o ruim');
  ok(C.habil(bom,'pe',true,40)<C.habil(bom,'pe',false,40),'pé fraco desconta');
  ok(C.habil(bom,'pe',true,80)>C.habil(bom,'pe',true,35),'pé fraco melhor desconta menos');
  const so=at(50);so.cab=95;so.imp=90;so.for=85;so.fin=30;ok(C.habil(so,'cabeca',false,55)>C.habil(so,'pe',false,55),'bom cabeceador rende mais na cabeçada que no pé');}
 /* goleiro: depende do tipo de lance */
 {const g=at(50);g.um1=95;g.sai=90;const g2=at(50);g2.aer=95;g2.sai=90;
  ok(C.qGoleiro(g,{tipo:'pe',origem:'filtrado',d:9})>C.qGoleiro(g,{tipo:'pe',origem:'passe',d:25}),'um contra um e saída pesam em lance de 1x1');
  ok(C.qGoleiro(g2,{tipo:'cabeca',origem:'cruz',d:8})>C.qGoleiro(g2,{tipo:'pe',origem:'passe',d:25}),'jogo aéreo pesa em cruzamento');
  ok(C.gkMult(1)<C.gkMult(0)&&C.gkMult(1)>=.85&&C.gkMult(0)<=1.3,'multiplicador do goleiro dentro de 0,86–1,28');}
 /* desfecho: a chance total de gol bate com a calculada, respeita goleiro e finalizador */
 {const f=(c,a,g,n,fraco)=>{const rs=MT.rng('res'+JSON.stringify(c)),cnt={gol:0,defesa:0,bloqueio:0,fora:0,trave:0,seg:0,reb:0};let pG=0;
    for(let i=0;i<n;i++){const R=C.resolve(c,a,g,rs,fraco,55);cnt[R.res]++;pG=R.pG;if(R.seg=='rebote')cnt.reb++;if(R.seg=='segurou')cnt.seg++}
    return{...cnt,pG,n}};
  const c={u:.9,v:.5,d:11,tipo:'pe',origem:'passe',nDef:1,pres:0},m=at(70),r=f(c,m,m,40000);
  perto(r.gol/r.n,r.pG,.012,'frequência de gols = chance calculada');
  ok(r.gol+r.defesa+r.bloqueio+r.fora+r.trave==r.n,'todo chute tem um desfecho');
  ok(r.bloqueio/r.n>.1&&r.bloqueio/r.n<.45,'bloqueios entre 10% e 45% ('+(100*r.bloqueio/r.n).toFixed(0)+'%)');
  ok(r.trave>0&&r.trave<r.fora*.12,'trave é parte pequena dos chutes para fora');
  ok(r.reb>0&&r.reb/(r.reb+r.seg)<.35,'rebote é minoria das defesas');
  const gB=f(c,m,at(92),20000),gR=f(c,m,at(35),20000);ok(gB.gol<gR.gol*.85,'goleiro bom sofre menos gols que o ruim ('+gB.gol+' x '+gR.gol+')');
  const fB=f(c,at(90),m,20000),fR=f(c,at(40),m,20000);ok(fB.gol>fR.gol*1.5,'finalizador bom faz bem mais gols que o ruim ('+fB.gol+' x '+fR.gol+')');
  const fw=f(c,m,m,20000,true);ok(fw.gol<r.gol*.5*0+f(c,m,m,20000,false).gol,'pé fraco converte menos');
  const a1=C.resolve(c,m,m,MT.rng(5),false,55),a2=C.resolve(c,m,m,MT.rng(5),false,55);ok(JSON.stringify(a1)==JSON.stringify(a2),'desfecho reproduzível com a mesma seed');
  const rs=MT.rng(9);let usados=0;for(let i=0;i<50;i++){const b=rs.calls;C.resolve(c,m,m,rs,false,55);usados+=(rs.calls-b>=3?1:0)}ok(usados==50,'sempre consome sorteios (não desalinha a seed)');}
 /* na partida: tipos, chances claras, pé, coerência do registro */
 {const sd=[],tipos={pe:0,primeira:0,cabeca:0};let ch=0,gr=0,grG=0,outros=0,outG=0,fr=0,comPe=0,xgS=0,gols=0;
  for(let i=1;i<=(process.env.RAPIDO?6:25);i++){const A=MT.timeTeste(72,'4-3-3','Casa',i*2),B=MT.timeTeste(68,'4-4-2','Fora',i*2+1),r=MT.simula(A,B,300+i),ev=r.log.ev;
   ev.forEach((e,k)=>{if(e.k!='chute')return;ch++;tipos[e.d.tipo]++;xgS+=e.d.xg;if(e.d.fraco)fr++;if(e.d.pe)comPe++;
     const golo=ev[k+1]&&ev[k+1].k=='gol'&&ev[k+1].p==e.p;if(golo)gols++;
     if(e.d.grande){gr++;if(golo)grG++}else{outros++;if(golo)outG++}});}
  ok(tipos.cabeca>0&&tipos.primeira>0&&tipos.pe>0,'os três tipos de chute aparecem');
  ok(tipos.cabeca/ch>.04&&tipos.cabeca/ch<.3,'cabeçadas entre 4% e 30% dos chutes ('+(100*tipos.cabeca/ch).toFixed(0)+'%)');
  ok(gr>0&&grG/gr>.25&&grG/gr>3*(outG/outros),'chances claras convertem bem mais ('+(100*grG/gr).toFixed(0)+'% x '+(100*outG/outros).toFixed(0)+'%)');
  ok(fr>0&&fr/ch<.2,'pé fraco é usado em minoria dos chutes ('+(100*fr/ch).toFixed(0)+'%)');
  ok(comPe==ch,'todo chute registra o pé usado');
  ok(Math.abs(gols-xgS)/xgS<.45,'gols próximos do xG somado ('+gols+' x '+xgS.toFixed(1)+')');}
}

/* ===== módulo 4: regras do jogo (IFAB) ===== */
{
 const R=MT.regras,at=(v)=>{const o={};MT.ATTR_KEYS.forEach(k=>o[k]=v);return o};
 /* Lei 11: impedimento */
 {const adv=[.97,.8,.7,.6,.5];   // goleiro e defensores, em coordenadas do atacante
  ok(!R.impedimento(.78,.5,adv).imp,'atrás do penúltimo defensor: em condição');
  ok(R.impedimento(.85,.5,adv).imp,'à frente do penúltimo defensor e da bola: impedido');
  ok(!R.impedimento(.85,.9,adv).imp,'à frente dos defensores mas atrás da bola: em condição');
  ok(!R.impedimento(.45,.2,[.97,.4,.3]).imp,'na própria metade nunca é impedimento');
  ok(!R.impedimento(.8,.5,adv).imp,'na mesma linha do penúltimo defensor: em condição');
  ok(R.impedimento(.9,.5,[.99,.6,.5]).imp&&!R.impedimento(.9,.5,[.99,.95,.5]).imp,'o goleiro conta como defensor, o penúltimo é quem vale');
  ok(R.dentroArea(1-10/105,.5)&&!R.dentroArea(1-20/105,.5)&&!R.dentroArea(1-10/105,.1)&&R.dentroArea(1-16/105,.5+19/68),'grande área: 16,5 m x 40,3 m');}
 /* faltas: quem é agressivo e marca mal comete mais */
 {const ag=at(50);ag.agr=90;ag.des=35;ag.mar=35;const ca=at(50);ca.agr=15;ca.des=85;ca.mar=85;const atk=at(60);
  ok(R.pFalta('tackle',ag,atk)>R.pFalta('tackle',ca,atk)*1.8,'agressivo e fraco no desarme comete bem mais faltas');
  ok(R.pFalta('tackle',ag,atk)>R.pFalta('recep',ag,atk)&&R.pFalta('tackle',ag,atk,.5)<R.pFalta('tackle',ag,atk),'desarme gera mais falta que recepção; rigor do árbitro escala');}
 /* cartões */
 {const rs=MT.rng('cartoes'),cont=(f,n)=>{const o={amarelo:0,vermelho:0,segundo:0,nada:0};for(let i=0;i<n;i++){const c=R.cartao(f,rs);if(!c.c)o.nada++;else{o[c.c]++;if(c.segundo)o.segundo++}}return o};
  const normal=cont({agr:50,amarelos:0},20000),viol=cont({agr:95,amarelos:0},20000),dg=cont({agr:50,amarelos:0,dogso:'fora'},20000),seg=cont({agr:70,amarelos:1,tatica:true},20000);
  ok(normal.amarelo/20000>.05&&normal.amarelo/20000<.25,'falta comum: amarelo em 5% a 25% ('+(100*normal.amarelo/20000).toFixed(1)+'%)');
  ok(normal.vermelho/20000<.01,'falta comum quase nunca é vermelho');
  ok(viol.amarelo>normal.amarelo,'jogador agressivo leva mais cartão');
  ok(dg.vermelho/20000>.1,'anular chance clara fora da área rende vermelho com frequência ('+(100*dg.vermelho/20000).toFixed(0)+'%)');
  ok(seg.segundo>0&&seg.amarelo==0,'quem já tem amarelo e é punido de novo leva vermelho (segundo amarelo)');
  const rs2=MT.rng(2);ok(R.cartao({agr:60,amarelos:0,dogso:'area'},rs2)!=null,'cartão na área é avaliado');}
 /* pênalti */
 {const rs=MT.rng('pen'),taxa=(c,g,n)=>{let k=0;for(let i=0;i<n;i++)if(R.penalti(c,g,rs).res=='gol')k++;return k/n},m=at(65);
  const tm=taxa(m,m,20000);ok(tm>.7&&tm<.85,'cobrança média converte 70% a 85% ('+(100*tm).toFixed(0)+'%)');
  ok(taxa(at(92),m,20000)>taxa(at(35),m,20000)+.1,'bom cobrador converte bem mais que o ruim');
  ok(taxa(m,at(92),20000)<taxa(m,at(35),20000)-.05,'bom goleiro defende mais pênaltis');
  const o={gol:0,defesa:0,fora:0,trave:0};for(let i=0;i<20000;i++)o[R.penalti(m,m,rs).res]++;ok(o.fora>0&&o.trave>0&&o.defesa>0,'pênalti pode ir fora, na trave ou ser defendido');}
 ok(R.acrescimo(10)==1&&R.acrescimo(180)==3&&R.acrescimo(9999)==8,'acréscimo: mínimo 1, arredonda minutos, máximo 8');

 /* na partida */
 const par=(fa,fb,seed)=>[MT.timeTeste(fa,'4-3-3','Casa',seed*2),MT.timeTeste(fb,'4-4-2','Fora',seed*2+1)];
 const NJ=process.env.RAPIDO?8:40,jogos=[];for(let i=1;i<=NJ;i++){const [A,B]=par(70,70,i);jogos.push(MT.simula(A,B,900+i))}
 const soma=(f)=>jogos.reduce((s,r)=>s+f(r),0)/jogos.length;
 const num=(k)=>soma(r=>r.log.count(k));
 {const faltas=num('falta')/2;ok(faltas>9&&faltas<18,'faltas por time entre 9 e 18 ('+faltas.toFixed(1)+')');
  const am=soma(r=>r.log.ev.filter(e=>e.k=='cartao'&&e.o=='amarelo').length),vm=soma(r=>r.log.ev.filter(e=>e.k=='cartao'&&e.o=='vermelho').length);
  ok(am>2&&am<6,'amarelos por jogo entre 2 e 6 ('+am.toFixed(2)+')');ok(vm<.9,'vermelhos por jogo abaixo de 0,9 ('+vm.toFixed(2)+')');
  const im=num('impedimento')/2;ok(im>1.5&&im<6,'impedimentos por time entre 1,5 e 6 ('+im.toFixed(1)+')');
  const es=num('escanteio')/2;ok(es>3&&es<8,'escanteios por time entre 3 e 8 ('+es.toFixed(1)+')');
  const la=num('lateral')/2;ok(la>10&&la<28,'laterais por time entre 10 e 28 ('+la.toFixed(1)+')');
  ok(num('tiro_meta')/2>3,'tiros de meta acontecem');ok(num('vantagem')>0,'a vantagem é aplicada em alguns lances');}
 /* encadeamento: toda falta/impedimento termina em reposição certa; vantagem que falha volta como falta */
 {let bad=[];
  for(const r of jogos){const ev=r.log.ev;
   ev.forEach((e,i)=>{
    if(e.k=='impedimento'){const nx=ev[i+1];if(!nx||nx.k!='tiro_livre'||nx.s==e.s||nx.d.origem!='impedimento')bad.push('impedimento sem tiro livre do adversário')}
    if(e.k=='penalti'){const nx=ev[i+1];if(!nx||nx.k!='chute'||nx.d.tipo!='penalti'||nx.p!=e.p)bad.push('pênalti sem chute do cobrador');if(Math.abs(Math.abs(e.x-.5)-(.5-11/105))>.01)bad.push('pênalti fora da marca')}
    if(e.k=='falta'&&!e.d.vantagem){let j=i+1;while(ev[j]&&['cartao','lesao','substituicao','var'].includes(ev[j].k))j++;const nx=ev[j];if(!(e.d.simulacao&&nx&&nx.k=='recuperou')&&(!nx||(nx.k!='tiro_livre'&&nx.k!='penalti')))bad.push('falta sem reposição ('+(nx&&nx.k)+')');
     if(nx&&nx.k=='tiro_livre'&&nx.s==e.s)bad.push('tiro livre dado ao time que cometeu a falta');if(nx&&nx.k=='penalti'&&!e.d.area)bad.push('pênalti fora da área')}
    if(e.k=='falta'&&e.d.area&&e.s!==undefined){const at_=e.x;if((e.s==0&&at_<.5)||(e.s==1&&at_>.5)){} }
    if(e.k=='cartao'&&e.o=='vermelho'&&e.d.segundo){const pr=ev[i-1];if(!pr||pr.k!='cartao'||pr.o!='amarelo'||pr.p!=e.p)bad.push('segundo amarelo sem amarelo antes')}
   });}
  ok(bad.length==0,'encadeamento das regras: '+bad.slice(0,3).join('; '));}
 /* expulso não joga mais; nenhum jogador leva 3 amarelos; faltas em área só pelo defensor da área */
 {let bad=[],vermelhos=0;const AGE=['passe','lancamento','cruzamento','conducao','drible','chute','desarme','intercepta','falta'];
  for(const r of jogos){const exp=new Set(),am={},J=MT.jogadores(r),K=e=>e.s+'|'+J.quem(e.s,e.p,e.t);   /* por jogador (a vaga é reaproveitada por quem entra) */
   r.log.ev.forEach(e=>{
    if(e.k=='cartao'){if(e.o=='amarelo'){am[K(e)]=(am[K(e)]||0)+1;if(am[K(e)]>2)bad.push('3 amarelos');}else{exp.add(K(e));vermelhos++}}
    else if(AGE.includes(e.k)&&e.p!=null&&exp.has(K(e))&&e.p>0)bad.push('expulso em campo: '+e.k);
   });}
  ok(bad.length==0,'cartões coerentes: '+bad.slice(0,3).join('; '));}
 /* acréscimos e tempo */
 {const r=jogos[0],ac=r.log.by('acrescimo'),ft=r.log.by('fim_tempo');
  ok(ac.length==2&&ac.every(e=>e.d.min>=1&&e.d.min<=8),'dois avisos de acréscimo entre 1 e 8 minutos');
  ok(r.log.ev[r.log.ev.length-1].t>=5400&&r.log.ev[r.log.ev.length-1].t<=5400+(ac[0].d.min+ac[1].d.min)*60+400,'a partida termina depois dos 90 min, dentro dos acréscimos');
  ok(ft.length==1&&ft[0].t>=2700&&ft[0].t<=2700+ac[0].d.min*60+400,'o intervalo vem depois do acréscimo do 1º tempo');
  ok(jogos.every(r=>!r.pen),'sem mata-mata, não há prorrogação nem pênaltis');}
 /* mata-mata: prorrogação e disputa de pênaltis */
 {let emp=0,prorr=0,pens=0,bad=[];
  for(let i=1;i<=(process.env.RAPIDO?30:90)&&pens<(process.env.RAPIDO?1:4);i++){const [A,B]=par(70,70,i+300),r=MT.simula(A,B,1200+i,{mataMata:true}),ev=r.log.ev;
   const p1=ev.filter(e=>e.k=='prorrogacao').length;
   const g90=ev.filter(e=>e.k=='gol'&&e.t<=ev.find(x=>x.k=='prorrogacao'||x.k=='fim').t).length;
   if(p1){prorr++;if(p1!=2)bad.push('prorrogação deve ter 2 períodos');}
   const pe=ev.filter(e=>e.k=='penaltis'&&e.o);
   if(r.pen){pens++;const [a,b]=r.pen.placar;
    if(a==b)bad.push('disputa terminou empatada');
    const ga=pe.filter(e=>e.s==0&&e.o=='gol').length,gb_=pe.filter(e=>e.s==1&&e.o=='gol').length;if(ga!=a||gb_!=b)bad.push('placar da disputa não bate com as cobranças');
    if(r.g[0]!=r.g[1])bad.push('disputa sem empate');
    const n0=pe.filter(e=>e.s==0).length,n1=pe.filter(e=>e.s==1).length;if(Math.abs(n0-n1)>1)bad.push('cobranças desiguais');
    if(r.pen.vencedor!=(a>b?0:1))bad.push('vencedor errado');
   }else if(r.g[0]==r.g[1])bad.push('empate sem desempate');
  }
  ok(prorr>0,'mata-mata empatado vai à prorrogação');ok(pens>0,'prorrogação empatada vai aos pênaltis');ok(bad.length==0,'mata-mata coerente: '+bad.slice(0,3).join('; '));}
 /* reprodutível */
 {const [A,B]=par(70,70,5),a=MT.simula(A,B,4242),b=MT.simula(A,B,4242);ok(a.log.digest()===b.log.digest()&&a.st[0].faltas==b.st[0].faltas,'regras reproduzíveis com a mesma seed');}
}

/* ===== módulo 5: tática e treinador ===== */
{
 const TA=MT.tatica,RAP=!!process.env.RAPIDO;
 /* estilos e treinadores */
 {const ks=Object.keys(TA.ESTILOS);
  ok(ks.length>=5&&ks.every(k=>{const e=TA.ESTILOS[k];return e.pres>.5&&e.pres<1.6&&e.linha>=-1&&e.linha<=1&&e.largura>.7&&e.largura<1.3&&e.ritmo>.8&&e.ritmo<1.2}),'estilos com parâmetros em faixas válidas');
  ok(TA.ESTILOS.retranca.linha<TA.ESTILOS.equilibrado.linha&&TA.ESTILOS.equilibrado.linha<TA.ESTILOS.pressao.linha&&TA.ESTILOS.retranca.pres<TA.ESTILOS.pressao.pres,'retranca é mais baixa e passiva que a pressão');
  const a=TA.treinador('Flamengo'),b=TA.treinador('Flamengo'),c=TA.treinador('Palmeiras');
  ok(JSON.stringify(a)==JSON.stringify(b)&&a.ofensivo!=c.ofensivo,'treinador reproduzível pelo nome e diferente entre times');}
 /* estilo inicial: forte joga por cima, fraco se fecha */
 {const tec={ofensivo:0},conta=(f,ad)=>{const rs=MT.rng('ei'+f+ad),o={};for(let i=0;i<3000;i++){const k=TA.estiloInicial(f,ad,tec,false,rs);o[k]=(o[k]||0)+1}return o};
  const forte=conta(85,65),fraco=conta(60,80),igual=conta(70,70);
  const agr=o=>((o.pressao||0)+(o.ofensivo||0))/3000,def=o=>(o.retranca||0)/3000;
  ok(agr(forte)>.6&&def(forte)<.02,'time muito mais forte joga por cima ('+(100*agr(forte)).toFixed(0)+'%)');
  ok(def(fraco)>.5&&agr(fraco)<.05,'time muito mais fraco se fecha ('+(100*def(fraco)).toFixed(0)+'%)');
  ok(igual.equilibrado>800,'times parecidos jogam equilibrados');
  const ofen=MT.rng('o'),a1=(()=>{let n=0;for(let i=0;i<3000;i++){const k=TA.estiloInicial(70,70,{ofensivo:.9},true,ofen);if(k=='pressao'||k=='ofensivo')n++}return n/3000})(),a2=(()=>{let n=0;const r2=MT.rng('o2');for(let i=0;i<3000;i++){const k=TA.estiloInicial(70,70,{ofensivo:-.9},true,r2);if(k=='pressao'||k=='ofensivo')n++}return n/3000})();
  ok(a1>a2+.3,'treinador ofensivo escolhe estilos mais ofensivos');}
 /* adaptação em jogo */
 {const tec={adapt:1},rs=MT.rng('ad');
  const A=(o)=>TA.adapta({min:75,saldo:0,homens:11,homensAdv:11,chave:'equilibrado',...o},tec,rs);
  const atras=A({saldo:-1}),frente=A({saldo:1,chave:'ofensivo'}),menos=A({homens:10}),mais=A({homensAdv:10});
  ok(atras&&['ofensivo','desespero'].includes(atras.chave),'perdendo no fim, ataca');
  ok(frente&&['retranca','equilibrado'].includes(frente.chave),'ganhando no fim, se protege');
  ok(menos===null||(menos.chave!='pressao'&&menos.chave!='ofensivo'&&menos.chave!='desespero'),'com um a menos não se expõe');
  ok(mais&&['pressao','desespero'].includes(mais.chave),'com um a mais empurra o adversário');
  ok(TA.adapta({min:20,saldo:0,homens:11,homensAdv:11,chave:'equilibrado'},tec,rs)===null,'cedo e empatado: mantém o plano');
  const sonolento={adapt:0},rs2=MT.rng('s');let n=0;for(let i=0;i<2000;i++)if(TA.adapta({min:75,saldo:-1,homens:11,homensAdv:11,chave:'equilibrado'},sonolento,rs2))n++;
  ok(n<1300,'treinador pouco adaptável reage menos ('+n+'/2000)');}
 /* substituições */
 {const xi=(over)=>['GK','CB','CB','FB','FB','DM','CM','CM','W','ST','W'].map((c,i)=>({cls:c,ovr:70,rt:0,am:false,exp:false,gk:i==0,...(over&&over[i]||{})})),
   banco=['GK','CB','DM','CM','W','ST','ST'].map(c=>({cls:c,ovr:66,gk:c=='GK'})),tec={subs:1};
  const rs=MT.rng('subs');let tot=0,jogou=0,erros=0;
  for(let i=0;i<400;i++){const l=TA.subs({min:75,saldo:-1,xi:xi(),banco,feitas:0,janelas:0,ht:false},tec,rs);tot+=l.length;if(l.length)jogou++;
   const ins=new Set(),outs=new Set();l.forEach(x=>{if(x.out==0||ins.has(x.in)||outs.has(x.out))erros++;ins.add(x.in);outs.add(x.out)})}
  ok(erros==0,'o goleiro não sai e ninguém entra ou sai duas vezes');ok(tot/400>1&&tot/400<5,'trocas por janela razoáveis ('+(tot/400).toFixed(2)+')');
  ok(TA.subs({min:80,saldo:0,xi:xi(),banco,feitas:5,janelas:2,ht:false},tec,rs).length==0,'depois de 5 trocas, nenhuma');
  ok(TA.subs({min:80,saldo:0,xi:xi(),banco,feitas:2,janelas:3,ht:false},tec,rs).length==0,'depois de 3 janelas, nenhuma (intervalo não conta)');
  ok(TA.subs({min:80,saldo:0,xi:xi(),banco:[],feitas:0,janelas:0,ht:false},tec,rs).length==0,'sem banco, sem troca');
  let atq=0,tt=0;const rs3=MT.rng('atq');for(let i=0;i<500;i++)TA.subs({min:78,saldo:-1,xi:xi(),banco,feitas:0,janelas:0,ht:false},tec,rs3).forEach(x=>{tt++;if(['ST','W'].includes(banco[x.in].cls))atq++});
  ok(atq/tt>.4,'perdendo, os que entram são atacantes ('+(100*atq/tt).toFixed(0)+'%)');
  const rs4=MT.rng('am');let amarelo=0,n2=0;for(let i=0;i<500;i++)TA.subs({min:70,saldo:0,xi:xi({5:{am:true,rt:-.5},6:{rt:.5},7:{rt:.4},8:{rt:.3},9:{rt:.3},10:{rt:.3},1:{rt:.4},2:{rt:.4},3:{rt:.3},4:{rt:.3}}),banco,feitas:0,janelas:0,ht:false},tec,rs4).slice(0,1).forEach(x=>{n2++;if(x.out==5)amarelo++});
  ok(n2>0&&amarelo/n2>.5,'quem tem amarelo e rende mal é o primeiro a sair');
  ok(xi({3:{exp:true}}).length==11&&TA.subs({min:80,saldo:-1,xi:xi({3:{exp:true}}),banco,feitas:0,janelas:0,ht:false},tec,MT.rng(1)).every(x=>x.out!=3),'expulso não é substituído');}

 /* times com banco e formação escolhida pela IA */
 {const A=MT.timeTeste(70,'4-3-3','Casa',11);ok(A.banco.length>=8&&A.banco.some(p=>p.cls=='GK'),'o time tem banco com goleiro reserva');
  const js=[];const mk=(c,n,o)=>{const pos={GK:'GOL',CB:'ZAG',FB:'ZAG',DM:'VOL',CM:'MEI',AM:'MEI',W:'PNT',ST:'ATA'}[c],fp={GK:'GK',CB:'CB',FB:'LB',DM:'CDM',CM:'CM',AM:'CAM',W:'LW',ST:'ST'}[c];js.push({n,pos,fp,ovr:o,age:26,nat:'Brasil'})};
  mk('GK','g',70);for(let i=0;i<4;i++)mk('CB','z'+i,70);for(let i=0;i<2;i++)mk('FB','l'+i,70);for(let i=0;i<3;i++)mk('CM','m'+i,70);mk('DM','v',70);mk('ST','s1',85);mk('ST','s2',84);mk('ST','s3',55);mk('W','w1',60);mk('W','w2',58);
  const t1=MT.timeIA(js,'Time Dois Atacantes');ok(t1.form=='4-4-2'||t1.form=='4-2-3-1'||t1.form=='4-3-3','a IA escolhe uma formação válida');
  const duas=js.filter(p=>p.n=='s1'||p.n=='s2').map(p=>p.n);
  ok(duas.every(n=>t1.xi.some(p=>p.n==n)),'dois centroavantes de ponta entram no onze');
  const t2=MT.timeIA(js,'Time Dois Atacantes'),t3=MT.timeIA(js,'Time Dois Atacantes');ok(t2.form==t3.form,'escolha de formação reproduzível');}

 /* na partida */
 const par=(fa,fb,seed)=>[MT.timeTeste(fa,'4-3-3','Casa'+seed,seed*2),MT.timeTeste(fb,'4-3-3','Fora'+seed,seed*2+1)];
 {let bad=[],tot=[0,0],n=0,tats=0,sai=0;const N=RAP?6:30;
  for(let i=1;i<=N;i++){const [A,B]=par(70,70,i),r=MT.simula(A,B,2000+i),ev=r.log.ev;n++;
   [0,1].forEach(s=>{const sb=ev.filter(e=>e.k=='substituicao'&&e.s==s);tot[s]+=sb.length;if(sb.length>5)bad.push('mais de 5 trocas');
     const ts=new Set(sb.filter(e=>e.t>ev.find(x=>x.k=='fim_tempo').t+1&&e.d.motivo!='lesão').map(e=>Math.round(e.t/60)));if(ts.size>3)bad.push('mais de 3 janelas: '+[...ts]);
     sb.forEach(e=>{if(e.d.sai===e.d.entra)bad.push('troca do mesmo jogador');if(e.p==0)bad.push('goleiro trocado')});
     const finais=new Set(r.T[s].xi.map(p=>p.n));sb.forEach(e=>{if(!finais.has(e.d.entra)&&!sb.some(x=>x.d.sai===e.d.entra))bad.push('quem entrou não está em campo no fim')});
     const nomes=r.T[s].xi.map(p=>p.n);if(new Set(nomes).size!=11)bad.push('jogador repetido em campo')});
   tats+=ev.filter(e=>e.k=='tatica'&&e.t==0).length;
   if(ev.some(e=>e.k=='substituicao'&&e.t>5400+800))bad.push('troca depois do fim');
  }
  ok(bad.length==0,'substituições coerentes: '+bad.slice(0,3).join('; '));
  const m=(tot[0]+tot[1])/2/n;ok(m>3.3&&m<=5,'trocas por time ('+m.toFixed(2)+')');ok(tats==2*n,'tática de cada time registrada no apito inicial');}
 /* adaptação no jogo: quem perde ataca, quem ganha se fecha */
 {let ruim=[],cnt={atras:0,frente:0};const N=RAP?10:40;
  for(let i=1;i<=N;i++){const [A,B]=par(70,70,i+50),r=MT.simula(A,B,3000+i);
   r.log.ev.filter(e=>e.k=='tatica'&&e.d.minuto>0).forEach(e=>{
    if(e.d.motivo=='atrás no placar'){cnt.atras++;if(!['ofensivo','desespero'].includes(e.d.estilo))ruim.push(e.d.estilo+' atrás')}
    if(e.d.motivo=='protegendo a vantagem'){cnt.frente++;if(!['equilibrado','retranca'].includes(e.d.estilo))ruim.push(e.d.estilo+' na frente')}
    if(e.d.motivo=='com um a menos'&&['ofensivo','pressao','desespero'].includes(e.d.estilo))ruim.push('exposto com 10')})}
  ok(cnt.atras>0&&cnt.frente>0,'o treinador muda de plano durante o jogo ('+cnt.atras+' ataques, '+cnt.frente+' retrancas)');ok(ruim.length==0,'mudanças de estilo coerentes: '+ruim.slice(0,3).join('; '));}
 /* os estilos mudam o jogo (sem adaptação, mesmos confrontos) */
 {const N=RAP?8:60,roda=(es)=>{const a={ch:0,chS:0,falt:0,perdS:0};for(let i=1;i<=N;i++){const [A,B]=par(70,70,i+90),r=MT.simula(A,B,4000+i,{fixo:true,estilo:[es,'equilibrado']});
    a.ch+=r.st[0].chutes/N;a.chS+=r.st[1].chutes/N;a.falt+=r.st[0].faltas/N;a.perdS+=r.st[1].perdas/N}return a};
  const eq=roda('equilibrado'),pr=roda('pressao'),of=roda('ofensivo');
  ok(pr.falt>eq.falt*1.25,'pressão alta custa faltas ('+eq.falt.toFixed(1)+' -> '+pr.falt.toFixed(1)+')');
  ok(pr.perdS>eq.perdS,'pressão alta força mais perdas de bola do adversário ('+eq.perdS.toFixed(1)+' -> '+pr.perdS.toFixed(1)+')');
  ok(of.ch>eq.ch*1.03,'estilo ofensivo chuta mais ('+eq.ch.toFixed(1)+' -> '+of.ch.toFixed(1)+')');
  const mesmo=MT.simula(...par(70,70,7),5555,{fixo:true,estilo:['pressao','retranca']}),mesmo2=MT.simula(...par(70,70,7),5555,{fixo:true,estilo:['pressao','retranca']});
  ok(mesmo.log.digest()===mesmo2.log.digest(),'partida com táticas fixas é reproduzível');}
}

/* ===== módulo 6: condições (cansaço, lesões, moral, mando) ===== */
{
 const C=MT.cond,CD=MT.CONDICAO,RAP=!!process.env.RAPIDO,at=(v)=>{const o={};MT.ATTR_KEYS.forEach(k=>o[k]=v);return o};
 /* gasto de energia */
 {const eq={pres:1,ritmo:1},a65=at(65),b=C.gasto(a65,'CM',eq);
  perto(b*5400,50,14,'meio-campista médio perde uns 50 pontos em 90 min sem trocas');
  ok(C.gasto(at(90),'CM',eq)<C.gasto(at(40),'CM',eq)*.75,'quem tem resistência e condição gasta bem menos');
  ok(C.gasto(a65,'GK',eq)<C.gasto(a65,'CM',eq)*.4&&C.gasto(a65,'FB',eq)>C.gasto(a65,'CB',eq),'goleiro quase não gasta, lateral gasta mais que zagueiro');
  ok(C.gasto(a65,'CM',MT.tatica.ESTILOS.pressao)>C.gasto(a65,'CM',eq)*1.1&&C.gasto(a65,'CM',MT.tatica.ESTILOS.retranca)<C.gasto(a65,'CM',eq),'pressão cansa mais, retranca menos');}
 /* efeito do cansaço */
 {const f100=C.fatores(100),f80=C.fatores(80),f40=C.fatores(40),f0=C.fatores(0);
  ok(f100.fis==1&&f80.fis==1,'descansado (≥80) não perde nada');
  ok(f40.fis<f80.fis&&f0.fis<f40.fis,'quanto mais cansado, pior');
  ok(f0.fis<f0.tec&&f0.tec<f0.men&&f0.fis>.4,'o físico cai mais que a técnica e que a cabeça, sem zerar');
  const a0=at(70),a={};C.aplica(a0,a,{en:30,moral:0,casa:false,lesao:null});
  ok(a.vel<a0.vel*.85&&a.res==a0.res&&a.cnd==a0.cnd&&a.pas<a0.pas&&a.pas>a.vel,'cansado: velocidade cai muito, passe menos, resistência fica');
  const z={},b={};C.aplica(a0,z,{en:100,moral:1,casa:false});C.aplica(a0,b,{en:100,moral:-1,casa:false});
  ok(z.dec>b.dec&&z.pas>b.pas&&z.vel==b.vel,'moral alta melhora técnica e cabeça, não o físico');
  const h={},v={};C.aplica(a0,h,{en:100,moral:0,casa:true});C.aplica(a0,v,{en:100,moral:0,casa:false});
  ok(h.pas>v.pas&&h.pas/v.pas<1.05,'mando de campo dá um empurrão pequeno');
  const l={};C.aplica(a0,l,{en:100,moral:0,casa:false,lesao:'media'});ok(l.vel<a0.vel*.65&&l.pas<a0.pas,'machucado rende menos');}
 /* lesão */
 {ok(C.risco({age:35,en:100})>C.risco({age:25,en:100})*1.2,'veterano se machuca mais');ok(C.risco({age:25,en:20})>C.risco({age:25,en:100})*1.5,'cansado se machuca mais');
  const rs=MT.rng('grav'),c={leve:0,media:0,grave:0};for(let i=0;i<5000;i++)c[C.gravidade(rs)]++;ok(c.leve>c.media&&c.media>c.grave&&c.grave>300,'gravidade: leves mais comuns, graves raras');
  ok(Math.abs(C.moralMult(1)-1.04)<1e-9&&C.moralMult(-5)==C.moralMult(-1),'moral limitada entre -1 e 1');}
 /* na partida */
 const par=(fa,fb,seed)=>[MT.timeTeste(fa,'4-3-3','Casa'+seed,seed*2),MT.timeTeste(fb,'4-3-3','Fora'+seed,seed*2+1)];
 const NJ=RAP?10:50,jg=[];for(let i=1;i<=NJ;i++){const [A,B]=par(70,70,i+700);jg.push(MT.simula(A,B,6000+i))}
 {const [A,B]=par(70,70,1),vel=A.xi[5].a.vel,r0=MT.simula(A,B,1);ok(A.xi[5].a.vel===vel&&A.xi[5].a0===undefined,'a partida não altera os jogadores de quem chamou');}
 {let enF=[],queda=[],bad=[];
  for(const r of jg)[0,1].forEach(s=>{const sb=new Set(r.log.ev.filter(e=>e.k=='substituicao'&&e.s==s).map(e=>e.p));
    r.T[s].xi.forEach((p,i)=>{if(i==0||sb.has(i)||r.log.ev.some(e=>e.k=='cartao'&&e.o=='vermelho'&&e.s==s&&e.p==i))return;enF.push(r.en[s][i]);if(p.a0.vel>20)queda.push(p.a.vel/p.a0.vel);if(r.en[s][i]<0||r.en[s][i]>100)bad.push('energia fora de 0-100')})});
  const med=enF.reduce((a,b)=>a+b,0)/enF.length,mq=queda.reduce((a,b)=>a+b,0)/queda.length;
  ok(med>35&&med<70,'titulares que jogam tudo chegam ao fim com energia média de 35 a 70 ('+med.toFixed(0)+')');
  ok(mq<.97&&mq>.7,'velocidade média no fim cai de 3% a 30% ('+(100*(1-mq)).toFixed(0)+'%)');ok(bad.length==0,'energia sempre entre 0 e 100');}
 {const fit=(v,sd)=>{const t=MT.timeTeste(70,'4-3-3','F'+sd,sd);t.xi.forEach(p=>{if(p.slotCls!='GK'){p.a.res=v;p.a.cnd=v}});return t};
  let a=0,b=0,n=RAP?4:12;for(let i=1;i<=n;i++){const r=MT.simula(fit(90,i),fit(40,i+100),7000+i,{neutro:true});a+=r.en[0].slice(1).reduce((x,y)=>x+y,0);b+=r.en[1].slice(1).reduce((x,y)=>x+y,0)}
  ok(a>b*1.1,'time com mais resistência termina mais inteiro ('+(a/n/10).toFixed(0)+' x '+(b/n/10).toFixed(0)+')');
  const r1={pr:0,re:0};for(let i=1;i<=n;i++){const [A,B]=par(70,70,i+30),x=MT.simula(A,B,7100+i,{fixo:true,estilo:['pressao','equilibrado']}),y=MT.simula(A,B,7100+i,{fixo:true,estilo:['retranca','equilibrado']});
   r1.pr+=x.en[0].slice(1).reduce((p,q)=>p+q,0);r1.re+=y.en[0].slice(1).reduce((p,q)=>p+q,0)}
  ok(r1.pr<r1.re,'pressionar o jogo todo cansa mais que se fechar');}
 {let les=0,sem=0,subs=0,bad=[];
  for(const r of jg){const ev=r.log.ev;ev.forEach((e,i)=>{if(e.k!='lesao')return;les++;
    if(!['leve','media','grave'].includes(e.d.gravidade)||!['contato','sem contato'].includes(e.d.tipo))bad.push('lesão mal formada');
    if(e.d.gravidade!='leve'&&!e.d.semTroca){const nx=ev.slice(i+1,i+4).find(x=>x.k=='substituicao'&&x.s==e.s&&x.p==e.p);if(!nx||nx.d.motivo!='lesão')bad.push('lesão sem troca');else subs++}
    if(e.d.gravidade=='grave'&&e.d.semTroca&&e.p>0){sem++;if(ev.slice(i+2).some(x=>x.s==e.s&&x.p==e.p&&['passe','chute','drible','desarme'].includes(x.k)))bad.push('lesionado grave segue jogando')}
    if(e.d.gravidade=='leve'&&ev.slice(i+1,i+4).some(x=>x.k=='substituicao'&&x.p==e.p&&x.s==e.s&&x.d.motivo=='lesão'))bad.push('lesão leve com troca forçada')})}
  const m=les/NJ/2;ok(m>.05&&m<.6,'lesões por time e jogo entre 0,05 e 0,6 ('+m.toFixed(2)+')');ok(bad.length==0,'lesões coerentes: '+bad.slice(0,3).join('; '));
  ok(jg.every(r=>r.subs[0]<=5&&r.subs[1]<=5),'trocas por lesão continuam dentro do limite de 5');}
 {let ok_=0,tot=0;for(const r of jg){const d=r.g[0]-r.g[1];if(Math.abs(d)>=2){tot++;if((d>0)==(r.moral[0]>r.moral[1]))ok_++}}
  ok(tot>2&&ok_/tot>=.85,'moral final acompanha o placar ('+ok_+'/'+tot+')');ok(jg.every(r=>r.moral.every(m=>Math.abs(m)<=1.0001)),'moral limitada a [-1,1]');}
 {const N=RAP?30:90,gd=(opt)=>{let d=0;for(let i=1;i<=N;i++){const [A,B]=par(70,70,i+300),r=MT.simula(A,B,8000+i,opt);d+=r.g[0]-r.g[1]}return d/N};
  const casa=gd({}),neu=gd({neutro:true});ok(casa>neu+.05,'jogar em casa vale gols ('+casa.toFixed(2)+' em casa x '+neu.toFixed(2)+' em campo neutro)');
  const nf=(opt)=>{let f=0;for(let i=1;i<=(RAP?10:30);i++){const [A,B]=par(70,70,i+400),r=MT.simula(A,B,8500+i,opt);f+=r.st[0].faltas-r.st[1].faltas}return f};
  ok(nf({})<nf({neutro:true})+8,'mandante não sofre mais faltas que o visitante por causa do mando');}
 {const [A,B]=par(70,70,9),x=MT.simula(A,B,9999),y=MT.simula(A,B,9999);ok(x.log.digest()===y.log.digest()&&JSON.stringify(x.en)===JSON.stringify(y.en),'condições reproduzíveis com a mesma seed');}
}

/* ===== módulo 7: arbitragem e VAR ===== */
{
 const RAP=!!process.env.RAPIDO,V=MT.VAR;
 {const a=MT.arbitro('Fulano'),b=MT.arbitro('Fulano'),c=MT.arbitro('Beltrano');
  ok(JSON.stringify(a)==JSON.stringify(b)&&a.rig!=c.rig,'árbitro reproduzível pelo nome e diferente entre nomes');
  let ok1=true,rg=[];for(let i=0;i<300;i++){const x=MT.arbitro('a'+i);rg.push(x.rig);if(x.rig<.8||x.rig>1.25||x.erro<.02||x.erro>.07||x.vant<.7||x.vant>1.3)ok1=false}
  ok(ok1&&Math.max(...rg)-Math.min(...rg)>.3,'perfis dentro das faixas e com variedade');
  ok(V.det>.7&&V.det<1&&V.tempo.min>=30&&V.tempo.max>V.tempo.min,'VAR corrige erro claro na maior parte das vezes e gasta tempo');}
 const par=(seed)=>[MT.timeTeste(70,'4-3-3','Casa'+seed,seed*2),MT.timeTeste(70,'4-3-3','Fora'+seed,seed*2+1)];
 const NJ=RAP?20:80,jg=[];for(let i=1;i<=NJ;i++){const [A,B]=par(i+1200);jg.push(MT.simula(A,B,11000+i))}
 {let n=0,bad=[];const cont={};
  for(const r of jg){const ev=r.log.ev;
   ev.forEach((e,i)=>{if(e.k!='var')return;n++;const k=e.d.tipo+':'+e.d.resultado;cont[k]=(cont[k]||0)+1;
    if(!['gol','penalti','vermelho'].includes(e.d.tipo))bad.push('tipo de revisão inválido');
    const ant=ev[i-1],prox=ev[i+1];
    if(k=='gol:anulado'){if(!ant||ant.k!='gol'||!ant.d||!ant.d.anulado)bad.push('gol anulado sem marca no gol');if(!prox||prox.k!='tiro_livre'||prox.s==e.s)bad.push('gol anulado sem tiro livre do adversário')}
    if(k=='penalti:concedido'){if(!prox||prox.k!='penalti'||prox.s!=e.s)bad.push('pênalti concedido sem cobrança')}
    if(k=='penalti:anulado'){const c=ev[i+1];if(!c||c.k!='cartao'||c.o!='amarelo'||c.s!=e.s)bad.push('simulação sem amarelo para o simulador');if(!ant||ant.k!='falta'||!ant.d.simulacao)bad.push('pênalti anulado sem falta de simulação antes')}
    if(k=='vermelho:revertido'){const c=ev[i+1];if(!c||c.k!='cartao'||c.o!='amarelo'||c.p!=e.p)bad.push('vermelho revertido sem amarelo');
      if(ev.slice(i).some(x=>x.k=='cartao'&&x.o=='vermelho'&&x.s==e.s&&x.p==e.p&&x.t-e.t<1))bad.push('vermelho revertido ainda aplicado')}
    if(k=='vermelho:concedido'){const c=ev.slice(i+1,i+4).find(x=>x.k=='cartao'&&x.o=='vermelho'&&x.s==e.s&&x.p==e.p);if(!c)bad.push('vermelho concedido sem cartão')}
    if(i+1<ev.length&&ev[i+1].t-e.t>200)bad.push('revisão sem passagem de tempo coerente')});
   ev.filter(e=>e.k=='gol'&&e.d&&e.d.anulado).forEach(g=>{const nx=ev[g.i+1];if(nx&&nx.k=='assistencia')bad.push('assistência em gol anulado')});
   const validos=ev.filter(e=>e.k=='gol'&&!(e.d&&e.d.anulado)).length;if(validos!=r.g[0]+r.g[1])bad.push('placar não bate com gols válidos');
   const tem=r.log.ev.some(e=>e.k=='var');if(tem)ok(r.log.ev.filter(e=>e.k=='var').every(e=>e.t>0),'var com tempo');}
  const m=n/NJ;ok(m>.03&&m<.8,'intervenções do VAR por jogo entre 0,03 e 0,8 ('+m.toFixed(2)+')');
  ok(bad.length==0,'revisões coerentes: '+bad.slice(0,3).join('; ')+' '+JSON.stringify(cont));}
 /* árbitro rigoroso x brando: mais faltas e cartões */
 {let rig=null,bran=null;for(let i=0;i<200;i++){const x=MT.arbitro('r'+i);if(!rig||x.rig>rig.rig)rig=x;if(!bran||x.rig<bran.rig)bran=x}
  const roda=(nome)=>{let f=0,c=0,n=RAP?10:30;for(let i=1;i<=n;i++){const [A,B]=par(i+1400),r=MT.simula(A,B,12000+i,{arbitro:nome});f+=r.log.count('falta');c+=r.log.count('cartao')}return{f:f/n,c:c/n}};
  const a=roda(rig.nome),b=roda(bran.nome);
  ok(a.f>b.f*1.1&&a.c>b.c*1.1,'árbitro rigoroso marca mais faltas e cartões ('+a.f.toFixed(1)+'/'+a.c.toFixed(1)+' x '+b.f.toFixed(1)+'/'+b.c.toFixed(1)+')');}
 {const [A,B]=par(77),x=MT.simula(A,B,13000,{arbitro:'X'}),y=MT.simula(A,B,13000,{arbitro:'X'}),z=MT.simula(A,B,13000,{arbitro:'Z'});
  ok(x.log.digest()===y.log.digest()&&x.arb.nome=='X','VAR e árbitro reproduzíveis com a mesma seed');ok(x.log.digest()!==z.log.digest(),'outro árbitro, outra partida');}
}

/* ===== módulo 8: estatísticas e narração (lidas do registro) ===== */
{
 const RAP=!!process.env.RAPIDO,NJ=RAP?8:40,jg=[];
 for(let i=1;i<=NJ;i++){const A=MT.timeTeste(72,'4-3-3','Azul'+i,i*2+1500),B=MT.timeTeste(68,'4-4-2','Rubro'+i,i*2+1501);jg.push(MT.simula(A,B,14000+i,i%7==0?{mataMata:true}:{}))}
 /* o placar de minutos */
 {const r=jg[0],M=MT.minutos(r);
  ok(M.fmt(0)=="1'"&&M.fmt(59)=="1'"&&M.fmt(60)=="2'"&&M.fmt(2699)=="45'"&&/^45\+\d+'$/.test(M.fmt(r.log.by('fim_tempo')[0].t-1)),'minutagem do 1º tempo e acréscimos');
  const t1=r.log.by('fim_tempo')[0].t;ok(M.fmt(t1)=="46'"&&/^90\+\d+'$/.test(M.fmt(r.log.ev[r.log.ev.length-1].t-1)),'minutagem do 2º tempo e acréscimos');}
 /* estatística por time lida do registro bate com o que o motor contou */
 {let bad=[],dpos=0;
  for(const r of jg){const X=MT.estat(r);
   for(const s of [0,1]){const a=X[s],b=r.st[s];
    for(const [k,kb] of [['gols','gols'],['chutes','chutes'],['alvo','alvo'],['faltas','faltas'],['amarelos','amarelos'],['vermelhos','vermelhos'],['imped','imped'],['escanteios','escanteios'],['laterais','laterais'],['penaltis','penaltis'],['defesas','defesas'],['bloq','bloq'],['inter','inter'],['pas','pas'],['pasOk','pasOk']])
     if(a[k]!==b[kb])bad.push(k+': registro '+a[k]+' x motor '+b[kb]);
    if(Math.abs(a.xg-b.xg)>.02)bad.push('xg');if(a.gols!==r.g[s])bad.push('gols x placar');}
   dpos=Math.max(dpos,Math.abs(X[0].posseP-100*r.st[0].posse/(r.st[0].posse+r.st[1].posse)));
   if(Math.abs(X[0].posseP+X[1].posseP-100)>1e-6)bad.push('posse não soma 100');}
  ok(bad.length==0,'estatísticas do registro = contadores do motor: '+[...new Set(bad)].slice(0,4).join('; '));ok(dpos<5,'posse lida do registro difere menos de 5 pontos da contada ('+dpos.toFixed(1)+')');}
 /* por jogador */
 {let bad=[],mv=0,tot=0,vit=0,vn=0;
  for(const r of jg){const E=MT.estatJog(r),X=MT.estat(r),fim=r.log.ev[r.log.ev.length-1].t/60;
   for(const s of [0,1]){const js=E.lista.filter(j=>j.s==s),som=k=>js.reduce((a,j)=>a+j[k],0);
    if(som('gols')!==X[s].gols)bad.push('gols por jogador');if(som('chutes')!==X[s].chutes)bad.push('chutes por jogador');
    if(som('assist')>X[s].gols)bad.push('mais assistências que gols');
    if(Math.abs(som('xg')-X[s].xg)>.02)bad.push('xG por jogador');
    const exp=r.log.ev.filter(e=>e.k=='cartao'&&e.o=='vermelho'&&e.s==s).length,mt=som('min');
    if(Math.abs(mt-(11*fim-exp*0))>11*fim*.2&&exp==0)bad.push('minutos somados '+mt.toFixed(0)+' x '+(11*fim).toFixed(0));
    if(exp==0&&r.log.count('lesao')==0&&Math.abs(mt-11*fim)>.5)bad.push('minutos não fecham: '+mt.toFixed(1)+' x '+(11*fim).toFixed(1));}
   E.lista.forEach(j=>{if(!(j.nota>=3&&j.nota<=10))bad.push('nota fora de 3-10');if(j.min<0)bad.push('minutos negativos')});
   const m=E.melhor;tot++;if(m.s==(r.g[0]>r.g[1]?0:1)&&r.g[0]!=r.g[1])vit++;if(r.g[0]!=r.g[1])vn++;mv+=m.nota}
  ok(bad.length==0,'estatísticas por jogador fecham com o time: '+[...new Set(bad)].slice(0,3).join('; '));
  ok(vn>3&&vit/vn>.55,'o melhor em campo costuma ser do time vencedor ('+vit+'/'+vn+')');}
 {const r=jg.find(x=>x.g[0]+x.g[1]>=3)||jg[0],E=MT.estatJog(r),art=E.lista.filter(j=>j.gols>0).sort((a,b)=>b.gols-a.gols)[0];
  if(art){const media=E.lista.reduce((a,j)=>a+j.nota,0)/E.lista.length;ok(art.nota>media,'quem faz gol tem nota acima da média');}
  const subs=E.lista.filter(j=>j.min<89);ok(r.log.count('substituicao')==0||subs.length>0,'jogadores que entram/saem têm minutos parciais');
  const gk=E.lista.find(j=>j.cls=='GK'&&j.s==0);ok(gk&&gk.nota>=3,'goleiro tem nota');}
 /* mapa de calor */
 {const r=jg[1],E=MT.estatJog(r),j=E.lista.filter(x=>x.s==0).sort((a,b)=>b.pas-a.pas)[0],h=MT.calor(r,0,j.nome);
  const soma=h.grade.reduce((a,l)=>a+l.reduce((x,y)=>x+y,0),0);ok(h.grade.length==8&&h.grade[0].length==12&&soma==h.n&&h.n>5,'mapa de calor 12x8 soma as ações do jogador ('+h.n+')');
  const zag=E.lista.filter(x=>x.s==0&&x.cls=='CB')[0],ata=E.lista.filter(x=>x.s==0&&x.cls=='ST')[0];
  const cx=(g)=>{let a=0,n=0;g.grade.forEach(l=>l.forEach((v,u)=>{a+=u*v;n+=v}));return n?a/n:0};
  ok(cx(MT.calor(r,0,ata.nome))>cx(MT.calor(r,0,zag.nome)),'o atacante atua mais à frente que o zagueiro no mapa');}
 /* narração */
 {let bad=[],gols=0,golsTxt=0,varN=0,varTxt=0,cart=0,cartTxt=0,subs=0,subsTxt=0;const modelos=new Set();
  for(const r of jg){const N=MT.narra(r),ev=r.log.ev,E=MT.estat(r);
   const txt=N.map(x=>x.txt).join('\n');
   if(/undefined|NaN|\[object|null/.test(txt))bad.push('texto com lixo');
   if(N.some((x,i)=>i&&x.t<N[i-1].t))bad.push('narração fora de ordem');
   if(!/Rola a bola|Começa o jogo|Apita/.test(N[0].txt)||!/^Fim de jogo/.test(N[N.length-1].txt))bad.push('abertura ou fecho');
   const gv=ev.filter(e=>e.k=='gol'&&!(e.d&&e.d.anulado));gols+=gv.length;
   const gl=N.filter(x=>x.k=='gol'&&!/será revisado/.test(x.txt));golsTxt+=gl.length;
   gl.forEach((x,i)=>{const gE=gv[i];const j=MT.jogadores(r),nome=j.quem(gE.s,gE.p,gE.t);if(!x.txt.includes(nome))bad.push('gol sem o nome do autor');
     const m=x.txt.match(/(\d+) a (\d+) /);if(!m)bad.push('gol sem placar');else{const g0=gv.slice(0,i+1).filter(e=>e.s==0).length,g1=i+1-g0;if(+m[1]!=g0||+m[2]!=g1)bad.push('placar errado na narração do gol');}
     modelos.add(x.txt.replace(/[A-ZÁÉÍÓÚ][^ ,.!]*( \S+)?/g,'N').slice(0,18));});
   const vv=ev.filter(e=>e.k=='var').length;varN+=vv;varTxt+=N.filter(x=>x.k=='var').length;
   cart+=ev.filter(e=>e.k=='cartao').length;cartTxt+=N.filter(x=>x.k=='cartao').length;
   subs+=ev.filter(e=>e.k=='substituicao').length;subsTxt+=N.filter(x=>x.k=='substituicao').length;
   N.filter(x=>x.k=='gol'||x.k=='cartao').forEach(x=>{if(!/^\d+(\+\d+)?'$/.test(x.min))bad.push('minuto mal formatado: '+x.min)});
   const fimTxt=N[N.length-1].txt,mm=fimTxt.match(/(\d+) a (\d+)/);if(!mm||+mm[1]!=r.g[0]||+mm[2]!=r.g[1])bad.push('placar final da narração');
   const r2=MT.narra(r);if(JSON.stringify(r2)!=JSON.stringify(N))bad.push('narração não reproduzível');}
  ok(bad.length==0,'narração coerente: '+[...new Set(bad)].slice(0,3).join('; '));
  ok(gols==golsTxt,'todo gol válido é narrado ('+golsTxt+'/'+gols+')');ok(cart==cartTxt&&subs==subsTxt&&varN==varTxt,'cartões, trocas e revisões do VAR são narrados');
  ok(modelos.size>=3,'a narração varia as frases ('+modelos.size+' modelos)');}
 {const r=jg.find(x=>x.pen)||null;if(r){const N=MT.narra(r);ok(N.some(x=>x.k=='penaltis')&&/pênaltis/.test(N[N.length-1].txt),'disputa de pênaltis narrada e no resultado final')}else ok(true,'(sem disputa na amostra)');}
}

console.log(falhas?`${falhas} FALHA(S) de ${total}`:`motor: ${total} verificações, todas passaram`);
process.exitCode=falhas?1:0;
