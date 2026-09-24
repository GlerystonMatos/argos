import { Fragment, type ReactNode } from 'react';
import type { LinhaGant } from '../../api/tipos';
import { FONTE_MARCA } from '../../utils/tipografia';
import { formatarDuracao } from '../../utils/duracao';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { DescricaoComLinkJira } from '../../components/LinkJira';

import {
    Box,
    Chip,
    Stack,
    Tooltip,
    TableRow,
    TableCell,
    Typography,
} from '@mui/material';

interface GantLinhaProps {
    linha: LinhaGant;
    dias: string[];
    totalColunas: number;
    medindo: boolean;
    primeiraDoUsuario: boolean;
    usuarioExpandido: boolean;
    onAlternarUsuario: () => void;
    urlDominioJira: string;
}

export function GantLinha({
    linha,
    dias,
    totalColunas,
    medindo,
    primeiraDoUsuario,
    usuarioExpandido,
    onAlternarUsuario,
    urlDominioJira,
}: GantLinhaProps): ReactNode {
    return (
        <Fragment>
            {primeiraDoUsuario ? (
                <TableRow
                    onClick={onAlternarUsuario}
                    sx={{ cursor: 'pointer', bgcolor: 'action.hover' }}>
                    <TableCell colSpan={totalColunas} sx={{ py: 0 }}>
                        <Stack
                            direction="row"
                            spacing={0.5}
                            sx={{ alignItems: 'center', ...(medindo ? { width: 0, overflow: 'hidden' } : undefined) }}>
                            {usuarioExpandido ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {linha.nomeExibicao}
                            </Typography>
                        </Stack>
                    </TableCell>
                </TableRow>
            ) : undefined}
            {usuarioExpandido || medindo ? (
                <TableRow>
                    <TableCell sx={{ py: 0 }}>{linha.categoria}</TableCell>
                    <TableCell sx={{ py: 0 }}>
                        <Tooltip title={linha.descricao}>
                            <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <DescricaoComLinkJira descricao={linha.descricao} urlDominioJira={urlDominioJira} />
                            </Box>
                        </Tooltip>
                    </TableCell>
                    <TableCell sx={{ py: 0 }}>{formatarDuracao(Math.round(linha.totalHoras * 3600))}</TableCell>
                    {dias.map((dia) => {
                        const celulas = linha.celulasPorDia[dia];
                        const pintarCelula = celulas && celulas.length > 0;
                        return (
                            <TableCell
                                key={dia}
                                sx={{
                                    p: 0.25,
                                    textAlign: 'center',
                                    borderLeft: 1,
                                    borderColor: 'divider',
                                    bgcolor: pintarCelula ? celulas[0].cor || 'action.disabledBackground' : undefined,
                                }}>
                                {celulas && celulas.length > 0 ? (
                                    <Stack spacing={0.25} sx={{ alignItems: 'center' }}>
                                        {celulas.map((celula) => (
                                            <Tooltip
                                                key={celula.usuarioChave}
                                                title={`${celula.nomeExibicao} — ${formatarDuracao(Math.round(celula.horas * 3600))}`}>
                                                <Chip
                                                    size="small"
                                                    label={celula.sigla || '?'}
                                                    sx={{
                                                        py: 0.20,
                                                        borderRadius: 0,
                                                        fontWeight: 700,
                                                        fontSize: '0.85rem',
                                                        textAlign: 'center',
                                                        display: 'inline-block',
                                                        textTransform: 'uppercase',
                                                        fontFamily: FONTE_MARCA,
                                                        bgcolor: celula.cor || 'action.selected',
                                                    }} />
                                            </Tooltip>
                                        ))}
                                    </Stack>
                                ) : undefined}
                            </TableCell>
                        );
                    })}
                </TableRow>
            ) : undefined}
        </Fragment>
    );
}