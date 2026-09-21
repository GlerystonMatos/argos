import type { ReactNode } from 'react';
import ErrorIcon from '@mui/icons-material/Error';
import { IconeAjuda } from '../../components/IconeAjuda';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { BotaoComCarregamento } from '../../components/BotaoComCarregamento';

import {
    Alert,
    Stack,
    Switch,
    TextField,
    InputAdornment,
    FormControlLabel,
} from '@mui/material';

interface UsuarioTogglFormCamposProps {
    nomeExibicao: string;
    onNomeExibicaoChange: (valor: string) => void;
    tokenApi: string;
    onTokenApiChange: (valor: string) => void;
    emEdicao: boolean;
    tokenMascarado?: string;
    sigla: string;
    onSigilaChange: (valor: string) => void;
    cor: string;
    onCorChange: (valor: string) => void;
    administrador: boolean;
    onAdministradorChange: (valor: boolean) => void;
    salvando: boolean;
    validando: boolean;
    resultadoValidacao: boolean | null;
    onValidarToken: () => void;
    exibirErros: boolean;
}

export function UsuarioTogglFormCampos({
    nomeExibicao,
    onNomeExibicaoChange,
    tokenApi,
    onTokenApiChange,
    emEdicao,
    tokenMascarado,
    sigla,
    onSigilaChange,
    cor,
    onCorChange,
    administrador,
    onAdministradorChange,
    salvando,
    validando,
    resultadoValidacao,
    onValidarToken,
    exibirErros,
}: UsuarioTogglFormCamposProps): ReactNode {
    const erroNome = exibirErros && nomeExibicao.trim() === '';
    const erroToken = exibirErros && !emEdicao && tokenApi.trim() === '';
    const erroSigla = exibirErros && sigla.trim() === '';

    return (
        <>
            <TextField
                required
                label="Nome de exibição"
                value={nomeExibicao}
                onChange={(evento) => onNomeExibicaoChange(evento.target.value)}
                error={erroNome}
                helperText={erroNome ? 'Informe o nome de exibição.' : undefined}
                autoFocus
                fullWidth
                disabled={salvando} />
            <TextField
                required={!emEdicao}
                label="API Token"
                type="password"
                value={tokenApi}
                onChange={(evento) => onTokenApiChange(evento.target.value)}
                error={erroToken}
                helperText={erroToken ? 'Informe o API Token.' : undefined}
                placeholder={emEdicao ? `Atual: ${tokenMascarado} (deixe em branco para manter)` : undefined}
                slotProps={{
                    input: {
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconeAjuda titulo="Acesse track.toggl.com → ícone de perfil → Profile Settings → role até o final da página para ver o API Token." />
                            </InputAdornment>
                        ),
                    },
                }}
                fullWidth
                disabled={salvando} />

            <Stack direction="row" spacing={2}>
                <TextField
                    required
                    label="Sigla"
                    value={sigla}
                    onChange={(evento) => onSigilaChange(evento.target.value)}
                    error={erroSigla}
                    helperText={erroSigla ? 'Informe a sigla.' : 'Ex.: JS, MRC — usada nas células do Gant'}
                    fullWidth
                    disabled={salvando} />
                <TextField
                    label="Cor"
                    type="color"
                    value={cor}
                    onChange={(evento) => onCorChange(evento.target.value)}
                    sx={{ width: 120 }}
                    disabled={salvando} />
            </Stack>

            <FormControlLabel
                control={<Switch checked={administrador} onChange={(evento) => onAdministradorChange(evento.target.checked)} disabled={salvando} />}
                label="Administrador (token usado nas chamadas que não são de uma pessoa específica, como listar tags do Toggl)" />

            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <BotaoComCarregamento
                    variant="outlined"
                    carregando={validando}
                    disabled={!tokenApi.trim() || salvando}
                    onClick={onValidarToken}>
                    Validar token
                </BotaoComCarregamento>
                {resultadoValidacao === true ? (
                    <Alert icon={<CheckCircleIcon fontSize="inherit" />} severity="success" sx={{ py: 0 }}>
                        Token válido
                    </Alert>
                ) : undefined}
                {resultadoValidacao === false ? (
                    <Alert icon={<ErrorIcon fontSize="inherit" />} severity="warning" sx={{ py: 0 }}>
                        Token inválido
                    </Alert>
                ) : undefined}
            </Stack>
        </>
    );
}