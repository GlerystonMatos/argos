namespace Argos.Nucleo.Configuracao;

public class DadosSprint
{
    public string Chave { get; set; } = "";

    public string Nome { get; set; } = "";

    public decimal HorasPorDia { get; set; }

    public decimal MargemPercentual { get; set; }

    public string DataInicio { get; set; } = "";

    public string DataFim { get; set; } = "";

    public int DiasNaoUteis { get; set; }

    public Dictionary<string, int> HorasDeduzidas { get; set; } = new();

    public bool Fechado { get; set; }
}