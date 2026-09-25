import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNotificacao } from '../../hooks/useNotificacao';
import { ConsultaDialog } from '../../components/ConsultaDialog';
import { ROTULO_CONSULTAR } from '../../components/origemConsulta';
import { SeletorOrigemConsulta } from '../../components/SeletorOrigemConsulta';
import type { OrigemConsultaPlanejamento } from '../../components/origemConsulta';

interface ConsultaPlanejamentoDialogProps {
    aberto: boolean;
    origem: OrigemConsultaPlanejamento;
    onOrigemChange: (origem: OrigemConsultaPlanejamento) => void;
    consultar: (forcar: boolean) => Promise<void>;
    onCancelar: () => void;
    onConcluida: () => void;
}

const OPCOES_ORIGEM: readonly OrigemConsultaPlanejamento[] = ['nenhum', 'jira'];

export function ConsultaPlanejamentoDialog({
    aberto,
    origem,
    onOrigemChange,
    consultar,
    onCancelar,
    onConcluida,
}: ConsultaPlanejamentoDialogProps): ReactNode {
    const { notificarErro } = useNotificacao();
    const [consultando, setConsultando] = useState(false);

    async function consultarAgora(): Promise<void> {
        setConsultando(true);
        try {
            await consultar(origem === 'jira');
            onConcluida();
        } catch (erro) {
            notificarErro(erro, 'Não foi possível carregar o planejamento');
        } finally {
            setConsultando(false);
        }
    }

    return (
        <ConsultaDialog
            aberto={aberto}
            titulo="Consultar planejamento"
            consultando={consultando}
            rotuloConsultar={ROTULO_CONSULTAR[origem]}
            pedirConfirmacao={origem === 'jira'}
            mensagemConfirmacao="Isso ignora o cache do Planejamento e busca os cartões dos quadros de DEV e de Análise de novo, em tempo real, no Jira. Deseja continuar?"
            semDadoAproveitavel={false}
            onConsultar={() => void consultarAgora()}
            onCancelar={onCancelar}>
            <SeletorOrigemConsulta
                opcoes={OPCOES_ORIGEM}
                valor={origem}
                disabled={consultando}
                onChange={onOrigemChange}
                descricao={
                    <>
                        Nenhum: usa o planejamento salvo de cada quadro (busca no Jira só o quadro que ainda não
                        tiver). Jira: busca os cartões de novo no Jira. Abre no quadro de DEV; o de Análise
                        carrega em segundo plano.
                    </>
                } />
        </ConsultaDialog>
    );
}