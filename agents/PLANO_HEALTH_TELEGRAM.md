# Plano de Healthcheck via Telegram

## Objetivo

Permitir que o status da API seja consultado pelo comando `/health` no Telegram, sem deixar o endpoint `GET /health` acessivel publicamente.

O resultado esperado e:

- usuario autorizado envia `/health` para o bot Telegram vinculado ao app
- o processo do bot valida que a mensagem veio do chat configurado
- o bot chama `GET /health` pela rede interna, usando `X-Internal-Api-Secret`
- a API responde somente para chamadas internas autenticadas
- o bot envia a resposta resumida de volta no Telegram

## Decisao de Arquitetura

Nao tentar identificar "Telegram" dentro da rota `/health`.

Motivo:

- o Telegram nao chama diretamente a API nesse fluxo
- quem chama a API e o proprio backend/bot
- headers como `User-Agent` ou origem HTTP nao provam identidade
- o controle real deve ser feito por rede interna, segredo compartilhado e autorizacao do chat Telegram

Portanto, `/health` deve continuar protegido pelo mesmo mecanismo interno da API:

```http
X-Internal-Api-Secret: <API_INTERNAL_SECRET>
```

O acesso "somente pelo Telegram bot" significa, na pratica:

1. a API nao possui dominio publico
2. `/health` exige `X-Internal-Api-Secret`
3. somente o processo do bot conhece esse segredo
4. o bot so aceita comandos vindos do `TELEGRAM_CHAT_ID` configurado

## Estado Atual Relevante

No backend atual:

- `src/server/server.ts` ja protege `/health` quando `API_REQUIRE_INTERNAL_AUTH=true`
- a protecao usa o header `X-Internal-Api-Secret`
- `src/config/env.ts` ja possui `API_INTERNAL_SECRET` e `API_REQUIRE_INTERNAL_AUTH`
- `src/notifier/telegram.notifier.ts` hoje apenas envia mensagens, ainda nao recebe comandos
- o `docker-compose.yml` expoe a porta `3000` apenas para outros containers com `expose`, nao com `ports`

Isso significa que a maior parte da protecao da API ja esta alinhada. O trabalho principal e criar um pequeno processo de comando do Telegram.

## Variaveis de Ambiente

Manter:

```env
TELEGRAM_BOT_TOKEN=token-do-bot
TELEGRAM_CHAT_ID=chat-autorizado
API_INTERNAL_SECRET=segredo-interno-forte
API_REQUIRE_INTERNAL_AUTH=true
```

Adicionar para o processo do bot:

```env
INTERNAL_API_BASE_URL=http://app:3000
TELEGRAM_COMMANDS_ENABLED=true
TELEGRAM_POLL_INTERVAL_MS=1000
```

Observacoes:

- `INTERNAL_API_BASE_URL` deve apontar para o nome interno do servico da API.
- No `docker-compose.yml` deste repositorio, o servico da API se chama `app`, entao o valor local entre containers e `http://app:3000`.
- `TELEGRAM_CHAT_ID` deve ser tratado como lista de permissao. Mensagens de qualquer outro chat devem ser ignoradas ou receber resposta generica.
- `API_INTERNAL_SECRET` nao deve ser enviado para o Telegram, logado, nem aparecer em mensagens de erro.

## Fluxo do Comando `/health`

1. O bot busca updates no Telegram via long polling com `getUpdates`.
2. Ao receber uma mensagem, valida:
   - `message.text` e exatamente `/health` ou comeca com `/health@NomeDoBot`
   - `message.chat.id` corresponde a `TELEGRAM_CHAT_ID`
3. Se o chat nao for autorizado:
   - nao chamar a API
   - opcionalmente responder `Comando nao autorizado.`
4. Se autorizado:
   - chamar `GET ${INTERNAL_API_BASE_URL}/health`
   - enviar o header `X-Internal-Api-Secret`
5. Interpretar a resposta:
   - `200`: API e banco saudaveis
   - `503`: API respondeu, mas banco ou dependencia critica falhou
   - `403`: segredo interno incorreto ou ausente
   - erro de rede: API inacessivel pela rede interna
6. Enviar resumo para o Telegram.

Exemplo de resposta saudavel:

```text
API health: ok
Database: ok
Uptime: 1234s
Timestamp: 2026-05-21T12:00:00.000Z
```

Exemplo de falha:

```text
API health: error
HTTP: 503
Database: unavailable
Timestamp: 2026-05-21T12:00:00.000Z
```

## Implementacao Recomendada

### 1. Criar cliente interno da API

Criar um modulo dedicado, por exemplo:

```text
src/server/internal-api.client.ts
```

Responsabilidades:

- montar URL a partir de `INTERNAL_API_BASE_URL`
- chamar `/health`
- sempre enviar `X-Internal-Api-Secret`
- usar timeout curto, por exemplo 5 segundos
- retornar objeto normalizado para o bot

### 2. Criar servico de comandos Telegram

Criar um modulo, por exemplo:

```text
src/notifier/telegram-command.service.ts
```

Responsabilidades:

- consumir updates do Telegram com `getUpdates`
- controlar `offset` para nao reprocessar mensagens antigas
- validar `TELEGRAM_CHAT_ID`
- rotear apenas comandos permitidos
- chamar o cliente interno da API quando receber `/health`
- responder usando `sendMessage`

