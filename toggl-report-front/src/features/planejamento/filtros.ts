import type { CartaoPlanejamento, PessoaPlanejamento, ResultadoPlanejamento } from '../../api/tipos';

export interface FiltrosPlanejamento {
    colunas: string[];
    status: string[];
    colaboradores: string[];
}

export type OpcoesFiltrosPlanejamento = FiltrosPlanejamento;

export const FILTROS_VAZIOS: FiltrosPlanejamento = { colunas: [], status: [], colaboradores: [] };

export function semFiltros(filtros: FiltrosPlanejamento): boolean {
    return filtros.colunas.length === 0 && filtros.status.length === 0 && filtros.colaboradores.length === 0;
}

export function rotuloColaborador(pessoa: PessoaPlanejamento): string {
    const nome = pessoa.nome || pessoa.nomeJira;
    const sigla = pessoa.sigla.trim();
    if (!sigla || sigla.toLowerCase() === nome.toLowerCase()) return nome;
    return `${nome} (${sigla})`;
}

export function calcularOpcoes(resultado: ResultadoPlanejamento): OpcoesFiltrosPlanejamento {
    const status = Array.from(new Set(resultado.cartoes.map((cartao) => cartao.status)))
        .sort((a, b) => a.localeCompare(b, 'pt-BR'));
    return {
        colunas: Array.from(new Set(resultado.colunas)),
        status,
        colaboradores: Array.from(new Set(resultado.colaboradores.map((colaborador) => colaborador.pessoa.nomeJira))),
    };
}

export function podarFiltros(filtros: FiltrosPlanejamento, opcoes: OpcoesFiltrosPlanejamento): FiltrosPlanejamento {
    const colunas = filtros.colunas.filter((valor) => opcoes.colunas.includes(valor));
    const status = filtros.status.filter((valor) => opcoes.status.includes(valor));
    const colaboradores = filtros.colaboradores.filter((valor) => opcoes.colaboradores.includes(valor));
    const mudou = colunas.length !== filtros.colunas.length
        || status.length !== filtros.status.length
        || colaboradores.length !== filtros.colaboradores.length;
    return mudou ? { colunas, status, colaboradores } : filtros;
}

function normalizar(nome: string): string {
    return nome.trim().toLowerCase();
}

export function filtrarCartoes(cartoes: CartaoPlanejamento[], filtros: FiltrosPlanejamento, inverter: boolean): CartaoPlanejamento[] {
    const colunas = new Set(filtros.colunas);
    const status = new Set(filtros.status);
    const colaboradores = new Set(filtros.colaboradores.map(normalizar));

    const atende = (casou: boolean): boolean => (inverter ? !casou : casou);
    const selecionado = (pessoa: PessoaPlanejamento | null): boolean => pessoa !== null && colaboradores.has(normalizar(pessoa.nomeJira));

    return cartoes.filter((cartao) => {
        if (colunas.size > 0 && !atende(colunas.has(cartao.coluna))) return false;
        if (status.size > 0 && !atende(status.has(cartao.status))) return false;
        if (colaboradores.size > 0 && !atende(selecionado(cartao.responsavel) || selecionado(cartao.revisadoPor))) return false;
        return true;
    });
}