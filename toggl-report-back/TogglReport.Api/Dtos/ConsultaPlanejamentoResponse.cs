namespace RelatorioToggl.Api.Dtos;

public record ConsultaPlanejamentoResponse(bool VeioDoCache, string AtualizadoEm, string QuadroNome, string? SprintJiraNome, int QuantidadeCartoes);