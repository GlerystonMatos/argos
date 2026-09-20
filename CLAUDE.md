# CLAUDE.md

Memória de contexto persistente do repositório **toggl-report**. Histórico de mudanças
fica no `git log`; este arquivo documenta só o que **não** é derivável do código:
arquitetura, regras de domínio não óbvias e decisões que não devem ser revertidas sem
motivo.

O repositório reúne **dois projetos independentes**:

- **`toggl-report-back/`** — solução **C# / .NET 10** (`TogglReport.slnx`) com dois
  projetos: **`TogglReport.Nucleo`** (biblioteca de classes, toda a lógica de negócio e
  acesso a INI, zero `PackageReference`) e **`TogglReport.Api`** (Web API Minimal APIs,
  `Microsoft.NET.Sdk.Web`, referencia o núcleo, autenticação HTTP Basic opcional). Um
  projeto console (`TogglReport.Console`) chegou a existir e foi **removido por
  completo** — não recriar sem pedido explícito.
- **`toggl-report-front/`** — React 19 + TypeScript + MUI (Vite) que consome a Web API.

Aplicação: gera relatórios de tempo trabalhado a partir da **API v9 do Toggl Track**,
com três visualizações independentes — **Relatório**, **Gant** e **Sprint** — cada uma
com parâmetros e cache de consulta próprios, compartilhando só a lista de usuários, a
configuração de agrupamento/tags e o serviço de consulta (cache-first + rate limit).

**Tudo em pt-BR**: interface, mensagens, identificadores, pastas, namespaces
(`RelatorioToggl`/`RelatorioToggl.Api`/`RelatorioToggl.Sprints`). Em inglês só o
inevitável (`Program`, `Main`, `Task`/`async`, `[JsonPropertyName]` com nomes da API do
Toggl) e siglas (`Dto`, `Api`, `Ini`, `Http`, `Toggl`). **Sem comentários** em
`TogglReport.Nucleo` (nomes claros no lugar de comentário; regras de domínio não óbvias
ficam aqui, não inline). O frontend usa comentários com moderação.

---

## 1. Conceitos centrais

- **Multiusuário**: cada usuário do Toggl tem seu API Token pessoal; o relatório
  consolida todos. `ConfiguracaoUsuarioToggl` tem `Chave`/`NomeExibicao`/`TokenApi` +
  `Sigla` (rótulo curto), `Cor` (hex), `Selecionado` (decide quem entra na **próxima
  consulta** de relatório/Gant/Sprint) e `Administrador` (o token dele é usado em
  chamadas sem usuário específico, como listar tags reais do workspace). **Só um
  `Administrador` por vez**: `ServicoUsuariosToggl.DesmarcarOutrosAdministradores`
  desmarca o anterior no POST/PUT de `/api/usuarios-toggl`.
- **Cache de consulta**: cada visualização tem seu cache `.ini` guardando o retorno
  **cru** da última consulta por usuário. Período+usuários iguais → reaproveita o cache
  em vez de chamar a API; agrupamento/cálculo sempre roda em runtime (o cache nunca
  guarda resultado processado). Serve também de reserva quando o rate limit (§2) é
  atingido. `ServicoConsulta` (núcleo) centraliza essa decisão para as 3 visualizações
  — cada consumidor só decide **quando** chamar (`forcarConsultaApi`).
- **Sem exportação para CSV** — dados só existem no frontend e no cache.
- **Poucas dependências**: núcleo sem nenhum `PackageReference`; API só com
  `Swashbuckle.AspNetCore` (Swagger).

---

## 2. `TogglReport.Nucleo`

```
Configuracao/    modelos + carregadores/salvadores de todos os .ini, criptografia de token,
                 parser INI compartilhado (AnalisadorIni), helpers (ServicoChaves, DiasUteis,
                 Agrupamento.EhValido), CaminhosDados (instância: um caminho por arquivo)
Gant/            CelulaGant / LinhaGant / ResultadoGant / ServicoGant.Montar
Sprint/          (namespace RelatorioToggl.Sprints, plural — evita colidir com
                 Configuracao.Sprint) CabecalhoSprint / BlocoCategoriaSprint /
                 LinhaTarefaSprint / LinhaColaboradorSprint / ResultadoSprint / ServicoSprint
Toggl/           ClienteApiToggl (HTTP Basic, api.track.toggl.com/api/v9), RegistroTempoDto,
                 ResultadoApiToggl (Ok/Falha, sem exceptions), LimitadorRequisicoes
Relatorios/      ServicoAgrupamento (por descrição/tag), LinhaDescricao, ServicoBuscaDescricao
Consultas/       ServicoConsulta (cache-first + rate limit), ResultadoConsulta,
                 EventoConsultaUsuarioToggl / StatusConsultaUsuarioToggl
Jira/            ClienteApiJira (HTTP Basic email:apiToken, normaliza a URL do domínio),
                 CampoJira, ResultadoApiJira (Ok/Falha, mesmo padrão do Toggl)
```

### Modelo de dados (`dados/`, plana, INI relacional)

Formato **único**, sem lógica de migração/compatibilidade no código: mudar nome ou formato
de `.ini` = trocar a constante em `CaminhosDados` e ajustar/renomear o arquivo real à mão
(o cache antigo só fica órfão; uma nova consulta recria).

