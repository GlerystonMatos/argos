import { CORES } from '../../theme';
import type { ReactNode } from 'react';
import { Stack, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
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
    children: ReactNode;
}

export function BlocoResumo({ icone, titulo, children }: BlocoResumoProps): ReactNode {
    return (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
            <Stack sx={{ pt: '2px' }}>{icone}</Stack>
            <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2">{titulo}</Typography>
                {children}
            </Stack>
        </Stack>
    );
}