# Documentacao Analitica do Projeto

## 1. Visao geral

Este projeto e uma pipeline backend em TypeScript/Node.js para descobrir, classificar e registrar oportunidades internacionais de engenharia de software remota. O nome declarado no `package.json` e `job-intelligence-pipeline`, e a proposta central e transformar fontes dispersas de vagas em uma base unica, deduplicada, pontuada e acionavel.

A aplicacao nao possui frontend. Ela foi desenhada para rodar como worker em segundo plano, localmente ou em uma VPS via Docker Compose, executando ciclos periodicos de coleta e enviando notificacoes para oportunidades com alta aderencia ao perfil configurado no codigo.

## 2. Objetivo do produto

O objetivo principal e reduzir o custo manual de acompanhar vagas internacionais relevantes, especialmente vagas remotas, compativeis com LATAM/Americas e alinhadas a um perfil backend-leaning full stack.

Na pratica, o sistema busca resolver quatro problemas:

- Centralizar vagas vindas de job boards, paginas publicas, RSS, busca SearXNG e alertas de email.
- Remover repeticoes entre fontes diferentes usando URL canonica, titulo/empresa e hash de conteudo.
- Priorizar vagas com base em stack, senioridade, localidade, compensacao, confiabilidade da fonte e sinais de risco.
- Persistir o historico para diferenciar oportunidades novas de vagas redescobertas.

## 3. Escopo funcional

O MVP implementa um fluxo completo de inteligencia de vagas:

- Carrega fontes configuradas em `config/sources.example.json`.
- Instancia coletores a partir de `src/collectors/collector.registry.ts`.
- Coleta itens brutos no contrato `RawJobItem`.
- Normaliza os dados para `NormalizedJob`.
- Calcula deduplicacao contra o PostgreSQL.
- Aplica score de aderencia tecnica e ajuste por confianca da fonte.
- Persiste vagas e eventos no banco via Prisma.
- Envia notificacoes Telegram para vagas acima do limiar configurado.
- Pode enviar digest por email via SMTP, quando habilitado.
- Agenda execucoes recorrentes com `node-cron`.

Fora do escopo declarado:

- Scraping autenticado de LinkedIn.
- Reuso de cookies, bypass de CAPTCHA ou automacao stealth.
- APIs privadas de job boards.
- Frontend web.
- Scheduler via GitHub Actions.
- Aplicacao NestJS para este MVP.

## 4. Arquitetura em alto nivel

O projeto segue uma arquitetura de pipeline modular. Cada etapa tem responsabilidade isolada e evita acoplamento desnecessario com as demais:

```text
Fontes configuradas
        |
        v
Coletores
        |
        v
RawJobItem[]
        |
        v
Normalizacao
        |
        v
NormalizedJob[]
        |
        v
Deduplicacao + score
        |
        v
PostgreSQL / Prisma
        |
        v
Notificacoes e relatorios
```

Principais limites de responsabilidade:

- `src/config`: validacao de ambiente e configuracao de fontes.
- `src/collectors`: adaptadores para APIs, RSS, HTML publico, SearXNG e alertas de email.
- `src/normalizer`: limpeza, enriquecimento basico e extracao de sinais da vaga.
- `src/scoring`: regras de aderencia, risco e recomendacao de acao.
- `src/persistence`: repositorios Prisma para vagas, empresas, recrutadores e eventos.
- `src/pipeline`: orquestracao do ciclo completo.
- `src/notifier`: canais de notificacao Telegram e email.
- `src/scheduler`: agendamento e protecao contra ciclos sobrepostos.
- `src/cli`: entradas executaveis para worker, coleta avulsa, relatorio e bootstrap.

## 5. Fluxo de execucao

O ciclo principal fica em `src/pipeline/collection-cycle.ts`.

1. A aplicacao carrega o ambiente com `src/config/env.ts`.
2. `buildCollectionCycle()` le `SOURCES_CONFIG_PATH`, filtra fontes habilitadas e cria os coletores.
3. Cada coletor executa `collect()` e retorna `RawJobItem[]`.
4. Falhas de um coletor sao registradas, mas nao interrompem o ciclo inteiro.
5. Itens brutos sao normalizados por `normalizeJob()`.
6. Cada vaga normalizada recebe score via `scoreJob()`.
7. O repositorio busca duplicatas por URL canonica, titulo/empresa e hash de conteudo.
8. Vagas novas sao criadas; vagas existentes sao atualizadas como redescobertas.
9. Eventos `discovered` ou `rediscovered` sao gravados em `JobEvent`.
10. Vagas acima de `NOTIFICATION_SCORE_THRESHOLD` entram na fila de notificacao.
11. O resumo do ciclo e enviado ao Telegram quando as credenciais estao configuradas.

