/**
 * Planilha de leads do Diagnóstico do Perfil (LucraDiva)
 *
 * Como instalar:
 * 1. Na planilha: Extensões → Apps Script. Apaga o que tiver e cola este código. Salva.
 * 2. Implantar → Nova implantação → tipo "App da Web".
 *    Executar como: "Eu". Quem pode acessar: "Qualquer pessoa". Implantar e autorizar.
 * 3. Copia o "URL do app da Web" e cola no Netlify em Environment variables → SHEET_WEBHOOK_URL.
 *
 * Cada lead é uma linha. A linha vai sendo completada conforme a lead avança no diagnóstico.
 */

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

function resposta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
