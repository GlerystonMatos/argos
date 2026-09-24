# CLAUDE.md

Memória de contexto do repositório **argos**. Histórico fica no `git log`; aqui só
o que **não** é derivável do código: arquitetura, regras de domínio não óbvias e decisões
que não devem ser revertidas sem motivo.

**Nome: "Argos"** (Argos Panoptes + o cão de Odisseu; texto no `SobreDialog`), grafia
**única** em tudo — marca, pastas `argos-*`, `Argos.*`, pacote npm, recursos de infra; nunca
"Argus". Ex-`toggl-report`: sem compatibilidade com o nome antigo (nem no código nem na
infra — o README da infra só descreve o ambiente atual: criar do zero e remover tudo).

O repositório reúne **três projetos independentes**:

- **`argos-back/`** — **.NET 10** (`Argos.slnx`): **`Argos.Nucleo`** (lógica de negócio e
  contrato de armazenamento, zero `PackageReference`), **`Argos.Armazenamento`** (Firestore) e **`Argos.Api`**
  (Minimal APIs, HTTP Basic opcional). O
  projeto console foi **removido por completo** — não recriar sem pedido explícito.
- **`argos-front/`** — React 19 + TypeScript + MUI (Vite) que consome a Web API.
- **`argos-infra/`** — Terraform (`app` + Firestore, `finops`/killswitch) + Cloud Build no GCP.

Aplicação: relatórios de tempo trabalhado da **API v9 do Toggl Track**, em três
visualizações independentes — **Relatório**, **Gant** e **Sprint** — cada uma com parâmetros
e cache de consulta próprios, compartilhando só a lista de usuários, a configuração de
agrupamento/tags e o serviço de consulta (cache-first + rate limit). O Sprint tem ainda o
módulo **Planejamento** (só Jira, sem Toggl).

