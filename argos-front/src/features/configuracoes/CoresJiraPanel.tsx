import type { ReactNode } from 'react';
import { useCoresJira } from './useCoresJira';
import type { EpicoJira } from '../../api/tipos';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNotificacao } from '../../hooks/useNotificacao';
import { MapaCoresLista } from '../../components/MapaCoresLista';
import { Alert, IconButton, Stack, Tooltip } from '@mui/material';
import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';

import {
    listarTimesJira,
    listarEpicosJira,
    listarStatusJira,
    listarColunasJira,
    listarPrioridadesJira,
} from '../../api/jiraListasApi';

export interface CoresJiraPanelHandle {
    salvar: () => Promise<boolean>;
}

interface CoresJiraPanelProps {
    onAlterado?: () => void;
}

export const CoresJiraPanel = forwardRef<CoresJiraPanelHandle, CoresJiraPanelProps>(function CoresJiraPanel({ onAlterado }, ref): ReactNode {
    const { dados: cores, carregando, salvando, carregar, salvar } = useCoresJira();
    const { notificarErro } = useNotificacao();

    const [statusNomes, setStatusNomes] = useState<string[]>([]);
    const [prioridadeNomes, setPrioridadeNomes] = useState<string[]>([]);
    const [colunaNomes, setColunaNomes] = useState<string[]>([]);
    const [timeNomes, setTimeNomes] = useState<string[]>([]);
    const [epicos, setEpicos] = useState<EpicoJira[]>([]);
    const [carregandoListas, setCarregandoListas] = useState(false);
    const [erroListas, setErroListas] = useState<string | null>(null);

    const [coresStatus, setCoresStatus] = useState<Record<string, string>>({});
    const [coresPrioridade, setCoresPrioridade] = useState<Record<string, string>>({});
    const [coresColuna, setCoresColuna] = useState<Record<string, string>>({});
    const [coresTime, setCoresTime] = useState<Record<string, string>>({});
    const [coresEpico, setCoresEpico] = useState<Record<string, string>>({});

    useEffect(() => {
        carregar()
            .then((dados) => {
                setCoresStatus(dados.coresStatus);
                setCoresPrioridade(dados.coresPrioridade);
                setCoresColuna(dados.coresColuna);
                setCoresTime(dados.coresTime);
                setCoresEpico(dados.coresEpico);
            })
            .catch((erro: unknown) => notificarErro(erro, 'Não foi possível carregar o mapeamento de cores do Jira'));
    }, []);

    async function carregarListas(forcarAtualizacao: boolean): Promise<void> {
        setCarregandoListas(true);
        setErroListas(null);
        listarTimesJira()
            .then((times) => setTimeNomes(times.nomes))
            .catch(() => setTimeNomes([]));
        listarEpicosJira()
            .then((resposta) => setEpicos(resposta.epicos))
            .catch(() => setEpicos([]));
        try {
            const [status, prioridades, colunas] = await Promise.all([
                listarStatusJira(forcarAtualizacao),
                listarPrioridadesJira(forcarAtualizacao),
                listarColunasJira(forcarAtualizacao),
            ]);
            setStatusNomes(status.nomes);
            setPrioridadeNomes(prioridades.nomes);
            setColunaNomes(colunas.nomes);
        } catch (erro) {
            setErroListas(erro instanceof Error ? erro.message : 'Não foi possível carregar os status/prioridades/colunas do Jira.');
        } finally {
            setCarregandoListas(false);
        }
    }

    useEffect(() => {
        carregarListas(false).catch(() => { });
    }, []);

    async function salvarCores(): Promise<boolean> {
        try {
            const atualizado = await salvar({ coresStatus, coresPrioridade, coresColuna, coresTime, coresEpico });
            setCoresStatus(atualizado.coresStatus);
            setCoresPrioridade(atualizado.coresPrioridade);
            setCoresColuna(atualizado.coresColuna);
            setCoresTime(atualizado.coresTime);
            setCoresEpico(atualizado.coresEpico);
            return true;
        } catch (erro) {
            notificarErro(erro, 'Não foi possível salvar o mapeamento de cores do Jira');
            return false;
        }
    }

    useImperativeHandle(ref, () => ({ salvar: salvarCores }));

    if (!cores) return undefined;

    const nomesTime = [...new Set([...timeNomes, ...Object.keys(coresTime)])].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const rotulosEpico: Record<string, string> = Object.fromEntries(
        epicos.map((epico) => [epico.chave, epico.resumo ? `${epico.chave} — ${epico.resumo}` : epico.chave]),
    );
    const chavesEpico = [...new Set(epicos.map((epico) => epico.chave))]
        .sort((a, b) => (rotulosEpico[a] ?? a).localeCompare(rotulosEpico[b] ?? b, 'pt-BR'));

    return (
        <Stack spacing={2}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Tooltip title="Atualizar status, prioridades, colunas, times e épicos reais do Jira">
                    <span>
                        <IconButton onClick={() => void carregarListas(true)} disabled={carregandoListas} aria-label="Atualizar listas">
                            <RefreshIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
                <Alert severity="info" sx={{ py: 0, flexGrow: 1 }}>
                    Cores usadas nas badges de Situação e Prioridade do Sprint, e de Coluna, Time e Épico do Planejamento. Os nomes vêm direto do Jira; times e épicos, dos cartões já consultados no Planejamento.
                </Alert>
            </Stack>

            {erroListas ? <Alert severity="warning">{erroListas}</Alert> : undefined}

            <MapaCoresLista
                titulo="Cores por status:"
                nomes={statusNomes}
                cores={coresStatus}
                disabled={carregando || salvando}
                onChange={(nome, cor) => {
                    setCoresStatus((atual) => ({ ...atual, [nome]: cor }));
                    onAlterado?.();
                }} />

            <MapaCoresLista
                titulo="Cores por prioridade:"
                nomes={prioridadeNomes}
                cores={coresPrioridade}
                disabled={carregando || salvando}
                onChange={(nome, cor) => {
                    setCoresPrioridade((atual) => ({ ...atual, [nome]: cor }));
                    onAlterado?.();
                }} />

            <MapaCoresLista
                titulo="Cores por coluna:"
                nomes={colunaNomes}
                cores={coresColuna}
                disabled={carregando || salvando}
                onChange={(nome, cor) => {
                    setCoresColuna((atual) => ({ ...atual, [nome]: cor }));
                    onAlterado?.();
                }} />

            <MapaCoresLista
                titulo="Cores por time:"
                nomes={nomesTime}
                cores={coresTime}
                disabled={carregando || salvando}
                onChange={(nome, cor) => {
                    setCoresTime((atual) => ({ ...atual, [nome]: cor }));
                    onAlterado?.();
                }} />

            <MapaCoresLista
                titulo="Cores por épico:"
                nomes={chavesEpico}
                rotulos={rotulosEpico}
                cores={coresEpico}
                disabled={carregando || salvando}
                onChange={(chave, cor) => {
                    setCoresEpico((atual) => ({ ...atual, [chave]: cor }));
                    onAlterado?.();
                }} />
        </Stack>
    );
});