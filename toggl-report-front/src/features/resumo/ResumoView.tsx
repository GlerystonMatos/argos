import type { ReactNode } from 'react';
import { rotularAgrupamento } from '../../utils/rotulos';
import type { Secao } from '../../components/MenuLateral';
import type { AbaConfiguracoes } from '../configuracoes/abas';
import type { ResumoConfiguracao } from './useResumoConfiguracao';
import { IconeStatus, BlocoResumo } from '../configuracoes/BlocoResumo';
import { EsqueletoCarregando } from '../../components/EsqueletoCarregando';
import { BotaoComCarregamento } from '../../components/BotaoComCarregamento';

import {
    Box,
    Card,
    Stack,
    Alert,
    Typography,
    CardContent,
} from '@mui/material';

const TOTAL_CAMPOS_JIRA = 4;

interface ResumoViewProps {
    resumo: ResumoConfiguracao;
    onNavegar: (secao: Secao, aba?: AbaConfiguracoes) => void;
}

interface BotaoConfigurarProps {
    titulo: string;
    onClick: () => void;
}

function BotaoConfigurar({ titulo, onClick }: BotaoConfigurarProps): ReactNode {
    return (
        <BotaoComCarregamento size="small" variant="outlined" aria-label={`Configurar ${titulo}`} onClick={onClick}>
            Configurar
        </BotaoComCarregamento>
    );
}

