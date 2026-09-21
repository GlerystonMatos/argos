# CLAUDE.md

Memória de contexto do repositório **toggl-report**. Histórico fica no `git log`; aqui só
o que **não** é derivável do código: arquitetura, regras de domínio não óbvias e decisões
que não devem ser revertidas sem motivo.

O repositório reúne **dois projetos independentes**:

- **`toggl-report-back/`** — solução **C# / .NET 10** (`TogglReport.slnx`) com dois
  projetos: **`TogglReport.Nucleo`** (biblioteca de classes, toda a lógica de negócio e
  acesso a INI, zero `PackageReference`) e **`TogglReport.Api`** (Web API Minimal APIs,
  `Microsoft.NET.Sdk.Web`, referencia o núcleo, autenticação HTTP Basic opcional). Um
  projeto console (`TogglReport.Console`) foi **removido por completo** — não recriar
  sem pedido explícito.
- **`toggl-report-front/`** — React 19 + TypeScript + MUI (Vite) que consome a Web API.

Aplicação: relatórios de tempo trabalhado da **API v9 do Toggl Track**, em três
visualizações independentes — **Relatório**, **Gant** e **Sprint** — cada uma com parâmetros
e cache de consulta próprios, compartilhando só a lista de usuários, a configuração de
agrupamento/tags e o serviço de consulta (cache-first + rate limit). O Sprint tem ainda o
módulo **Planejamento** (só Jira, sem Toggl).

**Tudo em pt-BR**: interface, mensagens, identificadores, pastas, namespaces
(`RelatorioToggl`/`.Api`/`.Sprints`/`.Planejamento`). Em inglês só o
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
  chamadas sem usuário específico, como listar tags reais). **Só um `Administrador` por
  vez**: `ServicoUsuariosToggl.DesmarcarOutrosAdministradores` desmarca o anterior no
  POST/PUT de `/api/usuarios-toggl`.
- **Cache de consulta**: cada visualização tem seu cache `.ini` com o retorno **cru** da
  última consulta por usuário. Período+usuários iguais → reaproveita o cache em vez de
  chamar a API; agrupamento/cálculo sempre roda em runtime (o cache nunca guarda resultado
  processado). Também é reserva quando o rate limit (§2) é atingido. `ServicoConsulta`
  (núcleo) centraliza a decisão para as 3 visualizações — cada consumidor só decide
  **quando** chamar (`forcarConsultaApi`).
- **Sem exportação para CSV**; **poucas dependências** (núcleo sem `PackageReference`; API
  só com Swashbuckle).

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
Relatorios/      ServicoAgrupamento (por descrição/tag), LinhaDescricao, ServicoBuscaDescricao,
                 ServicoCodigoTel (Código/Descrição TEL; público, usado por Sprint e Planejamento),
                 ComparadorNomes (ordenação alfabética de nomes sem cultura nomeada — §6)
Consultas/       ServicoConsulta (cache-first + rate limit), ResultadoConsulta,
                 EventoConsultaUsuarioToggl / StatusConsultaUsuarioToggl
Jira/            ClienteApiJira (HTTP Basic email:apiToken, normaliza a URL do domínio),
                 CampoJira, ResultadoApiJira (Ok/Falha, mesmo padrão do Toggl); Agile:
                 QuadroJira/ColunaQuadroJira/SprintQuadroJira/CartaoQuadroJira,
                 CachePlanejamentoJira, CacheQuadrosJira
Planejamento/    (namespace RelatorioToggl.Planejamento) ServicoPlanejamento.Montar,
                 ResultadoPlanejamento / CartaoPlanejamento / ColaboradorPlanejamento / PessoaPlanejamento
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
| `JiraConexao.ini` | `[Conexao]` URL/e-mail/token (`enc:`) + `QuadroId`/`QuadroNome` (quadro de DEV) |
| `JiraCampos.ini` | `[Campo:EstimativaDesenvolvimento\|EstimativaRevisao\|EstimativaTestes\|RevisadoPor\|AnalisadoPor]` `Id`/`Nome` |
| `JiraStatus.ini` | `[Status:<nome>]` `Cor`/`Responsaveis`/`Final` (Concluido\|Ignorado) |
| `JiraPrioridades.ini` | `[Prioridade:<nome>]` `Cor` |
| `JiraTogglMapeamento.ini` | `[Usuario:<displayName Jira>]` `ChaveToggl`/`Sigla`/`Cor` |
| `Sprints.ini` | `[Sprint:<chave>]` Nome/HorasPorDia/DataInicio/DataFim/`Fechado` (default `False`) |
| `RelatorioParametros.ini`, `GantParametros.ini` | `[Geral]` só `DataInicio`/`DataFim` |
| `RelatorioData.ini`, `GantData.ini` | cache **global** por período (se sobrescreve ao trocar de período) |
| `SprintData_<chave>.ini`, `JiraSprintData_<chave>.ini`, `JiraPlanejamentoData_<chave>.ini` | cache **um arquivo por sprint** (Toggl / Jira / Planejamento) |
| `TogglTagsCache.ini`, `JiraStatusCache.ini`, `JiraPrioridadesCache.ini`, `JiraUsuariosCache.ini`, `JiraQuadrosCache.ini` | listagens reais cacheadas |

- **Cache por sprint**: `DELETE` do sprint apaga os três arquivos; o caminho só é montado a
  partir de sprint **existente** em `Sprints.ini` + validação de caracteres da chave
  (anti path-traversal) — `POST /api/sprint/consultas` com chave inexistente = 404,
  inválida = 400. Isolar por sprint é deliberado: consultar um não perde o cache de outro.