Para MVP, long polling e mais simples que webhook porque:

- nao exige URL publica para receber chamadas do Telegram
- funciona com a API privada
- usa apenas conexao de saida do container para `api.telegram.org`

### 3. Criar entrada CLI do bot

Criar um entrypoint, por exemplo:

```text
src/cli/telegram-bot.ts
```

Responsabilidades:

- iniciar o loop de polling
- tratar `SIGINT` e `SIGTERM`
- logar inicio/parada sem imprimir tokens ou segredos

Adicionar scripts:

```json
{
  "dev:telegram-bot": "tsx src/cli/telegram-bot.ts",
  "start:telegram-bot": "node dist/cli/telegram-bot.js"
}
```

### 4. Atualizar Docker Compose

Adicionar um servico separado para comandos do Telegram:

```yaml
telegram-bot:
  build: .
  restart: unless-stopped
  environment:
    <<: *app-env
    INTERNAL_API_BASE_URL: ${INTERNAL_API_BASE_URL:-http://app:3000}
    TELEGRAM_COMMANDS_ENABLED: ${TELEGRAM_COMMANDS_ENABLED:-true}
    TELEGRAM_POLL_INTERVAL_MS: ${TELEGRAM_POLL_INTERVAL_MS:-1000}
  depends_on:
    app:
      condition: service_started
  command: pnpm start:telegram-bot
```

O servico `telegram-bot` nao precisa de `ports` nem de dominio publico.

### 5. Atualizar validacao de ambiente

Adicionar ao schema de `src/config/env.ts`:

- `INTERNAL_API_BASE_URL`
- `TELEGRAM_COMMANDS_ENABLED`
- `TELEGRAM_POLL_INTERVAL_MS`

Regra recomendada em producao:

- se `TELEGRAM_COMMANDS_ENABLED=true`, exigir `TELEGRAM_BOT_TOKEN`
- se `TELEGRAM_COMMANDS_ENABLED=true`, exigir `TELEGRAM_CHAT_ID`
- se `TELEGRAM_COMMANDS_ENABLED=true`, exigir `API_INTERNAL_SECRET`
- se `TELEGRAM_COMMANDS_ENABLED=true`, exigir `INTERNAL_API_BASE_URL`

## Protecoes Necessarias

### API

- manter `/health` dentro do hook de auth interna
- manter `API_REQUIRE_INTERNAL_AUTH=true` em producao
- nao publicar porta ou dominio publico da API
- nao criar excecao publica para `/health`

### Telegram

- aceitar `/health` apenas de `TELEGRAM_CHAT_ID`
- ignorar comandos de grupos ou usuarios nao configurados
- nao incluir detalhes sensiveis na resposta
- nao imprimir `TELEGRAM_BOT_TOKEN` ou `API_INTERNAL_SECRET` em logs

### Rede

- o bot deve chamar `http://app:3000/health` ou hostname interno equivalente
- o endpoint nao deve ser chamado por URL publica
- o container do bot precisa estar na mesma rede do container da API

## Testes Recomendados

### Backend

- `GET /health` sem header retorna `403` quando auth esta ativa
- `GET /health` com header errado retorna `403`
- `GET /health` com header correto retorna `200` quando banco esta ok
- `GET /health` com header correto retorna `503` quando banco esta indisponivel

### Bot

- mensagem `/health` de `TELEGRAM_CHAT_ID` chama a API interna
- mensagem `/health` de outro chat nao chama a API
- erro `403` da API gera mensagem clara de configuracao incorreta
- timeout de rede gera mensagem clara de API inacessivel
- updates antigos nao sao reprocessados ao reiniciar o bot

### Infra

- confirmar que `telegram-bot` nao tem `ports`
- confirmar que a API nao tem dominio publico no Coolify
- confirmar que `telegram-bot` resolve `app:3000`
- confirmar que `/health` nao responde a partir da internet

## Criterios de Aceitacao

- O comando `/health` funciona no Telegram para o chat autorizado.
- O comando `/health` nao funciona para chats nao autorizados.
- A chamada direta publica para `/health` nao funciona.
- A chamada interna para `/health` sem `X-Internal-Api-Secret` falha.
- A chamada interna para `/health` com segredo correto funciona.
- O bot nao expoe token, chat id sensivel ou segredo interno em logs/respostas.
- O bot nao precisa de webhook publico.

## Ordem de Implementacao

1. Adicionar variaveis de ambiente do bot e URL interna.
2. Criar cliente interno para `GET /health`.
3. Criar servico de comandos Telegram com long polling.
4. Criar entrypoint `src/cli/telegram-bot.ts`.
5. Adicionar scripts no `package.json`.
6. Adicionar servico `telegram-bot` no `docker-compose.yml`.
7. Adicionar testes de autorizacao do chat e chamada interna.
8. Validar no Docker Compose local.
9. Replicar a configuracao no Coolify sem expor API nem bot.

## Observacoes Futuras

Se no futuro for necessario usar webhook em vez de long polling, o webhook deve apontar para um endpoint publico separado e protegido por segredo de webhook do Telegram. Para o MVP atual, long polling e preferivel porque preserva a arquitetura privada: somente o frontend fica publico, enquanto API e bot continuam internos.
