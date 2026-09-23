using System.Text.Json;
using System.Text.Json.Serialization;

namespace Argos.Nucleo.Jira;

internal sealed class CamposIssueBrutaJira
{
    public string? Summary { get; set; }

    public NomeObjetoJiraBruto? Priority { get; set; }

    public StatusBrutoJira? Status { get; set; }

    public PaiIssueBrutoJira? Parent { get; set; }

    [JsonExtensionData]
    public Dictionary<string, JsonElement>? CamposExtras { get; set; }
}