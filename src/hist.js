'use strict';
/* ============================================================
   HABITE-SE 10 — HISTÓRICO REAL (até 2025)
   Bolas de Ouro, Champions, Libertadores e Copas do Mundo.
   A partir de 2026 valem os resultados simulados pelo jogo.
   Os nomes dos clubes seguem os nomes usados no jogo, para a ficha abrir.
   ============================================================ */
const rowsOf=s=>s.trim().split('\n').map(l=>l.trim().split('|'));

/* ano | vencedor | país | clube | posição */
const BDO_REAL=rowsOf(`
1956|Stanley Matthews|ENG|Blackpool|PNT
1957|Alfredo Di Stéfano|ARG|Real Madrid|ATA
1958|Raymond Kopa|FRA|Real Madrid|PNT
1959|Alfredo Di Stéfano|ARG|Real Madrid|ATA
1960|Luis Suárez|ESP|Barcelona|MEI
1961|Omar Sívori|ARG|Juventus|PNT
1962|Josef Masopust|TCH|Dukla Praga|MEI
1963|Lev Yashin|URS|Dínamo de Moscou|GOL
1964|Denis Law|SCO|Manchester United|ATA
1965|Eusébio|POR|Benfica|ATA
1966|Bobby Charlton|ENG|Manchester United|MEI
1967|Flórián Albert|HUN|Ferencváros|ATA
1968|George Best|NIR|Manchester United|PNT
1969|Gianni Rivera|ITA|Milan|MEI
1970|Gerd Müller|GER|Bayern München|ATA
1971|Johan Cruyff|NED|Ajax|ATA
1972|Franz Beckenbauer|GER|Bayern München|ZAG
1973|Johan Cruyff|NED|Barcelona|ATA
1974|Johan Cruyff|NED|Barcelona|ATA
1975|Oleg Blokhin|URS|Dínamo de Kiev|PNT
1976|Franz Beckenbauer|GER|Bayern München|ZAG
1977|Allan Simonsen|DEN|Mönchengladbach|PNT
1978|Kevin Keegan|ENG|Hamburger SV|ATA
1979|Kevin Keegan|ENG|Hamburger SV|ATA
1980|Karl-Heinz Rummenigge|GER|Bayern München|ATA
1981|Karl-Heinz Rummenigge|GER|Bayern München|ATA
1982|Paolo Rossi|ITA|Juventus|ATA
1983|Michel Platini|FRA|Juventus|MEI
1984|Michel Platini|FRA|Juventus|MEI
1985|Michel Platini|FRA|Juventus|MEI
1986|Igor Belanov|URS|Dínamo de Kiev|ATA
1987|Ruud Gullit|NED|Milan|MEI
1988|Marco van Basten|NED|Milan|ATA
1989|Marco van Basten|NED|Milan|ATA
1990|Lothar Matthäus|GER|Inter|MEI
1991|Jean-Pierre Papin|FRA|Marseille|ATA
1992|Marco van Basten|NED|Milan|ATA
1993|Roberto Baggio|ITA|Juventus|ATA
1994|Hristo Stoichkov|BUL|Barcelona|ATA
1995|George Weah|LBR|Milan|ATA
1996|Matthias Sammer|GER|Borussia Dortmund|ZAG
1997|Ronaldo Nazário|BRA|Inter|ATA
1998|Zinedine Zidane|FRA|Juventus|MEI
1999|Rivaldo|BRA|Barcelona|MEI
2000|Luís Figo|POR|Real Madrid|PNT
2001|Michael Owen|ENG|Liverpool|ATA
2002|Ronaldo Nazário|BRA|Real Madrid|ATA
2003|Pavel Nedvěd|CZE|Juventus|MEI
2004|Andriy Shevchenko|UKR|Milan|ATA
2005|Ronaldinho|BRA|Barcelona|MEI
2006|Fabio Cannavaro|ITA|Real Madrid|ZAG
2007|Kaká|BRA|Milan|MEI
2008|Cristiano Ronaldo|POR|Manchester United|PNT
2009|Lionel Messi|ARG|Barcelona|ATA
2010|Lionel Messi|ARG|Barcelona|ATA
2011|Lionel Messi|ARG|Barcelona|ATA
2012|Lionel Messi|ARG|Barcelona|ATA
2013|Cristiano Ronaldo|POR|Real Madrid|ATA
2014|Cristiano Ronaldo|POR|Real Madrid|ATA
2015|Lionel Messi|ARG|Barcelona|ATA
2016|Cristiano Ronaldo|POR|Real Madrid|ATA
2017|Cristiano Ronaldo|POR|Real Madrid|ATA
2018|Luka Modrić|CRO|Real Madrid|MEI
2019|Lionel Messi|ARG|Barcelona|ATA
2020|—|||
2021|Lionel Messi|ARG|Paris Saint-Germain|ATA
2022|Karim Benzema|FRA|Real Madrid|ATA
2023|Lionel Messi|ARG|Inter Miami|ATA
2024|Rodri|ESP|Manchester City|VOL
2025|Ousmane Dembélé|FRA|Paris Saint-Germain|PNT
`).map(([y,n,nat,c,pos])=>({y:+y,n,nat,c,pos}));

