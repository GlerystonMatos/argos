namespace RelatorioToggl.Api.Dtos;

public record ConfiguracaoJiraDto(
    string UrlDominio,
    string Email,
    string TokenMascarado,
    string CampoEstimativaEsforcoId,
    string CampoEstimativaEsforcoNome,
    string CampoRevisadoPorId,
    string CampoRevisadoPorNome);