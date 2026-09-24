using System.Text.Json.Nodes;

namespace Argos.Nucleo.Configuracao;

public static class CarregadorConfiguracaoQuadroPlanejamento
{
    private const string PropriedadeColunasOcultas = "colunasOcultas";

    public static ConfiguracaoQuadroPlanejamento Padrao() => new();

    public static ConfiguracaoQuadroPlanejamento Carregar(DocumentoDados documento)
    {
        JsonObject? conteudo = DocumentoJson.Ler(documento);
        if (conteudo is null)
            return Padrao();

        return new ConfiguracaoQuadroPlanejamento
        {
            ColunasOcultas = DocumentoJson.ObterLista<string>(conteudo, PropriedadeColunasOcultas)
        };
    }

    public static void Salvar(DocumentoDados documento, ConfiguracaoQuadroPlanejamento configuracao) =>
        DocumentoJson.Gravar(documento, MontarDocumento(configuracao));

    internal static JsonObject MontarDocumento(ConfiguracaoQuadroPlanejamento configuracao) =>
        new() { [PropriedadeColunasOcultas] = DocumentoJson.ParaNo(configuracao.ColunasOcultas) };
}