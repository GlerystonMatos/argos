import { http } from './http';
import type { AtualizarMapeamentoJiraTogglRequest, MapeamentoJiraToggl } from './tipos';

export function obterMapeamentoJiraToggl(): Promise<MapeamentoJiraToggl> {
    return http.get<MapeamentoJiraToggl>('/api/jira/usuarios-mapeamento');
}

export function atualizarMapeamentoJiraToggl(dados: AtualizarMapeamentoJiraTogglRequest): Promise<MapeamentoJiraToggl> {
    return http.put<MapeamentoJiraToggl>('/api/jira/usuarios-mapeamento', dados);
}