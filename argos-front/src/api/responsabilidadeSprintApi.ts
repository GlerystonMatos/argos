import { http } from './http';

import type { AtualizarResponsabilidadeSprintRequest, ResponsabilidadeSprint } from './tipos';

export function obterResponsabilidadeSprint(): Promise<ResponsabilidadeSprint> {
    return http.get<ResponsabilidadeSprint>('/api/sprint/responsabilidade');
}

export function atualizarResponsabilidadeSprint(
    dados: AtualizarResponsabilidadeSprintRequest,
): Promise<ResponsabilidadeSprint> {
    return http.put<ResponsabilidadeSprint>('/api/sprint/responsabilidade', dados);
}