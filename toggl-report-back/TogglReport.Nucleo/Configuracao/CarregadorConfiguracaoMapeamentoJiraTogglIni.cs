using System.Text.Json;

namespace RelatorioToggl.Configuracao;

public static class CarregadorConfiguracaoMapeamentoJiraTogglIni
{
    private const string SecaoConsolidada = "JiraTogglMapeamento";

    private static readonly JsonSerializerOptions OpcoesJson = new() { PropertyNameCaseInsensitive = true };

    public static ConfiguracaoMapeamentoJiraToggl Padrao() => new();

    public static ConfiguracaoMapeamentoJiraToggl Carregar(string caminhoConsolidado)
    {
        if (File.Exists(caminhoConsolidado))
        {
            Dictionary<string, Dictionary<string, string>> secoes = AnalisadorIni.Analisar(caminhoConsolidado);
            if (secoes.TryGetValue(SecaoConsolidada, out Dictionary<string, string>? secao))
                return Mapear(secao);
        }

        return Padrao();
    }

    public static void Salvar(string caminhoConsolidado, ConfiguracaoMapeamentoJiraToggl configuracao)
    {
        Dictionary<string, Dictionary<string, string>> secoes = File.Exists(caminhoConsolidado)
            ? AnalisadorIni.Analisar(caminhoConsolidado)
            : new Dictionary<string, Dictionary<string, string>>(StringComparer.OrdinalIgnoreCase);

        secoes[SecaoConsolidada] = ParaValores(configuracao);

        AnalisadorIni.EscreverSecoes(caminhoConsolidado, secoes);
    }

    private static ConfiguracaoMapeamentoJiraToggl Mapear(Dictionary<string, string> valores) => new()
    {
        Mapeamento = LerMapa(valores, "Mapeamento")
    };

    private static Dictionary<string, string> ParaValores(ConfiguracaoMapeamentoJiraToggl configuracao) => new(StringComparer.OrdinalIgnoreCase)
    {
        ["Mapeamento"] = JsonSerializer.Serialize(configuracao.Mapeamento, OpcoesJson)
    };

    private static Dictionary<string, EntradaMapeamentoJiraToggl> LerMapa(Dictionary<string, string> secao, string chave)
    {
        string json = AnalisadorIni.ObterOuPadrao(secao, chave, "{}");
        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, EntradaMapeamentoJiraToggl>>(json, OpcoesJson)
                ?? new Dictionary<string, EntradaMapeamentoJiraToggl>(StringComparer.OrdinalIgnoreCase);
        }
        catch (JsonException)
        {
            return new Dictionary<string, EntradaMapeamentoJiraToggl>(StringComparer.OrdinalIgnoreCase);
        }
    }
}