// Vida do jogador: carreiras, salário líquido (INSS e IRRF) e custo de vida.
// Este arquivo só tem dados e contas puras; quem guarda o jogo e desenha a tela é o app.js.

const SALARIO_MINIMO_INICIAL = 1621;    // salário mínimo de 2026
const SALARIO_MINIMO_REFERENCIA = 1412; // mínimo da época em que os salários abaixo foram escritos
const CUSTO_CURSO = 3;                  // o curso de capacitação custa 3 salários brutos do novo cargo
const JUROS_CHEQUE_ESPECIAL = 0.08;     // ao mês, cobrado sobre o saldo negativo
// Meses mínimos no cargo antes de cada promoção (da 1ª em diante).
const MESES_NO_CARGO = [12, 12, 18, 24, 24, 36, 36];

// Emprego com carteira assinada: FGTS, demissão e seguro-desemprego (regras simplificadas).
const FGTS_MES = 0.08;              // todo mês a empresa deposita 8% do salário bruto numa conta no seu nome
const FGTS_RENDE_MES = 0.0025;      // o FGTS rende cerca de 3% ao ano
const MULTA_FGTS = 0.4;             // quem é demitido sem justa causa recebe mais 40% do FGTS
const FGTS_LIBERA_DIAS = 756;       // 3 anos seguidos sem carteira assinada liberam o saque
const SEGURO_TETO = 1.5;            // o seguro-desemprego vai até 1,5 salário mínimo por mês
const DIAS_OFERTA = 15;             // dias úteis para responder a uma oferta de emprego
const FELICIDADE_DEMITIDO = -15;
const FELICIDADE_DESEMPREGO = -10;  // no alvo, enquanto estiver sem emprego e sem cuidar de uma empresa
const EMPREGADORES = ['Grupo Horizonte', 'Indústrias Aurora', 'Rede Bom Preço', 'TecNova', 'Construtora Pilar', 'Hospital Esperança',
    'Transportes Rota Sul', 'Banco Atlântico', 'Agro Terra Viva', 'Hotel Mar Azul', 'Colégio Saber', 'Energia Clara'];

// Cada cargo: [nome, salário bruto]. Os valores são de 2026 (ajustados ao mínimo de R$ 1.621).
// Depois, cargos de entrada acompanham o salário mínimo e os altos só a inflação (veja salarioDoCargo no app.js).
const CARREIRAS = {
    manutencao: { nome: 'Manutenção e Eletromecânica', cargos: [
        ['Auxiliar de Manutenção', 1800], ['Eletricista de Manutenção', 2600], ['Mecânico Diesel / Eletricista de Máquinas Pesadas', 3800],
        ['Técnico em Eletromecânica', 4500], ['Supervisor de Manutenção', 7700], ['Gerente de Operações', 12000], ['Diretor Industrial', 25000]] },
    construcao: { nome: 'Construção e Engenharia', cargos: [
        ['Servente de Obras', 1890], ['Operador de Máquinas', 3400], ['Mestre de Obras', 5500],
        ['Engenheiro Júnior', 7500], ['Gerente de Projetos', 14000], ['Diretor de Construtora', 30000]] },
    tecnologia: { nome: 'Tecnologia e Dados', cargos: [
        ['Helpdesk / Estagiário', 1800], ['Dev Front-end Júnior', 3500], ['Dev Back-end Pleno', 7500], ['Administrador de Banco de Dados', 9000],
        ['Gerente de TI', 13000], ['Especialista em IA', 16000], ['Arquiteto de Software', 18000], ['CTO', 35000]] },
    textil: { nome: 'Produção Têxtil', cargos: [
        ['Costureiro Aprendiz', 1412], ['Auxiliar de Corte', 1700], ['Operador de Costura Industrial', 2200], ['Modelista', 3500],
        ['Supervisor de Produção', 4800], ['Gerente de Qualidade', 7000], ['Diretor Têxtil', 15000]] },
    financas: { nome: 'Finanças e Mercado', cargos: [
        ['Atendente de Banco', 2500], ['Assessor de Investimentos', 5500], ['Analista de Renda Fixa', 8500], ['Operador de Mesa', 12000],
        ['Gestor de FII', 22000], ['Diretor de RI', 28000], ['Sócio-Gestor', 60000]] },
    logistica: { nome: 'Logística', cargos: [
        ['Auxiliar de Almoxarifado', 1800], ['Operador de Empilhadeira', 2300], ['Coordenador de Frotas', 4500],
        ['Analista de Supply Chain', 6500], ['Gerente de Centro de Distribuição', 11000], ['Diretor Nacional de Logística', 24000]] },
    varejo: { nome: 'Varejo e Vendas', cargos: [
        ['Repositor', 1600], ['Vendedor de Loja', 2400], ['Representante B2B', 5000], ['Gerente de Loja', 6000],
        ['Supervisor de Vendas', 8500], ['Diretor Comercial', 18000], ['VP de Vendas', 32000]] },
    saude: { nome: 'Saúde', cargos: [
        ['Recepcionista de Clínica', 1800], ['Auxiliar de Laboratório', 2100], ['Técnico de Enfermagem', 3325],
        ['Enfermeiro Chefe', 6800], ['Administrador Hospitalar', 13000], ['Diretor de Saúde', 35000]] },
    marketing: { nome: 'Marketing e Publicidade', cargos: [
        ['Estagiário de Marketing', 1500], ['Assistente de Marketing', 2200], ['Analista Pleno', 4500],
        ['Especialista em Tráfego / Growth', 7000], ['Gerente de Marketing', 11000], ['Diretor de Criação / CMO', 25000]] },
    rh: { nome: 'Recursos Humanos', cargos: [
        ['Auxiliar de RH', 1800], ['Assistente de Pessoal', 2500], ['Analista de Recrutamento', 4000],
        ['Business Partner', 7500], ['Gerente de RH', 12000], ['Diretor de RH / CHRO', 26000]] },
    direito: { nome: 'Direito e Jurídico', cargos: [
        ['Auxiliar Jurídico', 1800], ['Advogado Júnior', 4000], ['Advogado Pleno', 7500],
        ['Advogado Sênior', 12000], ['Gerente Jurídico', 18000], ['Diretor Jurídico Sócio', 40000]] },
    educacao: { nome: 'Educação', cargos: [
        ['Auxiliar de Classe', 1500], ['Professor do Ensino Básico', 3000], ['Coordenador Pedagógico', 5500],
        ['Professor Universitário', 9000], ['Diretor Acadêmico', 15000], ['Reitor Sócio', 30000]] },
    agro: { nome: 'Agronegócio', cargos: [
        ['Auxiliar de Lavoura', 1600], ['Operador de Máquinas Agrícolas', 3500], ['Técnico Agrícola', 4500],
        ['Engenheiro Agrônomo', 8000], ['Gerente de Fazenda', 15000], ['Diretor de Agroindústria', 35000]] },
    turismo: { nome: 'Turismo e Hotelaria', cargos: [
        ['Mensageiro', 1500], ['Recepcionista Bilíngue', 2500], ['Concierge', 3500],
        ['Chefe de Recepção', 5000], ['Gerente de Hotel', 10000], ['Diretor de Rede Hoteleira', 22000]] },
    estetica: { nome: 'Estética e Bem-Estar', cargos: [
        ['Recepcionista de Clínica de Estética', 1500], ['Auxiliar de Estética', 1800], ['Esteticista Pleno', 3000],
        ['Especialista em Harmonização', 7000], ['Gerente de Clínica', 10000], ['Proprietário de Franquia', 25000]] },
    gastronomia: { nome: 'Gastronomia', cargos: [
        ['Auxiliar de Cozinha', 1500], ['Cozinheiro', 2500], ['Subchefe', 4000],
        ['Chef de Partie', 6000], ['Chef Executivo', 12000], ['Restaurateur Dono', 30000]] },
    aviacao: { nome: 'Aviação', cargos: [
        ['Agente de Aeroporto', 2000], ['Comissário de Voo', 5000], ['Copiloto Comercial', 12000],
        ['Comandante', 25000], ['Chefe de Operações', 35000], ['Diretor de Aviação', 50000]] },
    seguranca: { nome: 'Segurança Privada', cargos: [
        ['Porteiro', 1800], ['Vigilante Armado', 2800], ['Supervisor de Segurança', 4500],
        ['Coordenador de Escolta', 7000], ['Gerente de Segurança', 14000], ['Diretor de Risco', 28000]] },
    midia: { nome: 'Mídia e Entretenimento', cargos: [
        ['Assistente de Produção', 1800], ['Editor de Vídeo Júnior', 3000], ['Produtor Pleno', 5500],
        ['Diretor de Arte', 9000], ['Produtor Executivo', 16000], ['Diretor de Emissora', 35000]] },
    energia: { nome: 'Energias Renováveis', cargos: [
        ['Auxiliar de Instalação', 1800], ['Instalador Solar', 3000], ['Técnico em Sistemas Renováveis', 4800],
        ['Projetista', 7500], ['Engenheiro de Energias', 12000], ['Diretor de ESG', 28000]] }
};

