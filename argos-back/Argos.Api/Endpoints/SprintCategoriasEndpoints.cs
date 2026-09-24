using Argos.Api.Dtos;
using Argos.Nucleo.Configuracao;

namespace Argos.Api.Endpoints;

public static class SprintCategoriasEndpoints
{
    public static void MapSprintCategoriasEndpoints(this WebApplication app, CaminhosDados caminhos)
    {
        RouteGroupBuilder grupo = app.MapGroup("/api/sprint/categorias").WithTags("Sprint");

        grupo.MapGet("/", () =>
        {
            ConfiguracaoCategoriasSprint configuracao = CarregadorConfiguracaoCategoriasSprint.Carregar(caminhos);
            return Results.Ok(new CategoriasSprintDto(configuracao.Dev, configuracao.Rev, configuracao.Qa, configuracao.Agrupamento, configuracao.TagsDetalhadas, configuracao.CorTag));
        })
        .WithSummary("Obtém o mapeamento global de tags por categoria de tarefa (DEV/REV/QA)");

        grupo.MapPut("/", (AtualizarCategoriasSprintRequest request) =>
        {
            if (request.Agrupamento is not ("descricao" or "tag" or "ambos"))
                return Results.BadRequest("Agrupamento deve ser 'descricao', 'tag' ou 'ambos'.");

            ConfiguracaoCategoriasSprint configuracao = new()
            {
                Dev = NormalizacaoListas.Normalizar(request.Dev),
                Rev = NormalizacaoListas.Normalizar(request.Rev),
                Qa = NormalizacaoListas.Normalizar(request.Qa),
                Agrupamento = request.Agrupamento,
                TagsDetalhadas = NormalizacaoListas.Normalizar(request.TagsDetalhadas),
                CorTag = string.IsNullOrWhiteSpace(request.CorTag) ? CarregadorConfiguracaoCategoriasSprint.Padrao().CorTag : request.CorTag.Trim()
            };

            IResult? erroPersistencia = TratamentoIo.Executar(
                () => CarregadorConfiguracaoCategoriasSprint.Salvar(caminhos, configuracao),
                "Não foi possível salvar as categorias.");
            if (erroPersistencia is not null)
                return erroPersistencia;

            return Results.Ok(new CategoriasSprintDto(configuracao.Dev, configuracao.Rev, configuracao.Qa, configuracao.Agrupamento, configuracao.TagsDetalhadas, configuracao.CorTag));
        })
        .WithSummary("Atualiza o mapeamento global de tags por categoria de tarefa (DEV/REV/QA)");
    }
}