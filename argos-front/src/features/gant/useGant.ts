import { obterGant } from '../../api/gantApi';
import { useRecurso } from '../../hooks/useRecurso';
import type { ResultadoGant } from '../../api/tipos';

interface ResultadoUseGant {
    gant: ResultadoGant | null;
    carregando: boolean;
    carregado: boolean;
    carregar: (dataInicio: string, dataFim: string, termo?: string) => Promise<ResultadoGant>;
}

export function useGant(): ResultadoUseGant {
    const { dados, carregando, carregado, carregar } = useRecurso(obterGant);
    return { gant: dados, carregando, carregado, carregar };
}