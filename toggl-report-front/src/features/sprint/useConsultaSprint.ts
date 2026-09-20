import { useCallback, useState } from 'react';
import { consultarSprint } from '../../api/sprintApi';
import { useConsultaGenerica } from '../consulta/useConsultaGenerica';
import type { ResultadoUseConsulta } from '../consulta/useConsultaGenerica';
import type { ConsultarRequest, OrigemConsultaSprint } from '../../api/tipos';

export interface ResultadoUseConsultaSprint extends ResultadoUseConsulta<OrigemConsultaSprint> {
    origem: OrigemConsultaSprint;
    setOrigem: (origem: OrigemConsultaSprint) => void;
}

export function useConsultaSprint(chaveSprint: string): ResultadoUseConsultaSprint {
    const [origem, setOrigem] = useState<OrigemConsultaSprint>('nenhum');

    const consultar = useCallback(
        (dados: ConsultarRequest, origemEfetiva?: OrigemConsultaSprint) =>
            consultarSprint({ ...dados, chaveSprint, origem: origemEfetiva ?? origem }),
        [chaveSprint, origem],
    );

    const { resultado, consultando, executar } = useConsultaGenerica<OrigemConsultaSprint>(consultar);

    return { resultado, consultando, executar, origem, setOrigem };
}