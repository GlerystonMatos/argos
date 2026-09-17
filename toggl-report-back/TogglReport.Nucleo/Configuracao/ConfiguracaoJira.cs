namespace RelatorioToggl.Configuracao;

public class ConfiguracaoJira
{
    public string UrlDominio { get; set; } = "";

    public string Email { get; set; } = "";

    public string ApiToken { get; set; } = "";

    public string CampoEstimativaEsforcoId { get; set; } = "";

    public string CampoEstimativaEsforcoNome { get; set; } = "";

    public string CampoRevisadoPorId { get; set; } = "";

    public string CampoRevisadoPorNome { get; set; } = "";
}