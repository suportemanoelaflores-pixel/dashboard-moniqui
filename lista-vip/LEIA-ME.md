# Lista VIP · Black das Divas

Página de captura da Lista VIP. Cada pessoa que preenche vira uma linha na planilha
[Lista VIP · Black das Divas](https://docs.google.com/spreadsheets/d/1KlYJ3BxGfckFiMx3b6nkIXI5dWuPv3Vz2StLe89kYyk/edit).

## O que tem na pasta

- `index.html`: a página (copy igual ao design, versão "Oferta única")
- `assets/`: foto da Manu (webp + jpg, já otimizadas)
- `fonts/`: Advercase
- `planilha-apps-script.gs`: o código que liga a página à planilha

## Passo 1: ligar a planilha (5 minutos, uma vez só)

1. Abre a planilha → menu **Extensões → Apps Script**.
2. Apaga o que tiver lá, cola todo o conteúdo de `planilha-apps-script.gs` e clica em salvar.
3. **Implantar → Nova implantação** → na engrenagem escolhe **App da Web**.
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
4. Clica em **Implantar** e autoriza com a sua conta do Google
   (se aparecer "O Google não verificou este app": Avançado → Acessar).
5. Copia o **URL do app da Web** (termina em `/exec`).
6. No `index.html`, procura `const PLANILHA_URL = '';` e cola o link entre as aspas:
   `const PLANILHA_URL = 'https://script.google.com/macros/s/.../exec';`

## Passo 2: colocar no site (Hostinger)

1. hPanel → **Arquivos → Gerenciador de arquivos** → abre `public_html`.
2. Cria a pasta `lista-vip` e envia pra dentro dela o conteúdo desta pasta
   (`index.html`, `assets/`, `fonts/`). O `.gs` e este arquivo não precisam ir.
3. A página fica em **https://manoelaflores.com/lista-vip/**

Por ser uma pasta própria, o WordPress não interfere no visual nem no carregamento.

## Passo 3: testar

Preenche a página com seus dados. Em segundos aparece uma linha nova na aba **Leads**
e os números da aba **Resumo** mudam. Depois é só apagar a linha de teste.

## Como a planilha funciona

- **Resumo**: total na lista, quem entrou hoje, últimos 7 dias, cupons enviados,
  tabela e gráfico de entradas por dia e contagem por status.
- **Leads**: uma linha por pessoa. A coluna **Conversa** tem o link "Chamar" que abre o
  WhatsApp dela com "Oi, {nome}! Aqui é a Manu 💙" já escrito. A coluna **Status** tem
  as opções Novo, Chamada no WhatsApp, Cupom enviado e Comprou, cada uma com uma cor.
- Se a mesma pessoa se cadastrar duas vezes (mesmo e-mail ou WhatsApp), a linha dela é
  atualizada, sem duplicar.
- **Origem** mostra de onde ela veio. Use links com UTM pra saber o que traz mais gente,
  ex.: `manoelaflores.com/lista-vip/?utm_source=instagram&utm_medium=bio`.

## Se mudar o código do Apps Script depois

Implantar → **Gerenciar implantações** → lápis → Versão: **Nova versão** → Implantar.
Assim o link `/exec` continua o mesmo.
