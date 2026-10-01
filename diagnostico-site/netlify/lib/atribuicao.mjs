// Quem vendeu e por onde a pessoa chegou.
// Os links rastreáveis levam dois parâmetros que a Hotmart guarda em cada venda:
//   src = canal        (ex.: stories)
//   sck = vendedora_canal (ex.: manu_stories)
// Pra mudar o nome da vendedora ou criar canal novo, é só editar as listas abaixo.
// O "id" vai no link e nunca deve mudar depois que os links estiverem rodando.

export const VENDEDORAS = [
  {id: 'manu', nome: 'Manu'},
  {id: 'giovana', nome: 'Giovana'},
];

export const CANAIS = [
  {id: 'stories', nome: 'Stories'},
  {id: 'manychat', nome: 'ManyChat'},
  {id: 'bio', nome: 'Link na bio'},
  {id: 'diagnostico', nome: 'Diagnóstico'},
  {id: 'whatsapp', nome: 'WhatsApp'},
  {id: 'direct', nome: 'Direct'},
];

export const SEM_VENDEDORA = {id: 'sem-vendedora', nome: 'Sem vendedora'};
export const SEM_CANAL = {id: 'sem-rastreio', nome: 'Sem rastreio'};

const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
const pedacos = s => norm(s).split(/[^a-z0-9]+/).filter(Boolean);

function acha(lista, texto){
  if (!texto) return null;
  const alvo = norm(texto);
  return lista.find(x => x.id === alvo || norm(x.nome) === alvo) || null;
}

/** Recebe a venda crua da planilha e devolve {vendedora, canal, origem}. Ajuste manual sempre ganha. */
export function atribuir({src, sck, ajusteVendedora, ajusteCanal, veioDoDiagnostico}){
  const tokens = [...pedacos(sck), ...pedacos(src)];
  let vendedora = acha(VENDEDORAS, ajusteVendedora) || VENDEDORAS.find(v => tokens.includes(v.id));
  let canal = acha(CANAIS, ajusteCanal) || CANAIS.find(c => tokens.includes(c.id));
  let origem = ajusteVendedora || ajusteCanal ? 'ajuste' : (vendedora || canal) ? 'link' : 'nenhuma';
  if (!canal && veioDoDiagnostico){
    canal = CANAIS.find(c => c.id === 'diagnostico');
    if (origem === 'nenhuma') origem = 'whatsapp-do-diagnostico';
  }
  return {vendedora: vendedora || SEM_VENDEDORA, canal: canal || SEM_CANAL, origem};
}

/** Status da Hotmart que contam como venda feita. */
export const STATUS_PAGOS = ['APPROVED', 'COMPLETE', 'COMPLETED'];
export const STATUS_DEVOLVIDOS = ['REFUNDED', 'CHARGEBACK', 'PROTESTED', 'PARTIALLY_REFUNDED'];

/** O relatório da Hotmart (CSV) e ajustes na planilha vêm em português; o webhook, em inglês. */
const STATUS_PT = {
  APROVADO: 'APPROVED', APROVADA: 'APPROVED', COMPLETO: 'COMPLETE', COMPLETA: 'COMPLETE', CONCLUIDO: 'COMPLETE',
  REEMBOLSADO: 'REFUNDED', REEMBOLSADA: 'REFUNDED', CANCELADO: 'CANCELED', CANCELADA: 'CANCELED',
  EXPIRADO: 'EXPIRED', EXPIRADA: 'EXPIRED', ATRASADO: 'DELAYED', 'AGUARDANDO PAGAMENTO': 'WAITING_PAYMENT',
  'BOLETO IMPRESSO': 'BILLET_PRINTED', 'PEDIDO DE REEMBOLSO': 'PROTESTED', DISPUTA: 'PROTESTED',
  'PARCIALMENTE REEMBOLSADO': 'PARTIALLY_REFUNDED',
};
export function normalizarStatus(s){
  const t = norm(s).toUpperCase();
  return STATUS_PT[t] || t.replace(/\s+/g, '_');
}
