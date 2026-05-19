# Funcionalidades refinadas com base no repo

## 1. Frontend operacional

Prioridade: **muito alta**.

Como o app não tem frontend e isso aparece como limitação atual do projeto, o front é a principal evolução natural.

Esse front não deveria ser “bonitinho”. Deveria ser um painel operacional para:

```txt
ver execuções diárias
ver vagas coletadas
filtrar vagas
inspecionar detalhes
selecionar vagas para IA
acompanhar custo de IA
gerar CV
registrar candidatura
ajustar fontes e queries
```

O Telegram pode continuar existindo, mas vira canal secundário.

---

## 2. Dashboard de ciclos de coleta

Prioridade: **alta**.

Seu comentário marcou esse item como OK. O repo já possui `JobEvent`, `discoveredAt`, `lastSeenAt`, `notifiedAt`, `status` e eventos de descoberta/redescoberta.

Mas falta uma tela para visualizar isso.

Dashboard ideal:

```txt
Execução de hoje:
- vagas coletadas
- vagas novas
- vagas redescobertas
- duplicadas descartadas
- vagas notificadas
- vagas acima do threshold
- vagas por fonte
- média de score
- erros por coletor
```

Como o projeto já diferencia descoberta e redescoberta no fluxo, faz sentido exibir isso no front. A documentação diz que vagas novas são criadas e vagas existentes são atualizadas como redescobertas.

Aqui talvez valha criar uma tabela específica futura de `CollectionRun`, porque hoje os eventos existem, mas não parece haver uma entidade própria para “execução do scraper”.

---

## 3. Tabela de vagas: não criar, evoluir

Prioridade: **alta**.

Pelo seu comentário, a tabela de vagas já existe ou pelo menos a estrutura de dados já comporta isso. Então o refinamento correto é:

```txt
não criar uma tabela básica;
criar uma tabela operacional de curadoria.
```

Ela deveria usar campos já existentes no model `Job`:

```txt
title
companyName
source
collector
discoveredVia
location
remoteType
salaryMin / salaryMax / currency
seniority
stackTags
score
sourceTrustScore
status
matchReasons
riskFlags
recommendedAction
lastSeenAt
```

O schema já suporta boa parte disso.

A melhoria real seria permitir:

```txt
selecionar vagas em lote
enviar selecionadas para IA
marcar como salva
marcar como descartada
marcar como aplicada
filtrar por score
filtrar por fonte
filtrar por stack
filtrar por status
filtrar por data
filtrar por risco
```

---

## 4. Deduplicação: não mexer agora

Prioridade: **baixa**.

Você marcou que já existe, e o repo confirma. A deduplicação real usa:

```txt
canonicalUrl
normalizedTitle + companyName
contentHash
```

Isso está documentado expressamente.

Como o projeto já atualiza vagas redescobertas preservando `discoveredAt`, `notifiedAt` e `status`, a base já está boa.

O que pode ser adicionado depois:

```txt
mostrar no front quantas vezes a vaga reapareceu
mostrar em quais fontes ela apareceu
mostrar diferença entre descrição antiga e nova
```

Mas isso não é prioridade.

---

## 5. Filtros duros: apenas expor no front

Prioridade: **média**.

Você marcou que já existe. O repo confirma que o scoring já considera sinais negativos como híbrido/presencial, US-only, 7+ anos, Staff/Principal only, teste longo, fonte suspeita, stack fora do alvo e descrição vaga.

A evolução não é recriar filtros, mas permitir configurar alguns deles pelo front:

```txt
descartar US-only automaticamente
descartar onsite automaticamente
descartar hybrid automaticamente
penalizar 7+ years
penalizar Staff/Principal
penalizar fonte indireta
score mínimo para aparecer no painel
```

Hoje isso parece estar no código. O próximo passo é tornar parte disso configurável.

---

## 6. Score heurístico: preservar e tornar configurável

Prioridade: **alta**.

Você comentou que já existe pontuação, mas talvez possa ser aperfeiçoada. Isso está correto.

O repo já possui um scoring relativamente elaborado. Ele começa com base técnica de 35 pontos e ajusta por sinais positivos e negativos. Sinais positivos incluem TypeScript, Node, NestJS, React, Next, AWS, Docker, CI/CD, PostgreSQL, REST, AI, LLM, automação, remoto, LATAM/Americas/worldwide, salário claro e contrato/B2B.

Então a IA não deve substituir o score atual.

Melhoria correta:

```txt
criar uma tela de pesos do scoring
permitir ativar/desativar penalidades
permitir ajustar pesos de stack
permitir ajustar threshold de recomendação
salvar versões de configuração
comparar resultado antes/depois
```

Exemplo:

```txt
TypeScript: +10
Node.js: +10
NestJS: +8
React: +7
AWS: +7
AI/LLM: +6
Remote LATAM: +10
US-only: -30
7+ years: -20
Staff/Principal: -25
```

Isso evita gastar IA para corrigir problemas que um score bem calibrado já resolve.

---

## 7. Análise IA apenas para shortlist

Prioridade: **muito alta**.

Esse ponto continua central.

Como o app pode coletar muitas vagas, IA em massa seria desperdício. O fluxo correto:

```txt
coleta bruta
→ deduplicação existente
→ filtros/scoring existente
→ shortlist
→ IA apenas nas vagas escolhidas ou top N
```

Regras úteis:

```txt
analisar somente vagas com score >= X
analisar somente top 10/top 20/top 30
analisar somente vagas selecionadas manualmente
analisar somente vagas novas
não analisar vagas descartadas
não analisar vagas já analisadas
```

Isso se encaixa bem no modelo atual porque `Job` já possui `score`, `status`, `matchReasons`, `riskFlags` e `recommendedAction`.

---

## 8. Fila de análise IA

Prioridade: **alta**.

Essa funcionalidade deve ser uma tela própria:

```txt
AI Review Queue
```

Ela exibiria vagas candidatas à análise com:

```txt
título
empresa
score atual
fonte
stackTags
riskFlags atuais
status
custo estimado
ação
```

Ações:

```txt
analisar selecionadas
analisar top 10
analisar top 20
analisar todas acima de 75
ignorar selecionadas
```

Essa fila é melhor do que análise automática porque mantém controle de custo.

---

## 9. Resultado curto da IA

Prioridade: **alta**.

A IA deve gerar um complemento ao scoring atual, não um relatório longo.

Formato recomendado:

```txt
aiScore: 0-100
fit: alto | médio | baixo
comentário: 1-2 frases
risco: 1 frase
ação sugerida: aplicar | revisar | descartar
```

Exemplo:

```txt
Fit: médio-alto.
Comentário: boa aderência em TypeScript, Node.js e React. A vaga parece full stack product, não backend pura.
Risco: pede senioridade mais próxima de senior.
Ação: revisar.
```

No banco, isso poderia complementar ou reaproveitar:

```txt
matchReasons
riskFlags
recommendedAction
```

Mas eu separaria os campos IA dos campos heurísticos para não misturar origem da decisão.

Exemplo futuro:

```txt
aiScore
aiFit
aiComment
aiRisk
aiRecommendedAction
aiAnalyzedAt
```

---

## 10. Análise detalhada sob demanda

Prioridade: **média-alta**.

Só quando você clicar numa vaga e pedir.

Ela pode responder:

```txt
por que combina
por que não combina
quais pontos destacar no CV
quais experiências priorizar
quais riscos de senioridade existem
qual versão de CV usar
qual mensagem enviar
```

Não deve rodar por padrão.

---

## 11. Controle de custo de IA

Prioridade: **muito alta**.

Como você explicitamente se preocupou com custo, o painel precisa disso.

Configurações:

```txt
limite diário de análises IA
limite por execução
score mínimo para IA
modelo para triagem
modelo para análise detalhada
modelo para geração de CV
modo manual/assistido
```

Exemplo:

```txt
Máximo por execução: 20
Máximo por dia: 50
Score mínimo: 70
Triagem: modelo barato
CV: modelo melhor
Análise automática: desligada
```

---

## 12. Cache de IA: não é prioridade, mas ainda faz sentido

Prioridade: **baixa/média**.

Você comentou que talvez não se aplique porque o app já descarta repetidas. Concordo parcialmente.

Como a deduplicação já existe, cache não é urgente. Mas o repo também trabalha com redescoberta e `lastSeenAt`; logo, uma vaga pode reaparecer sem virar nova.

Então cache de IA ainda faz sentido para:

```txt
não reanalisar vaga redescoberta
não reanalisar vaga cujo conteúdo não mudou
reaproveitar análise quando a vaga aparece via SearXNG e depois via fonte oficial
```

Mas isso pode ficar para depois.

---

## 13. Auditoria da IA

Prioridade: **média**.

Você marcou como OK. Eu manteria, mas não colocaria antes da fila de IA.

A auditoria serviria para calibrar prompt e score:

```txt
IA acertou
IA superestimou
IA subestimou
comentário útil
comentário inútil
vaga boa ignorada
vaga ruim recomendada
```

Isso pode gerar dados para ajuste posterior.

---

## 14. Tela de detalhes da vaga

Prioridade: **alta**.

Essa tela deveria ser o centro da decisão.

Dados vindos do `Job`:

```txt
título
empresa
fonte
collector
discoveredVia
sourceUrl
canonicalUrl
localização
remoteType
salário
senioridade
descrição
requirements
stackTags
score
sourceTrustScore
matchReasons
riskFlags
recommendedAction
status
discoveredAt
lastSeenAt
```

