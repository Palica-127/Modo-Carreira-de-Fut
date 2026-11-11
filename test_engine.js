const fs=require('fs'),vm=require('vm');
const code=fs.readFileSync('src/data.js','utf8')+'\n'+fs.readFileSync('src/engine.js','utf8')+`
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
`);
