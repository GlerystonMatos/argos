using System.Text;
using System.Text.Json;

namespace RelatorioToggl.Configuracao;

public static class CarregadorCacheListasJiraIni
{
    private const string SecaoStatus = "Status";

    private const string SecaoPrioridade = "Prioridade";

    private const string SecaoUsuarios = "Usuarios";

    private static readonly JsonSerializerOptions OpcoesJson = new() { PropertyNameCaseInsensitive = true };

    public static CacheListaJira? CarregarStatus(string caminho) => Carregar(caminho, SecaoStatus);

    public static CacheListaJira? CarregarPrioridades(string caminho) => Carregar(caminho, SecaoPrioridade);

    public static CacheListaJira? CarregarUsuarios(string caminho) => Carregar(caminho, SecaoUsuarios);

    public static void SalvarStatus(string caminho, CacheListaJira cache) => Salvar(caminho, SecaoStatus, cache);

    public static void SalvarPrioridades(string caminho, CacheListaJira cache) => Salvar(caminho, SecaoPrioridade, cache);

    public static void SalvarUsuarios(string caminho, CacheListaJira cache) => Salvar(caminho, SecaoUsuarios, cache);

    private static CacheListaJira? Carregar(string caminho, string secao)
    {
        if (!File.Exists(caminho))
            return null;

        Dictionary<string, Dictionary<string, string>> secoes = AnalisadorIni.Analisar(caminho);
        if (!secoes.TryGetValue(secao, out Dictionary<string, string>? valores))
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

    private static void Salvar(string caminho, string secao, CacheListaJira cache)
    {
        Dictionary<string, Dictionary<string, string>> secoes = File.Exists(caminho)
            ? AnalisadorIni.Analisar(caminho)
            : new Dictionary<string, Dictionary<string, string>>(StringComparer.OrdinalIgnoreCase);

        secoes[secao] = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["Nomes"] = JsonSerializer.Serialize(cache.Nomes, OpcoesJson),
            ["AtualizadoEm"] = cache.AtualizadoEm
        };

        StringBuilder sb = new();
        foreach ((string nomeSecao, Dictionary<string, string> valores) in secoes)
        {
            sb.AppendLine($"[{nomeSecao}]");
            foreach ((string chave, string valor) in valores)
                sb.AppendLine($"{chave}={valor}");
            sb.AppendLine();
        }

        AnalisadorIni.Escrever(caminho, sb.ToString());
    }
}