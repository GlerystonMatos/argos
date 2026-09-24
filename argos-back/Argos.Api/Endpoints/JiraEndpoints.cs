using Argos.Api.Dtos;
using Argos.Nucleo.Configuracao;
using Argos.Nucleo.Jira;
using Argos.Nucleo.Planejamento;

namespace Argos.Api.Endpoints;

public static class JiraEndpoints
{
    public static void MapJiraEndpoints(this WebApplication app, CaminhosDados caminhos)
    {
        RouteGroupBuilder grupo = app.MapGroup("/api/jira").WithTags("Jira");

        grupo.MapGet("/configuracao", () =>
        {
            ConfiguracaoJira configuracao = CarregadorConfiguracaoJira.Carregar(caminhos);
            return Results.Ok(ParaDto(configuracao));
        })
        .WithSummary("Obtém a configuração do Jira salva (API Token mascarado)");

        grupo.MapPut("/configuracao", (SalvarConfiguracaoJiraRequest request) =>
        {
            if (string.IsNullOrWhiteSpace(request.UrlDominio))
                return Results.BadRequest("URL do domínio é obrigatória.");

            if (string.IsNullOrWhiteSpace(request.Email))
                return Results.BadRequest("E-mail é obrigatório.");

            ConfiguracaoJira configuracao = CarregadorConfiguracaoJira.Carregar(caminhos);

            if (string.IsNullOrWhiteSpace(configuracao.ApiToken) && string.IsNullOrWhiteSpace(request.ApiToken))
                return Results.BadRequest("API Token é obrigatório.");

            configuracao.UrlDominio = request.UrlDominio.Trim();
            configuracao.Email = request.Email.Trim();
            if (!string.IsNullOrWhiteSpace(request.ApiToken))
                configuracao.ApiToken = request.ApiToken.Trim();
            configuracao.QuadroId = request.QuadroId;
            configuracao.QuadroNome = request.QuadroId is null ? "" : (request.QuadroNome ?? "").Trim();
            configuracao.CampoEstimativaDesenvolvimentoId = request.CampoEstimativaDesenvolvimentoId;
            configuracao.CampoEstimativaDesenvolvimentoNome = request.CampoEstimativaDesenvolvimentoNome;
            configuracao.CampoRevisadoPorId = request.CampoRevisadoPorId;
            configuracao.CampoRevisadoPorNome = request.CampoRevisadoPorNome;
            configuracao.CampoAnalisadoPorId = request.CampoAnalisadoPorId;
            configuracao.CampoAnalisadoPorNome = request.CampoAnalisadoPorNome;
            configuracao.CampoEstimativaRevisaoId = request.CampoEstimativaRevisaoId;
            configuracao.CampoEstimativaRevisaoNome = request.CampoEstimativaRevisaoNome;
            configuracao.CampoEstimativaTestesId = request.CampoEstimativaTestesId;
            configuracao.CampoEstimativaTestesNome = request.CampoEstimativaTestesNome;
            configuracao.CampoTimeId = request.CampoTimeId;
            configuracao.CampoTimeNome = request.CampoTimeNome;
            configuracao.CampoPrevisaoLiberacaoId = request.CampoPrevisaoLiberacaoId;
            configuracao.CampoPrevisaoLiberacaoNome = request.CampoPrevisaoLiberacaoNome;
            if (request.JanelaAlertaPrevisaoLiberacaoDias is > 0)
                configuracao.JanelaAlertaPrevisaoLiberacaoDias = request.JanelaAlertaPrevisaoLiberacaoDias.Value;

            IResult? erroPersistencia = TratamentoIo.Executar(
                () => CarregadorConfiguracaoJira.Salvar(caminhos, configuracao),
                "Não foi possível salvar a configuração do Jira.");
            if (erroPersistencia is not null)
                return erroPersistencia;

            return Results.Ok(ParaDto(configuracao));
        })
        .WithSummary("Salva/atualiza a configuração do Jira (URL, e-mail, API Token, quadro de DEV e campos de estimativa de desenvolvimento, revisão, testes, revisado por, analisado por, time e previsão de liberação)");

        grupo.MapPost("/testar-conexao", async (TestarConexaoJiraRequest request) =>
        {
            if (string.IsNullOrWhiteSpace(request.UrlDominio) || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.ApiToken))
                return Results.Ok(new TestarConexaoJiraResponse(false, "Preencha URL do domínio, e-mail e API Token."));

            ClienteApiJira? cliente = CriarCliente(request.UrlDominio, request.Email, request.ApiToken, out string? erroUrl);
            if (cliente is null)
                return Results.Ok(new TestarConexaoJiraResponse(false, erroUrl));

            ResultadoApiJira<bool> resultado = await cliente.TestarConexaoAsync();
            return Results.Ok(new TestarConexaoJiraResponse(resultado.Sucesso, resultado.Sucesso ? "Conexão bem-sucedida." : resultado.MensagemErro));
        })
        .WithSummary("Testa a conexão com o Jira usando as credenciais informadas, sem salvar (GET /rest/api/3/myself)");