O schema atual já oferece esses campos.

Ações:

```txt
analisar com IA
gerar CV
salvar
descartar
marcar aplicada
abrir link original
```

---

## 15. Gestão de fontes

Prioridade: **média-alta**.

O projeto já usa `config/sources.example.json`, com fontes como Remotive, Himalayas, We Work Remotely, Get on Board, Remote OK, YC Jobs, CI&T, Onstrider, Recrut.ai, SearXNG e Email Alerts.

Então a evolução certa é tirar parte dessa configuração do JSON estático e colocar no banco/front.

Tela de fontes:

```txt
nome
tipo
accessMode
ativa/inativa
baseUrl
sourceTrustScore
rateLimitMs
última execução
vagas coletadas
vagas úteis
erros
qualidade média
```

Isso evitaria editar JSON toda vez que quiser ligar/desligar fonte ou ajustar confiança.

---

## 16. Configuração de SearXNG

Prioridade: **alta**.

Você marcou como necessário, e o repo confirma que SearXNG já está previsto na configuração com várias queries.

A evolução correta:

```txt
tela para editar queries
ativar/desativar query
testar query individual
ver resultados brutos
ver quantas vagas úteis vieram da query
ver score médio por query
ver domínios mais frequentes
```

Campos por query:

```txt
nome
query
ativa
peso
última execução
resultados encontrados
vagas criadas
duplicatas
score médio
qualidade percebida
```

- Esse módulo é importante porque SearXNG pode trazer muito ruído.

- Deve ser possível rodar o SearXNG individualmente com queries customizadas de forma independente do scraper principal.

---

## 17. Gestão de templates de CV

Prioridade: **média/baixa agora**.

Você marcou que pode ser aplicado depois e não é prioridade. Concordo.

Não faria isso antes de:

```txt
front de vagas
fila IA
limite de IA
skills
verdade curricular
```

Quando entrar, templates úteis seriam:

```txt
Full Stack TypeScript
Backend Node/Nest/AWS
Frontend React/Next Performance
AI Automation
React Native
General International CV
```

---

## 18. Gestão de skills

Prioridade: **alta**.

Você marcou como bom e necessário. Concordo.

Hoje, se suas skills estão fora do app, em `.xlsx`, a geração de CV e o scoring ficam dependentes de fonte externa. Para o app unificado, faz sentido internalizar isso.

Modelo conceitual:

```txt
Skill
- nome
- categoria
- nível
- peso para score
- peso para CV
- sinônimos
- evidência
- ativa/inativa
```

Exemplo:

```txt
NestJS
Categoria: Backend
Nível: profissional
Peso scoring: alto
Peso CV: alto
Sinônimos: Nest, Nest.js
Evidência: API de suporte automatizado
```

Essa base serviria para:

```txt
score heurístico
análise IA
geração de CV
mensagem de candidatura
```

---

## 19. Base de verdade curricular

Prioridade: **alta**.

Você marcou como boa ideia. Eu colocaria como indispensável antes de automatizar CV.

Blocos:

```txt
Pode afirmar
Pode afirmar com cautela
Não pode afirmar
Experiência profissional
Experiência acadêmica
Labs/PoCs
Projetos pessoais
Claims proibidos
```

Exemplo:

```txt
Pode afirmar:
- experiência profissional com React, Next.js, Node.js e NestJS
- experiência prática com automações usando IA
- uso diário de agentes de IA para desenvolvimento
- experiência hands-on com AWS em labs e PoCs

Não pode afirmar:
- experiência profissional com Terraform
- certificação AWS
- 5+ anos profissionais como software engineer
- liderança formal de time de engenharia
```

Sem isso, a geração de CV vira uma fábrica de exagero.

---

## 20. Geração de CV por vaga

Prioridade: **alta, mas depois da base de perfil**.

Você marcou como bom. Concordo.

Essa funcionalidade deve rodar somente depois que uma vaga foi selecionada.

Entrada:

```txt
vaga
descrição
requirements
skills da vaga
skills pessoais
verdade curricular
template escolhido
idioma
```

Saída:

```txt
Markdown
DOCX
PDF
texto copiável
```

Mas eu começaria por **Markdown/HTML**, depois DOCX/PDF. Menos fricção.

---

## 21. Mensagem de candidatura

Prioridade: **baixa/média**.

Você marcou como bom, mas não prioridade. Concordo.

Tipos:

```txt
mensagem LinkedIn
email para recruiter
cover letter curta
follow-up
resposta para triagem
```

Essa etapa só vem depois que o CV já estiver funcionando.

---

## 22. CRM de candidaturas

Prioridade: **média-alta**.

