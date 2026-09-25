import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { ConsultaDialog } from './ConsultaDialog';
import { ROTULO_CONSULTAR } from './origemConsulta';
import { temDadoAproveitavel } from '../utils/consulta';
import { useNotificacao } from '../hooks/useNotificacao';
import { EsqueletoCarregando } from './EsqueletoCarregando';
import type { OrigemConsultaToggl } from './origemConsulta';
import { BotaoComCarregamento } from './BotaoComCarregamento';
import { periodoEhValido, ultimos30Dias } from '../utils/datas';
import { SeletorOrigemConsulta } from './SeletorOrigemConsulta';
import type { Agrupamento, ConsultarResponse } from '../api/tipos';

import {
    Card,
    Stack,
    TextField,
    Typography,
    CardContent,
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
    tituloConsulta: string;
    mensagemErroCarregar: string;
    carregarInicial: () => Promise<ParametrosCarregados>;
    salvarParametros: (dados: DadosParametros) => Promise<unknown>;
    executarConsulta: (dataInicio: string, dataFim: string, forcarConsultaApi: boolean) => Promise<ConsultarResponse>;
}

const OPCOES_ORIGEM: readonly OrigemConsultaToggl[] = ['nenhum', 'toggl'];

export function ParametrosFormBase({
    titulo,
    tituloConsulta,
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
    const [dialogoAberto, setDialogoAberto] = useState(false);
    const [origem, setOrigem] = useState<OrigemConsultaToggl>('nenhum');
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

    async function salvarEConsultar(forcarConsultaApi: boolean): Promise<void> {
        setSemDados(false);
        setConsultando(true);
        try {
            try {
                await salvarParametros({ agrupamento, tags, dataInicio, dataFim });
                notificarSucesso('Parâmetros salvos com sucesso.');
            } catch (erro) {
                notificarErro(erro, 'Não foi possível salvar os parâmetros');
                return;
            }

            try {
                const resposta = await executarConsulta(dataInicio, dataFim, forcarConsultaApi);
                if (temDadoAproveitavel(resposta)) {
                    setDialogoAberto(false);
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
        setSemDados(false);
        setOrigem('nenhum');
        setDialogoAberto(true);
    }

    function cancelarConsulta(): void {
        setSemDados(false);
        setDialogoAberto(false);
    }

    if (carregandoInicial) {
        return (
            <Card variant="outlined">
                <CardContent>
                    <Stack spacing={3}>
                        <Typography variant="h6">{titulo}</Typography>
                        <EsqueletoCarregando />
                    </Stack>
                </CardContent>
            </Card>
        );
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
                            required
                            label="Data início"
                            type="date"
                            value={dataInicio}
                            onChange={(evento) => setDataInicio(evento.target.value)}
                            disabled={carregandoInicial || consultando}
                            slotProps={{ inputLabel: { shrink: true } }}
                            fullWidth />
                        <TextField
                            required
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

                    <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                        <BotaoComCarregamento
                            variant="contained"
                            carregando={consultando}
                            disabled={carregandoInicial || !periodoValido || semUsuarios}
                            onClick={aoClicarConsultar}>
                            Consultar
                        </BotaoComCarregamento>
                    </Stack>
                </Stack>
            </CardContent>

            <ConsultaDialog
                aberto={dialogoAberto}
                titulo={tituloConsulta}
                consultando={consultando}
                rotuloConsultar={ROTULO_CONSULTAR[origem]}
                pedirConfirmacao={origem === 'toggl'}
                semDadoAproveitavel={semDados}
                onConsultar={() => void salvarEConsultar(origem === 'toggl')}
                onCancelar={cancelarConsulta}>
                <SeletorOrigemConsulta
                    opcoes={OPCOES_ORIGEM}
                    valor={origem}
                    disabled={consultando}
                    onChange={setOrigem}
                    descricao="Nenhum: usa o cache do Toggl quando disponível para o período. Toggl: força nova consulta ao Toggl, ignorando o cache." />
            </ConsultaDialog>
        </Card>
    );
}