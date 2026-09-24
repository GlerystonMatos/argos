namespace Argos.Nucleo.Configuracao;

public static class CarregadorConfiguracaoStatusFinalSprint
{
    public static ConfiguracaoStatusFinalSprint Padrao() => new()
    {
        StatusConcluido = new List<string>(),
        StatusIgnorado = new List<string>()
    };

    public static ConfiguracaoStatusFinalSprint Carregar(DocumentoDados documentoStatus)
    {
        EstadoStatusJira estado = ArquivoStatusJira.Carregar(documentoStatus);
        return new ConfiguracaoStatusFinalSprint
        {
            StatusConcluido = estado.Concluido,
            StatusIgnorado = estado.Ignorado
        };
    }

    public static void Salvar(DocumentoDados documentoStatus, ConfiguracaoStatusFinalSprint configuracao)
    {
        ArquivoStatusJira.Atualizar(documentoStatus, estado =>
        {
            estado.Concluido = configuracao.StatusConcluido;
            estado.Ignorado = configuracao.StatusIgnorado;
        });
    }
}