// Custo mensal de uma pessoa, em reais do começo do jogo. Depois a inflação (IPCA) encarece tudo.
const PADROES_VIDA = [
    { nome: 'Morando com a família', custo: 700, moradia: 0.10, explica: 'Você ajuda nas contas de casa e paga seu transporte, celular e lazer.' },
    { nome: 'Dividindo moradia', custo: 1400, moradia: 0.30, explica: 'Um quarto em casa dividida, com as contas rachadas entre os moradores.' },
    { nome: 'Sozinho, aluguel simples', custo: 2400, moradia: 0.40, explica: 'Uma kitnet só sua, mercado, contas e transporte público.' },
    { nome: 'Classe média', custo: 4500, moradia: 0.38, explica: 'Apartamento de um quarto, plano de saúde, transporte e algum lazer.' },
    { nome: 'Confortável', custo: 9000, moradia: 0.40, explica: 'Apartamento maior em bairro bom, plano de saúde melhor, viagens e restaurantes.' },
    { nome: 'Alto padrão', custo: 20000, moradia: 0.40, explica: 'Imóvel de alto padrão, viagens internacionais e serviços premium.' }
];
// "moradia" é a parte do custo de vida que é aluguel: quem mora em casa própria não paga essa parte (mas paga IPTU e manutenção).
const PARTE_TRANSPORTE = 0.08; // parte do custo de vida que quem tem carro deixa de gastar com ônibus e aplicativo

// INSS 2026: progressivo, cada alíquota vale só para o pedaço do salário dentro da faixa, até o teto.
const INSS_FAIXAS = [[1621.00, 0.075], [2902.84, 0.09], [4354.27, 0.12], [8475.55, 0.14]];

// IRRF 2026: [até esta base, alíquota, parcela a deduzir].
const IRRF_FAIXAS = [[2428.80, 0, 0], [2826.65, 0.075, 182.16], [3751.05, 0.15, 394.16], [4664.68, 0.225, 675.49], [Infinity, 0.275, 908.73]];
const IRRF_DESCONTO_SIMPLIFICADO = 607.20;

// fator = quanto as faixas cresceram desde 2026 (1 = tabela original). Assim a tabela acompanha
// o salário mínimo e a inflação do jogo, em vez de ficar congelada por décadas.
function calcularINSS(bruto, fator = 1) {
    const b = bruto / fator;
    let total = 0;
    let anterior = 0;
    for (const [teto, aliquota] of INSS_FAIXAS) {
        if (b > anterior) total += (Math.min(b, teto) - anterior) * aliquota;
        anterior = teto;
    }
    return total * fator;
}

