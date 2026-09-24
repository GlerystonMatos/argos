import SaveIcon from '@mui/icons-material/Save';
import type { ReactNode, RefObject } from 'react';
import { ORDEM_ABAS, ROTULOS_ABAS } from './abas';
import type { Secao } from '../../components/MenuLateral';
import { JiraCamposPanel } from '../jira/JiraCamposPanel';
import { useNotificacao } from '../../hooks/useNotificacao';
import { ConfiguracaoTogglTab } from './ConfiguracaoTogglTab';
import { CabecalhoView } from '../../components/CabecalhoView';
import { MapeamentoJiraTogglPanel } from './MapeamentoJiraTogglPanel';
import { ConfiguracaoJiraCoresTab } from './ConfiguracaoJiraCoresTab';
import type { AbaConfiguracoes, AbaConfiguracoesHandle } from './abas';
import { ConfiguracaoJiraStatusTab } from './ConfiguracaoJiraStatusTab';
import { ConfiguracaoJiraQuadroTab } from './ConfiguracaoJiraQuadroTab';
import { Box, Card, Tab, Tabs, Stack, CardContent } from '@mui/material';
import type { ResumoConfiguracao } from '../resumo/useResumoConfiguracao';
import { PreRequisitosConfiguracoes } from './PreRequisitosConfiguracoes';
import { EsqueletoCarregando } from '../../components/EsqueletoCarregando';
import { BotaoComCarregamento } from '../../components/BotaoComCarregamento';

import {
    useRef,
    useMemo,
    useState,
    forwardRef,
    useImperativeHandle,
} from 'react';

export interface ConfiguracoesViewHandle {
    salvarTudo: () => Promise<boolean>;
}

interface ConfiguracoesViewProps {
    resumo: ResumoConfiguracao;
    abaInicial?: AbaConfiguracoes;
    onNavegar: (secao: Secao, aba?: AbaConfiguracoes) => void;
    onSalvo: () => void;
}

function listarRotulos(abas: AbaConfiguracoes[]): string {
    return abas.map((aba) => ROTULOS_ABAS[aba]).join(', ');
}

