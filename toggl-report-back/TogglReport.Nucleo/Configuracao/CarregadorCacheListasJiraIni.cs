using System.Text.Json;

namespace RelatorioToggl.Configuracao;

public static class CarregadorCacheListasJiraIni
{
    private const string SecaoGeral = "Geral";

    private static readonly JsonSerializerOptions OpcoesJson = new() { PropertyNameCaseInsensitive = true };

    public static CacheListaJira? Carregar(string caminho)
    {
        if (!File.Exists(caminho))
            return null;

        Dictionary<string, Dictionary<string, string>> secoes = AnalisadorIni.Analisar(caminho);
        if (!secoes.TryGetValue(SecaoGeral, out Dictionary<string, string>? valores))
            return null;

        List<string> nomes;
        try
        {
            nomes = JsonSerializer.Deserialize<List<string>>(AnalisadorIni.ObterOuPadrao(valores, "Nomes", "[]"), OpcoesJson) ?? new List<string>();
        }
        catch (JsonException)
        {
            nomes = new List<string>();
        }

        return new CacheListaJira
        {
            Nomes = nomes,
            AtualizadoEm = AnalisadorIni.ObterOuPadrao(valores, "AtualizadoEm", "")
        };
    }

    public static void Salvar(string caminho, CacheListaJira cache)
    {
        Dictionary<string, Dictionary<string, string>> secoes = new(StringComparer.OrdinalIgnoreCase)
        {
            [SecaoGeral] = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["Nomes"] = JsonSerializer.Serialize(cache.Nomes, OpcoesJson),
                ["AtualizadoEm"] = cache.AtualizadoEm
            }
        };

        AnalisadorIni.EscreverSecoes(caminho, secoes);
    }
}