// A base é o salário menos o INSS (ou menos o desconto simplificado, o que for melhor para o trabalhador).
// Desde 2026 há uma redução que zera o imposto de quem ganha até R$ 5 mil e diminui aos poucos até R$ 7.350.
function calcularIRRF(bruto, inss, fator = 1) {
    const b = bruto / fator;
    const base = b - Math.max(inss / fator, IRRF_DESCONTO_SIMPLIFICADO);
    const [, aliquota, deduzir] = IRRF_FAIXAS.find(f => base <= f[0]);
    const imposto = Math.max(0, base * aliquota - deduzir);
    const reducao = b <= 5000 ? 312.89 : b <= 7350 ? 978.62 - 0.133145 * b : 0;
    return Math.max(0, imposto - reducao) * fator;
}

/* ---------- Bens, financiamentos e imprevistos ---------- */
// Preços de 2026. Carros perdem valor com o tempo; imóveis acompanham a inflação, com leve ganho.
const CATALOGO_BENS = [
    { id: 'carro1', tipo: 'carro', nome: 'Carro popular usado', preco: 45000 },
    { id: 'carro2', tipo: 'carro', nome: 'Hatch zero-quilômetro', preco: 85000 },
    { id: 'carro3', tipo: 'carro', nome: 'SUV compacto', preco: 140000 },
    { id: 'carro4', tipo: 'carro', nome: 'Carro de luxo', preco: 350000 },
    { id: 'imovel1', tipo: 'imovel', nome: 'Kitnet', preco: 180000 },
    { id: 'imovel2', tipo: 'imovel', nome: 'Apartamento de 2 quartos', preco: 450000 },
    { id: 'imovel3', tipo: 'imovel', nome: 'Casa em bairro nobre', preco: 900000 },
    { id: 'imovel4', tipo: 'imovel', nome: 'Casa de alto padrão', preco: 2500000 }
];
const PRAZOS_FINANCIAMENTO = { carro: [36, 48, 60], imovel: [120, 240, 360] }; // em meses
const ENTRADAS = [1, 0.5, 0.3, 0.2];  // 1 = à vista; o mínimo exigido pelo banco é 20%
const RENDA_MAX_PARCELAS = 0.30;      // o banco só libera se as parcelas couberem em 30% do salário bruto
const ITBI = 0.04;                    // imposto de transmissão mais cartório, pagos na compra do imóvel
const IPVA_ANO = 0.04;
const IPTU_ANO = 0.008;
const MANUT_IMOVEL_MES = 0.0012;      // condomínio e pequenos reparos
const MANUT_CARRO_MES = 0.010;        // combustível, seguro e manutenção
const ALUGUEL_MES = 0.0042;           // aluguel de um imóvel que não é sua moradia, já descontada a vacância
const DEPRECIACAO_CARRO_ANO = 0.11;   // perda de valor real por ano
const DESCONTO_VENDA_CARRO = 0.08;    // a loja paga menos que o valor de tabela
const CORRETAGEM = 0.06;              // comissão do corretor na venda do imóvel
const IR_GANHO_CAPITAL = 0.15;        // imposto sobre o lucro na venda do imóvel
const PRAZO_VENDA = { carro: 10, imovel: 120 }; // dias úteis até o dinheiro entrar: imóvel demora uns 6 meses

// Imprevistos: valor = parte do custo de vida (fator) ou parte do valor do bem (pct), sempre com um mínimo.
// saude = problema de saúde, que fica mais comum quando a felicidade está baixa (o estresse adoece).
const IMPREVISTOS = [
    { nome: 'O celular quebrou e precisou ser trocado', fator: 0.25, min: 600, peso: 4 },
    { nome: 'Dor de dente: o dentista cobrou o tratamento', fator: 0.35, min: 800, peso: 3, saude: true },
    { nome: 'A geladeira queimou e teve de ser trocada', fator: 0.45, min: 2200, peso: 2 },
    { nome: 'Consulta e exames de urgência fora do plano', fator: 0.6, min: 1500, peso: 3, saude: true },
    { nome: 'Acidente doméstico: pronto-socorro e remédios', fator: 1.2, min: 2500, peso: 2, saude: true },
    { nome: 'Cirurgia de urgência', fator: 3, min: 9000, peso: 1, saude: true },
    { nome: 'Crise de estresse: afastamento, terapia e remédios', fator: 1.5, min: 4000, peso: 0, saude: true, estresse: true },
    { nome: 'O carro quebrou: conserto na oficina', bem: 'carro', pct: 0.05, min: 1500, peso: 4 },
    { nome: 'Batida de carro: franquia e reparos', bem: 'carro', pct: 0.09, min: 3000, peso: 1 },
    { nome: 'Vazamento no telhado: reforma urgente', bem: 'imovel', pct: 0.012, min: 3000, peso: 4 },
    { nome: 'Infiltração e problema elétrico: obra de emergência', bem: 'imovel', pct: 0.02, min: 5000, peso: 2 }
];