- **`JiraStatus.ini`** é gravado por **3 endpoints** (`/api/sprint/responsabilidade`,
  `/api/sprint/status-final`, `/api/jira/cores`) vindos de duas abas independentes do front
  (Status dispara 2 PUTs em paralelo), então `ArquivoStatusJiraIni` faz read-modify-write
  (merge por seção) sob **lock estático**. Os demais arquivos ainda não têm lock.

### Regras de domínio importantes

- **`RegistroTempoDto.Duracao`** negativo = timer em execução (isolado por
  `ServicoAgrupamento.ObterEmAndamento`, fora dos totais). Rótulos: `(sem descrição)`, `(sem tag)`.
- **Descrições "TEL" são normalizadas já na chave de agrupamento** (não só na exibição):
  "TEL-0000-AA" / "TEL-0000 - AA" viram "TEL - 0000 - AA" antes de somar tempos
  (`ServicoAgrupamento.NormalizarDescricaoTel`); só com dígitos logo após "TEL" (não mexe em
  "TELA"/"TELEFONE").
- **Agrupamento** (relatório/Gant/Sprint): `descricao` | `tag` | `ambos`. Com
  `TagsDetalhadas` e agrupamento "ambos": essas tags aparecem detalhadas por descrição e
  fora do agrupamento por tag; as demais só agregadas por tag. "descricao" puro traz tudo
  (não filtra por `TagsDetalhadas`).
- **`TokenApi` (Toggl e Jira) é criptografado em repouso** (AES, chave de
  `CHAVE_CRIPTOGRAFIA`, fallback embutido se a env var não estiver configurada —
  proteção básica, não resiste a quem lê o código-fonte). Prefixo `enc:`; texto sem esse
  prefixo é tratado como legado e migra sozinho no próximo save. Token do Jira nunca
  volta em texto puro depois de salvo (`ServicoUsuariosToggl.MascararToken`).
- **Cache indexado por `Chave` de usuário** (não por `NomeExibicao`). Bater os parâmetros
  exige mesmo período **e** todo usuário atual achar seu par no cache por `Chave` +
  `TokenApi` (descriptografado).
- **Rate limit (30 req/hora/usuário) é só em memória por processo** — reinicia a cada execução; não é o retry de 429 do `ClienteApiToggl` (esse trata o limite da própria API do Toggl: `Retry-After`, 1 retry).
- **Erros da API do Toggl não usam exceptions** — `ResultadoApiToggl<T>` (Ok/Falha); 401
  reporta e pula o usuário sem abortar a consulta.

### Sprint — regras de negócio (decididas com o usuário)

Terceira visualização, com **gestão** (CRUD de sprints) além do acompanhamento. O mapeamento
**global** TAG→categoria Dev/Rev/Qa + `CorTag` vive em `TogglTags.ini`/`TogglConfiguracao.ini`
(sem TAG default; sem `CorTag` o frontend usa `CORES.corIndisponivel` só na exibição).

**Fechar/reabrir sprint** (`DadosSprint.Fechado`): "Fechar" no Acompanhamento
(`SprintView`), "Reabrir" na listagem (`SprintsPanel`), ambos com confirmação. Fechar **não
copia** dado — o cache por sprint vira "definitivo" por nunca mais ser sobrescrito. Sempre
reforçado no **backend** (o estado `origem` do hook `useConsultaSprint` não reseta ao trocar
de sprint):
- `PUT /api/sprints/{chave}` → 409 se `Fechado`.
- `POST /api/sprint/consultas`: se `Fechado`, ignora `origem`, força `"nenhum"` e sem cache
  do Toggl batendo devolve 409 — nunca busca Toggl/Jira de verdade.
- `Fechado` só muda via Fechar/Reabrir (`EditarSprintRequest` nem tem o campo).

**Cálculo de capacidade** (`ServicoSprint.Montar`):
```
diasUteis  = dias úteis (seg–sex) em [DataInicio, DataFim] inclusive
tempoTotal = HorasPorDia * diasUteis
margem     = floor(30% * tempoTotal)
td         = floor(tempoTotal - margem)      # tempo por colaborador
ct         = td * nº de colaboradores selecionados   # capacidade total
```
Só a fórmula acima é válida (não é "70% do total" nem "70% de 70%").

**Totalizadores do cabeçalho "Pendentes"/"Concluído"** (`CabecalhoSprint`): duas listas
globais de status do Jira (`Final` = `Concluido`/`Ignorado` em `JiraStatus.ini`),
**mutuamente exclusivas** (a UI esconde de uma o que está na outra; `PUT
/api/sprint/status-final` devolve 400 se houver status nas duas). **Concluídas** = descrições
distintas (nunca linha de tag) com `Situacao` em `StatusConcluido`; **Pendentes** =
descrições distintas fora de `StatusConcluido` e de `StatusIgnorado` (ignorado não conta em
nenhum). Sem nenhuma das listas o backend conta toda descrição como Pendente (o frontend
exige as duas — §4).

**"Quantidade pendentes/concluídas" por colaborador** (`LinhaColaboradorSprint`): cálculo
**independente** do cabeçalho — não usa `StatusConcluido`/`StatusIgnorado`; reaproveita a
classificação Pendente/Concluído **por grupo** (DEV/REV/QA) da coluna "Situação" (ver
"Responsabilidade por status"). Cada grupo que o colaborador ocupa numa linha conta à parte.
Linhas de tag nunca contam.

