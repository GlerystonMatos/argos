import type { Agrupamento } from '../api/tipos';

export const OPCOES_AGRUPAMENTO: { valor: Agrupamento; rotulo: string }[] = [
    { valor: 'descricao', rotulo: 'Por descrição' },
    { valor: 'tag', rotulo: 'Por tag' },
    { valor: 'ambos', rotulo: 'Ambos' },
];

export function rotularQuadroJira(id: number, nome: string, tipo?: string | null): string {
    const rotulo = nome.trim() !== '' ? `${nome} (#${id})` : `#${id}`;
    const tipoExibido = tipo === 'kanban' ? 'Kanban' : tipo === 'scrum' ? 'Scrum' : null;
    return tipoExibido ? `${rotulo} · ${tipoExibido}` : rotulo;
}

export function rotularAgrupamento(valor: Agrupamento): string {
    return OPCOES_AGRUPAMENTO.find((opcao) => opcao.valor === valor)?.rotulo ?? valor;
}