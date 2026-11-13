'use strict';
/* ============================================================
   HABITE-SE 10 — DADOS
   10 ligas, 26 divisões, 16 clubes por divisão (ordem = força decrescente).
   Elencos e jogadores são fictícios; clubes e divisões são aproximados.
   ============================================================ */
const GAME_NAME='Habite-se 10';
const SEASON=46;                       // semanas da temporada (a Championship tem 46 rodadas)
const MIDW=23;                         // meio da temporada: abre a janela de transferências
const wsc=x=>Math.max(1,Math.round(x*SEASON/30)); // escala semanas do calendário antigo (30) para SEASON

const LEAGUES=[
{k:'BRA',n:'Brasil',nat:'Brasil',q:0.8,cup:'Copa do Brasil',dn:['Série A','Série B','Série C'],cl:[
'Palmeiras, Flamengo, Fluminense, Atlético Mineiro, Botafogo, Cruzeiro, São Paulo, Corinthians, Bahia, Internacional, Athletico Paranaense, Santos, Vasco da Gama, Grêmio, Bragantino, Coritiba, Vitória, Mirassol, Chapecoense, Remo',
'Fortaleza, Sport Recife, Juventude, Goiás, Vila Nova, Criciúma, Ceará, CRB, Novorizontino, Atlético Goianiense, Operário-PR, Avaí, Botafogo-SP, Cuiabá, Athletic, Ponte Preta, Náutico, São Bernardo, Londrina, América Mineiro',
'América-MG, Paysandu, Guarani, Santa Cruz, Figueirense, CSA, ABC, Confiança, Volta Redonda, Ypiranga, Brusque, Ferroviária, Tombense, Botafogo-PB, Floresta, Caxias, Inter de Limeira, Amazonas, Maranhão, Anápolis']},
{k:'ENG',n:'Inglaterra',nat:'Inglaterra',q:1,cup:'FA Cup',dn:['Premier League','Championship','League One','League Two'],cl:[
'Manchester City, Arsenal, Liverpool, Chelsea, Brighton, Tottenham Hotspur, Newcastle United, Aston Villa, AFC Bournemouth, Manchester United, Brentford, Everton, Fulham, Leeds United, Crystal Palace, Nottingham Forest, Ipswich Town, Hull City, Sunderland, Coventry City',
'Wolverhampton, West Ham United, Southampton, Middlesbrough, Sheffield United, West Bromwich, Stoke City, Norwich City, Swansea City, Burnley, Queens Park Rangers, Birmingham City, Portsmouth, Watford, Blackburn Rovers, Bristol City, Cardiff City, Wrexham, Bolton Wanderers, Millwall, Charlton Athletic, Derby County, Lincoln City, Preston North End',
'Huddersfield Town, Stockport County, Leicester City, Oxford United, Luton Town, Reading, Cambridge United, Wigan Athletic, Sheffield Wednesday, Plymouth Argyle, Peterborough, Mansfield Town, Milton Keynes Dons, Bradford City, Wycombe Wanderers, Blackpool, Barnsley, Leyton Orient, Burton Albion, Notts County, Stevenage, Doncaster Rovers, AFC Wimbledon, Bromley',
'Walsall, Barnet, Crewe Alexandra, Cheltenham Town, Rotherham United, York City, Port Vale, Gillingham, Swindon Town, Accrington Stanley, Salford City, Grimsby Town, Exeter City, Newport County, Chesterfield, Colchester United, Shrewsbury Town, Fleetwood Town, Tranmere Rovers, Bristol Rovers, Oldham Athletic, Rochdale, Northampton Town, Crawley Town']},
{k:'ESP',n:'Espanha',nat:'Espanha',q:0.97,cup:'Copa del Rey',dn:['La Liga','Segunda División','Primera Federación'],cl:[
'Real Madrid, Barcelona, Atlético de Madrid, Real Sociedad, Athletic Bilbao, Real Betis, Villarreal, Sevilla, Celta de Vigo, Valencia, Osasuna, Deportivo La Coruña, Getafe, Rayo Vallecano, Espanyol, Alavés, Racing Santander, Elche, Málaga, Levante',
'Girona, Mallorca, Sporting de Gijón, Almería, Granada, Real Oviedo, Eibar, Burgos, Las Palmas, Castellón, Cádiz, Real Valladolid, Córdoba, Albacete, Eldense, Tenerife, RC Celta Fortuna, Sabadell, Real Sociedad II, Leganés, FC Andorra, Ceuta',
'Real Zaragoza, Huesca, Racing Ferrol, Alcorcón, Mirandés, Cultural Leonesa, Real Murcia, Ponferradina, Hércules, Lugo, Numancia, Gimnàstic, Linares, Arenteiro, Cartagena, Real Unión, Barakaldo, Unionistas, Sestao River, Zamora']},
{k:'ITA',n:'Itália',nat:'Itália',q:0.93,cup:'Coppa Italia',dn:['Serie A','Serie B','Serie C'],cl:[
'Inter, Milan, Juventus, Lazio, Roma, Napoli, Atalanta, Frosinone, Bologna, Torino, Fiorentina, Genoa, Como, Cagliari, Lecce, Monza, Udinese, Sassuolo, Parma, Venezia',
'Palermo, Cremonese, Mantova, Modena, Sampdoria, Pisa, Hellas Verona, Empoli, Cesena, Ascoli, Padova, Avellino, Sudtirol, Benevento, Catanzaro, Vicenza, Carrarese, Arezzo, Juve Stabia, Virtus Entella',
'Spezia, Bari, Brescia, Reggiana, Salernitana, Triestina, Lecco, Foggia, Perugia, Pescara, Cosenza, Taranto, Rimini, Ternana, Pontedera, Lucchese, Gubbio, Audace Cerignola, Pro Vercelli, Ancona']},
{k:'GER',n:'Alemanha',nat:'Alemanha',q:0.93,cup:'DFB-Pokal',dn:['Bundesliga','2. Bundesliga','3. Liga'],cl:[
'Bayern München, Borussia Dortmund, Bayer Leverkusen, RB Leipzig, Freiburg, VfB Stuttgart, Eintracht Frankfurt, Werder Bremen, Hoffenheim, Mönchengladbach, Mainz 05, Union Berlin, Augsburg, Hamburger SV, Elversberg, Köln, Paderborn, Schalke 04',
'Wolfsburg, Hertha BSC, Heidenheim, Nürnberg, Kaiserslautern, Hannover 96, Magdeburg, Karlsruher SC, VfL Bochum, Greuther Fürth, St. Pauli, Arminia Bielefeld, Darmstadt 98, Braunschweig, Holstein Kiel, Dynamo Dresden, Energie Cottbus, Osnabrück',
'Fortuna Düsseldorf, Preußen Münster, 1860 München, Hansa Rostock, Saarbrücken, Waldhof Mannheim, MSV Duisburg, Erzgebirge Aue, Viktoria Köln, Wehen Wiesbaden, Ingolstadt, Verl, Jahn Regensburg, Sandhausen, Rot-Weiss Essen, Hallescher FC, Rot-Weiß Erfurt, SSV Ulm, Alemannia Aachen, Rot-Weiß Oberhausen']},
{k:'FRA',n:'França',nat:'França',q:0.86,cup:'Coupe de France',dn:['Ligue 1','Ligue 2'],cl:[
'Paris Saint-Germain, Lille, Marseille, Monaco, Lyon, Nice, Lens, Rennes, Brest, Toulouse, Lorient, Paris FC, Strasbourg, Auxerre, Angers, Le Havre, Le Mans, Troyes',
'Reims, Montpellier, Saint-Étienne, AS Nancy Lorraine, Nantes, Metz, Dijon FCO, Pau, Guingamp, Red Star FC 93, Annecy, Rodez, Boulogne, Laval, Dunkerque, Grenoble, Clermont, Sochaux']},
{k:'POR',n:'Portugal',nat:'Portugal',q:0.8,cup:'Taça de Portugal',dn:['Primeira Liga','Liga 2'],cl:[
'Benfica, Porto, Sporting CP, Braga, Gil Vicente, Académico de Viseu, Famalicão, Vitória SC, Moreirense, Arouca, Santa Clara, Alverca, Estoril, Casa Pia, Estrela, Rio Ave, Nacional, Marítimo',
'Boavista, Farense, Vizela, Tondela, Académica, Belenenses, Chaves, Penafiel, Paços de Ferreira, Leixões, Portimonense, Torreense, Feirense, Mafra, Trofense, Oliveirense, Aves, União de Leiria']},
{k:'NED',n:'Holanda',nat:'Holanda',q:0.78,cup:'KNVB Beker',dn:['Eredivisie','Eerste Divisie'],cl:[
'PSV, Ajax, Feyenoord, AZ Alkmaar, Twente, Heerenveen, Go Ahead Eagles, Sparta Rotterdam, Utrecht, Fortuna Sittard, NEC Nijmegen, Groningen, PEC Zwolle, Cambuur, Willem II, Excelsior, ADO Den Haag, Telstar',
'Heracles, Almere City, RKC Waalwijk, Roda JC, NAC Breda, Vitesse, FC Volendam, Den Bosch, VVV-Venlo, Emmen, De Graafschap, Jong AZ, Dordrecht, MVV Maastricht, Jong PSV, Helmond Sport, Jong Ajax, TOP Oss, Jong FC Utrecht, FC Eindhoven']},
{k:'ARG',n:'Argentina',nat:'Argentina',q:0.74,cup:'Copa Argentina',dn:['Liga Profesional','Primera Nacional'],cl:[
'Boca Juniors, Independiente, River Plate, Vélez Sarsfield, Racing Club, San Lorenzo, Estudiantes, Lanús, Talleres, Gimnasia (Mendoza), Newell\'s Old Boys, Defensa y Justicia, Argentinos Juniors, Instituto, Rosario Central, Huracán, Deportivo Riestra, Belgrano, Platense, Banfield, Central Córdoba (Santiago del Estero), Aldosivi, Estudiantes de Río Cuarto, Independiente Rivadavia, Unión, Tigre, Gimnasia La Plata, Atlético Tucumán, Sarmiento, Barracas Central',
'Godoy Cruz, Colón, Deportivo Morón, Deportivo Madryn, Ciudad de Bolívar, Estudiantes (Buenos Aires), Chaco For Ever, Quilmes, Los Andes, All Boys, Almirante Brown, San Telmo, Chacarita, Mitre (Santiago del Estero), Ferro Carril Oeste, Racing (Córdoba), Defensores de Belgrano, Central Norte, Acassuso, San Miguel, Agropecuario, Almagro, Atlanta, Atletico Rafaela, Colegiales, Deportivo Maipú, Gimnasia y Esgrima (Jujuy), Gimnasia y Tiro (Salta), Güemes, Midland, Patronato, San Martín (San Juan), San Martín (Tucumán), Tristán Suárez, Nueva Chicago, Temperley']},
{k:'TUR',n:'Turquia',nat:'Turquia',q:0.7,cup:'Türkiye Kupası',dn:['Süper Lig','1. Lig'],cl:[
'Galatasaray, Fenerbahçe, Beşiktaş, Trabzonspor, Amed SFK, Başakşehir, Kasımpaşa, Samsunspor, Konyaspor, Alanyaspor, Rizespor, Kocaelispor, Göztepe, Gaziantep FK, Çorum FK, Eyüpspor, Erzurumspor, Genclerbirligi',
'Antalyaspor, Sivasspor, Kayserispor, Bodrum FK, Bursaspor, Sakaryaspor, Boluspor, Ümraniyespor, Pendikspor, Manisa FK, Keçiörengücü, Adanaspor, Altay, Giresunspor, Adana Demirspor, Hatayspor, Bandırmaspor, Ankaragücü, Şanlıurfaspor, Vanspor']}
];
/* força inicial dos clubes brasileiros (tools/brasil_forca.py: liga, copas e confronto direto 2021-2025), 0..1 por divisão */
const BRF={"Chapecoense":0.0,"Remo":0.047,"Coritiba":0.098,"Vitória":0.168,"Santos":0.223,"Mirassol":0.26,"Vasco da Gama":0.304,"Bahia":0.35,"Athletico Paranaense":0.382,"Grêmio":0.422,"Bragantino":0.46,"Cruzeiro":0.493,"Internacional":0.559,"São Paulo":0.598,"Corinthians":0.648,"Atlético Mineiro":0.721,"Botafogo":0.752,"Fluminense":0.79,"Palmeiras":0.934,"Flamengo":1.0,"São Bernardo":0.0,"Náutico":0.038,"Athletic":0.07,"Londrina":0.105,"Ponte Preta":0.143,"Botafogo-SP":0.175,"Sport Recife":0.213,"Operário-PR":0.246,"Avaí":0.283,"Vila Nova":0.318,"CRB":0.35,"Novorizontino":0.384,"Criciúma":0.431,"Goiás":0.505,"Atlético Goianiense":0.541,"Juventude":0.583,"Ceará":0.635,"América Mineiro":0.673,"Cuiabá":0.706,"Fortaleza":1.0,"Anápolis":0.0,"Maranhão":0.032,"Inter de Limeira":0.063,"Caxias":0.095,"Floresta":0.126,"Botafogo-PB":0.158,"Ypiranga":0.189,"Figueirense":0.221,"Santa Cruz":0.253,"Confiança":0.288,"ABC":0.321,"Volta Redonda":0.358,"Ferroviária":0.394,"Tombense":0.428,"CSA":0.466,"Brusque":0.498,"Paysandu":0.533,"Amazonas":0.573,"Guarani":0.625,"América-MG":1.0};

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
const PNQ={GOL:'Goleiro',...PN};                     // posições dos elencos (inclui goleiro)
const POSL=['ATA','ATA','ATA','PNT','PNT','MEI','MEI','MEI','VOL','VOL','ZAG','ZAG','ZAG'];
/* perfil das 6 estatísticas da carta (VEL FIN PAS DRI DEF FIS) por posição, em relação ao OVR */
const PROF={GOL:[-14,-45,-12,-30,12,0],ATA:[2,5,-8,1,-32,-2],PNT:[6,1,-4,6,-34,-8],MEI:[-2,-2,5,3,-14,-6],VOL:[-4,-14,2,-4,8,3],ZAG:[-4,-34,-8,-14,7,8]};

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

