import { useRecursoEditavel } from '../../hooks/useRecursoEditavel';
import type { ResultadoUseRecursoEditavel } from '../../hooks/useRecursoEditavel';
import { obterQuadroPlanejamento, atualizarQuadroPlanejamento } from '../../api/quadroPlanejamentoApi';
import type { AtualizarConfiguracaoQuadroPlanejamentoRequest, ConfiguracaoQuadroPlanejamento } from '../../api/tipos';

export function useQuadroPlanejamento(): ResultadoUseRecursoEditavel<ConfiguracaoQuadroPlanejamento, AtualizarConfiguracaoQuadroPlanejamentoRequest> {
    return useRecursoEditavel(obterQuadroPlanejamento, atualizarQuadroPlanejamento);
}
