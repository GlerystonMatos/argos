using Argos.Nucleo.Configuracao;
using System.Globalization;
using System.Text.Json;

namespace Argos.Nucleo.Jira;

public static class CarregadorCachePlanejamentoJiraIni
{
    private const string SecaoPlanejamento = "Planejamento";

    private static readonly JsonSerializerOptions OpcoesJson = new() { PropertyNameCaseInsensitive = true };

    public static CachePlanejamentoJira? Ler(string caminho)
    {
        if (!File.Exists(caminho))
            return null;

        Dictionary<string, Dictionary<string, string>> secoes = AnalisadorIni.Analisar(caminho);
        if (!secoes.TryGetValue(SecaoPlanejamento, out Dictionary<string, string>? valores))
            return null;

        if (!long.TryParse(AnalisadorIni.ObterOuPadrao(valores, "QuadroId", ""), NumberStyles.None, CultureInfo.InvariantCulture, out long quadroId))
            return null;

        try
        {
            SprintQuadroJira? sprintJira = JsonSerializer.Deserialize<SprintQuadroJira?>(AnalisadorIni.ObterOuPadrao(valores, "SprintJira", "null"), OpcoesJson);
            List<ColunaQuadroJira>? colunas = JsonSerializer.Deserialize<List<ColunaQuadroJira>>(AnalisadorIni.ObterOuPadrao(valores, "Colunas", "[]"), OpcoesJson);
            List<CartaoQuadroJira>? cartoes = JsonSerializer.Deserialize<List<CartaoQuadroJira>>(AnalisadorIni.ObterOuPadrao(valores, "Cartoes", "[]"), OpcoesJson);

            if (colunas is null || cartoes is null)
                return null;

            return new CachePlanejamentoJira(
                quadroId,
                AnalisadorIni.ObterOuPadrao(valores, "QuadroNome", ""),
                sprintJira,
                colunas,
                cartoes,
                AnalisadorIni.ObterOuPadrao(valores, "AtualizadoEm", ""));
        }
        catch (JsonException)
        {
            return null;
        }
    }

    public static void Salvar(string caminho, CachePlanejamentoJira cache)
    {
        Dictionary<string, Dictionary<string, string>> secoes = new(StringComparer.OrdinalIgnoreCase)
        {
            [SecaoPlanejamento] = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["QuadroId"] = cache.QuadroId.ToString(CultureInfo.InvariantCulture),
                ["QuadroNome"] = cache.QuadroNome,
                ["AtualizadoEm"] = cache.AtualizadoEm,
                ["SprintJira"] = JsonSerializer.Serialize(cache.SprintJira, OpcoesJson),
                ["Colunas"] = JsonSerializer.Serialize(cache.Colunas, OpcoesJson),
                ["Cartoes"] = JsonSerializer.Serialize(cache.Cartoes, OpcoesJson)
            }
        };

        AnalisadorIni.EscreverSecoes(caminho, secoes);
    }
}