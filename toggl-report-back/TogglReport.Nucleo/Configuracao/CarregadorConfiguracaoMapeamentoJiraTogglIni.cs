namespace RelatorioToggl.Configuracao;

public static class CarregadorConfiguracaoMapeamentoJiraTogglIni
{
    private const string PrefixoSecaoUsuario = "Usuario:";

    public static ConfiguracaoMapeamentoJiraToggl Padrao() => new();

    public static ConfiguracaoMapeamentoJiraToggl Carregar(string caminho)
    {
        ConfiguracaoMapeamentoJiraToggl configuracao = Padrao();
        if (!File.Exists(caminho))
            return configuracao;

        foreach ((string nomeSecao, Dictionary<string, string> valores) in AnalisadorIni.Analisar(caminho))
        {
            if (!nomeSecao.StartsWith(PrefixoSecaoUsuario, StringComparison.OrdinalIgnoreCase))
                continue;

            string usuarioJira = nomeSecao.Substring(PrefixoSecaoUsuario.Length).Trim();
            if (usuarioJira.Length == 0)
                continue;

            configuracao.Mapeamento[usuarioJira] = new EntradaMapeamentoJiraToggl
            {
                ChaveToggl = AnalisadorIni.ObterOuNulo(valores, "ChaveToggl"),
                Sigla = AnalisadorIni.ObterOuNulo(valores, "Sigla"),
                Cor = AnalisadorIni.ObterOuNulo(valores, "Cor")
            };
        }

        return configuracao;
    }

    public static void Salvar(string caminho, ConfiguracaoMapeamentoJiraToggl configuracao)
    {
        Dictionary<string, Dictionary<string, string>> secoes = new(StringComparer.OrdinalIgnoreCase);

        foreach ((string usuarioJira, EntradaMapeamentoJiraToggl entrada) in configuracao.Mapeamento)
        {
            string nome = usuarioJira.Trim();
            if (nome.Length == 0)
                continue;

            Dictionary<string, string> valores = new(StringComparer.OrdinalIgnoreCase);
            if (entrada.ChaveToggl is not null)
                valores["ChaveToggl"] = entrada.ChaveToggl;
            if (entrada.Sigla is not null)
                valores["Sigla"] = entrada.Sigla;
            if (entrada.Cor is not null)
                valores["Cor"] = entrada.Cor;

            secoes[$"{PrefixoSecaoUsuario}{nome}"] = valores;
        }

        AnalisadorIni.EscreverSecoes(caminho, secoes);
    }
}