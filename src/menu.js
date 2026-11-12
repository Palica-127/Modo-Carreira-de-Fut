'use strict';
/* ============================================================
   MENU INICIAL (3 slots, opções) e aba AJUSTES — no estilo do BrasLOL
   ============================================================ */
let TITLE='main',ttlAsk=-1,ttlMsg='';
const ttlUsed=()=>[0,1,2].filter(i=>slotInfo(i));
const ttlInfo=i=>{const f=slotInfo(i);return f?`${esc(f.n)} · ${f.y} · ${esc(f.club)} · OVR ${f.ovr}${f.ret?' · aposentado':''}`:'vazio'};
function ttlGo(v){TITLE=v;ttlAsk=-1;sfx('click');render()}
function ttlOpen(){if(S)save();S=null;TITLE='main';ttlAsk=-1;render()}
function ttlLoad(i){setSlot(i);if(loadGame()){TITLE=null;ui=UI0();ui.lg=cl(S.club).l;sfx('click');render()}else{ttlMsg='Esse save não pôde ser aberto.';render()}}
function ttlCont(){const u=ttlUsed();if(u.length==1)ttlLoad(u[0]);else ttlGo('cont')}
function ttlNew(i){setSlot(i);try{localStorage.removeItem(SAVE_KEY)}catch(e){}S=null;TITLE=null;ttlAsk=-1;ui=UI0();sfx('click');render()}
function ttlAskNew(i){ttlAsk=i;render()}
function ttlBg(){
  const names=Object.keys(typeof CREST!='undefined'?CREST:{}).sort((a,b)=>hash(a)-hash(b));if(!names.length)return '';
  return `<div class="tbg" aria-hidden="true">${[0,1,2,3,4,5,6].map(c=>{const l=names.filter((_,i)=>i%7==c).slice(0,8);return `<div class="tcol" style="--dur:${52+c*7}s">${l.concat(l).map(n=>`<img src="${CREST[n]}" alt="" draggable="false">`).join('')}</div>`}).join('')}</div>`;
}
const optPills=(k,cur,items,fn='setOpt')=>`<div class="pills" style="margin:0">${items.map(([v,l])=>`<button class="pill" aria-pressed="${String(cur)==String(v)}" onclick="${fn}('${k}',${typeof v=='number'?v:`'${v}'`})">${l}</button>`).join('')}</div>`;
function titleHtml(){
  const used=ttlUsed(),back=`<button class="tbtn" onclick="ttlGo('main')">Voltar</button>`;
  let body;
  if(TITLE=='cont'){
    body=`<h2 class="ttitle">Continuar</h2><p class="tnote">Escolha a carreira que quer retomar.</p><div class="tslot">${used.map(i=>`<button class="tbtn" onclick="ttlLoad(${i})">Slot ${i+1}<small>${ttlInfo(i)}</small></button>`).join('')}${back}</div>`;
  }else if(TITLE=='new'){
    body=`<h2 class="ttitle">Novo jogo</h2><p class="tnote">Escolha onde salvar a nova carreira.</p><div class="tslot">${[0,1,2].map(i=>{const u=used.includes(i);return ttlAsk==i?`<button class="tbtn dng" onclick="ttlNew(${i})">Confirmar: apagar o slot ${i+1}<small>${ttlInfo(i)}</small></button>`:`<button class="tbtn" onclick="${u?'ttlAskNew':'ttlNew'}(${i})">Slot ${i+1}${u?' · sobrescrever':''}<small>${ttlInfo(i)}</small></button>`}).join('')}${back}</div>`;
  }else if(TITLE=='opt'){
    body=`<h2 class="ttitle">Opções</h2><div class="topt">
    <div class="os"><h3>Sons</h3><p>Efeitos curtos ao jogar, vencer, perder e conquistar títulos.</p>${optPills('snd',OPT.snd,[[1,'Ligados'],[0,'Desligados']])}</div>
    <div class="os"><h3>Tema do clube</h3><p>As cores do app seguem as do seu clube.</p>${optPills('tema',OPT.tema,[[1,'Ligado'],[0,'Neutro']])}</div>
    <div class="os"><h3>Jogo ao vivo</h3><p>Abre a transmissão minuto a minuto quando você joga.</p>${optPills('live',OPT.live,[[1,'Ligado'],[0,'Desligado']])}</div>
    <div class="os"><h3>Tamanho da interface</h3><p>Aumenta ou reduz textos e botões.</p>${optPills('zoom',OPT.zoom,[['s','Compacto'],['m','Normal'],['l','Grande']])}</div>
    <div class="os"><h3>Animações</h3><p>Desligue para economizar bateria ou se o movimento incomodar.</p>${optPills('anim',OPT.anim,[[1,'Ligadas'],[0,'Reduzidas']])}</div></div>
    <div class="tslot">${back}</div>`;
  }else{
    const last=used.includes(SLOT)?SLOT:used[0];
    body=`<div class="tmark">${BALL}</div><p class="tey">Futebol · Carreira de craque</p><h1 class="tname">Habite<span>-se 10</span></h1><p class="tsub">Do sub-17 ao topo: 10 ligas, Champions, Libertadores, Copa do Mundo e a disputa pela Bola de Ouro.</p>
    <div class="tmenu"><button class="tbtn pri" onclick="ttlCont()" ${used.length?'':'disabled'}>Continuar<small>${used.length?(used.length>1?used.length+' carreiras salvas':'Slot '+(last+1)+' · '+ttlInfo(last)):'nenhuma carreira salva ainda'}</small></button>
    <button class="tbtn" onclick="ttlGo('new')">Novo jogo</button><button class="tbtn" onclick="ttlGo('opt')">Opções</button></div>
    ${ttlMsg?`<p class="tnote" style="margin-top:14px">${esc(ttlMsg)}</p>`:''}<p class="tfoot">Simulador independente. Clubes e jogadores reais, desempenho fictício.</p>`;
  }
  return `${ttlBg()}<main class="ttl"><div class="tbox">${body}</div></main>`;
}
/* ---------- aba Ajustes ---------- */
let ajOpen={car:true,jog:true,ifc:true,adv:false},ajAsk='';
function ajTog(k){ajOpen[k]=!ajOpen[k];render(true)}
function ajAskSet(v){ajAsk=v;render(true)}
function ajDel(){try{localStorage.removeItem(SAVE_KEY)}catch(e){}S=null;TITLE='main';ajAsk='';render()}
const ajSec=(k,t,body)=>`<div class="pn cmp"><button class="sgb" onclick="ajTog('${k}')" aria-expanded="${!!ajOpen[k]}">${t}<span>▾</span></button>${ajOpen[k]?body:''}</div>`;
const ajRow=(t,d,ctl)=>`<div class="sset"><h3>${t}</h3><p class="note" style="margin:0 0 10px">${d}</p>${ctl}</div>`;
function pgAj(){
  const f=slotInfo(SLOT);
  const car=`<div class="sset"><h3>Carreira atual</h3><p class="note" style="margin:0 0 10px">Slot ${SLOT+1} · ${f?ttlInfo(SLOT):'—'}. O progresso é salvo automaticamente neste navegador.</p>
    <div class="row" style="margin:0"><button class="ghost" onclick="ttlOpen()">Menu inicial</button><button class="ghost" onclick="reset()">Nova carreira</button><button class="ghost danger" onclick="retire()" ${S.ph=='ret'?'disabled':''}>Aposentar-se</button></div></div>`;
  const jog=ajRow('Jogo ao vivo','Ligado: a partida abre minuto a minuto. Desligado: o resultado sai direto e você vê as estatísticas depois.',optPills('live',OPT.live,[[1,'Ligado'],[0,'Desligado']]))
   +ajRow('Aleatoriedade','Menor: o favorito se impõe e zebras ficam raras. Maior: qualquer time surpreende. Vale para os próximos jogos desta carreira.',optPills('rnd',sopt('rnd'),[['baixa','Menor'],['normal','Normal'],['alta','Maior']],'setSopt'))
   +ajRow('Dificuldade','Fácil: +20% de XP, 25% menos lesões e treino mais eficiente. Difícil: 15% menos XP, 30% mais lesões e treino mais lento.',optPills('dif',sopt('dif'),[['facil','Fácil'],['normal','Normal'],['dificil','Difícil']],'setSopt'));
  const ifc=ajRow('Sons','Efeitos curtos ao jogar, vencer, perder e conquistar títulos.',optPills('snd',OPT.snd,[[1,'Ligados'],[0,'Desligados']]))
   +ajRow('Tema do clube','As cores do app seguem as do seu clube. Neutro usa a paleta padrão.',optPills('tema',OPT.tema,[[1,'Ligado'],[0,'Neutro']]))
   +ajRow('Tamanho da interface','Aumenta ou reduz textos e botões.',optPills('zoom',OPT.zoom,[['s','Compacto'],['m','Normal'],['l','Grande']]))
   +ajRow('Animações','Desligue para economizar bateria ou se o movimento incomodar.',optPills('anim',OPT.anim,[[1,'Ligadas'],[0,'Reduzidas']]));
  const adv=`<div class="sset"><h3>Backup do save</h3><p class="note" style="margin:0 0 8px">Exporte este slot para levar a carreira a outro aparelho ou navegador.</p><div class="row" style="margin:0"><button class="ghost" onclick="expSave()">Exportar</button><button class="ghost" onclick="impSave()">Importar</button></div><textarea id="sv" placeholder="Cole aqui um save exportado para importar"></textarea></div>
   <div class="sset"><h3>Apagar este slot</h3><p class="note" style="margin:0 0 10px">Remove a carreira do slot ${SLOT+1} e volta ao menu inicial. Não dá para desfazer.</p>${ajAsk=='del'?`<div class="row" style="margin:0"><button class="ghost danger" onclick="ajDel()">Confirmar e apagar</button><button class="ghost" onclick="ajAskSet('')">Cancelar</button></div>`:`<button class="ghost danger" onclick="ajAskSet('del')">Apagar slot</button>`}</div>`;
  return `<div class="pn"><h2>Ajustes</h2><p class="note" style="margin:0">Opções de jogabilidade e interface. As de interface valem para todos os slots; aleatoriedade e dificuldade valem só para esta carreira.</p></div>`+ajSec('car','Carreira',car)+ajSec('jog','Jogabilidade',jog)+ajSec('ifc','Interface',ifc)+ajSec('adv','Avançado',adv);
}
