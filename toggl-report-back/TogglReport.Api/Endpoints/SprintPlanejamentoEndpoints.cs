using RelatorioToggl.Api.Dtos;
using RelatorioToggl.Configuracao;
using RelatorioToggl.Jira;
using RelatorioToggl.Planejamento;

namespace RelatorioToggl.Api.Endpoints;

public static class SprintPlanejamentoEndpoints
{
    public static void MapSprintPlanejamentoEndpoints(this WebApplication app, CaminhosDados caminhos)
    {
        RouteGroupBuilder grupo = app.MapGroup("/api/sprint/planejamento").WithTags("Sprint");

        grupo.MapGet("/", (string? chaveSprint) =>
        {
            if (string.IsNullOrWhiteSpace(chaveSprint))
                return Results.BadRequest("A chave do sprint é obrigatória.");

            DadosSprint? sprint = CarregadorSprintsIni.Carregar(caminhos.Sprints)
                .FirstOrDefault(s => s.Chave == chaveSprint);
            if (sprint is null)
                return Results.NotFound("Sprint não encontrado.");

            string? caminhoCache = caminhos.CacheJiraPlanejamento(sprint);
            if (caminhoCache is null)
                return Results.BadRequest("A chave do sprint é inválida para nome de arquivo de cache.");

            CachePlanejamentoJira? cache = CarregadorCachePlanejamentoJiraIni.Ler(caminhoCache);
            if (cache is null)
                return Results.Conflict("Não há planejamento salvo para esse sprint. Chame POST /api/sprint/planejamento/consultas primeiro.");

            ConfiguracaoMapeamentoJiraToggl mapeamento = CarregadorConfiguracaoMapeamentoJiraTogglIni.Carregar(caminhos.JiraTogglMapeamento);
            List<ConfiguracaoUsuarioToggl> usuariosToggl = CarregadorUsuariosTogglIni.Carregar(caminhos.Usuarios);
            ConfiguracaoQuadroPlanejamento configuracaoQuadro = CarregadorConfiguracaoQuadroPlanejamentoIni.Carregar(caminhos.JiraQuadro);

            ResultadoPlanejamento resultado = ServicoPlanejamento.Montar(cache, mapeamento, usuariosToggl, configuracaoQuadro.ColunasOcultas);
            return Results.Ok(ParaDto(resultado));
        })
        .WithSummary("Devolve o planejamento do sprint (cartões do quadro de DEV por coluna, colaboradores e contagens) montado a partir do cache do Jira; nunca chama o Jira. 409 sem cache.");

        grupo.MapPost("/consultas", async (ConsultarPlanejamentoRequest request) =>
        {
            if (string.IsNullOrWhiteSpace(request.ChaveSprint))
                return Results.BadRequest("A chave do sprint é obrigatória.");

            DadosSprint? sprint = CarregadorSprintsIni.Carregar(caminhos.Sprints)
                .FirstOrDefault(s => s.Chave == request.ChaveSprint);
            if (sprint is null)
                return Results.NotFound("Sprint não encontrado.");

            string? caminhoCache = caminhos.CacheJiraPlanejamento(sprint);
            if (caminhoCache is null)
                return Results.BadRequest("A chave do sprint é inválida para nome de arquivo de cache.");

            CachePlanejamentoJira? cache = CarregadorCachePlanejamentoJiraIni.Ler(caminhoCache);

            if (sprint.Fechado)
            {
                if (cache is null)
                    return Results.Conflict("Este sprint está fechado e não tem planejamento salvo. Reabra o sprint para consultar o Jira.");

                return Results.Ok(ParaResposta(cache, veioDoCache: true));
            }

            ConfiguracaoJira configuracao = CarregadorConfiguracaoJiraIni.Carregar(caminhos);
            string? erroConfiguracao = ValidarConfiguracao(configuracao);
            if (erroConfiguracao is not null)
                return Results.BadRequest(erroConfiguracao);

            long quadroId = configuracao.QuadroId!.Value;

            if (!request.Forcar && cache is not null && cache.QuadroId == quadroId && cache.SprintJira is not null)
                return Results.Ok(ParaResposta(cache, veioDoCache: true));

            ClienteApiJira cliente;
            try
            {
                cliente = new ClienteApiJira(configuracao.UrlDominio, configuracao.Email, configuracao.ApiToken);
            }
            catch (UriFormatException)
            {
                return Results.BadRequest("URL do domínio do Jira inválida.");
            }

            ResultadoApiJira<List<ColunaQuadroJira>> resultadoColunas = await cliente.ObterColunasQuadroAsync(quadroId);
            if (!resultadoColunas.Sucesso)
                return Results.Problem(resultadoColunas.MensagemErro, statusCode: StatusCodes.Status502BadGateway);

            ResultadoApiJira<List<SprintQuadroJira>> resultadoSprints = await cliente.ObterSprintsAtivosQuadroAsync(quadroId);
            if (!resultadoSprints.Sucesso)
                return Results.Problem(resultadoSprints.MensagemErro, statusCode: StatusCodes.Status502BadGateway);

            List<SprintQuadroJira> sprintsAtivos = resultadoSprints.Dados!;

            ResultadoApiJira<List<CartaoQuadroJira>> resultadoCartoes = await cliente.BuscarCartoesSprintAsync(
                quadroId,
                sprintsAtivos.Select(s => s.Id).ToList(),
                configuracao.CampoAnalisadoPorId,
                configuracao.CampoRevisadoPorId,
                configuracao.CampoTimeId,
                configuracao.CampoPrevisaoLiberacaoId);
            if (!resultadoCartoes.Sucesso)
                return Results.Problem(resultadoCartoes.MensagemErro, statusCode: StatusCodes.Status502BadGateway);

            CachePlanejamentoJira novoCache = new(
                quadroId,
                configuracao.QuadroNome,
                sprintsAtivos.FirstOrDefault(),
                resultadoColunas.Dados!,
                resultadoCartoes.Dados!,
                DateTime.UtcNow.ToString("O"));

            IResult? erroPersistencia = TratamentoIo.Executar(
                () => CarregadorCachePlanejamentoJiraIni.Salvar(caminhoCache, novoCache),
                "Não foi possível salvar o cache do planejamento do sprint.");
            if (erroPersistencia is not null)
                return erroPersistencia;

            return Results.Ok(ParaResposta(novoCache, veioDoCache: false));
        })
        .WithSummary("Consulta os cartões do sprint ativo do quadro de DEV no Jira (colunas, sprint ativo e cartões) e grava JiraPlanejamentoData_<chave>.ini; sem forçar reaproveita o cache do mesmo quadro. Sprint fechado nunca chama o Jira: devolve o cache salvo ou 409.");
    }

