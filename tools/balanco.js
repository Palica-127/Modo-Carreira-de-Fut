/* Balanço de quem finaliza e quem assiste: node tools/balanco.js [jogos]   (PAR/CHU como no motor_cal) */
const fs=require('fs'),vm=require('vm');const ctx={};vm.createContext(ctx);
for(const m of ['motor','atrib','chute','regras','tatica','cond','arbitro','narra','posse'])vm.runInContext(fs.readFileSync(__dirname+'/../src/'+m+'.js','utf8').replace(/^'use strict';/,'')+(m=='motor'?';this.MT=MT':''),ctx);
const MT=ctx.MT;
const ov=(a,b)=>{for(const k in b){if(b[k]&&typeof b[k]=='object'&&!Array.isArray(b[k]))ov(a[k],b[k]);else a[k]=b[k]}};
if(process.env.PAR)ov(MT.PAR,JSON.parse(process.env.PAR));if(process.env.CHU)ov(MT.CHUTE,JSON.parse(process.env.CHU));
const org={},N=+process.argv[2]||60,sh={},gl={},as={},xg={};let G=0,A=0,S=0;
const cl=(r,s,p)=>(r.ini[s][p]||{}).cls||'?';
for(let i=1;i<=N;i++){const r=MT.simula(MT.timeTeste(70,'4-3-3','C'+i,i*2),MT.timeTeste(70,'4-3-3','F'+i,i*2+1),i),ev=r.log.ev;
 ev.forEach((e,k)=>{
  if(e.k=='chute'&&e.d.tipo!='penalti'){const c=cl(r,e.s,e.p);sh[c]=(sh[c]||0)+1;xg[c]=(xg[c]||0)+e.d.xg;S++}
  if(e.k=='gol'&&!(e.d&&e.d.anulado)&&!(e.d&&e.d.penalti)){{const c0=ev[k-1];if(c0&&c0.k=='chute'){const o=c0.d.tipo+'/'+c0.d.origem+(ev[k+1]&&ev[k+1].k=='assistencia'?'+A':'');org[o]=(org[o]||0)+1}}const c=cl(r,e.s,e.p);gl[c]=(gl[c]||0)+1;G++;const n=ev[k+1];if(n&&n.k=='assistencia'){const a=cl(r,n.s,n.p);as[a]=(as[a]||0)+1;A++}}})}
const pc=(o,t)=>Object.entries(o).sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+' '+(100*v/t).toFixed(0)+'%').join(' · ');
console.log('chutes/jogo',(S/N).toFixed(1),'| gols (sem pênalti)/jogo',(G/N).toFixed(2),'| assistidos',(100*A/G).toFixed(0)+'%');
console.log('chutes  :',pc(sh,S));console.log('gols    :',pc(gl,G));console.log('assist. :',pc(as,A||1));
console.log('origem dos gols:',pc(org,G));console.log('xG/chute:',Object.keys(xg).map(k=>k+' '+(xg[k]/sh[k]).toFixed(3)).join(' · '));
