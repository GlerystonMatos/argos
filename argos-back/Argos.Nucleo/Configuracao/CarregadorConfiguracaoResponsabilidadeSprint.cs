namespace Argos.Nucleo.Configuracao;

public static class CarregadorConfiguracaoResponsabilidadeSprint
{
    public static ConfiguracaoResponsabilidadeSprint Padrao() => new()
    {
        StatusDev = new List<string>(),
        StatusRev = new List<string>(),
        StatusQa = new List<string>()
    };

    public static ConfiguracaoResponsabilidadeSprint Carregar(DocumentoDados documentoStatus)
    {
        EstadoStatusJira estado = ArquivoStatusJira.Carregar(documentoStatus);
        return new ConfiguracaoResponsabilidadeSprint
        {
            StatusDev = estado.Dev,
            StatusRev = estado.Rev,
            StatusQa = estado.Qa
        };
    }

    public static void Salvar(DocumentoDados documentoStatus, ConfiguracaoResponsabilidadeSprint configuracao)
    {
        ArquivoStatusJira.Atualizar(documentoStatus, estado =>
        {
            estado.Dev = configuracao.StatusDev;
            estado.Rev = configuracao.StatusRev;
            estado.Qa = configuracao.StatusQa;
        });
    }
}