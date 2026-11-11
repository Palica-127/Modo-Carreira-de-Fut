'use strict';
/* ============================================================
   HABITE-SE 10 — DADOS
   10 ligas, 26 divisões, 16 clubes por divisão (ordem = força decrescente).
   Elencos e jogadores são fictícios; clubes e divisões são aproximados.
   ============================================================ */
const GAME_NAME='Habite-se 10';
const SEASON=30;                       // rodadas da liga (16 clubes, ida e volta)

const LEAGUES=[
{k:'BRA',n:'Brasil',nat:'Brasil',q:.80,cup:'Copa do Brasil',dn:['Série A','Série B','Série C'],cl:[
'Palmeiras, Flamengo, Botafogo, Atlético Mineiro, Fluminense, Corinthians, São Paulo, Internacional, Grêmio, Cruzeiro, Vasco da Gama, Bahia, Santos, Fortaleza, Athletico Paranaense, Bragantino',
'Sport Recife, Ceará, Vitória, Goiás, Coritiba, Juventude, Mirassol, Vila Nova, Criciúma, Avaí, Chapecoense, Operário-PR, América-MG, Novorizontino, Paysandu, Remo',
'Ponte Preta, Guarani, Botafogo-SP, Náutico, Santa Cruz, Figueirense, CSA, ABC, Confiança, Volta Redonda, Ypiranga, Londrina, Brusque, Ferroviária, Tombense, São Bernardo']},
{k:'ENG',n:'Inglaterra',nat:'Inglaterra',q:1,cup:'FA Cup',dn:['Premier League','Championship','League One','League Two'],cl:[
'Manchester City, Arsenal, Liverpool, Chelsea, Manchester United, Tottenham Hotspur, Newcastle United, Aston Villa, West Ham United, Brighton, Crystal Palace, Brentford, Fulham, Everton, Wolverhampton, Nottingham Forest',
'Leeds United, Leicester City, Sunderland, Southampton, Burnley, Sheffield United, Middlesbrough, Norwich City, West Bromwich, Coventry City, Watford, Stoke City, Swansea City, Bristol City, Hull City, Blackburn Rovers',
'Birmingham City, Wrexham, Bolton Wanderers, Huddersfield Town, Derby County, Stockport County, Wigan Athletic, Peterborough, Reading, Charlton Athletic, Barnsley, Blackpool, Lincoln City, Rotherham United, Plymouth Argyle, Preston North End',
'Notts County, Bradford City, Walsall, Port Vale, Doncaster Rovers, Crewe Alexandra, Swindon Town, Gillingham, AFC Wimbledon, Colchester United, Grimsby Town, Salford City, Chesterfield, Tranmere Rovers, Morecambe, Harrogate Town']},
{k:'ESP',n:'Espanha',nat:'Espanha',q:.97,cup:'Copa del Rey',dn:['La Liga','Segunda División','Primera Federación'],cl:[
'Real Madrid, Barcelona, Atlético de Madrid, Athletic Bilbao, Real Sociedad, Villarreal, Real Betis, Sevilla, Valencia, Girona, Celta de Vigo, Osasuna, Mallorca, Getafe, Rayo Vallecano, Espanyol',
'Deportivo La Coruña, Málaga, Real Zaragoza, Sporting de Gijón, Real Oviedo, Elche, Levante, Granada, Almería, Cádiz, Racing Santander, Eibar, Burgos, Huesca, Albacete, Real Valladolid',
'Racing Ferrol, Córdoba, Castellón, Tenerife, Alcorcón, Mirandés, Cultural Leonesa, Real Murcia, Ponferradina, Sabadell, Hércules, Lugo, Numancia, Gimnàstic, Linares, Arenteiro']},
{k:'ITA',n:'Itália',nat:'Itália',q:.93,cup:'Coppa Italia',dn:['Serie A','Serie B','Serie C'],cl:[
'Inter, Milan, Juventus, Napoli, Atalanta, Roma, Lazio, Fiorentina, Bologna, Torino, Genoa, Udinese, Monza, Lecce, Sassuolo, Cagliari',
'Parma, Como, Venezia, Palermo, Sampdoria, Empoli, Cremonese, Spezia, Bari, Brescia, Pisa, Cesena, Modena, Catanzaro, Reggiana, Salernitana',
'Triestina, Padova, Vicenza, Lecco, Ascoli, Avellino, Benevento, Foggia, Perugia, Pescara, Carrarese, Arezzo, Cosenza, Juve Stabia, Taranto, Rimini']},
{k:'GER',n:'Alemanha',nat:'Alemanha',q:.93,cup:'DFB-Pokal',dn:['Bundesliga','2. Bundesliga','3. Liga'],cl:[
'Bayern München, Bayer Leverkusen, Borussia Dortmund, RB Leipzig, Eintracht Frankfurt, VfB Stuttgart, Wolfsburg, Mönchengladbach, Freiburg, Hoffenheim, Werder Bremen, Union Berlin, Mainz 05, Augsburg, Heidenheim, Köln',
'Hamburger SV, Schalke 04, Hertha BSC, Hannover 96, Fortuna Düsseldorf, Nürnberg, Karlsruher SC, Kaiserslautern, Paderborn, Magdeburg, Elversberg, Greuther Fürth, Darmstadt 98, Holstein Kiel, Braunschweig, Preußen Münster',
'Dynamo Dresden, Arminia Bielefeld, 1860 München, Hansa Rostock, Saarbrücken, Energie Cottbus, Waldhof Mannheim, MSV Duisburg, Erzgebirge Aue, Viktoria Köln, Osnabrück, Wehen Wiesbaden, Ingolstadt, Verl, Jahn Regensburg, Sandhausen']},
{k:'FRA',n:'França',nat:'França',q:.86,cup:'Coupe de France',dn:['Ligue 1','Ligue 2'],cl:[
'Paris Saint-Germain, Monaco, Marseille, Lille, Lyon, Lens, Nice, Rennes, Brest, Reims, Toulouse, Strasbourg, Nantes, Montpellier, Lorient, Auxerre',
'Saint-Étienne, Bordeaux, Metz, Angers, Le Havre, Paris FC, Caen, Guingamp, Rodez, Amiens, Troyes, Pau, Laval, Grenoble, Clermont, Dunkerque']},
{k:'POR',n:'Portugal',nat:'Portugal',q:.80,cup:'Taça de Portugal',dn:['Primeira Liga','Liga 2'],cl:[
'Benfica, Porto, Sporting CP, Braga, Vitória SC, Famalicão, Gil Vicente, Moreirense, Estoril, Casa Pia, Arouca, Rio Ave, Boavista, Santa Clara, Nacional, Farense',
'Marítimo, Vizela, Tondela, Académica, Belenenses, Chaves, Penafiel, Paços de Ferreira, Leixões, Portimonense, Torreense, Feirense, Mafra, Trofense, Oliveirense, Aves']},
{k:'NED',n:'Holanda',nat:'Holanda',q:.78,cup:'KNVB Beker',dn:['Eredivisie','Eerste Divisie'],cl:[
'Ajax, PSV, Feyenoord, AZ Alkmaar, Twente, Utrecht, Sparta Rotterdam, Heerenveen, Go Ahead Eagles, NEC Nijmegen, Fortuna Sittard, Groningen, Heracles, PEC Zwolle, Willem II, RKC Waalwijk',
'Almere City, Vitesse, Roda JC, Cambuur, NAC Breda, Den Bosch, Excelsior, De Graafschap, Dordrecht, VVV-Venlo, ADO Den Haag, Emmen, Helmond Sport, MVV Maastricht, Telstar, Jong Ajax']},
{k:'ARG',n:'Argentina',nat:'Argentina',q:.74,cup:'Copa Argentina',dn:['Liga Profesional','Primera Nacional'],cl:[
'River Plate, Boca Juniors, Racing Club, Independiente, San Lorenzo, Estudiantes, Vélez Sarsfield, Talleres, Lanús, Argentinos Juniors, Rosario Central, Newell\'s Old Boys, Huracán, Defensa y Justicia, Belgrano, Banfield',
'Instituto, Platense, Tigre, Godoy Cruz, Colón, Unión, Gimnasia La Plata, Atlético Tucumán, Quilmes, Chacarita, Almirante Brown, Ferro Carril Oeste, Nueva Chicago, Temperley, Sarmiento, Barracas Central']},
{k:'TUR',n:'Turquia',nat:'Turquia',q:.70,cup:'Türkiye Kupası',dn:['Süper Lig','1. Lig'],cl:[
'Galatasaray, Fenerbahçe, Beşiktaş, Trabzonspor, Başakşehir, Samsunspor, Konyaspor, Antalyaspor, Alanyaspor, Kasımpaşa, Sivasspor, Kayserispor, Rizespor, Gaziantep FK, Eyüpspor, Bodrum FK',
'Bursaspor, Göztepe, Sakaryaspor, Kocaelispor, Boluspor, Ümraniyespor, Pendikspor, Çorum FK, Erzurumspor, Manisa FK, Keçiörengücü, Adanaspor, Altay, Giresunspor, Adana Demirspor, Hatayspor']}
];

