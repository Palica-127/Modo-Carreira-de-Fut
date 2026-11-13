'use strict';
/* ============================================================
   JOGO AO VIVO + ESTATÍSTICAS DE FIM DE JOGO (estilo BrasLOL)
   A partida já vem simulada em S.last (pm); aqui ela é "transmitida" minuto a minuto.
   ============================================================ */
let LVT=null;
const lvMs=[1400,700,300,100];
const lvMine=r=>r.h==S.club||r.a==S.club;
const lvIdx=()=>S.last.findIndex(r=>lvMine(r)&&!r.sn);
const lvLast=()=>{for(let i=S.last.length-1;i>=0;i--)if(lvMine(S.last[i])&&S.last[i].st)return i;return -1};
function lvTick(){const L=ui.lv;if(!L||L.pause)return;if(PIT&&PIT.hold)return;L.t=Math.min(90,L.t+1);if(L.t>=90){L.pend=false;clearInterval(LVT);LVT=null;if(S.lvp){S.lvp=0;save()}}lvDraw()}
function lvTimer(){clearInterval(LVT);LVT=null;if(ui.lv&&ui.lv.t<90&&!ui.lv.pause)LVT=setInterval(lvTick,lvMs[ui.lv.sp])}
function liveOpen(i,fim){const r=S.last[i];if(!r||!r.st)return;if(!fim)r.sn=1;PIT=null;ui.lv={i,t:fim?90:0,sp:0,pause:false,pend:false};lvTimer();lvDraw()}
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
/* ---------- campo: simulação contínua (60 fps) — passes, laterais, escanteios, tiros de meta, finalizações e gols ---------- */
const LVX={GOL:.05,ZAG:.2,VOL:.36,MEI:.5,PNT:.64,ATA:.76},LVK={GOL:.04,ZAG:.1,VOL:.17,MEI:.22,PNT:.27,ATA:.3};
const lvR=(a,b,c)=>{const x=Math.sin(a*127.1+b*311.7+c*74.7)*43758.5453;return x-Math.floor(x)};
const lvDist=(a,b)=>Math.hypot((a[0]-b[0])*105,(a[1]-b[1])*68);
const lvDir=s=>s?-1:1,lvXg=s=>s?0:1;
let PIT=null,LVRAF=0;
function lvBase(r){
  return [0,1].map(s=>{
    const xi=r.xi[s],g={};xi.forEach((p,i)=>{(g[p[1]]=g[p[1]]||[]).push(i)});
    const out=new Array(xi.length);
    Object.keys(g).forEach(pos=>{const ix=g[pos];ix.forEach((i,k)=>{const x=LVX[pos]??.5,y=pos=='GOL'?.5:(k+1)/(ix.length+1);out[i]=[s?1-x:x,y,pos]})});
    return out;
  });
}
function lvPitInit(r,node){
  const bs=lvBase(r),el=[0,1].map(s=>r.xi[s].map((_,i)=>node.querySelector(`.pj[data-s="${s}"][data-i="${i}"]`)));
  let hi=r.xi[0].findIndex(p=>p[1]=='ATA');if(hi<0)hi=r.xi[0].length-1;
  const pos=bs.map(a=>a.map(b=>[b[0],b[1]]));pos[0][hi]=[.5,.5];
  PIT={r,node,bs,el,pos,ball:{x:.5,y:.5,h:0},bel:node.querySelector('.pb'),bsh:node.querySelector('.pbs'),chipEl:node.querySelector('.pchip'),holder:[0,hi],poss:0,q:[],seg:null,ov:{},cel:null,gel:null,hold:false,t:-1,last:0,chip:'',chipT:0,hot:null,txt:null};
}
const lvTo=(P,to)=>to.s!=null?P.pos[to.s][to.i]:[to.x,to.y];
/* alvo de cada jogador: posição da formação puxada pela bola, ou ordem especial (bola parada, comemoração) */
function lvTgt(P,s,i){
  const o=P.ov[s+'-'+i];if(o)return o;
  const b=P.bs[s][i],B=P.ball,d=lvDir(s),att=P.poss==s;
  if(b[2]=='GOL')return [b[0],C(.5+(B.y-.5)*.25,.38,.62)];
  const k=LVK[b[2]]||.2;
  let x=b[0]+(B.x-b[0])*k+d*(att?.07:-.04)*(b[2]=='ZAG'?.6:1),y=b[1]+(B.y-b[1])*k*1.25;
  if(P.holder&&P.holder[0]==s&&P.holder[1]==i&&P.seg&&P.seg.k=='carry'){const h=P.pos[s][i];x=h[0]+d*.1;y=h[1]+(.5-h[1])*.12}
  return [C(x,.02,.98),C(y,.04,.96)];
}
function lvStep(P,dt){
  const L=ui.lv,spd=lvMs[0]/lvMs[L.sp],ms=dt*1000,B=P.ball;
  if(P.cel){P.cel.t+=ms;if(P.cel.t>=P.cel.dur)lvKick(P)}
  else{
    if(!P.seg&&P.q.length){const g=P.q.shift();g.t=0;g.from=[B.x,B.y];P.seg=g;if(g.chip){P.chip=g.chip;P.chipT=1700}if(g.ov)Object.assign(P.ov,g.ov)}
    const g=P.seg;
    if(g){
      g.t+=ms;const p=C(g.t/g.dur,0,1);
      if(g.k=='carry'){const h=P.pos[P.holder[0]][P.holder[1]];B.x=h[0]+lvDir(P.holder[0])*.012;B.y=h[1];B.h=0}
      else if(g.k=='wait'){B.h=0}
      else{const to=lvTo(P,g.to),e=g.k=='shot'?Math.pow(p,.8):1-Math.pow(1-p,1.8);B.x=g.from[0]+(to[0]-g.from[0])*e;B.y=g.from[1]+(to[1]-g.from[1])*e;B.h=(g.arc||0)*4*p*(1-p)}
      if(p>=1){
        if(g.to&&g.to.s!=null){P.holder=[g.to.s,g.to.i];P.poss=g.to.s}
        B.h=0;if(g.clr)P.ov={};
        P.seg=null;if(g.end)g.end(P);
      }
    }else if(P.holder&&!P.cel){const h=P.pos[P.holder[0]][P.holder[1]];B.x=h[0]+lvDir(P.holder[0])*.012;B.y=h[1];B.h=0}
    if(P.hold&&!P.seg&&!P.q.length&&!P.cel)P.hold=false;
  }
  if(P.chipT>0)P.chipT-=ms;
  const rate=Math.min(16,4.5*Math.sqrt(spd)),vm=.3*Math.sqrt(spd)*dt,kf=1-Math.exp(-rate*dt);
  for(let s=0;s<2;s++)for(let i=0;i<P.pos[s].length;i++){
    const t=lvTgt(P,s,i),p=P.pos[s][i];let dx=(t[0]-p[0])*kf,dy=(t[1]-p[1])*kf;
    const l=Math.hypot(dx*1.54,dy);if(l>vm&&l>0){const f=vm/l;dx*=f;dy*=f}
    p[0]+=dx;p[1]+=dy;
  }
}
function lvPaint(P){
  const W=P.node.clientWidth,H=P.node.clientHeight,tr=(x,y,e)=>`translate(${(x*W).toFixed(1)}px,${(y*H).toFixed(1)}px) translate(-50%,-50%)${e||''}`;
  for(let s=0;s<2;s++)for(let i=0;i<P.el[s].length;i++){const d=P.el[s][i];if(d){const p=P.pos[s][i];d.style.transform=tr(p[0],p[1])}}
  const B=P.ball;
  P.bsh.style.transform=tr(B.x+B.h*.012,B.y+B.h*.04);P.bsh.style.opacity=String(.45-B.h*.8>0?.45-B.h*.8:.12);
  P.bel.style.transform=tr(B.x,B.y-B.h*.05,` scale(${(1+B.h*1.1).toFixed(2)})`);
  const hk=P.holder?P.holder[0]+'-'+P.holder[1]:null;
  if(hk!=P.hot){const a=P.hot&&P.node.querySelector(`.pj[data-s="${P.hot[0]}"][data-i="${P.hot.slice(2)}"]`);if(a)a.classList.remove('hot');const b=hk&&P.el[P.holder[0]][P.holder[1]];if(b)b.classList.add('hot');P.hot=hk}
  const hn=P.holder?P.r.xi[P.holder[0]][P.holder[1]][0]:'',txt=P.chipT>0&&P.chip?P.chip:hn,cl_=P.chipT>0&&P.chip?'pchip ev':'pchip';
  if(txt!=P.txt){P.txt=txt;P.chipEl.textContent=txt;P.chipEl.className=cl_}
}
function lvFrame(now){
  LVRAF=0;const P=PIT;
  if(!P||!ui.lv||!P.node.isConnected)return;
  LVRAF=requestAnimationFrame(lvFrame);
  let dt=P.last?Math.min(.05,(now-P.last)/1000):0;P.last=now;
  if(ui.lv.pause)dt=0;
  lvStep(P,dt);lvPaint(P);
}
/* comemoração do gol: escudo do time, autor e assistente; depois, novo pontapé inicial */
function lvGoalIn(P,g){
  const L=ui.lv,r=P.r,gs=g.gs,d=lvDir(gs),X=lvXg(gs),team=cl(gs?r.a:r.h),my=r.h==S.club?0:1;
  L.pend=false;P.ov={};
  const side=g.sy<.5?.07:.93,mates=P.bs[gs].map((b,i)=>i).filter(i=>i!=g.bi&&P.bs[gs][i][2]!='GOL').sort((a,b)=>lvDist(P.pos[gs][a],P.pos[gs][g.bi])-lvDist(P.pos[gs][b],P.pos[gs][g.bi])).slice(0,4);
  P.ov[gs+'-'+g.bi]=[C(X-d*.28,.06,.94),side];
  mates.forEach((i,k)=>{P.ov[gs+'-'+i]=[C(X-d*(.28+.05+.03*k),.04,.96),C(side+(side<.5?1:-1)*(.06+.05*k),.05,.95)]});
  P.cel={t:0,dur:3200,gs};
  const n=document.createElement('div');
  n.className='pgoal '+(r.pl?(gs==my?'w':'l'):'w');
  n.innerHTML=`<div class="pgb">${shield(team,'xl')}<div class="pgt"><small>GOOOL!</small><b>${esc(g.name)}</b><span>${g.an?'Assistência: <em>'+esc(g.an)+'</em>':'Jogada individual'}</span><i>${esc(team.n)}</i></div></div>`;
  P.node.appendChild(n);P.gel=n;
  lvDraw();
}
function lvKick(P){
  const r=P.r,gs=P.cel.gs,cs=1-gs;
  if(P.gel){P.gel.remove();P.gel=null}
  P.cel=null;P.ov={};P.seg=null;P.q=[];P.hold=false;P.chipT=0;
  P.pos=P.bs.map(a=>a.map(b=>[b[0],b[1]]));
  let hi=r.xi[cs].findIndex(p=>p[1]=='ATA');if(hi<0)hi=r.xi[cs].length-1;
  P.pos[cs][hi]=[.5,.5];P.ball.x=.5;P.ball.y=.5;P.ball.h=0;P.holder=[cs,hi];P.poss=cs;
}
/* roteiro do minuto: lista de trechos da bola (passes, conduções, finalizações, bolas paradas) */
function lvPlan(r,t,tm){
  const P=PIT,L=ui.lv;if(!P||P.cel)return;
  P.q=[];if(!P.seg)P.ov={};
  const sf=hash(r.h+r.a+r.comp)%997,R=k=>lvR(sf,t,k);
  const po=lvPo(r,t),fe=r.st.fe.filter(z=>z[0]==t),goal=t>0?r.sc.find(z=>z[0]==t):null;
  const hs=fe.find(z=>z[2]=='st'),hsh=fe.find(z=>z[2]=='sh'),hc=fe.find(z=>z[2]=='co'),hf=fe.find(z=>z[2]=='fl'||z[2]=='yc'||z[2]=='rc'),ho=fe.find(z=>z[2]=='of');
  const side=goal?goal[1]:hs?hs[1]:hsh?hsh[1]:hc?hc[1]:hf?1-hf[1]:ho?ho[1]:(R(1)*100<po?0:1);
  const Q=[],add=o=>{Q.push(o);return o};
  const gkI=s=>P.bs[s].findIndex(b=>b[2]=='GOL'),fld=s=>P.bs[s].map((b,i)=>i).filter(i=>P.bs[s][i][2]!='GOL');
  const near=(s,pt,ex)=>fld(s).filter(i=>i!=ex).sort((a,b)=>lvDist(P.pos[s][a],pt)-lvDist(P.pos[s][b],pt))[0];
  const kind=(s,ps)=>fld(s).filter(i=>ps.includes(P.bs[s][i][2]));
  const pickOf=(arr,k)=>arr[Math.floor(R(k)*arr.length)%arr.length];
  const fwd=(s,from,k)=>{
    const dir=lvDir(s),p=P.pos[s][from];
    const c=fld(s).filter(i=>i!=from).map(i=>{const q=P.pos[s][i];return{i,sc:lvDist(p,q)*.6-(q[0]-p[0])*dir*70}}).filter(o=>{const d=lvDist(p,P.pos[s][o.i]);return d>7&&d<46}).sort((a,b)=>a.sc-b.sc).slice(0,3);
    return c.length?c[Math.floor(R(k)*c.length)%c.length].i:pickOf(fld(s).filter(i=>i!=from),k);
  };
  const pw=(s,a,b)=>.5+lvDist(P.pos[s][a],P.pos[s][b])/32;
  const att=s=>kind(s,['ATA','PNT']).length?kind(s,['ATA','PNT']):kind(s,['MEI']);
  let cur=P.holder.slice();
  if(cur[0]!=side){const i=near(side,[P.ball.x,P.ball.y]);add({k:'pass',to:{s:side,i},w:.6,arc:.05,chip:'Desarme'});cur=[side,i]}
  const np=tm>=1000?3:tm>=500?2:tm>=250?1:0,special=goal||hs||hsh||hc;
  for(let k=0;k<(special?Math.max(0,np-1):np);k++){const j=fwd(side,cur[1],10+k);add({k:'pass',to:{s:side,i:j},w:pw(side,cur[1],j),arc:.1});cur=[side,j]}
  const xg=lvXg(side),d=lvDir(side),ds=1-side,gi=gkI(ds);
  let D=tm*.9;
  if(goal||hs||hsh){
    const xi=r.xi[side];
    let bi=goal?xi.findIndex(p=>p[0]==goal[2]):-1;
    if(bi<0||xi[bi][1]=='GOL'||bi==cur[1])bi=pickOf(att(side).filter(i=>i!=cur[1]),20)??att(side)[0];
    const by=.5+(R(21)-.5)*.2;
    if(goal){
      let ai=-1,an='';
      if(goal[3]==1){ai=xi.findIndex(p=>p[2]);an=S.p.name}
      else if(R(11)<(xi[bi][2]?.5:.72)){const c=fld(side).filter(i=>i!=bi);ai=pickOf(c,12);an=xi[ai][0]}
      const pi=ai>=0&&ai!=bi?ai:pickOf(fld(side).filter(i=>i!=bi),13),ay=R(14)<.5?.16:.84,sy=.5+(R(5)-.5)*.14,gy=C(.5-(sy-.5)*1.7,.38,.62);
      const ov={};ov[side+'-'+pi]=[X_(xg,d,.2),ay];ov[side+'-'+bi]=[X_(xg,d,.12),by];
      if(cur[1]!=pi)add({k:'pass',to:{s:side,i:pi},w:1,arc:.12,ov});else Object.assign(P.ov,ov);
      add({k:'carry',w:.55});
      add({k:'pass',to:{s:side,i:bi},w:1.1,arc:.38,chip:ai>=0&&ai!=bi?'Cruzamento':''});
      const ov2={};ov2[ds+'-'+gi]=[X_(xg,d,.012),gy];
      add({k:'shot',to:{x:xg+d*.014,y:sy},w:.7,arc:.07,ov:ov2,chip:'Chute!',end:p=>lvGoalIn(p,{gs:side,bi,name:goal[2],an:ai>=0&&ai!=bi?an:'',sy})});
      D=Math.max(D,2600);L.pend=true;
    }else{
      const ov={};ov[side+'-'+bi]=[X_(xg,d,.16),by];
      if(cur[1]!=bi)add({k:'pass',to:{s:side,i:bi},w:pw(side,cur[1],bi)+.3,arc:.15,ov});else Object.assign(P.ov,ov);
      add({k:'carry',w:.45});
      if(hs){
        const sy=.5+(R(6)-.5)*.1,ov2={};ov2[ds+'-'+gi]=[X_(xg,d,.025),sy];
        add({k:'shot',to:{x:X_(xg,d,.025),y:sy},w:.75,arc:.06,ov:ov2,chip:'Chute no alvo',end:p=>{p.holder=[ds,gi];p.poss=ds}});
        D=Math.max(D,1700);
      }else{
        const sg=R(6)<.5?-1:1,ov2={};
        add({k:'shot',to:{x:xg+d*.02,y:.5+sg*(.1+R(7)*.16)},w:.75,arc:.14,chip:'Chute para fora'});
        ov2[ds+'-'+gi]=[X_(xg,d,.05),.5];
        add({k:'pass',to:{s:ds,i:gi},w:1.1,arc:.06,ov:ov2,chip:'Tiro de meta'});
        add({k:'wait',w:.35});
        const mid=kind(ds,['VOL','MEI','PNT']);add({k:'pass',to:{s:ds,i:pickOf(mid.length?mid:fld(ds),8)},w:1.6,arc:.5,clr:true});
        D=Math.max(D,2700);
      }
    }
  }else if(hc){
    const cy=R(3)<.5?.03:.97,fl=[xg-d*.006,cy],ov={},box=[[.09,.4],[.09,.5],[.09,.6],[.16,.45],[.16,.57],[.05,.5]],dbox=[[.05,.38],[.05,.62],[.1,.45],[.1,.55],[.14,.5]];
    const kk=near(side,fl,-1),ins=fld(side).filter(i=>i!=kk&&P.bs[side][i][2]!='ZAG'||R(40+i)<.3).filter(i=>i!=kk).slice(0,6),df=kind(ds,['ZAG','VOL','MEI']).slice(0,5);
    ov[side+'-'+kk]=fl;ins.forEach((i,k)=>{const b=box[k%box.length];ov[side+'-'+i]=[X_(xg,d,b[0]),b[1]]});df.forEach((i,k)=>{const b=dbox[k%dbox.length];ov[ds+'-'+i]=[X_(xg,d,b[0]),b[1]]});
    const tgt=ins.find(i=>i!=kk)??att(side)[0];
    add({k:'pass',to:{x:fl[0],y:fl[1]},w:1,arc:.1,chip:'Escanteio'});
    add({k:'wait',w:1,ov});
    add({k:'pass',to:{s:side,i:tgt},w:1.3,arc:.55});
    if(R(4)<.6){const sy=.5+(R(5)-.5)*.1,ov2={};ov2[ds+'-'+gi]=[X_(xg,d,.025),sy];add({k:'shot',to:{x:X_(xg,d,.025),y:sy},w:.6,arc:.05,ov:ov2,chip:'Cabeceio!',end:p=>{p.holder=[ds,gi];p.poss=ds;p.ov={}}})}
    else add({k:'pass',to:{s:ds,i:pickOf(kind(ds,['ZAG','VOL']).length?kind(ds,['ZAG','VOL']):fld(ds),9)},w:1,arc:.45,clr:true,chip:'Cortou!'});
    D=Math.max(D,2600);
  }else if(hf||ho){
    const fs=hf?1-hf[1]:ds,lab=hf?(hf[2]=='yc'?'Cartão amarelo':hf[2]=='rc'?'Cartão vermelho':'Falta'):'Impedimento';
    if(ho){const ba=pickOf(att(side),30);add({k:'pass',to:{s:side,i:ba},w:.8,arc:.2,chip:lab})}
    const kk=near(fs,[P.ball.x,P.ball.y]);
    add({k:'pass',to:{s:fs,i:kk},w:.5,arc:.04,chip:ho?'':lab});
    add({k:'wait',w:.8,chip:lab});
    add({k:'pass',to:{s:fs,i:fwd(fs,kk,31)},w:1,arc:.3});
    D=Math.max(D,1500);
  }else{
    if(tm>=500&&R(9)<.34){
      const p=P.pos[side][cur[1]],ey=p[1]<.5?.0:1,sp=[C(p[0]+d*.05,.03,.97),ey],th=near(side,sp,cur[1]),ov={};ov[side+'-'+th]=[sp[0],ey==0?.015:.985];
      add({k:'pass',to:{x:sp[0],y:sp[1]},w:.7,arc:.12,chip:'Lateral'});
      add({k:'wait',w:.6,ov});
      add({k:'pass',to:{s:side,i:fwd(side,th,32)},w:.8,arc:.2,clr:true});
      D=Math.max(D,tm*.9);
    }else add({k:'carry',w:.9});
  }
  const Wt=Q.reduce((a,g)=>a+g.w,0)||1;
  Q.forEach(g=>{g.dur=Math.max(70,g.w/Wt*D)});
  P.q=Q;P.hold=D>tm*.9+1;
}
const X_=(xg,d,off)=>xg-d*off;
function lvPitchHtml(r){
  const c=[cl(r.h),cl(r.a)],pl=[pal(c[0]),pal(c[1])];
  const dots=[0,1].map(s=>r.xi[s].map((p,i)=>`<i class="pj t${s}${p[2]?' me':''}${p[1]=='GOL'?' gk':''}" data-s="${s}" data-i="${i}" style="--c1:${pl[s].p};--c2:${pl[s].s}" title="${esc(p[0])}">${p[2]?`<s class="mk">▼</s><u class="mn">${esc(p[0].split(' ').slice(-1)[0])} · VOCÊ</u>`:''}${i+1}</i>`).join('')).join('');
  return `<div id="lvpitch" class="lvpit" data-k="${S.last.indexOf(r)}"><svg class="lvf" viewBox="0 0 105 68" preserveAspectRatio="none" aria-hidden="true"><rect x=".5" y=".5" width="104" height="67"/><line x1="52.5" y1=".5" x2="52.5" y2="67.5"/><circle cx="52.5" cy="34" r="9.15"/><rect x=".5" y="13.85" width="16.5" height="40.3"/><rect x=".5" y="24.85" width="5.5" height="18.3"/><rect x="88" y="13.85" width="16.5" height="40.3"/><rect x="99" y="24.85" width="5.5" height="18.3"/><rect class="gl" x="-1.2" y="29" width="1.7" height="10"/><rect class="gl" x="104.5" y="29" width="1.7" height="10"/></svg>${dots}<b class="pbs"></b><b class="pb"></b><div class="pchip"></div></div>`;
}
function lvHtml(){
  const L=ui.lv,r=S.last[L.i];if(!r||!r.st)return '';
  const t=L.t,tv=L.pend?t-1:t,fim=t>=90,h=cl(r.h),a=cl(r.a),my=r.h==S.club?0:1,gs=[0,1].map(s=>r.sc.filter(z=>z[1]==s&&z[0]<=tv).length);
  if(fim&&!r.mvp){let b=[0,0,-1];r.pr.forEach((rows,s)=>rows.forEach((p,i)=>{if(p[5]>b[2])b=[s,i,p[5]]}));r.mvp=[b[0],b[1]]}
  const res=r.win==null?'Empate':r.win==S.club?'Vitória':'Derrota',rc=r.win==null?'e':r.win==S.club?'w':'l';
  const scL=s=>`<div class="lvg">${r.sc.filter(z=>z[1]==s&&z[0]<=tv).map(z=>`<span>⚽ ${esc(z[2])} ${z[0]}'</span>`).join('')}</div>`;
  const head=`<div class="lvh">${lvTeamH(h,0,'b')}<div class="lvc"><small>${esc(r.comp)}</small><b class="num">${gs[0]}<i>x</i>${gs[1]}</b><span class="lvm">${fim?'Fim de jogo'+(r.pen?' · pênaltis':''):(t?t+"'":'Bola rolando')}</span>${fim?`<span class="lvres ${rc}">${res}</span>`:`<i class="lvbar"><u style="width:${(t/90*100).toFixed(1)}%"></u></i>`}</div>${lvTeamH(a,1,'r')}</div><div class="lvgs">${scL(0)}${scL(1)}</div>`;
  const ctl=fim?`<div class="row lvctl"><button class="play" style="flex:1" onclick="lvClose()">Continuar</button></div>`:`<div class="row lvctl"><button class="ghost" onclick="lvPause()">${L.pause?'▶ Continuar':'⏸ Pausar'}</button>${['1x','2x','5x','15x'].map((x,k)=>`<button class="pill" aria-pressed="${L.sp==k}" onclick="lvSpeed(${k})">${x}</button>`).join('')}</div>`;
  let body;
  if(!fim){
    const lines=r.ev.filter(e=>e.m<=tv).slice(-10).reverse();
    body=`${r.xi?'<div id="lvslot"></div>':''}<div class="shg"><div><div class="pn"><h2>Lance a lance</h2><div class="log">${lines.map(e=>`<div class="e ${e.c}"><b>${e.m}’</b> ${e.t}</div>`).join('')}</div></div></div><div><div class="pn"><h2>Estatísticas ao vivo</h2>${lvRows(r,tv)}</div><div class="pn"><h2>Domínio da partida</h2>${lvMom(r,tv)}</div></div></div>`;
  }else{
    const me=r.pl?`<div class="pn"><h2>Sua atuação</h2>${kv([['Nota',r.rt],['Minutos',r.mn+"'"],['Gols',r.gl],['Assistências',r.as],['Cartões',(r.yc?'🟨':'')+(r.rc?'🟥':'')||'—']])}</div>`:`<div class="pn"><h2>Sua atuação</h2><p class="note" style="margin:0">${S.inj>0?'Você está lesionado.':'Você não atuou nesta partida.'}</p></div>`;
    body=`<div class="shg"><div><div class="pn"><h2>Estatísticas da partida</h2>${lvRows(r,90)}</div>${me}</div><div><div class="pn"><h2>Destaques da partida</h2>${lvPlayers(r)}<p class="lvlg"><span><i class="b"></i>${esc(h.n)}</span><span><i class="r"></i>${esc(a.n)}</span></p></div><div class="pn"><h2>Domínio da partida</h2>${lvMom(r,90)}<p class="lvlg"><span><i class="b"></i>${esc(h.n)} dominando</span><span><i class="r"></i>${esc(a.n)} dominando</span></p></div></div></div>`;
  }
  return `<div class="pn sheet fp lvsh">${fim?`<div class="shtop"><button class="ghost" onclick="lvClose()">← Fechar</button></div>`:'<div class="shtop"><small class="muted">Transmissão ao vivo — acompanhe até o fim do jogo</small></div>'}${head}${ctl}${body}</div>`;
}
function lvDraw(){
  let o=document.getElementById('lvo');
  if(!ui.lv){if(o)o.remove();PIT=null;return}
  if(!o){o=document.createElement('div');o.id='lvo';o.className='ov fp lvo';document.body.appendChild(o)}
  const st=o.scrollTop,old=document.getElementById('lvpitch');if(old)old.remove();
  o.innerHTML=lvHtml();o.scrollTop=st;
  const r=S.last[ui.lv.i],slot=document.getElementById('lvslot');
  if(slot&&r&&r.xi){
    let pit=old&&PIT&&PIT.node===old?old:null;
    if(!pit){const w=document.createElement('div');w.innerHTML=lvPitchHtml(r);pit=w.firstChild;lvPitInit(r,pit)}
    slot.appendChild(pit);
    if(PIT.t!=ui.lv.t){PIT.t=ui.lv.t;lvPlan(r,ui.lv.t,lvMs[ui.lv.sp])}
    lvPaint(PIT);
    if(!LVRAF&&typeof requestAnimationFrame!='undefined'){PIT.last=0;LVRAF=requestAnimationFrame(lvFrame)}
  }else PIT=null;
}

