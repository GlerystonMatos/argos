import { useLayoutEffect, useState, type DependencyList, type RefObject } from 'react';

interface OpcoesLarguraColuna {
    indiceColuna: number;
    larguraMinima: number;
    margemSeguranca: number;
    linhaMedicao: 'cabecalho' | 'corpo';
}

export function useLarguraColunaRestante(
    refTabela: RefObject<HTMLTableElement | null>,
    { indiceColuna, larguraMinima, margemSeguranca, linhaMedicao }: OpcoesLarguraColuna,
    dependencias: DependencyList,
): number | undefined {
    const [largura, setLargura] = useState<number | undefined>(undefined);

    useLayoutEffect(() => {
        const tabela = refTabela.current;
        const container = tabela?.parentElement;
        if (!tabela || !container) return;

        function recalcular(): void {
            const secao = linhaMedicao === 'cabecalho' ? tabela!.tHead : tabela!.tBodies[0];
            const linha = secao?.rows[0];
            if (!linha) return;

            let larguraOutrasColunas = 0;
            Array.from(linha.cells).forEach((celula, indice) => {
                if (indice !== indiceColuna) larguraOutrasColunas += celula.getBoundingClientRect().width;
            });

            const disponivel = Math.floor(container!.clientWidth - larguraOutrasColunas) - margemSeguranca;
            setLargura(Math.max(larguraMinima, disponivel));
        }

        recalcular();
        const observador = new ResizeObserver(recalcular);
        observador.observe(container);
        return () => observador.disconnect();
    }, dependencias);

    return largura;
}