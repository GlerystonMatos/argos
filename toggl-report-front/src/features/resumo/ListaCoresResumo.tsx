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
    quantidadeCoresColuna: number;
    coresStatus: Record<string, string>;
    coresPrioridade: Record<string, string>;
    coresColuna: Record<string, string>;
}

export function ListaCoresResumo({
    quantidadeCoresStatus,
    quantidadeCoresPrioridade,
    quantidadeCoresColuna,
    coresStatus,
    coresPrioridade,
    coresColuna,
}: ListaCoresResumoProps): ReactNode {
    if (Object.keys(coresStatus).length === 0 && Object.keys(coresPrioridade).length === 0 && Object.keys(coresColuna).length === 0) return null;

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
                {quantidadeCoresColuna} {quantidadeCoresColuna === 1 ? 'coluna do quadro' : 'colunas do quadro'} com cor mapeada (opcional)
            </Typography>
            <GrupoCores cores={coresColuna} />
        </Stack>
    );
}