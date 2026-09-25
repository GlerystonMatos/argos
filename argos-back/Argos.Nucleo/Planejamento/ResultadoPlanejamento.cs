namespace Argos.Nucleo.Planejamento;

public sealed record ResultadoPlanejamento(
    string NomeQuadro,
    string? SprintJiraNome,
    string? SprintJiraInicio,
    string? SprintJiraFim,
    string AtualizadoEm,
    List<string> Colunas,
    List<int> TotaisPorColuna,
    List<CartaoPlanejamento> Cartoes,
    List<ColaboradorPlanejamento> Colaboradores,
    bool Kanban);