# Plano de Protecao da API

## Objetivo

Proteger a API para uso pessoal e MVP com uma barreira simples, rapida de implementar e suficiente para reduzir o risco principal: a API ficar acessivel diretamente pela internet.

Prioridade do MVP:

1. Tirar a API da exposicao publica.
2. Manter o frontend como unico ponto publico.
3. Usar uma senha interna via header apenas entre o servidor do frontend e a API.

Este plano nao tenta implementar seguranca robusta, multiusuario, JWT, RBAC, auditoria por usuario ou login completo. Para uso pessoal e primeira versao, isso seria custo extra sem beneficio proporcional.

## Estado Atual da API

- A API Fastify esta exposta publicamente.
- `API_CORS_ORIGIN` limita apenas requisicoes cross-origin feitas pelo navegador.
- Abertura direta da URL da API, chamadas por `curl`, Postman ou qualquer outro cliente continuam possiveis.
- O README ja registra a limitacao atual: nao existe auth embutida na API e, quando exposta, ela deve ficar atras de outra camada de protecao.
- O `docker-compose.yml` atual publica a porta do servico `app` com `ports: ["3000"]`; para deploy privado, a API deve ficar apenas na rede interna do ambiente.

## Verificacao do Frontend

Repositorio verificado:

- `arthur-mendonca/job-scrapper-front`

Conclusao:

- O frontend nao e estatico puro.
- Ele usa SvelteKit com `@sveltejs/adapter-node`, entao existe um servidor Node no frontend.
- As telas principais consultadas usam `+page.server.ts` e actions server-side:
  - `src/routes/dashboard/+page.server.ts`
  - `src/routes/jobs/+page.server.ts`
  - `src/routes/jobs/[id]/+page.server.ts`
  - `src/routes/sources/+page.server.ts`
- Isso significa que o app ja tem a camada server-side necessaria para chamar a API sem expor a chamada diretamente no browser.

Ponto que precisa mudar:

- O frontend ainda usa `PUBLIC_API_BASE_URL` em `src/lib/api/client.ts`.
- Por ser `PUBLIC_*`, esse valor e publico no SvelteKit.
- Embora as chamadas observadas estejam em `+page.server.ts`, o client de API atual nao deixa claro que deve ser usado apenas no servidor e ainda depende de uma variavel publica.

Mudanca recomendada no frontend:

- Trocar `PUBLIC_API_BASE_URL` por `INTERNAL_API_BASE_URL`.
- Adicionar `INTERNAL_API_SECRET`.
- Ler essas variaveis via `$env/dynamic/private`, nao via `$env/dynamic/public`.
- Garantir que o modulo que chama a API seja server-only, por exemplo renomeando ou movendo para um arquivo como `src/lib/server/api/client.ts`.
- Adicionar o header `X-Internal-Api-Secret` em todas as chamadas feitas do servidor do frontend para a API.

## Restricao Tecnica Importante

Se o frontend falar com a API diretamente do navegador, nao existe forma confiavel de cumprir o requisito "so o front consegue chamar a API" usando apenas uma senha compartilhada.

Motivo:

- qualquer segredo embutido no frontend vai parar no bundle ou nas requisicoes do browser
- qualquer usuario consegue inspecionar a chamada e repetir a request fora do frontend
- CORS nao resolve isso, porque nao protege contra acesso direto

No caso deste projeto, o frontend ja e SvelteKit com servidor Node. Portanto, a abordagem correta e manter as chamadas para a API dentro de `+page.server.ts`, server actions ou modulos server-only.

## Arquitetura Alvo

Fluxo desejado:

1. O navegador fala apenas com o frontend SvelteKit.
2. O servidor do frontend chama a API pela rede interna.
3. A API aceita requests funcionais apenas quando recebe o header interno correto.
4. A API deixa de ter dominio publico exposto no Coolify.

Resultado:

- o browser nunca conhece a URL interna real da API
- o browser nunca recebe a senha interna
- a API nao responde pela internet aberta
- apenas o frontend, dentro da rede privada, consegue chegar nela

## Variaveis de Ambiente

Adicionar na API:

```env
API_INTERNAL_SECRET=definir-uma-senha-forte-aqui
API_REQUIRE_INTERNAL_AUTH=true
```

Adicionar no frontend:

```env
INTERNAL_API_BASE_URL=http://job-scraper-api:3000
INTERNAL_API_SECRET=mesmo-valor-de-API_INTERNAL_SECRET
```

Remover ou aposentar no frontend:

```env
PUBLIC_API_BASE_URL=...
```

Observacoes:

- `API_INTERNAL_SECRET` e a senha compartilhada entre o servidor do frontend e a API.
- `INTERNAL_API_BASE_URL` deve apontar para o hostname interno entre apps no Coolify, nao para o dominio publico.
- A senha nao pode existir em variaveis publicas do frontend como `PUBLIC_*`, `VITE_*` ou equivalentes.

## Mudancas no Backend

### 1. Validacao de ambiente

Atualizar o schema de `src/config/env.ts` para incluir:

- `API_INTERNAL_SECRET`
- `API_REQUIRE_INTERNAL_AUTH`

Regra recomendada para MVP:

- `API_REQUIRE_INTERNAL_AUTH` deve defaultar para `false` em desenvolvimento.
- Em `production`, se `API_REQUIRE_INTERNAL_AUTH=true`, falhar o startup quando `API_INTERNAL_SECRET` estiver vazio.

### 2. Middleware de autenticacao interna

Adicionar um hook global antes das rotas funcionais:

- ler o header `X-Internal-Api-Secret`
- comparar com `API_INTERNAL_SECRET`
- se estiver ausente ou incorreto, rejeitar antes de executar a rota

Resposta recomendada para MVP:

- retornar `403` generico

Nao vale complicar com "nao responder nada" no nivel da aplicacao. Se for necessario fazer a API sumir publicamente, isso deve ser feito no proxy/rede, nao no Fastify.

### 3. Escopo da protecao

Aplicar o bloqueio nas rotas funcionais:

- `/api/dashboard`
- `/api/jobs`
- `/api/sources`
- `/api/events`
- `/api/settings`

Sobre `/health`:

- preferencia: manter privado se o Coolify suportar healthcheck interno
- alternativa: manter publico somente se for indispensavel para o healthcheck externo

- Para MVP, proteger `/api/*`.
- Healthcheck será feito pelo Telegram Bot. Um comando será enviado para o bot, que fará uma requisição interna para a API e reportará o status.

### 4. CORS

Depois que o browser deixar de chamar a API diretamente:

- `API_CORS_ORIGIN` deixa de ser a protecao principal
- pode ser mantido restrito ao dominio do frontend como defesa secundaria

CORS nao deve ser tratado como mecanismo de seguranca da API.

## Mudancas no Frontend

### 1. Manter chamadas no servidor SvelteKit

O frontend ja tem a estrutura adequada:

- SvelteKit
- `@sveltejs/adapter-node`
- rotas `+page.server.ts`
- server actions para mutacoes de status

Portanto, nao e necessario criar um BFF separado para o MVP.

### 2. Tornar o client de API server-only

Alterar o client atual para:

- usar `$env/dynamic/private`
- ler `INTERNAL_API_BASE_URL`
- ler `INTERNAL_API_SECRET`
- enviar `X-Internal-Api-Secret` em todas as chamadas
- ficar em uma pasta server-only, como `src/lib/server/api/client.ts`

As APIs de dominio (`dashboard.api.ts`, `jobs.api.ts`, `sources.api.ts`) tambem devem ficar em area server-only ou ser importadas exclusivamente por arquivos `.server.ts`.

### 3. Remover variavel publica de API

Atualizar `.env.example` e deploy do frontend:

- remover `PUBLIC_API_BASE_URL`
- adicionar `INTERNAL_API_BASE_URL`
- adicionar `INTERNAL_API_SECRET`

No `docker-compose.yml` do frontend, trocar:

```yaml
PUBLIC_API_BASE_URL: ${PUBLIC_API_BASE_URL}
```

por:

```yaml
INTERNAL_API_BASE_URL: ${INTERNAL_API_BASE_URL}
INTERNAL_API_SECRET: ${INTERNAL_API_SECRET}
```

### 4. Validar que o browser nao chama a API

No navegador, a aba Network deve mostrar chamadas ao proprio frontend, nao ao dominio publico antigo da API.

Nao deve existir:

- chamada browser -> `https://job-scraper-api.../api/...`
- segredo no bundle
- segredo em logs
- `PUBLIC_*` ou `VITE_*` contendo URL interna ou segredo

