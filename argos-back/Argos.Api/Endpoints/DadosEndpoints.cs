using Argos.Nucleo.Configuracao;
using System.IO.Compression;
using System.Text;
using System.Text.Json;

namespace Argos.Api.Endpoints;

public static class DadosEndpoints
{
    private const string ExtensaoJson = ".json";

    private static readonly UTF8Encoding Codificacao = new(encoderShouldEmitUTF8Identifier: false);

    public static void MapDadosEndpoints(this WebApplication app, CaminhosDados caminhos)
    {
        IArmazenamentoDados armazenamento = caminhos.Armazenamento;
        RouteGroupBuilder grupo = app.MapGroup("/api/dados").WithTags("Dados");

        grupo.MapGet("/download", () => BaixarPastaDados(armazenamento))
            .WithSummary("Baixa todos os documentos de dados (um .json por documento), compactados em .zip");

        grupo.MapPost("/restaurar", (IFormFile arquivo, ILogger<CaminhosDados> logger) =>
            {
                IResult resultado = RestaurarPastaDados(arquivo, armazenamento);
                ExecucaoMigracaoDados.Executar(logger, caminhos);
                return resultado;
            })
            .WithSummary("Restaura os dados a partir de um .zip enviado (um .json por documento; sobrescreve documentos de mesmo nome) e migra formatos antigos")
            .DisableAntiforgery();
    }

    private static IResult BaixarPastaDados(IArmazenamentoDados armazenamento)
    {
        MemoryStream memoria = new();

        try
        {
            IReadOnlyList<string> nomes = armazenamento.Listar();
            if (nomes.Count == 0)
            {
                return Results.NotFound();
            }

            using ZipArchive zip = new(memoria, ZipArchiveMode.Create, leaveOpen: true);
            foreach (string nome in nomes)
            {
                string? conteudo = armazenamento.Ler(nome);
                if (conteudo is null)
                {
                    continue;
                }

                ZipArchiveEntry entrada = zip.CreateEntry(nome + ExtensaoJson);
                using Stream fluxo = entrada.Open();
                fluxo.Write(Codificacao.GetBytes(conteudo));
            }
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            return Results.Problem("Não foi possível ler os dados.", statusCode: 500);
        }

        memoria.Position = 0;
        return Results.File(memoria, "application/zip", "dados.zip");
    }

    private static IResult RestaurarPastaDados(IFormFile arquivo, IArmazenamentoDados armazenamento)
    {
        if (arquivo.Length == 0)
        {
            return Results.BadRequest("Arquivo vazio.");
        }

        Dictionary<string, string> documentos = new(StringComparer.OrdinalIgnoreCase);

        try
        {
            using Stream fluxo = arquivo.OpenReadStream();
            using ZipArchive zip = new(fluxo);

            foreach (ZipArchiveEntry entrada in zip.Entries)
            {
                if (string.IsNullOrEmpty(entrada.Name))
                {
                    continue;
                }

                if (entrada.FullName != entrada.Name)
                {
                    return Results.BadRequest(
                        "O arquivo .zip deve conter os arquivos diretamente na raiz, sem uma pasta " +
                        "\"dados\" (ou qualquer outra) por dentro — compacte o conteúdo da pasta dados/, " +
                        "não a pasta em si.");
                }
            }

            foreach (ZipArchiveEntry entrada in zip.Entries.Where(e => Path.GetExtension(e.Name).Equals(ExtensaoJson, StringComparison.OrdinalIgnoreCase)))
            {
                string nome = Path.GetFileNameWithoutExtension(entrada.Name);
                string json = LerTexto(entrada);
                if (!EhObjetoJson(json))
                {
                    return Results.BadRequest($"O arquivo \"{entrada.Name}\" não é um JSON válido.");
                }

                documentos[nome] = json;
            }

            foreach ((string nome, string json) in documentos)
            {
                armazenamento.Gravar(nome, json);
            }
        }
        catch (InvalidDataException)
        {
            return Results.BadRequest("Arquivo enviado não é um .zip válido.");
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            return Results.Problem("Não foi possível restaurar os dados.", statusCode: 500);
        }

        return Results.NoContent();
    }

    private static string LerTexto(ZipArchiveEntry entrada)
    {
        using StreamReader leitor = new(entrada.Open(), Codificacao, detectEncodingFromByteOrderMarks: true);
        return leitor.ReadToEnd();
    }

    private static bool EhObjetoJson(string json)
    {
        try
        {
            using JsonDocument documento = JsonDocument.Parse(json);
            return documento.RootElement.ValueKind == JsonValueKind.Object;
        }
        catch (JsonException)
        {
            return false;
        }
    }
}