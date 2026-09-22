using System.Text.Json;

namespace RelatorioToggl.Configuracao;

public static class CarregadorConfiguracaoQuadroPlanejamentoIni
{
    private const string SecaoGeral = "Geral";

    private static readonly JsonSerializerOptions OpcoesJson = new() { PropertyNameCaseInsensitive = true };

    public static ConfiguracaoQuadroPlanejamento Padrao() => new();

    public static ConfiguracaoQuadroPlanejamento Carregar(string caminho)
    {
        if (!File.Exists(caminho))
            return Padrao();

        Dictionary<string, Dictionary<string, string>> secoes = AnalisadorIni.Analisar(caminho);
        if (!secoes.TryGetValue(SecaoGeral, out Dictionary<string, string>? valores))
            return Padrao();

        List<string> colunasOcultas;
        try
        {
            colunasOcultas = JsonSerializer.Deserialize<List<string>>(AnalisadorIni.ObterOuPadrao(valores, "ColunasOcultas", "[]"), OpcoesJson) ?? new List<string>();
        }
        catch (JsonException)
        {
            colunasOcultas = new List<string>();
        }

        return new ConfiguracaoQuadroPlanejamento { ColunasOcultas = colunasOcultas };
    }

    public static void Salvar(string caminho, ConfiguracaoQuadroPlanejamento configuracao)
    {
        Dictionary<string, Dictionary<string, string>> secoes = new(StringComparer.OrdinalIgnoreCase)
        {
            [SecaoGeral] = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["ColunasOcultas"] = JsonSerializer.Serialize(configuracao.ColunasOcultas, OpcoesJson)
            }
        };

        AnalisadorIni.EscreverSecoes(caminho, secoes);
    }
}
