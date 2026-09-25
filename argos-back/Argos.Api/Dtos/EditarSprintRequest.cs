namespace Argos.Api.Dtos;

public record EditarSprintRequest(string? Nome, decimal? HorasPorDia, decimal? MargemPercentual, string? DataInicio, string? DataFim, int? DiasNaoUteis);