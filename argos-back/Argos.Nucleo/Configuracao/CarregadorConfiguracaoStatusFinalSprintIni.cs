namespace Argos.Nucleo.Configuracao;

public static class CarregadorConfiguracaoStatusFinalSprintIni
{
    public static ConfiguracaoStatusFinalSprint Padrao() => new()
    {
        StatusConcluido = new List<string>(),
        StatusIgnorado = new List<string>()
    };

    public static ConfiguracaoStatusFinalSprint Carregar(string caminhoStatus)
    {
        EstadoStatusJira estado = ArquivoStatusJiraIni.Carregar(caminhoStatus);
        return new ConfiguracaoStatusFinalSprint
        {
            StatusConcluido = estado.Concluido,
            StatusIgnorado = estado.Ignorado
        };
    }

    public static void Salvar(string caminhoStatus, ConfiguracaoStatusFinalSprint configuracao)
    {
        ArquivoStatusJiraIni.Atualizar(caminhoStatus, estado =>
        {
            estado.Concluido = configuracao.StatusConcluido;
            estado.Ignorado = configuracao.StatusIgnorado;
        });
    }
}