/* ---- cores oficiais aproximadas [principal, secundária] (clubes não listados usam cor derivada do nome) ---- */
const CCLR={
 'Flamengo':['#C8102E','#111111'],'Palmeiras':['#006437','#FFFFFF'],'Corinthians':['#222222','#FFFFFF'],'São Paulo':['#E4002B','#111111'],
 'Santos':['#EEEEEE','#111111'],'Fluminense':['#8A1538','#00843D'],'Vasco da Gama':['#1A1A1A','#FFFFFF'],'Botafogo':['#222222','#FFFFFF'],
 'Grêmio':['#0D80BF','#111111'],'Internacional':['#E5050F','#FFFFFF'],'Atlético Mineiro':['#222222','#FFFFFF'],'Cruzeiro':['#0033A0','#FFFFFF'],
 'Real Madrid':['#F2F2F2','#FEBE10'],'Barcelona':['#A50044','#004D98'],'Atlético de Madrid':['#CB3524','#272E61'],'Manchester United':['#DA291C','#FBE122'],
 'Manchester City':['#6CABDD','#1C2C5B'],'Liverpool':['#C8102E','#F6EB61'],'Chelsea':['#034694','#DBA111'],'Arsenal':['#EF0107','#FFFFFF'],
 'Juventus':['#EEEEEE','#111111'],'Milan':['#FB090B','#111111'],'Inter':['#0068A8','#111111'],'Bayern München':['#DC052D','#0066B2'],
 'Borussia Dortmund':['#FDE100','#111111'],'Boca Juniors':['#103F91','#F7D117'],'River Plate':['#EEEEEE','#E4002B'],'Benfica':['#E30613','#FFFFFF'],
 'Porto':['#003E7E','#FFFFFF'],'Sporting CP':['#008057','#FFFFFF'],'Ajax':['#D2122E','#FFFFFF'],'Atlético Nacional':['#006A38','#FFFFFF']};

