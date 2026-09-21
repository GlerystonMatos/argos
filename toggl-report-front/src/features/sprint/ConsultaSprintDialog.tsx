import { useState } from 'react';
import type { ReactNode } from 'react';
import { temDadoAproveitavel } from '../../utils/consulta';
import { useNotificacao } from '../../hooks/useNotificacao';
import type { ResultadoUseConsultaSprint } from './useConsultaSprint';
import { DialogoConfirmacao } from '../../components/DialogoConfirmacao';
import { BotaoComCarregamento } from '../../components/BotaoComCarregamento';
import type { Sprint, ConsultarResponse, OrigemConsultaSprint } from '../../api/tipos';

import {
    Alert,
    Stack,
    Dialog,
    Typography,
    DialogTitle,
    ToggleButton,
    DialogContent,
    DialogActions,
    ToggleButtonGroup,
} from '@mui/material';

interface ConsultaSprintDialogProps {
    aberto: boolean;
    sprint: Sprint;
    consulta: ResultadoUseConsultaSprint;
    onCancelar: () => void;
    onConcluida: (resposta: ConsultarResponse, origemEfetiva: OrigemConsultaSprint) => void;
}

const ROTULO_CONSULTAR: Record<OrigemConsultaSprint, string> = {
    nenhum: 'Consultar',
    toggl: 'Forçar Toggl',
    jira: 'Forçar Jira',
    ambos: 'Forçar Toggl e Jira',
};

export function ConsultaSprintDialog({
    aberto,
    sprint,
    consulta,
    onCancelar,
    onConcluida,
}: ConsultaSprintDialogProps): ReactNode {
    const { notificarErro } = useNotificacao();
    const [confirmandoConsultaForcada, setConfirmandoConsultaForcada] = useState(false);
    const [semDadoAproveitavel, setSemDadoAproveitavel] = useState(false);

    const { origem, setOrigem, consultando, executar } = consulta;
    const origemEfetiva: OrigemConsultaSprint = sprint.fechado ? 'nenhum' : origem;
    const vaiForcarToggl = origemEfetiva === 'toggl' || origemEfetiva === 'ambos';

    async function consultarAgora(): Promise<void> {
        setSemDadoAproveitavel(false);
        try {
            const resposta = await executar(sprint.dataInicio, sprint.dataFim, false, origemEfetiva);
            if (temDadoAproveitavel(resposta)) {
                onConcluida(resposta, origemEfetiva);
            } else {
                setSemDadoAproveitavel(true);
            }
        } catch (erro) {
            notificarErro(erro, 'Não foi possível consultar o Toggl');
        }
    }

    function aoClicarConsultar(): void {
        if (vaiForcarToggl) {
            setConfirmandoConsultaForcada(true);
            return;
        }
        void consultarAgora();
    }

    function confirmarConsultaForcada(): void {
        setConfirmandoConsultaForcada(false);
        void consultarAgora();
    }

    function cancelar(): void {
        setSemDadoAproveitavel(false);
        onCancelar();
    }

    return (
        <>
            <Dialog open={aberto} onClose={consultando ? undefined : cancelar} maxWidth="sm" fullWidth>
                <DialogTitle>Consultar sprint — {sprint.nome}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2}>
                        {sprint.fechado ? (
                            <Alert severity="info">
                                Sprint fechado: os dados ficam travados no que foi salvo ao fechar. A consulta sempre usa
                                o cache do Toggl, do Jira e do Planejamento, sem chamar a API de novo. Reabra o sprint
                                na listagem para liberar edição e novas consultas.
                            </Alert>
                        ) : (
                            <Stack spacing={0.5}>
                                <Typography variant="body2" color="text.secondary">Forçar nova consulta em:</Typography>
                                <ToggleButtonGroup
                                    size="small"
                                    exclusive
                                    value={origem}
                                    disabled={consultando}
                                    onChange={(_evento, valor: OrigemConsultaSprint | null) => {
                                        if (valor) setOrigem(valor);
                                    }}>
                                    <ToggleButton value="nenhum">Nenhum</ToggleButton>
                                    <ToggleButton value="toggl">Toggl</ToggleButton>
                                    <ToggleButton value="jira">Jira</ToggleButton>
                                    <ToggleButton value="ambos">Ambos</ToggleButton>
                                </ToggleButtonGroup>
                                <Typography variant="caption" color="text.secondary">
                                    Nenhum: usa o cache do Toggl, do Jira e do Planejamento quando disponível. Toggl:
                                    força nova consulta ao Toggl (Jira e Planejamento do cache). Jira: atualiza as
                                    informações do Jira e o Planejamento do sprint (Toggl do cache). Ambos: força tudo.
                                </Typography>
                            </Stack>
                        )}

                        {semDadoAproveitavel ? (
                            <Alert severity="warning">Nenhum usuário do Toggl retornou dados para este período.</Alert>
                        ) : undefined}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ mb: '0.5rem !important', pr: '0.9rem !important' }}>
                    <BotaoComCarregamento onClick={cancelar} disabled={consultando}>
                        Cancelar
                    </BotaoComCarregamento>
                    <BotaoComCarregamento
                        variant="contained"
                        carregando={consultando}
                        onClick={aoClicarConsultar}>
                        {ROTULO_CONSULTAR[origemEfetiva]}
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