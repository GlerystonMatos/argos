using System.Globalization;
using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace Argos.Nucleo.Jira;

public class ClienteApiJira
{
    private static readonly JsonSerializerOptions OpcoesJson = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private static readonly TimeSpan EsperaPadraoNovaTentativa = TimeSpan.FromSeconds(5);

    private static readonly TimeSpan EsperaMaximaNovaTentativa = TimeSpan.FromSeconds(30);

    private readonly HttpClient _http;

    private readonly string _urlBaseSite;

    public ClienteApiJira(string urlDominio, string email, string apiToken)
    {
        _urlBaseSite = NormalizarDominio(urlDominio);
        _http = new HttpClient { BaseAddress = new Uri($"{_urlBaseSite}/rest/api/3/"), Timeout = TimeSpan.FromSeconds(30) };

        byte[] bytesAutenticacao = Encoding.UTF8.GetBytes($"{email}:{apiToken}");
        string valorCabecalhoAutenticacao = Convert.ToBase64String(bytesAutenticacao);

        _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", valorCabecalhoAutenticacao);
        _http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    }

    public async Task<ResultadoApiJira<bool>> TestarConexaoAsync()
    {
        try
        {
            using HttpResponseMessage resposta = await _http.GetAsync("myself");

            if (resposta.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden)
                return ResultadoApiJira<bool>.Falha("Credenciais inválidas (e-mail ou API Token incorretos).");

            if (!resposta.IsSuccessStatusCode)
            {
                string corpo = await resposta.Content.ReadAsStringAsync();
                return ResultadoApiJira<bool>.Falha($"Erro {(int)resposta.StatusCode} ao conectar ao Jira: {corpo}");
            }

            return ResultadoApiJira<bool>.Ok(true);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or UriFormatException)
        {
            return ResultadoApiJira<bool>.Falha($"Não foi possível conectar ao Jira: {ex.Message}");
        }
    }

    public async Task<ResultadoApiJira<List<CampoJira>>> ObterCamposAsync()
    {
        try
        {
            using HttpResponseMessage resposta = await _http.GetAsync("field");

            if (resposta.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden)
                return ResultadoApiJira<List<CampoJira>>.Falha("Credenciais inválidas (e-mail ou API Token incorretos).");

            if (!resposta.IsSuccessStatusCode)
            {
                string corpo = await resposta.Content.ReadAsStringAsync();
                return ResultadoApiJira<List<CampoJira>>.Falha($"Erro {(int)resposta.StatusCode} ao consultar campos do Jira: {corpo}");
            }

            string json = await resposta.Content.ReadAsStringAsync();
            List<CampoJiraBruto>? camposBrutos = JsonSerializer.Deserialize<List<CampoJiraBruto>>(json, OpcoesJson);

            List<CampoJira> campos = (camposBrutos ?? new List<CampoJiraBruto>())
                .Where(campo => campo.Custom)
                .Select(campo => new CampoJira(campo.Id, campo.Name))
                .OrderBy(campo => campo.Nome, StringComparer.OrdinalIgnoreCase)
                .ToList();

            return ResultadoApiJira<List<CampoJira>>.Ok(campos);
        }
        catch (JsonException ex)
        {
            return ResultadoApiJira<List<CampoJira>>.Falha($"Erro ao interpretar resposta do Jira: {ex.Message}");
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or UriFormatException)
        {
            return ResultadoApiJira<List<CampoJira>>.Falha($"Não foi possível conectar ao Jira: {ex.Message}");
        }
    }

    public async Task<ResultadoApiJira<List<string>>> ObterStatusAsync() => await ObterNomesAsync("status");

    public async Task<ResultadoApiJira<List<string>>> ObterPrioridadesAsync() => await ObterNomesAsync("priority");

