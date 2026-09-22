import { tema } from './theme';
import type { ReactNode } from 'react';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from './features/auth/useAuth';
import { RodapeApp } from './components/RodapeApp';
import { useEffect, useRef, useState } from 'react';
import { GantView } from './features/gant/GantView';
import LogoutIcon from '@mui/icons-material/Logout';
import type { Secao } from './components/MenuLateral';
import { MenuLateral } from './components/MenuLateral';
import { DadosView } from './features/dados/DadosView';
import { ResumoView } from './features/resumo/ResumoView';
import { LoginScreen } from './features/auth/LoginScreen';
import { SprintView } from './features/sprint/SprintView';
import { limparTachados } from './features/sprint/tachados';
import { SprintsPanel } from './features/sprint/SprintsPanel';
import { MarcaTogglReport } from './components/MarcaTogglReport';
import { JiraConexaoView } from './features/jira/JiraConexaoView';
import { RelatorioView } from './features/relatorio/RelatorioView';
import type { AbaConfiguracoes } from './features/configuracoes/abas';
import { useConsultaSprint } from './features/sprint/useConsultaSprint';
import { ParametrosGantForm } from './features/gant/ParametrosGantForm';
import { BotaoComCarregamento } from './components/BotaoComCarregamento';
import { ImportarDadosDialog } from './features/dados/ImportarDadosDialog';
import { PlanejamentoView } from './features/planejamento/PlanejamentoView';
import { lerMenuVisivel, gravarMenuVisivel } from './utils/preferenciasMenu';
import { ConsultaSprintDialog } from './features/sprint/ConsultaSprintDialog';
import { ConfiguracoesView } from './features/configuracoes/ConfiguracoesView';
import { UsuariosTogglView } from './features/usuarios-toggl/UsuariosTogglView';
import { useResumoConfiguracao } from './features/resumo/useResumoConfiguracao';
import type { Sprint, ConsultarResponse, OrigemConsultaSprint } from './api/tipos';
import { ParametrosRelatorioForm } from './features/relatorio/ParametrosRelatorioForm';
import type { ConfiguracoesViewHandle } from './features/configuracoes/ConfiguracoesView';
import { ProvedorNotificacao, useNotificacao, mensagemDeErro } from './hooks/useNotificacao';
import { atualizarPlanejamentoAoVivo } from './features/planejamento/atualizacoesPlanejamento';

import {
    Box,
    Alert,
    AppBar,
    Toolbar,
    Container,
    IconButton,
    CssBaseline,
    useMediaQuery,
    ThemeProvider,
} from '@mui/material';

type VisaoConsulta = 'parametros' | 'resultado';

type VisaoSprint = 'sprints' | 'acompanhamento' | 'planejamento';

const SECOES_DE_CONFIGURACAO: readonly Secao[] = ['resumo', 'toggl', 'jira', 'configuracoes'];

interface AppInternoProps {
    onSair: () => void;
}

