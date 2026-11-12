'use strict';
/* ============================================================
   HABITE-SE 10 — INTERFACE
   Abas: Jogar · Bola de Ouro · Lendas · Elenco · Jogador  (páginas novas em abas.js)
   ============================================================ */
const $=q=>document.querySelector(q);
const UI0=()=>({pg:'jogar',jg:'prox',lg:0,dv:null,bk:'bdo',by:null,ld:'jog',el:null,ec:null,pf:'at'});
let ui=UI0();

/* ---------- peças visuais ---------- */
const IC={
 car:'<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
 jg:'<circle cx="12" cy="12" r="9"/><path d="M12 7l4 3-1.5 5h-5L8 10zM12 3v4M16 10l4-1M14.5 15l2.5 4M9.5 15L7 19M8 10L4 9"/>',
 lg:'<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v4M8 21h8M10 17h4"/>',
 rk:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
 mk:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18"/>',
 pf:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
 el:'<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.6 2.7-6 6-6s6 2.4 6 6M15 14.3c3 0 6 1.7 6 5.7"/>'
};
IC.jogar=IC.jg;IC.bdo=IC.rk;IC.lend=IC.lg;IC.elen=IC.el;IC.jog=IC.pf;
const BALL='<svg viewBox="0 0 40 40"><defs><linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00F5A0"/><stop offset="1" stop-color="#00C2FF"/></linearGradient></defs><circle cx="20" cy="20" r="18" fill="none" stroke="url(#bg1)" stroke-width="3"/><path d="M20 10l7 5-2.7 8.3h-8.6L13 15z" fill="url(#bg1)"/><path d="M20 10V3M27 15l7-2M24.3 23.3l4.2 6.2M15.7 23.3l-4.2 6.2M13 15l-7-2" stroke="url(#bg1)" stroke-width="2.4" stroke-linecap="round"/></svg>';
const short=n=>{const p=String(n).split(' ');return p.length>1?p[0][0]+'. '+p.slice(1).join(' '):n};
const ab=n=>{const w=n.replace(/[^A-Za-zÀ-ÿ0-9 ]/g,'').split(' ').filter(x=>x.length>2||/\d/.test(x));return(w.length>1?w[0][0]+w[1][0]:n.replace(/[^A-Za-zÀ-ÿ]/g,'').slice(0,3)).toUpperCase()};
const pal=c=>{const k=CCLR[c.n];if(k)return{p:k[0],s:k[1],k:1};const h=c.hue;return{p:`hsl(${h} 58% 38%)`,s:`hsl(${(h+40)%360} 70% 62%)`,k:0}};
const hexL=x=>{if(x[0]!='#')return .2;const n=parseInt(x.slice(1),16),f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*f(n>>16)+.7152*f(n>>8&255)+.0722*f(n&255)};
const shield=(c,sz='')=>{
  if(typeof CREST!=='undefined'&&CREST[c.n])return `<span class="shield img ${sz}"><img src="${CREST[c.n]}" alt="" loading="lazy"></span>`;
  const q=pal(c),t=ab(c.n),tx=hexL(q.p)>.45?'#111':'#fff',v=hash(c.n)%5,id='c'+c.id,ts=t.length>2?11.5:15;
  const P='M20 2 36 7v17c0 10-7 17-16 20C11 41 4 34 4 24V7z';
  const body=[
    `<path d="${P}" fill="${q.p}"/><path d="M20 2 36 7v6H4V7z" fill="${q.s}" opacity=".4"/>`,
    `<path d="${P}" fill="${q.p}"/><g clip-path="url(#${id})"><path d="M13 0h7v46h-7zM27 0h7v46h-7z" fill="${q.s}" opacity=".45"/></g>`,
    `<path d="${P}" fill="${q.p}"/><g clip-path="url(#${id})"><path d="M0 22 20 12 40 22v8L20 20 0 30z" fill="${q.s}" opacity=".5"/></g>`,
    `<path d="${P}" fill="${q.p}"/><g clip-path="url(#${id})"><path d="M0 0h20L0 28z" fill="${q.s}" opacity=".4"/></g>`,
    `<path d="${P}" fill="${q.p}"/><g clip-path="url(#${id})"><path d="M0 18h40v9H0z" fill="${q.s}" opacity=".5"/></g>`][v];
  return `<span class="shield ${sz}"><svg viewBox="0 0 40 46"><defs><clipPath id="${id}"><path d="${P}"/></clipPath><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient></defs>${body}<path d="${P}" fill="url(#${id}g)"/><path d="${P}" fill="none" stroke="${q.s}" stroke-width="2.2"/><path d="M20 5 33.5 9v15c0 8.5-6 14.6-13.5 17.4" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="1"/><text x="20" y="29" text-anchor="middle" font-size="${ts}" font-weight="800" fill="${tx}" stroke="${tx=='#fff'?'rgba(0,0,0,.35)':'rgba(255,255,255,.3)'}" stroke-width=".6" paint-order="stroke" font-family="Barlow Condensed,Arial Narrow,sans-serif">${t}</text></svg></span>`};
