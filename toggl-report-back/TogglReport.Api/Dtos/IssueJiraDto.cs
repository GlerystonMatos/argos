namespace RelatorioToggl.Api.Dtos;

public record IssueJiraDto(string Chave, string? Prioridade, string? Situacao, decimal? EstimativaOriginalHoras, decimal? EstimativaEsforcoHoras, string? UrlIssue, string? SituacaoCategoria, string? Responsavel, string? RevisadoPor);