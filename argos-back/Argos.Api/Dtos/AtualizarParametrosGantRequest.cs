namespace Argos.Api.Dtos;

public record AtualizarParametrosGantRequest(List<string> TagsSelecionadas, string Agrupamento, string? DataInicio = null, string? DataFim = null);