namespace Argos.Nucleo.Configuracao;

public sealed class CacheListaJira
{
    public long? QuadroId { get; set; }

    public List<string> Nomes { get; set; } = new();

    public string AtualizadoEm { get; set; } = "";
}