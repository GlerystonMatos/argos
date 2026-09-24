using System.Text.Json.Nodes;

namespace Argos.Nucleo.Configuracao;

public static class CarregadorCacheTagsToggl
{
    public static CacheTagsToggl? Carregar(DocumentoDados documento)
    {
        JsonObject? conteudo = DocumentoJson.Ler(documento);
        if (conteudo is null)
            return null;

        return new CacheTagsToggl
        {
            Tags = DocumentoJson.ObterLista<string>(conteudo, "tags"),
            AtualizadoEm = DocumentoJson.ObterTexto(conteudo, "atualizadoEm", "")
        };
    }

    public static void Salvar(DocumentoDados documento, CacheTagsToggl cache) =>
        DocumentoJson.Gravar(documento, MontarDocumento(cache));

    internal static JsonObject MontarDocumento(CacheTagsToggl cache) =>
        DocumentoJson.ParaNo(cache) as JsonObject ?? new JsonObject();
}