    private async Task<ResultadoApiJira<List<string>>> ObterNomesAsync(string recurso)
    {
        try
        {
            using HttpResponseMessage resposta = await _http.GetAsync(recurso);

            if (resposta.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden)
                return ResultadoApiJira<List<string>>.Falha("Credenciais inválidas (e-mail ou API Token incorretos).");

            if (!resposta.IsSuccessStatusCode)
            {
                string corpo = await resposta.Content.ReadAsStringAsync();
                return ResultadoApiJira<List<string>>.Falha($"Erro {(int)resposta.StatusCode} ao consultar {recurso} do Jira: {corpo}");
            }

            string json = await resposta.Content.ReadAsStringAsync();
            List<NomeObjetoJiraBruto>? brutos = JsonSerializer.Deserialize<List<NomeObjetoJiraBruto>>(json, OpcoesJson);

            List<string> nomes = (brutos ?? new List<NomeObjetoJiraBruto>())
                .Select(item => item.Name)
                .Where(nome => !string.IsNullOrWhiteSpace(nome))
                .Select(nome => nome!)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(nome => nome, StringComparer.OrdinalIgnoreCase)
                .ToList();

            return ResultadoApiJira<List<string>>.Ok(nomes);
        }
        catch (JsonException ex)
        {
            return ResultadoApiJira<List<string>>.Falha($"Erro ao interpretar resposta do Jira: {ex.Message}");
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or UriFormatException)
        {
            return ResultadoApiJira<List<string>>.Falha($"Não foi possível conectar ao Jira: {ex.Message}");
        }
    }

    public async Task<ResultadoApiJira<List<string>>> ObterUsuariosAsync()
    {
        const int tamanhoPagina = 50;
        List<UsuarioJiraBruto> usuariosBrutos = new();
        int startAt = 0;

        try
        {
            while (true)
            {
                using HttpResponseMessage resposta = await _http.GetAsync($"users/search?startAt={startAt}&maxResults={tamanhoPagina}");

                if (resposta.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden)
                    return ResultadoApiJira<List<string>>.Falha("Credenciais inválidas (e-mail ou API Token incorretos).");

                if (!resposta.IsSuccessStatusCode)
                {
                    string corpo = await resposta.Content.ReadAsStringAsync();
                    return ResultadoApiJira<List<string>>.Falha($"Erro {(int)resposta.StatusCode} ao consultar usuários do Jira: {corpo}");
                }

                string json = await resposta.Content.ReadAsStringAsync();
                List<UsuarioJiraBruto>? pagina = JsonSerializer.Deserialize<List<UsuarioJiraBruto>>(json, OpcoesJson);

                if (pagina is null || pagina.Count == 0)
                    break;

                usuariosBrutos.AddRange(pagina);

                if (pagina.Count < tamanhoPagina)
                    break;

                startAt += tamanhoPagina;
            }

            List<string> nomes = usuariosBrutos
                .Where(usuario => usuario.Active && string.Equals(usuario.AccountType, "atlassian", StringComparison.OrdinalIgnoreCase))
                .Select(usuario => usuario.DisplayName)
                .Where(nome => !string.IsNullOrWhiteSpace(nome))
                .Select(nome => nome!)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(nome => nome, StringComparer.OrdinalIgnoreCase)
                .ToList();

            return ResultadoApiJira<List<string>>.Ok(nomes);
        }
        catch (JsonException ex)
        {
            return ResultadoApiJira<List<string>>.Falha($"Erro ao interpretar resposta do Jira: {ex.Message}");
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or UriFormatException)
        {
            return ResultadoApiJira<List<string>>.Falha($"Não foi possível conectar ao Jira: {ex.Message}");
        }
    }

