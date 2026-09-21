namespace RelatorioToggl.Configuracao;

public static class CarregadorConfiguracaoJiraIni
{
    private const string SecaoConexao = "Conexao";

    private const string PrefixoSecaoCampo = "Campo:";

    private const string CampoEstimativaDesenvolvimento = "EstimativaDesenvolvimento";

    private const string CampoEstimativaRevisao = "EstimativaRevisao";

    private const string CampoEstimativaTestes = "EstimativaTestes";

    private const string CampoRevisadoPor = "RevisadoPor";

    private const string CampoAnalisadoPor = "AnalisadoPor";

    public static ConfiguracaoJira Carregar(CaminhosDados caminhos)
    {
        ConfiguracaoJira configuracao = new();

        if (File.Exists(caminhos.JiraConexao))
        {
            Dictionary<string, Dictionary<string, string>> secoes = AnalisadorIni.Analisar(caminhos.JiraConexao);
            if (secoes.TryGetValue(SecaoConexao, out Dictionary<string, string>? conexao))
            {
                configuracao.UrlDominio = AnalisadorIni.ObterOuPadrao(conexao, "UrlDominio", "");
                configuracao.Email = AnalisadorIni.ObterOuPadrao(conexao, "Email", "");
                configuracao.ApiToken = CriptografiaToken.Descriptografar(AnalisadorIni.ObterOuPadrao(conexao, "ApiToken", ""));
                configuracao.QuadroId = long.TryParse(AnalisadorIni.ObterOuPadrao(conexao, "QuadroId", ""), out long quadroId) ? quadroId : null;
                configuracao.QuadroNome = AnalisadorIni.ObterOuPadrao(conexao, "QuadroNome", "");
            }
        }

        if (File.Exists(caminhos.JiraCampos))
        {
            Dictionary<string, Dictionary<string, string>> campos = AnalisadorIni.Analisar(caminhos.JiraCampos);
            (configuracao.CampoEstimativaDesenvolvimentoId, configuracao.CampoEstimativaDesenvolvimentoNome) = LerCampo(campos, CampoEstimativaDesenvolvimento);
            (configuracao.CampoEstimativaRevisaoId, configuracao.CampoEstimativaRevisaoNome) = LerCampo(campos, CampoEstimativaRevisao);
            (configuracao.CampoEstimativaTestesId, configuracao.CampoEstimativaTestesNome) = LerCampo(campos, CampoEstimativaTestes);
            (configuracao.CampoRevisadoPorId, configuracao.CampoRevisadoPorNome) = LerCampo(campos, CampoRevisadoPor);
            (configuracao.CampoAnalisadoPorId, configuracao.CampoAnalisadoPorNome) = LerCampo(campos, CampoAnalisadoPor);
        }

        return configuracao;
    }

    public static void Salvar(CaminhosDados caminhos, ConfiguracaoJira configuracao)
    {
        Dictionary<string, Dictionary<string, string>> conexao = new(StringComparer.OrdinalIgnoreCase)
        {
            [SecaoConexao] = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["UrlDominio"] = configuracao.UrlDominio,
                ["Email"] = configuracao.Email,
                ["ApiToken"] = CriptografiaToken.Criptografar(configuracao.ApiToken),
                ["QuadroId"] = configuracao.QuadroId?.ToString() ?? "",
                ["QuadroNome"] = configuracao.QuadroNome
            }
        };

        Dictionary<string, Dictionary<string, string>> campos = new(StringComparer.OrdinalIgnoreCase);
        AdicionarCampo(campos, CampoEstimativaDesenvolvimento, configuracao.CampoEstimativaDesenvolvimentoId, configuracao.CampoEstimativaDesenvolvimentoNome);
        AdicionarCampo(campos, CampoEstimativaRevisao, configuracao.CampoEstimativaRevisaoId, configuracao.CampoEstimativaRevisaoNome);
        AdicionarCampo(campos, CampoEstimativaTestes, configuracao.CampoEstimativaTestesId, configuracao.CampoEstimativaTestesNome);
        AdicionarCampo(campos, CampoRevisadoPor, configuracao.CampoRevisadoPorId, configuracao.CampoRevisadoPorNome);
        AdicionarCampo(campos, CampoAnalisadoPor, configuracao.CampoAnalisadoPorId, configuracao.CampoAnalisadoPorNome);

        AnalisadorIni.EscreverSecoes(caminhos.JiraConexao, conexao);
        AnalisadorIni.EscreverSecoes(caminhos.JiraCampos, campos);
    }

    private static (string Id, string Nome) LerCampo(Dictionary<string, Dictionary<string, string>> secoes, string campo)
    {
        if (!secoes.TryGetValue($"{PrefixoSecaoCampo}{campo}", out Dictionary<string, string>? valores))
            return ("", "");

        return (AnalisadorIni.ObterOuPadrao(valores, "Id", ""), AnalisadorIni.ObterOuPadrao(valores, "Nome", ""));
    }

    private static void AdicionarCampo(Dictionary<string, Dictionary<string, string>> secoes, string campo, string id, string nome)
    {
        secoes[$"{PrefixoSecaoCampo}{campo}"] = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["Id"] = id,
            ["Nome"] = nome
        };
    }
}