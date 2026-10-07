const CAPITAL_INICIAL = 1000;
const DIAS_ANO = 252;
const DIAS_MES = 21;
const MAX_HISTORICO = 504;
const MAX_PATRIMONIO = 2520;
const CHAVE_SALVO = 'minibroker-v3';
const SEGUNDOS_POR_DIA = 60; // segundos reais para passar 1 dia útil no jogo, na velocidade 1x
const INTERVALO_COPOM = 63; // dias úteis entre as reuniões do Copom (uma a cada 3 meses)
const META_INFLACAO = 0.03;
const JURO_REAL_NEUTRO = 0.05; // juro acima da inflação que nem esquenta nem esfria a economia
const PROB_RUMOR = 0.15;
const PROB_IMPREVISTO_DIA = 0.013; // cerca de 3 imprevistos por ano
const RESERVA_META_MESES = 6;
const DIAS_CAMPANHA = 126;   // a campanha começa 6 meses antes da eleição
const DIAS_FECHADO = 21;     // circuit breaker: a bolsa fica fechada por 1 mês
const PROB_CISNE_DIA = 0.02 / 252; // 2% de chance por ano
const PERFIS_GOVERNO = { mercado: 'Pró-Mercado', populista: 'Populista' };

// Selic e IPCA são atualizados ao vivo pelo Banco Central; estes são os valores reserva.
const mercado = {
    selic: 0.15,
    ipca12m: 0.05,
    prefixado: 0.135,
    ipcaReal: 0.075,
    fonte: 'valores aproximados (sem conexão com o Banco Central)'
};

/* ---------- Ativos ---------- */
const TXT = {
    poup: 'É como um cofrinho do banco. O dinheiro só rende uma vez por mês, no "aniversário" da aplicação. Se você tirar antes, perde o rendimento daquele mês. Não paga imposto.',
    selic: 'Você empresta dinheiro para o governo do Brasil e ele devolve com juros iguais à Selic, a taxa básica de juros do país. É o investimento mais seguro do Brasil e dá para tirar quando quiser.',
    pre: 'Você empresta para o governo e já sabe no primeiro dia quanto vai ganhar por ano. A taxa fica travada no dia em que você aplica, mesmo se os juros do país mudarem depois. Atenção: se vender antes do vencimento, o preço do título acompanha os juros do mercado, e você pode ganhar ou perder.',
    ipca: 'Inflação é quando as coisas ficam mais caras. Este título rende a inflação MAIS uma taxa, então seu dinheiro sempre compra mais coisas no futuro do que compra hoje. Se vender antes do vencimento, o preço do título acompanha os juros do mercado, e você pode ganhar ou perder.',
    renda: 'O Tesouro Renda+ foi criado para a aposentadoria: depois de muitos anos, ele vira um "salário" mensal. Rende a inflação mais uma taxa. Quanto mais longe o vencimento, mais tempo para crescer.',
    educa: 'O Tesouro Educa+ foi criado para os pais juntarem dinheiro para a faculdade dos filhos. Rende a inflação mais uma taxa e depois paga um valor por mês durante 5 anos.',
    cdbLiq: 'Você empresta dinheiro para um banco, e ele usa esse dinheiro para emprestar a outras pessoas. Este pode ser resgatado a qualquer hora. Se o banco quebrar, o FGC devolve até R$ 250 mil.',
    cdbCar: 'Um CDB com carência: você promete deixar o dinheiro parado um tempo e, em troca, o banco paga mais. Bancos menores costumam pagar mais porque têm um pouco mais de risco. Tem garantia do FGC.',
    cdbPre: 'Um CDB com taxa fixa: você já sabe quanto vai ganhar por ano. Tem carência e garantia do FGC.',
    cdbIpca: 'Um CDB que rende a inflação mais uma taxa, protegendo seu poder de compra. Tem carência e garantia do FGC.',
    lci: 'Letra de Crédito Imobiliário: o banco usa seu dinheiro para financiar casas e apartamentos. Não paga Imposto de Renda! Mas o dinheiro precisa ficar pelo menos 1 ano. Tem FGC.',
    lca: 'Letra de Crédito do Agronegócio: o banco usa seu dinheiro para emprestar a quem planta e cria animais. Não paga Imposto de Renda! Precisa ficar pelo menos 9 meses. Tem FGC.',
    deb: 'Debênture é quando uma EMPRESA pede dinheiro emprestado direto para você. As incentivadas financiam estradas, energia e saneamento, por isso não pagam IR. Atenção: não tem FGC! Se a empresa quebrar, você pode perder.',
    cri: 'Certificado de Recebíveis Imobiliários: você financia construções e recebe parte das parcelas. Não paga IR, mas não tem FGC: o risco é da empresa que emitiu.',
    cra: 'Certificado de Recebíveis do Agronegócio: você financia empresas do campo e recebe juros. Não paga IR, mas não tem FGC: o risco é da empresa que emitiu.',
    fundoDi: 'Um gestor junta o dinheiro de muita gente e aplica em títulos que rendem perto do CDI. Ele cobra uma taxa de administração por esse trabalho, então rende um pouco menos que um CDB 100%.',
    fii: 'Fundo imobiliário (FII): junta o dinheiro de muita gente para investir em imóveis ou em dívidas ligadas a imóveis. Todo mês o que o fundo recebe é dividido entre os cotistas, sem Imposto de Renda. '
};

const ATIVOS = {};
const fixa = (id, nome, idx, extra, explica) =>
    (ATIVOS[id] = { tipo: 'fixa', nome, idx, minimo: 30, carencia: 0, pct: 1, spread: 0, garantia: 'FGC até R$ 250 mil', ...extra, explica });
const variavel = tipo => (id, nome, preco, vol, ret, dy, explica) =>
    (ATIVOS[id] = { tipo, nome, preco, vol, ret, dy, explica: (tipo === 'fii' ? TXT.fii : '') + explica });
const acao = variavel('acao');
const etf = variavel('etf');
const fii = variavel('fii');
const TESOURO = { garantia: 'Tesouro Nacional (governo)' };
const SEM_FGC = 'Não tem FGC (risco da empresa)';

fixa('POUP', 'Poupança', 'poup', { minimo: 1, isento: true }, TXT.poup);
fixa('TSELIC29', 'Tesouro Selic 2029', 'selic', { ...TESOURO, spread: 0.0004, venc: '2029-03-01' }, TXT.selic);
fixa('TSELIC31', 'Tesouro Selic 2031', 'selic', { ...TESOURO, spread: 0.0010, venc: '2031-03-01' }, TXT.selic);
fixa('TPRE28', 'Tesouro Prefixado 2028', 'pre', { ...TESOURO, spread: 0, venc: '2028-01-01' }, TXT.pre);
fixa('TPRE32', 'Tesouro Prefixado 2032', 'pre', { ...TESOURO, spread: 0.004, venc: '2032-01-01' }, TXT.pre);
fixa('TIPCA29', 'Tesouro IPCA+ 2029', 'ipca', { ...TESOURO, spread: -0.002, venc: '2029-05-15' }, TXT.ipca);
fixa('TIPCA35', 'Tesouro IPCA+ 2035', 'ipca', { ...TESOURO, spread: 0, venc: '2035-05-15' }, TXT.ipca);
fixa('TIPCA45', 'Tesouro IPCA+ 2045', 'ipca', { ...TESOURO, spread: -0.004, venc: '2045-05-15' }, TXT.ipca);
fixa('RENDA65', 'Tesouro Renda+ 2065', 'ipca', { ...TESOURO, spread: -0.005, venc: '2065-01-15' }, TXT.renda);
fixa('EDUCA35', 'Tesouro Educa+ 2035', 'ipca', { ...TESOURO, spread: -0.003, venc: '2035-12-15' }, TXT.educa);
fixa('CDBNU', 'CDB Nubank', 'cdi', { pct: 1.00, minimo: 1 }, TXT.cdbLiq);
fixa('CDBINTER', 'CDB Inter', 'cdi', { pct: 1.00, minimo: 1 }, TXT.cdbLiq);
fixa('CDBITAU', 'CDB Itaú', 'cdi', { pct: 0.97, minimo: 50 }, TXT.cdbLiq);
fixa('CDBBRAD', 'CDB Bradesco', 'cdi', { pct: 0.95, minimo: 50 }, TXT.cdbLiq);
fixa('CDBBB', 'CDB Banco do Brasil', 'cdi', { pct: 0.98, minimo: 50 }, TXT.cdbLiq);
fixa('CDBC6', 'CDB C6 Bank', 'cdi', { pct: 1.02, carencia: 252, minimo: 100 }, TXT.cdbCar);
fixa('CDBBTG', 'CDB BTG Pactual', 'cdi', { pct: 1.03, carencia: 252, minimo: 100 }, TXT.cdbCar);
fixa('CDBXP', 'CDB XP', 'cdi', { pct: 1.05, carencia: 504, minimo: 100 }, TXT.cdbCar);
fixa('CDBSOF', 'CDB Sofisa', 'cdi', { pct: 1.10, carencia: 504, minimo: 100 }, TXT.cdbCar);
fixa('CDBBMG', 'CDB BMG', 'cdi', { pct: 1.15, carencia: 756, minimo: 100 }, TXT.cdbCar);
fixa('CDBPAN', 'CDB Pan Prefixado', 'pre', { spread: 0.010, carencia: 252, minimo: 100 }, TXT.cdbPre);
fixa('CDBDAY', 'CDB Daycoval IPCA+', 'ipca', { spread: -0.003, carencia: 504, minimo: 100 }, TXT.cdbIpca);
fixa('LCICAIXA', 'LCI Caixa', 'cdi', { pct: 0.88, carencia: 252, minimo: 100, isento: true }, TXT.lci);
fixa('LCIINTER', 'LCI Inter', 'cdi', { pct: 0.92, carencia: 252, minimo: 100, isento: true }, TXT.lci);
fixa('LCABB', 'LCA Banco do Brasil', 'cdi', { pct: 0.90, carencia: 189, minimo: 100, isento: true }, TXT.lca);
fixa('LCABTG', 'LCA BTG Pactual', 'cdi', { pct: 0.94, carencia: 189, minimo: 100, isento: true }, TXT.lca);
fixa('DEBINFRA', 'Debênture Incentivada', 'ipca', { spread: 0, carencia: 504, minimo: 100, isento: true, garantia: SEM_FGC }, TXT.deb);
fixa('CRIIMOB', 'CRI Imobiliário', 'ipca', { spread: -0.005, carencia: 504, minimo: 100, isento: true, garantia: SEM_FGC }, TXT.cri);
fixa('CRAAGRO', 'CRA Agronegócio', 'cdi', { pct: 0.97, carencia: 504, minimo: 100, isento: true, garantia: SEM_FGC }, TXT.cra);
fixa('FUNDODI', 'Fundo DI', 'cdi', { pct: 1.00, spread: -0.005, minimo: 1, garantia: 'Não tem FGC (aplica em títulos seguros)' }, TXT.fundoDi);

// Preços iniciais aproximados. ret = retorno anual esperado total; dy = parte paga como proventos; vol = oscilação anual.
acao('PETR4', 'Petrobras', 32, 0.32, 0.16, 0.10, 'A Petrobras tira petróleo do fundo do mar e transforma em gasolina e diesel. Quando o petróleo fica caro no mundo, ela costuma lucrar mais. Paga muitos dividendos.');
acao('VALE3', 'Vale', 55, 0.30, 0.15, 0.08, 'A Vale tira minério de ferro da terra, que vira aço para prédios e carros. Vende muito para a China: quando a China cresce, a Vale costuma ir bem.');
acao('ITUB4', 'Itaú Unibanco', 36, 0.24, 0.15, 0.07, 'O maior banco privado do Brasil. Ganha dinheiro emprestando com juros e cobrando tarifas. Bancos grandes costumam oscilar menos que petróleo ou minério.');
acao('BBDC4', 'Bradesco', 15, 0.30, 0.14, 0.07, 'Um dos maiores bancos do Brasil, com agências em quase todas as cidades. Também tem uma grande empresa de seguros.');
acao('BBAS3', 'Banco do Brasil', 22, 0.30, 0.15, 0.09, 'Um banco que tem o governo como sócio principal. Empresta muito para o agronegócio. Paga bons dividendos.');
acao('B3SA3', 'B3', 13, 0.30, 0.14, 0.05, 'A B3 é a própria bolsa de valores do Brasil! Ela ganha um pouquinho em cada compra e venda de ações. Quanto mais gente investe, melhor para ela.');
acao('WEGE3', 'WEG', 45, 0.28, 0.14, 0.02, 'A WEG fabrica motores elétricos usados no mundo inteiro. Em vez de distribuir o lucro, prefere usar o dinheiro para crescer, por isso paga poucos dividendos.');
acao('EMBR3', 'Embraer', 70, 0.38, 0.14, 0.01, 'A Embraer fabrica aviões no Brasil e vende para companhias aéreas do mundo todo. Como vende em dólar, ganha quando o dólar sobe.');
acao('ABEV3', 'Ambev', 13, 0.20, 0.12, 0.06, 'A Ambev faz bebidas como refrigerantes, sucos e águas. As pessoas compram sempre, então é uma empresa mais estável.');
acao('MGLU3', 'Magazine Luiza', 9, 0.60, 0.12, 0, 'Uma grande loja de varejo e site de compras. É uma ação muito arriscada: o preço já subiu e caiu muito. Veja como ela balança mais que as outras!');
acao('LREN3', 'Lojas Renner', 16, 0.40, 0.13, 0.03, 'A maior rede de lojas de roupas do Brasil. Quando as pessoas têm mais dinheiro sobrando, compram mais roupas, e a Renner vende mais.');
acao('RADL3', 'Raia Drogasil', 26, 0.30, 0.13, 0.01, 'A maior rede de farmácias do Brasil. Remédio as pessoas precisam comprar mesmo quando a economia vai mal.');
acao('RENT3', 'Localiza', 40, 0.40, 0.14, 0.02, 'A maior locadora de carros do Brasil. Aluga carros para viagens, empresas e motoristas de aplicativo. Sofre quando os juros sobem, porque compra carros com dinheiro emprestado.');
acao('SUZB3', 'Suzano', 55, 0.30, 0.13, 0.03, 'A Suzano planta eucalipto e transforma em celulose, que vira papel e papel higiênico no mundo inteiro.');
acao('KLBN11', 'Klabin', 20, 0.25, 0.13, 0.05, 'A Klabin faz papel e caixas de papelão. Toda compra pela internet chega numa caixa, e muitas são feitas por ela!');
acao('GGBR4', 'Gerdau', 17, 0.32, 0.13, 0.05, 'A Gerdau fabrica aço, usado em prédios, pontes e carros. Vai bem quando o mundo está construindo muito.');
acao('PRIO3', 'PRIO', 40, 0.38, 0.15, 0.01, 'A PRIO compra campos de petróleo antigos e consegue tirar mais petróleo deles gastando pouco. Oscila bastante com o preço do petróleo.');
acao('SBSP3', 'Sabesp', 110, 0.26, 0.14, 0.02, 'A Sabesp leva água tratada e coleta esgoto em São Paulo. Todo mundo precisa de água, então a receita é bem previsível.');
acao('EQTL3', 'Equatorial', 33, 0.25, 0.14, 0.03, 'A Equatorial leva energia elétrica para milhões de casas em vários estados. É especialista em melhorar distribuidoras que funcionavam mal.');
acao('CMIG4', 'Cemig', 11, 0.26, 0.14, 0.09, 'A Cemig gera e distribui energia em Minas Gerais. Paga muitos dividendos.');
acao('TAEE11', 'Taesa', 36, 0.16, 0.13, 0.09, 'A Taesa é dona de linhas de transmissão de energia, aquelas torres gigantes. Recebe um valor fixo por ano para manter as linhas, por isso é bem estável e paga muitos dividendos.');
acao('VIVT3', 'Vivo', 30, 0.20, 0.12, 0.06, 'A Vivo é uma das maiores empresas de celular e internet do Brasil. Cobra mensalidade de milhões de clientes, então é estável.');
etf('BOVA11', 'ETF Ibovespa', 130, 0.20, 0.15, 0, 'Um ETF é uma cesta. Com uma cota você compra um pedacinho das maiores empresas da bolsa ao mesmo tempo. Se uma vai mal, as outras ajudam. Isso é diversificar.');
etf('SMAL11', 'ETF Small Caps', 100, 0.26, 0.15, 0, 'Uma cesta de empresas menores da bolsa. Elas podem crescer mais rápido, mas também balançam mais.');
etf('IVVB11', 'ETF S&P 500 (EUA)', 380, 0.18, 0.13, 0, 'Uma cesta com as 500 maiores empresas dos Estados Unidos, como Apple, Microsoft e Google. É um jeito de investir fora do Brasil.');
etf('GOLD11', 'ETF Ouro', 18, 0.17, 0.10, 0, 'Acompanha o preço do ouro. Muita gente compra ouro para se proteger quando o mundo está com medo de crises.');
fii('MXRF11', 'FII Maxi Renda', 9.5, 0.12, 0.14, 0.12, 'Este fundo investe em dívidas ligadas a imóveis. A cota é baratinha, ótima para começar.');
fii('HGLG11', 'FII CSHG Logística', 155, 0.14, 0.13, 0.085, 'Dono de galpões enormes onde as lojas guardam produtos antes de entregar na sua casa.');
fii('KNRI11', 'FII Kinea Renda', 140, 0.13, 0.13, 0.08, 'Dono de prédios de escritórios e galpões alugados para grandes empresas.');
fii('XPML11', 'FII XP Malls', 100, 0.15, 0.14, 0.10, 'Dono de partes de shopping centers. Ganha uma parte do aluguel das lojas.');
fii('VISC11', 'FII Vinci Shopping Centers', 105, 0.15, 0.14, 0.095, 'Dono de partes de vários shoppings pelo Brasil. Ganha com o aluguel das lojas e com o estacionamento.');
fii('MALL11', 'FII Genial Malls', 100, 0.16, 0.14, 0.095, 'Dono de shoppings em cidades médias e grandes. Quando o comércio vende bem, os aluguéis sobem.');
fii('BTLG11', 'FII BTG Logística', 100, 0.12, 0.14, 0.095, 'Dono de galpões alugados para empresas de entrega e indústrias. Contratos longos deixam o aluguel bem previsível.');
fii('XPLG11', 'FII XP Log', 95, 0.14, 0.14, 0.09, 'Dono de grandes galpões perto das capitais, onde as lojas guardam produtos antes de entregar.');
fii('VILG11', 'FII Vinci Logística', 85, 0.15, 0.14, 0.09, 'Dono de galpões de logística alugados para varejistas e empresas de comércio eletrônico.');
fii('LVBI11', 'FII VBI Logístico', 105, 0.13, 0.14, 0.09, 'Dono de galpões modernos alugados para grandes empresas de varejo e transporte.');
fii('BRCO11', 'FII Bresco Logística', 110, 0.13, 0.14, 0.09, 'Dono de galpões de alta qualidade alugados para empresas grandes e confiáveis.');
fii('HGRE11', 'FII CSHG Real Estate', 115, 0.16, 0.13, 0.085, 'Dono de andares de prédios de escritórios ("lajes corporativas") em São Paulo e outras capitais.');
fii('PVBI11', 'FII VBI Prime Properties', 78, 0.15, 0.13, 0.08, 'Dono de prédios de escritórios novos e bem localizados. Escritórios bons sofrem menos com salas vazias.');
fii('JSRE11', 'FII JS Real Estate', 60, 0.17, 0.13, 0.085, 'Dono de prédios de escritórios em São Paulo. Quando muitas empresas saem dos escritórios, o fundo sofre.');
fii('HGRU11', 'FII CSHG Renda Urbana', 125, 0.13, 0.14, 0.09, 'Dono de supermercados, lojas e escolas alugados por contratos longos para empresas conhecidas.');
fii('TRXF11', 'FII TRX Real Estate', 100, 0.13, 0.14, 0.10, 'Compra imóveis de supermercados e lojas e aluga de volta para as próprias empresas por muitos anos.');
fii('GARE11', 'FII Guardian Real Estate', 8.5, 0.14, 0.14, 0.11, 'Dono de supermercados e galpões alugados por contratos longos. Cota baratinha.');
fii('KNCR11', 'FII Kinea Rendimentos', 103, 0.05, 0.15, 0.13, 'Fundo de "papel": empresta para empresas do setor imobiliário e recebe juros que acompanham o CDI. Quando a Selic sobe, ele distribui mais.');
fii('KNIP11', 'FII Kinea Índices de Preços', 88, 0.08, 0.14, 0.11, 'Fundo de "papel": empresta para o setor imobiliário e recebe juros que acompanham a inflação (IPCA) mais uma taxa.');
fii('CPTS11', 'FII Capitânia Securities', 7.5, 0.12, 0.14, 0.12, 'Fundo de "papel" que investe em dívidas imobiliárias e em cotas de outros fundos. Cota baratinha.');
fii('RECR11', 'FII REC Recebíveis', 78, 0.13, 0.15, 0.13, 'Fundo de "papel" que empresta para construtoras e loteamentos. Paga mais porque tem mais risco de calote.');
fii('VGIR11', 'FII Valora CRI CDI', 9.5, 0.07, 0.15, 0.135, 'Fundo de "papel" com dívidas imobiliárias que rendem perto do CDI. Cota baratinha.');
fii('IRDM11', 'FII Iridium Recebíveis', 60, 0.18, 0.15, 0.13, 'Fundo de "papel" que empresta para empresas mais arriscadas em troca de juros maiores. Já teve quedas fortes quando alguns devedores atrasaram.');
fii('HFOF11', 'FII Hedge Top FOFII', 65, 0.15, 0.14, 0.10, 'Um "fundo de fundos": em vez de comprar imóveis, compra cotas de vários outros FIIs. É uma cesta de fundos imobiliários.');

const ORDEM = Object.keys(ATIVOS);
const ehFixa = id => ATIVOS[id].tipo === 'fixa';
// Só os títulos do Tesouro prefixados e IPCA+ têm preço que muda com os juros (marcação a mercado).
const comMarcacao = id => ATIVOS[id].garantia === TESOURO.garantia && (ATIVOS[id].idx === 'pre' || ATIVOS[id].idx === 'ipca');
const VARIAVEIS = ORDEM.filter(id => !ehFixa(id));
// Títulos com data de vencimento: quando um vence, o jogo lança outro igual com prazo mais longo.
const COM_VENCIMENTO = ORDEM.filter(id => ATIVOS[id].venc);
COM_VENCIMENTO.forEach(id => {
    ATIVOS[id].vencBase = ATIVOS[id].venc;
    ATIVOS[id].nomeBase = ATIVOS[id].nome;
});
const CORES_CARTEIRA = ['#3d7bfd', '#16c784', '#f0b90b', '#a855f7', '#ea3943', '#22d3ee', '#f97316', '#84cc16', '#ec4899', '#94a3b8', '#14b8a6', '#eab308'];
const GRUPOS = [
    ['fixa', 'Renda fixa · rende juros'],
    ['acao', 'Ações · pedacinhos de empresas'],
    ['fii', 'Fundos imobiliários · rendimento todo mês'],
    ['etf', 'ETFs · cestas de ativos']
];

let estado;
let diasVencimento = {};
let ladoBoleta = 'compra';
let periodo = 126;
let modo = 'velas';
let aba = 'carteira';
let filtro = 'todos';
let busca = '';
let hoverPrincipal = null;
let hoverPatrimonio = null;
let tela = 'mercado'; // só no celular: qual parte do jogo aparece (mercado, ativo, carteira, vida ou mais)

/* ---------- Formatação ---------- */
const fmtBRL = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtNum = v => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (v, sinal = true) => (sinal && v > 0 ? '+' : '') + fmtNum(v * 100) + '%';
const classe = v => (v > 0 ? 'sobe' : v < 0 ? 'desce' : '');
const fmtData = d => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
const unidade = id => (ATIVOS[id].tipo === 'acao' ? 'ações' : 'cotas');

/* ---------- Taxas reais ---------- */
// Partem dos valores reais do Banco Central e mudam com as notícias de juros e inflação do jogo.
const limitar = (v, min, max) => Math.min(max, Math.max(min, v));
const selic = () => limitar((estado && estado.baseSelic != null ? estado.baseSelic : mercado.selic) + (estado ? estado.ajusteSelic : 0), 0.02, 0.25);
const ipca = () => limitar((estado && estado.baseIpca != null ? estado.baseIpca : mercado.ipca12m) + (estado ? estado.ajusteIpca : 0), -0.01, 0.15);
const mensalPoupanca = () => (selic() > 0.085 ? 0.005 : 0.7 * selic() / 12);
const cdi = () => selic() - 0.001;
// O perfil do governo muda o juro "de equilíbrio" e a inflação para onde a economia tende no longo prazo.
const juroNeutro = () => JURO_REAL_NEUTRO + (estado.governo === 'populista' ? 0.015 : estado.governo === 'mercado' ? -0.01 : 0);
const ancoraInflacao = () => (estado.governo === 'populista' ? 0.052 : estado.governo === 'mercado' ? 0.035 : 0.04);
// Durante a campanha eleitoral a bolsa oscila mais, e cada vez mais perto do dia da votação.
const volEleitoral = () => (estado && estado.campanha && estado.proximaEleicao
    ? 1 + 0.4 * limitar(1 - (estado.proximaEleicao - estado.dia) / DIAS_CAMPANHA, 0, 1) : 1);

function taxaTravada(id) {
    const a = ATIVOS[id];
    const premio = estado.premioFiscal || 0; // risco do governo: o mercado cobra mais juros se desconfia das contas públicas
    return a.idx === 'pre' ? mercado.prefixado + estado.ajusteSelic * 0.8 + premio + a.spread : mercado.ipcaReal + estado.ajusteSelic * 0.5 + premio + a.spread;
}

function taxaAnual(id, lote) {
    const a = ATIVOS[id];
    switch (a.idx) {
        case 'poup': return Math.pow(1 + mensalPoupanca(), 12) - 1;
        case 'selic': return selic() + a.spread;
        case 'cdi': return cdi() * a.pct + a.spread;
        case 'pre': return lote ? lote.taxa : taxaTravada(id);
        case 'ipca': return (1 + (lote ? lote.taxa : taxaTravada(id))) * (1 + ipca()) - 1;
    }
}

function taxaTexto(id) {
    const a = ATIVOS[id];
    switch (a.idx) {
        case 'poup': return fmtPct(mensalPoupanca(), false) + ' ao mês';
        case 'selic': return 'Selic + ' + fmtPct(a.spread, false);
        case 'cdi': return a.spread ? 'CDI − ' + fmtPct(-a.spread, false) : Math.round(a.pct * 100) + '% do CDI';
        case 'pre': return fmtPct(taxaTravada(id), false) + ' ao ano';
        case 'ipca': return 'IPCA + ' + fmtPct(taxaTravada(id), false);
    }
}

