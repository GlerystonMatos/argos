using Argos.Nucleo.Consultas;

namespace Argos.Api.Dtos;

public record ConsultarResponse(string DataInicio, string DataFim, bool VeioDoCache, List<EventoConsultaUsuarioToggl> Usuarios);