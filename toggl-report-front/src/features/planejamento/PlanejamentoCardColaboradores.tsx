import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { siglarColunas } from './abreviacaoColuna';
import { BadgeSigla } from '../../components/BadgeSigla';
import { IconeAjuda } from '../../components/IconeAjuda';
import type { ResultadoPlanejamento } from '../../api/tipos';

import {
    Box,
    Table,
    Stack,
    Tooltip,
    TableRow,
    TableBody,
    TableCell,
    TableHead,
    IconButton,
    Typography,
    TableFooter,
    TableContainer,
} from '@mui/material';

interface PlanejamentoCardColaboradoresProps {
    resultado: ResultadoPlanejamento;
}

const SX_CABECALHO_COLUNA = {
    py: 0.5,
    px: 0.75,
    fontSize: '0.75rem',
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
    verticalAlign: 'bottom',
} as const;

export function PlanejamentoCardColaboradores({ resultado }: PlanejamentoCardColaboradoresProps): ReactNode {
    const [expandido, setExpandido] = useState(true);
    const { colunas, totaisPorColuna, colaboradores } = resultado;
    const totalCartoes = totaisPorColuna.reduce((soma, total) => soma + total, 0);
    const rotulosColuna = useMemo(() => siglarColunas(colunas), [colunas]);

    return (
        <Stack spacing={1} sx={{ mt: '0.5rem !important' }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                    Colaboradores
                </Typography>
                <IconButton
                    size="small"
                    onClick={() => setExpandido((atual) => !atual)}
                    aria-label={expandido ? 'Recolher colaboradores' : 'Expandir colaboradores'}>
                    {expandido ? '–' : '+'}
                </IconButton>
                <IconeAjuda titulo="Cartões do quadro em que a pessoa é Responsável ou Revisado por, por coluna. Cada cartão conta uma vez por pessoa; “Analisado por” não entra na contagem." />
            </Stack>
            {expandido && (
                <TableContainer sx={{ overflowX: 'auto', mt: '0rem !important' }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ py: 0.5, verticalAlign: 'bottom' }}>Nome</TableCell>
                                <TableCell sx={{ py: 0.5, verticalAlign: 'bottom' }}>Sigla</TableCell>
                                {colunas.map((coluna, indice) => (
                                    <TableCell key={`${indice}-${coluna}`} align="right" sx={SX_CABECALHO_COLUNA}>
                                        <Tooltip title={coluna}>
                                            <Box component="span">{rotulosColuna.get(coluna) ?? coluna}</Box>
                                        </Tooltip>
                                    </TableCell>
                                ))}
                                <TableCell sx={{ py: 0.5, verticalAlign: 'bottom', fontWeight: 700 }} align="right">Total</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {colaboradores.map(({ pessoa, contagens, total }) => (
                                <TableRow key={pessoa.nomeJira} hover>
                                    <TableCell sx={{ py: 0.25, whiteSpace: 'nowrap' }}>
                                        {pessoa.nome}
                                    </TableCell>
                                    <TableCell sx={{ py: 0.25 }}>
                                        <BadgeSigla
                                            sigla={pessoa.sigla}
                                            cor={pessoa.cor ?? undefined}
                                            nome={pessoa.mapeado ? pessoa.nome : `${pessoa.nome} (sem mapeamento Jira ↔ Toggl)`}
                                            sx={{ borderRadius: 1 }} />
                                    </TableCell>
                                    {colunas.map((coluna, indice) => {
                                        const quantidade = contagens[indice] ?? 0;
                                        return (
                                            <TableCell
                                                key={`${indice}-${coluna}`}
                                                align="right"
                                                sx={{
                                                    py: 0.25,
                                                    px: 0.75,
                                                    color: quantidade > 0 ? 'text.primary' : 'text.disabled',
                                                }}>
                                                {quantidade > 0 ? quantidade : '–'}
                                            </TableCell>
                                        );
                                    })}
                                    <TableCell sx={{ py: 0.25 }} align="right">
                                        {total}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell
                                    colSpan={2}
                                    sx={{ py: 0.5, fontWeight: 700, color: 'text.primary', whiteSpace: 'nowrap', borderTop: 2, borderColor: 'divider' }}>
                                    Cartões na coluna
                                </TableCell>
                                {colunas.map((coluna, indice) => (
                                    <TableCell
                                        key={`${indice}-${coluna}`}
                                        align="right"
                                        sx={{ py: 0.5, px: 0.75, color: 'text.primary', borderTop: 2, borderColor: 'divider' }}>
                                        {totaisPorColuna[indice] ?? 0}
                                    </TableCell>
                                ))}
                                <TableCell
                                    align="right"
                                    sx={{ py: 0.5, color: 'text.primary', borderTop: 2, borderColor: 'divider' }}>
                                    {totalCartoes}
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </TableContainer>
            )}
        </Stack>
    );
}