/* ---------- Felicidade (0 a 100) ---------- */
// Todo mês a felicidade anda um pouco em direção a um "alvo", que depende de quanto do salário você
// se permite gastar vivendo. Alegrias de compras e mudanças de vida passam com o tempo (adaptação hedônica).
const FELICIDADE_INICIAL = 70;
const FELICIDADE_RITMO_CAINDO = 0.03; // a cada mês, cai 3% da distância até o alvo (leva uns 2 anos para cair metade)
const FELICIDADE_RITMO_SUBINDO = 0.08; // e sobe 8% quando o alvo está acima
const FELICIDADE_SUBIR_PADRAO = 10;   // por nível de padrão de vida que você sobe
const FELICIDADE_DESCER_PADRAO = 6;   // por nível que você desce
const FELICIDADE_BEM_MAX = 25;        // alegria máxima de uma compra
const FELICIDADE_BEM_FATOR = 40;      // alegria = 40 × (preço do bem ÷ seu patrimônio total depois da compra)
const FELICIDADE_CASA_PROPRIA = 8;    // morar no que é seu deixa o alvo mais alto
const FELICIDADE_CARRO = 4;
const FELICIDADE_NO_VERMELHO = -12;   // dívida no cheque especial tira o sono
// Investir também alegra (ver o futuro sendo construído), mas não substitui viver:
// investir meio salário líquido dá +1, no máximo +1 por investimento e +3 por mês,
// e essa alegria não passa de 20 pontos acima do alvo.
const FELICIDADE_INVESTIR_FATOR = 2;
const FELICIDADE_INVESTIR_MAX = 1;
const FELICIDADE_INVESTIR_MES = 3;
const FELICIDADE_INVESTIR_ACIMA_ALVO = 20;
// Ganhar e perder dinheiro: todo mês, o que os investimentos, as empresas e os bens ganharam ou perderam mexe na
// felicidade. Perder dói o dobro do que ganhar alegra (aversão à perda): cada 1% de ganho no mês dá +0,3 e cada 1% de perda tira 0,6.
const FELICIDADE_GANHO = 30;
const FELICIDADE_PERDA = 60;
const FELICIDADE_GANHO_MAX = 3;
const FELICIDADE_PERDA_MAX = 6;
// Um imprevisto entristece conforme o tamanho da conta perto da renda do mês: 1 mês de renda tira 1,5 ponto, até 4.
const FELICIDADE_IMPREVISTO = 1.5;
const FELICIDADE_IMPREVISTO_MAX = 4;
// Felicidade baixa: imprevistos até 2,5 vezes mais frequentes e problemas de saúde até 3 vezes mais prováveis entre eles.
const IMPREVISTO_MULT_TRISTE = 2.5;
const IMPREVISTO_MULT_FELIZ = 0.6;
const SAUDE_MULT_TRISTE = 3;

// Financiamento. SAC: amortiza o mesmo tanto todo mês, então a parcela começa alta e diminui.
// Price: parcela igual todo mês, começa menor, mas no fim se paga mais juros.
function criarFinanciamento(principal, taxaMes, n, tabela) {
    return {
        saldo: principal, n, restantes: n, taxaMes, tabela,
        amortSac: principal / n,
        pmt: taxaMes ? principal * taxaMes / (1 - Math.pow(1 + taxaMes, -n)) : principal / n
    };
}

function parcelaDoMes(fin) {
    const juros = fin.saldo * fin.taxaMes;
    let amort = fin.tabela === 'sac' ? fin.amortSac : fin.pmt - juros;
    if (fin.restantes <= 1 || amort > fin.saldo) amort = fin.saldo;
    return { juros, amort, parcela: juros + amort };
}

function resumoFinanciamento(principal, taxaMes, n, tabela) {
    const fin = criarFinanciamento(principal, taxaMes, n, tabela);
    let totalJuros = 0, primeira = 0, ultima = 0;
    while (fin.restantes > 0) {
        const p = parcelaDoMes(fin);
        if (fin.restantes === n) primeira = p.parcela;
        ultima = p.parcela;
        totalJuros += p.juros;
        fin.saldo -= p.amort;
        fin.restantes--;
    }
    return { primeira, ultima, totalJuros };
}

/* ---------- Empresas ---------- */
// Setores. sens = quanto as vendas sentem a economia; mult = ajuste no preço da empresa (quantos anos de lucro ela vale);
// f = como as vendas (e a ação, se a empresa for para a bolsa) reagem a cada assunto das notícias;
// tags = notícias de empresa que podem atingir a ação na bolsa.
const SETORES_EMPRESA = {
    alimentacao:  { nome: 'Alimentação', sens: 1.0, mult: 1.0, tags: ['consumo'], f: { consumo: 1.0, mercado: 0.5, juros: -0.3 }, explica: 'Gente come fora quando tem dinheiro sobrando, então o movimento acompanha a economia.' },
    supermercado: { nome: 'Supermercados', sens: 0.4, mult: 0.95, tags: ['consumo', 'varejo'], f: { consumo: 0.5, mercado: 0.4, agro: 0.2 }, explica: 'Comida todo mundo compra: as vendas mudam pouco com a economia, mas a margem é pequena.' },
    varejo:       { nome: 'Lojas e comércio', sens: 1.3, mult: 0.9, tags: ['varejo'], f: { consumo: 1.4, varejo: 1, juros: -1.2, mercado: 0.9 }, explica: 'Vende mais quando o crédito está barato e o consumo aquecido.' },
    servicos:     { nome: 'Serviços', sens: 0.8, mult: 1.0, tags: [], f: { consumo: 0.8, mercado: 0.5 }, explica: 'Serviços para casas e empresas. Na crise, parte dos clientes corta gastos.' },
    automotivo:   { nome: 'Automotivo', sens: 0.9, mult: 0.95, tags: ['locacao'], f: { consumo: 0.7, credito: 0.5, petroleo: -0.3, juros: -0.6 }, explica: 'Carros e motos dependem de crédito: juros altos atrapalham.' },
    tecnologia:   { nome: 'Tecnologia', sens: 0.6, mult: 1.3, tags: [], f: { mercado: 1.0, eua: 0.3, juros: -0.6 }, explica: 'Contratos e assinaturas dão receita previsível, e o mercado paga caro por empresas de tecnologia.' },
    industria:    { nome: 'Indústria', sens: 1.0, mult: 1.0, tags: ['industria'], f: { industria: 1, dolar: 0.4, mercado: 0.8, china: 0.2 }, explica: 'Depende de encomendas das outras empresas, que caem quando a economia esfria.' },
    saude:        { nome: 'Saúde', sens: 0.3, mult: 1.15, tags: ['saude'], f: { saude: 1, consumo: 0.3, mercado: 0.5 }, explica: 'As pessoas cuidam da saúde em qualquer fase da economia: é um setor defensivo.' },
    educacao:     { nome: 'Educação', sens: 0.5, mult: 1.05, tags: [], f: { consumo: 0.5, mercado: 0.5, credito: 0.3 }, explica: 'As famílias cortam outras despesas antes da escola dos filhos.' },
    construcao:   { nome: 'Construção', sens: 1.6, mult: 0.85, tags: [], f: { construcao: 1.2, juros: -1.5, imoveis: 0.6, credito: 0.4, mercado: 0.9 }, explica: 'Sofre muito com juros altos, porque obras e imóveis dependem de financiamento.' },
    logistica:    { nome: 'Transporte e logística', sens: 1.0, mult: 0.95, tags: [], f: { logistica: 1, petroleo: -0.6, varejo: 0.4, industria: 0.4, mercado: 0.7 }, explica: 'Leva o que os outros vendem: acompanha a economia e sofre com o diesel caro.' },
    turismo:      { nome: 'Turismo e hotelaria', sens: 1.2, mult: 1.0, tags: [], f: { consumo: 1.0, aviao: 0.6, dolar: -0.3, mercado: 0.6 }, explica: 'Viagem é das primeiras coisas que as famílias cortam na crise.' },
    imobiliario:  { nome: 'Shoppings e imóveis', sens: 0.7, mult: 1.1, tags: [], f: { consumo: 0.6, shopping: 1, imoveis: 0.6, juros: -0.8, mercado: 0.6 }, explica: 'Vive dos aluguéis das lojas, que acompanham a inflação.' },
    agro:         { nome: 'Agronegócio', sens: 0.5, mult: 0.95, tags: [], f: { agro: 1, dolar: 0.6, china: 0.4, petroleo: 0.3 }, explica: 'Vende muito para fora: ganha quando o dólar sobe e a China compra.' },
    energia:      { nome: 'Energia', sens: 0.2, mult: 1.15, tags: ['energia'], f: { energia: 1, juros: -0.8, mercado: 0.4 }, explica: 'Contratos longos e receita estável, mas obras muito caras.' },
    midia:        { nome: 'Mídia e comunicação', sens: 1.0, mult: 0.9, tags: ['telecom'], f: { consumo: 0.6, mercado: 0.7, telecom: 0.3 }, explica: 'Vive de anúncios, que as empresas cortam quando a economia esfria.' }
};