const fatorDiario = (id, lote) => Math.pow(1 + taxaAnual(id, lote), 1 / DIAS_ANO);

function liquidezTexto(id) {
    const c = ATIVOS[id].carencia;
    if (!c) return id === 'FUNDODI' || id.startsWith('T') || id.startsWith('RENDA') || id.startsWith('EDUCA') ? 'Diária (D+1)' : 'Diária';
    const meses = Math.round(c / DIAS_MES);
    return meses % 12 === 0 ? `Após ${meses / 12} ano${meses > 12 ? 's' : ''}` : `Após ${meses} meses`;
}

// Marcação a mercado: se o mercado hoje pede juros maiores do que o da sua taxa travada, o título vale
// menos que o valor "na curva" (deságio). Se pede menos, vale mais (ágio). Perto do vencimento a diferença some.
function valorMercado(lote) {
    if (!comMarcacao(lote.ativo) || lote.taxa == null) return lote.valor;
    const anos = Math.max(0, (diasVencimento[lote.ativo] || estado.dia) - estado.dia) / DIAS_ANO;
    return lote.valor * Math.pow((1 + lote.taxa) / (1 + taxaTravada(lote.ativo)), anos);
}

// IOF (aproximado da tabela regressiva) e IR pela tabela regressiva real da renda fixa.
function calcularResgate(lote) {
    const valor = valorMercado(lote);
    const rendimento = Math.max(0, valor - lote.aplicado);
    if (ATIVOS[lote.ativo].isento) return { bruto: valor, iof: 0, ir: 0, liquido: valor };
    const corridos = Math.round(lote.dias * 365 / DIAS_ANO);
    const iof = corridos < 30 ? rendimento * (30 - corridos) / 30 : 0;
    const aliquota = corridos <= 180 ? 0.225 : corridos <= 360 ? 0.20 : corridos <= 720 ? 0.175 : 0.15;
    const ir = (rendimento - iof) * aliquota;
    return { bruto: valor, iof, ir, liquido: valor - iof - ir };
}

const disponivel = lote => lote.dias >= ATIVOS[lote.ativo].carencia;
const vencido = id => diasVencimento[id] != null && estado.dia >= diasVencimento[id];

/* ---------- Simulação de mercado ---------- */
function normal() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Passeio aleatório log-normal: crescimento médio = ret - dy, com a oscilação (vol) de cada ativo.
// extra = empurrão diário (em log) vindo das notícias ativas.
function proximaVela(a, fechamentoAnterior, extra = 0) {
    const s = a.vol / Math.sqrt(DIAS_ANO) * volEleitoral();
    const tendencia = Math.log(1 + a.ret - a.dy) / DIAS_ANO - s * s / 2 + extra;
    const o = fechamentoAnterior;
    const c = o * Math.exp(tendencia + s * normal());
    const pavio = Math.abs(normal()) * s * 0.5;
    return { o, c, h: Math.max(o, c) * (1 + pavio), l: Math.min(o, c) * (1 - pavio) };
}

function historicoInicial(id) {
    const a = ATIVOS[id];
    const h = [];
    let ultimo = 1;
    for (let i = 0; i < DIAS_ANO; i++) {
        const vela = proximaVela(a, ultimo);
        h.push(vela);
        ultimo = vela.c;
    }
    const escala = a.preco / ultimo;
    return h.map(v => ({ o: v.o * escala, h: v.h * escala, l: v.l * escala, c: v.c * escala }));
}

// A renda fixa não é guardada: o gráfico "quanto R$ 100 viraram" é recalculado a partir da taxa.
function historicoFixa(id, n) {
    const h = [100];
    for (let d = estado.dia - n + 1; d <= estado.dia; d++) {
        const ultimo = h[h.length - 1];
        if (ATIVOS[id].idx === 'poup') h.push(d % DIAS_MES === 0 ? ultimo * (1 + mensalPoupanca()) : ultimo);
        else h.push(ultimo * fatorDiario(id));
    }
    return h;
}

const preco = id => {
    const h = estado.hist[id];
    return h[h.length - 1].c;
};

function variacao(id, dias) {
    const h = estado.hist[id];
    return h[h.length - 1].c / h[Math.max(0, h.length - 1 - dias)].c - 1;
}

function patrimonioAtual() {
    let total = estado.caixa + estado.proventos;
    for (const id in estado.acoes) total += estado.acoes[id].qtd * preco(id);
    for (const lote of estado.lotes) total += valorMercado(lote);
    total += patrimonioBens() + patrimonioEmpresas();
    return total;
}

function registrar(texto, valor) {
    estado.extrato.unshift({ dia: estado.dia, texto, valor });
    if (estado.extrato.length > 300) estado.extrato.pop();
}

function passarDia() {
    // A Selic e o IPCA de partida são os do mundo real no dia em que o tempo começa a andar. Depois disso, só o jogo manda.
    if (estado.baseSelic == null) {
        estado.baseSelic = mercado.selic;
        estado.baseIpca = mercado.ipca12m;
    }
    estado.dia++;
    const dia = estado.dia;

    const extra = {};
    for (const ef of estado.efeitos) {
        extra[ef.id] = (extra[ef.id] || 0) + ef.drift;
        ef.dias--;
    }
    estado.efeitos = estado.efeitos.filter(ef => ef.dias > 0);
    for (const e of estado.empresas) if (e.listada) extra[e.listada] = (extra[e.listada] || 0) + puxarAoValorJusto(e);

    const fechado = estado.mercadoFechado;
    for (const id of VARIAVEIS) {
        const h = estado.hist[id];
        const ultimo = h[h.length - 1].c;
        if (fechado) {
            // Bolsa fechada: o gráfico fica parado, mas o preço "de verdade" continua se mexendo por trás.
            estado.sombra[id] = proximaVela(ATIVOS[id], estado.sombra[id], extra[id] || 0).c;
            h.push({ o: ultimo, c: ultimo, h: ultimo, l: ultimo });
        } else {
            h.push(proximaVela(ATIVOS[id], ultimo, extra[id] || 0));
        }
        if (h.length > MAX_HISTORICO) h.shift();
    }
    if (fechado && dia >= fechado.ate) reabrirMercado();

    if (dia % 63 === 0) temporadaResultados();
    if (dia >= estado.proximoCopom) reuniaoCopom();
    resolverRumores();
    concluirVendas();
    gerirEleicao();
    verificarEmpresas();
    if (estado.carreira && !estado.mercadoFechado && dia > 126 && Math.random() < PROB_CISNE_DIA) cisneNegro();
    if (estado.carreira && dia > 30 && Math.random() < PROB_IMPREVISTO_DIA * multImprevistos()) imprevisto();
    if (dia >= estado.proximaNoticia) {
        gerarNoticia();
        estado.proximaNoticia = dia + 15 + Math.floor(Math.random() * 13);
    }

    for (const lote of estado.lotes) {
        lote.dias++;
        if (lote.ativo === 'POUP') {
            if (lote.dias % DIAS_MES === 0) lote.valor *= 1 + mensalPoupanca();
        } else {
            lote.valor *= fatorDiario(lote.ativo, lote);
        }
    }

    let rolou = false;
    for (const id of COM_VENCIMENTO) {
        if (dia < diasVencimento[id]) continue;
        for (const lote of estado.lotes.filter(l => l.ativo === id)) {
            const r = calcularResgate(lote);
            estado.caixa += r.liquido;
            registrar(`${ATIVOS[id].nome} venceu! O governo devolveu seu dinheiro com juros.`, r.liquido);
        }
        estado.lotes = estado.lotes.filter(l => l.ativo !== id);
        rolarTitulo(id);
        rolou = true;
    }
    if (rolou) calcularVencimentos();

    for (const id in estado.acoes) {
        const a = ATIVOS[id];
        const intervalo = a.tipo === 'fii' ? DIAS_MES : 63;
        if (!a.dy || dia % intervalo) continue;
        const valor = estado.acoes[id].qtd * preco(id) * a.dy * intervalo / DIAS_ANO;
        estado.proventos += valor;
        registrar(a.tipo === 'fii'
            ? `Rendimento de ${id}: sua parte do que o fundo recebeu no mês (guardado em Dividendos a receber)`
            : `Dividendos de ${id}: a empresa dividiu parte do lucro com você (guardado em Dividendos a receber)`, valor);
    }

    fecharMes();

    estado.patrimonio.push(patrimonioAtual());
    estado.investidoHist.push(estado.totalAportado);
    if (estado.patrimonio.length > MAX_PATRIMONIO) {
        estado.patrimonio.shift();
        estado.investidoHist.shift();
    }
}

function avancar(dias) {
    if (!estado.carreira) return pedirCarreira();
    const antes = patrimonioAtual();
    const precosAntes = {};
    VARIAVEIS.forEach(id => (precosAntes[id] = preco(id)));
    const noticiasAntes = estado.noticias.length;
    const aportadoAntes = estado.totalAportado;

    for (let i = 0; i < dias; i++) passarDia();

    const novasNoticias = Math.max(0, estado.noticias.length - noticiasAntes);
    const depois = patrimonioAtual();
    let destaque = null;
    for (const id in precosAntes) {
        const v = preco(id) / precosAntes[id] - 1;
        if (!destaque || Math.abs(v) > Math.abs(destaque.v)) destaque = { id, v };
    }
    const rotulo = dias === 1 ? 'Passou 1 dia' : dias === DIAS_MES ? 'Passou 1 mês' : 'Passou 1 ano';
    const dif = depois - antes;
    const sobra = estado.totalAportado - aportadoAntes;
    mostrarToast(
        `<b>${rotulo}.</b> Seu patrimônio foi de ${fmtBRL(antes)} para <b class="${classe(dif)}">${fmtBRL(depois)}</b>` +
        ` (${dif >= 0 ? '+' : ''}${fmtBRL(dif)}).<br>Quem mais se mexeu: <b>${destaque.id}</b> <span class="${classe(destaque.v)}">${fmtPct(destaque.v)}</span>` +
        (sobra > 0.005 ? `<br>Do seu salário sobraram <b class="sobe">${fmtBRL(sobra)}</b> para investir.` : '') +
        (sobra < -0.005 ? `<br>Seu custo de vida passou do salário em <b class="desce">${fmtBRL(-sobra)}</b>.` : '') +
        (novasNoticias ? `<br>Saíram <b>${novasNoticias} notícia${novasNoticias > 1 ? 's' : ''}</b>: veja na aba Notícias.` : ''),
        dif >= 0 ? 'ok' : 'erro',
        8000
    );
    salvar();
    renderTudo();
}

/* ---------- Relógio em tempo real ---------- */
// estado.velocidade: 0 = pausado, 1, 2, 3 ou 4 = quantas vezes mais rápido que o normal (1 dia útil a cada 1 minuto).
const segundosPorDia = () => SEGUNDOS_POR_DIA / estado.velocidade;

// O tempo só anda com o jogo aberto e na tela. Um salto de mais de 10 segundos significa
// que o app estava fechado ou o computador dormiu: esse tempo é descartado.
function relogio() {
    const agora = Date.now();
    const passou = agora - estado.ultimoTick;
    estado.ultimoTick = agora;
    if (!estado.velocidade || document.hidden || passou > 10000) return 0;
    estado.acumulado += passou / 1000;
    const spd = segundosPorDia();
    let dias = 0;
    while (estado.acumulado >= spd) {
        passarDia();
        estado.acumulado -= spd;
        dias++;
    }
    return dias;
}

function atualizarContagem() {
    const texto = document.getElementById('contagem');
    const barra = document.getElementById('progresso');
    if (!estado.velocidade) {
        texto.textContent = estado.carreira ? 'O tempo está parado' : 'Escolha uma profissão para começar';
        barra.style.width = '0';
        return;
    }
    const dias = proximoFechamento().dias;
    texto.textContent = `Salário em ${dias} dia${dias > 1 ? 's úteis' : ' útil'}`;
    barra.style.width = Math.min(100, (estado.acumulado / segundosPorDia()) * 100) + '%';
}

// Enquanto o dedo ou o mouse está apertado, a tela não é redesenhada: assim nenhum clique se perde.
let ponteiroApertado = false;
let renderPendente = false;
window.addEventListener('pointerdown', () => (ponteiroApertado = true), true);
['pointerup', 'pointercancel'].forEach(ev => window.addEventListener(ev, () => (ponteiroApertado = false), true));

function tique() {
    const topoExtrato = estado.extrato[0];
    const topoNoticias = estado.noticias[0];
    const dias = relogio();
    if (dias) {
        // Grava a cada dia do jogo que passa (no máximo a cada 5 segundos), e sempre ao sair ou operar.
        if (Date.now() - ultimoSalvo > 5000) salvar();
        renderPendente = true;
        if (estado.noticias[0] !== topoNoticias) {
            mostrarNoticia(estado.noticias[0]);
        } else {
            const novos = [];
            for (const e of estado.extrato) {
                if (e === topoExtrato) break;
                novos.push(e);
            }
            if (novos.length) {
                mostrarToast(novos.slice(0, 3)
                    .map(e => (e.valor ? `${e.texto} <b class="${classe(e.valor)}">${e.valor > 0 ? '+' : '−'}${fmtBRL(Math.abs(e.valor))}</b>` : e.texto))
                    .join('<br>'), novos.some(e => e.valor < 0) ? '' : 'ok', 8000);
            }
        }
    }
    if (renderPendente && !ponteiroApertado) {
        renderPendente = false;
        renderAoVivo();
    }
    atualizarContagem();
}

/* ---------- Notícias e resultados ---------- */
const ROTULO_NOTICIA = { empresa: 'Empresa', setor: 'Setor', economia: 'Economia', resultado: 'Resultados', rumor: 'Rumor', cisne: 'Cisne negro' };
const ACOES = ORDEM.filter(id => ATIVOS[id].tipo === 'acao');
const CRESCIMENTO_LUCRO = 0.08;
const sorteio = lista => lista[Math.floor(Math.random() * lista.length)];

function sensibilidade(id, fator) {
    const f = PERFIL[id].f;
    if (fator in f) return f[fator];
    return SENSIBILIDADE_PADRAO[ATIVOS[id].tipo][fator] || 0;
}

// A notícia nunca é garantida: a força varia, parte do efeito acontece na hora (salto)
// e o resto ao longo de semanas. Em 15% das vezes "o mercado já esperava" e o preço volta.
function aplicarImpacto(id, total, duracao, semReversao = false) {
    const forca = total * (0.5 + Math.random());
    const salto = forca * Math.random() * 0.6;
    let resto = forca - salto;
    if (!semReversao && Math.random() < 0.15) resto = -resto * 0.6; // 15% das vezes "o mercado já esperava"; num cisne negro, ninguém esperava
    if (estado.mercadoFechado) {
        estado.sombra[id] *= 1 + salto;
    } else {
        const hoje = estado.hist[id][estado.hist[id].length - 1];
        hoje.c *= 1 + salto;
        hoje.h = Math.max(hoje.h, hoje.c);
        hoje.l = Math.min(hoje.l, hoje.c);
    }
    estado.efeitos.push({ id, drift: Math.log(1 + resto) / duracao, dias: duracao });
}

function preencher(texto, id) {
    return texto.replace(/\{empresa\}/g, ATIVOS[id].nome).replace(/\{n\}/g, 10 + Math.floor(Math.random() * 31));
}

// Juros e Selic agora vêm só das reuniões do Copom, no calendário: as notícias sorteadas
// que falavam do Banco Central (decisões e "indicações") ficam de fora do sorteio.
const ehNoticiaDoBC = m => /^Banco Central/.test(m.t);

function gerarNoticia() {
    const deEmpresa = Math.random() < 0.45;
    const grupo = MODELOS.filter(m => !!m.alvo === deEmpresa && !ehNoticiaDoBC(m) && (!m.cond || m.cond()));
    const novos = grupo.filter(m => !estado.usados.includes(m.n));
    const m = sorteio(novos.length ? novos : grupo);
    estado.usados.push(m.n);
    if (estado.usados.length > 80) estado.usados.shift();
    publicarModelo(m, { rumor: Math.random() < PROB_RUMOR && m.ipca == null });
}

// Aplica uma notícia ao mercado e guarda no histórico. Serve para as sorteadas e para as do Copom.
// rumor = o boato mexe no preço agora, mas alguns dias depois sai o desmentido ou a confirmação.
function publicarModelo(m, { rumor = false, tipo, cisne = false } = {}) {
    const impactos = {};
    let titulo = m.t;
    let porque = m.p;
    if (m.alvo) {
        const id = sorteio(VARIAVEIS.filter(x => (m.tag ? PERFIL[x].tags.includes(m.tag) : ATIVOS[x].tipo === 'acao')));
        titulo = preencher(m.t, id);
        porque = porque ? preencher(porque, id) : m.i > 0
            ? 'Notícia boa para a empresa: o mercado costuma reagir com alta.'
            : 'Notícia ruim para a empresa: o mercado costuma reagir com queda.';
        impactos[id] = m.i;
    } else {
        for (const id of VARIAVEIS) {
            let total = 0;
            for (const fator in m.e) total += m.e[fator] * sensibilidade(id, fator);
            if (Math.abs(total) >= 0.01) impactos[id] = limitar(total, -0.55, 0.45);
        }
        if (m.selic) estado.ajusteSelic += m.selic;
        if (m.ipca) estado.ajusteIpca += m.ipca;
        porque = porque || 'As empresas ligadas a esse assunto costumam sentir o efeito.';
    }
    const ids = Object.keys(impactos).sort((a, b) => Math.abs(impactos[b]) - Math.abs(impactos[a]));
    if (rumor && !ids.length) rumor = false;
    const forca = rumor ? 0.7 : 1; // um boato mexe menos que um fato
    const precos = {};
    for (const id of ids) {
        impactos[id] *= forca;
        aplicarImpacto(id, impactos[id], 10 + Math.floor(Math.random() * 20), cisne);
        precos[id] = preco(id);
    }
    const juros = !m.alvo && ('juros' in m.e || m.selic != null || !!m.ipca);
    if (rumor) {
        estado.rumores.push({ dia: estado.dia + 4 + Math.floor(Math.random() * 5), titulo, impactos, juros, desmentido: Math.random() < 0.65 });
        registrarNoticia({
            tipo: 'rumor',
            titulo: 'Rumor: ' + titulo,
            porque: 'Isto ainda é só um boato, sem confirmação. O mercado reage na hora, mas pode se arrepender se for desmentido. ' + porque,
            precos, juros
        });
        return;
    }
    registrarNoticia({ tipo: tipo || (m.alvo ? 'empresa' : m.n >= INICIO_ECONOMIA ? 'economia' : 'setor'), titulo, porque, precos, juros });
}

function resolverRumores() {
    const prontos = estado.rumores.filter(r => estado.dia >= r.dia);
    if (!prontos.length) return;
    estado.rumores = estado.rumores.filter(r => !prontos.includes(r));
    for (const r of prontos) {
        const ids = Object.keys(r.impactos).sort((a, b) => Math.abs(r.impactos[b]) - Math.abs(r.impactos[a]));
        const precos = {};
        for (const id of ids) {
            // Desmentido: desfaz o movimento do boato. Confirmado: o preço continua na mesma direção.
            aplicarImpacto(id, r.desmentido ? -r.impactos[id] : r.impactos[id] * 0.5, 8 + Math.floor(Math.random() * 8));
            precos[id] = preco(id);
        }
        registrarNoticia({
            tipo: 'rumor',
            titulo: (r.desmentido ? 'Desmentido: ' : 'Confirmado: ') + r.titulo,
            porque: r.desmentido
                ? 'O boato não era verdade, e o preço voltou. Quem comprou ou vendeu por causa dele perdeu. Por isso investidores experientes esperam a confirmação antes de agir.'
                : 'Desta vez o boato era verdadeiro e o preço continuou na mesma direção. Mas quem agiu antes estava apostando, não sabendo.',
            precos, juros: r.juros
        });
    }
}

/* ---------- Copom ---------- */
// A reunião cai sempre numa quarta-feira (a "Super Quarta"), a cada 3 meses do jogo.
function agendarCopom(apos = INTERVALO_COPOM) {
    let n = estado.dia + apos;
    while (dataDoDia(n).getDay() !== 3) n++;
    estado.proximoCopom = n;
}

// O Banco Central compara a inflação com a meta e decide se os juros precisam subir, cair ou ficar onde estão.
function reuniaoCopom() {
    const antes = selic();
    const inflacao = ipca();
    const alvo = inflacao + juroNeutro() + 0.5 * (inflacao - META_INFLACAO) + normal() * 0.006;
    const dif = alvo - antes;
    const mag = Math.abs(dif);
    let passo = mag < 0.004 ? 0 : mag < 0.01 ? 0.0025 : mag < 0.02 ? 0.005 : mag < 0.03 ? 0.0075 : 0.01;
    passo = limitar(antes + Math.sign(dif) * passo, 0.02, 0.25) - antes;
    const depois = antes + passo;
    const pontos = fmtNum(Math.abs(passo) * 100) + ' ponto percentual';
    let titulo, porque;
    if (Math.abs(passo) < 0.0001) {
        titulo = `Copom mantém a Selic em ${fmtPct(antes, false)} ao ano`;
        porque = `A inflação em 12 meses está em ${fmtPct(inflacao, false)} e os juros estão perto do que o Banco Central acha adequado. Quando acontece o que todo mundo esperava, os preços quase não mudam.`;
    } else if (passo > 0) {
        titulo = `Copom sobe a Selic em ${pontos}, para ${fmtPct(depois, false)} ao ano`;
        porque = `A inflação está em ${fmtPct(inflacao, false)}, acima do que o Banco Central aceita, e juros mais altos esfriam a economia. A renda fixa passa a render mais, e empréstimos ficam caros, o que atrapalha lojas e locadoras. Títulos prefixados e IPCA+ que você já tem passam a valer menos se forem vendidos antes do vencimento.`;
    } else {
        titulo = `Copom corta a Selic em ${pontos}, para ${fmtPct(depois, false)} ao ano`;
        porque = `Com a inflação em ${fmtPct(inflacao, false)}, o Banco Central tem espaço para baixar os juros. A renda fixa passa a render menos, as empresas pagam menos juros e a bolsa costuma gostar. Títulos prefixados e IPCA+ que você já tem passam a valer mais se forem vendidos antes do vencimento.`;
    }
    publicarModelo({ t: titulo, p: porque, e: { juros: limitar(passo * 10, -0.1, 0.1) }, selic: passo }, { tipo: 'economia' });
    agendarCopom();
}

function temporadaResultados() {
    const linhas = ACOES.map(id => {
        const esperado = CRESCIMENTO_LUCRO + normal() * 0.05;
        // Empresa sua que está na bolsa: o resultado vem dos lucros de verdade, trimestre contra trimestre.
        const propria = estado.empresas.find(x => x.listada === id);
        let real = esperado + normal() * ATIVOS[id].vol * 0.5;
        if (propria && propria.hist.length >= 6) {
            const soma = lista => lista.reduce((t, m) => t + m.l, 0);
            const atual = soma(propria.hist.slice(-3)), anterior = soma(propria.hist.slice(-6, -3));
            real = anterior > 0 ? limitar(atual / anterior - 1, -0.5, 0.5) * 2 : esperado + normal() * 0.1;
        }
        if (!propria) estado.fund[id].lpa *= 1 + real / 4;
        estado.fund[id].ultimo = { real, esperado, dia: estado.dia };
        aplicarImpacto(id, limitar((real - esperado) * 0.5, -0.12, 0.12), 15);
        return { id, real, esperado };
    }).sort((a, b) => (b.real - b.esperado) - (a.real - a.esperado));
    const precos = {};
    linhas.forEach(l => (precos[l.id] = preco(l.id)));
    registrarNoticia({
        tipo: 'resultado',
        titulo: 'Temporada de resultados: as empresas mostraram quanto lucraram',
        porque: 'O que mexe no preço não é só o lucro subir, e sim vir MELHOR ou PIOR do que o mercado esperava.',
        precos,
        tabela: linhas
    });
}

function registrarNoticia(n) {
    estado.noticias.unshift({ dia: estado.dia, ...n });
    if (estado.noticias.length > 120) estado.noticias.pop();
    estado.naoLidas++;
}

function mostrarNoticia(n) {
    mostrarToast(`<span class="selo ${n.tipo}">${ROTULO_NOTICIA[n.tipo]}</span><b>${n.titulo}</b><br><small>${n.porque}</small><br><small class="link">Clique para ver as notícias</small>`, 'noticia', 10000);
}

function resgatarProventos() {
    if (estado.proventos < 0.005) return;
    const valor = estado.proventos;
    estado.caixa += valor;
    estado.proventos = 0;
    registrar(`Você passou ${fmtBRL(valor)} de dividendos para o saldo disponível`, 0);
    mostrarToast(`<b class="sobe">+${fmtBRL(valor)}</b> foram para o seu saldo! Esse dinheiro veio dos lucros e aluguéis dos seus investimentos.`, 'ok');
    concluirOperacao();
}

/* ---------- Operações ---------- */
function comprarAcao(id, qtd) {
    if (estado.mercadoFechado) return avisoMercadoFechado();
    const custo = qtd * preco(id);
    if (!(qtd >= 1)) return mostrarToast('Escolha pelo menos 1.', 'erro');
    if (custo > estado.caixa + 1e-9) return mostrarToast(`Saldo insuficiente. Você tem ${fmtBRL(estado.caixa)} e precisa de ${fmtBRL(custo)}.`, 'erro');
    const pos = estado.acoes[id] || { qtd: 0, pm: 0 };
    pos.pm = (pos.pm * pos.qtd + custo) / (pos.qtd + qtd);
    pos.qtd += qtd;
    estado.acoes[id] = pos;
    estado.caixa -= custo;
    registrar(`Compra de ${qtd} ${id} a ${fmtBRL(preco(id))}`, -custo);
    const textoAlegria = alegriaDoInvestimento(custo);
    mostrarToast((ATIVOS[id].tipo === 'acao'
        ? `Você comprou <b>${qtd} ${id}</b> por ${fmtBRL(custo)}. Agora você é sócio da ${ATIVOS[id].nome}!`
        : `Você comprou <b>${qtd} cotas de ${id}</b> por ${fmtBRL(custo)}.`) + textoAlegria, 'ok');
    concluirOperacao();
}

function previaVenda(id, qtd) {
    const pos = estado.acoes[id];
    const valor = qtd * preco(id);
    const lucro = (preco(id) - pos.pm) * qtd;
    const mes = chaveMes(dataDoDia(estado.dia));
    const vendidoNoMes = estado.vendasMes.mes === mes ? estado.vendasMes.total : 0;
    // Ações: vendas até R$ 20 mil no mês são isentas. FIIs e ETFs pagam 20% e 15% sobre o lucro, sem isenção.
    const tipo = ATIVOS[id].tipo;
    let aliquota = 0;
    if (lucro > 0) {
        if (tipo === 'fii') aliquota = 0.20;
        else if (tipo === 'etf') aliquota = 0.15;
        else if (vendidoNoMes + valor > 20000) aliquota = 0.15;
    }
    return { valor, lucro, ir: lucro * aliquota, mes, vendidoNoMes };
}

