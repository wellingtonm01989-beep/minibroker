// Perfil de cada ativo de renda variável:
// pl = P/L inicial (quantos anos de lucro a ação custa); tags = tipos de notícia de empresa que podem atingi-lo;
// f = sensibilidade a cada assunto (1 = acompanha a notícia por inteiro, negativo = vai na direção contrária).
const PERFIL = {
    PETR4: { pl: 4, tags: ['petroleo', 'estatal'], f: { petroleo: 1.2, dolar: 0.3, china: 0.2 } },
    VALE3: { pl: 6, tags: ['mineracao'], f: { minerio: 1.3, china: 1, dolar: 0.5 } },
    ITUB4: { pl: 9, tags: ['banco'], f: { credito: 1, juros: -0.2, mercado: 0.9 } },
    BBDC4: { pl: 8, tags: ['banco'], f: { credito: 1.1, juros: -0.3 } },
    BBAS3: { pl: 5, tags: ['banco', 'estatal'], f: { credito: 1, agro: 0.5 } },
    B3SA3: { pl: 14, tags: ['bolsa'], f: { bolsa: 1, juros: -0.6, mercado: 1.1 } },
    WEGE3: { pl: 28, tags: ['industria'], f: { industria: 1, dolar: 0.4, eua: 0.2 } },
    EMBR3: { pl: 18, tags: ['aviao', 'industria'], f: { aviao: 1, dolar: 0.8, eua: 0.3 } },
    ABEV3: { pl: 14, tags: ['consumo'], f: { consumo: 0.6, dolar: -0.3, mercado: 0.7 } },
    MGLU3: { pl: 40, tags: ['varejo'], f: { consumo: 1.5, varejo: 1, juros: -2, mercado: 1.3 } },
    LREN3: { pl: 13, tags: ['varejo'], f: { consumo: 1.2, varejo: 0.7, juros: -1.2 } },
    RADL3: { pl: 30, tags: ['saude'], f: { saude: 1, consumo: 0.4 } },
    RENT3: { pl: 15, tags: ['locacao'], f: { locacao: 1, juros: -1.5, consumo: 0.5 } },
    SUZB3: { pl: 8, tags: ['papel'], f: { papel: 1, dolar: 0.8, china: 0.4 } },
    KLBN11: { pl: 12, tags: ['papel'], f: { papel: 0.8, dolar: 0.4, china: 0.2, industria: 0.3 } },
    GGBR4: { pl: 8, tags: ['industria'], f: { aco: 1, minerio: 0.3, construcao: 0.5, china: 0.4, eua: 0.3 } },
    PRIO3: { pl: 6, tags: ['petroleo'], f: { petroleo: 1.5, dolar: 0.3 } },
    SBSP3: { pl: 14, tags: ['saneamento'], f: { agua: 1 } },
    EQTL3: { pl: 12, tags: ['energia'], f: { energia: 0.8, juros: -0.7 } },
    CMIG4: { pl: 6, tags: ['energia', 'estatal'], f: { energia: 1 } },
    TAEE11: { pl: 9, tags: ['energia'], f: { energia: 0.4, mercado: 0.5 } },
    VIVT3: { pl: 14, tags: ['telecom'], f: { telecom: 1, mercado: 0.6 } },
    BOVA11: { tags: [], f: { mercado: 1, petroleo: 0.15, minerio: 0.15, credito: 0.2, juros: -0.6 } },
    SMAL11: { tags: [], f: { mercado: 1.2, juros: -1.3, consumo: 0.5 } },
    IVVB11: { tags: [], f: { mercado: 0.1, eua: 1, dolar: 1 } },
    GOLD11: { tags: [], f: { mercado: -0.1, ouro: 1, dolar: 0.8 } },
    // FIIs de "tijolo" (imóveis) sofrem com juros altos; os de "papel" (dívidas) atrelados ao CDI até ganham com eles.
    MXRF11: { tags: ['papelfii'], f: { mercado: 0.3, juros: -0.2, imoveis: 0.4, credito: 0.3 } },
    HGLG11: { tags: ['tijolo'], f: { mercado: 0.3, juros: -0.8, logistica: 1, imoveis: 0.5 } },
    KNRI11: { tags: ['tijolo'], f: { mercado: 0.3, juros: -0.8, escritorio: 0.6, logistica: 0.4, imoveis: 0.5 } },
    XPML11: { tags: ['tijolo'], f: { mercado: 0.3, juros: -0.8, shopping: 1, consumo: 0.4, imoveis: 0.5 } },
    VISC11: { tags: ['tijolo'], f: { mercado: 0.3, juros: -0.8, shopping: 1, consumo: 0.4, imoveis: 0.5 } },
    MALL11: { tags: ['tijolo'], f: { mercado: 0.3, juros: -0.9, shopping: 1, consumo: 0.5, imoveis: 0.5 } },
    BTLG11: { tags: ['tijolo'], f: { mercado: 0.3, juros: -0.7, logistica: 1, imoveis: 0.5 } },
    XPLG11: { tags: ['tijolo'], f: { mercado: 0.3, juros: -0.8, logistica: 1, imoveis: 0.5 } },
    VILG11: { tags: ['tijolo'], f: { mercado: 0.3, juros: -0.9, logistica: 1, varejo: 0.2, imoveis: 0.5 } },
    LVBI11: { tags: ['tijolo'], f: { mercado: 0.3, juros: -0.7, logistica: 1, imoveis: 0.5 } },
    BRCO11: { tags: ['tijolo'], f: { mercado: 0.3, juros: -0.7, logistica: 1, imoveis: 0.5 } },
    HGRE11: { tags: ['tijolo'], f: { mercado: 0.3, juros: -0.9, escritorio: 1, imoveis: 0.5 } },
    PVBI11: { tags: ['tijolo'], f: { mercado: 0.3, juros: -0.8, escritorio: 1, imoveis: 0.5 } },
    JSRE11: { tags: ['tijolo'], f: { mercado: 0.3, juros: -1, escritorio: 1.2, imoveis: 0.5 } },
    HGRU11: { tags: ['tijolo'], f: { mercado: 0.3, juros: -0.7, consumo: 0.3, imoveis: 0.6 } },
    TRXF11: { tags: ['tijolo'], f: { mercado: 0.3, juros: -0.7, consumo: 0.3, imoveis: 0.6 } },
    GARE11: { tags: ['tijolo'], f: { mercado: 0.3, juros: -0.8, logistica: 0.4, consumo: 0.3, imoveis: 0.6 } },
    KNCR11: { tags: ['papelfii'], f: { mercado: 0.1, juros: 0.3, credito: 0.3 } },
    KNIP11: { tags: ['papelfii'], f: { mercado: 0.15, juros: -0.4, credito: 0.3 } },
    CPTS11: { tags: ['papelfii'], f: { mercado: 0.3, juros: -0.3, credito: 0.5, imoveis: 0.3 } },
    RECR11: { tags: ['papelfii'], f: { mercado: 0.2, juros: -0.2, credito: 0.7, construcao: 0.4 } },
    VGIR11: { tags: ['papelfii'], f: { mercado: 0.1, juros: 0.2, credito: 0.5 } },
    IRDM11: { tags: ['papelfii'], f: { mercado: 0.4, juros: -0.3, credito: 1, construcao: 0.3 } },
    HFOF11: { tags: ['tijolo'], f: { mercado: 0.4, juros: -1, imoveis: 0.7 } }
};

