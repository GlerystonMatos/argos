namespace Argos.Nucleo.Configuracao;

public class ConfiguracaoQuadroPlanejamento
{
    public List<string> ColunasOcultasDev { get; set; } = new();

    public List<string> ColunasOcultasAnalise { get; set; } = new();

    public List<string> ColunasOcultas(TipoQuadroJira quadro) => quadro == TipoQuadroJira.Dev ? ColunasOcultasDev : ColunasOcultasAnalise;
}