'use strict';
/* ============================================================
   HABITE-SE 10 — ABAS NOVAS
   Jogar · Bola de Ouro · Lendas · Elenco  (Jogador usa pgPf, em ui.js)
   + fichas de jogador, clube, seleção e lenda com títulos e temporadas
   ============================================================ */
const legImg=(n,c='lgph')=>typeof LEGIMG!=='undefined'&&LEGIMG[n]?`<img class="${c}" src="${LEGIMG[n]}" alt="">`:'';
const ek=s=>encodeURIComponent(s).replace(/'/g,'%27');
const lnk=(on,t)=>`<span class="lnk" onclick="${on}">${t}</span>`;
const clubLnk=(n,id)=>{const i=id!=null?id:cn2id(n);return i!=null?lnk(`sheet('c','${i}')`,esc(n)):esc(n)};
const pLn=x=>x.me?lnk("sheet('me','me')",esc(x.n)):x.id?lnk(`sheet('p','${x.id}')`,esc(x.n)):x.q?lnk(`sheet('q','${x.q}')`,esc(x.n)):esc(x.n);
const selLnk=n=>lnk(`sheet('s','${ek(n)}')`,esc(n));
const ST_UCL=['Fase de 32','Oitavas','Quartas','Semifinal','Final'],ST_LIB=['Oitavas','Quartas','Semifinal','Final'];
const TL={l:'Liga',d:'Copa',u:'Champions',b:'Libertadores',m:'Mundial',w:'Copa do Mundo',o:'Bola de Ouro'};

/* ============================================================
   JOGAR — próximos jogos, resultados, classificação, calendário, copas, campeões
   ============================================================ */
const JG_TABS=[['prox','Próximos'],['res','Resultados'],['tab','Classificação'],['cal','Calendário'],['copa','Copas'],['camp','Campeões']];
function jgSet(k){ui.jg=k;render(true)}
function pgJogar(){
  if(S.ph=='ret')return ana();
  const v={prox:viewProx,res:viewRes,tab:viewTab,cal:viewCal,copa:viewCopa,camp:viewCamp}[ui.jg]||viewProx;
  return pills(JG_TABS,ui.jg,'jgSet','scroll')+v();
}
/* eventos do seu clube na temporada (liga, copas, continentais e Mundial) */
function calEvents(){
  const c=cl(S.club),T=rounds(c.l,c.d),WS=weeksOf(T.length),ev=[];
  T.forEach((r,i)=>{const wk=WS[i],m=r.find(x=>x.includes(S.club));if(!m)return;const home=m[0]==S.club;
    ev.push({w:wk,d:lgDay(wk),k:'lg',o:home?m[1]:m[0],home,res:S.res.filter(x=>x.w==wk&&x.c=='Liga').map(x=>x.t).join('')||null,nm:'Liga'})});
  allComps().forEach(k=>{
    for(let r=0;r<k.rn.length;r++){
      const wk=k.wk[r],nm=k.rn[r],full=k.n+' — '+nm,lg=k.log.find(x=>x[0]==r&&(x[1]==S.club||x[2]==S.club));
      const rs=S.res.find(x=>x.w==wk&&x.c==full);
      if(lg)ev.push({w:wk,d:kDay(k.k),k:k.k,o:lg[1]==S.club?lg[2]:lg[1],home:lg[1]==S.club,res:rs?rs.t:null,nm:k.n+' · '+nm});
      else if(k.ch==null&&k.al.includes(S.club)){
        if(r==k.rd){const m=(k.dr||[]).find(p=>p.includes(S.club));ev.push({w:wk,d:kDay(k.k),k:k.k,o:m?(m[0]==S.club?m[1]:m[0]):null,home:m?m[0]==S.club:true,res:null,nm:k.n+' · '+nm})}
        else if(r>k.rd)ev.push({w:wk,d:kDay(k.k),k:k.k,o:null,res:null,fut:1,nm:k.n+' · '+nm});
      }
    }
  });
  if(!S.mc&&S.ucl.ch!=null&&S.lib.ch!=null&&(S.ucl.ch==S.club||S.lib.ch==S.club))ev.push({w:SEASON,d:2,k:'mc',o:S.ucl.ch==S.club?S.lib.ch:S.ucl.ch,home:true,res:null,nm:'Mundial de Clubes · Final'});
  return ev.sort((a,b)=>a.w-b.w||a.d-b.d);
}
const evOpp=e=>e.o!=null?(e.home===false?'<small class="muted">fora</small> ':'<small class="muted">casa</small> ')+tn(cl(e.o)):e.fut?'<span class="muted">A definir (sorteio)</span>':'<span class="muted">Sorteio pendente</span>';
/* próximos jogos da liga e das copas (as fases seguintes das copas só valem se o clube avançar) */
function upcoming(){
  const rows=calEvents().filter(e=>e.w>S.week&&e.w<=S.week+5&&!e.res).map(e=>({c:[dTxt(e.w,e.d),kBadge(e.k),esc(e.nm.split(' · ')[1]||'')+(e.fut?' (se avançar)':''),evOpp(e),e.o!=null?Math.round(cl(e.o).s):'—'],cls:'kr kr-'+e.k}));
  return rows.length?`<div class="pn"><h2>Calendário próximo</h2>${tbl(['Data','Torneio','Fase','Adversário','Força'],rows)}</div>`:'';
}
const mrow=(h,a,gh,ga)=>`<div class="m ${h==S.club||a==S.club?'mine':''}" style="padding:6px 10px;margin-bottom:5px"><div class="mt"><div class="tn ${gh>ga?'win':gh<ga?'lose':''} lnk" onclick="sheet('c','${cl(h).id}')">${shield(cl(h),'xs')}<span>${esc(cl(h).n)}</span></div><div class="sc" style="font-size:18px">${gh}<i>x</i>${ga}</div><div class="tn b ${ga>gh?'win':ga<gh?'lose':''} lnk" onclick="sheet('c','${cl(a).id}')">${shield(cl(a),'xs')}<span>${esc(cl(a).n)}</span></div></div></div>`;
function lastRound(l,d){
  const r=(S.lr||{})[l+'-'+d];if(!r||!r.length)return '';
  return `<div class="pn full"><h2>Rodada ${S.lrw} · ${LEAGUES[l].dn[d]}</h2>${r.map(([h,a,gh,ga])=>mrow(h,a,gh,ga)).join('')}</div>`;
}
function nextRound(l,d){
  if(S.ph!='season'||S.week>SEASON)return '';
  const rd=roundAt(l,d,S.week);if(!rd)return '';
  return `<div class="pn full"><h2>Próxima rodada (${S.week}) · ${LEAGUES[l].dn[d]}</h2>${rd.map(([a,b])=>`<div class="m ${a==S.club||b==S.club?'mine':''}" style="padding:6px 10px;margin-bottom:5px"><div class="mt"><div class="tn lnk" onclick="sheet('c','${cl(a).id}')">${shield(cl(a),'xs')}<span>${esc(cl(a).n)}</span></div><div class="sc" style="font-size:16px"><i>x</i></div><div class="tn b lnk" onclick="sheet('c','${cl(b).id}')">${shield(cl(b),'xs')}<span>${esc(cl(b).n)}</span></div></div></div>`).join('')}</div>`;
}
function viewRes(){
  const c=cl(S.club),cu=S.cur||Z;let h='';
  h+=S.last.length?S.last.map(r=>`<div class="pn full" style="padding:10px">${mcard(r)}</div>`).join(''):'<div class="pn full"><p class="empty">Nenhuma partida na última semana.</p></div>';
  h+=lastRound(c.l,c.d);
  h+=`<div class="pn"><h2>Temporada ${S.y}</h2><div class="cab"><div><b>${cu.ap}</b><small>Jogos</small></div><div><b>${cu.g}</b><small>Gols</small></div><div><b>${cu.a}</b><small>Assist.</small></div></div><p class="note">Nota média: ${cu.ap?(cu.rs/cu.ap).toFixed(2):'—'} · Gols na liga: ${cu.lg}</p></div>
  <div class="pn"><h2>Seus resultados</h2>${S.res.length?tbl(['Sem','Competição','Resultado','Nota'],S.res.slice().reverse().map(r=>({c:[r.w,r.c.replace(/ — .*/,''),r.t,r.rt||'—']}))):'<p class="empty">Ainda sem jogos.</p>'}</div>`;
  return h;
}
const lgPills=()=>`<div class="pills scroll">${LEAGUES.map((x,i)=>`<button class="pill" aria-pressed="${ui.lg==i}" onclick="sub('lg',${i})">${x.k}</button>`).join('')}</div>`;
function viewTab(){
  const L=LEAGUES[ui.lg];if(ui.dv==null||ui.dv>=L.dn.length)ui.dv=cl(S.club).l==ui.lg?cl(S.club).d:0;
  const d=ui.dv,sc=scorers(ui.lg,d).slice(0,10);
  let h=lgPills()+`<div class="pills">${L.dn.map((n,i)=>`<button class="pill" aria-pressed="${ui.dv==i}" onclick="setDv(${i})">${n}</button>`).join('')}</div>`;
  h+=`<div class="pn"><h2>${L.dn[d]} · ${L.n}</h2>${stTable(ui.lg,d)}</div>
  <div class="pn"><h2>Artilharia</h2>${sc.length?tbl(['#','Jogador','Clube','Gols'],sc.map((x,i)=>({c:[i+1,pLn(x)+(x.me?' <span class="tag">você</span>':''),tn(cl(x.c)),`<b>${x.g}</b>`],cls:x.me?'mine':''}))):'<p class="empty">Ninguém marcou ainda.</p>'}</div>`;
  return h+lastRound(ui.lg,d)+nextRound(ui.lg,d);
}
function viewCal(){
  const c=cl(S.club),ks=[S.dc[c.l],S.ucl,S.lib],ev=calEvents();
  const lg=`<p class="kleg">${['lg','dom','ucl','lib','mc'].map(kBadge).join('')}</p>`;
  const rsc=t=>{const m=t&&t.match(/(\d+) x (\d+)/);return m?m[1]+' x '+m[2]:'—'};
  let h=`<div class="pn full"><h2>Calendário — ${dvName(c)}</h2>${lg}${tbl(['Sem','Data','Torneio','Adversário','Resultado'],ev.map(e=>({c:[e.w,dTxt(e.w,e.d),kBadge(e.k)+(e.k=='lg'?'':' <small class="muted">'+esc(e.nm.split(' · ')[1]||'')+'</small>'),evOpp(e),rsc(e.res)],cls:'kr kr-'+e.k+(e.w==S.week&&S.ph=='season'?' mine':'')})))}</div>`;
  h+=`<div class="pn"><h2>Datas das copas</h2>${tbl(['Competição','Fases (data)'],ks.map(k=>({c:[kBadge(k.k)+' '+esc(k.n),k.rn.map((n,i)=>esc(n)+' ('+dTxt(k.wk[i],kDay(k.k))+')').join(' · ')],cls:'kr kr-'+k.k+(k.ch==null&&k.al.includes(S.club)?' mine':'')})).concat([{c:[kBadge('mc')+' Mundial de Clubes','Final ('+dTxt(SEASON,2)+'), entre os campeões da Champions e da Libertadores'],cls:'kr kr-mc'}]))}</div>`;
  return h;
}
const viewCopa=()=>lgPills()+compView(S.dc[ui.lg])+compView(S.ucl)+compView(S.lib)+(S.mc?compView(S.mc):'');
const viewCamp=()=>lgPills()+champHist(ui.lg);

/* ============================================================
   BOLA DE OURO — top 10 do ano e todos os vencedores
   ============================================================ */
function bkSet(k){ui.bk=k;render(true)}
function bySet(y){ui.by=y;render(true)}
function pgBdo(){
  const h=pills([['bdo','Bola de Ouro'],['ovr','Melhores OVR'],['art','Artilheiros']],ui.bk,'bkSet');
  if(ui.bk=='ovr')return h+viewOvr();
  if(ui.bk=='art')return h+viewArt();
  return h+bdoTop()+bdoWinners();
}
function bdoTop(){
  const live=S.ph=='season',ys=S.bdo.map(b=>String(b.y)).reverse();
  let sel=ui.by;if(!(sel=='now'&&live)&&!ys.includes(String(sel)))sel=live?'now':(ys[0]||'now');
  let h=(live||ys.length)?pills([...(live?[['now',S.y+' (em disputa)']]:[]),...ys.map(y=>[y,y])],sel,'bySet','scroll'):'';
  if(sel=='now'){
    const l=bdoList(false);
    if(!l.length)h+='<div class="pn"><p class="empty">A corrida da Bola de Ouro começa depois das primeiras rodadas. A pontuação combina nota média, gols, assistências, títulos, OVR, reputação e força da liga.</p></div>';
    else{
      const top=l.slice(0,10),me=l.findIndex(x=>x.me);
      h+=podiumOf(l)+`<div class="pn"><h2>Top 10 · corrida ${S.y}</h2><p class="note" style="margin-top:0">Parcial da semana ${Math.max(1,S.week-1)} de ${SEASON}, projetada.${Object.keys(S.bdoPrev).length?' As setas comparam com a temporada passada.':''}</p>${bdoRows(top,x=>S.bdoPrev[x.id]||0,Object.keys(S.bdoPrev).length>0)}${me>=10?`<p class="note">Sua posição: <b>${me+1}º</b> com ${Math.round(l[me].pts)} pontos.</p>`:me<0?'<p class="note">Você precisa de mais jogos para entrar na disputa.</p>':''}</div>`;
    }
  }else{
    const b=S.bdo.find(x=>String(x.y)==String(sel));
    if(b)h+=podiumOf(b.top)+`<div class="pn"><h2>Top 10 · Bola de Ouro ${b.y}</h2>${bdoRows(b.top,x=>x.prev,S.bdo.length>1)}<p class="note">${b.me?`Você terminou em ${b.me}º.`:'Você ficou fora da disputa.'}</p></div>`;
  }
  return h;
}
function bdoWinners(){
  const all=bdoAll().sort((a,b)=>b.y-a.y),cnt={};
  all.forEach(x=>{if(x.n!='—')cnt[x.n]=(cnt[x.n]||0)+1});
  const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const live=S.ph=='season'?bdoList(false):[];
  const who=x=>x.me?lnk("sheet('me','me')",esc(x.n))+' <span class="tag">você</span>':x.id?lnk(`sheet('p','${x.id}')`,esc(x.n)):LEG.some(z=>z.n==x.n)?lnk(`sheet('l','${ek(x.n)}')`,esc(x.n)):esc(x.n);
  const rows=[];
  for(let i=3;i>=1;i--)rows.push({c:[S.y+i,'<span class="muted">A definir</span>','','','']});
  if(live.length)rows.push({c:[S.y+' ⏱','Em disputa: '+who(live[0]),natb(natCode(live[0].nat)),clubLnk(cl(live[0].club).n,live[0].club),''],cls:'mine'});
  all.forEach(x=>rows.push({c:[x.y+(x.g?' ⚽':''),x.n=='—'?'<span class="muted">Não houve premiação</span>':who(x),x.nat?natb(x.nat):'',x.c?clubLnk(x.c):'',x.g?Math.round(x.pts):''],cls:x.me?'mine':''}));
  return `<div class="pn full"><h2>Todos os vencedores da Bola de Ouro</h2><p class="note" style="margin-top:0">1956–2025: histórico real. De 2026 em diante (⚽): os vencedores do jogo, ano a ano. As próximas edições aparecem aqui conforme as temporadas passam.</p>${tbl(['Ano','Vencedor','País','Clube','Pts'],rows)}</div>
  <div class="pn"><h2>Maiores vencedores</h2>${tbl(['#','Jogador','Bolas de Ouro'],top.map(([n,k],i)=>({c:[i+1,esc(n),`<b>${k}</b>`]})))}</div>`;
}
const natb=c=>`<span class="natb" style="display:inline-grid;padding:0 6px">${esc(c)}</span>`;
function viewOvr(){
  const l=[...S.rv.map(r=>({id:r.id,n:r.n,club:r.club,pos:r.pos,age:r.age,ovr:Math.round(r.ovr),nat:r.nat,pts:r.ovr})),{id:'me',n:S.p.name,club:S.club,pos:S.p.pos,age:S.p.age,ovr:O(),nat:S.p.nat,pts:O(),me:1}].sort((a,b)=>b.pts-a.pts);
  const me=l.findIndex(x=>x.me);
  return `<div class="pn full"><h2>Melhores jogadores do mundo</h2><div class="futr">${l.slice(0,5).map(x=>entryCard(x,'sm',{tag:'#'+(l.indexOf(x)+1)})).join('')}</div></div>
  <div class="pn"><h2>Top 10 por OVR</h2><ul class="rank">${l.slice(0,10).map((x,i)=>`<li class="${x.me?'me':''}" onclick="sheet('${x.me?'me':'p'}','${x.me?'me':x.id}')"><span class="pos">${i+1}</span>${hx(x.ovr)}<span class="nm2">${esc(x.n)}${x.me?'<span class="tag">você</span>':''}<small>${esc(cl(x.club).n)} · ${x.pos} · ${x.age} anos</small></span><span class="pt">${x.ovr}<small>OVR</small></span></li>`).join('')}</ul>${me>=10?`<p class="note">Você é o ${me+1}º melhor do mundo.</p>`:''}</div>`;
}
function viewArt(){
  const all=[];
  Object.entries(S.sc).forEach(([k,e])=>{if(S.cs[e.c].d==0&&e.g>0)all.push({n:e.n,c:e.c,g:e.g,q:k.replace('_','.')})});
  S.rv.forEach(r=>{if(S.cs[r.club].d==0&&r.cur.lg>0)all.push({n:r.n,c:r.club,g:r.cur.lg,id:r.id})});
  const mc=cl(S.club);if(mc.d==0&&S.cur&&S.cur.lg>0)all.push({n:S.p.name,c:S.club,g:S.cur.lg,me:1});
  all.sort((a,b)=>b.g-a.g);
  return `<div class="pn full"><h2>Chuteira de Ouro — 1ªs divisões</h2>${all.length?tbl(['#','Jogador','Clube','Liga','Gols'],all.slice(0,10).map((x,i)=>({c:[i+1,pLn(x)+(x.me?' <span class="tag">você</span>':''),tn(cl(x.c)),LEAGUES[cl(x.c).l].k,`<b>${x.g}</b>`],cls:x.me?'mine':''}))):'<p class="empty">Ninguém marcou ainda.</p>'}</div>`;
}

/* ============================================================
   LENDAS — top 10 da história, Copa, Champions, Libertadores, clubes e seleções
   ============================================================ */
const LD_TABS=[['jog','Jogadores'],['wc','Copa do Mundo'],['ucl','Champions'],['lib','Libertadores'],['clb','Clubes'],['sel','Seleções']];
function ldSet(k){ui.ld=k;render(true)}
function pgLend(){
  const v={jog:lendJog,wc:lendWc,ucl:()=>lendCont('ucl'),lib:()=>lendCont('lib'),clb:lendClb,sel:lendSel}[ui.ld]||lendJog;
  return pills(LD_TABS,ui.ld,'ldSet','scroll')+v();
}
const lgOn=x=>x.me?"sheet('me','me')":x.id?`sheet('p','${x.id}')`:`sheet('l','${ek(x.n)}')`;
const lgTag=x=>x.me?'<span class="tag">você</span>':x.st=='ativo'?'<span class="tag">ativo</span>':x.st=='ret'?'<span class="tag">aposentado</span>':'';
function lendJog(){
  const l=legList(),mi=l.findIndex(x=>x.me);
  const row=(x,i)=>`<li class="${x.me?'me':''}" onclick="${lgOn(x)}"><span class="pos">${i+1}</span>${legImg(x.n,'lgav')}<span class="natb">${esc(x.nat)}</span><span class="nm2">${esc(x.n)}${lgTag(x)}<small>${x.pos} · ${x.bo} Bola(s) de Ouro${x.wc?' · '+x.wc+' Copa(s)':''}${x.ucl?' · '+x.ucl+' Champions':''}${x.lib?' · '+x.lib+' Libertadores':''} · ${x.g} gols</small></span><b class="pts">${Math.round(x.pts)}</b></li>`;
  return `<div class="pn full"><h2>Top 10 da história</h2><ul class="rank">${l.slice(0,10).map(row).join('')}</ul>${mi>=10?`<p class="note">Sua posição na história: <b>${mi+1}º</b> com ${Math.round(l[mi].pts)} pontos.</p>`:''}
  <p class="note">Pontuação = Bolas de Ouro, Copas do Mundo, Champions, Libertadores, Mundiais, ligas e gols. As lendas reais têm números aproximados até 2025. Os craques do jogo entram no ranking conforme acumulam prêmios e títulos, e continuam nele depois de se aposentar.</p></div>
  <div class="pn full"><details class="det"><summary>11º ao 30º</summary><ul class="rank">${l.slice(10,30).map((x,i)=>row(x,i+10)).join('')}</ul></details></div>`;
}
function lendWc(){
  const rows=[...WC_H.map(x=>({y:x.y,c:x.c,r:x.r})),...S.wc.map(w=>({y:w.y,c:w.champ,r:w.ru,sf:w.sf,g:1,w}))].sort((a,b)=>b.y-a.y);
  return `<div class="pn full"><h2>Copas do Mundo</h2>${tbl(['Ano','Campeã','Vice','Semifinalistas'],rows.map(x=>({c:[x.y+(x.g?' ⚽':''),selLnk(x.c),selLnk(x.r),x.sf?x.sf.map(esc).join(', '):'—'],cls:x.g&&x.w.nat==x.c&&x.w.me.called?'mine':''})))}<p class="note">1930–2022: histórico real. A partir de 2026 (⚽) valem as Copas simuladas pelo jogo, a cada 4 anos.</p></div>`;
}
function lendCont(key){
  const H=key=='ucl'?UCL_H:LIB_H,title=key=='ucl'?'Liga dos Campeões':'Libertadores';
  const rows=H.map(x=>({y:x.y,c:x.c,r:x.r}));
  S.champs.forEach(h=>{const e=h[key];if(e&&e.c!=null)rows.push({y:h.y,c:cl(e.c).n,r:e.r!=null?cl(e.r).n:'—',g:1,ci:e.c,ri:e.r})});
  rows.sort((a,b)=>b.y-a.y);
  const cnt={};rows.forEach(x=>{cnt[x.c]=(cnt[x.c]||0)+1});
  const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,10);
  return `<div class="pn"><h2>Maiores campeões · ${title}</h2>${tbl(['#','Clube','Títulos'],top.map(([n,k],i)=>({c:[i+1,clubLnk(n),`<b>${k}</b>`],cls:cn2id(n)==S.club?'mine':''})))}</div>
  <div class="pn full"><h2>${title} · resultados por ano</h2>${tbl(['Ano','Campeão','Vice'],rows.map(x=>({c:[x.y+(x.g?' ⚽':''),clubLnk(x.c,x.ci),x.r=='—'?'—':clubLnk(x.r,x.ri)],cls:x.ci==S.club?'mine':''})))}<p class="note">${key=='ucl'?'1956–2025':'1960–2025'}: histórico real. Depois, as edições simuladas pelo jogo (⚽).</p></div>`;
}
function lendClb(){
  const l=clubPower().filter(x=>x.pts>0).slice(0,25),f=S.cs.filter(c=>c.l>=0).sort((a,b)=>b.s-a.s).slice(0,10);
  return `<div class="pn full"><h2>Power ranking de clubes</h2><p class="note" style="margin-top:0">Pontos de títulos: Champions 10, Libertadores 8, Mundial 5, liga 2, copa nacional 1, vice continental 3 (UCL) ou 2 (LIB). Histórico real até 2025 mais os títulos do jogo.</p>${tbl(['#','Clube','UCL','LIB','MUN','Ligas*','Pts','Força'],l.map((x,i)=>({c:[i+1,lnk(`sheet('c','${x.c.id}')`,tn(x.c)),x.t.ucl.length,x.t.lib.length,x.t.mc,x.t.lg.length,`<b>${x.pts}</b>`,Math.round(x.c.s)],cls:x.c.id==S.club?'mine':''})))}<p class="note">*Ligas e copas nacionais contam só a partir de 2026, nas temporadas do jogo.</p></div>
  <div class="pn full"><h2>Mais fortes agora</h2><ul class="rank">${f.map((c,i)=>`<li class="${c.id==S.club?'me':''}" onclick="sheet('c','${c.id}')"><span class="pos">${i+1}</span>${shield(c,'sm')}<span class="nm2">${esc(c.n)}<small>${LEAGUES[c.l].n} · ${dvName(c)}</small></span><span class="pt">${Math.round(c.s)}<small>força</small></span></li>`).join('')}</ul></div>`;
}
function lendSel(){
  const l=selRank().slice(0,16);
  return `<div class="pn full"><h2>Ranking de seleções</h2><p class="note" style="margin-top:0">Mesma lógica das lendas: Copa do Mundo 20 pontos, vice 8, semifinal 3 (semifinais só nas Copas do jogo). Histórico real até 2022 mais as Copas simuladas.</p><ul class="rank">${l.map((x,i)=>`<li class="${x.n==S.p.nat?'me':''}" onclick="sheet('s','${ek(x.n)}')"><span class="pos">${i+1}</span><span class="natb">${esc(x.c)}</span><span class="nm2">${esc(x.n)}${x.n==S.p.nat?'<span class="tag">sua seleção</span>':''}<small>${x.t.length} título(s) · ${x.v.length} vice(s)${x.sf.length?' · '+x.sf.length+' semifinal(is) no jogo':''}${x.s?' · força '+x.s:''}</small></span><b class="pts">${x.pts}</b></li>`).join('')}</ul></div>`;
}

