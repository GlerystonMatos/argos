using Argos.Api.Dtos;
using Argos.Nucleo.Configuracao;
using Argos.Nucleo.Consultas;
using Argos.Nucleo.Gant;

namespace Argos.Api.Endpoints;

public static class GantEndpoints
{
    public static void MapGantEndpoints(this WebApplication app, CaminhosDados caminhos)
    {
        RouteGroupBuilder grupo = app.MapGroup("/api/gant").WithTags("Gant");

        grupo.MapGet("/parametros", () =>
        {
            ConfiguracaoGant configuracao = CarregadorConfiguracaoGantIni.Carregar(caminhos);
            return Results.Ok(new ParametrosGantDto(configuracao.DataInicio, configuracao.DataFim, configuracao.TagsSelecionadas, configuracao.Agrupamento));
        })
        .WithSummary("Obtém o período salvo dos parâmetros do Gant e o agrupamento/tags da fonte única de configuração do Toggl");

        grupo.MapPut("/parametros", (AtualizarParametrosGantRequest request) =>
        {
            if (!Agrupamento.EhValido(request.Agrupamento))
                return Results.BadRequest("Agrupamento deve ser 'descricao', 'tag' ou 'ambos'.");

            PeriodoSalvo periodo = CarregadorPeriodoIni.Carregar(caminhos.GantParametros);
            bool atualizarPeriodo = !string.IsNullOrWhiteSpace(request.DataInicio) || !string.IsNullOrWhiteSpace(request.DataFim);

            if (atualizarPeriodo)
            {
                if (!ValidacaoDatas.Tenta(request.DataInicio ?? "", request.DataFim ?? "", out DateTime inicio, out DateTime fim, out IResult? erroDatas))
                    return erroDatas!;

                periodo.DataInicio = inicio.ToString("yyyy-MM-dd");
                periodo.DataFim = fim.ToString("yyyy-MM-dd");
            }

            ConfiguracaoCategoriasSprint toggl = CarregadorConfiguracaoCategoriasSprintIni.Carregar(caminhos);
            toggl.Agrupamento = request.Agrupamento;
            toggl.TagsDetalhadas = NormalizacaoListas.Normalizar(request.TagsSelecionadas);

            IResult? erroPersistencia = TratamentoIo.Executar(
                () =>
                {
                    CarregadorConfiguracaoCategoriasSprintIni.Salvar(caminhos, toggl);
                    if (atualizarPeriodo)
                        CarregadorPeriodoIni.Salvar(caminhos.GantParametros, periodo);
                },
                "Não foi possível salvar os parâmetros do Gant.");
            if (erroPersistencia is not null)
                return erroPersistencia;

            return Results.Ok(new ParametrosGantDto(periodo.DataInicio, periodo.DataFim, toggl.TagsDetalhadas, toggl.Agrupamento));
        })
        .WithSummary("Atualiza o período do Gant e o agrupamento/tags (fonte única em TogglConfiguracao.ini/TogglTags.ini, compartilhada com Relatório e Sprint); datas omitidas preservam as salvas");

        grupo.MapPost("/consultas", async (ConsultarRequest request) =>
        {
            if (!ValidacaoDatas.Tenta(request.DataInicio, request.DataFim, out DateTime inicio, out DateTime fim, out IResult? erroDatas))
                return erroDatas!;

            ConfiguracaoApp configuracao = CarregadorConfiguracaoIni.Carregar(caminhos);
            configuracao.Usuarios = configuracao.Usuarios.Where(u => u.Selecionado).ToList();

            if (configuracao.Usuarios.Count == 0)
                return Results.BadRequest("Nenhum usuário do Toggl selecionado. Cadastre e selecione ao menos um em POST /api/usuarios-toggl.");

            CacheConsulta? cache = ServicoConsulta.CarregarCacheSeExistente(caminhos.GantData);

            if (!request.ForcarConsultaApi && cache is not null && ServicoConsulta.CacheCorrespondeAosParametros(cache, configuracao, inicio, fim))
            {
                ResultadoConsulta resultadoCache = ServicoConsulta.CarregarRegistrosDoCache(cache, configuracao);
                List<EventoConsultaUsuarioToggl> eventosCache = resultadoCache.OrdemUsuarios
                    .Select(nome => new EventoConsultaUsuarioToggl(nome, StatusConsultaUsuarioToggl.Sucesso, null, resultadoCache.RegistrosPorUsuario[nome].Count))
                    .ToList();

                return Results.Ok(new ConsultarResponse(request.DataInicio, request.DataFim, VeioDoCache: true, eventosCache));
            }

            CacheConsulta? cacheParaFallback = cache is not null
                && cache.DataInicio == inicio.ToString("yyyy-MM-dd")
                && cache.DataFim == fim.ToString("yyyy-MM-dd")
                    ? cache
                    : null;

            List<EventoConsultaUsuarioToggl> eventos = new();
            ResultadoConsulta resultado = await ServicoConsulta.ConsultarUsuariosAsync(configuracao, inicio, fim, cacheParaFallback, eventos.Add);
            ServicoConsulta.SalvarCache(caminhos.GantData, configuracao, inicio, fim, resultado.RegistrosPorUsuario, resultado.OrdemUsuarios);

            return Results.Ok(new ConsultarResponse(request.DataInicio, request.DataFim, VeioDoCache: false, eventos));
        })
        .WithSummary("Consulta o Toggl para o Gant respeitando o cache e o limite de 30 req/hora; salva o retorno cru em GantData.ini");

        grupo.MapGet("/", (string dataInicio, string dataFim, string? termo) =>
        {
            if (!DateTime.TryParse(dataInicio, out DateTime inicio) || !DateTime.TryParse(dataFim, out DateTime fim))
                return Results.BadRequest("Datas inválidas. Use o formato AAAA-MM-DD.");

            ConfiguracaoApp configuracao = CarregadorConfiguracaoIni.Carregar(caminhos);
            if (configuracao.Usuarios.Count == 0)
                return Results.BadRequest("Nenhum usuário do Toggl cadastrado.");

            CacheConsulta? cache = CarregadorCacheIni.Carregar(caminhos.GantData);
            if (cache is null || cache.DataInicio != dataInicio || cache.DataFim != dataFim)
                return Results.Conflict("Não há consulta salva para esse período. Chame POST /api/gant/consultas primeiro.");

            ResultadoGant resultado = ServicoGant.Montar(cache, configuracao.Usuarios, inicio, fim, configuracao.TagsDetalhadas, configuracao.AgrupamentoPadrao, termo);
            return Results.Ok(resultado);
        })
        .WithSummary("Devolve o Gant (linhas por categoria+descrição, células por dia/usuário) a partir do cache do Gant");
    }
}