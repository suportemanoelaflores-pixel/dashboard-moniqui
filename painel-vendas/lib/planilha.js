// Conversa com o Apps Script da planilha (o mesmo das leads do diagnóstico).
// SHEET_WEBHOOK_URL = link do Apps Script · SHEET_TOKEN = senha combinada com o TOKEN do script.

export const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {'Content-Type': 'application/json', 'Cache-Control': 'no-store'},
  });

function config(){
  const url = (process.env.SHEET_WEBHOOK_URL || '').trim();
  const token = (process.env.SHEET_TOKEN || '').trim();
  if (!url || !token) throw new Error('SHEET_WEBHOOK_URL ou SHEET_TOKEN não configurado');
  return {url, token};
}

/** Grava/atualiza vendas na aba "Vendas" (mesma Transação = mesma linha). */
export async function salvarVendas(vendas){
  const {url, token} = config();
  const r = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'text/plain;charset=utf-8'},
    body: JSON.stringify({tipo: 'vendas', token, vendas}),
    redirect: 'follow',
    signal: AbortSignal.timeout(20000),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.ok) throw new Error(d.erro || `planilha respondeu ${r.status}`);
  return d;
}

/** Lê todas as vendas + os WhatsApps das leads do diagnóstico. */
export async function lerVendas(){
  const {url, token} = config();
  const r = await fetch(`${url}?tipo=vendas&token=${encodeURIComponent(token)}`, {
    redirect: 'follow',
    signal: AbortSignal.timeout(20000),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.ok) throw new Error(d.erro || `planilha respondeu ${r.status}`);
  return d;
}