/* ============================================================
   ELENCO — ligas, divisões, clubes e o elenco de cada clube
   ============================================================ */
const elState=()=>ui.el||(ui.el={l:Math.max(0,cl(S.club).l),d:Math.max(0,cl(S.club).d)});
function elSet(k,v){const E=elState();E[k]=+v;if(k=='l')E.d=0;render(true)}
function verElenco(id){ui.ec=+id;render()}
function voltarElenco(){ui.ec=null;render(true)}
function abrirElenco(id){ui.sheet=null;ui.pg='elen';ui.ec=+id;render()}
function pgElen(){
  if(ui.ec!=null)return squadView(ui.ec);
  const E=elState(),L=LEAGUES[E.l];if(E.d>=L.dn.length)E.d=0;
  let h=`<div class="pills scroll">${LEAGUES.map((x,i)=>`<button class="pill" aria-pressed="${E.l==i}" onclick="elSet('l',${i})">${x.k}</button>`).join('')}</div><div class="pills">${L.dn.map((n,i)=>`<button class="pill" aria-pressed="${E.d==i}" onclick="elSet('d',${i})">${n}</button>`).join('')}</div>`;
  h+=`<div class="pn full"><h2>${L.dn[E.d]} · ${L.n}</h2><ul class="rank">${stand(E.l,E.d).map((c,i)=>`<li class="lnk ${c.id==S.club?'me':''}" onclick="sheet('c','${c.id}')"><span class="pos">${i+1}</span>${shield(c,'sm')}<span class="nm2">${esc(c.n)}${c.id==S.club?'<span class="tag">seu clube</span>':''}<small>${S.tb[c.id].Pt} pts · força ${Math.round(c.s)}</small></span><span class="acts2"><button class="btn-s alt" onclick="event.stopPropagation();verElenco(${c.id})">Elenco</button></span></li>`).join('')}</ul></div>`;
  return h;
}
const SQO=['GOL','ZAG','VOL','MEI','PNT','ATA'];
function squadView(cid){
  const c=cl(cid),L=c.l>=0?LEAGUES[c.l]:null,sq=squadOf(cid),pos=L?stand(c.l,c.d).findIndex(z=>z.id==cid)+1:0;
  const xi=sq.slice().sort((a,b)=>b.ovr-a.ovr).slice(0,11),avg=a=>Math.round(a.reduce((s,x)=>s+x.ovr,0)/a.length*10)/10;
  const head=`<div class="pn full"><div class="row" style="margin-bottom:8px"><button class="ghost" onclick="voltarElenco()">← Voltar</button><button class="ghost" onclick="sheet('c','${cid}')">Ficha do clube</button></div><div class="offer">${shield(c,'lg')}<div><h3 style="margin:0">${esc(c.n)}</h3><small>${dvName(c)}${L?' · '+L.n:''}${pos?' · '+pos+'º colocado':''}</small></div></div>${kv([['Força',Math.round(c.s)],['Média dos 11',avg(xi)],['Idade média',(sq.reduce((s,x)=>s+x.age,0)/sq.length).toFixed(1)],['Jogadores',sq.length]])}</div>`;
  const groups=SQO.map(p=>{
    const g=sq.filter(x=>x.pos==p).sort((a,b)=>b.ovr-a.ovr);if(!g.length)return '';
    return `<div class="pn"><h2>${PNQ[p]}s <small class="muted">${g.length}</small></h2><ul class="rank sq">${g.map(x=>`<li class="${x.me?'me':''}" onclick="sheet('${x.me?'me':x.rv?'p':'q'}','${x.id}')"><span class="pos">${p}</span>${hx(x.ovr)}<span class="nm2">${esc(x.n)}${x.me?'<span class="tag">você</span>':x.rv?'<span class="tag">craque</span>':''}<small>${x.age} anos · ${esc(x.nat)}${x.pot>x.ovr+3&&x.age<24?' · promessa':''}</small></span><span class="pt">${x.ovr}<small>OVR</small></span></li>`).join('')}</ul></div>`}).join('');
  return head+groups;
}

