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

/* >>> NAT_H (gerado por tools/build_champs.py; não editar à mão) */
/* Campeões reais das ligas e copas nacionais (1970-2025): ano|campeão|vice. Na Argentina há vários campeões por ano (um por torneio). */
const NAT_H={
 ENG:{
  lig:rowsOf(`
1970|Everton|Leeds United
1971|Arsenal|Leeds United
1972|Derby County|Leeds United
1973|Liverpool|Arsenal
1974|Leeds United|Liverpool
1975|Derby County|Liverpool
1976|Liverpool|Manchester United
1977|Liverpool|Manchester City
1978|Nottingham Forest|Liverpool
1979|Liverpool|Nottingham Forest
1980|Liverpool|Manchester United
1981|Aston Villa|Ipswich Town
1982|Liverpool|Ipswich Town
1983|Liverpool|Watford
1984|Liverpool|Southampton
1985|Everton|Liverpool
1986|Liverpool|Everton
1987|Everton|Liverpool
1988|Liverpool|Manchester United
1989|Arsenal|Liverpool
1990|Liverpool|Aston Villa
1991|Arsenal|Liverpool
1992|Leeds United|Manchester United
1993|Manchester United|Aston Villa
1994|Manchester United|Blackburn Rovers
1995|Blackburn Rovers|Manchester United
1996|Manchester United|Newcastle United
1997|Manchester United|Newcastle United
1998|Arsenal|Manchester United
1999|Manchester United|Arsenal
2000|Manchester United|Arsenal
2001|Manchester United|Arsenal
2002|Arsenal|Liverpool
2003|Manchester United|Arsenal
2004|Arsenal|Chelsea
2005|Chelsea|Arsenal
2006|Chelsea|Manchester United
2007|Manchester United|Chelsea
2008|Manchester United|Chelsea
2009|Manchester United|Liverpool
2010|Chelsea|Manchester United
2011|Manchester United|Chelsea
2012|Manchester City|Manchester United
2013|Manchester United|Manchester City
2014|Manchester City|Liverpool
2015|Chelsea|Manchester City
2016|Leicester City|Arsenal
2017|Chelsea|Tottenham Hotspur
2018|Manchester City|Manchester United
2019|Manchester City|Liverpool
2020|Liverpool|Manchester City
2021|Manchester City|Manchester United
2022|Manchester City|Liverpool
2023|Manchester City|Arsenal
2024|Manchester City|Arsenal
2025|Liverpool|Arsenal
`),
  dom:rowsOf(`
1970|Chelsea|Leeds United
1971|Arsenal|Liverpool
1972|Leeds United|Arsenal
1973|Sunderland|Leeds United
1974|Liverpool|Newcastle United
1975|West Ham United|Fulham
1976|Southampton|Manchester United
1977|Manchester United|Liverpool
1978|Ipswich Town|Arsenal
1979|Arsenal|Manchester United
1980|West Ham United|Arsenal
1981|Tottenham Hotspur|Manchester City
1982|Tottenham Hotspur
1983|Manchester United|Brighton
1984|Everton|Watford
1985|Manchester United|Everton
1986|Liverpool|Everton
1987|Coventry City|Tottenham Hotspur
1988|Wimbledon|Liverpool
1989|Liverpool|Everton
1990|Manchester United|Crystal Palace
1991|Tottenham Hotspur|Nottingham Forest
1992|Liverpool|Sunderland
1993|Arsenal|Sheffield Wednesday
1994|Manchester United|Chelsea
1995|Everton|Manchester United
1996|Manchester United|Liverpool
1997|Chelsea|Middlesbrough
1998|Arsenal|Newcastle United
1999|Manchester United|Newcastle United
2000|Chelsea|Aston Villa
2001|Liverpool|Arsenal
2002|Arsenal|Chelsea
2003|Arsenal|Southampton
2004|Manchester United|Millwall
2005|Arsenal|Manchester United
2006|Liverpool|West Ham United
2007|Chelsea|Manchester United
2008|Portsmouth|Cardiff City
2009|Chelsea|Everton
2010|Chelsea|Portsmouth
2011|Manchester City|Stoke City
2012|Chelsea|Liverpool
2013|Wigan Athletic|Manchester City
2014|Arsenal|Hull City
2015|Arsenal|Aston Villa
2016|Manchester United|Crystal Palace
2017|Arsenal|Chelsea
2018|Chelsea|Manchester United
2019|Manchester City|Watford
2020|Arsenal|Chelsea
2021|Leicester City|Chelsea
2022|Liverpool|Chelsea
2023|Manchester City|Manchester United
2024|Manchester United|Manchester City
2025|Crystal Palace|Manchester City
`),
 },
 ESP:{
  lig:rowsOf(`
1970|Atlético de Madrid|Athletic Bilbao
1971|Valencia|Barcelona
1972|Real Madrid|Valencia
1973|Atlético de Madrid|Barcelona
1974|Barcelona|Atlético de Madrid
1975|Real Madrid|Real Zaragoza
1976|Real Madrid|Barcelona
1977|Atlético de Madrid|Barcelona
1978|Real Madrid|Barcelona
1979|Real Madrid|Sporting de Gijón
1980|Real Madrid|Real Sociedad
1981|Real Sociedad|Real Madrid
1982|Real Sociedad|Barcelona
1983|Athletic Bilbao|Real Madrid
1984|Athletic Bilbao|Real Madrid
1985|Barcelona|Atlético de Madrid
1986|Real Madrid|Barcelona
1987|Real Madrid|Barcelona
1988|Real Madrid|Real Sociedad
1989|Real Madrid|Barcelona
1990|Real Madrid|Valencia
1991|Barcelona|Atlético de Madrid
1992|Barcelona|Real Madrid
1993|Barcelona|Real Madrid
1994|Barcelona|Deportivo La Coruña
1995|Real Madrid|Deportivo La Coruña
1996|Atlético de Madrid|Valencia
1997|Real Madrid|Barcelona
1998|Barcelona|Athletic Bilbao
1999|Barcelona|Real Madrid
2000|Deportivo La Coruña|Barcelona
2001|Real Madrid|Deportivo La Coruña
2002|Valencia|Deportivo La Coruña
2003|Real Madrid|Real Sociedad
2004|Valencia|Barcelona
2005|Barcelona|Real Madrid
2006|Barcelona|Real Madrid
2007|Real Madrid|Barcelona
2008|Real Madrid|Villarreal
2009|Barcelona|Real Madrid
2010|Barcelona|Real Madrid
2011|Barcelona|Real Madrid
2012|Real Madrid|Barcelona
2013|Barcelona|Real Madrid
2014|Atlético de Madrid|Barcelona
2015|Barcelona|Real Madrid
2016|Barcelona|Real Madrid
2017|Real Madrid|Barcelona
2018|Barcelona|Atlético de Madrid
2019|Barcelona|Atlético de Madrid
2020|Real Madrid|Barcelona
2021|Atlético de Madrid|Real Madrid
2022|Real Madrid|Barcelona
2023|Barcelona|Real Madrid
2024|Real Madrid|Barcelona
2025|Barcelona|Real Madrid
`),
  dom:rowsOf(`
1970|Real Madrid|Valencia
1971|Barcelona|Valencia
1972|Atlético de Madrid|Valencia
1973|Athletic Bilbao|Castellón
1974|Real Madrid|Barcelona
1975|Real Madrid|Atlético de Madrid
1976|Atlético de Madrid|Real Zaragoza
1977|Real Betis|Athletic Bilbao
1978|Barcelona|Las Palmas
1979|Valencia|Real Madrid
1980|Real Madrid|Castilla
1981|Barcelona|Sporting de Gijón
1982|Real Madrid|Sporting de Gijón
1983|Barcelona|Real Madrid
1984|Athletic Bilbao|Barcelona
1985|Atlético de Madrid|Athletic Bilbao
1986|Real Zaragoza|Barcelona
1987|Real Sociedad|Atlético de Madrid
1988|Barcelona|Real Sociedad
1989|Real Madrid|Real Valladolid
1990|Barcelona|Real Madrid
1991|Atlético de Madrid|Mallorca
1992|Atlético de Madrid|Real Madrid
1993|Real Madrid|Real Zaragoza
1994|Real Zaragoza|Celta de Vigo
1995|Deportivo La Coruña|Valencia
1996|Atlético de Madrid|Barcelona
1997|Barcelona|Real Betis
1998|Barcelona|Mallorca
1999|Valencia|Atlético de Madrid
2000|Espanyol|Atlético de Madrid
2001|Real Zaragoza|Celta de Vigo
2002|Deportivo La Coruña|Real Madrid
2003|Mallorca|Recreativo
2004|Real Zaragoza|Real Madrid
2005|Real Betis|Osasuna
2006|Espanyol|Real Zaragoza
2007|Sevilla|Getafe
2008|Valencia|Getafe
2009|Barcelona|Athletic Bilbao
2010|Sevilla|Atlético de Madrid
2011|Real Madrid|Barcelona
2012|Barcelona|Athletic Bilbao
2013|Atlético de Madrid|Real Madrid
2014|Real Madrid|Barcelona
2015|Barcelona|Athletic Bilbao
2016|Barcelona|Sevilla
2017|Barcelona|Alavés
2018|Barcelona|Sevilla
2019|Valencia|Barcelona
2020|Real Sociedad|Athletic Bilbao
2021|Barcelona|Athletic Bilbao
2022|Real Betis|Valencia
2023|Real Madrid|Osasuna
2024|Athletic Bilbao|Mallorca
2025|Barcelona|Real Madrid
`),
 },
 ITA:{
  lig:rowsOf(`
1970|Cagliari|Inter
1971|Inter|Milan
1972|Juventus
1973|Juventus|Milan
1974|Lazio|Juventus
1975|Juventus|Napoli
1976|Torino|Juventus
1977|Juventus|Torino
1978|Juventus
1979|Milan|Perugia
1980|Inter|Juventus
1981|Juventus|Roma
1982|Juventus|Fiorentina
1983|Roma|Juventus
1984|Juventus|Roma
1985|Hellas Verona|Torino
1986|Juventus|Roma
1987|Napoli|Juventus
1988|Milan|Napoli
1989|Inter|Napoli
1990|Napoli|Milan
1991|Sampdoria|Milan
1992|Milan|Juventus
1993|Milan|Inter
1994|Milan|Juventus
1995|Juventus|Parma
1996|Milan|Juventus
1997|Juventus|Parma
1998|Juventus|Inter
1999|Milan|Lazio
2000|Lazio|Juventus
2001|Roma|Juventus
2002|Juventus|Roma
2003|Juventus|Inter
2004|Milan|Roma
2005|Juventus|Milan
2006|Inter|Roma
2007|Inter|Roma
2008|Inter|Roma
2009|Inter|Juventus
2010|Inter|Roma
2011|Milan|Inter
2012|Juventus|Milan
2013|Juventus|Napoli
2014|Juventus|Roma
2015|Juventus|Roma
2016|Juventus|Napoli
2017|Juventus|Roma
2018|Juventus|Napoli
2019|Juventus|Napoli
2020|Juventus|Inter
2021|Inter|Milan
2022|Milan|Inter
2023|Napoli|Lazio
2024|Inter|Milan
2025|Napoli|Inter
`),
  dom:rowsOf(`
1970|Bologna|Torino
1971|Torino|Milan
1972|Milan|Napoli
1973|Milan|Juventus
1974|Bologna|Palermo
1975|Fiorentina|Milan
1976|Napoli|Hellas Verona
1977|Milan|Inter
1978|Inter|Napoli
1979|Juventus|Palermo
1980|Roma|Torino
1981|Roma|Torino
1982|Inter|Torino
1983|Juventus|Hellas Verona
1984|Roma|Hellas Verona
1985|Sampdoria|Milan
1986|Roma|Sampdoria
1987|Napoli|Atalanta
1988|Sampdoria|Torino
1989|Sampdoria|Napoli
1990|Juventus|Milan
1991|Roma|Sampdoria
1992|Parma|Juventus
1993|Torino|Roma
1994|Sampdoria|Ancona
1995|Juventus|Parma
1996|Fiorentina|Atalanta
1997|Vicenza|Napoli
1998|Lazio|Milan
1999|Parma|Fiorentina
2000|Lazio|Inter
2001|Fiorentina|Parma
2002|Parma|Juventus
2003|Milan|Roma
2004|Lazio|Juventus
2005|Inter|Roma
2006|Inter|Roma
2007|Roma|Inter
2008|Roma|Inter
2009|Lazio|Sampdoria
2010|Inter|Roma
2011|Inter|Palermo
2012|Napoli|Juventus
2013|Lazio|Roma
2014|Napoli|Fiorentina
2015|Juventus|Lazio
2016|Juventus|Milan
2017|Juventus|Lazio
2018|Juventus|Milan
2019|Lazio|Atalanta
2020|Napoli|Juventus
2021|Juventus|Atalanta
2022|Inter|Juventus
2023|Inter|Fiorentina
2024|Juventus|Atalanta
2025|Bologna|Milan
`),
 },
 GER:{
  lig:rowsOf(`
1970|Mönchengladbach|Bayern München
1971|Mönchengladbach|Bayern München
1972|Bayern München
1973|Bayern München
1974|Bayern München|Mönchengladbach
1975|Mönchengladbach|Hertha BSC
1976|Mönchengladbach|Hamburger SV
1977|Mönchengladbach
1978|Mönchengladbach
1979|Hamburger SV|VfB Stuttgart
1980|Bayern München|Hamburger SV
1981|Bayern München|Hamburger SV
1982|Hamburger SV
1983|Hamburger SV|Werder Bremen
1984|VfB Stuttgart|Hamburger SV
1985|Bayern München|Werder Bremen
1986|Bayern München|Werder Bremen
1987|Bayern München|Hamburger SV
1988|Werder Bremen|Bayern München
1989|Bayern München
1990|Bayern München
1991|Bayern München
1992|VfB Stuttgart|Borussia Dortmund
1993|Werder Bremen|Bayern München
1994|Bayern München
1995|Borussia Dortmund|Werder Bremen
1996|Borussia Dortmund|Bayern München
1997|Bayern München|Bayer Leverkusen
1998|Bayern München
1999|Bayern München|Bayer Leverkusen
2000|Bayern München|Bayer Leverkusen
2001|Bayern München
2002|Borussia Dortmund|Bayer Leverkusen
2003|Bayern München|VfB Stuttgart
2004|Werder Bremen|Bayern München
2005|Bayern München
2006|Bayern München|Werder Bremen
2007|VfB Stuttgart
2008|Bayern München|Werder Bremen
2009|Wolfsburg|Bayern München
2010|Bayern München
2011|Borussia Dortmund|Bayer Leverkusen
2012|Borussia Dortmund|Bayern München
2013|Bayern München|Borussia Dortmund
2014|Bayern München|Borussia Dortmund
2015|Bayern München|Wolfsburg
2016|Bayern München|Borussia Dortmund
2017|Bayern München|RB Leipzig
2018|Bayern München
2019|Bayern München|Borussia Dortmund
2020|Bayern München|Borussia Dortmund
2021|Bayern München|RB Leipzig
2022|Bayern München|Borussia Dortmund
2023|Bayern München|Borussia Dortmund
2024|Bayer Leverkusen|VfB Stuttgart
2025|Bayern München|Bayer Leverkusen
`),
  dom:rowsOf(`
1970|Kickers Offenbach
1971|Bayern München
1973|Mönchengladbach
1974|Eintracht Frankfurt|Hamburger SV
1975|Eintracht Frankfurt|MSV Duisburg
1976|Hamburger SV
1977|Hertha BSC
1978|Fortuna Düsseldorf
1979|Fortuna Düsseldorf|Hertha BSC
1980|Fortuna Düsseldorf
1981|Eintracht Frankfurt
1982|Bayern München
1983|Fortuna Köln
1984|Bayern München|Mönchengladbach
1985|Bayer Uerdingen|Bayern München
1986|Bayern München|VfB Stuttgart
1987|Hamburger SV|Stuttgarter Kickers
1988|Eintracht Frankfurt|VfL Bochum
1989|Borussia Dortmund|Werder Bremen
1990|Werder Bremen
1991|Werder Bremen
1992|Mönchengladbach
1993|Bayer Leverkusen|Hertha BSC Amateure
1994|Werder Bremen|Rot-Weiss Essen
1995|Mönchengladbach|Wolfsburg
1996|Karlsruher SC
1997|VfB Stuttgart|Energie Cottbus
1998|Bayern München|MSV Duisburg
1999|Werder Bremen|Bayern München
2000|Bayern München|Werder Bremen
2001|Union Berlin
2002|Bayer Leverkusen
2003|Bayern München
2004|Werder Bremen|Alemannia Aachen
2005|Bayern München
2006|Bayern München|Eintracht Frankfurt
2007|VfB Stuttgart
2008|Bayern München|Borussia Dortmund
2009|Werder Bremen|Bayer Leverkusen
2010|Bayern München|Werder Bremen
2011|MSV Duisburg
2012|Borussia Dortmund|Bayern München
2013|Bayern München|VfB Stuttgart
2014|Bayern München|Borussia Dortmund
2015|Wolfsburg|Borussia Dortmund
2016|Bayern München|Borussia Dortmund
2017|Borussia Dortmund|Eintracht Frankfurt
2018|Eintracht Frankfurt|Bayern München
2019|Bayern München|RB Leipzig
2020|Bayern München|Bayer Leverkusen
2021|Borussia Dortmund|RB Leipzig
2022|RB Leipzig|Freiburg
2023|RB Leipzig|Eintracht Frankfurt
2024|Bayer Leverkusen
2025|VfB Stuttgart|Arminia Bielefeld
`),
 },
 FRA:{
  lig:rowsOf(`
1970|Saint-Étienne|Marseille
1971|Marseille|Saint-Étienne
1972|Marseille|Nîmes
1973|Nantes|Nice
1974|Saint-Étienne|Nantes
1975|Saint-Étienne|Marseille
1976|Saint-Étienne|Nice
1977|Nantes|Lens
1978|Monaco|Nantes
1979|Strasbourg|Nantes
1980|Nantes|Sochaux
1981|Saint-Étienne|Nantes
1982|Monaco|Saint-Étienne
1983|Nantes|Bordeaux
1984|Bordeaux|Monaco
1985|Bordeaux|Nantes
1986|Paris Saint-Germain|Nantes
1987|Bordeaux|Marseille
1988|Monaco|Bordeaux
1989|Marseille|Paris Saint-Germain
1990|Marseille|Bordeaux
1991|Marseille|Monaco
1992|Marseille|Monaco
1993|Paris Saint-Germain
1994|Paris Saint-Germain|Marseille
1995|Nantes|Lyon
1996|Auxerre|Paris Saint-Germain
1997|Monaco|Paris Saint-Germain
1998|Lens|Metz
1999|Bordeaux|Marseille
2000|Monaco|Paris Saint-Germain
2001|Nantes|Lyon
2002|Lyon|Lens
2003|Lyon|Monaco
2004|Lyon|Paris Saint-Germain
2005|Lyon|Lille
2006|Lyon|Bordeaux
2007|Lyon|Marseille
2008|Lyon|Bordeaux
2009|Bordeaux|Marseille
2010|Marseille|Lyon
2011|Lille|Marseille
2012|Montpellier|Paris Saint-Germain
2013|Paris Saint-Germain|Marseille
2014|Paris Saint-Germain|Monaco
2015|Paris Saint-Germain|Lyon
2016|Paris Saint-Germain|Lyon
2017|Monaco|Paris Saint-Germain
2018|Paris Saint-Germain|Monaco
2019|Paris Saint-Germain|Lille
2020|Paris Saint-Germain|Marseille
2021|Lille|Paris Saint-Germain
2022|Paris Saint-Germain|Marseille
2023|Paris Saint-Germain|Lens
2024|Paris Saint-Germain|Monaco
2025|Paris Saint-Germain|Marseille
`),
  dom:rowsOf(`
1970|Saint-Étienne|Nantes
1971|Rennes|Lyon
1972|Marseille|Bastia
1973|Lyon|Nantes
1974|Saint-Étienne|Monaco
1975|Saint-Étienne|Lens
1976|Marseille|Lyon
1977|Saint-Étienne|Reims
1978|AS Nancy Lorraine|Nice
1979|Nantes|Auxerre
1980|Monaco|Orléans
1981|Bastia|Saint-Étienne
1982|Paris Saint-Germain|Saint-Étienne
1983|Paris Saint-Germain|Nantes
1984|Metz|Monaco
1985|Monaco|Paris Saint-Germain
1986|Bordeaux|Marseille
1987|Bordeaux|Marseille
1988|Metz|Sochaux
1989|Marseille|Monaco
1990|Montpellier|RC Paris
1991|Monaco|Marseille
1993|Paris Saint-Germain|Nantes
1994|Auxerre|Montpellier
1995|Paris Saint-Germain|Strasbourg
1996|Auxerre|Nîmes
1997|Nice|Guingamp
1998|Paris Saint-Germain|Lens
1999|Nantes|Sedan
2000|Nantes|Calais RUFC
2001|Strasbourg|Amiens
2002|Lorient|Bastia
2003|Auxerre|Paris Saint-Germain
2004|Paris Saint-Germain|LB Châteauroux
2005|Auxerre|CS Sedan
2006|Paris Saint-Germain|Marseille
2007|Sochaux|Marseille
2008|Lyon|Paris Saint-Germain
2009|Guingamp|Rennes
2010|Paris Saint-Germain|Monaco
2011|Lille|Paris Saint-Germain
2012|Lyon|US Quevilly
2013|Bordeaux|Evian
2014|Guingamp|Rennes
2015|Paris Saint-Germain|Auxerre
2016|Paris Saint-Germain|Marseille
2017|Paris Saint-Germain|Angers
2018|Paris Saint-Germain|Les Herbiers
2019|Rennes|Paris Saint-Germain
2020|Paris Saint-Germain|Saint-Étienne
2021|Paris Saint-Germain|Monaco
2022|Nantes|Nice
2023|Toulouse|Nantes
2024|Paris Saint-Germain|Lyon
2025|Paris Saint-Germain|Reims
`),
 },
 POR:{
  lig:rowsOf(`
1970|Sporting CP|Benfica
1971|Benfica|Sporting CP
1972|Benfica|Vitória de Setúbal
1973|Benfica|Belenenses
1974|Sporting CP|Benfica
1975|Benfica|Porto
1976|Benfica|Boavista
1977|Benfica|Sporting CP
1978|Porto|Benfica
1979|Porto|Benfica
1980|Sporting CP|Porto
1981|Benfica|Porto
1982|Sporting CP|Benfica
1983|Benfica|Porto
1984|Benfica|Porto
1985|Porto|Sporting CP
1986|Porto|Benfica
1987|Benfica|Porto
1988|Porto|Benfica
1989|Benfica|Porto
1990|Porto|Benfica
1991|Benfica|Porto
1992|Porto|Benfica
1993|Porto|Benfica
1994|Benfica|Porto
1995|Porto|Sporting CP
1996|Porto|Benfica
1997|Porto|Sporting CP
1998|Porto|Benfica
1999|Porto|Boavista
2000|Sporting CP|Porto
2001|Boavista|Porto
2002|Sporting CP|Boavista
2003|Porto|Benfica
2004|Porto|Benfica
2005|Benfica|Porto
2006|Porto|Sporting CP
2007|Porto|Sporting CP
2008|Porto|Sporting CP
2009|Porto|Sporting CP
2010|Benfica|Braga
2011|Porto|Benfica
2012|Porto|Benfica
2013|Porto|Benfica
2014|Benfica|Sporting CP
2015|Benfica|Porto
2016|Benfica|Sporting CP
2017|Benfica|Porto
2018|Porto|Benfica
2019|Benfica|Porto
2020|Porto|Benfica
2021|Sporting CP|Porto
2022|Porto|Sporting CP
2023|Benfica|Porto
2024|Sporting CP|Benfica
2025|Sporting CP|Benfica
`),
  dom:rowsOf(`
1970|Benfica|Sporting CP
1971|Sporting CP|Benfica
1972|Benfica|Sporting CP
1973|Sporting CP|Vitória de Setúbal
1974|Sporting CP|Benfica
1975|Boavista|Benfica
1976|Boavista|Vitória SC
1977|Porto|Braga
1978|Sporting CP|Porto
1979|Boavista|Sporting CP
1980|Benfica|Porto
1981|Benfica|Porto
1982|Sporting CP|Braga
1983|Benfica|Porto
1984|Porto|Rio Ave
1985|Benfica|Porto
1986|Benfica|Belenenses
1987|Benfica|Sporting CP
1988|Porto|Vitória SC
1989|Belenenses|Benfica
1990|Estrela|Farense
1991|Porto|Beira-Mar
1992|Boavista|Porto
1993|Benfica|Boavista
1994|Porto|Sporting CP
1995|Sporting CP|Marítimo
1996|Benfica|Sporting CP
1997|Boavista|Benfica
1998|Porto|Braga
1999|Beira-Mar|Campomaiorense
2000|Porto|Sporting CP
2001|Porto|Marítimo
2002|Sporting CP|Leixões
2003|Porto|União de Leiria
2004|Benfica|Porto
2005|Vitória de Setúbal|Benfica
2006|Porto|Vitória de Setúbal
2007|Sporting CP|Belenenses
2008|Sporting CP|Porto
2009|Porto|Paços de Ferreira
2010|Porto|Chaves
2011|Porto|Vitória SC
2012|Académica|Sporting CP
2013|Vitória SC|Benfica
2014|Benfica|Rio Ave
2015|Sporting CP|Braga
2016|Braga|Porto
2017|Benfica|Vitória SC
2018|Aves|Sporting CP
2019|Sporting CP|Porto
2020|Porto|Benfica
2021|Braga|Benfica
2022|Porto|Tondela
2023|Porto|Braga
2024|Porto|Sporting CP
2025|Sporting CP|Benfica
`),
 },
 NED:{
  lig:rowsOf(`
1970|Ajax
1971|Feyenoord
1972|Ajax
1973|Ajax
1974|Feyenoord
1975|PSV
1976|PSV
1977|Ajax
1978|PSV
1979|Ajax
1980|Ajax
1982|Ajax
1983|Ajax
1984|Feyenoord
1985|Ajax
1986|PSV
1987|PSV
1988|PSV
1989|PSV
1990|Ajax
1991|PSV
1992|PSV
1993|Feyenoord
1994|Ajax
1995|Ajax
1996|Ajax
1997|PSV
1998|Ajax
1999|Feyenoord
2000|PSV
2001|PSV
2002|Ajax
2003|PSV
2004|Ajax
2005|PSV
2006|PSV
2007|PSV
2008|PSV
2009|AZ Alkmaar
2010|Twente
2011|Ajax
2012|Ajax
2013|Ajax
2014|Ajax
2015|PSV
2016|PSV
2017|Feyenoord
2018|PSV
2019|Ajax
2021|Ajax
2022|Ajax
2023|Feyenoord
2024|PSV
2025|PSV
`),
  dom:rowsOf(`
1970|Ajax
1971|Ajax
1972|Ajax
1973|NAC Breda
1974|PSV
1975|ADO Den Haag
1976|PSV
1977|Twente
1979|Ajax
1980|Feyenoord
1982|Utrecht
1983|Ajax
1984|Feyenoord
1985|Utrecht
1986|Ajax
1987|Ajax
1988|PSV
1989|PSV
1990|PSV
1991|Feyenoord
1992|Feyenoord
1993|Ajax
1994|Feyenoord
1995|Feyenoord
1996|PSV
1997|Roda JC
1998|Ajax
1999|Ajax
2000|Roda JC
2001|Twente|PSV
2002|Ajax
2003|Utrecht
2004|Utrecht
2005|PSV|Willem II
2006|Ajax
2007|Ajax
2008|Feyenoord
2009|Heerenveen
2010|Ajax
2011|Twente
2012|PSV
2013|AZ Alkmaar
2014|PEC Zwolle
2015|Groningen
2016|Feyenoord
2017|Vitesse
2018|Feyenoord
2019|Ajax
2021|Ajax
2022|PSV
2023|PSV
2024|Feyenoord
2025|Go Ahead Eagles
`),
 },
 ARG:{
  lig:rowsOf(`
1970|Independiente|Boca Juniors
1971|Independiente|Rosario Central
1972|San Lorenzo
1973|Huracán|Rosario Central
1974|Newell's Old Boys|San Lorenzo
1975|River Plate
1976|Boca Juniors
1977|River Plate|Independiente
1978|Quilmes|Independiente
1979|River Plate
1980|River Plate|Rosario Central
1981|Boca Juniors|River Plate
1982|Estudiantes|Ferro Carril Oeste
1983|Independiente|Estudiantes
1984|Argentinos Juniors|Ferro Carril Oeste
1985|Argentinos Juniors
1986|River Plate
1987|Rosario Central
1988|Newell's Old Boys
1989|Independiente
1990|River Plate
1991|Newell's Old Boys|River Plate
1992|Newell's Old Boys|Boca Juniors
1993|Vélez Sarsfield|River Plate
1994|Independiente|River Plate
1995|San Lorenzo|Vélez Sarsfield
1996|Vélez Sarsfield|River Plate
1997|River Plate
1998|Vélez Sarsfield|Boca Juniors
1999|Boca Juniors|River Plate
2000|River Plate|Boca Juniors
2001|San Lorenzo|Racing Club
2002|River Plate|Independiente
2003|River Plate|Boca Juniors
2004|River Plate|Newell's Old Boys
2005|Vélez Sarsfield|Boca Juniors
2006|Boca Juniors|Estudiantes
2007|San Lorenzo|Lanús
2008|River Plate|Boca Juniors
2009|Vélez Sarsfield|Banfield
2010|Argentinos Juniors|Estudiantes
2011|Vélez Sarsfield|Boca Juniors
2012|Arsenal|Vélez Sarsfield
2013|Newell's Old Boys|Vélez Sarsfield|San Lorenzo
2014|River Plate|Racing Club
2015|Boca Juniors
2016|Lanús
2017|Boca Juniors
2018|Boca Juniors
2019|Racing Club
2020|Boca Juniors
2021|River Plate
2022|Boca Juniors
2023|River Plate
2024|Vélez Sarsfield
2025|Platense|Estudiantes|Rosario Central
`),
  dom:rowsOf(`
2012|Boca Juniors|Racing Club
2013|Arsenal|San Lorenzo
2014|Huracán|Rosario Central
2015|Boca Juniors|Rosario Central
2016|River Plate|Rosario Central
2017|River Plate|Atlético Tucumán
2018|Rosario Central|Gimnasia La Plata
2019|River Plate|Central Córdoba (Santiago del Estero)
2020|Boca Juniors|Talleres
2022|Patronato|Talleres
2023|Estudiantes|Defensa y Justicia
2024|Central Córdoba (Santiago del Estero)|Vélez Sarsfield
2025|Independiente Rivadavia|Argentinos Juniors
`),
 },
 TUR:{
  lig:rowsOf(`
1970|Fenerbahçe|Eskişehirspor
1971|Galatasaray|Fenerbahçe
1972|Galatasaray|Eskişehirspor
1973|Galatasaray|Fenerbahçe
1974|Fenerbahçe|Beşiktaş
1975|Fenerbahçe|Galatasaray
1976|Trabzonspor|Fenerbahçe
1977|Trabzonspor|Fenerbahçe
1978|Fenerbahçe|Trabzonspor
1979|Trabzonspor|Galatasaray
1980|Trabzonspor|Fenerbahçe
1981|Trabzonspor|Adanaspor
1982|Beşiktaş|Trabzonspor
1983|Fenerbahçe|Trabzonspor
1984|Trabzonspor|Fenerbahçe
1985|Fenerbahçe|Beşiktaş
1986|Beşiktaş|Galatasaray
1987|Galatasaray|Beşiktaş
1988|Galatasaray|Beşiktaş
1989|Fenerbahçe|Beşiktaş
1990|Beşiktaş|Fenerbahçe
1991|Beşiktaş|Galatasaray
1992|Beşiktaş|Fenerbahçe
1993|Galatasaray|Beşiktaş
1994|Galatasaray|Fenerbahçe
1995|Beşiktaş|Trabzonspor
1996|Fenerbahçe|Trabzonspor
1997|Galatasaray|Beşiktaş
1998|Galatasaray|Fenerbahçe
1999|Galatasaray|Beşiktaş
2000|Galatasaray|Beşiktaş
2001|Fenerbahçe|Galatasaray
2002|Galatasaray|Fenerbahçe
2003|Beşiktaş|Galatasaray
2004|Fenerbahçe|Trabzonspor
2005|Fenerbahçe|Trabzonspor
2006|Galatasaray|Fenerbahçe
2007|Fenerbahçe|Beşiktaş
2008|Galatasaray|Fenerbahçe
2009|Beşiktaş|Sivasspor
2010|Bursaspor|Fenerbahçe
2011|Fenerbahçe|Trabzonspor
2012|Galatasaray|Fenerbahçe
2013|Galatasaray|Fenerbahçe
2014|Fenerbahçe|Galatasaray
2015|Galatasaray|Fenerbahçe
2016|Beşiktaş|Fenerbahçe
2017|Beşiktaş|Başakşehir
2018|Galatasaray|Fenerbahçe
2019|Galatasaray|Başakşehir
2020|Başakşehir|Trabzonspor
2021|Beşiktaş|Galatasaray
2022|Trabzonspor|Fenerbahçe
2023|Galatasaray|Fenerbahçe
2024|Galatasaray|Fenerbahçe
2025|Galatasaray|Fenerbahçe
`),
  dom:rowsOf(`
1970|Eskişehirspor|Göztepe
1971|Bursaspor|Eskişehirspor
1972|Altay|Ankaragücü
1973|Galatasaray|Ankaragücü
1974|Bursaspor|Fenerbahçe
1975|Trabzonspor|Beşiktaş
1976|Trabzonspor|Galatasaray
1977|Trabzonspor|Beşiktaş
1978|Trabzonspor|Adana Demirspor
1979|Altay|Fenerbahçe
1980|Altay|Galatasaray
1981|Ankaragücü|Boluspor
1982|Galatasaray|Ankaragücü
1983|Fenerbahçe|Mersin İdman Yurdu
1984|Trabzonspor|Beşiktaş
1985|Trabzonspor|Galatasaray
1986|Bursaspor|Altay
1987|Gençlerbirliği|Eskişehirspor
1988|Sakaryaspor|Samsunspor
1989|Fenerbahçe|Beşiktaş
1990|Beşiktaş|Trabzonspor
1991|Galatasaray|Ankaragücü
1992|Bursaspor|Trabzonspor
1993|Galatasaray|Beşiktaş
1994|Galatasaray|Beşiktaş
1995|Galatasaray|Trabzonspor
1996|Galatasaray|Fenerbahçe
1997|Trabzonspor|Kocaelispor
1998|Beşiktaş|Galatasaray
1999|Galatasaray|Beşiktaş
2000|Galatasaray|Antalyaspor
2001|Gençlerbirliği|Fenerbahçe
2002|Kocaelispor|Beşiktaş
2003|Trabzonspor|Gençlerbirliği
2005|Galatasaray|Fenerbahçe
2006|Beşiktaş
2007|Kayseri Erciyesspor
2008|Kayserispor|Gençlerbirliği
2009|Beşiktaş|Fenerbahçe
2010|Trabzonspor
2011|Beşiktaş|Başakşehir
2012|Fenerbahçe|Bursaspor
2013|Trabzonspor
2014|Galatasaray|Eskişehirspor
2015|Bursaspor
2016|Fenerbahçe
2017|Konyaspor|Başakşehir
2018|Akhisar Belediyespor|Fenerbahçe
2019|Galatasaray|Akhisar Belediyespor
2020|Trabzonspor|Alanyaspor
2021|Beşiktaş|Antalyaspor
2022|Sivasspor|Kayserispor
2023|Fenerbahçe|Başakşehir
2024|Beşiktaş|Trabzonspor
2025|Galatasaray
`),
 },
 BRA:{
  lig:rowsOf(`
1970|Fluminense|Palmeiras
1971|Atlético Mineiro|São Paulo
1972|Palmeiras|Botafogo
1973|Palmeiras|São Paulo
1974|Vasco da Gama|Cruzeiro
1975|Internacional|Cruzeiro
1976|Internacional|Corinthians
1977|São Paulo|Atlético Mineiro
1978|Guarani|Palmeiras
1979|Internacional|Vasco da Gama
1980|Flamengo|Atlético Mineiro
1981|Grêmio|São Paulo
1982|Flamengo|Grêmio
1983|Flamengo|Santos
1984|Fluminense|Vasco da Gama
1985|Coritiba|Bangu
1986|São Paulo|Guarani
1987|Sport Recife|Guarani
1988|Bahia|Internacional
1989|Vasco da Gama|São Paulo
1990|Corinthians|São Paulo
1991|São Paulo|Bragantino
1992|Flamengo|Botafogo
1993|Palmeiras|Vitória
1994|Palmeiras|Corinthians
1995|Botafogo|Santos
1996|Grêmio|Portuguesa
1997|Vasco da Gama|Palmeiras
1998|Corinthians|Cruzeiro
1999|Corinthians|Atlético Mineiro
2000|Vasco da Gama|São Caetano
2001|Athletico Paranaense|São Caetano
2002|Santos|Corinthians
2003|Cruzeiro|Santos
2004|Santos|Athletico Paranaense
2005|Corinthians|Internacional
2006|São Paulo|Internacional
2007|São Paulo|Santos
2008|São Paulo|Grêmio
2009|Flamengo|Internacional
2010|Fluminense|Cruzeiro
2011|Corinthians|Vasco da Gama
2012|Fluminense|Atlético Mineiro
2013|Cruzeiro|Grêmio
2014|Cruzeiro|São Paulo
2015|Corinthians|Atlético Mineiro
2016|Palmeiras|Santos
2017|Corinthians|Palmeiras
2018|Palmeiras|Flamengo
2019|Flamengo|Santos
2020|Flamengo|Internacional
2021|Atlético Mineiro|Flamengo
2022|Palmeiras|Internacional
2023|Palmeiras|Grêmio
2024|Botafogo|Palmeiras
2025|Flamengo|Palmeiras
`),
  dom:rowsOf(`
1989|Grêmio
1990|Flamengo
1991|Criciúma
1992|Internacional
1993|Cruzeiro
1994|Grêmio
1995|Corinthians
1996|Cruzeiro
1997|Grêmio
1998|Palmeiras
1999|Juventude
2000|Cruzeiro
2001|Grêmio
2002|Corinthians
2003|Cruzeiro
2004|Santo André
2005|Paulista
2006|Flamengo
2007|Fluminense
2008|Sport Recife
2009|Corinthians
2010|Santos
2011|Vasco da Gama
2012|Palmeiras
2013|Flamengo
2014|Atlético Mineiro
2015|Palmeiras
2016|Grêmio
2017|Cruzeiro
2018|Cruzeiro
2019|Athletico Paranaense
2020|Palmeiras
2021|Atlético Mineiro
2022|Flamengo
2023|São Paulo
2024|Flamengo
2025|Corinthians
`),
 },
};
/* <<< NAT_H */
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
  if(s){
    ['ucl','wc','lib','mc'].forEach(k=>s[k].forEach(y=>o.push({k,y})));
    const ct=careerOf(n);ct.lig.forEach(z=>o.push(z));
    for(let i=ct.lig.length;i<s.lg;i++)o.push({k:'lig',y:''});   // ligas sem ano (fora do histórico dos 10 países)
    ct.dom.forEach(z=>o.push(z));
  }
  return o;
}
/* ============================================================
   CARREIRA POR CLUBE (aproximada): clube:temporada inicial-final (ano em que a temporada termina).
   Cruzada com NAT_H dá as ligas e copas nacionais que o jogador ganhou, com ano e clube (a partir de 1970).
   ============================================================ */
