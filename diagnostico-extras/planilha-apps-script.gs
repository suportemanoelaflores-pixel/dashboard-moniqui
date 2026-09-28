/**
 * Planilha de leads do Diagnóstico de Posicionamento (LucraDiva)
 *
 * Como instalar:
 * 1. Na planilha: Extensões → Apps Script. Apaga o que tiver e cola este código. Salva.
 * 2. Pra deixar a planilha bonita: no topo do editor, escolhe a função "deixarBonita" e clica em ▶ Executar
 *    (na primeira vez o Google pede autorização). Pode rodar de novo quando quiser, não apaga nenhum lead.
 * 3. Implantar → Nova implantação → tipo "App da Web".
 *    Executar como: "Eu". Quem pode acessar: "Qualquer pessoa". Implantar e autorizar.
 * 4. Copia o "URL do app da Web" e cola no Netlify em Environment variables → SHEET_WEBHOOK_URL.
 *
 * Cada lead é uma linha, e a mais nova fica sempre em cima.
 * A linha vai sendo completada conforme a lead avança no diagnóstico.
 */

const COLUNAS = [
  'ID', 'Data', 'Etapa', 'Nome', 'WhatsApp', 'Chamar no WhatsApp', 'Instagram', 'Seguidores',
  'Posts nos últimos 30 dias', 'Engajamento (%)', 'Nicho', 'Maior desafio', 'Faturamento',
  'Vende pelo perfil', 'Temperatura', 'Nota', 'Ver pra crer', 'Problema + solução', 'Gancho',
  'Personalidade', 'Ingrediente mais fraco', 'Clicou no WhatsApp',
];

/* Identidade da Manu */
const AZUL = '#2F3DBC', AZUL_ESCURO = '#1D2680', ROSA = '#E18B9F', ROSA_CLARO = '#FDF1F4';

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents);
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
      // lead nova entra no topo (logo abaixo do cabeçalho)
      aba.insertRowBefore(2);
      linha = 2;
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

function resposta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Deixa a planilha com a cara da Manu. Rode uma vez pelo editor (▶ Executar).
 * Pode rodar de novo quando quiser: só mexe no visual, nunca nos dados.
 */
