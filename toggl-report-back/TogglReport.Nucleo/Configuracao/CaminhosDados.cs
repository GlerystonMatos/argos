namespace RelatorioToggl.Configuracao;

public sealed class CaminhosDados
{
    private const string NomePasta = "dados";

    private const string PrefixoCacheSprint = "SprintData_";

    private const string PrefixoCacheJiraSprint = "JiraSprintData_";

    private const int TamanhoMaximoChaveSprint = 100;

    public CaminhosDados(string diretorioBase)
    {
        PastaDados = Path.Combine(diretorioBase, NomePasta);
    }

    public string PastaDados { get; }

    public string Usuarios => Caminho("TogglUsuarios.ini");

    public string TogglConfiguracao => Caminho("TogglConfiguracao.ini");

    public string TogglTags => Caminho("TogglTags.ini");

    public string TogglTagsCache => Caminho("TogglTagsCache.ini");

    public string RelatorioParametros => Caminho("RelatorioParametros.ini");

    public string RelatorioData => Caminho("RelatorioData.ini");

    public string GantParametros => Caminho("GantParametros.ini");

    public string GantData => Caminho("GantData.ini");

    public string Sprints => Caminho("Sprints.ini");

    public string JiraConexao => Caminho("JiraConexao.ini");

    public string JiraCampos => Caminho("JiraCampos.ini");

    public string JiraStatus => Caminho("JiraStatus.ini");

    public string JiraPrioridades => Caminho("JiraPrioridades.ini");

    public string JiraTogglMapeamento => Caminho("JiraTogglMapeamento.ini");

    public string JiraStatusCache => Caminho("JiraStatusCache.ini");

    public string JiraPrioridadesCache => Caminho("JiraPrioridadesCache.ini");

    public string JiraUsuariosCache => Caminho("JiraUsuariosCache.ini");

    public string? CacheSprint(DadosSprint sprint) => CaminhoPorSprint(PrefixoCacheSprint, sprint);

    public string? CacheJiraSprint(DadosSprint sprint) => CaminhoPorSprint(PrefixoCacheJiraSprint, sprint);

    private string Caminho(string nomeArquivo) => Path.Combine(PastaDados, nomeArquivo);

    private string? CaminhoPorSprint(string prefixo, DadosSprint sprint) =>
        ChaveSprintValida(sprint.Chave) ? Caminho($"{prefixo}{sprint.Chave}.ini") : null;

    private static bool ChaveSprintValida(string chave) =>
        chave.Length is > 0 and <= TamanhoMaximoChaveSprint
        && chave.All(caractere => char.IsLetterOrDigit(caractere) || caractere is '-' or '_');
}