const CAR_H=(()=>{const m={};`
Lionel Messi|Barcelona:2005-2021;Paris Saint-Germain:2022-2023
Cristiano Ronaldo|Manchester United:2004-2009;Real Madrid:2010-2018;Juventus:2019-2021;Manchester United:2022-2022
Diego Maradona|Boca Juniors:1981-1981;Barcelona:1983-1984;Napoli:1985-1991;Boca Juniors:1996-1997
Johan Cruyff|Ajax:1970-1973;Barcelona:1974-1978;Ajax:1982-1983;Feyenoord:1984-1984
Ronaldo Nazário|PSV:1995-1996;Barcelona:1997-1997;Inter:1998-2002;Real Madrid:2003-2006;Milan:2007-2008;Corinthians:2009-2011
Franz Beckenbauer|Bayern München:1970-1977;Hamburger SV:1980-1982
Michel Platini|AS Nancy Lorraine:1973-1979;Saint-Étienne:1979-1982;Juventus:1983-1987
Zinedine Zidane|Cannes:1990-1992;Juventus:1997-2001;Real Madrid:2002-2006
Gerd Müller|Bayern München:1970-1979
Eusébio|Benfica:1970-1975
Marco van Basten|Ajax:1982-1987;Milan:1988-1993
Zico|Flamengo:1972-1983;Flamengo:1986-1989
Romário|Vasco da Gama:1985-1988;PSV:1989-1993;Barcelona:1994-1994;Flamengo:1995-1996;Vasco da Gama:1999-2000
Ronaldinho|Paris Saint-Germain:2002-2003;Barcelona:2004-2008;Milan:2009-2011;Flamengo:2011-2012;Atlético Mineiro:2012-2013
Kaká|Milan:2004-2009;Real Madrid:2010-2013;Milan:2014-2014
Thierry Henry|Monaco:1995-1999;Arsenal:2000-2007;Barcelona:2008-2010
Xavi|Barcelona:1999-2015
Andrés Iniesta|Barcelona:2003-2018
Roberto Baggio|Fiorentina:1988-1990;Juventus:1991-1995;Milan:1996-1997;Inter:1999-2000
Kylian Mbappé|Monaco:2016-2017;Paris Saint-Germain:2018-2024;Real Madrid:2025-2025
Mohamed Salah|Chelsea:2014-2014;Roma:2016-2017;Liverpool:2018-2025
Erling Haaland|Borussia Dortmund:2021-2022;Manchester City:2023-2025
Virgil van Dijk|Southampton:2016-2017;Liverpool:2018-2025
Jude Bellingham|Borussia Dortmund:2021-2023;Real Madrid:2024-2025
Rodri|Atlético de Madrid:2019-2019;Manchester City:2020-2025
Ousmane Dembélé|Borussia Dortmund:2017-2017;Barcelona:2018-2023;Paris Saint-Germain:2024-2025
Alisson Becker|Roma:2017-2017;Liverpool:2018-2025
Gianluigi Donnarumma|Milan:2016-2021;Paris Saint-Germain:2022-2025
Florian Wirtz|Bayer Leverkusen:2021-2025
Thibaut Courtois|Chelsea:2012-2018;Real Madrid:2019-2025
Federico Valverde|Real Madrid:2019-2025
Pedri|Barcelona:2021-2025
Raphinha|Leeds United:2021-2022;Barcelona:2023-2025
Lamine Yamal|Barcelona:2024-2025
Joshua Kimmich|Bayern München:2016-2025
Harry Kane|Bayern München:2024-2025
Achraf Hakimi|Real Madrid:2018-2019;Borussia Dortmund:2020-2020;Inter:2021-2021;Paris Saint-Germain:2022-2025
Vitinha|Porto:2020-2022;Paris Saint-Germain:2023-2025
Lautaro Martínez|Inter:2019-2025
Jamal Musiala|Bayern München:2020-2025
Alexis Mac Allister|Brighton:2020-2023;Liverpool:2024-2025
Frenkie de Jong|Ajax:2017-2019;Barcelona:2020-2025
Julián Álvarez|Manchester City:2023-2024;Atlético de Madrid:2025-2025
Alessandro Bastoni|Inter:2019-2025
Nicolò Barella|Inter:2020-2025
Mike Maignan|Lille:2019-2021;Milan:2022-2025
Kevin De Bruyne|Chelsea:2013-2014;Wolfsburg:2015-2015;Manchester City:2016-2025
Marquinhos|Paris Saint-Germain:2014-2025
Khvicha Kvaratskhelia|Napoli:2023-2024;Paris Saint-Germain:2025-2025
Victor Osimhen|Napoli:2021-2024
Rúben Dias|Benfica:2018-2020;Manchester City:2021-2025
Antonio Rüdiger|Chelsea:2018-2022;Real Madrid:2023-2025
Trent Alexander-Arnold|Liverpool:2017-2025
Paulo Dybala|Juventus:2016-2022;Roma:2023-2025
Phil Foden|Manchester City:2018-2025
Ryan Gravenberch|Ajax:2019-2022;Bayern München:2023-2023;Liverpool:2024-2025
Emiliano Martínez|Aston Villa:2021-2025
Rodrygo|Real Madrid:2020-2025
Dani Carvajal|Real Madrid:2014-2025
David de Gea|Manchester United:2012-2023
Luis Díaz|Porto:2020-2022;Liverpool:2022-2025
Ederson|Benfica:2016-2017;Manchester City:2018-2025
N'Golo Kanté|Leicester City:2015-2016;Chelsea:2017-2023
Désiré Doué|Paris Saint-Germain:2025-2025
João Neves|Benfica:2023-2024;Paris Saint-Germain:2025-2025
Marc-André ter Stegen|Barcelona:2015-2025
Éder Militão|Porto:2019-2019;Real Madrid:2020-2025
Aurélien Tchouaméni|Real Madrid:2023-2025
Bernardo Silva|Monaco:2015-2017;Manchester City:2018-2025
João Cancelo|Juventus:2018-2019;Manchester City:2020-2022
Cole Palmer|Manchester City:2021-2023;Chelsea:2024-2025
Declan Rice|Arsenal:2024-2025
Martin Ødegaard|Arsenal:2021-2025
Bukayo Saka|Arsenal:2019-2025
Moisés Caicedo|Brighton:2021-2023;Chelsea:2024-2025
Enzo Fernández|Benfica:2022-2023;Chelsea:2023-2025
Marcus Thuram|Inter:2024-2025
Jules Koundé|Sevilla:2019-2022;Barcelona:2023-2025
Gregor Kobel|Borussia Dortmund:2021-2025
Harry Maguire|Manchester United:2019-2025
`.trim().split('\n').forEach(l=>{const [n,c]=l.split('|');m[n]=c.split(';').map(z=>{const [cl,y]=z.split(':'),[a,b]=y.split('-');return{c:cl,a:+a,b:+b}})});return m})();
const _CT={};
/* ligas e copas nacionais ganhas (com ano e clube) a partir da carreira acima; só 1970-2025 */
function careerTitles(n){
  if(_CT[n])return _CT[n];
  const out={lig:[],dom:[]},car=CAR_H[n];
  if(car&&typeof NAT_H!=='undefined')car.forEach(st=>{
    const key=Object.keys(NAT_H).find(k=>NAT_H[k].lig.some(r=>(k=='ARG'?r.slice(1):[r[1]]).indexOf(st.c)>=0)||NAT_H[k].dom.some(r=>r[1]==st.c));
    if(!key)return;const L=LEAGUES.find(l=>l.k==key);
    ['lig','dom'].forEach(t=>NAT_H[key][t].forEach(r=>{
      const y=+r[0];if(y<st.a||y>st.b)return;
      if((key=='ARG'&&t=='lig'?r.slice(1):[r[1]]).indexOf(st.c)>=0)out[t].push({k:t,y,cn:st.c,t:t=='lig'?(L?L.dn[0]:'Liga nacional'):(L?L.cup:'Copa nacional')});
    }));
  });
  out.lig.sort((a,b)=>a.y-b.y);out.dom.sort((a,b)=>a.y-b.y);
  return _CT[n]=out;
}
/* mesmas conquistas com o id do clube no jogo (para o escudo e o troféu da liga na ficha) */
const careerOf=n=>{const o=careerTitles(n),f=z=>({...z,c:typeof cn2id=='function'&&typeof S!='undefined'&&S&&S.cs?cn2id(z.cn):null});return{lig:o.lig.map(f),dom:o.dom.map(f)}};
