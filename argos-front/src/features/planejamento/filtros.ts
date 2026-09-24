import { contemTermo } from '../../utils/buscaTexto';
import type { CartaoPlanejamento, PessoaPlanejamento, ResultadoPlanejamento } from '../../api/tipos';
import { urgenciaPrevisaoLiberacao, type UrgenciaPrevisaoLiberacao } from '../../utils/previsaoLiberacao';

export interface FiltrosPlanejamento {
    colunas: string[];
    status: string[];
    colaboradores: string[];
    times: string[];
    epicos: string[];
    prazos: string[];
}

export type OpcoesFiltrosPlanejamento = FiltrosPlanejamento;

export const FILTROS_VAZIOS: FiltrosPlanejamento = { colunas: [], status: [], colaboradores: [], times: [], epicos: [], prazos: [] };

export function semFiltros(filtros: FiltrosPlanejamento): boolean {
    return filtros.colunas.length === 0
        && filtros.status.length === 0
        && filtros.colaboradores.length === 0
        && filtros.times.length === 0
        && filtros.epicos.length === 0
        && filtros.prazos.length === 0;
}

export function rotuloColaborador(pessoa: PessoaPlanejamento): string {
    const nome = pessoa.nome || pessoa.nomeJira;
    const sigla = pessoa.sigla.trim();
    if (!sigla || sigla.toLowerCase() === nome.toLowerCase()) return nome;
    return `${nome} (${sigla})`;
}

function valoresDistintos(valores: (string | null)[]): string[] {
    return Array.from(new Set(valores.filter((valor): valor is string => valor !== null && valor.trim() !== '')))
        .sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export function rotuloEpico(resultado: ResultadoPlanejamento, grupoChave: string): string {
    const cartao = resultado.cartoes.find((c) => c.grupoChave === grupoChave);
    return cartao?.grupoResumo ?? grupoChave;
}

export function calcularOpcoes(resultado: ResultadoPlanejamento, janelaAlertaPrevisaoLiberacaoDias: number): OpcoesFiltrosPlanejamento {
    const status = Array.from(new Set(resultado.cartoes.map((cartao) => cartao.status)))
        .sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const prazos = Array.from(new Set(
        resultado.cartoes
            .map((cartao) => urgenciaPrevisaoLiberacao(cartao.previsaoLiberacao, janelaAlertaPrevisaoLiberacaoDias))
            .filter((urgencia): urgencia is UrgenciaPrevisaoLiberacao => urgencia !== null),
    ));
    return {
        colunas: Array.from(new Set(resultado.colunas)),
        status,
        colaboradores: Array.from(new Set(resultado.colaboradores.map((colaborador) => colaborador.pessoa.nomeJira))),
        times: valoresDistintos(resultado.cartoes.map((cartao) => cartao.time)),
        epicos: valoresDistintos(resultado.cartoes.map((cartao) => cartao.grupoChave)),
        prazos,
    };
}

export function podarFiltros(filtros: FiltrosPlanejamento, opcoes: OpcoesFiltrosPlanejamento): FiltrosPlanejamento {
    const colunas = filtros.colunas.filter((valor) => opcoes.colunas.includes(valor));
    const status = filtros.status.filter((valor) => opcoes.status.includes(valor));
    const colaboradores = filtros.colaboradores.filter((valor) => opcoes.colaboradores.includes(valor));
    const times = filtros.times.filter((valor) => opcoes.times.includes(valor));
    const epicos = filtros.epicos.filter((valor) => opcoes.epicos.includes(valor));
    const prazos = filtros.prazos.filter((valor) => opcoes.prazos.includes(valor));
    const mudou = colunas.length !== filtros.colunas.length
        || status.length !== filtros.status.length
        || colaboradores.length !== filtros.colaboradores.length
        || times.length !== filtros.times.length
        || epicos.length !== filtros.epicos.length
        || prazos.length !== filtros.prazos.length;
    return mudou ? { colunas, status, colaboradores, times, epicos, prazos } : filtros;
}

function normalizar(nome: string): string {
    return nome.trim().toLowerCase();
}

export function filtrarCartoes(
    cartoes: CartaoPlanejamento[],
    filtros: FiltrosPlanejamento,
    termoBusca: string,
    inverter: boolean,
    janelaAlertaPrevisaoLiberacaoDias: number,
): CartaoPlanejamento[] {
    const colunas = new Set(filtros.colunas);
    const status = new Set(filtros.status);
    const colaboradores = new Set(filtros.colaboradores.map(normalizar));
    const times = new Set(filtros.times);
    const epicos = new Set(filtros.epicos);
    const prazos = new Set(filtros.prazos);

    const atende = (casou: boolean): boolean => (inverter ? !casou : casou);
    const selecionado = (pessoa: PessoaPlanejamento | null): boolean => pessoa !== null && colaboradores.has(normalizar(pessoa.nomeJira));

    return cartoes.filter((cartao) => {
        // A busca por texto fica fora da inversão, como no Sprint.
        if (!contemTermo([`${cartao.codigo} ${cartao.descricao}`, `${cartao.chave} ${cartao.descricao}`], termoBusca)) return false;
        if (colunas.size > 0 && !atende(colunas.has(cartao.coluna))) return false;
        if (status.size > 0 && !atende(status.has(cartao.status))) return false;
        if (colaboradores.size > 0 && !atende(selecionado(cartao.responsavel) || selecionado(cartao.revisadoPor))) return false;
        if (times.size > 0 && !atende(cartao.time !== null && times.has(cartao.time))) return false;
        if (epicos.size > 0 && !atende(cartao.grupoChave !== null && epicos.has(cartao.grupoChave))) return false;
        if (prazos.size > 0) {
            const urgencia = urgenciaPrevisaoLiberacao(cartao.previsaoLiberacao, janelaAlertaPrevisaoLiberacaoDias);
            if (!atende(urgencia !== null && prazos.has(urgencia))) return false;
        }
        return true;
    });
}