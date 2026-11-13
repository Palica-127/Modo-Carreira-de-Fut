'use strict';
/* ============================================================
   MOTOR DE PARTIDAS — módulo 8: ESTATÍSTICAS E NARRAÇÃO
   Tudo aqui é LIDO do registro de lances (r.log.ev) — nenhuma estatística é sorteada.
   - MT.minutos(r)         {fmt(t)->"45+2'", n(t)->minuto numérico} a partir dos acréscimos e períodos
   - MT.jogadores(r)       quem estava em cada posição em cada instante (considera substituições)
   - MT.estat(r)           estatísticas por time, lidas do registro
   - MT.estatJog(r)        estatísticas, minutos e nota (3–10) de cada jogador
   - MT.calor(r,s,nome)    mapa de calor 12x8 do jogador (time sempre atacando para a direita)
   - MT.narra(r)           narração em português, uma linha por lance relevante
   ============================================================ */
(()=>{
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  /* ---------- tempo ---------- */
  function minutos(r){
    const ev=r.log.ev,ft=ev.find(e=>e.k=='fim_tempo'),t1=ft?ft.t:2700,pr=ev.filter(e=>e.k=='prorrogacao'),fim=ev[ev.length-1].t;
    const base=t=>{
      if(pr.length&&t>=pr[0].t){const p2=pr[1]&&t>=pr[1].t,b0=p2?pr[1].t:pr[0].t,m=Math.floor((t-b0)/60),lim=15,off=p2?105:90;return m>=lim?{n:off+lim,x:m-lim+1}:{n:off+m+1,x:0}}
      if(t<t1){const m=Math.floor(t/60);return m>=45?{n:45,x:m-45+1}:{n:m+1,x:0}}
      const m=Math.floor((t-t1)/60);return m>=45?{n:90,x:m-45+1}:{n:46+m,x:0};
    };
    const fmt=t=>{const b=base(t);return b.x?b.n+'+'+b.x+"'":b.n+"'"};
    return{fmt,n:t=>{const b=base(t);return b.n+b.x},base,t1,fim};
  }

  /* ---------- quem jogava onde ---------- */
  function jogadores(r){
    const ev=r.log.ev,sl=[0,1].map(s=>r.ini[s].map(p=>[{n:p.n,de:0,ate:Infinity}]));
    ev.filter(e=>e.k=='substituicao').forEach(e=>{const l=sl[e.s][e.p],u=l[l.length-1];u.ate=e.t;l.push({n:e.d.entra,de:e.t,ate:Infinity})});
    ev.filter(e=>e.k=='cartao'&&e.o=='vermelho').forEach(e=>{const l=sl[e.s][e.p],u=l[l.length-1];if(u.ate==Infinity)u.ate=e.t});
    ev.filter(e=>e.k=='lesao'&&e.d.semTroca&&e.d.gravidade=='grave').forEach(e=>{const l=sl[e.s][e.p],u=l[l.length-1];if(u.ate==Infinity)u.ate=e.t});
    const quem=(s,i,t)=>{const l=sl[s][i];if(!l)return '?';let u=l[0];for(const x of l)if(t>=x.de)u=x;return u.n};
    return{quem,slots:sl};
  }

  /* ---------- estatísticas por time ---------- */
  const novoTime=()=>({gols:0,chutes:0,alvo:0,bloq:0,fora:0,xg:0,defesas:0,grandes:0,pas:0,pasOk:0,cruz:0,cruzOk:0,lanc:0,desarmes:0,desOk:0,inter:0,dribles:0,dribOk:0,faltas:0,amarelos:0,vermelhos:0,imped:0,escanteios:0,laterais:0,penaltis:0,subs:0,lesoes:0,tiroMeta:0,posse:0,perdas:0,var:0,trave:0});
  function estat(r){
    const ev=r.log.ev,X=[novoTime(),novoTime()];
    let prev=null;
    const POS=['passe','lancamento','cruzamento','conducao','drible','chute','recuperou','tiro_livre','escanteio','lateral','penalti','tiro_meta'];
    for(let i=0;i<ev.length;i++){
      const e=ev[i],s=e.s,x=s!=null?X[s]:null;
      /* posse: o tempo até o próximo lance conta para o time do lance anterior que tem a bola */
      if(prev!=null&&i>0){const dt=e.t-ev[i-1].t;if(dt>0&&ev[i-1].k!='fim_tempo'&&ev[i-1].k!='acrescimo'&&ev[i-1].k!='var')X[prev].posse+=dt}
      if(POS.includes(e.k)&&s!=null)prev=s;
      if(e.k=='gol'&&e.d&&e.d.anulado){x.alvo++;continue}
      switch(e.k){
        case 'passe':case 'lancamento':x.pas++;if(e.o=='ok')x.pasOk++;else x.perdas++;if(e.k=='lancamento')x.lanc++;break;
        case 'cruzamento':if(!(e.d&&e.d.origem)){x.pas++;x.cruz++;if(e.o=='ok'){x.pasOk++;x.cruzOk++}else x.perdas++}break;
        case 'chute':x.chutes++;x.xg+=e.d.xg;if(e.d.grande)x.grandes++;break;
        case 'gol':x.gols++;x.alvo++;break;
        case 'defesa':X[1-s].alvo++;x.defesas++;break;
        case 'bloqueio':x.bloq++;break;
        case 'trave':x.trave++;break;
        case 'desarme':x.desarmes++;if(e.o=='ok')x.desOk++;break;
        case 'intercepta':x.inter++;X[1-s].pas++;X[1-s].perdas++;break;
        case 'drible':x.dribles++;if(e.o=='ok')x.dribOk++;break;
        case 'falta':x.faltas++;break;
        case 'cartao':if(e.o=='amarelo')x.amarelos++;else x.vermelhos++;break;
        case 'impedimento':x.imped++;x.pas++;x.perdas++;break;
        case 'escanteio':x.escanteios++;break;
        case 'lateral':x.laterais++;break;
        case 'penalti':x.penaltis++;break;
        case 'substituicao':x.subs++;break;
        case 'lesao':x.lesoes++;break;
        case 'tiro_meta':x.tiroMeta++;break;
        case 'var':x.var++;break;
      }
    }
    for(const s of [0,1])X[s].fora=Math.max(0,X[s].chutes-X[s].alvo-X[1-s].bloq);
    const tot=X[0].posse+X[1].posse||1;X[0].posseP=100*X[0].posse/tot;X[1].posseP=100*X[1].posse/tot;
    return X;
  }

  /* ---------- por jogador ---------- */
  function estatJog(r){
    const ev=r.log.ev,J=jogadores(r),M=minutos(r),fim=ev[ev.length-1].t,out=[{},{}];
    const get=(s,i,t)=>{const n=J.quem(s,i,t);return out[s][n]||(out[s][n]={nome:n,slot:i,cls:r.ini[s][i]?r.ini[s][i].cls:'',gols:0,assist:0,chutes:0,alvo:0,xg:0,pas:0,pasOk:0,cruz:0,desarmes:0,inter:0,dribles:0,dribOk:0,faltas:0,amarelos:0,vermelhos:0,defesas:0,sofridos:0,bloq:0,perdas:0,min:0,pts:0})};
    /* minutos em campo */
    for(const s of [0,1])J.slots[s].forEach((l,i)=>l.forEach(u=>{const o=get(s,i,u.de);o.min+=((Math.min(u.ate,fim)-u.de)/60)}));
    for(const e of ev){
      if(e.p==null||e.s==null)continue;
      if(e.k=='gol'&&e.d&&e.d.anulado){get(e.s,e.p,e.t).alvo++;continue}
      const o=get(e.s,e.p,e.t);
      switch(e.k){
        case 'passe':case 'lancamento':o.pas++;if(e.o=='ok'){o.pasOk++;o.pts+=.012}else{o.perdas++;o.pts-=.03}break;
        case 'cruzamento':if(!(e.d&&e.d.origem)){o.pas++;o.cruz++;if(e.o=='ok'){o.pasOk++;o.pts+=.02}else{o.perdas++;o.pts-=.02}}break;
        case 'chute':o.chutes++;o.xg+=e.d.xg;if(e.d.grande)o.pts-=.2*0;break;
        case 'gol':{o.gols++;o.alvo++;o.pts+=1.0;const g=get(1-e.s,0,e.t);g.sofridos++;g.pts-=.3;break}
        case 'assistencia':o.assist++;o.pts+=.7;break;
        case 'defesa':o.defesas++;o.pts+=.25;break;
        case 'bloqueio':o.bloq++;o.pts+=.1;break;
        case 'desarme':if(e.o=='ok'){o.desarmes++;o.pts+=.12}break;
        case 'intercepta':o.inter++;o.pts+=.12;break;
        case 'drible':o.dribles++;if(e.o=='ok'){o.dribOk++;o.pts+=.1}else o.pts-=.1;break;
        case 'falta':o.faltas++;o.pts-=.1;break;
        case 'cartao':if(e.o=='amarelo'){o.amarelos++;o.pts-=.3}else{o.vermelhos++;o.pts-=1.5}break;
      }
      if(e.k=='chute'&&e.d.grande)o.pts+=.05;
    }
    /* alvo: chutes defendidos/gols; o resultado do time e a baliza invicta entram na nota */
    for(const e of ev){if(e.k=='defesa'&&e.q!=null){const sh=get(1-e.s,e.q,e.t);sh.alvo++}}
    const res=[0,1].map(s=>Math.sign(r.g[s]-r.g[1-s]));
    const lista=[];
    for(const s of [0,1])for(const n in out[s]){
      const o=out[s][n];o.s=s;
      const bonus=res[s]*.3+(o.cls=='GK'||o.cls=='CB'||o.cls=='FB'||o.cls=='DM'?(r.g[1-s]==0?.3:0):0);
      const peso=clamp(o.min/60,.2,1);
      o.nota=+clamp(6+(o.pts+bonus)*peso,3,10).toFixed(1);
      lista.push(o);
    }
    lista.sort((a,b)=>b.nota-a.nota||b.gols-a.gols);
    return{lista,melhor:lista[0],por:out};
  }

  /* ---------- mapa de calor ---------- */
  function calor(r,s,nome){
    const J=jogadores(r),g=Array.from({length:8},()=>Array(12).fill(0));let n=0;
    for(const e of r.log.ev){
      if(e.p==null||e.s!==s||e.x==null||e.y==null)continue;
      if(!['passe','lancamento','cruzamento','conducao','drible','chute','desarme','recuperou','falta','intercepta','bloqueio'].includes(e.k))continue;
      if(J.quem(s,e.p,e.t)!==nome)continue;
      const u=s?1-e.x:e.x,v=s?1-e.y:e.y;g[Math.min(7,Math.floor(clamp(v,0,.9999)*8))][Math.min(11,Math.floor(clamp(u,0,.9999)*12))]++;n++;
    }
    return{grade:g,n};
  }

  /* ---------- narração ---------- */
  const PICK=(rs,a)=>a[Math.floor(rs.f()*a.length)];
  function narra(r){
    const ev=r.log.ev,M=minutos(r),J=jogadores(r),rs=MT.rng('narra|'+r.log.digest()),T=r.T,nome=s=>T[s].nome;
    const L=[],G=[0,0];
    const w=(e,txt,k,dest)=>L.push({t:e.t,min:M.fmt(e.t),n:M.n(e.t),txt:txt,k:k||e.k,destaque:!!dest,s:e.s});
    const q=(s,i,t)=>J.quem(s,i,t);
    const pl=()=>G[0]+' a '+G[1];
    for(let i=0;i<ev.length;i++){
      const e=ev[i],nx=ev[i+1];
      switch(e.k){
        case 'inicio':w(e,PICK(rs,['Rola a bola! '+nome(0)+' x '+nome(1)+'.','Começa o jogo: '+nome(0)+' recebe o '+nome(1)+'.','Apita o árbitro e a bola rola para '+nome(0)+' e '+nome(1)+'.']));break;
        case 'tatica':if(e.d.minuto===0)w(e,nome(e.s)+' vai a campo no '+e.d.form+', com estilo '+e.d.estilo+' (treinador '+e.d.treinador+').','tatica');else w(e,nome(e.s)+' muda o jogo: '+e.d.estilo+' ('+e.d.motivo+').','tatica');break;
        case 'acrescimo':w(e,'O árbitro indica '+e.d.min+' minuto'+(e.d.min>1?'s':'')+' de acréscimo no '+(e.d.periodo==1?'primeiro':'segundo')+' tempo.');break;
        case 'fim_tempo':w(e,'Fim do primeiro tempo: '+nome(0)+' '+pl()+' '+nome(1)+'.');break;
        case 'prorrogacao':w(e,e.d.periodo==1?'Empate no tempo normal: vamos à prorrogação!':'Começa o segundo tempo da prorrogação.');break;
        case 'penaltis':if(e.d&&e.d.inicio)w(e,'Decisão por pênaltis!');else{const p=q(e.s,e.p,e.t);w(e,p+(e.o=='gol'?' converte ':e.o=='defesa'?' tem a cobrança defendida ':' manda para fora ')+'— '+e.d.placar[0]+' a '+e.d.placar[1]+'.','penaltis',true)}break;
        case 'gol':{
          const p=q(e.s,e.p,e.t),anul=e.d&&e.d.anulado,pen=e.d&&e.d.penalti,ass=nx&&nx.k=='assistencia'?q(nx.s,nx.p,nx.t):null,ch=ev[i-1],xg=ch&&ch.k=='chute'?ch.d.xg:null;
          if(anul){w(e,'GOL de '+p+' para o '+nome(e.s)+'... mas o lance será revisado.','gol');break}
          G[e.s]++;
          const base=pen?PICK(rs,['GOL! '+p+' bate o pênalti com categoria.','GOL de pênalti! '+p+' não perdoa.','Na cobrança, '+p+' converte.']):
            xg!=null&&xg<.04?PICK(rs,['GOLAÇO! '+p+' arrisca de longe e acerta o ângulo.','Que pancada de '+p+'! Gol improvável.']):
            ass?PICK(rs,['GOL! '+p+' finaliza após assistência de '+ass+'.',ass+' serve e '+p+' não desperdiça: GOL!','É GOL! '+p+' completa o passe de '+ass+'.']):
            PICK(rs,['GOL! '+p+' finaliza e balança a rede.','Bola na rede! '+p+' marca.','Gol de '+p+'!']);
          w(e,base+' '+nome(0)+' '+pl()+' '+nome(1)+'.','gol',true);break}
        case 'var':{const p=e.p!=null?q(e.s,e.p,e.t):null;
          const m={'gol:anulado':'VAR: gol anulado por '+e.d.motivo+'.','penalti:anulado':'VAR: pênalti cancelado — '+e.d.motivo+(p?' de '+p:'')+'.','penalti:concedido':'VAR: pênalti concedido ('+e.d.motivo+').','vermelho:revertido':'VAR: cartão vermelho revertido para amarelo'+(p?' ('+p+')':'')+'.','vermelho:concedido':'VAR: expulsão confirmada'+(p?' para '+p:'')+' ('+e.d.motivo+').'}[e.d.tipo+':'+e.d.resultado];
          w(e,m||'VAR revisa o lance.','var',true);break}
        case 'chute':{
          if(nx&&(nx.k=='gol'||nx.k=='penalti'))break;
          const p=q(e.s,e.p,e.t);if(e.d.tipo=='penalti')break;
          const f=nx&&nx.k=='defesa'?'defesa':nx&&nx.k=='trave'?'trave':nx&&nx.k=='bloqueio'?'bloq':'fora';
          if(f=='defesa'&&nx.d&&nx.d.penalti){w(e,q(nx.s,nx.p,nx.t)+' defende o pênalti de '+p+'!','defesa',true);break}
          if(e.d.xg<.12&&f!='defesa'&&f!='trave')break;
          const tp=e.d.tipo=='cabeca'?' de cabeça':e.d.tipo=='falta'?' de falta':'';
          if(f=='defesa')w(e,PICK(rs,[q(nx.s,nx.p,nx.t)+' defende o chute'+tp+' de '+p+'.','Boa defesa de '+q(nx.s,nx.p,nx.t)+' no chute'+tp+' de '+p+'.']),'chute');
          else if(f=='trave')w(e,p+' acerta a trave! Quase.','chute',true);
          else if(f=='bloq')w(e,'Chute'+tp+' de '+p+' é bloqueado.','chute');
          else w(e,p+' finaliza'+tp+' e a bola passa perto.','chute');
          break}
        case 'falta':{const f=q(e.s,e.p,e.t),v=q(1-e.s,e.q,e.t);
          if(e.d.simulacao){w(e,v+' cai na área e o árbitro marca pênalti...','falta');break}
          if(e.d.area){w(e,'Pênalti! '+f+' derruba '+v+' na área.','falta',true);break}
          const c=nx&&nx.k=='cartao'?nx:null;
          if(c)break;
          if(e.d.vantagem)break;
          if(i%3==0||e.d.dogso)w(e,'Falta de '+f+' em '+v+'.','falta');
          break}
        case 'cartao':{const p=q(e.s,e.p,e.t);w(e,(e.o=='amarelo'?'Cartão amarelo para '+p:'EXPULSO! Cartão vermelho para '+p)+' ('+e.d.motivo+').','cartao',e.o=='vermelho');break}
        case 'vantagem':w(e,'O árbitro manda seguir: vantagem para o '+nome(e.s)+'.','vantagem');break;
        case 'impedimento':{const p=q(e.s,e.p,e.t);w(e,p+' estava impedido.','impedimento');break}
        case 'escanteio':w(e,'Escanteio para o '+nome(e.s)+', cobrança de '+q(e.s,e.p,e.t)+'.','escanteio');break;
        case 'penalti':w(e,q(e.s,e.p,e.t)+' se prepara para a cobrança.','penalti');break;
        case 'lesao':w(e,'Atendimento médico: '+q(e.s,e.p,e.t)+' sente '+(e.d.tipo=='contato'?'o choque':'uma lesão')+' ('+e.d.gravidade+').','lesao');break;
        case 'substituicao':w(e,nome(e.s)+': sai '+e.d.sai+', entra '+e.d.entra+' ('+e.d.motivo+').','substituicao');break;
        case 'defesa':if(e.d&&e.d.penalti)break;break;
        case 'fim':{const ps=r.pen;w(e,'Fim de jogo! '+nome(0)+' '+G[0]+' a '+G[1]+' '+nome(1)+(ps?' (pênaltis: '+ps.placar[0]+' a '+ps.placar[1]+')':'')+'.','fim',true);break}
      }
    }
    return L;
  }

  MT.minutos=minutos;MT.jogadores=jogadores;MT.estat=estat;MT.estatJog=estatJog;MT.calor=calor;MT.narra=narra;
})();
