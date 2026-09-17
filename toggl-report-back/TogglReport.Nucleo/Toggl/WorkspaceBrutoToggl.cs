using System.Text.Json.Serialization;

namespace RelatorioToggl.Toggl;

internal sealed record WorkspaceBrutoToggl(
    [property: JsonPropertyName("id")] long Id);