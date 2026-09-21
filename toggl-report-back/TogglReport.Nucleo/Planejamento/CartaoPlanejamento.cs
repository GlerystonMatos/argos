namespace RelatorioToggl.Planejamento;

public sealed record CartaoPlanejamento(
    string Chave,
    string Codigo,
    string Descricao,
    string UrlIssue,
    string Coluna,
    string Status,
    string? Prioridade,
    string? GrupoChave,
    string? GrupoResumo,
    PessoaPlanejamento? Responsavel,
    PessoaPlanejamento? AnalisadoPor,
    PessoaPlanejamento? RevisadoPor);