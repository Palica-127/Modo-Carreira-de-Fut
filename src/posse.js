'use strict';
/* ============================================================
   MOTOR DE PARTIDAS — módulo 2: NÚCLEO DA POSSE
   A partida é uma sequência de ações do portador da bola: ele enxerga as opções (passe, enfiada,
   cruzamento, condução, drible, chute), escolhe conforme seus atributos e a pressão, e o resultado
   sai de duelos entre os atributos de quem executa e de quem defende. Tudo vai para MT.Log.

   Ainda NÃO existem aqui: faltas, impedimento, bola parada, cartões, tática, fadiga (módulos 3 a 6).
   O chute e o goleiro são uma versão enxuta, que o módulo 3 refina.

   Coordenadas: x e y de 0 a 1 em campo absoluto (105 x 68 m). O time 0 ataca para x=1, o time 1 para x=0.
   Dentro de cada time usa-se (u,v): u=0 é o próprio gol, u=1 o gol adversário; v=0 esquerda, v=1 direita.

   - MT.FORM                    formações (casas com função e posição)
   - MT.timeDe(jogadores,f,n)   monta um time: escolhe e encaixa os jogadores nas casas
   - MT.timeTeste(forca,f,n,s)  time sintético para testes/calibração
   - MT.simula(A,B,seed,opt)    simula a partida -> {log, g, st, T}
   - MT.PAR                     constantes de calibração (todas as fórmulas ficam centralizadas aqui)
   ============================================================ */
