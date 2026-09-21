namespace RelatorioToggl.Api.Dtos;

public record ConsultarPlanejamentoRequest(string ChaveSprint, bool Forcar = false);