const PORTES = { micro: 'Microempresa', pequena: 'Pequena empresa', media: 'Média empresa', grande: 'Grande empresa', grupo: 'Grupo empresarial' };

// Os 50 negócios. Valores em MIL reais de 2026, por unidade madura (loja, equipe, fábrica...):
// investimento para abrir, faturamento por mês, imposto e insumos (partes do faturamento), salários com encargos,
// funcionários, aluguel e outras despesas (energia, água, contador, manutenção, propaganda) por mês,
// e o máximo de unidades. Micro e pequenos podem ser abertos do zero; grandes e grupos só se compram prontos.
const NEGOCIOS = {};
const LISTA_NEGOCIOS = [];
function negocio(id, nome, porte, setor, inv, receita, imposto, insumos, folha, func, aluguel, outros, max, un, explica, venda) {
    const t = {
        id, nome, porte, setor, imposto, insumos, func, max, explica, un: un.split('/'),
        inv: inv * 1000, receita: receita * 1000, folha: folha * 1000, aluguel: aluguel * 1000, outros: outros * 1000,
        simples: porte === 'micro' || porte === 'pequena', // começam no Simples Nacional, cuja alíquota sobe com o faturamento
        abre: porte === 'micro' || porte === 'pequena' || porte === 'media',
        venda: venda || (porte === 'micro' ? [1, 1] : porte === 'pequena' ? [1, 2] : [1, 3]) // unidades das empresas à venda
    };
    NEGOCIOS[id] = t;
    LISTA_NEGOCIOS.push(t);
}

