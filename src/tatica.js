'use strict';
/* ============================================================
   MOTOR DE PARTIDAS — módulo 5: TÁTICA E TREINADOR
   A IA do treinador decide sozinha (o usuário não manda na tática): escolhe formação e estilo antes do jogo,
   adapta durante a partida (placar, minuto, expulsões) e faz as substituições (até 5, em 3 janelas + intervalo).
   Funções puras: o motor da posse só aplica o resultado.

   - MT.tatica.ESTILOS            parâmetros de cada estilo (pressão, altura da linha, largura, risco, ritmo, compactação)
   - MT.tatica.treinador(nome)    perfil do treinador (ofensividade, adaptação), reproduzível pelo nome
   - MT.tatica.estiloInicial(...) estilo de partida conforme forças e perfil
   - MT.tatica.adapta(...)        troca de estilo durante o jogo (ou mantém)
   - MT.tatica.subs(...)          substituições: quem sai e quem entra
   - MT.tatica.melhorForm(...)    formação que melhor aproveita o elenco
   ============================================================ */
(()=>{
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),sig=x=>1/(1+Math.exp(-x));
  /* pres: intensidade da pressão (1 = normal); linha: altura da linha defensiva (-1 baixa .. 1 alta); largura: abertura do time;
     risco: gosto por passes verticais e chutes; ritmo: velocidade das ações; compacto: distância entre as linhas (menor = mais junto) */
  const ESTILOS={
    retranca:   {pres:.8, linha:-.8,largura:.9, risco:.2, ritmo:.95,compacto:.9},
    equilibrado:{pres:1,  linha:0,  largura:1,  risco:0,  ritmo:1,  compacto:1},
    posse:      {pres:1.05,linha:.3, largura:1.1,risco:-.4,ritmo:.95,compacto:1.05},
    pressao:    {pres:1.3,linha:.7, largura:1,  risco:.1, ritmo:1.06,compacto:.95},
    ofensivo:   {pres:1.1,linha:.5, largura:1.1,risco:.5, ritmo:1.04,compacto:1.02},
    desespero:  {pres:1.25,linha:.9, largura:1.15,risco:.9, ritmo:1.1,compacto:1.05}
  };
  const NOMES=Object.keys(ESTILOS);

  /* perfil do treinador: reproduzível pelo nome */
  function treinador(nome){
    const r=MT.rng('tec|'+nome);
    return{nome,ofensivo:clamp(r.gauss(0,.45),-1,1),adapt:r.range(.3,1),subs:r.range(.4,1)};
  }

  /* estilo inicial: o mais forte joga por cima, o mais fraco se fecha; o perfil do treinador desloca a escolha */
  function estiloInicial(forca,adv,tec,casa,rs){
    const d=(forca-adv)/8+(casa?.35:-.15)+tec.ofensivo*.9+rs.gauss(0,.35);
    if(d>1.6)return'pressao';if(d>.7)return'ofensivo';if(d>.1)return'posse';if(d>-.9)return'equilibrado';return'retranca';
  }

  /* adaptação durante o jogo. ctx = {min, saldo (gols a favor - contra), homens, homensAdv, chave}
     devolve {chave, motivo} ou null se mantém */
  function adapta(ctx,tec,rs){
    const{min,saldo,homens,homensAdv,chave}=ctx;
    if(!rs.chance(.45+.55*tec.adapt))return null;
    let novo=chave,motivo=null;
    if(homens<homensAdv){novo=saldo>0?'retranca':chave=='retranca'?'retranca':'equilibrado';motivo='com um a menos'}
    else if(homens>homensAdv&&saldo<=0){novo=saldo<0?'desespero':'pressao';motivo='com um a mais'}
    else if(saldo<0&&min>=55){novo=(saldo<=-2||min>=78)?'desespero':'ofensivo';motivo='atrás no placar'}
    else if(saldo>0&&min>=70){novo=saldo>=2||min>=82?'retranca':'equilibrado';motivo='protegendo a vantagem'}
    else if(saldo==0&&min>=80&&tec.ofensivo>.25){novo='ofensivo';motivo='buscando o gol no fim'}
    if(!novo||novo==chave)return null;
    return{chave:novo,motivo};
  }

  /* qualidade de um elenco numa formação: soma das notas, com desconto por jogador fora de posição */
  function melhorForm(avalia,formas){
    let b=null,bv=-1;
    for(const f of formas){const v=avalia(f);if(v>bv){bv=v;b=f}}
    return b;
  }

  /* substituições. ctx = {min, saldo, xi:[{cls,ovr,rt,am,exp,gk}], banco:[{cls,ovr}], feitas, janelas, ht}
     devolve [{out, in, motivo}] — respeita 5 trocas e 3 janelas (o intervalo não conta como janela) */
  function subs(ctx,tec,rs){
    const{min,saldo,xi,banco,feitas}=ctx,max=5-feitas;
    if(max<=0||!banco.length)return[];
    if(!ctx.ht&&ctx.janelas>=3)return[];
    /* quantas trocas nesta janela: mais perto do fim e mais para quem precisa do resultado */
    const urg=(min>=78?1:min>=68?.7:min>=58?.45:.25)*(saldo<0?1.35:saldo>0?.8:1)*(.5+.5*tec.subs);
    let n=0;for(let i=0;i<max;i++)if(rs.chance(clamp(urg*(1-.1*i),0,.95)))n++;
    if(ctx.ht)n=Math.min(n,rs.chance(.35)?1:0);
    if(!n)return[];
    /* quem sai: pior desempenho, cartão e posição que o jogo pede; goleiro e expulsos ficam */
    const procura=saldo<0?'ataque':saldo>0&&min>=70?'defesa':'neutro';
    const cand=xi.map((p,i)=>({p,i})).filter(o=>!o.p.gk&&!o.p.exp);
    const sc=o=>{
      let s=-(o.p.rt||0)*1.2-(o.p.ovr-65)/40+(o.p.am?.35:0)+rs.gauss(0,.25);
      if(procura=='ataque'&&['CB','DM','FB'].includes(o.p.cls))s+=.5;
      if(procura=='defesa'&&['ST','W','AM'].includes(o.p.cls))s+=.5;
      return s;
    };
    cand.sort((a,b)=>sc(b)-sc(a));
    const out=[],pool=banco.map((p,k)=>({p,k}));
    for(const o of cand){
      if(out.length>=n||!pool.length)break;
      /* entra: mesma função, ou a que o jogo pede */
      let alvo=o.p.cls;if(procura=='ataque'&&['CB','DM','FB'].includes(alvo))alvo=rs.chance(.6)?'ST':'W';
      if(procura=='defesa'&&['ST','W','AM'].includes(alvo))alvo=rs.chance(.5)?'DM':'CB';
      let cho=pool.filter(x=>x.p.cls==alvo).sort((a,b)=>b.p.ovr-a.p.ovr)[0]||pool.filter(x=>x.p.cls==o.p.cls).sort((a,b)=>b.p.ovr-a.p.ovr)[0]||pool.filter(x=>!x.p.gk).sort((a,b)=>b.p.ovr-a.p.ovr)[0];
      if(!cho)break;
      pool.splice(pool.indexOf(cho),1);
      out.push({out:o.i,in:cho.k,motivo:o.p.am?'cartão amarelo':procura=='ataque'?'buscar o resultado':procura=='defesa'?'segurar o resultado':o.p.rt<-.3?'rendimento':'renovar o time'});
    }
    return out;
  }

  /* posição-padrão de uma função no campo (u,v do próprio time), para quando a troca muda a função */
  const PADRAO={GK:.04,CB:.2,FB:.22,DM:.38,CM:.5,AM:.66,W:.8,ST:.88};

  MT.tatica={ESTILOS,NOMES,treinador,estiloInicial,adapta,melhorForm,subs,PADRAO};
})();
