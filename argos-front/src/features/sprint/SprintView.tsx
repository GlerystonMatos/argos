import type { ReactNode } from 'react';
import { useSprint } from './useSprint';
import { fecharSprint } from '../../api/sprintsApi';
import { CORES, ALTURA_CONTROLE } from '../../theme';
import { contemTermo } from '../../utils/buscaTexto';
import RefreshIcon from '@mui/icons-material/Refresh';
import { SprintLinhaTarefa } from './SprintLinhaTarefa';
import { AvisoCache } from '../../components/AvisoCache';
import { useNotificacao } from '../../hooks/useNotificacao';
import { SprintCardCapacidade } from './SprintCardCapacidade';
import { CabecalhoView } from '../../components/CabecalhoView';
import { SprintCardColaboradores } from './SprintCardColaboradores';
import ViewKanbanIcon from '@mui/icons-material/ViewKanbanOutlined';
import { SprintDialogDetalheLinha } from './SprintDialogDetalheLinha';
import { lerTachados, gravarTachados, idLinhaTarefa } from './tachados';
import { DialogoConfirmacao } from '../../components/DialogoConfirmacao';
import { FiltroMultiSelecao } from '../../components/FiltroMultiSelecao';
import { SprintDialogHorasDeduzidas } from './SprintDialogHorasDeduzidas';
import { EsqueletoCarregando } from '../../components/EsqueletoCarregando';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { BotaoComCarregamento } from '../../components/BotaoComCarregamento';
import InsertChartOutlinedIcon from '@mui/icons-material/InsertChartOutlined';
import { useLarguraColunaRestante } from '../../hooks/useLarguraColunaRestante';

import {
    GRUPOS,
    contarDigitos,
    situacaoGrupo,
    formatarCodigo,
    ordemPrioridade,
    calcularColisaoPosicao,
} from './calculos';

import type {
    Sprint,
    CategoriasSprint,
    LinhaTarefaSprint,
    StatusFinalSprint,
    LinhaColaboradorSprint,
} from '../../api/tipos';

import {
    Box,
    Table,
    Alert,
    Stack,
    Button,
    Tooltip,
    Checkbox,
    TableRow,
    TextField,
    TableBody,
    TableCell,
    TableHead,
    TableContainer,
    FormControlLabel,
} from '@mui/material';

const NENHUMA = 'Nenhuma';

const SprintDialogGraficos = lazy(() =>
    import('./SprintDialogGraficos').then((modulo) => ({ default: modulo.SprintDialogGraficos })),
);

interface SprintViewProps {
    sprint: Sprint;
    versaoConsulta: number;
    veioDoCache: boolean;
    categorias: CategoriasSprint;
    statusFinal: StatusFinalSprint;
    coresStatus: Record<string, string>;
    coresPrioridade: Record<string, string>;
    janelaAlertaPrevisaoLiberacaoDias: number;
    onAtualizar: () => void;
    onPlanejar: () => void;
    onVoltar: () => void;
    onSprintAtualizado: (sprint: Sprint) => void;
}

const LARGURA_CELULA = '2.5rem';
const INDICE_COLUNA_DESCRICAO = 4;
const LARGURA_MINIMA_DESCRICAO = 100;
const MARGEM_SEGURANCA_DESCRICAO = 4;