negocio('jardinagem', 'Jardinagem e paisagismo', 'micro', 'servicos', 45, 14, 0.06, 0.12, 4.4, 2, 0, 1.8, 15, 'equipe/equipes', 'Corta grama, poda e cuida de jardins de casas e condomínios. Precisa de uma caminhonete usada e de equipamentos, mas não paga aluguel de loja.');
negocio('marmitaria', 'Marmitaria', 'micro', 'alimentacao', 70, 38, 0.06, 0.40, 8, 3, 2.5, 2.8, 30, 'cozinha/cozinhas', 'Cozinha que prepara marmitas e entrega no bairro e pelos aplicativos, que ficam com uma parte de cada pedido.');
negocio('oficina_moto', 'Oficina de motos', 'micro', 'automotivo', 40, 24, 0.06, 0.38, 4.6, 2, 2, 1.6, 10, 'oficina/oficinas', 'Conserta e faz revisão de motos. Boa parte do que cobra é o preço das peças.');
negocio('lava_rapido', 'Lava-rápido', 'micro', 'automotivo', 60, 22, 0.06, 0.10, 6.6, 3, 3, 2.6, 12, 'unidade/unidades', 'Lava carros por dentro e por fora. Gasta pouco com produtos, mas precisa de gente e de um ponto bem localizado.');
negocio('salao', 'Salão de beleza', 'micro', 'servicos', 55, 30, 0.06, 0.48, 2.3, 1, 3.2, 2.2, 15, 'salão/salões', 'Corte, cor e unhas. Cabeleireiras e manicures ficam com uma comissão de cada serviço, além dos produtos usados.');
negocio('food_truck', 'Food truck de lanches', 'micro', 'alimentacao', 110, 32, 0.06, 0.38, 4.6, 2, 0.8, 3.2, 8, 'truck/trucks', 'Um caminhão-cozinha que vende lanches em eventos e pontos movimentados. Quase não paga aluguel, mas gasta com gás, combustível e licenças.');
negocio('confeitaria', 'Confeitaria de encomendas', 'micro', 'alimentacao', 18, 12, 0.06, 0.36, 2.3, 1, 0, 1.4, 10, 'cozinha/cozinhas', 'Bolos e doces por encomenda, feitos numa cozinha caseira. Custa pouco para começar, mas depende muito do trabalho do dono.');
negocio('banho_tosa', 'Banho e tosa de pets', 'micro', 'servicos', 55, 19, 0.06, 0.12, 6.5, 2, 2.5, 1.6, 12, 'unidade/unidades', 'Dá banho, tosa e cuida da aparência de cães e gatos. Clientes fiéis voltam todo mês.');
negocio('celulares', 'Assistência técnica de celulares', 'micro', 'tecnologia', 22, 17, 0.06, 0.36, 2.4, 1, 2, 1.2, 12, 'loja/lojas', 'Troca telas e baterias e conserta celulares. As peças são a maior despesa.');
negocio('limpeza', 'Limpeza de casas e escritórios', 'micro', 'servicos', 30, 26, 0.06, 0.07, 16, 6, 0.6, 1.6, 20, 'equipe/equipes', 'Equipes de limpeza que atendem casas e escritórios. Quase todo o custo é o salário das funcionárias.');
negocio('eletricista', 'Serviços elétricos e manutenção', 'micro', 'construcao', 45, 26, 0.06, 0.30, 8.5, 2, 0, 2.2, 15, 'equipe/equipes', 'Instalações elétricas, quadros de energia e manutenção de prédios. Precisa de uma van, ferramentas e gente com curso técnico.');
negocio('hamburgueria', 'Hamburgueria delivery', 'micro', 'alimentacao', 75, 48, 0.06, 0.44, 10.5, 4, 3.5, 3.6, 25, 'cozinha/cozinhas', 'Hambúrgueres para entrega. Vende bastante, mas carne, pão e a taxa dos aplicativos levam quase metade do faturamento.');
negocio('costura', 'Ateliê de costura e ajustes', 'micro', 'servicos', 14, 10, 0.06, 0.10, 2.3, 1, 1.5, 0.9, 8, 'ateliê/ateliês', 'Barras, ajustes e consertos de roupas. Barato de abrir e com pouca concorrência no bairro.');
negocio('acai', 'Loja de açaí', 'micro', 'alimentacao', 65, 36, 0.06, 0.40, 6.9, 3, 3.8, 3, 25, 'loja/lojas', 'Açaí e sorvetes no copo. Vende muito no calor e precisa de um ponto com movimento.');

negocio('restaurante', 'Restaurante self-service', 'pequena', 'alimentacao', 280, 150, 0.08, 0.40, 36, 12, 11, 13, 15, 'restaurante/restaurantes', 'Comida a quilo no almoço. Precisa de cozinha grande, muita gente e um bom ponto.');
negocio('padaria', 'Padaria e confeitaria', 'pequena', 'alimentacao', 420, 190, 0.08, 0.46, 42, 14, 12, 16, 12, 'padaria/padarias', 'Pães, frios e café da manhã. Funciona o dia inteiro e tem margem apertada.');
negocio('oficina_mecanica', 'Oficina mecânica de carros', 'pequena', 'automotivo', 200, 95, 0.08, 0.38, 23, 6, 7.5, 6.5, 10, 'oficina/oficinas', 'Mecânica, suspensão e revisões. Elevadores e ferramentas custam caro, e as peças são boa parte da conta.');
negocio('academia', 'Academia de ginástica', 'pequena', 'saude', 550, 125, 0.08, 0.03, 32, 10, 28, 30, 15, 'academia/academias', 'Mensalidades de alunos. Os aparelhos custam caro, e o aluguel de um espaço grande também.');
negocio('minimercado', 'Minimercado de bairro', 'pequena', 'supermercado', 320, 230, 0.07, 0.675, 26, 9, 8.5, 10.5, 20, 'loja/lojas', 'Vende de tudo um pouco perto de casa. Fatura muito, mas quase tudo é o custo da mercadoria: a margem é pequena.');
negocio('farmacia', 'Farmácia', 'pequena', 'saude', 480, 260, 0.07, 0.66, 31, 8, 10, 10, 25, 'loja/lojas', 'Remédios e produtos de higiene. As pessoas compram mesmo com a economia ruim.');
negocio('idiomas', 'Escola de idiomas', 'pequena', 'educacao', 220, 90, 0.08, 0.08, 46, 10, 8, 7.5, 15, 'escola/escolas', 'Cursos de inglês e espanhol. O maior custo são os professores.');
negocio('odonto', 'Clínica odontológica', 'pequena', 'saude', 380, 120, 0.10, 0.18, 50, 9, 8.5, 10.5, 12, 'clínica/clínicas', 'Consultórios com dentistas e auxiliares. Equipamentos caros, mas clientes que voltam sempre.');
negocio('marcenaria', 'Marcenaria de móveis planejados', 'pequena', 'construcao', 270, 110, 0.08, 0.42, 27, 7, 6.5, 7.5, 8, 'fábrica/fábricas', 'Cozinhas e armários sob medida. Vende mais quando as pessoas compram e reformam casas.');
negocio('transportadora', 'Transportadora com 3 caminhões', 'pequena', 'logistica', 950, 190, 0.08, 0.36, 32, 5, 5, 48, 15, 'frota/frotas', 'Leva cargas para outras empresas. Diesel, pedágio, pneus e o desgaste dos caminhões custam caro.');
negocio('reformas', 'Empreiteira de reformas', 'pequena', 'construcao', 120, 160, 0.10, 0.56, 32, 8, 3, 6.5, 10, 'equipe/equipes', 'Reforma casas e lojas. Barato de abrir, mas material e terceirizados levam mais da metade do faturamento, e as obras somem quando os juros sobem.');
negocio('agencia', 'Agência de marketing digital', 'pequena', 'servicos', 100, 85, 0.10, 0.10, 48, 7, 4, 6.5, 6, 'equipe/equipes', 'Cuida das redes sociais e dos anúncios de outras empresas. O custo é quase todo de salários.');
negocio('roupas', 'Loja de roupas', 'pequena', 'varejo', 220, 105, 0.08, 0.50, 13, 4, 13, 8.5, 30, 'loja/lojas', 'Roupas da moda no shopping. Aluguel caro e estoque que precisa girar.');
negocio('pizzaria', 'Pizzaria com delivery', 'pequena', 'alimentacao', 190, 115, 0.08, 0.44, 26, 9, 7, 9, 20, 'pizzaria/pizzarias', 'Salão e entregas à noite. O forno e os motoboys fazem parte do custo.');

