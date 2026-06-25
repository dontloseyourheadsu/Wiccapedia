namespace WiccapediaContracts.Templates.Requests;

public record UpdatePageTemplateRequest(
    string Name,
    string? Description,
    string Markdown,
    string? Css,
    string? BackgroundType,
    string? BackgroundValue,
    string? Group,
    bool IsShared);
