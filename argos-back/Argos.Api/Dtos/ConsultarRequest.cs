namespace Argos.Api.Dtos;

public record ConsultarRequest(string DataInicio, string DataFim, bool ForcarConsultaApi = false);