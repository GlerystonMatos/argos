using RelatorioToggl.Api.Dtos;
using RelatorioToggl.Configuracao;

namespace RelatorioToggl.Api.Endpoints;

public static class SprintStatusFinalEndpoints
{
    public static void MapSprintStatusFinalEndpoints(this WebApplication app, CaminhosDados caminhos)
    {
        RouteGroupBuilder grupo = app.MapGroup("/api/sprint/status-final").WithTags("Sprint");

        grupo.MapGet("/", () =>
        {
            ConfiguracaoStatusFinalSprint configuracao = CarregadorConfiguracaoStatusFinalSprintIni.Carregar(caminhos.JiraStatus);
            return Results.Ok(new StatusFinalSprintDto(configuracao.StatusConcluido, configuracao.StatusIgnorado));
        })
        .WithSummary("Obtém o mapeamento global de status finais do Jira (Concluído/Ignorado) para os totalizadores do Sprint");

        grupo.MapPut("/", (AtualizarStatusFinalSprintRequest request) =>
        {
            List<string> statusConcluido = NormalizacaoListas.Normalizar(request.StatusConcluido);
            List<string> statusIgnorado = NormalizacaoListas.Normalizar(request.StatusIgnorado);

            if (statusConcluido.Intersect(statusIgnorado, StringComparer.OrdinalIgnoreCase).Any())
                return Results.BadRequest("Um status não pode estar em Concluído e Ignorado ao mesmo tempo.");

            ConfiguracaoStatusFinalSprint configuracao = new()
            {
                StatusConcluido = statusConcluido,
                StatusIgnorado = statusIgnorado
            };

            IResult? erroPersistencia = TratamentoIo.Executar(
                () => CarregadorConfiguracaoStatusFinalSprintIni.Salvar(caminhos.JiraStatus, configuracao),
                "Não foi possível salvar os status finais.");
            if (erroPersistencia is not null)
                return erroPersistencia;

            return Results.Ok(new StatusFinalSprintDto(configuracao.StatusConcluido, configuracao.StatusIgnorado));
        })
        .WithSummary("Atualiza o mapeamento global de status finais do Jira (Concluído/Ignorado) para os totalizadores do Sprint");
    }
}