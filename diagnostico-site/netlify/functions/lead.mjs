// Recebe os dados da lead do diagnóstico e repassa pra planilha do Google (Apps Script).
// O link do Apps Script fica na variável de ambiente SHEET_WEBHOOK_URL do Netlify, nunca no navegador.
//
// POST /.netlify/functions/lead   { id, campos: { "Nome": "...", "WhatsApp": "...", ... } }
// Mesmo id = mesma linha na planilha (a linha vai sendo completada conforme a lead avança).

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {'Content-Type': 'application/json', 'Cache-Control': 'no-store'},
  });

export default async (req) => {
  if (req.method !== 'POST') return json({error: 'use POST'}, 405);
  const url = (process.env.SHEET_WEBHOOK_URL || '').trim();
  if (!url) return json({error: 'SHEET_WEBHOOK_URL não configurado'}, 500);

  let d;
  try { d = await req.json(); } catch { return json({error: 'json inválido'}, 400); }
  if (!d || typeof d.id !== 'string' || !/^[a-z0-9-]{8,40}$/i.test(d.id) || !d.campos || typeof d.campos !== 'object')
    return json({error: 'dados inválidos'}, 400);

  const campos = {};
  for (const [k, v] of Object.entries(d.campos).slice(0, 40)){
    if (v === null || v === undefined) continue;
    campos[String(k).slice(0, 60)] = typeof v === 'number' ? v : String(v).slice(0, 500);
  }

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'text/plain;charset=utf-8'},
      body: JSON.stringify({id: d.id, campos}),
      redirect: 'follow',
      signal: AbortSignal.timeout(9000),
    });
    return json({ok: r.ok}, r.ok ? 200 : 502);
  } catch (e){
    return json({error: 'falha ao salvar na planilha', detalhe: String(e && e.message || e)}, 502);
  }
};
