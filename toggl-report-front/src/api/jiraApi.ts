import { http } from './http';

import type {
    CampoJira,
    ConfiguracaoJira,
    ObterCamposJiraRequest,
    TestarConexaoJiraRequest,
    TestarConexaoJiraResponse,
    SalvarConfiguracaoJiraRequest,
} from './tipos';

export function obterConfiguracaoJira(): Promise<ConfiguracaoJira> {
    return http.get<ConfiguracaoJira>('/api/jira/configuracao');
}

export function salvarConfiguracaoJira(dados: SalvarConfiguracaoJiraRequest): Promise<ConfiguracaoJira> {
    return http.put<ConfiguracaoJira>('/api/jira/configuracao', dados);
}

export function testarConexaoJira(dados: TestarConexaoJiraRequest): Promise<TestarConexaoJiraResponse> {
    return http.post<TestarConexaoJiraResponse>('/api/jira/testar-conexao', dados);
}

export function listarCamposJira(dados: ObterCamposJiraRequest = {}): Promise<CampoJira[]> {
    return http.post<CampoJira[]>('/api/jira/campos', dados);
}