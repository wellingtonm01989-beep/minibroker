const CAPITAL_INICIAL = 1000;
const DIAS_ANO = 252;
const DIAS_MES = 21;
const MAX_HISTORICO = 504;
const MAX_PATRIMONIO = 2520;
const CHAVE_SALVO = 'minibroker-v2';
const APORTE_INICIAL = 250;
const VELOCIDADE_PADRAO = 1800; // segundos reais para passar 15 dias corridos no jogo
const DIAS_UTEIS_POR_CICLO = 15 * DIAS_ANO / 365;

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
    pre: 'Você empresta para o governo e já sabe no primeiro dia quanto vai ganhar por ano. A taxa fica travada no dia em que você aplica, mesmo se os juros do país mudarem depois.',
    ipca: 'Inflação é quando as coisas ficam mais caras. Este título rende a inflação MAIS uma taxa, então seu dinheiro sempre compra mais coisas no futuro do que compra hoje.',
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
const VARIAVEIS = ORDEM.filter(id => !ehFixa(id));
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
const selic = () => limitar(mercado.selic + (estado ? estado.ajusteSelic : 0), 0.02, 0.25);
const ipca = () => limitar(mercado.ipca12m + (estado ? estado.ajusteIpca : 0), -0.01, 0.15);
const mensalPoupanca = () => (selic() > 0.085 ? 0.005 : 0.7 * selic() / 12);
const cdi = () => selic() - 0.001;

