import { Box, Typography } from '@mui/material';
import { FONTE_MARCA } from '../utils/tipografia';
import type { SxProps, Theme } from '@mui/material';
import type { KeyboardEvent, ReactNode } from 'react';

interface MarcaArgosProps {
    corTexto?: string;
    sxImagem?: SxProps<Theme>;
    sxTitulo?: SxProps<Theme>;
    onClick?: () => void;
}

export function MarcaArgos({ corTexto, sxImagem, sxTitulo, onClick }: MarcaArgosProps): ReactNode {
    const marca = (
        <>
            <Box
                component="img"
                src="/favicon.png"
                alt=""
                sx={[{ height: 64, width: 64 }, sxImagem] as SxProps<Theme>} />
            <Typography variant="h6" component="div" sx={sxTitulo}>
                <Box
                    component="span"
                    sx={{ fontFamily: FONTE_MARCA, fontWeight: 600, letterSpacing: '0.08em', color: corTexto, fontSize: '2.5rem' }}>
                    ARGOS
                </Box>
            </Typography>
        </>
    );

    if (!onClick) return marca;

    function aoTeclar(evento: KeyboardEvent<HTMLElement>): void {
        if (evento.key === 'Enter' || evento.key === ' ') {
            evento.preventDefault();
            onClick?.();
        }
    }

    return (
        <Box
            role="button"
            tabIndex={0}
            aria-label="Ir para o resumo"
            onClick={onClick}
            onKeyDown={aoTeclar}
            sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                borderRadius: 1,
                '&:focus-visible': { outline: '2px solid currentColor', outlineOffset: 2 },
            }}>
            {marca}
        </Box>
    );
}