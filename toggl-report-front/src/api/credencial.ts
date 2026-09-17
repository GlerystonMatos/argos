const CHAVE_CREDENCIAL = 'toggl-report:credencial';

export function obterCredencial(): string | null {
    try {
        return sessionStorage.getItem(CHAVE_CREDENCIAL);
    } catch {
        return null;
    }
}

export function definirCredencial(credencial: string): void {
    try {
        sessionStorage.setItem(CHAVE_CREDENCIAL, credencial);
    } catch {
        // sessionStorage indisponível (ex.: modo privado) — segue sem persistir
    }
}

export function limparCredencial(): void {
    try {
        sessionStorage.removeItem(CHAVE_CREDENCIAL);
    } catch {
        // ignorar
    }
}