function taxaTravada(id) {
    const a = ATIVOS[id];
    return a.idx === 'pre' ? mercado.prefixado + estado.ajusteSelic * 0.8 + a.spread : mercado.ipcaReal + a.spread;
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

// IOF (aproximado da tabela regressiva) e IR pela tabela regressiva real da renda fixa.
function calcularResgate(lote) {
    const rendimento = Math.max(0, lote.valor - lote.aplicado);
    if (ATIVOS[lote.ativo].isento) return { bruto: lote.valor, iof: 0, ir: 0, liquido: lote.valor };
    const corridos = Math.round(lote.dias * 365 / DIAS_ANO);
    const iof = corridos < 30 ? rendimento * (30 - corridos) / 30 : 0;
    const aliquota = corridos <= 180 ? 0.225 : corridos <= 360 ? 0.20 : corridos <= 720 ? 0.175 : 0.15;
    const ir = (rendimento - iof) * aliquota;
    return { bruto: lote.valor, iof, ir, liquido: lote.valor - iof - ir };
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
    const s = a.vol / Math.sqrt(DIAS_ANO);
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
    for (const lote of estado.lotes) total += lote.valor;
    return total;
}

function registrar(texto, valor) {
    estado.extrato.unshift({ dia: estado.dia, texto, valor });
    if (estado.extrato.length > 300) estado.extrato.pop();
}

// aoVivo = o app está aberto e sendo usado. Notícias e resultados só acontecem nesse caso.
function passarDia(aoVivo) {
    estado.dia++;
    const dia = estado.dia;

    const extra = {};
    for (const ef of estado.efeitos) {
        extra[ef.id] = (extra[ef.id] || 0) + ef.drift;
        ef.dias--;
    }
    estado.efeitos = estado.efeitos.filter(ef => ef.dias > 0);

    for (const id of VARIAVEIS) {
        const h = estado.hist[id];
        h.push(proximaVela(ATIVOS[id], h[h.length - 1].c, extra[id] || 0));
        if (h.length > MAX_HISTORICO) h.shift();
    }

    if (dia % 63 === 0) {
        if (aoVivo) temporadaResultados();
        else ACOES.forEach(id => (estado.fund[id].lpa *= 1 + CRESCIMENTO_LUCRO / 4));
    }
    if (dia >= estado.proximaNoticia) {
        if (aoVivo) gerarNoticia();
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

    const vencidos = estado.lotes.filter(l => vencido(l.ativo));
    for (const lote of vencidos) {
        const r = calcularResgate(lote);
        estado.caixa += r.liquido;
        registrar(`${ATIVOS[lote.ativo].nome} venceu! O governo devolveu seu dinheiro com juros.`, r.liquido);
    }
    if (vencidos.length) estado.lotes = estado.lotes.filter(l => !vencidos.includes(l));

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

    verificarAporte();

    estado.patrimonio.push(patrimonioAtual());
    estado.investidoHist.push(estado.totalAportado);
    if (estado.patrimonio.length > MAX_PATRIMONIO) {
        estado.patrimonio.shift();
        estado.investidoHist.shift();
    }
}

function avancar(dias) {
    const antes = patrimonioAtual();
    const precosAntes = {};
    VARIAVEIS.forEach(id => (precosAntes[id] = preco(id)));
    const noticiasAntes = estado.noticias.length;
    const aportadoAntes = estado.totalAportado;

    for (let i = 0; i < dias; i++) passarDia(true);

    const novasNoticias = Math.max(0, estado.noticias.length - noticiasAntes);
    const depois = patrimonioAtual();
    let destaque = null;
    for (const id in precosAntes) {
        const v = preco(id) / precosAntes[id] - 1;
        if (!destaque || Math.abs(v) > Math.abs(destaque.v)) destaque = { id, v };
    }
    const rotulo = dias === 1 ? 'Passou 1 dia' : dias === DIAS_MES ? 'Passou 1 mês' : 'Passou 1 ano';
    const dif = depois - antes;
    mostrarToast(
        `<b>${rotulo}.</b> Seu patrimônio foi de ${fmtBRL(antes)} para <b class="${classe(dif)}">${fmtBRL(depois)}</b>` +
        ` (${dif >= 0 ? '+' : ''}${fmtBRL(dif)}).<br>Quem mais se mexeu: <b>${destaque.id}</b> <span class="${classe(destaque.v)}">${fmtPct(destaque.v)}</span>` +
        (estado.totalAportado > aportadoAntes ? `<br>Chegaram <b class="sobe">${fmtBRL(estado.totalAportado - aportadoAntes)}</b> de aportes mensais no seu saldo.` : '') +
        (novasNoticias ? `<br>Saíram <b>${novasNoticias} notícia${novasNoticias > 1 ? 's' : ''}</b>: veja na aba Notícias.` : ''),
        dif >= 0 ? 'ok' : 'erro',
        8000
    );
    salvar();
    renderTudo();
}

/* ---------- Relógio em tempo real ---------- */
const segundosPorDia = () => estado.velocidade / DIAS_UTEIS_POR_CICLO;

// Um salto de mais de 1 minuto significa que o app estava fechado ou o computador dormiu: aí não há notícias.
function relogio(aoVivo) {
    const agora = Date.now();
    if (!estado.velocidade) {
        estado.ultimoTick = agora;
        return 0;
    }
    if (agora - estado.ultimoTick > 60000) aoVivo = false;
    estado.acumulado += (agora - estado.ultimoTick) / 1000;
    estado.ultimoTick = agora;
    const spd = segundosPorDia();
    let dias = 0;
    while (estado.acumulado >= spd && dias < DIAS_ANO) {
        passarDia(aoVivo);
        estado.acumulado -= spd;
        dias++;
    }
    if (estado.acumulado >= spd) estado.acumulado = 0;
    return dias;
}

function atualizarContagem() {
    const texto = document.getElementById('contagem');
    const barra = document.getElementById('progresso');
    if (!estado.velocidade) {
        texto.textContent = 'O mercado está parado';
        barra.style.width = '0';
        return;
    }
    const spd = segundosPorDia();
    const passou = estado.acumulado + (Date.now() - estado.ultimoTick) / 1000;
    const faltam = Math.max(0, Math.ceil(spd - passou));
    texto.textContent = `Próximo dia em ${Math.floor(faltam / 60)}:${String(faltam % 60).padStart(2, '0')}`;
    barra.style.width = Math.min(100, (passou / spd) * 100) + '%';
}

function tique() {
    const topoExtrato = estado.extrato[0];
    const topoNoticias = estado.noticias[0];
    const dias = relogio(true);
    if (dias) {
        salvar();
        renderAoVivo();
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
                    .map(e => (e.valor ? `${e.texto} <b class="sobe">+${fmtBRL(e.valor)}</b>` : e.texto))
                    .join('<br>'), 'ok', 8000);
            }
        }
    }
    atualizarContagem();
}

/* ---------- Notícias e resultados ---------- */
const ROTULO_NOTICIA = { empresa: 'Empresa', setor: 'Setor', economia: 'Economia', resultado: 'Resultados' };
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
function aplicarImpacto(id, total, duracao) {
    const forca = total * (0.5 + Math.random());
    const salto = forca * Math.random() * 0.6;
    let resto = forca - salto;
    if (Math.random() < 0.15) resto = -resto * 0.6;
    const hoje = estado.hist[id][estado.hist[id].length - 1];
    hoje.c *= 1 + salto;
    hoje.h = Math.max(hoje.h, hoje.c);
    hoje.l = Math.min(hoje.l, hoje.c);
    estado.efeitos.push({ id, drift: Math.log(1 + resto) / duracao, dias: duracao });
}

