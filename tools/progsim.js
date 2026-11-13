/* Simula a evolução do OVR do jogador (treino + fim de temporada) ao longo de N temporadas.
   Uso (em tools/): node progsim.js [posição] [intensidade 0-2] [temporadas] [liga] */
const {JSDOM}=require('jsdom');const fs=require('fs');
const pos=process.argv[2]||'ATA',inten=+(process.argv[3]??2),N=+(process.argv[4]||6),lg=process.argv[5]||'0';
const html=fs.readFileSync('../pro-football-career.html','utf8').replace(/<link rel="stylesheet"[^>]*>/,'');
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/',beforeParse(w){w.scrollTo=()=>{};w.confirm=()=>true}});
const w=dom.window,ev=c=>w.eval(c);
const out=[];
for(let run=0;run<4;run++){
  ev(`TITLE=null;newGame({name:'T',nat:'Brasil',h:180,w:75,pos:'${pos}',lg:${lg}});ui=UI0()`);
  const row=[ev('O()')];
  for(let s=0;s<N&&ev('S.ph')!='ret';s++){
    let g=0;
    while(ev('S.ph')=='season'&&g++<80){
      ev(`S.tr.i=${inten};S.tr.a=(S.week%6)+0>5?5:(S.week%6)`);
      if(ev('!!S.apur')){ev('apurar()');break}
      if(ev('!!S.ev'))ev('pick(0)');else ev('simN(5)');
    }
    if(ev('S.ph')=='off'){ev(`(function(){const r=S.of.findIndex(o=>o.t=='ren');if(r>=0)acc(r)})()`);ev('roll()')}
    row.push(ev('O()')+'('+ev('S.p.age')+'a,nv'+ev('S.pc.lv')+')');
  }
  out.push(row.join(' → '));
}
console.log(out.join('\n'));
