'use strict';
/* ============================================================
   HABITE-SE 10 — INTERFACE
   Páginas: Carreira · Jogos · Ligas · Ranking · Mercado · Perfil
   ============================================================ */
const $=q=>document.querySelector(q);
let ui={pg:'car',lg:0,dv:null,lgm:'tab',rk:'bdo',pf:'at',jg:'last'};

/* ---------- peças visuais ---------- */
const IC={
 car:'<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
 jg:'<circle cx="12" cy="12" r="9"/><path d="M12 7l4 3-1.5 5h-5L8 10zM12 3v4M16 10l4-1M14.5 15l2.5 4M9.5 15L7 19M8 10L4 9"/>',
 lg:'<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v4M8 21h8M10 17h4"/>',
 rk:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
 mk:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18"/>',
 pf:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>'
};
const BALL='<svg viewBox="0 0 40 40"><defs><linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00F5A0"/><stop offset="1" stop-color="#00C2FF"/></linearGradient></defs><circle cx="20" cy="20" r="18" fill="none" stroke="url(#bg1)" stroke-width="3"/><path d="M20 10l7 5-2.7 8.3h-8.6L13 15z" fill="url(#bg1)"/><path d="M20 10V3M27 15l7-2M24.3 23.3l4.2 6.2M15.7 23.3l-4.2 6.2M13 15l-7-2" stroke="url(#bg1)" stroke-width="2.4" stroke-linecap="round"/></svg>';
const short=n=>{const p=String(n).split(' ');return p.length>1?p[0][0]+'. '+p.slice(1).join(' '):n};
const ab=n=>{const w=n.replace(/[^A-Za-zÀ-ÿ0-9 ]/g,'').split(' ').filter(x=>x.length>2||/\d/.test(x));return(w.length>1?w[0][0]+w[1][0]:n.replace(/[^A-Za-zÀ-ÿ]/g,'').slice(0,3)).toUpperCase()};
const pal=c=>{const k=CCLR[c.n];if(k)return{p:k[0],s:k[1],k:1};const h=c.hue;return{p:`hsl(${h} 58% 38%)`,s:`hsl(${(h+40)%360} 70% 62%)`,k:0}};
const hexL=x=>{if(x[0]!='#')return .2;const n=parseInt(x.slice(1),16),f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*f(n>>16)+.7152*f(n>>8&255)+.0722*f(n&255)};
const shield=(c,sz='')=>{const q=pal(c),t=ab(c.n),tx=hexL(q.p)>.45?'#111':'#fff';return `<span class="shield ${sz}"><svg viewBox="0 0 40 46"><path d="M20 2 36 7v17c0 10-7 17-16 20C11 41 4 34 4 24V7z" fill="${q.p}" stroke="${q.s}" stroke-width="2.5"/><path d="M20 2 36 7v6H4V7z" fill="${q.s}" opacity=".35"/><text x="20" y="29" text-anchor="middle" font-size="${t.length>2?12:15}" font-weight="700" fill="${tx}" font-family="Barlow Condensed,Arial Narrow,sans-serif">${t}</text></svg></span>`};
const bust=(h,c)=>`<svg viewBox="0 0 70 84"><path d="M8 84c0-22 12-34 27-34s27 12 27 34z" fill="${c?pal(c).p:`hsl(${h} 60% 42%)`}"/><rect x="29" y="38" width="12" height="14" rx="4" fill="#d9ab84"/><circle cx="35" cy="28" r="15" fill="#e8c4a0"/><path d="M20 26c0-12 8-16 15-16s15 4 15 16c-3-6-8-8-15-8s-12 2-15 8z" fill="#2b1d14"/></svg>`;
const tierOf=o=>o>=85?4:o>=75?3:o>=65?2:1;
const pst=(ovr,pos,seed)=>['VEL','FIN','PAS','DRI','DEF','FIS'].map((l,i)=>[l,C(Math.round(ovr+PROF[pos][i]+(hash(String(seed)+i)%7-3)),25,99)]);
const myStats=(at=S.at)=>[['VEL',Math.floor(at[0])],['FIN',Math.floor(at[1])],['PAS',Math.round((at[2]+at[6])/2)],['DRI',Math.floor(at[3])],['DEF',Math.floor(at[4])],['FIS',Math.floor(at[5])]];
function card(o){
  const cls=o.kind||('t'+tierOf(o.ovr));
  return `<div class="fut ${cls} ${o.sz||''} ${o.me?'me':''} ${o.inj?'inj':''}" ${o.on?`onclick="${o.on}"`:''}><b class="fo">${o.ovr}</b><i class="fr">${o.pos}</i><i class="fn">${o.nat}</i><span class="fs">${shield(o.club,'xs')}</span><span class="fa">${bust(o.club.hue,o.club)}</span><span class="fnm">${esc(o.name)}</span><span class="fst">${o.st.map(([l,v])=>`<span><b>${v}</b><small>${l}</small></span>`).join('')}</span>${o.tag?`<i class="ft">${esc(o.tag)}</i>`:''}</div>`;
}
const myCard=(sz='',extra={})=>card({ovr:O(),pos:S.p.pos,nat:natCode(S.p.nat),name:short(S.p.name),club:cl(S.club),st:myStats(),sz,me:1,inj:S.inj>0,tag:S.y+' · '+PN[S.p.pos],...extra});
const entryCard=(x,sz,extra={})=>card({ovr:x.ovr,pos:x.pos,nat:natCode(x.nat),name:short(x.n),club:cl(x.club),st:x.me?myStats():pst(x.ovr,x.pos,x.id),sz,me:x.me,...extra});
const hx=(v,sz='')=>`<span class="hx t${tierOf(v)} ${sz}">${v}</span>`;
const tn=(c,cls='')=>`<span class="tn ${cls}">${shield(c,'sm')}<span>${esc(c.n)}</span></span>`;
const tbl=(heads,rows)=>`<div class="tw"><table class="tb"><tr>${heads.map(x=>`<th>${x}</th>`).join('')}</tr>${rows.map(r=>`<tr class="${r.cls||''}">${r.c.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')}</table></div>`;
const pills=(items,cur,fn)=>`<div class="pills">${items.map(([k,l])=>`<button class="pill" aria-pressed="${cur==k}" onclick="${fn}('${k}')">${l}</button>`).join('')}</div>`;
const TRO={lig:['#3AC6D3','Liga'],dom:['#B9C4D0','Copa'],ucl:['#7AA2FF','UCL'],lib:['#F2D58C','LIB'],mc:['#C58BFF','Mundial'],bo:['#FFD84D','Bola']};
const troIcon=(k,y,lab)=>{const c=TRO[k][0];return `<div class="tro"><svg viewBox="0 0 44 54"><path d="M12 4h20v14c0 8-4.5 13-10 13s-10-5-10-13zM12 8H5v3c0 5 3 8 8 9M32 8h7v3c0 5-3 8-8 9" fill="${c}" stroke="rgba(0,0,0,.35)" stroke-width="1.2"/><rect x="19" y="30" width="6" height="9" fill="${c}"/><rect x="13" y="39" width="18" height="6" rx="1.5" fill="${c}"/><rect x="11" y="45" width="22" height="5" rx="1.5" fill="#6b4a1f"/></svg><b>${y}</b><span>${esc(lab||TRO[k][1])}</span></div>`};
const ballTro=y=>`<div class="tro"><svg viewBox="0 0 44 54"><circle cx="22" cy="24" r="17" fill="#FFD84D" stroke="rgba(0,0,0,.35)" stroke-width="1.4"/><path d="M22 14l7 5-2.7 8h-8.6L15 19z" fill="#B8860B"/><rect x="11" y="43" width="22" height="7" rx="1.5" fill="#6b4a1f"/></svg><b>${y}</b><span>Bola de Ouro</span></div>`;
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),2700)}