export const ConfiguracoesView = forwardRef<ConfiguracoesViewHandle, ConfiguracoesViewProps>(
    function ConfiguracoesView({ resumo, abaInicial = 'toggl', onNavegar, onSalvo }, ref): ReactNode {
        const { carregado, carregando, existeUsuarioAdministrador, jiraConfigurado } = resumo;
        const { notificarErro, notificarInfo, notificarSucesso } = useNotificacao();

        const [aba, setAba] = useState<AbaConfiguracoes>(abaInicial);
        const [visitadas, setVisitadas] = useState<ReadonlySet<AbaConfiguracoes>>(() => new Set([abaInicial]));
        const [salvando, setSalvando] = useState(false);

        const sujoRef = useRef<Record<AbaConfiguracoes, boolean>>({
            'toggl': false, 'jira-campos': false, 'jira-status': false, 'jira-cores': false, 'jira-quadro': false, 'jira-toggl': false,
        });
        const validoRef = useRef<Record<AbaConfiguracoes, boolean>>({
            'toggl': true, 'jira-campos': true, 'jira-status': true, 'jira-cores': true, 'jira-quadro': true, 'jira-toggl': true,
        });
        const salvandoRef = useRef(false);

        const refsAbas: Record<AbaConfiguracoes, RefObject<AbaConfiguracoesHandle | null>> = {
            'toggl': useRef<AbaConfiguracoesHandle>(null),
            'jira-campos': useRef<AbaConfiguracoesHandle>(null),
            'jira-status': useRef<AbaConfiguracoesHandle>(null),
            'jira-cores': useRef<AbaConfiguracoesHandle>(null),
            'jira-quadro': useRef<AbaConfiguracoesHandle>(null),
            'jira-toggl': useRef<AbaConfiguracoesHandle>(null),
        };

        const callbacksAbas = useMemo(() => {
            const marcarAlterado = {} as Record<AbaConfiguracoes, () => void>;
            const definirValido = {} as Record<AbaConfiguracoes, (valido: boolean) => void>;
            for (const chave of ORDEM_ABAS) {
                marcarAlterado[chave] = (): void => {
                    sujoRef.current[chave] = true;
                };
                definirValido[chave] = (valido: boolean): void => {
                    validoRef.current[chave] = valido;
                };
            }
            return { marcarAlterado, definirValido };
        }, []);

        function abrirAba(novaAba: AbaConfiguracoes): void {
            setVisitadas((atual) => (atual.has(novaAba) ? atual : new Set(atual).add(novaAba)));
            setAba(novaAba);
        }

        async function salvarTudo(avisarSemAlteracao = false): Promise<boolean> {
            if (salvandoRef.current) return false;

            const alteradas = ORDEM_ABAS.filter((chave) => sujoRef.current[chave]);
            if (alteradas.length === 0) {
                if (avisarSemAlteracao) notificarInfo('Nenhuma alteração para salvar.');
                return true;
            }

            const incompletas = alteradas.filter((chave) => !validoRef.current[chave]);
            if (incompletas.length > 0) {
                notificarErro(new Error(`Preencha os campos obrigatórios em: ${listarRotulos(incompletas)}.`));
                abrirAba(incompletas[0]);
                return false;
            }

            salvandoRef.current = true;
            setSalvando(true);
            try {
                const falhas: AbaConfiguracoes[] = [];
                for (const chave of alteradas) {
                    const salvo = (await refsAbas[chave].current?.salvar()) ?? false;
                    if (salvo) {
                        sujoRef.current[chave] = false;
                    } else {
                        falhas.push(chave);
                    }
                }

                if (falhas.length < alteradas.length) onSalvo();

                if (falhas.length === 0) {
                    notificarSucesso('Configurações salvas.');
                } else {
                    notificarErro(new Error(`Não foi possível salvar: ${listarRotulos(falhas)}.`));
                }
                return falhas.length === 0;
            } finally {
                salvandoRef.current = false;
                setSalvando(false);
            }
        }

        useImperativeHandle(ref, () => ({ salvarTudo: () => salvarTudo() }));

        const liberado = existeUsuarioAdministrador && jiraConfigurado;

        if (!liberado) {
            if (!carregado || carregando) return <EsqueletoCarregando />;

            return (
                <PreRequisitosConfiguracoes
                    existeUsuarioAdministrador={existeUsuarioAdministrador}
                    jiraConfigurado={jiraConfigurado}
                    onNavegar={onNavegar} />
            );
        }

        function propsAba(chave: AbaConfiguracoes): {
            ref: RefObject<AbaConfiguracoesHandle | null>;
            onAlterado: () => void;
            onValidoChange: (valido: boolean) => void;
            salvando: boolean;
        } {
            return {
                ref: refsAbas[chave],
                onAlterado: callbacksAbas.marcarAlterado[chave],
                onValidoChange: callbacksAbas.definirValido[chave],
                salvando,
            };
        }

        function painel(chave: AbaConfiguracoes, conteudo: ReactNode): ReactNode {
            if (!visitadas.has(chave)) return undefined;
            return <Box sx={{ display: aba === chave ? 'block' : 'none' }}>{conteudo}</Box>;
        }

        return (
            <Card variant="outlined">
                <CardContent>
                    <Stack spacing={2}>
                        <CabecalhoView titulo="Configurações">
                            <BotaoComCarregamento
                                variant="contained"
                                startIcon={<SaveIcon />}
                                carregando={salvando}
                                onClick={() => void salvarTudo(true)}>
                                Salvar
                            </BotaoComCarregamento>
                        </CabecalhoView>

                        <Tabs
                            value={aba}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{ mt: '0rem !important' }}
                            onChange={(_, valor: AbaConfiguracoes) => abrirAba(valor)}>
                            {ORDEM_ABAS.map((chave) => <Tab key={chave} label={ROTULOS_ABAS[chave]} value={chave} />)}
                        </Tabs>

                        {painel('toggl', <ConfiguracaoTogglTab {...propsAba('toggl')} />)}
                        {painel('jira-campos', <JiraCamposPanel {...propsAba('jira-campos')} />)}
                        {painel('jira-status', <ConfiguracaoJiraStatusTab {...propsAba('jira-status')} />)}
                        {painel('jira-cores', <ConfiguracaoJiraCoresTab ref={refsAbas['jira-cores']} onAlterado={callbacksAbas.marcarAlterado['jira-cores']} salvando={salvando} />)}
                        {painel('jira-quadro', <ConfiguracaoJiraQuadroTab {...propsAba('jira-quadro')} />)}
                        {painel('jira-toggl', <MapeamentoJiraTogglPanel {...propsAba('jira-toggl')} />)}
                    </Stack>
                </CardContent>
            </Card>
        );
    },
);