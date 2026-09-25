import { http } from './http';
import type { TipoQuadroJira, ListaJiraResponse, EpicosJiraResponse, QuadrosJiraResponse } from './tipos';

export function listarStatusJira(forcarAtualizacao = false): Promise<ListaJiraResponse> {
    return http.get<ListaJiraResponse>('/api/jira/status', { forcarAtualizacao: String(forcarAtualizacao) });
}

export function listarPrioridadesJira(forcarAtualizacao = false): Promise<ListaJiraResponse> {
    return http.get<ListaJiraResponse>('/api/jira/prioridades', { forcarAtualizacao: String(forcarAtualizacao) });
}

export function listarColunasJira(quadro: TipoQuadroJira, forcarAtualizacao = false): Promise<ListaJiraResponse> {
    return http.get<ListaJiraResponse>('/api/jira/colunas', { quadro, forcarAtualizacao: String(forcarAtualizacao) });
}

export function listarTimesJira(): Promise<ListaJiraResponse> {
    return http.get<ListaJiraResponse>('/api/jira/times');
}

export function listarEpicosJira(): Promise<EpicosJiraResponse> {
    return http.get<EpicosJiraResponse>('/api/jira/epicos');
}

export function listarUsuariosJira(forcarAtualizacao = false): Promise<ListaJiraResponse> {
    return http.get<ListaJiraResponse>('/api/jira/usuarios', { forcarAtualizacao: String(forcarAtualizacao) });
}

export function listarQuadrosJira(forcarAtualizacao = false): Promise<QuadrosJiraResponse> {
    return http.get<QuadrosJiraResponse>('/api/jira/quadros', { forcarAtualizacao: String(forcarAtualizacao) });
}