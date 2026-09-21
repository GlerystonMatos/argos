using System.Text;

namespace RelatorioToggl.Relatorios;

public sealed class ComparadorNomes : IComparer<string>
{
    private const char PrimeiraMarcaCombinante = '\u0300';

    private const char UltimaMarcaCombinante = '\u036F';

    private static readonly Dictionary<char, string> Substituicoes = CriarSubstituicoes();

    public static ComparadorNomes Instancia { get; } = new();

    private ComparadorNomes()
    {
    }

    public static string ChaveOrdenacao(string? nome)
    {
        if (string.IsNullOrEmpty(nome))
            return "";

        StringBuilder chave = new(nome.Length);
        foreach (char caractere in nome)
        {
            if (caractere >= PrimeiraMarcaCombinante && caractere <= UltimaMarcaCombinante)
                continue;

            if (Substituicoes.TryGetValue(caractere, out string? substituto))
                chave.Append(substituto);
            else
                chave.Append(char.ToLowerInvariant(caractere));
        }

        return chave.ToString();
    }

    public int Compare(string? x, string? y)
    {
        int porChave = string.CompareOrdinal(ChaveOrdenacao(x), ChaveOrdenacao(y));
        return porChave != 0 ? porChave : string.CompareOrdinal(x, y);
    }

    private static Dictionary<char, string> CriarSubstituicoes()
    {
        Dictionary<char, string> substituicoes = new();

        Adicionar(substituicoes, "a", "àáâãäåāăąÀÁÂÃÄÅĀĂĄ");
        Adicionar(substituicoes, "ae", "æÆ");
        Adicionar(substituicoes, "c", "çćĉċčÇĆĈĊČ");
        Adicionar(substituicoes, "d", "ďđðĎĐÐ");
        Adicionar(substituicoes, "e", "èéêëēĕėęěÈÉÊËĒĔĖĘĚ");
        Adicionar(substituicoes, "g", "ĝğġģĜĞĠĢ");
        Adicionar(substituicoes, "h", "ĥħĤĦ");
        Adicionar(substituicoes, "i", "ìíîïĩīĭįıÌÍÎÏĨĪĬĮİ");
        Adicionar(substituicoes, "j", "ĵĴ");
        Adicionar(substituicoes, "k", "ķĶ");
        Adicionar(substituicoes, "l", "ĺļľŀłĹĻĽĿŁ");
        Adicionar(substituicoes, "n", "ñńņňÑŃŅŇ");
        Adicionar(substituicoes, "o", "òóôõöøōŏőÒÓÔÕÖØŌŎŐ");
        Adicionar(substituicoes, "oe", "œŒ");
        Adicionar(substituicoes, "r", "ŕŗřŔŖŘ");
        Adicionar(substituicoes, "s", "śŝşšŚŜŞŠ");
        Adicionar(substituicoes, "ss", "ß");
        Adicionar(substituicoes, "t", "ţťŧŢŤŦ");
        Adicionar(substituicoes, "th", "þÞ");
        Adicionar(substituicoes, "u", "ùúûüũūŭůűųÙÚÛÜŨŪŬŮŰŲ");
        Adicionar(substituicoes, "w", "ŵŴ");
        Adicionar(substituicoes, "y", "ýÿŷÝŸŶ");
        Adicionar(substituicoes, "z", "źżžŹŻŽ");

        return substituicoes;
    }

    private static void Adicionar(Dictionary<char, string> substituicoes, string substituto, string caracteres)
    {
        foreach (char caractere in caracteres)
            substituicoes[caractere] = substituto;
    }
}