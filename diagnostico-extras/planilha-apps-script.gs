/**
 * Planilha de leads do Diagnóstico do Perfil (LucraDiva) + aba "Vendas" do dashboard
 *
 * Como instalar:
 * 1. Na planilha: Extensões → Apps Script. Apaga o que tiver e cola este código. Salva.
 * 2. Implantar → Nova implantação → tipo "App da Web".
 *    Executar como: "Eu". Quem pode acessar: "Qualquer pessoa". Implantar e autorizar.
 * 3. Copia o "URL do app da Web" e cola no Netlify (diagnóstico) e na Vercel (painel de vendas) em SHEET_WEBHOOK_URL.
 *
 * Cada lead é uma linha. A linha vai sendo completada conforme a lead avança no diagnóstico.
 *
 * Vendas (painel em painel-vendas/, hospedado na Vercel):
 * 4. Troca o TOKEN abaixo por uma senha longa sua (ex.: 30 letras e números aleatórios).
 *    Cola a mesma senha na Vercel (projeto do painel) em Environment Variables → SHEET_TOKEN.
 * 5. Implantar → Gerenciar implantações → lápis → Versão: "Nova versão" → Implantar.
 *    (O link continua o mesmo; sem nova versão o script antigo continua rodando.)
 * A aba "Vendas" é criada sozinha na primeira venda. As colunas "Vendedora (ajuste)" e
 * "Canal (ajuste)" são pra você corrigir na mão (ex.: "manu", "stories") — elas nunca são sobrescritas.
 */

const TOKEN = 'TROQUE-POR-UMA-SENHA-LONGA';

const COLUNAS_VENDAS = [
  'Transação', 'Data', 'Aprovada em', 'Status', 'Produto', 'Oferta', 'Valor', 'Moeda', 'Pagamento',
  'Parcelas', 'Comprador', 'Email', 'Telefone', 'SRC', 'SCK', 'Vendedora (ajuste)', 'Canal (ajuste)',
  'Último evento', 'Atualizado em',
];
const COLUNAS_DATA = ['Data', 'Aprovada em'];

const COLUNAS = [
  'ID', 'Data', 'Etapa', 'Nome', 'WhatsApp', 'Chamar no WhatsApp', 'Instagram', 'Seguidores',
  'Posts nos últimos 30 dias', 'Engajamento (%)', 'Nicho', 'Maior desafio', 'Faturamento',
  'Vende pelo perfil', 'Temperatura', 'Nota', 'Ver pra crer', 'Problema + solução', 'Gancho',
  'Personalidade', 'Ingrediente mais fraco', 'Clicou no WhatsApp',
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.tipo === 'vendas') return salvarVendas(d);
    if (!d.id || !d.campos) return resposta({ok: false});

    const aba = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (aba.getLastRow() === 0) {
      aba.appendRow(COLUNAS);
      aba.setFrozenRows(1);
      aba.getRange(1, 1, 1, COLUNAS.length).setFontWeight('bold');
    }

    const ultima = aba.getLastRow();
    const ids = ultima > 1 ? aba.getRange(2, 1, ultima - 1, 1).getValues().map(l => String(l[0])) : [];
    let linha = ids.indexOf(String(d.id)) + 2;
    if (linha < 2) {
      linha = ultima + 1;
      aba.getRange(linha, 1, 1, 2).setValues([[d.id, new Date()]]);
    }

    COLUNAS.forEach((coluna, i) => {
      if (i < 2 || !(coluna in d.campos)) return;
      let v = d.campos[coluna];
      if (typeof v === 'string' && /^[=+\-@]/.test(v)) v = "'" + v;   // evita virar fórmula
      aba.getRange(linha, i + 1).setValue(v);
    });
    return resposta({ok: true});
  } finally {
    lock.releaseLock();
  }
}

function tokenOk(t) {
  return TOKEN !== 'TROQUE-POR-UMA-SENHA-LONGA' && String(t || '') === TOKEN;
}

function abaVendas() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  let aba = planilha.getSheetByName('Vendas');
  if (!aba) {
    aba = planilha.insertSheet('Vendas', planilha.getNumSheets());   // no fim, as leads continuam na 1ª aba
    aba.appendRow(COLUNAS_VENDAS);
    aba.setFrozenRows(1);
    aba.getRange(1, 1, 1, COLUNAS_VENDAS.length).setFontWeight('bold');
  }
  return aba;
}

// Grava várias vendas de uma vez. Mesma Transação = mesma linha; só as colunas recebidas mudam.
function salvarVendas(d) {
  if (!tokenOk(d.token)) return resposta({ok: false, erro: 'token inválido'});
  if (!Array.isArray(d.vendas)) return resposta({ok: false, erro: 'sem vendas'});

  const aba = abaVendas();
  const n = COLUNAS_VENDAS.length;
  const ultima = aba.getLastRow();
  const linhas = ultima > 1 ? aba.getRange(2, 1, ultima - 1, n).getValues() : [];
  const porTransacao = {};
  linhas.forEach((l, i) => { porTransacao[String(l[0])] = i; });

  d.vendas.forEach(v => {
    const id = String(v['Transação'] || '').trim();
    if (!id) return;
    let i = porTransacao[id];
    if (i === undefined) {
      i = linhas.length;
      linhas.push(COLUNAS_VENDAS.map(() => ''));
      porTransacao[id] = i;
    }
    COLUNAS_VENDAS.forEach((coluna, c) => {
      if (!(coluna in v) || coluna === 'Vendedora (ajuste)' || coluna === 'Canal (ajuste)') return;
      let valor = v[coluna];
      if (COLUNAS_DATA.indexOf(coluna) >= 0 && valor) {
        const data = new Date(valor);
        if (!isNaN(data)) valor = data;
      }
      if (typeof valor === 'string' && /^[=+\-@]/.test(valor)) valor = "'" + valor;   // evita virar fórmula
      linhas[i][c] = valor;
    });
    linhas[i][COLUNAS_VENDAS.indexOf('Atualizado em')] = new Date();
  });

  if (linhas.length) aba.getRange(2, 1, linhas.length, n).setValues(linhas);
  return resposta({ok: true, total: linhas.length});
}

// Leitura pro dashboard: ?tipo=vendas&token=...
function doGet(e) {
  const p = e && e.parameter || {};
  if (p.tipo !== 'vendas' || !tokenOk(p.token)) return resposta({ok: false, erro: 'token inválido'});

  const aba = abaVendas();
  const valores = aba.getDataRange().getValues();
  const cab = valores.shift() || [];
  const vendas = valores.map(l => {
    const o = {};
    cab.forEach((c, i) => { o[c] = l[i]; });
    return o;
  });

  // WhatsApps das leads do diagnóstico (1ª aba), pra reconhecer quem comprou depois de fazer o diagnóstico.
  const leads = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0].getDataRange().getValues();
  const colWa = leads.length ? leads[0].indexOf('WhatsApp') : -1;
  const colData = leads.length ? leads[0].indexOf('Data') : -1;
  const listaLeads = leads.slice(1).map(l => ({
    data: colData < 0 ? '' : l[colData],
    whatsapp: colWa < 0 ? '' : String(l[colWa] || ''),
  }));

  return resposta({ok: true, vendas: vendas, leads: listaLeads});
}

function resposta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
