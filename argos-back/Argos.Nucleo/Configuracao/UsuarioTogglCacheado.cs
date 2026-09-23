using Argos.Nucleo.Toggl;

namespace Argos.Nucleo.Configuracao;

public class UsuarioTogglCacheado
{
    public string Chave { get; set; } = "";

    public string NomeExibicao { get; set; } = "";

    public string TokenApi { get; set; } = "";

    public List<RegistroTempoDto> Registros { get; set; } = new();
}