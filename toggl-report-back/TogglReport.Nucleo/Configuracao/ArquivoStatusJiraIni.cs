namespace RelatorioToggl.Configuracao;

internal static class ArquivoStatusJiraIni
{
    private const string PrefixoSecaoStatus = "Status:";

    private const string ResponsavelDev = "Dev";

    private const string ResponsavelRev = "Rev";

    private const string ResponsavelQa = "Qa";

    private const string FinalConcluido = "Concluido";

    private const string FinalIgnorado = "Ignorado";

    private static readonly object Trava = new();

    public static void Atualizar(string caminho, Action<EstadoStatusJira> alterar)
    {
        lock (Trava)
        {
            EstadoStatusJira estado = Carregar(caminho);
            alterar(estado);
            Salvar(caminho, estado);
        }
    }

    public static EstadoStatusJira Carregar(string caminho)
    {
        lock (Trava)
        {
            return CarregarSemTrava(caminho);
        }
    }

    public static void Salvar(string caminho, EstadoStatusJira estado)
    {
        lock (Trava)
        {
            SalvarSemTrava(caminho, estado);
        }
    }

    private static EstadoStatusJira CarregarSemTrava(string caminho)
    {
        EstadoStatusJira estado = new();
        if (!File.Exists(caminho))
            return estado;

        foreach ((string nomeSecao, Dictionary<string, string> valores) in AnalisadorIni.Analisar(caminho))
        {
            if (!nomeSecao.StartsWith(PrefixoSecaoStatus, StringComparison.OrdinalIgnoreCase))
                continue;

            string status = nomeSecao.Substring(PrefixoSecaoStatus.Length).Trim();
            if (status.Length == 0)
                continue;

            string? cor = AnalisadorIni.ObterOuNulo(valores, "Cor");
            if (cor is not null)
                estado.Cores[status] = cor;

            List<string> responsaveis = AnalisadorIni.DividirLista(AnalisadorIni.ObterOuNulo(valores, "Responsaveis"));
            if (MesclaOrdenada.Contem(responsaveis, ResponsavelDev))
                estado.Dev.Add(status);
            if (MesclaOrdenada.Contem(responsaveis, ResponsavelRev))
                estado.Rev.Add(status);
            if (MesclaOrdenada.Contem(responsaveis, ResponsavelQa))
                estado.Qa.Add(status);

            string final = AnalisadorIni.ObterOuPadrao(valores, "Final", "");
            if (final.Equals(FinalConcluido, StringComparison.OrdinalIgnoreCase))
                estado.Concluido.Add(status);
            else if (final.Equals(FinalIgnorado, StringComparison.OrdinalIgnoreCase))
                estado.Ignorado.Add(status);
        }

        return estado;
    }

    private static void SalvarSemTrava(string caminho, EstadoStatusJira estado)
    {
        Dictionary<string, Dictionary<string, string>> secoes = new(StringComparer.OrdinalIgnoreCase);

        foreach (string status in MesclaOrdenada.Unir(estado.Dev, estado.Rev, estado.Qa, estado.Concluido, estado.Ignorado, estado.Cores.Keys))
        {
            Dictionary<string, string> valores = new(StringComparer.OrdinalIgnoreCase);

            if (estado.Cores.TryGetValue(status, out string? cor))
                valores["Cor"] = cor;

            List<string> responsaveis = new();
            if (MesclaOrdenada.Contem(estado.Dev, status))
                responsaveis.Add(ResponsavelDev);
            if (MesclaOrdenada.Contem(estado.Rev, status))
                responsaveis.Add(ResponsavelRev);
            if (MesclaOrdenada.Contem(estado.Qa, status))
                responsaveis.Add(ResponsavelQa);
            if (responsaveis.Count > 0)
                valores["Responsaveis"] = string.Join(",", responsaveis);

            if (MesclaOrdenada.Contem(estado.Concluido, status))
                valores["Final"] = FinalConcluido;
            else if (MesclaOrdenada.Contem(estado.Ignorado, status))
                valores["Final"] = FinalIgnorado;

            secoes[$"{PrefixoSecaoStatus}{status}"] = valores;
        }

        AnalisadorIni.EscreverSecoes(caminho, secoes);
    }
}