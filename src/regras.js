'use strict';
/* ============================================================
   MOTOR DE PARTIDAS — módulo 4: REGRAS (IFAB)
   Funções puras das leis do jogo: impedimento, faltas, cartões, pênalti, acréscimos.
   O motor da posse chama estas funções e só aplica o resultado (registra o lance, move a bola).

   - MT.regras.impedimento(recU, bolaU, linhaU[])   Lei 11, posição na hora do passe
   - MT.regras.pFalta(tipo, def, atk, ctx)          chance de a disputa virar falta
   - MT.regras.cartao(f, rs)                         'amarelo' | 'vermelho' | null (Lei 12)
   - MT.regras.penalti(cobr, gk, rs)                 desfecho da cobrança (Lei 14)
   - MT.regras.dentroArea(u,v)                       grande área (16,5 m x 40,3 m)
   - MT.regras.acrescimo(seg)                        minutos adicionados a partir do tempo perdido
   ============================================================ */
(()=>{
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),sig=x=>1/(1+Math.exp(-x));
  const PW=105,PH=68;
  const RG={
    imp:{perdeu:.05,falso:.01},                   // erro do assistente: não marca impedimento / marca sem existir
    falta:{tackle:.68,drib:.78,cond:.3,aereo:.04,recep:.05},   // chance-base de a disputa virar falta
    amarelo:{base:.09,agr:.1,tatica:.2,area:.05,contra:.06},
    vermelho:{violento:.0012,dogsoFora:.3,dogsoArea:.035,agr:.006},
    pen:{base:.76,pen:250,cmp:500,gk:400,erra:.08,rebote:.1},
    tempo:{falta:6,cartao:30,gol:45,var:90,lesao:60,sub:30,pen:40}, // segundos perdidos por ocorrência (viram acréscimo)
    acr:{min:1,max:8}
  };

  /* Lei 11: impedido quem, na hora do passe, está na metade adversária e mais perto da linha de fundo
     que a bola e que o penúltimo adversário. Tudo em coordenadas do ATACANTE (u cresce rumo ao gol que ele ataca). */
  function impedimento(recU,bolaU,advUs){
    const o=advUs.slice().sort((a,b)=>b-a),pen=o.length>1?o[1]:o[0];
    const linha=Math.max(bolaU,pen);
    return{imp:recU>.5&&recU>linha+1e-9,linha,margem:recU-linha};
  }

  /* grande área: 16,5 m de fundo e 40,32 m de largura, em (u,v) do atacante */
  const dentroArea=(u,v)=>(1-u)*PW<=16.5&&Math.abs(v-.5)*PH<=20.16;

  /* chance de uma disputa terminar em falta: agressividade e desarme ruim do defensor aumentam; atacante
     habilidoso/ágil é mais difícil de marcar limpo (então leva mais falta); ctx.rig é o rigor do árbitro */
  function pFalta(tipo,d,a,rig=1){
    const b=RG.falta[tipo]||.1;
    const f=(.55+.9*sig((d.agr-50)/22))*(1.35-.6*sig((d.des+d.mar-110)/35))*(.8+.4*sig((a.dri+a.agi-110)/35));
    return clamp(b*f*rig,0,.9);
  }

  /* Lei 12. f = {agr, tatica (parou contra-ataque), dogso:'fora'|'area'|null, area, amarelos (do infrator), rig}
     devolve {c:'amarelo'|'vermelho'|null, segundo:boolean, motivo:'...'} */
  function cartao(f,rs){
    const rig=f.rig||1,ag=f.agr/100;
    if(f.dogso){
      const pv=f.dogso=='fora'?RG.vermelho.dogsoFora:RG.vermelho.dogsoArea;
      if(rs.chance(clamp(pv*rig,0,.9)))return{c:'vermelho',segundo:false,motivo:'anular chance clara de gol'};
    }
    if(rs.chance(clamp((RG.vermelho.violento+RG.vermelho.agr*ag)*rig,0,.2)))return{c:'vermelho',segundo:false,motivo:'jogada violenta'};
    let p=RG.amarelo.base+RG.amarelo.agr*ag+(f.tatica?RG.amarelo.tatica:0)+(f.dogso?RG.amarelo.contra*4:0)+(f.area?RG.amarelo.area:0);
    p=clamp(p*rig*(f.amarelos>=1?.22:1),0,.95);
    if(!rs.chance(p))return{c:null};
    if(f.amarelos>=1)return{c:'vermelho',segundo:true,motivo:'segundo amarelo'};
    return{c:'amarelo',segundo:false,motivo:f.tatica?'falta tática':'falta imprudente'};
  }

  /* Lei 14: cobrança de pênalti. pen e compostura do cobrador contra reflexos e um contra um do goleiro */
  function penalti(c,g,rs){
    const P=RG.pen;
    const p=clamp(P.base+(c.pen-65)/P.pen+(c.cmp-65)/P.cmp-((g.ref+g.um1)/2-65)/P.gk,.45,.93);
    const r=rs.f(),r2=rs.f();
    const erra=clamp(P.erra-(c.pen-65)/700-(c.cmp-65)/900,.015,.2);    // chuta fora/na trave por erro do cobrador
    if(r<erra)return{res:r2<.35?'trave':'fora',p};
    if(r2<p)return{res:'gol',p};
    return{res:'defesa',p,rebote:rs.f()<P.rebote};
  }

  /* minutos adicionados a partir dos segundos perdidos no período (arredonda e limita) */
  function acrescimo(seg){return clamp(Math.round(seg/60),RG.acr.min,RG.acr.max)}

  MT.REGRAS=RG;
  MT.regras={impedimento,dentroArea,pFalta,cartao,penalti,acrescimo};
})();
