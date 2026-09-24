using System.Text.Json.Nodes;

namespace Argos.Nucleo.Configuracao;

internal static class DocumentoCacheConsulta
{
    public static CacheConsulta? Carregar(DocumentoDados documento)
    {
        JsonObject? conteudo = DocumentoJson.Ler(documento);
        if (conteudo is null)
            return null;

        CacheConsulta cache = new()
        {
            DataInicio = DocumentoJson.ObterTexto(conteudo, "dataInicio", ""),
            DataFim = DocumentoJson.ObterTexto(conteudo, "dataFim", "")
        };

        foreach (UsuarioTogglCacheado usuario in DocumentoJson.ObterLista<UsuarioTogglCacheado>(conteudo, "usuarios"))
        {
            usuario.TokenApi = CriptografiaToken.Descriptografar(usuario.TokenApi ?? "");
            usuario.Registros ??= new();
            if (string.IsNullOrEmpty(usuario.NomeExibicao))
                usuario.NomeExibicao = usuario.Chave;
            cache.Usuarios.Add(usuario);
        }

        return cache;
    }

    public static void Salvar(DocumentoDados documento, CacheConsulta cache)
    {
        CacheConsulta protegido = new()
        {
            DataInicio = cache.DataInicio,
            DataFim = cache.DataFim,
            Usuarios = cache.Usuarios.Select(usuario => new UsuarioTogglCacheado
            {
                Chave = usuario.Chave,
                NomeExibicao = usuario.NomeExibicao,
                TokenApi = CriptografiaToken.Criptografar(usuario.TokenApi),
                Registros = usuario.Registros
            }).ToList()
        };

        DocumentoJson.Gravar(documento, MontarDocumento(protegido));
    }

    public static JsonObject MontarDocumento(CacheConsulta cacheComTokenArmazenado) =>
        DocumentoJson.ParaNo(cacheComTokenArmazenado) as JsonObject ?? new JsonObject();
}