function venderAcao(id, qtd) {
    if (estado.mercadoFechado) return avisoMercadoFechado();
    const pos = estado.acoes[id];
    if (!pos || !(qtd >= 1) || qtd > pos.qtd) return mostrarToast(`Você só tem ${pos ? pos.qtd : 0} ${unidade(id)} de ${id} para vender.`, 'erro');
    const p = previaVenda(id, qtd);
    if (ATIVOS[id].tipo === 'acao') estado.vendasMes = { mes: p.mes, total: p.vendidoNoMes + p.valor };
    estado.caixa += p.valor - p.ir;
    pos.qtd -= qtd;
    if (pos.qtd === 0) delete estado.acoes[id];
    registrar(`Venda de ${qtd} ${id} a ${fmtBRL(preco(id))}` + (p.ir ? ` (IR ${fmtBRL(p.ir)})` : ''), p.valor - p.ir);
    mostrarToast(
        `Você vendeu <b>${qtd} ${id}</b> por ${fmtBRL(p.valor)}. ` +
        (p.lucro >= 0 ? `Lucro de <b class="sobe">${fmtBRL(p.lucro)}</b>!` : `Prejuízo de <b class="desce">${fmtBRL(-p.lucro)}</b>.`),
        p.lucro >= 0 ? 'ok' : 'erro'
    );
    concluirOperacao();
}

function aplicar(id, valor) {
    const a = ATIVOS[id];
    if (vencido(id)) return mostrarToast(`${a.nome} já venceu e não aceita novas aplicações.`, 'erro');
    if (!(valor >= a.minimo)) return mostrarToast(`O mínimo para aplicar em ${a.nome} é ${fmtBRL(a.minimo)}.`, 'erro');
    if (valor > estado.caixa + 1e-9) return mostrarToast(`Saldo insuficiente. Você tem ${fmtBRL(estado.caixa)}.`, 'erro');
    const lote = { ativo: id, aplicado: valor, valor, dias: 0 };
    if (a.idx === 'pre' || a.idx === 'ipca') lote.taxa = taxaTravada(id);
    estado.lotes.push(lote);
    estado.caixa -= valor;
    registrar(`Aplicação em ${a.nome}`, -valor);
    mostrarToast(`Você aplicou <b>${fmtBRL(valor)}</b> em ${a.nome}. Agora é só esperar o tempo passar!` + alegriaDoInvestimento(valor), 'ok');
    concluirOperacao();
}

function somarResgates(lotes) {
    return lotes.reduce((s, l) => {
        const r = calcularResgate(l);
        return { aplicado: s.aplicado + l.aplicado, bruto: s.bruto + r.bruto, iof: s.iof + r.iof, ir: s.ir + r.ir, liquido: s.liquido + r.liquido };
    }, { aplicado: 0, bruto: 0, iof: 0, ir: 0, liquido: 0 });
}

function resgatar(id) {
    const lotes = estado.lotes.filter(l => l.ativo === id && disponivel(l));
    if (!lotes.length) return mostrarToast('Esse dinheiro ainda está na carência e não pode ser resgatado.', 'erro');
    const r = somarResgates(lotes);
    estado.lotes = estado.lotes.filter(l => !lotes.includes(l));
    estado.caixa += r.liquido;
    registrar(`Resgate de ${ATIVOS[id].nome}` + (r.ir + r.iof > 0 ? ` (impostos ${fmtBRL(r.ir + r.iof)})` : ''), r.liquido);
    const ganho = r.liquido - r.aplicado;
    mostrarToast(`Você resgatou <b>${fmtBRL(r.liquido)}</b> de ${ATIVOS[id].nome}. Ganho: <b class="${classe(ganho)}">${fmtBRL(ganho)}</b>.`, 'ok');
    concluirOperacao();
}

function concluirOperacao() {
    estado.patrimonio[estado.patrimonio.length - 1] = patrimonioAtual();
    salvar();
    renderTudo();
}

/* ---------- Datas (dias úteis) ---------- */
// Guarda o último dia calculado para não recontar desde o início a cada chamada.
let memoData = null;
function dataDoDia(n) {
    let d, faltam;
    const passo = n >= 0 ? 1 : -1;
    if (n >= 0 && memoData && memoData.inicio === estado.inicio && n >= memoData.n) {
        d = new Date(memoData.d);
        faltam = n - memoData.n;
    } else {
        d = new Date(estado.inicio + 'T12:00:00');
        faltam = Math.abs(n);
    }
    while (faltam > 0) {
        d.setDate(d.getDate() + passo);
        const semana = d.getDay();
        if (semana !== 0 && semana !== 6) faltam--;
    }
    if (n === estado.dia) memoData = { n, d: new Date(d), inicio: estado.inicio };
    return d;
}

const chaveMes = d => `${d.getFullYear()}-${d.getMonth()}`;

/* ---------- Salário, custo de vida e fechamento do mês ---------- */
const moeda = v => Math.round(v * 100) / 100;
const cargoAtual = () => (estado.carreira ? CARREIRAS[estado.carreira.trilha].cargos[estado.carreira.nivel] : null);
// Reajuste anual dos salários (em janeiro, junto com o salário mínimo):
// cargos de entrada acompanham o mínimo, que é o piso por lei; cargos altos só repõem a inflação.
// A mistura é gradual: até 2 mínimos segue o mínimo, a partir de 6 mínimos segue só a inflação.
function salarioDoCargo(valor) {
    const base = valor / SALARIO_MINIMO_REFERENCIA * SALARIO_MINIMO_INICIAL;
    const peso = limitar((6 - base / SALARIO_MINIMO_INICIAL) / 4, 0, 1);
    const fator = peso * (estado.salarioMinimo / SALARIO_MINIMO_INICIAL) + (1 - peso) * estado.fatorIR;
    return moeda(Math.max(base * fator, estado.salarioMinimo));
}
const custoDeVida = (nivel = estado.padraoVida) => moeda(PADROES_VIDA[nivel].custo * estado.indicePrecos);

// Do bruto ao que sobra: desconta INSS e Imposto de Renda, depois o custo de vida e os custos dos bens.
function holerite() {
    const cargo = cargoAtual();
    const bruto = cargo ? salarioDoCargo(cargo[1]) : 0;
    const inss = moeda(calcularINSS(bruto, estado.fatorIR));
    const irrf = moeda(calcularIRRF(bruto, inss, estado.fatorIR));
    const liquido = moeda(bruto - inss - irrf);
    const fb = fluxoBens();
    const custoBase = custoDeVida();
    const economia = economiaBens();
    const custo = moeda(custoBase - economia);
    const bens = moeda(fb.iptu + fb.manut + fb.parcelas);
    const alugueis = moeda(fb.aluguel);
    return { cargo: cargo ? cargo[0] : 'Sem trabalho', bruto, inss, irrf, liquido, custoBase, economia, custo, bens, alugueis, sobra: moeda(liquido - custo - bens + alugueis) };
}

// Regra real do salário mínimo: inflação (INPC, aqui o IPCA do jogo) + crescimento do PIB,
// com ganho real limitado entre 0,6% e 2,5% ao ano. A tabela do IR é corrigida pela inflação.
function reajustarSalarioMinimo(ano) {
    const inflacao = Math.max(0, ipca());
    const ganhoReal = limitar(0.02 + normal() * 0.01, 0.006, 0.025);
    const reajuste = (1 + inflacao) * (1 + ganhoReal) - 1;
    const antes = estado.salarioMinimo;
    estado.salarioMinimo = moeda(antes * (1 + reajuste));
    estado.fatorIR = estado.indicePrecos;
    estado.anoReajuste = ano;
    registrar(`Salário mínimo reajustado em ${fmtPct(reajuste, false)} (inflação ${fmtPct(inflacao, false)} + ganho real ${fmtPct(ganhoReal, false)}): foi de ${fmtBRL(antes)} para ${fmtBRL(estado.salarioMinimo)}. Seu salário sobe junto!`, 0);
}

// Roda no primeiro dia útil de cada mês: juros do saldo negativo, salário, impostos e custo de vida.
function fecharMes() {
    const hoje = dataDoDia(estado.dia);
    const chave = chaveMes(hoje);
    if (chave === estado.mesFechamento) return;
    estado.mesFechamento = chave;
    estado.indicePrecos *= Math.pow(1 + ipca(), 1 / 12);
    // Juros altos esfriam a economia e puxam a inflação para baixo; juros baixos fazem o contrário.
    estado.ajusteIpca = limitar(estado.ajusteIpca - (selic() - ipca() - juroNeutro()) * 0.015 + (ancoraInflacao() - ipca()) * 0.01, -0.2, 0.2);
    if (hoje.getMonth() === 0 && estado.anoReajuste !== hoje.getFullYear()) reajustarSalarioMinimo(hoje.getFullYear());
    if (estado.caixa < -0.005) {
        const juros = moeda(-estado.caixa * JUROS_CHEQUE_ESPECIAL);
        estado.caixa -= juros;
        registrar(`Juros do cheque especial: seu saldo estava negativo e o banco cobrou ${fmtPct(JUROS_CHEQUE_ESPECIAL, false)} ao mês`, -juros);
    }
    estado.indiceImoveis = Math.max(0.3, estado.indiceImoveis * (1 + (Math.pow(1 + ipca(), 1 / 12) - 1) + 0.0004 - 0.15 * (selic() - 0.10) / 12 + normal() * 0.012));
    // Conjuntura: -1 é economia ruim e +1 é economia aquecida. Juros altos pesam, e um cisne negro derruba de uma vez.
    estado.conjuntura = limitar(0.85 * estado.conjuntura + 0.15 * limitar(-(selic() - ipca() - juroNeutro()) * 10, -1, 1) + normal() * 0.12, -2, 1.5);
    fecharEmpresas();
    if (!estado.carreira) return;
    if (hoje.getMonth() === 0 && estado.anoIPVA !== hoje.getFullYear()) {
        estado.anoIPVA = hoje.getFullYear();
        for (const b of estado.bens.filter(x => x.tipo === 'carro')) {
            const ipva = moeda(valorDoBem(b) * IPVA_ANO);
            estado.caixa -= ipva;
            estado.totalAportado -= ipva;
            registrar(`IPVA do ${b.nome}: o imposto anual do carro`, -ipva);
        }
    }
    const h = holerite();
    const fb = fluxoBens();
    estado.carreira.meses++;
    estado.caixa += h.sobra;
    // O que entra na conta "dinheiro guardado": salário menos gastos, incluindo o que se amortizou da dívida
    // (vira patrimônio). O aluguel recebido não entra: ele é rendimento do imóvel.
    estado.totalAportado += h.liquido - h.custo - fb.iptu - fb.manut - fb.juros;
    registrar(`Salário de ${h.cargo}: ${fmtBRL(h.bruto)} bruto, menos INSS ${fmtBRL(h.inss)} e Imposto de Renda ${fmtBRL(h.irrf)}`, h.liquido);
    registrar(`Custo de vida do mês (${PADROES_VIDA[estado.padraoVida].nome})` + (h.economia > 0 ? ', já sem o que você economiza com seus bens' : ''), -h.custo);
    if (fb.parcelas > 0.005) registrar('Parcelas dos financiamentos', -fb.parcelas);
    if (fb.iptu + fb.manut > 0.005) registrar('IPTU, manutenção e custos dos seus bens', -(fb.iptu + fb.manut));
    if (fb.aluguel > 0.005) registrar('Aluguéis recebidos dos seus imóveis', fb.aluguel);
    aplicarFluxoBens();
    if (hoje.getMonth() === 11) {
        // O 13º paga INSS e IR separados do salário do mês.
        const decimo = h.liquido;
        estado.caixa += decimo;
        estado.totalAportado += decimo;
        registrar('13º salário! Um salário extra, já com os descontos. Hora de investir.', decimo);
    }
    atualizarFelicidadeDoMes();
}

function proximoFechamento() {
    let n = estado.dia + 1;
    while (chaveMes(dataDoDia(n)) === estado.mesFechamento) n++;
    const data = dataDoDia(n);
    return { data, dias: n - estado.dia, dezembro: data.getMonth() === 11 };
}

function proximaPromocao() {
    const c = estado.carreira;
    const cargos = CARREIRAS[c.trilha].cargos;
    if (c.nivel >= cargos.length - 1) return null;
    const [nome, valor] = cargos[c.nivel + 1];
    const salario = salarioDoCargo(valor);
    const mesesExigidos = MESES_NO_CARGO[Math.min(c.nivel, MESES_NO_CARGO.length - 1)];
    return { nome, salario, custo: moeda(salario * CUSTO_CURSO), mesesExigidos, faltam: Math.max(0, mesesExigidos - c.meses) };
}

function promover() {
    const p = proximaPromocao();
    if (!p) return;
    if (p.faltam) return mostrarToast(`Você ainda precisa de mais ${p.faltam} ${p.faltam > 1 ? 'meses' : 'mês'} de experiência no cargo atual.`, 'erro');
    if (p.custo > estado.caixa + 1e-9) return mostrarToast(`O curso custa ${fmtBRL(p.custo)} e você tem ${fmtBRL(estado.caixa)} de saldo disponível.`, 'erro');
    estado.caixa -= p.custo;
    estado.totalAportado -= p.custo;
    estado.carreira.nivel++;
    estado.carreira.meses = 0;
    registrar(`Curso de capacitação concluído: você foi promovido a ${p.nome}`, -p.custo);
    mostrarToast(`Parabéns! Você agora é <b>${p.nome}</b> e ganha <b class="sobe">${fmtBRL(p.salario)}</b> por mês. Investir em você mesmo também rende.`, 'ok', 8000);
    concluirOperacao();
}

function escolherCarreira(trilha) {
    const primeira = !estado.carreira;
    if (!primeira && !confirm(`Trocar de carreira para ${CARREIRAS[trilha].nome}? Você recomeça no primeiro cargo.`)) return;
    estado.carreira = { trilha, nivel: 0, meses: 0 };
    trocandoCarreira = false;
    const [cargo, valor] = cargoAtual();
    registrar(`Novo emprego: ${cargo} (${CARREIRAS[trilha].nome})`, 0);
    if (primeira) {
        estado.velocidade = 1;
        estado.acumulado = 0;
        estado.ultimoTick = Date.now();
    }
    mostrarToast(`Você começou como <b>${cargo}</b>, ganhando ${fmtBRL(salarioDoCargo(valor))} por mês.` +
        (primeira ? ' O tempo começou a andar: todo mês o que sobrar do salário cai no seu saldo.' : ''), 'ok', 8000);
    concluirOperacao();
}

function mudarPadraoVida(nivel) {
    if (nivel === estado.padraoVida) return;
    // A alegria conta a partir do padrão do começo do mês: subir e descer no mesmo mês se anulam.
    const bonus = d => (d > 0 ? d * FELICIDADE_SUBIR_PADRAO : d * FELICIDADE_DESCER_PADRAO);
    const novo = bonus(nivel - estado.padraoMes);
    const delta = novo - estado.bonusPadraoMes;
    estado.bonusPadraoMes = novo;
    mudarFelicidade(delta);
    estado.padraoVida = nivel;
    registrar(`Você mudou seu padrão de vida para "${PADROES_VIDA[nivel].nome}"`, 0);
    const efeito = Math.round(delta);
    mostrarToast(`Seu custo de vida agora é de <b>${fmtBRL(custoDeVida())}</b> por mês.` +
        (efeito ? `<br>Felicidade: <b class="${classe(efeito)}">${efeito > 0 ? '+' : ''}${efeito}</b>.` : ''), 'ok');
    concluirOperacao();
}

/* ---------- Felicidade ---------- */
// 0 = feliz o bastante, 1 = no fundo do poço (e o contrário em alegria).
const tristeza = () => limitar((50 - estado.felicidade) / 50, 0, 1);
const alegria = () => limitar((estado.felicidade - 50) / 50, 0, 1);
// Gente triste e estressada adoece e se descuida mais: os imprevistos ficam mais frequentes.
const multImprevistos = () => 1 + tristeza() * (IMPREVISTO_MULT_TRISTE - 1) - alegria() * (1 - IMPREVISTO_MULT_FELIZ);
const mudarFelicidade = delta => (estado.felicidade = limitar(estado.felicidade + delta, 0, 100));

const HUMORES = [[80, '😄', 'Muito feliz'], [60, '🙂', 'Feliz'], [40, '😐', 'Normal'], [20, '😟', 'Desanimado'], [0, '😢', 'Muito triste']];
const humor = (f = estado.felicidade) => HUMORES.find(([min]) => f >= min);
const corFelicidade = (f = estado.felicidade) => (f >= 60 ? 'var(--verde)' : f >= 35 ? 'var(--amarelo)' : 'var(--vermelho)');

// Para onde a felicidade vai se nada mudar. Quem só guarda e quase não aproveita o salário fica com um alvo baixo.
function alvoFelicidade() {
    const h = holerite();
    const parteVida = h.liquido > 0 ? h.custoBase / h.liquido : 1;
    const partes = {
        parteVida,
        padrao: Math.min(75, 25 + parteVida * 75),
        casa: moradiaAtual() ? FELICIDADE_CASA_PROPRIA : 0,
        carro: estado.bens.some(b => b.tipo === 'carro') ? FELICIDADE_CARRO : 0,
        vermelho: estado.caixa < -0.005 ? FELICIDADE_NO_VERMELHO : 0
    };
    partes.alvo = limitar(partes.padrao + partes.casa + partes.carro + partes.vermelho, 0, 100);
    return partes;
}

function atualizarFelicidadeDoMes() {
    const antes = estado.felicidade;
    const dif = alvoFelicidade().alvo - antes;
    mudarFelicidade(dif * (dif < 0 ? FELICIDADE_RITMO_CAINDO : FELICIDADE_RITMO_SUBINDO));
    estado.padraoMes = estado.padraoVida;
    estado.bonusPadraoMes = 0;
    estado.alegriaInvestMes = 0;
    if (antes >= 35 && estado.felicidade < 35) {
        registrar('Sua felicidade está baixa: só trabalhar e guardar cansa. Imprevistos e problemas de saúde ficam mais frequentes. Que tal aproveitar um pouco mais o seu salário?', 0);
    }
}

// Cada investimento dá um pouco de alegria, proporcional ao valor perto do salário líquido.
// Devolve o texto para o aviso da operação (vazio quando não mudou nada).
function alegriaDoInvestimento(valor) {
    const base = Math.max(holerite().liquido, estado.salarioMinimo);
    const teto = alvoFelicidade().alvo + FELICIDADE_INVESTIR_ACIMA_ALVO;
    const pedido = Math.min(FELICIDADE_INVESTIR_FATOR * valor / base, FELICIDADE_INVESTIR_MAX);
    const sobraMes = FELICIDADE_INVESTIR_MES - estado.alegriaInvestMes;
    const ganho = Math.min(pedido, sobraMes, teto - estado.felicidade);
    if (ganho < 0.05) {
        if (pedido < 0.05) return '';
        return sobraMes < 0.05
            ? '<br>Você já ganhou toda a alegria de investir deste mês.'
            : '<br>Investir já não aumenta sua felicidade: falta aproveitar um pouco a vida.';
    }
    estado.alegriaInvestMes += ganho;
    mudarFelicidade(ganho);
    return ` Felicidade <b class="sobe">+${ganho.toFixed(1).replace('.', ',')}</b>.`;
}

// Comprar um bem dá alegria proporcional ao tamanho da compra perto de tudo o que você tem.
function alegriaDaCompra(preco) {
    const base = Math.max(0, patrimonioAtual()) + preco;
    return limitar(FELICIDADE_BEM_FATOR * preco / base, 1, FELICIDADE_BEM_MAX);
}

function pedirCarreira() {
    aba = 'vida';
    renderAba();
    if (celular()) irPara('vida');
    else document.getElementById('tabs').scrollIntoView({ behavior: 'smooth' });
    mostrarToast('Escolha uma profissão para o jogo começar.', 'erro');
}

// Quanto os investimentos pagam por mês sem precisar vender nada: dividendos e aluguéis,
// mais os juros da renda fixa que passam da inflação (gastar só essa parte não corrói o dinheiro).
function rendaPassivaMensal() {
    let total = 0;
    for (const id in estado.acoes) total += estado.acoes[id].qtd * preco(id) * ATIVOS[id].dy / 12;
    for (const lote of estado.lotes) total += lote.valor * Math.max(0, taxaAnual(lote.ativo, lote) - ipca()) / 12;
    total += fluxoBens().aluguel;
    for (const e of estado.empresas) {
        const h = e.hist.slice(-12);
        const medio = h.reduce((soma, m) => soma + m.d, 0) / (h.length || 1);
        total += e.listada ? medio * participacao(e) : medio;
    }
    return total;
}

/* ---------- Eleições ---------- */
// A eleição cai sempre na última segunda-feira de outubro de um ano 2026 + 4k (o mercado só reage no dia útil seguinte à votação).
function dataEleicao(ano) {
    const d = new Date(ano, 9, 31, 12);
    while (d.getDay() !== 0) d.setDate(d.getDate() - 1);
    d.setDate(d.getDate() + 1);
    return d;
}

function diaUtilDaData(alvo) {
    const d = new Date(dataDoDia(estado.dia));
    let n = estado.dia;
    while (d < alvo) {
        d.setDate(d.getDate() + 1);
        if (d.getDay() !== 0 && d.getDay() !== 6) n++;
    }
    return n;
}

function agendarEleicao() {
    const hoje = dataDoDia(estado.dia);
    let ano = estado.anoEleicao ? estado.anoEleicao + 4 : 2026;
    while (dataEleicao(ano) - hoje < 270 * 86400000) ano += 4;
    estado.anoEleicao = ano;
    estado.proximaEleicao = diaUtilDaData(dataEleicao(ano));
}

const AVISO_FICTICIO = ' Os candidatos deste jogo são inventados e não representam nenhum partido ou pessoa real.';
const PRO_MERCADO = 'O candidato pró-mercado promete contas públicas em ordem e reformas. Investidores gostam disso: a bolsa sobe, o dólar cai e os juros do mercado diminuem.';
const POPULISTA = 'O candidato populista promete mais gastos do governo. Investidores temem que a dívida cresça: a bolsa cai, o dólar sobe e os juros do mercado aumentam.';

function gerirEleicao() {
    if (!estado.campanha && estado.dia >= estado.proximaEleicao - DIAS_CAMPANHA) iniciarCampanha();
    if (estado.campanha && estado.dia < estado.proximaEleicao && estado.dia % DIAS_MES === 0) pesquisaEleitoral();
    if (estado.dia >= estado.proximaEleicao) resolverEleicao();
}

function iniciarCampanha() {
    estado.campanha = true;
    estado.tendenciaEleitoral = limitar(normal() * 0.5, -0.8, 0.8); // para onde o eleitor realmente pende (as pesquisas só chegam perto)
    estado.pesquisa = limitar(estado.tendenciaEleitoral * 0.3 + normal() * 0.25, -1, 1);
    publicarModelo({
        t: 'Começa a campanha eleitoral: o mercado fica mais nervoso',
        p: 'Faltam 6 meses para a votação. Ninguém sabe quem vai ganhar, e investidores odeiam incerteza, então os preços passam a oscilar mais até o resultado.' + AVISO_FICTICIO,
        e: { mercado: -0.01 }
    }, { tipo: 'economia' });
}

function pesquisaEleitoral() {
    const antes = estado.pesquisa;
    estado.pesquisa = limitar(0.75 * antes + 0.25 * estado.tendenciaEleitoral + normal() * 0.18, -1, 1);
    const delta = estado.pesquisa - antes;
    if (Math.abs(delta) < 0.12) return;
    const mag = limitar(Math.abs(delta) * 0.08, 0.01, 0.05);
    const alta = delta > 0;
    publicarModelo({
        t: `Pesquisa eleitoral: candidato ${alta ? 'pró-mercado' : 'populista'} ganha força`,
        p: (alta ? PRO_MERCADO : POPULISTA) + ' Pesquisa é só uma foto do momento, e o resultado final pode ser outro.',
        e: alta ? { mercado: mag, dolar: -mag * 0.8, juros: -mag * 0.5 } : { mercado: -mag, dolar: mag * 0.8, juros: mag * 0.5 }
    }, { tipo: 'economia' });
}

function resolverEleicao() {
    const pMercado = limitar(0.5 + 0.4 * estado.pesquisa, 0.08, 0.92);
    const mercadoVence = Math.random() < pMercado;
    const favorito = estado.pesquisa >= 0;
    const claro = Math.abs(estado.pesquisa) > 0.25;
    // O que mexe no preço é a surpresa: vitória esperada pelas pesquisas muda pouco, zebra muda muito.
    const mult = !claro ? 1 : favorito === mercadoVence ? 0.6 : 1.6;
    const base = mercadoVence
        ? { mercado: 0.07, dolar: -0.06, juros: -0.03, credito: 0.03 }
        : { mercado: -0.07, dolar: 0.06, juros: 0.03, credito: -0.03 };
    const e = {};
    for (const k in base) e[k] = base[k] * mult;
    estado.governo = mercadoVence ? 'mercado' : 'populista';
    estado.premioFiscal = mercadoVence ? -0.01 : 0.02;
    estado.campanha = false;
    estado.pesquisa = 0;
    publicarModelo({
        t: `Eleição: vence o candidato de perfil ${mercadoVence ? 'pró-mercado' : 'populista'}`,
        p: (mercadoVence ? PRO_MERCADO : POPULISTA) +
            (!claro ? ' Foi uma disputa apertada, sem favorito claro.'
                : favorito === mercadoVence ? ' A vitória já era esperada pelas pesquisas, então o mercado reagiu pouco: o que importa é a surpresa.'
                    : ' Foi uma surpresa, contra o que as pesquisas mostravam, então o mercado reagiu forte.') +
            ' Pelos próximos 4 anos, isso muda os juros e a inflação para onde a economia tende, e os títulos do Tesouro ajustam o preço.' + AVISO_FICTICIO,
        e, ipca: mercadoVence ? -0.002 : 0.004
    }, { tipo: 'economia' });
    agendarEleicao();
}

