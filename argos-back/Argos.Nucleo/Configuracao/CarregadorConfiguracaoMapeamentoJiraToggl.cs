using System.Text.Json.Nodes;

namespace Argos.Nucleo.Configuracao;

public static class CarregadorConfiguracaoMapeamentoJiraToggl
{
    private const string PropriedadeUsuarios = "usuarios";

    public static ConfiguracaoMapeamentoJiraToggl Padrao() => new();

    public static ConfiguracaoMapeamentoJiraToggl Carregar(DocumentoDados documento)
    {
        ConfiguracaoMapeamentoJiraToggl configuracao = Padrao();

        JsonObject? conteudo = DocumentoJson.Ler(documento);
        if (conteudo is null)
            return configuracao;

        foreach (EntradaUsuario entrada in DocumentoJson.ObterLista<EntradaUsuario>(conteudo, PropriedadeUsuarios))
        {
            string usuarioJira = entrada.DisplayName?.Trim() ?? "";
            if (usuarioJira.Length == 0)
                continue;

            configuracao.Mapeamento[usuarioJira] = new EntradaMapeamentoJiraToggl
            {
                ChaveToggl = entrada.ChaveToggl,
                Sigla = entrada.Sigla,
                Cor = entrada.Cor
            };
        }

        return configuracao;
    }

    public static void Salvar(DocumentoDados documento, ConfiguracaoMapeamentoJiraToggl configuracao) =>
        DocumentoJson.Gravar(documento, MontarDocumento(configuracao));

    internal static JsonObject MontarDocumento(ConfiguracaoMapeamentoJiraToggl configuracao)
    {
        List<EntradaUsuario> usuarios = new();

        foreach ((string usuarioJira, EntradaMapeamentoJiraToggl entrada) in configuracao.Mapeamento)
        {
            string nome = usuarioJira.Trim();
            if (nome.Length == 0)
                continue;

            usuarios.Add(new EntradaUsuario(nome, entrada.ChaveToggl, entrada.Sigla, entrada.Cor));
        }

        return new JsonObject { [PropriedadeUsuarios] = DocumentoJson.ParaNo(usuarios) };
    }

    internal sealed record EntradaUsuario(string DisplayName, string? ChaveToggl, string? Sigla, string? Cor);
}