function deixarBonita() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const aba = ss.getSheets()[0];
  const n = COLUNAS.length;
  const col = nome => COLUNAS.indexOf(nome) + 1;

  aba.setName('Leads');
  aba.setTabColor(ROSA);
  if (aba.getMaxRows() < 500) aba.insertRowsAfter(aba.getMaxRows(), 500 - aba.getMaxRows());
  const linhas = aba.getMaxRows() - 1;
  const corpo = aba.getRange(2, 1, linhas, n);

  // Cabeçalho
  aba.getRange(1, 1, 1, n).setValues([COLUNAS])
    .setBackground(AZUL).setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(10)
    .setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
  aba.setRowHeight(1, 46);
  aba.setFrozenRows(1);
  aba.setFrozenColumns(col('Nome'));

  // Corpo
  corpo.setFontSize(10).setVerticalAlignment('middle').setFontColor('#1B1D4A');
  aba.setRowHeightsForced(2, linhas, 30);

  // Larguras
  const larguras = {
    'ID': 60, 'Data': 125, 'Etapa': 180, 'Nome': 170, 'WhatsApp': 130, 'Chamar no WhatsApp': 200,
    'Instagram': 150, 'Seguidores': 95, 'Posts nos últimos 30 dias': 95, 'Engajamento (%)': 100,
    'Nicho': 170, 'Maior desafio': 190, 'Faturamento': 150, 'Vende pelo perfil': 210,
    'Temperatura': 125, 'Nota': 70, 'Ver pra crer': 80, 'Problema + solução': 90, 'Gancho': 75,
    'Personalidade': 95, 'Ingrediente mais fraco': 170, 'Clicou no WhatsApp': 100,
  };
  COLUNAS.forEach((c, i) => aba.setColumnWidth(i + 1, larguras[c] || 120));
  aba.hideColumns(col('ID'));   // o ID é só pro sistema, a vendedora não precisa ver

  // Formatos de número
  aba.getRange(2, col('Data'), linhas).setNumberFormat('dd/mm/yyyy hh:mm');
  aba.getRange(2, col('Seguidores'), linhas).setNumberFormat('#,##0');
  aba.getRange(2, col('Engajamento (%)'), linhas).setNumberFormat('0.0"%"');
  aba.getRange(2, col('Nota'), linhas).setNumberFormat('0.0');
  ['Data', 'WhatsApp', 'Seguidores', 'Posts nos últimos 30 dias', 'Engajamento (%)', 'Temperatura', 'Nota',
   'Ver pra crer', 'Problema + solução', 'Gancho', 'Personalidade', 'Clicou no WhatsApp']
    .forEach(c => aba.getRange(2, col(c), linhas).setHorizontalAlignment('center'));
  aba.getRange(2, col('Chamar no WhatsApp'), linhas).setFontColor(AZUL).setFontWeight('bold');
  aba.getRange(2, col('Nome'), linhas).setFontWeight('bold');

  // Linhas alternadas branco / rosinha
  aba.getBandings().forEach(b => b.remove());
  aba.getRange(1, 1, linhas + 1, n).applyRowBanding()
    .setHeaderRowColor(AZUL).setFirstRowColor('#FFFFFF').setSecondRowColor(ROSA_CLARO);

  // Cores automáticas
  const regras = [];
  const pinta = (coluna, cond, fundo, letra) => {
    let r = SpreadsheetApp.newConditionalFormatRule();
    r = cond(r).setBackground(fundo).setFontColor(letra).setBold(true)
      .setRanges([aba.getRange(2, col(coluna), linhas)]);
    regras.push(r.build());
  };
  const igual = t => r => r.whenTextEqualTo(t);
  const comeca = t => r => r.whenTextStartsWith(t);
  // Temperatura
  pinta('Temperatura', igual('Água e sal'), '#E3ECF7', '#1F3A68');
  pinta('Temperatura', igual('Morno'), '#FBE9CF', '#7A4A00');
  pinta('Temperatura', igual('Quase no ponto'), '#F8D3DC', '#8A1F3D');
  pinta('Temperatura', igual('Com Molho'), ROSA, '#FFFFFF');
  // Etapa: quanto mais longe no funil, mais forte
  pinta('Etapa', comeca('5.'), '#D6F5E1', '#11743A');
  pinta('Etapa', comeca('4.'), '#E6E8FA', AZUL_ESCURO);
  pinta('Etapa', comeca('3.'), '#F3F4FB', AZUL);
  pinta('Etapa', comeca('1.'), '#F4F4F4', '#6B6B6B');
  pinta('Etapa', comeca('2.'), '#F4F4F4', '#6B6B6B');
  // Clicou no WhatsApp
  pinta('Clicou no WhatsApp', igual('SIM'), '#D6F5E1', '#11743A');
  // Notas dos ingredientes: vermelho quando está fraco, verde quando está com molho
  ['Ver pra crer', 'Problema + solução', 'Gancho', 'Personalidade'].forEach(c => {
    pinta(c, r => r.whenNumberLessThan(5), '#FCE4E4', '#A1242B');
    pinta(c, r => r.whenNumberGreaterThanOrEqualTo(8), '#D6F5E1', '#11743A');
  });
  aba.setConditionalFormatRules(regras);

  // Filtro no cabeçalho pra vendedora ordenar e filtrar
  if (aba.getFilter()) aba.getFilter().remove();
  aba.getRange(1, 1, linhas + 1, n).createFilter();

  // Borda de baixo no cabeçalho
  aba.getRange(1, 1, 1, n).setBorder(null, null, true, null, null, null, ROSA, SpreadsheetApp.BorderStyle.SOLID_THICK);

  SpreadsheetApp.getActive().toast('Planilha arrumada com a cara da Manu 🌶️', 'Pronto!', 5);
}
