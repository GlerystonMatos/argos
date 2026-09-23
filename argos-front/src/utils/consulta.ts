import type { ConsultarResponse } from '../api/tipos';

export function temDadoAproveitavel(resposta: ConsultarResponse): boolean {
    return resposta.usuarios.some((usuario) => usuario.quantidadeRegistros !== null);
}