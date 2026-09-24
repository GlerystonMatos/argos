export type TipoArquivoDados = 'cadastro' | 'configuracao' | 'parametros' | 'cache';

export interface ArquivoDados {
    nome: string;
    tipo: TipoArquivoDados;
    conteudo: string;
    geradoPor: string;
    contemSegredo: boolean;
}

export interface GrupoTipoArquivoDados {
    tipo: TipoArquivoDados;
    titulo: string;
    explicacao: string;
}

export const GRUPOS_TIPO_ARQUIVO_DADOS: readonly GrupoTipoArquivoDados[] = [
    {
        tipo: 'cadastro',
        titulo: 'Cadastro',
        explicacao: 'Registros mantidos por você: usuários do Toggl e sprints.',
    },
    {
        tipo: 'configuracao',
        titulo: 'Configuração',
        explicacao: 'Ajustes do Toggl e do Jira feitos em Configurações.',
    },
    {
        tipo: 'parametros',
        titulo: 'Parâmetros',
        explicacao: 'Último período consultado em cada visualização.',
    },
    {
        tipo: 'cache',
        titulo: 'Cache',
        explicacao: 'Retorno das últimas consultas e listas reais do Toggl/Jira; podem ser apagados sem perder cadastro.',
    },
];

export const ARQUIVOS_DADOS: readonly ArquivoDados[] = [
    {
        nome: 'TogglUsuarios.json',
        tipo: 'cadastro',
        conteudo: 'Usuários do Toggl: nome, API Token (criptografado), sigla, cor, seleção para consulta e administrador.',
        geradoPor: 'Toggl: criar, editar, remover ou alternar a seleção de um usuário.',
        contemSegredo: true,
    },
    {
        nome: 'Sprints.json',
        tipo: 'cadastro',
        conteudo: 'Sprints cadastrados: nome, horas por dia, datas de início e fim e se está fechado.',
        geradoPor: 'Sprint: adicionar, editar, remover, fechar ou reabrir um sprint.',
        contemSegredo: false,
    },
    {
        nome: 'TogglConfiguracao.json',
        tipo: 'configuracao',
        conteudo: 'Agrupamento (descrição, tag ou ambos) e cor da tag do Sprint.',
        geradoPor: 'Configurações → Toggl: salvar.',
        contemSegredo: false,
    },
    {
        nome: 'TogglTags.json',
        tipo: 'configuracao',
        conteudo: 'Tags do Toggl que identificam DEV/REV/QA e tags detalhadas por descrição.',
        geradoPor: 'Configurações → Toggl: salvar.',
        contemSegredo: false,
    },
    {
        nome: 'JiraConexao.json',
        tipo: 'configuracao',
        conteudo: 'Conexão com o Jira: URL do domínio, e-mail, API Token (criptografado) e quadro de DEV.',
        geradoPor: 'Jira: salvar a conexão.',
        contemSegredo: true,
    },
    {
        nome: 'JiraCampos.json',
        tipo: 'configuracao',
        conteudo: 'Campos do Jira: estimativas de Desenvolvimento, Revisão e Testes, "Revisado por" e "Analisado por".',
        geradoPor: 'Configurações → Jira: Campos: salvar.',
        contemSegredo: false,
    },
    {
        nome: 'JiraStatus.json',
        tipo: 'configuracao',
        conteudo: 'Status do Jira: responsáveis DEV/REV/QA, Concluído/Ignorado e a cor de cada status.',
        geradoPor: 'Configurações → Jira: Status e Jira: Cores: salvar.',
        contemSegredo: false,
    },
    {
        nome: 'JiraPrioridades.json',
        tipo: 'configuracao',
        conteudo: 'Cor de cada prioridade do Jira usada nas badges do Sprint.',
        geradoPor: 'Configurações → Jira: Cores: salvar.',
        contemSegredo: false,
    },
    {
        nome: 'JiraColunas.json',
        tipo: 'configuracao',
        conteudo: 'Cor de cada coluna do quadro do Jira usada na badge de Coluna do Planejamento.',
        geradoPor: 'Configurações → Jira: Cores: salvar.',
        contemSegredo: false,
    },
    {
        nome: 'JiraTimes.json',
        tipo: 'configuracao',
        conteudo: 'Cor de cada time (campo Time do Jira) usada na badge de Time do Planejamento.',
        geradoPor: 'Configurações → Jira: Cores: salvar.',
        contemSegredo: false,
    },
    {
        nome: 'JiraEpicos.json',
        tipo: 'configuracao',
        conteudo: 'Cor de cada épico (pela chave, ex.: TEL-123) usada na badge de Épico do Planejamento.',
        geradoPor: 'Configurações → Jira: Cores: salvar.',
        contemSegredo: false,
    },
    {
        nome: 'JiraQuadro.json',
        tipo: 'configuracao',
        conteudo: 'Colunas do quadro do Jira que não devem aparecer no Planejamento.',
        geradoPor: 'Configurações → Jira: Quadro: salvar.',
        contemSegredo: false,
    },
    {
        nome: 'JiraTogglMapeamento.json',
        tipo: 'configuracao',
        conteudo: 'Mapeamento entre usuários do Jira e do Toggl (com sigla e cor), usado no preenchimento sugerido de DEV/REV.',
        geradoPor: 'Configurações → Jira ↔ Toggl: salvar.',
        contemSegredo: false,
    },
    {
        nome: 'RelatorioParametros.json',
        tipo: 'parametros',
        conteudo: 'Último período (data inicial e final) usado no Relatório.',
        geradoPor: 'Relatório: consultar.',
        contemSegredo: false,
    },
    {
        nome: 'GantParametros.json',
        tipo: 'parametros',
        conteudo: 'Último período (data inicial e final) usado no Gant.',
        geradoPor: 'Gant: consultar.',
        contemSegredo: false,
    },
    {
        nome: 'RelatorioData.json',
        tipo: 'cache',
        conteudo: 'Retorno cru da última consulta do Relatório, por usuário do Toggl (token criptografado).',
        geradoPor: 'Relatório: consulta real ao Toggl.',
        contemSegredo: true,
    },
    {
        nome: 'GantData.json',
        tipo: 'cache',
        conteudo: 'Retorno cru da última consulta do Gant, por usuário do Toggl (token criptografado).',
        geradoPor: 'Gant: consulta real ao Toggl.',
        contemSegredo: true,
    },
    {
        nome: 'SprintData_<chaveSprint>.json',
        tipo: 'cache',
        conteudo: 'Retorno cru do Toggl para um sprint, por usuário (token criptografado). Um arquivo por sprint.',
        geradoPor: 'Sprint: consulta real ao Toggl do sprint escolhido.',
        contemSegredo: true,
    },
    {
        nome: 'JiraSprintData_<chaveSprint>.json',
        tipo: 'cache',
        conteudo: 'Issues do Jira (prioridade, status e estimativas) dos códigos TEL de um sprint. Um arquivo por sprint.',
        geradoPor: 'Sprint: consulta que atualiza o Jira do sprint escolhido.',
        contemSegredo: false,
    },
    {
        nome: 'JiraPlanejamentoData_<chaveSprint>.json',
        tipo: 'cache',
        conteudo: 'Cartões do sprint ativo do quadro de DEV do Jira (colunas, status e pessoas) de um sprint. Um arquivo por sprint.',
        geradoPor: 'Sprint: consulta que atualiza o Jira ou o botão Atualizar do Planejamento.',
        contemSegredo: false,
    },
    {
        nome: 'TogglTagsCache.json',
        tipo: 'cache',
        conteudo: 'Lista de tags reais do workspace do Toggl e data da última atualização.',
        geradoPor: 'Configurações → Toggl: ao listar ou atualizar as tags.',
        contemSegredo: false,
    },
    {
        nome: 'JiraStatusCache.json',
        tipo: 'cache',
        conteudo: 'Nomes reais dos status do Jira e data da última atualização.',
        geradoPor: 'Configurações → Jira: Status ou Jira: Cores: ao listar ou atualizar os status.',
        contemSegredo: false,
    },
    {
        nome: 'JiraPrioridadesCache.json',
        tipo: 'cache',
        conteudo: 'Nomes reais das prioridades do Jira e data da última atualização.',
        geradoPor: 'Configurações → Jira: Cores: ao listar ou atualizar as prioridades.',
        contemSegredo: false,
    },
    {
        nome: 'JiraColunasCache.json',
        tipo: 'cache',
        conteudo: 'Nomes reais das colunas do quadro de DEV do Jira e data da última atualização.',
        geradoPor: 'Configurações → Jira: Cores ou Jira: Quadro: ao listar ou atualizar as colunas.',
        contemSegredo: false,
    },
    {
        nome: 'JiraUsuariosCache.json',
        tipo: 'cache',
        conteudo: 'Nomes reais dos usuários do Jira e data da última atualização.',
        geradoPor: 'Configurações → Jira ↔ Toggl: ao listar ou atualizar os usuários.',
        contemSegredo: false,
    },
    {
        nome: 'JiraQuadrosCache.json',
        tipo: 'cache',
        conteudo: 'Quadros Scrum reais do Jira (id, nome e projeto) e data da última atualização.',
        geradoPor: 'Jira: ao listar ou atualizar os quadros na conexão.',
        contemSegredo: false,
    },
];