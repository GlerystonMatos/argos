export function paraIso(data: Date): string {
    const ano = data.getFullYear().toString().padStart(4, '0');
    const mes = (data.getMonth() + 1).toString().padStart(2, '0');
    const dia = data.getDate().toString().padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

export function ultimos30Dias(): { dataInicio: string; dataFim: string } {
    const hoje = new Date();
    const inicio = new Date(hoje);
    inicio.setDate(inicio.getDate() - 29);
    return { dataInicio: paraIso(inicio), dataFim: paraIso(hoje) };
}

export function dataEhValida(valor: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(valor) && !Number.isNaN(new Date(valor).getTime());
}

export function periodoEhValido(dataInicio: string, dataFim: string): boolean {
    return dataEhValida(dataInicio) && dataEhValida(dataFim) && dataInicio <= dataFim;
}

export function contarDiasUteis(dataInicio: string, dataFim: string): number {
    if (!periodoEhValido(dataInicio, dataFim)) return 0;
    const [anoFim, mesFim, diaFim] = dataFim.split('-').map(Number);
    const fim = new Date(anoFim, mesFim - 1, diaFim);
    const [ano, mes, dia] = dataInicio.split('-').map(Number);
    let total = 0;
    for (const data = new Date(ano, mes - 1, dia); data <= fim; data.setDate(data.getDate() + 1)) {
        const diaSemana = data.getDay();
        if (diaSemana !== 0 && diaSemana !== 6) total++;
    }
    return total;
}

export function formatarData(iso: string): string {
    const [ano, mes, dia] = iso.split('-');
    return `${dia}/${mes}/${ano}`;
}

export function formatarDiaCurto(dia: string): string {
    const [, mes, diaDoMes] = dia.split('-');
    return `${diaDoMes}/${mes}`;
}

export function formatarPeriodo(dataInicio: string, dataFim: string): string {
    return `${formatarData(dataInicio)} a ${formatarData(dataFim)}`;
}

export function formatarInicioLocal(iso: string): string {
    const data = new Date(iso);
    const horas = data.getHours().toString().padStart(2, '0');
    const minutos = data.getMinutes().toString().padStart(2, '0');
    return `${horas}:${minutos} do dia ${formatarData(paraIso(data))}`;
}

export function formatarDataLocal(iso: string): string {
    return formatarData(paraIso(new Date(iso)));
}

export function formatarDataHoraLocal(iso: string): string {
    const data = new Date(iso);
    const horas = data.getHours().toString().padStart(2, '0');
    const minutos = data.getMinutes().toString().padStart(2, '0');
    return `${formatarData(paraIso(data))} ${horas}:${minutos}`;
}