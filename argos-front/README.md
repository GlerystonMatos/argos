# argos-front

[← voltar ao README principal](../README.md)

Frontend em **React 19 + TypeScript + MUI** (via Vite) que consome a [Web API do `argos-back`](../argos-back/README.md#web-api-argosapi), com o fluxo completo em uma interface gráfica local: cadastro de usuários e configurações → consulta → relatório com busca por descrição, mais uma visualização em **Gráfico de Gant** e outra de **Sprint** (gestão de sprints + acompanhamento de capacidade e tarefas, com um módulo de **Planejamento** dos cartões do quadro do Jira), cada uma com parâmetros e cache próprios.

## Requisitos

- [Node.js](https://nodejs.org/) 20+ e `npm`
- A [Web API](../argos-back/README.md#web-api-argosapi) rodando e alcançável no endereço configurado (padrão `http://localhost:5180`; sem ela, as chamadas falham com um aviso na tela — o app não trava)

## Como rodar

```bash
npm install
```

```bash
npm run dev       # http://localhost:5173, com hot reload
```

### Configurando o endereço do backend

O endereço da Web API vem da variável de ambiente `VITE_API_URL` (mecanismo padrão do Vite — só tem efeito se estiver definida **antes** do build/dev server subir). Sem ela, o app usa `http://localhost:5180`.

Para desenvolvimento local com outro endereço, copie `.env.example` para `.env` e ajuste o valor:

```bash
cp .env.example .env
```

Via Docker (`docker-compose.yml` na raiz do repositório), a variável é passada como **build arg** do serviço `argos_web`, apontando para a porta que a Api publica no host (`http://localhost:5003`) — não para o nome do serviço na rede interna do Compose, já que as chamadas partem do navegador do usuário, não de dentro do container.

Outros scripts:

```bash
npm run build     # tsc -b && vite build — gera dist/
```

```bash
npm run preview   # serve o build de produção localmente
```

```bash
npm run lint      # oxlint
```

## Como o app funciona

### Login e primeiro uso

Se a Web API exigir autenticação (`AUTH__USUARIO`/`AUTH__SENHA` configurados — não é o padrão, ver
[README do back-end](../argos-back/README.md#segurança)), o app mostra uma tela de login própria
antes de tudo (`src/features/auth/`), com o mesmo cabeçalho da aplicação. Sem autenticação configurada
na API, pula direto para o app.

Se não houver nenhum usuário do Toggl cadastrado na primeira verificação, um diálogo oferece restaurar
os dados a partir de um backup `.zip` (`POST /api/dados/restaurar`) ou seguir e cadastrar tudo
manualmente. Só aparece uma vez por sessão.

### Navegação

Menu lateral com 8 itens em 3 grupos: **Visualizações** (Relatório, Gant), **Sprint** (Acompanhamento — a seção de sprints —,
Planejamento) e **Configuração** (Toggl, Jira, Configurações, Dados), com ícones outlined. Em telas largas ele é permanente e o botão de menu do topo o esconde/exibe (ao
carregar a página ele sempre vem aberto); em telas estreitas o mesmo botão abre uma gaveta temporária. **Toda
navegação recolhe o menu automaticamente** em telas largas, dando a largura toda ao conteúdo. O **Resumo
da aplicação** é a página inicial e o destino do clique na logo (não é item do menu). Ao lado do nome, um ícone
de informação alinhado à base do texto abre o diálogo **Sobre** (`SobreDialog`): a imagem `public/argos.png`,
o conceito do nome (Argos Panoptes e o cão de Odisseu) e o mesmo crédito/versão do rodapé (`CreditoApp`). O Resumo mostra o status de
8 blocos de configuração (Usuários do Toggl; Toggl: Configurações; Jira: Conexão; Jira: Campos;
Jira: Status; Jira: Cores; Jira: Quadro; Jira ↔ Toggl: Mapeamento), cada um com um botão "Configurar" que
leva direto à seção/aba correspondente, e um sinal "+/–" para expandir/colapsar seus detalhes (mais um botão
único "Expandir tudo"/"Colapsar tudo" à direita do título — **todos os blocos começam colapsados**). A conexão mostra o e-mail junto ao
domínio e os quadros de DEV e de Análise; Cores traz uma lista compacta por status/prioridade/coluna de cada quadro (chips de cor, sem rolagem
interna própria — flui com a rolagem da página); Quadro lista as colunas ocultas de cada quadro no Planejamento; Mapeamento traz
siglas com tooltip "Nome Toggl (Jira: Nome Jira)" ou "Nome Jira (somente no Jira)". O resumo é recarregado a cada
troca de seção e após cada salvamento (qualquer aba alterada em Configurações recarrega o resumo inteiro, não só
a aba salva).

**Gate de acesso**: Relatório, Gant, Sprint e Planejamento ficam desabilitados no menu até a configuração obrigatória
estar completa — Agrupamento, Tags detalhadas (exigidas quando o agrupamento não é `descricao`), Tags
DEV/REV/QA do Toggl, Status DEV/REV/QA **e** Concluído/Ignorado do Jira (≥1 em cada), os 7 Campos
do Jira (inclui "Analisado por", "Time" e "Previsão de liberação") e o Mapeamento Jira ↔ Toggl. Enquanto isso, um aviso com atalho leva a Configurações
(com tudo completo, o Resumo não exibe aviso). Cadastro de usuários, conexão com o Jira e os quadros de DEV e de Análise aparecem no Resumo, mas não entram nesse cálculo
(têm validação própria; sem quadro de DEV, qualquer entrada do Planejamento abre um diálogo com atalho para Jira → Conexão).

**Campos obrigatórios**: tudo é obrigatório, **exceto as cores** (cor da tag, do usuário e todas as de Jira:
Cores). Inclui a sigla do usuário do Toggl e, na conexão do Jira, URL, e-mail, token (o token só enquanto não
há um salvo) e os quadros de DEV e de Análise. Essa validação é só do frontend — a API continua aceitando valores vazios.

O rodapé mostra só o crédito do app.

### Seção Toggl

Lista, adiciona, edita e remove **usuários do Toggl** e seus API Tokens (`/api/usuarios-toggl`), com
validação do token contra o Toggl antes de salvar (oferece "salvar mesmo assim" se a validação falhar) e
uma dica de onde gerar o token ([como obter](../argos-back/README.md#como-obter-seu-api-token-do-toggl)).
Cada usuário tem sigla (obrigatória) e cor (opcional) — identificação visual em todo o app, o flag **Selecionado** (decide quem
entra na próxima consulta) e o flag **Administrador**: o token dele é usado nas chamadas sem usuário
específico, como listar as tags reais do workspace — só há um por vez (marcar um novo desmarca o
anterior, garantido pelo backend). É preciso ter pelo menos um Administrador para abrir Configurações.

### Seção Jira

A **conexão**: URL do domínio, e-mail, API Token (nunca reexibido em texto puro — o campo fica em
branco após salvar e o token só é reenviado se o usuário digitar um novo), com link para
[gerar o API Token do Jira](../argos-back/README.md#como-obter-seu-api-token-do-jira) e os **quadros de DEV e de Análise** usados pelo Planejamento (ambos obrigatórios; seletores sobre os quadros Scrum
reais do Jira, `GET /api/jira/quadros`; se a lista falhar, dá para digitar o ID, e na primeira configuração a lista
só aparece com a conexão já salva). **Testar
conexão** (`POST /api/jira/testar-conexao`) valida o que está na tela sem salvar; **Salvar** grava
(`PUT /api/jira/configuracao`, preservando os campos personalizados já salvos).

### Seção Configurações

Só abre com um usuário Administrador do Toggl cadastrado **e** a conexão com o Jira configurada (URL +
e-mail); senão mostra esses pré-requisitos com atalhos para as seções Toggl/Jira. São 6 abas e um único
botão **Salvar**, sempre habilitado: um clique salva **todas as abas alteradas** (não só a visível), e sair da
seção também salva as alteradas (se falhar ou houver aba inválida, permanece nela). As abas ficam montadas
depois da primeira visita, então trocar de aba não perde o rascunho nem salva/bloqueia nada. Antes de gravar,
todas as abas alteradas são validadas: se alguma estiver inválida (campos obrigatórios), nenhuma é salva, o
aviso diz quais e a primeira é aberta; aba não alterada e incompleta não bloqueia. As alteradas são salvas
em sequência, na ordem das abas (uma falha não impede as demais) e o resultado sai num único aviso; sem
alterações, avisa "Nenhuma alteração para salvar.". "Alterada" significa que qualquer edição foi feita (não
compara com o valor original); já na conexão do Jira e nos diálogos de edição de usuário do Toggl e de
sprint, voltar ao valor original desabilita o Salvar:

1. **Toggl** — Agrupamento (`descricao`/`tag`/`ambos`), "Tags para detalhar por descrição", "Tags para
   identificar responsáveis (DEV/REV/QA)" (seleção entre as tags **reais** do workspace, cacheadas) e a
   **cor da tag no Sprint** (opcional; sem cor, o Sprint mostra cinza só na exibição). É a **fonte única**
   de agrupamento/tags para Relatório, Gant e Sprint.
2. **Jira: Campos** — campos customizados do Jira (buscados sob demanda, `POST
   /api/jira/campos`) usados como "Estimativa do desenvolvimento", "Estimativa da revisão", "Estimativa
   dos testes" (o PRE de cada grupo DEV/REV/QA), "Revisado por", "Analisado por", "Time" (identifica a
   equipe de cada cartão; alimenta a coluna e o filtro Time do Planejamento) e "Previsão de liberação"
   (alimenta uma coluna e o filtro Prazo no Sprint e no Planejamento, logo após Descrição, destacada em
   vermelho quando vencida, laranja quando perto do prazo e **verde** quando no prazo — janela em dias
   configurável ao lado do campo, padrão 5) — os sete são obrigatórios.
3. **Jira: Status** — status que identificam cada responsável (DEV/REV/QA) e status "Concluído" e
   "Ignorado" (mutuamente exclusivos) para os totalizadores do Sprint; as cinco listas são obrigatórias.
4. **Jira: Cores** — cor de cada status, prioridade e coluna reais do Jira (colunas separadas por quadro:
   DEV e Análise), usadas nas badges do Sprint e do Planejamento (opcional).
5. **Jira: Quadro** — colunas de cada quadro (DEV e Análise) que não devem aparecer no Planejamento (nem seus
   cartões, nem suas contagens de colaborador); opcional, sem nada selecionado todas aparecem.
6. **Jira ↔ Toggl** — mapeamento de cada usuário real do Jira para um usuário Toggl (ou usuário exclusivo do
   Jira, com sigla/cor próprias); alimenta o fallback DEV/REV do Sprint. Completo quando todo usuário do
   Toggl cadastrado é alvo de ao menos uma entrada e toda entrada é válida (usuário Toggl ainda cadastrado,
   ou exclusivo do Jira com sigla); entradas cujo usuário sumiu do Jira continuam listadas para correção.

### Relatório e Gant

Cada um tem sua tela de **parâmetros** (só o período — agrupamento e tags vêm de Configurações) e o botão
**Consultar**, que abre o mesmo modal do Sprint (`ConsultaDialog` + `SeletorOrigemConsulta`) com
**"Forçar nova consulta em: Nenhum / Toggl"** — só essas duas, pois Relatório e Gant não consultam o Jira
(`toggl` = `forcarConsultaApi: true`). Forçar Toggl pede confirmação (limite de 30 requisições/hora por
usuário); em seguida salva os parâmetros, consulta e abre a visualização, com botão **Voltar** para os
parâmetros. Relatório usa `POST /api/consultas`; Gant, `POST /api/gant/consultas` (parâmetros e cache
**independentes**). Em ambos, o código TEL da descrição é **link para o cartão no Jira** (`LinkJira`,
mesmo componente do Sprint/Planejamento; ver "Link para o Jira" em Decisões técnicas).

- **Relatório** — um acordeão por usuário (sigla, nome, total, indicação de cache) contendo uma tabela
  `[checkbox] · Tag · Descrição · Tempo`, com as linhas por descrição primeiro e depois as por tag;
  registros em andamento ficam num bloco abaixo. A **busca por descrição** (`GET /api/busca`) é inline,
  aberta pelo cabeçalho.
- **Gant** — tabela por usuário → categoria (tag) → descrição, com colunas de **dias úteis** (sábado e
  domingo ocultos) e células coloridas pela sigla do usuário; colapsar/expandir por usuário e busca por
  descrição embutida (`GET /api/gant?termo=`). Categoria, Total e cada data têm largura fixa igual ao maior
  conteúdo da coluna (medido com todos os usuários expandidos, então expandir/colapsar não muda as larguras);
  a Descrição ocupa todo o espaço restante (mínimo de 100 px), trunca com "…" e tem tooltip com o texto
  completo. Com muitas datas, só a tabela rola na horizontal (`useLargurasColunasGant`).

### Sprint

Lista de sprints (CRUD, cada um com nome, horas/dia, **margem (%)** — obrigatória, 0 a 99,9, usada no
cálculo de capacidade —, período e **dias não úteis** — opcional, feriados etc. descontados dos dias úteis; aparece
na listagem só quando preenchido), botão **Planejar** (abre o [Planejamento](#planejamento) fora de um sprint;
Voltar retorna à listagem) e botão **Selecionar**, que abre na hora o
modal **"Consultar sprint"**: só o nome do sprint e o seletor **"Forçar nova consulta em: Nenhum / Toggl /
Jira / Ambos"** (`origem` de `POST /api/sprint/consultas`; o padrão "Nenhum" usa o cache quando existe) —
período, agrupamento, tags e status não aparecem ali. Forçar Toggl pede confirmação (limite de 30
requisições/hora). Concluída a consulta, abre o **Acompanhamento**.

**Fechar/reabrir**: "Fechar" (tela de Acompanhamento) trava a edição do sprint e faz toda consulta usar só
o cache — o modal mostra um aviso no lugar do seletor; "Reabrir" fica na listagem (ícone de cadeado, ao
lado de "Editar", que num sprint fechado abre o formulário somente leitura). A trava é garantida pelo
backend (409); o frontend só espelha.

**Acompanhamento** (`GET /api/sprint`):

- **Botões**: Fechar · **Atualizar** (reabre o mesmo modal "Consultar sprint" e recarrega a tela; desabilitado com
  o sprint fechado) · **Gráficos** · Planejar · Filtros · Voltar.
- **Gráficos** (modal; `@mui/x-charts`, carregado sob demanda — o chunk só é baixado ao abrir), em duas abas. **Pendências e tags**: pizza Pendentes ×
  Concluídas (totalizadores do cabeçalho), pizza de tempo por tag de todos os colaboradores (`tempoPorTag` da API;
  tags detalhadas agregadas; até 7 tags com cor própria e o resto em "Outras"), ambas com valor e % de cada parte na legenda e no tooltip. **Demandas por colaborador**: barras finas empilhadas por colaborador
  (verde concluídas, vermelho pendentes). No celular: tela cheia, legenda das pizzas abaixo do gráfico e siglas no eixo das barras (nome completo no tooltip). Tudo com os dados já carregados, sem nova chamada. Paleta em
  `CORES_GRAFICO` (`theme.ts`), validada para daltonismo.
- **Cabeçalho**: horas/dia, dias úteis (já descontados os não úteis, com tooltip), margem, início/fim, **Capacidade** e os totalizadores **Pendentes**
  e **Concluído** (descrições distintas, nunca linhas de tag, calculadas a partir dos status Concluído/
  Ignorado configurados; no backend, sem essa configuração todas contam como Pendentes, mas o frontend exige
  as duas listas).
- **Colaboradores**: tabela recolhível com nome, sigla, tempo por colaborador, Realizado, **Disponível**
  (tempo por colaborador − Realizado; verde/vermelho/neutro), Pendentes e Concluídas. **Duplo clique** num
  colaborador abre o diálogo de **horas deduzidas** (férias, folga, atestado — inteiro, zero remove; somente
  leitura com o sprint fechado); a capacidade dele e a total já vêm deduzidas da API (tooltip mostra o desconto).
- **Grid de tarefas**: uma linha por descrição/tag, com Prioridade, Status, Código (link para a issue do
  Jira quando encontrada), Descrição e **Previsão** de liberação (com borda à esquerda; data — vermelha se vencida, laranja se
  perto do prazo, **verde** se no prazo — campo do Jira, janela configurável em Jira: Campos), mais os
  grupos **DEV / REV / QA** (PRE, REA, sigla de quem apontou e situação Pendente/Concluído). Colaboradores
  que ocupam categorias diferentes da mesma descrição **mesclam numa linha**; linhas de tag nunca mesclam.
  Ordenada pelo número do código (sem ordenação por coluna). Cores e status final vêm do resumo da
  configuração, já carregado; até a consulta terminar, esqueleto de carregamento.
- **Regras de leitura**: PRE vem do campo de estimativa do Jira de cada grupo e REA do Toggl; valor
  inexistente aparece como "–", PRE/REA aparecem em azul (`accentAzul`) e REA fica vermelho quando passa do PRE. Prioridade/Status vêm do Jira com
  a cor configurada (sem cor, cinza; a Prioridade tem paleta por severidade); "Tag" nas linhas de tag.
  Quando ninguém apontou tempo em DEV/REV, o **fallback** sugere o colaborador mapeado em Jira ↔ Toggl a
  partir do responsável/revisor da issue (sugestão visual, sem tempo realizado). Código e descrição ficam
  em vermelho quando dois colaboradores disputam a mesma posição da mesma descrição.
- **Marcação e detalhe**: o checkbox risca a linha (salvo no `localStorage`, isolado por sprint, apagado só
  numa nova consulta real à API); clique na linha destaca; **duplo clique** abre o detalhe completo da
  linha (grupos como colunas).
- **Filtros**: painel "Filtros" em duas linhas (busca por código/descrição, Prioridade e Status
  / Colaborador, Situação DEV/REV/QA, "Inverter filtros" e "Limpar"; empilhados em telas estreitas), com
  seleção múltipla compacta (o campo nunca cresce: 1 chip + "+N" com tooltip; as opções selecionadas continuam na lista com o checkbox marcado). Tudo sobre os dados já carregados, sem nova
  consulta.
- **Planejar**: atalho para o [Planejamento](#planejamento) (título com o nome do sprint).

### Planejamento

Só **Jira, sem Toggl**: os cartões do **sprint ativo do quadro** Scrum, ou tudo o que está no quadro se for **Kanban** (caso do Análise; a tela mostra "Quadro Kanban") — DEV ou Análise, configurados em Jira → Conexão (a lista traz Scrum e Kanban, com o tipo no rótulo) —, por
coluna do quadro (o Jira não tem um sprint equivalente ao do app, então não há correlação — a tela mostra o nome e o
período do sprint ativo do quadro). O dado é **global** (não depende do sprint do app) e há **três entradas**, todas
com o mesmo modal próprio **"Consultar planejamento"** (Nenhum / Jira; "Jira" pede confirmação; lembra a última
escolha na sessão):

| Entrada | Título | Voltar |
|---|---|---|
| Menu lateral **Planejamento** (mesmo gate de Relatório/Gant/Sprint; o clique abre o modal sobre a tela atual, com o menu aberto — só navega ao consultar, cancelar não muda nada) | Planejamento | — |
| Botão **Planejar** da listagem de sprints | Planejamento | listagem |
| Botão **Planejar** do Acompanhamento | Planejamento — *sprint* | Acompanhamento (continua montado, filtros preservados) |

- **Quadro Dev/Análise**: seletor antes de **Atualizar**. A tela sempre abre no Dev; o Análise carrega em segundo
  plano com a mesma opção do modal, e os dois ficam em memória na sessão — a troca é instantânea e limpa os filtros
  (colunas, times e épicos são de cada quadro). Sem quadro de Análise configurado, a opção fica desabilitada. O
  estado vive no `App` (`usePlanejamento`), compartilhado pelas três entradas.

- **Colaboradores** (card): Nome, Sigla, **uma coluna por coluna do quadro** (sigla — ignora artigos/preposições
  curtos, usa 5 letras da 1ª palavra principal e, havendo mais de uma, 5 letras da última — o meio é descartado;
  separador "-", ou "/" quando o nome original já usa barra; ex.: "Em Desenvolvimento" → "DESEN", "Pausado/Impedido"
  → "PAUSA/IMPED" — tooltip com o nome completo, sem quebra de linha no cabeçalho; em colisão, a 1ª ocorrência mantém
  a sigla e as seguintes ganham 1 letra a mais até ficar única, ex. "A Revisar" → "REVIS", "Revisando" → "REVISA")
  com a contagem de cartões, Total e um rodapé "Cartões na coluna" — os valores das colunas não usam negrito. Um
  cartão conta 1 para quem é Responsável **ou** "Revisado por"; "Analisado por" não conta.
- **Cartões** (grid): Coluna (badge colorida com o **nome completo**, cor configurável em Jira: Cores) · Prioridade ·
  Status · Código (link para a issue) · Descrição (trunca de forma responsiva, com tooltip) · **Previsão** de
  liberação (data — vermelha se vencida, laranja se perto do prazo, **verde** se no prazo — mesma regra do Sprint) ·
  Time (badge com a cor configurada em Configurações → Jira: Cores, campo customizado configurável em Jira: Campos —
  "–" quando vazio) · Épico (badge centralizada com o título e cor configurada por chave do épico em Configurações →
  Jira: Cores; tooltip com chave e título) · Analisado por ("ANP") · grupo
  **Responsável** (PRE + "RES") · grupo **Revisado por** (PRE + "REP") — siglas com tooltip do nome completo; o PRE de
  cada grupo é a mesma estimativa do Jira usada no Sprint (Desenvolvimento para o Responsável, Revisão para o Revisado
  por), em azul, com a mesma formatação dos grupos do Sprint (borda só no início do grupo, células de 2,5rem); cartões de um cache anterior mostram "–" até um "Atualizar". Bordas verticais
  separam as colunas a partir de Previsão; Time/Responsável/Analisado/Revisado têm padding horizontal reduzido
  (0,25rem).
  As pessoas são `BadgeSigla` do usuário mapeado em Jira ↔ Toggl, com o nome completo no tooltip; sem mapeamento,
  mostram as iniciais em cinza e o tooltip avisa. As cores (inclusive as de coluna, do quadro selecionado) vêm do
  resumo da configuração; até a consulta terminar, esqueleto de carregamento.
- **Colunas ocultas**: configuráveis por quadro em Configurações → Jira: Quadro — cartões dessas colunas somem da
  grid, dos totais por coluna e das contagens de colaborador.
- **Filtros**: busca por **código/descrição** (casa código, chave do Jira e descrição; nunca invertida), Coluna,
  Status, Colaborador (casa Responsável **ou** Revisado por), Time, Épico e **Prazo** (No
  prazo/Perto do prazo/Prazo vencido — mesma categorização usada na cor da Previsão), **Inverter filtros** e
  **Limpar** — E entre filtros, OU dentro de cada um (mesma multi-seleção compacta do Sprint). Afetam só a grid (o
  card sempre mostra todos) e resetam ao trocar de quadro.
- **Atualização**: "Nenhum" reaproveita o cache global de cada quadro (e busca no Jira só o quadro sem cache);
  **Atualizar** pede confirmação (`DialogoConfirmacao`) e consulta o Jira ao vivo só para o quadro selecionado. O
  modal do Sprint **não** mexe no Planejamento, e o estado Fechado de um sprint não se aplica a ele (o Atualizar
  funciona em todas as entradas).

### Seção Dados

Baixar (`GET /api/dados/download`) e importar (`POST /api/dados/restaurar`) um `.zip` com os documentos
JSON da aplicação — útil como backup ou para levar os dados a outra instalação. O `.zip` precisa ter os arquivos direto na
raiz (não uma pasta `dados/` por dentro; a API rejeita com 400). Importar sobrescreve só os documentos
presentes no `.zip` (os demais, inclusive os caches de consulta, ficam intactos — deixe os caches de
fora, a menos que queira substituí-los) e recarrega a página ao final. O mesmo diálogo de importação
é oferecido no primeiro uso. Cuidado com o que vai no `.zip`: a API grava qualquer `.json` da raiz, sem
lista de nomes permitidos.

Abaixo dos botões, a seção lista, só para consulta, os 26 documentos `.json` que a aplicação pode criar
(`features/dados/arquivosDados.ts`, lista manual),
agrupados em cadastro, configuração, parâmetros e cache: para cada um, o que guarda, qual ação o gera e
uma marca "Contém token (enc:)" nos que trazem API Token criptografado.

### Responsividade

A interface é revisada para larguras de 360 a 1200 px: a página não rola na horizontal — tabelas e grades
(Gant, Sprint, mapeamento Jira ↔ Toggl) rolam dentro do próprio container, filtros e formulários empilham
em telas estreitas e o diálogo largo de detalhe da linha do Sprint ocupa a tela toda.

## Estrutura

```
src/
 ├─ api/          # client HTTP tipado, um módulo por grupo de endpoints, + tipos.ts (espelha os DTOs da API)
 ├─ features/     # uma pasta por área: auth, resumo, usuarios-toggl, jira, configuracoes (seção
 │                #   Configurações), consulta, relatorio (inclui os parâmetros, como o gant), busca, gant,
 │                #   sprint, planejamento, dados — hook(s) + componente(s)
 ├─ components/   # peças reutilizáveis entre features (MenuLateral, RodapeApp, SobreDialog, BadgeSigla, CabecalhoView,
 │                #   SelectListaCacheada, SelectQuadroJira, FiltroMultiSelecao (filtros multi-seleção do Sprint e do
 │                #   Planejamento), AutocompleteMultiCompacto (base de FiltroMultiSelecao e SelectListaCacheada),
 │                #   MapaCoresLista, ParametrosFormBase, DialogoConfirmacao, ...)
 ├─ hooks/        # base compartilhada de recurso/coleção (useRecurso, useRecursoEditavel, useColecaoCrud),
 │                #   useNotificacao (inclui avisos não bloqueantes), useExpansao, useLarguraColunaRestante (truncamento
 │                #   responsivo da descrição no Sprint e no Planejamento), useLargurasColunasGant (layout de colunas do Gant)
 ├─ utils/        # duracao, datas, rotulos, tipografia, consulta, previsaoLiberacao
 ├─ theme.ts      # tema MUI único (claro); exporta CORES (paleta central) e ALTURA_CONTROLE
 └─ App.tsx       # menu lateral + seções + estado elevado das visões
```

## Decisões técnicas

- **Seções no menu lateral em vez de rotas** — a navegação entre seções é estado do `App`; não há URL por tela.
- **`fetch` nativo com wrapper tipado** (`src/api/http.ts`), tratado por uma classe `ErroApi`. O corpo de erro da API tanto pode ser uma string simples quanto um `ProblemDetails` (`{type,title,status,detail}`, usado por `Results.Problem`, ex.: 502 de `GET /api/usuarios-toggl/tags`); o wrapper tenta `detail`/`title` e cai no `statusText`.
- **Curadoria de exibição replicada aqui**: a API devolve os dados agrupados **crus**; a ordenação "TEL primeiro" das linhas por descrição é calculada no frontend (`features/relatorio/curadoria.ts`), sem alterar os dados da API.
- **Zero `any`** — request/response tipados em `src/api/tipos.ts` (interfaces e uniões; sem `enum` do TypeScript, pois `erasableSyntaxOnly` está ativo).
- **`emAndamento` do relatório em snake_case** (`workspace_id`, `duration`, ...): é o DTO cru do Toggl reaproveitado pela API; todo o resto do contrato é camelCase.
- **Tema único, claro** — sem alternância dia/noite. Título "ARGOS" em Montserrat (Semi-Bold + Light).
- **Altura padronizada dos controles**: `ALTURA_CONTROLE = 40` (exportado de `theme.ts`). `size: 'small'` é o padrão (`defaultProps`) de `TextField`/`Select`/`Autocomplete`/`FormControl` (40px; o `medium` tinha 56px), o `Button` de tamanho padrão tem `minHeight` de 40px (antes 36,5px) e o `ToggleButton` pequeno também — inputs, dropdowns e botões ficam nivelados lado a lado. Ficam de fora de propósito o `Button size="small"` (30,75px, fora de linhas com inputs), o `IconButton` de tabela e o swatch de cor de 24px. Ajustes locais: "Atualizar lista" (`SelectListaCacheada`/`SelectQuadroJira`) é um `IconButton` 40×40 e o `Select` da tabela do Mapeamento Jira ↔ Toggl tem exatos 40px.
- **Multi-seleção compacta** (`AutocompleteMultiCompacto`, usado por `FiltroMultiSelecao` — filtros do Sprint e do Planejamento — e por `SelectListaCacheada` — tags/status das Configurações): altura fixa (40px, `nowrap`, `overflow: hidden`) que **nunca cresce** com muitos itens; mostra 1 chip (com ellipsis) + chip "+N" cujo tooltip lista todos os selecionados (`renderValue` do MUI 9; o `limitTags` nativo só limita sem foco e não tem tooltip). As opções selecionadas **permanecem na lista com o checkbox marcado** (`disableCloseOnSelect`, sem `filterSelectedOptions`), para que qualquer item oculto atrás do "+N" possa ser desmarcado; `SelectListaCacheada` também acrescenta às opções os valores selecionados que sumiram da listagem carregada.
- **Relatório e Gant compartilham a base de parâmetros/consulta** (`ParametrosFormBase`, `useConsultaGenerica`) e a base de hooks (`useRecurso`/`useRecursoEditavel`/`useColecaoCrud`); antes de duplicar um hook ou componente, procurar em `components`/`hooks`/`utils`.
- **Planejamento sobre o Acompanhamento**: enquanto o Planejamento está aberto, o `SprintView` fica montado e oculto (preserva filtros; o custo é alternar levar cerca de 1,5 s em dev, pelo re-render das linhas). A atualização forçada em segundo plano (`atualizacoesPlanejamento.ts`) guarda as promessas em andamento por sprint, para que abrir o Planejamento durante ela espere o dado novo em vez de mostrar o antigo.
- **Carregamento "tudo ou nada"**: nenhuma tela mostra formulário, tabela ou aviso de validação antes de **todas** as suas leituras terminarem — até lá, `EsqueletoCarregando` (padrão `pronto` do Sprint/Planejamento; os hooks base expõem `carregado`, que vira `true` após a 1ª carga, com sucesso ou erro). Durante gravações os controles ficam desabilitados (inclusive as abas de Configurações durante o **Salvar** global) e recargas (busca do Gant/Relatório, Atualizar do Planejamento) trocam o dado antigo pelo esqueleto.
- **Busca por código/descrição** (`utils/buscaTexto.ts`, espelhada em `Argos.Nucleo/Relatorios/NormalizacaoBusca.cs` para `/api/busca` e o `termo` do Gant): casa por **parte** do texto, sem diferenciar maiúsculas e **ignorando espaços e hífens** — "TEL-1535", "tel1535" e "1535" acham "TEL - 1535 - …"; no Sprint também casa o código com zeros ("TEL-0994"). Termo vazio (ou só espaços/hífens) casa tudo.
- **Link para o Jira** (`components/LinkJira.tsx` + `utils/codigoTel.ts`): Sprint/Planejamento usam a URL que vem da API (só issue encontrada); Relatório, busca e Gant montam no front, sem chamada extra, `{urlDominio normalizado}/browse/TEL-<n>` (zeros à esquerda removidos) a partir de `jiraUrlDominio` do resumo — por isso linkam qualquer código TEL, mesmo sem issue no Jira. Só o trecho do código é clicável; sem Jira configurado ou sem código (linhas de tag), texto puro.
- **Login sem popup nativo do navegador**: a API nunca manda `WWW-Authenticate` no 401, então o app trata o 401 e mostra a própria tela de login; a credencial fica em `sessionStorage` (some ao fechar a aba).
- **Download e upload de `dados/` via `fetch` autenticado + blob** (`http.getArquivo`/`http.postArquivo`), nunca `<a href>` direto: um link de navegação não carrega a credencial Basic, e o wrapper padrão só serializa JSON.
- **`localStorage` com um único uso**: o tachado do Sprint (`features/sprint/tachados.ts`, isolado por sprint). O menu lateral não persiste estado — sempre abre expandido. Não usar para mais nada sem necessidade equivalente.
- **"Lembrar login"** (`api/loginLembrado.ts`): marcado no login, a credencial é cifrada com AES-GCM 256 (Web Crypto) e guardada no IndexedDB junto com uma chave gerada no navegador e **não exportável** — o JavaScript nunca acessa os bytes da chave, então o dado não é decifrável fora deste navegador. Validade de 30 dias; apagada ao **Sair**, em qualquer 401 (ex.: senha trocada) e ao entrar sem marcar a opção. Ao abrir o app sem sessão, o login lembrado é tentado antes da tela de login. Só aparece em contexto seguro (`localhost`/https). Proteção contra leitura do armazenamento, não contra script malicioso rodando na própria página (que usaria a chave sem extraí-la).

## Contrato consumido

A lista completa de endpoints, formatos e códigos de erro está no [README do back-end](../argos-back/README.md#endpoints) — este projeto não duplica essa documentação, só a consome.