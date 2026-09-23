namespace Argos.Nucleo.Configuracao;

public static class CarregadorPeriodoIni
{
    private const string SecaoGeral = "Geral";

    public static PeriodoSalvo Carregar(string caminho)
    {
        PeriodoSalvo periodo = new();
        if (!File.Exists(caminho))
            return periodo;

        Dictionary<string, Dictionary<string, string>> secoes = AnalisadorIni.Analisar(caminho);
        if (secoes.TryGetValue(SecaoGeral, out Dictionary<string, string>? geral))
        {
            periodo.DataInicio = AnalisadorIni.ObterOuNulo(geral, "DataInicio");
            periodo.DataFim = AnalisadorIni.ObterOuNulo(geral, "DataFim");
        }

        return periodo;
    }

    public static void Salvar(string caminho, PeriodoSalvo periodo)
    {
        Dictionary<string, Dictionary<string, string>> secoes = new(StringComparer.OrdinalIgnoreCase)
        {
            [SecaoGeral] = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["DataInicio"] = periodo.DataInicio ?? "",
                ["DataFim"] = periodo.DataFim ?? ""
            }
        };

        AnalisadorIni.EscreverSecoes(caminho, secoes);
    }
}