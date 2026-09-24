using System.Text;

namespace Argos.Nucleo.Relatorios;

public static class NormalizacaoBusca
{
    private const string HifensIgnorados = "-\u2010\u2011\u2012\u2013\u2014\u2015\u2212";

    public static string Normalizar(string texto)
    {
        StringBuilder resultado = new(texto.Length);
        foreach (char caractere in texto)
        {
            if (char.IsWhiteSpace(caractere) || HifensIgnorados.Contains(caractere))
                continue;

            resultado.Append(char.ToLowerInvariant(caractere));
        }

        return resultado.ToString();
    }

    public static bool Contem(string? texto, string? termo)
    {
        string termoNormalizado = Normalizar(termo ?? string.Empty);
        if (termoNormalizado.Length == 0)
            return true;

        return Normalizar(texto ?? string.Empty).Contains(termoNormalizado, StringComparison.Ordinal);
    }
}