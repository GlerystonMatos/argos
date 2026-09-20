namespace RelatorioToggl.Api.Endpoints;

public static class NormalizacaoListas
{
    public static List<string> Normalizar(List<string>? valores) =>
        (valores ?? new List<string>())
            .Where(valor => !string.IsNullOrWhiteSpace(valor))
            .Select(valor => valor.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
}