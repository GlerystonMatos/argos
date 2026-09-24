using Google.Cloud.Firestore;
using System.Globalization;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;

namespace Argos.Armazenamento;

internal static class ConversorValoresFirestore
{
    public static Dictionary<string, object?> DeJson(string json)
    {
        using JsonDocument documento = JsonDocument.Parse(json);
        if (documento.RootElement.ValueKind != JsonValueKind.Object)
            throw new IOException("O documento precisa ser um objeto JSON.");

        return DeObjeto(documento.RootElement);
    }

    public static string ParaJson(Dictionary<string, object?> campos)
    {
        using MemoryStream memoria = new();
        using (Utf8JsonWriter escritor = new(memoria, new JsonWriterOptions { Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping }))
            EscreverValor(escritor, campos);

        return Encoding.UTF8.GetString(memoria.ToArray());
    }

    private static Dictionary<string, object?> DeObjeto(JsonElement objeto)
    {
        Dictionary<string, object?> campos = new();
        foreach (JsonProperty propriedade in objeto.EnumerateObject())
            campos[propriedade.Name] = DeValor(propriedade.Value, dentroDeLista: false);

        return campos;
    }

    private static object? DeValor(JsonElement valor, bool dentroDeLista) => valor.ValueKind switch
    {
        JsonValueKind.Object => DeObjeto(valor),
        JsonValueKind.Array when dentroDeLista => throw new IOException("O Firestore não aceita lista dentro de lista."),
        JsonValueKind.Array => valor.EnumerateArray().Select(item => DeValor(item, dentroDeLista: true)).ToList(),
        JsonValueKind.String => valor.GetString(),
        JsonValueKind.Number => valor.TryGetInt64(out long inteiro) ? (object)inteiro : valor.GetDouble(),
        JsonValueKind.True => true,
        JsonValueKind.False => false,
        _ => null
    };

    private static void EscreverValor(Utf8JsonWriter escritor, object? valor)
    {
        switch (valor)
        {
            case null:
                escritor.WriteNullValue();
                break;
            case string texto:
                escritor.WriteStringValue(texto);
                break;
            case bool logico:
                escritor.WriteBooleanValue(logico);
                break;
            case long inteiro:
                escritor.WriteNumberValue(inteiro);
                break;
            case int inteiroCurto:
                escritor.WriteNumberValue(inteiroCurto);
                break;
            case double real when double.IsInteger(real) && Math.Abs(real) < 1e15:
                escritor.WriteRawValue(real.ToString("0.0", CultureInfo.InvariantCulture));
                break;
            case double real:
                escritor.WriteNumberValue(real);
                break;
            case Timestamp instante:
                escritor.WriteStringValue(instante.ToDateTimeOffset().ToString("O"));
                break;
            case IDictionary<string, object?> mapa:
                escritor.WriteStartObject();
                foreach ((string chave, object? item) in mapa)
                {
                    escritor.WritePropertyName(chave);
                    EscreverValor(escritor, item);
                }
                escritor.WriteEndObject();
                break;
            case System.Collections.IEnumerable lista:
                escritor.WriteStartArray();
                foreach (object? item in lista)
                    EscreverValor(escritor, item);
                escritor.WriteEndArray();
                break;
            default:
                escritor.WriteStringValue(valor.ToString());
                break;
        }
    }
}