        grupo.MapPost("/campos", async (ObterCamposJiraRequest request) =>
        {
            string urlDominio = request.UrlDominio ?? "";
            string email = request.Email ?? "";
            string apiToken = request.ApiToken ?? "";

            if (string.IsNullOrWhiteSpace(urlDominio) || string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(apiToken))
            {
                ConfiguracaoJira configuracaoSalva = CarregadorConfiguracaoJira.Carregar(caminhos);
                if (string.IsNullOrWhiteSpace(configuracaoSalva.ApiToken))
                    return Results.BadRequest("Informe URL do domínio, e-mail e API Token, ou salve a configuração do Jira primeiro.");

                urlDominio = configuracaoSalva.UrlDominio;
                email = configuracaoSalva.Email;
                apiToken = configuracaoSalva.ApiToken;
            }

            ClienteApiJira? cliente = CriarCliente(urlDominio, email, apiToken, out string? erroUrl);
            if (cliente is null)
                return Results.BadRequest(erroUrl);

            ResultadoApiJira<List<CampoJira>> resultado = await cliente.ObterCamposAsync();
            if (!resultado.Sucesso)
                return Results.BadRequest(resultado.MensagemErro);

            List<CampoJiraDto> campos = resultado.Dados!.Select(campo => new CampoJiraDto(campo.Id, campo.Nome)).ToList();
            return Results.Ok(campos);
        })
        .WithSummary("Lista os campos customizados do Jira (GET /rest/api/3/field) para escolher o de estimativa de esforço");

        grupo.MapPost("/issues", async (BuscarIssuesJiraRequest request) =>
        {
            ConfiguracaoJira configuracaoSalva = CarregadorConfiguracaoJira.Carregar(caminhos);
            if (string.IsNullOrWhiteSpace(configuracaoSalva.ApiToken))
                return Results.BadRequest("Salve a configuração do Jira primeiro (POST /api/jira/configuracao).");

            ClienteApiJira? cliente = CriarCliente(configuracaoSalva.UrlDominio, configuracaoSalva.Email, configuracaoSalva.ApiToken, out string? erroUrl);
            if (cliente is null)
                return Results.BadRequest(erroUrl);

            ResultadoApiJira<List<IssueJira>> resultado = await cliente.BuscarIssuesAsync(request.Codigos, configuracaoSalva.CampoEstimativaDesenvolvimentoId, configuracaoSalva.CampoRevisadoPorId, configuracaoSalva.CampoEstimativaRevisaoId, configuracaoSalva.CampoEstimativaTestesId, configuracaoSalva.CampoPrevisaoLiberacaoId);
            if (!resultado.Sucesso)
                return Results.BadRequest(resultado.MensagemErro);

            List<IssueJiraDto> issues = resultado.Dados!
                .Select(issue => new IssueJiraDto(issue.Chave, issue.Prioridade, issue.Situacao, issue.EstimativaDesenvolvimentoHoras, issue.UrlIssue, issue.SituacaoCategoria, issue.Responsavel, issue.RevisadoPor, issue.EstimativaRevisaoHoras, issue.EstimativaTestesHoras, issue.PrevisaoLiberacao))
                .ToList();
            return Results.Ok(issues);
        })
        .WithSummary("Busca em lote (JQL key in (...)) prioridade, situação e estimativas de desenvolvimento/revisão/testes, usando a configuração já salva");