/* ---------- Cisnes negros ---------- */
const CISNES = [
    { t: 'nova doença se espalha pelo mundo e governos fecham as fronteiras', imoveis: -0.06, conj: -1.6,
      e: { mercado: -0.32, consumo: -0.10, petroleo: -0.12, aviao: -0.10, locacao: -0.08, shopping: -0.10, imoveis: -0.12, ouro: 0.06, dolar: 0.12, saude: 0.04 },
      p: 'Uma pandemia para o comércio, as viagens e as fábricas ao mesmo tempo. Quase tudo cai, menos o que as pessoas procuram em tempos de medo, como o ouro e o dólar.' },
    { t: 'guerra de grandes proporções começa e assusta o mundo', imoveis: -0.04, conj: -1.1,
      e: { mercado: -0.24, petroleo: 0.15, dolar: 0.09, ouro: 0.12, eua: -0.08, aviao: -0.06, agro: 0.05, imoveis: -0.08 },
      p: 'Guerras travam o comércio e deixam o petróleo e os alimentos mais caros. Os investidores correm para o ouro e o dólar, que são vistos como porto seguro.' },
    { t: 'grande crise financeira global: bancos importantes quebram', imoveis: -0.08, conj: -1.4,
      e: { mercado: -0.34, credito: -0.16, eua: -0.12, dolar: 0.10, ouro: 0.08, imoveis: -0.14 },
      p: 'Quando bancos grandes quebram, o crédito seca e ninguém confia em ninguém. As empresas ficam sem dinheiro emprestado, e o medo se espalha pelo mundo todo.' }
];

function cisneNegro(tipo = sorteio(CISNES)) {
    VARIAVEIS.forEach(id => (estado.antesCrise[id] = preco(id)));
    publicarModelo({
        t: `Cisne negro: ${tipo.t}`,
        p: tipo.p + ' Um cisne negro é um evento raro que ninguém previu e que abala o mercado inteiro. Estas quedas são tão fortes que a bolsa ativa o circuit breaker.',
        e: tipo.e
    }, { tipo: 'cisne', cisne: true });
    estado.indiceImoveis *= 1 + tipo.imoveis;
    estado.conjuntura = Math.min(estado.conjuntura, tipo.conj);
    estado.sombra = {};
    VARIAVEIS.forEach(id => (estado.sombra[id] = preco(id)));
    estado.mercadoFechado = { desde: estado.dia, ate: estado.dia + DIAS_FECHADO };
    // O Banco Central corta a Selic pela metade, numa reunião de emergência.
    const antes = selic();
    const depois = Math.max(0.02, antes / 2);
    estado.ajusteSelic += depois - antes;
    publicarModelo({
        t: `Banco Central corta a Selic pela metade, para ${fmtPct(depois, false)} ao ano, em reunião de emergência`,
        p: 'Para evitar que a economia pare, o Banco Central baixa os juros de uma vez. Isso barateia o crédito e faz os títulos prefixados e IPCA+ que você tem valerem mais.',
        e: { juros: -0.04 }
    }, { tipo: 'economia' });
    registrarNoticia({
        tipo: 'cisne',
        titulo: 'Circuit breaker: a bolsa fecha por um mês',
        porque: `As negociações de ações, ETFs e fundos imobiliários estão suspensas até ${dataDoDia(estado.mercadoFechado.ate).toLocaleDateString('pt-BR')}. Os preços continuam se mexendo por trás, e quando a bolsa reabrir pode haver um grande salto. Enquanto isso, só dá para mexer na renda fixa. É por isso que uma reserva fora da bolsa importa.`,
        precos: {}, juros: false
    });
}

function reabrirMercado() {
    const quedas = {};
    for (const id of VARIAVEIS) {
        const h = estado.hist[id];
        const v = h[h.length - 1];
        v.c = estado.sombra[id];
        v.h = Math.max(v.h, v.c);
        v.l = Math.min(v.l, v.c);
        quedas[id] = v.c / estado.antesCrise[id] - 1;
        // A bolsa costuma recuperar parte da queda: metade em 6 meses.
        if (quedas[id] < 0) estado.efeitos.push({ id, drift: Math.log(1 - quedas[id] * 0.5) / 126, dias: 126 });
    }
    const ids = Object.keys(quedas).sort((a, b) => quedas[a] - quedas[b]);
    const precos = {};
    ids.forEach(id => (precos[id] = estado.antesCrise[id]));
    const medias = tipo => {
        const l = ids.filter(id => ATIVOS[id].tipo === tipo);
        return l.reduce((soma, id) => soma + quedas[id], 0) / (l.length || 1);
    };
    estado.mercadoFechado = null;
    estado.sombra = {};
    registrarNoticia({
        tipo: 'cisne',
        titulo: 'A bolsa reabre depois de um mês fechada',
        porque: `Na volta, as ações variaram ${fmtPct(medias('acao'))} em média desde antes da crise, e os fundos imobiliários ${fmtPct(medias('fii'))}. Quem vendeu no pânico garantiu a perda. Historicamente, a bolsa recupera boa parte da queda com o tempo, mas ninguém sabe quando.`,
        precos, juros: false
    });
}

const avisoMercadoFechado = () => mostrarToast(`A bolsa está fechada (circuit breaker) até ${dataDoDia(estado.mercadoFechado.ate).toLocaleDateString('pt-BR')}. Só dá para mexer na renda fixa.`, 'erro', 8000);

/* ---------- Empresas ---------- */
const empresaPorUid = uid => estado.empresas.find(e => e.uid === +uid);
const privadas = () => estado.empresas.filter(e => !e.listada);
const participacao = e => (estado.acoes[e.listada] ? estado.acoes[e.listada].qtd : 0) / e.acoesTotal;
const sorteioPeso = lista => {
    let x = Math.random() * lista.reduce((soma, i) => soma + i.peso, 0);
    for (const i of lista) {
        x -= i.peso;
        if (x <= 0) return i;
    }
    return lista[lista.length - 1];
};
const setorDa = e => SETORES_EMPRESA[e.setor];
// Juros altos baixam o preço de qualquer empresa: o mesmo lucro vale menos quando a renda fixa paga muito.
const fatorJuros = () => limitar(Math.pow(0.10 / selic(), 0.8), 0.5, 1.6);
const custoFixoNominal = e => e.custoFixo * estado.indicePrecos;
const chamadaValor = e => moeda(-e.caixa + 2 * custoFixoNominal(e));
const lucroMedioMensal = (e, n = 12) => {
    const h = e.hist.slice(-n);
    return h.length ? h.reduce((soma, m) => soma + m.l, 0) / h.length : 0;
};

// Valor da empresa: lucro anual vezes um múltiplo (que cai quando a Selic sobe). Startup ainda sem lucro vale
// um pouco pelo faturamento e pelo ritmo de crescimento, mas só depois de 6 meses de história.
function avaliarEmpresa(e) {
    const set = setorDa(e);
    const h = e.hist;
    const lucroAno = lucroMedioMensal(e) * 12;
    const multiplo = set.multiplo * fatorJuros();
    const evLucro = Math.max(0, lucroAno) * multiplo;
    let evReceita = 0;
    if (e.startup && h.length >= 6) {
        const k = Math.min(12, h.length - 1);
        const g = Math.pow(h[h.length - 1].r / h[h.length - 1 - k].r, 1 / k) - 1;
        const recAno = h.slice(-12).reduce((soma, m) => soma + m.r, 0) / Math.min(12, h.length) * 12;
        evReceita = recAno * 1.0 * limitar(g / 0.04, 0.3, 2.5) * fatorJuros() * 0.5;
    }
    const ev = Math.max(evLucro, evReceita);
    return { ev, lucroAno, multiplo, valor: Math.max(0, ev + e.caixa) };
}

const patrimonioEmpresas = () => estado.empresas.filter(e => !e.listada).reduce((soma, e) => soma + avaliarEmpresa(e).valor, 0);

// Roda todo mês: a receita varia com o setor e com a economia, o lucro entra no caixa da empresa
// e o que passa da reserva (3 meses de custo fixo) é distribuído para você.
function fecharEmpresas() {
    for (const e of estado.empresas) {
        const set = setorDa(e);
        let g = e.g + set.sens * estado.conjuntura * 0.055 + normal() * 0.02;
        if (e.startup) {
            e.g = Math.max(0.004, e.g * 0.98); // o crescimento esfria com o tempo
            if (e.receita >= e.teto) g = Math.min(g, 0.004);
        } else if (e.potencial) {
            // Empresa estabelecida: depois de uma crise, as vendas voltam aos poucos para o que eram.
            e.potencial *= 1 + set.g;
            e.custoFixo *= 1 + set.g; // a empresa cresce junto: os custos fixos acompanham o tamanho dela, não o ciclo
            g += 0.07 * limitar(Math.log(e.potencial / e.receita), -0.7, 0.7);
        }
        e.receita *= 1 + limitar(g, -0.15, 0.18);
        const rec = e.receita * estado.indicePrecos;
        const lucro = rec * (1 - set.v) - custoFixoNominal(e);
        e.caixa += lucro;
        const reserva = 3 * custoFixoNominal(e);
        const distribuido = lucro > 0 && e.caixa > reserva ? Math.min(lucro, e.caixa - reserva) : 0;
        if (distribuido > 0) {
            e.caixa -= distribuido;
            if (e.listada) {
                // Na bolsa o lucro é dividido entre todos os acionistas; a sua parte é a das ações que você tem.
                const sua = distribuido * participacao(e);
                if (sua > 0.005) {
                    estado.proventos += sua;
                    e.recebido += sua;
                    registrar(`Dividendos de ${e.listada}: sua parte dos lucros da empresa (guardado em Dividendos a receber)`, sua);
                }
            } else {
                estado.caixa += distribuido;
                e.recebido += distribuido;
                registrar(`Lucros distribuídos por ${e.nome}`, distribuido);
            }
        }
        e.hist.push({ r: rec, l: lucro, d: distribuido });
        if (e.hist.length > 24) e.hist.shift();
        if (e.listada) {
            estado.fund[e.listada].lpa = Math.max(0.0001, lucroMedioMensal(e) * 12 / e.acoesTotal);
            if (e.caixa < 0) emitirAcoes(e);
        } else if (e.caixa < 0 && !e.prazo) {
            e.prazo = estado.dia + PRAZO_CHAMADA;
            registrar(`Chamada de capital: ${e.nome} ficou sem caixa. Você tem 1 mês para colocar ${fmtBRL(chamadaValor(e))}, ou a empresa vai à falência`, 0);
        }
    }
}

function verificarEmpresas() {
    for (const e of estado.empresas.filter(x => x.prazo && estado.dia >= x.prazo)) {
        if (e.caixa < 0) falencia(e);
        else e.prazo = null;
    }
    for (const e of estado.empresas) if (e.propostas && estado.dia > e.propostas.ate) e.propostas = null;
    if (!estado.ofertasEmpresas || estado.dia >= estado.ofertasEmpresas.dia + 126) gerarOfertasEmpresas();
}

function falencia(e) {
    estado.empresas = estado.empresas.filter(x => x !== e);
    registrar(`Falência: ${e.nome} não recebeu o capital a tempo e fechou as portas. Os ${fmtBRL(e.investido)} que você colocou nela foram perdidos`, 0);
}

function injetarCapital(uid, valor) {
    const e = empresaPorUid(uid);
    valor = moeda(valor);
    if (!e || e.listada || !(valor > 0)) return;
    if (valor > estado.caixa + 1e-9) return mostrarToast(`Você tem ${fmtBRL(estado.caixa)} no saldo. Venda ou resgate algum investimento para chegar a ${fmtBRL(valor)}.`, 'erro', 8000);
    estado.caixa -= valor;
    e.caixa += valor;
    e.investido += valor;
    registrar(`Capital colocado em ${e.nome}`, -valor);
    if (e.prazo && e.caixa >= 0) {
        e.prazo = null;
        mostrarToast(`${e.nome} foi salva da falência por enquanto. Se os prejuízos continuarem, outra chamada de capital virá.`, 'ok', 9000);
    } else {
        mostrarToast(`Você colocou <b>${fmtBRL(valor)}</b> em ${e.nome}.`, 'ok');
    }
    concluirOperacao();
}

function novaEmpresa(dados) {
    const e = { uid: estado.proximoEmp++, startup: false, dia: estado.dia, recebido: 0, hist: [], prazo: null, propostas: null, ...dados };
    estado.empresas.push(e);
    return e;
}

function abrirStartup(setor, capitalReal) {
    if (privadas().length >= MAX_EMPRESAS) return mostrarToast(`Você já tem ${MAX_EMPRESAS} empresas, que é o máximo. Venda uma antes de abrir outra.`, 'erro');
    const set = SETORES_EMPRESA[setor];
    const capital = moeda(capitalReal * estado.indicePrecos);
    const taxa = moeda(Math.max(1500 * estado.indicePrecos, capital * CUSTO_ABERTURA));
    if (capital + taxa > estado.caixa + 1e-9) return mostrarToast(`Para abrir a empresa você precisa de ${fmtBRL(capital + taxa)} no saldo: ${fmtBRL(capital)} de capital e ${fmtBRL(taxa)} com advogado, contador e registro.`, 'erro', 8000);
    estado.caixa -= capital + taxa;
    const custoFixo = capitalReal / 14; // o capital dura uns 14 meses de prejuízo
    const n = estado.empresas.filter(x => x.setor === setor).length + 1;
    const e = novaEmpresa({
        startup: true, setor, nome: `${set.curto} ${n}`, investido: capital, caixa: capital,
        custoFixo, receita: 0.25 * custoFixo, teto: TETO_STARTUP * custoFixo,
        g: limitar(0.040 + normal() * 0.040, 0.01, 0.14) // o ritmo real de crescimento só se descobre com o tempo
    });
    registrar(`Você abriu a startup ${e.nome} com ${fmtBRL(capital)} de capital (mais ${fmtBRL(taxa)} de abertura)`, -(capital + taxa));
    mostrarToast(`<b>${e.nome}</b> foi aberta! Startups gastam mais do que ganham no começo: o capital vai se queimando até as vendas crescerem. Algumas dão certo, muitas não.`, 'ok', 10000);
    concluirOperacao();
}

// Empresas à venda: 4 por vez, trocadas a cada 6 meses.
function gerarOfertasEmpresas() {
    const lista = [];
    for (let i = 0; i < 4; i++) {
        const setor = sorteio(Object.keys(SETORES_EMPRESA));
        const set = SETORES_EMPRESA[setor];
        const porte = sorteioPeso(PORTES_EMPRESA);
        const receita = porte.receita * (0.8 + Math.random() * 0.5);
        const custoFixo = receita * set.f * (0.9 + Math.random() * 0.25);
        const rec = receita * estado.indicePrecos;
        const lucro = rec * (1 - set.v) - custoFixo * estado.indicePrecos;
        const cand = {
            startup: false, setor, porte: porte.nome, nome: `${porte.nome} de ${set.nome.split(' ')[0].toLowerCase()}`,
            receita, potencial: receita, custoFixo, g: set.g, caixa: 2 * custoFixo * estado.indicePrecos,
            hist: Array.from({ length: 12 }, () => ({ r: rec, l: lucro, d: 0 })),
            cresc12: normal() * 0.05
        };
        const av = avaliarEmpresa(cand);
        cand.preco = moeda((av.ev + cand.caixa) * (1.06 + Math.random() * 0.12));
        cand.id = `${estado.dia}-${i}`;
        lista.push(cand);
    }
    estado.ofertasEmpresas = { dia: estado.dia, lista };
}

function comprarEmpresa(id) {
    if (privadas().length >= MAX_EMPRESAS) return mostrarToast(`Você já tem ${MAX_EMPRESAS} empresas, que é o máximo.`, 'erro');
    const o = estado.ofertasEmpresas.lista.find(x => x.id === id);
    if (!o) return;
    if (o.preco > estado.caixa + 1e-9) return mostrarToast(`Faltam ${fmtBRL(o.preco - estado.caixa)} no seu saldo. Empresas são difíceis de vender, então junte o dinheiro antes.`, 'erro', 8000);
    estado.caixa -= o.preco;
    estado.ofertasEmpresas.lista = estado.ofertasEmpresas.lista.filter(x => x !== o);
    const { preco, id: _id, cresc12, porte, ...resto } = o;
    const e = novaEmpresa({ ...resto, investido: preco });
    registrar(`Você comprou ${e.nome} por ${fmtBRL(preco)}`, -preco);
    mostrarToast(`Você comprou <b>${e.nome}</b>! Todo mês o lucro que sobrar depois da reserva da empresa cai no seu saldo.`, 'ok', 9000);
    concluirOperacao();
}

// Três compradores fazem propostas baseadas no lucro, que valem 21 dias úteis.
function pedirPropostas(uid) {
    const e = empresaPorUid(uid);
    if (!e || e.propostas || e.listada) return;
    const av = avaliarEmpresa(e);
    e.propostas = {
        ate: estado.dia + PRAZO_PROPOSTAS,
        lista: COMPRADORES.map(c => ({
            comprador: c.nome, texto: c.texto,
            preco: moeda(Math.max(0, av.ev * c.k * (0.92 + Math.random() * 0.16) + e.caixa))
        }))
    };
    registrar(`${e.nome} recebeu 3 propostas de compra, válidas até ${dataDoDia(e.propostas.ate).toLocaleDateString('pt-BR')}`, 0);
    mostrarToast(`Três compradores fizeram propostas por <b>${e.nome}</b>. Compare e decida até ${dataDoDia(e.propostas.ate).toLocaleDateString('pt-BR')}.`, 'ok', 9000);
    concluirOperacao();
}

function liquidoDaVenda(e, preco) {
    const ir = moeda(Math.max(0, preco - e.investido) * IR_VENDA_EMPRESA);
    return { ir, liquido: moeda(preco - ir) };
}

function aceitarProposta(uid, i) {
    const e = empresaPorUid(uid);
    const p = e && e.propostas && e.propostas.lista[i];
    if (!p || estado.dia > e.propostas.ate) return;
    const { ir, liquido } = liquidoDaVenda(e, p.preco);
    estado.caixa += liquido;
    estado.empresas = estado.empresas.filter(x => x !== e);
    registrar(`Você vendeu ${e.nome} para ${p.comprador} por ${fmtBRL(p.preco)}` + (ir > 0 ? `, com ${fmtBRL(ir)} de Imposto de Renda sobre o lucro` : ''), liquido);
    mostrarToast(`${e.nome} vendida por <b>${fmtBRL(p.preco)}</b>.` + (liquido >= e.investido ? ' Você saiu com lucro!' : ' Você vendeu abaixo do que investiu.'), liquido >= e.investido ? 'ok' : 'erro', 9000);
    concluirOperacao();
}

/* ---------- IPO: a empresa vira ação na bolsa ---------- */
const lucroMinimoIPO = () => LUCRO_MIN_IPO * estado.indicePrecos;
const elegivelIPO = e => !e.listada && e.hist.length >= 12 && avaliarEmpresa(e).lucroAno >= lucroMinimoIPO() && e.caixa >= 0 && !e.prazo;

// O preço da oferta é um pouco menor que o valor justo: o desconto atrai compradores, e por isso o preço costuma subir nos primeiros dias.
function simularIPO(e, fracao) {
    const av = avaliarEmpresa(e);
    const total = Math.max(100000, Math.round(av.valor / PRECO_ALVO_ACAO));
    const justo = av.valor / total;
    const desconto = limitar(0.10 - 0.04 * limitar(estado.conjuntura, -1, 1), 0.05, 0.14);
    const precoIPO = moeda(justo * (1 - desconto));
    const vendidas = Math.round(total * fracao);
    const bruto = moeda(vendidas * precoIPO);
    const taxa = moeda(bruto * TAXA_IPO);
    const ir = moeda(Math.max(0, bruto - taxa - e.investido * fracao) * IR_VENDA_EMPRESA);
    return { av, total, justo, desconto, precoIPO, vendidas, retidas: total - vendidas, bruto, taxa, ir, liquido: moeda(bruto - taxa - ir) };
}

function gerarTicker(e) {
    const base = SETORES_EMPRESA[e.setor].curto.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4).padEnd(4, 'X');
    for (const sufixo of ['3', '4', '5', '6', '11', '12']) if (!ATIVOS[base + sufixo]) return base + sufixo;
    return base + (100 + estado.proximoEmp);
}

// Cria o ativo na bolsa do jogo (também usado ao carregar um jogo salvo).
function registrarListada(e) {
    const id = e.listada;
    if (ATIVOS[id]) return;
    const set = SETORES_EMPRESA[e.setor];
    const perfil = PERFIS_LISTADA[e.setor];
    ATIVOS[id] = {
        tipo: 'acao', nome: e.nome, preco: e.ipoPreco, vol: 0.22 + 0.12 * set.sens, ret: 0.10, dy: 0, listada: true,
        explica: `${e.nome} é uma empresa de ${set.nome.toLowerCase()} que abriu o capital na bolsa do jogo. O preço acompanha o lucro da empresa e o humor do mercado. Os lucros são repartidos entre todos os sócios, na proporção das ações de cada um.`
    };
    PERFIL[id] = { pl: 12, tags: perfil.tags, f: perfil.f };
    ORDEM.push(id);
    VARIAVEIS.push(id);
    ACOES.push(id);
    estado.hist = estado.hist || {};
    estado.fund = estado.fund || {};
    if (!estado.hist[id]) estado.hist[id] = [{ o: e.ipoPreco, c: e.ipoPreco, h: e.ipoPreco, l: e.ipoPreco }];
    if (!estado.fund[id]) estado.fund[id] = { lpa: Math.max(0.0001, avaliarEmpresa(e).lucroAno / e.acoesTotal), ultimo: null };
}

// Tira da bolsa as empresas de um jogo anterior, antes de carregar outro ou recomeçar.
function limparListadas() {
    for (const id of [...ORDEM]) {
        if (!ATIVOS[id] || !ATIVOS[id].listada) continue;
        delete ATIVOS[id];
        delete PERFIL[id];
        for (const lista of [ORDEM, VARIAVEIS, ACOES]) {
            const k = lista.indexOf(id);
            if (k >= 0) lista.splice(k, 1);
        }
    }
}

function puxarAoValorJusto(e) {
    const justo = avaliarEmpresa(e).valor / e.acoesTotal;
    return justo > 0 ? 0.01 * limitar(Math.log(justo / preco(e.listada)), -1, 1) : -0.01;
}

// Empresa na bolsa sem caixa: vende ações novas para levantar dinheiro, e a fatia de cada sócio diminui (diluição).
function emitirAcoes(e) {
    const id = e.listada;
    const captar = chamadaValor(e);
    e.acoesTotal += captar / preco(id);
    e.caixa += captar;
    aplicarImpacto(id, -0.04, 5);
    registrarNoticia({
        tipo: 'empresa',
        titulo: `${e.nome} (${id}) emite novas ações para levantar dinheiro`,
        porque: 'A empresa ficou sem caixa e vendeu ações novas para pagar as contas. Com mais ações no mercado, cada sócio passa a ter uma fatia menor da empresa, o que se chama diluição.',
        precos: { [id]: preco(id) }, juros: false
    });
}

function fazerIPO(uid, fracao) {
    const e = empresaPorUid(uid);
    if (!e || !elegivelIPO(e)) return;
    if (estado.mercadoFechado) return avisoMercadoFechado();
    const sim = simularIPO(e, fracao);
    e.listada = gerarTicker(e);
    e.acoesTotal = sim.total;
    e.ipoPreco = sim.precoIPO;
    e.propostas = null;
    e.prazo = null;
    registrarListada(e);
    estado.acoes[e.listada] = { qtd: sim.retidas, pm: e.investido / sim.total };
    estado.caixa += sim.liquido;
    registrar(`IPO de ${e.nome}: o código ${e.listada} estreou na bolsa a ${fmtBRL(sim.precoIPO)} por ação. Você vendeu ${fmtPct(fracao, false)} da empresa e recebeu ${fmtBRL(sim.liquido)} depois de taxas e imposto`, sim.liquido);
    registrarNoticia({
        tipo: 'empresa',
        titulo: `${e.nome} estreia na bolsa com o código ${e.listada}`,
        porque: `A empresa vendeu ${fmtPct(fracao, false)} de suas ações ao público a ${fmtBRL(sim.precoIPO)}, ${fmtPct(sim.desconto, false)} abaixo do valor justo estimado. Esse desconto costuma atrair compradores, e é comum o preço subir nos primeiros dias. A partir de agora qualquer um pode comprar e vender ${e.listada}.`,
        precos: { [e.listada]: sim.precoIPO }, juros: false
    });
    estado.selecionado = e.listada;
    ipoEmCurso = null;
    mostrarToast(`<b>${e.listada}</b> estreou na bolsa! Você ficou com ${fmtPct(sim.retidas / sim.total, false)} da empresa em ações, que pode negociar na lista de ativos.`, 'ok', 10000);
    concluirOperacao();
}

/* ---------- Bens, financiamentos e imprevistos ---------- */
const bemPorUid = uid => estado.bens.find(b => b.uid === +uid);
const moradiaAtual = () => estado.bens.find(b => b.tipo === 'imovel' && b.residencia);
const dividaDoBem = b => (b.fin ? b.fin.saldo : 0);
const precoLista = item => moeda(item.preco * (item.tipo === 'carro' ? estado.indicePrecos : estado.indiceImoveis));
const taxaAnualFinanciamento = tipo => (tipo === 'carro' ? 0.14 + 0.9 * selic() : 0.05 + 0.5 * selic());
const taxaMesFinanciamento = tipo => Math.pow(1 + taxaAnualFinanciamento(tipo), 1 / 12) - 1;

function valorDoBem(b) {
    if (b.tipo === 'carro') {
        const anos = (estado.dia - b.dia) / DIAS_ANO;
        return moeda(b.compra * (estado.indicePrecos / b.indiceCompra) * Math.max(0.15, Math.pow(1 - DEPRECIACAO_CARRO_ANO, anos)));
    }
    return moeda(b.compra * estado.indiceImoveis / b.indiceCompra);
}

const patrimonioBens = () => estado.bens.reduce((soma, b) => soma + valorDoBem(b) - dividaDoBem(b), 0);

// Quanto é gasto e recebido com os bens neste mês (só calcula, não mexe em nada).
function fluxoBens() {
    const f = { iptu: 0, manut: 0, juros: 0, amort: 0, aluguel: 0 };
    for (const b of estado.bens) {
        const v = valorDoBem(b);
        if (b.tipo === 'imovel') {
            f.iptu += v * IPTU_ANO / 12;
            f.manut += v * MANUT_IMOVEL_MES;
            if (!b.residencia && !b.venda) f.aluguel += v * ALUGUEL_MES;
        } else {
            f.manut += Math.max(v * MANUT_CARRO_MES, 350 * estado.indicePrecos);
        }
        if (b.fin) {
            const p = parcelaDoMes(b.fin);
            f.juros += p.juros;
            f.amort += p.amort;
        }
    }
    f.parcelas = f.juros + f.amort;
    return f;
}

function aplicarFluxoBens() {
    for (const b of estado.bens) {
        if (!b.fin) continue;
        const p = parcelaDoMes(b.fin);
        b.fin.saldo -= p.amort;
        b.fin.restantes--;
        if (b.fin.restantes <= 0 || b.fin.saldo < 0.01) {
            b.fin = null;
            registrar(`Financiamento quitado: ${b.nome} agora é todo seu!`, 0);
        }
    }
}