function AppInterno({ onSair }: AppInternoProps): ReactNode {
    const [secao, setSecao] = useState<Secao>('resumo');
    const [menuMobileAberto, setMenuMobileAberto] = useState(false);
    const [menuVisivel, setMenuVisivel] = useState(() => lerMenuVisivel());
    const telaGrande = useMediaQuery(tema.breakpoints.up('md'));
    const [abaConfiguracoesInicial, setAbaConfiguracoesInicial] = useState<AbaConfiguracoes | undefined>(undefined);

    const [visaoRelatorio, setVisaoRelatorio] = useState<VisaoConsulta>('parametros');
    const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
    const [consultaConcluida, setConsultaConcluida] = useState<ConsultarResponse | null>(null);

    const [visaoGant, setVisaoGant] = useState<VisaoConsulta>('parametros');
    const [consultaGantConcluida, setConsultaGantConcluida] = useState<ConsultarResponse | null>(null);

    const [visaoSprint, setVisaoSprint] = useState<VisaoSprint>('sprints');
    const [consultaSprintAberta, setConsultaSprintAberta] = useState(false);
    const [sprintSelecionado, setSprintSelecionado] = useState<Sprint | null>(null);
    const [consultaSprintConcluida, setConsultaSprintConcluida] = useState<ConsultarResponse | null>(null);

    const consultaSprint = useConsultaSprint(sprintSelecionado?.chave ?? '');

    const { notificarAviso } = useNotificacao();
    const resumo = useResumoConfiguracao();
    const { recarregar, configuracaoCompleta, semUsuarios: semUsuariosToggl } = resumo;

    const refConfiguracoes = useRef<ConfiguracoesViewHandle>(null);
    const primeiroUsoVerificado = useRef(false);
    const [dialogoImportarAberto, setDialogoImportarAberto] = useState(false);

    useEffect(() => {
        recarregar()
            .then((lista) => {
                if (lista === null || primeiroUsoVerificado.current) return;
                primeiroUsoVerificado.current = true;
                if (lista.length === 0) setDialogoImportarAberto(true);
            })
            .catch(() => { });
    }, [secao, recarregar]);

    async function navegarComSalvamento(destino: Secao, aba?: AbaConfiguracoes): Promise<void> {
        if (secao === 'configuracoes') {
            const salvo = (await refConfiguracoes.current?.salvarTudo()) ?? true;
            if (!salvo) return;
        }
        setSecao(destino);
        setAbaConfiguracoesInicial(aba);
    }

    function alternarMenu(): void {
        if (!telaGrande) {
            setMenuMobileAberto(true);
            return;
        }
        const proximo = !menuVisivel;
        setMenuVisivel(proximo);
        gravarMenuVisivel(proximo);
    }

    function navegarPara(destino: Secao, aba?: AbaConfiguracoes): void {
        setMenuMobileAberto(false);
        if (telaGrande && menuVisivel) {
            setMenuVisivel(false);
            gravarMenuVisivel(false);
        }
        void navegarComSalvamento(destino, aba);
    }

    function alternarSelecao(chave: string): void {
        setSelecionados((atual) => {
            const novo = new Set(atual);
            if (novo.has(chave)) {
                novo.delete(chave);
            } else {
                novo.add(chave);
            }
            return novo;
        });
    }

    function escolherSprint(sprint: Sprint): void {
        if (sprint.chave !== sprintSelecionado?.chave) {
            setConsultaSprintConcluida(null);
            setVisaoSprint('sprints');
        }
        setSprintSelecionado(sprint);
    }

    function concluirConsultaSprint(resposta: ConsultarResponse, origemEfetiva: OrigemConsultaSprint): void {
        if (!sprintSelecionado) return;
        setConsultaSprintConcluida(resposta);
        if (!resposta.veioDoCache) {
            limparTachados(sprintSelecionado.chave);
        }
        setConsultaSprintAberta(false);
        setVisaoSprint('acompanhamento');
        if (!sprintSelecionado.fechado && (origemEfetiva === 'jira' || origemEfetiva === 'ambos')) {
            atualizarPlanejamentoEmSegundoPlano(sprintSelecionado.chave);
        }
    }

    // "Jira" e "Ambos" também atualizam o Planejamento, sem bloquear a entrada no Acompanhamento;
    // sem quadro de DEV configurado o passo é pulado em silêncio.
    function atualizarPlanejamentoEmSegundoPlano(chaveSprint: string): void {
        if (resumo.jiraQuadro === null) return;
        atualizarPlanejamentoAoVivo(chaveSprint).catch((erro: unknown) =>
            notificarAviso(`Não foi possível atualizar o Planejamento: ${mensagemDeErro(erro)}`),
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar position="static" color="primary" enableColorOnDark>
                <Toolbar>
                    <IconButton
                        color="inherit"
                        edge="start"
                        aria-label={telaGrande ? (menuVisivel ? 'esconder menu' : 'exibir menu') : 'abrir menu'}
                        aria-expanded={telaGrande ? menuVisivel : menuMobileAberto}
                        onClick={alternarMenu}
                        sx={{ mr: 1 }}>
                        <MenuIcon />
                    </IconButton>
                    <MarcaTogglReport sxImagem={{ mr: 1.5 }} onClick={() => navegarPara('resumo')} />
                    <Box sx={{ flexGrow: 1 }} />
                    <IconButton color="inherit" onClick={onSair} aria-label="sair">
                        <LogoutIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            <Box sx={{ display: 'flex', flexGrow: 1 }}>
                <MenuLateral
                    secaoAtiva={secao}
                    configuracaoCompleta={configuracaoCompleta}
                    mobileAberto={menuMobileAberto}
                    visivelDesktop={menuVisivel}
                    onSelecionar={navegarPara}
                    onFecharMobile={() => setMenuMobileAberto(false)} />

                <Box component="main" sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}>
                    <Container maxWidth={false} sx={{ py: 1, px: { xs: 1, sm: 2 } }}>
                        {semUsuariosToggl && secao !== 'toggl' ? (
                            <Alert
                                severity="warning"
                                sx={{ mb: 2 }}
                                action={
                                    <BotaoComCarregamento
                                        size="small"
                                        onClick={() => navegarPara('toggl')}>
                                        Cadastrar usuário do Toggl
                                    </BotaoComCarregamento>
                                }>
                                Nenhum usuário do Toggl cadastrado. Cadastre pelo menos um antes de continuar.
                            </Alert>
                        ) : undefined}

                        {resumo.carregado && !configuracaoCompleta && !SECOES_DE_CONFIGURACAO.includes(secao) ? (
                            <Alert
                                severity="warning"
                                sx={{ mb: 2 }}
                                action={
                                    <BotaoComCarregamento size="small" onClick={() => navegarPara('configuracoes')}>
                                        Ir para Configurações
                                    </BotaoComCarregamento>
                                }>
                                Complete as configurações obrigatórias para liberar Relatório, Gant e Sprint.
                            </Alert>
                        ) : undefined}

                        {secao === 'toggl' ? (
                            <UsuariosTogglView onUsuariosAlterados={() => { void recarregar(); }} />
                        ) : undefined}

                        {secao === 'jira' ? <JiraConexaoView onSalvo={() => { void recarregar(); }} /> : undefined}

                        {secao === 'resumo' ? <ResumoView resumo={resumo} onNavegar={navegarPara} /> : undefined}

                        {secao === 'configuracoes' ? (
                            <ConfiguracoesView
                                ref={refConfiguracoes}
                                resumo={resumo}
                                abaInicial={abaConfiguracoesInicial}
                                onNavegar={navegarPara}
                                onSalvo={() => { void recarregar(); }} />
                        ) : undefined}

                        {secao === 'dados' ? <DadosView /> : undefined}

                        {secao === 'relatorio' && configuracaoCompleta ? (
                            visaoRelatorio === 'resultado' && consultaConcluida ? (
                                <RelatorioView
                                    dataInicio={consultaConcluida.dataInicio}
                                    dataFim={consultaConcluida.dataFim}
                                    selecionados={selecionados}
                                    onAlternarSelecao={alternarSelecao}
                                    onVoltar={() => setVisaoRelatorio('parametros')}
                                    veioDoCache={consultaConcluida.veioDoCache} />
                            ) : (
                                <ParametrosRelatorioForm
                                    semUsuarios={semUsuariosToggl}
                                    onConcluida={(resposta) => {
                                        setConsultaConcluida(resposta);
                                        if (!resposta.veioDoCache) {
                                            setSelecionados(new Set());
                                        }
                                        setVisaoRelatorio('resultado');
                                    }} />
                            )
                        ) : undefined}

                        {secao === 'gant' && configuracaoCompleta ? (
                            visaoGant === 'resultado' && consultaGantConcluida ? (
                                <GantView
                                    dataInicio={consultaGantConcluida.dataInicio}
                                    dataFim={consultaGantConcluida.dataFim}
                                    onVoltar={() => setVisaoGant('parametros')}
                                    veioDoCache={consultaGantConcluida.veioDoCache} />
                            ) : (
                                <ParametrosGantForm
                                    semUsuarios={semUsuariosToggl}
                                    onConcluida={(resposta) => {
                                        setConsultaGantConcluida(resposta);
                                        setVisaoGant('resultado');
                                    }} />
                            )
                        ) : undefined}

                        {secao === 'sprint' && configuracaoCompleta ? (
                            <>
                                {(visaoSprint === 'acompanhamento' || visaoSprint === 'planejamento') && sprintSelecionado && consultaSprintConcluida ? (
                                    <>
                                        <Box sx={visaoSprint === 'planejamento' ? { height: 0, overflow: 'hidden', visibility: 'hidden' } : undefined}>
                                            <SprintView
                                                chaveSprint={sprintSelecionado.chave}
                                                veioDoCache={consultaSprintConcluida.veioDoCache}
                                                categorias={resumo.categorias}
                                                janelaAlertaPrevisaoLiberacaoDias={resumo.janelaAlertaPrevisaoLiberacaoDias}
                                                fechado={sprintSelecionado.fechado}
                                                onFechado={setSprintSelecionado}
                                                onPlanejar={() => setVisaoSprint('planejamento')}
                                                quadroConfigurado={resumo.jiraQuadro !== null}
                                                onConfigurarQuadro={() => navegarPara('jira')}
                                                onVoltar={() => setVisaoSprint('sprints')} />
                                        </Box>
                                        {visaoSprint === 'planejamento' ? (
                                            <PlanejamentoView
                                                sprint={sprintSelecionado}
                                                janelaAlertaPrevisaoLiberacaoDias={resumo.janelaAlertaPrevisaoLiberacaoDias}
                                                onVoltar={() => setVisaoSprint('acompanhamento')} />
                                        ) : undefined}
                                    </>
                                ) : (
                                    <SprintsPanel
                                        sprintSelecionadoChave={sprintSelecionado?.chave ?? null}
                                        onSelecionar={escolherSprint}
                                        onConfirmarSelecao={() => setConsultaSprintAberta(true)}
                                        semUsuarios={semUsuariosToggl} />
                                )}

                                {sprintSelecionado ? (
                                    <ConsultaSprintDialog
                                        aberto={consultaSprintAberta}
                                        sprint={sprintSelecionado}
                                        consulta={consultaSprint}
                                        onCancelar={() => setConsultaSprintAberta(false)}
                                        onConcluida={concluirConsultaSprint} />
                                ) : undefined}
                            </>
                        ) : undefined}
                    </Container>

                    <RodapeApp />
                </Box>
            </Box>

            <ImportarDadosDialog
                aberto={dialogoImportarAberto}
                onFechar={() => setDialogoImportarAberto(false)}
                onImportado={() => {
                    setDialogoImportarAberto(false);
                    void recarregar();
                }} />
        </Box>
    );
}

export default function App(): ReactNode {
    const { autenticado, verificando, entrando, erro, entrar, sair } = useAuth();

    return (
        <ThemeProvider theme={tema}>
            <CssBaseline />
            <ProvedorNotificacao>
                {verificando ? undefined : autenticado ? (
                    <AppInterno onSair={sair} />
                ) : (
                    <LoginScreen entrando={entrando} erro={erro} onEntrar={(usuario, senha) => void entrar(usuario, senha)} />
                )}
            </ProvedorNotificacao>
        </ThemeProvider>
    );
}