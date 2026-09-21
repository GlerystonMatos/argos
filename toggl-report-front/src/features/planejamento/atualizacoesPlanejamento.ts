import { consultarPlanejamento } from '../../api/planejamentoApi';
import type { ConsultaPlanejamentoResponse } from '../../api/tipos';

const emAndamento = new Map<string, Promise<void>>();

export function atualizarPlanejamentoAoVivo(chaveSprint: string): Promise<ConsultaPlanejamentoResponse> {
    const chamada = consultarPlanejamento({ chaveSprint, forcar: true });
    const registro = chamada.then(
        () => undefined,
        () => undefined,
    );
    emAndamento.set(chaveSprint, registro);
    void registro.then(() => {
        if (emAndamento.get(chaveSprint) === registro) emAndamento.delete(chaveSprint);
    });
    return chamada;
}

export function aguardarAtualizacaoPlanejamento(chaveSprint: string): Promise<void> {
    return emAndamento.get(chaveSprint) ?? Promise.resolve();
}