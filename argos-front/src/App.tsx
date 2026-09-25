import { tema } from './theme';
import type { ReactNode } from 'react';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from './features/auth/useAuth';
import { RodapeApp } from './components/RodapeApp';
import { useEffect, useRef, useState } from 'react';
import { GantView } from './features/gant/GantView';
import LogoutIcon from '@mui/icons-material/Logout';
import { MarcaArgos } from './components/MarcaArgos';
import type { Secao } from './components/MenuLateral';
import { SobreDialog } from './components/SobreDialog';
import { MenuLateral } from './components/MenuLateral';
import { DadosView } from './features/dados/DadosView';
import { ResumoView } from './features/resumo/ResumoView';
import { LoginScreen } from './features/auth/LoginScreen';
import { SprintView } from './features/sprint/SprintView';
import { limparTachados } from './features/sprint/tachados';
import { ProvedorNotificacao } from './hooks/useNotificacao';
import { SprintsPanel } from './features/sprint/SprintsPanel';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { JiraConexaoView } from './features/jira/JiraConexaoView';
import { RelatorioView } from './features/relatorio/RelatorioView';
import { DialogoConfirmacao } from './components/DialogoConfirmacao';
import type { AbaConfiguracoes } from './features/configuracoes/abas';
import { EsqueletoCarregando } from './components/EsqueletoCarregando';
import { useConsultaSprint } from './features/sprint/useConsultaSprint';
import { ParametrosGantForm } from './features/gant/ParametrosGantForm';
import { BotaoComCarregamento } from './components/BotaoComCarregamento';
import { usePlanejamento } from './features/planejamento/usePlanejamento';
import { ImportarDadosDialog } from './features/dados/ImportarDadosDialog';
import { PlanejamentoView } from './features/planejamento/PlanejamentoView';
import type { Sprint, ConsultarResponse, TipoQuadroJira } from './api/tipos';
import { ConsultaSprintDialog } from './features/sprint/ConsultaSprintDialog';
import type { OrigemConsultaPlanejamento } from './components/origemConsulta';
import { ConfiguracoesView } from './features/configuracoes/ConfiguracoesView';
import { UsuariosTogglView } from './features/usuarios-toggl/UsuariosTogglView';
import { useResumoConfiguracao } from './features/resumo/useResumoConfiguracao';
import { ParametrosRelatorioForm } from './features/relatorio/ParametrosRelatorioForm';
import type { ConfiguracoesViewHandle } from './features/configuracoes/ConfiguracoesView';
import { ConsultaPlanejamentoDialog } from './features/planejamento/ConsultaPlanejamentoDialog';

import {
    Box,
    Alert,
    AppBar,
    Toolbar,
    Tooltip,
    Container,
    IconButton,
    CssBaseline,
    useMediaQuery,
    ThemeProvider,
    CircularProgress,
} from '@mui/material';

type VisaoConsulta = 'parametros' | 'resultado';

type VisaoSprint = 'sprints' | 'acompanhamento' | 'planejamento' | 'planejamentoListagem';

type EntradaPlanejamento = 'sprint' | 'listagem' | 'menu';

const SECOES_DE_CONFIGURACAO: readonly Secao[] = ['resumo', 'toggl', 'jira', 'configuracoes'];

const SECOES_COM_GATE: readonly Secao[] = ['relatorio', 'gant', 'sprint', 'planejamento'];

interface AppInternoProps {
    onSair: () => void;
}