O worker agendado fica em `src/cli/worker.ts` e usa `Scheduler`. A coleta unica fica em `src/cli/collect.ts`.

## 6. Fontes de dados

As fontes sao declaradas em JSON e validadas por Zod. O schema aceita:

- `id`
- `name`
- `type`: `job_board`, `company`, `search` ou `email`
- `enabled`
- `baseUrl`
- `accessMode`: `api`, `rss`, `html`, `search`, `email` ou `closed_public`
- `sourceTrustScore`
- `rateLimitMs`
- `attributionRequired`
- `queries` e `endpoints` opcionais

Fontes configuradas no exemplo atual:

| Fonte | Modo | Confianca | Observacao |
| --- | --- | ---: | --- |
| Remotive | API | 95 | Busca por queries de stack |
| Himalayas | API | 95 | Busca por queries de stack |
| We Work Remotely | RSS | 90 | Feeds de programacao/full stack/backend |
| Get on Board | API | 90 | Busca por queries |
| Remote OK | API | 85 | Coleta endpoint publico `/api` |
| Y Combinator Jobs | HTML | 80 | Pagina publica |
| CI&T Careers | HTML | 90 | Pagina oficial da empresa |
| Strider / Onstrider | closed_public | 75 | Fluxo publico mais fechado |
| IT Recruiter / Recrut.ai | closed_public | 60 | Coleta limitada a paginas publicas detectaveis |
| SearXNG | search | 40 | Busca indireta; pode inferir fonte conhecida por dominio |
| Email Alerts | email | 50 | Parser simples para `.txt` e `.html` |

O score de confianca da fonte e separado do score de aderencia da vaga. Isso permite diferenciar uma vaga tecnicamente boa encontrada por fonte indireta de uma vaga semelhante encontrada em uma fonte oficial ou job board conhecido.

## 7. Normalizacao e enriquecimento

O normalizador transforma `RawJobItem` em `NormalizedJob`. Ele:

- Remove espacos redundantes.
- Rejeita itens sem titulo ou URL.
- Define empresa desconhecida como `Unknown Company`.
- Canonicaliza URLs, removendo parametros de tracking e fragmentos.
- Normaliza o titulo para comparacao.
- Detecta tipo de remoto: `remote`, `hybrid`, `onsite` ou `unknown`.
- Detecta senioridade: Intern, Junior, Mid-level, Senior, Staff, Principal ou Lead.
- Extrai faixa salarial e moeda quando possivel.
- Detecta tags de stack por padroes textuais.
- Gera `contentHash` para apoiar deduplicacao.

Tags positivas de stack incluem TypeScript, JavaScript, Node.js, NestJS, React, Next.js, AWS, Docker, CI/CD, PostgreSQL, REST APIs, AI, LLM e automacao.

Tambem existem sinais de menor prioridade, como Python, Java, .NET, C#, PHP, Ruby, mobile-only e WordPress-only. Eles nao aparecem como penalidade direta apenas por existirem como tag; as penalidades especificas sao aplicadas no scoring quando a vaga indica stack primaria fora do alvo.

## 8. Deduplicacao

A deduplicacao real contra o banco esta em `JobRepository.findDuplicate()`. A ordem de busca e:

1. `canonicalUrl`
2. `normalizedTitle` + `companyName` case-insensitive
3. `contentHash`

Essa ordem privilegia o identificador mais forte, mas ainda cobre casos em que a mesma vaga aparece por links de busca, agregadores ou redirecionamentos.

Quando uma duplicata e encontrada, `updateRediscovered()` atualiza os dados atuais da vaga, preserva `discoveredAt`, preserva `notifiedAt`, mantem o status existente e usa o maior `sourceTrustScore` ja visto para aquela vaga.

## 9. Modelo de dados

O banco usa PostgreSQL via Prisma. O schema esta em `prisma/schema.prisma`.

Entidades principais:

