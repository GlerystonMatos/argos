namespace RelatorioToggl.Jira;

public sealed record CachePlanejamentoJira(
    long QuadroId,
    string QuadroNome,
    SprintQuadroJira? SprintJira,
    List<ColunaQuadroJira> Colunas,
    List<CartaoQuadroJira> Cartoes,
    string AtualizadoEm);