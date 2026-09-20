namespace RelatorioToggl.Configuracao;

public static class CarregadorConfiguracaoCategoriasSprintIni
{
    private const string SecaoGeral = "Geral";

    private const string PrefixoSecaoTag = "Tag:";

    private const string CategoriaDev = "Dev";

    private const string CategoriaRev = "Rev";

    private const string CategoriaQa = "Qa";

    public static ConfiguracaoCategoriasSprint Padrao() => new()
    {
        Dev = new List<string>(),
        Rev = new List<string>(),
        Qa = new List<string>(),
        Agrupamento = "ambos",
        TagsDetalhadas = new List<string>(),
        CorTag = ""
    };

    public static ConfiguracaoCategoriasSprint Carregar(CaminhosDados caminhos)
    {
        ConfiguracaoCategoriasSprint configuracao = Padrao();

        if (File.Exists(caminhos.TogglConfiguracao))
        {
            Dictionary<string, Dictionary<string, string>> secoes = AnalisadorIni.Analisar(caminhos.TogglConfiguracao);
            if (secoes.TryGetValue(SecaoGeral, out Dictionary<string, string>? geral))
            {
                configuracao.Agrupamento = AnalisadorIni.ObterOuPadrao(geral, "Agrupamento", configuracao.Agrupamento);
                configuracao.CorTag = AnalisadorIni.ObterOuPadrao(geral, "CorTag", configuracao.CorTag);
            }
        }

        if (File.Exists(caminhos.TogglTags))
            CarregarTags(AnalisadorIni.Analisar(caminhos.TogglTags), configuracao);

        return configuracao;
    }

    public static void Salvar(CaminhosDados caminhos, ConfiguracaoCategoriasSprint configuracao)
    {
        Dictionary<string, Dictionary<string, string>> secoesGeral = new(StringComparer.OrdinalIgnoreCase)
        {
            [SecaoGeral] = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["Agrupamento"] = configuracao.Agrupamento,
                ["CorTag"] = configuracao.CorTag
            }
        };

        AnalisadorIni.EscreverSecoes(caminhos.TogglConfiguracao, secoesGeral);
        AnalisadorIni.EscreverSecoes(caminhos.TogglTags, MontarSecoesTags(configuracao));
    }

    private static void CarregarTags(Dictionary<string, Dictionary<string, string>> secoes, ConfiguracaoCategoriasSprint configuracao)
    {
        foreach ((string nomeSecao, Dictionary<string, string> valores) in secoes)
        {
            if (!nomeSecao.StartsWith(PrefixoSecaoTag, StringComparison.OrdinalIgnoreCase))
                continue;

            string tag = nomeSecao.Substring(PrefixoSecaoTag.Length).Trim();
            if (tag.Length == 0)
                continue;

            List<string> categorias = AnalisadorIni.DividirLista(AnalisadorIni.ObterOuNulo(valores, "Categorias"));
            if (MesclaOrdenada.Contem(categorias, CategoriaDev))
                configuracao.Dev.Add(tag);
            if (MesclaOrdenada.Contem(categorias, CategoriaRev))
                configuracao.Rev.Add(tag);
            if (MesclaOrdenada.Contem(categorias, CategoriaQa))
                configuracao.Qa.Add(tag);

            if (bool.TryParse(AnalisadorIni.ObterOuPadrao(valores, "Detalhar", "False"), out bool detalhar) && detalhar)
                configuracao.TagsDetalhadas.Add(tag);
        }
    }

    private static Dictionary<string, Dictionary<string, string>> MontarSecoesTags(ConfiguracaoCategoriasSprint configuracao)
    {
        Dictionary<string, Dictionary<string, string>> secoes = new(StringComparer.OrdinalIgnoreCase);

        foreach (string tag in MesclaOrdenada.Unir(configuracao.Dev, configuracao.Rev, configuracao.Qa, configuracao.TagsDetalhadas))
        {
            List<string> categorias = new();
            if (MesclaOrdenada.Contem(configuracao.Dev, tag))
                categorias.Add(CategoriaDev);
            if (MesclaOrdenada.Contem(configuracao.Rev, tag))
                categorias.Add(CategoriaRev);
            if (MesclaOrdenada.Contem(configuracao.Qa, tag))
                categorias.Add(CategoriaQa);

            secoes[$"{PrefixoSecaoTag}{tag}"] = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["Categorias"] = string.Join(",", categorias),
                ["Detalhar"] = MesclaOrdenada.Contem(configuracao.TagsDetalhadas, tag).ToString()
            };
        }

        return secoes;
    }
}