using Argos.Api.Autenticacao;
using Argos.Api.Endpoints;
using Argos.Armazenamento;
using Argos.Nucleo.Configuracao;
using System.Text.Json.Serialization;

const string PoliticaCorsLocal = "PoliticaCorsLocal";

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(opcoes =>
{
    opcoes.AddPolicy(PoliticaCorsLocal, politica =>
        politica.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

builder.Services.ConfigureHttpJsonOptions(opcoes =>
    opcoes.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddHealthChecks();

bool autenticacaoBasicaHabilitada = !string.IsNullOrEmpty(builder.Configuration["AUTH:USUARIO"])
    && !string.IsNullOrEmpty(builder.Configuration["AUTH:SENHA"]);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(opcoes =>
{
    opcoes.SwaggerDoc("v1", new Microsoft.OpenApi.OpenApiInfo
    {
        Title = "ArgosAPI",
        Version = "v1",
        Description = "Ferramenta web para acompanhar o tempo trabalhado por uma equipe. Ela junta os apontamentos de vários usuários do Toggl Track com as tarefas do Jira"
    });

    if (autenticacaoBasicaHabilitada)
    {
        opcoes.AddSecurityDefinition("basic", new Microsoft.OpenApi.OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = Microsoft.OpenApi.SecuritySchemeType.Http,
            Scheme = "basic",
            In = Microsoft.OpenApi.ParameterLocation.Header,
            Description = "Usuário/senha configurados em AUTH__USUARIO/AUTH__SENHA."
        });

        opcoes.AddSecurityRequirement(documento => new Microsoft.OpenApi.OpenApiSecurityRequirement
        {
            [new Microsoft.OpenApi.OpenApiSecuritySchemeReference("basic", documento)] = new List<string>()
        });
    }
});

WebApplication app = builder.Build();

app.UseCors(PoliticaCorsLocal);

app.UseAutenticacaoBasica();

app.UseStaticFiles();

app.MapHealthChecks("/health");

app.UseSwagger();
app.UseSwaggerUI(opcoes =>
{
    opcoes.SwaggerEndpoint("/swagger/v1/swagger.json", "Argos API");
    opcoes.DocumentTitle = "Argos API";
    opcoes.RoutePrefix = "swagger";
    opcoes.HeadContent = """
        <style>
        .swagger-ui .info {
          margin-bottom: 0px;
        }

        .swagger-ui .scheme-container {
          margin: 0px;
          padding: 0px;
          background: none;
          box-shadow: none;
        }

        .swagger-ui .scheme-container .schemes .auth-wrapper .authorize {
          margin-right: 0.5rem;
        }

        .swagger-ui .topbar {
          background-color: #363636;
        }

        .swagger-ui .topbar a svg {
          display: none;
        }

        .swagger-ui .topbar a {
          content: url('../images/argos.png');
          height: 2.5rem;
          flex: unset;
        }

        .swagger-ui .topbar .download-url-wrapper .select-label {
          display: none;
        }

        .swagger-ui .btn.authorize {
          margin-bottom: 1rem !important;
        }
        </style>
        """;
});

string? projetoFirestore = app.Configuration["ARMAZENAMENTO:PROJETO_FIRESTORE"];
IArmazenamentoDados armazenamento = string.IsNullOrWhiteSpace(projetoFirestore)
    ? new ArmazenamentoArquivos(Path.Combine(AppContext.BaseDirectory, "dados"))
    : new ArmazenamentoFirestore(projetoFirestore.Trim());
app.Logger.LogInformation("Armazenamento de dados: {Armazenamento}", armazenamento.Descricao);

CaminhosDados caminhos = new(armazenamento);

ExecucaoMigracaoDados.Executar(app.Logger, caminhos);

app.MapConfiguracaoEndpoints(caminhos);
app.MapUsuariosTogglEndpoints(caminhos);
app.MapTagsTogglEndpoints(caminhos);
app.MapConsultasEndpoints(caminhos);
app.MapRelatorioEndpoints(caminhos);
app.MapBuscaEndpoints(caminhos);
app.MapDadosEndpoints(caminhos);
app.MapGantEndpoints(caminhos);
app.MapSprintsEndpoints(caminhos);
app.MapSprintCategoriasEndpoints(caminhos);
app.MapSprintResponsabilidadeEndpoints(caminhos);
app.MapSprintStatusFinalEndpoints(caminhos);
app.MapSprintConsultasEndpoints(caminhos);
app.MapPlanejamentoEndpoints(caminhos);
app.MapSprintAcompanhamentoEndpoints(caminhos);
app.MapJiraEndpoints(caminhos);

app.Run();