function preencher(texto, id) {
    return texto.replace(/\{empresa\}/g, ATIVOS[id].nome).replace(/\{n\}/g, 10 + Math.floor(Math.random() * 31));
}

function gerarNoticia() {
    const deEmpresa = Math.random() < 0.45;
    const grupo = MODELOS.filter(m => !!m.alvo === deEmpresa && (!m.cond || m.cond()));
    const novos = grupo.filter(m => !estado.usados.includes(m.n));
    const m = sorteio(novos.length ? novos : grupo);
    estado.usados.push(m.n);
    if (estado.usados.length > 80) estado.usados.shift();

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
            if (Math.abs(total) >= 0.01) impactos[id] = total;
        }
        if (m.selic) estado.ajusteSelic += m.selic;
        if (m.ipca) estado.ajusteIpca += m.ipca;
        porque = porque || 'As empresas ligadas a esse assunto costumam sentir o efeito.';
    }

    const ids = Object.keys(impactos).sort((a, b) => Math.abs(impactos[b]) - Math.abs(impactos[a]));
    const precos = {};
    for (const id of ids) {
        aplicarImpacto(id, impactos[id], 10 + Math.floor(Math.random() * 20));
        precos[id] = preco(id);
    }
    const tipo = m.alvo ? 'empresa' : m.n >= INICIO_ECONOMIA ? 'economia' : 'setor';
    registrarNoticia({ tipo, titulo, porque, precos, juros: !m.alvo && ('juros' in m.e || m.selic != null || !!m.ipca) });
}

