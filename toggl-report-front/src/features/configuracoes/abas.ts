export type AbaConfiguracoes = 'toggl' | 'jira-campos' | 'jira-status' | 'jira-cores' | 'jira-toggl';

export const ORDEM_ABAS: readonly AbaConfiguracoes[] = ['toggl', 'jira-campos', 'jira-status', 'jira-cores', 'jira-toggl'];

export const ROTULOS_ABAS: Record<AbaConfiguracoes, string> = {
    'toggl': 'Toggl',
    'jira-campos': 'Jira: Campos',
    'jira-status': 'Jira: Status',
    'jira-cores': 'Jira: Cores',
    'jira-toggl': 'Jira ↔ Toggl',
};

export interface AbaConfiguracoesHandle {
    salvar: () => Promise<boolean>;
}

export interface AbaConfiguracoesProps {
    onAlterado?: () => void;
    onValidoChange?: (valido: boolean) => void;
}