namespace RelatorioToggl.Configuracao;

public static class CaminhosDados
{
    private const string NomePasta = "dados";

    private const string NomeArquivoConfiguracao = "RelatorioParametros.ini";

    private const string NomeArquivoUsuarios = "TogglUsuarios.ini";

    private const string NomeArquivoSprints = "Sprints.ini";

    private const string NomeArquivoCacheSprint = "SprintData.ini";

    private const string NomeArquivoCache = "RelatorioData.ini";

    private const string NomeArquivoParametrosGant = "GantParametros.ini";

    private const string NomeArquivoCacheGant = "GantData.ini";

    private const string NomeArquivoJiraSprintData = "JiraSprintData.ini";

    private const string NomeArquivoCacheTagsToggl = "TogglTagsCache.ini";

    private const string NomeArquivoCacheListasJira = "JiraListasCache.ini";

    private const string NomeArquivoCoresJira = "JiraCores.ini";

    private const string NomeArquivoConfiguracoesGerais = "ConfiguracoesGerais.ini";

    public static string PastaDados(string diretorioBase) => Path.Combine(diretorioBase, NomePasta);

    public static string CaminhoConfiguracao(string diretorioBase) =>
        Path.Combine(PastaDados(diretorioBase), NomeArquivoConfiguracao);

    public static string CaminhoUsuarios(string diretorioBase) =>
        Path.Combine(PastaDados(diretorioBase), NomeArquivoUsuarios);

    public static string CaminhoSprints(string diretorioBase) =>
        Path.Combine(PastaDados(diretorioBase), NomeArquivoSprints);

    public static string CaminhoCacheSprint(string diretorioBase) =>
        Path.Combine(PastaDados(diretorioBase), NomeArquivoCacheSprint);

    public static string CaminhoCache(string diretorioBase) =>
        Path.Combine(PastaDados(diretorioBase), NomeArquivoCache);

    public static string CaminhoParametrosGant(string diretorioBase) =>
        Path.Combine(PastaDados(diretorioBase), NomeArquivoParametrosGant);

    public static string CaminhoCacheGant(string diretorioBase) =>
        Path.Combine(PastaDados(diretorioBase), NomeArquivoCacheGant);

    public static string CaminhoJiraSprintData(string diretorioBase) =>
        Path.Combine(PastaDados(diretorioBase), NomeArquivoJiraSprintData);

    public static string CaminhoCacheTagsToggl(string diretorioBase) =>
        Path.Combine(PastaDados(diretorioBase), NomeArquivoCacheTagsToggl);

    public static string CaminhoCacheListasJira(string diretorioBase) =>
        Path.Combine(PastaDados(diretorioBase), NomeArquivoCacheListasJira);

    public static string CaminhoCoresJira(string diretorioBase) =>
        Path.Combine(PastaDados(diretorioBase), NomeArquivoCoresJira);

    public static string CaminhoConfiguracoesGerais(string diretorioBase) =>
        Path.Combine(PastaDados(diretorioBase), NomeArquivoConfiguracoesGerais);
}
