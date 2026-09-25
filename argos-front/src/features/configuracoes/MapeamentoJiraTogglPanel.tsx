import type { ReactNode } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import type { AbaConfiguracoesProps } from './abas';
import RefreshIcon from '@mui/icons-material/Refresh';
import { BadgeSigla } from '../../components/BadgeSigla';
import { avaliarMapeamentoJiraToggl } from './completude';
import { ALTURA_CONTROLE, CORES, tema } from '../../theme';
import { useNotificacao } from '../../hooks/useNotificacao';
import { listarUsuariosJira } from '../../api/jiraListasApi';
import { useMapeamentoJiraToggl } from './useMapeamentoJiraToggl';
import type { EntradaMapeamentoJiraToggl } from '../../api/tipos';
import { useUsuariosToggl } from '../usuarios-toggl/useUsuariosToggl';
import { EsqueletoCarregando } from '../../components/EsqueletoCarregando';

import {
    Fragment,
    useState,
    useEffect,
    forwardRef,
    useImperativeHandle,
} from 'react';

import {
    Box,
    Alert,
    Stack,
    Table,
    Button,
    Select,
    Dialog,
    Tooltip,
    MenuItem,
    TableRow,
    TableBody,
    TableCell,
    TableHead,
    TextField,
    Typography,
    IconButton,
    DialogTitle,
    useMediaQuery,
    DialogContent,
    DialogActions,
    TableContainer,
} from '@mui/material';

export interface MapeamentoJiraTogglPanelHandle {
    salvar: () => Promise<boolean>;
}

const SEM_MAPEAMENTO = '';
const ENTRADA_VAZIA: EntradaMapeamentoJiraToggl = { chaveToggl: null, sigla: null, cor: null };
const COR_PADRAO_EXCLUSIVO: string = CORES.corIndisponivel;

