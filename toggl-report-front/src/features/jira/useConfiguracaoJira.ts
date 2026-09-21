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

export type AlteracoesConfiguracaoJira = Partial<SalvarConfiguracaoJiraRequest>;

interface ResultadoUseConfiguracaoJira {
    configuracao: ConfiguracaoJira | null;
    carregando: boolean;
    salvando: boolean;
    carregar: () => Promise<ConfiguracaoJira>;
    salvarParcial: (alteracoes: AlteracoesConfiguracaoJira) => Promise<ConfiguracaoJira>;
    testarConexao: (dados: TestarConexaoJiraRequest) => Promise<TestarConexaoJiraResponse>;
    listarCampos: (dados?: ObterCamposJiraRequest) => Promise<CampoJira[]>;
}

function requestDaConfiguracaoSalva(atual: ConfiguracaoJira): SalvarConfiguracaoJiraRequest {
    return {
        urlDominio: atual.urlDominio,
        email: atual.email,
        apiToken: null,
        quadroId: atual.quadroId,
        quadroNome: atual.quadroNome,
        campoEstimativaDesenvolvimentoId: atual.campoEstimativaDesenvolvimentoId,
        campoEstimativaDesenvolvimentoNome: atual.campoEstimativaDesenvolvimentoNome,
        campoRevisadoPorId: atual.campoRevisadoPorId,
        campoRevisadoPorNome: atual.campoRevisadoPorNome,
        campoAnalisadoPorId: atual.campoAnalisadoPorId,
        campoAnalisadoPorNome: atual.campoAnalisadoPorNome,
        campoEstimativaRevisaoId: atual.campoEstimativaRevisaoId,
        campoEstimativaRevisaoNome: atual.campoEstimativaRevisaoNome,
        campoEstimativaTestesId: atual.campoEstimativaTestesId,
        campoEstimativaTestesNome: atual.campoEstimativaTestesNome,
    };
}

export function useConfiguracaoJira(): ResultadoUseConfiguracaoJira {
    const { dados, carregando, salvando, carregar, salvar } = useRecursoEditavel<ConfiguracaoJira, SalvarConfiguracaoJiraRequest>(
        obterConfiguracaoJira,
        salvarConfiguracaoJira,
    );

    const salvarParcial = useCallback(
        async (alteracoes: AlteracoesConfiguracaoJira): Promise<ConfiguracaoJira> => {
            const atual = await obterConfiguracaoJira();
            return salvar({ ...requestDaConfiguracaoSalva(atual), ...alteracoes });
        },
        [salvar],
    );

    const testarConexao = useCallback(
        (dadosRequest: TestarConexaoJiraRequest) => testarConexaoJira(dadosRequest),
        [],
    );

    const listarCampos = useCallback(
        (dadosRequest?: ObterCamposJiraRequest) => listarCamposJira(dadosRequest),
        [],
    );

    return { configuracao: dados, carregando, salvando, carregar, salvarParcial, testarConexao, listarCampos };
}