import { useCallback, useState } from 'react';
import type { ConsultarRequest, ConsultarResponse } from '../../api/tipos';

export interface ResultadoUseConsulta<TOpcoes = undefined> {
    resultado: ConsultarResponse | null;
    consultando: boolean;
    executar: (dataInicio: string, dataFim: string, forcarConsultaApi: boolean, opcoes?: TOpcoes) => Promise<ConsultarResponse>;
}

export function useConsultaGenerica<TOpcoes = undefined>(
    consultar: (dados: ConsultarRequest, opcoes?: TOpcoes) => Promise<ConsultarResponse>,
): ResultadoUseConsulta<TOpcoes> {
    const [resultado, setResultado] = useState<ConsultarResponse | null>(null);
    const [consultando, setConsultando] = useState(false);

    const executar = useCallback(
        async (dataInicio: string, dataFim: string, forcarConsultaApi: boolean, opcoes?: TOpcoes): Promise<ConsultarResponse> => {
            setConsultando(true);
            try {
                const resposta = await consultar({ dataInicio, dataFim, forcarConsultaApi }, opcoes);
                setResultado(resposta);
                return resposta;
            } finally {
                setConsultando(false);
            }
        },
        [consultar],
    );

    return { resultado, consultando, executar };
}