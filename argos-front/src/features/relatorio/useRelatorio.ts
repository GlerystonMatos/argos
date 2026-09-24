import { useRecurso } from '../../hooks/useRecurso';
import { obterRelatorio } from '../../api/relatorioApi';
import type { RelatorioResponse } from '../../api/tipos';

interface ResultadoUseRelatorio {
    relatorio: RelatorioResponse | null;
    carregando: boolean;
    carregado: boolean;
    carregar: (dataInicio: string, dataFim: string) => Promise<RelatorioResponse>;
}

export function useRelatorio(): ResultadoUseRelatorio {
    const { dados, carregando, carregado, carregar } = useRecurso(obterRelatorio);
    return { relatorio: dados, carregando, carregado, carregar };
}