        grupo.MapGet("/status", async (bool forcarAtualizacao) =>
        {
            if (!forcarAtualizacao)
            {
                CacheListaJira? cacheExistente = CarregadorCacheListasJira.Carregar(caminhos.JiraStatusCache);
                if (cacheExistente is not null)
                    return Results.Ok(new ListaJiraResponse(cacheExistente.Nomes, true, cacheExistente.AtualizadoEm));
            }

            ConfiguracaoJira configuracaoSalva = CarregadorConfiguracaoJira.Carregar(caminhos);
            if (string.IsNullOrWhiteSpace(configuracaoSalva.ApiToken))
                return Results.BadRequest("Salve a configuração do Jira primeiro (POST /api/jira/configuracao).");

            ClienteApiJira? cliente = CriarCliente(configuracaoSalva.UrlDominio, configuracaoSalva.Email, configuracaoSalva.ApiToken, out string? erroUrl);
            if (cliente is null)
                return Results.BadRequest(erroUrl);

            ResultadoApiJira<List<string>> resultado = await cliente.ObterStatusAsync();
            if (!resultado.Sucesso)
                return Results.Problem(resultado.MensagemErro, statusCode: StatusCodes.Status502BadGateway);

            string atualizadoEm = DateTime.UtcNow.ToString("O");
            CacheListaJira cache = new() { Nomes = resultado.Dados!, AtualizadoEm = atualizadoEm };

            IResult? erroPersistencia = TratamentoIo.Executar(
                () => CarregadorCacheListasJira.Salvar(caminhos.JiraStatusCache, cache),
                "Não foi possível salvar o cache de status do Jira.");
            if (erroPersistencia is not null)
                return erroPersistencia;

            return Results.Ok(new ListaJiraResponse(cache.Nomes, false, atualizadoEm));
        })
        .WithSummary("Lista os status reais do Jira (GET /rest/api/3/status), cacheados até atualização manual");

        grupo.MapGet("/prioridades", async (bool forcarAtualizacao) =>
        {
            if (!forcarAtualizacao)
            {
                CacheListaJira? cacheExistente = CarregadorCacheListasJira.Carregar(caminhos.JiraPrioridadesCache);
                if (cacheExistente is not null)
                    return Results.Ok(new ListaJiraResponse(cacheExistente.Nomes, true, cacheExistente.AtualizadoEm));
            }

            ConfiguracaoJira configuracaoSalva = CarregadorConfiguracaoJira.Carregar(caminhos);
            if (string.IsNullOrWhiteSpace(configuracaoSalva.ApiToken))
                return Results.BadRequest("Salve a configuração do Jira primeiro (POST /api/jira/configuracao).");

            ClienteApiJira? cliente = CriarCliente(configuracaoSalva.UrlDominio, configuracaoSalva.Email, configuracaoSalva.ApiToken, out string? erroUrl);
            if (cliente is null)
                return Results.BadRequest(erroUrl);

            ResultadoApiJira<List<string>> resultado = await cliente.ObterPrioridadesAsync();
            if (!resultado.Sucesso)
                return Results.Problem(resultado.MensagemErro, statusCode: StatusCodes.Status502BadGateway);

            string atualizadoEm = DateTime.UtcNow.ToString("O");
            CacheListaJira cache = new() { Nomes = resultado.Dados!, AtualizadoEm = atualizadoEm };

            IResult? erroPersistencia = TratamentoIo.Executar(
                () => CarregadorCacheListasJira.Salvar(caminhos.JiraPrioridadesCache, cache),
                "Não foi possível salvar o cache de prioridades do Jira.");
            if (erroPersistencia is not null)
                return erroPersistencia;

            return Results.Ok(new ListaJiraResponse(cache.Nomes, false, atualizadoEm));
        })
        .WithSummary("Lista as prioridades reais do Jira (GET /rest/api/3/priority), cacheadas até atualização manual");

