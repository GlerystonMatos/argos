using RelatorioToggl.Api.Autenticacao;
using RelatorioToggl.Api.Endpoints;
using RelatorioToggl.Configuracao;
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
        Title = "TogglReportAPI",
        Version = "v1",
        Description = "API local que expõe as mesmas funcionalidades do console TogglReport: parâmetros, usuários/tokens, consulta com cache, relatório e busca por descrição. Autenticação HTTP Basic opcional — ativa quando AUTH__USUARIO/AUTH__SENHA estão configurados; /health, /swagger e /images nunca exigem autenticação."
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
    opcoes.SwaggerEndpoint("/swagger/v1/swagger.json", "Toggl Report API");
    opcoes.DocumentTitle = "Toggl Report API";
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
          content: url('../images/toggl-report.png');
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

CaminhosDados caminhos = new(AppContext.BaseDirectory);

app.MapConfiguracaoEndpoints(caminhos);
app.MapUsuariosTogglEndpoints(caminhos);
app.MapTagsTogglEndpoints(caminhos);
app.MapConsultasEndpoints(caminhos);
app.MapRelatorioEndpoints(caminhos);
app.MapBuscaEndpoints(caminhos);
app.MapDadosEndpoints(caminhos.PastaDados);
app.MapGantEndpoints(caminhos);
app.MapSprintsEndpoints(caminhos);
app.MapSprintCategoriasEndpoints(caminhos);
app.MapSprintResponsabilidadeEndpoints(caminhos);
app.MapSprintStatusFinalEndpoints(caminhos);
app.MapSprintConsultasEndpoints(caminhos);
app.MapSprintPlanejamentoEndpoints(caminhos);
app.MapSprintAcompanhamentoEndpoints(caminhos);
app.MapJiraEndpoints(caminhos);

app.Run();