namespace RelatorioToggl.Api.Dtos;

public record ConsultarSprintRequest(string DataInicio, string DataFim, string ChaveSprint, string? Origem = null);