namespace RelatorioToggl.Api.Dtos;

public record SalvarConfiguracaoJiraRequest(
    string UrlDominio,
    string Email,
    string? ApiToken,
    string CampoEstimativaEsforcoId,
    string CampoEstimativaEsforcoNome,
    string CampoRevisadoPorId,
    string CampoRevisadoPorNome);