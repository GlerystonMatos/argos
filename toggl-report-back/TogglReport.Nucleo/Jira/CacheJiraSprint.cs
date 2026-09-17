namespace RelatorioToggl.Jira;

public class CacheJiraSprint
{
    public Dictionary<string, List<IssueJira>> IssuesPorSprint { get; set; } = new();
}