**Grid de tarefas**: uma linha por `(Chave, Agrupada)`, vindos de `ChaveAgrupamento`
(mesma regra descricao/tag/ambos do Gant, usando `registro.Tags[0]`). Linha de descrição:
`Codigo`/`Descricao` separados por regex sobre "TEL - <n>". Linha de tag: todo o tempo do colaborador vai para **um** grupo — QA se ele tem ≥1 apontamento com tag ∈
`categorias.Qa`, senão DEV (REV nunca recebe tag-agg).
- **Mesclagem de colaboradores só em linhas de descrição** (`Agrupada == false`):
  empacotamento guloso — cada colaborador entra na primeira linha aberta cujos slots
  Dev/Rev/Qa que ele ocupa estejam todos livres; senão abre linha nova (categorias
  diferentes da mesma descrição mesclam; na **mesma** categoria ficam em linhas separadas).
- **Linhas de tag nunca mesclam** — cada colaborador abre sua própria linha.
- Ordenação por **número do código** (`NumeroCodigo`), não por string —
  `TEL - 994 → TEL - 1000 → TEL - 1118`.
- **Duplicidade visual** (`calcularColisaoPosicao`, cliente): mesclagem que abre >1 linha
  de descrição para a mesma `(codigo, descricao)` por disputa da mesma posição → Código+
  Descrição em vermelho (só linhas de descrição), aplicado **direto no link** (`sx` do
  `<a>`: não herda de `TableCell`).
- **Tachado (checkbox)** em `localStorage` (`sprint-tachados-<chaveSprint>`); reset só em
  **nova consulta real à API** (`veioDoCache === false`), nunca ao carregar do cache.
- **Descrição da grid trunca de forma responsiva** (`useLarguraColunaRestante`, Sprint e
  Planejamento; Gant: hook próprio, §4); tooltip e `SprintDialogDetalheLinha` (duplo clique)
  com o texto completo.
- **Prioridade/Situação/PRE vêm do Jira** — sem integração ou issue não encontrada,
  Prioridade e Situação = "Nenhuma" (cinza) e PRE = "–"; nunca editáveis nem persistidos.

**Integração Jira (opcional, por sprint)**: `POST /api/sprint/consultas` extrai os códigos
TEL de **todos** os registros crus do Toggl recém-buscados (independe do `Agrupamento`),
busca em lote (`key in (...)`) via `ClienteApiJira.BuscarIssuesAsync` e grava em
`JiraSprintData_<chave>.ini`. Só roda com o Jira configurado; falha do Jira nunca quebra a
consulta do Toggl. `ServicoSprint.Montar` aplica o resultado só a linhas de descrição:
`Prioridade`/`Situacao` e `PreHoras` de **cada** bloco DEV/REV/QA a partir de um campo
customizado próprio por grupo (`CampoEstimativaDesenvolvimentoId`/`Revisao`/`Testes`; sem o
campo, `PreHoras` = 0). "Estimativa original" (`timeoriginalestimate`) foi **removida por
completo** — não recriar. `IssueJira.UrlIssue` vira link no Código da grid.
- **`GET /rest/api/3/search` foi descontinuado pelo Jira** (410 Gone) — usar sempre
  `POST /rest/api/3/search/jql`, que **pagina em até 100 issues** (`nextPageToken`/`isLast`,
  confirmados só ao vivo). `maxResults = chaves.Count` numa chamada só já perdeu issues em
  silêncio (129 códigos, 100 voltavam): `BuscarIssuesAsync` faz loop até `isLast == true` ou
  `nextPageToken` vazio, `maxResults` fixo em 100.
- **`Responsavel`/`RevisadoPor`**: `Responsavel` vem do campo nativo `assignee`;
  `RevisadoPor` de um campo customizado configurável (`CampoRevisadoPorId`/`Nome`, próprio
  de cada instância Jira). Ambos: só o `displayName` do "user picker".
- **Fallback DEV/REV via mapeamento Jira↔Toggl** — regra crítica, já reimplementada mais
  de uma vez; **DEV vem de `Responsavel`, REV vem de `RevisadoPor`, nunca o contrário**.
  `[Usuario:<displayName Jira>]` de `JiraTogglMapeamento.ini` guarda `ChaveToggl`/`Sigla`/
  `Cor` (suporta usuários **exclusivos do Jira**, sem conta Toggl). `AplicarFallbackJira`
  preenche DEV a partir de `Responsavel` e REV a partir de `RevisadoPor`, só quando **(a)**
  nenhuma linha daquela descrição já tem colaborador nesse bloco (nunca sobrescreve tempo
  real) e **(b)** se a entrada tem `ChaveToggl`, esse usuário está entre os
  `usuariosSelecionados` **desta** consulta; exclusivo do Jira usa `Sigla`/`Cor` direto, sem
  exigir seleção. Só afeta a 1ª linha de descrição do grupo, nunca linhas de tag. É
  sugestão visual (0 segundos): não conta como `ReaSegundos`, capacidade nem
  `TarefasPendentes`/`Concluidas`.
