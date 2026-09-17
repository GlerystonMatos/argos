namespace RelatorioToggl.Api.Dtos;

public record TagsTogglResponse(List<string> Tags, bool VeioDoCache, string AtualizadoEm);