const fs=require('fs'),vm=require('vm');
const code=fs.readFileSync('src/data.js','utf8')+'\n'+fs.readFileSync('src/hist.js','utf8')+'\n'+fs.readFileSync('src/engine.js','utf8')+`
function render(){}
function playCareer(opts){
  newGame({name:'Teste',nat:'Brasil',h:180,w:72,pos:opts.pos||'ATA',lg:opts.lg==null?0:opts.lg});
  const rows=[];let t0=Date.now();
  while(S.ph!='ret'&&S.y<2026+24){
    let guard=0;
    while(S.ph=='season'&&guard++<200){ if(S.ev)pick(0); else {
      if(S.week==16||S.week==17){ // aceita melhor oferta
        const best=S.of.map((o,i)=>[cl(o.club).s,i,o]).filter(x=>x[2].t!='emp').sort((a,b)=>b[0]-a[0])[0];
        if(best&&best[0]>cl(S.club).s+4){acc(best[1]);}
      }
      simN(30)} }
    if(S.ph=='off'){
      const m=S.sum,c=cl(S.club);
      rows.push([S.y,S.p.age-1,O(),c.n,dvName(c),m.pos,m.ap,m.g,m.a,m.avg.toFixed(2),m.rk,S.bdo[S.bdo.length-1].top[0].n+' '+Math.round(S.bdo[S.bdo.length-1].top[0].pts)+' / 10º '+Math.round(S.bdo[S.bdo.length-1].top[9].pts)]);
      const best=S.of.map((o,i)=>[cl(o.club).s,i,o]).filter(x=>x[2].t!='emp').sort((a,b)=>b[0]-a[0])[0];
      if(best&&best[0]>cl(S.club).s+3)acc(best[1]);else{const r=S.of.findIndex(o=>o.t=='ren');if(r>=0)acc(r)}
      roll();
    }
  }
  return {rows,ms:Date.now()-t0};
}
`;
vm.runInThisContext(code+`
const res=playCareer({pos:'ATA',lg:0});
console.log('ms',res.ms);
res.rows.forEach(r=>console.log(r.join(' | ')));
console.log('titles',S.ti.map(t=>t.y+' '+t.t).join('; '));
console.log('awards',S.aw.map(t=>t.y+' '+t.t).join('; '));
console.log('size KB',Math.round(JSON.stringify(S).length/1024));
/* ---- histórico, lendas, elencos ---- */
const must=(c,m)=>{if(!c){console.log('FALHOU:',m);process.exitCode=1}};
must(S.fin.length==S.champs.length,'S.fin por temporada');
must(S.rv.every(r=>r.car&&Array.isArray(r.h)),'rivais com carreira');
must(S.hof.length>0,'salão da fama com aposentados');
const lst=legList();must(lst.length>=25&&lst[0].pts>=lst[1].pts,'legList ordenada');
console.log('top5 lendas:',lst.slice(0,5).map(x=>x.n+' '+Math.round(x.pts)+' ('+x.st+')').join(' | '));
const sim=lst.filter(x=>x.st!='lenda'&&x.st!='me').slice(0,3);console.log('melhores simulados:',sim.map(x=>x.n+' '+Math.round(x.pts)+' bo'+x.bo+' ucl'+x.ucl+' lg'+x.lg+' g'+x.g).join(' | '));
const ba=bdoAll();must(ba.length==BDO_REAL.length+S.bdo.length,'bdoAll');must(ba.filter(x=>x.n=='Lionel Messi').length==8,'Messi 8 bolas');
must(UCL_H.length==70&&LIB_H.length==66&&WC_H.length==22,'tamanhos do histórico');
must(UCL_H.filter(x=>x.c=='Real Madrid').length==15,'Real 15 champions');
must(LIB_H.filter(x=>x.c=='Flamengo').length==4,'Flamengo 4 libertadores');
const cp=clubPower();console.log('power top5:',cp.slice(0,5).map(x=>x.c.n+' '+x.pts).join(' | '));
must(cp[0].c.n=='Real Madrid'||cp[0].pts>0,'power ranking');
const sr=selRank();must(sr[0].n=='Brasil'||sr[0].n=='Alemanha'||sr[0].pts>0,'ranking de seleções');console.log('seleções top3:',sr.slice(0,3).map(x=>x.n+' '+x.pts).join(' | '));
const sq=squadOf(S.club);must(sq.length==23&&sq.filter(x=>x.me).length==1,'elenco do meu clube tem 23 e eu');
const sq2=squadOf(cl(S.club).id==0?1:0);must(sq2.length==23,'elenco 23');
const a1=JSON.stringify(squadOf(5).map(x=>x.n)),a2=JSON.stringify(squadOf(5).map(x=>x.n));must(a1==a2,'elenco determinístico');
const rv=S.rv[0];must(rvAny(rv.id)&&rvAny(S.hof[0].id),'rvAny');
console.log('titulos Real:',JSON.stringify({u:clubTitles(S.cs.find(c=>c.n=='Real Madrid').id).ucl.length}));
console.log('save KB final',Math.round(JSON.stringify(S).length/1024));

`);