        grupo.MapGet("/colunas", async (bool forcarAtualizacao) =>
        {
            if (!forcarAtualizacao)
            {
                CacheListaJira? cacheExistente = CarregadorCacheListasJira.Carregar(caminhos.JiraColunasCache);
                if (cacheExistente is not null)
                    return Results.Ok(new ListaJiraResponse(cacheExistente.Nomes, true, cacheExistente.AtualizadoEm));
            }

            ConfiguracaoJira configuracaoSalva = CarregadorConfiguracaoJira.Carregar(caminhos);
            if (string.IsNullOrWhiteSpace(configuracaoSalva.ApiToken))
                return Results.BadRequest("Salve a configuração do Jira primeiro (POST /api/jira/configuracao).");

            if (configuracaoSalva.QuadroId is null)
                return Results.BadRequest("Selecione o quadro de DEV do Jira nas configurações.");

            ClienteApiJira? cliente = CriarCliente(configuracaoSalva.UrlDominio, configuracaoSalva.Email, configuracaoSalva.ApiToken, out string? erroUrl);
            if (cliente is null)
                return Results.BadRequest(erroUrl);

            ResultadoApiJira<List<ColunaQuadroJira>> resultado = await cliente.ObterColunasQuadroAsync(configuracaoSalva.QuadroId.Value);
            if (!resultado.Sucesso)
                return Results.Problem(resultado.MensagemErro, statusCode: StatusCodes.Status502BadGateway);

            List<string> nomes = resultado.Dados!.Select(c => c.Nome).Distinct(StringComparer.OrdinalIgnoreCase).ToList();

            string atualizadoEm = DateTime.UtcNow.ToString("O");
            CacheListaJira cache = new() { Nomes = nomes, AtualizadoEm = atualizadoEm };

            IResult? erroPersistencia = TratamentoIo.Executar(
                () => CarregadorCacheListasJira.Salvar(caminhos.JiraColunasCache, cache),
                "Não foi possível salvar o cache de colunas do quadro do Jira.");
            if (erroPersistencia is not null)
                return erroPersistencia;

            return Results.Ok(new ListaJiraResponse(cache.Nomes, false, atualizadoEm));
        })
        .WithSummary("Lista as colunas reais do quadro de DEV configurado (GET /rest/agile/1.0/board/{id}/configuration), cacheadas até atualização manual");

        grupo.MapGet("/times", () =>
        {
            List<string> nomes = ServicoPlanejamento.ListarTimes(caminhos);
            return Results.Ok(new ListaJiraResponse(nomes, true, DateTime.UtcNow.ToString("O")));
        })
        .WithSummary("Lista os times (campo Time) encontrados nos caches do Planejamento de todos os sprints, sem chamar o Jira");

        grupo.MapGet("/epicos", () =>
        {
            List<EpicoJiraDto> epicos = ServicoPlanejamento.ListarEpicos(caminhos)
                .Select(epico => new EpicoJiraDto(epico.Chave, epico.Resumo))
                .ToList();
            return Results.Ok(new EpicosJiraResponse(epicos));
        })
        .WithSummary("Lista os épicos (chave e título) encontrados nos caches do Planejamento dos sprints abertos, sem chamar o Jira");

