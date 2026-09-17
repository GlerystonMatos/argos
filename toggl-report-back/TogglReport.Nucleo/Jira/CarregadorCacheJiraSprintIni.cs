using RelatorioToggl.Configuracao;
using System.Text;
using System.Text.Json;

namespace RelatorioToggl.Jira;

public static class CarregadorCacheJiraSprintIni
{
    private const string PrefixoSecaoSprint = "Sprint:";

    private static readonly JsonSerializerOptions OpcoesJson = new() { PropertyNameCaseInsensitive = true };

    public static CacheJiraSprint Carregar(string caminho)
    {
        CacheJiraSprint cache = new();
        if (!File.Exists(caminho))
            return cache;

        Dictionary<string, Dictionary<string, string>> secoes = AnalisadorIni.Analisar(caminho);

        foreach ((string nomeSecao, Dictionary<string, string> valores) in secoes)
        {
            if (!nomeSecao.StartsWith(PrefixoSecaoSprint, StringComparison.OrdinalIgnoreCase))
                continue;

            string chaveSprint = nomeSecao.Substring(PrefixoSecaoSprint.Length);
            cache.IssuesPorSprint[chaveSprint] = DesserializarIssues(AnalisadorIni.ObterOuPadrao(valores, "Issues", "[]"));
        }

        return cache;
    }

    public static void Salvar(string caminho, CacheJiraSprint cache)
    {
        StringBuilder sb = new();

        foreach ((string chaveSprint, List<IssueJira> issues) in cache.IssuesPorSprint)
        {
            sb.AppendLine($"[{PrefixoSecaoSprint}{chaveSprint}]");
            sb.AppendLine($"Issues={JsonSerializer.Serialize(issues, OpcoesJson)}");
            sb.AppendLine();
        }

        AnalisadorIni.Escrever(caminho, sb.ToString());
    }

    public static List<IssueJira>? ObterParaSprint(string caminho, string chaveSprint)
    {
        CacheJiraSprint cache = Carregar(caminho);
        return cache.IssuesPorSprint.TryGetValue(chaveSprint, out List<IssueJira>? issues) ? issues : null;
    }

    public static void SalvarParaSprint(string caminho, string chaveSprint, List<IssueJira> issues)
    {
        CacheJiraSprint cache = Carregar(caminho);
        cache.IssuesPorSprint[chaveSprint] = issues;
        Salvar(caminho, cache);
    }

    private static List<IssueJira> DesserializarIssues(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<List<IssueJira>>(json, OpcoesJson) ?? new List<IssueJira>();
        }
        catch (JsonException)
        {
            return new List<IssueJira>();
        }
    }
}