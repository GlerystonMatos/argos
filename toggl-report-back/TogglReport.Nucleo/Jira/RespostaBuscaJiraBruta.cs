namespace RelatorioToggl.Jira;

internal sealed record RespostaBuscaJiraBruta(List<IssueBrutaJira> Issues, string? NextPageToken, bool IsLast);