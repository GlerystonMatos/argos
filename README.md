# argos  <img alt="argos" height="20" src="https://github.com/GlerystonMatos/argos/blob/main/argos.png">

Conjunto de aplicações que geram relatórios de tempo trabalhado a partir da **API v9 do Toggl Track**, agrupando por descrição e/ou tag, por usuário, em um período informado — incluindo uma visualização em **Gráfico de Gant** por usuário/dia e uma visão de **Sprint** (capacidade por colaborador + acompanhamento de tarefas, com um **Planejamento** dos cartões do quadro de DEV do Jira), ambas só na versão web.

O nome **Argos** une duas figuras da mitologia grega: **Argos Panoptes**, o gigante de cem olhos que tudo vê (visão geral), e **Argos, o cão de Odisseu**, que esperou vinte anos pelo dono (lealdade absoluta) — o diálogo "Sobre" do frontend conta a história. A grafia é **única** em todas as camadas: marca "Argos", pastas `argos-*`, solução `Argos.slnx`, namespaces `Argos.*`, pacote npm `argos-front` e recursos de infra `argos-*` (nunca "Argus"). O projeto se chamava `toggl-report`; o ambiente GCP antigo é destruído, não migrado — ver [Destruir o ambiente antigo](./argos-infra/README.md#destruir-o-ambiente-antigo-toggl-report--argos).

Este repositório reúne três projetos independentes:

## [`argos-back/`](./argos-back/README.md) — C# / .NET 10

Web API local (autenticação HTTP Basic opcional, documentada via Swagger) que expõe as funcionalidades da aplicação, além de uma biblioteca de núcleo compartilhada. Consulta o Toggl Track, faz cache do retorno em INI (`dados/`), agrupa por descrição/tag e permite busca por parte da descrição.

➡️ **[Documentação completa do back-end](./argos-back/README.md)**

## [`argos-front/`](./argos-front/README.md) — React + TypeScript + MUI

Frontend web que consome a Web API acima, com o fluxo completo (usuários e configurações → consulta → relatório → busca) em uma interface gráfica local, navegada por um menu lateral (Toggl, Jira, Configurações, Relatório, Gant, Sprint e Dados).

➡️ **[Documentação completa do frontend](./argos-front/README.md)**

## [`argos-infra/`](./argos-infra/README.md) — Terraform + GCP

Infraestrutura de deploy em produção no Google Cloud (Cloud Run + Cloud Build + Artifact Registry), com premissa de custo zero — scale-to-zero, sem banco de dados, e um killswitch de billing isolado num projeto GCP separado para proteger contra estouro de orçamento.

➡️ **[Documentação completa da infra](./argos-infra/README.md)**

## Como rodar os dois juntos

```bash
# 1. Web API (porta fixa 5180)
dotnet run --project argos-back/Argos.Api
```

```bash
# 2. Frontend (em outro terminal)
cd argos-front && npm install && npm run dev
```

## Como rodar com Docker

```bash
cp .env.example .env
```
Preencha `KESTREL_CERT_PASSWORD` com a senha real do certificado em
`./certificado/certificado.pfx` — o `docker-compose.yml` lê essa senha do
`.env` (gitignored), nunca em texto puro no arquivo versionado.

```bash
docker-compose up -d --build
```

Sobe a Api em `http://localhost:5003` e o frontend em `http://localhost:3002`.
O endereço da Api que o frontend consome é fixado **no build da imagem**
(`VITE_API_URL`, ver [README do frontend](./argos-front/README.md#configurando-o-endereço-do-backend)) —
para apontar para outro endereço, ajuste `args.VITE_API_URL` do serviço
`argos_web` em `docker-compose.yml` e rode `docker-compose up -d --build`
de novo.

A pasta `dados/` (bind mount do host) é ajustada automaticamente para o
usuário não-root da imagem no início do container (`entrypoint.sh` da Api) —
sem isso, gravações nela (ex.: restaurar backup pelo frontend) falhavam com
`UnauthorizedAccessException`, já que o Docker cria o ponto de montagem como
`root` por padrão. Ver [README do back-end](./argos-back/README.md#docker).

## Segurança

Os arquivos com token ou cache (`TogglUsuarios.ini`, `JiraConexao.ini`, `RelatorioData.ini`, `GantData.ini`, `SprintData_<sprint>.ini` — gerados na pasta `dados/` de cada executável) guardam API Tokens **criptografados** (chave em `CHAVE_CRIPTOGRAFIA`; sem ela, os tokens gravados não são decifrados e o cache deixa de bater) e nunca são versionados (`.gitignore`); os demais `.ini` de configuração, parâmetros e cache de listagens (`TogglConfiguracao.ini`, `TogglTags.ini`, `Jira*.ini`, `Sprints.ini`, `RelatorioParametros.ini`, `GantParametros.ini`, ...) ficam ao lado, sem token. A Web API não exige autenticação por padrão (uso local) — pode ser ligada (`AUTH__USUARIO`/`AUTH__SENHA`) para uso exposto, com tela de login própria no frontend em vez do popup nativo do navegador (ver `argos-back/README.md#segurança`, que também descreve a pasta `dados/`).

Revisado (2026-09-06) o conteúdo rastreado pelo Git em busca de segredos antes deste repositório se tornar público: nenhuma chave de API, token do GitHub/GCP, credencial de service account ou dado real de usuário foi encontrado versionado. Dois pontos corrigidos: a senha do certificado HTTPS do `docker-compose.yml` estava em texto puro — movida para `.env` (gitignored, com `.env.example` como template); e os IDs reais dos dois projetos GCP foram substituídos por placeholders (`SEU_PROJETO_APP_ID`/`SEU_PROJETO_FINOPS_ID`) em todo `argos-infra/` e nos READMEs — nenhum identificador real de projeto GCP permanece versionado.

## Licença

`argos` é um projeto livre e de código aberto licenciado sob a [MIT License](./LICENSE).