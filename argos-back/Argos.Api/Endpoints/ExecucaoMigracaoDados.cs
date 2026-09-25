using Argos.Nucleo.Configuracao;

namespace Argos.Api.Endpoints;

public static class ExecucaoMigracaoDados
{
    public static void Executar(ILogger logger, CaminhosDados caminhos)
    {
        try
        {
            List<string> acoes = MigracaoDados.Executar(caminhos);
            foreach (string acao in acoes)
                logger.LogInformation("Migração de dados: {Acao}", acao);
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            logger.LogError(ex, "Falha na migração de dados; a API segue com os documentos como estão.");
        }
    }
}