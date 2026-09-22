namespace RelatorioToggl.Configuracao;

public class ConfiguracaoCoresJira
{
    public Dictionary<string, string> CoresStatus { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public Dictionary<string, string> CoresPrioridade { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public Dictionary<string, string> CoresColuna { get; set; } = new(StringComparer.OrdinalIgnoreCase);
}