using System.Text.Json.Nodes;

namespace Argos.Nucleo.Configuracao;

public static class CarregadorConfiguracaoQuadroPlanejamento
{
    internal const string PropriedadeColunasOcultasDev = "colunasOcultasDev";

    private const string PropriedadeColunasOcultasAnalise = "colunasOcultasAnalise";

    public static ConfiguracaoQuadroPlanejamento Padrao() => new();

    public static ConfiguracaoQuadroPlanejamento Carregar(DocumentoDados documento)
    {
        JsonObject? conteudo = DocumentoJson.Ler(documento);
        if (conteudo is null)
            return Padrao();

        return new ConfiguracaoQuadroPlanejamento
        {
            ColunasOcultasDev = DocumentoJson.ObterLista<string>(conteudo, PropriedadeColunasOcultasDev),
            ColunasOcultasAnalise = DocumentoJson.ObterLista<string>(conteudo, PropriedadeColunasOcultasAnalise)
        };
    }

    public static void Salvar(DocumentoDados documento, ConfiguracaoQuadroPlanejamento configuracao) =>
        DocumentoJson.Gravar(documento, MontarDocumento(configuracao));

    internal static JsonObject MontarDocumento(ConfiguracaoQuadroPlanejamento configuracao) => new()
    {
        [PropriedadeColunasOcultasDev] = DocumentoJson.ParaNo(configuracao.ColunasOcultasDev),
        [PropriedadeColunasOcultasAnalise] = DocumentoJson.ParaNo(configuracao.ColunasOcultasAnalise)
    };
}