function AppInterno({ onSair }: AppInternoProps): ReactNode {
    const [secao, setSecao] = useState<Secao>('resumo');
    const [menuMobileAberto, setMenuMobileAberto] = useState(false);
    const [sobreAberto, setSobreAberto] = useState(false);
    const [menuVisivel, setMenuVisivel] = useState(true);
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

    const [versaoConsultaSprint, setVersaoConsultaSprint] = useState(0);

    const consultaSprint = useConsultaSprint(sprintSelecionado?.chave ?? '');

    const planejamento = usePlanejamento();
    const [origemPlanejamento, setOrigemPlanejamento] = useState<OrigemConsultaPlanejamento>('nenhum');
    const [entradaPlanejamento, setEntradaPlanejamento] = useState<EntradaPlanejamento | null>(null);
    const [consultaPlanejamentoAberta, setConsultaPlanejamentoAberta] = useState(false);
    const [quadroPlanejamento, setQuadroPlanejamento] = useState<TipoQuadroJira>('dev');
    const [quadroDevPendente, setQuadroDevPendente] = useState(false);

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
        setMenuVisivel(!menuVisivel);
    }

    function navegarPara(destino: Secao, aba?: AbaConfiguracoes): void {
        setMenuMobileAberto(false);
        if (telaGrande) {
            setMenuVisivel(false);
        }
        void navegarComSalvamento(destino, aba);
    }

    function selecionarNoMenu(destino: Secao): void {
        if (destino === 'planejamento') {
            abrirPlanejamento('menu');
            return;
        }
        navegarPara(destino);
    }

    function abrirPlanejamento(entrada: EntradaPlanejamento): void {
        if (resumo.jiraQuadroDev === null) {
            setQuadroDevPendente(true);
            return;
        }
        setEntradaPlanejamento(entrada);
        setConsultaPlanejamentoAberta(true);
    }

    function consultarPlanejamento(forcar: boolean): Promise<void> {
        const emSegundoPlano: TipoQuadroJira[] = resumo.jiraQuadroAnalise !== null ? ['analise'] : [];
        return planejamento.consultar(forcar, 'dev', emSegundoPlano);
    }

    function concluirConsultaPlanejamento(): void {
        setConsultaPlanejamentoAberta(false);
        setQuadroPlanejamento('dev');
        if (entradaPlanejamento === 'sprint') setVisaoSprint('planejamento');
        if (entradaPlanejamento === 'listagem') setVisaoSprint('planejamentoListagem');
        if (entradaPlanejamento === 'menu') navegarPara('planejamento');
    }

    function renderizarPlanejamento(titulo: string, onVoltar?: () => void): ReactNode {
        return (
            <PlanejamentoView
                titulo={titulo}
                quadro={quadroPlanejamento}
                analiseConfigurada={resumo.jiraQuadroAnalise !== null}
                estado={planejamento.quadros[quadroPlanejamento]}
                coresStatus={resumo.coresStatus}
                coresPrioridade={resumo.coresPrioridade}
                coresColuna={quadroPlanejamento === 'dev' ? resumo.coresColunaDev : resumo.coresColunaAnalise}
                coresTime={resumo.coresTime}
                coresEpico={resumo.coresEpico}
                janelaAlertaPrevisaoLiberacaoDias={resumo.janelaAlertaPrevisaoLiberacaoDias}
                onTrocarQuadro={setQuadroPlanejamento}
                onAtualizar={() => void planejamento.atualizar(quadroPlanejamento)}
                onVoltar={onVoltar} />
        );
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

    function concluirConsultaSprint(resposta: ConsultarResponse): void {
        if (!sprintSelecionado) return;
        setConsultaSprintConcluida(resposta);
        setVersaoConsultaSprint((atual) => atual + 1);
        if (!resposta.veioDoCache) {
            limparTachados(sprintSelecionado.chave);
        }
        setConsultaSprintAberta(false);
        setVisaoSprint('acompanhamento');
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
                    <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                        <MarcaArgos sxImagem={{ mr: 1.5, height: 48, width: 48 }} onClick={() => navegarPara('resumo')} />
                        <Tooltip title="Sobre">
                            <IconButton
                                color="inherit"
                                size="small"
                                aria-label="sobre"
                                onClick={() => setSobreAberto(true)}
                                sx={{ ml: 0.5, mb: 1.875, p: 0.25 }}>
                                <InfoOutlinedIcon sx={{ fontSize: '1rem' }} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                    <Box sx={{ flexGrow: 1 }} />
                    <IconButton color="inherit" onClick={onSair} aria-label="sair">
                        <LogoutIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            <SobreDialog aberto={sobreAberto} onFechar={() => setSobreAberto(false)} />

            <Box sx={{ display: 'flex', flexGrow: 1 }}>
                <MenuLateral
                    secaoAtiva={secao}
                    configuracaoCompleta={configuracaoCompleta}
                    mobileAberto={menuMobileAberto}
                    visivelDesktop={menuVisivel}
                    onSelecionar={selecionarNoMenu}
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
                                Complete as configurações obrigatórias para liberar Relatório, Gant, Sprint e Planejamento.
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

                        {!resumo.carregado && SECOES_COM_GATE.includes(secao) ? <EsqueletoCarregando /> : undefined}

                        {secao === 'relatorio' && configuracaoCompleta ? (
                            visaoRelatorio === 'resultado' && consultaConcluida ? (
                                <RelatorioView
                                    dataInicio={consultaConcluida.dataInicio}
                                    dataFim={consultaConcluida.dataFim}
                                    selecionados={selecionados}
                                    onAlternarSelecao={alternarSelecao}
                                    onVoltar={() => setVisaoRelatorio('parametros')}
                                    veioDoCache={consultaConcluida.veioDoCache}
                                    urlDominioJira={resumo.jiraUrlDominio} />
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
                                    veioDoCache={consultaGantConcluida.veioDoCache}
                                    urlDominioJira={resumo.jiraUrlDominio} />
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
                                                sprint={sprintSelecionado}
                                                versaoConsulta={versaoConsultaSprint}
                                                veioDoCache={consultaSprintConcluida.veioDoCache}
                                                categorias={resumo.categorias}
                                                statusFinal={resumo.statusFinal}
                                                coresStatus={resumo.coresStatus}
                                                coresPrioridade={resumo.coresPrioridade}
                                                janelaAlertaPrevisaoLiberacaoDias={resumo.janelaAlertaPrevisaoLiberacaoDias}
                                                onAtualizar={() => setConsultaSprintAberta(true)}
                                                onPlanejar={() => abrirPlanejamento('sprint')}
                                                onVoltar={() => setVisaoSprint('sprints')}
                                                onSprintAtualizado={setSprintSelecionado} />
                                        </Box>
                                        {visaoSprint === 'planejamento'
                                            ? renderizarPlanejamento(`Planejamento — ${sprintSelecionado.nome}`, () => setVisaoSprint('acompanhamento'))
                                            : undefined}
                                    </>
                                ) : visaoSprint === 'planejamentoListagem' ? (
                                    renderizarPlanejamento('Planejamento', () => setVisaoSprint('sprints'))
                                ) : (
                                    <SprintsPanel
                                        sprintSelecionadoChave={sprintSelecionado?.chave ?? null}
                                        onSelecionar={escolherSprint}
                                        onConfirmarSelecao={() => setConsultaSprintAberta(true)}
                                        onPlanejar={() => abrirPlanejamento('listagem')}
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

                        {secao === 'planejamento' && configuracaoCompleta ? renderizarPlanejamento('Planejamento') : undefined}

                        <ConsultaPlanejamentoDialog
                            aberto={consultaPlanejamentoAberta}
                            origem={origemPlanejamento}
                            onOrigemChange={setOrigemPlanejamento}
                            consultar={consultarPlanejamento}
                            onCancelar={() => setConsultaPlanejamentoAberta(false)}
                            onConcluida={concluirConsultaPlanejamento} />

                        <DialogoConfirmacao
                            aberto={quadroDevPendente}
                            titulo="Quadro de DEV não configurado"
                            mensagem="O quadro de DEV do Jira ainda não foi configurado. Ir para Jira → Conexão para configurá-lo?"
                            textoConfirmar="Ir para Jira"
                            textoCancelar="Agora não"
                            onConfirmar={() => {
                                setQuadroDevPendente(false);
                                navegarPara('jira');
                            }}
                            onCancelar={() => setQuadroDevPendente(false)} />
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
                {verificando ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                        <CircularProgress aria-label="verificando acesso" />
                    </Box>
                ) : autenticado ? (
                    <AppInterno onSair={sair} />
                ) : (
                    <LoginScreen entrando={entrando} erro={erro} onEntrar={(usuario, senha, lembrar) => void entrar(usuario, senha, lembrar)} />
                )}
            </ProvedorNotificacao>
        </ThemeProvider>
    );
}