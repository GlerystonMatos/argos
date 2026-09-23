import { useState } from 'react';
import type { ReactNode } from 'react';
import type { ResultadoUseBusca } from './useBusca';
import { formatarDuracao } from '../../utils/duracao';
import { useNotificacao } from '../../hooks/useNotificacao';
import type { ResultadoBuscaDescricao } from '../../api/tipos';
import { BotaoComCarregamento } from '../../components/BotaoComCarregamento';

import {
    Alert,
    Stack,
    Divider,
    TextField,
    Typography,
} from '@mui/material';

interface BuscaPanelProps {
    busca: ResultadoUseBusca;
}

interface ListaResultadoBuscaProps {
    resultado: ResultadoBuscaDescricao;
    termo: string;
}

function ListaResultadoBusca({ resultado, termo }: ListaResultadoBuscaProps): ReactNode {
    if (resultado.linhas.length === 0) {
        return <Alert severity="info">Nenhuma descrição encontrada para "{termo}".</Alert>;
    }

    return (
        <Stack spacing={2} divider={<Divider />}>
            {resultado.linhas.map((linha) => (
                <Stack key={linha.descricao} spacing={0.5}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                        <Typography sx={{ fontWeight: 600 }}>{linha.descricao}</Typography>
                        <Typography sx={{ fontWeight: 600 }}>
                            {formatarDuracao(linha.totalSegundosLinha)}
                        </Typography>
                    </Stack>
                    <Stack spacing={0.25} sx={{ pl: 2 }}>
                        {Object.entries(linha.segundosPorUsuario)
                            .sort((a, b) => b[1] - a[1])
                            .map(([nomeUsuario, segundos]) => (
                                <Stack key={nomeUsuario} direction="row" sx={{ justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {nomeUsuario}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {formatarDuracao(segundos)}
                                    </Typography>
                                </Stack>
                            ))}
                    </Stack>
                </Stack>
            ))}

            <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                <Typography sx={{ fontWeight: 700 }}>Total geral</Typography>
                <Typography sx={{ fontWeight: 700 }}>
                    {formatarDuracao(resultado.totalGeralSegundos)}
                </Typography>
            </Stack>
        </Stack>
    );
}

export function BuscaPanel({ busca }: BuscaPanelProps): ReactNode {
    const { resultado, termoAtivo, buscando, buscar, limpar } = busca;
    const { notificarErro } = useNotificacao();
    const [termo, setTermo] = useState('');

    async function executarBusca(): Promise<void> {
        if (!termo.trim()) return;
        try {
            await buscar(termo.trim());
        } catch (erro) {
            notificarErro(erro, 'Não foi possível buscar');
        }
    }

    function limparBusca(): void {
        limpar();
        setTermo('');
    }

    return (
        <Stack spacing={2} sx={{ mt: '0.5rem !important' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField
                    label="Buscar por parte da descrição"
                    value={termo}
                    onChange={(evento) => setTermo(evento.target.value)}
                    onKeyDown={(evento) => {
                        if (evento.key === 'Enter') void executarBusca();
                    }}
                    fullWidth
                    size="small"
                    autoFocus />
                <BotaoComCarregamento
                    variant="contained"
                    carregando={buscando}
                    disabled={!termo.trim()}
                    onClick={() => void executarBusca()}>
                    Buscar
                </BotaoComCarregamento>
                <BotaoComCarregamento
                    variant="outlined"
                    disabled={!termo && !resultado}
                    onClick={limparBusca}>
                    Limpar
                </BotaoComCarregamento>
            </Stack>

            {resultado ? <ListaResultadoBusca resultado={resultado} termo={termoAtivo ?? termo} /> : undefined}
        </Stack>
    );
}