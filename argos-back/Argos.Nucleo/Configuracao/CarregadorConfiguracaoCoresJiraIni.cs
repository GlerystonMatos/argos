namespace Argos.Nucleo.Configuracao;

public static class CarregadorConfiguracaoCoresJiraIni
{
    private const string PrefixoSecaoPrioridade = "Prioridade:";

    private const string PrefixoSecaoColuna = "Coluna:";

    private const string PrefixoSecaoTime = "Time:";

    private const string PrefixoSecaoEpico = "Epico:";

    public static ConfiguracaoCoresJira Padrao() => new();

    public static ConfiguracaoCoresJira Carregar(CaminhosDados caminhos) => new()
    {
        CoresStatus = ArquivoStatusJiraIni.Carregar(caminhos.JiraStatus).Cores,
        CoresPrioridade = CarregarCores(caminhos.JiraPrioridades, PrefixoSecaoPrioridade),
        CoresColuna = CarregarCores(caminhos.JiraColunas, PrefixoSecaoColuna),
        CoresTime = CarregarCores(caminhos.JiraTimes, PrefixoSecaoTime),
        CoresEpico = CarregarCores(caminhos.JiraEpicos, PrefixoSecaoEpico)
    };

    public static void Salvar(CaminhosDados caminhos, ConfiguracaoCoresJira configuracao)
    {
        ArquivoStatusJiraIni.Atualizar(caminhos.JiraStatus, estado =>
        {
            estado.Cores = new Dictionary<string, string>(configuracao.CoresStatus, StringComparer.OrdinalIgnoreCase);
        });

        SalvarCores(caminhos.JiraPrioridades, PrefixoSecaoPrioridade, configuracao.CoresPrioridade);
        SalvarCores(caminhos.JiraColunas, PrefixoSecaoColuna, configuracao.CoresColuna);
        SalvarCores(caminhos.JiraTimes, PrefixoSecaoTime, configuracao.CoresTime);
        SalvarCores(caminhos.JiraEpicos, PrefixoSecaoEpico, configuracao.CoresEpico);
    }

    private static Dictionary<string, string> CarregarCores(string caminho, string prefixoSecao)
    {
        Dictionary<string, string> cores = new(StringComparer.OrdinalIgnoreCase);
        if (!File.Exists(caminho))
            return cores;

        foreach ((string nomeSecao, Dictionary<string, string> valores) in AnalisadorIni.Analisar(caminho))
        {
            if (!nomeSecao.StartsWith(prefixoSecao, StringComparison.OrdinalIgnoreCase))
                continue;

            string nome = nomeSecao.Substring(prefixoSecao.Length).Trim();
            string? cor = AnalisadorIni.ObterOuNulo(valores, "Cor");
            if (nome.Length > 0 && cor is not null)
                cores[nome] = cor;
        }

        return cores;
    }

    private static void SalvarCores(string caminho, string prefixoSecao, Dictionary<string, string> cores)
    {
        Dictionary<string, Dictionary<string, string>> secoes = new(StringComparer.OrdinalIgnoreCase);

        foreach ((string chave, string cor) in cores)
        {
            string nome = chave.Trim();
            if (nome.Length == 0)
                continue;

            secoes[$"{prefixoSecao}{nome}"] = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["Cor"] = cor
            };
        }

        AnalisadorIni.EscreverSecoes(caminho, secoes);
    }
}