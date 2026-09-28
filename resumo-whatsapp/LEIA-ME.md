# Resumo do dia do grupo de WhatsApp

Todo dia às 20h o bot manda no grupo um resumo do que rolou, pra quem não conseguiu acompanhar:

```
📋 Resumo do grupo · 28/09

🔴 Precisa da sua atenção
• Aula de quinta mudou pra 19h30 (aviso da Manu)
• Entregar o exercício do módulo 2 até domingo

📌 Decisões e combinados
• Hotseat vai ser gravado e fica no drive

❓ Perguntas sem resposta
• A Ana perguntou se dá pra trocar o horário da call

💬 O que rolou
• Troca de ideias sobre preço de mentoria
• Três alunas compartilharam resultados da semana

😴 Pode ignorar
• Bom dias, figurinhas e parabéns pra Ju 🎉
```

Tudo roda num Apps Script dentro de uma planilha do Google: não precisa de servidor.

- **uazapi** → manda cada mensagem do grupo pra planilha (aba **Mensagens**)
- **20h** → o Claude lê as mensagens do dia, escreve o resumo e a uazapi manda no grupo (fica salvo na aba **Resumos**)
- Áudios, imagens e figurinhas entram só como "[mandou um áudio]"; o conteúdo deles não é lido.
- Mensagens com mais de 30 dias são apagadas da planilha sozinhas.

## Antes de começar

- **Número do bot:** use um número exclusivo pro bot na uazapi (não o seu pessoal nem o do comercial) e coloque ele no grupo.
- **Chave da API do Claude:** crie em https://console.anthropic.com → API Keys.
- **Avise o grupo:** conte que tem um bot registrando as mensagens pra fazer o resumo do dia (LGPD e confiança).

## Instalação (uns 15 minutos)

**1. Planilha e código**
1. Crie uma planilha nova no Google Sheets (ex: "Resumo do grupo").
2. Extensões → Apps Script. Apague o que tiver, cole todo o conteúdo de `resumo-grupo.gs` e salve.
3. Configurações do projeto (engrenagem) → **Fuso horário: (GMT-03:00) São Paulo**.

**2. Propriedades do script** (ainda em Configurações do projeto → Propriedades do script → Adicionar)

| Propriedade | Valor |
|---|---|
| `UAZAPI_URL` | o endereço da sua instância, ex: `https://suaempresa.uazapi.com` |
| `UAZAPI_TOKEN` | o token da instância (painel da uazapi) |
| `ANTHROPIC_API_KEY` | a chave do Claude |
| `CONTEXTO_GRUPO` | opcional, mas faz muita diferença. Ex: *"Grupo das alunas da Aceleradora. Avisos da Manu e da Lahna, datas de aula, links de gravação e prazos de entrega são sempre prioridade."* |

**3. Publicar o webhook**
1. Implantar → Nova implantação → tipo **App da Web**.
   Executar como: **Eu**. Quem pode acessar: **Qualquer pessoa**. Implantar e autorizar.
2. No editor, escolha a função `instalar` e clique em **Executar**. Autorize.
3. Em "Registro de execução" aparece a **URL do webhook** (termina com `?chave=...`). Copie.

**4. Ligar na uazapi**
No painel da uazapi, na instância do bot → Webhook:
- URL: a que você copiou
- Eventos: **messages**
- Se tiver a opção de excluir mensagens, marque **wasSentByApi** (pra não gravar o próprio resumo)

**5. Escolher o grupo**
1. Mande qualquer mensagem no grupo.
2. No Apps Script, execute `verGrupos`. O registro mostra algo como
   `Aceleradora → 120363123456789012@g.us`.
3. Crie a propriedade `GRUPOS` com esse ID. Para mais de um grupo, separe os IDs por vírgula.

**6. Testar**
Depois de ter algumas mensagens na planilha, execute `testarResumo`. Ele escreve o resumo no registro **sem mandar no grupo**, então dá pra ajustar o `CONTEXTO_GRUPO` até ficar do seu jeito.

Pronto. A partir daí o resumo sai sozinho todo dia entre 20h e 21h. O Google não garante o minuto exato.

## Se algo não funcionar

- **A aba Mensagens não enche:** crie a propriedade `DEBUG` = `sim`. Cada webhook que chegar é salvo na aba **Debug**. Se a aba Debug também ficar vazia, a uazapi não está chamando a URL: confira a URL e os eventos. Depois de resolver, apague o `DEBUG`.
- **Mudou o código:** Implantar → Gerenciar implantações → editar → Versão: **Nova versão**. Assim a URL continua a mesma.
- **Erros do resumo das 20h:** aparecem em Apps Script → Execuções. O Google também manda um e-mail quando um gatilho falha.

## Ajustes rápidos (no topo do código)

- `HORA_DO_RESUMO`: 20 = 20h. Depois de mudar, rode `instalar` de novo.
- `MINIMO_DE_MENSAGENS`: abaixo disso não sai resumo (dia parado).
- `DIAS_GUARDADOS`: quanto tempo as mensagens ficam na planilha.

## Custo

- uazapi: o plano que você já tem.
- Claude: centavos por dia. Um grupo com umas 300 mensagens por dia fica abaixo de R$ 0,50 por resumo.
- Google Sheets e Apps Script: grátis.
