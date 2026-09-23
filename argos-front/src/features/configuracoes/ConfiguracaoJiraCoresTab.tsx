import type { ReactNode } from 'react';
import { CoresJiraPanel } from './CoresJiraPanel';
import type { AbaConfiguracoesHandle } from './abas';
import { useNotificacao } from '../../hooks/useNotificacao';
import type { CoresJiraPanelHandle } from './CoresJiraPanel';
import { useRef, forwardRef, useImperativeHandle } from 'react';

interface ConfiguracaoJiraCoresTabProps {
    onAlterado: () => void;
}

export const ConfiguracaoJiraCoresTab = forwardRef<AbaConfiguracoesHandle, ConfiguracaoJiraCoresTabProps>(
    function ConfiguracaoJiraCoresTab({ onAlterado }, ref): ReactNode {
        const { notificarSucesso } = useNotificacao();
        const refPainelCores = useRef<CoresJiraPanelHandle>(null);

        async function salvarAba(): Promise<boolean> {
            const sucesso = (await refPainelCores.current?.salvar()) ?? true;
            if (sucesso) notificarSucesso('Mapeamento de cores do Jira, salvo com sucesso.');
            return sucesso;
        }

        useImperativeHandle(ref, () => ({ salvar: salvarAba }));

        return <CoresJiraPanel ref={refPainelCores} onAlterado={onAlterado} />;
    },
);