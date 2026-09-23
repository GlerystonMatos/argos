namespace Argos.Api.Dtos;

public record QuadrosJiraResponse(List<QuadroJiraDto> Quadros, bool VeioDoCache, string AtualizadoEm);