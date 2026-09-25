import { ErroApi } from '../../api/http';
import { useCallback, useRef, useState } from 'react';
import type { ResultadoPlanejamento, TipoQuadroJira } from '../../api/tipos';
import { consultarPlanejamento, obterPlanejamento } from '../../api/planejamentoApi';

export interface EstadoPlanejamentoQuadro {
    resultado: ResultadoPlanejamento | null;
    carregando: boolean;
    erro: string | null;
    veioDoCache: boolean | null;
}

export interface ResultadoUsePlanejamento {
    quadros: Record<TipoQuadroJira, EstadoPlanejamentoQuadro>;

    consultar: (forcar: boolean, principal: TipoQuadroJira, emSegundoPlano: readonly TipoQuadroJira[]) => Promise<void>;
    atualizar: (quadro: TipoQuadroJira) => Promise<void>;
}

const ESTADO_INICIAL: EstadoPlanejamentoQuadro = { resultado: null, carregando: false, erro: null, veioDoCache: null };

function ehConflito(erro: unknown): boolean {
    return erro instanceof ErroApi && erro.status === 409;
}

function mensagemDe(erro: unknown): string {
    return erro instanceof Error ? erro.message : 'Não foi possível carregar o planejamento.';
}

async function carregarQuadro(quadro: TipoQuadroJira, forcar: boolean): Promise<{ resultado: ResultadoPlanejamento; veioDoCache: boolean }> {
    if (forcar) {
        await consultarPlanejamento({ quadro, forcar: true });
        return { resultado: await obterPlanejamento(quadro), veioDoCache: false };
    }

    try {
        return { resultado: await obterPlanejamento(quadro), veioDoCache: true };
    } catch (erro) {
        if (!ehConflito(erro)) throw erro;
    }

    const consulta = await consultarPlanejamento({ quadro, forcar: false });
    return { resultado: await obterPlanejamento(quadro), veioDoCache: consulta.veioDoCache };
}

export function usePlanejamento(): ResultadoUsePlanejamento {
    const [quadros, setQuadros] = useState<Record<TipoQuadroJira, EstadoPlanejamentoQuadro>>({
        dev: ESTADO_INICIAL,
        analise: ESTADO_INICIAL,
    });
    const sequencias = useRef<Record<TipoQuadroJira, number>>({ dev: 0, analise: 0 });

    const alterar = useCallback((quadro: TipoQuadroJira, parcial: Partial<EstadoPlanejamentoQuadro>) => {
        setQuadros((atual) => ({ ...atual, [quadro]: { ...atual[quadro], ...parcial } }));
    }, []);

    const carregar = useCallback(
        async (quadro: TipoQuadroJira, forcar: boolean): Promise<void> => {
            const minha = ++sequencias.current[quadro];
            alterar(quadro, { carregando: true, erro: null });
            try {
                const { resultado, veioDoCache } = await carregarQuadro(quadro, forcar);
                if (minha !== sequencias.current[quadro]) return;
                alterar(quadro, { resultado, veioDoCache, carregando: false });
            } catch (falha) {
                if (minha !== sequencias.current[quadro]) return;
                alterar(quadro, { erro: mensagemDe(falha), carregando: false });
                throw falha;
            }
        },
        [alterar],
    );

    const consultar = useCallback(
        async (forcar: boolean, principal: TipoQuadroJira, emSegundoPlano: readonly TipoQuadroJira[]): Promise<void> => {
            emSegundoPlano.forEach((quadro) => carregar(quadro, forcar).catch(() => { }));
            await carregar(principal, forcar);
        },
        [carregar],
    );

    const atualizar = useCallback((quadro: TipoQuadroJira) => carregar(quadro, true).catch(() => { }), [carregar]);

    return { quadros, consultar, atualizar };
}