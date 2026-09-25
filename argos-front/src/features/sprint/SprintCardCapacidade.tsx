import { CORES } from '../../theme';
import type { ReactNode } from 'react';
import { Box, Tooltip } from '@mui/material';
import { formatarData } from '../../utils/datas';
import { ParInfo, DestaqueInfo } from './SprintBadges';
import type { CabecalhoSprint, StatusFinalSprint } from '../../api/tipos';

const COR_PENDENTE = CORES.corPendente;
const COR_CONCLUIDO = CORES.corConcluido;

interface SprintCardCapacidadeProps {
    cabecalho: CabecalhoSprint;
    statusFinal?: StatusFinalSprint | null;
}

export function SprintCardCapacidade({ cabecalho, statusFinal }: SprintCardCapacidadeProps): ReactNode {
    const concluido = statusFinal?.statusConcluido ?? [];
    const ignorado = statusFinal?.statusIgnorado ?? [];
    const temStatusFinal = concluido.length > 0 || ignorado.length > 0;

    const tooltipConcluido = temStatusFinal
        ? `Conta descrições cujo status do Jira está em "Concluído": ${concluido.join(', ') || '(nenhum configurado)'}`
        : 'Sem status configurado como "Concluído" — esta contagem fica sempre 0';
    const tooltipPendentes = temStatusFinal
        ? `Conta descrições cujo status do Jira não está em "Concluído" (${concluido.join(', ') || '(nenhum)'}) nem em "Ignorado" (${ignorado.join(', ') || '(nenhum)'})`
        : 'Sem status configurado como "Concluído"/"Ignorado" — toda descrição conta aqui';

    return (
        <Box
            sx={{
                display: 'flex',
                flexWrap: { xs: 'wrap', md: 'nowrap' },
                gap: { xs: 2, md: 3 },
                p: 1.5,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                alignItems: 'center',
                overflowX: 'auto',
                mt: '0.5rem !important'
            }}>
            <ParInfo rotulo="Sprint" valor={cabecalho.nome} />
            <ParInfo rotulo="Horas/dia" valor={String(cabecalho.horasPorDia)} />
            {cabecalho.diasNaoUteis > 0 ? (
                <Tooltip title={`${cabecalho.diasUteis + cabecalho.diasNaoUteis} dias de segunda a sexta − ${cabecalho.diasNaoUteis} não úteis`}>
                    <Box>
                        <ParInfo rotulo="Dias úteis" valor={String(cabecalho.diasUteis)} />
                    </Box>
                </Tooltip>
            ) : (
                <ParInfo rotulo="Dias úteis" valor={String(cabecalho.diasUteis)} />
            )}
            <ParInfo rotulo="Margem" valor={`${cabecalho.margem} h`} />
            <ParInfo rotulo="Início" valor={formatarData(cabecalho.dataInicio)} />
            <ParInfo rotulo="Fim" valor={formatarData(cabecalho.dataFim)} />
            <Box sx={{ display: 'flex', flexWrap: { xs: 'wrap', md: 'nowrap' }, gap: 1.5, ml: { md: 'auto' }, flexShrink: { xs: 1, md: 0 } }}>
                <Tooltip title={tooltipPendentes}>
                    <Box>
                        <DestaqueInfo
                            rotulo="Pendentes"
                            valor={String(cabecalho.tarefasPendentes)}
                            cor={COR_PENDENTE} />
                    </Box>
                </Tooltip>
                <Tooltip title={tooltipConcluido}>
                    <Box>
                        <DestaqueInfo
                            rotulo="Concluído"
                            valor={String(cabecalho.tarefasConcluidas)}
                            cor={COR_CONCLUIDO} />
                    </Box>
                </Tooltip>
                <DestaqueInfo
                    rotulo="Capacidade"
                    valor={`${cabecalho.ct} h`}
                    cor="info.main" />
            </Box>
        </Box>
    );
}