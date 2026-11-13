'use strict';
/* ============================================================
   MOTOR DE PARTIDAS — módulo 6: CONDIÇÕES (cansaço, lesões, moral, mando de campo)
   Funções puras. O motor da posse guarda a energia (0–100) de cada jogador e, de tempos em tempos,
   reescreve os atributos "em uso" a partir dos atributos-base: base × cansaço × moral × mando × lesão.

   - MT.cond.gasto(a, cls, est)       energia perdida por segundo de jogo
   - MT.cond.fatores(en)              {fis, tec, men}: multiplicadores por cansaço
   - MT.cond.risco(p)                 chance por segundo de lesão sem contato
   - MT.cond.gravidade(rs)            'leve' | 'media' | 'grave'
   - MT.cond.aplica(a0, a, ctx)       escreve em 'a' os atributos efetivos
   - MT.cond.moralMult(m)             efeito da moral (-1..1) nos atributos técnicos e mentais
   ============================================================ */
(()=>{
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const CD={
    /* energia perdida por segundo: perfil médio (resistência 65) perde ~50 pontos em 90 min */
    base:.011,
    papel:{GK:.25,CB:.75,FB:1.15,DM:1.0,CM:1.1,AM:1.0,W:1.1,ST:.95},
    estilo:{pres:.5,ritmo:.3,fixo:.2},          // peso de cada parâmetro do estilo no gasto
    fadiga:{ini:80,fis:.006,tec:.002,men:.0015},   // abaixo de 'ini' de energia, perde x por ponto
    descanso:15,                                 // energia recuperada no intervalo
    /* lesões */
    lesao:{semContato:1.2e-6,idade:.05,idadeMin:30,fadiga:40,contato:.006,contatoAgr:1,
           grav:{leve:.55,media:.3,grave:.15},mult:{leve:.88,media:.6,grave:.35}},
    moral:{efeito:.04,gol:.22,sofre:.2,vermelho:.25,decai:.985,casa:.2},
    casa:{atr:.02,falta:.9,cartao:.88,gasto:1.03}   // mando: atributos, faltas marcadas contra, cartões, e gasto do visitante
  };

  /* gasto por segundo */
  function gasto(a,cls,est){
    const e=est||{pres:1,ritmo:1};
    const fe=CD.estilo.pres*e.pres+CD.estilo.ritmo*e.ritmo+CD.estilo.fixo;
    const g=1.5-((a.res||60)*.6+(a.cnd||60)*.4)/100;
    return CD.base*(CD.papel[cls]??1)*fe*g;
  }
  /* multiplicadores por cansaço (1 = descansado) */
  function fatores(en){
    const d=Math.max(0,CD.fadiga.ini-en);
    return{fis:1-CD.fadiga.fis*d,tec:1-CD.fadiga.tec*d,men:1-CD.fadiga.men*d};
  }
  const moralMult=m=>1+CD.moral.efeito*clamp(m,-1,1);

  /* chance por segundo de lesão sem contato: cansado e veterano se machuca mais */
  function risco(p){
    const L=CD.lesao,idade=1+Math.max(0,(p.age||26)-L.idadeMin)*L.idade,cans=1+(100-clamp(p.en,0,100))/L.fadiga;
    return L.semContato*idade*cans;
  }
  function gravidade(rs){
    const g=CD.lesao.grav,r=rs.f();return r<g.leve?'leve':r<g.leve+g.media?'media':'grave';
  }

  /* chaves de atributo por grupo */
  const FIS=['vel','ace','agi','imp','for','equ'];
  const MEN=['dec','vis','con','cmp','ant','pos','cri','lid','tre','det','agr'];
  const FISS=new Set(FIS),MENS=new Set(MEN);
  /* atributos efetivos: a0 (base) -> a (em uso). ctx = {en, moral, casa, lesao:'leve'|'media'|'grave'|null} */
  function aplica(a0,a,ctx){
    const f=fatores(ctx.en),mo=moralMult(ctx.moral||0),ca=ctx.casa?1+CD.casa.atr:1,les=ctx.lesao?CD.lesao.mult[ctx.lesao]:1;
    for(const k in a0){
      let m;
      if(k=='res'||k=='cnd')m=1;                       // quanto aguenta não cai com o próprio cansaço
      else if(FISS.has(k))m=f.fis*les;
      else if(MENS.has(k))m=f.men*mo*(les<1?Math.sqrt(les):1);
      else m=f.tec*mo*(les<1?Math.sqrt(les):1);
      a[k]=a0[k]*m*(k=='res'||k=='cnd'?1:ca);
    }
  }

  MT.CONDICAO=CD;
  MT.cond={gasto,fatores,moralMult,risco,gravidade,aplica};
})();
