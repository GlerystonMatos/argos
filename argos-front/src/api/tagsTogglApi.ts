import { http } from './http';
import type { TagsTogglResponse } from './tipos';

export function listarTagsToggl(forcarAtualizacao = false): Promise<TagsTogglResponse> {
    return http.get<TagsTogglResponse>('/api/usuarios-toggl/tags', { forcarAtualizacao: String(forcarAtualizacao) });
}