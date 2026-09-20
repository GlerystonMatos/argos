using RelatorioToggl.Configuracao;
using System.Text.Json;

namespace RelatorioToggl.Jira;

public static class CarregadorCacheJiraSprintIni
{
    private const string SecaoSprint = "Sprint";

    private static readonly JsonSerializerOptions OpcoesJson = new() { PropertyNameCaseInsensitive = true };

    public static List<IssueJira>? ObterParaSprint(string caminho)
    {
        if (!File.Exists(caminho))
            return null;

        Dictionary<string, Dictionary<string, string>> secoes = AnalisadorIni.Analisar(caminho);
        if (!secoes.TryGetValue(SecaoSprint, out Dictionary<string, string>? valores))
            return null;

        return DesserializarIssues(AnalisadorIni.ObterOuPadrao(valores, "Issues", "[]"));
    }

    public static void SalvarParaSprint(string caminho, List<IssueJira> issues)
    {
        Dictionary<string, Dictionary<string, string>> secoes = new(StringComparer.OrdinalIgnoreCase)
        {
            [SecaoSprint] = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["Issues"] = JsonSerializer.Serialize(issues, OpcoesJson)
            }
        };

        AnalisadorIni.EscreverSecoes(caminho, secoes);
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