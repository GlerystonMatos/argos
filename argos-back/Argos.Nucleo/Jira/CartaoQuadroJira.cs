namespace Argos.Nucleo.Jira;

public sealed record CartaoQuadroJira(
    string Chave,
    string Resumo,
    string StatusId,
    string Status,
    string? Prioridade,
    string? GrupoChave,
    string? GrupoResumo,
    string? Responsavel,
    string? AnalisadoPor,
    string? RevisadoPor,
    string? Time,
    string UrlIssue,
    string? PrevisaoLiberacao = null,
    decimal? EstimativaDesenvolvimentoHoras = null,
    decimal? EstimativaRevisaoHoras = null);