/* ---------- gráficos ---------- */
const CLR=['#00F5A0','#F5A524','#4aa3ff','#e5484d','#b57bff','#2dd4bf','#e879f9','#a3a3a3'];
function chart(ser){
  const h=200,W=600,all=ser.flatMap(s=>s.d),mn=Math.min(...all)-2,mx=Math.max(...all)+2,n=ser[0].d.length;
  const x=i=>30+i*(W-50)/Math.max(1,n-1),y=v=>h-20-(v-mn)/(mx-mn||1)*(h-40);
  return `<svg viewBox="0 0 ${W} ${h}" style="width:100%">${[0,1,2,3].map(i=>{const v=mn+(mx-mn)*i/3;return `<line x1="30" x2="${W-10}" y1="${y(v)}" y2="${y(v)}" stroke="rgba(130,150,255,.25)"/><text x="2" y="${y(v)+4}" font-size="10" fill="#9AA7DB">${Math.round(v)}</text>`}).join('')}${ser.map(s=>`<polyline fill="none" stroke="${s.c}" stroke-width="2" points="${s.d.map((v,i)=>x(i)+','+y(v)).join(' ')}"/>`).join('')}</svg><div class="lgx">${ser.map(s=>`<span><b style="background:${s.c}"></b>${s.n}</span>`).join('')}</div>`;
}
const evo=()=>S.sn.length<2?'<p class="note">O gráfico aparece depois da primeira metade da temporada.</p>':chart([{n:'OVR',c:CLR[0],d:S.sn.map(s=>s.o)},...A.map((n,i)=>({n,c:CLR[i+1],d:S.sn.map(s=>s.at[i])}))]);
function bars(ys,vs){const m=Math.max(1,...vs),w=600/ys.length;return `<svg viewBox="0 0 600 150" style="width:100%">${vs.map((v,i)=>`<rect x="${i*w+3}" y="${120-v/m*100}" width="${Math.max(2,w-6)}" height="${v/m*100}" fill="#00F5A0" rx="3"/><text x="${i*w+w/2}" y="${114-v/m*100}" font-size="11" text-anchor="middle" fill="#F4F7FF">${v}</text><text x="${i*w+w/2}" y="140" font-size="9" text-anchor="middle" fill="#9AA7DB">${String(ys[i]).slice(2)}</text>`).join('')}</svg>`}
const abars=()=>A.map((n,i)=>`<div class="ar"><span>${n}</span><div class="bar"><i style="width:${S.at[i]}%"></i></div><b>${Math.floor(S.at[i])}</b><small>/${Math.round(cap(i))}</small></div>`).join('');

/* ---------- estrutura: HUD, navegação, eventos ---------- */
function hud(){
  const idx=S.ph!='season'?4:S.week==1?0:S.week<=15?1:S.week<=17?2:3;
  return `<header class="hud"><div class="logo">${BALL}<div><div class="eyebrow">Carreira de craque</div><h1>${GAME_NAME}</h1></div></div><div class="season"><small>Temporada</small><b>${S.y}</b></div></header>
  <ol class="trk">${['Início','1º turno','Janela','2º turno','Prêmios'].map((n,i)=>`<li class="${i<idx?'done':i==idx?'now':''}"><i></i>${n}</li>`).join('')}</ol>`;
}
const NAVS=[['car','Carreira'],['jg','Jogos'],['lg','Ligas'],['rk','Ranking'],['mk','Mercado'],['pf','Perfil']];
const nav=()=>`<nav class="nav" role="tablist">${NAVS.map(([k,n])=>`<button class="nb" role="tab" aria-selected="${ui.pg==k}" onclick="go('${k}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${IC[k]}</svg>${n}</button>`).join('')}</nav>`;
const evm=()=>`<div class="ov"><div class="pn"><h2>${S.ev[0]}</h2><p>${S.ev[1]}</p>${S.ev[2].map((o,i)=>`<button class="ghost opt" onclick="pick(${i})">${o[0]}</button>`).join('')}</div></div>`;
function go(p){ui.pg=p;render();window.scrollTo(0,0)}
function sub(k,v){ui[k]=v;if(k=='lg')ui.dv=null;render(true)}
function setDv(d){ui.dv=+d;render(true)}
function setTr(a,i){if(a!=null)S.tr.a=a;if(i!=null)S.tr.i=i;save();render(true)}

