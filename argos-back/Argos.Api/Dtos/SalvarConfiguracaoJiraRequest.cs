namespace Argos.Api.Dtos;

public record SalvarConfiguracaoJiraRequest(
    string UrlDominio,
    string Email,
    string? ApiToken,
    long? QuadroId,
    string? QuadroNome,
    string CampoEstimativaDesenvolvimentoId,
    string CampoEstimativaDesenvolvimentoNome,
    string CampoRevisadoPorId,
    string CampoRevisadoPorNome,
    string CampoAnalisadoPorId,
    string CampoAnalisadoPorNome,
    string CampoEstimativaRevisaoId,
    string CampoEstimativaRevisaoNome,
    string CampoEstimativaTestesId,
    string CampoEstimativaTestesNome,
    string CampoTimeId,
    string CampoTimeNome,
    string CampoPrevisaoLiberacaoId,
    string CampoPrevisaoLiberacaoNome,
    int? JanelaAlertaPrevisaoLiberacaoDias);