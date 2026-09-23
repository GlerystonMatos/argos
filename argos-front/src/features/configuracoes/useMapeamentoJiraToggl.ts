import { useRecursoEditavel } from '../../hooks/useRecursoEditavel';
import type { ResultadoUseRecursoEditavel } from '../../hooks/useRecursoEditavel';
import type { AtualizarMapeamentoJiraTogglRequest, MapeamentoJiraToggl } from '../../api/tipos';
import { atualizarMapeamentoJiraToggl, obterMapeamentoJiraToggl } from '../../api/mapeamentoJiraTogglApi';

export function useMapeamentoJiraToggl(): ResultadoUseRecursoEditavel<MapeamentoJiraToggl, AtualizarMapeamentoJiraTogglRequest> {
    return useRecursoEditavel(obterMapeamentoJiraToggl, atualizarMapeamentoJiraToggl);
}