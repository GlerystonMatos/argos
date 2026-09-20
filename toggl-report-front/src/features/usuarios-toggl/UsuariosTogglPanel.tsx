import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useUsuariosToggl } from './useUsuariosToggl';
import { BadgeSigla } from '../../components/BadgeSigla';
import type { UsuarioTogglResumo } from '../../api/tipos';
import { useNotificacao } from '../../hooks/useNotificacao';
import { CabecalhoView } from '../../components/CabecalhoView';
import { UsuarioTogglFormDialog } from './UsuarioTogglFormDialog';
import { DialogoConfirmacao } from '../../components/DialogoConfirmacao';
import { BotaoComCarregamento } from '../../components/BotaoComCarregamento';

import {
    Card,
    Chip,
    Table,
    Alert,
    Stack,
    Checkbox,
    TableRow,
    TableBody,
    TableCell,
    TableHead,
    IconButton,
    CardContent,
    TableContainer,
} from '@mui/material';

const CELULA_ACOES_FIXA = {
    px: 1,
    right: 0,
    zIndex: 1,
    position: 'sticky',
    bgcolor: 'background.paper',
    borderColor: 'divider',
    borderLeft: { xs: 1, sm: 0 },
} as const;

interface UsuariosTogglPanelProps {
    onUsuariosAlterados?: (usuarios: UsuarioTogglResumo[]) => void;
}

export function UsuariosTogglPanel({ onUsuariosAlterados }: UsuariosTogglPanelProps = {}): ReactNode {
    const [dialogoAberto, setDialogoAberto] = useState(false);
    const [listaCarregada, setListaCarregada] = useState(false);
    const { notificarErro, notificarSucesso } = useNotificacao();
    const [removendoChave, setRemovendoChave] = useState<string | null>(null);
    const [usuarioEmEdicao, setUsuarioEmEdicao] = useState<UsuarioTogglResumo | null>(null);
    const { usuariosToggl: usuarios, carregando, carregar, editar, remover } = useUsuariosToggl();
    const [usuarioParaExcluir, setUsuarioParaExcluir] = useState<UsuarioTogglResumo | null>(null);

    useEffect(() => {
        carregar()
            .then(() => setListaCarregada(true))
            .catch((erro: unknown) => notificarErro(erro, 'Não foi possível listar os usuários do Toggl'));
    }, []);

    useEffect(() => {
        if (listaCarregada) onUsuariosAlterados?.(usuarios);
    }, [usuarios, listaCarregada]);

    function abrirParaCriar(): void {
        setUsuarioEmEdicao(null);
        setDialogoAberto(true);
    }

    function abrirParaEditar(usuario: UsuarioTogglResumo): void {
        setUsuarioEmEdicao(usuario);
        setDialogoAberto(true);
    }

    async function alternarSelecionado(usuario: UsuarioTogglResumo): Promise<void> {
        try {
            await editar(usuario.chave, { selecionado: !usuario.selecionado });
        } catch (erro) {
            notificarErro(erro, 'Não foi possível atualizar a seleção do usuário do Toggl');
        }
    }

    async function confirmarRemocao(): Promise<void> {
        if (!usuarioParaExcluir) return;
        setRemovendoChave(usuarioParaExcluir.chave);
        try {
            await remover(usuarioParaExcluir.chave);
            notificarSucesso(`Usuário do Toggl "${usuarioParaExcluir.nomeExibicao}" removido com sucesso.`);
            setUsuarioParaExcluir(null);
        } catch (erro) {
            notificarErro(erro, 'Não foi possível remover o usuário do Toggl');
        } finally {
            setRemovendoChave(null);
        }
    }

    return (
        <Card variant="outlined">
            <CardContent>
                <Stack spacing={2}>
                    <CabecalhoView titulo="Usuários">
                        <BotaoComCarregamento
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={abrirParaCriar}>
                            Adicionar
                        </BotaoComCarregamento>
                    </CabecalhoView>

                    {usuarios.length === 0 && !carregando ? (
                        <Alert severity="info">
                            Nenhum usuário do Toggl cadastrado ainda. Cadastre pelo menos um para poder consultar o Toggl.
                        </Alert>
                    ) : undefined}

                    {usuarios.length > 0 ? (
                        <TableContainer sx={{ mt: '0.5rem !important' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell padding="checkbox" />
                                        <TableCell sx={{ px: 1, width: '10%', whiteSpace: 'nowrap' }}>Nome</TableCell>
                                        <TableCell sx={{ px: 1, width: '7%', whiteSpace: 'nowrap' }}>Sigla</TableCell>
                                        <TableCell sx={{ px: 1, width: '9%', whiteSpace: 'nowrap' }}>Token</TableCell>
                                        <TableCell sx={{ px: 1, width: '1%', whiteSpace: 'nowrap' }}>Administrador</TableCell>
                                        <TableCell align="right" sx={CELULA_ACOES_FIXA}>Ações</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {usuarios.map((usuario) => (
                                        <TableRow key={usuario.chave}>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={usuario.selecionado}
                                                    onChange={() => void alternarSelecionado(usuario)}
                                                    aria-label="Incluir nas consultas" />
                                            </TableCell>
                                            <TableCell sx={{ px: 1 }}>{usuario.nomeExibicao}</TableCell>
                                            <TableCell sx={{ px: 1, whiteSpace: 'nowrap' }}>
                                                <BadgeSigla sigla={usuario.sigla} cor={usuario.cor} nome={usuario.nomeExibicao} sx={{ borderRadius: 1 }} />
                                            </TableCell>
                                            <TableCell sx={{ px: 1, whiteSpace: 'nowrap' }}>
                                                <Chip size="small" label={usuario.tokenMascarado} variant="outlined" />
                                            </TableCell>
                                            <TableCell sx={{ px: 1, whiteSpace: 'nowrap' }}>
                                                <Chip size="small" color={usuario.administrador ? 'primary' : 'error'} label={usuario.administrador ? 'Sim' : 'Não'} />
                                            </TableCell>
                                            <TableCell align="right" sx={CELULA_ACOES_FIXA}>
                                                <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                                                    <IconButton edge="end" onClick={() => abrirParaEditar(usuario)} aria-label="editar">
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        edge="end"
                                                        onClick={() => setUsuarioParaExcluir(usuario)}
                                                        disabled={removendoChave === usuario.chave}
                                                        aria-label="remover">
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : undefined}
                </Stack>
            </CardContent>

            <UsuarioTogglFormDialog
                aberto={dialogoAberto}
                usuarioEmEdicao={usuarioEmEdicao}
                onFechar={() => setDialogoAberto(false)}
                onSalvo={(mensagem) => {
                    carregar().catch((erro: unknown) => notificarErro(erro, 'Não foi possível atualizar a lista'));
                    notificarSucesso(mensagem);
                }} />

            <DialogoConfirmacao
                aberto={usuarioParaExcluir !== null}
                titulo="Remover usuário do Toggl"
                mensagem={`Tem certeza que deseja remover o usuário do Toggl "${usuarioParaExcluir?.nomeExibicao}"? Essa ação não pode ser desfeita.`}
                textoConfirmar="Remover"
                textoCancelar="Cancelar"
                corConfirmar="error"
                carregando={removendoChave === usuarioParaExcluir?.chave}
                onConfirmar={() => void confirmarRemocao()}
                onCancelar={() => setUsuarioParaExcluir(null)} />
        </Card>
    );
}