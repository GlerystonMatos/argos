using Argos.Nucleo.Configuracao;
using System.Text.Json.Nodes;

namespace Argos.Nucleo.Jira;

public static class CarregadorCacheJiraSprint
{
    private const string PropriedadeIssues = "issues";

    public static List<IssueJira>? ObterParaSprint(DocumentoDados documento)
    {
        JsonObject? conteudo = DocumentoJson.Ler(documento);
        return conteudo is null ? null : DocumentoJson.ObterLista<IssueJira>(conteudo, PropriedadeIssues);
    }

    public static void SalvarParaSprint(DocumentoDados documento, List<IssueJira> issues) =>
        DocumentoJson.Gravar(documento, MontarDocumento(issues));

    internal static JsonObject MontarDocumento(List<IssueJira> issues) =>
        new() { [PropriedadeIssues] = DocumentoJson.ParaNo(issues) };
}