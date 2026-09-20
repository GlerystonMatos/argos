import type { ReactNode } from 'react';
import { IconeStatus, BlocoResumo } from './BlocoResumo';
import type { Secao } from '../../components/MenuLateral';
import { Card, Stack, Alert, Typography, CardContent } from '@mui/material';
import { BotaoComCarregamento } from '../../components/BotaoComCarregamento';

interface PreRequisitosConfiguracoesProps {
    existeUsuarioAdministrador: boolean;
    jiraConfigurado: boolean;
    onNavegar: (secao: Secao) => void;
}

interface BotaoIrParaProps {
    destino: string;
    onClick: () => void;
}

function BotaoIrPara({ destino, onClick }: BotaoIrParaProps): ReactNode {
    return (
        <BotaoComCarregamento size="small" variant="outlined" onClick={onClick}>
            Ir para {destino}
        </BotaoComCarregamento>
    );
}

export function PreRequisitosConfiguracoes({
    existeUsuarioAdministrador,
    jiraConfigurado,
    onNavegar,
}: PreRequisitosConfiguracoesProps): ReactNode {
    return (
        <Card variant="outlined">
            <CardContent>
                <Stack spacing={2}>
                    <Typography variant="h6">Configurações</Typography>

                    <Alert severity="warning">
                        Antes de configurar, cadastre um usuário administrador do Toggl e configure a conexão com o Jira.
                    </Alert>

                    <BlocoResumo
                        icone={<IconeStatus completo={existeUsuarioAdministrador} />}
                        titulo="Usuário administrador do Toggl"
                        acao={existeUsuarioAdministrador ? undefined : <BotaoIrPara destino="Toggl" onClick={() => onNavegar('toggl')} />}>
                        <Typography variant="body2" color="text.secondary">
                            {existeUsuarioAdministrador ? 'Administrador cadastrado.' : 'Nenhum usuário administrador cadastrado.'}
                        </Typography>
                    </BlocoResumo>

                    <BlocoResumo
                        icone={<IconeStatus completo={jiraConfigurado} />}
                        titulo="Conexão com o Jira"
                        acao={jiraConfigurado ? undefined : <BotaoIrPara destino="Jira" onClick={() => onNavegar('jira')} />}>
                        <Typography variant="body2" color="text.secondary">
                            {jiraConfigurado ? 'Conexão configurada.' : 'Conexão com o Jira não configurada.'}
                        </Typography>
                    </BlocoResumo>
                </Stack>
            </CardContent>
        </Card>
    );
}