- **`BlocoCategoriaSprint.NomeExibicao` (não `ReaSegundos`) decide "tem colaborador" no
  frontend** (`SprintLinhaTarefa.tsx`, `temColaborador`): o fallback seta `NomeExibicao`
  com `ReaSegundos = 0` (já foi bug real). Em **PRE**/**REA**, `0` mostra `"–"`; qualquer
  valor real, mesmo que arredonde para `00h`, mostra a hora. REA fica vermelho
  (`corPendente`) quando ultrapassa o PRE do bloco (só com PRE real; REV/QA nunca têm PRE).

**Consulta do Sprint — o que forçar** (`origem: "nenhum"|"toggl"|"jira"|"ambos"`, default
`"nenhum"`): controla o que é **forçado** a atualizar, não "de onde vêm os dados".
`forcarToggl = origem in ("toggl","ambos")`, `forcarJira = origem in ("jira","ambos")`.
Toggl: com `forcarToggl` sempre busca de novo; sem, cache-first normal (busca só sem cache
válido — pode ocorrer com `origem = "nenhum"`). Jira: atualiza sempre que `forcarJira`,
**ou** sempre que o Toggl tiver feito consulta real — nunca só por reaproveitar cache do
Toggl. Sem bloqueio/409 para "só Jira sem cache do Toggl": o Toggl busca por falta de
cache. Só o Sprint tem o seletor; Relatório/Gant têm o checkbox simples de forçar.

**Listagem do Sprint — filtros** (`SprintView.tsx`): "Status" = texto bruto do status do
Jira; "Situação" (DEV/REV/QA) = Pendente/Concluído por bloco — outro conceito. Filtros de
seleção (`FiltroMultiSelecao`, §4): Prioridade, Status, Colaborador e Situação
(`situacaoGrupo` em `calculos.ts`, mesma classificação da coluna "Situação"; tag = "Tag").
**Situação + Colaborador**: sem colaborador, a linha atende se **qualquer** grupo com
colaborador bater; com colaborador(es), só o(s) grupo(s) **deles** — bloco combinado
dedicado (dois `if` encadeados dariam falso positivo com "Inverter filtros"). "Inverter
filtros" faz os 4 filtros **excluírem** (a busca por texto nunca é afetada). "Limpar" e
"Limpar ordenação" (Prioridade por severidade, Status alfabético) são independentes.

**Prioridade/Situação — cores**: a busca de issues do Jira não expõe cor; vem de
**mapeamento por nome exato** (`GET/PUT /api/jira/cores` → `Cor` em `JiraStatus.ini`/
`JiraPrioridades.ini`), alimentado pela listagem **real** (`/api/jira/status`/`/prioridades`,
cacheadas). Sem cor: **Prioridade** usa paleta fixa por severidade (`Muito alta`…`Muito
baixa`); **Status** vai ao cinza `corIndisponivel` — **não** usar `statusCategory` como
fallback (o amarelo de "indeterminate" se confundia com cor configurada). Badge de tag usa
`CorTag`; texto de badge em `text.primary`; `BadgeTexto` tem **largura fixa** com ellipsis +
`Tooltip`.

**Responsabilidade por status** (`Responsaveis` em `JiraStatus.ini`, status do Jira →
DEV/REV/QA): `ServicoSprint.Montar` calcula `GrupoResponsavelStatus`/
`SituacaoSemGrupoResponsavel` comparando `Situacao` às listas — (1) bate com um grupo →
esse grupo "Pendente", os demais (com colaborador) "Concluído"; (2) responsabilidade
configurada (≥1 lista não vazia) e tarefa achada no Jira, mas status fora das três →
`SituacaoSemGrupoResponsavel = true`, todo grupo com colaborador "Concluído" (decidido com
o usuário: "sem responsável definido" ≠ "nada pendente"); (3) sem responsabilidade
configurada, ou tarefa não achada, todo grupo com colaborador "Pendente".

### Planejamento (só Jira, sem Toggl)

Botão "Planejar" do Sprint: cartões por **coluna do quadro Scrum de DEV** do Jira, com
contagem por colaborador.
- **Escopo = cartões do SPRINT ATIVO do quadro** (`GET /rest/agile/1.0/board/{id}/sprint?state=active`
  → `jql=sprint in (ids)`); nunca o quadro inteiro. O Jira **não tem sprint
  equivalente ao do app** (o time agrupa por épicos com período no título): **sem
  correlação** — mostra o sprint ativo do quadro e seu nome; o cache por sprint do app só
  preserva o "retrato". `maxResults=200` até `startAt >= total`; 429 com 1 retry
  (`Retry-After`), só nos métodos novos do `ClienteApiJira`.
- **Grupo = `fields.parent`** (sempre Épico; o campo Agile `epic` vem vazio — não usar);
  sem pai → vazio. **Coluna** = `status.id` ∈ `columnConfig.columns[].statuses[].id`
  (`GET /board/{id}/configuration`); fora de todas → "(sem coluna)" no fim. Quadros: só
  Scrum (`GET /board?type=scrum`, paginado por `isLast`).
- **Contagem**: 1 por cartão se a pessoa é Responsável OU Revisado por; "Analisado por"
  não conta nem cria colaborador. Pessoa = mapeamento Jira↔Toggl contra **todos** os
  usuários do Toggl cadastrados (não só os selecionados — sem consulta de Toggl);
  exclusivo do Jira usa Sigla/Cor da entrada; sem mapeamento (ou `ChaveToggl` órfão) →
  sigla = iniciais (até 3), cor nula, `mapeado=false`. Chave de filtro = `displayName`.
- **Código/Descrição** (`ServicoCodigoTel`, extraído de `ServicoSprint`; Sprint inalterado):
  `Codigo` = chave normalizada ("TEL - 1431"); `Descricao` = resumo sem o prefixo quando o
  número bate com o da chave, senão cru; chave não-TEL → chave + resumo.
- **Cache `JiraPlanejamentoData_<chave>.ini`** (dado **cru**: `QuadroId`, `QuadroNome`,
  `SprintJira`, `Colunas`, `Cartoes`, `AtualizadoEm`; coluna/contagens/siglas em runtime).
  Reutiliza, exceto: (a) "Atualizar" da tela (ao vivo); (b) "Forçar nova consulta em:
  Jira/Ambos" — **2º `POST` em segundo plano**, sem bloquear o Acompanhamento (falha = aviso;
  sem quadro = pula; "Toggl" sozinho NÃO força; `atualizacoesPlanejamento.ts` guarda as
  promessas por sprint para "Planejar" não mostrar dado antigo); (c) sem cache válido
  (ausente, `QuadroId` diferente do configurado ou `SprintJira` nulo). **Sprint fechado nunca
  chama o Jira** (ignora `forcar`; cache ou 409). Falha do Jira → 502 e o cache anterior
  fica. `GET` sem cache = 409; ao abrir sem cache o hook faz `POST` cache-first.
- **Configuração**: `QuadroId`/`QuadroNome` em `JiraConexao.ini`, editados em Jira (Conexão)
  (`SelectQuadroJira`; fallback de digitar o ID; na 1ª configuração só lista com a conexão
  já salva); obrigatório no formulário da Conexão, **não** no gate global. **"Analisado
  por"** (`[Campo:AnalisadoPor]`, user picker) é o **5º campo obrigatório** de Campos (gate
  + Resumo "N de 5"), só do Planejamento: instalações já configuradas ficam bloqueadas até
  preenchê-lo.

---

## 3. `TogglReport.Api`

Minimal APIs (não Controllers), CORS `AllowAny` (uso local), `JsonStringEnumConverter`
global, Swagger em `/swagger`. Sobe em `http://localhost:5180`; `dados/` ao lado do executável.

### Endpoints principais

| Método | Rota | Descrição |
|---|---|---|
| `GET/PUT` | `/api/configuracao` | agrupamento/tags (fonte única) + período do relatório (`RelatorioParametros.ini`; datas opcionais no PUT — omitidas preservam o salvo) |
| `GET/POST/PUT/DELETE` | `/api/usuarios-toggl` | CRUD de usuários do Toggl (inclui `administrador`); `POST .../validar-token` |
| `GET` | `/api/usuarios-toggl/tags?forcarAtualizacao=` | tags reais do workspace (token do `Administrador`), cache `TogglTagsCache.ini` |
| `POST` | `/api/consultas` | cache-first via `ServicoConsulta`, grava `RelatorioData.ini` |
| `GET` | `/api/relatorio?dataInicio=&dataFim=` \| `/api/busca?termo=` | relatório agrupado / busca por descrição sobre o cache; 409 sem cache exato p/ o período |
| `GET`/`POST` | `/api/dados/download` \| `/restaurar` | zip da raiz de `dados/` / restaura de um `.zip` (sobrescreve arquivos de mesmo nome) |
| `GET/PUT` | `/api/gant/parametros` | período do Gant (`GantParametros.ini`, datas opcionais no PUT) + agrupamento/tags da fonte única |
| `POST` | `/api/gant/consultas` | idem `/api/consultas`, grava `GantData.ini` |
| `GET` | `/api/gant?dataInicio=&dataFim=&termo=` | 409 sem cache; `termo` filtra antes de agrupar |
| `GET/POST/PUT/DELETE` | `/api/sprints` | CRUD de sprints; `PUT` 409 se fechado; `DELETE` apaga os 3 caches do sprint |
| `POST` | `/api/sprints/{chave}/fechar` \| `/reabrir` | trava/destrava edição e consulta |
| `GET/PUT` | `/api/sprint/categorias` | mapeamento DEV/REV/QA + agrupamento + tags detalhadas + `CorTag` |
| `GET/PUT` | `/api/sprint/responsabilidade` \| `/status-final` | status do Jira → DEV/REV/QA / Concluído\|Ignorado (`JiraStatus.ini`); `status-final` `PUT` 400 se um status estiver nas duas listas |
| `POST` | `/api/sprint/consultas` | cache-first via `ServicoConsulta`; `chaveSprint` obrigatório (404 inexistente, 400 inválida) isola os caches; `origem` (`nenhum`\|`toggl`\|`jira`\|`ambos`) escolhe o que forçar; fechado ignora `origem` e devolve 409 sem cache |
| `GET` | `/api/sprint?chaveSprint=` | 409 sem cache p/ o período do sprint |
| `GET/PUT` | `/api/jira/configuracao` | conexão + `quadroId`/`quadroNome` + campos (inclui `campoAnalisadoPor*`) (`JiraConexao.ini`/`JiraCampos.ini`); token sempre mascarado; `PUT` substitui tudo |
| `POST` | `/api/jira/testar-conexao` \| `/campos` \| `/issues` | testa credenciais sem salvar (`GET /rest/api/3/myself`) / lista campos `custom: true` / busca em lote (`key in (...)`) com a config salva |
| `GET` | `/api/jira/status?forcarAtualizacao=` \| `/prioridades?...` | nomes reais (`/rest/api/3/status`, `/priority`), cacheados |
| `GET/PUT` | `/api/jira/cores` | mapeamento nome→cor de status e prioridade, usado pelas badges do Sprint |
| `GET` | `/api/jira/usuarios?forcarAtualizacao=` | usuários reais (`/rest/api/3/users/search`, só `atlassian` ativos), cacheados |
| `GET/PUT` | `/api/jira/usuarios-mapeamento` | `displayName` do Jira → `ChaveToggl`/`Sigla`/`Cor` (fallback DEV/REV do Sprint) |
| `GET` | `/api/jira/quadros?forcarAtualizacao=` | quadros **Scrum** reais (`/rest/agile/1.0/board?type=scrum`), cacheados |
| `POST` | `/api/sprint/planejamento/consultas` | `{chaveSprint, forcar}` → `{veioDoCache, atualizadoEm, quadroNome, sprintJiraNome, quantidadeCartoes}`; grava o cache; 400 sem quadro/conexão/campos, 404 sprint, 409 fechado sem cache, 502 Jira |
| `GET` | `/api/sprint/planejamento?chaveSprint=` | resultado montado (colunas, totais, cartões, colaboradores, sprint do Jira); 409 sem cache |

**Erros**: 400 (parâmetros/datas inválidos, agrupamento fora de `descricao`/`tag`/`ambos`),
404, 409 (nome em uso; sem cache correspondente; sprint fechado sem cache), 500
(`Results.Problem`, falha de I/O), 502 (falha do Jira). `GET /api/relatorio`/`/busca`/
`/gant`/`/sprint`/`/sprint/planejamento` **exigem cache prévio** — nunca disparam consulta
implícita (mantém explícito quando há chamada HTTP externa/rate limit).

**`emAndamento` do relatório está em snake_case** (`workspace_id`, `duration`, etc.) — é o
`RegistroTempoDto` cru (`[JsonPropertyName]` da API do Toggl); o resto é camelCase.

### Autenticação HTTP Basic (opcional)

Desligada por padrão. Liga com `AUTH:USUARIO`/`AUTH:SENHA` (`AUTH__USUARIO`/`AUTH__SENHA`) —
usado no deploy público (Cloud Run). Rotas livres: `/health`, `/swagger`, `/images`. **Sem
`WWW-Authenticate`** no 401 de propósito (evita o popup nativo; o frontend tem
`LoginScreen.tsx` própria, com `sessionStorage`).

---

## 4. Frontend (`toggl-report-front`)

React 19 + TypeScript + MUI 9, Vite. `VITE_API_URL` = endereço da API (default `http://localhost:5180`).

```bash
cd toggl-report-front && npm install && npm run dev   # :5173
npm run build   # tsc -b && vite build
```

### Navegação e gate de configuração

**Menu lateral** (`MenuLateral`: `Drawer` permanente em `md+`, que um botão no AppBar
esconde/exibe — preferência em `localStorage` (`utils/preferenciasMenu.ts`); temporário em
`xs`) com 7 seções — Toggl, Jira, Configurações, Relatório, Gant, Sprint, Dados. O **Resumo
da aplicação** é a página inicial e o destino do clique na logo (não é item de menu).
`features/configuracoes/` (plural) = seção Configurações; o formulário de parâmetros do
Relatório vive em `features/relatorio/` (espelha `features/gant/`).
- **`useResumoConfiguracao` (`features/resumo`) é a fonte ÚNICA do gate** e das
  categorias/responsabilidade/status-final consumidas pelo Sprint. Recarrega a cada troca de seção e após salvamentos; `recarregar` **coalesce
  recargas concorrentes** (a última prevalece). Relatório/Gant/Sprint ficam `disabled` no
  menu até a configuração obrigatória estar completa (`configuracoes/completude.ts`):
  Agrupamento, Tags detalhadas (exigidas exceto no agrupamento "descricao"), Tags DEV/REV/QA
  do Toggl, Status DEV/REV/QA **e** Concluído/Ignorado do Jira (≥1 em cada), os 5 Campos do
  Jira (inclui "Analisado por") e o Mapeamento Jira↔Toggl. Cadastro de usuários, conexão do
  Jira e quadro **não** entram nesse cálculo (têm validação/gate próprios).
- **Obrigatoriedade é só do frontend**. **Tudo é obrigatório exceto cores** (inclui Sigla do
  usuário do Toggl; na conexão Jira, URL/e-mail/token — só sem um salvo — e quadro).
  **Mapeamento Jira↔Toggl completo** (`avaliarMapeamentoJiraToggl`) = todo usuário do Toggl
  é alvo de ≥1 entrada **e** toda entrada é válida (usuário ainda cadastrado, ou exclusivo do
  Jira com sigla); chaves órfãs ficam listadas.
- **Toggl** = CRUD de usuários (exige ≥1 `Administrador` para liberar Configurações).
  **Jira** = só a conexão (URL/e-mail/token, quadro de DEV, "Testar conexão", "Salvar").
- **Resumo** = 7 blocos (Usuários do Toggl; Toggl: Configurações; Jira: Conexão, Campos
  ["N de 5"], Status, Cores; Jira ↔ Toggl: Mapeamento) com atalho para a aba certa; só Cores
  é opcional.
- **Configurações** = 5 abas (Toggl; **Jira: Campos**; Jira: Status — DEV/REV/QA +
  Concluído/Ignorado, mutuamente exclusivos; Jira: Cores; Jira ↔ Toggl), **um** botão Salvar
  sempre habilitado (Status/Cores gravam o mesmo `JiraStatus.ini`, independentes).
  `salvarTudo` (chamado por `navegarComSalvamento` ao sair da seção; permanece se falhar)
  salva só abas **alteradas** (`onAlterado`, flag monótona — aba nunca tocada gravaria vazio
  por cima da configuração real), valida **tudo-ou-nada** (`onValidoChange`; aba alterada
  inválida → nenhuma salva, abre a primeira) e salva **em sequência** (corrida no
  `PUT /api/jira/configuracao`); falha não interrompe as demais; toast agregado + recarga do
  Resumo. Abas ficam montadas (`display:none`) após a 1ª visita. **Gate próprio**: só abre
  com `Administrador` do Toggl **e** Jira configurado (URL+e-mail).
- **Relatório/Gant**: tela de parâmetros (período + checkbox "Forçar nova consulta à API")
  e botão único **Consultar** — salva os parâmetros, pede confirmação se forçar, consulta e
  mostra a view (com "Voltar"). Busca por descrição inline.
- **Sprint**: lista de sprints + "Selecionar" → abre na hora o modal `ConsultaSprintDialog`
  (só nome do sprint + seletor "Forçar nova consulta em:", ou Alert de sprint fechado) →
  se forçar Toggl, segundo diálogo de confirmação → Acompanhamento (`SprintView`, com
  "Voltar" e **"Planejar"**, antes de "Informações").
- **Planejamento** (visão `'planejamento'` do `App`; "Voltar" retorna ao Acompanhamento):
  card de colaboradores (uma coluna por coluna do quadro + Total + rodapé "Cartões na
  coluna"), grid de cartões (pessoas = `BadgeSigla` do mapeado) e filtros Coluna, Status,
  Colaborador (Responsável OU Revisado por), "Inverter filtros", "Limpar" — E entre filtros,
  OU dentro; só afetam a grid e resetam ao trocar de sprint (`planejamento/filtros.ts`).
  Aberto, o `SprintView` fica **montado e oculto** (preserva filtros/ordenação). Sem quadro,
  "Planejar" abre diálogo com atalho para Jira → Conexão.
- **Dados** = baixar/importar `.zip` + lista dos `.ini` (`features/dados/arquivosIni.ts`,
  **manual**: §6). Sem usuário do Toggl, o 1º carregamento abre o diálogo de importação.
- **Responsividade**: a **página nunca rola na horizontal** — só tabelas/grades em container
  próprio com `overflow-x`; gutter do `Container` `px: { xs: 1, sm: 2 }`; dialogs largos
  (`SprintDialogInfo`, `SprintDialogDetalheLinha`) em `fullScreen` abaixo de `sm`.
- **Gant — colunas** (`useLargurasColunasGant`): Categoria, Total e cada data têm largura
  **fixa = maior conteúdo** (2 passes em `useLayoutEffect`: `auto` + `max-content` com todos
  expandidos, depois `table-layout:fixed` + `<colgroup>`); Descrição **sem largura** (recebe o
  resto, mín. 100px, "…" + Tooltip). Sem `ResizeObserver` nem `auto` no passe final (o `auto`
  redistribui a sobra e a medição virava ponto fixo).

### Estrutura

```
src/api/        fetch tipado (http.ts) + tipos espelhando os DTOs/records C# (tipos.ts)
src/features/   uma pasta por área: auth, usuarios-toggl, jira, configuracoes, resumo,
                consulta, relatorio (inclui o form de parâmetros), busca, gant, sprint,
                planejamento, dados
src/components/ peças reusadas entre features
src/hooks/      bases genéricas (useRecurso, useRecursoEditavel, useColecaoCrud,
                useNotificacao, useExpansao), useLarguraColunaRestante, useLargurasColunasGant
src/utils/      duracao, datas, rotulos, tipografia, consulta, preferenciasMenu
theme.ts        tema MUI único, claro — CORES (paleta) e ALTURA_CONTROLE exportados
App.tsx         menu lateral + seção ativa + estado elevado (consultas concluídas, sprint)
```

**Componentes compartilhados a preferir antes de duplicar**: `BadgeSigla` (tooltip com nome
completo; texto em `text.primary`; replicado no `<Chip>` do Gant; cantos retos por padrão,
`borderRadius: 1` só em Usuários do Toggl, `AccordionSummary` do Relatório e tabela
"Colaboradores" do Sprint), `SelectListaCacheada` (multi-seleção sobre listagem real
cacheada; "Atualizar lista" = IconButton 40×40), `SelectQuadroJira`, `FiltroMultiSelecao`
(filtros multi-seleção do Sprint e do Planejamento), `AutocompleteMultiCompacto` (base dos
dois: altura fixa que **nunca cresce** — 1 chip + chip "+N" com Tooltip dos selecionados; as
selecionadas **ficam na lista com checkbox marcado** [`disableCloseOnSelect`, sem
`filterSelectedOptions`] para desmarcar as ocultas no "+N"; `SelectListaCacheada` acrescenta
às opções os selecionados que sumiram da listagem), `MapaCoresLista`, `ParametrosFormBase`
(base de Relatório e Gant), `SelectAgrupamento`, `CabecalhoView`, `MarcaTogglReport`,
`AvisoCache`, `EsqueletoCarregando`, `DialogoConfirmacao`, `BotaoComCarregamento`,
`IconeAjuda` (`HelpOutlined` + `Tooltip`, `endAdornment` de `TextField`).

### Decisões técnicas importantes

- **`fetch` nativo com wrapper tipado** (`src/api/http.ts`), não axios. Deve extrair a
  mensagem de `ProblemDetails` (`detail`/`title`) — `Results.Problem` (ex.: 502 de
  `/api/usuarios-toggl/tags`); sem isso a UI mostra só "Bad Gateway".
- **Zero `any`**; sem `enum` do TS (`erasableSyntaxOnly`) — union de strings.
- **Download/upload de `dados/` via `fetch` autenticado + blob**, nunca `<a href>` direto —
  um link normal não carrega a credencial Basic (a API não usa cookie/sessão).
- **Curadoria "TEL primeiro" replicada aqui** (`curarPorDescricao`), simétrica à
  normalização do núcleo — o backend não ordena, só agrupa. **Seleção de usuário** vem do
  campo `Selecionado` (seção Toggl); as telas de consulta não escolhem usuários.
- **`localStorage` só em 2 lugares**: `features/sprint/tachados.ts` e
  `utils/preferenciasMenu.ts`; a credencial do login fica em `sessionStorage`
  (`api/credencial.ts`). Não usar para mais nada sem necessidade equivalente.
- **Cada painel da Jira reenvia a parte que não edita**: `PUT /api/jira/configuracao`
  **substitui a configuração inteira** (conexão + quadro + campos); cada painel faz GET
  fresco e reenvia o restante (`requestDaConfiguracaoSalva`/`salvarParcial`) — salvar
  Campos nunca apaga o quadro. `apiToken` vazio/null mantém o salvo.

### Tema

Tema único claro (`theme.ts`) — o tema escuro foi **removido por completo** a pedido do usuário; não reintroduzir.
`CORES` é a paleta central — nenhuma cor hex deve ficar solta fora de `theme.ts`.
`error` é propositalmente o vermelho padrão do MUI (não sobrescrever).
**Altura dos controles**: `ALTURA_CONTROLE = 40` (exportado com `CORES`). `size: 'small'` é o
default (`defaultProps`) de `TextField`/`Select`/`Autocomplete`/`FormControl`; `Button` padrão
(`minHeight` no `sizeMedium`) e `ToggleButton` pequeno também têm 40px — inputs, dropdowns e
botões ficam **nivelados lado a lado**; não sobrescrever `size` em controles de linha. Fora de
propósito: `Button size="small"`, `IconButton` de tabela e o swatch de cor de 24px.

---

## 5. Convenções

**C# (núcleo/API)**: tipo explícito no lugar de `var`; sem comentários no núcleo; antes de
duplicar uma checagem/loop, ver se há helper em `Configuracao/` (`ServicoChaves`,
`DiasUteis`, `Agrupamento.EhValido`, `AnalisadorIni.Escrever`/`DividirLista`) ou
`Api/Endpoints/` (`ValidacaoDatas`, `TratamentoIo`); fluxos de erro esperados usam
`ResultadoApiToggl<T>`, nunca exceptions; `end_of_line = crlf`, UTF-8 sem BOM;
`dotnet build TogglReport.slnx` em **0 warnings**.

**TypeScript/React**: zero `any`; sem `enum` do TS; estrutura por feature; tipos de
request/response em `src/api/tipos.ts` devem espelhar exatamente os DTOs/records C#
— ao mudar um endpoint, atualizar os dois lados; `npm run build` limpo antes de dar
por pronta uma mudança.

---

## 6. Notas rápidas (gotchas)

- **Depois de mudar `TogglReport.Nucleo`, reiniciar o `TogglReport.Api.exe`** — o processo
  trava o `.dll`, e um `dotnet build` que falha só com `MSB3026`/`MSB3027` (erro de cópia,
  não `error CS...`) é isso, não bug de código.
- **Rodar a API sem a `CHAVE_CRIPTOGRAFIA` correta (a do `.env`) é perigoso**: usa a chave
  embutida, não descriptografa os tokens `enc:`, o cache nunca "bate" e a consulta cai na
  **rede real** do Toggl — e, se todos falharem, `RelatorioData.ini` é regravado só com
  `[Geral]` (perde o cache). Em testes use **cópia** de `dados/`, a chave certa e proxy morto.
  Mudar a chave embutida rotaciona a criptografia (tokens `enc:` gravados sem a env var
  precisam ser reinseridos).
- **O zip de `/api/dados/download` inclui qualquer arquivo da raiz de `dados/`** (até um
  `dados.zip` antigo) e a restauração não tem whitelist de nomes.
- **Padrões do `.gitignore` para pastas ancorados com `/`** (`/dados/`, `/certificado/`) —
  sem a barra, batem em qualquer profundidade (já ignorou `src/features/dados/`).
- Todo `.ini` novo com dado sensível (token) ou de cache precisa entrar no
  `.gitignore`/`.dockerignore` (raiz + `toggl-report-back/`).
- **`features/dados/arquivosIni.ts` é lista manual** dos `.ini` (tipo, explicação, selo de
  token): ao criar/renomear/remover um `.ini` em `CaminhosDados`, atualize-a junto.
- **Medir overflow mobile** com iframe de 360–400px (`resize_window` do Chrome MCP é instável).
- **"Gant" (um "t" só)** é a nomenclatura correta neste projeto, mesmo que pedidos digam "Gantt".
- **Tags reais do Toggl** usam o token do `Administrador` em `GET /me`; `default_workspace_id`
  pode vir `null` com token válido — `ClienteApiToggl.ObterTagsAsync` cai para `GET
  /workspaces` (1º).
- **Testar o Jira real sem tocar o Toggl**: rodar a API com `HTTPS_PROXY`/`HTTP_PROXY` numa
  porta morta e `NO_PROXY=.atlassian.net` (Jira direto, demais hosts falham rápido); nunca
  escrever na `dados/` original (usar cópia).
- **Réplica externa (PowerShell) da descriptografia do token pode deixar um BOM (U+FEFF)**
  no início do texto; o app o remove — sem isso o Jira devolve 401 mesmo com token válido.
- **A imagem do back (`aspnet:10.0-alpine`) roda em globalization-invariant** (sem ICU):
  qualquer cultura **nomeada** (`new CultureInfo("pt-BR")`, `StringComparer.Create(...)`)
  lança `CultureNotFoundException` — só no container (os `.csproj` têm
  `InvariantGlobalization=false` e o Windows tem ICU: o dev local não reproduz; validar no
  Docker ou com `DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1`). Decisão: **nenhuma cultura
  nomeada no backend** (só `InvariantCulture`), sem habilitar ICU (custo de imagem/ambiente).
  Ordenar nomes = `ComparadorNomes` (ignora caixa/acento por tabela manual, sem ICU);
  `OrdinalIgnoreCase` não ignora acento. Teste no container:
  `docker build -t x toggl-report-back` + `docker run` com **cópia** de `dados/`,
  `-e CHAVE_CRIPTOGRAFIA`, proxy morto + `NO_PROXY=.atlassian.net`, porta ≠ 5003/5180 (sem
  `docker compose up`, nunca a `dados/` original).

---

## 7. Projeto irmão

`C:\Projetos\gerador-chave-nfe` segue as mesmas convenções de estilo (pt-BR, sem `var`,
zero dependências, .NET 10), mas é só um console; cada `CLAUDE.md` é a fonte da verdade do
seu repositório.