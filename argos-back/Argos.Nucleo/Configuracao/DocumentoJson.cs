using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;

namespace Argos.Nucleo.Configuracao;

internal static class DocumentoJson
{
    public static readonly JsonSerializerOptions Opcoes = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
    };

    private static readonly JsonNodeOptions OpcoesNo = new() { PropertyNameCaseInsensitive = true };

    public static JsonObject? Ler(DocumentoDados documento) => Analisar(documento.Ler());

    public static JsonObject? Analisar(string? json)
    {
        if (json is null)
            return null;

        try
        {
            return JsonNode.Parse(json, OpcoesNo) as JsonObject;
        }
        catch (JsonException)
        {
            return null;
        }
    }

    public static void Gravar(DocumentoDados documento, JsonObject conteudo) => documento.Gravar(Serializar(conteudo));

    public static string Serializar(JsonObject conteudo) => conteudo.ToJsonString(Opcoes);

    public static JsonNode? ParaNo<T>(T valor) => JsonSerializer.SerializeToNode(valor, Opcoes);

    public static T? Obter<T>(JsonObject objeto, string propriedade)
    {
        if (!objeto.TryGetPropertyValue(propriedade, out JsonNode? no) || no is null)
            return default;

        return Converter<T>(no);
    }

    public static T? Converter<T>(JsonNode no)
    {
        try
        {
            return no.Deserialize<T>(Opcoes);
        }
        catch (Exception ex) when (ex is JsonException or InvalidOperationException or FormatException)
        {
            return default;
        }
    }

    public static List<T> ObterLista<T>(JsonObject objeto, string propriedade) =>
        Obter<List<T>>(objeto, propriedade) ?? new List<T>();

    public static string? ObterTextoOuNulo(JsonObject objeto, string propriedade) =>
        objeto.TryGetPropertyValue(propriedade, out JsonNode? no) && no is JsonValue valor && valor.TryGetValue(out string? texto)
            ? texto
            : null;

    public static string ObterTexto(JsonObject objeto, string propriedade, string padrao) =>
        ObterTextoOuNulo(objeto, propriedade) ?? padrao;

    public static IEnumerable<JsonObject> Objetos(JsonObject objeto, string propriedade) =>
        objeto.TryGetPropertyValue(propriedade, out JsonNode? no) && no is JsonArray lista
            ? lista.OfType<JsonObject>()
            : Enumerable.Empty<JsonObject>();
}