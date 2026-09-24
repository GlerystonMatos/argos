using System.Text.Json.Nodes;

namespace Argos.Nucleo.Configuracao;

public static class CarregadorSprints
{
    private const string PropriedadeSprints = "sprints";

    public static List<DadosSprint> Carregar(DocumentoDados documento)
    {
        JsonObject? conteudo = DocumentoJson.Ler(documento);
        return conteudo is null
            ? new List<DadosSprint>()
            : DocumentoJson.ObterLista<DadosSprint>(conteudo, PropriedadeSprints);
    }

    public static void Salvar(DocumentoDados documento, List<DadosSprint> sprints) =>
        DocumentoJson.Gravar(documento, MontarDocumento(sprints));

    internal static JsonObject MontarDocumento(List<DadosSprint> sprints) =>
        new() { [PropriedadeSprints] = DocumentoJson.ParaNo(sprints) };
}