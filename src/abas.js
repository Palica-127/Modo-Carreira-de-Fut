'use strict';
/* ============================================================
   HABITE-SE 10 — ABAS NOVAS
   Jogar · Bola de Ouro · Lendas · Elenco  (Jogador usa pgPf, em ui.js)
   + fichas de jogador, clube, seleção e lenda com títulos e temporadas
   ============================================================ */
const ek=s=>encodeURIComponent(s).replace(/'/g,'%27');
const lnk=(on,t)=>`<span class="lnk" onclick="${on}">${t}</span>`;
const clubLnk=(n,id)=>{const i=id!=null?id:cn2id(n);return i!=null?lnk(`sheet('c','${i}')`,esc(n)):esc(n)};
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
/* próximos jogos da liga e das copas (as fases seguintes das copas só valem se o clube avançar) */
function upcoming(){
  const c=cl(S.club),T=rounds(c.l,c.d),rows=[],last=Math.min(SEASON,S.week+5);
  for(let w=S.week+1;w<=last;w++){
    const m=T[w-1].find(x=>x.includes(S.club));
    if(m){const home=m[0]==S.club,o=cl(home?m[1]:m[0]);rows.push({c:[w,'Liga',(home?'vs ':'@ ')+esc(o.n),Math.round(o.s)]})}
    allComps().forEach(k=>{if(k.ch==null&&k.al.includes(S.club))for(let r=k.rd;r<k.rn.length;r++)if(k.wk[r]==w)rows.push({c:[w,esc(k.n),esc(k.rn[r])+(r>k.rd?' (se avançar)':''),'—']})});
  }
  return rows.length?`<div class="pn"><h2>Calendário próximo</h2>${tbl(['Sem','Torneio','Jogo','Força'],rows)}</div>`:'';
}
const mrow=(h,a,gh,ga)=>`<div class="m ${h==S.club||a==S.club?'mine':''}" style="padding:6px 10px;margin-bottom:5px"><div class="mt"><div class="tn ${gh>ga?'win':gh<ga?'lose':''}">${shield(cl(h),'xs')}<span>${esc(cl(h).n)}</span></div><div class="sc" style="font-size:18px">${gh}<i>x</i>${ga}</div><div class="tn b ${ga>gh?'win':ga<gh?'lose':''}">${shield(cl(a),'xs')}<span>${esc(cl(a).n)}</span></div></div></div>`;
function lastRound(l,d){
  const r=(S.lr||{})[l+'-'+d];if(!r||!r.length)return '';
  return `<div class="pn full"><h2>Rodada ${S.lrw} · ${LEAGUES[l].dn[d]}</h2>${r.map(([h,a,gh,ga])=>mrow(h,a,gh,ga)).join('')}</div>`;
}
function nextRound(l,d){
  if(S.ph!='season'||S.week>SEASON)return '';
  const rd=rounds(l,d)[S.week-1];
  return `<div class="pn full"><h2>Próxima rodada (${S.week}) · ${LEAGUES[l].dn[d]}</h2>${rd.map(([a,b])=>`<div class="m ${a==S.club||b==S.club?'mine':''}" style="padding:6px 10px;margin-bottom:5px"><div class="mt"><div class="tn">${shield(cl(a),'xs')}<span>${esc(cl(a).n)}</span></div><div class="sc" style="font-size:16px"><i>x</i></div><div class="tn b">${shield(cl(b),'xs')}<span>${esc(cl(b).n)}</span></div></div></div>`).join('')}</div>`;
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
  <div class="pn"><h2>Artilharia</h2>${sc.length?tbl(['#','Jogador','Clube','Gols'],sc.map((x,i)=>({c:[i+1,esc(x.n)+(x.me?' <span class="tag">você</span>':''),tn(cl(x.c)),`<b>${x.g}</b>`],cls:x.me?'mine':''}))):'<p class="empty">Ninguém marcou ainda.</p>'}</div>`;
  return h+lastRound(ui.lg,d)+nextRound(ui.lg,d);
}
function viewCal(){
  const c=cl(S.club),T=rounds(c.l,c.d),ks=[S.dc[c.l],S.ucl,S.lib];
  let h=`<div class="pn full"><h2>Calendário — ${dvName(c)}</h2>${tbl(['Sem','Jogo','Resultado'],T.map((r,i)=>{const m=r.find(x=>x.includes(S.club)),res=S.res.filter(x=>x.w==i+1&&x.c=='Liga').map(x=>x.t).join('');return{c:[i+1,m?esc(cl(m[0]).n)+' x '+esc(cl(m[1]).n):'—',res||'—'],cls:i+1==S.week&&S.ph=='season'?'mine':''}}))}</div>`;
  h+=`<div class="pn"><h2>Datas das copas</h2>${tbl(['Competição','Fases (semana)'],ks.map(k=>({c:[esc(k.n),k.rn.map((n,i)=>esc(n)+' ('+k.wk[i]+')').join(' · ')],cls:k.ch==null&&k.al.includes(S.club)?'mine':''})).concat([{c:['Mundial de Clubes','Final (30), entre os campeões da Champions e da Libertadores']}]))}</div>`;
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
  Object.values(S.sc).forEach(e=>{if(S.cs[e.c].d==0&&e.g>0)all.push({n:e.n,c:e.c,g:e.g})});
  S.rv.forEach(r=>{if(S.cs[r.club].d==0&&r.cur.lg>0)all.push({n:r.n,c:r.club,g:r.cur.lg})});
  const mc=cl(S.club);if(mc.d==0&&S.cur&&S.cur.lg>0)all.push({n:S.p.name,c:S.club,g:S.cur.lg,me:1});
  all.sort((a,b)=>b.g-a.g);
  return `<div class="pn full"><h2>Chuteira de Ouro — 1ªs divisões</h2>${all.length?tbl(['#','Jogador','Clube','Liga','Gols'],all.slice(0,10).map((x,i)=>({c:[i+1,esc(x.n)+(x.me?' <span class="tag">você</span>':''),tn(cl(x.c)),LEAGUES[cl(x.c).l].k,`<b>${x.g}</b>`],cls:x.me?'mine':''}))):'<p class="empty">Ninguém marcou ainda.</p>'}</div>`;
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
  const row=(x,i)=>`<li class="${x.me?'me':''}" onclick="${lgOn(x)}"><span class="pos">${i+1}</span><span class="natb">${esc(x.nat)}</span><span class="nm2">${esc(x.n)}${lgTag(x)}<small>${x.pos} · ${x.bo} Bola(s) de Ouro${x.wc?' · '+x.wc+' Copa(s)':''}${x.ucl?' · '+x.ucl+' Champions':''}${x.lib?' · '+x.lib+' Libertadores':''} · ${x.g} gols</small></span><b class="pts">${Math.round(x.pts)}</b></li>`;
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
  h+=`<div class="pn full"><h2>${L.dn[E.d]} · ${L.n}</h2><ul class="rank">${stand(E.l,E.d).map((c,i)=>`<li class="${c.id==S.club?'me':''}"><span class="pos">${i+1}</span>${shield(c,'sm')}<span class="nm2">${esc(c.n)}${c.id==S.club?'<span class="tag">seu clube</span>':''}<small>${S.tb[c.id].Pt} pts · força ${Math.round(c.s)}</small></span><span class="acts2"><button class="btn-s" onclick="verElenco(${c.id})">Ver elenco</button><button class="btn-s alt" onclick="sheet('c','${c.id}')">Ficha</button></span></li>`).join('')}</ul></div>`;
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
const shelfOf=l=>`<div class="shelf">${l.map(x=>x.k=='bo'?ballTro(x.y):troIcon(x.k,x.y,x.t)).join('')||'<span class="none">Nenhum título ainda.</span>'}</div>`;
const yrsLine=(n,a)=>`<div class="tl"><b>${n} <span class="tag">${a.length}</span></b><small>${a.length?a.slice().sort((x,y)=>x-y).join(' · '):'—'}</small></div>`;
function myTitles(){
  return [...S.ti.map(x=>({k:x.k||'lig',y:x.y,t:x.t.replace(/ \(.*/,'')})),...S.aw.filter(a=>a.t.includes('BOLA DE OURO')).map(a=>({k:'bo',y:a.y}))].sort((a,b)=>a.y-b.y);
}
/* resumo dos títulos por tipo */
function titleLines(list){
  const by={};list.forEach(x=>{(by[x.k]=by[x.k]||[]).push(x.y)});
  return [['bo','Bola de Ouro'],['wc','Copa do Mundo'],['ucl','Liga dos Campeões'],['lib','Libertadores'],['mc','Mundial de Clubes'],['lig','Liga nacional'],['dom','Copa nacional']].map(([k,n])=>yrsLine(n,by[k]||[])).join('');
}
/* jogador (rival ativo, aposentado ou o seu) */
function shP(s){
  const me=s.t=='me'||s.id=='me';let x;
  if(me)x={id:'me',n:S.p.name,nat:S.p.nat,pos:S.p.pos,age:S.p.age,ovr:O(),pot:S.p.pot,club:S.club,me:1,cur:S.cur||Z};
  else{
    x=rvAny(s.id);if(x)x={...x,ovr:Math.round(x.ovr)};
    if(!x){const e=S.bdo.flatMap(b=>b.top).find(z=>z.id==s.id);if(!e)return null;x={...e,pot:e.ovr,cur:Z,ad:[0,0,0,0,0,0],car:newCar(),h:[],ghost:1}}
  }
  const tabs=[['res','Resumo'],['tit','Títulos'],['tmp','Temporadas']],tb=shTab(s,tabs),c=cl(x.club);
  let b=`<div class="shc">${entryCard({...x,club:x.club},'',{tag:me?'Você':x.ret?'Aposentado em '+x.ret:''})}</div>${shTabs(s,tabs)}`;
  const titles=me?myTitles():rvTitles(x),nt=titles.filter(z=>z.k!='bo').length;
  if(tb=='res'){
    const cu=x.cur||Z,nota=cu.ap?(cu.rs/cu.ap).toFixed(2):'—',car=x.car||newCar(),L=me?myLeg():null;
    b+=kv([['Clube',esc(c.n)],['Posição',PNQ[x.pos]||x.pos],['Idade',x.age+' anos'],['Nação',esc(x.nat)],['OVR',x.ovr],['Potencial',x.pot],['Bolas de Ouro',me?L.bo:car.bo],['Pódios',me?L.ex+L.bo:car.pod+car.bo],['Títulos',nt],['Melhor OVR',me?Math.max(S.peak,O()):car.pk||x.ovr]]);
    b+=`<h3>Atributos</h3>${statBars(me?myStats():rvStats(x))}`;
    if(!x.ret&&!x.ghost)b+=`<h3>Temporada atual</h3>${kv([['Jogos',cu.ap],['Gols',cu.g],['Assist.',cu.a],['Nota média',nota]])}`;
    const t=me?tot(false):{ap:car.ap,g:car.g,a:car.a};
    b+=`<h3>Carreira${me?'':' (desde o início do jogo)'}</h3>${kv([['Jogos',t.ap],['Gols',t.g],['Assist.',t.a],['Gols/jogo',t.ap?(t.g/t.ap).toFixed(2):'0.00']])}<button class="ghost" onclick="sheet('c','${x.club}')">Ver ficha do ${esc(c.n)}</button>`;
  }else if(tb=='tit'){
    b+=`<h3>Estante</h3>${shelfOf(titles)}<h3>Por competição</h3>${titleLines(titles)}`;
    if(!me&&x.ghost)b+='<p class="note">Este jogador saiu do ranking e não tem histórico detalhado.</p>';
  }else{
    let rows;
    if(me){
      const live=S.cur&&S.ph=='season'?[{...S.cur,l:cl(S.cur.c).l,d:cl(S.cur.c).d,pos:0,live:1}]:[];
      const all=S.hist.concat(live),lastOf={};all.forEach((z,i)=>{lastOf[z.y]=i});
      rows=all.map((z,i)=>{
        const pr=[...S.ti.filter(t=>t.y==z.y&&t.c==z.c).map(t=>t.t.replace(/ \(.*/,'')),...(lastOf[z.y]==i&&!z.live?S.aw.filter(a=>a.y==z.y).map(a=>a.t.replace('🌟 ','').replace('🏆 ','')):[])];
        return{c:[z.y+(z.live?' ⏱':''),tn(cl(z.c)),z.pos?z.pos+'º':'—',z.ap,z.g,z.a,z.ap?(z.rs/z.ap).toFixed(2):'—',esc(pr.join(', '))||'—'],cls:z.live?'mine':''};
      });
      return {title:x.n,body:b+(rows.length?`<h3>Temporadas</h3>${tbl(['Ano','Clube','Pos.','J','G','A','Nota','Títulos e prêmios'],rows)}`:'<p class="empty">Sem temporadas concluídas.</p>')};
    }
    rows=(x.h||[]).map(e=>({c:[e[0],tn(cl(e[1])),e[2],e[3],e[4],e[5],e[3]?(e[6]/100).toFixed(2):'—',e[7]?e[7]+'º':'—',esc(String(e[8]||'').split('').map(k=>TL[k]).filter(Boolean).join(', '))||'—']}));
    if(!x.ret&&!x.ghost&&S.ph=='season'&&x.cur){const u=x.cur;rows.push({c:[S.y+' ⏱',tn(cl(x.club)),Math.round(x.ovr),u.ap,u.g,u.a,u.ap?(u.rs/u.ap).toFixed(2):'—','—','—'],cls:'mine'})}
    rows.reverse();
    b+=rows.length?`<h3>Temporadas</h3>${tbl(['Ano','Clube','OVR','J','G','A','Nota','Bola','Títulos'],rows)}`:'<p class="empty">As temporadas aparecem aqui ao fim de cada ano do jogo.</p>';
  }
  return {title:x.n,body:b};
}
/* clube */
function shC(s){
  const c=cl(+s.id);if(!c)return null;
  const L=c.l>=0?LEAGUES[c.l]:null,tab=L?stand(c.l,c.d):[],pos=tab.findIndex(z=>z.id==c.id)+1,t=clubTitles(c.id);
  const tabs=[['res','Resumo'],['tit','Títulos'],['tmp','Temporadas'],['elc','Elenco']],tb=shTab(s,tabs);
  let b=`<div class="shc">${shield(c,'lg')}</div>${shTabs(s,tabs)}`;
  if(tb=='res'){
    b+=kv([['Liga',L?L.n:'—'],['Divisão',dvName(c)],['Força',Math.round(c.s)],['Posição',pos?pos+'º':'—'],['Champions',t.ucl.length],['Libertadores',t.lib.length],['Mundial',t.mc],['Ligas (jogo)',t.lg.length],['Copas (jogo)',t.dom.length],['Pontos de título',cpPts(t)]]);
    if(c.id==S.club)b+='<p class="note">Este é o seu clube.</p>';
  }else if(tb=='tit'){
    b+=yrsLine('Liga dos Campeões',t.ucl)+yrsLine('Vice da Champions',t.uclV)+yrsLine('Libertadores',t.lib)+yrsLine('Vice da Libertadores',t.libV)
      +`<div class="tl"><b>Mundial de Clubes / Intercontinental <span class="tag">${t.mc}</span></b><small>${[t.mcG.length?'No jogo: '+t.mcG.join(' · '):'',(t.mc-t.mcG.length)?(t.mc-t.mcG.length)+' no histórico real (aprox.)':''].filter(Boolean).join(' · ')||'—'}</small></div>`
      +yrsLine('Liga nacional (jogo)',t.lg)+yrsLine('Copa nacional (jogo)',t.dom)
      +`<div class="tl"><b>Divisões de acesso (jogo) <span class="tag">${t.low.length}</span></b><small>${t.low.length?t.low.map(z=>z.y+' ('+LEAGUES[c.l].dn[z.d]+')').join(' · '):'—'}</small></div>`
      +'<p class="note">Champions e Libertadores: histórico real até 2025. Ligas e copas nacionais: só as temporadas do jogo, a partir de 2026.</p>';
  }else if(tb=='tmp'){
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
    b+=rows.length?`<h3>Temporadas</h3>${tbl(['Ano','Divisão','Pos.','Champions','Liberta.','Copa'],rows)}`:'<p class="empty">As temporadas aparecem aqui ao fim de cada ano do jogo.</p>';
  }else{
    const sq=(RC[c.id]||[]).slice().sort((a,z)=>z.ovr-a.ovr).slice(0,10);
    b+=`<h3>Craques do clube</h3>${sq.length?`<ul class="rank">${sq.map(z=>`<li onclick="sheet('p','${z.id}')"><span class="pos">${z.pos}</span>${hx(Math.round(z.ovr))}<span class="nm2">${esc(z.n)}<small>${z.age} anos · ${esc(z.nat)}</small></span></li>`).join('')}</ul>`:'<p class="empty">Nenhum craque do top 96 joga neste clube agora.</p>'}<button class="ghost" onclick="abrirElenco(${c.id})">Ver elenco completo</button>`;
  }
  return {title:c.n,body:b};
}
/* lenda real (estática) */
function shL(s){
  const all=legList(),x=all.find(z=>z.st=='lenda'&&z.n==s.id);if(!x)return null;
  const yrs=BDO_REAL.filter(z=>z.n==x.n).map(z=>z.y);
  return {title:x.n,body:`${kv([['Posição',PNQ[x.pos]||x.pos],['País',esc(x.nat)],['Ranking',(all.indexOf(x)+1)+'º'],['Pontos',Math.round(x.pts)],['Bolas de Ouro',x.bo],['Copas',x.wc],['Champions',x.ucl||0],['Libertadores',x.lib||0],['Mundiais de Clubes',x.mc||0],['Ligas',x.lg],['Gols',x.g],['Jogos',x.ap]])}
    <h3>Bolas de Ouro</h3>${yrsLine('Anos',yrs)}<p class="note">Pontuação: Bolas de Ouro, Copas, Champions, Libertadores, Mundiais, ligas e gols. Números de carreira aproximados (fontes públicas).</p>`};
}
/* jogador de elenco (gerado): sem histórico detalhado */
function shQ(s){
  const [cid,slot]=String(s.id).split('.'),c=S.cs[+cid];if(!c||SQP[+slot]==null)return null;
  const x=sqPlayer(c,+slot);
  return {title:x.n,body:`<div class="shc">${entryCard({...x,club:x.club},'',{})}</div>${kv([['Clube',esc(c.n)],['Posição',PNQ[x.pos]],['Idade',x.age+' anos'],['Nação',esc(x.nat)],['OVR',x.ovr],['Potencial',x.pot]])}<h3>Atributos</h3>${statBars(pst(x.ovr,x.pos,x.id))}<p class="note">Jogador de elenco: o jogo guarda o histórico completo (títulos e temporadas) dos 96 craques do mundo e do seu jogador.</p><button class="ghost" onclick="sheet('c','${c.id}')">Ver ficha do ${esc(c.n)}</button>`};
}
/* seleção */
function shS(s){
  const n=s.id,st=selStat(n),w=WCN.find(x=>x[0]==n),rk=selRank(),i=rk.findIndex(x=>x.n==n);
  if(i<0)return null;
  const tabs=[['res','Resumo'],['cp','Copas']],tb=shTab(s,tabs);
  let b=shTabs(s,tabs);
  if(tb=='res')b+=kv([['Código',esc(rk[i].c)],['Ranking',(i+1)+'º'],['Títulos',st.t.length],['Vices',st.v.length],['Semifinais (jogo)',st.sf.length],['Pontos',st.pts],['Força',w?w[2]:'—'],['Sua seleção',n==S.p.nat?'Sim':'—']])+yrsLine('Anos dos títulos',st.t)+yrsLine('Anos dos vices',st.v);
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
  return `<div class="ov" onclick="if(event.target==this)closeSheet()"><div class="pn sheet"><button class="x" aria-label="Fechar" onclick="closeSheet()">×</button><h2>${esc(o.title)}</h2>${o.body}</div></div>`;
}