| Arquivo | Conteúdo |
|---|---|
| `TogglUsuarios.ini` | `[Usuario:<chave>]`; `TokenApi` criptografado (`enc:`) |
| `TogglConfiguracao.ini` | `[Geral]` `Agrupamento`/`CorTag` — **fonte única** de agrupamento do Relatório/Gant/Sprint |
| `TogglTags.ini` | `[Tag:<nome>]` `Categorias` (Dev,Rev,Qa) / `Detalhar` |
| `JiraConexao.ini` | `[Conexao]` URL/e-mail/token (`enc:`) |
| `JiraCampos.ini` | `[Campo:EstimativaDesenvolvimento\|EstimativaRevisao\|EstimativaTestes\|RevisadoPor]` `Id`/`Nome` |
| `JiraStatus.ini` | `[Status:<nome>]` `Cor`/`Responsaveis`/`Final` (Concluido\|Ignorado) |
| `JiraPrioridades.ini` | `[Prioridade:<nome>]` `Cor` |
| `JiraTogglMapeamento.ini` | `[Usuario:<displayName Jira>]` `ChaveToggl`/`Sigla`/`Cor` |
| `Sprints.ini` | `[Sprint:<chave>]` Nome/HorasPorDia/DataInicio/DataFim/`Fechado` (default `False`) |
| `RelatorioParametros.ini`, `GantParametros.ini` | `[Geral]` só `DataInicio`/`DataFim` |
| `RelatorioData.ini`, `GantData.ini` | cache **global** por período (se sobrescreve ao trocar de período) |
| `SprintData_<chave>.ini`, `JiraSprintData_<chave>.ini` | cache **um arquivo por sprint** (Toggl / Jira) |
| `TogglTagsCache.ini`, `JiraStatusCache.ini`, `JiraPrioridadesCache.ini`, `JiraUsuariosCache.ini` | listagens reais cacheadas |

- **Cache por sprint**: `DELETE` do sprint apaga os dois arquivos; o caminho só é montado a
  partir de sprint **existente** em `Sprints.ini` + validação de caracteres da chave
  (anti path-traversal) — `POST /api/sprint/consultas` com chave inexistente = 404,
  inválida = 400. Isolar por sprint é deliberado: consultar um sprint não perde o cache de
  outro.
- **`JiraStatus.ini`** (cor + responsabilidade DEV/REV/QA + final Concluído/Ignorado por
  status) é gravado por **3 endpoints** (`/api/sprint/responsabilidade`,
  `/api/sprint/status-final`, `/api/jira/cores`) vindos de duas abas independentes do
  front (Status dispara 2 PUTs em paralelo, Cores 1), então `ArquivoStatusJiraIni` faz
  read-modify-write (merge por seção) sob **lock estático**. Os demais arquivos ainda não
  têm lock.
- `PUT /api/configuracao` e `PUT /api/gant/parametros`: datas → arquivos de parâmetros
  próprios; agrupamento/tags → fonte única (`TogglConfiguracao.ini`/`TogglTags.ini`).

### Regras de domínio importantes

- **`RegistroTempoDto.Duracao`** negativo = timer em execução (isolado por
  `ServicoAgrupamento.ObterEmAndamento`, fora dos totais). Rótulos: `(sem descrição)`,
  `(sem tag)`.
- **Descrições "TEL" são normalizadas já na chave de agrupamento** (não só na
  exibição): "TEL-0000-AA" / "TEL-0000 - AA" / "TEL - 0000 - AA" viram sempre
  "TEL - 0000 - AA" antes de somar tempos (`ServicoAgrupamento.NormalizarDescricaoTel`).
  Só reformata quando há dígitos logo após "TEL" (não mexe em "TELA"/"TELEFONE").
- **Agrupamento** (relatório/Gant/Sprint): `descricao` | `tag` | `ambos`. Com
  `TagsDetalhadas` preenchidas e agrupamento "ambos": essas tags aparecem detalhadas por
  descrição e ficam fora do agrupamento por tag; as demais só aparecem agregadas por tag.
  Agrupamento "descricao" puro traz tudo (não filtra por `TagsDetalhadas`).
- **`TokenApi` (Toggl e Jira) é criptografado em repouso** (AES, chave de
  `CHAVE_CRIPTOGRAFIA`, fallback embutido se a env var não estiver configurada —
  proteção básica, não resiste a quem lê o código-fonte). Prefixo `enc:`; texto sem esse
  prefixo é tratado como legado e migra sozinho no próximo save. Token do Jira nunca
  volta em texto puro depois de salvo (`ServicoUsuariosToggl.MascararToken`).
- **Cache indexado por `Chave` de usuário** (não por `NomeExibicao`, que pode mudar).
  Bater os parâmetros exige mesmo período **e** todo usuário atual achar seu par no
  cache por `Chave` + `TokenApi` (descriptografado).
- **Rate limit (30 req/hora/usuário) é só em memória por processo** — reinicia a cada
  execução; não é o mesmo mecanismo do retry de 429 do `ClienteApiToggl` (esse trata o
  limite que a própria API do Toggl impõe, com `Retry-After` e 1 retry).
- **Erros da API do Toggl não usam exceptions** — `ResultadoApiToggl<T>` (Ok/Falha);
  401 reporta e pula o usuário sem abortar a consulta inteira.

### Sprint — regras de negócio (decididas com o usuário)

