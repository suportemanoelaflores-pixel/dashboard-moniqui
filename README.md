# dashboard-moniqui

- `index.html`: dashboard de leads
- `diagnostico/index.html`: quiz **Diagnóstico de Perfil: morno ou com molho? 🌶️**. Termina num botão que abre o WhatsApp com o diagnóstico já escrito na mensagem, para fechar a venda da LucraDiva por lá.

## Configurar o diagnóstico

Tudo o que tu precisa editar fica no bloco `CONFIG`, no topo do `<script>` em `diagnostico/index.html`:

| Campo | O que é |
|---|---|
| `whatsapp` | **Obrigatório.** Número que recebe as leads, só com números: `55` + DDD + número (ex.: `5551999999999`) |
| `avatar` | URL da tua foto (quadrada) para aparecer no chat. Se ficar vazio, aparecem as iniciais "MF" |
| `webhookUrl` | Opcional. Salva cada lead numa planilha (veja abaixo) |
| `senhaEquipe` | **Troque antes de publicar.** Senha que a vendedora digita para abrir a análise completa |
| `oferta` | Nome, frase e benefícios da LucraDiva mostrados no card final |

## Como a vendedora recebe a análise

A lead **não recebe** a análise completa sozinha: ela só vê o resumo no quiz e depende da vendedora para receber o resto.

1. **A lead chama no WhatsApp** com o resumo já escrito (nome, @, nota, gargalo, desafio, faturamento). A mensagem **não** leva o link da análise.
2. **A vendedora abre a análise** pelo link que chega **só para a equipe**: no e-mail do Netlify Forms (ou na planilha), no campo `link_analise`. Ela encontra a lead pelo nome, @ ou WhatsApp.
3. **A página pede a senha da equipe** (`CONFIG.senhaEquipe`), pedida só na primeira vez em cada celular. Mostra o roteiro de condução de acordo com o gargalo, os 3 ingredientes com "o que fazer" e todas as respostas.
4. **Botão "Copiar análise pra mandar no WhatsApp"**: copia a análise já formatada (sem o roteiro) para a vendedora entregar na conversa.

> A senha é uma trava simples, suficiente para a lead não abrir a análise sozinha. Não guarde nada sigiloso nessa página.

### Ligar o Netlify Forms (uma vez só)

1. Suba o site no Netlify.
2. Vá em **Site configuration → Forms** e clique em **Enable form detection**. Depois faça **um novo deploy** para o Netlify enxergar o formulário.
3. Em **Forms → Form notifications → Add notification → Email notification**, coloque o e-mail da vendedora. Ela passa a receber um e-mail por lead.

O plano grátis do Netlify aceita **100 envios por mês**. Se passar disso, use a planilha abaixo (não tem limite).

## (Opcional) Salvar as leads numa planilha do Google

1. Crie uma planilha e, na linha 1, coloque os cabeçalhos:
   `data, evento, nome, whatsapp, instagram, nicho, seguidores, frequencia, stories, conteudos, clareza, caminho, vende_perfil, faturamento, dificuldade, interesse, resultado, nota, gargalo, nota_personalidade, nota_qualificacao, nota_comercial, link_analise, roteiro_vendedora`
2. Vá em **Extensões → Apps Script**, cole o código abaixo e clique em **Implantar → Nova implantação → App da Web** (Executar como: *você*; Quem pode acessar: *Qualquer pessoa*).
3. Cole a URL gerada em `CONFIG.webhookUrl`.

```js
function doPost(e) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  sh.appendRow(head.map(h => e.parameter[h] || ''));
  return ContentService.createTextOutput('ok');
}
```

A planilha recebe uma linha com `evento = diagnostico_concluido` quando a lead termina o quiz e outra com `clicou_whatsapp` quando ela clica no botão. Assim tu consegue chamar quem terminou e não clicou. Os nomes das colunas (`nome`, `whatsapp`, `instagram`, `faturamento`, `dificuldade`, `interesse`) são os que o dashboard reconhece na importação por CSV.
