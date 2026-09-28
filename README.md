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
| `oferta` | Nome, frase e benefícios da LucraDiva mostrados no card final |

## (Opcional) Salvar as leads numa planilha do Google

1. Crie uma planilha e, na linha 1, coloque os cabeçalhos:
   `data, evento, nome, whatsapp, instagram, nicho, seguidores, frequencia, stories, conteudos, clareza, caminho, vende_perfil, faturamento, dificuldade, interesse, resultado, nota, gargalo, nota_personalidade, nota_qualificacao, nota_comercial, origem`
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
