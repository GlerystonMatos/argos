namespace RelatorioToggl.Configuracao;

public static class CarregadorConfiguracaoJiraIni
{
    private const string SecaoConsolidada = "Jira";

    public static ConfiguracaoJira? Carregar(string caminhoConsolidado)
    {
        if (!File.Exists(caminhoConsolidado))
            return null;

        Dictionary<string, Dictionary<string, string>> secoes = AnalisadorIni.Analisar(caminhoConsolidado);
        if (!secoes.TryGetValue(SecaoConsolidada, out Dictionary<string, string>? secao))
            return null;

        return Mapear(secao);
    }

    public static void Salvar(string caminhoConsolidado, ConfiguracaoJira configuracao)
    {
        Dictionary<string, Dictionary<string, string>> secoes = File.Exists(caminhoConsolidado)
            ? AnalisadorIni.Analisar(caminhoConsolidado)
            : new Dictionary<string, Dictionary<string, string>>(StringComparer.OrdinalIgnoreCase);

        secoes[SecaoConsolidada] = ParaValores(configuracao);

        AnalisadorIni.EscreverSecoes(caminhoConsolidado, secoes);
    }

    private static ConfiguracaoJira Mapear(Dictionary<string, string> valores) => new()
    {
        UrlDominio = AnalisadorIni.ObterOuPadrao(valores, "UrlDominio", ""),
        Email = AnalisadorIni.ObterOuPadrao(valores, "Email", ""),
        ApiToken = CriptografiaToken.Descriptografar(AnalisadorIni.ObterOuPadrao(valores, "ApiToken", "")),
        CampoEstimativaEsforcoId = AnalisadorIni.ObterOuPadrao(valores, "CampoEstimativaEsforcoId", ""),
        CampoEstimativaEsforcoNome = AnalisadorIni.ObterOuPadrao(valores, "CampoEstimativaEsforcoNome", ""),
        CampoRevisadoPorId = AnalisadorIni.ObterOuPadrao(valores, "CampoRevisadoPorId", ""),
        CampoRevisadoPorNome = AnalisadorIni.ObterOuPadrao(valores, "CampoRevisadoPorNome", ""),
    };

    private static Dictionary<string, string> ParaValores(ConfiguracaoJira configuracao) => new(StringComparer.OrdinalIgnoreCase)
    {
        ["UrlDominio"] = configuracao.UrlDominio,
        ["Email"] = configuracao.Email,
        ["ApiToken"] = CriptografiaToken.Criptografar(configuracao.ApiToken),
        ["CampoEstimativaEsforcoId"] = configuracao.CampoEstimativaEsforcoId,
        ["CampoEstimativaEsforcoNome"] = configuracao.CampoEstimativaEsforcoNome,
        ["CampoRevisadoPorId"] = configuracao.CampoRevisadoPorId,
        ["CampoRevisadoPorNome"] = configuracao.CampoRevisadoPorNome,
    };
}