// Quem mora em casa própria não paga aluguel; quem tem carro gasta menos com transporte.
function economiaBens() {
    const base = custoDeVida();
    let e = 0;
    if (moradiaAtual()) e += base * PADROES_VIDA[estado.padraoVida].moradia;
    if (estado.bens.some(b => b.tipo === 'carro')) e += base * PARTE_TRANSPORTE;
    return moeda(e);
}

// Dinheiro no saldo mais renda fixa que dá para resgatar agora.
function reservaEmergencia() {
    let total = Math.max(0, estado.caixa);
    for (const l of estado.lotes) if (disponivel(l)) total += calcularResgate(l).liquido;
    return total;
}

// Resgata renda fixa para cobrir uma falta no saldo. Começa pelos títulos cujo preço não oscila com os juros.
function sacarReserva(falta) {
    const lotes = estado.lotes.filter(disponivel)
        .sort((a, b) => Number(comMarcacao(a.ativo)) - Number(comMarcacao(b.ativo)) || b.dias - a.dias);
    let obtido = 0;
    for (const l of lotes) {
        const preciso = falta - obtido;
        if (preciso <= 0.005) break;
        const r = calcularResgate(l);
        if (r.liquido <= preciso + 0.005) {
            estado.caixa += r.liquido;
            obtido += r.liquido;
            estado.lotes = estado.lotes.filter(x => x !== l);
        } else {
            const f = preciso / r.liquido;
            estado.caixa += preciso;
            obtido += preciso;
            l.valor *= 1 - f;
            l.aplicado *= 1 - f;
        }
    }
    return obtido;
}

// Despesa que não dá para adiar: sai do saldo, depois da reserva de emergência, e o que faltar vira dívida no vermelho.
function cobrirDespesa(valor, texto) {
    estado.caixa -= valor;
    estado.totalAportado -= valor;
    registrar(texto, -valor);
    if (estado.caixa >= 0) return;
    const sacado = sacarReserva(-estado.caixa);
    if (sacado > 0.005) registrar('Você usou sua reserva de emergência: a conta foi paga resgatando renda fixa (já com os impostos)', 0);
    if (estado.caixa < -0.005) {
        registrar(`Sem reserva suficiente: ficaram ${fmtBRL(-estado.caixa)} no vermelho, com juros de ${fmtPct(JUROS_CHEQUE_ESPECIAL, false)} ao mês. Venda algum investimento para quitar!`, 0);
    }
}

// Com a felicidade baixa, os problemas de saúde pesam mais no sorteio e aparece a crise de estresse.
const pesoImprevisto = i => (i.estresse ? 2 * tristeza() : i.peso * (i.saude ? 1 + tristeza() * (SAUDE_MULT_TRISTE - 1) : 1));

function imprevisto() {
    const possiveis = IMPREVISTOS.filter(i => (!i.bem || estado.bens.some(b => b.tipo === i.bem)) && pesoImprevisto(i) > 0);
    let x = Math.random() * possiveis.reduce((soma, i) => soma + pesoImprevisto(i), 0);
    let ev = possiveis[possiveis.length - 1];
    for (const i of possiveis) {
        x -= pesoImprevisto(i);
        if (x <= 0) { ev = i; break; }
    }
    let valor, texto = 'Imprevisto: ' + ev.nome;
    if (ev.bem) {
        const b = sorteio(estado.bens.filter(o => o.tipo === ev.bem));
        valor = Math.max(valorDoBem(b) * ev.pct, ev.min * estado.indicePrecos);
        texto += ` (${b.nome})`;
    } else {
        valor = Math.max(custoDeVida() * ev.fator * (0.8 + Math.random() * 0.5), ev.min * estado.indicePrecos);
    }
    cobrirDespesa(moeda(valor), texto);
}

function simularCompra(item, entrada, prazo, tabela) {
    const preco = precoLista(item);
    const financia = entrada < 1;
    const entradaValor = moeda(preco * entrada);
    const financiado = moeda(preco - entradaValor);
    const itbi = item.tipo === 'imovel' ? moeda(preco * ITBI) : 0;
    const taxaMes = taxaMesFinanciamento(item.tipo);
    const res = financia ? resumoFinanciamento(financiado, taxaMes, prazo, tabela) : { primeira: 0, ultima: 0, totalJuros: 0 };
    const h = holerite();
    const emAndamento = estado.bens.reduce((soma, b) => soma + (b.fin ? parcelaDoMes(b.fin).parcela : 0), 0);
    const comprometimento = h.bruto ? (emAndamento + res.primeira) / h.bruto : 0;
    const dinheiroHoje = moeda(entradaValor + itbi);
    let motivo = '';
    if (!estado.carreira) motivo = 'Escolha uma profissão primeiro.';
    else if (financia && comprometimento > RENDA_MAX_PARCELAS) motivo = `O banco só aprova se as parcelas couberem em ${fmtPct(RENDA_MAX_PARCELAS, false)} do seu salário bruto. Com esta compra seriam ${fmtPct(comprometimento, false)}. Aumente a entrada, alongue o prazo ou espere uma promoção.`;
    else if (dinheiroHoje > estado.caixa + 1e-9) motivo = `Faltam ${fmtBRL(dinheiroHoje - estado.caixa)} no seu saldo. Bens são difíceis de vender, então junte o dinheiro antes, resgatando ou vendendo algum investimento.`;
    return { preco, entradaValor, financiado, itbi, taxaMes, ...res, comprometimento, dinheiroHoje, motivo, ok: !motivo };
}

function comprarBem() {
    if (!compraEmCurso) return;
    const item = CATALOGO_BENS.find(i => i.id === compraEmCurso.id);
    const sim = simularCompra(item, compraEmCurso.entrada, compraEmCurso.prazo, compraEmCurso.tabela);
    if (!sim.ok) return mostrarToast(sim.motivo, 'erro', 9000);
    const alegriaCompra = alegriaDaCompra(sim.preco);
    mudarFelicidade(alegriaCompra);
    estado.caixa -= sim.dinheiroHoje;
    estado.bens.push({
        uid: estado.proximoBem++, tipo: item.tipo, nome: item.nome, compra: sim.preco,
        indiceCompra: item.tipo === 'carro' ? estado.indicePrecos : estado.indiceImoveis, dia: estado.dia,
        fin: sim.financiado > 0 ? criarFinanciamento(sim.financiado, sim.taxaMes, compraEmCurso.prazo, compraEmCurso.tabela) : null,
        residencia: item.tipo === 'imovel' && !moradiaAtual(), venda: null
    });
    registrar(`Compra: ${item.nome} por ${fmtBRL(sim.preco)}` + (sim.financiado > 0 ? ` (entrada de ${fmtBRL(sim.entradaValor)} e o resto financiado)` : ' à vista') + (sim.itbi ? `. Impostos e cartório: ${fmtBRL(sim.itbi)}` : ''), -sim.dinheiroHoje);
    mostrarToast(`Você comprou <b>${item.nome}</b>! Felicidade <b class="sobe">+${Math.round(alegriaCompra)}</b>.` + (item.tipo === 'imovel' ? ' Se for sua moradia, você deixa de pagar aluguel, mas passa a pagar IPTU e manutenção.' : ' Lembre: carro perde valor todo ano e tem IPVA, seguro e manutenção.'), 'ok', 9000);
    compraEmCurso = null;
    concluirOperacao();
}

function quitarFinanciamento(uid) {
    const b = bemPorUid(uid);
    if (!b || !b.fin) return;
    if (b.fin.saldo > estado.caixa + 1e-9) return mostrarToast(`Para quitar você precisa de ${fmtBRL(b.fin.saldo)} no saldo.`, 'erro');
    const valor = moeda(b.fin.saldo);
    estado.caixa -= valor;
    b.fin = null;
    registrar(`Financiamento de ${b.nome} quitado antes do prazo`, -valor);
    mostrarToast(`Dívida quitada! Você pagou <b>${fmtBRL(valor)}</b> e não paga mais juros sobre ela.`, 'ok');
    concluirOperacao();
}

function venderBem(uid) {
    const b = bemPorUid(uid);
    if (!b || b.venda) return;
    const v = valorDoBem(b);
    const bruto = moeda(v * (1 - (b.tipo === 'carro' ? DESCONTO_VENDA_CARRO : CORRETAGEM)));
    const quando = b.tipo === 'carro' ? 'umas 2 semanas' : 'uns 6 meses';
    if (!confirm(`Vender ${b.nome} por cerca de ${fmtBRL(bruto)}? O dinheiro leva ${quando} para entrar, a dívida do financiamento é descontada e, no imóvel, o lucro paga ${fmtPct(IR_GANHO_CAPITAL, false)} de Imposto de Renda.`)) return;
    b.venda = { dia: estado.dia + PRAZO_VENDA[b.tipo], bruto };
    mostrarToast(`${b.nome} está à venda. O dinheiro entra em ${dataDoDia(b.venda.dia).toLocaleDateString('pt-BR')}.`, 'ok');
    concluirOperacao();
}

function concluirVendas() {
    for (const b of estado.bens.filter(x => x.venda && estado.dia >= x.venda.dia)) {
        const divida = dividaDoBem(b);
        const ir = moeda((b.tipo === 'imovel' ? Math.max(0, b.venda.bruto - b.compra) : 0) * IR_GANHO_CAPITAL);
        const liquido = moeda(b.venda.bruto - divida - ir);
        estado.caixa += liquido;
        estado.bens = estado.bens.filter(x => x !== b);
        registrar(`${b.nome} vendido por ${fmtBRL(b.venda.bruto)}` + (divida > 0.005 ? `, pagando a dívida de ${fmtBRL(divida)}` : '') + (ir > 0 ? ` e ${fmtBRL(ir)} de Imposto de Renda sobre o lucro` : ''), liquido);
    }
}

function morarEm(uid) {
    const b = bemPorUid(uid);
    if (!b || b.tipo !== 'imovel' || b.venda) return;
    estado.bens.forEach(o => (o.residencia = o === b));
    registrar(`Você se mudou para ${b.nome}. Os outros imóveis passam a ser alugados`, 0);
    mostrarToast(`Agora você mora em <b>${b.nome}</b>.`, 'ok');
    concluirOperacao();
}

/* ---------- Vencimento dos títulos ---------- */
// estado.rolagem guarda quantos anos somar ao vencimento original de cada título já vencido.
function aplicarRolagens() {
    for (const id of COM_VENCIMENTO) {
        const a = ATIVOS[id];
        const ano = +a.vencBase.slice(0, 4) + (estado.rolagem[id] || 0);
        a.venc = ano + a.vencBase.slice(4);
        a.nome = a.nomeBase.replace(/\d{4}$/, ano);
    }
}

// O novo título tem o mesmo prazo do original; se já existir outro com o mesmo nome, ganha mais um ano.
function rolarTitulo(id) {
    const a = ATIVOS[id];
    const prazo = Math.max(2, +a.vencBase.slice(0, 4) - +estado.inicio.slice(0, 4));
    estado.rolagem[id] = (estado.rolagem[id] || 0) + prazo;
    aplicarRolagens();
    while (ORDEM.some(outro => outro !== id && ATIVOS[outro].nome === a.nome)) {
        estado.rolagem[id]++;
        aplicarRolagens();
    }
}

function calcularVencimentos() {
    aplicarRolagens();
    diasVencimento = {};
    const inicio = new Date(estado.inicio + 'T12:00:00');
    for (const id of ORDEM) {
        const venc = ATIVOS[id].venc;
        if (!venc) continue;
        const fim = new Date(venc + 'T12:00:00');
        const d = new Date(inicio);
        let uteis = 0;
        while (d < fim) {
            d.setDate(d.getDate() + 1);
            if (d.getDay() !== 0 && d.getDay() !== 6) uteis++;
        }
        diasVencimento[id] = uteis;
    }
}

/* ---------- Gráficos ---------- */
function linhaReta(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function desenharGrafico(canvas, dados, op) {
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth, H = canvas.clientHeight;
    if (!W || !H || !dados.length) return;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const p = dados.map(v => (typeof v === 'number' ? { o: v, h: v, l: v, c: v } : v));
    const m = { t: 14, r: 78, b: 26, l: 8 };
    const w = W - m.l - m.r, h = H - m.t - m.b;
    let min = Math.min(...p.map(v => (op.velas ? v.l : v.c)));
    let max = Math.max(...p.map(v => (op.velas ? v.h : v.c)));
    // base = linha tracejada de comparação (ex.: dinheiro que a criança colocou), um valor por ponto.
    if (op.base) { min = Math.min(min, ...op.base); max = Math.max(max, ...op.base); }
    const folga = (max - min) * 0.08 || Math.abs(max) * 0.01 || 1;
    min -= folga;
    max += folga;
    const X = i => m.l + (p.length === 1 ? w / 2 : (i * w) / (p.length - 1));
    const Y = v => m.t + ((max - v) / (max - min)) * h;

    ctx.font = '11px system-ui, sans-serif';
    ctx.lineWidth = 1;
    for (let k = 0; k <= 4; k++) {
        const v = min + ((max - min) * k) / 4;
        ctx.strokeStyle = '#1e2433';
        linhaReta(ctx, m.l, Y(v), W - m.r, Y(v));
        ctx.fillStyle = '#6b7385';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(op.formatar(v), W - m.r + 8, Y(v));
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let k = 0; k < 4; k++) {
        const i = Math.round((k * (p.length - 1)) / 3);
        const x = Math.min(Math.max(X(i), m.l + 28), W - m.r - 28);
        ctx.fillText(op.rotulo(i), x, H - m.b + 8);
    }

    const ultimo = p[p.length - 1].c;
    const referencia = op.base ? op.base[op.base.length - 1] : p[0].c;
    const cor = ultimo >= referencia ? '#16c784' : '#ea3943';

    if (op.base) {
        ctx.strokeStyle = '#8a93a6';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        op.base.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v))));
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#8a93a6';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(op.rotuloBase, m.l + 4, Y(op.base[0]) - 3);
    }

    if (op.velas) {
        const larg = Math.max(1, Math.min(9, (w / p.length) * 0.65));
        p.forEach((v, i) => {
            const c = v.c >= v.o ? '#16c784' : '#ea3943';
            ctx.strokeStyle = c;
            ctx.fillStyle = c;
            linhaReta(ctx, X(i), Y(v.h), X(i), Y(v.l));
            const y1 = Y(Math.max(v.o, v.c)), y2 = Y(Math.min(v.o, v.c));
            ctx.fillRect(X(i) - larg / 2, y1, larg, Math.max(1, y2 - y1));
        });
    } else {
        const grad = ctx.createLinearGradient(0, m.t, 0, m.t + h);
        grad.addColorStop(0, cor + '55');
        grad.addColorStop(1, cor + '00');
        ctx.beginPath();
        p.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v.c)) : ctx.moveTo(X(i), Y(v.c))));
        ctx.lineTo(X(p.length - 1), m.t + h);
        ctx.lineTo(X(0), m.t + h);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.beginPath();
        p.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v.c)) : ctx.moveTo(X(i), Y(v.c))));
        ctx.strokeStyle = cor;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.lineWidth = 1;
    }

    const yu = Y(ultimo);
    ctx.fillStyle = cor;
    ctx.fillRect(W - m.r + 2, yu - 10, m.r - 4, 20);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText(op.formatar(ultimo), W - m.r + 7, yu);

    if (op.hover != null && p[op.hover]) {
        const i = op.hover, v = p[i];
        ctx.strokeStyle = '#8a93a6';
        ctx.setLineDash([3, 3]);
        linhaReta(ctx, X(i), m.t, X(i), m.t + h);
        linhaReta(ctx, m.l, Y(v.c), W - m.r, Y(v.c));
        ctx.setLineDash([]);
        const texto = [op.rotulo(i), op.formatar(v.c)];
        ctx.font = '12px system-ui, sans-serif';
        const larg = Math.max(...texto.map(t => ctx.measureText(t).width)) + 20;
        const bx = X(i) + larg + 14 > W - m.r ? X(i) - larg - 10 : X(i) + 10;
        ctx.fillStyle = '#1a1f2e';
        ctx.strokeStyle = '#2c3446';
        ctx.fillRect(bx, m.t + 4, larg, 44);
        ctx.strokeRect(bx, m.t + 4, larg, 44);
        ctx.fillStyle = '#8a93a6';
        ctx.textAlign = 'left';
        ctx.fillText(texto[0], bx + 10, m.t + 17);
        ctx.fillStyle = '#e6e9f0';
        ctx.font = 'bold 13px system-ui, sans-serif';
        ctx.fillText(texto[1], bx + 10, m.t + 35);
    }

    canvas._indice = clientX => {
        const x = clientX - canvas.getBoundingClientRect().left;
        return Math.max(0, Math.min(p.length - 1, Math.round(((x - m.l) / w) * (p.length - 1))));
    };
}

function agruparVelas(velas, tamanho) {
    const saida = [];
    for (let i = 0; i < velas.length; i += tamanho) {
        const g = velas.slice(i, i + tamanho);
        saida.push({ o: g[0].o, c: g[g.length - 1].c, h: Math.max(...g.map(v => v.h)), l: Math.min(...g.map(v => v.l)) });
    }
    return saida;
}

function desenharPrincipal() {
    const id = estado.selecionado;
    const canvas = document.getElementById('grafico');
    const ultimoDia = estado.dia;
    if (ehFixa(id)) {
        const dados = historicoFixa(id, Math.min(periodo, MAX_HISTORICO));
        desenharGrafico(canvas, dados, {
            hover: hoverPrincipal,
            formatar: v => 'R$ ' + fmtNum(v),
            rotulo: i => fmtData(dataDoDia(ultimoDia - (dados.length - 1 - i)))
        });
        return;
    }
    const h = estado.hist[id];
    const inicio = Math.max(0, h.length - periodo - 1);
    let dados = h.slice(inicio);
    const velas = modo === 'velas';
    let passo = 1;
    if (velas && dados.length > 130) {
        passo = 5;
        dados = agruparVelas(dados, passo);
    }
    const total = dados.length;
    desenharGrafico(canvas, dados, {
        velas,
        hover: hoverPrincipal,
        formatar: fmtNum,
        rotulo: i => fmtData(dataDoDia(ultimoDia - Math.min(h.length - 1 - inicio, (total - 1 - i) * passo)))
    });
}

function desenharPatrimonio() {
    const canvas = document.getElementById('graficoPatrimonio');
    if (!canvas) return;
    const serie = estado.patrimonio;
    const ultimoDia = estado.dia;
    desenharGrafico(canvas, serie, {
        base: estado.investidoHist,
        rotuloBase: 'Dinheiro que você guardou',
        hover: hoverPatrimonio,
        formatar: v => 'R$ ' + fmtNum(v),
        rotulo: i => fmtData(dataDoDia(ultimoDia - (serie.length - 1 - i)))
    });
}

