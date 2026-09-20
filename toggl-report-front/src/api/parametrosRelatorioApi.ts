import { http } from './http';
import type { AtualizarParametrosRequest, ParametrosConfiguracao } from './tipos';

export function obterParametrosRelatorio(): Promise<ParametrosConfiguracao> {
    return http.get<ParametrosConfiguracao>('/api/configuracao');
}

export function atualizarParametrosRelatorio(
    dados: AtualizarParametrosRequest,
): Promise<ParametrosConfiguracao> {
    return http.put<ParametrosConfiguracao>('/api/configuracao', dados);
}