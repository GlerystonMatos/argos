using System.Text;
using System.Text.Json;

namespace RelatorioToggl.Configuracao;

public static class CarregadorCacheTagsTogglIni
{
    private const string NomeSecao = "Geral";

    private static readonly JsonSerializerOptions OpcoesJson = new() { PropertyNameCaseInsensitive = true };

    public static CacheTagsToggl? Carregar(string caminho)
    {
        if (!File.Exists(caminho))
            return null;

        Dictionary<string, Dictionary<string, string>> secoes = AnalisadorIni.Analisar(caminho);
        if (!secoes.TryGetValue(NomeSecao, out Dictionary<string, string>? valores))
            return null;

        List<string> tags;
        try
        {
            tags = JsonSerializer.Deserialize<List<string>>(AnalisadorIni.ObterOuPadrao(valores, "Tags", "[]"), OpcoesJson) ?? new List<string>();
        }
        catch (JsonException)
        {
            tags = new List<string>();
        }

        return new CacheTagsToggl
        {
            Tags = tags,
            AtualizadoEm = AnalisadorIni.ObterOuPadrao(valores, "AtualizadoEm", "")
        };
    }

    public static void Salvar(string caminho, CacheTagsToggl cache)
    {
        StringBuilder sb = new();
        sb.AppendLine($"[{NomeSecao}]");
        sb.AppendLine($"Tags={JsonSerializer.Serialize(cache.Tags, OpcoesJson)}");
        sb.AppendLine($"AtualizadoEm={cache.AtualizadoEm}");
        AnalisadorIni.Escrever(caminho, sb.ToString());
    }
}