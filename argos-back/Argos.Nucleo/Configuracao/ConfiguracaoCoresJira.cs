namespace Argos.Nucleo.Configuracao;

public class ConfiguracaoCoresJira
{
    public Dictionary<string, string> CoresStatus { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public Dictionary<string, string> CoresPrioridade { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public Dictionary<string, string> CoresColunaDev { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public Dictionary<string, string> CoresColunaAnalise { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public Dictionary<string, string> CoresTime { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public Dictionary<string, string> CoresEpico { get; set; } = new(StringComparer.OrdinalIgnoreCase);
}