O repo já tem `status` em `Job`, `JobEvent`, `Company` e `Recruiter`, mas a documentação indica que `Company` e `Recruiter` ainda não aparecem integrados ao ciclo principal.

Então o CRM pode aproveitar o que já existe.

Status úteis:

```txt
new
saved
ai_pending
ai_analyzed
cv_generated
applied
followup_needed
replied
interview
rejected
ghosted
discarded
```

Mas talvez não seja necessário criar uma entidade enorme de CRM de início. Pode começar usando:

```txt
Job.status
JobEvent
Recruiter
Company
```

Depois, se necessário, criar:

```txt
Application
GeneratedCv
ApplicationMessage
```

---

## 23. Telegram como canal secundário

Prioridade: **média/baixa**.

O Telegram já é canal principal de notificação no projeto atual, incluindo score, título, tags, empresa, localidade, fonte, salário, motivos de match, flags de risco, ação recomendada e link.

Com frontend, Telegram deixa de ser interface de operação e vira alerta:

```txt
resumo diário
vaga excelente encontrada
erro em coletor
CV gerado
lembrete de follow-up
```

---

# Priorização revisada

Como você apontou, não faz sentido chamar isso de MVP inicial, porque o app inicial já existe. Então eu organizaria como **fases de evolução**.

## Fase 1 — Painel operacional sobre o backend existente

Implementar primeiro:

```txt
1. Frontend com dashboard de coleta
2. Tabela operacional de vagas
3. Tela de detalhes da vaga
4. Filtros por score, fonte, stack, status e data
5. Ações: salvar, descartar, abrir link, marcar aplicada
```

Motivo: o backend já coleta, deduplica, pontua e notifica. O gargalo agora é **operar a massa de vagas**.

---

## Fase 2 — IA controlada para triagem

Depois:

```txt
1. Fila de análise IA
2. Limite por execução/dia
3. Botão "analisar selecionadas"
4. Score IA complementar
5. Comentário curto da IA
6. Risco e ação sugerida pela IA
7. Auditoria simples da IA
```

Motivo: IA deve entrar como segunda camada, depois do scoring existente.

---

## Fase 3 — SearXNG e fontes configuráveis

Em paralelo ou logo depois:

```txt
1. Tela de fontes
2. Ativar/desativar fonte
3. Ajustar sourceTrustScore
4. Tela de queries SearXNG
5. Testar query
6. Medir qualidade por query
```

Motivo: SearXNG pode aumentar muito volume e ruído. Sem painel de ajuste, fica difícil calibrar.

---

## Fase 4 — Perfil profissional dentro do app

Depois:

```txt
1. Gestão de skills
2. Sinônimos de skills
3. Peso para scoring
4. Peso para CV
5. Base de verdade curricular
6. Claims permitidos/proibidos
```

Motivo: antes de gerar CV, o app precisa saber o que pode afirmar.

---

## Fase 5 — Geração de CV

Depois da base de perfil:

```txt
1. Gerar CV por vaga
2. Escolher template
3. Gerar Markdown/HTML primeiro
4. Exportar PDF/DOCX depois
5. Salvar histórico de CV gerado
```

Motivo: geração de CV sem base de verdade curricular aumenta risco de alucinação.

---

## Fase 6 — CRM leve

Por fim:

```txt
1. Status de candidatura
2. Histórico de candidatura
3. CV usado
4. Mensagem enviada
5. Recrutador associado
6. Follow-up
```

Motivo: isso ganha valor depois que você começa a aplicar com volume.

---

# Fluxo final refinado

```txt
Worker coleta vagas
→ normalizador trata os dados
→ deduplicação existente remove repetidas
→ scoring existente calcula aderência
→ banco persiste vaga/eventos
→ front exibe dashboard e tabela
→ você filtra e seleciona vagas promissoras
→ IA analisa apenas selecionadas/top N
→ app salva score IA + comentário curto
→ você escolhe vagas finais
→ app usa skills + verdade curricular para gerar CV
→ você revisa e envia
→ app registra candidatura/status
→ Telegram apenas notifica eventos importantes
```

## Ordem prática que eu seguiria

```txt
1. Frontend lendo Jobs do banco
2. Dashboard de coletas e métricas básicas
3. Tela de detalhes da vaga
4. Ações de status: salvar / descartar / aplicada
5. Fila manual de análise IA
6. Limites de custo IA
7. Comentário curto da IA
8. Tela de queries SearXNG
9. Gestão de skills
10. Verdade curricular
11. Geração de CV por vaga
12. CRM leve
```

Resumo da correção: a sugestão não deve ser “criar um app de vagas com IA”. O repo já é uma pipeline de inteligência de vagas. A evolução certa é **transformar essa pipeline em um sistema operável por interface**, com IA entrando de forma seletiva e com custo controlado, e só depois conectar isso à geração confiável de CV.
