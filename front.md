# Diretrizes para criação do front

## SvelteKit

- Frontend SvelteKit
  → chama API backend
  → exibe Jobs, eventos, fontes e métricas
  → executa ações operacionais

## Repositório

- será criado em repositório separado

## API

- API server simples no próprio backend atual, sem Nest por enquanto
- usar Fastify para criar rotas e lidar com requisições

Algo assim:

src/server/ - server.ts
routes/ - jobs.routes.ts - dashboard.routes.ts - sources.routes.ts - events.routes.ts

## Separar worker de API

- Hoje o projeto roda como worker. O front não deveria depender do worker estar executando a coleta naquele exato processo.
- O ideal é separar o worker de coleta do servidor API, para que o front possa funcionar mesmo quando o worker não estiver rodando.
- Em resumo
  - worker escreve no banco
  - API lê/atualiza o banco
  - front usa API

## Rotas principais do front

/dashboard
/jobs
/jobs/[id]
/sources
/settings

### /dashboard

- vagas novas
- vagas redescobertas
- vagas por fonte
- média de score
- top fontes
- última execução
- erros recentes

O projeto já persiste Job, JobEvent, status, score, sourceTrustScore, lastSeenAt e notifiedAt, então há base para dashboard.

### /jobs

Tela principal.

Tabela com filtros, ordenação e ações.

### /jobs/[id]

Detalhe da vaga.

### /sources

Fontes configuradas e, depois, SearXNG.

### /settings

Limiares, preferências de visualização e, futuramente, IA.

## Decisão sobre tabela de vagas

- Essa é a tela mais importante. Não invente layout complexo antes de resolver a tabela.

Você precisa decidir:

```
tabela simples própria
ou biblioteca de tabela
```

- usar TanStack Table

Como você vai precisar de paginação, sort, filtros, seleção em lote e colunas configuráveis, TanStack Table tende a compensar.

A tabela precisa suportar:

```
server-side pagination
server-side filtering
server-side sorting
seleção em lote
persistência de filtros na URL
```

Não carregue 400, 1000 ou 5000 vagas de uma vez e filtre tudo no client. Faça isso no backend.

## Estado dos filtros: URL, não store global

- Filtros da tela de vagas devem ir na URL.

Exemplo

- /jobs?status=new&minScore=70&source=himalayas&stack=Node.js&sort=score_desc&page=1

Motivo

- você consegue atualizar a página sem perder filtros
- consegue salvar um link
- consegue voltar/avançar no navegador
- evita store global desnecessária

## Paginação

- Offset por enquanto

## Contratos de API tipados

- Evite o front ficar adivinhando formato de resposta.

- Agora:
  - duplicar DTOs mínimos no front para andar rápido.

- Depois:
  - criar pacote @job-scrapper/contracts e publicar no GitHub Packages ou usar OpenAPI.

## Design system: simples, não inventar moda

- Tailwind CSS
- shadcn-svelte
- lucide-svelte para ícones

### Componentes

Button
Input
Select
Badge
Table
Card
Dialog
Drawer
Tabs
Dropdown
Textarea
Toast

## Layout principal

### Estrutura principal

- sidebar esquerda
- topbar
- conteúdo principal

### Menu

- Dashboard
- Vagas
- Fontes
- SearXNG
- Configurações

### Posteriormente

- Skills
- CVs
- Candidaturas
- IA

Mas não coloque tudo no início se as telas ainda não existem.

## Tipos de ação no front

- Separe ações rápidas de ações destrutivas:

### Ações rápidas

```
salvar vaga
descartar vaga
marcar como candidatura enviada
abrir link
```

### Ações que pedem confirmação

```
descartar em lote
reanalisar com IA
deletar fonte
rodar scraper manualmente
```

### analisar com IA

```
analisar com IA
gerar CV
gerar mensagem
```

Mesmo que a IA venha depois, já deixe espaço visual/conceitual para isso.

## Status da vaga

O campo status já existe no model Job. Então o front deve tratar status como workflow.

Inicialmente:

```
new
saved
discarded
applied
```

Posteriormente, com IA:

```
ai_pending
ai_analyzed
cv_generated
followup_needed
replied
interview
rejected
ghosted
```

## Tela de detalhes da vaga

Essa tela deve ser feita cedo, porque a tabela sozinha não basta

- Blocos:

```
Cabeçalho:
- título
- empresa
- score
- status
- link original

Resumo:
- fonte
- localização
- remoto
- salário
- senioridade
- trust score

Stack:
- stackTags

Decisão:
- matchReasons
- riskFlags
- recommendedAction

Descrição:
- description
- requirements

Histórico:
- eventos da vaga
- discoveredAt
- lastSeenAt
```

Esses campos já existem ou são coerentes com o schema atual

## Dashboard: cuidado para não virar Power BI

Na primeira versão, dashboard deve ser operacional, não analítico demais.

Métricas suficientes:

```
vagas novas hoje
vagas redescobertas hoje
vagas acima de score 70
vagas por status
vagas por fonte
top stacks
última execução
erros recentes
```

Não comece com gráficos complexos.

## Front executa scraping manual?

Decisão importante.

Você pode colocar botão:

Rodar coleta agora

Mas isso exige cuidado.

Se o front dispara coleta, a API precisa tratar isso como job assíncrono:

```
POST /api/collection-runs
```

Retorna:

```
{
"runId": "..."
}
```

E o front acompanha status.

Não faça o botão chamar uma request que fica 2 minutos aberta esperando o scraping terminar.

Na primeira versão, eu deixaria o front apenas visualizar. Depois adicionaria “rodar coleta agora”.

## Atualização em tempo real ou polling

Não precisa WebSocket agora. Idéia para implementação futura, se for o caso.

Use polling simples:

```
dashboard atualiza a cada 30–60s
tela de execução atualiza a cada 5–10s se houver coleta em andamento
```

WebSocket/SSE só se você realmente quiser acompanhar logs ao vivo.

## Autenticação

-Cloudflare Access ou Basic Auth no proxy

O que é cloudflare access?

## Deploy

- SvelteKit Node adapter
- Cabe deploy no Vercel?
- Não vou comprar domínio.

## Evitar inicialmente

```
microfrontend
GraphQL
WebSocket
auth complexa
charts demais
estado global grande
acesso direto ao Prisma pelo SvelteKit
geração de CV na primeira versão do front
IA na primeira tela
design system próprio
```

## Primeira entrega ideal do front

```
Dashboard simples
+ listagem de vagas paginada
+ filtros básicos
+ tela de detalhes
+ atualização de status
+ abrir link original
```

## Entregas posteriores

```
fila de análise IA
configuração de SearXNG
gestão de skills
verdade curricular
geração de CV
CRM leve
```