    public async Task<ResultadoApiJira<List<QuadroJira>>> ListarQuadrosAsync()
    {
        const int tamanhoPagina = 50;
        List<QuadroJiraBruto> quadrosBrutos = new();
        int startAt = 0;

        try
        {
            while (true)
            {
                using HttpResponseMessage resposta = await _http.GetAsync($"/rest/agile/1.0/board?type=scrum&startAt={startAt}&maxResults={tamanhoPagina}");

                if (resposta.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden)
                    return ResultadoApiJira<List<QuadroJira>>.Falha("Credenciais inválidas (e-mail ou API Token incorretos).");

                if (!resposta.IsSuccessStatusCode)
                {
                    string corpo = await resposta.Content.ReadAsStringAsync();
                    return ResultadoApiJira<List<QuadroJira>>.Falha($"Erro {(int)resposta.StatusCode} ao consultar quadros do Jira: {corpo}");
                }

                string json = await resposta.Content.ReadAsStringAsync();
                RespostaQuadrosJiraBruta? pagina = JsonSerializer.Deserialize<RespostaQuadrosJiraBruta>(json, OpcoesJson);

                if (pagina?.Values is null || pagina.Values.Count == 0)
                    break;

                quadrosBrutos.AddRange(pagina.Values);

                if (pagina.IsLast)
                    break;

                startAt += pagina.Values.Count;
            }

            List<QuadroJira> quadros = quadrosBrutos
                .Where(quadro => !string.IsNullOrWhiteSpace(quadro.Name))
                .GroupBy(quadro => quadro.Id)
                .Select(grupo => grupo.First())
                .Select(quadro => new QuadroJira(quadro.Id, quadro.Name!, quadro.Location?.ProjectKey))
                .OrderBy(quadro => quadro.Nome, StringComparer.OrdinalIgnoreCase)
                .ToList();

            return ResultadoApiJira<List<QuadroJira>>.Ok(quadros);
        }
        catch (JsonException ex)
        {
            return ResultadoApiJira<List<QuadroJira>>.Falha($"Erro ao interpretar resposta do Jira: {ex.Message}");
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or UriFormatException)
        {
            return ResultadoApiJira<List<QuadroJira>>.Falha($"Não foi possível conectar ao Jira: {ex.Message}");
        }
    }

    public async Task<ResultadoApiJira<List<ColunaQuadroJira>>> ObterColunasQuadroAsync(long quadroId)
    {
        ResultadoApiJira<RespostaConfiguracaoQuadroJiraBruta> resultado = await ObterJsonAsync<RespostaConfiguracaoQuadroJiraBruta>(
            $"/rest/agile/1.0/board/{quadroId}/configuration",
            "as colunas do quadro do Jira");
        if (!resultado.Sucesso)
            return ResultadoApiJira<List<ColunaQuadroJira>>.Falha(resultado.MensagemErro!);

        List<ColunaQuadroJira> colunas = (resultado.Dados!.ColumnConfig?.Columns ?? new List<ColunaQuadroJiraBruta>())
            .Where(coluna => !string.IsNullOrWhiteSpace(coluna.Name))
            .Select(coluna => new ColunaQuadroJira(
                coluna.Name!,
                (coluna.Statuses ?? new List<StatusColunaQuadroJiraBruto>())
                    .Select(status => status.Id)
                    .Where(id => !string.IsNullOrWhiteSpace(id))
                    .Select(id => id!)
                    .ToList()))
            .ToList();

        return ResultadoApiJira<List<ColunaQuadroJira>>.Ok(colunas);
    }

