using Argos.Api.Dtos;
using Argos.Nucleo.Configuracao;
using Argos.Nucleo.Jira;
using Argos.Nucleo.Planejamento;

namespace Argos.Api.Endpoints;

public static class PlanejamentoEndpoints
{
    public static void MapPlanejamentoEndpoints(this WebApplication app, CaminhosDados caminhos)
    {
        RouteGroupBuilder grupo = app.MapGroup("/api/planejamento").WithTags("Planejamento");

        grupo.MapGet("/", (string? quadro) =>
        {
            if (!TiposQuadroJira.TentarLer(quadro, out TipoQuadroJira tipoQuadro))
                return Results.BadRequest("Quadro inválido: use \"dev\" ou \"analise\".");

            ConfiguracaoJira configuracao = CarregadorConfiguracaoJira.Carregar(caminhos);
            CachePlanejamentoJira? cache = CarregadorCachePlanejamentoJira.Ler(caminhos.CacheJiraPlanejamento(tipoQuadro));
            if (cache is null || cache.QuadroId != configuracao.QuadroId(tipoQuadro))
                return Results.Conflict($"Não há planejamento salvo para o quadro de {TiposQuadroJira.Rotulo(tipoQuadro)} configurado. Chame POST /api/planejamento/consultas primeiro.");

            ConfiguracaoMapeamentoJiraToggl mapeamento = CarregadorConfiguracaoMapeamentoJiraToggl.Carregar(caminhos.JiraTogglMapeamento);
            List<ConfiguracaoUsuarioToggl> usuariosToggl = CarregadorUsuariosToggl.Carregar(caminhos.Usuarios);
            ConfiguracaoQuadroPlanejamento configuracaoQuadro = CarregadorConfiguracaoQuadroPlanejamento.Carregar(caminhos.JiraQuadro);

            ResultadoPlanejamento resultado = ServicoPlanejamento.Montar(cache, mapeamento, usuariosToggl, configuracaoQuadro.ColunasOcultas(tipoQuadro));
            return Results.Ok(ParaDto(resultado));
        })
        .WithSummary("Devolve o planejamento global do quadro (dev|analise): cartões do sprint ativo do quadro por coluna, colaboradores e contagens, montado a partir do cache; nunca chama o Jira. 409 sem cache do quadro configurado.");

        grupo.MapPost("/consultas", async (ConsultarPlanejamentoRequest request) =>
        {
            if (!TiposQuadroJira.TentarLer(request.Quadro, out TipoQuadroJira tipoQuadro))
                return Results.BadRequest("Quadro inválido: use \"dev\" ou \"analise\".");

            ConfiguracaoJira configuracao = CarregadorConfiguracaoJira.Carregar(caminhos);
            string? erroConfiguracao = ValidarConfiguracao(configuracao, tipoQuadro);
            if (erroConfiguracao is not null)
                return Results.BadRequest(erroConfiguracao);

            long quadroId = configuracao.QuadroId(tipoQuadro)!.Value;
            DocumentoDados documentoCache = caminhos.CacheJiraPlanejamento(tipoQuadro);
            CachePlanejamentoJira? cache = CarregadorCachePlanejamentoJira.Ler(documentoCache);

            if (!request.Forcar && cache is not null && cache.QuadroId == quadroId && (cache.SprintJira is not null || cache.Kanban))
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

            ResultadoApiJira<string> resultadoTipo = await cliente.ObterTipoQuadroAsync(quadroId);
            if (!resultadoTipo.Sucesso)
                return Results.Problem(resultadoTipo.MensagemErro, statusCode: StatusCodes.Status502BadGateway);

            bool kanban = resultadoTipo.Dados!.Equals(ClienteApiJira.TipoQuadroKanban, StringComparison.OrdinalIgnoreCase);

            List<SprintQuadroJira> sprintsAtivos = new();
            if (!kanban)
            {
                ResultadoApiJira<List<SprintQuadroJira>> resultadoSprints = await cliente.ObterSprintsAtivosQuadroAsync(quadroId);
                if (!resultadoSprints.Sucesso)
                    return Results.Problem(resultadoSprints.MensagemErro, statusCode: StatusCodes.Status502BadGateway);

                sprintsAtivos = resultadoSprints.Dados!;
            }

            ResultadoApiJira<List<CartaoQuadroJira>> resultadoCartoes = await cliente.BuscarCartoesQuadroAsync(
                quadroId,
                kanban ? null : sprintsAtivos.Select(s => s.Id).ToList(),
                configuracao.CampoAnalisadoPorId,
                configuracao.CampoRevisadoPorId,
                configuracao.CampoTimeId,
                configuracao.CampoPrevisaoLiberacaoId,
                configuracao.CampoEstimativaDesenvolvimentoId,
                configuracao.CampoEstimativaRevisaoId);
            if (!resultadoCartoes.Sucesso)
                return Results.Problem(resultadoCartoes.MensagemErro, statusCode: StatusCodes.Status502BadGateway);

            CachePlanejamentoJira novoCache = new(
                quadroId,
                configuracao.QuadroNome(tipoQuadro),
                sprintsAtivos.FirstOrDefault(),
                resultadoColunas.Dados!,
                resultadoCartoes.Dados!,
                DateTime.UtcNow.ToString("O"),
                kanban);

            IResult? erroPersistencia = TratamentoIo.Executar(
                () => CarregadorCachePlanejamentoJira.Salvar(documentoCache, novoCache),
                "Não foi possível salvar o cache do planejamento.");
            if (erroPersistencia is not null)
                return erroPersistencia;

            return Results.Ok(ParaResposta(novoCache, veioDoCache: false));
        })
        .WithSummary("Consulta no Jira os cartões do quadro (dev|analise) — sprint ativo se Scrum, tudo o que está no quadro se Kanban — e grava JiraPlanejamentoGlobalDev/JiraPlanejamentoGlobalAnalise; sem forçar reaproveita o cache do mesmo quadro.");
    }

    private static string? ValidarConfiguracao(ConfiguracaoJira configuracao, TipoQuadroJira tipoQuadro)
    {
        if (string.IsNullOrWhiteSpace(configuracao.UrlDominio)
            || string.IsNullOrWhiteSpace(configuracao.Email)
            || string.IsNullOrWhiteSpace(configuracao.ApiToken))
            return "Configure a conexão com o Jira (URL, e-mail e API Token) em Jira.";

        if (configuracao.QuadroId(tipoQuadro) is null)
            return $"Selecione o quadro de {TiposQuadroJira.Rotulo(tipoQuadro)} do Jira nas configurações.";

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
            .ToList(),
        resultado.Kanban);

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
        cartao.PrevisaoLiberacao,
        cartao.EstimativaDesenvolvimentoHoras,
        cartao.EstimativaRevisaoHoras);

    private static PessoaPlanejamentoDto? ParaDto(PessoaPlanejamento? pessoa) =>
        pessoa is null ? null : new PessoaPlanejamentoDto(pessoa.NomeJira, pessoa.Nome, pessoa.Sigla, pessoa.Cor, pessoa.Mapeado);

    private static ConsultaPlanejamentoResponse ParaResposta(CachePlanejamentoJira cache, bool veioDoCache) => new(
        veioDoCache,
        cache.AtualizadoEm,
        cache.QuadroNome,
        cache.SprintJira?.Nome,
        cache.Cartoes.Count);
}