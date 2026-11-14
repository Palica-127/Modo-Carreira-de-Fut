'use strict';
/* ============================================================
   FORMATOS DE ACESSO E REBAIXAMENTO (regulamentos 2025/26)
   FMT[liga][d] descreve a fronteira entre a divisão d (de cima) e a d+1 (de baixo):
     a    acessos diretos (os primeiros da divisão de baixo)
     po   [ini,fim] posições (1-based) que disputam o mata-mata de acesso; w = vagas que ele dá
     quad 1 = os 8 primeiros jogam dois quadrangulares (1,4,5,8 / 2,3,6,7); 2 primeiros de cada grupo sobem
     vs   1 = o vencedor do mata-mata (ou o próximo da fila) enfrenta o clube da divisão de cima na repescagem
   A divisão de cima rebaixa o mesmo número de clubes que sobem diretamente (fmtUp).
   Os jogos extras são simulados no fim da temporada (ida e volta, com a força dos clubes).
   ============================================================ */
const FMT={
  BRA:[{a:2,po:[3,6],w:2},{a:0,quad:1}],                       // Série B: 2 diretos + mata-mata 3º-6º (2 vagas); Série C: quadrangulares
  ENG:[{a:2,po:[3,6],w:1},{a:2,po:[3,6],w:1},{a:3,po:[4,7],w:1}],
  ESP:[{a:2,po:[3,6],w:1},{a:2,po:[3,6],w:2}],
  ITA:[{a:2,po:[3,8],w:1},{a:3,po:[4,9],w:1}],
  GER:[{a:2,vs:1},{a:2,vs:1}],                                 // 3º da divisão de baixo x 16º da de cima
  FRA:[{a:2,po:[3,5],w:1,vs:1}],
  POR:[{a:2,vs:1}],
  NED:[{a:2,po:[3,8],w:1,vs:1}],
  ARG:[{a:1,po:[2,9],w:1}],                                    // campeão (final das zonas) + vencedor do Reducido
  TUR:[{a:2,po:[3,6],w:1}]
};
/* divisões de turno único (sem returno): Série C do Brasileiro */
const SINGLE={BRA2:1};
const fmtOf=(k,d)=>(FMT[k]||[])[d]||{a:2};
const fmtUp=f=>(f.a||0)+(f.po&&!f.vs?f.w:0)+(f.quad?4:0);        // quantos sobem sem repescagem = quantos caem direto
/* divisão d da liga: o que o regulamento diz sobre ela (para tabela e legenda) */
function fmtZones(l,d){
  const L=LEAGUES[l],nd=L.dn.length,z={up:0,po:null,quad:0,rep:-1,dn:0,N:0};
  if(d>0){const f=fmtOf(L.k,d-1);z.up=f.a||0;z.po=f.po||null;z.quad=f.quad?8:0;if(f.vs&&!f.po)z.repLow=f.a}
  if(d<nd-1){const f=fmtOf(L.k,d),P=fmtUp(f);z.dn=P;if(f.vs)z.rep=P+1}   // rep: posição contada de baixo para cima
  return z;
}
const fmPois=m=>{const e=Math.exp(-m);let k=0,p=1;do{k++;p*=Math.random()}while(p>e);return k-1};
function fmGame(a,b,neu){const d=(S.cs[a].s-S.cs[b].s)/30;return[fmPois(Math.max(.2,1.3*Math.exp(d/2)*(neu?1:1.1))),fmPois(Math.max(.2,1.1*Math.exp(-d/2)))]}
/* confronto de ida e volta; empate no agregado vai aos pênaltis. t = {n:rótulo, a, b, w, s:'placar'} */
function fmTie(a,b,nome,log){
  const g1=fmGame(a,b),g2=fmGame(b,a),A=g1[0]+g2[1],B=g1[1]+g2[0];let w,pen='';
  if(A!=B)w=A>B?a:b;else{const pa=C(.5+(S.cs[a].s-S.cs[b].s)/200,.35,.65);w=Math.random()<pa?a:b;pen=' (pên.)'}
  log.push({r:nome,a,b,w,s:`${g1[0]}-${g1[1]} / ${g2[1]}-${g2[0]}${pen}`});
  return{w,l:w==a?b:a};
}
/* mata-mata por seeds até sobrarem w clubes; se não for potência de 2, os piores seeds jogam uma fase prévia */
function fmKO(ids,w,log){
  let t=[...ids];
  while(t.length>w){
    const n=t.length;let p=1;while(p*2<=n)p*=2;
    const pre=n>p?n-p:0;                    // clubes que jogam fase prévia: os 2*pre piores seeds
    const keep=pre?t.slice(0,n-2*pre):[],pl=pre?t.slice(n-2*pre):t,nx=[];
    const nome=(pre?'Fase prévia':pl.length>=8?'Quartas de final':pl.length==4?(w>=2?'Semifinal (vaga de acesso)':'Semifinal'):pl.length==2?'Final':'Rodada');
    for(let i=0;i<pl.length/2;i++)nx.push(fmTie(pl[pl.length-1-i],pl[i],nome,log).w);
    t=[...keep,...nx];
  }
  return t;
}
/* quadrangulares de acesso (Série C): 8 primeiros em 2 grupos de 4, turno e returno; 2 primeiros de cada grupo sobem; os líderes fazem a final */
function fmQuad(f8,log){
  const G=[[0,3,4,7],[1,2,5,6]].map(ix=>ix.map(i=>f8[i])),up=[],lead=[];
  G.forEach((g,gi)=>{
    const T={};g.forEach(id=>T[id]={id,P:0,G:0,S:0});
    for(const a of g)for(const b of g){if(a==b)continue;const[x,y]=fmGame(a,b);T[a].G+=x;T[b].G+=y;T[a].S+=x-y;T[b].S+=y-x;if(x>y)T[a].P+=3;else if(y>x)T[b].P+=3;else{T[a].P++;T[b].P++}}
    const r=Object.values(T).sort((p,q)=>q.P-p.P||q.S-p.S||q.G-p.G);
    log.push({r:'Quadrangular '+'AB'[gi],tab:r.map(x=>({id:x.id,p:x.P,s:x.S}))});
    up.push(r[0].id,r[1].id);lead.push(r[0].id);
  });
  const fin=fmTie(lead[0],lead[1],'Final do campeonato',log);
  return{up,ch:fin.w};
}
/* resolve todas as fronteiras: devolve quem sobe/desce e o registro dos jogos extras por divisão */
function fmMoves(fin){
  const up=[],dn=[],lg={},champ={};
  LEAGUES.forEach((L,li)=>{for(let d=0;d<L.dn.length-1;d++){
    const f=fmtOf(L.k,d),U=fin[li+'-'+d],W=fin[li+'-'+(d+1)],P=fmtUp(f),log=[],ups=W.slice(0,f.a||0);let chal=null;
    if(f.quad){const q=fmQuad(W.slice(0,8),log);ups.push(...q.up);champ[li+'-'+(d+1)]=q.ch}
    else if(f.po){const w=fmKO(W.slice(f.po[0]-1,f.po[1]),f.w,log);if(f.vs)chal=w[0];else ups.push(...w)}
    else if(f.vs)chal=W[f.a];
    const downs=U.slice(U.length-P);
    if(f.vs&&chal!=null){const h=U[U.length-P-1],t=fmTie(chal,h,'Repescagem de acesso',log);if(t.w==chal){ups.push(chal);downs.push(h)}}
    up.push(...ups);dn.push(...downs);
    if(log.length){lg[li+'-'+(d+1)]=(lg[li+'-'+(d+1)]||[]).concat(log);if(f.vs){const rp=log.filter(t=>t.r=='Repescagem de acesso');if(rp.length)lg[li+'-'+d]=rp}}
  }});
  return{up,dn,lg,champ};
}
