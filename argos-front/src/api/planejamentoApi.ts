import { http } from './http';

import type {
    TipoQuadroJira,
    ResultadoPlanejamento,
    ConsultaPlanejamentoResponse,
    ConsultarPlanejamentoRequest,
} from './tipos';

export function consultarPlanejamento(dados: ConsultarPlanejamentoRequest): Promise<ConsultaPlanejamentoResponse> {
    return http.post<ConsultaPlanejamentoResponse>('/api/planejamento/consultas', dados);
}

export function obterPlanejamento(quadro: TipoQuadroJira): Promise<ResultadoPlanejamento> {
    return http.get<ResultadoPlanejamento>('/api/planejamento', { quadro });
}