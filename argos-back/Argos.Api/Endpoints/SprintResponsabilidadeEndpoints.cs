using Argos.Api.Dtos;
using Argos.Nucleo.Configuracao;

namespace Argos.Api.Endpoints;

public static class SprintResponsabilidadeEndpoints
{
    public static void MapSprintResponsabilidadeEndpoints(this WebApplication app, CaminhosDados caminhos)
    {
        RouteGroupBuilder grupo = app.MapGroup("/api/sprint/responsabilidade").WithTags("Sprint");

        grupo.MapGet("/", () =>
        {
            ConfiguracaoResponsabilidadeSprint configuracao = CarregadorConfiguracaoResponsabilidadeSprint.Carregar(caminhos.JiraStatus);
            return Results.Ok(new ResponsabilidadeSprintDto(configuracao.StatusDev, configuracao.StatusRev, configuracao.StatusQa));
        })
        .WithSummary("Obtém o mapeamento global de status do Jira por grupo responsável (DEV/REV/QA)");

        grupo.MapPut("/", (AtualizarResponsabilidadeSprintRequest request) =>
        {
            ConfiguracaoResponsabilidadeSprint configuracao = new()
            {
                StatusDev = NormalizacaoListas.Normalizar(request.StatusDev),
                StatusRev = NormalizacaoListas.Normalizar(request.StatusRev),
                StatusQa = NormalizacaoListas.Normalizar(request.StatusQa)
            };

            IResult? erroPersistencia = TratamentoIo.Executar(
                () => CarregadorConfiguracaoResponsabilidadeSprint.Salvar(caminhos.JiraStatus, configuracao),
                "Não foi possível salvar a responsabilidade por status.");
            if (erroPersistencia is not null)
                return erroPersistencia;

            return Results.Ok(new ResponsabilidadeSprintDto(configuracao.StatusDev, configuracao.StatusRev, configuracao.StatusQa));
        })
        .WithSummary("Atualiza o mapeamento global de status do Jira por grupo responsável (DEV/REV/QA)");
    }
}