        grupo.MapGet("/usuarios", async (bool forcarAtualizacao) =>
        {
            if (!forcarAtualizacao)
            {
                CacheListaJira? cacheExistente = CarregadorCacheListasJira.Carregar(caminhos.JiraUsuariosCache);
                if (cacheExistente is not null)
                    return Results.Ok(new ListaJiraResponse(cacheExistente.Nomes, true, cacheExistente.AtualizadoEm));
            }

            ConfiguracaoJira configuracaoSalva = CarregadorConfiguracaoJira.Carregar(caminhos);
            if (string.IsNullOrWhiteSpace(configuracaoSalva.ApiToken))
                return Results.BadRequest("Salve a configuração do Jira primeiro (POST /api/jira/configuracao).");

            ClienteApiJira? cliente = CriarCliente(configuracaoSalva.UrlDominio, configuracaoSalva.Email, configuracaoSalva.ApiToken, out string? erroUrl);
            if (cliente is null)
                return Results.BadRequest(erroUrl);

            ResultadoApiJira<List<string>> resultado = await cliente.ObterUsuariosAsync();
            if (!resultado.Sucesso)
                return Results.Problem(resultado.MensagemErro, statusCode: StatusCodes.Status502BadGateway);

            string atualizadoEm = DateTime.UtcNow.ToString("O");
            CacheListaJira cache = new() { Nomes = resultado.Dados!, AtualizadoEm = atualizadoEm };

            IResult? erroPersistencia = TratamentoIo.Executar(
                () => CarregadorCacheListasJira.Salvar(caminhos.JiraUsuariosCache, cache),
                "Não foi possível salvar o cache de usuários do Jira.");
            if (erroPersistencia is not null)
                return erroPersistencia;

            return Results.Ok(new ListaJiraResponse(cache.Nomes, false, atualizadoEm));
        })
        .WithSummary("Lista os usuários reais do Jira (GET /rest/api/3/users/search, contas Atlassian ativas), cacheados até atualização manual");

        grupo.MapGet("/quadros", async (bool forcarAtualizacao) =>
        {
            if (!forcarAtualizacao)
            {
                CacheQuadrosJira? cacheExistente = CarregadorCacheQuadrosJira.Carregar(caminhos.JiraQuadrosCache);
                if (cacheExistente is not null)
                    return Results.Ok(new QuadrosJiraResponse(ParaDto(cacheExistente.Quadros), true, cacheExistente.AtualizadoEm));
            }

            ConfiguracaoJira configuracaoSalva = CarregadorConfiguracaoJira.Carregar(caminhos);
            if (string.IsNullOrWhiteSpace(configuracaoSalva.ApiToken))
                return Results.BadRequest("Salve a configuração do Jira primeiro (POST /api/jira/configuracao).");

            ClienteApiJira? cliente = CriarCliente(configuracaoSalva.UrlDominio, configuracaoSalva.Email, configuracaoSalva.ApiToken, out string? erroUrl);
            if (cliente is null)
                return Results.BadRequest(erroUrl);

            ResultadoApiJira<List<QuadroJira>> resultado = await cliente.ListarQuadrosAsync();
            if (!resultado.Sucesso)
                return Results.Problem(resultado.MensagemErro, statusCode: StatusCodes.Status502BadGateway);

            string atualizadoEm = DateTime.UtcNow.ToString("O");
            CacheQuadrosJira cache = new() { Quadros = resultado.Dados!, AtualizadoEm = atualizadoEm };

            IResult? erroPersistencia = TratamentoIo.Executar(
                () => CarregadorCacheQuadrosJira.Salvar(caminhos.JiraQuadrosCache, cache),
                "Não foi possível salvar o cache de quadros do Jira.");
            if (erroPersistencia is not null)
                return erroPersistencia;

            return Results.Ok(new QuadrosJiraResponse(ParaDto(cache.Quadros), false, atualizadoEm));
        })
        .WithSummary("Lista os quadros Scrum reais do Jira (GET /rest/agile/1.0/board?type=scrum), cacheados até atualização manual");