const bust=(h,c)=>`<svg viewBox="0 0 70 84"><path d="M8 84c0-22 12-34 27-34s27 12 27 34z" fill="${c?pal(c).p:`hsl(${h} 60% 42%)`}"/><rect x="29" y="38" width="12" height="14" rx="4" fill="#d9ab84"/><path d="M27 50l8 9 8-9" fill="#fff" fill-opacity=".85"/><circle cx="35" cy="28" r="15" fill="#e8c4a0"/><path d="M20 26c0-12 8-16 15-16s15 4 15 16c-3-6-8-8-15-8s-12 2-15 8z" fill="#2b1d14"/></svg>`;
const tierOf=o=>o>=85?4:o>=75?3:o>=65?2:1;
const pst=(ovr,pos,seed)=>['VEL','FIN','PAS','DRI','DEF','FIS'].map((l,i)=>[l,C(Math.round(ovr+PROF[pos][i]+(hash(String(seed)+i)%7-3)),25,99)]);
const myStats=(at=S.at)=>[['VEL',Math.floor(at[0])],['FIN',Math.floor(at[1])],['PAS',Math.round((at[2]+at[6])/2)],['DRI',Math.floor(at[3])],['DEF',Math.floor(at[4])],['FIS',Math.floor(at[5])]];
function card(o){
  const cls=o.kind||('t'+tierOf(o.ovr));
  return `<div class="fut ${cls} ${o.sz||''} ${o.me?'me':''} ${o.inj?'inj':''}" ${o.on?`onclick="${o.on}"`:''}><b class="fo">${o.ovr}</b><i class="fr">${o.pos}</i><i class="fn">${o.nat}</i><span class="fs">${shield(o.club,'xs')}</span><span class="fa">${bust(o.club.hue,o.club)}</span><span class="fnm">${esc(o.name)}</span><span class="fst">${o.st.map(([l,v])=>`<span><b>${v}</b><small>${l}</small></span>`).join('')}</span>${o.tag?`<i class="ft">${esc(o.tag)}</i>`:''}</div>`;
}
const myCard=(sz='',extra={})=>card({on:"sheet('me','me')",ovr:O(),pos:S.p.pos,nat:natCode(S.p.nat),name:short(S.p.name),club:cl(S.club),st:myStats(),sz,me:1,inj:S.inj>0,tag:S.y+' · '+PN[S.p.pos],...extra});
const cardOn=x=>x.me?"sheet('me','me')":x.id?`sheet('p','${x.id}')`:LEG.some(z=>z.n==x.n)?`sheet('l','${encodeURIComponent(x.n)}')`:'';
const entryCard=(x,sz,extra={})=>card({on:cardOn(x),ovr:x.ovr,pos:x.pos,nat:natCode(x.nat),name:short(x.n),club:cl(x.club),st:x.me?myStats():pst(x.ovr,x.pos,x.id),sz,me:x.me,...extra});
const hx=(v,sz='')=>`<span class="hx t${tierOf(v)} ${sz}">${v}</span>`;
const tn=(c,cls='')=>`<span class="tn lnk ${cls}" onclick="event.stopPropagation();sheet('c','${c.id}')">${shield(c,'sm')}<span>${esc(c.n)}</span></span>`;
const tbl=(heads,rows)=>`<div class="tw"><table class="tb"><tr>${heads.map(x=>`<th>${x}</th>`).join('')}</tr>${rows.map(r=>`<tr class="${r.cls||''}">${r.c.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')}</table></div>`;
const pills=(items,cur,fn,cls='')=>`<div class="pills ${cls}">${items.map(([k,l])=>`<button class="pill" aria-pressed="${cur==k}" onclick="${fn}('${k}')">${l}</button>`).join('')}</div>`;
const TRO={wc:['#2EC4B6','Copa'],lig:['#3AC6D3','Liga'],dom:['#B9C4D0','Copa'],ucl:['#7AA2FF','UCL'],lib:['#F2D58C','LIB'],mc:['#C58BFF','Mundial'],bo:['#FFD84D','Bola']};
/* imagem real opcional: coloque trofeus/<tipo>.png (ucl, lib, mc, wc, lig, dom, bo); sem o arquivo, vale o desenho */
const troImg=k=>`<img class="troimg" src="trofeus/${k}.png" alt="" style="display:none" onload="this.style.display='block';this.nextElementSibling.style.display='none'" onerror="this.remove()">`;
const shade=(h,f)=>'#'+[1,3,5].map(i=>{const v=parseInt(h.slice(i,i+2),16);return Math.max(0,Math.min(255,Math.round(f>0?v+(255-v)*f:v*(1+f)))).toString(16).padStart(2,'0')}).join('');
const troIcon=(k,y,lab)=>{const c=TRO[k][0],g='tg'+k,globe=k=='mc'||k=='wc',lg=k=='ucl'||k=='lib',
  defs=`<defs><linearGradient id="${g}" x1="0" x2="1"><stop offset="0" stop-color="${shade(c,.45)}"/><stop offset=".45" stop-color="${c}"/><stop offset="1" stop-color="${shade(c,-.4)}"/></linearGradient></defs>`,
  body=globe?`<circle cx="22" cy="17" r="13" fill="url(#${g})" stroke="rgba(0,0,0,.35)" stroke-width="1.2"/><path d="M10 15c8 3 16 3 24 0M12 24c6 2 14 2 20 0M22 4c-5 6-5 18 0 26M22 4c5 6 5 18 0 26" fill="none" stroke="rgba(0,0,0,.28)" stroke-width="1"/><path d="M18 30h8l2 9h-12z" fill="url(#${g})" stroke="rgba(0,0,0,.3)" stroke-width="1"/>`
   :lg?`<path d="M13 3h18c0 12-2 17-6 20v5h4v4H15v-4h4v-5c-4-3-6-8-6-20z" fill="url(#${g})" stroke="rgba(0,0,0,.35)" stroke-width="1.2"/><path d="M13 6H7c-1 8 2 12 7 13M31 6h6c1 8-2 12-7 13" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/><path d="M17 6c0 8 1 12 4 15" stroke="rgba(255,255,255,.5)" stroke-width="2" fill="none"/>`
   :`<path d="M12 4h20v14c0 8-4.5 13-10 13s-10-5-10-13z" fill="url(#${g})" stroke="rgba(0,0,0,.35)" stroke-width="1.2"/><path d="M12 8H5v3c0 5 3 8 8 9M32 8h7v3c0 5-3 8-8 9" fill="none" stroke="${c}" stroke-width="2.6"/><rect x="19" y="30" width="6" height="9" fill="url(#${g})"/><path d="M16 8c0 6 1 12 4 16" stroke="rgba(255,255,255,.45)" stroke-width="2" fill="none"/>`;
  return `<div class="tro">${troImg(k)}<svg viewBox="0 0 44 54">${defs}${body}<rect x="12" y="${globe?39:lg?32:39}" width="20" height="${globe?5:lg?5:6}" rx="1.5" fill="#6b4a1f"/><rect x="10" y="${globe?44:lg?37:45}" width="24" height="5" rx="1.5" fill="#4a3213"/></svg>${y!==''&&y!=null?`<b>${y}</b>`:''}<span>${esc(lab||TRO[k][1])}</span></div>`};
const ballTro=y=>`<div class="tro">${troImg('bo')}<svg viewBox="0 0 44 54"><circle cx="22" cy="24" r="17" fill="#FFD84D" stroke="rgba(0,0,0,.35)" stroke-width="1.4"/><path d="M22 14l7 5-2.7 8h-8.6L15 19z" fill="#B8860B"/><rect x="11" y="43" width="22" height="7" rx="1.5" fill="#6b4a1f"/></svg><b>${y}</b><span>Bola de Ouro</span></div>`;
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
  const c=cl(S.club);
  return `<header class="hud"><div class="logo lnk" onclick="sheet('c','${c.id}')">${shield(c,'lg')}<div><div class="eyebrow">${esc(c.n)} · ${esc(dvName(c))}</div><h1>${GAME_NAME}</h1></div></div><div class="season"><small>Temporada</small><b>${S.y}</b></div></header>
    <ol class="trk">${['Início','1º turno','Janela','2º turno','Prêmios'].map((n,i)=>`<li class="${i<idx?'done':i==idx?'now':''}"><i></i>${n}</li>`).join('')}</ol>`;
}
const NAVS=[['jogar','Jogar'],['bdo','Bola de Ouro'],['lend','Lendas'],['elen','Elenco'],['jog','Jogador']];
const nav=()=>`<nav class="nav" role="tablist">${NAVS.map(([k,n])=>`<button class="nb" role="tab" aria-selected="${ui.pg==k}" onclick="go('${k}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${IC[k]}</svg>${n}</button>`).join('')}</nav>`;
const evm=()=>`<div class="ov"><div class="pn"><h2>${S.ev[0]}</h2><p>${S.ev[1]}</p>${S.ev[2].map((o,i)=>`<button class="ghost opt" onclick="pick(${i})">${o[0]}</button>`).join('')}</div></div>`;
function go(p){ui.pg=p;render();window.scrollTo(0,0)}
function sub(k,v){ui[k]=v;if(k=='lg')ui.dv=null;render(true)}
function setDv(d){ui.dv=+d;render(true)}
function setTr(a,i){if(a!=null)S.tr.a=a;if(i!=null)S.tr.i=i;save();render(true)}

