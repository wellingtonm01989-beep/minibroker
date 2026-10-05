# MiniBroker

Simulador de investimentos no estilo home broker para ensinar crianças (a partir de uns 12 anos) a investir. Dinheiro de mentira, mercado o mais perto possível do real.

Para abrir, basta dar dois cliques em `investimentos.html`. Não precisa instalar nada.

## O que tem

- R$ 1.000 para começar e um aporte mensal de R$ 250, reajustado todo janeiro pela regra do salário mínimo, e em dobro em dezembro (13º).
- 30 opções de renda fixa: poupança, Tesouro Direto, CDBs, LCI/LCA, debênture, CRI, CRA e fundo DI, com Imposto de Renda, IOF, carência e vencimento.
- 50 de renda variável: 22 ações, 4 ETFs e 24 fundos imobiliários, com dividendos e rendimentos mensais.
- O tempo passa sozinho: cada 30 minutos reais valem 15 dias no jogo, mesmo com o app fechado.
- Notícias inventadas pelo jogo (uma por hora, só com o app aberto) que mexem nos preços, e uma temporada de resultados das empresas a cada 3 meses do jogo.
- Selic e IPCA iniciais buscados no Banco Central quando há internet.

## Arquivos

- `investimentos.html`: a tela e o visual.
- `app.js`: regras do jogo, ativos e cálculos.
- `noticias.js`: modelos de notícia e como cada ativo reage a cada assunto.

O jogo fica salvo no navegador de quem joga.
