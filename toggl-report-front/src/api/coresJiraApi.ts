import { http } from './http';
import type { AtualizarCoresJiraRequest, CoresJira } from './tipos';

export function obterCoresJira(): Promise<CoresJira> {
    return http.get<CoresJira>('/api/jira/cores');
}

export function atualizarCoresJira(dados: AtualizarCoresJiraRequest): Promise<CoresJira> {
    return http.put<CoresJira>('/api/jira/cores', dados);
}