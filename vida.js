// Vida do jogador: carreiras, salário líquido (INSS e IRRF) e custo de vida.
// Este arquivo só tem dados e contas puras; quem guarda o jogo e desenha a tela é o app.js.

const SALARIO_MINIMO_INICIAL = 1621;    // salário mínimo de 2026
const SALARIO_MINIMO_REFERENCIA = 1412; // mínimo da época em que os salários abaixo foram escritos
const CUSTO_CURSO = 3;                  // o curso de capacitação custa 3 salários brutos do novo cargo
const JUROS_CHEQUE_ESPECIAL = 0.08;     // ao mês, cobrado sobre o saldo negativo
// Meses mínimos no cargo antes de cada promoção (da 1ª em diante).
const MESES_NO_CARGO = [12, 12, 18, 24, 24, 36, 36];

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
const FELICIDADE_RITMO = 0.10;        // a cada mês, anda 10% da distância até o alvo
const FELICIDADE_SUBIR_PADRAO = 10;   // por nível de padrão de vida que você sobe
const FELICIDADE_DESCER_PADRAO = 6;   // por nível que você desce
const FELICIDADE_BEM_MAX = 25;        // alegria máxima de uma compra
const FELICIDADE_BEM_FATOR = 40;      // alegria = 40 × (preço do bem ÷ seu patrimônio total depois da compra)
const FELICIDADE_CASA_PROPRIA = 8;    // morar no que é seu deixa o alvo mais alto
const FELICIDADE_CARRO = 4;
const FELICIDADE_NO_VERMELHO = -12;   // dívida no cheque especial tira o sono
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
// v = custo variável (cresce junto com as vendas) e f = custo fixo (não muda quando as vendas caem), ambos como parte da receita.
// Quanto maior o custo fixo, mais o lucro despenca quando a economia piora: é a alavancagem operacional.
// sens = quanto o setor sente a economia; multiplo = quantos anos de lucro a empresa vale quando a Selic está em 10%.
const SETORES_EMPRESA = {
    alimentacao: { nome: 'Restaurantes e alimentação', curto: 'Foodtech', v: 0.34, f: 0.48, sens: 1.0, multiplo: 4.0, g: 0.0015, explica: 'Gente come fora quando tem dinheiro sobrando, então o movimento acompanha a economia.' },
    varejo:      { nome: 'Lojas e comércio', curto: 'E-commerce', v: 0.58, f: 0.24, sens: 1.3, multiplo: 3.8, g: 0.0015, explica: 'Vende mais quando o crédito está barato e o consumo aquecido.' },
    servicos:    { nome: 'Software e serviços', curto: 'Software', v: 0.18, f: 0.60, sens: 0.6, multiplo: 5.5, g: 0.0020, explica: 'Poucos custos variáveis e contratos recorrentes: sente menos a economia.' },
    industria:   { nome: 'Indústria e oficinas', curto: 'Hardware', v: 0.50, f: 0.32, sens: 1.0, multiplo: 4.5, g: 0.0010, explica: 'Depende de encomendas das outras empresas, que caem quando a economia esfria.' },
    saude:       { nome: 'Clínicas e saúde', curto: 'Healthtech', v: 0.22, f: 0.58, sens: 0.3, multiplo: 5.0, g: 0.0025, explica: 'As pessoas cuidam da saúde em qualquer fase da economia: é um setor mais defensivo.' },
    construcao:  { nome: 'Construção e reformas', curto: 'Proptech', v: 0.55, f: 0.28, sens: 1.6, multiplo: 4.0, g: 0.0010, explica: 'Sofre muito com juros altos, porque as obras dependem de financiamento.' }
};
// Faturamento mensal em reais de 2026 (corrigido pela inflação depois).
const PORTES_EMPRESA = [
    { nome: 'Microempresa', receita: 12000, peso: 30 },
    { nome: 'Pequena empresa', receita: 35000, peso: 30 },
    { nome: 'Média empresa', receita: 110000, peso: 20 },
    { nome: 'Empresa grande', receita: 320000, peso: 12 },
    { nome: 'Empresa de grande porte', receita: 1200000, peso: 6 },
    { nome: 'Grupo empresarial', receita: 4000000, peso: 2 }
];
const CAPITAIS_STARTUP = [60000, 150000, 400000]; // em reais de 2026
const MAX_EMPRESAS = 4;
const TETO_STARTUP = 2.5;      // a startup não vende mais que 3 vezes o seu custo fixo por mês
const PRAZO_CHAMADA = 21;     // dias úteis para colocar dinheiro na empresa antes da falência
const PRAZO_PROPOSTAS = 21;   // dias úteis de validade das propostas de compra
const CUSTO_ABERTURA = 0.03;  // advogado, contador e registro, na abertura
const IR_VENDA_EMPRESA = 0.15;
const COMPRADORES = [
    { nome: 'Investidor estratégico', k: 1.15, texto: 'Quer somar a empresa ao próprio negócio e paga mais.' },
    { nome: 'Fundo de private equity', k: 1.00, texto: 'Compra para melhorar e revender, e paga o valor justo.' },
    { nome: 'Concorrente local', k: 0.88, texto: 'Quer fechar negócio rápido e oferece menos.' }
];

/* ---------- IPO: abrir o capital da empresa na bolsa ---------- */
const LUCRO_MIN_IPO = 1500000;      // lucro anual mínimo, em reais de 2026
const FLOATS_IPO = [0.2, 0.3, 0.4]; // parte da empresa vendida ao público; você fica com o resto
const TAXA_IPO = 0.05;              // bancos e advogados que organizam a oferta
const PRECO_ALVO_ACAO = 20;         // preço de uma ação quando a empresa vale o que se estima
// Como cada setor reage às notícias depois que a empresa vira ação.
const PERFIS_LISTADA = {
    alimentacao: { tags: ['consumo'], f: { consumo: 1.0, mercado: 0.9, juros: -0.3 } },
    varejo:      { tags: ['varejo'], f: { consumo: 1.4, varejo: 1, juros: -1.5, mercado: 1.1 } },
    servicos:    { tags: [], f: { mercado: 1.0, eua: 0.3, juros: -0.6 } },
    industria:   { tags: ['industria'], f: { industria: 1, dolar: 0.4, mercado: 0.9 } },
    saude:       { tags: ['saude'], f: { saude: 1, consumo: 0.4, mercado: 0.6 } },
    construcao:  { tags: [], f: { construcao: 1.2, juros: -1.5, imoveis: 0.5, credito: 0.3, mercado: 1.0 } }
};
