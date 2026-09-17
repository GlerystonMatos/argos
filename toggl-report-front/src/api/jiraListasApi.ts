import { http } from './http';
import type { ListaJiraResponse } from './tipos';

export function listarStatusJira(forcarAtualizacao = false): Promise<ListaJiraResponse> {
    return http.get<ListaJiraResponse>('/api/jira/status', { forcarAtualizacao: String(forcarAtualizacao) });
}

export function listarPrioridadesJira(forcarAtualizacao = false): Promise<ListaJiraResponse> {
    return http.get<ListaJiraResponse>('/api/jira/prioridades', { forcarAtualizacao: String(forcarAtualizacao) });
}

export function listarUsuariosJira(forcarAtualizacao = false): Promise<ListaJiraResponse> {
    return http.get<ListaJiraResponse>('/api/jira/usuarios', { forcarAtualizacao: String(forcarAtualizacao) });
}