export function SprintView({
    sprint,
    versaoConsulta,
    veioDoCache,
    categorias,
    statusFinal,
    coresStatus,
    coresPrioridade,
    janelaAlertaPrevisaoLiberacaoDias,
    onAtualizar,
    onPlanejar,
    onVoltar,
    onSprintAtualizado,
}: SprintViewProps): ReactNode {
    const chaveSprint = sprint.chave;
    const fechado = sprint.fechado;
    const [fechando, setFechando] = useState(false);
    const [termoBusca, setTermoBusca] = useState('');
    const { resultado, carregando, carregar } = useSprint();
    const corTag = categorias.corTag || CORES.corIndisponivel;
    const [filtrosAbertos, setFiltrosAbertos] = useState(false);
    const { notificarErro, notificarSucesso } = useNotificacao();
    const [graficosAbertos, setGraficosAbertos] = useState(false);
    const [inverterFiltros, setInverterFiltros] = useState(false);
    const [confirmandoFechar, setConfirmandoFechar] = useState(false);
    const [destacadas, setDestacadas] = useState<Set<string>>(new Set());
    const [filtroSituacoes, setFiltroSituacoes] = useState<string[]>([]);
    const [filtroPrioridades, setFiltroPrioridades] = useState<string[]>([]);
    const [filtroColaboradores, setFiltroColaboradores] = useState<string[]>([]);
    const [filtroSituacaoGrupos, setFiltroSituacaoGrupos] = useState<string[]>([]);
    const [tachados, setTachados] = useState<Set<string>>(() => lerTachados(chaveSprint));
    const [colaboradorDeducao, setColaboradorDeducao] = useState<LinhaColaboradorSprint | null>(null);
    const [linhaDetalhe, setLinhaDetalhe] = useState<{ linha: LinhaTarefaSprint; codigoDuplicado: boolean } | null>(null);
    const refTabela = useRef<HTMLTableElement>(null);

    useEffect(() => {
        carregar(chaveSprint).catch((erro: unknown) =>
            notificarErro(erro, 'Não foi possível carregar o acompanhamento do sprint'),
        );
    }, [chaveSprint, versaoConsulta, carregar, notificarErro]);

    useEffect(() => {
        setTachados(lerTachados(chaveSprint));
    }, [chaveSprint, versaoConsulta]);

    function alternarTachado(id: string): void {
        setTachados((atual) => {
            const novo = new Set(atual);
            if (novo.has(id)) {
                novo.delete(id);
            } else {
                novo.add(id);
            }
            gravarTachados(chaveSprint, novo);
            return novo;
        });
    }

    function alternarDestaque(id: string): void {
        setDestacadas((atual) => {
            const novo = new Set(atual);
            if (novo.has(id)) {
                novo.delete(id);
            } else {
                novo.add(id);
            }
            return novo;
        });
    }

    async function confirmarFechar(): Promise<void> {
        setFechando(true);
        try {
            const sprintAtualizado = await fecharSprint(chaveSprint);
            notificarSucesso('Sprint fechado. Os dados ficam travados e a consulta sempre usará o cache.');
            onSprintAtualizado(sprintAtualizado);
        } catch (erro) {
            notificarErro(erro, 'Não foi possível fechar o sprint');
        } finally {
            setFechando(false);
            setConfirmandoFechar(false);
        }
    }

    function aoSalvarDeducao(sprintAtualizado: Sprint): void {
        setColaboradorDeducao(null);
        onSprintAtualizado(sprintAtualizado);
        carregar(chaveSprint).catch((erro: unknown) =>
            notificarErro(erro, 'Não foi possível recalcular o acompanhamento do sprint'),
        );
    }

    const cabecalho = resultado?.cabecalho;
    const tarefas = resultado?.tarefas ?? [];
    const larguraCodigo = tarefas.reduce((maximo, tarefa) => Math.max(maximo, contarDigitos(tarefa.codigo)), 0);

    const colisaoPorLinha = useMemo(() => calcularColisaoPosicao(tarefas), [tarefas]);

    const tarefasComId = useMemo(() => {
        const ocorrenciasPorChave = new Map<string, number>();
        return tarefas.map((linha, indice) => {
            const chaveGrupo = `${linha.codigo}∙${linha.descricao}`;
            const indiceNoGrupo = ocorrenciasPorChave.get(chaveGrupo) ?? 0;
            ocorrenciasPorChave.set(chaveGrupo, indiceNoGrupo + 1);
            return {
                linha,
                id: idLinhaTarefa(linha.codigo, linha.descricao, indiceNoGrupo),
                codigoDuplicado: colisaoPorLinha[indice],
            };
        });
    }, [tarefas, colisaoPorLinha]);

    const opcoesPrioridade = useMemo(() => {
        const vistos = new Set<string>();
        tarefas.forEach((linha) => { if (!linha.agrupada) vistos.add(linha.prioridade ?? NENHUMA); });
        return Array.from(vistos).sort(
            (a, b) => ordemPrioridade(a === NENHUMA ? null : a) - ordemPrioridade(b === NENHUMA ? null : b),
        );
    }, [tarefas]);

    const opcoesSituacao = useMemo(() => {
        const vistos = new Set<string>();
        tarefas.forEach((linha) => { if (!linha.agrupada) vistos.add(linha.situacao ?? NENHUMA); });
        return Array.from(vistos).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    }, [tarefas]);

    const opcoesColaborador = useMemo(() => {
        const vistos = new Set<string>();
        tarefas.forEach((linha) => {
            [linha.dev, linha.rev, linha.qa].forEach((bloco) => {
                if (bloco.nomeExibicao) vistos.add(bloco.nomeExibicao);
            });
        });
        return Array.from(vistos).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    }, [tarefas]);

    const opcoesSituacaoGrupo = useMemo(() => {
        const vistos = new Set<string>();
        tarefas.forEach((linha) => {
            (['dev', 'rev', 'qa'] as const).forEach((grupo) => {
                if (linha[grupo].nomeExibicao) vistos.add(situacaoGrupo(linha, grupo));
            });
        });
        return Array.from(vistos).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    }, [tarefas]);

    const filtrosVazios = termoBusca.trim() === ''
        && filtroPrioridades.length === 0
        && filtroSituacoes.length === 0
        && filtroColaboradores.length === 0
        && filtroSituacaoGrupos.length === 0
        && !inverterFiltros;

    function limparFiltros(): void {
        setTermoBusca('');
        setFiltroPrioridades([]);
        setFiltroSituacoes([]);
        setFiltroColaboradores([]);
        setFiltroSituacaoGrupos([]);
        setInverterFiltros(false);
    }

    const tarefasFiltradas = useMemo(() => {
        // Casa o código cru ("TEL - 994") e o exibido com zeros à esquerda ("TEL - 0994").
        let lista = termoBusca.trim()
            ? tarefasComId.filter(({ linha }) => contemTermo(
                linha.codigo
                    ? [`${linha.codigo} ${linha.descricao}`, `${formatarCodigo(linha.codigo, larguraCodigo)} ${linha.descricao}`]
                    : linha.descricao,
                termoBusca,
            ))
            : tarefasComId;

        if (filtroPrioridades.length > 0) {
            lista = inverterFiltros
                ? lista.filter(({ linha }) => !linha.agrupada && !filtroPrioridades.includes(linha.prioridade ?? NENHUMA))
                : lista.filter(({ linha }) => !linha.agrupada && filtroPrioridades.includes(linha.prioridade ?? NENHUMA));
        }
        if (filtroSituacoes.length > 0) {
            lista = inverterFiltros
                ? lista.filter(({ linha }) => !linha.agrupada && !filtroSituacoes.includes(linha.situacao ?? NENHUMA))
                : lista.filter(({ linha }) => !linha.agrupada && filtroSituacoes.includes(linha.situacao ?? NENHUMA));
        }
        if (filtroColaboradores.length > 0 && filtroSituacaoGrupos.length > 0) {
            // Combinado: a linha só atende se o MESMO grupo (DEV/REV/QA) tiver o colaborador
            // selecionado E a situação selecionada — não basta um colaborador aparecer em algum
            // grupo e a situação selecionada aparecer em outro grupo qualquer da mesma linha.
            lista = inverterFiltros
                ? lista.filter(({ linha }) =>
                    (['dev', 'rev', 'qa'] as const).every((grupo) => {
                        const nome = linha[grupo].nomeExibicao;
                        return !(nome && filtroColaboradores.includes(nome) && filtroSituacaoGrupos.includes(situacaoGrupo(linha, grupo)));
                    }),
                )
                : lista.filter(({ linha }) =>
                    (['dev', 'rev', 'qa'] as const).some((grupo) => {
                        const nome = linha[grupo].nomeExibicao;
                        return !!nome && filtroColaboradores.includes(nome) && filtroSituacaoGrupos.includes(situacaoGrupo(linha, grupo));
                    }),
                );
        } else if (filtroColaboradores.length > 0) {
            lista = inverterFiltros
                ? lista.filter(({ linha }) =>
                    [linha.dev, linha.rev, linha.qa].every((bloco) => !bloco.nomeExibicao || !filtroColaboradores.includes(bloco.nomeExibicao)),
                )
                : lista.filter(({ linha }) =>
                    [linha.dev, linha.rev, linha.qa].some((bloco) => bloco.nomeExibicao && filtroColaboradores.includes(bloco.nomeExibicao)),
                );
        } else if (filtroSituacaoGrupos.length > 0) {
            lista = inverterFiltros
                ? lista.filter(({ linha }) =>
                    (['dev', 'rev', 'qa'] as const).every((grupo) => !linha[grupo].nomeExibicao || !filtroSituacaoGrupos.includes(situacaoGrupo(linha, grupo))),
                )
                : lista.filter(({ linha }) =>
                    (['dev', 'rev', 'qa'] as const).some((grupo) => linha[grupo].nomeExibicao && filtroSituacaoGrupos.includes(situacaoGrupo(linha, grupo))),
                );
        }

        return lista;
    }, [tarefasComId, larguraCodigo, termoBusca, filtroPrioridades, filtroSituacoes, filtroColaboradores, filtroSituacaoGrupos, inverterFiltros]);

    const colaboradores = resultado?.colaboradores ?? [];

    const carregandoTudo = carregando;
    const pronto = !carregandoTudo && resultado !== null;

    const larguraDescricao = useLarguraColunaRestante(
        refTabela,
        {
            indiceColuna: INDICE_COLUNA_DESCRICAO,
            larguraMinima: LARGURA_MINIMA_DESCRICAO,
            margemSeguranca: MARGEM_SEGURANCA_DESCRICAO,
            linhaMedicao: 'corpo',
        },
        [tarefasFiltradas, larguraCodigo],
    );

    return (
        <Stack spacing={2}>
            <CabecalhoView titulo="Acompanhamento do Sprint">
                {!fechado ? (
                    <BotaoComCarregamento
                        variant="outlined"
                        carregando={fechando}
                        onClick={() => setConfirmandoFechar(true)}>
                        Fechar
                    </BotaoComCarregamento>
                ) : undefined}
                <Tooltip title={fechado ? 'Sprint fechado: reabra na listagem de sprints para atualizar.' : ''}>
                    <Box component="span">
                        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={onAtualizar} disabled={fechado}>
                            Atualizar
                        </Button>
                    </Box>
                </Tooltip>
                <Button variant="outlined" startIcon={<InsertChartOutlinedIcon />} onClick={() => setGraficosAbertos(true)} disabled={!pronto}>
                    Gráficos
                </Button>
                <Button variant="outlined" startIcon={<ViewKanbanIcon />} onClick={onPlanejar}>
                    Planejar
                </Button>
                <BotaoComCarregamento onClick={() => setFiltrosAbertos((a) => !a)}>
                    {filtrosAbertos ? 'Fechar filtros' : 'Filtros'}
                </BotaoComCarregamento>
                <BotaoComCarregamento onClick={onVoltar}>Voltar</BotaoComCarregamento>
            </CabecalhoView>

            {filtrosAbertos ? (
                <Stack spacing={1} sx={{ mt: '0.5rem !important' }}>
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        sx={{ flexWrap: { sm: 'wrap' }, gap: 1, alignItems: { xs: 'stretch', sm: 'flex-start' } }}>
                        <TextField
                            label="Filtrar por código ou descrição"
                            value={termoBusca}
                            onChange={(e) => setTermoBusca(e.target.value)}
                            size="small"
                            sx={{ minWidth: { xs: 0, sm: 200 }, flex: 1 }} />
                        <FiltroMultiSelecao
                            label="Prioridade"
                            placeholder="Todas"
                            opcoes={opcoesPrioridade}
                            valor={filtroPrioridades}
                            onChange={setFiltroPrioridades} />
                        <FiltroMultiSelecao
                            label="Status"
                            placeholder="Todos"
                            opcoes={opcoesSituacao}
                            valor={filtroSituacoes}
                            onChange={setFiltroSituacoes} />
                    </Stack>
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        sx={{ flexWrap: { sm: 'wrap' }, gap: 1, alignItems: { xs: 'stretch', sm: 'flex-start' } }}>
                        <FiltroMultiSelecao
                            label="Colaborador"
                            placeholder="Todos"
                            opcoes={opcoesColaborador}
                            valor={filtroColaboradores}
                            onChange={setFiltroColaboradores} />
                        <FiltroMultiSelecao
                            label="Situação (DEV/REV/QA)"
                            placeholder="Todas"
                            helperText={
                                filtroColaboradores.length > 0
                                    ? 'Avalia só o grupo do(s) colaborador(es) selecionado(s) acima'
                                    : 'Sem colaborador selecionado, avalia qualquer grupo da linha'
                            }
                            opcoes={opcoesSituacaoGrupo}
                            valor={filtroSituacaoGrupos}
                            onChange={setFiltroSituacaoGrupos} />
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', height: ALTURA_CONTROLE, flexShrink: 0 }}>
                            <FormControlLabel
                                control={<Checkbox checked={inverterFiltros} onChange={(e) => setInverterFiltros(e.target.checked)} />}
                                label="Inverter filtros" />
                            <Button variant="outlined" onClick={limparFiltros} disabled={filtrosVazios}>
                                Limpar
                            </Button>
                        </Stack>
                    </Stack>
                </Stack>
            ) : undefined}

            {pronto && cabecalho ? <SprintCardCapacidade cabecalho={cabecalho} statusFinal={statusFinal} /> : undefined}

            {pronto && veioDoCache ? <AvisoCache /> : undefined}

            {carregandoTudo ? <EsqueletoCarregando /> : undefined}

            {pronto && colaboradores.length > 0 ? (
                <SprintCardColaboradores colaboradores={colaboradores} onDuploClique={setColaboradorDeducao} />
            ) : undefined}

            {pronto && tarefas.length === 0 ? (
                <Alert severity="warning">Nenhum apontamento encontrado para este sprint.</Alert>
            ) : undefined}

            {pronto && tarefas.length > 0 && tarefasFiltradas.length === 0 && !filtrosVazios ? (
                <Alert severity="info">Nenhuma linha corresponde ao filtro.</Alert>
            ) : undefined}

            {pronto && tarefasFiltradas.length > 0 ? (
                <TableContainer sx={{ overflowX: 'auto', mt: '0.5rem !important' }}>
                    <Table
                        ref={refTabela}
                        size="small"
                        sx={{
                            '& th, & td': { borderRight: 1, borderColor: 'divider', py: 0 },
                            '& th:last-of-type, & td:last-of-type': { borderRight: 0 },
                            '& tbody td:nth-of-type(-n+6), & thead tr:first-of-type th:nth-of-type(-n+6)': { borderRight: 0 },
                        }}>
                        <TableHead>
                            <TableRow>
                                <TableCell rowSpan={2} sx={{ py: 0.25, width: '1%', px: 0.5 }} />
                                <TableCell rowSpan={2} sx={{ py: 0.25, width: '1%', px: 0.5, whiteSpace: 'nowrap', verticalAlign: 'bottom' }}>
                                    Prioridade
                                </TableCell>
                                <TableCell rowSpan={2} align="center" sx={{ py: 0.25, width: '1%', px: 0.5, whiteSpace: 'nowrap', verticalAlign: 'bottom' }}>
                                    Status
                                </TableCell>
                                <TableCell rowSpan={2} align="center" sx={{ py: 0.25, width: '1%', px: 0.5, whiteSpace: 'nowrap', verticalAlign: 'bottom' }}>Código</TableCell>
                                <TableCell rowSpan={2} sx={{ py: 0.25, px: 0.8, verticalAlign: 'bottom' }}>Descrição</TableCell>
                                <TableCell rowSpan={2} align="center" sx={{ py: 0.25, width: '1%', px: 0.5, whiteSpace: 'nowrap', verticalAlign: 'bottom', borderLeft: 1, borderColor: 'divider' }}>Previsão</TableCell>
                                {GRUPOS.map((grupo) => (
                                    <TableCell
                                        key={grupo.rotulo}
                                        colSpan={4}
                                        align="center"
                                        sx={{ py: 0.25, borderLeft: 1, borderColor: 'divider' }}>
                                        {grupo.nomeLongo}
                                    </TableCell>
                                ))}
                            </TableRow>
                            <TableRow>
                                {GRUPOS.map((grupo) => [
                                    <TableCell
                                        key={`${grupo.rotulo}-pre`}
                                        align="center"
                                        sx={{ py: 0.25, px: 0.5, width: LARGURA_CELULA, whiteSpace: 'nowrap', borderLeft: 1, borderColor: 'divider' }}>
                                        <Tooltip title="Tempo previsto">
                                            <Box component="span">PRE</Box>
                                        </Tooltip>
                                    </TableCell>,
                                    <TableCell key={`${grupo.rotulo}-rea`} align="center" sx={{ py: 0.25, px: 0.5, width: LARGURA_CELULA, whiteSpace: 'nowrap' }}>
                                        <Tooltip title="Tempo realizado">
                                            <Box component="span">REA</Box>
                                        </Tooltip>
                                    </TableCell>,
                                    <TableCell key={`${grupo.rotulo}-badge`} align="center" sx={{ py: 0.25, px: 0.5, width: LARGURA_CELULA, whiteSpace: 'nowrap' }}>{grupo.rotulo}</TableCell>,
                                    <TableCell key={`${grupo.rotulo}-sit`} align="center" sx={{ py: 0.25, px: 0.5, width: '1%', whiteSpace: 'nowrap' }}>Situação</TableCell>,
                                ])}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tarefasFiltradas.map(({ linha, id, codigoDuplicado }) => (
                                <SprintLinhaTarefa
                                    key={id}
                                    linha={linha}
                                    id={id}
                                    codigoDuplicado={codigoDuplicado}
                                    riscada={tachados.has(id)}
                                    onAlternarTachado={alternarTachado}
                                    destacada={destacadas.has(id)}
                                    onAlternarDestaque={alternarDestaque}
                                    onDuploClique={() => setLinhaDetalhe({ linha, codigoDuplicado })}
                                    larguraCodigo={larguraCodigo}
                                    larguraDescricao={larguraDescricao}
                                    coresStatus={coresStatus}
                                    coresPrioridade={coresPrioridade}
                                    corTag={corTag}
                                    janelaAlertaPrevisaoLiberacaoDias={janelaAlertaPrevisaoLiberacaoDias} />
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : undefined}

            <SprintDialogDetalheLinha
                aberto={linhaDetalhe !== null}
                onFechar={() => setLinhaDetalhe(null)}
                linha={linhaDetalhe?.linha ?? null}
                codigoDuplicado={linhaDetalhe?.codigoDuplicado ?? false}
                larguraCodigo={larguraCodigo}
                coresStatus={coresStatus}
                coresPrioridade={coresPrioridade}
                corTag={corTag} />

            <SprintDialogHorasDeduzidas
                colaborador={colaboradorDeducao}
                chaveSprint={sprint.chave}
                horasDeduzidas={sprint.horasDeduzidas}
                somenteLeitura={fechado}
                onFechar={() => setColaboradorDeducao(null)}
                onSalvo={aoSalvarDeducao} />

            {graficosAbertos && resultado ? (
                <Suspense fallback={undefined}>
                    <SprintDialogGraficos resultado={resultado} onFechar={() => setGraficosAbertos(false)} />
                </Suspense>
            ) : undefined}

            <DialogoConfirmacao
                aberto={confirmandoFechar}
                titulo="Fechar sprint"
                mensagem="Isso trava os dados atuais (Toggl e Jira) como definitivos para este sprint: novas consultas sempre usarão o cache já salvo, sem chamar a API de novo. Você pode reabrir depois na listagem de sprints. Deseja continuar?"
                textoConfirmar="Fechar"
                textoCancelar="Cancelar"
                focoNoCancelar
                carregando={fechando}
                onConfirmar={() => void confirmarFechar()}
                onCancelar={() => setConfirmandoFechar(false)} />
        </Stack>
    );
}