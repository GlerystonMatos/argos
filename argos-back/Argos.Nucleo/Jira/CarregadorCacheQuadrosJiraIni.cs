using Argos.Nucleo.Configuracao;
using System.Text.Json;

namespace Argos.Nucleo.Jira;

public static class CarregadorCacheQuadrosJiraIni
{
    private const string SecaoGeral = "Geral";

    private static readonly JsonSerializerOptions OpcoesJson = new() { PropertyNameCaseInsensitive = true };

    public static CacheQuadrosJira? Carregar(string caminho)
    {
        if (!File.Exists(caminho))
            return null;

        Dictionary<string, Dictionary<string, string>> secoes = AnalisadorIni.Analisar(caminho);
        if (!secoes.TryGetValue(SecaoGeral, out Dictionary<string, string>? valores))
            return null;

        List<QuadroJira> quadros;
        try
        {
            quadros = JsonSerializer.Deserialize<List<QuadroJira>>(AnalisadorIni.ObterOuPadrao(valores, "Quadros", "[]"), OpcoesJson) ?? new List<QuadroJira>();
        }
        catch (JsonException)
        {
            quadros = new List<QuadroJira>();
        }

        return new CacheQuadrosJira
        {
            Quadros = quadros,
            AtualizadoEm = AnalisadorIni.ObterOuPadrao(valores, "AtualizadoEm", "")
        };
    }

    public static void Salvar(string caminho, CacheQuadrosJira cache)
    {
        Dictionary<string, Dictionary<string, string>> secoes = new(StringComparer.OrdinalIgnoreCase)
        {
            [SecaoGeral] = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["Quadros"] = JsonSerializer.Serialize(cache.Quadros, OpcoesJson),
                ["AtualizadoEm"] = cache.AtualizadoEm
            }
        };

        AnalisadorIni.EscreverSecoes(caminho, secoes);
    }
}