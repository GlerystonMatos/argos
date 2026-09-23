import { CORES } from '../theme';

export type UrgenciaPrevisaoLiberacao = 'vencida' | 'proxima' | 'noPrazo';

export function urgenciaPrevisaoLiberacao(previsaoIso: string | null, janelaAlertaDias: number): UrgenciaPrevisaoLiberacao | null {
    if (!previsaoIso) return null;

    const data = new Date(`${previsaoIso}T00:00:00`);
    if (Number.isNaN(data.getTime())) return null;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const diasRestantes = Math.round((data.getTime() - hoje.getTime()) / 86_400_000);
    if (diasRestantes <= 0) return 'vencida';
    if (diasRestantes <= janelaAlertaDias) return 'proxima';
    return 'noPrazo';
}

export function corPrevisaoLiberacao(urgencia: UrgenciaPrevisaoLiberacao | null): string | undefined {
    if (urgencia === 'vencida') return CORES.corPendente;
    if (urgencia === 'proxima') return CORES.corPrazoProximo;
    if (urgencia === 'noPrazo') return CORES.corConcluido;
    return undefined;
}

export const ROTULOS_URGENCIA_PREVISAO_LIBERACAO: Record<UrgenciaPrevisaoLiberacao, string> = {
    vencida: 'Prazo vencido',
    proxima: 'Perto do prazo',
    noPrazo: 'No prazo',
};