// Sensibilidade padrão quando o ativo não define o assunto: ações acompanham a bolsa e sofrem um pouco com juros altos.
const SENSIBILIDADE_PADRAO = { acao: { mercado: 1, juros: -0.5 }, etf: {}, fii: {} };

const MODELOS = [];
// Notícia sobre uma empresa sorteada. impacto = movimento esperado total do preço (0,08 = +8%).
const empresa = (titulo, impacto, porque, tag) => MODELOS.push({ alvo: true, t: titulo, i: impacto, p: porque, tag });
// Notícia sobre um assunto: cada ativo reage conforme sua sensibilidade (PERFIL.f).
const tema = (titulo, efeitos, porque, extra) => MODELOS.push({ t: titulo, e: efeitos, p: porque, ...extra });

/* ---------- Empresas: notícias boas ---------- */
empresa('{empresa} tem lucro recorde no trimestre', 0.08, 'Lucro maior deixa a empresa mais valiosa e pode virar mais dividendos para os sócios.');
empresa('{empresa} anuncia que vai pagar dividendos extras', 0.05, 'Dinheiro extra para os sócios deixa a ação mais desejada.');
empresa('{empresa} fecha contrato gigante com cliente estrangeiro', 0.07, 'Um cliente grande garante vendas por anos.');
empresa('{empresa} vai recomprar as próprias ações', 0.05, 'Quando a empresa compra as próprias ações, sobram menos no mercado e cada uma vale um pouco mais. Também mostra que ela acha a ação barata.');
empresa('{empresa} reduz suas dívidas pela metade', 0.06, 'Menos dívida significa menos juros para pagar e mais lucro sobrando.');
empresa('{empresa} é eleita a empresa mais admirada do setor', 0.02, 'Boa reputação ajuda a atrair clientes e bons funcionários, mas sozinha muda pouco o lucro.');
empresa('Analistas recomendam a compra de {empresa}', 0.04, 'Muitos investidores seguem recomendações, então mais gente quer comprar. Mas analistas também erram!');
empresa('{empresa} corta custos e fica mais eficiente', 0.05, 'Gastar menos para fazer a mesma coisa aumenta o lucro.');
empresa('{empresa} lança produto novo que vira sucesso', 0.06, 'Produto que vende muito traz mais receita.');
empresa('{empresa} ganha prêmio de melhor gestão do ano', 0.02);
empresa('{empresa} anuncia expansão para outros países', 0.05, 'Vender em mais lugares pode fazer a empresa crescer muito, mas também traz riscos novos.');
empresa('Grande fundo estrangeiro compra uma fatia da {empresa}', 0.05, 'Quando investidores grandes compram, o preço tende a subir.');
empresa('{empresa} renegocia dívida e passa a pagar juros menores', 0.04);
empresa('Novo presidente da {empresa} é elogiado pelo mercado', 0.04, 'Um bom líder pode melhorar muito uma empresa.');
empresa('{empresa} vende negócio que só dava prejuízo', 0.05, 'Se livrar de algo que perdia dinheiro melhora as contas.');
empresa('{empresa} bate a meta de vendas antes do prazo', 0.04);
empresa('{empresa} recebe aprovação para um grande investimento', 0.04);
empresa('Agência de risco aumenta a nota da {empresa}', 0.03, 'Nota de crédito é como a nota da escola para pagar dívidas. Nota maior = empréstimos mais baratos.');
empresa('{empresa} aumenta a previsão de lucro para o ano', 0.06);
empresa('{empresa} fecha parceria com gigante da tecnologia', 0.03);
empresa('{empresa} entra no índice de sustentabilidade da bolsa', 0.03, 'Fundos que só compram empresas sustentáveis passam a comprar a ação.');
empresa('{empresa} anuncia aumento da produção', 0.04);
empresa('{empresa} ganha causa importante na Justiça', 0.05, 'Livrar-se de um processo tira um risco das costas da empresa.');
empresa('Pesquisa mostra clientes da {empresa} mais satisfeitos', 0.02);
empresa('{empresa} compra concorrente menor por bom preço', 0.04, 'Comprar um concorrente aumenta a fatia da empresa no mercado.');
empresa('{empresa} vai passar a pagar dividendos com mais frequência', 0.03);
empresa('Lucro da {empresa} cresce {n}% e surpreende', 0.07);
empresa('{empresa} conquista licença para operar em nova região', 0.05);
empresa('{empresa} termina obra grande antes do prazo e gastando menos', 0.04);
empresa('Ação da {empresa} entra na carteira recomendada de vários bancos', 0.03);

