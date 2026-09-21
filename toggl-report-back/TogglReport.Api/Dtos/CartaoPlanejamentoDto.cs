namespace RelatorioToggl.Api.Dtos;

public record CartaoPlanejamentoDto(
    string Chave,
    string Codigo,
    string Descricao,
    string UrlIssue,
    string Coluna,
    string Status,
    string? Prioridade,
    string? GrupoChave,
    string? GrupoResumo,
    PessoaPlanejamentoDto? Responsavel,
    PessoaPlanejamentoDto? AnalisadoPor,
    PessoaPlanejamentoDto? RevisadoPor);