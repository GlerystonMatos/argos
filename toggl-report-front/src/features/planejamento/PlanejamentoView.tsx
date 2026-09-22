import type { ReactNode } from 'react';
import type { Sprint } from '../../api/tipos';
import { ALTURA_CONTROLE } from '../../theme';
import { usePlanejamento } from './usePlanejamento';
import { useEffect, useMemo, useState } from 'react';
import type { FiltrosPlanejamento } from './filtros';
import RefreshIcon from '@mui/icons-material/Refresh';
import { obterCoresJira } from '../../api/coresJiraApi';
import { AvisoCache } from '../../components/AvisoCache';
import { CabecalhoView } from '../../components/CabecalhoView';
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
    Alert,
    Stack,
    Button,
    Tooltip,
    Checkbox,
    Typography,
    FormControlLabel,
} from '@mui/material';

interface PlanejamentoViewProps {
    sprint: Sprint;
    onVoltar: () => void;
    janelaAlertaPrevisaoLiberacaoDias?: number;
}

export function PlanejamentoView({ sprint, onVoltar, janelaAlertaPrevisaoLiberacaoDias = 5 }: PlanejamentoViewProps): ReactNode {
    const { resultado, carregando, atualizando, erro, veioDoCache, atualizadoEm, semCache, atualizar } = usePlanejamento(sprint.chave);
    const [coresStatus, setCoresStatus] = useState<Record<string, string>>({});
    const [coresPrioridade, setCoresPrioridade] = useState<Record<string, string>>({});
    const [coresColuna, setCoresColuna] = useState<Record<string, string>>({});
    const [carregandoCores, setCarregandoCores] = useState(true);
    const [filtrosAbertos, setFiltrosAbertos] = useState(false);
    const [filtros, setFiltros] = useState<FiltrosPlanejamento>(FILTROS_VAZIOS);
    const [inverterFiltros, setInverterFiltros] = useState(false);
    const [confirmandoAtualizar, setConfirmandoAtualizar] = useState(false);

    useEffect(() => {
        obterCoresJira()
            .then((dados) => {
                setCoresStatus(dados.coresStatus);
                setCoresPrioridade(dados.coresPrioridade);
                setCoresColuna(dados.coresColuna);
            })
            .catch(() => { })
            .finally(() => setCarregandoCores(false));
    }, []);

    // "Pronto" combina a consulta principal (Toggl-like: cache/Jira) com as cores do Jira,
    // buscadas à parte — evita mostrar a grid/card com badges cinzas antes das cores chegarem.
    const carregandoTudo = carregando || carregandoCores;
    const pronto = !carregandoTudo && resultado !== null;

    useEffect(() => {
        setFiltros(FILTROS_VAZIOS);
        setInverterFiltros(false);
    }, [sprint.chave]);

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
        () => filtrarCartoes(resultado?.cartoes ?? [], filtros, inverterFiltros, janelaAlertaPrevisaoLiberacaoDias),
        [resultado, filtros, inverterFiltros, janelaAlertaPrevisaoLiberacaoDias],
    );

    const filtrosVazios = semFiltros(filtros) && !inverterFiltros;

    function limparFiltros(): void {
        setFiltros(FILTROS_VAZIOS);
        setInverterFiltros(false);
    }

    const periodoJira = resultado?.sprintJiraInicio && resultado.sprintJiraFim
        ? ` (${formatarDataLocal(resultado.sprintJiraInicio)} – ${formatarDataLocal(resultado.sprintJiraFim)})`
        : '';

    return (
        <Stack spacing={2}>
            <CabecalhoView titulo={`Planejamento — ${sprint.nome}`}>
                <Tooltip title={sprint.fechado ? 'Sprint fechado: o planejamento não é atualizado no Jira. Reabra o sprint para atualizar.' : 'Busca os cartões ao vivo no Jira'}>
                    <span>
                        <BotaoComCarregamento
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            carregando={atualizando}
                            disabled={sprint.fechado || carregando}
                            onClick={() => setConfirmandoAtualizar(true)}>
                            Atualizar
                        </BotaoComCarregamento>
                    </span>
                </Tooltip>
                <BotaoComCarregamento onClick={() => setFiltrosAbertos((aberto) => !aberto)} disabled={!resultado?.sprintJiraNome}>
                    {filtrosAbertos ? 'Fechar filtros' : 'Filtros'}
                </BotaoComCarregamento>
                <BotaoComCarregamento onClick={onVoltar}>Voltar</BotaoComCarregamento>
            </CabecalhoView>

            {filtrosAbertos && opcoes && resultado?.sprintJiraNome ? (
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    sx={{ flexWrap: { sm: 'wrap' }, gap: 1, alignItems: { xs: 'stretch', sm: 'flex-start' }, mt: '0.5rem !important' }}>
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

            {semCache ? (
                <Alert severity="warning">Este sprint está fechado e não tem planejamento salvo.</Alert>
            ) : undefined}

            {carregandoTudo && !erro && !semCache ? <EsqueletoCarregando /> : undefined}

            {pronto ? (
                <Stack spacing={0.5} sx={{ mt: '0.25rem !important' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {`Quadro ${resultado.nomeQuadro}`}
                        {resultado.sprintJiraNome ? ` · Sprint do Jira: ${resultado.sprintJiraNome}${periodoJira}` : undefined}
                    </Typography>
                    {atualizadoEm ? (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {`Atualizado em ${formatarDataHoraLocal(atualizadoEm)}`}
                        </Typography>
                    ) : undefined}
                </Stack>
            ) : undefined}

            {pronto && !resultado.sprintJiraNome ? (
                <Alert severity="warning">{`Nenhum sprint ativo no quadro ${resultado.nomeQuadro}.`}</Alert>
            ) : undefined}

            {veioDoCache && pronto ? <AvisoCache /> : undefined}

            {pronto && resultado.colaboradores.length > 0 ? <PlanejamentoCardColaboradores resultado={resultado} /> : undefined}

            {pronto && resultado.sprintJiraNome ? (
                <PlanejamentoGridCartoes
                    cartoes={cartoesFiltrados}
                    totalCartoes={resultado.cartoes.length}
                    coresStatus={coresStatus}
                    coresPrioridade={coresPrioridade}
                    coresColuna={coresColuna}
                    janelaAlertaPrevisaoLiberacaoDias={janelaAlertaPrevisaoLiberacaoDias} />
            ) : undefined}

            <DialogoConfirmacao
                aberto={confirmandoAtualizar}
                titulo="Atualizar planejamento?"
                mensagem="Isso busca os cartões de novo, em tempo real, no Jira. Deseja continuar?"
                textoConfirmar="Atualizar"
                textoCancelar="Cancelar"
                focoNoCancelar
                onConfirmar={() => {
                    setConfirmandoAtualizar(false);
                    void atualizar();
                }}
                onCancelar={() => setConfirmandoAtualizar(false)}
            />
        </Stack>
    );
}