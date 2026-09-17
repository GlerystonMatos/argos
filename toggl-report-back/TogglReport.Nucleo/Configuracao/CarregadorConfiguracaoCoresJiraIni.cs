using System.Text;
using System.Text.Json;

namespace RelatorioToggl.Configuracao;

public static class CarregadorConfiguracaoCoresJiraIni
{
    private const string SecaoGeral = "Geral";

    private static readonly JsonSerializerOptions OpcoesJson = new() { PropertyNameCaseInsensitive = true };

    public static ConfiguracaoCoresJira Padrao() => new();

    public static ConfiguracaoCoresJira Carregar(string caminho)
    {
        if (!File.Exists(caminho))
            return Padrao();

        Dictionary<string, Dictionary<string, string>> secoes = AnalisadorIni.Analisar(caminho);
        if (!secoes.TryGetValue(SecaoGeral, out Dictionary<string, string>? geral))
            return Padrao();

        return new ConfiguracaoCoresJira
        {
            CoresStatus = LerMapa(geral, "CoresStatus"),
            CoresPrioridade = LerMapa(geral, "CoresPrioridade")
        };
    }

    public static void Salvar(string caminho, ConfiguracaoCoresJira configuracao)
    {
        StringBuilder sb = new();

        sb.AppendLine($"[{SecaoGeral}]");
        sb.AppendLine($"CoresStatus={JsonSerializer.Serialize(configuracao.CoresStatus, OpcoesJson)}");
        sb.AppendLine($"CoresPrioridade={JsonSerializer.Serialize(configuracao.CoresPrioridade, OpcoesJson)}");

        AnalisadorIni.Escrever(caminho, sb.ToString());
    }

    private static Dictionary<string, string> LerMapa(Dictionary<string, string> secao, string chave)
    {
        string json = AnalisadorIni.ObterOuPadrao(secao, chave, "{}");
        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, string>>(json, OpcoesJson) ?? new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        }
        catch (JsonException)
        {
            return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        }
    }
}