namespace Argos.Nucleo.Configuracao;

public static class CarregadorConfiguracaoGantIni
{
    public static ConfiguracaoGant Carregar(CaminhosDados caminhos)
    {
        PeriodoSalvo periodo = CarregadorPeriodoIni.Carregar(caminhos.GantParametros);
        ConfiguracaoCategoriasSprint toggl = CarregadorConfiguracaoCategoriasSprintIni.Carregar(caminhos);

        return new ConfiguracaoGant
        {
            DataInicio = periodo.DataInicio,
            DataFim = periodo.DataFim,
            TagsSelecionadas = toggl.TagsDetalhadas,
            Agrupamento = toggl.Agrupamento
        };
    }
}