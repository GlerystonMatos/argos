using Argos.Api.Dtos;
using Argos.Nucleo.Configuracao;

namespace Argos.Api.Endpoints;

public static class SprintsEndpoints
{
    public static void MapSprintsEndpoints(this WebApplication app, CaminhosDados caminhos)
    {
        RouteGroupBuilder grupo = app.MapGroup("/api/sprints").WithTags("Sprints");

        grupo.MapGet("/", () =>
        {
            List<DadosSprint> sprints = CarregadorSprintsIni.Carregar(caminhos.Sprints);
            List<SprintDto> resposta = sprints
                .Select(s => new SprintDto(s.Chave, s.Nome, s.HorasPorDia, s.MargemPercentual, s.DataInicio, s.DataFim, s.Fechado))
                .ToList();
            return Results.Ok(resposta);
        })
        .WithSummary("Lista os sprints cadastrados");

        grupo.MapPost("/", (CriarSprintRequest request) =>
        {
            if (string.IsNullOrWhiteSpace(request.Nome))
                return Results.BadRequest("O nome do sprint é obrigatório.");

            if (!ValidacaoDatas.Tenta(request.DataInicio, request.DataFim, out DateTime inicio, out DateTime fim, out IResult? erroDatas))
                return erroDatas!;

            if (request.HorasPorDia <= 0)
                return Results.BadRequest("As horas por dia devem ser maiores que zero.");

            if (request.MargemPercentual < 0 || request.MargemPercentual >= 100)
                return Results.BadRequest("A margem deve ser maior ou igual a 0 e menor que 100.");

            List<DadosSprint> sprints = CarregadorSprintsIni.Carregar(caminhos.Sprints);

            if (ServicoSprints.NomeEmUso(sprints, request.Nome, ignorar: null))
                return Results.Conflict($"Já existe um sprint chamado '{request.Nome}'.");

            string chave = ServicoSprints.GerarChaveUnica(request.Nome, sprints);
            DadosSprint sprint = new()
            {
                Chave = chave,
                Nome = request.Nome,
                HorasPorDia = request.HorasPorDia,
                MargemPercentual = request.MargemPercentual,
                DataInicio = inicio.ToString("yyyy-MM-dd"),
                DataFim = fim.ToString("yyyy-MM-dd")
            };
            sprints.Add(sprint);

            IResult? erroPersistencia = TratamentoIo.Executar(
                () => CarregadorSprintsIni.Salvar(caminhos.Sprints, sprints),
                "Não foi possível salvar os sprints.");
            if (erroPersistencia is not null)
                return erroPersistencia;

            return Results.Created($"/api/sprints/{chave}",
                new SprintDto(sprint.Chave, sprint.Nome, sprint.HorasPorDia, sprint.MargemPercentual, sprint.DataInicio, sprint.DataFim, sprint.Fechado));
        })
        .WithSummary("Cadastra um sprint");

        grupo.MapPut("/{chave}", (string chave, EditarSprintRequest request) =>
        {
            List<DadosSprint> sprints = CarregadorSprintsIni.Carregar(caminhos.Sprints);
            DadosSprint? sprint = sprints.FirstOrDefault(s => s.Chave == chave);
            if (sprint is null)
                return Results.NotFound();

            if (sprint.Fechado)
                return Results.Conflict("Este sprint está fechado. Reabra-o para editar.");

            string nome = string.IsNullOrWhiteSpace(request.Nome) ? sprint.Nome : request.Nome;
            decimal horasPorDia = request.HorasPorDia ?? sprint.HorasPorDia;
            decimal margemPercentual = request.MargemPercentual ?? sprint.MargemPercentual;
            string dataInicioTexto = string.IsNullOrWhiteSpace(request.DataInicio) ? sprint.DataInicio : request.DataInicio;
            string dataFimTexto = string.IsNullOrWhiteSpace(request.DataFim) ? sprint.DataFim : request.DataFim;

            if (!ValidacaoDatas.Tenta(dataInicioTexto, dataFimTexto, out DateTime inicio, out DateTime fim, out IResult? erroDatas))
                return erroDatas!;

            if (horasPorDia <= 0)
                return Results.BadRequest("As horas por dia devem ser maiores que zero.");

            if (margemPercentual < 0 || margemPercentual >= 100)
                return Results.BadRequest("A margem deve ser maior ou igual a 0 e menor que 100.");

            if (ServicoSprints.NomeEmUso(sprints, nome, ignorar: sprint))
                return Results.Conflict($"Já existe um sprint chamado '{nome}'.");

            sprint.Nome = nome;
            sprint.HorasPorDia = horasPorDia;
            sprint.MargemPercentual = margemPercentual;
            sprint.DataInicio = inicio.ToString("yyyy-MM-dd");
            sprint.DataFim = fim.ToString("yyyy-MM-dd");

            IResult? erroPersistencia = TratamentoIo.Executar(
                () => CarregadorSprintsIni.Salvar(caminhos.Sprints, sprints),
                "Não foi possível salvar os sprints.");
            if (erroPersistencia is not null)
                return erroPersistencia;

            return Results.Ok(new SprintDto(sprint.Chave, sprint.Nome, sprint.HorasPorDia, sprint.MargemPercentual, sprint.DataInicio, sprint.DataFim, sprint.Fechado));
        })
        .WithSummary("Edita um sprint (campos nulos ou omitidos não são alterados)");

        grupo.MapPost("/{chave}/fechar", (string chave) =>
        {
            List<DadosSprint> sprints = CarregadorSprintsIni.Carregar(caminhos.Sprints);
            DadosSprint? sprint = sprints.FirstOrDefault(s => s.Chave == chave);
            if (sprint is null)
                return Results.NotFound();

            sprint.Fechado = true;

            IResult? erroPersistencia = TratamentoIo.Executar(
                () => CarregadorSprintsIni.Salvar(caminhos.Sprints, sprints),
                "Não foi possível salvar os sprints.");
            if (erroPersistencia is not null)
                return erroPersistencia;

            return Results.Ok(new SprintDto(sprint.Chave, sprint.Nome, sprint.HorasPorDia, sprint.MargemPercentual, sprint.DataInicio, sprint.DataFim, sprint.Fechado));
        })
        .WithSummary("Fecha o sprint: trava a edição e faz a consulta sempre usar o cache já salvo (Toggl e Jira)");

        grupo.MapPost("/{chave}/reabrir", (string chave) =>
        {
            List<DadosSprint> sprints = CarregadorSprintsIni.Carregar(caminhos.Sprints);
            DadosSprint? sprint = sprints.FirstOrDefault(s => s.Chave == chave);
            if (sprint is null)
                return Results.NotFound();

            sprint.Fechado = false;

            IResult? erroPersistencia = TratamentoIo.Executar(
                () => CarregadorSprintsIni.Salvar(caminhos.Sprints, sprints),
                "Não foi possível salvar os sprints.");
            if (erroPersistencia is not null)
                return erroPersistencia;

            return Results.Ok(new SprintDto(sprint.Chave, sprint.Nome, sprint.HorasPorDia, sprint.MargemPercentual, sprint.DataInicio, sprint.DataFim, sprint.Fechado));
        })
        .WithSummary("Reabre o sprint: libera a edição e volta a permitir consulta real à API");

        grupo.MapDelete("/{chave}", (string chave) =>
        {
            List<DadosSprint> sprints = CarregadorSprintsIni.Carregar(caminhos.Sprints);
            DadosSprint? sprint = sprints.FirstOrDefault(s => s.Chave == chave);
            if (sprint is null)
                return Results.NotFound();

            sprints.Remove(sprint);

            IResult? erroCaches = TratamentoIo.Executar(
                () => ApagarCachesDoSprint(caminhos, sprint),
                "Não foi possível remover os caches do sprint.");
            if (erroCaches is not null)
                return erroCaches;

            IResult? erroPersistencia = TratamentoIo.Executar(
                () => CarregadorSprintsIni.Salvar(caminhos.Sprints, sprints),
                "Não foi possível salvar os sprints.");
            if (erroPersistencia is not null)
                return erroPersistencia;

            return Results.NoContent();
        })
        .WithSummary("Remove um sprint cadastrado e os caches dele (SprintData_<chave>.ini, JiraSprintData_<chave>.ini e JiraPlanejamentoData_<chave>.ini)");
    }

    private static void ApagarCachesDoSprint(CaminhosDados caminhos, DadosSprint sprint)
    {
        string? cacheToggl = caminhos.CacheSprint(sprint);
        if (cacheToggl is not null)
            File.Delete(cacheToggl);

        string? cacheJira = caminhos.CacheJiraSprint(sprint);
        if (cacheJira is not null)
            File.Delete(cacheJira);

        string? cachePlanejamento = caminhos.CacheJiraPlanejamento(sprint);
        if (cachePlanejamento is not null)
            File.Delete(cachePlanejamento);
    }
}