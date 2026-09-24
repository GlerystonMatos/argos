using Argos.Api.Dtos;
using Argos.Nucleo.Configuracao;

namespace Argos.Api.Endpoints;

public static class ConfiguracaoEndpoints
{
    public static void MapConfiguracaoEndpoints(this WebApplication app, CaminhosDados caminhos)
    {
        RouteGroupBuilder grupo = app.MapGroup("/api/configuracao").WithTags("Configuração");

        grupo.MapGet("/", () =>
        {
            ConfiguracaoApp configuracao = CarregadorConfiguracao.Carregar(caminhos);
            return Results.Ok(new ParametrosConfiguracaoDto(
                configuracao.AgrupamentoPadrao, configuracao.TagsDetalhadas, configuracao.DataInicioAnterior, configuracao.DataFimAnterior));
        })
        .WithSummary("Obtém agrupamento, tags detalhadas e último período salvos");

        grupo.MapPut("/", (AtualizarParametrosRequest request) =>
        {
            if (!Agrupamento.EhValido(request.Agrupamento))
                return Results.BadRequest("Agrupamento deve ser 'descricao', 'tag' ou 'ambos'.");

            PeriodoSalvo periodo = CarregadorPeriodo.Carregar(caminhos.RelatorioParametros);
            bool atualizarPeriodo = !string.IsNullOrWhiteSpace(request.DataInicio) || !string.IsNullOrWhiteSpace(request.DataFim);

            if (atualizarPeriodo)
            {
                if (!ValidacaoDatas.Tenta(request.DataInicio ?? "", request.DataFim ?? "", out DateTime inicio, out DateTime fim, out IResult? erroDatas))
                    return erroDatas!;

                periodo.DataInicio = inicio.ToString("yyyy-MM-dd");
                periodo.DataFim = fim.ToString("yyyy-MM-dd");
            }

            ConfiguracaoCategoriasSprint toggl = CarregadorConfiguracaoCategoriasSprint.Carregar(caminhos);
            toggl.Agrupamento = request.Agrupamento;
            toggl.TagsDetalhadas = NormalizacaoListas.Normalizar(request.TagsDetalhadas);

            IResult? erroPersistencia = TratamentoIo.Executar(
                () =>
                {
                    CarregadorConfiguracaoCategoriasSprint.Salvar(caminhos, toggl);
                    if (atualizarPeriodo)
                        CarregadorPeriodo.Salvar(caminhos.RelatorioParametros, periodo);
                },
                "Não foi possível salvar a configuração.");
            if (erroPersistencia is not null)
                return erroPersistencia;

            return Results.Ok(new ParametrosConfiguracaoDto(toggl.Agrupamento, toggl.TagsDetalhadas, periodo.DataInicio, periodo.DataFim));
        })
        .WithSummary("Atualiza agrupamento, tags detalhadas (fonte única em TogglConfiguracao/TogglTags, compartilhada com Gant e Sprint) e período; datas omitidas preservam as salvas");
    }
}