/* ano | campeão | vice */
const UCL_H=rowsOf(`
1956|Real Madrid|Reims
1957|Real Madrid|Fiorentina
1958|Real Madrid|Milan
1959|Real Madrid|Reims
1960|Real Madrid|Eintracht Frankfurt
1961|Benfica|Barcelona
1962|Benfica|Real Madrid
1963|Milan|Benfica
1964|Inter|Real Madrid
1965|Inter|Benfica
1966|Real Madrid|Partizan
1967|Celtic|Inter
1968|Manchester United|Benfica
1969|Milan|Ajax
1970|Feyenoord|Celtic
1971|Ajax|Panathinaikos
1972|Ajax|Inter
1973|Ajax|Juventus
1974|Bayern München|Atlético de Madrid
1975|Bayern München|Leeds United
1976|Bayern München|Saint-Étienne
1977|Liverpool|Mönchengladbach
1978|Liverpool|Club Brugge
1979|Nottingham Forest|Malmö
1980|Nottingham Forest|Hamburger SV
1981|Liverpool|Real Madrid
1982|Aston Villa|Bayern München
1983|Hamburger SV|Juventus
1984|Liverpool|Roma
1985|Juventus|Liverpool
1986|Steaua București|Barcelona
1987|Porto|Bayern München
1988|PSV|Benfica
1989|Milan|Steaua București
1990|Milan|Benfica
1991|Estrela Vermelha|Marseille
1992|Barcelona|Sampdoria
1993|Marseille|Milan
1994|Milan|Barcelona
1995|Ajax|Milan
1996|Juventus|Ajax
1997|Borussia Dortmund|Juventus
1998|Real Madrid|Juventus
1999|Manchester United|Bayern München
2000|Real Madrid|Valencia
2001|Bayern München|Valencia
2002|Real Madrid|Bayer Leverkusen
2003|Milan|Juventus
2004|Porto|Monaco
2005|Liverpool|Milan
2006|Barcelona|Arsenal
2007|Milan|Liverpool
2008|Manchester United|Chelsea
2009|Barcelona|Manchester United
2010|Inter|Bayern München
2011|Barcelona|Manchester United
2012|Chelsea|Bayern München
2013|Bayern München|Borussia Dortmund
2014|Real Madrid|Atlético de Madrid
2015|Barcelona|Juventus
2016|Real Madrid|Atlético de Madrid
2017|Real Madrid|Juventus
2018|Real Madrid|Liverpool
2019|Liverpool|Tottenham Hotspur
2020|Bayern München|Paris Saint-Germain
2021|Chelsea|Manchester City
2022|Real Madrid|Liverpool
2023|Manchester City|Inter
2024|Real Madrid|Borussia Dortmund
2025|Paris Saint-Germain|Inter
`).map(([y,c,r])=>({y:+y,c,r}));

const LIB_H=rowsOf(`
1960|Peñarol|Olimpia
1961|Peñarol|Palmeiras
1962|Santos|Peñarol
1963|Santos|Boca Juniors
1964|Independiente|Nacional (URU)
1965|Independiente|Peñarol
1966|Peñarol|River Plate
1967|Racing Club|Nacional (URU)
1968|Estudiantes|Palmeiras
1969|Estudiantes|Nacional (URU)
1970|Estudiantes|Peñarol
1971|Nacional (URU)|Estudiantes
1972|Independiente|Universitario
1973|Independiente|Colo-Colo
1974|Independiente|São Paulo
1975|Independiente|Unión Española
1976|Cruzeiro|River Plate
1977|Boca Juniors|Cruzeiro
1978|Boca Juniors|Deportivo Cali
1979|Olimpia|Boca Juniors
1980|Nacional (URU)|Internacional
1981|Flamengo|Cobreloa
1982|Peñarol|Cobreloa
1983|Grêmio|Peñarol
1984|Independiente|Grêmio
1985|Argentinos Juniors|América de Cali
1986|River Plate|América de Cali
1987|Peñarol|América de Cali
1988|Nacional (URU)|Newell's Old Boys
1989|Atlético Nacional|Olimpia
1990|Olimpia|Barcelona (EQU)
1991|Colo-Colo|Olimpia
1992|São Paulo|Newell's Old Boys
1993|São Paulo|Universidad Católica
1994|Vélez Sarsfield|São Paulo
1995|Grêmio|Atlético Nacional
1996|River Plate|América de Cali
1997|Cruzeiro|Sporting Cristal
1998|Vasco da Gama|Barcelona (EQU)
1999|Palmeiras|Deportivo Cali
2000|Boca Juniors|Palmeiras
2001|Boca Juniors|Cruz Azul
2002|Olimpia|São Caetano
2003|Boca Juniors|Santos
2004|Once Caldas|Boca Juniors
2005|São Paulo|Athletico Paranaense
2006|Internacional|São Paulo
2007|Boca Juniors|Grêmio
2008|LDU Quito|Fluminense
2009|Estudiantes|Cruzeiro
2010|Internacional|Guadalajara
2011|Santos|Peñarol
2012|Corinthians|Boca Juniors
2013|Atlético Mineiro|Olimpia
2014|San Lorenzo|Nacional (PAR)
2015|River Plate|Tigres UANL
2016|Atlético Nacional|Independiente del Valle
2017|Grêmio|Lanús
2018|River Plate|Boca Juniors
2019|Flamengo|River Plate
2020|Palmeiras|Santos
2021|Palmeiras|Flamengo
2022|Flamengo|Athletico Paranaense
2023|Fluminense|Boca Juniors
2024|Botafogo|Atlético Mineiro
2025|Flamengo|Palmeiras
`).map(([y,c,r])=>({y:+y,c,r}));