    public async Task<ResultadoApiJira<List<SprintQuadroJira>>> ObterSprintsAtivosQuadroAsync(long quadroId)
    {
        const int tamanhoPagina = 50;
        List<SprintQuadroJiraBruto> sprintsBrutos = new();
        int startAt = 0;

        while (true)
        {
            ResultadoApiJira<RespostaSprintsQuadroJiraBruta> resultado = await ObterJsonAsync<RespostaSprintsQuadroJiraBruta>(
                $"/rest/agile/1.0/board/{quadroId}/sprint?state=active&startAt={startAt}&maxResults={tamanhoPagina}",
                "os sprints ativos do quadro do Jira");
            if (!resultado.Sucesso)
                return ResultadoApiJira<List<SprintQuadroJira>>.Falha(resultado.MensagemErro!);

            List<SprintQuadroJiraBruto>? pagina = resultado.Dados!.Values;
            if (pagina is null || pagina.Count == 0)
                break;

            sprintsBrutos.AddRange(pagina);

            if (resultado.Dados.IsLast)
                break;

            startAt += pagina.Count;
        }

        List<SprintQuadroJira> sprints = sprintsBrutos
            .Where(sprint => !string.IsNullOrWhiteSpace(sprint.Name))
            .GroupBy(sprint => sprint.Id)
            .Select(grupo => grupo.First())
            .Select(sprint => new SprintQuadroJira(sprint.Id, sprint.Name!, sprint.StartDate, sprint.EndDate))
            .ToList();

        return ResultadoApiJira<List<SprintQuadroJira>>.Ok(sprints);
    }

    public async Task<ResultadoApiJira<List<CartaoQuadroJira>>> BuscarCartoesSprintAsync(long quadroId, List<long> sprintIds, string campoAnalisadoPorId, string campoRevisadoPorId, string campoTimeId, string campoPrevisaoLiberacaoId = "", string campoEstimativaDesenvolvimentoId = "", string campoEstimativaRevisaoId = "")
    {
        if (sprintIds.Count == 0)
            return ResultadoApiJira<List<CartaoQuadroJira>>.Ok(new List<CartaoQuadroJira>());

        const int tamanhoPagina = 200;

        List<string> camposDesejados = new() { "summary", "status", "priority", "assignee", "parent" };
        if (!string.IsNullOrWhiteSpace(campoAnalisadoPorId))
            camposDesejados.Add(campoAnalisadoPorId);
        if (!string.IsNullOrWhiteSpace(campoRevisadoPorId))
            camposDesejados.Add(campoRevisadoPorId);
        if (!string.IsNullOrWhiteSpace(campoTimeId))
            camposDesejados.Add(campoTimeId);
        if (!string.IsNullOrWhiteSpace(campoPrevisaoLiberacaoId))
            camposDesejados.Add(campoPrevisaoLiberacaoId);
        if (!string.IsNullOrWhiteSpace(campoEstimativaDesenvolvimentoId))
            camposDesejados.Add(campoEstimativaDesenvolvimentoId);
        if (!string.IsNullOrWhiteSpace(campoEstimativaRevisaoId))
            camposDesejados.Add(campoEstimativaRevisaoId);

        string jql = sprintIds.Count == 1 ? $"sprint = {sprintIds[0]}" : $"sprint in ({string.Join(",", sprintIds)})";
        string parametrosFixos = $"jql={Uri.EscapeDataString(jql)}&fields={Uri.EscapeDataString(string.Join(",", camposDesejados))}&maxResults={tamanhoPagina}";

        List<IssueBrutaJira> issuesBrutas = new();
        int startAt = 0;

        while (true)
        {
            ResultadoApiJira<RespostaCartoesQuadroJiraBruta> resultado = await ObterJsonAsync<RespostaCartoesQuadroJiraBruta>(
                $"/rest/agile/1.0/board/{quadroId}/issue?{parametrosFixos}&startAt={startAt}",
                "os cartões do quadro do Jira");
            if (!resultado.Sucesso)
                return ResultadoApiJira<List<CartaoQuadroJira>>.Falha(resultado.MensagemErro!);

            List<IssueBrutaJira>? pagina = resultado.Dados!.Issues;
            if (pagina is null || pagina.Count == 0)
                break;

            issuesBrutas.AddRange(pagina);
            startAt += pagina.Count;

            if (startAt >= resultado.Dados.Total)
                break;
        }

        List<CartaoQuadroJira> cartoes = issuesBrutas
            .GroupBy(issue => issue.Key)
            .Select(grupo => grupo.First())
            .Select(issue => new CartaoQuadroJira(
                issue.Key,
                issue.Fields.Summary ?? "",
                issue.Fields.Status?.Id ?? "",
                issue.Fields.Status?.Name ?? "",
                issue.Fields.Priority?.Name,
                issue.Fields.Parent?.Key,
                issue.Fields.Parent?.Fields?.Summary,
                ExtrairNomeUsuario(issue.Fields.CamposExtras, "assignee"),
                ExtrairNomeUsuario(issue.Fields.CamposExtras, campoAnalisadoPorId),
                ExtrairNomeUsuario(issue.Fields.CamposExtras, campoRevisadoPorId),
                ExtrairTextoCampo(issue.Fields.CamposExtras, campoTimeId),
                MontarUrlIssue(issue.Key),
                ExtrairData(issue.Fields.CamposExtras, campoPrevisaoLiberacaoId),
                ExtrairEstimativaEsforco(issue.Fields.CamposExtras, campoEstimativaDesenvolvimentoId),
                ExtrairEstimativaEsforco(issue.Fields.CamposExtras, campoEstimativaRevisaoId)))
            .ToList();

        return ResultadoApiJira<List<CartaoQuadroJira>>.Ok(cartoes);
    }

