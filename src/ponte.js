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
  const c=S.cs[cid],sq=squadOf(cid).filter(x=>!x.me),top=sq.slice().sort((a,b)=>b.ovr-a.ovr).slice(0,14),med=top.reduce((s,x)=>s+x.ovr,0)/Math.max(1,top.length),d=cid==S.club||true?(c.s-med)*.9:0;
  const js=sq.map(x=>({n:x.n,pos:x.pos,fp:x.fp,ovr:Math.round(C(x.ovr+d,30,97)),age:x.age||26,nat:x.nat||'',rv:x.rv?1:0}));
  if(cid==S.club&&lu){
    const f=MT.atribUser(S.at,{n:S.p.name,pos:S.p.pos,ovr:O(),age:S.p.age,nat:S.p.nat});
    js.push({n:S.p.name,pos:S.p.pos,ovr:O(),age:S.p.age,nat:S.p.nat,a:f.a,foot:f.foot,pf:f.pf,cls:f.cls,me:1,forcado:!!lu.s,soBanco:!lu.s});
  }
  return js;
}

/* partida do clube do usuário pelo motor novo; null se não puder (o jogo cai no motor antigo) */
function pmMotor(r,x){
  if(!MOTOR_ON||typeof MT==='undefined'||!MT.simula)return null;
  try{
    const{h,a,my,lu,knock,kind,ag,isLg}=x,me=S.club,ids=[h,a];
    const js=ids.map(id=>motorElenco(id,id==me?lu:null));
    const T=ids.map((id,i)=>MT.timeIA(js[i],cl(id).n));
    const opt={entradas:[],moral:[0,0]};
    opt.moral[my]=C((S.mor-50)/100+(S.form-6.5)/6,-.6,.6);
    if(lu&&!lu.s)opt.entradas.push({s:my,nome:S.p.name,min:x.inn});
    if(knock&&!ag)opt.mataMata=true;
    const m=MT.simula(T[0],T[1],Math.floor(Math.random()*2147483000),opt);
    adaptaResultado(r,m,x,js);
    return r;
  }catch(e){console.error('motor novo falhou, usando o antigo:',e);return null}
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
    r.sc.push([mn(e.t),e.s,aut,mine?1:0,as]);
  });
  /* creditar rivais (gols, assistências, notas) e artilheiros do campeonato */
  r.sc.forEach(z=>{
    const cid=ids[z[1]],rv=(RC[cid]||[]).find(q=>q.n==z[2]);
    if(rv&&z[2]!=nome){rv.cur.g++;if(isLg)rv.cur.lg++}
    else if(z[2]!=nome&&isLg){const k=cid+'#'+z[2],e2=S.sc[k]||(S.sc[k]={n:z[2],c:cid,g:0});e2.g++}
    const ra=z[4]&&z[4]!=nome?(RC[cid]||[]).find(q=>q.n==z[4]):null;if(ra)ra.cur.a++;
  });
  E.lista.forEach(j=>{if(j.min<1)return;const rv=(RC[ids[j.s]]||[]).find(q=>q.n==j.nome);if(rv&&j.nome!=nome){rv.cur.ap++;rv.cur.rs+=j.nota}});
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
    r.ev.push({m:Math.min(90,l.n),t:(l.k=='gol'&&c?'⚽ ':l.k=='cartao'?(c=='y'?'🟨 ':'🟥 '):'')+txt,c});
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
  if(x.knock){
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
