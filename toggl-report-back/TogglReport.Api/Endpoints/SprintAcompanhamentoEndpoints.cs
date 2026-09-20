using RelatorioToggl.Configuracao;
using RelatorioToggl.Consultas;
using RelatorioToggl.Jira;
using RelatorioToggl.Sprint;

namespace RelatorioToggl.Api.Endpoints;

public static class SprintAcompanhamentoEndpoints
{
    public static void MapSprintAcompanhamentoEndpoints(this WebApplication app, CaminhosDados caminhos)
    {
        RouteGroupBuilder grupo = app.MapGroup("/api/sprint").WithTags("Sprint");

        grupo.MapGet("/", (string? chaveSprint) =>
        {
            if (string.IsNullOrWhiteSpace(chaveSprint))
                return Results.BadRequest("A chave do sprint é obrigatória.");

            List<DadosSprint> sprints = CarregadorSprintsIni.Carregar(caminhos.Sprints);
            DadosSprint? sprint = sprints.FirstOrDefault(s => s.Chave == chaveSprint);
            if (sprint is null)
                return Results.NotFound("Sprint não encontrado.");

            string? caminhoCacheSprint = caminhos.CacheSprint(sprint);
            string? caminhoCacheJiraSprint = caminhos.CacheJiraSprint(sprint);
            if (caminhoCacheSprint is null || caminhoCacheJiraSprint is null)
                return Results.BadRequest("A chave do sprint é inválida para nome de arquivo de cache.");

            List<ConfiguracaoUsuarioToggl> usuariosSelecionados = CarregadorUsuariosTogglIni.Carregar(caminhos.Usuarios)
                .Where(u => u.Selecionado)
                .ToList();
            if (usuariosSelecionados.Count == 0)
                return Results.BadRequest("Nenhum usuário do Toggl cadastrado.");

            CacheConsulta? cache = CarregadorCacheSprintIni.CarregarSeExistente(caminhoCacheSprint);
            if (cache is null || cache.DataInicio != sprint.DataInicio || cache.DataFim != sprint.DataFim)
                return Results.Conflict("Não há consulta salva para esse período. Chame POST /api/sprint/consultas primeiro.");

            ConfiguracaoApp configuracaoSelecionados = new() { Usuarios = usuariosSelecionados };
            ResultadoConsulta consulta = ServicoConsulta.CarregarRegistrosDoCache(cache, configuracaoSelecionados);

            ConfiguracaoCategoriasSprint categorias = CarregadorConfiguracaoCategoriasSprintIni.Carregar(caminhos);

            List<IssueJira>? issuesJira = CarregadorCacheJiraSprintIni.ObterParaSprint(caminhoCacheJiraSprint);
            Dictionary<string, IssueJira>? issuesPorCodigo = issuesJira?.ToDictionary(issue => issue.Chave, StringComparer.OrdinalIgnoreCase);

            ConfiguracaoResponsabilidadeSprint responsabilidade = CarregadorConfiguracaoResponsabilidadeSprintIni.Carregar(caminhos.JiraStatus);
            ConfiguracaoMapeamentoJiraToggl mapeamento = CarregadorConfiguracaoMapeamentoJiraTogglIni.Carregar(caminhos.JiraTogglMapeamento);
            ConfiguracaoStatusFinalSprint statusFinal = CarregadorConfiguracaoStatusFinalSprintIni.Carregar(caminhos.JiraStatus);

            ResultadoSprint resultado = ServicoSprint.Montar(sprint, usuariosSelecionados, consulta, categorias, issuesPorCodigo, responsabilidade, mapeamento, statusFinal);
            return Results.Ok(resultado);
        })
        .WithSummary("Devolve o acompanhamento do sprint (cabeçalho de capacidade + tarefas por descrição) a partir do cache do sprint");
    }
}