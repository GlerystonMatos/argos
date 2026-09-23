import { http } from './http';
import type { AtualizarConfiguracaoQuadroPlanejamentoRequest, ConfiguracaoQuadroPlanejamento } from './tipos';

export function obterQuadroPlanejamento(): Promise<ConfiguracaoQuadroPlanejamento> {
    return http.get<ConfiguracaoQuadroPlanejamento>('/api/jira/quadro');
}

export function atualizarQuadroPlanejamento(dados: AtualizarConfiguracaoQuadroPlanejamentoRequest): Promise<ConfiguracaoQuadroPlanejamento> {
    return http.put<ConfiguracaoQuadroPlanejamento>('/api/jira/quadro', dados);
}
