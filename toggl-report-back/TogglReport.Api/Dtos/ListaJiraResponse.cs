namespace RelatorioToggl.Api.Dtos;

public record ListaJiraResponse(List<string> Nomes, bool VeioDoCache, string AtualizadoEm);