using System.Text.Json.Nodes;

namespace Argos.Nucleo.Configuracao;

public static class CarregadorConfiguracaoCoresJira
{
    private const string PropriedadeItens = "itens";

    private const string PropriedadeCor = "cor";

    internal const string PropriedadeNome = "nome";

    internal const string PropriedadeChave = "chave";

    public static ConfiguracaoCoresJira Padrao() => new();

    public static ConfiguracaoCoresJira Carregar(CaminhosDados caminhos) => new()
    {
        CoresStatus = ArquivoStatusJira.Carregar(caminhos.JiraStatus).Cores,
        CoresPrioridade = CarregarCores(caminhos.JiraPrioridades, PropriedadeNome),
        CoresColuna = CarregarCores(caminhos.JiraColunas, PropriedadeNome),
        CoresTime = CarregarCores(caminhos.JiraTimes, PropriedadeNome),
        CoresEpico = CarregarCores(caminhos.JiraEpicos, PropriedadeChave)
    };

    public static void Salvar(CaminhosDados caminhos, ConfiguracaoCoresJira configuracao)
    {
        ArquivoStatusJira.Atualizar(caminhos.JiraStatus, estado =>
        {
            estado.Cores = new Dictionary<string, string>(configuracao.CoresStatus, StringComparer.OrdinalIgnoreCase);
        });

        DocumentoJson.Gravar(caminhos.JiraPrioridades, MontarDocumento(configuracao.CoresPrioridade, PropriedadeNome));
        DocumentoJson.Gravar(caminhos.JiraColunas, MontarDocumento(configuracao.CoresColuna, PropriedadeNome));
        DocumentoJson.Gravar(caminhos.JiraTimes, MontarDocumento(configuracao.CoresTime, PropriedadeNome));
        DocumentoJson.Gravar(caminhos.JiraEpicos, MontarDocumento(configuracao.CoresEpico, PropriedadeChave));
    }

    internal static JsonObject MontarDocumento(Dictionary<string, string> cores, string propriedadeNome)
    {
        JsonArray itens = new();

        foreach ((string chave, string cor) in cores)
        {
            string nome = chave.Trim();
            if (nome.Length == 0)
                continue;

            itens.Add(new JsonObject { [propriedadeNome] = nome, [PropriedadeCor] = cor });
        }

        return new JsonObject { [PropriedadeItens] = itens };
    }

    private static Dictionary<string, string> CarregarCores(DocumentoDados documento, string propriedadeNome)
    {
        Dictionary<string, string> cores = new(StringComparer.OrdinalIgnoreCase);

        JsonObject? conteudo = DocumentoJson.Ler(documento);
        if (conteudo is null)
            return cores;

        foreach (JsonObject item in DocumentoJson.Objetos(conteudo, PropriedadeItens))
        {
            string nome = DocumentoJson.ObterTexto(item, propriedadeNome, "").Trim();
            string? cor = DocumentoJson.ObterTextoOuNulo(item, PropriedadeCor);
            if (nome.Length > 0 && cor is not null)
                cores[nome] = cor;
        }

        return cores;
    }
}