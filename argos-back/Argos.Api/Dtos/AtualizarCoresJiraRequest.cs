namespace Argos.Api.Dtos;

public record AtualizarCoresJiraRequest(Dictionary<string, string>? CoresStatus, Dictionary<string, string>? CoresPrioridade, Dictionary<string, string>? CoresColuna, Dictionary<string, string>? CoresTime, Dictionary<string, string>? CoresEpico);