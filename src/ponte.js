'use strict';
/* ============================================================
   PONTE: liga o motor de partidas novo (src/motor.js ... narra.js) ao jogo.
   Usado só nas partidas do clube do usuário. O motor leve antigo segue nas demais.
   pmMotor() devolve o resultado no MESMO formato do pm() antigo (g, sc, ev, st, pr, xi, po, sh...),
   para o jogo ao vivo, as abas e a carreira continuarem funcionando sem mudança.
   ============================================================ */
const MOTOR_ON=true;
const POS_ANTIGA={GK:'GOL',CB:'ZAG',FB:'ZAG',DM:'VOL',CM:'MEI',AM:'MEI',W:'PNT',ST:'ATA'};

/* elenco do clube no formato do motor: força escalada para bater com a força do clube no jogo */
function motorElenco(cid,lu){
  if(cid>=WCB)return wcElenco(cid,lu);
  const c=S.cs[cid],sq=squadOf(cid).filter(x=>!x.me),top=sq.slice().sort((a,b)=>b.ovr-a.ovr).slice(0,14),med=top.reduce((s,x)=>s+x.ovr,0)/Math.max(1,top.length),d=FK_EF(c.s)-med;
  const js=sq.map(x=>({n:x.n,pos:x.pos,fp:x.fp,ovr:Math.round(C(x.ovr+d,30,97)),age:x.age||26,nat:x.nat||'',rv:x.rv?1:0}));
  if(cid==S.club&&lu){
    const f=MT.atribUser(S.at,{n:S.p.name,pos:S.p.pos,ovr:O(),age:S.p.age,nat:S.p.nat});
    js.push({n:S.p.name,pos:S.p.pos,ovr:O(),age:S.p.age,nat:S.p.nat,a:f.a,foot:f.foot,pf:f.pf,cls:f.cls,me:1,forcado:!!lu.s,soBanco:!lu.s});
  }
  return js;
}

/* monta os dois times e as opções do motor para uma partida do clube do usuário */
function montaMotor(x){
  const{h,a,my,lu,knock,ag}=x,me=ME(),ids=[h,a];
  const js=ids.map(id=>motorElenco(id,id==me?lu:null));
  const T=ids.map((id,i)=>MT.timeIA(js[i],cl(id).n));
  const opt={entradas:[],moral:[0,0]};
  opt.moral[my]=C((S.mor-50)/100+(S.form-6.5)/6,-.6,.6);
  if(lu&&!lu.s)opt.entradas.push({s:my,nome:S.p.name,min:x.inn});
  if(knock&&!ag)opt.mataMata=true;
  return{js,T,opt};
}

/* partida do clube do usuário pelo motor novo; null se não puder (o jogo cai no motor antigo) */
let PRE=null;   /* partida jogada ao vivo, à espera de ser lançada no calendário */
function pmMotor(r,x){
  if(!MOTOR_ON||typeof MT==='undefined'||!MT.simula)return null;
  try{
    let m,js;
    if(x.pre){m=x.pre.m;js=x.pre.js;PRE=null}
    else{
      const q=montaMotor(x);js=q.js;
      m=MT.simula(q.T[0],q.T[1],Math.floor(Math.random()*2147483000),q.opt);
    }
    adaptaResultado(r,m,x,js);
    return r;
  }catch(e){console.error('motor novo falhou, usando o antigo:',e);return null}
}

