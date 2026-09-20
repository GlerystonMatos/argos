import type { ReactNode } from 'react';
import SaveIcon from '@mui/icons-material/Save';
import type { Secao } from '../../components/MenuLateral';
import { JiraCamposPanel } from '../jira/JiraCamposPanel';
import { ConfiguracaoTogglTab } from './ConfiguracaoTogglTab';
import { CabecalhoView } from '../../components/CabecalhoView';
import { Card, Tab, Tabs, Stack, CardContent } from '@mui/material';
import { MapeamentoJiraTogglPanel } from './MapeamentoJiraTogglPanel';
import { ConfiguracaoJiraCoresTab } from './ConfiguracaoJiraCoresTab';
import type { AbaConfiguracoes, AbaConfiguracoesHandle } from './abas';
import { ConfiguracaoJiraStatusTab } from './ConfiguracaoJiraStatusTab';
import type { ResumoConfiguracao } from '../resumo/useResumoConfiguracao';
import { PreRequisitosConfiguracoes } from './PreRequisitosConfiguracoes';
import { EsqueletoCarregando } from '../../components/EsqueletoCarregando';
import { BotaoComCarregamento } from '../../components/BotaoComCarregamento';
import { useCallback, useImperativeHandle, useRef, useState, forwardRef } from 'react';

export interface ConfiguracoesViewHandle {
    salvarAtual: () => Promise<boolean>;
}

interface ConfiguracoesViewProps {
    resumo: ResumoConfiguracao;
    abaInicial?: AbaConfiguracoes;
    onNavegar: (secao: Secao, aba?: AbaConfiguracoes) => void;
    onSalvo: () => void;
}

export const ConfiguracoesView = forwardRef<ConfiguracoesViewHandle, ConfiguracoesViewProps>(
    function ConfiguracoesView({ resumo, abaInicial = 'toggl', onNavegar, onSalvo }, ref): ReactNode {
        const { carregado, carregando, existeUsuarioAdministrador, jiraConfigurado } = resumo;

        const [aba, setAba] = useState<AbaConfiguracoes>(abaInicial);
        const [sujo, setSujo] = useState(false);
        const [salvando, setSalvando] = useState(false);

        const sujoRef = useRef(false);
        const salvandoRef = useRef(false);
        const refAba = useRef<AbaConfiguracoesHandle>(null);

        const marcarAlterado = useCallback((): void => {
            sujoRef.current = true;
            setSujo(true);
        }, []);

        async function salvarAtual(): Promise<boolean> {
            if (salvandoRef.current) return false;
            if (!sujoRef.current) return true;

            salvandoRef.current = true;
            setSalvando(true);
            try {
                const salvo = (await refAba.current?.salvar()) ?? false;
                if (salvo) {
                    sujoRef.current = false;
                    setSujo(false);
                    onSalvo();
                }
                return salvo;
            } finally {
                salvandoRef.current = false;
                setSalvando(false);
            }
        }

        useImperativeHandle(ref, () => ({ salvarAtual }));

        async function trocarAba(novaAba: AbaConfiguracoes): Promise<void> {
            if (novaAba === aba) return;
            if (await salvarAtual()) setAba(novaAba);
        }

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

        return (
            <Card variant="outlined">
                <CardContent>
                    <Stack spacing={2}>
                        <CabecalhoView titulo="Configurações">
                            <BotaoComCarregamento
                                variant="contained"
                                startIcon={<SaveIcon />}
                                carregando={salvando}
                                disabled={!sujo}
                                onClick={() => void salvarAtual()}>
                                Salvar
                            </BotaoComCarregamento>
                        </CabecalhoView>

                        <Tabs
                            value={aba}
                            variant="scrollable"
                            scrollButtons="auto"
                            onChange={(_, valor: AbaConfiguracoes) => void trocarAba(valor)}>
                            <Tab label="Toggl" value="toggl" />
                            <Tab label="Jira: Campos personalizados" value="jira-campos" />
                            <Tab label="Jira: Status" value="jira-status" />
                            <Tab label="Jira: Cores" value="jira-cores" />
                            <Tab label="Jira ↔ Toggl" value="jira-toggl" />
                        </Tabs>

                        {aba === 'toggl' ? <ConfiguracaoTogglTab ref={refAba} onAlterado={marcarAlterado} /> : undefined}
                        {aba === 'jira-campos' ? <JiraCamposPanel ref={refAba} onAlterado={marcarAlterado} /> : undefined}
                        {aba === 'jira-status' ? <ConfiguracaoJiraStatusTab ref={refAba} onAlterado={marcarAlterado} /> : undefined}
                        {aba === 'jira-cores' ? <ConfiguracaoJiraCoresTab ref={refAba} onAlterado={marcarAlterado} /> : undefined}
                        {aba === 'jira-toggl' ? <MapeamentoJiraTogglPanel ref={refAba} onAlterado={marcarAlterado} /> : undefined}
                    </Stack>
                </CardContent>
            </Card>
        );
    },
);