    private async Task<ResultadoApiJira<T>> ObterJsonAsync<T>(string caminho, string descricaoRecurso) where T : class
    {
        try
        {
            using HttpResponseMessage resposta = await ObterComNovaTentativaAsync(caminho);

            if (resposta.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden)
                return ResultadoApiJira<T>.Falha("Credenciais inválidas (e-mail ou API Token incorretos).");

            if (!resposta.IsSuccessStatusCode)
            {
                string corpo = await resposta.Content.ReadAsStringAsync();
                return ResultadoApiJira<T>.Falha($"Erro {(int)resposta.StatusCode} ao consultar {descricaoRecurso}: {corpo}");
            }

            string json = await resposta.Content.ReadAsStringAsync();
            T? dados = JsonSerializer.Deserialize<T>(json, OpcoesJson);

            return dados is null
                ? ResultadoApiJira<T>.Falha($"Resposta vazia do Jira ao consultar {descricaoRecurso}.")
                : ResultadoApiJira<T>.Ok(dados);
        }
        catch (JsonException ex)
        {
            return ResultadoApiJira<T>.Falha($"Erro ao interpretar resposta do Jira: {ex.Message}");
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or UriFormatException)
        {
            return ResultadoApiJira<T>.Falha($"Não foi possível conectar ao Jira: {ex.Message}");
        }
    }

    private async Task<HttpResponseMessage> ObterComNovaTentativaAsync(string caminho)
    {
        HttpResponseMessage resposta = await _http.GetAsync(caminho);
        if (resposta.StatusCode != HttpStatusCode.TooManyRequests)
            return resposta;

        TimeSpan espera = resposta.Headers.RetryAfter?.Delta
            ?? (resposta.Headers.RetryAfter?.Date - DateTimeOffset.UtcNow)
            ?? EsperaPadraoNovaTentativa;
        espera = TimeSpan.FromSeconds(Math.Clamp(espera.TotalSeconds, 1, EsperaMaximaNovaTentativa.TotalSeconds));

        resposta.Dispose();
        await Task.Delay(espera);
        return await _http.GetAsync(caminho);
    }