(()=>{
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),sig=x=>1/(1+Math.exp(-x));
  const PW=105,PH=68;

  /* ---------- constantes de calibração ---------- */
  const PAR={
    dur:{base:2.8,porM:.11,cond:2,condM:.28,drib:2.4,chute:1.6,gk:3},   // segundos por ação
    passe:{longo:36,zonaArea:.65,zonaTerco:.92,hab:-2,esc:20,dist:22,distL:32,pres:.6,aberto:10,toque:90,riscoLinha:.05,raioLinha:4.2},
    cond:{zonaArea:.4,zonaTerco:.75,hab:36,esc:20,pres:1.7,passo:[6,13]},
    drib:{zonaArea:.55,zonaTerco:.85,esc:18,ganho:.08},
    desarme:{prob:.05,esc:20,raio:3.2},
    chute:{esc:20,gk:16,maxDist:34,onTgt:.25,bloq:.12,impulso:.22,caixa:.98,cabeca:.45},
    decisao:{tau0:.05,tauDec:.14,ruido:.12},
    pos:{compacto:.82,largura:.85,maxU:.84},
    valor:{keep:.15,gol:3}      // valor de ter a bola e de um gol, na mesma unidade da ameaça (th)
  };


  /* ---------- formações: [função, u, v] ---------- */
  const FORM={
    '4-3-3':[['GK',.04,.5],['FB',.22,.12],['CB',.2,.37],['CB',.2,.63],['FB',.22,.88],['DM',.38,.5],['CM',.5,.3],['CM',.5,.7],['W',.8,.15],['ST',.88,.5],['W',.8,.85]],
    '4-4-2':[['GK',.04,.5],['FB',.22,.12],['CB',.2,.37],['CB',.2,.63],['FB',.22,.88],['W',.55,.1],['CM',.48,.38],['CM',.48,.62],['W',.55,.9],['ST',.82,.4],['ST',.82,.6]],
    '4-2-3-1':[['GK',.04,.5],['FB',.22,.12],['CB',.2,.37],['CB',.2,.63],['FB',.22,.88],['DM',.4,.38],['DM',.4,.62],['W',.65,.12],['AM',.66,.5],['W',.65,.88],['ST',.86,.5]]
  };
  const PERTO={GK:[],CB:['DM','FB'],FB:['CB','W','DM'],DM:['CM','CB'],CM:['DM','AM','W'],AM:['CM','W','ST'],W:['AM','ST','FB'],ST:['W','AM']};

  /* escolhe os 11 de um elenco para uma formação: cada casa recebe o melhor da função (ou de função vizinha) */
  function timeDe(js,form,nome){
    const f=FORM[form]||FORM['4-3-3'],pool=js.map(j=>({...j,cls:j.cls||MT.cls(j.pos,j.fp)})).sort((a,b)=>b.ovr-a.ovr),used=new Set(),xi=[];
    f.forEach(([c,u,v])=>{
      let p=pool.find(x=>!used.has(x)&&x.cls==c);
      if(!p)for(const c2 of PERTO[c]){p=pool.find(x=>!used.has(x)&&x.cls==c2);if(p)break}
      if(!p)p=pool.find(x=>!used.has(x)&&(c=='GK')==(x.cls=='GK'));
      if(!p)p=pool.find(x=>!used.has(x));
      used.add(p);const at=p.a?null:MT.atrib(p);xi.push({...p,a:p.a||at.a,foot:p.foot||(at&&at.foot)||'D',pf:p.pf||(at&&at.pf)||55,u0:u,v0:v,slotCls:c});
    });
    return{nome:nome||'Time',form:FORM[form]?form:'4-3-3',xi};
  }
  /* time sintético: força média 'forca', cada função com a sua nota e variação reproduzível */
  function timeTeste(forca,form,nome,seed){
    const r=MT.rng(seed||nome||'t'),f=FORM[form]||FORM['4-3-3'],js=f.map(([c],i)=>{
      const pos={GK:'GOL',CB:'ZAG',FB:'ZAG',DM:'VOL',CM:'MEI',AM:'MEI',W:'PNT',ST:'ATA'}[c],fp={GK:'GK',CB:'CB',FB:'LB',DM:'CDM',CM:'CM',AM:'CAM',W:'LW',ST:'ST'}[c];
      return{n:nome+' '+(i+1),pos,fp,ovr:Math.round(clamp(forca+r.gauss(0,3.5),30,95)),age:22+r.int(0,9),nat:'Brasil'};
    });
    return timeDe(js,form,nome);
  }

  const dm=(a,b)=>Math.hypot((a[0]-b[0])*PW,(a[1]-b[1])*PH);          // distância em metros
  /* ameaça: valor de a bola estar em (u,v) — cresce perto do gol e no corredor central */
  const th=(u,v)=>Math.pow(clamp(u,0,1),3)*(.55+.45*(1-Math.abs(v-.5)*1.6))*.5;
  /* chance de gol de um chute da posição (u,v) — modelo de distância e ângulo */
  function xgPos(u,v,cab){
    const x=(1-u)*PW,y=Math.abs(v-.5)*PH,d=Math.hypot(x,y);
    if(x<0)return .002;
    const ang=Math.abs(Math.atan2(7.32*x,x*x+y*y-3.66*3.66)),a=ang<0?ang+Math.PI:ang;
    let p=.55*Math.exp(-Math.pow(d/8.5,1.15))*clamp(a/.9,.06,1.15);
    if(cab)p*=.55;
    return clamp(p,.003,.78);
  }

  function simula(A,B,seed,opt){
    opt=opt||{};
    const rg=MT.rng(seed),RD=rg.fork('dec'),RU=rg.fork('duelo'),RS=rg.fork('chute'),RM=rg.fork('misc');
    const T=[A,B],log=MT.Log(),G=[0,0];
    const st=[0,1].map(()=>({pas:0,pasOk:0,chutes:0,alvo:0,gols:0,xg:0,desarmes:0,desOk:0,dribles:0,dribOk:0,inter:0,perdas:0,cruz:0,cruzOk:0,posse:0,conducoes:0,defesas:0,bloq:0,lanc:0,cabecas:0,grandes:0,grandesGol:0}));
    let t=0,ps=0,h=0,bx=.5,by=.5,ult=null,ht=false,fim=false;
    const pos=[[],[]];
    const ATK=s=>s?-1:1;
    const toU=(s,x)=>s?1-x:x,toX=(s,u)=>s?1-u:u,toV=(s,y)=>s?1-y:y,toY=(s,v)=>s?1-v:v;
    const I=(s,i)=>T[s].xi[i];

    /* posições dos 22: formação deslocada pela bola; o portador fica na bola */
    function calcPos(s,bp,atk){
      const ub=toU(s,bp[0]),vb=toV(s,bp[1]),out=[];
      const linha=clamp((ub-.5)*.55+(atk?.05:-.02),-.2,.24),larg=atk?1.12:.85;
      T[s].xi.forEach((p,i)=>{
        let u,v;
        if(p.slotCls=='GK'){u=p.u0+clamp((ub-.5)*.06,-.02,.06);v=.5+(vb-.5)*.08}
        else{
          const ofe=p.u0>.7?1:p.u0>.45?.7:.4;
          u=clamp(p.u0+linha*(atk?(.6+.5*ofe):(.8+.2*(1-ofe)))+(atk&&p.u0>.7?.02:0),.06,.915);
          u=clamp(.5+(u-.5)*PAR.pos.compacto,.06,PAR.pos.maxU);
          /* sem a bola, a defesa fecha o lado e a zona onde a bola está */
          v=clamp(.5+(p.v0-.5)*larg*PAR.pos.largura+(vb-.5)*(atk?.2:.3),.04,.96);
        }
        out[i]=[toX(s,u),toY(s,v)];
      });
      return out;
    }
    function posicoes(){
      for(let s=0;s<2;s++)pos[s]=calcPos(s,[bx,by],ps==s);
      pos[ps][h]=[bx,by];
    }

    /* o time que tem a bola: quem pressiona e quem marca */
    const opp=s=>1-s;
    function maisPerto(s,pt,n,excGK){
      return T[s].xi.map((p,i)=>({i,d:dm(pos[s][i],pt)})).filter(o=>!(excGK&&T[s].xi[o.i].slotCls=='GK')).sort((a,b)=>a.d-b.d).slice(0,n);
    }

    function evento(k,o){return log.add(k,t,o)}
    const pl=(s,i)=>I(s,i).a;
    const nm=(s,i)=>I(s,i).n;

    /* dados do duelo de passe: probabilidades de acerto e de interceptação */
    function avalPasse(s,h,j,P,kindForce){
      const a=pl(s,h),b=pl(s,j),pt=pos[s][j];
      let ru=toU(s,pt[0]),rv=toV(s,pt[1]);
      const rq=b.ace*.4+b.vel*.3+b.ant*.3,cls=I(s,j).slotCls;
      if(cls!='GK'&&cls!='CB'&&cls!='FB'){ru=clamp(ru+.01+.03*clamp((rq-50)/50,0,1),0,PAR.pos.maxU+.04)}
      const tgt=[toX(s,ru),toY(s,rv)],d=dm([bx,by],tgt),ub=toU(s,bx);
      const cru=kindForce=='cruz',longo=!cru&&d>PAR.passe.longo;
      const hab=cru?a.cru*.6+a.tec*.2+a.vis*.1+a.dec*.1:longo?a.pal*.55+a.tec*.2+a.vis*.15+a.dec*.1:a.pas*.6+a.tec*.2+a.vis*.1+a.pt*.1;
      const dpos=calcPos(opp(s),tgt,false);let ab=99;dpos.forEach((p,k)=>{if(T[opp(s)].xi[k].slotCls!='GK')ab=Math.min(ab,dm(p,tgt))});
      /* a linha defensiva cobre o terço final e a área: ali ninguém está realmente livre */
      const aberto=clamp(Math.min(ab,ru>.83?3.2:ru>.67?5:12),0,12);
      const q0=sig((hab-PAR.passe.hab)/PAR.passe.esc-d/(longo||cru?PAR.passe.distL:PAR.passe.dist)-PAR.passe.pres*P+(aberto-3.5)/PAR.passe.aberto+(b.pt-60)/PAR.passe.toque);
      /* interceptação: adversários perto da linha do passe */
      let nao=1;const ints=[];
      T[opp(s)].xi.forEach((o,k)=>{
        if(o.slotCls=='GK')return;
        const p=pos[opp(s)][k],dx=tgt[0]-bx,dy=tgt[1]-by,l2=(dx*PW)*(dx*PW)+(dy*PH)*(dy*PH);
        let tt=l2?(((p[0]-bx)*PW)*(dx*PW)+((p[1]-by)*PH)*(dy*PH))/l2:0;tt=clamp(tt,.05,.95);
        const cx=bx+dx*tt,cy=by+dy*tt,dist=dm(p,[cx,cy]);
        if(dist>PAR.passe.raioLinha*1.8)return;
        const oa=o.a,qual=(oa.ant*.45+oa.pos*.3+oa.vel*.15+oa.des*.1)/70,r=sig((PAR.passe.raioLinha-dist)/1.2)*qual*PAR.passe.riscoLinha*(cru?.8:longo?.7:1)*(cru?1:clamp(d/10,.4,1));
        const pr=clamp(r,0,.5);nao*=1-pr;ints.push({k,pr,at:[cx,cy]});
      });
      const cobre=ru>.83?PAR.passe.zonaArea:ru>.67?PAR.passe.zonaTerco:1,q1=q0*cobre;
      return{j,tgt,d,ru,rv,q0:q1,H:1-nao,q:q1*nao,ints,longo,cru,progresso:(ru-ub)*PW,aberto};
    }

    /* contexto de um chute em (bx,by) pelo jogador h do time s */
    function ctxChute(s,h,P,cab){
      const ub=toU(s,bx),vb=toV(s,by),g=MT.chute.geo(ub,vb);
      let n=0;maisPerto(opp(s),[bx,by],3,true).forEach(o=>{if(o.d<2.8)n++});
      if(ub>.8&&n<1)n=1;
      const rec=ult&&ult.s==s&&ult.j==h?ult:null;
      return{u:ub,v:vb,d:g.d,tipo:cab?'cabeca':rec?'primeira':'pe',origem:rec?rec.o:'nenhuma',nDef:n,pres:P,ass:rec};
    }
    /* o que o jogador vê antes de chutar: xG do lance corrigido pela habilidade esperada dele (sem saber o goleiro) */
    function avalChute(s,h,P,cab){
      const c=ctxChute(s,h,P,cab);
      if(c.d>PAR.chute.maxDist)return null;
      const a=pl(s,h),p=I(s,h),ladoFraco=(c.v>.5)==(p.foot!='D');
      const hb=MT.chute.habilEsp(a,c.tipo,ladoFraco,p.foot,p.pf);
      const xg=clamp(MT.chute.xgModel(c)*hb,.003,.8);
      return{...c,xg,qs:MT.chute.qFin(a,cab),ub:c.u,vb:c.v};
    }

    /* escolha entre as opções: valor esperado de cada uma + ruído de percepção, escolha suave */
    function decide(s,h,P){
      const a=pl(s,h),ub=toU(s,bx),vb=toV(s,by),cls=I(s,h).slotCls,ops=[];
      const ruido=(100-a.vis)/100*PAR.decisao.ruido+(100-a.dec)/100*.05,tau=PAR.decisao.tau0+(100-a.dec)/100*PAR.decisao.tauDec;
      const V=PAR.valor,vOwn=(u,v)=>V.keep+th(u,v),vOpp=(u,v)=>-(V.keep+th(1-u,v)*.9);
      /* passes */
      for(let j=0;j<11;j++){
        if(j==h)continue;
        const cj=I(s,j).slotCls;if(cj=='GK'&&!(cls=='CB'||cls=='FB'||ub<.3))continue;
        const cruz=(vb<.22||vb>.78)&&ub>.66&&toU(s,pos[s][j][0])>.82&&Math.abs(toV(s,pos[s][j][1])-.5)<.2&&(cls=='W'||cls=='FB'||cls=='AM'||cls=='CM');
        const e=avalPasse(s,h,j,P,cruz?'cruz':null);
        if(e.d<4)continue;
        /* só enxerga passes difíceis (longos, em profundidade) quem tem visão */
        if((e.d>34||e.progresso>26)&&!RD.chance(sig((a.vis-68)/9)))continue;
        const ev=e.q*(vOwn(e.ru,e.rv)+(cruz?xgPos(e.ru,e.rv,true)*.5*V.gol:0))+(1-e.q)*vOpp(e.ru,e.rv);
        ops.push({t:cruz?'cruz':'passe',e,u:ev+RD.gauss(0,ruido)});
      }
      /* condução */
      {const dist=RM.range(PAR.cond.passo[0],PAR.cond.passo[1]),nu=clamp(ub+dist/PW,0,.93),dv=(.5-vb)*.18,nv=clamp(vb+dv,.05,.95),np=[toX(s,nu),toY(s,nv)];
       const dpos=calcPos(opp(s),np,false);let n2=99;dpos.forEach((p,k)=>{if(T[opp(s)].xi[k].slotCls!='GK')n2=Math.min(n2,dm(p,np))});
       const P2=sig((4-n2)/1.5)*.9,cq=a.dri*.3+a.pt*.2+a.vel*.15+a.ace*.1+a.equ*.1+a.agi*.15,pc=sig((cq-PAR.cond.hab)/PAR.cond.esc-PAR.cond.pres*P2)*(nu>.83?PAR.cond.zonaArea:nu>.67?PAR.cond.zonaTerco:1);
       ops.push({t:'cond',np,nu,nv,dist,pc,u:pc*vOwn(nu,nv)+(1-pc)*vOpp(ub,vb)+RD.gauss(0,ruido)});}
      /* drible: só com um marcador à frente */
      {const m=maisPerto(opp(s),[bx,by],1,true)[0];
       if(m&&m.d<5){const o=I(opp(s),m.i).a,dq=a.dri*.4+a.agi*.2+a.ace*.15+a.equ*.1+a.tec*.15,df=o.des*.3+o.mar*.2+o.agi*.2+o.for*.1+o.ant*.2,pd=sig((dq-df)/PAR.drib.esc-.25)*(ub+.07>.83?PAR.drib.zonaArea:ub+.07>.67?PAR.drib.zonaTerco:1);
        const nu=clamp(ub+.07,0,.93),nv=clamp(vb+(RM.f()-.5)*.1,.05,.95);
        ops.push({t:'drib',m:m.i,pd,nu,nv,u:pd*(vOwn(nu,nv)+PAR.drib.ganho)+(1-pd)*vOpp(ub,vb)+(a.dri-60)/450+RD.gauss(0,ruido)})}}
      /* chute */
      {const c=avalChute(s,h,P,false);
       if(c){const ev=c.xg*V.gol+(1-c.xg)*(-(V.keep+.02))+(a.agr>70?.01:0)+(100-a.dec)/100*.03*(c.d<26?1:.5);ops.push({t:'chute',c,u:ev+RD.gauss(0,ruido*.4)})}}
      if(!ops.length)return null;
      /* impulso: quem é agressivo ou atrevido bate de longe mesmo sem ser a melhor opção */
      const sh=ops.find(o=>o.t=='chute');
      if(sh&&sh.c.xg>.015&&RD.chance(PAR.chute.impulso*(.5+a.agr/100*.8+(100-a.dec)/100*.8)))return sh;
      const mx=Math.max(...ops.map(o=>o.u));
      let tot=0;const w=ops.map(o=>{const v=Math.exp((o.u-mx)/tau);tot+=v;return v});
      let r=RD.f()*tot;for(let i=0;i<ops.length;i++){r-=w[i];if(r<=0)return ops[i]}
      return ops[ops.length-1];
    }

    /* tempo gasto em cada ação (e posse acumulada) */
    const gasta=(s,sec)=>{t+=sec;st[s].posse+=sec};

    function recupera(s2,i,pt,k,extra){
      ps=s2;h=i;bx=pt[0];by=pt[1];ult=null;
      evento('recuperou',{s:s2,p:i,x:+bx.toFixed(3),y:+by.toFixed(3),d:{como:k,...(extra||{})}});
    }

    function chuta(s,sh,c,o){
      const p=I(s,sh),a=p.a,adv=opp(s),gk=T[adv].xi[0].a;
      /* pé: bola do lado fraco => às vezes bate com o pé fraco */
      const ladoFraco=(c.v>.5)==(p.foot!='D'),fraco=c.tipo!='cabeca'&&p.foot!='A'&&ladoFraco&&RS.chance(MT.CHUTE.fraco);
      const R=MT.chute.resolve(c,a,gk,RS,fraco,p.pf);
      st[s].chutes++;st[s].xg+=R.xg;if(c.tipo=='cabeca')st[s].cabecas++;if(R.big){st[s].grandes++}
      const base={s,p:sh,x:+bx.toFixed(3),y:+by.toFixed(3)};
      evento('chute',{...base,d:{xg:+R.xg.toFixed(3),dist:+c.d.toFixed(1),tipo:c.tipo,origem:c.origem,pe:c.tipo=='cabeca'?'cabeca':fraco?(p.foot=='D'?'E':'D'):(p.foot=='A'?'D':p.foot),fraco,grande:R.big,ass:c.ass?c.ass.i:null}});
      if(R.res=='gol'){
        G[s]++;st[s].alvo++;st[s].gols++;if(R.big)st[s].grandesGol++;
        const ass=c.ass&&t-c.ass.t<9?c.ass:null;
        evento('gol',{...base,q:ass?ass.i:undefined});if(ass)evento('assistencia',{s,p:ass.i,q:sh});
        /* recomeço no meio: quem sofreu o gol */
        ps=adv;h=T[adv].xi.findIndex(p=>p.slotCls=='CM'||p.slotCls=='DM'||p.slotCls=='AM');if(h<0)h=5;bx=.5;by=.5;ult=null;gasta(s,45);return;
      }
      if(R.res=='defesa'){
        st[s].alvo++;st[adv].defesas++;evento('defesa',{s:adv,p:0,q:sh,x:+bx.toFixed(3),y:+by.toFixed(3),d:{seg:R.seg}});
        if(R.seg=='rebote'){ // rebote: bola sobra para um atacante ou defensor
          const sobra=RM.chance(.5)?s:adv,cand=maisPerto(sobra,[toX(s,.95),.5],4,true),k=RM.pick(cand).i;recupera(sobra,k,[toX(s,.9),.5],'rebote');
        }else{ps=adv;h=0;bx=toX(adv,.04);by=.5;ult=null;gasta(s,PAR.dur.gk)}
      }else if(R.res=='bloqueio'){
        st[adv].bloq++;const k=maisPerto(adv,[bx,by],2,true)[RM.int(0,1)].i;evento('bloqueio',{s:adv,p:k,q:sh,x:+bx.toFixed(3),y:+by.toFixed(3)});recupera(adv,k,[bx,by],'bloqueio');
      }else{ // para fora (ou na trave)
        if(R.res=='trave')evento('trave',{...base});
        ps=adv;h=0;bx=toX(adv,.06);by=.5;ult=null;evento('tiro_meta',{s:adv,p:0,x:+bx.toFixed(3),y:.5});gasta(s,10);
      }
      gasta(s,PAR.dur.chute);
    }

    /* tentativa de desarme sobre o portador */
    function tentaDesarme(s,h,P){
      const m=maisPerto(opp(s),[bx,by],1,true)[0];
      if(!m||m.d>PAR.desarme.raio)return false;
      const o=I(opp(s),m.i).a,a=pl(s,h);
      const ub=toU(s,bx),zp=ub<.33?.35:ub<.66?.85:1,pt=PAR.desarme.prob*clamp(1.6-m.d/PAR.desarme.raio*.8,.3,1.2)*(T[opp(s)].pres||1)*zp;
      if(!RU.chance(pt))return false;
      const tk=o.des*.35+o.ant*.2+o.for*.15+o.agi*.15+o.pos*.15,hq=a.pt*.3+a.dri*.25+a.for*.2+a.equ*.15+a.agi*.1;
      st[opp(s)].desarmes++;
      if(RU.chance(sig((tk-hq)/PAR.desarme.esc-.35))){
        st[opp(s)].desOk++;st[s].perdas++;
        evento('desarme',{s:opp(s),p:m.i,q:h,x:+bx.toFixed(3),y:+by.toFixed(3),o:'ok'});recupera(opp(s),m.i,[bx,by],'desarme');gasta(s,1.2);return true;
      }
      evento('desarme',{s:opp(s),p:m.i,q:h,x:+bx.toFixed(3),y:+by.toFixed(3),o:'falha'});return false;
    }

    /* ---------- laço da partida ---------- */
    function inicio(s){ps=s;const k=T[s].xi.findIndex(p=>p.slotCls=='CM'||p.slotCls=='ST'||p.slotCls=='AM');h=k<0?5:k;bx=.5;by=.5;ult=null}
    inicio(0);evento('inicio',{});
    let guarda=0;
    while(t<5400&&guarda++<20000){
      if(!ht&&t>=2700){ht=true;evento('fim_tempo',{});inicio(1);t=Math.max(t,2700)}
      posicoes();
      const s=ps,me=pl(s,h),m=maisPerto(opp(s),[bx,by],1,true)[0],P=sig((4.6-(m?m.d:12))/1.7);
      if(tentaDesarme(s,h,P))continue;
      const op=decide(s,h,P);
      if(!op){gasta(s,2);continue}
      if(op.t=='passe'||op.t=='cruz'){
        const e=op.e,kind=op.t=='cruz'?'cruzamento':e.longo?'lancamento':'passe',r=RU.f();
        st[s].pas++;if(op.t=='cruz')st[s].cruz++;if(e.longo)st[s].lanc++;
        const dur=PAR.dur.base+e.d*PAR.dur.porM;
        let feito=false;
        /* interceptação */
        let acc=0;
        for(const it of e.ints){acc+=it.pr;}
        if(e.ints.length&&r<1-(1-e.H)&&RU.f()<1){
          const it=RU.weighted(e.ints,x=>x.pr);
          if(it){st[opp(s)].inter++;st[s].perdas++;evento('intercepta',{s:opp(s),p:it.k,q:h,x:+it.at[0].toFixed(3),y:+it.at[1].toFixed(3),d:{tipo:kind}});
            gasta(s,dur*.6);recupera(opp(s),it.k,it.at,'intercepta');continue}
        }
        if(RU.chance(e.q0)){
          st[s].pasOk++;if(op.t=='cruz')st[s].cruzOk++;
          evento(kind,{s,p:h,q:e.j,x:+bx.toFixed(3),y:+by.toFixed(3),o:'ok',d:{tx:+e.tgt[0].toFixed(3),ty:+e.tgt[1].toFixed(3),dist:+e.d.toFixed(1)}});
          gasta(s,dur);ult={s,i:h,j:e.j,t,o:op.t=='cruz'?'cruz':e.progresso>18&&!e.longo?'filtrado':'passe'};h=e.j;bx=e.tgt[0];by=e.tgt[1];
          /* cruzamento: o recebedor tenta de cabeça */
          if(op.t=='cruz'){posicoes();const c=avalChute(s,h,.3,true);if(c&&RM.chance(PAR.chute.cabeca)){chuta(s,h,c,{cab:true})}}
        }else{
          st[s].perdas++;
          evento(kind,{s,p:h,q:e.j,x:+bx.toFixed(3),y:+by.toFixed(3),o:'falha',d:{tx:+e.tgt[0].toFixed(3),ty:+e.tgt[1].toFixed(3),dist:+e.d.toFixed(1)}});
          gasta(s,dur);
          const k=maisPerto(opp(s),e.tgt,1,false)[0];recupera(opp(s),k.i,e.tgt,'erro');
        }
      }else if(op.t=='cond'){
        gasta(s,PAR.dur.cond+op.dist*PAR.dur.condM);
        if(RU.chance(op.pc)){st[s].conducoes++;if(op.dist>=9)evento('conducao',{s,p:h,x:+bx.toFixed(3),y:+by.toFixed(3),o:'ok',d:{tx:+op.np[0].toFixed(3),ty:+op.np[1].toFixed(3)}});bx=op.np[0];by=op.np[1];ult=null}
        else{
          const k=maisPerto(opp(s),op.np,1,true)[0];st[s].perdas++;st[opp(s)].desarmes++;st[opp(s)].desOk++;
          evento('desarme',{s:opp(s),p:k.i,q:h,x:+bx.toFixed(3),y:+by.toFixed(3),o:'ok',d:{tipo:'conducao'}});recupera(opp(s),k.i,[bx,by],'desarme');
        }
      }else if(op.t=='drib'){
        st[s].dribles++;gasta(s,PAR.dur.drib);
        if(RU.chance(op.pd)){st[s].dribOk++;evento('drible',{s,p:h,q:op.m,x:+bx.toFixed(3),y:+by.toFixed(3),o:'ok'});bx=toX(s,op.nu);by=toY(s,op.nv);ult=null}
        else{st[s].perdas++;evento('drible',{s,p:h,q:op.m,x:+bx.toFixed(3),y:+by.toFixed(3),o:'falha'});st[opp(s)].desarmes++;st[opp(s)].desOk++;evento('desarme',{s:opp(s),p:op.m,q:h,x:+bx.toFixed(3),y:+by.toFixed(3),o:'ok',d:{tipo:'drible'}});recupera(opp(s),op.m,[bx,by],'desarme')}
      }else if(op.t=='chute'){
        chuta(s,h,op.c,null);
      }
    }
    evento('fim',{});
    return{log,g:G,st,T,t};
  }

  MT.PAR=PAR;MT.FORM=FORM;MT.timeDe=timeDe;MT.timeTeste=timeTeste;MT.simula=simula;MT.xgPos=xgPos;MT.thPos=th;
})();
