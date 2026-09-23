using System.Text.Json.Serialization;

namespace Argos.Nucleo.Toggl;

internal sealed record WorkspaceBrutoToggl(
    [property: JsonPropertyName("id")] long Id);