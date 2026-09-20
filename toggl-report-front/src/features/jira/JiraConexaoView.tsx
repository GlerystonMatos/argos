import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import SaveIcon from '@mui/icons-material/Save';
import { JiraConexaoPanel } from './JiraConexaoPanel';
import { Card, Stack, CardContent } from '@mui/material';
import { CabecalhoView } from '../../components/CabecalhoView';
import type { JiraConexaoPanelHandle } from './JiraConexaoPanel';
import { BotaoComCarregamento } from '../../components/BotaoComCarregamento';

interface JiraConexaoViewProps {
    onSalvo?: () => void;
}

export function JiraConexaoView({ onSalvo }: JiraConexaoViewProps): ReactNode {
    const [salvando, setSalvando] = useState(false);
    const [conexaoValida, setConexaoValida] = useState(false);
    const refPainel = useRef<JiraConexaoPanelHandle>(null);

    async function salvar(): Promise<void> {
        setSalvando(true);
        try {
            const salvo = (await refPainel.current?.salvar()) ?? false;
            if (salvo) onSalvo?.();
        } finally {
            setSalvando(false);
        }
    }

    return (
        <Card variant="outlined">
            <CardContent>
                <Stack spacing={2}>
                    <CabecalhoView titulo="Conexão com o Jira">
                        <BotaoComCarregamento
                            variant="contained"
                            startIcon={<SaveIcon />}
                            carregando={salvando}
                            disabled={!conexaoValida}
                            onClick={() => void salvar()}>
                            Salvar
                        </BotaoComCarregamento>
                    </CabecalhoView>

                    <JiraConexaoPanel ref={refPainel} onValidoChange={setConexaoValida} />
                </Stack>
            </CardContent>
        </Card>
    );
}