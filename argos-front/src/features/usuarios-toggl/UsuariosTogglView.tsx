import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import { Alert, Stack } from '@mui/material';
import { UsuariosTogglPanel } from './UsuariosTogglPanel';
import type { UsuarioTogglResumo } from '../../api/tipos';

interface UsuariosTogglViewProps {
    onUsuariosAlterados?: () => void;
}

export function UsuariosTogglView({ onUsuariosAlterados }: UsuariosTogglViewProps): ReactNode {
    const [existeAdministrador, setExisteAdministrador] = useState(true);
    const listaInicialRecebida = useRef(false);

    function tratarUsuarios(usuarios: UsuarioTogglResumo[]): void {
        setExisteAdministrador(usuarios.some((usuario) => usuario.administrador));
        if (!listaInicialRecebida.current) {
            listaInicialRecebida.current = true;
            return;
        }
        onUsuariosAlterados?.();
    }

    return (
        <Stack spacing={2}>
            {!existeAdministrador ? (
                <Alert severity="info">
                    Cadastre pelo menos um usuário do Toggl marcado como Administrador — o token dele é usado para
                    listar as tags reais do workspace do Toggl.
                </Alert>
            ) : undefined}

            <UsuariosTogglPanel onUsuariosAlterados={tratarUsuarios} />
        </Stack>
    );
}