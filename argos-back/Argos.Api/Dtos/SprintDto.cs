namespace Argos.Api.Dtos;

public record SprintDto(string Chave, string Nome, decimal HorasPorDia, decimal MargemPercentual, string DataInicio, string DataFim, int DiasNaoUteis, Dictionary<string, int> HorasDeduzidas, bool Fechado);