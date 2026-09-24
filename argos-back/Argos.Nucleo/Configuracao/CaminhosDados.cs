namespace Argos.Nucleo.Configuracao;

public sealed class CaminhosDados
{
    internal const string NomeUsuarios = "TogglUsuarios";

    internal const string NomeTogglConfiguracao = "TogglConfiguracao";

    internal const string NomeTogglTags = "TogglTags";

    internal const string NomeTogglTagsCache = "TogglTagsCache";

    internal const string NomeRelatorioParametros = "RelatorioParametros";

    internal const string NomeRelatorioData = "RelatorioData";

    internal const string NomeGantParametros = "GantParametros";

    internal const string NomeGantData = "GantData";

    internal const string NomeSprints = "Sprints";

    internal const string NomeJiraConexao = "JiraConexao";

    internal const string NomeJiraCampos = "JiraCampos";

    internal const string NomeJiraStatus = "JiraStatus";

    internal const string NomeJiraPrioridades = "JiraPrioridades";

    internal const string NomeJiraColunas = "JiraColunas";

    internal const string NomeJiraTimes = "JiraTimes";

    internal const string NomeJiraEpicos = "JiraEpicos";

    internal const string NomeJiraQuadro = "JiraQuadro";

    internal const string NomeJiraTogglMapeamento = "JiraTogglMapeamento";

    internal const string NomeJiraStatusCache = "JiraStatusCache";

    internal const string NomeJiraPrioridadesCache = "JiraPrioridadesCache";

    internal const string NomeJiraColunasCache = "JiraColunasCache";

    internal const string NomeJiraUsuariosCache = "JiraUsuariosCache";

    internal const string NomeJiraQuadrosCache = "JiraQuadrosCache";

    internal const string PrefixoCacheSprint = "SprintData_";

    internal const string PrefixoCacheJiraSprint = "JiraSprintData_";

    internal const string PrefixoCacheJiraPlanejamento = "JiraPlanejamentoData_";

    private const int TamanhoMaximoChaveSprint = 100;

    public CaminhosDados(IArmazenamentoDados armazenamento)
    {
        Armazenamento = armazenamento;
    }

    public IArmazenamentoDados Armazenamento { get; }

    public DocumentoDados Usuarios => Documento(NomeUsuarios);

    public DocumentoDados TogglConfiguracao => Documento(NomeTogglConfiguracao);

    public DocumentoDados TogglTags => Documento(NomeTogglTags);

    public DocumentoDados TogglTagsCache => Documento(NomeTogglTagsCache);

    public DocumentoDados RelatorioParametros => Documento(NomeRelatorioParametros);

    public DocumentoDados RelatorioData => Documento(NomeRelatorioData);

    public DocumentoDados GantParametros => Documento(NomeGantParametros);

    public DocumentoDados GantData => Documento(NomeGantData);

    public DocumentoDados Sprints => Documento(NomeSprints);

    public DocumentoDados JiraConexao => Documento(NomeJiraConexao);

    public DocumentoDados JiraCampos => Documento(NomeJiraCampos);

    public DocumentoDados JiraStatus => Documento(NomeJiraStatus);

    public DocumentoDados JiraPrioridades => Documento(NomeJiraPrioridades);

    public DocumentoDados JiraColunas => Documento(NomeJiraColunas);

    public DocumentoDados JiraTimes => Documento(NomeJiraTimes);

    public DocumentoDados JiraEpicos => Documento(NomeJiraEpicos);

    public DocumentoDados JiraQuadro => Documento(NomeJiraQuadro);

    public DocumentoDados JiraTogglMapeamento => Documento(NomeJiraTogglMapeamento);

    public DocumentoDados JiraStatusCache => Documento(NomeJiraStatusCache);

    public DocumentoDados JiraPrioridadesCache => Documento(NomeJiraPrioridadesCache);

    public DocumentoDados JiraColunasCache => Documento(NomeJiraColunasCache);

    public DocumentoDados JiraUsuariosCache => Documento(NomeJiraUsuariosCache);

    public DocumentoDados JiraQuadrosCache => Documento(NomeJiraQuadrosCache);

    public DocumentoDados? CacheSprint(DadosSprint sprint) => DocumentoPorSprint(PrefixoCacheSprint, sprint);

    public DocumentoDados? CacheJiraSprint(DadosSprint sprint) => DocumentoPorSprint(PrefixoCacheJiraSprint, sprint);

    public DocumentoDados? CacheJiraPlanejamento(DadosSprint sprint) => DocumentoPorSprint(PrefixoCacheJiraPlanejamento, sprint);

    public static bool EhCacheToggl(string nome) =>
        nome.Equals(NomeRelatorioData, StringComparison.OrdinalIgnoreCase)
        || nome.Equals(NomeGantData, StringComparison.OrdinalIgnoreCase)
        || nome.StartsWith(PrefixoCacheSprint, StringComparison.OrdinalIgnoreCase);

    private DocumentoDados Documento(string nome) => new(Armazenamento, nome);

    private DocumentoDados? DocumentoPorSprint(string prefixo, DadosSprint sprint) =>
        ChaveSprintValida(sprint.Chave) ? Documento($"{prefixo}{sprint.Chave}") : null;

    private static bool ChaveSprintValida(string chave) =>
        chave.Length is > 0 and <= TamanhoMaximoChaveSprint
        && chave.All(caractere => char.IsLetterOrDigit(caractere) || caractere is '-' or '_');
}