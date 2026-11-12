'use strict';
/* ============================================================
   JOGO AO VIVO + ESTATÍSTICAS DE FIM DE JOGO (estilo BrasLOL)
   A partida já vem simulada em S.last (pm); aqui ela é "transmitida" minuto a minuto.
   ============================================================ */
let LVT=null;
const lvMs=[650,320,130,45];
const lvMine=r=>r.h==S.club||r.a==S.club;
const lvIdx=()=>S.last.findIndex(r=>lvMine(r)&&!r.sn);
const lvLast=()=>{for(let i=S.last.length-1;i>=0;i--)if(lvMine(S.last[i])&&S.last[i].st)return i;return -1};
function lvTick(){const L=ui.lv;if(!L||L.pause)return;L.t=Math.min(90,L.t+1);if(L.t>=90){clearInterval(LVT);LVT=null;if(S.lvp){S.lvp=0;save()}}lvDraw()}
function lvTimer(){clearInterval(LVT);LVT=null;if(ui.lv&&ui.lv.t<90&&!ui.lv.pause)LVT=setInterval(lvTick,lvMs[ui.lv.sp])}
function liveOpen(i,fim){const r=S.last[i];if(!r||!r.st)return;if(!fim)r.sn=1;ui.lv={i,t:fim?90:0,sp:0,pause:false};lvTimer();lvDraw()}
function lvClose(){if(ui.lv&&ui.lv.t<90&&S.lvp)return;clearInterval(LVT);LVT=null;ui.lv=null;lvDraw();render(true)}
function lvSpeed(k){ui.lv.sp=k;ui.lv.pause=false;lvTimer();lvDraw()}
function lvPause(){ui.lv.pause=!ui.lv.pause;lvTimer();lvDraw()}
/* se a página for recarregada no meio da transmissão, ela recomeça */
function lvBoot(){if(S&&S.lvp&&S.last[S.lvp-1])liveOpen(S.lvp-1);else if(S)S.lvp=0}
/* contagem de um tipo de lance até o minuto t */
const lvC=(r,k,t)=>[0,1].map(s=>r.st.fe.filter(x=>x[1]==s&&x[2]==k&&x[0]<=t).length);
const lvPo=(r,t)=>{if(t>=90)return r.po;const f=Math.min(1,t/20);return Math.round(C(r.po*f+50*(1-f)+3*Math.sin(t/5)*(1-t/90),25,75))};
function lvRow(l,a,b,hi=1){const x=+a,y=+b,c=!hi||isNaN(x)||x==y?'':x>y?' hl':' hr';return `<div class="lvr${c}"><span>${a}</span><b>${l}</b><span>${b}</span></div>`}
function lvRows(r,t){
  const st=r.st,po=lvPo(r,t),sh=lvC(r,'sh',t),so=lvC(r,'st',t),co=lvC(r,'co',t),fl=lvC(r,'fl',t),of=lvC(r,'of',t),yc=lvC(r,'yc',t),rc=lvC(r,'rc',t);
  let h=`<div class="lvp"><b>${po}%</b><i><u style="width:${po}%"></u></i><b>${100-po}%</b></div><p class="lvl">Posse de bola</p>`;
  h+=lvRow('Finalizações',sh[0],sh[1])+lvRow('No alvo',so[0],so[1])+lvRow('Escanteios',co[0],co[1])+lvRow('Faltas',fl[0],fl[1],0)+lvRow('Impedimentos',of[0],of[1],0)+lvRow('Amarelos',yc[0],yc[1],0)+lvRow('Vermelhos',rc[0],rc[1],0);
  if(t>=90)h+=lvRow('Defesas do goleiro',st.sv[0],st.sv[1])+lvRow('Gols esperados (xG)',st.xg[0].toFixed(1),st.xg[1].toFixed(1))+lvRow('Passes certos',st.pa[0]+'%',st.pa[1]+'%');
  return h;
}
function lvMom(r,t){
  const m=r.st.mom,W=600,H=130,bw=W/18,y0=H/2;
  const bars=m.map((v,i)=>{const on=i*5<t,x=i*bw,hh=Math.abs(v)*(y0-6);return `<rect x="${(x+2).toFixed(1)}" y="${(v>=0?y0-hh:y0).toFixed(1)}" width="${(bw-4).toFixed(1)}" height="${Math.max(1,hh).toFixed(1)}" rx="2" class="${v>=0?'mb':'mr'}" opacity="${on?1:.12}"/>`}).join('');
  const gl=r.sc.filter(z=>z[0]<=t).map(z=>{const x=(z[0]/90*W).toFixed(1);return `<text x="${x}" y="${z[1]==0?12:H-4}" text-anchor="middle" font-size="13">⚽</text>`}).join('');
  let tk='';[15,30,45,60,75,90].forEach(k=>{tk+=`<text x="${(k/90*W-2).toFixed(1)}" y="${H+14}" text-anchor="end" class="gl">${k}'</text>`});
  return `<svg class="lvmom" viewBox="0 0 ${W} ${H+18}" role="img" aria-label="Domínio da partida a cada 5 minutos"><line x1="0" x2="${W}" y1="${y0}" y2="${y0}" class="g0"/>${bars}${gl}${tk}</svg>`;
}
const lvTeamH=(c,s,cls)=>`<div class="lvt ${cls}">${shield(c,'lg')}<b>${esc(c.n)}</b></div>`;
function lvPlayers(r){
  const hd=(s)=>`<div class="lvpc"><h4>${esc(cl(s?r.a:r.h).n)}</h4>${r.pr[s].map(p=>{const mvp=r.mvp&&r.mvp[0]==s&&r.mvp[1]==r.pr[s].indexOf(p);return `<div class="lvpl ${p[6]?'me':''}"><span class="pp">${p[1]}</span><div><span class="pn1"><b>${esc(p[0])}</b>${p[3]?` <em>⚽${p[3]>1?'×'+p[3]:''}</em>`:''}${p[4]?` <em>🅰${p[4]>1?'×'+p[4]:''}</em>`:''}${mvp?' <span class="tag">MVP</span>':''}<strong class="num ${p[5]>=7.5?'hi':p[5]<5.5?'lo':''}">${p[5].toFixed(1)}</strong></span><i class="dbar"><i class="${s?'r':'b'}" style="width:${(p[5]*10).toFixed(0)}%"></i></i></div></div>`}).join('')}</div>`;
  return `<div class="lvpg">${hd(0)}${hd(1)}</div>`;
}
/* ---------- campo: 22 jogadores e a bola, animados a cada minuto (determinístico) ---------- */
const LVX={GOL:.05,ZAG:.2,VOL:.36,MEI:.5,PNT:.64,ATA:.76},LVK={GOL:.04,ZAG:.1,VOL:.17,MEI:.22,PNT:.27,ATA:.3};
const lvR=(a,b,c)=>{const x=Math.sin(a*127.1+b*311.7+c*74.7)*43758.5453;return x-Math.floor(x)};
function lvBase(r){
  return [0,1].map(s=>{
    const xi=r.xi[s],g={};xi.forEach((p,i)=>{(g[p[1]]=g[p[1]]||[]).push(i)});
    const out=new Array(xi.length);
    Object.keys(g).forEach(pos=>{const ix=g[pos];ix.forEach((i,k)=>{const x=LVX[pos]??.5,y=pos=='GOL'?.5:(k+1)/(ix.length+1);out[i]=[s?1-x:x,y,pos]})});
    return out;
  });
}
function lvBall(r,t){
  const sd=hash(r.h+r.a+r.comp+(S.y||0)),sf=sd%997;
  const po=lvPo(r,t),side=lvR(sf,t,1)*100<po?0:1;
  let d=.3+lvR(sf,t,2)*.42+(side==0?.04:-.04)*(r.st.mom[Math.min(17,Math.floor(t/5))]||0),y=.12+lvR(sf,t,3)*.76;
  let ev=null;
  const sc=r.sc.find(z=>z[0]==t&&t>0);
  if(sc){return{x:sc[1]?.012:.988,y:.5,side:sc[1],ev:['gol',sc[2]]}}
  const fe=r.st.fe.filter(z=>z[0]==t);
  const f=fe.find(z=>z[2]=='sh'||z[2]=='st')||fe.find(z=>z[2]=='co')||fe[0];
  let x;
  if(f){
    const s=f[1];
    if(f[2]=='sh'||f[2]=='st'){x=s?.09:.91;y=.3+lvR(sf,t,4)*.4;return{x,y,side:s,ev:[f[2]=='st'?'no alvo':'chute']}}
    if(f[2]=='co'){return{x:s?.01:.99,y:lvR(sf,t,5)<.5?.03:.97,side:s,ev:['escanteio']}}
    ev=[{fl:'falta',of:'impedimento',yc:'cartão amarelo',rc:'cartão vermelho'}[f[2]]];
    x=side?1-d:d;return{x,y,side:f[1],ev};
  }
  x=side?1-d:d;
  return{x,y,side,ev:null};
}
function lvPitchHtml(r){
  const c=[cl(r.h),cl(r.a)],pl=[pal(c[0]),pal(c[1])];
  const dots=[0,1].map(s=>r.xi[s].map((p,i)=>`<i class="pd t${s}${p[2]?' me':''}${p[1]=='GOL'?' gk':''}" data-s="${s}" data-i="${i}" style="--c1:${pl[s].p};--c2:${pl[s].s}" title="${esc(p[0])}">${i+1}</i>`).join('')).join('');
  return `<div id="lvpitch" class="lvpit" data-k="${S.last.indexOf(r)}"><svg class="lvf" viewBox="0 0 105 68" preserveAspectRatio="none" aria-hidden="true"><rect x=".5" y=".5" width="104" height="67"/><line x1="52.5" y1=".5" x2="52.5" y2="67.5"/><circle cx="52.5" cy="34" r="9.15"/><rect x=".5" y="13.85" width="16.5" height="40.3"/><rect x=".5" y="24.85" width="5.5" height="18.3"/><rect x="88" y="13.85" width="16.5" height="40.3"/><rect x="99" y="24.85" width="5.5" height="18.3"/><rect class="gl" x="-1.2" y="29" width="1.7" height="10"/><rect class="gl" x="104.5" y="29" width="1.7" height="10"/></svg>${dots}<b class="pb"></b><div class="pchip"></div></div>`;
}
function lvPitchSet(pit,r,t){
  const L=ui.lv,ms=Math.min(560,lvMs[L.sp]*.9),B=lvBall(r,t),bs=lvBase(r);
  let near=null,nd=9;
  pit.querySelectorAll('.pd').forEach(d=>{
    const s=+d.dataset.s,i=+d.dataset.i,b=bs[s][i],k=LVK[b[2]]||.2;
    let x=b[0]+(B.x-b[0])*k+(s?-1:1)*(B.side==s?.045:-.02),y=b[1]+(B.y-b[1])*k*1.3+(lvR(i+1,t,s+7)-.5)*.05;
    if(b[2]=='GOL'){x=b[0];y=.5+(B.y-.5)*.22}
    x=C(x,.02,.98);y=C(y,.04,.96);
    d.style.transitionDuration=ms+'ms';d.style.left=(x*100).toFixed(1)+'%';d.style.top=(y*100).toFixed(1)+'%';
    const dd=Math.hypot((x-B.x)*105,(y-B.y)*68);if(dd<nd){nd=dd;near=[s,i]}
  });
  pit.querySelectorAll('.pd.hot').forEach(d=>d.classList.remove('hot'));
  const ball=pit.querySelector('.pb');ball.style.transitionDuration=(ms*.8)+'ms';ball.style.left=(B.x*100).toFixed(1)+'%';ball.style.top=(B.y*100).toFixed(1)+'%';
  const h=near&&pit.querySelector(`.pd[data-s="${near[0]}"][data-i="${near[1]}"]`);if(h)h.classList.add('hot');
  const ch=pit.querySelector('.pchip'),nm=near?r.xi[near[0]][near[1]][0]:'';
  ch.className='pchip'+(B.ev&&B.ev[0]=='gol'?' gol':'');
  ch.textContent=B.ev?(B.ev[0]=='gol'?'GOL! '+B.ev[1]:B.ev[0]+(nm?' · '+nm:'')):nm;
}
function lvHtml(){
  const L=ui.lv,r=S.last[L.i];if(!r||!r.st)return '';
  const t=L.t,fim=t>=90,h=cl(r.h),a=cl(r.a),my=r.h==S.club?0:1,gs=[0,1].map(s=>r.sc.filter(z=>z[1]==s&&z[0]<=t).length);
  if(fim&&!r.mvp){let b=[0,0,-1];r.pr.forEach((rows,s)=>rows.forEach((p,i)=>{if(p[5]>b[2])b=[s,i,p[5]]}));r.mvp=[b[0],b[1]]}
  const res=r.win==null?'Empate':r.win==S.club?'Vitória':'Derrota',rc=r.win==null?'e':r.win==S.club?'w':'l';
  const scL=s=>`<div class="lvg">${r.sc.filter(z=>z[1]==s&&z[0]<=t).map(z=>`<span>⚽ ${esc(z[2])} ${z[0]}'</span>`).join('')}</div>`;
  const head=`<div class="lvh">${lvTeamH(h,0,'b')}<div class="lvc"><small>${esc(r.comp)}</small><b class="num">${gs[0]}<i>x</i>${gs[1]}</b><span class="lvm">${fim?'Fim de jogo'+(r.pen?' · pênaltis':''):(t?t+"'":'Bola rolando')}</span>${fim?`<span class="lvres ${rc}">${res}</span>`:`<i class="lvbar"><u style="width:${(t/90*100).toFixed(1)}%"></u></i>`}</div>${lvTeamH(a,1,'r')}</div><div class="lvgs">${scL(0)}${scL(1)}</div>`;
  const ctl=fim?`<div class="row lvctl"><button class="play" style="flex:1" onclick="lvClose()">Continuar</button></div>`:`<div class="row lvctl"><button class="ghost" onclick="lvPause()">${L.pause?'▶ Continuar':'⏸ Pausar'}</button>${['1x','2x','5x','15x'].map((x,k)=>`<button class="pill" aria-pressed="${L.sp==k}" onclick="lvSpeed(${k})">${x}</button>`).join('')}</div>`;
  let body;
  if(!fim){
    const lines=r.ev.filter(e=>e.m<=t).slice(-10).reverse();
    const flash=r.sc.find(z=>z[0]==t&&t>0);
    body=`${r.xi?'<div id="lvslot"></div>':''}${flash?`<div class="lvfl ${flash[1]==my?'w':'l'}">⚽ GOOOL! <b>${esc(flash[2])}</b></div>`:''}<div class="shg"><div><div class="pn"><h2>Lance a lance</h2><div class="log">${lines.map(e=>`<div class="e ${e.c}"><b>${e.m}’</b> ${e.t}</div>`).join('')}</div></div></div><div><div class="pn"><h2>Estatísticas ao vivo</h2>${lvRows(r,t)}</div><div class="pn"><h2>Domínio da partida</h2>${lvMom(r,t)}</div></div></div>`;
  }else{
    const me=r.pl?`<div class="pn"><h2>Sua atuação</h2>${kv([['Nota',r.rt],['Minutos',r.mn+"'"],['Gols',r.gl],['Assistências',r.as],['Cartões',(r.yc?'🟨':'')+(r.rc?'🟥':'')||'—']])}</div>`:`<div class="pn"><h2>Sua atuação</h2><p class="note" style="margin:0">${S.inj>0?'Você está lesionado.':'Você não atuou nesta partida.'}</p></div>`;
    body=`<div class="shg"><div><div class="pn"><h2>Estatísticas da partida</h2>${lvRows(r,90)}</div>${me}</div><div><div class="pn"><h2>Destaques da partida</h2>${lvPlayers(r)}<p class="lvlg"><span><i class="b"></i>${esc(h.n)}</span><span><i class="r"></i>${esc(a.n)}</span></p></div><div class="pn"><h2>Domínio da partida</h2>${lvMom(r,90)}<p class="lvlg"><span><i class="b"></i>${esc(h.n)} dominando</span><span><i class="r"></i>${esc(a.n)} dominando</span></p></div></div></div>`;
  }
  return `<div class="pn sheet fp lvsh">${fim?`<div class="shtop"><button class="ghost" onclick="lvClose()">← Fechar</button></div>`:'<div class="shtop"><small class="muted">Transmissão ao vivo — acompanhe até o fim do jogo</small></div>'}${head}${ctl}${body}</div>`;
}
function lvDraw(){
  let o=document.getElementById('lvo');
  if(!ui.lv){if(o)o.remove();return}
  if(!o){o=document.createElement('div');o.id='lvo';o.className='ov fp lvo';document.body.appendChild(o)}
  const st=o.scrollTop,old=document.getElementById('lvpitch');if(old)old.remove();
  o.innerHTML=lvHtml();o.scrollTop=st;
  const r=S.last[ui.lv.i],slot=document.getElementById('lvslot');
  if(slot&&r&&r.xi){
    let pit=old&&old.dataset.k==String(ui.lv.i)?old:null;
    if(!pit){const w=document.createElement('div');w.innerHTML=lvPitchHtml(r);pit=w.firstChild}
    slot.appendChild(pit);
    if(!old||pit!==old){pit.querySelectorAll('.pd,.pb').forEach(d=>d.style.transitionDuration='0ms');lvPitchSet(pit,r,ui.lv.t);void pit.offsetWidth}
    else lvPitchSet(pit,r,ui.lv.t);
  }
}