/* ---------- partida ao vivo: o motor roda enquanto a transmissão avança e o jogador decide alguns lances ---------- */
/* dados do jogo do clube do usuário na rodada (os mesmos que o calendário usaria ao simulá-lo) */
function userFixture(g){
  const me=S.club;
  if(g.ph=='end'){return g.h==null?null:{h:g.h,a:g.a,my:g.h==me?0:1,knock:0,kind:'lg',ag:null,label:'Liga',isLg:true}}
  const k=allComps().find(k=>kDue(k,S.week)&&k.al.includes(me)&&kPair(k));if(!k)return null;
  const m=kPair(k);if(!m)return null;
  const base={h:m[0],a:m[1],my:m[0]==me?0:1,kind:k.k,isLg:false};
  if(k.nl&&k.rd<k.nl)return{...base,knock:0,ag:null,label:k.n+' — '+k.rn[k.rd]};
  if(kTwo(k)&&!k.l1)return{...base,knock:0,ag:null,label:k.n+' — '+k.rn[k.rd]+' (ida)'};
  if(kTwo(k)){const i=k.dr.findIndex(q=>q.includes(me)),g1=k.l1[i];return{...base,knock:1,ag:[g1[1],g1[0]],label:k.n+' — '+k.rn[k.rd]+' (volta)'}}
  return{...base,knock:1,ag:null,label:k.n+' — '+k.rn[k.rd]};
}
/* cria a partida ao vivo (ou a recria, a partir do que foi salvo, para o jogador não poder "sortear de novo" recarregando) */
function pmViva(g,pj){
  if(!MOTOR_ON||typeof MT==='undefined'||!MT.partida)return null;
  try{
    const f=userFixture(g);if(!f)return null;
    const lu=pj?pj.lu:lnp(),inn=pj?pj.inn:(lu&&!lu.s?RI(52,78):1),x={...f,lu,inn},q=montaMotor(x);
    q.opt.vivo={s:x.my,nome:S.p.name,cd:170};
    const seed=pj?pj.seed:Math.floor(Math.random()*2147483000),p=MT.partida(q.T[0],q.T[1],seed,q.opt);
    const V={p,x,js:q.js,seed,lu,inn,dec:pj?pj.dec.slice():[],w:S.week,ph:g.ph,r:{comp:f.label,kind:f.kind,h:f.h,a:f.a,ev:[],sc:[],g:[0,0],pl:!!lu,gl:0,as:0,yc:0,rc:0,inj:0,mn:0,vivo:1},min:0};
    return V;
  }catch(e){console.error('partida ao vivo falhou:',e);return null}
}
/* atualiza o resultado parcial (o que a transmissão mostra) com o que o motor já jogou */
function vivoRefresh(V){
  const m=V.p.resultado();
  if(!m.log.ev.length)return;
  adaptaResultado(V.r,m,{...V.x,parcial:true},V.js);
}
/* recoloca a partida salva no ponto em que estava: refaz os lances com as mesmas escolhas */
function vivoReplay(V,min){
  const fila=V.dec.slice();
  for(let m=1;m<=min;m++){
    V.p.ateMinuto(m);
    while(V.p.pausa()&&fila.length){V.p.escolhe(fila.shift());V.p.ateMinuto(m)}
    if(V.p.pausa())break;
  }
  V.min=min;vivoRefresh(V);return V.p.pausa();
}
/* fim da partida: lança o resultado no calendário (tabela, copas, estatísticas) como qualquer outra partida */
function vivoFecha(V){
  for(let n=0;n<50&&!V.p.feito();n++){if(V.p.pausa())V.p.escolhe({t:'auto'});V.p.avanca(Infinity)}
  if(V.ph=='wc'||V.ph=='po'){V.fin=V.ph=='wc'?wcFecha(V):poFecha(V);return S.ti.length}
  PRE={h:V.x.h,a:V.x.a,w:V.w,lu:V.lu,inn:V.inn,m:V.p.resultado(),js:V.js};
  const nt=S.ti.length;
  try{if(V.ph=='mid')stepMid();else stepEnd()}finally{PRE=null}
  S.pj=null;
  return nt;
}