## Mudancas de Infra no Coolify

### 1. Remover exposicao publica da API

Objetivo:

- a API nao deve mais ter dominio publico como `https://job-scraper-api.72-60-1-117.nip.io`

Ajustes esperados:

- remover o dominio publico da app da API
- manter apenas porta/rede interna para comunicacao entre servicos
- garantir que o frontend consiga resolver o hostname interno da API

### 2. Manter o frontend como unico ponto publico

Objetivo:

- somente o frontend continua exposto, por exemplo `https://job-scraper.72-60-1-117.nip.io`

### 3. Revisar publicacao de porta

No ambiente final, evitar publicar a API com `ports` quando ela deve ser privada.

Preferir, quando aplicavel:

```yaml
expose:
  - "3000"
```

O ajuste exato depende de como o Coolify monta a app e a rede privada.

## Ordem de Implementacao MVP

### Fase 1 - Backend

- adicionar `API_INTERNAL_SECRET` e `API_REQUIRE_INTERNAL_AUTH`
- implementar hook de auth para `/api/*`
- manter API publica temporariamente apenas para teste controlado
- alterar healthcheck para permitir que somente o Telegram Bot faça a verificação de status da API
- testar request sem header, com header errado e com header correto

### Fase 2 - Frontend

- trocar `PUBLIC_API_BASE_URL` por `INTERNAL_API_BASE_URL`
- adicionar `INTERNAL_API_SECRET`
- mover o client de API para area server-only
- enviar `X-Internal-Api-Secret` nas chamadas server-side
- confirmar que `+page.server.ts` e actions continuam funcionando

### Fase 3 - Infra

- remover dominio publico da API no Coolify
- configurar URL interna da API no frontend
- manter apenas o frontend exposto publicamente

### Fase 4 - Validacao final

- abrir a URL publica antiga da API e confirmar que nao responde mais
- conferir Network do browser e confirmar que ele nao chama a API antiga diretamente
- confirmar que o segredo nao aparece no bundle do frontend
- revisar logs para garantir que o header secreto nao e impresso

## Criterios de Aceitacao

- A URL publica antiga da API nao funciona mais.
- Requests para `/api/*` sem `X-Internal-Api-Secret` falham.
- Requests para `/api/*` com segredo incorreto falham.
- Requests internos com segredo correto funcionam.
- O frontend continua funcional para dashboard, jobs e sources.
- O browser nao chama diretamente o dominio da API.
- `PUBLIC_API_BASE_URL` deixa de ser usado no frontend.
- `INTERNAL_API_SECRET` nao aparece no bundle, HTML ou logs.

## Testes Recomendados

### Backend

- request sem header secreto
- request com header incorreto
- request com header correto
- teste confirmando que rotas protegidas nao executam handler quando auth falha

### Frontend

- teste das rotas `+page.server.ts` que consultam dashboard, jobs e sources
- teste das actions que atualizam status de jobs
- teste confirmando que o client de API usa env privada e envia o header interno

### Infra

- tentativa de abrir o dominio antigo da API
- tentativa de chamar a API publica por `curl`
- validacao de que o frontend consegue acessar a API pelo hostname interno

## Riscos e Observacoes

- Se a API continuar com dominio publico, o header secreto ainda reduz risco, mas nao elimina exposicao.
- Segredo compartilhado unico atende uso pessoal, mas nao oferece rastreabilidade por usuario.
- Se algum componente Svelte ou script client-side importar o client de API, a abordagem quebra; por isso o client deve ser server-only.
- Se houver necessidade futura de acesso remoto administrativo sem frontend, sera preciso definir um canal separado.
- Para uso pessoal, Basic Auth ou Cloudflare Access no frontend inteiro tambem seria uma alternativa aceitavel de MVP, mas nao substitui remover a API da internet.

## Decisao Recomendada

Implementar a protecao em duas camadas simples:

1. API sem exposicao publica, acessivel apenas pela rede interna do Coolify.
2. Header `X-Internal-Api-Secret` entre servidor SvelteKit e API.

Como o frontend ja roda em SvelteKit com adapter Node e usa `+page.server.ts`, nao e necessario criar um BFF separado para o MVP. O trabalho principal no frontend e trocar variaveis publicas por privadas, tornar o client de API server-only e enviar o segredo interno em cada chamada.
