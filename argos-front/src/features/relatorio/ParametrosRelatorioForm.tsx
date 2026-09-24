import type { ReactNode } from 'react';
import { useConsulta } from '../consulta/useConsulta';
import { useParametrosRelatorio } from './useParametrosRelatorio';
import type { AtualizarParametrosRequest } from '../../api/tipos';
import { ParametrosFormBase } from '../../components/ParametrosFormBase';
import type { DadosParametros, ParametrosConsultaProps } from '../../components/ParametrosFormBase';

export function ParametrosRelatorioForm({ semUsuarios, onConcluida }: ParametrosConsultaProps): ReactNode {
    const { carregar, salvar } = useParametrosRelatorio();
    const { executar } = useConsulta();

    function paraRequisicao({ agrupamento, tags, dataInicio, dataFim }: DadosParametros): AtualizarParametrosRequest {
        return { agrupamento, tagsDetalhadas: tags, dataInicio, dataFim };
    }

    return (
        <ParametrosFormBase
            titulo="Parâmetros do Relatório"
            tituloConsulta="Consultar Relatório"
            semUsuarios={semUsuarios}
            mensagemErroCarregar="Não foi possível carregar os parâmetros do Relatório salvos"
            carregarInicial={async () => {
                const dados = await carregar();
                return {
                    agrupamento: dados.agrupamento,
                    tags: dados.tagsDetalhadas,
                    dataInicio: dados.dataInicio,
                    dataFim: dados.dataFim,
                };
            }}
            salvarParametros={(dados) => salvar(paraRequisicao(dados))}
            executarConsulta={executar}
            onConcluida={onConcluida} />
    );
}