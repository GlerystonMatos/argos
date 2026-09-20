const CHAVE_MENU_VISIVEL = 'toggl-report:menu-visivel';

export function lerMenuVisivel(): boolean {
    try {
        return localStorage.getItem(CHAVE_MENU_VISIVEL) !== 'false';
    } catch {
        return true;
    }
}

export function gravarMenuVisivel(visivel: boolean): void {
    try {
        localStorage.setItem(CHAVE_MENU_VISIVEL, String(visivel));
    } catch {
        // localStorage indisponível (ex.: modo privado) — segue sem persistir
    }
}