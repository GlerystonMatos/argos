using Argos.Nucleo.Toggl;

namespace Argos.Nucleo.Consultas;

public class ResultadoConsulta
{
    public required Dictionary<string, List<RegistroTempoDto>> RegistrosPorUsuario { get; init; }

    public required List<string> OrdemUsuarios { get; init; }

    public required bool VeioDoCache { get; init; }
}