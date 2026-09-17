import { useRecursoEditavel } from '../../hooks/useRecursoEditavel';
import type { ResultadoUseRecursoEditavel } from '../../hooks/useRecursoEditavel';
import type { AtualizarResponsabilidadeSprintRequest, ResponsabilidadeSprint } from '../../api/tipos';
import { atualizarResponsabilidadeSprint, obterResponsabilidadeSprint } from '../../api/responsabilidadeSprintApi';

export function useResponsabilidadeSprint(): ResultadoUseRecursoEditavel<ResponsabilidadeSprint, AtualizarResponsabilidadeSprintRequest> {
    return useRecursoEditavel(obterResponsabilidadeSprint, atualizarResponsabilidadeSprint);
}