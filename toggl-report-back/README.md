# toggl-report-back

[← voltar ao README principal](../README.md)

Dois projetos **C# / .NET 10** na mesma solução (`TogglReport.slnx`):

| Projeto | Tipo | O que é |
|---|---|---|
| [`TogglReport.Api/`](#web-api-togglreportapi) | Web API (Minimal APIs) | Expõe as funcionalidades da aplicação por HTTP, com autenticação HTTP Basic opcional |
| [`TogglReport.Nucleo/`](#núcleo-compartilhado-togglreportnucleo) | Biblioteca de classes | Modelos, acesso a INI e regras de negócio comuns |

A Web API consulta o Toggl Track, faz cache do retorno cru em arquivos `.ini` dentro de uma pasta `dados/` (ao lado do executável) e agrupa/busca sobre esse dado em runtime — toda a regra de negócio vive em `TogglReport.Nucleo`, referenciado pela API.

## Índice

- [toggl-report-back](#toggl-report-back)
  - [Índice](#índice)
  - [Requisitos](#requisitos)
  - [Compilar a solução](#compilar-a-solução)
  - [Como obter seu API Token do Toggl](#como-obter-seu-api-token-do-toggl)
  - [Como obter seu API Token do Jira](#como-obter-seu-api-token-do-jira)
  - [Núcleo compartilhado (`TogglReport.Nucleo`)](#núcleo-compartilhado-togglreportnucleo)
  - [Web API (`TogglReport.Api`)](#web-api-togglreportapi)
    - [Como rodar](#como-rodar)
    - [Endpoints](#endpoints)
    - [Exemplos de request/response](#exemplos-de-requestresponse)
    - [Gráfico de Gant](#gráfico-de-gant)
    - [Sprint](#sprint)
    - [Planejamento](#planejamento)
    - [Jira](#jira)
    - [Decisões desta camada](#decisões-desta-camada)
  - [Pasta `dados/`](#pasta-dados)
    - [Backup e restauração (`/api/dados/*`)](#backup-e-restauração-apidados)
  - [Docker](#docker)
  - [Estrutura de arquivos](#estrutura-de-arquivos)
  - [Segurança](#segurança)
    - [Variáveis de ambiente em dev (Visual Studio)](#variáveis-de-ambiente-em-dev-visual-studio)
  - [Limitações conhecidas](#limitações-conhecidas)

## Requisitos

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0) ou superior
- Um **API Token** pessoal do Toggl Track para cada usuário que você queira incluir no relatório ([como obter](#como-obter-seu-api-token-do-toggl))
- Opcional: um **API Token** do Jira Cloud, só se for usar a integração com o Jira ([como obter](#como-obter-seu-api-token-do-jira))

## Compilar a solução

```bash
cd toggl-report-back
```

```bash
dotnet build TogglReport.slnx
```

Compila os dois projetos (`TogglReport.Api`, `TogglReport.Nucleo`) de uma vez. `0 warnings` é o padrão esperado.

---

## Como obter seu API Token do Toggl

1. Acesse [track.toggl.com](https://track.toggl.com/) e faça login.
2. Vá em **Profile Settings** (ícone de perfil no canto).
3. Role até o final da página — o **API Token** está lá.
4. Copie e cole no cadastro de usuários do Toggl no frontend.

---

## Como obter seu API Token do Jira

1. Acesse [id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens) logado com a conta Atlassian usada no seu Jira Cloud.
2. **Create API token**, dê um nome (ex.: "toggl-report") e copie o valor exibido — ele não aparece de novo depois.
3. Cole na seção **Jira** do frontend junto com a URL do domínio (`empresa.atlassian.net`) e o e-mail da mesma conta.

---

## Núcleo compartilhado (`TogglReport.Nucleo`)

Biblioteca de classes referenciada pelo `TogglReport.Api`. Contém **tudo que não depende de HTTP** — toda a regra de negócio e o acesso a INI, sem nenhum `PackageReference`:

| Pasta | Conteúdo |
|---|---|
| `Configuracao/` | Modelos e carregadores/salvadores de cada `.ini` (`CarregadorUsuariosTogglIni`, `CarregadorConfiguracaoCategoriasSprintIni` para Toggl, `CarregadorConfiguracaoJiraIni`, `CarregadorCacheIni`/`CarregadorCacheSprintIni`, etc.); `CaminhosDados` (monta todos os caminhos de `dados/`); `AnalisadorIni` (parser/escritor de INI compartilhado, UTF-8 sem BOM); `CriptografiaToken` (AES dos tokens); `ServicoUsuariosToggl`, `ServicoSprints`, `ServicoChaves`, `DiasUteis`, `Agrupamento` (helpers) |
| `Toggl/` | `ClienteApiToggl` (HTTP Basic contra `api.track.toggl.com/api/v9`; `ObterTagsAsync` resolve o workspace via `GET /me` e, se `default_workspace_id` vier `null`, cai para `GET /workspaces` e usa o primeiro), `RegistroTempoDto`, `ResultadoApiToggl` (Ok/Falha, sem exceptions), `LimitadorRequisicoes` (30 req/hora por usuário, em memória) |
| `Relatorios/` | `ServicoAgrupamento` (por descrição/tag, normalização "TEL"), `ServicoBuscaDescricao`, `ServicoCodigoTel` (separa Código/Descrição de uma descrição/issue TEL; usado por Sprint e Planejamento), `ComparadorNomes` (ordenação alfabética de nomes que ignora caixa e acento, sem cultura nomeada — ver [Docker](#docker)) — lógica pura, devolve dados, nunca texto formatado |
| `Consultas/` | `ServicoConsulta` — decide cache×API e aplica o rate limiter |
| `Gant/`, `Sprint/` | `ServicoGant`, `ServicoSprint` e seus modelos de resultado |
| `Planejamento/` | `ServicoPlanejamento.Montar` (coluna do cartão, contagem por colaborador, resolução das pessoas pelo mapeamento Jira↔Toggl) e modelos de resultado (namespace `RelatorioToggl.Planejamento`) |
| `Jira/` | `ClienteApiJira` (HTTP Basic `email:apiToken`; REST v3 e Agile 1.0, com 1 retry em 429 nos métodos de quadro/sprint/cartões), `IssueJira`, `ResultadoApiJira`, modelos do quadro (`QuadroJira`, `ColunaQuadroJira`, `SprintQuadroJira`, `CartaoQuadroJira`) e carregadores dos caches (issues por sprint, quadros, planejamento) |

`ServicoConsulta` é o ponto mais importante: a Web API chama sempre os mesmos métodos (`CarregarCacheSeExistente`, `CacheCorrespondeAosParametros`, `CarregarRegistrosDoCache`, `ConsultarUsuariosAsync`, `SalvarCache`) — cada endpoint decide **quando** chamar cada um (via `forcarConsultaApi`), mas a regra em si (o que conta como "mesmo período/usuários", quando usar cache, como tratar o rate limit) existe em um único lugar.

Este projeto **nunca** referencia tipos de apresentação HTTP (`Endpoints/`, `Dtos/`).

---

## Web API (`TogglReport.Api`)

API HTTP local (Minimal APIs, ASP.NET Core), com autenticação HTTP Basic **opcional** (desligada por padrão, ver [Segurança](#segurança)) — expõe as funcionalidades para o [frontend](../toggl-report-front/README.md) ou qualquer outro cliente HTTP.

### Como rodar

```bash
dotnet run --project TogglReport.Api
```

Sobe em `http://localhost:5180` (porta fixa, `Properties/launchSettings.json`). Swagger/OpenAPI em **`http://localhost:5180/swagger`** — documenta todos os endpoints, sem exigir autenticação para navegar. Com `AUTH__USUARIO`/`AUTH__SENHA` configurados, o Swagger ganha um botão **"Authorize"** (HTTP Basic) e as chamadas de teste saem autenticadas.

Cria a pasta `dados/` ao lado do executável da API (ver [Pasta `dados/`](#pasta-dados)) e mantém seu próprio contador de rate limit em memória.

### Endpoints

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/configuracao` | Agrupamento, tags detalhadas (fonte única do Toggl) e último período do Relatório |
| `PUT` | `/api/configuracao` | Atualiza agrupamento/tags e, se informados, o período. `dataInicio`/`dataFim` são opcionais — omitidos, preservam o período salvo |
| `GET` | `/api/usuarios-toggl` | Lista usuários do Toggl cadastrados (token mascarado, inclui `administrador`) |
| `POST` | `/api/usuarios-toggl` | Cadastra um usuário (valida o token por padrão); `administrador: true` desmarca qualquer outro administrador |
| `PUT` | `/api/usuarios-toggl/{chave}` | Edita nome, token e/ou `administrador`; `tokenApi` omitido/vazio mantém o salvo; só um administrador por vez |
| `DELETE` | `/api/usuarios-toggl/{chave}` | Remove um usuário |
| `POST` | `/api/usuarios-toggl/validar-token` | Valida um API Token do Toggl, sem salvar |
| `GET` | `/api/usuarios-toggl/tags?forcarAtualizacao=` | Tags reais do workspace do Toggl, usando o token do usuário `administrador`; cacheada em `TogglTagsCache.ini` até `forcarAtualizacao=true`; 400 se não há administrador |
| `POST` | `/api/consultas` | Consulta o Toggl (cache-first, respeita o rate limit) e salva o retorno cru em `RelatorioData.ini` |
| `GET` | `/api/relatorio?dataInicio=&dataFim=` | Relatório agrupado a partir do cache; 409 se não há cache para esse período exato |
| `GET` | `/api/busca?termo=` | Busca por descrição sobre o cache do Relatório; 409 sem cache |
| `GET` | `/api/dados/download` | Baixa `dados.zip` com **todos** os arquivos da raiz de `dados/` (sem lista fixa — inclui qualquer arquivo que esteja lá); 404 se a pasta está vazia |
| `POST` | `/api/dados/restaurar` | Restaura `dados/` a partir de um `.zip` (`multipart/form-data`, campo `arquivo`); ver [Pasta `dados/`](#pasta-dados) |
| `GET` | `/api/gant/parametros` | Período do Gant + agrupamento/tags (mesma fonte única do Toggl) |
| `PUT` | `/api/gant/parametros` | Atualiza período (opcional, como em `/api/configuracao`) e agrupamento/tags; 400 se `agrupamento` inválido |
| `POST` | `/api/gant/consultas` | Igual a `/api/consultas`, mas grava em `GantData.ini` |
| `GET` | `/api/gant?dataInicio=&dataFim=&termo=` | Gant por usuário/categoria/descrição, dia a dia (só dias úteis); `termo` filtra por descrição; 409 sem cache |
| `GET` | `/api/sprints` | Lista os sprints (inclui `Fechado`) |
| `POST` | `/api/sprints` | Cadastra um sprint (`Nome`, `HorasPorDia`, `DataInicio`, `DataFim`) — 400 (nome vazio, datas inválidas, `fim < inicio`, `HorasPorDia <= 0`) / 409 (nome em uso); nasce aberto |
| `PUT` | `/api/sprints/{chave}` | Edita um sprint (campos `null`/vazios não alteram); 409 se estiver fechado |
| `DELETE` | `/api/sprints/{chave}` | Remove o sprint **e** seus três arquivos de cache (`SprintData_<chave>.ini`, `JiraSprintData_<chave>.ini` e `JiraPlanejamentoData_<chave>.ini`) |
| `POST` | `/api/sprints/{chave}/fechar` | Marca `Fechado = true`; trava edição e faz a consulta do sprint usar só o cache |
| `POST` | `/api/sprints/{chave}/reabrir` | Marca `Fechado = false` |
| `GET/PUT` | `/api/sprint/categorias` | Mapeamento global tag → DEV/REV/QA + agrupamento + tags detalhadas + cor da tag: `{ dev, rev, qa, agrupamento, tagsDetalhadas, corTag }`. `PUT` normaliza as listas (trim, distinct case-insensitive, descarta vazias) e valida `agrupamento` (400) |
| `GET/PUT` | `/api/sprint/responsabilidade` | Status do Jira por grupo responsável: `{ statusDev, statusRev, statusQa }` |
| `GET/PUT` | `/api/sprint/status-final` | Status do Jira que contam como concluídos/ignorados nos totalizadores do cabeçalho do Sprint: `{ statusConcluido, statusIgnorado }`; `PUT` devolve 400 se o mesmo status estiver nas duas listas |
| `POST` | `/api/sprint/consultas` | Como `/api/consultas`, com `chaveSprint` obrigatório (400 se vazio ou inválido para nome de arquivo; 404 se o sprint não existe). Grava `SprintData_<chave>.ini` e, com o Jira configurado, `JiraSprintData_<chave>.ini`. `origem` (`nenhum`\|`toggl`\|`jira`\|`ambos`, default `nenhum`) escolhe o que **forçar**, não a fonte; sprint fechado ignora `origem` e devolve 409 se não houver cache batendo |
| `GET` | `/api/sprint?chaveSprint=` | Acompanhamento do sprint (capacidade, colaboradores, grid); 409 sem cache para o período do sprint |
| `POST` | `/api/sprint/planejamento/consultas` | `{ chaveSprint, forcar }` → `{ veioDoCache, atualizadoEm, quadroNome, sprintJiraNome, quantidadeCartoes }`. Reaproveita o cache salvo ou busca ao vivo os cartões do sprint ativo do quadro (ver [Planejamento](#planejamento)); grava `JiraPlanejamentoData_<chave>.ini`. 400 (sem quadro/conexão/campos configurados, chave inválida), 404 (sprint), 409 (sprint fechado sem cache), 502 (falha do Jira) |
| `GET` | `/api/sprint/planejamento?chaveSprint=` | Planejamento montado a partir do cache (`nomeQuadro`, `sprintJiraNome`/`Inicio`/`Fim`, `atualizadoEm`, `colunas`, `totaisPorColuna`, `cartoes`, `colaboradores`); 409 sem cache — nunca chama o Jira |
| `GET/PUT` | `/api/jira/configuracao` | URL do domínio, e-mail, quadro de DEV (`quadroId`/`quadroNome`), campos de estimativa (desenvolvimento/revisão/testes), "revisado por" e "analisado por"; token sempre mascarado. `PUT` **substitui a configuração inteira**; `apiToken` omitido/vazio mantém o salvo (400 se nunca houve um) |
| `POST` | `/api/jira/testar-conexao` | Testa `email`/`urlDominio`/`apiToken` informados **sem salvar** (`GET /rest/api/3/myself`) — sempre `200` com `{ sucesso, mensagem }` |
| `POST` | `/api/jira/campos` | Lista os campos **customizados** do Jira (`GET /rest/api/3/field`, `custom: true`); credenciais no corpo são opcionais — omitidas, usa a configuração salva (400 se nenhuma existir) |
| `POST` | `/api/jira/issues` | Busca em lote (JQL `key in (...)`) prioridade, situação, estimativas, responsável e revisado por, com a configuração salva; issue não encontrada só fica ausente |
| `GET` | `/api/jira/status?forcarAtualizacao=` | Nomes reais de status (`GET /rest/api/3/status`), cacheados em `JiraStatusCache.ini`; 400 sem configuração do Jira |
| `GET` | `/api/jira/prioridades?forcarAtualizacao=` | Idem para prioridades (`GET /rest/api/3/priority`), cache `JiraPrioridadesCache.ini` |
| `GET` | `/api/jira/usuarios?forcarAtualizacao=` | Nomes reais de usuários (`GET /rest/api/3/users/search`, paginado, só `atlassian` ativos), cache `JiraUsuariosCache.ini` |
| `GET/PUT` | `/api/jira/cores` | Cor (hex) por nome de status e de prioridade: `{ coresStatus, coresPrioridade }` |
| `GET/PUT` | `/api/jira/usuarios-mapeamento` | Mapeamento `displayName` do Jira → usuário Toggl (`ChaveToggl`) ou usuário exclusivo do Jira (`Sigla`/`Cor`); alimenta o fallback DEV/REV do Sprint e a resolução das pessoas do Planejamento |
| `GET` | `/api/jira/quadros?forcarAtualizacao=` | Quadros **Scrum** reais do Jira (`GET /rest/agile/1.0/board?type=scrum`, paginado por `isLast`), cache `JiraQuadrosCache.ini`; 400 sem configuração do Jira, 502 se o Jira falhar |

**Erros**: 400 (parâmetros/datas inválidos), 404 (recurso não encontrado), 409 (nome em uso; sem cache correspondente; sprint fechado), 500 (`Results.Problem`, falha de I/O), 502 (falha do Jira, também via `Results.Problem`). `GET /api/relatorio`, `/busca`, `/gant`, `/sprint` e `/sprint/planejamento` **exigem cache prévio** — nunca disparam consulta implícita, para manter explícito quando uma chamada externa ao Toggl acontece (rate limit).

### Exemplos de request/response

**`POST /api/consultas`**
```json
// Request
{ "dataInicio": "2026-08-01", "dataFim": "2026-08-31", "forcarConsultaApi": false }

// Response 200
{
  "dataInicio": "2026-08-01", "dataFim": "2026-08-31", "veioDoCache": true,
  "usuarios": [
    { "nomeUsuario": "Joao Silva", "status": "Sucesso", "mensagem": null, "quantidadeRegistros": 12 }
  ]
}
```
`status` é sempre uma string: `Sucesso`, `Erro`, `LimiteAtingidoComCache` ou `LimiteAtingidoSemCache`.

**`GET /api/relatorio?dataInicio=2026-08-01&dataFim=2026-08-31`** — 409 se não houver consulta salva para esse período exato (chame `POST /api/consultas` primeiro); 200 com, por usuário, `porDescricao` (cada item traz `descricao`, `segundos` e `tag`), `porTag`, `emAndamento` e `totalSegundos`. **Atenção**: os itens de `emAndamento` vêm em **snake_case** (`workspace_id`, `project_id`, `description`, `duration`, `start`, `stop`) — é o DTO cru reaproveitado do Toggl; o resto da API é camelCase.

**`GET /api/busca?termo=reuniao`** — 409 se não há cache ainda; 200 com `linhas` (descrição, segundos por usuário, total da linha) e `totalGeralSegundos`.

### Gráfico de Gant

`/api/gant/*` é um segundo fluxo, com período e cache (`dados/GantData.ini`) **independentes** do relatório — reaproveita a mesma lista de usuários, o mesmo `ServicoConsulta` e o mesmo agrupamento/tags (fonte única do Toggl). `GET /api/gant` devolve `{ dias, linhas }`: `dias` são só os **dias úteis** do período (sábado/domingo ocultos); cada linha pertence a um único usuário, agrupada por categoria (tag) + descrição — tags detalhadas viram uma linha por descrição, as demais ficam agregadas numa única linha por tag. O parâmetro `termo` filtra por descrição antes de agrupar.

Cada usuário tem quatro campos próprios (em `TogglUsuarios.ini`): `sigla`/`cor` (identificação visual), `selecionado` (`bool`, default `true` — só usuários selecionados entram na próxima consulta de Relatório, Gant ou Sprint) e `administrador` (`bool`, default `false` — o token dele é usado nas chamadas sem usuário específico, como `GET /api/usuarios-toggl/tags`; só um por vez, garantido por `ServicoUsuariosToggl.DesmarcarOutrosAdministradores`).

### Sprint

`/api/sprints` e `/api/sprint/*` são a terceira visualização. Diferente do relatório e do Gant, tem **gestão** (CRUD de sprints) além do acompanhamento. Cada sprint tem `Nome`, `HorasPorDia`, `DataInicio`, `DataFim` e `Fechado`; o mapeamento tag → categoria, a responsabilidade por status e os status finais são **globais** (não por sprint), e o cache de consulta é **um arquivo por sprint** (ver [Pasta `dados/`](#pasta-dados)) — consultar um sprint nunca sobrescreve o cache de outro.

`POST /api/sprint/consultas` reaproveita o `ServicoConsulta` inteiro (cache-first, rate limit, filtro por `selecionado`). `GET /api/sprint` monta o acompanhamento por `ServicoSprint.Montar`:

- **Capacidade**: `diasUteis` (seg–sex no período, inclusive) → `tempoTotal = HorasPorDia × diasUteis` → `margem = floor(30% × tempoTotal)` → `TD = floor(tempoTotal − margem)` (tempo por colaborador) → `CT = TD × nº de colaboradores selecionados` (capacidade total). Ex.: `HorasPorDia=7`, `2026-09-01`→`2026-09-24` → `diasUteis=18`, `tempoTotal=126`, `margem=37`, `TD=89`.
- **Totalizadores do cabeçalho** (`TarefasPendentes`/`TarefasConcluidas`): contam **descrições distintas** (nunca linhas de tag). Concluídas = `Situacao` em `statusConcluido`; Pendentes = `Situacao` fora de `statusConcluido` **e** de `statusIgnorado`. Sem nenhuma das listas configurada, Concluídas = 0 e Pendentes = todas.
- **Colaboradores** (`LinhaColaboradorSprint`): uma linha por colaborador selecionado, com `Td`, `SegundosRealizados` (todos os apontamentos `>= 0` no cache do sprint, com ou sem tag de categoria) e `TarefasPendentes`/`TarefasConcluidas`. Estes dois **não** usam `statusConcluido`/`statusIgnorado`: contam, por **grupo** DEV/REV/QA que o colaborador ocupa em cada linha de descrição, a mesma classificação Pendente/Concluído da coluna "Situação" do grid. "Disponível" (`Td − realizado`) é calculada no frontend.
- **Grid de tarefas**: uma linha por `(Chave, Agrupada)` vinda da chave de agrupamento (mesma regra descricao/tag/ambos do Gant). Cada linha traz `Codigo`, `Descricao`, `Agrupada`, três blocos `Dev`/`Rev`/`Qa` (`PreHoras`, `ReaSegundos`, colaborador, sigla, cor) e, se houver Jira, `Prioridade`/`Situacao`.
  - **Linha de descrição**: descrição normalizada "TEL"; `Codigo`/`Descricao` separados pelo regex `^(TEL - \d+)(?: - (.+))?$` (sem casar, `Codigo` vazio). `ReaSegundos` de cada grupo = tempo do colaborador naquela descrição com tags da categoria. **Mescla** colaboradores por empacotamento guloso, na ordem dos selecionados: cada um entra na primeira linha aberta cujos slots DEV/REV/QA que ele ocupa estejam livres, senão abre linha nova — categorias diferentes da mesma descrição mesclam, mesma categoria fica em linhas separadas.
  - **Linha de tag** (só com agrupamento `tag`/`ambos`): `Codigo` vazio, `Descricao` = nome da tag, **um colaborador por linha, nunca mescla**. Todo o tempo do colaborador na tag vai para **um** grupo: QA se ele tem ≥1 apontamento com tag de QA, senão DEV (REV nunca recebe tag).
  - **Ordenação**: pelo **número** do código (`TEL - 994 → TEL - 1000`), não por string; linhas de descrição primeiro, depois as de tag.
- **Situação por grupo** (responsabilidade por status): (1) o status da issue bate com um grupo → esse grupo "Pendente" e os demais (com colaborador) "Concluído"; (2) há responsabilidade configurada e a tarefa foi encontrada, mas o status não bate com nenhum grupo → todos "Concluído" (`SituacaoSemGrupoResponsavel`); (3) sem responsabilidade configurada ou tarefa não encontrada → todos "Pendente".
- **Busca, filtros e ordenação** da tela são **client-side**, sobre a lista já carregada — sem nova chamada à API.

**Fechar/reabrir**: `fechar`/`reabrir` só alternam `Fechado`, sem mexer em cache — fechar não copia dado nenhum, o cache já salvo simplesmente nunca mais é sobrescrito. A trava é sempre do backend: `PUT /api/sprints/{chave}` devolve 409 se fechado, e `POST /api/sprint/consultas` ignora o `origem` recebido, força `nenhum` e devolve 409 se não houver cache do Toggl batendo (nunca chama Toggl/Jira de verdade). `Fechado` só muda por `fechar`/`reabrir`, nunca pelo `PUT` genérico.

> Prioridade e Situação **não são editáveis nem persistidas** pelo usuário: vêm do Jira (somente leitura, de `JiraSprintData_<chave>.ini`). Sem integração ou issue não encontrada, os badges caem em "Nenhuma" e o PRE em "–".

### Planejamento

`POST /api/sprint/planejamento/consultas` e `GET /api/sprint/planejamento` alimentam o botão **Planejar** do Sprint: os cartões do **sprint ativo do quadro Scrum de DEV** do Jira, por coluna do quadro, com a contagem de cartões por colaborador. Só Jira — não consulta o Toggl nem usa o cache do Sprint.

- **Escopo**: `GET /rest/agile/1.0/board/{id}/sprint?state=active` → cartões via `GET /rest/agile/1.0/board/{id}/issue?jql=sprint in (ids)` (páginas de `maxResults=200` até `startAt >= total`; 429 com 1 retry respeitando `Retry-After`). Nunca busca o quadro inteiro (milhares de cartões). O Jira **não tem sprint equivalente ao do app** (o time agrupa "sprints" por épicos com o período no título), então o Planejamento **não correlaciona** os dois: mostra o sprint ativo do quadro e o nome dele; o cache é por sprint do app só para preservar o "retrato" (sprint fechado = definitivo).
- **Colunas e Grupo**: as colunas vêm de `GET /board/{id}/configuration`; a coluna do cartão é a que contém o `status.id` dele (status fora de todas as colunas → "(sem coluna)", no fim). O **Grupo** é o pai do cartão (`fields.parent`, sempre um Épico — o campo Agile `epic` vem vazio); sem pai, vazio.
- **Colaboradores**: um cartão conta **1** para a pessoa se ela é o Responsável **ou** o "Revisado por" (distinct); os colaboradores saem em ordem alfabética por `ComparadorNomes` (ignora caixa e acento); "Analisado por" é exibido mas não conta nem cria colaborador. Cada pessoa é resolvida pelo mapeamento Jira↔Toggl contra **todos** os usuários do Toggl cadastrados (não só os selecionados — não há consulta de Toggl); usuário exclusivo do Jira usa a `Sigla`/`Cor` da entrada; sem mapeamento (ou `ChaveToggl` órfão) a sigla são as iniciais (até 3), a cor fica nula e `mapeado = false`.
- **Código/Descrição**: `ServicoCodigoTel` — `Codigo` é a chave normalizada (`TEL - 1431`); `Descricao` é o resumo sem o prefixo quando o número bate com o da chave, senão o resumo cru; chave não-TEL vira chave + resumo.
- **Cache** `JiraPlanejamentoData_<chave>.ini` (um por sprint; dado **cru**: `QuadroId`, `QuadroNome`, `SprintJira`, `Colunas`, `Cartoes`, `AtualizadoEm` — coluna, contagens e siglas são calculadas em runtime). `POST .../consultas` reaproveita o cache, exceto com `forcar = true` ou sem cache válido (ausente, `QuadroId` diferente do configurado ou `SprintJira` nulo). **Sprint fechado nunca chama o Jira**: ignora `forcar` e devolve o cache ou 409. Falha do Jira devolve 502 e mantém o cache anterior. O `GET` nunca dispara consulta.
- **Configuração** (`GET/PUT /api/jira/configuracao`): o quadro (`QuadroId`/`QuadroNome`, em `JiraConexao.ini`, escolhido entre `GET /api/jira/quadros`) e o campo customizado "Analisado por" (`[Campo:AnalisadoPor]` em `JiraCampos.ini`, user picker como "Revisado por") são obrigatórios para consultar — sem eles o `POST` devolve 400.

### Jira

A configuração vive em `JiraConexao.ini` (URL, e-mail, `ApiToken` criptografado do mesmo jeito que o do Toggl e o quadro de DEV do Planejamento) e `JiraCampos.ini` (campos customizados: as três estimativas, "Revisado por" e "Analisado por"), mascarada (`ServicoUsuariosToggl.MascararToken`) em toda resposta. `ClienteApiJira` autentica com Basic `email:apiToken` contra `https://<dominio>/rest/api/3/`, normalizando a URL (com ou sem `https://`). `POST /api/jira/testar-conexao` sempre exige as três credenciais no corpo (valida exatamente o que está na tela); `POST /api/jira/campos` usa as do corpo ou, se vazio, as salvas, e filtra a `custom: true`.

**Integração com o Sprint** (`POST /api/jira/issues`, embutida em `POST /api/sprint/consultas`): busca em lote via JQL `key in (TEL-994,...)` — nunca uma chamada por tarefa — pedindo `priority`, `status`, `assignee` (nativo) e quatro campos customizados configuráveis: `CampoEstimativaDesenvolvimentoId`, `CampoEstimativaRevisaoId`, `CampoEstimativaTestesId` (PRE de DEV/REV/QA, convertidos para horas; sem o campo de um grupo, o PRE dele fica 0) e `CampoRevisadoPorId` (extrai só o `displayName`, como o `assignee`). `CampoAnalisadoPorId` só é lido pelo [Planejamento](#planejamento).

- **Sempre `POST /rest/api/3/search/jql`**: `GET`/`POST /rest/api/3/search` foi descontinuado (410 Gone).
- **Paginação**: o endpoint devolve no máximo 100 issues por página; `BuscarIssuesAsync` pagina com `nextPageToken`/`isLast` (`maxResults` fixo em 100) — sem isso, sprints com mais de 100 códigos TEL perdiam issues em silêncio.
- **Quando roda**: os códigos TEL são extraídos de **todos** os registros crus do Toggl recém-buscados (independe do agrupamento) e o resultado vai para `JiraSprintData_<chave>.ini`. O Jira atualiza sempre que `origem` força o Jira **ou** quando o Toggl fez uma consulta real; nunca só por reaproveitar cache. Falha de rede/autenticação do Jira derruba só a atualização do Jira, nunca a consulta do Toggl.
- **Aplicação**: `ServicoSprint.Montar` aplica Prioridade/Situação só às linhas de descrição (nunca de tag) e a estimativa de cada grupo ao bloco correspondente.

**Fallback DEV/REV via mapeamento Jira↔Toggl** (`JiraTogglMapeamento.ini`): o bloco **DEV** vem de `Responsavel` (assignee) e o **REV** de `RevisadoPor` — nunca o contrário. Só preenche quando nenhuma linha daquela descrição já tem colaborador no bloco (nunca sobrescreve tempo real) e, se a entrada mapeia um usuário Toggl (`ChaveToggl`), ele está entre os selecionados da consulta; entradas exclusivas do Jira usam `Sigla`/`Cor` próprias e não exigem seleção. Afeta só a 1ª linha de descrição do grupo. É sugestão visual (0 segundos) — não conta como tempo realizado, capacidade nem pendências.

**Cores**: a busca de issues não expõe cor de prioridade/status (só `statusCategory`), então a cor de cada badge vem de um mapeamento por nome exato (`GET/PUT /api/jira/cores`, guardado em `JiraStatus.ini`/`JiraPrioridades.ini`), alimentado pela listagem real de nomes. Sem cor configurada, **Prioridade** cai numa paleta por severidade (Muito alta → Muito baixa) e **Status** no cinza dos badges "Nenhuma".

### Decisões desta camada

- **Minimal APIs**, um arquivo por grupo de endpoints em `Endpoints/` (`Map*Endpoints(this WebApplication app, ...)`), DTOs em `Dtos/` — todo endpoint delega para `TogglReport.Nucleo`. Helpers internos: `ValidacaoDatas.Tenta` (parse de datas + `fim < inicio`) e `TratamentoIo.Executar` (converte `IOException`/`UnauthorizedAccessException` em `500` com mensagem limpa).
- **Stateless entre requisições**: a API nunca mantém registros baixados em memória — toda leitura de relatório/busca relê o `.ini` de cache. Reaproveitar o cache fica simples, sem sessão.
- **CORS liberado** (`AllowAnyOrigin/Header/Method`) — pensado para uso local.
- **Enums serializados como string** (`JsonStringEnumConverter`) — `status` de `/api/consultas` aparece como texto.
- **Swashbuckle.AspNetCore** — única dependência NuGet do repositório (Swagger). A UI tem CSS próprio (`SwaggerUIOptions.HeadContent`) e usa o ícone do projeto, servido via `app.UseStaticFiles()`. O esquema `basic` só é registrado quando a autenticação está ligada (é o que faz o botão "Authorize" aparecer).
- **Autenticação HTTP Basic opcional** — desligada por padrão; liga com `AUTH__USUARIO`/`AUTH__SENHA`. `/health`, `/swagger` e `/images` nunca exigem. A resposta 401 não traz `WWW-Authenticate` (evita o popup nativo do navegador; o frontend tem tela de login própria).

---

## Pasta `dados/`

Ao lado do executável da API (`AppContext.BaseDirectory/dados`), **plana**: todos os arquivos ficam na raiz, em um único formato (INI relacional, sem migração de formatos antigos). `CaminhosDados` monta todos os caminhos. Tudo já está no `.gitignore`/`.dockerignore`.

| Arquivo | Conteúdo |
|---|---|
| `TogglUsuarios.ini` | `[Usuario:<chave>]` — `NomeExibicao`, `TokenApi` (criptografado), `Sigla`, `Cor`, `Selecionado`, `Administrador` |
| `TogglConfiguracao.ini` | `[Geral]` — `Agrupamento` (`descricao`/`tag`/`ambos`, padrão `ambos`) e `CorTag`; **fonte única** para Relatório, Gant e Sprint |
| `TogglTags.ini` | `[Tag:<nome>]` — `Categorias` (`Dev`/`Rev`/`Qa`, lista) e `Detalhar` (bool). Padrão vazio: nenhuma tag, nenhuma cor |
| `JiraConexao.ini` | `[Conexao]` — `UrlDominio`, `Email`, `ApiToken` (criptografado, prefixo `enc:`), `QuadroId`, `QuadroNome` (quadro de DEV do Planejamento) |
| `JiraCampos.ini` | `[Campo:EstimativaDesenvolvimento\|EstimativaRevisao\|EstimativaTestes\|RevisadoPor\|AnalisadoPor]` — `Id`, `Nome` |
| `JiraStatus.ini` | `[Status:<nome>]` — `Cor`, `Responsaveis` (`Dev`/`Rev`/`Qa`) e `Final` (`Concluido`\|`Ignorado`; mutuamente exclusivos) |
| `JiraPrioridades.ini` | `[Prioridade:<nome>]` — `Cor` |
| `JiraTogglMapeamento.ini` | `[Usuario:<displayName do Jira>]` — `ChaveToggl`, `Sigla`, `Cor` |
| `Sprints.ini` | `[Sprint:<chave>]` — `Nome`, `HorasPorDia` (decimal, `InvariantCulture`), `DataInicio`, `DataFim` (`yyyy-MM-dd`), `Fechado` (padrão `False`) |
| `RelatorioParametros.ini`, `GantParametros.ini` | só `DataInicio`/`DataFim` (o agrupamento vem de `TogglConfiguracao.ini`) |
| `RelatorioData.ini`, `GantData.ini` | cache **único** por visualização (`[Geral]` + `[Usuario:<chave>]`, retorno cru do Toggl em JSON, `TokenApi` criptografado); bate só por período + usuários, e trocar de período sobrescreve |
| `SprintData_<chaveSprint>.ini` | cache do Toggl **por sprint** (`[Sprint]` + `[Usuario:<chave>]`) |
| `JiraSprintData_<chaveSprint>.ini` | cache das issues do Jira **por sprint** (`[Sprint]` com `Issues` em JSON, sem token) |
| `JiraPlanejamentoData_<chaveSprint>.ini` | cache **cru** do Planejamento **por sprint** (`[Planejamento]`: quadro, sprint ativo do Jira, colunas e cartões; sem token) |
| `TogglTagsCache.ini`, `JiraStatusCache.ini`, `JiraPrioridadesCache.ini`, `JiraUsuariosCache.ini`, `JiraQuadrosCache.ini` | caches de listagens reais (tags do Toggl; status, prioridades, usuários e quadros Scrum do Jira), renovados com `forcarAtualizacao=true` |

- **Cache indexado por `Chave`** do usuário (não pelo nome, que pode mudar): o cache "bate" com a consulta quando o período é igual **e** todo usuário atual acha seu par por `Chave` + `TokenApi`.
- **Chave do sprint em nome de arquivo**: só letras, dígitos, `-` e `_` (até 100 caracteres); chave inválida em consulta/acompanhamento devolve 400.
- **Renomear ou mudar o formato de um `.ini` não tem migração automática** — troque a constante em `CaminhosDados`, renomeie o arquivo real à mão e não deixe lógica de compatibilidade no código.

### Backup e restauração (`/api/dados/*`)

- **Download**: zip **plano** de todos os arquivos da raiz de `dados/` (sem lista fixa — se houver um `dados.zip` antigo na pasta, ele entra no zip também).
- **Restauração**: `POST /api/dados/restaurar` extrai **qualquer** arquivo da raiz do `.zip`, sem lista de nomes permitidos, com `overwriteFiles: true` — sobrescreve só os arquivos presentes no zip (os demais, inclusive caches, ficam intactos) e cria a pasta se preciso. Serve para o primeiro uso e para reimportar sobre dados existentes; não invalida cache nenhum. 400 se algum arquivo do zip estiver dentro de uma pasta (compacte o **conteúdo** de `dados/`, não a pasta) ou se o arquivo não for um `.zip` válido; 500 com mensagem limpa em falha de I/O.

---

## Docker

A imagem (`Dockerfile`, base `aspnet:10.0-alpine`) roda o `dotnet` como usuário **não-root** (`$APP_UID`), mas os volumes `dados/`/`certificado/` são **bind mounts** do host (`./dados:/app/dados`), que o Docker cria como `root:root` — o que bloqueava escritas (ex.: `POST /api/dados/restaurar` falhava com `UnauthorizedAccessException`). O `entrypoint.sh` resolve: o container inicia como `root`, faz `chown` de `dados/`/`certificado/` para `$APP_UID` e só então troca de usuário via `su-exec` antes de rodar `dotnet TogglReport.Api.dll` — o processo da aplicação continua não-root; só o ajuste de permissão roda como root, uma vez, no início.

**Globalização invariante**: a imagem `aspnet:10.0-alpine` não traz ICU e o runtime sobe em modo *globalization-invariant* (`DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=true`), onde qualquer cultura **nomeada** lança `CultureNotFoundException` (`new CultureInfo("pt-BR")`); só `InvariantCulture` funciona. Como os `.csproj` declaram `InvariantGlobalization=false` e o Windows tem ICU, o desenvolvimento local **não reproduz** o erro — valide no Docker ou com `DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1`. Por isso o backend **não usa cultura nomeada** (habilitar ICU custaria tamanho de imagem e dependência de ambiente): nomes são ordenados por `ComparadorNomes` (caixa e acento ignorados por tabela manual de diacríticos, `CompareOrdinal`, desempate pelo texto original). `OrdinalIgnoreCase`, usado nas demais ordenações, não ignora acento.

## Estrutura de arquivos

```
toggl-report-back/
 ├─ TogglReport.slnx
 ├─ TogglReport.Api/                    # Web API
 │   ├─ Program.cs
 │   ├─ Autenticacao/                   # middleware de HTTP Basic opcional
 │   ├─ Dtos/                           # um record por request/response
 │   ├─ Endpoints/                      # um Map*Endpoints por grupo de rotas + helpers (ValidacaoDatas, TratamentoIo)
 │   ├─ Properties/launchSettings.json
 │   └─ wwwroot/                        # só o ícone do Swagger (images/) e seus favicons
 └─ TogglReport.Nucleo/                 # referenciado pela Api
     ├─ Configuracao/                   # modelos + carregadores de cada .ini, CaminhosDados, AnalisadorIni, criptografia, helpers
     ├─ Toggl/                          # cliente da API v9, DTOs, rate limiter
     ├─ Relatorios/                     # agrupamento, busca por descrição, ServicoCodigoTel e ComparadorNomes
     ├─ Consultas/                      # ServicoConsulta (cache-first + rate limit)
     ├─ Gant/                           # ServicoGant + modelos
     ├─ Sprint/                         # ServicoSprint + modelos (namespace RelatorioToggl.Sprints)
     ├─ Planejamento/                   # ServicoPlanejamento + modelos (namespace RelatorioToggl.Planejamento)
     └─ Jira/                           # ClienteApiJira, IssueJira, quadro/sprint/cartões do Jira, caches (issues, quadros, planejamento)
```

## Segurança

**Tokens criptografados em repouso.** `TogglUsuarios.ini`, `JiraConexao.ini`, `RelatorioData.ini`, `GantData.ini` e `SprintData_<chave>.ini` guardam API Tokens **criptografados** (AES; prefixo `enc:`; chave derivada de `CHAVE_CRIPTOGRAFIA`).
Sem essa variável, vale uma chave padrão embutida no código-fonte — proteção mínima, que não resiste a quem lê o código. Valor sem o prefixo `enc:` é tratado como texto puro legado e passa a ser criptografado no próximo salvamento.
Os caches de consulta também guardam o retorno cru do Toggl, **não criptografado**.

Os demais arquivos (`TogglConfiguracao.ini`, `TogglTags.ini`, `JiraCampos.ini`, `JiraStatus.ini`, `JiraPrioridades.ini`, `JiraTogglMapeamento.ini`, `Sprints.ini`, `*Parametros.ini`, `JiraSprintData_*.ini`, `JiraPlanejamentoData_*.ini` e os caches de listagens) não têm token.

Nenhum arquivo de `dados/` é versionado (`.gitignore`/`.dockerignore` ignoram a pasta inteira, em qualquer profundidade) — trate os que têm token como segredo mesmo assim.

**Mudar `CHAVE_CRIPTOGRAFIA` invalida os tokens já gravados.** Trocar a chave (ou passar a usar/deixar de usar a variável) faz os `enc:` existentes não decifrarem — os tokens precisam ser reinseridos.

**Gotcha operacional — rode com a chave certa.** Sem a `CHAVE_CRIPTOGRAFIA` correta (a mesma do `.env` de quem gravou os dados), a descriptografia falha silenciosamente e o token chega como texto `enc:...` inválido: o cache **não "bate"** (o par `Chave` + `TokenApi` diverge) e a consulta segue para a **rede real**, gastando rate limit e falhando com 401. Para testes, use uma **cópia** da pasta `dados/` (e a mesma chave) em vez de apontar a API para os dados reais — uma consulta indevida pode sobrescrever caches.

**Restauração sem whitelist.** `/api/dados/restaurar` extrai qualquer arquivo da raiz do `.zip` para `dados/`: exponha a API só com a autenticação Basic ligada (`AUTH__USUARIO`/`AUTH__SENHA`) e trate o `.zip` de backup como segredo.

### Variáveis de ambiente em dev (Visual Studio)

As três env vars da API — `AUTH__USUARIO`, `AUTH__SENHA` (autenticação Basic opcional; ambas vazias = sem autenticação) e `CHAVE_CRIPTOGRAFIA` (vazia = chave padrão embutida) — vão no bloco `environmentVariables` de `TogglReport.Api/Properties/launchSettings.json`, já presente com valores vazios como template.

Pela IDE: **Propriedades do projeto → Depurar → "Abrir interface do usuário de perfis de inicialização de depuração" → Variáveis de ambiente**. `AUTH:*` são lidas via `IConfiguration` (o provider de env vars mapeia `AUTH__USUARIO` → `AUTH:USUARIO`); `CHAVE_CRIPTOGRAFIA` é lida direto via `Environment.GetEnvironmentVariable`.

Como `launchSettings.json` é versionado, para guardar valores reais sem commitar: `git update-index --skip-worktree toggl-report-back/TogglReport.Api/Properties/launchSettings.json` ou defina as variáveis no ambiente do Windows (o VS herda). Fora de dev, o `docker-compose.yml` lê as três do `.env` da raiz (gitignored; `.env.example` é o template).

## Limitações conhecidas

- Sem paginação: `/me/time_entries` traz tudo do período numa única chamada — períodos muito longos podem ser lentos ou esbarrar em limites de histórico da conta (erro 400).
- Datas são tratadas como dias no fuso local e convertidas para UTC na chamada à API.
- Não resolve nome de projeto/cliente — agrupamento é só por descrição e tag.
- Limite de 30 requisições/hora por usuário do Toggl é só em memória, **por processo** — não persiste entre reinícios da API (não é o mesmo mecanismo do retry de 429 do `ClienteApiToggl`, que respeita `Retry-After` da própria API do Toggl e tenta uma vez).
- Sem testes automatizados.