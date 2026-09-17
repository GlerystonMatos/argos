using RelatorioToggl.Api.Dtos;
using RelatorioToggl.Configuracao;

namespace RelatorioToggl.Api.Endpoints;

public static class SprintResponsabilidadeEndpoints
{
    public static void MapSprintResponsabilidadeEndpoints(this WebApplication app, string caminhoConfiguracoesGerais)
    {
        RouteGroupBuilder grupo = app.MapGroup("/api/sprint/responsabilidade").WithTags("Sprint");

        grupo.MapGet("/", () =>
        {
            ConfiguracaoResponsabilidadeSprint configuracao = CarregadorConfiguracaoResponsabilidadeSprintIni.Carregar(caminhoConfiguracoesGerais);
            return Results.Ok(new ResponsabilidadeSprintDto(configuracao.StatusDev, configuracao.StatusRev, configuracao.StatusQa));
        })
        .WithSummary("Obtém o mapeamento global de status do Jira por grupo responsável (DEV/REV/QA)");

        grupo.MapPut("/", (AtualizarResponsabilidadeSprintRequest request) =>
        {
            ConfiguracaoResponsabilidadeSprint configuracao = new()
            {
                StatusDev = Normalizar(request.StatusDev),
                StatusRev = Normalizar(request.StatusRev),
                StatusQa = Normalizar(request.StatusQa)
            };

            IResult? erroPersistencia = TratamentoIo.Executar(
                () => CarregadorConfiguracaoResponsabilidadeSprintIni.Salvar(caminhoConfiguracoesGerais, configuracao),
                "Não foi possível salvar a responsabilidade por status.");
            if (erroPersistencia is not null)
                return erroPersistencia;

            return Results.Ok(new ResponsabilidadeSprintDto(configuracao.StatusDev, configuracao.StatusRev, configuracao.StatusQa));
        })
        .WithSummary("Atualiza o mapeamento global de status do Jira por grupo responsável (DEV/REV/QA)");
    }

    private static List<string> Normalizar(List<string>? valores) =>
        (valores ?? new List<string>())
            .Where(valor => !string.IsNullOrWhiteSpace(valor))
            .Select(valor => valor.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
}