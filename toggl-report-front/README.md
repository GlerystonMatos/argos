# toggl-report-front

[← voltar ao README principal](../README.md)

Frontend em **React 19 + TypeScript + MUI** (via Vite) que consome a [Web API do `toggl-report-back`](../toggl-report-back/README.md#web-api-togglreportapi), com o fluxo completo em uma interface gráfica local: cadastro de usuários e configurações → consulta → relatório com busca por descrição, mais uma visualização em **Gráfico de Gant** e outra de **Sprint** (gestão de sprints + acompanhamento de capacidade e tarefas), cada uma com parâmetros e cache próprios.

## Requisitos

- [Node.js](https://nodejs.org/) 20+ e `npm`
- A [Web API](../toggl-report-back/README.md#web-api-togglreportapi) rodando e alcançável no endereço configurado (padrão `http://localhost:5180`; sem ela, as chamadas falham com um aviso na tela — o app não trava)

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

Via Docker (`docker-compose.yml` na raiz do repositório), a variável é passada como **build arg** do serviço `toggl_report_web`, apontando para a porta que a Api publica no host (`http://localhost:5003`) — não para o nome do serviço na rede interna do Compose, já que as chamadas partem do navegador do usuário, não de dentro do container.

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
[README do back-end](../toggl-report-back/README.md#segurança)), o app mostra uma tela de login própria
antes de tudo (`src/features/auth/`), com o mesmo cabeçalho da aplicação. Sem autenticação configurada
na API, pula direto para o app.

Se não houver nenhum usuário do Toggl cadastrado na primeira verificação, um diálogo oferece restaurar
a pasta `dados/` a partir de um backup `.zip` (`POST /api/dados/restaurar`) ou seguir e cadastrar tudo
manualmente. Só aparece uma vez por sessão.

### Navegação

Menu lateral com 7 seções, nesta ordem: **Toggl**, **Jira**, **Configurações**, **Relatório**, **Gant**,
**Sprint** e **Dados**. Em telas largas ele é permanente e o botão de menu do topo o esconde/exibe (a
escolha fica salva no navegador); em telas estreitas o mesmo botão abre uma gaveta temporária. O **Resumo
da aplicação** é a página inicial e o destino do clique na logo (não é item do menu): mostra o status de
7 blocos de configuração (Usuários do Toggl; Toggl: Configurações; Jira: Conexão; Jira: Campos
personalizados; Jira: Status; Jira: Cores; Jira ↔ Toggl: Mapeamento), cada um com um botão "Configurar" que
leva direto à seção/aba correspondente. O resumo é recarregado a cada troca de seção e após cada edição.

**Gate de acesso**: Relatório, Gant e Sprint ficam desabilitados no menu até a configuração obrigatória
estar completa — Agrupamento, Tags detalhadas (exigidas quando o agrupamento não é `descricao`), Tags
DEV/REV/QA do Toggl e Status DEV/REV/QA do Jira. Enquanto isso, um aviso com atalho leva a Configurações.
Cadastro de usuários, conexão com o Jira e os blocos opcionais (campos, cores, mapeamento) aparecem no
Resumo, mas não entram nesse cálculo.

O rodapé mostra só o crédito do app.

### Seção Toggl

Lista, adiciona, edita e remove **usuários do Toggl** e seus API Tokens (`/api/usuarios-toggl`), com
validação do token contra o Toggl antes de salvar (oferece "salvar mesmo assim" se a validação falhar) e
uma dica de onde gerar o token ([como obter](../toggl-report-back/README.md#como-obter-seu-api-token-do-toggl)).
Cada usuário tem sigla e cor (identificação visual em todo o app), o flag **Selecionado** (decide quem
entra na próxima consulta) e o flag **Administrador**: o token dele é usado nas chamadas sem usuário
específico, como listar as tags reais do workspace — só há um por vez (marcar um novo desmarca o
anterior, garantido pelo backend). É preciso ter pelo menos um Administrador para abrir Configurações.

### Seção Jira

Só a **conexão**: URL do domínio, e-mail e API Token (nunca reexibido em texto puro — o campo fica em
branco após salvar e o token só é reenviado se o usuário digitar um novo), com link para
[gerar o API Token do Jira](../toggl-report-back/README.md#como-obter-seu-api-token-do-jira). **Testar
conexão** (`POST /api/jira/testar-conexao`) valida o que está na tela sem salvar; **Salvar** grava
(`PUT /api/jira/configuracao`).

### Seção Configurações

Só abre com um usuário Administrador do Toggl cadastrado **e** a conexão com o Jira configurada (URL +
e-mail); senão mostra esses pré-requisitos com atalhos para as seções Toggl/Jira. São 5 abas, com botão
**Salvar** por aba — o app também salva a aba alterada ao trocar de aba ou sair da seção (se o
salvamento falhar, permanece nela):

1. **Toggl** — Agrupamento (`descricao`/`tag`/`ambos`), "Tags para detalhar por descrição", "Tags para
   identificar responsáveis (DEV/REV/QA)" (seleção entre as tags **reais** do workspace, cacheadas) e a
   **cor da tag no Sprint** (opcional; sem cor, o Sprint mostra cinza só na exibição). É a **fonte única**
   de agrupamento/tags para Relatório, Gant e Sprint.
2. **Jira: Campos personalizados** — campos customizados do Jira (buscados sob demanda, `POST
   /api/jira/campos`) usados como "Estimativa do desenvolvimento", "Estimativa da revisão", "Estimativa
   dos testes" (o PRE de cada grupo DEV/REV/QA; cada um é independente e pode ficar em branco) e
   "Revisado por".
3. **Jira: Status** — status que identificam cada responsável (DEV/REV/QA) e status "Concluído" e
   "Ignorado" (mutuamente exclusivos) para os totalizadores do Sprint.
4. **Jira: Cores** — cor de cada status e de cada prioridade reais do Jira, usadas nas badges do Sprint.
5. **Jira ↔ Toggl** — mapeamento opcional de cada usuário real do Jira para um usuário Toggl (ou usuário
   exclusivo do Jira, com sigla/cor próprias); alimenta o fallback DEV/REV do Sprint.

### Relatório e Gant

Cada um tem sua tela de **parâmetros** (só o período — agrupamento e tags vêm de Configurações) e a opção
**"Forçar nova consulta à API"** (ignora o cache local; não é persistida). O botão único **Consultar**
salva os parâmetros, pede confirmação se a consulta for forçada (consome o limite de 30 requisições/hora
por usuário), consulta e abre a visualização, com botão **Voltar** para os parâmetros. Relatório usa
`POST /api/consultas`; Gant, `POST /api/gant/consultas` (parâmetros e cache **independentes**).

- **Relatório** — um acordeão por usuário (sigla, nome, total, indicação de cache) contendo uma tabela
  `[checkbox] · Tag · Descrição · Tempo`, com as linhas por descrição primeiro e depois as por tag;
  registros em andamento ficam num bloco abaixo. A **busca por descrição** (`GET /api/busca`) é inline,
  aberta pelo cabeçalho.
- **Gant** — tabela por usuário → categoria (tag) → descrição, com colunas de **dias úteis** (sábado e
  domingo ocultos) e células coloridas pela sigla do usuário; colapsar/expandir por usuário e busca por
  descrição embutida (`GET /api/gant?termo=`).

### Sprint

Lista de sprints (CRUD, cada um com nome, horas/dia e período) e botão **Selecionar**, que abre na hora o
modal **"Consultar sprint"**: só o nome do sprint e o seletor **"Forçar nova consulta em: Nenhum / Toggl /
Jira / Ambos"** (`origem` de `POST /api/sprint/consultas`; o padrão "Nenhum" usa o cache quando existe) —
período, agrupamento, tags e status não aparecem ali. Forçar Toggl pede confirmação (limite de 30
requisições/hora). Concluída a consulta, abre o **Acompanhamento**.

**Fechar/reabrir**: "Fechar" (tela de Acompanhamento) trava a edição do sprint e faz toda consulta usar só
o cache — o modal mostra um aviso no lugar do seletor; "Reabrir" fica na listagem (ícone de cadeado, ao
lado de "Editar", que num sprint fechado abre o formulário somente leitura). A trava é garantida pelo
backend (409); o frontend só espelha.

**Acompanhamento** (`GET /api/sprint`):

- **Cabeçalho**: horas/dia, dias úteis, margem, início/fim, **Capacidade** e os totalizadores **Pendentes**
  e **Concluído** (descrições distintas, nunca linhas de tag, calculadas a partir dos status Concluído/
  Ignorado configurados — sem essa configuração, todas contam como Pendentes).
- **Colaboradores**: tabela recolhível com nome, sigla, tempo por colaborador, Realizado, **Disponível**
  (tempo por colaborador − Realizado; verde/vermelho/neutro), Pendentes e Concluídas.
- **Grid de tarefas**: uma linha por descrição/tag, com Prioridade, Status, Código (link para a issue do
  Jira quando encontrada) e Descrição, mais os grupos **DEV / REV / QA** (PRE, REA, sigla de quem apontou
  e situação Pendente/Concluído). Colaboradores que ocupam categorias diferentes da mesma descrição
  **mesclam numa linha**; linhas de tag nunca mesclam. Ordenada pelo número do código.
- **Regras de leitura**: PRE vem do campo de estimativa do Jira de cada grupo e REA do Toggl; valor
  inexistente aparece como "–", e REA fica vermelho quando passa do PRE. Prioridade/Status vêm do Jira com
  a cor configurada (sem cor, cinza; a Prioridade tem paleta por severidade); "Tag" nas linhas de tag.
  Quando ninguém apontou tempo em DEV/REV, o **fallback** sugere o colaborador mapeado em Jira ↔ Toggl a
  partir do responsável/revisor da issue (sugestão visual, sem tempo realizado). Código e descrição ficam
  em vermelho quando dois colaboradores disputam a mesma posição da mesma descrição.
- **Marcação e detalhe**: o checkbox risca a linha (salvo no `localStorage`, isolado por sprint, apagado só
  numa nova consulta real à API); clique na linha destaca; **duplo clique** abre o detalhe completo da
  linha (grupos como colunas).
- **Filtros e ordenação**: painel "Filtros" em duas linhas (busca por código/descrição, Prioridade e Status
  / Colaborador, Situação DEV/REV/QA, "Inverter filtros" e "Limpar"; empilhados em telas estreitas), com
  seleção múltipla; ordenação clicável em Prioridade e Status. Tudo sobre os dados já carregados, sem nova
  consulta.
- **Informações**: modal com abas que explicam capacidade, categorias, ciclo de vida e como ler a tela.

### Seção Dados

Baixar (`GET /api/dados/download`) e importar (`POST /api/dados/restaurar`) um `.zip` com a pasta `dados/`
— útil como backup ou para levar os dados a outra instalação. O `.zip` precisa ter os arquivos direto na
raiz (não uma pasta `dados/` por dentro; a API rejeita com 400). Importar sobrescreve só os arquivos
presentes no `.zip` (os demais, inclusive os caches de consulta, ficam intactos — deixe os caches de
fora, a menos que queira substituí-los) e recarrega a página ao final. O mesmo diálogo de importação
é oferecido no primeiro uso. Cuidado com o que vai no `.zip`: a API extrai qualquer arquivo da raiz, sem
lista de nomes permitidos.

Abaixo dos botões, a seção lista, só para consulta, os 19 arquivos `.ini` que a aplicação pode criar,
agrupados em cadastro, configuração, parâmetros e cache: para cada um, o que guarda, qual ação o gera e
uma marca "Contém token (enc:)" nos que trazem API Token criptografado.

### Responsividade

A interface é revisada para larguras de 360 a 1200 px: a página não rola na horizontal — tabelas e grades
(Gant, Sprint, mapeamento Jira ↔ Toggl) rolam dentro do próprio container, filtros e formulários empilham
em telas estreitas e os diálogos largos (Informações e detalhe da linha do Sprint) ocupam a tela toda.

## Estrutura

```
src/
 ├─ api/          # client HTTP tipado, um módulo por grupo de endpoints, + tipos.ts (espelha os DTOs da API)
 ├─ features/     # uma pasta por área: auth, resumo, usuarios-toggl, jira, configuracoes (seção
 │                #   Configurações), consulta, relatorio (inclui os parâmetros, como o gant), busca, gant,
 │                #   sprint, dados — hook(s) + componente(s)
 ├─ components/   # peças reutilizáveis entre features (MenuLateral, RodapeApp, BadgeSigla, CabecalhoView,
 │                #   SelectListaCacheada, MapaCoresLista, ParametrosFormBase, DialogoConfirmacao, ...)
 ├─ hooks/        # base compartilhada de recurso/coleção (useRecurso, useRecursoEditavel, useColecaoCrud),
 │                #   useNotificacao, useExpansao
 ├─ utils/        # duracao, datas, rotulos, texto, tipografia, consulta, preferenciasMenu
 ├─ theme.ts      # tema MUI único (claro); exporta CORES, a paleta central
 └─ App.tsx       # menu lateral + seções + estado elevado das visões
```

## Decisões técnicas

- **Seções no menu lateral em vez de rotas** — a navegação entre seções é estado do `App`; não há URL por tela.
- **`fetch` nativo com wrapper tipado** (`src/api/http.ts`), tratado por uma classe `ErroApi`. O corpo de erro da API tanto pode ser uma string simples quanto um `ProblemDetails` (`{type,title,status,detail}`, usado por `Results.Problem`, ex.: 502 de `GET /api/usuarios-toggl/tags`); o wrapper tenta `detail`/`title` e cai no `statusText`.
- **Curadoria de exibição replicada aqui**: a API devolve os dados agrupados **crus**; a ordenação "TEL primeiro" das linhas por descrição é calculada no frontend (`features/relatorio/curadoria.ts`), sem alterar os dados da API.
- **Zero `any`** — request/response tipados em `src/api/tipos.ts` (interfaces e uniões; sem `enum` do TypeScript, pois `erasableSyntaxOnly` está ativo).
- **`emAndamento` do relatório em snake_case** (`workspace_id`, `duration`, ...): é o DTO cru do Toggl reaproveitado pela API; todo o resto do contrato é camelCase.
- **Tema único, claro** — sem alternância dia/noite. Título "TOGGL REPORT" em Montserrat (Semi-Bold + Light).
- **Relatório e Gant compartilham a base de parâmetros/consulta** (`ParametrosFormBase`, `useConsultaGenerica`) e a base de hooks (`useRecurso`/`useRecursoEditavel`/`useColecaoCrud`); antes de duplicar um hook ou componente, procurar em `components`/`hooks`/`utils`.
- **Login sem popup nativo do navegador**: a API nunca manda `WWW-Authenticate` no 401, então o app trata o 401 e mostra a própria tela de login; a credencial fica em `sessionStorage` (some ao fechar a aba).
- **Download e upload de `dados/` via `fetch` autenticado + blob** (`http.getArquivo`/`http.postArquivo`), nunca `<a href>` direto: um link de navegação não carrega a credencial Basic, e o wrapper padrão só serializa JSON.
- **`localStorage` com dois usos**: o tachado do Sprint (`features/sprint/tachados.ts`, isolado por sprint) e a preferência de menu visível (`utils/preferenciasMenu.ts`, chave `toggl-report:menu-visivel`). Não usar para mais nada sem necessidade equivalente.

## Contrato consumido

A lista completa de endpoints, formatos e códigos de erro está no [README do back-end](../toggl-report-back/README.md#endpoints) — este projeto não duplica essa documentação, só a consome.