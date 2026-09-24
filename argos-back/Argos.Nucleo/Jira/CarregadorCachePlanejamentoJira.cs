using Argos.Nucleo.Configuracao;
using System.Text.Json.Nodes;

namespace Argos.Nucleo.Jira;

public static class CarregadorCachePlanejamentoJira
{
    public static CachePlanejamentoJira? Ler(DocumentoDados documento)
    {
        JsonObject? conteudo = DocumentoJson.Ler(documento);
        if (conteudo is null || DocumentoJson.Obter<long?>(conteudo, "quadroId") is null)
            return null;

        CachePlanejamentoJira? cache = DocumentoJson.Converter<CachePlanejamentoJira>(conteudo);
        if (cache is null || cache.Colunas is null || cache.Cartoes is null)
            return null;

        return cache with
        {
            QuadroNome = cache.QuadroNome ?? "",
            AtualizadoEm = cache.AtualizadoEm ?? ""
        };
    }

    public static void Salvar(DocumentoDados documento, CachePlanejamentoJira cache) =>
        DocumentoJson.Gravar(documento, MontarDocumento(cache));

    internal static JsonObject MontarDocumento(CachePlanejamentoJira cache) =>
        DocumentoJson.ParaNo(cache) as JsonObject ?? new JsonObject();
}