namespace RelatorioToggl.Configuracao;

public static class CarregadorConfiguracaoResponsabilidadeSprintIni
{
    private const string SecaoConsolidada = "SprintResponsabilidade";

    public static ConfiguracaoResponsabilidadeSprint Padrao() => new()
    {
        StatusDev = new List<string>(),
        StatusRev = new List<string>(),
        StatusQa = new List<string>()
    };

    public static ConfiguracaoResponsabilidadeSprint Carregar(string caminhoConsolidado)
    {
        if (File.Exists(caminhoConsolidado))
        {
            Dictionary<string, Dictionary<string, string>> secoes = AnalisadorIni.Analisar(caminhoConsolidado);
            if (secoes.TryGetValue(SecaoConsolidada, out Dictionary<string, string>? secao))
                return Mapear(secao);
        }

        return Padrao();
    }

    public static void Salvar(string caminhoConsolidado, ConfiguracaoResponsabilidadeSprint configuracao)
    {
        Dictionary<string, Dictionary<string, string>> secoes = File.Exists(caminhoConsolidado)
            ? AnalisadorIni.Analisar(caminhoConsolidado)
            : new Dictionary<string, Dictionary<string, string>>(StringComparer.OrdinalIgnoreCase);

        secoes[SecaoConsolidada] = ParaValores(configuracao);

        AnalisadorIni.EscreverSecoes(caminhoConsolidado, secoes);
    }

    private static ConfiguracaoResponsabilidadeSprint Mapear(Dictionary<string, string> valores)
    {
        ConfiguracaoResponsabilidadeSprint padrao = Padrao();
        return new ConfiguracaoResponsabilidadeSprint
        {
            StatusDev = LerLista(valores, "StatusDev", padrao.StatusDev),
            StatusRev = LerLista(valores, "StatusRev", padrao.StatusRev),
            StatusQa = LerLista(valores, "StatusQa", padrao.StatusQa)
        };
    }

    private static Dictionary<string, string> ParaValores(ConfiguracaoResponsabilidadeSprint configuracao) => new(StringComparer.OrdinalIgnoreCase)
    {
        ["StatusDev"] = string.Join(",", configuracao.StatusDev),
        ["StatusRev"] = string.Join(",", configuracao.StatusRev),
        ["StatusQa"] = string.Join(",", configuracao.StatusQa)
    };

    private static List<string> LerLista(Dictionary<string, string> secao, string chave, List<string> valorPadrao)
    {
        string? valor = AnalisadorIni.ObterOuNulo(secao, chave);
        return valor is null ? valorPadrao : AnalisadorIni.DividirLista(valor);
    }
}