        grupo.MapGet("/usuarios-mapeamento", () =>
        {
            ConfiguracaoMapeamentoJiraToggl configuracao = CarregadorConfiguracaoMapeamentoJiraToggl.Carregar(caminhos.JiraTogglMapeamento);
            return Results.Ok(new MapeamentoJiraTogglDto(ParaDto(configuracao.Mapeamento)));
        })
        .WithSummary("Obtém o mapeamento configurável de usuário do Jira (displayName) para usuário do Toggl (Chave), com Sigla/Cor para usuários exclusivos do Jira");

        grupo.MapPut("/usuarios-mapeamento", (AtualizarMapeamentoJiraTogglRequest request) =>
        {
            ConfiguracaoMapeamentoJiraToggl configuracao = new()
            {
                Mapeamento = Normalizar(request.Mapeamento)
            };

            IResult? erroPersistencia = TratamentoIo.Executar(
                () => CarregadorConfiguracaoMapeamentoJiraToggl.Salvar(caminhos.JiraTogglMapeamento, configuracao),
                "Não foi possível salvar o mapeamento de usuários Jira/Toggl.");
            if (erroPersistencia is not null)
                return erroPersistencia;

            return Results.Ok(new MapeamentoJiraTogglDto(ParaDto(configuracao.Mapeamento)));
        })
        .WithSummary("Atualiza o mapeamento configurável de usuário do Jira (displayName) para usuário do Toggl (Chave), com Sigla/Cor para usuários exclusivos do Jira");

        grupo.MapGet("/cores", () =>
        {
            ConfiguracaoCoresJira configuracao = CarregadorConfiguracaoCoresJira.Carregar(caminhos);
            return Results.Ok(new CoresJiraDto(configuracao.CoresStatus, configuracao.CoresPrioridade, configuracao.CoresColuna, configuracao.CoresTime, configuracao.CoresEpico));
        })
        .WithSummary("Obtém o mapeamento configurável de cores por status, por prioridade, por coluna, por time e por épico do Jira");

        grupo.MapPut("/cores", (AtualizarCoresJiraRequest request) =>
        {
            ConfiguracaoCoresJira configuracao = new()
            {
                CoresStatus = Normalizar(request.CoresStatus),
                CoresPrioridade = Normalizar(request.CoresPrioridade),
                CoresColuna = Normalizar(request.CoresColuna),
                CoresTime = Normalizar(request.CoresTime),
                CoresEpico = Normalizar(request.CoresEpico)
            };

            IResult? erroPersistencia = TratamentoIo.Executar(
                () => CarregadorConfiguracaoCoresJira.Salvar(caminhos, configuracao),
                "Não foi possível salvar o mapeamento de cores do Jira.");
            if (erroPersistencia is not null)
                return erroPersistencia;

            return Results.Ok(new CoresJiraDto(configuracao.CoresStatus, configuracao.CoresPrioridade, configuracao.CoresColuna, configuracao.CoresTime, configuracao.CoresEpico));
        })
        .WithSummary("Atualiza o mapeamento configurável de cores por status, por prioridade, por coluna, por time e por épico do Jira");

        grupo.MapGet("/quadro", () =>
        {
            ConfiguracaoQuadroPlanejamento configuracao = CarregadorConfiguracaoQuadroPlanejamento.Carregar(caminhos.JiraQuadro);
            return Results.Ok(new ConfiguracaoQuadroPlanejamentoDto(configuracao.ColunasOcultas));
        })
        .WithSummary("Obtém as colunas do quadro configuradas para não aparecer no Planejamento");

