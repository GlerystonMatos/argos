import { useCallback, useState } from 'react';
import { buscarPorDescricao } from '../../api/buscaApi';
import type { ResultadoBuscaDescricao } from '../../api/tipos';

export interface ResultadoUseBusca {
    resultado: ResultadoBuscaDescricao | null;
    termoAtivo: string | null;
    buscando: boolean;
    buscar: (termo: string) => Promise<ResultadoBuscaDescricao>;
    limpar: () => void;
}

export function useBusca(): ResultadoUseBusca {
    const [resultado, setResultado] = useState<ResultadoBuscaDescricao | null>(null);
    const [termoAtivo, setTermoAtivo] = useState<string | null>(null);
    const [buscando, setBuscando] = useState(false);

    const buscar = useCallback(async (termo: string): Promise<ResultadoBuscaDescricao> => {
        setBuscando(true);
        try {
            const dados = await buscarPorDescricao(termo);
            setResultado(dados);
            setTermoAtivo(termo);
            return dados;
        } finally {
            setBuscando(false);
        }
    }, []);

    const limpar = useCallback(() => {
        setResultado(null);
        setTermoAtivo(null);
    }, []);

    return { resultado, termoAtivo, buscando, buscar, limpar };
}