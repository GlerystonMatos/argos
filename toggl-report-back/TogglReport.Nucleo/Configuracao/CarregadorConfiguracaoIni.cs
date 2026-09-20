namespace RelatorioToggl.Configuracao;

public static class CarregadorConfiguracaoIni
{
    public static ConfiguracaoApp Carregar(CaminhosDados caminhos)
    {
        PeriodoSalvo periodo = CarregadorPeriodoIni.Carregar(caminhos.RelatorioParametros);
        ConfiguracaoCategoriasSprint toggl = CarregadorConfiguracaoCategoriasSprintIni.Carregar(caminhos);

        return new ConfiguracaoApp
        {
            DataInicioAnterior = periodo.DataInicio,
            DataFimAnterior = periodo.DataFim,
            AgrupamentoPadrao = toggl.Agrupamento,
            TagsDetalhadas = toggl.TagsDetalhadas,
            Usuarios = CarregadorUsuariosTogglIni.Carregar(caminhos.Usuarios)
        };
    }
}