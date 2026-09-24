const SEPARADORES_IGNORADOS = /[-\s\u2010-\u2015\u2212]/g;

export function normalizarBusca(texto: string): string {
    return texto.toLowerCase().replace(SEPARADORES_IGNORADOS, '');
}

export function contemTermo(textos: string[] | string, termo: string): boolean {
    const termoNormalizado = normalizarBusca(termo);
    if (!termoNormalizado) return true;
    const lista = typeof textos === 'string' ? [textos] : textos;
    return lista.some((texto) => normalizarBusca(texto).includes(termoNormalizado));
}