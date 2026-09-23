namespace Argos.Api.Dtos;

public record AtualizarStatusFinalSprintRequest(List<string> StatusConcluido, List<string> StatusIgnorado);