// Dados do dashboard de vendas. Protegido pela senha DASHBOARD_SENHA (variável do Netlify).
//
// GET  /.netlify/functions/vendas            (header x-senha)  → {vendedoras, canais, vendas: [...]}
// POST /.netlify/functions/vendas            (header x-senha)  {vendas: [{Transação, Data, ...}]}
//      importa o relatório de vendas da Hotmart (CSV) pra planilha, sem duplicar.

import {createHash, timingSafeEqual} from 'node:crypto';
import {json, lerVendas, salvarVendas} from '../lib/planilha.mjs';
import {VENDEDORAS, CANAIS, SEM_VENDEDORA, SEM_CANAL, META_MENSAL, STATUS_PAGOS, STATUS_DEVOLVIDOS, STATUS_PENDENTES, atribuir, normalizarStatus} from '../lib/atribuicao.mjs';

const COLUNAS_IMPORTAVEIS = ['Transação', 'Data', 'Aprovada em', 'Status', 'Produto', 'Oferta', 'Valor', 'Moeda',
  'Pagamento', 'Parcelas', 'Comprador', 'Email', 'Telefone', 'SRC', 'SCK'];

const hash = s => createHash('sha256').update(String(s)).digest();
function senhaOk(req){
  const certa = (process.env.DASHBOARD_SENHA || '').trim();
  const veio = (req.headers.get('x-senha') || '').trim();
  return !!certa && !!veio && timingSafeEqual(hash(certa), hash(veio));
}

const digitos = s => String(s || '').replace(/\D/g, '');
const numero = v => {
  if (typeof v === 'number') return v;
  const s = String(v || '').replace(/[^\d,.-]/g, '');
  if (!s) return 0;
  // "1.497,00" (Brasil) ou "1497.00"
  const n = /,\d{1,2}$/.test(s) ? Number(s.replace(/\./g, '').replace(',', '.')) : Number(s.replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
};
const dataIso = v => {
  if (!v) return '';
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d) ? String(v) : d.toISOString();
};

export default async (req) => {
  if (!process.env.DASHBOARD_SENHA) return json({error: 'DASHBOARD_SENHA não configurado'}, 500);
  if (!senhaOk(req)) return json({error: 'senha incorreta'}, 401);

  try {
    if (req.method === 'GET') return json(await montarDashboard());
    if (req.method === 'POST') return json(await importar(req));
    return json({error: 'método não suportado'}, 405);
  } catch (e){
    return json({error: String(e && e.message || e)}, 502);
  }
};

async function montarDashboard(){
  const d = await lerVendas();
  const vendas = d.vendas || [];
  // Planilha antiga mandava só os WhatsApps; a nova manda {data, whatsapp}.
  const listaLeads = d.leads || (d.whatsappsLeads || []).map(whatsapp => ({whatsapp, data: ''}));
  // Final do número (8 dígitos) resolve 9º dígito e DDI diferentes.
  const leads = new Set(listaLeads.map(l => digitos(l.whatsapp).slice(-8)).filter(w => w.length === 8));

  const lista = vendas.filter(v => v['Transação']).map(v => {
    const status = normalizarStatus(v['Status']);
    const tel = digitos(v['Telefone']).slice(-8);
    const fezDiagnostico = tel.length === 8 && leads.has(tel);
    const {vendedora, canal, origem} = atribuir({
      src: v['SRC'], sck: v['SCK'],
      ajusteVendedora: v['Vendedora (ajuste)'], ajusteCanal: v['Canal (ajuste)'],
      veioDoDiagnostico: fezDiagnostico,
    });
    return {
      transacao: String(v['Transação']),
      data: dataIso(v['Aprovada em'] || v['Data']),
      status,
      pago: STATUS_PAGOS.includes(status),
      devolvido: STATUS_DEVOLVIDOS.includes(status),
      pendente: STATUS_PENDENTES.includes(status),
      produto: String(v['Produto'] || ''),
      valor: numero(v['Valor']),
      moeda: String(v['Moeda'] || 'BRL'),
      pagamento: String(v['Pagamento'] || ''),
      parcelas: Number(v['Parcelas']) || 1,
      comprador: String(v['Comprador'] || ''),
      telefone: digitos(v['Telefone']),
      fezDiagnostico,
      vendedora, canal, origem,
      src: String(v['SRC'] || ''), sck: String(v['SCK'] || ''),
    };
  }).sort((a, b) => (b.data || '').localeCompare(a.data || ''));

  return {
    atualizadoEm: new Date().toISOString(),
    vendedoras: [...VENDEDORAS, SEM_VENDEDORA],
    canais: [...CANAIS, SEM_CANAL],
    metaMensal: META_MENSAL,
    leadsDiagnostico: listaLeads.map(l => dataIso(l.data)).filter(Boolean),
    vendas: lista,
  };
}

async function importar(req){
  let d;
  try { d = await req.json(); } catch { throw new Error('json inválido'); }
  if (!d || !Array.isArray(d.vendas)) throw new Error('mande {vendas: [...]}');
  if (d.vendas.length > 3000) throw new Error('máximo de 3000 vendas por vez');

  const limpas = [];
  for (const v of d.vendas){
    if (!v || !v['Transação']) continue;
    const o = {};
    for (const c of COLUNAS_IMPORTAVEIS){
      if (v[c] === undefined || v[c] === null || v[c] === '') continue;
      o[c] = c === 'Valor' ? numero(v[c]) : String(v[c]).slice(0, 300);
    }
    o['Último evento'] = 'IMPORTADO_CSV';
    limpas.push(o);
  }
  for (let i = 0; i < limpas.length; i += 500) await salvarVendas(limpas.slice(i, i + 500));
  return {ok: true, importadas: limpas.length};
}
