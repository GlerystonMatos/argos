import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useNotificacao } from '../../hooks/useNotificacao';
import { atualizarHorasDeduzidas } from '../../api/sprintsApi';
import type { Sprint, LinhaColaboradorSprint } from '../../api/tipos';
import { BotaoComCarregamento } from '../../components/BotaoComCarregamento';

import {
    Alert,
    Stack,
    Dialog,
    TextField,
    Typography,
    DialogTitle,
    DialogActions,
    DialogContent,
} from '@mui/material';

interface SprintDialogHorasDeduzidasProps {
    colaborador: LinhaColaboradorSprint | null;
    chaveSprint: string;
    horasDeduzidas: Record<string, number>;
    somenteLeitura: boolean;
    onFechar: () => void;
    onSalvo: (sprint: Sprint) => void;
}

export function SprintDialogHorasDeduzidas({
    colaborador,
    chaveSprint,
    horasDeduzidas,
    somenteLeitura,
    onFechar,
    onSalvo,
}: SprintDialogHorasDeduzidasProps): ReactNode {
    const { notificarErro, notificarSucesso } = useNotificacao();
    const [horas, setHoras] = useState('');
    const [salvando, setSalvando] = useState(false);

    const horasAtuais = colaborador ? horasDeduzidas[colaborador.chave] ?? 0 : 0;

    useEffect(() => {
        if (colaborador) setHoras(horasAtuais > 0 ? String(horasAtuais) : '');
    }, [colaborador, horasAtuais]);

    const horasNumero = horas.trim() === '' ? 0 : Number(horas);
    const horasValidas = Number.isInteger(horasNumero) && horasNumero >= 0;
    const capacidadeSemDeducao = colaborador ? colaborador.td + colaborador.horasDeduzidas : 0;

    async function salvar(): Promise<void> {
        if (!colaborador || !horasValidas) return;
        setSalvando(true);
        try {
            const novoMapa = { ...horasDeduzidas, [colaborador.chave]: horasNumero };
            const sprint = await atualizarHorasDeduzidas(chaveSprint, { horasDeduzidas: novoMapa });
            notificarSucesso(`Horas deduzidas de ${colaborador.nomeExibicao} atualizadas.`);
            onSalvo(sprint);
        } catch (erro) {
            notificarErro(erro, 'Não foi possível salvar as horas deduzidas');
        } finally {
            setSalvando(false);
        }
    }

    return (
        <Dialog open={colaborador !== null} onClose={salvando ? undefined : onFechar} fullWidth maxWidth="xs">
            <DialogTitle>Horas deduzidas — {colaborador?.nomeExibicao}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    {somenteLeitura ? (
                        <Alert severity="info">Sprint fechado: as horas deduzidas ficam travadas. Reabra o sprint para editar.</Alert>
                    ) : undefined}
                    <Typography variant="body2" color="text.secondary">
                        Capacidade do colaborador sem dedução: {capacidadeSemDeducao} h.
                    </Typography>
                    <TextField
                        label="Horas a deduzir"
                        type="number"
                        value={horas}
                        onChange={(evento) => setHoras(evento.target.value)}
                        error={!horasValidas}
                        helperText={
                            !horasValidas
                                ? 'Informe um número inteiro maior ou igual a zero.'
                                : 'Férias, folga, atestado etc. Vazio ou zero remove a dedução.'
                        }
                        slotProps={{ htmlInput: { min: 0, step: 1 } }}
                        autoFocus
                        fullWidth
                        disabled={salvando || somenteLeitura} />
                </Stack>
            </DialogContent>
            <DialogActions>
                <BotaoComCarregamento onClick={onFechar} disabled={salvando}>
                    {somenteLeitura ? 'Fechar' : 'Cancelar'}
                </BotaoComCarregamento>
                {!somenteLeitura ? (
                    <BotaoComCarregamento
                        variant="contained"
                        carregando={salvando}
                        disabled={!horasValidas || horasNumero === horasAtuais}
                        onClick={() => void salvar()}>
                        Salvar
                    </BotaoComCarregamento>
                ) : undefined}
            </DialogActions>
        </Dialog>
    );
}