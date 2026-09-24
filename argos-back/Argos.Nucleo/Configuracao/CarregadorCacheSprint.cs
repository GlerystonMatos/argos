namespace Argos.Nucleo.Configuracao;

public static class CarregadorCacheSprint
{
    public static CacheConsulta? Carregar(DocumentoDados documento) => DocumentoCacheConsulta.Carregar(documento);

    public static CacheConsulta? CarregarSeExistente(DocumentoDados documento)
    {
        try
        {
            return Carregar(documento);
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            return null;
        }
    }

    public static void Salvar(DocumentoDados documento, CacheConsulta cache) => DocumentoCacheConsulta.Salvar(documento, cache);

    public static void SalvarSeConseguir(DocumentoDados documento, CacheConsulta cache)
    {
        try
        {
            Salvar(documento, cache);
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
        }
    }
}