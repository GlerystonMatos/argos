namespace RelatorioToggl.Api.Dtos;

public record SprintDto(string Chave, string Nome, decimal HorasPorDia, decimal MargemPercentual, string DataInicio, string DataFim, bool Fechado);