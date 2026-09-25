const PALAVRAS_IGNORADAS = new Set([
    'A', 'O', 'OS', 'AS', 'UM', 'UMA', 'E', 'DE', 'DO', 'DA', 'DOS', 'DAS',
    'EM', 'NO', 'NA', 'NOS', 'NAS', 'PARA', 'COM', 'SEM', 'PELO', 'PELA',
]);

const TAMANHO_PRIMEIRA_PALAVRA = 5;
const TAMANHO_ULTIMA_PALAVRA = 5;

function normalizar(nome: string): string {
    return nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
}

function palavras(nome: string): string[] {
    return nome.split(/[^\p{L}\p{N}]+/u).filter((palavra) => palavra !== '');
}

function palavrasPrincipais(nome: string): string[] {
    const todas = palavras(nome);
    const principais = todas.filter((palavra) => !PALAVRAS_IGNORADAS.has(normalizar(palavra)));
    return principais.length > 0 ? principais : todas;
}

function truncar(palavra: string, tamanho: number): string {
    return normalizar(palavra).slice(0, tamanho);
}

export function siglarColunas(nomes: string[]): Map<string, string> {
    const usadas = new Set<string>();
    const siglas = new Map<string, string>();

    for (const nome of nomes) {
        const principais = palavrasPrincipais(nome);
        const primeira = principais[0] ?? nome;
        const ultima = principais[principais.length - 1];
        const duasPartes = principais.length > 1;
        const separador = nome.includes('/') ? '/' : '-';

        function montar(extra: number): string {
            return duasPartes
                ? `${truncar(primeira, TAMANHO_PRIMEIRA_PALAVRA + extra)}${separador}${truncar(ultima, TAMANHO_ULTIMA_PALAVRA + extra)}`
                : truncar(primeira, TAMANHO_PRIMEIRA_PALAVRA + extra);
        }

        const limiteExtensao = normalizar(primeira).length + normalizar(ultima ?? '').length;
        let extra = 0;
        let sigla = montar(extra);
        while (usadas.has(sigla) && extra < limiteExtensao) {
            extra++;
            sigla = montar(extra);
        }

        usadas.add(sigla);
        siglas.set(nome, sigla || nome);
    }

    return siglas;
}