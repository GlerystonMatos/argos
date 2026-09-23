using System.Text.Json.Serialization;

namespace Argos.Nucleo.Toggl;

internal sealed record EuBrutoToggl(
    [property: JsonPropertyName("default_workspace_id")] long? DefaultWorkspaceId);