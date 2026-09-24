import { ErroApi } from '../../api/http';
import { useCallback, useEffect, useState } from 'react';
import { listarUsuarios } from '../../api/usuariosTogglApi';
import { obterCredencial, definirCredencial, limparCredencial } from '../../api/credencial';
import { esquecerLogin, lembrarLogin, recuperarLoginLembrado } from '../../api/loginLembrado';

interface ResultadoUseAuth {
    autenticado: boolean;
    verificando: boolean;
    entrando: boolean;
    erro: string | null;
    entrar: (usuario: string, senha: string, lembrar: boolean) => Promise<void>;
    sair: () => void;
}

async function verificarAcessoInicial(): Promise<boolean> {
    const lembrada = await recuperarLoginLembrado();
    if (lembrada !== null) {
        definirCredencial(lembrada);
        try {
            await listarUsuarios();
            return true;
        } catch {
            limparCredencial();
            return false;
        }
    }
    try {
        await listarUsuarios();
        return true;
    } catch {
        return false;
    }
}

export function useAuth(): ResultadoUseAuth {
    const [autenticado, setAutenticado] = useState(() => obterCredencial() !== null);
    const [verificando, setVerificando] = useState(() => obterCredencial() === null);
    const [entrando, setEntrando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    useEffect(() => {
        if (obterCredencial() !== null) {
            return;
        }

        verificarAcessoInicial()
            .then((ok) => setAutenticado(ok))
            .finally(() => setVerificando(false));
    }, []);

    useEffect(() => {
        function aoPerderAutenticacao(): void {
            void esquecerLogin();
            setAutenticado(false);
        }
        window.addEventListener('auth:necessaria', aoPerderAutenticacao);
        return () => window.removeEventListener('auth:necessaria', aoPerderAutenticacao);
    }, []);

    const entrar = useCallback(async (usuario: string, senha: string, lembrar: boolean): Promise<void> => {
        setEntrando(true);
        setErro(null);
        const credencial = btoa(`${usuario}:${senha}`);
        definirCredencial(credencial);
        try {
            await listarUsuarios();
            await (lembrar ? lembrarLogin(credencial) : esquecerLogin());
            setAutenticado(true);
        } catch (erroCapturado) {
            limparCredencial();
            setErro(
                erroCapturado instanceof ErroApi && erroCapturado.status === 401
                    ? 'Usuário ou senha inválidos.'
                    : 'Não foi possível conectar à API.',
            );
        } finally {
            setEntrando(false);
        }
    }, []);

    const sair = useCallback(() => {
        void esquecerLogin();
        limparCredencial();
        setAutenticado(false);
    }, []);

    return { autenticado, verificando, entrando, erro, entrar, sair };
}