- `Job`: vaga normalizada, score, URL canonica, stack tags, salarios, status, timestamps, motivos de match e flags de risco.
- `JobEvent`: historico de descoberta ou redescoberta vinculado a uma vaga.
- `Company`: cadastro auxiliar de empresas, careers URL, ATS e prioridade.
- `Recruiter`: cadastro auxiliar de recrutadores, LinkedIn, email e ultimo contato.

Indices relevantes em `Job`:

- `contentHash`
- `companyName`
- `normalizedTitle`
- `score`
- `sourceTrustScore`
- `status`
- `notifiedAt`
- `lastSeenAt`

Esses indices refletem os principais usos esperados: deduplicacao, ordenacao por score, busca por status de notificacao e consulta de vagas recentes.

## 10. Scoring e recomendacao

O score final e calculado em `src/scoring/scoring.service.ts`. Ele comeca em uma base tecnica de 35 pontos e soma ou subtrai sinais.

Sinais positivos relevantes:

- TypeScript, Node.js, NestJS, React, Next.js.
- AWS, Docker, CI/CD, PostgreSQL e REST APIs.
- AI, LLM e automacao.
- Vaga backend, backend-leaning full stack ou full stack.
- Remoto.
- LATAM, Americas, worldwide ou anywhere.
- Compensacao em USD ou faixa salarial clara.
- Compatibilidade com contrato/B2B.
- Empresa clara.

Sinais negativos relevantes:

- Hibrido ou presencial.
- US-only.
- Exigencia de 7+ anos.
- Staff/Principal only.
- Teste longo ou nao remunerado.
- Fonte suspeita.
- Stack primaria explicitamente fora do alvo.
- Descricao vaga ou curta.
- Fonte indireta ou de baixa confianca.
- Fluxo fechado de candidatura.

O ajuste por confianca da fonte fica em `sourceTrustAdjustment()`:

| `sourceTrustScore` | Ajuste |
| ---: | ---: |
| 90-100 | +5 |
| 70-89 | +2 |
| 50-69 | 0 |
| 30-49 | -8 |
| 0-29 | -20 |

A recomendacao gerada pode ser:

- Aplicar e contatar recrutador, quando houver score alto.
- Aplicar pelo site da empresa.
- Salvar para revisao manual.
- Ignorar por incompatibilidade de localidade, senioridade ou compensacao incerta.

## 11. Notificacoes e relatorios

O Telegram e o canal principal para notificacoes imediatas. A mensagem inclui:

- Score final.
- Titulo.
- Tags principais.
- Empresa.
- Localidade.
- Fonte e confianca.
- Salario, quando disponivel.
- Motivos de match.
- Flags de risco.
- Acao recomendada.
- Link canonico.

O envio depende de `TELEGRAM_BOT_TOKEN` e `TELEGRAM_CHAT_ID`. Sem esses valores, o sistema apenas registra que a notificacao foi ignorada.

O email digest e opcional e depende de `EMAIL_NOTIFICATIONS_ENABLED=true` e configuracoes SMTP completas. O comando `pnpm report` lista vagas recentes e de alto score nos logs estruturados.

## 12. Operacao e deploy

O projeto usa Node.js `>=20.11.0` e pnpm `10.11.0`. O build gera Prisma Client e compila TypeScript para `dist`.

Scripts principais:

```bash
pnpm dev
pnpm build
pnpm start
pnpm collect
pnpm report
pnpm test
pnpm test:query
pnpm prisma:migrate
pnpm prisma:generate
```

No Docker Compose:

- `app` executa `pnpm prisma:migrate && pnpm start`.
- `postgres` usa `postgres:16-alpine`.
- A porta local do PostgreSQL e `5433`, mapeada para `5432` no container.
- `searxng` e opcional e sobe somente com o profile `searxng`.
- `./input/email-alerts` e montado em `/app/input/email-alerts`.
- `./config/sources.example.json` e montado como leitura em `/app/config/sources.example.json`.

## 13. Configuracao

As variaveis sao centralizadas em `src/config/env.ts`; o README orienta nao ler `process.env` diretamente em outros pontos.

Variaveis de maior impacto:

- `DATABASE_URL`: conexao PostgreSQL.
- `TELEGRAM_BOT_TOKEN`: token do bot Telegram.
- `TELEGRAM_CHAT_ID`: chat de destino.
- `NOTIFICATION_SCORE_THRESHOLD`: limiar de notificacao.
- `COLLECT_CRON`: agenda do worker.
- `SEARXNG_BASE_URL`: URL base do SearXNG.
- `EMAIL_NOTIFICATIONS_ENABLED`: habilita digest por email.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: SMTP.
- `EMAIL_FROM`, `EMAIL_TO`: remetente e destinatario.
- `INPUT_EMAIL_ALERTS_DIR`: diretorio de alertas exportados.
- `SOURCES_CONFIG_PATH`: caminho do JSON de fontes.

## 14. Qualidade e testes

Os testes usam Vitest e ficam em `src/**/*.test.ts`.

A cobertura atual se concentra nos pontos de maior risco logico:

- Canonicalizacao de URLs.
- Deteccao de stack, remoto e senioridade.
- Normalizacao de vaga bruta.
- Deduplicacao em memoria.
- Ajuste de confianca da fonte.
- Separacao entre score tecnico e ajuste de confianca.
- Flags para fontes indiretas e de baixa confianca.

Nao ha, pelo codigo observado, testes de integracao com PostgreSQL, testes end-to-end de coletores externos ou contratos com APIs de terceiros. Isso e coerente com um MVP, mas aumenta o risco de que mudancas em HTML/API externas quebrem coletores sem alerta antecipado.

## 15. Decisoes tecnicas observaveis

O projeto privilegia simplicidade operacional e limites publicos:

- Usa HTTP, RSS, HTML publico e arquivos locais em vez de automacao de navegador.
- Mantem coletores sem acesso a banco, score ou notificacao.
- Centraliza regras de ambiente com Zod.
- Trata falha de fonte individual como erro isolado.
- Mantem `sourceTrustScore` separado do match score.
- Evita notificar novamente vagas ja marcadas com `notifiedAt`.
- Usa Prisma para deixar o modelo persistente explicito e versionavel.

Essas escolhas tornam o sistema mais previsivel para rodar como worker e reduzem riscos legais/operacionais associados a scraping autenticado ou evasivo.

## 16. Limitacoes atuais

Limitacoes relevantes inferidas do proprio codigo e README:

- Coletores HTML dependem de seletores e heuristicas genericas, entao podem capturar ruido ou perder vagas quando o site muda.
- Fontes `closed_public` tem informacao limitada e recebem flag de risco.
- SearXNG e indireto por padrao; so ganha confianca maior quando o dominio bate com fonte conhecida.
- Parser de email e propositalmente simples e baseado em links/texto proximo.
- O scheduler evita sobreposicao, mas nao distribui lock entre multiplas instancias.
- Nao ha interface de revisao manual das vagas.
- Repositorios de `Company` e `Recruiter` existem, mas nao aparecem integrados ao ciclo principal de coleta.

## 17. Oportunidades de evolucao

Evolucoes naturais para o projeto:

- Criar um painel simples para revisar vagas, status, risco e historico.
- Adicionar testes de contrato para respostas mockadas de Remotive, Himalayas, Remote OK e Get on Board.
- Registrar metricas por ciclo em tabela propria, alem de logs.
- Criar lock distribuido se houver mais de uma instancia do worker.
- Integrar `Company` e `Recruiter` ao fluxo de recomendacao.
- Permitir regras de scoring configuraveis fora do codigo.
- Adicionar uma fila para notificacoes e reprocessamento.
- Melhorar parser de salario por moeda, periodo e formato regional.
- Persistir snapshots brutos reduzidos para auditoria de mudancas em vagas.
- Classificar vagas por origem final quando SearXNG aponta para ATS conhecidos como Greenhouse, Lever ou Ashby.

## 18. Conclusao

O projeto e um MVP bem delimitado de inteligencia de vagas, orientado a automacao pragmatica e operacao simples. A arquitetura separa claramente coleta, normalizacao, deduplicacao, scoring, persistencia e notificacao, o que facilita extensoes futuras sem transformar os coletores em componentes com responsabilidades excessivas.

O maior valor do sistema esta na combinacao entre confianca da fonte, aderencia tecnica e persistencia historica. Essa combinacao permite priorizar oportunidades com menor ruido, evitar repeticao de analise manual e manter rastreabilidade sobre quando uma vaga foi descoberta, redescoberta e notificada.