/* ---------- Empresas: notícias ruins ---------- */
empresa('{empresa} tem prejuízo inesperado no trimestre', -0.09, 'Prejuízo é quando a empresa gasta mais do que ganha.');
empresa('{empresa} corta os dividendos', -0.06, 'Menos dinheiro para os sócios deixa a ação menos atraente.');
empresa('{empresa} perde um cliente importante', -0.06);
empresa('Acidente em fábrica da {empresa} paralisa a produção', -0.07, 'Sem produzir, a empresa não tem o que vender.');
empresa('{empresa} é multada pelo governo', -0.04, 'Multa é dinheiro que sai do caixa sem trazer nada de volta.');
empresa('Presidente da {empresa} deixa o cargo de surpresa', -0.04, 'Mudança inesperada no comando gera incerteza, e o mercado não gosta de incerteza.');
empresa('Dívida da {empresa} cresce e preocupa investidores', -0.05);
empresa('Analistas recomendam a venda de {empresa}', -0.04, 'Muitos investidores seguem recomendações. Mas analistas também erram!');
empresa('{empresa} anuncia que vai lançar novas ações', -0.05, 'Com mais ações no mercado, o lucro é dividido em mais pedaços, e cada um vale um pouco menos.');
empresa('Lucro da {empresa} cai {n}%', -0.07);
empresa('{empresa} reduz a previsão de vendas para o ano', -0.06);
empresa('Greve de funcionários atinge a {empresa}', -0.03);
empresa('Concorrente lança produto mais barato que o da {empresa}', -0.04);
empresa('{empresa} perde processo e terá de pagar indenização', -0.05);
empresa('Agência de risco rebaixa a nota da {empresa}', -0.04, 'Nota menor significa que pegar dinheiro emprestado vai ficar mais caro para a empresa.');
empresa('{empresa} atrasa obra importante', -0.03);
empresa('Investigação aponta problemas na contabilidade da {empresa}', -0.12, 'Se os números da empresa não são confiáveis, os investidores fogem. É um dos piores tipos de notícia.');
empresa('Grande fundo vende toda a sua fatia da {empresa}', -0.04);
empresa('Sistema da {empresa} sai do ar e clientes reclamam', -0.02);
empresa('Custos da {empresa} sobem mais que o esperado', -0.04);
empresa('Reclamações de clientes da {empresa} disparam', -0.03);
empresa('{empresa} desiste de projeto em que já tinha gastado muito', -0.04);
empresa('Produção da {empresa} fica abaixo da meta', -0.04);
empresa('{empresa} perde licença para operar em uma região', -0.05);
empresa('Ataque hacker atinge os sistemas da {empresa}', -0.04, 'Ataques podem parar as operações e vazar dados de clientes.');
empresa('{empresa} compra concorrente e mercado acha que pagou caro demais', -0.04);
empresa('Vendas da {empresa} decepcionam no trimestre', -0.05);
empresa('{empresa} adia o pagamento de dividendos', -0.03);
empresa('{empresa} precisa chamar clientes para consertar produtos com defeito', -0.03);
empresa('Diretores da {empresa} vendem muitas ações da própria empresa', -0.03, 'Quando quem trabalha lá dentro vende, o mercado desconfia que sabem de algo.');

