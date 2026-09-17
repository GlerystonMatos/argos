import type { ReactNode } from 'react';
import { Box, Stack, TextField, Tooltip, Typography } from '@mui/material';

interface MapaCoresListaProps {
    titulo: string;
    nomes: string[];
    cores: Record<string, string>;
    onChange: (nome: string, cor: string) => void;
    disabled?: boolean;
}

const COR_PADRAO = '#9E9E9E';

export function MapaCoresLista({ titulo, nomes, cores, onChange, disabled }: MapaCoresListaProps): ReactNode {
    if (nomes.length === 0) {
        return (
            <Stack spacing={1}>
                <Typography variant="subtitle2">{titulo}</Typography>
                <Typography variant="body2" color="text.secondary">
                    Nenhum valor encontrado. Atualize a lista de nomes reais acima primeiro.
                </Typography>
            </Stack>
        );
    }

    return (
        <Stack spacing={1} sx={{ pl: '0.5rem' }}>
            <Typography variant="subtitle2">{titulo}</Typography>
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 160px))',
                    gap: 1,
                }}>
                {nomes.map((nome) => (
                    <Stack key={nome} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <TextField
                            type="color"
                            value={cores[nome] ?? COR_PADRAO}
                            onChange={(evento) => onChange(nome, evento.target.value)}
                            disabled={disabled}
                            sx={{
                                width: 24,
                                minWidth: 0,
                                flexShrink: 0,
                                '& .MuiInputBase-root': {
                                    padding: 0,
                                },
                                '& input[type="color"]': {
                                    width: 24,
                                    height: 24,
                                    padding: 0,
                                    border: 'none',
                                },
                            }} />
                        <Tooltip title={nome}>
                            <Typography variant="body2" noWrap>
                                {nome}
                            </Typography>
                        </Tooltip>
                    </Stack>
                ))}
            </Box>
        </Stack>
    );
}