/* Clubes convidados: só disputam Champions (EU) e Libertadores (SA) */
const EXT_EU=[['Club Brugge',80],['Celtic',78],['Red Bull Salzburg',77],['Olympiacos',76],['Shakhtar Donetsk',75],['Young Boys',74]];
const EXT_SA=[['Peñarol',77],['Nacional (URU)',76],['Atlético Nacional',75],['Millonarios',73],['Colo-Colo',73],['Olimpia',72],['LDU Quito',71]];

/* Vagas continentais (por posição final na 1ª divisão) */
const UCLQ={ENG:4,ESP:4,ITA:4,GER:4,FRA:3,POR:3,NED:2,TUR:2};
const LIBQ={BRA:5,ARG:4};

/* Nacionalidades: [nome, código, grupo de nomes] */
const NATS=[['Brasil','BRA','BR'],['Argentina','ARG','LA'],['Portugal','POR','BR'],['Espanha','ESP','LA'],['França','FRA','FR'],['Inglaterra','ENG','EN'],['Alemanha','GER','DE'],['Itália','ITA','IT'],['Holanda','NED','NL'],['Turquia','TUR','TR'],['Uruguai','URU','LA'],['Colômbia','COL','LA'],['Nigéria','NGA','AF'],['Marrocos','MAR','AF'],['Japão','JPN','JP'],['EUA','USA','EN']];
const NAT=NATS.map(x=>x[0]);
const natCode=n=>(NATS.find(x=>x[0]==n)||[0,String(n).slice(0,3).toUpperCase()])[1];
/* Nacionalidades dos rivais (com peso por repetição) */
const RNAT=['Brasil','Brasil','Brasil','Brasil','Argentina','Argentina','França','França','França','Inglaterra','Inglaterra','Inglaterra','Espanha','Espanha','Alemanha','Alemanha','Portugal','Portugal','Itália','Itália','Holanda','Turquia','Uruguai','Colômbia','Nigéria','Marrocos','Japão','EUA'];

