namespace Argos.Api.Dtos;

public record ColaboradorPlanejamentoDto(PessoaPlanejamentoDto Pessoa, List<int> Contagens, int Total);