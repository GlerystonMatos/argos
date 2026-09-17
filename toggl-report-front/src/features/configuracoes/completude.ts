import type { Agrupamento } from '../../api/tipos';

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

export function configuracaoObrigatoriaCompleta(config: {
    agrupamento: Agrupamento;
    tagsDetalhadas: string[];
    dev: string[];
    rev: string[];
    qa: string[];
    statusDev: string[];
    statusRev: string[];
    statusQa: string[];
} | null): boolean {
    if (!config) return false;
    return togglObrigatorioCompleto(config) && statusResponsavelCompleto(config);
}