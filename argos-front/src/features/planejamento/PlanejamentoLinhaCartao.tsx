import { CORES } from '../../theme';
import type { ReactNode } from 'react';
import { formatarData } from '../../utils/datas';
import { formatarDuracao } from '../../utils/duracao';
import { BadgeSigla } from '../../components/BadgeSigla';
import { BadgeTexto, EtiquetaFixa } from '../sprint/SprintBadges';
import type { CartaoPlanejamento, PessoaPlanejamento } from '../../api/tipos';
import { Box, Tooltip, TableRow, TableCell, Typography } from '@mui/material';
import { corDaSituacao, infoPrioridade, formatarHoraResumida } from '../sprint/calculos';

import {
    corPrevisaoLiberacao,
    urgenciaPrevisaoLiberacao,
    ROTULOS_URGENCIA_PREVISAO_LIBERACAO,
} from '../../utils/previsaoLiberacao';

const LARGURA_BADGE = '6.5rem';
const LARGURA_BADGE_EPICO = '10rem';

interface PlanejamentoLinhaCartaoProps {
    cartao: CartaoPlanejamento;
    larguraDescricao?: number;
    coresStatus: Record<string, string>;
    coresPrioridade: Record<string, string>;
    coresColuna: Record<string, string>;
    coresTime: Record<string, string>;
    coresEpico: Record<string, string>;
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
    textAlign: 'center',
    verticalAlign: 'middle',
} as const;

const LARGURA_CELULA_GRUPO = '2.5rem';
const SX_CELULA_GRUPO_PRE = { px: 0.5, width: LARGURA_CELULA_GRUPO, borderLeft: 1, borderColor: 'divider', whiteSpace: 'nowrap' } as const;
const SX_CELULA_GRUPO_PESSOA = { px: 0.5, width: LARGURA_CELULA_GRUPO, borderLeft: 1, borderColor: 'divider', whiteSpace: 'nowrap' } as const;

function CelulaPrevistoGrupo({ horas }: { horas: number | null }): ReactNode {
    const segundos = Math.round((horas ?? 0) * 3600);
    return (
        <TableCell align="center" sx={SX_CELULA_GRUPO_PRE}>
            {segundos > 0 ? (
                <Tooltip title={formatarDuracao(segundos)}>
                    <Box component="span" sx={{ color: CORES.accentAzul, fontWeight: 600 }}>
                        {formatarHoraResumida(segundos)}
                    </Box>
                </Tooltip>
            ) : (
                <EtiquetaFixa texto="–" cor="text.primary" />
            )}
        </TableCell>
    );
}

function CelulaPessoaGrupo({ pessoa }: { pessoa: PessoaPlanejamento | null }): ReactNode {
    return (
        <TableCell align="center" sx={SX_CELULA_GRUPO_PESSOA}>
            {pessoa ? (
                <BadgeSigla
                    sigla={pessoa.sigla}
                    cor={pessoa.cor ?? undefined}
                    nome={pessoa.mapeado ? pessoa.nome : `${pessoa.nome} (sem mapeamento Jira ↔ Toggl)`} />
            ) : (
                <EtiquetaFixa texto="–" cor="text.primary" />
            )}
        </TableCell>
    );
}

export function PlanejamentoLinhaCartao({ cartao, larguraDescricao, coresStatus, coresPrioridade, coresColuna, coresTime, coresEpico, janelaAlertaPrevisaoLiberacaoDias = 5 }: PlanejamentoLinhaCartaoProps): ReactNode {
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
            <TableCell align="center" sx={SX_CELULA_PADDING_FIXO}>
                {cartao.time ? (
                    <BadgeTexto texto={cartao.time} cor={corDaSituacao(cartao.time, coresTime)} largura={LARGURA_BADGE} />
                ) : (
                    <Vazio />
                )}
            </TableCell>
            <TableCell align="center" sx={SX_CELULA_COM_DIVISORIA}>
                {cartao.grupoResumo ? (
                    <BadgeTexto
                        texto={cartao.grupoResumo}
                        cor={corDaSituacao(cartao.grupoChave, coresEpico)}
                        largura={LARGURA_BADGE_EPICO}
                        tooltip={cartao.grupoChave ? `${cartao.grupoChave} — ${cartao.grupoResumo}` : cartao.grupoResumo} />
                ) : (
                    <Vazio />
                )}
            </TableCell>
            <CelulaPessoaGrupo pessoa={cartao.analisadoPor} />
            <CelulaPrevistoGrupo horas={cartao.estimativaDesenvolvimentoHoras} />
            <CelulaPessoaGrupo pessoa={cartao.responsavel} />
            <CelulaPrevistoGrupo horas={cartao.estimativaRevisaoHoras} />
            <CelulaPessoaGrupo pessoa={cartao.revisadoPor} />
        </TableRow>
    );
}