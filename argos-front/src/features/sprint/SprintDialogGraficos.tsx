import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { CORES, CORES_GRAFICO } from '../../theme';
import { formatarDuracao } from '../../utils/duracao';
import type { ResultadoSprint } from '../../api/tipos';
import { BotaoComCarregamento } from '../../components/BotaoComCarregamento';

import {
    Box,
    Tab,
    Tabs,
    Stack,
    Dialog,
    Typography,
    DialogTitle,
    useMediaQuery,
    DialogActions,
    DialogContent,
} from '@mui/material';

import type { Theme } from '@mui/material';

interface SprintDialogGraficosProps {
    resultado: ResultadoSprint;
    onFechar: () => void;
}

const ALTURA_PIZZA = 240;
const ALTURA_PIZZA_MOBILE = 200;
const LARGURA_EIXO_NOMES = 140;
const LARGURA_EIXO_SIGLAS = 48;

const ALTURA_BARRA_POR_COLABORADOR = 26;
const ROTULO_OUTRAS_TAGS = 'Outras';

type AbaGraficos = 'distribuicao' | 'colaboradores';

interface FatiaTag {
    id: string;
    label: string;
    value: number;
    color: string;
}

function formatarPercentual(valor: number, total: number): string {
    const percentual = total > 0 ? (valor / total) * 100 : 0;
    return `${percentual.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
}

function montarFatiasTag(tempoPorTag: ResultadoSprint['tempoPorTag']): FatiaTag[] {
    const principais = tempoPorTag.slice(0, CORES_GRAFICO.length);
    const restantes = tempoPorTag.slice(CORES_GRAFICO.length);
    const fatias: FatiaTag[] = principais.map((item, indice) => ({
        id: item.tag,
        label: item.tag,
        value: item.segundos,
        color: CORES_GRAFICO[indice],
    }));
    if (restantes.length > 0) {
        fatias.push({
            id: ROTULO_OUTRAS_TAGS,
            label: `${ROTULO_OUTRAS_TAGS} (${restantes.length})`,
            value: restantes.reduce((soma, item) => soma + item.segundos, 0),
            color: CORES.corIndisponivel,
        });
    }
    const total = fatias.reduce((soma, fatia) => soma + fatia.value, 0);
    return fatias.map((fatia) => ({
        ...fatia,
        label: `${fatia.label} — ${formatarDuracao(fatia.value)} (${formatarPercentual(fatia.value, total)})`,
    }));
}

interface LegendaFatiasProps {
    fatias: readonly { id: string; label: string; color: string }[];
}

function LegendaFatias({ fatias }: LegendaFatiasProps): ReactNode {
    return (
        <Stack spacing={0.5} component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
            {fatias.map((fatia) => (
                <Stack key={fatia.id} component="li" direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: fatia.color, flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ color: 'text.primary', overflowWrap: 'anywhere' }}>{fatia.label}</Typography>
                </Stack>
            ))}
        </Stack>
    );
}

interface BlocoGraficoProps {
    titulo: string;
    vazio: boolean;
    children: ReactNode;
}

function BlocoGrafico({ titulo, vazio, children }: BlocoGraficoProps): ReactNode {
    return (
        <Stack spacing={1} sx={{ flex: 1, minWidth: 0, p: { xs: 1, sm: 1.5 }, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="subtitle2">{titulo}</Typography>
            {vazio ? (
                <Typography variant="body2" color="text.secondary">Sem dados para exibir.</Typography>
            ) : children}
        </Stack>
    );
}

export function SprintDialogGraficos({ resultado, onFechar }: SprintDialogGraficosProps): ReactNode {
    const telaPequena = useMediaQuery((tema: Theme) => tema.breakpoints.down('sm'));
    const { cabecalho, colaboradores, tempoPorTag } = resultado;
    const [aba, setAba] = useState<AbaGraficos>('distribuicao');

    const totalSituacao = cabecalho.tarefasPendentes + cabecalho.tarefasConcluidas;

    const fatiasSituacao = useMemo(() => [
        { id: 'pendentes', rotulo: 'Pendentes', value: cabecalho.tarefasPendentes, color: CORES.corPendente },
        { id: 'concluidas', rotulo: 'Concluídas', value: cabecalho.tarefasConcluidas, color: CORES.corConcluido },
    ].map(({ rotulo, ...fatia }) => ({
        ...fatia,
        label: `${rotulo} — ${fatia.value} (${formatarPercentual(fatia.value, totalSituacao)})`,
    })), [cabecalho, totalSituacao]);

    const fatiasTag = useMemo(() => montarFatiasTag(tempoPorTag), [tempoPorTag]);
    const totalTag = useMemo(() => fatiasTag.reduce((soma, fatia) => soma + fatia.value, 0), [fatiasTag]);

    const colaboradoresComDemanda = useMemo(
        () => colaboradores.filter((c) => c.tarefasPendentes + c.tarefasConcluidas > 0),
        [colaboradores],
    );

    const siglaPorNome = useMemo(
        () => new Map(colaboradoresComDemanda.map((c) => [c.nomeExibicao, c.sigla])),
        [colaboradoresComDemanda],
    );

    return (
        <Dialog open onClose={onFechar} fullWidth maxWidth="lg" fullScreen={telaPequena}>
            <DialogTitle>Gráficos — {cabecalho.nome}</DialogTitle>
            <DialogContent sx={{ px: { xs: 1.5, sm: 3 } }}>
                <Tabs
                    value={aba}
                    onChange={(_evento, nova: AbaGraficos) => setAba(nova)}
                    variant="scrollable"
                    allowScrollButtonsMobile
                    sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Tab value="distribuicao" label="Pendências e tags" />
                    <Tab value="colaboradores" label="Demandas por colaborador" />
                </Tabs>

                {aba === 'distribuicao' ? (
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                        <BlocoGrafico titulo={`Pendentes x concluídas (${totalSituacao} demandas)`} vazio={totalSituacao === 0}>
                            <PieChart
                                height={telaPequena ? ALTURA_PIZZA_MOBILE : ALTURA_PIZZA}
                                hideLegend={telaPequena}
                                series={[{
                                    data: fatiasSituacao,
                                    innerRadius: 50,
                                    paddingAngle: 1,
                                    cornerRadius: 4,
                                    valueFormatter: (item) => `${item.value} demanda(s) (${formatarPercentual(item.value, totalSituacao)})`,
                                }]} />
                            {telaPequena ? <LegendaFatias fatias={fatiasSituacao} /> : undefined}
                        </BlocoGrafico>

                        <BlocoGrafico titulo="Tempo gasto por tag (todos os colaboradores)" vazio={fatiasTag.length === 0}>
                            <PieChart
                                height={telaPequena ? ALTURA_PIZZA_MOBILE : ALTURA_PIZZA}
                                hideLegend={telaPequena}
                                series={[{
                                    data: fatiasTag,
                                    innerRadius: 50,
                                    paddingAngle: 1,
                                    cornerRadius: 4,
                                    valueFormatter: (item) => `${formatarDuracao(item.value)} (${formatarPercentual(item.value, totalTag)})`,
                                }]} />
                            {telaPequena ? <LegendaFatias fatias={fatiasTag} /> : undefined}
                        </BlocoGrafico>
                    </Stack>
                ) : (
                    <BlocoGrafico titulo="Demandas por colaborador" vazio={colaboradoresComDemanda.length === 0}>
                        <Box sx={{ width: '100%' }}>
                            <BarChart
                                layout="horizontal"
                                height={Math.max(160, colaboradoresComDemanda.length * ALTURA_BARRA_POR_COLABORADOR + 80)}
                                yAxis={[{
                                    scaleType: 'band',
                                    data: colaboradoresComDemanda.map((c) => c.nomeExibicao),
                                    width: telaPequena ? LARGURA_EIXO_SIGLAS : LARGURA_EIXO_NOMES,
                                    valueFormatter: (nome: string, contexto) => (telaPequena && contexto.location === 'tick' ? siglaPorNome.get(nome) ?? nome : nome),
                                    categoryGapRatio: 0.45,
                                }]}
                                xAxis={[{ tickMinStep: 1 }]}
                                series={[
                                    {
                                        label: 'Concluídas',
                                        data: colaboradoresComDemanda.map((c) => c.tarefasConcluidas),
                                        stack: 'demandas',
                                        color: CORES.corConcluido,
                                    },
                                    {
                                        label: 'Pendentes',
                                        data: colaboradoresComDemanda.map((c) => c.tarefasPendentes),
                                        stack: 'demandas',
                                        color: CORES.corPendente,
                                    },
                                ]}
                                borderRadius={3} />
                        </Box>
                    </BlocoGrafico>
                )}
            </DialogContent>
            <DialogActions>
                <BotaoComCarregamento onClick={onFechar}>Fechar</BotaoComCarregamento>
            </DialogActions>
        </Dialog>
    );
}