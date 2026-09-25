namespace Argos.Nucleo.Configuracao;

public static class TiposQuadroJira
{
    public static readonly IReadOnlyList<TipoQuadroJira> Todos = new[] { TipoQuadroJira.Dev, TipoQuadroJira.Analise };

    public static bool TentarLer(string? texto, out TipoQuadroJira tipo)
    {
        tipo = TipoQuadroJira.Dev;
        if (string.IsNullOrWhiteSpace(texto))
            return true;

        return Enum.TryParse(texto.Trim(), ignoreCase: true, out tipo) && Enum.IsDefined(tipo);
    }

    public static string Rotulo(TipoQuadroJira tipo) => tipo == TipoQuadroJira.Dev ? "DEV" : "Análise";
}