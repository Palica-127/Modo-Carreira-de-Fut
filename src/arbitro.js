'use strict';
/* ============================================================
   MOTOR DE PARTIDAS — módulo 7: ARBITRAGEM E VAR
   - MT.arbitro(nome)  perfil do árbitro, reproduzível pelo nome:
       rig    rigor (0,8 brando .. 1,25 rigoroso): multiplica a chance de marcar faltas e dar cartões
       erro   chance-base de erro de apreciação (0,02 .. 0,07)
       vant   gosto pela vantagem
   - MT.VAR   o que o árbitro de vídeo revisa (gols, pênaltis, vermelhos diretos), a chance de ele
              corrigir um erro CLARO e o tempo que a revisão toma.
   O motor da posse decide quando um erro aconteceu; aqui ficam só os números e o perfil.
   ============================================================ */
(()=>{
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function arbitro(nome){
    const r=MT.rng('arb|'+nome);
    return{nome,rig:clamp(r.gauss(1,.12),.8,1.25),erro:clamp(r.gauss(.04,.012),.02,.07),vant:clamp(r.gauss(1,.15),.7,1.3)};
  }
  const VAR={
    det:.88,                       // chance de o VAR corrigir um erro claro
    simulacao:.15,                 // fração das "faltas" na área que são simulação
    tempo:{min:60,max:150},        // segundos que a revisão toma
    janela:25,                     // até quantos segundos antes do gol uma infração ainda é revisada
    erroExcessivo:4,erroDogso:6, // multiplicadores de 'erro' para vermelho excessivo e para vermelho não dado
    erroSimula:5,                  // multiplicador de 'erro' para o árbitro cair na simulação
    erroApita:2.2                   // multiplicador de 'erro' para não marcar uma falta que existiu
  };
  MT.VAR=VAR;MT.arbitro=arbitro;
})();
