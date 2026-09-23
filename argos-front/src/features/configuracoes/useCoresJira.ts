import { useRecursoEditavel } from '../../hooks/useRecursoEditavel';
import type { AtualizarCoresJiraRequest, CoresJira } from '../../api/tipos';
import { atualizarCoresJira, obterCoresJira } from '../../api/coresJiraApi';
import type { ResultadoUseRecursoEditavel } from '../../hooks/useRecursoEditavel';

export function useCoresJira(): ResultadoUseRecursoEditavel<CoresJira, AtualizarCoresJiraRequest> {
    return useRecursoEditavel(obterCoresJira, atualizarCoresJira);
}