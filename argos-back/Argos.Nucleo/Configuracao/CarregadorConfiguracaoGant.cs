namespace Argos.Nucleo.Configuracao;

public static class CarregadorConfiguracaoGant
{
    public static ConfiguracaoGant Carregar(CaminhosDados caminhos)
    {
        PeriodoSalvo periodo = CarregadorPeriodo.Carregar(caminhos.GantParametros);
        ConfiguracaoCategoriasSprint toggl = CarregadorConfiguracaoCategoriasSprint.Carregar(caminhos);

        return new ConfiguracaoGant
        {
            DataInicio = periodo.DataInicio,
            DataFim = periodo.DataFim,
            TagsSelecionadas = toggl.TagsDetalhadas,
            Agrupamento = toggl.Agrupamento
        };
    }
}