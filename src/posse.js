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
    desarme:{prob:.28,esc:20,raio:3.2},
    chute:{janelaAss:20,minXg:.055,zonaAtras:.78,penAtras:.12,instinto:.15,esc:20,gk:16,maxDist:34,onTgt:.25,bloq:.12,impulso:.3,caixa:.98,cabeca:.2},
    decisao:{tau0:.05,tauDec:.14,ruido:.12},
    pos:{compacto:.82,largura:.85,maxU:.84,ponta:.45,chegada:.09},
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
    const f=FORM[form]||FORM['4-3-3'],pool=js.map(j=>({...j,cls:j.cls||MT.cls(j.pos,j.fp)})).sort((a,b)=>((b.forcado?1000:0)+b.ovr)-((a.forcado?1000:0)+a.ovr)),used=new Set(pool.filter(x=>x.soBanco)),xi=[];
    f.forEach(([c,u,v])=>{
      let p=pool.find(x=>!used.has(x)&&x.cls==c);
      if(!p)for(const c2 of PERTO[c]){p=pool.find(x=>!used.has(x)&&x.cls==c2);if(p)break}
      if(!p)p=pool.find(x=>!used.has(x)&&(c=='GK')==(x.cls=='GK'));
      if(!p)p=pool.find(x=>!used.has(x));
      used.add(p);const at=p.a?null:MT.atrib(p);xi.push({...p,a:p.a||at.a,foot:p.foot||(at&&at.foot)||'D',pf:p.pf||(at&&at.pf)||55,u0:u,v0:v,slotCls:c,fora:p.cls!=c});
    });
    /* banco: os melhores que sobraram, com um goleiro reserva garantido */
    const sb=pool.filter(x=>x.soBanco),rest=pool.filter(x=>!used.has(x)),banco=[],gk=rest.find(x=>x.cls=='GK');
    if(gk)banco.push(gk);
    sb.forEach(x=>banco.push(x));
    rest.filter(x=>x!==gk).slice(0,(gk?8:9)-sb.length).forEach(x=>banco.push(x));
    banco.forEach((p,k)=>{const at=p.a?null:MT.atrib(p);banco[k]={...p,a:p.a||at.a,foot:p.foot||(at&&at.foot)||'D',pf:p.pf||(at&&at.pf)||55}});
    return{nome:nome||'Time',form:FORM[form]?form:'4-3-3',xi,banco};
  }
  /* time sintético: força média 'forca', cada função com a sua nota e variação reproduzível */
  function timeTeste(forca,form,nome,seed){
    const r=MT.rng(seed||nome||'t'),f=FORM[form]||FORM['4-3-3'],js=f.map(([c],i)=>{
      const pos={GK:'GOL',CB:'ZAG',FB:'ZAG',DM:'VOL',CM:'MEI',AM:'MEI',W:'PNT',ST:'ATA'}[c],fp={GK:'GK',CB:'CB',FB:'LB',DM:'CDM',CM:'CM',AM:'CAM',W:'LW',ST:'ST'}[c];
      return{n:nome+' '+(i+1),pos,fp,ovr:Math.round(clamp(forca+r.gauss(0,3.5),30,95)),age:22+r.int(0,9),nat:'Brasil'};
    });
    ['GK','CB','FB','DM','CM','W','ST','AM'].forEach((c,k)=>{
      const pos={GK:'GOL',CB:'ZAG',FB:'ZAG',DM:'VOL',CM:'MEI',AM:'MEI',W:'PNT',ST:'ATA'}[c],fp={GK:'GK',CB:'CB',FB:'LB',DM:'CDM',CM:'CM',AM:'CAM',W:'LW',ST:'ST'}[c];
      js.push({n:nome+' R'+(k+1),pos,fp,ovr:Math.round(clamp(forca-5+r.gauss(0,3.5),30,95)),age:20+r.int(0,12),nat:'Brasil'});
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
    const rg=MT.rng(seed),RD=rg.fork('dec'),RU=rg.fork('duelo'),RS=rg.fork('chute'),RM=rg.fork('misc'),RF=rg.fork('regras');
    /* cópia dos times: trocas e expulsões não podem alterar os objetos de quem chamou */
    const cp=x=>({...x,a:{...x.a},a0:{...x.a}}),T=[A,B].map(tm=>({...tm,xi:tm.xi.map(cp),banco:(tm.banco||[]).map(cp)})),log=MT.Log(),G=[0,0];
    const st=[0,1].map(()=>({pas:0,pasOk:0,chutes:0,alvo:0,gols:0,xg:0,desarmes:0,desOk:0,dribles:0,dribOk:0,inter:0,perdas:0,cruz:0,cruzOk:0,posse:0,conducoes:0,defesas:0,bloq:0,lanc:0,cabecas:0,grandes:0,grandesGol:0,faltas:0,faltasSof:0,amarelos:0,vermelhos:0,imped:0,escanteios:0,laterais:0,penaltis:0,penGol:0,tl:0,tlChutes:0,tlGol:0}));
    let t=0,ps=0,h=0,bx=.5,by=.5,ult=null;
    const exp=[new Set(),new Set()],am=[{},{}],RG=MT.REGRAS,TA=MT.tatica,subsN=[0,0],jan=[0,0],subT=[{},{}];let t2=null,chk=false;
    /* condições: energia, lesões, moral e mando de campo (módulo 6) */
    const ini=T.map(tm=>tm.xi.map(x=>({n:x.n,cls:x.slotCls}))),RL=rg.fork('condicao'),CO=MT.cond,CD=MT.CONDICAO,casaOn=!(opt&&opt.neutro);
    const en=T.map(tm=>tm.xi.map(()=>100)),les=[{},{}],lesoes=[0,0];
    const mo=[((opt&&opt.moral&&opt.moral[0])||0)+(casaOn?CD.moral.casa:0),(opt&&opt.moral&&opt.moral[1])||0];
    let tDr=0,tRef=0;
    function refresh(){
      for(let s=0;s<2;s++)T[s].xi.forEach((p,i)=>{if(exp[s].has(i)&&i>0&&!les[s][i])return;CO.aplica(p.a0,p.a,{en:en[s][i],moral:mo[s],casa:casaOn&&s==0,lesao:les[s][i]||null})});
    }
    /* treinador-IA: perfil, estilo inicial e parâmetros em jogo */
    const avg=tm=>tm.xi.reduce((a,p)=>a+p.ovr,0)/11,RT=rg.fork('tatica');
    const setEst=(s,chave)=>{const tc=T[s].tec,e={...TA.ESTILOS[chave]};e.risco=clamp(e.risco+tc.ofensivo*.15,-1,1);T[s].chave=chave;T[s].est=e};
    [0,1].forEach(s=>{const tc=T[s].tec=TA.treinador(T[s].nome),ch=(opt&&opt.estilo&&opt.estilo[s])||TA.estiloInicial(avg(T[s]),avg(T[1-s]),tc,s==0,RT);setEst(s,ch)});let perdido=0,sem=false,rei=false,vant=null,penG=[0,0];
    const vivo=(s,i)=>!exp[s].has(i);
    const pos=[[],[]];
    const ATK=s=>s?-1:1;
    const toU=(s,x)=>s?1-x:x,toX=(s,u)=>s?1-u:u,toV=(s,y)=>s?1-y:y,toY=(s,v)=>s?1-v:v;
    const I=(s,i)=>T[s].xi[i];

    /* posições dos 22: formação deslocada pela bola; o portador fica na bola */
    function calcPos(s,bp,atk){
      const ub=toU(s,bp[0]),vb=toV(s,bp[1]),out=[];
      const E=T[s].est,linha=clamp((ub-.5)*.55+(atk?.05:-.02)+E.linha*.06,-.24,.28),larg=(atk?1.12:.85)*E.largura;
      T[s].xi.forEach((p,i)=>{
        let u,v;
        if(p.slotCls=='GK'){u=p.u0+clamp((ub-.5)*.06,-.02,.06);v=.5+(vb-.5)*.08}
        else{
          const ofe=p.u0>.7?1:p.u0>.45?.7:.4;
          u=clamp(p.u0+linha*(atk?(.6+.5*ofe):(.8+.2*(1-ofe)))+(atk&&p.u0>.7?.02:0),.06,.915);
          u=clamp(.5+(u-.5)*PAR.pos.compacto*(1+(E.compacto-1)*.35),.06,PAR.pos.maxU);
          /* sem a bola, a defesa fecha o lado e a zona onde a bola está */
          v=clamp(.5+(p.v0-.5)*larg*PAR.pos.largura+(vb-.5)*(atk?.2:.3),.04,.96);
          /* ataque no último terço: ponta fecha por dentro (chuta de frente) e meia chega na área */
          if(atk&&ub>.6){const k=clamp((ub-.6)/.25,0,1);
            if(p.slotCls=='W')v=.5+(v-.5)*(1-PAR.pos.ponta*k);
            else if(p.slotCls=='CM'||p.slotCls=='AM')u=Math.min(PAR.pos.maxU,u+PAR.pos.chegada*k)}
        }
        /* pressão: sem a bola, quem pressiona se aproxima de quem está com ela (e quem recua, se afasta) */
        if(!atk&&p.slotCls!='GK'&&E.pres!=1){const px=toX(s,u),py=toY(s,v),dd=dm([px,py],bp),k=(E.pres-1)*.8*Math.exp(-dd/22);u=clamp(toU(s,px+(bp[0]-px)*k),.04,.95);v=clamp(toV(s,py+(bp[1]-py)*k),.03,.97)}
        out[i]=vivo(s,i)?[toX(s,u),toY(s,v)]:[-9,-9];
      });
      return out;
    }
    function posicoes(){
      for(let s=0;s<2;s++)pos[s]=calcPos(s,[bx,by],ps==s);
      pos[ps][h]=[bx,by];
      /* quem ataca não fica adiantado do penúltimo defensor: os atentos ficam colados na linha, os distraídos arriscam mais */
      {const lin=MT.regras.impedimento(.99,toU(ps,bx),advUs(ps)).linha;
       T[ps].xi.forEach((p,i)=>{if(i==h||!vivo(ps,i))return;const u=toU(ps,pos[ps][i][0]);if(u<=.5)return;
         const sm=(p.a.ant+p.a.pos+p.a.dec)/300,gap=(toU(ps,bx)>=lin-1e-9?.1:1)*(.035+(1-sm)*.055);if(u>lin-gap)pos[ps][i][0]=toX(ps,lin-gap)})}
    }

    /* o time que tem a bola: quem pressiona e quem marca */
    const opp=s=>1-s;
    /* posições dos adversários de s no eixo de ataque de s (para o impedimento) */
    const advUs=s=>{const o=[];T[opp(s)].xi.forEach((p,k)=>{if(vivo(opp(s),k))o.push(toU(s,pos[opp(s)][k][0]))});return o};
    function maisPerto(s,pt,n,excGK){
      return T[s].xi.map((p,i)=>({i,d:dm(pos[s][i],pt)})).filter(o=>vivo(s,o.i)&&!(excGK&&T[s].xi[o.i].slotCls=='GK')).sort((a,b)=>a.d-b.d).slice(0,n);
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
      const q0=sig((hab-PAR.passe.hab)/PAR.passe.esc-d/(longo||cru?PAR.passe.distL:PAR.passe.dist)-PAR.passe.pres*P+(aberto-3.5)/PAR.passe.aberto+(b.pt-60)/PAR.passe.toque+T[opp(s)].est.linha*.35*clamp(((ru-ub)*PW)/25,0,1));   // defesa alta cede o espaço às costas; linha baixa fecha a profundidade
      /* interceptação: adversários perto da linha do passe */
      let nao=1;const ints=[];
      T[opp(s)].xi.forEach((o,k)=>{
        if(o.slotCls=='GK'||!vivo(opp(s),k))return;
        const p=pos[opp(s)][k],dx=tgt[0]-bx,dy=tgt[1]-by,l2=(dx*PW)*(dx*PW)+(dy*PH)*(dy*PH);
        let tt=l2?(((p[0]-bx)*PW)*(dx*PW)+((p[1]-by)*PH)*(dy*PH))/l2:0;tt=clamp(tt,.05,.95);
        const cx=bx+dx*tt,cy=by+dy*tt,dist=dm(p,[cx,cy]);
        if(dist>PAR.passe.raioLinha*1.8)return;
        const oa=o.a,qual=(oa.ant*.45+oa.pos*.3+oa.vel*.15+oa.des*.1)/70,r=sig((PAR.passe.raioLinha-dist)/1.2)*qual*PAR.passe.riscoLinha*(cru?.8:longo?.7:1)*(cru?1:clamp(d/10,.4,1));
        const pr=clamp(r,0,.5);nao*=1-pr;ints.push({k,pr,at:[cx,cy]});
      });
      const cobre=ru>.83?PAR.passe.zonaArea:ru>.67?PAR.passe.zonaTerco:1,q1=q0*cobre;
      /* risco de impedimento: posição real do recebedor contra a linha defensiva (quem tem visão enxerga mais) */
      const rawU=toU(s,pt[0]),linha=MT.regras.impedimento(rawU,ub,advUs(s)).linha,risk=rawU>.5?sig((rawU+.005-linha)/.012):0;
      return{j,tgt,d,risk,ru,rv,q0:q1,H:1-nao,q:q1*nao,ints,longo,cru,progresso:(ru-ub)*PW,aberto};
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
        if(j==h||!vivo(s,j))continue;
        const cj=I(s,j).slotCls;if(cj=='GK'&&!(cls=='CB'||cls=='FB'||ub<.3))continue;
        const cruz=(vb<.22||vb>.78)&&ub>.66&&toU(s,pos[s][j][0])>.78&&Math.abs(toV(s,pos[s][j][1])-.5)<.2&&(cls=='W'||cls=='FB'||cls=='AM'||cls=='CM');
        const e=avalPasse(s,h,j,P,cruz?'cruz':null);
        if(e.d<4)continue;
        /* só enxerga passes difíceis (longos, em profundidade) quem tem visão */
        if((e.d>34||e.progresso>26)&&!RD.chance(sig((a.vis-68)/9)))continue;
        const qd=e.q*(1-e.risk*clamp(.2+.7*a.vis/100,0,.95));
        const vert=T[s].est.risco*.05*clamp(e.ru-ub,-.3,.4);
        const ev=vert+qd*(vOwn(e.ru,e.rv)+(cruz?xgPos(e.ru,e.rv,true)*.5*V.gol:0))+(1-qd)*vOpp(e.ru,e.rv);
        const atras=ub>PAR.chute.zonaAtras&&e.ru<ub-.04&&!cruz;   /* na frente do gol quase ninguém devolve a bola para trás */
        ops.push({t:cruz?'cruz':'passe',e,u:ev-(atras?PAR.chute.penAtras:0)+RD.gauss(0,ruido)});
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
       if(c){const ev=c.xg*V.gol+(1-c.xg)*(-(V.keep+.02))+(c.xg>.1?PAR.chute.instinto*Math.min(1,c.xg/.3):0)+(a.agr>70?.01:0)+(100-a.dec)/100*.03*(c.d<26?1:.5);ops.push({t:'chute',c,u:ev+RD.gauss(0,ruido*.4)})}}
      if(!ops.length)return null;
      /* impulso: quem é agressivo ou atrevido bate de longe mesmo sem ser a melhor opção */
      const sh=ops.find(o=>o.t=='chute');
      if(sh&&sh.c.xg>PAR.chute.minXg&&RD.chance(PAR.chute.impulso*(1+.7*T[s].est.risco)*(.5+a.agr/100*.8+(100-a.dec)/100*.8)))return sh;
      const mx=Math.max(...ops.map(o=>o.u));
      let tot=0;const w=ops.map(o=>{const v=Math.exp((o.u-mx)/tau);tot+=v;return v});
      let r=RD.f()*tot;for(let i=0;i<ops.length;i++){r-=w[i];if(r<=0)return ops[i]}
      return ops[ops.length-1];
    }

    /* tempo gasto em cada ação (e posse acumulada) */
    const gasta=(s,sec)=>{sec/=T[s].est.ritmo;t+=sec;st[s].posse+=sec};

    function recupera(s2,i,pt,k,extra){
      if(impPerd&&s2!=impPerd.s)impPerd=null;if(faltaPerd&&s2==faltaPerd.vs)faltaPerd=null;
      if(vant){const v=vant;vant=null;if(s2!=v.s&&t-v.t<6){volta(v);return}}
      ps=s2;h=i;bx=pt[0];by=pt[1];ult=null;
      evento('recuperou',{s:s2,p:i,x:+bx.toFixed(3),y:+by.toFixed(3),d:{como:k,...(extra||{})}});
    }

    function chuta(s,sh,c,o){
      const p=I(s,sh),a=p.a,adv=opp(s),gk=T[adv].xi[0].a;
      /* pé: bola do lado fraco => às vezes bate com o pé fraco */
      const ladoFraco=(c.v>.5)==(p.foot!='D'),fraco=c.tipo!='cabeca'&&c.tipo!='falta'&&p.foot!='A'&&ladoFraco&&RS.chance(MT.CHUTE.fraco);
      const R=MT.chute.resolve(c,a,gk,RS,fraco,p.pf);
      st[s].chutes++;st[s].xg+=R.xg;if(c.tipo=='cabeca')st[s].cabecas++;if(R.big){st[s].grandes++}
      const base={s,p:sh,x:+bx.toFixed(3),y:+by.toFixed(3)};
      evento('chute',{...base,d:{xg:+R.xg.toFixed(3),dist:+c.d.toFixed(1),tipo:c.tipo,origem:c.origem,pe:c.tipo=='cabeca'?'cabeca':fraco?(p.foot=='D'?'E':'D'):(p.foot=='A'?'D':p.foot),fraco,grande:R.big,ass:c.ass?c.ass.i:null}});
      if(R.res=='gol'){
        G[s]++;golMoral(s);st[s].alvo++;st[s].gols++;if(R.big)st[s].grandesGol++;
        const ass=c.ass&&t-c.ass.t<PAR.chute.janelaAss?c.ass:null;
        const ge=evento('gol',{...base,q:ass?ass.i:undefined});
        if(varGol(s,ge)){if(R.big)st[s].grandesGol--;gasta(s,10);return}
        if(ass)evento('assistencia',{s,p:ass.i,q:sh});
        /* recomeço no meio: quem sofreu o gol */
        saidaGol(adv);gasta(s,45);perdido+=RG.tempo.gol;return;
      }
      if(R.res=='defesa'){
        st[s].alvo++;st[adv].defesas++;evento('defesa',{s:adv,p:0,q:sh,x:+bx.toFixed(3),y:+by.toFixed(3),d:{seg:R.seg}});
        if(R.seg=='segurou'&&RF.chance(.12)){canto(s);return}
        if(R.seg=='rebote'&&RF.chance(.5)){canto(s);return}
        if(R.seg=='rebote'){ // rebote: bola sobra para um atacante ou defensor
          const sobra=RM.chance(.5)?s:adv,cand=maisPerto(sobra,[toX(s,.95),.5],4,true),k=RM.pick(cand).i;recupera(sobra,k,[toX(s,.9),.5],'rebote');
        }else{ps=adv;h=0;bx=toX(adv,.04);by=.5;ult=null;gasta(s,PAR.dur.gk)}
      }else if(R.res=='bloqueio'){
        st[adv].bloq++;const k=maisPerto(adv,[bx,by],2,true)[RM.int(0,1)].i;evento('bloqueio',{s:adv,p:k,q:sh,x:+bx.toFixed(3),y:+by.toFixed(3)});
        if(RF.chance(.4)){canto(s);return}
        recupera(adv,k,[bx,by],'bloqueio');
      }else{ // para fora (ou na trave)
        if(R.res=='trave')evento('trave',{...base});
        if(R.res!='trave'&&RF.chance(.15)){canto(s);return}
        tiroMeta(adv);gasta(s,10);
      }
      gasta(s,PAR.dur.chute);
    }

    /* tentativa de desarme sobre o portador */
    function tentaDesarme(s,h,P){
      const m=maisPerto(opp(s),[bx,by],1,true)[0];
      if(!m||m.d>PAR.desarme.raio)return false;
      const o=I(opp(s),m.i).a,a=pl(s,h);
      const ub=toU(s,bx),zp=ub<.33?.35:ub<.66?.85:1,pt=PAR.desarme.prob*clamp(1.6-m.d/PAR.desarme.raio*.8,.3,1.2)*Math.sqrt(T[opp(s)].est.pres)*zp;
      if(!RU.chance(pt))return false;
      gastaEn(opp(s),m.i,.25);
      if(RF.chance(MT.regras.pFalta('tackle',o,a,rigZ(s,[bx,by])*Math.sqrt(T[opp(s)].est.pres))))return faltaEm(opp(s),m.i,s,h,'tackle',[bx,by],RF.chance(.35));
      const tk=o.des*.35+o.ant*.2+o.for*.15+o.agi*.15+o.pos*.15,hq=a.pt*.3+a.dri*.25+a.for*.2+a.equ*.15+a.agi*.1;
      st[opp(s)].desarmes++;
      if(RU.chance(sig((tk-hq)/PAR.desarme.esc-.35))){
        st[opp(s)].desOk++;st[s].perdas++;
        evento('desarme',{s:opp(s),p:m.i,q:h,x:+bx.toFixed(3),y:+by.toFixed(3),o:'ok'});recupera(opp(s),m.i,[bx,by],'desarme');gasta(s,1.2);return true;
      }
      evento('desarme',{s:opp(s),p:m.i,q:h,x:+bx.toFixed(3),y:+by.toFixed(3),o:'falha'});return false;
    }

    /* ---------- regras: reposições, faltas, cartões, pênalti (módulo 4) ---------- */
    const ARB=MT.arbitro((opt&&opt.arbitro)||('arb'+seed)),VR=rg.fork('var'),VAR=MT.VAR;let impPerd=null,faltaPerd=null;
    const REF={rig:ARB.rig},rigZ=(vs,pt)=>REF.rig*(MT.regras.dentroArea(toU(vs,pt[0]),toV(vs,pt[1]))?.08:1)*(casaOn&&vs==1?CD.casa.falta:1);
    const pickMeio=s=>{const k=T[s].xi.findIndex((p,i)=>vivo(s,i)&&(p.slotCls=='CM'||p.slotCls=='DM'||p.slotCls=='AM'));return k<0?T[s].xi.findIndex((p,i)=>i>0&&vivo(s,i)):k};
    const melhor=(s,f)=>{let b=-1,bv=-1;T[s].xi.forEach((p,i)=>{if(i==0||!vivo(s,i))return;const v=f(p.a);if(v>bv){bv=v;b=i}});return b};
    const fx=v=>+v.toFixed(3);
    /* depois de um gol: quem sofreu dá a saída */
    function saidaGol(adv){ps=adv;h=pickMeio(adv);bx=.5;by=.5;ult=null;sem=true;rei=true}
    function tiroMeta(adv){ps=adv;h=0;bx=toX(adv,.06);by=.5;ult=null;evento('tiro_meta',{s:adv,p:0,x:fx(bx),y:.5});sem=true;rei=true}
    /* a falta ou o impedimento acaba em tiro livre; perto do gol e centralizado, cobra a gol ou cruza */
    function tiroLivre(sf,pt,orig){
      const ub=toU(sf,pt[0]),vb=toV(sf,pt[1]),g=MT.chute.geo(ub,vb);
      let tk=orig=='falta'?melhor(sf,a=>a.fal*.5+a.tec*.2+a.pal*.15+a.cru*.15):-1;
      if(orig!='falta'||tk<0){posicoes();const m=maisPerto(sf,pt,1,true)[0];tk=m?m.i:pickMeio(sf)}
      t+=8;ps=sf;h=tk;bx=pt[0];by=pt[1];ult=null;rei=true;sem=false;
      st[sf].tl++;evento('tiro_livre',{s:sf,p:tk,x:fx(bx),y:fx(by),d:{origem:orig}});
      if(orig!='falta')return;
      posicoes();
      if(ub>.66&&g.d<=32&&Math.abs(vb-.5)<.42&&RF.chance(clamp(1.05-(g.d-16)/28,.3,.85))){
        st[sf].tlChutes++;const g0=G[sf];
        chuta(sf,tk,{u:ub,v:vb,d:g.d,tipo:'falta',origem:'nenhuma',nDef:1.2,pres:0,ass:null},null);
        if(G[sf]>g0)st[sf].tlGol++;
      }else if(ub>.6&&Math.abs(vb-.5)>.3&&RF.chance(.7))centra(sf,tk,'falta',pt);
    }
    /* bola alçada na área (escanteio ou falta lateral): quem cobra, quem sobe, quem defende */
    function centra(sf,tk,origem,pt,rec2){
      const adv=opp(sf),a=I(sf,tk).a;t+=9;posicoes();
      const ql=sig(((origem=='canto'?a.esc:a.cru*.7+a.esc*.3)*.6+a.tec*.2+a.pal*.2-58)/18);
      const papel={ST:1,CB:.8,CM:.55,W:.5,AM:.5,FB:.3,DM:.35,GK:0};
      const vivos=s=>T[s].xi.map((p,i)=>i).filter(i=>i>0&&vivo(s,i));
      const att=RF.weighted(vivos(sf).filter(i=>i!=tk),i=>{const b=I(sf,i);return(papel[b.slotCls]||.3)*(b.a.cab*.4+b.a.imp*.2+b.a.for*.15+b.a.pos*.15+b.a.ant*.1)/70});
      const dfd=RF.weighted(vivos(adv),i=>{const b=I(adv,i);return(papel[b.slotCls]||.3)*(b.a.cab*.35+b.a.imp*.2+b.a.for*.15+b.a.mar*.15+b.a.ant*.15)/70});
      if(att==null||dfd==null)return;
      const ponto=[toX(sf,.93),toY(sf,.5+RF.range(-.12,.12))];
      const A0=I(sf,tk),dist=dm(pt,ponto);
      if(!RF.chance(ql*.9)){evento('cruzamento',{s:sf,p:tk,q:att,x:fx(pt[0]),y:fx(pt[1]),o:'falha',d:{origem,dist:+dist.toFixed(1)}});recupera(adv,dfd,ponto,'rebatida');return}
      evento('cruzamento',{s:sf,p:tk,q:att,x:fx(pt[0]),y:fx(pt[1]),o:'ok',d:{origem,dist:+dist.toFixed(1)}});
      const A=I(sf,att).a,D=I(adv,dfd).a;
      if(RF.chance(MT.regras.pFalta('aereo',D,A,REF.rig))){faltaEm(adv,dfd,sf,att,'aereo',ponto,false);return}
      const qa=A.cab*.5+A.imp*.2+A.for*.15+A.ant*.15,qd=D.cab*.4+D.imp*.15+D.for*.15+D.mar*.15+D.ant*.15;
      if(RF.chance(sig((qa-qd)/18+(ql-.5)*1.2))){
        ult={s:sf,i:tk,j:att,t,o:'cruz'};ps=sf;h=att;bx=ponto[0];by=ponto[1];posicoes();
        const c=RF.chance(.55)?avalChute(sf,att,.5,true):null;
        if(c)chuta(sf,att,c,{cab:true});
        else{const dono=RF.chance(.5)?sf:adv,k=maisPerto(dono,ponto,3,true)[RF.int(0,2)];recupera(dono,k.i,ponto,'bola dividida')}
      }else if(!rec2&&RF.chance(.2)){canto(sf,true)}else recupera(adv,dfd,ponto,'rebatida');
    }
    function canto(s,rec2){
      const lado=by<.5?0:1,pt=[toX(s,1),lado],tk=melhor(s,a=>a.esc*.6+a.cru*.3+a.tec*.1);
      st[s].escanteios++;t+=10;ps=s;h=tk<0?pickMeio(s):tk;bx=pt[0];by=pt[1];ult=null;
      evento('escanteio',{s,p:h,x:fx(bx),y:fx(by)});
      centra(s,h,'canto',pt,rec2);
    }
    /* lateral: quem repõe passa a um dos dois mais próximos; às vezes perde a bola */
    function lateral(s,pt){
      posicoes();const m=maisPerto(s,pt,3,true);if(m.length<2)return;
      const tk=m[0].i,cand=m.slice(1),rc=RF.weighted(cand,x=>(I(s,x.i).a.pt+I(s,x.i).a.pas)/Math.max(8,x.d));
      st[s].laterais++;t+=7;perdido+=2;
      evento('lateral',{s,p:tk,q:rc.i,x:fx(pt[0]),y:fx(pt[1])});
      if(RF.chance(.9)){ps=s;h=rc.i;bx=pt[0];by=clamp(pt[1],.04,.96)+(pt[1]<.5?.05:-.05);ult={s,i:tk,j:rc.i,t,o:'passe'};sem=true;rei=true}
      else{const k=maisPerto(opp(s),pt,1,true)[0];recupera(opp(s),k.i,pt,'lateral perdido')}
    }
    /* cartões */
    /* o árbitro de vídeo intervém: registra, gasta tempo */
    function varEv(s,tipo,res,motivo,p){evento('var',{s,p,d:{tipo,resultado:res,motivo}});perdido+=RG.tempo.var;t+=VR.range(VAR.tempo.min,VAR.tempo.max)}
    /* gol: se veio de impedimento ou falta não marcados, o VAR pode anular */
    function varGol(s,ge){
      let mot=null,pt=null,orig='falta';
      if(impPerd&&impPerd.s==s&&t-impPerd.t<VAR.janela){mot='impedimento';pt=impPerd.pt;orig='impedimento'}
      else if(faltaPerd&&faltaPerd.df==s&&t-faltaPerd.t<VAR.janela){mot='falta no lance';pt=faltaPerd.pt}
      impPerd=null;faltaPerd=null;
      if(!mot||!VR.chance(VAR.det))return false;
      varEv(s,'gol','anulado',mot,ge.p);
      ge.d={...(ge.d||{}),anulado:true,motivo:mot};
      G[s]--;st[s].gols--;mo[s]=clamp(mo[s]-CD.moral.gol,-1,1);mo[1-s]=clamp(mo[1-s]+CD.moral.sofre,-1,1);refresh();
      tiroLivre(1-s,pt,orig);return true;
    }
    function cartaoEv(df,k,car,pt){
      const b={s:df,p:k,x:fx(pt[0]),y:fx(pt[1])};
      if(car.c=='amarelo'){am[df][k]=1;st[df].amarelos++;evento('cartao',{...b,o:'amarelo',d:{motivo:car.motivo}})}
      else if(car.c=='vermelho'){
        if(!car.segundo&&RF.chance(ARB.erro*VAR.erroExcessivo)&&VR.chance(VAR.det)){varEv(df,'vermelho','revertido','cartão excessivo',k);cartaoEv(df,k,{c:'amarelo',motivo:'falta imprudente'},pt);return}
        if(car.segundo){am[df][k]=2;st[df].amarelos++;evento('cartao',{...b,o:'amarelo',d:{motivo:'segundo amarelo',n:2}})}
        st[df].vermelhos++;mo[df]=clamp(mo[df]-CD.moral.vermelho,-1,1);evento('cartao',{...b,o:'vermelho',d:{motivo:car.motivo,segundo:!!car.segundo}});if(k>0)exp[df].add(k);
      }
      perdido+=RG.tempo.cartao;
    }
    /* uma disputa virou falta de df/k sobre vs/vi em pt. Devolve true se o jogo parou, false se a vantagem foi dada */
    function faltaEm(df,k,vs,vi,tipo,pt,mantem){
      const ub=toU(vs,pt[0]),vb=toV(vs,pt[1]),area=MT.regras.dentroArea(ub,vb),a=I(df,k).a;
      const px={x:fx(pt[0]),y:fx(pt[1])};
      /* simulação na área: o árbitro pode cair; o VAR revisa */
      if(area&&tipo!='aereo'&&RF.chance(VAR.simulacao)){
        if(!RF.chance(ARB.erro*VAR.erroSimula))return false;
        st[df].faltas++;st[vs].faltasSof++;perdido+=RG.tempo.falta;
        evento('falta',{s:df,p:k,q:vi,...px,d:{tipo,area:true,vantagem:false,simulacao:true}});
        if(VR.chance(VAR.det)){varEv(vs,'penalti','anulado','simulação',vi);cartaoEv(vs,vi,{c:'amarelo',motivo:'simulação'},pt);const m=maisPerto(df,pt,1,true)[0];recupera(df,m.i,pt,'bola ao árbitro');return true}
        penaltiLance(vs,vi);return true;
      }
      /* falta que o árbitro não viu: na área o VAR pode dar o pênalti; fora dela, o time do infrator fica com a bola */
      if(RF.chance(ARB.erro*VAR.erroApita)){
        if(area&&VR.chance(VAR.det)){varEv(vs,'penalti','concedido','falta na área não marcada',vi);penaltiLance(vs,vi);return true}
        recupera(df,k,pt,'falta não marcada');faltaPerd={df,vs,t,pt};return true;
      }
      st[df].faltas++;st[vs].faltasSof++;perdido+=RG.tempo.falta;
      const dog=tipo!='recep'&&tipo!='aereo'&&ub>.8&&Math.abs(vb-.5)<.2&&maisPerto(df,pt,3,true).filter(o=>o.i!=k&&o.d<13).length<1?(area?'area':'fora'):null;
      const tat=!area&&!dog&&ub>.35&&ub<.85&&tipo!='aereo'&&RF.chance(.25);
      let car=MT.regras.cartao({agr:a.agr,tatica:tat,dogso:dog,area,amarelos:am[df][k]||0,rig:REF.rig*(casaOn&&df==0?CD.casa.cartao:1)},RF);
      const vOk=!area&&mantem&&!vant&&tipo!='aereo'&&!car.segundo&&car.c!='vermelho'&&RF.chance(clamp(th(ub,vb)*1.6+.1,0,.6));
      evento('falta',{s:df,p:k,q:vi,x:fx(pt[0]),y:fx(pt[1]),d:{tipo,area,vantagem:vOk,dogso:dog}});
      if(dog&&!vOk&&car.c!='vermelho'&&RF.chance(ARB.erro*VAR.erroDogso)&&VR.chance(VAR.det)){varEv(df,'vermelho','concedido','anular chance clara de gol',k);car={c:'vermelho',segundo:false,motivo:'anular chance clara de gol'}}
      if(car.c)cartaoEv(df,k,car,pt);
      if(!vOk&&RL.chance(CD.lesao.contato*(1+CD.lesao.contatoAgr*a.agr/100)*(tipo=='tackle'?1.3:tipo=='recep'?.6:1)))lesiona(vs,vi,'contato');
      if(vOk){evento('vantagem',{s:vs,p:vi,x:fx(pt[0]),y:fx(pt[1])});vant={s:vs,t,pt,area,k,vi};return false}
      if(area)penaltiLance(vs,vi);else tiroLivre(vs,pt,'falta');
      return true;
    }
    /* a vantagem não vingou: vale a falta marcada */
    function volta(v){if(v.area)penaltiLance(v.s,v.vi);else tiroLivre(v.s,v.pt,'falta')}
    /* pênalti: cobrador x goleiro (Lei 14) */
    function penaltiLance(vs,vi){
      const adv=opp(vs),tk0=melhor(vs,a=>a.pen*.6+a.cmp*.25+a.fin*.15),tk=tk0<0?pickMeio(vs):tk0,pt=[toX(vs,1-11/105),toY(vs,.5)];
      t+=35;perdido+=RG.tempo.pen;ps=vs;h=tk;bx=pt[0];by=pt[1];ult=null;rei=true;st[vs].penaltis++;
      const base={s:vs,p:tk,x:fx(bx),y:fx(by)};
      evento('penalti',{...base,q:vi});
      const r=MT.regras.penalti(I(vs,tk).a,T[adv].xi[0].a,RF),xg=r.p;
      st[vs].chutes++;st[vs].xg+=xg;st[vs].grandes++;
      evento('chute',{...base,d:{xg:fx(xg),dist:11,tipo:'penalti',origem:'nenhuma',pe:I(vs,tk).foot=='A'?'D':I(vs,tk).foot,fraco:false,grande:true,ass:null}});
      if(r.res=='gol'){G[vs]++;golMoral(vs);st[vs].alvo++;st[vs].gols++;st[vs].grandesGol++;st[vs].penGol++;evento('gol',{...base,d:{penalti:true}});saidaGol(adv);perdido+=RG.tempo.gol;t+=40;return}
      if(r.res=='defesa'){
        st[vs].alvo++;st[adv].defesas++;evento('defesa',{s:adv,p:0,q:tk,x:fx(bx),y:fx(by),d:{seg:r.rebote?'rebote':'segurou',penalti:true}});
        if(r.rebote){posicoes();const dono=RF.chance(.5)?vs:adv,k=maisPerto(dono,[toX(vs,.95),.5],3,true)[0];recupera(dono,k.i,[toX(vs,.93),.5],'rebote');return}
        ps=adv;h=0;bx=toX(adv,.04);by=.5;ult=null;sem=true;return;
      }
      if(r.res=='trave')evento('trave',base);
      tiroMeta(adv);
    }

    /* disputa de pênaltis (Lei 14, apêndice): 5 cobranças alternadas, depois morte súbita; cobradores diferentes até esgotar */
    function disputa(){
      evento('penaltis',{d:{inicio:true}});
      const ord=s=>T[s].xi.map((p,i)=>i).filter(i=>vivo(s,i)).sort((x,y)=>(i=>I(s,i).a.pen*.6+I(s,i).a.cmp*.4)(y)-(i=>I(s,i).a.pen*.6+I(s,i).a.cmp*.4)(x));
      const fila=[ord(0),ord(1)],pl_=[0,0],ch=[0,0],prim=RF.chance(.5)?0:1;let n=0,fim_=false;
      const falta=s=>{const r5=Math.max(0,5-ch[s]);return r5};
      while(!fim_&&n<60){
        for(const k of [0,1]){
          const s=k?1-prim:prim,adv=1-s,kk=fila[s][ch[s]%fila[s].length],r=MT.regras.penalti(I(s,kk).a,T[adv].xi[0].a,RF);
          ch[s]++;n++;if(r.res=='gol')pl_[s]++;
          evento('penaltis',{s,p:kk,o:r.res=='gol'?'gol':r.res=='defesa'?'defesa':'fora',d:{n:ch[s],placar:[pl_[0],pl_[1]]}});
          /* decidido? (nas 5 primeiras, quando o outro já não alcança; depois, ao fim de cada rodada igual) */
          if(ch[0]<=5||ch[1]<=5){
            const rest=[Math.max(0,5-ch[0]),Math.max(0,5-ch[1])];
            if(pl_[0]>pl_[1]+rest[1]||pl_[1]>pl_[0]+rest[0]){fim_=true;break}
          }else if(k==1&&ch[0]==ch[1]&&pl_[0]!=pl_[1]){fim_=true;break}
        }
      }
      penG=pl_;return{placar:pl_,vencedor:pl_[0]>pl_[1]?0:1,cobrancas:n};
    }
    /* ---------- laço da partida ---------- */
    function inicio(s){ps=s;const k=T[s].xi.findIndex((p,i)=>vivo(s,i)&&(p.slotCls=='CM'||p.slotCls=='ST'||p.slotCls=='AM'));h=k<0?pickMeio(s):k;bx=.5;by=.5;ult=null;sem=true;rei=true;vant=null}
    /* joga até o relógio chegar a 'lim' (segundos) */
    let guarda=0,proxChk=900;const jans=[];
    const minuto=()=>t2==null?t/60:45+(t-t2)/60;
    const golMoral=s=>{mo[s]=clamp(mo[s]+CD.moral.gol,-1,1);mo[1-s]=clamp(mo[1-s]-CD.moral.sofre,-1,1);refresh()};
    const gastaEn=(s,i,v)=>{en[s][i]=Math.max(0,en[s][i]-v)};
    /* cansaço por tempo corrido e risco de lesão sem contato */
    function drena(dt){
      let H=0;const hz=[];
      for(let s=0;s<2;s++)T[s].xi.forEach((p,i)=>{
        if(!vivo(s,i))return;
        en[s][i]=Math.max(0,en[s][i]-CO.gasto(p.a0,p.slotCls,T[s].est)*dt*(s==1&&casaOn?CD.casa.gasto:1));
        if(!les[s][i]){const r=CO.risco({age:p.age,en:en[s][i]})*dt;H+=r;hz.push({s,i,r})}
      });
      if(RL.f()<1-Math.exp(-H)){const x=RL.weighted(hz,o=>o.r);if(x)lesiona(x.s,x.i,'sem contato')}
    }
    function bancoIdx(s,cls){
      const b=T[s].banco;let k=-1,bv=-1;
      b.forEach((p,j)=>{const c=p.cls||MT.cls(p.pos,p.fp);if((cls=='GK')!=(c=='GK'))return;const v=p.ovr+(c==cls?20:0);if(v>bv){bv=v;k=j}});
      return k;
    }
    /* lesão: leve joga machucado; média ou grave sai (se houver troca) ou fica no sacrifício/deixa o time com 10 */
    function lesiona(s,i,tipo){
      if(les[s][i]||!vivo(s,i))return;
      const g=CO.gravidade(RL),p=T[s].xi[i],k=g=='leve'?-1:bancoIdx(s,i==0?'GK':p.slotCls),pode=k>=0&&subsN[s]<5;
      lesoes[s]++;
      evento('lesao',{s,p:i,d:{tipo,gravidade:g,nome:p.n,minuto:Math.round(minuto()),semTroca:g!='leve'&&!pode}});
      perdido+=RG.tempo.lesao;t+=30;
      if(g=='leve'){les[s][i]='leve'}
      else if(pode)aplicaSub(s,i,k,'lesão');
      else if(g=='grave'&&i>0){exp[s].add(i);if(ps==s&&h==i){posicoes();const m=maisPerto(s,[bx,by],1,true)[0];if(m)h=m.i}}
      else les[s][i]=g;
      refresh();
    }
    function adaptaTodos(){
      if(opt&&opt.fixo)return;
      for(const s of [0,1]){
        const cx={min:minuto(),saldo:G[s]-G[1-s],homens:11-exp[s].size,homensAdv:11-exp[1-s].size,chave:T[s].chave},r=TA.adapta(cx,T[s].tec,RT);
        if(r){const de=T[s].chave;setEst(s,r.chave);evento('tatica',{s,d:{estilo:r.chave,de,motivo:r.motivo,minuto:Math.round(cx.min)}})}
      }
    }
    /* desempenho de cada titular desde que entrou, lido do registro de lances */
    function notas(s){
      const rt={};T[s].xi.forEach((p,i)=>rt[i]=0);
      for(const e of log.ev){
        if(e.s!==s||e.p==null||rt[e.p]===undefined||e.t<(subT[s][e.p]||0))continue;
        const k=e.k;
        if(k=='passe'||k=='lancamento'||k=='cruzamento')rt[e.p]+=e.o=='ok'?.02:-.05;
        else if(k=='desarme'&&e.o=='ok'||k=='intercepta'||k=='bloqueio')rt[e.p]+=.1;
        else if(k=='drible')rt[e.p]+=e.o=='ok'?.1:-.08;
        else if(k=='falta')rt[e.p]-=.15;else if(k=='cartao')rt[e.p]-=e.o=='vermelho'?1.5:.4;
        else if(k=='chute')rt[e.p]+=.05;else if(k=='gol')rt[e.p]+=1.2;else if(k=='assistencia')rt[e.p]+=.7;else if(k=='defesa')rt[e.p]+=.2;
      }
      return rt;
    }
    function aplicaSub(s,out,k,motivo){
      const old=T[s].xi[out],nw=T[s].banco.splice(k,1)[0],cls=nw.cls||MT.cls(nw.pos,nw.fp),mudou=cls!=old.slotCls;
      T[s].xi[out]={...nw,u0:mudou?TA.PADRAO[cls]:old.u0,v0:old.v0,slotCls:mudou?cls:old.slotCls,fora:false};
      delete am[s][out];delete les[s][out];en[s][out]=100;subT[s][out]=t;subsN[s]++;perdido+=RG.tempo.sub;
      evento('substituicao',{s,p:out,d:{sai:old.n,entra:nw.n,motivo,minuto:Math.round(minuto()),pos:T[s].xi[out].slotCls}});
    }
    function janela(ht){
      for(const s of [0,1]){
        if(!ht)jan[s]++;
        const rt=notas(s),xi=T[s].xi.map((p,i)=>({cls:p.slotCls,ovr:p.ovr,en:en[s][i],rt:rt[i],am:(am[s][i]||0)>=1,exp:!vivo(s,i)||(ps==s&&h==i),gk:i==0}));
        const banco=T[s].banco.map(p=>({cls:p.cls||MT.cls(p.pos,p.fp),ovr:p.ovr,gk:(p.cls||MT.cls(p.pos,p.fp))=='GK'}));
        const l=TA.subs({min:minuto(),saldo:G[s]-G[1-s],xi,banco,feitas:subsN[s],janelas:jan[s]-(ht?0:1),ht},T[s].tec,RT);
        /* indices do banco mudam a cada troca: aplica de trás para frente */
        l.sort((a,b)=>b.in-a.in).forEach(x=>aplicaSub(s,x.out,x.in,x.motivo));
      }
    }
    const ent=((opt&&opt.entradas)||[]).slice().sort((p,q)=>p.min-q.min);
    /* entrada combinada de antemão (o jogador do usuário que começa no banco): troca o titular da função com menos energia */
    function forcaEntrada(e0){
      const s=e0.s,k=T[s].banco.findIndex(p=>p.n==e0.nome);if(k<0||subsN[s]>=5)return;
      const cls=T[s].banco[k].cls||MT.cls(T[s].banco[k].pos,T[s].banco[k].fp);let b=-1,bv=1e9;
      T[s].xi.forEach((p,i)=>{if(i==0||!vivo(s,i)||(ps==s&&h==i))return;const v=en[s][i]+(p.slotCls==cls?-40:0);if(v<bv){bv=v;b=i}});
      if(b>=0)aplicaSub(s,b,k,'decisão do técnico');
    }
    function joga(lim){
    while(t<lim&&guarda++<60000){
      if(vant&&t-vant.t>=6)vant=null;
      {const dt=t-tDr;if(dt>0){tDr=t;drena(dt);if(t-tRef>=60){tRef=t;mo[0]*=CD.moral.decai;mo[1]*=CD.moral.decai;refresh()}}}
      if(chk||t>=proxChk){proxChk=t+300;chk=false;adaptaTodos()}
      while(jans.length&&t>=jans[0]){jans.shift();janela(false)}
      while(ent.length&&minuto()>=ent[0].min){forcaEntrada(ent.shift())}
      posicoes();
      const s=ps,me=pl(s,h),m=maisPerto(opp(s),[bx,by],1,true)[0],P=clamp(sig((4.6-(m?m.d:12))/1.7)*(.3+.7*Math.sqrt(T[opp(s)].est.pres)),0,1);
      const reiniciou=rei;rei=false;
      if(!reiniciou&&tentaDesarme(s,h,P))continue;
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
            gasta(s,dur*.6);if(toU(s,it.at[0])>.85&&RF.chance(.3)){canto(s);continue}recupera(opp(s),it.k,it.at,'intercepta');continue}
        }
        if(RU.chance(e.q0)){
          /* impedimento: posição real do recebedor na hora do passe (Lei 11) */
          if(!sem){
            const rU=toU(s,pos[s][e.j][0])+RF.gauss(.005,.014),io=MT.regras.impedimento(rU,toU(s,bx),advUs(s)),chama=io.imp?!RF.chance((io.margem*PW<1.2?.35:.03)*ARB.erro/.04):RF.chance(RG.imp.falso);
            if(io.imp&&!chama)impPerd={s,t,pt:e.tgt};
            if(chama){
              evento('impedimento',{s,p:e.j,q:h,x:+e.tgt[0].toFixed(3),y:+e.tgt[1].toFixed(3),d:{margem:+(io.margem*PW).toFixed(2),errado:!io.imp}});
              st[s].imped++;st[s].perdas++;perdido+=3;gasta(s,dur*.5);tiroLivre(opp(s),e.tgt,'impedimento');continue;
            }
          }
          st[s].pasOk++;if(op.t=='cruz')st[s].cruzOk++;
          evento(kind,{s,p:h,q:e.j,x:+bx.toFixed(3),y:+by.toFixed(3),o:'ok',d:{tx:+e.tgt[0].toFixed(3),ty:+e.tgt[1].toFixed(3),dist:+e.d.toFixed(1)}});
          gasta(s,dur);ult={s,i:h,j:e.j,t,o:op.t=='cruz'?'cruz':e.progresso>18&&!e.longo?'filtrado':'passe'};h=e.j;bx=e.tgt[0];by=e.tgt[1];
          {const dd=maisPerto(opp(s),e.tgt,1,true)[0];
           if(op.t!='cruz'&&!sem&&dd&&dd.d<4.5&&RF.chance(MT.regras.pFalta('recep',I(opp(s),dd.i).a,I(s,h).a,rigZ(s,e.tgt)*Math.sqrt(T[opp(s)].est.pres)))){if(faltaEm(opp(s),dd.i,s,h,'recep',e.tgt,RF.chance(.3)))continue}}
          /* cruzamento: o recebedor tenta de cabeça */
          if(op.t=='cruz'){posicoes();const c=avalChute(s,h,.3,true);if(c&&RM.chance(PAR.chute.cabeca)){chuta(s,h,c,{cab:true})}}
        }else{
          st[s].perdas++;
          evento(kind,{s,p:h,q:e.j,x:+bx.toFixed(3),y:+by.toFixed(3),o:'falha',d:{tx:+e.tgt[0].toFixed(3),ty:+e.tgt[1].toFixed(3),dist:+e.d.toFixed(1)}});
          gasta(s,dur);
          /* a bola pode sair: cruzamento errado vira escanteio ou tiro de meta; passe errado pode ser lateral */
          const rx=RF.f();
          if(op.t=='cruz'&&rx<.5){if(rx<.42)canto(s);else tiroMeta(opp(s));continue}
          if(op.t!='cruz'&&e.ru>.93&&rx<.35){tiroMeta(opp(s));continue}
          if(op.t!='cruz'&&rx<(e.rv<.1||e.rv>.9?.7:.36)){lateral(opp(s),[e.tgt[0],e.tgt[1]<.5?0:1]);continue}
          /* quem fica com a bola é o adversário mais próximo e ele a domina onde está (não "teleportado" para o ponto do passe) */
          const k=maisPerto(opp(s),e.tgt,1,false)[0],pk=pos[opp(s)][k.i],dk=dm(pk,e.tgt),f=dk>4?(dk-3)/dk:0;
          recupera(opp(s),k.i,[e.tgt[0]+(pk[0]-e.tgt[0])*f,e.tgt[1]+(pk[1]-e.tgt[1])*f],'erro');
        }
      }else if(op.t=='cond'){
        gasta(s,PAR.dur.cond+op.dist*PAR.dur.condM);gastaEn(s,h,op.dist*.03);
        if(RU.chance(op.pc)){st[s].conducoes++;if(op.dist>=9)evento('conducao',{s,p:h,x:+bx.toFixed(3),y:+by.toFixed(3),o:'ok',d:{tx:+op.np[0].toFixed(3),ty:+op.np[1].toFixed(3)}});bx=op.np[0];by=op.np[1];ult=null}
        else{
          const k=maisPerto(opp(s),op.np,1,true)[0];
          if(RF.chance(MT.regras.pFalta('cond',I(opp(s),k.i).a,me,rigZ(s,[bx,by])*Math.sqrt(T[opp(s)].est.pres)))){if(!faltaEm(opp(s),k.i,s,h,'cond',[bx,by],RF.chance(.35))){bx=op.np[0];by=op.np[1];ult=null}continue}
          st[s].perdas++;st[opp(s)].desarmes++;st[opp(s)].desOk++;
          evento('desarme',{s:opp(s),p:k.i,q:h,x:+bx.toFixed(3),y:+by.toFixed(3),o:'ok',d:{tipo:'conducao'}});recupera(opp(s),k.i,[bx,by],'desarme');
        }
      }else if(op.t=='drib'){
        st[s].dribles++;gasta(s,PAR.dur.drib);gastaEn(s,h,.5);
        if(RU.chance(op.pd)){st[s].dribOk++;evento('drible',{s,p:h,q:op.m,x:+bx.toFixed(3),y:+by.toFixed(3),o:'ok'});bx=toX(s,op.nu);by=toY(s,op.nv);ult=null}
        else if(RF.chance(MT.regras.pFalta('drib',I(opp(s),op.m).a,me,rigZ(s,[bx,by])*Math.sqrt(T[opp(s)].est.pres)))){if(!faltaEm(opp(s),op.m,s,h,'drib',[bx,by],RF.chance(.35))){bx=toX(s,op.nu);by=toY(s,op.nv);ult=null}continue}
        else{st[s].perdas++;evento('drible',{s,p:h,q:op.m,x:+bx.toFixed(3),y:+by.toFixed(3),o:'falha'});st[opp(s)].desarmes++;st[opp(s)].desOk++;evento('desarme',{s:opp(s),p:op.m,q:h,x:+bx.toFixed(3),y:+by.toFixed(3),o:'ok',d:{tipo:'drible'}});recupera(opp(s),op.m,[bx,by],'desarme')}
      }else if(op.t=='chute'){
        chuta(s,h,op.c,null);
      }
      sem=false;
    }
    }
    /* ---------- períodos: 1º tempo, acréscimos, intervalo, 2º tempo, prorrogação e pênaltis ---------- */
    const tempo=(n)=>{
      const add=MT.regras.acrescimo(perdido);evento('acrescimo',{d:{min:add,periodo:n}});perdido=0;return add;
    };
    refresh();inicio(0);evento('inicio',{});
    [0,1].forEach(s=>evento('tatica',{s,d:{estilo:T[s].chave,form:T[s].form,treinador:T[s].tec.nome,minuto:0}}));
    joga(2700);const a1=tempo(1);joga(2700+a1*60);
    evento('fim_tempo',{});vant=null;inicio(1);t2=t;for(let s=0;s<2;s++)en[s]=en[s].map(v=>Math.min(100,v+CD.descanso));refresh();janela(true);jans.push(t2+900,t2+1500,t2+2100);
    joga(t2+2700);const a2=tempo(2);joga(t2+2700+a2*60);
    let pen=null;
    if(opt&&opt.mataMata&&G[0]==G[1]){
      evento('prorrogacao',{d:{periodo:1}});inicio(RF.chance(.5)?0:1);let tp=t;joga(tp+900);
      evento('prorrogacao',{d:{periodo:2}});vant=null;inicio(RF.chance(.5)?0:1);tp=t;joga(tp+900);
      if(G[0]==G[1]&&!(opt&&opt.semPenaltis))pen=disputa();
    }
    evento('fim',{});
    return{log,g:G,st,T,t,pen,arb:ARB,ini,subs:subsN.slice(),en:en.map(a=>a.map(v=>Math.round(v))),moral:mo.slice(),lesoes:lesoes.slice(),min:{a1,a2},exp:[...exp[0]].concat([...exp[1]]).length};
  }

  /* o treinador-IA escolhe a formação que melhor aproveita o elenco (nota dos 11, com desconto por jogador fora de função) */
  function timeIA(js,nome){
    const forms=Object.keys(FORM),tec=MT.tatica.treinador(nome),vies={'4-3-3':tec.ofensivo*1.5,'4-4-2':0,'4-2-3-1':-tec.ofensivo*1.2};
    let best=null,bv=-1e9;
    forms.forEach(f=>{const tm=timeDe(js,f,nome),v=tm.xi.reduce((a,p)=>a+p.ovr-(p.fora?5:0),0)/11+(vies[f]||0);if(v>bv){bv=v;best=tm}});
    return best;
  }
  MT.timeIA=timeIA;
  MT.PAR=PAR;MT.FORM=FORM;MT.timeDe=timeDe;MT.timeTeste=timeTeste;MT.simula=simula;MT.xgPos=xgPos;MT.thPos=th;
})();
