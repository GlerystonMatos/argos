import { http } from './http';

import type {
    ResultadoSprint,
    ConsultarResponse,
    ConsultarSprintRequest,
} from './tipos';

export function consultarSprint(dados: ConsultarSprintRequest): Promise<ConsultarResponse> {
    return http.post<ConsultarResponse>('/api/sprint/consultas', dados);
}

export function obterSprint(chaveSprint: string): Promise<ResultadoSprint> {
    return http.get<ResultadoSprint>('/api/sprint', { chaveSprint });
}