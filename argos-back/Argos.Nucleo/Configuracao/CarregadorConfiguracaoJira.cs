using System.Text.Json.Nodes;

namespace Argos.Nucleo.Configuracao;

public static class CarregadorConfiguracaoJira
{
    private const string PropriedadeUrlDominio = "urlDominio";

    private const string PropriedadeEmail = "email";

    private const string PropriedadeApiToken = "apiToken";

    private const string PropriedadeQuadroId = "quadroId";

    private const string PropriedadeQuadroNome = "quadroNome";

    private const string PropriedadeCampos = "campos";

    private const string PropriedadeJanelaAlerta = "janelaAlertaPrevisaoLiberacaoDias";

    internal const string CampoEstimativaDesenvolvimento = "EstimativaDesenvolvimento";

    internal const string CampoEstimativaRevisao = "EstimativaRevisao";

    internal const string CampoEstimativaTestes = "EstimativaTestes";

    internal const string CampoRevisadoPor = "RevisadoPor";

    internal const string CampoAnalisadoPor = "AnalisadoPor";

    internal const string CampoTime = "Time";

    internal const string CampoPrevisaoLiberacao = "PrevisaoLiberacao";

    internal const int JanelaAlertaPrevisaoLiberacaoPadraoDias = 5;

    public static ConfiguracaoJira Carregar(CaminhosDados caminhos)
    {
        ConfiguracaoJira configuracao = new();

        JsonObject? conexao = DocumentoJson.Ler(caminhos.JiraConexao);
        if (conexao is not null)
        {
            configuracao.UrlDominio = DocumentoJson.ObterTexto(conexao, PropriedadeUrlDominio, "");
            configuracao.Email = DocumentoJson.ObterTexto(conexao, PropriedadeEmail, "");
            configuracao.ApiToken = CriptografiaToken.Descriptografar(DocumentoJson.ObterTexto(conexao, PropriedadeApiToken, ""));
            configuracao.QuadroId = DocumentoJson.Obter<long?>(conexao, PropriedadeQuadroId);
            configuracao.QuadroNome = DocumentoJson.ObterTexto(conexao, PropriedadeQuadroNome, "");
        }

        JsonObject? documentoCampos = DocumentoJson.Ler(caminhos.JiraCampos);
        if (documentoCampos is not null)
        {
            List<EntradaCampo> campos = DocumentoJson.ObterLista<EntradaCampo>(documentoCampos, PropriedadeCampos);
            (configuracao.CampoEstimativaDesenvolvimentoId, configuracao.CampoEstimativaDesenvolvimentoNome) = LerCampo(campos, CampoEstimativaDesenvolvimento);
            (configuracao.CampoEstimativaRevisaoId, configuracao.CampoEstimativaRevisaoNome) = LerCampo(campos, CampoEstimativaRevisao);
            (configuracao.CampoEstimativaTestesId, configuracao.CampoEstimativaTestesNome) = LerCampo(campos, CampoEstimativaTestes);
            (configuracao.CampoRevisadoPorId, configuracao.CampoRevisadoPorNome) = LerCampo(campos, CampoRevisadoPor);
            (configuracao.CampoAnalisadoPorId, configuracao.CampoAnalisadoPorNome) = LerCampo(campos, CampoAnalisadoPor);
            (configuracao.CampoTimeId, configuracao.CampoTimeNome) = LerCampo(campos, CampoTime);
            (configuracao.CampoPrevisaoLiberacaoId, configuracao.CampoPrevisaoLiberacaoNome) = LerCampo(campos, CampoPrevisaoLiberacao);
            int janela = DocumentoJson.Obter<int>(documentoCampos, PropriedadeJanelaAlerta);
            configuracao.JanelaAlertaPrevisaoLiberacaoDias = janela > 0 ? janela : JanelaAlertaPrevisaoLiberacaoPadraoDias;
        }

        return configuracao;
    }

    public static void Salvar(CaminhosDados caminhos, ConfiguracaoJira configuracao)
    {
        DocumentoJson.Gravar(caminhos.JiraConexao, MontarDocumentoConexao(configuracao, CriptografiaToken.Criptografar(configuracao.ApiToken)));
        DocumentoJson.Gravar(caminhos.JiraCampos, MontarDocumentoCampos(configuracao));
    }

    internal static JsonObject MontarDocumentoConexao(ConfiguracaoJira configuracao, string apiTokenArmazenado)
    {
        JsonObject conexao = new()
        {
            [PropriedadeUrlDominio] = configuracao.UrlDominio,
            [PropriedadeEmail] = configuracao.Email,
            [PropriedadeApiToken] = apiTokenArmazenado
        };

        if (configuracao.QuadroId is not null)
            conexao[PropriedadeQuadroId] = configuracao.QuadroId.Value;

        conexao[PropriedadeQuadroNome] = configuracao.QuadroNome;
        return conexao;
    }

    internal static JsonObject MontarDocumentoCampos(ConfiguracaoJira configuracao)
    {
        List<EntradaCampo> campos = new()
        {
            new EntradaCampo(CampoEstimativaDesenvolvimento, configuracao.CampoEstimativaDesenvolvimentoId, configuracao.CampoEstimativaDesenvolvimentoNome),
            new EntradaCampo(CampoEstimativaRevisao, configuracao.CampoEstimativaRevisaoId, configuracao.CampoEstimativaRevisaoNome),
            new EntradaCampo(CampoEstimativaTestes, configuracao.CampoEstimativaTestesId, configuracao.CampoEstimativaTestesNome),
            new EntradaCampo(CampoRevisadoPor, configuracao.CampoRevisadoPorId, configuracao.CampoRevisadoPorNome),
            new EntradaCampo(CampoAnalisadoPor, configuracao.CampoAnalisadoPorId, configuracao.CampoAnalisadoPorNome),
            new EntradaCampo(CampoTime, configuracao.CampoTimeId, configuracao.CampoTimeNome),
            new EntradaCampo(CampoPrevisaoLiberacao, configuracao.CampoPrevisaoLiberacaoId, configuracao.CampoPrevisaoLiberacaoNome)
        };

        return new JsonObject
        {
            [PropriedadeCampos] = DocumentoJson.ParaNo(campos),
            [PropriedadeJanelaAlerta] = configuracao.JanelaAlertaPrevisaoLiberacaoDias
        };
    }

    private static (string Id, string Nome) LerCampo(List<EntradaCampo> campos, string tipo)
    {
        EntradaCampo? campo = campos.FirstOrDefault(c => string.Equals(c.Tipo, tipo, StringComparison.OrdinalIgnoreCase));
        return campo is null ? ("", "") : (campo.Id ?? "", campo.Nome ?? "");
    }

    internal sealed record EntradaCampo(string Tipo, string Id, string Nome);
}