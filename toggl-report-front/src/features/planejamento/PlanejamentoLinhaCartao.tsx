import type { ReactNode } from 'react';
import { formatarData } from '../../utils/datas';
import { BadgeTexto } from '../sprint/SprintBadges';
import { BadgeSigla } from '../../components/BadgeSigla';
import { corDaSituacao, infoPrioridade } from '../sprint/calculos';
import type { CartaoPlanejamento, PessoaPlanejamento } from '../../api/tipos';
import { Box, Tooltip, TableRow, TableCell, Typography } from '@mui/material';
import { corPrevisaoLiberacao, urgenciaPrevisaoLiberacao, ROTULOS_URGENCIA_PREVISAO_LIBERACAO } from '../../utils/previsaoLiberacao';

const LARGURA_BADGE = '6.5rem';
const LARGURA_MAXIMA_GRUPO = '10rem';
const LARGURA_MAXIMA_TIME = '8rem';

interface PlanejamentoLinhaCartaoProps {
    cartao: CartaoPlanejamento;
    larguraDescricao?: number;
    coresStatus: Record<string, string>;
    coresPrioridade: Record<string, string>;
    coresColuna: Record<string, string>;
    janelaAlertaPrevisaoLiberacaoDias?: number;
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

const SX_CELULA_COM_DIVISORIA = { width: '1%', px: 0.5, whiteSpace: 'nowrap', borderLeft: 1, borderColor: 'divider' } as const;
const SX_CELULA_PADDING_FIXO = {
    width: '1%',
    paddingLeft: '0.25rem',
    paddingRight: '0.25rem',
    whiteSpace: 'nowrap',
    borderLeft: 1,
    borderColor: 'divider',
} as const;

function CelulaPessoa({ pessoa }: { pessoa: PessoaPlanejamento | null }): ReactNode {
    return (
        <TableCell align="center" sx={SX_CELULA_PADDING_FIXO}>
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

export function PlanejamentoLinhaCartao({ cartao, larguraDescricao, coresStatus, coresPrioridade, coresColuna, janelaAlertaPrevisaoLiberacaoDias = 5 }: PlanejamentoLinhaCartaoProps): ReactNode {
    const prioridade = infoPrioridade(cartao.prioridade, coresPrioridade);
    const urgenciaPrevisao = urgenciaPrevisaoLiberacao(cartao.previsaoLiberacao, janelaAlertaPrevisaoLiberacaoDias);
    const corPrevisao = corPrevisaoLiberacao(urgenciaPrevisao);

    return (
        <TableRow hover>
            <TableCell align="center" sx={{ width: '1%', px: 0.5, whiteSpace: 'nowrap' }}>
                <BadgeTexto
                    texto={cartao.coluna}
                    cor={corDaSituacao(cartao.coluna, coresColuna)}
                    largura={LARGURA_BADGE} />
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
            <TableCell align="center" sx={SX_CELULA_COM_DIVISORIA}>
                {cartao.previsaoLiberacao ? (
                    <Tooltip title={urgenciaPrevisao ? ROTULOS_URGENCIA_PREVISAO_LIBERACAO[urgenciaPrevisao] : 'Previsão de liberação'}>
                        <Box component="span" sx={{ color: corPrevisao ?? 'text.primary', fontWeight: corPrevisao ? 700 : undefined, fontSize: '0.8125rem' }}>
                            {formatarData(cartao.previsaoLiberacao)}
                        </Box>
                    </Tooltip>
                ) : (
                    <Vazio />
                )}
            </TableCell>
            <TableCell align="left" sx={SX_CELULA_PADDING_FIXO}>
                {cartao.time ? (
                    <Tooltip title={cartao.time}>
                        <Box sx={{ ...SX_TEXTO_CORTADO, maxWidth: LARGURA_MAXIMA_TIME, fontSize: '0.8125rem' }}>
                            {cartao.time}
                        </Box>
                    </Tooltip>
                ) : (
                    <Vazio />
                )}
            </TableCell>
            <TableCell align="left" sx={SX_CELULA_COM_DIVISORIA}>
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