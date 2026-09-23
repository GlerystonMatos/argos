namespace Argos.Nucleo.Configuracao;

internal sealed class EstadoStatusJira
{
    public List<string> Dev { get; set; } = new();

    public List<string> Rev { get; set; } = new();

    public List<string> Qa { get; set; } = new();

    public List<string> Concluido { get; set; } = new();

    public List<string> Ignorado { get; set; } = new();

    public Dictionary<string, string> Cores { get; set; } = new(StringComparer.OrdinalIgnoreCase);
}