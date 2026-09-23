namespace Argos.Nucleo.Configuracao;

public static class ServicoSprints
{
    public static bool NomeEmUso(List<DadosSprint> sprints, string nome, DadosSprint? ignorar)
        => sprints.Any(s => s != ignorar && s.Nome.Equals(nome, StringComparison.OrdinalIgnoreCase));

    public static string GerarChaveUnica(string nome, List<DadosSprint> sprintsExistentes)
        => ServicoChaves.GerarChaveUnica(nome, sprintsExistentes.Select(s => s.Chave), "sprint");
}