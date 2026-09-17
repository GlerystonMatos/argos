import type { ReactNode } from 'react';
import { FONTE_MARCA } from '../../utils/tipografia';
import { Box, Stack, Tooltip, Typography } from '@mui/material';

export function BadgeTexto({ texto, cor, corTexto = 'text.primary', largura = '3rem' }: { texto: string; cor: string; corTexto?: string; largura?: string }): ReactNode {
    return (
        <Tooltip title={texto}>
            <Box
                component="span"
                sx={{
                    px: 0.75,
                    py: 0.1,
                    width: largura,
                    overflow: 'hidden',
                    borderRadius: 0,
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    display: 'inline-block',
                    textOverflow: 'ellipsis',
                    textTransform: 'uppercase',
                    fontFamily: FONTE_MARCA,
                    verticalAlign: 'middle',
                    bgcolor: cor,
                    color: corTexto,
                }}>
                {texto}
            </Box>
        </Tooltip>
    );
}

export function EtiquetaFixa({ texto, cor }: { texto: string; cor: string }): ReactNode {
    return (
        <Typography variant="body2" sx={{ color: cor, whiteSpace: 'nowrap' }}>
            {texto}
        </Typography>
    );
}

export function ParInfo({ rotulo, valor }: { rotulo: string; valor: string }): ReactNode {
    return (
        <Stack spacing={0} sx={{ flexShrink: 0 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                {rotulo}
            </Typography>
            <Typography
                variant="h6"
                sx={{ color: 'primary.main', fontWeight: 700, lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                {valor}
            </Typography>
        </Stack>
    );
}

export function DestaqueInfo({ rotulo, valor, cor }: { rotulo: string; valor: string; cor: string }): ReactNode {
    return (
        <Box
            sx={{
                px: 1.5,
                py: 0.75,
                borderRadius: 1,
                border: 2,
                borderColor: cor,
                minWidth: 96,
                flexShrink: 0,
            }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', whiteSpace: 'nowrap' }}>
                {rotulo}
            </Typography>
            <Typography variant="h6" sx={{ color: cor, fontWeight: 700, lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                {valor}
            </Typography>
        </Box>
    );
}