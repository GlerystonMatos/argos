import { CORES } from '../../theme';
import type { ReactNode } from 'react';
import { ErroApi } from '../../api/http';
import { useEffect, useState } from 'react';
import { useUsuariosToggl } from './useUsuariosToggl';
import type { UsuarioTogglResumo } from '../../api/tipos';
import { useNotificacao } from '../../hooks/useNotificacao';
import { UsuarioTogglFormCampos } from './UsuarioTogglFormCampos';
import { BotaoComCarregamento } from '../../components/BotaoComCarregamento';

import {
    Alert,
    Stack,
    Dialog,
    DialogTitle,
    DialogActions,
    DialogContent,
} from '@mui/material';

const COR_PADRAO_USUARIO = CORES.accentAzul;

interface UsuarioFormDialogProps {
    aberto: boolean;
    usuarioEmEdicao: UsuarioTogglResumo | null;
    onFechar: () => void;
    onSalvo: (mensagem: string) => void;
}

export function UsuarioTogglFormDialog({
    aberto,
    usuarioEmEdicao,
    onFechar,
    onSalvo,
}: UsuarioFormDialogProps): ReactNode {
    const emEdicao = usuarioEmEdicao !== null;
    const { notificarErro } = useNotificacao();
    const [tokenApi, setTokenApi] = useState('');
    const [salvando, setSalvando] = useState(false);
    const [validando, setValidando] = useState(false);
    const { criar, editar, validar } = useUsuariosToggl();
    const [sigla, setSigla] = useState(usuarioEmEdicao?.sigla ?? '');
    const [cor, setCor] = useState(usuarioEmEdicao?.cor ?? COR_PADRAO_USUARIO);
    const [avisoSemValidacao, setAvisoSemValidacao] = useState<string | null>(null);
    const [resultadoValidacao, setResultadoValidacao] = useState<boolean | null>(null);
    const [nomeExibicao, setNomeExibicao] = useState(usuarioEmEdicao?.nomeExibicao ?? '');
    const [administrador, setAdministrador] = useState(usuarioEmEdicao?.administrador ?? false);

    useEffect(() => {
        if (aberto) {
            setNomeExibicao(usuarioEmEdicao?.nomeExibicao ?? '');
            setTokenApi('');
            setSigla(usuarioEmEdicao?.sigla ?? '');
            setCor(usuarioEmEdicao ? usuarioEmEdicao.cor : COR_PADRAO_USUARIO);
            setAdministrador(usuarioEmEdicao?.administrador ?? false);
            setResultadoValidacao(null);
            setAvisoSemValidacao(null);
        }
    }, [aberto, usuarioEmEdicao]);

    function fecharEResetar(): void {
        setNomeExibicao('');
        setTokenApi('');
        setSigla('');
        setCor(COR_PADRAO_USUARIO);
        setAdministrador(false);
        setResultadoValidacao(null);
        setAvisoSemValidacao(null);
        onFechar();
    }

    async function validarTokenDigitado(): Promise<void> {
        if (!tokenApi.trim()) return;
        setValidando(true);
        setResultadoValidacao(null);
        try {
            const valido = await validar(tokenApi.trim());
            setResultadoValidacao(valido);
        } catch (erro) {
            notificarErro(erro, 'Não foi possível validar o token');
        } finally {
            setValidando(false);
        }
    }

    async function salvar(ignorarValidacao: boolean): Promise<void> {
        setSalvando(true);
        setAvisoSemValidacao(null);
        try {
            if (emEdicao && usuarioEmEdicao) {
                await editar(usuarioEmEdicao.chave, {
                    nomeExibicao: nomeExibicao.trim() !== usuarioEmEdicao.nomeExibicao ? nomeExibicao.trim() : null,
                    tokenApi: tokenApi.trim() !== '' ? tokenApi.trim() : null,
                    ignorarValidacao,
                    sigla: sigla.trim(),
                    cor,
                    administrador,
                });
            } else {
                await criar({
                    nomeExibicao: nomeExibicao.trim(),
                    tokenApi: tokenApi.trim(),
                    ignorarValidacao,
                    sigla: sigla.trim(),
                    cor,
                    selecionado: true,
                    administrador,
                });
            }
            onSalvo(emEdicao ? 'Usuário do Toggl atualizado com sucesso.' : 'Usuário do Toggl cadastrado com sucesso.');
            fecharEResetar();
        } catch (erro) {
            if (erro instanceof ErroApi && erro.status === 400 && !ignorarValidacao) {
                setAvisoSemValidacao(erro.message);
            } else {
                notificarErro(erro, 'Não foi possível salvar o usuário do Toggl');
            }
        } finally {
            setSalvando(false);
        }
    }

    const nomeValido = nomeExibicao.trim().length > 0;
    const tokenObrigatorioAusente = !emEdicao && tokenApi.trim().length === 0;
    const podeSalvar = nomeValido && !tokenObrigatorioAusente;

    return (
        <Dialog open={aberto} onClose={salvando ? undefined : fecharEResetar} fullWidth maxWidth="sm">
            <DialogTitle>{emEdicao ? 'Editar usuário do Toggl' : 'Adicionar usuário do Toggl'}</DialogTitle>
            <DialogContent sx={{ pb: '0rem !important' }}>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <UsuarioTogglFormCampos
                        nomeExibicao={nomeExibicao}
                        onNomeExibicaoChange={setNomeExibicao}
                        tokenApi={tokenApi}
                        onTokenApiChange={(valor) => {
                            setTokenApi(valor);
                            setResultadoValidacao(null);
                        }}
                        emEdicao={emEdicao}
                        tokenMascarado={usuarioEmEdicao?.tokenMascarado}
                        sigla={sigla}
                        onSigilaChange={setSigla}
                        cor={cor}
                        onCorChange={setCor}
                        administrador={administrador}
                        onAdministradorChange={setAdministrador}
                        salvando={salvando}
                        validando={validando}
                        resultadoValidacao={resultadoValidacao}
                        onValidarToken={() => void validarTokenDigitado()} />

                    {avisoSemValidacao ? (
                        <Alert
                            severity="warning"
                            action={
                                <BotaoComCarregamento
                                    color="inherit"
                                    size="small"
                                    carregando={salvando}
                                    onClick={() => void salvar(true)}>
                                    Salvar mesmo assim
                                </BotaoComCarregamento>
                            }>
                            {avisoSemValidacao}
                        </Alert>
                    ) : undefined}
                </Stack>
            </DialogContent>
            <DialogActions>
                <BotaoComCarregamento onClick={fecharEResetar} disabled={salvando}>
                    Cancelar
                </BotaoComCarregamento>
                <BotaoComCarregamento
                    variant="contained"
                    carregando={salvando}
                    disabled={!podeSalvar}
                    onClick={() => void salvar(false)}>
                    Salvar
                </BotaoComCarregamento>
            </DialogActions>
        </Dialog>
    );
}