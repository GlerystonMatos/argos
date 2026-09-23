using Argos.Nucleo.Toggl;
using System.Text.Json;

namespace Argos.Nucleo.Configuracao;

public static class CarregadorCacheSprintIni
{
    private const string SecaoSprint = "Sprint";

    private const string PrefixoSecaoUsuario = "Usuario:";

    private static readonly JsonSerializerOptions OpcoesJson = new() { PropertyNameCaseInsensitive = true };

    public static CacheConsulta? Carregar(string caminho)
    {
        if (!File.Exists(caminho))
            return null;

        Dictionary<string, Dictionary<string, string>> secoes = AnalisadorIni.Analisar(caminho);
        if (!secoes.TryGetValue(SecaoSprint, out Dictionary<string, string>? sprint))
            return null;

        CacheConsulta cache = new()
        {
            DataInicio = AnalisadorIni.ObterOuPadrao(sprint, "DataInicio", ""),
            DataFim = AnalisadorIni.ObterOuPadrao(sprint, "DataFim", "")
        };

        foreach ((string nomeSecao, Dictionary<string, string> valores) in secoes)
        {
            if (!nomeSecao.StartsWith(PrefixoSecaoUsuario, StringComparison.OrdinalIgnoreCase))
                continue;

            string chaveUsuario = nomeSecao.Substring(PrefixoSecaoUsuario.Length);
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

    public static CacheConsulta? CarregarSeExistente(string caminho)
    {
        try
        {
            return Carregar(caminho);
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            return null;
        }
    }

    public static void Salvar(string caminho, CacheConsulta cache)
    {
        Dictionary<string, Dictionary<string, string>> secoes = new(StringComparer.OrdinalIgnoreCase)
        {
            [SecaoSprint] = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["DataInicio"] = cache.DataInicio,
                ["DataFim"] = cache.DataFim
            }
        };

        foreach (UsuarioTogglCacheado usuario in cache.Usuarios)
        {
            secoes[$"{PrefixoSecaoUsuario}{usuario.Chave}"] = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["NomeExibicao"] = usuario.NomeExibicao,
                ["TokenApi"] = CriptografiaToken.Criptografar(usuario.TokenApi),
                ["Registros"] = JsonSerializer.Serialize(usuario.Registros, OpcoesJson)
            };
        }

        AnalisadorIni.EscreverSecoes(caminho, secoes);
    }

    public static void SalvarSeConseguir(string caminho, CacheConsulta cache)
    {
        try
        {
            Salvar(caminho, cache);
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