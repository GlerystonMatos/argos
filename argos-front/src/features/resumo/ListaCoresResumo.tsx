import type { ReactNode } from 'react';
import { Chip, Stack, Tooltip, Typography } from '@mui/material';

interface GrupoCoresProps {
    cores: Record<string, string>;
}

function GrupoCores({ cores }: GrupoCoresProps): ReactNode {
    const nomes = Object.keys(cores).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    if (nomes.length === 0) return null;

    return (
        <Stack spacing={0.5} sx={{ mt: '0.25rem !important' }}>
            <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                {nomes.map((nome) => (
                    <Tooltip key={nome} title={nome}>
                        <Chip
                            size="small"
                            label={nome}
                            sx={{ maxWidth: '12rem', borderRadius: 1, bgcolor: cores[nome], color: 'text.primary' }}
                        />
                    </Tooltip>
                ))}
            </Stack>
        </Stack>
    );
}

interface ListaCoresResumoProps {
    quantidadeCoresStatus: number;
    quantidadeCoresPrioridade: number;
    quantidadeCoresColunaDev: number;
    quantidadeCoresColunaAnalise: number;
    quantidadeCoresTime: number;
    quantidadeCoresEpico: number;
    coresStatus: Record<string, string>;
    coresPrioridade: Record<string, string>;
    coresColunaDev: Record<string, string>;
    coresColunaAnalise: Record<string, string>;
    coresTime: Record<string, string>;
    coresEpico: Record<string, string>;
}

export function ListaCoresResumo({
    quantidadeCoresStatus,
    quantidadeCoresPrioridade,
    quantidadeCoresColunaDev,
    quantidadeCoresColunaAnalise,
    quantidadeCoresTime,
    quantidadeCoresEpico,
    coresStatus,
    coresPrioridade,
    coresColunaDev,
    coresColunaAnalise,
    coresTime,
    coresEpico,
}: ListaCoresResumoProps): ReactNode {
    if (Object.keys(coresStatus).length === 0 && Object.keys(coresPrioridade).length === 0 && Object.keys(coresColunaDev).length === 0 && Object.keys(coresColunaAnalise).length === 0 && Object.keys(coresTime).length === 0 && Object.keys(coresEpico).length === 0) return null;

    return (
        <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
                {quantidadeCoresStatus} status com cor mapeada (opcional)
            </Typography>
            <GrupoCores cores={coresStatus} />
            <Typography variant="body2" color="text.secondary">
                {quantidadeCoresPrioridade} {quantidadeCoresPrioridade === 1 ? 'prioridade' : 'prioridades'} com cor mapeada (opcional)
            </Typography>
            <GrupoCores cores={coresPrioridade} />
            <Typography variant="body2" color="text.secondary">
                {quantidadeCoresColunaDev} {quantidadeCoresColunaDev === 1 ? 'coluna do quadro de DEV' : 'colunas do quadro de DEV'} com cor mapeada (opcional)
            </Typography>
            <GrupoCores cores={coresColunaDev} />
            <Typography variant="body2" color="text.secondary">
                {quantidadeCoresColunaAnalise} {quantidadeCoresColunaAnalise === 1 ? 'coluna do quadro de Análise' : 'colunas do quadro de Análise'} com cor mapeada (opcional)
            </Typography>
            <GrupoCores cores={coresColunaAnalise} />
            <Typography variant="body2" color="text.secondary">
                {quantidadeCoresTime} {quantidadeCoresTime === 1 ? 'time' : 'times'} com cor mapeada (opcional)
            </Typography>
            <GrupoCores cores={coresTime} />
            <Typography variant="body2" color="text.secondary">
                {quantidadeCoresEpico} {quantidadeCoresEpico === 1 ? 'épico' : 'épicos'} com cor mapeada (opcional)
            </Typography>
            <GrupoCores cores={coresEpico} />
        </Stack>
    );
}