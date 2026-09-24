import type { ReactNode } from 'react';
import { useConsultaGant } from './useConsultaGant';
import { useParametrosGant } from './useParametrosGant';
import type { AtualizarParametrosGantRequest } from '../../api/tipos';
import { ParametrosFormBase } from '../../components/ParametrosFormBase';
import type { DadosParametros, ParametrosConsultaProps } from '../../components/ParametrosFormBase';

export function ParametrosGantForm({ semUsuarios, onConcluida }: ParametrosConsultaProps): ReactNode {
    const { carregar, salvar } = useParametrosGant();
    const { executar } = useConsultaGant();

    function paraRequisicao({ agrupamento, tags, dataInicio, dataFim }: DadosParametros): AtualizarParametrosGantRequest {
        return { dataInicio, dataFim, tagsSelecionadas: tags, agrupamento };
    }

    return (
        <ParametrosFormBase
            titulo="Parâmetros do Gant"
            tituloConsulta="Consultar Gant"
            semUsuarios={semUsuarios}
            mensagemErroCarregar="Não foi possível carregar os parâmetros do Gant salvos"
            carregarInicial={async () => {
                const dados = await carregar();
                return {
                    agrupamento: dados.agrupamento,
                    tags: dados.tagsSelecionadas,
                    dataInicio: dados.dataInicio,
                    dataFim: dados.dataFim,
                };
            }}
            salvarParametros={(dados) => salvar(paraRequisicao(dados))}
            executarConsulta={executar}
            onConcluida={onConcluida} />
    );
}