/* ---------- calendário: avançar os dias até o jogo, depois jogar ---------- */
let ADV=null;
function avancar(){
  if(ADV||S.ph!='season'||S.ev)return;
  const g=wkPlan()[0];S.day=S.day|0;if(!g||S.day>=g.d)return;
  ADV=setInterval(()=>{S.day++;if(S.day>=g.d){clearInterval(ADV);ADV=null;save()}render(true)},300);
}
function jogarJogo(){
  if(ADV||S.ph!='season'||S.ev)return;
  const g=wkPlan()[0];if(!g||(S.day|0)<g.d)return;
  const nt=S.ti.length;
  if(g.ph=='mid')stepMid();else stepEnd();
  const i=lvIdx();S.lvp=OPT.live&&i>=0?i+1:0;save();render();
  {const r=S.last.find(x=>x.pl);if(r){const my=r.h==S.club?0:1;sfx(S.ti.length>nt?'cup':r.g[my]>r.g[1-my]?'win':r.g[my]<r.g[1-my]?'lose':'draw')}}
  if(i>=0&&OPT.live)liveOpen(i);
}
function weekStrip(){
  const w=S.week,pl=wkPlan(),day=S.day|0;
  return `<div class="wkst">${WD.map((n,d)=>{const g=pl.find(x=>x.d==d);return `<div class="wd ${d==day?'now':''} ${d<day?'past':''} ${g?'gm':''}"><small>${n}</small><b>${String(wkDate(w,d).getDate()).padStart(2,'0')}</b><span>${g?'⚽':d<day?'✓':'·'}</span></div>`}).join('')}</div>`;
}
function playBlock(){
  S.day=S.day|0;const g=wkPlan()[0],ready=S.day>=g.d,opp=g.h!=null?`${cl(g.h).n} x ${cl(g.a).n}`:'';
  const evb=S.ev?'disabled':'';
  return `${weekStrip()}<p class="note" style="margin:8px 0">📅 <b>${dTxt(S.week,S.day)}</b> · próximo jogo: <b>${dTxt(S.week,g.d)}</b> — ${esc(g.n)}${opp?' ('+esc(opp)+')':''}</p>
  ${ready?`<button class="play" onclick="jogarJogo()" ${evb}>⚽ Jogar — ${esc(g.n)}</button><p class="note" style="margin:6px 0">É dia de jogo. A partida é transmitida ao vivo.</p>`:`<button class="play" onclick="avancar()" ${evb}>▶ Avançar</button><p class="note" style="margin:6px 0">Faltam ${g.d-S.day} dia(s) para o jogo. O tempo corre direto até lá.</p>`}`;
}
