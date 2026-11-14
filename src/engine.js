'use strict';
/* ============================================================
   HABITE-SE 10 — MOTOR
   Estado global em S (salvo no localStorage, chave "h10", versão 2).
   Tudo aqui é independente de DOM, para poder testar em Node.
   ============================================================ */

/* ---------- utilidades ---------- */
const R=(a,b)=>a+Math.random()*(b-a),RI=(a,b)=>Math.floor(R(a,b+1)),P=a=>a[RI(0,a.length-1)],C=(v,a=0,b=99)=>Math.max(a,Math.min(b,v));
const Sh=a=>a.map(x=>[Math.random(),x]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const F=n=>(n<0?'-':'')+(Math.abs(n)>=1e6?'€'+(Math.abs(n)/1e6).toFixed(1)+'M':Math.abs(n)>=1e3?'€'+Math.round(Math.abs(n)/1e3)+'k':'€'+Math.round(Math.abs(n)));
const hash=s=>{let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h};
const DM=[1,.4,.15,.07];                       // multiplicador de salário por divisão
const Z={ap:0,g:0,a:0,rs:0,y1:0,r1:0,mn:0,lg:0};
const SW={ATA:1,PNT:.7,MEI:.45,VOL:.12,ZAG:.1},AW={ATA:.4,PNT:.7,MEI:1,VOL:.35,ZAG:.1};

let S=null;          // estado do jogo
let FXC={};          // cache dos calendários (derivado de S.dv[..].ord)
let RC={};           // cache: id do clube -> rivais que jogam nele

/* ---------- acesso ---------- */
const cl=i=>S.cs[i];
const lg=c=>LEAGUES[c.l];                                   // liga do clube (undefined p/ convidados)
const dvName=c=>c.l<0?'Convidado':LEAGUES[c.l].dn[c.d];
const O=(a=S.at,p=S.p.pos)=>Math.round(a.reduce((s,v,i)=>s+v*PW[p][i],0));
const cap=i=>C(S.p.pot+(PW[S.p.pos][i]>.15?4:PW[S.p.pos][i]<.06?-14:-4),40,99);
const sal=(o,c)=>Math.max(250,Math.round(Math.pow(Math.max(o-40,1),3)*.9*DM[c.d]*(.5+.5*LEAGUES[c.l].q)*(.6+S.rep/100)/10)*10);
const val=()=>Math.max(5e4,Math.pow(Math.max(O()-40,1),3)*700*(S.p.age<23?1+(S.p.pot-O())/50:S.p.age>31?.6:1)*(1+S.rep/200));
const news=t=>{S.nw.unshift({y:S.y,w:S.week,t});S.nw=S.nw.slice(0,40)};
const snap=l=>{S.sn.push({l,at:[...S.at],o:O()});S.peak=Math.max(S.peak,O())};
let RVN={};
const rcBuild=()=>{RC={};RVN={};S.rv.forEach(r=>{(RC[r.club]=RC[r.club]||[]).push(r);RVN[r.n]=r})};
const rvByName=n=>{const r=S.rv.find(x=>x.n==n)||S.hof.find(x=>x.n==n);return r?r.id:null};
const cmpT=(a,b)=>{const x=S.tb[a.id],y=S.tb[b.id];return y.Pt-x.Pt||(y.F-y.A)-(x.F-x.A)||y.F-x.F};
const stand=(l,d)=>S.cs.filter(c=>c.l==l&&c.d==d).sort(cmpT);

/* ---------- calendário (round-robin) ---------- */
const rr=(t,one)=>{let a=[...t],n=a.length,r=[];for(let i=0;i<n-1;i++){const m=[];for(let j=0;j<n/2;j++)m.push([a[j],a[n-1-j]]);r.push(m);a.splice(1,0,a.pop())}return !one&&2*(n-1)<=SEASON?r.concat(r.map(x=>x.map(([h,b])=>[b,h]))):r};   // turno e returno; divisões enormes jogam turno único
const rounds=(l,d)=>FXC[l+'-'+d]||(FXC[l+'-'+d]=rr(S.dv[l+'-'+d].ord,SINGLE[LEAGUES[l].k+d]));
/* rodadas espalhadas pelas SEASON semanas: weeksOf(n)[k] = semana da rodada k */
const WK={};
const weeksOf=n=>WK[n]||(WK[n]=(()=>{const o=[];for(let w=1;w<=SEASON;w++)if(Math.floor(w*n/SEASON)>Math.floor((w-1)*n/SEASON))o.push(w);return o})());
const roundAt=(l,d,w)=>{const R_=rounds(l,d),n=R_.length;return Math.floor(w*n/SEASON)>Math.floor((w-1)*n/SEASON)?R_[Math.floor((w-1)*n/SEASON)]:null};
const pois=l=>{const L=Math.exp(-l);let k=0,p=1;do{k++;p*=Math.random()}while(p>L);return k-1};

/* ---------- mundo ---------- */
/* força dos clubes por divisão: elite da melhor liga ~95, Flamengo ~85 (Brasil q=.8), fim da 1ª divisão ~14 pontos abaixo, séries inferiores mais coladas */
function divRange(l,d){const q=LEAGUES[l].q;let hi=45+50*q,lo=hi-14;const W=[0,7,6,5];for(let i=1;i<=d;i++){hi=lo-1;lo=hi-W[i]}return[hi,lo]}
/* força efetiva no campo: a diferença entre os times é comprimida (a escala 55-95 é de exibição; o jogo reage forte a poucos pontos) */
let FK=.3,FC=72;
const FK_EF=v=>FC+(v-FC)*FK;
function mkClubs(){
  const cs=[];
  LEAGUES.forEach((L,li)=>L.cl.forEach((str,di)=>{
    const [hi,lo]=divRange(li,di);
    str.split(', ').forEach((n,i,arr)=>{const tq=L.k=='BRA'&&BRF[n]!=null?1-BRF[n]:i/(arr.length-1),s=Math.round((hi-(hi-lo)*tq+R(-1,1))*10)/10;
      cs.push({id:cs.length,n,l:li,d:di,s,b:s,hue:hash(n)%360,st:[nm(L.nat),nm(L.nat)]})})}));
  S.ex={eu:[],sa:[]};
  EXT_EU.forEach(([n,s])=>{S.ex.eu.push(cs.length);cs.push({id:cs.length,n,l:-1,d:0,s,b:s,hue:hash(n)%360,st:[nm('Holanda'),nm('Inglaterra')],reg:'EU'})});
  EXT_SA.forEach(([n,s])=>{S.ex.sa.push(cs.length);cs.push({id:cs.length,n,l:-1,d:0,s,b:s,hue:hash(n)%360,st:[nm('Uruguai'),nm('Colômbia')],reg:'SA'})});
  return cs;
}

/* ---------- rivais (candidatos à Bola de Ouro) ---------- */
let RVID=0;
function mkRv(age){
  const pos=P(POSL),nat=P(RNAT),pot=C(Math.round(74+R(0,12)+R(0,10)),66,97);
  const gap=age<=19?R(14,26):age<=21?R(8,16):age<=23?R(3,10):age<=30?R(0,4):age<=33?R(2,8):R(6,12);
  return{id:'r'+(++RVID),n:nm(nat),nat,pos,age,ovr:C(pot-gap,50,97),pot,club:0,ad:[0,0,0,0,0,0].map(()=>RI(-3,3)),inj:0,cur:{ap:0,g:0,a:0,rs:0,lg:0},car:newCar(),h:[]};
}
function pickClub(r){
  const tops=S.cs.filter(c=>c.l>=0&&c.d==0);let tot=0;
  const w=tops.map(c=>{const x=Math.exp(-Math.pow(c.s-(r.ovr-3),2)/60);tot+=x;return x});
  let x=Math.random()*tot;for(let i=0;i<tops.length;i++){x-=w[i];if(x<=0)return tops[i].id}
  return tops[0].id;
}
/* craques reais: saem dos elencos reais (src/squads.js). Os títulos de antes de 2026 vêm de STARS/BDO_REAL; dali em diante vale o jogo */
function realCands(){
  const o=[],seen={};
  if(typeof SQ==='undefined')return o;
  S.cs.forEach(c=>{if(c.l>=0&&SQ[c.n])sqReal(c).forEach(x=>{
    const st=typeof STAR_BY!=='undefined'&&STAR_BY[x.n];
    /* a base tem notas erradas para nomes comuns (ex.: 'Gabriel'): quem não é estrela precisa de nota coerente com o clube */
    if(!st&&(x.ovr>c.s+12||x.ovr<76||c.d>0))return;
    const k=x.n,prev=seen[k];if(prev&&prev.cs>=c.s)return;seen[k]={...x,cs:c.s}
  })});
  return Object.values(seen);
}
function mkRealRv(x){
  const pre=typeof honorsOf==='function'?honorsOf(x.n):[],st=typeof STAR_BY!=='undefined'&&STAR_BY[x.n],car=newCar();
  pre.forEach(h=>{const k=h.k=='lig'?'lg':h.k;if(car[k]!=null)car[k]++});
  car.pod=0;if(st){car.g=st.g;car.ap=st.ap}car.pk=Math.round(x.ovr);
  return{id:'r'+(++RVID),n:x.n,nat:x.nat,pos:x.pos,age:x.age,ovr:x.ovr,pot:Math.max(x.pot||x.ovr,x.ovr),club:x.club,ad:[0,0,0,0,0,0].map(()=>RI(-3,3)),inj:0,cur:{ap:0,g:0,a:0,rs:0,lg:0},car,h:[],pre,real:1};
}
function mkRivals(){
  const rv=[],ca=realCands().sort((a,b)=>((typeof STAR_BY!=='undefined'&&STAR_BY[b.n]?1000:0)+b.ovr)-((typeof STAR_BY!=='undefined'&&STAR_BY[a.n]?1000:0)+a.ovr));
  ca.slice(0,96).forEach(x=>rv.push(mkRealRv(x)));
  for(let i=rv.length;i<96;i++){const age=C(Math.round(17+R(0,9)+R(0,9)),17,36);const r=mkRv(age);r.club=pickClub(r);rv.push(r)}
  S.rv=rv;
}
/* estatísticas da carta (VEL FIN PAS DRI DEF FIS) de um rival */
const rvStats=r=>['VEL','FIN','PAS','DRI','DEF','FIS'].map((l,i)=>[l,C(Math.round(r.ovr+PROF[r.pos][i]+r.ad[i]),25,99)]);

/* ---------- novo jogo ---------- */
function newGame(f){
  const pos=f.pos,w=PW[pos],h=f.h,base=RI(44,54);
  const at=A.map((_,i)=>C(base+(w[i]-.14)*40+RI(-5,5)+(i==5?(h-180)/3:0)+(i==0||i==3?(180-h)/4:0)+(i==4?(h-180)/5:0),25,80));
  S={v:3,p:{name:f.name,nat:f.nat,h,w:f.w,pos,age:16,pot:RI(82,97)},at,cs:null,rv:[],club:0,ct:null,loan:null,cond:100,mor:65,form:6.5,inj:0,rep:5,pop:5,money:0,
     y:2026,week:1,tr:{a:pos=='ZAG'||pos=='VOL'?4:1,i:1},sc:{},hist:[],sn:[],ti:[],aw:[],nw:[],of:[],ev:null,ph:'season',last:[],res:[],peak:0,wm:0,ag:0,
     pc:{lv:1,xp:0,tp:0,perks:{},tr:55},champs:[],bdo:[],bdoPrev:{},cards:[],qU:[],qL:[],dv:{},tb:{},dc:[],ucl:null,lib:null,mc:null,cur:null,sum:null,fin:[],hof:[],lr:{},lrw:0};
  S.cs=mkClubs();mkRivals();rcBuild();
  const li=f.lg,L=LEAGUES[li],d=L.dn.length-1;
  const pool=S.cs.filter(c=>c.l==li&&c.d==d).sort((a,b)=>a.s-b.s).slice(0,8);
  const pk=f.club&&S.cs.find(c=>c.l==li&&c.n==f.club);S.club=pk?pk.id:P(pool).id;S.ct={sal:sal(O(),cl(S.club)),yrs:3,bon:300,cl:2e6};
  pcEnsure();qualifyByStrength();setupSeason();snap('Início');
  news('Você assinou seu primeiro contrato profissional com o '+cl(S.club).n+'.');save();
}
function afterLoad(){FXC={};if(!S.po)S.po=null;rcBuild();pcEnsure();hxEnsure();try{allComps().forEach(k=>{if(!k.dr&&k.ch==null)drawK(k)})}catch(e){}}

/* ---------- temporada ---------- */
function qualifyByStrength(){
  const u=[],b=[];
  LEAGUES.forEach((L,li)=>{const T=S.cs.filter(c=>c.l==li&&c.d==0).sort((a,b)=>b.s-a.s).map(c=>c.id);
    if(UCLQ[L.k])u.push(...T.slice(0,UCLQ[L.k]));if(LIBQ[L.k])b.push(...T.slice(0,LIBQ[L.k]))});
  S.qU=u;S.qL=b;
}
function qualify(){
  const u=[],b=[];
  LEAGUES.forEach((L,li)=>{const T=stand(li,0).map(c=>c.id);
    if(UCLQ[L.k])u.push(...T.slice(0,UCLQ[L.k]));if(LIBQ[L.k])b.push(...T.slice(0,LIBQ[L.k]))});
  S.qU=u;S.qL=b;
}
function mkComp(n,al,rn,wk,k,li,legs){return{n,al:[...al],rd:0,rn,wk,legs:legs||rn.map(()=>1),w2:wk.map((x,i)=>legs&&legs[i]==2?x+1:0),ch:null,ru:null,pl:al.includes(S.club),log:[],k,li}}
function buildComps(){
  S.dc=LEAGUES.map((L,li)=>{
    const by=d=>Sh(S.cs.filter(c=>c.l==li&&c.d==d));
    const top=by(0),mid=by(1),low=L.dn.length>2?by(2).concat(L.dn.length>3?by(3):[]):[];
    let al=[...top.slice(0,10),...mid.slice(0,4),...low.slice(0,2)];
    for(const x of [...top.slice(10),...mid.slice(4)]){if(al.length>=16)break;al.push(x)}
    al=al.map(c=>c.id);
    const my=S.club;if(cl(my).l==li&&!al.includes(my))al[al.length-1]=my;
    return mkComp(L.cup,al,['Oitavas','Quartas','Semifinal','Final'],[5,12,19,26].map(wsc),'dom',li,L.k=='BRA'?[2,2,2,1]:['ESP','ITA','POR'].includes(L.k)?[1,1,2,1]:[1,1,1,1]);
  });
  S.ucl=mkComp('Liga dos Campeões',[...S.qU,...S.ex.eu],['Fase de 32','Oitavas','Quartas','Semifinal','Final'],[3,9,15,22,29].map(wsc),'ucl',undefined,[2,2,2,2,1]);
  S.lib=mkComp('Libertadores',[...S.qL,...S.ex.sa],['Oitavas','Quartas','Semifinal','Final'],[6,13,20,27].map(wsc),'lib',undefined,[2,2,2,1]);
  S.mc=null;[...S.dc,S.ucl,S.lib].forEach(drawK);
}
function setupSeason(){
  FXC={};S.tb={};S.dv={};
  LEAGUES.forEach((L,li)=>L.dn.forEach((_,di)=>{
    const ids=S.cs.filter(c=>c.l==li&&c.d==di).map(c=>c.id);
    S.dv[li+'-'+di]={ord:Sh(ids)};
    ids.forEach(i=>S.tb[i]={P:0,W:0,D:0,L:0,F:0,A:0,Pt:0});
  }));
  buildComps();S.cur={...Z,y:S.y,c:S.club};S.sc={};S.week=1;S.res=[];S.last=[];S.lr={};S.lrw=0;
  S.rv.forEach(r=>{r.cur={ap:0,g:0,a:0,rs:0,lg:0};r.inj=0});
}
const allComps=()=>[...S.dc,S.ucl,S.lib,...(S.mc?[S.mc]:[])];

/* ---------- gols, artilheiros e notas dos rivais ---------- */
function pickScorer(cid,isLg){
  const c=S.cs[cid],rs=RC[cid]||[],cand=[];let tot=0;
  rs.forEach(r=>{const w=SW[r.pos]*Math.pow(r.ovr/75,3)*1.6;cand.push([w,r]);tot+=w});
  cand.push([.9,0],[.5,1],[2.4,-1]);tot+=3.8;
  let x=Math.random()*tot,pk=cand[cand.length-1];
  for(const q of cand){x-=q[0];if(x<=0){pk=q;break}}
  let name,sc=null;
  if(typeof pk[1]=='object'){sc=pk[1];sc.cur.g++;if(isLg)sc.cur.lg++;sc._g=(sc._g||0)+1;name=sc.n}
  else if(pk[1]===-1)name=P(c.st);
  else{name=c.st[pk[1]];if(isLg){const key=cid+'_'+pk[1],e=S.sc[key]||(S.sc[key]={n:name,c:cid,g:0});e.g++}}
  if(rs.length&&Math.random()<.55){
    let tw=0;const ws=rs.filter(r=>r!==sc).map(r=>{const w=AW[r.pos]*Math.pow(r.ovr/75,2);tw+=w;return[w,r]});
    let y=Math.random()*tw;for(const q of ws){y-=q[0];if(y<=0){q[1].cur.a++;q[1]._a=(q[1]._a||0)+1;break}}
  }
  return name;
}
function rateClub(cid,gf,ga){
  const rs=RC[cid];if(!rs)return;const c=S.cs[cid];
  rs.forEach(r=>{
    if(r.inj>0||(!(r._g||r._a)&&Math.random()>.93)){r._g=0;r._a=0;return}
    const x=C(6.15+(r.ovr-c.s)*.022+(gf-ga)*.2+(r._g||0)*.85+(r._a||0)*.5+R(-.55,.55),3.5,10);
    r.cur.ap++;r.cur.rs+=x;r._g=0;r._a=0;
  });
}

/* ---------- partidas ---------- */
const pen=(h,a)=>Math.random()<.5+(cl(h).s-cl(a).s)/150?h:a;
const aiM=(h,a)=>{const x=cl(h).s,y=cl(a).s,k=RNDK();return[pois(1.4*Math.pow(x/y,2.2*k)*1.1),pois(1.2*Math.pow(y/x,2.2*k))]};
function lnp(){
  if(S.inj>0)return null;
  const d=O()-cl(S.club).s+(pcEnsure(),(S.pc.tr-50)/8)+(S.mor-50)/12+(S.form-6.5)*2+(S.cond<45?-8:0)+R(-3,3)+(S.loan?4:0);
  return d>=-5?{s:1}:d>=-12?{s:Math.random()<.5?1:0}:Math.random()<.6?{s:0}:null;
}
const role=()=>{const d=O()-cl(S.club).s+(S.pc?(S.pc.tr-50)/8:0);return S.inj?'Lesionado':d>=-5?'Titular':d>=-12?'Rodízio':'Reserva'};

function pm(h,a,label,knock,kind,ag){
  const me=S.club,my=h==me?0:1,o=cl(my?h:a),mc=cl(me),ov=O(),pos=S.p.pos,pre=(typeof PRE!=='undefined'&&PRE&&PRE.h==h&&PRE.a==a&&PRE.w==S.week)?PRE:null,lu=pre?pre.lu:lnp();
  const r={comp:label,kind,h,a,ev:[],sc:[],g:[0,0],pl:!!lu,gl:0,as:0,yc:0,rc:0,inj:0,mn:0};
  let inn=0,out=0;
  if(lu){inn=lu.s?1:pre?pre.inn:RI(52,78);out=lu.s&&Math.random()<.3?RI(68,90):90}
  const on=m=>lu&&m>=inn&&m<=out,e=(m,t,c='')=>r.ev.push({m,t,c});
  const pf=.7+S.cond/200+(S.form-6.5)/20;
  const sm=mc.s+(lu?(ov-mc.s)*.12*(out-inn+1)/90*pf:0),sh=my?o.s:sm,sa=my?sm:o.s;
  const L=[1.4*Math.pow(sh/sa,2.2*RNDK())*1.1,1.2*Math.pow(sa/sh,2.2*RNDK())];
  const ycm=lu&&Math.random()<(pos=='ZAG'||pos=='VOL'?.2:.1)?RI(inn,out):0;
  const rcm=lu&&Math.random()<.012?RI(inn,out):0;
  const jm=lu&&Math.random()<.014*(1+(100-S.cond)/60)*(1.4-S.at[5]/140)*(1-Math.min(.6,pfx('inj')))*(out-inn+1)/90?RI(inn,out):0;
  const PA=({ATA:1,PNT:.6,MEI:.4,VOL:.12,ZAG:.08})[pos]*Math.pow(S.at[1]/68,2)*(.7+S.cond/200)*(1+pfx('gl'));
  const AA=({ATA:.4,PNT:.7,MEI:1,VOL:.4,ZAG:.1})[pos]*(S.at[2]/70)*(S.at[6]/70)*(1+pfx('ast'));
  const isLg=kind=='lg';
  /* motor de partidas novo (src/ponte.js); se falhar, segue o motor antigo logo abaixo */
  if(typeof pmMotor=='function'&&pmMotor(r,{h,a,my,lu,knock,kind,ag,isLg,inn,pre})){
    const gf=r.g[my],ga=r.g[1-my];
    if(lu&&r.pl){
      const c=S.cur;c.ap++;c.g+=r.gl;c.a+=r.as;c.rs+=r.rt;c.mn+=r.mn;c.y1+=r.yc;c.r1+=r.rc;
      if(isLg)c.lg+=r.gl;
      S.form=S.form*.7+r.rt*.3;S.mor=C(S.mor+(gf>ga?4:gf<ga?-4:0)+(r.rt-6.5)*3,0,100);S.money+=r.gl*S.ct.bon*(1+pfx('bon'));pcXp(Math.max(4,(r.rt-4)*9+r.gl*6+r.as*3)*(1+pfx('xpm'))*(.4+.6*Math.min(1,r.mn/90)));pcTrust((r.rt-6.5)*1.3);
      const k=kind=='ucl'||kind=='lib'?2:1;
      {const dr=(r.gl*.25+r.as*.12+(r.rt-7)*.15)*k;S.rep=C(S.rep+dr*(dr>0?1+pfx('fame'):1),0,100)}S.pop=C(S.pop+r.gl*.3+(r.rt-7)*.12,0,100);
      if(r.inj){const w=Math.random()<.2?RI(6,16):RI(1,4);S.inj=w;r.inj=w;news('🚑 Lesão: fora por '+w+' semana(s).');mail('Departamento médico','Lesão confirmada','Você ficará fora por '+w+' semana(s). Descanso e fisioterapia ajudam na recuperação.')}
    }else{S.mor=C(S.mor-1.5,0,100);if(!S.inj)pcTrust(-.35)}
    S.wm+=r.mn;return r;
  }
  e(0,`Começa o jogo! ${cl(h).n} x ${cl(a).n} — ${label}.`);
  e(0,lu?lu.s?'Você foi escalado como titular.':'Você começa no banco de reservas.':S.inj>0?'Você está lesionado e acompanha de fora.':'O técnico não utilizou você nesta partida.');
  let ok=0,bad=0;
  for(let m=1;m<=90;m++){
    if(lu&&!lu.s&&m==inn)e(m,'Você entra em campo!','ok');
    for(let s=0;s<2;s++)if(Math.random()<L[s]/90){
      r.g[s]++;const cn=cl(s?a:h),sc=` (${r.g[0]} x ${r.g[1]})`;
      if(s==my){
        if(on(m)&&Math.random()<PA/(PA+3.5)){r.gl++;r.sc.push([m,s,S.p.name,0]);e(m,`⚽ GOOOL! Você marca para o ${cn.n}! ${P(['Finalização perfeita!','No canto, sem chances!','Livre na área, você não perdoa!','Meio-chute, a bola morre na rede!'])}${sc}`,'g')}
        else if(on(m)&&Math.random()<AA/(AA+3.5)){r.as++;const n=pickScorer(me,isLg);r.sc.push([m,s,n,1]);e(m,`⚽ Gol do ${cn.n}! Passe decisivo seu, ${n} marca.${sc}`,'g')}
        else{const n=pickScorer(me,isLg);r.sc.push([m,s,n,0]);e(m,`⚽ Gol do ${cn.n}! ${n} marca.${sc}`,'g')}
      }else{const n=pickScorer(cn.id,isLg);r.sc.push([m,s,n,0]);e(m,`⚽ ${cn.n} marca com ${n}.${sc}`,'b')}
    }
    if(on(m)&&Math.random()<.07){
      const d=S.at,ac=[[d[3],'Você deixa o marcador para trás num belo drible.','Você tenta o drible e perde a bola.'],[(d[2]+d[6])/2,'Passe preciso quebra a linha de marcação.','Passe errado entrega a posse.'],[d[0],'Na velocidade, você vence a disputa pela bola.','Você chega atrasado na corrida.'],[d[4],'Desarme limpo: você recupera a bola.','Você erra o tempo da marcação.']];
      const k=pos=='ZAG'||pos=='VOL'?P([3,3,1,2]):P([0,0,1,2,1,3]),w=Math.random()*99<ac[k][0]*.92;
      w?ok++:bad++;e(m,ac[k][w?1:2],w?'ok':'');
    }else if(Math.random()<.04){const s=Math.random()<L[0]/(L[0]+L[1])?0:1;e(m,`${cl(s?a:h).n}: ${P(['chute perigoso passa raspando a trave.','grande defesa do goleiro!','a bola explode na trave!','cabeçada para fora.'])}`)}
    else if(Math.random()<.015)e(m,`🟨 Cartão amarelo para ${P(o.st)}.`,'y');
    if(m==ycm&&on(m)){r.yc=1;e(m,'🟨 Cartão amarelo para você.','y')}
    if(m==rcm&&on(m)){r.rc=1;out=m;e(m,'🟥 Você foi expulso!','b')}
    if(m==jm&&on(m)){r.inj=1;out=m;e(m,'🚑 Você sente a lesão e sai de maca.','b')}
    if(m==45)e(45,`Intervalo: ${r.g[0]} x ${r.g[1]}.`);
  }
  if(knock&&r.g[0]+(ag?ag[0]:0)==r.g[1]+(ag?ag[1]:0)){r.win=pen(h,a);r.pen=1;e(90,`${ag?'Empate no agregado!':'Empate!'} Nos pênaltis, vitória do ${cl(r.win).n}.`)}
  else r.win=r.g[0]>r.g[1]?h:r.g[1]>r.g[0]?a:null;
  e(90,`Fim de jogo: ${cl(h).n} ${r.g[0]} x ${r.g[1]} ${cl(a).n}.`);
  const gf=r.g[my],ga=r.g[1-my];
  r.mn=lu?Math.max(0,out-inn+1):0;
  r.sh=L.map((l,i)=>r.g[i]+Math.round(l*RI(3,6)));r.po=C(Math.round(50+(sh-sa)*.9),30,70);
  rateClub(h,r.g[0],r.g[1]);rateClub(a,r.g[1],r.g[0]);
  if(lu){
    let x=6.2+C((ov-o.s)*.03,-.8,.8)+(S.form-6.5)*.15+(ok-bad)*.1+r.gl*.9+r.as*.55+(gf>ga?.3+pfx('rtw'):gf<ga?-.3:0)+((pos=='ZAG'||pos=='VOL')&&ga==0?.5:0)-(r.rc?2:0)-(r.yc?.2:0)+R(-.35,.35);
    x=6+(x-6)*(.5+.5*Math.min(1,r.mn/90));r.rt=Math.round(C(x,3,10)*10)/10;
    const c=S.cur;c.ap++;c.g+=r.gl;c.a+=r.as;c.rs+=r.rt;c.mn+=r.mn;c.y1+=r.yc;c.r1+=r.rc;
    if(isLg)c.lg+=r.gl;
    S.form=S.form*.7+r.rt*.3;S.mor=C(S.mor+(gf>ga?4:gf<ga?-4:0)+(r.rt-6.5)*3,0,100);S.money+=r.gl*S.ct.bon*(1+pfx('bon'));pcXp(Math.max(4,(r.rt-4)*9+r.gl*6+r.as*3)*(1+pfx('xpm'))*(.4+.6*Math.min(1,r.mn/90)));pcTrust((r.rt-6.5)*1.3);
    const k=kind=='ucl'||kind=='lib'?2:1;
    {const dr=(r.gl*.25+r.as*.12+(r.rt-7)*.15)*k;S.rep=C(S.rep+dr*(dr>0?1+pfx('fame'):1),0,100)}S.pop=C(S.pop+r.gl*.3+(r.rt-7)*.12,0,100);
    if(r.inj){const w=Math.random()<.2?RI(6,16):RI(1,4);S.inj=w;r.inj=w;news('🚑 Lesão: fora por '+w+' semana(s).');mail('Departamento médico','Lesão confirmada','Você ficará fora por '+w+' semana(s). Descanso e fisioterapia ajudam na recuperação.')}
  }else{S.mor=C(S.mor-1.5,0,100);if(!S.inj)pcTrust(-.35)}
  try{mkStats(r,L,my)}catch(x){console.error(x)}
  S.wm+=r.mn;return r;
}

/* ---------- escalação: melhor 11 do elenco numa formação (4-3-3, 4-4-2 ou 4-2-3-1) ---------- */
const FORMS=[['4-3-3',[4,1,2,2,1]],['4-4-2',[4,2,0,2,2]],['4-2-3-1',[4,2,1,2,1]]];
const formOf=cid=>FORMS[hash(cl(cid).n)%3];
function xiOf(cid,incMe){
  const sq=squadOf(cid).filter(x=>incMe||!x.me).slice().sort((a,b)=>b.ovr-a.ovr),out=[],used=new Set();
  const take=(p,k)=>{for(const x of sq){if(k<=0)break;if(x.pos==p&&!used.has(x)){used.add(x);out.push({n:x.n,pos:x.pos,ovr:x.ovr,me:x.me?1:0});k--}}return k};
  take('GOL',1);['ZAG','VOL','MEI','PNT','ATA'].forEach((p,i)=>take(p,formOf(cid)[1][i]));
  for(const x of sq){if(out.length>=11)break;if(!used.has(x)&&x.pos!='GOL'){used.add(x);out.push({n:x.n,pos:x.pos,ovr:x.ovr,me:x.me?1:0})}}
  return out;
}

/* ---------- estatísticas da partida (jogo ao vivo e fim de jogo) ---------- */
function mkStats(r,L,my){
  const g=r.g,sd=[r.h,r.a];
  const sh=[0,1].map(s=>Math.max(g[s],r.sh[s]));
  const sot=[0,1].map(s=>Math.min(sh[s],g[s]+Math.round((sh[s]-g[s])*R(.3,.5))));
  const co=[0,1].map(s=>Math.round(sh[s]*R(.35,.6)));
  const fl=[RI(8,15),RI(8,15)],of=[RI(0,4),RI(0,4)],yc=[0,0],rc=[0,0];
  r.ev.forEach(x=>{if(x.c=='y')yc[x.t.includes('você')?my:1-my]++});
  if(r.rc)rc[my]=1;
  const xg=[0,1].map(s=>Math.round(C(L[s]*R(.8,1.15)+(sot[s]-g[s])*.05,.1,5)*10)/10);
  const pa=[0,1].map(s=>Math.round(C(74+(s==0?r.po-50:50-r.po)*.35+R(-4,4),60,93)));
  const sv=[Math.max(0,sot[1]-g[1]),Math.max(0,sot[0]-g[0])];
  const fe=[],rm=()=>RI(1,90);
  [0,1].forEach(s=>{
    const gm=r.sc.filter(z=>z[1]==s).map(z=>z[0]);
    gm.forEach(m=>fe.push([m,s,'sh'],[m,s,'st']));
    for(let i=gm.length;i<sh[s];i++){const m=rm();fe.push([m,s,'sh']);if(i<sot[s])fe.push([m,s,'st'])}
    for(let i=0;i<co[s];i++)fe.push([rm(),s,'co']);
    for(let i=0;i<fl[s];i++)fe.push([rm(),s,'fl']);
    for(let i=0;i<of[s];i++)fe.push([rm(),s,'of']);
  });
  r.ev.forEach(x=>{if(x.c=='y')fe.push([x.m,x.t.includes('você')?my:1-my,'yc']);if(x.t.includes('expulso'))fe.push([x.m,my,'rc'])});
  fe.sort((a,b)=>a[0]-b[0]);
  const mom=[];let v=(r.po-50)/60;
  for(let i=0;i<18;i++){v=C(v*.6+(r.po-50)/60*.4+R(-.45,.45),-1,1);mom.push(Math.round(v*100)/100)}
  r.sc.forEach(z=>{const b=Math.min(17,Math.floor((Math.max(1,z[0])-1)/5));mom[b]=C(mom[b]+(z[1]==0?.6:-.6),-1,1)});
  const PO={GOL:0,ZAG:1,VOL:2,MEI:3,PNT:4,ATA:5};
  const lineup=s=>xiOf(sd[s],s!=my||r.pl);
  /* quem deu o passe de cada gol (o seu jogador quando z[3]==1; nos demais, sorteado entre os titulares) */
  r.sc.forEach(z=>{
    if(z[4]!==undefined)return;
    if(z[3]==1){z[4]=S.p.name;return}
    const c=lineup(z[1]).filter(p=>p.pos!='GOL'&&!p.me&&p.n!=z[2]);
    z[4]=c.length?c[Math.floor(Math.random()*c.length)].n:'';
  });
  const pr=[0,1].map(s=>{
    const c=cl(sd[s]),rows=lineup(s).map(p=>{
      const gg=r.sc.filter(z=>z[1]==s&&z[2]==p.n).length,aa=p.me?r.as:r.sc.filter(z=>z[1]==s&&z[4]==p.n).length;
      const x=p.me?r.rt:C(6.2+(p.ovr-c.s)*.03+(g[s]>g[1-s]?.35:g[s]<g[1-s]?-.35:0)+((p.pos=='GOL'||p.pos=='ZAG')?(g[1-s]==0?.4:-.1):0)+gg*.95+(p.me?0:aa*.5)+R(-.6,.6),4,10);
      return [p.n,p.pos,p.ovr,gg,aa,Math.round(x*10)/10,p.me?1:0];
    });
    r.sc.filter(z=>z[1]==s&&!rows.some(q=>q[0]==z[2])).forEach(z=>{if(!rows.some(q=>q[0]==z[2])){const gg=r.sc.filter(y=>y[1]==s&&y[2]==z[2]).length;rows.push([z[2],'ATA',Math.round(c.s),gg,0,Math.round(C(6.6+gg*.95+R(-.3,.5),5,10)*10)/10,0])}});
    return rows.sort((a,b)=>b[5]-a[5]||PO[a[1]]-PO[b[1]]).slice(0,6);
  });
  r.st={sh,sot,co,fl,yc,rc,of,xg,pa,sv,mom,fe};r.pr=pr;r.xi=[0,1].map(s=>lineup(s).map(p=>[p.n,p.pos,p.me?1:0]));
}
function aiMatch(h,a,knock,kind,ag){
  const g=aiM(h,a),isLg=kind=='lg';
  for(let i=0;i<g[0];i++)pickScorer(h,isLg);
  for(let i=0;i<g[1];i++)pickScorer(a,isLg);
  rateClub(h,g[0],g[1]);rateClub(a,g[1],g[0]);
  const r={g,h,a,win:g[0]>g[1]?h:g[1]>g[0]?a:null};
  if(knock&&g[0]+(ag?ag[0]:0)==g[1]+(ag?ag[1]:0)){r.win=pen(h,a);r.pen=1}
  return r;
}
function fx(h,a,label,knock,kind,ag){
  if(h==S.club||a==S.club){const r=pm(h,a,label,knock,kind,ag);S.last.push(r);return r}
  return aiMatch(h,a,knock,kind,ag);
}
const up=(h,a,g)=>[[h,0,1],[a,1,0]].forEach(([id,i,j])=>{const t=S.tb[id];t.P++;t.F+=g[i];t.A+=g[j];t.f=((t.f||'')+(g[i]>g[j]?'V':g[i]==g[j]?'E':'D')).slice(-5);if(g[i]>g[j]){t.W++;t.Pt+=3}else if(g[i]==g[j]){t.D++;t.Pt++}else t.L++});

/* troféu do usuário */
function trophy(k,label){
  S.ti.push({y:S.y,t:label||k.n,k:k.k,c:S.club});
  const b={ucl:[8,12],lib:[7,10],dom:[3,4],mc:[4,6]}[k.k]||[2,3];
  S.rep=C(S.rep+b[0],0,100);S.pop=C(S.pop+b[1],0,100);news('🏆 Campeão: '+(label||k.n)+'!');
}
/* sorteio: feito assim que a fase anterior termina (a primeira, ao montar a temporada) */
function drawK(k){
  k.dr=[];if(k.ch!=null||k.rd>=k.rn.length||k.al.length<2)return;
  const a=Sh(k.al);for(let i=0;i+1<a.length;i+=2)k.dr.push([a[i],a[i+1]]);
  const m=k.dr.find(p=>p.includes(S.club));
  if(m&&typeof news=='function')news('🎲 Sorteio — '+k.n+' ('+k.rn[k.rd]+'): '+cl(m[0]).n+' x '+cl(m[1]).n+'.');
}
/* mata-mata: algumas fases têm ida e volta (Champions, Libertadores, Copa do Brasil, semis de algumas copas); a final é jogo único */
const kTwo=k=>!!(k.legs&&k.legs[k.rd]==2);
const kDue=(k,w)=>k.ch==null&&k.rd<k.rn.length&&(kTwo(k)?(k.l1?k.w2[k.rd]==w:k.wk[k.rd]==w):k.wk[k.rd]==w);
const kLegTxt=k=>kTwo(k)?(k.l1?' (volta)':' (ida)'):'';
const kPair=k=>{const m=(k.dr||[]).find(p=>p.includes(S.club));return m?(kTwo(k)&&k.l1?[m[1],m[0]]:m):null};
function ko(k,w){
  if(!k.dr||!k.dr.length)drawK(k);
  const D=k.dr,win=[],last=D.length==1,two=kTwo(k);
  if(two&&!k.l1){      // jogos de ida: o sorteado primeiro joga em casa
    k.l1=[];
    for(const [x,y] of D){const r=fx(x,y,k.n+' — '+k.rn[k.rd]+' (ida)',0,k.k);k.l1.push([r.g[0],r.g[1]]);k.log.push([k.rd,x,y,r.g[0],r.g[1],null,0,1])}
    return;
  }
  D.forEach(([x,y],i)=>{
    if(two){            // volta: o outro time joga em casa; empate no agregado vai aos pênaltis
      const g1=k.l1[i],r=fx(y,x,k.n+' — '+k.rn[k.rd]+' (volta)',1,k.k,[g1[1],g1[0]]),ay=g1[1]+r.g[0],ax=g1[0]+r.g[1];
      if(!r.pen)r.win=ax>ay?x:y;
      r.agg=[ay,ax];win.push(r.win);k.log.push([k.rd,y,x,r.g[0],r.g[1],r.win,r.pen?1:0,2,ay,ax]);
      if(last)k.ru=r.win==x?y:x;
    }else{
      const r=fx(x,y,k.n+' — '+k.rn[k.rd],1,k.k);
      win.push(r.win);k.log.push([k.rd,x,y,r.g[0],r.g[1],r.win,r.pen?1:0]);
      if(last)k.ru=r.win==x?y:x;
    }
  });
  k.al=win;k.rd++;k.l1=null;
  if(win.length==1){k.ch=win[0];k.dr=[];if(win[0]==S.club)trophy(k)}else drawK(k);
}
const KB={bo:['Bola de Ouro','#ffd54a'],lg:['Liga','#3aa0ff'],dom:['Copa','#4cd08a'],ucl:['Champions','#8a8cff'],lib:['Libertadores','#f0a43a'],mc:['Mundial','#e6c25a']};
const kBadge=k=>`<span class="kb" style="--kc:${KB[k][1]}">${KB[k][0]}</span>`;

/* ---------- treino ---------- */
function trn_(){
  const t=S.tr,im=[.6,1,1.6][t.i],ag=S.p.age,aM=ag<20?1.3:ag<25?1:ag<30?.6:.25,c=cl(S.club),ck=1+C((c.s-55)/150,-.1,.25),K=14/SEASON;
  const c0=S.cond,a0=t.a<7?S.at[t.a]:0,fm=C(.8+(S.form-5)*.09,.7,1.3);/* quem vai bem em campo treina melhor */let xp=0,inj='';
  if(S.inj>0){S.inj--;if(t.a==9&&S.inj>0)S.inj--;if(S.inj==0)news('Você está recuperado!');inj='lesionado'}
  else{
    xp=Math.round(40*[.8,1,1.3][t.i]*(t.a==7?.3:1)*(1+pfx('xpw')));pcXp(xp);pcTrust(t.a==7?0:[.1,.25,.5][t.i]);
    if(t.a<7){const cp=cap(t.a),v=S.at[t.a];S.at[t.a]=Math.min(Math.max(cp,v),v+.9*K*im*aM*ck*fm*(1+pfx('tra'))*C((cp-v)/(cp-25),.05,1)*R(.6,1.3)*(S.cond<40?.5:1))}
    else if(t.a==8){S.form=Math.min(10,S.form+.1);S.mor=C(S.mor+1.5,0,100)}
    if(im>1.5&&Math.random()<.014*(1-Math.min(.6,pfx('inj')))*(1+(100-S.cond)/60)){S.inj=RI(1,3);news('🚑 Lesão no treino intenso: fora por '+S.inj+' semana(s).');inj='lesão'}
  }
  S.cond=C(S.cond+18+(t.a==7?16:0)-6*im*(t.a==7?.2:1)+(S.at[5]-60)/20,25,100);
  /* registro: o que o treino da semana realmente rendeu */
  if(!S.trl)S.trl=[];if(!S.trg)S.trg=[0,0,0,0,0,0,0];
  const da=t.a<7?S.at[t.a]-a0:0;if(t.a<7)S.trg[t.a]+=da;
  S.trl.unshift({y:S.y,w:S.week,a:t.a,i:t.i,da:Math.round(da*100)/100,xp,dc:Math.round(S.cond-c0),inj,lv:S.pc.lv});if(S.trl.length>12)S.trl.length=12;
}

/* ---------- semana ---------- */
const winOpen=()=>S.ph=='off'||S.week==MIDW+1||S.week==MIDW+2;
/* semana em duas fases, como num calendário real: meio de semana (copas e Mundial) e fim de semana (liga) */
const WD=['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
const sd0=()=>{const d=new Date(S.y,7,1);while(d.getDay()!=1)d.setDate(d.getDate()+1);return d};
const wkDate=(w,d)=>{const t=sd0();t.setDate(t.getDate()+(w-1)*7+d);return t};
const dfmt=t=>String(t.getDate()).padStart(2,'0')+'/'+String(t.getMonth()+1).padStart(2,'0');
const dTxt=(w,d)=>WD[d]+' '+dfmt(wkDate(w,d));
const lgDay=w=>(S.club*7+w*13)%3==0?6:5;
const kDay=k=>k=='ucl'?1:k=='lib'?3:2;
/* jogos do seu clube que ainda faltam na semana atual, em ordem de dia */
function wkPlan(){
  const w=S.week,c=cl(S.club),g=[];
  if(S.wmid!=w){
    const k=allComps().find(k=>kDue(k,w)&&k.al.includes(S.club));
    if(k){const m=kPair(k);g.push({d:kDay(k.k),ph:'mid',n:k.n+' — '+k.rn[k.rd]+kLegTxt(k),h:m?m[0]:null,a:m?m[1]:null,kk:k.k})}
    else if(w==SEASON&&!S.mc&&S.ucl.ch!=null&&S.lib.ch!=null&&(S.ucl.ch==S.club||S.lib.ch==S.club))g.push({d:2,ph:'mid',n:'Mundial de Clubes — Final',h:S.ucl.ch,a:S.lib.ch,kk:'mc'});
  }
  const rd=roundAt(c.l<0?0:c.l,c.d,w),m=(rd||[]).find(x=>x.includes(S.club));
  g.push({d:lgDay(w),ph:'end',n:rd?'Liga — '+dvName(c):'Semana sem rodada da liga',h:m?m[0]:null,a:m?m[1]:null,kk:'lg'});
  return g.sort((x,y)=>x.d-y.d);
}
function wkBegin(){
  const w=S.week;if(S.wb==w)return;S.wb=w;
  S.last=[];S.wm=0;S.lr={};S.lrw=w;trn_();
  S.rv.forEach(r=>{if(r.inj>0)r.inj--;else if(Math.random()<.004)r.inj=RI(3,14)});
}
function stepMid(){
  if(S.ph!='season'||S.ev||S.apur||S.wmid==S.week)return false;
  wkBegin();const w=S.week;
  allComps().forEach(k=>{if(kDue(k,w))ko(k,w)});
  if(w==SEASON&&S.ucl.ch!=null&&S.lib.ch!=null&&!S.mc){S.mc=mkComp('Mundial de Clubes',[S.ucl.ch,S.lib.ch],['Final'],[SEASON],'mc');drawK(S.mc);ko(S.mc,w)}
  S.wmid=w;return true;
}
function stepEnd(){
  if(S.ph!='season'||S.ev||S.apur)return false;
  stepMid();wkBegin();const w=S.week;
  LEAGUES.forEach((L,li)=>L.dn.forEach((_,di)=>{
    (roundAt(li,di,w)||[]).forEach(([h,a])=>{const r=fx(h,a,'Liga',0,'lg');up(h,a,r.g);(S.lr[li+'-'+di]=S.lr[li+'-'+di]||[]).push([h,a,r.g[0],r.g[1]])});
  }));
  S.cond=C(S.cond-S.wm/90*12*(1-Math.min(.5,pfx('en'))),20,100);S.money+=S.ct.sal*52/SEASON;
  S.last.forEach(r=>{
    S.res.push({w,c:r.comp,t:`${cl(r.h).n} ${r.g[0]} x ${r.g[1]} ${cl(r.a).n}${r.pen?' (pên.)':''}`,rt:r.rt});
    if(r.pl)news(`${r.comp}: ${cl(r.h).n} ${r.g[0]}x${r.g[1]} ${cl(r.a).n}. Nota ${r.rt}${r.gl?' · '+r.gl+' gol(s)':''}.`);
  });
  if(w==MIDW||w==SEASON)snap(S.y+(w==MIDW?'.1':'.2'));
  if(w==MIDW){S.of=gen(3);S.ag=0;if(S.of.length){news('📨 Janela aberta: '+S.of.length+' proposta(s) recebida(s).');mail('Agente','Janela de transferências aberta',S.of.length+' proposta(s) recebida(s). Confira em Jogador → Contratos antes que a janela feche.')}}
  if(w==MIDW+2)S.of=[];
  S.week++;S.day=0;
  if(S.week>SEASON)S.apur=1;else if((S.week==wsc(10)||S.week==wsc(22))&&!S.inj)S.ev=testEv();else if(Math.random()<.11*30/SEASON)S.ev=P(EV);
  return true;
}
/* fim da temporada: a Bola de Ouro é apurada num passo do calendário (soma de títulos e desempenho individual) */
function apurar(){if(!S.apur)return;S.apur=0;end();ui.pg='bdo';ui.bk='bdo';ui.by=null;save();sfx('cup');render()}
const step=()=>stepEnd();
function adv(){if(step()){save();render()}}
/* simula várias semanas; para em evento, janela de transferências ou fim da temporada */
function simN(n){
  let k=0;
  while(k<n&&S.ph=='season'&&!S.ev&&!S.apur){
    const wasOpen=winOpen();step();k++;
    if(!wasOpen&&winOpen()&&S.of.length)break;
  }
  save();render();
}

/* ---------- ofertas ---------- */
function gen(n){
  const ov=O(),v=val(),me=cl(S.club),o=[];
  Sh(S.cs.filter(c=>c.l>=0&&c.id!=S.club)).forEach(c=>{
    if(o.length>=n)return;
    const g=c.s-(ov+S.rep/15);if(g>8||g<-10||Math.random()<.35)return;
    const ln=!S.loan&&c.s<me.s-4&&ov>=c.s-4&&S.p.age<24&&Math.random()<.6,s=sal(ov,c)*R(1,1.35);
    o.push({t:ln?'emp':'perm',club:c.id,sal:Math.round(s/10)*10,yrs:ln?1:RI(2,5),bon:Math.round(s*R(.4,1.2)/10)*10,cl:Math.round(v*R(1.8,3)),fee:Math.round(v*R(.85,1.25))});
  });
  return o;
}
const stint=()=>{if(S.cur){const c=cl(S.cur.c);S.hist.push({...S.cur,l:c.l,d:c.d,o:O(),ag:S.p.age});S.cur=null}};
function acc(i){
  const o=S.of[i];
  if(o.t=='ren'){S.ct={sal:o.sal,yrs:o.yrs,bon:o.bon,cl:o.cl};news('Contrato renovado: '+F(o.sal)+'/semana por '+o.yrs+' ano(s).');S.of.splice(i,1)}
  else if(o.t=='perm'&&o.fee<val()*.95&&Math.random()<.3){news('O '+cl(S.club).n+' recusou vender você por '+F(o.fee)+'.');S.of.splice(i,1)}
  else{
    const had=!!S.cur;stint();
    if(o.t=='emp')S.loan={from:S.loan?S.loan.from:S.club};
    else{S.loan=null;S.ct={sal:o.sal,yrs:o.yrs,bon:o.bon,cl:o.cl};S.mor=C(S.mor+8,0,100)}
    S.club=o.club;if(had)S.cur={...Z,y:S.y,c:o.club};
    news((o.t=='emp'?'Emprestado ao ':'Transferido para o ')+cl(o.club).n+'.');S.of=[];
  }
  save();render();
}
function neg(i){
  const o=S.of[i];if(o.n)return;o.n=1;const c=cl(o.club);
  if(Math.random()<C(.35+(O()+S.rep/10-c.s)*.02+S.pop/400,.1,.85)){o.sal=Math.round(o.sal*1.25/10)*10;o.bon=Math.round(o.bon*1.2);news(c.n+' melhorou a proposta.')}
  else if(Math.random()<.25){S.of.splice(i,1);news(c.n+' retirou a proposta.')}
  else news(c.n+' não cedeu na negociação.');
  save();render();
}
const rej=i=>{S.of.splice(i,1);save();render()};
function agent(){if(S.ag||!winOpen())return;S.ag=1;const g=gen(2);S.of.push(...g);news('O agente procurou clubes: '+g.length+' nova(s) proposta(s).');mail('Agente','Novas propostas',g.length+' clube(s) querem conversar. Veja em Jogador → Contratos.');save();render()}
function pick(i){
  const e=S.ev[2][i][1];let m=e.mon;if(m=='r')m=Math.random()<.5?15:-10;
  S.mor=C(S.mor+(e.mor||0),0,100);S.rep=C(S.rep+(e.rep||0),0,100);S.pop=C(S.pop+(e.pop||0),0,100);S.cond=C(S.cond+(e.cond||0),20,100);S.money+=(m||0)*S.ct.sal;
  news(S.ev[0]+': '+S.ev[2][i][2]);mail(S.ev[0]=='Teste do técnico'?'Técnico':'Imprensa',S.ev[0],S.ev[2][i][2]);if(e.tr)pcTrust(e.tr);if(e.xp)pcXp(e.xp);S.ev=null;save();render();
}

/* ---------- artilharia ---------- */
function scorers(l,d){
  const out=[];
  Object.entries(S.sc).forEach(([k,e])=>{const c=S.cs[e.c];if(c.l==l&&c.d==d&&e.g>0)out.push({n:e.n,c:e.c,g:e.g,q:k.replace('_','.')})});
  S.rv.forEach(r=>{const c=S.cs[r.club];if(c.l==l&&c.d==d&&r.cur.lg>0)out.push({n:r.n,c:r.club,g:r.cur.lg,rv:1,id:r.id})});
  const mc=cl(S.club);if(mc.l==l&&mc.d==d&&S.cur&&S.cur.lg>0)out.push({n:S.p.name,c:S.club,g:S.cur.lg,me:1});
  return out.sort((a,b)=>b.g-a.g);
}

/* ---------- Bola de Ouro ---------- */
const tbOf=(l,d)=>d==0?10+(LEAGUES[l].q-.85)*30:d==1?0:-12-4*(d-2);
function champOf(l,d){return stand(l,d)[0].id}
function clubPts(cid,final){
  const c=S.cs[cid];let p=0;
  if(final&&c.l>=0&&champOf(c.l,c.d)==cid)p+=c.d==0?8:2;
  S.dc.forEach(k=>{if(k.ch==cid)p+=4});
  if(S.ucl.ch==cid)p+=22;else if(S.ucl.ru==cid)p+=6;
  if(S.lib.ch==cid)p+=18;else if(S.lib.ru==cid)p+=5;
  if(S.mc&&S.mc.ch==cid)p+=6;
  return p;
}
const bdoScore=(ap,rs,g,a,ti,ovr,rep,tb)=>((ap?rs/ap:0)-6)*22+g*.7+a*.45+ti+(ovr-70)*.8+tb+rep/8;
/* lista de candidatos (final = fim da temporada; senão parcial projetada) */
function bdoList(final){
  const out=[],proj=final?1:Math.max(1,SEASON/Math.max(1,S.week-1)),minR=final?12:1,minU=final?15:1;
  S.rv.forEach(r=>{
    const x=r.cur;if(x.ap<minR)return;const c=S.cs[r.club];
    const pts=bdoScore(x.ap,x.rs,x.g*proj,x.a*proj,clubPts(r.club,final),r.ovr,C((r.ovr-55)*2.2,0,100),tbOf(c.l,c.d));
    out.push({id:r.id,n:r.n,club:r.club,pos:r.pos,age:r.age,ovr:Math.round(r.ovr),nat:r.nat,pts:pts+(final&&S.wcR?(S.wcR[r.nat]||0):0)+(final?R(-2,2):0),g:x.g,a:x.a});
  });
  const t=tot(true),mc=cl(S.club);
  if(t.ap>=minU){
    const y=S.hist.filter(x=>x.y==S.y).concat(S.cur?[S.cur]:[]);
    const sum=y.reduce((s,x)=>({ap:s.ap+x.ap,g:s.g+x.g,a:s.a+x.a,rs:s.rs+x.rs}),{ap:0,g:0,a:0,rs:0});
    if(sum.ap>=minU){
      const pts=bdoScore(sum.ap,sum.rs,sum.g*proj,sum.a*proj,clubPts(S.club,final),O(),S.rep,tbOf(mc.l,mc.d))+(final?(S.wcMe||0):0);
      out.push({id:'me',n:S.p.name,club:S.club,pos:S.p.pos,age:S.p.age,ovr:O(),nat:S.p.nat,pts,g:sum.g,a:sum.a,me:1});
    }
  }
  return out.sort((a,b)=>b.pts-a.pts);
}
/* totais da carreira (all=true inclui só a temporada em curso se false) */
function tot(season){
  const src=season?S.hist.filter(x=>x.y==S.y).concat(S.cur?[S.cur]:[]):S.hist.concat(S.cur?[S.cur]:[]);
  return src.reduce((s,x)=>({ap:s.ap+x.ap,g:s.g+x.g,a:s.a+x.a,rs:s.rs+x.rs,mn:s.mn+x.mn}),{ap:0,g:0,a:0,rs:0,mn:0});
}

/* ---------- evolução dos rivais ---------- */
function evolveRivals(){
  const keep=[];
  S.rv.forEach(r=>{
    r.age++;const a=r.age;let d;
    if(a<=29){const gap=r.pot-r.ovr;d=Math.min(gap*(a<21?.38:a<24?.3:.22)+R(-.4,.8),gap+.5)}
    else if(a<=32)d=-R(0,1.2);else if(a<=34)d=-R(.6,1.8);else d=-R(1.2,2.6);
    r.ovr=C(r.ovr+d,40,97);r.pot=Math.max(r.pot,Math.round(r.ovr));
    r.cur={ap:0,g:0,a:0,rs:0,lg:0};r.inj=0;
    const ret=a>=37||(a>=34&&Math.random()<.35)||(a>=31&&r.ovr<66&&Math.random()<.5);
    if(!ret)keep.push(r);else hofAdd(r);
  });
  /* reposição: os melhores jovens reais que ainda não são craques; sem sobrar nenhum, nasce um gerado */
  if(keep.length<96){
    const nomes=new Set(keep.map(r=>r.n)),pool=realCands().filter(x=>!nomes.has(x.n)&&x.age<=24).sort((a,b)=>b.pot-a.pot);
    while(keep.length<96&&pool.length)keep.push(mkRealRv(pool.shift()));
  }
  while(keep.length<96){const r=mkRv(RI(17,19));r.club=pickClub(r);keep.push(r)}
  S.rv=keep;
  S.rv.forEach(r=>{if(!r.club||Math.random()<(r.age<=20?.3:.2)*(r.real?.5:1))r.club=pickClub(r)});
  rcBuild();
}

/* ---------- fim de temporada ---------- */
function end(){
  const mc0=cl(S.club),tier=mc0.d,L0=lg(mc0),T0=stand(mc0.l,mc0.d),pos=T0.findIndex(c=>c.id==S.club)+1;
  /* 1) campeões do ano */
  const champ={y:S.y,lg:{},dom:{},ucl:{c:S.ucl.ch,r:S.ucl.ru},lib:{c:S.lib.ch,r:S.lib.ru},mc:S.mc?S.mc.ch:null};
  LEAGUES.forEach((L,li)=>{champ.lg[L.k]=champOf(li,0);champ.dom[L.k]=S.dc[li].ch});
  S.champs.push(champ);
  qualify();                                     // vagas do ano seguinte
  const fin={};LEAGUES.forEach((L,li)=>L.dn.forEach((_,di)=>{fin[li+'-'+di]=stand(li,di).map(c=>c.id)}));
  /* acessos, rebaixamentos e jogos extras (mata-matas, quadrangulares, repescagens) conforme src/formatos.js */
  const MV=fmMoves(fin);S.po={y:S.y,lg:MV.lg,ch:MV.champ};
  const finH={...fin};Object.keys(MV.champ).forEach(k=>{finH[k]=[MV.champ[k],...fin[k].filter(i=>i!=MV.champ[k])]});
  histSeason(finH);
  /* 2) estatísticas do usuário */
  S.hist.push({...S.cur,l:mc0.l,d:mc0.d,pos,o:O(),ag:S.p.age});S.cur=null;
  const ys=S.hist.filter(x=>x.y==S.y).reduce((s,x)=>({ap:s.ap+x.ap,g:s.g+x.g,a:s.a+x.a,rs:s.rs+x.rs,lg:s.lg+x.lg}),{ap:0,g:0,a:0,rs:0,lg:0});
  const avg=ys.ap?ys.rs/ys.ap:0,aw=[],dn=L0.dn[mc0.d];
  const chMe=MV.champ[mc0.l+'-'+mc0.d];
  if(chMe!=null?chMe==S.club:pos==1){S.ti.push({y:S.y,t:dn+' ('+L0.n+')',k:'lig',c:S.club});S.rep=C(S.rep+(tier==0?6:3),0,100);S.pop=C(S.pop+(tier==0?4:2),0,100);news('🏆 '+mc0.n+' é campeão da '+dn+'!')}
  const top=scorers(mc0.l,mc0.d),mx=top.length?top[0].g:0,myG=S.hist.filter(x=>x.y==S.y&&x.c==S.club).reduce((s,x)=>s+x.lg,0);
  if(myG>0&&myG>=mx)aw.push('Artilheiro da '+dn+' ('+myG+' gols)');
  if(ys.ap>=15&&avg>=7.3)aw.push('Craque da '+dn);
  if(S.p.age<=21&&ys.ap>=15&&avg>=7)aw.push('Melhor Jovem da Temporada');
  if(S.y%4==2)worldCup().forEach(t=>aw.push(t));
  /* 3) Bola de Ouro */
  const lst=bdoList(true),idx=lst.findIndex(x=>x.me),rk=idx<0?0:idx+1;
  const topTen=lst.slice(0,10).map((x,i)=>({...x,rank:i+1,prev:S.bdoPrev[x.id]||0}));
  S.bdo.push({y:S.y,top:topTen,me:rk});
  rvSeason(champ,topTen);try{sqSeason(champ)}catch(e){console.error(e)}
  S.wcR=null;S.wcMe=0;
  S.bdoPrev={};lst.slice(0,30).forEach((x,i)=>S.bdoPrev[x.id]=i+1);
  if(rk==1){aw.push('🌟 BOLA DE OURO — Melhor Jogador do Mundo');S.rep=C(S.rep+10,0,100);S.pop=C(S.pop+12,0,100)}
  else if(rk>0&&rk<=3)aw.push('Bola de Ouro: pódio ('+rk+'º lugar)');
  else if(rk>0&&rk<=10)aw.push('Bola de Ouro: '+rk+'º lugar');
  aw.forEach(t=>S.aw.push({y:S.y,t}));
  /* 4) carta da temporada */
  const kind=rk==1?'bo':S.ucl.ch==S.club||S.lib.ch==S.club?'tit':aw.some(x=>x.startsWith('Artilheiro'))?'art':rk>0&&rk<=10?'top':'';
  S.cards.push({y:S.y,ovr:O(),pos:S.p.pos,club:S.club,age:S.p.age,at:[...S.at],kind,ap:ys.ap,g:ys.g,a:ys.a,avg:Math.round(avg*100)/100});
  /* 5) progressão do jogador */
  const pf=ys.ap>5?C((avg-6.5)*.4,-.4,.6):0;S.p.age++;const ag=S.p.age;
  if(ag<24)S.p.pot=C(S.p.pot+(avg>7.2?RI(0,2):avg<6.3&&ys.ap>5?-RI(0,2):0),60,99);
  S.at=S.at.map((v,i)=>{
    const cp=cap(i);let d=0;
    if(ag<=28)d=(cp-v)*(ag<21?.25:ag<25?.17:.07)*R(.7,1.3)+(ag<27?pf*1.5:0);
    if(ag>=29&&i==0)d-=R(.4,1.2)*(ag-27)/3;
    if(ag>=31&&i==5)d-=R(.4,1)*(ag-29)/3;
    if(ag>=33&&i!=0&&i!=5)d-=R(0,.8)*(ag-31)/3;
    return C(v+d,20,Math.max(cp,v));
  });
  snap(S.y+' fim');
  /* 6) promoção / rebaixamento e força dos clubes */
  const up_=MV.up,dn_=MV.dn,dnS=new Set(dn_),mine=[];
  Object.values(MV.lg).forEach(lg=>lg.forEach(t=>{if(!mine.includes(t)&&(t.a==S.club||t.b==S.club))mine.push(t)}));
  mine.forEach(t=>news(`${t.r}: ${cl(t.a).n} x ${cl(t.b).n} (${t.s}) — avança ${cl(t.w).n}.`));
  S.cs.forEach(c=>{
    if(c.l<0){c.s=C(c.s+R(-1.5,1.5)+(c.b-c.s)*.2,66,84);return}
    const f=fin[c.l+'-'+c.d],p=f.indexOf(c.id);
    c.s+=(c.b-c.s)*.12+R(-2,2.4)+(p==0?1.2:dnS.has(c.id)?-1.2:0);c.b+=(c.s-c.b)*.15;
  });
  up_.forEach(id=>S.cs[id].d--);dn_.forEach(id=>S.cs[id].d++);
  S.cs.forEach(c=>{if(c.l<0)return;const[hi,lo]=divRange(c.l,c.d);c.s=Math.round(C(c.s,lo,hi)*10)/10});
  evolveRivals();
  /* 7) contrato, empréstimo, ofertas */
  if(S.loan){S.club=S.loan.from;S.loan=null;news('Fim do empréstimo: você voltou ao '+cl(S.club).n+'.')}
  S.ct.yrs--;S.of=gen(3);S.ag=0;
  const mc1=cl(S.club);
  if(S.ct.yrs<=1)S.of.push({t:'ren',club:S.club,sal:Math.round(sal(O(),mc1)*R(1.05,1.4)/10)*10,yrs:RI(2,4),bon:Math.round(S.ct.bon*R(1,1.5)),cl:Math.round(val()*R(2,3))});
  S.sum={y:S.y,l:mc0.l,d:tier,pos,champ:cl(T0[0].id).n,ap:ys.ap,g:ys.g,a:ys.a,avg,aw,rk,
         move:up_.includes(S.club)?1:dn_.includes(S.club)?-1:0,
         ucl:champ.ucl.c,lib:champ.lib.c,mc:champ.mc,top3:topTen.slice(0,3)};
  S.ph='off';news(`Fim da temporada ${S.y}: ${pos}º lugar na ${dn} (${L0.n}).`);
  mail('Clube',`Balanço da temporada ${S.y}`,`${mc0.n} terminou em ${pos}º na ${dn}. Você fez ${ys.g} gol(s) e ${ys.a} assistência(s) em ${ys.ap} jogo(s), com nota média ${avg.toFixed(2)}.${aw.length?' Prêmios: '+aw.join('; ')+'.':''}${S.of.length?' Há '+S.of.length+' proposta(s) em Jogador → Contratos.':''}`);
  if(S.p.age>=40)rt();
}
function roll(){
  if(S.ph!='off')return;
  S.y++;S.of=[];S.inj=Math.max(0,S.inj-12);S.cond=100;S.mor=C(S.mor+5,0,100);
  if(S.ct.yrs<=0){S.ct.yrs=1;news('Contrato expirado: o clube estendeu por mais 1 ano.')}
  qualifyOK();setupSeason();S.ph='season';save();render();
}
function qualifyOK(){/* vagas já definidas em end(); aqui só garantimos que existem */if(!S.qU.length)qualifyByStrength()}
function rt(){if(S.cur){const c=cl(S.cur.c);S.hist.push({...S.cur,l:c.l,d:c.d,o:O(),ag:S.p.age});S.cur=null}S.ph='ret';save();render()}

/* ---------- save / load / export ---------- */
/* 3 slots de save; o slot 1 mantém a chave antiga 'h10' */
const SLOTK=['h10','h10-1','h10-2'];
let SLOT=0,SAVE_KEY='h10';
const lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
function setSlot(i){SLOT=i;SAVE_KEY=SLOTK[i];lsSet('h10-slot',String(i))}
const save=()=>{try{if(typeof localStorage!='undefined')localStorage.setItem(SAVE_KEY,JSON.stringify(S))}catch(e){}};
function slotInfo(i){
  try{const j=JSON.parse(lsGet(SLOTK[i]));if(!j||j.v!=3||!j.p||!j.cs)return null;
    const c=j.cs[j.club];return{n:j.p.name,y:j.y,age:j.p.age,club:c?c.n:'—',ret:j.ph=='ret',ovr:Math.round(j.at.reduce((s,v)=>s+v,0)/j.at.length)}}catch(e){return null}
}
function loadGame(){
  try{const j=JSON.parse(localStorage.getItem(SAVE_KEY));if(j&&j.v==3){S=j;afterLoad();return true}}catch(e){}
  S=null;return false;
}
/* ---------- opções (valem para todos os saves) e ajustes da carreira ---------- */
const OPT0={snd:1,tema:1,zoom:'m',anim:1,live:1};
let OPT={...OPT0};
function optLoad(){try{OPT={...OPT0,...JSON.parse(lsGet('h10-opt')||'{}')}}catch(e){OPT={...OPT0}}try{const s=+lsGet('h10-slot');if(s>=0&&s<3)setSlot(s)}catch(e){}optApply()}
function optApply(){
  if(typeof document=='undefined')return;
  const b=document.body;if(!b)return;
  b.classList.toggle('noanim',!OPT.anim);b.classList.toggle('zs',OPT.zoom=='s');b.classList.toggle('zl',OPT.zoom=='l');
}
function setOpt(k,v){OPT[k]=v;lsSet('h10-opt',JSON.stringify(OPT));optApply();if(k=='snd'&&v)sfx('click');render(true)}
/* por carreira: aleatoriedade e dificuldade */
const sopt=k=>(S&&S.opt&&S.opt[k])||'normal';
function setSopt(k,v){S.opt=S.opt||{};S.opt[k]=v;save();render(true)}
const RNDK=()=>({baixa:1.3,normal:1,alta:.7})[sopt('rnd')]||1;
const DIFX=()=>{const d=sopt('dif');return d=='facil'?{xpw:.2,xpm:.2,inj:.25,tra:.1}:d=='dificil'?{xpw:-.15,xpm:-.15,inj:-.3,tra:-.08}:{}};
/* sons curtos (WebAudio), sem arquivos */
let _ac=null;
function tone(f,d,t,ty,v){try{_ac=_ac||new(window.AudioContext||window.webkitAudioContext)();const o=_ac.createOscillator(),g=_ac.createGain(),s=_ac.currentTime+t;o.type=ty||'sine';o.frequency.value=f;g.gain.setValueAtTime(0,s);g.gain.linearRampToValueAtTime(v||.07,s+.02);g.gain.exponentialRampToValueAtTime(.0001,s+d);o.connect(g);g.connect(_ac.destination);o.start(s);o.stop(s+d+.05)}catch(e){}}
function sfx(k){
  if(typeof window=='undefined'||!OPT.snd)return;
  if(k=='click')tone(520,.08,0,'triangle',.05);
  else if(k=='win'){tone(523,.14,0);tone(659,.14,.13);tone(784,.3,.26)}
  else if(k=='draw'){tone(440,.15,0);tone(440,.2,.16)}
  else if(k=='lose'){tone(330,.2,0,'sawtooth',.04);tone(247,.35,.18,'sawtooth',.04)}
  else if(k=='cup'){[523,659,784,1047,784,1047].forEach((f,i)=>tone(f,.22,i*.15,'triangle',.08))}
}
function importSave(txt){
  try{const j=JSON.parse(txt);if(!j||j.v!=3||!j.cs||!j.p)throw 0;S=j;afterLoad();save();return true}catch(e){return false}
}

/* ---------- Nível, habilidades e confiança do técnico (portado do BrasLOL) ---------- */
function pcEnsure(){if(!S.mail){S.mail=[];S.mailN=0}if(!S.wc)S.wc=[];if(!S.pc)S.pc={lv:1,xp:0,tp:0,perks:{},tr:55};const p=S.pc;if(!p.perks)p.perks={};if(p.tr==null)p.tr=55;if(p.lv==null){p.lv=1;p.xp=0;p.tp=0}}
const pfx=k=>{pcEnsure();let v=(DIFX()[k])||0;for(const x of PERKS)if(S.pc.perks[x.id]&&x.fx&&x.fx[k])v+=x.fx[k];return v};
function pcXp(n){
  pcEnsure();const p=S.pc;if(p.lv>=PCLV)return;p.xp+=n;
  while(p.lv<PCLV&&p.xp>=pcNeed(p.lv)){p.xp-=pcNeed(p.lv);p.lv++;const g=1+(p.lv%5==0?1:0);p.tp+=g;news('⭐ Nível '+p.lv+'! +'+g+' ponto'+(g>1?'s':'')+' de habilidade.');if(p.lv%5==0)mail('Comissão técnica','Você chegou ao nível '+p.lv,'Você ganhou '+g+' ponto(s) de habilidade. Gaste em Jogador → Habilidades.')}
  if(p.lv>=PCLV)p.xp=0;
}
function pcTrust(d){pcEnsure();const p=S.pc;if(d>0)d*=1+pfx('trp');p.tr=C(Math.round((p.tr+d)*10)/10,0,100)}
function pcPerkSt(x){
  pcEnsure();const p=S.pc;if(p.perks[x.id])return'own';
  const got=x.pa.filter(i=>p.perks[i]).length;
  if(p.lv<x.lv||(x.pa.length&&got<(x.need||1)))return'lock';
  return p.tp>=x.c?'can':'cost';
}
function pcLearn(id){
  pcEnsure();const p=S.pc,d=PERKS.find(x=>x.id==id);if(!d||p.perks[id])return'';
  const st=pcPerkSt(d);
  if(p.lv<d.lv)return d.n+' pede nível '+d.lv+'.';
  if(st=='lock')return d.need?d.n+' pede '+d.need+' das habilidades ligadas.':d.n+' pede uma habilidade ligada antes.';
  if(p.tp<d.c)return d.n+' custa '+d.c+' ponto'+(d.c>1?'s':'')+'.';
  p.tp-=d.c;p.perks[id]=1;
  if(d.at)S.at[d.at[0]]=Math.min(99,S.at[d.at[0]]+d.at[1]);
  news('🌟 Habilidade aprendida: '+d.n+'.');save();return d.n+' aprendida.';
}

/* ---------- Caixa de e-mail, teste do técnico e Copa do Mundo (portado do BrasLOL) ---------- */
function mail(from,sub,body){pcEnsure();S.mail.unshift({id:++S.mailN,y:S.y,w:S.week,from,sub,body,rd:0});if(S.mail.length>80)S.mail.length=80}
function testEv(){
  const d=O()-cl(S.club).s,p=C(.4+d/55+(S.cond-60)/220+(S.pc.tr-50)/300,.1,.88),ok=Math.random()<p;
  return ['Teste do técnico','O técnico monta um teste tático e físico para decidir quem merece a vaga. Como você encara?',[
    ['Dar o máximo ('+Math.round(p*100)+'% de ir bem)',ok?{tr:6,xp:90,cond:-8}:{tr:-3,xp:30,cond:-10},ok?'Você foi muito bem no teste e impressionou o técnico.':'Você se atrapalhou no teste e o técnico não gostou.'],
    ['Jogar pelo seguro',{tr:2,xp:50,cond:-4},'Teste correto, sem grandes brilhos.'],
    ['Pedir dicas ao assistente',{tr:1,xp:40,mor:2},'Você aprendeu com a comissão técnica.']]];
}
const wcNeed=nat=>{const t=WCN.find(x=>x[0]==nat);return t?55+(t[2]-70)*1.1:60};
function worldCup(){
  pcEnsure();const mine=S.p.nat,pos=S.p.pos,aw=[];
  const T=WCN.map(([n,c,s])=>({n,c,s:s+R(-3,3),pt:0,gf:0,ga:0})),my=T.find(t=>t.n==mine);
  const need=wcNeed(mine)+R(-3,3),called=!!my&&S.p.age>=18&&O()>=need-2&&S.inj<=6,starter=called&&O()>=need+3;
  if(called){my.s+=(O()-need)*.4;mail('Federação','Convocação para a Copa do Mundo',(starter?'Você está entre os titulares':'Você foi convocado como opção do banco')+' da seleção '+mine+' para a Copa de '+S.y+'.')}
  const me={called,starter,g:0,a:0,ap:0,stage:0};
  const ps={ATA:.30,PNT:.20,MEI:.11,VOL:.04,ZAG:.03}[pos]*Math.pow(O()/76,2)*(starter?1:.35)*(1+pfx('gl')),as={ATA:.12,PNT:.18,MEI:.26,VOL:.08,ZAG:.03}[pos]*Math.pow(O()/76,2)*(starter?1:.35)*(1+pfx('ast'));
  const play=(a,b,ko)=>{
    const ga=pois(1.25*Math.pow(a.s/b.s,2.4)),gb=pois(1.25*Math.pow(b.s/a.s,2.4));let w=null;
    if(ko&&ga==gb)w=Math.random()<.5+(a.s-b.s)/160?a:b;else w=ga>gb?a:gb>ga?b:null;
    if(called&&(a==my||b==my)){me.ap++;const tg=a==my?ga:gb;for(let i=0;i<tg;i++){const x=Math.random();if(x<Math.min(.6,ps))me.g++;else if(x<Math.min(.6,ps)+Math.min(.4,as))me.a++}}
    return{ga,gb,w};
  };
  /* sorteio: 4 potes de 8 por força */
  const srt=[...T].sort((x,y)=>y.s-x.s),G=[0,1,2,3,4,5,6,7].map(()=>[]);
  for(let p=0;p<4;p++){const pot=Sh(srt.slice(p*8,p*8+8));pot.forEach((t,i)=>G[i].push(t))}
  G.forEach(g=>{for(let i=0;i<4;i++)for(let j=i+1;j<4;j++){const a=g[i],b=g[j],r=play(a,b,false);a.gf+=r.ga;a.ga+=r.gb;b.gf+=r.gb;b.ga+=r.ga;if(r.w===a)a.pt+=3;else if(r.w===b)b.pt+=3;else{a.pt++;b.pt++}}});
  const rk=g=>[...g].sort((x,y)=>y.pt-x.pt||(y.gf-y.ga)-(x.gf-x.ga)||y.gf-x.gf||Math.random()-.5);
  const Q=G.map(rk);let cur=[[0,1],[2,3],[4,5],[6,7],[1,0],[3,2],[5,4],[7,6]].map(([i,j])=>[Q[i][0],Q[j][1]]);
  let rnd=0,myStage=Q.some(g=>g[0]===my||g[1]===my)?1:0,champ=null,ru=null;const sfL=[];
  while(cur.length){
    const nx=[];cur.forEach(([a,b])=>{const r=play(a,b,true);nx.push(r.w);const l=r.w===a?b:a;
      if(cur.length==2)sfL.push(l);
      if(cur.length==1){champ=r.w;ru=l}
      if(r.w===my)myStage=Math.max(myStage,rnd+2);
    });
    rnd++;cur=[];for(let i=0;i<nx.length;i+=2)cur.push([nx[i],nx[i+1]]);
    if(nx.length==1)break;
  }
  const stage=myStage;
  me.stage=stage;
  S.wcR={};S.wcR[champ.n]=7;S.wcR[ru.n]=4;sfL.forEach(t=>S.wcR[t.n]=2);
  S.wcMe=called?(S.wcR[mine]||0)+me.g*.6+me.a*.3:0;
  S.wc.push({y:S.y,champ:champ.n,ru:ru.n,sf:sfL.map(t=>t.n),me,nat:mine});
  if(called){
    S.rep=C(S.rep+[1,2,3,5,8,12][stage],0,100);S.pop=C(S.pop+[1,2,4,6,9,14][stage],0,100);pcXp(60+stage*25);
    if(stage==5){S.ti.push({y:S.y,t:'Copa do Mundo',k:'wc',c:S.club});aw.push('🏆 CAMPEÃO DO MUNDO com '+mine);news('🏆 '+mine+' é campeã do mundo! Você levantou a taça!')}
    else aw.push('Copa do Mundo: '+STG[stage]+' com '+mine);
    if(me.g>=3)aw.push('Destaque da Copa ('+me.g+' gols)');
    mail('Federação','Copa do Mundo '+S.y+': '+STG[stage],'A seleção '+mine+' terminou como '+STG[stage].toLowerCase()+'. Você disputou '+me.ap+' jogo(s), com '+me.g+' gol(s) e '+me.a+' assistência(s). Campeã: '+champ.n+'.');
  }else news('Copa do Mundo '+S.y+': '+champ.n+' é campeã. '+(my?'Você não foi convocado.':''));
  return aw;
}

/* ============================================================
   Histórico, lendas, fichas e elencos
   ============================================================ */
const newCar=()=>({bo:0,pod:0,ucl:0,lib:0,lg:0,mc:0,dom:0,wc:0,g:0,a:0,ap:0,pk:0});
function hxEnsure(){
  if(!S.fin)S.fin=[];if(!S.hof)S.hof=[];if(!S.lr)S.lr={};
  S.rv.forEach(r=>{if(!r.car)r.car=newCar();if(!r.h)r.h=[]});
}
/* até onde cada clube foi numa copa (nº de fases disputadas) */
const reachOf=k=>{const m={};k.log.forEach(x=>{[x[1],x[2]].forEach(id=>{m[id]=Math.max(m[id]||0,x[0]+1)})});return m};
function histSeason(fin){
  const kd={};S.dc.forEach(k=>Object.assign(kd,reachOf(k)));
  S.fin.push({y:S.y,p:fin,k:{u:reachOf(S.ucl),b:reachOf(S.lib),d:kd}});
}
/* histórico dos jogadores de elenco (quem não é craque do mundo): uma linha por temporada, só para quem tem nota 70+ */
const pqKey=x=>x.n+'|'+x.nat;
function sqSeason(champ){
  if(typeof SQ==='undefined')return;
  S.pq=S.pq||{};
  S.cs.forEach(c=>{
    if(c.l<0||!SQ[c.n])return;const L=LEAGUES[c.l],t=[];
    if(c.d==0&&champ.lg[L.k]==c.id)t.push('l');if(champ.dom[L.k]==c.id)t.push('d');
    if(champ.ucl.c==c.id)t.push('u');if(champ.lib.c==c.id)t.push('b');if(champ.mc==c.id)t.push('m');
    sqReal(c).forEach(x=>{
      if(x.ovr<70||(RVN[x.n]&&RVN[x.n].real))return;
      const k=pqKey(x),e=S.pq[k]||(S.pq[k]=[]);e.push([S.y,c.id,x.ovr,t.join('')]);
    });
  });
}
/* carreira dos rivais: títulos (l liga, d copa, u champions, b libertadores, m mundial, w copa do mundo, o bola de ouro) */
function rvSeason(champ,topTen){
  const wcY=S.y%4==2&&S.wc.length?S.wc[S.wc.length-1]:null;
  S.rv.forEach(r=>{
    if(!r.car)r.car=newCar();if(!r.h)r.h=[];
    const c=S.cs[r.club],x=r.cur,t=[],L=c.l>=0?LEAGUES[c.l]:null,ok=x.ap>=8,rk=topTen.findIndex(e=>e.id==r.id)+1;
    if(ok&&L){
      if(c.d==0&&champ.lg[L.k]==r.club){r.car.lg++;t.push('l')}
      if(champ.dom[L.k]==r.club){r.car.dom++;t.push('d')}
      if(champ.ucl.c==r.club){r.car.ucl++;t.push('u')}
      if(champ.lib.c==r.club){r.car.lib++;t.push('b')}
      if(champ.mc==r.club){r.car.mc++;t.push('m')}
    }
    if(wcY&&wcY.champ==r.nat&&r.ovr>=72){r.car.wc++;t.push('w')}
    if(rk==1){r.car.bo++;t.push('o')}else if(rk>0&&rk<=3)r.car.pod++;
    r.car.g+=x.g;r.car.a+=x.a;r.car.ap+=x.ap;r.car.pk=Math.max(r.car.pk,Math.round(r.ovr));
    r.h.push([S.y,r.club,Math.round(r.ovr),x.ap,x.g,x.a,x.ap?Math.round(x.rs/x.ap*100):0,rk,t.join('')]);
  });
}
/* pontuação de lenda: mesma fórmula para lendas reais, rivais simulados e o seu jogador */
const legOf=x=>({n:x.n,nat:natCode(x.nat),pos:x.pos,bo:x.car.bo,wc:x.car.wc,ucl:x.car.ucl,lib:x.car.lib,mc:x.car.mc,lg:x.car.lg,g:x.car.g,ap:x.car.ap,ex:x.car.pod,id:x.id});
function hofAdd(r){
  if(!r.car)return;
  S.hof.push({id:r.id,n:r.n,nat:r.nat,pos:r.pos,ret:S.y,age:r.age,pk:r.car.pk||Math.round(r.ovr),car:r.car,h:r.h||[]});
  if(S.hof.length>80){S.hof.sort((a,b)=>legPts(legOf(b))-legPts(legOf(a)));S.hof.length=80}
}
function myLeg(){
  const t=tot(false),k=z=>S.ti.filter(x=>x.k==z).length;
  return{n:S.p.name,nat:natCode(S.p.nat),pos:S.p.pos,bo:S.aw.filter(x=>x.t.includes('BOLA DE OURO')).length,wc:k('wc'),ucl:k('ucl'),lib:k('lib'),mc:k('mc'),lg:k('lig'),g:t.g,ap:t.ap,
    ex:S.aw.filter(x=>x.t.startsWith('Bola de Ouro: pódio')).length,me:1};
}
function legList(){
  const ativos=new Set(S.rv.map(r=>r.n)),l=[...LEG.filter(x=>!ativos.has(x.n)).map(x=>({...x,st:'lenda'})),...S.hof.map(x=>({...legOf(x),st:'ret'})),...S.rv.map(r=>({...legOf(r),st:'ativo'})),{...myLeg(),st:'me'}];
  l.forEach(x=>{x.pts=legPts(x)});
  return l.sort((a,b)=>b.pts-a.pts);
}
/* ficha de rival: ativo ou aposentado */
function rvAny(id){
  const r=S.rv.find(x=>x.id==id);if(r)return r;
  const h=S.hof.find(x=>x.id==id);if(!h)return null;
  const last=h.h[h.h.length-1];
  return{id:h.id,n:h.n,nat:h.nat,pos:h.pos,age:h.age,ovr:h.pk,pot:h.pk,club:last?last[1]:0,car:h.car,h:h.h,cur:{ap:0,g:0,a:0,rs:0,lg:0},ad:[0,0,0,0,0,0],ret:h.ret};
}
const TKEY={l:'lig',d:'dom',u:'ucl',b:'lib',m:'mc',w:'wc',o:'bo'};
const rvTitles=r=>{const o=(r.pre||[]).map(h=>({k:h.k,y:h.y}));(r.h||[]).forEach(e=>{String(e[8]||'').split('').forEach(k=>{if(TKEY[k])o.push({k:TKEY[k],y:e[0]})})});return o};

/* todos os vencedores da Bola de Ouro: histórico real + simulados */
function bdoAll(){
  const out=BDO_REAL.map(x=>({...x}));
  S.bdo.forEach(b=>{const w=b.top[0];if(w)out.push({y:b.y,n:w.n,nat:natCode(w.nat),c:cl(w.club).n,pos:w.pos,g:1,me:w.me,id:w.id,pts:w.pts})});
  return out;
}

/* títulos de clube: histórico real + simulados */
function clubTitles(cid){
  const c=S.cs[cid],n=c.n,L=c.l>=0?LEAGUES[c.l]:null;
  const ucl=UCL_H.filter(x=>x.c==n).map(x=>x.y),uclV=UCL_H.filter(x=>x.r==n).map(x=>x.y);
  const lib=LIB_H.filter(x=>x.c==n).map(x=>x.y),libV=LIB_H.filter(x=>x.r==n).map(x=>x.y);
  const lg=[],dom=[],mcG=[],low=[];
  S.champs.forEach(h=>{
    if(h.ucl.c==cid)ucl.push(h.y);if(h.ucl.r==cid)uclV.push(h.y);
    if(h.lib.c==cid)lib.push(h.y);if(h.lib.r==cid)libV.push(h.y);
    if(h.mc==cid)mcG.push(h.y);
    if(L){if(h.lg[L.k]==cid)lg.push(h.y);if(h.dom[L.k]==cid)dom.push(h.y)}
  });
  if(L)S.fin.forEach(f=>{for(let d=1;d<L.dn.length;d++){const a=f.p[c.l+'-'+d];if(a&&a[0]==cid)low.push({y:f.y,d})}});
  return{ucl,uclV,lib,libV,mc:(MCH[n]||0)+mcG.length,mcG,lg,dom,low};
}
const cpPts=t=>t.ucl.length*10+t.lib.length*8+t.mc*5+t.lg.length*2+t.dom.length+t.uclV.length*3+t.libV.length*2;
function clubPower(){return S.cs.map(c=>{const t=clubTitles(c.id);return{c,t,pts:cpPts(t)}}).sort((a,b)=>b.pts-a.pts||b.c.s-a.c.s)}
/* nome de clube -> id (para abrir a ficha a partir do histórico) */
const cn2id=n=>{const c=S.cs.find(x=>x.n==n);return c?c.id:null};

/* seleções: campeãs, vices e semifinalistas */
function selStat(n){
  const t=[],v=[],sf=[];
  WC_H.forEach(x=>{if(x.c==n)t.push(x.y);if(x.r==n)v.push(x.y)});
  S.wc.forEach(w=>{if(w.champ==n)t.push(w.y);if(w.ru==n)v.push(w.y);if((w.sf||[]).includes(n))sf.push(w.y)});
  return{t,v,sf,pts:t.length*20+v.length*8+sf.length*3};
}
function selRank(){
  const names=new Set([...WCN.map(x=>x[0]),...WC_H.flatMap(x=>[x.c,x.r])]);
  return[...names].map(n=>{const w=WCN.find(x=>x[0]==n),s=selStat(n);return{n,c:w?w[1]:(SELC[n]||n.slice(0,3).toUpperCase()),s:w?w[2]:0,...s}}).sort((a,b)=>b.pts-a.pts||b.s-a.s);
}

/* ---------- elencos (gerados de forma determinística: nada disso pesa no save) ---------- */
const mulb=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const SQP=['GOL','GOL','GOL','ZAG','ZAG','ZAG','ZAG','ZAG','ZAG','VOL','VOL','VOL','VOL','MEI','MEI','MEI','MEI','PNT','PNT','PNT','ATA','ATA','ATA'];
const nmR=(nat,r)=>{const g=NG[(NATS.find(x=>x[0]==nat)||[0,0,'BR'])[2]];return g.f[Math.floor(r()*g.f.length)]+' '+g.l[Math.floor(r()*g.l.length)]};
function sqGen(c,i){
  const a0=19+Math.floor(mulb(hash(c.n+'|'+i))()*15),dy=Math.max(0,S.y-2026),t=a0-18+dy,g=Math.floor(t/18),age=18+t%18;
  const r=mulb(hash(c.n+'|'+i+'|'+g)),L=c.l>=0?LEAGUES[c.l]:null;
  const nat=!L||r()<.3?RNAT[Math.floor(r()*RNAT.length)]:L.nat;
  const pos=SQP[i],idx=SQP.slice(0,i).filter(p=>p==pos).length;
  const ag=age<21?-(21-age)*2.4:age>31?-(age-31)*1.5:0;
  const ovr=Math.round(C(c.s+[2,-1,-4,-7,-9,-11][idx]+ag+(r()*6-3),35,92));
  const pot=Math.round(C(ovr+(age<24?(24-age)*1.8*(.5+r()):r()*2),ovr,95));
  return{id:c.id+'.'+i,n:nmR(nat,r),nat,pos,age,ovr,pot,club:c.id,slot:i,q:1};
}

/* elencos reais (src/squads.js, dados da ESPN): idade avança com os anos; veteranos se aposentam e viram jovens gerados */
const sqNorm=s=>s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 -]/g,'').trim();
const sqAdj=a=>a<19?-7:a<21?-4:a<24?-1.5:a<=30?0:a<=33?-1.5:-3-(a-34)*1.5;
const SQNAT={BRA:'Brasil',ARG:'Argentina',POR:'Portugal',ESP:'Espanha',FRA:'França',ENG:'Inglaterra',GER:'Alemanha',ITA:'Itália',NED:'Holanda',TUR:'Turquia',URU:'Uruguai',COL:'Colômbia',NGA:'Nigéria',MAR:'Marrocos',JPN:'Japão',USA:'EUA'};
const SQC={};
function sqReal(c){
  const key=c.id+'|'+S.y+'|'+Math.round(c.s);if(SQC[key])return SQC[key];
  const dy=Math.max(0,S.y-2026),L=c.l>=0?LEAGUES[c.l]:null,pool={GOL:[],ZAG:[],VOL:[],MEI:[],PNT:[],ATA:[]};
  SQ[c.n].split(';').forEach((z,i)=>{
    const q=z.split('|'),g=q[1],a0=+q[2]||24,h0=hash(q[0]+c.n),ev=q[4];let n=SQALIAS[q[0]]||q[0],age=a0+dy,nat=SQNAT[q[3]]||q[3],fix=ev&&ev!='y'?+ev:0;
    /* veterano real segue no elenco por mais 1 a 3 anos; só depois se aposenta e entra um garoto da base */
    const lim=Math.max(g=='G'||g=='GK'?40:37,a0+1+h0%3);
    if(age>=lim){const r=mulb(hash(c.n+'|'+i+'|'+age)),nt=L?L.nat:'Brasil';n=nmR(nt,r);nat=nt;age=18+(age-lim)%5;fix=0}
    const h=(hash(n+c.n)%1000)/1000;
    /* notas do EA FC (src/squads.js); sem nota: base/juvenil (50-64) ou, em clubes fora da base, estimativa pela força do clube */
    let ovr=fix?fix+sqAdj(age)-sqAdj(a0):ev=='y'||!fix&&q[4]=='y'?50+14*h+(age>21?-2:0):C(c.s-22+16*h,45,80)+sqAdj(age);
    ovr=Math.round(C(ovr,35,97));const pot=Math.round(C(ovr+(age<24?(24-age)*1.6*(.5+h):h*2),ovr,96));
    const pos=g=='G'||g=='GK'?'GOL':g=='D'||g=='CB'||g=='LB'||g=='RB'?'ZAG':g=='CDM'?'VOL':g=='CM'||g=='CAM'?'MEI':g=='LW'||g=='RW'?'PNT':g=='ST'?'ATA':g=='M'?(h0%5<2?'VOL':'MEI'):(h0%5<2?'PNT':'ATA');
    pool[pos].push({n,nat,pos,fp:g,age,ovr,pot,club:c.id,q:1});
  });
  const LIM={GOL:4,ZAG:9,VOL:5,MEI:5,PNT:4,ATA:5};
  Object.keys(pool).forEach(k=>{pool[k].sort((x,y)=>y.ovr-x.ovr);pool[k]=pool[k].slice(0,LIM[k])});
  const near={GOL:['GOL'],ZAG:['ZAG','VOL'],VOL:['VOL','MEI','ZAG'],MEI:['MEI','VOL','PNT'],PNT:['PNT','ATA','MEI'],ATA:['ATA','PNT','MEI']},out=[];
  SQP.forEach(p=>{let x=null;for(const k of near[p]){if(pool[k].length){x=pool[k].shift();break}}if(!x){const k=Object.keys(pool).find(k=>k!='GOL'&&pool[k].length);x=k?pool[k].shift():null}if(x)out.push(x);else if(out.length>=16)return;else{const r=mulb(hash(c.n+'|f'+out.length));out.push({n:nmR(L?L.nat:'Brasil',r),nat:L?L.nat:'Brasil',pos:p,age:22,ovr:Math.round(c.s-14),pot:Math.round(c.s-10),club:c.id,q:1})}});
  Object.values(pool).forEach(l=>l.forEach(x=>out.push(x)));
  out.forEach((x,i)=>{x.id=c.id+'.'+i;x.slot=i});
  SQC[key]=out;return out;
}
const SQALIAS={'Luka Modric':'Luka Modrić'};
/* busca um jogador real nos elencos do jogo pelo nome (para ligar lendas e Bolas de Ouro a quem ainda joga); minAge evita homônimos jovens */
let SQIX=null,SQIXY=0;
function sqFind(n,minAge){
  if(!SQIX||SQIXY!=S.y){SQIX={};SQIXY=S.y;S.cs.forEach(c=>{if(typeof SQ!=='undefined'&&SQ[c.n])sqReal(c).forEach(x=>{if(x.q&&!SQIX[x.n])SQIX[x.n]=x})})}
  const x=SQIX[n];return x&&x.age>=(minAge||0)?x:null;
}
const sqLen=c=>typeof SQ!=='undefined'&&SQ[c.n]?sqReal(c).length:SQP.length;
function sqPlayer(c,i){return typeof SQ!=='undefined'&&SQ[c.n]?sqReal(c)[i]:sqGen(c,i)}
/* 23 jogadores: os craques do mundo (rivais) e o seu jogador ocupam as vagas das posições deles */
function squadOf(cid){
  const c=S.cs[cid],real=typeof SQ!=='undefined'&&SQ[c.n],base=(real?sqReal(c).map(x=>({...x})):SQP.map((p,i)=>sqPlayer(c,i))),put=[];
  (RC[cid]||[]).forEach(r=>put.push({id:r.id,n:r.n,nat:r.nat,pos:r.pos,age:r.age,ovr:Math.round(r.ovr),pot:r.pot,club:cid,rv:1}));
  if(cid==S.club)put.push({id:'me',n:S.p.name,nat:S.p.nat,pos:S.p.pos,age:S.p.age,ovr:O(),pot:S.p.pot,club:cid,me:1});
  /* craque real: ocupa o lugar dele mesmo no elenco (pelo nome); quem trocou de clube sai do elenco antigo */
  put.forEach(x=>{if(!x.rv)return;const j=base.findIndex(b=>b.n==x.n&&!b.taken);if(j>=0){base[j]={...base[j],...x,fp:base[j].fp,taken:1};x.done=1}});
  for(let j=base.length-1;j>=0;j--){const b=base[j];if(!b.taken&&RVN[b.n]&&RVN[b.n].real&&RVN[b.n].club!=cid)base.splice(j,1)}
  put.forEach(x=>{
    if(x.done)return;
    let k=-1;
    if(real){base.forEach((b,j)=>{if(!b.taken&&b.pos==x.pos&&(k<0||b.ovr<base[k].ovr))k=j});if(k<0)base.forEach((b,j)=>{if(!b.taken&&b.pos!='GOL'&&(k<0||b.ovr<base[k].ovr))k=j})}
    else{k=base.findIndex(b=>b.pos==x.pos&&!b.taken);if(k<0)k=base.findIndex(b=>!b.taken&&b.pos!='GOL')}
    if(k>=0)base[k]={...x,taken:1}
  });
  return base;
}
