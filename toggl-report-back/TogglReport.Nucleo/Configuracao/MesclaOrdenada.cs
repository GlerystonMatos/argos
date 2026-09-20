namespace RelatorioToggl.Configuracao;

internal static class MesclaOrdenada
{
    public static List<string> Unir(params IEnumerable<string>[] listas)
    {
        List<string> resultado = new();
        HashSet<string> vistos = new(StringComparer.OrdinalIgnoreCase);

        foreach (IEnumerable<string> lista in listas)
        {
            foreach (string item in lista)
            {
                string nome = item.Trim();
                if (nome.Length > 0 && vistos.Add(nome))
                    resultado.Add(nome);
            }
        }

        return resultado;
    }

    public static bool Contem(IEnumerable<string> lista, string nome) =>
        lista.Any(item => item.Trim().Equals(nome, StringComparison.OrdinalIgnoreCase));
}