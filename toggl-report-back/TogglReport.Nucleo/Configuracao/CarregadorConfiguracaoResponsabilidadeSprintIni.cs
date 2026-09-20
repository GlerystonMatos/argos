namespace RelatorioToggl.Configuracao;

public static class CarregadorConfiguracaoResponsabilidadeSprintIni
{
    public static ConfiguracaoResponsabilidadeSprint Padrao() => new()
    {
        StatusDev = new List<string>(),
        StatusRev = new List<string>(),
        StatusQa = new List<string>()
    };

    public static ConfiguracaoResponsabilidadeSprint Carregar(string caminhoStatus)
    {
        EstadoStatusJira estado = ArquivoStatusJiraIni.Carregar(caminhoStatus);
        return new ConfiguracaoResponsabilidadeSprint
        {
            StatusDev = estado.Dev,
            StatusRev = estado.Rev,
            StatusQa = estado.Qa
        };
    }

    public static void Salvar(string caminhoStatus, ConfiguracaoResponsabilidadeSprint configuracao)
    {
        ArquivoStatusJiraIni.Atualizar(caminhoStatus, estado =>
        {
            estado.Dev = configuracao.StatusDev;
            estado.Rev = configuracao.StatusRev;
            estado.Qa = configuracao.StatusQa;
        });
    }
}