/* ============================================================
   JOGADOR — contratos (mercado + finanças)
   ============================================================ */
function pgCtr(){
  const ct=S.ct,win=winOpen();
  let h=`<div class="pn"><h2>Contrato atual</h2><div class="kv"><div><small>Salário</small><b>${F(ct.sal)}/sem</b></div><div><small>Por ano</small><b>${F(ct.sal*52)}</b></div><div><small>Restante</small><b>${ct.yrs} ano(s)</b></div><div><small>Bônus por gol</small><b>${F(ct.bon)}</b></div><div><small>Multa</small><b>${F(ct.cl)}</b></div><div><small>Valor de mercado</small><b>${F(val())}</b></div></div></div>
  <div class="pn"><h2>Mercado</h2><p>Janela: <b style="color:${win?'var(--acc)':'var(--bad)'}">${win?'aberta':'fechada'}</b>${win?'':' (abre na semana 16 e no fim da temporada)'}</p><button class="play" style="font-size:18px;min-height:48px" onclick="agent()" ${win&&!S.ag?'':'disabled'}>Pedir ao agente novas propostas</button><p class="note">Propostas chegam de clubes das 10 ligas, conforme seu OVR, reputação e popularidade.</p></div>`;
  h+=S.of.length?S.of.map((o,i)=>{const c=cl(o.club),L=lg(c);return `<div class="pn"><div class="offer">${shield(c,'lg')}<div><h3 style="margin:0">${o.t=='ren'?'Renovação':o.t=='emp'?'Empréstimo':'Transferência'} · ${esc(c.n)}</h3><small>${dvName(c)} · ${L.n} · força ${Math.round(c.s)}</small></div></div>
    <div class="kv" style="margin:10px 0"><div><small>Salário</small><b>${F(o.sal)}/sem</b></div><div><small>Duração</small><b>${o.yrs} ano(s)</b></div><div><small>Bônus</small><b>${F(o.bon)}/gol</b></div><div><small>Multa</small><b>${F(o.cl)}</b></div>${o.t=='perm'?`<div><small>Valor</small><b>${F(o.fee)}</b></div>`:''}</div>
    <div class="acts"><button class="buy" onclick="acc(${i})">Aceitar</button><button class="buy" style="border-color:var(--line);color:var(--ink)" onclick="neg(${i})" ${o.n?'disabled':''}>Negociar</button><button class="buy" style="border-color:var(--line);color:var(--muted)" onclick="rej(${i})">Recusar</button></div></div>`}).join(''):'<div class="pn"><p class="empty">Nenhuma proposta no momento. Bom desempenho e reputação atraem clubes.</p></div>';
  return h+pgFin();
}

