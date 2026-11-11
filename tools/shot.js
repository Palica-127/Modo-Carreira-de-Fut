const {JSDOM}=require('./node_modules/jsdom');const fs=require('fs');
const club=process.argv[2]||'Flamengo';
const d=new JSDOM(fs.readFileSync('../pro-football-career.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/'});
const w=d.window;w.scrollTo=()=>{};
w.eval(`newGame({name:'Lucas Silva',pos:'ATA',nat:'Brasil',h:180,w:75,lg:0});S.club=S.cs.findIndex(c=>c.n=='${club}');`);
const pages=[['car','car'],['rk','rk'],['lg','lg'],['pf','pf']];
w.eval(`for(let i=0;i<8;i++){try{adv()}catch(e){}}`);
for(const [pg,n] of pages){w.eval(`ui.pg='${pg}';ui.rk='leg';ui.pf='cartas';render()`);
 const html=fs.readFileSync('../pro-football-career.html','utf8').replace(/<body[\s\S]*<\/html>/,'<body><style>*{animation:none!important;transition:none!important}</style><div id="app">'+w.document.getElementById('app').innerHTML+'</div></body></html>').replace(/<script[\s\S]*?<\/script>/g,'');
 const st=w.document.documentElement.getAttribute('style')||'';
 fs.writeFileSync(`../shots/n_${n}.html`,html.replace('<html','<html style="'+st+'"'));}
console.log('ok');
