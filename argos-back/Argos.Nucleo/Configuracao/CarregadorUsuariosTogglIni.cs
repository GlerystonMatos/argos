using System.Text;

namespace Argos.Nucleo.Configuracao;

public static class CarregadorUsuariosTogglIni
{
    private const string PrefixoSecaoUsuario = "Usuario:";

    public static List<ConfiguracaoUsuarioToggl> Carregar(string caminho) =>
        File.Exists(caminho) ? ExtrairUsuarios(AnalisadorIni.Analisar(caminho)) : new List<ConfiguracaoUsuarioToggl>();

    public static void Salvar(string caminho, List<ConfiguracaoUsuarioToggl> usuarios)
    {
        StringBuilder sb = new();

        foreach (ConfiguracaoUsuarioToggl usuario in usuarios)
        {
            sb.AppendLine($"[{PrefixoSecaoUsuario}{usuario.Chave}]");
            sb.AppendLine($"NomeExibicao={usuario.NomeExibicao}");
            sb.AppendLine($"TokenApi={CriptografiaToken.Criptografar(usuario.TokenApi)}");
            sb.AppendLine($"Sigla={usuario.Sigla}");
            sb.AppendLine($"Cor={usuario.Cor}");
            sb.AppendLine($"Selecionado={usuario.Selecionado}");
            sb.AppendLine($"Administrador={usuario.Administrador}");
            sb.AppendLine();
        }

        AnalisadorIni.Escrever(caminho, sb.ToString());
    }

    private static List<ConfiguracaoUsuarioToggl> ExtrairUsuarios(Dictionary<string, Dictionary<string, string>> secoes)
    {
        List<ConfiguracaoUsuarioToggl> usuarios = new();

        foreach ((string nomeSecao, Dictionary<string, string> valores) in secoes)
        {
            if (!nomeSecao.StartsWith(PrefixoSecaoUsuario, StringComparison.OrdinalIgnoreCase))
                continue;

            string chave = nomeSecao.Substring(PrefixoSecaoUsuario.Length);
            usuarios.Add(new ConfiguracaoUsuarioToggl
            {
                Chave = chave,
                NomeExibicao = AnalisadorIni.ObterOuPadrao(valores, "NomeExibicao", chave),
                TokenApi = CriptografiaToken.Descriptografar(AnalisadorIni.ObterOuPadrao(valores, "TokenApi", "")),
                Sigla = AnalisadorIni.ObterOuPadrao(valores, "Sigla", ""),
                Cor = AnalisadorIni.ObterOuPadrao(valores, "Cor", ""),
                Selecionado = bool.TryParse(AnalisadorIni.ObterOuPadrao(valores, "Selecionado", "True"), out bool selecionado) ? selecionado : true,
                Administrador = bool.TryParse(AnalisadorIni.ObterOuPadrao(valores, "Administrador", "False"), out bool administrador) && administrador
            });
        }

        return usuarios;
    }
}