# ⚽ PRO FOOTBALL CAREER

Simulador de carreira de jogador de futebol, em **um único arquivo HTML** (`pro-football-career.html`). Sem dependências, sem build, sem servidor: basta abrir no navegador.

Você cria um jogador aos 16 anos, assina com um clube pequeno e tenta chegar à Bola de Ouro, passando por treinos, jogos, transferências, eventos e aposentadoria.

## Como rodar

- Abra `pro-football-career.html` no navegador (celular ou PC).
- Para publicar: GitHub Pages (Settings → Pages → branch `main`, raiz). Renomear o arquivo para `index.html` deixa o link mais limpo.
- O progresso é salvo automaticamente no `localStorage` do navegador (chave `pfc`, versão de save `v:1`).

## Como o jogo funciona

**Temporada:** 14 semanas. Cada clique em "Jogar semana" treina, simula todos os jogos das 3 ligas, avança copas e atualiza a tabela.

**Jogador:** 7 atributos (Velocidade, Finalização, Passe, Drible, Defesa, Físico, Visão de jogo). O OVR é a média ponderada por posição (Atacante, Ponta, Meia, Volante, Zagueiro). Cada atributo tem um teto calculado pelo potencial.

**Mundo:**
- 3 divisões (Liga A, B, C) com 8 clubes cada; 2 sobem e 2 caem por ano.
- 4 clubes europeus fixos (nível 9) que só aparecem na Champions.
- Copa Nacional (16 clubes) e Liga dos Campeões (8 clubes; entram os 4 primeiros da Liga A).

**Partida:** simulada minuto a minuto. A força do clube, o seu OVR, condição, forma e moral definem gols, lances, cartões e lesões. Você recebe nota de 3 a 10.

**Treino:** foco (7 atributos, descanso ativo, treino tático, fisioterapia) e intensidade (leve, normal, intensa). Evolução depende da idade, do teto do atributo e da condição física.

**Fora de campo:** eventos aleatórios (28% por semana), contratos, propostas de transferência e empréstimo, agente, patrimônio, reputação e popularidade.

**Fim de temporada:** prêmios (artilheiro, craque, melhor jovem), ranking da Bola de Ouro, evolução/declínio dos atributos por idade, mudança de divisão dos clubes. Aposentadoria automática aos 40 anos ou manual no Perfil.

## Mapa do código

Todo o código está dentro do `<script>` do HTML, em formato compacto. Estado global em `S` (objeto salvo no localStorage).

| Parte | Funções / constantes |
|---|---|
| Dados base | `A` (atributos), `PW` (pesos por posição), `PN`, `CN` (clubes), `EV` (eventos), `TL` (faixas de força) |
| Criação | `mkClubs`, `newGame`, `setup` (calendário e copas) |
| Cálculos | `O` (OVR), `cap` (teto do atributo), `sal`, `val` (valor de mercado) |
| Partidas | `lnp` (escalação), `pm` (partida do jogador), `aiM` (jogos da IA), `fx`, `ko` (mata-mata) |
| Semana | `trn_` (treino), `adv` (avança a semana) |
| Temporada | `end` (fim de ano, prêmios, evolução), `roll` (próxima temporada), `rt` (aposentadoria) |
| Mercado | `gen` (propostas), `acc`, `neg`, `rej`, `agent` |
| Eventos | `pick` |
| Telas | `car`, `clb`, `trn`, `par`, `trf`, `est`, `prf`, `ana`, `render` |

## Pontos a melhorar (ideias)

Sugestões para irmos priorizando, da mais simples à mais ambiciosa:

**Jogabilidade**
- [ ] Goleiro como posição (atributos próprios).
- [ ] Mais controle na partida (escolher ações em lances decisivos).
- [ ] Seleção nacional e Copa do Mundo.
- [ ] Mais eventos, com consequências de longo prazo (lesões graves, rivalidades, mídia).
- [ ] Dinheiro com mais uso: investimentos, casa, carro, patrocínios recorrentes.

**Balanceamento**
- [ ] Revisar a frequência de lesões e o ritmo de evolução dos atributos.
- [ ] Revisar a dificuldade do ranking da Bola de Ouro (hoje depende de nota, gols, títulos, OVR e reputação).
- [ ] Revisar salários e valores de transferência.

**Conteúdo**
- [ ] Mais clubes e ligas, nomes e escudos.
- [ ] Rivais, companheiros de time e técnico com personalidade.
- [ ] Mais variedade nos textos dos lances.

**Interface e técnica**
- [ ] Separar o HTML em arquivos (`index.html`, `style.css`, `game.js`) para facilitar a manutenção.
- [ ] Múltiplos slots de save, exportar/importar save.
- [ ] Mais gráficos (evolução de OVR, gols, valor de mercado).
- [ ] Testar bem no celular.
- [ ] Versionar o save (`S.v`) com migração, para não perder carreiras quando o formato mudar.

## Como trabalhar nele com o Claude Code

1. Coloque este README e o `pro-football-career.html` no repositório.
2. Peça mudanças em português, uma de cada vez. Exemplo: "adicione o goleiro como posição" ou "deixe as lesões menos frequentes".
3. Depois de cada mudança, abra o HTML e teste uma carreira por algumas temporadas. Se algo quebrar, copie a mensagem de erro (o jogo mostra "Erro ao exibir a carreira") e mande de volta.
4. Se mudar o formato do save, aumentar `S.v` e apagar o `localStorage` antigo (botão "Nova carreira").

## Regras para manter o projeto saudável

- Manter funcionando offline, sem bibliotecas externas.
- Manter compatibilidade com celular (barra de navegação inferior em telas estreitas).
- Todo texto do jogo em português do Brasil.
