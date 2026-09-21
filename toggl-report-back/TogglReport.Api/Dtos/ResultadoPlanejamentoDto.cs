namespace RelatorioToggl.Api.Dtos;

public record ResultadoPlanejamentoDto(
    string NomeQuadro,
    string? SprintJiraNome,
    string? SprintJiraInicio,
    string? SprintJiraFim,
    string AtualizadoEm,
    List<string> Colunas,
    List<int> TotaisPorColuna,
    List<CartaoPlanejamentoDto> Cartoes,
    List<ColaboradorPlanejamentoDto> Colaboradores);