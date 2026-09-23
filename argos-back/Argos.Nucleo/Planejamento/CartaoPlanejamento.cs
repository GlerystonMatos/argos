namespace Argos.Nucleo.Planejamento;

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
    string? Time,
    PessoaPlanejamento? Responsavel,
    PessoaPlanejamento? AnalisadoPor,
    PessoaPlanejamento? RevisadoPor,
    string? PrevisaoLiberacao = null,
    decimal? EstimativaDesenvolvimentoHoras = null,
    decimal? EstimativaRevisaoHoras = null);