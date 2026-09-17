import type { ReactNode } from 'react';
import { rotularAgrupamento } from '../../utils/rotulos';
import { IconeStatus, BlocoResumo } from './BlocoResumo';
import { statusResponsavelCompleto } from './completude';
import { BotaoComCarregamento } from '../../components/BotaoComCarregamento';
import type { Agrupamento, UsuarioTogglResumo, EntradaMapeamentoJiraToggl } from '../../api/tipos';

import {
    Card,
    Stack,
    Alert,
    Divider,
    Typography,
    CardContent,
} from '@mui/material';

interface ConfiguracoesResumoProps {
    usuarios: UsuarioTogglResumo[];
    togglCompleto: boolean;
    agrupamento: Agrupamento;
    tagsDetalhadas: string[];
    dev: string[];
    rev: string[];
    qa: string[];
    statusDev: string[];
    statusRev: string[];
    statusQa: string[];
    jiraConfigurado: boolean;
    jiraUrlDominio: string;
    quantidadeCoresStatus: number;
    quantidadeCoresPrioridade: number;
    mapeamentoJira: Record<string, EntradaMapeamentoJiraToggl>;
    aoConfigurar: () => void;
}

export function ConfiguracoesResumo({
    usuarios,
    togglCompleto,
    agrupamento,
    tagsDetalhadas,
    dev,
    rev,
    qa,
    statusDev,
    statusRev,
    statusQa,
    jiraConfigurado,
    jiraUrlDominio,
    quantidadeCoresStatus,
    quantidadeCoresPrioridade,
    mapeamentoJira,
    aoConfigurar,
}: ConfiguracoesResumoProps): ReactNode {
    const administrador = usuarios.find((usuario) => usuario.administrador);
    const existeAdministrador = administrador !== undefined;
    const statusResponsavelOk = statusResponsavelCompleto({ statusDev, statusRev, statusQa });
    const nomesJiraMapeados = Object.keys(mapeamentoJira);

    return (
        <Card variant="outlined">
            <CardContent>
                <Stack spacing={2}>
                    <Typography variant="h6">Configurações</Typography>

                    <BlocoResumo icone={<IconeStatus completo={existeAdministrador} />} titulo="Usuários do Toggl">
                        <Typography variant="body2" color="text.secondary">
                            {usuarios.length} {usuarios.length === 1 ? 'Usuário cadastrado' : 'Usuários cadastrados'}
                            {existeAdministrador ? ` — Administrador: ${administrador.nomeExibicao}` : ''}
                        </Typography>
                        {!existeAdministrador ? (
                            <Alert severity="warning" sx={{ py: 0 }}>Nenhum usuário administrador definido.</Alert>
                        ) : undefined}
                    </BlocoResumo>

                    <BlocoResumo icone={<IconeStatus completo={togglCompleto} />} titulo="Toggl: Agrupamento e Tags">
                        <Typography variant="body2" color="text.secondary">
                            Agrupamento: {rotularAgrupamento(agrupamento)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Tags para detalhar por descrição: {tagsDetalhadas.length > 0 ? tagsDetalhadas.join(', ') : '(nenhuma)'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Tags para identificar responsáveis (DEV / REV / QA): {dev.length}/{rev.length}/{qa.length}
                        </Typography>
                        {!togglCompleto ? (
                            <Alert severity="warning" sx={{ py: 0 }}>
                                Faltam campos obrigatórios (Tags para identificar responsáveis (DEV / REV / QA)).
                            </Alert>
                        ) : undefined}
                    </BlocoResumo>

                    <BlocoResumo icone={<IconeStatus completo={jiraConfigurado} />} titulo="Jira: Conexão">
                        {jiraConfigurado ? (
                            <Typography variant="body2" color="text.secondary">
                                Domínio configurado: {jiraUrlDominio}
                            </Typography>
                        ) : (
                            <Alert severity="warning" sx={{ py: 0 }}>Jira não configurado.</Alert>
                        )}
                    </BlocoResumo>

                    <BlocoResumo icone={<IconeStatus completo={statusResponsavelOk} />} titulo="Jira: Status e Cores">
                        <Typography variant="body2" color="text.secondary">
                            Status para identificar responsáveis (DEV / REV / QA): {statusDev.length}/{statusRev.length}/{statusQa.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {quantidadeCoresStatus} status e {quantidadeCoresPrioridade} prioridades com cor mapeada.
                        </Typography>
                        {!statusResponsavelOk ? (
                            <Alert severity="warning" sx={{ py: 0 }}>
                                Faltam campos obrigatórios (Status para identificar responsáveis (DEV / REV / QA)).
                            </Alert>
                        ) : undefined}
                    </BlocoResumo>

                    <BlocoResumo icone={<IconeStatus completo />} titulo="Jira ↔ Toggl: Mapeamento">
                        <Typography variant="body2" color="text.secondary">
                            {nomesJiraMapeados.length} {nomesJiraMapeados.length === 1 ? 'usuário do Jira mapeado' : 'usuários do Jira mapeados'} (opcional)
                        </Typography>
                    </BlocoResumo>

                    <Divider />

                    <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
                        <BotaoComCarregamento variant="contained" onClick={aoConfigurar}>
                            Configurar
                        </BotaoComCarregamento>
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
}