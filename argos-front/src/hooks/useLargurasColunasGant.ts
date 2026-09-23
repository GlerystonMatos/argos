import { useEffect, useLayoutEffect, useState, type RefObject } from 'react';

interface Medicao {
    chave: unknown;
    versaoFontes: number;
    larguras: (number | null)[];
    somaFixas: number;
}

interface ResultadoLargurasColunas {
    medindo: boolean;
    larguras: (number | null)[];
    somaFixas: number;
}

const SEM_LARGURAS: (number | null)[] = [];

// Mede a largura natural de cada coluna (menos a "restante") num passe temporário e devolve
// larguras fixas para o passe final. `medindo` fica true na renderização de medição: quem
// consome deve renderizar a tabela em layout automático, sem quebra de linha, com tudo
// expandido. O passe roda em useLayoutEffect, então nunca é pintado.
export function useLargurasColunasGant(
    refTabela: RefObject<HTMLTableElement | null>,
    chaveDados: unknown,
    indiceColunaRestante: number,
): ResultadoLargurasColunas {
    const [versaoFontes, setVersaoFontes] = useState(0);
    const [medicao, setMedicao] = useState<Medicao | null>(null);

    const medindo = medicao === null || medicao.chave !== chaveDados || medicao.versaoFontes !== versaoFontes;

    useEffect(() => {
        const fontes = document.fonts;
        if (!fontes) return;
        const aoCarregar = (): void => setVersaoFontes((atual) => atual + 1);
        fontes.addEventListener('loadingdone', aoCarregar);
        fontes.ready.then(aoCarregar).catch(() => undefined);
        return () => fontes.removeEventListener('loadingdone', aoCarregar);
    }, []);

    useLayoutEffect(() => {
        if (!medindo) return;
        const cabecalho = refTabela.current?.tHead?.rows[0];
        if (!cabecalho) return;

        let somaFixas = 0;
        const larguras = Array.from(cabecalho.cells).map((celula, indice) => {
            if (indice === indiceColunaRestante) return null;
            const largura = Math.ceil(celula.getBoundingClientRect().width);
            somaFixas += largura;
            return largura;
        });
        setMedicao({ chave: chaveDados, versaoFontes, larguras, somaFixas });
    }, [medindo, chaveDados, versaoFontes, indiceColunaRestante]);

    return {
        medindo,
        larguras: medicao?.larguras ?? SEM_LARGURAS,
        somaFixas: medicao?.somaFixas ?? 0,
    };
}