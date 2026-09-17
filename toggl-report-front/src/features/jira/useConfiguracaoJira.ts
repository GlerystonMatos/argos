import { useCallback } from 'react';
import { useRecursoEditavel } from '../../hooks/useRecursoEditavel';

import {
    listarCamposJira,
    testarConexaoJira,
    obterConfiguracaoJira,
    salvarConfiguracaoJira,
} from '../../api/jiraApi';

import type {
    CampoJira,
    ConfiguracaoJira,
    ObterCamposJiraRequest,
    TestarConexaoJiraRequest,
    TestarConexaoJiraResponse,
    SalvarConfiguracaoJiraRequest,
} from '../../api/tipos';

interface ResultadoUseConfiguracaoJira {
    configuracao: ConfiguracaoJira | null;
    carregando: boolean;
    salvando: boolean;
    carregar: () => Promise<ConfiguracaoJira>;
    salvar: (dados: SalvarConfiguracaoJiraRequest) => Promise<ConfiguracaoJira>;
    testarConexao: (dados: TestarConexaoJiraRequest) => Promise<TestarConexaoJiraResponse>;
    listarCampos: (dados?: ObterCamposJiraRequest) => Promise<CampoJira[]>;
}

export function useConfiguracaoJira(): ResultadoUseConfiguracaoJira {
    const { dados, carregando, salvando, carregar, salvar } = useRecursoEditavel<ConfiguracaoJira, SalvarConfiguracaoJiraRequest>(
        obterConfiguracaoJira,
        salvarConfiguracaoJira,
    );

    const testarConexao = useCallback(
        (dadosRequest: TestarConexaoJiraRequest) => testarConexaoJira(dadosRequest),
        [],
    );

    const listarCampos = useCallback(
        (dadosRequest?: ObterCamposJiraRequest) => listarCamposJira(dadosRequest),
        [],
    );

    return { configuracao: dados, carregando, salvando, carregar, salvar, testarConexao, listarCampos };
}