    public async Task<ResultadoApiJira<List<IssueJira>>> BuscarIssuesAsync(List<string> chaves, string campoEstimativaDesenvolvimentoId, string? campoRevisadoPorId = null, string? campoEstimativaRevisaoId = null, string? campoEstimativaTestesId = null, string? campoPrevisaoLiberacaoId = null)
    {
        if (chaves.Count == 0)
            return ResultadoApiJira<List<IssueJira>>.Ok(new List<IssueJira>());

        List<string> camposDesejados = new() { "priority", "status", "assignee" };
        if (!string.IsNullOrWhiteSpace(campoEstimativaDesenvolvimentoId))
            camposDesejados.Add(campoEstimativaDesenvolvimentoId);
        if (!string.IsNullOrWhiteSpace(campoRevisadoPorId))
            camposDesejados.Add(campoRevisadoPorId);
        if (!string.IsNullOrWhiteSpace(campoEstimativaRevisaoId))
            camposDesejados.Add(campoEstimativaRevisaoId);
        if (!string.IsNullOrWhiteSpace(campoEstimativaTestesId))
            camposDesejados.Add(campoEstimativaTestesId);
        if (!string.IsNullOrWhiteSpace(campoPrevisaoLiberacaoId))
            camposDesejados.Add(campoPrevisaoLiberacaoId);

        string jql = $"key in ({string.Join(",", chaves)})";
        List<IssueBrutaJira> issuesBrutas = new();
        string? proximoPageToken = null;

        try
        {
            bool ultimaPagina;
            do
            {
                object corpo = proximoPageToken is null
                    ? new { jql, fields = camposDesejados, maxResults = 100 }
                    : new { jql, fields = camposDesejados, maxResults = 100, nextPageToken = proximoPageToken };

                using StringContent conteudo = new(JsonSerializer.Serialize(corpo), Encoding.UTF8, "application/json");
                using HttpResponseMessage resposta = await _http.PostAsync("search/jql", conteudo);

                if (resposta.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden)
                    return ResultadoApiJira<List<IssueJira>>.Falha("Credenciais inválidas (e-mail ou API Token incorretos).");

                if (!resposta.IsSuccessStatusCode)
                {
                    string corpoErro = await resposta.Content.ReadAsStringAsync();
                    return ResultadoApiJira<List<IssueJira>>.Falha($"Erro {(int)resposta.StatusCode} ao buscar issues do Jira: {corpoErro}");
                }

                string json = await resposta.Content.ReadAsStringAsync();
                RespostaBuscaJiraBruta? respostaBruta = JsonSerializer.Deserialize<RespostaBuscaJiraBruta>(json, OpcoesJson);

                if (respostaBruta?.Issues is not null)
                    issuesBrutas.AddRange(respostaBruta.Issues);

                proximoPageToken = respostaBruta?.NextPageToken;
                ultimaPagina = respostaBruta is null || respostaBruta.IsLast || string.IsNullOrWhiteSpace(proximoPageToken);
            }
            while (!ultimaPagina);

            List<IssueJira> issues = issuesBrutas
                .Select(issue => new IssueJira(
                    issue.Key,
                    issue.Fields.Priority?.Name,
                    issue.Fields.Status?.Name,
                    ExtrairEstimativaEsforco(issue.Fields.CamposExtras, campoEstimativaDesenvolvimentoId),
                    MontarUrlIssue(issue.Key),
                    issue.Fields.Status?.StatusCategory?.Key,
                    ExtrairNomeUsuario(issue.Fields.CamposExtras, "assignee"),
                    ExtrairNomeUsuario(issue.Fields.CamposExtras, campoRevisadoPorId),
                    ExtrairEstimativaEsforco(issue.Fields.CamposExtras, campoEstimativaRevisaoId ?? ""),
                    ExtrairEstimativaEsforco(issue.Fields.CamposExtras, campoEstimativaTestesId ?? ""),
                    ExtrairData(issue.Fields.CamposExtras, campoPrevisaoLiberacaoId)))
                .ToList();

            return ResultadoApiJira<List<IssueJira>>.Ok(issues);
        }
        catch (JsonException ex)
        {
            return ResultadoApiJira<List<IssueJira>>.Falha($"Erro ao interpretar resposta do Jira: {ex.Message}");
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or UriFormatException)
        {
            return ResultadoApiJira<List<IssueJira>>.Falha($"Não foi possível conectar ao Jira: {ex.Message}");
        }
    }