/* ---------- Empresas: notícias de setores específicos ---------- */
empresa('{empresa} registra menos calote dos clientes', 0.05, 'Calote é quando quem pegou empréstimo não paga. Menos calote = mais lucro para o banco.', 'banco');
empresa('Calote nos empréstimos do {empresa} aumenta', -0.06, 'Quando os clientes não pagam o que devem, o banco perde dinheiro.', 'banco');
empresa('{empresa} ganha milhões de novos clientes no aplicativo', 0.04, null, 'banco');
empresa('Vendas de fim de ano da {empresa} superam as expectativas', 0.07, null, 'varejo');
empresa('{empresa} fecha lojas que davam prejuízo', 0.03, null, 'varejo');
empresa('Estoque encalhado preocupa a {empresa}', -0.05, 'Produto parado no estoque é dinheiro que não volta para o caixa.', 'varejo');
empresa('{empresa} vence leilão de novas linhas de energia', 0.05, null, 'energia');
empresa('Governo muda regra e reduz a tarifa da {empresa}', -0.06, null, 'energia');
empresa('{empresa} reduz perdas com "gatos" de energia', 0.04, '"Gato" é uma ligação clandestina: a energia é usada, mas ninguém paga por ela.', 'energia');
empresa('{empresa} recebe autorização para reajustar a conta de água', 0.05, null, 'saneamento');
empresa('{empresa} acelera obras para levar esgoto a mais cidades', 0.03, null, 'saneamento');
empresa('{empresa} descobre novo campo de petróleo', 0.08, 'Mais petróleo para tirar significa mais vendas por muitos anos.', 'petroleo');
empresa('Plataforma da {empresa} para por manutenção inesperada', -0.05, null, 'petroleo');
empresa('Governo pressiona {empresa} a segurar preços', -0.06, 'Quando o governo é sócio, às vezes pede para a empresa vender mais barato do que poderia. Isso reduz o lucro.', 'estatal');
empresa('Barragem da {empresa} passa por vistoria e preocupa', -0.05, null, 'mineracao');
empresa('{empresa} bate recorde de produção de minério', 0.05, null, 'mineracao');
empresa('{empresa} recebe encomenda recorde de equipamentos', 0.06, null, 'industria');
empresa('{empresa} abre nova fábrica no exterior', 0.04, null, 'industria');
empresa('{empresa} vende dezenas de aviões para companhia americana', 0.08, null, 'aviao');
empresa('Problema em peça atrasa entregas da {empresa}', -0.05, null, 'aviao');
empresa('{empresa} abre centenas de novas lojas', 0.04, null, 'saude');
empresa('{empresa} ganha clientes com internet de fibra óptica', 0.04, null, 'telecom');
empresa('Nova tecnologia de celular exige investimento alto da {empresa}', -0.03, null, 'telecom');
empresa('Preço da celulose sobe e anima a {empresa}', 0.06, null, 'papel');
empresa('{empresa} vende carros usados com lucro maior', 0.05, null, 'locacao');
empresa('Carros da {empresa} ficam parados com queda no turismo', -0.04, null, 'locacao');
empresa('Número de investidores na bolsa bate recorde e anima a {empresa}', 0.05, 'Mais gente comprando e vendendo ações = mais taxas para a B3.', 'bolsa');
empresa('{empresa} aluga imóvel que estava vazio', 0.04, 'Imóvel vazio não paga aluguel. Alugado, o fundo distribui mais dinheiro aos cotistas.', 'tijolo');
empresa('Inquilino grande sai de imóvel do {empresa}', -0.05, 'Sem esse aluguel, o fundo distribui menos dinheiro aos cotistas.', 'tijolo');
empresa('{empresa} compra imóvel novo com aluguel garantido por 10 anos', 0.03, null, 'tijolo');
empresa('{empresa} consegue reajustar os aluguéis acima da inflação', 0.03, null, 'tijolo');
empresa('{empresa} vende imóvel com lucro e vai distribuir parte aos cotistas', 0.04, 'Vender um imóvel por mais do que pagou dá lucro, e parte dele vai para quem tem cotas.', 'tijolo');
empresa('Inquilino do {empresa} pede para pagar aluguel menor', -0.03, null, 'tijolo');
empresa('Devedor atrasa pagamento e {empresa} pode ter prejuízo', -0.07, 'Fundos de "papel" emprestam dinheiro. Quando alguém não paga, o fundo distribui menos e a cota cai.', 'papelfii');
empresa('{empresa} recebe dívida atrasada e volta a pagar normalmente', 0.04, null, 'papelfii');
empresa('{empresa} lança novas cotas para comprar mais dívidas imobiliárias', -0.02, 'Com mais cotas, o rendimento é dividido entre mais gente até o dinheiro novo começar a render.', 'papelfii');
empresa('{empresa} aumenta o rendimento mensal pago aos cotistas', 0.03, null, 'papelfii');

