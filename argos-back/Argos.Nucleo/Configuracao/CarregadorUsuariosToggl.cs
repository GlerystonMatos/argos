using System.Text.Json.Nodes;

namespace Argos.Nucleo.Configuracao;

public static class CarregadorUsuariosToggl
{
    private const string PropriedadeUsuarios = "usuarios";

    public static List<ConfiguracaoUsuarioToggl> Carregar(DocumentoDados documento)
    {
        JsonObject? conteudo = DocumentoJson.Ler(documento);
        if (conteudo is null)
            return new List<ConfiguracaoUsuarioToggl>();

        List<ConfiguracaoUsuarioToggl> usuarios = DocumentoJson.ObterLista<ConfiguracaoUsuarioToggl>(conteudo, PropriedadeUsuarios);
        foreach (ConfiguracaoUsuarioToggl usuario in usuarios)
            usuario.TokenApi = CriptografiaToken.Descriptografar(usuario.TokenApi ?? "");

        return usuarios;
    }

    public static void Salvar(DocumentoDados documento, List<ConfiguracaoUsuarioToggl> usuarios)
    {
        List<ConfiguracaoUsuarioToggl> protegidos = usuarios.Select(usuario => new ConfiguracaoUsuarioToggl
        {
            Chave = usuario.Chave,
            NomeExibicao = usuario.NomeExibicao,
            TokenApi = CriptografiaToken.Criptografar(usuario.TokenApi),
            Sigla = usuario.Sigla,
            Cor = usuario.Cor,
            Selecionado = usuario.Selecionado,
            Administrador = usuario.Administrador
        }).ToList();

        DocumentoJson.Gravar(documento, MontarDocumento(protegidos));
    }

    internal static JsonObject MontarDocumento(List<ConfiguracaoUsuarioToggl> usuariosComTokenArmazenado) =>
        new() { [PropriedadeUsuarios] = DocumentoJson.ParaNo(usuariosComTokenArmazenado) };
}