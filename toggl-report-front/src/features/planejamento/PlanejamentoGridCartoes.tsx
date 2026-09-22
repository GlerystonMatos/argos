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

const SX_CABECALHO = { py: 0.25, px: 0.5, width: '1%', whiteSpace: 'nowrap', verticalAlign: 'bottom' } as const;
const SX_CABECALHO_PESSOA = { ...SX_CABECALHO, whiteSpace: 'normal', lineHeight: 1.2 } as const;
const SX_CABECALHO_COM_DIVISORIA = { ...SX_CABECALHO, borderLeft: 1, borderColor: 'divider' } as const;
const SX_CABECALHO_PADDING_FIXO = { ...SX_CABECALHO, paddingLeft: '0.25rem', paddingRight: '0.25rem', borderLeft: 1, borderColor: 'divider' } as const;
const SX_CABECALHO_PESSOA_PADDING_FIXO = { ...SX_CABECALHO_PESSOA, paddingLeft: '0.25rem', paddingRight: '0.25rem', borderLeft: 1, borderColor: 'divider' } as const;

function rotuloContador(exibidos: number, total: number): string {
    const sufixo = total === 1 ? 'cartão' : 'cartões';
    return exibidos === total ? `${total} ${sufixo}` : `${exibidos} de ${total} ${sufixo}`;
}

export function PlanejamentoGridCartoes({ cartoes, totalCartoes, coresStatus, coresPrioridade, coresColuna, janelaAlertaPrevisaoLiberacaoDias = 5 }: PlanejamentoGridCartoesProps): ReactNode {
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
                <TableContainer sx={{ overflowX: 'auto', mt: '0rem !important' }}>
                    <Table ref={refTabela} size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell align="center" sx={SX_CABECALHO}>Coluna</TableCell>
                                <TableCell align="center" sx={SX_CABECALHO}>Prioridade</TableCell>
                                <TableCell align="center" sx={SX_CABECALHO}>Status</TableCell>
                                <TableCell align="center" sx={SX_CABECALHO}>Código</TableCell>
                                <TableCell sx={{ py: 0.25, px: 0.8, verticalAlign: 'bottom' }}>Descrição</TableCell>
                                <TableCell align="center" sx={SX_CABECALHO_COM_DIVISORIA}>Previsão</TableCell>
                                <TableCell align="left" sx={SX_CABECALHO_PADDING_FIXO}>Time</TableCell>
                                <TableCell align="left" sx={SX_CABECALHO_COM_DIVISORIA}>Épico</TableCell>
                                <TableCell align="center" sx={SX_CABECALHO_PESSOA_PADDING_FIXO}><CabecalhoAbreviado rotulo="Responsável" /></TableCell>
                                <TableCell align="center" sx={SX_CABECALHO_PESSOA_PADDING_FIXO}><CabecalhoAbreviado rotulo="Analisado por" /></TableCell>
                                <TableCell align="center" sx={SX_CABECALHO_PESSOA_PADDING_FIXO}><CabecalhoAbreviado rotulo="Revisado por" /></TableCell>
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
                                    janelaAlertaPrevisaoLiberacaoDias={janelaAlertaPrevisaoLiberacaoDias} />
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Stack>
    );
}