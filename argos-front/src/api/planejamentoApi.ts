import { http } from './http';

import type {
    ResultadoPlanejamento,
    ConsultaPlanejamentoResponse,
    ConsultarPlanejamentoRequest,
} from './tipos';

export function consultarPlanejamento(dados: ConsultarPlanejamentoRequest): Promise<ConsultaPlanejamentoResponse> {
    return http.post<ConsultaPlanejamentoResponse>('/api/sprint/planejamento/consultas', dados);
}

export function obterPlanejamento(chaveSprint: string): Promise<ResultadoPlanejamento> {
    return http.get<ResultadoPlanejamento>('/api/sprint/planejamento', { chaveSprint });
}