/* ---- lendas: dados aproximados de carreira (títulos e prêmios conhecidos; gols = totais oficiais/estimados) ---- */
const LEG=[
 {n:'Lionel Messi',wcb:2,ex:6,nat:'ARG',pos:'ATA',bo:8,wc:1,ucl:4,lg:12,g:900,ap:1100},
 {n:'Cristiano Ronaldo',ex:6,nat:'POR',pos:'ATA',bo:5,wc:0,ucl:5,lg:7,g:950,ap:1300,eu:1},
 {n:'Pelé',wcb:1,ex:8,nat:'BRA',pos:'ATA',bo:0,wc:3,ucl:0,lg:10,g:760,ap:830,lib:2,mc:2},
 {n:'Diego Maradona',wcb:1,ex:14,nat:'ARG',pos:'MEI',bo:0,wc:1,ucl:0,lg:5,g:345,ap:680},
 {n:'Johan Cruyff',wcb:1,ex:4,nat:'NED',pos:'ATA',bo:3,wc:0,ucl:3,lg:9,g:400,ap:700},
 {n:'Ronaldo Nazário',wcb:1,ex:4,nat:'BRA',pos:'ATA',bo:2,wc:2,ucl:0,lg:3,g:415,ap:616},
 {n:'Franz Beckenbauer',ex:4,nat:'GER',pos:'ZAG',bo:2,wc:1,ucl:3,lg:5,g:100,ap:800,eu:1},
 {n:'Michel Platini',ex:6,nat:'FRA',pos:'MEI',bo:3,wc:0,ucl:1,lg:2,g:260,ap:500,eu:1},
 {n:'Alfredo Di Stéfano',nat:'ARG',pos:'ATA',bo:2,wc:0,ucl:5,lg:8,g:510,ap:710},
 {n:'Zinedine Zidane',wcb:1,ex:6,nat:'FRA',pos:'MEI',bo:1,wc:1,ucl:1,lg:3,g:125,ap:690,eu:1},
 {n:'Ferenc Puskás',nat:'HUN',pos:'ATA',bo:0,wc:0,ucl:3,lg:10,g:700,ap:750,ex:3},
 {n:'Gerd Müller',nat:'GER',pos:'ATA',bo:1,wc:1,ucl:3,lg:4,g:735,ap:790,eu:1},
 {n:'Eusébio',nat:'POR',pos:'ATA',bo:1,wc:0,ucl:1,lg:11,g:733,ap:745},
 {n:'Marco van Basten',nat:'NED',pos:'ATA',bo:3,wc:0,ucl:2,lg:3,g:280,ap:280,eu:1,mc:1},
 {n:'Zico',nat:'BRA',pos:'MEI',bo:0,wc:0,ucl:0,lg:3,g:800,ap:1100,lib:1,mc:1},
 {n:'Romário',nat:'BRA',pos:'ATA',bo:0,wc:1,ucl:0,lg:5,g:780,ap:1000,ex:2},
 {n:'Ronaldinho',nat:'BRA',pos:'MEI',bo:1,wc:1,ucl:1,lg:3,g:230,ap:750,lib:1,ex:3},
 {n:'Kaká',nat:'BRA',pos:'MEI',bo:1,wc:1,ucl:1,lg:2,g:170,ap:620,mc:1},
 {n:'Bobby Charlton',nat:'ENG',pos:'MEI',bo:1,wc:1,ucl:1,lg:3,g:249,ap:758},
 {n:'Thierry Henry',nat:'FRA',pos:'ATA',bo:0,wc:1,ucl:1,lg:4,g:411,ap:800,eu:1},
 {n:'Xavi',nat:'ESP',pos:'MEI',bo:0,wc:1,ucl:4,lg:8,g:85,ap:900,eu:2,mc:2},
 {n:'Andrés Iniesta',nat:'ESP',pos:'MEI',bo:0,wc:1,ucl:4,lg:9,g:60,ap:900,eu:2,mc:3},
 {n:'Garrincha',nat:'BRA',pos:'PNT',bo:0,wc:2,ucl:0,lg:3,g:250,ap:600,ex:1},
 {n:'Lev Yashin',nat:'URS',pos:'GOL',bo:1,wc:0,ucl:0,lg:5,g:0,ap:812,eu:1},
 {n:'Roberto Baggio',nat:'ITA',pos:'ATA',bo:1,wc:0,ucl:0,lg:2,g:318,ap:700}];
