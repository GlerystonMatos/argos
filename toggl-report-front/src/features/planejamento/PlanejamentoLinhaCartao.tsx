import type { ReactNode } from 'react';
import { BadgeTexto } from '../sprint/SprintBadges';
import { BadgeSigla } from '../../components/BadgeSigla';
import { corDaSituacao, infoPrioridade } from '../sprint/calculos';
import type { CartaoPlanejamento, PessoaPlanejamento } from '../../api/tipos';
import { Box, Tooltip, TableRow, TableCell, Typography } from '@mui/material';

const LARGURA_BADGE = '6.5rem';
const LARGURA_MAXIMA_COLUNA = '9rem';
const LARGURA_MAXIMA_GRUPO = '10rem';
const SEM_COLUNA = '(sem coluna)';

interface PlanejamentoLinhaCartaoProps {
    cartao: CartaoPlanejamento;
    larguraDescricao?: number;
    coresStatus: Record<string, string>;
    coresPrioridade: Record<string, string>;
}

const SX_TEXTO_CORTADO = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
} as const;

function Vazio(): ReactNode {
    return (
        <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
            –
        </Typography>
    );
}

function CelulaPessoa({ pessoa }: { pessoa: PessoaPlanejamento | null }): ReactNode {
    return (
        <TableCell align="center" sx={{ width: '1%', px: 0.5, whiteSpace: 'nowrap' }}>
            {pessoa ? (
                <BadgeSigla
                    sigla={pessoa.sigla}
                    cor={pessoa.cor ?? undefined}
                    nome={pessoa.mapeado ? pessoa.nome : `${pessoa.nome} (sem mapeamento Jira ↔ Toggl)`} />
            ) : (
                <Vazio />
            )}
        </TableCell>
    );
}

export function PlanejamentoLinhaCartao({ cartao, larguraDescricao, coresStatus, coresPrioridade }: PlanejamentoLinhaCartaoProps): ReactNode {
    const prioridade = infoPrioridade(cartao.prioridade, coresPrioridade);
    const semColuna = cartao.coluna === SEM_COLUNA;

    return (
        <TableRow hover>
            <TableCell sx={{ width: '1%', px: 0.5, whiteSpace: 'nowrap' }}>
                <Tooltip title={cartao.coluna}>
                    <Box
                        sx={{
                            ...SX_TEXTO_CORTADO,
                            maxWidth: LARGURA_MAXIMA_COLUNA,
                            fontSize: '0.8125rem',
                            color: semColuna ? 'text.secondary' : 'text.primary',
                        }}>
                        {cartao.coluna}
                    </Box>
                </Tooltip>
            </TableCell>
            <TableCell align="center" sx={{ width: '1%', px: 0.5, whiteSpace: 'nowrap' }}>
                <BadgeTexto texto={prioridade.texto} cor={prioridade.cor} largura={LARGURA_BADGE} />
            </TableCell>
            <TableCell align="center" sx={{ width: '1%', px: 0.5, whiteSpace: 'nowrap' }}>
                <BadgeTexto
                    texto={cartao.status || 'Nenhuma'}
                    cor={corDaSituacao(cartao.status || null, coresStatus)}
                    largura={LARGURA_BADGE} />
            </TableCell>
            <TableCell align="center" sx={{ width: '1%', px: 0.5, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                {cartao.urlIssue ? (
                    <Box
                        component="a"
                        href={cartao.urlIssue}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ color: 'primary.main', textDecoration: 'underline' }}>
                        {cartao.codigo}
                    </Box>
                ) : (
                    cartao.codigo
                )}
            </TableCell>
            <TableCell
                sx={{
                    px: 0.8,
                    ...(larguraDescricao !== undefined
                        ? { width: larguraDescricao, maxWidth: larguraDescricao }
                        : { maxWidth: 360 }),
                }}>
                <Tooltip title={cartao.descricao}>
                    <Box sx={SX_TEXTO_CORTADO}>
                        {cartao.descricao || '(sem descrição)'}
                    </Box>
                </Tooltip>
            </TableCell>
            <TableCell sx={{ width: '1%', px: 0.5, whiteSpace: 'nowrap' }}>
                {cartao.grupoResumo ? (
                    <Tooltip title={cartao.grupoChave ? `${cartao.grupoChave} — ${cartao.grupoResumo}` : cartao.grupoResumo}>
                        <Box sx={{ ...SX_TEXTO_CORTADO, maxWidth: LARGURA_MAXIMA_GRUPO, fontSize: '0.8125rem' }}>
                            {cartao.grupoResumo}
                        </Box>
                    </Tooltip>
                ) : (
                    <Vazio />
                )}
            </TableCell>
            <CelulaPessoa pessoa={cartao.responsavel} />
            <CelulaPessoa pessoa={cartao.analisadoPor} />
            <CelulaPessoa pessoa={cartao.revisadoPor} />
        </TableRow>
    );
}