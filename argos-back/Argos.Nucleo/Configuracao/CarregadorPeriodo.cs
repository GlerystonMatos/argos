using System.Text.Json.Nodes;

namespace Argos.Nucleo.Configuracao;

public static class CarregadorPeriodo
{
    private const string PropriedadeDataInicio = "dataInicio";

    private const string PropriedadeDataFim = "dataFim";

    public static PeriodoSalvo Carregar(DocumentoDados documento)
    {
        PeriodoSalvo periodo = new();

        JsonObject? conteudo = DocumentoJson.Ler(documento);
        if (conteudo is not null)
        {
            periodo.DataInicio = DocumentoJson.ObterTextoOuNulo(conteudo, PropriedadeDataInicio);
            periodo.DataFim = DocumentoJson.ObterTextoOuNulo(conteudo, PropriedadeDataFim);
        }

        return periodo;
    }

    public static void Salvar(DocumentoDados documento, PeriodoSalvo periodo) =>
        DocumentoJson.Gravar(documento, MontarDocumento(periodo));

    internal static JsonObject MontarDocumento(PeriodoSalvo periodo) => new()
    {
        [PropriedadeDataInicio] = periodo.DataInicio ?? "",
        [PropriedadeDataFim] = periodo.DataFim ?? ""
    };
}