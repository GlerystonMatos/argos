using System.Text.Json.Serialization;

namespace RelatorioToggl.Toggl;

internal sealed record EuBrutoToggl(
    [property: JsonPropertyName("default_workspace_id")] long? DefaultWorkspaceId);