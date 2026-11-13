'use strict';
/* ============================================================
   MOTOR DE PARTIDAS — módulo 1: ATRIBUTOS
   Ficha detalhada de 40 atributos (escala 1–99) para qualquer jogador, gerada de forma
   reproduzível (mesmos dados => mesma ficha) a partir de posição, OVR, idade e nome.
   Sem dependência do estado do jogo (S): recebe tudo por parâmetro.

   - MT.ATTR            lista de atributos {k, n, g}  (g: tec | men | fis | gol)
   - MT.cls(pos, fp)    classe de função: GK CB FB DM CM AM W ST
   - MT.atrib(j)        j = {n, pos, fp?, ovr, age?}  ->  {a:{...}, foot, pf, cls}
   - MT.atribUser(at,j) ficha do SEU jogador: os 7 atributos do jogo mandam nos grupos correspondentes
   - MT.ovrOf(a, cls)   nota geral a partir dos atributos (mesmos pesos da função)
   ============================================================ */
(()=>{
  const ATTR=[
    ['fin','Finalização','tec'],['cab','Cabeceio','tec'],['pas','Passe curto','tec'],['pal','Passe longo','tec'],['cru','Cruzamento','tec'],['dri','Drible','tec'],
    ['pt','Primeiro toque','tec'],['des','Desarme','tec'],['mar','Marcação','tec'],['tec','Técnica','tec'],['fal','Cobrança de faltas','tec'],['pen','Pênaltis','tec'],['esc','Escanteios','tec'],
    ['vis','Visão de jogo','men'],['dec','Decisões','men'],['pos','Posicionamento','men'],['ant','Antecipação','men'],['con','Concentração','men'],['cmp','Compostura','men'],
    ['tre','Trabalho em equipe','men'],['det','Determinação','men'],['cri','Criatividade','men'],['lid','Liderança','men'],['agr','Agressividade','men'],
    ['vel','Velocidade','fis'],['ace','Aceleração','fis'],['for','Força','fis'],['res','Resistência','fis'],['equ','Equilíbrio','fis'],['agi','Agilidade','fis'],['imp','Impulsão','fis'],['cnd','Condição física','fis'],
    ['ref','Reflexos','gol'],['aga','Agarrar','gol'],['gpo','Posicionamento (goleiro)','gol'],['sai','Saídas do gol','gol'],['um1','Um contra um','gol'],['aer','Jogo aéreo','gol'],['rep','Reposição','gol'],['com','Comunicação','gol']
  ].map(([k,n,g])=>({k,n,g}));
  const KEYS=ATTR.map(x=>x.k),GK=ATTR.filter(x=>x.g=='gol').map(x=>x.k),FIELD=KEYS.filter(k=>!GK.includes(k));
  /* bola parada: derivados de outros atributos, fora da nota geral */
  const SET=['fal','pen','esc'];

  /* importância de cada atributo por função (0..1): é o que define a "nota geral" da função */
  const PROF={
    GK:{ref:1,aga:.9,gpo:.9,um1:.7,sai:.6,aer:.6,rep:.4,com:.3,dec:.35,con:.5,cmp:.4,ant:.4,agi:.35,imp:.3,pas:.15,pal:.15},
    CB:{des:1,mar:1,cab:.85,pos:.9,ant:.8,for:.75,imp:.55,con:.6,dec:.5,cmp:.4,agr:.45,pas:.35,pal:.3,vel:.45,ace:.35,equ:.4,res:.4,cnd:.3,tre:.3,det:.3,lid:.25,pt:.15,tec:.15,dri:.08},
    FB:{des:.75,mar:.75,cru:.8,vel:.8,ace:.7,res:.85,cnd:.6,pas:.55,dri:.45,pos:.6,ant:.55,tre:.55,dec:.45,agi:.45,pt:.3,tec:.35,for:.3,cab:.25,vis:.3,con:.35,equ:.35},
    DM:{des:.95,mar:.85,pas:.7,pal:.55,pos:.85,ant:.85,dec:.7,vis:.5,tre:.65,res:.7,cnd:.6,for:.65,agr:.55,con:.6,det:.5,pt:.45,tec:.45,equ:.5,cab:.4,lid:.3},
    CM:{pas:1,pal:.6,vis:.85,dec:.85,tec:.65,pt:.7,des:.5,mar:.4,pos:.6,ant:.55,tre:.75,res:.75,cnd:.6,dri:.5,cri:.45,fin:.3,con:.5,det:.5,agi:.4,equ:.4},
    AM:{pas:.9,vis:1,cri:.95,dri:.85,tec:.85,pt:.8,dec:.8,fin:.6,pal:.5,agi:.65,ace:.55,cmp:.5,ant:.4,pos:.5,tre:.45,equ:.45,vel:.45},
    W:{dri:1,vel:.95,ace:.95,cru:.8,agi:.8,tec:.7,pt:.65,fin:.55,pas:.5,cri:.5,equ:.5,res:.55,cnd:.45,dec:.45,vis:.4,pos:.35,cmp:.35,tre:.3},
    ST:{fin:1,pos:.9,cmp:.75,ant:.6,pt:.65,cab:.6,dri:.5,ace:.65,vel:.6,for:.55,equ:.45,tec:.55,dec:.5,con:.5,imp:.45,det:.4,agi:.4,pas:.3,vis:.3,cri:.3}
  };
  /* base mínima de qualquer jogador de linha: fôlego, cabeça e coordenação sempre pesam um pouco */
  const BASE={res:.25,cnd:.2,tre:.2,det:.25,con:.3,dec:.35,equ:.25,agi:.25,for:.2};
  const WEIGHT=c=>{const p=PROF[c],o={};KEYS.forEach(k=>o[k]=Math.max(p[k]||0,c=='GK'?0:BASE[k]||0));return o};
  const W={};Object.keys(PROF).forEach(c=>W[c]=WEIGHT(c));

  /* função do jogador: posição grossa do jogo (GOL ZAG VOL MEI PNT ATA) + posição fina do elenco real (CB LB RB CDM CM CAM LW RW ST...) */
  function cls(pos,fp){
    const f=String(fp||'').toUpperCase();
    if(f=='GK'||f=='G'||pos=='GOL')return 'GK';
    if(['LB','RB','LWB','RWB'].includes(f))return 'FB';
    if(f=='CB')return 'CB';
    if(f=='CDM')return 'DM';
    if(f=='CAM')return 'AM';
    if(['LW','RW','LM','RM'].includes(f))return 'W';
    if(['ST','CF','F'].includes(f))return pos=='PNT'?'W':'ST';
    if(f=='CM'||f=='M')return pos=='VOL'?'DM':'CM';
    return {ZAG:'CB',VOL:'DM',MEI:'CM',PNT:'W',ATA:'ST'}[pos]||'CM';
  }
  const clamp=(v,a=1,b=99)=>Math.max(a,Math.min(b,v));
  const PHYS_PACE=['vel','ace','agi','imp'],PHYS_END=['res','cnd'],MENTAL_EXP=['dec','vis','pos','ant','con','cmp','lid','tre','det'];

  function ovrOf(a,c){
    const w=W[c];let s=0,t=0;
    for(const k of KEYS){if(w[k]){s+=w[k]*a[k];t+=w[k]}}
    return t?s/t:0;
  }

  /* ficha de um jogador; deterministica em (nome, nação, função, ovr, idade) */
  function atrib(j){
    const c=cls(j.pos,j.fp),w=W[c],ovr=clamp(j.ovr,20,99),age=j.age||25,r=MT.rng('atr|'+j.n+'|'+(j.nat||'')+'|'+c);
    const isGK=c=='GK',a={};
    /* soma w^2 / soma w: nível de referência da função */
    let sw=0,sw2=0;FIELD.concat(isGK?GK:[]).forEach(k=>{sw+=w[k];sw2+=w[k]*w[k]});
    const wbar=sw2/sw;
    /* traços individuais: 2 pontos fortes e 1 fraco entre os atributos que importam */
    const imp=KEYS.filter(k=>w[k]>=.3),forte=[],fraco=[];
    for(let i=0;i<2;i++)forte.push(r.pick(imp));fraco.push(r.pick(imp));
    for(const k of KEYS){
      if(GK.includes(k)&&!isGK){a[k]=Math.round(clamp(r.range(4,13)));continue}
      if(SET.includes(k))continue;
      /* acima da referência da função sobe pouco; abaixo cai bem (quem não é do ofício fica na metade da nota) */
      const up=Math.min(15,(99-ovr)*.9+3);
      let v=(w[k]>=wbar?ovr+up*(w[k]-wbar)/(1-wbar):ovr*(.5+.5*w[k]/wbar))+r.gauss(0,3.2)*(.6+w[k]);
      if(forte.includes(k))v+=r.range(5,10);if(fraco.includes(k))v-=r.range(4,9);
      /* idade: ritmo cai, resistência cai mais tarde, a cabeça melhora com a experiência */
      if(PHYS_PACE.includes(k))v+=age>29?-(age-29)*1.6:age<21?-(21-age)*.5:0;
      if(PHYS_END.includes(k))v+=age>31?-(age-31)*1.2:0;
      if(MENTAL_EXP.includes(k))v+=(clamp(age,18,34)-26)*.7;
      a[k]=clamp(v,5,99);
    }
    /* ajuste: a nota geral da função tem de bater com o OVR (preserva o perfil, desloca tudo igualmente) */
    for(let it=0;it<6;it++){
      const d=ovr-ovrOf(a,c);if(Math.abs(d)<.25)break;
      for(const k of KEYS)if(w[k]>0)a[k]=clamp(a[k]+d*(.5+w[k]),5,99);
    }
    KEYS.forEach(k=>{if(a[k]!=null)a[k]=Math.round(a[k])});
    /* bola parada: nascem da técnica, da compostura e da passada */
    const sp=r.chance(.12)?r.range(8,16):0;
    a.fal=Math.round(clamp(.5*a.tec+.2*a.pal+.15*a.cmp+.15*a.fin+r.gauss(0,6)+sp-(isGK?30:0),5,99));
    a.pen=Math.round(clamp(.45*a.fin+.35*a.cmp+.2*a.tec+r.gauss(0,6)+(r.chance(.1)?10:0)-(isGK?30:0),5,99));
    a.esc=Math.round(clamp(.5*a.cru+.25*a.pal+.25*a.tec+r.gauss(0,6)+(r.chance(.08)?10:0)-(isGK?30:0),5,99));
    /* pé: 76% destro, 22% canhoto, 2% ambidestro; pé fraco 35–80 */
    const u=r.f(),foot=u<.76?'D':u<.98?'E':'A',pf=foot=='A'?Math.round(r.range(78,92)):Math.round(clamp(r.gauss(55,12),30,82));
    return{a,foot,pf,cls:c,ovr:Math.round(ovrOf(a,c))};
  }

  /* o seu jogador: os 7 atributos do jogo [VEL FIN PAS DRI DEF FIS VIS] mandam nos grupos correspondentes */
  const GRUPOS=[['vel','ace'],['fin','pen'],['pas','pal','cru','tec'],['dri','pt','agi'],['des','mar','ant','pos'],['for','res','equ','imp','cnd'],['vis','dec','cri']];
  function atribUser(at,j){
    const f=atrib(j),a={...f.a};
    GRUPOS.forEach((g,i)=>{
      const m=g.reduce((s,k)=>s+a[k],0)/g.length,d=at[i]-m;
      g.forEach(k=>{a[k]=Math.round(clamp(a[k]+d,1,99))});
    });
    return{...f,a,ovr:Math.round(ovrOf(a,f.cls))};
  }

  MT.ATTR=ATTR;MT.ATTR_KEYS=KEYS;MT.cls=cls;MT.atrib=atrib;MT.atribUser=atribUser;MT.ovrOf=ovrOf;MT.ATTR_PROF=PROF;
})();