negocio('supermercado', 'Supermercado', 'media', 'supermercado', 4200, 2000, 0.10, 0.68, 190, 60, 65, 85, 30, 'loja/lojas', 'Um supermercado completo. Fatura milhões, mas fica com só 2 ou 3 centavos de cada real vendido.');
negocio('hotel', 'Hotel', 'media', 'turismo', 9000, 650, 0.10, 0.12, 190, 55, 0, 130, 15, 'hotel/hotéis', 'Hotel de cidade para quem viaja a trabalho e a passeio. O prédio é caro, mas é próprio.');
negocio('confeccao', 'Confecção de roupas', 'media', 'industria', 1600, 750, 0.10, 0.46, 185, 55, 28, 60, 10, 'fábrica/fábricas', 'Fábrica que costura roupas para lojas. Tecido e costureiras são os maiores custos.');
negocio('clinica', 'Clínica médica e laboratório', 'media', 'saude', 2600, 950, 0.12, 0.20, 420, 70, 42, 90, 20, 'clínica/clínicas', 'Consultas, exames e laboratório. Médicos e equipamentos custam caro, mas a procura é estável.');
negocio('escola', 'Escola particular', 'media', 'educacao', 4500, 850, 0.10, 0.05, 460, 80, 65, 85, 15, 'escola/escolas', 'Do infantil ao ensino médio. As mensalidades pagam principalmente os professores.');
negocio('biscoitos', 'Fábrica de biscoitos e massas', 'media', 'industria', 3200, 1300, 0.12, 0.53, 210, 60, 32, 90, 8, 'fábrica/fábricas', 'Produz biscoitos e macarrão para supermercados. Trigo e açúcar são a maior despesa.');
negocio('distribuidora', 'Distribuidora de bebidas', 'media', 'logistica', 2200, 2600, 0.10, 0.78, 125, 35, 26, 65, 10, 'centro/centros', 'Compra bebidas das fábricas e entrega em bares e mercados. Muito volume e pouca margem.');
negocio('motos', 'Concessionária de motos', 'media', 'automotivo', 2600, 2100, 0.08, 0.80, 85, 25, 32, 52, 15, 'loja/lojas', 'Vende motos novas e faz revisões. Depende do crédito: com juros altos, vende menos.');
negocio('software', 'Empresa de software por assinatura', 'media', 'tecnologia', 2200, 650, 0.12, 0.10, 345, 40, 22, 65, 6, 'produto/produtos', 'Programas que as empresas pagam todo mês. Quase todo o custo é de programadores.');
negocio('construtora', 'Construtora de prédios residenciais', 'media', 'construcao', 5500, 2200, 0.08, 0.69, 260, 90, 16, 65, 10, 'obra/obras', 'Constrói e vende apartamentos. Lucra bem com juros baixos e sofre muito quando eles sobem.');

negocio('rede_super', 'Rede de supermercados', 'grande', 'supermercado', 9000, 4500, 0.10, 0.69, 380, 110, 130, 160, 80, 'loja/lojas', 'Dezenas de supermercados grandes. Compra em quantidade e negocia preços melhores.', [10, 30]);
negocio('rede_farma', 'Rede de farmácias', 'grande', 'saude', 600, 420, 0.07, 0.66, 52, 12, 26, 22, 400, 'loja/lojas', 'Uma rede com farmácias em várias cidades.', [40, 150]);
negocio('hospitais', 'Rede de hospitais particulares', 'grande', 'saude', 60000, 14000, 0.12, 0.26, 5800, 1200, 0, 2000, 20, 'hospital/hospitais', 'Hospitais com pronto-socorro, cirurgias e UTI. Muito caros de construir, e a procura quase não cai.', [1, 4]);
negocio('faculdade', 'Faculdade particular', 'grande', 'educacao', 25000, 6500, 0.10, 0.05, 3300, 450, 320, 950, 40, 'campus/campi', 'Cursos de graduação presenciais e a distância.', [2, 8]);
negocio('transp_nac', 'Transportadora nacional', 'grande', 'logistica', 12000, 3200, 0.10, 0.40, 650, 140, 65, 620, 60, 'filial/filiais', 'Centenas de caminhões levando cargas por todo o país.', [6, 20]);
negocio('autopecas', 'Fábrica de autopeças', 'grande', 'industria', 60000, 16000, 0.14, 0.56, 2600, 700, 0, 1100, 8, 'fábrica/fábricas', 'Faz peças para as montadoras de carros. Depende de quantos carros o país produz.', [1, 3]);
negocio('incorporadora', 'Incorporadora imobiliária', 'grande', 'construcao', 40000, 11000, 0.07, 0.66, 1300, 300, 60, 600, 20, 'regional/regionais', 'Lança bairros e prédios inteiros. Os lucros sobem e descem com os juros.', [2, 6]);

