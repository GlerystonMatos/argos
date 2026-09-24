import { useState } from 'react';
import type { ReactNode } from 'react';
import { DialogoConfirmacao } from './DialogoConfirmacao';
import { BotaoComCarregamento } from './BotaoComCarregamento';
import { Alert, Stack, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

interface ConsultaDialogProps {
    aberto: boolean;
    titulo: ReactNode;
    consultando: boolean;
    rotuloConsultar: string;
    vaiForcarToggl: boolean;
    semDadoAproveitavel: boolean;
    children: ReactNode;
    onConsultar: () => void;
    onCancelar: () => void;
}

export function ConsultaDialog({
    aberto,
    titulo,
    consultando,
    rotuloConsultar,
    vaiForcarToggl,
    semDadoAproveitavel,
    children,
    onConsultar,
    onCancelar,
}: ConsultaDialogProps): ReactNode {
    const [confirmandoConsultaForcada, setConfirmandoConsultaForcada] = useState(false);

    function aoClicarConsultar(): void {
        if (vaiForcarToggl) {
            setConfirmandoConsultaForcada(true);
            return;
        }
        onConsultar();
    }

    function confirmarConsultaForcada(): void {
        setConfirmandoConsultaForcada(false);
        onConsultar();
    }

    return (
        <>
            <Dialog open={aberto} onClose={consultando ? undefined : onCancelar} maxWidth="sm" fullWidth>
                <DialogTitle>{titulo}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2}>
                        {children}

                        {semDadoAproveitavel ? (
                            <Alert severity="warning">Nenhum usuário do Toggl retornou dados para este período.</Alert>
                        ) : undefined}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ mb: '0.5rem !important', pr: '0.9rem !important' }}>
                    <BotaoComCarregamento onClick={onCancelar} disabled={consultando}>
                        Cancelar
                    </BotaoComCarregamento>
                    <BotaoComCarregamento
                        variant="contained"
                        carregando={consultando}
                        onClick={aoClicarConsultar}>
                        {rotuloConsultar}
                    </BotaoComCarregamento>
                </DialogActions>
            </Dialog>

            <DialogoConfirmacao
                aberto={confirmandoConsultaForcada}
                titulo="Forçar nova consulta à API?"
                mensagem="Isso ignora o cache local e consulta o Toggl de novo, consumindo o limite de 30 requisições/hora por usuário. Deseja continuar?"
                textoConfirmar="Consultar mesmo assim"
                textoCancelar="Não"
                focoNoCancelar
                onConfirmar={confirmarConsultaForcada}
                onCancelar={() => setConfirmandoConsultaForcada(false)} />
        </>
    );
}