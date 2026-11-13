'use strict';
/* ============================================================
   MOTOR DE PARTIDAS — módulo 3: CHUTE E GOLEIRO
   Todas as fórmulas de finalização ficam aqui (nada de número solto no motor da posse).

   Um chute passa por quatro etapas:
     1. xG do lance  = geometria (distância e ângulo do gol) × tipo (pé, cabeça, de primeira) × origem do passe
                       × marcação/pressão. É a chance de um jogador e um goleiro médios converterem.
     2. habilidade do finalizador (finalização, compostura, técnica, primeiro toque; cabeceio/impulsão/força
        nas cabeçadas; pé fraco pesa quando bate com ele) multiplica o xG.
     3. goleiro: reflexos, posicionamento, agarrar e — conforme o lance — um contra um, saídas ou jogo aéreo
        multiplicam o xG de novo (de 0,86 a 1,28).
     4. desfecho: bloqueado, para fora (às vezes na trave), defendido (segurou ou deu rebote) ou gol.
        O desfecho é sorteado de modo que a chance total de gol seja exatamente a calculada em 1–3.

   - MT.chute.geo(u,v)                  distância (m) e abertura angular do gol
   - MT.chute.xgModel(c)                xG do lance (sem jogador nem goleiro)
   - MT.chute.habil(a,tipo,fraco,pf)    multiplicador do finalizador
   - MT.chute.qGoleiro(g,c)             0..1, qualidade do goleiro NESTE lance
   - MT.chute.resolve(c,a,g,rs,fraco,pf) desfecho completo
   ============================================================ */
