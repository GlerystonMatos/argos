using Argos.Nucleo.Configuracao;
using System.Text.Json.Nodes;

namespace Argos.Nucleo.Jira;

public static class CarregadorCacheQuadrosJira
{
    public static CacheQuadrosJira? Carregar(DocumentoDados documento)
    {
        JsonObject? conteudo = DocumentoJson.Ler(documento);
        if (conteudo is null)
            return null;

        return new CacheQuadrosJira
        {
            Quadros = DocumentoJson.ObterLista<QuadroJira>(conteudo, "quadros"),
            AtualizadoEm = DocumentoJson.ObterTexto(conteudo, "atualizadoEm", "")
        };
    }

    public static void Salvar(DocumentoDados documento, CacheQuadrosJira cache) =>
        DocumentoJson.Gravar(documento, MontarDocumento(cache));

    internal static JsonObject MontarDocumento(CacheQuadrosJira cache) =>
        DocumentoJson.ParaNo(cache) as JsonObject ?? new JsonObject();
}