/* ---------- Setores e assuntos ---------- */
tema('Preço do petróleo dispara no mundo', { petroleo: 0.07 }, 'As petroleiras passam a vender cada barril mais caro.');
tema('Preço do petróleo despenca', { petroleo: -0.07 }, 'As petroleiras passam a vender cada barril mais barato.');
tema('Países produtores combinam tirar menos petróleo', { petroleo: 0.05 }, 'Menos petróleo à venda deixa o preço mais alto.');
tema('Estoques de petróleo nos EUA sobem muito', { petroleo: -0.04 }, 'Petróleo sobrando derruba o preço.');
tema('Inverno rigoroso aumenta o consumo de combustível no mundo', { petroleo: 0.04 });
tema('Carros elétricos vendem mais e reduzem a procura por gasolina', { petroleo: -0.03 });
tema('China anuncia plano para construir mais prédios e pontes', { china: 0.06, minerio: 0.04 }, 'Construção usa muito aço, e o aço é feito com minério de ferro.');
tema('Economia da China cresce menos que o esperado', { china: -0.06 }, 'A China é a maior compradora de minério e celulose do Brasil.');
tema('Preço do minério de ferro sobe forte', { minerio: 0.06 });
tema('Preço do minério de ferro cai', { minerio: -0.06 });
tema('Aço importado barato chega ao Brasil', { aco: -0.06 }, 'A concorrência de fora força as siderúrgicas daqui a baixar seus preços.');
tema('Governo cria taxa sobre o aço importado', { aco: 0.05 }, 'Com o aço de fora mais caro, as siderúrgicas daqui vendem mais.');
tema('China compra mais celulose do Brasil', { papel: 0.05, china: 0.02 });
tema('Preço da celulose cai no mercado internacional', { papel: -0.05 });
tema('Dólar sobe forte frente ao real', { dolar: 0.05 }, 'Quem vende para fora recebe em dólar e ganha mais reais. Quem compra coisas de fora paga mais caro.');
tema('Dólar cai e o real se valoriza', { dolar: -0.05 }, 'Exportadoras recebem menos reais pelo que vendem lá fora. Produtos importados ficam mais baratos.');
tema('Investidores estrangeiros trazem bilhões para o Brasil', { mercado: 0.04, dolar: -0.03 }, 'Muita gente comprando ações faz a bolsa subir e o dólar cair.');
tema('Estrangeiros tiram dinheiro do Brasil', { mercado: -0.04, dolar: 0.03 });
tema('Vendas no comércio crescem acima do esperado', { consumo: 0.05 });
tema('Vendas no comércio caem', { consumo: -0.05 });
tema('Black Friday bate recorde de vendas', { consumo: 0.04, varejo: 0.02 });
tema('Famílias estão mais endividadas, mostra pesquisa', { consumo: -0.04, credito: -0.02 }, 'Quem tem muita dívida para pagar compra menos coisas.');
tema('Governo libera dinheiro extra para trabalhadores', { consumo: 0.04 });
tema('Confiança do consumidor sobe', { consumo: 0.03 }, 'Quem está confiante no futuro gasta mais.');
tema('Lojas on-line estrangeiras ganham clientes no Brasil', { varejo: -0.05 }, 'A concorrência de fora tira vendas das lojas daqui.');
tema('Governo cria imposto sobre compras em sites estrangeiros', { varejo: 0.05 });
tema('Chuvas enchem os reservatórios das hidrelétricas', { energia: 0.04, agua: 0.03 }, 'Com água de sobra, a energia fica mais barata de produzir.');
tema('Seca deixa reservatórios no nível mais baixo em anos', { energia: -0.05, agua: -0.05 });
tema('Governo anuncia leilão de novas linhas de transmissão', { energia: 0.03 });
tema('Agência reguladora aprova aumento na conta de luz', { energia: 0.04, consumo: -0.01 });
tema('Novas regras para o setor elétrico assustam investidores', { energia: -0.05 });
tema('Consumo de energia bate recorde com onda de calor', { energia: 0.03 });
tema('Bancos emprestam mais e o calote diminui', { credito: 0.05 });
tema('Calote das empresas sobe no país', { credito: -0.05 });
tema('Governo propõe imposto maior sobre o lucro dos bancos', { credito: -0.06 });
tema('Bancos digitais crescem e disputam clientes', { credito: -0.02 }, 'Concorrência maior pode tirar clientes dos bancos grandes.');
tema('Número de pessoas investindo na bolsa cresce', { bolsa: 0.05, mercado: 0.01 });
tema('Volume de negócios na bolsa cai', { bolsa: -0.04 });
tema('Safra recorde de soja e milho no Brasil', { agro: 0.05 }, 'Agro forte movimenta caminhões, bancos e exportações.');
tema('Geada destrói parte das plantações', { agro: -0.05 });
tema('China compra mais carne e soja do Brasil', { agro: 0.04, china: 0.02 });
tema('Encomendas de aviões no mundo batem recorde', { aviao: 0.06 });
tema('Companhias aéreas adiam a compra de aviões', { aviao: -0.05 });
tema('Produção da indústria brasileira cresce', { industria: 0.04 });
tema('Indústria brasileira tem queda na produção', { industria: -0.04 });
tema('Mundo investe mais em energia limpa', { industria: 0.04, energia: 0.01 }, 'Motores elétricos e equipamentos de energia passam a vender mais.');
tema('Preço do cobre dispara e encarece fios e motores', { industria: -0.03 });
tema('Procura por galpões de logística dispara', { logistica: 0.04 }, 'Com mais compras pela internet, as empresas precisam de mais galpões para guardar produtos.');
tema('Muitos escritórios ficam vazios nas grandes cidades', { escritorio: -0.04 });
tema('Shoppings recebem mais visitantes que no ano passado', { shopping: 0.04 });
tema('Lançamento de imóveis cresce no país', { construcao: 0.04 });
tema('Financiamento de imóveis fica mais caro', { construcao: -0.03, imoveis: -0.02 });
tema('População mais velha aumenta a procura por remédios', { saude: 0.03 });
tema('Governo muda as regras de preço dos remédios', { saude: -0.04 });
tema('Nova geração de internet móvel exige investimentos bilionários', { telecom: -0.03 });
tema('Brasileiros usam mais internet e contratam planos maiores', { telecom: 0.03 });
tema('Governo aprova nova lei do saneamento', { agua: 0.05 }, 'Regras claras atraem investimento para levar água e esgoto a mais casas.');
tema('Crise hídrica faz governo pedir economia de água', { agua: -0.04 });
tema('Bolsa americana bate recorde', { eua: 0.04, mercado: 0.01 });
tema('Empresas de tecnologia americanas despencam', { eua: -0.05 });
tema('Medo de crise faz investidores correrem para o ouro', { ouro: 0.06, mercado: -0.03, dolar: 0.02 }, 'Quando o mundo fica com medo, muita gente compra ouro, que é visto como porto seguro.');
tema('Preço do ouro cai com o mundo mais calmo', { ouro: -0.04, mercado: 0.01 });
tema('Briga comercial entre EUA e China assusta os mercados', { mercado: -0.04, china: -0.03, eua: -0.03, dolar: 0.03 });
tema('EUA e China fazem acordo comercial', { mercado: 0.04, china: 0.03, eua: 0.03 });
tema('Juros nos EUA sobem e dinheiro sai de países emergentes', { mercado: -0.03, dolar: 0.03, eua: -0.02 });
tema('Juros nos EUA caem e investidores procuram países emergentes', { mercado: 0.03, dolar: -0.03, eua: 0.03 });
tema('Grande banco estrangeiro quebra e assusta o mundo', { mercado: -0.06, credito: -0.03, ouro: 0.04 });
tema('Turismo bate recorde no Brasil', { consumo: 0.02, locacao: 0.04 });
tema('Preço dos carros novos sobe muito', { locacao: -0.03 });
tema('Inteligência artificial impulsiona empresas de tecnologia no mundo', { eua: 0.04 });