/* ---------- calendário: avançar os dias até o jogo, depois jogar ---------- */
let ADV=null;
/* avança os dias atualizando só a faixa da semana (sem redesenhar a tela inteira, para não piscar) */
function stripUpd(){
  const day=S.day|0,w=document.querySelectorAll('#pblk .wd');if(!w.length)return false;
  const pl=wkPlan();
  w.forEach((el,d)=>{el.classList.toggle('now',d==day);el.classList.toggle('past',d<day);const g=pl.find(x=>x.d==d),sp=el.querySelector('.wi');if(sp&&!g)sp.textContent=d<day?'✓':'·'});
  const t=document.getElementById('pdt');if(t)t.textContent=dTxt(S.week,day);
  return true;
}
function avancar(){
  if(ADV||S.ph!='season'||S.ev)return;
  const g=wkPlan()[0];S.day=S.day|0;if(!g||S.day>=g.d)return;
  const b=document.querySelector('#pblk .play');if(b){b.disabled=true;b.textContent='⏳ Avançando…'}
  ADV=setInterval(()=>{S.day++;const ok=stripUpd();if(S.day>=g.d||!ok){clearInterval(ADV);ADV=null;save();render(true)}},260);
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
  return `<div class="wkst">${WD.map((n,d)=>{const g=pl.find(x=>x.d==d),o=g&&g.h!=null?cl(g.h==S.club?g.a:g.h):null;
    const ic=g?(o?shield(o,'xs'):'⚽'):d<day?'✓':'·';
    return `<div class="wd ${d==day?'now':''} ${d<day?'past':''} ${g?'gm':''}" ${g?`style="--kc:${KB[g.kk||'lg'][1]}" title="${esc(g.n)}${o?' · '+esc(o.n):''}"`:''}><small>${n}</small><b>${String(wkDate(w,d).getDate()).padStart(2,'0')}</b><span class="wi">${ic}</span>${g?`<em class="wk">${KB[g.kk||'lg'][0]}</em>`:''}</div>`}).join('')}</div>`;
}
function playBlock(){
  S.day=S.day|0;const g=wkPlan()[0],ready=S.day>=g.d,opp=g.h!=null?`${cl(g.h).n} x ${cl(g.a).n}`:'';
  const evb=S.ev?'disabled':'';
  return `<div id="pblk">${weekStrip()}<p class="note" style="margin:8px 0">📅 <b id="pdt">${dTxt(S.week,S.day)}</b> · próximo jogo: <b>${dTxt(S.week,g.d)}</b> — ${esc(g.n)}${opp?' ('+esc(opp)+')':''}</p>
  ${ready?`<button class="play" onclick="jogarJogo()" ${evb}>⚽ Jogar — ${esc(g.n)}</button><p class="note" style="margin:6px 0">É dia de jogo. A partida é transmitida ao vivo.</p>`:`<button class="play" onclick="avancar()" ${evb}>▶ Avançar</button><p class="note" style="margin:6px 0">Faltam ${g.d-S.day} dia(s) para o jogo. O tempo corre direto até lá.</p>`}</div>`;
}