        grupo.MapPut("/quadro", (AtualizarConfiguracaoQuadroPlanejamentoRequest request) =>
        {
            ConfiguracaoQuadroPlanejamento configuracao = new()
            {
                ColunasOcultas = (request.ColunasOcultas ?? new List<string>())
                    .Where(nome => !string.IsNullOrWhiteSpace(nome))
                    .Select(nome => nome.Trim())
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList()
            };

            IResult? erroPersistencia = TratamentoIo.Executar(
                () => CarregadorConfiguracaoQuadroPlanejamento.Salvar(caminhos.JiraQuadro, configuracao),
                "Não foi possível salvar a configuração do quadro do Jira.");
            if (erroPersistencia is not null)
                return erroPersistencia;

            return Results.Ok(new ConfiguracaoQuadroPlanejamentoDto(configuracao.ColunasOcultas));
        })
        .WithSummary("Atualiza as colunas do quadro configuradas para não aparecer no Planejamento");
    }

    private static Dictionary<string, string> Normalizar(Dictionary<string, string>? mapa) =>
        (mapa ?? new Dictionary<string, string>())
            .Where(par => !string.IsNullOrWhiteSpace(par.Key) && !string.IsNullOrWhiteSpace(par.Value))
            .ToDictionary(par => par.Key.Trim(), par => par.Value.Trim(), StringComparer.OrdinalIgnoreCase);

    private static Dictionary<string, EntradaMapeamentoJiraToggl> Normalizar(Dictionary<string, EntradaMapeamentoJiraTogglDto>? mapa) =>
        (mapa ?? new Dictionary<string, EntradaMapeamentoJiraTogglDto>())
            .Where(par => !string.IsNullOrWhiteSpace(par.Key)
                && (!string.IsNullOrWhiteSpace(par.Value.ChaveToggl) || !string.IsNullOrWhiteSpace(par.Value.Sigla)))
            .ToDictionary(
                par => par.Key.Trim(),
                par => new EntradaMapeamentoJiraToggl
                {
                    ChaveToggl = string.IsNullOrWhiteSpace(par.Value.ChaveToggl) ? null : par.Value.ChaveToggl.Trim(),
                    Sigla = string.IsNullOrWhiteSpace(par.Value.Sigla) ? null : par.Value.Sigla.Trim(),
                    Cor = string.IsNullOrWhiteSpace(par.Value.Cor) ? null : par.Value.Cor.Trim(),
                },
                StringComparer.OrdinalIgnoreCase);

    private static Dictionary<string, EntradaMapeamentoJiraTogglDto> ParaDto(Dictionary<string, EntradaMapeamentoJiraToggl> mapeamento) =>
        mapeamento.ToDictionary(
            par => par.Key,
            par => new EntradaMapeamentoJiraTogglDto(par.Value.ChaveToggl, par.Value.Sigla, par.Value.Cor),
            StringComparer.OrdinalIgnoreCase);

    private static List<QuadroJiraDto> ParaDto(List<QuadroJira> quadros) =>
        quadros.Select(quadro => new QuadroJiraDto(quadro.Id, quadro.Nome, quadro.Projeto)).ToList();

    private static ClienteApiJira? CriarCliente(string urlDominio, string email, string apiToken, out string? erro)
    {
        try
        {
            erro = null;
            return new ClienteApiJira(urlDominio, email, apiToken);
        }
        catch (UriFormatException)
        {
            erro = "URL do domínio inválida.";
            return null;
        }
    }

    private static ConfiguracaoJiraDto ParaDto(ConfiguracaoJira configuracao) => new(
        configuracao.UrlDominio,
        configuracao.Email,
        ServicoUsuariosToggl.MascararToken(configuracao.ApiToken),
        configuracao.QuadroId,
        configuracao.QuadroNome,
        configuracao.CampoEstimativaDesenvolvimentoId,
        configuracao.CampoEstimativaDesenvolvimentoNome,
        configuracao.CampoRevisadoPorId,
        configuracao.CampoRevisadoPorNome,
        configuracao.CampoAnalisadoPorId,
        configuracao.CampoAnalisadoPorNome,
        configuracao.CampoEstimativaRevisaoId,
        configuracao.CampoEstimativaRevisaoNome,
        configuracao.CampoEstimativaTestesId,
        configuracao.CampoEstimativaTestesNome,
        configuracao.CampoTimeId,
        configuracao.CampoTimeNome,
        configuracao.CampoPrevisaoLiberacaoId,
        configuracao.CampoPrevisaoLiberacaoNome,
        configuracao.JanelaAlertaPrevisaoLiberacaoDias);
}