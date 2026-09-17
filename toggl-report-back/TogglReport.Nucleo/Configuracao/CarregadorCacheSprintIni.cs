using RelatorioToggl.Toggl;
using System.Text;
using System.Text.Json;

namespace RelatorioToggl.Configuracao;

public static class CarregadorCacheSprintIni
{
    private const string PrefixoSprint = "Sprint:";

    private const string MarcadorUsuario = ":Usuario:";

    private static readonly JsonSerializerOptions OpcoesJson = new() { PropertyNameCaseInsensitive = true };

    public static CacheConsulta? Carregar(string caminho, string chaveSprint)
    {
        if (!File.Exists(caminho))
            return null;

        Dictionary<string, Dictionary<string, string>> secoes = AnalisadorIni.Analisar(caminho);

        string nomeSecaoPeriodo = $"{PrefixoSprint}{chaveSprint}";
        if (!secoes.TryGetValue(nomeSecaoPeriodo, out Dictionary<string, string>? periodo))
            return null;

        CacheConsulta cache = new()
        {
            DataInicio = AnalisadorIni.ObterOuPadrao(periodo, "DataInicio", ""),
            DataFim = AnalisadorIni.ObterOuPadrao(periodo, "DataFim", "")
        };

        string prefixoUsuarios = $"{PrefixoSprint}{chaveSprint}{MarcadorUsuario}";
        foreach ((string nomeSecao, Dictionary<string, string> valores) in secoes)
        {
            if (!nomeSecao.StartsWith(prefixoUsuarios, StringComparison.OrdinalIgnoreCase))
                continue;

            string chaveUsuario = nomeSecao.Substring(prefixoUsuarios.Length);
            cache.Usuarios.Add(new UsuarioTogglCacheado
            {
                Chave = chaveUsuario,
                NomeExibicao = AnalisadorIni.ObterOuPadrao(valores, "NomeExibicao", chaveUsuario),
                TokenApi = CriptografiaToken.Descriptografar(AnalisadorIni.ObterOuPadrao(valores, "TokenApi", "")),
                Registros = DesserializarRegistros(AnalisadorIni.ObterOuPadrao(valores, "Registros", "[]"))
            });
        }

        return cache;
    }

    public static CacheConsulta? CarregarSeExistente(string caminho, string chaveSprint)
    {
        try
        {
            return Carregar(caminho, chaveSprint);
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            return null;
        }
    }

    public static void Salvar(string caminho, string chaveSprint, CacheConsulta cache)
    {
        Dictionary<string, Dictionary<string, string>> secoes = File.Exists(caminho)
            ? AnalisadorIni.Analisar(caminho)
            : new Dictionary<string, Dictionary<string, string>>(StringComparer.OrdinalIgnoreCase);

        string prefixoSprintCompleto = $"{PrefixoSprint}{chaveSprint}";
        string prefixoUsuarios = $"{prefixoSprintCompleto}{MarcadorUsuario}";

        List<string> secoesParaRemover = secoes.Keys
            .Where(nome => nome.Equals(prefixoSprintCompleto, StringComparison.OrdinalIgnoreCase)
                || nome.StartsWith(prefixoUsuarios, StringComparison.OrdinalIgnoreCase))
            .ToList();
        foreach (string nome in secoesParaRemover)
            secoes.Remove(nome);

        StringBuilder sb = new();

        foreach ((string nomeSecao, Dictionary<string, string> valores) in secoes)
        {
            sb.AppendLine($"[{nomeSecao}]");
            foreach ((string chave, string valor) in valores)
                sb.AppendLine($"{chave}={valor}");
            sb.AppendLine();
        }

        sb.AppendLine($"[{prefixoSprintCompleto}]");
        sb.AppendLine($"DataInicio={cache.DataInicio}");
        sb.AppendLine($"DataFim={cache.DataFim}");
        sb.AppendLine();

        foreach (UsuarioTogglCacheado usuario in cache.Usuarios)
        {
            sb.AppendLine($"[{prefixoUsuarios}{usuario.Chave}]");
            sb.AppendLine($"NomeExibicao={usuario.NomeExibicao}");
            sb.AppendLine($"TokenApi={CriptografiaToken.Criptografar(usuario.TokenApi)}");
            sb.AppendLine($"Registros={JsonSerializer.Serialize(usuario.Registros, OpcoesJson)}");
            sb.AppendLine();
        }

        AnalisadorIni.Escrever(caminho, sb.ToString());
    }

    public static void SalvarSeConseguir(string caminho, string chaveSprint, CacheConsulta cache)
    {
        try
        {
            Salvar(caminho, chaveSprint, cache);
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
        }
    }

    private static List<RegistroTempoDto> DesserializarRegistros(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<List<RegistroTempoDto>>(json, OpcoesJson) ?? new List<RegistroTempoDto>();
        }
        catch (JsonException)
        {
            return new List<RegistroTempoDto>();
        }
    }
}