/* Copa do Mundo: ano | campeã | vice */
const WC_H=rowsOf(`
1930|Uruguai|Argentina
1934|Itália|Tchecoslováquia
1938|Itália|Hungria
1950|Uruguai|Brasil
1954|Alemanha|Hungria
1958|Brasil|Suécia
1962|Brasil|Tchecoslováquia
1966|Inglaterra|Alemanha
1970|Brasil|Itália
1974|Alemanha|Holanda
1978|Argentina|Holanda
1982|Itália|Alemanha
1986|Argentina|Alemanha
1990|Alemanha|Argentina
1994|Brasil|Itália
1998|França|Brasil
2002|Brasil|Alemanha
2006|Itália|França
2010|Espanha|Holanda
2014|Alemanha|Argentina
2018|França|Croácia
2022|Argentina|França
`).map(([y,c,r])=>({y:+y,c,r}));

/* Mundial de Clubes + Copa Intercontinental (títulos até 2025, aproximado) */
const MCH={'Real Madrid':8,'Barcelona':3,'Bayern München':4,'Milan':4,'Inter':3,'Manchester United':2,'Juventus':2,'Ajax':2,'Porto':2,
 'Liverpool':1,'Manchester City':1,'Chelsea':2,'Borussia Dortmund':1,'Feyenoord':1,'Nacional (URU)':3,'Peñarol':3,'Santos':2,'São Paulo':3,
 'Boca Juniors':3,'River Plate':1,'Independiente':2,'Racing Club':1,'Olimpia':1,'Grêmio':1,'Flamengo':1,'Corinthians':2,'Internacional':1};

/* códigos de seleções que não estão no jogo */
const SELC={'Hungria':'HUN','Tchecoslováquia':'TCH'};

/* Bola de Ouro 2025 (votação oficial da France Football): nome | país | clube | posição | idade | pontos */
const BDO_TOP={2025:[['Ousmane Dembélé','FRA','Paris Saint-Germain','PNT',28,1380],['Lamine Yamal','ESP','Barcelona','PNT',18,1059],['Vitinha','POR','Paris Saint-Germain','MEI',25,703],['Mohamed Salah','EGY','Liverpool','PNT',33,657],['Raphinha','BRA','Barcelona','PNT',28,620],['Achraf Hakimi','MAR','Paris Saint-Germain','ZAG',27,484],['Kylian Mbappé','FRA','Real Madrid','ATA',26,378],['Cole Palmer','ENG','Chelsea','MEI',23,211],['Gianluigi Donnarumma','ITA','Manchester City','GOL',26,172],['Nuno Mendes','POR','Paris Saint-Germain','ZAG',23,171]]};

/* ============================================================
   CRAQUES REAIS ATIVOS — histórico de conquistas até 2025 (aproximado).
   [nome, títulos da Champions (anos), Copas do Mundo, Libertadores, Mundiais de clubes, ligas nacionais, gols, jogos]
   A Bola de Ouro vem da tabela BDO_REAL. Quem não está aqui começa sem títulos e acumula daqui para frente.
   ============================================================ */
