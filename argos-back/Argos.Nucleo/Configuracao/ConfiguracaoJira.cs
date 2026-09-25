namespace Argos.Nucleo.Configuracao;

public class ConfiguracaoJira
{
    public string UrlDominio { get; set; } = "";

    public string Email { get; set; } = "";

    public string ApiToken { get; set; } = "";

    public long? QuadroDevId { get; set; }

    public string QuadroDevNome { get; set; } = "";

    public long? QuadroAnaliseId { get; set; }

    public string QuadroAnaliseNome { get; set; } = "";

    public string CampoEstimativaDesenvolvimentoId { get; set; } = "";

    public string CampoEstimativaDesenvolvimentoNome { get; set; } = "";

    public string CampoEstimativaRevisaoId { get; set; } = "";

    public string CampoEstimativaRevisaoNome { get; set; } = "";

    public string CampoEstimativaTestesId { get; set; } = "";

    public string CampoEstimativaTestesNome { get; set; } = "";

    public string CampoRevisadoPorId { get; set; } = "";

    public string CampoRevisadoPorNome { get; set; } = "";

    public string CampoAnalisadoPorId { get; set; } = "";

    public string CampoAnalisadoPorNome { get; set; } = "";

    public string CampoTimeId { get; set; } = "";

    public string CampoTimeNome { get; set; } = "";

    public string CampoPrevisaoLiberacaoId { get; set; } = "";

    public string CampoPrevisaoLiberacaoNome { get; set; } = "";

    public int JanelaAlertaPrevisaoLiberacaoDias { get; set; } = 5;

    public long? QuadroId(TipoQuadroJira quadro) => quadro == TipoQuadroJira.Dev ? QuadroDevId : QuadroAnaliseId;

    public string QuadroNome(TipoQuadroJira quadro) => quadro == TipoQuadroJira.Dev ? QuadroDevNome : QuadroAnaliseNome;
}