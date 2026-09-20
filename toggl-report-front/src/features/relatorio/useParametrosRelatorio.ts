import { useRecursoEditavel } from '../../hooks/useRecursoEditavel';
import type { ResultadoUseRecursoEditavel } from '../../hooks/useRecursoEditavel';
import type { AtualizarParametrosRequest, ParametrosConfiguracao } from '../../api/tipos';
import { atualizarParametrosRelatorio, obterParametrosRelatorio } from '../../api/parametrosRelatorioApi';

export function useParametrosRelatorio(): ResultadoUseRecursoEditavel<ParametrosConfiguracao, AtualizarParametrosRequest> {
    return useRecursoEditavel(obterParametrosRelatorio, atualizarParametrosRelatorio);
}