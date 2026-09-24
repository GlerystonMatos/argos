const REGEX_TEL = /^TEL\s*-?\s*(\d+)\s*-?\s*(.*)$/i;
const REGEX_PREFIXO_TEL = /^TEL\s*-?\s*\d+/i;

export interface CodigoTelDescricao {
    textoCodigo: string;
    restante: string;
    chaveJira: string;
}

export function separarCodigoTel(descricao: string): CodigoTelDescricao | null {
    const correspondencia = REGEX_TEL.exec(descricao);
    const prefixo = REGEX_PREFIXO_TEL.exec(descricao);
    if (!correspondencia || !prefixo) return null;

    const numero = correspondencia[1].replace(/^0+(?=\d)/, '');
    return {
        textoCodigo: prefixo[0],
        restante: descricao.slice(prefixo[0].length),
        chaveJira: `TEL-${numero}`,
    };
}

export function normalizarDominioJira(urlDominio: string): string {
    const dominio = urlDominio.trim().replace(/\/+$/, '');
    return /^https?:\/\//i.test(dominio) ? dominio : `https://${dominio}`;
}

export function montarUrlIssueJira(urlDominio: string | null | undefined, chave: string): string | null {
    if (!urlDominio || urlDominio.trim() === '') return null;
    return `${normalizarDominioJira(urlDominio)}/browse/${chave}`;
}