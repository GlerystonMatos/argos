import type { OrigemConsultaSprint } from '../api/tipos';

export type OrigemConsulta = OrigemConsultaSprint;
export type OrigemConsultaToggl = Extract<OrigemConsulta, 'nenhum' | 'toggl'>;

export const ROTULO_CONSULTAR: Record<OrigemConsulta, string> = {
    nenhum: 'Consultar',
    toggl: 'Forçar Toggl',
    jira: 'Forçar Jira',
    ambos: 'Forçar Toggl e Jira',
};

export const ROTULO_OPCAO: Record<OrigemConsulta, string> = {
    nenhum: 'Nenhum',
    toggl: 'Toggl',
    jira: 'Jira',
    ambos: 'Ambos',
};

export function forcaToggl(origem: OrigemConsulta): boolean {
    return origem === 'toggl' || origem === 'ambos';
}