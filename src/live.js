'use strict';
/* ============================================================
   JOGO AO VIVO + ESTATÍSTICAS DE FIM DE JOGO (estilo BrasLOL)
   A partida já vem simulada em S.last (pm); aqui ela é "transmitida" minuto a minuto.
   ============================================================ */
let LVT=null;
const lvMs=[650,320,130,45];
const lvIdx=()=>S.last.findIndex(r=>r.h==S.club||r.a==S.club);
function lvTick(){const L=ui.lv;if(!L||L.pause)return;L.t=Math.min(90,L.t+1);if(L.t>=90){clearInterval(LVT);LVT=null;if(S.lvp){S.lvp=0;save()}}lvDraw()}
function lvTimer(){clearInterval(LVT);LVT=null;if(ui.lv&&ui.lv.t<90&&!ui.lv.pause)LVT=setInterval(lvTick,lvMs[ui.lv.sp])}
function liveOpen(i,fim){const r=S.last[i];if(!r||!r.st)return;ui.lv={i,t:fim?90:0,sp:0,pause:false};lvTimer();lvDraw()}
function lvClose(){if(ui.lv&&ui.lv.t<90&&S.lvp)return;clearInterval(LVT);LVT=null;ui.lv=null;lvDraw();render(true)}
function lvSpeed(k){ui.lv.sp=k;ui.lv.pause=false;lvTimer();lvDraw()}
function lvPause(){ui.lv.pause=!ui.lv.pause;lvTimer();lvDraw()}
function lvNext(){lvClose();if(S.ph=='season'&&!S.ev)adv()}
/* se a página for recarregada no meio da transmissão, ela recomeça */
function lvBoot(){if(S&&S.lvp&&lvIdx()>=0)liveOpen(lvIdx());else if(S)S.lvp=0}
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
function lvHtml(){
  const L=ui.lv,r=S.last[L.i];if(!r||!r.st)return '';
  const t=L.t,fim=t>=90,h=cl(r.h),a=cl(r.a),my=r.h==S.club?0:1,gs=[0,1].map(s=>r.sc.filter(z=>z[1]==s&&z[0]<=t).length);
  if(fim&&!r.mvp){let b=[0,0,-1];r.pr.forEach((rows,s)=>rows.forEach((p,i)=>{if(p[5]>b[2])b=[s,i,p[5]]}));r.mvp=[b[0],b[1]]}
  const res=r.win==null?'Empate':r.win==S.club?'Vitória':'Derrota',rc=r.win==null?'e':r.win==S.club?'w':'l';
  const scL=s=>`<div class="lvg">${r.sc.filter(z=>z[1]==s&&z[0]<=t).map(z=>`<span>⚽ ${esc(z[2])} ${z[0]}'</span>`).join('')}</div>`;
  const head=`<div class="lvh">${lvTeamH(h,0,'b')}<div class="lvc"><small>${esc(r.comp)}</small><b class="num">${gs[0]}<i>x</i>${gs[1]}</b><span class="lvm">${fim?'Fim de jogo'+(r.pen?' · pênaltis':''):(t?t+"'":'Bola rolando')}</span>${fim?`<span class="lvres ${rc}">${res}</span>`:`<i class="lvbar"><u style="width:${(t/90*100).toFixed(1)}%"></u></i>`}</div>${lvTeamH(a,1,'r')}</div><div class="lvgs">${scL(0)}${scL(1)}</div>`;
  const ctl=fim?`<div class="row lvctl"><button class="play" style="flex:1" onclick="lvNext()" ${S.ph=='season'&&!S.ev?'':'disabled'}>▶ Próximo jogo</button><button class="ghost" onclick="lvClose()">Fechar</button></div>`:`<div class="row lvctl"><button class="ghost" onclick="lvPause()">${L.pause?'▶ Continuar':'⏸ Pausar'}</button>${['1x','2x','5x','15x'].map((x,k)=>`<button class="pill" aria-pressed="${L.sp==k}" onclick="lvSpeed(${k})">${x}</button>`).join('')}</div>`;
  let body;
  if(!fim){
    const lines=r.ev.filter(e=>e.m<=t).slice(-10).reverse();
    const flash=r.sc.find(z=>z[0]==t&&t>0);
    body=`${flash?`<div class="lvfl ${flash[1]==my?'w':'l'}">⚽ GOOOL! <b>${esc(flash[2])}</b></div>`:''}<div class="shg"><div><div class="pn"><h2>Lance a lance</h2><div class="log">${lines.map(e=>`<div class="e ${e.c}"><b>${e.m}’</b> ${e.t}</div>`).join('')}</div></div></div><div><div class="pn"><h2>Estatísticas ao vivo</h2>${lvRows(r,t)}</div><div class="pn"><h2>Domínio da partida</h2>${lvMom(r,t)}</div></div></div>`;
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
  const st=o.scrollTop;o.innerHTML=lvHtml();o.scrollTop=st;
}