const legPts=l=>l.bo*18+(l.wcb||0)*7+(l.ex||0)+l.wc*14+(l.ucl||0)*6+(l.lib||0)*5+(l.mc||0)*3+(l.eu||0)*5+l.lg*1.5+l.g/25;

/* ---------- Árvore de habilidades (portado do BrasLOL, adaptado ao futebol) ----------
   br = ramo, c = custo em pontos, lv = nível mínimo, pa = pré-requisitos (basta um; `need` no nó final), r = linha (0 topo ... 9 base; 5+ = Lendas),
   x = posição horizontal em %, at = [atributo, pontos], fx = efeitos: gl gols, ast assistências, rtw nota nas vitórias, bon bônus por gol,
   inj lesões, en desgaste de energia, xpw XP no treino, xpm XP em jogos, tra evolução no treino, fame reputação, trp confiança ganha. */
const PBR={f:['Decisivo','Decide jogos'],e:['Estudioso','Evolui mais rápido'],p:['Profissional','Vida de atleta']};
const PERKS=[
 {id:'f1',br:'f',n:'Sangue frio',d:'+6% de chance de converter chances em gol.',c:1,lv:2,pa:[],r:0,x:50,fx:{gl:.06}},
 {id:'f4',br:'f',n:'Chute colocado',d:'+2 de Finalização.',c:1,lv:4,pa:['f1'],r:1,x:30,at:[1,2]},
 {id:'f5',br:'f',n:'Arranque',d:'+2 de Velocidade.',c:1,lv:4,pa:['f1'],r:1,x:70,at:[0,2]},
 {id:'f6',br:'f',n:'Faro de gol',d:'+8% de chance de gol.',c:2,lv:7,pa:['f4'],r:2,x:14,fx:{gl:.08}},
 {id:'f2',br:'f',n:'Decisivo',d:'+0,3 de nota nas vitórias.',c:2,lv:7,pa:['f4'],r:2,x:38,fx:{rtw:.3}},
 {id:'f7',br:'f',n:'Cobrador',d:'+20% no bônus por gol.',c:2,lv:7,pa:['f5'],r:2,x:62,fx:{bon:.2}},
 {id:'f8',br:'f',n:'Dribles curtos',d:'+2 de Drible.',c:2,lv:7,pa:['f5'],r:2,x:86,at:[3,2]},
 {id:'f9',br:'f',n:'Garçom',d:'+12% de chance de assistência.',c:2,lv:10,pa:['f6','f2'],r:3,x:26,fx:{ast:.12}},
 {id:'f3',br:'f',n:'Matador',d:'+10% de gol e +0,2 de nota nas vitórias.',c:2,lv:10,pa:['f2','f7'],r:3,x:50,fx:{gl:.10,rtw:.2}},
 {id:'f10',br:'f',n:'Visão periférica',d:'+2 de Visão de jogo.',c:2,lv:10,pa:['f7','f8'],r:3,x:74,at:[6,2]},
 {id:'f11',br:'f',n:'Lenda do gol',d:'+8% de gol, +8% de assistência e +0,3 de nota nas vitórias. Exige 2 das 3 habilidades ligadas.',c:3,lv:15,pa:['f9','f3','f10'],need:2,r:4,x:50,fx:{gl:.08,ast:.08,rtw:.3}},

 {id:'e1',br:'e',n:'Dedicado',d:'+20% de XP no treino semanal.',c:1,lv:2,pa:[],r:0,x:50,fx:{xpw:.2}},
 {id:'e4',br:'e',n:'Passe refinado',d:'+2 de Passe.',c:1,lv:4,pa:['e1'],r:1,x:30,at:[2,2]},
 {id:'e5',br:'e',n:'Caderno de jogo',d:'+15% de XP nas partidas.',c:1,lv:4,pa:['e1'],r:1,x:70,fx:{xpm:.15}},
 {id:'e6',br:'e',n:'Leitor de jogo',d:'+2 de Visão de jogo.',c:2,lv:7,pa:['e4'],r:2,x:14,at:[6,2]},
 {id:'e3',br:'e',n:'Analista',d:'+25% de XP nas partidas.',c:2,lv:7,pa:['e4'],r:2,x:38,fx:{xpm:.25}},
 {id:'e2',br:'e',n:'Aprendiz',d:'+15% de XP no treino semanal.',c:2,lv:7,pa:['e5'],r:2,x:62,fx:{xpw:.15}},
 {id:'e7',br:'e',n:'Treino extra',d:'+15% de evolução dos atributos no treino.',c:2,lv:7,pa:['e5'],r:2,x:86,fx:{tra:.15}},
 {id:'e8',br:'e',n:'Muralha',d:'+2 de Defesa.',c:2,lv:10,pa:['e6','e3'],r:3,x:26,at:[4,2]},
 {id:'e9',br:'e',n:'Professor',d:'+15% de XP no treino e +10% de evolução.',c:2,lv:10,pa:['e3','e2'],r:3,x:50,fx:{xpw:.15,tra:.10}},
 {id:'e10',br:'e',n:'Malabarista',d:'+2 de Drible.',c:2,lv:10,pa:['e2','e7'],r:3,x:74,at:[3,2]},
 {id:'e11',br:'e',n:'Gênio',d:'+20% de XP no treino e nas partidas e +15% de evolução. Exige 2 das 3 habilidades ligadas.',c:3,lv:15,pa:['e8','e9','e10'],need:2,r:4,x:50,fx:{xpw:.2,xpm:.2,tra:.15}},

 {id:'p1',br:'p',n:'Atleta',d:'15% menos desgaste de energia.',c:1,lv:2,pa:[],r:0,x:50,fx:{en:.15}},
 {id:'p4',br:'p',n:'Preparo físico',d:'+2 de Físico.',c:1,lv:4,pa:['p1'],r:1,x:30,at:[5,2]},
 {id:'p5',br:'p',n:'Dieta',d:'15% menos risco de lesão.',c:1,lv:4,pa:['p1'],r:1,x:70,fx:{inj:.15}},
 {id:'p6',br:'p',n:'Recuperação',d:'Mais 10% de energia poupada.',c:2,lv:7,pa:['p4'],r:2,x:14,fx:{en:.10}},
 {id:'p3',br:'p',n:'Líder',d:'+25% de confiança ganha com o técnico.',c:2,lv:7,pa:['p4'],r:2,x:38,fx:{trp:.25}},
 {id:'p2',br:'p',n:'Imagem pública',d:'+25% de reputação ganha.',c:2,lv:7,pa:['p5'],r:2,x:62,fx:{fame:.25}},
 {id:'p7',br:'p',n:'Corpo fechado',d:'Mais 15% menos risco de lesão.',c:2,lv:7,pa:['p5'],r:2,x:86,fx:{inj:.15}},
 {id:'p9',br:'p',n:'Corpo de aço',d:'+2 de Físico.',c:2,lv:10,pa:['p6','p3'],r:3,x:26,at:[5,2]},
 {id:'p8',br:'p',n:'Negociador',d:'+25% no bônus por gol.',c:2,lv:10,pa:['p3','p2'],r:3,x:50,fx:{bon:.25}},
 {id:'p10',br:'p',n:'Blindado',d:'Mais 20% menos risco de lesão.',c:2,lv:10,pa:['p2','p7'],r:3,x:74,fx:{inj:.20}},
 {id:'p11',br:'p',n:'Imortal',d:'Menos desgaste, menos lesões e mais confiança. Exige 2 das 3 habilidades ligadas.',c:3,lv:15,pa:['p9','p8','p10'],need:2,r:4,x:50,fx:{en:.15,inj:.15,trp:.2}},
 /* ---- Lendas (nível 20+) ---- */
 {id:'f12',br:'f',n:'Instinto matador',d:'+10% de chance de gol.',c:3,lv:20,pa:['f11'],r:5,x:30,fx:{gl:0.1}},
 {id:'f13',br:'f',n:'Nervos de aço',d:'+0,3 de nota nas vitórias.',c:3,lv:20,pa:['f11'],r:5,x:70,fx:{rtw:0.3}},
 {id:'f14',br:'f',n:'Finalização de elite',d:'+3 de Finalização.',c:3,lv:25,pa:['f12'],r:6,x:14,at:[1,3]},
 {id:'f15',br:'f',n:'Craque de decisão',d:'+5% de gol e +0,3 de nota nas vitórias.',c:3,lv:25,pa:['f12','f13'],r:6,x:38,fx:{gl:0.05,rtw:0.3}},
 {id:'f16',br:'f',n:'Passe açucarado',d:'+15% de chance de assistência.',c:3,lv:25,pa:['f13'],r:6,x:62,fx:{ast:0.15}},
 {id:'f17',br:'f',n:'Explosão',d:'+3 de Velocidade.',c:3,lv:25,pa:['f13'],r:6,x:86,at:[0,3]},
 {id:'f18',br:'f',n:'Artilheiro nato',d:'+12% de chance de gol.',c:4,lv:30,pa:['f14','f15'],r:7,x:26,fx:{gl:0.12}},
 {id:'f19',br:'f',n:'Gene decisivo',d:'+0,4 de nota nas vitórias e +20% no bônus por gol.',c:4,lv:30,pa:['f15','f16'],r:7,x:50,fx:{rtw:0.4,bon:0.2}},
 {id:'f20',br:'f',n:'Maestro',d:'+15% de assistência.',c:4,lv:30,pa:['f16','f17'],r:7,x:74,fx:{ast:0.15}},
 {id:'f21',br:'f',n:'Rei da área',d:'+12% de gol, +10% de assistência e +0,3 de nota. Exige 2 das 3 habilidades ligadas.',c:4,lv:40,pa:['f18','f19','f20'],r:8,x:50,need:2,fx:{gl:0.12,ast:0.1,rtw:0.3}},
 {id:'f22',br:'f',n:'Eterno artilheiro',d:'+15% de gol, +12% de assistência, +0,4 de nota e +30% de reputação.',c:5,lv:50,pa:['f21'],r:9,x:50,fx:{gl:0.15,ast:0.12,rtw:0.4,fame:0.3}},
 {id:'e12',br:'e',n:'Mente analítica',d:'+20% de XP nas partidas.',c:3,lv:20,pa:['e11'],r:5,x:30,fx:{xpm:0.2}},
 {id:'e13',br:'e',n:'Rotina de estudo',d:'+20% de XP no treino semanal.',c:3,lv:20,pa:['e11'],r:5,x:70,fx:{xpw:0.2}},
 {id:'e14',br:'e',n:'Passe de elite',d:'+3 de Passe.',c:3,lv:25,pa:['e12'],r:6,x:14,at:[2,3]},
 {id:'e15',br:'e',n:'Visão de raio-X',d:'+3 de Visão de jogo.',c:3,lv:25,pa:['e12','e13'],r:6,x:38,at:[6,3]},
 {id:'e16',br:'e',n:'Laboratório tático',d:'+15% de evolução e +10% de XP no treino.',c:3,lv:25,pa:['e13'],r:6,x:62,fx:{tra:0.15,xpw:0.1}},
 {id:'e17',br:'e',n:'Drible refinado',d:'+3 de Drible.',c:3,lv:25,pa:['e13'],r:6,x:86,at:[3,3]},
 {id:'e18',br:'e',n:'Mentor',d:'+25% de XP nas partidas.',c:4,lv:30,pa:['e14','e15'],r:7,x:26,fx:{xpm:0.25}},
 {id:'e19',br:'e',n:'Metodologia própria',d:'+20% de evolução e +15% de XP no treino.',c:4,lv:30,pa:['e15','e16'],r:7,x:50,fx:{tra:0.2,xpw:0.15}},
 {id:'e20',br:'e',n:'Escola de craques',d:'+25% de XP no treino semanal.',c:4,lv:30,pa:['e16','e17'],r:7,x:74,fx:{xpw:0.25}},
 {id:'e21',br:'e',n:'Professor doutor',d:'+20% de XP (treino e jogos) e +20% de evolução. Exige 2 das 3 habilidades ligadas.',c:4,lv:40,pa:['e18','e19','e20'],r:8,x:50,need:2,fx:{xpw:0.2,xpm:0.2,tra:0.2}},
 {id:'e22',br:'e',n:'Onisciente',d:'+25% de XP (treino e jogos) e +25% de evolução.',c:5,lv:50,pa:['e21'],r:9,x:50,fx:{xpw:0.25,xpm:0.25,tra:0.25}},
 {id:'p12',br:'p',n:'Descanso eficiente',d:'15% menos desgaste de energia.',c:3,lv:20,pa:['p11'],r:5,x:30,fx:{en:0.15}},
 {id:'p13',br:'p',n:'Contrato blindado',d:'+25% no bônus por gol.',c:3,lv:20,pa:['p11'],r:5,x:70,fx:{bon:0.25}},
 {id:'p14',br:'p',n:'Fisioterapeuta pessoal',d:'20% menos risco de lesão.',c:3,lv:25,pa:['p12'],r:6,x:14,fx:{inj:0.2}},
 {id:'p15',br:'p',n:'Investidor',d:'+20% de reputação e +15% no bônus por gol.',c:3,lv:25,pa:['p12','p13'],r:6,x:38,fx:{fame:0.2,bon:0.15}},
 {id:'p16',br:'p',n:'Patrocinadores',d:'+30% de reputação ganha.',c:3,lv:25,pa:['p13'],r:6,x:62,fx:{fame:0.3}},
 {id:'p17',br:'p',n:'Influenciador',d:'+25% de reputação e +20% de confiança ganha.',c:3,lv:25,pa:['p13'],r:6,x:86,fx:{fame:0.25,trp:0.2}},
 {id:'p18',br:'p',n:'Rotina de campeão',d:'+3 de Físico e 10% menos desgaste.',c:4,lv:30,pa:['p14','p15'],r:7,x:26,fx:{en:0.1},at:[5,3]},
 {id:'p19',br:'p',n:'Mercado aquecido',d:'+30% no bônus por gol.',c:4,lv:30,pa:['p15','p16'],r:7,x:50,fx:{bon:0.3}},
 {id:'p20',br:'p',n:'Embaixador',d:'+35% de reputação e +20% de confiança ganha.',c:4,lv:30,pa:['p16','p17'],r:7,x:74,fx:{fame:0.35,trp:0.2}},
 {id:'p21',br:'p',n:'Lenda viva',d:'15% menos desgaste, 20% menos lesões e +25% de confiança. Exige 2 das 3 habilidades ligadas.',c:4,lv:40,pa:['p18','p19','p20'],r:8,x:50,need:2,fx:{en:0.15,inj:0.2,trp:0.25}},
 {id:'p22',br:'p',n:'Eterno',d:'20% menos desgaste, 25% menos lesões, +30% de reputação e +25% de confiança.',c:5,lv:50,pa:['p21'],r:9,x:50,fx:{en:0.2,inj:0.25,fame:0.3,trp:0.25}}
];
const PCLV=50,pcNeed=lv=>120+30*lv;

/* Seleções da Copa do Mundo: [nome, código, força]. As 16 primeiras são as nacionalidades jogáveis. */
const WCN=[['Brasil','BRA',86],['Argentina','ARG',87],['Portugal','POR',84],['Espanha','ESP',86],['França','FRA',88],['Inglaterra','ENG',85],['Alemanha','GER',84],['Itália','ITA',82],['Holanda','NED',83],['Turquia','TUR',74],['Uruguai','URU',80],['Colômbia','COL',78],['Nigéria','NGA',73],['Marrocos','MAR',77],['Japão','JPN',75],['EUA','USA',74],
 ['Bélgica','BEL',82],['Croácia','CRO',80],['Dinamarca','DEN',76],['México','MEX',75],['Senegal','SEN',75],['Coreia do Sul','KOR',73],['Suíça','SUI',75],['Equador','ECU',72],['Chile','CHI',72],['Camarões','CMR',68],['Austrália','AUS',68],['Polônia','POL',72],['Suécia','SWE',72],['Egito','EGY',68],['Irã','IRN',67],['Canadá','CAN',68]];
const STG=['Fase de grupos','Oitavas','Quartas','Semifinal','Vice-campeão','Campeão'];