Terceira visualização, com **gestão** (CRUD de sprints) além do acompanhamento. O
mapeamento **global** TAG→categoria Dev/Rev/Qa + `CorTag` vive em `TogglTags.ini`/
`TogglConfiguracao.ini` (sem TAG default; sem `CorTag` configurada o frontend usa
`CORES.corIndisponivel` só na exibição, nunca persiste um default).

**Fechar/reabrir sprint** (`DadosSprint.Fechado`): "Fechar" fica no Acompanhamento
(`SprintView`), "Reabrir" na listagem (`SprintsPanel`), ambos com confirmação. Fechar
**não copia** dado nenhum — o cache por sprint já salvo vira "definitivo" por nunca mais
ser sobrescrito; reabrir só volta `Fechado` para `false`. Sempre reforçado no
**backend** (o estado `origem` do hook `useConsultaSprint` não reseta ao trocar de
sprint — um resíduo não pode furar a trava):
- `PUT /api/sprints/{chave}` devolve 409 se `Fechado`; no front o `SprintFormDialog` já
  abre todo `disabled` — o 409 é rede de segurança.
- `POST /api/sprint/consultas` carrega o sprint pela `ChaveSprint`; se `Fechado`, ignora
  o `origem` recebido e força `"nenhum"`, e sem cache do Toggl batendo devolve 409 em vez
  de cair na API real — nunca busca Toggl/Jira de verdade para sprint fechado.
- `Fechado` só muda via Fechar/Reabrir (`EditarSprintRequest` nem tem o campo).

**Cálculo de capacidade** (`ServicoSprint.Montar`):
```
diasUteis  = dias úteis (seg–sex) em [DataInicio, DataFim] inclusive
tempoTotal = HorasPorDia * diasUteis
margem     = floor(30% * tempoTotal)
td         = floor(tempoTotal - margem)      # tempo por colaborador
ct         = td * nº de colaboradores selecionados   # capacidade total
```
Não é "70% do total" nem "70% de 70%" — só a fórmula acima é válida.

**Totalizadores do cabeçalho "Pendentes"/"Concluído"** (`CabecalhoSprint`): duas listas
globais de status do Jira (`Final` = `Concluido`/`Ignorado` em `JiraStatus.ini`),
**mutuamente exclusivas** (a UI esconde de uma o que está na outra; o backend rejeita
com 400 se `PUT /api/sprint/status-final` trouxer status nas duas). **Concluídas** =
descrições distintas (nunca linha de tag) com `Situacao` em `StatusConcluido`;
**Pendentes** = descrições distintas com `Situacao` fora de `StatusConcluido` e de
`StatusIgnorado` (ignorado não conta em nenhum). Sem nenhuma das listas preenchida,
toda descrição conta como Pendente.

**"Quantidade pendentes/concluídas" por colaborador** (`LinhaColaboradorSprint`): cálculo
**independente** do cabeçalho — não usa `StatusConcluido`/`StatusIgnorado`; reaproveita a
classificação Pendente/Concluído **por grupo** (DEV/REV/QA) da coluna "Situação" da grid
(`GrupoResponsavelStatus`/`SituacaoSemGrupoResponsavel`, ver "Responsabilidade por
status"). Cada grupo que o colaborador ocupa numa linha conta à parte (DEV pendente e REV
concluído na mesma linha dão resultados diferentes). Linhas de tag nunca contam.

**Grid de tarefas**: uma linha por `(Chave, Agrupada)`, vindos de `ChaveAgrupamento`
(mesma regra descricao/tag/ambos do Gant, usando `registro.Tags[0]`). Linha de descrição:
`Codigo`/`Descricao` separados via regex `^(TEL - \d+)(?: - (.+))?$`. Linha de tag: todo
o tempo do colaborador vai para **um** grupo — QA se ele tem ≥1 apontamento com tag ∈
`categorias.Qa`, senão DEV (REV nunca recebe tag-agg).
- **Mesclagem de colaboradores só em linhas de descrição** (`Agrupada == false`):
  empacotamento guloso — cada colaborador entra na primeira linha aberta cujos slots
  Dev/Rev/Qa que ele ocupa estejam todos livres; senão abre linha nova. Dois colaboradores
  em categorias diferentes da mesma descrição mesclam numa linha; na **mesma** categoria
  ficam em linhas separadas.
- **Linhas de tag nunca mesclam** — cada colaborador abre sua própria linha.
- Ordenação por **número do código** (`NumeroCodigo`), não por string —
  `TEL - 994 → TEL - 1000 → TEL - 1118`.
- **Duplicidade visual** (`calcularColisaoPosicao`, cliente): mesclagem que abre >1 linha
  de descrição para a mesma `(codigo, descricao)` por disputa da mesma posição → Código+
  Descrição em vermelho; **só linhas de descrição**. A cor vai **direto no link** (`sx` do
  próprio `<a>`), nunca por herança de `TableCell` — elemento com `color` próprio não
  herda do pai, nem com `!important`.
- **Tachado (checkbox) persistido em `localStorage`**, isolado por sprint (chave
  `sprint-tachados-<chaveSprint>`), um dos 2 usos de `localStorage` (§4). Reset só em
  **nova consulta real à API** (`veioDoCache === false`), nunca ao carregar do cache.
- **Descrição da grid trunca de forma responsiva** (`ResizeObserver` mede o que sobra
  para a coluna e CSS corta com "…", sem limite fixo de caracteres); tooltip e
  `SprintDialogDetalheLinha` (duplo clique na linha) sempre com o texto completo.
