// Webhook da Hotmart (versão 2.0.0). Cada compra, aprovação, reembolso etc. chega aqui
// e vira/atualiza uma linha na aba "Vendas" da planilha.
//
// Na Hotmart: Ferramentas → Webhook (API e notificações) → Cadastrar webhook
//   URL: https://SEU-SITE.netlify.app/.netlify/functions/hotmart   · versão 2.0.0 · eventos de compra
// O "hottok" que a Hotmart mostra vai no Netlify em HOTMART_HOTTOK.

import {json, salvarVendas} from '../lib/planilha.mjs';

const STATUS_POR_EVENTO = {
  PURCHASE_APPROVED: 'APPROVED', PURCHASE_COMPLETE: 'COMPLETE', PURCHASE_CANCELED: 'CANCELED',
  PURCHASE_REFUNDED: 'REFUNDED', PURCHASE_CHARGEBACK: 'CHARGEBACK', PURCHASE_PROTEST: 'PROTESTED',
  PURCHASE_BILLET_PRINTED: 'BILLET_PRINTED', PURCHASE_DELAYED: 'DELAYED', PURCHASE_EXPIRED: 'EXPIRED',
  PURCHASE_OUT_OF_SHOPPING_CART: 'ABANDONED',
};

const data = ms => ms ? new Date(Number(ms)).toISOString() : '';

export default async (req) => {
  if (req.method !== 'POST') return json({error: 'use POST'}, 405);
  const esperado = (process.env.HOTMART_HOTTOK || '').trim();
  if (!esperado) return json({error: 'HOTMART_HOTTOK não configurado'}, 500);

  let ev;
  try { ev = await req.json(); } catch { return json({error: 'json inválido'}, 400); }
  const hottok = req.headers.get('x-hotmart-hottok') || (ev && ev.hottok) || '';
  if (hottok !== esperado) return json({error: 'hottok inválido'}, 401);

  const d = ev && ev.data || {};
  const p = d.purchase || {};
  if (!p.transaction) return json({ok: true, ignorado: 'evento sem transação'});   // ex.: eventos de assinatura

  const origem = p.origin || {};
  const buyer = d.buyer || {};
  const venda = {
    'Transação': p.transaction,
    'Data': data(p.order_date || ev.creation_date),
    'Aprovada em': data(p.approved_date),
    'Status': p.status || STATUS_POR_EVENTO[ev.event] || ev.event || '',
    'Produto': d.product && d.product.name || '',
    'Oferta': p.offer && p.offer.code || '',
    'Valor': p.price && typeof p.price.value === 'number' ? p.price.value : '',
    'Moeda': p.price && p.price.currency_value || 'BRL',
    'Pagamento': p.payment && p.payment.type || '',
    'Parcelas': p.payment && p.payment.installments_number || '',
    'Comprador': buyer.name || '',
    'Email': buyer.email || '',
    'Telefone': buyer.checkout_phone || buyer.phone || '',
    'SRC': origem.src || '',
    'SCK': origem.sck || '',
    'Último evento': ev.event || '',
  };

  // Campo vazio não vai: um evento mais pobre (ex.: reembolso) não apaga o que já está na planilha.
  for (const k of Object.keys(venda)) if (venda[k] === '' || venda[k] == null) delete venda[k];

  try {
    await salvarVendas([venda]);
    return json({ok: true});
  } catch (e){
    // 5xx faz a Hotmart tentar de novo mais tarde.
    return json({error: 'falha ao salvar na planilha', detalhe: String(e && e.message || e)}, 502);
  }
};