    private static string? ValidarConfiguracao(ConfiguracaoJira configuracao)
    {
        if (string.IsNullOrWhiteSpace(configuracao.UrlDominio)
            || string.IsNullOrWhiteSpace(configuracao.Email)
            || string.IsNullOrWhiteSpace(configuracao.ApiToken))
            return "Configure a conexão com o Jira (URL, e-mail e API Token) em Jira.";

        if (configuracao.QuadroId is null)
            return "Selecione o quadro de DEV do Jira nas configurações.";

        if (string.IsNullOrWhiteSpace(configuracao.CampoAnalisadoPorId) || string.IsNullOrWhiteSpace(configuracao.CampoRevisadoPorId))
            return "Configure os campos \"Analisado por\" e \"Revisado por\" do Jira nas configurações.";

        return null;
    }

    private static ResultadoPlanejamentoDto ParaDto(ResultadoPlanejamento resultado) => new(
        resultado.NomeQuadro,
        resultado.SprintJiraNome,
        resultado.SprintJiraInicio,
        resultado.SprintJiraFim,
        resultado.AtualizadoEm,
        resultado.Colunas,
        resultado.TotaisPorColuna,
        resultado.Cartoes.Select(ParaDto).ToList(),
        resultado.Colaboradores
            .Select(c => new ColaboradorPlanejamentoDto(ParaDto(c.Pessoa)!, c.Contagens, c.Total))
            .ToList());

    private static CartaoPlanejamentoDto ParaDto(CartaoPlanejamento cartao) => new(
        cartao.Chave,
        cartao.Codigo,
        cartao.Descricao,
        cartao.UrlIssue,
        cartao.Coluna,
        cartao.Status,
        cartao.Prioridade,
        cartao.GrupoChave,
        cartao.GrupoResumo,
        cartao.Time,
        ParaDto(cartao.Responsavel),
        ParaDto(cartao.AnalisadoPor),
        ParaDto(cartao.RevisadoPor),
        cartao.PrevisaoLiberacao);

    private static PessoaPlanejamentoDto? ParaDto(PessoaPlanejamento? pessoa) =>
        pessoa is null ? null : new PessoaPlanejamentoDto(pessoa.NomeJira, pessoa.Nome, pessoa.Sigla, pessoa.Cor, pessoa.Mapeado);

    private static ConsultaPlanejamentoResponse ParaResposta(CachePlanejamentoJira cache, bool veioDoCache) => new(
        veioDoCache,
        cache.AtualizadoEm,
        cache.QuadroNome,
        cache.SprintJira?.Nome,
        cache.Cartoes.Count);
}