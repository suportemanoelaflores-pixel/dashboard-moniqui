# Painel de vendas — quem vendeu e de onde veio

Página: `https://SEU-SITE.netlify.app/vendas/` (com senha) · Exemplo sem senha: `/vendas/?demo`

## Como funciona

1. **Links rastreáveis** — na aba *Criar links* você cola o link do checkout da Hotmart,
   escolhe **quem vai mandar** (Manu ou Giovana) e **onde vai ser usado** (stories, ManyChat,
   bio, diagnóstico, WhatsApp, direct). O link sai com:
   - `src=<canal>` e `sck=<vendedora>_<canal>` → a Hotmart guarda esses dois em cada venda;
   - `utm_source`, `utm_medium`, `utm_content`, `utm_campaign` → pro Google Analytics.
2. **Hotmart avisa cada venda** (webhook) → `/.netlify/functions/hotmart` → aba **Vendas** da planilha.
   Aprovação, reembolso, chargeback etc. atualizam a mesma linha (mesma Transação).
3. **O painel** lê a planilha e mostra faturamento por vendedora, por canal e o cruzamento dos dois.
4. **Sem link?** Se o telefone de quem comprou é o mesmo WhatsApp de uma lead do diagnóstico,
   a venda conta como canal *Diagnóstico*. E dá pra corrigir qualquer venda na planilha,
   nas colunas **Vendedora (ajuste)** / **Canal (ajuste)** (ex.: `giovana`, `stories`).
5. **Vendas antigas** — aba *Importar*: sobe o CSV do relatório de vendas da Hotmart.

## Configuração (uma vez)

1. **Planilha** — cola o `planilha-apps-script.gs` atualizado no Apps Script, troca o `TOKEN`
   por uma senha longa e publica uma **nova versão** (Implantar → Gerenciar implantações → lápis → Nova versão).
2. **Netlify → Environment variables**
   | Variável | O que é |
   |---|---|
   | `SHEET_WEBHOOK_URL` | já existe (link do Apps Script) |
   | `SHEET_TOKEN` | a mesma senha do `TOKEN` do Apps Script |
   | `DASHBOARD_SENHA` | senha pra entrar no painel |
   | `HOTMART_HOTTOK` | o hottok da Hotmart (passo 3) |
   Depois: *Deploys → Trigger deploy*.
3. **Hotmart** — Ferramentas → Webhook (API e notificações) → Cadastrar:
   URL `https://SEU-SITE.netlify.app/.netlify/functions/hotmart`, versão **2.0.0**,
   eventos de compra (aprovada, completa, cancelada, reembolso, chargeback, pedido de reembolso,
   atrasada, boleto impresso, expirada). Copia o **hottok** pro Netlify.
4. **Nome da vendedora / canais novos** — `diagnostico-site/netlify/lib/atribuicao.mjs`.
   O `id` vai dentro dos links: não mude depois que os links estiverem rodando (o `nome` pode).

## Pro redesign (Claude Design)

A página `diagnostico-site/vendas/index.html` é só estrutura. Pode trocar todo o CSS/HTML,
desde que os `id`s usados no `<script>` continuem existindo (ou o script seja adaptado).
Use `?demo` pra ver com dados de exemplo.

**Dados** — `GET /.netlify/functions/vendas` com header `x-senha`:

```json
{
  "atualizadoEm": "2026-09-30T12:00:00.000Z",
  "vendedoras": [{"id": "manu", "nome": "Manu"}, {"id": "giovana", "nome": "Giovana"}, {"id": "sem-vendedora", "nome": "Sem vendedora"}],
  "canais": [{"id": "stories", "nome": "Stories"}, "...", {"id": "sem-rastreio", "nome": "Sem rastreio"}],
  "vendas": [{
    "transacao": "HP1234567890", "data": "2026-09-25T17:03:10.000Z",
    "status": "APPROVED", "pago": true, "devolvido": false,
    "produto": "Aceleradora Pronta Pra Vender", "valor": 5000, "moeda": "BRL", "pagamento": "PIX",
    "comprador": "Ana Paula",
    "vendedora": {"id": "giovana", "nome": "Giovana"},
    "canal": {"id": "stories", "nome": "Stories"},
    "origem": "link",
    "src": "stories", "sck": "giovana_stories"
  }]
}
```

`origem`: `link` (veio pelo link rastreável), `ajuste` (corrigido na planilha),
`whatsapp-do-diagnostico` (telefone bateu com lead do diagnóstico) ou `nenhuma`.
Contam como venda só as com `pago: true`; `devolvido: true` = reembolso/chargeback.

Telas atuais: **Painel** (filtro de período e produto, 4 números, barras por vendedora e por canal,
tabela vendedora × canal) · **Vendas** (lista com filtros) · **Criar links** · **Importar**.
