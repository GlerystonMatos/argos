export type AbaConfiguracoes = 'toggl' | 'jira-campos' | 'jira-status' | 'jira-cores' | 'jira-toggl';

export interface AbaConfiguracoesHandle {
    salvar: () => Promise<boolean>;
}