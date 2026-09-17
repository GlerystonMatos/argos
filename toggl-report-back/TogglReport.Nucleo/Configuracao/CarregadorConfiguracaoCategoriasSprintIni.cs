namespace RelatorioToggl.Configuracao;

public static class CarregadorConfiguracaoCategoriasSprintIni
{
    private const string SecaoConsolidada = "SprintCategorias";

    public static ConfiguracaoCategoriasSprint Padrao() => new()
    {
        Dev = new List<string>(),
        Rev = new List<string>(),
        Qa = new List<string>(),
        Agrupamento = "ambos",
        TagsDetalhadas = new List<string>(),
        CorTag = ""
    };

    public static ConfiguracaoCategoriasSprint Carregar(string caminhoConsolidado)
    {
        if (File.Exists(caminhoConsolidado))
        {
            Dictionary<string, Dictionary<string, string>> secoes = AnalisadorIni.Analisar(caminhoConsolidado);
            if (secoes.TryGetValue(SecaoConsolidada, out Dictionary<string, string>? secao))
                return Mapear(secao);
        }

        return Padrao();
    }

    public static void Salvar(string caminhoConsolidado, ConfiguracaoCategoriasSprint configuracao)
    {
        Dictionary<string, Dictionary<string, string>> secoes = File.Exists(caminhoConsolidado)
            ? AnalisadorIni.Analisar(caminhoConsolidado)
            : new Dictionary<string, Dictionary<string, string>>(StringComparer.OrdinalIgnoreCase);

        secoes[SecaoConsolidada] = ParaValores(configuracao);

        AnalisadorIni.EscreverSecoes(caminhoConsolidado, secoes);
    }

    private static ConfiguracaoCategoriasSprint Mapear(Dictionary<string, string> valores)
    {
        ConfiguracaoCategoriasSprint padrao = Padrao();
        return new ConfiguracaoCategoriasSprint
        {
            Dev = LerLista(valores, "Dev", padrao.Dev),
            Rev = LerLista(valores, "Rev", padrao.Rev),
            Qa = LerLista(valores, "Qa", padrao.Qa),
            Agrupamento = AnalisadorIni.ObterOuPadrao(valores, "Agrupamento", padrao.Agrupamento),
            TagsDetalhadas = LerLista(valores, "TagsDetalhadas", padrao.TagsDetalhadas),
            CorTag = AnalisadorIni.ObterOuPadrao(valores, "CorTag", padrao.CorTag)
        };
    }

    private static Dictionary<string, string> ParaValores(ConfiguracaoCategoriasSprint configuracao) => new(StringComparer.OrdinalIgnoreCase)
    {
        ["Dev"] = string.Join(",", configuracao.Dev),
        ["Rev"] = string.Join(",", configuracao.Rev),
        ["Qa"] = string.Join(",", configuracao.Qa),
        ["Agrupamento"] = configuracao.Agrupamento,
        ["TagsDetalhadas"] = string.Join(",", configuracao.TagsDetalhadas),
        ["CorTag"] = configuracao.CorTag
    };

    private static List<string> LerLista(Dictionary<string, string> secao, string chave, List<string> valorPadrao)
    {
        string? valor = AnalisadorIni.ObterOuNulo(secao, chave);
        return valor is null ? valorPadrao : AnalisadorIni.DividirLista(valor);
    }
}