/* ---------- Carreira ---------- */
function nextMatches(){
  const c=cl(S.club),w=S.week,o=[];
  const m=rounds(c.l<0?0:c.l,c.d)[w-1].find(x=>x.includes(S.club));
  if(m)o.push({n:'Liga — '+dvName(c),h:m[0],a:m[1]});
  allComps().forEach(k=>{if(k.ch==null&&k.wk[k.rd]==w&&k.al.includes(S.club))o.push({n:k.n+' — '+k.rn[k.rd]})});
  if(w==30&&S.ucl.ch!=null&&S.lib.ch!=null&&!S.mc&&(S.ucl.ch==S.club||S.lib.ch==S.club))o.push({n:'Mundial de Clubes — Final',h:S.ucl.ch,a:S.lib.ch});
  return o;
}
function mini(r){
  const h=cl(r.h),a=cl(r.a),w=r.win;
  return `<div class="m ${r.h==S.club||r.a==S.club?'mine':''}"><div class="mt"><div class="tn ${w==r.h?'win':w==r.a?'lose':''}">${shield(h,'sm')}<span>${esc(h.n)}</span></div><div class="sc">${r.g[0]}<i>x</i>${r.g[1]}</div><div class="tn b ${w==r.a?'win':w==r.h?'lose':''}">${shield(a,'sm')}<span>${esc(a.n)}</span></div></div><div class="mi"><span>${esc(r.comp)}${r.pen?' · pênaltis':''}</span>${r.pl?`<span>Nota <b>${r.rt}</b> · ${r.mn}' · ${r.gl} gol(s) · ${r.as} assist.</span>`:'<span>Você não atuou</span>'}</div></div>`;
}
function mcard(r){
  const h=cl(r.h),a=cl(r.a),w=r.win;
  return `<div class="m ${r.h==S.club||r.a==S.club?'mine':''}">${r.pen?'<span class="zb ok">Pênaltis</span>':''}<div class="mt"><div class="tn ${w==r.h?'win':w==r.a?'lose':''}">${shield(h,'sm')}<span>${esc(h.n)}</span></div><div class="sc">${r.g[0]}<i>x</i>${r.g[1]}</div><div class="tn b ${w==r.a?'win':w==r.h?'lose':''}">${shield(a,'sm')}<span>${esc(a.n)}</span></div></div>
  <div class="mi"><span>${esc(r.comp)}</span><span>Posse ${r.po}% x ${100-r.po}% · Chutes ${r.sh[0]} x ${r.sh[1]}</span></div>
  <div class="mi">${r.pl?`<span>Sua atuação: <b>${r.mn}'</b> · nota <b>${r.rt}</b> · ${r.gl} gol(s) · ${r.as} assist. ${r.yc?'🟨':''}${r.rc?'🟥':''}</span>`:'<span>Você não atuou.</span>'}</div>
  <details class="det"><summary>Lance a lance</summary><div class="log">${r.ev.map(e=>`<div class="e ${e.c}"><b>${e.m}’</b> ${e.t}</div>`).join('')}</div></details></div>`;
}
function offBlock(){
  const m=S.sum,L=LEAGUES[m.l];
  const top3=m.top3.map((x,i)=>`<div class="pd p${i+1}">${entryCard(x,'',{kind:i==0?'bo':''})}<b>${esc(short(x.n))}</b><small>${Math.round(x.pts)} pts</small></div>`);
  const o=[top3[1],top3[0],top3[2]].filter(Boolean).join('');
  return `<div class="cele"><small>Temporada ${m.y} encerrada</small><b>${m.pos}º lugar · ${L.dn[m.d]}</b><span class="muted">Campeão: ${esc(m.champ)} · ${m.ap} jogos · ${m.g} gols · ${m.a} assist. · nota ${m.avg.toFixed(2)}</span>
   ${m.move>0?'<div class="chip" style="color:var(--acc)">⬆ Acesso</div>':m.move<0?'<div class="chip" style="color:var(--bad)">⬇ Rebaixamento</div>':''}${m.aw.map(x=>`<div class="chip" style="color:var(--gold)">${x}</div>`).join('')}</div>
  <div class="pn"><h2>Bola de Ouro ${m.y}</h2><div class="podium">${o}</div><p class="note">${m.rk?`Você terminou em ${m.rk}º lugar.`:'Você não entrou na disputa (poucos jogos na temporada).'} Veja o top 10 na aba Ranking.</p></div>
  <div class="pn"><h2>Campeões do ano</h2><div class="kv"><div><small>Liga dos Campeões</small><b>${m.ucl!=null?esc(cl(m.ucl).n):'—'}</b></div><div><small>Libertadores</small><b>${m.lib!=null?esc(cl(m.lib).n):'—'}</b></div><div><small>Mundial de Clubes</small><b>${m.mc!=null?esc(cl(m.mc).n):'—'}</b></div></div></div>
  <button class="play" onclick="roll()">Iniciar temporada ${S.y+1}</button>`;
}
function pgCar(){
  if(S.ph=='ret')return ana();
  const c=cl(S.club),L=lg(c);let h='';
  if(S.ph=='off')h+=offBlock();
  else{
    const nm=nextMatches();
    h+=`<div class="pn"><div class="banner"><small>Semana ${S.week} de ${SEASON}</small><b>Próximos jogos</b></div>
    ${nm.map(x=>x.h!=null?`<div class="m ${x.h==S.club||x.a==S.club?'mine':''}"><div class="mt"><div class="tn">${shield(cl(x.h),'sm')}<span>${esc(cl(x.h).n)}</span></div><div class="sc"><i>x</i></div><div class="tn b">${shield(cl(x.a),'sm')}<span>${esc(cl(x.a).n)}</span></div></div><div class="mi"><span>${esc(x.n)}</span></div></div>`:`<div class="m mine"><div class="mi"><span>🏆 ${esc(x.n)}</span><span>adversário sorteado</span></div></div>`).join('')||'<p class="empty">Sem jogos nesta semana.</p>'}
    <p class="note" style="margin:0 0 10px">Papel: <b>${role()}</b>${S.inj?' · fora por '+S.inj+' sem.':''} · Treino: ${TN[S.tr.a]} (${['leve','normal','intenso'][S.tr.i]})</p>
    <button class="play" onclick="adv()" ${S.ev?'disabled':''}>▶ Jogar semana</button>
    <div class="row" style="margin:0"><button class="ghost" onclick="simN(5)" ${S.ev?'disabled':''}>⏩ +5 semanas</button><button class="ghost" onclick="simN(30)" ${S.ev?'disabled':''}>⏭ Até um evento ou o fim</button></div></div>`;
  }
  const ct=S.ct;
  h+=`<div class="pn"><h2>Seu jogador</h2><div class="heroc">${myCard('big')}<div class="info"><h3>${esc(S.p.name)}</h3><div class="tm">${shield(c,'sm')}<span>${esc(c.n)} · ${dvName(c)} (${L.n})</span></div>
    <div class="kv"><div><small>Idade</small><b>${S.p.age} anos</b></div><div><small>Potencial</small><b>${C(S.p.pot-3,0,99)}–${C(S.p.pot+3,0,99)}</b></div><div><small>Contrato</small><b>${ct.yrs} ano(s)</b></div><div><small>Salário</small><b>${F(ct.sal)}/sem</b></div><div><small>Valor de mercado</small><b>${F(val())}</b></div><div><small>Papel</small><b>${role()}</b></div></div>${S.loan?`<p class="note">Emprestado de ${esc(cl(S.loan.from).n)} até o fim da temporada.</p>`:''}</div></div></div>
  <div class="cab"><div><b>${Math.round(S.cond)}%</b><small>Condição</small></div><div><b>${Math.round(S.mor)}</b><small>Moral</small></div><div><b>${S.form.toFixed(1)}</b><small>Forma</small></div><div><b>${Math.round(S.rep)}</b><small>Reputação</small></div><div><b>${Math.round(S.pop)}</b><small>Popularidade</small></div><div><b>${F(S.money)}</b><small>Patrimônio</small></div></div>`;
  if(S.last.length&&S.ph=='season')h+=`<div class="pn"><h2>Última rodada</h2>${S.last.map(mini).join('')}<p class="note">Veja o lance a lance na aba Jogos.</p></div>`;
  h+=`<div class="pn"><h2>Treino da semana</h2><div class="sub" style="margin-top:0">Foco</div><div class="pills">${TN.map((n,i)=>`<button class="pill" aria-pressed="${S.tr.a==i}" onclick="setTr(${i},null)">${n}</button>`).join('')}</div>
    <div class="sub">Intensidade</div><div class="pills">${['Leve','Normal','Intensa'].map((n,i)=>`<button class="pill" aria-pressed="${S.tr.i==i}" onclick="setTr(null,${i})">${n}</button>`).join('')}</div>
    <p class="note">Treino intenso evolui mais, mas cansa e aumenta o risco de lesão. Descanso recupera a condição; fisioterapia acelera a recuperação. A evolução cai com a idade e é limitada pelo potencial (valor após “/”).</p>${abars()}</div>
  <div class="pn"><h2>Notícias</h2>${S.nw.slice(0,8).map(n=>`<div class="nw"><small>${n.y} S${n.w}</small><span>${n.t}</span></div>`).join('')}</div>`;
  if(S.p.age>=34&&O()<70)h+=`<div class="msg full">Seu rendimento caiu: considere se aposentar (aba Perfil → Sistema).</div>`;
  return h;
}

/* ---------- Jogos ---------- */
function pgJg(){
  let h=pills([['last','Última rodada'],['sea','Temporada'],['cal','Calendário']],ui.jg,'jgSet');
  if(ui.jg=='last')h+=S.last.length?S.last.map(r=>`<div class="pn full" style="padding:10px">${mcard(r)}</div>`).join(''):'<div class="pn full"><p class="empty">Nenhuma partida na última semana.</p></div>';
  else if(ui.jg=='sea'){
    const cu=S.cur||Z;
    h+=`<div class="pn"><h2>Temporada ${S.y}</h2><div class="cab"><div><b>${cu.ap}</b><small>Jogos</small></div><div><b>${cu.g}</b><small>Gols</small></div><div><b>${cu.a}</b><small>Assist.</small></div></div><p class="note">Nota média: ${cu.ap?(cu.rs/cu.ap).toFixed(2):'—'} · Gols na liga: ${cu.lg}</p></div>
    <div class="pn"><h2>Resultados</h2>${S.res.length?tbl(['Sem','Competição','Resultado','Nota'],S.res.slice().reverse().map(r=>({c:[r.w,r.c.replace(/ — .*/,''),r.t,r.rt||'—']}))):'<p class="empty">Ainda sem jogos.</p>'}</div>`;
  }else{
    const c=cl(S.club),T=rounds(c.l,c.d);
    h+=`<div class="pn full"><h2>Calendário — ${dvName(c)}</h2>${tbl(['Sem','Jogo','Resultado'],T.map((r,i)=>{const m=r.find(x=>x.includes(S.club)),res=S.res.filter(x=>x.w==i+1&&x.c=='Liga').map(x=>x.t).join('');return{c:[i+1,m?esc(cl(m[0]).n)+' x '+esc(cl(m[1]).n):'—',res||'—'],cls:i+1==S.week&&S.ph=='season'?'mine':''}}))}</div>`;
  }
  return h;
}

/* ---------- Ligas ---------- */
function stTable(l,d){
  const T=stand(l,d),L=LEAGUES[l],nd=L.dn.length,my=cl(S.club);
  const rows=T.map((x,i)=>{const r=S.tb[x.id];let z='';
    if(d==0){if(i<(UCLQ[L.k]||0))z='zu';else if(i<(LIBQ[L.k]||0))z='zl'}
    if(d>0&&i<2)z='zp';if(d<nd-1&&i>=T.length-2)z='zd';
    return{c:['',i+1,tn(x),r.P,r.W,r.D,r.L,r.F-r.A,`<b>${r.Pt}</b>`],cls:(x.id==S.club?'mine ':'')+z}});
  return tbl(['','#','Clube','J','V','E','D','SG','Pts'],rows)+`<div class="lgd">${d==0&&UCLQ[L.k]?'<span><i style="background:var(--acc2)"></i>Champions</span>':''}${d==0&&LIBQ[L.k]?'<span><i style="background:var(--gold)"></i>Libertadores</span>':''}${d>0?'<span><i style="background:var(--ok)"></i>Acesso</span>':''}${d<nd-1?'<span><i style="background:var(--bad)"></i>Rebaixamento</span>':''}</div>`;
}
function compView(k){
  const st=k.ch!=null?`Campeão: <b style="color:var(--gold)">${esc(cl(k.ch).n)}</b>${k.ru!=null?' · vice: '+esc(cl(k.ru).n):''}`:k.rd<k.rn.length?`Próxima fase: <b>${k.rn[k.rd]}</b> (semana ${k.wk[k.rd]}) · ${k.al.length} clube(s) vivo(s)`:'';
  const rds=[...new Set(k.log.map(x=>x[0]))].reverse();
  return `<div class="pn"><h2>${esc(k.n)}</h2><p class="note" style="margin-top:0">${st}${k.pl?'<span class="tag">seu clube</span>':''}</p>
  ${rds.length?rds.map(rd=>`<div class="sub">${k.rn[rd]}</div>${k.log.filter(x=>x[0]==rd).map(x=>`<div class="m ${x[1]==S.club||x[2]==S.club?'mine':''}" style="padding:6px 10px;margin-bottom:5px"><div class="mt"><div class="tn ${x[5]==x[1]?'win':'lose'}">${shield(cl(x[1]),'xs')}<span>${esc(cl(x[1]).n)}</span></div><div class="sc" style="font-size:20px">${x[3]}<i>x</i>${x[4]}</div><div class="tn b ${x[5]==x[2]?'win':'lose'}">${shield(cl(x[2]),'xs')}<span>${esc(cl(x[2]).n)}</span></div></div>${x[6]?'<div class="mi"><span>decidido nos pênaltis</span></div>':''}</div>`).join('')}`).join(''):'<p class="empty">A competição ainda não começou.</p>'}</div>`;
}
function champHist(l){
  const L=LEAGUES[l];
  if(!S.champs.length)return '<div class="pn full"><p class="empty">Os campeões aparecem aqui ao fim de cada temporada: Liga dos Campeões, Libertadores, Mundial de Clubes e as ligas nacionais.</p></div>';
  const nmc=id=>id==null?'—':tn(cl(id));
  const t=(key)=>{const cnt={};S.champs.forEach(c=>{const id=c[key].c;if(id!=null)cnt[id]=(cnt[id]||0)+1});return Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,8)};
  const tt=(key,title)=>`<div class="pn"><h2>Quadro de títulos — ${title}</h2>${tbl(['','Clube','Títulos'],t(key).map(([id,n],i)=>({c:[i+1,tn(cl(+id)),`<b>${n}</b>`]})))}</div>`;
  return `<div class="pn full"><h2>Campeões por temporada</h2>${tbl(['Ano','Champions','Libertadores','Mundial',L.dn[0],'Copa'],S.champs.slice().reverse().map(c=>({c:[c.y,nmc(c.ucl.c),nmc(c.lib.c),nmc(c.mc),nmc(c.lg[L.k]),nmc(c.dom[L.k])]})))}</div>${tt('ucl','Liga dos Campeões')}${tt('lib','Libertadores')}`;
}
function pgLg(){
  const L=LEAGUES[ui.lg];if(ui.dv==null)ui.dv=cl(S.club).l==ui.lg?cl(S.club).d:0;
  let h=`<div class="pills scroll full">${LEAGUES.map((x,i)=>`<button class="pill" aria-pressed="${ui.lg==i}" onclick="sub('lg',${i})">${x.k}</button>`).join('')}</div>`;
  h+=`<div class="pills">${[['tab','Tabelas'],['cup','Copas'],['champ','Campeões']].map(([k,n])=>`<button class="pill" aria-pressed="${ui.lgm==k}" onclick="sub('lgm','${k}')">${n}</button>`).join('')}</div>`;
  if(ui.lgm=='tab'){
    h+=`<div class="pills">${L.dn.map((n,i)=>`<button class="pill" aria-pressed="${ui.dv==i}" onclick="setDv(${i})">${n}</button>`).join('')}</div>`;
    const d=ui.dv,sc=scorers(ui.lg,d).slice(0,10);
    h+=`<div class="pn"><h2>${L.dn[d]} · ${L.n}</h2>${stTable(ui.lg,d)}</div>
    <div class="pn"><h2>Artilharia</h2>${sc.length?tbl(['#','Jogador','Clube','Gols'],sc.map((x,i)=>({c:[i+1,esc(x.n)+(x.me?' <span class="tag">você</span>':''),tn(cl(x.c)),`<b>${x.g}</b>`],cls:x.me?'mine':''}))):'<p class="empty">Ninguém marcou ainda.</p>'}</div>`;
    if(S.ph=='season'){const rd=rounds(ui.lg,d)[Math.min(S.week,SEASON)-1];h+=`<div class="pn full"><h2>Rodada ${Math.min(S.week,SEASON)}</h2>${rd.map(([a,b])=>`<div class="m ${a==S.club||b==S.club?'mine':''}" style="padding:6px 10px;margin-bottom:5px"><div class="mt"><div class="tn">${shield(cl(a),'xs')}<span>${esc(cl(a).n)}</span></div><div class="sc" style="font-size:16px"><i>x</i></div><div class="tn b">${shield(cl(b),'xs')}<span>${esc(cl(b).n)}</span></div></div></div>`).join('')}</div>`}
  }else if(ui.lgm=='cup'){
    h+=compView(S.dc[ui.lg])+compView(S.ucl)+compView(S.lib)+(S.mc?compView(S.mc):'');
  }else h+=champHist(ui.lg);
  return h;
}

/* ---------- Ranking ---------- */
function bdoRows(list,prev,showMv=true){
  return `<ul class="rank">${list.map((x,i)=>{const c=cl(x.club),p=prev?prev(x):0,mv=!showMv?'':!p?'<span class="mv new">NOVO</span>':p>i+1?`<span class="mv up">▲${p-i-1}</span>`:p<i+1?`<span class="mv dn">▼${i+1-p}</span>`:'';
    return `<li class="${x.me?'me':''}"><span class="pos">${x.rank||i+1}</span>${hx(x.ovr)}<span class="nm2">${esc(x.n)}${x.me?'<span class="tag">você</span>':''}${mv}<small>${esc(c.n)} · ${x.pos} · ${x.age} anos</small></span><span class="pt">${Math.round(x.pts)}<small>pontos</small></span></li>`}).join('')}</ul>`;
}
function podiumOf(list){
  const t=list.slice(0,3).map((x,i)=>`<div class="pd p${i+1}">${entryCard(x,'',{kind:i==0?'bo':''})}<b>${esc(short(x.n))}</b><small>${Math.round(x.pts)} pts</small><span class="bs">${i+1}º</span></div>`);
  return `<div class="podium">${[t[1],t[0],t[2]].filter(Boolean).join('')}</div>`;
}
function pgRk(){
  let h=pills([['bdo','Bola de Ouro'],['ovr','Top 10 OVR'],['art','Artilheiros'],['clb','Clubes'],['his','Vencedores'],['leg','Lendas']],ui.rk,"rkSet");
  if(ui.rk=='bdo'){
    const off=S.ph!='season',last=S.bdo[S.bdo.length-1];
    if(off&&last){
      h+=podiumOf(last.top)+`<div class="pn"><h2>Bola de Ouro ${last.y}</h2>${bdoRows(last.top,x=>x.prev,S.bdo.length>1)}<p class="note">${last.me?`Você terminou em ${last.me}º.`:'Você ficou fora da disputa.'}</p></div>`;
    }else{
      const l=bdoList(false);
      if(!l.length)h+='<div class="pn"><p class="empty">A corrida da Bola de Ouro começa depois das primeiras rodadas. A pontuação combina nota média, gols, assistências, títulos, OVR, reputação e força da liga.</p></div>';
      else{
        const top=l.slice(0,10),me=l.findIndex(x=>x.me);
        h+=podiumOf(l)+`<div class="pn"><h2>Corrida da Bola de Ouro</h2><p class="note" style="margin-top:0">Parcial da semana ${S.week-1} de ${SEASON}, projetada.${Object.keys(S.bdoPrev).length?' As setas comparam com a temporada passada.':''}</p>${bdoRows(top,x=>S.bdoPrev[x.id]||0,Object.keys(S.bdoPrev).length>0)}${me>=10?`<p class="note">Sua posição: <b>${me+1}º</b> com ${Math.round(l[me].pts)} pontos.</p>`:me<0?'<p class="note">Você precisa de mais jogos para entrar na disputa.</p>':''}</div>`;
      }
    }
  }else if(ui.rk=='ovr'){
    const l=[...S.rv.map(r=>({id:r.id,n:r.n,club:r.club,pos:r.pos,age:r.age,ovr:Math.round(r.ovr),nat:r.nat,pts:r.ovr})),{id:'me',n:S.p.name,club:S.club,pos:S.p.pos,age:S.p.age,ovr:O(),nat:S.p.nat,pts:O(),me:1}].sort((a,b)=>b.pts-a.pts);
    const me=l.findIndex(x=>x.me);
    h+=`<div class="pn full"><h2>Melhores jogadores do mundo</h2><div class="futr">${l.slice(0,5).map(x=>entryCard(x,'sm',{tag:'#'+(l.indexOf(x)+1)})).join('')}</div></div>
    <div class="pn"><h2>Top 10 por OVR</h2><ul class="rank">${l.slice(0,10).map((x,i)=>`<li class="${x.me?'me':''}"><span class="pos">${i+1}</span>${hx(x.ovr)}<span class="nm2">${esc(x.n)}${x.me?'<span class="tag">você</span>':''}<small>${esc(cl(x.club).n)} · ${x.pos} · ${x.age} anos</small></span><span class="pt">${x.ovr}<small>OVR</small></span></li>`).join('')}</ul>${me>=10?`<p class="note">Você é o ${me+1}º melhor do mundo.</p>`:''}</div>`;
  }else if(ui.rk=='art'){
    const all=[];
    Object.values(S.sc).forEach(e=>{if(S.cs[e.c].d==0&&e.g>0)all.push({n:e.n,c:e.c,g:e.g})});
    S.rv.forEach(r=>{if(S.cs[r.club].d==0&&r.cur.lg>0)all.push({n:r.n,c:r.club,g:r.cur.lg})});
    const mc=cl(S.club);if(mc.d==0&&S.cur&&S.cur.lg>0)all.push({n:S.p.name,c:S.club,g:S.cur.lg,me:1});
    all.sort((a,b)=>b.g-a.g);
    h+=`<div class="pn full"><h2>Chuteira de Ouro — 1ªs divisões</h2>${all.length?tbl(['#','Jogador','Clube','Liga','Gols'],all.slice(0,10).map((x,i)=>({c:[i+1,esc(x.n)+(x.me?' <span class="tag">você</span>':''),tn(cl(x.c)),LEAGUES[cl(x.c).l].k,`<b>${x.g}</b>`],cls:x.me?'mine':''}))):'<p class="empty">Ninguém marcou ainda.</p>'}</div>`;
  }else if(ui.rk=='clb'){
    const l=S.cs.filter(c=>c.l>=0).sort((a,b)=>b.s-a.s).slice(0,10);
    h+=`<div class="pn full"><h2>Top 10 clubes do mundo</h2><ul class="rank">${l.map((c,i)=>`<li class="${c.id==S.club?'me':''}"><span class="pos">${i+1}</span>${shield(c,'sm')}<span class="nm2">${esc(c.n)}<small>${LEAGUES[c.l].n} · ${dvName(c)}</small></span><span class="pt">${Math.round(c.s)}<small>força</small></span></li>`).join('')}</ul></div>`;
  }else if(ui.rk=='leg'){
    const t=tot(false),bo=S.aw.filter(x=>x.t.includes('BOLA DE OURO')).length,uc=S.ti.filter(x=>x.k=='ucl').length,lb=S.ti.filter(x=>x.k=='lib').length;
    const mine={n:S.p.name,nat:S.p.nat,pos:S.p.pos,bo,wc:0,ucl:uc,lib:lb,lg:S.ti.filter(x=>x.k=='lig').length,g:t.g,ap:t.ap,me:1};
    const l=[...LEG,mine].map(x=>({...x,pts:legPts(x)})).sort((a,b)=>b.pts-a.pts),mi=l.findIndex(x=>x.me);
    h+=`<div class="pn full"><h2>Top 10 da história</h2><ul class="rank">${l.slice(0,10).map((x,i)=>`<li class="${x.me?'me':''}"><span class="pos">${i+1}</span><span class="nm2">${esc(x.n)}${x.me?' <span class="tag">você</span>':''}<small>${x.nat} · ${x.pos} · ${x.bo} Bola(s) de Ouro${x.wc?' · '+x.wc+' Copa(s)':''}${x.ucl?' · '+x.ucl+' Champions':''} · ${x.g} gols</small></span><b class="pts">${Math.round(x.pts)}</b></li>`).join('')}</ul>${mi>=10?`<p class="note">Sua posição na história: <b>${mi+1}º</b> com ${Math.round(l[mi].pts)} pontos.</p>`:''}<p class="note">Pontuação = Bolas de Ouro, Copas do Mundo, Champions, Libertadores, ligas e gols. Números de carreira aproximados (fontes públicas); a Seleção ainda não existe no jogo, então os Mundiais só contam para as lendas.</p></div>`;
  }else{
    h+=`<div class="pn full"><h2>Vencedores da Bola de Ouro</h2>${S.bdo.length?tbl(['Ano','Vencedor','Clube','Pts','Você'],S.bdo.slice().reverse().map(b=>{const w=b.top[0];return{c:[b.y,esc(w.n)+(w.me?' <span class="tag">você</span>':''),tn(cl(w.club)),Math.round(w.pts),b.me?b.me+'º':'—'],cls:w.me?'mine':''}})):'<p class="empty">A primeira Bola de Ouro será entregue ao fim da temporada.</p>'}</div>`;
  }
  return h;
}
function rkSet(k){ui.rk=k;render(true)}
function jgSet(k){ui.jg=k;render(true)}

/* ---------- Mercado ---------- */
function pgMk(){
  const ct=S.ct,win=winOpen();
  let h=`<div class="pn"><h2>Contrato atual</h2><div class="kv"><div><small>Salário</small><b>${F(ct.sal)}/sem</b></div><div><small>Por ano</small><b>${F(ct.sal*52)}</b></div><div><small>Restante</small><b>${ct.yrs} ano(s)</b></div><div><small>Bônus por gol</small><b>${F(ct.bon)}</b></div><div><small>Multa</small><b>${F(ct.cl)}</b></div><div><small>Valor de mercado</small><b>${F(val())}</b></div></div></div>
  <div class="pn"><h2>Mercado</h2><p>Janela: <b style="color:${win?'var(--acc)':'var(--bad)'}">${win?'aberta':'fechada'}</b>${win?'':' (abre na semana 16 e no fim da temporada)'}</p><button class="play" style="font-size:18px;min-height:48px" onclick="agent()" ${win&&!S.ag?'':'disabled'}>Pedir ao agente novas propostas</button><p class="note">Propostas chegam de clubes das 10 ligas, conforme seu OVR, reputação e popularidade.</p></div>`;
  h+=S.of.length?S.of.map((o,i)=>{const c=cl(o.club),L=lg(c);return `<div class="pn"><div class="offer">${shield(c,'lg')}<div><h3 style="margin:0">${o.t=='ren'?'Renovação':o.t=='emp'?'Empréstimo':'Transferência'} · ${esc(c.n)}</h3><small>${dvName(c)} · ${L.n} · força ${Math.round(c.s)}</small></div></div>
    <div class="kv" style="margin:10px 0"><div><small>Salário</small><b>${F(o.sal)}/sem</b></div><div><small>Duração</small><b>${o.yrs} ano(s)</b></div><div><small>Bônus</small><b>${F(o.bon)}/gol</b></div><div><small>Multa</small><b>${F(o.cl)}</b></div>${o.t=='perm'?`<div><small>Valor</small><b>${F(o.fee)}</b></div>`:''}</div>
    <div class="acts"><button class="buy" onclick="acc(${i})">Aceitar</button><button class="buy" style="border-color:var(--line);color:var(--ink)" onclick="neg(${i})" ${o.n?'disabled':''}>Negociar</button><button class="buy" style="border-color:var(--line);color:var(--muted)" onclick="rej(${i})">Recusar</button></div></div>`}).join(''):'<div class="pn"><p class="empty">Nenhuma proposta no momento. Bom desempenho e reputação atraem clubes.</p></div>';
  return h;
}

/* ---------- Perfil ---------- */
const KL={bo:'Bola de Ouro',tit:'Campeão continental',art:'Artilheiro',top:'Top 10 Bola de Ouro'};
function pgPf(){
  let h=pills([['at','Atributos'],['cards','Cartas'],['hist','Histórico'],['tro','Troféus'],['sys','Sistema']],ui.pf,"pfSet");
  const t=tot(false);
  if(ui.pf=='at'){
    h+=`<div class="pn"><h2>${esc(S.p.name)}</h2><div class="heroc">${myCard('big')}<div class="info"><div class="kv"><div><small>Posição</small><b>${PN[S.p.pos]}</b></div><div><small>Nacionalidade</small><b>${S.p.nat}</b></div><div><small>Idade</small><b>${S.p.age} anos</b></div><div><small>Altura / peso</small><b>${S.p.h} cm · ${S.p.w} kg</b></div></div></div></div>
    <div class="cnt" style="margin-top:12px"><div><b>${t.ap}</b><small>Jogos</small></div><div><b>${t.g}</b><small>Gols</small></div><div><b>${t.a}</b><small>Assist.</small></div><div><b>${S.ti.length}</b><small>Títulos</small></div></div></div>
    <div class="pn"><h2>Atributos (OVR ${O()})</h2>${abars()}</div><div class="pn full"><h2>Evolução</h2>${evo()}</div>`;
  }else if(ui.pf=='cards'){
    h+=`<div class="pn full"><h2>Minhas cartas</h2><p class="note" style="margin-top:0">Uma carta por temporada. Prêmios e títulos viram edições especiais.</p><div class="futr">${S.cards.length?S.cards.slice().reverse().map(c=>card({ovr:c.ovr,pos:c.pos,nat:natCode(S.p.nat),name:short(S.p.name),club:cl(c.club),st:myStats(c.at),kind:c.kind,sz:'sm',me:c.kind=='bo',tag:c.y+(c.kind?' · '+KL[c.kind]:'')})).join(''):'<p class="empty">Sua primeira carta sai ao fim da temporada.</p>'}</div></div>
    <div class="pn full"><h2>Carta atual</h2><div class="futr">${myCard('big')}</div></div>`;
  }else if(ui.pf=='hist'){
    const yrs=[...new Set(S.hist.map(x=>x.y))],gl=yrs.map(y=>S.hist.filter(x=>x.y==y).reduce((s,x)=>s+x.g,0));
    h+=`<div class="pn full"><h2>Histórico</h2>${S.hist.length?tbl(['Ano','Clube','Divisão','Pos.','J','G','A','Nota'],S.hist.map(x=>{const c=cl(x.c);return{c:[x.y,tn(c),LEAGUES[x.l].dn[x.d],x.pos?x.pos+'º':'—',x.ap,x.g,x.a,x.ap?(x.rs/x.ap).toFixed(2):'—']}})):'<p class="empty">Sem temporadas concluídas.</p>'}</div>
    ${yrs.length>1?`<div class="pn"><h2>Gols por temporada</h2>${bars(yrs,gl)}</div>`:''}
    <div class="pn"><h2>Prêmios</h2>${S.aw.length?S.aw.slice().reverse().map(x=>`<p style="margin:4px 0">🏅 <b>${x.y}</b> — ${x.t}</p>`).join(''):'<p class="empty">Nenhum prêmio ainda.</p>'}</div>`;
  }else if(ui.pf=='tro'){
    const tr=S.ti.map(x=>troIcon(x.k||'lig',x.y,x.t.replace(/ \(.*/,'')));
    const bo=S.aw.filter(a=>a.t.includes('BOLA DE OURO')).map(a=>ballTro(a.y));
    h+=`<div class="pn full"><h2>Estante de troféus</h2><div class="shelf">${[...bo,...tr].join('')||'<span class="none">Nenhum título ainda.</span>'}</div></div>`;
  }else{
    h+=`<div class="pn full"><h2>Sistema</h2><div class="row"><button class="ghost danger" onclick="retire()" ${S.ph=='ret'?'disabled':''}>Aposentar-se</button><button class="ghost danger" onclick="reset()">Nova carreira</button></div><p class="note">O progresso é salvo automaticamente neste navegador.</p></div>
    <div class="pn full"><h2>Backup do save</h2><div class="row"><button class="ghost" onclick="expSave()">Exportar</button><button class="ghost" onclick="impSave()">Importar</button></div><textarea id="sv" placeholder="Cole aqui um save exportado para importar"></textarea><p class="note">Exportar mostra o texto do save e copia para a área de transferência. Importar substitui a carreira atual.</p></div>`;
  }
  return h;
}
function pfSet(k){ui.pf=k;render(true)}
function expSave(){const t=JSON.stringify(S);$('#sv').value=t;try{navigator.clipboard.writeText(t);toast('Save copiado')}catch(e){toast('Copie o texto do campo')}}
function impSave(){const t=$('#sv').value.trim();if(!t)return toast('Cole um save no campo');if(!confirm('Substituir a carreira atual por este save?'))return;if(importSave(t)){ui.pg='car';render();toast('Save importado')}else toast('Save inválido')}

/* ---------- fim de carreira ---------- */
function ana(){
  const t=tot(false),bo=S.aw.filter(x=>x.t.includes('BOLA DE OURO')).length,ucl=S.ti.filter(x=>x.k=='ucl').length,lib=S.ti.filter(x=>x.k=='lib').length;
  const sc=Math.round(t.g*.35+t.a*.3+S.ti.length*4+ucl*12+lib*8+bo*70+S.aw.length*5+S.peak*1.5+S.rep);
  const lb=sc<250?'Jogador de carreira discreta':sc<400?'Ídolo regional':sc<600?'Craque respeitado':sc<850?'Lenda do futebol':'Um dos maiores da história';
  const clubs=[...new Set(S.hist.map(x=>cl(x.c).n))].join(', ');
  return `<div class="cele full"><small>Carreira encerrada</small><b>${esc(S.p.name)}</b><span class="muted">Aposentou-se aos ${S.p.age} anos</span><div class="chip" style="color:var(--gold)">${lb}</div><div class="chip" style="color:var(--acc)">Pontuação histórica: ${sc}</div></div>
  <div class="pn"><h2>Números</h2><div class="cnt"><div><b>${t.ap}</b><small>Jogos</small></div><div><b>${t.g}</b><small>Gols</small></div><div><b>${t.a}</b><small>Assist.</small></div><div><b>${S.peak}</b><small>Melhor OVR</small></div><div><b>${S.ti.length}</b><small>Títulos</small></div><div><b>${ucl}</b><small>Champions</small></div><div><b>${bo}</b><small>Bolas de Ouro</small></div><div><b>${S.aw.length}</b><small>Prêmios</small></div></div><p class="note">Clubes: ${esc(clubs)}. Média de ${(t.ap?t.g/t.ap:0).toFixed(2)} gol por jogo e patrimônio final de ${F(S.money)}.</p></div>
  <div class="pn"><h2>Melhor carta</h2><div class="futr">${S.cards.length?(()=>{const c=S.cards.slice().sort((a,b)=>b.ovr-a.ovr)[0];return card({ovr:c.ovr,pos:c.pos,nat:natCode(S.p.nat),name:short(S.p.name),club:cl(c.club),st:myStats(c.at),kind:c.kind,sz:'big',me:1,tag:c.y})})():''}</div></div>
  <button class="play" onclick="reset(true)">Começar nova carreira</button>`;
}

/* ---------- início ---------- */
function intro(){
  return `${'<header class="hud"><div class="logo">'+BALL+'<div><div class="eyebrow">Carreira de craque</div><h1>'+GAME_NAME+'</h1></div></div></header>'}
  <div class="pn"><h2>Nova carreira</h2><p class="muted" style="margin-top:0">Comece aos 16 anos na divisão mais baixa do país escolhido e construa uma lenda: 10 ligas, Champions, Libertadores e a disputa pela Bola de Ouro.</p>
  <label>Nome<input id="fn" value="Lucas Silva" maxlength="30"></label>
  <label>Nacionalidade<select id="fnat">${NAT.map(n=>`<option>${n}</option>`).join('')}</select></label>
  <label>Liga inicial<select id="fl">${LEAGUES.map((l,i)=>`<option value="${i}">${l.n} — começa na ${l.dn[l.dn.length-1]}</option>`).join('')}</select></label>
  <label>Posição<select id="fp">${Object.entries(PN).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label>
  <div class="row"><label style="flex:1">Altura (cm)<input id="fh" type="number" min="160" max="205" value="180"></label><label style="flex:1">Peso (kg)<input id="fw" type="number" min="55" max="110" value="72"></label></div>
  <button class="play" onclick="start()">Começar carreira</button></div>`;
}
function start(){
  const h=C(+$('#fh').value||180,160,205),w=C(+$('#fw').value||72,55,110);
  newGame({name:$('#fn').value.trim()||'Novo Craque',nat:$('#fnat').value,h,w,pos:$('#fp').value,lg:+$('#fl').value});
  ui={pg:'car',lg:cl(S.club).l,dv:null,lgm:'tab',rk:'bdo',pf:'at',jg:'last'};render();
}
function reset(force){if(force||confirm('Apagar a carreira atual e começar outra?')){try{localStorage.removeItem(SAVE_KEY)}catch(e){}S=null;ui.pg='car';render()}}
function retire(){if(confirm('Encerrar a carreira definitivamente?'))rt()}

/* ---------- render ---------- */
const PG={car:pgCar,jg:pgJg,lg:pgLg,rk:pgRk,mk:pgMk,pf:pgPf};

/* tema por clube (como no BrasLOL): cores do time do jogador mudam todo o app */
function applyTheme(){
  const r=document.documentElement.style,c=S?cl(S.club):null;
  if(!c){['--acc','--acc2','--bg','--bg2','--panel','--line','--glow','--on-acc'].forEach(k=>r.removeProperty(k));return}
  const q=pal(c);let h=c.hue,sat=45,as=90;
  if(q.k){
    const sa=x=>{const n=parseInt(x.slice(1),16),R=n>>16,G=n>>8&255,B=n&255;return Math.max(R,G,B)-Math.min(R,G,B)};
    if(sa(q.p)>=40)h=hueOf(q.p);else if(sa(q.s)>=40)h=hueOf(q.s);else{h=45;sat=0;as=0}   // times preto/branco: tema neutro
  }
  const A=as?`hsl(${h} ${as}% 58%)`:'hsl(0 0% 88%)',B=as?`hsl(${(h+28)%360} ${as}% 62%)`:'hsl(45 80% 62%)';
  r.setProperty('--acc',A);r.setProperty('--acc2',B);
  r.setProperty('--bg',`hsl(${h} ${sat}% 7%)`);r.setProperty('--bg2',`hsl(${h} ${sat*.85}% 12%)`);r.setProperty('--panel',`hsl(${h} ${sat*.75}% 15%)`);
  r.setProperty('--line',`hsl(${h} ${sat*.7}% 26%)`);r.setProperty('--glow',as?`hsla(${h},90%,60%,.2)`:'rgba(255,255,255,.07)');
  r.setProperty('--on-acc','#0A0A0A');
}
function hueOf(x){const n=parseInt(x.slice(1),16),R=n>>16,G=n>>8&255,B=n&255,mx=Math.max(R,G,B),d=mx-Math.min(R,G,B);if(!d)return 220;let h=mx==R?60*(((G-B)/d)%6):mx==G?60*((B-R)/d+2):60*((R-G)/d+4);return(h+360)%360}
function render(keep){
  try{applyTheme()}catch(e){}
  const a=$('#app'),y=window.scrollY;
  if(!S){a.innerHTML=intro();return}
  try{a.innerHTML=hud()+'<main class="pg enter">'+PG[ui.pg]()+'</main>'+nav()+(S.ev?evm():'')}
  catch(e){a.innerHTML='<div class="pn"><h2>Erro ao exibir</h2><p>'+esc(e.message)+'</p><button class="play" onclick="reset(true)">Nova carreira</button></div>';console.error(e)}
  window.scrollTo(0,keep?y:0);
}
if(typeof document!='undefined'){loadGame();render()}
