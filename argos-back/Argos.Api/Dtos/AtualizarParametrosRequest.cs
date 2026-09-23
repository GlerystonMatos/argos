namespace Argos.Api.Dtos;

public record AtualizarParametrosRequest(string Agrupamento, List<string> TagsDetalhadas, string? DataInicio = null, string? DataFim = null);