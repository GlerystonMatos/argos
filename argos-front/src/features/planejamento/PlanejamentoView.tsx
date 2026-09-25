import type { ReactNode } from 'react';
import { ALTURA_CONTROLE } from '../../theme';
import { useEffect, useMemo, useState } from 'react';
import type { FiltrosPlanejamento } from './filtros';
import RefreshIcon from '@mui/icons-material/Refresh';
import type { TipoQuadroJira } from '../../api/tipos';
import { AvisoCache } from '../../components/AvisoCache';
import { CabecalhoView } from '../../components/CabecalhoView';
import type { EstadoPlanejamentoQuadro } from './usePlanejamento';
import { PlanejamentoGridCartoes } from './PlanejamentoGridCartoes';
import { DialogoConfirmacao } from '../../components/DialogoConfirmacao';
import { FiltroMultiSelecao } from '../../components/FiltroMultiSelecao';
import { EsqueletoCarregando } from '../../components/EsqueletoCarregando';
import { BotaoComCarregamento } from '../../components/BotaoComCarregamento';
import { formatarDataLocal, formatarDataHoraLocal } from '../../utils/datas';
import { PlanejamentoCardColaboradores } from './PlanejamentoCardColaboradores';
import { ROTULOS_URGENCIA_PREVISAO_LIBERACAO, type UrgenciaPrevisaoLiberacao } from '../../utils/previsaoLiberacao';

import {
    semFiltros,
    rotuloEpico,
    podarFiltros,
    FILTROS_VAZIOS,
    calcularOpcoes,
    filtrarCartoes,
    rotuloColaborador,
} from './filtros';

import {
    Box,
    Alert,
    Stack,
    Button,
    Tooltip,
    Checkbox,
    TextField,
    Typography,
    ToggleButton,
    FormControlLabel,
    ToggleButtonGroup,
} from '@mui/material';

interface PlanejamentoViewProps {
    titulo: string;
    quadro: TipoQuadroJira;
    analiseConfigurada: boolean;
    estado: EstadoPlanejamentoQuadro;
    coresStatus: Record<string, string>;
    coresPrioridade: Record<string, string>;
    coresColuna: Record<string, string>;
    coresTime: Record<string, string>;
    coresEpico: Record<string, string>;
    janelaAlertaPrevisaoLiberacaoDias: number;
    onTrocarQuadro: (quadro: TipoQuadroJira) => void;
    onAtualizar: () => void;
    onVoltar?: () => void;
}

