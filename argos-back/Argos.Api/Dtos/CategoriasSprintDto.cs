namespace Argos.Api.Dtos;

public record CategoriasSprintDto(List<string> Dev, List<string> Rev, List<string> Qa, string Agrupamento, List<string> TagsDetalhadas, string CorTag);