namespace Argos.Nucleo.Configuracao;

public static class CarregadorCache
{
    public static CacheConsulta? Carregar(DocumentoDados documento) => DocumentoCacheConsulta.Carregar(documento);

    public static void Salvar(DocumentoDados documento, CacheConsulta cache) => DocumentoCacheConsulta.Salvar(documento, cache);
}