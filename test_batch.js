const fs=require('fs'),vm=require('vm');
const base=fs.readFileSync('src/data.js','utf8')+'\n'+fs.readFileSync('src/formatos.js','utf8')+'\n'+fs.readFileSync('src/engine.js','utf8')+`
function render(){}
function career(pot,lgi,pos){
  newGame({name:'T',nat:'Brasil',h:180,w:72,pos:pos,lg:lgi});S.p.pot=pot;
  while(S.ph!='ret'&&S.y<2026+24){
    let g=0;
    while(S.ph=='season'&&g++<200){ if(S.ev)pick(0); else {
      if(S.week==16||S.week==17){const b=S.of.map((o,i)=>[cl(o.club).s,i,o]).filter(x=>x[2].t!='emp').sort((a,b)=>b[0]-a[0])[0];if(b&&b[0]>cl(S.club).s+4)acc(b[1])}
      simN(30)}}
    if(S.ph=='off'){const b=S.of.map((o,i)=>[cl(o.club).s,i,o]).filter(x=>x[2].t!='emp').sort((a,b)=>b[0]-a[0])[0];if(b&&b[0]>cl(S.club).s+3)acc(b[1]);else{const r=S.of.findIndex(o=>o.t=='ren');if(r>=0)acc(r)}roll()}
  }
  const bo=S.aw.filter(a=>a.t.includes('BOLA DE OURO')).length,podium=S.bdo.filter(b=>b.me>0&&b.me<=3).length,top10=S.bdo.filter(b=>b.me>0&&b.me<=10).length;
  const ucl=S.ti.filter(t=>t.k=='ucl').length,lib=S.ti.filter(t=>t.k=='lib').length;
  const g=tot(false);
  return {peak:S.peak,bo,podium,top10,ucl,lib,gm:g.g,ap:g.ap,titles:S.ti.length,yrs:S.hist.length,rivTop:S.bdo.map(b=>b.top[0].pts)};
}
`;
vm.runInThisContext(base);
for(const [pot,pos] of [[95,'ATA'],[88,'ATA'],[80,'ATA'],[92,'MEI'],[92,'ZAG'],[85,'VOL']]){
  vm.runInThisContext(`
  var rs=[];for(let i=0;i<12;i++)rs.push(career(${pot},i%10,'${pos}'));
  var avg=k=>(rs.reduce((s,r)=>s+r[k],0)/rs.length).toFixed(2);
  var rtp=rs.flatMap(r=>r.rivTop);
  console.log('pot ${pot} ${pos}','peak',avg('peak'),'BdO',avg('bo'),'podio',avg('podium'),'top10',avg('top10'),'UCL',avg('ucl'),'LIB',avg('lib'),'gols',avg('gm'),'jogos',avg('ap'),'titulos',avg('titles'),'rivalTopPts',(rtp.reduce((a,b)=>a+b,0)/rtp.length).toFixed(0));
  `);
}
