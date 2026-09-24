namespace Argos.Nucleo.Configuracao;

public static class CarregadorConfiguracao
{
    public static ConfiguracaoApp Carregar(CaminhosDados caminhos)
    {
        PeriodoSalvo periodo = CarregadorPeriodo.Carregar(caminhos.RelatorioParametros);
        ConfiguracaoCategoriasSprint toggl = CarregadorConfiguracaoCategoriasSprint.Carregar(caminhos);

        return new ConfiguracaoApp
        {
            DataInicioAnterior = periodo.DataInicio,
            DataFimAnterior = periodo.DataFim,
            AgrupamentoPadrao = toggl.Agrupamento,
            TagsDetalhadas = toggl.TagsDetalhadas,
            Usuarios = CarregadorUsuariosToggl.Carregar(caminhos.Usuarios)
        };
    }
}