# Habite-se 10

Jogo de **carreira de craque de futebol** em um único arquivo HTML, sem dependências. Você cria um jogador, começa na divisão mais baixa de uma das 10 principais ligas e tenta chegar ao topo: títulos, Champions, Libertadores, Mundial de Clubes e a **Bola de Ouro**.

Visual inspirado no BrasLOL (estilo FIFA/FC): cartas em escudo, pódio, rankings e menu inferior no celular / lateral no PC.

## Como jogar
Abra `pro-football-career.html` no navegador (celular ou PC). O progresso é salvo automaticamente no navegador (`localStorage`, chave `h10`, versão 2). Em **Perfil → Sistema** dá para exportar e importar o save em JSON.

## Recursos
- **10 ligas, 26 divisões, 16 clubes por divisão** com promoção e rebaixamento.
- **Copas nacionais**, **Champions League**, **Libertadores** e **Mundial de Clubes**.
- **Bola de Ouro** com 96 rivais simulados, pódio e Top 10 do ano.
- **Rankings**: Bola de Ouro, Top 10 OVR, Artilheiros, Clubes e Maiores vencedores.
- **Cartas**: uma por temporada, com edições especiais para prêmios e títulos.
- **Tema por clube**: as cores do app mudam conforme o time do jogador; escudos com cores reais dos clubes famosos.
- **Lendas**: Top 10 da história (Messi, Cristiano, Pelé...) com pontuação por títulos, prêmios e gols, e a posição do seu jogador.
- **Campeões**: histórico de campeões de cada competição.
- Treino semanal, propostas de clubes, agente, eventos, notícias e partidas minuto a minuto.
- Simulação rápida: +5 semanas ou até o próximo evento/fim.

## Estrutura
```
src/data.js     ligas, clubes, nomes, eventos, constantes
src/engine.js   simulação, competições, ofertas, Bola de Ouro, save/load
src/ui.js       telas e componentes
src/style.css   visual
build.py        junta tudo em pro-football-career.html
test_engine.js, test_batch.js, tools/smoke.js   testes
```
Edite os arquivos em `src/` e rode `python3 build.py` para gerar o HTML final.

## Testes
```
node test_engine.js
node test_batch.js
cd tools && node smoke.js   # precisa de jsdom
```

## Roadmap
- Posição de goleiro
- Seleção e Copa do Mundo
- Dividir o arquivo em módulos
- Mais testes em celular
