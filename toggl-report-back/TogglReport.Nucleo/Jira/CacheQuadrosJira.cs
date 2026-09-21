namespace RelatorioToggl.Jira;

public sealed class CacheQuadrosJira
{
    public List<QuadroJira> Quadros { get; set; } = new();

    public string AtualizadoEm { get; set; } = "";
}