export function PlanejamentoView({
    titulo,
    quadro,
    analiseConfigurada,
    estado,
    coresStatus,
    coresPrioridade,
    coresColuna,
    coresTime,
    coresEpico,
    janelaAlertaPrevisaoLiberacaoDias,
    onTrocarQuadro,
    onAtualizar,
    onVoltar,
}: PlanejamentoViewProps): ReactNode {
    const { resultado, carregando, erro, veioDoCache } = estado;
    const atualizadoEm = resultado?.atualizadoEm ?? null;
    const [filtrosAbertos, setFiltrosAbertos] = useState(false);
    const [filtros, setFiltros] = useState<FiltrosPlanejamento>(FILTROS_VAZIOS);
    const [termoBusca, setTermoBusca] = useState('');
    const [inverterFiltros, setInverterFiltros] = useState(false);
    const [confirmandoAtualizar, setConfirmandoAtualizar] = useState(false);

    const pronto = !carregando && resultado !== null;
    const exibeCartoes = resultado !== null && (resultado.kanban || resultado.sprintJiraNome !== null);

    useEffect(() => {
        setFiltros(FILTROS_VAZIOS);
        setTermoBusca('');
        setInverterFiltros(false);
    }, [quadro]);

    const opcoes = useMemo(
        () => (resultado ? calcularOpcoes(resultado, janelaAlertaPrevisaoLiberacaoDias) : null),
        [resultado, janelaAlertaPrevisaoLiberacaoDias],
    );

    useEffect(() => {
        if (opcoes) setFiltros((atual) => podarFiltros(atual, opcoes));
    }, [opcoes]);

    const rotulosColaborador = useMemo(
        () => new Map((resultado?.colaboradores ?? []).map(({ pessoa }) => [pessoa.nomeJira, rotuloColaborador(pessoa)])),
        [resultado],
    );

    const rotulosEpico = useMemo(
        () => new Map((opcoes?.epicos ?? []).map((grupoChave) => [grupoChave, resultado ? rotuloEpico(resultado, grupoChave) : grupoChave])),
        [resultado, opcoes],
    );

    const cartoesFiltrados = useMemo(
        () => filtrarCartoes(resultado?.cartoes ?? [], filtros, termoBusca, inverterFiltros, janelaAlertaPrevisaoLiberacaoDias),
        [resultado, filtros, termoBusca, inverterFiltros, janelaAlertaPrevisaoLiberacaoDias],
    );

    const filtrosVazios = semFiltros(filtros) && termoBusca.trim() === '' && !inverterFiltros;

    function limparFiltros(): void {
        setFiltros(FILTROS_VAZIOS);
        setTermoBusca('');
        setInverterFiltros(false);
    }

    const periodoJira = resultado?.sprintJiraInicio && resultado.sprintJiraFim
        ? ` (${formatarDataLocal(resultado.sprintJiraInicio)} – ${formatarDataLocal(resultado.sprintJiraFim)})`
        : '';

    return (
        <Stack spacing={2}>
            <CabecalhoView titulo={titulo}>
                <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={quadro}
                    aria-label="Quadro do Jira"
                    onChange={(_evento, novo: TipoQuadroJira | null) => {
                        if (novo) onTrocarQuadro(novo);
                    }}>
                    <ToggleButton value="dev">Dev</ToggleButton>
                    <Tooltip title={analiseConfigurada ? '' : 'Quadro de Análise não configurado (Jira → Conexão).'}>
                        <Box component="span" sx={{ display: 'inline-flex' }}>
                            <ToggleButton
                                value="analise"
                                disabled={!analiseConfigurada}>
                                Análise
                            </ToggleButton>
                        </Box>
                    </Tooltip>
                </ToggleButtonGroup>
                <Tooltip title="Busca os cartões do quadro selecionado ao vivo no Jira">
                    <span>
                        <BotaoComCarregamento
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            carregando={carregando && resultado !== null}
                            disabled={carregando}
                            onClick={() => setConfirmandoAtualizar(true)}>
                            Atualizar
                        </BotaoComCarregamento>
                    </span>
                </Tooltip>
                <BotaoComCarregamento onClick={() => setFiltrosAbertos((aberto) => !aberto)} disabled={!exibeCartoes}>
                    {filtrosAbertos ? 'Fechar filtros' : 'Filtros'}
                </BotaoComCarregamento>
                {onVoltar ? <BotaoComCarregamento onClick={onVoltar}>Voltar</BotaoComCarregamento> : undefined}
            </CabecalhoView>

            {filtrosAbertos && opcoes && exibeCartoes ? (
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    sx={{ flexWrap: { sm: 'wrap' }, gap: 1, alignItems: { xs: 'stretch', sm: 'flex-start' }, mt: '0.5rem !important', mb: '0.5rem !important' }}>
                    <TextField
                        label="Filtrar por código ou descrição"
                        value={termoBusca}
                        onChange={(e) => setTermoBusca(e.target.value)}
                        size="small"
                        sx={{ minWidth: { xs: 0, sm: 200 }, flex: 1 }} />
                    <FiltroMultiSelecao
                        label="Coluna"
                        placeholder="Todas"
                        opcoes={opcoes.colunas}
                        valor={filtros.colunas}
                        onChange={(colunas) => setFiltros((atual) => ({ ...atual, colunas }))} />
                    <FiltroMultiSelecao
                        label="Status"
                        placeholder="Todos"
                        opcoes={opcoes.status}
                        valor={filtros.status}
                        onChange={(status) => setFiltros((atual) => ({ ...atual, status }))} />
                    <FiltroMultiSelecao
                        label="Colaborador"
                        placeholder="Todos"
                        opcoes={opcoes.colaboradores}
                        valor={filtros.colaboradores}
                        getRotuloOpcao={(nomeJira) => rotulosColaborador.get(nomeJira) ?? nomeJira}
                        onChange={(colaboradores) => setFiltros((atual) => ({ ...atual, colaboradores }))} />
                    <FiltroMultiSelecao
                        label="Time"
                        placeholder="Todos"
                        opcoes={opcoes.times}
                        valor={filtros.times}
                        onChange={(times) => setFiltros((atual) => ({ ...atual, times }))} />
                    <FiltroMultiSelecao
                        label="Épico"
                        placeholder="Todos"
                        opcoes={opcoes.epicos}
                        valor={filtros.epicos}
                        getRotuloOpcao={(grupoChave) => rotulosEpico.get(grupoChave) ?? grupoChave}
                        onChange={(epicos) => setFiltros((atual) => ({ ...atual, epicos }))} />
                    <FiltroMultiSelecao
                        label="Prazo"
                        placeholder="Todos"
                        opcoes={opcoes.prazos}
                        valor={filtros.prazos}
                        getRotuloOpcao={(chave) => ROTULOS_URGENCIA_PREVISAO_LIBERACAO[chave as UrgenciaPrevisaoLiberacao] ?? chave}
                        onChange={(prazos) => setFiltros((atual) => ({ ...atual, prazos }))} />
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', height: ALTURA_CONTROLE, flexShrink: 0 }}>
                        <FormControlLabel
                            control={<Checkbox checked={inverterFiltros} onChange={(e) => setInverterFiltros(e.target.checked)} />}
                            label="Inverter filtros" />
                        <Button variant="outlined" onClick={limparFiltros} disabled={filtrosVazios}>
                            Limpar
                        </Button>
                    </Stack>
                </Stack>
            ) : undefined}

            {erro ? <Alert severity="error">{erro}</Alert> : undefined}

            {carregando && !erro ? <EsqueletoCarregando /> : undefined}

            {pronto ? (
                <Stack spacing={0.5} sx={{ mt: '0.25rem !important' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {`Quadro ${resultado.nomeQuadro}`}
                        {resultado.kanban ? ' · Quadro Kanban: todos os cartões do quadro' : resultado.sprintJiraNome ? ` · Sprint do Jira: ${resultado.sprintJiraNome}${periodoJira}` : undefined}
                    </Typography>
                    {atualizadoEm ? (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {`Atualizado em ${formatarDataHoraLocal(atualizadoEm)}`}
                        </Typography>
                    ) : undefined}
                </Stack>
            ) : undefined}

            {pronto && !exibeCartoes ? (
                <Alert severity="warning">{`Nenhum sprint ativo no quadro ${resultado.nomeQuadro}.`}</Alert>
            ) : undefined}

            {veioDoCache && pronto ? <AvisoCache /> : undefined}

            {pronto && resultado.colaboradores.length > 0 ? <PlanejamentoCardColaboradores resultado={resultado} /> : undefined}

            {pronto && exibeCartoes ? (
                <PlanejamentoGridCartoes
                    cartoes={cartoesFiltrados}
                    totalCartoes={resultado.cartoes.length}
                    coresStatus={coresStatus}
                    coresPrioridade={coresPrioridade}
                    coresColuna={coresColuna}
                    coresTime={coresTime}
                    coresEpico={coresEpico}
                    janelaAlertaPrevisaoLiberacaoDias={janelaAlertaPrevisaoLiberacaoDias} />
            ) : undefined}

            <DialogoConfirmacao
                aberto={confirmandoAtualizar}
                titulo="Atualizar planejamento?"
                mensagem={`Isso busca os cartões do quadro de ${quadro === 'dev' ? 'DEV' : 'Análise'} de novo, em tempo real, no Jira. Deseja continuar?`}
                textoConfirmar="Atualizar"
                textoCancelar="Cancelar"
                focoNoCancelar
                onConfirmar={() => {
                    setConfirmandoAtualizar(false);
                    onAtualizar();
                }}
                onCancelar={() => setConfirmandoAtualizar(false)}
            />
        </Stack>
    );
}