import { CORES } from '../../theme';
import { Box } from '@mui/material';
import type { ReactNode } from 'react';
import { formatarData } from '../../utils/datas';
import type { CabecalhoSprint } from '../../api/tipos';
import { ParInfo, DestaqueInfo } from './SprintBadges';

const COR_PENDENTE = CORES.corPendente;
const COR_CONCLUIDO = CORES.corConcluido;

interface SprintCardCapacidadeProps {
    cabecalho: CabecalhoSprint;
}

export function SprintCardCapacidade({ cabecalho }: SprintCardCapacidadeProps): ReactNode {
    return (
        <Box
            sx={{
                display: 'flex',
                flexWrap: 'nowrap',
                gap: 3,
                p: 1.5,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                alignItems: 'center',
                overflowX: 'auto',
            }}>
            <ParInfo rotulo="Sprint" valor={cabecalho.nome} />
            <ParInfo rotulo="Horas/dia" valor={String(cabecalho.horasPorDia)} />
            <ParInfo rotulo="Dias úteis" valor={String(cabecalho.diasUteis)} />
            <ParInfo rotulo="Margem" valor={`${cabecalho.margem} h`} />
            <ParInfo rotulo="Início" valor={formatarData(cabecalho.dataInicio)} />
            <ParInfo rotulo="Fim" valor={formatarData(cabecalho.dataFim)} />
            <Box sx={{ display: 'flex', flexWrap: 'nowrap', gap: 1.5, ml: 'auto', flexShrink: 0 }}>
                <DestaqueInfo
                    rotulo="Pendentes"
                    valor={String(cabecalho.tarefasPendentes)}
                    cor={COR_PENDENTE} />
                <DestaqueInfo
                    rotulo="Concluído"
                    valor={String(cabecalho.tarefasConcluidas)}
                    cor={COR_CONCLUIDO} />
                <DestaqueInfo
                    rotulo="Capacidade"
                    valor={`${cabecalho.ct} h`}
                    cor="primary.main" />
            </Box>
        </Box>
    );
}