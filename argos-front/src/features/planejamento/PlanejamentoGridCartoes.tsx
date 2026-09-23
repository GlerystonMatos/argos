import { useRef } from 'react';
import type { ReactNode } from 'react';
import type { CartaoPlanejamento } from '../../api/tipos';
import { PlanejamentoLinhaCartao } from './PlanejamentoLinhaCartao';
import { useLarguraColunaRestante } from '../../hooks/useLarguraColunaRestante';

import {
    Box,
    Table,
    Alert,
    Stack,
    Tooltip,
    TableRow,
    TableBody,
    TableCell,
    TableHead,
    Typography,
    TableContainer,
} from '@mui/material';

const INDICE_COLUNA_DESCRICAO = 4;
const LARGURA_MINIMA_DESCRICAO = 100;
const MARGEM_SEGURANCA_DESCRICAO = 4;

interface PlanejamentoGridCartoesProps {
    cartoes: CartaoPlanejamento[];
    totalCartoes?: number;
    coresStatus: Record<string, string>;
    coresPrioridade: Record<string, string>;
    coresColuna: Record<string, string>;
    coresTime: Record<string, string>;
    coresEpico: Record<string, string>;
    janelaAlertaPrevisaoLiberacaoDias?: number;
}

const ABREVIACOES_PESSOA: Record<string, string> = { Responsável: 'RES', 'Analisado por': 'ANP', 'Revisado por': 'REP' };

function CabecalhoAbreviado({ rotulo }: { rotulo: string }): ReactNode {
    return (
        <Tooltip title={rotulo}>
            <Box component="span">{ABREVIACOES_PESSOA[rotulo]}</Box>
        </Tooltip>
    );
}

const LARGURA_CELULA_GRUPO = '2.5rem';
const SX_CABECALHO = { py: 0.25, px: 0.5, width: '1%', whiteSpace: 'nowrap', verticalAlign: 'bottom' } as const;
const SX_CABECALHO_COM_DIVISORIA = { ...SX_CABECALHO, borderLeft: 1, borderColor: 'divider' } as const;
const SX_CABECALHO_PADDING_FIXO = { ...SX_CABECALHO, paddingLeft: '0.25rem', paddingRight: '0.25rem', borderLeft: 1, borderColor: 'divider' } as const;
const SX_CABECALHO_GRUPO = { py: 0.25, px: 0.5, whiteSpace: 'nowrap', borderLeft: 1, borderColor: 'divider' } as const;
const SX_CABECALHO_GRUPO_PRE = { py: 0.25, px: 0.5, width: LARGURA_CELULA_GRUPO, whiteSpace: 'nowrap', borderLeft: 1, borderColor: 'divider' } as const;
const SX_CABECALHO_GRUPO_PESSOA = { py: 0.25, px: 0.5, width: LARGURA_CELULA_GRUPO, whiteSpace: 'nowrap', borderLeft: 1, borderColor: 'divider' } as const;

const GRUPOS_PESSOA_COM_PREVISTO = ['Responsável', 'Revisado por'] as const;

function rotuloContador(exibidos: number, total: number): string {
    const sufixo = total === 1 ? 'cartão' : 'cartões';
    return exibidos === total ? `${total} ${sufixo}` : `${exibidos} de ${total} ${sufixo}`;
}

export function PlanejamentoGridCartoes({ cartoes, totalCartoes, coresStatus, coresPrioridade, coresColuna, coresTime, coresEpico, janelaAlertaPrevisaoLiberacaoDias = 5 }: PlanejamentoGridCartoesProps): ReactNode {
    const refTabela = useRef<HTMLTableElement>(null);
    const total = totalCartoes ?? cartoes.length;

    const larguraDescricao = useLarguraColunaRestante(
        refTabela,
        {
            indiceColuna: INDICE_COLUNA_DESCRICAO,
            larguraMinima: LARGURA_MINIMA_DESCRICAO,
            margemSeguranca: MARGEM_SEGURANCA_DESCRICAO,
            linhaMedicao: 'corpo',
        },
        [cartoes],
    );

    if (total === 0) {
        return <Alert severity="info">Nenhum cartão no sprint ativo do quadro.</Alert>;
    }

    return (
        <Stack spacing={1} sx={{ mt: '0.5rem !important' }}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                {rotuloContador(cartoes.length, total)}
            </Typography>
            {cartoes.length === 0 ? (
                <Alert severity="info">Nenhum cartão corresponde ao filtro.</Alert>
            ) : (
                <TableContainer sx={{ overflowX: 'auto', mt: '-0.5rem !important' }}>
                    <Table ref={refTabela} size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell rowSpan={2} align="center" sx={SX_CABECALHO}>Coluna</TableCell>
                                <TableCell rowSpan={2} align="center" sx={SX_CABECALHO}>Prioridade</TableCell>
                                <TableCell rowSpan={2} align="center" sx={SX_CABECALHO}>Status</TableCell>
                                <TableCell rowSpan={2} align="center" sx={SX_CABECALHO}>Código</TableCell>
                                <TableCell rowSpan={2} sx={{ py: 0.25, px: 0.8, verticalAlign: 'bottom' }}>Descrição</TableCell>
                                <TableCell rowSpan={2} align="center" sx={SX_CABECALHO_COM_DIVISORIA}>Previsão</TableCell>
                                <TableCell rowSpan={2} align="center" sx={SX_CABECALHO_PADDING_FIXO}>Time</TableCell>
                                <TableCell rowSpan={2} align="center" sx={SX_CABECALHO_COM_DIVISORIA}>Épico</TableCell>
                                <TableCell rowSpan={2} align="center" sx={{ ...SX_CABECALHO_GRUPO_PESSOA, verticalAlign: 'bottom' }}><CabecalhoAbreviado rotulo="Analisado por" /></TableCell>
                                {GRUPOS_PESSOA_COM_PREVISTO.map((rotulo) => (
                                    <TableCell key={rotulo} colSpan={2} align="center" sx={SX_CABECALHO_GRUPO}>{rotulo}</TableCell>
                                ))}
                            </TableRow>
                            <TableRow>
                                {GRUPOS_PESSOA_COM_PREVISTO.map((rotulo) => [
                                    <TableCell key={`${rotulo}-pre`} align="center" sx={SX_CABECALHO_GRUPO_PRE}>
                                        <Tooltip title="Tempo previsto">
                                            <Box component="span">PRE</Box>
                                        </Tooltip>
                                    </TableCell>,
                                    <TableCell key={`${rotulo}-pessoa`} align="center" sx={SX_CABECALHO_GRUPO_PESSOA}>
                                        <CabecalhoAbreviado rotulo={rotulo} />
                                    </TableCell>,
                                ])}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {cartoes.map((cartao) => (
                                <PlanejamentoLinhaCartao
                                    key={cartao.chave}
                                    cartao={cartao}
                                    larguraDescricao={larguraDescricao}
                                    coresStatus={coresStatus}
                                    coresPrioridade={coresPrioridade}
                                    coresColuna={coresColuna}
                                    coresTime={coresTime}
                                    coresEpico={coresEpico}
                                    janelaAlertaPrevisaoLiberacaoDias={janelaAlertaPrevisaoLiberacaoDias} />
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Stack>
    );
}