    private static decimal? ExtrairEstimativaEsforco(Dictionary<string, JsonElement>? camposExtras, string campoEstimativaEsforcoId)
    {
        if (string.IsNullOrWhiteSpace(campoEstimativaEsforcoId)
            || camposExtras is null
            || !camposExtras.TryGetValue(campoEstimativaEsforcoId, out JsonElement valor)
            || valor.ValueKind is JsonValueKind.Null or JsonValueKind.Undefined)
            return null;

        if (valor.ValueKind == JsonValueKind.Number && valor.TryGetDecimal(out decimal numero))
            return numero;

        if (valor.ValueKind == JsonValueKind.String && decimal.TryParse(valor.GetString(), NumberStyles.Any, CultureInfo.InvariantCulture, out decimal numeroTexto))
            return numeroTexto;

        if (valor.ValueKind == JsonValueKind.Object && valor.TryGetProperty("value", out JsonElement valorAninhado))
        {
            if (valorAninhado.ValueKind == JsonValueKind.Number && valorAninhado.TryGetDecimal(out decimal numeroAninhado))
                return numeroAninhado;

            if (valorAninhado.ValueKind == JsonValueKind.String && decimal.TryParse(valorAninhado.GetString(), NumberStyles.Any, CultureInfo.InvariantCulture, out decimal numeroAninhadoTexto))
                return numeroAninhadoTexto;
        }

        return null;
    }

    private static string? ExtrairNomeUsuario(Dictionary<string, JsonElement>? camposExtras, string? chaveCampo)
    {
        if (string.IsNullOrWhiteSpace(chaveCampo)
            || camposExtras is null
            || !camposExtras.TryGetValue(chaveCampo, out JsonElement valor)
            || valor.ValueKind is JsonValueKind.Null or JsonValueKind.Undefined)
            return null;

        if (valor.ValueKind == JsonValueKind.Object
            && valor.TryGetProperty("displayName", out JsonElement nome)
            && nome.ValueKind == JsonValueKind.String)
            return nome.GetString();

        return null;
    }

    private static string? ExtrairTextoCampo(Dictionary<string, JsonElement>? camposExtras, string? chaveCampo)
    {
        if (string.IsNullOrWhiteSpace(chaveCampo)
            || camposExtras is null
            || !camposExtras.TryGetValue(chaveCampo, out JsonElement valor)
            || valor.ValueKind is JsonValueKind.Null or JsonValueKind.Undefined)
            return null;

        if (valor.ValueKind == JsonValueKind.String)
            return valor.GetString();

        if (valor.ValueKind == JsonValueKind.Object)
        {
            foreach (string propriedade in new[] { "value", "name", "title", "displayName" })
            {
                if (valor.TryGetProperty(propriedade, out JsonElement texto) && texto.ValueKind == JsonValueKind.String)
                    return texto.GetString();
            }
        }

        return null;
    }

    private static string? ExtrairData(Dictionary<string, JsonElement>? camposExtras, string? chaveCampo)
    {
        if (string.IsNullOrWhiteSpace(chaveCampo)
            || camposExtras is null
            || !camposExtras.TryGetValue(chaveCampo, out JsonElement valor)
            || valor.ValueKind != JsonValueKind.String)
            return null;

        string? bruto = valor.GetString();
        if (string.IsNullOrWhiteSpace(bruto))
            return null;

        return DateTime.TryParse(bruto, CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime data)
            ? data.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)
            : null;
    }

    private static string NormalizarDominio(string urlDominio)
    {
        string dominio = urlDominio.Trim().TrimEnd('/');
        if (!dominio.StartsWith("http://", StringComparison.OrdinalIgnoreCase) && !dominio.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            dominio = $"https://{dominio}";

        return dominio;
    }

    private string MontarUrlIssue(string chave) => $"{_urlBaseSite}/browse/{chave}";
}