function adaptaResultado(r,m,x,js){
  const{h,a,my,lu,isLg}=x,me=S.club,ids=[h,a],ev=m.log.ev,M=MT.minutos(m),NA=MT.narra(m),X=MT.estat(m),E=MT.estatJog(m),mn=t=>Math.max(1,Math.min(90,M.n(t)));
  const nome=S.p.name,ovrDe={};js.forEach((l,i)=>l.forEach(p=>{ovrDe[i+'|'+p.n]=p.ovr}));
  r.g=m.g.slice();
  /* gols e assistências */
  r.sc=[];r.gl=0;r.as=0;
  ev.forEach((e,i)=>{
    if(e.k!='gol'||(e.d&&e.d.anulado))return;
    const J=MT.jogadores(m),aut=J.quem(e.s,e.p,e.t),nx=ev[i+1],as=nx&&nx.k=='assistencia'?J.quem(nx.s,nx.p,nx.t):'';
    const mine=as==nome&&e.s==my;
    if(aut==nome&&e.s==my)r.gl++;else if(mine)r.as++;
    r.sc.push([mn(e.t),e.s,aut,mine?1:0,as,M.fmt(e.t)]);
  });
  /* creditar rivais (gols, assistências, notas) e artilheiros do campeonato */
  if(!x.parcial)r.sc.forEach(z=>{
    const cid=ids[z[1]],rv=(RC[cid]||[]).find(q=>q.n==z[2]);
    if(rv&&z[2]!=nome){rv.cur.g++;if(isLg)rv.cur.lg++}
    else if(z[2]!=nome&&isLg){const k=cid+'#'+z[2],e2=S.sc[k]||(S.sc[k]={n:z[2],c:cid,g:0});e2.g++}
    const ra=z[4]&&z[4]!=nome?(RC[cid]||[]).find(q=>q.n==z[4]):null;if(ra)ra.cur.a++;
  });
  if(!x.parcial)E.lista.forEach(j=>{if(j.min<1)return;const rv=(RC[ids[j.s]]||[]).find(q=>q.n==j.nome);if(rv&&j.nome!=nome){rv.cur.ap++;rv.cur.rs+=j.nota}});
  /* texto: narração do motor; o seu jogador aparece como "você" */
  const re=new RegExp(nome.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g');
  r.ev=[];
  r.ev.push({m:0,t:`Começa o jogo! ${cl(h).n} x ${cl(a).n} — ${r.comp}.`,c:''});
  r.ev.push({m:0,t:lu?lu.s?'Você foi escalado como titular.':'Você começa no banco de reservas.':S.inj>0?'Você está lesionado e acompanha de fora.':'O técnico não utilizou você nesta partida.',c:''});
  NA.forEach(l=>{
    if(l.k=='tatica'&&l.n>0&&false)return;
    const mine=l.s==my,txt=l.txt.replace(re,'você');
    let c='';
    if(l.k=='gol')c=/será revisado/.test(l.txt)?'':mine?'g':'b';
    else if(l.k=='cartao')c=/amarelo/.test(l.txt)?'y':'b';
    else if(l.k=='substituicao'&&txt.includes('entra você'))c='ok';
    else if(l.k=='lesao'&&txt.includes('você'))c='b';
    if(l.k=='gol'&&c){const g=r.sc.find(z=>!z.u&&z[0]==mn(l.t));if(g)g.u=1}
    r.ev.push({m:Math.min(90,l.n),f:l.t!=null?M.fmt(l.t):null,t:(l.k=='gol'&&c?'⚽ ':l.k=='cartao'?(c=='y'?'🟨 ':'🟥 '):'')+txt,c});
  });
  r.sc.forEach(z=>{delete z.u});
  /* cartões e lesão do usuário */
  r.yc=0;r.rc=0;r.inj=0;
  ev.forEach(e=>{
    if(e.s!==my||e.p==null)return;
    const J=MT.jogadores(m);if(J.quem(e.s,e.p,e.t)!=nome)return;
    if(e.k=='cartao'){if(e.o=='amarelo')r.yc=1;else r.rc=1}
    if(e.k=='lesao'&&e.d.gravidade!='leve')r.inj=1;
  });
  const meu=E.por[my][nome];
  r.mn=lu&&meu?Math.max(0,Math.round(meu.min)):0;
  if(!lu||!meu||r.mn<1){r.pl=false;r.mn=0}else r.pl=true;
  r.sh=[X[0].chutes,X[1].chutes];r.po=Math.round(C(X[0].posseP,25,75));
  /* decisão do mata-mata */
  const ag=x.ag;
  if(x.parcial){r.win=null;r.pen=0}
  else if(x.knock){
    if(m.pen){r.win=m.pen.vencedor==0?h:a;r.pen=1}
    else if(ag&&r.g[0]+ag[0]==r.g[1]+ag[1]){r.win=pen(h,a);r.pen=1;r.ev.push({m:90,t:`${ag?'Empate no agregado!':'Empate!'} Nos pênaltis, vitória do ${cl(r.win).n}.`,c:''})}
    else r.win=r.g[0]>r.g[1]?h:r.g[1]>r.g[0]?a:null;
    if(!m.pen&&!ag&&r.g[0]==r.g[1])r.win=pen(h,a);
  }else r.win=r.g[0]>r.g[1]?h:r.g[1]>r.g[0]?a:null;
  /* estatísticas para as abas e o jogo ao vivo */
  const blocos=18,mom=Array(blocos).fill(0),fe=[],xgR=[0,1].map(s=>Math.round(X[s].xg*10)/10);
  ev.forEach(e=>{
    const t=mn(e.t),b=Math.min(blocos-1,Math.floor((t-1)/5));
    if(e.k=='chute'){mom[b]+=(e.s==0?1:-1)*Math.min(.5,e.d.xg*1.5+.04);fe.push([t,e.s,'sh'])}
    if(e.k=='gol'&&!(e.d&&e.d.anulado)){fe.push([t,e.s,'st']);mom[b]+=(e.s==0?1:-1)*.5}
    if(e.k=='defesa')fe.push([t,1-e.s,'st']);
    if(e.k=='escanteio')fe.push([t,e.s,'co']);
    if(e.k=='falta'&&!(e.d&&e.d.simulacao))fe.push([t,e.s,'fl']);
    if(e.k=='impedimento')fe.push([t,e.s,'of']);
    if(e.k=='cartao')fe.push([t,e.s,e.o=='amarelo'?'yc':'rc']);
  });
  fe.sort((p,q)=>p[0]-q[0]);
  r.st={sh:[X[0].chutes,X[1].chutes],sot:[X[0].alvo,X[1].alvo],co:[X[0].escanteios,X[1].escanteios],fl:[X[0].faltas,X[1].faltas],yc:[X[0].amarelos,X[1].amarelos],rc:[X[0].vermelhos,X[1].vermelhos],of:[X[0].imped,X[1].imped],xg:xgR,
    pa:[0,1].map(s=>X[s].pas?Math.round(100*X[s].pasOk/X[s].pas):0),sv:[X[0].defesas,X[1].defesas],mom:mom.map(v=>Math.round(C(v,-1,1)*100)/100),fe};
  r.vr=[X[0].var+X[1].var];
  /* quem jogou e as melhores notas */
  r.xi=[0,1].map(s=>m.ini[s].map(p=>{const j=E.por[s][p.n];return[p.n,POS_ANTIGA[p.cls]||'MEI',p.n==nome&&s==my?1:0]}));
  r.pr=[0,1].map(s=>E.lista.filter(j=>j.s==s&&j.min>=1).sort((p,q)=>q.nota-p.nota).slice(0,6).map(j=>{
    const me_=j.nome==nome&&s==my;return[j.nome,POS_ANTIGA[j.cls]||'MEI',ovrDe[s+'|'+j.nome]||Math.round(cl(ids[s]).s),j.gols,j.assist,j.nota,me_?1:0]}));
  r.rt=meu&&r.pl?meu.nota:0;
  r.mv=E.melhor?E.melhor.nome:'';
  r.motor=1;
}