- **Prioridade/Situação/PRE vêm do Jira** — sem integração ou issue não encontrada,
  Prioridade e Situação caem em "Nenhuma" (cinza) e PRE em "–"; nunca editáveis nem
  persistidos pelo app.

**Integração Jira (opcional, por sprint)**: `POST /api/sprint/consultas` extrai os códigos
TEL de **todos** os registros crus do Toggl recém-buscados (independe do `Agrupamento`;
usa `NormalizarDescricaoTel` + o regex de `Codigo`), busca em lote (`key in (...)`) via
`ClienteApiJira.BuscarIssuesAsync` e grava em `JiraSprintData_<chave>.ini`. Só roda com o
Jira configurado; falha de rede/autenticação do Jira nunca quebra a consulta do Toggl.
`ServicoSprint.Montar` aplica o resultado só a linhas de descrição: `Prioridade`/`Situacao`
da linha e `PreHoras` de **cada** bloco DEV/REV/QA a partir de um campo customizado do
Jira próprio por grupo (`CampoEstimativaDesenvolvimentoId`/`Revisao`/`Testes`) — sem o
campo do grupo configurado, `PreHoras` = 0. A "Estimativa original"
(`timeoriginalestimate`) foi **removida por completo** — não recriar sem pedido explícito.
`IssueJira.UrlIssue` (`<dominio>/browse/<chave>`) vira link no Código da grid.
- **`GET /rest/api/3/search` foi descontinuado pelo Jira** (410 Gone) — usar sempre
  `POST /rest/api/3/search/jql`, que **pagina em blocos de até 100 issues**
  (`nextPageToken`/`isLast`, confirmados só ao vivo). Bug real já mordeu o usuário:
  `maxResults = chaves.Count` numa chamada só perdia issues em silêncio em sprints com
  >100 códigos TEL (129 códigos, só 100 voltavam). `BuscarIssuesAsync` faz loop até
  `isLast == true` ou `nextPageToken` vazio, `maxResults` fixo em 100 — nunca mais
  `chaves.Count`.
- **`Responsavel`/`RevisadoPor`**: `Responsavel` vem do campo nativo `assignee` (não
  configurável); `RevisadoPor` de um campo customizado configurável
  (`CampoRevisadoPorId`/`Nome`, específico de cada instância Jira). Ambos: só o
  `displayName` do formato "user picker" (`{accountId, displayName, ...}`).
- **Fallback DEV/REV via mapeamento Jira↔Toggl** — regra crítica, já reimplementada mais
  de uma vez; **DEV vem de `Responsavel`, REV vem de `RevisadoPor`, nunca o contrário**.
  `[Usuario:<displayName Jira>]` de `JiraTogglMapeamento.ini` guarda
  `ChaveToggl`/`Sigla`/`Cor` (suporta usuários **exclusivos do Jira**, sem conta Toggl,
  com Sigla/Cor próprias). `AplicarFallbackJira` preenche o bloco DEV a partir de
  `Responsavel` e o REV a partir de `RevisadoPor`, só quando **(a)** nenhuma linha
  daquela descrição já tem colaborador nesse bloco (nunca sobrescreve tempo real) e
  **(b)** se a entrada tem `ChaveToggl`, esse usuário está entre os
  `usuariosSelecionados` **desta** consulta (não busca fora deles); entrada exclusiva do
  Jira usa `Sigla`/`Cor` direto, sem exigir seleção. Só afeta a 1ª linha de descrição do
  grupo, nunca linhas de tag. É sugestão visual (0 segundos): não conta como
  `ReaSegundos`, capacidade nem `TarefasPendentes`/`Concluidas`.