(()=>{
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),sig=x=>1/(1+Math.exp(-x));
  const PW=105,PH=68;
  const CH={
    esc:20,            // sensibilidade do finalizador (maior = atributos pesam menos)
    escGk:16,          // idem para o goleiro
    gkMin:.86,gkMax:1.28,   // multiplicador do xG conforme o goleiro (bom=min, ruim=max)
    cabeca:.55,primeira:.93,
    origem:{filtrado:1.18,cruz:.9,rebote:1.05,passe:1,conducao:1,nenhuma:1},
    marca:.14,pressao:.22,caixa:.98,   // perda de xG por defensor a menos de 2,8 m / pressão geral / chute dentro da área
    bloq:{base:.2,porDef:.1,pressao:.04,cab:.35},   // chance de o chute ser bloqueado
    alvo:{base:.47,dist:.0065,min:.3,max:.7,gol:.92},   // chance de ir no gol, se não bloqueado
    rebote:{base:.14,aga:300,min:.05,max:.32},         // defesa que não fica com o goleiro
    trave:.05,         // fração dos chutes para fora que bate na trave
    big:.3,            // xG a partir do qual é "chance clara"
    fraco:.45,         // chance de usar o pé fraco quando a bola está do lado dele
    q0:62,qgk:66
  };

  /* geometria: distância ao centro do gol e ângulo de visão do gol */
  function geo(u,v){
    const x=(1-u)*PW,y=Math.abs(v-.5)*PH,d=Math.hypot(x,y);
    if(x<0)return{d,ang:0,x};
    const ang=Math.abs(Math.atan2(7.32*x,x*x+y*y-3.66*3.66));
    return{d,ang,x};
  }
  const xgGeo=(u,v)=>{
    const g=geo(u,v);if(g.x<0)return .002;
    return .55*Math.exp(-Math.pow(g.d/8.5,1.15))*clamp(g.ang/.9,.06,1.15);
  };

  /* c: {u,v,tipo:'pe'|'cabeca'|'primeira', origem, nDef, pres}  ->  xG do lance */
  function xgModel(c){
    let p=xgGeo(c.u,c.v);
    if(c.tipo=='cabeca')p*=CH.cabeca;else if(c.tipo=='primeira')p*=CH.primeira;
    p*=CH.origem[c.origem||'nenhuma']||1;
    p*=(1-CH.marca*(c.nDef||0))*(1-CH.pressao*(c.pres||0));
    if(c.u>.83)p*=CH.caixa;
    return clamp(p,.003,.8);
  }

  /* qualidade bruta do finalizador */
  const qFin=(a,cab)=>cab?a.cab*.7+a.imp*.15+a.for*.15:a.fin*.5+a.cmp*.2+a.tec*.15+a.pt*.15;
  /* multiplicador do xG pelo finalizador; pé fraco desconta pela nota do pé fraco (30..80) */
  function habil(a,tipo,fraco,pf){
    let q=qFin(a,tipo=='cabeca');
    if(fraco&&tipo!='cabeca')q-=(100-(pf||55))*.45;
    return .55+.9*sig((q-CH.q0)/CH.esc);
  }
  /* habilidade esperada antes de saber o pé: dos lances com a bola do lado fraco, uma parte é com o pé fraco */
  function habilEsp(a,tipo,ladoFraco,foot,pf){
    const h0=habil(a,tipo,false,pf);
    if(!ladoFraco||foot=='A'||tipo=='cabeca')return h0;
    return h0*(1-CH.fraco)+habil(a,tipo,true,pf)*CH.fraco;
  }

  /* goleiro: peso dos atributos muda com o lance — 1x1 e passe em profundidade pedem saída e um contra um,
     cruzamento/cabeçada pedem jogo aéreo e saída, o resto é reflexo, posicionamento e firmeza */
  function qGoleiro(g,c){
    let w={ref:.3,gpo:.3,aga:.15,um1:.1,sai:.1,aer:0},tot=0;
    if(c.tipo=='cabeca'||c.origem=='cruz')w={ref:.2,gpo:.2,aga:.15,um1:.05,sai:.2,aer:.2};
    else if(c.origem=='filtrado'||(c.d||99)<11)w={ref:.25,gpo:.15,aga:.1,um1:.3,sai:.2,aer:0};
    let s=0;for(const k in w){s+=w[k]*g[k];tot+=w[k]}
    return sig((s/tot-CH.qgk)/CH.escGk);
  }
  const gkMult=q=>CH.gkMax-(CH.gkMax-CH.gkMin)*q;

  /* chance de bloqueio, de ir no gol e de converter no gol — a partir da chance total de gol pG */
  function probs(c,a,pG){
    const cab=c.tipo=='cabeca';
    const pB=clamp((CH.bloq.base+CH.bloq.porDef*(c.nDef||0)+CH.bloq.pressao*(c.pres||0))*(cab?CH.bloq.cab:1),.01,.45);
    const dm=c.d||geo(c.u,c.v).d;
    const prec=.75+.5*sig((qFin(a,cab)-CH.q0)/CH.esc);   // 0,75..1,25
    const pO0=clamp((CH.alvo.base-CH.alvo.dist*(dm-10))*prec*(cab?.85:1),CH.alvo.min,CH.alvo.max);
    const pGU=Math.min(.97,pG/(1-pB));
    const pO=Math.max(pO0,pGU/CH.alvo.gol);          // quem vai ter chance de gol alta tem de acertar o gol
    return{pB,pO,conv:pGU/pO,pGU};
  }

  /* desfecho de um chute. c = {u,v,d,tipo,origem,nDef,pres}; a = atributos do finalizador; g = atributos do goleiro;
     rs = gerador (usa 3 sorteios sempre); devolve {res, seg?, xg, pG, big, ...} */
  function resolve(c,a,g,rs,fraco,pf,foot){
    const xg=xgModel(c),h=habil(a,c.tipo,fraco,pf),gq=qGoleiro(g,c),gm=gkMult(gq);
    const pG=clamp(xg*h*gm,.002,.85),P=probs(c,a,pG);
    const r1=rs.f(),r2=rs.f(),r3=rs.f();
    const out={xg,pG,hab:h,gq,pB:P.pB,pO:P.pO,big:xg>=CH.big};
    if(r1<P.pB)return{...out,res:'bloqueio'};
    if(r2>=P.pO)return{...out,res:r3<CH.trave?'trave':'fora'};
    if(rs.f()<P.conv)return{...out,res:'gol'};
    const reb=clamp(CH.rebote.base-(g.aga-60)/CH.rebote.aga+(c.tipo=='cabeca'?0:.0),CH.rebote.min,CH.rebote.max);
    return{...out,res:'defesa',seg:rs.f()<reb?'rebote':'segurou'};
  }

  MT.CHUTE=CH;
  MT.chute={geo,xgGeo,xgModel,habil,habilEsp,qFin,qGoleiro,gkMult,probs,resolve};
})();
