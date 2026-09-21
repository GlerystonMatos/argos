import type { Agrupamento, EntradaMapeamentoJiraToggl, UsuarioTogglResumo } from '../../api/tipos';

export const TOTAL_CAMPOS_JIRA = 5;

export function contarCamposJiraDefinidos(config: {
    campoEstimativaDesenvolvimentoId: string;
    campoEstimativaRevisaoId: string;
    campoEstimativaTestesId: string;
    campoRevisadoPorId: string;
    campoAnalisadoPorId: string;
} | null): number {
    if (!config) return 0;
    return [
        config.campoEstimativaDesenvolvimentoId,
        config.campoEstimativaRevisaoId,
        config.campoEstimativaTestesId,
        config.campoRevisadoPorId,
        config.campoAnalisadoPorId,
    ].filter((id) => id.trim() !== '').length;
}

export function jiraCamposCompleto(config: Parameters<typeof contarCamposJiraDefinidos>[0]): boolean {
    return contarCamposJiraDefinidos(config) === TOTAL_CAMPOS_JIRA;
}

export function togglObrigatorioCompleto(config: {
    agrupamento: Agrupamento;
    tagsDetalhadas: string[];
    dev: string[];
    rev: string[];
    qa: string[];
}): boolean {
    const tagsDetalhadasOk = config.agrupamento === 'descricao' || config.tagsDetalhadas.length > 0;
    return tagsDetalhadasOk && config.dev.length > 0 && config.rev.length > 0 && config.qa.length > 0;
}

export function statusResponsavelCompleto(config: {
    statusDev: string[];
    statusRev: string[];
    statusQa: string[];
}): boolean {
    return config.statusDev.length > 0 && config.statusRev.length > 0 && config.statusQa.length > 0;
}

export function statusFinalCompleto(config: {
    statusConcluido: string[];
    statusIgnorado: string[];
}): boolean {
    return config.statusConcluido.length > 0 && config.statusIgnorado.length > 0;
}

export interface AvaliacaoMapeamentoJiraToggl {
    completo: boolean;
    usuariosTogglSemPar: UsuarioTogglResumo[];
    entradasInvalidas: string[];
}

export function entradaMapeamentoValida(
    entrada: EntradaMapeamentoJiraToggl,
    usuariosToggl: UsuarioTogglResumo[],
): boolean {
    if (entrada.chaveToggl) return usuariosToggl.some((usuario) => usuario.chave === entrada.chaveToggl);
    return (entrada.sigla ?? '').trim() !== '';
}

export function avaliarMapeamentoJiraToggl(
    mapeamento: Record<string, EntradaMapeamentoJiraToggl>,
    usuariosToggl: UsuarioTogglResumo[],
): AvaliacaoMapeamentoJiraToggl {
    const entradas = Object.entries(mapeamento);
    const chavesMapeadas = new Set(entradas.map(([, entrada]) => entrada.chaveToggl));
    const usuariosTogglSemPar = usuariosToggl.filter((usuario) => !chavesMapeadas.has(usuario.chave));
    const entradasInvalidas = entradas
        .filter(([, entrada]) => !entradaMapeamentoValida(entrada, usuariosToggl))
        .map(([nome]) => nome);

    return {
        completo: usuariosTogglSemPar.length === 0 && entradasInvalidas.length === 0,
        usuariosTogglSemPar,
        entradasInvalidas,
    };
}

export function configuracaoObrigatoriaCompleta(config: {
    agrupamento: Agrupamento;
    tagsDetalhadas: string[];
    dev: string[];
    rev: string[];
    qa: string[];
    statusDev: string[];
    statusRev: string[];
    statusQa: string[];
    statusConcluido: string[];
    statusIgnorado: string[];
    camposJiraCompletos: boolean;
    mapeamentoCompleto: boolean;
} | null): boolean {
    if (!config) return false;
    return togglObrigatorioCompleto(config)
        && statusResponsavelCompleto(config)
        && statusFinalCompleto(config)
        && config.camposJiraCompletos
        && config.mapeamentoCompleto;
}