/* ============================================================
   FICHAS — jogador, clube, seleção e lenda
   ============================================================ */
function sheetTab(k){ui.sheet.tab=k;render(true)}
const shTab=(s,items)=>s.tab||items[0][0];
const shTabs=(s,items)=>`<div class="pills">${items.map(([k,l])=>`<button class="pill" aria-pressed="${shTab(s,items)==k}" onclick="sheetTab('${k}')">${l}</button>`).join('')}</div>`;
const shelfOf=l=>`<div class="shelf">${l.map(x=>x.k=='bo'?ballTro(x.y):troIcon(x.k,x.y,x.t,troSub(x))).join('')||'<span class="none">Nenhum título ainda.</span>'}</div>`;
const yrsLine=(n,a)=>`<div class="tl"><b>${n} <span class="tag">${a.length}</span></b><small>${a.length?a.slice().sort((x,y)=>x-y).join(' · '):'—'}</small></div>`;
function myTitles(){
  return [...S.ti.map(x=>({k:x.k||'lig',y:x.y,t:x.t.replace(/ \(.*/,'')})),...S.aw.filter(a=>a.t.includes('BOLA DE OURO')).map(a=>({k:'bo',y:a.y}))].sort((a,b)=>a.y-b.y);
}
/* resumo dos títulos por tipo */
function titleLines(list){
  const by={};list.forEach(x=>{(by[x.k]=by[x.k]||[]).push(x.y)});
  return [['bo','Bola de Ouro'],['wc','Copa do Mundo'],['ucl','Liga dos Campeões'],['lib','Libertadores'],['mc','Mundial de Clubes'],['lig','Liga nacional'],['dom','Copa nacional']].map(([k,n])=>yrsLine(n,by[k]||[])).join('');
}
/* ---------- componentes das fichas (estilo BrasLOL) ---------- */
const shHero=(left,name,sub,tags,tiles)=>`<div class="hero2"><div class="h2c">${left}</div><div class="h2m"><h2 class="h2n">${name}</h2><div class="h2s">${sub}</div>${tags.map(t=>`<div class="h2t">${t}</div>`).join('')}</div><div class="h2k">${tiles.map(([l,v])=>`<div><b>${v}</b><small>${l}</small></div>`).join('')}</div></div>`;
const SHG=[['mc','Mundial de Clubes',1],['ucl','Liga dos Campeões',1],['lib','Libertadores',1],['wc','Copa do Mundo',1],['lig','Ligas',0],['dom','Copas nacionais',0]];
const shelfBox=(n,it,ico)=>`<div class="sh-t"><span>${n}</span><b>${it.length}</b></div><div class="shelf">${it.map(ico).join('')||'<span class="none">Ainda vazia</span>'}</div>`;
const shelfRows=list=>SHG.map(([k,n,a])=>{const it=list.filter(x=>x.k==k).sort((p,q)=>(+p.y||0)-(+q.y||0));return it.length||a?shelfBox(n,it,x=>troIcon(k,x.y,'',troSub(x))):''}).join('');
function ovrChart(pts){
  if(pts.length<2)return `<div class="pn"><h2>Evolução do OVR</h2><p class="note" style="margin:0">O gráfico aparece a partir da segunda temporada.</p></div>`;
  const W=600,H=190,px=30,py=26,mn=Math.min(...pts.map(p=>p[1]))-3,mx=Math.max(...pts.map(p=>p[1]))+3;
  const X=i=>px+i*(W-2*px)/(pts.length-1),Y=v=>H-py-(v-mn)*(H-2*py)/((mx-mn)||1);
  const pk=pts.reduce((a,p)=>p[1]>a[1]?p:a,pts[0]),pi=pts.indexOf(pk),st=Math.ceil(pts.length/8);
  return `<div class="pn"><h2>Evolução do OVR</h2><svg class="ovrc" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Evolução do OVR por temporada"><polyline fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" points="${pts.map((p,i)=>X(i)+','+Y(p[1])).join(' ')}"/>${pts.map((p,i)=>`<circle cx="${X(i)}" cy="${Y(p[1])}" r="${i==pi?6:3.5}" fill="${i==pi?'#ffd84d':'currentColor'}"/>`).join('')}<text x="${X(pi)}" y="${Y(pk[1])-12}" text-anchor="middle" font-size="18" font-weight="700" fill="#ffd84d">${pk[1]}</text>${pts.map((p,i)=>i%st==0||i==pts.length-1?`<text x="${X(i)}" y="${H-6}" text-anchor="middle" font-size="13" fill="currentColor" opacity=".7">${p[0]}</text>`:'').join('')}</svg><p class="note" style="margin:6px 0 0">Pico: ${pk[1]} em ${pk[0]}.</p></div>`;
}
const allTitles=titles=>`<details class="pn det"><summary>Todos os títulos e prêmios</summary>${titleLines(titles)}</details>`;
const podCard=(rows,bo)=>{
  const v=rows.filter(r=>r.pos==2).length,q=rows.filter(r=>r.pos==3).length;
  return `<div class="pn pod"><h2>Pódios e vices</h2><div class="chips"><span><b>${bo}</b>Bolas de Ouro</span><span><b>${v}</b>Vices</span><span><b>${q}</b>3º lugar</span><span><b>${rows.length}</b>Top 10</span></div>${rows.filter(r=>r.pos>1).slice().reverse().slice(0,8).map(r=>`<div class="pr2"><b>${r.y}</b><span>${r.pos}º na Bola de Ouro · ${r.pts} pts</span></div>`).join('')||'<p class="note" style="margin:0">Vices e pódios da Bola de Ouro aparecem aqui.</p>'}</div>`;
};
/* jogador (rival ativo, aposentado ou o seu) */
function shP(s){
  const me=s.t=='me'||s.id=='me';let x;
  if(me)x={id:'me',n:S.p.name,nat:S.p.nat,pos:S.p.pos,age:S.p.age,ovr:O(),pot:S.p.pot,club:S.club,me:1,cur:S.cur||Z};
  else{
    x=rvAny(s.id);if(x)x={...x,ovr:Math.round(x.ovr)};
    if(!x){const e=S.bdo.flatMap(b=>b.top).find(z=>z.id==s.id);if(!e)return null;x={...e,pot:e.ovr,cur:Z,ad:[0,0,0,0,0,0],car:newCar(),h:[],ghost:1}}
  }
  const c=cl(x.club),titles=me?myTitles():rvTitles(x),cnt=k=>titles.filter(z=>z.k==k).length,car=x.car||newCar();
  const plc=S.bdo.map(b=>{const i=b.top.findIndex(z=>me?z.me:z.id==x.id);return i>=0?{y:b.y,pos:i+1,pts:Math.round(b.top[i].pts)}:null}).filter(Boolean);
  const lr=legList(),ix=lr.findIndex(z=>me?z.me:z.id==x.id),lp=ix>=0?Math.round(lr[ix].pts):'—';
  const live=S.ph=='season'&&!x.ret&&!x.ghost;
  /* linhas de temporada e dados do gráfico */
  let rows,pts=[],nS,tAp,tG,tA,nota,pk;
  if(me){
    const lv=S.cur&&S.ph=='season'?[{...S.cur,l:cl(S.cur.c).l,d:cl(S.cur.c).d,pos:0,live:1,o:O(),ag:S.p.age}]:[];
    const all=S.hist.concat(lv),lastOf={};all.forEach((z,i)=>{lastOf[z.y]=i});
    rows=all.map((z,i)=>{
      const pr=[...S.ti.filter(t=>t.y==z.y&&t.c==z.c).map(t=>t.t.replace(/ \(.*/,'')),...(lastOf[z.y]==i&&!z.live?S.aw.filter(a=>a.y==z.y).map(a=>a.t.replace('🌟 ','').replace('🏆 ','')):[])];
      return{c:[z.y+(z.live?' ⏱':''),tn(cl(z.c)),z.o||'—',z.ag||'—',z.pos?z.pos+'º':'—',z.ap,z.g,z.a,z.ap?(z.rs/z.ap).toFixed(2):'—',esc(pr.join(', '))||'—'],cls:z.live?'mine':''};
    });
    all.forEach(z=>{if(z.o)pts.push([z.y,z.o])});
    const ys=new Set(all.map(z=>z.y));nS=ys.size;const t=tot(false);tAp=t.ap;tG=t.g;tA=t.a;
    const rs=all.reduce((a,z)=>a+z.rs,0),ap=all.reduce((a,z)=>a+z.ap,0);nota=ap?(rs/ap).toFixed(2):'—';pk=Math.max(S.peak||0,O());
    rows.reverse();
  }else{
    const h=x.h||[];
    rows=h.map(e=>({c:[e[0],tn(cl(e[1])),e[2],e[3],e[4],e[5],e[3]?(e[6]/100).toFixed(2):'—',e[7]?e[7]+'º':'—',esc(String(e[8]||'').split('').map(k=>TL[k]).filter(Boolean).join(', '))||'—']}));
    h.forEach(e=>pts.push([e[0],e[2]]));
    if(live&&x.cur){const u=x.cur;rows.push({c:[S.y+' ⏱',tn(cl(x.club)),Math.round(x.ovr),u.ap,u.g,u.a,u.ap?(u.rs/u.ap).toFixed(2):'—','—','—'],cls:'mine'});pts.push([S.y,Math.round(x.ovr)])}
    rows.reverse();
    nS=h.length+(live?1:0);tAp=car.ap;tG=car.g;tA=car.a;
    const w=h.reduce((a,e)=>a+e[3],0);nota=w?(h.reduce((a,e)=>a+e[6]/100*e[3],0)/w).toFixed(2):'—';pk=car.pk||x.ovr;
  }
  const best=plc.length?Math.min(...plc.map(z=>z.pos))+'º':'—';
  const hero=shHero(entryCard({...x,club:x.club},'',{on:'',tag:''}),esc(x.n),`${PNQ[x.pos]||x.pos} · ${clubLnk(c.n,c.id)} · ${x.age} anos · ${esc(x.nat)}`,
    [me?'<b>VOCÊ</b> seu jogador':x.ret?'<b>APOSENTADO</b> em '+x.ret:x.ghost?'<b>FORA DO RANKING</b>':'<b>ATIVO</b> craque do mundo',
     ix>=0&&ix<10?`<b>TOP ${ix+1}</b> na história do jogo`:ix>=0?`<b>${ix+1}º</b> no ranking de lendas`:''].filter(Boolean),
    [['Bolas de Ouro',cnt('bo')],['Champions',cnt('ucl')],['Libertadores',cnt('lib')],['Copas do Mundo',cnt('wc')],['Mundiais',cnt('mc')],['Ligas',cnt('lig')],['Pontos',lp]]);
  const stats=kv([['Temporadas',nS],['Jogos',tAp],['Gols',tG],['Assistências',tA],['Gols/jogo',tAp?(tG/tAp).toFixed(2):'0.00'],['Nota média',nota],['Pico de OVR',pk],['Melhor posição',best],['Top 10 no prêmio',plc.length]]);
  const left=`<div class="pn"><h2>Estante de troféus</h2>${shelfRows(titles)}</div>
    <div class="pn"><h2>Estante da Bola de Ouro</h2>${shelfBox('Bola de Ouro',titles.filter(z=>z.k=='bo').sort((p,q)=>p.y-q.y),z=>ballTro(z.y))}</div>${podCard(plc,cnt('bo'))}`;
  const cu=x.cur||Z,right=`<div class="pn"><h2>Estatísticas</h2>${stats}</div><div class="pn"><h2>Atributos</h2>${statBars(me?myStats():rvStats(x))}${live?`<h3>Temporada atual</h3>${kv([['Jogos',cu.ap],['Gols',cu.g],['Assist.',cu.a],['Nota média',cu.ap?(cu.rs/cu.ap).toFixed(2):'—']])}`:''}</div>${ovrChart(pts)}${allTitles(titles)}`;
  const heads=me?['Ano','Time','OVR','Idade','Pos.','J','G','A','Nota','Títulos e prêmios']:['Ano','Time','OVR','J','G','A','Nota','Bola','Títulos'];
  const tmp=`<div class="pn full"><h2>Temporadas</h2>${rows.length?tbl(heads,rows):'<p class="empty">As temporadas aparecem aqui ao fim de cada ano do jogo.</p>'}${me?'<p class="note">Pos. é a posição do seu clube na liga.</p>':'<p class="note">Bola = posição na votação da Bola de Ouro. Registro a partir de 2026.</p>'}</div>`;
  return {title:x.n,hero:1,body:`${hero}<div class="shg"><div>${left}</div><div>${right}</div></div>${tmp}`};
}
/* clube */
function shC(s){
  const c=cl(+s.id);if(!c)return null;
  const L=c.l>=0?LEAGUES[c.l]:null,tab=L?stand(c.l,c.d):[],pos=tab.findIndex(z=>z.id==c.id)+1,t=clubTitles(c.id);
  const mcIt=[...t.mcG.map(y=>({y})),...Array(Math.max(0,t.mc-t.mcG.length)).fill({y:''})];
  const hero=shHero(`<div class="h2b">${shield(c,'lg')}</div>`,esc(c.n),`${L?esc(L.n)+' · '+esc(dvName(c)):'Clube convidado'}${pos?' · '+pos+'º colocado':''}`,
    [c.id==S.club?'<b>SEU CLUBE</b>':'',`<b>${cpPts(t)} PTS</b> no power ranking de títulos`].filter(Boolean),
    [['Champions',t.ucl.length],['Libertadores',t.lib.length],['Mundiais',t.mc],['Ligas (jogo)',t.lg.length],['Copas (jogo)',t.dom.length],['Força',Math.round(c.s)],['Posição',pos?pos+'º':'—']]);
  const left=`<div class="pn"><h2>Estante de troféus</h2>${shelfBox('Mundial de Clubes',mcIt,x=>troIcon('mc',x.y,''))}${shelfBox('Liga dos Campeões',t.ucl.slice().sort((a,z)=>a-z),y=>troIcon('ucl',y,''))}${shelfBox('Libertadores',t.lib.slice().sort((a,z)=>a-z),y=>troIcon('lib',y,''))}${t.lg.length?shelfBox('Ligas nacionais (jogo)',t.lg.slice().sort((a,z)=>a-z),y=>troIcon('lig',y,'')):''}${t.dom.length?shelfBox('Copas nacionais (jogo)',t.dom.slice().sort((a,z)=>a-z),y=>troIcon('dom',y,'')):''}<p class="note">Champions e Libertadores: histórico real até 2025. Ligas e copas nacionais: só as temporadas do jogo. ${t.mc-t.mcG.length>0?'Mundiais sem ano são do histórico real (aprox.).':''}</p></div>
    <div class="pn pod"><h2>Vices</h2><div class="chips"><span><b>${t.uclV.length}</b>Vice Champions</span><span><b>${t.libV.length}</b>Vice Liberta.</span><span><b>${t.low.length}</b>Divisões de acesso</span></div>${[...t.uclV.map(y=>({y,t:'Vice da Champions'})),...t.libV.map(y=>({y,t:'Vice da Libertadores'}))].sort((a,z)=>z.y-a.y).slice(0,8).map(r=>`<div class="pr2"><b>${r.y}</b><span>${r.t}</span></div>`).join('')||'<p class="note" style="margin:0">Vices continentais aparecem aqui.</p>'}</div>`;
  const sq=(RC[c.id]||[]).slice().sort((a,z)=>z.ovr-a.ovr).slice(0,10);
  const right=`<div class="pn"><h2>Estatísticas</h2>${kv([['Liga',L?esc(L.k):'—'],['Divisão',esc(dvName(c))],['Força',Math.round(c.s)],['Posição',pos?pos+'º':'—'],['Pontos de título',cpPts(t)],['Títulos no jogo',t.lg.length+t.dom.length+t.ucl.length+t.lib.length]])}</div>
    <div class="pn"><h2>Craques do clube</h2>${sq.length?`<ul class="rank">${sq.map(z=>`<li onclick="sheet('p','${z.id}')"><span class="pos">${z.pos}</span>${hx(Math.round(z.ovr))}<span class="nm2">${esc(z.n)}<small>${z.age} anos · ${esc(z.nat)}</small></span></li>`).join('')}</ul>`:'<p class="empty">Nenhum craque do top 96 joga neste clube agora.</p>'}<button class="ghost" onclick="abrirElenco(${c.id})">Ver elenco completo</button></div>
    <details class="pn det"><summary>Todos os títulos</summary>${yrsLine('Liga dos Campeões',t.ucl)+yrsLine('Vice da Champions',t.uclV)+yrsLine('Libertadores',t.lib)+yrsLine('Vice da Libertadores',t.libV)+yrsLine('Liga nacional (jogo)',t.lg)+yrsLine('Copa nacional (jogo)',t.dom)+`<div class="tl"><b>Divisões de acesso (jogo) <span class="tag">${t.low.length}</span></b><small>${t.low.length?t.low.map(z=>z.y+' ('+LEAGUES[c.l].dn[z.d]+')').join(' · '):'—'}</small></div>`}</details>`;
  const rows=[];
  const stg=(m,rn,ch,id)=>{const st=m&&m[id];if(!st)return '—';if(ch)return '🏆 Campeão';return st>=rn.length?'Vice':rn[st-1]};
  S.fin.forEach(f=>{
    let d=-1,p=0;Object.entries(f.p).forEach(([k,a])=>{const i=a.indexOf(c.id);if(i>=0){d=+k.split('-')[1];p=i+1}});
    if(d<0&&!(f.k.u&&f.k.u[c.id])&&!(f.k.b&&f.k.b[c.id]))return;const h=S.champs.find(z=>z.y==f.y);
    rows.push({c:[f.y,L&&d>=0?L.dn[d]:'Convidado',d<0?'—':p==1?'🏆 1º':p+'º',stg(f.k.u,ST_UCL,h&&h.ucl.c==c.id,c.id),stg(f.k.b,ST_LIB,h&&h.lib.c==c.id,c.id),stg(f.k.d,ST_LIB,h&&L&&h.dom[L.k]==c.id,c.id)]});
  });
  rows.reverse();
  if(S.ph=='season'&&L){
    const lv=(k,rn)=>{const m=reachOf(k)[c.id];if(k.ch==c.id)return '🏆 Campeão';if(k.al.includes(c.id))return 'Em disputa ('+k.rn[k.rd]+')';return m?(m>=rn.length?'Vice':rn[m-1]):'—'};
    rows.unshift({c:[S.y+' ⏱',L.dn[c.d],pos+'º',lv(S.ucl,ST_UCL),lv(S.lib,ST_LIB),lv(S.dc[c.l],ST_LIB)],cls:'mine'});
  }
  const tmp=`<div class="pn full"><h2>Temporadas</h2>${rows.length?tbl(['Ano','Divisão','Pos.','Champions','Liberta.','Copa'],rows):'<p class="empty">As temporadas aparecem aqui ao fim de cada ano do jogo.</p>'}</div>`;
  return {title:c.n,hero:1,body:`${hero}<div class="shg"><div>${left}</div><div>${right}</div></div>${tmp}`};
}
/* lenda real (estática) */
function shL(s){
  const all=legList(),x=all.find(z=>z.st=='lenda'&&z.n==s.id);if(!x)return null;
  const yrs=BDO_REAL.filter(z=>z.n==x.n).map(z=>z.y),n=(k,v)=>Array.from({length:Math.min(v||0,14)},()=>({k,y:''}));
  const it=[...yrs.map(y=>({k:'bo',y})),...n('wc',x.wc),...n('ucl',x.ucl),...n('lib',x.lib),...n('mc',x.mc),...n('lig',x.lg)];
  const i=all.indexOf(x);
  const hero=shHero(legImg(x.n,'lgph')||`<div class="h2b"><b class="h2big">${natCode(x.nat)}</b><small>${PNQ[x.pos]||x.pos}</small></div>`,esc(x.n),`${PNQ[x.pos]||x.pos} · ${esc(x.nat)}`,
    ['<b>LENDA</b> histórico real',i<10?`<b>TOP ${i+1}</b> na história do jogo`:`<b>${i+1}º</b> no ranking de lendas`],
    [['Bolas de Ouro',x.bo],['Champions',x.ucl||0],['Libertadores',x.lib||0],['Copas do Mundo',x.wc],['Mundiais',x.mc||0],['Ligas',x.lg],['Pontos',Math.round(x.pts)]]);
  const left=`<div class="pn"><h2>Estante de troféus</h2>${shelfRows(it)}</div><div class="pn"><h2>Estante da Bola de Ouro</h2>${shelfBox('Bola de Ouro',yrs.map(y=>({y})),z=>ballTro(z.y))}</div>`;
  const right=`<div class="pn"><h2>Estatísticas</h2>${kv([['Jogos',x.ap],['Gols',x.g],['Gols/jogo',x.ap?(x.g/x.ap).toFixed(2):'—'],['Ranking',(i+1)+'º'],['Pontos',Math.round(x.pts)],['Bolas de Ouro',x.bo]])}<p class="note">Pontuação: Bolas de Ouro, Copas, Champions, Libertadores, Mundiais, ligas e gols. Números de carreira aproximados (fontes públicas); só a Bola de Ouro tem os anos.</p></div>`;
  return {title:x.n,hero:1,body:`${hero}<div class="shg"><div>${left}</div><div>${right}</div></div>`};
}
/* jogador de elenco (gerado): sem histórico detalhado */
function shQ(s){
  const [cid,slot]=String(s.id).split('.'),c=S.cs[+cid];if(!c||+slot>=sqLen(c))return null;
  const x=sqPlayer(c,+slot);
  const hero=shHero(entryCard({...x,club:x.club},'',{on:''}),esc(x.n),`${PNQ[x.pos]} · ${clubLnk(c.n,c.id)} · ${x.age} anos · ${esc(x.nat)}`,['<b>ELENCO</b> jogador de apoio'],[['OVR',x.ovr],['Potencial',x.pot],['Idade',x.age],['Posição',x.pos]]);
  return {title:x.n,hero:1,body:`${hero}<div class="shg"><div><div class="pn"><h2>Atributos</h2>${statBars(pst(x.ovr,x.pos,x.id))}</div></div><div><div class="pn"><h2>Histórico</h2><p class="note" style="margin:0">Jogador de elenco: o jogo guarda o histórico completo (títulos e temporadas) dos 96 craques do mundo e do seu jogador.</p><button class="ghost" onclick="sheet('c','${c.id}')">Ver ficha do ${esc(c.n)}</button></div></div></div>`};
}
/* seleção */
/* elenco de uma seleção: melhores jogadores da nacionalidade entre todos os clubes do jogo */
const SELSQ={};
function selSquad(n){
  const w=WCN.find(x=>x[0]==n),cc=w?w[1]:'',key=n+'|'+S.y;
  if(!SELSQ[key]){
    const all=[];
    S.cs.forEach(c=>{if(typeof SQ!=='undefined'&&SQ[c.n])sqReal(c).forEach(x=>{if(x.nat==n||x.nat==cc)all.push({...x,cid:c.id})})});
    all.sort((a,z)=>z.ovr-a.ovr);
    const gk=all.filter(x=>x.pos=='GOL').slice(0,3),rest=all.filter(x=>x.pos!='GOL').slice(0,20);
    SELSQ[key]=[...gk,...rest];
  }
  const L=SELSQ[key];if(!L.length)return '<p class="empty">Sem jogadores desta seleção nos clubes do jogo.</p>';
  const xi=L.slice().sort((a,z)=>z.ovr-a.ovr).slice(0,11),avg=Math.round(xi.reduce((s,x)=>s+x.ovr,0)/xi.length*10)/10;
  return kv([['Convocados',L.length],['Média dos 11 melhores',avg],['Melhor jogador',esc(L[0]&&xi[0].n)]])+['GOL','ZAG','VOL','MEI','PNT','ATA'].map(p=>{const g=L.filter(x=>x.pos==p);return g.length?`<h3>${PNQ[p]}s · ${g.length}</h3><ul class="rank sq">${g.map(x=>`<li class="lnk" onclick="sheet('c','${x.cid}')"><span class="pos">${p}</span>${hx(x.ovr)}<span class="nm2">${esc(x.n)}<small>${x.age} anos · ${esc(cl(x.cid).n)}</small></span></li>`).join('')}</ul>`:''}).join('');
}
function shS(s){
  const n=s.id,st=selStat(n),w=WCN.find(x=>x[0]==n),rk=selRank(),i=rk.findIndex(x=>x.n==n);
  if(i<0)return null;
  const tabs=[['res','Resumo'],['el','Elenco'],['cp','Copas']],tb=shTab(s,tabs);
  let b=shTabs(s,tabs);
  if(tb=='res')b+=kv([['Código',esc(rk[i].c)],['Ranking',(i+1)+'º'],['Títulos',st.t.length],['Vices',st.v.length],['Semifinais (jogo)',st.sf.length],['Pontos',st.pts],['Força',w?w[2]:'—'],['Sua seleção',n==S.p.nat?'Sim':'—']])+yrsLine('Anos dos títulos',st.t)+yrsLine('Anos dos vices',st.v);
  else if(tb=='el')b+=selSquad(n);
  else{
    const rows=[...WC_H.map(x=>({y:x.y,c:x.c,r:x.r})),...S.wc.map(z=>({y:z.y,c:z.champ,r:z.ru,sf:z.sf,g:1}))].filter(x=>x.c==n||x.r==n||(x.sf||[]).includes(n)).sort((a,z)=>z.y-a.y);
    b+=rows.length?tbl(['Ano','Resultado','Campeã','Vice'],rows.map(x=>({c:[x.y+(x.g?' ⚽':''),x.c==n?'🏆 Campeã':x.r==n?'Vice':'Semifinal',esc(x.c),esc(x.r)]}))):'<p class="empty">Sem títulos, vices ou semifinais registrados.</p>';
  }
  return {title:n,body:b};
}
/* e-mail */
function shM(s){
  const m=(S.mail||[]).find(z=>String(z.id)==s.id);if(!m)return null;
  if(!m.rd){m.rd=1;save()}
  return {title:m.sub,body:`<p class="note" style="margin-top:0"><b>${esc(m.from)}</b> · ${m.y} · semana ${m.w}</p><p>${esc(m.body)}</p>`};
}
function sheetHtml(){
  const s=ui.sheet,f={p:shP,me:shP,c:shC,l:shL,q:shQ,s:shS,m:shM}[s.t];let o=null;
  try{o=f?f(s):null}catch(e){console.error(e)}
  if(!o){ui.sheet=null;return ''}
  return `<div class="ov ${o.hero?'fp':''}" onclick="if(event.target==this)closeSheet()"><div class="pn sheet ${o.hero?'fp':''}"><button class="x" aria-label="Fechar" onclick="closeSheet()">×</button>${o.hero?`<div class="shtop"><button class="ghost" onclick="backSheet()">← Voltar</button></div>`:`<h2>${esc(o.title)}</h2>`}${o.body}</div></div>`;
}
