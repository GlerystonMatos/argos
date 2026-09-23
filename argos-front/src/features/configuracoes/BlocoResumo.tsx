import { CORES } from '../../theme';
import type { ReactNode } from 'react';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { IconButton, Stack, Typography } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export function IconeStatus({ completo }: { completo: boolean }): ReactNode {
    return completo ? (
        <CheckCircleIcon fontSize="small" sx={{ color: CORES.corConcluido }} />
    ) : (
        <WarningAmberIcon fontSize="small" sx={{ color: CORES.corPendente }} />
    );
}

interface BlocoResumoProps {
    icone: ReactNode;
    titulo: string;
    acao?: ReactNode;
    expandido?: boolean;
    onAlternarExpandido?: () => void;
    children: ReactNode;
}

export function BlocoResumo({ icone, titulo, acao, expandido = true, onAlternarExpandido, children }: BlocoResumoProps): ReactNode {
    return (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', mt: '0.5rem !important' }}>
            <Stack sx={{ pt: '2px' }}>{icone}</Stack>
            <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={0.25} sx={{ alignItems: 'center', ml: '-4px !important' }}>
                    {onAlternarExpandido ? (
                        <IconButton
                            size="small"
                            onClick={onAlternarExpandido}
                            aria-label={expandido ? `Recolher ${titulo}` : `Expandir ${titulo}`}>
                            {expandido ? <RemoveIcon fontSize="inherit" /> : <AddIcon fontSize="inherit" />}
                        </IconButton>
                    ) : undefined}
                    <Typography variant="subtitle2">{titulo}</Typography>
                </Stack>
                {expandido ? children : undefined}
            </Stack>
            {acao ? <Stack sx={{ flexShrink: 0 }}>{acao}</Stack> : undefined}
        </Stack>
    );
}