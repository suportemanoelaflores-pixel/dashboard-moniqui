/**
 * Lista VIP · Black das Divas
 * Recebe cada cadastro da página e coloca na aba "Leads" da planilha.
 *
 * Como instalar (uma vez só):
 * 1. Na planilha: Extensões → Apps Script. Apaga o que tiver e cola este código. Salva.
 * 2. Implantar → Nova implantação → engrenagem → "App da Web".
 *    Executar como: "Eu". Quem pode acessar: "Qualquer pessoa". Implantar e autorizar.
 * 3. Copia o "URL do app da Web" (termina em /exec) e cola em PLANILHA_URL no index.html da página.
 *
 * Se a mesma pessoa se cadastrar de novo (mesmo e-mail ou mesmo WhatsApp),
 * a linha dela é atualizada em vez de duplicar. Status e observações não são mexidos.
 */

const PLANILHA_ID = '1KlYJ3BxGfckFiMx3b6nkIXI5dWuPv3Vz2StLe89kYyk';
const ABA = 'Leads';
const PRIMEIRA_LINHA = 4; // linhas 1 a 3 são título, total e cabeçalho

function doPost(e) {
  const p = (e && e.parameter) || {};
  const nome = limpar(p.nome, 80);
  const email = limpar(p.email, 120).toLowerCase();
  const whatsapp = limpar(p.whatsapp, 20);
  const origem = limpar(p.origem, 120) || 'direto';
  const digitos = whatsapp.replace(/\D/g, '');

  if (!nome || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || digitos.length < 10 || p.site) {
    return resposta({ok: false});
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const aba = SpreadsheetApp.openById(PLANILHA_ID).getSheetByName(ABA);
    const ultima = Math.max(aba.getLastRow(), PRIMEIRA_LINHA - 1);

    // Já está na lista? Procura pelo e-mail (C) e pelo WhatsApp (D)
    let linha = 0;
    if (ultima >= PRIMEIRA_LINHA) {
      const dados = aba.getRange(PRIMEIRA_LINHA, 3, ultima - PRIMEIRA_LINHA + 1, 2).getValues();
      const i = dados.findIndex(([em, wa]) =>
        String(em).toLowerCase() === email || String(wa).replace(/\D/g, '') === digitos);
      if (i >= 0) linha = PRIMEIRA_LINHA + i;
    }

    const nova = !linha;
    if (nova) linha = ultima + 1;

    if (nova) {
      aba.getRange(linha, 1, 1, 7).setValues([[new Date(), nome, email, whatsapp, '', 'Novo', origem]]);
    } else {
      aba.getRange(linha, 2, 1, 3).setValues([[nome, email, whatsapp]]);
    }

    // Link pra abrir a conversa no WhatsApp
    const numero = digitos.length <= 11 ? '55' + digitos : digitos;
    const primeiro = nome.split(' ')[0];
    const msg = encodeURIComponent('Oi, ' + primeiro + '! Aqui é a Manu 💙');
    aba.getRange(linha, 5).setRichTextValue(
      SpreadsheetApp.newRichTextValue().setText('Chamar')
        .setLinkUrl('https://wa.me/' + numero + '?text=' + msg).build());

    return resposta({ok: true, nova: nova});
  } finally {
    lock.releaseLock();
  }
}

// Abrir o link /exec no navegador mostra isso: serve pra testar se está no ar
function doGet() {
  return resposta({ok: true, lista: 'Black das Divas'});
}

function limpar(v, max) {
  let s = String(v || '').trim().replace(/\s+/g, ' ').slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s; // não deixa virar fórmula
  return s;
}

function resposta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
