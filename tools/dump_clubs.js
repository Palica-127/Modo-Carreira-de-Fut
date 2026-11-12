const fs=require('fs');const src=fs.readFileSync(process.argv[2],'utf8');
const f=new Function(src+';return LEAGUES;');const L=f();const out=[];
L.forEach(l=>l.cl.forEach((s,d)=>s.split(',').map(x=>x.trim()).forEach(n=>out.push({n,lk:l.k,nat:l.nat,d}))));
fs.writeFileSync(process.argv[3],JSON.stringify(out));console.log(out.length);
