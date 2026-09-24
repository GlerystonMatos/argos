import { useState } from 'react';
import { Alert } from '@mui/material';
import type { ReactNode } from 'react';
import { temDadoAproveitavel } from '../../utils/consulta';
import { useNotificacao } from '../../hooks/useNotificacao';
import { ConsultaDialog } from '../../components/ConsultaDialog';
import type { ResultadoUseConsultaSprint } from './useConsultaSprint';
import { SeletorOrigemConsulta } from '../../components/SeletorOrigemConsulta';
import { ROTULO_CONSULTAR, forcaToggl } from '../../components/origemConsulta';
import type { Sprint, ConsultarResponse, OrigemConsultaSprint } from '../../api/tipos';

interface ConsultaSprintDialogProps {
    aberto: boolean;
    sprint: Sprint;
    consulta: ResultadoUseConsultaSprint;
    onCancelar: () => void;
    onConcluida: (resposta: ConsultarResponse, origemEfetiva: OrigemConsultaSprint) => void;
}

const OPCOES_ORIGEM: readonly OrigemConsultaSprint[] = ['nenhum', 'toggl', 'jira', 'ambos'];

export function ConsultaSprintDialog({
    aberto,
    sprint,
    consulta,
    onCancelar,
    onConcluida,
}: ConsultaSprintDialogProps): ReactNode {
    const { notificarErro } = useNotificacao();
    const [semDadoAproveitavel, setSemDadoAproveitavel] = useState(false);

    const { origem, setOrigem, consultando, executar } = consulta;
    const origemEfetiva: OrigemConsultaSprint = sprint.fechado ? 'nenhum' : origem;

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

    function cancelar(): void {
        setSemDadoAproveitavel(false);
        onCancelar();
    }

    return (
        <ConsultaDialog
            aberto={aberto}
            titulo={`Consultar sprint — ${sprint.nome}`}
            consultando={consultando}
            rotuloConsultar={ROTULO_CONSULTAR[origemEfetiva]}
            vaiForcarToggl={forcaToggl(origemEfetiva)}
            semDadoAproveitavel={semDadoAproveitavel}
            onConsultar={() => void consultarAgora()}
            onCancelar={cancelar}>
            {sprint.fechado ? (
                <Alert severity="info">
                    Sprint fechado: os dados ficam travados no que foi salvo ao fechar. A consulta sempre usa
                    o cache do Toggl, do Jira e do Planejamento, sem chamar a API de novo. Reabra o sprint
                    na listagem para liberar edição e novas consultas.
                </Alert>
            ) : (
                <SeletorOrigemConsulta
                    opcoes={OPCOES_ORIGEM}
                    valor={origem}
                    disabled={consultando}
                    onChange={setOrigem}
                    descricao={
                        <>
                            Nenhum: usa o cache do Toggl, do Jira e do Planejamento quando disponível. Toggl:
                            força nova consulta ao Toggl (Jira e Planejamento do cache). Jira: atualiza as
                            informações do Jira e o Planejamento do sprint (Toggl do cache). Ambos: força tudo.
                        </>
                    } />
            )}
        </ConsultaDialog>
    );
}