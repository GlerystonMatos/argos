using System.Text.Json.Nodes;

namespace Argos.Nucleo.Configuracao;

internal static class ArquivoStatusJira
{
    private const string PropriedadeStatus = "status";

    internal const string ResponsavelDev = "Dev";

    internal const string ResponsavelRev = "Rev";

    internal const string ResponsavelQa = "Qa";

    internal const string FinalConcluido = "Concluido";

    internal const string FinalIgnorado = "Ignorado";

    private static readonly object Trava = new();

    public static void Atualizar(DocumentoDados documento, Action<EstadoStatusJira> alterar)
    {
        lock (Trava)
        {
            EstadoStatusJira estado = Carregar(documento);
            alterar(estado);
            Salvar(documento, estado);
        }
    }

    public static EstadoStatusJira Carregar(DocumentoDados documento)
    {
        lock (Trava)
        {
            return CarregarSemTrava(documento);
        }
    }

    public static void Salvar(DocumentoDados documento, EstadoStatusJira estado)
    {
        lock (Trava)
        {
            DocumentoJson.Gravar(documento, MontarDocumento(estado));
        }
    }

    internal static void AdicionarStatus(EstadoStatusJira estado, string status, string? cor, List<string> responsaveis, string? final)
    {
        if (cor is not null)
            estado.Cores[status] = cor;

        if (MesclaOrdenada.Contem(responsaveis, ResponsavelDev))
            estado.Dev.Add(status);
        if (MesclaOrdenada.Contem(responsaveis, ResponsavelRev))
            estado.Rev.Add(status);
        if (MesclaOrdenada.Contem(responsaveis, ResponsavelQa))
            estado.Qa.Add(status);

        if (string.Equals(final, FinalConcluido, StringComparison.OrdinalIgnoreCase))
            estado.Concluido.Add(status);
        else if (string.Equals(final, FinalIgnorado, StringComparison.OrdinalIgnoreCase))
            estado.Ignorado.Add(status);
    }

    internal static JsonObject MontarDocumento(EstadoStatusJira estado)
    {
        List<EntradaStatus> entradas = new();

        foreach (string status in MesclaOrdenada.Unir(estado.Dev, estado.Rev, estado.Qa, estado.Concluido, estado.Ignorado, estado.Cores.Keys))
        {
            List<string> responsaveis = new();
            if (MesclaOrdenada.Contem(estado.Dev, status))
                responsaveis.Add(ResponsavelDev);
            if (MesclaOrdenada.Contem(estado.Rev, status))
                responsaveis.Add(ResponsavelRev);
            if (MesclaOrdenada.Contem(estado.Qa, status))
                responsaveis.Add(ResponsavelQa);

            string? final = null;
            if (MesclaOrdenada.Contem(estado.Concluido, status))
                final = FinalConcluido;
            else if (MesclaOrdenada.Contem(estado.Ignorado, status))
                final = FinalIgnorado;

            entradas.Add(new EntradaStatus(status, estado.Cores.TryGetValue(status, out string? cor) ? cor : null, responsaveis, final));
        }

        return new JsonObject { [PropriedadeStatus] = DocumentoJson.ParaNo(entradas) };
    }

    private static EstadoStatusJira CarregarSemTrava(DocumentoDados documento)
    {
        EstadoStatusJira estado = new();

        JsonObject? conteudo = DocumentoJson.Ler(documento);
        if (conteudo is null)
            return estado;

        foreach (EntradaStatus entrada in DocumentoJson.ObterLista<EntradaStatus>(conteudo, PropriedadeStatus))
        {
            string status = entrada.Nome?.Trim() ?? "";
            if (status.Length == 0)
                continue;

            AdicionarStatus(estado, status, entrada.Cor, entrada.Responsaveis ?? new List<string>(), entrada.Final);
        }

        return estado;
    }

    internal sealed record EntradaStatus(string Nome, string? Cor, List<string> Responsaveis, string? Final);
}