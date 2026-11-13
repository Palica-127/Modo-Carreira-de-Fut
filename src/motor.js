'use strict';
/* ============================================================
   HABITE-SE 10 — MOTOR DE PARTIDAS (fundação, módulo 0)
   Sem dependências do jogo (nada de S, DOM ou Math.random): tudo aqui recebe
   o que precisa por parâmetro, para rodar em Node, em lote e com seed.

   - MT.rng(seed)        gerador reproduzível, com sub-fluxos independentes (fork)
   - MT.Log              registro único de lances (a "verdade" da partida)
   - MT.Stat / MT.lote   coleta e simulação em lote, para calibrar as fórmulas
   Os módulos seguintes (atributos, posse, regras, tática, VAR...) vão se apoiar nisto.
   ============================================================ */
const MT=(()=>{
  const VERSION=1;

  /* ---------- número aleatório com seed ---------- */
  /* texto -> inteiro de 32 bits (FNV-1a), usado para derivar seeds */
  const hs=s=>{let h=2166136261>>>0;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return h>>>0};
  function rng(seed){
    const base=(typeof seed=='number'?seed:hs(seed))>>>0;let a=base,n=0;
    const f=()=>{n++;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
    const o={
      seed:base,
      get calls(){return n},
      f,                                                  // [0,1)
      range:(x,y)=>x+f()*(y-x),                           // decimal em [x,y)
      int:(x,y)=>Math.floor(x+f()*(y-x+1)),               // inteiro em [x,y]
      chance:p=>f()<p,                                    // verdadeiro com probabilidade p
      pick:arr=>arr[Math.floor(f()*arr.length)],
      /* normal (Box-Muller): média mu, desvio sd */
      gauss:(mu=0,sd=1)=>{const u=Math.max(1e-12,f()),v=f();return mu+sd*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)},
      /* escolha ponderada: items=[x...], w=x=>peso (>=0); devolve o item (ou null se todos 0) */
      weighted:(items,w)=>{let t=0;const ws=items.map(x=>{const v=Math.max(0,w(x));t+=v;return v});if(t<=0)return null;let r=f()*t;for(let i=0;i<items.length;i++){r-=ws[i];if(r<=0)return items[i]}return items[items.length-1]},
      shuffle:arr=>{const b=arr.slice();for(let i=b.length-1;i>0;i--){const j=Math.floor(f()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b},
      /* sub-fluxo independente: cada sistema usa o seu, e mexer num não muda o resultado dos outros */
      fork:label=>rng(hs(base+'|'+label))
    };
    return o;
  }

  /* ---------- registro de lances ---------- */
  /* Tipos de lance aceitos. O registro recusa tipos desconhecidos, para pegar erro de digitação. */
  const EV=['inicio','fim_tempo','fim','posse','passe','lancamento','cruzamento','conducao','drible','desarme','intercepta','recuperou','perdeu',
    'chute','bloqueio','defesa','trave','gol','assistencia','falta','vantagem','cartao','impedimento','lateral','escanteio','tiro_meta','penalti',
    'tiro_livre','mao','var','substituicao','lesao','acrescimo','prorrogacao','penaltis','tatica','narra'];
  const EVSET=new Set(EV);
  /* Cada lance: i (ordem), t (segundos de jogo), k (tipo), s (time 0 casa/1 fora), p (jogador que agiu, índice no XI/elenco),
     q (jogador envolvido), x,y (posição 0..1, o time 0 ataca para x=1), o (resultado: 'ok'|'falha'|...), d (dados extras) */
  function Log(){
    const ev=[];let last=-1;
    const L={
      ev,
      add(k,t,o){
        if(!EVSET.has(k))throw new Error('lance desconhecido: '+k);
        if(!(t>=last))throw new Error('tempo retrocedeu: '+t+' < '+last+' ('+k+')');
        last=t;const e={i:ev.length,t:Math.round(t*100)/100,k,...(o||{})};ev.push(e);return e;
      },
      by:k=>ev.filter(e=>e.k==k),
      count:(k,s)=>ev.reduce((n,e)=>n+(e.k==k&&(s==null||e.s==s)?1:0),0),
      /* até o minuto m (inclusive) */
      until:m=>ev.filter(e=>e.t<=m*60),
      /* impressão digital do registro: serve para provar que duas partidas são idênticas */
      digest(){let h=2166136261>>>0;const s=JSON.stringify(ev);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return h.toString(16).padStart(8,'0')},
      toJSON:()=>ev
    };
    return L;
  }

  /* ---------- estatística e simulação em lote ---------- */
  function Stat(){
    const m={};
    const S_={
      add(n,v){const x=m[n]||(m[n]={n:0,s:0,q:0,mn:Infinity,mx:-Infinity,h:{}});x.n++;x.s+=v;x.q+=v*v;if(v<x.mn)x.mn=v;if(v>x.mx)x.mx=v;const b=Math.round(v);x.h[b]=(x.h[b]||0)+1},
      mean:n=>m[n]?m[n].s/m[n].n:NaN,
      sd:n=>{const x=m[n];if(!x||x.n<2)return NaN;return Math.sqrt(Math.max(0,x.q/x.n-Math.pow(x.s/x.n,2)))},
      n:n=>m[n]?m[n].n:0,
      hist:n=>m[n]?m[n].h:{},
      /* proporção de valores >= v */
      share:(n,v)=>{const x=m[n];if(!x)return NaN;let c=0;for(const b in x.h)if(+b>=v)c+=x.h[b];return c/x.n},
      names:()=>Object.keys(m),
      report(){return S_.names().map(n=>({nome:n,n:m[n].n,media:+S_.mean(n).toFixed(3),dp:+S_.sd(n).toFixed(3),min:m[n].mn,max:m[n].mx}))}
    };
    return S_;
  }
  /* roda n partidas: sim(seed, i) -> objeto com números (ou array [nome,valor]); soma tudo num Stat */
  function lote(sim,n,seed0=1){
    const st=Stat();
    for(let i=0;i<n;i++){
      const r=sim(seed0+i,i);
      if(r)Object.entries(r).forEach(([k,v])=>{if(typeof v=='number'&&isFinite(v))st.add(k,v)});
    }
    return st;
  }
  return{VERSION,hs,rng,EV,Log,Stat,lote};
})();
