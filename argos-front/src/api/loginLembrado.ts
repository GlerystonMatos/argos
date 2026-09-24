const BANCO = 'argos-login';
const LOJA = 'lembrado';
const CHAVE_REGISTRO = 'credencial';
const VALIDADE_MS = 30 * 24 * 60 * 60 * 1000;

interface RegistroLembrado {
    chave: CryptoKey;
    iv: Uint8Array<ArrayBuffer>;
    cifrado: ArrayBuffer;
    expiraEm: number;
}

export function podeLembrarLogin(): boolean {
    try {
        return typeof indexedDB !== 'undefined' && window.isSecureContext && !!crypto.subtle;
    } catch {
        return false;
    }
}

function abrirBanco(): Promise<IDBDatabase> {
    return new Promise((resolver, rejeitar) => {
        const requisicao = indexedDB.open(BANCO, 1);
        requisicao.onupgradeneeded = () => requisicao.result.createObjectStore(LOJA);
        requisicao.onsuccess = () => resolver(requisicao.result);
        requisicao.onerror = () => rejeitar(requisicao.error);
    });
}

async function executar<T>(modo: IDBTransactionMode, operacao: (loja: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const banco = await abrirBanco();
    try {
        return await new Promise<T>((resolver, rejeitar) => {
            const requisicao = operacao(banco.transaction(LOJA, modo).objectStore(LOJA));
            requisicao.onsuccess = () => resolver(requisicao.result);
            requisicao.onerror = () => rejeitar(requisicao.error);
        });
    } finally {
        banco.close();
    }
}

export async function lembrarLogin(credencial: string): Promise<void> {
    if (!podeLembrarLogin()) return;
    try {
        const chave = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const cifrado = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, chave, new TextEncoder().encode(credencial));
        const registro: RegistroLembrado = { chave, iv, cifrado, expiraEm: Date.now() + VALIDADE_MS };
        await executar('readwrite', (loja) => loja.put(registro, CHAVE_REGISTRO));
    } catch {
        await esquecerLogin();
    }
}

export async function recuperarLoginLembrado(): Promise<string | null> {
    if (!podeLembrarLogin()) return null;
    try {
        const registro = await executar<RegistroLembrado | undefined>('readonly', (loja) => loja.get(CHAVE_REGISTRO));
        if (!registro) return null;
        if (registro.expiraEm <= Date.now()) {
            await esquecerLogin();
            return null;
        }
        const decifrado = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: registro.iv }, registro.chave, registro.cifrado);
        return new TextDecoder().decode(decifrado);
    } catch {
        await esquecerLogin();
        return null;
    }
}

export async function esquecerLogin(): Promise<void> {
    if (!podeLembrarLogin()) return;
    try {
        await executar('readwrite', (loja) => loja.delete(CHAVE_REGISTRO));
    } catch {
        // IndexedDB indisponível — nada a apagar
    }
}