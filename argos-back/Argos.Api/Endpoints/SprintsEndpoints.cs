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
            List<DadosSprint> sprints = CarregadorSprints.Carregar(caminhos.Sprints);
            List<SprintDto> resposta = sprints.Select(ParaDto).ToList();
            return Results.Ok(resposta);
        })
        .WithSummary("Lista os sprints cadastrados");

        grupo.MapPost("/", (CriarSprintRequest request) =>
        {
            if (string.IsNullOrWhiteSpace(request.Nome))
                return Results.BadRequest("O nome do sprint é obrigatório.");

            if (!ValidacaoDatas.Tenta(request.DataInicio, request.DataFim, out DateTime inicio, out DateTime fim, out IResult? erroDatas))
                return erroDatas!;

            if (request.HorasPorDia is null)
                return Results.BadRequest("As horas por dia são obrigatórias.");

            if (request.MargemPercentual is null)
                return Results.BadRequest("A margem é obrigatória.");

            int diasNaoUteis = request.DiasNaoUteis ?? 0;
            IResult? erroValores = ValidarValores(request.HorasPorDia.Value, request.MargemPercentual.Value, diasNaoUteis, inicio, fim);
            if (erroValores is not null)
                return erroValores;

            List<DadosSprint> sprints = CarregadorSprints.Carregar(caminhos.Sprints);

            if (ServicoSprints.NomeEmUso(sprints, request.Nome, ignorar: null))
                return Results.Conflict($"Já existe um sprint chamado '{request.Nome}'.");

            string chave = ServicoSprints.GerarChaveUnica(request.Nome, sprints);
            DadosSprint sprint = new()
            {
                Chave = chave,
                Nome = request.Nome,
                HorasPorDia = request.HorasPorDia.Value,
                MargemPercentual = request.MargemPercentual.Value,
                DataInicio = inicio.ToString("yyyy-MM-dd"),
                DataFim = fim.ToString("yyyy-MM-dd"),
                DiasNaoUteis = diasNaoUteis
            };
            sprints.Add(sprint);

            IResult? erroPersistencia = SalvarSprints(caminhos, sprints);
            if (erroPersistencia is not null)
                return erroPersistencia;

            return Results.Created($"/api/sprints/{chave}", ParaDto(sprint));
        })
        .WithSummary("Cadastra um sprint");

        grupo.MapPut("/{chave}", (string chave, EditarSprintRequest request) =>
        {
            List<DadosSprint> sprints = CarregadorSprints.Carregar(caminhos.Sprints);
            DadosSprint? sprint = sprints.FirstOrDefault(s => s.Chave == chave);
            if (sprint is null)
                return Results.NotFound();

            if (sprint.Fechado)
                return Results.Conflict("Este sprint está fechado. Reabra-o para editar.");

            string nome = string.IsNullOrWhiteSpace(request.Nome) ? sprint.Nome : request.Nome;
            decimal horasPorDia = request.HorasPorDia ?? sprint.HorasPorDia;
            decimal margemPercentual = request.MargemPercentual ?? sprint.MargemPercentual;
            int diasNaoUteis = request.DiasNaoUteis ?? sprint.DiasNaoUteis;
            string dataInicioTexto = string.IsNullOrWhiteSpace(request.DataInicio) ? sprint.DataInicio : request.DataInicio;
            string dataFimTexto = string.IsNullOrWhiteSpace(request.DataFim) ? sprint.DataFim : request.DataFim;

            if (!ValidacaoDatas.Tenta(dataInicioTexto, dataFimTexto, out DateTime inicio, out DateTime fim, out IResult? erroDatas))
                return erroDatas!;

            IResult? erroValores = ValidarValores(horasPorDia, margemPercentual, diasNaoUteis, inicio, fim);
            if (erroValores is not null)
                return erroValores;

            if (ServicoSprints.NomeEmUso(sprints, nome, ignorar: sprint))
                return Results.Conflict($"Já existe um sprint chamado '{nome}'.");

            sprint.Nome = nome;
            sprint.HorasPorDia = horasPorDia;
            sprint.MargemPercentual = margemPercentual;
            sprint.DiasNaoUteis = diasNaoUteis;
            sprint.DataInicio = inicio.ToString("yyyy-MM-dd");
            sprint.DataFim = fim.ToString("yyyy-MM-dd");

            IResult? erroPersistencia = SalvarSprints(caminhos, sprints);
            if (erroPersistencia is not null)
                return erroPersistencia;

            return Results.Ok(ParaDto(sprint));
        })
        .WithSummary("Edita um sprint (campos nulos ou omitidos não são alterados)");

        grupo.MapPut("/{chave}/deducoes", (string chave, AtualizarHorasDeduzidasRequest request) =>
        {
            List<DadosSprint> sprints = CarregadorSprints.Carregar(caminhos.Sprints);
            DadosSprint? sprint = sprints.FirstOrDefault(s => s.Chave == chave);
            if (sprint is null)
                return Results.NotFound();

            if (sprint.Fechado)
                return Results.Conflict("Este sprint está fechado. Reabra-o para editar.");

            Dictionary<string, int> horasDeduzidas = request.HorasDeduzidas ?? new Dictionary<string, int>();
            if (horasDeduzidas.Any(par => string.IsNullOrWhiteSpace(par.Key) || par.Value < 0))
                return Results.BadRequest("As horas deduzidas devem ser maiores ou iguais a zero e ter a chave do usuário do Toggl.");

            sprint.HorasDeduzidas = horasDeduzidas
                .Where(par => par.Value > 0)
                .ToDictionary(par => par.Key.Trim(), par => par.Value);

            IResult? erroPersistencia = SalvarSprints(caminhos, sprints);
            if (erroPersistencia is not null)
                return erroPersistencia;

            return Results.Ok(ParaDto(sprint));
        })
        .WithSummary("Substitui as horas deduzidas da capacidade de cada colaborador (férias, folga, atestado): chave do usuário do Toggl → horas; zero remove. 409 se fechado");

        grupo.MapPost("/{chave}/fechar", (string chave) => AlterarFechado(caminhos, chave, fechado: true))
            .WithSummary("Fecha o sprint: trava a edição e faz a consulta sempre usar o cache já salvo (Toggl e Jira)");

        grupo.MapPost("/{chave}/reabrir", (string chave) => AlterarFechado(caminhos, chave, fechado: false))
            .WithSummary("Reabre o sprint: libera a edição e volta a permitir consulta real à API");

        grupo.MapDelete("/{chave}", (string chave) =>
        {
            List<DadosSprint> sprints = CarregadorSprints.Carregar(caminhos.Sprints);
            DadosSprint? sprint = sprints.FirstOrDefault(s => s.Chave == chave);
            if (sprint is null)
                return Results.NotFound();

            sprints.Remove(sprint);

            IResult? erroCaches = TratamentoIo.Executar(
                () => ApagarCachesDoSprint(caminhos, sprint),
                "Não foi possível remover os caches do sprint.");
            if (erroCaches is not null)
                return erroCaches;

            IResult? erroPersistencia = SalvarSprints(caminhos, sprints);
            if (erroPersistencia is not null)
                return erroPersistencia;

            return Results.NoContent();
        })
        .WithSummary("Remove um sprint cadastrado e os caches dele (SprintData_<chave> e JiraSprintData_<chave>)");
    }

    private static IResult AlterarFechado(CaminhosDados caminhos, string chave, bool fechado)
    {
        List<DadosSprint> sprints = CarregadorSprints.Carregar(caminhos.Sprints);
        DadosSprint? sprint = sprints.FirstOrDefault(s => s.Chave == chave);
        if (sprint is null)
            return Results.NotFound();

        sprint.Fechado = fechado;

        IResult? erroPersistencia = SalvarSprints(caminhos, sprints);
        if (erroPersistencia is not null)
            return erroPersistencia;

        return Results.Ok(ParaDto(sprint));
    }

    private static IResult? ValidarValores(decimal horasPorDia, decimal margemPercentual, int diasNaoUteis, DateTime inicio, DateTime fim)
    {
        if (horasPorDia <= 0)
            return Results.BadRequest("As horas por dia devem ser maiores que zero.");

        if (margemPercentual < 0 || margemPercentual >= 100)
            return Results.BadRequest("A margem deve ser maior ou igual a 0 e menor que 100.");

        int diasUteisPeriodo = DiasUteis.Entre(inicio, fim).Count();
        if (diasNaoUteis < 0 || diasNaoUteis > diasUteisPeriodo)
            return Results.BadRequest($"Os dias não úteis devem ficar entre 0 e {diasUteisPeriodo} (dias úteis do período).");

        return null;
    }

    private static IResult? SalvarSprints(CaminhosDados caminhos, List<DadosSprint> sprints) =>
        TratamentoIo.Executar(
            () => CarregadorSprints.Salvar(caminhos.Sprints, sprints),
            "Não foi possível salvar os sprints.");

    private static SprintDto ParaDto(DadosSprint sprint) => new(
        sprint.Chave,
        sprint.Nome,
        sprint.HorasPorDia,
        sprint.MargemPercentual,
        sprint.DataInicio,
        sprint.DataFim,
        sprint.DiasNaoUteis,
        sprint.HorasDeduzidas,
        sprint.Fechado);

    private static void ApagarCachesDoSprint(CaminhosDados caminhos, DadosSprint sprint)
    {
        caminhos.CacheSprint(sprint)?.Apagar();
        caminhos.CacheJiraSprint(sprint)?.Apagar();
    }
}