export const MapeamentoJiraTogglPanel = forwardRef<MapeamentoJiraTogglPanelHandle, AbaConfiguracoesProps>(
    function MapeamentoJiraTogglPanel({ onAlterado, onValidoChange, salvando: salvandoTudo = false }, ref): ReactNode {
        const { dados: mapeamentoSalvo, carregando, carregado, salvando, carregar, salvar } = useMapeamentoJiraToggl();
        const { usuariosToggl, carregado: usuariosTogglCarregados, carregar: carregarUsuariosToggl } = useUsuariosToggl();
        const { notificarErro, notificarSucesso } = useNotificacao();

        const [nomesJira, setNomesJira] = useState<string[]>([]);
        const [carregandoLista, setCarregandoLista] = useState(false);
        const [listaJiraCarregada, setListaJiraCarregada] = useState(false);
        const [erroLista, setErroLista] = useState<string | null>(null);
        const [mapeamento, setMapeamento] = useState<Record<string, EntradaMapeamentoJiraToggl>>({});
        const [nomeEmEdicao, setNomeEmEdicao] = useState<string | null>(null);
        const [siglaEdicao, setSiglaEdicao] = useState('');
        const [corEdicao, setCorEdicao] = useState(COR_PADRAO_EXCLUSIVO);
        const duasColunas = useMediaQuery(tema.breakpoints.up('lg'));

        useEffect(() => {
            carregar()
                .then((dados) => setMapeamento(dados.mapeamento))
                .catch((erro: unknown) => notificarErro(erro, 'Não foi possível carregar o mapeamento Jira ↔ Toggl'));

            carregarUsuariosToggl().catch((erro: unknown) =>
                notificarErro(erro, 'Não foi possível listar os usuários do Toggl'));
        }, []);

        const avaliacao = avaliarMapeamentoJiraToggl(mapeamento, usuariosToggl);
        const mapeamentoValido = mapeamentoSalvo === null || avaliacao.completo;

        useEffect(() => {
            onValidoChange?.(mapeamentoValido);
        }, [mapeamentoValido]);

        async function carregarListaJira(forcarAtualizacao: boolean): Promise<void> {
            setCarregandoLista(true);
            setErroLista(null);
            try {
                const resposta = await listarUsuariosJira(forcarAtualizacao);
                setNomesJira(resposta.nomes);
            } catch (erro) {
                setErroLista(erro instanceof Error ? erro.message : 'Não foi possível carregar os usuários do Jira.');
            } finally {
                setCarregandoLista(false);
                setListaJiraCarregada(true);
            }
        }

        useEffect(() => {
            carregarListaJira(false).catch(() => { });
        }, []);

        async function salvarMapeamento(): Promise<boolean> {
            try {
                const atualizado = await salvar({ mapeamento });
                setMapeamento(atualizado.mapeamento);
                notificarSucesso('Configuração de mapeamento do Jira ↔ Toggl salvo com sucesso.');
                return true;
            } catch (erro) {
                notificarErro(erro, 'Não foi possível salvar o mapeamento Jira ↔ Toggl');
                return false;
            }
        }

        useImperativeHandle(ref, () => ({ salvar: salvarMapeamento }));

        function abrirEdicaoExclusivo(nome: string): void {
            const entrada = mapeamento[nome];
            setSiglaEdicao(entrada?.sigla ?? '');
            setCorEdicao(entrada?.cor || COR_PADRAO_EXCLUSIVO);
            setNomeEmEdicao(nome);
        }

        function confirmarEdicaoExclusivo(): void {
            if (nomeEmEdicao === null) return;
            const nome = nomeEmEdicao;
            const siglaLimpa = siglaEdicao.trim();
            setMapeamento((atual) => {
                if (!siglaLimpa) {
                    const { [nome]: _removido, ...resto } = atual;
                    return resto;
                }
                return { ...atual, [nome]: { chaveToggl: null, sigla: siglaLimpa, cor: corEdicao } };
            });
            onAlterado?.();
            setNomeEmEdicao(null);
        }

        if (!carregado || !usuariosTogglCarregados || !listaJiraCarregada) return <EsqueletoCarregando />;

        if (!mapeamentoSalvo) return undefined;

        const bloqueado = carregando || salvando || salvandoTudo;

        const nomesForaDaLista = Object.keys(mapeamento).filter((nome) => !nomesJira.includes(nome));
        const nomesTabela = [...nomesJira, ...nomesForaDaLista];

        return (
            <Stack spacing={2}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Tooltip title="Atualizar usuários reais do Jira">
                        <span>
                            <IconButton onClick={() => void carregarListaJira(true)} disabled={carregandoLista || bloqueado} aria-label="Atualizar lista">
                                <RefreshIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Alert severity="info" sx={{ py: 0, flexGrow: 1 }}>
                        Associa cada usuário do Jira (Responsável/Revisado por) a um usuário cadastrado na seção Toggl — ou, para
                        quem não tem conta no Toggl, define Sigla/Cor próprias para exibir o badge no Sprint.
                    </Alert>
                </Stack>

                {erroLista ? <Alert severity="warning">{erroLista}</Alert> : undefined}

                {nomesTabela.length === 0 && !carregandoLista ? (
                    <Typography variant="body2" color="text.secondary">
                        Nenhum usuário encontrado. Atualize a lista de usuários reais do Jira acima primeiro.
                    </Typography>
                ) : (
                    (() => {
                        const metade = duasColunas ? Math.ceil(nomesTabela.length / 2) : nomesTabela.length;
                        const colunaEsquerda = nomesTabela.slice(0, metade);
                        const colunaDireita = nomesTabela.slice(metade);

                        function celulasUsuario(nome: string | undefined, comBordaEsquerda: boolean): ReactNode {
                            if (nome === undefined) {
                                return (
                                    <>
                                        <TableCell sx={comBordaEsquerda ? { borderLeft: 1, borderColor: 'divider' } : undefined} />
                                        <TableCell />
                                        <TableCell />
                                    </>
                                );
                            }

                            const entrada = mapeamento[nome] ?? ENTRADA_VAZIA;
                            const chaveSelecionada = entrada.chaveToggl ?? SEM_MAPEAMENTO;
                            const usuarioSelecionado = usuariosToggl.find((usuario) => usuario.chave === chaveSelecionada);
                            const exclusivoDoJira = chaveSelecionada === SEM_MAPEAMENTO;

                            return (
                                <>
                                    <TableCell sx={comBordaEsquerda ? { borderLeft: 1, borderColor: 'divider' } : undefined}>
                                        <Tooltip title={nome}>
                                            <Typography variant="body2" noWrap sx={{ maxWidth: { xs: '5.5rem', sm: '9rem' } }}>
                                                {nome}
                                            </Typography>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>
                                        <Select
                                            size="small"
                                            fullWidth
                                            sx={{
                                                maxWidth: { xs: 150, sm: 'none' },
                                                '& .MuiSelect-select.MuiSelect-select': { display: 'flex', alignItems: 'center', boxSizing: 'border-box', height: ALTURA_CONTROLE, py: 0 },
                                            }}
                                            value={chaveSelecionada}
                                            disabled={bloqueado}
                                            onChange={(evento) => {
                                                const valor = evento.target.value;
                                                onAlterado?.();
                                                setMapeamento((atual) => {
                                                    if (valor === SEM_MAPEAMENTO) {
                                                        const atualEntrada = atual[nome];
                                                        if (!atualEntrada?.sigla) {
                                                            const { [nome]: _removido, ...resto } = atual;
                                                            return resto;
                                                        }
                                                        return { ...atual, [nome]: { chaveToggl: null, sigla: atualEntrada.sigla, cor: atualEntrada.cor } };
                                                    }
                                                    return { ...atual, [nome]: { chaveToggl: valor, sigla: null, cor: null } };
                                                });
                                            }}
                                            renderValue={() =>
                                                usuarioSelecionado ? (
                                                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                                        <BadgeSigla sigla={usuarioSelecionado.sigla} cor={usuarioSelecionado.cor} sx={{ borderRadius: 1 }} />
                                                        <Typography variant="body2" noWrap>{usuarioSelecionado.nomeExibicao}</Typography>
                                                    </Stack>
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">(sem mapeamento)</Typography>
                                                )
                                            }>
                                            <MenuItem value={SEM_MAPEAMENTO}>
                                                <Typography variant="body2" color="text.secondary">(sem mapeamento)</Typography>
                                            </MenuItem>
                                            {usuariosToggl.map((usuario) => (
                                                <MenuItem key={usuario.chave} value={usuario.chave}>
                                                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                                        <BadgeSigla sigla={usuario.sigla} cor={usuario.cor} sx={{ borderRadius: 1 }} />
                                                        <Typography variant="body2">{usuario.nomeExibicao}</Typography>
                                                    </Stack>
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        {exclusivoDoJira ? (
                                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                                <BadgeSigla sigla={entrada.sigla ?? ''} cor={entrada.cor ?? undefined} sx={{ borderRadius: 1 }} />
                                                <Tooltip title="Definir Sigla/Cor deste usuário exclusivo do Jira">
                                                    <IconButton size="small" onClick={() => abrirEdicaoExclusivo(nome)} disabled={bloqueado}>
                                                        <EditIcon fontSize="inherit" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        ) : (
                                            <BadgeSigla
                                                sigla={usuarioSelecionado?.sigla ?? ''}
                                                cor={usuarioSelecionado?.cor}
                                                sx={{ borderRadius: 1 }} />
                                        )}
                                    </TableCell>
                                </>
                            );
                        }

                        return (
                            <TableContainer sx={{ overflowX: 'auto' }}>
                                <Table size="small" sx={{ '& td, & th': { py: 0.5, px: { xs: 0.75, sm: 2 } } }}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ width: duasColunas ? '15%' : undefined }}>Usuário do Jira</TableCell>
                                            <TableCell sx={{ width: duasColunas ? '22%' : undefined, minWidth: { xs: 0, sm: 140 } }}>Usuário do Toggl</TableCell>
                                            <TableCell sx={{ width: duasColunas ? '13%' : undefined }}>Sigla / Cor</TableCell>
                                            {duasColunas ? (
                                                <>
                                                    <TableCell sx={{ width: '15%', borderLeft: 1, borderColor: 'divider' }}>Usuário do Jira</TableCell>
                                                    <TableCell sx={{ width: '22%', minWidth: 140 }}>Usuário do Toggl</TableCell>
                                                    <TableCell sx={{ width: '13%' }}>Sigla / Cor</TableCell>
                                                </>
                                            ) : undefined}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {colunaEsquerda.map((nome, indice) => (
                                            <TableRow key={nome}>
                                                <Fragment key="esquerda">{celulasUsuario(nome, false)}</Fragment>
                                                {duasColunas ? (
                                                    <Fragment key="direita">{celulasUsuario(colunaDireita[indice], true)}</Fragment>
                                                ) : undefined}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        );
                    })()
                )}

                {!avaliacao.completo ? (
                    <Alert severity="info">
                        <Stack spacing={0.5}>
                            <Typography variant="body2">
                                Associe todo usuário cadastrado no Toggl a um usuário do Jira e defina Sigla/Cor dos usuários
                                exclusivos do Jira para liberar Relatório, Gant, Sprint e Planejamento.
                            </Typography>
                            {avaliacao.usuariosTogglSemPar.length > 0 ? (
                                <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                                    <Typography variant="body2">Sem usuário do Jira:</Typography>
                                    {avaliacao.usuariosTogglSemPar.map((usuario) => (
                                        <Stack key={usuario.chave} direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                                            <BadgeSigla sigla={usuario.sigla} cor={usuario.cor} sx={{ borderRadius: 1 }} />
                                            <Typography variant="body2">{usuario.nomeExibicao}</Typography>
                                        </Stack>
                                    ))}
                                </Stack>
                            ) : undefined}
                            {avaliacao.entradasInvalidas.length > 0 ? (
                                <Typography variant="body2">
                                    Mapeamentos inválidos (usuário do Toggl removido ou sem Sigla): {avaliacao.entradasInvalidas.join(', ')}.
                                </Typography>
                            ) : undefined}
                        </Stack>
                    </Alert>
                ) : undefined}

                <Dialog open={nomeEmEdicao !== null} onClose={() => setNomeEmEdicao(null)} maxWidth="xs" fullWidth>
                    <DialogTitle>Sigla e cor — {nomeEmEdicao}</DialogTitle>
                    <DialogContent>
                        <Box sx={{ pt: 1 }}>
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    label="Sigla"
                                    value={siglaEdicao}
                                    onChange={(evento) => setSiglaEdicao(evento.target.value)}
                                    helperText="Ex.: JS, MRC — usada no badge do Sprint"
                                    fullWidth
                                    autoFocus />
                                <TextField
                                    label="Cor"
                                    type="color"
                                    value={corEdicao}
                                    onChange={(evento) => setCorEdicao(evento.target.value)}
                                    sx={{ width: 120 }} />
                            </Stack>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setNomeEmEdicao(null)}>Cancelar</Button>
                        <Button variant="contained" onClick={confirmarEdicaoExclusivo}>Confirmar</Button>
                    </DialogActions>
                </Dialog>
            </Stack>
        );
    },
);