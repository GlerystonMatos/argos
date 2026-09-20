namespace RelatorioToggl.Configuracao;

public static class CarregadorConfiguracaoCoresJiraIni
{
    private const string PrefixoSecaoPrioridade = "Prioridade:";

    public static ConfiguracaoCoresJira Padrao() => new();

    public static ConfiguracaoCoresJira Carregar(CaminhosDados caminhos) => new()
    {
        CoresStatus = ArquivoStatusJiraIni.Carregar(caminhos.JiraStatus).Cores,
        CoresPrioridade = CarregarPrioridades(caminhos.JiraPrioridades)
    };

    public static void Salvar(CaminhosDados caminhos, ConfiguracaoCoresJira configuracao)
    {
        ArquivoStatusJiraIni.Atualizar(caminhos.JiraStatus, estado =>
        {
            estado.Cores = new Dictionary<string, string>(configuracao.CoresStatus, StringComparer.OrdinalIgnoreCase);
        });

        SalvarPrioridades(caminhos.JiraPrioridades, configuracao.CoresPrioridade);
    }

    private static Dictionary<string, string> CarregarPrioridades(string caminho)
    {
        Dictionary<string, string> cores = new(StringComparer.OrdinalIgnoreCase);
        if (!File.Exists(caminho))
            return cores;

        foreach ((string nomeSecao, Dictionary<string, string> valores) in AnalisadorIni.Analisar(caminho))
        {
            if (!nomeSecao.StartsWith(PrefixoSecaoPrioridade, StringComparison.OrdinalIgnoreCase))
                continue;

            string prioridade = nomeSecao.Substring(PrefixoSecaoPrioridade.Length).Trim();
            string? cor = AnalisadorIni.ObterOuNulo(valores, "Cor");
            if (prioridade.Length > 0 && cor is not null)
                cores[prioridade] = cor;
        }

        return cores;
    }

    private static void SalvarPrioridades(string caminho, Dictionary<string, string> cores)
    {
        Dictionary<string, Dictionary<string, string>> secoes = new(StringComparer.OrdinalIgnoreCase);

        foreach ((string prioridade, string cor) in cores)
        {
            string nome = prioridade.Trim();
            if (nome.Length == 0)
                continue;

            secoes[$"{PrefixoSecaoPrioridade}{nome}"] = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["Cor"] = cor
            };
        }

        AnalisadorIni.EscreverSecoes(caminho, secoes);
    }
}