namespace RelatorioToggl.Api.Dtos;

public record AtualizarResponsabilidadeSprintRequest(List<string> StatusDev, List<string> StatusRev, List<string> StatusQa);