function temporadaResultados() {
    const linhas = ACOES.map(id => {
        const esperado = CRESCIMENTO_LUCRO + normal() * 0.05;
        const real = esperado + normal() * ATIVOS[id].vol * 0.5;
        estado.fund[id].lpa *= 1 + real / 4;
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
    if (estado.noticias.length > 200) estado.noticias.pop();
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
    const custo = qtd * preco(id);
    if (!(qtd >= 1)) return mostrarToast('Escolha pelo menos 1.', 'erro');
    if (custo > estado.caixa + 1e-9) return mostrarToast(`Saldo insuficiente. Você tem ${fmtBRL(estado.caixa)} e precisa de ${fmtBRL(custo)}.`, 'erro');
    const pos = estado.acoes[id] || { qtd: 0, pm: 0 };
    pos.pm = (pos.pm * pos.qtd + custo) / (pos.qtd + qtd);
    pos.qtd += qtd;
    estado.acoes[id] = pos;
    estado.caixa -= custo;
    registrar(`Compra de ${qtd} ${id} a ${fmtBRL(preco(id))}`, -custo);
    mostrarToast(ATIVOS[id].tipo === 'acao'
        ? `Você comprou <b>${qtd} ${id}</b> por ${fmtBRL(custo)}. Agora você é sócio da ${ATIVOS[id].nome}!`
        : `Você comprou <b>${qtd} cotas de ${id}</b> por ${fmtBRL(custo)}.`, 'ok');
    concluirOperacao();
}

function previaVenda(id, qtd) {
    const pos = estado.acoes[id];
    const valor = qtd * preco(id);
    const lucro = (preco(id) - pos.pm) * qtd;
    const mes = Math.floor(estado.dia / DIAS_MES);
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
    mostrarToast(`Você aplicou <b>${fmtBRL(valor)}</b> em ${a.nome}. Agora é só esperar o tempo passar!`, 'ok');
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

/* ---------- Aporte mensal ---------- */
// Regra real do salário mínimo: inflação (INPC, aqui o IPCA do jogo) + crescimento do PIB,
// com ganho real limitado entre 0,6% e 2,5% ao ano.
function reajustarAporte(ano) {
    const inflacao = Math.max(0, ipca());
    const ganhoReal = limitar(0.02 + normal() * 0.01, 0.006, 0.025);
    const reajuste = (1 + inflacao) * (1 + ganhoReal) - 1;
    const antes = estado.aporte;
    estado.aporte = Math.round(estado.aporte * (1 + reajuste) * 100) / 100;
    estado.anoReajuste = ano;
    registrar(`Salário mínimo reajustado em ${fmtPct(reajuste, false)} (inflação ${fmtPct(inflacao, false)} + ganho real ${fmtPct(ganhoReal, false)}). Seu aporte foi de ${fmtBRL(antes)} para ${fmtBRL(estado.aporte)}`, 0);
}

function verificarAporte() {
    const hoje = dataDoDia(estado.dia);
    const chave = chaveMes(hoje);
    if (chave === estado.mesAporte) return;
    estado.mesAporte = chave;
    if (hoje.getMonth() === 0 && estado.anoReajuste !== hoje.getFullYear()) reajustarAporte(hoje.getFullYear());
    const dezembro = hoje.getMonth() === 11;
    const valor = estado.aporte * (dezembro ? 2 : 1);
    estado.caixa += valor;
    estado.totalAportado += valor;
    registrar(dezembro
        ? 'Aporte de dezembro em dobro (13º)! Hora de investir o que sobrou.'
        : 'Aporte do mês: o que sobrou do salário chegou para investir!', valor);
}

function proximoAporte() {
    let n = estado.dia + 1;
    while (chaveMes(dataDoDia(n)) === estado.mesAporte) n++;
    const data = dataDoDia(n);
    const reajuste = data.getMonth() === 0 && estado.anoReajuste !== data.getFullYear();
    return { data, valor: estado.aporte * (data.getMonth() === 11 ? 2 : 1), reajuste };
}

function calcularVencimentos() {
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
        rotuloBase: 'Dinheiro que você colocou',
        hover: hoverPatrimonio,
        formatar: v => 'R$ ' + fmtNum(v),
        rotulo: i => fmtData(dataDoDia(ultimoDia - (serie.length - 1 - i)))
    });
}

/* ---------- Telas ---------- */
function renderTopo() {
    const total = patrimonioAtual();
    const res = total / estado.totalAportado - 1;
    document.getElementById('kData').textContent = dataDoDia(estado.dia).toLocaleDateString('pt-BR');
    document.getElementById('kCaixa').textContent = fmtBRL(estado.caixa);
    document.getElementById('kPatrimonio').textContent = fmtBRL(total);
    const k = document.getElementById('kResultado');
    k.textContent = `${fmtBRL(total - estado.totalAportado)} (${fmtPct(res)})`;
    k.className = 'num ' + classe(res);
    document.getElementById('velocidade').value = String(estado.velocidade);

    const p = proximoAporte();
    document.getElementById('kAporte').textContent =
        `${fmtBRL(p.valor)}${p.reajuste ? ' + reajuste' : ''} em ${p.data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;

    const botao = document.getElementById('proventos');
    botao.disabled = estado.proventos < 0.005;
    botao.innerHTML = `<span>Dividendos a receber</span><strong class="num">${fmtBRL(estado.proventos)}</strong>`;
    renderSelo();
}

function renderSelo() {
    const selo = document.getElementById('seloNoticias');
    selo.textContent = estado.naoLidas > 99 ? '99+' : estado.naoLidas;
    selo.style.display = estado.naoLidas ? 'inline-block' : 'none';
}

function renderTicker() {
    const ultima = estado.noticias[0];
    const itens = [
        ultima ? `<span class="ticker-item"><b class="amarelo">ÚLTIMA NOTÍCIA</b>${ultima.titulo}</span>` : '',
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
            : `<p class="vazio">Nenhuma notícia ainda. Elas saem com o app aberto, mais ou menos uma por hora.</p>`);

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
        let carencia = '';
        if (presos.length) {
            const falta = Math.min(...presos.map(l => a.carencia - l.dias));
            carencia = `<p class="dica">${fmtBRL(somarResgates(presos).bruto)} ainda estão na carência. O próximo pedaço fica livre em ${dataDoDia(estado.dia + falta).toLocaleDateString('pt-BR')}.</p>`;
        }
        posicao = `
            <div class="linha"><span>Você aplicou</span><b class="num">${fmtBRL(t.aplicado)}</b></div>
            <div class="linha"><span>Valor hoje</span><b class="num sobe">${fmtBRL(t.bruto)}</b></div>
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
    if (aba === 'patrimonio') {
        el.innerHTML = `<p class="dica" style="margin:0 0 10px">A linha tracejada é todo o dinheiro que você colocou (os R$ 1.000 do começo mais os aportes mensais). A distância entre as duas linhas é o que seus investimentos ganharam ou perderam.</p><canvas id="graficoPatrimonio"></canvas>`;
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
            : '<p class="vazio">Ainda não saiu nenhuma notícia. Elas aparecem com o app aberto, mais ou menos uma por hora (uma por mês no jogo). Os resultados das empresas saem a cada 3 meses do jogo.</p>';
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
        return `<p class="vazio">Você ainda não investiu. Escolha um ativo na lista da esquerda e use a boleta para comprar ou aplicar. O tempo passa sozinho: a cada 30 minutos, passam 15 dias no jogo. Se quiser ver mais rápido, use os botões <b>Avançar</b> lá em cima!</p>`;
    }
    const total = patrimonioAtual();
    const cor = i => (i === linhas.length ? '#3a4255' : CORES_CARTEIRA[i % CORES_CARTEIRA.length]);
    const fatias = [...linhas.map(l => ({ nome: l.nome, valor: l.valor })), { nome: 'Saldo em dinheiro', valor: estado.caixa }];
    const barra = fatias.map((f, i) => `<div style="width:${(f.valor / total) * 100}%;background:${cor(i)}"></div>`).join('');
    const legenda = fatias.map((f, i) => `<span><i style="background:${cor(i)}"></i>${f.nome} ${fmtPct(f.valor / total, false)}</span>`).join('');
    return `<div class="legenda">${legenda}</div><div class="barra-alocacao">${barra}</div>
    <table>
        <thead><tr><th>Ativo</th><th>Quantidade</th><th>Preço médio</th><th>Preço atual</th><th>Investido</th><th>Valor atual</th><th>Resultado</th></tr></thead>
        <tbody>${linhas.map(l => {
            const res = l.valor - l.investido;
            return `<tr data-id="${l.id}"><td><b>${l.nome}</b></td><td class="num">${l.qtd}</td><td class="num">${l.medio}</td><td class="num">${l.atual}</td>
            <td class="num">${fmtBRL(l.investido)}</td><td class="num">${fmtBRL(l.valor)}</td>
            <td class="num ${classe(res)}">${fmtBRL(res)} (${fmtPct(res / l.investido)})</td></tr>`;
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
        ['Selic', 'É a taxa básica de juros do Brasil, definida pelo Banco Central. Quando ela sobe, a renda fixa rende mais. O jogo começa com a Selic de verdade, e depois ela muda com as notícias.'],
        ['Notícias e expectativas', 'Uma notícia boa costuma fazer a ação subir, mas nem sempre! Se todo mundo já esperava, o preço pode até cair. Por isso investidores leem notícias, mas não apostam tudo nelas.'],
        ['Resultados e P/L', 'A cada 3 meses as empresas contam quanto lucraram. O P/L diz quantos anos de lucro a ação custa: P/L 5 é "barato", P/L 30 é "caro". Ações caras precisam crescer muito para valer a pena.'],
        ['Aporte mensal', 'Aporte é o dinheiro novo que você coloca nos investimentos. Todo mês chega um pouco do salário que sobrou. Quem investe um pouquinho todo mês, por muitos anos, junta muito mais do que quem espera ter muito para começar.'],
        ['Salário mínimo e 13º', 'Todo janeiro o salário mínimo aumenta: repõe a inflação do ano e ganha um pouco a mais se a economia cresceu. Em dezembro o trabalhador recebe o 13º salário, um salário extra. Por isso o aporte de dezembro vem em dobro!'],
        ['Dividendos a receber', 'Os dividendos e aluguéis ficam guardados no cofrinho do topo da tela. Clique nele para passar o dinheiro para o saldo e poder investir de novo. Reinvestir é o segredo dos juros compostos!']
    ];
    return `<div class="cards">${cards.map(([t, x]) => `<div class="card"><h4>${t}</h4>${x}</div>`).join('')}</div>`;
}

function renderFonte() {
    document.getElementById('fonte').innerHTML =
        `Selic ${fmtPct(mercado.selic, false)} e IPCA ${fmtPct(mercado.ipca12m, false)} em 12 meses: ${mercado.fonte}. ` +
        `No jogo, depois das notícias: Selic ${fmtPct(selic(), false)} e IPCA ${fmtPct(ipca(), false)}.<br>` +
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
    estado = {
        versao: 2,
        dia: 0,
        inicio: new Date().toISOString().slice(0, 10),
        caixa: CAPITAL_INICIAL,
        hist: {},
        acoes: {},
        lotes: [],
        extrato: [],
        patrimonio: [CAPITAL_INICIAL],
        vendasMes: { mes: 0, total: 0 },
        selecionado: 'PETR4',
        velocidade: VELOCIDADE_PADRAO,
        ultimoTick: Date.now(),
        acumulado: 0
    };
    VARIAVEIS.forEach(id => (estado.hist[id] = historicoInicial(id)));
    completarEstado();
    registrar('Você ganhou dinheiro de mentira para começar a investir!', CAPITAL_INICIAL);
    calcularVencimentos();
}

// Acrescenta o que veio depois (notícias, resultados, dividendos a receber) sem perder um jogo já começado.
function completarEstado() {
    VARIAVEIS.forEach(id => {
        if (!estado.hist[id]) estado.hist[id] = historicoInicial(id);
    });
    const hoje = dataDoDia(estado.dia);
    const padrao = {
        proventos: 0, efeitos: [], noticias: [], naoLidas: 0, usados: [],
        ajusteSelic: 0, ajusteIpca: 0, fund: {}, proximaNoticia: estado.dia + 3,
        aporte: APORTE_INICIAL, mesAporte: chaveMes(hoje), anoReajuste: hoje.getFullYear(),
        totalAportado: CAPITAL_INICIAL, investidoHist: estado.patrimonio.map(() => CAPITAL_INICIAL)
    };
    for (const k in padrao) if (estado[k] == null) estado[k] = padrao[k];
    ACOES.forEach(id => {
        if (!estado.fund[id]) estado.fund[id] = { lpa: preco(id) / PERFIL[id].pl, ultimo: null };
    });
}

// Arredonda os números ao salvar para caber no armazenamento do navegador.
function salvar() {
    try {
        localStorage.setItem(CHAVE_SALVO, JSON.stringify(estado, (k, v) => (typeof v === 'number' && k !== 'ultimoTick' ? Math.round(v * 10000) / 10000 : v)));
    } catch (e) { /* navegador sem armazenamento */ }
}

function carregar() {
    try {
        const salvo = JSON.parse(localStorage.getItem(CHAVE_SALVO));
        if (salvo && salvo.versao === 2 && salvo.hist) {
            estado = salvo;
            completarEstado();
            calcularVencimentos();
            return;
        }
    } catch (e) { /* sem jogo salvo */ }
    novoEstado();
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelector('.tempo').addEventListener('click', e => {
    const b = e.target.closest('button[data-dias]');
    if (b) avancar(+b.dataset.dias);
});

document.getElementById('velocidade').addEventListener('change', e => {
    relogio(true);
    estado.velocidade = +e.target.value;
    estado.acumulado = 0;
    estado.ultimoTick = Date.now();
    salvar();
    atualizarContagem();
    mostrarToast(estado.velocidade ? 'O mercado voltou a andar!' : 'Mercado pausado. Os preços não mudam até você soltar o tempo de novo.');
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
grafico.addEventListener('mousemove', e => {
    if (!grafico._indice) return;
    hoverPrincipal = grafico._indice(e.clientX);
    desenharPrincipal();
});
grafico.addEventListener('mouseleave', () => {
    hoverPrincipal = null;
    desenharPrincipal();
});

const areaAba = document.getElementById('aba');
areaAba.addEventListener('mousemove', e => {
    const c = e.target.closest('#graficoPatrimonio');
    if (!c || !c._indice) return;
    hoverPatrimonio = c._indice(e.clientX);
    desenharPatrimonio();
});
areaAba.addEventListener('mouseleave', () => {
    hoverPatrimonio = null;
    desenharPatrimonio();
});
areaAba.addEventListener('click', e => {
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
    document.getElementById('tabs').scrollIntoView({ behavior: 'smooth' });
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
    salvar();
    renderTudo();
    mostrarToast(`Jogo novo! Você tem ${fmtBRL(CAPITAL_INICIAL)} para investir, e todo mês chegam mais ${fmtBRL(APORTE_INICIAL)}.`, 'ok');
});

let timerResize;
window.addEventListener('resize', () => {
    clearTimeout(timerResize);
    timerResize = setTimeout(() => {
        desenharPrincipal();
        if (aba === 'patrimonio') desenharPatrimonio();
    }, 100);
});

window.addEventListener('pagehide', () => {
    relogio(false);
    salvar();
});

carregar();
const diasFora = relogio(false);
salvar();
renderTudo();
if (diasFora > 0) {
    mostrarToast(`Enquanto você estava fora, passaram <b>${diasFora} dias úteis</b> no mercado. Veja como ficou sua carteira!` +
        (estado.proventos >= 0.01 ? `<br>Você tem <b class="sobe">${fmtBRL(estado.proventos)}</b> de dividendos para receber lá em cima!` : ''), '', 8000);
}
setInterval(tique, 1000);
buscarTaxasBancoCentral();