const STARS=[
['Kylian Mbappé',[],[2018],[],[],6,350,560],['Mohamed Salah',[2019],[],[],[2019],2,330,700],['Erling Haaland',[2023],[],[],[2023],4,290,380],
['Virgil van Dijk',[2019],[],[],[2019],3,35,600],['Jude Bellingham',[2024],[],[],[2024],1,70,270],['Rodri',[2023],[],[],[2023],4,45,560],
['Ousmane Dembélé',[2025],[2018],[],[],4,120,500],['Alisson Becker',[2019],[],[],[2019],2,0,600],['Gianluigi Donnarumma',[2025],[],[],[],3,0,500],
['Florian Wirtz',[],[],[],[],1,60,210],['Thibaut Courtois',[2022,2024],[],[],[2018,2023],7,0,650],['Federico Valverde',[2022,2024],[],[],[2023],3,45,400],
['Pedri',[],[],[],[],2,35,260],['Raphinha',[],[],[],[],1,110,500],['Lamine Yamal',[],[],[],[],1,35,130],['Joshua Kimmich',[2020],[],[],[2020],10,70,600],
['Harry Kane',[],[],[],[],1,450,700],['Achraf Hakimi',[2025],[],[],[2017],5,60,420],['Vitinha',[2025],[],[],[],3,40,280],['Lautaro Martínez',[],[2022],[],[],2,200,420],
['Jamal Musiala',[],[],[],[],4,70,230],['Alexis Mac Allister',[],[2022],[],[],1,50,330],['Frenkie de Jong',[],[],[],[],4,30,430],['Julián Álvarez',[2023],[2022],[],[2023],3,120,280],
['Alessandro Bastoni',[],[],[],[],2,20,340],['Nicolò Barella',[],[],[],[],2,50,390],['Mike Maignan',[],[],[],[],2,0,330],['Kevin De Bruyne',[2023],[],[],[2023],6,150,650],
['Marquinhos',[2025],[],[],[],10,35,600],['Khvicha Kvaratskhelia',[2025],[],[],[],2,50,230],['Victor Osimhen',[],[],[],[],2,130,310],['Rúben Dias',[2023],[],[],[2023],5,15,420],
['Antonio Rüdiger',[2021,2022,2024],[],[],[2022,2023],2,25,550],['Trent Alexander-Arnold',[2019],[],[],[2019],2,25,380],['Paulo Dybala',[],[2022],[],[],5,150,480],
['Phil Foden',[2023],[],[],[2023],6,90,350],['Ryan Gravenberch',[],[],[],[],3,20,220],['Emiliano Martínez',[],[2022],[],[],0,0,400],['Rodrygo',[2022,2024],[],[],[2023],2,80,330],
['Dani Carvajal',[2014,2016,2017,2018,2022,2024],[],[],[2014,2016,2017,2018,2023],4,25,500],['David de Gea',[],[],[],[],2,0,600],['Luis Díaz',[],[],[],[],3,110,400],
['Ederson',[2023],[],[],[2023],7,0,500],["N'Golo Kanté",[2021],[2018],[],[2022],3,15,500],['Désiré Doué',[2025],[],[],[],1,15,70],['João Neves',[2025],[],[],[],2,10,90],
['Marc-André ter Stegen',[2015],[],[],[],10,0,450],['Éder Militão',[2022,2024],[],[],[2023],2,15,320],['Aurélien Tchouaméni',[2022,2024],[],[],[2023],3,10,300],
['Bernardo Silva',[2023],[],[],[2023],8,90,550],['João Cancelo',[2023],[],[],[2023],8,30,430],['Cole Palmer',[2023],[],[],[2023,2025],1,60,150],['Declan Rice',[],[],[],[],0,40,420],
['Martin Ødegaard',[],[],[],[],0,60,430],['Bukayo Saka',[],[],[],[],0,70,350],['Moisés Caicedo',[],[],[],[2025],0,15,260],['Enzo Fernández',[],[2022],[],[2025],1,30,240],
['Marcus Thuram',[],[],[],[],2,100,350],['Jules Koundé',[],[],[],[],2,15,360],['Gregor Kobel',[],[],[],[],0,0,300],['Harry Maguire',[],[],[],[],0,10,400]
].map(([n,ucl,wc,lib,mc,lg,g,ap])=>({n,ucl,wc,lib,mc,lg,g,ap}));
const STAR_BY=(()=>{const m={};STARS.forEach(s=>{m[s.n]=s});return m})();
/* conquistas reais de um jogador pelo nome: [{k,y}] com Bola de Ouro (BDO_REAL) + tabela acima */
function honorsOf(n){
  const o=[],s=STAR_BY[n];
  BDO_REAL.forEach(z=>{if(z.n==n)o.push({k:'bo',y:z.y})});
  if(s){['ucl','wc','lib','mc'].forEach(k=>s[k].forEach(y=>o.push({k,y})));for(let i=0;i<s.lg;i++)o.push({k:'lig',y:''})}
  return o;
}
