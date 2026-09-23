namespace Argos.Api.Dtos;

public record TagsTogglResponse(List<string> Tags, bool VeioDoCache, string AtualizadoEm);