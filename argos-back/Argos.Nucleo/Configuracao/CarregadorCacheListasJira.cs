using System.Text.Json.Nodes;

namespace Argos.Nucleo.Configuracao;

public static class CarregadorCacheListasJira
{
    public static CacheListaJira? Carregar(DocumentoDados documento)
    {
        JsonObject? conteudo = DocumentoJson.Ler(documento);
        if (conteudo is null)
            return null;

        return new CacheListaJira
        {
            Nomes = DocumentoJson.ObterLista<string>(conteudo, "nomes"),
            AtualizadoEm = DocumentoJson.ObterTexto(conteudo, "atualizadoEm", "")
        };
    }

    public static void Salvar(DocumentoDados documento, CacheListaJira cache) =>
        DocumentoJson.Gravar(documento, MontarDocumento(cache));

    internal static JsonObject MontarDocumento(CacheListaJira cache) =>
        DocumentoJson.ParaNo(cache) as JsonObject ?? new JsonObject();
}