const NG={
BR:{f:['Lucas','Mateus','Rafael','Bruno','Tiago','Gabriel','Pedro','Felipe','Caio','Davi','Iago','Kauã','Murilo','Vitor','Enzo','Yuri','Thiago','Léo','Ruan','Dudu'],l:['Silva','Costa','Rocha','Moreira','Santos','Lima','Duarte','Ferreira','Barros','Cardoso','Nogueira','Araújo','Teixeira','Pinheiro','Macedo','Furtado','Brito','Campos','Faria','Salgado']},
LA:{f:['Diego','Mateo','Santiago','Joaquín','Emiliano','Nicolás','Tomás','Franco','Julián','Ezequiel','Bruno','Facundo','Matías','Agustín','Sebastián'],l:['Fernández','Vega','Ferrer','Ortega','Molina','Rivas','Herrera','Domínguez','Navarro','Peralta','Cabrera','Salas','Ibáñez','Quiroga','Benítez','Aguirre']},
EN:{f:['Jack','Harry','Oliver','Callum','Mason','Reece','Jordan','Connor','Declan','Tyler','Logan','Elliot'],l:['Wright','Hughes','Baxter','Holloway','Whitaker','Ellis','Pearce','Thornton','Hartley','Coleman','Griffin','Marlow']},
FR:{f:['Hugo','Théo','Maxime','Antoine','Rayan','Yanis','Mathis','Noé','Axel','Enzo','Nolan','Lilian'],l:['Moreau','Lefèvre','Garnier','Dubois','Roche','Marchand','Perrin','Bouvier','Colin','Lacroix','Fontaine','Girard']},
DE:{f:['Lukas','Jonas','Felix','Niklas','Leon','Jannik','Tim','Moritz','Finn','Kai','Paul','Elias'],l:['Becker','Hoffmann','Krüger','Wagner','Brandt','Lehmann','Vogel','Keller','Sauer','Hartmann','Engel','Weiß']},
IT:{f:['Matteo','Lorenzo','Alessio','Federico','Riccardo','Gianluca','Nicolò','Samuele','Christian','Davide','Andrea'],l:['Rossi','Ferrari','Bianchi','Conti','Greco','Marino','Caruso','Moretti','Fabbri','De Luca','Santoro','Ricci']},
NL:{f:['Daan','Sven','Jesse','Bram','Joris','Luuk','Teun','Milan','Ruben','Niels','Thijs'],l:['van Leeuwen','de Boer','Bakker','Visser','Smit','Mulder','Kuipers','Hendriks','Dekker','Jacobs','Bosman']},
TR:{f:['Emre','Kerem','Burak','Mert','Arda','Yusuf','Hakan','Cem','Deniz','Barış','Kaan'],l:['Yılmaz','Kaya','Demir','Çelik','Aydın','Şahin','Öztürk','Arslan','Koç','Polat','Erdem']},
AF:{f:['Chidi','Emeka','Kelechi','Ayo','Tunde','Youssef','Amine','Hamza','Ismael','Karim','Ousmane'],l:['Okoye','Adeyemi','Balogun','Nwosu','Eze','El Idrissi','Bennani','Haddad','Mbaye','Diallo','Okafor']},
JP:{f:['Kaito','Haruto','Ren','Sora','Takumi','Daiki','Riku','Shota','Yuto','Hinata'],l:['Tanaka','Sato','Mori','Kimura','Hayashi','Ogawa','Fujita','Nakamura','Ishii','Matsuda']}
};
const nm=nat=>{const g=NG[(NATS.find(x=>x[0]==nat)||[0,0,'BR'])[2]];return g.f[Math.floor(Math.random()*g.f.length)]+' '+g.l[Math.floor(Math.random()*g.l.length)]};

