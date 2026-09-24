import { useState } from 'react';
import { CORES } from '../../theme';
import type { FormEvent, ReactNode } from 'react';
import { CreditoApp } from '../../components/CreditoApp';
import { MarcaArgos } from '../../components/MarcaArgos';
import { podeLembrarLogin } from '../../api/loginLembrado';
import { BotaoComCarregamento } from '../../components/BotaoComCarregamento';
import { Alert, Box, Paper, Stack, Checkbox, TextField, FormControlLabel } from '@mui/material';

interface LoginScreenProps {
    entrando: boolean;
    erro: string | null;
    onEntrar: (usuario: string, senha: string, lembrar: boolean) => void;
}

export function LoginScreen({ entrando, erro, onEntrar }: LoginScreenProps): ReactNode {
    const [usuario, setUsuario] = useState('');
    const [senha, setSenha] = useState('');
    const [lembrar, setLembrar] = useState(false);
    const [lembrarDisponivel] = useState(podeLembrarLogin);

    function aoSubmeter(evento: FormEvent): void {
        evento.preventDefault();
        onEntrar(usuario, senha, lembrarDisponivel && lembrar);
    }

    return (
        <Box
            sx={{
                display: 'flex',
                minHeight: '100vh',
                px: 2,
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: CORES.navbarFundo,
            }}>
            <Paper variant="outlined" component="form" onSubmit={aoSubmeter} sx={{ p: { xs: 3, sm: 4 }, width: 360, maxWidth: '100%', boxSizing: 'border-box' }}>
                <Stack spacing={2}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'center', mb: '12px !important', mt: '-5px !important' }}>
                        <MarcaArgos corTexto="text.primary" />
                    </Stack>
                    <TextField
                        label="Usuário"
                        value={usuario}
                        onChange={(evento) => setUsuario(evento.target.value)}
                        autoComplete="username"
                        autoFocus
                        fullWidth
                        disabled={entrando} />
                    <TextField
                        label="Senha"
                        type="password"
                        value={senha}
                        onChange={(evento) => setSenha(evento.target.value)}
                        autoComplete="current-password"
                        fullWidth
                        disabled={entrando} />
                    {erro ? <Alert severity="error">{erro}</Alert> : undefined}
                    {lembrarDisponivel ? (
                        <FormControlLabel
                            control={
                                <Checkbox
                                    size="small"
                                    checked={lembrar}
                                    onChange={(evento) => setLembrar(evento.target.checked)}
                                    disabled={entrando} />
                            }
                            label="Lembrar login"
                            sx={{ mt: '0.25rem !important', ml: '-0.5rem !important' }} />
                    ) : undefined}
                    <BotaoComCarregamento
                        type="submit"
                        variant="contained"
                        carregando={entrando}
                        disabled={!usuario || !senha}
                        sx={lembrarDisponivel ? { mt: '0.25rem !important' } : undefined}>
                        Entrar
                    </BotaoComCarregamento>
                    <CreditoApp sx={{ textAlign: 'center', fontWeight: 700, fontSize: '0.75rem' }} />
                </Stack>
            </Paper>
        </Box>
    );
}