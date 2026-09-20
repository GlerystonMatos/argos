import { useGant } from './useGant';
import { GantLinha } from './GantLinha';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import { useExpansao } from '../../hooks/useExpansao';
import { AvisoCache } from '../../components/AvisoCache';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import { useNotificacao } from '../../hooks/useNotificacao';
import { CabecalhoView } from '../../components/CabecalhoView';
import { formatarDiaCurto, formatarPeriodo } from '../../utils/datas';
import { EsqueletoCarregando } from '../../components/EsqueletoCarregando';
import { BotaoComCarregamento } from '../../components/BotaoComCarregamento';

import {
    Table,
    Alert,
    Stack,
    TableRow,
    TextField,
    TableBody,
    TableCell,
    TableHead,
    TableContainer,
} from '@mui/material';

interface GantViewProps {
    dataInicio: string;
    dataFim: string;
    onVoltar: () => void;
    veioDoCache: boolean;
}

export function GantView({ dataInicio, dataFim, onVoltar, veioDoCache }: GantViewProps): ReactNode {
    const { notificarErro } = useNotificacao();
    const { gant, carregando, carregar } = useGant();
    const [termoBusca, setTermoBusca] = useState('');
    const [buscaAberta, setBuscaAberta] = useState(false);
    const [termoAtivo, setTermoAtivo] = useState<string | undefined>(undefined);

    useEffect(() => {
        carregar(dataInicio, dataFim, termoAtivo).catch((erro: unknown) => notificarErro(erro, 'Não foi possível carregar o Gant'));
    }, [dataInicio, dataFim, termoAtivo]);

    const usuariosDistintos = gant
        ? Array.from(new Map(gant.linhas.map((linha) => [linha.usuarioChave, linha.nomeExibicao])).entries())
        : [];

    const { expandido, alternarUm, alternarTodos, todosExpandidos } = useExpansao(
        usuariosDistintos.map(([usuarioChave]) => usuarioChave),
        gant,
    );

    const totalColunas = 3 + (gant?.dias.length ?? 0);

    return (
        <Stack spacing={2}>
            <CabecalhoView titulo={`Gant — ${formatarPeriodo(dataInicio, dataFim)}`}>
                <BotaoComCarregamento
                    startIcon={<SearchIcon />}
                    onClick={() => {
                        if (buscaAberta) {
                            setTermoBusca('');
                            setTermoAtivo(undefined);
                        }
                        setBuscaAberta((atual) => !atual);
                    }}>
                    {buscaAberta ? 'Fechar busca' : 'Buscar por descrição'}
                </BotaoComCarregamento>
                <BotaoComCarregamento
                    startIcon={todosExpandidos ? <UnfoldLessIcon /> : <UnfoldMoreIcon />}
                    onClick={alternarTodos}
                    disabled={usuariosDistintos.length === 0}>
                    {todosExpandidos ? 'Colapsar tudo' : 'Expandir tudo'}
                </BotaoComCarregamento>
                <BotaoComCarregamento onClick={onVoltar}>Voltar</BotaoComCarregamento>
            </CabecalhoView>

            {buscaAberta ? (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: '0.5rem !important' }}>
                    <TextField
                        label="Buscar por parte da descrição"
                        value={termoBusca}
                        onChange={(evento) => setTermoBusca(evento.target.value)}
                        onKeyDown={(evento) => {
                            if (evento.key === 'Enter') setTermoAtivo(termoBusca.trim() || undefined);
                        }}
                        size="small"
                        fullWidth
                        autoFocus />
                    <BotaoComCarregamento
                        variant="contained"
                        disabled={!termoBusca.trim()}
                        onClick={() => setTermoAtivo(termoBusca.trim() || undefined)}>
                        Buscar
                    </BotaoComCarregamento>
                    <BotaoComCarregamento
                        variant="outlined"
                        disabled={!termoBusca && termoAtivo === undefined}
                        onClick={() => {
                            setTermoBusca('');
                            setTermoAtivo(undefined);
                        }}>
                        Limpar
                    </BotaoComCarregamento>
                </Stack>
            ) : undefined}

            {veioDoCache ? <AvisoCache /> : undefined}

            {carregando && !gant ? <EsqueletoCarregando /> : undefined}

            {gant && gant.linhas.length === 0 ? (
                <Alert severity="warning">
                    {termoAtivo !== undefined
                        ? 'Nenhuma descrição encontrada para esse termo.'
                        : 'Nenhum apontamento encontrado para este período.'}
                </Alert>
            ) : undefined}

            {gant && gant.linhas.length > 0 ? (
                <TableContainer sx={{ overflowX: 'auto', mt: '0.5rem !important' }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ py: 0.25 }}>Categoria</TableCell>
                                <TableCell sx={{ py: 0.25 }}>Descrição</TableCell>
                                <TableCell sx={{ py: 0.25 }}>Total</TableCell>
                                {gant.dias.map((dia) => (
                                    <TableCell
                                        key={dia}
                                        sx={{ p: 0.25, textAlign: 'center', borderLeft: 1, borderColor: 'divider' }}>
                                        {formatarDiaCurto(dia)}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {gant.linhas.map((linha, indice) => {
                                const linhaAnterior = indice > 0 ? gant.linhas[indice - 1] : null;
                                const primeiraDoUsuario = linhaAnterior === null || linha.usuarioChave !== linhaAnterior.usuarioChave;
                                const usuarioExpandido = expandido[linha.usuarioChave] ?? false;

                                return (
                                    <GantLinha
                                        key={`${linha.usuarioChave}-${linha.categoria}-${linha.descricao}-${indice}`}
                                        linha={linha}
                                        dias={gant.dias}
                                        totalColunas={totalColunas}
                                        primeiraDoUsuario={primeiraDoUsuario}
                                        usuarioExpandido={usuarioExpandido}
                                        onAlternarUsuario={() => alternarUm(linha.usuarioChave)} />
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : undefined}
        </Stack>
    );
}