/* Atributos e posições */
const A=['Velocidade','Finalização','Passe','Drible','Defesa','Físico','Visão de jogo'];
const TN=[...A,'Descanso ativo','Treino tático','Fisioterapia'];
const PW={ATA:[.2,.35,.08,.15,0,.12,.1],PNT:[.3,.18,.12,.25,0,.05,.1],MEI:[.1,.15,.25,.18,.05,.07,.2],VOL:[.07,.04,.22,.1,.28,.17,.12],ZAG:[.1,0,.1,.04,.4,.3,.06]};
const PN={ATA:'Atacante',PNT:'Ponta',MEI:'Meia',VOL:'Volante',ZAG:'Zagueiro'};
const POSL=['ATA','ATA','ATA','PNT','PNT','MEI','MEI','MEI','VOL','VOL','ZAG','ZAG','ZAG'];
/* perfil das 6 estatísticas da carta (VEL FIN PAS DRI DEF FIS) por posição, em relação ao OVR */
const PROF={ATA:[2,5,-8,1,-32,-2],PNT:[6,1,-4,6,-34,-8],MEI:[-2,-2,5,3,-14,-6],VOL:[-4,-14,2,-4,8,3],ZAG:[-4,-34,-8,-14,7,8]};

/* Eventos de vestiário e mídia: [título, texto, [[opção, efeitos, resultado]]] */
const EV=[
['Entrevista pós-jogo','Um repórter pergunta se você sonha em deixar o clube.',[['“Estou focado no meu clube.”',{mor:3,rep:1},'A torcida adorou sua humildade.'],['“Sonho em jogar num gigante.”',{pop:3,mor:-3,rep:1},'A declaração rendeu manchetes e críticas.'],['“Sem comentários.”',{},'Você evitou polêmica.']]],
['Polêmica nas redes','Uma publicação antiga sua viralizou e está sendo criticada.',[['Apagar e ficar em silêncio',{pop:-1,mor:-2},'O assunto esfriou rápido.'],['Pedir desculpas publicamente',{rep:2,pop:1},'O público valorizou a maturidade.'],['Rebater os críticos',{pop:3,rep:-3,mor:2},'Mais engajamento, mas a imagem arranhou.']]],
['Proposta de patrocínio','Uma marca esportiva quer você como garoto-propaganda.',[['Aceitar o contrato',{mon:12,pop:3,cond:-5},'Dinheiro novo e agenda cheia.'],['Recusar e focar no futebol',{mor:3,rep:1},'O técnico elogiou seu foco.']]],
['Festa de aniversário','Amigos convidam você para uma festa na véspera do treino.',[['Ir à festa',{mor:8,cond:-12,rep:-1},'Você se divertiu, mas acordou cansado.'],['Ficar em casa descansando',{cond:6,mor:-1},'Você poupou energia.']]],
['Ação social','O clube convida você para visitar um hospital infantil.',[['Participar com entusiasmo',{rep:3,pop:4,mor:3},'A imprensa elogiou a iniciativa.'],['Declinar por agenda',{},'Nada mudou.']]],
['Conflito com o treinador','O técnico criticou publicamente sua postura tática.',[['Aceitar a crítica e treinar mais',{mor:-2,cond:-3,rep:1},'O técnico passou a confiar mais em você.'],['Responder à imprensa',{mor:4,rep:-3,pop:2},'O clima no vestiário ficou tenso.']]],
['Investimento','Um empresário propõe um negócio com seu dinheiro.',[['Investir parte do patrimônio',{mon:'r'},'O resultado do negócio saiu.'],['Recusar',{},'Melhor prevenir do que remediar.']]],
['Rival provoca','Um adversário provocou você na imprensa antes do clássico.',[['Responder em campo',{mor:5,rep:1},'Você está motivado para o próximo jogo.'],['Ignorar',{mor:1},'Você manteve a classe.']]],
['Fã-clube na porta','Centenas de torcedores esperam você na saída do treino.',[['Tirar fotos e autografar',{pop:4,cond:-4,mor:3},'Os torcedores foram embora felizes.'],['Sair pelos fundos',{cond:2},'Ninguém ficou sabendo.']]],
['Documentário','Uma plataforma quer gravar um documentário sobre sua carreira.',[['Aceitar e abrir a rotina',{rep:3,pop:5,mon:8,cond:-6},'O projeto virou assunto nacional.'],['Recusar, quer privacidade',{mor:2},'Você manteve a vida tranquila.']]],
['Clássico decisivo','A semana do clássico mexeu com o clube inteiro.',[['Assumir a responsabilidade',{mor:4,rep:2,cond:-5},'Você pediu a bola e a torcida notou.'],['Seguir a rotina normal',{mor:1},'Tudo dentro do planejado.']]],
['Conselho do capitão','O capitão do time chama você para uma conversa sobre o futuro.',[['Ouvir e agradecer',{mor:3,rep:1},'Você ganhou a confiança do vestiário.'],['Dizer que prefere o seu caminho',{pop:2,mor:-2},'A conversa ficou meio fria.']]]
];