export function ResumoView({ resumo, onNavegar }: ResumoViewProps): ReactNode {
    const {
        carregado,
        categorias,
        togglCompleto,
        responsabilidade,
        jiraConfigurado,
        statusFinal,
        jiraUrlDominio,
        nomeAdministrador,
        quantidadeUsuarios,
        configuracaoCompleta,
        quantidadeCoresStatus,
        quantidadeMapeamentosJira,
        quantidadeCamposJiraDefinidos,
        quantidadeCoresPrioridade,
        statusResponsavelCompleto,
        existeUsuarioAdministrador,
    } = resumo;

    const pendenciasObrigatorias = [
        ...(togglCompleto ? [] : ['Toggl: Configurações']),
        ...(statusResponsavelCompleto ? [] : ['Jira: Status']),
    ];

    return (
        <Card variant="outlined">
            <CardContent>
                <Stack spacing={2}>
                    <Typography variant="h6">Resumo da aplicação</Typography>

                    {!carregado ? (
                        <EsqueletoCarregando />
                    ) : (
                        <>
                            {configuracaoCompleta ? (
                                <Alert severity="success" sx={{ py: 0 }}>Relatório, Gant e Sprint estão liberados.</Alert>
                            ) : (
                                <Alert severity="warning" sx={{ py: 0 }}>
                                    Complete as configurações obrigatórias para liberar Relatório, Gant e Sprint.
                                    {pendenciasObrigatorias.length > 0 ? ` Pendente: ${pendenciasObrigatorias.join(' e ')}.` : ''}
                                </Alert>
                            )}

                            <BlocoResumo
                                icone={<IconeStatus completo={existeUsuarioAdministrador} />}
                                titulo="Usuários do Toggl"
                                acao={<BotaoConfigurar titulo="Usuários do Toggl" onClick={() => onNavegar('toggl')} />}>
                                <Typography variant="body2" color="text.secondary">
                                    {quantidadeUsuarios} {quantidadeUsuarios === 1 ? 'Usuário cadastrado' : 'Usuários cadastrados'}
                                    {nomeAdministrador !== null ? ` — Administrador: ${nomeAdministrador}` : ''}
                                </Typography>
                                {!existeUsuarioAdministrador ? (
                                    <Alert severity="warning" sx={{ py: 0 }}>Nenhum usuário administrador definido.</Alert>
                                ) : undefined}
                            </BlocoResumo>

                            <BlocoResumo
                                icone={<IconeStatus completo={togglCompleto} />}
                                titulo="Toggl: Configurações"
                                acao={<BotaoConfigurar titulo="Toggl: Configurações" onClick={() => onNavegar('configuracoes', 'toggl')} />}>
                                <Typography variant="body2" color="text.secondary">
                                    Agrupamento: {rotularAgrupamento(categorias.agrupamento)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Tags para detalhar por descrição: {categorias.tagsDetalhadas.length > 0 ? categorias.tagsDetalhadas.join(', ') : '(nenhuma)'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Tags para identificar responsáveis (DEV / REV / QA): {categorias.dev.length}/{categorias.rev.length}/{categorias.qa.length}
                                </Typography>
                                {categorias.corTag ? (
                                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Cor da tag no Sprint:
                                        </Typography>
                                        <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: categorias.corTag, border: 1, borderColor: 'divider' }} />
                                        <Typography variant="body2" color="text.secondary">
                                            {categorias.corTag}
                                        </Typography>
                                    </Stack>
                                ) : undefined}
                                {!togglCompleto ? (
                                    <Alert severity="warning" sx={{ py: 0 }}>
                                        Faltam campos obrigatórios (Tags para identificar responsáveis (DEV / REV / QA)).
                                    </Alert>
                                ) : undefined}
                            </BlocoResumo>

                            <BlocoResumo
                                icone={<IconeStatus completo={jiraConfigurado} />}
                                titulo="Jira: Conexão"
                                acao={<BotaoConfigurar titulo="Jira: Conexão" onClick={() => onNavegar('jira')} />}>
                                {jiraConfigurado ? (
                                    <Typography variant="body2" color="text.secondary">
                                        Domínio configurado: {jiraUrlDominio}
                                    </Typography>
                                ) : (
                                    <Alert severity="warning" sx={{ py: 0 }}>Jira não configurado.</Alert>
                                )}
                            </BlocoResumo>

                            <BlocoResumo
                                icone={<IconeStatus completo />}
                                titulo="Jira: Campos personalizados"
                                acao={<BotaoConfigurar titulo="Jira: Campos personalizados" onClick={() => onNavegar('configuracoes', 'jira-campos')} />}>
                                <Typography variant="body2" color="text.secondary">
                                    {quantidadeCamposJiraDefinidos} de {TOTAL_CAMPOS_JIRA} campos definidos (opcional) — Estimativas de desenvolvimento, revisão e testes e "Revisado por"
                                </Typography>
                            </BlocoResumo>

                            <BlocoResumo
                                icone={<IconeStatus completo={statusResponsavelCompleto} />}
                                titulo="Jira: Status"
                                acao={<BotaoConfigurar titulo="Jira: Status" onClick={() => onNavegar('configuracoes', 'jira-status')} />}>
                                <Typography variant="body2" color="text.secondary">
                                    Status para identificar responsáveis (DEV / REV / QA): {responsabilidade.statusDev.length}/{responsabilidade.statusRev.length}/{responsabilidade.statusQa.length}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Status Concluído: {statusFinal.statusConcluido.length > 0 ? statusFinal.statusConcluido.join(', ') : '(nenhum)'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Status Ignorado: {statusFinal.statusIgnorado.length > 0 ? statusFinal.statusIgnorado.join(', ') : '(nenhum)'}
                                </Typography>
                                {!statusResponsavelCompleto ? (
                                    <Alert severity="warning" sx={{ py: 0 }}>
                                        Faltam campos obrigatórios (Status para identificar responsáveis (DEV / REV / QA)).
                                    </Alert>
                                ) : undefined}
                            </BlocoResumo>

                            <BlocoResumo
                                icone={<IconeStatus completo />}
                                titulo="Jira: Cores"
                                acao={<BotaoConfigurar titulo="Jira: Cores" onClick={() => onNavegar('configuracoes', 'jira-cores')} />}>
                                <Typography variant="body2" color="text.secondary">
                                    {quantidadeCoresStatus} status e {quantidadeCoresPrioridade} {quantidadeCoresPrioridade === 1 ? 'prioridade' : 'prioridades'} com cor mapeada (opcional)
                                </Typography>
                            </BlocoResumo>

                            <BlocoResumo
                                icone={<IconeStatus completo />}
                                titulo="Jira ↔ Toggl: Mapeamento"
                                acao={<BotaoConfigurar titulo="Jira ↔ Toggl: Mapeamento" onClick={() => onNavegar('configuracoes', 'jira-toggl')} />}>
                                <Typography variant="body2" color="text.secondary">
                                    {quantidadeMapeamentosJira} {quantidadeMapeamentosJira === 1 ? 'usuário do Jira mapeado' : 'usuários do Jira mapeados'} (opcional)
                                </Typography>
                            </BlocoResumo>
                        </>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
}