- **`BlocoCategoriaSprint.NomeExibicao` (não `ReaSegundos`) decide "tem colaborador" no
  frontend** (`SprintLinhaTarefa.tsx`, `temColaborador`): antes do fallback os dois
  coincidiam por acidente; virou bug real quando o fallback passou a setar
  `NomeExibicao` com `ReaSegundos = 0`. Em **PRE**/**REA**, valor `0` vindo do Jira/Toggl
  mostra `"–"`; qualquer valor real, mesmo que arredonde para `00h`, mostra a hora — a
  distinção é "tem valor real" vs. "não tem", nunca o texto exibido. PRE e REA usam a
  mesma cor de destaque; REA fica vermelho (`corPendente`) quando ultrapassa o PRE do
  bloco (só com PRE real; REV/QA nunca têm PRE).

**Consulta do Sprint — o que forçar** (`origem: "nenhum"|"toggl"|"jira"|"ambos"`, default
`"nenhum"`): controla o que é **forçado** a atualizar, não "de onde vêm os dados".
`forcarToggl = origem in ("toggl","ambos")`, `forcarJira = origem in ("jira","ambos")`.
Toggl: com `forcarToggl` sempre busca de novo; sem, cache-first normal (busca só se não
houver cache válido — pode acontecer com `origem = "nenhum"`, não é "forçar"). Jira:
atualiza sempre que `forcarJira`, **ou** sempre que o Toggl tiver feito consulta real
(mesmo sem forçar) — nunca atualiza o Jira só por reaproveitar cache do Toggl. Não há
bloqueio/409 para "só Jira sem cache prévio do Toggl": o Toggl busca por falta de cache.
Só o Sprint tem o seletor; Relatório/Gant têm o checkbox simples de forçar.

**Listagem do Sprint — filtros** (`SprintView.tsx`): "Status" = texto bruto do status do
Jira; "Situação" (DEV/REV/QA) = Pendente/Concluído por bloco — outro conceito. Filtros de
seleção: Prioridade, Status, Colaborador e Situação (`situacaoGrupo` em `calculos.ts`,
mesma classificação da coluna "Situação"; linhas de tag entram com valor "Tag").
**Situação combinada com Colaborador**: sem colaborador, a linha atende se **qualquer**
grupo com colaborador bater; com colaborador(es), só conta o(s) grupo(s) **daquele(s)**
colaborador(es) — por isso usam um bloco combinado dedicado (não dois `if` encadeados: a
linha já teria sido excluída pelo filtro de Colaborador antes de "Inverter filtros"
agir, dando falso positivo). "Inverter filtros" faz os 4 filtros de seleção **excluírem**
em vez de restringir (a busca por texto nunca é afetada). "Limpar" (busca+filtros+inversão)
e "Limpar ordenação" (Prioridade por severidade, Status alfabético) são deliberadamente
independentes.

**Prioridade/Situação — cores e responsabilidade**: a busca de issues do Jira não expõe
cor de prioridade/status; a cor vem de **mapeamento configurável por nome exato**
(`GET/PUT /api/jira/cores` → `Cor` em `JiraStatus.ini`/`JiraPrioridades.ini`), alimentado
pela listagem **real** (`GET /api/jira/status`/`/prioridades`, cacheadas). Sem cor
configurada, **Prioridade** cai numa paleta fixa por severidade
(`Muito alta/Alta/Média/Baixa/Muito baixa`); **Status** vai direto ao cinza
(`corIndisponivel`, o mesmo de "Nenhuma") — **não** usar `statusCategory` como fallback
(o amarelo de "indeterminate" se confundia com cor configurada). Badge de tag usa
`CorTag`. Todo texto de badge usa `text.primary` (não branco fixo); `BadgeTexto` tem
**largura fixa** com ellipsis + `Tooltip`, para badges iguais na mesma coluna.

**Responsabilidade por status** (`Responsaveis` em `JiraStatus.ini`, mapeia status do Jira →
DEV/REV/QA): `ServicoSprint.Montar` calcula `GrupoResponsavelStatus`/
`SituacaoSemGrupoResponsavel` comparando `Situacao` a essas listas — três casos:
(1) bate com um grupo → esse grupo "Pendente", os demais (com colaborador) "Concluído";
(2) responsabilidade configurada (≥1 lista não vazia) e tarefa achada no Jira, mas status
fora das três listas → `SituacaoSemGrupoResponsavel = true`, todo grupo com colaborador
"Concluído" (decidido com o usuário — "sem responsável definido" ≠ "nada pendente");
(3) sem responsabilidade configurada, ou tarefa não achada no Jira, todo grupo com
colaborador "Pendente".

---

## 3. `TogglReport.Api`

Minimal APIs (não Controllers), CORS `AllowAny` (uso local), `JsonStringEnumConverter`
global, Swagger em `/swagger` (título "Toggl Report API"). Sobe em
`http://localhost:5180` (porta fixa). `dados/` própria ao lado do executável.

### Endpoints principais

| Método | Rota | Descrição |
|---|---|---|
| `GET/PUT` | `/api/configuracao` | agrupamento, tags, período do relatório; `dataInicio`/`dataFim` opcionais no PUT (omitidos preservam o período salvo); datas em `RelatorioParametros.ini`, agrupamento/tags na fonte única |
| `GET/POST/PUT/DELETE` | `/api/usuarios-toggl` | CRUD de usuários do Toggl (inclui `administrador`); `POST .../validar-token` |
| `GET` | `/api/usuarios-toggl/tags?forcarAtualizacao=` | tags reais do workspace via token do `Administrador`, cacheadas (`TogglTagsCache.ini`) |
| `POST` | `/api/consultas` | cache-first via `ServicoConsulta`, grava `RelatorioData.ini` |
| `GET` | `/api/relatorio?dataInicio=&dataFim=` | 409 se não há cache exato p/ o período |
| `GET` | `/api/busca?termo=` | busca por descrição sobre o cache do relatório |
| `GET` | `/api/dados/download` | zip de toda a raiz de `dados/` |
| `POST` | `/api/dados/restaurar` | restaura `dados/` a partir de um `.zip` (arquivos na raiz do zip; sobrescreve os de mesmo nome) |
| `GET/PUT` | `/api/gant/parametros` | período próprio do Gant (`GantParametros.ini`) + agrupamento/tags da fonte única; `dataInicio`/`dataFim` opcionais no PUT |
| `POST` | `/api/gant/consultas` | idem `/api/consultas`, grava `GantData.ini` |
| `GET` | `/api/gant?dataInicio=&dataFim=&termo=` | 409 sem cache; `termo` filtra antes de agrupar |
| `GET/POST/PUT/DELETE` | `/api/sprints` | CRUD de sprints; `PUT` 409 se fechado; `DELETE` apaga os 2 caches do sprint |
| `POST` | `/api/sprints/{chave}/fechar` \| `/reabrir` | trava/destrava edição e consulta |
| `GET/PUT` | `/api/sprint/categorias` | mapeamento DEV/REV/QA + agrupamento + tags detalhadas + `CorTag` (`TogglTags.ini`/`TogglConfiguracao.ini`) |
| `GET/PUT` | `/api/sprint/responsabilidade` | status do Jira → DEV/REV/QA (`JiraStatus.ini`) |
| `GET/PUT` | `/api/sprint/status-final` | status Concluído/Ignorado nos totalizadores (`JiraStatus.ini`); `PUT` 400 se um status estiver nas duas listas |
| `POST` | `/api/sprint/consultas` | cache-first via `ServicoConsulta`; `chaveSprint` (obrigatório; 404 inexistente, 400 inválida) isola os caches; `origem` (`nenhum`\|`toggl`\|`jira`\|`ambos`) escolhe o que forçar; sprint fechado ignora `origem` e devolve 409 sem cache |
| `GET` | `/api/sprint?chaveSprint=` | 409 sem cache p/ o período do sprint |
| `GET/PUT` | `/api/jira/configuracao` | conexão + campos customizados (`JiraConexao.ini`/`JiraCampos.ini`); token sempre mascarado na resposta |
| `POST` | `/api/jira/testar-conexao` | credenciais explícitas, sem salvar (`GET /rest/api/3/myself`) |
| `POST` | `/api/jira/campos` | credenciais explícitas ou salvas (`GET /rest/api/3/field`, só `custom: true`) |
| `POST` | `/api/jira/issues` | busca em lote (`key in (...)`) prioridade/situação/estimativas, config salva |
| `GET` | `/api/jira/status?forcarAtualizacao=` | nomes reais de status (`GET /rest/api/3/status`), cacheados (`JiraStatusCache.ini`) |
| `GET` | `/api/jira/prioridades?forcarAtualizacao=` | idem, `GET /rest/api/3/priority` (`JiraPrioridadesCache.ini`) |
| `GET/PUT` | `/api/jira/cores` | mapeamento nome→cor de status e prioridade, usado pelas badges do Sprint |
| `GET` | `/api/jira/usuarios?forcarAtualizacao=` | nomes reais de usuários (`GET /rest/api/3/users/search`, paginado, `accountType == atlassian && active`), cacheados (`JiraUsuariosCache.ini`) |
| `GET/PUT` | `/api/jira/usuarios-mapeamento` | `displayName` do Jira → `ChaveToggl`/`Sigla`/`Cor`, alimenta o fallback DEV/REV do Sprint |

**Erros**: 400 (parâmetros/datas inválidas, agrupamento fora de
`descricao`/`tag`/`ambos`), 404 (recurso não encontrado), 409 (nome em uso; sem cache
correspondente), 500 (`Results.Problem`, falha de I/O). `GET /api/relatorio`/`/busca`/
`/gant`/`/sprint` **exigem cache prévio** — nunca disparam consulta implícita, para
manter explícito quando uma chamada HTTP externa ao Toggl acontece (rate limit).

**`emAndamento` do relatório está em snake_case** (`workspace_id`, `duration`, etc.) — é
o `RegistroTempoDto` cru com `[JsonPropertyName]` batendo na API do Toggl; todo o resto
do contrato é camelCase.

### Autenticação HTTP Basic (opcional)

Desligada por padrão (uso local sem fricção). Liga configurando `AUTH:USUARIO`/
`AUTH:SENHA` (`AUTH__USUARIO`/`AUTH__SENHA`) — usado no deploy público (Cloud Run).
Rotas sempre livres: `/health`, `/swagger`, `/images`. **Sem `WWW-Authenticate`** na
resposta 401 de propósito — evita o popup nativo do navegador; o frontend trata com
`LoginScreen.tsx` própria (`sessionStorage`).

---

## 4. Frontend (`toggl-report-front`)

React 19 + TypeScript + MUI 9, Vite. `VITE_API_URL` configura o endereço da API
(default `http://localhost:5180`).

```bash
cd toggl-report-front && npm install && npm run dev   # :5173
npm run build   # tsc -b && vite build
```

### Navegação e gate de configuração

Sem fluxo em etapas nem abas de topo: **menu lateral** (`MenuLateral`: `Drawer` permanente
em `md+`, que um botão no AppBar esconde/exibe — preferência em `localStorage`
(`utils/preferenciasMenu.ts`); temporário em `xs`, sem persistência) com 7 seções — Toggl,
Jira, Configurações, Relatório, Gant, Sprint, Dados. O **Resumo da aplicação** é a página
inicial e o destino do clique na logo (não é item de menu). Não confundir
`features/configuracoes/` (plural = seção Configurações) com o antigo formulário de
parâmetros do Relatório, hoje em `features/relatorio/` (espelha `features/gant/`).
- **`useResumoConfiguracao` (`features/resumo`) é a fonte ÚNICA do gate** e das
  categorias/responsabilidade/status-final consumidas pelo Sprint (o `App` não guarda
  cópias; o `SprintView` recebe os dados frescos do hook). Recarrega a cada troca de seção
  e após salvamentos (inclusive a Conexão Jira); `recarregar` **coalesce recargas
  concorrentes** (a mais recente prevalece). Relatório/Gant/Sprint ficam `disabled` no menu até a configuração
  obrigatória estar completa (`configuracoes/completude.ts`): Agrupamento, Tags detalhadas
  (exigidas exceto no agrupamento "descricao"), Tags DEV/REV/QA do Toggl e Status DEV/REV/QA
  do Jira. Cadastro de usuários e conexão do Jira **não** entram nesse cálculo; só o
  mapeamento Jira↔Toggl é de fato opcional.
- **Toggl** = CRUD de usuários (exige ≥1 `Administrador` para liberar Configurações).
  **Jira** = só a conexão (URL/e-mail/token, "Testar conexão", "Salvar").
- **Resumo** = 7 blocos (Usuários do Toggl; Toggl: Configurações [+ cor da tag]; Jira:
  Conexão; Jira: Campos personalizados; Jira: Status; Jira: Cores; Jira ↔ Toggl:
  Mapeamento) com atalho para a aba certa; entre os do Jira só Status é obrigatório.
- **Configurações** = 5 abas (Toggl; Jira: Campos personalizados; Jira: Status — DEV/REV/QA +
  Concluído/Ignorado, mutuamente exclusivos; Jira: Cores; Jira ↔ Toggl), com botão Salvar
  por aba (as abas Status/Cores gravam o mesmo `JiraStatus.ini`, de forma independente);
  **salva a aba suja antes de trocar de aba ou sair da seção** (ref `salvarAtual` no `App`; se falhar, permanece). Tem **gate próprio**:
  só abre com `Administrador` do Toggl **e** Jira configurado (URL+e-mail; token fora);
  senão mostra os pré-requisitos com atalhos.
- **Relatório/Gant**: tela de parâmetros (período + checkbox "Forçar nova consulta à API",
  estado local não persistido) e botão único **Consultar** — salva os parâmetros, pede
  confirmação se forçar, consulta e mostra a view (com "Voltar"). Busca por descrição
  inline nas duas views.
- **Sprint**: lista de sprints + "Selecionar" → abre na hora o modal `ConsultaSprintDialog`
  (só nome do sprint + seletor "Forçar nova consulta em:", ou Alert de sprint fechado) →
  se forçar Toggl, segundo diálogo de confirmação → Acompanhamento (`SprintView`, com
  "Voltar"). Totalizadores/legenda Concluído/Ignorado ficam em Configurações → Jira: Status
  e no Resumo, não no modal. Painel de filtros em 2 linhas em `sm+` (empilhado em `xs`).
- **Dados** = baixar/importar `.zip` (fetch autenticado + blob) + lista dos `.ini` possíveis
  (`features/dados/arquivosIni.ts`, **manual**: ver §6). O primeiro carregamento sem nenhum
  usuário do Toggl abre o diálogo de importação automaticamente. O rodapé só tem o crédito
  e fica no fluxo, não fixo.
- **Responsividade**: a **página nunca rola na horizontal** — só tabelas/grades em container
  próprio com `overflow-x`; gutter do `Container` `px: { xs: 1, sm: 2 }`; `CabecalhoView`
  quebra linha; dialogs largos (`SprintDialogInfo`, `SprintDialogDetalheLinha`) em
  `fullScreen` abaixo de `sm`; `Tabs variant="scrollable"`.

### Estrutura

```
src/api/        fetch tipado (http.ts) + tipos espelhando os DTOs/records C# (tipos.ts)
src/features/   auth, usuarios-toggl, jira (conexão/campos), configuracoes (abas,
                completude), resumo, consulta, relatorio (inclui o form de parâmetros),
                busca, gant, sprint, dados
src/components/ peças reusadas entre features
src/hooks/      bases genéricas (useRecurso, useRecursoEditavel, useColecaoCrud,
                useNotificacao, useExpansao)
src/utils/      duracao.ts (HHhMMmSSs), datas.ts, rotulos.ts, texto.ts, tipografia.ts, consulta.ts,
                preferenciasMenu.ts
theme.ts        tema MUI único, claro — CORES exportado (paleta central)
App.tsx         menu lateral + seção ativa + estado elevado (consultas concluídas, sprint)
```

**Componentes compartilhados a preferir antes de duplicar**: `BadgeSigla` (tooltip com
nome completo; texto em `text.primary`; replicado no `<Chip>` do Gant; cantos retos por
padrão, arredondado — `borderRadius: 1` — só em Usuários do Toggl, `AccordionSummary` do
Relatório e tabela "Colaboradores" do Sprint), `SelectListaCacheada` (seleção, não
digitação, sobre listagem real cacheada), `MapaCoresLista` (grade compacta de color
pickers por nome real), `ParametrosFormBase` (período + forçar + Consultar, base de
Relatório e Gant), `SelectAgrupamento`, `CabecalhoView`, `MarcaTogglReport`,
`AvisoCache`, `EsqueletoCarregando`, `DialogoConfirmacao`, `BotaoComCarregamento`,
`IconeAjuda` (`HelpOutlined` + `Tooltip`, usado como `endAdornment` de `TextField`).

### Decisões técnicas importantes

- **`fetch` nativo com wrapper tipado** (`src/api/http.ts`), não axios. `http.ts` precisa
  extrair a mensagem de erro de `ProblemDetails` (`detail`/`title`), não só de string
  simples — `Results.Problem` (ex.: 502 de `/api/usuarios-toggl/tags`) devolve
  `{type,title,status,detail}`; sem isso a UI mostra só "Bad Gateway".
- **Zero `any`**; sem `enum` do TS (`erasableSyntaxOnly`) — usar union de strings.
- **Download/upload de `dados/` via `fetch` autenticado + blob**, nunca `<a href>` direto
  — um link normal não carrega a credencial Basic Auth (a API não usa cookie/sessão).
- **Curadoria de exibição "TEL primeiro" é replicada aqui** (`curarPorDescricao`),
  simetria com a normalização do núcleo — o backend não ordena, só agrupa.
- **Seleção de usuário para consulta** vem do campo `Selecionado` de cada usuário (seção
  Toggl); as telas de consulta não escolhem usuários.
- **`localStorage` só em 2 lugares**: `features/sprint/tachados.ts` (tachado por sprint) e
  `utils/preferenciasMenu.ts` (menu visível); a credencial do login fica em `sessionStorage`
  (`api/credencial.ts`). Não usar para mais nada sem necessidade equivalente.
- **Cada painel da Jira reenvia a parte que não edita**: `PUT /api/jira/configuracao`
  **substitui a configuração inteira** (conexão + campos); cada painel faz GET fresco e
  reenvia o restante. `apiToken` vazio/null mantém o salvo.

### Tema

Tema único claro (`theme.ts`) — um tema escuro chegou a ser implementado e foi
**removido por completo** a pedido do usuário; não reintroduzir sem pedido explícito.
`CORES` é a paleta central — nenhuma cor hex deve ficar solta fora de `theme.ts`.
`error` é propositalmente o vermelho padrão do MUI (não sobrescrever).

---

## 5. Convenções

**C# (núcleo/API)**: tipo explícito no lugar de `var`; sem comentários no núcleo
(regra de domínio não óbvia documenta-se aqui); antes de duplicar uma checagem/loop,
ver se há helper em `Configuracao/` (`ServicoChaves`, `DiasUteis`, `Agrupamento.
EhValido`, `AnalisadorIni.Escrever`/`DividirLista`) ou `Api/Endpoints/`
(`ValidacaoDatas`, `TratamentoIo`); fluxos de erro esperados usam
`ResultadoApiToggl<T>`, nunca exceptions; `end_of_line = crlf`, UTF-8 sem BOM;
`dotnet build TogglReport.slnx` deve ficar em **0 warnings**.

**TypeScript/React**: zero `any`; sem `enum` do TS; estrutura por feature; tipos de
request/response em `src/api/tipos.ts` devem espelhar exatamente os DTOs/records C#
— ao mudar um endpoint, atualizar os dois lados; `npm run build` limpo antes de dar
por pronta uma mudança.

---

## 6. Notas rápidas (gotchas)

- **Depois de mudar `TogglReport.Nucleo`, reiniciar o `TogglReport.Api.exe` em
  execução** — o processo trava o próprio `.dll`, e um `dotnet build` que falha só com
  `MSB3026`/`MSB3027` (erro de cópia, não `error CS...`) é esse processo travando o
  arquivo, não um bug de código.
- **Rodar a API sem a `CHAVE_CRIPTOGRAFIA` correta (a do `.env`) é perigoso**: usa a
  chave embutida, não descriptografa os tokens `enc:`, o cache nunca "bate" (compara
  `TokenApi` descriptografado) e a consulta cai na **rede real** do Toggl — e, se todos
  falharem, `RelatorioData.ini` é regravado só com `[Geral]` (perde o cache). Em
  testes/validações use sempre **cópia** de `dados/`, a chave certa e proxy morto.
  Mudar a chave embutida também rotaciona a criptografia: `.ini` com `enc:` gravados
  sem a env var precisam ter os tokens reinseridos.
- **O zip de `/api/dados/download` inclui qualquer arquivo da raiz de `dados/`** (inclusive
  um `dados.zip` antigo esquecido lá) e a restauração não tem whitelist de nomes.
- **Padrões do `.gitignore` para pastas devem ser ancorados com `/` na frente**
  (`/dados/`, `/certificado/`) — sem a barra, o padrão bate em qualquer profundidade, o
  que já ignorou silenciosamente código-fonte legítimo (`src/features/dados/`).
- Todo `.ini` novo com dado sensível (token) ou de cache precisa entrar no
  `.gitignore`/`.dockerignore` (raiz + `toggl-report-back/`).
- **`features/dados/arquivosIni.ts` é lista manual** dos `.ini` (tipo, explicação, selo de
  token): ao criar/renomear/remover um `.ini` em `CaminhosDados`, atualize-a junto.
- **Medir overflow horizontal/mobile** com um iframe de 360–400px (o `resize_window` do
  Chrome MCP é instável).
- **Nomenclatura "Gant" (um "t" só)** é a correta neste projeto, mesmo que pedidos digam
  "Gantt".
- **Tags reais do Toggl** usam o token do `Administrador` em `GET /me`; o campo de
  workspace é `default_workspace_id` (snake_case). Contas com vários workspaces podem
  devolvê-lo `null` com token válido (200) — `ClienteApiToggl.ObterTagsAsync` cai para
  `GET /workspaces` e usa o primeiro, só falhando se a lista vier vazia.

---

## 7. Projeto irmão

`C:\Projetos\gerador-chave-nfe` segue as mesmas convenções de estilo (pt-BR, sem
`var`, zero dependências, .NET 10), mas é só um console — sem Web API/frontend, não
espelha §3–§4. O `CLAUDE.md` de cada repositório é a fonte da verdade daquele projeto.