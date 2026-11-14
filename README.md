# Habite-se 10

Jogo de **carreira de craque de futebol** em um único arquivo HTML, sem dependências. Você cria um jogador, começa na divisão mais baixa de uma das 10 principais ligas e tenta chegar ao topo: títulos, Champions, Libertadores, Mundial de Clubes e a **Bola de Ouro**.

Visual inspirado no BrasLOL (estilo FIFA/FC): cartas em escudo, pódio, rankings e menu inferior no celular / lateral no PC.

## Como jogar
Abra `pro-football-career.html` no navegador (celular ou PC). O progresso é salvo automaticamente no navegador (`localStorage`, chave `h10`, versão 2). Em **Perfil → Sistema** dá para exportar e importar o save em JSON.

## Abas
- **Jogar**: próximos jogos, resultados, classificação, calendário, copas e campeões (por liga e divisão).
- **Bola de Ouro**: Top 10 do ano (corrida em andamento), melhores OVR, artilheiros e a lista de todos os vencedores (1956–2025 reais, depois os do jogo; anos futuros aparecem como "A definir").
- **Lendas**: Top 10 da história (atualiza com o tempo), Copa do Mundo, Champions, Libertadores, power ranking de clubes e ranking de seleções por títulos.
- **Elenco**: ligas, divisões e clubes; "Ver elenco" abre o elenco do time e "Ficha" abre a ficha do clube.
- **Jogador**: atributos, cartas, árvore de habilidades, contratos, estatísticas, troféus, seleção, conquistas, caixa de entrada e sistema (save).
- **Fichas** de clube, seleção, lenda e jogador (títulos, temporadas, elenco). Toque em um nome para abrir.

## Recursos
- **10 ligas, 26 divisões, 16 clubes por divisão** com promoção e rebaixamento.
- Copas nacionais, Champions League, Libertadores, Mundial de Clubes e Copa do Mundo.
- Bola de Ouro com 96 craques simulados que envelhecem, se aposentam e entram no ranking de lendas.
- **Calendário com datas + jogo ao vivo**: copas e Mundial no meio da semana, liga no fim de semana; o botão Avançar corre os dias até o dia do jogo, e então você clica em Jogar; a partida do seu clube é transmitida minuto a minuto (pausa, 1x, 2x e 5x, pular), com estatísticas ao vivo e, no fim, posse, finalizações, destaques com nota, MVP e gráfico de domínio da partida.
- **Troféus**: ícones do [game-icons.net](https://game-icons.net) (Lorc e Delapouite, CC BY 3.0); para usar imagens próprias, coloque PNGs em `trofeus/` (veja `trofeus/LEIA-ME.md`).
- Elencos gerados de forma determinística (não pesam no save).
- Tema por clube, treino semanal, propostas, agente, eventos e partidas minuto a minuto.

## Estrutura
```
src/data.js     ligas, clubes, nomes, eventos, constantes
src/formatos.js acesso, rebaixamento, playoffs e quadrangulares
src/engine.js   simulação, competições, ofertas, Bola de Ouro, save/load
src/hist.js     histórico real (Bola de Ouro, Champions, Libertadores, Copa)
src/ui.js       estrutura das telas e abas principais
src/abas.js     abas novas e fichas
src/live.js     jogo ao vivo e estatísticas de fim de jogo
src/style.css   visual
build.py        junta tudo em pro-football-career.html
test_engine.js, test_batch.js, tools/smoke.js   testes
```
Edite os arquivos em `src/` e rode `python3 build.py` para gerar o HTML final.

## Acesso e rebaixamento por liga (`src/formatos.js`)
Os jogos extras são simulados no fim da temporada (ida e volta; empate vai aos pênaltis) e aparecem na tabela da divisão.
| Liga | Fronteira | Regra |
|---|---|---|
| Brasil | A ↔ B | 4 caem; sobem 2 diretos + mata-mata do 3º ao 6º (2 vagas) |
| Brasil | B ↔ C | 4 caem; 8 primeiros da C jogam 2 quadrangulares (1,4,5,8 / 2,3,6,7), 2 de cada grupo sobem; líderes fazem a final do título. Turno único (19 rodadas) |
| Inglaterra | PL ↔ Championship ↔ League One | 3 caem; 2 diretos + playoff do 3º ao 6º |
| Inglaterra | League One ↔ League Two | 4 caem; 3 diretos + playoff do 4º ao 7º |
| Espanha | La Liga ↔ Segunda | 3 caem; 2 diretos + playoff do 3º ao 6º (1 vaga) |
| Espanha | Segunda ↔ Primeira Federación | 4 caem; 2 diretos + playoff do 3º ao 6º (2 vagas) |
| Itália | A ↔ B | 3 caem; 2 diretos + playoff do 3º ao 8º |
| Itália | B ↔ C | 4 caem; 3 diretos + playoff do 4º ao 9º |
| Alemanha | 1ª ↔ 2ª ↔ 3. Liga | 2 caem direto; 3º da divisão de baixo x 16º da de cima (repescagem) |
| França | Ligue 1 ↔ Ligue 2 | 2 caem; 2 diretos + playoff 3º-5º; o vencedor enfrenta o 16º da Ligue 1 |
| Portugal | Primeira ↔ Liga 2 | 2 caem; 2 diretos; 3º da Liga 2 x 16º da Primeira |
| Holanda | Eredivisie ↔ Eerste Divisie | 2 caem; 2 diretos + playoff 3º-8º; vencedor x 16º da Eredivisie |
| Argentina | Liga ↔ Primera Nacional | 2 caem; sobe o campeão + vencedor do Reducido (2º-9º) |
| Turquia | Süper Lig ↔ 1. Lig | 3 caem; 2 diretos + playoff 3º-6º |
Fontes das regras de 2026: Brasil, Argentina, Holanda e Portugal conferidos em notícias e regulamentos; Inglaterra, Espanha, Itália, Alemanha, França e Turquia seguem o formato conhecido (simplificado para uma divisão única onde a real tem grupos).

## Testes
```
node test_engine.js
node test_batch.js
cd tools && node smoke.js   # precisa de jsdom
```

## Roadmap
- Histórico real de 2026 em diante (hoje só até 2025)
- Títulos de ligas nacionais anteriores a 2026
- Dividir o arquivo em módulos
- Mais testes em celular

## Dados e créditos (ligas, elencos e taças)
- Clubes, divisões e elencos reais: API pública da ESPN (`tools/fetch_espn.py`, `tools/build_world.py` → `src/squads.js`). A força individual é estimada (força do clube + idade); astros têm valor fixo em `tools/stars.json`.
- Escudos: TheSportsDB e ESPN. Taças em `trofeus/`: TheSportsDB; Copa do Brasil e Mundial de Clubes via Wikimedia Commons (CC BY-SA).
- A temporada tem 46 semanas; cada divisão joga suas rodadas espalhadas por elas (divisões de 30+ times jogam turno único).
