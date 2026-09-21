import { useRef } from 'react';
import type { ReactNode } from 'react';
import type { CartaoPlanejamento } from '../../api/tipos';
import { PlanejamentoLinhaCartao } from './PlanejamentoLinhaCartao';
import { useLarguraColunaRestante } from '../../hooks/useLarguraColunaRestante';

import {
    Table,
    Alert,
    Stack,
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
}

const SX_CABECALHO = { py: 0.25, px: 0.5, width: '1%', whiteSpace: 'nowrap', verticalAlign: 'bottom' } as const;
const SX_CABECALHO_PESSOA = { ...SX_CABECALHO, whiteSpace: 'normal', lineHeight: 1.2 } as const;

function rotuloContador(exibidos: number, total: number): string {
    const sufixo = total === 1 ? 'cartão' : 'cartões';
    return exibidos === total ? `${total} ${sufixo}` : `${exibidos} de ${total} ${sufixo}`;
}

export function PlanejamentoGridCartoes({ cartoes, totalCartoes, coresStatus, coresPrioridade }: PlanejamentoGridCartoesProps): ReactNode {
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
                                <TableCell sx={SX_CABECALHO}>Coluna</TableCell>
                                <TableCell align="center" sx={SX_CABECALHO}>Prioridade</TableCell>
                                <TableCell align="center" sx={SX_CABECALHO}>Status</TableCell>
                                <TableCell align="center" sx={SX_CABECALHO}>Código</TableCell>
                                <TableCell sx={{ py: 0.25, px: 0.8, verticalAlign: 'bottom' }}>Descrição</TableCell>
                                <TableCell sx={SX_CABECALHO}>Grupo</TableCell>
                                <TableCell align="center" sx={SX_CABECALHO_PESSOA}>Responsável</TableCell>
                                <TableCell align="center" sx={SX_CABECALHO_PESSOA}>Analisado por</TableCell>
                                <TableCell align="center" sx={SX_CABECALHO_PESSOA}>Revisado por</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {cartoes.map((cartao) => (
                                <PlanejamentoLinhaCartao
                                    key={cartao.chave}
                                    cartao={cartao}
                                    larguraDescricao={larguraDescricao}
                                    coresStatus={coresStatus}
                                    coresPrioridade={coresPrioridade} />
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Stack>
    );
}