/* ---------- Telas ---------- */
function renderTopo() {
    const total = patrimonioAtual();
    const res = total - estado.totalAportado;
    document.getElementById('kData').textContent = dataDoDia(estado.dia).toLocaleDateString('pt-BR');
    const kCaixa = document.getElementById('kCaixa');
    kCaixa.textContent = fmtBRL(estado.caixa);
    kCaixa.className = 'num ' + (estado.caixa < -0.005 ? 'desce' : '');
    document.getElementById('kPatrimonio').textContent = fmtBRL(total);
    document.getElementById('kGoverno').textContent =
        `${estado.campanha ? 'Campanha eleitoral' : PERFIS_GOVERNO[estado.governo] || 'Sem perfil definido'} · eleição ${dataDoDia(estado.proximaEleicao).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })}`;
    document.getElementById('kSelic').textContent =
        `${fmtPct(selic(), false)} · Copom ${dataDoDia(estado.proximoCopom).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
    const k = document.getElementById('kResultado');
    k.textContent = fmtBRL(res) + (estado.totalAportado > 1 ? ` (${fmtPct(res / estado.totalAportado)})` : '');
    k.className = 'num ' + classe(res);
    document.getElementById('velocidade').value = String(estado.velocidade);
    const h = holerite();
    const p = proximoFechamento();
    document.getElementById('kCargo').textContent = estado.carreira ? h.cargo : 'Escolha uma profissão';
    const kSobra = document.getElementById('kSobra');
    kSobra.textContent = estado.carreira
        ? `${fmtBRL(h.sobra)}${p.dezembro ? ' + 13º' : ''} em ${p.data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`
        : '—';
    kSobra.className = 'num ' + (h.sobra < 0 ? 'desce' : '');
    const [, rosto, nomeHumor] = humor();
    document.getElementById('kFelicidade').innerHTML =
        `${rosto} ${Math.round(estado.felicidade)}<span class="mini-barra"><i style="width:${estado.felicidade}%;background:${corFelicidade()}"></i></span>`;
    document.getElementById('kFelicidade').parentElement.title = `${nomeHumor}. Só trabalhar e guardar cansa: a felicidade cai. Com ela baixa, imprevistos como doenças e cirurgias ficam mais frequentes. Veja na aba Vida e carreira.`;

    const botao = document.getElementById('proventos');
    botao.disabled = estado.proventos < 0.005;
    botao.innerHTML = `<span>Dividendos a receber</span><strong class="num">${fmtBRL(estado.proventos)}</strong>`;
    renderSelo();
}

function renderSelo() {
    const selo = document.getElementById('seloNoticias');
    selo.textContent = estado.naoLidas > 99 ? '99+' : estado.naoLidas;
    selo.style.display = estado.naoLidas ? 'inline-block' : 'none';
    const seloNav = document.getElementById('seloNav');
    seloNav.textContent = selo.textContent;
    seloNav.style.display = selo.style.display;
}

function renderTicker() {
    const ultima = estado.noticias[0];
    const itens = [
        ultima ? `<span class="ticker-item"><b class="amarelo">ÚLTIMA NOTÍCIA</b>${ultima.titulo}</span>` : '',
        estado.mercadoFechado ? `<span class="ticker-item"><b class="desce">BOLSA FECHADA</b>circuit breaker até ${dataDoDia(estado.mercadoFechado.ate).toLocaleDateString('pt-BR')}</span>` : '',
        estado.campanha ? '<span class="ticker-item"><b class="amarelo">CAMPANHA ELEITORAL</b>mais incerteza e oscilação até a votação</span>' : '',
        `<span class="ticker-item"><b>SELIC</b>${fmtPct(selic(), false)} a.a.</span>`,
        `<span class="ticker-item"><b>IPCA 12M</b>${fmtPct(ipca(), false)}</span>`,
        ...VARIAVEIS.map(id => {
            const v = variacao(id, 1);
            return `<span class="ticker-item"><b>${id}</b>${fmtNum(preco(id))} <span class="${classe(v)}">${v >= 0 ? '▲' : '▼'} ${fmtPct(v)}</span></span>`;
        })
    ].join('');
    document.getElementById('ticker').innerHTML = itens + itens;
}

function linhaWatchlist(id) {
    const a = ATIVOS[id];
    const sel = id === estado.selecionado ? 'selecionado' : '';
    if (ehFixa(id)) {
        const acabou = vencido(id);
        const sub = acabou ? 'Vencido' : [a.isento ? 'Isento de IR' : '', a.carencia ? 'Carência ' + liquidezTexto(id).replace('Após ', '') : 'Liquidez diária'].filter(Boolean).join(' · ');
        return `<button class="ativo-linha ${sel} ${acabou ? 'vencido' : ''}" data-id="${id}">
            <span class="sym">${a.nome}</span>
            <span class="preco num">${taxaTexto(id)}</span>
            <span class="nome">${sub}</span>
            <span class="var num sobe">${fmtPct(taxaAnual(id), false)} a.a.</span>
        </button>`;
    }
    const v = variacao(id, 1);
    return `<button class="ativo-linha ${sel}" data-id="${id}">
        <span class="sym">${id}</span>
        <span class="preco num">${fmtNum(preco(id))}</span>
        <span class="nome">${a.nome}</span>
        <span class="var num ${classe(v)}">${fmtPct(v)}</span>
    </button>`;
}

function renderWatchlist() {
    const termo = busca.trim().toLowerCase();
    const casa = id => !termo || id.toLowerCase().includes(termo) || ATIVOS[id].nome.toLowerCase().includes(termo);
    const html = GRUPOS
        .filter(([tipo]) => filtro === 'todos' || filtro === tipo)
        .map(([tipo, titulo]) => {
            const ids = ORDEM.filter(id => ATIVOS[id].tipo === tipo && casa(id));
            return ids.length ? `<div class="grupo">${titulo}</div>` + ids.map(linhaWatchlist).join('') : '';
        })
        .join('');
    document.getElementById('watchlist').innerHTML = html || '<p class="vazio" style="padding:12px 16px">Nenhum ativo encontrado.</p>';
    document.querySelectorAll('#filtros button').forEach(b => b.classList.toggle('ativo', b.dataset.f === filtro));
}

function stat(rotulo, valor, cls = '') {
    return `<div class="stat"><span>${rotulo}</span><b class="num ${cls}">${valor}</b></div>`;
}

function renderDetalhe() {
    const id = estado.selecionado;
    const a = ATIVOS[id];
    const fixaSel = ehFixa(id);
    const tipoTxt = { fixa: 'Renda fixa', acao: 'Ação', etf: 'ETF', fii: 'Fundo imobiliário' }[a.tipo];
    document.getElementById('dSym').innerHTML = `${fixaSel ? a.nome : id}<span class="tipo ${fixaSel ? 'fixa' : 'variavel'}">${tipoTxt}</span>`;
    document.getElementById('dNome').textContent = fixaSel ? 'Gráfico: quanto R$ 100 aplicados viraram' : a.nome;
    document.getElementById('modos').style.visibility = fixaSel ? 'hidden' : 'visible';

    const dPreco = document.getElementById('dPreco');
    const dVar = document.getElementById('dVar');
    let stats;
    if (fixaSel) {
        const anual = taxaAnual(id);
        dPreco.textContent = taxaTexto(id);
        dVar.textContent = `≈ ${fmtPct(anual, false)} ao ano hoje`;
        dVar.className = 'num sobe';
        stats = [
            stat('Rende por ano', fmtPct(anual, false), 'sobe'),
            stat('Imposto de Renda', a.isento ? 'Isento' : '22,5% a 15%'),
            stat('Liquidez (sacar)', liquidezTexto(id)),
            stat('Garantia', a.garantia),
            stat('Aplicação mínima', fmtBRL(a.minimo))
        ];
        if (comMarcacao(id)) stats.push(stat('Venda antes do vencimento', 'Preço muda com os juros'));
        if (a.venc) stats.push(stat('Vencimento', new Date(a.venc + 'T12:00:00').toLocaleDateString('pt-BR'), vencido(id) ? 'desce' : ''));
    } else {
        const v = variacao(id, 1);
        dPreco.textContent = fmtBRL(preco(id));
        dVar.textContent = `${fmtPct(v)} hoje`;
        dVar.className = 'num ' + classe(v);
        const ano = estado.hist[id].slice(-DIAS_ANO);
        const proventos = a.tipo === 'fii' ? ['Aluguel por mês', '≈ ' + fmtPct(a.dy / 12, false)] : ['Dividendos/ano', a.dy ? '≈ ' + fmtPct(a.dy, false) : 'Não paga'];
        stats = [
            stat('1 mês', fmtPct(variacao(id, DIAS_MES)), classe(variacao(id, DIAS_MES))),
            stat('6 meses', fmtPct(variacao(id, 126)), classe(variacao(id, 126))),
            stat('12 meses', fmtPct(variacao(id, DIAS_ANO)), classe(variacao(id, DIAS_ANO))),
            stat('Máx. 12 meses', fmtNum(Math.max(...ano.map(v => v.h)))),
            stat('Mín. 12 meses', fmtNum(Math.min(...ano.map(v => v.l)))),
            stat(proventos[0], proventos[1]),
            stat('Risco (oscilação)', a.vol >= 0.45 ? 'Muito alto' : a.vol >= 0.3 ? 'Alto' : a.vol >= 0.2 ? 'Médio' : 'Menor')
        ];
        if (a.tipo === 'acao') {
            const f = estado.fund[id];
            const proximo = Math.ceil((estado.dia + 1) / 63) * 63;
            stats.push(
                stat('Lucro por ação (ano)', fmtBRL(f.lpa)),
                stat('P/L', fmtNum(preco(id) / f.lpa) + ' anos'),
                f.ultimo
                    ? stat('Último lucro', `${fmtPct(f.ultimo.real)} (esperado ${fmtPct(f.ultimo.esperado)})`, classe(f.ultimo.real - f.ultimo.esperado))
                    : stat('Último lucro', 'Ainda não saiu'),
                stat('Próximo resultado', dataDoDia(proximo).toLocaleDateString('pt-BR'))
            );
        }
    }
    document.getElementById('dStats').innerHTML = stats.join('');
    document.getElementById('dExplica').innerHTML = `<h4>Explicando fácil</h4>${a.explica}`;

    const relacionadas = estado.noticias
        .filter(n => (fixaSel ? n.juros : id in n.precos))
        .slice(0, 3);
    document.getElementById('dNoticias').innerHTML =
        `<h4>${fixaSel ? 'Notícias sobre juros e inflação' : `Notícias sobre ${id}`}</h4>` +
        (relacionadas.length
            ? relacionadas.map(n => htmlNoticia(n, id)).join('')
            : `<p class="vazio">Nenhuma notícia ainda. Sai mais ou menos uma por mês do jogo.</p>`);

    document.querySelectorAll('#periodos button').forEach(b => b.classList.toggle('ativo', +b.dataset.n === periodo));
    document.querySelectorAll('#modos button').forEach(b => b.classList.toggle('ativo', b.dataset.modo === modo));
    desenharPrincipal();
}

// Mantém o que a criança digitou na boleta quando a tela se atualiza sozinha.
function renderBoleta() {
    const el = document.getElementById('boleta');
    const id = estado.selecionado;
    const mesmo = el.dataset.id === id && el.dataset.lado === ladoBoleta;
    const qtd = document.getElementById('bQtd');
    const valor = document.getElementById('bValor');
    const anterior = { qtd: qtd && qtd.value, valor: valor && valor.value, foco: document.activeElement && document.activeElement.id };

    el.innerHTML = ehFixa(id) ? boletaFixa(id) : boletaAcao(id);
    el.dataset.id = id;
    el.dataset.lado = ladoBoleta;

    if (mesmo) {
        const nq = document.getElementById('bQtd');
        const nv = document.getElementById('bValor');
        if (nq && anterior.qtd != null) nq.value = anterior.qtd;
        if (nv && anterior.valor != null) nv.value = anterior.valor;
        if (anterior.foco === 'bQtd' || anterior.foco === 'bValor') document.getElementById(anterior.foco)?.focus();
    }
    atualizarTotaisBoleta();
}

function boletaAcao(id) {
    if (estado.mercadoFechado) {
        return `<div class="panel-title">Boleta · ${id}</div><div class="boleta-corpo">
            <p class="desce"><b>Bolsa fechada: circuit breaker.</b></p>
            <p class="dica">As negociações de ações, ETFs e fundos imobiliários voltam em ${dataDoDia(estado.mercadoFechado.ate).toLocaleDateString('pt-BR')}. Até lá, só a renda fixa funciona.</p></div>`;
    }
    const pos = estado.acoes[id];
    const compra = ladoBoleta === 'compra';
    const tipo = ATIVOS[id].tipo;
    const dicaVenda = tipo === 'acao'
        ? 'Vender por mais do que pagou dá lucro. Vendas de ações até R$ 20 mil por mês não pagam Imposto de Renda.'
        : `Vender por mais do que pagou dá lucro. ${tipo === 'fii' ? 'Em FIIs' : 'Em ETFs'} o lucro na venda paga ${tipo === 'fii' ? '20%' : '15%'} de Imposto de Renda.`;
    const dicaCompra = tipo === 'acao'
        ? 'Comprar uma ação é virar sócio de um pedacinho da empresa. O preço muda todo dia, então você pode ganhar ou perder.'
        : tipo === 'fii'
            ? 'Com cotas de um FII você recebe aluguel todo mês, direto no seu saldo.'
            : 'Com uma cota de ETF você compra vários ativos de uma vez.';
    return `<div class="panel-title">Boleta · ${id}</div>
    <div class="boleta-corpo">
        <div class="lado">
            <button class="compra ${compra ? 'ativo' : ''}" data-lado="compra">Comprar</button>
            <button class="venda ${compra ? '' : 'ativo'}" data-lado="venda">Vender</button>
        </div>
        <label for="bQtd">Quantidade de ${unidade(id)}</label>
        <div class="campo">
            <button data-acao="menos" aria-label="Diminuir">−</button>
            <input id="bQtd" type="number" min="1" step="1" value="1" inputmode="numeric">
            <button data-acao="mais" aria-label="Aumentar">+</button>
        </div>
        <div class="atalhos">
            <button data-acao="qtd" data-q="1">1</button>
            <button data-acao="qtd" data-q="5">5</button>
            <button data-acao="qtd" data-q="10">10</button>
            <button data-acao="max">Máximo</button>
        </div>
        <div class="linha"><span>Preço agora</span><b class="num">${fmtBRL(preco(id))}</b></div>
        <div class="linha"><span>Você tem</span><b class="num">${pos ? pos.qtd : 0} ${unidade(id)}</b></div>
        ${pos ? `<div class="linha"><span>Seu preço médio</span><b class="num">${fmtBRL(pos.pm)}</b></div>` : ''}
        <div class="linha"><span>Saldo disponível</span><b class="num">${fmtBRL(estado.caixa)}</b></div>
        ${compra ? '' : '<div class="linha"><span>Lucro/prejuízo</span><b class="num" id="bLucro"></b></div><div class="linha"><span>Imposto de Renda</span><b class="num" id="bIR"></b></div>'}
        <div class="linha total"><span>${compra ? 'Total a pagar' : 'Você recebe'}</span><b class="num" id="bTotal"></b></div>
        <button class="enviar ${ladoBoleta}" data-acao="enviar" id="bEnviar">${compra ? 'Comprar' : 'Vender'} ${id}</button>
        <p class="dica">${compra ? dicaCompra : dicaVenda}</p>
    </div>`;
}

function boletaFixa(id) {
    const a = ATIVOS[id];
    const lotes = estado.lotes.filter(l => l.ativo === id);
    const valorInicial = Math.max(0, Math.min(Math.max(a.minimo, 100), Math.floor(estado.caixa)));
    let posicao = '<p class="vazio">Você ainda não tem dinheiro aplicado aqui.</p>';
    if (lotes.length) {
        const livres = lotes.filter(disponivel);
        const presos = lotes.filter(l => !disponivel(l));
        const t = somarResgates(lotes);
        const r = somarResgates(livres);
        const mtm = comMarcacao(id) ? t.bruto - lotes.reduce((soma, l) => soma + l.valor, 0) : 0;
        const dicaMtm = Math.abs(mtm) < 0.005
            ? 'Se vender antes do vencimento, o preço do título acompanha os juros do mercado (marcação a mercado).'
            : mtm < 0
                ? 'Os juros do mercado subiram desde que você comprou, então vender agora tem deságio: o título vale menos. Esperando até o vencimento você recebe o combinado.'
                : 'Os juros do mercado caíram desde que você comprou, então vender agora dá ágio: o título vale mais. Esperar até o vencimento também é uma opção.';
        let carencia = '';
        if (presos.length) {
            const falta = Math.min(...presos.map(l => a.carencia - l.dias));
            carencia = `<p class="dica">${fmtBRL(somarResgates(presos).bruto)} ainda estão na carência. O próximo pedaço fica livre em ${dataDoDia(estado.dia + falta).toLocaleDateString('pt-BR')}.</p>`;
        }
        posicao = `
            <div class="linha"><span>Você aplicou</span><b class="num">${fmtBRL(t.aplicado)}</b></div>
            <div class="linha"><span>Valor hoje</span><b class="num ${classe(t.bruto - t.aplicado)}">${fmtBRL(t.bruto)}</b></div>
            ${comMarcacao(id) ? `<div class="linha"><span>Marcação a mercado</span><b class="num ${classe(mtm)}">${mtm < 0 ? '−' : '+'} ${fmtBRL(Math.abs(mtm))}</b></div><p class="dica" style="margin-top:0">${dicaMtm}</p>` : ''}
            ${livres.length ? `
            <div class="linha"><span>IOF</span><b class="num">${r.iof > 0.005 ? '− ' + fmtBRL(r.iof) : 'R$ 0,00'}</b></div>
            <div class="linha"><span>Imposto de Renda</span><b class="num">${r.ir > 0.005 ? '− ' + fmtBRL(r.ir) : a.isento ? 'Isento' : 'R$ 0,00'}</b></div>
            <div class="linha total"><span>Se resgatar hoje</span><b class="num">${fmtBRL(r.liquido)}</b></div>
            <button class="enviar venda" data-acao="resgatar">Resgatar ${presos.length ? 'o que está livre' : 'tudo'}</button>` : ''}
            ${carencia}
            ${id === 'POUP' ? '<p class="dica">Lembre: a poupança só paga no aniversário mensal. Resgatar antes perde o mês.</p>' : ''}
            ${r.iof > 0.005 ? '<p class="dica">IOF é um imposto cobrado quando você resgata em menos de 30 dias. Esperar um pouco mais evita esse custo!</p>' : ''}`;
    }
    if (vencido(id)) {
        return `<div class="panel-title">${a.nome}</div><div class="boleta-corpo"><p class="vazio">Este título já venceu: o governo devolveu o dinheiro de quem tinha aplicado. Escolha outro título na lista.</p></div>`;
    }
    return `<div class="panel-title">Aplicar · ${a.nome}</div>
    <div class="boleta-corpo">
        <label for="bValor">Quanto quer aplicar? (mínimo ${fmtBRL(a.minimo)})</label>
        <div class="campo"><span>R$</span><input id="bValor" type="number" min="${a.minimo}" step="10" value="${valorInicial}" inputmode="decimal"></div>
        <div class="atalhos">
            <button data-acao="valor" data-v="50">50</button>
            <button data-acao="valor" data-v="100">100</button>
            <button data-acao="valor" data-v="500">500</button>
            <button data-acao="tudo">Tudo</button>
        </div>
        <div class="linha"><span>Rende</span><b class="num sobe">${taxaTexto(id)}</b></div>
        <div class="linha"><span>Em 1 ano vira (já com IR)</span><b class="num sobe" id="bProj"></b></div>
        ${a.carencia ? `<div class="linha"><span>Pode resgatar</span><b>${liquidezTexto(id)}</b></div>` : ''}
        <div class="linha"><span>Saldo disponível</span><b class="num">${fmtBRL(estado.caixa)}</b></div>
        <button class="enviar compra" data-acao="aplicar">Aplicar</button>
        <hr class="separador">
        <div class="panel-title" style="padding-left:0">Sua aplicação</div>
        ${posicao}
    </div>`;
}

function atualizarTotaisBoleta() {
    const id = estado.selecionado;
    if (ehFixa(id)) {
        const campo = document.getElementById('bValor');
        if (!campo) return;
        const v = parseFloat(campo.value) || 0;
        const bruto = id === 'POUP' ? v * Math.pow(1 + mensalPoupanca(), 12) : v * (1 + taxaAnual(id));
        document.getElementById('bProj').textContent = fmtBRL(calcularResgate({ ativo: id, aplicado: v, valor: bruto, dias: DIAS_ANO }).liquido);
        return;
    }
    if (estado.mercadoFechado) return;
    const qtd = Math.max(0, Math.floor(parseFloat(document.getElementById('bQtd').value) || 0));
    const enviar = document.getElementById('bEnviar');
    if (ladoBoleta === 'compra') {
        const total = qtd * preco(id);
        document.getElementById('bTotal').textContent = fmtBRL(total);
        enviar.disabled = qtd < 1 || total > estado.caixa + 1e-9;
    } else {
        const pos = estado.acoes[id];
        const valida = pos && qtd >= 1 && qtd <= pos.qtd;
        const p = pos && qtd >= 1 ? previaVenda(id, qtd) : { valor: 0, lucro: 0, ir: 0 };
        document.getElementById('bTotal').textContent = fmtBRL(p.valor - p.ir);
        const lucro = document.getElementById('bLucro');
        lucro.textContent = fmtBRL(p.lucro);
        lucro.className = 'num ' + classe(p.lucro);
        document.getElementById('bIR').textContent = p.ir ? '− ' + fmtBRL(p.ir) : 'Isento';
        enviar.disabled = !valida;
    }
}

function renderAba() {
    document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('ativo', b.dataset.aba === aba));
    const el = document.getElementById('aba');
    if (aba === 'carteira') el.innerHTML = htmlCarteira();
    if (aba === 'vida') el.innerHTML = htmlVida();
    if (aba === 'bens') el.innerHTML = htmlBens();
    if (aba === 'empresas') el.innerHTML = htmlEmpresas();
    if (aba === 'patrimonio') {
        el.innerHTML = `<p class="dica" style="margin:0 0 10px">A linha tracejada é todo o dinheiro que você guardou: os R$ 1.000 do começo mais o que sobrou do salário a cada mês, menos o que gastou em cursos. A distância entre as duas linhas é o que seus investimentos ganharam ou perderam.</p><canvas id="graficoPatrimonio"></canvas>`;
        desenharPatrimonio();
    }
    if (aba === 'extrato') {
        el.innerHTML = estado.extrato.map(e => `
            <div class="extrato-item">
                <div>${e.texto}<small>${dataDoDia(e.dia).toLocaleDateString('pt-BR')}</small></div>
                <b class="num ${classe(e.valor)}">${e.valor ? (e.valor > 0 ? '+' : '') + fmtBRL(e.valor) : ''}</b>
            </div>`).join('');
    }
    if (aba === 'noticias') {
        estado.naoLidas = 0;
        renderSelo();
        el.innerHTML = estado.noticias.length
            ? estado.noticias.map(n => htmlNoticia(n)).join('')
            : '<p class="vazio">Ainda não saiu nenhuma notícia. Sai mais ou menos uma por mês do jogo, e os resultados das empresas saem a cada 3 meses.</p>';
    }
    if (aba === 'aprenda') el.innerHTML = htmlAprenda();
}

// destaque = mostrar só a reação deste ativo (usado no painel de detalhe).
function htmlNoticia(n, destaque) {
    const reacao = id => {
        const v = preco(id) / n.precos[id] - 1;
        return `<span class="num ${classe(v)}">${fmtPct(v)}</span>`;
    };
    let corpo = '';
    if (n.tabela && !destaque) {
        corpo = `<table class="tabela-resultados">
            <thead><tr><th>Empresa</th><th>Lucro (vs. ano passado)</th><th>Mercado esperava</th><th>Ação desde então</th></tr></thead>
            <tbody>${n.tabela.map(l => `<tr data-id="${l.id}"><td><b>${l.id}</b> ${ATIVOS[l.id].nome}</td>
                <td class="num ${classe(l.real - l.esperado)}">${fmtPct(l.real)}</td>
                <td class="num">${fmtPct(l.esperado)}</td><td>${reacao(l.id)}</td></tr>`).join('')}</tbody>
        </table>`;
    } else {
        const ids = destaque && destaque in n.precos ? [destaque] : Object.keys(n.precos);
        const mostrar = ids.slice(0, 10);
        corpo = ids.length
            ? `<div class="chips">${mostrar.map(id => `<button class="chip" data-id="${id}"><b>${id}</b> ${reacao(id)}</button>`).join('')}
               ${ids.length > mostrar.length ? `<span class="mais">+${ids.length - mostrar.length} ativos</span>` : ''}</div>
               <small class="dica-chip">Quanto cada ativo mudou desde a notícia</small>`
            : '';
    }
    return `<article class="noticia">
        <div class="noticia-topo"><span class="selo ${n.tipo}">${ROTULO_NOTICIA[n.tipo]}</span><small>${dataDoDia(n.dia).toLocaleDateString('pt-BR')}</small></div>
        <h5>${n.titulo}</h5>
        <p>${n.porque}</p>
        ${corpo}
    </article>`;
}

function htmlCarteira() {
    const linhas = [];
    for (const id of ORDEM) {
        if (ehFixa(id)) {
            const lotes = estado.lotes.filter(l => l.ativo === id);
            if (!lotes.length) continue;
            const r = somarResgates(lotes);
            linhas.push({ id, nome: ATIVOS[id].nome, qtd: '—', medio: '—', atual: '—', investido: r.aplicado, valor: r.bruto });
        } else if (estado.acoes[id]) {
            const pos = estado.acoes[id];
            linhas.push({ id, nome: `${id} · ${ATIVOS[id].nome}`, qtd: pos.qtd, medio: fmtBRL(pos.pm), atual: fmtBRL(preco(id)), investido: pos.qtd * pos.pm, valor: pos.qtd * preco(id) });
        }
    }
    if (!linhas.length) {
        return `<p class="vazio">Você ainda não investiu. Escolha um ativo na lista de ativos e use a boleta para comprar ou aplicar. O tempo passa sozinho: um dia útil a cada minuto, e todo mês o que sobra do seu salário cai no saldo. Dá para pausar ou acelerar no topo da tela.</p>`;
    }
    const total = patrimonioAtual();
    const cor = i => (i === linhas.length ? '#3a4255' : CORES_CARTEIRA[i % CORES_CARTEIRA.length]);
    const fatias = [...linhas.map(l => ({ nome: l.nome, valor: l.valor })), { nome: 'Saldo em dinheiro', valor: Math.max(0, estado.caixa) }, ...(patrimonioBens() > 0 ? [{ nome: 'Bens (carros e imóveis, sem a dívida)', valor: patrimonioBens() }] : []), ...(patrimonioEmpresas() > 0 ? [{ nome: 'Empresas', valor: patrimonioEmpresas() }] : [])];
    const totalFatias = fatias.reduce((soma, f) => soma + f.valor, 0) || 1;
    const barra = fatias.map((f, i) => `<div style="width:${(f.valor / totalFatias) * 100}%;background:${cor(i)}"></div>`).join('');
    const legenda = fatias.map((f, i) => `<span><i style="background:${cor(i)}"></i>${f.nome} ${fmtPct(f.valor / totalFatias, false)}</span>`).join('');
    return `<div class="legenda">${legenda}</div><div class="barra-alocacao">${barra}</div>
    <table class="tabela-carteira">
        <thead><tr><th>Ativo</th><th>Quantidade</th><th>Preço médio</th><th>Preço atual</th><th>Investido</th><th>Valor atual</th><th>Resultado</th></tr></thead>
        <tbody>${linhas.map(l => {
            const res = l.valor - l.investido;
            // data-rotulo: no celular a tabela vira um cartão por ativo, com o nome de cada número ao lado.
            const cel = (rotulo, v, cls = '') => `<td class="num ${cls}" data-rotulo="${rotulo}"${v === '—' ? ' data-vazio' : ''}>${v}</td>`;
            return `<tr data-id="${l.id}"><td><b>${l.nome}</b></td>${cel('Quantidade', l.qtd)}${cel('Preço médio', l.medio)}${cel('Preço atual', l.atual)}
            ${cel('Investido', fmtBRL(l.investido))}${cel('Valor atual', fmtBRL(l.valor))}
            ${cel('Resultado', `${fmtBRL(res)} (${fmtPct(res / l.investido)})`, classe(res))}</tr>`;
        }).join('')}</tbody>
    </table>`;
}

function htmlAprenda() {
    const cards = [
        ['O que é uma ação?', 'É um pedacinho de uma empresa. Se a empresa tem 1 milhão de pedacinhos e você compra 1, você é dono de uma parte bem pequena dela, e tem direito a uma parte do lucro.'],
        ['Por que o preço sobe e desce?', 'Todo dia milhares de pessoas compram e vendem. Se mais gente quer comprar, o preço sobe. Se mais gente quer vender, cai. Notícias boas ou ruins sobre a empresa mudam a vontade das pessoas.'],
        ['Velas no gráfico', 'Cada "vela" mostra um dia. Verde: o preço terminou mais alto do que começou. Vermelha: terminou mais baixo. Os risquinhos mostram o preço mais alto e o mais baixo do dia.'],
        ['Dividendos', 'Quando a empresa lucra, ela pode dividir parte do dinheiro com os sócios. Se você tem a ação, cai dinheiro no seu saldo sem precisar vender nada!'],
        ['Fundos imobiliários (FIIs)', 'Muita gente junta dinheiro para comprar prédios, galpões e shoppings. O aluguel é dividido todo mês entre os donos das cotas.'],
        ['Juros compostos', 'É juros sobre juros. Os juros que você ganhou este mês também rendem no mês seguinte. É uma bola de neve: quanto mais tempo, mais rápido ela cresce.'],
        ['Renda fixa x variável', 'Na renda fixa você sabe a regra do jogo: empresta e recebe juros. Na renda variável ninguém sabe o futuro: pode ganhar bem mais, mas também pode perder.'],
        ['CDI e "% do CDI"', 'O CDI é a taxa que os bancos usam para emprestar entre si, quase igual à Selic. Um CDB de "110% do CDI" rende 10% a mais que o CDI.'],
        ['Carência e liquidez', 'Liquidez é a facilidade de tirar o dinheiro. Carência é o tempo que ele precisa ficar parado. Quem aceita esperar mais, normalmente ganha mais.'],
        ['FGC', 'O Fundo Garantidor de Créditos devolve até R$ 250 mil se um banco quebrar. Vale para poupança, CDB, LCI e LCA. Debêntures, CRI e CRA não têm essa proteção.'],
        ['Risco e volatilidade', 'Volatilidade é o quanto o preço balança. Compare Magazine Luiza com Taesa no gráfico de 1 ano: uma parece montanha-russa, a outra é mais tranquila.'],
        ['Diversificar', 'É não colocar todos os ovos na mesma cesta. Se você tem vários ativos, quando um vai mal os outros seguram. O ETF BOVA11 já faz isso por você.'],
        ['Preço médio', 'Se você compra uma ação a R$ 10 e depois outra a R$ 12, seu preço médio é R$ 11. Você só tem lucro se vender acima dele.'],
        ['Inflação', 'É quando as coisas ficam mais caras. Se a inflação é 5% ao ano e seu dinheiro rende 3%, na verdade você ficou mais pobre. Por isso é importante investir!'],
        ['Imposto de Renda', 'Na renda fixa é de 22,5% a 15% do ganho (quanto mais tempo, menos imposto). Poupança, LCI, LCA, CRI, CRA e debêntures incentivadas são isentas. Em ações, vendas até R$ 20 mil por mês são isentas.'],
        ['Selic', 'É a taxa básica de juros do Brasil, definida pelo Banco Central. Quando ela sobe, a renda fixa rende mais. O jogo começa com a Selic de verdade, e depois ela muda nas reuniões do Copom.'],
        ['Copom e Super Quarta', 'A cada 3 meses, numa quarta-feira, o Banco Central decide a Selic. Se a inflação está alta, ele sobe os juros para esfriar a economia. Se está baixa, ele corta. Juros altos seguram os preços, mas deixam o crédito caro e pesam sobre a bolsa.'],
        ['Marcação a mercado', 'Títulos prefixados e IPCA+ do Tesouro têm taxa travada. Se os juros do mercado sobem, o seu título, que paga menos, vale menos na hora de vender. Se os juros caem, ele vale mais. Segurando até o vencimento, você recebe exatamente o combinado.'],
        ['Rumores', 'Às vezes uma notícia sai como boato, antes de qualquer confirmação. O preço se mexe na hora, mas depois o boato pode ser desmentido e o preço volta. Quem espera a confirmação perde a pressa, mas também perde menos.'],
        ['Notícias e expectativas', 'Uma notícia boa costuma fazer a ação subir, mas nem sempre! Se todo mundo já esperava, o preço pode até cair. Por isso investidores leem notícias, mas não apostam tudo nelas.'],
        ['Resultados e P/L', 'A cada 3 meses as empresas contam quanto lucraram. O P/L diz quantos anos de lucro a ação custa: P/L 5 é "barato", P/L 30 é "caro". Ações caras precisam crescer muito para valer a pena.'],
        ['Aporte mensal', 'Aporte é o dinheiro novo que você coloca nos investimentos. Aqui ele é o que sobra do seu salário depois dos impostos e do custo de vida. Quem investe um pouquinho todo mês, por muitos anos, junta muito mais do que quem espera ter muito para começar.'],
        ['Salário bruto e líquido', 'Bruto é o salário combinado com a empresa. Líquido é o que cai na conta depois dos descontos. Os dois principais são o INSS e o Imposto de Renda.'],
        ['INSS', 'É a contribuição para a Previdência, que paga aposentadorias e auxílios. Vai de 7,5% a 14%, e cada alíquota vale só para um pedaço do salário. Existe um teto: acima dele, o desconto não aumenta mais.'],
        ['Imposto de Renda na fonte', 'O IRRF é descontado direto do salário. Quem ganha até R$ 5 mil por mês não paga. Acima disso o imposto cresce aos poucos, e a alíquota mais alta, de 27,5%, só vale para a parte de cima do salário.'],
        ['Custo de vida', 'É tudo que você gasta para viver: moradia, comida, transporte, saúde e lazer. Quem gasta menos do que ganha tem sobra para investir. A inflação encarece o custo de vida todo ano.'],
        ['Carreira e cursos', 'Estudar custa dinheiro e leva tempo, mas aumenta o salário para o resto da vida. No jogo, cada promoção exige experiência no cargo e um curso de capacitação.'],
        ['Cheque especial', 'Se o saldo fica negativo, o banco empresta sem perguntar e cobra juros altíssimos, aqui 8% ao mês. É uma das dívidas mais caras que existem. Por isso vale ter uma reserva em um investimento que dá para resgatar a qualquer hora.'],
        ['Independência financeira', 'É quando o que seus investimentos pagam por mês cobre o seu custo de vida. A partir daí, trabalhar vira escolha. Quanto menor o custo de vida, mais cedo ela chega.'],
        ['IPO: abrir o capital', 'IPO é quando uma empresa vende uma parte de si ao público e passa a ter ações negociadas na bolsa. Os sócios recebem dinheiro, mas dividem lucros e decisões com os novos acionistas. Só empresas grandes e lucrativas conseguem fazer isso.'],
        ['Desconto do IPO e diluição', 'No IPO o preço da oferta fica um pouco abaixo do que a empresa vale, para atrair compradores, e por isso o preço costuma subir nos primeiros dias. Se depois a empresa vender ações novas para levantar dinheiro, cada ação passa a valer uma fatia menor dela: é a diluição.'],
        ['Abrir ou comprar uma empresa', 'Abrir uma startup custa pouco, mas ela começa gastando mais do que ganha, e a maioria não dá certo. Comprar uma empresa que já funciona custa mais e dá lucro desde o começo, com menos incerteza. Como sócio, você recebe os lucros que passam da reserva da empresa.'],
        ['Chamada de capital', 'Quando o caixa da empresa acaba, os sócios precisam colocar mais dinheiro. Se não colocarem a tempo, a empresa fecha e o que foi investido se perde. Por isso quem empreende precisa de reserva também fora da empresa.'],
        ['Alavancagem operacional', 'Custos fixos não diminuem quando as vendas caem. Numa empresa com muito custo fixo, uma queda pequena nas vendas pode derrubar o lucro de uma vez e até virar prejuízo. É por isso que crises quebram empresas aparentemente saudáveis.'],
        ['Quanto vale uma empresa', 'Um jeito comum de calcular é o lucro de um ano vezes um múltiplo. Quando a Selic sobe, o múltiplo cai, porque a renda fixa passa a competir: o mesmo lucro vale menos. Compradores diferentes fazem propostas diferentes, e o certo é comparar antes de vender.'],
        ['Eleições e o mercado', 'A cada 4 anos o país escolhe seu governo, e o mercado reage ao que espera dele. Contas públicas em ordem e reformas deixam os investidores confiantes: bolsa sobe, dólar cai, juros diminuem. Promessa de gastar muito os deixa receosos. Meses antes da votação tudo oscila mais, porque ninguém sabe o resultado. E o que mexe no preço é a surpresa: se o favorito ganha, quase nada muda.' + AVISO_FICTICIO],
        ['Cisne negro e circuit breaker', 'Cisne negro é um evento raro que ninguém previu, como uma pandemia, uma guerra ou uma crise bancária global. Quando a bolsa cai demais, ela é fechada por um tempo para evitar o pânico, e é o circuit breaker. Quem tem toda a reserva em ações não consegue sacar nada nesse período. Por isso a reserva fica na renda fixa.'],
        ['Reserva de emergência', 'É dinheiro guardado para o que não dá para adiar: um conserto, uma consulta, um aparelho que queimou. Deve ficar onde dá para sacar rápido e sem perder valor, como o Tesouro Selic ou um CDB de liquidez diária. Uma boa meta são 6 meses de gastos.'],
        ['Financiar: SAC e Price', 'Financiar é pagar aos poucos o que você não tem agora, e os juros são o preço disso. No SAC a parcela começa alta e cai, e você paga menos juros no total. Na Price a parcela é fixa e começa menor, mas custa mais no fim. Quanto maior a entrada, menos juros.'],
        ['IPVA, IPTU e manutenção', 'Ter um bem custa além do preço. O carro paga IPVA todo ano, além de seguro, combustível e oficina. O imóvel paga IPTU e condomínio ou reparos. Esses gastos se repetem enquanto o bem for seu.'],
        ['Liquidez dos bens', 'Um investimento da corretora vira dinheiro em dias. Um carro leva semanas para vender, e um imóvel pode levar meses, ainda com corretor e imposto sobre o lucro. Quem tem muito dinheiro preso em bens sofre mais num imprevisto.'],
        ['Carro perde valor, imóvel acompanha a inflação', 'Um carro novo vale cada vez menos com o passar dos anos. Um imóvel costuma acompanhar a inflação, mas isso muda com os juros e com a região. Nenhum dos dois paga renda sozinho, a não ser que o imóvel seja alugado.'],
        ['Salário mínimo e 13º', 'Todo janeiro o salário mínimo aumenta: repõe a inflação do ano e ganha um pouco a mais se a economia cresceu. Os salários de entrada sobem junto, porque ninguém pode ganhar menos que o mínimo. Os cargos mais altos só repõem a inflação: para ganhar mais de verdade, é preciso ser promovido. Em dezembro o trabalhador recebe o 13º salário, um salário extra.'],
        ['Dividendos a receber', 'Os dividendos e aluguéis ficam guardados no cofrinho do topo da tela. Clique nele para passar o dinheiro para o saldo e poder investir de novo. Reinvestir é o segredo dos juros compostos!']
    ];
    return `<div class="cards">${cards.map(([t, x]) => `<div class="card"><h4>${t}</h4>${x}</div>`).join('')}</div>`;
}

let trocandoCarreira = false;
let startupEmCurso = { setor: 'servicos', capital: CAPITAIS_STARTUP[1] };
let ipoEmCurso = null; // { uid, frac }

function cartaoListada(e) {
    const id = e.listada;
    const part = participacao(e);
    const av = avaliarEmpresa(e);
    const ult = e.hist[e.hist.length - 1];
    const linha = (rotulo, valor, cls = '') => `<div class="linha"><span>${rotulo}</span><b class="num ${cls}">${valor}</b></div>`;
    return `<div class="card">
        <h4>${e.nome} · <span class="amarelo">${id}</span></h4>
        <p class="dica" style="margin:0 0 6px">${setorDa(e).nome} · na bolsa</p>
        ${linha('Preço da ação', fmtBRL(preco(id)))}
        ${linha('Valor de mercado', fmtBRL(e.acoesTotal * preco(id)))}
        ${linha('Valor justo estimado', fmtBRL(av.valor))}
        ${linha('Sua participação', fmtPct(part, false))}
        ${linha('Lucro do mês', ult ? fmtBRL(ult.l) : '—', ult ? classe(ult.l) : '')}
        ${linha('Dividendos que você já recebeu', fmtBRL(e.recebido), 'sobe')}
        ${part < 0.5 ? '<p class="dica">Você tem menos da metade das ações: já não controla a empresa.</p>' : ''}
        <button class="link-botao" data-id="${id}">Ver na bolsa e negociar</button>
    </div>`;
}

function htmlIPO(e) {
    const s = simularIPO(e, ipoEmCurso.frac);
    const linha = (rotulo, valor, cls = '') => `<div class="linha"><span>${rotulo}</span><b class="num ${cls}">${valor}</b></div>`;
    const botoes = FLOATS_IPO.map(f => `<button class="${f === ipoEmCurso.frac ? 'ativo' : ''}" data-emp="ipofloat" data-valor="${f}">${Math.round(f * 100)}%</button>`).join('');
    return `<hr class="separador">
        <p class="dica" style="margin:0 0 6px">Quanto da empresa vender ao público</p>
        <div class="seg quebra">${botoes}</div>
        ${linha('Valor justo estimado', fmtBRL(s.av.valor))}
        ${linha('Ações da empresa', String(s.total))}
        ${linha(`Preço da oferta (${fmtPct(s.desconto, false)} abaixo do justo)`, fmtBRL(s.precoIPO))}
        ${linha('Ações vendidas', String(s.vendidas))}
        ${linha('Taxa dos bancos', '− ' + fmtBRL(s.taxa))}
        ${linha('Imposto de Renda', s.ir > 0 ? '− ' + fmtBRL(s.ir) : 'Isento')}
        <div class="linha total"><span>Você recebe</span><b class="num">${fmtBRL(s.liquido)}</b></div>
        ${linha('Ações que ficam com você', `${s.retidas} (${fmtPct(1 - ipoEmCurso.frac, false)})`)}
        <p class="dica">O desconto atrai compradores, e por isso o preço costuma subir nos primeiros dias. Depois disso o preço acompanha o lucro da empresa e o humor do mercado, e você passa a receber só a sua parte dos lucros. Se a empresa precisar de dinheiro, ela emite ações novas e a sua fatia diminui.</p>
        <button class="enviar compra" data-emp="ipoconfirmar" data-valor="${e.uid}">Fazer o IPO</button>
        <button class="link-botao" data-emp="ipocancelar">Cancelar</button>`;
}

function htmlEmpresas() {
    const linha = (rotulo, valor, cls = '') => `<div class="linha"><span>${rotulo}</span><b class="num ${cls}">${valor}</b></div>`;
    const naBolsa = estado.empresas.filter(e => e.listada).map(cartaoListada).join('');
    const cartoes = privadas().map(e => {
        const set = setorDa(e);
        const av = avaliarEmpresa(e);
        const ult = e.hist[e.hist.length - 1];
        const meses = Math.min(12, e.hist.length);
        let acoes = '';
        if (e.prazo) {
            acoes += `<p class="desce"><b>Chamada de capital: a empresa ficou sem caixa. Coloque ${fmtBRL(chamadaValor(e))} até ${dataDoDia(e.prazo).toLocaleDateString('pt-BR')} ou ela vai à falência.</b></p>
                <button class="enviar compra" data-emp="injetar" data-valor="${e.uid}:${chamadaValor(e)}">Colocar ${fmtBRL(chamadaValor(e))}</button>`;
        } else {
            const tres = moeda(3 * custoFixoNominal(e));
            acoes += `<button class="link-botao" data-emp="injetar" data-valor="${e.uid}:${tres}">Colocar ${fmtBRL(tres)} (3 meses de custos)</button>`;
        }
        if (e.propostas) {
            acoes += `<hr class="separador"><p class="dica" style="margin:0 0 6px">Propostas válidas até ${dataDoDia(e.propostas.ate).toLocaleDateString('pt-BR')}:</p>` +
                e.propostas.lista.map((p, i) => {
                    const { liquido } = liquidoDaVenda(e, p.preco);
                    return `<button class="opcao" data-emp="aceitar" data-valor="${e.uid}:${i}"><span>${p.comprador}<small>${p.texto} Você recebe ${fmtBRL(liquido)} depois do imposto.</small></span><b class="num">${fmtBRL(p.preco)}</b></button>`;
                }).join('');
        } else {
            acoes += `<div><button class="link-botao" data-emp="propostas" data-valor="${e.uid}">Pedir propostas de venda</button></div>`;
        }
        if (ipoEmCurso && ipoEmCurso.uid === e.uid) acoes += htmlIPO(e);
        else if (elegivelIPO(e)) acoes += `<div><button class="link-botao" data-emp="ipo" data-valor="${e.uid}">Abrir o capital na bolsa (IPO)</button></div>`;
        else acoes += `<p class="dica">IPO: precisa de ${fmtBRL(lucroMinimoIPO())} de lucro por ano e 12 meses de história${e.hist.length >= 12 ? ` (a empresa faz ${fmtBRL(Math.max(0, avaliarEmpresa(e).lucroAno))})` : ''}.</p>`;
        return `<div class="card">
            <h4>${e.nome}</h4>
            <p class="dica" style="margin:0 0 6px">${set.nome}${e.startup ? ' · startup' : ''}</p>
            ${linha('Faturamento do mês', ult ? fmtBRL(ult.r) : '—')}
            ${linha('Lucro do mês', ult ? fmtBRL(ult.l) : '—', ult ? classe(ult.l) : '')}
            ${linha(`Lucro dos últimos ${meses || 0} meses`, meses ? fmtBRL(e.hist.slice(-12).reduce((soma, m) => soma + m.l, 0)) : '—')}
            ${linha('Caixa da empresa', fmtBRL(e.caixa), e.caixa < 0 ? 'desce' : '')}
            ${linha('Quanto vale hoje', fmtBRL(av.valor))}
            ${linha('Você já colocou', fmtBRL(e.investido))}
            ${linha('Lucros que você já recebeu', fmtBRL(e.recebido), 'sobe')}
            ${acoes}
        </div>`;
    }).join('');
    const vazio = !cartoes && !naBolsa ? '<p class="vazio">Você ainda não tem empresas. Abra uma startup ou compre uma empresa que já funciona, logo abaixo.</p>' : '';

    const set = SETORES_EMPRESA[startupEmCurso.setor];
    const cap = moeda(startupEmCurso.capital * estado.indicePrecos);
    const taxa = moeda(Math.max(1500 * estado.indicePrecos, cap * CUSTO_ABERTURA));
    const botoes = (acao, itens, atual) => `<div class="seg quebra">${itens.map(([valor, rotulo]) =>
        `<button class="${valor === atual ? 'ativo' : ''}" data-emp="${acao}" data-valor="${valor}">${rotulo}</button>`).join('')}</div>`;
    const abrir = `<div class="card">
        <h4>Abrir uma startup</h4>
        <p class="dica" style="margin:0 0 6px">Setor</p>
        ${botoes('setor', Object.entries(SETORES_EMPRESA).map(([id, s]) => [id, s.curto]), startupEmCurso.setor)}
        <p class="dica" style="margin:10px 0 6px">Capital inicial</p>
        ${botoes('capital', CAPITAIS_STARTUP.map(c => [c, fmtBRL(c * estado.indicePrecos)]), startupEmCurso.capital)}
        <p class="dica">${set.nome}. ${set.explica}</p>
        ${linha('Capital', fmtBRL(cap))}
        ${linha('Advogado, contador e registro', fmtBRL(taxa))}
        ${linha('Custo fixo por mês', fmtBRL(startupEmCurso.capital / 14 * estado.indicePrecos))}
        <div class="linha total"><span>Você paga hoje</span><b class="num">${fmtBRL(cap + taxa)}</b></div>
        <p class="dica">Uma startup começa vendendo pouco e gastando muito. Ninguém sabe de antemão se ela vai crescer rápido o bastante. Se o caixa acabar, vem uma chamada de capital e você tem 1 mês para colocar mais dinheiro, ou ela fecha.</p>
        <button class="enviar compra" data-emp="abrir" ${cap + taxa > estado.caixa + 1e-9 || privadas().length >= MAX_EMPRESAS ? 'disabled' : ''}>Abrir startup</button>
    </div>`;

    const ofertas = ((estado.ofertasEmpresas && estado.ofertasEmpresas.lista) || []).map(o => {
        const av = avaliarEmpresa(o);
        const s = SETORES_EMPRESA[o.setor];
        const sens = s.sens >= 1.2 ? 'Sente muito a economia' : s.sens >= 0.8 ? 'Sente a economia' : 'Sente pouco a economia';
        return `<div class="card">
            <h4>${o.nome}</h4>
            <p class="dica" style="margin:0 0 6px">${s.nome} · ${sens}</p>
            ${linha('Faturamento por mês', fmtBRL(o.hist[0].r))}
            ${linha('Lucro por ano', fmtBRL(av.lucroAno), classe(av.lucroAno))}
            ${linha('Vendas no último ano', fmtPct(o.cresc12), classe(o.cresc12))}
            ${linha('Preço', fmtBRL(o.preco))}
            ${linha('Preço em anos de lucro', av.lucroAno > 0 ? fmtNum(o.preco / av.lucroAno) + ' anos' : '—')}
            <p class="dica">Com o lucro atual, o dinheiro se paga em ${av.lucroAno > 0 ? fmtNum(o.preco / av.lucroAno) : '—'} anos, e um investimento de renda fixa dobra o dinheiro em cerca de ${fmtNum(Math.log(2) / Math.log(1 + selic()))} anos. Empresa dá lucro maior, mas com risco e trabalho.</p>
            <button class="enviar compra" data-emp="comprar" data-valor="${o.id}" ${o.preco > estado.caixa + 1e-9 || privadas().length >= MAX_EMPRESAS ? 'disabled' : ''}>Comprar</button>
        </div>`;
    }).join('');
    const ate = estado.ofertasEmpresas ? dataDoDia(estado.ofertasEmpresas.dia + 126).toLocaleDateString('pt-BR') : '';

    return `${vazio}<div class="cards vida">${naBolsa}${cartoes}</div>
        <h4 style="margin:18px 0 8px">Abrir ou comprar</h4>
        <div class="cards vida">${abrir}${ofertas}</div>
        <p class="dica">As empresas à venda mudam em ${ate}. Os lucros vão para o seu saldo, mas só o que passa da reserva da empresa (3 meses de custo fixo). Isto é um jogo e simplifica impostos: o lucro distribuído não paga Imposto de Renda aqui.</p>`;
}

function acaoEmpresas(acao, valor) {
    const [a, b] = String(valor).split(':');
    switch (acao) {
        case 'setor': startupEmCurso.setor = valor; break;
        case 'capital': startupEmCurso.capital = +valor; break;
        case 'abrir': return abrirStartup(startupEmCurso.setor, startupEmCurso.capital);
        case 'comprar': return comprarEmpresa(valor);
        case 'injetar': return injetarCapital(a, +b);
        case 'propostas': return pedirPropostas(valor);
        case 'aceitar': return aceitarProposta(a, +b);
        case 'ipo': ipoEmCurso = { uid: +valor, frac: 0.3 }; break;
        case 'ipofloat': ipoEmCurso.frac = +valor; break;
        case 'ipocancelar': ipoEmCurso = null; break;
        case 'ipoconfirmar': return fazerIPO(a, ipoEmCurso ? ipoEmCurso.frac : 0.3);
    }
    renderAba();
}
let compraEmCurso = null; // compra aberta na aba Bens: { id, entrada, prazo, tabela }

function htmlBens() {
    const h = holerite();
    const linha = (rotulo, valor, cls = '') => `<div class="linha"><span>${rotulo}</span><b class="num ${cls}">${valor}</b></div>`;
    const reserva = reservaEmergencia();
    const gastos = Math.max(0, h.custo + h.bens - h.alugueis);
    const meses = gastos > 0 ? reserva / gastos : 0;
    const cardReserva = `<div class="card">
        <h4>Reserva de emergência</h4>
        ${linha('Saldo e renda fixa para resgatar', fmtBRL(reserva))}
        ${linha('Seus gastos por mês', fmtBRL(gastos))}
        <div class="meta"><div style="width:${Math.min(100, meses / RESERVA_META_MESES * 100)}%"></div></div>
        <p class="${meses >= RESERVA_META_MESES ? 'sobe' : ''}"><b>${meses >= RESERVA_META_MESES
            ? `Sua reserva cobre ${fmtNum(meses)} meses. Imprevistos não vão te pegar de surpresa!`
            : `Sua reserva cobre ${fmtNum(meses)} meses. A meta é ${RESERVA_META_MESES}.`}</b></p>
        ${estado.caixa < -0.005 ? `<p class="desce"><b>Você está no vermelho em ${fmtBRL(-estado.caixa)}, pagando ${fmtPct(JUROS_CHEQUE_ESPECIAL, false)} de juros ao mês. Venda algum investimento para quitar.</b></p>` : ''}
        <p class="dica">Imprevistos chegam sem avisar: celular quebrado, dentista, conserto do carro. A reserva ideal cobre uns 6 meses de gastos em investimentos que dá para resgatar rápido, como Tesouro Selic e CDB de liquidez diária. Títulos prefixados e IPCA+ longos também têm liquidez, mas o preço pode estar baixo na hora de vender.</p>
    </div>`;

    const cardsBens = estado.bens.map(b => {
        const v = valorDoBem(b);
        const detalhes = [
            linha('Valor hoje', fmtBRL(v)),
            linha('Você pagou', fmtBRL(b.compra)),
            b.fin ? linha('Dívida', fmtBRL(b.fin.saldo), 'desce') : '',
            b.fin ? linha(`Parcela (${b.fin.tabela === 'sac' ? 'SAC' : 'Price'})`, fmtBRL(parcelaDoMes(b.fin).parcela)) : '',
            b.fin ? linha('Parcelas que faltam', String(b.fin.restantes)) : '',
            b.tipo === 'imovel'
                ? linha('IPTU e manutenção', fmtBRL(v * IPTU_ANO / 12 + v * MANUT_IMOVEL_MES) + ' por mês')
                : linha('Combustível, seguro e manutenção', fmtBRL(Math.max(v * MANUT_CARRO_MES, 350 * estado.indicePrecos)) + ' por mês'),
            b.tipo === 'imovel' && !b.residencia && !b.venda ? linha('Aluguel que rende', fmtBRL(v * ALUGUEL_MES) + ' por mês', 'sobe') : ''
        ].join('');
        const botoes = [
            b.fin ? `<button class="link-botao" data-bens="quitar" data-valor="${b.uid}">Quitar a dívida</button>` : '',
            b.tipo === 'imovel' && !b.residencia && !b.venda ? `<button class="link-botao" data-bens="morar" data-valor="${b.uid}">Morar aqui</button>` : '',
            !b.venda ? `<button class="link-botao" data-bens="vender" data-valor="${b.uid}">Vender</button>` : ''
        ].filter(Boolean).join(' · ');
        return `<div class="card">
            <h4>${b.nome}${b.residencia ? ' · sua moradia' : ''}</h4>
            ${detalhes}
            ${b.venda ? `<p class="dica">À venda. O dinheiro entra em ${dataDoDia(b.venda.dia).toLocaleDateString('pt-BR')}.</p>` : ''}
            ${botoes ? `<div>${botoes}</div>` : ''}
        </div>`;
    }).join('');

    const catalogo = CATALOGO_BENS.map(i => `<button class="card trilha ${compraEmCurso && compraEmCurso.id === i.id ? 'ativo' : ''}" data-bens="escolher" data-valor="${i.id}">
        <h4>${i.nome}</h4><b class="num">${fmtBRL(precoLista(i))}</b>
        <small>${i.tipo === 'carro' ? 'Perde valor todo ano' : 'Acompanha a inflação, mas demora para vender'}</small></button>`).join('');

    return `<div class="cards vida">${cardReserva}${cardsBens}</div>
        <h4 style="margin:18px 0 8px">Comprar um bem</h4>
        <div class="cards">${catalogo}</div>
        ${compraEmCurso ? htmlCompra() : ''}`;
}

function htmlCompra() {
    const item = CATALOGO_BENS.find(i => i.id === compraEmCurso.id);
    const sim = simularCompra(item, compraEmCurso.entrada, compraEmCurso.prazo, compraEmCurso.tabela);
    const linha = (rotulo, valor, cls = '') => `<div class="linha"><span>${rotulo}</span><b class="num ${cls}">${valor}</b></div>`;
    const botoes = (acao, itens, atual) => `<div class="seg quebra">${itens.map(([valor, rotulo]) =>
        `<button class="${valor === atual ? 'ativo' : ''}" data-bens="${acao}" data-valor="${valor}">${rotulo}</button>`).join('')}</div>`;
    const financia = compraEmCurso.entrada < 1;
    const prazoTxt = n => (n >= 120 ? `${n / 12} anos` : `${n} meses`);
    return `<div class="card" style="margin-top:12px">
        <h4>${item.nome} · ${fmtBRL(sim.preco)}</h4>
        <p class="dica" style="margin:0 0 6px">Quanto pagar na hora</p>
        ${botoes('entrada', ENTRADAS.map(e => [e, e === 1 ? 'À vista' : Math.round(e * 100) + '% de entrada']), compraEmCurso.entrada)}
        ${financia ? `<p class="dica" style="margin:10px 0 6px">Prazo</p>
            ${botoes('prazo', PRAZOS_FINANCIAMENTO[item.tipo].map(n => [n, prazoTxt(n)]), compraEmCurso.prazo)}
            <p class="dica" style="margin:10px 0 6px">Tabela de pagamento</p>
            ${botoes('tabela', [['sac', 'SAC'], ['price', 'Price']], compraEmCurso.tabela)}
            <p class="dica">${compraEmCurso.tabela === 'sac'
                ? 'SAC: a parte do principal é igual todo mês, então as parcelas começam altas e vão diminuindo. No total você paga menos juros.'
                : 'Price: a parcela é igual todo mês. Começa menor e cabe mais fácil no bolso, mas no total você paga mais juros.'}</p>` : ''}
        <hr class="separador">
        ${linha('Entrada', fmtBRL(sim.entradaValor))}
        ${financia ? linha('Financiado', fmtBRL(sim.financiado)) : ''}
        ${financia ? linha('Juros do financiamento', fmtPct(taxaAnualFinanciamento(item.tipo), false) + ' ao ano') : ''}
        ${financia ? linha('Primeira parcela', fmtBRL(sim.primeira)) : ''}
        ${financia && compraEmCurso.tabela === 'sac' ? linha('Última parcela', fmtBRL(sim.ultima)) : ''}
        ${financia ? linha('Total de juros que você vai pagar', fmtBRL(sim.totalJuros), 'desce') : ''}
        ${financia ? linha('Parcelas no seu salário bruto', fmtPct(sim.comprometimento, false), sim.comprometimento > RENDA_MAX_PARCELAS ? 'desce' : '') : ''}
        ${sim.itbi ? linha('Imposto e cartório (ITBI)', fmtBRL(sim.itbi)) : ''}
        <div class="linha total"><span>Você paga hoje</span><b class="num">${fmtBRL(sim.dinheiroHoje)}</b></div>
        ${sim.motivo ? `<p class="desce"><b>${sim.motivo}</b></p>` : ''}
        <button class="enviar compra" data-bens="comprar" ${sim.ok ? '' : 'disabled'}>Comprar</button>
        <button class="link-botao" data-bens="cancelar">Cancelar</button>
    </div>`;
}

function acaoBens(acao, valor) {
    switch (acao) {
        case 'escolher': {
            const item = CATALOGO_BENS.find(i => i.id === valor);
            compraEmCurso = { id: valor, entrada: 0.2, prazo: PRAZOS_FINANCIAMENTO[item.tipo][1], tabela: 'sac' };
            break;
        }
        case 'entrada': compraEmCurso.entrada = +valor; break;
        case 'prazo': compraEmCurso.prazo = +valor; break;
        case 'tabela': compraEmCurso.tabela = valor; break;
        case 'cancelar': compraEmCurso = null; break;
        case 'comprar': return comprarBem();
        case 'quitar': return quitarFinanciamento(valor);
        case 'vender': return venderBem(valor);
        case 'morar': return morarEm(valor);
    }
    renderAba();
}

function htmlEscolhaCarreira() {
    const cartoes = Object.entries(CARREIRAS).map(([id, t]) => {
        const [inicio, salarioInicio] = t.cargos[0];
        const [topo, salarioTopo] = t.cargos[t.cargos.length - 1];
        return `<button class="card trilha" data-vida="trilha" data-valor="${id}">
            <h4>${t.nome}</h4>
            Começa como ${inicio}: <b class="num">${fmtBRL(salarioDoCargo(salarioInicio))}</b>
            <small>Topo: ${topo}, ${fmtBRL(salarioDoCargo(salarioTopo))}</small>
        </button>`;
    }).join('');
    const titulo = estado.carreira
        ? 'Trocar de carreira: você recomeça no primeiro cargo da nova área. <button class="link-botao" data-vida="cancelar">Cancelar</button>'
        : 'Escolha sua profissão. Todo mês você recebe o salário, paga impostos e custo de vida, e investe o que sobrar. Dá para trocar depois.';
    return `<p class="dica" style="margin:0 0 12px">${titulo}</p><div class="cards">${cartoes}</div>`;
}

function htmlVida() {
    if (!estado.carreira || trocandoCarreira) return htmlEscolhaCarreira();
    const h = holerite();
    const c = estado.carreira;
    const trilha = CARREIRAS[c.trilha];
    const p = proximaPromocao();
    const linha = (rotulo, valor, cls = '') => `<div class="linha"><span>${rotulo}</span><b class="num ${cls}">${valor}</b></div>`;

    const escada = trilha.cargos.map(([nome, valor], i) =>
        `<li class="${i === c.nivel ? 'atual' : i < c.nivel ? 'feito' : ''}"><span>${i < c.nivel ? '✓ ' : ''}${nome}</span><span class="num">${fmtBRL(salarioDoCargo(valor))}</span></li>`).join('');
    const promocao = p
        ? `${linha('Próximo cargo', p.nome)}
           ${linha('Experiência no cargo atual', `${Math.min(c.meses, p.mesesExigidos)} de ${p.mesesExigidos} meses`, p.faltam ? '' : 'sobe')}
           ${linha('Curso de capacitação', fmtBRL(p.custo), p.custo > estado.caixa ? 'desce' : 'sobe')}
           <button class="enviar compra" data-vida="promover" ${p.faltam || p.custo > estado.caixa + 1e-9 ? 'disabled' : ''}>Fazer o curso e ser promovido</button>`
        : '<p class="dica">Você chegou ao topo da carreira!</p>';

    const padroes = PADROES_VIDA.map((v, i) =>
        `<button class="opcao ${i === estado.padraoVida ? 'ativo' : ''}" data-vida="padrao" data-valor="${i}">
            <span>${v.nome}<small>${v.explica}</small></span><b class="num">${fmtBRL(custoDeVida(i))}</b>
        </button>`).join('');

    const fel = alvoFelicidade();
    const [, rosto, nomeHumor] = humor();
    const [, rostoAlvo] = humor(fel.alvo);
    const indo = fel.alvo > estado.felicidade + 1 ? 'subindo' : fel.alvo < estado.felicidade - 1 ? 'caindo' : 'estável';
    const pontos = v => `${v > 0 ? '+' : ''}${Math.round(v)}`;
    const mult = multImprevistos();
    const cardFelicidade = `<div class="card">
            <h4>Felicidade</h4>
            <div class="linha"><span>${rosto} ${nomeHumor}</span><b class="num">${Math.round(estado.felicidade)} de 100</b></div>
            <div class="meta"><div style="width:${estado.felicidade}%;background:${corFelicidade()}"></div></div>
            ${linha(`Para onde está indo (${indo})`, `${rostoAlvo} ${Math.round(fel.alvo)}`, indo === 'subindo' ? 'sobe' : indo === 'caindo' ? 'desce' : '')}
            ${linha(`Padrão de vida: ${fmtPct(Math.min(fel.parteVida, 9.99), false)} do salário líquido`, String(Math.round(fel.padrao)))}
            ${fel.casa ? linha('Morar na casa própria', pontos(fel.casa), 'sobe') : ''}
            ${fel.carro ? linha('Ter carro', pontos(fel.carro), 'sobe') : ''}
            ${fel.vermelho ? linha('Dívida no vermelho', pontos(fel.vermelho), 'desce') : ''}
            ${linha('Alegria de investir neste mês', `+${estado.alegriaInvestMes.toFixed(1).replace('.', ',')} de ${FELICIDADE_INVESTIR_MES}`, estado.alegriaInvestMes > 0.05 ? 'sobe' : '')}
            ${linha('Chance de imprevistos', mult > 1.05 ? `${fmtNum(mult)}× maior` : mult < 0.95 ? `${fmtNum(1 / mult)}× menor` : 'normal', mult > 1.05 ? 'desce' : mult < 0.95 ? 'sobe' : '')}
            ${estado.felicidade < 50 ? '<p class="desce"><b>Com a felicidade baixa, problemas de saúde (até cirurgias) e crises de estresse ficam mais prováveis.</b></p>' : ''}
            <p class="dica">Todo mês a felicidade anda um pouco em direção ao alvo. Quem só trabalha e guarda tudo vai ficando triste. Subir o padrão de vida dá +${FELICIDADE_SUBIR_PADRAO} na hora (descer tira ${FELICIDADE_DESCER_PADRAO}), comprar um bem dá alegria conforme o tamanho da compra perto do seu patrimônio, e cada investimento também alegra um pouco (até +${FELICIDADE_INVESTIR_MES} por mês, e no máximo ${FELICIDADE_INVESTIR_ACIMA_ALVO} pontos acima do alvo: investir é bom, mas não substitui viver). Mas a alegria passa: aos poucos você se acostuma e ela volta para o alvo. O segredo é equilibrar aproveitar hoje e investir para o futuro.</p>
        </div>`;

    const renda = rendaPassivaMensal();
    const gastos = h.custo + h.bens;
    const cobertura = gastos ? renda / gastos : 0;
    const independente = cobertura >= 1;

    return `<div class="cards vida">
        <div class="card">
            <h4>Seu holerite</h4>
            ${linha('Cargo', h.cargo)}
            ${linha('Salário bruto', fmtBRL(h.bruto))}
            ${estado.indicePrecos > 1.05 ? `<div class="linha"><span>Equivale a, em reais de hoje</span><b class="num">${fmtBRL(h.bruto / estado.indicePrecos)}</b></div>` : ''}
            ${linha('INSS', '− ' + fmtBRL(h.inss))}
            ${linha('Imposto de Renda', h.irrf ? '− ' + fmtBRL(h.irrf) : 'Isento')}
            ${linha('Salário líquido', fmtBRL(h.liquido))}
            ${linha('Custo de vida', '− ' + fmtBRL(h.custo))}
            ${h.economia > 0 ? `<p class="dica" style="margin:0">Já descontados ${fmtBRL(h.economia)} que você economiza por ter casa própria ou carro.</p>` : ''}
            ${h.bens > 0 ? linha('Parcelas, IPTU e manutenção', '− ' + fmtBRL(h.bens)) : ''}
            ${h.alugueis > 0 ? linha('Aluguéis recebidos', '+ ' + fmtBRL(h.alugueis), 'sobe') : ''}
            <div class="linha total"><span>Sobra para investir</span><b class="num ${classe(h.sobra)}">${fmtBRL(h.sobra)}</b></div>
            <p class="dica">${h.sobra < 0
                ? 'Você gasta mais do que ganha. O que faltar sai do saldo, e saldo negativo paga 8% de juros ao mês.'
                : 'Cai no seu saldo no primeiro dia útil de cada mês. Em dezembro vem também o 13º.'}</p>
        </div>
        <div class="card">
            <h4>${trilha.nome}</h4>
            <ul class="escada">${escada}</ul>
            <hr class="separador">
            ${promocao}
            <button class="link-botao" data-vida="trocar">Trocar de carreira</button>
        </div>
        ${cardFelicidade}
        <div class="card">
            <h4>Padrão de vida</h4>
            ${padroes}
            <p class="dica">A escolha é sua e o custo vale a partir do próximo salário. Subir um nível deixa você mais feliz na hora; descer deixa mais triste. A inflação encarece todos os níveis com o tempo.</p>
        </div>
        <div class="card">
            <h4>Independência financeira</h4>
            ${linha('Renda dos investimentos', fmtBRL(renda) + ' por mês')}
            ${linha('Seus gastos', fmtBRL(gastos) + ' por mês')}
            <div class="meta"><div style="width:${Math.min(100, cobertura * 100)}%"></div></div>
            <p class="${independente ? 'sobe' : ''}"><b>${independente
                ? 'Você é financeiramente independente neste padrão de vida!'
                : `Seus investimentos cobrem ${fmtPct(cobertura, false)} do seu custo de vida.`}</b></p>
            <p class="dica">Conta os dividendos e aluguéis da sua carteira e os juros da renda fixa que passam da inflação. Quando chegar a 100%, você poderia viver só dos investimentos.</p>
        </div>
    </div>`;
}

function acaoVida(acao, valor) {
    switch (acao) {
        case 'trilha': escolherCarreira(valor); break;
        case 'promover': promover(); break;
        case 'padrao': mudarPadraoVida(+valor); break;
        case 'trocar': trocandoCarreira = true; renderAba(); break;
        case 'cancelar': trocandoCarreira = false; renderAba(); break;
    }
}

function renderFonte() {
    document.getElementById('fonte').innerHTML =
        `Selic ${fmtPct(mercado.selic, false)} e IPCA ${fmtPct(mercado.ipca12m, false)} em 12 meses: ${mercado.fonte}. ` +
        `No jogo, hoje: Selic ${fmtPct(selic(), false)} e IPCA ${fmtPct(ipca(), false)}.<br>` +
        'Preços iniciais e taxas dos bancos são aproximados. As notícias são inventadas pelo jogo e mexem nos preços simulados. É um jogo: o dinheiro é de mentira!';
}

function renderTudo() {
    renderTopo();
    renderTicker();
    renderWatchlist();
    renderDetalhe();
    renderBoleta();
    renderAba();
    renderFonte();
    atualizarContagem();
}

function renderAoVivo() {
    renderTopo();
    renderTicker();
    renderWatchlist();
    renderDetalhe();
    renderBoleta();
    if (aba !== 'aprenda') renderAba();
}

/* ---------- Mensagens ---------- */
let timerToast;
function mostrarToast(html, tipo = '', duracao = 5000) {
    const t = document.getElementById('toast');
    t.innerHTML = html;
    t.className = `toast visivel ${tipo}`;
    clearTimeout(timerToast);
    timerToast = setTimeout(() => t.classList.remove('visivel'), duracao);
}

/* ---------- Salvar ---------- */
function novoEstado() {
    limparListadas();
    estado = {
        versao: 3,
        dia: 0,
        inicio: new Date().toISOString().slice(0, 10),
        caixa: CAPITAL_INICIAL,
        hist: {},
        acoes: {},
        lotes: [],
        extrato: [],
        patrimonio: [CAPITAL_INICIAL],
        vendasMes: { mes: '', total: 0 },
        selecionado: 'PETR4',
        velocidade: 0, // o tempo só começa a andar depois de escolher a profissão
        ultimoTick: Date.now(),
        acumulado: 0
    };
    VARIAVEIS.forEach(id => (estado.hist[id] = historicoInicial(id)));
    completarEstado();
    registrar('Você ganhou dinheiro de mentira para começar a investir!', CAPITAL_INICIAL);
    calcularVencimentos();
}

// Acrescenta o que veio depois (notícias, resultados, carreira) sem perder um jogo já começado.
function completarEstado() {
    VARIAVEIS.forEach(id => {
        if (!estado.hist[id]) estado.hist[id] = historicoInicial(id);
    });
    const hoje = dataDoDia(estado.dia);
    const padrao = {
        proventos: 0, efeitos: [], noticias: [], naoLidas: 0, usados: [],
        ajusteSelic: 0, ajusteIpca: 0, baseSelic: null, baseIpca: null, rumores: [], proximoCopom: 0, governo: null, premioFiscal: 0, pesquisa: 0, tendenciaEleitoral: 0, campanha: false, anoEleicao: 0, proximaEleicao: 0, mercadoFechado: null, sombra: {}, antesCrise: {}, fund: {}, proximaNoticia: estado.dia + 3,
        felicidade: FELICIDADE_INICIAL, bonusPadraoMes: 0, alegriaInvestMes: 0,
        carreira: null, padraoVida: 0, salarioMinimo: SALARIO_MINIMO_INICIAL, indicePrecos: 1, fatorIR: 1, rolagem: {},
        bens: [], proximoBem: 1, indiceImoveis: 1, anoIPVA: 0,
        empresas: [], proximoEmp: 1, ofertasEmpresas: null, conjuntura: 0,
        mesFechamento: chaveMes(hoje), anoReajuste: hoje.getFullYear(),
        totalAportado: CAPITAL_INICIAL, investidoHist: estado.patrimonio.map(() => CAPITAL_INICIAL)
    };
    for (const k in padrao) if (estado[k] == null) estado[k] = padrao[k];
    if (estado.padraoMes == null) estado.padraoMes = estado.padraoVida;
    if (!estado.proximoCopom) agendarCopom(20);
    if (!estado.proximaEleicao) agendarEleicao();
    if (!estado.ofertasEmpresas) gerarOfertasEmpresas();
    ACOES.forEach(id => {
        if (!estado.fund[id]) estado.fund[id] = { lpa: preco(id) / PERFIL[id].pl, ultimo: null };
    });
}

// O jogo salvo precisa ser pequeno: o navegador do celular guarda poucos megabytes por site, e um
// salvamento que não cabe falha. Por isso o histórico de preços vai só com os fechamentos (5 algarismos),
// e as velas são remontadas ao carregar (os pavios mudam um pouco, o resto fica igual).
const MAX_PRECOS_NOTICIA = 15;
function compactar() {
    const copia = { ...estado, histCompacto: true, hist: {} };
    for (const id in estado.hist) copia.hist[id] = estado.hist[id].map(v => Number(v.c.toPrecision(5)));
    copia.patrimonio = estado.patrimonio.map(Math.round);
    copia.investidoHist = estado.investidoHist.map(Math.round);
    copia.noticias = estado.noticias.map(n => {
        if (n.tabela) return n;
        const ids = Object.keys(n.precos || {});
        if (ids.length <= MAX_PRECOS_NOTICIA) return n;
        const precos = {};
        ids.slice(0, MAX_PRECOS_NOTICIA).forEach(id => (precos[id] = n.precos[id]));
        return { ...n, precos };
    });
    return copia;
}

function expandirHist(id, fechamentos) {
    const s = (ATIVOS[id] ? ATIVOS[id].vol : 0.3) / Math.sqrt(DIAS_ANO);
    return fechamentos.map((c, i) => {
        const o = i ? fechamentos[i - 1] : c;
        const pavio = Math.abs(normal()) * s * 0.5;
        return { o, c, h: Math.max(o, c) * (1 + pavio), l: Math.min(o, c) * (1 - pavio) };
    });
}

const textoSalvo = () => JSON.stringify(compactar(), (k, v) => (typeof v === 'number' && k !== 'ultimoTick' ? Math.round(v * 10000) / 10000 : v));

let ultimoSalvo = 0;
let falhaAvisada = false;
function salvar() {
    ultimoSalvo = Date.now();
    try {
        localStorage.setItem(CHAVE_SALVO, textoSalvo());
        falhaAvisada = false;
    } catch (e) {
        // Antes este erro era engolido em silêncio e o jogo podia ficar horas sem salvar.
        if (falhaAvisada) return;
        falhaAvisada = true;
        mostrarToast('<b>Não consegui salvar o jogo neste aparelho.</b> O armazenamento do navegador pode estar cheio ou bloqueado. Use "Baixar cópia do jogo", no fim da página, para não perder o progresso.', 'erro', 15000);
    }
}

// Transforma um jogo salvo (do navegador ou de um arquivo de cópia) no jogo atual. Devolve false se não for um jogo válido.
function usarJogoSalvo(salvo) {
    if (!salvo || salvo.versao !== 3 || !salvo.hist) return false;
    limparListadas();
    estado = salvo;
    if (estado.histCompacto) {
        for (const id in estado.hist) estado.hist[id] = expandirHist(id, estado.hist[id]);
        delete estado.histCompacto;
    }
    (estado.empresas || []).filter(e => e.listada).forEach(registrarListada);
    completarEstado();
    calcularVencimentos();
    return true;
}

function carregar() {
    try {
        if (usarJogoSalvo(JSON.parse(localStorage.getItem(CHAVE_SALVO)))) return;
    } catch (e) { /* sem jogo salvo */ }
    novoEstado();
}

// Cópia de segurança num arquivo: protege o progresso e permite levar o jogo do computador para o celular.
function baixarCopia() {
    salvar();
    const blob = new Blob([textoSalvo()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `minibroker-${dataDoDia(estado.dia).toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    mostrarToast('Cópia do jogo baixada. Guarde o arquivo: com ele você recupera o jogo aqui ou em outro aparelho.', 'ok', 8000);
}

function carregarCopia(arquivo) {
    const leitor = new FileReader();
    leitor.onload = () => {
        let salvo = null;
        try { salvo = JSON.parse(leitor.result); } catch (e) { /* arquivo inválido */ }
        if (!salvo || salvo.versao !== 3 || !salvo.hist) return mostrarToast('Esse arquivo não é uma cópia do MiniBroker.', 'erro');
        if (!confirm('Trocar o jogo atual pelo da cópia? O progresso que não estiver na cópia será perdido.')) return;
        usarJogoSalvo(salvo);
        estado.ultimoTick = Date.now();
        estado.acumulado = 0;
        trocandoCarreira = false;
        compraEmCurso = null;
        ipoEmCurso = null;
        salvar();
        renderTudo();
        irPara(estado.carreira ? 'mercado' : 'vida');
        mostrarToast(`Jogo carregado: ${dataDoDia(estado.dia).toLocaleDateString('pt-BR')}, patrimônio de ${fmtBRL(patrimonioAtual())}.`, 'ok', 8000);
    };
    leitor.readAsText(arquivo);
}

// Séries do Banco Central (SGS): 432 = meta Selic; 13522 = IPCA acumulado em 12 meses.
async function buscarTaxasBancoCentral() {
    const buscar = async serie => {
        const r = await fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.${serie}/dados/ultimos/1?formato=json`);
        const [dado] = await r.json();
        return { valor: parseFloat(dado.valor) / 100, data: dado.data };
    };
    try {
        const [selic, ipca] = await Promise.all([buscar(432), buscar(13522)]);
        mercado.selic = selic.valor;
        mercado.ipca12m = ipca.valor;
        mercado.fonte = `Banco Central do Brasil (${selic.data})`;
        renderTudo();
    } catch (e) {
        console.warn('Sem acesso às taxas do Banco Central:', e);
    }
}

/* ---------- Eventos ---------- */
function selecionar(id) {
    estado.selecionado = id;
    ladoBoleta = 'compra';
    hoverPrincipal = null;
    salvar();
    renderWatchlist();
    renderDetalhe();
    renderBoleta();
    if (celular() && tela !== 'ativo') irPara('ativo');
    else window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------- Celular: uma tela por vez ---------- */
const celular = () => window.matchMedia('(max-width: 760px)').matches;

function irPara(t) {
    tela = t;
    if (t === 'carteira' || t === 'vida') aba = t;
    else if (t === 'mais' && (aba === 'carteira' || aba === 'vida')) aba = 'noticias';
    document.body.dataset.tela = t;
    document.querySelectorAll('#navCelular button').forEach(b => b.classList.toggle('ativo', b.dataset.tela === t));
    hoverPrincipal = null;
    hoverPatrimonio = null;
    renderAba();
    // Um gráfico escondido não tem tamanho: desenha de novo agora que ele aparece.
    desenharPrincipal();
    window.scrollTo(0, 0);
}

document.getElementById('navCelular').addEventListener('click', e => {
    const b = e.target.closest('button[data-tela]');
    if (b) irPara(b.dataset.tela);
});

document.getElementById('kpiMais').addEventListener('click', e => {
    const aberto = document.querySelector('.topbar').classList.toggle('aberto');
    e.currentTarget.setAttribute('aria-expanded', aberto);
    e.currentTarget.innerHTML = aberto ? '<span>Mostrar menos</span>Fechar ▴' : '<span>Profissão, Selic</span>Ver mais ▾';
});

document.querySelector('.tempo').addEventListener('click', e => {
    const b = e.target.closest('button[data-dias]');
    if (b) avancar(+b.dataset.dias);
});

document.getElementById('velocidade').addEventListener('change', e => {
    if (!estado.carreira) {
        e.target.value = '0';
        return pedirCarreira();
    }
    relogio();
    estado.velocidade = +e.target.value;
    estado.acumulado = 0;
    estado.ultimoTick = Date.now();
    salvar();
    atualizarContagem();
    mostrarToast(estado.velocidade ? `Tempo em ${estado.velocidade}x: um dia útil a cada ${fmtNum(segundosPorDia()).replace(',00', '')} segundos.` : 'Tempo pausado. Nada muda até você soltar o tempo de novo.');
});

document.getElementById('watchlist').addEventListener('click', e => {
    const b = e.target.closest('[data-id]');
    if (b) selecionar(b.dataset.id);
});

document.getElementById('busca').addEventListener('input', e => {
    busca = e.target.value;
    renderWatchlist();
});

document.getElementById('filtros').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    filtro = b.dataset.f;
    renderWatchlist();
});

document.getElementById('periodos').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    periodo = +b.dataset.n;
    hoverPrincipal = null;
    renderDetalhe();
});

document.getElementById('modos').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    modo = b.dataset.modo;
    hoverPrincipal = null;
    renderDetalhe();
});

const grafico = document.getElementById('grafico');
// Eventos de ponteiro: funcionam com o mouse e também com o dedo no celular.
['pointermove', 'pointerdown'].forEach(ev => grafico.addEventListener(ev, e => {
    if (!grafico._indice) return;
    hoverPrincipal = grafico._indice(e.clientX);
    desenharPrincipal();
}));
grafico.addEventListener('pointerleave', () => {
    hoverPrincipal = null;
    desenharPrincipal();
});

const areaAba = document.getElementById('aba');
['pointermove', 'pointerdown'].forEach(ev => areaAba.addEventListener(ev, e => {
    const c = e.target.closest('#graficoPatrimonio');
    if (!c || !c._indice) return;
    hoverPatrimonio = c._indice(e.clientX);
    desenharPatrimonio();
}));
areaAba.addEventListener('pointerleave', () => {
    hoverPatrimonio = null;
    desenharPatrimonio();
});
areaAba.addEventListener('click', e => {
    const emp = e.target.closest('[data-emp]');
    if (emp) return acaoEmpresas(emp.dataset.emp, emp.dataset.valor);
    const bens = e.target.closest('[data-bens]');
    if (bens) return acaoBens(bens.dataset.bens, bens.dataset.valor);
    const vida = e.target.closest('[data-vida]');
    if (vida) return acaoVida(vida.dataset.vida, vida.dataset.valor);
    const alvo = e.target.closest('[data-id]');
    if (alvo) selecionar(alvo.dataset.id);
});

document.getElementById('dNoticias').addEventListener('click', e => {
    const alvo = e.target.closest('[data-id]');
    if (alvo && alvo.dataset.id !== estado.selecionado) selecionar(alvo.dataset.id);
});

document.getElementById('proventos').addEventListener('click', resgatarProventos);

document.getElementById('toast').addEventListener('click', e => {
    if (!e.currentTarget.classList.contains('noticia')) return;
    aba = 'noticias';
    renderAba();
    e.currentTarget.classList.remove('visivel');
    if (celular()) irPara('mais');
    else document.getElementById('tabs').scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('tabs').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    aba = b.dataset.aba;
    hoverPatrimonio = null;
    renderAba();
});

const boleta = document.getElementById('boleta');
boleta.addEventListener('input', atualizarTotaisBoleta);
boleta.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    const id = estado.selecionado;
    if (b.dataset.lado) {
        ladoBoleta = b.dataset.lado;
        renderBoleta();
        return;
    }
    const qtdInput = document.getElementById('bQtd');
    const valorInput = document.getElementById('bValor');
    const qtd = () => Math.floor(parseFloat(qtdInput.value) || 0);
    switch (b.dataset.acao) {
        case 'menos': qtdInput.value = Math.max(1, qtd() - 1); break;
        case 'mais': qtdInput.value = qtd() + 1; break;
        case 'qtd': qtdInput.value = b.dataset.q; break;
        case 'max':
            qtdInput.value = ladoBoleta === 'compra'
                ? Math.max(1, Math.floor(estado.caixa / preco(id)))
                : (estado.acoes[id] ? estado.acoes[id].qtd : 1);
            break;
        case 'enviar': ladoBoleta === 'compra' ? comprarAcao(id, qtd()) : venderAcao(id, qtd()); return;
        case 'valor': valorInput.value = b.dataset.v; break;
        case 'tudo': valorInput.value = Math.floor(estado.caixa * 100) / 100; break;
        case 'aplicar': aplicar(id, Math.round((parseFloat(valorInput.value) || 0) * 100) / 100); return;
        case 'resgatar': resgatar(id); return;
    }
    atualizarTotaisBoleta();
});

document.getElementById('reiniciar').addEventListener('click', () => {
    if (!confirm('Recomeçar o jogo do zero? Sua carteira e seu histórico serão apagados.')) return;
    novoEstado();
    trocandoCarreira = false;
    compraEmCurso = null;
    ipoEmCurso = null;
    aba = 'vida';
    salvar();
    renderTudo();
    irPara('vida');
    mostrarToast(`Jogo novo! Você tem ${fmtBRL(CAPITAL_INICIAL)} para investir. Escolha uma profissão para começar.`, 'ok');
});

let timerResize;
window.addEventListener('resize', () => {
    clearTimeout(timerResize);
    timerResize = setTimeout(() => {
        desenharPrincipal();
        if (aba === 'patrimonio') desenharPatrimonio();
    }, 100);
});

document.getElementById('baixarCopia').addEventListener('click', baixarCopia);
document.getElementById('carregarCopia').addEventListener('click', () => document.getElementById('arquivoCopia').click());
document.getElementById('arquivoCopia').addEventListener('change', e => {
    if (e.target.files[0]) carregarCopia(e.target.files[0]);
    e.target.value = '';
});

// No celular o sistema pode congelar ou fechar o app quando ele vai para segundo plano: salva antes.
window.addEventListener('pagehide', salvar);
document.addEventListener('freeze', salvar);
document.addEventListener('visibilitychange', () => {
    if (document.hidden) salvar();
});
// Pede ao navegador para não apagar os dados do jogo quando o aparelho estiver com pouco espaço.
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

carregar();
estado.ultimoTick = Date.now();
if (!estado.carreira) aba = 'vida';
salvar();
renderTudo();
irPara(estado.carreira ? 'mercado' : 'vida');
if (!estado.carreira) mostrarToast('Bem-vindo! Escolha uma profissão para o jogo começar.', '', 8000);
setInterval(tique, 1000);
buscarTaxasBancoCentral();