**Tudo em pt-BR**: interface, mensagens, identificadores, pastas, namespaces
(`Argos.Nucleo.<Pasta>`, `Argos.Api.<Pasta>`). Em inglês só o
inevitável (`Program`, `Main`, `Task`/`async`, `[JsonPropertyName]` com nomes da API do
Toggl) e siglas (`Dto`, `Api`, `Http`, `Toggl`). **Sem comentários** em
`Argos.Nucleo` (nomes claros no lugar de comentário; regras de domínio não óbvias
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
- **Cache de consulta**: cada visualização tem seu cache com o retorno **cru** da
  última consulta por usuário. Período+usuários iguais → reaproveita o cache em vez de
  chamar a API; agrupamento/cálculo sempre roda em runtime (o cache nunca guarda resultado
  processado). Também é reserva quando o rate limit (§2) é atingido. `ServicoConsulta`
  (núcleo) centraliza a decisão para as 3 visualizações — cada consumidor só decide
  **quando** chamar (`forcarConsultaApi`).
- **Sem exportação para CSV**.

---

## 2. `Argos.Nucleo`

```
Configuracao/    IArmazenamentoDados + ArmazenamentoArquivos, carregadores de cada documento,
                 criptografia, helpers (ServicoChaves, DiasUteis, Agrupamento.EhValido),
                 CaminhosDados (um DocumentoDados por documento)
Gant/            CelulaGant / LinhaGant / ResultadoGant / ServicoGant.Montar
Sprint/          CabecalhoSprint / BlocoCategoriaSprint /
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
Planejamento/    ServicoPlanejamento.Montar,
                 ResultadoPlanejamento / CartaoPlanejamento / ColaboradorPlanejamento / PessoaPlanejamento
```

### Armazenamento (`IArmazenamentoDados`, documentos JSON)

Documentos JSON (camelCase) por nome; esquema no README da infra (seção Firestore). **Só JSON**.
`ARMAZENAMENTO__PROJETO_FIRESTORE` preenchida → Firestore (coleção `dados`, banco `(default)`: cota
grátis = 1 banco/projeto); vazia → `dados/*.json`. Contrato **síncrono** de propósito (sync-over-async
no adaptador); sem migração de formato no código. **Firestore** (`argos-back/Argos.Armazenamento`): caches Toggl divididos em `usuarios/{chave}/blocos/`
(≤1000 registros; doc máx. 1 MiB), `Apagar` recursivo, erro → `IOException`; inteiro vai como `long`
(ternário `long : double` já virou double) e `double` inteiro volta `N.0`.

| Documento | Conteúdo |
|---|---|
| `TogglUsuarios` | usuários; token `enc:` |
| `TogglConfiguracao` | `Agrupamento`/`CorTag` — **fonte única** do Relatório/Gant/Sprint |
| `TogglTags` | por tag: `Categorias` (Dev,Rev,Qa) / `Detalhar` |
| `JiraConexao` | URL/e-mail/token `enc:` + `QuadroId`/`QuadroNome` (DEV) |
| `JiraCampos` | campos customizados + janela da Previsão |
| `JiraStatus` | por status: `Cor`/`Responsaveis`/`Final` (Concluido\|Ignorado) |
| `JiraPrioridades`, `JiraColunas`, `JiraTimes`, `JiraEpicos` | cor por nome (épico: por chave) |
| `JiraQuadro` | `ColunasOcultas` do Planejamento |
| `JiraTogglMapeamento` | por `displayName` do Jira: `ChaveToggl`/`Sigla`/`Cor` |
| `Sprints` | Nome/HorasPorDia/MargemPercentual/DataInicio/DataFim/`Fechado` |
| `RelatorioParametros`, `GantParametros` | só `DataInicio`/`DataFim` |
| `RelatorioData`, `GantData` | cache **global** por período (sobrescreve ao trocar) |
| `SprintData_`/`JiraSprintData_`/`JiraPlanejamentoData_<chave>` | cache **por sprint** |
| `TogglTagsCache`, `Jira*Cache` | listagens reais |

- **Cache por sprint**: `DELETE` do sprint apaga os três documentos; a referência só é montada a
  partir de sprint **existente** em `Sprints` + validação de caracteres da chave
  (anti path-traversal) — `POST /api/sprint/consultas` com chave inexistente = 404,
  inválida = 400. Isolar por sprint é deliberado: consultar um não perde o cache de outro.
- **`JiraStatus`** é gravado por **3 endpoints** (`/api/sprint/responsabilidade`,
  `/api/sprint/status-final`, `/api/jira/cores`) vindos de duas abas independentes do front
  (Status dispara 2 PUTs em paralelo), então `ArquivoStatusJira` faz read-modify-write
  (merge) sob **lock estático** (basta: Cloud Run máx. 1 instância); os demais sem lock.

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
**global** TAG→categoria Dev/Rev/Qa + `CorTag` vive em `TogglTags`/`TogglConfiguracao`
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
margem     = floor(MargemPercentual/100 * tempoTotal)
td         = floor(tempoTotal - margem)      # tempo por colaborador
ct         = td * nº de colaboradores selecionados   # capacidade total
```
Só a fórmula acima é válida (não é "70% do total" nem "70% de 70%"). `MargemPercentual`
(`DadosSprint`, `Sprints`) é **obrigatória no cadastro/edição do sprint**, mesmo padrão
de `HorasPorDia` (0 ≤ valor < 100; validada em `POST`/`PUT /api/sprints`); sprints salvos
antes dessa mudança leem com fallback 30 (o valor fixo antigo) até serem editados.

**Totalizadores do cabeçalho "Pendentes"/"Concluído"** (`CabecalhoSprint`): duas listas
globais de status do Jira (`Final` = `Concluido`/`Ignorado` em `JiraStatus`),
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
- **Descrição trunca de forma responsiva** (`useLarguraColunaRestante`); texto completo no
  tooltip e no duplo clique (`SprintDialogDetalheLinha`).
- **Prioridade/Situação/PRE vêm do Jira** — sem integração ou issue não encontrada,
  Prioridade e Situação = "Nenhuma" (cinza) e PRE = "–"; nunca editáveis nem persistidos.
- **Previsão (de liberação)**: após Descrição (`IssueJira.PrevisaoLiberacao`, opcional),
  cor igual ao Planejamento (§2, `utils/previsaoLiberacao.ts`). A grid zera `borderRight`
  nas 6 primeiras colunas; a Previsão tem `borderLeft` próprio (como o início dos grupos).

**Integração Jira (opcional, por sprint)**: `POST /api/sprint/consultas` extrai os códigos
TEL de **todos** os registros crus do Toggl recém-buscados (independe do `Agrupamento`),
busca em lote (`key in (...)`) e grava em `JiraSprintData_<chave>`; falha do Jira nunca
quebra a consulta do Toggl. `ServicoSprint.Montar` aplica só a linhas de descrição:
`Prioridade`/`Situacao` e `PreHoras` de cada bloco DEV/REV/QA (campo customizado próprio por
grupo; sem o campo, 0). "Estimativa original" (`timeoriginalestimate`) foi **removida por
completo** — não recriar. `IssueJira.UrlIssue` vira link no Código.
- **`GET /rest/api/3/search` foi descontinuado** (410) — usar `POST /rest/api/3/search/jql`,
  que **pagina em até 100** (`nextPageToken`/`isLast`): `BuscarIssuesAsync` faz loop com
  `maxResults` 100 (uma chamada só já perdeu issues em silêncio: 129 códigos, 100 voltavam).
- **`Responsavel`/`RevisadoPor`**: `Responsavel` vem do campo nativo `assignee`;
  `RevisadoPor` de um campo customizado configurável (`CampoRevisadoPorId`/`Nome`, próprio
  de cada instância Jira). Ambos: só o `displayName` do "user picker".
- **Fallback DEV/REV via mapeamento Jira↔Toggl** — regra crítica, já reimplementada mais
  de uma vez; **DEV vem de `Responsavel`, REV vem de `RevisadoPor`, nunca o contrário**.
  `[Usuario:<displayName Jira>]` de `JiraTogglMapeamento` guarda `ChaveToggl`/`Sigla`/
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
  valor real, mesmo que arredonde para `00h`, mostra a hora. PRE/REA em `accentAzul`; REA fica vermelho
  (`corPendente`) quando ultrapassa o PRE do bloco (só com PRE real; REV/QA nunca têm PRE).

**Consulta do Sprint — o que forçar** (`origem: "nenhum"|"toggl"|"jira"|"ambos"`, default
`"nenhum"`): controla o que é **forçado**, não "de onde vêm os dados". Toggl: forçado
(`toggl`/`ambos`) sempre busca; senão cache-first (busca sem cache válido, mesmo com
`"nenhum"`). Jira: atualiza se forçado (`jira`/`ambos`) **ou** se o Toggl fez consulta real —
nunca só por reaproveitar cache. Sem 409 para "só Jira sem cache do Toggl". Relatório/Gant
usam o mesmo modal só com Nenhum/Toggl (não consultam Jira; `toggl` = `forcarConsultaApi`).

**Listagem do Sprint — filtros** (`SprintView.tsx`): "Status" = texto bruto do Jira;
"Situação" (DEV/REV/QA) = Pendente/Concluído por bloco (`situacaoGrupo`; tag = "Tag").
Filtros Prioridade, Status, Colaborador e Situação. **Situação + Colaborador**: sem
colaborador, basta **qualquer** grupo bater; com colaborador(es), só os grupos **deles** —
bloco combinado dedicado (dois `if` dariam falso positivo com "Inverter filtros", que faz os
4 filtros **excluírem**; a busca por texto nunca inverte e também casa o código com zeros). "Limpar" e "Limpar ordenação"
são independentes.

**Prioridade/Situação — cores**: a busca de issues do Jira não expõe cor; vem de
**mapeamento por nome exato** (`GET/PUT /api/jira/cores` → `Cor` em `JiraStatus`/
`JiraPrioridades`), alimentado pela listagem **real** (`/api/jira/status`/`/prioridades`,
cacheadas). Sem cor: **Prioridade** usa paleta fixa por severidade (`Muito alta`…`Muito
baixa`); **Status** vai ao cinza `corIndisponivel` — **não** usar `statusCategory` como
fallback (o amarelo de "indeterminate" se confundia com cor configurada). Badge de tag usa
`CorTag`; texto de badge em `text.primary`; `BadgeTexto` tem **largura fixa** com ellipsis +
`Tooltip`.

**Responsabilidade por status** (`Responsaveis` em `JiraStatus`, status do Jira →
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
- **Escopo = cartões do SPRINT ATIVO do quadro** (`board/{id}/sprint?state=active` →
  `jql=sprint in (ids)`), nunca o quadro inteiro. **Sem correlação** com o sprint do app (o
  Jira agrupa por épicos); o cache por sprint do app só preserva o "retrato".
  `maxResults=200` até `startAt >= total`; 429 com 1 retry (`Retry-After`).
- **Campos customizados** (mesmo mecanismo de descoberta/seleção, sem field id hardcoded):
  **Time** (`ExtrairTextoCampo`: string ou objeto `value`/`name`/`title`/`displayName` —
  shape varia por instância, não validado ao vivo; sem bater → vazio, nunca quebra) e
  **Previsão de liberação** (`ExtrairData`: `TryParse` → `yyyy-MM-dd`, senão `null`), esta
  também na listagem do Sprint. **Cor da Previsão** — fonte única `utils/previsaoLiberacao.ts`
  (célula **e** filtro Prazo): sem data = nada; ≤ hoje = vermelho (`corPendente`); até hoje +
  janela = laranja (`corPrazoProximo`); além = **verde** (`corConcluido`). Janela
  `JanelaAlertaPrevisaoLiberacaoDias` (padrão 5) em `JiraCampos`.
- **Épico = `fields.parent`** (o campo Agile `epic` vem vazio — não usar); no backend
  `GrupoChave`/`GrupoResumo`. Badge com cor **configurada no app** por **chave** do épico
  (o título muda com o período).
- **Coluna** = `status.id` ∈ `columnConfig.columns[].statuses[].id`; fora de todas →
  "(sem coluna)" no fim. Na grid: badge com **nome completo** (cor em `JiraColunas`), sem
  abreviar nem popover. **Só o cabeçalho do card "Colaboradores"** usa sigla
  (`abreviacaoColuna.ts`, reescrita 4x — regra e exemplos no README do front; não mudar sem
  pedido). ANP/RES/REP na grid de cartões = mapa fixo com `Tooltip`.
- **Colunas ocultas** (`JiraQuadro`): `ServicoPlanejamento.Montar` **exclui por
  completo** esses cartões (grid, totais, contagens) — não é "(sem coluna)".
- **Contagem**: 1 por cartão se a pessoa é Responsável OU Revisado por ("Analisado por" não
  conta). Pessoa = mapeamento Jira↔Toggl contra **todos** os usuários do Toggl; exclusivo do
  Jira usa Sigla/Cor da entrada; sem mapeamento → iniciais (até 3), `mapeado=false`. Chave
  de filtro = `displayName`. Código/Descrição via `ServicoCodigoTel`.
- **Cache `JiraPlanejamentoData_<chave>`** (dado **cru**). Reutiliza, exceto: "Atualizar"
  da tela; "Forçar nova consulta em: Jira/Ambos" (**2º `POST` em segundo plano**, falha =
  aviso, "Toggl" sozinho não força; `atualizacoesPlanejamento.ts` guarda as promessas por
  sprint); sem cache válido (ausente, `QuadroId` diferente ou `SprintJira` nulo). **Sprint
  fechado nunca chama o Jira**. Falha do Jira → 502, cache anterior fica; `GET` sem cache = 409.
- **Configuração**: quadro em Jira (Conexão), obrigatório no formulário, **não** no gate
  global. Analisado por, Time e Previsão de liberação são o 5º–7º campos obrigatórios
  (gate "N de 7") **só no frontend** — o backend (`ValidarConfiguracao`) exige só
  Analisado/Revisado por.

---

## 3. `Argos.Api`

Minimal APIs (não Controllers), CORS `AllowAny` (uso local), `JsonStringEnumConverter`
global, Swagger em `/swagger`. Sobe em `http://localhost:5180`; dados no Firestore ou em `dados/` ao lado do executável (§2).

### Endpoints principais

| Método | Rota | Descrição |
|---|---|---|
| `GET/PUT` | `/api/configuracao` | agrupamento/tags (fonte única) + período do relatório (`RelatorioParametros`; datas opcionais no PUT — omitidas preservam o salvo) |
| `GET/POST/PUT/DELETE` | `/api/usuarios-toggl` | CRUD de usuários do Toggl (inclui `administrador`); `POST .../validar-token` |
| `GET` | `/api/usuarios-toggl/tags?forcarAtualizacao=` | tags reais do workspace (token do `Administrador`), cache `TogglTagsCache` |
| `POST` | `/api/consultas` | cache-first via `ServicoConsulta`, grava `RelatorioData` |
| `GET` | `/api/relatorio?dataInicio=&dataFim=` \| `/api/busca?termo=` | relatório agrupado / busca por descrição sobre o cache; 409 sem cache exato p/ o período |
| `GET`/`POST` | `/api/dados/download` \| `/restaurar` | zip plano com um `<Documento>.json` por documento / restaura `.json` (sobrescreve só os presentes) |
| `GET/PUT` | `/api/gant/parametros` | período do Gant (`GantParametros`, datas opcionais no PUT) + agrupamento/tags da fonte única |
| `POST` | `/api/gant/consultas` | idem `/api/consultas`, grava `GantData` |
| `GET` | `/api/gant?dataInicio=&dataFim=&termo=` | 409 sem cache; `termo` filtra antes de agrupar |
| `GET/POST/PUT/DELETE` | `/api/sprints` | CRUD de sprints; `PUT` 409 se fechado; `DELETE` apaga os 3 caches do sprint |
| `POST` | `/api/sprints/{chave}/fechar` \| `/reabrir` | trava/destrava edição e consulta |
| `GET/PUT` | `/api/sprint/categorias` | mapeamento DEV/REV/QA + agrupamento + tags detalhadas + `CorTag` |
| `GET/PUT` | `/api/sprint/responsabilidade` \| `/status-final` | status do Jira → DEV/REV/QA / Concluído\|Ignorado (`JiraStatus`); `status-final` `PUT` 400 se um status estiver nas duas listas |
| `POST` | `/api/sprint/consultas` | cache-first via `ServicoConsulta`; `chaveSprint` obrigatório (404 inexistente, 400 inválida) isola os caches; `origem` (`nenhum`\|`toggl`\|`jira`\|`ambos`) escolhe o que forçar; fechado ignora `origem` e devolve 409 sem cache |
| `GET` | `/api/sprint?chaveSprint=` | 409 sem cache p/ o período do sprint |
| `GET/PUT` | `/api/jira/configuracao` | conexão + `quadroId`/`quadroNome` + campos (inclui `campoAnalisadoPor*`/`campoTime*`) (`JiraConexao`/`JiraCampos`); token sempre mascarado; `PUT` substitui tudo |
| `POST` | `/api/jira/testar-conexao` \| `/campos` \| `/issues` | testa credenciais sem salvar (`GET /rest/api/3/myself`) / lista campos `custom: true` / busca em lote (`key in (...)`) com a config salva |
| `GET` | `/api/jira/status?forcarAtualizacao=` \| `/prioridades?...` \| `/colunas?...` | nomes reais (`/rest/api/3/status`, `/priority`, colunas do quadro de DEV via `/rest/agile/1.0/board/{id}/configuration`), cacheados; `/colunas` 400 sem quadro configurado; `/times`/`/epicos` = caches do Planejamento (épicos só de sprints abertos; cor oculta é mantida) |
| `GET/PUT` | `/api/jira/cores` | nome→cor de status, prioridade, coluna e time (badges do Sprint/Planejamento) |
| `GET/PUT` | `/api/jira/quadro` | colunas do quadro que não aparecem no Planejamento (`ColunasOcultas`) |
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

## 4. Frontend (`argos-front`)

React 19 + TypeScript + MUI 9, Vite. `VITE_API_URL` = endereço da API (default `http://localhost:5180`).

```bash
cd argos-front && npm install && npm run dev   # :5173
npm run build   # tsc -b && vite build
```

### Navegação e gate de configuração

**Menu lateral** (`MenuLateral`: `Drawer` permanente em `md+`, que um botão no AppBar
esconde/exibe — **sempre abre expandido** ao carregar, sem persistência; temporário em
`xs`) com 7 seções — Toggl, Jira, Configurações, Relatório, Gant, Sprint, Dados. **Toda
navegação (`navegarPara`) recolhe o menu automaticamente** em `md+` (só na sessão), dando a largura toda ao conteúdo — não é só ao clicar num item do menu, vale
para qualquer chamada de `navegarPara` (atalhos internos, clique na logo etc.). O **Resumo
da aplicação** é a página inicial e o destino do clique na logo (não é item de menu).
`features/configuracoes/` (plural) = seção Configurações; o formulário de parâmetros do
Relatório vive em `features/relatorio/` (espelha `features/gant/`).
- **`useResumoConfiguracao` (`features/resumo`) é a fonte ÚNICA do gate** e das
  categorias/responsabilidade/status-final do Sprint (carrega também quadro e cores de coluna,
  só para exibição). Recarrega a cada troca de seção e após salvar (`onSalvo()` uma vez por
  `salvarTudo`; `recarregar` coalesce chamadas concorrentes). Relatório/Gant/Sprint ficam
  `disabled` até a configuração obrigatória estar completa (`configuracoes/completude.ts`):
  Agrupamento, Tags detalhadas (exceto agrupamento "descricao"), Tags DEV/REV/QA, Status
  DEV/REV/QA **e** Concluído/Ignorado (≥1 em cada), os 7 Campos do Jira e o Mapeamento
  Jira↔Toggl. Usuários, conexão e quadro têm validação própria, fora desse cálculo.
- **Obrigatoriedade é só do frontend**; **tudo é obrigatório exceto cores**. Mapeamento
  completo (`avaliarMapeamentoJiraToggl`) = todo usuário do Toggl é alvo de ≥1 entrada **e**
  toda entrada é válida (usuário cadastrado, ou exclusivo do Jira com sigla).
- **Toggl** = CRUD de usuários (≥1 `Administrador` libera Configurações). **Jira** = só a
  conexão (URL/e-mail/token, quadro de DEV, "Testar conexão").
- **Resumo** = 8 blocos (um por aba/conexão, com atalho; só Cores e Quadro opcionais),
  **colapsados por padrão** (`BlocoResumo`), sem rolagem interna.
- **Configurações** = 6 abas (Toggl; Jira: Campos; Jira: Status; Jira: Cores; Jira: Quadro;
  Jira ↔ Toggl), **um** Salvar. `salvarTudo` (também ao sair da seção; permanece se falhar)
  salva só abas **alteradas** (`onAlterado`, flag monótona — aba não tocada gravaria vazio),
  valida **tudo-ou-nada** (`onValidoChange`) e salva **em sequência** (corrida no
  `PUT /api/jira/configuracao`); toast agregado. Abas ficam montadas (`display:none`) após a
  1ª visita. **Gate próprio**: `Administrador` do Toggl **e** Jira com URL+e-mail.
- **Sobre**: ícone `InfoOutlined` ao lado de `MarcaArgos` (alinhado à linha de base do
  "ARGOS" via `mb`) abre `SobreDialog` (spinner até a logo carregar e decodificar, 1x por sessão).
- **Carregamento "tudo ou nada"**: nenhuma tela exibe form/tabela/aviso de validação antes de
  **todas** as suas leituras terminarem (`EsqueletoCarregando`; hooks base expõem `carregado`
  aditivo — **não** mudar o `carregando` inicial `false`, há consumidores de `!carregando`);
  gravação desabilita controles (abas recebem `salvando` do Salvar global); recarga troca o
  dado antigo pelo esqueleto.
- **Relatório/Gant**: tela de parâmetros (só período) e **Consultar** → `ConsultaDialog` com
  `SeletorOrigemConsulta` (Nenhum/Toggl; confirmação se Toggl) → salva, consulta e mostra a
  view (com "Voltar"). Busca por descrição inline.
- **Sprint**: lista de sprints + "Selecionar" → abre na hora o modal `ConsultaSprintDialog`
  (só nome do sprint + seletor "Forçar nova consulta em:", ou Alert de sprint fechado) →
  se forçar Toggl, segundo diálogo de confirmação → Acompanhamento (`SprintView`, com
  "Voltar" e **"Planejar"**). **"Informações"** (modal com abas explicando o cálculo) foi
  **removida por completo** a pedido do usuário (ficou complexa demais) — não recriar.
- **Planejamento** (visão `'planejamento'` do `App`; "Voltar" retorna ao Acompanhamento):
  card de colaboradores (colunas com sigla + tooltip — §2) e grid de cartões (Time/Épico:
  nomes via `/times`/`/epicos`, pois não há listagem confiável no Jira; PRE = estimativa
  DEV/REV do Jira, cache antigo = "–" até "Atualizar"; pessoas = `BadgeSigla`). Só renderiza
  quando consulta **e** cores do Jira estão prontas. Filtros: busca por código/descrição
  (fora da inversão, como no Sprint), Coluna, Status, Colaborador, Time, Épico e **Prazo**
  (mesma função da cor), "Inverter", "Limpar" — E entre filtros, OU dentro; resetam ao trocar
  de sprint.
  **Atualizar** pede confirmação. `SprintView` fica **montado e oculto** (preserva filtros).
  Sem quadro, "Planejar" abre diálogo com atalho para Jira → Conexão.
- **Dados** = baixar/importar `.zip` + lista dos `.json` (`features/dados/arquivosDados.ts`,
  **manual**: §6). Sem usuário do Toggl, o 1º carregamento abre o diálogo de importação.
- **Responsividade**: **a página nunca rola na horizontal** (só tabelas, em container com
  `overflow-x`); gutter `px: { xs: 1, sm: 2 }`; dialogs largos `fullScreen` abaixo de `sm`.
- **Gant — colunas** (`useLargurasColunasGant`): larguras fixas medidas num passe
  `max-content`; sem `ResizeObserver` nem `auto` no passe final (a medição virava ponto fixo).

### Estrutura

```
src/api/        fetch tipado (http.ts) + tipos espelhando os DTOs/records C# (tipos.ts)
src/features/   uma pasta por área: auth, usuarios-toggl, jira, configuracoes, resumo,
                consulta, relatorio (inclui o form de parâmetros), busca, gant, sprint,
                planejamento, dados
src/components/ peças reusadas entre features
src/hooks/      bases genéricas (useRecurso, useRecursoEditavel, useColecaoCrud,
                useNotificacao, useExpansao), useLarguraColunaRestante, useLargurasColunasGant
src/utils/      duracao, datas, rotulos, tipografia, consulta, previsaoLiberacao
theme.ts        tema MUI único, claro — CORES (paleta) e ALTURA_CONTROLE exportados
App.tsx         menu lateral + seção ativa + estado elevado (consultas concluídas, sprint)
```

**Componentes compartilhados a preferir antes de duplicar**: `BadgeSigla` (tooltip com nome
completo; texto `text.primary`; cantos retos, `borderRadius: 1` só em Usuários do Toggl,
Relatório e "Colaboradores" do Sprint), `SelectListaCacheada` (multi-seleção sobre listagem
cacheada; acrescenta selecionados que sumiram), `SelectQuadroJira`, `FiltroMultiSelecao`,
`AutocompleteMultiCompacto` (base dos dois: altura que **nunca cresce** — 1 chip + "+N" com
Tooltip; selecionadas **ficam na lista marcadas**, `disableCloseOnSelect`, sem
`filterSelectedOptions`), `MapaCoresLista`, `ParametrosFormBase`, `SelectAgrupamento`,
`CabecalhoView`, `MarcaArgos`, `CreditoApp`, `SobreDialog`, `AvisoCache`,
`EsqueletoCarregando`, `DialogoConfirmacao`, `BotaoComCarregamento`, `IconeAjuda`,
`ConsultaDialog`/`SeletorOrigemConsulta` (modal de consulta do Sprint/Relatório/Gant), `LinkJira`.

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
- **Busca por código/descrição** (toda a app): parte do texto, sem caixa, **ignorando espaços
  e hífens** — regra única em `utils/buscaTexto.ts` e `Nucleo/Relatorios/NormalizacaoBusca.cs`
  (`/api/busca`, `termo` do Gant); manter os dois iguais.
- **Link para o Jira** (`LinkJira`): Sprint/Planejamento usam a URL da API (só issue achada);
  Relatório/busca/Gant montam no front (`utils/codigoTel.ts`: `jiraUrlDominio` normalizado como
  `ClienteApiJira.NormalizarDominio` + `/browse/TEL-<n>` sem zeros à esquerda), sem chamada ao
  Jira — linkam qualquer TEL. Só o código é clicável.
- **"Lembrar login"** (`api/loginLembrado.ts`): credencial cifrada AES-GCM no IndexedDB com chave
  **não exportável**, 30 dias; apagada ao sair, em 401 e ao entrar sem marcar. Nunca em texto puro
  nem em `localStorage`. **`localStorage` só no tachado do Sprint**; a sessão fica em `sessionStorage`
  (`api/credencial.ts`). Não usar para mais nada sem necessidade equivalente.
- **Cada painel da Jira reenvia a parte que não edita**: `PUT /api/jira/configuracao`
  **substitui a configuração inteira** (conexão + quadro + campos); cada painel faz GET
  fresco e reenvia o restante (`requestDaConfiguracaoSalva`/`salvarParcial`) — salvar
  Campos nunca apaga o quadro. `apiToken` vazio/null mantém o salvo.

### Tema

Tema único claro (`theme.ts`) — o escuro foi **removido por completo**; não reintroduzir.
`CORES` é a paleta central (nenhum hex solto fora de `theme.ts`); `error` fica o vermelho
padrão do MUI. **`ALTURA_CONTROLE = 40`**: `size: 'small'` é default de `TextField`/`Select`/
`Autocomplete`/`FormControl` e `Button`/`ToggleButton` também têm 40px — controles
**nivelados lado a lado**; não sobrescrever `size` em controles de linha (exceções:
`Button size="small"`, `IconButton` de tabela, swatch de 24px).

---

## 5. Convenções

**C# (núcleo/API)**: tipo explícito no lugar de `var`; sem comentários no núcleo; antes de
duplicar uma checagem/loop, ver se há helper em `Configuracao/` (`ServicoChaves`,
`DiasUteis`, `Agrupamento.EhValido`) ou
`Api/Endpoints/` (`ValidacaoDatas`, `TratamentoIo`); fluxos de erro esperados usam
`ResultadoApiToggl<T>`, nunca exceptions; `end_of_line = crlf`, UTF-8 sem BOM;
`dotnet build Argos.slnx` em **0 warnings**.

**TypeScript/React**: zero `any`; sem `enum` do TS; estrutura por feature; tipos de
request/response em `src/api/tipos.ts` devem espelhar exatamente os DTOs/records C#
— ao mudar um endpoint, atualizar os dois lados; `npm run build` limpo antes de dar
por pronta uma mudança.

---

## 6. Notas rápidas (gotchas)

- **Depois de mudar `Argos.Nucleo`, reiniciar o `Argos.Api.exe`** — o processo
  trava o `.dll`, e um `dotnet build` que falha só com `MSB3026`/`MSB3027` (erro de cópia,
  não `error CS...`) é isso, não bug de código.
- **Rodar a API sem a `CHAVE_CRIPTOGRAFIA` do `.env` é perigoso**: não descriptografa os
  tokens `enc:`, o cache nunca "bate", a consulta cai na **rede real** do Toggl e, se todos
  falharem, `RelatorioData` é regravado sem usuários. Em testes: **cópia** dos dados (API
  copiada de `bin/` para fora do repo, com `dados/` ao lado), a chave certa e proxy morto.
  Mudar a chave embutida rotaciona a criptografia.
- **A restauração grava qualquer `.json` da raiz do zip** (sem whitelist de nomes).
- **Padrões do `.gitignore` para pastas ancorados com `/`** (`/dados/`, `/certificado/`) —
  sem a barra, batem em qualquer profundidade (já ignorou `src/features/dados/`).
- **Build do back tem contexto `argos-back/`** (compose e Cloud Build); `ProjectReference` entre os
  projetos sempre relativo à pasta irmã (`..\Argos.Nucleo\...` — caminho que sobe até a raiz quebra no container).
- **`features/dados/arquivosDados.ts` é lista manual** dos documentos (tipo, explicação, selo de
  token): ao criar/renomear/remover um documento em `CaminhosDados`, atualize-a junto.
- **Medir overflow mobile** com iframe de 360–400px.
- **"Gant" (um "t" só)** é a nomenclatura correta neste projeto, mesmo que pedidos digam "Gantt".
- **Tags reais do Toggl**: `default_workspace_id` de `GET /me` pode vir `null` com token
  válido — `ObterTagsAsync` cai para o 1º de `GET /workspaces`.
- **Testar o Jira real sem tocar o Toggl**: rodar a API com `HTTPS_PROXY`/`HTTP_PROXY` numa
  porta morta e `NO_PROXY=.atlassian.net` (Jira direto, demais hosts falham rápido); nunca
  escrever nos dados originais (usar cópia). **Firestore sem tocar produção**: emulador em Docker
  (`google-cloud-cli:emulators`, receita no README da infra) + `FIRESTORE_EMULATOR_HOST`.
- **Descriptografia do token fora do app (PowerShell) pode deixar BOM (U+FEFF)** no início;
  o app o remove — sem isso o Jira devolve 401 com token válido.
- **A imagem do back (`aspnet:10.0-alpine`) roda em globalization-invariant**: cultura
  **nomeada** (`new CultureInfo("pt-BR")`, `StringComparer.Create`) lança
  `CultureNotFoundException` só no container (o Windows tem ICU; reproduzir com
  `DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1`). Decisão: só `InvariantCulture`, sem ICU;
  ordenar nomes com `ComparadorNomes` (`OrdinalIgnoreCase` não ignora acento). Testar no
  container com as mesmas precauções acima, porta ≠ 5003/5180.
- **Testar o front contra uma API de teste**: o `argos-front/.env` aponta para `:5003` (compose);
  rode `VITE_API_URL=http://localhost:5180 npx vite` (env var vence o `.env`).

---

## 7. Projeto irmão

`C:\Projetos\gerador-chave-nfe`: mesmas convenções (console .NET 10); cada `CLAUDE.md` vale só para o seu repositório.