/* ---------- Jogar: próximos jogos ---------- */
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
  return `<div class="m ${r.h==S.club||r.a==S.club?'mine':''}"><div class="mt"><div class="tn ${w==r.h?'win':w==r.a?'lose':''} lnk" onclick="sheet('c','${h.id}')">${shield(h,'sm')}<span>${esc(h.n)}</span></div><div class="sc">${r.g[0]}<i>x</i>${r.g[1]}</div><div class="tn b ${w==r.a?'win':w==r.h?'lose':''} lnk" onclick="sheet('c','${a.id}')">${shield(a,'sm')}<span>${esc(a.n)}</span></div></div><div class="mi"><span>${esc(r.comp)}${r.pen?' · pênaltis':''}</span>${r.pl?`<span>Nota <b>${r.rt}</b> · ${r.mn}' · ${r.gl} gol(s) · ${r.as} assist.</span>`:'<span>Você não atuou</span>'}</div></div>`;
}
function mcard(r){
  const h=cl(r.h),a=cl(r.a),w=r.win;
  return `<div class="m ${r.h==S.club||r.a==S.club?'mine':''}">${r.pen?'<span class="zb ok">Pênaltis</span>':''}<div class="mt"><div class="tn ${w==r.h?'win':w==r.a?'lose':''} lnk" onclick="sheet('c','${h.id}')">${shield(h,'sm')}<span>${esc(h.n)}</span></div><div class="sc">${r.g[0]}<i>x</i>${r.g[1]}</div><div class="tn b ${w==r.a?'win':w==r.h?'lose':''} lnk" onclick="sheet('c','${a.id}')">${shield(a,'sm')}<span>${esc(a.n)}</span></div></div>
  <div class="mi"><span>${esc(r.comp)}</span><span>Posse ${r.po}% x ${100-r.po}% · Chutes ${r.sh[0]} x ${r.sh[1]}</span></div>
  <div class="mi">${r.pl?`<span>Sua atuação: <b>${r.mn}'</b> · nota <b>${r.rt}</b> · ${r.gl} gol(s) · ${r.as} assist. ${r.yc?'🟨':''}${r.rc?'🟥':''}</span>`:'<span>Você não atuou.</span>'}</div>
  ${r.st?`<div class="row" style="margin:6px 0"><button class="ghost" onclick="liveOpen(${S.last.indexOf(r)},1)">📊 Estatísticas da partida</button></div>`:''}<details class="det"><summary>Lance a lance</summary><div class="log">${r.ev.map(e=>`<div class="e ${e.c}"><b>${e.m}’</b> ${e.t}</div>`).join('')}</div></details></div>`;
}
function offBlock(){
  const m=S.sum,L=LEAGUES[m.l];
  const top3=m.top3.map((x,i)=>`<div class="pd p${i+1}">${entryCard(x,'',{kind:i==0?'bo':''})}<b>${esc(short(x.n))}</b><small>${Math.round(x.pts)} pts</small></div>`);
  const o=[top3[1],top3[0],top3[2]].filter(Boolean).join('');
  return `<div class="cele"><small>Temporada ${m.y} encerrada</small><b>${m.pos}º lugar · ${L.dn[m.d]}</b><span class="muted">Campeão: ${esc(m.champ)} · ${m.ap} jogos · ${m.g} gols · ${m.a} assist. · nota ${m.avg.toFixed(2)}</span>
   ${m.move>0?'<div class="chip" style="color:var(--acc)">⬆ Acesso</div>':m.move<0?'<div class="chip" style="color:var(--bad)">⬇ Rebaixamento</div>':''}${m.aw.map(x=>`<div class="chip" style="color:var(--gold)">${x}</div>`).join('')}</div>
  <div class="pn"><h2>Bola de Ouro ${m.y}</h2><div class="podium">${o}</div><p class="note">${m.rk?`Você terminou em ${m.rk}º lugar.`:'Você não entrou na disputa (poucos jogos na temporada).'} Veja o top 10 na aba Bola de Ouro.</p></div>
  <div class="pn"><h2>Campeões do ano</h2><div class="kv"><div><small>Liga dos Campeões</small><b>${m.ucl!=null?esc(cl(m.ucl).n):'—'}</b></div><div><small>Libertadores</small><b>${m.lib!=null?esc(cl(m.lib).n):'—'}</b></div><div><small>Mundial de Clubes</small><b>${m.mc!=null?esc(cl(m.mc).n):'—'}</b></div></div></div>
  <button class="play" onclick="roll()">Iniciar temporada ${S.y+1}</button>`;
}
function viewProx(){
  let h='';
  if(S.ph=='off')h+=offBlock();
  else{
    const nm=nextMatches();
    h+=`<div class="pn"><div class="banner"><small>Semana ${S.week} de ${SEASON}</small><b>Próximos jogos</b></div>
    ${nm.map(x=>x.h!=null?`<div class="m ${x.h==S.club||x.a==S.club?'mine':''}"><div class="mt"><div class="tn lnk" onclick="sheet('c','${cl(x.h).id}')">${shield(cl(x.h),'sm')}<span>${esc(cl(x.h).n)}</span></div><div class="sc"><i>x</i></div><div class="tn b lnk" onclick="sheet('c','${cl(x.a).id}')">${shield(cl(x.a),'sm')}<span>${esc(cl(x.a).n)}</span></div></div><div class="mi"><span>${esc(x.n)}</span></div></div>`:`<div class="m mine"><div class="mi"><span>🏆 ${esc(x.n)}</span><span>adversário sorteado</span></div></div>`).join('')||'<p class="empty">Sem jogos nesta semana.</p>'}
    <p class="note" style="margin:0 0 10px">Papel: <b>${role()}</b>${S.inj?' · fora por '+S.inj+' sem.':''} · Treino: ${TN[S.tr.a]} (${['leve','normal','intenso'][S.tr.i]})</p>
    <button class="play" onclick="adv()" ${S.ev?'disabled':''}>▶ Jogar semana</button>
    <div class="row" style="margin:0 0 6px"><button class="ghost" onclick="toggleLive()">📺 Jogo ao vivo: ${lvOn()?'ligado':'desligado'}</button>${S.last&&S.last.some(r=>r.st&&(r.h==S.club||r.a==S.club))?`<button class="ghost" onclick="liveOpen(lvIdx(),1)">📊 Estatísticas do último jogo</button>`:''}</div>
    <div class="row" style="margin:0"><button class="ghost" onclick="simN(5)" ${S.ev?'disabled':''}>⏩ +5 semanas</button><button class="ghost" onclick="simN(30)" ${S.ev?'disabled':''}>⏭ Até um evento ou o fim</button></div></div>`;
    h+=upcoming();
  }
  h+=`<div class="cab"><div><b>${Math.round(S.cond)}%</b><small>Condição</small></div><div><b>${Math.round(S.mor)}</b><small>Moral</small></div><div><b>${S.form.toFixed(1)}</b><small>Forma</small></div><div><b>${Math.round(S.rep)}</b><small>Reputação</small></div><div><b>${Math.round(S.pop)}</b><small>Popularidade</small></div><div><b>${F(S.money)}</b><small>Patrimônio</small></div></div>`;
  if(S.last.length&&S.ph=='season')h+=`<div class="pn"><h2>Última rodada</h2>${S.last.map(mini).join('')}<p class="note">Veja o lance a lance na aba Resultados.</p></div>`;
  h+=`${planBlock()}<div class="pn"><h2>Treino da semana</h2><div class="sub" style="margin-top:0">Foco</div><div class="pills">${TN.map((n,i)=>`<button class="pill" aria-pressed="${S.tr.a==i}" onclick="setTr(${i},null)">${n}</button>`).join('')}</div>
    <div class="sub">Intensidade</div><div class="pills">${['Leve','Normal','Intensa'].map((n,i)=>`<button class="pill" aria-pressed="${S.tr.i==i}" onclick="setTr(null,${i})">${n}</button>`).join('')}</div>
    <p class="note">Treino intenso evolui mais, mas cansa e aumenta o risco de lesão. Descanso recupera a condição; fisioterapia acelera a recuperação. A evolução cai com a idade e é limitada pelo potencial (valor após “/”).</p>${abars()}</div>
  <div class="pn"><h2>Notícias</h2>${S.nw.slice(0,8).map(n=>`<div class="nw"><small>${n.y} S${n.w}</small><span>${n.t}</span></div>`).join('')}</div>`;
  if(S.p.age>=34&&O()<70)h+=`<div class="msg full">Seu rendimento caiu: considere se aposentar (aba Jogador → Sistema).</div>`;
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
  ${rds.length?rds.map(rd=>`<div class="sub">${k.rn[rd]}</div>${k.log.filter(x=>x[0]==rd).map(x=>`<div class="m ${x[1]==S.club||x[2]==S.club?'mine':''}" style="padding:6px 10px;margin-bottom:5px"><div class="mt"><div class="tn ${x[5]==x[1]?'win':'lose'} lnk" onclick="sheet('c','${cl(x[1]).id}')">${shield(cl(x[1]),'xs')}<span>${esc(cl(x[1]).n)}</span></div><div class="sc" style="font-size:20px">${x[3]}<i>x</i>${x[4]}</div><div class="tn b ${x[5]==x[2]?'win':'lose'} lnk" onclick="sheet('c','${cl(x[2]).id}')">${shield(cl(x[2]),'xs')}<span>${esc(cl(x[2]).n)}</span></div></div>${x[6]?'<div class="mi"><span>decidido nos pênaltis</span></div>':''}</div>`).join('')}`).join(''):'<p class="empty">A competição ainda não começou.</p>'}</div>`;
}
function champHist(l){
  const L=LEAGUES[l];
  if(!S.champs.length)return '<div class="pn full"><p class="empty">Os campeões aparecem aqui ao fim de cada temporada: Liga dos Campeões, Libertadores, Mundial de Clubes e as ligas nacionais.</p></div>';
  const nmc=id=>id==null?'—':tn(cl(id));
  const t=(key)=>{const cnt={};S.champs.forEach(c=>{const id=c[key].c;if(id!=null)cnt[id]=(cnt[id]||0)+1});return Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,8)};
  const tt=(key,title)=>`<div class="pn"><h2>Quadro de títulos — ${title}</h2>${tbl(['','Clube','Títulos'],t(key).map(([id,n],i)=>({c:[i+1,tn(cl(+id)),`<b>${n}</b>`]})))}</div>`;
  return `<div class="pn full"><h2>Campeões por temporada</h2>${tbl(['Ano','Champions','Libertadores','Mundial',L.dn[0],'Copa'],S.champs.slice().reverse().map(c=>({c:[c.y,nmc(c.ucl.c),nmc(c.lib.c),nmc(c.mc),nmc(c.lg[L.k]),nmc(c.dom[L.k])]})))}</div>${tt('ucl','Liga dos Campeões')}${tt('lib','Libertadores')}`;
}
/* ---------- Ranking ---------- */
function bdoRows(list,prev,showMv=true){
  return `<ul class="rank">${list.map((x,i)=>{const c=cl(x.club),p=prev?prev(x):0,mv=!showMv?'':!p?'<span class="mv new">NOVO</span>':p>i+1?`<span class="mv up">▲${p-i-1}</span>`:p<i+1?`<span class="mv dn">▼${i+1-p}</span>`:'';
    return `<li class="${x.me?'me':''}" onclick="sheet('${x.me?'me':x.id?'p':'l'}','${x.me?'me':x.id||encodeURIComponent(x.n)}')"><span class="pos">${x.rank||i+1}</span>${hx(x.ovr)}<span class="nm2">${esc(x.n)}${x.me?'<span class="tag">você</span>':''}${mv}<small>${esc(c.n)} · ${x.pos} · ${x.age} anos</small></span><span class="pt">${Math.round(x.pts)}<small>pontos</small></span></li>`}).join('')}</ul>`;
}
function podiumOf(list){
  const t=list.slice(0,3).map((x,i)=>`<div class="pd p${i+1}">${entryCard(x,'',{kind:i==0?'bo':''})}<b>${esc(short(x.n))}</b><small>${Math.round(x.pts)} pts</small><span class="bs">${i+1}º</span></div>`);
  return `<div class="podium">${[t[1],t[0],t[2]].filter(Boolean).join('')}</div>`;
}
/* ---------- Perfil ---------- */
const KL={bo:'Bola de Ouro',tit:'Campeão continental',art:'Artilheiro',top:'Top 10 Bola de Ouro'};
function pgPf(){
  let h=pills([['at','Visão geral'],['cards','Cartas'],['hab','Habilidades'],['ctr','Contratos'],['hist','Estatísticas'],['tro','Troféus'],['sel','Seleção'],['conq','Conquistas'],['mail',mailLbl()],['sys','Sistema']],ui.pf,"pfSet",'scroll');
  const t=tot(false);
  if(ui.pf=='at'){
    h+=`<div class="pn"><h2>${esc(S.p.name)}</h2><div class="heroc">${myCard('big')}<div class="info"><div class="kv"><div><small>Posição</small><b>${PN[S.p.pos]}</b></div><div><small>Nacionalidade</small><b>${S.p.nat}</b></div><div><small>Idade</small><b>${S.p.age} anos</b></div><div><small>Altura / peso</small><b>${S.p.h} cm · ${S.p.w} kg</b></div><div><small>Clube</small><b>${esc(cl(S.club).n)}</b></div><div><small>Nível</small><b>${S.pc.lv}${S.pc.lv>=PCLV?' (máx.)':''}</b></div><div><small>Potencial</small><b>${C(S.p.pot-3,0,99)}–${C(S.p.pot+3,0,99)}</b></div><div><small>Valor</small><b>${F(val())}</b></div></div></div></div>
    <div class="cab"><div><b>${Math.round(S.cond)}%</b><small>Condição</small></div><div><b>${Math.round(S.mor)}</b><small>Moral</small></div><div><b>${S.form.toFixed(1)}</b><small>Forma</small></div><div><b>${Math.round(S.rep)}</b><small>Reputação</small></div><div><b>${Math.round(S.pop)}</b><small>Popularidade</small></div><div><b>${role()}</b><small>Papel</small></div></div>
    <div class="cnt" style="margin-top:12px"><div><b>${t.ap}</b><small>Jogos</small></div><div><b>${t.g}</b><small>Gols</small></div><div><b>${t.a}</b><small>Assist.</small></div><div><b>${S.ti.length}</b><small>Títulos</small></div></div></div>
    <div class="pn"><h2>Atributos (OVR ${O()})</h2>${abars()}</div><div class="pn full"><h2>Evolução</h2>${evo()}</div>`;
  }else if(ui.pf=='cards'){
    h+=`<div class="pn full"><h2>Minhas cartas</h2><p class="note" style="margin-top:0">Uma carta por temporada. Prêmios e títulos viram edições especiais.</p><div class="futr">${S.cards.length?S.cards.slice().reverse().map(c=>card({ovr:c.ovr,pos:c.pos,nat:natCode(S.p.nat),name:short(S.p.name),club:cl(c.club),st:myStats(c.at),kind:c.kind,sz:'sm',me:c.kind=='bo',tag:c.y+(c.kind?' · '+KL[c.kind]:'')})).join(''):'<p class="empty">Sua primeira carta sai ao fim da temporada.</p>'}</div></div>
    <div class="pn full"><h2>Carta atual</h2><div class="futr">${myCard('big')}</div></div>`;
  }else if(ui.pf=='hist'){
    const yrs=[...new Set(S.hist.map(x=>x.y))],gl=yrs.map(y=>S.hist.filter(x=>x.y==y).reduce((s,x)=>s+x.g,0));
    const live=S.cur&&S.ph=='season'?[{...S.cur,l:cl(S.cur.c).l,d:cl(S.cur.c).d,pos:0,live:1}]:[];
    h+=`<div class="pn full"><h2>Carreira</h2><div class="cnt"><div><b>${t.ap}</b><small>Jogos</small></div><div><b>${t.g}</b><small>Gols</small></div><div><b>${t.a}</b><small>Assist.</small></div><div><b>${t.ap?(t.rs/t.ap).toFixed(2):'—'}</b><small>Nota média</small></div><div><b>${t.ap?(t.g/t.ap).toFixed(2):'0.00'}</b><small>Gols/jogo</small></div><div><b>${Math.round(t.mn/60)}h</b><small>Em campo</small></div><div><b>${Math.max(S.peak,O())}</b><small>Melhor OVR</small></div></div></div>
    <div class="pn full"><h2>Temporadas</h2>${S.hist.length||live.length?tbl(['Ano','Clube','Divisão','Pos.','J','G','A','Nota'],S.hist.concat(live).map(x=>{const c=cl(x.c);return{c:[x.y+(x.live?' ⏱':''),tn(c),LEAGUES[x.l].dn[x.d],x.pos?x.pos+'º':'—',x.ap,x.g,x.a,x.ap?(x.rs/x.ap).toFixed(2):'—'],cls:x.live?'mine':''}})):'<p class="empty">Sem temporadas concluídas.</p>'}</div>
    ${yrs.length>1?`<div class="pn"><h2>Gols por temporada</h2>${bars(yrs,gl)}</div>`:''}
    <div class="pn"><h2>Prêmios</h2>${S.aw.length?S.aw.slice().reverse().map(x=>`<p style="margin:4px 0">🏅 <b>${x.y}</b> — ${x.t}</p>`).join(''):'<p class="empty">Nenhum prêmio ainda.</p>'}</div>`;
  }else if(ui.pf=='mail'){
    h+=pgMail();
  }else if(ui.pf=='sel'){
    h+=pgSel();
  }else if(ui.pf=='hab'){
    h+=pgHab();
  }else if(ui.pf=='conq'){
    h+=pgConq();
  }else if(ui.pf=='ctr'){
    h+=pgCtr();
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
function impSave(){const t=$('#sv').value.trim();if(!t)return toast('Cole um save no campo');if(!confirm('Substituir a carreira atual por este save?'))return;if(importSave(t)){ui.pg='jogar';render();toast('Save importado')}else toast('Save inválido')}

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
  ui=UI0();ui.lg=cl(S.club).l;render();
}
function reset(force){if(force||confirm('Apagar a carreira atual e começar outra?')){try{localStorage.removeItem(SAVE_KEY)}catch(e){}S=null;ui=UI0();render()}}
function retire(){if(confirm('Encerrar a carreira definitivamente?'))rt()}

/* ---------- render ---------- */
const PG={jogar:pgJogar,bdo:pgBdo,lend:pgLend,elen:pgElen,jog:pgPf};

/* tema por clube (como no BrasLOL): cores do time do jogador mudam todo o app */
function applyTheme(){
  const r=document.documentElement.style,c=S?cl(S.club):null;
  if(!c){['--acc','--acc2','--bg','--bg2','--panel','--line','--glow','--on-acc','--muted'].forEach(k=>r.removeProperty(k));return}
  const q=pal(c);let h=c.hue,sat=45,as=90;
  if(q.k){
    const sa=x=>{const n=parseInt(x.slice(1),16),R=n>>16,G=n>>8&255,B=n&255;return Math.max(R,G,B)-Math.min(R,G,B)};
    if(sa(q.p)>=40)h=hueOf(q.p);else if(sa(q.s)>=40)h=hueOf(q.s);else{h=45;sat=0;as=0}   // times preto/branco: tema neutro
  }
  const A=as?`hsl(${h} ${as}% 58%)`:'hsl(0 0% 88%)',B=as?`hsl(${(h+28)%360} ${as}% 62%)`:'hsl(45 80% 62%)';
  /* visual limpo: superfícies quase neutras, só o destaque (--acc) usa a cor do clube */
  const ss=sat?9:0;
  r.setProperty('--acc',A);r.setProperty('--acc2',A);
  r.setProperty('--bg',`hsl(${h} ${ss}% 8%)`);r.setProperty('--bg2',`hsl(${h} ${ss}% 11%)`);r.setProperty('--panel',`hsl(${h} ${ss}% 13%)`);
  r.setProperty('--line',`hsl(${h} ${ss}% 21%)`);r.setProperty('--glow','transparent');
  r.setProperty('--on-acc','#0A0A0A');r.setProperty('--muted',`hsl(${h} ${ss?8:0}% 64%)`);
}
function hueOf(x){const n=parseInt(x.slice(1),16),R=n>>16,G=n>>8&255,B=n&255,mx=Math.max(R,G,B),d=mx-Math.min(R,G,B);if(!d)return 220;let h=mx==R?60*(((G-B)/d)%6):mx==G?60*((B-R)/d+2):60*((R-G)/d+4);return(h+360)%360}
function render(keep){
  try{applyTheme()}catch(e){}
  const a=$('#app'),y=window.scrollY;
  if(!S){a.innerHTML=intro();return}
  try{a.innerHTML=hud()+'<main class="pg enter">'+PG[ui.pg]()+'</main>'+nav()+(S.ev?evm():'')+(ui.sheet?sheetHtml():'')}
  catch(e){a.innerHTML='<div class="pn"><h2>Erro ao exibir</h2><p>'+esc(e.message)+'</p><button class="play" onclick="reset(true)">Nova carreira</button></div>';console.error(e)}
  window.scrollTo(0,keep?y:0);
}
/* ---------- Caixa de e-mail, Seleção e plano semanal (portado do BrasLOL) ---------- */
const mailLbl=()=>{const n=(S.mail||[]).filter(m=>!m.rd).length;return 'Caixa'+(n?' ('+n+')':'')};
function mailAll(){(S.mail||[]).forEach(m=>m.rd=1);save();render(true)}
function pgMail(){
  const ms=S.mail||[],un=ms.filter(m=>!m.rd).length;
  return `<div class="pn full"><h2>Caixa de entrada · ${un} nova(s)</h2><div class="row"><button class="ghost" onclick="mailAll()">Marcar tudo como lido</button></div>${ms.length?`<ul class="mails">${ms.map(m=>`<li class="${m.rd?'':'unread'}" onclick="sheet('m','${m.id}')"><b>${esc(m.from)}</b><span>${esc(m.sub)}</span><small>${m.y} · S${m.w}</small></li>`).join('')}</ul>`:'<p class="empty">Nenhuma mensagem ainda. Propostas, prêmios, lesões e convocações chegam aqui.</p>'}</div>`;
}
function pgSel(){
  const nat=S.p.nat,code=natCode(nat),need=Math.round(wcNeed(nat)),wy=S.y%4==2&&!S.wc.some(w=>w.y==S.y)?S.y:S.y+((6-S.y%4)%4||4);
  const cups=S.wc.slice().reverse(),titles=S.wc.filter(w=>w.champ==nat&&w.me.called).length;
  const stand=WCN.map(([n,c,s])=>({n,c,s,t:S.wc.filter(w=>w.champ==n).length})).sort((a,b)=>b.s-a.s).slice(0,10);
  return `<div class="pn"><h2>Seleção ${esc(nat)} <span class="natb">${code}</span></h2>${kv([['Próxima Copa',wy],['OVR para convocação','~'+need],['Seu OVR',O()],['Copas disputadas',S.wc.filter(w=>w.me.called).length],['Títulos',titles],['Gols em Copas',S.wc.reduce((s,w)=>s+w.me.g,0)]])}<p class="note">A Copa do Mundo acontece a cada 4 anos (2026, 2030, ...) no fim da temporada. Você precisa ter pelo menos 18 anos e OVR compatível com a seleção. Bons desempenhos dão reputação, popularidade e pontos na Bola de Ouro.</p></div>
  <div class="pn"><h2>Ranking de seleções</h2><ul class="rank">${stand.map((x,i)=>`<li class="${x.n==nat?'me':''}"><span class="pos">${i+1}</span><span class="natb">${x.c}</span><span class="nm2">${esc(x.n)}<small>${x.t} título(s) no jogo</small></span><span class="pt">${x.s}<small>força</small></span></li>`).join('')}</ul></div>
  <div class="pn full"><h2>Copas do Mundo</h2>${cups.length?tbl(['Ano','Campeã','Vice','Sua seleção','Você','G','A'],cups.map(w=>({c:[w.y,esc(w.champ),esc(w.ru),STG[w.me.stage],w.me.called?(w.me.starter?'Titular':'Banco'):'Não convocado',w.me.g,w.me.a],cls:w.champ==w.nat&&w.me.called?'mine':''}))):'<p class="empty">Nenhuma Copa disputada ainda.</p>'}</div>`;
}
const PLANS=[['l','Leve',null,0],['n','Normal',null,1],['i','Intenso',null,2],['d','Folga',7,0]];
function setPlan(k){const p=PLANS.find(x=>x[0]==k);if(p[2]!=null)S.tr.a=p[2];else if(S.tr.a==7)S.tr.a=1;S.tr.i=p[3];save();render(true)}
function planInfo(a,i){const im=[.6,1,1.6][i],en=18+(a==7?16:0)-6*im*(a==7?.2:1)+(S.at[5]-60)/20,xp=Math.round(40*[.8,1,1.3][i]*(a==7?.3:1)*(1+pfx('xpw'))),tr=a==7?0:[.1,.25,.5][i];return{en:Math.round(en*10)/10,xp,tr,risk:a==7?'nenhum':i==2?'alto':i==1?'baixo':'mínimo'}}
function planBlock(){
  const cur=S.tr.a==7?'d':['l','n','i'][S.tr.i];
  return `<div class="pn"><h2>Plano semanal</h2><div class="pills">${PLANS.map(([k,n])=>`<button class="pill" aria-pressed="${cur==k}" onclick="setPlan('${k}')">${n}</button>`).join('')}</div><div class="plans">${PLANS.map(([k,n,a,i])=>{const f=planInfo(a!=null?a:(S.tr.a==7?1:S.tr.a),i);return `<div class="plan ${cur==k?'on':''}"><b>${n}</b><small>XP ~${f.xp}</small><small>Energia ${f.en>=0?'+':''}${f.en}/sem</small><small>Confiança +${f.tr}</small><small>Lesão: ${f.risk}</small></div>`}).join('')}</div><p class="note">Energia atual: <b>${Math.round(S.cond)}</b>/100. Cansado (abaixo de 40) o treino rende menos. O teste do técnico acontece nas semanas 10 e 22.</p></div>`;
}

/* ---------- Habilidades e nível (portado do BrasLOL) ---------- */
let pcBr='f',pcSel=null,pcMsg='';
function pcSet(b){pcBr=b;pcSel=null;render(true)}
function pcPick(id){pcSel=id;render(true)}
function pcDo(id){pcMsg=pcLearn(id);pcSel=id;render(true)}
function pgHab(){
  pcEnsure();const p=S.pc,need=p.lv>=PCLV?1:pcNeed(p.lv),pct=p.lv>=PCLV?100:Math.round(p.xp/need*100),got=PERKS.filter(x=>p.perks[x.id]).length;
  const tabs=Object.keys(PBR).map(b=>{const n=PERKS.filter(x=>x.br==b&&p.perks[x.id]).length;return `<button class="pill" aria-pressed="${pcBr==b}" onclick="pcSet('${b}')">${PBR[b][0]} <small>${n}/11</small></button>`}).join('');
  const tr=Math.round(p.tr),trt=tr>=75?'O técnico confia muito em você.':tr>=55?'Boa relação: você briga por uma vaga.':tr>=35?'Confiança baixa: pouco espaço.':'O técnico não conta com você.';
  const sel=PERKS.find(x=>x.id==pcSel);
  const rows=[0,1,2,3,4].map(r=>`<div class="prow">${PERKS.filter(x=>x.br==pcBr&&x.r==r).map(x=>{const st=pcPerkSt(x);return `<button class="perk ${st} ${pcSel==x.id?'sel':''}" onclick="pcPick('${x.id}')"><b>${esc(x.n)}</b><small>${st=='own'?'✓ aprendida':'custo '+x.c+' · nv '+x.lv}</small></button>`}).join('')}</div>`).join('');
  let det='<p class="note">Toque numa habilidade para ver os detalhes.</p>';
  if(sel){const st=pcPerkSt(sel);det=`<div class="pdet"><b>${esc(sel.n)}</b><small>${PBR[sel.br][0]} · custo ${sel.c} ponto${sel.c>1?'s':''} · nível ${sel.lv}</small><p>${esc(sel.d)}</p>${st=='own'?'<span class="tag">Aprendida</span>':`<button class="play" ${st=='can'?'':'disabled'} onclick="pcDo('${sel.id}')">Aprender</button>`}</div>`}
  return `<div class="pn"><h2>Nível ${p.lv}${p.lv>=PCLV?' (máx.)':''}</h2><div class="cab"><div><b class="num">${p.tp}</b><small>Pontos</small></div><div><b class="num">${got}/${PERKS.length}</b><small>Aprendidas</small></div></div>
  <div class="xpb"><u style="width:${pct}%"></u></div><p class="note">${p.lv>=PCLV?'Nível máximo.':`XP ${Math.floor(p.xp)}/${need}. Jogue e treine para subir de nível; cada nível dá 1 ponto (2 a cada 5 níveis).`}</p></div>
  <div class="pn"><h2>Confiança do técnico</h2><div class="xpb tr"><u style="width:${tr}%"></u></div><p class="note"><b>${tr}/100</b> · ${trt} Ela sobe com boas notas e treino intenso e cai quando você não joga. Influencia sua vaga de titular.</p></div>
  <div class="pn full"><h2>Árvore de habilidades</h2><div class="pills">${tabs}</div><p class="note" style="margin:0 0 8px">${PBR[pcBr][0]} · ${PBR[pcBr][1]}. Comece pelo topo e desça. A última exige 2 das 3 ligadas.${pcMsg?` <b>${esc(pcMsg)}</b>`:''}</p>${rows}${det}</div>`;
}

/* ---------- Conquistas e Finanças (portado do BrasLOL) ---------- */
const ACH=[
 ['Estreia','Dispute a primeira partida profissional',t=>t.ap>=1],
 ['Primeiro gol','Marque seu primeiro gol',t=>t.g>=1],
 ['Artilheiro','Marque 100 gols na carreira',t=>t.g>=100],
 ['Centenário','Marque 250 gols na carreira',t=>t.g>=250],
 ['Lenda dos gols','Marque 500 gols na carreira',t=>t.g>=500],
 ['Garçom','Dê 100 assistências',t=>t.a>=100],
 ['Veterano','Dispute 500 jogos',t=>t.ap>=500],
 ['Mil jogos','Dispute 1000 jogos',t=>t.ap>=1000],
 ['Campeão','Conquiste um título',t=>S.ti.length>=1],
 ['Colecionador','Conquiste 10 títulos',t=>S.ti.length>=10],
 ['Colecionador de elite','Conquiste 25 títulos',t=>S.ti.length>=25],
 ['Rei da Europa','Vença a Liga dos Campeões',t=>S.ti.some(x=>x.k=='ucl')],
 ['Rei da América','Vença a Libertadores',t=>S.ti.some(x=>x.k=='lib')],
 ['Campeão do mundo','Vença o Mundial de Clubes',t=>S.ti.some(x=>x.k=='mc')],
 ['Bola de Ouro','Vença a Bola de Ouro',t=>S.aw.some(x=>x.t.includes('BOLA DE OURO'))],
 ['Bicampeão da Bola','Vença 2 Bolas de Ouro',t=>S.aw.filter(x=>x.t.includes('BOLA DE OURO')).length>=2],
 ['Craque','Chegue a 80 de OVR',t=>Math.max(S.peak,O())>=80],
 ['Fora de série','Chegue a 90 de OVR',t=>Math.max(S.peak,O())>=90],
 ['Do zero ao topo','Jogue na 1ª divisão',t=>S.hist.concat(S.cur?[S.cur]:[]).some(x=>cl(x.c).d==0)],
 ['Viajante','Jogue em 3 clubes diferentes',t=>new Set(S.hist.concat(S.cur?[S.cur]:[]).map(x=>x.c)).size>=3],
 ['Milionário','Acumule €50M',t=>S.money>=5e7]
];
function achList(){const t=tot(false);return ACH.map(([n,d,f])=>{let ok=false;try{ok=!!f(t)}catch(e){}return{n,d,ok}})}
function pgConq(){
  const l=achList(),n=l.filter(x=>x.ok).length;
  return `<div class="pn full"><h2>Conquistas · ${n}/${l.length}</h2><div class="achs">${l.map(x=>`<div class="ach ${x.ok?'ok':''}"><b>${x.ok?'🏆':'🔒'} ${esc(x.n)}</b><small>${esc(x.d)}</small></div>`).join('')}</div></div>`;
}
function pgFin(){
  const c=S.ct,anual=c.sal*52,tt=tot(false),bonus=tt.g*c.bon;
  const hist=S.hist.slice(-8);
  return `<div class="pn"><h2>Finanças</h2>${kv([['Patrimônio',F(S.money)],['Salário/semana',F(c.sal)],['Salário/ano',F(anual)],['Bônus por gol',F(c.bon)],['Contrato',c.yrs+' ano(s)'],['Multa',F(c.cl)],['Valor de mercado',F(val())],['Bônus (carreira)',F(bonus)]])}</div>
  <div class="pn"><h2>Projeção da próxima temporada</h2>${kv([['Salário',F(anual)],['Bônus estimado',F(Math.round((tt.ap?tt.g/Math.max(1,S.hist.length||1):8)*c.bon))],['Total estimado',F(anual+Math.round((tt.ap?tt.g/Math.max(1,S.hist.length||1):8)*c.bon))]])}<p class="note">Estimativa baseada no seu contrato atual e na média de gols por temporada.</p></div>
  <div class="pn full"><h2>Clube atual</h2><div class="tn lnk" onclick="sheet('c','${cl(S.club).id}')">${shield(cl(S.club),'sm')}<span>${esc(cl(S.club).n)}</span></div><p class="note">${S.loan?'Você está emprestado.':'Contrato com multa de '+F(c.cl)+'.'}</p></div>`;
}

/* ---------- Fichas (portado do BrasLOL): jogador, clube e lenda ---------- */
const statBars=st=>`<div class="sbars">${st.map(([l,v])=>`<div class="sb"><span>${l}</span><i><u style="width:${v}%" class="t${tierOf(v)}"></u></i><b>${v}</b></div>`).join('')}</div>`;
const kv=(a)=>`<div class="kvs">${a.map(([k,v])=>`<div><small>${k}</small><b>${v}</b></div>`).join('')}</div>`;
function sheet(t,id){id=decodeURIComponent(id);const o=ui.sheet;if(o&&!(o.t==t&&o.id==id))(ui.shs=ui.shs||[]).push({t:o.t,id:o.id});if(!o)ui.shs=[];ui.sheet={t,id};render(true)}
function backSheet(){const p=(ui.shs||[]).pop();ui.sheet=p||null;render(true)}
function closeSheet(){ui.sheet=null;ui.shs=[];render(true)}