/* ---------- Economia: juros, inflação e o país ---------- */
const INICIO_ECONOMIA = MODELOS.length;
const PORQUE_SOBE_SELIC = 'Juros mais altos: a renda fixa passa a render mais, e empréstimos ficam caros, o que atrapalha empresas que dependem de crédito, como lojas e locadoras.';
const PORQUE_CAI_SELIC = 'Juros mais baixos: a renda fixa passa a render menos, e as empresas pagam menos juros. A bolsa costuma gostar.';
tema('Banco Central sobe a Selic em 0,50 ponto', { juros: 0.05 }, PORQUE_SOBE_SELIC, { selic: 0.005, cond: () => selic() < 0.20 });
tema('Banco Central sobe a Selic em 0,25 ponto', { juros: 0.03 }, PORQUE_SOBE_SELIC, { selic: 0.0025, cond: () => selic() < 0.20 });
tema('Banco Central corta a Selic em 0,50 ponto', { juros: -0.05 }, PORQUE_CAI_SELIC, { selic: -0.005, cond: () => selic() > 0.05 });
tema('Banco Central corta a Selic em 0,25 ponto', { juros: -0.03 }, PORQUE_CAI_SELIC, { selic: -0.0025, cond: () => selic() > 0.05 });
tema('Banco Central mantém a Selic, como todos esperavam', {}, 'Quando acontece exatamente o que todo mundo esperava, os preços quase não mudam.', { selic: 0 });
tema('Banco Central indica que pode subir os juros no futuro', { juros: 0.03 }, 'O mercado se antecipa: os preços mudam antes mesmo de os juros subirem.');
tema('Banco Central indica que os juros podem cair em breve', { juros: -0.03 }, 'O mercado se antecipa: os preços mudam antes mesmo de os juros caírem.');
tema('Inflação do mês vem acima do esperado', { juros: 0.03, consumo: -0.02 }, 'Inflação alta pode fazer o Banco Central subir os juros. E com tudo mais caro, as pessoas compram menos.', { ipca: 0.003 });
tema('Inflação do mês vem abaixo do esperado', { juros: -0.03, consumo: 0.02 }, 'Inflação baixa abre espaço para o Banco Central cortar os juros.', { ipca: -0.003 });
tema('Preço dos alimentos dispara no mercado', { consumo: -0.03, agro: 0.02 }, 'Comida mais cara deixa menos dinheiro para as famílias gastarem com outras coisas.', { ipca: 0.002 });
tema('Preço dos alimentos cai com supersafra', { consumo: 0.02 }, null, { ipca: -0.002 });
tema('Gasolina fica mais cara nos postos', { consumo: -0.02, petroleo: 0.01 }, null, { ipca: 0.002 });
tema('Economia brasileira cresce mais que o esperado', { mercado: 0.04, consumo: 0.02 }, 'O PIB é o tamanho de tudo que o país produz. Quando ele cresce, as empresas vendem mais.');
tema('PIB do Brasil decepciona', { mercado: -0.04, consumo: -0.02 }, 'O PIB é o tamanho de tudo que o país produz. Crescendo pouco, as empresas vendem menos.');
tema('Desemprego cai ao menor nível em anos', { consumo: 0.04, mercado: 0.02 }, 'Mais gente trabalhando = mais gente com dinheiro para comprar.');
tema('Desemprego sobe', { consumo: -0.04, mercado: -0.02 });
tema('Governo anuncia corte de gastos', { mercado: 0.03, juros: -0.02, dolar: -0.02 }, 'Governo gastando menos ajuda a controlar a inflação e os juros.');
tema('Contas do governo pioram e a dívida pública sobe', { mercado: -0.04, juros: 0.03, dolar: 0.03 }, 'Governo devendo muito assusta os investidores, que passam a pedir juros maiores.');
tema('Brasil ganha nota melhor das agências de risco', { mercado: 0.04, dolar: -0.03 });
tema('Agência de risco rebaixa a nota do Brasil', { mercado: -0.05, dolar: 0.04 });
tema('Reforma tributária é aprovada no Congresso', { mercado: 0.03 }, 'Regras de impostos mais simples ajudam as empresas a gastar menos com burocracia.');
tema('Discussão sobre novos impostos deixa investidores nervosos', { mercado: -0.03 });
tema('Salário mínimo tem aumento acima da inflação', { consumo: 0.03 });
tema('Brasil bate recorde de exportações', { dolar: -0.01, agro: 0.02, mercado: 0.02 });
tema('Briga política em Brasília assusta o mercado', { mercado: -0.04, dolar: 0.03 }, 'Incerteza sobre o futuro do país faz investidores venderem.');
tema('Governo e Congresso fazem acordo e acalmam o mercado', { mercado: 0.03, dolar: -0.02 });
tema('Mercado prevê inflação mais alta no próximo ano', { juros: 0.02 }, null, { ipca: 0.002 });
tema('Mercado prevê inflação mais baixa no próximo ano', { juros: -0.02 }, null, { ipca: -0.002 });
tema('Crédito fica mais caro para as empresas', { juros: 0.02, credito: -0.02 });
tema('Programa do governo facilita a compra da casa própria', { construcao: 0.04, credito: 0.02 });
tema('Bolsa brasileira tem o melhor mês do ano', { mercado: 0.04 }, 'Às vezes o mercado inteiro sobe junto, puxado pelo bom humor dos investidores.');
tema('Bolsa tem dia de pânico e cai forte', { mercado: -0.06 }, 'Em dias de pânico quase tudo cai junto. Quem vende no susto costuma se arrepender.');
tema('Bolsa volta a subir depois de semanas ruins', { mercado: 0.03 });
tema('Mundo teme recessão nos Estados Unidos', { mercado: -0.04, eua: -0.04, ouro: 0.03 }, 'Recessão é quando a economia de um país encolhe. Os EUA compram de todo mundo, então isso preocupa todos.');
tema('Economia mundial cresce forte', { mercado: 0.04, china: 0.02, eua: 0.02, petroleo: 0.02 });
tema('Nova doença preocupa o mundo e os mercados caem', { mercado: -0.05, consumo: -0.03, petroleo: -0.03, ouro: 0.03 });
tema('Remédio eficaz contra a nova doença é aprovado', { mercado: 0.04, consumo: 0.03 });
tema('Inflação nos Estados Unidos sobe e assusta o mundo', { eua: -0.03, mercado: -0.02, dolar: 0.02 });
tema('Inflação nos Estados Unidos cai', { eua: 0.03, mercado: 0.02, dolar: -0.02 });
tema('Aluguéis sobem acima da inflação nas grandes cidades', { imoveis: 0.03 });

MODELOS.forEach((m, i) => (m.n = i));