negocio('shoppings', 'Grupo de shopping centers', 'grupo', 'imobiliario', 400000, 9000, 0.12, 0.06, 900, 150, 0, 2600, 30, 'shopping/shoppings', 'Dono de shoppings inteiros: ganha com o aluguel das lojas e com o estacionamento.', [4, 10]);
negocio('usinas', 'Grupo de usinas de açúcar e etanol', 'grupo', 'agro', 300000, 45000, 0.10, 0.55, 6500, 1800, 900, 6000, 15, 'usina/usinas', 'Planta cana e produz açúcar e etanol. Lucra mais quando o dólar e o petróleo sobem.', [2, 6]);
negocio('solar', 'Grupo de energia solar', 'grupo', 'energia', 250000, 5200, 0.09, 0.02, 220, 40, 320, 2600, 40, 'parque/parques', 'Parques solares que vendem energia com contratos longos. Receita muito estável.', [5, 15]);
negocio('midia', 'Grupo de comunicação', 'grupo', 'midia', 150000, 22000, 0.12, 0.15, 9000, 1200, 400, 5500, 12, 'emissora/emissoras', 'TV, rádio e sites de notícias. Vive de anúncios, que caem quando a economia esfria.', [3, 8]);
negocio('resorts', 'Grupo hoteleiro de resorts', 'grupo', 'turismo', 200000, 9500, 0.10, 0.14, 3300, 700, 0, 2300, 25, 'resort/resorts', 'Resorts de praia e de serra. Lotam nas férias e sofrem quando as famílias apertam o cinto.', [4, 12]);

// Nomes inventados para as empresas, como "Marmitaria Primavera".
const NOMES_FANTASIA = ['Primavera', 'Bom Gosto', 'Central', 'Estrela', 'do Vale', 'Nova Era', 'Sol Nascente', 'Horizonte', 'Boa Vista', 'Ipê',
    'Aurora', 'Ponto Certo', 'Vitória', 'Capital', 'Litoral', 'Serra Azul', 'Bem-Te-Vi', 'Jacarandá', 'Girassol', 'Rio Claro', 'Monte Verde', 'Esperança'];

const MAX_EMPRESAS = 5;              // empresas fora da bolsa ao mesmo tempo
const RAMPA_INICIAL = 0.45;          // uma unidade nova começa vendendo 45% do que venderá madura
const RAMPA_MES = 0.15;              // e a cada mês anda 15% do que falta (uns 6 meses até deixar de dar prejuízo)
const MESES_DE_GIRO = 3;             // o capital de giro paga 3 meses de custos fixos enquanto a clientela cresce
const RECEITA_MAX_DONO = 300000;     // faturamento máximo por mês (reais de 2026) de uma empresa que uma pessoa consegue administrar
const BONUS_DONO = 0.05;             // com o dono presente, a empresa vende 5% a mais
const PROB_EVENTO_EMPRESA = 0.05;    // chance por mês de algo acontecer com cada empresa sua
const PRAZO_CHAMADA = 21;     // dias úteis para colocar dinheiro na empresa antes da falência
const PRAZO_PROPOSTAS = 21;   // dias úteis de validade das propostas de compra
const IR_VENDA_EMPRESA = 0.15;

// Coisas que acontecem com as suas empresas. mercado = mudança na clientela (volta ao normal aos poucos);
// custo = gasto que sai do caixa da empresa: parte do investimento de uma unidade (inv), meses de salários (folha) ou do faturamento (receita).
const EVENTOS_EMPRESA = [
    { t: 'Um cliente grande fechou contrato com {e}', mercado: 0.08, peso: 3, p: 'Clientes grandes trazem vendas por meses. Por outro lado, depender demais de um só cliente é um risco.' },
    { t: '{e} viralizou nas redes sociais', mercado: 0.12, peso: 2, p: 'Um vídeo fez muita gente conhecer a empresa. O movimento cresce agora, mas parte dele some quando a novidade passa.' },
    { t: 'Um concorrente de {e} fechou as portas', mercado: 0.10, peso: 2, p: 'Os clientes do concorrente procuram outro lugar, e parte deles vem para você.' },
    { t: '{e} ganhou o prêmio de melhor da cidade no seu ramo', mercado: 0.05, peso: 2, p: 'Boa fama atrai clientes, mas sozinha muda pouco as contas.' },
    { t: 'Um concorrente abriu bem perto de {e}', mercado: -0.10, peso: 4, p: 'Os clientes agora têm outra opção, e as vendas caem. Com o tempo a empresa recupera parte deles.' },
    { t: 'Reclamações na internet mancharam a fama de {e}', mercado: -0.08, peso: 3, p: 'Os clientes leem as avaliações antes de comprar. Atender bem é parte do negócio.' },
    { t: 'Um funcionário importante de {e} pediu demissão', mercado: -0.05, peso: 3, p: 'Perder quem conhece o trabalho atrapalha até o substituto aprender.' },
    { t: 'Um equipamento importante de {e} quebrou', custo: { inv: 0.08 }, peso: 3, p: 'Máquinas quebram. Por isso a empresa guarda uma reserva no caixa.' },
    { t: 'Um ex-funcionário processou {e} na Justiça do Trabalho', custo: { folha: 1 }, peso: 2, p: 'Quando a empresa não cumpre todas as regras do trabalho, o funcionário pode cobrar na Justiça.' },
    { t: 'A fiscalização multou {e}', custo: { receita: 0.12 }, peso: 2, p: 'Alvarás, notas fiscais e regras sanitárias precisam estar em dia, ou a multa vem.' }
];
const COMPRADORES = [
    { nome: 'Investidor estratégico', k: 1.15, texto: 'Quer somar a empresa ao próprio negócio e paga mais.' },
    { nome: 'Fundo de private equity', k: 1.00, texto: 'Compra para melhorar e revender, e paga o valor justo.' },
    { nome: 'Concorrente local', k: 0.88, texto: 'Quer fechar negócio rápido e oferece menos.' }
];

/* ---------- IPO: abrir o capital da empresa na bolsa ---------- */
const LUCRO_MIN_IPO = 10000000;     // lucro anual mínimo, em reais de 2026
const FLOATS_IPO = [0.2, 0.3, 0.4]; // parte da empresa vendida ao público; você fica com o resto
const TAXA_IPO = 0.05;              // bancos e advogados que organizam a oferta
const PRECO_ALVO_ACAO = 20;         // preço de uma ação quando a empresa vale o que se estima
