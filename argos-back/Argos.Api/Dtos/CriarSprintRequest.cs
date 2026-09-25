namespace Argos.Api.Dtos;

public record CriarSprintRequest(string Nome, decimal? HorasPorDia, decimal? MargemPercentual, string DataInicio, string DataFim, int? DiasNaoUteis);