import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { temDadoAproveitavel } from '../utils/consulta';
import { useNotificacao } from '../hooks/useNotificacao';
import { DialogoConfirmacao } from './DialogoConfirmacao';
import { BotaoComCarregamento } from './BotaoComCarregamento';
import { periodoEhValido, ultimos30Dias } from '../utils/datas';
import type { Agrupamento, ConsultarResponse } from '../api/tipos';

import {
    Card,
    Alert,
    Stack,
    Checkbox,
    TextField,
    Typography,
    CardContent,
    FormControlLabel,
} from '@mui/material';

export interface DadosParametros {
    agrupamento: Agrupamento;
    tags: string[];
    dataInicio: string;
    dataFim: string;
}

interface ParametrosCarregados {
    agrupamento: Agrupamento;
    tags: string[];
    dataInicio: string | null;
    dataFim: string | null;
}

export interface ParametrosConsultaProps {
    semUsuarios: boolean;
    onConcluida: (resposta: ConsultarResponse) => void;
}

interface ParametrosFormBaseProps extends ParametrosConsultaProps {
    titulo: string;
    mensagemErroCarregar: string;
    carregarInicial: () => Promise<ParametrosCarregados>;
    salvarParametros: (dados: DadosParametros) => Promise<unknown>;
    executarConsulta: (dataInicio: string, dataFim: string, forcarConsultaApi: boolean) => Promise<ConsultarResponse>;
}

export function ParametrosFormBase({
    titulo,
    semUsuarios,
    mensagemErroCarregar,
    carregarInicial,
    salvarParametros,
    executarConsulta,
    onConcluida,
}: ParametrosFormBaseProps): ReactNode {
    const [dataFim, setDataFim] = useState('');
    const [dataInicio, setDataInicio] = useState('');
    const { notificarErro, notificarSucesso } = useNotificacao();
    const [consultando, setConsultando] = useState(false);
    const [semDados, setSemDados] = useState(false);
    const [carregandoInicial, setCarregandoInicial] = useState(true);
    const [forcarConsultaApi, setForcarConsultaApi] = useState(false);
    const [confirmandoConsultaForcada, setConfirmandoConsultaForcada] = useState(false);
    const [tags, setTags] = useState<string[]>([]);
    const [agrupamento, setAgrupamento] = useState<Agrupamento>('ambos');

    useEffect(() => {
        let cancelado = false;

        async function executar(): Promise<void> {
            try {
                const dados = await carregarInicial();
                if (cancelado) return;

                setAgrupamento(dados.agrupamento);
                setTags(dados.tags);

                if (dados.dataInicio && dados.dataFim) {
                    setDataInicio(dados.dataInicio);
                    setDataFim(dados.dataFim);
                } else {
                    const sugestao = ultimos30Dias();
                    setDataInicio(sugestao.dataInicio);
                    setDataFim(sugestao.dataFim);
                }
            } catch (erro) {
                if (!cancelado) {
                    notificarErro(erro, mensagemErroCarregar);
                    const sugestao = ultimos30Dias();
                    setDataInicio(sugestao.dataInicio);
                    setDataFim(sugestao.dataFim);
                }
            } finally {
                if (!cancelado) setCarregandoInicial(false);
            }
        }

        void executar();
        return () => {
            cancelado = true;
        };
    }, []);

    const periodoValido = periodoEhValido(dataInicio, dataFim);

    async function salvarEConsultar(): Promise<void> {
        setSemDados(false);
        setConsultando(true);
        try {
            try {
                await salvarParametros({ agrupamento, tags, dataInicio, dataFim });
                notificarSucesso('Parâmetros salvos.');
            } catch (erro) {
                notificarErro(erro, 'Não foi possível salvar os parâmetros');
                return;
            }

            try {
                const resposta = await executarConsulta(dataInicio, dataFim, forcarConsultaApi);
                if (temDadoAproveitavel(resposta)) {
                    onConcluida(resposta);
                } else {
                    setSemDados(true);
                }
            } catch (erro) {
                notificarErro(erro, 'Não foi possível consultar o Toggl');
            }
        } finally {
            setConsultando(false);
        }
    }

    function aoClicarConsultar(): void {
        if (!periodoValido) {
            notificarErro(new Error('A data fim não pode ser anterior à data início.'));
            return;
        }
        if (forcarConsultaApi) {
            setConfirmandoConsultaForcada(true);
            return;
        }
        void salvarEConsultar();
    }

    function confirmarConsultaForcada(): void {
        setConfirmandoConsultaForcada(false);
        void salvarEConsultar();
    }

    return (
        <Card variant="outlined">
            <CardContent>
                <Stack spacing={3}>
                    <Typography variant="h6">{titulo}</Typography>

                    <Typography variant="body2" color="text.secondary">
                        Agrupamento e tags para detalhar por descrição são definidos na seção Configurações.
                    </Typography>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                            label="Data início"
                            type="date"
                            value={dataInicio}
                            onChange={(evento) => setDataInicio(evento.target.value)}
                            disabled={carregandoInicial || consultando}
                            slotProps={{ inputLabel: { shrink: true } }}
                            fullWidth />
                        <TextField
                            label="Data fim"
                            type="date"
                            value={dataFim}
                            onChange={(evento) => setDataFim(evento.target.value)}
                            disabled={carregandoInicial || consultando}
                            error={dataInicio !== '' && dataFim !== '' && !periodoValido}
                            helperText={
                                dataInicio !== '' && dataFim !== '' && !periodoValido
                                    ? 'A data fim não pode ser anterior à data início.'
                                    : undefined
                            }
                            slotProps={{ inputLabel: { shrink: true } }}
                            fullWidth />
                    </Stack>

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={forcarConsultaApi}
                                onChange={(evento) => setForcarConsultaApi(evento.target.checked)}
                                disabled={carregandoInicial || consultando} />
                        }
                        label="Forçar nova consulta à API (ignora o cache local)"
                        sx={{ mt: '0.5rem !important', ml: '-0.5rem !important' }} />

                    <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', mt: '0rem !important' }}>
                        <BotaoComCarregamento
                            variant="contained"
                            carregando={consultando}
                            disabled={carregandoInicial || !periodoValido || semUsuarios}
                            onClick={aoClicarConsultar}>
                            Consultar
                        </BotaoComCarregamento>
                    </Stack>

                    {semDados ? (
                        <Alert severity="warning">Nenhum usuário do Toggl retornou dados para este período.</Alert>
                    ) : undefined}
                </Stack>
            </CardContent>

            <DialogoConfirmacao
                aberto={confirmandoConsultaForcada}
                titulo="Forçar nova consulta à API?"
                mensagem="Isso ignora o cache local e consulta o Toggl de novo, consumindo o limite de 30 requisições/hora por usuário. Deseja continuar?"
                textoConfirmar="Consultar mesmo assim"
                textoCancelar="Não"
                focoNoCancelar
                onConfirmar={confirmarConsultaForcada}
                onCancelar={() => setConfirmandoConsultaForcada(false)}
            />
        </Card>
    );
}