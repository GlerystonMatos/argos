import { ErroApi } from '../../api/http';
import type { ResultadoPlanejamento } from '../../api/tipos';
import { useCallback, useEffect, useRef, useState } from 'react';
import { consultarPlanejamento, obterPlanejamento } from '../../api/planejamentoApi';
import { aguardarAtualizacaoPlanejamento, atualizarPlanejamentoAoVivo } from './atualizacoesPlanejamento';

export interface ResultadoUsePlanejamento {
    resultado: ResultadoPlanejamento | null;
    carregando: boolean;
    atualizando: boolean;
    erro: string | null;
    veioDoCache: boolean | null;
    atualizadoEm: string | null;
    semCache: boolean;
    atualizar: () => Promise<void>;
}

interface Carga {
    resultado: ResultadoPlanejamento | null;
    veioDoCache: boolean;
    semCache: boolean;
}

function ehConflito(erro: unknown): boolean {
    return erro instanceof ErroApi && erro.status === 409;
}

function mensagemDe(erro: unknown): string {
    return erro instanceof Error ? erro.message : 'Não foi possível carregar o planejamento.';
}

// Cache-first: o GET nunca chama o Jira; sem cache (409) o POST com forcar=false busca ao vivo
// (sprint aberto) ou devolve 409 de novo (sprint fechado sem planejamento salvo).
async function carregarCacheFirst(chaveSprint: string): Promise<Carga> {
    await aguardarAtualizacaoPlanejamento(chaveSprint);

    try {
        return { resultado: await obterPlanejamento(chaveSprint), veioDoCache: true, semCache: false };
    } catch (erro) {
        if (!ehConflito(erro)) throw erro;
    }

    try {
        const consulta = await consultarPlanejamento({ chaveSprint, forcar: false });
        const resultado = await obterPlanejamento(chaveSprint);
        return { resultado, veioDoCache: consulta.veioDoCache, semCache: false };
    } catch (erro) {
        if (ehConflito(erro)) return { resultado: null, veioDoCache: false, semCache: true };
        throw erro;
    }
}

export function usePlanejamento(chaveSprint: string): ResultadoUsePlanejamento {
    const [resultado, setResultado] = useState<ResultadoPlanejamento | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [atualizando, setAtualizando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const [veioDoCache, setVeioDoCache] = useState<boolean | null>(null);
    const [semCache, setSemCache] = useState(false);

    const sequencia = useRef(0);
    const emAndamento = useRef<{ chave: string; promessa: Promise<Carga> } | null>(null);

    useEffect(() => {
        const minha = ++sequencia.current;
        setResultado(null);
        setErro(null);
        setSemCache(false);
        setVeioDoCache(null);
        setAtualizando(false);
        setCarregando(true);

        let promessa: Promise<Carga>;
        if (emAndamento.current?.chave === chaveSprint) {
            promessa = emAndamento.current.promessa;
        } else {
            promessa = carregarCacheFirst(chaveSprint);
            const registro = { chave: chaveSprint, promessa };
            emAndamento.current = registro;
            const limpar = (): void => {
                if (emAndamento.current === registro) emAndamento.current = null;
            };
            promessa.then(limpar, limpar);
        }

        promessa
            .then((carga) => {
                if (minha !== sequencia.current) return;
                setResultado(carga.resultado);
                setVeioDoCache(carga.veioDoCache);
                setSemCache(carga.semCache);
            })
            .catch((falha: unknown) => {
                if (minha !== sequencia.current) return;
                setErro(mensagemDe(falha));
            })
            .finally(() => {
                if (minha === sequencia.current) setCarregando(false);
            });

        return () => {
            sequencia.current++;
        };
    }, [chaveSprint]);

    const atualizar = useCallback(async (): Promise<void> => {
        const minha = ++sequencia.current;
        setAtualizando(true);
        setErro(null);
        try {
            const consulta = await atualizarPlanejamentoAoVivo(chaveSprint);
            const novo = await obterPlanejamento(chaveSprint);
            if (minha !== sequencia.current) return;
            setResultado(novo);
            setVeioDoCache(consulta.veioDoCache);
            setSemCache(false);
        } catch (falha) {
            if (minha !== sequencia.current) return;
            setErro(mensagemDe(falha));
        } finally {
            if (minha === sequencia.current) {
                setAtualizando(false);
                setCarregando(false);
            }
        }
    }, [chaveSprint]);

    return {
        resultado,
        carregando,
        atualizando,
        erro,
        veioDoCache,
        atualizadoEm: resultado?.atualizadoEm ?? null,
        semCache,
        atualizar,
    };
}