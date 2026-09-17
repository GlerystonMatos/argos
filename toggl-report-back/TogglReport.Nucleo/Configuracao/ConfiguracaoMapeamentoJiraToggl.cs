namespace RelatorioToggl.Configuracao;

public class ConfiguracaoMapeamentoJiraToggl
{
    public Dictionary<string, EntradaMapeamentoJiraToggl> Mapeamento { get; set; } = new(StringComparer.OrdinalIgnoreCase);
}