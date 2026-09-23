namespace Argos.Api.Dtos;

public record ObterCamposJiraRequest(string? UrlDominio = null, string? Email = null, string? ApiToken = null);