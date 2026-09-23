using Argos.Nucleo.Relatorios;
using Argos.Nucleo.Toggl;

namespace Argos.Api.Dtos;

public record RelatorioUsuarioTogglDto(
    string NomeExibicao,
    string Sigla,
    string Cor,
    List<LinhaDescricao> PorDescricao,
    Dictionary<string, long> PorTag,
    List<RegistroTempoDto> EmAndamento,
    long TotalSegundos);